# 🧪 Testing Standards & Guidelines

## Core Philosophy

**Coverage is a control metric, not a goal.**

High coverage is valuable only if it reflects real scenarios and detects real regressions.  
A test suite exists to protect behavior, not to validate implementation.

---

## 1. Test Behavior, Not Implementation

### Rules

1. Never test private methods or internal state
2. Never assert on implementation details
3. Tests must survive refactors

If a refactor breaks a test but the application still works, the test is incorrect.

### Focus

1. Clear inputs
2. Observable outputs
3. Verifiable final state

### Assertion Guidelines

1. Prefer `toEqual` and `toMatchObject`
2. Avoid `toHaveBeenCalledWith`
3. Use call assertions only at system boundaries such as ports and adapters

---

## 2. Strict Testing Pyramid

The distribution of tests must follow this structure:

1. **Unit tests: 70 to 80 percent**
   - Pure logic
   - No I/O
   - No framework
2. **Integration tests: 15 to 25 percent**
   - Real dependencies in controlled environments
   - Verify wiring and contracts
3. **End to end tests: 5 to 10 percent**
   - Critical user flows only

Breaking the pyramid is a sign of architectural leakage.

---

## 3. Fakes Over Mocks

### Rules

1. Prefer fakes over mocks whenever possible
2. Mocks are allowed only at external boundaries
3. Never mock domain logic

### Examples

**Allowed:**
1. In memory database
2. Fake authentication provider
3. Fake email sender

**Mocks are valid only to verify:**
1. That a boundary interaction happened
2. That a contract was respected

Internal flow verification is forbidden.

---

## 4. Snapshot Usage

Snapshots are allowed only when the output is stable.

### Allowed

1. Static UI components
2. Serialized configuration objects

### Forbidden

1. Business logic
2. Dynamic data
3. Frequently changing output

A snapshot that needs frequent updates is a bad test.

---

## 5. Determinism and Speed

### Determinism Rules

1. Tests must always fail or always pass
2. No uncontrolled time usage
3. No uncontrolled randomness

Time and randomness must be injected or controlled explicitly.

### Speed Rules

1. Test suites must be fast
2. Avoid heavy setup in beforeEach
3. Prefer local setup per test
4. Use fake timers where appropriate

Slow tests are ignored tests.

---

## 6. Tests as Documentation

Tests are executable documentation.

### Naming Rules

1. Test names must describe behavior
2. Use complete sentences
3. Avoid generic names

**Correct:**
```javascript
it('rejects payment when balance is insufficient')
```

**Incorrect:**
```javascript
it('should work')
```

### Structure Rules

1. One test equals one reason to fail
2. Keep assertions focused
3. Avoid testing multiple behaviors in one test

---

## 7. Builders and Fixtures

### Rules

1. Avoid large hardcoded JSON objects
2. Use builders or factories for test data
3. Test data must be explicit and intention revealing

**Example:**
```javascript
const user = UserBuilder.valid()
  .withEmail('acc@test.com')
  .build();
```

Builders reduce duplication and increase test clarity.

---

## 8. Regression Tests

### The Golden Rule

If a bug is found, there must be a test that would have prevented it.

If such a test does not exist:
1. Write the test first
2. Then fix the bug

Every bug increases the strength of the test suite.

---

## 9. Coverage Thresholds

Coverage thresholds exist to protect standards, not to force numbers.

### Recommended minimums

```
branches: 80
functions: 80
lines: 80
```

### Exclusions

The following may be excluded from coverage:
1. Index files
2. Simple wiring code
3. DTOs with no logic

Low value coverage is worse than low coverage.

---

## 10. Clean Code in Tests

Tests are production code.

### Rules

1. Refactor tests regularly
2. Remove duplication
3. Use clear helpers
4. Maintain a clear folder structure

Fragile tests are technical debt.

---

## Metadata

- **Adopted:** v1.4.0
- **Status:** Normative
- **Protocol:** Zero Tolerance Testing Standard
- **Alignment:** Clean Architecture and Behavior Driven Design
