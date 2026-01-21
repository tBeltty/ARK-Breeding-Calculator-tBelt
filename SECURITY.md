# Security Policy

## 🛡️ Core Security Model

### Data Privacy (Client-Side Only)
This application is architected as a **Client-Side Static Application**.
*   **0% Data Storage on Server:** We do not have a backend database for user data.
*   **Application State:** All application state is persisted exclusively in the browser using `localStorage`.
*   **Benefit:** Your application data is processed and stored locally in your browser and is not transmitted to a backend service. If you clear your browser cache, your data is gone. We cannot recover it because we never had it.

### Infrastructure & Scope
The application is hosted on shared infrastructure.
*   **Scope:** `[Production URL]` (The publicly accessible application).
*   **Strictly Out of Scope:** Any other subdomain, port, or service hosted on the same infrastructure. This application is logically isolated from other services hosted on the same infrastructure; any attempt to test or access lateral services outside this scope is considered out of scope for responsible disclosure.

---

## 🔒 Implemented Defenses

We proactively harden the application against common threats using industry-standard controls:

| Category | Control Mechanism |
| :--- | :--- |
| **Availability (DDoS)** | **Rate Limiting:** Request rate limiting is enabled at the edge to mitigate abuse and protect shared infrastructure resources. |
| **Input Security** | **Surface Reduction:** The application design minimizes the use of URL parameters to reduce the attack surface for certain classes of Reflected XSS. |
| **Data Integrity** | **Storage Validation:** All data loaded from `localStorage` undergoes strict schema validation. Invalid or malformed data is automatically discarded to prevent application instability. |
| **Resource Protection** | **Client-Side Constraints:** Input fields enforce length limits to prevent local resource exhaustion (paste attacks). |
| **Computational Safety** | **Math Guards:** Calculations include defensive programming logic to handle mathematical anomalies (e.g., division by zero) gracefully. |

> **Note:** Client-side controls are provided for user experience and basic protection. They do not replace the need for secure infrastructure configuration where applicable. This project does not offer a bug bounty program at this time.

---

## 🐛 Reporting a Vulnerability

We value the security community. If you find a bug:
1.  **Do NOT open a public Issue.**
2.  Email `security@tbelt.online` (or contact the maintainer directly).
3.  Provide a reproduction step (e.g., "Set localStorage key X to value Y").

We aim to acknowledge valid reports within a reasonable timeframe.

### Policy on Pull Requests
This repository does **not** accept Pull Requests. This decision is intentional to preserve deterministic builds, reproducible deployments, and a tightly controlled release process.
