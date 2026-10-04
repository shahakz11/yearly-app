/**
 * Auto-Gifter Observability & Google Chat Alert Engine (Google Apps Script & Node.js compatible)
 *
 * Responsibilities:
 * - Structured logging with severity levels (DEBUG, INFO, WARN, ERROR, CRITICAL).
 * - Execution duration measurement (measure / measureAsync).
 * - Dispatching rich Google Chat Cards v2 webhook alerts on ERROR and CRITICAL events.
 * - Integration with Google Cloud Logging and Google Sheets _SystemHealthLog.
 */

/* global Utilities, PropertiesService, UrlFetchApp, console */

var _sheetsModule = (typeof recordHealthLog === 'function')
  ? { recordHealthLog: recordHealthLog, getHealthLogs: getHealthLogs }
  : (typeof require !== 'undefined' ? (function() {
      try { return require('./SheetsLogger'); } catch (_) { return null; }
    })() : null);

var WEBHOOK_PROP_KEY = 'AUTOGIFTER_GCHAT_WEBHOOK';

/**
 * Retrieves the configured Google Chat Webhook URL from User or Script Properties.
 *
 * @return {string|null}
 */
function getWebhookUrl() {
  try {
    if (typeof PropertiesService !== 'undefined' && PropertiesService.getUserProperties) {
      var userProp = PropertiesService.getUserProperties().getProperty(WEBHOOK_PROP_KEY);
      if (userProp) return userProp;
    }
    if (typeof PropertiesService !== 'undefined' && PropertiesService.getScriptProperties) {
      var scriptProp = PropertiesService.getScriptProperties().getProperty(WEBHOOK_PROP_KEY);
      if (scriptProp) return scriptProp;
    }
  } catch (_) {}
  return null;
}

/**
 * Saves the Google Chat Webhook URL into User Properties.
 *
 * @param {string} url
 */
function setWebhookUrl(url) {
  if (typeof PropertiesService !== 'undefined' && PropertiesService.getUserProperties) {
    if (!url || typeof url !== 'string' || !url.trim()) {
      PropertiesService.getUserProperties().deleteProperty(WEBHOOK_PROP_KEY);
    } else {
      PropertiesService.getUserProperties().setProperty(WEBHOOK_PROP_KEY, url.trim());
    }
  }
}

/**
 * Formats and escapes HTML strings for Google Chat Card widgets.
 *
 * @param {string} str
 * @return {string}
 */
function sanitizeForChat(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Generates an 8-character trace identifier.
 *
 * @return {string}
 */
function generateTraceId() {
  if (typeof Utilities !== 'undefined' && Utilities.getUuid) {
    return Utilities.getUuid().slice(0, 8);
  }
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Formats and sends a rich alert to Webhooks (Google Chat, Discord, Slack, ntfy.sh)
 * or native Gmail email on personal Google accounts.
 *
 * @param {Object} entry Telemetry log entry
 * @return {boolean} Success status
 */
function sendWebhookAlert(entry) {
  var webhookUrl = getWebhookUrl();
  var isCritical = entry.severity === 'CRITICAL';
  var statusEmoji = isCritical ? '🔴 CRITICAL' : '⚠️ ERROR';

  // If no webhook URL is configured or user prefers email, dispatch via native Gmail for personal accounts
  if (!webhookUrl) {
    return sendEmailAlert(entry);
  }

  if (typeof UrlFetchApp === 'undefined') {
    return false;
  }

  var lowerUrl = webhookUrl.toLowerCase();
  var payload = null;

  // 1. Discord Webhook
  if (lowerUrl.indexOf('discord.com/api/webhooks') !== -1) {
    payload = {
      username: 'Auto-Gifter Alerts',
      embeds: [{
        title: statusEmoji + ': ' + (entry.component || 'System'),
        description: entry.message || 'Error occurred',
        color: isCritical ? 15158332 : 16753920,
        fields: [
          { name: 'Trace ID', value: entry.traceId, inline: true },
          { name: 'Surface', value: entry.surface || 'gas_addon', inline: true },
          entry.durationMs !== undefined ? { name: 'Duration', value: entry.durationMs + 'ms', inline: true } : null,
          entry.error && entry.error.stack ? { name: 'Stack Trace', value: '```' + entry.error.stack.slice(0, 400) + '```' } : null
        ].filter(Boolean),
        timestamp: entry.timestamp
      }]
    };
  }
  // 2. Slack Webhook
  else if (lowerUrl.indexOf('hooks.slack.com') !== -1) {
    payload = {
      text: statusEmoji + ' *Auto-Gifter Alert: ' + (entry.component || 'System') + '*\n' + entry.message + '\n`Trace ID: ' + entry.traceId + '`'
    };
  }
  // 3. ntfy.sh (Free push notifications without account)
  else if (lowerUrl.indexOf('ntfy.sh') !== -1) {
    try {
      UrlFetchApp.fetch(webhookUrl, {
        method: 'post',
        headers: {
          'Title': 'Auto-Gifter: ' + (entry.component || 'System'),
          'Priority': isCritical ? 'urgent' : 'high',
          'Tags': isCritical ? 'rotating_light,warning' : 'warning'
        },
        payload: entry.message + '\nTrace: ' + entry.traceId,
        muteHttpExceptions: true
      });
      return true;
    } catch (_) {
      return false;
    }
  }
  // 4. Google Chat Card v2 Webhook
  else {
    var iconUrl = isCritical
      ? 'https://fonts.gstatic.com/s/i/short-term/release/googleyolo/error/24px.svg'
      : 'https://fonts.gstatic.com/s/i/short-term/release/googleyolo/warning/24px.svg';

    var widgets = [
      {
        decoratedText: {
          topLabel: 'Event / Component',
          text: '<b>' + sanitizeForChat(entry.component || 'System') + '</b>',
          wrapText: true
        }
      },
      {
        decoratedText: {
          topLabel: 'Message',
          text: sanitizeForChat(entry.message || 'Unknown error occurred'),
          wrapText: true
        }
      }
    ];

    if (entry.durationMs !== undefined && entry.durationMs !== null) {
      widgets.push({
        decoratedText: {
          topLabel: 'Execution Duration',
          text: entry.durationMs + ' ms'
        }
      });
    }

    if (entry.error && entry.error.stack) {
      widgets.push({
        textParagraph: {
          text: '<code>' + sanitizeForChat(entry.error.stack.slice(0, 600)) + '</code>'
        }
      });
    }

    widgets.push({
      decoratedText: {
        topLabel: 'Trace ID & Timestamp',
        text: '<code>' + entry.traceId + '</code> • ' + entry.timestamp
      }
    });

    payload = {
      cardsV2: [{
        cardId: 'autogifter-alert-' + entry.traceId,
        card: {
          header: {
            title: statusEmoji + ' - Auto-Gifter',
            subtitle: entry.surface || 'Google Apps Script',
            imageUrl: iconUrl
          },
          sections: [{
            widgets: widgets
          }]
        }
      }]
    };
  }

  try {
    var response = UrlFetchApp.fetch(webhookUrl, {
      method: 'post',
      contentType: 'application/json; charset=UTF-8',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    return response.getResponseCode() >= 200 && response.getResponseCode() < 300;
  } catch (err) {
    console.warn('[Observability] Webhook alert failed to send: ' + err);
    return false;
  }
}

/**
 * Dispatches an error alert via native Gmail for personal Google accounts.
 *
 * @param {Object} entry
 * @return {boolean}
 */
function sendEmailAlert(entry) {
  try {
    var recipient = null;
    if (typeof Session !== 'undefined' && Session.getActiveUser && Session.getActiveUser().getEmail) {
      recipient = Session.getActiveUser().getEmail();
    }
    if (!recipient && typeof PropertiesService !== 'undefined') {
      recipient = PropertiesService.getUserProperties().getProperty('AUTOGIFTER_ALERT_EMAIL');
    }
    if (!recipient || recipient.indexOf('@') === -1) {
      return false;
    }

    var isCritical = entry.severity === 'CRITICAL';
    var subject = (isCritical ? '🔴 [CRITICAL]' : '⚠️ [ERROR]') + ' Auto-Gifter Alert: ' + (entry.component || 'System');
    var htmlBody = '<div style="font-family: Arial, sans-serif; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">' +
      '<h2 style="color: ' + (isCritical ? '#dc2626' : '#ea580c') + '; margin-top: 0;">Auto-Gifter Alert: ' + entry.severity + '</h2>' +
      '<p><b>Component:</b> ' + sanitizeForChat(entry.component || 'System') + '</p>' +
      '<p><b>Message:</b> ' + sanitizeForChat(entry.message || 'Error occurred') + '</p>' +
      '<p><b>Trace ID:</b> <code>' + entry.traceId + '</code></p>' +
      '<p><b>Timestamp:</b> ' + entry.timestamp + '</p>' +
      (entry.error && entry.error.stack ? '<pre style="background: #f3f4f6; padding: 8px; border-radius: 4px; overflow-x: auto;">' + sanitizeForChat(entry.error.stack) + '</pre>' : '') +
      '</div>';

    if (typeof MailApp !== 'undefined' && MailApp.sendEmail) {
      MailApp.sendEmail({
        to: recipient,
        subject: subject,
        htmlBody: htmlBody
      });
      return true;
    }
  } catch (e) {
    console.warn('[Observability] Email alert note: ' + e);
  }
  return false;
}

var sendGoogleChatAlert = sendWebhookAlert;

/**
 * Main structured logger.
 *
 * @param {string} severity 'DEBUG'|'INFO'|'WARN'|'ERROR'|'CRITICAL'
 * @param {string} component Component name (e.g. 'AddOn', 'DailyScan', 'Extension')
 * @param {string} message Summary of the log event
 * @param {Object} [meta] Optional metadata (duration, count, etc.)
 * @param {Error|Object} [error] Optional error instance
 * @param {string} [surface] Optional surface identifier ('gas_addon'|'gas_trigger'|'extension')
 * @return {Object} The structured log entry
 */
function log(severity, component, message, meta, error, surface) {
  var entry = {
    traceId: generateTraceId(),
    timestamp: new Date().toISOString(),
    surface: surface || 'gas_addon',
    severity: severity || 'INFO',
    component: component || 'General',
    message: message || '',
    meta: meta || {}
  };

  if (meta && typeof meta.durationMs === 'number') {
    entry.durationMs = meta.durationMs;
  }

  if (error) {
    entry.error = {
      name: error.name || 'Error',
      message: error.message || String(error),
      stack: error.stack || null
    };
  }

  // 1. Output to standard console (Google Cloud Logging / Stackdriver)
  var logPayload = JSON.stringify(entry);
  if (severity === 'CRITICAL' || severity === 'ERROR') {
    console.error(logPayload);
  } else if (severity === 'WARN') {
    console.warn(logPayload);
  } else {
    console.log(logPayload);
  }

  // 2. Persist to Google Sheet _SystemHealthLog tab if available
  try {
    var sheets = _sheetsModule || (typeof recordHealthLog === 'function' ? { recordHealthLog: recordHealthLog } : null);
    if (sheets && typeof sheets.recordHealthLog === 'function') {
      sheets.recordHealthLog(entry);
    }
  } catch (_) {}

  // 3. Dispatch Google Chat alert for ERROR or CRITICAL
  if (severity === 'ERROR' || severity === 'CRITICAL') {
    try {
      sendGoogleChatAlert(entry);
    } catch (_) {}
  }

  return entry;
}

/**
 * Measures synchronous execution time and logs outcome.
 *
 * @param {string} component
 * @param {string} operationName
 * @param {Function} fn
 * @param {string} [surface]
 * @return {*} Result of fn()
 */
function measure(component, operationName, fn, surface) {
  var start = new Date().getTime();
  try {
    var result = fn();
    var duration = new Date().getTime() - start;
    log('INFO', component, operationName + ' succeeded (' + duration + 'ms)', { durationMs: duration }, null, surface);
    return result;
  } catch (err) {
    var errDuration = new Date().getTime() - start;
    log('ERROR', component, operationName + ' failed (' + errDuration + 'ms): ' + (err.message || err), { durationMs: errDuration }, err, surface);
    throw err;
  }
}

/**
 * Sends a test alert to Google Chat to verify webhook configuration.
 *
 * @param {string} [customUrl] Optional URL to test before saving
 * @return {Object} { success: boolean, message: string }
 */
function sendTestAlert(customUrl) {
  var previousUrl = getWebhookUrl();
  if (customUrl) {
    setWebhookUrl(customUrl);
  }

  var testEntry = {
    traceId: generateTraceId(),
    timestamp: new Date().toISOString(),
    surface: 'gas_addon',
    severity: 'INFO',
    component: 'Diagnostics',
    message: '🎉 Auto-Gifter alert integration test successful! Google Chat alerts are active.'
  };

  var ok = sendGoogleChatAlert(testEntry);

  if (customUrl && !ok) {
    // Revert if temporary test failed
    setWebhookUrl(previousUrl);
  }

  return {
    success: ok,
    message: ok ? 'Test alert delivered to Google Chat.' : 'Could not deliver test alert. Check webhook URL.'
  };
}

var Observability = {
  log: log,
  measure: measure,
  getWebhookUrl: getWebhookUrl,
  setWebhookUrl: setWebhookUrl,
  sendWebhookAlert: sendWebhookAlert,
  sendGoogleChatAlert: sendGoogleChatAlert,
  sendEmailAlert: sendEmailAlert,
  sendTestAlert: sendTestAlert
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Observability;
}
