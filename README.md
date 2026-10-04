# Auto-Gifter 🎁

> **Zero-install dual-surface gifting assistant plugging directly into Google Calendar.**  
> Seamlessly detects birthdays, anniversaries, and personal milestones, builds 1-tap WhatsApp greetings with curated affiliate gift cards, and maintains a zero-cost audit trail in Google Sheets.

---

## 1. Architecture Overview

Auto-Gifter solves the friction of forgotten celebrations by embedding gift recommendations directly into the user's primary calendar workflow with **zero standalone app installation required**. It operates across two complementary surfaces powered by a single universal core engine:

```
                          ┌──────────────────────────────────────────────┐
                          │         Google Calendar Web & Mobile         │
                          └──────────────────────┬───────────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
    ┌─────────────────────────────┐                             ┌─────────────────────────────┐
    │  Google Workspace Add-on    │                             │  Chrome Extension (MV3)     │
    │  (Google Apps Script V8)    │                             │  (calendar.google.com)      │
    ├─────────────────────────────┤                             ├─────────────────────────────┤
    │ • CardService sidebar       │                             │ • 🎁 DOM badge injector     │
    │ • onCalendarEventOpen hook  │                             │ • Click-on-badge modal      │
    │ • 8:00 AM 14-day daily cron │                             │ • Toolbar quick-action popup│
    │ • Headless WebApp JSON API  │                             │ • chrome.storage.sync       │
    └──────────────┬──────────────┘                             └──────────────┬──────────────┘
                   │                                                           │
                   │               ┌───────────────────────────┐               │
                   └──────────────►│    Universal Core Engine  │◄──────────────┘
                                   │    (Shared UMD Bundle)    │
                                   ├───────────────────────────┤
                                   │ • Event Classification    │
                                   │ • Recipient Extraction    │
                                   │ • Affiliate Brand Catalog │
                                   │ • Parameterized Greetings │
                                   │ • 1-Tap WhatsApp Link     │
                                   └─────────────┬─────────────┘
                                                 │
                                                 ▼
                                   ┌───────────────────────────┐
                                   │       Google Sheets       │
                                   │     ("CelebrationLog")    │
                                   ├───────────────────────────┤
                                   │ • 9-column audit trail    │
                                   │ • Event ID deduplication  │
                                   │ • Send status tracking    │
                                   └───────────────────────────┘
```

### Surfaces & Capabilities

1. **Google Workspace Add-on (`gas/`)**:
   - Native Calendar contextual sidebar rendered via Google Apps Script `CardService` on desktop and mobile.
   - Listens to calendar event open triggers (`onCalendarEventOpen`), detects celebrations, and displays brand chips ($15, $25, $50, $100), selectable greetings, and a 1-tap WhatsApp share link.
   - Automated 8:00 AM daily trigger scanning the upcoming 14-day calendar window, logging newly discovered events to Google Sheets with dual-key deduplication (`Event ID` + `Date_RecipientName`).
   - Exposes zero-auth headless JSON Web App endpoints (`doGet`/`doPost`) supporting `ping`, `catalog`, `events`, `log_gift`, and `history`.

2. **Chrome Extension (`extension/`)**:
   - Lightweight Manifest V3 extension active on `https://calendar.google.com/*`.
   - Content script injects visual 🎁 badges directly onto Google Calendar event chips via a debounced `MutationObserver` targeting stable ARIA and accessibility attributes (`div[data-eventchip]`, `div[role="button"]`).
   - Clicking a 🎁 badge stops calendar event propagation and opens an in-page gifting modal with brand choices, amount chips, and 1-tap WhatsApp generation.
   - Toolbar popup displays 14-day celebration feed, settings drawer, and offline demo mode fallback (`demoCelebrations.json`).

3. **Universal Core Engine (`shared/`)**:
   - Zero-dependency modules exportable to CommonJS, ESM, Google Apps Script V8 global scope, and Chrome MV3.
   - Byte-identical bundle (`CoreEngine.js`) synced across `shared/`, `gas/`, and `extension/core/` to guarantee 100% bit-identical classification and URL generation.
   - Curated affiliate brands: **Starbucks** (☕), **DoorDash** (🍕), **Amazon** (📦), and **Target** (🎯) with standard amount chips ($15, $25, $50, $100).
   - Smart name extractor supporting possessives (`"Sarah's Birthday 🎂"` -> `"Sarah"`), markers (`"Birthday for Sarah"` -> `"Sarah"`), couple names (`"Dave & Alice"`), diacritics (`Zoë`, `José`), zero-width characters, and stop-word rejection (`"Surprise Birthday Party"` -> `null`).
   - Strict negative filtering rejecting non-celebrations (`"Team Standup"`, `"Doctor Appointment"` -> `isCelebration: false`).

4. **Audit Trail Persistence (`CelebrationLog`)**:
   - Zero-maintenance Google Sheet storing all detected events and gift send records across 9 standard columns.

---

## 2. Code Layout

```
Auto-gifter/
├── shared/                       # Universal Core Engine (TypeScript & UMD)
│   ├── catalog.json              # Curated brands, amounts, affiliate templates
│   ├── catalog.ts                # Catalog accessor and URL interpolator
│   ├── classifier.ts             # Regex/emoji detection, name extraction, negative rejection
│   ├── greetings.ts              # Personalized greeting template matrix
│   ├── whatsapp.ts               # WhatsApp share URL generator
│   ├── index.ts                  # Shared module entry point
│   ├── CoreEngine.js             # Universal zero-dependency standalone bundle
│   └── __tests__/                # Shared unit test suites
├── gas/                          # Google Workspace Add-on (Google Apps Script)
│   ├── appsscript.json           # Add-on manifest with Calendar triggers & scopes
│   ├── CoreEngine.js             # Byte-identical copy of universal core engine
│   ├── AddOn.js                  # CardService sidebar card builder
│   ├── SheetsLogger.js           # CelebrationLog provisioning, deduplication, & logging
│   ├── WebApp.js                 # doGet/doPost JSON dispatcher
│   └── __tests__/                # Hermetic in-memory GAS integration tests
├── extension/                    # Chrome Extension Manifest V3
│   ├── manifest.json             # Manifest V3 configuration
│   ├── core/
│   │   └── CoreEngine.js         # Byte-identical copy of universal core engine
│   ├── content/
│   │   ├── content.js            # Calendar DOM observer & 🎁 badge injector
│   │   └── content.css           # Styling for 🎁 badge and in-calendar modal
│   ├── popup/
│   │   ├── popup.html            # Toolbar popup markup
│   │   ├── popup.js              # Toolbar popup controller & settings drawer
│   │   └── popup.css             # Glassmorphic UI styling
│   ├── storage.js                # chrome.storage.sync abstraction with demo fallback
│   ├── fixtures/
│   │   └── demoCelebrations.json # Offline demo data for instant evaluation
│   └── __tests__/                # Extension unit & JSDOM tests
├── tests/
│   └── e2e/                      # Opaque-box E2E test suite (Tiers 1-5)
│       ├── harness/              # In-memory GAS, Calendar DOM, and Storage simulators
│       ├── fixtures/             # Synthetic calendar fixtures
│       └── __tests__/
│           ├── tier1_feature.test.ts      # Tier 1: Feature isolation tests
│           ├── tier2_boundary.test.ts     # Tier 2: Boundary & adversarial cases
│           ├── tier3_combination.test.ts # Tier 3: Cross-feature combinations
│           ├── tier4_realworld.test.ts   # Tier 4: Real-world scenarios & 60s demo
│           ├── tier5_adversarial.test.ts # Tier 5: Adversarial hardening & parity
│           └── e2e_runner.test.ts        # Master Acceptance Runner
├── DEMO_GUIDE.md                 # 60-second zero-install evaluation guide
└── README.md                     # Comprehensive project documentation
```

---

## 3. Quickstart & Verification

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Installation
```bash
# Clone the repository
git clone https://github.com/your-org/auto-gifter.git
cd auto-gifter

# Install dependencies
npm install
```

### Running Tests
```bash
# Run full repository test suite (Unit + Integration + E2E)
npm test

# Run TypeScript type check
npx tsc --noEmit

# Run only E2E test suite (Tiers 1-5)
npx jest tests/e2e

# Run Tier 5 Adversarial & Cross-Surface Parity tests
npx jest tests/e2e/__tests__/tier5_adversarial.test.ts
```

---

## 4. Google Workspace Add-on Setup

The Workspace Add-on is defined in `/gas` and executes inside the Google Apps Script V8 runtime.

### 1. Create Apps Script Project
1. Visit [script.google.com](https://script.google.com) and create a new project named `Auto-Gifter Backend`.
2. In Project Settings, enable **"Show 'appsscript.json' manifest file in editor"**.
3. Replace the contents of `appsscript.json` with `/gas/appsscript.json`.

### 2. Copy Source Files
Add the following files into your Apps Script editor:
- `CoreEngine.gs` (paste contents of `gas/CoreEngine.js`)
- `AddOn.gs` (paste contents of `gas/AddOn.js`)
- `SheetsLogger.gs` (paste contents of `gas/SheetsLogger.js`)
- `WebApp.gs` (paste contents of `gas/WebApp.js`)

### 3. Install Add-on Triggers
In the script editor, run `installDailyTrigger()` once. This schedules `dailyCelebrationScan()` to run automatically every morning at 8:00 AM, scanning the next 14 days and recording upcoming celebrations to your `CelebrationLog` sheet.

### 4. Deploy Web App JSON API
1. Click **Deploy** > **New deployment**.
2. Select type: **Web app**.
3. Set **Execute as**: *Me (your account)*.
4. Set **Who has access**: *Anyone* (enables extension access without re-authentication).
5. Click **Deploy** and copy your Web App URL (e.g. `https://script.google.com/macros/s/.../exec`).

### 5. Test Contextual Calendar Card
1. Open Google Calendar on web or mobile.
2. Select any birthday or anniversary event (e.g. `"Sarah's Birthday 🎂"`).
3. The Auto-Gifter right-sidebar card opens automatically showing:
   - Celebration status and detected name.
   - Gift brand chips ($15, $25, $50, $100).
   - Pre-written greeting in a selectable text field.
   - 1-tap **"Share via WhatsApp"** button.

---

## 5. Chrome Extension Installation

The extension runs on Manifest V3 and requires zero build steps or bundlers.

### 1. Load Unpacked Extension
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle on **"Developer mode"** in the top-right corner.
3. Click **"Load unpacked"** in the top-left toolbar.
4. Select the `extension/` directory from this repository:
   ```
   /Users/ggbushi/Documents/Auto-gifter/extension
   ```
5. Confirm that **Auto-Gifter** appears in your extension list with version `1.0.0`.

### 2. Configure Backend Connection (Optional)
- By default, Auto-Gifter runs in **Offline Demo Mode**, serving synthetic celebrations from `extension/fixtures/demoCelebrations.json`.
- To connect to your live Google Apps Script backend:
  1. Click the Auto-Gifter 🎁 icon in Chrome's toolbar.
  2. Click the gear icon (⚙️) to open Settings.
  3. Paste your Apps Script Web App URL and click **"Save & Connect"**.

### 3. Experience In-Calendar 🎁 Badges
1. Navigate to [calendar.google.com](https://calendar.google.com).
2. Any event chip matching a celebration pattern (e.g. `"Sarah's Birthday 🎂"`, `"Wedding Anniversary 💍"`) will display a prominent **🎁** badge.
3. Non-celebration events (`"Team Standup"`, `"Doctor Appointment"`) will **never** display a badge.
4. Click the 🎁 badge to open the inline gifting modal with instant 1-tap WhatsApp sharing.

---

## 6. Google Sheets Audit Trail (`CelebrationLog`)

All detected celebrations and sent gifts are recorded in a linked Google Sheet named `CelebrationLog`. If the sheet does not already exist, `SheetsLogger.js` automatically provisions it in the user's Google Drive.

### Sheet Columns (9 Standard Headers)
| # | Column Name | Type | Description | Example |
|---|---|---|---|---|
| 1 | `Date` | string (YYYY-MM-DD) | Calendar event start date | `2026-10-15` |
| 2 | `Recipient Name` | string | Extracted celebrant name | `Sarah` |
| 3 | `Event Type` | string | `birthday`, `anniversary`, or `milestone` | `birthday` |
| 4 | `Gift Sent` | boolean | `TRUE` if gift was shared, else `FALSE` | `TRUE` |
| 5 | `Greeting Used` | string | Text of message sent | `Happy Birthday Sarah! 🎂...` |
| 6 | `Brand Chosen` | string | Selected affiliate gift brand | `Starbucks` |
| 7 | `Amount` | number | Gift card dollar amount | `25` |
| 8 | `Event ID` | string | Unique Google Calendar event ID | `cal_evt_sarah_001` |
| 9 | `Last Updated` | string (ISO) | Last modification timestamp | `2026-10-15T08:00:00.000Z` |

### Idempotency & Deduplication
- Daily scans inspect the next 14 days and check for existing records using `Event ID` as primary key (with fallback to `Date_RecipientName`).
- Running the scan repeatedly **never** creates duplicate rows.
- Existing user edits and `Gift Sent = TRUE` flags are strictly preserved across recurring daily scans.

---

## 7. Verification & Test Architecture

The repository enforces test-driven quality across 5 comprehensive tiers:

| Tier | Focus | Scope | Suites | Tests |
|---|---|---|:---:|:---:|
| **Tier 1: Feature Coverage** | Happy-path isolation | Catalog, Classifier, Greetings, WhatsApp, DOM injection | 1 | 47 |
| **Tier 2: Boundary & Corner Cases** | Adversarial inputs | Whitespace, diacritics, stop-words, negative filtering, amount bounds | 1 | 43 |
| **Tier 3: Combinations & Pipelines** | Cross-feature flows | Detection → Greeting → Brand → WhatsApp → Sheet Pipeline | 1 | 10 |
| **Tier 4: Real-World Scenarios** | Complete workflows | 60-Second Demo Lifecycle, 10-event busy week, daily cron scan | 1 | 6 |
| **Tier 5: Adversarial Hardening** | Complex edge cases | Zero-width chars, bracketed tags, multi-line notes, cross-surface parity | 1 | 29 |
| **Master Acceptance Runner** | Acceptance Criteria | Direct verification of all requirements in ORIGINAL_REQUEST.md | 1 | 10 |
| **Total Test Suite** | Full End-to-End Suite | Hermetic, zero external network dependencies | **6** | **145** |

Run the complete test suite at any time:
```bash
npm test
```

---

## 8. License

MIT License. Designed and engineered for seamless, zero-maintenance personal gifting.
