/**
 * Auto-Gifter Popup Controller
 *
 * Manages the toolbar popup UI: fetches upcoming celebrations,
 * handles gift brand/amount selection, generates live greetings,
 * triggers 1-tap WhatsApp sharing, and configures extension settings.
 */
(function (root, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else {
    var popupModule = factory();
    root.AutoGifterPopup = popupModule;
    if (typeof globalThis !== 'undefined') {
      globalThis.AutoGifterPopup = popupModule;
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  function getCoreEngine() {
    if (typeof AutoGifterCore !== 'undefined') return AutoGifterCore;
    if (typeof window !== 'undefined' && window.AutoGifterCore) return window.AutoGifterCore;
    if (typeof globalThis !== 'undefined' && globalThis.AutoGifterCore) return globalThis.AutoGifterCore;
    try {
      return require('../core/CoreEngine.js');
    } catch (e) {
      try {
        return require('../../shared/CoreEngine.js');
      } catch (err) {
        throw new Error('AutoGifterCore not available');
      }
    }
  }

  function getStorage() {
    if (typeof AutoGifterStorage !== 'undefined') return AutoGifterStorage;
    if (typeof window !== 'undefined' && window.AutoGifterStorage) return window.AutoGifterStorage;
    if (typeof globalThis !== 'undefined' && globalThis.AutoGifterStorage) return globalThis.AutoGifterStorage;
    try {
      return require('../storage.js');
    } catch (e) {
      throw new Error('AutoGifterStorage not available');
    }
  }

  var currentSettings = null;

  function formatCelebrationTypeBadge(type) {
    var lower = String(type || 'birthday').toLowerCase();
    if (lower.indexOf('anniv') !== -1) {
      return { label: '💍 Anniversary', className: 'anniversary' };
    }
    if (lower.indexOf('mile') !== -1) {
      return { label: '🎈 Milestone', className: 'milestone' };
    }
    return { label: '🎂 Birthday', className: 'birthday' };
  }

  function openExternalUrl(url) {
    if (typeof window !== 'undefined' && window.__testEnv && window.__testEnv.openedUrls) {
      window.__testEnv.openedUrls.push(url);
    }
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: url });
      return;
    }
    if (typeof window !== 'undefined' && window.open) {
      window.open(url, '_blank');
    }
  }

  function renderCelebrationCard(item, container) {
    var core = getCoreEngine();
    var recipientName = item.recipientName || 'Friend';
    var celebrationType = item.celebrationType || 'birthday';
    var eventDate = item.date || item.eventDate || '';
    var daysUntil = item.daysUntil !== undefined ? item.daysUntil : null;

    var catalog = core.LEGACY_BRANDS || core.getCatalog();
    var selectedBrandId = item.suggestedBrandId || (catalog.length > 0 ? catalog[0].id : 'starbucks');
    var selectedAmount = item.suggestedAmount || 25;
    var selectedTone = 'warm';

    var card = document.createElement('article');
    card.className = 'celebration-card';
    card.dataset.id = item.id || '';

    // Card Top / Header
    var topRow = document.createElement('div');
    topRow.className = 'card-top';

    var recipientInfo = document.createElement('div');
    recipientInfo.className = 'card-recipient-info';
    var nameHeading = document.createElement('h3');
    nameHeading.textContent = recipientName;
    var dateSpan = document.createElement('span');
    dateSpan.className = 'card-date';
    dateSpan.textContent = eventDate + (daysUntil !== null ? ' (in ' + daysUntil + 'd)' : '');
    recipientInfo.appendChild(nameHeading);
    recipientInfo.appendChild(dateSpan);

    var badgeInfo = formatCelebrationTypeBadge(celebrationType);
    var typeBadge = document.createElement('span');
    typeBadge.className = 'badge-tag ' + badgeInfo.className;
    typeBadge.textContent = badgeInfo.label;

    topRow.appendChild(recipientInfo);
    topRow.appendChild(typeBadge);
    card.appendChild(topRow);

    // FloristOne Flowers Section
    var bestsellers = core.getBestsellers ? core.getBestsellers(celebrationType, 3) : [];
    if (bestsellers && bestsellers.length > 0) {
      var flowerSection = document.createElement('div');
      var flowerLabel = document.createElement('p');
      flowerLabel.className = 'section-label';
      flowerLabel.textContent = 'FloristOne Flowers (1-Click Order to Cart):';
      flowerSection.appendChild(flowerLabel);

      var flowerRow = document.createElement('div');
      flowerRow.className = 'chips-row';
      bestsellers.forEach(function (b) {
        var flowerBtn = document.createElement('a');
        flowerBtn.href = b.cartUrl;
        flowerBtn.setAttribute('href', b.cartUrl);
        flowerBtn.target = '_blank';
        flowerBtn.rel = 'noopener noreferrer';
        flowerBtn.className = 'chip';
        flowerBtn.style.textDecoration = 'none';
        flowerBtn.textContent = '💐 ' + b.name + ' ($' + b.price.toFixed(2) + ')';
        flowerBtn.addEventListener('click', function (e) {
          e.stopPropagation();
        });
        flowerRow.appendChild(flowerBtn);
      });

      var browseUrl = (core && typeof core.getFloristOneBrowseUrl === 'function')
        ? core.getFloristOneBrowseUrl()
        : 'https://www.floristone.com/index.cfm?source_id=aff&affiliateid=2026097209';
      var moreFlowerBtn = document.createElement('a');
      moreFlowerBtn.href = browseUrl;
      moreFlowerBtn.setAttribute('href', browseUrl);
      moreFlowerBtn.target = '_blank';
      moreFlowerBtn.rel = 'noopener noreferrer';
      moreFlowerBtn.className = 'chip chip-more';
      moreFlowerBtn.style.textDecoration = 'none';
      moreFlowerBtn.textContent = '🎁 Browse All Other Gifts & Flowers';
      moreFlowerBtn.addEventListener('click', function (e) {
        e.stopPropagation();
      });
      flowerRow.appendChild(moreFlowerBtn);

      flowerSection.appendChild(flowerRow);
      card.appendChild(flowerSection);
    }

    container.appendChild(card);
    return card;
  }

  var PAGE_SIZE = 8;
  var currentLimit = PAGE_SIZE;
  var loadedCelebrations = [];

  function renderCelebrationsPage() {
    var celebrationsList = document.getElementById('celebrationsList');
    var emptyState = document.getElementById('emptyState');
    var loadMoreContainer = document.getElementById('loadMoreContainer');
    var loadMoreBtn = document.getElementById('loadMoreBtn');

    if (celebrationsList) celebrationsList.innerHTML = '';

    if (!loadedCelebrations || loadedCelebrations.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      if (loadMoreContainer) loadMoreContainer.classList.add('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    var toDisplay = loadedCelebrations.slice(0, currentLimit);
    if (celebrationsList) {
      toDisplay.forEach(function (item) {
        renderCelebrationCard(item, celebrationsList);
      });
    }

    if (loadMoreContainer && loadMoreBtn) {
      if (loadedCelebrations.length > currentLimit) {
        var remaining = loadedCelebrations.length - currentLimit;
        var nextCount = Math.min(PAGE_SIZE, remaining);
        loadMoreBtn.textContent = '📅 Load More Celebrations (+' + nextCount + ' of ' + remaining + ')';
        loadMoreContainer.classList.remove('hidden');
      } else {
        loadMoreContainer.classList.add('hidden');
      }
    }
  }

  async function refreshCelebrations(customFetcher, forceRefresh) {
    var storage = getStorage();
    var statusPill = document.getElementById('statusPill');
    var loadingIndicator = document.getElementById('loadingIndicator');

    // Only show loading indicator if we don't already have data displayed
    if (loadingIndicator && loadedCelebrations.length === 0) {
      loadingIndicator.classList.remove('hidden');
    }

    var result = await storage.loadCelebrations(customFetcher, forceRefresh);

    if (statusPill) {
      if (result.celebrations && result.celebrations.length > 0) {
        statusPill.textContent = '● Calendar Ready';
        statusPill.className = 'status-pill connected';
        statusPill.title = 'Active calendar events loaded';
      } else {
        statusPill.textContent = '● Ready to Sync';
        statusPill.className = 'status-pill connected';
        statusPill.title = 'Click Sync to scan your Google Calendar';
      }
    }

    if (loadingIndicator) loadingIndicator.classList.add('hidden');

    loadedCelebrations = result.celebrations || [];
    renderCelebrationsPage();

    return result;
  }

  async function savePopupSettings() {
    var storage = getStorage();
    var feedbackBox = document.getElementById('connectionFeedback');

    var r14 = document.getElementById('remind14d');
    var r7 = document.getElementById('remind7d');
    var r3 = document.getElementById('remind3d');
    var r1 = document.getElementById('remind1d');

    var reminders = [];
    if (r14 && r14.checked) reminders.push(14);
    if (r7 && r7.checked) reminders.push(7);
    if (r3 && r3.checked) reminders.push(3);
    if (r1 && r1.checked) reminders.push(1);

    if (reminders.length === 0) {
      reminders = [7, 3]; // fallback to defaults if none checked
    }

    var gchatInput = document.getElementById('gchatWebhookInput');
    var gchatWebhookUrl = gchatInput ? gchatInput.value.trim() : '';

    await storage.saveSettings({
      reminders: reminders,
      gchatWebhookUrl: gchatWebhookUrl
    });

    if (feedbackBox) {
      feedbackBox.className = 'feedback-box success';
      feedbackBox.style.display = 'block';
      feedbackBox.textContent = '✓ Reminder settings saved successfully.';
      setTimeout(function () {
        if (feedbackBox) feedbackBox.style.display = 'none';
      }, 3000);
    }
  }

  function setupDrawerEvents() {
    var settingsToggleBtn = document.getElementById('settingsToggleBtn');
    var closeSettingsBtn = document.getElementById('closeSettingsBtn');
    var settingsDrawer = document.getElementById('settingsDrawer');
    var saveSettingsBtn = document.getElementById('saveSettingsBtn');
    var loadMoreBtn = document.getElementById('loadMoreBtn');
    var exportDiagnosticsBtn = document.getElementById('exportDiagnosticsBtn');
    var testAlertBtn = document.getElementById('testAlertBtn');

    if (settingsToggleBtn && settingsDrawer) {
      settingsToggleBtn.addEventListener('click', function () {
        settingsDrawer.classList.toggle('hidden');
      });
    }

    if (closeSettingsBtn && settingsDrawer) {
      closeSettingsBtn.addEventListener('click', function () {
        settingsDrawer.classList.add('hidden');
      });
    }

    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', function () {
        savePopupSettings();
      });
    }

    if (exportDiagnosticsBtn) {
      exportDiagnosticsBtn.addEventListener('click', async function () {
        try {
          var telemetry = (typeof AutoGifterTelemetry !== 'undefined') ? AutoGifterTelemetry : null;
          if (!telemetry && typeof require !== 'undefined') {
            try { telemetry = require('../core/telemetry.js'); } catch (_) {}
          }
          if (telemetry && telemetry.exportDiagnosticsJson) {
            var jsonStr = await telemetry.exportDiagnosticsJson();
            var blob = new Blob([jsonStr], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'autogifter-diagnostics-' + new Date().toISOString().slice(0, 10) + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        } catch (e) {
          console.warn('Diagnostics export error:', e);
        }
      });
    }

    if (testAlertBtn) {
      testAlertBtn.addEventListener('click', async function () {
        var gchatInput = document.getElementById('gchatWebhookInput');
        var webhookUrl = gchatInput ? gchatInput.value.trim() : '';
        var feedbackBox = document.getElementById('connectionFeedback');

        if (!webhookUrl) {
          if (feedbackBox) {
            feedbackBox.className = 'feedback-box error';
            feedbackBox.style.display = 'block';
            feedbackBox.textContent = 'Please enter a Google Chat Webhook URL first.';
          }
          return;
        }

        testAlertBtn.disabled = true;
        testAlertBtn.textContent = '⏳ Sending...';

        try {
          var storage = getStorage();
          var settings = await storage.getSettings();
          var gasUrl = settings.gasWebAppUrl;

          if (gasUrl) {
            var res = await fetch(gasUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'test_alert', url: webhookUrl })
            });
            var data = await res.json();
            if (feedbackBox) {
              feedbackBox.className = data.status === 'ok' ? 'feedback-box success' : 'feedback-box error';
              feedbackBox.style.display = 'block';
              feedbackBox.textContent = data.message || 'Alert sent to Google Chat!';
            }
          } else {
            var res = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json; charset=UTF-8' },
              body: JSON.stringify({
                text: '🚨 Auto-Gifter Extension Test Alert delivered directly to Google Chat!'
              })
            });
            if (feedbackBox) {
              feedbackBox.className = 'feedback-box success';
              feedbackBox.style.display = 'block';
              feedbackBox.textContent = '✓ Direct test alert sent to Google Chat!';
            }
          }
        } catch (err) {
          if (feedbackBox) {
            feedbackBox.className = 'feedback-box error';
            feedbackBox.style.display = 'block';
            feedbackBox.textContent = 'Failed to send alert: ' + (err.message || err);
          }
        } finally {
          testAlertBtn.disabled = false;
          testAlertBtn.textContent = '🚨 Test Alert';
        }
      });
    }

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', function () {
        currentLimit += PAGE_SIZE;
        renderCelebrationsPage();
      });
    }

    var syncAllEventsBtn = document.getElementById('syncAllEventsBtn');
    if (syncAllEventsBtn) {
      syncAllEventsBtn.addEventListener('click', function () {
        handleSyncAllEvents();
      });
    }
  }

  function updateSyncProgress(pct, statusText) {
    var container = document.getElementById('syncProgressContainer');
    var bar = document.getElementById('syncProgressBar');
    var pctElem = document.getElementById('syncProgressPercent');
    var statusElem = document.getElementById('syncProgressStatus');

    if (container && container.classList.contains('hidden')) {
      container.classList.remove('hidden');
    }
    if (bar) bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
    if (pctElem) pctElem.textContent = Math.round(pct) + '%';
    if (statusElem && statusText) statusElem.textContent = statusText;
  }

  function hideSyncProgress() {
    var container = document.getElementById('syncProgressContainer');
    if (container) {
      container.classList.add('hidden');
    }
  }

  async function handleSyncAllEvents() {
    var storage = getStorage();
    var syncBtn = document.getElementById('syncAllEventsBtn');
    var syncFeedback = document.getElementById('syncFeedback');

    if (syncFeedback) {
      syncFeedback.className = 'sync-feedback info';
      syncFeedback.textContent = '⏳ Calendar sync in progress...';
      syncFeedback.classList.remove('hidden');
    }
    if (syncBtn) syncBtn.disabled = true;

    // Start animated progress
    var currentPct = 5;
    updateSyncProgress(currentPct, '🔍 Scanning Google Calendar (30 days)...');

    var progressInterval = setInterval(function () {
      if (currentPct < 30) {
        currentPct += 4;
        updateSyncProgress(currentPct, '🔍 Scanning Google Calendar (30 days)...');
      } else if (currentPct < 65) {
        currentPct += 3;
        updateSyncProgress(currentPct, '🌸 Matching celebrations & birthdays...');
      } else if (currentPct < 92) {
        currentPct += 1.5;
        updateSyncProgress(currentPct, '⏰ Applying reminder alerts & gift links...');
      }
    }, 400);

    try {
      var res = await storage.syncAllCelebrations(30);
      clearInterval(progressInterval);

      if (res.ok) {
        updateSyncProgress(100, '✨ Sync complete!');
        var enrichedCount = (res.data && res.data.sync && res.data.sync.enriched) || 0;
        var scannedCount = (res.data && res.data.sync && res.data.sync.scanned) || 0;
        var syncEvents = (res.data && res.data.sync && res.data.sync.events) || [];
        loadedCelebrations = syncEvents;
        renderCelebrationsPage();

        if (syncFeedback) {
          syncFeedback.className = 'sync-feedback success';
          if (enrichedCount > 0) {
            syncFeedback.textContent = '✓ Synced! ' + enrichedCount + ' celebration(s) found in Google Calendar.';
          } else {
            syncFeedback.textContent = '✓ Scan complete: No upcoming celebration events found in open Google Calendar tabs.';
          }
        }
        await refreshCelebrations(undefined, true);
        setTimeout(hideSyncProgress, 2500);
      } else {
        clearInterval(progressInterval);
        hideSyncProgress();
        if (syncFeedback) {
          syncFeedback.className = 'sync-feedback error';
          syncFeedback.textContent = 'Sync issue: ' + (res.error || 'Make sure Google Calendar is open in a tab.');
        }
      }
    } catch (err) {
      clearInterval(progressInterval);
      hideSyncProgress();
      if (syncFeedback) {
        syncFeedback.className = 'sync-feedback error';
        syncFeedback.textContent = 'Error: ' + (err.message || String(err));
      }
    } finally {
      clearInterval(progressInterval);
      if (syncBtn) syncBtn.disabled = false;
    }
  }

  async function init() {
    var storage = getStorage();

    // 1. Instant 0ms synchronous render from cache
    var fastCached = storage.getCachedCelebrations();
    if (Array.isArray(fastCached) && fastCached.length > 0) {
      loadedCelebrations = fastCached;
      renderCelebrationsPage();
    }

    var settings = await storage.getSettings();
    currentSettings = settings;

    // Populate reminder checkboxes
    var reminders = Array.isArray(settings.reminders) ? settings.reminders : [7, 3];
    var r14 = document.getElementById('remind14d');
    var r7 = document.getElementById('remind7d');
    var r3 = document.getElementById('remind3d');
    var r1 = document.getElementById('remind1d');

    if (r14) r14.checked = reminders.indexOf(14) !== -1;
    if (r7) r7.checked = reminders.indexOf(7) !== -1;
    if (r3) r3.checked = reminders.indexOf(3) !== -1;
    if (r1) r1.checked = reminders.indexOf(1) !== -1;

    var gchatInput = document.getElementById('gchatWebhookInput');
    if (gchatInput && settings.gchatWebhookUrl) {
      gchatInput.value = settings.gchatWebhookUrl;
    }

    setupDrawerEvents();
    await refreshCelebrations();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  return {
    init: init,
    refreshCelebrations: refreshCelebrations,
    handleSyncAllEvents: handleSyncAllEvents,
    savePopupSettings: savePopupSettings,
    renderCelebrationCard: renderCelebrationCard,
    renderCelebrationsPage: renderCelebrationsPage,
    formatCelebrationTypeBadge: formatCelebrationTypeBadge
  };
});
