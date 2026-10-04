import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
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
} from '../harness/chromeStorageMock';

// Load universal engine bundles across all three surfaces
const sharedCore = require(path.resolve(__dirname, '../../../shared/CoreEngine.js'));
const gasCore = require(path.resolve(__dirname, '../../../gas/CoreEngine.js'));
const extCore = require(path.resolve(__dirname, '../../../extension/core/CoreEngine.js'));

describe('Tier 5: Adversarial Coverage Hardening & Cross-Surface Verification', () => {
  // ==========================================================================
  // Section 1: Complex Calendar Titles & Adversarial Inputs
  // ==========================================================================
  describe('1. Complex Calendar Titles & Adversarial Inputs', () => {
    describe('1.1 Zero-Width & Invisible Characters', () => {
      it('handles zero-width space (\\u200B) between recipient name and apostrophe', () => {
        const title = "Sarah\u200B's Birthday 🎂";
        const result = classifyEvent(title);
        expect(result.isCelebration).toBe(true);
        expect(result.celebrationType).toBe('birthday');
        expect(result.recipientName).toBe('Sarah');

        const coreRes = sharedCore.classifyEvent(title);
        expect(coreRes.isCelebration).toBe(true);
        expect(coreRes.recipientName).toBe('Sarah');
      });

      it('handles Byte Order Mark / zero-width no-break space (\\uFEFF) at start of title', () => {
        const title = "\uFEFFSarah's Birthday 🎂";
        const result = classifyEvent(title);
        expect(result.isCelebration).toBe(true);
        expect(result.celebrationType).toBe('birthday');
        expect(result.recipientName).toBe('Sarah');

        const coreRes = sharedCore.classifyEvent(title);
        expect(coreRes.recipientName).toBe('Sarah');
      });

      it('handles zero-width joiner (\\u200D) and non-joiner (\\u200C)', () => {
        const titleZwj = "Sarah\u200D's Birthday 🎂";
        const titleZwnj = "Sarah\u200C's Birthday 🎂";

        expect(classifyEvent(titleZwj).recipientName).toBe('Sarah');
        expect(classifyEvent(titleZwnj).recipientName).toBe('Sarah');
        expect(sharedCore.classifyEvent(titleZwj).recipientName).toBe('Sarah');
        expect(sharedCore.classifyEvent(titleZwnj).recipientName).toBe('Sarah');
      });

      it('handles zero-width characters embedded in couple names', () => {
        const title = "Dave\u200B & \u200BAlice's Wedding Anniversary 💍";
        const result = classifyEvent(title);
        expect(result.isCelebration).toBe(true);
        expect(result.celebrationType).toBe('anniversary');
        expect(result.recipientName).toBe('Dave & Alice');

        const coreRes = sharedCore.classifyEvent(title);
        expect(coreRes.recipientName).toBe('Dave & Alice');
      });
    });

    describe('1.2 Emojis Mixed with Punctuation & Bracketed Tags', () => {
      it('extracts name from bracketed tag with multiple emojis: "🎉✨ [VIP] Sarah\'s 30th Birthday Party!!! 🎂🥂"', () => {
        const title = "🎉✨ [VIP] Sarah's 30th Birthday Party!!! 🎂🥂";
        const result = classifyEvent(title);
        expect(result.isCelebration).toBe(true);
        expect(result.celebrationType).toBe('birthday');
        expect(result.recipientName).toBe('Sarah');

        const coreRes = sharedCore.classifyEvent(title);
        expect(coreRes.isCelebration).toBe(true);
        expect(coreRes.recipientName).toBe('Sarah');
      });

      it('extracts couple name from asterisk-wrapped title: "*** Dave & Alice\'s 10th Wedding Anniversary 💍 ***"', () => {
        const title = "*** Dave & Alice's 10th Wedding Anniversary 💍 ***";
        const result = classifyEvent(title);
        expect(result.isCelebration).toBe(true);
        expect(result.celebrationType).toBe('anniversary');
        expect(result.recipientName).toBe('Dave & Alice');

        const coreRes = sharedCore.classifyEvent(title);
        expect(coreRes.recipientName).toBe('Dave & Alice');
      });

      it('extracts name from tilde/star decorated title: "~*~ Maya\'s Bday ~*~ 🎈"', () => {
        const title = "~*~ Maya's Bday ~*~ 🎈";
        const result = classifyEvent(title);
        expect(result.isCelebration).toBe(true);
        expect(result.celebrationType).toBe('birthday');
        expect(result.recipientName).toBe('Maya');

        const coreRes = sharedCore.classifyEvent(title);
        expect(coreRes.recipientName).toBe('Maya');
      });

      it('extracts name from "Happy Birthday, Carlos! 🎂🎉" pattern', () => {
        const title = "🎁 Happy Birthday, Carlos! 🎂🎉";
        const result = classifyEvent(title);
        expect(result.isCelebration).toBe(true);
        expect(result.celebrationType).toBe('birthday');
        expect(result.recipientName).toBe('Carlos');

        const coreRes = sharedCore.classifyEvent(title);
        expect(coreRes.recipientName).toBe('Carlos');
      });

      it('extracts name from baby shower milestone: "✨ Special: Emma\'s Baby Shower! 👶🍼"', () => {
        const title = "✨ Special: Emma's Baby Shower! 👶🍼";
        const result = classifyEvent(title);
        expect(result.isCelebration).toBe(true);
        expect(result.celebrationType).toBe('milestone');
        expect(result.recipientName).toBe('Emma');

        const coreRes = sharedCore.classifyEvent(title);
        expect(coreRes.recipientName).toBe('Emma');
      });
    });

    describe('1.3 Multi-Line Notes & Secondary Descriptions', () => {
      it('extracts name from multi-line notes when title is generic: "Surprise Celebration 🎉"', () => {
        const title = "Surprise Celebration 🎉";
        const notes = "Birthday for Alexander\nBring cake and drinks\nBudget $50";

        const result = classifyEvent(title, notes);
        expect(result.isCelebration).toBe(true);
        expect(result.celebrationType).toBe('birthday');
        expect(result.recipientName).toBe('Alexander');

        const coreRes = sharedCore.classifyEvent(title, notes);
        expect(coreRes.isCelebration).toBe(true);
        expect(coreRes.recipientName).toBe('Alexander');
      });

      it('extracts couple name from bulleted multi-line notes: "Celebration Dinner"', () => {
        const title = "Celebration Dinner";
        const notes = "Notes:\n- Celebrating Dave & Alice's 10th Anniversary 💍\n- Dinner starts at 7pm\n- Table reserved for 8";

        const result = classifyEvent(title, notes);
        expect(result.isCelebration).toBe(true);
        expect(result.celebrationType).toBe('anniversary');
        expect(result.recipientName).toBe('Dave & Alice');

        const coreRes = sharedCore.classifyEvent(title, notes);
        expect(coreRes.recipientName).toBe('Dave & Alice');
      });

      it('extracts graduation milestone from multi-line notes', () => {
        const title = "Milestone Party";
        const notes = "Graduation for Sophia\nLocation: University Quad\nWear graduation cap!";

        const result = classifyEvent(title, notes);
        expect(result.isCelebration).toBe(true);
        expect(result.celebrationType).toBe('milestone');
        expect(result.recipientName).toBe('Sophia');

        const coreRes = sharedCore.classifyEvent(title, notes);
        expect(coreRes.recipientName).toBe('Sophia');
      });
    });

    describe('1.4 Multiple Recipient Candidates & Complex Phrasing', () => {
      it('extracts couple names with "and": "Sarah and Michael\'s Wedding Anniversary 💍"', () => {
        const title = "Sarah and Michael's Wedding Anniversary 💍";
        const result = classifyEvent(title);
        expect(result.isCelebration).toBe(true);
        expect(result.celebrationType).toBe('anniversary');
        expect(result.recipientName).toBe('Sarah and Michael');

        const coreRes = sharedCore.classifyEvent(title);
        expect(coreRes.recipientName).toBe('Sarah and Michael');
      });

      it('extracts joint celebration names: "Birthday for Lucas and Olivia 🎂"', () => {
        const title = "Birthday for Lucas and Olivia 🎂";
        const result = classifyEvent(title);
        expect(result.isCelebration).toBe(true);
        expect(result.celebrationType).toBe('birthday');
        expect(result.recipientName).toBe('Lucas and Olivia');

        const coreRes = sharedCore.classifyEvent(title);
        expect(coreRes.recipientName).toBe('Lucas and Olivia');
      });

      it('extracts celebrant while ignoring organizer parenthetical: "Birthday celebration for Maya (Organized by John)"', () => {
        const title = "Birthday celebration for Maya (Organized by John)";
        const result = classifyEvent(title);
        expect(result.isCelebration).toBe(true);
        expect(result.celebrationType).toBe('birthday');
        expect(result.recipientName).toBe('Maya');

        const coreRes = sharedCore.classifyEvent(title);
        expect(coreRes.recipientName).toBe('Maya');
      });

      it('extracts joint recipients from delimiter syntax: "Graduation: Alex & Sam 🎓"', () => {
        const title = "Graduation: Alex & Sam 🎓";
        const result = classifyEvent(title);
        expect(result.isCelebration).toBe(true);
        expect(result.celebrationType).toBe('milestone');
        expect(result.recipientName).toBe('Alex & Sam');

        const coreRes = sharedCore.classifyEvent(title);
        expect(coreRes.recipientName).toBe('Alex & Sam');
      });
    });

    describe('1.5 Negative Rejection Under Adversarial Noise', () => {
      const noisyNegatives = [
        "*** Team Standup ***",
        "Doctor Appointment \u200B - Dr. Day",
        "Dental Checkup [URGENT] 9:00 AM",
        "1:1 with Alex\nNotes: Quarterly performance review",
        "All-Hands Strategy Meeting (Room 402)",
        "Sprint Planning & Retrospective",
        "Morning Gym Workout - Leg Day",
      ];

      noisyNegatives.forEach((title) => {
        it(`strictly rejects noisy negative event: "${title.replace(/\n.*/, '...')}"`, () => {
          const oracleRes = classifyEvent(title);
          expect(oracleRes.isCelebration).toBe(false);
          expect(oracleRes.recipientName).toBeNull();

          const coreRes = sharedCore.classifyEvent(title);
          expect(coreRes.isCelebration).toBe(false);
          expect(coreRes.recipientName).toBeNull();
        });
      });
    });
  });

  // ==========================================================================
  // Section 2: Cross-Surface Parity Verification
  // ==========================================================================
  describe('2. Cross-Surface Parity Verification (shared vs gas vs extension)', () => {
    const sharedPath = path.resolve(__dirname, '../../../shared/CoreEngine.js');
    const gasPath = path.resolve(__dirname, '../../../gas/CoreEngine.js');
    const extPath = path.resolve(__dirname, '../../../extension/core/CoreEngine.js');

    it('2.1: shared/CoreEngine.js, gas/CoreEngine.js, and extension/core/CoreEngine.js are byte-identical', () => {
      const sharedContent = fs.readFileSync(sharedPath, 'utf8');
      const gasContent = fs.readFileSync(gasPath, 'utf8');
      const extContent = fs.readFileSync(extPath, 'utf8');

      // Byte-for-byte exact comparison
      expect(gasContent).toBe(sharedContent);
      expect(extContent).toBe(sharedContent);

      // SHA-256 hash comparison
      const hashShared = crypto.createHash('sha256').update(sharedContent).digest('hex');
      const hashGas = crypto.createHash('sha256').update(gasContent).digest('hex');
      const hashExt = crypto.createHash('sha256').update(extContent).digest('hex');

      expect(hashGas).toBe(hashShared);
      expect(hashExt).toBe(hashShared);
    });

    it('2.2: all 3 engine instances produce bit-identical classification across a test matrix', () => {
      const testScenarios: Array<{ title: string; notes?: string }> = [
        { title: "Sarah's Birthday 🎂" },
        { title: "Wedding Anniversary 💍" },
        { title: "Team Standup" },
        { title: "Doctor Appointment" },
        { title: "Zoë's Birthday 🎂" },
        { title: "José's Bday 🎉" },
        { title: "🎉✨ [VIP] Sarah's 30th Birthday Party!!! 🎂🥂" },
        { title: "Dave & Alice's 10th Wedding Anniversary 💍" },
        { title: "Birthday for Lucas and Olivia 🎂" },
        { title: "Surprise Celebration 🎉", notes: "Birthday for Alexander\nBring cake" },
      ];

      testScenarios.forEach((scenario) => {
        const resShared = sharedCore.classifyEvent(scenario.title, scenario.notes);
        const resGas = gasCore.classifyEvent(scenario.title, scenario.notes);
        const resExt = extCore.classifyEvent(scenario.title, scenario.notes);

        expect(resGas).toEqual(resShared);
        expect(resExt).toEqual(resShared);
      });
    });

    it('2.3: all 3 engine instances return identical catalogs and build identical affiliate URLs', () => {
      const catShared = sharedCore.getCatalog();
      const catGas = gasCore.getCatalog();
      const catExt = extCore.getCatalog();

      expect(catGas).toEqual(catShared);
      expect(catExt).toEqual(catShared);

      // Check URL generation for each brand and standard amount
      const amounts = [15, 25, 50, 100];
      const brands = ['starbucks', 'doordash', 'amazon', 'target'];

      for (const brandId of brands) {
        for (const amt of amounts) {
          const urlShared = sharedCore.buildGiftUrl(brandId, amt, 'test_sub', 'Sarah');
          const urlGas = gasCore.buildGiftUrl(brandId, amt, 'test_sub', 'Sarah');
          const urlExt = extCore.buildGiftUrl(brandId, amt, 'test_sub', 'Sarah');

          expect(urlGas).toBe(urlShared);
          expect(urlExt).toBe(urlShared);
        }
      }
    });

    it('2.4: all 3 engine instances produce bit-identical greetings and WhatsApp share links', () => {
      const options = {
        recipientName: 'Sarah',
        celebrationType: 'birthday' as const,
        tone: 'warm' as const,
      };

      const greetShared = sharedCore.generateGreeting(options);
      const greetGas = gasCore.generateGreeting(options);
      const greetExt = extCore.generateGreeting(options);

      expect(greetGas).toBe(greetShared);
      expect(greetExt).toBe(greetShared);

      const giftLink = sharedCore.buildGiftUrl('starbucks', 25, 'demo', 'Sarah');
      const waShared = sharedCore.buildWhatsAppShareUrl({ greeting: greetShared, giftLink });
      const waGas = gasCore.buildWhatsAppShareUrl({ greeting: greetGas, giftLink });
      const waExt = extCore.buildWhatsAppShareUrl({ greeting: greetExt, giftLink });

      expect(waGas).toBe(waShared);
      expect(waExt).toBe(waShared);
    });
  });

  // ==========================================================================
  // Section 3: 60-Second Demo Lifecycle Acceptance Verification
  // ==========================================================================
  describe('3. 60-Second Demo Lifecycle Acceptance Verification', () => {
    it('executes complete 60-Second Demo flow with zero setup (Calendar -> Badge -> Modal -> Brand -> WhatsApp -> Sheet)', async () => {
      const startTime = Date.now();

      // Step 1: Calendar event exists
      const testEvent = {
        id: 'cal-event-sarah-demo',
        title: "Sarah's Birthday 🎂",
        date: '2026-10-15',
      };

      // Step 2: Content script DOM simulation
      const dom = new CalendarDomSimulator();
      dom.addEventChip(testEvent.id, testEvent.title);

      const passResult = dom.runBadgeInjectionPass();
      expect(passResult.injected).toBe(1);

      const badge = dom.getChipBadge(testEvent.id);
      expect(badge).toBeDefined();
      expect(badge?.innerText).toBe('🎁');

      // Step 3: User clicks 🎁 badge
      let modalData: any = null;
      const clicked = dom.simulateBadgeClick(testEvent.id, (chip) => {
        const classification = sharedCore.classifyEvent(chip.title);
        modalData = {
          recipientName: classification.recipientName,
          celebrationType: classification.celebrationType,
          catalog: sharedCore.getCatalog(),
        };
      });

      expect(clicked).toBe(true);
      expect(modalData).not.toBeNull();
      expect(modalData.recipientName).toBe('Sarah');
      expect(modalData.celebrationType).toBe('birthday');
      expect(modalData.catalog.length).toBeGreaterThanOrEqual(4);

      // Step 4: User selects Starbucks and $25 chip
      const selectedBrand = modalData.catalog.find((b: any) => b.id === 'starbucks')!;
      expect(selectedBrand.supportedAmounts).toContain(25);

      const giftUrl = sharedCore.buildGiftUrl('starbucks', 25, 'extension_modal', modalData.recipientName);
      expect(giftUrl).toContain('starbucks.com');
      expect(giftUrl).toContain('amount=25');

      const greeting = sharedCore.generateGreeting({
        recipientName: modalData.recipientName,
        celebrationType: modalData.celebrationType,
        tone: 'warm',
      });
      expect(greeting).toContain('Sarah');

      // Step 5: Construct 1-tap WhatsApp deep link
      const whatsAppUrl = sharedCore.buildWhatsAppShareUrl({
        greeting,
        giftLink: giftUrl,
      });

      expect(whatsAppUrl.startsWith('https://api.whatsapp.com/send?text=')).toBe(true);
      const decodedWa = decodeURIComponent(whatsAppUrl);
      expect(decodedWa).toContain('Happy Birthday');
      expect(decodedWa).toContain(giftUrl);

      // Step 6: Google Apps Script Backend logs send event to CelebrationLog sheet
      const gas = new GasWebAppSimulator();
      // Pre-provision event in sheet
      gas.sheet.logCelebration({
        date: testEvent.date,
        recipientName: modalData.recipientName,
        eventType: 'birthday',
        eventId: testEvent.id,
      });

      // User triggers gift send -> POST log_gift
      const logResponse = gas.handleDoPost({
        action: 'log_gift',
        eventId: testEvent.id,
        recipientName: modalData.recipientName,
        brandChosen: 'Starbucks',
        amount: 25,
        date: testEvent.date,
        greetingUsed: greeting,
      });

      expect(logResponse.status).toBe(200);
      expect((logResponse.body as any).logged).toBe(true);

      // Step 7: Verify audit trail row in CelebrationLog sheet
      const loggedRow = gas.sheet.findByEventId(testEvent.id);
      expect(loggedRow).toBeDefined();
      expect(loggedRow?.giftSent).toBe(true);
      expect(loggedRow?.brandChosen).toBe('Starbucks');
      expect(loggedRow?.amount).toBe(25);
      expect(loggedRow?.recipientName).toBe('Sarah');
      expect(loggedRow?.eventType).toBe('birthday');

      // Step 8: Strict execution speed verification: flow executes in < 500ms
      const durationMs = Date.now() - startTime;
      expect(durationMs).toBeLessThan(500);
    });

    it('supports offline demo mode fallback via ChromeStorageMock when GAS URL is not configured', async () => {
      const storage = new ChromeStorageMock();
      const state = await storage.get(['gasWebAppUrl']);
      expect(state.gasWebAppUrl).toBeUndefined();

      // Use loadCelebrations fallback
      const loaded = await storage.loadCelebrations();
      expect(loaded.source).toBe('demo');
      expect(loaded.celebrations.length).toBeGreaterThanOrEqual(2);

      const firstCelebration = loaded.celebrations[0];
      expect(firstCelebration.recipientName).toBeDefined();

      // Build gift URL and WhatsApp share link directly from demo celebration
      const giftUrl = sharedCore.buildGiftUrl('target', 50, 'demo_mode', firstCelebration.recipientName);
      const waUrl = sharedCore.buildWhatsAppShareUrl({
        greeting: firstCelebration.suggestedGreeting,
        giftLink: giftUrl,
      });

      expect(waUrl).toContain('api.whatsapp.com');
      expect(decodeURIComponent(waUrl)).toContain(firstCelebration.recipientName);
    });
  });
});
