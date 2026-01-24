# Implementation Plan - tBelt Finances

## Planned Versions

```
v1.3.0 (Current) ─── Theming System ✅
     │
v1.4.0 ─────────── Multiple Income Streams
     │
v1.5.0 ─────────── Personal Loans
     │
v1.6.0 ─────────── Advanced Credits
     │
v2.0.0 ─────────── Web3 Integration
```

---

## v1.4.0 - Multiple Income Streams
**Estimate:** 1-2 weeks | **Complexity:** Medium

### Objective
Allow registration of multiple income sources beyond the main salary.

### Features
| Feature | Description | Priority |
|---------|-------------|-----------|
| Income Streams | Create/edit income sources | High |
| Income Types | Salary, Freelance, Sales, Dividends, Rent, Other | High |
| Recurrence | One-time, Weekly, Biweekly, Monthly | High |
| Status | Pending / Received / Partial | Medium |
| Dashboard | Monthly income widget | Medium |
| History | View past incomes by month | Low |

### Technical Changes

#### Backend
```
models/
  └── Income.js (NEW)
      - id, userId, householdId
      - name: "Freelance project X"
      - amount: 500
      - type: 'salary' | 'freelance' | 'sales' | 'dividends' | 'rent' | 'other'
      - recurrence: 'once' | 'weekly' | 'biweekly' | 'monthly'
      - status: 'pending' | 'received' | 'partial'
      - receivedAmount: 300 (for partials)
      - expectedDate: Date
      - receivedDate: Date

controllers/
  └── incomeController.js (NEW)
      - getIncomes(month)
      - createIncome
      - updateIncome
      - deleteIncome
      - markAsReceived
```

#### Frontend
```
views/
  └── Income/
      ├── IncomeList.jsx (NEW)
      ├── IncomeForm.jsx (NEW)
      └── IncomeWidget.jsx (NEW - for Dashboard)

components/
  └── Dashboard/
      └── IncomeKPI.jsx (NEW - Total monthly income)
```

#### Database
```sql
CREATE TABLE Incomes (
  id INTEGER PRIMARY KEY,
  userId INTEGER,
  householdId INTEGER,
  name VARCHAR(255),
  amount DECIMAL(10,2),
  type VARCHAR(50),
  recurrence VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  receivedAmount DECIMAL(10,2) DEFAULT 0,
  expectedDate DATE,
  receivedDate DATE,
  createdAt DATETIME,
  updatedAt DATETIME
);
```

---

## v1.5.0 - Personal Loans
**Estimate:** 2 weeks | **Complexity:** Medium-High

### Objective
Manage loans given ("they owe me") and received ("I owe").

### Features
| Feature | Description | Priority |
|---------|-------------|-----------|
| Loans Given | Record money lent to others | High |
| Loans Received | Record money borrowed | High |
| Partial Payments | Pay down debt | High |
| Status | Active / Paid / Overdue | High |
| KPI "Owed to You" | Total pending to collect | Medium |
| KPI "You Owe" | Total pending to pay | Medium |
| Reminders | Due date notifications | Low |
| History | Payment history per loan | Medium |

### Technical Changes

#### Backend
```
models/
  └── Loan.js (NEW)
      - id, lenderId, borrowerId (userId or external name)
      - type: 'given' | 'received'
      - personName: "John" (if external)
      - amount: 1000
      - interestRate: 0 (optional)
      - dueDate: Date
      - status: 'active' | 'paid' | 'overdue' | 'forgiven'
      
  └── LoanPayment.js (NEW)
      - loanId, amount, date, note

controllers/
  └── loanController.js (NEW)
```

#### Frontend
```
views/
  └── Loans/
      ├── LoanList.jsx
      ├── LoanForm.jsx
      ├── LoanDetail.jsx (payment history)
      └── LoanPaymentModal.jsx

components/
  └── Dashboard/
      └── LoansWidget.jsx (Owning / Owed)
```

---

## v1.6.0 - Advanced Credits
**Estimate:** 2-3 weeks | **Complexity:** High

### Objective
Complete credit management with interest and installment calculations.

### Features
| Feature | Description | Priority |
|---------|-------------|-----------|
| Credit Types | Card, Auto, Mortgage, Personal | High |
| Installments | X of Y paid | High |
| Calculator | Interests, balance, projection | High |
| Progress bar | Progress visualization | Medium |
| Simulator | "If you pay extra, you save X" | Medium |
| Alerts | Upcoming installments | Low |
| Credit Cards | Limit, cut-off date, minimum payment | Medium |

### Technical Changes

#### Backend
```
models/
  └── Credit.js (NEW)
      - id, userId, householdId
      - name: "Auto Loan"
      - type: 'card' | 'vehicle' | 'mortgage' | 'personal' | 'other'
      - originalAmount: 50000
      - interestRate: 12.5 (annual)
      - monthlyPayment: 1500
      - totalInstallments: 48
      - paidInstallments: 12
      - startDate: Date
      - status: 'active' | 'paid'
      
  └── CreditPayment.js (NEW)
      - creditId, amount, date, installmentNumber

controllers/
  └── creditController.js (NEW)
      - calculateAmortization()
      - simulateExtraPayment()
      - getProjectedEndDate()
```

#### Frontend
```
views/
  └── Credits/
      ├── CreditList.jsx
      ├── CreditForm.jsx
      ├── CreditDetail.jsx
      ├── AmortizationTable.jsx
      └── PaymentSimulator.jsx

components/
  └── Dashboard/
      └── CreditsWidget.jsx (Total debt, next installment)
```

### Calculation Formulas
```javascript
// Monthly installment (French system)
quota = P * (r * (1+r)^n) / ((1+r)^n - 1)

// Where:
// P = Principal (loan amount)
// r = Monthly rate (annual rate / 12)
// n = Number of installments

// Remaining balance after k installments
balance = P * ((1+r)^n - (1+r)^k) / ((1+r)^n - 1)
```

---

## v2.0.0 - Web3 Integration
**Estimate:** 1-2 months | **Complexity:** Very High

### Objective
Integrate crypto wallets and digital asset tracking.

### Features by Phase

#### Phase 1: Wallet Connect (2 weeks)
| Feature | Description |
|---------|-------------|
| MetaMask | Connect wallet |
| WalletConnect | Multi-wallet support |
| ETH Balance | View ETH balance |
| Conversion | ETH → Local Currency |

#### Phase 2: Multi-token (2 weeks)
| Feature | Description |
|---------|-------------|
| ERC-20 tokens | USDT, USDC, etc. |
| Token list | Known token list |
| Portfolio value | Total value in USD |

#### Phase 3: Multi-chain (2 weeks)
| Feature | Description |
|---------|-------------|
| Polygon | Alternative network |
| BSC | Binance Smart Chain |
| Arbitrum | L2 Ethereum |
| Base | L2 Coinbase |

#### Phase 4: DeFi Tracking (3-4 weeks)
| Feature | Description |
|---------|-------------|
| Staking | View staked positions |
| LP tokens | Liquidity provider |
| Yield tracking | APY and rewards |
| Protocols | Aave, Compound, Uniswap |

### Technical Changes

#### Dependencies
```json
{
  "wagmi": "^2.x",
  "viem": "^2.x",
  "@rainbow-me/rainbowkit": "^2.x",
  "ethers": "^6.x"
}
```

#### Backend (optional - for cache)
```
services/
  └── web3/
      ├── priceService.js (CoinGecko API)
      ├── balanceService.js
      └── defiService.js
```

#### Frontend
```
views/
  └── Web3/
      ├── WalletConnect.jsx
      ├── Portfolio.jsx
      ├── TokenList.jsx
      └── DeFiDashboard.jsx

context/
  └── Web3Context.jsx (wagmi provider)
```

---

## Suggested Schedule

```
December 2024
├── Week 1-2: v1.4.0 Multiple Income Streams
└── Week 3-4: v1.5.0 Personal Loans (start)

January 2025
├── Week 1: v1.5.0 Personal Loans (finish)
├── Week 2-3: v1.6.0 Advanced Credits
└── Week 4: Testing and polish

February 2025
├── Week 1-2: v2.0.0 Web3 Phase 1-2
└── Week 3-4: v2.0.0 Web3 Phase 3-4
```

---

## Implementation Priority

1. **v1.4.0 Incomes** - Most requested, basis for cash flow
2. **v1.5.0 Loans** - Complements money management
3. **v1.6.0 Credits** - More complex, but very useful
4. **v2.0.0 Web3** - Differentiator, specific audience

---

*Document updated: 2025-12-05*
*Shall we start with v1.4.0?*
