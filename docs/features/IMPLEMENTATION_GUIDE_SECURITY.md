# Technical Implementation Guide: Security Systems

This manual describes how to implement Two-Factor Authentication (2FA) and Email Validation systems in a Node.js application, following best practices and security standards.

---

## 1. Preventive Email Validation System

The goal is to validate the existence and quality of an email before persisting it to the database or sending messages.

### Recommended Stack
- **Node.js**: Native `dns` module.
- **In-Memory/Redis Storage**: For Rate Limiting.

### A. Implementation Logic

#### Step 1: Rate Limiting by IP
To prevent abuse of the validator for "scanning" emails.

```javascript
const validationRateLimit = new Map(); // Or use Redis in production

function checkRateLimit(ip) {
    const limits = validationRateLimit.get(ip) || { count: 0, time: Date.now() };
    
    // Reset every minute
    if (Date.now() - limits.time > 60000) {
        limits.count = 0;
        limits.time = Date.now();
    }
    
    if (limits.count > 20) throw new Error("Too many requests");
    
    limits.count++;
    validationRateLimit.set(ip, limits);
}
```

#### Step 2: Syntax Analysis and Blacklists
Verify format and block domains known as temporary or invalid.

```javascript
function validateSyntaxAndDomain(email) {
    // 1. Strict Regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return false;

    const domain = email.split('@')[1];
    
    // 2. Block Test TLDs
    if (domain.endsWith('.test') || domain.endsWith('.local')) return false;
    
    // 3. Block Temporary Domains (Example)
    const blacklisted = ['mailinator.com', 'yopmail.com'];
    if (blacklisted.includes(domain)) return false;

    return true;
}
```

#### Step 3: DNS Verification (MX Records)
The definitive test: asking the internet if the domain can receive emails.

```javascript
const dns = require('dns').promises;

async function checkMxRecords(domain) {
    try {
        const records = await dns.resolveMx(domain);
        // If returns records and array is not empty, server exists
        return records && records.length > 0;
    } catch (error) {
        // ENOTFOUND = Domain does not exist
        // ENODATA = Domain exists but has no mail server
        return false;
    }
}
```

---

## 2. Two-Factor Authentication (2FA) - TOTP

Implementation of standard RFC 6238 (TOTP).

### Recommended Stack
- **Cryptographic Library:** `otplib` (Node.js) or compatible.
- **QR Generation:** `qrcode`.
- **Database:** Fields for secret and status.

### Database Schema (Generic Example)
Your `Users` table must have at least:
- `isTwoFactorEnabled` (Boolean): If the user has activated 2FA.
- `twoFactorSecret` (String): The shared secret (encrypted if possible).

### Implementation Flow

#### A. Generation and Linking
When user requests to activate 2FA:

1.  **Generate Secret:**
    ```javascript
    const secret = authenticator.generateSecret();
    // Save 'secret' temporarily in DB associated with user
    ```

2.  **Generate OTP URL:**
    ```javascript
    const otpauth = authenticator.keyuri('user@email.com', 'AppName', secret);
    ```

3.  **Generate QR:**
    ```javascript
    const qrCodeUrl = await qrcode.toDataURL(otpauth);
    // Send QR to frontend for user to scan
    ```

#### B. Verification and Activation
User scans QR and sends 6-digit code to confirm.

```javascript
function verifyAndEnable(user, userToken) {
    const isValid = authenticator.check(userToken, user.twoFactorSecret);
    
    if (isValid) {
        user.isTwoFactorEnabled = true;
        // Save changes in DB
        return true;
    }
    return false;
}
```

#### C. Login with Challenge
Login must be modified to handle two states.

```javascript
async function login(email, password, token2FA) {
    const user = await findUser(email);
    
    // 1. Validate Password
    if (!validPassword(user, password)) throw new Error("Invalid Credentials");
    
    // 2. 2FA Check
    if (user.isTwoFactorEnabled) {
        if (!token2FA) {
            // Stop login, ask client to send token
            return { status: "REQUIRE_2FA" };
        }
        
        // Validate Token
        const validToken = authenticator.check(token2FA, user.twoFactorSecret);
        if (!validToken) throw new Error("Incorrect 2FA Code");
    }
    
    // 3. Success: Generate JWT
    return { token: generateJwt(user) };
}
```

### Important Security Notes
1.  **Time Window:** Configure tolerance window (`window`) to 1 or 2 steps (30-60 seconds) to avoid rejections from desynchronized clocks.
2.  **Backup Codes:** Recommended to implement static recovery codes in case user loses device (out of scope for this basic guide).
3.  **Blocking:** Do not reveal if 2FA is missing or incorrect in a way that allows user enumeration.
