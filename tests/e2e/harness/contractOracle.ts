import {
  ClassificationResult,
  GiftBrand,
  GreetingOptions,
  WhatsAppOptions,
} from './types';

// Curated Brands specification per ORIGINAL_REQUEST.md & PROJECT.md
export const DEFAULT_CATALOG: GiftBrand[] = [
  {
    id: 'starbucks',
    name: 'Starbucks',
    category: 'coffee',
    emoji: '☕',
    supportedAmounts: [15, 25, 50, 100],
    affiliateUrlTemplate: 'https://starbucks.com/gift?amount={amount}&subId={subId}',
  },
  {
    id: 'doordash',
    name: 'DoorDash',
    category: 'food',
    emoji: '🍕',
    supportedAmounts: [15, 25, 50, 100],
    affiliateUrlTemplate: 'https://doordash.com/gift?amount={amount}&subId={subId}',
  },
  {
    id: 'amazon',
    name: 'Amazon',
    category: 'shopping',
    emoji: '📦',
    supportedAmounts: [15, 25, 50, 100],
    affiliateUrlTemplate: 'https://amazon.com/gift-cards?amount={amount}&tag=autogifter&subId={subId}',
  },
  {
    id: 'target',
    name: 'Target',
    category: 'shopping',
    emoji: '🎯',
    supportedAmounts: [15, 25, 50, 100],
    affiliateUrlTemplate: 'https://target.com/giftcards?amount={amount}&subId={subId}',
  },
];

const NEGATIVE_PATTERNS = [
  /\bstandup\b/i,
  /\bplanning\b/i,
  /\bappointment\b/i,
  /\bdentist\b/i,
  /\bdoctor\b/i,
  /\b1:1\b/i,
  /\bone-on-one\b/i,
  /\bsync\b/i,
  /\bfinancial review\b/i,
  /\bperformance review\b/i,
  /\bseminar\b/i,
  /\bmath\b/i,
];

const STOP_WORDS = new Set([
  'party',
  'dinner',
  'celebration',
  'gathering',
  'surprise',
  'special',
  'reminder',
  'notice',
  'alert',
  'kids',
  'family',
  'vacation',
  'weekend',
  'trip',
  'lunch',
]);

/**
 * Authoritative Classifier Oracle
 */
export function classifyEvent(title: string, notes?: string): ClassificationResult {
  if (!title || !title.trim()) {
    return {
      isCelebration: false,
      celebrationType: null,
      recipientName: null,
      confidenceScore: 0,
    };
  }

  const rawTitle = title.trim();

  // Strict negative filtering check
  const hasNegativeKeyword = NEGATIVE_PATTERNS.some((p) => p.test(rawTitle));
  if (hasNegativeKeyword) {
    return {
      isCelebration: false,
      celebrationType: null,
      recipientName: null,
      confidenceScore: 0,
    };
  }

  // Scan title first, then notes if title is not a definitive match
  const contentToScan = `${rawTitle} ${notes || ''}`;

  const isBirthdayMatch =
    /\b(b(irth)?day|b-day|bday)\b/i.test(rawTitle) ||
    /[🎂🎈🍰🎉]/u.test(rawTitle) ||
    (/\b(b(irth)?day|b-day|bday)\b/i.test(notes || '') && /celebrat/i.test(rawTitle));

  const isAnniversaryMatch =
    /\b(anniversary|wedding)\b/i.test(rawTitle) ||
    /[💍🥂❤️]/u.test(rawTitle) ||
    (/\b(anniversary|wedding)\b/i.test(notes || '') && /celebrat/i.test(rawTitle));

  const isMilestoneMatch =
    /\b(milestone|retirement|graduation|baby shower|shower|promotion|housewarming|new baby|engaged)\b/i.test(contentToScan) ||
    /[🎓👶🏡🍾✨]/u.test(contentToScan);

  if (isBirthdayMatch) {
    const recipientName = extractRecipientName(rawTitle, 'birthday', notes);
    return {
      isCelebration: true,
      celebrationType: 'birthday',
      recipientName,
      confidenceScore: 0.95,
      matchedKeyword: 'birthday',
    };
  }

  if (isAnniversaryMatch) {
    const recipientName = extractRecipientName(rawTitle, 'anniversary', notes);
    return {
      isCelebration: true,
      celebrationType: 'anniversary',
      recipientName,
      confidenceScore: 0.9,
      matchedKeyword: 'anniversary',
    };
  }

  if (isMilestoneMatch) {
    const recipientName = extractRecipientName(rawTitle, 'milestone', notes);
    return {
      isCelebration: true,
      celebrationType: 'milestone',
      recipientName,
      confidenceScore: 0.85,
      matchedKeyword: 'milestone',
    };
  }

  return {
    isCelebration: false,
    celebrationType: null,
    recipientName: null,
    confidenceScore: 0.1,
  };
}

function extractRecipientName(
  title: string,
  type: 'birthday' | 'anniversary' | 'milestone',
  notes?: string
): string | null {
  const ZERO_WIDTH_RE = /[\u200B-\u200D\uFEFF]/g;
  const EMOJI_STRIP_RE = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1FA00}-\u{1FAFF}]/gu;
  // Clean zero-width chars, emojis, punctuation stars, hashes etc at ends, bracketed tags
  const clean = title.replace(ZERO_WIDTH_RE, '').replace(EMOJI_STRIP_RE, ' ').trim();
  const cleanedTitle = clean
    .replace(/^[\s*#~!~]+|[\s*#~!~]+$/g, '')
    .replace(/^\[[^\]]*\]\s*/, '')
    .replace(/^(?:special|reminder|notice|alert|event|note|calendar)\s*[:\-–—]\s*/i, '')
    .replace(/^[\s*#~!~]+|[\s*#~!~]+$/g, '')
    .trim();

  // 1. Possessive match: "Sarah's Birthday 🎂", "SARAH'S B-DAY", "Dave & Alice's Wedding Anniversary", "Sarah's 3-Day Birthday"
  const possessive = cleanedTitle.match(
    /^([A-Za-z0-9\u00C0-\u024F\u1E00-\u1EFF\s&'-]+?)(?:'s|’s)\s+(?:\d+(?:st|nd|rd|th|-day)?\s+)?(?:birthday|bday|b-day|anniversary|wedding|milestone|celebration|baby shower|shower|graduation|retirement)/i
  );
  if (possessive && possessive[1]) {
    const candidate = possessive[1].trim();
    if (!STOP_WORDS.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  // 2. "for" or "of" match: "Birthday Celebration for Michael", "Birthday celebration for Maya (Organized by John)"
  const forOf = cleanedTitle.match(
    /(?:birthday|bday|anniversary|milestone|celebration|graduation|shower|retirement)\s+(?:for|of)\s+([A-Za-z0-9\u00C0-\u024F\u1E00-\u1EFF\s&'-]+)/i
  );
  if (forOf && forOf[1]) {
    const candidate = forOf[1].split(/\s+(?:organized|hosted|planned|at|in|on|from)\s+|\s*[(,;]/i)[0].trim();
    if (!STOP_WORDS.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  // 3. "Happy Birthday [Name]!" pattern (supports comma and exclamation)
  const happyMatch = cleanedTitle.match(/happy\s+(?:birthday|bday)\s*[,:\-–—]?\s*([A-Za-z0-9\u00C0-\u024F\u1E00-\u1EFF\s&'-]+?)(?:[!?.~*]|$)/i);
  if (happyMatch && happyMatch[1]) {
    const candidate = happyMatch[1].trim();
    if (!STOP_WORDS.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  // 4. Delimiter pattern: "Graduation: Alex & Sam 🎓", "Birthday: Michael"
  const delimiterMatch = cleanedTitle.match(/(?:birthday|bday|anniversary|milestone|graduation|celebration|shower)\s*[:\-–—]\s*([A-Za-z0-9\u00C0-\u024F\u1E00-\u1EFF\s&'-]+)/i);
  if (delimiterMatch && delimiterMatch[1]) {
    const candidate = delimiterMatch[1].split(/\s+(?:organized|hosted|planned|at|in|on|from)\s+|\s*[(,;\n\r]/i)[0].trim();
    if (!STOP_WORDS.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  // 5. Notes scan fallback: "Celebrating John's retirement" or "Graduation for Sophia\n..."
  if (notes) {
    const cleanNotes = notes.replace(ZERO_WIDTH_RE, '');
    const notePossessive = cleanNotes.match(/celebrating\s+([A-Za-z0-9\u00C0-\u024F\u1E00-\u1EFF\s&'-]+?)(?:'s|’s)/i);
    if (notePossessive && notePossessive[1]) {
      const candidate = notePossessive[1].trim();
      if (!STOP_WORDS.has(candidate.toLowerCase())) {
        return candidate;
      }
    }
    const noteFor = cleanNotes.match(/(?:birthday|anniversary|milestone|celebration|graduation|shower|retirement)\s+(?:for|of)\s+([A-Za-z0-9\u00C0-\u024F\u1E00-\u1EFF\s&'-]+)/i);
    if (noteFor && noteFor[1]) {
      const candidate = noteFor[1].split(/\s+(?:organized|hosted|planned|at|in|on|from)\s+|\s*[(,;\n\r]/i)[0].trim();
      if (!STOP_WORDS.has(candidate.toLowerCase())) {
        return candidate;
      }
    }
  }

  return null;
}

/**
 * Catalog Oracle
 */
export function getCatalog(): GiftBrand[] {
  return DEFAULT_CATALOG;
}

export function buildGiftUrl(brandId: string, amount: number, subId?: string, recipientName?: string): string {
  const brand = DEFAULT_CATALOG.find((b) => b.id.toLowerCase() === brandId.toLowerCase());
  if (!brand) {
    throw new Error(`Unsupported gift brand ID: ${brandId}`);
  }
  if (!brand.supportedAmounts.includes(amount)) {
    throw new Error(`Unsupported amount: $${amount} for brand ${brand.name}. Supported: ${brand.supportedAmounts.join(', ')}`);
  }

  const effectiveSubId = subId || (recipientName ? `autogifter_cal_${encodeURIComponent(recipientName)}` : 'autogifter_default');
  return brand.affiliateUrlTemplate
    .replace('{amount}', amount.toString())
    .replace('{subId}', effectiveSubId);
}

/**
 * Greetings Oracle
 */
export function generateGreeting(options: GreetingOptions): string {
  const { recipientName, celebrationType, tone = 'warm' } = options;
  const name = recipientName && recipientName.trim().length > 0 ? recipientName.trim() : 'there';

  if (celebrationType === 'birthday') {
    if (tone === 'fun') {
      return `Happy Birthday ${name}! Another year older, wiser, and more fabulous! 🎂🎉🥳`;
    }
    if (tone === 'formal') {
      return `Wishing you a very Happy Birthday, ${name}. May this year bring you great joy and continued success. 🎂`;
    }
    // Default warm
    return `Happy Birthday ${name}! Wishing you a wonderful celebration and a fantastic year ahead! 🎂🎉`;
  }

  if (celebrationType === 'anniversary') {
    if (tone === 'fun') {
      return `Happy Anniversary ${name}! Still awesome together after all this time! 🥂💍✨`;
    }
    if (tone === 'formal') {
      return `Warmest congratulations on your Anniversary, ${name}. Wishing you continued happiness and companionship. 💍`;
    }
    // Default warm
    return `Happy Anniversary ${name}! Here's to celebrating your love and many more wonderful years together! 🥂❤️`;
  }

  // Milestone / other
  return `Congratulations ${name}! Celebrating this incredible milestone with you! 🎊✨`;
}

/**
 * WhatsApp Share URL Builder Oracle
 */
export function buildWhatsAppShareUrl(options: WhatsAppOptions): string {
  const { greeting, giftLink, phone } = options;
  let fullMessage = greeting.trim();
  if (giftLink) {
    fullMessage += ` ${giftLink.trim()}`;
  }

  const encodedText = encodeURIComponent(fullMessage);
  const base = phone
    ? `https://api.whatsapp.com/send?phone=${encodeURIComponent(phone)}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  return base;
}
