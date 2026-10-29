# 3. Cipher character handling

Date: 2026-10-29

## Status

Accepted

## Context

The classic Vigenère Cipher operates on the 26 letters A–Z. Real user input contains lowercase letters, spaces, digits and punctuation. We must decide how these are treated so that encryption is reversible and the Compare feature can detect a perfect round trip.

## Decision

- Letters A–Z and a–z are shifted; the output keeps the original case.
- All other characters (spaces, digits, punctuation, non-ASCII) pass through unchanged.
- The key index only advances when a letter is processed.

Shift formula (with `base` = 65 for upper case, 97 for lower case, `k` = key letter − 'A'):

- Encrypt: `(c − base + k) mod 26 + base`
- Decrypt: `(c − base − k + 26) mod 26 + base`

Reference vector: `ATTACKATDAWN` + key `LEMON` → `LXFOPVEFRNHR`.

## Consequences

- `decrypt(encrypt(m, k), k) === m` for any message `m`, so Compare is meaningful.
- Ciphertext leaks word boundaries and punctuation, which weakens it further — acceptable for a learning exercise and discussed in `REFLECTION.md`.
