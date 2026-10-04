import catalogData from './catalog.json';

export interface FloristItem {
  id: string;
  name: string;
  price: number;
  description: string;
  dimensions?: string;
  thumbnailImage: string;
  detailImage: string;
  extraLargeImage?: string;
  detailUrl: string;
  cartUrl: string;
  category: string;
}

export interface GiftBrand {
  id: string;
  name: string;
  category: string;
  tagline: string;
  logoEmoji: string;
  primaryColor: string;
  supportedAmounts: number[];
  defaultAmount: number;
  affiliateUrlTemplate: string;
  cartUrl?: string;
  thumbnailImage?: string;
  detailImage?: string;
  description?: string;
  price?: number;
}

export const FLORIST_ONE_AFFILIATE_ID = '2026097209';
export const DEFAULT_AFFILIATE_ID = 'autogifter-20';
export const STANDARD_AMOUNTS = [15, 25, 50, 100];

export const LEGACY_BRANDS: GiftBrand[] = [
  {
    id: 'starbucks',
    name: 'Starbucks',
    category: 'Coffee & Treats',
    tagline: 'Treat them to their favorite coffee or pastry',
    logoEmoji: '☕',
    primaryColor: '#006241',
    supportedAmounts: [15, 25, 50, 100],
    defaultAmount: 25,
    affiliateUrlTemplate: 'https://www.starbucks.com/gift?amount={amount}&subId={subId}&tag={affiliateId}&recipient={recipientName}'
  },
  {
    id: 'doordash',
    name: 'DoorDash',
    category: 'Food Delivery',
    tagline: 'Dinner on you from thousands of local restaurants',
    logoEmoji: '🍔',
    primaryColor: '#FF3008',
    supportedAmounts: [15, 25, 50, 100],
    defaultAmount: 25,
    affiliateUrlTemplate: 'https://www.doordash.com/gift-cards?amount={amount}&subId={subId}&tag={affiliateId}&recipient={recipientName}'
  },
  {
    id: 'amazon',
    name: 'Amazon',
    category: 'Everything',
    tagline: 'Millions of items delivered right to their door',
    logoEmoji: '📦',
    primaryColor: '#FF9900',
    supportedAmounts: [15, 25, 50, 100],
    defaultAmount: 50,
    affiliateUrlTemplate: 'https://www.amazon.com/gift-cards?amount={amount}&subId={subId}&tag={affiliateId}&recipient={recipientName}'
  },
  {
    id: 'target',
    name: 'Target',
    category: 'Retail & Home',
    tagline: 'Expect more. Pay less. Perfect for any celebration',
    logoEmoji: '🎯',
    primaryColor: '#CC0000',
    supportedAmounts: [15, 25, 50, 100],
    defaultAmount: 25,
    affiliateUrlTemplate: 'https://www.target.com/gift-cards?amount={amount}&subId={subId}&tag={affiliateId}&recipient={recipientName}'
  }
];

/**
 * Returns FloristOne products for a specific occasion or general bestsellers.
 */
export function getBestsellers(occasion: string = 'birthday', limit: number = 5): FloristItem[] {
  const data = catalogData as Record<string, FloristItem[]>;
  const normalized = (occasion || 'birthday').toLowerCase().trim();
  const list = data[normalized] || data['birthday'] || data['top_overall'] || [];
  return list.slice(0, limit);
}

/**
 * Returns the entire catalog structure grouped by occasion.
 */
export function getFullCatalog(): Record<string, FloristItem[]> {
  return catalogData as Record<string, FloristItem[]>;
}

/**
 * Returns the catalog of brands and products.
 */
export function getCatalog(occasion?: string): GiftBrand[] {
  if (!occasion) {
    return LEGACY_BRANDS;
  }

  const bestsellers = getBestsellers(occasion, 5);
  const floristBrands: GiftBrand[] = bestsellers.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category || 'Flowers',
    tagline: item.description.slice(0, 50) + '...',
    logoEmoji: '💐',
    primaryColor: '#E11D48',
    supportedAmounts: [item.price],
    defaultAmount: item.price,
    affiliateUrlTemplate: item.cartUrl,
    cartUrl: item.cartUrl,
    thumbnailImage: item.thumbnailImage,
    detailImage: item.detailImage,
    description: item.description,
    price: item.price
  }));

  return [...LEGACY_BRANDS, ...floristBrands];
}

/**
 * Lookup a brand or florist item by ID.
 */
export function getBrand(brandId: string): GiftBrand | undefined {
  if (!brandId) return undefined;
  const lower = brandId.toLowerCase().trim();
  const brand = LEGACY_BRANDS.find((b) => b.id === lower || b.name.toLowerCase() === lower);
  if (brand) return brand;

  // Search Florist items across categories
  const full = getFullCatalog();
  for (const occasion in full) {
    const found = full[occasion].find((item) => item.id.toLowerCase() === lower);
    if (found) {
      return {
        id: found.id,
        name: found.name,
        category: found.category || 'Flowers',
        tagline: found.description.slice(0, 50) + '...',
        logoEmoji: '💐',
        primaryColor: '#E11D48',
        supportedAmounts: [found.price],
        defaultAmount: found.price,
        affiliateUrlTemplate: found.cartUrl,
        cartUrl: found.cartUrl,
        thumbnailImage: found.thumbnailImage,
        detailImage: found.detailImage,
        description: found.description,
        price: found.price
      };
    }
  }
  return undefined;
}

export interface DescriptionAuthorship {
  hasUserNotes: boolean;
  hasAutoGifterSection: boolean;
  userNotes: string;
  isPureAutoGifter: boolean;
  isPureUser: boolean;
  isHybrid: boolean;
}

/**
 * Clean existing notes to remove previous Auto-Gifter / Gift Card / FloristOne blocks.
 * Safely preserves user notes placed before, after, or around the Auto-Gifter block.
 */
export function cleanExistingNotes(existingNotes?: string): string {
  if (!existingNotes) return '';
  let notes = existingNotes;

  // 1. Check if structured HTML comment delimiters are present
  const tagBlockRegex = /<!--\s*autogifter:start\s*-->[\s\S]*?<!--\s*autogifter:end\s*-->/gi;
  if (tagBlockRegex.test(notes)) {
    notes = notes.replace(tagBlockRegex, '');
    // Clean up redundant blank lines left after removing the block
    return notes.replace(/\n{3,}/g, '\n\n').trim();
  }

  // 2. Legacy fallback: slice at the first occurrence of known Auto-Gifter markers
  const patterns = [
    '<!-- autogifter:start -->',
    '🌸 FloristOne Flower Delivery',
    'Top 5 hand-delivered flower bouquets',
    'http://www.floristone.com',
    'https://www.floristone.com',
    'floristone.com/index.cfm',
    'floristone.com/cart.cfm',
    'floristone.com/detail.cfm',
    'Or Gift Card Brands:',
    '🔔 Reminder',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '____________________',
    '--------------------'
  ];

  for (let i = 0; i < patterns.length; i++) {
    const idx = notes.toLowerCase().indexOf(patterns[i].toLowerCase());
    if (idx !== -1) {
      notes = notes.slice(0, idx);
    }
  }

  return notes.replace(/[-_━─\s]+$/, '').trim();
}

/**
 * Formats a rich, readable event description containing the Top 5 FloristOne bestsellers,
 * images, direct 1-click cart links, and HTML clickable hyperlinks.
 * Wraps the Auto-Gifter generated payload in HTML comment delimiters for reliable isolation.
 */
export function buildEnrichedEventDescription(options: {
  recipientName?: string;
  celebrationType?: string;
  occasionCategory?: string;
  existingNotes?: string;
  reminders?: number[];
  affiliateId?: string;
}): string {
  const recipient = options.recipientName || 'Friend';
  const celebrationType = options.celebrationType || 'birthday';
  const occasion = options.occasionCategory || celebrationType;
  const bestsellers = getBestsellers(occasion, 5);

  const cleanedNotes = cleanExistingNotes(options.existingNotes);

  const giftLines: string[] = [];
  giftLines.push('<!-- autogifter:start -->');
  giftLines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  giftLines.push(`🌸 FloristOne Flower Delivery for ${recipient} 🌸`);
  giftLines.push(`Top 5 hand-delivered flower bouquets:\n`);

  bestsellers.forEach((item, index) => {
    const httpsCartUrl = item.cartUrl.replace(/^http:\/\//i, 'https://');
    const orderText = `Order ${item.name} ($${item.price.toFixed(2)}) at FloristOne`;

    giftLines.push(`${index + 1}. <a href="${httpsCartUrl}">💐 ${orderText}</a>`);
  });

  const aff = options.affiliateId || FLORIST_ONE_AFFILIATE_ID;
  const browseUrl = `https://www.floristone.com/index.cfm?source_id=aff&affiliateid=${encodeURIComponent(aff)}`;
  giftLines.push(`\n🎁 <a href="${browseUrl}">Browse all other flowers, bouquets & gifts on FloristOne</a>`);
  giftLines.push('<!-- autogifter:end -->');

  const giftBlock = giftLines.join('\n');

  if (cleanedNotes.length > 0) {
    return `${cleanedNotes}\n\n${giftBlock}`;
  }

  return giftBlock;
}

/**
 * Identifies whether an event description was authored by Auto-Gifter, the user, or both.
 */
export function inspectEventDescription(description?: string): DescriptionAuthorship {
  if (!description || !description.trim()) {
    return {
      hasUserNotes: false,
      hasAutoGifterSection: false,
      userNotes: '',
      isPureAutoGifter: false,
      isPureUser: false,
      isHybrid: false
    };
  }

  const userNotes = cleanExistingNotes(description);
  const hasUserNotes = userNotes.length > 0;
  const hasAutoGifterSection = /<!--\s*autogifter:start\s*-->/i.test(description) ||
    /🌸\s*FloristOne\s*Flower\s*Delivery/i.test(description) ||
    /floristone\.com/i.test(description);

  return {
    hasUserNotes,
    hasAutoGifterSection,
    userNotes,
    isPureAutoGifter: hasAutoGifterSection && !hasUserNotes,
    isPureUser: hasUserNotes && !hasAutoGifterSection,
    isHybrid: hasUserNotes && hasAutoGifterSection
  };
}

/**
 * Builds a direct cart URL for FloristOne product codes or gift card affiliate URL for brands.
 */
export function buildGiftUrl(
  brandIdOrCode: string,
  amount?: number,
  subId?: string,
  recipientName?: string,
  affiliateId?: string
): string {
  if (!brandIdOrCode) return '';
  const idLower = brandIdOrCode.toLowerCase().trim();
  const brand = LEGACY_BRANDS.find((b) => b.id === idLower);

  if (brand) {
    const amt = amount || brand.defaultAmount;
    const sub = subId || 'direct';
    const aff = affiliateId || DEFAULT_AFFILIATE_ID;
    let url = brand.affiliateUrlTemplate
      .replace('{amount}', String(amt))
      .replace('{subId}', encodeURIComponent(sub))
      .replace('{affiliateId}', encodeURIComponent(aff));

    if (recipientName && recipientName.trim()) {
      url = url.replace('{recipientName}', encodeURIComponent(recipientName.trim()));
    } else {
      url = url.replace('&recipient={recipientName}', '').replace('?recipient={recipientName}&', '?');
    }
    return url;
  }

  // Check if it's a FloristOne item ID or code
  const code = brandIdOrCode.trim();
  const isFloristCode = /^[BC]\d+/i.test(code);
  const isKnownOccasionItem = !!getBrand(code);

  if (isFloristCode || isKnownOccasionItem) {
    const aff = affiliateId || FLORIST_ONE_AFFILIATE_ID;
    return `http://www.floristone.com/cart.cfm?dcode=${encodeURIComponent(code)}&source_id=aff&affiliateid=${encodeURIComponent(aff)}`;
  }

  return '';
}
