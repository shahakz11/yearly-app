import { buildWhatsAppShareUrl, buildWhatsAppTextMessage, sanitizePhoneNumber } from '../whatsapp';

describe('WhatsApp Deep Link Service (shared/whatsapp.ts)', () => {
  describe('sanitizePhoneNumber', () => {
    it('should strip all non-digit characters from phone number', () => {
      expect(sanitizePhoneNumber('+1 (555) 234-5678')).toBe('15552345678');
      expect(sanitizePhoneNumber('+44 20 7946 0958')).toBe('442079460958');
      expect(sanitizePhoneNumber('')).toBe('');
      expect(sanitizePhoneNumber(undefined)).toBe('');
    });
  });

  describe('buildWhatsAppTextMessage', () => {
    it('should format message with greeting and gift card details', () => {
      const msg = buildWhatsAppTextMessage({
        greeting: "Happy Birthday, Sarah! 🎂",
        giftLink: "https://www.starbucks.com/gift?amount=25",
        brandName: "Starbucks",
        amount: 25,
      });

      expect(msg).toContain("Happy Birthday, Sarah! 🎂");
      expect(msg).toContain("🎁 Starbucks Gift Card ($25): https://www.starbucks.com/gift?amount=25");
    });

    it('should format greeting-only message when gift link is absent', () => {
      const msg = buildWhatsAppTextMessage({
        greeting: "Happy Birthday, Sarah! 🎂",
      });

      expect(msg).toBe("Happy Birthday, Sarah! 🎂");
      expect(msg).not.toContain("🎁");
    });
  });

  describe('buildWhatsAppShareUrl', () => {
    it('should construct valid WhatsApp share URL with UTF-8 percent-encoding', () => {
      const url = buildWhatsAppShareUrl({
        greeting: "Happy Birthday, Sarah! 🎂",
        giftLink: "https://www.starbucks.com/gift?amount=25",
        brandName: "Starbucks",
        amount: 25,
      });

      expect(url.startsWith('https://api.whatsapp.com/send?text=')).toBe(true);

      // Verify UTF-8 emoji encoding:
      // 🎂 (U+1F382) -> %F0%9F%8E%82
      expect(url).toContain('%F0%9F%8E%82');
      // 🎁 (U+1F381) -> %F0%9F%8E%81
      expect(url).toContain('%F0%9F%8E%81');
      // Newlines -> %0A
      expect(url).toContain('%0A');
    });

    it('should include sanitized phone parameter when phone is provided', () => {
      const url = buildWhatsAppShareUrl({
        greeting: "Happy Anniversary! 💍",
        giftLink: "https://www.amazon.com/gift-cards?amount=50",
        phone: "+1 (555) 987-6543",
      });

      expect(url).toContain('phone=15559876543');
      expect(url).toContain('&text=');
    });

    it('should omit phone parameter when phone is not provided', () => {
      const url = buildWhatsAppShareUrl({
        greeting: "Happy Birthday! 🎂",
      });

      expect(url).not.toContain('phone=');
      expect(url.startsWith('https://api.whatsapp.com/send?text=')).toBe(true);
    });
  });
});
