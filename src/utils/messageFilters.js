// src/utils/messageFilters.js

// ============================================
// PERSONAL INFO PATTERNS (REGEX)
// ============================================
const PERSONAL_INFO_PATTERNS = {
  // Email pattern
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Phone numbers (various formats)
  phone: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  
  // IP addresses
  ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  
  // URLs
  url: /\b(?:https?:\/\/|www\.)[^\s]+\.[^\s]+\b/g,
  
  // Age related words
  age: /\b(?:age|aged?|ages?|years?\s*old|y\/?o)\b/gi,
  
  // Name related words
  name: /\b(?:name|names?|called|calls?)\b/gi,
  
  // Address related words
  address: /\b(?:address|addresses?|road|rd|street|st|avenue|ave|lane|ln|drive|dr|locality|location|colony|nagar|sector|block)\b/gi,
  
  // Location indicators
  location: /\b(?:city|town|village|area|society|district|state|country)\b/gi,
  
  // Numeric patterns that might be ages (any standalone number 1-120)
  standaloneAge: /\b([1-9]|[1-9][0-9]|1[01][0-9]|120)\b/g,
  
  // Personal indicators
  personalIndicators: /\b(?:my|mine|your|our|their|i'?m|i\s+am)\b/gi,
  
  // SSN (Social Security Number)
  ssn: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
  
  // Credit Card numbers (basic pattern)
  creditCard: /\b(?:\d{4}[-.\s]?){3}\d{4}\b|\b\d{16}\b/g,
  
  // Passport numbers
  passport: /\b(?:passport|passport\s+no)[\s:]*[A-Z0-9]{6,12}\b|\b[A-Z]{1,2}\d{6,9}\b/gi,
  
  // Date of Birth
  dob: /\b(?:dob|date\s+of\s+birth|born\s+on|birth\s+date)\s*[:=\s]*\s*\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b/gi,
  
  // Full name patterns
  fullName: /\b(?:my\s+name\s+is|i'?m\s+called|call\s+me|i\s+am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/gi
};

// ============================================
// NSFW PATTERNS (INAPPROPRIATE CONTENT)
// ============================================
const NSFW_PATTERNS = {
  // Violence and killing
  violence: /\b(?:kill|kills|killed|killing|murder|murders|murdered|murdering|die|dies|died|dying|death|dead|shoot|shoots|shot|shooting|stab|stabs|stabbed|stabbing|attack|attacks|attacked|attacking|fight|fights|fighting|beat|beats|beating|hit|hits|hitting|punch|punches|punching|slap|slaps|slapping|torture|tortures|tortured|torturing|massacre|slaughter|execute|execution|hanging|strangle|suffocate|drown|poison)\b/gi,
  
  // Weapons and harmful objects
  weapons: /\b(?:gun|guns|pistol|rifle|shotgun|knife|knives|sword|blade|bomb|bombs|explosive|dynamite|grenade|weapon|weapons|ammo|ammunition|bullet|bullets|missile|rocket|tank|canon|army|military)\b/gi,
  
  // Explicit sexual terms - Level 1 (extreme)
  explicitSexualExtreme: /\b(?:fuck|fucking|fucked|motherfucker|motherfucking|cunt|dick|pussy|asshole|bitch|whore|slut|bastard|cocksucker|blowjob|handjob|rimjob|bdsm|gangbang|incest|rape|raping|raped|molest|molesting|molested|pedo|pedophile|child\s*porn)\b/gi,
  
  // Explicit sexual terms - Level 2 (moderate)
  explicitSexualModerate: /\b(?:porn|porno|pornography|xxx|sex|sexy|sexual|naked|nude|horny|orgasm|masturbate|masturbation|penis|vagina|breast|boobs|tits|ass|butt|genitals|erection|ejaculate|semen|prostitute|escort|hooker|stripper|strip\s*club|onlyfans)\b/gi,
  
  // Harassment and bullying
  harassment: /\b(?:stupid|idiot|dumb|moron|loser|pathetic|worthless|annoying|hate|hating|despise|disgusting|ugly|fat|obese|retard|retarded|dwarf|midget|cripple|lame|dumbass|dipshit|shithead|asshat|jackass|douchebag|assbag)\b/gi,
  
  // Spam/promotional
  spam: /\b(?:viagra|cialis|levitra|casino|lottery|winner|prize|click\s*here|subscribe|earn\s*money|work\s*from\s*home|investment|bitcoin|crypto|forex|trading|gambling|bet|betting|poker|blackjack|roulette|slot\s*machine)\b/gi,
  
  // Racial slurs and hate speech
  racialSlurs: /\b(?:nigger|nigga|spic|chink|gook|kike|wetback|cracker|honky|paki|raghead|towelhead|sandnigger|coon|jigaboo|darkie|redskin|white\s*trash|gyp|gypsy|jew|kraut|nip)\b/gi,
  
  // Threatening language
  threats: /\b(?:i\s+will\s+kill|i'?m\s+going\s+to\s+kill|i'll\s+kill|want\s+to\s+kill|going\s+to\s+hurt|going\s+to\s+attack|going\s+to\s+beat|going\s+to\s+shoot|going\s+to\s+stab|better\s+watch\s+out|you'?re\s+dead|your\s+end\s+is\s+near|payback\s+time|get\s+revenge)\b/gi,
  
  // Self-harm and suicide
  selfHarm: /\b(?:kill\s+myself|end\s+my\s+life|commit\s+suicide|suicidal|self-harm|hurt\s+myself|cut\s+myself|hang\s+myself|jump\s+off|overdose|take\s+my\s+life|don't\s+want\s+to\s+live|better\s+off\s+dead|wish\s+i\s+was\s+dead)\b/gi,
  
  // Drug-related
  drugs: /\b(?:weed|marijuana|cannabis|cocaine|coke|crack|heroin|meth|amphetamine|lsd|acid|ecstasy|mdma|opium|morphine|oxycontin|xanax|valium|diazepam|adderall|drugs|narcotics|substance\s*abuse|get\s+high|getting\s+high|trip|tripping|stoned|drunk|alcohol|beer|wine|whiskey|vodka|gin|rum)\b/gi,
  
  // Gore and disturbing content
  gore: /\b(?:gore|blood|bleed|bleeding|corpse|cadaver|dismember|dismemberment|decapitate|decapitation|behead|beheading|mutilate|mutilation|skeleton|skull|bloodbath|bloodshed|bloody|guts|intestines|organ\s*harvest)\b/gi
};

// ============================================
// SAFE WORDS (to prevent false positives)
// ============================================
const SAFE_WORDS = new Set([
  // Common words that might trigger false positives
  'message', 'manage', 'manager', 'image', 'damage', 'package',
  'village', 'voltage', 'postage', 'average', 'storage', 'heritage',
  'advantage', 'percentage', 'coverage', 'mileage', 'language',
  'department', 'skill', 'skilled', 'skills', 'killer', 'killing', // 'killer' and 'killing' might be problematic
  'shooting', 'shoot', 'shot', // These might be sports-related
  'fighting', 'fight', // These might be sports-related
  'beating', 'beat', // These might be music/sports-related
  'punch', 'punching', // These might be sports-related
  'hit', 'hitting', // These might be sports/music-related
  'attack', 'attacking', // These might be sports/gaming-related
  'gun', // This might be a brand name
  'army', // This might be a brand or organization name
  'tank', // This might be a vehicle or gaming term
  'bomb', // This might be a gaming term
  'missile', // This might be a gaming term
  'rocket', // This might be a gaming or space term
  'sex', // This might be a biological term (sex determination, etc.)
  'sexual' // This might be a biological/educational term
]);

// ============================================
// WARNING MESSAGES
// ============================================
const VIOLATION_MESSAGES = {
  // Personal info warnings
  age: "⛔ Please don't mention your age. Keep your age private.",
  name: "⛔ Please don't mention names. Use anonymous terms only.",
  address: "⛔ Please don't share any location or address details.",
  location: "⛔ Please don't share your location for privacy reasons.",
  personalInfo: "⛔ Personal information detected. Please keep the conversation anonymous.",
  email: "⛔ Email addresses are not allowed for privacy reasons.",
  phone: "⛔ Phone numbers are not allowed for privacy reasons.",
  ipAddress: "⛔ IP addresses are not allowed.",
  ssn: "⛔ Social Security Numbers are not allowed.",
  creditCard: "⛔ Credit card information is not allowed.",
  passport: "⛔ Passport information is not allowed.",
  dob: "⛔ Date of birth is not allowed for privacy reasons.",
  
  // NSFW warnings
  violence: "⚠️ Violent content is not allowed in this chat. Please keep conversations peaceful.",
  weapons: "⚠️ Discussions about weapons are not allowed in this chat.",
  explicitSexualExtreme: "🔞 Extreme inappropriate content detected. This is strictly prohibited.",
  explicitSexualModerate: "🔞 Inappropriate content detected. Please keep the chat clean and respectful.",
  harassment: "🚫 Harassment and bullying are not allowed. Please be respectful to others.",
  spam: "📢 Promotional or spam content is not allowed.",
  racialSlurs: "🚫 Racial slurs and hate speech are strictly prohibited.",
  threats: "⚠️ Threatening language is not allowed and may result in immediate ban.",
  selfHarm: "🆘 If you're struggling, please reach out to a mental health professional. This chat is not equipped for crisis support. National Suicide Prevention Lifeline: 988",
  drugs: "⚠️ Discussions about drugs and substance abuse are not allowed.",
  gore: "⚠️ Disturbing or gory content is not allowed.",
  nsfw: "⚠️ Inappropriate content detected. Please keep the conversation appropriate for all ages."
};

// ============================================
// FILTER FUNCTIONS
// ============================================

// Function to check if text contains safe words
const containsSafeWords = (text) => {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  
  for (const word of words) {
    if (SAFE_WORDS.has(word)) {
      return true; // Contains safe word
    }
  }
  
  return false;
};

// Function to check for personal info violations
const checkPersonalInfo = (text) => {
  const violations = [];
  const lowerText = text.toLowerCase();
  
  for (const [type, pattern] of Object.entries(PERSONAL_INFO_PATTERNS)) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      violations.push(type);
    }
  }
  
  return violations;
};

// Function to check for NSFW violations
const checkNSFW = (text) => {
  const violations = [];
  const lowerText = text.toLowerCase();
  
  for (const [type, pattern] of Object.entries(NSFW_PATTERNS)) {
    pattern.lastIndex = 0;
    if (pattern.test(lowerText)) {
      violations.push(type);
    }
  }
  
  return violations;
};

// Function to get appropriate warning message based on violations
const getWarningMessage = (personalViolations, nsfwViolations) => {
  // Priority order: Most severe first
  
  // Self-harm takes highest priority
  if (nsfwViolations.includes('selfHarm')) {
    return VIOLATION_MESSAGES.selfHarm;
  }
  
  // Threats are very serious
  if (nsfwViolations.includes('threats')) {
    return VIOLATION_MESSAGES.threats;
  }
  
  // Racial slurs are extremely offensive
  if (nsfwViolations.includes('racialSlurs')) {
    return VIOLATION_MESSAGES.racialSlurs;
  }
  
  // Extreme sexual content
  if (nsfwViolations.includes('explicitSexualExtreme')) {
    return VIOLATION_MESSAGES.explicitSexualExtreme;
  }
  
  // Gore
  if (nsfwViolations.includes('gore')) {
    return VIOLATION_MESSAGES.gore;
  }
  
  // Violence
  if (nsfwViolations.includes('violence')) {
    return VIOLATION_MESSAGES.violence;
  }
  
  // Weapons
  if (nsfwViolations.includes('weapons')) {
    return VIOLATION_MESSAGES.weapons;
  }
  
  // Harassment
  if (nsfwViolations.includes('harassment')) {
    return VIOLATION_MESSAGES.harassment;
  }
  
  // Drugs
  if (nsfwViolations.includes('drugs')) {
    return VIOLATION_MESSAGES.drugs;
  }
  
  // Moderate sexual content
  if (nsfwViolations.includes('explicitSexualModerate')) {
    return VIOLATION_MESSAGES.explicitSexualModerate;
  }
  
  // Spam
  if (nsfwViolations.includes('spam')) {
    return VIOLATION_MESSAGES.spam;
  }
  
  // If any other NSFW violations
  if (nsfwViolations.length > 0) {
    return VIOLATION_MESSAGES.nsfw;
  }
  
  // Personal info violations (lower priority)
  if (personalViolations.includes('ssn') || personalViolations.includes('creditCard')) {
    return VIOLATION_MESSAGES.creditCard;
  }
  
  if (personalViolations.includes('passport')) {
    return VIOLATION_MESSAGES.passport;
  }
  
  if (personalViolations.includes('dob')) {
    return VIOLATION_MESSAGES.dob;
  }
  
  if (personalViolations.includes('email')) {
    return VIOLATION_MESSAGES.email;
  }
  
  if (personalViolations.includes('phone')) {
    return VIOLATION_MESSAGES.phone;
  }
  
  if (personalViolations.includes('ipAddress')) {
    return VIOLATION_MESSAGES.ipAddress;
  }
  
  if (personalViolations.includes('address') || personalViolations.includes('location')) {
    return VIOLATION_MESSAGES.address;
  }
  
  if (personalViolations.includes('age') || personalViolations.includes('standaloneAge')) {
    return VIOLATION_MESSAGES.age;
  }
  
  if (personalViolations.includes('name') || personalViolations.includes('fullName')) {
    return VIOLATION_MESSAGES.name;
  }
  
  if (personalViolations.length > 0) {
    return VIOLATION_MESSAGES.personalInfo;
  }
  
  return null;
};

// Main filter function
export const filterMessage = (text) => {
  // Trim the text
  const trimmedText = text.trim();
  
  // Check for safe words first (if it's a safe word, allow it)
  if (containsSafeWords(trimmedText)) {
    return {
      isAllowed: true,
      violations: [],
      warningMessage: null,
      detectedType: 'safe'
    };
  }
  
  // Check for violations
  const personalViolations = checkPersonalInfo(trimmedText);
  const nsfwViolations = checkNSFW(trimmedText);
  
  const allViolations = [...personalViolations, ...nsfwViolations];
  
  if (allViolations.length > 0) {
    const warningMessage = getWarningMessage(personalViolations, nsfwViolations);
    
    return {
      isAllowed: false,
      violations: allViolations,
      warningMessage: warningMessage,
      detectedType: nsfwViolations.length > 0 ? 'nsfw' : 'personal'
    };
  }
  
  return {
    isAllowed: true,
    violations: [],
    warningMessage: null,
    detectedType: 'clean'
  };
};

// Function to check message without blocking (for logging/monitoring)
export const checkMessage = (text) => {
  const personalViolations = checkPersonalInfo(text);
  const nsfwViolations = checkNSFW(text);
  
  return {
    hasPersonalInfo: personalViolations.length > 0,
    hasNSFW: nsfwViolations.length > 0,
    personalViolations: personalViolations,
    nsfwViolations: nsfwViolations,
    allViolations: [...personalViolations, ...nsfwViolations]
  };
};

// Test function to verify patterns
export const testPatterns = () => {
  const testCases = [
    // Personal info tests
    "my age is 10",
    "age",
    "aged",
    "name",
    "what is the name of the department",
    "road",
    "10th avenue road, gandhi street, chennai",
    "ip address",
    "my email is test@example.com",
    "call me at 555-123-4567",
    "my SSN is 123-45-6789",
    "credit card 4111-1111-1111-1111",
    "amirtha",
    
    // NSFW tests - Violence
    "kill",
    "kills",
    "killed",
    "i will kill you",
    "murder",
    "die",
    "death",
    "shoot",
    "stab",
    "attack",
    "fight",
    "beat",
    "hit",
    
    // NSFW tests - Weapons
    "gun",
    "knife",
    "bomb",
    "weapon",
    
    // NSFW tests - Sexual content
    "fuck",
    "shit",
    "bitch",
    "porn",
    "sex",
    "naked",
    "horny",
    
    // NSFW tests - Harassment
    "stupid",
    "idiot",
    "dumb",
    "moron",
    "loser",
    
    // NSFW tests - Spam
    "viagra",
    "casino",
    "lottery",
    "earn money",
    
    // NSFW tests - Racial slurs
    "nigger",
    "spic",
    
    // NSFW tests - Threats
    "i'm going to kill you",
    "you're dead",
    
    // NSFW tests - Self-harm
    "kill myself",
    "suicidal",
    
    // NSFW tests - Drugs
    "weed",
    "cocaine",
    "get high",
    
    // Safe words
    "message",
    "package",
    "village",
    "skills",
    "killing time", // This might be borderline
    "shooting game", // This might be borderline
    "fighting game" // This might be borderline
  ];
  
  console.log("=== TESTING COMPLETE MESSAGE FILTERS ===\n");
  
  testCases.forEach(test => {
    const result = filterMessage(test);
    if (!result.isAllowed) {
      console.log(`❌ BLOCKED: "${test}"`);
      console.log(`   Type: ${result.detectedType}`);
      console.log(`   Violations: ${result.violations.join(', ')}`);
      console.log(`   Reason: ${result.warningMessage}\n`);
    } else {
      console.log(`✅ ALLOWED: "${test}"\n`);
    }
  });
};

// Export all patterns for reference (optional)
export const patterns = {
  personalInfo: PERSONAL_INFO_PATTERNS,
  nsfw: NSFW_PATTERNS,
  safeWords: Array.from(SAFE_WORDS)
};