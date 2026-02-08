/**
 * Comprehensive Sports List
 * Includes all sports from Olympics, Commonwealth Games, Asian Games, and KIYG
 * Plus eSports category
 */

// All sports in alphabetical order
export const ALL_SPORTS = [
  // A
  'Archery',
  'Athletics',
  'Atya Patya',
  
  // B
  'Badminton',
  'Basketball',
  'Basketball 3x3',
  'Beach Volleyball',
  'Bmx Freestyle, Racing',
  'Boxing',
  'Breaking',
  
  // C
  'Canoe Slalom, Sprint',
  'Chess',
  'Cricket',
  'Cultural Activities',
  'Cycling Track',
  
  // D
  'Dance Sports',
  'Diving',

  // E
  'Esports',
  
  // F
  'Football',
  
  // G
  'Golf',
  'Gymnastics (Rhythmic, Artistic, trampoline)',
  
  // H
  'Handball',
  'Hockey',
  
  // J
  'Judo',
  'Jump Rope',
  
  // K
  'Kabaddi',
  'Karate',
  'Kho Kho',
  'Kick Boxing',
  
  // M
  'Modern Pentathlon',
  'Mountain Biking',
  
  // P
  'Physical Education & Sports Sciences',
  
  // R
  'Road Cycling',
  'Rowing',
  'Rugby',
  
  // S
  'Sailing',
  'Shooting',
  'Silambam',
  'Skateboarding',
  'Skating',
  'Sport Climbing',
  'Surfing',
  'Swimming (Artistic, Marathon, Regular)',
  
  // T
  'Table Tennis',
  'Taekwondo',
  'Tennis',
  'Tennis Cricket',
  'Throwball',
  'Triathlon',
  'Tug Of War',
  
  // V
  'Volleyball',
  
  // W
  'Water Polo',
  'Weightlifting',
  'Wrestling',
  'Wushu',
  
  // Y
  'Yogasana'
];

// Sports organized by category
export const SPORTS_BY_CATEGORY = {
  'Olympic Sports': [
    'Archery',
    'Athletics',
    'Badminton',
    'Basketball',
    'Basketball 3x3',
    'Beach Volleyball',
    'Boxing',
    'Breaking',
    'Canoe Slalom, Sprint',
    'Cycling Track',
    'Diving',
    'Football',
    'Golf',
    'Gymnastics (Rhythmic, Artistic, trampoline)',
    'Handball',
    'Hockey',
    'Judo',
    'Karate',
    'Modern Pentathlon',
    'Road Cycling',
    'Rowing',
    'Rugby',
    'Sailing',
    'Shooting',
    'Skateboarding',
    'Sport Climbing',
    'Surfing',
    'Swimming (Artistic, Marathon, Regular)',
    'Table Tennis',
    'Taekwondo',
    'Tennis',
    'Triathlon',
    'Volleyball',
    'Water Polo',
    'Weightlifting',
    'Wrestling'
  ],
  
  'Traditional / Regional Sports': [
    'Atya Patya',
    'Kabaddi',
    'Kho Kho',
    'Silambam',
    'Wushu',
    'Yogasana'
  ],
  
  'Combat Sports': [
    'Boxing',
    'Breaking',
    'Judo',
    'Karate',
    'Kick Boxing',
    'Taekwondo',
    'Wrestling',
    'Wushu'
  ],
  
  'Water Sports': [
    'Canoe Slalom, Sprint',
    'Diving',
    'Rowing',
    'Sailing',
    'Swimming (Artistic, Marathon, Regular)',
    'Water Polo'
  ],
  
  'Team Sports': [
    'Basketball',
    'Basketball 3x3',
    'Beach Volleyball',
    'Cricket',
    'Football',
    'Handball',
    'Hockey',
    'Kabaddi',
    'Rugby',
    'Tennis Cricket',
    'Throwball',
    'Volleyball',
    'Water Polo'
  ],
  
  'Individual Sports': [
    'Archery',
    'Athletics',
    'Badminton',
    'Boxing',
    'Chess',
    'Cycling Track',
    'Diving',
    'Golf',
    'Gymnastics (Rhythmic, Artistic, trampoline)',
    'Judo',
    'Karate',
    'Road Cycling',
    'Shooting',
    'Skateboarding',
    'Skating',
    'Sport Climbing',
    'Surfing',
    'Swimming (Artistic, Marathon, Regular)',
    'Table Tennis',
    'Taekwondo',
    'Tennis',
    'Triathlon',
    'Weightlifting',
    'Wrestling'
  ],
  
  'Mind Sports': [
    'Chess'
  ],
  
  'Cycling Sports': [
    'Bmx Freestyle, Racing',
    'Cycling Track',
    'Mountain Biking',
    'Road Cycling'
  ],
  
  'Cultural & Educational': [
    'Cultural Activities',
    'Dance Sports',
    'Physical Education & Sports Sciences'
  ],

  'Esports': [
    'Esports'
  ],
  
  'Other Sports': [
    'Jump Rope',
    'Tug Of War'
  ]
};

// Popular sports (most commonly used)
export const POPULAR_SPORTS = [
  'Football',
  'Cricket',
  'Basketball',
  'Tennis',
  'Badminton',
  'Volleyball',
  'Hockey',
  'Athletics',
  'Swimming (Artistic, Marathon, Regular)',
  'Table Tennis',
  'Boxing',
  'Wrestling',
  'Kabaddi',
  'Archery',
  'Cycling Track',
  'Gymnastics (Rhythmic, Artistic, trampoline)',
  'Golf',
  'Shooting',
  'Weightlifting',
  'Taekwondo',
  'Karate',
  'Judo'
];

// Sort alphabetically for easy selection
export const SORTED_SPORTS = [...ALL_SPORTS].sort((a, b) => 
  a.localeCompare(b, undefined, { sensitivity: 'base' })
);

// Default export - all sports sorted
export default SORTED_SPORTS;

