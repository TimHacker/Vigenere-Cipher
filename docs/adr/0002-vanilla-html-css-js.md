# 2. Vanilla HTML, CSS and JavaScript with no libraries

Date: 2026-10-29

## Status

Accepted

## Context

The project requirements state that the Vigenère Cipher must be implemented using only native language features, with no libraries. The app is small and is a learning exercise.

## Decision

Build the app with plain HTML, CSS and JavaScript ES modules. No framework, no bundler, no runtime dependencies. The app is served as static files.

## Consequences

- Zero install / build step; `index.html` can be opened via any static server.
- Forces us to understand the DOM and the algorithm directly.
- No framework conveniences (reactivity, components); we mitigate with a small state reducer (see ADR 5).
