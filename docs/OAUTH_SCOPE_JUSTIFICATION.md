# Google OAuth Scopes Justification & Verification Document

**Google Cloud Project**: `yearly-app-prod-23354`  
**Project Number**: `729862306327`  
**Application Name**: Yearly  
**App Website**: https://yearly.click  
**Privacy Policy**: https://yearly.click/privacy.html  
**Terms of Service**: https://yearly.click/terms.html  

---

## 1. Executive Summary & Least-Privilege Commitment
Yearly is an intelligent celebration assistant and Google Workspace™ Calendar Add-on. It helps users never forget birthdays, anniversaries, and personal milestones by scanning upcoming calendar events, providing timely reminder notifications, and suggesting curated floral arrangements via FloristOne.

Yearly operates under a strict **Zero-Centralized-Database architecture**. No user calendar entries, personal notes, or email metadata are ever harvested, transferred, or stored on external databases. All user settings are saved exclusively in user-scoped properties (`PropertiesService.getUserProperties()`).

---

## 2. Granular OAuth Scopes Justification Table

| # | Requested OAuth Scope | Type | User-Facing Feature | Justification (Why Narrower Scopes Are Not Viable) |
|---|---|---|---|---|
| 1 | `https://www.googleapis.com/auth/calendar.addons.current.event.read` | Sensitive / Workspace Add-on | **Contextual Celebration Detection** | Required when a user opens an individual event in Google Calendar. The Add-on inspects the title and timestamp of that specific event to identify milestone keywords (e.g. "Sarah's Birthday", "Wedding Anniversary"). A narrower scope does not exist for reading the active event within a Workspace Add-on context. |
| 2 | `https://www.googleapis.com/auth/calendar.addons.current.event.write` | Sensitive / Workspace Add-on | **1-Click Celebration Enrichment** | When the user chooses to enrich an event with gift recommendations or setup reminder alarms, this permission allows the Add-on to update the description of the currently selected event with the curated FloristOne bouquet link. Narrower read-only scopes cannot write or enrich event descriptions. |
| 3 | `https://www.googleapis.com/auth/calendar.addons.execute` | Core / Workspace Add-on | **Workspace Add-on Execution & Sidebar UI** | Required by the Google Workspace Add-on runtime infrastructure to render contextual UI cards in the right sidebar of Google Calendar. The Add-on cannot render or execute without this fundamental structural permission. |
| 4 | `https://www.googleapis.com/auth/calendar.events` | Sensitive / Calendar API | **Automated Proactive Celebration Scanner** | Required by the scheduled weekly/daily background trigger (`weeklyCelebrationScan`) to inspect upcoming calendar events across the next 14–30 days and configure standard calendar alert notifications. `calendar.addons.current.event.*` only operates when a user is actively viewing a single event card; `calendar.events` is essential for background scanning while the user is away. |
| 5 | `https://www.googleapis.com/auth/calendar` | Sensitive / Calendar API | **Calendar Service Lifecycle & Alert Management** | Required by Google Apps Script runtime `CalendarApp` to manage popup notification alarms and calendar event reminders across the user's personal calendar. |
| 6 | `https://www.googleapis.com/auth/userinfo.email` | Non-sensitive / Identity | **User Authentication & Session Identification** | Used solely to identify the authenticated user in Apps Script and associate their private user preferences via `PropertiesService.getUserProperties()`. |
| 7 | `https://www.googleapis.com/auth/userinfo.profile` | Non-sensitive / Identity | **Personalized Card Greeting** | Used solely to display the user's first name in the Add-on greeting header (e.g., "Welcome back, Sarah"). |
| 8 | `https://www.googleapis.com/auth/script.external_request` | Non-sensitive / Apps Script | **Real-Time Flower Catalog Fetching** | Required by Google Apps Script `UrlFetchApp` to query the FloristOne product catalog API to display live bouquet pricing, product images, and valid delivery checkout links. |
| 9 | `https://www.googleapis.com/auth/script.scriptapp` | Non-sensitive / Apps Script | **Background Reminder Trigger Management** | Required to programmatically install and maintain the weekly background trigger (`weeklyCelebrationScan`) that refreshes upcoming milestone reminders. |

---

## 3. Limited Use & Policy Compliance Declarations

- **Verbatim Limited Use Statement**: *"The use of raw or derived user data received from Workspace APIs will adhere to the Google User Data Policy, including the Limited Use requirements."*
- **No AI/ML Model Training**: User data and calendar metadata received through Google APIs are **never** used to develop, train, retrain, improve, or fine-tune generalized or foundation AI/ML models.
- **No Third-Party AI Data Transfer**: Google Workspace user data is never transferred to third-party services for AI model training or data broker services.
- **No Prohibited Use Cases**: Yearly does not engage in email sending, cold outreach, surveillance, credit scoring, or ad targeting.
- **Zero Authentication Blockers**: The application has no phone-number verification, paywalls, or gated credentials. Any standard Google user can install and run the Add-on directly within Google Calendar.
