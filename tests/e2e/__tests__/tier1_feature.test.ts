import {
  classifyEvent,
  getCatalog,
  buildGiftUrl,
  generateGreeting,
  buildWhatsAppShareUrl,
  DEFAULT_CATALOG,
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
import { POSITIVE_SCENARIOS, NEGATIVE_SCENARIOS } from '../fixtures/calendarScenarios';

describe('Tier 1: Feature Coverage (Opaque-Box)', () => {
  // --------------------------------------------------------------------------
  // Feature 1: Event Detection & Recipient Extraction (>= 5 tests)
  // --------------------------------------------------------------------------
  describe('F1 & F2: Event Detection & Recipient Extraction', () => {
    it('F1.1: should detect birthday with emoji 🎂 and extract recipient "Sarah"', () => {
      const res = classifyEvent("Sarah's Birthday 🎂");
      expect(res.isCelebration).toBe(true);
      expect(res.celebrationType).toBe('birthday');
      expect(res.recipientName).toBe('Sarah');
      expect(res.confidenceScore).toBeGreaterThanOrEqual(0.9);
    });

    it('F1.2: should detect birthday with "Bday" keyword and extract recipient "Bob"', () => {
      const res = classifyEvent("Bob's 30th Bday");
      expect(res.isCelebration).toBe(true);
      expect(res.celebrationType).toBe('birthday');
      expect(res.recipientName).toBe('Bob');
    });

    it('F1.3: should detect wedding anniversary with emoji 💍', () => {
      const res = classifyEvent('Wedding Anniversary 💍');
      expect(res.isCelebration).toBe(true);
      expect(res.celebrationType).toBe('anniversary');
      expect(res.confidenceScore).toBeGreaterThanOrEqual(0.85);
    });

    it('F1.4: should extract couple recipient names from anniversary title', () => {
      const res = classifyEvent("Dave & Alice's Wedding Anniversary 💍");
      expect(res.isCelebration).toBe(true);
      expect(res.celebrationType).toBe('anniversary');
      expect(res.recipientName).toBe('Dave & Alice');
    });

    it('F1.5: should scan event notes when title is generic to detect milestone', () => {
      const res = classifyEvent(
        'Family Gathering',
        "Celebrating John's retirement milestone party with family"
      );
      expect(res.isCelebration).toBe(true);
      expect(res.celebrationType).toBe('milestone');
      expect(res.recipientName).toBe('John');
    });

    it('F1.6: should extract recipient using "for" preposition pattern', () => {
      const res = classifyEvent('Birthday Celebration for Michael');
      expect(res.isCelebration).toBe(true);
      expect(res.celebrationType).toBe('birthday');
      expect(res.recipientName).toBe('Michael');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 2: Strict Negative Filtering (>= 5 tests)
  // --------------------------------------------------------------------------
  describe('F2: Strict Negative Filtering', () => {
    it('F2.1: should not flag "Team Standup"', () => {
      const res = classifyEvent('Team Standup');
      expect(res.isCelebration).toBe(false);
      expect(res.celebrationType).toBeNull();
      expect(res.recipientName).toBeNull();
    });

    it('F2.2: should not flag "Doctor Appointment"', () => {
      const res = classifyEvent('Doctor Appointment');
      expect(res.isCelebration).toBe(false);
      expect(res.celebrationType).toBeNull();
      expect(res.recipientName).toBeNull();
    });

    it('F2.3: should not flag "Sprint Planning"', () => {
      const res = classifyEvent('Sprint Planning');
      expect(res.isCelebration).toBe(false);
      expect(res.celebrationType).toBeNull();
    });

    it('F2.4: should not flag "Dentist Appointment"', () => {
      const res = classifyEvent('Dentist Appointment');
      expect(res.isCelebration).toBe(false);
      expect(res.celebrationType).toBeNull();
    });

    it('F2.5: should not flag "Weekly 1:1 with Alex"', () => {
      const res = classifyEvent('Weekly 1:1 with Alex');
      expect(res.isCelebration).toBe(false);
      expect(res.celebrationType).toBeNull();
    });

    it('F2.6: should not flag "Quarterly Financial Review"', () => {
      const res = classifyEvent('Quarterly Financial Review');
      expect(res.isCelebration).toBe(false);
      expect(res.celebrationType).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // Feature 3: Affiliate Gift Brand Catalog (>= 5 tests)
  // --------------------------------------------------------------------------
  describe('F3: Gift Brand Catalog & Affiliate URLs', () => {
    it('F3.1: catalog should contain at least Starbucks, DoorDash, Amazon, and Target', () => {
      const catalog = getCatalog();
      const brandIds = catalog.map((b) => b.id.toLowerCase());
      expect(brandIds).toContain('starbucks');
      expect(brandIds).toContain('doordash');
      expect(brandIds).toContain('amazon');
      expect(brandIds).toContain('target');
    });

    it('F3.2: brands must support amounts $15, $25, $50, $100', () => {
      const catalog = getCatalog();
      for (const brand of catalog) {
        expect(brand.supportedAmounts).toEqual(expect.arrayContaining([15, 25, 50, 100]));
      }
    });

    it('F3.3: should build valid Starbucks affiliate URL with amount and subId', () => {
      const url = buildGiftUrl('starbucks', 25, 'autogifter_cal_Sarah');
      expect(url).toContain('https://starbucks.com/gift');
      expect(url).toContain('amount=25');
      expect(url).toContain('subId=autogifter_cal_Sarah');
    });

    it('F3.4: should build valid DoorDash affiliate URL with amount and recipient subId', () => {
      const url = buildGiftUrl('doordash', 50, 'autogifter_cal_Bob');
      expect(url).toContain('https://doordash.com/gift');
      expect(url).toContain('amount=50');
      expect(url).toContain('subId=autogifter_cal_Bob');
    });

    it('F3.5: should build valid Amazon and Target affiliate URLs', () => {
      const amazonUrl = buildGiftUrl('amazon', 100, 'sub_amazon_1');
      const targetUrl = buildGiftUrl('target', 15, 'sub_target_1');
      expect(amazonUrl).toContain('amount=100');
      expect(amazonUrl).toContain('tag=autogifter');
      expect(targetUrl).toContain('amount=15');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 4: Personalized Greeting Generator (>= 5 tests)
  // --------------------------------------------------------------------------
  describe('F4: Personalized Greeting Generator', () => {
    it('F4.1: should generate warm birthday greeting with recipient name', () => {
      const msg = generateGreeting({
        recipientName: 'Sarah',
        celebrationType: 'birthday',
        tone: 'warm',
      });
      expect(msg).toContain('Happy Birthday Sarah');
      expect(msg).toContain('🎂');
    });

    it('F4.2: should generate fun birthday greeting with cheerful emojis', () => {
      const msg = generateGreeting({
        recipientName: 'Alex',
        celebrationType: 'birthday',
        tone: 'fun',
      });
      expect(msg).toContain('Alex');
      expect(msg).toContain('fabulous');
      expect(msg).toContain('🎉');
    });

    it('F4.3: should generate formal birthday greeting', () => {
      const msg = generateGreeting({
        recipientName: 'Dr. Watson',
        celebrationType: 'birthday',
        tone: 'formal',
      });
      expect(msg).toContain('Dr. Watson');
      expect(msg).toContain('Wishing you a very Happy Birthday');
    });

    it('F4.4: should generate warm anniversary greeting', () => {
      const msg = generateGreeting({
        recipientName: 'Dave & Alice',
        celebrationType: 'anniversary',
        tone: 'warm',
      });
      expect(msg).toContain('Dave & Alice');
      expect(msg).toContain('Happy Anniversary');
      expect(msg).toContain('❤️');
    });

    it('F4.5: should generate milestone celebration greeting', () => {
      const msg = generateGreeting({
        recipientName: 'John',
        celebrationType: 'milestone',
      });
      expect(msg).toContain('John');
      expect(msg).toContain('Congratulations');
      expect(msg).toContain('milestone');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 5: 1-Tap WhatsApp Share URL (>= 5 tests)
  // --------------------------------------------------------------------------
  describe('F5: 1-Tap WhatsApp Share URL', () => {
    it('F5.1: should create WhatsApp URL beginning with https://api.whatsapp.com/send?text=', () => {
      const url = buildWhatsAppShareUrl({
        greeting: 'Happy Birthday Sarah!',
      });
      expect(url.startsWith('https://api.whatsapp.com/send?text=')).toBe(true);
    });

    it('F5.2: should properly URL-encode greeting text', () => {
      const url = buildWhatsAppShareUrl({
        greeting: 'Happy Birthday Sarah! 🎂🎉',
      });
      expect(url).toContain('Happy%20Birthday%20Sarah!');
      expect(url).not.toContain(' ');
    });

    it('F5.3: should combine greeting and gift link into single share message', () => {
      const giftLink = 'https://starbucks.com/gift?amount=25';
      const url = buildWhatsAppShareUrl({
        greeting: 'Happy Birthday Sarah!',
        giftLink,
      });
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain('Happy Birthday Sarah!');
      expect(decoded).toContain(giftLink);
    });

    it('F5.4: should encode emojis properly in UTF-8 without data loss', () => {
      const emojis = '🎂🎉🥂💍🎁❤️';
      const url = buildWhatsAppShareUrl({
        greeting: `Celebration ${emojis}`,
      });
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain(emojis);
    });

    it('F5.5: should support optional recipient phone number parameter', () => {
      const url = buildWhatsAppShareUrl({
        greeting: 'Happy Birthday!',
        phone: '+15551234567',
      });
      expect(url).toContain('phone=%2B15551234567');
      expect(url).toContain('text=Happy%20Birthday!');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 6: GAS Web App JSON Endpoints (>= 5 tests)
  // --------------------------------------------------------------------------
  describe('F10: GAS Web App JSON API Endpoints', () => {
    let simulator: GasWebAppSimulator;

    beforeEach(() => {
      simulator = new GasWebAppSimulator();
    });

    it('F10.1: GET ?action=ping returns status ok with service name and timestamp', () => {
      const res = simulator.handleDoGet({ action: 'ping' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect((res.body as any).service).toBe('Auto-Gifter GAS Backend');
      expect((res.body as any).timestamp).toBeDefined();
    });

    it('F10.2: GET ?action=catalog returns status ok with full gift brand catalog', () => {
      const res = simulator.handleDoGet({ action: 'catalog' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      const catalog = (res.body as any).catalog;
      expect(Array.isArray(catalog)).toBe(true);
      expect(catalog.length).toBeGreaterThanOrEqual(4);
    });

    it('F10.3: GET ?action=events&days=14 returns status ok with upcoming celebrations', () => {
      const res = simulator.handleDoGet({ action: 'events', days: '14' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      const events = (res.body as any).events;
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].celebrationType).toBeDefined();
      expect(events[0].suggestedGreeting).toBeDefined();
      expect(events[0].whatsAppUrl).toBeDefined();
    });

    it('F10.4: POST action=log_gift records gift send and returns status ok with row number', () => {
      const res = simulator.handleDoPost({
        action: 'log_gift',
        eventId: 'evt-test-01',
        recipientName: 'Sarah',
        brandChosen: 'Starbucks',
        amount: 25,
        date: '2026-10-15',
      });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect((res.body as any).logged).toBe(true);
      expect((res.body as any).row).toBeGreaterThanOrEqual(2);
    });

    it('F10.5: GET with unknown action returns 400 with error status', () => {
      const res = simulator.handleDoGet({ action: 'unknown_action' });
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 7: Google Sheets Persistence & Deduplication (>= 5 tests)
  // --------------------------------------------------------------------------
  describe('F8 & F9: Google Sheets Persistence & Deduplication', () => {
    let sheet: CelebrationLogSheet;

    beforeEach(() => {
      sheet = new CelebrationLogSheet();
    });

    it('F8.1: CelebrationLog sheet has 9 canonical columns matching contract', () => {
      const headers = sheet.getHeaders();
      expect(headers).toEqual([
        'Date',
        'Recipient Name',
        'Event Type',
        'Gift Sent',
        'Greeting Used',
        'Brand Chosen',
        'Amount',
        'Event ID',
        'Last Updated',
      ]);
    });

    it('F8.2: should append a new row for detected celebration', () => {
      const res = sheet.logCelebration({
        date: '2026-10-15',
        recipientName: 'Sarah',
        eventType: 'birthday',
        greetingUsed: 'Happy Birthday Sarah! 🎂',
        eventId: 'evt-001',
      });
      expect(res.isUpdate).toBe(false);
      expect(sheet.getRowCount()).toBe(1);
      const row = sheet.findByEventId('evt-001');
      expect(row?.recipientName).toBe('Sarah');
      expect(row?.giftSent).toBe(false);
    });

    it('F8.3: should deduplicate by Event ID on subsequent runs', () => {
      sheet.logCelebration({
        date: '2026-10-15',
        recipientName: 'Sarah',
        eventType: 'birthday',
        eventId: 'evt-001',
      });
      const secondRun = sheet.logCelebration({
        date: '2026-10-15',
        recipientName: 'Sarah',
        eventType: 'birthday',
        eventId: 'evt-001',
      });
      expect(secondRun.isUpdate).toBe(true);
      expect(sheet.getRowCount()).toBe(1);
    });

    it('F8.4: should fallback to Date_RecipientName deduplication if eventId differs', () => {
      sheet.logCelebration({
        date: '2026-10-15',
        recipientName: 'Sarah',
        eventType: 'birthday',
        eventId: 'evt-001-a',
      });
      const dup = sheet.logCelebration({
        date: '2026-10-15',
        recipientName: 'Sarah',
        eventType: 'birthday',
        eventId: 'evt-001-b',
      });
      expect(dup.isUpdate).toBe(true);
      expect(sheet.getRowCount()).toBe(1);
    });

    it('F9.1: markGiftSent should update Gift Sent to TRUE and record brand and amount', () => {
      sheet.logCelebration({
        date: '2026-10-15',
        recipientName: 'Sarah',
        eventType: 'birthday',
        eventId: 'evt-001',
      });
      const res = sheet.markGiftSent({
        action: 'log_gift',
        eventId: 'evt-001',
        recipientName: 'Sarah',
        brandChosen: 'Starbucks',
        amount: 25,
      });
      expect(res.success).toBe(true);
      const row = sheet.findByEventId('evt-001');
      expect(row?.giftSent).toBe(true);
      expect(row?.brandChosen).toBe('Starbucks');
      expect(row?.amount).toBe(25);
    });
  });

  // --------------------------------------------------------------------------
  // Feature 8: Chrome Extension MV3 Manifest & Calendar DOM Injection (>= 5 tests)
  // --------------------------------------------------------------------------
  describe('F11 & F12: Chrome Extension MV3 Manifest & DOM Injection', () => {
    it('F11.1: manifest.json conforms to Chrome Manifest V3 schema', () => {
      const result = validateExtensionManifest(mockManifest);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('F11.2: manifest must contain storage permission and calendar.google.com host permission', () => {
      expect(mockManifest.permissions).toContain('storage');
      expect(mockManifest.host_permissions).toContain('https://calendar.google.com/*');
    });

    it('F12.1: DOM simulator injects 🎁 badge onto birthday event chip', () => {
      const dom = new CalendarDomSimulator();
      dom.addEventChip('chip-01', "Sarah's Birthday 🎂");
      const result = dom.runBadgeInjectionPass();

      expect(result.injected).toBe(1);
      const badge = dom.getChipBadge('chip-01');
      expect(badge).toBeDefined();
      expect(badge?.innerText).toBe('🎁');
      expect(badge?.className).toBe('autogifter-badge');
    });

    it('F12.2: DOM simulator strictly rejects non-celebration event chip ("Team Standup")', () => {
      const dom = new CalendarDomSimulator();
      dom.addEventChip('chip-02', 'Team Standup');
      const result = dom.runBadgeInjectionPass();

      expect(result.injected).toBe(0);
      expect(result.rejectedNonCelebration).toBe(1);
      const badge = dom.getChipBadge('chip-02');
      expect(badge).toBeUndefined();
    });

    it('F12.3: DOM simulator enforces idempotency and does not inject twice on same chip', () => {
      const dom = new CalendarDomSimulator();
      dom.addEventChip('chip-01', "Sarah's Birthday 🎂");
      dom.runBadgeInjectionPass();
      const secondPass = dom.runBadgeInjectionPass();

      expect(secondPass.injected).toBe(0);
      expect(secondPass.skippedAlreadyInjected).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // Feature 9: Extension Settings & Demo Mode Fallback (>= 5 tests)
  // --------------------------------------------------------------------------
  describe('F14: Extension Settings & Demo Mode', () => {
    let storage: ChromeStorageMock;

    beforeEach(async () => {
      storage = new ChromeStorageMock();
    });

    it('F14.1: should read and write gasWebAppUrl to storage.sync', async () => {
      await storage.set({ gasWebAppUrl: 'https://script.google.com/macros/s/xyz/exec' });
      const { gasWebAppUrl } = await storage.get('gasWebAppUrl');
      expect(gasWebAppUrl).toBe('https://script.google.com/macros/s/xyz/exec');
    });

    it('F14.2: should automatically load demoCelebrations.json when gasWebAppUrl is unset', async () => {
      const result = await storage.loadCelebrations();
      expect(result.source).toBe('demo');
      expect(result.celebrations.length).toBeGreaterThanOrEqual(2);
      expect(result.celebrations[0].title).toContain("Sarah's Birthday");
    });

    it('F14.3: should fallback gracefully to demoCelebrations.json if GAS fetch fails', async () => {
      await storage.set({ gasWebAppUrl: 'https://invalid-script-url.test' });
      const failingFetcher = async () => {
        throw new Error('Network timeout');
      };
      const result = await storage.loadCelebrations(failingFetcher);
      expect(result.source).toBe('demo');
      expect(result.celebrations.length).toBeGreaterThan(0);
    });

    it('F14.4: should load from GAS if gasWebAppUrl is set and fetcher succeeds', async () => {
      await storage.set({ gasWebAppUrl: 'https://script.google.com/macros/s/real/exec' });
      const mockFetcher = async () => [
        {
          id: 'live-01',
          title: "Emma's Birthday 🎂",
          date: '2026-10-19',
          celebrationType: 'birthday' as const,
          recipientName: 'Emma',
          suggestedGreeting: 'Happy Birthday Emma!',
          whatsAppUrl: 'https://api.whatsapp.com/send?text=Happy%20Birthday',
        },
      ];
      const result = await storage.loadCelebrations(mockFetcher);
      expect(result.source).toBe('gas');
      expect(result.celebrations[0].recipientName).toBe('Emma');
    });

    it('F14.5: storage clear resets configuration back to clean state', async () => {
      await storage.set({ gasWebAppUrl: 'https://script.google.com' });
      await storage.clear();
      const { gasWebAppUrl } = await storage.get('gasWebAppUrl');
      expect(gasWebAppUrl).toBeUndefined();
    });
  });
});
