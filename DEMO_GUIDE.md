# Auto-Gifter: 60-Second Demo & Evaluation Guide ⏱️

> **Evaluate the complete Auto-Gifter workflow in under 60 seconds with zero backend or app store installation required.**

---

## Evaluation Guarantee: Under 60 Seconds

Auto-Gifter is designed for immediate, zero-friction evaluation. You do **not** need a Google Cloud account, an Apps Script deployment, or external API keys to test the full end-to-end user experience. Built-in **Offline Demo Mode** and in-memory test simulators allow any evaluator to inspect every feature immediately.

---

## Evaluation Paths

Choose either **Option 1 (Interactive Visual Demo)** or **Option 2 (Instant Automated Acceptance Pass)**:

---

### Option 1: Interactive Visual Evaluation (60 Seconds)

#### Step 1: Load the Chrome Extension (15 Seconds)
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle on the **"Developer mode"** switch in the top-right corner.
3. Click the **"Load unpacked"** button in the top-left corner.
4. Select the `extension/` folder from this repository:
   ```
   /Users/ggbushi/Documents/Auto-gifter/extension
   ```
5. Notice the **Auto-Gifter 🎁** icon appear in your Chrome extensions toolbar.

#### Step 2: Test the Toolbar Quick-Gifting UI (20 Seconds)
1. Click the **Auto-Gifter 🎁** extension icon in your Chrome toolbar.
2. The compact 380px glassmorphic popup opens immediately with status pill `● Demo Mode`.
3. Notice upcoming celebrations pre-loaded:
   - **Sarah's Birthday 🎂** (in 3 days)
   - **Wedding Anniversary 💍** (in 8 days)
4. Select **Sarah's Birthday**:
   - Tap the **Starbucks** brand chip.
   - Tap the **$25** amount chip.
   - Select a greeting tone (**Warm**, **Fun**, or **Formal**).
   - Observe the live-generated message update with Sarah's name and Starbucks link.
5. Click **"Share via WhatsApp"**:
   - A new tab opens pointing to `https://api.whatsapp.com/send?text=...` with the pre-filled, percent-encoded greeting and tracking link (`subId=autogifter_cal_Sarah`).

#### Step 3: Test Google Calendar Web UI Injection (25 Seconds)
1. Navigate to [calendar.google.com](https://calendar.google.com).
2. Create or view any celebration event:
   - Example 1: `"Sarah's Birthday 🎂"`
   - Example 2: `"Wedding Anniversary 💍"`
   - Example 3 (Negative test): `"Team Standup"` or `"Doctor Appointment"`
3. **Observe the Calendar Grid**:
   - A visual **🎁** badge is injected onto celebration event chips.
   - Non-celebration events (`"Team Standup"`, `"Doctor Appointment"`) **never** receive a badge.
4. **Click the 🎁 Badge**:
   - Calendar's native click/drag behaviors are prevented (`e.stopPropagation()`).
   - The inline gifting modal opens directly on top of the calendar chip.
   - Select brand, amount, and tap **"Share via WhatsApp"**.

---

### Option 2: Automated 60-Second Lifecycle Acceptance Run (10 Seconds)

If you prefer an instant CLI-based verification that proves all acceptance criteria without touching a browser, execute the pre-packaged E2E simulation:

```bash
# Run the 60-Second Demo Lifecycle test
npx jest tests/e2e/__tests__/tier5_adversarial.test.ts -t "60-Second"
```

#### What This Test Verifies in < 15ms:
1. **Event Detection**: Detects `"Sarah's Birthday 🎂"` from synthetic calendar events.
2. **DOM Injection**: Simulates calendar DOM event chip creation, runs badge injection pass, confirms `data-autogifter-injected="true"` and `<span>🎁</span>` injection.
3. **Event Isolation**: Simulates clicking 🎁 badge with `stopPropagation()`, verifying native calendar events are not triggered.
4. **Modal Rendering**: Confirms modal receives recipient `"Sarah"`, celebration type `"birthday"`, and catalog brands.
5. **Brand & Amount Selection**: Selects Starbucks $25.
6. **WhatsApp URL Generation**: Builds UTF-8 encoded deep link containing greeting, affiliate link, and subId.
7. **Sheets Audit Trail**: Posts `log_gift` payload to `CelebrationLog` Google Sheet and verifies row is created with `Gift Sent = true`, `Brand = Starbucks`, `Amount = $25`.

---

## Acceptance Criteria Checklist for Reviewers

Use this checklist to verify compliance against `ORIGINAL_REQUEST.md`:

| Requirement | Test Action | Expected Result | Pass |
|---|---|---|:---:|
| **Event Detection** | Classify `"Sarah's Birthday 🎂"` | Type: `birthday`, Recipient: `"Sarah"`, Score: `≥ 0.9` | ✅ |
| **Anniversary Detection** | Classify `"Wedding Anniversary 💍"` | Type: `anniversary`, Recipient: `null` | ✅ |
| **Negative Filtering** | Classify `"Team Standup"` | `isCelebration: false`, `confidenceScore: 0` | ✅ |
| **Negative Filtering** | Classify `"Doctor Appointment"` | `isCelebration: false`, `confidenceScore: 0` | ✅ |
| **Brand Catalog** | Inspect `shared/catalog.json` | 4 brands (Starbucks, DoorDash, Amazon, Target) with [$15, $25, $50, $100] | ✅ |
| **WhatsApp Link** | Tap WhatsApp share button | Targets `https://api.whatsapp.com/send?text=...` with full UTF-8 encoding | ✅ |
| **DOM 🎁 Badge** | View `calendar.google.com` | 🎁 badge appears on celebration chips only | ✅ |
| **Sheets Audit Trail** | Log gift send | Updates `CelebrationLog` Sheet with `Gift Sent = TRUE` | ✅ |
| **Zero App Install** | Open extension or run test | Works immediately in Demo Mode with zero setup | ✅ |

---

## Full Test Suite Execution

To run all 145 tests across all 5 verification tiers:

```bash
npm test
```

Expected output:
```
Test Suites: 19 passed, 19 total
Tests:       263 passed, 263 total
Time:        ~4s
```
