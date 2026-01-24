# Clean Architecture Guidelines

## Core Philosophy

Clean Architecture is about direction of dependencies, explicit boundaries, and business rules independence.

Frameworks, databases, UI and delivery mechanisms are details.

Business logic must not know or care about how it is delivered, stored, or presented.

## Core Constraint

Clean Architecture must reduce complexity, not introduce it.

An abstraction is valid only if it achieves at least one of the following goals:
1. Removes duplication
2. Isolates volatility
3. Enables independent change

If an abstraction does not clearly satisfy one of these goals, it MUST NOT exist.

---

## 1. Dependency Rule

### Rule

All dependencies must point inward.

### Logical Architecture Overview

**Frontend**

```
client/src/
  domain/
    usecases/
  context/
  components/
  services/
```

**Backend**

```
server/
  controllers/
  services/
  models/
  middleware/
```

**Admin Dashboard**

```
admin_client/src/
  domain/
  hooks/
  components/
  pages/
```

**Shared**

```
shared/
```

### Allowed dependency flow
1. Presentation to Application to Domain
2. Infrastructure to Application to Domain

### Forbidden
1. Domain importing anything else
2. Application importing Presentation or Infrastructure
3. Cross feature imports without an explicit boundary

---

## 2. Layer Responsibilities

### Domain Layer

The heart of the system.

**Contains:**
1. Entities
2. Value Objects
3. Domain Errors
4. Domain Services only when logic does not belong to an entity

**Rules:**
1. Pure JavaScript or TypeScript
2. No framework imports
3. No input output
4. Synchronous only
5. Deterministic behavior only
6. Fully testable with unit tests

**Example:**

```javascript
User.canUpgradePlan(plan)
```

---

### Application Layer

Coordinates business use cases.

**Contains:**
1. Use Cases
2. Application Services
3. Ports as interfaces
4. DTOs owned by the application

**Rules:**
1. A use case represents a meaningful business intent
2. No framework specific code
3. Depends only on Domain
4. Uses Ports for external interactions

**Example:**

```javascript
UpgradeUserPlan.execute(command)
```

---

### Infrastructure Layer

Implements the outside world.

**Contains:**
1. Database adapters
2. HTTP clients
3. External APIs
4. Repository implementations

**Rules:**
1. Implements Application Ports
2. Contains no business logic
3. May depend on frameworks
4. Owns performance optimizations

**Repository Rules:**
1. Repositories must return Domain entities or primitives
2. Repositories must not return ORM models
3. Repositories must not contain business rules
4. Query optimization belongs here

---

### Presentation Layer

Delivery mechanism only.

**Contains:**
1. Controllers
2. UI components
3. View models
4. Request validation

**Rules:**
1. No business logic
2. Calls Application Use Cases only
3. Handles formatting, validation and user input

---

## 3. Feature First Structure

Organize by feature, not by technical type.

**Correct:**

```
billing/
  domain/
  application/
  infrastructure/
  presentation/
```

**Incorrect:**

```
controllers/
services/
repositories/
```

### Feature Boundary Exception

Cross feature imports are allowed only if:
1. Code is purely domain logic
2. No feature specific assumptions exist
3. Code is promoted to shared domain

---

## 4. Ports and Adapters

All external dependencies must be abstracted behind ports.

**Examples:**
1. EmailSender
2. PaymentGateway
3. UserRepository

**Rules:**
1. Use cases depend on interfaces only
2. Implementations live in Infrastructure
3. No adapter leaks into Application or Domain

---

## 5. Use Case Granularity Rule

A Use Case MUST represent a meaningful business intent.

**Bad examples:**
1. GetUserById
2. ValidateEmail
3. MapUserDto

**Good examples:**
1. RegisterUser
2. UpgradeUserPlan
3. CloseAccount

**CRUD trivial MAY bypass the Application Layer if all conditions apply:**
1. No business rules exist
2. No side effects are involved
3. No future policy change is expected

---

## 6. Performance and Hot Path Rules

To protect runtime performance:
1. No DTO mapping inside loops or bulk operations
2. No domain object creation in high frequency read paths
3. No unnecessary async boundaries
4. No repository calls inside entity methods

**Read only queries with no business rules may:**
1. Access Infrastructure directly from Presentation
2. Use CQRS style read models

---

## 7. Forbidden Patterns

1. God services
2. Static utility classes with business logic
3. Fat controllers
4. ORM entities leaking into Domain
5. Domain emitting HTTP responses
6. Application returning framework specific objects

---

## 8. Architecture and Testing Alignment

Testing strategy must follow architecture boundaries:
1. Domain tested with unit tests only
2. Application tested with unit and integration tests
3. Infrastructure tested with integration tests
4. Presentation tested with integration and end to end tests

**Violation rule:**

If a test requires:
1. Database access, it belongs to Infrastructure
2. HTTP calls, it belongs to Presentation
3. Mocking Domain logic, architecture is broken

---

## 9. Evolution Rule

If a new requirement forces:
1. Domain change, architecture is correct
2. Infrastructure workaround, architecture is leaking

---

## 10. Refactor Safety Rule

Any refactor MUST satisfy all conditions:
1. No public behavior change
2. Equal or fewer allocations in hot paths
3. Equal or fewer dependencies per layer

If performance degrades after refactor, architecture is incorrect.

---

## 11. Operational Guidelines

### CI and CD Standards
1. ci.yml handles validation only, lint, test and build
2. deploy.yml handles deployment only
3. restart workflows are production only
4. All deploy workflows must be protected by branch rules

### Backend Service and Controller Pattern

**Services:**
1. Handle all business logic
2. Must not import HTTP or framework objects
3. Must not import Controllers

**Controllers:**
1. Must be thin
2. Only parse input and format output

### Shared Code and ADRs
1. Shared logic must live in shared domain
2. No cross client imports
3. Major decisions require ADR documentation

### Database rule:
1. database.sqlite is allowed for local development only

---

## Metadata

- **Adopted:** v1.5.0
- **Reviewed:** v1.6.3 (Jan 2026)
- **Status:** Normative
- **Compliance Level:** Pragmatic Clean Architecture