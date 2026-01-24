# API Design Guidelines

## Core Philosophy

APIs are long lived contracts.

Bad API design creates permanent cost across all clients.

---

## General Rules

1. APIs must be explicit and predictable
2. Breaking changes are forbidden without versioning
3. Errors must be part of the contract
4. Backward compatibility is the default

---

## Naming

1. Use nouns for resources
2. Use verbs only for non resource actions
3. Use plural nouns
4. Use consistent casing

**Example:**
```
GET /users
POST /users/{id}/upgrade-plan
```

---

## Versioning

1. All public APIs must be versioned
2. Versioning is done at the URL level
3. Breaking changes require a new version

**Example:**
```
/api/v1/users
```

---

## Error Handling

1. Errors must be structured
2. Error codes must be stable
3. Messages must be human readable
4. No stack traces in responses

**Example:**
```json
{
  "code": "INSUFFICIENT_BALANCE",
  "message": "User balance is insufficient"
}
```

---

## Validation

1. Validate inputs at the boundary
2. Reject invalid data early
3. Never rely on client side validation

---

## Golden Rule

An unclear API is a broken API.

---

## Metadata

- **Status:** Normative
- **Alignment:** Contract First Design
