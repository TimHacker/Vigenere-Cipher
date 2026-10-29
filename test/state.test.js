import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reduce, ERRORS } from '../src/state.js';
import { encrypt } from '../src/vigenere.js';
import { NOT_ENOUGH_TEXT } from '../src/cryptanalysis.js';

const run = (...actions) => actions.reduce(reduce, initialState);
const msg = (message) => ({ type: 'MESSAGE_CHANGED', message });
const key = (key) => ({ type: 'KEY_CHANGED', key });
const ENCRYPT = { type: 'ENCRYPT' };
const DECRYPT = { type: 'DECRYPT' };
const COMPARE = { type: 'COMPARE' };

describe('reducer basics (#14, #1)', () => {
  test('initial state has empty fields, Decrypt disabled and Compare hidden', () => {
    assert.equal(initialState.message, '');
    assert.equal(initialState.key, '');
    assert.equal(initialState.result, '');
    assert.equal(initialState.decryptEnabled, false);
    assert.equal(initialState.compareVisible, false);
    assert.equal(initialState.compareResult, null);
    assert.equal(initialState.error, null);
  });

  test('does not mutate the input state', () => {
    const before = structuredClone(initialState);
    reduce(initialState, msg('hello'));
    assert.deepEqual(initialState, before);
  });

  test('unknown action returns the same state', () => {
    assert.equal(reduce(initialState, { type: 'NOPE' }), initialState);
  });
});

describe('entering the message (#2)', () => {
  test('stores the message', () => {
    assert.equal(run(msg('Hello')).message, 'Hello');
  });

  test('stores multi-line text, punctuation and Unicode unchanged', () => {
    const text = 'Line 1\nLine 2 — café ☕!';
    assert.equal(run(msg(text)).message, text);
  });

  test('clears any error', () => {
    const state = { ...initialState, error: 'boom' };
    assert.equal(reduce(state, msg('x')).error, null);
  });
});

describe('entering the key (#3)', () => {
  test('stores the key exactly as typed', () => {
    assert.equal(run(key('LEMON')).key, 'LEMON');
    assert.equal(run(key('le mon1')).key, 'le mon1');
  });

  test('clears any error', () => {
    const state = { ...initialState, error: 'boom' };
    assert.equal(reduce(state, key('x')).error, null);
  });
});

describe('validation (#16)', () => {
  test('empty message shows an error and does not encrypt', () => {
    const s = run(key('LEMON'), ENCRYPT);
    assert.equal(s.error, ERRORS.EMPTY_MESSAGE);
    assert.equal(s.result, '');
  });

  test('whitespace-only message counts as empty', () => {
    assert.equal(run(msg('  \n '), key('LEMON'), ENCRYPT).error, ERRORS.EMPTY_MESSAGE);
  });

  test('empty key shows an error', () => {
    assert.equal(run(msg('hi'), ENCRYPT).error, ERRORS.EMPTY_KEY);
  });

  test('key with non-letters shows an error', () => {
    for (const k of ['le mon', 'key1', 'ké']) {
      assert.equal(run(msg('hi'), key(k), ENCRYPT).error, ERRORS.INVALID_KEY, k);
    }
  });

  test('error messages are human readable', () => {
    assert.equal(ERRORS.EMPTY_MESSAGE, 'Please enter a message to encrypt.');
    assert.equal(ERRORS.EMPTY_KEY, 'Please enter an encryption key.');
    assert.equal(ERRORS.INVALID_KEY, 'Key must contain letters only (A–Z).');
  });

  test('a valid encrypt clears a previous error', () => {
    const s = run(msg('hi'), ENCRYPT);
    assert.equal(reduce(reduce(s, key('LEMON')), ENCRYPT).error, null);
    const withError = { ...run(msg('hi'), key('LEMON')), error: 'old' };
    assert.equal(reduce(withError, ENCRYPT).error, null);
  });
});

describe('Decrypt disabled until encrypted (#4)', () => {
  test('stays disabled while typing', () => {
    assert.equal(run(msg('hi'), key('LEMON')).decryptEnabled, false);
  });

  test('stays disabled after a failed encrypt', () => {
    assert.equal(run(msg('hi'), key('bad key'), ENCRYPT).decryptEnabled, false);
  });

  test('DECRYPT while disabled is a no-op', () => {
    const s = run(msg('hi'), key('LEMON'));
    assert.equal(reduce(s, DECRYPT), s);
  });
});

describe('Encrypt (#5) and result display (#6)', () => {
  test('encrypts the reference vector into the result', () => {
    assert.equal(run(msg('ATTACKATDAWN'), key('LEMON'), ENCRYPT).result, 'LXFOPVEFRNHR');
  });

  test('preserves case, spaces and punctuation in the result', () => {
    assert.equal(run(msg('Attack at dawn!'), key('LEMON'), ENCRYPT).result, 'Lxfopv ef rnhr!');
  });

  test('captures the original plain text and sets phase', () => {
    const s = run(msg('Attack at dawn!'), key('LEMON'), ENCRYPT);
    assert.equal(s.original, 'Attack at dawn!');
    assert.equal(s.phase, 'encrypted');
  });

  test('encrypting again uses the current message and key', () => {
    const s = run(msg('abc'), key('B'), ENCRYPT, msg('xyz'), key('C'), ENCRYPT);
    assert.equal(s.result, 'zab');
    assert.equal(s.original, 'xyz');
  });
});

describe('Decrypt enabled after encrypting (#7)', () => {
  const encrypted = run(msg('Attack at dawn!'), key('LEMON'), ENCRYPT);

  test('is enabled after a successful encrypt', () => {
    assert.equal(encrypted.decryptEnabled, true);
  });

  for (const [name, action] of [['message', msg('changed')], ['key', key('OTHER')]]) {
    test(`editing the ${name} disables Decrypt and resets Compare`, () => {
      const decrypted = reduce(encrypted, DECRYPT);
      const s = reduce({ ...decrypted, compareResult: 'match' }, action);
      assert.equal(s.decryptEnabled, false);
      assert.equal(s.compareVisible, false);
      assert.equal(s.compareResult, null);
      assert.equal(reduce(encrypted, action).decryptEnabled, false);
    });
  }

  test('encrypting again re-enables Decrypt', () => {
    const s = reduce(reduce(encrypted, msg('new')), ENCRYPT);
    assert.equal(s.decryptEnabled, true);
  });
});

describe('Decrypt (#8)', () => {
  test('decrypts the reference vector back to plain text', () => {
    assert.equal(run(msg('ATTACKATDAWN'), key('LEMON'), ENCRYPT, DECRYPT).result, 'ATTACKATDAWN');
  });

  test('round-trips mixed case and punctuation exactly', () => {
    const text = 'Meet me @ 10:30, by the old Oak tree!';
    assert.equal(run(msg(text), key('Zebra'), ENCRYPT, DECRYPT).result, text);
  });

  test('sets phase to decrypted and disables Decrypt again', () => {
    const s = run(msg('hi'), key('LEMON'), ENCRYPT, DECRYPT);
    assert.equal(s.phase, 'decrypted');
    assert.equal(s.decryptEnabled, false);
  });

  test('a second DECRYPT is a no-op', () => {
    const s = run(msg('hi'), key('LEMON'), ENCRYPT, DECRYPT);
    assert.equal(reduce(s, DECRYPT), s);
  });
});

describe('Compare button (#9)', () => {
  test('is hidden initially and after encrypt', () => {
    assert.equal(initialState.compareVisible, false);
    assert.equal(run(msg('hi'), key('LEMON'), ENCRYPT).compareVisible, false);
  });

  test('is visible after decrypt', () => {
    assert.equal(run(msg('hi'), key('LEMON'), ENCRYPT, DECRYPT).compareVisible, true);
  });

  test('reports a match when the decrypted text equals the original', () => {
    const s = run(msg('Attack at dawn!'), key('LEMON'), ENCRYPT, DECRYPT, COMPARE);
    assert.equal(s.compareResult, 'match');
    assert.equal(s.error, null);
  });

  test('COMPARE while hidden is a no-op', () => {
    const s = run(msg('hi'), key('LEMON'), ENCRYPT);
    assert.equal(reduce(s, COMPARE), s);
  });
});

describe('Compare mismatch error (#10)', () => {
  const decrypted = run(msg('Attack at dawn!'), key('LEMON'), ENCRYPT, DECRYPT);
  const tampered = { ...decrypted, result: 'Attack at dusk!' };

  test('reports a mismatch with an error naming the first differing position', () => {
    const s = reduce(tampered, COMPARE);
    assert.equal(s.compareResult, 'mismatch');
    assert.equal(s.error, 'Messages differ at character 12.');
  });

  test('reports a length difference', () => {
    const s = reduce({ ...decrypted, result: 'Attack at dawn' }, COMPARE);
    assert.equal(s.compareResult, 'mismatch');
    assert.equal(s.error, 'Messages differ at character 15.');
  });

  test('a later successful compare clears the error', () => {
    const mismatched = reduce(tampered, COMPARE);
    const fixed = reduce({ ...mismatched, result: decrypted.result }, COMPARE);
    assert.equal(fixed.compareResult, 'match');
    assert.equal(fixed.error, null);
  });
});

describe('Crack it panel (#19)', () => {
  const PLAIN =
    'When the same word lines up with the same part of the key, it produces the same ' +
    'ciphertext, and the gaps between those repeats reveal the length of the key. Once the ' +
    'length is known, every column of letters is just a simple shift, and the familiar shape ' +
    'of English gives the whole secret away in a few minutes of patient counting.';
  const cipher = (ciphertext) => ({ type: 'CIPHERTEXT_CHANGED', ciphertext });
  const CRACK = { type: 'CRACK' };
  const USE_ENCRYPTED_RESULT = { type: 'USE_ENCRYPTED_RESULT' };

  test('initial state has an empty crack panel', () => {
    assert.equal(initialState.ciphertext, '');
    assert.equal(initialState.cracked, null);
    assert.equal(initialState.crackError, null);
  });

  test('stores the ciphertext exactly as typed', () => {
    assert.equal(run(cipher('Lxfopv ef rnhr!')).ciphertext, 'Lxfopv ef rnhr!');
  });

  test('cracks the key length, key and plain text without being given the key', () => {
    const s = run(cipher(encrypt(PLAIN, 'LEMON')), CRACK);
    assert.equal(s.crackError, null);
    assert.equal(s.cracked.keyLength, 5);
    assert.equal(s.cracked.key, 'LEMON');
    assert.equal(s.cracked.plaintext, PLAIN);
    assert.equal(s.cracked.candidates[0].length, 5);
  });

  test('empty ciphertext shows an error', () => {
    const s = run(cipher('  '), CRACK);
    assert.equal(s.crackError, ERRORS.EMPTY_CIPHERTEXT);
    assert.equal(s.cracked, null);
    assert.equal(ERRORS.EMPTY_CIPHERTEXT, 'Please enter a ciphertext to crack.');
  });

  test('short ciphertext shows a "not enough text" error', () => {
    const s = run(cipher('Lxfopv ef rnhr!'), CRACK);
    assert.equal(s.crackError, NOT_ENOUGH_TEXT);
    assert.equal(s.cracked, null);
  });

  test('editing the ciphertext clears the previous crack and error', () => {
    const cracked = run(cipher(encrypt(PLAIN, 'LEMON')), CRACK);
    assert.equal(reduce(cracked, cipher('x')).cracked, null);
    const failed = run(cipher('x'), CRACK);
    assert.equal(reduce(failed, cipher('xy')).crackError, null);
  });

  test('cracking does not touch the encrypt/decrypt state', () => {
    const encrypted = run(msg('Attack at dawn!'), key('LEMON'), ENCRYPT);
    const s = reduce(reduce(encrypted, cipher(encrypt(PLAIN, 'KEY'))), CRACK);
    assert.equal(s.result, encrypted.result);
    assert.equal(s.decryptEnabled, true);
    assert.equal(s.error, null);
  });

  test('"Use encrypted result" copies the encrypted result into the crack input', () => {
    const s = run(msg(PLAIN), key('LEMON'), ENCRYPT, USE_ENCRYPTED_RESULT);
    assert.equal(s.ciphertext, encrypt(PLAIN, 'LEMON'));
    assert.equal(reduce(s, CRACK).cracked.key, 'LEMON');
  });

  test('"Use encrypted result" clears a previous crack', () => {
    const s = run(cipher('x'), CRACK, msg(PLAIN), key('KEY'), ENCRYPT, USE_ENCRYPTED_RESULT);
    assert.equal(s.crackError, null);
    assert.equal(s.cracked, null);
  });

  test('"Use encrypted result" is a no-op unless the result is encrypted', () => {
    assert.equal(reduce(initialState, USE_ENCRYPTED_RESULT), initialState);
    const decrypted = run(msg('hi'), key('LEMON'), ENCRYPT, DECRYPT);
    assert.equal(reduce(decrypted, USE_ENCRYPTED_RESULT), decrypted);
  });
});
