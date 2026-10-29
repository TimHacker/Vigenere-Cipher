// Pure UI state reducer (ADR 0005). All UI behaviour lives here so it can be
// unit tested without a DOM. State rules are described in ADR 0007.

import { encrypt, isValidKey } from './vigenere.js';

export const ERRORS = Object.freeze({
  EMPTY_MESSAGE: 'Please enter a message to encrypt.',
  EMPTY_KEY: 'Please enter an encryption key.',
  INVALID_KEY: 'Key must contain letters only (A–Z).',
});

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
});

function validate({ message, key }) {
  if (message.trim() === '') return ERRORS.EMPTY_MESSAGE;
  if (key === '') return ERRORS.EMPTY_KEY;
  if (!isValidKey(key)) return ERRORS.INVALID_KEY;
  return null;
}

const handlers = {
  MESSAGE_CHANGED: (state, { message }) => ({ ...state, message, error: null }),
  KEY_CHANGED: (state, { key }) => ({ ...state, key, error: null }),

  ENCRYPT: (state) => {
    const error = validate(state);
    if (error) return { ...state, error };
    return {
      ...state,
      original: state.message,
      result: encrypt(state.message, state.key),
      phase: 'encrypted',
      error: null,
    };
  },
};

export function reduce(state, action) {
  const handler = handlers[action.type];
  return handler ? handler(state, action) : state;
}
