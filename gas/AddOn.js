/**
 * Auto-Gifter Google Workspace Add-on (Google Apps Script)
 *
 * Plugs directly into Google Calendar (desktop and mobile web/app).
 * On calendar event open trigger, renders CardService contextual UI:
 * - Shows detected celebration status (type, celebrant, confidence)
 * - Offers 1-click Calendar Enrichment adding Top 5 FloristOne bestsellers & 7d/3d reminders
 * - Shows Top 5 FloristOne flower bouquets with direct cart links
 * - Shows Gift Brand chips ($15, $25, $50, $100)
 * - Renders personalized greeting with 1-tap WhatsApp and Email deep-links
 * - Logs sent gifts to Google Sheet (CelebrationLog)
 */

/* global CardService, CalendarApp, PropertiesService, SpreadsheetApp */

var _core = (typeof AutoGifterCore !== 'undefined')
  ? AutoGifterCore
  : (typeof require !== 'undefined' ? require('./CoreEngine') : null);

var _obs = (typeof Observability !== 'undefined')
  ? Observability
  : (typeof require !== 'undefined' ? (function() {
      try { return require('./Observability'); } catch (_) { return null; }
    })() : null);

/**
 * Helper to reliably resolve a CalendarEvent or CalendarEventSeries across ID formats.
 *
 * @param {GoogleAppsScript.Calendar.Calendar} cal
 * @param {string} eventId
 * @return {GoogleAppsScript.Calendar.CalendarEvent | GoogleAppsScript.Calendar.CalendarEventSeries | null}
 */
function findCalendarEvent(cal, eventId) {
  if (!eventId) return null;
  var event = null;

  var calsToTry = [];
  if (cal) calsToTry.push(cal);
  if (typeof CalendarApp !== 'undefined') {
    var def = CalendarApp.getDefaultCalendar();
    if (def && calsToTry.indexOf(def) === -1) calsToTry.push(def);
    try {
      if (typeof CalendarApp.getAllCalendars === 'function') {
        var allCals = CalendarApp.getAllCalendars() || [];
        for (var a = 0; a < allCals.length; a++) {
          if (allCals[a] && calsToTry.indexOf(allCals[a]) === -1) {
            calsToTry.push(allCals[a]);
          }
        }
      }
    } catch (_) {}
  }

  // Clean and prepare variations of the ID
  var idsToTry = [eventId];
  if (eventId.indexOf('@google.com') === -1) {
    idsToTry.push(eventId + '@google.com');
  } else {
    idsToTry.push(eventId.replace(/@google\.com$/, ''));
  }

  // If recurring instance ID (e.g. contains recurrence timestamp or underscore), try base ID
  if (eventId.indexOf('_') !== -1) {
    var baseId = eventId.split('_')[0];
    idsToTry.push(baseId);
    if (baseId.indexOf('@google.com') === -1) {
      idsToTry.push(baseId + '@google.com');
    }
  }

  for (var i = 0; i < calsToTry.length; i++) {
    var c = calsToTry[i];
    if (!c) continue;

    for (var j = 0; j < idsToTry.length; j++) {
      var candidateId = idsToTry[j];

      // 1. Direct getEventById
      try {
        event = c.getEventById(candidateId);
        if (event) {
          console.log('[Auto-Gifter] Found event by ID: ' + candidateId);
          return event;
        }
      } catch (err) {
        console.log('[Auto-Gifter] getEventById note: ' + err);
      }

      // 2. Try getEventSeriesById
      try {
        if (typeof c.getEventSeriesById === 'function') {
          var series = c.getEventSeriesById(candidateId);
          if (series) {
            console.log('[Auto-Gifter] Found event series by ID: ' + candidateId);
            return series;
          }
        }
      } catch (err) {
        console.log('[Auto-Gifter] getEventSeriesById note: ' + err);
      }
    }
  }

  console.log('[Auto-Gifter] Warning: Could not resolve event with ID: ' + eventId);
  return null;
}

/**
 * Helper to get user-configured reminder days from persistent PropertiesService.
 */
function getUserReminderSettings() {
  try {
    if (typeof PropertiesService !== 'undefined' && PropertiesService.getUserProperties) {
      var val = PropertiesService.getUserProperties().getProperty('autogifter_reminders');
      if (val) {
        var parsed = JSON.parse(val);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch (_) {}
  return [7, 3];
}

/**
 * Helper to save user-configured reminder days to persistent PropertiesService.
 */
function saveUserReminderSettings(reminders) {
  try {
    if (typeof PropertiesService !== 'undefined' && PropertiesService.getUserProperties) {
      PropertiesService.getUserProperties().setProperty('autogifter_reminders', JSON.stringify(reminders));
    }
  } catch (_) {}
}

/**
 * Calculates reminder minutes before an event so alerts trigger at 11:00 AM local time.
 */
function getReminderMinutesFor11Am(event, days) {
  var d = Number(days);
  if (isNaN(d) || d <= 0) d = 1;

  var isAllDay = (event && typeof event.isAllDayEvent === 'function') ? event.isAllDayEvent() : true;
  if (isAllDay) {
    // For all-day events starting at 00:00 midnight, 11:00 AM on d-days before is (d * 24 - 11) * 60 minutes
    return (d * 24 - 11) * 60;
  }

  if (event && typeof event.getStartTime === 'function') {
    try {
      var st = event.getStartTime();
      if (st && typeof st.getHours === 'function') {
        var eventHour = st.getHours();
        var eventMin = st.getMinutes();
        var totalMinutes = (d * 24 * 60) + (eventHour * 60 + eventMin) - (11 * 60);
        if (totalMinutes > 0) return totalMinutes;
      }
    } catch (_) {}
  }

  return (d * 24 - 11) * 60;
}

/**
 * Helper to apply popup reminders for specified days before an event at 11:00 AM,
 * clearing out previous/stale reminders first.
 */
function applyPopupReminders(event, reminders) {
  if (!event || typeof event.addPopupReminder !== 'function') return;
  var list = Array.isArray(reminders) && reminders.length > 0 ? reminders : [7, 3];

  // Quick check: if reminders already match target minutes, avoid redundant slow API calls
  try {
    if (typeof event.getPopupReminders === 'function') {
      var currentMins = event.getPopupReminders() || [];
      var targetMins = list.map(function (d) { return getReminderMinutesFor11Am(event, d); });
      if (currentMins.length === targetMins.length) {
        var allMatch = true;
        for (var m = 0; m < targetMins.length; m++) {
          if (currentMins.indexOf(targetMins[m]) === -1) {
            allMatch = false;
            break;
          }
        }
        if (allMatch) return;
      }
    }
  } catch (_) {}

  // 1. Clear pre-existing/default reminders so only configured alerts apply
  try {
    if (typeof event.removeAllReminders === 'function') {
      event.removeAllReminders();
      console.log('[Auto-Gifter] Cleared pre-existing event reminders.');
    }
  } catch (err) {
    console.log('[Auto-Gifter] Note removing existing reminders: ' + err);
  }

  // 2. Schedule user's configured reminders at 11:00 AM
  for (var i = 0; i < list.length; i++) {
    var days = Number(list[i]);
    if (!isNaN(days) && days > 0) {
      var mins = getReminderMinutesFor11Am(event, days);
      try {
        event.addPopupReminder(mins);
        console.log('[Auto-Gifter] Scheduled ' + days + '-day 11:00 AM popup reminder (' + mins + ' min).');
      } catch (err) {
        console.log('[Auto-Gifter] Reminder note for ' + days + 'd: ' + err);
      }
    }
  }
}

/**
 * Helper to safely enrich event description and schedule reminders with rich logging.
 */
function enrichCalendarEvent(event, cal, calendarId, eventId, classification, existingNotes, core, customReminders) {
  if (!event || !classification || !core) return false;
  var success = false;

  var recipientName = classification.recipientName || 'Friend';
  var celebrationType = classification.celebrationType || 'birthday';
  var occasionCategory = classification.occasionCategory || celebrationType;
  var reminderDays = (Array.isArray(customReminders) && customReminders.length > 0)
    ? customReminders
    : getUserReminderSettings();

  // Check if calendar is a read-only system calendar (e.g. Google Contacts Birthdays / Holidays)
  var isReadOnly = false;
  try {
    if (cal && typeof cal.isOwnedByMe === 'function') {
      isReadOnly = !cal.isOwnedByMe();
    }
    var cId = (calendarId || (cal && cal.getId ? cal.getId() : '')).toLowerCase();
    if (cId.indexOf('contacts') !== -1 || cId.indexOf('group.v.calendar.google.com') !== -1 || cId.indexOf('holiday') !== -1) {
      isReadOnly = true;
    }
  } catch (_) {}

  // 1. Build rich description with Top 5 FloristOne bouquets & browse all link
  var enrichedDescription = core.buildEnrichedEventDescription({
    recipientName: recipientName,
    celebrationType: celebrationType,
    occasionCategory: occasionCategory,
    existingNotes: existingNotes,
    reminders: reminderDays
  });

  if (!isReadOnly) {
    // 2. Set reminders (clearing out old ones first) on owned editable event
    applyPopupReminders(event, reminderDays);

    // 3. Update description on event instance
    try {
      if (typeof event.setDescription === 'function') {
        event.setDescription(enrichedDescription);
        console.log('[Auto-Gifter] event.setDescription() applied successfully on owned event! (length: ' + enrichedDescription.length + ' chars)');
        success = true;
      }
    } catch (err) {
      console.log('[Auto-Gifter] Note updating event directly: ' + err);
    }

    // 4. Update recurring series if applicable
    try {
      if (typeof event.isRecurringEvent === 'function' && event.isRecurringEvent() && typeof event.getEventSeries === 'function') {
        var series = event.getEventSeries();
        if (series && typeof series.setDescription === 'function') {
          series.setDescription(enrichedDescription);
          console.log('[Auto-Gifter] Recurring series description updated.');
          success = true;
        }
      }
    } catch (err) {
      console.log('[Auto-Gifter] Recurring series note: ' + err);
    }
  } else {
    console.log('[Auto-Gifter] Read-only system event detected ("' + (event.getTitle ? event.getTitle() : recipientName) + '"). Bridging to primary editable celebration...');
  }

  // 5. If event is read-only (Google Contacts Birthdays / Observances / Subscribed Calendars) or direct update failed,
  // automatically create / update an editable companion celebration event on the user's primary calendar so they get popup alerts & gift links!
  if (!success && typeof CalendarApp !== 'undefined') {
    try {
      var primaryCal = CalendarApp.getDefaultCalendar();
      if (primaryCal) {
        var startTime = (typeof event.getAllDayStartDate === 'function')
          ? event.getAllDayStartDate()
          : (typeof event.getStartTime === 'function' ? event.getStartTime() : new Date());
        var isAllDay = typeof event.isAllDayEvent === 'function' ? event.isAllDayEvent() : true;

        var celebrationType = classification.celebrationType || 'birthday';
        var celebrationEmoji = (core && typeof core.getCelebrationEmoji === 'function')
          ? core.getCelebrationEmoji(celebrationType)
          : '🎂';

        var rawTitle = event.getTitle ? event.getTitle().trim() : '';
        var celebrantTitle;
        if (rawTitle && (/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(rawTitle))) {
          celebrantTitle = rawTitle;
        } else if (celebrationType === 'birthday' && classification.recipientName) {
          celebrantTitle = celebrationEmoji + " " + classification.recipientName;
        } else if (rawTitle) {
          celebrantTitle = celebrationEmoji + " " + rawTitle;
        } else {
          celebrantTitle = celebrationEmoji + " " + (classification.recipientName || "Celebration");
        }

        // To prevent timezone offset shifts (e.g. UTC-5 placing UTC 00:00 events on the previous day),
        // we use noon (12:00:00) so the date is invariant across all world timezones.
        var eventYear, eventMonth, eventDay;
        if (startTime) {
          eventYear = startTime.getFullYear();
          eventMonth = startTime.getMonth();
          eventDay = startTime.getDate();
        } else {
          var nowD = new Date();
          eventYear = nowD.getFullYear();
          eventMonth = nowD.getMonth();
          eventDay = nowD.getDate();
        }

        var middayDate = new Date(eventYear, eventMonth, eventDay, 12, 0, 0);
        var searchStart = new Date(eventYear, eventMonth, eventDay, 0, 0, 0);
        var searchEnd = new Date(eventYear, eventMonth, eventDay, 23, 59, 59);
        var existingPrimaryEvents = primaryCal.getEvents(searchStart, searchEnd) || [];
        var targetEvent = null;

        var searchName = (classification.recipientName || '').toLowerCase();
        var cleanTitleWithoutEmoji = rawTitle.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\s]+/u, '').toLowerCase();

        for (var k = 0; k < existingPrimaryEvents.length; k++) {
          var pe = existingPrimaryEvents[k];
          var pTitle = (pe.getTitle ? pe.getTitle() : '').toLowerCase();
          var pDesc = (pe.getDescription ? pe.getDescription() : '');
          if (pe.getId() !== event.getId()) {
            if ((searchName && pTitle.indexOf(searchName) !== -1) ||
                (cleanTitleWithoutEmoji && pTitle.indexOf(cleanTitleWithoutEmoji) !== -1) ||
                (pDesc.indexOf('FloristOne') !== -1 && (searchName && pDesc.indexOf(searchName) !== -1 || cleanTitleWithoutEmoji && pTitle.indexOf(cleanTitleWithoutEmoji) !== -1))) {
              targetEvent = pe;
              break;
            }
          }
        }

        if (targetEvent) {
          applyPopupReminders(targetEvent, reminderDays);
          targetEvent.setDescription(enrichedDescription);
          console.log('[Auto-Gifter] Enriched existing editable celebration event on primary calendar for ' + (classification.recipientName || rawTitle));
          success = true;
        } else {
          var created;
          if (isAllDay) {
            created = primaryCal.createAllDayEvent(celebrantTitle, middayDate, {
              description: enrichedDescription
            });
          } else {
            var endTime = typeof event.getEndTime === 'function' ? event.getEndTime() : new Date(startTime.getTime() + 3600000);
            created = primaryCal.createEvent(celebrantTitle, startTime, endTime, {
              description: enrichedDescription
            });
          }
          if (created) {
            applyPopupReminders(created, reminderDays);
            console.log('[Auto-Gifter] Created new enriched celebration on primary calendar with ' + reminderDays.join(',') + 'd reminders for ' + (classification.recipientName || rawTitle));
            success = true;
          }
        }
      }
    } catch (bridgeErr) {
      console.log('[Auto-Gifter] Primary calendar bridge note: ' + bridgeErr);
    }
  }

  return success;
}

/**
 * Trigger function invoked when a user opens an event in Google Calendar.
 *
 * @param {Object} e Contextual trigger event object from Google Workspace
 * @return {CardService.Card}
 */
function onCalendarEventOpen(e) {
  console.log('[Auto-Gifter] === onCalendarEventOpen triggered ===');
  var start = new Date().getTime();
  try {
    var calendarId = (e && e.calendar && e.calendar.calendarId) || (e && e.calendarId) || 'primary';
    var eventId = (e && e.calendar && (e.calendar.id || e.calendar.eventId)) || (e && e.eventId) || (e && e.parameters && e.parameters.eventId);
    if (calendarId === eventId) {
      calendarId = 'primary';
    }

    console.log('[Auto-Gifter] calendarId: ' + calendarId + ', eventId: ' + eventId);

    if (!eventId) {
      console.log('[Auto-Gifter] No event ID provided in trigger object.');
      return buildEmptyCard("No calendar event selected.");
    }

    var cal = null;
    if (typeof CalendarApp !== 'undefined') {
      try {
        cal = CalendarApp.getCalendarById(calendarId);
      } catch (_) {
        cal = null;
      }
      if (!cal) {
        cal = CalendarApp.getDefaultCalendar();
      }
    }

    var event = findCalendarEvent(cal, eventId);
    if (!event) {
      console.log('[Auto-Gifter] Event could not be loaded for ID: ' + eventId);
      return buildEmptyCard("Calendar event could not be found or loaded.");
    }

    var title = event.getTitle ? event.getTitle() : '';
    var notes = event.getDescription ? event.getDescription() : '';

    console.log('[Auto-Gifter] Loaded Event: "' + title + '", Notes length: ' + notes.length);

    var core = _core || (typeof AutoGifterCore !== 'undefined' ? AutoGifterCore : null);
    if (!core) {
      console.log('[Auto-Gifter] Error: CoreEngine is not loaded.');
      if (_obs) _obs.log('ERROR', 'AddOn:onCalendarEventOpen', 'CoreEngine is not loaded.');
      return buildEmptyCard("Auto-Gifter Core Engine is not loaded.");
    }

    var classification = core.classifyEvent(title, notes);
    console.log('[Auto-Gifter] Classification: isCelebration=' + classification.isCelebration + ', celebrant=' + classification.recipientName + ', type=' + classification.celebrationType);

    var card;
    if (classification.isCelebration) {
      // Automatically enrich calendar event with reminders and Top 5 FloristOne bouquets
      enrichCalendarEvent(event, cal, calendarId, eventId, classification, notes, core);
      card = buildCelebrationCard(event, classification, core, calendarId, eventId);
    } else {
      card = buildNonCelebrationCard(event, classification);
    }

    var duration = new Date().getTime() - start;
    if (duration > 1500 && _obs) {
      _obs.log('WARN', 'AddOn:onCalendarEventOpen', 'Slow card render (' + duration + 'ms)', { durationMs: duration });
    }

    return card;
  } catch (err) {
    console.log('[Auto-Gifter] Exception in onCalendarEventOpen: ' + err);
    if (_obs) {
      _obs.log('ERROR', 'AddOn:onCalendarEventOpen', (err && err.message) || String(err), { durationMs: new Date().getTime() - start }, err);
    }
    return buildEmptyCard("Auto-Gifter: " + (err && err.message ? err.message : String(err)));
  }
}

/**
 * Helper to build consistent Yearly card headers with the brand logo.
 *
 * @param {string} title
 * @param {string} subtitle
 * @return {CardService.CardHeader}
 */
function buildCardHeader(title, subtitle) {
  var header = CardService.newCardHeader()
    .setTitle(title)
    .setSubtitle(subtitle)
    .setImageUrl("https://yearly.click/assets/icon-128.png");
  if (typeof CardService !== 'undefined' && CardService.ImageStyle && CardService.ImageStyle.CIRCLE && typeof header.setImageStyle === 'function') {
    header.setImageStyle(CardService.ImageStyle.CIRCLE);
  }
  return header;
}

/**
 * Trigger function for Google Calendar homepage trigger.
 *
 * @param {Object} e
 * @return {CardService.Card}
 */
function onCalendarHomepage(e) {
  try {
    var card = CardService.newCardBuilder()
      .setHeader(buildCardHeader("Yearly 🌸", "Calendar Gifting Assistant"));

    var section = CardService.newCardSection()
      .setHeader("Ready to Celebrate");

    section.addWidget(CardService.newDecoratedText()
      .setText("<b>Sync & Enrich Celebrations</b>")
      .setBottomLabel("Automatically find birthdays, anniversaries, and holidays in your calendar, schedule reminders, and add FloristOne flower purchase links.")
      .setWrapText(true));

    var syncBtn = CardService.newTextButton()
      .setText("⚡ Sync All Celebrations")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
        .setFunctionName("onSyncAllCelebrations"));

    section.addWidget(CardService.newButtonSet().addButton(syncBtn));

    var infoSection = CardService.newCardSection()
      .setHeader("Single Event View");

    infoSection.addWidget(CardService.newDecoratedText()
      .setText("Select any calendar event")
      .setBottomLabel("Open any event in Google Calendar to view bouquets or re-enrich reminders automatically.")
      .setWrapText(true));

    card.addSection(section);
    card.addSection(infoSection);

    try {
      var settingsSec = createReminderSettingsSection();
      if (settingsSec) {
        card.addSection(settingsSec);
      }
    } catch (sErr) {
      console.log('[Auto-Gifter] Note adding settings section: ' + sErr);
    }

    try {
      var disclosureSec = createAffiliateDisclosureSection();
      if (disclosureSec) {
        card.addSection(disclosureSec);
      }
    } catch (dErr) {
      console.log('[Auto-Gifter] Note adding disclosure section: ' + dErr);
    }

    return card.build();
  } catch (err) {
    console.log('[Auto-Gifter] Error in onCalendarHomepage: ' + err);
    if (_obs) {
      _obs.log('ERROR', 'AddOn:onCalendarHomepage', (err && err.message) || String(err), {}, err);
    }
    var fallbackCard = CardService.newCardBuilder()
      .setHeader(buildCardHeader("Yearly 🌸", "Calendar Assistant"));
    var fallbackSec = CardService.newCardSection();
    fallbackSec.addWidget(CardService.newDecoratedText()
      .setText("Yearly is ready!")
      .setBottomLabel("Select any event in Google Calendar to view gift recommendations."));
    fallbackCard.addSection(fallbackSec);
    return fallbackCard.build();
  }
}

/**
 * Creates a reusable CardSection for reminder notification preferences in the sidebar.
 */
function createReminderSettingsSection(currentReminders) {
  try {
    var reminders = (Array.isArray(currentReminders) && currentReminders.length > 0)
      ? currentReminders
      : getUserReminderSettings();

    var settingsSection = CardService.newCardSection()
      .setHeader("⚙️ Reminder Notification Settings");

    var selectionInput = CardService.newSelectionInput()
      .setFieldName("reminders");

    var type = (typeof CardService !== 'undefined' && CardService.SelectionInputType && (CardService.SelectionInputType.CHECK_BOX || CardService.SelectionInputType.CHECKBOX));
    if (type && typeof selectionInput.setType === 'function') {
      selectionInput.setType(type);
    }
    if (typeof selectionInput.setTitle === 'function') {
      selectionInput.setTitle("Choose Alert Times Before Celebrations");
    }

    selectionInput.addItem("14 Days Before (Advance Planning)", "14", reminders.indexOf(14) !== -1);
    selectionInput.addItem("7 Days Before (Recommended)", "7", reminders.indexOf(7) !== -1);
    selectionInput.addItem("3 Days Before (Last Chance Order)", "3", reminders.indexOf(3) !== -1);
    selectionInput.addItem("1 Day Before (Urgent Reminder)", "1", reminders.indexOf(1) !== -1);

    settingsSection.addWidget(selectionInput);

    var saveBtn = CardService.newTextButton()
      .setText("💾 Save Reminder Settings")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
        .setFunctionName("onSaveAddonSettings"));

    settingsSection.addWidget(CardService.newButtonSet().addButton(saveBtn));
    return settingsSection;
  } catch (err) {
    console.log('[Auto-Gifter] Error building reminder section: ' + err);
    return null;
  }
}

/**
 * Creates a CardSection for Google Chat Webhook and System Health diagnostics.
 */
function createHealthAndAlertSettingsSection() {
  try {
    var obs = _obs || (typeof Observability !== 'undefined' ? Observability : null);
    var currentUrl = (obs && typeof obs.getWebhookUrl === 'function') ? (obs.getWebhookUrl() || '') : '';

    var healthSection = CardService.newCardSection()
      .setHeader("🚨 Health & Google Chat Alerts");

    var webhookInput = CardService.newTextInput()
      .setFieldName("gchat_webhook")
      .setTitle("Google Chat Webhook URL")
      .setHint("Paste webhook URL to receive instant ERROR/CRITICAL alerts in Google Chat");

    if (currentUrl) {
      webhookInput.setValue(currentUrl);
    }

    healthSection.addWidget(webhookInput);

    var btnSet = CardService.newButtonSet()
      .addButton(CardService.newTextButton()
        .setText("💾 Save & Test Alert")
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setOnClickAction(CardService.newAction().setFunctionName("onSaveAndTestChatWebhook")))
      .addButton(CardService.newTextButton()
        .setText("📋 View Health Logs")
        .setOnClickAction(CardService.newAction().setFunctionName("onViewHealthLogsCard")));

    healthSection.addWidget(btnSet);
    return healthSection;
  } catch (err) {
    console.log('[Auto-Gifter] Note building health section: ' + err);
    return null;
  }
}

/**
 * Creates a compliant affiliate & partner disclosure section for add-on cards.
 */
function createAffiliateDisclosureSection() {
  try {
    var sec = CardService.newCardSection()
      .setHeader("ℹ️ Partner & Affiliate Disclosure");
    sec.addWidget(CardService.newDecoratedText()
      .setText("<b>Yearly is free &amp; reader-supported</b>")
      .setBottomLabel("When you order bouquets or gifts through our curated links, we may receive an affiliate commission from our partner (FloristOne) at no additional cost to you.")
      .setWrapText(true));
    return sec;
  } catch (err) {
    console.log('[Auto-Gifter] Note building disclosure section: ' + err);
    return null;
  }
}

/**
 * Action callback to save webhook URL and send a test message to Google Chat.
 */
function onSaveAndTestChatWebhook(e) {
  var formInputs = (e && e.formInputs) || (e && e.formInput) || {};
  var rawUrl = formInputs.gchat_webhook || '';
  var webhookUrl = Array.isArray(rawUrl) ? (rawUrl[0] || '') : rawUrl;

  var obs = _obs || (typeof Observability !== 'undefined' ? Observability : null);
  if (!obs) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("Observability module unavailable."))
      .build();
  }

  obs.setWebhookUrl(webhookUrl);

  if (!webhookUrl || !webhookUrl.trim()) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("Cleared Google Chat Webhook URL."))
      .build();
  }

  var testResult = obs.sendTestAlert(webhookUrl);
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText(testResult.message))
    .build();
}

/**
 * Action callback to view recent system health and trace logs in CardService.
 */
function onViewHealthLogsCard(e) {
  var sheets = typeof getHealthLogs === 'function' ? { getHealthLogs: getHealthLogs } : null;
  if (!sheets && typeof require !== 'undefined') {
    try {
      sheets = require('./SheetsLogger');
    } catch (_) {}
  }

  var logs = (sheets && typeof sheets.getHealthLogs === 'function') ? sheets.getHealthLogs(10) : [];

  var card = CardService.newCardBuilder()
    .setHeader(buildCardHeader("Yearly 📊", "System Health & Diagnostic Logs"));

  var section = CardService.newCardSection()
    .setHeader("Recent Activity (Last 10 Logs)");

  if (logs.length === 0) {
    section.addWidget(CardService.newDecoratedText()
      .setText("No log records found.")
      .setBottomLabel("Run calendar sync or enrichment to generate telemetry entries."));
  } else {
    for (var i = 0; i < logs.length; i++) {
      var l = logs[i];
      var emoji = l.severity === 'CRITICAL' ? '🔴' : (l.severity === 'ERROR' ? '⚠️' : (l.severity === 'WARN' ? '🟡' : '🟢'));
      var dur = (l.durationMs !== undefined && l.durationMs !== '') ? ' (' + l.durationMs + 'ms)' : '';
      section.addWidget(CardService.newDecoratedText()
        .setTopLabel((l.timestamp ? String(l.timestamp).slice(0, 19).replace('T', ' ') : '') + ' • ' + (l.surface || 'gas'))
        .setText("<b>" + emoji + " [" + (l.severity || 'INFO') + "] " + (l.component || 'System') + "</b>" + dur)
        .setBottomLabel(l.message || 'No description')
        .setWrapText(true));
    }
  }

  card.addSection(section);
  return card.build();
}

/**
 * Action callback to save reminder settings from the sidebar.
 */
function onSaveAddonSettings(e) {
  var formInputs = (e && e.formInputs) || (e && e.formInput) || {};
  var rawSelected = formInputs.reminders || [];
  if (!Array.isArray(rawSelected)) {
    rawSelected = [rawSelected];
  }
  var numList = rawSelected.map(function (s) { return parseInt(s, 10); }).filter(function (n) { return !isNaN(n) && n > 0; });
  if (numList.length === 0) {
    numList = [7, 3];
  }
  saveUserReminderSettings(numList);
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText("✓ Settings saved: " + numList.join(", ") + " days before."))
    .build();
}

/**
 * Builds the celebration sidebar card when an event is detected.
 *
 * @param {Object} event Calendar event object
 * @param {Object} classification Classification result from AutoGifterCore
 * @param {Object} core AutoGifterCore instance
 * @param {string} [calendarId]
 * @param {string} [eventId]
 * @return {CardService.Card}
 */
function buildCelebrationCard(event, classification, core, calendarId, eventId, expandedItemId) {
  var recipientName = classification.recipientName || "Friend";
  var celebrationType = classification.celebrationType || "birthday";
  var occasionCategory = classification.occasionCategory || celebrationType;

  // Fetch Top 5 FloristOne Bestsellers
  var bestsellers = core.getBestsellers ? core.getBestsellers(occasionCategory, 5) : [];

  var card = CardService.newCardBuilder()
    .setHeader(buildCardHeader("Yearly 🌸", recipientName + "'s Celebration"));

  // --- SECTION 1: TOP FLORISTONE BOUQUETS ---
  if (bestsellers.length > 0) {
    var floristSection = CardService.newCardSection()
      .setHeader("🌸 Top 5 FloristOne Flower Bouquets");

    bestsellers.forEach(function (item, index) {
      // 1. Bouquet Image
      if (typeof CardService.newImage === 'function' && (item.detailImage || item.thumbnailImage)) {
        try {
          floristSection.addWidget(CardService.newImage()
            .setImageUrl(item.detailImage || item.thumbnailImage)
            .setAltText(item.name));
        } catch (_) {}
      }

      // 2. Full Title & Price
      var titleDecor = CardService.newDecoratedText()
        .setText("<b>" + (index + 1) + ". " + item.name + "</b>")
        .setBottomLabel("💰 Price: $" + item.price.toFixed(2))
        .setWrapText(true);
      floristSection.addWidget(titleDecor);

      // 3. Clean Description
      if (item.description) {
        var descPara = CardService.newTextParagraph()
          .setText(item.description);
        floristSection.addWidget(descPara);
      }

      // 4. 1-Click Order Button
      var httpsCartUrl = (item.cartUrl || "").replace(/^http:\/\//i, "https://");
      var orderBtnSet = CardService.newButtonSet()
        .addButton(CardService.newTextButton()
          .setText("🛒 Order on FloristOne ($" + item.price.toFixed(2) + ")")
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          .setOpenLink(CardService.newOpenLink()
            .setUrl(httpsCartUrl)
            .setOpenAs(CardService.OpenAs.FULL_SIZE)));

      floristSection.addWidget(orderBtnSet);
    });

    card.addSection(floristSection);

    // --- SECTION 2: BROWSE ALL GIFTS & BOUQUETS ---
    var browseUrl = (core && typeof core.getFloristOneBrowseUrl === 'function')
      ? core.getFloristOneBrowseUrl()
      : 'https://www.floristone.com/index.cfm?source_id=aff&affiliateid=2026097209';

    var moreOptionsSection = CardService.newCardSection()
      .setHeader("🎁 More Gifts & Flowers");

    moreOptionsSection.addWidget(CardService.newTextParagraph()
      .setText("Want to explore other flower arrangements, plants, or specialty gifts?"));

    moreOptionsSection.addWidget(CardService.newButtonSet()
      .addButton(CardService.newTextButton()
        .setText("💐 Browse All Flowers & Gifts on FloristOne")
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setOpenLink(CardService.newOpenLink()
          .setUrl(browseUrl)
          .setOpenAs(CardService.OpenAs.FULL_SIZE))));

    card.addSection(moreOptionsSection);
  }

  card.addSection(createReminderSettingsSection());
  var disclosureSection = createAffiliateDisclosureSection();
  if (disclosureSection) {
    card.addSection(disclosureSection);
  }
  return card.build();
}

/**
 * Action callback to enrich a calendar event with FloristOne Top 5 and set 7d + 3d reminders.
 */
function onEnrichCalendarEvent(e) {
  console.log('[Auto-Gifter] onEnrichCalendarEvent triggered with:', JSON.stringify(e));
  var params = (e && e.parameters) || {};
  var calendarId = params.calendarId || 'primary';
  var eventId = params.eventId;
  var recipientName = params.recipientName || "Friend";
  var celebrationType = params.celebrationType || "birthday";
  var occasionCategory = params.occasionCategory || celebrationType;

  if (!eventId) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("No event selected."))
      .build();
  }

  var cal = null;
  if (typeof CalendarApp !== 'undefined') {
    try {
      cal = CalendarApp.getCalendarById(calendarId);
    } catch (_) {
      cal = null;
    }
    if (!cal) {
      cal = CalendarApp.getDefaultCalendar();
    }
  }

  var event = findCalendarEvent(cal, eventId);
  if (!event) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("Event not found."))
      .build();
  }

  var core = _core || (typeof AutoGifterCore !== 'undefined' ? AutoGifterCore : null);
  if (!core) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("Core Engine not available."))
      .build();
  }

  var classification = {
    isCelebration: true,
    recipientName: recipientName,
    celebrationType: celebrationType,
    occasionCategory: occasionCategory
  };

  var existingNotes = event.getDescription ? event.getDescription() : '';
  enrichCalendarEvent(event, cal, calendarId, eventId, classification, existingNotes, core);

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification()
      .setText("✨ Enriched " + recipientName + "'s event with Top 5 Bouquets & 7d/3d reminders!"))
    .build();
}

/**
 * Builds non-celebration fallback card.
 *
 * @param {Object} event Calendar event object
 * @param {Object} classification Classification result from AutoGifterCore
 * @return {CardService.Card}
 */
function buildNonCelebrationCard(event, classification) {
  var title = event.getTitle ? event.getTitle() : "Event";
  var card = CardService.newCardBuilder()
    .setHeader(buildCardHeader("Yearly 🎁", "No Celebration Detected"));

  var section = CardService.newCardSection();
  section.addWidget(CardService.newDecoratedText()
    .setText(title)
    .setBottomLabel("This event was not identified as a birthday or anniversary celebration."));

  card.addSection(section);
  return card.build();
}

/**
 * Builds an informational/empty fallback card.
 *
 * @param {string} message
 * @return {CardService.Card}
 */
function buildEmptyCard(message) {
  var card = CardService.newCardBuilder()
    .setHeader(buildCardHeader("Yearly 🎁", "Assistant"));

  var section = CardService.newCardSection();
  section.addWidget(CardService.newDecoratedText()
    .setText("Notice")
    .setBottomLabel(message || "No event data available."));

  card.addSection(section);
  return card.build();
}

/**
 * CardService action callback to regenerate greeting with a new tone.
 */
function onRegenerateGreeting(e) {
  var params = (e && e.parameters) || {};
  var recipientName = params.recipientName || "Friend";
  var celebrationType = params.celebrationType || "birthday";
  var tones = ['warm', 'fun', 'formal'];
  var randomTone = tones[Math.floor(Math.random() * tones.length)];

  var core = _core || (typeof AutoGifterCore !== 'undefined' ? AutoGifterCore : null);
  var greeting = core ? core.generateGreeting({
    recipientName: recipientName,
    celebrationType: celebrationType,
    tone: randomTone
  }) : "Happy Celebration!";

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification()
      .setText("Generated " + randomTone + " greeting!"))
    .build();
}

/**
 * CardService action callback to manually mark a gift as sent in Google Sheets.
 */
function onManualMarkSent(e) {
  var params = (e && e.parameters) || {};
  var eventId = params.eventId;
  var recipientName = params.recipientName || "Friend";
  var celebrationType = params.celebrationType || "birthday";
  var eventDate = params.eventDate || new Date().toISOString().split('T')[0];
  var greeting = params.greeting || "";

  var logger = typeof logGiftSent === 'function' ? logGiftSent : null;
  if (!logger && typeof require !== 'undefined') {
    try {
      var sheetsModule = require('./SheetsLogger');
      logger = sheetsModule.logGiftSent;
    } catch (_) {}
  }

  if (logger) {
    logger({
      eventId: eventId,
      recipientName: recipientName,
      eventType: celebrationType,
      brandChosen: "FloristOne",
      amount: 79.95,
      date: eventDate,
      greetingUsed: greeting
    });
  }

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification()
      .setText("Saved to CelebrationLog Google Sheet!"))
    .build();
}

/**
 * Retrieves all relevant calendars to scan (primary, owned, contacts birthdays, holiday / observance calendars).
 * @return {GoogleAppsScript.Calendar.Calendar[]}
 */
function getCalendarsToScan() {
  var cals = [];
  var seenIds = {};
  if (typeof CalendarApp === 'undefined') return cals;

  try {
    var def = CalendarApp.getDefaultCalendar();
    if (def) {
      cals.push(def);
      var defId = (def.getId ? def.getId() : 'primary').toLowerCase();
      seenIds[defId] = true;
    }
  } catch (_) {}

  try {
    if (typeof CalendarApp.getAllCalendars === 'function') {
      var all = CalendarApp.getAllCalendars() || [];
      for (var k = 0; k < all.length; k++) {
        var aCal = all[k];
        if (!aCal) continue;
        var aId = (aCal.getId ? aCal.getId() : '').toLowerCase();
        if (aId && seenIds[aId]) continue;

        var cName = (aCal.getName ? aCal.getName() : '').toLowerCase();
        var isOwned = (typeof aCal.isOwnedByMe === 'function') ? aCal.isOwnedByMe() : false;
        var isHolidayOrObservance = aId.indexOf('holiday') !== -1 ||
                                    aId.indexOf('group.v.calendar.google.com') !== -1 ||
                                    cName.indexOf('holiday') !== -1 ||
                                    cName.indexOf('observance') !== -1 ||
                                    cName.indexOf('festivo') !== -1 ||
                                    cName.indexOf('feriado') !== -1 ||
                                    cName.indexOf('dia') !== -1;
        var isContacts = aId.indexOf('contacts') !== -1 || cName.indexOf('birthday') !== -1 || cName.indexOf('cumpleaño') !== -1;

        if (isOwned || isHolidayOrObservance || isContacts) {
          cals.push(aCal);
          if (aId) seenIds[aId] = true;
        }
      }
    }
  } catch (err) {
    console.log('[Auto-Gifter] Note fetching all calendars: ' + err);
  }

  return cals;
}

/**
 * CardService action callback to scan and enrich all upcoming celebration events in the user's calendar.
 *
 * @param {Object} e CardService event
 * @return {CardService.ActionResponse | CardService.Card}
 */
function onSyncAllCelebrations(e) {
  console.log('[Auto-Gifter] === onSyncAllCelebrations initiated ===');
  var core = _core || (typeof AutoGifterCore !== 'undefined' ? AutoGifterCore : null);
  if (!core) {
    console.log('[Auto-Gifter] Core engine missing in onSyncAllCelebrations.');
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("Core engine not loaded."))
      .build();
  }

  if (typeof CalendarApp === 'undefined') {
    console.log('[Auto-Gifter] CalendarApp not available.');
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText("Calendar service unavailable."))
      .build();
  }

  // Retrieve primary and relevant celebration / observance calendars
  var cals = getCalendarsToScan();

  // 365 days window from start of day so all birthdays and celebrations across the full year are captured
  var now = new Date();
  var startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  var future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  var scanStartTime = Date.now();
  var scannedCount = 0;
  var matchedItems = [];
  var processedIds = {};

  for (var c = 0; c < cals.length; c++) {
    var cal = cals[c];
    if (!cal) continue;

    var calName = cal.getName ? cal.getName() : 'Primary Calendar';
    var events = [];
    try {
      events = cal.getEvents(startDate, future) || [];
    } catch (err) {
      console.log('[Auto-Gifter] Error fetching events from ' + calName + ': ' + err);
      continue;
    }
    scannedCount += events.length;

    for (var i = 0; i < events.length; i++) {
      var event = events[i];
      var eventId = event.getId ? event.getId() : ('evt_' + c + '_' + i);
      if (processedIds[eventId]) continue;
      processedIds[eventId] = true;

      var title = event.getTitle ? event.getTitle() : '';
      var notes = event.getDescription ? event.getDescription() : '';

      var classification = core.classifyEvent(title, notes);
      if (classification && classification.isCelebration) {
        var startTime = typeof event.getStartTime === 'function' ? event.getStartTime() : new Date();
        var isAlreadyEnriched = notes &&
          notes.indexOf('<a href="https://www.floristone.com') !== -1 &&
          notes.indexOf('🔔 Reminder') === -1 &&
          notes.indexOf('http://www.floristone.com/index.cfm') === -1 &&
          notes.indexOf('   🛒 Order on FloristOne') === -1 &&
          notes.indexOf('   https://www.floristone.com') === -1;
        matchedItems.push({
          event: event,
          cal: cal,
          calId: cal.getId ? cal.getId() : 'primary',
          eventId: eventId,
          classification: classification,
          notes: notes,
          title: title,
          startTime: startTime,
          isAlreadyEnriched: isAlreadyEnriched
        });
      }
    }
  }

  // Sort upcoming celebrations so the soonest ones are enriched first
  matchedItems.sort(function (a, b) {
    var ta = a.startTime ? (typeof a.startTime.getTime === 'function' ? a.startTime.getTime() : 0) : 0;
    var tb = b.startTime ? (typeof b.startTime.getTime === 'function' ? b.startTime.getTime() : 0) : 0;
    return ta - tb;
  });

  var enrichedCount = matchedItems.length;
  var newlyEnrichedCount = 0;
  var enrichedDetails = [];

  var userReminders = getUserReminderSettings();
  ensureWeeklyTriggerInstalled();

  for (var m = 0; m < matchedItems.length; m++) {
    var item = matchedItems[m];

    // Always ensure reminders match user's active settings (0ms if already matching)
    try {
      applyPopupReminders(item.event, userReminders);
    } catch (_) {}

    // Time budget: guarantee completion under 4 seconds to avoid Google AddOn timeout
    var timeElapsed = Date.now() - scanStartTime;
    if (newlyEnrichedCount < 10 && timeElapsed < 3500) {
      try {
        var ok = enrichCalendarEvent(item.event, item.cal, item.calId, item.eventId, item.classification, item.notes, core, userReminders);
        if (ok) newlyEnrichedCount++;
      } catch (err) {
        console.log('[Auto-Gifter] Sync enrich note: ' + err);
      }
    }

    var eventDateStr = "Upcoming";
    if (item.startTime) {
      try {
        eventDateStr = item.startTime.toISOString().split('T')[0];
      } catch (_) {
        eventDateStr = String(item.startTime);
      }
    }

    enrichedDetails.push({
      title: item.title,
      recipient: item.classification.recipientName || 'Friend',
      type: item.classification.celebrationType || 'birthday',
      date: eventDateStr,
      status: item.isAlreadyEnriched ? 'Active' : 'Enriched'
    });
  }

  console.log('[Auto-Gifter] === Batch sync complete. Scanned: ' + scannedCount + ', Total celebrations: ' + enrichedCount + ', Newly enriched: ' + newlyEnrichedCount + ' ===');

  // Build a result summary card
  var card = CardService.newCardBuilder()
    .setHeader(buildCardHeader("Yearly 🌸", "Calendar Sync Complete"));

  var section = CardService.newCardSection()
    .setHeader("Sync Results (Next 30 Days)");

  section.addWidget(CardService.newDecoratedText()
    .setText("<b>" + enrichedCount + " Celebrations Enriched!</b>")
    .setBottomLabel("Scanned " + scannedCount + " events across your calendar for the next 30 days. Reminders and FloristOne flower links are active.")
    .setWrapText(true));

  section.addWidget(CardService.newDecoratedText()
    .setTopLabel("Automatic Background Sync")
    .setText("🟢 Active on Autopilot")
    .setBottomLabel("Yearly automatically scans and refreshes reminders weekly on Mondays at 2:00 AM in the background."));

  card.addSection(section);

  if (enrichedDetails.length > 0) {
    var listSection = CardService.newCardSection()
      .setHeader("📋 Celebrations Found (" + enrichedDetails.length + ")");

    for (var j = 0; j < enrichedDetails.length; j++) {
      var it = enrichedDetails[j];
      var emoji = it.type === 'anniversary' ? '💍' : '🎂';
      var typeName = it.type.charAt(0).toUpperCase() + it.type.slice(1).replace('_', ' ');

      listSection.addWidget(CardService.newDecoratedText()
        .setText("<b>" + emoji + " " + it.title + "</b>")
        .setBottomLabel("📅 " + it.date + " • " + typeName + " • 🔔 Reminders active")
        .setWrapText(true));
    }
    card.addSection(listSection);
  }

  return card.build();
}

/**
 * Automatically ensures a weekly time-driven trigger is registered
 * so celebrations across the next 30 days are automatically synced every week.
 */
function ensureWeeklyTriggerInstalled() {
  if (typeof ScriptApp === 'undefined' || typeof ScriptApp.getProjectTriggers !== 'function') return;
  try {
    var triggers = ScriptApp.getProjectTriggers() || [];
    var exists = false;
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction && triggers[i].getHandlerFunction() === 'autoSyncWeeklyTrigger') {
        exists = true;
        break;
      }
    }
    if (!exists && typeof ScriptApp.newTrigger === 'function') {
      ScriptApp.newTrigger('autoSyncWeeklyTrigger')
        .timeBased()
        .everyWeeks(1)
        .onWeekDay(ScriptApp.WeekDay.MONDAY)
        .atHour(2)
        .create();
      console.log('[Auto-Gifter] Automatic weekly sync trigger installed (runs weekly on Mondays at 2:00 AM).');
    }
  } catch (err) {
    console.log('[Auto-Gifter] Note installing weekly trigger: ' + err);
  }
}

/**
 * Automatic background weekly trigger function.
 * Runs every week on Mondays at 2:00 AM (up to 6 minutes execution limit in background),
 * scans next 30 days of events, and updates reminder notifications and gift links on autopilot!
 */
function autoSyncWeeklyTrigger() {
  console.log('[Auto-Gifter] === autoSyncWeeklyTrigger background run started ===');
  var core = _core || (typeof AutoGifterCore !== 'undefined' ? AutoGifterCore : null);
  if (!core || typeof CalendarApp === 'undefined') return;

  var userReminders = getUserReminderSettings();
  var cals = getCalendarsToScan();

  var now = new Date();
  var startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  var future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  var totalScanned = 0;
  var totalEnriched = 0;
  var processedIds = {};

  for (var c = 0; c < cals.length; c++) {
    var cal = cals[c];
    if (!cal) continue;

    var events = [];
    try {
      events = cal.getEvents(startDate, future) || [];
    } catch (_) {
      continue;
    }
    totalScanned += events.length;

    for (var i = 0; i < events.length; i++) {
      var event = events[i];
      var eventId = event.getId ? event.getId() : ('evt_' + c + '_' + i);
      if (processedIds[eventId]) continue;
      processedIds[eventId] = true;

      var title = event.getTitle ? event.getTitle() : '';
      var notes = event.getDescription ? event.getDescription() : '';

      var classification = core.classifyEvent(title, notes);
      if (classification && classification.isCelebration) {
        var calId = cal.getId ? cal.getId() : 'primary';
        try {
          var ok = enrichCalendarEvent(event, cal, calId, eventId, classification, notes, core, userReminders);
          if (ok) totalEnriched++;
        } catch (err) {
          console.log('[Auto-Gifter Background] Enrich note: ' + err);
        }
      }
    }
  }

  console.log('[Auto-Gifter] === autoSyncWeeklyTrigger complete: Scanned ' + totalScanned + ', Enriched ' + totalEnriched + ' ===');
}

/**
 * Standalone manual test execution function.
 * You can select "testEnrichmentInEditor" from the Run function dropdown in Apps Script
 * and click Run ▶️ to see exact logs in the Execution log window.
 */
function testEnrichmentInEditor() {
  console.log('====================================================');
  console.log('🌸 STARTING AUTO-GIFTER MANUAL DIAGNOSTIC TEST 🌸');
  console.log('====================================================');

  var core = _core || (typeof AutoGifterCore !== 'undefined' ? AutoGifterCore : null);
  if (!core) {
    console.error('❌ ERROR: AutoGifterCore engine could not be loaded.');
    return;
  }
  console.log('✓ CoreEngine loaded. Affiliate ID: 2026097209');

  if (typeof CalendarApp === 'undefined') {
    console.error('❌ ERROR: CalendarApp service is unavailable.');
    return;
  }

  var def = CalendarApp.getDefaultCalendar();
  if (!def) {
    console.error('❌ ERROR: Default Calendar not found.');
    return;
  }
  console.log('✓ Default Calendar name: ' + def.getName() + ' (ID: ' + def.getId() + ')');

  var now = new Date();
  var startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  var future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  console.log('✓ Scanning range: ' + startDate.toDateString() + ' to ' + future.toDateString());

  var events = def.getEvents(startDate, future) || [];
  console.log('✓ Total events found in primary calendar: ' + events.length);

  var enrichedCount = 0;
  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    var title = event.getTitle();
    var notes = event.getDescription();
    var classification = core.classifyEvent(title, notes);

    if (classification && classification.isCelebration) {
      console.log('\n----------------------------------------------------');
      console.log('🎉 MATCHED CELEBRATION #' + (enrichedCount + 1));
      console.log('   Title: ' + title);
      console.log('   Start Date: ' + event.getStartTime());
      console.log('   Celebrant: ' + classification.recipientName);
      console.log('   Occasion: ' + classification.celebrationType);
      console.log('   Current notes length: ' + (notes ? notes.length : 0));

      var ok = enrichCalendarEvent(event, def, def.getId(), event.getId(), classification, notes, core);
      console.log('   Enrichment status: ' + (ok ? '✅ SUCCESS' : '❌ FAILED'));
      console.log('   New notes preview:\n' + event.getDescription().slice(0, 300) + '...\n');
      enrichedCount++;
    }
  }

  console.log('====================================================');
  console.log('🏁 DIAGNOSTIC TEST FINISHED. Total enriched: ' + enrichedCount);
  console.log('====================================================');
}

/**
 * Force resets OAuth tokens for this project.
 * Running this function forces Google Apps Script to display the
 * "Authorization Required" popup with full Calendar write permissions.
 */
function forceReauthorization() {
  console.log('🔄 Invalidating existing authorization tokens...');
  if (typeof ScriptApp !== 'undefined' && typeof ScriptApp.invalidateAuth === 'function') {
    ScriptApp.invalidateAuth();
    console.log('✅ Authorization tokens invalidated. Now run "testEnrichmentInEditor" to authorize the new scopes!');
  } else {
    console.log('Please visit https://myaccount.google.com/connections to remove Auto-Gifter permissions and re-authorize.');
  }
}

/**
 * Manual test runner for the automatic background trigger.
 * Select "runWeeklyTriggerNow" in Apps Script dropdown and click Run ▶️
 * to test the 30-day background sweep and see full logs!
 */
function runWeeklyTriggerNow() {
  console.log('🔄 Manually executing weekly background sync...');
  ensureWeeklyTriggerInstalled();
  autoSyncWeeklyTrigger();
  console.log('✅ Weekly background sync test completed successfully.');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    findCalendarEvent: findCalendarEvent,
    enrichCalendarEvent: enrichCalendarEvent,
    getReminderMinutesFor11Am: getReminderMinutesFor11Am,
    applyPopupReminders: applyPopupReminders,
    onCalendarEventOpen: onCalendarEventOpen,
    onCalendarHomepage: onCalendarHomepage,
    buildCelebrationCard: buildCelebrationCard,
    buildNonCelebrationCard: buildNonCelebrationCard,
    buildEmptyCard: buildEmptyCard,
    createReminderSettingsSection: createReminderSettingsSection,
    createHealthAndAlertSettingsSection: createHealthAndAlertSettingsSection,
    onSaveAddonSettings: onSaveAddonSettings,
    onSaveAndTestChatWebhook: onSaveAndTestChatWebhook,
    onViewHealthLogsCard: onViewHealthLogsCard,
    getUserReminderSettings: getUserReminderSettings,
    saveUserReminderSettings: saveUserReminderSettings,
    ensureWeeklyTriggerInstalled: ensureWeeklyTriggerInstalled,
    autoSyncWeeklyTrigger: autoSyncWeeklyTrigger,
    runWeeklyTriggerNow: runWeeklyTriggerNow,
    onEnrichCalendarEvent: onEnrichCalendarEvent,
    onSyncAllCelebrations: onSyncAllCelebrations,
    onRegenerateGreeting: onRegenerateGreeting,
    onManualMarkSent: onManualMarkSent,
    testEnrichmentInEditor: testEnrichmentInEditor,
    forceReauthorization: forceReauthorization
  };
}
