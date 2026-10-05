import { CalendarEventItem, EventType } from '../types';

const BIRTHDAY_KEYWORDS = [
  /\b(b(irth)?day|b-day|bday)\b/i,
  /🎂/,
  /🎉/,
  /🎈/,
  /🎁/
];

const ANNIVERSARY_KEYWORDS = [
  /\b(anniversary|wedding|anniv)\b/i,
  /💍/,
  /❤️/
];

const HOLIDAY_KEYWORDS = [
  /\b(mother'?s?\s*day|mom'?s?\s*day|mothers\s*day|d[ií]a\s+de\s+la\s+madre)\b/i,
  /\b(father'?s?\s*day|dad'?s?\s*day|fathers\s*day|d[ií]a\s+del\s+padre)\b/i,
  /\b(valentine'?s?\s*day|valentines\s*day|val\s*day|d[ií]a\s+de\s+san\s+valent[ií]n)\b/i,
  /\b(christmas(?: eve| day)?|xmas|navidad|nochebuena)\b/i,
  /\b(thanksgiving|accion de gracias)\b/i,
  /\b(easter|pascua)\b/i,
  /\b(halloween|noche de brujas)\b/i,
  /\b(new year'?s?(?: eve| day)?|happy new year|nochevieja|a[ñn]o nuevo)\b/i,
  /\b(women'?s?\s*day|grandparent'?s?\s*day|boss'?s?\s*day|hanukkah|chanukah)\b/i,
  /🎄/, /🎅/, /🦃/, /🐰/, /🎃/, /🥂/, /💖/, /👑/
];

export interface ClassificationResult {
  eventType: EventType;
  extractedName?: string;
  confidenceScore: number;
}

/**
 * Classifies an event title and extracts the recipient's name cleanly.
 */
export function classifyEventTitle(title: string): ClassificationResult {
  if (!title || !title.trim()) {
    return { eventType: 'custom', confidenceScore: 0.1 };
  }

  const cleanTitle = title.trim();

  // Check for Birthday
  const isBirthday = BIRTHDAY_KEYWORDS.some((regex) => regex.test(cleanTitle));
  if (isBirthday) {
    let extractedName: string | undefined;

    const possessiveMatch = cleanTitle.match(/^(.+?)(?:'s|’s)?\s+(?:(?:\d+(?:st|nd|rd|th)?\s+)?(?:birthday|bday|b-day))/i);
    if (possessiveMatch && possessiveMatch[1]) {
      extractedName = cleanName(possessiveMatch[1]);
    } else {
      const forMatch = cleanTitle.match(/(?:birthday|bday|b-day)\s+(?:for|of)\s+([A-Za-z\s]+)/i);
      if (forMatch && forMatch[1]) {
        extractedName = cleanName(forMatch[1]);
      }
    }

    return {
      eventType: 'birthday',
      extractedName,
      confidenceScore: 0.95,
    };
  }

  // Check for Holiday / Observance (Mother's Day, Father's Day, New Year's, etc.)
  const isHoliday = HOLIDAY_KEYWORDS.some((regex) => regex.test(cleanTitle));
  if (isHoliday) {
    return {
      eventType: 'holiday',
      extractedName: cleanTitle.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\s]+/u, '').trim(),
      confidenceScore: 0.9,
    };
  }

  // Check for Anniversary
  const isAnniversary = ANNIVERSARY_KEYWORDS.some((regex) => regex.test(cleanTitle));
  if (isAnniversary) {
    let extractedName: string | undefined;
    const coupleMatch = cleanTitle.match(/^(.+?)(?:'s|’s)?\s+(?:(?:\d+(?:st|nd|rd|th)?\s+)?(?:anniversary|wedding))/i);
    if (coupleMatch && coupleMatch[1]) {
      extractedName = cleanName(coupleMatch[1]);
    }

    return {
      eventType: 'anniversary',
      extractedName,
      confidenceScore: 0.9,
    };
  }

  return {
    eventType: 'custom',
    confidenceScore: 0.3,
  };
}

function cleanName(raw: string): string {
  return raw
    .replace(/[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[^\w\s&'-]/g, '')
    .trim();
}

/**
 * Calculates days remaining until the target date.
 */
export function calculateDaysUntil(eventDateInput: string | Date, isAnnual = true, referenceDate = new Date()): number {
  const eventDate = typeof eventDateInput === 'string' ? new Date(eventDateInput) : eventDateInput;
  const currentYear = referenceDate.getFullYear();

  let nextDate = new Date(currentYear, eventDate.getMonth(), eventDate.getDate());

  // Reset times to midnight for precise day calculation
  nextDate.setHours(0, 0, 0, 0);
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate(), 0, 0, 0, 0);

  if (isAnnual && nextDate < today) {
    // Already happened this year -> calculate for next year
    nextDate = new Date(currentYear + 1, eventDate.getMonth(), eventDate.getDate());
  }

  const diffMs = nextDate.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}
