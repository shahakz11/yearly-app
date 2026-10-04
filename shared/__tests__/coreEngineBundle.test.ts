// Test that the standalone universal bundle (shared/CoreEngine.js)
// works seamlessly in Node / CommonJS environments without external dependencies.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AutoGifterCore = require('../CoreEngine.js');

describe('Universal Core Engine Bundle (shared/CoreEngine.js)', () => {
  it('should export all essential functions and constants', () => {
    expect(typeof AutoGifterCore.getCatalog).toBe('function');
    expect(typeof AutoGifterCore.getBrand).toBe('function');
    expect(typeof AutoGifterCore.buildGiftUrl).toBe('function');
    expect(typeof AutoGifterCore.classifyEvent).toBe('function');
    expect(typeof AutoGifterCore.generateGreeting).toBe('function');
    expect(typeof AutoGifterCore.buildWhatsAppShareUrl).toBe('function');
    expect(typeof AutoGifterCore.sanitizePhoneNumber).toBe('function');
    expect(AutoGifterCore.DEFAULT_AFFILIATE_ID).toBe('autogifter-20');
    expect(AutoGifterCore.STANDARD_AMOUNTS).toEqual([15, 25, 50, 100]);
  });

  it('should correctly classify celebrations and extract names in CoreEngine.js', () => {
    const bday = AutoGifterCore.classifyEvent("Sarah's Birthday 🎂");
    expect(bday.isCelebration).toBe(true);
    expect(bday.celebrationType).toBe('birthday');
    expect(bday.recipientName).toBe('Sarah');

    const anniv = AutoGifterCore.classifyEvent('Wedding Anniversary 💍');
    expect(anniv.isCelebration).toBe(true);
    expect(anniv.celebrationType).toBe('anniversary');
    expect(anniv.recipientName).toBeNull();

    const standup = AutoGifterCore.classifyEvent('Team Standup');
    expect(standup.isCelebration).toBe(false);

    const doc = AutoGifterCore.classifyEvent('Doctor Appointment');
    expect(doc.isCelebration).toBe(false);
  });

  it('should provide catalog and build gift URLs in CoreEngine.js', () => {
    const catalog = AutoGifterCore.getCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(4);

    const brand = AutoGifterCore.getBrand('starbucks');
    expect(brand).toBeDefined();
    expect(brand.name).toBe('Starbucks');

    const url = AutoGifterCore.buildGiftUrl('starbucks', 25, 'sub_123', 'Bob');
    expect(url).toContain('amount=25');
    expect(url).toContain('subId=sub_123');
    expect(url).toContain('recipient=Bob');
  });

  it('should generate greetings and WhatsApp URLs in CoreEngine.js', () => {
    const greeting = AutoGifterCore.generateGreeting({
      recipientName: 'Alice',
      celebrationType: 'birthday',
      relationshipType: 'friend',
      tone: 'warm',
    });
    expect(greeting).toContain('Alice');
    expect(greeting).toContain('Happy Birthday');

    const shareUrl = AutoGifterCore.buildWhatsAppShareUrl({
      greeting,
      giftLink: 'https://example.com/gift',
      brandName: 'Amazon',
      amount: 50,
      phone: '+1 555-1234',
    });
    expect(shareUrl.startsWith('https://api.whatsapp.com/send?phone=15551234&text=')).toBe(true);
  });

  it('should support safe note preservation and description inspection in CoreEngine.js', () => {
    const enriched = AutoGifterCore.buildEnrichedEventDescription({
      recipientName: 'David',
      existingNotes: 'User note: Prefers red roses',
    });
    expect(enriched).toContain('<!-- autogifter:start -->');
    expect(enriched).toContain('<!-- autogifter:end -->');
    expect(enriched.startsWith('User note: Prefers red roses')).toBe(true);

    const inspection = AutoGifterCore.inspectEventDescription(enriched);
    expect(inspection.isHybrid).toBe(true);
    expect(inspection.userNotes).toBe('User note: Prefers red roses');
  });
});
