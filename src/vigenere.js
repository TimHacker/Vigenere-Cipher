// Vigenère Cipher implemented with native JavaScript only (ADR 0002).
// Character handling rules are described in ADR 0003; key rules in ADR 0004.

const ALPHABET_SIZE = 26;
const UPPER_A = 65;
const LOWER_A = 97;

export function isValidKey(key) {
  return typeof key === 'string' && /^[A-Za-z]+$/.test(key);
}

function letterBase(code) {
  if (code >= UPPER_A && code < UPPER_A + ALPHABET_SIZE) return UPPER_A;
  if (code >= LOWER_A && code < LOWER_A + ALPHABET_SIZE) return LOWER_A;
  return null;
}

function transform(text, key, direction) {
  if (!isValidKey(key)) {
    throw new TypeError('Key must contain letters only (A–Z).');
  }
  const shifts = [...key.toUpperCase()].map((ch) => ch.charCodeAt(0) - UPPER_A);
  let keyIndex = 0;
  let output = '';

  for (const ch of text) {
    const code = ch.charCodeAt(0);
    const base = letterBase(code);
    if (base === null) {
      output += ch;
      continue;
    }
    const shift = direction * shifts[keyIndex % shifts.length];
    const offset = (code - base + shift + ALPHABET_SIZE) % ALPHABET_SIZE;
    output += String.fromCharCode(base + offset);
    keyIndex++;
  }
  return output;
}

export function encrypt(text, key) {
  return transform(text, key, 1);
}

export function decrypt(text, key) {
  return transform(text, key, -1);
}
