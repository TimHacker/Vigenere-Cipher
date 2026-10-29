// Thin DOM adapter (ADR 0005): maps DOM events to reducer actions and renders
// state to the DOM. All behaviour lives in state.js.
import { initialState, reduce, ERRORS } from './state.js';

const $ = (id) => document.getElementById(id);
const el = {
  form: $('cipher-form'),
  message: $('message'),
  key: $('key'),
  decrypt: $('decrypt'),
  compare: $('compare'),
  error: $('error'),
  compareSuccess: $('compare-success'),
  result: $('result'),
  resultLabel: $('result-label'),
};

const RESULT_LABELS = {
  idle: 'Result',
  encrypted: 'Encrypted message',
  decrypted: 'Decrypted message',
};

let state = initialState;

function dispatch(action) {
  state = reduce(state, action);
  render(state);
}

function render(s) {
  el.result.textContent = s.result;
  el.resultLabel.textContent = RESULT_LABELS[s.phase];
  el.decrypt.disabled = !s.decryptEnabled;
  el.compare.hidden = !s.compareVisible;
  el.compareSuccess.hidden = s.compareResult !== 'match';
  el.error.textContent = s.error ?? '';
  el.message.setAttribute('aria-invalid', String(s.error === ERRORS.EMPTY_MESSAGE));
  el.key.setAttribute('aria-invalid', String(s.error === ERRORS.EMPTY_KEY || s.error === ERRORS.INVALID_KEY));
}

el.message.addEventListener('input', (e) => dispatch({ type: 'MESSAGE_CHANGED', message: e.target.value }));
el.key.addEventListener('input', (e) => dispatch({ type: 'KEY_CHANGED', key: e.target.value }));
el.form.addEventListener('submit', (e) => {
  e.preventDefault();
  dispatch({ type: 'ENCRYPT' });
});
el.decrypt.addEventListener('click', () => dispatch({ type: 'DECRYPT' }));
el.compare.addEventListener('click', () => dispatch({ type: 'COMPARE' }));

render(state);
