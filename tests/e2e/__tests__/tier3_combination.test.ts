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
} from '../fixtures/calendarScenarios';

describe('Tier 3: Cross-Feature Combinations & Pipelines', () => {
  // --------------------------------------------------------------------------
  // Pipeline 1: Detection -> Recipient -> Greeting -> WhatsApp URL
  // --------------------------------------------------------------------------
  it('C1: Event Detection -> Recipient Extraction -> Greeting -> WhatsApp Share URL', () => {
    const rawTitle = "Sarah's Birthday 🎂";
    const classification = classifyEvent(rawTitle);

    expect(classification.isCelebration).toBe(true);
    expect(classification.recipientName).toBe('Sarah');

    const greeting = generateGreeting({
      recipientName: classification.recipientName!,
      celebrationType: classification.celebrationType!,
      tone: 'warm',
    });

    expect(greeting).toContain('Sarah');
    expect(greeting).toContain('🎂');

    const shareUrl = buildWhatsAppShareUrl({ greeting });
    expect(shareUrl.startsWith('https://api.whatsapp.com/send?text=')).toBe(true);

    const decoded = decodeURIComponent(shareUrl);
    expect(decoded).toContain(greeting);
  });

  // --------------------------------------------------------------------------
  // Pipeline 2: Event Detection -> Catalog Lookup -> Affiliate URL -> WhatsApp
  // --------------------------------------------------------------------------
  it('C2: Event Detection -> Catalog -> Affiliate URL with subId -> WhatsApp Share URL', () => {
    const rawTitle = "Bob's 30th Bday";
    const classification = classifyEvent(rawTitle);

    expect(classification.recipientName).toBe('Bob');

    const catalog = getCatalog();
    const starbucksBrand = catalog.find((b) => b.id === 'starbucks')!;
    expect(starbucksBrand).toBeDefined();

    const giftUrl = buildGiftUrl('starbucks', 25, undefined, classification.recipientName!);
    expect(giftUrl).toContain('amount=25');
    expect(giftUrl).toContain('subId=autogifter_cal_Bob');

    const greeting = generateGreeting({
      recipientName: classification.recipientName!,
      celebrationType: classification.celebrationType!,
      tone: 'fun',
    });

    const shareUrl = buildWhatsAppShareUrl({
      greeting,
      giftLink: giftUrl,
    });

    const decoded = decodeURIComponent(shareUrl);
    expect(decoded).toContain('Bob');
    expect(decoded).toContain('starbucks.com/gift?amount=25&subId=autogifter_cal_Bob');
  });

  // --------------------------------------------------------------------------
  // Pipeline 3: Calendar Event -> GAS events -> Extension Popup -> log_gift -> Sheets
  // --------------------------------------------------------------------------
  it('C3: Full Data Flow: Calendar Event -> GAS doGet(events) -> Extension Selection -> doPost(log_gift) -> Google Sheets', () => {
    const simulator = new GasWebAppSimulator(POSITIVE_SCENARIOS);

    // Step 1: Chrome Extension calls GAS doGet ?action=events&days=14
    const getRes = simulator.handleDoGet({ action: 'events', days: '14' });
    expect(getRes.status).toBe(200);
    const events = (getRes.body as any).events;
    expect(events.length).toBeGreaterThan(0);

    const sarahEvent = events.find((e: any) => e.recipientName === 'Sarah');
    expect(sarahEvent).toBeDefined();

    // Step 2: Extension popup sends gift log to GAS doPost
    const postRes = simulator.handleDoPost({
      action: 'log_gift',
      eventId: sarahEvent.id,
      recipientName: sarahEvent.recipientName,
      brandChosen: 'Starbucks',
      amount: 25,
      date: sarahEvent.date,
      greetingUsed: sarahEvent.suggestedGreeting,
    });

    expect(postRes.status).toBe(200);
    expect((postRes.body as any).logged).toBe(true);

    // Step 3: Verify Google Sheets persistence record
    const sheetRow = simulator.sheet.findByEventId(sarahEvent.id);
    expect(sheetRow).toBeDefined();
    expect(sheetRow?.giftSent).toBe(true);
    expect(sheetRow?.brandChosen).toBe('Starbucks');
    expect(sheetRow?.amount).toBe(25);
    expect(sheetRow?.recipientName).toBe('Sarah');
  });

  // --------------------------------------------------------------------------
  // Pipeline 4: Calendar DOM Chip -> Badge Injection -> Click -> Trigger Share
  // --------------------------------------------------------------------------
  it('C4: Calendar DOM Chip -> Badge Injection -> User Click -> Trigger WhatsApp Share', () => {
    const dom = new CalendarDomSimulator();
    dom.addEventChip('chip-sarah', "Sarah's Birthday 🎂");

    // Content script runs DOM injection
    const pass = dom.runBadgeInjectionPass();
    expect(pass.injected).toBe(1);

    let modalOpenedFor = '';
    let finalShareUrl = '';

    // User clicks the badge on the calendar chip
    const clickSuccess = dom.simulateBadgeClick('chip-sarah', (chip) => {
      modalOpenedFor = chip.title;

      // Inside modal: build share link
      const classification = classifyEvent(chip.title);
      const greeting = generateGreeting({
        recipientName: classification.recipientName!,
        celebrationType: classification.celebrationType!,
      });
      const giftUrl = buildGiftUrl('starbucks', 25, 'cal_modal');
      finalShareUrl = buildWhatsAppShareUrl({ greeting, giftLink: giftUrl });
    });

    expect(clickSuccess).toBe(true);
    expect(modalOpenedFor).toBe("Sarah's Birthday 🎂");
    expect(finalShareUrl).toContain('https://api.whatsapp.com/send?text=');
    expect(decodeURIComponent(finalShareUrl)).toContain('Sarah');
    expect(decodeURIComponent(finalShareUrl)).toContain('starbucks.com');
  });

  // --------------------------------------------------------------------------
  // Pipeline 5: Storage Sync check -> Demo Mode Fallback -> Display Celebrations
  // --------------------------------------------------------------------------
  it('C5: Storage Sync check -> Demo Mode Fallback -> Display Upcoming Celebrations', async () => {
    const storage = new ChromeStorageMock();
    // No gasWebAppUrl is configured

    const { source, celebrations } = await storage.loadCelebrations();
    expect(source).toBe('demo');
    expect(celebrations.length).toBe(2);

    const first = celebrations[0];
    expect(first.title).toBe("Sarah's Birthday 🎂");
    expect(first.whatsAppUrl).toContain('https://api.whatsapp.com/send?text=');

    // User can immediately tap the demo celebration WhatsApp URL
    const decodedUrl = decodeURIComponent(first.whatsAppUrl);
    expect(decodedUrl).toContain('Happy Birthday Sarah');
  });

  // --------------------------------------------------------------------------
  // Pipeline 6: Multi-Event Scan -> Daily Trigger -> Sheets Deduplication
  // --------------------------------------------------------------------------
  it('C6: Multi-Event Calendar Scan -> Daily Trigger -> Sheets Deduplication', () => {
    const simulator = new GasWebAppSimulator(POSITIVE_SCENARIOS);

    // First daily trigger run
    const run1 = simulator.runDailyTrigger(14);
    expect(run1.loggedRows).toBeGreaterThan(0);
    const initialRowCount = simulator.sheet.getRowCount();

    // Second daily trigger run next day (idempotent deduplication)
    const run2 = simulator.runDailyTrigger(14);
    expect(run2.loggedRows).toBe(0); // 0 new rows
    expect(simulator.sheet.getRowCount()).toBe(initialRowCount);
  });

  // --------------------------------------------------------------------------
  // Pipeline 7: End-to-End Audit Trail: Gift Sent Update
  // --------------------------------------------------------------------------
  it('C7: End-to-End Audit Trail: Gift Sent status update preserves other rows', () => {
    const sheet = new CelebrationLogSheet();

    // Seed with 3 events
    sheet.logCelebration({
      date: '2026-10-15',
      recipientName: 'Sarah',
      eventType: 'birthday',
      eventId: 'evt-sarah',
    });
    sheet.logCelebration({
      date: '2026-10-18',
      recipientName: 'Bob',
      eventType: 'birthday',
      eventId: 'evt-bob',
    });
    sheet.logCelebration({
      date: '2026-10-25',
      recipientName: 'Alex',
      eventType: 'birthday',
      eventId: 'evt-alex',
    });

    expect(sheet.getRowCount()).toBe(3);

    // Send gift to Bob
    sheet.markGiftSent({
      action: 'log_gift',
      eventId: 'evt-bob',
      recipientName: 'Bob',
      brandChosen: 'DoorDash',
      amount: 50,
    });

    const bobRow = sheet.findByEventId('evt-bob');
    const sarahRow = sheet.findByEventId('evt-sarah');
    const alexRow = sheet.findByEventId('evt-alex');

    expect(bobRow?.giftSent).toBe(true);
    expect(bobRow?.brandChosen).toBe('DoorDash');
    expect(bobRow?.amount).toBe(50);

    // Others remain unsent
    expect(sarahRow?.giftSent).toBe(false);
    expect(alexRow?.giftSent).toBe(false);
  });

  // --------------------------------------------------------------------------
  // Pipeline 8: Tone Variation Consistency
  // --------------------------------------------------------------------------
  it('C8: Tone Variation Consistency (warm vs fun vs formal) generates valid distinct WhatsApp URLs', () => {
    const tones: Array<'warm' | 'fun' | 'formal'> = ['warm', 'fun', 'formal'];
    const urls = tones.map((tone) => {
      const greeting = generateGreeting({
        recipientName: 'Sarah',
        celebrationType: 'birthday',
        tone,
      });
      return buildWhatsAppShareUrl({ greeting });
    });

    // All must be valid WhatsApp URLs
    urls.forEach((u) => {
      expect(u.startsWith('https://api.whatsapp.com/send?text=')).toBe(true);
      expect(decodeURIComponent(u)).toContain('Sarah');
    });

    // All 3 must be distinct messages
    expect(urls[0]).not.toBe(urls[1]);
    expect(urls[1]).not.toBe(urls[2]);
    expect(urls[0]).not.toBe(urls[2]);
  });

  // --------------------------------------------------------------------------
  // Pipeline 9: Negative Events Batch Ingestion Rejection
  // --------------------------------------------------------------------------
  it('C9: Negative Events Batch Ingestion: Zero badges, zero events, zero sheet rows', () => {
    const dom = new CalendarDomSimulator();
    NEGATIVE_SCENARIOS.forEach((neg) => dom.addEventChip(neg.id, neg.title));

    const domResult = dom.runBadgeInjectionPass();
    expect(domResult.injected).toBe(0);
    expect(domResult.rejectedNonCelebration).toBe(NEGATIVE_SCENARIOS.length);

    const simulator = new GasWebAppSimulator(NEGATIVE_SCENARIOS);
    const eventsRes = simulator.handleDoGet({ action: 'events', days: '14' });
    expect((eventsRes.body as any).events).toEqual([]);

    const triggerRes = simulator.runDailyTrigger(14);
    expect(triggerRes.loggedRows).toBe(0);
    expect(simulator.sheet.getRowCount()).toBe(0);
  });

  // --------------------------------------------------------------------------
  // Pipeline 10: Multi-day Celebration Log Deduplication
  // --------------------------------------------------------------------------
  it('C10: Multi-day Celebration Event results in single deduplicated Google Sheet record', () => {
    const sheet = new CelebrationLogSheet();
    const eventId = 'evt-multiday-sarah';

    // Day 1 trigger scan
    sheet.logCelebration({
      date: '2026-10-15',
      recipientName: 'Sarah',
      eventType: 'birthday',
      eventId,
    });

    // Day 2 trigger scan (same eventId, slightly updated date range)
    const updateRes = sheet.logCelebration({
      date: '2026-10-15',
      recipientName: 'Sarah',
      eventType: 'birthday',
      eventId,
    });

    expect(updateRes.isUpdate).toBe(true);
    expect(sheet.getRowCount()).toBe(1);
  });
});
