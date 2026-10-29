import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { encrypt, decrypt, isValidKey } from '../src/vigenere.js';

describe('encrypt', () => {
  test('matches the classic reference vector', () => {
    assert.equal(encrypt('ATTACKATDAWN', 'LEMON'), 'LXFOPVEFRNHR');
  });

  test('preserves lowercase', () => {
    assert.equal(encrypt('attack', 'lemon'), 'lxfopv');
  });

  test('treats the key case-insensitively', () => {
    assert.equal(encrypt('ABC', 'key'), encrypt('ABC', 'KEY'));
  });

  test('passes non-letters through without consuming the key', () => {
    assert.equal(encrypt('Attack at dawn!', 'LEMON'), 'Lxfopv ef rnhr!');
  });

  test('key "A" is the identity', () => {
    assert.equal(encrypt('Hello, World!', 'A'), 'Hello, World!');
  });

  test('wraps around the end of the alphabet', () => {
    assert.equal(encrypt('Z', 'B'), 'A');
    assert.equal(encrypt('z', 'b'), 'a');
  });

  test('returns an empty string for an empty message', () => {
    assert.equal(encrypt('', 'KEY'), '');
  });

  test('throws on an invalid key', () => {
    assert.throws(() => encrypt('hello', ''), TypeError);
    assert.throws(() => encrypt('hello', 'key1'), TypeError);
  });
});

describe('decrypt', () => {
  test('reverses the classic reference vector', () => {
    assert.equal(decrypt('LXFOPVEFRNHR', 'LEMON'), 'ATTACKATDAWN');
  });

  test('wraps around the start of the alphabet', () => {
    assert.equal(decrypt('A', 'B'), 'Z');
  });

  test('throws on an invalid key', () => {
    assert.throws(() => decrypt('hello', 'le mon'), TypeError);
  });

  test('round-trips mixed text exactly', () => {
    const samples = [
      'Attack at dawn!',
      'The quick brown fox jumps over the lazy dog.',
      'Line one\nLine two\t123 — café ☕',
      'ZZZ zzz AAA aaa',
      '',
    ];
    for (const key of ['LEMON', 'a', 'Zebra', 'longerkeythanmessage']) {
      for (const m of samples) {
        assert.equal(decrypt(encrypt(m, key), key), m, `key=${key} m=${m}`);
      }
    }
  });
});

describe('isValidKey', () => {
  test('accepts letters in any case', () => {
    assert.equal(isValidKey('LEMON'), true);
    assert.equal(isValidKey('lemon'), true);
    assert.equal(isValidKey('LeMoN'), true);
  });

  test('rejects empty, spaces, digits, punctuation and non-ASCII letters', () => {
    for (const k of ['', 'le mon', 'key1', 'key!', 'ké', ' ']) {
      assert.equal(isValidKey(k), false, `"${k}"`);
    }
  });

  test('rejects non-strings', () => {
    assert.equal(isValidKey(undefined), false);
    assert.equal(isValidKey(null), false);
    assert.equal(isValidKey(42), false);
  });
});
