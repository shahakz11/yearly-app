export type EventType = 'birthday' | 'anniversary' | 'holiday' | 'custom';

export interface ContactProfile {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  avatarUri?: string;
  relationship?: 'partner' | 'family' | 'friend' | 'colleague';
  birthday?: string; // YYYY-MM-DD
  anniversary?: string;
  notes?: string;
}

export interface CalendarEventItem {
  id: string;
  contactId?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  sourceCalendarId?: string;
  title: string;
  eventType: EventType;
  eventDate: string; // ISO date format YYYY-MM-DD
  daysUntil: number;
  recurrence: 'annual' | 'once';
  confidenceScore: number; // 0.0 - 1.0
  notes?: string;
}

export type GiftCategory = 'food' | 'coffee' | 'shopping' | 'experiences';

export interface GiftBrand {
  id: string;
  name: string;
  tagline: string;
  category: GiftCategory;
  primaryColor: string;
  logoEmoji: string;
  supportedAmounts: number[];
  deepLinkScheme: string;
  webFallbackUrl: string;
  popularChoices?: string[];
}

export interface GiftRecord {
  id: string;
  eventId: string;
  contactId?: string;
  recipientName: string;
  brandId: string;
  brandName: string;
  amount: number;
  greetingSent: string;
  deliveredVia: 'whatsapp' | 'imessage' | 'direct_merchant' | 'clipboard';
  createdAt: string;
}

export interface UserPreferences {
  notificationDaysBefore: number[]; // e.g. [7, 3, 0]
  notificationHour: number; // e.g. 9 for 9:00 AM
  autoMatchContacts: boolean;
  selectedCalendarIds: string[];
}
