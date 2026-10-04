# 🗂️ Auto-gifter — Project Backlog

## 🧭 Backlog Workflow (local Kanban)
- **Source of truth**: This file (`BACKLOG.md`). The board reads it and writes updates back into it.
- **Open the Kanban board**:
  - Run `node private/backlog-manager/server.cjs`
  - Visit `http://localhost:3030` (or the port shown in terminal)
- **Formatting rules (must)**:
  - **Section headers must stay exactly**: `### 📥 BACKLOG`, `### 📋 TO DO`, `### 🚧 IN PROGRESS`, `### ✅ DONE`
  - **Task line format**: `- **[ ] [ID: #N] [P: Priority] [A: Assignee] [E: Epic] [T: Type] Title**`
  - **Spec lines**: any indented lines under a task are preserved as the task's spec block.

---

## 🛠️ ACTIVE BACKLOG

### 📥 BACKLOG
- **[ ] [ID: #5] [P: Medium] [A: Unassigned] [E: Growth] [T: Integration] Register Affiliate Networks & Tags**
  Join CJ Affiliate / Rakuten / Impact for Giftcards.com, DoorDash, and Amazon Associates tracking.
- **[ ] [ID: #6] [P: Low] [A: Unassigned] [E: Monetization] [T: Feature] Auto-gifter VIP In-App Purchase**
  Implement StoreKit / Google Play Billing for annual VIP subscription (unlimited events, auto-cleaner).
- **[ ] [ID: #7] [P: Low] [A: Unassigned] [E: Logistics] [T: Exploration] Physical Gifts & Magic Claim Portal**
  Evaluate florist dropship APIs and web-based claim link portal for physical deliveries.

### 📋 TO DO

### 🚧 IN PROGRESS

### ✅ DONE
- **[x] [ID: #11] [P: High] [A: Agent] [E: Workspace] [T: Feature] Calendar Batch Sync & Mobile Hyperlink Format**
  Added "⚡ Sync & Enrich All Celebrations" batch scanning across Google Workspace Add-on and Chrome Extension. Enriched descriptions now format with HTML `<a href="...">` and standalone HTTPS FloristOne cart links for 100% mobile clickable compatibility, plus clean note replacement removing legacy gift card text.
- **[x] [ID: #8] [P: High] [A: Agent] [E: Affiliate] [T: Integration] FloristOne Direct-to-Cart Engine**
  Integrated FloristOne catalog (500+ items across birthday, anniversary, holiday, love, everyday) with 1-click affiliate checkout links (Affiliate ID: `2026097209`), top 5 bestsellers per occasion, and 1-week (7d) & 3-day reminder scheduling.
- **[x] [ID: #9] [P: High] [A: Agent] [E: Workspace] [T: Feature] Google Workspace Add-on Calendar Sidebar & 1-Click Enrichment**
  Built `gas/AddOn.js` CardService UI with 1-click description enrichment, 7d/3d popup reminders, Top 5 bouquets with direct cart purchase buttons, and Google Sheets logger.
- **[x] [ID: #10] [P: High] [A: Agent] [E: Extension] [T: Feature] Chrome Extension MV3 🎁 Badge DOM Injector & Popup**
  Built Manifest V3 Chrome Extension injecting 🎁 badges into Google Calendar web grid with modal gift launcher and direct 1-click FloristOne cart order links.
- **[x] [ID: #1] [P: High] [A: Agent] [E: Core] [T: Setup] Initialize Expo SDK 52 + TypeScript Project**
  Set up React Native Expo project with Expo Router, configuration files, and dependencies.
- **[x] [ID: #2] [P: High] [A: Agent] [E: Core] [T: Feature] Calendar Ingestion & Event Classifier**
  Integrated `expo-calendar` with heuristic classifier for birthdays, anniversaries, and day countdowns.
- **[x] [ID: #3] [P: High] [A: Agent] [E: Core] [T: Feature] Contact Auto-Matching & Local Storage**
  Integrated `expo-contacts` fuzzy matching and persistent `expo-sqlite` database storage.
- **[x] [ID: #4] [P: High] [A: Agent] [E: Core] [T: Feature] Curated Gift Picker, AI Greeting & Deep-Links**
  Built interactive gift picker, amount selection ($15, $25, $50, $100, custom), AI greetings, and deep linking.
- **[x] [ID: #0] [P: High] [A: Agent] [E: Architecture] [T: Design] System Design & Brainstorming Validation**
  Completed comprehensive brainstorming, monetization strategy, local-first architecture, and design spec.
