// Pure UI state reducer (ADR 0005). All UI behaviour lives here so it can be
// unit tested without a DOM. State rules are described in ADR 0007.

import { encrypt, decrypt, isValidKey } from './vigenere.js';
import { crack } from './cryptanalysis.js';

export const ERRORS = Object.freeze({
  EMPTY_MESSAGE: 'Please enter a message to encrypt.',
  EMPTY_KEY: 'Please enter an encryption key.',
  INVALID_KEY: 'Key must contain letters only (A–Z).',
  MISMATCH: (position) => `Messages differ at character ${position}.`,
  EMPTY_CIPHERTEXT: 'Please enter a ciphertext to crack.',
});

function firstDifference(a, b) {
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) {
    if (a[i] !== b[i]) return i;
  }
  return -1;
}

export const initialState = Object.freeze({
  message: '',
  key: '',
  original: null,
  result: '',
  phase: 'idle',
  decryptEnabled: false,
  compareVisible: false,
  compareResult: null,
  error: null,
  ciphertext: '',
  cracked: null,
  crackError: null,
});

function validate({ message, key }) {
  if (message.trim() === '') return ERRORS.EMPTY_MESSAGE;
  if (key === '') return ERRORS.EMPTY_KEY;
  if (!isValidKey(key)) return ERRORS.INVALID_KEY;
  return null;
}

// Editing an input invalidates the current ciphertext (ADR 0007).
const invalidate = {
  error: null,
  decryptEnabled: false,
  compareVisible: false,
  compareResult: null,
};

// The Crack it panel has its own state and never touches Encrypt/Decrypt (ADR 0008).
const clearCrack = { cracked: null, crackError: null };

const handlers = {
  MESSAGE_CHANGED: (state, { message }) => ({ ...state, message, ...invalidate }),
  KEY_CHANGED: (state, { key }) => ({ ...state, key, ...invalidate }),

  ENCRYPT: (state) => {
    const error = validate(state);
    if (error) return { ...state, error };
    return {
      ...state,
      original: state.message,
      result: encrypt(state.message, state.key),
      phase: 'encrypted',
      decryptEnabled: true,
      compareVisible: false,
      compareResult: null,
      error: null,
    };
  },

  DECRYPT: (state) => {
    if (!state.decryptEnabled) return state;
    return {
      ...state,
      result: decrypt(state.result, state.key),
      phase: 'decrypted',
      decryptEnabled: false,
      compareVisible: true,
    };
  },

  COMPARE: (state) => {
    if (!state.compareVisible) return state;
    const index = firstDifference(state.original, state.result);
    if (index === -1) return { ...state, compareResult: 'match', error: null };
    return { ...state, compareResult: 'mismatch', error: ERRORS.MISMATCH(index + 1) };
  },

  CIPHERTEXT_CHANGED: (state, { ciphertext }) => ({ ...state, ciphertext, ...clearCrack }),

  USE_ENCRYPTED_RESULT: (state) => {
    if (state.phase !== 'encrypted') return state;
    return { ...state, ciphertext: state.result, ...clearCrack };
  },

  CRACK: (state) => {
    if (state.ciphertext.trim() === '') return { ...state, cracked: null, crackError: ERRORS.EMPTY_CIPHERTEXT };
    const { ok, error, keyLength, key, plaintext, candidates } = crack(state.ciphertext);
    if (!ok) return { ...state, cracked: null, crackError: error };
    return { ...state, cracked: { keyLength, key, plaintext, candidates }, crackError: null };
  },
};

export function reduce(state, action) {
  const handler = handlers[action.type];
  return handler ? handler(state, action) : state;
}
