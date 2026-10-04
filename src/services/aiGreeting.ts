export type GreetingTone = 'warm' | 'funny' | 'short' | 'celebratory';

export interface GenerateGreetingOptions {
  recipientName: string;
  eventType: 'birthday' | 'anniversary' | 'holiday' | 'custom';
  brandName?: string;
  amount?: number;
  tone?: GreetingTone;
}

const TEMPLATES: Record<GreetingTone, Record<string, string[]>> = {
  warm: {
    birthday: [
      "Happy Birthday, {name}! 🎂 Wishing you a day as wonderful and bright as you are. Enjoy this treat on me!",
      "Happy Birthday, {name}! So grateful for you. Hope your upcoming year is filled with joy, laughter, and great moments. Have a wonderful celebration!",
      "Wishing the happiest of birthdays to you, {name}! Treat yourself to something you love today—you deserve it!"
    ],
    anniversary: [
      "Happy Anniversary, {name}! ❤️ Wishing you both another year of endless love, shared laughter, and beautiful memories.",
      "Cheers to your anniversary, {name}! Celebrating the wonderful bond you share. Wishing you many more happy years ahead!"
    ],
    custom: [
      "Thinking of you and celebrating your special moment, {name}! Hope you have an incredible day!",
      "Wishing you the very best today, {name}! Enjoy every single second of your celebration."
    ]
  },
  funny: {
    birthday: [
      "Happy Birthday, {name}! 🎂 You're not getting older, you're just leveling up! Drinks and snacks are on me.",
      "Happy Birthday, {name}! Another year of being utterly fabulous. Please use this gift responsibly (or don't, I won't judge 😉)!",
      "Happy Birthday, {name}! I was going to bake you a cake, but I figured this would taste much better!"
    ],
    anniversary: [
      "Happy Anniversary, {name}! You two still tolerate each other—that calls for celebration! 🥂 Enjoy dinner on me!",
      "Happy Anniversary, {name}! Proof that true love (and extreme patience) really exists! Have a blast celebrating!"
    ],
    custom: [
      "Congratulations, {name}! Celebrating you today—have fun and don't do anything I wouldn't do!",
      "Cheers to you, {name}! Enjoy your special moment to the absolute fullest!"
    ]
  },
  short: {
    birthday: [
      "Happy Birthday, {name}! 🎂 Enjoy a treat on me today!",
      "Wishing you the best birthday yet, {name}! Have an awesome day!",
      "Happy Birthday, {name}! Hope you have a fantastic celebration!"
    ],
    anniversary: [
      "Happy Anniversary, {name}! Wishing you both a wonderful day! 🥂",
      "Happy Anniversary, {name}! Cheers to many more happy years together ❤️"
    ],
    custom: [
      "Happy celebration, {name}! Have an amazing day! 🎉",
      "Thinking of you and sending good vibes, {name}!"
    ]
  },
  celebratory: {
    birthday: [
      "HAPPY BIRTHDAY, {name}!! 🎉🎈 Let the celebrations begin! Treat yourself to something delicious today!",
      "Cheers to another fantastic trip around the sun, {name}! 🥂 Have the best birthday party!",
      "Time to celebrate, {name}! 🎂 Wishing you an unforgettable birthday filled with your favorite things!"
    ],
    anniversary: [
      "Pop the champagne! 🍾 Happy Anniversary, {name}! Wishing you a magical night of celebration!",
      "Raise a glass! 🥂 Happy Anniversary, {name}! Cheers to love and happiness!"
    ],
    custom: [
      "Huge congratulations and happy celebrations, {name}! 🎉 Enjoy your day!",
      "Time to celebrate you, {name}! Have an absolute blast!"
    ]
  }
};

/**
 * Generates a tailored greeting message.
 */
export function generateGreeting(options: GenerateGreetingOptions): string {
  const { recipientName, eventType, tone = 'warm' } = options;
  const toneMap = TEMPLATES[tone] || TEMPLATES.warm;
  const eventTemplates = toneMap[eventType] || toneMap.custom;

  const randomIndex = Math.floor(Math.random() * eventTemplates.length);
  let template = eventTemplates[randomIndex];

  template = template.replace(/{name}/g, recipientName || 'Friend');

  return template;
}

/**
 * Formats a message ready to be shared directly via WhatsApp or iMessage.
 */
export function formatShareableMessage(greeting: string, giftLink?: string): string {
  if (giftLink) {
    return `${greeting}\n\n🎁 Your gift: ${giftLink}`;
  }
  return greeting;
}
