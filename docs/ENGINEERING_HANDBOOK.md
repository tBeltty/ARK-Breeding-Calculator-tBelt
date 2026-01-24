# 📘 Engineering Handbook

**Version:** 1.5.0  
**Last Updated:** December 2025  
**Status:** Normative

---

## Welcome

This handbook defines how we build software at tBelt Finances.

Every guideline exists to reduce complexity, increase quality, and make change easier.

---

## Table of Contents

1. [Architecture](#1-architecture)
2. [Coding](#2-coding)
3. [Testing](#3-testing)
4. [CSS](#4-css)
5. [Domain Modeling](#5-domain-modeling)
6. [API](#6-api)
7. [Security](#7-security)
8. [Performance & Observability](#8-performance--observability)
9. [Definition of Done](#9-definition-of-done)
10. [ADR](#10-adr)

---

## Quick Reference

### Core Principles

| Principle | Rule |
|-----------|------|
| **Architecture** | All dependencies point inward. Abstractions must reduce complexity. |
| **Coding** | Clarity beats cleverness. Explicit beats implicit. |
| **Testing** | Coverage is a control metric, not a goal. |
| **CSS** | No `!important`. Low specificity. Design tokens only. |
| **Security** | Security is a property, not a feature. |

### The Golden Rules

> **Architecture:** If an abstraction doesn't remove duplication, isolate volatility, or enable independent change — it must not exist.

> **Coding:** If a name requires a comment, the name is wrong.

> **Testing:** If a bug is found, there must be a test that would have prevented it.

> **CSS:** If you need `!important`, the problem is component design.

> **Done:** If any condition is unmet, the task is not done.

---

## 1. Architecture

📄 [Full Document](./guidelines/ARCHITECTURE.md)

### Core Constraint

An abstraction is valid only if it:
1. Removes duplication
2. Isolates volatility
3. Enables independent change

### Dependency Rule

All dependencies must point inward:
- Presentation → Application → Domain
- Infrastructure → Application → Domain

### Use Case Granularity

- Use cases must represent meaningful business intent
- CRUD trivial may bypass Application Layer if no business rules exist

---

## 2. Coding

📄 [Full Document](./guidelines/CODING.md)

### File Design

- 300-400 lines acceptable if one clear responsibility
- Use Cases: 20-60 lines
- Controllers: thin and orchestration only

### Control Flow

```javascript
// ✅ Early returns
function process(amount) {
  if (amount <= 0) return Result.fail(new InvalidAmountError());
  if (!hasBalance(amount)) return Result.fail(new InsufficientBalanceError());
  return execute(amount);
}
```

---

## 3. Testing

📄 [Full Document](./guidelines/TESTING.md)

### Testing Pyramid

| Level | Percentage |
|-------|------------|
| Unit | 70-80% |
| Integration | 15-25% |
| E2E | 5-10% |

---

## 4. CSS

📄 [Technical Guidelines](./guidelines/CSS.md)  
🎨 [Visual System (Atmos UI)](./ATMOS_UI.md)

### Forbidden

- `!important`
- Deep nesting
- ID selectors
- Magic values

---

## 5. Domain Modeling

📄 [Full Document](./guidelines/DOMAIN_MODELING.md)

---

## 6. API

📄 [Full Document](./guidelines/API.md)

---

## 7. Security

📄 [Full Document](./guidelines/SECURITY.md)

---

## 8. Performance & Observability

📄 [Full Document](./guidelines/PERFORMANCE_OBSERVABILITY.md)

---

## 9. Definition of Done

📄 [Full Document](./guidelines/DEFINITION_OF_DONE.md)

A task is done only if:

- [ ] Code follows Architecture Guidelines
- [ ] Code follows Coding Guidelines
- [ ] Tests are written and meaningful
- [ ] Coverage thresholds respected
- [ ] Performance not degraded
- [ ] No new technical debt
- [ ] Code reviewed

---

## 10. ADR

📄 [Full Document](./guidelines/ADR.md)

ADRs govern exceptions to these guidelines.

---

## Enforcement

These guidelines are enforced through:

- CI automation where possible
- Mandatory code reviews
- Definition of Done checks

Exceptions require an approved ADR.

---

## Directory Structure

```
docs/
├── ENGINEERING_HANDBOOK.md
├── guidelines/               ← Normative engineering guidelines
│   ├── ARCHITECTURE.md
│   ├── CODING.md
│   ├── CSS.md
│   ├── TESTING.md
│   ├── API.md
│   ├── DOMAIN_MODELING.md
│   ├── PERFORMANCE_OBSERVABILITY.md
│   ├── SECURITY.md
│   ├── DEFINITION_OF_DONE.md
│   └── ADR.md
├── decisions/                ← Architecture Decision Records
├── guides/                   ← How-to guides
└── reports/                  ← Tech debt, incidents
```

---

## Handbook Evolution

- Changes to this handbook require review
- Structural changes require an ADR
- Deprecated rules must be explicit

---

## Final Word

> "Technical debt starts with tolerated discomfort."

If code makes you say "this works, but…" — it must not be merged.
