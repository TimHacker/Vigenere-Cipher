// Vigenère cryptanalysis with native JavaScript only (ADR 0002).
// Approach (ADR 0008): index of coincidence picks the key length, Kasiski
// breaks ties, and chi-squared against English frequencies picks each shift.
import { decrypt } from './vigenere.js';

const ALPHABET_SIZE = 26;
const UPPER_A = 65;
const MIN_LETTERS = 40;
const MIN_LETTERS_PER_COLUMN = 8;
const RELIABLE_LETTERS_PER_COLUMN = 20;
const IOC_TOLERANCE = 0.85;

export const NOT_ENOUGH_TEXT = 'Not enough text to crack. Paste at least 40 letters of ciphertext.';

// Relative frequencies of A–Z in English text.
const ENGLISH = [
  0.082, 0.015, 0.028, 0.043, 0.127, 0.022, 0.020, 0.061, 0.070, 0.0015, 0.0077, 0.040, 0.024,
  0.067, 0.075, 0.019, 0.00095, 0.060, 0.063, 0.091, 0.028, 0.0098, 0.024, 0.0015, 0.020, 0.00074,
];

function letters(text) {
  return text.toUpperCase().replace(/[^A-Z]/g, '');
}

function counts(text) {
  const result = new Array(ALPHABET_SIZE).fill(0);
  for (const ch of text) result[ch.charCodeAt(0) - UPPER_A]++;
  return result;
}

function columns(text, length) {
  const result = Array.from({ length }, () => '');
  for (let i = 0; i < text.length; i++) result[i % length] += text[i];
  return result;
}

export function indexOfCoincidence(text) {
  const clean = letters(text);
  const n = clean.length;
  if (n < 2) return 0;
  const pairs = counts(clean).reduce((sum, c) => sum + c * (c - 1), 0);
  return pairs / (n * (n - 1));
}

export function kasiskiDistances(text, minLen = 3) {
  const clean = letters(text);
  const lastSeen = new Map();
  const distances = [];
  for (let i = 0; i + minLen <= clean.length; i++) {
    const sequence = clean.slice(i, i + minLen);
    if (lastSeen.has(sequence)) distances.push(i - lastSeen.get(sequence));
    lastSeen.set(sequence, i);
  }
  return distances;
}

function rankKeyLengths(clean, maxLen) {
  const limit = Math.min(maxLen, Math.floor(clean.length / MIN_LETTERS_PER_COLUMN));
  const candidates = [];
  for (let length = 1; length <= limit; length++) {
    const iocs = columns(clean, length).map(indexOfCoincidence);
    candidates.push({ length, ioc: iocs.reduce((a, b) => a + b, 0) / length });
  }
  if (candidates.length === 0) return [];

  // Short columns give noisy, inflated IoC, so measure "best" only on lengths
  // with enough letters per column. Multiples of the true length score as
  // well as the length itself, so every near-best length is a contender:
  // prefer the one dividing the most Kasiski distances, then the shortest.
  const reliable = candidates.filter((c) => clean.length / c.length >= RELIABLE_LETTERS_PER_COLUMN);
  const best = Math.max(...(reliable.length ? reliable : candidates).map((c) => c.ioc));
  const distances = kasiskiDistances(clean);
  const kasiski = (length) => distances.filter((d) => d % length === 0).length;
  const [chosen] = candidates
    .filter((c) => c.ioc >= best * IOC_TOLERANCE)
    .sort((a, b) => kasiski(b.length) - kasiski(a.length) || a.length - b.length);

  const others = candidates.filter((c) => c !== chosen).sort((a, b) => b.ioc - a.ioc);
  return [chosen, ...others];
}

export function estimateKeyLength(text, maxLen = 20) {
  const [best] = rankKeyLengths(letters(text), maxLen);
  return best ? best.length : 0;
}

export function crackShift(column) {
  const observed = counts(letters(column));
  const total = observed.reduce((a, b) => a + b, 0);
  let bestShift = 0;
  let bestScore = Infinity;
  for (let shift = 0; shift < ALPHABET_SIZE; shift++) {
    let score = 0;
    for (let i = 0; i < ALPHABET_SIZE; i++) {
      const expected = ENGLISH[i] * total;
      const diff = observed[(i + shift) % ALPHABET_SIZE] - expected;
      score += (diff * diff) / expected;
    }
    if (score < bestScore) {
      bestScore = score;
      bestShift = shift;
    }
  }
  return bestShift;
}

export function crack(ciphertext, maxLen = 20) {
  const clean = letters(ciphertext ?? '');
  if (clean.length < MIN_LETTERS) {
    return { ok: false, error: NOT_ENOUGH_TEXT, keyLength: 0, key: '', plaintext: '', candidates: [] };
  }
  const candidates = rankKeyLengths(clean, maxLen);
  const keyLength = candidates[0].length;
  const key = columns(clean, keyLength)
    .map((column) => String.fromCharCode(UPPER_A + crackShift(column)))
    .join('');
  return {
    ok: true,
    error: null,
    keyLength,
    key,
    plaintext: decrypt(ciphertext, key),
    candidates: candidates.slice(0, 3),
  };
}
