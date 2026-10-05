/**
 * Auto-Gifter Universal Core Engine Bundle
 * Dual-surface bundle for Google Apps Script, Chrome Extension, and Node.js.
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.AutoGifterCore = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : this, function () {
  "use strict";

  var FLORIST_ONE_AFFILIATE_ID = "2026097209";
  var DEFAULT_AFFILIATE_ID = "autogifter-20";
  var STANDARD_AMOUNTS = [15, 25, 50, 100];

  var LEGACY_BRANDS = [
    {
      id: "starbucks",
      name: "Starbucks",
      category: "Coffee & Treats",
      tagline: "Treat them to their favorite coffee or pastry",
      logoEmoji: "☕",
      primaryColor: "#006241",
      supportedAmounts: [15, 25, 50, 100],
      defaultAmount: 25,
      affiliateUrlTemplate: "https://www.starbucks.com/gift?amount={amount}&subId={subId}&tag={affiliateId}&recipient={recipientName}"
    },
    {
      id: "doordash",
      name: "DoorDash",
      category: "Food Delivery",
      tagline: "Dinner on you from thousands of local restaurants",
      logoEmoji: "🍔",
      primaryColor: "#FF3008",
      supportedAmounts: [15, 25, 50, 100],
      defaultAmount: 25,
      affiliateUrlTemplate: "https://www.doordash.com/gift-cards?amount={amount}&subId={subId}&tag={affiliateId}&recipient={recipientName}"
    },
    {
      id: "amazon",
      name: "Amazon",
      category: "Everything",
      tagline: "Millions of items delivered right to their door",
      logoEmoji: "📦",
      primaryColor: "#FF9900",
      supportedAmounts: [15, 25, 50, 100],
      defaultAmount: 50,
      affiliateUrlTemplate: "https://www.amazon.com/gift-cards?amount={amount}&subId={subId}&tag={affiliateId}&recipient={recipientName}"
    },
    {
      id: "target",
      name: "Target",
      category: "Retail & Home",
      tagline: "Expect more. Pay less. Perfect for any celebration",
      logoEmoji: "🎯",
      primaryColor: "#CC0000",
      supportedAmounts: [15, 25, 50, 100],
      defaultAmount: 25,
      affiliateUrlTemplate: "https://www.target.com/gift-cards?amount={amount}&subId={subId}&tag={affiliateId}&recipient={recipientName}"
    }
  ];

  var CATALOG_BY_OCCASION = {
  "birthday": [
    {
      "id": "B07",
      "name": "Best Day Bouquet",
      "price": 94.95,
      "description": "The Best Day Bouquet is ready to create a moment your recipient will always remember! An instant mood booster with it's mix of bright bold colors, this gorgeous fresh flower arrangement brings together sunflowers, hot pink roses, purple double lisianthus, orange LA Hybrid Lilies, yellow snapdragons, green button poms, and lush greens to make this day, their best day. Presented in a clear glass vase, this fresh flower arrangement is made just for you to help you send your warmest birthday, congratulations, or get well wishes to your favorite friends and family.",
      "dimensions": "15\"h x 12\"w",
      "thumbnailImage": "https://cdn.floristone.com/small/B07_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B07_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B07_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B07&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B07&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "B08",
      "name": "Pink Posh Bouquet",
      "price": 89.95,
      "description": "The Pink Posh Bouquet is chic and pink to help you celebrate life's most treasured moments in style! Hot pink roses are bright and beautiful arranged amongst pink Asiatic Lilies, pink stock, green button poms, bupleurum and lush greens to create that perfect gift of flowers. Presented in a clear glass vase, this blushing fresh flower arrangement is ready to send your sweetest wishes in honor of a birthday, an anniversary, or as a way to express your thanks and gratitude.",
      "dimensions": "16\"h x 13\"w",
      "thumbnailImage": "https://cdn.floristone.com/small/B08_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B08_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B08_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B08&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B08&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "B11",
      "name": "High Style Bouquet",
      "price": 99.95,
      "description": "The High Style Bouquet is on-trend and ready to wow your special recipient with it's mix of bold and beautiful blooms! Rich red roses, Stargazer Lilies, pink Peruvian Lilies, burgundy mini carnations, pink statice, and lush greens are arranged to perfection by our floral professionals to create a gift of flowers that is set to impress. Presented in a clear glass vase, this fresh flower bouquet is a wonderful way to express your happy anniversary, happy birthday, or thinking of you wishes.",
      "dimensions": "16\"h x 13\"w",
      "thumbnailImage": "https://cdn.floristone.com/small/B11_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B11_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B11_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B11&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B11&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "B19-4387",
      "name": "The True Romance Rose Bouquet",
      "price": 99.95,
      "description": "The True Romance Rose Bouquet is the perfect expression of love and passion. A bright burst of color, this bouquet combines red, pink and fuchsia roses, accented with beautiful greens and seated in a clear glass vase, to create a truly romantic representation of your love.",
      "dimensions": "15\"w x 22\"h",
      "thumbnailImage": "https://cdn.floristone.com/small/B19-4387_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B19-4387_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B19-4387_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B19-4387&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B19-4387&source_id=aff&affiliateid=2026097209",
      "category": "Roses"
    },
    {
      "id": "B2-4957",
      "name": "The Harvest Heartstrings Bouquet",
      "price": 89.95,
      "description": "The Harvest Heartstrings Bouquet brings sunlit autumn beauty straight to their door. Unforgettable mini sunflowers catch the eye at every turn surrounded by yellow Asiatic lilies, red dianthus, orange spray roses and lush greens to create a stunning fresh flower arrangement. Presented in a clear glass gathered square vase and accented throughout with red glycerized oak leaves, this flower bouquet is set to make an excellent birthday, thank you, get well or Thanksgiving gift.",
      "dimensions": "12\"w x 15\"h",
      "thumbnailImage": "https://cdn.floristone.com/small/B2-4957_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B2-4957_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B2-4957_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B2-4957&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B2-4957&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    }
  ],
  "anniversary": [
    {
      "id": "B08",
      "name": "Pink Posh Bouquet",
      "price": 89.95,
      "description": "The Pink Posh Bouquet is chic and pink to help you celebrate life's most treasured moments in style! Hot pink roses are bright and beautiful arranged amongst pink Asiatic Lilies, pink stock, green button poms, bupleurum and lush greens to create that perfect gift of flowers. Presented in a clear glass vase, this blushing fresh flower arrangement is ready to send your sweetest wishes in honor of a birthday, an anniversary, or as a way to express your thanks and gratitude.",
      "dimensions": "16\"h x 13\"w",
      "thumbnailImage": "https://cdn.floristone.com/small/B08_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B08_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B08_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B08&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B08&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "B11",
      "name": "High Style Bouquet",
      "price": 99.95,
      "description": "The High Style Bouquet is on-trend and ready to wow your special recipient with it's mix of bold and beautiful blooms! Rich red roses, Stargazer Lilies, pink Peruvian Lilies, burgundy mini carnations, pink statice, and lush greens are arranged to perfection by our floral professionals to create a gift of flowers that is set to impress. Presented in a clear glass vase, this fresh flower bouquet is a wonderful way to express your happy anniversary, happy birthday, or thinking of you wishes.",
      "dimensions": "16\"h x 13\"w",
      "thumbnailImage": "https://cdn.floristone.com/small/B11_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B11_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B11_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B11&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B11&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "B19-4387",
      "name": "The True Romance Rose Bouquet",
      "price": 99.95,
      "description": "The True Romance Rose Bouquet is the perfect expression of love and passion. A bright burst of color, this bouquet combines red, pink and fuchsia roses, accented with beautiful greens and seated in a clear glass vase, to create a truly romantic representation of your love.",
      "dimensions": "15\"w x 22\"h",
      "thumbnailImage": "https://cdn.floristone.com/small/B19-4387_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B19-4387_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B19-4387_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B19-4387&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B19-4387&source_id=aff&affiliateid=2026097209",
      "category": "Roses"
    },
    {
      "id": "B2-4957",
      "name": "The Harvest Heartstrings Bouquet",
      "price": 89.95,
      "description": "The Harvest Heartstrings Bouquet brings sunlit autumn beauty straight to their door. Unforgettable mini sunflowers catch the eye at every turn surrounded by yellow Asiatic lilies, red dianthus, orange spray roses and lush greens to create a stunning fresh flower arrangement. Presented in a clear glass gathered square vase and accented throughout with red glycerized oak leaves, this flower bouquet is set to make an excellent birthday, thank you, get well or Thanksgiving gift.",
      "dimensions": "12\"w x 15\"h",
      "thumbnailImage": "https://cdn.floristone.com/small/B2-4957_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B2-4957_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B2-4957_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B2-4957&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B2-4957&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "B2-5123",
      "name": "The Vibrant Views Bouquet",
      "price": 89.95,
      "description": "Blooming with a vibrant light that can't be denied, this brilliant fall flower bouquet is ready to lift any mood and raise any spirit throughout the autumn months ahead. Swirling orange roses, orange spray roses, and star-shaped peach Asiatic Lilies are surrounded with the eye-catching textures of yellow solidago, bittersweet stems, aralia leaves and lush greens with brilliant yellow gourd accents tucked in a just the right spot, all beautifully arranged in an orange ceramic cylinder vase. A wonderful fall birthday, get well, thank you, or happy harvest gift!",
      "dimensions": "11\"w x 11\"h",
      "thumbnailImage": "https://cdn.floristone.com/small/B2-5123_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B2-5123_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B2-5123_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B2-5123&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B2-5123&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    }
  ],
  "love": [
    {
      "id": "B19-4387",
      "name": "The True Romance Rose Bouquet",
      "price": 99.95,
      "description": "The True Romance Rose Bouquet is the perfect expression of love and passion. A bright burst of color, this bouquet combines red, pink and fuchsia roses, accented with beautiful greens and seated in a clear glass vase, to create a truly romantic representation of your love.",
      "dimensions": "15\"w x 22\"h",
      "thumbnailImage": "https://cdn.floristone.com/small/B19-4387_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B19-4387_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B19-4387_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B19-4387&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B19-4387&source_id=aff&affiliateid=2026097209",
      "category": "Roses"
    },
    {
      "id": "B20-4970",
      "name": "The Tranquil Bouquet",
      "price": 89.95,
      "description": "This bouquet blooms with a sweet sophistication and style to bring a calming grace to any event or occasion. Hot pink and pink roses are brought together with purple, lavender and fuchsia stock stems accented with pink Peruvian lilies and lush greens to create a simply stunning flower arrangement. Presented in a clear glass bubble bowl vase, this exquisite fresh flower bouquet will make an excellent birthday, anniversary or sympathy gift.",
      "dimensions": "12\"H x 12\"W",
      "thumbnailImage": "https://cdn.floristone.com/small/B20-4970_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B20-4970_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B20-4970_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B20-4970&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B20-4970&source_id=aff&affiliateid=2026097209",
      "category": "Centerpieces"
    },
    {
      "id": "B21-4968",
      "name": "The Bright Lights Bouquet",
      "price": 89.95,
      "description": "The Bright Lights Bouquet brings color and beauty straight to your special recipient's door! Yellow Asiatic lilies, pink roses, purple stock, lavender monte casino asters, pink carnations, pink mini carnations and lush greens are brought together to create a sweetly fascinating flower arrangement. Presented in a square lavender pastel washed basket, this fresh flower bouquet is set to make an excellent birthday, thank you or get well gift.",
      "dimensions": "14\"w x 13\"h",
      "thumbnailImage": "https://cdn.floristone.com/small/B21-4968_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B21-4968_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B21-4968_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B21-4968&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B21-4968&source_id=aff&affiliateid=2026097209",
      "category": "Centerpieces"
    },
    {
      "id": "B21-5145",
      "name": "The Blushing Invitations Bouquet",
      "price": 89.95,
      "description": "Exuding a special charm, with a casual fresh-from-the-garden look, this gorgeous spring bouquet is the perfect way to delight your recipient in honor of any of life's most treasured moments. Peach gerbera daisies are soft and sophisticated surrounded by pink roses, pink snapdragons, pink mini carnations, purple liatris, and lush greens arranged with an artist's eye in a gathered square clear glass vase. A wonderful way to celebrate a spring birthday, Mother's Day, or to express your thanks and gratitude.",
      "dimensions": "7\"w x 16\"h",
      "thumbnailImage": "https://cdn.floristone.com/small/B21-5145_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B21-5145_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B21-5145_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B21-5145&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B21-5145&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "B22-5150",
      "name": "The Sweet Beginnings Bouquet",
      "price": 89.95,
      "description": "Bringing a blush to their cheeks with each soft, sweet bloom, this stunning spring flower bouquet is ready to surprise and delight your recipient. Clouds of white hydrangea blooms are the base of this arrangement, making the colors of the hot pink roses, pink gerbera daisies, and pink Peruvian Lilies pop against their clean, textured background. Accented with seeded eucalyptus and presented in a hot pink cylinder ceramic vase, this gorgeous flower bouquet is the perfect way to celebrate a birthday, the birth of a new baby girl, or a special anniversary.",
      "dimensions": "12\"w x 12\"h",
      "thumbnailImage": "https://cdn.floristone.com/small/B22-5150_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B22-5150_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B22-5150_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B22-5150&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B22-5150&source_id=aff&affiliateid=2026097209",
      "category": "Centerpieces"
    }
  ],
  "holiday": [
    {
      "id": "B10-4368",
      "name": "Celebration of the Season Centerpiece",
      "price": 109.95,
      "description": "The Celebration of the Season Centerpiece is a grand display of holiday elegance. Red roses and spray roses pop against a backdrop of assorted holiday greens and variegated holly that beautifully encircle three red taper candles. Accented with gold pinecones and gold metallic brocade ribbon this centerpiece creates a warm and enchanting glow to benefit their holiday festivities.",
      "dimensions": "7\"H x 14\"W",
      "thumbnailImage": "https://cdn.floristone.com/small/B10-4368_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B10-4368_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B10-4368_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B10-4368&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B10-4368&source_id=aff&affiliateid=2026097209",
      "category": "Centerpieces"
    },
    {
      "id": "B10-4962",
      "name": "The Christmas Peace Bouquet",
      "price": 109.95,
      "description": "The Christmas Peace Bouquet brings beauty and grace to their home or holiday table with each elegant bloom. Rich red roses are a standout arranged amongst red carnations and mini carnations, red hypericum berries and an assortment of lush holiday greens. Accented with white pinecone pics and a red, white, and green plaid designer ribbon, this fresh flower bouquet is presented in a clear glass bubble bowl vase to create a wonderful Christmas gift for any of the special people in your life.",
      "dimensions": "11\"H x 12\"W",
      "thumbnailImage": "https://cdn.floristone.com/small/B10-4962_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B10-4962_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B10-4962_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B10-4962&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B10-4962&source_id=aff&affiliateid=2026097209",
      "category": "Centerpieces"
    },
    {
      "id": "B10-5139",
      "name": "The Christmas Coziness  Basket",
      "price": 94.95,
      "description": "Adding warmth and a homespun look to your Christmas décor, this fresh and fragrant floral arrangement is a wonderful way to bring color and life to any corner of the home. An assortment of Christmas greens and variegated holly are arranged to perfection in a rectangular stained woodchip basket, accented with clusters of red berries, natural pinecones, and a festive red plaid ribbon. A wonderful holiday gift for your relatives, neighbors, or friends throughout the yuletide season ahead",
      "dimensions": "10\"H x 15\"W",
      "thumbnailImage": "https://cdn.floristone.com/small/B10-5139_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B10-5139_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B10-5139_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B10-5139&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B10-5139&source_id=aff&affiliateid=2026097209",
      "category": "Centerpieces"
    },
    {
      "id": "B11-5132",
      "name": "The Spirit of the Season Bouquet",
      "price": 104.95,
      "description": "A sensational splash of red to celebrate the Christmas season in style, this impressive flower bouquet is ready to get you noticed. Red roses, gerbera daisies, Peruvian Lilies, mini carnations, and hypericum berries are accented with an assortment of fresh Christmas greens to create a joyful holiday look. Presented in a ruby red glass vase, this holiday flower arrangement is a heartfelt way for you to send your warmest season's greetings.",
      "dimensions": "14\"H x 12\"W",
      "thumbnailImage": "https://cdn.floristone.com/small/B11-5132_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B11-5132_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B11-5132_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B11-5132&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B11-5132&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "B12-5135",
      "name": "The Winter Wishes Basket",
      "price": 94.95,
      "description": "Taking traditional Christmas colors and turning up the volume to create a bright and brilliant arrangement, this fresh flower bouquet is ready to bring holiday joy to even the darkest corner of your recipient's home. Rich red roses and red carnations are accented with green hypericum berries, green button poms, clusters of shining red glass holiday balls, and an assortment of fragrant Christmas greens. Arranged to perfection in a white wash woodchip basket, this gift of flowers is ready to make a splash as a centerpiece, or when placed on the buffet table or side counter for their holiday gathering.",
      "dimensions": "9\"H x 12\"W",
      "thumbnailImage": "https://cdn.floristone.com/small/B12-5135_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B12-5135_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B12-5135_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B12-5135&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B12-5135&source_id=aff&affiliateid=2026097209",
      "category": "Centerpieces"
    }
  ],
  "everyday": [
    {
      "id": "B07",
      "name": "Best Day Bouquet",
      "price": 94.95,
      "description": "The Best Day Bouquet is ready to create a moment your recipient will always remember! An instant mood booster with it's mix of bright bold colors, this gorgeous fresh flower arrangement brings together sunflowers, hot pink roses, purple double lisianthus, orange LA Hybrid Lilies, yellow snapdragons, green button poms, and lush greens to make this day, their best day. Presented in a clear glass vase, this fresh flower arrangement is made just for you to help you send your warmest birthday, congratulations, or get well wishes to your favorite friends and family.",
      "dimensions": "15\"h x 12\"w",
      "thumbnailImage": "https://cdn.floristone.com/small/B07_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B07_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B07_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B07&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B07&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "B08",
      "name": "Pink Posh Bouquet",
      "price": 89.95,
      "description": "The Pink Posh Bouquet is chic and pink to help you celebrate life's most treasured moments in style! Hot pink roses are bright and beautiful arranged amongst pink Asiatic Lilies, pink stock, green button poms, bupleurum and lush greens to create that perfect gift of flowers. Presented in a clear glass vase, this blushing fresh flower arrangement is ready to send your sweetest wishes in honor of a birthday, an anniversary, or as a way to express your thanks and gratitude.",
      "dimensions": "16\"h x 13\"w",
      "thumbnailImage": "https://cdn.floristone.com/small/B08_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B08_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B08_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B08&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B08&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "B11",
      "name": "High Style Bouquet",
      "price": 99.95,
      "description": "The High Style Bouquet is on-trend and ready to wow your special recipient with it's mix of bold and beautiful blooms! Rich red roses, Stargazer Lilies, pink Peruvian Lilies, burgundy mini carnations, pink statice, and lush greens are arranged to perfection by our floral professionals to create a gift of flowers that is set to impress. Presented in a clear glass vase, this fresh flower bouquet is a wonderful way to express your happy anniversary, happy birthday, or thinking of you wishes.",
      "dimensions": "16\"h x 13\"w",
      "thumbnailImage": "https://cdn.floristone.com/small/B11_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B11_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B11_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B11&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B11&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "B14",
      "name": "Free Spirit Bouquet",
      "price": 89.95,
      "description": "The Free Spirit Bouquet celebrates life's most treasured moments in alluring blues and purples to create a fantastic gift of flowers. Inviting blue iris blooms add depth and texture to this fresh flower arrangement when set against lavender daisies, lavender statice, green button poms, and lush greens. Presented in a clear glass vase, this beautiful flower bouquet creates an impressive congratulations, thinking of you, or thank you gift.",
      "dimensions": "17\"h x 12\"w",
      "thumbnailImage": "https://cdn.floristone.com/small/B14_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B14_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B14_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B14&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B14&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "B19-4387",
      "name": "The True Romance Rose Bouquet",
      "price": 99.95,
      "description": "The True Romance Rose Bouquet is the perfect expression of love and passion. A bright burst of color, this bouquet combines red, pink and fuchsia roses, accented with beautiful greens and seated in a clear glass vase, to create a truly romantic representation of your love.",
      "dimensions": "15\"w x 22\"h",
      "thumbnailImage": "https://cdn.floristone.com/small/B19-4387_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B19-4387_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B19-4387_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B19-4387&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B19-4387&source_id=aff&affiliateid=2026097209",
      "category": "Roses"
    }
  ],
  "mothers_day": [
    {
      "id": "B08",
      "name": "Pink Posh Bouquet",
      "price": 89.95,
      "description": "The Pink Posh Bouquet is chic and pink to help you celebrate life's most treasured moments in style! Hot pink roses are bright and beautiful arranged amongst pink Asiatic Lilies, pink stock, green button poms, bupleurum and lush greens to create that perfect gift of flowers. Presented in a clear glass vase, this blushing fresh flower arrangement is ready to send your sweetest wishes in honor of a birthday, an anniversary, or as a way to express your thanks and gratitude.",
      "dimensions": "16\"h x 13\"w",
      "thumbnailImage": "https://cdn.floristone.com/small/B08_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B08_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B08_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B08&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B08&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "B21-5205",
      "name": "The Spring Sunshine Bouquet",
      "price": 89.95,
      "description": "Ready to wake your recipient up to the arrival of the spring season with a bright array of sun crushed blooms, this vibrant flower bouquet exudes fun and beauty to their day. A bold rush of yellow, this flower arrangement brings together roses, daisies, gerbera daisies, and solidago accented with red and yellow tulips, lush greens, and tropical leaves. Arranged beautifully in a clear glass cubed vase to give it a modern trend forward look they will adore, this spring flower bouquet is ready to celebrate a birthday, Mother's Day, or Easter in blooming style.",
      "dimensions": "9\"w x 8\"h",
      "thumbnailImage": "https://cdn.floristone.com/small/B21-5205_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B21-5205_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B21-5205_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B21-5205&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B21-5205&source_id=aff&affiliateid=2026097209",
      "category": "Centerpieces"
    },
    {
      "id": "B25-4126",
      "name": "Spirit of Spring",
      "price": 89.95,
      "description": "Capture the Spirit of Spring with this traditional bouquet. A handled bamboo basket holds bold purple iris and statice that defer to lemon yellow Asiatic lilies, soft yellow carnations and bright yellow daisy poms. It's the perfect petite basket to celebrate any occasion.",
      "dimensions": "9\"w x 9\"h",
      "thumbnailImage": "https://cdn.floristone.com/small/B25-4126_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B25-4126_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B25-4126_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B25-4126&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B25-4126&source_id=aff&affiliateid=2026097209",
      "category": "Centerpieces"
    },
    {
      "id": "C13-5036",
      "name": "The Pink Dream Bouquet",
      "price": 89.95,
      "description": "Classically elegant in a way that will never go out of style, this fresh flower arrangement is truly a dream. Pink roses and pink mini carnations are soft and sophisticated amongst a bed of white Asiatic Lilies, Peruvian Lilies, chrysanthemums, and statice, perfectly accented with lush greens while situated in a classic clear glass vase. A gorgeous birthday, thank you, or Mother's Day gift!",
      "dimensions": "12\"w x 13\"h",
      "thumbnailImage": "https://cdn.floristone.com/small/C13-5036_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/C13-5036_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/C13-5036_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=C13-5036&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=C13-5036&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "C15C-4972",
      "name": "Pink Pursuits Bouquet",
      "price": 89.95,
      "description": "The Pink Pursuits Bouquet is perfectly sweet and truly charming, casting its spell with each blushing bloom. Hot pink roses, carnations and matsumoto asters are brought together with pink carnations, waxflower and lush greens to create a fun and spirited flower arrangement. Presented in a clear glass cylinder vase lined with a ti leaf material to give it a sophisticated styling, this fresh flower bouquet is set to send your sweetest wishes to friends, family and loved ones in honor of a birthday, to express your thanks or to send your congratulations wishes on the birth of their new baby girl.",
      "dimensions": "10\"h x 11\"w",
      "thumbnailImage": "https://cdn.floristone.com/small/C15C-4972_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/C15C-4972_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/C15C-4972_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=C15C-4972&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=C15C-4972&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    }
  ],
  "get_well": [
    {
      "id": "B07",
      "name": "Best Day Bouquet",
      "price": 94.95,
      "description": "The Best Day Bouquet is ready to create a moment your recipient will always remember! An instant mood booster with it's mix of bright bold colors, this gorgeous fresh flower arrangement brings together sunflowers, hot pink roses, purple double lisianthus, orange LA Hybrid Lilies, yellow snapdragons, green button poms, and lush greens to make this day, their best day. Presented in a clear glass vase, this fresh flower arrangement is made just for you to help you send your warmest birthday, congratulations, or get well wishes to your favorite friends and family.",
      "dimensions": "15\"h x 12\"w",
      "thumbnailImage": "https://cdn.floristone.com/small/B07_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B07_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B07_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B07&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B07&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "B2-4957",
      "name": "The Harvest Heartstrings Bouquet",
      "price": 89.95,
      "description": "The Harvest Heartstrings Bouquet brings sunlit autumn beauty straight to their door. Unforgettable mini sunflowers catch the eye at every turn surrounded by yellow Asiatic lilies, red dianthus, orange spray roses and lush greens to create a stunning fresh flower arrangement. Presented in a clear glass gathered square vase and accented throughout with red glycerized oak leaves, this flower bouquet is set to make an excellent birthday, thank you, get well or Thanksgiving gift.",
      "dimensions": "12\"w x 15\"h",
      "thumbnailImage": "https://cdn.floristone.com/small/B2-4957_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B2-4957_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B2-4957_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B2-4957&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B2-4957&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "B2-5123",
      "name": "The Vibrant Views Bouquet",
      "price": 89.95,
      "description": "Blooming with a vibrant light that can't be denied, this brilliant fall flower bouquet is ready to lift any mood and raise any spirit throughout the autumn months ahead. Swirling orange roses, orange spray roses, and star-shaped peach Asiatic Lilies are surrounded with the eye-catching textures of yellow solidago, bittersweet stems, aralia leaves and lush greens with brilliant yellow gourd accents tucked in a just the right spot, all beautifully arranged in an orange ceramic cylinder vase. A wonderful fall birthday, get well, thank you, or happy harvest gift!",
      "dimensions": "11\"w x 11\"h",
      "thumbnailImage": "https://cdn.floristone.com/small/B2-5123_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B2-5123_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B2-5123_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B2-5123&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B2-5123&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "B20-4970",
      "name": "The Tranquil Bouquet",
      "price": 89.95,
      "description": "This bouquet blooms with a sweet sophistication and style to bring a calming grace to any event or occasion. Hot pink and pink roses are brought together with purple, lavender and fuchsia stock stems accented with pink Peruvian lilies and lush greens to create a simply stunning flower arrangement. Presented in a clear glass bubble bowl vase, this exquisite fresh flower bouquet will make an excellent birthday, anniversary or sympathy gift.",
      "dimensions": "12\"H x 12\"W",
      "thumbnailImage": "https://cdn.floristone.com/small/B20-4970_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B20-4970_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B20-4970_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B20-4970&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B20-4970&source_id=aff&affiliateid=2026097209",
      "category": "Centerpieces"
    },
    {
      "id": "B21-4968",
      "name": "The Bright Lights Bouquet",
      "price": 89.95,
      "description": "The Bright Lights Bouquet brings color and beauty straight to your special recipient's door! Yellow Asiatic lilies, pink roses, purple stock, lavender monte casino asters, pink carnations, pink mini carnations and lush greens are brought together to create a sweetly fascinating flower arrangement. Presented in a square lavender pastel washed basket, this fresh flower bouquet is set to make an excellent birthday, thank you or get well gift.",
      "dimensions": "14\"w x 13\"h",
      "thumbnailImage": "https://cdn.floristone.com/small/B21-4968_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B21-4968_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B21-4968_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B21-4968&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B21-4968&source_id=aff&affiliateid=2026097209",
      "category": "Centerpieces"
    }
  ],
  "thank_you": [
    {
      "id": "B08",
      "name": "Pink Posh Bouquet",
      "price": 89.95,
      "description": "The Pink Posh Bouquet is chic and pink to help you celebrate life's most treasured moments in style! Hot pink roses are bright and beautiful arranged amongst pink Asiatic Lilies, pink stock, green button poms, bupleurum and lush greens to create that perfect gift of flowers. Presented in a clear glass vase, this blushing fresh flower arrangement is ready to send your sweetest wishes in honor of a birthday, an anniversary, or as a way to express your thanks and gratitude.",
      "dimensions": "16\"h x 13\"w",
      "thumbnailImage": "https://cdn.floristone.com/small/B08_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B08_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B08_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B08&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B08&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "B14",
      "name": "Free Spirit Bouquet",
      "price": 89.95,
      "description": "The Free Spirit Bouquet celebrates life's most treasured moments in alluring blues and purples to create a fantastic gift of flowers. Inviting blue iris blooms add depth and texture to this fresh flower arrangement when set against lavender daisies, lavender statice, green button poms, and lush greens. Presented in a clear glass vase, this beautiful flower bouquet creates an impressive congratulations, thinking of you, or thank you gift.",
      "dimensions": "17\"h x 12\"w",
      "thumbnailImage": "https://cdn.floristone.com/small/B14_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B14_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B14_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B14&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B14&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "B2-4957",
      "name": "The Harvest Heartstrings Bouquet",
      "price": 89.95,
      "description": "The Harvest Heartstrings Bouquet brings sunlit autumn beauty straight to their door. Unforgettable mini sunflowers catch the eye at every turn surrounded by yellow Asiatic lilies, red dianthus, orange spray roses and lush greens to create a stunning fresh flower arrangement. Presented in a clear glass gathered square vase and accented throughout with red glycerized oak leaves, this flower bouquet is set to make an excellent birthday, thank you, get well or Thanksgiving gift.",
      "dimensions": "12\"w x 15\"h",
      "thumbnailImage": "https://cdn.floristone.com/small/B2-4957_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B2-4957_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B2-4957_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B2-4957&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B2-4957&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "B20-4970",
      "name": "The Tranquil Bouquet",
      "price": 89.95,
      "description": "This bouquet blooms with a sweet sophistication and style to bring a calming grace to any event or occasion. Hot pink and pink roses are brought together with purple, lavender and fuchsia stock stems accented with pink Peruvian lilies and lush greens to create a simply stunning flower arrangement. Presented in a clear glass bubble bowl vase, this exquisite fresh flower bouquet will make an excellent birthday, anniversary or sympathy gift.",
      "dimensions": "12\"H x 12\"W",
      "thumbnailImage": "https://cdn.floristone.com/small/B20-4970_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B20-4970_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B20-4970_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B20-4970&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B20-4970&source_id=aff&affiliateid=2026097209",
      "category": "Centerpieces"
    },
    {
      "id": "B21-4968",
      "name": "The Bright Lights Bouquet",
      "price": 89.95,
      "description": "The Bright Lights Bouquet brings color and beauty straight to your special recipient's door! Yellow Asiatic lilies, pink roses, purple stock, lavender monte casino asters, pink carnations, pink mini carnations and lush greens are brought together to create a sweetly fascinating flower arrangement. Presented in a square lavender pastel washed basket, this fresh flower bouquet is set to make an excellent birthday, thank you or get well gift.",
      "dimensions": "14\"w x 13\"h",
      "thumbnailImage": "https://cdn.floristone.com/small/B21-4968_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B21-4968_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B21-4968_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B21-4968&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B21-4968&source_id=aff&affiliateid=2026097209",
      "category": "Centerpieces"
    }
  ],
  "sympathy": [
    {
      "id": "B30-4341",
      "name": "The Independence Bouquet",
      "price": 89.95,
      "description": "The Independence Bouquet will dazzle your recipient this Summer just in time for the exciting celebration that the Fourth of July brings. Brilliant red roses and white Asiatic lilies are subtly accented with Queen Anne's Lace and a sheer blue ribbon all perfectly presented in a clear glass bubble bowl creating a gorgeous gift that will make their holiday complete.",
      "dimensions": "8\"w x 9\"h",
      "thumbnailImage": "https://cdn.floristone.com/small/B30-4341_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B30-4341_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B30-4341_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B30-4341&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B30-4341&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "B30-4433",
      "name": "The American Glory Bouquet",
      "price": 89.95,
      "description": "The American Glory Bouquet bursts with patriotic pride and heartfelt beauty. Blue delphinium, bright red carnations and mini carnations and brilliant white Asiatic lilies create a spectacular display arranged amongst American Flags in a round whitewash basket, creating a lovely way to celebrate this coming July 4th holiday.",
      "dimensions": "12\"w x 18\"h",
      "thumbnailImage": "https://cdn.floristone.com/small/B30-4433_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B30-4433_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B30-4433_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B30-4433&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B30-4433&source_id=aff&affiliateid=2026097209",
      "category": "Centerpieces"
    },
    {
      "id": "B30-4434",
      "name": "The Unity Bouquet",
      "price": 89.95,
      "description": "The Unity Bouquet sparks the hearts of all Americans with its patriotic beauty and dazzling color. Bright red roses mingle with blue iris arranged amongst white Peruvian lilies and assorted greens. Accented with two American Flags and a red, white and blue ribbon, this stunning bouquet arrives arranged in a clear glass vase to create a gorgeous way to celebrate our Independence Day.",
      "dimensions": "14\"w x 18\"h",
      "thumbnailImage": "https://cdn.floristone.com/small/B30-4434_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B30-4434_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B30-4434_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B30-4434&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B30-4434&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "C15-4790",
      "name": "Precious Heart Bouquet",
      "price": 94.95,
      "description": "The Precious Heart Bouquet is a blushing display of loving kindness. Fuchsia roses are sweetly stunning amongst red matsumoto asters, pink mini carnations and lush greens. Arranged in a classic clear glass vase. This bouquet will convey your warmest wishes.",
      "dimensions": "11\"w x 15\"h",
      "thumbnailImage": "https://cdn.floristone.com/small/C15-4790_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/C15-4790_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/C15-4790_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=C15-4790&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=C15-4790&source_id=aff&affiliateid=2026097209",
      "category": "Funeral - Table Arrangements"
    },
    {
      "id": "C2-5229",
      "name": "The New Sunrise Bouquet",
      "price": 89.95,
      "description": "It's a new dawn for a new day, and your recipient is going to rise to meet every expectation with the energy and beauty of this gorgeous flower arrangement by their side. Orange roses capture the essence of the perfect sunrise offset by hot pink spray roses, hot pink carnations, orange carnations, fuchsia gilly flower, green mini hydrangea, seeded eucalyptus, and lush greens situated in a oval stained woodchip basket to give it a natural, rustic, and simply stylish look. A wonderful thank you, birthday, or thinking of you gift!",
      "dimensions": "13\"w x 10\"h",
      "thumbnailImage": "https://cdn.floristone.com/small/C2-5229_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/C2-5229_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/C2-5229_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=C2-5229&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=C2-5229&source_id=aff&affiliateid=2026097209",
      "category": "Centerpieces"
    }
  ],
  "top_overall": [
    {
      "id": "B07",
      "name": "Best Day Bouquet",
      "price": 94.95,
      "description": "The Best Day Bouquet is ready to create a moment your recipient will always remember! An instant mood booster with it's mix of bright bold colors, this gorgeous fresh flower arrangement brings together sunflowers, hot pink roses, purple double lisianthus, orange LA Hybrid Lilies, yellow snapdragons, green button poms, and lush greens to make this day, their best day. Presented in a clear glass vase, this fresh flower arrangement is made just for you to help you send your warmest birthday, congratulations, or get well wishes to your favorite friends and family.",
      "dimensions": "15\"h x 12\"w",
      "thumbnailImage": "https://cdn.floristone.com/small/B07_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B07_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B07_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B07&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B07&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "B08",
      "name": "Pink Posh Bouquet",
      "price": 89.95,
      "description": "The Pink Posh Bouquet is chic and pink to help you celebrate life's most treasured moments in style! Hot pink roses are bright and beautiful arranged amongst pink Asiatic Lilies, pink stock, green button poms, bupleurum and lush greens to create that perfect gift of flowers. Presented in a clear glass vase, this blushing fresh flower arrangement is ready to send your sweetest wishes in honor of a birthday, an anniversary, or as a way to express your thanks and gratitude.",
      "dimensions": "16\"h x 13\"w",
      "thumbnailImage": "https://cdn.floristone.com/small/B08_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B08_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B08_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B08&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B08&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "B10-4368",
      "name": "Celebration of the Season Centerpiece",
      "price": 109.95,
      "description": "The Celebration of the Season Centerpiece is a grand display of holiday elegance. Red roses and spray roses pop against a backdrop of assorted holiday greens and variegated holly that beautifully encircle three red taper candles. Accented with gold pinecones and gold metallic brocade ribbon this centerpiece creates a warm and enchanting glow to benefit their holiday festivities.",
      "dimensions": "7\"H x 14\"W",
      "thumbnailImage": "https://cdn.floristone.com/small/B10-4368_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B10-4368_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B10-4368_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B10-4368&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B10-4368&source_id=aff&affiliateid=2026097209",
      "category": "Centerpieces"
    },
    {
      "id": "B10-4962",
      "name": "The Christmas Peace Bouquet",
      "price": 109.95,
      "description": "The Christmas Peace Bouquet brings beauty and grace to their home or holiday table with each elegant bloom. Rich red roses are a standout arranged amongst red carnations and mini carnations, red hypericum berries and an assortment of lush holiday greens. Accented with white pinecone pics and a red, white, and green plaid designer ribbon, this fresh flower bouquet is presented in a clear glass bubble bowl vase to create a wonderful Christmas gift for any of the special people in your life.",
      "dimensions": "11\"H x 12\"W",
      "thumbnailImage": "https://cdn.floristone.com/small/B10-4962_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B10-4962_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B10-4962_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B10-4962&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B10-4962&source_id=aff&affiliateid=2026097209",
      "category": "Centerpieces"
    },
    {
      "id": "B10-5139",
      "name": "The Christmas Coziness  Basket",
      "price": 94.95,
      "description": "Adding warmth and a homespun look to your Christmas décor, this fresh and fragrant floral arrangement is a wonderful way to bring color and life to any corner of the home. An assortment of Christmas greens and variegated holly are arranged to perfection in a rectangular stained woodchip basket, accented with clusters of red berries, natural pinecones, and a festive red plaid ribbon. A wonderful holiday gift for your relatives, neighbors, or friends throughout the yuletide season ahead",
      "dimensions": "10\"H x 15\"W",
      "thumbnailImage": "https://cdn.floristone.com/small/B10-5139_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B10-5139_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B10-5139_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B10-5139&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B10-5139&source_id=aff&affiliateid=2026097209",
      "category": "Centerpieces"
    },
    {
      "id": "B11",
      "name": "High Style Bouquet",
      "price": 99.95,
      "description": "The High Style Bouquet is on-trend and ready to wow your special recipient with it's mix of bold and beautiful blooms! Rich red roses, Stargazer Lilies, pink Peruvian Lilies, burgundy mini carnations, pink statice, and lush greens are arranged to perfection by our floral professionals to create a gift of flowers that is set to impress. Presented in a clear glass vase, this fresh flower bouquet is a wonderful way to express your happy anniversary, happy birthday, or thinking of you wishes.",
      "dimensions": "16\"h x 13\"w",
      "thumbnailImage": "https://cdn.floristone.com/small/B11_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B11_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B11_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B11&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B11&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "B11-5132",
      "name": "The Spirit of the Season Bouquet",
      "price": 104.95,
      "description": "A sensational splash of red to celebrate the Christmas season in style, this impressive flower bouquet is ready to get you noticed. Red roses, gerbera daisies, Peruvian Lilies, mini carnations, and hypericum berries are accented with an assortment of fresh Christmas greens to create a joyful holiday look. Presented in a ruby red glass vase, this holiday flower arrangement is a heartfelt way for you to send your warmest season's greetings.",
      "dimensions": "14\"H x 12\"W",
      "thumbnailImage": "https://cdn.floristone.com/small/B11-5132_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B11-5132_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B11-5132_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B11-5132&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B11-5132&source_id=aff&affiliateid=2026097209",
      "category": "Vase Arrangements"
    },
    {
      "id": "B12-5135",
      "name": "The Winter Wishes Basket",
      "price": 94.95,
      "description": "Taking traditional Christmas colors and turning up the volume to create a bright and brilliant arrangement, this fresh flower bouquet is ready to bring holiday joy to even the darkest corner of your recipient's home. Rich red roses and red carnations are accented with green hypericum berries, green button poms, clusters of shining red glass holiday balls, and an assortment of fragrant Christmas greens. Arranged to perfection in a white wash woodchip basket, this gift of flowers is ready to make a splash as a centerpiece, or when placed on the buffet table or side counter for their holiday gathering.",
      "dimensions": "9\"H x 12\"W",
      "thumbnailImage": "https://cdn.floristone.com/small/B12-5135_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B12-5135_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B12-5135_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B12-5135&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B12-5135&source_id=aff&affiliateid=2026097209",
      "category": "Centerpieces"
    },
    {
      "id": "B13-3601",
      "name": "Red Poinsettia Basket (Small)",
      "price": 94.95,
      "description": "The traditional holiday blooming plant, a Christmas Poinsettia, with its dark leaves and deep red flowers is the perfect gift for family and friends.",
      "dimensions": "6\" pot",
      "thumbnailImage": "https://cdn.floristone.com/small/B11-3601_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B11-3601_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B13-3601_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B13-3601&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B13-3601&source_id=aff&affiliateid=2026097209",
      "category": "Plants"
    },
    {
      "id": "B13-3602",
      "name": "Red Poinsettia Basket (Large)",
      "price": 119.95,
      "description": "The traditional holiday blooming plant, a Christmas Poinsettia, with its dark leaves and deep red flowers is the perfect gift for family and friends.",
      "dimensions": "8\" pot",
      "thumbnailImage": "https://cdn.floristone.com/small/B11-3602_t1.jpg",
      "detailImage": "https://cdn.floristone.com/large/B11-3602_d1.jpg",
      "extraLargeImage": "https://cdn.floristone.com/hi-res/B13-3602_h1.jpg",
      "detailUrl": "http://www.floristone.com/detail.cfm?dcode=B13-3602&source_id=aff&affiliateid=2026097209",
      "cartUrl": "http://www.floristone.com/cart.cfm?dcode=B13-3602&source_id=aff&affiliateid=2026097209",
      "category": "Plants"
    }
  ]
}
;

  var STOP_WORDS = {
    "wedding": true, "annual": true, "happy": true, "our": true, "my": true,
    "the": true, "a": true, "an": true, "first": true, "1st": true, "second": true,
    "2nd": true, "third": true, "3rd": true, "fourth": true, "4th": true,
    "fifth": true, "5th": true, "tenth": true, "10th": true, "25th": true,
    "50th": true, "surprise": true, "special": true, "reminder": true,
    "notice": true, "alert": true, "birthday": true, "bday": true, "b-day": true,
    "anniversary": true, "office": true, "company": true, "work": true,
    "virtual": true, "friend": true, "family": true, "team": true,
    "celebration": true, "party": true, "milestone": true, "event": true,
    "dinner": true, "lunch": true, "breakfast": true, "drinks": true, "gathering": true,
    "notes": true, "note": true, "יום": true, "הולדת": true, "יומולדת": true,
    "נישואין": true, "נישואים": true, "של": true, "ל": true
  };

  var NEGATIVE_KEYWORDS = [
    "standup", "sync", "meeting", "appointment", "doctor", "dentist",
    "1:1", "one-on-one", "retro", "retrospective", "planning", "sprint",
    "interview", "review", "call", "demo", "flight", "hotel", "check-in",
    "checkout", "service", "vet", "oil change", "workout", "gym", "exam",
    "all-hands", "touchpoint"
  ];

  var BIRTHDAY_KEYWORD_RE = /\b(b(irth)?day|b-day|bday|born|cumpleaños|cumple|anniversaire|geburtstag|compleanno)\b|יום\s*הולדת|יומולדת|יום-הולדת/i;
  var BIRTHDAY_EMOJI_RE = /[\u{1F382}\u{1F388}\u{1F370}\u{1F389}]/u;

  var ANNIVERSARY_KEYWORD_RE = /\b(anniversary|anniv|wedding|years together|wedding day|aniversario|jubiläum)\b|יום\s*נישואין|יום\s*נישואים/i;
  var ANNIVERSARY_EMOJI_RE = /[\u{1F48D}\u{1F942}\u{1F491}\u{1F492}\u{2764}]/u;

  var VALENTINES_KEYWORD_RE = /\b(valentine'?s?\s*day|valentines\s*day|val\s*day|valentine'?s?|d[ií]a\s+de\s+san\s+valent[ií]n|san\s+valent[ií]n|d[ií]a\s+de\s+los\s+enamorados)\b|יום\s*האהבה|ולנטיין/iu;
  var VALENTINES_EMOJI_RE = /[\u{1F496}\u{1F498}\u{1F49D}\u{1F48B}\u{1F339}]/u;

  var MOTHERS_DAY_KEYWORD_RE = /\b(mother'?s?\s*day|mom'?s?\s*day|mothers\s*day|d[ií]a\s+de\s+la\s+madre|d[ií]a\s+de\s+las\s+madres)\b|יום\s*האם|יום\s*המשפחה/iu;
  var MOTHERS_DAY_EMOJI_RE = /[\u{1F931}]/u;

  var FATHERS_DAY_KEYWORD_RE = /\b(father'?s?\s*day|dad'?s?\s*day|fathers\s*day|d[ií]a\s+del\s+padre|d[ií]a\s+de\s+los\s+padres)\b|יום\s*האב/iu;
  var FATHERS_DAY_EMOJI_RE = /[\u{1F454}]/u;

  var THANKSGIVING_KEYWORD_RE = /\b(thanksgiving(?: day)?|turkey day|friendsgiving|d[ií]a\s+de\s+acci[oó]n\s+de\s+gracias|acci[oó]n\s+de\s+gracias)\b|חג\s*ההודיה/iu;
  var THANKSGIVING_EMOJI_RE = /[\u{1F983}\u{1F342}\u{1F37D}]/u;

  var CHRISTMAS_KEYWORD_RE = /\b(christmas(?: eve| day)?|xmas|yuletide|holiday season|winter holiday|nochebuena|navidad|d[ií]a\s+de\s+navidad)\b|חג\s*המולד|כריסמס/iu;
  var CHRISTMAS_EMOJI_RE = /[\u{1F384}\u{2744}\u{1F385}\u{1F381}]/u;

  var EASTER_KEYWORD_RE = /\b(easter(?: sunday| monday)?|good friday|pascha|pascua|domingo\s+de\s+resurrecci[oó]n|viernes\s+santo)\b|פסחא/iu;
  var EASTER_EMOJI_RE = /[\u{1F430}\u{1F95A}\u{1F423}]/u;

  var HALLOWEEN_KEYWORD_RE = /\b(halloween|trick or treat|all hallows|noche\s+de\s+brujas|d[ií]a\s+de\s+muertos|todos\s+los\s+santos)\b|ליל\s*כל\s*הקדושים/iu;
  var HALLOWEEN_EMOJI_RE = /[\u{1F383}\u{1F47B}\u{1F578}]/u;

  var INDEPENDENCE_KEYWORD_RE = /\b(4th of july|fourth of july|independence day|memorial day|labor day|veterans day|fiesta\s+nacional|d[ií]a\s+de\s+la\s+independencia|d[ií]a\s+del\s+trabajo)\b/iu;
  var INDEPENDENCE_EMOJI_RE = /[\u{1F1FA}\u{1F1F8}\u{1F386}\u{1F387}]/u;

  var NEW_YEAR_KEYWORD_RE = /\b(new year'?s?(?: eve| day)?|happy new year|rosh hashanah|nochevieja|a[ñn]o\s+nuevo|v[ií]spera\s+de\s+a[ñn]o\s+nuevo)\b|שנה\s*אזרחית\s*חדשה|נובי\s*גוד|ראש\s*השנה/iu;

  var WOMENS_DAY_KEYWORD_RE = /\b(women'?s?\s*day|international\s+women'?s?\s*day|d[ií]a\s+(?:internacional\s+)?de\s+la\s+mujer)\b|יום\s*האישה/iu;
  var WOMENS_DAY_EMOJI_RE = /[\u{1F338}\u{1F469}\u{2728}]/u;

  var GRANDPARENTS_DAY_KEYWORD_RE = /\b(grandparent'?s?\s*day|grandparents\s*day|grandma'?s?\s*day|grandpa'?s?\s*day|d[ií]a\s+de\s+los\s+abuelos)\b|יום\s*הסבא|יום\s*הסבתא/iu;
  var GRANDPARENTS_DAY_EMOJI_RE = /[\u{1F474}\u{1F475}\u{1F490}]/u;

  var BOSS_DAY_KEYWORD_RE = /\b(boss'?s?\s*day|bosses\s*day|administrative\s+professionals?\s*day|secretar(?:y|ies)'?\s*day|d[ií]a\s+del\s+jefe|d[ií]a\s+de\s+la\s+secretaria)\b/iu;
  var BOSS_DAY_EMOJI_RE = /[\u{1F454}\u{1F4BC}]/u;

  var HANUKKAH_KEYWORD_RE = /\b(hanukkah|chanukah|chanuka|hanuka|passover|pesach|purim|sukkot)\b|חנוכה|פסח|פורים|סוכות/iu;
  var HANUKKAH_EMOJI_RE = /[\u{1F54E}\u{2721}\u{1F369}]/u;

  var MILESTONE_KEYWORD_RE = /\b(graduation|baby shower|retirement|housewarming|promotion|new baby|engaged|engagement|milestone|get well|thank you|sympathy|celebration)\b/i;
  var MILESTONE_EMOJI_RE = /[\u{1F393}\u{1F476}\u{1F3E1}\u{1F37E}\u{2728}]/u;

  var EMOJI_STRIP_RE = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1FA00}-\u{1FAFF}]/gu;
  var ZERO_WIDTH_RE = /[\u200B-\u200D\uFEFF]/g;
  var NAME_CHARS = "A-Za-z0-9\\u00C0-\\u024F\\u1E00-\\u1EFF\\u0590-\\u05FF\\u0400-\\u04FF\\u0600-\\u06FF\\s&'\\-";

  function cleanAndValidateName(raw) {
    if (!raw) return null;
    var cleaned = raw
      .replace(ZERO_WIDTH_RE, "")
      .replace(EMOJI_STRIP_RE, " ")
      .replace(/[’`]/g, "'")
      .replace(new RegExp("[^" + NAME_CHARS + "]", "g"), "")
      .trim();

    cleaned = cleaned
      .replace(/^(?:de|from|von|das|du|בין|מ)\s+\d{1,2}(?::\d{2})?\s*(?:[a-z]{0,2})?\s+(?:a|to|bis|às|à|au|ל|עד|–|-)\s+\d{1,2}(?::\d{2})?\s*(?:[a-z]{0,2})?\s*[,:–—\-]?\s*/i, "")
      .replace(/^\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?\s*(?:[-–—]|to|a)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?\s*[,:–—\-]?\s*/i, "")
      .replace(/^\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)\s*[,:–—\-]?\s*/i, "")
      .replace(/^\d{1,2}:\d{2}\s*[,:–—\-]?\s*/i, "")
      .trim();

    cleaned = cleaned
      .replace(/^(and|with|for|celebrating|celebrate|honoring|honor|של|ל)\s+/i, "")
      .replace(/\s+(and|with|for|של|ל)$/i, "")
      .replace(/^[~*#_!@$%^+=|:;,.?\-\s]+/, "")
      .replace(/[~*#_!@$%^+=|:;,.?\-\s]+$/, "")
      .trim();

    if (!cleaned || cleaned.length < 2) return null;

    var lower = cleaned.toLowerCase();
    if (STOP_WORDS[lower]) return null;

    var tokens = lower.split(/\s+/);
    var allStopWords = true;
    for (var i = 0; i < tokens.length; i++) {
      if (!STOP_WORDS[tokens[i]]) {
        allStopWords = false;
        break;
      }
    }
    if (allStopWords) return null;

    for (var j = 0; j < tokens.length; j++) {
      if (NEGATIVE_KEYWORDS.indexOf(tokens[j]) !== -1) return null;
    }

    return cleaned;
  }

  function extractRecipientNameFromLine(line) {
    if (!line) return null;
    var cleanLine = line
      .replace(ZERO_WIDTH_RE, "")
      .replace(EMOJI_STRIP_RE, " ")
      .replace(/[’`]/g, "'")
      .trim();

    cleanLine = cleanLine
      .replace(/^[~*#_!@$%^+=|:;,.?\-\s]+/, "")
      .replace(/^\[[^\]]*\]\s*/, "")
      .replace(/^(?:de|from|von|das|du|בין|מ)\s+\d{1,2}(?::\d{2})?\s*(?:[a-z]{0,2})?\s+(?:a|to|bis|às|à|au|ל|עד|–|-)\s+\d{1,2}(?::\d{2})?\s*(?:[a-z]{0,2})?\s*[,:–—\-]?\s*/i, "")
      .replace(/^\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?\s*(?:[-–—]|to|a)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?\s*[,:–—\-]?\s*/i, "")
      .replace(/^\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)\s*[,:–—\-]?\s*/i, "")
      .replace(/^\d{1,2}:\d{2}\s*[,:–—\-]?\s*/i, "")
      .replace(/^(?:special|reminder|notice|alert|event|note|notes|calendar)\s*[:–—\-]\s*/i, "")
      .replace(/^[~*#_!@$%^+=|:;,.?\-\s]+/, "")
      .trim();

    var hebrewMatch = cleanLine.match(/(?:יום\s*הולדת|יומולדת|יום-הולדת|יום\s*נישואין|יום\s*נישואים)\s+(?:ל|של)?\s*([^(\[,;]+)/i);
    if (hebrewMatch && hebrewMatch[1]) {
      var candHeb = hebrewMatch[1].split(/\s*[(,;]/)[0];
      var vHeb = cleanAndValidateName(candHeb);
      if (vHeb) return vHeb;
    }

    var possessiveMatch = cleanLine.match(/^(.*?)(?:'s)\s+(?:(?:\d+(?:st|nd|rd|th)?\s+)?(?:birthday|bday|b-day|anniversary|wedding|celebration|party|baby shower|baby|shower|graduation|retirement|promotion|housewarming|milestone))/i);
    if (possessiveMatch && possessiveMatch[1]) {
      var v1 = cleanAndValidateName(possessiveMatch[1]);
      if (v1) return v1;
    }

    var happyMatch = cleanLine.match(/^happy\s+(?:(?:\d+(?:st|nd|rd|th)?\s+)?(?:birthday|bday|anniversary))\s*[,:–—\-]?\s*([^!?.~*]+)/i);
    if (happyMatch && happyMatch[1]) {
      var vHappy = cleanAndValidateName(happyMatch[1]);
      if (vHappy) return vHappy;
    }

    var markerMatch = cleanLine.match(/(?:birthday|bday|b-day|anniversary|wedding|party|celebration|baby shower|baby|shower|graduation|retirement|promotion|housewarming|milestone)\s+(?:for|of|with|celebrating)\s+([^\n]+)/i);
    if (markerMatch && markerMatch[1]) {
      var cand2 = markerMatch[1].split(/\s+(?:organized|hosted|planned|at|in|on|from)\s+|\s*[(,;]/i)[0];
      var v2 = cleanAndValidateName(cand2);
      if (v2) return v2;
    }

    var suffixDelimMatch = cleanLine.match(/(?:birthday|bday|b-day|anniversary|celebration|baby shower|baby|shower|graduation|retirement|milestone|יום\s*הולדת|יומולדת)\s*[:–—\-]\s*([^\n]+)/i);
    if (suffixDelimMatch && suffixDelimMatch[1]) {
      var cand3a = suffixDelimMatch[1].split(/\s+(?:organized|hosted|planned|at|in|on|from)\s+|\s*[(,;]/i)[0];
      var v3a = cleanAndValidateName(cand3a);
      if (v3a) return v3a;
    }

    var prefixDelimMatch = cleanLine.match(/^([^\n:]+?)\s*[:–—\-]\s*(?:(?:\d+(?:st|nd|rd|th)?\s+)?(?:birthday|bday|b-day|anniversary|celebration|baby shower|baby|shower|graduation|retirement|milestone|יום\s*הולדת|יומולדת))/i);
    if (prefixDelimMatch && prefixDelimMatch[1]) {
      var v3b = cleanAndValidateName(prefixDelimMatch[1]);
      if (v3b) return v3b;
    }

    var leadingMatch = cleanLine.match(/^([^\n]+?)\s+(?:birthday|bday|anniversary|celebration|graduation)/i);
    if (leadingMatch && leadingMatch[1]) {
      var v4 = cleanAndValidateName(leadingMatch[1]);
      if (v4) return v4;
    }

    var nameKeyValueMatch = cleanLine.match(/^(?:name|recipient|guest of honor|honoree|for)\s*[:–—\-]\s*([A-Za-z0-9\s&'-]+)/i);
    if (nameKeyValueMatch && nameKeyValueMatch[1]) {
      var vKv = cleanAndValidateName(nameKeyValueMatch[1]);
      if (vKv) return vKv;
    }

    if (!/(?:birthday|bday|b-day|anniversary|celebration|party|milestone|event|dinner|lunch|location|reserved|table|budget|cake|drinks|wear|quad)/i.test(cleanLine)) {
      if (/^[A-Za-z\u00C0-\u024F\u1E00-\u1EFF\u0590-\u05FF\s&'-]+$/.test(cleanLine)) {
        var vDirect = cleanAndValidateName(cleanLine);
        if (vDirect) return vDirect;
      }
    }

    return null;
  }

  function extractRecipientName(text) {
    if (!text) return null;
    var clean = text.replace(ZERO_WIDTH_RE, "");
    var lines = clean.split(/\r?\n+/);
    for (var i = 0; i < lines.length; i++) {
      var name = extractRecipientNameFromLine(lines[i]);
      if (name) return name;
    }
    return null;
  }

  function classifyEvent(title, notes) {
    var safeTitle = (title || "").replace(ZERO_WIDTH_RE, "").trim();
    var cleanedNotes = cleanExistingNotes(notes || "");
    var safeNotes = cleanedNotes.replace(ZERO_WIDTH_RE, "").trim();
    var combined = (safeTitle + " " + safeNotes).trim();

    if (!combined) {
      return {
        isCelebration: false,
        celebrationType: null,
        recipientName: null,
        confidenceScore: 0
      };
    }

    var celebrationType = null;
    var matchedKeyword = "";
    var baseConfidence = 0.90;
    var occasionCategory = "everyday";

    if (BIRTHDAY_KEYWORD_RE.test(safeTitle) || BIRTHDAY_EMOJI_RE.test(safeTitle) || BIRTHDAY_KEYWORD_RE.test(combined) || BIRTHDAY_EMOJI_RE.test(combined)) {
      celebrationType = "birthday";
      occasionCategory = "birthday";
      var kwB = combined.match(BIRTHDAY_KEYWORD_RE);
      var emB = combined.match(BIRTHDAY_EMOJI_RE);
      matchedKeyword = kwB ? kwB[0] : (emB ? emB[0] : "birthday");
    } else if (ANNIVERSARY_KEYWORD_RE.test(safeTitle) || ANNIVERSARY_EMOJI_RE.test(safeTitle) || ANNIVERSARY_KEYWORD_RE.test(combined) || ANNIVERSARY_EMOJI_RE.test(combined)) {
      celebrationType = "anniversary";
      occasionCategory = "anniversary";
      var kwA = combined.match(ANNIVERSARY_KEYWORD_RE);
      var emA = combined.match(ANNIVERSARY_EMOJI_RE);
      matchedKeyword = kwA ? kwA[0] : (emA ? emA[0] : "anniversary");
    } else if (VALENTINES_KEYWORD_RE.test(combined) || VALENTINES_EMOJI_RE.test(combined)) {
      celebrationType = "valentines";
      occasionCategory = "love";
      matchedKeyword = "Valentine's Day";
    } else if (MOTHERS_DAY_KEYWORD_RE.test(combined) || MOTHERS_DAY_EMOJI_RE.test(combined)) {
      celebrationType = "mothers_day";
      occasionCategory = "mothers_day";
      matchedKeyword = "Mother's Day";
    } else if (FATHERS_DAY_KEYWORD_RE.test(combined) || FATHERS_DAY_EMOJI_RE.test(combined)) {
      celebrationType = "fathers_day";
      occasionCategory = "everyday";
      matchedKeyword = "Father's Day";
    } else if (CHRISTMAS_KEYWORD_RE.test(combined) || CHRISTMAS_EMOJI_RE.test(combined)) {
      celebrationType = "christmas";
      occasionCategory = "holiday";
      matchedKeyword = "Christmas";
    } else if (THANKSGIVING_KEYWORD_RE.test(combined) || THANKSGIVING_EMOJI_RE.test(combined)) {
      celebrationType = "thanksgiving";
      occasionCategory = "holiday";
      matchedKeyword = "Thanksgiving";
    } else if (EASTER_KEYWORD_RE.test(combined) || EASTER_EMOJI_RE.test(combined)) {
      celebrationType = "easter";
      occasionCategory = "holiday";
      matchedKeyword = "Easter";
    } else if (HALLOWEEN_KEYWORD_RE.test(combined) || HALLOWEEN_EMOJI_RE.test(combined)) {
      celebrationType = "halloween";
      occasionCategory = "holiday";
      matchedKeyword = "Halloween";
    } else if (INDEPENDENCE_KEYWORD_RE.test(combined) || INDEPENDENCE_EMOJI_RE.test(combined)) {
      celebrationType = "independence_day";
      occasionCategory = "sympathy";
      matchedKeyword = "Independence Day";
    } else if (NEW_YEAR_KEYWORD_RE.test(combined)) {
      celebrationType = "new_year";
      occasionCategory = "holiday";
      matchedKeyword = "New Year's";
    } else if (WOMENS_DAY_KEYWORD_RE.test(combined) || WOMENS_DAY_EMOJI_RE.test(combined)) {
      celebrationType = "womens_day";
      occasionCategory = "everyday";
      matchedKeyword = "Women's Day";
    } else if (GRANDPARENTS_DAY_KEYWORD_RE.test(combined) || GRANDPARENTS_DAY_EMOJI_RE.test(combined)) {
      celebrationType = "grandparents_day";
      occasionCategory = "everyday";
      matchedKeyword = "Grandparents Day";
    } else if (BOSS_DAY_KEYWORD_RE.test(combined) || BOSS_DAY_EMOJI_RE.test(combined)) {
      celebrationType = "boss_day";
      occasionCategory = "everyday";
      matchedKeyword = "Boss's Day";
    } else if (HANUKKAH_KEYWORD_RE.test(combined) || HANUKKAH_EMOJI_RE.test(combined)) {
      celebrationType = "hanukkah";
      occasionCategory = "holiday";
      matchedKeyword = "Hanukkah";
    } else if (MILESTONE_KEYWORD_RE.test(combined) || MILESTONE_EMOJI_RE.test(combined)) {
      celebrationType = "milestone";
      occasionCategory = "everyday";
      var kwM = combined.match(MILESTONE_KEYWORD_RE);
      var emM = combined.match(MILESTONE_EMOJI_RE);
      matchedKeyword = kwM ? kwM[0] : (emM ? emM[0] : "milestone");
      baseConfidence = 0.85;
    }

    if (!celebrationType) {
      return {
        isCelebration: false,
        celebrationType: null,
        recipientName: null,
        confidenceScore: 0
      };
    }

    var recipientName = extractRecipientName(safeTitle);
    if (!recipientName && safeNotes) {
      recipientName = extractRecipientName(safeNotes);
    }

    var confidenceScore = recipientName ? Math.min(1.0, baseConfidence + 0.05) : baseConfidence;

    return {
      isCelebration: true,
      celebrationType: celebrationType,
      recipientName: recipientName,
      confidenceScore: confidenceScore,
      matchedKeyword: matchedKeyword,
      occasionCategory: occasionCategory
    };
  }

  function getBestsellers(occasion, limit) {
    var occ = (occasion || "birthday").toLowerCase().trim();
    var lim = (typeof limit === "number" && limit > 0) ? limit : 5;
    var list = CATALOG_BY_OCCASION[occ] || CATALOG_BY_OCCASION["birthday"] || CATALOG_BY_OCCASION["top_overall"] || [];
    return list.slice(0, lim);
  }

  function getFullCatalog() {
    return CATALOG_BY_OCCASION;
  }

  function getCatalog(occasion) {
    if (!occasion) {
      return LEGACY_BRANDS;
    }
    var bestsellers = getBestsellers(occasion, 5);
    var floristBrands = bestsellers.map(function (item) {
      return {
        id: item.id,
        name: item.name,
        category: item.category || "Flowers",
        tagline: item.description.slice(0, 50) + "...",
        logoEmoji: "💐",
        primaryColor: "#E11D48",
        supportedAmounts: [item.price],
        defaultAmount: item.price,
        affiliateUrlTemplate: item.cartUrl,
        cartUrl: item.cartUrl,
        thumbnailImage: item.thumbnailImage,
        detailImage: item.detailImage,
        description: item.description,
        price: item.price
      };
    });
    return LEGACY_BRANDS.concat(floristBrands);
  }

  function getBrand(brandId) {
    if (!brandId) return undefined;
    var lower = String(brandId).toLowerCase().trim();
    for (var i = 0; i < LEGACY_BRANDS.length; i++) {
      if (LEGACY_BRANDS[i].id === lower || LEGACY_BRANDS[i].name.toLowerCase() === lower) {
        return LEGACY_BRANDS[i];
      }
    }
    for (var occ in CATALOG_BY_OCCASION) {
      var items = CATALOG_BY_OCCASION[occ];
      for (var j = 0; j < items.length; j++) {
        if (items[j].id.toLowerCase() === lower) {
          var found = items[j];
          return {
            id: found.id,
            name: found.name,
            category: found.category || "Flowers",
            tagline: found.description.slice(0, 50) + "...",
            logoEmoji: "💐",
            primaryColor: "#E11D48",
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
    }
    return undefined;
  }

  function buildGiftUrl(brandIdOrCode, amount, subId, recipientName, affiliateId) {
    if (!brandIdOrCode) return "";
    var idLower = String(brandIdOrCode).toLowerCase().trim();
    var legacy = null;
    for (var i = 0; i < LEGACY_BRANDS.length; i++) {
      if (LEGACY_BRANDS[i].id === idLower) {
        legacy = LEGACY_BRANDS[i];
        break;
      }
    }

    if (legacy) {
      var amt = amount || legacy.defaultAmount;
      var sub = subId || "direct";
      var aff = affiliateId || DEFAULT_AFFILIATE_ID;
      var url = legacy.affiliateUrlTemplate
        .replace("{amount}", String(amt))
        .replace("{subId}", encodeURIComponent(sub))
        .replace("{affiliateId}", encodeURIComponent(aff));

      if (recipientName && String(recipientName).trim()) {
        url = url.replace("{recipientName}", encodeURIComponent(String(recipientName).trim()));
      } else {
        url = url.replace("&recipient={recipientName}", "").replace("?recipient={recipientName}&", "?");
      }
      return url;
    }

    var code = String(brandIdOrCode).trim();
    var isFloristCode = /^[BC]\d+/i.test(code);
    var isKnownItem = !!getBrand(code);

    if (isFloristCode || isKnownItem) {
      var affId = affiliateId || FLORIST_ONE_AFFILIATE_ID;
      return "http://www.floristone.com/cart.cfm?dcode=" + encodeURIComponent(code) + "&source_id=aff&affiliateid=" + encodeURIComponent(affId);
    }

    return "";
  }

  function cleanExistingNotes(existingNotes) {
    if (!existingNotes) return "";
    var notes = String(existingNotes);

    // 1. Check if structured HTML comment delimiters are present
    var tagBlockRegex = /<!--\s*autogifter:start\s*-->[\s\S]*?<!--\s*autogifter:end\s*-->/gi;
    if (tagBlockRegex.test(notes)) {
      notes = notes.replace(tagBlockRegex, "");
      return notes.replace(/\n{3,}/g, "\n\n").trim();
    }

    // 2. Fallback legacy stripping for un-tagged previous versions
    var patterns = [
      "<!-- autogifter:start -->",
      "🌸 FloristOne Flower Delivery",
      "Top 5 hand-delivered flower bouquets",
      "http://www.floristone.com",
      "https://www.floristone.com",
      "floristone.com/index.cfm",
      "floristone.com/cart.cfm",
      "floristone.com/detail.cfm",
      "Or Gift Card Brands:",
      "🔔 Reminder",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "____________________",
      "--------------------"
    ];

    for (var i = 0; i < patterns.length; i++) {
      var idx = notes.toLowerCase().indexOf(patterns[i].toLowerCase());
      if (idx !== -1) {
        notes = notes.slice(0, idx);
      }
    }

    return notes.replace(/[-_━─\s]+$/, "").trim();
  }

  function buildEnrichedEventDescription(options) {
    options = options || {};
    var recipient = options.recipientName || "Friend";
    var celebrationType = options.celebrationType || "birthday";
    var occasion = options.occasionCategory || celebrationType;
    var bestsellers = getBestsellers(occasion, 5);

    var cleanedNotes = cleanExistingNotes(options.existingNotes);

    var giftLines = [];
    giftLines.push("<!-- autogifter:start -->");
    giftLines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    giftLines.push("🌸 FloristOne Flower Delivery for " + recipient + " 🌸");
    giftLines.push("Top 5 hand-delivered flower bouquets:\n");

    bestsellers.forEach(function (item, index) {
      var httpsCartUrl = (item.cartUrl || "").replace(/^http:\/\//i, "https://");
      var orderText = "Order " + item.name + " ($" + item.price.toFixed(2) + ") at FloristOne";

      giftLines.push((index + 1) + '. <a href="' + httpsCartUrl + '">💐 ' + orderText + '</a>');
    });

    var aff = options.affiliateId || FLORIST_ONE_AFFILIATE_ID;
    var browseUrl = "https://www.floristone.com/index.cfm?source_id=aff&affiliateid=" + encodeURIComponent(aff);
    giftLines.push("\n🎁 <a href=\"" + browseUrl + "\">Browse all other flowers, bouquets & gifts on FloristOne</a>");
    giftLines.push("<!-- autogifter:end -->");

    var giftBlock = giftLines.join("\n");

    if (cleanedNotes.length > 0) {
      return cleanedNotes + "\n\n" + giftBlock;
    }

    return giftBlock;
  }

  function inspectEventDescription(description) {
    if (!description || !String(description).trim()) {
      return {
        hasUserNotes: false,
        hasAutoGifterSection: false,
        userNotes: "",
        isPureAutoGifter: false,
        isPureUser: false,
        isHybrid: false
      };
    }

    var userNotes = cleanExistingNotes(description);
    var hasUserNotes = userNotes.length > 0;
    var hasAutoGifterSection = /<!--\s*autogifter:start\s*-->/i.test(description) ||
      /🌸\s*FloristOne\s*Flower\s*Delivery/i.test(description) ||
      /floristone\.com/i.test(description);

    return {
      hasUserNotes: hasUserNotes,
      hasAutoGifterSection: hasAutoGifterSection,
      userNotes: userNotes,
      isPureAutoGifter: hasAutoGifterSection && !hasUserNotes,
      isPureUser: hasUserNotes && !hasAutoGifterSection,
      isHybrid: hasUserNotes && hasAutoGifterSection
    };
  }

  function generateGreeting(options) {
    options = options || {};
    var name = options.recipientName || "Friend";
    var type = options.celebrationType || "birthday";
    var tone = options.tone || "warm";

    var greetings = {
      birthday: {
        warm: "Happy Birthday, " + name + "! 🎂 Wishing you a day filled with love, laughter, and happiness!",
        fun: "Happy Birthday, " + name + "! 🎉 Another year cooler. Here's a little something to celebrate you!",
        formal: "Wishing you a very Happy Birthday, " + name + ". May the upcoming year bring you continued success and joy."
      },
      anniversary: {
        warm: "Happy Anniversary! 💍 Wishing you both a wonderful day celebrating your journey together!",
        fun: "Happy Anniversary! 🥂 Cheers to another year of love and fun adventures together!",
        formal: "Warmest congratulations on your Anniversary. Wishing you continued happiness and companionship."
      },
      valentines: {
        warm: "Happy Valentine's Day, " + name + "! 💖 Sending you love and sweetest thoughts today!",
        fun: "Happy Valentine's Day! 🌹 Enjoy every single bit of today!",
        formal: "Wishing you a wonderful Valentine's Day filled with joy and appreciation."
      },
      mothers_day: {
        warm: "Happy Mother's Day, " + name + "! 💐 Thank you for everything you do and the endless love you give!",
        fun: "Happy Mother's Day! 🌸 Sit back, relax, and get spoiled today!",
        formal: "Wishing you a very Happy Mother's Day filled with joy, peace, and appreciation."
      },
      fathers_day: {
        warm: "Happy Father's Day, " + name + "! 👑 Thanks for being amazing and always having our back!",
        fun: "Happy Father's Day! 👔 Hope your day is filled with great relaxation and good vibes!",
        formal: "Wishing you a very Happy Father's Day and a wonderful year ahead."
      },
      thanksgiving: {
        warm: "Happy Thanksgiving, " + name + "! 🦃 Grateful for you and wishing you a warm holiday season!",
        fun: "Happy Turkey Day, " + name + "! 🍂 Hope your day is packed with good food and lots of laughs!",
        formal: "Wishing you and your family a restful and joyous Thanksgiving holiday."
      },
      christmas: {
        warm: "Merry Christmas, " + name + "! 🎄 May your holidays be bright, cozy, and filled with joy!",
        fun: "Merry Christmas & Happy Holidays! 🎅 Wishing you endless treats and great festive vibes!",
        formal: "Wishing you a joyous Christmas season and a peaceful, prosperous New Year."
      },
      easter: {
        warm: "Happy Easter, " + name + "! 🐰 Wishing you and your family a peaceful, blessed spring!",
        fun: "Happy Easter! 🐣 Hope you find plenty of chocolate and spring sunshine today!",
        formal: "Wishing you a joyous and uplifting Easter celebration."
      },
      halloween: {
        warm: "Happy Halloween, " + name + "! 🎃 Hope your night is full of treats and festive fun!",
        fun: "Spooky season is here! 👻 Happy Halloween, " + name + "!",
        formal: "Wishing you a fun and safe Halloween celebration."
      },
      independence_day: {
        warm: "Happy 4th of July, " + name + "! 🎆 Wishing you a fantastic celebration and fireworks!",
        fun: "Happy 4th of July! 🇺🇸 Burgers, fireworks, and good times ahead!",
        formal: "Wishing you a proud and celebratory Independence Day."
      },
      new_year: {
        warm: "Happy New Year, " + name + "! 🥂 Wishing you health, happiness, and prosperity in the new year!",
        fun: "Happy New Year! 🎉 Let's make this upcoming year the most epic one yet!",
        formal: "Wishing you a successful and rewarding New Year."
      },
      womens_day: {
        warm: "Happy International Women's Day, " + name + "! 🌸 Celebrating you and all the incredible things you do!",
        fun: "Happy Women's Day! ✨ Keep shining bright and inspiring everyone around you!",
        formal: "Wishing you a wonderful and uplifting International Women's Day."
      },
      grandparents_day: {
        warm: "Happy Grandparents Day, " + name + "! 💐 Thank you for your love, wisdom, and warm hugs!",
        fun: "Happy Grandparents Day! 💖 Hope your day is filled with lots of joy and treats!",
        formal: "Wishing you a peaceful and blessed Grandparents Day."
      },
      boss_day: {
        warm: "Happy Boss's Day, " + name + "! 🌟 Thank you for your leadership, encouragement, and support!",
        fun: "Happy Boss's Day! ☕ Hope you get to relax and enjoy a great day!",
        formal: "Wishing you a very Happy Boss's Day and continued success."
      },
      hanukkah: {
        warm: "Happy Hanukkah, " + name + "! 🕎 Wishing you and your family peace, light, and joy this holiday season!",
        fun: "Chag Sameach & Happy Hanukkah! 🍩 May your week be filled with light, latkes, and laughter!",
        formal: "Wishing you a joyous and bright Hanukkah celebration."
      },
      milestone: {
        warm: "Congratulations, " + name + "! ✨ So proud of you and excited for your next chapter!",
        fun: "Huge congratulations, " + name + "! 🎓🍾 Time to celebrate this incredible milestone!",
        formal: "Warmest congratulations on this noteworthy milestone. Wishing you continued excellence."
      }
    };

    var categoryGreetings = greetings[type] || greetings.birthday;
    return categoryGreetings[tone] || categoryGreetings.warm;
  }

  function getCelebrationEmoji(type) {
    switch (type) {
      case "birthday": return "🎂";
      case "anniversary": return "💍";
      case "valentines": return "💖";
      case "mothers_day": return "💐";
      case "fathers_day": return "👑";
      case "christmas": return "🎄";
      case "thanksgiving": return "🦃";
      case "easter": return "🐰";
      case "halloween": return "🎃";
      case "new_year": return "🥂";
      case "womens_day": return "🌸";
      case "grandparents_day": return "💐";
      case "boss_day": return "👔";
      case "hanukkah": return "🕎";
      case "independence_day": return "🎆";
      case "milestone": return "✨";
      default: return "🎂";
    }
  }

  function sanitizePhoneNumber(phone) {
    if (!phone) return "";
    return String(phone).replace(/\D/g, "");
  }

  function buildWhatsAppTextMessage(options) {
    options = options || {};
    var greeting = (options.greeting || "").trim();
    var giftLink = (options.giftLink || "").trim();

    if (!giftLink) {
      return greeting;
    }

    var giftLine = "";
    if (options.brandName && options.amount) {
      giftLine = "🎁 " + options.brandName + " Gift Card ($" + options.amount + "): " + giftLink;
    } else if (options.brandName) {
      giftLine = "🎁 " + options.brandName + ": " + giftLink;
    } else {
      giftLine = "🌸 Gift & Flowers Link: " + giftLink;
    }

    return greeting ? (greeting + "\n\n" + giftLine) : giftLine;
  }

  function buildWhatsAppShareUrl(options) {
    options = options || {};
    var message = buildWhatsAppTextMessage(options);
    var encodedText = encodeURIComponent(message);
    var cleanPhone = sanitizePhoneNumber(options.phone);

    var baseUrl = "https://api.whatsapp.com/send";
    if (cleanPhone) {
      return baseUrl + "?phone=" + cleanPhone + "&text=" + encodedText;
    }
    return baseUrl + "?text=" + encodedText;
  }

  function buildEmailShareUrl(options) {
    options = options || {};
    var message = buildWhatsAppTextMessage(options);
    var subject = options.subject || "A gift for you!";
    return "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(message);
  }

  return {
    FLORIST_ONE_AFFILIATE_ID: FLORIST_ONE_AFFILIATE_ID,
    DEFAULT_AFFILIATE_ID: DEFAULT_AFFILIATE_ID,
    STANDARD_AMOUNTS: STANDARD_AMOUNTS,
    LEGACY_BRANDS: LEGACY_BRANDS,
    classifyEvent: classifyEvent,
    cleanAndValidateName: cleanAndValidateName,
    extractRecipientName: extractRecipientName,
    extractRecipientNameFromLine: extractRecipientNameFromLine,
    getBestsellers: getBestsellers,
    getFullCatalog: getFullCatalog,
    getCatalog: getCatalog,
    getBrand: getBrand,
    getCelebrationEmoji: getCelebrationEmoji,
    buildGiftUrl: buildGiftUrl,
    cleanExistingNotes: cleanExistingNotes,
    buildEnrichedEventDescription: buildEnrichedEventDescription,
    inspectEventDescription: inspectEventDescription,
    generateGreeting: generateGreeting,
    sanitizePhoneNumber: sanitizePhoneNumber,
    buildWhatsAppTextMessage: buildWhatsAppTextMessage,
    buildWhatsAppShareUrl: buildWhatsAppShareUrl,
    buildEmailShareUrl: buildEmailShareUrl
  };
});
