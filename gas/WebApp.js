/**
 * Auto-Gifter Google Apps Script Web App (JSON API)
 *
 * Exposes a headless JSON API for the Chrome Extension and external clients:
 * - doGet(e):
 *   - ?action=ping: Service health check
 *   - ?action=catalog: Affiliate gift card catalog
 *   - ?action=events&days=14: Scans Google Calendar for celebrations in the next N days
 *   - ?action=log_gift: Logs a gift send to CelebrationLog sheet
 *   - ?action=history: Retrieves logged celebrations audit trail
 * - doPost(e): Accepts JSON payload for action=log_gift
 */

/* global ContentService, CalendarApp */

var _core = (typeof AutoGifterCore !== 'undefined')
  ? AutoGifterCore
  : (typeof require !== 'undefined' ? require('./CoreEngine') : null);

var _sheets = (typeof logGiftSent === 'function' && typeof getCelebrationHistory === 'function')
  ? { logGiftSent: logGiftSent, getCelebrationHistory: getCelebrationHistory, getHealthLogs: (typeof getHealthLogs === 'function' ? getHealthLogs : null) }
  : (typeof require !== 'undefined' ? (function() {
      try { return require('./SheetsLogger'); } catch (_) { return null; }
    })() : null);

var _obs = (typeof Observability !== 'undefined')
  ? Observability
  : (typeof require !== 'undefined' ? (function() {
      try { return require('./Observability'); } catch (_) { return null; }
    })() : null);

/**
 * HTTP GET Request Handler
 *
 * @param {Object} e HTTP event parameter
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var action = params.action || 'ping';

    var core = _core || (typeof AutoGifterCore !== 'undefined' ? AutoGifterCore : null);
    var sheets = _sheets || (typeof require !== 'undefined' ? require('./SheetsLogger') : null);

    switch (action) {
      case 'ping':
        return jsonResponse({
          status: 'ok',
          service: 'Auto-Gifter GAS Backend',
          version: '1.0.0',
          timestamp: new Date().toISOString()
        });

      case 'catalog': {
        var catalog = core && core.getCatalog ? core.getCatalog() : [];
        return jsonResponse({
          status: 'ok',
          catalog: catalog
        });
      }

      case 'events': {
        var days = parseInt(params.days || '14', 10);
        if (isNaN(days) || days <= 0) days = 14;
        var upcoming = getUpcomingCelebrations(days);
        return jsonResponse({
          status: 'ok',
          days: days,
          count: upcoming.length,
          events: upcoming
        });
      }

      case 'get_settings': {
        var currentReminders = getUserReminderSettings();
        return jsonResponse({
          status: 'ok',
          reminders: currentReminders
        });
      }

      case 'save_settings': {
        var rParam = params.reminders;
        var newReminders = [7, 3];
        if (rParam) {
          try {
            if (typeof rParam === 'string') {
              if (rParam.indexOf('[') !== -1) {
                newReminders = JSON.parse(rParam);
              } else {
                newReminders = rParam.split(',').map(function (s) { return parseInt(s.trim(), 10); }).filter(function (n) { return !isNaN(n) && n > 0; });
              }
            } else if (Array.isArray(rParam)) {
              newReminders = rParam;
            }
          } catch (_) {
            newReminders = [7, 3];
          }
        }
        if (!Array.isArray(newReminders) || newReminders.length === 0) newReminders = [7, 3];
        saveUserReminderSettings(newReminders);
        return jsonResponse({
          status: 'ok',
          saved: true,
          reminders: newReminders
        });
      }

      case 'sync_all': {
        var syncDays = parseInt(params.days || '30', 10);
        if (isNaN(syncDays) || syncDays <= 0) syncDays = 30;
        var remindersParam = params.reminders;
        var reminderDays = getUserReminderSettings();
        if (remindersParam) {
          if (typeof remindersParam === 'string') {
            try {
              if (remindersParam.indexOf('[') !== -1) {
                reminderDays = JSON.parse(remindersParam);
              } else {
                reminderDays = remindersParam.split(',').map(function (s) { return parseInt(s.trim(), 10); }).filter(function (n) { return !isNaN(n) && n > 0; });
              }
            } catch (_) {
              reminderDays = getUserReminderSettings();
            }
          } else if (Array.isArray(remindersParam)) {
            reminderDays = remindersParam;
          }
        }
        if (!Array.isArray(reminderDays) || reminderDays.length === 0) reminderDays = getUserReminderSettings();
        saveUserReminderSettings(reminderDays);
        var syncResult = syncAllCelebrations(syncDays, reminderDays);
        return jsonResponse({
          status: 'ok',
          sync: syncResult
        });
      }

      case 'log_gift': {
        var logParams = {
          eventId: params.eventId,
          recipientName: params.recipientName || params.recipient,
          eventType: params.eventType,
          brandChosen: params.brandChosen || params.brand,
          amount: params.amount,
          date: params.date,
          greetingUsed: params.greetingUsed || params.greeting
        };

        var result = sheets && sheets.logGiftSent ? sheets.logGiftSent(logParams) : { success: false, error: 'SheetsLogger unavailable' };
        return jsonResponse({
          status: 'ok',
          logged: true,
          result: result
        });
      }

      case 'history': {
        var history = sheets && sheets.getCelebrationHistory ? sheets.getCelebrationHistory() : [];
        return jsonResponse({
          status: 'ok',
          count: history.length,
          history: history
        });
      }

      case 'health_logs': {
        var limit = parseInt(params.limit || '50', 10);
        if (isNaN(limit) || limit <= 0) limit = 50;
        var healthLogs = sheets && sheets.getHealthLogs ? sheets.getHealthLogs(limit) : [];
        return jsonResponse({
          status: 'ok',
          count: healthLogs.length,
          logs: healthLogs
        });
      }

      case 'test_alert': {
        var testUrl = params.url || null;
        var alertRes = _obs && _obs.sendTestAlert ? _obs.sendTestAlert(testUrl) : { success: false, message: 'Observability module unavailable' };
        return jsonResponse({
          status: alertRes.success ? 'ok' : 'error',
          message: alertRes.message
        });
      }

      default:
        return jsonResponse({
          status: 'error',
          error: 'Unknown action: ' + action
        }, 400);
    }
  } catch (err) {
    return jsonResponse({
      status: 'error',
      error: err && err.message ? err.message : String(err)
    }, 500);
  }
}

/**
 * HTTP POST Request Handler
 *
 * @param {Object} e HTTP event parameter
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function doPost(e) {
  try {
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (_) {
        payload = {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    var action = payload.action || ((e && e.parameter && e.parameter.action) || 'log_gift');
    var sheets = _sheets || (typeof require !== 'undefined' ? require('./SheetsLogger') : null);

    if (action === 'telemetry') {
      var logs = payload.logs || [];
      if (!Array.isArray(logs) && payload.log) {
        logs = [payload.log];
      }
      var received = 0;
      for (var k = 0; k < logs.length; k++) {
        var item = logs[k];
        if (item && _obs) {
          _obs.log(
            item.severity || 'INFO',
            item.component || 'Extension',
            item.message || '',
            item.meta || {},
            item.error || null,
            item.surface || 'extension'
          );
          received++;
        }
      }
      return jsonResponse({
        status: 'ok',
        received: received
      });
    }

    if (action === 'test_alert') {
      var customWebhook = payload.url || payload.webhookUrl || null;
      var alertOutcome = _obs && _obs.sendTestAlert ? _obs.sendTestAlert(customWebhook) : { success: false, message: 'Observability unavailable' };
      return jsonResponse({
        status: alertOutcome.success ? 'ok' : 'error',
        message: alertOutcome.message
      });
    }

    if (action === 'sync_all') {
      var syncDays = parseInt(payload.days || '90', 10);
      if (isNaN(syncDays) || syncDays <= 0) syncDays = 90;
      var syncResult = syncAllCelebrations(syncDays);
      return jsonResponse({
        status: 'ok',
        sync: syncResult
      });
    }

    if (action === 'log_gift') {
      var logParams = {
        eventId: payload.eventId,
        recipientName: payload.recipientName || payload.recipient,
        eventType: payload.eventType,
        brandChosen: payload.brandChosen || payload.brand,
        amount: payload.amount,
        date: payload.date,
        greetingUsed: payload.greetingUsed || payload.greeting
      };

      var result = sheets && sheets.logGiftSent ? sheets.logGiftSent(logParams) : { success: false, error: 'SheetsLogger unavailable' };
      return jsonResponse({
        status: 'ok',
        logged: true,
        result: result
      });
    }

    return jsonResponse({
      status: 'error',
      error: 'Unsupported POST action: ' + action
    }, 400);
  } catch (err) {
    return jsonResponse({
      status: 'error',
      error: err && err.message ? err.message : String(err)
    }, 500);
  }
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
 * Batch scans and enriches all upcoming celebrations in the calendar.
 *
 * @param {number} [days=30]
 * @return {Object}
 */
/**
 * Calculates reminder minutes before an event so alerts trigger at 11:00 AM local time.
 */
function getReminderMinutesFor11Am(event, days) {
  var d = Number(days);
  if (isNaN(d) || d <= 0) d = 1;

  var isAllDay = (event && typeof event.isAllDayEvent === 'function') ? event.isAllDayEvent() : true;
  if (isAllDay) {
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
 * Batch scans and enriches all upcoming celebrations in the calendar.
 *
 * @param {number} [days=30]
 * @return {Object}
 */
function syncAllCelebrations(days, reminderDays) {
  var d = (typeof days === 'number' && days > 0) ? days : 30;
  var reminders = (Array.isArray(reminderDays) && reminderDays.length > 0) ? reminderDays : getUserReminderSettings();
  var now = new Date();
  var startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  var future = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  console.log('[Auto-Gifter WebApp] syncAllCelebrations started for ' + d + ' days (' + startDate.toISOString() + ' to ' + future.toISOString() + ') with reminders: ' + JSON.stringify(reminders));

  if (typeof CalendarApp === 'undefined') {
    console.error('[Auto-Gifter WebApp] CalendarApp not defined');
    return { scanned: 0, enriched: 0, events: [] };
  }

  var cals = [];
  var seenIds = {};
  var def = CalendarApp.getDefaultCalendar();
  if (def) {
    cals.push(def);
    var defId = (def.getId ? def.getId() : 'primary').toLowerCase();
    seenIds[defId] = true;
  }

  try {
    var allCals = (typeof CalendarApp.getAllCalendars === 'function')
      ? CalendarApp.getAllCalendars()
      : ((typeof CalendarApp.getAllOwnedCalendars === 'function') ? CalendarApp.getAllOwnedCalendars() : []);
    for (var k = 0; k < allCals.length; k++) {
      var aCal = allCals[k];
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
  } catch (err) {
    console.log('[Auto-Gifter WebApp] Note fetching all calendars: ' + err);
  }

  var core = _core || (typeof AutoGifterCore !== 'undefined' ? AutoGifterCore : null);

  var enrichedList = [];
  var scannedTotal = 0;
  var newlyEnrichedCount = 0;
  var scanStartTime = Date.now();
  var matchedCelebrations = [];
  var processedIds = {};

  for (var c = 0; c < cals.length; c++) {
    var cal = cals[c];
    if (!cal) continue;

    var calName = cal.getName ? cal.getName() : 'Primary Calendar';
    var events = [];
    try {
      events = cal.getEvents(startDate, future) || [];
    } catch (err) {
      console.log('[Auto-Gifter WebApp] Error getting events from ' + calName + ': ' + err);
      continue;
    }
    scannedTotal += events.length;

    for (var i = 0; i < events.length; i++) {
      var event = events[i];
      var eventId = event.getId ? event.getId() : ('evt_' + c + '_' + i);
      if (processedIds[eventId]) continue;
      processedIds[eventId] = true;

      var title = event.getTitle ? event.getTitle() : '';
      var notes = event.getDescription ? event.getDescription() : '';

      var classification = core ? core.classifyEvent(title, notes) : null;
      if (classification && classification.isCelebration) {
        var startTime = typeof event.getStartTime === 'function' ? event.getStartTime() : new Date();
        var isAlreadyEnriched = notes &&
          notes.indexOf('<a href="https://www.floristone.com') !== -1 &&
          notes.indexOf('🔔 Reminder') === -1 &&
          notes.indexOf('http://www.floristone.com/index.cfm') === -1 &&
          notes.indexOf('   🛒 Order on FloristOne') === -1 &&
          notes.indexOf('   https://www.floristone.com') === -1;

        matchedCelebrations.push({
          event: event,
          eventId: eventId,
          title: title,
          notes: notes,
          classification: classification,
          startTime: startTime,
          isAlreadyEnriched: isAlreadyEnriched
        });
      }
    }
  }

  // Sort upcoming celebrations by date ascending
  matchedCelebrations.sort(function (a, b) {
    var ta = a.startTime ? (typeof a.startTime.getTime === 'function' ? a.startTime.getTime() : 0) : 0;
    var tb = b.startTime ? (typeof b.startTime.getTime === 'function' ? b.startTime.getTime() : 0) : 0;
    return ta - tb;
  });

  for (var m = 0; m < matchedCelebrations.length; m++) {
    var item = matchedCelebrations[m];
    var timeElapsed = Date.now() - scanStartTime;

    // 1. Always ensure reminders match user's active settings at 11:00 AM (fast check)
    try {
      if (typeof item.event.getPopupReminders === 'function') {
        var currentMins = item.event.getPopupReminders() || [];
        var targetMins = reminders.map(function (d) { return getReminderMinutesFor11Am(item.event, d); });
        var matches = currentMins.length === targetMins.length;
        if (matches) {
          for (var ti = 0; ti < targetMins.length; ti++) {
            if (currentMins.indexOf(targetMins[ti]) === -1) {
              matches = false;
              break;
            }
          }
        }
        if (!matches) {
          if (typeof item.event.removeAllReminders === 'function') {
            item.event.removeAllReminders();
          }
          if (typeof item.event.addPopupReminder === 'function') {
            for (var r = 0; r < reminders.length; r++) {
              var rDays = Number(reminders[r]);
              if (!isNaN(rDays) && rDays > 0) {
                item.event.addPopupReminder(getReminderMinutesFor11Am(item.event, rDays));
              }
            }
          }
        }
      }
    } catch (_) {}

    // 2. Enriched Description (under batch limit and time budget)
    if (!item.isAlreadyEnriched && newlyEnrichedCount < 5 && timeElapsed < 4000) {
      try {
        var occasionCategory = item.classification.occasionCategory || item.classification.celebrationType || 'birthday';
        var desc = core.buildEnrichedEventDescription({
          recipientName: item.classification.recipientName || 'Friend',
          celebrationType: item.classification.celebrationType || 'birthday',
          occasionCategory: occasionCategory,
          existingNotes: item.notes,
          reminders: reminders
        });

        var descUpdated = false;
        if (typeof item.event.setDescription === 'function') {
          try {
            item.event.setDescription(desc);
            newlyEnrichedCount++;
            descUpdated = true;
          } catch (_) {}
        }
        if (typeof item.event.isRecurringEvent === 'function' && item.event.isRecurringEvent() && typeof item.event.getEventSeries === 'function') {
          try {
            var series = item.event.getEventSeries();
            if (series && typeof series.setDescription === 'function') {
              series.setDescription(desc);
              descUpdated = true;
            }
          } catch (_) {}
        }

        // Fallback for read-only events
        if (!descUpdated && typeof CalendarApp !== 'undefined') {
          try {
            var primaryCal = CalendarApp.getDefaultCalendar();
            if (primaryCal) {
              var isAllDay = typeof item.event.isAllDayEvent === 'function' ? item.event.isAllDayEvent() : true;
              var celebrationType = item.classification.celebrationType || 'birthday';
              var celebrationEmoji = (core && typeof core.getCelebrationEmoji === 'function')
                ? core.getCelebrationEmoji(celebrationType)
                : '🎂';
              var rawTitle = item.title ? item.title.trim() : '';
              var celebrantTitle;
              if (rawTitle && (/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(rawTitle))) {
                celebrantTitle = rawTitle;
              } else if (celebrationType === 'birthday' && item.classification.recipientName) {
                celebrantTitle = celebrationEmoji + " " + item.classification.recipientName;
              } else if (rawTitle) {
                celebrantTitle = celebrationEmoji + " " + rawTitle;
              } else {
                celebrantTitle = celebrationEmoji + " " + (item.classification.recipientName || "Celebration");
              }

              var startTimeObj = (typeof item.event.getAllDayStartDate === 'function')
                ? item.event.getAllDayStartDate()
                : (item.startTime || new Date());
              var eventYear = startTimeObj.getFullYear();
              var eventMonth = startTimeObj.getMonth();
              var eventDay = startTimeObj.getDate();

              var middayDate = new Date(eventYear, eventMonth, eventDay, 12, 0, 0);
              var searchStart = new Date(eventYear, eventMonth, eventDay, 0, 0, 0);
              var searchEnd = new Date(eventYear, eventMonth, eventDay, 23, 59, 59);
              var peEvents = primaryCal.getEvents(searchStart, searchEnd) || [];
              var found = null;
              var searchName = (item.classification.recipientName || '').toLowerCase();
              var cleanTitleWithoutEmoji = rawTitle.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\s]+/u, '').toLowerCase();

              for (var p = 0; p < peEvents.length; p++) {
                var pEvt = peEvents[p];
                if (pEvt.getId() !== item.event.getId()) {
                  var pTitle = (pEvt.getTitle ? pEvt.getTitle() : '').toLowerCase();
                  var pDesc = (pEvt.getDescription ? pEvt.getDescription() : '');
                  if ((searchName && pTitle.indexOf(searchName) !== -1) ||
                      (cleanTitleWithoutEmoji && pTitle.indexOf(cleanTitleWithoutEmoji) !== -1) ||
                      (pDesc.indexOf('FloristOne') !== -1 && (searchName && pDesc.indexOf(searchName) !== -1 || cleanTitleWithoutEmoji && pTitle.indexOf(cleanTitleWithoutEmoji) !== -1))) {
                    found = pEvt;
                    break;
                  }
                }
              }
              if (found) {
                try { if (found.removeAllReminders) found.removeAllReminders(); } catch (_) {}
                for (var r1 = 0; r1 < reminders.length; r1++) {
                  var rd1 = Number(reminders[r1]);
                  if (!isNaN(rd1) && rd1 > 0 && found.addPopupReminder) found.addPopupReminder(getReminderMinutesFor11Am(found, rd1));
                }
                found.setDescription(desc);
                newlyEnrichedCount++;
              } else {
                var newCreated;
                if (isAllDay) {
                  newCreated = primaryCal.createAllDayEvent(celebrantTitle, middayDate, { description: desc });
                } else {
                  var endTime = typeof item.event.getEndTime === 'function' ? item.event.getEndTime() : new Date(item.startTime.getTime() + 3600000);
                  newCreated = primaryCal.createEvent(celebrantTitle, item.startTime, endTime, { description: desc });
                }
                if (newCreated) {
                  for (var r2 = 0; r2 < reminders.length; r2++) {
                    var rd2 = Number(reminders[r2]);
                    if (!isNaN(rd2) && rd2 > 0 && newCreated.addPopupReminder) newCreated.addPopupReminder(getReminderMinutesFor11Am(newCreated, rd2));
                  }
                  newlyEnrichedCount++;
                }
              }
            }
          } catch (_) {}
        }
      } catch (err) {
        console.error('[Auto-Gifter WebApp] Error enriching description: ' + err);
      }
    }

    var dateStr = 'Upcoming';
    if (item.startTime) {
      try {
        dateStr = item.startTime.toISOString().split('T')[0];
      } catch (_) {
        dateStr = String(item.startTime);
      }
    }

    enrichedList.push({
      id: item.eventId,
      title: item.title,
      recipientName: item.classification.recipientName || 'Friend',
      celebrationType: item.classification.celebrationType || 'birthday',
      date: dateStr,
      status: item.isAlreadyEnriched ? 'Active' : 'Enriched'
    });
  }

  console.log('[Auto-Gifter WebApp] syncAllCelebrations complete. Scanned: ' + scannedTotal + ', Enriched: ' + enrichedList.length);

  return {
    scanned: scannedTotal,
    enriched: enrichedList.length,
    events: enrichedList
  };
}

/**
 * Helper to retrieve upcoming celebrations in the next N days.
 *
 * @param {number} [days=14]
 * @param {Date} [customNow]
 * @return {Array<Object>}
 */
function getUpcomingCelebrations(days, customNow) {
  var d = (typeof days === 'number' && days > 0) ? days : 14;
  var now = customNow instanceof Date ? customNow : new Date();
  var future = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  if (typeof CalendarApp === 'undefined') {
    return [];
  }

  var cal = CalendarApp.getDefaultCalendar();
  if (!cal) {
    return [];
  }

  var events = cal.getEvents(now, future) || [];
  var core = _core || (typeof AutoGifterCore !== 'undefined' ? AutoGifterCore : null);
  var celebrations = [];

  events.forEach(function (event) {
    var title = event.getTitle ? event.getTitle() : '';
    var notes = event.getDescription ? event.getDescription() : '';

    var classification = core ? core.classifyEvent(title, notes) : null;
    if (!classification || !classification.isCelebration) {
      return;
    }

    var recipientName = classification.recipientName || 'Friend';
    var celebrationType = classification.celebrationType || 'birthday';
    var startTime = event.getStartTime ? event.getStartTime() : now;
    var dateStr = '';
    try {
      dateStr = startTime.toISOString().split('T')[0];
    } catch (_) {
      dateStr = String(startTime).slice(0, 10);
    }

    var daysUntil = Math.max(0, Math.round((startTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    var greeting = core ? core.generateGreeting({
      recipientName: recipientName,
      celebrationType: celebrationType,
      tone: 'warm'
    }) : 'Happy Celebration!';

    var occasionCategory = classification.occasionCategory || celebrationType;
    var bestsellers = core && core.getBestsellers ? core.getBestsellers(occasionCategory, 5) : [];
    var defaultGiftUrl = (bestsellers.length > 0 && bestsellers[0].cartUrl) ? bestsellers[0].cartUrl : '';

    celebrations.push({
      id: event.getId ? event.getId() : ('event_' + celebrations.length),
      title: title,
      date: dateStr,
      eventDate: dateStr,
      daysUntil: daysUntil,
      celebrationType: celebrationType,
      recipientName: recipientName,
      confidenceScore: classification.confidenceScore,
      suggestedGreeting: greeting,
      giftUrl: defaultGiftUrl,
      whatsAppUrl: defaultGiftUrl,
      bestsellers: bestsellers
    });
  });

  return celebrations;
}

/**
 * Creates ContentService JSON TextOutput response.
 *
 * @param {Object} data
 * @param {number} [statusCode=200]
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function jsonResponse(data, statusCode) {
  if (typeof ContentService !== 'undefined' && ContentService.createTextOutput) {
    var output = ContentService.createTextOutput(JSON.stringify(data));
    if (ContentService.MimeType && ContentService.MimeType.JSON) {
      output.setMimeType(ContentService.MimeType.JSON);
    }
    return output;
  }

  // Fallback for non-GAS or test environment
  return {
    getContent: function () { return JSON.stringify(data); },
    getMimeType: function () { return 'application/json'; },
    statusCode: statusCode || 200,
    parsed: data
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    doGet: doGet,
    doPost: doPost,
    syncAllCelebrations: syncAllCelebrations,
    getUpcomingCelebrations: getUpcomingCelebrations,
    jsonResponse: jsonResponse
  };
}
