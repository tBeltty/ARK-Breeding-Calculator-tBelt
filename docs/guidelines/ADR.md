# Architecture Decision Records (ADR) Guidelines

## Purpose

Architecture Decision Records exist to capture and preserve significant technical decisions.

They prevent decision loss, reduce repeated discussions and provide long term architectural context.

---

## When an ADR Is Required

An ADR is mandatory when a decision affects at least one of the following:

1. System architecture
2. Domain model
3. Data persistence or schemas
4. Performance characteristics
5. Security posture
6. Developer experience
7. External contracts or APIs

If a decision is hard to reverse, it requires an ADR.

---

## ADR Structure

Each ADR must include the following sections:

1. Title
2. Status
3. Context
4. Decision
5. Alternatives Considered
6. Consequences

---

## Status Values

Allowed statuses:

1. Proposed
2. Accepted
3. Deprecated
4. Superseded

---

## Rules

1. ADRs must be written before implementation
2. ADRs must be immutable once accepted
3. New decisions that replace old ones must supersede previous ADRs
4. Code must follow accepted ADRs

---

## Golden Rule

If a decision cannot be explained without an ADR, it is already too late.

---

## Metadata

- **Status:** Normative
- **Alignment:** Clean Architecture Governance
