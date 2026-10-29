# Project Journey — Show and Tell Notes

A running log of how this project was set up and built with GitHub Copilot, and the key decisions made along the way. Newest entries at the bottom.

## 1. Repository and project setup

**Prompt:** "Set up a repo and start a project to build a Vigenère Cipher" plus the user stories from [app-ideas](https://github.com/florinpop17/app-ideas/blob/master/Projects/1-Beginner/Vigenere-Cipher.md).

**What Copilot did (via `gh` CLI):**
- `TimHacker` turned out to be a user account, not an org, so the repo was created under the user account.
- Created the repo with a starter README and pushed it.
- Created GitHub Project **"Vigenere Cipher"** (user project #2) and linked it to the repo.
- Created one issue per user story (#1–#8), plus the bonus stories (#9–#10, label `bonus`). All are on the project board.

## 2. Planning (Copilot plan mode)

Copilot asked clarifying questions one at a time, offering a recommended option for each. These are the decisions:

| Question | Decision | ADR |
|----------|----------|-----|
| Tech stack | Vanilla HTML/CSS/JS, no libraries | [0002](adr/0002-vanilla-html-css-js.md) |
| Case, spaces, punctuation | Keep case and pass non-letters through. The key only advances on letters | [0003](adr/0003-cipher-character-handling.md) |
| Valid key | Letters only, case-insensitive. Invalid keys show an error | [0004](adr/0004-key-validation.md) |
| Testing | Node built-in test runner (`node --test`) | [0005](adr/0005-tdd-with-node-test-and-state-reducer.md) |
| CI / hosting | GitHub Actions CI + GitHub Pages | [0006](adr/0006-ci-and-github-pages.md) |
| Reflection questions | Answered in `REFLECTION.md`, tracked as an issue | — |
| Edit after encrypt | Disable Decrypt and hide Compare until re-encrypted | [0007](adr/0007-ui-state-rules.md) |

**Feedback on the first plan:** "Follow a TDD approach and store ADRs with key decisions." Changes made in response:
- **TDD with no libraries is hard for UI code**, because there is no jsdom. The solution was to move all UI behaviour into a pure reducer (`src/state.js`) that can be tested in Node. `app.js` becomes a thin DOM adapter. See ADR 0005.
- Every ticket gets a **"Tests to write first"** checklist and a **Definition of Done**: red → green → refactor, CI green, ADR if a decision was made, and this journey log updated.
- ADRs use the Nygard format and live in [`docs/adr`](adr/README.md). See ADR 0001.

## 3. Tickets fleshed out

- Rewrote #1–#10 with the user story, test cases to write first, implementation notes, dependencies and the Definition of Done.
- Added the missing engineering tickets:
  - #11 Scaffolding & test harness
  - #12 ADRs (done)
  - #13 Cipher core (test-first, including the `ATTACKATDAWN`/`LEMON` → `LXFOPVEFRNHR` test vector)
  - #14 UI state reducer
  - #15 CI
  - #16 Input validation
  - #17 GitHub Pages
  - #18 REFLECTION.md
- Labels: `foundation`, `ui`, `cipher`, `tdd`, `infra`, `docs`, `bonus`.
- Added a **Phase** field to the project board:

| Phase | Issues |
|-------|--------|
| Foundation | #11, #12, #13, #14, #15 |
| Core | #1–#8, #16 |
| Bonus | #9, #10 |
| Delivery | #17, #18 |

## Suggested build order

1. **Foundation:** #11 → #15 → #13 → #14
2. **Core:** #1, #2, #3, #4, #16 → #5 → #6 → #7 → #8
3. **Bonus:** #9 → #10
4. **Delivery:** #17, #18

## Talking points for the demo

- Plan mode: Copilot asked clarifying questions before acting, and the feedback loop changed the plan (TDD + ADRs).
- Turning vague user stories into testable acceptance criteria.
- Making UI code testable without a framework by using a pure reducer.
- ADRs capture *why* a decision was made, not just *what* was decided.
- The "no libraries" constraint shaped the testing architecture.

<!-- Add new entries below as each ticket is completed. -->

## 4. Building it test-first

Every behaviour was built red → green. The git history shows a `test: … (red)` commit before each `feat: … (green)` commit. Run `git log --oneline` during the demo to show this.

| Step | Issues | Red (failing tests) | Green |
|------|--------|---------------------|-------|
| Scaffolding + `node --test` harness | #11 | smoke test | `package.json`, skeleton files |
| CI (GitHub Actions) | #15 | — | `ci.yml` runs `npm test` on push/PR |
| Cipher core | #13 | 15 tests, incl. `ATTACKATDAWN`/`LEMON` → `LXFOPVEFRNHR` and round-trip property | `src/vigenere.js` |
| Reducer skeleton | #14 | initial state, immutability, unknown action | `src/state.js` |
| Message & key input | #2, #3 | 5 tests | `MESSAGE_CHANGED`, `KEY_CHANGED` |
| Validation, Encrypt, result | #4, #5, #6, #16 | 13 tests | `ENCRYPT` + `validate()` |
| Enable Decrypt, Decrypt | #7, #8 | 7 tests | `DECRYPT`, `invalidate` on edit |
| Compare (bonus) | #9, #10 | 7 tests | `COMPARE` + first-difference error |
| App window + DOM adapter | #1 | manual browser check | `index.html`, `styles.css`, `src/app.js` |
| GitHub Pages | #17 | — | `pages.yml` reuses CI, deploys only if tests pass |
| Reflection | #18 | — | [`REFLECTION.md`](../REFLECTION.md) |

**Result:** 51 unit tests, no dependencies, about 90 lines of reducer and 50 lines of cipher code.

### Observations worth sharing

- **Some "red" tests passed immediately.** For example, "Decrypt stays disabled while typing" passed against the skeleton, because the default was already correct. These are still worth keeping as regression tests, and they're an honest TDD talking point.
- **Writing tests first drove the API design.** The tests used `run(...actions)` to replay user journeys. That made the reducer feel like a script of what the user does.
- **The test for #10 was the tricky one.** A correct cipher always round-trips, so the "mismatch" path can't happen through the UI. The test builds a tampered state directly. This is only possible because the state is a plain object.
- **Decision made during the build:** the Compare error reports the *first differing character position*, e.g. "Messages differ at character 12." This was optional in #10, and the test pinned it down.
- **Decision made during the build:** after editing an input, the old result stays visible but Decrypt and Compare are reset (ADR 0007). Clearing the result was considered but rejected: seeing the old ciphertext while changing the key is useful.
- **Encrypt is a form `submit` button**, so pressing Enter in the key field encrypts. This came for free with semantic HTML.
- **Accessibility:**
  - labels on every field
  - `role="alert"` for errors
  - `aria-live` result region
  - `aria-invalid` on the offending field
  - native `disabled`/`hidden` attributes
  - visible focus ring
- **Security hygiene:** all output is rendered with `textContent`, never `innerHTML`.
- **Verification:** the app was checked in Copilot's built-in browser canvas. The checks covered the empty-message error, Encrypt → `Lxfopv ef rnhr!`, Decrypt, Compare ✅, editing the key disabling Decrypt and hiding Compare, and the invalid-key error.

## 5. Live

- App: https://timhacker.github.io/Vigenere-Cipher/
- Every push to `main` runs CI. The Pages workflow re-runs the tests and only deploys if they pass (ADR 0006).


## 6. Stretch feature: Crack it (#19)

**Prompt:** "What's the next feature? Spin up a new conversation to implement this." The coordinator chat picked #19 and started a new Copilot session for it, with the project conventions (TDD, ADRs, this log) passed along in the kickoff prompt.

**Goal:** paste a ciphertext and recover the key and plain text *without the key*. This proves the answers in [`REFLECTION.md`](../REFLECTION.md).

### Steps (red → green)

| Step | Red (failing tests) | Green |
|------|---------------------|-------|
| Cryptanalysis core | 18 tests: IoC ≈ 0.066 for English and ≈ 0.038 for even text, Kasiski distances, Caesar `crackShift`, key length 5 for `LEMON`, keys of 3–8 letters, "not enough text" | `src/cryptanalysis.js` |
| Edge cases found by probing | Caesar key (length 1), short `KEY` message | Better key-length selection (below) |
| Reducer | 10 tests: `CIPHERTEXT_CHANGED`, `CRACK`, `USE_ENCRYPTED_RESULT`, errors, isolation from Encrypt/Decrypt | `src/state.js` |
| UI | browser check | "Crack it" section in `index.html`, `renderCrack()` in `app.js` |

**Result:** 81 unit tests (30 new), still no dependencies. The cracker is about 120 lines.

### Key decisions ([ADR 0008](adr/0008-cryptanalysis-approach.md))

- **IoC picks the key length, Kasiski breaks ties, chi-squared picks each letter.**
- **Analyse letters only, but decrypt with the existing `decrypt()`.** The recovered text keeps case and punctuation for free.
- **Short text returns a result, not an exception.** Fewer than 40 letters gives "Not enough text to crack".
- **Separate state for the panel.** Cracking never changes the Encrypt/Decrypt state. Editing the ciphertext clears the old crack, so a stale key is never shown.
- **"Use encrypted result"** is only enabled straight after Encrypt. That is the only time the result is ciphertext.

### Observations worth sharing

- **All the first tests passed on the first implementation, and that wasn't the end.** Probing beyond the tests showed a Caesar key was cracked as length **17**. Short columns (~15 letters) give noisy, inflated IoC. That became a new red test before the fix.
- **The first fix broke a passing test.** It added a "looks like English" IoC floor. Then `SECRET` cracked as `SEG`: its two Es make length 3 look partly English, and Kasiski can't tell 3 from 6. The existing test caught the regression straight away, which is why the earlier tests matter.
- **Tuning with data, not guesses.** Copilot wrote a throwaway script to score several selection rules over 300–400 random keys and text lengths, then picked the rule with the best results. The accuracy table is in ADR 0008: 87% at 200 characters, 99% at 500.
- **The candidate table is a demo prop.** For `LEMON`, length 10 can have a *higher* IoC than 5. The table shows it, and the explanation is that Kasiski and "shortest wins" pick 5.
- **Browser canvas quirk:** the canvas's type/click actions didn't fire DOM `input` events on this page. Verification used real DOM events through a script instead. It checked Encrypt → Use encrypted result → Crack (`LEMON`, exact plain text), the short-text error, editing clearing the result, and Decrypt still working.

### Demo talking points

1. Encrypt a paragraph with a secret key, click **Use encrypted result**, then **Crack**. The key and text appear in milliseconds.
2. Point at the candidate table: why 10 and 20 also score well, and how Kasiski picks 5.
3. Paste "Lxfopv ef rnhr!": not enough text. Statistics need volume, which is also why short secrets *feel* safe.
4. `git log --oneline`: two red/green cycles for the core, the second driven by probing rather than the original test list.
5. Link back to REFLECTION question 1: "Would I trust this with financial data?" The demo answers it.
