/**
 * Auto-Gifter Calendar Content Script (Universal Injection & UI)
 *
 * Scans Google Calendar DOM for celebration events (birthdays, anniversaries, milestones),
 * injects responsive 🎁 badges without breaking calendar layout, and opens a
 * modal with 1-click FloristOne bouquets, gift cards, greeting generator, and 1-tap WhatsApp/Email sharing.
 */
(function (root, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else {
    var contentModule = factory();
    root.AutoGifterContent = contentModule;
    if (typeof globalThis !== 'undefined') {
      globalThis.AutoGifterContent = contentModule;
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

  var EVENT_CHIP_SELECTORS = [
    'div[data-eventid]',
    'div[role="button"][data-eventid]',
    '.FaVP5e',
    '.N4MHg',
    'div[jsname][data-eventid]',
    '.g3dbUc',
    'div[role="button"][data-eventchip]'
  ];

  var currentObserver = null;
  var debounceTimer = null;

  function stripTimeAndDatePrefixes(str) {
    if (!str) return '';
    var s = str.trim();
    // 1. Remove range prefixes with multilingual prepositions:
    // e.g. "De 6pm a 7pm ", "De 18:00 a 19:00 ", "Das 18:00 às 19:00 ", "From 6pm to 7pm ", "Von 18:00 bis 19:00 "
    s = s.replace(/^(?:de|from|von|das|du|בין|מ)\s+\d{1,2}(?::\d{2})?\s*(?:[a-z]{0,2})?\s+(?:a|to|bis|às|à|au|ל|עד|–|-)\s+\d{1,2}(?::\d{2})?\s*(?:[a-z]{0,2})?\s*[,:–—\-]?\s*/i, '');
    // 2. Remove standard time ranges e.g. "6:00pm - 7:00pm ", "18:00 – 19:00 ", "6pm to 7pm "
    s = s.replace(/^\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?\s*(?:[-–—]|to|a)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?\s*[,:–—\-]?\s*/i, '');
    // 3. Remove single time prefix e.g. "6:00 PM, ", "6pm ", "18:00 "
    s = s.replace(/^\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)\s*[,:–—\-]?\s*/i, '');
    s = s.replace(/^\d{1,2}:\d{2}\s*[,:–—\-]?\s*/i, '');
    // 4. Remove leading weekdays e.g. "Wednesday, ", "Mon, "
    s = s.replace(/^(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun|lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\s*[,:–—\-]?\s*/i, '');
    return s.trim();
  }

  function cleanCelebrationTitle(str) {
    if (!str) return '';
    var s = String(str).trim();

    // 1. If comma-separated, inspect segments (Google Calendar aria-label pattern: Title, Attendees, Location, Date)
    if (s.indexOf(',') !== -1) {
      var parts = s.split(/,\s*/);
      var candidate = '';
      for (var i = 0; i < parts.length; i++) {
        var seg = parts[i].trim();
        if (!seg) continue;
        // Skip obvious metadata segments
        if (/^(?:calendario|calendar)\s*:/i.test(seg)) continue;
        if (/^(?:sin ubicación|sin ubicacion|no location|sin invitados|no attendees|organizador|organizer)/i.test(seg)) continue;
        if (isDateOnly(seg) || isTimeOnly(seg)) continue;
        if (/\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i.test(seg)) continue;
        if (/(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i.test(seg)) continue;

        // If this segment has celebration emoji or keyword, prioritize it
        if (/[\uD83C-\uDBFF\uDC00-\uDFFF]|🎂|💍|🎉|🎈|birthday|bday|cumpleaños|anniversary|milestone/i.test(seg)) {
          candidate = seg;
          break;
        }
        if (!candidate && !isMetadataSegment(seg)) {
          candidate = seg;
        }
      }
      s = candidate || parts[0];
    }

    // 2. Strip embedded "Todo el día", "All day", "Allday", "All-day" (even attached to words like "Omer ArvivTodo el día")
    s = s.replace(/(?:todo el d[ií]a|all[\s-]?day)/gi, ' ');

    // 3. Strip time and date prefixes
    s = stripTimeAndDatePrefixes(s);

    // 4. Strip trailing metadata patterns
    s = s.replace(/[\s–—-]+(?:sin ubicación|sin ubicacion|no location|todo el d[ií]a|all[\s-]?day).*$/i, '');
    s = s.replace(/\s+/g, ' ').trim();

    return s;
  }

  function isMetadataSegment(str) {
    if (!str) return true;
    var lower = str.toLowerCase().trim();
    if (lower === 'sin ubicación' || lower === 'sin ubicacion' || lower === 'no location') return true;
    if (lower === 'todo el día' || lower === 'todo el dia' || lower === 'all day' || lower === 'allday') return true;
    if (isDateOnly(lower) || isTimeOnly(lower)) return true;
    return false;
  }

  function extractTitleFromChip(chip) {
    if (!chip) return '';

    // Check specific Google Calendar title elements first
    var titleEl = chip.querySelector('.FA1g1e, .tD12ae, .l9uCfc, .I5hhAf, .WBiqje, .ef2AEc, .g3dbUc, .event-title, .FaVP5e');
    if (titleEl) {
      var text = (titleEl.textContent || '').trim();
      var clean = cleanCelebrationTitle(text);
      if (clean && clean.length >= 2 && !isTimeOnly(clean) && !isDateOnly(clean)) {
        return clean;
      }
    }

    var ariaLabel = chip.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.trim()) {
      var cleanedAria = cleanCelebrationTitle(ariaLabel);
      if (cleanedAria && cleanedAria.length >= 2 && !isTimeOnly(cleanedAria) && !isDateOnly(cleanedAria)) {
        return cleanedAria;
      }
    }

    var textNodes = chip.querySelectorAll('span, div');
    for (var i = 0; i < textNodes.length; i++) {
      var node = textNodes[i];
      if (node.classList && node.classList.contains('autogifter-badge')) continue;
      var t = (node.textContent || '').trim();
      var cleanNode = cleanCelebrationTitle(t);
      if (cleanNode && cleanNode.length >= 2 && !isTimeOnly(cleanNode) && !isDateOnly(cleanNode)) {
        return cleanNode;
      }
    }

    var directText = (chip.textContent || '').trim();
    if (directText) {
      var cleanDirect = cleanCelebrationTitle(directText);
      if (cleanDirect && !isTimeOnly(cleanDirect) && !isDateOnly(cleanDirect)) {
        return cleanDirect;
      }
    }

    return '';
  }

  function cleanAriaLabel(aria) {
    return cleanCelebrationTitle(aria);
  }

  function isTimeOnly(str) {
    return /^(\d{1,2}(:\d{2})?\s*(am|pm|AM|PM)?(\s*[-–]\s*\d{1,2}(:\d{2})?\s*(am|pm|AM|PM)?)?)$/.test(str.trim());
  }

  function isDateOnly(str) {
    return /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday|january|february|march|april|may|june|july|august|september|october|november|december|lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo|\d{1,2}(st|nd|rd|th)?|\d{4})/i.test(str.trim());
  }

  function injectBadge(chip, classification, rawTitle) {
    if (!chip || !classification) return null;

    if (chip.querySelector('.autogifter-badge')) {
      return null;
    }

    var badge = document.createElement('span');
    badge.className = 'autogifter-badge';
    badge.setAttribute('role', 'button');
    badge.setAttribute('tabindex', '0');
    badge.setAttribute('aria-label', 'Yearly: Prepare gift for ' + (classification.recipientName || 'celebration'));
    badge.title = '🎁 Yearly: Send a gift to ' + (classification.recipientName || 'celebrant');
    badge.textContent = '🎁';

    badge.dataset.recipientName = classification.recipientName || '';
    badge.dataset.celebrationType = classification.celebrationType || '';
    badge.dataset.confidenceScore = String(classification.confidenceScore || 0);
    badge.dataset.eventTitle = rawTitle || '';

    badge.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      openGiftModal({
        recipientName: classification.recipientName || 'Friend',
        celebrationType: classification.celebrationType || 'birthday',
        confidenceScore: classification.confidenceScore,
        rawTitle: rawTitle
      });
    });

    badge.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.stopPropagation();
        e.preventDefault();
        badge.click();
      }
    });

    var targetEl = chip.querySelector('.FA1g1e, .tD12ae, .l9uCfc, .I5hhAf, .WBiqje, .ef2AEc, .g3dbUc, .event-title') || chip;
    if (targetEl.firstChild) {
      targetEl.insertBefore(badge, targetEl.firstChild);
    } else {
      targetEl.appendChild(badge);
    }

    chip.setAttribute('data-autogifter-injected', 'true');
    targetEl.setAttribute('data-autogifter-title', 'true');

    return badge;
  }

  function getTelemetry() {
    if (typeof AutoGifterTelemetry !== 'undefined') return AutoGifterTelemetry;
    if (typeof window !== 'undefined' && window.AutoGifterTelemetry) return window.AutoGifterTelemetry;
    if (typeof globalThis !== 'undefined' && globalThis.AutoGifterTelemetry) return globalThis.AutoGifterTelemetry;
    try {
      return require('../core/telemetry.js');
    } catch (e) {
      return null;
    }
  }

  function scanAndInjectBadges(rootElement) {
    var telemetry = getTelemetry();
    var root = rootElement || (typeof document !== 'undefined' ? document.body : null);
    if (!root) return 0;

    function doScan() {
      var selectorStr = EVENT_CHIP_SELECTORS.join(', ');
      var chips = root.querySelectorAll(selectorStr);
      var core = getCoreEngine();
      var injectedCount = 0;

      for (var i = 0; i < chips.length; i++) {
        var chip = chips[i];
        if (chip.querySelector('.autogifter-badge')) {
          continue;
        }

        var title = extractTitleFromChip(chip);
        if (!title) continue;

        var result = core.classifyEvent(title);
        if (result && result.isCelebration) {
          injectBadge(chip, result, title);
          injectedCount++;
        }
      }

      return injectedCount;
    }

    if (telemetry && typeof telemetry.measure === 'function') {
      return telemetry.measure('ContentScript', 'scanAndInjectBadges', doScan);
    }
    return doScan();
  }

  function closeGiftModal() {
    var existing = document.getElementById('autogifter-modal');
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
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

  function openGiftModal(params) {
    closeGiftModal();

    var core = getCoreEngine();
    var recipientName = params.recipientName || 'Friend';
    var celebrationType = params.celebrationType || 'birthday';

    var bestsellers = core.getBestsellers ? core.getBestsellers(celebrationType, 5) : [];
    var selectedItem = bestsellers.length > 0 ? bestsellers[0] : null;
    var selectedItemId = selectedItem ? selectedItem.id : 'B07';

    var backdrop = document.createElement('div');
    backdrop.id = 'autogifter-modal';
    backdrop.className = 'autogifter-modal-backdrop';

    var card = document.createElement('div');
    card.className = 'autogifter-modal-card';
    card.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    // Close button
    var closeBtn = document.createElement('button');
    closeBtn.className = 'autogifter-modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      closeGiftModal();
    });

    // Header: Pure Event Title
    var header = document.createElement('div');
    header.className = 'autogifter-modal-header';
    var cleanTitle = cleanCelebrationTitle(params.rawTitle || '') || (recipientName ? recipientName + "'s Celebration" : 'Celebration');
    if (!cleanTitle || cleanTitle.length < 2) {
      cleanTitle = recipientName || 'Celebration';
    }

    var iconSpan = document.createElement('span');
    iconSpan.className = 'autogifter-modal-icon';
    iconSpan.textContent = celebrationType === 'anniversary' ? '💍' : '🌸';

    var headerTextWrap = document.createElement('div');
    headerTextWrap.className = 'autogifter-modal-header-text';
    var titleH3 = document.createElement('h3');
    titleH3.className = 'autogifter-modal-title';
    titleH3.textContent = cleanTitle;
    var subP = document.createElement('p');
    subP.className = 'autogifter-modal-subtitle';
    subP.textContent = 'Top FloristOne flower bouquets for ' + (recipientName || 'celebration') + ':';
    headerTextWrap.appendChild(titleH3);
    headerTextWrap.appendChild(subP);

    header.appendChild(iconSpan);
    header.appendChild(headerTextWrap);

    // FloristOne Top 5 Bouquets Section
    var bouquetSection = document.createElement('div');
    bouquetSection.className = 'autogifter-section';

    var bouquetsContainer = document.createElement('div');
    bouquetsContainer.className = 'autogifter-bouquets-list';

    bestsellers.forEach(function (item) {
      var itemCard = document.createElement('div');
      itemCard.className = 'autogifter-bouquet-card' + (item.id === selectedItemId ? ' active' : '');
      itemCard.dataset.itemId = item.id;

      // 1. Large Product Image (Visual Hero)
      var imgWrap = document.createElement('div');
      imgWrap.className = 'autogifter-bouquet-img-wrap';
      var thumb = document.createElement('img');
      thumb.className = 'autogifter-bouquet-thumb';
      thumb.src = item.detailImage || item.thumbnailImage;
      thumb.alt = item.name;
      imgWrap.appendChild(thumb);
      itemCard.appendChild(imgWrap);

      // 2. Info column with Name, Price, and secondary short description
      var infoDiv = document.createElement('div');
      infoDiv.className = 'autogifter-bouquet-info';

      var titlePriceRow = document.createElement('div');
      titlePriceRow.className = 'autogifter-bouquet-head-row';

      var nameDiv = document.createElement('div');
      nameDiv.className = 'autogifter-bouquet-name';
      nameDiv.textContent = item.name;

      var priceDiv = document.createElement('div');
      priceDiv.className = 'autogifter-bouquet-price';
      priceDiv.textContent = '$' + item.price.toFixed(2);

      titlePriceRow.appendChild(nameDiv);
      titlePriceRow.appendChild(priceDiv);
      infoDiv.appendChild(titlePriceRow);

      if (item.description) {
        var descDiv = document.createElement('div');
        descDiv.className = 'autogifter-bouquet-desc';
        descDiv.textContent = item.description;
        infoDiv.appendChild(descDiv);
      }

      // 3. CTA Button (clean label without price duplication)
      var actionRow = document.createElement('div');
      actionRow.className = 'autogifter-bouquet-action-row';

      var orderLink = document.createElement('a');
      orderLink.href = item.cartUrl;
      orderLink.setAttribute('href', item.cartUrl);
      orderLink.target = '_blank';
      orderLink.rel = 'noopener noreferrer';
      orderLink.className = 'autogifter-btn-order';
      orderLink.textContent = '🛒 Order on FloristOne';
      orderLink.addEventListener('click', function (e) {
        e.stopPropagation();
      });
      actionRow.appendChild(orderLink);
      infoDiv.appendChild(actionRow);

      itemCard.appendChild(infoDiv);

      // Accordion click handler: click active collapses it, click another expands it
      itemCard.addEventListener('click', function (e) {
        if (selectedItemId === item.id) {
          selectedItemId = null;
          selectedItem = null;
        } else {
          selectedItemId = item.id;
          selectedItem = item;
        }
        updateBouquetSelection();
      });

      bouquetsContainer.appendChild(itemCard);
    });
    bouquetSection.appendChild(bouquetsContainer);

    function updateBouquetSelection() {
      var cards = bouquetsContainer.querySelectorAll('.autogifter-bouquet-card');
      for (var i = 0; i < cards.length; i++) {
        if (selectedItemId && cards[i].dataset.itemId === selectedItemId) {
          cards[i].classList.add('active');
        } else {
          cards[i].classList.remove('active');
        }
      }
    }

    card.appendChild(closeBtn);
    card.appendChild(header);
    card.appendChild(bouquetSection);

    // Browse all other flowers and gifts link
    var browseUrl = (core && typeof core.getFloristOneBrowseUrl === 'function')
      ? core.getFloristOneBrowseUrl()
      : 'https://www.floristone.com/index.cfm?source_id=aff&affiliateid=2026097209';
    var browseFooter = document.createElement('div');
    browseFooter.className = 'autogifter-modal-footer';
    var browseLink = document.createElement('a');
    browseLink.href = browseUrl;
    browseLink.setAttribute('href', browseUrl);
    browseLink.target = '_blank';
    browseLink.rel = 'noopener noreferrer';
    browseLink.className = 'autogifter-browse-all-link';
    browseLink.textContent = '💐 Browse All Other Flowers & Gifts on FloristOne';
    browseLink.addEventListener('click', function (e) {
      e.stopPropagation();
    });
    browseFooter.appendChild(browseLink);

    var disclosureNote = document.createElement('div');
    disclosureNote.className = 'autogifter-modal-disclosure';
    disclosureNote.innerHTML = '<span class="autogifter-disclosure-icon" aria-hidden="true">ℹ️</span> Yearly is free &amp; supported by affiliate partnerships. We may earn a commission on qualifying purchases at no extra cost to you.';
    browseFooter.appendChild(disclosureNote);

    card.appendChild(browseFooter);

    backdrop.appendChild(card);

    document.body.appendChild(backdrop);
    return backdrop;
  }

  function initCalendarObserver(targetNode) {
    if (currentObserver) {
      currentObserver.disconnect();
      currentObserver = null;
    }

    var target = targetNode || (typeof document !== 'undefined' ? document.body : null);
    if (!target) return null;

    if (typeof MutationObserver !== 'undefined') {
      currentObserver = new MutationObserver(function (mutations) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          scanAndInjectBadges(target);
        }, 150);
      });

      currentObserver.observe(target, {
        childList: true,
        subtree: true
      });
    }

    scanAndInjectBadges(target);
    return currentObserver;
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        initCalendarObserver();
      });
    } else {
      initCalendarObserver();
    }
  }

  return {
    extractTitleFromChip: extractTitleFromChip,
    injectBadge: injectBadge,
    scanAndInjectBadges: scanAndInjectBadges,
    openGiftModal: openGiftModal,
    closeGiftModal: closeGiftModal,
    initCalendarObserver: initCalendarObserver
  };
});
