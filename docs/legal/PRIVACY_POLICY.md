# Privacy Policy for Auto-Gifter

**Last Updated:** October 2, 2026  
**Effective Date:** October 2, 2026

*Disclaimer: This document is a template designed to meet legal and regulatory requirements. Consult with a qualified attorney for legal advice specific to your business and jurisdiction.*

---

## 1. Introduction

Auto-Gifter ("we", "our", or "us") provides a dual-surface celebration assistant consisting of a Google Workspace™ Calendar Add-on and a Chrome™ Extension (collectively, the "Service"). We respect your privacy and are committed to protecting personal data.

This Privacy Policy explains what information we collect, how we process and protect it, and your rights under data protection laws including the General Data Protection Regulation (GDPR), the California Consumer Privacy Act / California Privacy Rights Act (CCPA/CPRA), and Google API Services™ User Data Policy.

---

## 2. Google API Services™ User Data Policy Compliance (Limited Use Disclosure)

Auto-Gifter's use and transfer to any other app of information received from Google™ APIs will adhere to the **[Google API Services™ User Data Policy](https://developers.google.com/terms/api-services-user-data-policy)**, including the Limited Use requirements.

- We only access Google Calendar™ data necessary to identify upcoming celebrations (such as birthdays, anniversaries, and milestones).
- We do not transfer, sell, or disclose your Google Calendar™ data to third parties, except as strictly necessary to provide the user-facing functionality of the Service or comply with applicable law.
- We do not use Google™ user data for serving advertisements, including personalized, re-targeted, or interest-based advertising.
- We do not allow humans to read your Google Calendar™ data unless we have obtained your affirmative agreement for specific messages (e.g., technical support), it is necessary for security purposes (such as investigating abuse), to comply with applicable law, or for the Service's internal operations where the data has been aggregated and anonymized.

---

## 3. Information We Collect

### A. Information Processed Locally or In Your Workspace
- **Calendar Event Metadata**: Event titles (e.g., "Sarah's Birthday"), dates, and times to extract recipient names and milestone categories.
- **Log Data in Google Sheets™**: Celebration records logged into a private spreadsheet (`CelebrationLog`) created within your personal Google Drive™ account.
- **Extension Settings**: Preferences (such as default budget tier, brand preferences, or demo mode) stored via `chrome.storage.sync` or `localStorage`.

### B. Information We Do NOT Collect
- We do **not** collect passwords, payment card details, bank credentials, or government IDs.
- We do **not** operate centralized surveillance databases tracking your personal calendar schedules.

---

## 4. How We Use Information

We process information solely to:
1. Detect celebration events in your calendar and surface contextual gift card recommendations and personalized greeting cards.
2. Build 1-tap WhatsApp deep links (`https://api.whatsapp.com/send`) containing pre-composed greetings for you to review and send manually.
3. Maintain your private gift history audit log in your own Google Sheet™.
4. If enabled, generate AI greetings using the Google Generative Language API™ (Gemini™ API) without retaining personal prompt data for public model training.

---

## 5. Data Sharing and Third-Party Services

We do not sell your personal data. We interact with the following third-party service providers solely to perform necessary app functions:
- **Google Workspace™ / Google Calendar™ / Google Drive™ / Google Sheets™**: To read calendar entries and write to your designated spreadsheet upon your explicit authorization.
- **WhatsApp**: To open a client-side chat deep link with your selected greeting. WhatsApp's privacy practices are governed by Meta / WhatsApp Terms.
- **Affiliate & Merchant Partners (e.g., Amazon, Starbucks, DoorDash, Target, FloristOne)**: When you click an affiliate link, you are redirected to the merchant's platform. Their terms and privacy policies govern all purchases.
- **Google Generative AI™ (Gemini™)**: If AI-assisted greetings are utilized, short event prompt snippets are processed securely per Google Cloud™ enterprise privacy terms.

---

## 6. Data Retention and Storage

- **Local & User-Controlled Storage**: All calendar metadata processed by the Chrome extension stays in your local browser session or is synchronized across your signed-in Google Chrome™ profile via `chrome.storage.sync`.
- **Google Apps Script™ & Sheets™**: All audit trails reside within your personal Google Account™ ecosystem. You can view, modify, or delete your `CelebrationLog` Google Sheet™ at any time.

---

## 7. Your Rights (GDPR & CCPA/CPRA)

Depending on your jurisdiction, you have the right to:
- **Access & Portability**: Inspect and export your data directly from your Google Sheet™ or Chrome™ extension settings.
- **Correction & Erasure**: Clear your local extension storage or delete rows/sheets in your Google Drive™ at will.
- **Revoke Permissions**: Revoke Auto-Gifter's Google Account™ permissions at any time via [Google Account Security Settings](https://myaccount.google.com/permissions).
- **Opt-Out of Sale / Sharing**: We do not sell or share personal data for cross-context behavioral advertising.

---

## 8. Security

We implement technical and organizational security controls:
- Communication occurs exclusively over encrypted HTTPS connections.
- OAuth 2.0 least-privilege scoping is enforced.
- Execution logic runs in sandboxed browser content scripts and Google Apps Script™ V8 runtimes.

---

## 9. Contact Us

If you have questions, privacy concerns, or requests regarding this Privacy Policy:
- **Email:** `support@auto-gifter.com` (or your registered support address)
- **Repository:** Auto-Gifter Project
