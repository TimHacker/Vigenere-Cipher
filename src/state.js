// Pure UI state reducer (ADR 0005). All UI behaviour lives here so it can be
// unit tested without a DOM. State rules are described in ADR 0007.

export const ERRORS = Object.freeze({});

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

const handlers = {};

export function reduce(state, action) {
  const handler = handlers[action.type];
  return handler ? handler(state, action) : state;
}
