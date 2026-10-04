import { CelebrationType } from './classifier';

export type RelationshipType = 'friend' | 'partner' | 'family' | 'colleague' | 'general';
export type GreetingTone = 'warm' | 'fun' | 'formal';

export interface GenerateGreetingOptions {
  recipientName?: string | null;
  celebrationType: CelebrationType;
  relationshipType?: RelationshipType;
  tone?: GreetingTone;
}

const GREETING_TEMPLATES: Record<
  CelebrationType,
  Record<RelationshipType, Record<GreetingTone, string>>
> = {
  birthday: {
    friend: {
      warm: "Happy Birthday{nameClause}! 🎂 Wishing you a year ahead filled with joy, laughter, and wonderful adventures. Enjoy this treat on me!",
      fun: "Happy Birthday{nameClause}! 🎂 You're not getting older, you're just leveling up! Hope you have an awesome celebration today!",
      formal: "Happy Birthday{nameClause}. 🎂 Wishing you a wonderful day of celebration and continued happiness in the coming year.",
    },
    partner: {
      warm: "Happy Birthday to my favorite person{nameClause}! ❤️ Wishing you the most magical day. I'm so grateful for you every single day.",
      fun: "Happy Birthday{nameClause}! ❤️ Another year hotter, wiser, and still stuck with me! Let's celebrate in style today.",
      formal: "Happy Birthday{nameClause}. ❤️ Wishing you all the love, happiness, and peace in the world on your special day.",
    },
    family: {
      warm: "Happy Birthday{nameClause}! 🎂 So blessed to have you in our family. Wishing you good health, endless smiles, and a fantastic year ahead!",
      fun: "Happy Birthday{nameClause}! 🎉 May your day be filled with lots of cake and wonderful moments! Have a blast!",
      formal: "Warmest birthday wishes{nameClause}. 🎂 May the year ahead bring you good health, prosperity, and joy.",
    },
    colleague: {
      warm: "Happy Birthday{nameClause}! 🎂 Hope you take some well-deserved time to celebrate and relax today!",
      fun: "Happy Birthday{nameClause}! ☕ May your coffee be strong, your meetings few, and your day awesome! Enjoy your celebration!",
      formal: "Happy Birthday{nameClause}. Wishing you a wonderful celebration and continued success in the year ahead.",
    },
    general: {
      warm: "Happy Birthday{nameClause}! 🎂 Wishing you a wonderful celebration and a fantastic year ahead filled with happiness!",
      fun: "Happy Birthday{nameClause}! 🎉 Hope your day is as awesome and sweet as you are! Enjoy every moment!",
      formal: "Happy Birthday{nameClause}. Wishing you a pleasant day of celebration and great success in the year ahead.",
    },
  },
  anniversary: {
    friend: {
      warm: "Happy Anniversary{nameClause}! 💍 Wishing you both endless love, laughter, and many more beautiful years together!",
      fun: "Happy Anniversary{nameClause}! 🥂 You two still make marriage look easy and fun! Enjoy a special date night on me!",
      formal: "Congratulations on your anniversary{nameClause}. Wishing you both continued happiness and harmony.",
    },
    partner: {
      warm: "Happy Anniversary, my love{nameClause}! ❤️ Thank you for another incredible year together. Here's to us and our journey ahead!",
      fun: "Happy Anniversary{nameClause}! 🥂 Another year down, and you still haven't gotten tired of me! Love you to pieces!",
      formal: "Happy Anniversary{nameClause}. ❤️ Grateful for our shared life and looking forward to many more fulfilling years together.",
    },
    family: {
      warm: "Happy Anniversary{nameClause}! 💒 So inspiring to see your love grow stronger with each passing year. Wishing you both pure joy!",
      fun: "Happy Anniversary{nameClause}! 🎉 Cheers to the couple that keeps our family laughing and smiling. Have a wonderful celebration!",
      formal: "Congratulations on your anniversary{nameClause}. May your commitment to each other continue to be blessed with joy and prosperity.",
    },
    colleague: {
      warm: "Happy Anniversary{nameClause}! 🥂 Wishing you and your partner a wonderful evening celebrating your milestone!",
      fun: "Happy Anniversary{nameClause}! 🥂 Take the night off, forget about work, and celebrate your special day!",
      formal: "Congratulations on your wedding anniversary{nameClause}. Wishing you and your spouse continued happiness.",
    },
    general: {
      warm: "Happy Anniversary{nameClause}! 💍 Sending warmest wishes for continued joy, love, and togetherness!",
      fun: "Happy Anniversary{nameClause}! 🥂 Cheers to another milestone worth celebrating in style!",
      formal: "Congratulations on your anniversary{nameClause}. Wishing you continued success and happiness.",
    },
  },
  valentines: {
    friend: {
      warm: "Happy Valentine's Day{nameClause}! 💖 Sending you sweetest thoughts and lots of love today!",
      fun: "Happy Valentine's Day{nameClause}! 🌹 Hope you get all the chocolate and treats!",
      formal: "Wishing you a wonderful Valentine's Day{nameClause}."
    },
    partner: {
      warm: "Happy Valentine's Day, my love{nameClause}! 💖 You mean everything to me.",
      fun: "Happy Valentine's Day{nameClause}! 🌹 So lucky to have you by my side!",
      formal: "Wishing you a romantic and memorable Valentine's Day{nameClause}."
    },
    family: {
      warm: "Happy Valentine's Day{nameClause}! 💖 Sending big hugs and love to the whole family!",
      fun: "Happy Valentine's Day{nameClause}! 🍫 Enjoy all the sweets today!",
      formal: "Warmest Valentine's Day wishes to you{nameClause}."
    },
    colleague: {
      warm: "Happy Valentine's Day{nameClause}! 🌸 Hope you have a wonderful and relaxing day.",
      fun: "Happy Valentine's Day{nameClause}! ☕ Hope you have a great day!",
      formal: "Best wishes on Valentine's Day{nameClause}."
    },
    general: {
      warm: "Happy Valentine's Day{nameClause}! 💖 Wishing you a wonderful day filled with joy and sweetness!",
      fun: "Happy Valentine's Day{nameClause}! 🌹 Enjoy the celebration today!",
      formal: "Wishing you a pleasant and joyful Valentine's Day{nameClause}."
    }
  },
  mothers_day: {
    friend: {
      warm: "Happy Mother's Day{nameClause}! 💐 Thank you for being such an inspiring mom!",
      fun: "Happy Mother's Day{nameClause}! 🌸 Enjoy your well-deserved relaxation today!",
      formal: "Wishing you a very Happy Mother's Day{nameClause}."
    },
    partner: {
      warm: "Happy Mother's Day, my love{nameClause}! 💐 You are the most incredible mother.",
      fun: "Happy Mother's Day{nameClause}! 👑 Kick back and let us take care of everything today!",
      formal: "Wishing you a deeply rewarding and joyful Mother's Day{nameClause}."
    },
    family: {
      warm: "Happy Mother's Day{nameClause}! 💐 Thank you for your boundless love and care!",
      fun: "Happy Mother's Day{nameClause}! 🌸 Have the most wonderful day!",
      formal: "Warmest wishes on Mother's Day{nameClause}."
    },
    colleague: {
      warm: "Happy Mother's Day{nameClause}! 💐 Hope you have a lovely weekend celebration.",
      fun: "Happy Mother's Day{nameClause}! ☕ Enjoy your special day!",
      formal: "Wishing you a restful and Happy Mother's Day{nameClause}."
    },
    general: {
      warm: "Happy Mother's Day{nameClause}! 💐 Wishing you a day filled with love and appreciation!",
      fun: "Happy Mother's Day{nameClause}! 🌸 Have a fantastic celebration!",
      formal: "Wishing you a joyful and memorable Mother's Day{nameClause}."
    }
  },
  fathers_day: {
    friend: {
      warm: "Happy Father's Day{nameClause}! 👔 Hope you have a fantastic day with the family!",
      fun: "Happy Father's Day{nameClause}! 👑 Time to relax and enjoy the game!",
      formal: "Wishing you a very Happy Father's Day{nameClause}."
    },
    partner: {
      warm: "Happy Father's Day, my love{nameClause}! 👔 Thank you for being such an amazing father.",
      fun: "Happy Father's Day{nameClause}! 👑 Enjoy your day to the absolute fullest!",
      formal: "Wishing you a wonderful and fulfilling Father's Day{nameClause}."
    },
    family: {
      warm: "Happy Father's Day{nameClause}! 👔 Thanks for always being there for all of us!",
      fun: "Happy Father's Day{nameClause}! 🍔 Hope you get to grill and chill today!",
      formal: "Warmest Father's Day wishes{nameClause}."
    },
    colleague: {
      warm: "Happy Father's Day{nameClause}! 👔 Hope you have a great celebration this weekend.",
      fun: "Happy Father's Day{nameClause}! ☕ Enjoy your time off with family!",
      formal: "Wishing you a relaxing Father's Day{nameClause}."
    },
    general: {
      warm: "Happy Father's Day{nameClause}! 👔 Wishing you a wonderful celebration!",
      fun: "Happy Father's Day{nameClause}! 👑 Have a great day!",
      formal: "Wishing you a pleasant and joyful Father's Day{nameClause}."
    }
  },
  thanksgiving: {
    friend: {
      warm: "Happy Thanksgiving{nameClause}! 🦃 Grateful for our friendship and wishing you a warm holiday!",
      fun: "Happy Turkey Day{nameClause}! 🍂 Hope you eat lots of good food and dessert!",
      formal: "Wishing you and your family a joyous Thanksgiving{nameClause}."
    },
    partner: {
      warm: "Happy Thanksgiving, my love{nameClause}! 🦃 Grateful for you every single day.",
      fun: "Happy Thanksgiving{nameClause}! 🍂 Ready to feast together!",
      formal: "Wishing you a meaningful and blessed Thanksgiving{nameClause}."
    },
    family: {
      warm: "Happy Thanksgiving{nameClause}! 🦃 So thankful for our wonderful family and shared memories!",
      fun: "Happy Turkey Day{nameClause}! 🍽️ Save room for pie!",
      formal: "Warmest Thanksgiving greetings to you and your loved ones{nameClause}."
    },
    colleague: {
      warm: "Happy Thanksgiving{nameClause}! 🦃 Wishing you a restful and joyful holiday with family.",
      fun: "Happy Thanksgiving{nameClause}! 🍂 Enjoy the well-deserved break!",
      formal: "Wishing you a peaceful and happy Thanksgiving holiday{nameClause}."
    },
    general: {
      warm: "Happy Thanksgiving{nameClause}! 🦃 Wishing you a warm, harvest-filled holiday!",
      fun: "Happy Thanksgiving{nameClause}! 🍽️ Hope your day is filled with good food and laughs!",
      formal: "Wishing you a blessed and joyous Thanksgiving{nameClause}."
    }
  },
  christmas: {
    friend: {
      warm: "Merry Christmas{nameClause}! 🎄 Wishing you peace, joy, and wonderful holiday memories!",
      fun: "Merry Christmas{nameClause}! 🎅 Hope Santa brings you everything on your wishlist!",
      formal: "Wishing you a joyous Christmas season and a prosperous New Year{nameClause}."
    },
    partner: {
      warm: "Merry Christmas, my love{nameClause}! 🎄 Best part of the holidays is sharing them with you.",
      fun: "Merry Christmas{nameClause}! 🎅 Time for cozy vibes and holiday treats!",
      formal: "Wishing you a joyous and peaceful Christmas{nameClause}."
    },
    family: {
      warm: "Merry Christmas{nameClause}! 🎄 So grateful for our family and holiday traditions!",
      fun: "Merry Christmas{nameClause}! 🎁 Let the festive fun begin!",
      formal: "Warmest holiday greetings and best wishes for Christmas{nameClause}."
    },
    colleague: {
      warm: "Merry Christmas{nameClause}! 🎄 Wishing you and your family a restful holiday season.",
      fun: "Merry Christmas{nameClause}! ☕ Enjoy the holiday time off!",
      formal: "Season's greetings and warmest wishes for a Merry Christmas{nameClause}."
    },
    general: {
      warm: "Merry Christmas{nameClause}! 🎄 May your holidays be bright and joyful!",
      fun: "Merry Christmas & Happy Holidays{nameClause}! 🎅 Have a blast!",
      formal: "Wishing you a peaceful Christmas and a Happy New Year{nameClause}."
    }
  },
  easter: {
    friend: {
      warm: "Happy Easter{nameClause}! 🐰 Wishing you a bright, sunny spring and joyful celebration!",
      fun: "Happy Easter{nameClause}! 🐣 Hope you find plenty of chocolate eggs today!",
      formal: "Wishing you and your loved ones a blessed Easter{nameClause}."
    },
    partner: {
      warm: "Happy Easter, my love{nameClause}! 🐰 Wishing you a beautiful spring day together.",
      fun: "Happy Easter{nameClause}! 🐣 Let's enjoy the sunshine and sweet treats!",
      formal: "Wishing you a peaceful and uplifting Easter{nameClause}."
    },
    family: {
      warm: "Happy Easter{nameClause}! 🐰 Sending lots of love to the whole family this spring!",
      fun: "Happy Easter{nameClause}! 🥚 Have a wonderful celebration and egg hunt!",
      formal: "Warmest Easter blessings to you and your family{nameClause}."
    },
    colleague: {
      warm: "Happy Easter{nameClause}! 🐰 Wishing you a relaxing spring holiday.",
      fun: "Happy Easter{nameClause}! 🐣 Enjoy the long weekend!",
      formal: "Wishing you a pleasant and restful Easter holiday{nameClause}."
    },
    general: {
      warm: "Happy Easter{nameClause}! 🐰 Wishing you renewal, joy, and hope this season!",
      fun: "Happy Easter{nameClause}! 🐣 Hope you have a sunny and sweet day!",
      formal: "Wishing you a blessed and joyful Easter{nameClause}."
    }
  },
  halloween: {
    friend: {
      warm: "Happy Halloween{nameClause}! 🎃 Hope your night is full of treats and festive fun!",
      fun: "Happy Halloween{nameClause}! 👻 Spooky season is here, enjoy the frights!",
      formal: "Wishing you a fun and safe Halloween celebration{nameClause}."
    },
    partner: {
      warm: "Happy Halloween, my love{nameClause}! 🎃 Ready for scary movies and sweets!",
      fun: "Happy Halloween{nameClause}! 👻 You're my favorite treat!",
      formal: "Wishing you an enjoyable Halloween celebration{nameClause}."
    },
    family: {
      warm: "Happy Halloween{nameClause}! 🎃 Have a blast trick-or-treating with the family!",
      fun: "Happy Halloween{nameClause}! 🍬 Save some candy for us!",
      formal: "Wishing you a fun and festive Halloween{nameClause}."
    },
    colleague: {
      warm: "Happy Halloween{nameClause}! 🎃 Hope you have a great evening.",
      fun: "Happy Halloween{nameClause}! 👻 Don't let the ghosts get you!",
      formal: "Wishing you a pleasant Halloween{nameClause}."
    },
    general: {
      warm: "Happy Halloween{nameClause}! 🎃 Wishing you lots of fun and delicious treats!",
      fun: "Spooky season is here! 👻 Happy Halloween{nameClause}!",
      formal: "Wishing you a safe and entertaining Halloween{nameClause}."
    }
  },
  independence_day: {
    friend: {
      warm: "Happy 4th of July{nameClause}! 🎆 Wishing you a fantastic celebration and fireworks!",
      fun: "Happy 4th of July{nameClause}! 🇺🇸 Burgers, fireworks, and good times ahead!",
      formal: "Wishing you a proud and celebratory Independence Day{nameClause}."
    },
    partner: {
      warm: "Happy 4th of July, my love{nameClause}! 🎆 Let's watch the fireworks together!",
      fun: "Happy 4th of July{nameClause}! 🇺🇸 Ready for a great summer celebration!",
      formal: "Wishing you a wonderful Independence Day{nameClause}."
    },
    family: {
      warm: "Happy 4th of July{nameClause}! 🎆 Have a wonderful time with family and friends!",
      fun: "Happy 4th of July{nameClause}! 🍔 Enjoy the barbecue and fireworks!",
      formal: "Warmest Independence Day greetings to you and your family{nameClause}."
    },
    colleague: {
      warm: "Happy 4th of July{nameClause}! 🎆 Enjoy the summer holiday!",
      fun: "Happy 4th of July{nameClause}! 🇺🇸 Have a great long weekend!",
      formal: "Wishing you a safe and pleasant Independence Day holiday{nameClause}."
    },
    general: {
      warm: "Happy 4th of July{nameClause}! 🎆 Wishing you a joyful and safe holiday!",
      fun: "Happy 4th of July{nameClause}! 🇺🇸 Enjoy the celebrations and fireworks!",
      formal: "Wishing you a celebratory and peaceful Independence Day{nameClause}."
    }
  },
  new_year: {
    friend: {
      warm: "Happy New Year{nameClause}! 🥂 Wishing you health, happiness, and prosperity!",
      fun: "Happy New Year{nameClause}! 🎉 Let's make this upcoming year the most epic one yet!",
      formal: "Wishing you a successful and rewarding New Year{nameClause}."
    },
    partner: {
      warm: "Happy New Year, my love{nameClause}! 🥂 Here's to another amazing year together.",
      fun: "Happy New Year{nameClause}! 🍾 Ready to celebrate big tonight!",
      formal: "Wishing you a joyful and fulfilling New Year{nameClause}."
    },
    family: {
      warm: "Happy New Year{nameClause}! 🥂 Wishing our whole family blessings and health in the coming year!",
      fun: "Happy New Year{nameClause}! 🎉 Cheers to new memories together!",
      formal: "Warmest wishes for a peaceful and prosperous New Year{nameClause}."
    },
    colleague: {
      warm: "Happy New Year{nameClause}! 🥂 Looking forward to another great year working together.",
      fun: "Happy New Year{nameClause}! 🍾 Hope you have a wonderful celebration tonight!",
      formal: "Wishing you continued success and prosperity in the New Year{nameClause}."
    },
    general: {
      warm: "Happy New Year{nameClause}! 🥂 Wishing you joy, peace, and new adventures!",
      fun: "Happy New Year{nameClause}! 🎉 Cheers to fresh starts and big wins!",
      formal: "Wishing you a happy, healthy, and prosperous New Year{nameClause}."
    }
  },
  milestone: {
    friend: {
      warm: "Congratulations{nameClause}! 🎓 So proud of everything you have accomplished. You truly deserve this success!",
      fun: "Huge congrats{nameClause}! 🍾 You crushed it! Drinks and celebration are definitely in order!",
      formal: "Congratulations on your achievement{nameClause}. Wishing you continued success in all your future endeavors.",
    },
    partner: {
      warm: "Congratulations, my love{nameClause}! ✨ Seeing you reach this milestone makes me so proud of you. Celebrate big today!",
      fun: "You did it{nameClause}! 🍾 Nobody works harder or deserves this more. Now let's celebrate!",
      formal: "Congratulations on this remarkable milestone{nameClause}. I am immensely proud of your dedication and achievement.",
    },
    family: {
      warm: "Congratulations{nameClause}! 🌟 The whole family is so incredibly proud of you and your hard work!",
      fun: "Way to go{nameClause}! 🎉 Time to kick back, relax, and celebrate this huge win!",
      formal: "Congratulations on this significant accomplishment{nameClause}. We are all proud of your continued success.",
    },
    colleague: {
      warm: "Congratulations on this milestone{nameClause}! 👏 It's an absolute pleasure working with you and seeing your success!",
      fun: "Congrats{nameClause}! 🚀 Huge achievement! Hope you celebrate properly today!",
      formal: "Congratulations on your achievement{nameClause}. Wishing you continued growth and success in your career.",
    },
    general: {
      warm: "Congratulations{nameClause}! 🌟 Wishing you all the best as you celebrate this wonderful milestone!",
      fun: "Huge congratulations{nameClause}! 🍾 Celebrate this special victory to the fullest!",
      formal: "Congratulations on your milestone{nameClause}. Wishing you continued success in your future endeavors.",
    },
  },
  everyday: {
    friend: {
      warm: "Thinking of you{nameClause}! 🌸 Hope you are having a wonderful day!",
      fun: "Just dropping by to say hello{nameClause}! 🎉 Hope you have an awesome week!",
      formal: "Sending warm regards and best wishes{nameClause}."
    },
    partner: {
      warm: "Sending you love{nameClause}! ❤️ Hope your day is as wonderful as you are.",
      fun: "Thinking of you{nameClause}! ✨ Can't wait to see you later!",
      formal: "With warmest thoughts and affection{nameClause}."
    },
    family: {
      warm: "Thinking of you{nameClause}! 🌸 Sending love and hugs to everyone!",
      fun: "Hello to our favorite family member{nameClause}! 🎉 Hope all is great!",
      formal: "Warmest greetings and best wishes to you{nameClause}."
    },
    colleague: {
      warm: "Hope you have a productive and great day{nameClause}!",
      fun: "Hope you have a smooth and caffeine-powered day{nameClause}!",
      formal: "Best regards and wishing you a successful day{nameClause}."
    },
    general: {
      warm: "Thinking of you{nameClause}! 🌸 Wishing you joy and happiness today!",
      fun: "Sending good vibes your way{nameClause}! ✨",
      formal: "Warmest wishes to you{nameClause}."
    }
  }
};

/**
 * Generates a personalized greeting message parameterized by recipient, celebration type, relationship, and tone.
 */
export function generateGreeting(options: GenerateGreetingOptions): string {
  const celebrationType = options.celebrationType || 'birthday';
  const relationship = options.relationshipType || 'general';
  const tone = options.tone || 'warm';

  const typeTemplates = GREETING_TEMPLATES[celebrationType] || GREETING_TEMPLATES.birthday;
  const relationshipTemplates = typeTemplates[relationship] || typeTemplates.general;
  const template = relationshipTemplates[tone] || relationshipTemplates.warm;

  const rawName = options.recipientName?.trim();
  const nameClause = rawName ? `, ${rawName}` : '';

  return template.replace('{nameClause}', nameClause).trim();
}
