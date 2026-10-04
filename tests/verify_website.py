#!/usr/bin/env python3
"""
Hermetic Automated Acceptance & Verification Suite for Yearly (yearly.click)
=============================================================================
Authoritative Sources:
  - ORIGINAL_REQUEST.md
  - DISPATCH.md
  - docs/legal/PRIVACY_POLICY.md
  - docs/legal/TERMS_OF_SERVICE.md
  - explorer_survey_3/handoff.md & explorer_survey_1/handoff.md

Validates the static website in docs/:
  1. Required File Existence:
     - docs/index.html
     - docs/privacy.html
     - docs/terms.html
     - docs/support.html
     - docs/CNAME
  2. Custom Domain CNAME Content Fidelity:
     - docs/CNAME contains exactly 'yearly.click' (trimmed single line).
  3. Internal Link & Anchor Integrity:
     - Parses index.html, privacy.html, terms.html, and support.html.
     - Validates every internal relative link points to an existing file.
     - Validates every hash anchor (#id) resolves to a matching id or name in the target DOM.
     - Zero 404s, broken links, or missing anchor targets.
  4. Verbatim Legal & Regulatory Compliance:
     - docs/privacy.html: Verbatim Google API Services User Data Policy / Limited Use statement,
       official policy hyperlink, and 4 core negative covenants.
     - docs/privacy.html: FTC 16 CFR Part 255 affiliate disclosure.
     - docs/terms.html: FTC 16 CFR Part 255 affiliate disclosure with verbatim trigger phrase.
  5. Cross-Device Responsive Layout & Zero Overflow via Playwright:
     - Starts an in-process ephemeral HTTP server serving docs/.
     - Drives Playwright Chromium headless across 3 viewports:
         * Mobile: 375 x 667
         * Tablet: 768 x 1024
         * Desktop: 1280 x 800
     - Asserts document.documentElement.scrollWidth <= window.innerWidth on all 4 pages.
     - Asserts zero unhandled console errors or page errors.
"""

import http.server
import os
import re
import socketserver
import sys
import threading
import time
from pathlib import Path
from typing import List, Tuple
from urllib.parse import urlparse

from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = WORKSPACE_ROOT / "docs"

REQUIRED_FILES = [
    "index.html",
    "privacy.html",
    "terms.html",
    "support.html",
    "CNAME",
]

PAGES_TO_VERIFY = [
    "index.html",
    "privacy.html",
    "terms.html",
    "support.html",
]

VIEWPORTS = [
    {"name": "mobile", "width": 375, "height": 667},
    {"name": "tablet", "width": 768, "height": 1024},
    {"name": "desktop", "width": 1280, "height": 800},
]

# Legal verbatim specifications
GOOGLE_LIMITED_USE_POLICY_URL = "https://developers.google.com/terms/api-services-user-data-policy"

GOOGLE_LIMITED_USE_STATEMENT = (
    "use and transfer to any other app of information received from Google APIs "
    "will adhere to the Google API Services User Data Policy, including the Limited Use requirements"
)

GOOGLE_NEGATIVE_COVENANTS = [
    ("Limited Access", "only access Google Calendar data", "upcoming celebrations"),
    ("No Transfer or Sale", "not transfer, sell, or disclose", "Google Calendar data to third parties"),
    ("No Advertising", "not use Google user data for serving advertisements", ""),
    ("No Human Access", "not allow humans to read", "Google Calendar data"),
]

FTC_TRIGGER_PHRASE = "affiliate commission or referral fee at no extra cost to you"
FTC_CITATION = "FTC 16 CFR Part 255"


def normalize_text(text: str) -> str:
    """Collapses whitespace and normalizes punctuation for reliable text comparison."""
    if not text:
        return ""
    # Replace non-breaking spaces and common unicode quotes/dashes
    text = text.replace("\u00a0", " ").replace("\u201c", '"').replace("\u201d", '"')
    text = text.replace("\u2018", "'").replace("\u2019", "'").replace("\u2014", "--")
    # Collapse multiple whitespaces
    text = re.sub(r"\s+", " ", text).strip()
    # Normalize space before punctuation introduced by HTML tag boundaries (e.g. "Policy , including" -> "Policy, including")
    text = re.sub(r"\s+([,.:;?!])", r"\1", text)
    return text


class WebsiteVerifier:
    def __init__(self, docs_dir: Path):
        self.docs_dir = docs_dir
        self.failures: List[str] = []
        self.warnings: List[str] = []
        self.passed_checks = 0
        self.total_checks = 0

    def record_pass(self, description: str):
        self.passed_checks += 1
        self.total_checks += 1
        print(f"  ✓ {description}")

    def record_fail(self, description: str, error_detail: str):
        self.total_checks += 1
        msg = f"{description}: {error_detail}"
        self.failures.append(msg)
        print(f"  ✗ {msg}")

    # =========================================================================
    # CHECK 1: File Existence
    # =========================================================================
    def check_file_existence(self):
        print("\n[CHECK 1] Required File Existence in docs/")
        for filename in REQUIRED_FILES:
            filepath = self.docs_dir / filename
            if filepath.is_file():
                size = filepath.stat().st_size
                if size > 0:
                    self.record_pass(f"docs/{filename} exists ({size} bytes)")
                else:
                    self.record_fail(f"docs/{filename}", "File is empty (0 bytes)")
            else:
                self.record_fail(f"docs/{filename}", "File does not exist")

    # =========================================================================
    # CHECK 2: CNAME Exact Content
    # =========================================================================
    def check_cname_content(self):
        print("\n[CHECK 2] CNAME Content Exact Fidelity")
        cname_path = self.docs_dir / "CNAME"
        if not cname_path.is_file():
            self.record_fail("docs/CNAME", "File does not exist, cannot verify content")
            return

        try:
            raw_content = cname_path.read_text(encoding="utf-8")
            trimmed = raw_content.strip()
            lines = [line.strip() for line in raw_content.splitlines() if line.strip()]

            if len(lines) > 1:
                self.record_fail(
                    "docs/CNAME content",
                    f"Expected single-line domain, found multiple lines: {lines}",
                )
            elif trimmed == "yearly.click":
                self.record_pass("docs/CNAME contains exactly 'yearly.click'")
            else:
                self.record_fail(
                    "docs/CNAME content",
                    f"Expected 'yearly.click', got '{trimmed}'",
                )
        except Exception as e:
            self.record_fail("docs/CNAME read error", str(e))

    # =========================================================================
    # CHECK 3: Verbatim Legal Disclosures
    # =========================================================================
    def check_legal_disclosures(self):
        print("\n[CHECK 3] Legal & Regulatory Verbatim Disclosures")

        # 3A: docs/privacy.html Google Limited Use Statement & Covenants
        privacy_path = self.docs_dir / "privacy.html"
        if not privacy_path.is_file():
            self.record_fail("docs/privacy.html", "File does not exist for legal verification")
        else:
            try:
                content = privacy_path.read_text(encoding="utf-8")
                soup = BeautifulSoup(content, "html.parser")
                norm_page_text = normalize_text(soup.get_text(separator=" "))

                # Core Limited Use Statement
                if normalize_text(GOOGLE_LIMITED_USE_STATEMENT).lower() in norm_page_text.lower():
                    self.record_pass("privacy.html: Google Limited Use core statement matched verbatim")
                else:
                    self.record_fail(
                        "privacy.html: Google Limited Use statement",
                        f"Expected verbatim phrase: '{GOOGLE_LIMITED_USE_STATEMENT}'",
                    )

                # Hyperlink to Google policy
                links = [a.get("href", "").strip() for a in soup.find_all("a", href=True)]
                if any(href.rstrip("/") == GOOGLE_LIMITED_USE_POLICY_URL.rstrip("/") for href in links):
                    self.record_pass(
                        f"privacy.html: Hyperlink to official policy URL verified ({GOOGLE_LIMITED_USE_POLICY_URL})"
                    )
                else:
                    self.record_fail(
                        "privacy.html: Google Policy URL link",
                        f"Missing required link to {GOOGLE_LIMITED_USE_POLICY_URL}",
                    )

                # 4 Negative Covenants
                for covenant_name, phrase_a, phrase_b in GOOGLE_NEGATIVE_COVENANTS:
                    matched_a = phrase_a.lower() in norm_page_text.lower()
                    matched_b = phrase_b.lower() in norm_page_text.lower() if phrase_b else True
                    if matched_a and matched_b:
                        self.record_pass(f"privacy.html: Negative covenant '{covenant_name}' verified")
                    else:
                        missing = []
                        if not matched_a:
                            missing.append(f"'{phrase_a}'")
                        if not matched_b:
                            missing.append(f"'{phrase_b}'")
                        self.record_fail(
                            f"privacy.html: Covenant '{covenant_name}'",
                            f"Missing required phrasing: {', '.join(missing)}",
                        )

                # FTC Disclosure in privacy.html
                if FTC_CITATION.lower() in norm_page_text.lower():
                    self.record_pass(f"privacy.html: '{FTC_CITATION}' citation present")
                else:
                    self.record_fail(
                        "privacy.html: FTC Disclosure",
                        f"Missing '{FTC_CITATION}' citation",
                    )

                if FTC_TRIGGER_PHRASE.lower() in norm_page_text.lower():
                    self.record_pass(
                        f"privacy.html: Verbatim FTC trigger phrase present ('{FTC_TRIGGER_PHRASE}')"
                    )
                else:
                    self.record_fail(
                        "privacy.html: FTC Trigger Phrase",
                        f"Missing verbatim phrase: '{FTC_TRIGGER_PHRASE}'",
                    )

            except Exception as e:
                self.record_fail("privacy.html legal parse error", str(e))

        # 3B: docs/terms.html FTC 16 CFR Part 255 Affiliate Disclosure
        terms_path = self.docs_dir / "terms.html"
        if not terms_path.is_file():
            self.record_fail("docs/terms.html", "File does not exist for legal verification")
        else:
            try:
                content = terms_path.read_text(encoding="utf-8")
                soup = BeautifulSoup(content, "html.parser")
                norm_page_text = normalize_text(soup.get_text(separator=" "))

                if FTC_CITATION.lower() in norm_page_text.lower():
                    self.record_pass(f"terms.html: '{FTC_CITATION}' citation present")
                else:
                    self.record_fail(
                        "terms.html: FTC Disclosure",
                        f"Missing '{FTC_CITATION}' citation",
                    )

                if FTC_TRIGGER_PHRASE.lower() in norm_page_text.lower():
                    self.record_pass(
                        f"terms.html: Verbatim FTC trigger phrase present ('{FTC_TRIGGER_PHRASE}')"
                    )
                else:
                    self.record_fail(
                        "terms.html: FTC Trigger Phrase",
                        f"Missing verbatim phrase: '{FTC_TRIGGER_PHRASE}'",
                    )

            except Exception as e:
                self.record_fail("terms.html legal parse error", str(e))

    # =========================================================================
    # CHECK 4: Internal Link & Anchor Integrity (0 Broken Links)
    # =========================================================================
    def check_link_integrity(self):
        print("\n[CHECK 4] Internal Link & Anchor Integrity Across All 4 Pages")
        parsed_soups = {}

        # Pre-load soups for fast target anchor inspection
        for page_name in PAGES_TO_VERIFY:
            page_path = self.docs_dir / page_name
            if page_path.is_file():
                try:
                    parsed_soups[page_name] = BeautifulSoup(
                        page_path.read_text(encoding="utf-8"), "html.parser"
                    )
                except Exception as e:
                    self.record_fail(f"{page_name} HTML parse", str(e))

        if not parsed_soups:
            self.record_fail("Link Integrity", "No HTML files found to parse")
            return

        for source_page, soup in parsed_soups.items():
            anchors = soup.find_all("a", href=True)
            link_count = len(anchors)
            broken_on_page = 0

            for a in anchors:
                href = a["href"].strip()
                if not href or href == "#":
                    continue

                # Skip non-HTTP protocols
                if href.startswith(("mailto:", "tel:", "javascript:")):
                    continue

                # Skip external links (syntactic check)
                if href.startswith(("http://", "https://", "//")):
                    continue

                # Handle same-page anchor link: #section-id
                if href.startswith("#"):
                    anchor_id = href[1:]
                    if anchor_id and anchor_id.lower() != "top":
                        target_element = soup.find(id=anchor_id) or soup.find(attrs={"name": anchor_id})
                        if not target_element:
                            broken_on_page += 1
                            self.record_fail(
                                f"{source_page}: broken internal anchor '{href}'",
                                f"No element with id='{anchor_id}' or name='{anchor_id}' in {source_page}",
                            )
                    continue

                # Handle relative page link (with optional anchor)
                # Examples: 'privacy.html', './terms.html', '/support.html', 'privacy.html#google-limited-use'
                parsed_url = urlparse(href)
                raw_path = parsed_url.path
                if raw_path.startswith("./"):
                    clean_path = raw_path[2:]
                elif raw_path.startswith("/"):
                    clean_path = raw_path[1:]
                else:
                    clean_path = raw_path

                target_anchor = parsed_url.fragment

                if clean_path in ("", "index.html"):
                    if not clean_path and target_anchor:
                        target_file_name = source_page
                    else:
                        target_file_name = "index.html"
                else:
                    target_file_name = clean_path

                target_file_path = (self.docs_dir / target_file_name).resolve()

                # Verify file exists within docs directory
                if not target_file_path.is_file():
                    broken_on_page += 1
                    self.record_fail(
                        f"{source_page}: broken relative link '{href}'",
                        f"Target file does not exist: docs/{target_file_name}",
                    )
                    continue

                # Verify target anchor if specified
                if target_anchor and target_anchor.lower() != "top":
                    target_soup = parsed_soups.get(target_file_name)
                    if not target_soup and target_file_path.suffix in [".html", ".htm"]:
                        try:
                            target_soup = BeautifulSoup(
                                target_file_path.read_text(encoding="utf-8"), "html.parser"
                            )
                            parsed_soups[target_file_name] = target_soup
                        except Exception:
                            pass

                    if target_soup:
                        target_elem = target_soup.find(id=target_anchor) or target_soup.find(
                            attrs={"name": target_anchor}
                        )
                        if not target_elem:
                            broken_on_page += 1
                            self.record_fail(
                                f"{source_page}: broken cross-page anchor in '{href}'",
                                f"No element with id='{target_anchor}' in docs/{target_file_name}",
                            )

            if broken_on_page == 0:
                self.record_pass(f"{source_page}: All {link_count} links & anchors verified intact")

    # =========================================================================
    # CHECK 5: Playwright Multi-Viewport Responsive & Overflow Audit
    # =========================================================================
    def check_responsive_layout(self):
        print("\n[CHECK 5] Playwright Headless Chromium Responsive & Overflow Audit")

        # Start ephemeral local HTTP server serving dynamically from self.docs_dir
        serve_dir = str(self.docs_dir)

        class QuietDocsHTTPHandler(http.server.SimpleHTTPRequestHandler):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, directory=serve_dir, **kwargs)

            def log_message(self, format, *args):
                pass

        server = socketserver.TCPServer(("127.0.0.1", 0), QuietDocsHTTPHandler)
        port = server.server_address[1]
        server_thread = threading.Thread(target=server.serve_forever, daemon=True)
        server_thread.start()
        base_url = f"http://127.0.0.1:{port}"

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                context = browser.new_context()

                for page_name in PAGES_TO_VERIFY:
                    page_path = self.docs_dir / page_name
                    if not page_path.is_file():
                        self.record_fail(
                            f"Responsive layout for {page_name}",
                            f"Cannot test: docs/{page_name} does not exist",
                        )
                        continue

                    for vp in VIEWPORTS:
                        vp_label = f"{page_name} @ {vp['name']} ({vp['width']}x{vp['height']})"
                        console_errors = []
                        page_errors = []

                        page = context.new_page()
                        page.set_viewport_size({"width": vp["width"], "height": vp["height"]})

                        page.on(
                            "console",
                            lambda msg: console_errors.append(msg.text)
                            if msg.type == "error"
                            else None,
                        )
                        page.on("pageerror", lambda exc: page_errors.append(str(exc)))

                        target_url = f"{base_url}/{page_name}"
                        try:
                            response = page.goto(target_url, wait_until="load", timeout=4000)
                            try:
                                page.wait_for_load_state("networkidle", timeout=1000)
                            except Exception:
                                pass

                            if not response or response.status != 200:
                                status = response.status if response else "No response"
                                self.record_fail(
                                    vp_label,
                                    f"HTTP status {status} (expected 200)",
                                )
                                page.close()
                                continue

                            # JavaScript evaluation for horizontal overflow
                            overflow_data = page.evaluate("""() => {
                                const winWidth = window.innerWidth;
                                const docWidth = document.documentElement.scrollWidth;
                                const bodyWidth = document.body ? document.body.scrollWidth : 0;
                                
                                // Tolerance of 1px for browser sub-pixel rounding
                                const hasOverflow = (docWidth > winWidth + 1) || (bodyWidth > winWidth + 1);
                                
                                let offenders = [];
                                if (hasOverflow) {
                                    const all = document.querySelectorAll('*');
                                    for (const el of all) {
                                        const r = el.getBoundingClientRect();
                                        if (r.right > winWidth + 1) {
                                            offenders.push({
                                                tag: el.tagName.toLowerCase(),
                                                id: el.id || '',
                                                className: (typeof el.className === 'string' ? el.className.slice(0, 50) : ''),
                                                right: Math.round(r.right),
                                                limit: winWidth
                                            });
                                        }
                                    }
                                }
                                return {
                                    winWidth,
                                    docWidth,
                                    bodyWidth,
                                    hasOverflow,
                                    offenders: offenders.slice(0, 3)
                                };
                            }""")

                            if overflow_data["hasOverflow"]:
                                self.record_fail(
                                    vp_label,
                                    f"Horizontal overflow! docWidth={overflow_data['docWidth']}px, "
                                    f"bodyWidth={overflow_data['bodyWidth']}px > windowWidth={overflow_data['winWidth']}px. "
                                    f"Offending elements: {overflow_data['offenders']}",
                                )
                            else:
                                self.record_pass(
                                    f"{vp_label}: 0 horizontal overflow (docWidth={overflow_data['docWidth']}px <= {overflow_data['winWidth']}px)"
                                )

                            # Uncaught JS exceptions are always failures
                            if page_errors:
                                self.record_fail(
                                    f"{vp_label} page errors",
                                    f"Uncaught JavaScript exceptions: {page_errors[:2]}",
                                )

                            # Filter benign external network connection errors in offline/sandboxed mode
                            real_console_errors = [
                                err for err in console_errors
                                if not any(ign in err for ign in ["net::ERR_", "favicon.ico", "Failed to load resource"])
                            ]
                            if real_console_errors:
                                self.record_fail(
                                    f"{vp_label} console errors",
                                    f"Encountered {len(real_console_errors)} error(s): {real_console_errors[:2]}",
                                )

                        except Exception as e:
                            self.record_fail(vp_label, f"Playwright navigation failed: {e}")
                        finally:
                            page.close()

                context.close()
                browser.close()

        except Exception as e:
            self.record_fail("Playwright Suite Execution", str(e))
        finally:
            server.shutdown()

    # =========================================================================
    # Runner & Summary
    # =========================================================================
    def run_all(self) -> int:
        start_time = time.time()
        print("=" * 75)
        print("  YEARLY STATIC WEBSITE (yearly.click) ACCEPTANCE VERIFICATION")
        print(f"  Target Root: {self.docs_dir}")
        print("=" * 75)

        self.check_file_existence()
        self.check_cname_content()
        self.check_legal_disclosures()
        self.check_link_integrity()
        self.check_responsive_layout()

        elapsed = time.time() - start_time

        print("\n" + "=" * 75)
        print(f"  VERIFICATION SUMMARY (Completed in {elapsed:.2f}s)")
        print(f"  Checks: {self.passed_checks}/{self.total_checks} passed")
        print("=" * 75)

        if not self.failures:
            print("\n🎉 ALL ACCEPTANCE CRITERIA PASSED! (GREEN STATE)")
            print("Website is ready for deployment and compliance review.")
            return 0
        else:
            print(f"\n❌ {len(self.failures)} FAILURE(S) DETECTED (EXPECTED RED STATE):")
            for idx, failure in enumerate(self.failures, 1):
                print(f"  {idx}. {failure}")
            print("\nStatus: RED (Implementation pending or in progress)")
            return 1


def run_self_test() -> int:
    """Self-test harness verifying that WebsiteVerifier properly validates a compliant site."""
    import tempfile
    print("Running WebsiteVerifier self-test against compliant fixture...")
    with tempfile.TemporaryDirectory() as tmp_dir_str:
        tmp_dir = Path(tmp_dir_str)
        (tmp_dir / "CNAME").write_text("yearly.click\n", encoding="utf-8")

        # privacy.html fixture
        (tmp_dir / "privacy.html").write_text(
            """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy | Yearly</title>
</head>
<body style="margin: 0; padding: 20px; font-family: sans-serif; box-sizing: border-box;">
  <nav><a href="index.html">Home</a> | <a href="terms.html">Terms</a> | <a href="support.html">Support</a></nav>
  <h1>Privacy Policy</h1>
  <div id="google-limited-use">
    <h3>Google API Services User Data Policy Compliance</h3>
    <p>Yearly's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
    <ul>
      <li>We only access Google Calendar data necessary to identify upcoming celebrations.</li>
      <li>We do not transfer, sell, or disclose your Google Calendar data to third parties.</li>
      <li>We do not use Google user data for serving advertisements.</li>
      <li>We do not allow humans to read your Google Calendar data.</li>
    </ul>
  </div>
  <div id="affiliate">
    <h3>FTC 16 CFR Part 255</h3>
    <p>Yearly may receive an affiliate commission or referral fee at no extra cost to you.</p>
  </div>
</body>
</html>""",
            encoding="utf-8",
        )

        # terms.html fixture
        (tmp_dir / "terms.html").write_text(
            """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service | Yearly</title>
</head>
<body style="margin: 0; padding: 20px; font-family: sans-serif; box-sizing: border-box;">
  <nav><a href="index.html">Home</a> | <a href="privacy.html">Privacy</a> | <a href="support.html">Support</a></nav>
  <h1>Terms of Service</h1>
  <div id="disclosure">
    <h3>Affiliate and Commercial Disclosure (FTC 16 CFR Part 255)</h3>
    <p>When you make a purchase through merchant links, Yearly may receive an affiliate commission or referral fee at no extra cost to you.</p>
  </div>
</body>
</html>""",
            encoding="utf-8",
        )

        # support.html fixture
        (tmp_dir / "support.html").write_text(
            """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support &amp; FAQ | Yearly</title>
</head>
<body style="margin: 0; padding: 20px; font-family: sans-serif; box-sizing: border-box;">
  <nav><a href="index.html">Home</a> | <a href="privacy.html">Privacy</a> | <a href="terms.html">Terms</a></nav>
  <h1>Support &amp; FAQ</h1>
  <p id="contact">For inquiries, contact support@yearly.click</p>
</body>
</html>""",
            encoding="utf-8",
        )

        # index.html fixture
        (tmp_dir / "index.html").write_text(
            """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yearly - Never miss a milestone</title>
</head>
<body style="margin: 0; padding: 20px; font-family: sans-serif; box-sizing: border-box;">
  <nav>
    <a href="privacy.html#google-limited-use">Privacy Policy</a> |
    <a href="terms.html#disclosure">Terms</a> |
    <a href="support.html#contact">Support</a>
  </nav>
  <h1>Yearly</h1>
  <p>Never miss a milestone. Thoughtful gifts in one click.</p>
</body>
</html>""",
            encoding="utf-8",
        )

        verifier = WebsiteVerifier(tmp_dir)
        return verifier.run_all()


def main():
    if "--self-test" in sys.argv:
        sys.exit(run_self_test())

    verifier = WebsiteVerifier(DOCS_DIR)
    sys.exit(verifier.run_all())


if __name__ == "__main__":
    main()
