/**
 * Auto-Gifter Master E2E Test Runner & Requirement Verification
 * Validates ALL Acceptance Criteria from ORIGINAL_REQUEST.md
 */

import {
  classifyEvent,
  getCatalog,
  buildGiftUrl,
  generateGreeting,
  buildWhatsAppShareUrl,
} from '../harness/contractOracle';
import {
  GasWebAppSimulator,
  CelebrationLogSheet,
} from '../harness/gasWebAppSimulator';
import {
  CalendarDomSimulator,
} from '../harness/calendarDomSimulator';
import {
  ChromeStorageMock,
  validateExtensionManifest,
} from '../harness/chromeStorageMock';
import * as mockManifest from '../fixtures/mockManifest.json';

describe('Auto-Gifter: Master E2E Acceptance Suite (ORIGINAL_REQUEST.md)', () => {
  // --------------------------------------------------------------------------
  // Acceptance Criterion 1: Event Detection
  // --------------------------------------------------------------------------
  describe('Acceptance Criterion: Event Detection', () => {
    it('AC1.1: "Sarah\'s Birthday 🎂" is identified as birthday with recipient "Sarah"', () => {
      const res = classifyEvent("Sarah's Birthday 🎂");
      expect(res.isCelebration).toBe(true);
      expect(res.celebrationType).toBe('birthday');
      expect(res.recipientName).toBe('Sarah');
    });

    it('AC1.2: "Wedding Anniversary 💍" is identified as anniversary', () => {
      const res = classifyEvent('Wedding Anniversary 💍');
      expect(res.isCelebration).toBe(true);
      expect(res.celebrationType).toBe('anniversary');
    });

    it('AC1.3: Non-celebration events ("Team Standup", "Doctor Appointment") are strictly not flagged', () => {
      const standup = classifyEvent('Team Standup');
      const doctor = classifyEvent('Doctor Appointment');

      expect(standup.isCelebration).toBe(false);
      expect(standup.recipientName).toBeNull();

      expect(doctor.isCelebration).toBe(false);
      expect(doctor.recipientName).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // Acceptance Criterion 2: Workspace Add-on
  // --------------------------------------------------------------------------
  describe('Acceptance Criterion: Workspace Add-on', () => {
    it('AC2.1: Opening detected birthday event provides at least 2 gift brand options & WhatsApp share link', () => {
      const catalog = getCatalog();
      expect(catalog.length).toBeGreaterThanOrEqual(2);

      const giftLinks = catalog.map((b) => buildGiftUrl(b.id, 25, undefined, 'Sarah'));
      expect(giftLinks.length).toBeGreaterThanOrEqual(2);

      const greeting = generateGreeting({
        recipientName: 'Sarah',
        celebrationType: 'birthday',
      });
      const whatsAppUrl = buildWhatsAppShareUrl({
        greeting,
        giftLink: giftLinks[0],
      });

      expect(whatsAppUrl).toContain('https://api.whatsapp.com/send?text=');
      expect(decodeURIComponent(whatsAppUrl)).toContain('Sarah');
    });

    it('AC2.2: Tapping gift brand chip produces affiliate URL with valid sub-ID', () => {
      const url = buildGiftUrl('starbucks', 25, 'autogifter_cal_Sarah');
      expect(url).toContain('https://starbucks.com/gift');
      expect(url).toContain('subId=autogifter_cal_Sarah');
    });

    it('AC2.3: Daily trigger appends at least one row to CelebrationLog Sheet for upcoming celebration', () => {
      const gas = new GasWebAppSimulator();
      const runResult = gas.runDailyTrigger(14);

      expect(runResult.loggedRows).toBeGreaterThan(0);
      const rows = gas.sheet.getRows();
      expect(rows.length).toBeGreaterThanOrEqual(1);

      const birthdayRow = rows.find((r) => r.eventType === 'birthday');
      expect(birthdayRow).toBeDefined();
      expect(birthdayRow?.recipientName).toBeDefined();
      expect(birthdayRow?.giftSent).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Acceptance Criterion 3: Chrome Extension
  // --------------------------------------------------------------------------
  describe('Acceptance Criterion: Chrome Extension', () => {
    it('AC3.1: Extension manifest loads without schema errors with storage & host permissions', () => {
      const validation = validateExtensionManifest(mockManifest);
      expect(validation.isValid).toBe(true);
      expect(mockManifest.permissions).toContain('storage');
      expect(mockManifest.host_permissions.some((h) => h.includes('calendar.google.com'))).toBe(true);
    });

    it('AC3.2: 🎁 badge is injected onto detected celebration event chip in calendar grid', () => {
      const dom = new CalendarDomSimulator();
      dom.addEventChip('chip-ac', "Sarah's Birthday 🎂");
      const pass = dom.runBadgeInjectionPass();

      expect(pass.injected).toBe(1);
      const badge = dom.getChipBadge('chip-ac');
      expect(badge).toBeDefined();
      expect(badge?.innerText).toBe('🎁');
      expect(badge?.title).toContain('Auto-Gifter: Celebration detected!');
    });

    it('AC3.3: Toolbar popup displays upcoming celebrations and WhatsApp share buttons', async () => {
      const storage = new ChromeStorageMock();
      const { celebrations } = await storage.loadCelebrations();

      expect(celebrations.length).toBeGreaterThan(0);
      for (const celeb of celebrations) {
        expect(celeb.title).toBeDefined();
        expect(celeb.whatsAppUrl).toContain('https://api.whatsapp.com/send?text=');
        expect(celeb.suggestedGreeting).toBeDefined();
      }
    });
  });

  // --------------------------------------------------------------------------
  // Acceptance Criterion 4: End-to-End Flow (< 60 Seconds)
  // --------------------------------------------------------------------------
  describe('Acceptance Criterion: End-to-End Flow (< 60 Seconds)', () => {
    it('AC4.1: Tester follows full flow in under 60 seconds with no external backend other than GAS URL', async () => {
      const t0 = Date.now();

      // 1. Open Calendar -> Chip exists
      const dom = new CalendarDomSimulator();
      dom.addEventChip('sarah-chip', "Sarah's Birthday 🎂");

      // 2. See detected birthday badge
      dom.runBadgeInjectionPass();
      const badge = dom.getChipBadge('sarah-chip');
      expect(badge).toBeDefined();

      // 3. Tap gift card (Starbucks $25)
      const giftUrl = buildGiftUrl('starbucks', 25, 'ac_demo', 'Sarah');
      const greeting = generateGreeting({
        recipientName: 'Sarah',
        celebrationType: 'birthday',
      });

      // 4. WhatsApp opens with pre-filled greeting and gift link
      const whatsAppUrl = buildWhatsAppShareUrl({ greeting, giftLink: giftUrl });
      expect(whatsAppUrl).toContain('https://api.whatsapp.com/send?text=');
      expect(decodeURIComponent(whatsAppUrl)).toContain(giftUrl);

      // 5. Gift send logged to Google Sheets
      const gas = new GasWebAppSimulator();
      const postRes = gas.handleDoPost({
        action: 'log_gift',
        eventId: 'sarah-chip',
        recipientName: 'Sarah',
        brandChosen: 'Starbucks',
        amount: 25,
      });
      expect(postRes.status).toBe(200);

      const elapsedMs = Date.now() - t0;
      expect(elapsedMs).toBeLessThan(1000); // Executed in < 1 second (< 60s requirement)
    });
  });
});
