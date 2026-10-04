import { GiftBrand } from '../types';

export const GIFT_BRANDS: GiftBrand[] = [
  {
    id: 'doordash',
    name: 'DoorDash',
    tagline: 'Dinner, treats or groceries delivered',
    category: 'food',
    primaryColor: '#FF3008',
    logoEmoji: '🍕',
    supportedAmounts: [15, 25, 50, 100],
    deepLinkScheme: 'doordash://giftcard',
    webFallbackUrl: 'https://www.doordash.com/gift-cards',
    popularChoices: ['Quick Lunch ($15)', 'Nice Dinner ($50)', 'Celebration Feast ($100)']
  },
  {
    id: 'starbucks',
    name: 'Starbucks',
    tagline: 'Coffee, matcha & morning pastries',
    category: 'coffee',
    primaryColor: '#006241',
    logoEmoji: '☕',
    supportedAmounts: [10, 15, 25, 50],
    deepLinkScheme: 'starbucks://gift',
    webFallbackUrl: 'https://www.starbucks.com/gift',
    popularChoices: ['Morning Latte ($10)', 'Coffee on me ($15)', 'Weekly Beans ($25)']
  },
  {
    id: 'amazon',
    name: 'Amazon',
    tagline: 'Millions of items with instant delivery',
    category: 'shopping',
    primaryColor: '#FF9900',
    logoEmoji: '📦',
    supportedAmounts: [25, 50, 75, 100],
    deepLinkScheme: 'amazon://egiftcard',
    webFallbackUrl: 'https://www.amazon.com/gift-cards',
    popularChoices: ['Pick something you love ($25)', 'Special treat ($50)', 'Dream cart ($100)']
  },
  {
    id: 'ubereats',
    name: 'Uber Eats',
    tagline: 'Local favorite eats & late-night treats',
    category: 'food',
    primaryColor: '#06C167',
    logoEmoji: '🍔',
    supportedAmounts: [15, 25, 50, 100],
    deepLinkScheme: 'ubereats://gift',
    webFallbackUrl: 'https://www.ubereats.com/gift-cards',
    popularChoices: ['Afternoon Snack ($15)', 'Takeout Dinner ($35)', 'Party Food ($75)']
  },
  {
    id: 'target',
    name: 'Target',
    tagline: 'Home decor, fashion, and everyday finds',
    category: 'shopping',
    primaryColor: '#CC0000',
    logoEmoji: '🎯',
    supportedAmounts: [25, 50, 75, 100],
    deepLinkScheme: 'target://giftcards',
    webFallbackUrl: 'https://www.target.com/c/target-giftcards/-/N-5xsxu',
    popularChoices: ['Target Run ($25)', 'Home Haul ($50)', 'Splurge ($100)']
  },
  {
    id: 'airbnb',
    name: 'Airbnb',
    tagline: 'Weekend getaways and memorable stays',
    category: 'experiences',
    primaryColor: '#FF5A5F',
    logoEmoji: '🏡',
    supportedAmounts: [50, 100, 150, 250],
    deepLinkScheme: 'airbnb://giftcards',
    webFallbackUrl: 'https://www.airbnb.com/giftcards',
    popularChoices: ['Getaway fund ($50)', 'Night away ($100)', 'Adventure ($250)']
  },
  {
    id: 'sephora',
    name: 'Sephora',
    tagline: 'Skincare, fragrance, and luxury cosmetics',
    category: 'shopping',
    primaryColor: '#000000',
    logoEmoji: '✨',
    supportedAmounts: [25, 50, 75, 100],
    deepLinkScheme: 'sephora://giftcard',
    webFallbackUrl: 'https://www.sephora.com/beauty/giftcards',
    popularChoices: ['Lip & Glow ($25)', 'Skincare Restock ($50)', 'Fragrance Pick ($100)']
  }
];
