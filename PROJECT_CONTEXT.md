# Yearly (yearly.click) - Project Standards & MVP Scope

## 1. Brand & Domain Standards
- **Product Name:** Yearly
- **Domain:** yearly.click
- **Tagline:** "Never miss a milestone. Thoughtful gifts in one click."

## 2. MVP Scope Invariants (Google Workspace Add-on)
- **Primary Surface:** Google Workspace Add-on (Google Calendar Sidebar Card).
- **Core User Flow:** 
  1. Detect celebration events (birthdays, anniversaries, milestones) in Google Calendar.
  2. Display curated FloristOne bouquets with prices and images in the sidebar card.
  3. Clicking "Send Bouquet" opens the pre-loaded FloristOne cart directly in a new tab for the user to complete checkout.
- **Out of Scope for Initial MVP:**
  - AI greeting message generators.
  - WhatsApp share buttons and recipient viral footers.
  - Google Sheet audit logging (`CelebrationLog`).
  - Standalone web app and Chrome extension (deferred to Phase 2).

## 3. Monetization & Catalog
- **Provider:** FloristOne floral delivery catalog (`FloristOneCatalog.csv` / `shared/catalog.json`).
- **Revenue Model:** 15%–20% affiliate commission on bouquet orders (~$10–$16 yield per order).

## 4. Architecture & Extensibility
- Keep the event classifier and FloristOne catalog structures modular and cleanly decoupled so they seamlessly power future surfaces (Chrome extension, `yearly.click` web app, and gift card expansion).
