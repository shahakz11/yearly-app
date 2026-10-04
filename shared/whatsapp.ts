export interface WhatsAppShareOptions {
  greeting: string;
  giftLink?: string;
  brandName?: string;
  amount?: number;
  phone?: string;
}

/**
 * Normalizes a phone number to digits only (E.164 without leading plus).
 */
export function sanitizePhoneNumber(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Builds the full text message combining the greeting and optional gift link.
 */
export function buildWhatsAppTextMessage(options: {
  greeting: string;
  giftLink?: string;
  brandName?: string;
  amount?: number;
}): string {
  const greeting = (options.greeting || '').trim();
  const giftLink = options.giftLink?.trim();

  if (!giftLink) {
    return greeting;
  }

  let giftLine: string;
  if (options.brandName && options.amount) {
    giftLine = `🎁 ${options.brandName} Gift Card ($${options.amount}): ${giftLink}`;
  } else if (options.brandName) {
    giftLine = `🎁 ${options.brandName} Gift Card: ${giftLink}`;
  } else {
    giftLine = `🎁 Gift Link: ${giftLink}`;
  }

  return greeting ? `${greeting}\n\n${giftLine}` : giftLine;
}

/**
 * Builds a 1-tap WhatsApp share URL with complete UTF-8 percent-encoding.
 *
 * @param options Sharing options including greeting, giftLink, brandName, amount, and phone.
 * @returns Fully formatted WhatsApp deep-link URL (e.g. https://api.whatsapp.com/send?text=...)
 */
export function buildWhatsAppShareUrl(options: WhatsAppShareOptions): string {
  const message = buildWhatsAppTextMessage(options);
  const encodedText = encodeURIComponent(message);
  const cleanPhone = sanitizePhoneNumber(options.phone);

  const baseUrl = 'https://api.whatsapp.com/send';
  if (cleanPhone) {
    return `${baseUrl}?phone=${cleanPhone}&text=${encodedText}`;
  }
  return `${baseUrl}?text=${encodedText}`;
}
