# 6. CI with GitHub Actions and hosting on GitHub Pages

Date: 2026-10-29

## Status

Accepted

## Context

TDD is only effective if tests run on every change. The app is static and needs a public URL for demos.

## Decision

- A GitHub Actions workflow runs `npm test` on every push and pull request.
- The site is deployed to GitHub Pages from `main` via GitHub Actions, only after tests pass.

## Consequences

- Broken tests block deployment.
- Free hosting with no infrastructure to manage.
