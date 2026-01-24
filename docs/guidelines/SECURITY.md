# Security Guidelines

## Core Philosophy

Security is a property of the system, not a feature.

---

## General Rules

1. Validate all external input
2. Apply least privilege everywhere
3. Never trust client input
4. Secure by default

---

## Authentication and Authorization

1. Authentication and authorization are separate concerns
2. Authorization must be explicit
3. Access checks belong to Application or Domain

---

## Secrets Management

1. Secrets must never be committed
2. Secrets must be rotated
3. Secrets must be stored securely

---

## Data Protection

1. Encrypt sensitive data at rest and in transit
2. Avoid logging sensitive data
3. Apply data minimization

---

## Golden Rule

A feature that bypasses security is a vulnerability.

---

## Metadata

- **Status:** Normative
- **Alignment:** Secure by Design
