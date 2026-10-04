/**
 * Auto-Gifter Google Sheets Persistence & Daily Scanner (Google Apps Script)
 *
 * Responsibilities:
 * - Auto-provisions CelebrationLog sheet with 9 standard columns.
 * - Time-driven daily trigger (dailyCelebrationScan) scanning next 14 days.
 * - Deduplication by Event ID and Date_RecipientName.
 * - Audit logging of gifts sent (logGiftSent).
 */

/* global SpreadsheetApp, CalendarApp, PropertiesService, ScriptApp */

var _core = (typeof AutoGifterCore !== 'undefined')
  ? AutoGifterCore
  : (typeof require !== 'undefined' ? require('./CoreEngine') : null);

var SPREADSHEET_PROP_KEY = 'AUTOGIFTER_SPREADSHEET_ID';
var SHEET_NAME = 'CelebrationLog';
var SHEET_HEADERS = [
  'Date',
  'Recipient Name',
  'Event Type',
  'Gift Sent',
  'Greeting Used',
  'Brand Chosen',
  'Amount',
  'Event ID',
  'Last Updated'
];

/**
 * Retrieves or creates the linked Google Spreadsheet and auto-provisions
 * the CelebrationLog sheet with the 9 standard columns.
 *
 * @return {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getOrCreateCelebrationSheet() {
  var props = null;
  if (typeof PropertiesService !== 'undefined') {
    props = PropertiesService.getUserProperties();
  }

  var spreadsheetId = props ? props.getProperty(SPREADSHEET_PROP_KEY) : null;
  var spreadsheet = null;

  if (spreadsheetId && typeof SpreadsheetApp !== 'undefined') {
    try {
      spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    } catch (_) {
      spreadsheet = null;
    }
  }

  if (!spreadsheet && typeof SpreadsheetApp !== 'undefined') {
    try {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    } catch (_) {
      spreadsheet = null;
    }
  }

  if (!spreadsheet && typeof SpreadsheetApp !== 'undefined') {
    spreadsheet = SpreadsheetApp.create('Auto-Gifter Celebration Log');
    if (spreadsheet && props) {
      try {
        props.setProperty(SPREADSHEET_PROP_KEY, spreadsheet.getId());
      } catch (_) {}
    }
  }

  if (!spreadsheet) {
    throw new Error('SpreadsheetApp is not available or spreadsheet could not be created.');
  }

  var sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow(SHEET_HEADERS);
    try {
      var headerRange = sheet.getRange(1, 1, 1, SHEET_HEADERS.length);
      if (headerRange && headerRange.setFontWeight) {
        headerRange.setFontWeight('bold');
      }
    } catch (_) {}
  } else {
    // Ensure header row exists if sheet is empty
    var lastRow = sheet.getLastRow ? sheet.getLastRow() : 0;
    if (lastRow === 0) {
      sheet.appendRow(SHEET_HEADERS);
    }
  }

  return sheet;
}

/**
 * Daily time-driven trigger function.
 * Scans the next 14 days of calendar events and appends upcoming celebrations
 * to the CelebrationLog sheet with deduplication by Event ID and Date_RecipientName.
 *
 * @param {Date} [customNow] Optional reference date for testing
 * @return {Object} Scan metrics
 */
function dailyCelebrationScan(customNow) {
  var now = customNow instanceof Date ? customNow : new Date();
  var future = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  if (typeof CalendarApp === 'undefined') {
    return { scannedEvents: 0, newCelebrationsLogged: 0, existingCelebrationsRetained: 0 };
  }

  var cal = CalendarApp.getDefaultCalendar();
  if (!cal) {
    return { scannedEvents: 0, newCelebrationsLogged: 0, existingCelebrationsRetained: 0 };
  }

  var events = cal.getEvents(now, future) || [];
  var sheet = getOrCreateCelebrationSheet();
  var data = (sheet.getDataRange && sheet.getDataRange().getValues) ? sheet.getDataRange().getValues() : [];

  // Build lookup index from existing rows
  // Col 1 (index 0): Date
  // Col 2 (index 1): Recipient Name
  // Col 8 (index 7): Event ID
  var eventIdMap = new Map();
  var dateNameMap = new Map();

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowDate = row[0] ? String(row[0]).trim() : '';
    var rowRecipient = row[1] ? String(row[1]).trim() : '';
    var rowEventId = row[7] ? String(row[7]).trim() : '';

    if (rowEventId) {
      eventIdMap.set(rowEventId, i + 1);
    }
    if (rowDate && rowRecipient) {
      dateNameMap.set(rowDate + '_' + rowRecipient.toLowerCase(), i + 1);
    }
  }

  var core = _core || (typeof AutoGifterCore !== 'undefined' ? AutoGifterCore : null);
  var newRowsCount = 0;
  var retainedCount = 0;

  events.forEach(function (event) {
    var title = event.getTitle ? event.getTitle() : '';
    var notes = event.getDescription ? event.getDescription() : '';

    var classification = core ? core.classifyEvent(title, notes) : null;
    if (!classification || !classification.isCelebration) {
      return;
    }

    var eventId = event.getId ? event.getId() : ('event_' + Date.now());
    var startTime = event.getStartTime ? event.getStartTime() : now;
    var dateStr = '';
    try {
      dateStr = startTime.toISOString().split('T')[0];
    } catch (_) {
      dateStr = String(startTime).slice(0, 10);
    }

    var recipientName = classification.recipientName || 'Friend';
    var compoundKey = dateStr + '_' + recipientName.toLowerCase();

    var existingRow = eventIdMap.get(eventId) || dateNameMap.get(compoundKey);

    if (!existingRow) {
      var greeting = core ? core.generateGreeting({
        recipientName: recipientName,
        celebrationType: classification.celebrationType || 'birthday',
        tone: 'warm'
      }) : 'Happy Birthday!';

      var newRow = [
        dateStr,
        recipientName,
        classification.celebrationType || 'birthday',
        false, // Gift Sent = false
        greeting,
        '',    // Brand Chosen
        '',    // Amount
        eventId,
        new Date().toISOString()
      ];

      sheet.appendRow(newRow);
      newRowsCount++;
      // Register in maps to prevent duplicates within the same scan
      eventIdMap.set(eventId, data.length + newRowsCount);
      dateNameMap.set(compoundKey, data.length + newRowsCount);
    } else {
      retainedCount++;
    }
  });

  return {
    scannedEvents: events.length,
    newCelebrationsLogged: newRowsCount,
    existingCelebrationsRetained: retainedCount
  };
}

/**
 * Updates or appends a gift send audit record in the CelebrationLog sheet.
 * Can be called with an options object or positional arguments.
 *
 * @param {string|Object} eventIdOrOptions
 * @param {string} [brand]
 * @param {number|string} [amount]
 * @param {string} [recipientName]
 * @param {string} [date]
 * @param {string} [greetingUsed]
 * @return {Object} { success: boolean, row: number, action: 'updated' | 'inserted' }
 */
function logGiftSent(eventIdOrOptions, brand, amount, recipientName, date, greetingUsed) {
  var params = {};
  if (eventIdOrOptions && typeof eventIdOrOptions === 'object') {
    params = eventIdOrOptions;
  } else {
    params = {
      eventId: eventIdOrOptions,
      brandChosen: brand,
      amount: amount,
      recipientName: recipientName,
      date: date,
      greetingUsed: greetingUsed
    };
  }

  var targetEventId = params.eventId ? String(params.eventId).trim() : '';
  var targetRecipient = (params.recipientName || params.recipient) ? String(params.recipientName || params.recipient).trim() : '';
  var targetBrand = params.brandChosen || params.brand || '';
  var targetAmount = params.amount || 25;
  if (typeof targetAmount === 'string') {
    var cleaned = targetAmount.replace(/[^0-9.]/g, '');
    targetAmount = parseFloat(cleaned) || 25;
  }
  var targetDate = params.date || new Date().toISOString().split('T')[0];
  var targetGreeting = params.greetingUsed || params.greeting || '';
  var targetEventType = params.eventType || 'birthday';

  var sheet = getOrCreateCelebrationSheet();
  var data = (sheet.getDataRange && sheet.getDataRange().getValues) ? sheet.getDataRange().getValues() : [];

  var targetRowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowEventId = row[7] ? String(row[7]).trim() : '';
    var rowRecipient = row[1] ? String(row[1]).trim() : '';
    var rowDate = row[0] ? String(row[0]).trim() : '';

    if (targetEventId && rowEventId === targetEventId) {
      targetRowIndex = i + 1;
      break;
    }
    if (targetRecipient && rowRecipient.toLowerCase() === targetRecipient.toLowerCase() && (!targetDate || rowDate === targetDate)) {
      targetRowIndex = i + 1;
      break;
    }
  }

  var timestamp = new Date().toISOString();

  if (targetRowIndex > 0) {
    // Update existing row
    sheet.getRange(targetRowIndex, 4).setValue(true);           // Col D: Gift Sent
    if (targetGreeting) {
      sheet.getRange(targetRowIndex, 5).setValue(targetGreeting); // Col E: Greeting Used
    }
    sheet.getRange(targetRowIndex, 6).setValue(targetBrand);    // Col F: Brand Chosen
    sheet.getRange(targetRowIndex, 7).setValue(targetAmount);   // Col G: Amount
    sheet.getRange(targetRowIndex, 9).setValue(timestamp);      // Col I: Last Updated

    return {
      success: true,
      row: targetRowIndex,
      action: 'updated'
    };
  } else {
    // Append new row
    var newRow = [
      targetDate,
      targetRecipient || 'Friend',
      targetEventType,
      true, // Gift Sent = true
      targetGreeting,
      targetBrand,
      targetAmount,
      targetEventId || ('manual_' + Date.now()),
      timestamp
    ];
    sheet.appendRow(newRow);
    var lastRow = sheet.getLastRow ? sheet.getLastRow() : data.length + 1;
    return {
      success: true,
      row: lastRow,
      action: 'inserted'
    };
  }
}

/**
 * Returns celebration history rows from CelebrationLog sheet.
 *
 * @return {Array<Object>} List of history entries
 */
function getCelebrationHistory() {
  var sheet = getOrCreateCelebrationSheet();
  var data = (sheet.getDataRange && sheet.getDataRange().getValues) ? sheet.getDataRange().getValues() : [];
  var history = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    history.push({
      date: row[0],
      recipientName: row[1],
      eventType: row[2],
      giftSent: Boolean(row[3]),
      greetingUsed: row[4],
      brandChosen: row[5],
      amount: row[6],
      eventId: row[7],
      lastUpdated: row[8]
    });
  }

  return history;
}

var HEALTH_SHEET_NAME = '_SystemHealthLog';
var HEALTH_SHEET_HEADERS = [
  'Timestamp',
  'Trace ID',
  'Surface',
  'Severity',
  'Component',
  'Message',
  'Duration (ms)',
  'Error Stack'
];

/**
 * Retrieves or creates the _SystemHealthLog sheet in the user spreadsheet.
 *
 * @return {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getOrCreateHealthSheet() {
  var celebrationSheet = getOrCreateCelebrationSheet();
  var spreadsheet = (celebrationSheet && typeof celebrationSheet.getParent === 'function')
    ? celebrationSheet.getParent()
    : ((typeof SpreadsheetApp !== 'undefined') ? SpreadsheetApp.getActiveSpreadsheet() : null);

  if (!spreadsheet) {
    throw new Error('Spreadsheet could not be determined for health log.');
  }

  var healthSheet = spreadsheet.getSheetByName(HEALTH_SHEET_NAME);

  if (!healthSheet) {
    healthSheet = spreadsheet.insertSheet(HEALTH_SHEET_NAME);
    healthSheet.appendRow(HEALTH_SHEET_HEADERS);
    try {
      var headerRange = healthSheet.getRange(1, 1, 1, HEALTH_SHEET_HEADERS.length);
      if (headerRange && headerRange.setFontWeight) {
        headerRange.setFontWeight('bold');
      }
    } catch (_) {}
  } else {
    var lastRow = healthSheet.getLastRow ? healthSheet.getLastRow() : 0;
    if (lastRow === 0) {
      healthSheet.appendRow(HEALTH_SHEET_HEADERS);
    }
  }

  return healthSheet;
}

/**
 * Appends a health/diagnostic trace log to the _SystemHealthLog sheet.
 *
 * @param {Object} entry
 * @return {boolean}
 */
function recordHealthLog(entry) {
  if (!entry) return false;
  try {
    var sheet = getOrCreateHealthSheet();
    var duration = (entry.durationMs !== undefined && entry.durationMs !== null) ? entry.durationMs : '';
    var errorStack = (entry.error && entry.error.stack) ? entry.error.stack : '';

    sheet.appendRow([
      entry.timestamp || new Date().toISOString(),
      entry.traceId || '',
      entry.surface || 'gas_addon',
      entry.severity || 'INFO',
      entry.component || 'General',
      entry.message || '',
      duration,
      errorStack
    ]);
    return true;
  } catch (err) {
    console.warn('[SheetsLogger] Failed to write to health log sheet: ' + err);
    return false;
  }
}

/**
 * Retrieves the most recent health logs from _SystemHealthLog.
 *
 * @param {number} [limit=50]
 * @return {Array<Object>}
 */
function getHealthLogs(limit) {
  var max = limit || 50;
  try {
    var sheet = getOrCreateHealthSheet();
    var data = (sheet.getDataRange && sheet.getDataRange().getValues) ? sheet.getDataRange().getValues() : [];
    var logs = [];

    for (var i = Math.max(1, data.length - max); i < data.length; i++) {
      var row = data[i];
      logs.push({
        timestamp: row[0],
        traceId: row[1],
        surface: row[2],
        severity: row[3],
        component: row[4],
        message: row[5],
        durationMs: row[6],
        errorStack: row[7]
      });
    }
    return logs.reverse(); // most recent first
  } catch (_) {
    return [];
  }
}

/**
 * Programmatically installs the 8:00 AM daily time-driven trigger for dailyCelebrationScan.
 */
function installDailyTrigger() {
  if (typeof ScriptApp === 'undefined') return;

  var triggers = ScriptApp.getProjectTriggers ? ScriptApp.getProjectTriggers() : [];
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction && triggers[i].getHandlerFunction() === 'dailyCelebrationScan') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger('dailyCelebrationScan')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SHEET_NAME: SHEET_NAME,
    SHEET_HEADERS: SHEET_HEADERS,
    HEALTH_SHEET_NAME: HEALTH_SHEET_NAME,
    HEALTH_SHEET_HEADERS: HEALTH_SHEET_HEADERS,
    SPREADSHEET_PROP_KEY: SPREADSHEET_PROP_KEY,
    getOrCreateCelebrationSheet: getOrCreateCelebrationSheet,
    getOrCreateHealthSheet: getOrCreateHealthSheet,
    recordHealthLog: recordHealthLog,
    getHealthLogs: getHealthLogs,
    dailyCelebrationScan: dailyCelebrationScan,
    logGiftSent: logGiftSent,
    getCelebrationHistory: getCelebrationHistory,
    installDailyTrigger: installDailyTrigger
  };
}
