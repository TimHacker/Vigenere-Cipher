# 4. Encryption key validation

Date: 2026-10-29

## Status

Accepted

## Context

The key determines the shift for each letter. Non-letter characters have no defined shift in the classic algorithm, and an empty key would make encryption a no-op or divide by zero.

## Decision

A valid key is one or more letters (A–Z, a–z) only, treated case-insensitively. Any other key is rejected with a visible inline error and no encryption or decryption is performed. Keys are not silently altered.

## Consequences

- Users get clear feedback rather than surprising results.
- Keys with spaces (e.g. passphrases) must be entered without spaces.
