# ADR-0001: Clean Architecture Adoption

## Status
Accepted

## Context

The application started as a typical React+Express monolith with:
- Fat controllers containing business logic
- Direct API calls from components
- Mixed concerns in context providers

As the codebase grew to 20,000+ lines, these patterns became problematic:
- Changes to business rules required touching multiple files
- Testing required extensive mocking
- New developers struggled to understand the system

## Decision

Adopt **Pragmatic Clean Architecture** with the following structure:

### Frontend
```
client/src/
  domain/
    usecases/       ← Business rules
    repositories/   ← Interfaces
  infrastructure/
    repositories/   ← API implementations
  context/          ← State management (orchestration only)
  views/            ← Presentation
```

### Backend
```
server/
  controllers/      ← Thin, HTTP handling only
  services/         ← Business logic
  models/           ← Data layer
```

### Core Constraint

An abstraction is valid only if it:
1. Removes duplication
2. Isolates volatility
3. Enables independent change

CRUD trivial operations MAY bypass the Application Layer.

## Alternatives Considered

1. **Keep current structure** - Rejected: Technical debt growing
2. **Full DDD** - Rejected: Over-engineering for our scale
3. **Hexagonal pure** - Rejected: Too many layers for team size

## Consequences

### Positive
- Clear separation of concerns
- Business logic is testable without framework
- New features follow predictable patterns
- Refactors are safer

### Negative
- Initial learning curve for team
- More files for non-trivial operations
- Requires discipline to maintain

### Metrics
- Use Cases: 22
- Repositories: 8
- Backend Services: 7
- Test coverage: 80%+

---

**Date:** December 2025  
**Authors:** Engineering Team
