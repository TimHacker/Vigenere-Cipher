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
