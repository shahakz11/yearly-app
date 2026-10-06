/**
 * Auto-Gifter Storage & Settings Helper
 *
 * Manages configuration in chrome.storage.sync with automatic
 * offline and unconfigured fallback to demoCelebrations.
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

  var DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbxj8A8nR6GWPae55H78tCM9g5d_pwzA7zMsdlcGAl6C8zdyjBBLVsV3Cwvy0vhwmtcI/exec';

  var DEFAULT_SETTINGS = {
    gasWebAppUrl: DEFAULT_GAS_URL,
    affiliateTag: 'autogifter-20',
    defaultTone: 'warm',
    reminders: [7, 3],
    gchatWebhookUrl: ''
  };

  // In-memory cache for fast retrieval
  var memoryStorage = {};
  var cachedCelebrationsData = null;
  var lastFetchTime = 0;

  // Pre-load from localStorage if available (instant synchronous 0ms lookup)
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
    if (!Array.isArray(events)) return;
    cachedCelebrationsData = events;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('autogifter_cached_celebrations', JSON.stringify(events));
      }
    } catch (_) {}
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ 'autogifter_cached_celebrations': events }, function () {});
      }
    } catch (_) {}
  }

  function isChromeStorageAvailable() {
    return typeof chrome !== 'undefined' &&
      chrome.storage &&
      chrome.storage.sync;
  }

  function getSettings() {
    return new Promise(function (resolve) {
      var localData = null;
      var syncData = null;
      var webLocalData = null;

      // Read synchronous web localStorage first
      try {
        if (typeof localStorage !== 'undefined') {
          var raw = localStorage.getItem('autogifter_settings');
          if (raw) webLocalData = JSON.parse(raw);
        }
      } catch (_) {}

      // If chrome.storage is not available, return web localStorage or in-memory
      if (typeof chrome === 'undefined' || !chrome.storage) {
        var merged = Object.assign({}, DEFAULT_SETTINGS, memoryStorage, webLocalData || {});
        if (!merged.gasWebAppUrl) merged.gasWebAppUrl = DEFAULT_GAS_URL;
        if (!Array.isArray(merged.reminders)) merged.reminders = [7, 3];
        resolve(merged);
        return;
      }

      // Query both local and sync
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
          if (!result.gasWebAppUrl) {
            result.gasWebAppUrl = (localData && localData.gasWebAppUrl) ||
              (webLocalData && webLocalData.gasWebAppUrl) ||
              DEFAULT_GAS_URL;
          }
          if (!Array.isArray(result.reminders)) {
            result.reminders = [7, 3];
          }
          resolve(result);
        }
      }

      if (chrome.storage.local) {
        chrome.storage.local.get(['gasWebAppUrl', 'affiliateTag', 'defaultTone', 'demoMode', 'reminders'], function (res) {
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
        chrome.storage.sync.get(['gasWebAppUrl', 'affiliateTag', 'defaultTone', 'demoMode', 'reminders'], function (res) {
          if (!chrome.runtime || !chrome.runtime.lastError) {
            syncData = res || null;
          }
          syncPending = false;
          checkComplete();
        });
      } else {
        syncPending = false;
      }

      // Safety timeout in case callback never fires
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
        cachedCelebrationsData = null; // Invalidate cache on settings change
        Object.assign(memoryStorage, toSave);

        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('autogifter_settings', JSON.stringify(toSave));
          }
        } catch (_) {}

        // Sync reminders with GAS backend so Add-on and weekly triggers reflect this immediately
        if (toSave.gasWebAppUrl && Array.isArray(toSave.reminders)) {
          try {
            var sep = toSave.gasWebAppUrl.indexOf('?') === -1 ? '?' : '&';
            fetch(toSave.gasWebAppUrl + sep + 'action=save_settings&reminders=' + encodeURIComponent(toSave.reminders.join(',')), { method: 'GET' }).catch(function () {});
          } catch (_) {}
        }

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

  function getDemoCelebrations() {
    // Return a deep copy of demo celebrations
    return JSON.parse(JSON.stringify(FALLBACK_DEMO_CELEBRATIONS));
  }

  /**
   * Safely parses JSON response from GAS with clear diagnostics for HTML / auth redirect responses.
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
   * Test connection to Google Apps Script Web App.
   */
  async function testGasConnection(gasUrl) {
    if (!gasUrl || typeof gasUrl !== 'string' || !gasUrl.trim()) {
      return { ok: false, error: 'No URL provided' };
    }
    try {
      var fetchUrl = gasUrl.trim();
      var separator = fetchUrl.indexOf('?') === -1 ? '?' : '&';
      fetchUrl += separator + 'action=ping';

      var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var timeoutId = controller ? setTimeout(function () { controller.abort(); }, 8000) : null;

      var response = await fetch(fetchUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller ? controller.signal : undefined
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        return { ok: false, error: 'HTTP status ' + response.status };
      }

      var data = await parseJsonResponse(response);
      if (data && (data.status === 'ok' || data.service)) {
        return { ok: true, data: data };
      }
      return { ok: false, error: 'Unexpected response from GAS' };
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : String(err) };
    }
  }

  /**
   * Load celebrations:
   * - Checks local memory / localStorage / chrome.storage.local cache first
   * - If not in cache, fetches from GAS endpoint
   * - Saves fetched celebrations to persistent cache
   */
  async function loadCelebrations(gasFetcher) {
    // 1. Instant check of local cache
    var memCached = getCachedCelebrations();
    if (memCached && memCached.length > 0 && !gasFetcher) {
      return {
        source: 'gas',
        celebrations: memCached,
        cached: true
      };
    }

    var asyncCached = await getCachedCelebrationsAsync();
    if (asyncCached && asyncCached.length > 0 && !gasFetcher) {
      return {
        source: 'gas',
        celebrations: asyncCached,
        cached: true
      };
    }

    var settings = await getSettings();
    var gasUrl = (settings.gasWebAppUrl || '').trim();

    if (!gasUrl) {
      return {
        source: 'gas',
        celebrations: []
      };
    }

    try {
      if (typeof gasFetcher === 'function') {
        var fetched = await gasFetcher(gasUrl);
        var eventsList = Array.isArray(fetched) ? fetched : (fetched && (fetched.events || fetched.celebrations)) || [];
        saveCachedCelebrations(eventsList);
        return {
          source: 'gas',
          celebrations: eventsList
        };
      }

      // Default fetch implementation with 10s timeout
      var fetchUrl = gasUrl;
      var separator = fetchUrl.indexOf('?') === -1 ? '?' : '&';
      fetchUrl += separator + 'action=events&days=30';

      var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var timeoutId = controller ? setTimeout(function () { controller.abort(); }, 10000) : null;

      var response = await fetch(fetchUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller ? controller.signal : undefined
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('HTTP status ' + response.status);
      }

      var data = await parseJsonResponse(response);
      var celebrations = data.events || data.celebrations || (Array.isArray(data) ? data : []);
      if (Array.isArray(celebrations)) {
        saveCachedCelebrations(celebrations);
      }

      return {
        source: 'gas',
        celebrations: celebrations
      };
    } catch (err) {
      var fallback = getCachedCelebrations() || [];
      return {
        source: 'gas',
        fallbackReason: err.message,
        celebrations: fallback
      };
    }
  }

  /**
   * Triggers batch sync of calendar celebrations on Google Apps Script backend.
   */
  async function syncAllCelebrations(days) {
    var settings = await getSettings();
    var gasUrl = (settings.gasWebAppUrl || '').trim();
    if (!gasUrl) {
      return { ok: false, error: 'No GAS Web App URL configured.' };
    }

    try {
      var syncDays = days || 30;
      var remindersParam = (Array.isArray(settings.reminders) && settings.reminders.length > 0)
        ? settings.reminders.join(',')
        : '7,3';

      var separator = gasUrl.indexOf('?') === -1 ? '?' : '&';
      var fetchUrl = gasUrl + separator + 'action=sync_all&days=' + syncDays + '&reminders=' + encodeURIComponent(remindersParam);

      var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var timeoutId = controller ? setTimeout(function () {
        if (controller) {
          try {
            controller.abort();
          } catch (_) {}
        }
      }, 60000) : null;

      var response = await fetch(fetchUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller ? controller.signal : undefined
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('HTTP status ' + response.status);
      }

      var data = await parseJsonResponse(response);
      var events = (data && data.sync && data.sync.events) || [];
      if (Array.isArray(events) && events.length > 0) {
        saveCachedCelebrations(events);
      }
      return { ok: true, data: data };
    } catch (err) {
      var errMsg = err && err.message ? err.message : String(err);
      if (err && (err.name === 'AbortError' || errMsg.indexOf('abort') !== -1)) {
        errMsg = 'Sync request timed out after 60s. The script may still be processing in the background.';
      }
      return { ok: false, error: errMsg };
    }
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
    syncAllCelebrations: syncAllCelebrations
  };
});
