import { GiftBrand } from '../types';

export interface DeepLinkOptions {
  brand: GiftBrand;
  amount: number;
  recipientName?: string;
  recipientEmail?: string;
  affiliateTag?: string;
}

/**
 * Builds the external checkout URL or deep link scheme with tracking & amount parameters.
 */
export function buildPartnerCheckoutUrl(options: DeepLinkOptions): string {
  const { brand, amount, recipientName, recipientEmail, affiliateTag = 'autogifter-20' } = options;

  try {
    const url = new URL(brand.webFallbackUrl);
    url.searchParams.set('tag', affiliateTag);
    url.searchParams.set('ref', 'autogifter');

    if (amount > 0) {
      url.searchParams.set('amount', amount.toString());
    }

    if (recipientName) {
      url.searchParams.set('recipient_name', recipientName);
    }

    if (recipientEmail) {
      url.searchParams.set('recipient_email', recipientEmail);
    }

    return url.toString();
  } catch {
    // Fallback if URL parsing fails
    return `${brand.webFallbackUrl}?tag=${affiliateTag}&amount=${amount}`;
  }
}
