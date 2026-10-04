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
  BOUNDARY_SCENARIOS,
  NEGATIVE_SCENARIOS,
} from '../fixtures/calendarScenarios';

describe('Tier 2: Boundary & Corner Cases (Adversarial Verification)', () => {
  // --------------------------------------------------------------------------
  // Event Detection Boundary & Adversarial Cases
  // --------------------------------------------------------------------------
  describe('Event Detection Boundary Cases', () => {
    it('B1.1: empty string returns isCelebration=false and score=0', () => {
      const res = classifyEvent('');
      expect(res.isCelebration).toBe(false);
      expect(res.recipientName).toBeNull();
      expect(res.confidenceScore).toBe(0);
    });

    it('B1.2: whitespace only string returns isCelebration=false', () => {
      const res = classifyEvent('    \t   \n  ');
      expect(res.isCelebration).toBe(false);
      expect(res.recipientName).toBeNull();
    });

    it('B1.3: title consisting solely of emoji 🎂 returns isCelebration=true with null recipient', () => {
      const res = classifyEvent('🎂');
      expect(res.isCelebration).toBe(true);
      expect(res.celebrationType).toBe('birthday');
      expect(res.recipientName).toBeNull();
    });

    it('B1.4: punctuation-heavy title with uppercase "*** SARAH\'S B-DAY!!! ***" cleans name to "SARAH"', () => {
      const res = classifyEvent("*** SARAH'S B-DAY!!! ***");
      expect(res.isCelebration).toBe(true);
      expect(res.celebrationType).toBe('birthday');
      expect(res.recipientName).toBe('SARAH');
    });

    it('B1.5: accented names "Zoë\'s Birthday 🎂" correctly preserves diacritics', () => {
      const res = classifyEvent("Zoë's Birthday 🎂");
      expect(res.isCelebration).toBe(true);
      expect(res.celebrationType).toBe('birthday');
      expect(res.recipientName).toBe('Zoë');
    });

    it('B1.6: accented name "José\'s Bday 🎉" extracts "José"', () => {
      const res = classifyEvent("José's Bday 🎉");
      expect(res.isCelebration).toBe(true);
      expect(res.celebrationType).toBe('birthday');
      expect(res.recipientName).toBe('José');
    });

    it('B1.7: hyphenated name "Mary-Jane\'s Birthday 🎂" extracts "Mary-Jane"', () => {
      const res = classifyEvent("Mary-Jane's Birthday 🎂");
      expect(res.isCelebration).toBe(true);
      expect(res.recipientName).toBe('Mary-Jane');
    });

    it('B1.8: stop-word title "Surprise Birthday Party" does not extract "Party" as person name', () => {
      const res = classifyEvent('Surprise Birthday Party');
      expect(res.isCelebration).toBe(true);
      expect(res.recipientName).toBeNull();
    });

    it('B1.9: multi-day vacation celebration "Sarah\'s 3-Day Birthday Vacation 🎂" extracts "Sarah"', () => {
      const res = classifyEvent("Sarah's 3-Day Birthday Vacation 🎂");
      expect(res.isCelebration).toBe(true);
      expect(res.celebrationType).toBe('birthday');
      expect(res.recipientName).toBe('Sarah');
    });

    it('B1.10: handles undefined notes gracefully without throwing error', () => {
      expect(() => classifyEvent('Anniversary Dinner 💍', undefined)).not.toThrow();
      const res = classifyEvent('Anniversary Dinner 💍', undefined);
      expect(res.isCelebration).toBe(true);
      expect(res.celebrationType).toBe('anniversary');
    });
  });

  // --------------------------------------------------------------------------
  // Negative Filtering Edge & Adversarial Cases
  // --------------------------------------------------------------------------
  describe('Negative Filtering Edge Cases', () => {
    it('B2.1: rejects title containing substring "day" like "Doctor Appointment - Dr. Day"', () => {
      const res = classifyEvent('Doctor Appointment - Dr. Day');
      expect(res.isCelebration).toBe(false);
      expect(res.recipientName).toBeNull();
    });

    it('B2.2: rejects mathematical event "Birthday Problem Math Seminar"', () => {
      const res = classifyEvent('Birthday Problem Math Seminar');
      expect(res.isCelebration).toBe(false);
    });

    it('B2.3: rejects corporate review "Annual Performance Review Sync"', () => {
      const res = classifyEvent('Annual Performance Review Sync');
      expect(res.isCelebration).toBe(false);
    });

    it('B2.4: rejects lowercase "team standup 9:30am"', () => {
      const res = classifyEvent('team standup 9:30am');
      expect(res.isCelebration).toBe(false);
    });

    it('B2.5: rejects "Dentist Appointment (Checkup & Cleaning)"', () => {
      const res = classifyEvent('Dentist Appointment (Checkup & Cleaning)');
      expect(res.isCelebration).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Catalog & Amount Boundary Cases
  // --------------------------------------------------------------------------
  describe('Catalog & Amount Boundary Cases', () => {
    it('B3.1: throws error for unsupported amount (e.g. $30)', () => {
      expect(() => buildGiftUrl('starbucks', 30)).toThrow(/Unsupported amount: \$30/);
    });

    it('B3.2: throws error for unsupported amount $200 beyond max $100', () => {
      expect(() => buildGiftUrl('amazon', 200)).toThrow(/Unsupported amount: \$200/);
    });

    it('B3.3: throws error for unknown gift brand ID', () => {
      expect(() => buildGiftUrl('walmart', 25)).toThrow(/Unsupported gift brand ID: walmart/);
    });

    it('B3.4: allows boundary minimum amount $15 across all catalog brands', () => {
      const catalog = getCatalog();
      for (const brand of catalog) {
        expect(() => buildGiftUrl(brand.id, 15)).not.toThrow();
        const url = buildGiftUrl(brand.id, 15);
        expect(url).toContain('15');
      }
    });

    it('B3.5: allows boundary maximum amount $100 across all catalog brands', () => {
      const catalog = getCatalog();
      for (const brand of catalog) {
        expect(() => buildGiftUrl(brand.id, 100)).not.toThrow();
        const url = buildGiftUrl(brand.id, 100);
        expect(url).toContain('100');
      }
    });

    it('B3.6: encodes subId with special characters and spaces correctly', () => {
      const url = buildGiftUrl('starbucks', 25, 'sub_id with spaces & special #1');
      expect(url).toContain('subId=sub_id with spaces & special #1');
    });
  });

  // --------------------------------------------------------------------------
  // Greetings Parameter Boundary Cases
  // --------------------------------------------------------------------------
  describe('Greetings Parameter Boundary Cases', () => {
    it('B4.1: falls back to "there" when recipientName is empty string', () => {
      const msg = generateGreeting({
        recipientName: '',
        celebrationType: 'birthday',
      });
      expect(msg).toContain('Happy Birthday there');
    });

    it('B4.2: falls back to "there" when recipientName is only whitespace', () => {
      const msg = generateGreeting({
        recipientName: '   ',
        celebrationType: 'birthday',
      });
      expect(msg).toContain('Happy Birthday there');
    });

    it('B4.3: handles compound names with apostrophes "O\'Connor"', () => {
      const msg = generateGreeting({
        recipientName: "Liam O'Connor",
        celebrationType: 'birthday',
        tone: 'warm',
      });
      expect(msg).toContain("Liam O'Connor");
    });

    it('B4.4: handles long recipient names without truncation', () => {
      const longName = 'Alexander Maximilian Bartholomew Montgomery III';
      const msg = generateGreeting({
        recipientName: longName,
        celebrationType: 'birthday',
      });
      expect(msg).toContain(longName);
    });

    it('B4.5: falls back gracefully for unknown celebration type', () => {
      const msg = generateGreeting({
        recipientName: 'Alex',
        celebrationType: 'milestone',
      });
      expect(msg).toContain('Congratulations Alex');
    });
  });

  // --------------------------------------------------------------------------
  // WhatsApp Share URL Boundary Cases
  // --------------------------------------------------------------------------
  describe('WhatsApp URL Boundary & UTF-8 Stress Cases', () => {
    it('B5.1: handles extra-long greeting message (> 500 chars) without truncation', () => {
      const longGreeting = 'A'.repeat(500);
      const url = buildWhatsAppShareUrl({ greeting: longGreeting });
      expect(url.length).toBeGreaterThan(500);
      const decoded = decodeURIComponent(url.replace('https://api.whatsapp.com/send?text=', ''));
      expect(decoded).toBe(longGreeting);
    });

    it('B5.2: encodes multiple multi-byte emojis (surrogate pairs) cleanly', () => {
      const emojiCluster = '🎂🎉🥳🥂💍🎁❤️✨🎊';
      const url = buildWhatsAppShareUrl({ greeting: `Cheer ${emojiCluster}` });
      expect(url).not.toContain(emojiCluster); // Must be encoded
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain(emojiCluster);
    });

    it('B5.3: handles greeting without giftLink cleanly', () => {
      const url = buildWhatsAppShareUrl({ greeting: 'Simple Hello' });
      expect(url).toBe('https://api.whatsapp.com/send?text=Simple%20Hello');
    });

    it('B5.4: encodes newlines and quotes correctly', () => {
      const greeting = 'Line 1\nLine 2: "Enjoy your gift!"';
      const url = buildWhatsAppShareUrl({ greeting });
      expect(url).toContain('%0A'); // Encoded newline
      expect(url).toContain('%22Enjoy%20your%20gift!%22');
    });

    it('B5.5: formats phone number with plus sign properly encoded as %2B', () => {
      const url = buildWhatsAppShareUrl({
        greeting: 'Happy Bday!',
        phone: '+447911123456',
      });
      expect(url).toContain('phone=%2B447911123456');
    });
  });

  // --------------------------------------------------------------------------
  // GAS Web App API Boundary Cases
  // --------------------------------------------------------------------------
  describe('GAS Web App Boundary & Malformed Payloads', () => {
    let simulator: GasWebAppSimulator;

    beforeEach(() => {
      simulator = new GasWebAppSimulator();
    });

    it('B6.1: GET with missing action returns 400 error', () => {
      const res = simulator.handleDoGet({});
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('B6.2: POST with invalid action returns 400 error', () => {
      const res = simulator.handleDoPost({ action: 'unknown_post' as any });
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('B6.3: POST log_gift missing amount returns 400 error', () => {
      const res = simulator.handleDoPost({
        action: 'log_gift',
        eventId: 'evt-1',
        recipientName: 'Sarah',
        brandChosen: 'Starbucks',
        // amount omitted
      });
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('B6.4: POST log_gift missing brandChosen returns 400 error', () => {
      const res = simulator.handleDoPost({
        action: 'log_gift',
        eventId: 'evt-1',
        recipientName: 'Sarah',
        amount: 25,
        // brandChosen omitted
      });
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('B6.5: GET events with days=0 returns empty array without error', () => {
      const res = simulator.handleDoGet({ action: 'events', days: '0' });
      expect(res.status).toBe(200);
      expect((res.body as any).events).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // Google Sheets Deduplication & Data Mutation Boundary
  // --------------------------------------------------------------------------
  describe('Sheets Persistence Boundary Cases', () => {
    let sheet: CelebrationLogSheet;

    beforeEach(() => {
      sheet = new CelebrationLogSheet();
    });

    it('B7.1: preserve giftSent=true when subsequent logCelebration runs with default false', () => {
      // Step 1: initial discovery
      sheet.logCelebration({
        date: '2026-10-15',
        recipientName: 'Sarah',
        eventType: 'birthday',
        eventId: 'evt-sarah',
      });

      // Step 2: user sends gift
      sheet.markGiftSent({
        action: 'log_gift',
        eventId: 'evt-sarah',
        recipientName: 'Sarah',
        brandChosen: 'Starbucks',
        amount: 25,
      });

      // Step 3: cron trigger runs again (defaulting giftSent: false)
      sheet.logCelebration({
        date: '2026-10-15',
        recipientName: 'Sarah',
        eventType: 'birthday',
        eventId: 'evt-sarah',
      });

      const row = sheet.findByEventId('evt-sarah');
      expect(row?.giftSent).toBe(true);
      expect(row?.brandChosen).toBe('Starbucks');
      expect(row?.amount).toBe(25);
    });

    it('B7.2: markGiftSent for non-existent event auto-provisions new row with TRUE', () => {
      const res = sheet.markGiftSent({
        action: 'log_gift',
        eventId: 'evt-unseen',
        recipientName: 'Alex',
        brandChosen: 'Amazon',
        amount: 50,
      });
      expect(res.success).toBe(true);
      expect(sheet.getRowCount()).toBe(1);
      const row = sheet.findByEventId('evt-unseen');
      expect(row?.recipientName).toBe('Alex');
      expect(row?.giftSent).toBe(true);
    });

    it('B7.3: supports 20 rapid sequential row insertions without schema corruption', () => {
      for (let i = 1; i <= 20; i++) {
        sheet.logCelebration({
          date: `2026-10-${i.toString().padStart(2, '0')}`,
          recipientName: `Friend ${i}`,
          eventType: 'birthday',
          eventId: `evt-bulk-${i}`,
        });
      }
      expect(sheet.getRowCount()).toBe(20);
      const row10 = sheet.findByEventId('evt-bulk-10');
      expect(row10?.recipientName).toBe('Friend 10');
    });

    it('B7.4: resets sheet cleanly upon reset() call', () => {
      sheet.logCelebration({
        date: '2026-10-15',
        recipientName: 'Sarah',
        eventType: 'birthday',
        eventId: 'evt-sarah',
      });
      expect(sheet.getRowCount()).toBe(1);
      sheet.reset();
      expect(sheet.getRowCount()).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // Calendar DOM Mutation & Dynamic Nodes
  // --------------------------------------------------------------------------
  describe('Calendar DOM Mutation & Dynamic Nodes', () => {
    it('B8.1: chip with empty title does not receive badge', () => {
      const dom = new CalendarDomSimulator();
      dom.addEventChip('empty-chip', '');
      const res = dom.runBadgeInjectionPass();
      expect(res.injected).toBe(0);
      expect(dom.getChipBadge('empty-chip')).toBeUndefined();
    });

    it('B8.2: dynamic addition of multiple chips processed correctly in batch', () => {
      const dom = new CalendarDomSimulator();
      dom.addEventChip('chip-1', "Alice's Birthday 🎂");
      dom.addEventChip('chip-2', 'Team Retro');
      dom.addEventChip('chip-3', "Bob's Bday 🎉");
      dom.addEventChip('chip-4', 'Doctor Checkup');

      const res = dom.runBadgeInjectionPass();
      expect(res.injected).toBe(2);
      expect(res.rejectedNonCelebration).toBe(2);
      expect(dom.getChipBadge('chip-1')).toBeDefined();
      expect(dom.getChipBadge('chip-2')).toBeUndefined();
      expect(dom.getChipBadge('chip-3')).toBeDefined();
      expect(dom.getChipBadge('chip-4')).toBeUndefined();
    });

    it('B8.3: badge click triggers modal open callback with chip details', () => {
      const dom = new CalendarDomSimulator();
      dom.addEventChip('chip-click', "Sarah's Birthday 🎂");
      dom.runBadgeInjectionPass();

      let openedChipTitle = '';
      const clicked = dom.simulateBadgeClick('chip-click', (chip) => {
        openedChipTitle = chip.title;
      });

      expect(clicked).toBe(true);
      expect(openedChipTitle).toBe("Sarah's Birthday 🎂");
    });
  });
});
