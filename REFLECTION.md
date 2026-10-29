# Reflection

These are answers to the three questions posed in the [project requirements](https://github.com/florinpop17/app-ideas/blob/master/Projects/1-Beginner/Vigenere-Cipher.md).

## 1. Would I feel confident encrypting my financial information using the Vigenère Cipher? Why?

**No.** The Vigenère Cipher was nicknamed *le chiffre indéchiffrable* ("the indecipherable cipher"), but it has been publicly broken since the 1860s. Today it can be cracked in milliseconds.

- **It is just several Caesar ciphers interleaved.** Each key letter applies a fixed shift. Once the key length is known, every *n*-th letter is a simple Caesar cipher with only 26 possible shifts.
- **It leaks statistics.** Letter frequencies survive inside each key column. Our implementation also keeps spaces, punctuation and case (ADR 0003), which leaks word lengths and sentence structure.
- **Known plaintext reveals the key.** If an attacker knows or can guess part of a message (for example "Dear", "Account number" or "£"), subtracting it from the ciphertext gives the key directly.
- **The key space is tiny.** A five-letter key has 26⁵ ≈ 12 million possibilities, which a laptop can brute-force almost instantly. Dictionary words as keys shrink this further.
- **There is no integrity or authentication.** An attacker can change the ciphertext without detection.
- **Compare with modern ciphers.** AES-256 has a key space of 2²⁵⁶ and is designed to resist frequency analysis, known-plaintext and chosen-plaintext attacks. Authenticated modes (AES-GCM) also detect tampering.

Financial data should use a vetted, modern implementation such as the Web Crypto API with AES-GCM, or TLS in transit. Never hand-roll cryptography for real data.

## 2. How would I detect that a message had been encrypted using the Vigenère Cipher?

- **Character set:** the output contains only letters (plus, in our variant, the original spaces and punctuation). Word lengths look like natural language, but the words are gibberish.
- **Flattened letter frequencies:** in English, E, T and A dominate. A Caesar cipher keeps that peaked shape but shifted. A Vigenère cipher flattens it, because each plaintext letter is spread over several ciphertext letters.
- **Index of coincidence (IoC):** this is the probability that two random letters in the text are the same.
  - English ≈ 0.066. Random text ≈ 0.038.
  - Monoalphabetic ciphers keep English's IoC. Vigenère output sits in between, and its IoC falls as the key gets longer.
  - An IoC between those values that rises back to ≈ 0.066 when the text is split into columns of some length *n* is a strong sign of Vigenère with key length *n*.
- **Repeated sequences:** the same plaintext fragment encrypted at the same key offset produces identical ciphertext fragments. Repeats at distances that share a common factor are a Vigenère signature.

## 3. How would I go about trying to crack this encryption?

> **Try it:** the app's **Crack it** panel implements steps 1–3 below. See [ADR 0008](docs/adr/0008-cryptanalysis-approach.md) and issue #19.

1. **Find the key length.**
   - **Kasiski examination:** find repeated ciphertext sequences of 3 or more letters and record the distances between them. The key length is very likely a common factor of those distances.
   - **Friedman test / IoC:** for each candidate length *n* (for example 1–20), split the ciphertext into *n* columns and compute the average IoC. The *n* where it jumps to ≈ 0.066 is the key length.
2. **Break each column as a Caesar cipher.**
   - For each column, try all 26 shifts and score the result against English letter frequencies using a chi-squared statistic.
   - The best-scoring shift gives that key letter.
3. **Assemble and verify the key.** Decrypt the message and check that it reads as English. Fix any weak columns by hand. Short messages give less statistical signal, so they may need several candidate keys.
4. **Shortcuts:**
   - Try a dictionary attack with common words as keys.
   - Use known or probable plaintext ("crib dragging").
   - In our variant, preserved spaces let you guess short words like "a", "I", "the" and "and" to recover key letters directly.

**Mitigations within the classical world**, such as a key as long as the message used only once (a *one-time pad*), make it theoretically unbreakable. But they move the problem to securely sharing and never reusing huge keys, which is why modern cryptography uses ciphers like AES instead.
