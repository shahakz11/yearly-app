# Auto-Gifter Legal & Regulatory Compliance Roadmap

**App Name:** Auto-Gifter (Chrome Extension & Google Workspace Calendar Add-on)  
**Target Market:** Global (US, EU/UK, Canada, LATAM, APAC)  
**Key Regulatory Frameworks:** Google API Services User Data Policy, Chrome Web Store Developer Policies, GDPR / UK DPA, CCPA / CPRA, FTC Endorsement Guides (16 CFR Part 255).

---

## 1. Core Compliance Checklist & Status

### A. Google Workspace Marketplace & Chrome Web Store Gateways
| Requirement | Status | Action Item |
| :--- | :---: | :--- |
| **Google Limited Use Disclosure** | ⚠️ Required | Must publish exact Google Limited Use wording on a public Privacy Policy URL. |
| **OAuth Scope Justification** | ⚠️ Required | Prepare audit rationale for scopes (`calendar.addons.current.event.read/write`, `spreadsheets`, `external_request`). |
| **Chrome Web Store Single Purpose** | ✅ Passed | Extension strictly enhances calendar workflows with gifting cues and links. |
| **Host Permissions Justification** | ✅ Passed | Permissions confined to `calendar.google.com` and `script.google.com`. |
| **Public Support & Contact Email** | ⚠️ Required | Set up dedicated support email (`privacy@` or `support@yourdomain.com`). |

---

### B. Privacy & Data Protection (GDPR / CCPA)
- **Local / User-Owned Data Paradigm**: Auto-Gifter operates predominantly on-device (Chrome MV3) and within the user's private Google Apps Script and Google Sheet instance (`CelebrationLog`).
- **No Third-Party Data Selling**: Explicitly declare that no calendar data or recipient names are sold, rented, or transferred to third-party data brokers.
- **AI Processing (Gemini API)**: Disclose that if AI greeting personalization is enabled, event titles/recipient names may be sent to Google Generative Language API without using customer data for model training (per Google Cloud terms).

---

### C. Commercial, FTC & Affiliate Disclosures
- **FTC 16 CFR Part 255**: Clear and conspicuous disclosure must be presented wherever affiliate gift links (Amazon, Starbucks, DoorDash, Target, FloristOne) are rendered.
- **Third-Party Trademark Disclaimer**: Must include notice that Amazon, Starbucks, Target, DoorDash, and WhatsApp are trademarks of their respective owners and do not endorse or sponsor Auto-Gifter.
- **WhatsApp Direct Deep Links**: Verify that WhatsApp messages are generated client-side via `https://api.whatsapp.com/send` and dispatched solely by user manual confirmation (100% user-initiated).

---

## 2. Immediate Action Plan

1. **Host Legal Documents Publicly**:
   - Host [PRIVACY_POLICY.md](file:///Users/ggbushi/Documents/Auto-gifter/docs/legal/PRIVACY_POLICY.md) and [TERMS_OF_SERVICE.md](file:///Users/ggbushi/Documents/Auto-gifter/docs/legal/TERMS_OF_SERVICE.md) on a public URL (e.g. GitHub Pages, Vercel, or your landing page).
2. **Submit to Google Cloud Console OAuth Consent Screen**:
   - Add App Logo, Privacy Policy URL, Terms of Service URL, and authorized domains.
   - Provide the demo video and scope explanations for verification.
3. **Include In-App Links**:
   - Link to Privacy Policy and Terms of Service inside the Chrome extension `popup.html` / settings drawer and the Google Apps Script Add-on footer.
