# 7. UI state rules for Decrypt and Compare

Date: 2026-10-29

## Status

Accepted

## Context

The user stories say Decrypt is disabled until the message has been encrypted, and Compare appears after decryption. They do not say what happens if the user edits the message or key after encrypting, or what Decrypt does once the result is already decrypted.

## Decision

- Decrypt starts disabled and is enabled only by a successful Encrypt.
- Editing the message or key invalidates the ciphertext: Decrypt is disabled, Compare is hidden and any compare result is cleared.
- After Decrypt runs, Decrypt is disabled again until the next Encrypt.
- Compare becomes visible only after Decrypt. It compares the plain text captured at Encrypt time with the decrypted result.
- Actions that are not currently allowed (e.g. `DECRYPT` while disabled) are no-ops in the reducer.

## Consequences

- The UI can never show a "decrypt" of stale ciphertext or compare against a message the user has since changed.
- Every rule is a pure reducer transition and is unit tested (ADR 5).
