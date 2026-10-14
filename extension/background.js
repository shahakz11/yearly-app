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

  if (chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      if (message && message.action === 'AUTHORIZE_AND_SYNC') {
        performBackgroundSync(true).then(function (result) {
          if (typeof sendResponse === 'function') sendResponse(result);
        }).catch(function (err) {
          if (typeof sendResponse === 'function') sendResponse({ ok: false, error: (err && err.message) || String(err) });
        });
        return true; // Keep channel open for async response
      }
    });
  }
}

async function performBackgroundSync(interactive) {
  try {
    var storage = (typeof AutoGifterStorage !== 'undefined') ? AutoGifterStorage : null;
    if (!storage && typeof require !== 'undefined') {
      try { storage = require('./storage.js'); } catch (_) {}
    }

    if (storage && storage.fetchCalendarEventsViaOAuth) {
      var isInteractive = interactive === true;
      var res = await storage.fetchCalendarEventsViaOAuth(30, isInteractive);
      if (res && res.ok && res.data && res.data.sync) {
        var events = res.data.sync.events || [];
        var upcomingCount = events.filter(function (e) { return e.daysUntil <= 7; }).length;
        if (typeof chrome !== 'undefined' && chrome.action && chrome.action.setBadgeText) {
          chrome.action.setBadgeText({ text: upcomingCount > 0 ? String(upcomingCount) : '' });
          if (chrome.action.setBadgeBackgroundColor) {
            chrome.action.setBadgeBackgroundColor({ color: '#e11d48' });
          }
        }

        // Notify active Google Calendar tab(s) to show a subtle in-page celebration toast
        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
          chrome.tabs.query({ url: '*://calendar.google.com/*' }, function (tabs) {
            if (Array.isArray(tabs)) {
              tabs.forEach(function (tab) {
                if (tab && tab.id && chrome.tabs.sendMessage) {
                  chrome.tabs.sendMessage(tab.id, {
                    action: 'show_auth_toast',
                    count: events.length
                  }, function () {
                    // Suppress lastError if tab is not receiving
                    if (chrome.runtime && chrome.runtime.lastError) {}
                  });
                }
              });
            }
          });
        }
        return res;
      }
      return res;
    }
  } catch (err) {
    console.warn('[Yearly Background] Sync notice:', err);
    return { ok: false, error: (err && err.message) || String(err) };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    performBackgroundSync: performBackgroundSync,
    ALARM_NAME: ALARM_NAME
  };
}
