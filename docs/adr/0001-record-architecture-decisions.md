# 1. Record architecture decisions

Date: 2026-10-29

## Status

Accepted

## Context

We need a lightweight, durable record of significant decisions so that the reasoning behind the design is visible to future readers (including our future selves).

## Decision

We will use Architecture Decision Records in the Michael Nygard format, stored in `docs/adr/` as `NNNN-kebab-title.md`. New ADRs are copied from `0000-template.md` and added in the same pull request as the change they describe. Accepted ADRs are not edited; they are superseded by new ADRs.

## Consequences

- Decisions and their trade-offs are discoverable alongside the code.
- Small overhead per significant decision.
