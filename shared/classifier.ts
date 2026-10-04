export type CelebrationType =
  | 'birthday'
  | 'anniversary'
  | 'valentines'
  | 'mothers_day'
  | 'fathers_day'
  | 'thanksgiving'
  | 'christmas'
  | 'easter'
  | 'halloween'
  | 'independence_day'
  | 'new_year'
  | 'milestone'
  | 'everyday';

export interface ClassificationResult {
  isCelebration: boolean;
  celebrationType: CelebrationType | null;
  recipientName: string | null;
  confidenceScore: number;
  matchedKeyword?: string;
  occasionCategory?: string;
}

// Stop words that must never be treated as recipient names
const STOP_WORDS = new Set([
  'wedding',
  'annual',
  'happy',
  'our',
  'my',
  'the',
  'a',
  'an',
  'first',
  '1st',
  'second',
  '2nd',
  'third',
  '3rd',
  'fourth',
  '4th',
  'fifth',
  '5th',
  'tenth',
  '10th',
  '25th',
  '50th',
  'surprise',
  'special',
  'reminder',
  'notice',
  'alert',
  'birthday',
  'bday',
  'b-day',
  'anniversary',
  'office',
  'company',
  'work',
  'virtual',
  'friend',
  'family',
  'team',
  'celebration',
  'party',
  'milestone',
  'event',
  'dinner',
  'lunch',
  'breakfast',
  'drinks',
  'gathering',
  'notes',
  'note',
  'יום',
  'הולדת',
  'יומולדת',
  'נישואין',
  'נישואים',
  'של',
  'ל',
]);

// Negative keywords representing work, routine, or medical events
const NEGATIVE_KEYWORDS = [
  'standup',
  'sync',
  'meeting',
  'appointment',
  'doctor',
  'dentist',
  '1:1',
  'one-on-one',
  'retro',
  'retrospective',
  'planning',
  'sprint',
  'interview',
  'review',
  'call',
  'demo',
  'flight',
  'hotel',
  'check-in',
  'checkout',
  'service',
  'vet',
  'oil change',
  'workout',
  'gym',
  'exam',
  'all-hands',
  'touchpoint',
];

// Regex patterns for positive celebration types
const BIRTHDAY_KEYWORD_RE = /\b(b(irth)?day|b-day|bday|born|cumpleaños|cumple|anniversaire|geburtstag|compleanno)\b|יום\s*הולדת|יומולדת|יום-הולדת/i;
const BIRTHDAY_EMOJI_RE = /[\u{1F382}\u{1F388}\u{1F370}\u{1F389}]/u; // 🎂, 🎈, 🍰, 🎉

const ANNIVERSARY_KEYWORD_RE = /\b(anniversary|anniv|wedding|years together|wedding day|aniversario|jubiläum)\b|יום\s*נישואין|יום\s*נישואים/i;
const ANNIVERSARY_EMOJI_RE = /[\u{1F48D}\u{1F942}\u{1F491}\u{1F492}\u{2764}]/u; // 💍, 🥂, 💑, 💒, ❤️

const VALENTINES_KEYWORD_RE = /\b(valentine'?s?\s*day|valentines\s*day|val\s*day|valentine'?s?)\b|יום\s*האהבה|ולנטיין/iu;
const VALENTINES_EMOJI_RE = /[\u{1F496}\u{1F498}\u{1F49D}\u{1F48B}\u{1F339}]/u; // 💖, 💘, 💝, 💋, 🌹

const MOTHERS_DAY_KEYWORD_RE = /\b(mother'?s?\s*day|mom'?s?\s*day|mothers\s*day)\b|יום\s*האם|יום\s*המשפחה/iu;
const MOTHERS_DAY_EMOJI_RE = /[\u{1F469}\u{1F490}\u{1F970}]/u; // 👩, 💐, 🥰

const FATHERS_DAY_KEYWORD_RE = /\b(father'?s?\s*day|dad'?s?\s*day|fathers\s*day)\b|יום\s*האב/iu;
const FATHERS_DAY_EMOJI_RE = /[\u{1F468}\u{1F454}\u{1F451}]/u; // 👨, 👔, 👑

const THANKSGIVING_KEYWORD_RE = /\b(thanksgiving(?: day)?|turkey day|friendsgiving)\b|חג\s*ההודיה/iu;
const THANKSGIVING_EMOJI_RE = /[\u{1F983}\u{1F342}\u{1F37D}]/u; // 🦃, 🍂, 🍽️

const CHRISTMAS_KEYWORD_RE = /\b(christmas(?: eve| day)?|xmas|yuletide|holiday season|winter holiday)\b|חג\s*המולד|כריסמס/iu;
const CHRISTMAS_EMOJI_RE = /[\u{1F384}\u{2744}\u{1F385}\u{1F381}]/u; // 🎄, ❄️, 🎅, 🎁

const EASTER_KEYWORD_RE = /\b(easter(?: sunday)?|good friday|pascha)\b|פסחא/iu;
const EASTER_EMOJI_RE = /[\u{1F430}\u{1F95A}\u{1F423}]/u; // 🐰, 🥚, 🐣

const HALLOWEEN_KEYWORD_RE = /\b(halloween|trick or treat|all hallows)\b|ליל\s*כל\s*הקדושים/iu;
const HALLOWEEN_EMOJI_RE = /[\u{1F383}\u{1F47B}\u{1F578}]/u; // 🎃, 👻, 🕸️

const INDEPENDENCE_KEYWORD_RE = /\b(4th of july|fourth of july|independence day|memorial day|labor day|veterans day)\b/iu;
const INDEPENDENCE_EMOJI_RE = /[\u{1F1FA}\u{1F1F8}\u{1F386}\u{1F387}]/u; // 🇺🇸, 🎆, 🎇

const NEW_YEAR_KEYWORD_RE = /\b(new year'?s?(?: eve| day)?|happy new year|rosh hashanah)\b|שנה\s*אזרחית\s*חדשה|נובי\s*גוד|ראש\s*השנה/iu;

const MILESTONE_KEYWORD_RE = /\b(graduation|baby shower|retirement|housewarming|promotion|new baby|engaged|engagement|milestone|get well|thank you|sympathy|celebration)\b/i;
const MILESTONE_EMOJI_RE = /[\u{1F393}\u{1F476}\u{1F3E1}\u{1F37E}\u{2728}]/u; // 🎓, 👶, 🏡, 🍾, ✨

// Emoji stripping regex
const EMOJI_STRIP_RE = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1FA00}-\u{1FAFF}]/gu;
const ZERO_WIDTH_RE = /[\u200B-\u200D\uFEFF]/g;
const NAME_CHARS = "A-Za-z0-9\\u00C0-\\u024F\\u1E00-\\u1EFF\\u0590-\\u05FF\\u0400-\\u04FF\\u0600-\\u06FF\\s&'\\-";

/**
 * Normalizes and validates a candidate name against the stop-word set and negative keywords.
 */
export function cleanAndValidateName(raw: string): string | null {
  if (!raw) return null;

  // Remove zero-width characters, emojis, and normalize quotes
  let cleaned = raw
    .replace(ZERO_WIDTH_RE, '')
    .replace(EMOJI_STRIP_RE, ' ')
    .replace(/[’`]/g, "'")
    .replace(new RegExp(`[^${NAME_CHARS}]`, 'g'), '')
    .trim();

  // Strip time range prefixes like "De 6pm a 7pm ", "6pm to 7pm ", "From 6pm to 7pm ", "18:00 - 19:00 "
  cleaned = cleaned
    .replace(/^(?:de|from|von|das|du|בין|מ)\s+\d{1,2}(?::\d{2})?\s*(?:[a-z]{0,2})?\s+(?:a|to|bis|às|à|au|ל|עד|–|-)\s+\d{1,2}(?::\d{2})?\s*(?:[a-z]{0,2})?\s*[,:–—\-]?\s*/i, '')
    .replace(/^\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?\s*(?:[-–—]|to|a)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?\s*[,:–—\-]?\s*/i, '')
    .replace(/^\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)\s*[,:–—\-]?\s*/i, '')
    .replace(/^\d{1,2}:\d{2}\s*[,:–—\-]?\s*/i, '')
    .trim();

  // Strip leading/trailing conjunctions or note prefixes
  cleaned = cleaned
    .replace(/^(and|with|for|celebrating|celebrate|honoring|honor|של|ל)\s+/i, '')
    .replace(/\s+(and|with|for|של|ל)$/i, '')
    .replace(/^[~*#_!@$%^+=|:;,.?\-\s]+/, '')
    .replace(/[~*#_!@$%^+=|:;,.?\-\s]+$/, '')
    .trim();

  if (!cleaned || cleaned.length < 2) return null;

  const lower = cleaned.toLowerCase();
  if (STOP_WORDS.has(lower)) return null;

  // Check if candidate consists solely of stop words (e.g. "Our Wedding")
  const tokens = lower.split(/\s+/);
  if (tokens.every((t) => STOP_WORDS.has(t))) return null;

  // Check if candidate matches negative keywords
  if (tokens.some((t) => NEGATIVE_KEYWORDS.includes(t))) return null;

  return cleaned;
}

/**
 * Extracts recipient name from a single line of text using ordered heuristics.
 */
export function extractRecipientNameFromLine(line: string): string | null {
  if (!line) return null;

  let cleanLine = line
    .replace(ZERO_WIDTH_RE, '')
    .replace(EMOJI_STRIP_RE, ' ')
    .replace(/[’`]/g, "'")
    .trim();

  // Strip leading decorators, brackets, asterisks, time ranges, etc.
  cleanLine = cleanLine
    .replace(/^[~*#_!@$%^+=|:;,.?\-\s]+/, '')
    .replace(/^\[[^\]]*\]\s*/, '')
    .replace(/^(?:de|from|von|das|du|בין|מ)\s+\d{1,2}(?::\d{2})?\s*(?:[a-z]{0,2})?\s+(?:a|to|bis|às|à|au|ל|עד|–|-)\s+\d{1,2}(?::\d{2})?\s*(?:[a-z]{0,2})?\s*[,:–—\-]?\s*/i, '')
    .replace(/^\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?\s*(?:[-–—]|to|a)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?\s*[,:–—\-]?\s*/i, '')
    .replace(/^\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)\s*[,:–—\-]?\s*/i, '')
    .replace(/^\d{1,2}:\d{2}\s*[,:–—\-]?\s*/i, '')
    .replace(/^(?:special|reminder|notice|alert|event|note|notes|calendar)\s*[:–—\-]\s*/i, '')
    .replace(/^[~*#_!@$%^+=|:;,.?\-\s]+/, '')
    .trim();

  // Hebrew / International Marker Heuristic: "יום הולדת לשי בוש", "יומולדת של דנה"
  const hebrewMarkerPattern = /(?:יום\s*הולדת|יומולדת|יום-הולדת|יום\s*נישואין|יום\s*נישואים)\s+(?:ל|של)?\s*([^(\[,;]+)/i;
  const hebrewMatch = cleanLine.match(hebrewMarkerPattern);
  if (hebrewMatch && hebrewMatch[1]) {
    const candidate = hebrewMatch[1].split(/\s*[(,;]/)[0];
    const validated = cleanAndValidateName(candidate);
    if (validated) return validated;
  }

  // Heuristic 1: Possessive Prefix
  // e.g. "Sarah's Birthday", "Dad's 60th Bday", "Emma's Graduation", "Tom's Retirement Party", "Zoë's Birthday 🎂", "Emma's Baby Shower! 👶🍼", "Sarah and Michael's Wedding Anniversary 💍"
  const possessivePattern = /^(.*?)(?:'s)\s+(?:(?:\d+(?:st|nd|rd|th)?\s+)?(?:birthday|bday|b-day|anniversary|wedding|celebration|party|baby shower|baby|shower|graduation|retirement|promotion|housewarming|milestone))/i;
  const possessiveMatch = cleanLine.match(possessivePattern);
  if (possessiveMatch && possessiveMatch[1]) {
    const validated = cleanAndValidateName(possessiveMatch[1]);
    if (validated) return validated;
  }

  // Heuristic 2: "Happy Birthday / Anniversary [Name]"
  // e.g. "Happy Birthday, Carlos! 🎂", "Happy 30th Birthday Sarah!"
  const happyPattern = /^happy\s+(?:(?:\d+(?:st|nd|rd|th)?\s+)?(?:birthday|bday|anniversary))\s*[,:–—\-]?\s*([^!?.~*]+)/i;
  const happyMatch = cleanLine.match(happyPattern);
  if (happyMatch && happyMatch[1]) {
    const validated = cleanAndValidateName(happyMatch[1]);
    if (validated) return validated;
  }

  // Heuristic 3: 'For' / 'Of' / 'With' Marker
  // e.g. "Birthday for Sarah", "Surprise party for Emma 🎂", "Baby shower for Jessica", "Birthday celebration for Maya (Organized by John)", "Birthday for Lucas and Olivia 🎂"
  const markerPattern = /(?:birthday|bday|b-day|anniversary|wedding|party|celebration|baby shower|baby|shower|graduation|retirement|promotion|housewarming|milestone)\s+(?:for|of|with|celebrating)\s+([^\n]+)/i;
  const markerMatch = cleanLine.match(markerPattern);
  if (markerMatch && markerMatch[1]) {
    const candidate = markerMatch[1].split(/\s+(?:organized|hosted|planned|at|in|on|from)\s+|\s*[(,;]/i)[0];
    const validated = cleanAndValidateName(candidate);
    if (validated) return validated;
  }

  // Heuristic 4: Delimiter Pattern (Colon / Dash / Hyphen)
  // e.g. "Birthday: Michael", "Sarah - Birthday 🎂", "Emma — 30th Birthday", "Graduation: Alex & Sam 🎓"
  const suffixDelimiterPattern = /(?:birthday|bday|b-day|anniversary|celebration|baby shower|baby|shower|graduation|retirement|milestone|יום\s*הולדת|יומולדת)\s*[:–—\-]\s*([^\n]+)/i;
  const suffixDelimiterMatch = cleanLine.match(suffixDelimiterPattern);
  if (suffixDelimiterMatch && suffixDelimiterMatch[1]) {
    const candidate = suffixDelimiterMatch[1].split(/\s+(?:organized|hosted|planned|at|in|on|from)\s+|\s*[(,;]/i)[0];
    const validated = cleanAndValidateName(candidate);
    if (validated) return validated;
  }

  const prefixDelimiterPattern = /^([^\n:]+?)\s*[:–—\-]\s*(?:(?:\d+(?:st|nd|rd|th)?\s+)?(?:birthday|bday|b-day|anniversary|celebration|baby shower|baby|shower|graduation|retirement|milestone|יום\s*הולדת|יומולדת))/i;
  const prefixDelimiterMatch = cleanLine.match(prefixDelimiterPattern);
  if (prefixDelimiterMatch && prefixDelimiterMatch[1]) {
    const validated = cleanAndValidateName(prefixDelimiterMatch[1]);
    if (validated) return validated;
  }

  // Heuristic 5: Direct Leading Token
  // e.g. "Maya Birthday", "Alex Bday"
  const leadingPattern = /^([^\n]+?)\s+(?:birthday|bday|anniversary|celebration|graduation)/i;
  const leadingMatch = cleanLine.match(leadingPattern);
  if (leadingMatch && leadingMatch[1]) {
    const validated = cleanAndValidateName(leadingMatch[1]);
    if (validated) return validated;
  }

  // Note scanning heuristic: look for "Name: Alexander", "Honoree: Sarah"
  const nameKeyValueMatch = cleanLine.match(/^(?:name|recipient|guest of honor|honoree|for)\s*[:–—\-]\s*([A-Za-z0-9\s&'-]+)/i);
  if (nameKeyValueMatch && nameKeyValueMatch[1]) {
    const validated = cleanAndValidateName(nameKeyValueMatch[1]);
    if (validated) return validated;
  }

  // Standalone Name Line (e.g. in notes: "Alexander" or "Dave & Alice"), only if no celebration keywords
  if (!/(?:birthday|bday|b-day|anniversary|celebration|party|milestone|event|dinner|lunch|location|reserved|table|budget|cake|drinks|wear|quad)/i.test(cleanLine)) {
    if (/^[A-Za-z\u00C0-\u024F\u1E00-\u1EFF\u0590-\u05FF\s&'-]+$/.test(cleanLine)) {
      const validated = cleanAndValidateName(cleanLine);
      if (validated) return validated;
    }
  }

  return null;
}

/**
 * Extracts recipient name from text, scanning multi-line content line-by-line.
 */
export function extractRecipientName(text: string): string | null {
  if (!text) return null;
  const clean = text.replace(ZERO_WIDTH_RE, '');
  const lines = clean.split(/\r?\n+/);
  for (const line of lines) {
    const name = extractRecipientNameFromLine(line);
    if (name) return name;
  }
  return null;
}

/**
 * Classifies a calendar event by scanning its title and notes.
 *
 * @param title The event title / summary
 * @param notes Optional event description / notes
 * @returns ClassificationResult with isCelebration, celebrationType, recipientName, and confidenceScore
 */
export function classifyEvent(title?: string, notes?: string): ClassificationResult {
  const safeTitle = (title || '').replace(ZERO_WIDTH_RE, '').trim();
  const safeNotes = (notes || '').replace(ZERO_WIDTH_RE, '').trim();
  const combined = `${safeTitle} ${safeNotes}`.trim();

  if (!combined) {
    return {
      isCelebration: false,
      celebrationType: null,
      recipientName: null,
      confidenceScore: 0,
    };
  }

  // Check specific holiday and celebration patterns in order
  let celebrationType: CelebrationType | null = null;
  let matchedKeyword = '';
  let baseConfidence = 0.90;
  let occasionCategory = 'everyday';

  if (VALENTINES_KEYWORD_RE.test(combined) || VALENTINES_EMOJI_RE.test(combined)) {
    celebrationType = 'valentines';
    occasionCategory = 'love';
    matchedKeyword = "Valentine's Day";
  } else if (MOTHERS_DAY_KEYWORD_RE.test(combined) || MOTHERS_DAY_EMOJI_RE.test(combined)) {
    celebrationType = 'mothers_day';
    occasionCategory = 'mothers_day';
    matchedKeyword = "Mother's Day";
  } else if (FATHERS_DAY_KEYWORD_RE.test(combined) || FATHERS_DAY_EMOJI_RE.test(combined)) {
    celebrationType = 'fathers_day';
    occasionCategory = 'everyday';
    matchedKeyword = "Father's Day";
  } else if (CHRISTMAS_KEYWORD_RE.test(combined) || CHRISTMAS_EMOJI_RE.test(combined)) {
    celebrationType = 'christmas';
    occasionCategory = 'holiday';
    matchedKeyword = 'Christmas';
  } else if (THANKSGIVING_KEYWORD_RE.test(combined) || THANKSGIVING_EMOJI_RE.test(combined)) {
    celebrationType = 'thanksgiving';
    occasionCategory = 'holiday';
    matchedKeyword = 'Thanksgiving';
  } else if (EASTER_KEYWORD_RE.test(combined) || EASTER_EMOJI_RE.test(combined)) {
    celebrationType = 'easter';
    occasionCategory = 'holiday';
    matchedKeyword = 'Easter';
  } else if (HALLOWEEN_KEYWORD_RE.test(combined) || HALLOWEEN_EMOJI_RE.test(combined)) {
    celebrationType = 'halloween';
    occasionCategory = 'holiday';
    matchedKeyword = 'Halloween';
  } else if (INDEPENDENCE_KEYWORD_RE.test(combined) || INDEPENDENCE_EMOJI_RE.test(combined)) {
    celebrationType = 'independence_day';
    occasionCategory = 'sympathy';
    matchedKeyword = 'Independence Day';
  } else if (NEW_YEAR_KEYWORD_RE.test(combined)) {
    celebrationType = 'new_year';
    occasionCategory = 'holiday';
    matchedKeyword = "New Year's";
  } else if (BIRTHDAY_KEYWORD_RE.test(combined) || BIRTHDAY_EMOJI_RE.test(combined)) {
    celebrationType = 'birthday';
    occasionCategory = 'birthday';
    const kwMatch = combined.match(BIRTHDAY_KEYWORD_RE);
    const emojiMatch = combined.match(BIRTHDAY_EMOJI_RE);
    matchedKeyword = kwMatch ? kwMatch[0] : (emojiMatch ? emojiMatch[0] : 'birthday');
  } else if (ANNIVERSARY_KEYWORD_RE.test(combined) || ANNIVERSARY_EMOJI_RE.test(combined)) {
    celebrationType = 'anniversary';
    occasionCategory = 'anniversary';
    const kwMatch = combined.match(ANNIVERSARY_KEYWORD_RE);
    const emojiMatch = combined.match(ANNIVERSARY_EMOJI_RE);
    matchedKeyword = kwMatch ? kwMatch[0] : (emojiMatch ? emojiMatch[0] : 'anniversary');
  } else if (MILESTONE_KEYWORD_RE.test(combined) || MILESTONE_EMOJI_RE.test(combined)) {
    celebrationType = 'milestone';
    occasionCategory = 'everyday';
    const kwMatch = combined.match(MILESTONE_KEYWORD_RE);
    const emojiMatch = combined.match(MILESTONE_EMOJI_RE);
    matchedKeyword = kwMatch ? kwMatch[0] : (emojiMatch ? emojiMatch[0] : 'milestone');
    baseConfidence = 0.85;
  }

  // Strict Negative Filtering: if no celebration pattern matched, reject
  if (!celebrationType) {
    return {
      isCelebration: false,
      celebrationType: null,
      recipientName: null,
      confidenceScore: 0,
    };
  }

  // Attempt to extract recipient name, prioritizing title over notes
  let recipientName = extractRecipientName(safeTitle);
  if (!recipientName && safeNotes) {
    recipientName = extractRecipientName(safeNotes);
  }

  // Boost confidence if a named recipient was successfully extracted
  const confidenceScore = recipientName ? Math.min(1.0, baseConfidence + 0.05) : baseConfidence;

  return {
    isCelebration: true,
    celebrationType,
    recipientName,
    confidenceScore,
    matchedKeyword,
    occasionCategory,
  };
}
