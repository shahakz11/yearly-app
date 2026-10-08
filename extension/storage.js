/**
 * Auto-Gifter Storage & Settings Helper (Pure Client-Side Architecture)
 *
 * Direct Google Calendar OAuth2 integration via chrome.identity (getAuthToken + launchWebAuthFlow)
 * with fallback to in-tab DOM scanning. Zero external server dependencies.
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

  var OAUTH_CLIENT_MAP = {
    'bgdgkpagkiklhpphioaoncmiajeglfeg': '729862306327-jfbak715o5bep9nhsd19uiqt3135raqf.apps.googleusercontent.com',
    'lhifmijfheppabhbjphipdeafeklnpnn': '729862306327-an80jd949sgt4j0crmleunlhm024ffd6.apps.googleusercontent.com'
  };

  function getOAuthClientId() {
    var runtimeId = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) ? chrome.runtime.id : '';
    if (runtimeId && OAUTH_CLIENT_MAP[runtimeId]) {
      return OAUTH_CLIENT_MAP[runtimeId];
    }
    return '729862306327-jfbak715o5bep9nhsd19uiqt3135raqf.apps.googleusercontent.com';
  }

  function getCoreEngine() {
    if (typeof AutoGifterCore !== 'undefined') return AutoGifterCore;
    if (typeof window !== 'undefined' && window.AutoGifterCore) return window.AutoGifterCore;
    if (typeof globalThis !== 'undefined' && globalThis.AutoGifterCore) return globalThis.AutoGifterCore;
    try {
      return require('./core/CoreEngine.js');
    } catch (e) {
      try {
        return require('../shared/CoreEngine.js');
      } catch (err) {
        return null;
      }
    }
  }

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
   * Load celebrations: checks local cache first unless forceRefresh is set.
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
   * Robust Google OAuth token acquisition with fallback from getAuthToken to launchWebAuthFlow
   */
  async function getGoogleAuthToken(interactive) {
    var isInteractive = interactive !== false;
    var lastErrorMessage = '';

    // 1. Try native getAuthToken
    if (typeof chrome !== 'undefined' && chrome.identity && chrome.identity.getAuthToken) {
      var nativeToken = await new Promise(function (resolve) {
        chrome.identity.getAuthToken({ interactive: isInteractive }, function (authToken) {
          if (chrome.runtime && chrome.runtime.lastError) {
            lastErrorMessage = chrome.runtime.lastError.message || '';
            console.warn('[Yearly] getAuthToken notice:', lastErrorMessage);
            resolve(null);
          } else {
            resolve(authToken);
          }
        });
      });

      if (nativeToken) {
        return { ok: true, token: nativeToken };
      }
    }

    // 2. Try launchWebAuthFlow (universal fallback across dev & production extension IDs)
    if (typeof chrome !== 'undefined' && chrome.identity && chrome.identity.launchWebAuthFlow && isInteractive) {
      try {
        var extId = (chrome.runtime && chrome.runtime.id) || 'lhifmijfheppabhbjphipdeafeklnpnn';
        var redirectUrl = (chrome.identity.getRedirectURL ? chrome.identity.getRedirectURL() : ('https://' + extId + '.chromiumapp.org/'));
        var scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.events.readonly');
        var clientId = getOAuthClientId();
        var authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' +
          'client_id=' + encodeURIComponent(clientId) +
          '&response_type=token' +
          '&redirect_uri=' + encodeURIComponent(redirectUrl) +
          '&scope=' + scope +
          '&prompt=consent';

        var responseUrl = await new Promise(function (resolve) {
          chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, function (resUrl) {
            if (chrome.runtime && chrome.runtime.lastError) {
              lastErrorMessage = chrome.runtime.lastError.message || lastErrorMessage;
              console.warn('[Yearly] launchWebAuthFlow notice:', lastErrorMessage);
              resolve(null);
            } else {
              resolve(resUrl);
            }
          });
        });

        if (responseUrl) {
          var hash = responseUrl.split('#')[1] || responseUrl.split('?')[1] || '';
          var params = new URLSearchParams(hash);
          var token = params.get('access_token');
          if (token) {
            return { ok: true, token: token };
          }
        }
      } catch (err) {
        console.warn('[Yearly] launchWebAuthFlow exception:', err);
      }
    }

    return {
      ok: false,
      error: lastErrorMessage ? ('Google authorization: ' + lastErrorMessage) : 'Google Calendar authorization could not be completed.'
    };
  }

  /**
   * Triggers Google OAuth authentication and fetches events directly from Google Calendar REST API.
   */
  async function fetchCalendarEventsViaOAuth(days, interactive) {
    var authRes = await getGoogleAuthToken(interactive);
    if (!authRes.ok || !authRes.token) {
      return { ok: false, error: authRes.error || 'Google authorization was not completed.' };
    }

    var token = authRes.token;

    try {
      var syncDays = days || 30;
      var now = new Date();
      // Cover today's events across all time zones
      var startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      var timeMin = startOfToday.toISOString();
      var maxDate = new Date(now.getTime() + (syncDays * 24 * 60 * 60 * 1000));
      var timeMax = maxDate.toISOString();

      var apiUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?' +
        'singleEvents=true&orderBy=startTime&maxResults=250' +
        '&timeMin=' + encodeURIComponent(timeMin) +
        '&timeMax=' + encodeURIComponent(timeMax);

      var response = await fetch(apiUrl, {
        headers: {
          'Authorization': 'Bearer ' + token,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401 && chrome.identity && chrome.identity.removeCachedAuthToken) {
          chrome.identity.removeCachedAuthToken({ token: token }, function () {});
        }
        return { ok: false, error: 'Google Calendar API error (HTTP ' + response.status + ')' };
      }

      var data = await response.json();
      var items = (data && data.items) || [];
      var core = getCoreEngine();
      var celebrations = [];
      var seenKeys = {};

      var settings = await getSettings();
      var activeReminders = Array.isArray(settings.reminders) && settings.reminders.length > 0 ? settings.reminders : [7, 3];
      var floristAffiliateId = settings.floristAffiliateId || '2026097209';

      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var title = (item.summary || '').trim();
        var description = (item.description || '').trim();
        if (!title) continue;

        var result = core ? core.classifyEvent(title, description) : { isCelebration: /birthday|anniversary|milestone|🎂|💍|🎉|🎈/i.test(title) };
        if (result && result.isCelebration) {
          var rName = (result.recipientName || result.name || title.replace(/'s.*/i, '')).trim();
          var cType = result.celebrationType || result.type || 'birthday';
          var startDate = '';
          var isAllDay = true;
          if (item.start) {
            startDate = item.start.date || (item.start.dateTime ? item.start.dateTime.split('T')[0] : '');
            isAllDay = !item.start.dateTime;
          }

          var dedupKey = item.id || (rName + '_' + cType + '_' + startDate);
          if (seenKeys[dedupKey]) continue;
          seenKeys[dedupKey] = true;

          var daysUntil = 0;
          if (startDate) {
            var targetDate = new Date(startDate);
            var diffMs = targetDate.getTime() - now.getTime();
            daysUntil = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
          }

          var catalog = (core && (core.LEGACY_BRANDS || (core.getCatalog ? core.getCatalog() : []))) || [];
          var suggestedBrand = catalog.length > 0 ? catalog[0].id : 'starbucks';

          celebrations.push({
            id: item.id || ('gcal-' + i),
            recipientName: rName || 'Friend',
            celebrationType: cType,
            rawTitle: title,
            suggestedBrandId: suggestedBrand,
            suggestedAmount: 25,
            date: startDate || new Date().toISOString().split('T')[0],
            daysUntil: daysUntil
          });

          // Enrich event description & apply reminders directly in Google Calendar
          if (item.id && core && core.buildEnrichedEventDescription) {
            try {
              var reminderOverrides = activeReminders.map(function (d) {
                var mins = isAllDay ? ((d * 24 - 11) * 60) : (d * 24 * 60);
                return { method: 'popup', minutes: Math.max(1, mins) };
              });

              var updatedDescription = core.buildEnrichedEventDescription({
                recipientName: rName,
                celebrationType: cType,
                existingNotes: description,
                affiliateId: floristAffiliateId
              });

              var patchUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary/events/' + encodeURIComponent(item.id);
              await fetch(patchUrl, {
                method: 'PATCH',
                headers: {
                  'Authorization': 'Bearer ' + token,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  description: updatedDescription,
                  reminders: {
                    useDefault: false,
                    overrides: reminderOverrides
                  }
                })
              });
            } catch (patchErr) {
              console.warn('[Yearly] Event enrich notice:', item.id, patchErr);
            }
          }
        }
      }

      celebrations.sort(function (a, b) {
        return a.daysUntil - b.daysUntil;
      });

      saveCachedCelebrations(celebrations);
      return {
        ok: true,
        data: {
          status: 'ok',
          sync: {
            scanned: items.length,
            enriched: celebrations.length,
            events: celebrations
          }
        }
      };
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : String(err) };
    }
  }

  /**
   * Pure client-side batch sync:
   * 1. Triggers direct Google Calendar API OAuth sync via chrome.identity
   * 2. Fallback to active Google Calendar tab DOM scan
   * 3. Fallback to cached celebrations
   */
  async function syncAllCelebrations(days) {
    var syncDays = days || 30;
    var oauthError = '';

    // 1. Primary: Direct Google Calendar API with OAuth
    if (typeof chrome !== 'undefined' && chrome.identity) {
      try {
        var oauthResult = await fetchCalendarEventsViaOAuth(syncDays, true);
        if (oauthResult && oauthResult.ok) {
          return oauthResult;
        } else if (oauthResult && oauthResult.error) {
          oauthError = oauthResult.error;
        }
      } catch (err) {
        oauthError = err && err.message ? err.message : String(err);
      }
    }

    // 2. Secondary: Query active Google Calendar tabs in Chrome
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

          if (scanResponse && scanResponse.ok && Array.isArray(scanResponse.celebrations) && scanResponse.celebrations.length > 0) {
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

    // 3. Tertiary: Check local cached celebrations
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

    // 4. Return clear error diagnostic
    return {
      ok: false,
      error: oauthError || 'Could not connect to Google Calendar. Please grant Google Calendar permissions or open calendar.google.com in a tab.'
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
    getGoogleAuthToken: getGoogleAuthToken,
    fetchCalendarEventsViaOAuth: fetchCalendarEventsViaOAuth,
    syncAllCelebrations: syncAllCelebrations,
    logGiftSent: logGiftSent,
    getCelebrationHistory: getCelebrationHistory,
    parseJsonResponse: parseJsonResponse
  };
});
