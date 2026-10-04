import { getCatalog, getBrand, buildGiftUrl, DEFAULT_AFFILIATE_ID, STANDARD_AMOUNTS } from '../catalog';

describe('Catalog Service (shared/catalog.ts)', () => {
  describe('Brand Inventory & Denomination Chips', () => {
    it('should include at least Starbucks, DoorDash, Amazon, and Target', () => {
      const catalog = getCatalog();
      const brandIds = catalog.map((b) => b.id);

      expect(brandIds).toContain('starbucks');
      expect(brandIds).toContain('doordash');
      expect(brandIds).toContain('amazon');
      expect(brandIds).toContain('target');
    });

    it('should support standard amount chips [15, 25, 50, 100] across all brands', () => {
      const catalog = getCatalog();

      catalog.forEach((brand) => {
        expect(brand.supportedAmounts).toEqual(STANDARD_AMOUNTS);
        expect(brand.supportedAmounts).toContain(15);
        expect(brand.supportedAmounts).toContain(25);
        expect(brand.supportedAmounts).toContain(50);
        expect(brand.supportedAmounts).toContain(100);
      });
    });

    it('should provide required visual metadata for each brand', () => {
      const catalog = getCatalog();

      catalog.forEach((brand) => {
        expect(brand.name).toBeTruthy();
        expect(brand.logoEmoji).toBeTruthy();
        expect(brand.primaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(brand.affiliateUrlTemplate).toContain('{amount}');
        expect(brand.affiliateUrlTemplate).toContain('{subId}');
      });
    });
  });

  describe('getBrand Lookup', () => {
    it('should retrieve a brand by ID case-insensitively', () => {
      const starbucks = getBrand('Starbucks');
      expect(starbucks).toBeDefined();
      expect(starbucks?.name).toBe('Starbucks');
      expect(starbucks?.id).toBe('starbucks');
    });

    it('should return undefined for unknown brand ID', () => {
      expect(getBrand('nonexistent-brand')).toBeUndefined();
      expect(getBrand('')).toBeUndefined();
    });
  });

  describe('buildGiftUrl Affiliate Tracking', () => {
    it('should interpolate amount, subId, recipientName, and default affiliateId', () => {
      const url = buildGiftUrl('starbucks', 25, 'cal_event_123', 'Sarah Connor');

      expect(url).toContain('amount=25');
      expect(url).toContain('subId=cal_event_123');
      expect(url).toContain(`tag=${DEFAULT_AFFILIATE_ID}`);
      expect(url).toContain('recipient=Sarah%20Connor');
    });

    it('should fallback subId to "direct" when omitted', () => {
      const url = buildGiftUrl('amazon', 50);

      expect(url).toContain('amount=50');
      expect(url).toContain('subId=direct');
      expect(url).toContain(`tag=${DEFAULT_AFFILIATE_ID}`);
      expect(url).not.toContain('recipient=');
    });

    it('should allow custom affiliateId override', () => {
      const url = buildGiftUrl('doordash', 15, 'promo_99', 'Alex', 'custom-aff-id');

      expect(url).toContain('tag=custom-aff-id');
      expect(url).toContain('subId=promo_99');
      expect(url).toContain('amount=15');
      expect(url).toContain('recipient=Alex');
    });

    it('should return an empty string for invalid brand', () => {
      const url = buildGiftUrl('fakebrand', 25);
      expect(url).toBe('');
    });
  });

  describe('Event Description Enrichment & Safe Note Preservation', () => {
    const { cleanExistingNotes, buildEnrichedEventDescription, inspectEventDescription } = require('../catalog');

    it('should build enriched description with HTML comment boundary tags', () => {
      const enriched = buildEnrichedEventDescription({
        recipientName: 'Maya',
        celebrationType: 'birthday',
      });

      expect(enriched).toContain('<!-- autogifter:start -->');
      expect(enriched).toContain('<!-- autogifter:end -->');
      expect(enriched).toContain('🌸 FloristOne Flower Delivery for Maya 🌸');
      expect(enriched).toContain('Top 5 hand-delivered flower bouquets:');
    });

    it('should preserve user notes at the top when generating enriched description', () => {
      const enriched = buildEnrichedEventDescription({
        recipientName: 'Alex',
        existingNotes: 'User note: Loves sushi & coffee',
      });

      expect(enriched.startsWith('User note: Loves sushi & coffee\n\n<!-- autogifter:start -->')).toBe(true);
      expect(enriched).toContain('<!-- autogifter:end -->');
    });

    it('should cleanly strip tagged Auto-Gifter block and preserve notes placed after the block', () => {
      const complexDesc = [
        'Note before Auto-Gifter block',
        '<!-- autogifter:start -->',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '🌸 FloristOne Flower Delivery for Maya 🌸',
        '1. <a href="https://floristone.com/cart.cfm">Flower</a>',
        '<!-- autogifter:end -->',
        'Note after Auto-Gifter block (e.g. user added later)',
      ].join('\n');

      const cleaned = cleanExistingNotes(complexDesc);
      expect(cleaned).toContain('Note before Auto-Gifter block');
      expect(cleaned).toContain('Note after Auto-Gifter block (e.g. user added later)');
      expect(cleaned).not.toContain('FloristOne Flower Delivery');
      expect(cleaned).not.toContain('autogifter:start');
    });

    it('should handle legacy un-tagged Auto-Gifter descriptions gracefully', () => {
      const legacyDesc = [
        'User original reminder: Buy cake',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '🌸 FloristOne Flower Delivery for Mom 🌸',
        'Top 5 hand-delivered flower bouquets:',
      ].join('\n');

      const cleaned = cleanExistingNotes(legacyDesc);
      expect(cleaned).toBe('User original reminder: Buy cake');
    });

    it('should accurately inspect authorship (pure Auto-Gifter, pure user, hybrid)', () => {
      const pureUser = inspectEventDescription('Meeting with Maya to discuss anniversary gift.');
      expect(pureUser.isPureUser).toBe(true);
      expect(pureUser.isPureAutoGifter).toBe(false);
      expect(pureUser.isHybrid).toBe(false);
      expect(pureUser.userNotes).toBe('Meeting with Maya to discuss anniversary gift.');

      const pureAutoGifter = inspectEventDescription(
        '<!-- autogifter:start -->\n🌸 FloristOne Flower Delivery for Maya 🌸\n<!-- autogifter:end -->'
      );
      expect(pureAutoGifter.isPureAutoGifter).toBe(true);
      expect(pureAutoGifter.isPureUser).toBe(false);
      expect(pureAutoGifter.isHybrid).toBe(false);
      expect(pureAutoGifter.userNotes).toBe('');

      const hybrid = inspectEventDescription(
        'User note: Allergic to lilies.\n\n<!-- autogifter:start -->\n🌸 FloristOne Flower Delivery for Maya 🌸\n<!-- autogifter:end -->'
      );
      expect(hybrid.isHybrid).toBe(true);
      expect(hybrid.hasUserNotes).toBe(true);
      expect(hybrid.hasAutoGifterSection).toBe(true);
      expect(hybrid.userNotes).toBe('User note: Allergic to lilies.');
    });
  });
});
