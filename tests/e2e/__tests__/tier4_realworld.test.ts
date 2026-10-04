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
import {
  POSITIVE_SCENARIOS,
  NEGATIVE_SCENARIOS,
  CalendarEventScenario,
} from '../fixtures/calendarScenarios';

describe('Tier 4: Real-World Scenarios (Complete Calendar Workflows)', () => {
  // --------------------------------------------------------------------------
  // Scenario 1: The Canonical "Sarah's Birthday 🎂" 60-Second End-to-End Flow
  // --------------------------------------------------------------------------
  it('R1: Sarah\'s Birthday 60-Second Complete User Flow (Calendar -> Badge -> Gift Selection -> WhatsApp -> Sheet Log)', async () => {
    const startTime = Date.now();

    // 1. User has event "Sarah's Birthday 🎂" in calendar
    const calendarEvent = {
      id: 'evt-sarah-bday-2026',
      title: "Sarah's Birthday 🎂",
      date: '2026-10-15',
    };

    // 2. Calendar Web UI loaded; Content Script runs badge injection
    const dom = new CalendarDomSimulator();
    dom.addEventChip(calendarEvent.id, calendarEvent.title);
    const injectionResult = dom.runBadgeInjectionPass();

    expect(injectionResult.injected).toBe(1);
    const badge = dom.getChipBadge(calendarEvent.id);
    expect(badge).toBeDefined();
    expect(badge?.innerText).toBe('🎁');

    // 3. User clicks the 🎁 badge on Sarah's birthday chip
    let modalOpened = false;
    let recipientExtracted = '';
    dom.simulateBadgeClick(calendarEvent.id, (chip) => {
      modalOpened = true;
      const classification = classifyEvent(chip.title);
      expect(classification.isCelebration).toBe(true);
      expect(classification.celebrationType).toBe('birthday');
      recipientExtracted = classification.recipientName!;
    });

    expect(modalOpened).toBe(true);
    expect(recipientExtracted).toBe('Sarah');

    // 4. Modal presents gift brands and greetings; User chooses Starbucks $25
    const catalog = getCatalog();
    const starbucks = catalog.find((b) => b.id === 'starbucks')!;
    expect(starbucks.supportedAmounts).toContain(25);

    const giftUrl = buildGiftUrl('starbucks', 25, undefined, recipientExtracted);
    const greeting = generateGreeting({
      recipientName: recipientExtracted,
      celebrationType: 'birthday',
      tone: 'warm',
    });

    // 5. WhatsApp 1-tap share link generated
    const whatsAppUrl = buildWhatsAppShareUrl({
      greeting,
      giftLink: giftUrl,
    });

    expect(whatsAppUrl.startsWith('https://api.whatsapp.com/send?text=')).toBe(true);
    const decodedUrl = decodeURIComponent(whatsAppUrl);
    expect(decodedUrl).toContain('Happy Birthday Sarah');
    expect(decodedUrl).toContain('https://starbucks.com/gift?amount=25&subId=autogifter_cal_Sarah');

    // 6. User sends gift; GAS Web App records to Google Sheets
    const gas = new GasWebAppSimulator();
    // Provision event first (via daily scan or on-the-fly)
    gas.sheet.logCelebration({
      date: calendarEvent.date,
      recipientName: recipientExtracted,
      eventType: 'birthday',
      greetingUsed: greeting,
      eventId: calendarEvent.id,
    });

    // Log gift send
    const postRes = gas.handleDoPost({
      action: 'log_gift',
      eventId: calendarEvent.id,
      recipientName: recipientExtracted,
      brandChosen: 'Starbucks',
      amount: 25,
      date: calendarEvent.date,
      greetingUsed: greeting,
    });

    expect(postRes.status).toBe(200);
    expect((postRes.body as any).logged).toBe(true);

    // 7. Verify audit trail in Google Sheets CelebrationLog
    const row = gas.sheet.findByEventId(calendarEvent.id);
    expect(row).toBeDefined();
    expect(row?.giftSent).toBe(true);
    expect(row?.brandChosen).toBe('Starbucks');
    expect(row?.amount).toBe(25);
    expect(row?.recipientName).toBe('Sarah');
    expect(row?.eventType).toBe('birthday');

    // 8. Verify the entire simulated flow executes rapidly (under 60 seconds / < 500ms)
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(500);
  });

  // --------------------------------------------------------------------------
  // Scenario 2: Wedding Anniversary Flow
  // --------------------------------------------------------------------------
  it('R2: Wedding Anniversary Flow with Amazon $50 and formal greeting', () => {
    const event = {
      id: 'evt-anniv-dave-alice',
      title: "Dave & Alice's Wedding Anniversary 💍",
      date: '2026-11-05',
    };

    // Classify
    const classification = classifyEvent(event.title);
    expect(classification.isCelebration).toBe(true);
    expect(classification.celebrationType).toBe('anniversary');
    expect(classification.recipientName).toBe('Dave & Alice');

    // Generate formal greeting
    const greeting = generateGreeting({
      recipientName: classification.recipientName!,
      celebrationType: 'anniversary',
      tone: 'formal',
    });
    expect(greeting).toContain('Warmest congratulations on your Anniversary, Dave & Alice');
    expect(greeting).toContain('💍');

    // Select Amazon $50
    const giftUrl = buildGiftUrl('amazon', 50, undefined, 'Dave_Alice');
    expect(giftUrl).toContain('amazon.com');
    expect(giftUrl).toContain('amount=50');

    // Build WhatsApp URL
    const whatsAppUrl = buildWhatsAppShareUrl({ greeting, giftLink: giftUrl });
    const decoded = decodeURIComponent(whatsAppUrl);
    expect(decoded).toContain('Dave & Alice');
    expect(decoded).toContain('amazon.com');

    // Log to Sheets
    const gas = new GasWebAppSimulator();
    gas.sheet.logCelebration({
      date: event.date,
      recipientName: classification.recipientName!,
      eventType: 'anniversary',
      eventId: event.id,
    });
    gas.sheet.markGiftSent({
      action: 'log_gift',
      eventId: event.id,
      recipientName: classification.recipientName!,
      brandChosen: 'Amazon',
      amount: 50,
      greetingUsed: greeting,
    });

    const saved = gas.sheet.findByEventId(event.id);
    expect(saved?.giftSent).toBe(true);
    expect(saved?.brandChosen).toBe('Amazon');
    expect(saved?.amount).toBe(50);
  });

  // --------------------------------------------------------------------------
  // Scenario 3: Mixed Calendar Busy Week (10 events: 3 celebrations, 7 non-celebrations)
  // --------------------------------------------------------------------------
  it('R3: Mixed Calendar Busy Week: Injects ONLY on celebrations, zero false positives', () => {
    const calendarWeek: Array<{ id: string; title: string; isCelebrationExpected: boolean }> = [
      { id: 'ev1', title: 'Team Standup', isCelebrationExpected: false },
      { id: 'ev2', title: "Sarah's Birthday 🎂", isCelebrationExpected: true },
      { id: 'ev3', title: 'Doctor Appointment', isCelebrationExpected: false },
      { id: 'ev4', title: 'Dentist Appointment', isCelebrationExpected: false },
      { id: 'ev5', title: "Dave & Alice's Wedding Anniversary 💍", isCelebrationExpected: true },
      { id: 'ev6', title: 'Weekly 1:1 with Alex', isCelebrationExpected: false },
      { id: 'ev7', title: 'Sprint Planning', isCelebrationExpected: false },
      { id: 'ev8', title: "Mom's Birthday Party 🎉", isCelebrationExpected: true },
      { id: 'ev9', title: 'Quarterly Financial Review', isCelebrationExpected: false },
      { id: 'ev10', title: 'Lunch with Dave', isCelebrationExpected: false },
    ];

    const dom = new CalendarDomSimulator();
    calendarWeek.forEach((ev) => dom.addEventChip(ev.id, ev.title));

    const pass = dom.runBadgeInjectionPass();
    expect(pass.scanned).toBe(10);
    expect(pass.injected).toBe(3);
    expect(pass.rejectedNonCelebration).toBe(7);

    // Verify badges are only on the 3 celebrations
    expect(dom.getChipBadge('ev2')).toBeDefined();
    expect(dom.getChipBadge('ev5')).toBeDefined();
    expect(dom.getChipBadge('ev8')).toBeDefined();

    expect(dom.getChipBadge('ev1')).toBeUndefined();
    expect(dom.getChipBadge('ev3')).toBeUndefined();
    expect(dom.getChipBadge('ev4')).toBeUndefined();
    expect(dom.getChipBadge('ev6')).toBeUndefined();
    expect(dom.getChipBadge('ev7')).toBeUndefined();
    expect(dom.getChipBadge('ev9')).toBeUndefined();
    expect(dom.getChipBadge('ev10')).toBeUndefined();
  });

  // --------------------------------------------------------------------------
  // Scenario 4: Workspace Add-on Sidebar Card Simulation
  // --------------------------------------------------------------------------
  it('R4: Google Workspace Add-on onCalendarEventOpen CardService Sidebar simulation', () => {
    // Helper function simulating onCalendarEventOpen CardService builder
    function onCalendarEventOpen(eventData: { title: string }) {
      const classification = classifyEvent(eventData.title);
      if (!classification.isCelebration) {
        return {
          cardType: 'empty',
          header: 'No celebration detected for this event.',
          widgets: [],
        };
      }

      const name = classification.recipientName || 'Friend';
      const greeting = generateGreeting({
        recipientName: name,
        celebrationType: classification.celebrationType!,
        tone: 'warm',
      });
      const catalog = getCatalog();
      const giftLinks = catalog.map((b) => ({
        brand: b.name,
        url: buildGiftUrl(b.id, 25, undefined, name),
      }));
      const whatsAppUrl = buildWhatsAppShareUrl({
        greeting,
        giftLink: giftLinks[0].url,
      });

      return {
        cardType: 'celebration',
        header: `Auto-Gifter: ${classification.celebrationType?.toUpperCase()}`,
        recipient: name,
        greeting,
        giftLinks,
        whatsAppUrl,
        widgets: ['status_section', 'brand_chips', 'greeting_text', 'whatsapp_button'],
      };
    }

    // Birthday event open
    const cardBirthday = onCalendarEventOpen({ title: "Sarah's Birthday 🎂" });
    expect(cardBirthday.cardType).toBe('celebration');
    expect(cardBirthday.recipient).toBe('Sarah');
    expect(cardBirthday.giftLinks).toHaveLength(4);
    expect(cardBirthday.whatsAppUrl).toContain('https://api.whatsapp.com/send?text=');

    // Standup event open
    const cardStandup = onCalendarEventOpen({ title: 'Team Standup' });
    expect(cardStandup.cardType).toBe('empty');
    expect(cardStandup.widgets).toHaveLength(0);
  });

  // --------------------------------------------------------------------------
  // Scenario 5: Daily 8:00 AM Cron Scan Simulation
  // --------------------------------------------------------------------------
  it('R5: Daily 8:00 AM Cron Scan scans 14-day window idempotently across 2 consecutive days', () => {
    const simulator = new GasWebAppSimulator(POSITIVE_SCENARIOS);

    // Day 1: 8:00 AM Cron scan
    const day1Result = simulator.runDailyTrigger(14);
    expect(day1Result.scannedCount).toBeGreaterThan(0);
    expect(day1Result.loggedRows).toBe(day1Result.scannedCount);
    const day1RowCount = simulator.sheet.getRowCount();

    // In between, user sends gift for first event
    const firstEvent = POSITIVE_SCENARIOS[0];
    simulator.sheet.markGiftSent({
      action: 'log_gift',
      eventId: firstEvent.id,
      recipientName: firstEvent.expected.recipientName!,
      brandChosen: 'Starbucks',
      amount: 25,
    });

    // Day 2: 8:00 AM Cron scan
    const day2Result = simulator.runDailyTrigger(14);
    expect(day2Result.loggedRows).toBe(0); // Deduplicated: no duplicates created
    expect(simulator.sheet.getRowCount()).toBe(day1RowCount);

    // Verify gift sent flag is preserved on Day 2
    const firstRow = simulator.sheet.findByEventId(firstEvent.id);
    expect(firstRow?.giftSent).toBe(true);
    expect(firstRow?.brandChosen).toBe('Starbucks');
  });

  // --------------------------------------------------------------------------
  // Scenario 6: Zero-Auth Chrome Extension to GAS Web App Flow
  // --------------------------------------------------------------------------
  it('R6: Zero-Auth Chrome Extension to GAS Web App Flow (GET events -> POST log_gift)', () => {
    const gas = new GasWebAppSimulator(POSITIVE_SCENARIOS);

    // Extension fetches events without re-auth
    const eventsResponse = gas.handleDoGet({ action: 'events', days: '14' });
    expect(eventsResponse.status).toBe(200);
    const events = (eventsResponse.body as any).events;
    expect(events.length).toBeGreaterThan(0);

    // Extension UI selects target event
    const targetEvent = events[0];
    expect(targetEvent.recipientName).toBeDefined();

    // Extension posts gift send event
    const postRes = gas.handleDoPost({
      action: 'log_gift',
      eventId: targetEvent.id,
      recipientName: targetEvent.recipientName,
      brandChosen: 'Target',
      amount: 50,
      date: targetEvent.date,
      greetingUsed: targetEvent.suggestedGreeting,
    });

    expect(postRes.status).toBe(200);
    expect((postRes.body as any).logged).toBe(true);

    const loggedRow = gas.sheet.findByEventId(targetEvent.id);
    expect(loggedRow?.giftSent).toBe(true);
    expect(loggedRow?.brandChosen).toBe('Target');
    expect(loggedRow?.amount).toBe(50);
  });
});
