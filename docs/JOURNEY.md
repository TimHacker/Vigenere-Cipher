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
