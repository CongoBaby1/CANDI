import { Lesson, UniversityCategory } from '../types';

export const UNIVERSITY_CATEGORIES: UniversityCategory[] = [
  { id: 'basics', title: 'Basics', description: 'Fundamentals of the plant.', icon: 'Leaf' },
  { id: 'products', title: 'Product Guide', description: 'Explore flower, vapes, and more.', icon: 'Package' },
  { id: 'buying', title: 'Buying Guide', description: 'How to shop successfully.', icon: 'ShoppingCart' },
  { id: 'consumption', title: 'Consumption', description: 'Methods of use.', icon: 'Wind' },
  { id: 'safety', title: 'Effects & Safety', description: 'Safe usage patterns.', icon: 'ShieldCheck' },
  { id: 'science', title: 'Science', description: 'Terpenes and cannabinoids.', icon: 'Beaker' },
  { id: 'growing', title: 'Growing Basics', description: 'Cultivation fundamentals.', icon: 'Sprout' },
  { id: 'edibles', title: 'Edibles', description: 'Infusion knowledge.', icon: 'Cookie' },
];

export const LESSONS: Lesson[] = [
  // CANNABIS BASICS
  {
    id: '1',
    category: 'Basics',
    title: 'What Is Cannabis?',
    level: 'Beginner',
    summary: 'Cannabis is an annual flowering herb that has been used globally for thousands of years. It belongs to the Cannabaceae family and is known for its aromatic resin-producing glands called trichomes.',
    keyPoints: [
      'Cannabis includes different species like Sativa and Indica.',
      'Trichomes are where cannabinoids and terpenes are stored.',
      'The plant can be used for fiber, medicine, and recreation.',
      'Hemp is a low-THC version of the same plant family.'
    ],
    commonMistake: 'Thinking that "hemp" and "marijuana" are two completely different plants—they are the same species with different THC levels.',
    quickTip: 'Observe the resin (crystals) on the plant; that is where the magic happens.',
    quiz: {
      question: 'What are the resin glands on the plant called?',
      options: ['Roots', 'Trichomes', 'Stems', 'Petals'],
      answer: 'Trichomes'
    }
  },
  {
    id: '2',
    category: 'Basics',
    title: 'THC vs CBD',
    level: 'Beginner',
    summary: 'THC and CBD are the primary cannabinoids in cannabis. THC is known for its intoxicating effects, while CBD provides therapeutic potential without the "high."',
    keyPoints: [
      'THC (Tetrahydrocannabinol) is psychoactive.',
      'CBD (Cannabidiol) is non-intoxicating.',
      'Both work with your body\'s Endocannabinoid System.',
      'Using them together can balance the overall experience.'
    ],
    commonMistake: 'Assuming CBD is "fake" because it doesn\'t get you high—it still interacts with your body physically.',
    quickTip: 'If you feel too anxious from THC, products with high CBD can help ground you.',
    quiz: {
      question: 'Which cannabinoid is primarily responsible for the "high"?',
      options: ['CBD', 'THC', 'CBG', 'CBN'],
      answer: 'THC'
    }
  },
  {
    id: '3',
    category: 'Basics',
    title: 'What Are Cannabinoids?',
    level: 'Beginner',
    summary: 'Cannabinoids are natural chemical compounds found in the cannabis plant. They mimic compounds our bodies naturally produce, called endocannabinoids.',
    keyPoints: [
      'Over 100 cannabinoids have been identified.',
      'THC and CBD are the most prominent.',
      'Minor cannabinoids like CBG and CBN are gaining popularity.',
      'They interact with receptors in our brain and body.'
    ],
    commonMistake: 'Thinking there are only two cannabinoids in the plant.',
    quickTip: 'Research "minor cannabinoids" to see how they differ from the big two.',
    quiz: {
      question: 'Cannabinoids interact with which system in the human body?',
      options: ['Digestive System', 'Endocannabinoid System', 'Respiratory System', 'Nervous System'],
      answer: 'Endocannabinoid System'
    }
  },
  {
    id: '4',
    category: 'Basics',
    title: 'What Are Terpenes?',
    level: 'Beginner',
    summary: 'Terpenes are aromatic oils that provide cannabis with its unique scents like pine, lemon, or earthiness. They play a significant role in the specific effects of a strain.',
    keyPoints: [
      'Terpenes are found in many plants, not just cannabis.',
      'They dictate the "vibe" of the experience (energizing vs. relaxing).',
      'Limonene smells like citrus; Myrcene smells earthy.',
      'They contribute to the "Entourage Effect" when combined with cannabinoids.'
    ],
    commonMistake: 'Thinking that THC percentage is the only thing that matters for potency.',
    quickTip: 'Follow your nose—if a strain smells good to you, it’s likely a good match.',
    quiz: {
      question: 'What do terpenes primarily provide to the plant?',
      options: ['Color', 'Scent and Flavor', 'Height', 'Root Strength'],
      answer: 'Scent and Flavor'
    }
  },
  {
    id: '5',
    category: 'Basics',
    title: 'Indica, Sativa, and Hybrid Explained',
    level: 'Beginner',
    summary: 'These terms traditionally describe growth patterns but are used by consumers to predict effects. Indica is typically relaxing, Sativa is energizing, and Hybrids are a mix.',
    keyPoints: [
      'Sativa: Tall plants, narrow leaves, cerebral effects.',
      'Indica: Short, bushy plants, wide leaves, physical relaxation.',
      'Hybrid: Cross-bred for specific, balanced traits.',
      'Modern science looks at "Chemovars" rather than just these categories.'
    ],
    commonMistake: 'Thinking all Sativas will keep you awake and all Indicas will make you sleep.',
    quickTip: 'Look at the terpene profile for a better prediction of effects than just "Sativa" or "Indica".',
    quiz: {
      question: 'Which category is traditionally associated with "In-da-couch" relaxation?',
      options: ['Sativa', 'Indica', 'Hybrid', 'Hemp'],
      answer: 'Indica'
    }
  },

  // PRODUCT GUIDE
  {
    id: '6',
    category: 'Product Guide',
    title: 'Flower Explained',
    level: 'Beginner',
    summary: 'Flower refers to the dried and cured buds of the female cannabis plant. It is the most traditional form of consumption, usually smoked or vaped.',
    keyPoints: [
      'Flower comes in various sizes (Popcorn, Smalls, Large).',
      'It offers the most complete spectrum of cannabinoids and terpenes.',
      'Quality is often judged by "bag appeal" and aroma.',
      'It requires grinding before consumption.'
    ],
    commonMistake: 'Assuming the highest THC percentage flower is always the best quality.',
    quickTip: 'Store your flower in a dark, glass airtight jar to keep it fresh.',
    quiz: {
      question: 'Which part of the cannabis plant is harvested for consumption?',
      options: ['Roots', 'Stems', 'Flower (Buds)', 'Fan Leaves'],
      answer: 'Flower (Buds)'
    }
  },
  {
    id: '7',
    category: 'Product Guide',
    title: 'Pre-Rolls Explained',
    level: 'Beginner',
    summary: 'Pre-rolls are ready-to-smoke cannabis joints rolled by professionals. They offer convenience and a way to try new strains without buying bulk flower.',
    keyPoints: [
      'Available in various sizes (0.5g to multiple grams).',
      'Some are "Infused" with concentrates for extra potency.',
      'Convenient for those who cannot roll their own.',
      'Sold individually or in multipacks.'
    ],
    commonMistake: 'Not realizes that "infused" pre-rolls are much stronger than standard ones.',
    quickTip: 'If a pre-roll burns unevenly, try rotating it slowly while lighting.',
    quiz: {
      question: 'What is a "Pre-roll"?',
      options: ['A type of edible', 'A ready-made joint', 'A vaping device', 'A growing technique'],
      answer: 'A ready-made joint'
    }
  },
  {
    id: '8',
    category: 'Product Guide',
    title: 'Edibles Explained',
    level: 'Beginner',
    summary: 'Edibles are food items infused with cannabis. They are processed by the liver, leading to a longer-lasting and often more intense experience.',
    keyPoints: [
      'Gummies, chocolates, and beverages are most common.',
      'Effects take much longer to start (30-120 minutes).',
      'The "high" can last for 6-12 hours.',
      'Precise dosing is much easier than with flower.'
    ],
    commonMistake: 'Taking a second dose because you don\'t feel the first one yet.',
    quickTip: 'Eat a light meal before taking an edible to help with absorption.',
    quiz: {
      question: 'How long can the effects of an edible last?',
      options: ['1 hour', '2-4 hours', '6-12 hours', '24 hours'],
      answer: '6-12 hours'
    }
  },
  {
    id: '9',
    category: 'Product Guide',
    title: 'Vapes Explained',
    level: 'Beginner',
    summary: 'Vapes involve heating cannabis oil or flower to a temperature that releases vapor but not smoke. It is often seen as a more discrete and flavorful method.',
    keyPoints: [
      '510-threaded cartridges are the industry standard.',
      'Disposable vapes are all-in-one units.',
      'Vapor is less pungent than smoke.',
      'Effect start almost immediately.'
    ],
    commonMistake: 'Pulling too hard on the battery, which can burn the oil.',
    quickTip: 'Keep your vape pen upright to prevent leaking or clogging.',
    quiz: {
      question: 'What is the standard threading for most vape cartridges?',
      options: ['USB', 'Lightning', '510', 'Type C'],
      answer: '510'
    }
  },
  {
    id: '10',
    category: 'Product Guide',
    title: 'Concentrates Explained',
    level: 'Intermediate',
    summary: 'Concentrates are potent extracts made from cannabis flower. They contain very high levels of THC and terpenes, often appearing as wax, shatter, or oil.',
    keyPoints: [
      'Often consumed through "dabbing."',
      'Potency ranges from 60% to 99% THC.',
      'A very small amount goes a long way.',
      'Requires specialized equipment like a dab rig or puffco.'
    ],
    commonMistake: 'Trying concentrates before being comfortable with standard flower potency.',
    quickTip: 'Use a "rice grain" sized amount for your first time dabbing.',
    quiz: {
      question: 'Concentrates are generally ____ than flower.',
      options: ['Less potent', 'More potent', 'The same potency', 'Greener'],
      answer: 'More potent'
    }
  },
  {
    id: '11',
    category: 'Product Guide',
    title: 'Tinctures Explained',
    level: 'Beginner',
    summary: 'Tinctures are liquid cannabis extracts, usually alcohol or oil-based, designed to be taken under the tongue or mixed into food.',
    keyPoints: [
      'Sublingual (under tongue) absorption is very fast.',
      'Great for discrete use and precise dosing.',
      'They typically come in a glass bottle with a dropper.',
      'Can be CBD-heavy or THC-heavy.'
    ],
    commonMistake: 'Swallowing immediately rather than holding it under the tongue.',
    quickTip: 'Hold the liquid under your tongue for 60 seconds for fastest results.',
    quiz: {
      question: 'Where do you apply a tincture for the fastest effect?',
      options: ['On the skin', 'Under the tongue', 'In the eyes', 'Behind the ear'],
      answer: 'Under the tongue'
    }
  },
  {
    id: '12',
    category: 'Product Guide',
    title: 'Topicals Explained',
    level: 'Beginner',
    summary: 'Topicals are cannabis-infused lotions, balms, and oils absorbed through the skin for localized relief. They typically do not cause a "high."',
    keyPoints: [
      'Used for joint pain, muscle soreness, or skin issues.',
      'Non-psychoactive (won\'t get you high).',
      'Ideal for those wanting medicinal benefits only.',
      'Can be applied directly to the affected area.'
    ],
    commonMistake: 'Expecting a topical to provide a cerebral/mental high.',
    quickTip: 'Wash the area before applying for better absorption.',
    quiz: {
      question: 'Do most cannabis topicals get you high?',
      options: ['Yes', 'No', 'Only if you eat them', 'Only if you use a lot'],
      answer: 'No'
    }
  },

  // BUYING GUIDE
  {
    id: '13',
    category: 'Buying Guide',
    title: 'How to Read THC Percentage',
    level: 'Beginner',
    summary: 'THC percentage tells you how much of the product weight is THC. While important, it isn\'t the only measure of quality or how the high will feel.',
    keyPoints: [
      'Flower usually ranges from 15% to 30%.',
      'Concentrates can exceed 90%.',
      'High THC does not always mean a "better" high.',
      'Look at Total Cannabinoids and Terpenes too.'
    ],
    commonMistake: 'Shopping based ONLY on the highest THC number.',
    quickTip: 'A 20% THC strain with 3% terpenes often feels better than a 30% strain with none.',
    quiz: {
      question: 'What does THC percentage represent?',
      options: ['How many seeds are inside', 'The amount of THC relative to weight', 'The age of the plant', 'The price level'],
      answer: 'The amount of THC relative to weight'
    }
  },
  {
    id: '14',
    category: 'Buying Guide',
    title: 'How to Choose a Beginner Product',
    level: 'Beginner',
    summary: 'For your first time, look for high-CBD, low-THC options that provide a manageable introduction to the plant\'s effects.',
    keyPoints: [
      'Start with a 1:1 or 2:1 CBD-to-THC ratio.',
      'Low-dose gummies (2.5mg-5mg) are great for tracking behavior.',
      'Avoid high-potency concentrates or vapes initially.',
      'Ask for "mellow" or "beginner-friendly" strain recommendations.'
    ],
    commonMistake: 'Buying what your "pro" friend buys for their high tolerance.',
    quickTip: 'Tell the budtender "I am a beginner" – they are there to help!',
    quiz: {
      question: 'What is a good starting dose for an edible beginner?',
      options: ['50mg', '2.5mg - 5mg', '100mg', '10mg - 20mg'],
      answer: '2.5mg - 5mg'
    }
  },
  {
    id: '15',
    category: 'Buying Guide',
    title: 'Questions to Ask at a Dispensary',
    level: 'Beginner',
    summary: 'Budtenders are experts who help navigate the menu. Knowing the right questions to ask translates to a better purchase.',
    keyPoints: [
      '"Can I see the terpene profile for this?"',
      '"What is the harvest date?" (Freshness matters!)',
      '"What is your most popular balanced strain?"',
      '"How do you recommend I consume this product?"'
    ],
    commonMistake: 'Being afraid to ask "dumb" questions. There are none!',
    quickTip: 'Ask for the "COA" (Certificate of Analysis) if you want to see lab-test details.',
    quiz: {
      question: 'Who is the person at the dispensary who helps you choose products?',
      options: ['Plant Manager', 'Budtender', 'Groomer', 'Security Guard'],
      answer: 'Budtender'
    }
  },
  {
    id: '16',
    category: 'Buying Guide',
    title: 'Understanding Product Labels',
    level: 'Beginner',
    summary: 'Cannabis labels contain vital information including potency, lineage, batch numbers, and safety warnings required by law.',
    keyPoints: [
      'Harvest Date: When the plant was cut.',
      'Package Date: When it was put in the container.',
      'THC/CBD Content: Expressed in % or mg.',
      'Lab testing info: Proof it was tested for pesticides.'
    ],
    commonMistake: 'Ignoring the harvest date—old flower is often dry and less effective.',
    quickTip: 'Look for a QR code on the label to scan for full lab results.',
    quiz: {
      question: 'Which date on the label tells you how "fresh" the flower is?',
      options: ['Birthday', 'Harvest Date', 'Expiration Date', 'Shipping Date'],
      answer: 'Harvest Date'
    }
  },

  // CONSUMPTION
  {
    id: '17',
    category: 'Consumption',
    title: 'Smoking vs Vaping vs Edibles',
    level: 'Beginner',
    summary: 'Each delivery method changes how quickly you feel effects and how long they stay in your system.',
    keyPoints: [
      'Smoking/Vaping: Starts in seconds/minutes, lasts 1-3 hours.',
      'Edibles: Starts in 30-120 minutes, lasts 6-12 hours.',
      'Vaping is generally more flavor-focused than smoking.',
      'Edibles have a more "body-heavy" feel.'
    ],
    commonMistake: 'Treating an edible dose the same as a smoking dose.',
    quickTip: 'If you want immediate relief, inhalation (smoking/vaping) is usually best.',
    quiz: {
      question: 'Which method has the slowest onset time?',
      options: ['Vaping', 'Smoking', 'Edibles', 'Tinctures'],
      answer: 'Edibles'
    }
  },
  {
    id: '18',
    category: 'Consumption',
    title: 'How Long Do Edibles Take to Kick In?',
    level: 'Beginner',
    summary: 'Unlike smoking, edibles must be digested. This process depends on your metabolism, what you ate that day, and the product type.',
    keyPoints: [
      'Average onset is 45 to 90 minutes.',
      'Nano-emulsified "fast-acting" edibles can kick in in 15-20 mins.',
      'Full stomach = slower onset.',
      'Empty stomach = faster, but potentially more intense onset.'
    ],
    commonMistake: 'Wait at least 2 hours before deciding you need "more."',
    quickTip: 'Keep a snack nearby in case the edible takes longer than expected.',
    quiz: {
      question: 'What is the average onset time for traditional edibles?',
      options: ['1 minute', '5-10 minutes', '45-90 minutes', '4 hours'],
      answer: '45-90 minutes'
    }
  },
  {
    id: '19',
    category: 'Consumption',
    title: 'How Long Cannabis Effects Can Last',
    level: 'Beginner',
    summary: 'The duration of your "high" depends entirely on the method used. Understanding this allows you to plan your day responsibly.',
    keyPoints: [
      'Inhalation: 1-3 hours generally.',
      'Edibles: 6-12 hours, sometimes longer.',
      'Tinctures: 2-5 hours.',
      'Factors like your tolerance and hydration also play a role.'
    ],
    commonMistake: 'Assuming you\'ll be "sober" in an hour after an edible.',
    quickTip: 'Don\'t plan important meetings or driving for several hours after use.',
    quiz: {
      question: 'Which method generally lasts the shortest amount of time?',
      options: ['Smoking/Vaping', 'Edibles', 'Lotions', 'Capsules'],
      answer: 'Smoking/Vaping'
    }
  },

  // SAFETY
  {
    id: '20',
    category: 'Effects & Safety',
    title: 'What Does “Start Low, Go Slow” Mean?',
    level: 'Beginner',
    summary: 'This is the golden rule of cannabis safety. It means taking a small amount and waiting for it to fully affect you before taking more.',
    keyPoints: [
      'Helps prevent uncomfortable "too high" experiences.',
      'Allows you to find your "Minimum Effective Dose."',
      'Essential for products you haven\'t tried before.',
      'Builds confidence in your own tolerance levels.'
    ],
    commonMistake: 'Rushing into a second dose because the first "didn\'t hit" yet.',
    quickTip: 'Keep a notebook of how much you took and how it felt.',
    quiz: {
      question: 'What is the main goal of "Start Low, Go Slow"?',
      options: ['Save money', 'Avoid over-consumption', 'Get as high as possible', 'Finish the product fast'],
      answer: 'Avoid over-consumption'
    }
  },
  {
    id: '21',
    category: 'Effects & Safety',
    title: 'What to Do If You Get Too High',
    level: 'Beginner',
    summary: 'If you over-consume, remember that it is temporary. You can manage the anxiety with simple grounding techniques.',
    keyPoints: [
      'Stay hydrated and drink water.',
      'Find a comfortable, quiet place to lie down.',
      'Smelling black pepper can help ground some people.',
      'Take deep breaths; the feeling WILL pass.'
    ],
    commonMistake: 'Panicking and going to the ER—usually, sleep and water are all that is needed.',
    quickTip: 'CBD can sometimes counteract the "edgy" feeling of too much THC.',
    quiz: {
      question: 'What is the best way to handle being too intoxicated from cannabis?',
      options: ['Drink caffeine', 'Panic', 'Stay calm and hydrated', 'Take more THC'],
      answer: 'Stay calm and hydrated'
    }
  },
  {
    id: '22',
    category: 'Effects & Safety',
    title: 'Cannabis Tolerance Explained',
    level: 'Beginner',
    summary: 'Tolerance is your body’s adaptation to regular cannabis use. Over time, you may need more of a product to feel the same effects.',
    keyPoints: [
      'Frequency of use is the main driver of tolerance.',
      'A "T-Break" is taking time off to reset your system.',
      'Even 48-72 hours off can make a difference.',
      'Mixing up your strains can help prevent "strain lock."'
    ],
    commonMistake: 'Thinking your high tolerance makes you "cooler"—it just makes your medicine more expensive!',
    quickTip: 'Take a few days off every month to keep your tolerance low.',
    quiz: {
      question: 'What is a "T-Break"?',
      options: ['A tea break', 'A tolerance break', 'A time-out', 'A tincture break'],
      answer: 'A tolerance break'
    }
  },
  {
    id: '23',
    category: 'Effects & Safety',
    title: 'Responsible Cannabis Use',
    level: 'Beginner',
    summary: 'Using cannabis responsibly means respecting the law, your body, and the people around you.',
    keyPoints: [
      'Never drive or operate machinery while impaired.',
      'Keep products locked away from children and pets.',
      'Be mindful of smoke/vapor around non-users.',
      'Follow all local and state regulations.'
    ],
    commonMistake: 'Assuming it\'s safe to drive because "you feel fine."',
    quickTip: 'Treat cannabis like alcohol when it comes to coordination and public use.',
    quiz: {
      question: 'Where should cannabis products always be stored at home?',
      options: ['On the coffee table', 'In reach of pets', 'In a secure/locked place', 'Outside'],
      answer: 'In a secure/locked place'
    }
  },

  // GROWING
  {
    id: '24',
    category: 'Growing Basics',
    title: 'Seeds vs Clones',
    level: 'Beginner',
    summary: 'To start a garden, you need either seeds or clones (cuttings from a mother plant). Each has pros and cons for the beginner grower.',
    keyPoints: [
      'Seeds: Stronger taproots, but can be male/female.',
      'Clones: Guaranteed female, faster start time.',
      'Clones can inherit pests or diseases from the mother.',
      'Seeds offer more genetic variety.'
    ],
    commonMistake: 'Not realizes that "regular" seeds can result in male plants which ruin your flower crop.',
    quickTip: 'Buy "Feminized" seeds to ensure every plant produces flower.',
    quiz: {
      question: 'What is a "Clone" in cannabis growing?',
      options: ['A robotic plant', 'A cutting from a mother plant', 'A fake seed', 'A type of soil'],
      answer: 'A cutting from a mother plant'
    }
  },
  {
    id: '25',
    category: 'Growing Basics',
    title: 'Soil vs Hydroponics',
    level: 'Beginner',
    summary: 'Soil is the most forgiving for beginners, while hydroponics (growing in water) can lead to faster growth and bigger yields if managed perfectly.',
    keyPoints: [
      'Soil uses natural nutrients and buffers pH.',
      'Hydro grows faster but is less forgiving of mistakes.',
      'Soil flavor is often considered superior by purists.',
      'Hydroponics requires much more technical equipment.'
    ],
    commonMistake: 'Jumping into high-tech hydro before understanding basic plant health in soil.',
    quickTip: 'Start with a high-quality "living soil" for your first grow.',
    quiz: {
      question: 'Which method is typically easier for a beginner?',
      options: ['Deep Water Culture', 'Soil', 'Aeroponics', 'Fogponics'],
      answer: 'Soil'
    }
  },
  {
    id: '26',
    category: 'Growing Basics',
    title: 'Basic Cannabis Watering Mistakes',
    level: 'Beginner',
    summary: 'Watering is the most common place where beginners fail. Both over-watering and under-watering can kill your plants.',
    keyPoints: [
      'Over-watering leads to root rot.',
      'Under-watering causes wilting and nutrient lock.',
      'Wait until the top inch of soil is dry before watering.',
      'Make sure your pots have drainage holes!'
    ],
    commonMistake: 'Watering on a schedule (like "every Monday") rather than when the plant needs it.',
    quickTip: 'Lift the pot—if it feels light, it needs water!',
    quiz: {
      question: 'What is the most common watering mistake?',
      options: ['Using cold water', 'Over-watering', 'Watering at night', 'Using rain water'],
      answer: 'Over-watering'
    }
  },
  {
    id: '27',
    category: 'Growing Basics',
    title: 'Basic Harvesting Concepts',
    level: 'Beginner',
    summary: 'Harvesting is all about timing. If you cut too early, you lose potency. If you cut too late, the high becomes very sedative.',
    keyPoints: [
      'Look at the trichomes with a magnifying glass.',
      'Clear = Not ready.',
      'Milky/Cloudy = Peak THC.',
      'Amber = More sedative/CBN heavy.'
    ],
    commonMistake: 'Getting impatient and harvesting too early.',
    quickTip: 'Wait for about 10-20% of the trichomes to turn amber for the best effect.',
    quiz: {
      question: 'What color should trichomes be for peak potency?',
      options: ['Clear', 'Black', 'Cloudy/White', 'Red'],
      answer: 'Cloudy/White'
    }
  },

  // EDIBLES
  {
    id: '28',
    category: 'Edibles',
    title: 'What Is Cannabutter?',
    level: 'Beginner',
    summary: 'Cannabutter is butter infused with cannabis. It is the primary building block for making homemade edibles like brownies or cookies.',
    keyPoints: [
      'Requires "Decarboxylation" (heating to activate THC).',
      'Can be made using flower, shake, or concentrates.',
      'It should be stored in the fridge or freezer.',
      'Allows for highly customized edible strength.'
    ],
    commonMistake: 'Forgetting to "decarb" (bake the flower) before putting it in the butter.',
    quickTip: 'Use a slow cooker for a consistent, low-stress infusion process.',
    quiz: {
      question: 'What is the process of heating cannabis to "activate" the THC?',
      options: ['Freezing', 'Decarboxylation', 'Hydration', 'Fermentation'],
      answer: 'Decarboxylation'
    }
  },
  {
    id: '29',
    category: 'Edibles',
    title: 'Why Edibles Feel Stronger',
    level: 'Beginner',
    summary: 'When you eat cannabis, your liver converts THC into a compound called 11-Hydroxy-THC, which is significantly more potent and long-lasting.',
    keyPoints: [
      '11-Hydroxy-THC crosses the blood-brain barrier more easily.',
      'It creates a more intense "body" high.',
      'This is why 10mg eaten feels stronger than 10mg smoked.',
      'Effects are more immersive and multi-dimensional.'
    ],
    commonMistake: 'Thinking your smoking tolerance carries over perfectly to edibles.',
    quickTip: 'Start with half of what you think you need when trying a new edible brand.',
    quiz: {
      question: 'What compound does the liver convert Delta-9 THC into?',
      options: ['CBD', '11-Hydroxy-THC', 'Vinegar', 'Sugar'],
      answer: '11-Hydroxy-THC'
    }
  },
  {
    id: '30',
    category: 'Edibles',
    title: 'Beginner Edible Dosing Tips',
    level: 'Beginner',
    summary: 'Dosing is the key to a good experience. Most legal markets package edibles in 5mg or 10mg increments.',
    keyPoints: [
      'Standard "Low Dose" is considered 2.5mg - 5mg.',
      'Wait 2 full hours before potentially redosing.',
      'Edibles are best enjoyed in a familiar environment.',
      'If it feels too strong, try a CBD-only gummy to balance out.'
    ],
    commonMistake: 'Underestimating the "lag time" between ingestion and effect.',
    quickTip: 'Write down the time you took the edible so you don\'t lose track.',
    quiz: {
      question: 'How long should you wait before taking more of an edible?',
      options: ['5 minutes', '20 minutes', '2 hours', '10 hours'],
      answer: '2 hours'
    }
  }
];
