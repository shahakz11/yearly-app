# Pure Client-Side Chrome Extension Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Yearly Chrome Extension into a 100% pure client-side extension that runs completely on-device without requiring any external Google Apps Script backend, zero server configuration, and zero OAuth permission errors for end users.

**Architecture:** Use the Chrome Extension content script on `calendar.google.com` to scan and classify events directly in the user's active Google Calendar session, cache celebrations and settings in `chrome.storage.local`, use the client-bundled `CoreEngine.js` for greeting generation and gift brand catalogs, and trigger instant sync either automatically or via direct popup-to-tab messaging.

**Tech Stack:** Chrome Extension Manifest V3, JavaScript (ES6+), `chrome.storage.local`, `chrome.tabs`, DOM MutationObserver, Jest / ts-jest test suite.

---

### Task 1: Refactor Storage Layer for Pure Client-Side Architecture

**Files:**
- Modify: `extension/storage.js`
- Test: `tests/extension/popup.test.ts`

**Step 1: Write / Update the failing test in `tests/extension/popup.test.ts`**
- Test that `AutoGifterStorage.syncAllCelebrations()` succeeds locally without needing a `gasWebAppUrl`.
- Test that `getCelebrations()` returns cached celebrations from `chrome.storage.local` with fallback to bundled demo celebrations if no calendar tab has been scanned yet.
- Test that `saveSettings()` and `getSettings()` persist directly to `chrome.storage.local`.

**Step 2: Run test to verify it fails**
Run: `npm test tests/extension/popup.test.ts`
Expected: FAIL due to existing GAS URL requirements in `storage.js`.

**Step 3: Implement pure client-side storage engine**
- Remove requirement for `gasWebAppUrl` and `DEFAULT_GAS_URL`.
- Implement `syncAllCelebrations()` by sending a message to active Google Calendar tab(s) via `chrome.tabs.query({ url: '*://calendar.google.com/*' })` and `chrome.tabs.sendMessage()`. If no calendar tab is currently open, sync from cached local storage or gracefully guide the user to open Google Calendar.
- Update `logGiftSent()` to append records directly to `celebration_history` in `chrome.storage.local`.
- Update `getHistory()` to retrieve logged gifts from `chrome.storage.local`.

**Step 4: Run test to verify it passes**
Run: `npm test tests/extension/popup.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add extension/storage.js tests/extension/popup.test.ts
git commit -m "feat(extension): refactor storage layer to 100% pure client-side"
```

---

### Task 2: Implement On-Demand Calendar Scan in Content Script

**Files:**
- Modify: `extension/content/content.js`
- Test: `tests/extension/content.test.ts`

**Step 1: Write test for content script message listener**
- Test that `chrome.runtime.onMessage` listener handles `action: 'scan_calendar'` and returns detected celebrations from the current DOM view.
- Test that detected celebrations are automatically persisted to `chrome.storage.local`.

**Step 2: Run test to verify it fails**
Run: `npm test tests/extension/content.test.ts`
Expected: FAIL (handler not implemented).

**Step 3: Implement message handler in `extension/content/content.js`**
- Register `chrome.runtime.onMessage.addListener` for `action: 'scan_calendar'`.
- Extract all visible celebration chips, parse names, dates, and milestone types using `CoreEngine.js`.
- Save scanned celebrations into `chrome.storage.local.set({ cached_celebrations: [...] })`.
- Respond with `{ ok: true, celebrations: [...] }`.

**Step 4: Run test to verify it passes**
Run: `npm test tests/extension/content.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add extension/content/content.js tests/extension/content.test.ts
git commit -m "feat(content): add on-demand DOM calendar scanning via runtime message"
```

---

### Task 3: Streamline Popup UI and Settings for Pure Client-Side Mode

**Files:**
- Modify: `extension/popup/popup.html`
- Modify: `extension/popup/popup.js`
- Test: `tests/extension/popup.test.ts`

**Step 1: Write tests for popup UI updates**
- Test that opening settings drawer no longer shows GAS URL field, but displays clean local controls (e.g. reminder interval, default gift brand preference, open calendar shortcut).
- Test that clicking "Sync" triggers immediate local/tab scan and updates UI with celebration cards.

**Step 2: Run test to verify it fails**
Run: `npm test tests/extension/popup.test.ts`
Expected: FAIL.

**Step 3: Update `popup.html` and `popup.js`**
- Remove GAS URL input and webhook backend dependency from Settings drawer.
- In `popup.js`, streamline `handleSyncAllEvents`:
  1. Query active `calendar.google.com` tabs.
  2. If found, request live scan and refresh view.
  3. If not open, load cached celebrations from `chrome.storage.local` and provide a 1-click "Open Google Calendar" shortcut.
- Display instant success badges with zero network latency.

**Step 4: Run test to verify it passes**
Run: `npm test tests/extension/popup.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add extension/popup/popup.html extension/popup/popup.js tests/extension/popup.test.ts
git commit -m "feat(popup): streamline UI for instant client-side sync and settings"
```

---

### Task 4: Manifest Permissions Audit and Cleanup

**Files:**
- Modify: `extension/manifest.json`
- Test: `tests/extension/manifest.test.ts`

**Step 1: Write test for simplified manifest permissions**
- Verify `manifest.json` no longer requires external `script.google.com` or `script.googleusercontent.com` permissions.
- Verify `storage` and `activeTab` / `tabs` permissions are properly declared.

**Step 2: Run test to verify it fails**
Run: `npm test tests/extension/manifest.test.ts`
Expected: FAIL.

**Step 3: Update `extension/manifest.json`**
- Clean up unused host permissions. Keep `https://calendar.google.com/*` and add `tabs` / `storage` as needed.

**Step 4: Run test to verify it passes**
Run: `npm test tests/extension/manifest.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add extension/manifest.json tests/extension/manifest.test.ts
git commit -m "chore(manifest): trim external host permissions for pure client-side operation"
```

---

### Task 5: End-to-End Regression Verification

**Files:**
- Test: `tests/extension/`

**Step 1: Run complete extension test suite**
Run: `npm test`
Expected: All tests pass in < 2 seconds.

**Step 2: Build and verify extension package**
- Verify `extension/` loads cleanly with zero errors in Chrome developer mode.

**Step 3: Commit and update documentation**
```bash
git commit -am "chore: complete pure client-side extension migration"
```
