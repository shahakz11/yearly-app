# Yearly Google Workspace Add-on (GAS) Manual QA Checklist

**Version:** 1.0.0  
**Date:** [YYYY-MM-DD]  
**Tester:** [Tester Name / Handle]  
**Environment:** Workspace Domain / Personal Gmail | Web Calendar Sidebar vs Android/iOS Mobile App | Deployment ID: [AKfy...]  

---

## 1. Setup Instructions (Prerequisites)

1. **Push Apps Script Code**: Deploy or pull latest Google Apps Script code into the target GAS project via `npx clasp push -f` from the repository root.
2. **Install Test Deployment**: In the Google Cloud Console / Apps Script editor, create or install the test deployment from `appsscript.json` manifest via Google Workspace Marketplace SDK / Test Deployments.
3. **Open Google Calendar Companion Bar**: Open Google Calendar (`https://calendar.google.com/`) in Google Chrome. Locate the **Yearly** icon in the right-side companion bar.
4. **Grant OAuth Permissions**: Click the Yearly icon to expand the sidebar card and authorize the requested OAuth scopes (`calendar`, `calendar.events`, `script.external_request`).

---

## 2. Core Flows

- [ ] **A1: Contextual Event Open Trigger**  
  *Scenario:* Select an existing event titled `"Sarah's Birthday 🎂"` in Google Calendar.  
  *Verification:* The Yearly sidebar automatically updates to show celebration details: celebrant name `"Sarah"`, type `birthday`, and high confidence score.

- [ ] **A2: Non-Celebration Event Fallback**  
  *Scenario:* Select a work event titled `"Quarterly Budget Review"`.  
  *Verification:* Sidebar displays clean non-celebration placeholder card with informative guidance and no affiliate gifting buttons.

- [ ] **A3: FloristOne Card Section Rendering**  
  *Scenario:* View the celebration card in sidebar.  
  *Verification:* FloristOne bouquet arrangement cards render with product photo, title, price, and CTA.

- [ ] **A4: Affiliate Link Destination Verification**  
  *Scenario:* Click "Send Bouquet" on a featured floral arrangement.  
  *Verification:* Destination browser tab opens FloristOne checkout with affiliate ID parameter `affiliateid=2026097209`.

- [ ] **A5: Algorithmic Greeting Customization**  
  *Scenario:* Click "Regenerate Greeting" button in sidebar.  
  *Verification:* Greeting refreshes with an alternate personalized message including celebrant name.

- [ ] **A6: 1-Tap WhatsApp Share Link**  
  *Scenario:* Click "Send via WhatsApp".  
  *Verification:* WhatsApp opens with pre-populated greeting text and bouquet link.

- [ ] **A7: Calendar Event Note & 11:00 AM Reminder Enrichment**  
  *Scenario:* Click "Enrich Calendar Event" in sidebar.  
  *Verification:* Event notes now contain FloristOne links and greeting. Popup reminders are set for 14d, 7d, 3d, 1d at 11:00 AM daytime offset `(days * 24 - 11) * 60`.

- [ ] **A8: Daily Scan & Google Sheets Deduplication**  
  *Scenario:* Run `dailyCelebrationScan()` manually or via trigger.  
  *Verification:* Rows append to `CelebrationLog` sheet. Re-running scan preserves rows and does not duplicate existing `eventId` entries.

---

## 3. Visual Checks

- [ ] **CardService Design Compliance**: Brand colors `#FF3008` (primary) and `#006241` (secondary) match specification.
- [ ] **Layout Responsiveness**: Cards render cleanly on standard desktop sidebar width (300px) without clipped text or overflowing buttons.
- [ ] **Loading Spinners & Feedback**: State transitions show native CardService progress indicators and notification callouts upon action completion.

---

## 4. Edge Cases

- [ ] **Read-Only / Subscribed Calendars**: Event is on a subscribed read-only calendar (`isOwnedByMe() === false`). Verify companion bridging handles write restrictions gracefully without uncaught exceptions.
- [ ] **Midnight Timezone Offset**: All-day events starting at 00:00 UTC have reminder offsets calculated relative to 11:00 AM daytime alert window.
- [ ] **Preserve Sent Status**: Event marked `Gift Sent = TRUE` in `CelebrationLog` sheet retains `TRUE` on subsequent daily scans.

---

## 5. Cross-Surface Verification

- [ ] **Multi-Client Consistency**: Verify sidebar card renders identically in Google Calendar Web and inside Google Calendar app on Android / iOS.
- [ ] **Cross-Surface Coexistence**: Verify coexistence with Chrome Extension: Note enrichment performed by add-on does not conflict with extension modal triggers or duplicate notifications.

---

## 6. QA Sign-Off

**Tester Name:** ____________________________________  
**Date:** ____________________  
**Result:** [ ] PASS  /  [ ] FAIL  

- [ ] **CLEARED FOR GOOGLE WORKSPACE MARKETPLACE SUBMISSION**
