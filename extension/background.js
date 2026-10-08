/**
 * Yearly Extension Background Service Worker (Manifest V3)
 *
 * Runs scheduled daily/weekly background calendar syncs via chrome.alarms.
 * Silently refreshes Google OAuth tokens, scans upcoming celebrations (30-day rolling window),
 * enriches descriptions with FloristOne bouquet links, and schedules Google Calendar reminder alarms.
 */
try {
  importScripts('core/CoreEngine.js', 'storage.js');
} catch (e) {
  // Module environment fallback
}

var ALARM_NAME = 'yearly_periodic_sync';

if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onInstalled.addListener(function () {
    if (chrome.alarms) {
      chrome.alarms.create(ALARM_NAME, {
        periodInMinutes: 1440 // Daily 24-hour rolling sync
      });
    }
    performBackgroundSync();
  });

  if (chrome.runtime.onStartup) {
    chrome.runtime.onStartup.addListener(function () {
      if (chrome.alarms) {
        chrome.alarms.get(ALARM_NAME, function (alarm) {
          if (!alarm) {
            chrome.alarms.create(ALARM_NAME, {
              periodInMinutes: 1440
            });
          }
        });
      }
      performBackgroundSync();
    });
  }

  if (chrome.alarms && chrome.alarms.onAlarm) {
    chrome.alarms.onAlarm.addListener(function (alarm) {
      if (alarm && alarm.name === ALARM_NAME) {
        performBackgroundSync();
      }
    });
  }
}

async function performBackgroundSync() {
  try {
    var storage = (typeof AutoGifterStorage !== 'undefined') ? AutoGifterStorage : null;
    if (!storage && typeof require !== 'undefined') {
      try { storage = require('./storage.js'); } catch (_) {}
    }

    if (storage && storage.fetchCalendarEventsViaOAuth) {
      var res = await storage.fetchCalendarEventsViaOAuth(30, false);
      if (res && res.ok && res.data && res.data.sync) {
        var events = res.data.sync.events || [];
        var upcomingCount = events.filter(function (e) { return e.daysUntil <= 7; }).length;
        if (typeof chrome !== 'undefined' && chrome.action && chrome.action.setBadgeText) {
          chrome.action.setBadgeText({ text: upcomingCount > 0 ? String(upcomingCount) : '' });
          if (chrome.action.setBadgeBackgroundColor) {
            chrome.action.setBadgeBackgroundColor({ color: '#e11d48' });
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Yearly Background] Sync notice:', err);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    performBackgroundSync: performBackgroundSync,
    ALARM_NAME: ALARM_NAME
  };
}
