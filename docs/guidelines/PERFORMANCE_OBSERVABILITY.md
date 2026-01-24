# Performance and Observability Guidelines

## Core Philosophy

Performance issues must be detected before users complain.

Observability is a first class feature.

---

## Performance Rules

1. Measure before optimizing
2. Optimize only hot paths
3. Avoid premature optimization
4. Performance changes require benchmarks

---

## Metrics

Mandatory metrics:

1. Request latency
2. Error rate
3. Throughput
4. Resource usage

Metrics must be actionable.

---

## Logging

1. Logs must be structured
2. Logs must be contextual
3. Logs must avoid sensitive data
4. Logs must be machine parsable

---

## Tracing

1. Distributed tracing is required for async flows
2. Correlation IDs must propagate across services

---

## Golden Rule

What is not observed will degrade silently.

---

## Metadata

- **Status:** Normative
- **Alignment:** Production Reliability
