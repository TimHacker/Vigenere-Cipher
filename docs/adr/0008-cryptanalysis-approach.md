# 8. Cryptanalysis approach for "Crack it"

Date: 2026-10-29

## Status

Accepted

## Context

Issue #19 asks for a "Crack it" panel that recovers the key and plain text of a Vigenère ciphertext without being given the key. This demonstrates the weaknesses described in [`REFLECTION.md`](../../REFLECTION.md). It must use native JavaScript only (ADR 0002), be test-driven in Node (ADR 0005), and keep case and punctuation (ADR 0003).

Three problems showed up while building it test-first:

- **Multiples of the key length look just as good.** For `LEMON`, lengths 10, 15 and 20 have the same (sometimes slightly higher) average column IoC as 5.
- **Long candidate lengths are noisy.** With ~15 letters per column, IoC can spike to 0.09 by chance. A Caesar (1-letter) key was first cracked as length 17.
- **Kasiski can't separate a length from its divisors.** Every distance divisible by 6 is also divisible by 3. A key with a repeated letter (`SECRET`) makes length 3 look partly English, so "most Kasiski hits" alone picked 3.

## Decision

Add a pure module, `src/cryptanalysis.js`:

1. **Letters only.** Analysis ignores case and non-letters. Decryption reuses `decrypt()` from `vigenere.js`, so the recovered plain text keeps the original case, spaces and punctuation.
2. **Candidate key lengths** run from 1 to `maxLen` (20), but only while each column has at least 8 letters.
3. **Pick the key length** using average column index of coincidence (IoC):
   - Measure the *best* IoC only over lengths with at least 20 letters per column. This ignores noisy spikes.
   - Every length with IoC ≥ 85% of that best is a contender.
   - Among contenders, prefer the one dividing the most Kasiski distances (repeated 3-letter sequences). This beats multiples. Then prefer the shortest.
4. **Each key letter** is the Caesar shift with the lowest chi-squared score against English letter frequencies.
5. **Too little text** (fewer than 40 letters) returns `{ ok: false, error: NOT_ENOUGH_TEXT }` instead of throwing.
6. The reducer gets its own `ciphertext`, `cracked` and `crackError` state. Cracking never touches Encrypt/Decrypt state. Editing the ciphertext clears the previous crack, because a recovered key shown next to a different ciphertext would be misleading. (This differs from ADR 0007, where the old result stays visible.)

The thresholds (20 letters, 85%) were chosen by measuring 400 random keys of length 1–8 on our test prose:

| Ciphertext length | Exact plain text recovered |
|-------------------|----------------------------|
| 100 characters | 39% |
| 200 characters | 87% |
| 330 characters | 97% |
| 500 characters | 99% |

## Consequences

- Works reliably for a paragraph or more of English. Short messages, like a typical "Attack at dawn!", are not enough, and the UI says "Works best with 200+ letters".
- English only. Other languages need a different frequency table.
- The thresholds are empirical. Changes should be re-measured, and the tests pin the key cases: `LEMON`, 3–8-letter keys, a Caesar key, `SECRET` and a short `KEY` message.
- No libraries were needed: about 120 lines of code.
