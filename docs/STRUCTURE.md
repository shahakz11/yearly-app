# Site Architecture & Sitemap Structure

**Domain:** `https://yearly.click`  
**Site Name:** Yearly — Smart Gifting & Milestone Companion for Google Calendar  
**Target Search Engines:** Google, Bing, Yahoo, DuckDuckGo  
**Last Updated:** 2026-10-05  

---

## 1. URL Architecture & Coverage

All canonical URLs use secure HTTPS protocol and are directly referenced in `sitemap.xml` and allowed in `robots.txt`.

| Page | Path | Canonical URL | Type | Schema Markup | Lastmod | Status |
|---|---|---|---|---|---|---|
| **Landing Page** | `/` | `https://yearly.click/` | Product / Homepage | `WebSite`, `Organization`, `SoftwareApplication` | 2026-10-05 | 200 OK |
| **Help Center & FAQs** | `/support.html` | `https://yearly.click/support.html` | Support / FAQ | `FAQPage`, `BreadcrumbList`, `WebPage` | 2026-10-05 | 200 OK |
| **Privacy Policy** | `/privacy.html` | `https://yearly.click/privacy.html` | Legal / Trust | `BreadcrumbList`, `WebPage` | 2026-10-05 | 200 OK |
| **Terms of Service** | `/terms.html` | `https://yearly.click/terms.html` | Legal / Terms | `BreadcrumbList`, `WebPage` | 2026-10-05 | 200 OK |

---

## 2. Google Search Compliance Matrix

| Rule | Requirement | Implementation | Status |
|---|---|---|---|
| **Protocol Limits** | Max 50,000 URLs per file / 50MB uncompressed | 4 URLs | Passed |
| **Robots Directives** | Disclose sitemap location & allow crawling | `robots.txt` points to `https://yearly.click/sitemap.xml` | Passed |
| **Canonical Alignment** | 1:1 match with `<link rel="canonical">` | Every XML `<loc>` matches canonical head tags | Passed |
| **Index Directives** | No `noindex` or `disallow` on sitemap URLs | `meta name="robots" content="index, follow..."` on all | Passed |
| **Clean XML Standard** | Valid XML 1.0 UTF-8, no deprecated priority/changefreq tags | Standard `<urlset>` with `<loc>` and `<lastmod>` only | Passed |
| **Rich Snippets** | JSON-LD schema for search enhancements | `SoftwareApplication`, `FAQPage`, `BreadcrumbList` | Passed |
| **Social / OpenGraph** | Rich cards for Twitter, Facebook, LinkedIn, Discord | Full OpenGraph + Twitter Summary Large Image tags | Passed |
