const fs = require('fs');
const path = require('path');

const catalogJson = fs.readFileSync(path.join(__dirname, '../shared/catalog.json'), 'utf8');

const engineCode = `/**
 * Auto-Gifter Universal Core Engine Bundle
 * Dual-surface bundle for Google Apps Script, Chrome Extension, and Node.js.
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.AutoGifterCore = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : this, function () {
  "use strict";

  var FLORIST_ONE_AFFILIATE_ID = "2026097209";
  var DEFAULT_AFFILIATE_ID = "autogifter-20";
  var STANDARD_AMOUNTS = [15, 25, 50, 100];

  var LEGACY_BRANDS = [
    {
      id: "starbucks",
      name: "Starbucks",
      category: "Coffee & Treats",
      tagline: "Treat them to their favorite coffee or pastry",
      logoEmoji: "☕",
      primaryColor: "#006241",
      supportedAmounts: [15, 25, 50, 100],
      defaultAmount: 25,
      affiliateUrlTemplate: "https://www.starbucks.com/gift?amount={amount}&subId={subId}&tag={affiliateId}&recipient={recipientName}"
    },
    {
      id: "doordash",
      name: "DoorDash",
      category: "Food Delivery",
      tagline: "Dinner on you from thousands of local restaurants",
      logoEmoji: "🍔",
      primaryColor: "#FF3008",
      supportedAmounts: [15, 25, 50, 100],
      defaultAmount: 25,
      affiliateUrlTemplate: "https://www.doordash.com/gift-cards?amount={amount}&subId={subId}&tag={affiliateId}&recipient={recipientName}"
    },
    {
      id: "amazon",
      name: "Amazon",
      category: "Everything",
      tagline: "Millions of items delivered right to their door",
      logoEmoji: "📦",
      primaryColor: "#FF9900",
      supportedAmounts: [15, 25, 50, 100],
      defaultAmount: 50,
      affiliateUrlTemplate: "https://www.amazon.com/gift-cards?amount={amount}&subId={subId}&tag={affiliateId}&recipient={recipientName}"
    },
    {
      id: "target",
      name: "Target",
      category: "Retail & Home",
      tagline: "Expect more. Pay less. Perfect for any celebration",
      logoEmoji: "🎯",
      primaryColor: "#CC0000",
      supportedAmounts: [15, 25, 50, 100],
      defaultAmount: 25,
      affiliateUrlTemplate: "https://www.target.com/gift-cards?amount={amount}&subId={subId}&tag={affiliateId}&recipient={recipientName}"
    }
  ];

  var CATALOG_BY_OCCASION = ` + catalogJson + `;

  var STOP_WORDS = {
    "wedding": true, "annual": true, "happy": true, "our": true, "my": true,
    "the": true, "a": true, "an": true, "first": true, "1st": true, "second": true,
    "2nd": true, "third": true, "3rd": true, "fourth": true, "4th": true,
    "fifth": true, "5th": true, "tenth": true, "10th": true, "25th": true,
    "50th": true, "surprise": true, "special": true, "reminder": true,
    "notice": true, "alert": true, "birthday": true, "bday": true, "b-day": true,
    "anniversary": true, "office": true, "company": true, "work": true,
    "virtual": true, "friend": true, "family": true, "team": true,
    "celebration": true, "party": true, "milestone": true, "event": true,
    "dinner": true, "lunch": true, "breakfast": true, "drinks": true, "gathering": true,
    "notes": true, "note": true, "יום": true, "הולדת": true, "יומולדת": true,
    "נישואין": true, "נישואים": true, "של": true, "ל": true
  };

  var NEGATIVE_KEYWORDS = [
    "standup", "sync", "meeting", "appointment", "doctor", "dentist",
    "1:1", "one-on-one", "retro", "retrospective", "planning", "sprint",
    "interview", "review", "call", "demo", "flight", "hotel", "check-in",
    "checkout", "service", "vet", "oil change", "workout", "gym", "exam",
    "all-hands", "touchpoint"
  ];

  var BIRTHDAY_KEYWORD_RE = /\\b(b(irth)?day|b-day|bday|born|cumpleaños|cumple|anniversaire|geburtstag|compleanno)\\b|יום\\s*הולדת|יומולדת|יום-הולדת/i;
  var BIRTHDAY_EMOJI_RE = /[\\u{1F382}\\u{1F388}\\u{1F370}\\u{1F389}]/u;

  var ANNIVERSARY_KEYWORD_RE = /\\b(anniversary|anniv|wedding|years together|wedding day|aniversario|jubiläum)\\b|יום\\s*נישואין|יום\\s*נישואים/i;
  var ANNIVERSARY_EMOJI_RE = /[\\u{1F48D}\\u{1F942}\\u{1F491}\\u{1F492}\\u{2764}]/u;

  var VALENTINES_KEYWORD_RE = /\\b(valentine'?s?\\s*day|valentines\\s*day|val\\s*day|valentine'?s?)\\b|יום\\s*האהבה|ולנטיין/iu;
  var VALENTINES_EMOJI_RE = /[\\u{1F496}\\u{1F498}\\u{1F49D}\\u{1F48B}\\u{1F339}]/u;

  var MOTHERS_DAY_KEYWORD_RE = /\\b(mother'?s?\\s*day|mom'?s?\\s*day|mothers\\s*day)\\b|יום\\s*האם|יום\\s*המשפחה/iu;
  var MOTHERS_DAY_EMOJI_RE = /[\\u{1F931}]/u;

  var FATHERS_DAY_KEYWORD_RE = /\\b(father'?s?\\s*day|dad'?s?\\s*day|fathers\\s*day)\\b|יום\\s*האב/iu;
  var FATHERS_DAY_EMOJI_RE = /[\\u{1F454}]/u;

  var THANKSGIVING_KEYWORD_RE = /\\b(thanksgiving(?: day)?|turkey day|friendsgiving)\\b|חג\\s*ההודיה/iu;
  var THANKSGIVING_EMOJI_RE = /[\\u{1F983}\\u{1F342}\\u{1F37D}]/u;

  var CHRISTMAS_KEYWORD_RE = /\\b(christmas(?: eve| day)?|xmas|yuletide|holiday season|winter holiday)\\b|חג\\s*המולד|כריסמס/iu;
  var CHRISTMAS_EMOJI_RE = /[\\u{1F384}\\u{2744}\\u{1F385}\\u{1F381}]/u;

  var EASTER_KEYWORD_RE = /\\b(easter(?: sunday)?|good friday|pascha)\\b|פסחא/iu;
  var EASTER_EMOJI_RE = /[\\u{1F430}\\u{1F95A}\\u{1F423}]/u;

  var HALLOWEEN_KEYWORD_RE = /\\b(halloween|trick or treat|all hallows)\\b|ליל\\s*כל\\s*הקדושים/iu;
  var HALLOWEEN_EMOJI_RE = /[\\u{1F383}\\u{1F47B}\\u{1F578}]/u;

  var INDEPENDENCE_KEYWORD_RE = /\\b(4th of july|fourth of july|independence day|memorial day|labor day|veterans day)\\b/iu;
  var INDEPENDENCE_EMOJI_RE = /[\\u{1F1FA}\\u{1F1F8}\\u{1F386}\\u{1F387}]/u;

  var NEW_YEAR_KEYWORD_RE = /\\b(new year'?s?(?: eve| day)?|happy new year|rosh hashanah)\\b|שנה\\s*אזרחית\\s*חדשה|נובי\\s*גוד|ראש\\s*השנה/iu;

  var MILESTONE_KEYWORD_RE = /\\b(graduation|baby shower|retirement|housewarming|promotion|new baby|engaged|engagement|milestone|get well|thank you|sympathy|celebration)\\b/i;
  var MILESTONE_EMOJI_RE = /[\\u{1F393}\\u{1F476}\\u{1F3E1}\\u{1F37E}\\u{2728}]/u;

  var EMOJI_STRIP_RE = /[\\u{1F300}-\\u{1F9FF}\\u{2600}-\\u{27BF}\\u{1F600}-\\u{1F64F}\\u{1FA00}-\\u{1FAFF}]/gu;
  var ZERO_WIDTH_RE = /[\\u200B-\\u200D\\uFEFF]/g;
  var NAME_CHARS = "A-Za-z0-9\\\\u00C0-\\\\u024F\\\\u1E00-\\\\u1EFF\\\\u0590-\\\\u05FF\\\\u0400-\\\\u04FF\\\\u0600-\\\\u06FF\\\\s&'\\\\-";

  function cleanAndValidateName(raw) {
    if (!raw) return null;
    var cleaned = raw
      .replace(ZERO_WIDTH_RE, "")
      .replace(EMOJI_STRIP_RE, " ")
      .replace(/[’\`]/g, "'")
      .replace(new RegExp("[^" + NAME_CHARS + "]", "g"), "")
      .trim();

    cleaned = cleaned
      .replace(/^(?:de|from|von|das|du|בין|מ)\\s+\\d{1,2}(?::\\d{2})?\\s*(?:[a-z]{0,2})?\\s+(?:a|to|bis|às|à|au|ל|עד|–|-)\\s+\\d{1,2}(?::\\d{2})?\\s*(?:[a-z]{0,2})?\\s*[,:–—\\-]?\\s*/i, "")
      .replace(/^\\d{1,2}(?::\\d{2})?\\s*(?:am|pm|AM|PM)?\\s*(?:[-–—]|to|a)\\s*\\d{1,2}(?::\\d{2})?\\s*(?:am|pm|AM|PM)?\\s*[,:–—\\-]?\\s*/i, "")
      .replace(/^\\d{1,2}(?::\\d{2})?\\s*(?:am|pm|AM|PM)\\s*[,:–—\\-]?\\s*/i, "")
      .replace(/^\\d{1,2}:\\d{2}\\s*[,:–—\\-]?\\s*/i, "")
      .trim();

    cleaned = cleaned
      .replace(/^(and|with|for|celebrating|celebrate|honoring|honor|של|ל)\\s+/i, "")
      .replace(/\\s+(and|with|for|של|ל)$/i, "")
      .replace(/^[~*#_!@$%^+=|:;,.?\\-\\s]+/, "")
      .replace(/[~*#_!@$%^+=|:;,.?\\-\\s]+$/, "")
      .trim();

    if (!cleaned || cleaned.length < 2) return null;

    var lower = cleaned.toLowerCase();
    if (STOP_WORDS[lower]) return null;

    var tokens = lower.split(/\\s+/);
    var allStopWords = true;
    for (var i = 0; i < tokens.length; i++) {
      if (!STOP_WORDS[tokens[i]]) {
        allStopWords = false;
        break;
      }
    }
    if (allStopWords) return null;

    for (var j = 0; j < tokens.length; j++) {
      if (NEGATIVE_KEYWORDS.indexOf(tokens[j]) !== -1) return null;
    }

    return cleaned;
  }

  function extractRecipientNameFromLine(line) {
    if (!line) return null;
    var cleanLine = line
      .replace(ZERO_WIDTH_RE, "")
      .replace(EMOJI_STRIP_RE, " ")
      .replace(/[’\`]/g, "'")
      .trim();

    cleanLine = cleanLine
      .replace(/^[~*#_!@$%^+=|:;,.?\\-\\s]+/, "")
      .replace(/^\\[[^\\]]*\\]\\s*/, "")
      .replace(/^(?:de|from|von|das|du|בין|מ)\\s+\\d{1,2}(?::\\d{2})?\\s*(?:[a-z]{0,2})?\\s+(?:a|to|bis|às|à|au|ל|עד|–|-)\\s+\\d{1,2}(?::\\d{2})?\\s*(?:[a-z]{0,2})?\\s*[,:–—\\-]?\\s*/i, "")
      .replace(/^\\d{1,2}(?::\\d{2})?\\s*(?:am|pm|AM|PM)?\\s*(?:[-–—]|to|a)\\s*\\d{1,2}(?::\\d{2})?\\s*(?:am|pm|AM|PM)?\\s*[,:–—\\-]?\\s*/i, "")
      .replace(/^\\d{1,2}(?::\\d{2})?\\s*(?:am|pm|AM|PM)\\s*[,:–—\\-]?\\s*/i, "")
      .replace(/^\\d{1,2}:\\d{2}\\s*[,:–—\\-]?\\s*/i, "")
      .replace(/^(?:special|reminder|notice|alert|event|note|notes|calendar)\\s*[:–—\\-]\\s*/i, "")
      .replace(/^[~*#_!@$%^+=|:;,.?\\-\\s]+/, "")
      .trim();

    var hebrewMatch = cleanLine.match(/(?:יום\\s*הולדת|יומולדת|יום-הולדת|יום\\s*נישואין|יום\\s*נישואים)\\s+(?:ל|של)?\\s*([^(\\[,;]+)/i);
    if (hebrewMatch && hebrewMatch[1]) {
      var candHeb = hebrewMatch[1].split(/\\s*[(,;]/)[0];
      var vHeb = cleanAndValidateName(candHeb);
      if (vHeb) return vHeb;
    }

    var possessiveMatch = cleanLine.match(/^(.*?)(?:'s)\\s+(?:(?:\\d+(?:st|nd|rd|th)?\\s+)?(?:birthday|bday|b-day|anniversary|wedding|celebration|party|baby shower|baby|shower|graduation|retirement|promotion|housewarming|milestone))/i);
    if (possessiveMatch && possessiveMatch[1]) {
      var v1 = cleanAndValidateName(possessiveMatch[1]);
      if (v1) return v1;
    }

    var happyMatch = cleanLine.match(/^happy\\s+(?:(?:\\d+(?:st|nd|rd|th)?\\s+)?(?:birthday|bday|anniversary))\\s*[,:–—\\-]?\\s*([^!?.~*]+)/i);
    if (happyMatch && happyMatch[1]) {
      var vHappy = cleanAndValidateName(happyMatch[1]);
      if (vHappy) return vHappy;
    }

    var markerMatch = cleanLine.match(/(?:birthday|bday|b-day|anniversary|wedding|party|celebration|baby shower|baby|shower|graduation|retirement|promotion|housewarming|milestone)\\s+(?:for|of|with|celebrating)\\s+([^\\n]+)/i);
    if (markerMatch && markerMatch[1]) {
      var cand2 = markerMatch[1].split(/\\s+(?:organized|hosted|planned|at|in|on|from)\\s+|\\s*[(,;]/i)[0];
      var v2 = cleanAndValidateName(cand2);
      if (v2) return v2;
    }

    var suffixDelimMatch = cleanLine.match(/(?:birthday|bday|b-day|anniversary|celebration|baby shower|baby|shower|graduation|retirement|milestone|יום\\s*הולדת|יומולדת)\\s*[:–—\\-]\\s*([^\\n]+)/i);
    if (suffixDelimMatch && suffixDelimMatch[1]) {
      var cand3a = suffixDelimMatch[1].split(/\\s+(?:organized|hosted|planned|at|in|on|from)\\s+|\\s*[(,;]/i)[0];
      var v3a = cleanAndValidateName(cand3a);
      if (v3a) return v3a;
    }

    var prefixDelimMatch = cleanLine.match(/^([^\\n:]+?)\\s*[:–—\\-]\\s*(?:(?:\\d+(?:st|nd|rd|th)?\\s+)?(?:birthday|bday|b-day|anniversary|celebration|baby shower|baby|shower|graduation|retirement|milestone|יום\\s*הולדת|יומולדת))/i);
    if (prefixDelimMatch && prefixDelimMatch[1]) {
      var v3b = cleanAndValidateName(prefixDelimMatch[1]);
      if (v3b) return v3b;
    }

    var leadingMatch = cleanLine.match(/^([^\\n]+?)\\s+(?:birthday|bday|anniversary|celebration|graduation)/i);
    if (leadingMatch && leadingMatch[1]) {
      var v4 = cleanAndValidateName(leadingMatch[1]);
      if (v4) return v4;
    }

    var nameKeyValueMatch = cleanLine.match(/^(?:name|recipient|guest of honor|honoree|for)\\s*[:–—\\-]\\s*([A-Za-z0-9\\s&'-]+)/i);
    if (nameKeyValueMatch && nameKeyValueMatch[1]) {
      var vKv = cleanAndValidateName(nameKeyValueMatch[1]);
      if (vKv) return vKv;
    }

    if (!/(?:birthday|bday|b-day|anniversary|celebration|party|milestone|event|dinner|lunch|location|reserved|table|budget|cake|drinks|wear|quad)/i.test(cleanLine)) {
      if (/^[A-Za-z\\u00C0-\\u024F\\u1E00-\\u1EFF\\u0590-\\u05FF\\s&'-]+$/.test(cleanLine)) {
        var vDirect = cleanAndValidateName(cleanLine);
        if (vDirect) return vDirect;
      }
    }

    return null;
  }

  function extractRecipientName(text) {
    if (!text) return null;
    var clean = text.replace(ZERO_WIDTH_RE, "");
    var lines = clean.split(/\\r?\\n+/);
    for (var i = 0; i < lines.length; i++) {
      var name = extractRecipientNameFromLine(lines[i]);
      if (name) return name;
    }
    return null;
  }

  function classifyEvent(title, notes) {
    var safeTitle = (title || "").replace(ZERO_WIDTH_RE, "").trim();
    var cleanedNotes = cleanExistingNotes(notes || "");
    var safeNotes = cleanedNotes.replace(ZERO_WIDTH_RE, "").trim();
    var combined = (safeTitle + " " + safeNotes).trim();

    if (!combined) {
      return {
        isCelebration: false,
        celebrationType: null,
        recipientName: null,
        confidenceScore: 0
      };
    }

    var celebrationType = null;
    var matchedKeyword = "";
    var baseConfidence = 0.90;
    var occasionCategory = "everyday";

    if (BIRTHDAY_KEYWORD_RE.test(safeTitle) || BIRTHDAY_EMOJI_RE.test(safeTitle) || BIRTHDAY_KEYWORD_RE.test(combined) || BIRTHDAY_EMOJI_RE.test(combined)) {
      celebrationType = "birthday";
      occasionCategory = "birthday";
      var kwB = combined.match(BIRTHDAY_KEYWORD_RE);
      var emB = combined.match(BIRTHDAY_EMOJI_RE);
      matchedKeyword = kwB ? kwB[0] : (emB ? emB[0] : "birthday");
    } else if (ANNIVERSARY_KEYWORD_RE.test(safeTitle) || ANNIVERSARY_EMOJI_RE.test(safeTitle) || ANNIVERSARY_KEYWORD_RE.test(combined) || ANNIVERSARY_EMOJI_RE.test(combined)) {
      celebrationType = "anniversary";
      occasionCategory = "anniversary";
      var kwA = combined.match(ANNIVERSARY_KEYWORD_RE);
      var emA = combined.match(ANNIVERSARY_EMOJI_RE);
      matchedKeyword = kwA ? kwA[0] : (emA ? emA[0] : "anniversary");
    } else if (VALENTINES_KEYWORD_RE.test(combined) || VALENTINES_EMOJI_RE.test(combined)) {
      celebrationType = "valentines";
      occasionCategory = "love";
      matchedKeyword = "Valentine's Day";
    } else if (MOTHERS_DAY_KEYWORD_RE.test(combined) || MOTHERS_DAY_EMOJI_RE.test(combined)) {
      celebrationType = "mothers_day";
      occasionCategory = "mothers_day";
      matchedKeyword = "Mother's Day";
    } else if (FATHERS_DAY_KEYWORD_RE.test(combined) || FATHERS_DAY_EMOJI_RE.test(combined)) {
      celebrationType = "fathers_day";
      occasionCategory = "everyday";
      matchedKeyword = "Father's Day";
    } else if (CHRISTMAS_KEYWORD_RE.test(combined) || CHRISTMAS_EMOJI_RE.test(combined)) {
      celebrationType = "christmas";
      occasionCategory = "holiday";
      matchedKeyword = "Christmas";
    } else if (THANKSGIVING_KEYWORD_RE.test(combined) || THANKSGIVING_EMOJI_RE.test(combined)) {
      celebrationType = "thanksgiving";
      occasionCategory = "holiday";
      matchedKeyword = "Thanksgiving";
    } else if (EASTER_KEYWORD_RE.test(combined) || EASTER_EMOJI_RE.test(combined)) {
      celebrationType = "easter";
      occasionCategory = "holiday";
      matchedKeyword = "Easter";
    } else if (HALLOWEEN_KEYWORD_RE.test(combined) || HALLOWEEN_EMOJI_RE.test(combined)) {
      celebrationType = "halloween";
      occasionCategory = "holiday";
      matchedKeyword = "Halloween";
    } else if (INDEPENDENCE_KEYWORD_RE.test(combined) || INDEPENDENCE_EMOJI_RE.test(combined)) {
      celebrationType = "independence_day";
      occasionCategory = "sympathy";
      matchedKeyword = "Independence Day";
    } else if (NEW_YEAR_KEYWORD_RE.test(combined)) {
      celebrationType = "new_year";
      occasionCategory = "holiday";
      matchedKeyword = "New Year's";
    } else if (MILESTONE_KEYWORD_RE.test(combined) || MILESTONE_EMOJI_RE.test(combined)) {
      celebrationType = "milestone";
      occasionCategory = "everyday";
      var kwM = combined.match(MILESTONE_KEYWORD_RE);
      var emM = combined.match(MILESTONE_EMOJI_RE);
      matchedKeyword = kwM ? kwM[0] : (emM ? emM[0] : "milestone");
      baseConfidence = 0.85;
    }

    if (!celebrationType) {
      return {
        isCelebration: false,
        celebrationType: null,
        recipientName: null,
        confidenceScore: 0
      };
    }

    var recipientName = extractRecipientName(safeTitle);
    if (!recipientName && safeNotes) {
      recipientName = extractRecipientName(safeNotes);
    }

    var confidenceScore = recipientName ? Math.min(1.0, baseConfidence + 0.05) : baseConfidence;

    return {
      isCelebration: true,
      celebrationType: celebrationType,
      recipientName: recipientName,
      confidenceScore: confidenceScore,
      matchedKeyword: matchedKeyword,
      occasionCategory: occasionCategory
    };
  }

  function getBestsellers(occasion, limit) {
    var occ = (occasion || "birthday").toLowerCase().trim();
    var lim = (typeof limit === "number" && limit > 0) ? limit : 5;
    var list = CATALOG_BY_OCCASION[occ] || CATALOG_BY_OCCASION["birthday"] || CATALOG_BY_OCCASION["top_overall"] || [];
    return list.slice(0, lim);
  }

  function getFullCatalog() {
    return CATALOG_BY_OCCASION;
  }

  function getCatalog(occasion) {
    if (!occasion) {
      return LEGACY_BRANDS;
    }
    var bestsellers = getBestsellers(occasion, 5);
    var floristBrands = bestsellers.map(function (item) {
      return {
        id: item.id,
        name: item.name,
        category: item.category || "Flowers",
        tagline: item.description.slice(0, 50) + "...",
        logoEmoji: "💐",
        primaryColor: "#E11D48",
        supportedAmounts: [item.price],
        defaultAmount: item.price,
        affiliateUrlTemplate: item.cartUrl,
        cartUrl: item.cartUrl,
        thumbnailImage: item.thumbnailImage,
        detailImage: item.detailImage,
        description: item.description,
        price: item.price
      };
    });
    return LEGACY_BRANDS.concat(floristBrands);
  }

  function getBrand(brandId) {
    if (!brandId) return undefined;
    var lower = String(brandId).toLowerCase().trim();
    for (var i = 0; i < LEGACY_BRANDS.length; i++) {
      if (LEGACY_BRANDS[i].id === lower || LEGACY_BRANDS[i].name.toLowerCase() === lower) {
        return LEGACY_BRANDS[i];
      }
    }
    for (var occ in CATALOG_BY_OCCASION) {
      var items = CATALOG_BY_OCCASION[occ];
      for (var j = 0; j < items.length; j++) {
        if (items[j].id.toLowerCase() === lower) {
          var found = items[j];
          return {
            id: found.id,
            name: found.name,
            category: found.category || "Flowers",
            tagline: found.description.slice(0, 50) + "...",
            logoEmoji: "💐",
            primaryColor: "#E11D48",
            supportedAmounts: [found.price],
            defaultAmount: found.price,
            affiliateUrlTemplate: found.cartUrl,
            cartUrl: found.cartUrl,
            thumbnailImage: found.thumbnailImage,
            detailImage: found.detailImage,
            description: found.description,
            price: found.price
          };
        }
      }
    }
    return undefined;
  }

  function buildGiftUrl(brandIdOrCode, amount, subId, recipientName, affiliateId) {
    if (!brandIdOrCode) return "";
    var idLower = String(brandIdOrCode).toLowerCase().trim();
    var legacy = null;
    for (var i = 0; i < LEGACY_BRANDS.length; i++) {
      if (LEGACY_BRANDS[i].id === idLower) {
        legacy = LEGACY_BRANDS[i];
        break;
      }
    }

    if (legacy) {
      var amt = amount || legacy.defaultAmount;
      var sub = subId || "direct";
      var aff = affiliateId || DEFAULT_AFFILIATE_ID;
      var url = legacy.affiliateUrlTemplate
        .replace("{amount}", String(amt))
        .replace("{subId}", encodeURIComponent(sub))
        .replace("{affiliateId}", encodeURIComponent(aff));

      if (recipientName && String(recipientName).trim()) {
        url = url.replace("{recipientName}", encodeURIComponent(String(recipientName).trim()));
      } else {
        url = url.replace("&recipient={recipientName}", "").replace("?recipient={recipientName}&", "?");
      }
      return url;
    }

    var code = String(brandIdOrCode).trim();
    var isFloristCode = /^[BC]\\d+/i.test(code);
    var isKnownItem = !!getBrand(code);

    if (isFloristCode || isKnownItem) {
      var affId = affiliateId || FLORIST_ONE_AFFILIATE_ID;
      return "http://www.floristone.com/cart.cfm?dcode=" + encodeURIComponent(code) + "&source_id=aff&affiliateid=" + encodeURIComponent(affId);
    }

    return "";
  }

  function cleanExistingNotes(existingNotes) {
    if (!existingNotes) return "";
    var notes = String(existingNotes);

    // 1. Check if structured HTML comment delimiters are present
    var tagBlockRegex = /<!--\\s*autogifter:start\\s*-->[\\s\\S]*?<!--\\s*autogifter:end\\s*-->/gi;
    if (tagBlockRegex.test(notes)) {
      notes = notes.replace(tagBlockRegex, "");
      return notes.replace(/\\n{3,}/g, "\\n\\n").trim();
    }

    // 2. Fallback legacy stripping for un-tagged previous versions
    var patterns = [
      "<!-- autogifter:start -->",
      "🌸 FloristOne Flower Delivery",
      "Top 5 hand-delivered flower bouquets",
      "http://www.floristone.com",
      "https://www.floristone.com",
      "floristone.com/index.cfm",
      "floristone.com/cart.cfm",
      "floristone.com/detail.cfm",
      "Or Gift Card Brands:",
      "🔔 Reminder",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "____________________",
      "--------------------"
    ];

    for (var i = 0; i < patterns.length; i++) {
      var idx = notes.toLowerCase().indexOf(patterns[i].toLowerCase());
      if (idx !== -1) {
        notes = notes.slice(0, idx);
      }
    }

    return notes.replace(/[-_━─\\s]+$/, "").trim();
  }

  function buildEnrichedEventDescription(options) {
    options = options || {};
    var recipient = options.recipientName || "Friend";
    var celebrationType = options.celebrationType || "birthday";
    var occasion = options.occasionCategory || celebrationType;
    var bestsellers = getBestsellers(occasion, 5);

    var cleanedNotes = cleanExistingNotes(options.existingNotes);

    var giftLines = [];
    giftLines.push("<!-- autogifter:start -->");
    giftLines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    giftLines.push("🌸 FloristOne Flower Delivery for " + recipient + " 🌸");
    giftLines.push("Top 5 hand-delivered flower bouquets:\\n");

    bestsellers.forEach(function (item, index) {
      var httpsCartUrl = (item.cartUrl || "").replace(/^http:\\/\\//i, "https://");
      var orderText = "Order " + item.name + " ($" + item.price.toFixed(2) + ") at FloristOne";

      giftLines.push((index + 1) + '. <a href="' + httpsCartUrl + '">💐 ' + orderText + '</a>');
    });

    var aff = options.affiliateId || FLORIST_ONE_AFFILIATE_ID;
    var browseUrl = "https://www.floristone.com/index.cfm?source_id=aff&affiliateid=" + encodeURIComponent(aff);
    giftLines.push("\\n🎁 <a href=\\"" + browseUrl + "\\">Browse all other flowers, bouquets & gifts on FloristOne</a>");
    giftLines.push("<!-- autogifter:end -->");

    var giftBlock = giftLines.join("\\n");

    if (cleanedNotes.length > 0) {
      return cleanedNotes + "\\n\\n" + giftBlock;
    }

    return giftBlock;
  }

  function inspectEventDescription(description) {
    if (!description || !String(description).trim()) {
      return {
        hasUserNotes: false,
        hasAutoGifterSection: false,
        userNotes: "",
        isPureAutoGifter: false,
        isPureUser: false,
        isHybrid: false
      };
    }

    var userNotes = cleanExistingNotes(description);
    var hasUserNotes = userNotes.length > 0;
    var hasAutoGifterSection = /<!--\\s*autogifter:start\\s*-->/i.test(description) ||
      /🌸\\s*FloristOne\\s*Flower\\s*Delivery/i.test(description) ||
      /floristone\\.com/i.test(description);

    return {
      hasUserNotes: hasUserNotes,
      hasAutoGifterSection: hasAutoGifterSection,
      userNotes: userNotes,
      isPureAutoGifter: hasAutoGifterSection && !hasUserNotes,
      isPureUser: hasUserNotes && !hasAutoGifterSection,
      isHybrid: hasUserNotes && hasAutoGifterSection
    };
  }

  function generateGreeting(options) {
    options = options || {};
    var name = options.recipientName || "Friend";
    var type = options.celebrationType || "birthday";
    var tone = options.tone || "warm";

    var greetings = {
      birthday: {
        warm: "Happy Birthday, " + name + "! 🎂 Wishing you a day filled with love, laughter, and happiness!",
        fun: "Happy Birthday, " + name + "! 🎉 Another year cooler. Here's a little something to celebrate you!",
        formal: "Wishing you a very Happy Birthday, " + name + ". May the upcoming year bring you continued success and joy."
      },
      anniversary: {
        warm: "Happy Anniversary! 💍 Wishing you both a wonderful day celebrating your journey together!",
        fun: "Happy Anniversary! 🥂 Cheers to another year of love and fun adventures together!",
        formal: "Warmest congratulations on your Anniversary. Wishing you continued happiness and companionship."
      },
      valentines: {
        warm: "Happy Valentine's Day, " + name + "! 💖 Sending you love and sweetest thoughts today!",
        fun: "Happy Valentine's Day! 🌹 Enjoy every single bit of today!",
        formal: "Wishing you a wonderful Valentine's Day filled with joy and appreciation."
      },
      mothers_day: {
        warm: "Happy Mother's Day, " + name + "! 💐 Thank you for everything you do and the endless love you give!",
        fun: "Happy Mother's Day! 🌸 Sit back, relax, and get spoiled today!",
        formal: "Wishing you a very Happy Mother's Day filled with joy, peace, and appreciation."
      },
      fathers_day: {
        warm: "Happy Father's Day, " + name + "! 👑 Thanks for being amazing and always having our back!",
        fun: "Happy Father's Day! 👔 Hope your day is filled with great relaxation and good vibes!",
        formal: "Wishing you a very Happy Father's Day and a wonderful year ahead."
      },
      thanksgiving: {
        warm: "Happy Thanksgiving, " + name + "! 🦃 Grateful for you and wishing you a warm holiday season!",
        fun: "Happy Turkey Day, " + name + "! 🍂 Hope your day is packed with good food and lots of laughs!",
        formal: "Wishing you and your family a restful and joyous Thanksgiving holiday."
      },
      christmas: {
        warm: "Merry Christmas, " + name + "! 🎄 May your holidays be bright, cozy, and filled with joy!",
        fun: "Merry Christmas & Happy Holidays! 🎅 Wishing you endless treats and great festive vibes!",
        formal: "Wishing you a joyous Christmas season and a peaceful, prosperous New Year."
      },
      easter: {
        warm: "Happy Easter, " + name + "! 🐰 Wishing you and your family a peaceful, blessed spring!",
        fun: "Happy Easter! 🐣 Hope you find plenty of chocolate and spring sunshine today!",
        formal: "Wishing you a joyous and uplifting Easter celebration."
      },
      halloween: {
        warm: "Happy Halloween, " + name + "! 🎃 Hope your night is full of treats and festive fun!",
        fun: "Spooky season is here! 👻 Happy Halloween, " + name + "!",
        formal: "Wishing you a fun and safe Halloween celebration."
      },
      independence_day: {
        warm: "Happy 4th of July, " + name + "! 🎆 Wishing you a fantastic celebration and fireworks!",
        fun: "Happy 4th of July! 🇺🇸 Burgers, fireworks, and good times ahead!",
        formal: "Wishing you a proud and celebratory Independence Day."
      },
      new_year: {
        warm: "Happy New Year, " + name + "! 🥂 Wishing you health, happiness, and prosperity in the new year!",
        fun: "Happy New Year! 🎉 Let's make this upcoming year the most epic one yet!",
        formal: "Wishing you a successful and rewarding New Year."
      },
      milestone: {
        warm: "Congratulations, " + name + "! ✨ So proud of you and excited for your next chapter!",
        fun: "Huge congratulations, " + name + "! 🎓🍾 Time to celebrate this incredible milestone!",
        formal: "Warmest congratulations on this noteworthy milestone. Wishing you continued excellence."
      }
    };

    var categoryGreetings = greetings[type] || greetings.birthday;
    return categoryGreetings[tone] || categoryGreetings.warm;
  }

  function sanitizePhoneNumber(phone) {
    if (!phone) return "";
    return String(phone).replace(/\\D/g, "");
  }

  function buildWhatsAppTextMessage(options) {
    options = options || {};
    var greeting = (options.greeting || "").trim();
    var giftLink = (options.giftLink || "").trim();

    if (!giftLink) {
      return greeting;
    }

    var giftLine = "";
    if (options.brandName && options.amount) {
      giftLine = "🎁 " + options.brandName + " Gift Card ($" + options.amount + "): " + giftLink;
    } else if (options.brandName) {
      giftLine = "🎁 " + options.brandName + ": " + giftLink;
    } else {
      giftLine = "🌸 Gift & Flowers Link: " + giftLink;
    }

    return greeting ? (greeting + "\\n\\n" + giftLine) : giftLine;
  }

  function buildWhatsAppShareUrl(options) {
    options = options || {};
    var message = buildWhatsAppTextMessage(options);
    var encodedText = encodeURIComponent(message);
    var cleanPhone = sanitizePhoneNumber(options.phone);

    var baseUrl = "https://api.whatsapp.com/send";
    if (cleanPhone) {
      return baseUrl + "?phone=" + cleanPhone + "&text=" + encodedText;
    }
    return baseUrl + "?text=" + encodedText;
  }

  function buildEmailShareUrl(options) {
    options = options || {};
    var message = buildWhatsAppTextMessage(options);
    var subject = options.subject || "A gift for you!";
    return "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(message);
  }

  return {
    FLORIST_ONE_AFFILIATE_ID: FLORIST_ONE_AFFILIATE_ID,
    DEFAULT_AFFILIATE_ID: DEFAULT_AFFILIATE_ID,
    STANDARD_AMOUNTS: STANDARD_AMOUNTS,
    LEGACY_BRANDS: LEGACY_BRANDS,
    classifyEvent: classifyEvent,
    cleanAndValidateName: cleanAndValidateName,
    extractRecipientName: extractRecipientName,
    extractRecipientNameFromLine: extractRecipientNameFromLine,
    getBestsellers: getBestsellers,
    getFullCatalog: getFullCatalog,
    getCatalog: getCatalog,
    getBrand: getBrand,
    buildGiftUrl: buildGiftUrl,
    cleanExistingNotes: cleanExistingNotes,
    buildEnrichedEventDescription: buildEnrichedEventDescription,
    inspectEventDescription: inspectEventDescription,
    generateGreeting: generateGreeting,
    sanitizePhoneNumber: sanitizePhoneNumber,
    buildWhatsAppTextMessage: buildWhatsAppTextMessage,
    buildWhatsAppShareUrl: buildWhatsAppShareUrl,
    buildEmailShareUrl: buildEmailShareUrl
  };
});
`;

fs.writeFileSync(path.join(__dirname, '../shared/CoreEngine.js'), engineCode);
fs.writeFileSync(path.join(__dirname, '../gas/CoreEngine.js'), engineCode);
fs.writeFileSync(path.join(__dirname, '../extension/core/CoreEngine.js'), engineCode);
console.log('Successfully synced CoreEngine.js across all surfaces.');
