import asyncio
import base64
import os
from playwright.async_api import async_playwright

def get_base64_image(image_path):
    with open(image_path, "rb") as image_file:
        encoded = base64.b64encode(image_file.read()).decode('utf-8')
        ext = os.path.splitext(image_path)[1].replace('.', '')
        if ext == 'jpg': ext = 'jpeg'
        return f"data:image/{ext};base64,{encoded}"

async def generate_all_assets():
    os.makedirs('marketing-kit', exist_ok=True)
    os.makedirs('marketplace-assets', exist_ok=True)

    logo_b64 = get_base64_image('marketplace-assets/icon-512x512.png')
    screenshot_modal_b64 = get_base64_image('Screenshot 2026-10-07 at 0.33.37.png')

    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # ====================================================
        # 1. PROMO SMALL (440x280) - Marketplace Tile
        # ====================================================
        page_small = await browser.new_page(viewport={'width': 440, 'height': 280})
        html_small = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
            * {{ box-sizing: border-box; margin: 0; padding: 0; }}
            body {{
              width: 440px;
              height: 280px;
              font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
              background: radial-gradient(circle at 85% 20%, #4c0d25 0%, #1a1738 45%, #0b0e17 100%);
              color: #ffffff;
              overflow: hidden;
              position: relative;
              padding: 22px 24px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }}
            .glow-1 {{
              position: absolute;
              top: -30px;
              right: -30px;
              width: 220px;
              height: 220px;
              background: radial-gradient(circle, rgba(244, 63, 94, 0.38) 0%, rgba(244, 63, 94, 0) 70%);
              pointer-events: none;
            }}
            .header {{
              display: flex;
              align-items: center;
              gap: 15px;
              z-index: 2;
            }}
            .logo {{
              width: 68px;
              height: 68px;
              border-radius: 17px;
              box-shadow: 0 10px 24px -4px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2);
              background: #fff;
              flex-shrink: 0;
            }}
            .title-area {{
              display: flex;
              flex-direction: column;
              gap: 2px;
            }}
            .app-title {{
              font-size: 26px;
              font-weight: 900;
              letter-spacing: -0.03em;
              line-height: 1.1;
              color: #ffffff;
            }}
            .app-sub {{
              font-size: 13px;
              font-weight: 700;
              color: #fb7185;
              letter-spacing: -0.01em;
            }}
            .body-text {{
              font-size: 12.5px;
              line-height: 1.5;
              color: #cbd5e1;
              z-index: 2;
              margin: 4px 0;
            }}
            .body-text strong {{
              color: #ffffff;
              font-weight: 700;
            }}
            .tags {{
              display: flex;
              align-items: center;
              gap: 8px;
              z-index: 2;
            }}
            .tag {{
              display: inline-flex;
              align-items: center;
              gap: 5.5px;
              padding: 6px 11px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 0.01em;
            }}
            .tag-primary {{
              background: linear-gradient(135deg, #f43f5e, #e11d48);
              color: #ffffff;
              box-shadow: 0 4px 12px rgba(244, 63, 94, 0.4);
            }}
            .tag-glass {{
              background: rgba(255, 255, 255, 0.09);
              backdrop-filter: blur(12px);
              border: 1px solid rgba(255, 255, 255, 0.16);
              color: #e2e8f0;
            }}
            .tag svg {{
              width: 13px;
              height: 13px;
              flex-shrink: 0;
            }}
          </style>
        </head>
        <body>
          <div class="glow-1"></div>
          
          <div class="header">
            <img class="logo" src="{logo_b64}" alt="Yearly Logo" />
            <div class="title-area">
              <div class="app-title">Yearly</div>
              <div class="app-sub">Gifting in Google Calendar™</div>
            </div>
          </div>

          <div class="body-text">
            Never miss a birthday or anniversary.<br>
            <strong>Hand-crafted local florist delivery</strong> across US & Canada.
          </div>

          <div class="tags">
            <div class="tag tag-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V12m0 0a4.5 4.5 0 1 1-4.5 4.5M12 12a4.5 4.5 0 1 0 4.5 4.5M12 12v9.5"/>
              </svg>
              1-Click Flowers
            </div>
            <div class="tag tag-glass">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              100% Private
            </div>
            <div class="tag tag-glass">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              Auto-Detect
            </div>
          </div>
        </body>
        </html>
        """
        await page_small.set_content(html_small)
        await page_small.wait_for_timeout(300)
        await page_small.screenshot(path='marketplace-assets/promo-small-440x280.png', type='png')
        await page_small.screenshot(path='marketing-kit/promo-small-440x280.png', type='png')
        await page_small.close()

        # ====================================================
        # 2. PROMO MARQUEE (1400x560) - Marketplace Hero Marquee
        # ====================================================
        page_marquee = await browser.new_page(viewport={'width': 1400, 'height': 560})
        html_marquee = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
            * {{ box-sizing: border-box; margin: 0; padding: 0; }}
            body {{
              width: 1400px;
              height: 560px;
              font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
              background: radial-gradient(circle at 75% 30%, #3e0b24 0%, #16173a 50%, #080c16 100%);
              color: #ffffff;
              overflow: hidden;
              position: relative;
              padding: 48px 64px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }}
            .glow-bg {{
              position: absolute;
              top: -80px;
              right: 180px;
              width: 580px;
              height: 580px;
              background: radial-gradient(circle, rgba(244, 63, 94, 0.32) 0%, rgba(244, 63, 94, 0) 70%);
              pointer-events: none;
            }}
            .left-col {{
              width: 660px;
              display: flex;
              flex-direction: column;
              gap: 20px;
              z-index: 2;
            }}
            .brand-header {{
              display: flex;
              align-items: center;
              gap: 20px;
            }}
            .brand-logo {{
              width: 96px;
              height: 96px;
              border-radius: 24px;
              box-shadow: 0 16px 36px -6px rgba(0, 0, 0, 0.6), 0 0 0 1.5px rgba(255, 255, 255, 0.2);
              background: #fff;
              flex-shrink: 0;
            }}
            .brand-title-wrap {{
              display: flex;
              flex-direction: column;
              gap: 4px;
            }}
            .brand-title {{
              font-size: 44px;
              font-weight: 900;
              letter-spacing: -0.03em;
              line-height: 1;
            }}
            .brand-sub {{
              font-size: 19px;
              font-weight: 700;
              color: #fb7185;
              letter-spacing: -0.015em;
            }}
            .headline {{
              font-size: 18px;
              line-height: 1.55;
              color: #cbd5e1;
              font-weight: 400;
            }}
            .headline strong {{
              color: #ffffff;
              font-weight: 700;
            }}
            .tag-row {{
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              align-items: center;
            }}
            .tag-pill {{
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 9px 16px;
              border-radius: 9999px;
              font-size: 13.5px;
              font-weight: 700;
            }}
            .tag-primary {{
              background: linear-gradient(135deg, #f43f5e, #e11d48);
              color: #ffffff;
              box-shadow: 0 6px 20px rgba(244, 63, 94, 0.35);
            }}
            .tag-glass {{
              background: rgba(255, 255, 255, 0.08);
              backdrop-filter: blur(16px);
              border: 1px solid rgba(255, 255, 255, 0.16);
              color: #e2e8f0;
            }}
            .tag-pill svg {{
              width: 16px;
              height: 16px;
              flex-shrink: 0;
            }}
            .flag-group {{
              display: inline-flex;
              align-items: center;
              gap: 5px;
            }}
            
            .right-col {{
              width: 540px;
              position: relative;
              z-index: 2;
              display: flex;
              justify-content: center;
              align-items: center;
            }}
            .mockup-frame {{
              width: 520px;
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 24px 60px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.18);
              background: #ffffff;
              transform: perspective(1000px) rotateY(-4deg) rotateX(2deg);
            }}
            .mockup-frame img {{
              width: 100%;
              display: block;
            }}
            .badge-float {{
              position: absolute;
              bottom: -14px;
              left: 24px;
              background: #10b981;
              color: #ffffff;
              padding: 8px 16px;
              border-radius: 9999px;
              font-size: 13px;
              font-weight: 800;
              display: flex;
              align-items: center;
              gap: 6px;
              box-shadow: 0 10px 25px rgba(16, 185, 129, 0.45);
            }}
            .badge-float svg {{
              width: 15px;
              height: 15px;
            }}
          </style>
        </head>
        <body>
          <div class="glow-bg"></div>

          <div class="left-col">
            <div class="brand-header">
              <img class="brand-logo" src="{logo_b64}" alt="Yearly Logo" />
              <div class="brand-title-wrap">
                <div class="brand-title">Yearly</div>
                <div class="brand-sub">Smart Gifting Assistant for Google Calendar™</div>
              </div>
            </div>

            <div class="headline">
              Seamlessly detect celebrations from your schedule, preview <strong>curated FloristOne flower bouquets</strong>, and deliver thoughtful gifts in 1-click.
            </div>

            <div class="tag-row">
              <div class="tag-pill tag-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V12m0 0a4.5 4.5 0 1 1-4.5 4.5M12 12a4.5 4.5 0 1 0 4.5 4.5M12 12v9.5"/>
                </svg>
                1-Click Florist Delivery
              </div>
              <div class="tag-pill tag-glass">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                100% Private (Local Sync)
              </div>
              <div class="tag-pill tag-glass">
                <div class="flag-group">
                  <svg viewBox="0 0 24 16" width="18" height="12">
                    <rect width="24" height="16" fill="#B22234"/>
                    <rect y="2.5" width="24" height="2.5" fill="#fff"/>
                    <rect y="7.5" width="24" height="2.5" fill="#fff"/>
                    <rect y="12.5" width="24" height="2.5" fill="#fff"/>
                    <rect width="10" height="9" fill="#3C3B6E"/>
                  </svg>
                  <svg viewBox="0 0 24 16" width="18" height="12">
                    <rect width="24" height="16" fill="#FF0000"/>
                    <rect x="6" width="12" height="16" fill="#FFFFFF"/>
                    <path d="M12 4L13 7H15L13.5 8.5L14.5 11.5L12 9.5L9.5 11.5L10.5 8.5L9 7H11L12 4Z" fill="#FF0000"/>
                  </svg>
                </div>
                US & Canada Delivery
              </div>
            </div>
          </div>

          <div class="right-col">
            <div class="mockup-frame">
              <img src="{screenshot_modal_b64}" alt="Bouquet selection modal" />
            </div>
            <div class="badge-float">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              5-Star Florist Network
            </div>
          </div>
        </body>
        </html>
        """
        await page_marquee.set_content(html_marquee)
        await page_marquee.wait_for_timeout(300)
        await page_marquee.screenshot(path='marketplace-assets/promo-marquee-1400x560.png', type='png')
        await page_marquee.screenshot(path='marketing-kit/marketplace-marquee-1400x560.png', type='png')
        await page_marquee.close()

        # ====================================================
        # 3. SOCIAL SHARE CARD (1200x630) - Clean Typography
        # ====================================================
        page_social = await browser.new_page(viewport={'width': 1200, 'height': 630})
        html_social = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
            * {{ box-sizing: border-box; margin: 0; padding: 0; }}
            body {{
              width: 1200px;
              height: 630px;
              font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
              background: radial-gradient(circle at 75% 25%, #4a0d24 0%, #151638 48%, #080c16 100%);
              color: #ffffff;
              overflow: hidden;
              position: relative;
              padding: 40px 52px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }}
            .glow-1 {{
              position: absolute;
              top: -60px;
              right: 120px;
              width: 540px;
              height: 540px;
              background: radial-gradient(circle, rgba(244, 63, 94, 0.32) 0%, rgba(244, 63, 94, 0) 70%);
              pointer-events: none;
            }}
            .top-row {{
              display: flex;
              align-items: center;
              justify-content: space-between;
              z-index: 2;
            }}
            .brand-left {{
              display: flex;
              align-items: center;
              gap: 16px;
            }}
            .logo {{
              width: 64px;
              height: 64px;
              border-radius: 16px;
              box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.2);
              background: #fff;
            }}
            .brand-name {{
              font-size: 32px;
              font-weight: 900;
              letter-spacing: -0.03em;
            }}
            .brand-tag {{
              font-size: 14px;
              font-weight: 700;
              color: #fb7185;
            }}
            .partner-chip {{
              display: flex;
              align-items: center;
              gap: 8px;
              background: rgba(255, 255, 255, 0.08);
              backdrop-filter: blur(12px);
              border: 1px solid rgba(255, 255, 255, 0.16);
              padding: 7px 16px;
              border-radius: 9999px;
              font-size: 13px;
              font-weight: 700;
              color: #e2e8f0;
            }}
            .partner-chip svg {{
              width: 15px;
              height: 15px;
              color: #10b981;
            }}
            
            .center-content {{
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 36px;
              z-index: 2;
            }}
            .copy-box {{
              width: 580px;
              display: flex;
              flex-direction: column;
              gap: 14px;
            }}
            .hero-title {{
              font-size: 38px;
              font-weight: 900;
              line-height: 1.18;
              letter-spacing: -0.03em;
            }}
            .hero-title .accent {{
              background: linear-gradient(135deg, #f43f5e 20%, #fb7185 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }}
            .hero-desc {{
              font-size: 15.5px;
              line-height: 1.5;
              color: #cbd5e1;
            }}
            
            .preview-side {{
              width: 480px;
              display: flex;
              justify-content: center;
            }}
            .preview-card {{
              width: 100%;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 50px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.18);
              transform: perspective(1000px) rotateY(-4deg) rotateX(2deg);
            }}
            .preview-card img {{
              width: 100%;
              display: block;
            }}
            
            .steps-row {{
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 14px;
              z-index: 2;
            }}
            .step-card {{
              background: rgba(255, 255, 255, 0.06);
              backdrop-filter: blur(14px);
              border: 1px solid rgba(255, 255, 255, 0.12);
              border-radius: 14px;
              padding: 12px 16px;
              display: flex;
              align-items: center;
              gap: 12px;
            }}
            .step-icon-wrap {{
              width: 36px;
              height: 36px;
              border-radius: 10px;
              background: linear-gradient(135deg, #f43f5e, #e11d48);
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }}
            .step-icon-wrap svg {{
              width: 18px;
              height: 18px;
              color: #fff;
            }}
            .step-info {{
              display: flex;
              flex-direction: column;
              gap: 2px;
            }}
            .step-title {{
              font-size: 13.5px;
              font-weight: 800;
              color: #ffffff;
            }}
            .step-sub {{
              font-size: 11.5px;
              color: #94a3b8;
            }}
          </style>
        </head>
        <body>
          <div class="glow-1"></div>
          
          <div class="top-row">
            <div class="brand-left">
              <img class="logo" src="{logo_b64}" alt="Yearly Logo" />
              <div>
                <div class="brand-name">Yearly</div>
                <div class="brand-tag">Gifting for Google Calendar™</div>
              </div>
            </div>
            <div class="partner-chip">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              FloristOne Official Partner
            </div>
          </div>

          <div class="center-content">
            <div class="copy-box">
              <div class="hero-title">Never miss a milestone<br><span class="accent">Thoughtful gifts in one click</span></div>
              <div class="hero-desc">
                Instantly detects birthdays and anniversaries from Google Calendar, recommending curated FloristOne bouquets for seamless delivery across the US & Canada.
              </div>
            </div>

            <div class="preview-side">
              <div class="preview-card">
                <img src="{screenshot_modal_b64}" alt="App Preview" />
              </div>
            </div>
          </div>

          <div class="steps-row">
            <div class="step-card">
              <div class="step-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <div class="step-info">
                <div class="step-title">1. Detect Milestone</div>
                <div class="step-sub">Auto-syncs from Calendar</div>
              </div>
            </div>

            <div class="step-card">
              <div class="step-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V12m0 0a4.5 4.5 0 1 1-4.5 4.5M12 12a4.5 4.5 0 1 0 4.5 4.5M12 12v9.5"/>
                </svg>
              </div>
              <div class="step-info">
                <div class="step-title">2. Select Bouquet</div>
                <div class="step-sub">Top curated local flowers</div>
              </div>
            </div>

            <div class="step-card">
              <div class="step-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div class="step-info">
                <div class="step-title">3. 100% Private</div>
                <div class="step-sub">Direct FloristOne checkout</div>
              </div>
            </div>
          </div>
        </body>
        </html>
        """
        await page_social.set_content(html_social)
        await page_social.wait_for_timeout(300)
        await page_social.screenshot(path='marketing-kit/social-share-card-1200x630.png', type='png')
        await page_social.close()

        # ====================================================
        # 4. PRODUCT HUNT / TECH LAUNCH BANNER (1270x760)
        # ====================================================
        page_ph = await browser.new_page(viewport={'width': 1270, 'height': 760})
        html_ph = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
            * {{ box-sizing: border-box; margin: 0; padding: 0; }}
            body {{
              width: 1270px;
              height: 760px;
              font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
              background: radial-gradient(circle at 75% 25%, #4a0d24 0%, #15163a 50%, #080c16 100%);
              color: #ffffff;
              overflow: hidden;
              position: relative;
              padding: 48px 64px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }}
            .glow-top {{
              position: absolute;
              top: -100px;
              right: 150px;
              width: 620px;
              height: 620px;
              background: radial-gradient(circle, rgba(244, 63, 94, 0.35) 0%, rgba(244, 63, 94, 0) 70%);
              pointer-events: none;
            }}
            .main-content {{
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 40px;
              z-index: 2;
            }}
            .left-section {{
              width: 600px;
              display: flex;
              flex-direction: column;
              gap: 18px;
            }}
            .brand-row {{
              display: flex;
              align-items: center;
              gap: 18px;
            }}
            .ph-logo {{
              width: 80px;
              height: 80px;
              border-radius: 20px;
              box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6), 0 0 0 1.5px rgba(255, 255, 255, 0.2);
              background: #fff;
            }}
            .ph-title {{
              font-size: 40px;
              font-weight: 900;
              letter-spacing: -0.03em;
            }}
            .ph-sub {{
              font-size: 17px;
              font-weight: 700;
              color: #fb7185;
            }}
            .ph-headline {{
              font-size: 30px;
              font-weight: 900;
              line-height: 1.25;
              letter-spacing: -0.025em;
            }}
            .ph-headline .accent {{
              background: linear-gradient(135deg, #f43f5e 20%, #fb7185 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }}
            .ph-desc {{
              font-size: 15.5px;
              line-height: 1.55;
              color: #cbd5e1;
            }}
            .right-section {{
              width: 500px;
              position: relative;
            }}
            .ph-card {{
              width: 100%;
              border-radius: 18px;
              overflow: hidden;
              box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.18);
              transform: perspective(1000px) rotateY(-4deg) rotateX(2deg);
            }}
            .ph-card img {{
              width: 100%;
              display: block;
            }}
            
            .feature-grid {{
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
              z-index: 2;
            }}
            .feat-box {{
              background: rgba(255, 255, 255, 0.06);
              backdrop-filter: blur(14px);
              border: 1px solid rgba(255, 255, 255, 0.12);
              border-radius: 14px;
              padding: 16px 20px;
              display: flex;
              align-items: center;
              gap: 14px;
            }}
            .feat-icon {{
              width: 42px;
              height: 42px;
              border-radius: 12px;
              background: linear-gradient(135deg, #f43f5e, #e11d48);
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }}
            .feat-icon svg {{
              width: 22px;
              height: 22px;
              color: #ffffff;
            }}
            .feat-txt-title {{
              font-size: 14.5px;
              font-weight: 800;
              color: #ffffff;
            }}
            .feat-txt-sub {{
              font-size: 12px;
              color: #94a3b8;
              margin-top: 2px;
            }}
            
            .bottom-bar {{
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding-top: 18px;
              border-top: 1px solid rgba(255, 255, 255, 0.12);
              z-index: 2;
            }}
            .bar-tagline {{
              font-size: 14px;
              color: #cbd5e1;
              font-weight: 600;
            }}
            .url-badge {{
              font-size: 17px;
              font-weight: 800;
              color: #fb7185;
              letter-spacing: 0.02em;
            }}
          </style>
        </head>
        <body>
          <div class="glow-top"></div>
          
          <div class="main-content">
            <div class="left-section">
              <div class="brand-row">
                <img class="ph-logo" src="{logo_b64}" alt="Yearly Logo" />
                <div>
                  <div class="ph-title">Yearly</div>
                  <div class="ph-sub">Gifting for Google Calendar™</div>
                </div>
              </div>

              <div class="ph-headline">The smart companion that turns calendar milestones into <span class="accent">instant florist gifts</span></div>

              <div class="ph-desc">
                Instantly detects birthdays and anniversaries from Google Calendar. Recommends top hand-crafted florist bouquets with one-click direct delivery across the US & Canada.
              </div>
            </div>

            <div class="right-section">
              <div class="ph-card">
                <img src="{screenshot_modal_b64}" alt="Yearly Modal Interface" />
              </div>
            </div>
          </div>

          <div class="feature-grid">
            <div class="feat-box">
              <div class="feat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V12m0 0a4.5 4.5 0 1 1-4.5 4.5M12 12a4.5 4.5 0 1 0 4.5 4.5M12 12v9.5"/>
                </svg>
              </div>
              <div>
                <div class="feat-txt-title">FloristOne Delivery</div>
                <div class="feat-txt-sub">Local hand-crafted bouquets</div>
              </div>
            </div>

            <div class="feat-box">
              <div class="feat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div>
                <div class="feat-txt-title">100% Client-Side</div>
                <div class="feat-txt-sub">Zero personal data storage</div>
              </div>
            </div>

            <div class="feat-box">
              <div class="feat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <div>
                <div class="feat-txt-title">Smart Milestones</div>
                <div class="feat-txt-sub">Auto calendar classification</div>
              </div>
            </div>
          </div>

          <div class="bottom-bar">
            <div class="bar-tagline">Official Google Workspace™ Partner Add-on & Web App</div>
            <div class="url-badge">https://yearly.click</div>
          </div>
        </body>
        </html>
        """
        await page_ph.set_content(html_ph)
        await page_ph.wait_for_timeout(300)
        await page_ph.screenshot(path='marketing-kit/product-hunt-banner-1270x760.png', type='png')
        await page_ph.close()

        await browser.close()
        print('All refined assets generated!')

asyncio.run(generate_all_assets())
