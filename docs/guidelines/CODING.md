# Coding Standards & Best Practices

## Core Philosophy

Code is read more times than it is written.
Clarity beats cleverness. Explicit beats implicit.

Good code optimizes for:
1. Readability
2. Changeability
3. Correctness
4. Performance only where it matters

---

## 1. Code Style Rules

### Principles
1. Prefer explicit names over comments
2. No abbreviations unless universally known
3. Functions must read like sentences
4. Names must describe intent, not implementation

### Examples

**Good:**
```javascript
calculateRemainingBalance()
```

**Bad:**
```javascript
calcBal()
```

If a name requires a comment, the name is wrong.

---

## 2. Function and File Design

### Single Responsibility Rule

A file must change for only one reason.

Responsibility is defined by business intent, not by technical role.

### File and Component Guidelines

**Focus over size:**
1. A file with 300 to 400 lines is acceptable if it has one clear responsibility
2. A file with 100 lines mixing Domain, Infrastructure and UI is incorrect

**Practical limits:**
1. Use Cases should be between 20 and 60 lines
2. Entities and Value Objects must be small and focused
3. Controllers and Presenters must be thin and orchestration only
4. Repositories must expose simple contracts, implementations are separated

**Separation rule:**

If reading a file makes you think "This should be separated" — it is already too late. Separate it immediately.

### Control flow rules
1. No boolean flags to change behavior
2. Prefer early returns over nested conditionals
3. Cyclomatic complexity must stay low by design

**Good:**
```javascript
function processPayment(amount) {
  if (amount <= 0) return Result.fail(new InvalidAmountError());
  if (!hasBalance(amount)) return Result.fail(new InsufficientBalanceError());

  return executePayment(amount);
}
```

**Bad:**
```javascript
function processPayment(amount, shouldValidate) {
  if (shouldValidate) {
    if (amount > 0) {
      if (hasBalance(amount)) {
        return executePayment(amount);
      }
    }
  }
}
```

---

## 3. Immutability First

### Rules
1. Prefer immutable data structures
2. Never mutate input arguments
3. Use const by default
4. Mutation is allowed only inside well defined boundaries

**Good:**
```javascript
const updatedUser = { ...user, name: newName };
```

**Bad:**
```javascript
user.name = newName;
```

Mutation in Domain code is a code smell unless strictly justified.

---

## 4. Null and Undefined Policy

### Rules
1. Avoid nullable values
2. Do not return undefined from Domain or Application
3. Fail fast at system boundaries
4. Use Result or Either patterns

**Example:**
```javascript
Result.ok(value)
Result.fail(error)
```

If a value can be absent, model it explicitly.

---

## 5. Error Handling

### Principles
1. Errors are values, not strings
2. Domain errors must be explicit and typed
3. Never throw generic Error in Domain or Application
4. Exceptions are infrastructure concerns

**Good:**
```javascript
class InsufficientBalanceError extends Error {
  constructor(required, available) {
    super(`Insufficient balance: required ${required}, available ${available}`);
    this.name = 'InsufficientBalanceError';
    this.required = required;
    this.available = available;
  }
}
```

**Bad:**
```javascript
throw new Error('Not enough money');
```

If an error affects business flow, it belongs to the Domain.

---

## 6. Imports and Dependencies

### Rules
1. Absolute imports only
2. No circular dependencies
3. No cross feature imports unless through public contracts
4. Domain must never import Infrastructure

**Good:**
```javascript
import { User } from '@/domain/User';
```

**Bad:**
```javascript
import { User } from '../../../domain/User';
```

Dependency direction is more important than convenience.

---

## 7. Testing Alignment

### Design rules

All code must be:
1. Deterministic
2. Testable without hacks
3. Independent of time, randomness and globals

If code is hard to test, the design is wrong.

### Architecture rule
1. Domain tests must not mock
2. Application tests may mock ports
3. Infrastructure tests may use real integrations

Mocking Domain logic is forbidden.

---

## 8. Builders and Factories

### Rules
1. Constructors must be simple
2. Complex object creation must use builders or factories
3. No magic defaults
4. Test data must be explicit

**Good:**
```javascript
const user = UserBuilder.valid()
  .withEmail('alice@example.com')
  .withRole('admin')
  .build();
```

**Bad:**
```javascript
const user = new User({
  email: 'alice@example.com',
  role: 'admin',
  createdAt: new Date(),
  settings: { theme: 'dark', lang: 'en' }
});
```

Builders improve readability and reduce test fragility.

---

## 9. Refactoring Rules

**Refactor immediately when:**
1. A function name becomes inaccurate
2. A test requires excessive mocking
3. A file grows beyond understanding
4. Performance issues appear in hot paths

Refactoring without tests is forbidden.

Refactoring must never change observable behavior.

---

## 10. Code Review Checklist

Before approving any change:
1. Does this respect architectural boundaries
2. Is Domain logic clean and explicit
3. Are errors modeled and meaningful
4. Are tests useful and readable
5. Does this make future changes easier
6. Does this avoid unnecessary abstractions

If any answer is no, the code is not ready.

---

## 11. Final Rule

If a piece of code makes you say "this works, but…" — it must not be merged.

Technical debt starts with tolerated discomfort.

---

## Metadata

- **Adopted:** v1.5.0
- **Status:** Normative
- **Alignment:** Pragmatic Clean Architecture
