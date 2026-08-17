/**
 * Language Detection Utility for Tamil and English
 * Supports both script-based and keyword-based detection
 */

// Tamil Unicode range: \u0B80-\u0BFF
const TAMIL_UNICODE_RANGE = /[\u0B80-\u0BFF]/;

// Common Tamil words and phrases for detection even in Roman script
const TAMIL_KEYWORDS = {
  greetings: ['vanakkam', 'namaste', 'enna', 'eppadi', 'sollunga'],
  questions: ['enna', 'eppadi', 'enga', 'yaaru', 'edhuku', 'evvalavu', 'sollu', 'theriyuma'],
  solar: ['solar', 'sooriya', 'minnal', 'mazhai', 'veesam'],
  numbers: ['ondru', 'rendu', 'moondru', 'naangu', 'ainthu', 'aaru', 'ezhu', 'ettu', 'onpathu', 'pathu'],
  common: ['illai', 'irukku', 'venum', 'kuduga', 'pannunga', 'sari', 'nalla', 'romba', 'konjam'],
  pronouns: ['naan', 'nee', 'avan', 'aval', 'avar', 'nanga', 'neenga'],
  time: ['inniki', 'nalaiku', 'netru', 'ipo', 'apram', 'munadi'],
  affirmative: ['aama', 'seri', 'ok', 'sari', 'nalladhu'],
  negative: ['illa', 'koodadhu', 'mudiyadhu', 'vendam']
};

// Collect all Tamil keywords
const ALL_TAMIL_KEYWORDS = new Set([
  ...TAMIL_KEYWORDS.greetings,
  ...TAMIL_KEYWORDS.questions,
  ...TAMIL_KEYWORDS.solar,
  ...TAMIL_KEYWORDS.numbers,
  ...TAMIL_KEYWORDS.common,
  ...TAMIL_KEYWORDS.pronouns,
  ...TAMIL_KEYWORDS.time,
  ...TAMIL_KEYWORDS.affirmative,
  ...TAMIL_KEYWORDS.negative
]);

// English patterns that indicate English language
const ENGLISH_PATTERNS = {
  greetings: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
  questions: ['what', 'when', 'where', 'who', 'why', 'how', 'which', 'can', 'could', 'would', 'will', 'do', 'does', 'is', 'are'],
  solar: ['solar', 'panel', 'inverter', 'battery', 'installation', 'subsidy', 'price', 'cost', 'watt', 'kilowatt', 'kw'],
  common: ['please', 'thank', 'thanks', 'sorry', 'yes', 'no', 'ok', 'okay', 'help', 'need', 'want']
};

/**
 * Detect if text contains Tamil Unicode characters
 */
export const hasTamilUnicode = (text) => {
  return TAMIL_UNICODE_RANGE.test(text);
};

/**
 * Detect if text uses Roman script but contains Tamil words
 */
export const hasTamilKeywords = (text) => {
  const lowercaseText = text.toLowerCase();
  const words = lowercaseText.split(/\s+/);
  
  let tamilWordCount = 0;
  for (const word of words) {
    // Remove punctuation
    const cleanWord = word.replace(/[^\w]/g, '');
    if (ALL_TAMIL_KEYWORDS.has(cleanWord)) {
      tamilWordCount++;
    }
  }
  
  // If more than 20% of words are Tamil keywords, consider it Tamil
  return words.length > 0 && (tamilWordCount / words.length) > 0.2;
};

/**
 * Detect language of the text
 * @returns {'ta' | 'en' | 'unknown'}
 */
export const detectLanguage = (text) => {
  if (!text || text.trim().length === 0) {
    return 'unknown';
  }
  
  // Check for Tamil Unicode first (most reliable)
  if (hasTamilUnicode(text)) {
    return 'ta';
  }
  
  // Check for Tamil keywords in Roman script
  if (hasTamilKeywords(text)) {
    return 'ta';
  }
  
  // Default to English if it has any English patterns or alphabets
  const hasAlphabets = /[a-zA-Z]/.test(text);
  if (hasAlphabets) {
    return 'en';
  }
  
  // If it has numbers but no alphabets, check for digits
  if (/\d/.test(text)) {
    return 'en'; // Numbers are typically handled in English context
  }
  
  return 'unknown';
};

/**
 * Get language confidence score (0-1)
 */
export const getLanguageConfidence = (text) => {
  if (!text) return 0;
  
  let confidence = 0;
  
  // Check Tamil Unicode
  if (hasTamilUnicode(text)) {
    const tamilCharCount = (text.match(TAMIL_UNICODE_RANGE) || []).length;
    const totalChars = text.replace(/\s/g, '').length;
    confidence = Math.min(1, tamilCharCount / totalChars);
    return confidence;
  }
  
  // Check Tamil keywords
  if (hasTamilKeywords(text)) {
    const lowercaseText = text.toLowerCase();
    const words = lowercaseText.split(/\s+/);
    let tamilWordCount = 0;
    
    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (ALL_TAMIL_KEYWORDS.has(cleanWord)) {
        tamilWordCount++;
      }
    }
    
    confidence = Math.min(1, tamilWordCount / (words.length || 1));
    return confidence;
  }
  
  // Check English patterns
  const lowercaseText = text.toLowerCase();
  let englishPatternCount = 0;
  let totalPatterns = 0;
  
  for (const category of Object.values(ENGLISH_PATTERNS)) {
    for (const pattern of category) {
      totalPatterns++;
      if (lowercaseText.includes(pattern)) {
        englishPatternCount++;
      }
    }
  }
  
  confidence = totalPatterns > 0 ? Math.min(1, englishPatternCount / totalPatterns) : 0.5;
  
  return confidence;
};

/**
 * Translate common phrases between Tamil and English
 * Useful for providing bilingual responses
 */
export const translatePhrase = (phrase, fromLang, toLang) => {
  const translations = {
    'hello': { ta: 'வணக்கம்', en: 'hello' },
    'thank you': { ta: 'நன்றி', en: 'thank you' },
    'yes': { ta: 'ஆம்', en: 'yes' },
    'no': { ta: 'இல்லை', en: 'no' },
    'price': { ta: 'விலை', en: 'price' },
    'cost': { ta: 'செலவு', en: 'cost' },
    'solar': { ta: 'சூரிய சக்தி', en: 'solar' },
    'panel': { ta: 'பேனல்', en: 'panel' },
    'battery': { ta: 'பேட்டரி', en: 'battery' },
    'inverter': { ta: 'இன்வெர்ட்டர்', en: 'inverter' },
    'installation': { ta: 'நிறுவல்', en: 'installation' },
    'subsidy': { ta: 'மானியம்', en: 'subsidy' },
    'warranty': { ta: 'உத்தரவாதம்', en: 'warranty' },
    'maintenance': { ta: 'பராமரிப்பு', en: 'maintenance' },
    'how much': { ta: 'எவ்வளவு', en: 'how much' },
    'when': { ta: 'எப்போது', en: 'when' },
    'where': { ta: 'எங்கே', en: 'where' },
    'help': { ta: 'உதவி', en: 'help' },
    'contact': { ta: 'தொடர்பு', en: 'contact' },
    'address': { ta: 'முகவரி', en: 'address' },
    'phone': { ta: 'தொலைபேசி', en: 'phone' },
    'email': { ta: 'மின்னஞ்சல்', en: 'email' }
  };
  
  const lowerPhrase = phrase.toLowerCase();
  
  for (const [key, value] of Object.entries(translations)) {
    if (lowerPhrase.includes(key)) {
      return value[toLang] || phrase;
    }
  }
  
  return phrase;
};

/**
 * Get appropriate greeting based on language and time of day
 */
export const getGreeting = (language = 'en', name = '') => {
  const hour = new Date().getHours();
  let timeGreeting = '';
  
  if (language === 'ta') {
    if (hour < 12) timeGreeting = 'காலை வணக்கம்';
    else if (hour < 18) timeGreeting = 'மதிய வணக்கம்';
    else timeGreeting = 'மாலை வணக்கம்';
    
    return name ? `${timeGreeting} ${name}!` : `${timeGreeting}!`;
  } else {
    if (hour < 12) timeGreeting = 'Good Morning';
    else if (hour < 18) timeGreeting = 'Good Afternoon';
    else timeGreeting = 'Good Evening';
    
    return name ? `${timeGreeting}, ${name}!` : `${timeGreeting}!`;
  }
};

/**
 * Get solar-specific vocabulary in the desired language
 */
export const getSolarVocabulary = (language = 'en') => {
  const vocabulary = {
    en: {
      solarPanel: 'Solar Panel',
      inverter: 'Inverter',
      battery: 'Battery',
      installation: 'Installation',
      subsidy: 'Subsidy',
      maintenance: 'Maintenance',
      warranty: 'Warranty',
      onGrid: 'On-Grid System',
      offGrid: 'Off-Grid System',
      hybrid: 'Hybrid System'
    },
    ta: {
      solarPanel: 'சூரிய பேனல்',
      inverter: 'இன்வெர்ட்டர்',
      battery: 'பேட்டரி',
      installation: 'நிறுவல்',
      subsidy: 'மானியம்',
      maintenance: 'பராமரிப்பு',
      warranty: 'உத்தரவாதம்',
      onGrid: 'ஆன்-கிரிட் அமைப்பு',
      offGrid: 'ஆஃப்-கிரிட் அமைப்பு',
      hybrid: 'கலப்பின அமைப்பு'
    }
  };
  
  return vocabulary[language] || vocabulary.en;
};

/**
 * Format numbers with Indian numbering system and language-appropriate separators
 */
export const formatNumberWithLanguage = (number, language = 'en') => {
  const formatted = new Intl.NumberFormat('en-IN').format(number);
  
  if (language === 'ta') {
    // Convert English digits to Tamil digits if needed
    const tamilDigits = {
      '0': '௦', '1': '௧', '2': '௨', '3': '௩', '4': '௪',
      '5': '௫', '6': '௬', '7': '௭', '8': '௮', '9': '௯'
    };
    
    return formatted.replace(/\d/g, (digit) => tamilDigits[digit] || digit);
  }
  
  return formatted;
};

/**
 * Detect if user is asking for a calculation
 */
export const isCalculationQuery = (text) => {
  const calcKeywords = {
    en: ['calculate', 'compute', 'how much', 'what is', 'estimate', 'cost of', 'price for', 'units', 'bill amount'],
    ta: ['கணக்கிடு', 'எவ்வளவு', 'விலை', 'செலவு', 'யூனிட்', 'பில்']
  };
  
  const lowerText = text.toLowerCase();
  
  for (const keyword of calcKeywords.en) {
    if (lowerText.includes(keyword)) return true;
  }
  
  for (const keyword of calcKeywords.ta) {
    if (lowerText.includes(keyword)) return true;
  }
  
  return false;
};

/**
 * Extract numerical values from text (handles both Tamil and English digits)
 */
export const extractNumbers = (text) => {
  // Convert Tamil digits to Arabic if present
  const tamilToArabic = {
    '௦': '0', '௧': '1', '௨': '2', '௩': '3', '௪': '4',
    '௫': '5', '௬': '6', '௭': '7', '௮': '8', '௯': '9'
  };
  
  let normalizedText = text;
  for (const [tamil, arabic] of Object.entries(tamilToArabic)) {
    normalizedText = normalizedText.replace(new RegExp(tamil, 'g'), arabic);
  }
  
  const numbers = normalizedText.match(/\d+(?:\.\d+)?/g);
  return numbers ? numbers.map(Number) : [];
};

// Export default object for easy importing
export default {
  detectLanguage,
  getLanguageConfidence,
  translatePhrase,
  getGreeting,
  getSolarVocabulary,
  formatNumberWithLanguage,
  isCalculationQuery,
  extractNumbers,
  hasTamilUnicode,
  hasTamilKeywords
};