
# Domain Modeling Guidelines

## Core Philosophy

The domain model is the most valuable asset of the system.

It must reflect business language, not technical convenience.

---

## Ubiquitous Language

1. Domain terms must match business language
2. No synonyms for the same concept
3. Names must be agreed with stakeholders

If language is inconsistent, the model is wrong.

---

## Entities

Use Entities when:

1. Identity matters
2. Lifecycle exists
3. Behavior depends on history

Entities must protect their invariants.

---

## Value Objects

Use Value Objects when:

1. Identity does not matter
2. Objects are immutable
3. Equality is based on value

Value Objects must be small and expressive.

---

## Invariants

1. Invariants must live in the Domain
2. Invariants must never be bypassed
3. Invalid states must be unrepresentable

---

## Domain Services

Domain Services are allowed only when:

1. Logic does not belong to a single entity
2. Logic represents a domain concept

---

## Golden Rule

If the domain logic lives outside the domain, the architecture is broken.

---

## Metadata

- **Status:** Normative
- **Alignment:** Domain Driven Design
