# Auto-gifter — System Design & Architecture Specification

## 1. Executive Summary & Understanding
* **Product:** Auto-gifter is a high-delight mobile assistant that connects to users' calendars (Apple Calendar / Google Calendar), detects upcoming birthdays, anniversaries, and milestones, and enables 1-tap gifting through curated digital gift cards, experiences, and personalized AI greetings.
* **Target Audience:** Consumer / B2C — individuals celebrating friends, family, partners, and colleagues.
* **Core Value Proposition:** Eliminates forgotten dates and removes the awkward "What's your address?" friction by combining proactive smart calendar alerts with instant digital gift delivery.
* **MVP Strategy (Zero-Payment / Affiliate Deep-Link):** Bypasses all payment processing, merchant of record, and corporate entity requirements by deep-linking senders directly into trusted merchant platforms (DoorDash, Starbucks, Amazon, etc.) or gift card aggregator networks (Giftcards.com / Raise) with affiliate tracking.

---

## 2. Assumptions & Non-Functional Requirements
* **Platform:** React Native with Expo (iOS & Android) — selected for native EventKit calendar access, device address book matching, and native push notifications.
* **Local-First Architecture:** Calendar data, contact matching, and scheduled notifications reside entirely on-device (via `expo-sqlite`). No raw calendar data is transmitted to external servers, providing maximum privacy and zero hosting overhead.
* **Geography:** US-focused initial launch catalog (brands: DoorDash, Starbucks, Amazon, Target, Uber Eats, Airbnb).
* **Reliability:** Background notification engine fires reliably across time zones and functions completely offline.
* **Security & Privacy:** Read-only calendar access strictly limited to scanning event titles, notes, and dates. Recipient contact info is securely stored locally.

---

## 3. Comprehensive Decision Log

| # | Decision | Alternatives Considered | Rationale |
|---|---|---|---|
| **D1** | Target **Consumer / B2C** personal gifting initially. | B2B corporate gifting, HRIS integrations. | Matches personal calendar habits, validates core user delight before tackling complex enterprise sales cycles. |
| **D2** | **Mobile-First (React Native / Expo)** with calendar sync. | Web-first only, Google Workspace sidebar add-on. | Native calendar access (iOS EventKit + Google OAuth), native push notifications, and 1-tap mobile experience. |
| **D3** | **Hybrid "Magic Claim Link"** delivery model. | Sender must know physical address upfront; App-download required by recipient. | Senders rarely know exact street addresses. Magic Link sent via SMS/WhatsApp/email preserves surprise and guarantees zero friction. |
| **D4** | **Digital Gift Cards & Experiences for MVP** (Phase 1 focus). | Physical flowers & curated hampers on day one. | Drastically reduces operational complexity, eliminates shipping failures, and allows rapid validation. |
| **D5** | **Hybrid Monetization:** Free tier + affiliate take-rate + optional VIP Concierge subscription. | Ads-supported, 100% upfront paid app. | Maximizes top-of-funnel calendar connections while capturing transactional revenue and recurring SaaS revenue from power users. |
| **D6** | **Zero-Payment MVP (Affiliate & Direct Partner Deep-Links)**. | Setting up US LLC + Stripe, or local sole proprietorship. | Stripe sole proprietorship is unavailable in Israel; deep-links eliminate all payment liabilities and corporate entity requirements while validating user engagement. |
| **D7** | **Preset Chips + Custom Amount Input** step before deep-link handoff. | Fixed amount only; leaving amount selection entirely to external site. | Gives user clear budget control in-app while streamlining the handoff. |
| **D8** | **AI Greeting with 1-Tap Copy & WhatsApp/iMessage Share**. | In-app animated card rendering requiring code entry. | Zero manual friction; fits naturally into how friends actually celebrate each other on messaging apps. |
| **D9** | **Monetize via Giftcards.com / Rakuten / Impact Affiliate Networks**. | Individual direct brand contracts. | Single integration unlocks hundreds of brands instantly with no legal negotiation needed. |
| **D10** | **3-Tier Contact Resolution (Zero-Address -> Contact Auto-Match -> Magic Claim Link)**. | Forcing the sender to manually type addresses/emails every time. | Completely removes the #1 cause of checkout abandonment in gifting apps. |

---

## 4. Detailed System Architecture

### 4.1 Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                 React Native / Expo Mobile App              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐        ┌──────────────────────┐  │
│  │   expo-calendar      │        │    expo-contacts     │  │
│  │  (iOS EventKit /     │        │  (Device Address     │  │
│  │   Google Calendar)   │        │   Book Matching)     │  │
│  └──────────┬───────────┘        └──────────┬───────────┘  │
│             │                               │              │
│             ▼                               ▼              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Event Ingestion & Heuristic Classifier      │  │
│  │   (Detects "Birthday", "Anniversary", "🎂", "💍")     │  │
│  └──────────────────────────┬───────────────────────────┘  │
│                             │                              │
│                             ▼                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           expo-sqlite (Local Encrypted DB)           │  │
│  │      Contacts | Events | Gift History | Settings     │  │
│  └──────────────────────────┬───────────────────────────┘  │
│                             │                              │
│                             ▼                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │    Scheduled Notification Engine (expo-notifications) │ │
│  │      T-7 Days Nudge | T-3 Days Action | T-0 Alert    │  │
│  └──────────────────────────┬───────────────────────────┘  │
│                             │                              │
│                             ▼                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │             Curated Gift & Greeting Screen           │  │
│  │   • Brand Picker (DoorDash, Starbucks, Amazon)       │  │
│  │   • Amount Chips ([$15], [$25], [$50], [Custom])     │  │
│  │   • AI Greeting Generator (Gemini Flash / Templates) │  │
│  └──────────────┬───────────────────────────┬───────────┘  │
│                 │                           │              │
│                 ▼                           ▼              │
│  ┌──────────────────────────────┐ ┌──────────────────────┐ │
│  │ Partner Deep-Link Handoff    │ │ 1-Tap Share Button   │ │
│  │ • Native App (DoorDash/Amazon│ │ • WhatsApp           │ │
│  │ • In-App Browser Fallback    │ │ • iMessage / SMS     │ │
│  └──────────────────────────────┘ └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Core Data Models (`src/types/index.ts`)

```typescript
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
  sourceCalendarId: string;
  title: string;
  eventType: 'birthday' | 'anniversary' | 'holiday' | 'custom';
  eventDate: string; // ISO date format
  recurrence: 'annual' | 'once';
  notificationDaysBefore: number[]; // [7, 3, 0]
  confidenceScore: number; // 0.0 - 1.0
}

export interface GiftBrand {
  id: string;
  name: string;
  category: 'food' | 'coffee' | 'shopping' | 'experiences';
  logoUrl: string;
  supportedAmounts: number[];
  deepLinkScheme: string; // e.g. "doordash://giftcard" or web affiliate URL
  webFallbackUrl: string;
}

export interface GiftRecord {
  id: string;
  eventId: string;
  contactId: string;
  brandId: string;
  amount: number;
  greetingSent: string;
  createdAt: string;
}
```

---

## 6. Event Detection & Heuristics Logic

```typescript
const BIRTHDAY_KEYWORDS = [/\bb(day|irth(day)?)\b/i, /🎂/, /🎉/, /🎈/];
const ANNIVERSARY_KEYWORDS = [/\banniversary\b/i, /\bwedding\b/i, /💍/, /🥂/];

export function classifyCalendarEvent(title: string): {
  type: 'birthday' | 'anniversary' | 'custom';
  extractedName?: string;
  confidence: number;
} {
  const isBirthday = BIRTHDAY_KEYWORDS.some(pattern => pattern.test(title));
  const isAnniversary = ANNIVERSARY_KEYWORDS.some(pattern => pattern.test(title));

  if (isBirthday) {
    // Extract name pattern: "Maya's Birthday" -> "Maya"
    const match = title.match(/^(.+?)('s|’s)?\s+(birthday|bday)/i);
    return {
      type: 'birthday',
      extractedName: match ? match[1].trim() : undefined,
      confidence: 0.95,
    };
  }

  if (isAnniversary) {
    return {
      type: 'anniversary',
      confidence: 0.90,
    };
  }

  return { type: 'custom', confidence: 0.3 };
}
```

---

## 7. Next Steps & Implementation Roadmap

1. **Phase 1 (MVP Setup):**
   * Initialize Expo SDK 52 + TypeScript + Expo Router project.
   * Build Calendar Ingestion & Event Classifier (`expo-calendar`).
   * Implement Device Contact Matcher (`expo-contacts`).
   * Configure Scheduled Push Notifications (`expo-notifications`).
   * Develop Curated Gift Selection & Amount Picker UI.
   * Integrate AI Greeting Generator & 1-Tap WhatsApp/iMessage Sharing.
   * Configure Partner Deep-Link & In-App Browser Fallbacks (`expo-web-browser`).

2. **Phase 2 (Growth & Monetization):**
   * Register with CJ Affiliate / Rakuten / Impact for Giftcards.com & brand affiliate tags.
   * Add Apple In-App Purchases for "Auto-gifter VIP" (unlimited events, smart AI calendar auto-cleaner).
   * Expand into physical flowers & Magic Claim Links with Merchant of Record / partner APIs.
