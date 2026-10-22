# Yearly Chrome Extension (MV3) Manual QA Checklist

**Version:** 1.0.2  
**Date:** [YYYY-MM-DD]  
**Tester:** [Tester Name / Handle]  
**Environment:** Chrome [Version] | OS: macOS / Windows / Linux | Calendar: Personal Gmail / Workspace  

---

## 1. Setup Instructions (Prerequisites)

1. **Enable Developer Mode**: In Google Chrome, navigate to `chrome://extensions/` and toggle **Developer mode** to ON in the top-right corner.
2. **Load Unpacked Extension**: Click **Load unpacked** and select the `/Users/ggbushi/Documents/Auto-gifter/extension` directory from the repository.
3. **Pin and Verify Presence**: Confirm that **Yearly** ("Yearly - Google Calendar Assistant") appears in the extension list without warnings or errors. Note the Extension ID. Pin Yearly to the Chrome toolbar for quick access.
4. **Prepare Calendar Environment**: Open an active Google Calendar tab at `https://calendar.google.com/`. Open Chrome DevTools (`Cmd+Option+I` or `F12`) to inspect console logs and storage changes.

---

## 2. Core Flows

- [ ] **F1: Celebration Event Detection & 🎁 Badge Injection**  
  *Scenario:* Create a new calendar event titled `"Sarah's Birthday 🎂"`.  
  *Verification:* Ensure a responsive 🎁 badge (`[data-yearly-badge="true"]`) appears at the beginning of the event chip within 2 seconds without shifting or distorting the Google Calendar grid layout.
  
- [ ] **F2: Non-Celebration Isolation**  
  *Scenario:* Create a regular calendar event titled `"Team Standup & Sprint Sync"`.  
  *Verification:* Ensure NO 🎁 badge is injected on the event chip; the event DOM is left untouched.
  
- [ ] **F3: In-Calendar Gift Modal Launch**  
  *Scenario:* Click directly on the 🎁 badge of `"Sarah's Birthday 🎂"`.  
  *Verification:* An in-calendar modal dialog opens centered with celebrant name `"Sarah"` pre-filled. Background calendar interaction is blocked by an accessible overlay backdrop.

- [ ] **F4: Curated FloristOne Floral Arrangements Display & Affiliate Tracking**  
  *Scenario:* In the opened gifting modal, inspect the bouquet selection.  
  *Verification:* At least 4 curated bouquets display with high-resolution images, names, and pricing. Clicking "Send Bouquet" opens `https://www.floristone.com/...` in a new tab containing affiliate ID parameter `affiliateid=2026097209`.

- [ ] **F5: Dynamic Personalized Greeting Interpolation**  
  *Scenario:* Review the greeting text area inside the modal.  
  *Verification:* Greeting contains recipient name `"Sarah"` and birthday-specific sentiment. Tapping "Regenerate" rotates to an alternate friendly template.

- [ ] **F6: 1-Tap WhatsApp Sharing**  
  *Scenario:* Click the green "Send via WhatsApp" button.  
  *Verification:* A new browser tab opens `https://api.whatsapp.com/send?text=...` with properly URL-encoded greeting and the FloristOne gifting link.

- [ ] **F7: Toolbar Popup Quick Scan & Synchronous Progress**  
  *Scenario:* Click the Yearly icon in the Chrome toolbar. Click **"⚡ Sync & Enrich All Celebrations"**.  
  *Verification:* Progress bar animates to 100%. The celebration count badge updates (`[data-testid="celebration-count"]`), and upcoming milestones render in the popup list.

- [ ] **F8: Reminder Preferences Persistence**  
  *Scenario:* In the toolbar popup, open the Settings Drawer (⚙️). Toggle on 14-day and 1-day reminders, click "Save Reminder Settings".  
  *Verification:* Reopen the popup or reload the extension; checkboxes remain in the newly selected state (`chrome.storage.sync` persisted).

---

## 3. Visual Checks

- [ ] **Badge Alignment**: 🎁 emoji is vertically centered inside Google Calendar chip with appropriate left margin (4px) across Month, Week, and Day views.
- [ ] **High-DPI Icon Fidelity**: Icons (16px, 32px, 48px, 128px) render crisp on Retina and 4K displays without blurring or pixelation.
- [ ] **Modal Overlay Backdrop**: Background blur/dim applies smoothly; clicking outside the modal or pressing the `Escape` key closes the modal cleanly.
- [ ] **Dark Mode Compatibility**: If Google Calendar or the operating system is in Dark Mode, contrast on modal cards, text, and buttons remains WCAG AA compliant.

---

## 4. Edge Cases

- [ ] **Multi-Day All-Day Events**: Create a birthday event spanning 3 days. Verify badge is only injected once on the primary container and does not duplicate across split chips.
- [ ] **Multilingual Celebration Titles**: Test `"Cumpleaños de Valentina 🎂"` and `"Anniversaire de Luc 💍"`. Verify names `"Valentina"` and `"Luc"` extract correctly.
- [ ] **Special Characters & Apostrophes**: Test `"D'Angelo's Birthday Party 🎂"`. Verify escaping does not corrupt modal display or WhatsApp URL query parameters.
- [ ] **Rapid Clicking / Idempotency**: Rapidly double-click or triple-click the 🎁 badge. Verify only a single modal instance opens and no duplicate DOM elements are created.

---

## 5. Local + Production Simultaneously

- [ ] **Profile Partitioning**: Load both the local unpacked extension and the Chrome Web Store production build in separate Chrome profiles.
- [ ] **Storage Isolation**: Verify `chrome.storage.sync` storage partitions do not cross-contaminate between profiles.
- [ ] **No DOM Badge Clashing**: Ensure calendar DOM injection does not duplicate badges if both extensions are active simultaneously on the same machine.

---

## 6. QA Sign-Off

**Tester Name:** ____________________________________  
**Date:** ____________________  
**Result:** [ ] PASS  /  [ ] FAIL  

- [ ] **CLEARED FOR SUBMISSION TO CHROME WEB STORE**
