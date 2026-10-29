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
  crackForm: $('crack-form'),
  ciphertext: $('ciphertext'),
  useEncrypted: $('use-encrypted'),
  crackError: $('crack-error'),
  crackResults: $('crack-results'),
  crackKeyLength: $('crack-key-length'),
  crackKey: $('crack-key'),
  crackPlaintext: $('crack-plaintext'),
  crackCandidates: $('crack-candidates'),
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
  renderCrack(s);
}

function cell(text) {
  const td = document.createElement('td');
  td.textContent = text;
  return td;
}

function renderCrack(s) {
  if (el.ciphertext.value !== s.ciphertext) el.ciphertext.value = s.ciphertext;
  el.useEncrypted.disabled = s.phase !== 'encrypted';
  el.crackError.textContent = s.crackError ?? '';
  el.ciphertext.setAttribute('aria-invalid', String(s.crackError !== null));
  el.crackResults.hidden = s.cracked === null;
  if (s.cracked === null) return;
  el.crackKeyLength.textContent = String(s.cracked.keyLength);
  el.crackKey.textContent = s.cracked.key;
  el.crackPlaintext.textContent = s.cracked.plaintext;
  el.crackCandidates.replaceChildren(
    ...s.cracked.candidates.map(({ length, ioc }) => {
      const row = document.createElement('tr');
      row.append(cell(String(length)), cell(ioc.toFixed(3)));
      return row;
    }),
  );
}

el.message.addEventListener('input', (e) => dispatch({ type: 'MESSAGE_CHANGED', message: e.target.value }));
el.key.addEventListener('input', (e) => dispatch({ type: 'KEY_CHANGED', key: e.target.value }));
el.form.addEventListener('submit', (e) => {
  e.preventDefault();
  dispatch({ type: 'ENCRYPT' });
});
el.decrypt.addEventListener('click', () => dispatch({ type: 'DECRYPT' }));
el.compare.addEventListener('click', () => dispatch({ type: 'COMPARE' }));
el.ciphertext.addEventListener('input', (e) => dispatch({ type: 'CIPHERTEXT_CHANGED', ciphertext: e.target.value }));
el.useEncrypted.addEventListener('click', () => dispatch({ type: 'USE_ENCRYPTED_RESULT' }));
el.crackForm.addEventListener('submit', (e) => {
  e.preventDefault();
  dispatch({ type: 'CRACK' });
});

render(state);
