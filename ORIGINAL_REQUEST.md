# Original User Request

## 2026-09-28T15:34:42Z

Build **Auto-Gifter** — a dual-surface gifting assistant that plugs directly into Google Calendar with zero app install required. It consists of two complementary surfaces that share a single core engine:

1. A **Google Workspace Add-on** (Google Apps Script) that renders a native right-panel sidebar card inside Google Calendar (desktop and mobile).
2. A **Chrome Extension** (Manifest V3) that injects visual 🎁 gift-reminder badges onto the Google Calendar web UI and provides a toolbar popup for quick access.

Working directory: `/Users/ggbushi/Documents/Auto-gifter`
Integrity mode: `demo`

---

## Requirements

### R1. Shared Core Engine
Both surfaces must use a shared core engine (implemented in the GAS project and/or a `shared/catalog.json`) that:
- Detects upcoming celebrations (birthdays, anniversaries, custom milestones) from the user's Google Calendar by scanning event titles and notes for keywords and emoji patterns (`🎂`, `bday`, `birthday`, `anniversary`, `💍`).
- Provides a curated catalog of affiliate gift card brands (at minimum: Starbucks, DoorDash, Amazon, Target) with configurable amount chips ($15, $25, $50, $100) and affiliate URL templates that include a tracking sub-ID.
- Generates a personalized greeting message from pre-written templates parameterized by recipient name, relationship type, and celebration type (birthday / anniversary).
- Constructs a 1-tap WhatsApp share URL (`https://api.whatsapp.com/send?text=...`) combining the greeting and the selected gift link.

### R2. Google Workspace Add-on (Google Apps Script)
- On any calendar event open trigger, a sidebar card renders via `CardService` showing:
  - Whether the event is a detected celebration (name, type, confidence).
  - Gift brand chips the user can tap to open the affiliate link.
  - A generated greeting with a copy-to-clipboard and WhatsApp share button.
- A time-driven daily trigger scans the next 14 days of calendar events and logs upcoming celebrations to a linked Google Sheet (sheet name: `CelebrationLog`) with columns: Date, Recipient Name, Event Type, Gift Sent (boolean), Greeting Used.
- The Google Apps Script project exposes a `doGet(e)` JSON endpoint so the Chrome Extension can fetch the brand catalog and upcoming events without the user needing to re-authenticate.

### R3. Chrome Extension (Manifest V3)
- A content script runs on `calendar.google.com` and injects a small 🎁 badge on any calendar event chip whose title matches a celebration pattern.
- Clicking the badge or the toolbar popup opens a compact UI (popup) showing:
  - Upcoming celebrations in the next 14 days fetched from the GAS `doGet` endpoint.
  - 1-tap gift links and the pre-written greeting for each upcoming event.
  - A WhatsApp share button that opens in a new tab.
- The extension stores the GAS web app URL in `chrome.storage.sync` so the user only needs to configure it once.

### R4. Persistence via Google Sheets
- All gift send events (brand chosen, amount, recipient, date) are logged to the `CelebrationLog` Google Sheet via the GAS backend so there is a zero-cost audit trail and gift history visible to the user.

---

## Acceptance Criteria

### Event Detection
- [ ] Given a calendar event titled `"Sarah's Birthday 🎂"`, the classifier correctly identifies it as a `birthday` event and extracts `"Sarah"` as the recipient name.
- [ ] Given a calendar event titled `"Wedding Anniversary 💍"`, the classifier correctly identifies it as an `anniversary` event.
- [ ] Non-celebration events (e.g. `"Team Standup"`, `"Doctor Appointment"`) are not flagged as celebrations.

### Workspace Add-on
- [ ] Opening a detected birthday event in Google Calendar renders the Auto-Gifter sidebar card with at least 2 gift brand options and a WhatsApp share button.
- [ ] Tapping a gift brand chip opens the correct affiliate URL in a new browser tab.
- [ ] The daily trigger runs and appends at least one row to the `CelebrationLog` Google Sheet for any celebration within the next 14 days.

### Chrome Extension
- [ ] The extension loads on `calendar.google.com` without console errors.
- [ ] A 🎁 badge is visible on at least one correctly detected celebration event chip in the calendar grid.
- [ ] The toolbar popup displays upcoming celebrations and their WhatsApp share buttons.

### End-to-End Flow
- [ ] A tester can follow the full flow — open calendar → see detected birthday → tap gift card → WhatsApp opens with pre-filled greeting and gift link — in under 60 seconds with no external backend other than the GAS web app URL.


## 2026-10-04T13:00:29Z

This is a single self-contained feature; keep it small and focused.

Build a clean, high-performance, mobile-responsive static website for Yearly (yearly.click) deployed via GitHub Pages from the `docs/` folder in the repository. The site must serve as the official public web presence and legal compliance hub required for Google Workspace Marketplace and Google OAuth verification.

Working directory: `/Users/ggbushi/Documents/Auto-gifter/docs`
Integrity mode: development

## Requirements

### R1. Landing Page (`index.html`)
- Build a modern, elegant, responsive landing page using semantic HTML5 and Tailwind CSS.
- Showcase Yearly's value proposition: *"Never miss a milestone. Thoughtful gifts in one click."*
- Highlight Google Calendar integration, curated FloristOne bouquets, and 1-click cart checkout.
- Include clear installation CTAs for the Google Workspace Add-on, preview screenshots/cards, and links to Privacy, Terms, and Support.

### R2. Legal & Compliance Hub (`privacy.html` & `terms.html`)
- Render formatted, styled versions of the existing legal markdown files in `docs/legal/` (`PRIVACY_POLICY.md` and `TERMS_OF_SERVICE.md`).
- Include verbatim Google API Services User Data Policy / Limited Use statement, local storage disclosures, FTC 16 CFR Part 255 affiliate disclosures, and GDPR/CCPA privacy rights.

### R3. Support & FAQ Page (`support.html`)
- Comprehensive support page with frequently asked questions regarding calendar permissions, gifting checkout, and privacy.
- Prominent contact card for `support@yearly.click`.

### R4. GitHub Pages & DNS Deployment Bundle
- Create `CNAME` containing `yearly.click`.
- Provide a clear, step-by-step DNS record cheatsheet (A records `185.199.108.153`, etc., and CNAME `www` pointing to GitHub Pages) specifically for Spaceship domain management.

## Acceptance Criteria

### Automated & Objective Validation
- [ ] `docs/index.html`, `docs/privacy.html`, `docs/terms.html`, `docs/support.html`, and `docs/CNAME` exist.
- [ ] `docs/CNAME` contains exactly `yearly.click`.
- [ ] All internal navigation links between pages resolve correctly with zero 404 or broken links.
- [ ] Google Limited Use Disclosure and FTC affiliate disclaimer text match the legal specs verbatim in `privacy.html`.
- [ ] Layout is verified clean and fully responsive without horizontal overflow on mobile (375px), tablet (768px), and desktop (1280px).
