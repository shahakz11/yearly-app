/**
 * Auto-Gifter Interface Contracts & Types
 * Defined in PROJECT.md § Interface Contracts
 */

export interface ClassificationResult {
  isCelebration: boolean;
  celebrationType: 'birthday' | 'anniversary' | 'milestone' | null;
  recipientName: string | null;
  confidenceScore: number;
  matchedKeyword?: string;
}

export interface GiftBrand {
  id: string;
  name: string;
  category: string;
  emoji: string;
  supportedAmounts: number[]; // e.g. [15, 25, 50, 100]
  affiliateUrlTemplate: string;
}

export interface GreetingOptions {
  recipientName: string;
  celebrationType: 'birthday' | 'anniversary' | 'milestone';
  relationshipType?: 'friend' | 'partner' | 'family' | 'colleague' | 'general';
  tone?: 'warm' | 'fun' | 'formal';
}

export interface WhatsAppOptions {
  greeting: string;
  giftLink?: string;
  phone?: string;
}

export interface UpcomingCelebration {
  id: string;
  title: string;
  date: string;
  celebrationType: 'birthday' | 'anniversary' | 'milestone';
  recipientName: string | null;
  suggestedGreeting: string;
  whatsAppUrl: string;
}

export interface CelebrationLogRow {
  date: string;           // YYYY-MM-DD
  recipientName: string;   // string
  eventType: 'birthday' | 'anniversary' | 'milestone';
  giftSent: boolean;      // TRUE / FALSE
  greetingUsed: string;
  brandChosen?: string;   // e.g. "Starbucks"
  amount?: number;        // e.g. 25
  eventId: string;        // Calendar event ID
  lastUpdated: string;    // ISO timestamp
}

export interface GasPingResponse {
  status: 'ok';
  service: string;
  timestamp: string;
}

export interface GasCatalogResponse {
  status: 'ok';
  catalog: GiftBrand[];
}

export interface GasEventsResponse {
  status: 'ok';
  events: UpcomingCelebration[];
}

export interface GasLogGiftPayload {
  action: 'log_gift';
  eventId: string;
  recipientName: string;
  brandChosen: string;
  amount: number;
  date?: string;
  greetingUsed?: string;
}

export interface GasLogGiftResponse {
  status: 'ok';
  logged: boolean;
  row: number;
}

export interface ChromeStorageSyncState {
  gasWebAppUrl?: string;
  lastSyncTimestamp?: string;
}
