import { buildPartnerCheckoutUrl } from '../deeplink';
import { GIFT_BRANDS } from '../../constants/giftBrands';

describe('Deep-link URL Builder', () => {
  const doordash = GIFT_BRANDS.find((b) => b.id === 'doordash')!;

  test('appends affiliate parameters and amount to checkout URL', () => {
    const url = buildPartnerCheckoutUrl({
      brand: doordash,
      amount: 50,
      recipientName: 'Maya',
      recipientEmail: 'maya@example.com',
      affiliateTag: 'partner-123'
    });

    expect(url).toContain('https://www.doordash.com/gift-cards');
    expect(url).toContain('amount=50');
    expect(url).toContain('recipient_name=Maya');
    expect(url).toContain('tag=partner-123');
  });

  test('uses default affiliate tag if none provided', () => {
    const url = buildPartnerCheckoutUrl({
      brand: doordash,
      amount: 25,
    });

    expect(url).toContain('tag=autogifter-20');
    expect(url).toContain('amount=25');
  });
});
