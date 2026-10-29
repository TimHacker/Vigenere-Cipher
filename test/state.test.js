import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reduce, ERRORS } from '../src/state.js';

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
