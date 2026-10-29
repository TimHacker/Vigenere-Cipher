import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { encrypt } from '../src/vigenere.js';
import {
  indexOfCoincidence,
  kasiskiDistances,
  estimateKeyLength,
  crackShift,
  crack,
  NOT_ENOUGH_TEXT,
} from '../src/cryptanalysis.js';

// Original English prose (about 500 letters) used as the plain text.
const PARAGRAPH =
  'For three centuries people called this cipher unbreakable, and for a ' +
  'while that reputation seemed deserved. A message was mixed with a short ' +
  'keyword, so the same letter could turn into many different letters. ' +
  'Then, in the middle of the nineteenth century, a retired army officer ' +
  'noticed that long messages repeat themselves. When the same word lines ' +
  'up with the same part of the key, it produces the same ciphertext, and ' +
  'the gaps between those repeats reveal the length of the key. Once the ' +
  'length is known, every column of letters is just a simple shift, and ' +
  'the familiar shape of English, with its many E and T characters, gives ' +
  'the whole secret away in a few minutes of patient counting.';

const lettersOnly = (text) => text.replace(/[^A-Za-z]/g, '').toUpperCase();

describe('indexOfCoincidence (#19)', () => {
  test('English prose is about 0.066', () => {
    assert.ok(Math.abs(indexOfCoincidence(PARAGRAPH) - 0.066) <= 0.01);
  });

  test('an evenly distributed alphabet is about 0.038', () => {
    const even = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.repeat(10);
    assert.ok(Math.abs(indexOfCoincidence(even) - 0.038) <= 0.01);
  });

  test('ignores case and non-letters', () => {
    assert.equal(indexOfCoincidence('Aa, b-B!'), indexOfCoincidence('AABB'));
  });

  test('returns 0 for fewer than two letters', () => {
    assert.equal(indexOfCoincidence(''), 0);
    assert.equal(indexOfCoincidence('a!'), 0);
  });
});

describe('kasiskiDistances (#19)', () => {
  test('finds the distance between a repeated sequence', () => {
    assert.deepEqual(kasiskiDistances('ABCxyzwvABC'), [8]);
  });

  test('ignores case and non-letters', () => {
    assert.deepEqual(kasiskiDistances('abc, XYZWV abc'), [8]);
  });

  test('returns no distances when nothing repeats', () => {
    assert.deepEqual(kasiskiDistances('ABCDEFGHIJ'), []);
  });
});

describe('crackShift (#19)', () => {
  test('recovers the shift of a Caesar-encrypted English paragraph', () => {
    const column = lettersOnly(encrypt(PARAGRAPH, 'H'));
    assert.equal(crackShift(column), 7);
  });

  test('recovers a zero shift for plain English', () => {
    assert.equal(crackShift(lettersOnly(PARAGRAPH)), 0);
  });
});

describe('estimateKeyLength (#19)', () => {
  test('returns 5 for a paragraph encrypted with LEMON', () => {
    assert.equal(estimateKeyLength(encrypt(PARAGRAPH, 'LEMON')), 5);
  });
});

describe('crack (#19)', () => {
  test('recovers LEMON and the exact plain text, keeping case and punctuation', () => {
    const result = crack(encrypt(PARAGRAPH, 'LEMON'));
    assert.equal(result.ok, true);
    assert.equal(result.keyLength, 5);
    assert.equal(result.key, 'LEMON');
    assert.equal(result.plaintext, PARAGRAPH);
  });

  for (const key of ['KEY', 'SECRET', 'PUZZLES', 'CRACKING']) {
    test(`recovers the ${key.length}-letter key ${key}`, () => {
      const result = crack(encrypt(PARAGRAPH, key));
      assert.equal(result.key, key);
      assert.equal(result.plaintext, PARAGRAPH);
    });
  }

  test('returns the top candidate key lengths with their IoC, best first', () => {
    const { candidates } = crack(encrypt(PARAGRAPH, 'LEMON'));
    assert.equal(candidates.length, 3);
    assert.equal(candidates[0].length, 5);
    for (const c of candidates) assert.equal(typeof c.ioc, 'number');
  });

  for (const [label, text] of [['empty', ''], ['short', 'Lxfopv ef rnhr!']]) {
    test(`${label} ciphertext returns a "not enough text" result instead of throwing`, () => {
      const result = crack(text);
      assert.equal(result.ok, false);
      assert.equal(result.error, NOT_ENOUGH_TEXT);
      assert.equal(result.key, '');
      assert.deepEqual(result.candidates, []);
    });
  }
});
