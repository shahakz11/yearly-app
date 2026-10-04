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
  /🥂/,
  /💐/,
  /❤️/
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
