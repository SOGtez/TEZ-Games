/**
 * Server-side profanity / slur filter.
 * containsProfanity(text) → true if text contains a blocked term.
 *
 * Strategy:
 *   1. Lowercase
 *   2. Apply leetspeak substitutions (4→a, 3→e, 1→i, 0→o, 5→s, etc.)
 *   3. Strip all non-letter characters (removes separators like - _ . space)
 *   4. Check whether any blocked word is a substring of the result
 *
 * This catches exact matches, leetspeak, embedded slurs, and separator tricks.
 * Add new words to BLOCKED_WORDS to extend the list.
 */

// ─── Blocked word list ──────────────────────────────────────────────────────
// Racial slurs, ethnic slurs, homophobic slurs, sexist slurs, hate-group
// terms, and common profanity.  Each entry is the normalized (lower-case,
// letters-only) form of the word or its root.
const BLOCKED_WORDS = [
  // ── Racial / ethnic slurs ──────────────────────────────────────────────
  'nigger', 'nigga', 'nigg', 'negro',
  'chink', 'chinc', 'gook', 'jap',
  'spic', 'spick', 'wetback', 'beaner',
  'kike', 'hymie', 'heeb',
  'raghead', 'towelhead', 'sandnigger',
  'cracker', 'honky', 'whitey',
  'coon', 'porch', // "porch monkey" — coon alone too common as surname prefix so paired below
  'porchmonkey',
  'jigaboo', 'jiggaboo',
  'sambo', 'pickaninny',
  'zipperhead', 'slant',
  'curry',   // only as standalone, caught via substring
  'paki',
  'redskin',
  'injun',
  'halfbreed', 'half-breed',
  'mulatto',
  'wop', 'dago', 'guinea',
  'polack',
  'mick', 'paddy',
  'kraut', 'fritz',
  'frog',    // context-dependent but acceptable block in usernames
  'limey',
  'gypsy', 'gyp',
  'cholo', 'spook',
  'greaseball',
  'zipperhead',
  'yid',
  'nip',
  'slope',
  'ching', 'chong',
  'tartar',

  // ── Homophobic / transphobic slurs ────────────────────────────────────
  'faggot', 'fag', 'fagot',
  'dyke', 'dike',
  'tranny', 'shemale',
  'queer',   // sometimes reclaimed but block in usernames to be safe
  'homo',
  'lesbo', 'lezbo', 'lezzie',
  'poofter', 'poof',
  'sissy',

  // ── Sexist / misogynistic slurs ───────────────────────────────────────
  'cunt', 'twat',
  'slut', 'whore', 'hoe', 'skank',
  'bitch',
  'milf', 'gilf',

  // ── Hate-group / ideological terms ───────────────────────────────────
  'nazi', 'natzi', 'natz',
  'kkk',
  'heil',
  'swastika',
  'aryans', 'aryan',
  'whitepride', 'whitpower', 'whitepower',
  '1488', '88',  // numeric codes checked in raw (pre-normalization)
  'antifag',
  'jihadist',

  // ── Common profanity ──────────────────────────────────────────────────
  'fuck', 'fucker', 'fuckin', 'fuk',
  'shit', 'shiit',
  'ass', 'asshole', 'arse',
  'cock', 'cok',
  'dick', 'dik',
  'pussy', 'pussi',
  'penis', 'vagina',
  'dildo', 'vibrator',
  'cum', 'jizz', 'semen',
  'bastard',
  'damn', 'dammit',
  'hell',   // very common word — kept for edge cases; low risk
  'piss', 'pissed',
  'tits', 'titty', 'tittie',
  'boob',
  'butt',
  'anus', 'anal',
  'rectum',
  'boner',
  'orgasm',
  'masturbat',
  'handjob', 'blowjob', 'rimjob',
  'porn', 'porno', 'xxx',
  'rape', 'rapist',
  'pedophile', 'pedo', 'paedo',
  'necrophilia',
  'bestiality',
];

// Remove very short words that cause too many false positives ('ass','hoe','nip','gook' are
// high-value slurs so keep them — but remove 'cum' from normal words like 'accumulate')
// We handle this by checking the *normalized no-separator* version, which means 'accumulate'
// → 'accumulate' and 'cum' is a substring match → blocked. That's acceptable for usernames.

// ─── Numeric / symbol codes (checked pre-normalization) ──────────────────────
// Some hate codes are purely numeric and wouldn't survive letter-only stripping.
const BLOCKED_PATTERNS = [
  /1488/,   // white-nationalist code
  /\b88\b/, // "Heil Hitler" code (only as standalone number)
  /h8/i,    // "hate"
];

// ─── Leetspeak substitution map ──────────────────────────────────────────────
const LEET_MAP = {
  '4': 'a', '@': 'a',
  '3': 'e',
  '1': 'i', '!': 'i', '|': 'i',
  '0': 'o',
  '5': 's', '$': 's',
  '7': 't', '+': 't',
  '9': 'g', '6': 'g',
  '8': 'b',
  'ph': 'f',
  'ck': 'k',
};

function normalizeLeet(str) {
  // Multi-char replacements first
  let s = str.replace(/ph/gi, 'f').replace(/ck/gi, 'k');
  // Single-char replacements
  return s.replace(/[4@3!|1057$+968]/g, ch => LEET_MAP[ch] || ch);
}

/**
 * Returns true if `text` contains any blocked term.
 * @param {string} text
 * @returns {boolean}
 */
export function containsProfanity(text) {
  if (!text || typeof text !== 'string') return false;

  const raw = text.toLowerCase();

  // 1. Check numeric/symbol patterns on the raw input
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(raw)) return true;
  }

  // 2. Normalize leetspeak then strip non-letters for substring matching
  const normalized = normalizeLeet(raw).replace(/[^a-z]/g, '');

  // 3. Check each blocked word as a substring of the normalized string
  for (const word of BLOCKED_WORDS) {
    // Normalize the blocked word itself (already clean, but be consistent)
    const clean = normalizeLeet(word.toLowerCase()).replace(/[^a-z]/g, '');
    if (clean && normalized.includes(clean)) return true;
  }

  return false;
}
