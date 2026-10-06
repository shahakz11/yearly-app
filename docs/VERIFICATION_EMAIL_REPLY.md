# Response Template to Google Third-Party Data Safety Team

**Subject**: Re: Google Cloud Project yearly-app-prod-23354 (Project Number: 729862306327) - OAuth Verification Update

---

### Email Body (Copy & Paste to Google)

```text
Dear Google Third-Party Data Safety Team,

Thank you for your guidance regarding the OAuth verification of Google Cloud Project:
- Project ID: yearly-app-prod-23354
- Project Number: 729862306327
- Application Name: Yearly (https://yearly.click)

We have conducted a thorough audit of our application against your compliance checklist, updated our production manifests and Privacy Policy to adhere strictly to the Principle of Least Privilege, and removed all unneeded scopes.

Below is our detailed response addressing every section of your evaluation criteria:

----------------------------------------------------------------------
1. SCOPE CONFIGURATION & LEAST PRIVILEGE AUDIT
----------------------------------------------------------------------
We audited our application and trimmed our requested scopes to the absolute minimum necessary to execute our core user-facing features. We have removed the Google Sheets (spreadsheets) scope entirely.

Our trimmed, active OAuth scopes are:
1. https://www.googleapis.com/auth/calendar.addons.current.event.read
   - Feature: Reads title and date of the currently open calendar event to detect milestone keywords (e.g., birthdays, anniversaries).
   - Justification: Essential for the contextual Add-on card when inspecting a celebration. Narrower scopes do not exist in Workspace Add-on event handlers.

2. https://www.googleapis.com/auth/calendar.addons.current.event.write
   - Feature: Allows the user to enrich an event description with floral delivery links and custom reminders.
   - Justification: Required to write back bouquet recommendations and reminder alarms to the specific event upon user action.

3. https://www.googleapis.com/auth/calendar.addons.execute
   - Feature: Renders contextual UI cards inside the right sidebar of Google Calendar.
   - Justification: Required core structural scope for any Google Workspace Calendar Add-on.

4. https://www.googleapis.com/auth/calendar.events
   - Feature: Automated background scan across upcoming 14–30 days for milestone reminders.
   - Justification: Required during scheduled background triggers when no specific event card is actively open in the UI.

5. https://www.googleapis.com/auth/calendar
   - Feature: CalendarApp service access for setting event popup alerts and notifications.
   - Justification: Required by Apps Script Calendar service to manage reminder alarms.

6. https://www.googleapis.com/auth/userinfo.email & https://www.googleapis.com/auth/userinfo.profile
   - Feature: User identification and personalized greeting name display in the Add-on sidebar.

7. https://www.googleapis.com/auth/script.external_request
   - Feature: Queries FloristOne API via UrlFetchApp to display real-time flower bouquet catalog pricing and photos.

8. https://www.googleapis.com/auth/script.scriptapp
   - Feature: Installs and manages the automated background trigger for weekly reminder refreshes.

----------------------------------------------------------------------
2. DEMO VIDEO
----------------------------------------------------------------------
- Demo Video URL: [INSERT YOUR UNLISTED YOUTUBE LINK HERE - e.g. https://youtu.be/FUiaPHTZMZ0]
- Video Accessibility: Public / Unlisted on YouTube.
- Verification Elements in Video:
  1. Address Bar & Client ID: Displays client_id=729862306327-1dv5iditp4p2h794unngha535ph7g3uv.apps.googleusercontent.com clearly in the browser URL bar during the OAuth consent step (at 0:44).
  2. Consent Screen Visibility: Shows the complete OAuth consent flow with requested Calendar and Apps Script scopes.
  3. Feature Functionality & Account Impact: Demonstrates Google Calendar Add-on scanning milestone celebrations, displaying curated FloristOne bouquets, setting reminder alerts, and enriching calendar event notes live in the user's Google Calendar.

----------------------------------------------------------------------
3. APP ACCESS & TESTING ENVIRONMENT
----------------------------------------------------------------------
- Zero Authentication Blockers: Yearly is a Google Workspace Calendar Add-on. There are no paywalls, phone verification steps, or gated logins.
- Test Access: The reviewer can test the Add-on directly in any standard Google Calendar account using standard Apps Script test deployments or by reviewing the demo video.

----------------------------------------------------------------------
4. PRIVACY POLICY & LIMITED USE COMPLIANCE
----------------------------------------------------------------------
Our Privacy Policy is publicly hosted at: https://yearly.click/privacy.html
Our Terms of Service are publicly hosted at: https://yearly.click/terms.html

Our Privacy Policy explicitly details:
- Section 2: Prominent Limited Use Disclosure: "The use of raw or derived user data received from Workspace APIs will adhere to the Google User Data Policy, including the Limited Use requirements."
- Section 2: Explicit Prohibition on AI/ML Model Training: User data received via Google APIs is NEVER used to develop, train, retrain, improve, or fine-tune generalized or foundation AI/ML models.
- Section 2 & 7: Prohibition on Data Transfer: Google user data is never transferred or sold to third parties, data brokers, or advertisers.
- Section 4 & 5: Clear disclosure of data accessed, used, and processed (strictly calendar event titles and milestone dates).
- Section 6 & 9: Zero-Centralized-Database architecture, local user storage, and instant deletion/revocation procedures.

----------------------------------------------------------------------
5. PROHIBITED USE CASES & CASA ASSESSMENT
----------------------------------------------------------------------
- Yearly does NOT send commercial cold emails, engage in email warming, or store unauthorized user data.
- Yearly only requests Sensitive Calendar and Apps Script scopes. No Restricted scopes (such as full Drive or Gmail access) are requested; therefore CASA third-party assessment is not applicable.

Please let us know if any additional information is required to complete verification and approval for project yearly-app-prod-23354.

Sincerely,
The Yearly Team
support@yearly.click
https://yearly.click
```
