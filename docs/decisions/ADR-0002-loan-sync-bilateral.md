# ADR-0002: Loan Sync Bilateral Model

## Status
Accepted

## Context

Users need to share loans between accounts (e.g., lending to family members). The challenge:
- Both parties need visibility into the loan
- One party may want to track interest, the other may not
- Changes by one party shouldn't corrupt the other's view

Initial approach was a simple `sharedWith` field, but this created:
- Inconsistent data between views
- No audit trail for disputes
- No approval workflow for sensitive changes

## Decision

Implement a **Bilateral Linked Loan System**:

### Model
```
Loan (lender's view) ←→ LinkedLoan (borrower's view)
         ↓                        ↓
    Payments              SyncedPayments
```

### Key Rules

1. **Linking is opt-in** - Both parties must accept
2. **Each party owns their view** - Provider can set interest, client sees different terms if needed
3. **Payments require approval** - Client payment requests go to provider for approval
4. **Sync is manual** - No automatic data merge, explicit accept/reject

### Role Terminology
- **Provider** (formerly Lender) - Creates the loan, approves changes
- **Client** (formerly Borrower) - Views synced loan, requests payments

## Alternatives Considered

1. **Single shared record** - Rejected: No ownership clarity
2. **Copy-on-link** - Rejected: Data drift without sync
3. **Real-time sync** - Rejected: Conflict resolution too complex

## Consequences

### Positive
- Clear ownership model
- Audit trail for all changes
- Disputes can reference specific requests

### Negative
- More complex data model
- More API endpoints
- Requires notification system

---

**Date:** December 2025  
**Authors:** Engineering Team
