/**
 * Auto-Gifter Storage & Settings Helper (Pure Client-Side Architecture)
 *
 * Manages configuration and celebration caching in chrome.storage.local / chrome.storage.sync.
 * Zero external server dependencies and zero fake/demo data fallback.
 */
(function (root, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else {
    var storageModule = factory();
    root.AutoGifterStorage = storageModule;
    if (typeof globalThis !== 'undefined') {
      globalThis.AutoGifterStorage = storageModule;
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var DEFAULT_SETTINGS = {
    affiliateTag: 'autogifter-20',
    defaultTone: 'warm',
    reminders: [7, 3],
    floristAffiliateId: '2026097209'
  };

  // In-memory cache for fast synchronous retrieval
  var memoryStorage = {};
  var cachedCelebrationsData = null;

  // Pre-load from localStorage if available (instant synchronous lookup)
  try {
    if (typeof localStorage !== 'undefined') {
      var rawCached = localStorage.getItem('autogifter_cached_celebrations');
      if (rawCached) {
        var parsedCached = JSON.parse(rawCached);
        if (Array.isArray(parsedCached) && parsedCached.length > 0) {
          cachedCelebrationsData = parsedCached;
        }
      }
    }
  } catch (_) {}

  function getCachedCelebrations() {
    if (cachedCelebrationsData && Array.isArray(cachedCelebrationsData)) {
      return cachedCelebrationsData;
    }
    try {
      if (typeof localStorage !== 'undefined') {
        var raw = localStorage.getItem('autogifter_cached_celebrations');
        if (raw) {
          var parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            cachedCelebrationsData = parsed;
            return parsed;
          }
        }
      }
    } catch (_) {}
    return null;
  }

  function getCachedCelebrationsAsync() {
    return new Promise(function (resolve) {
      var mem = getCachedCelebrations();
      if (mem && mem.length > 0) {
        resolve(mem);
        return;
      }
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['autogifter_cached_celebrations'], function (res) {
          var data = res && res.autogifter_cached_celebrations;
          if (Array.isArray(data) && data.length > 0) {
            cachedCelebrationsData = data;
            resolve(data);
          } else {
            resolve([]);
          }
        });
      } else {
        resolve([]);
      }
    });
  }

  function saveCachedCelebrations(events) {
    var toSave = Array.isArray(events) ? events : [];
    cachedCelebrationsData = toSave;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('autogifter_cached_celebrations', JSON.stringify(toSave));
      }
    } catch (_) {}
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ 'autogifter_cached_celebrations': toSave }, function () {});
      }
    } catch (_) {}
  }

  function isChromeStorageAvailable() {
    return typeof chrome !== 'undefined' &&
      chrome.storage &&
      (chrome.storage.sync || chrome.storage.local);
  }

  function getSettings() {
    return new Promise(function (resolve) {
      var localData = null;
      var syncData = null;
      var webLocalData = null;

      try {
        if (typeof localStorage !== 'undefined') {
          var raw = localStorage.getItem('autogifter_settings');
          if (raw) webLocalData = JSON.parse(raw);
        }
      } catch (_) {}

      if (typeof chrome === 'undefined' || !chrome.storage) {
        var merged = Object.assign({}, DEFAULT_SETTINGS, memoryStorage, webLocalData || {});
        if (!Array.isArray(merged.reminders)) merged.reminders = [7, 3];
        resolve(merged);
        return;
      }

      var localPending = true;
      var syncPending = true;

      function checkComplete() {
        if (!localPending && !syncPending) {
          var result = Object.assign(
            {},
            DEFAULT_SETTINGS,
            memoryStorage,
            webLocalData || {},
            localData || {},
            syncData || {}
          );
          if (!Array.isArray(result.reminders)) {
            result.reminders = [7, 3];
          }
          resolve(result);
        }
      }

      if (chrome.storage.local) {
        chrome.storage.local.get(['affiliateTag', 'defaultTone', 'demoMode', 'reminders', 'floristAffiliateId'], function (res) {
          if (!chrome.runtime || !chrome.runtime.lastError) {
            localData = res || null;
          }
          localPending = false;
          checkComplete();
        });
      } else {
        localPending = false;
      }

      if (chrome.storage.sync) {
        chrome.storage.sync.get(['affiliateTag', 'defaultTone', 'demoMode', 'reminders', 'floristAffiliateId'], function (res) {
          if (!chrome.runtime || !chrome.runtime.lastError) {
            syncData = res || null;
          }
          syncPending = false;
          checkComplete();
        });
      } else {
        syncPending = false;
      }

      setTimeout(function () {
        if (localPending || syncPending) {
          localPending = false;
          syncPending = false;
          checkComplete();
        }
      }, 500);
    });
  }

  function saveSettings(settings) {
    return new Promise(function (resolve) {
      getSettings().then(function (existing) {
        var toSave = Object.assign({}, DEFAULT_SETTINGS, existing, settings);
        cachedCelebrationsData = null;
        Object.assign(memoryStorage, toSave);

        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('autogifter_settings', JSON.stringify(toSave));
          }
        } catch (_) {}

        if (typeof chrome !== 'undefined' && chrome.storage) {
          if (chrome.storage.local) {
            chrome.storage.local.set(toSave, function () {});
          }
          if (chrome.storage.sync) {
            chrome.storage.sync.set(toSave, function () {
              resolve(toSave);
            });
            return;
          }
        }
        resolve(toSave);
      });
    });
  }

  function clearSettings() {
    return new Promise(function (resolve) {
      cachedCelebrationsData = null;
      memoryStorage = {};
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('autogifter_settings');
          localStorage.removeItem('autogifter_cached_celebrations');
        }
      } catch (_) {}
      if (typeof chrome !== 'undefined' && chrome.storage) {
        if (chrome.storage.local) chrome.storage.local.clear(function () {});
        if (chrome.storage.sync) {
          chrome.storage.sync.clear(function () {
            resolve();
          });
          return;
        }
      }
      resolve();
    });
  }

  /**
   * Records a gift sent locally in chrome.storage.local
   */
  async function logGiftSent(giftRecord) {
    var record = Object.assign({}, giftRecord, {
      timestamp: new Date().toISOString(),
      id: (giftRecord && giftRecord.id) || ('gift-' + Date.now())
    });

    try {
      if (typeof localStorage !== 'undefined') {
        var existingRaw = localStorage.getItem('autogifter_gift_history');
        var history = existingRaw ? JSON.parse(existingRaw) : [];
        history.unshift(record);
        localStorage.setItem('autogifter_gift_history', JSON.stringify(history));
      }
    } catch (_) {}

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise(function (resolve) {
        chrome.storage.local.get(['autogifter_gift_history'], function (res) {
          var history = (res && res.autogifter_gift_history) || [];
          history.unshift(record);
          chrome.storage.local.set({ autogifter_gift_history: history }, function () {
            resolve({ ok: true, record: record });
          });
        });
      });
    }

    return { ok: true, record: record };
  }

  /**
   * Retrieves gift history from local storage
   */
  async function getCelebrationHistory() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise(function (resolve) {
        chrome.storage.local.get(['autogifter_gift_history'], function (res) {
          var history = (res && res.autogifter_gift_history) || [];
          resolve(history);
        });
      });
    }
    try {
      if (typeof localStorage !== 'undefined') {
        var raw = localStorage.getItem('autogifter_gift_history');
        if (raw) return JSON.parse(raw);
      }
    } catch (_) {}
    return [];
  }

  /**
   * Safely parses JSON response (retained for backward compatibility and test suites)
   */
  async function parseJsonResponse(response) {
    var text = '';
    if (typeof response.text === 'function') {
      text = await response.text();
    } else if (typeof response.json === 'function') {
      return await response.json();
    }

    if (!text || typeof text !== 'string') {
      throw new Error('Empty response from server');
    }

    var trimmed = text.trim();
    if (trimmed.startsWith('<')) {
      if (
        trimmed.indexOf('accounts.google.com') !== -1 ||
        trimmed.indexOf('ServiceLogin') !== -1 ||
        trimmed.indexOf('הרשאת גישה') !== -1 ||
        trimmed.indexOf('permission') !== -1 ||
        trimmed.indexOf('drive-logo') !== -1 ||
        trimmed.indexOf('request-access') !== -1
      ) {
        throw new Error('Google Apps Script permission denied. Please deploy your Apps Script Web App with "Execute as: Me" and "Who has access: Anyone".');
      }
      throw new Error('Google Apps Script returned an HTML page instead of JSON. Check your Web App deployment settings.');
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error('Invalid JSON response: ' + (trimmed.length > 80 ? trimmed.substring(0, 80) + '...' : trimmed));
    }
  }

  /**
   * Test connection helper (pure client-side always ok)
   */
  async function testGasConnection(gasUrl) {
    return { ok: true, status: 'ok' };
  }

  /**
   * Load celebrations: checks local cache first.
   * If cache is empty, returns empty list.
   */
  async function loadCelebrations(liveFetcher) {
    if (typeof liveFetcher === 'function') {
      try {
        var fetched = await liveFetcher();
        var list = Array.isArray(fetched) ? fetched : (fetched && (fetched.events || fetched.celebrations)) || [];
        if (list.length > 0) {
          saveCachedCelebrations(list);
          return {
            source: 'gas',
            celebrations: list
          };
        }
      } catch (_) {}
    }

    var memCached = getCachedCelebrations();
    if (memCached && memCached.length > 0) {
      return {
        source: 'local',
        celebrations: memCached,
        cached: true
      };
    }

    var asyncCached = await getCachedCelebrationsAsync();
    if (asyncCached && asyncCached.length > 0) {
      return {
        source: 'local',
        celebrations: asyncCached,
        cached: true
      };
    }

    return {
      source: 'local',
      celebrations: []
    };
  }

  /**
   * Pure client-side batch sync: queries active Google Calendar tab,
   * or loads locally cached celebrations. Returns empty list if none found.
   */
  async function syncAllCelebrations(days) {
    var syncDays = days || 30;

    // 1. Try querying active Google Calendar tabs in Chrome
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      try {
        var tabs = await new Promise(function (resolve) {
          chrome.tabs.query({ url: '*://calendar.google.com/*' }, function (result) {
            resolve(result || []);
          });
        });

        if (Array.isArray(tabs) && tabs.length > 0 && chrome.tabs.sendMessage) {
          var tabId = tabs[0].id;
          var scanResponse = await new Promise(function (resolve) {
            chrome.tabs.sendMessage(tabId, { action: 'scan_calendar', days: syncDays }, function (res) {
              if (chrome.runtime && chrome.runtime.lastError) {
                resolve(null);
              } else {
                resolve(res);
              }
            });
          });

          if (scanResponse && scanResponse.ok && Array.isArray(scanResponse.celebrations)) {
            var events = scanResponse.celebrations;
            saveCachedCelebrations(events);
            return {
              ok: true,
              data: {
                status: 'ok',
                sync: {
                  scanned: events.length,
                  enriched: events.length,
                  events: events
                }
              }
            };
          }
        }
      } catch (_) {}
    }

    // 2. Check local cached celebrations
    var cached = await getCachedCelebrationsAsync();
    if (Array.isArray(cached) && cached.length > 0) {
      return {
        ok: true,
        data: {
          status: 'ok',
          sync: {
            scanned: cached.length,
            enriched: cached.length,
            events: cached,
            fromCache: true
          }
        }
      };
    }

    // 3. No events found
    saveCachedCelebrations([]);
    return {
      ok: true,
      data: {
        status: 'ok',
        sync: {
          scanned: 0,
          enriched: 0,
          events: []
        }
      }
    };
  }

  return {
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    getSettings: getSettings,
    saveSettings: saveSettings,
    clearSettings: clearSettings,
    getCachedCelebrations: getCachedCelebrations,
    getCachedCelebrationsAsync: getCachedCelebrationsAsync,
    saveCachedCelebrations: saveCachedCelebrations,
    testGasConnection: testGasConnection,
    loadCelebrations: loadCelebrations,
    syncAllCelebrations: syncAllCelebrations,
    logGiftSent: logGiftSent,
    getCelebrationHistory: getCelebrationHistory,
    parseJsonResponse: parseJsonResponse
  };
});
