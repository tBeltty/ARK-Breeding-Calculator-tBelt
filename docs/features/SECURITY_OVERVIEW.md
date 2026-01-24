# Security Overview: Authentication and Validation

This document provides a general overview of the security mechanisms implemented in the platform, focusing on business logic and standards used, without exposing sensitive infrastructure details.

## 1. Two-Factor Authentication (2FA)

The platform implements a robust **Two-Factor Authentication** system based on industry standards to protect user accounts.

### Technological Standard
The system uses the **TOTP (Time-based One-Time Password)** protocol.
- **Compatibility:** Fully compatible with standardized applications like Google Authenticator, Authy, Microsoft Authenticator, and 1Password.
- **Security:** Codes are generated locally on the user's device and have limited temporal validity, preventing replay attacks.
- **Time Tolerance:** The server implements a tolerance window to handle slight clock desynchronizations between client devices and the server.

### Secure Login Flow
The login process with active 2FA follows a two-phase "Challenge-Response" model:

1.  **Credential Verification:**
    *   User enters email and password.
    *   System validates these primary credentials.
    *   If correct, the system checks if the account has 2FA enabled.

2.  **2FA Challenge:**
    *   If 2FA is active, the server halts login and requests a "Second Factor Token".
    *   User must enter the 6-digit code from their authenticator app.
    *   Session (JWT) is issued only after validating this second code.

---

## 2. Preventive Email Validation System

To ensure data quality and protect sender domain reputation, we implement a real-time, multi-layer email validation system during registration.

### Defense Layers

The system verifies each email address through 5 sequential filters:

1.  **Enumeration Protection:**
    *   Rate Limiting is applied per IP address to prevent automated attacks attempting to discover registered emails.

2.  **Syntax Validation:**
    *   Strict verification of standard email format (RFC 5322).

3.  **Domain Filtering and Reputation:**
    *   **Blocking Invalid TLDs:** Test or local extensions (e.g., `.test`, `.local`) are rejected.
    *   **Temporary Emails:** The system detects and blocks known disposable/burner email domains to ensure legitimate users.
    *   **Suspicious Patterns:** Usernames are analyzed to prevent registrations with fake administrative roles (e.g., `admin@`, `root@`).

4. **Infrastructure Verification:**
    *   The system checks in real-time if the email domain has valid configuration to receive messages.
    *   This ensures the domain exists and has operational technical capacity, drastically reducing bounce rates.

5.  **Availability Verification:**
    *   Finally, it confirms that the email is not already registered in the platform by another active user.

---

### Privacy and Data Handling
All sensitive security-related information (such as 2FA secret seeds and passwords) is stored using strong encryption and is never exposed in plain text or system logs.
