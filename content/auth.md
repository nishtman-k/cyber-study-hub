# Authentication vs Authorization

---

## 1. The One-Sentence Difference

> **Authentication** = "Who are you?" (proving identity)
>
> **Authorization** = "What can you do?" (granting permissions)

They sound similar but solve **two completely different problems**. Mixing them up is one of the most common mistakes in security.

### Quick analogy — going to a concert

```
At the entrance, the bouncer checks your ID.
   → This is AUTHENTICATION (proving you are who you say you are)

Once inside, your ticket determines where you can go.
   General Admission → main floor only
   VIP ticket → backstage access
   → This is AUTHORIZATION (what you're allowed to do)
```

You can be **authenticated** (proven identity) but still not **authorized** (not allowed) for a specific area. Both checks must pass to get in.

---

## 2. Purpose of Authentication

**Authentication** is the process of verifying that someone (or something) is who they claim to be.

### Why we need it

- Prevent **unauthorized access** — keep impostors out
- Establish **accountability** — know who did what
- Enable **personalization** — show the right user's data
- Required for **authorization** to even be possible — you can't grant permissions to someone you don't recognize
- **Legal & compliance** — laws like GDPR, HIPAA require strong identity verification

### Real-world examples

| Scenario | Authentication method |
|----------|---------------------|
| Log into Gmail | Email + password (+ MFA) |
| Unlock your phone | Face ID / fingerprint / PIN |
| SSH into a server | Username + SSH key |
| Use an ATM | Bank card + PIN |
| Sign a document electronically | Digital certificate |

---

## 3. Purpose of Authorization

**Authorization** is the process of granting or denying specific permissions to an authenticated user.

### Why we need it

- **Least privilege** — give each user only what they need
- **Data segregation** — staff in HR shouldn't see financial records
- **Compliance** — many regulations require strict access controls
- **Prevent damage** — limit what a compromised account can do
- **Multi-tenant systems** — keep users' data separate

### Real-world examples

| Authenticated user | Authorization decision |
|--------------------|----------------------|
| Regular employee logged into HR app | Can view their own records, not others |
| Department manager | Can view their team's records |
| HR admin | Can view and edit any employee record |
| External contractor | Can access only the contract project folder |

---

## 4. The Fundamental Differences

| Aspect | **Authentication** | **Authorization** |
|--------|--------------------|--------------------|
| **Question answered** | Who are you? | What can you do? |
| **What's checked** | Identity (credentials) | Permissions (rights) |
| **Order** | Happens first | Happens after authentication |
| **Data needed** | Username, password, biometric, token | Role, policy, ACL, attributes |
| **Visible to user** | Yes (login screens, MFA prompts) | Usually invisible (system-enforced) |
| **Can change frequently?** | Less often (passwords, MFA setup) | Yes (role changes, project access) |
| **Typical HTTP code on failure** | `401 Unauthorized` | `403 Forbidden` |
| **Example failure** | "Wrong password" | "You don't have permission to delete this" |
| **Owned by** | Identity Provider (IdP) | Application or policy engine |
| **Common abbreviation** | AuthN | AuthZ |

### Visual flow

```
User wants to do X
       ↓
[AUTHENTICATION] ──── fails ───→ Reject (401 Unauthorized)
       ↓ succeeds
[AUTHORIZATION] ──── fails ───→ Reject (403 Forbidden)
       ↓ succeeds
   Action allowed
```

---

## 5. The Correct Sequence

**Authentication ALWAYS comes before authorization.** You can't grant permissions to someone you haven't identified.

```
1. User presents credentials
        ↓
2. System authenticates (verifies identity)
        ↓
3. If authenticated, system checks authorization (verifies permissions)
        ↓
4. If authorized, the action is performed
        ↓
5. The action is logged (accounting / audit)
```

This is part of the **AAA framework**: **A**uthentication, **A**uthorization, **A**ccounting (sometimes called **A**uditing).

### Why order matters

- You **cannot authorize an unknown user** — there's no "permission record" to check against
- Reversing the order leaks information — "this resource exists but you can't access it" tells attackers what to target
- Audit logs need to show **who** did **what**, which requires authentication first

---

## 6. The Three Authentication Factors

Strong authentication relies on these categories. Each factor is a different "type" of proof:

| Factor | What it is | Examples |
|--------|-----------|----------|
| **Something you KNOW** | Information stored in your memory | Password, PIN, security questions, passphrase |
| **Something you HAVE** | A physical or digital object you possess | Smart card, security token, phone (for SMS/app), USB key (YubiKey) |
| **Something you ARE** | A physical/biological characteristic | Fingerprint, face scan, iris, voice, behavior patterns |

### Optional additional factors (modern extensions)

| Factor | Description | Examples |
|--------|-------------|----------|
| **Somewhere you ARE** | Location-based | GPS, IP geolocation, "only login from office" |
| **Something you DO** | Behavioral biometrics | Typing rhythm, mouse movement patterns, gait |

### Strong vs weak factor combinations

| Combination | Strength | Why |
|-------------|----------|-----|
| Password only | Weak | Single factor, easily stolen |
| Password + security question | Weak | Both are "something you know" — same category |
| Password + SMS code | **Medium** | Two different factors (know + have) |
| Password + authenticator app | **Strong** | Two factors, app codes can't be SIM-swapped |
| Password + hardware key + fingerprint | **Very strong** | Three different factors |

### Important rule

**True MFA requires factors from DIFFERENT categories.** Two passwords aren't MFA — they're the same factor twice.

---

## 7. How the Authentication Process Works

The typical flow for a username + password login:

```
1. User enters credentials (username + password)
        ↓
2. Credentials sent securely to server (over HTTPS)
        ↓
3. Server hashes the password using the same algorithm as storage
        ↓
4. Server compares the hash with the stored hash for this username
        ↓
5. If match: authentication succeeded
        ↓
6. Server creates a session (cookie or JWT token)
        ↓
7. User receives the session token, uses it for future requests
```

### Where things can go wrong

| Step | Risk | Defense |
|------|------|---------|
| Credential entry | Keylogger, phishing | Use password manager, watch URLs |
| Transmission | Man-in-the-middle attack | Always HTTPS / TLS |
| Storage | Database breach | Hash with bcrypt/Argon2 + salt |
| Comparison | Timing attack | Use constant-time comparison |
| Session creation | Predictable tokens | Cryptographically random tokens |
| Session use | Session hijacking | HTTPS, HttpOnly cookies, short expiration |

### Modern flow with MFA

```
1. Enter username + password → ✓ first factor (something you know)
2. Server prompts for second factor
3. User enters code from authenticator app → ✓ second factor (something you have)
4. Server validates code (time-based, 30-second window)
5. Session created
```

---

## 8. Main Authentication Protocols

| Protocol | Use case | How it works |
|----------|----------|--------------|
| **Basic Auth** | Simple, legacy APIs | Username:password sent (base64-encoded) on every request |
| **Session-based** | Traditional web apps | After login, server gives a session ID cookie |
| **JWT** (JSON Web Token) | Modern web APIs | Signed token containing claims (user ID, role, expiry) |
| **OAuth 2.0** | "Sign in with Google/GitHub" | Delegated authorization — get a token from a 3rd party |
| **OpenID Connect (OIDC)** | OAuth + identity | Adds identity verification on top of OAuth 2.0 |
| **SAML** | Enterprise SSO | XML-based, used by corporate identity systems |
| **Kerberos** | Windows/AD networks | Ticket-based authentication |
| **LDAP** | Directory services | Query a central directory for user info |
| **RADIUS** | Network access (Wi-Fi, VPN) | Centralized auth for network devices |
| **TACACS+** | Cisco device admin | Cisco's alternative to RADIUS |
| **mTLS** (Mutual TLS) | Service-to-service | Both client and server present certificates |
| **WebAuthn / FIDO2** | Passwordless | Hardware keys, biometrics, no password sent |

### Protocol comparison for web apps

```
Traditional web app  →  Session cookies (server-side state)
SPA / Mobile app     →  JWT (stateless, easier to scale)
Third-party login    →  OAuth 2.0 + OpenID Connect
Enterprise SSO       →  SAML (older) or OIDC (modern)
```

---

## 9. Single-Factor vs Multi-Factor Authentication

### Single-factor authentication (SFA)

Uses **one** of the three factor categories — typically a password.

| Pros | Cons |
|------|------|
| Simple, fast | Single point of failure |
| No extra device needed | Vulnerable to phishing |
| Universally supported | Stolen credentials = full access |

### Multi-factor authentication (MFA)

Uses **two or more** factors from **different categories**.

| MFA flavor | Description |
|-----------|-------------|
| **2FA** (Two-Factor) | Most common: password + one more factor |
| **3FA** (Three-Factor) | Password + token + biometric |
| **Step-up MFA** | Extra factor only for sensitive actions (e.g., wire transfers) |
| **Adaptive MFA** | More factors required based on risk (unusual location, new device) |
| **Passwordless** | Skips password entirely (biometric + hardware key) |

### Common MFA methods compared

| Method | Strength | Phishing-resistant? |
|--------|----------|---------------------|
| SMS codes | Weak | No (SIM swap, intercept) |
| Email codes | Weak | No (email compromise) |
| TOTP app (Google Authenticator, Authy) | Strong | No (codes can be phished) |
| Push notification (Duo, Microsoft Authenticator) | Strong | Partial |
| Hardware key (YubiKey, FIDO2) | Very strong | **Yes** ← the gold standard |
| Biometric on local device | Strong | Yes (when on-device) |

### Why SMS-based MFA is the weakest

- Subject to **SIM-swap attacks** (attacker convinces carrier to transfer your number)
- SMS can be intercepted via SS7 vulnerabilities
- Used widely anyway because it's better than nothing

---

## 10. HTTP Status Codes for Auth

When auth fails in a web app/API, the server tells the client which type of failure occurred via HTTP status codes:

| Code | Name | Meaning | When to use |
|------|------|---------|-------------|
| **401** | Unauthorized | **Authentication failed** | Missing or invalid credentials. "I don't know who you are." |
| **403** | Forbidden | **Authorization failed** | Identity is known, but not allowed. "I know who you are, but you can't access this." |
| **407** | Proxy Authentication Required | Need to auth to a proxy first | Rare — corporate proxies |
| **511** | Network Authentication Required | Captive portal | Hotel/airport Wi-Fi login pages |

### Common confusion — 401 is misnamed

The name "401 Unauthorized" is **historically misleading** — it actually means "**unauthenticated**" (no/bad credentials). 403 Forbidden is the actual "unauthorized" code.

```
HTTP/1.1 401 Unauthorized   ←  "We don't know who you are. Authenticate first."
HTTP/1.1 403 Forbidden      ←  "We know who you are, but you can't have this."
```

### Example flow

```
GET /admin/users
        ↓
No token in request:
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="api"

        ↓ User logs in, gets token

GET /admin/users
Authorization: Bearer <token>
        ↓
Token is valid (authenticated) but user is not admin:
HTTP/1.1 403 Forbidden
```

---

## 11. Main Authorization Models

| Model | How permissions are decided | Use case |
|-------|----------------------------|----------|
| **DAC** (Discretionary) | The owner of a resource decides who can access it | Linux file permissions (`chmod`) |
| **MAC** (Mandatory) | A central authority enforces rules — users can't override | Military, government, SELinux |
| **RBAC** (Role-Based) | Permissions assigned to roles, users assigned to roles | Most modern apps, enterprises |
| **ABAC** (Attribute-Based) | Permissions based on attributes (user, resource, context) | Fine-grained, dynamic environments |
| **ReBAC** (Relationship-Based) | Based on relationships between entities | Social networks, Google Zanzibar |
| **PBAC** (Policy-Based) | Centralized policy evaluation (combines models) | Cloud platforms (AWS IAM, Azure) |

### Quick decision guide

| Need | Use |
|------|-----|
| Simple "owner controls access" | DAC |
| Strict, top-down rules | MAC |
| Permissions grouped by job function | RBAC |
| Context-aware (time, location, device) | ABAC |
| Social/relationship-based | ReBAC |
| Cloud-scale, multi-tenant | PBAC (with OPA, AWS IAM) |

---

## 12. RBAC — Role-Based Access Control

**RBAC** is the most widely used authorization model. It assigns permissions to **roles**, and users get one or more roles.

### The 3 core concepts

```
Users  ─assigned to─→  Roles  ─granted─→  Permissions
```

| Concept | Description | Example |
|---------|-------------|---------|
| **User** | A person or service | `alice@example.com` |
| **Role** | A job function or group | `editor`, `viewer`, `admin` |
| **Permission** | An action on a resource | `articles.delete`, `users.create` |

### Example — a blog platform

```
Roles:
  - viewer     → can read articles
  - editor     → can read + create + edit articles
  - admin      → can read + create + edit + delete + manage users
  
Users:
  - alice    → role: editor
  - bob      → role: viewer
  - charlie  → role: admin
```

When Bob tries to delete an article:
1. System looks up Bob's role: `viewer`
2. Checks if `viewer` has `articles.delete` permission: **NO**
3. Response: `403 Forbidden`

### Variations of RBAC

| Variant | Description |
|---------|-------------|
| **Flat RBAC** | Users → roles → permissions (simplest) |
| **Hierarchical RBAC** | Roles inherit from other roles (admin inherits editor's permissions) |
| **Constrained RBAC** | Separation of duties — same person can't have both "approver" and "submitter" |

### Why RBAC is popular

- **Easy to manage** — change permissions per role, not per user
- **Onboarding/offboarding** — assign or remove a role
- **Audit-friendly** — easy to answer "who can do X?"
- **Scales well** — works for 10 users or 100,000

### When RBAC starts to break

- Many edge cases needing per-user exceptions
- Permissions depend on context (time, location, resource owner)
- Roles multiply uncontrollably ("role explosion")

→ At this point, consider **ABAC**.

---

## 13. ABAC — Attribute-Based Access Control

**ABAC** decides access based on **attributes** of the user, resource, action, and context — not just role.

### The 4 attribute categories

| Category | Examples |
|----------|----------|
| **Subject** (user) | Department, clearance level, age, employment status |
| **Resource** | Sensitivity level, owner, type, classification |
| **Action** | Read, write, delete, approve, share |
| **Environment** | Time of day, location, IP address, device type |

### Example ABAC policy

```
"Allow read access to financial reports IF:
  - user.department == 'finance'
  AND user.clearance_level >= 3
  AND resource.classification == 'confidential'
  AND time.hour BETWEEN 9 AND 17
  AND user.location == 'office'
  AND user.device.is_managed == true"
```

This single policy handles cases that would require **dozens of RBAC roles**.

### RBAC vs ABAC

| | **RBAC** | **ABAC** |
|---|----------|----------|
| **Decision based on** | Role | Multiple attributes |
| **Complexity** | Simple | Complex (more flexible) |
| **Scalability** | Good for fixed permissions | Better for dynamic permissions |
| **Setup effort** | Low | High |
| **Examples** | Most SaaS apps, GitHub | AWS IAM policies, ABAC engines like OPA, Cedar |

### When to use which

| Use **RBAC** when | Use **ABAC** when |
|-------------------|-------------------|
| Permissions are stable and role-based | Permissions depend on context |
| You have a small set of clear job functions | You need fine-grained control |
| Compliance requires simple, auditable roles | You need conditional access (time, location) |

---

## 14. Components of Authorization

Every authorization decision involves these 4 pieces:

| Component | What it is | Example |
|-----------|-----------|---------|
| **Subject** | Who is requesting | User `alice@example.com` |
| **Object** | What they want to access | The file `/finance/Q3-report.pdf` |
| **Action** | What they want to do | `read`, `write`, `delete` |
| **Context** | Surrounding conditions | Time 3pm, from corporate VPN, on managed laptop |

### The authorization question

```
"Can <SUBJECT> perform <ACTION> on <OBJECT> under <CONTEXT>?"
```

### Components of an enforcement system

```
1. PEP (Policy Enforcement Point) — intercepts the request
       ↓
2. PDP (Policy Decision Point) — evaluates the policy
       ↓
3. PIP (Policy Information Point) — provides attributes (user roles, etc.)
       ↓
4. PAP (Policy Administration Point) — where policies are written/managed
```

| Component | Real-world example |
|-----------|-------------------|
| **PEP** | Web server, API gateway, firewall |
| **PDP** | Open Policy Agent (OPA), AWS IAM, Cedar |
| **PIP** | LDAP, Active Directory, user database |
| **PAP** | Admin console, policy management UI |

---

## 15. Security Best Practices

### Advantages of implementing BOTH authentication and authorization

- **Defense in depth** — two independent layers
- **Reduces blast radius** — if auth is bypassed, authz still blocks unauthorized actions
- **Audit clarity** — separate logs for "who they are" vs "what they did"
- **Flexible access** — same identity can have different permissions in different systems

### Risks of skipping authentication

| If you skip auth... | What can happen |
|---------------------|----------------|
| Anyone can claim any identity | Mass impersonation |
| No audit trail of who did what | Can't investigate breaches |
| No accountability | Can't enforce policies |
| Data exposure | Sensitive info exposed publicly |

### Risks of skipping authorization

| If you skip authz (auth only)... | What can happen |
|---------------------------------|----------------|
| **Any** authenticated user can do **anything** | Insider threats unchecked |
| Compromised account = total breach | One stolen password = game over |
| No least-privilege enforcement | Excessive damage from mistakes |
| **Broken Access Control** — #1 on OWASP Top 10 (2021/2024) | The most common web vulnerability |

### How they work together

```
Layer 1: AUTHENTICATION
   - Strong password requirements
   - MFA for sensitive accounts
   - Account lockout after failed attempts
   - Session timeout
   - Rate limiting

Layer 2: AUTHORIZATION
   - Least privilege by default
   - Role-based or attribute-based controls
   - Resource ownership enforcement
   - Time-of-day / location restrictions
   - Periodic permission reviews
```

### Common authorization mistakes

| Mistake | Example | Fix |
|---------|---------|-----|
| **IDOR** (Insecure Direct Object Reference) | `GET /users/123/profile` returns any user's data | Check the user owns the resource |
| **Missing function-level access control** | Admin endpoints accessible to all logged-in users | Authorize every endpoint, not just login |
| **Client-side authorization** | Hiding the delete button in JS | Always enforce on the server |
| **Forced browsing** | Guessing URLs to access restricted pages | Authorize on every request |
| **Privilege escalation** | User changes own role via API | Validate all role/permission changes |

---

## 16. Username/Password vs Biometric Authentication

| | **Username + Password** | **Biometric** |
|---|-------------------------|---------------|
| **Factor type** | Something you know | Something you are |
| **Can be stolen?** | Yes (phishing, leaks) | Hard, but possible (lifted prints, deepfakes) |
| **Can be changed?** | Yes (reset anytime) | **No** (you can't change your fingerprint) |
| **Setup cost** | Low | Higher (sensor hardware) |
| **User experience** | Cumbersome (typing, remembering) | Fast and convenient |
| **Universally available** | Yes (any keyboard) | Limited (needs sensor) |
| **Shareable** | Easily (good or bad) | Hard to share |
| **Privacy concern** | Low (just a string) | High (irrevocable personal data) |
| **Works remotely** | Yes | Limited (needs trusted device) |

### The dark side of biometrics

- **You can't change them** — if your fingerprint database leaks, you can't get new fingerprints
- **Coerced unlock** — someone can physically force your finger to a sensor
- **Privacy** — biometric data is uniquely identifying forever
- **Spoofing** — high-resolution photos can fool some face scanners
- **Cross-device problem** — biometric on one device doesn't transfer

### Best practice — combine them

The strongest setups use **biometrics as a local factor** for unlocking a device-bound credential:

```
Your face unlocks → Phone unlocks → Phone has a hardware key → That key authenticates to the server
```

This is how Apple Pay, Face ID + iCloud Keychain, and FIDO2/WebAuthn work.

---

## 17. Real-World Example — Web App Login

Let's trace what happens when Alice logs into a banking app and tries to transfer money:

### Step 1 — Authentication

```
1. Alice navigates to bank.com → page sends an HTTPS request
2. Server returns the login page
3. Alice types her username and password → submits over HTTPS
4. Server hashes Alice's password and compares with the stored hash
5. If match: server prompts for MFA code (something you have)
6. Alice enters TOTP code from her phone
7. Server verifies the code
8. Authentication SUCCESS → server creates a session
9. Server sends back a session cookie (HttpOnly, Secure, SameSite)
```

### Step 2 — Authorization (every subsequent request)

```
1. Alice clicks "Transfer $1,000 to Bob"
2. Browser sends request with session cookie
3. Server looks up the session → finds Alice's identity
4. Server checks: does Alice have permission to make transfers?
       → Role check: "customer" → YES
5. Server checks: can Alice access THIS account?
       → Resource ownership check: account belongs to Alice → YES
6. Server checks: are there context restrictions?
       → Daily transfer limit check: under limit → YES
       → Suspicious activity check: normal pattern → YES
7. All checks pass → transfer executed
```

### Common failure points

| Where it fails | Status code | What it means |
|---------------|-------------|---------------|
| Wrong password | `401 Unauthorized` | Auth failed |
| Wrong MFA code | `401 Unauthorized` | Auth still incomplete |
| Trying to transfer from someone else's account | `403 Forbidden` | Auth OK but not authorized |
| Transfer over daily limit | `403 Forbidden` | Authorized in general, blocked by context |

---

## 18. Quick Reference

### Mnemonic to remember

> **"AuthN: I am Alice."** (Authentication = Name = Identity)
>
> **"AuthZ: Alice can read this."** (Authorization = Zone = Permission)

### Status code cheat sheet

```
401 Unauthorized    →   "Authenticate yourself"     (no/bad credentials)
403 Forbidden       →   "You can't have this"       (no permission)
```

### The 3 factors

```
Something you KNOW      (password, PIN)
Something you HAVE      (phone, token)
Something you ARE       (fingerprint, face)
```

### Authorization model selection

```
Simple, owner-driven        →  DAC
Strict, top-down            →  MAC
Role-based (most common)    →  RBAC
Context-aware, fine-grained →  ABAC
```

### The golden rule

> **Always do authentication first. Always enforce authorization on every request — on the server.**

Never trust the client. Never assume "they wouldn't try that URL." If a resource shouldn't be accessible, the **server** must enforce it — not just hide the link.

### Defense layers

```
Layer 1: Strong authentication (MFA where possible)
Layer 2: Least-privilege authorization (deny by default)
Layer 3: Logging & monitoring (detect anomalies)
Layer 4: Regular access reviews (revoke unused permissions)
Layer 5: Secure session management (short-lived tokens, rotation)
```
