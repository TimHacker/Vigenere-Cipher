# 5. Test-driven development with node:test and a pure state reducer

Date: 2026-10-29

## Status

Accepted

## Context

We want to build the app test-first. ADR 2 rules out libraries, so we cannot use a DOM testing library or jsdom. Most user stories are about UI state (e.g. Decrypt disabled until Encrypt has run, Compare visible after Decrypt).

## Decision

- Follow red → green → refactor for every behaviour: write a failing test, make it pass, then refactor.
- Use Node's built-in test runner (`node --test`) and `node:assert`; no test dependencies.
- Keep the cipher in a pure module, `src/vigenere.js`.
- Model UI behaviour as a pure reducer, `src/state.js` (`reduce(state, action) → state`), covering field values, button enabled/visible flags, result and error messages.
- `src/app.js` is a thin DOM adapter: it maps DOM events to actions and renders state to the DOM. It contains no business logic and is verified manually.

## Consequences

- Nearly all behaviour is unit tested without a browser.
- A small amount of DOM glue is untested; we keep it minimal.
- Requires Node 18+ locally and in CI.
