# Security Policy Analysis

> Security policies are the written rules that define how an organization protects its information and systems. They turn security goals into clear, enforceable expectations — and they're the bridge between technical controls, people, and regulatory compliance.

---

## 1. What is a Security Policy?

A **security policy** is a formal, written document that defines an organization's rules, expectations, and responsibilities for protecting its information and systems. It states **what** must be protected and **why**, setting the direction for all security decisions.

### Why policies matter

| Reason | Explanation |
|--------|-------------|
| **Clear expectations** | Everyone knows the rules and their responsibilities |
| **Consistency** | Security is applied the same way across the organization |
| **Compliance** | Required by laws and standards (GDPR, HIPAA, PCI-DSS) |
| **Risk reduction** | Defines controls that prevent incidents |
| **Accountability** | Provides a basis to enforce rules and handle violations |
| **Foundation** | Everything else (standards, procedures) builds on policy |

Without policies, security depends on individuals guessing what's acceptable — inconsistent and unenforceable.

---

## 2. Policy vs Standard vs Procedure vs Guideline

These four terms form a hierarchy from high-level intent to specific instructions. Mixing them up is a common mistake.

| Term | What it is | Mandatory? | Example |
|------|-----------|------------|---------|
| **Policy** | High-level rules and intent ("what & why") | ✅ Yes | "All data must be protected from unauthorized access" |
| **Standard** | Specific mandatory requirements ("what exactly") | ✅ Yes | "Passwords must be at least 12 characters" |
| **Procedure** | Step-by-step instructions ("how") | ✅ Yes | "To reset a password: 1… 2… 3…" |
| **Guideline** | Recommended best practices ("suggestions") | ❌ No | "Consider using a password manager" |

### The relationship

```
POLICY      → the goal/intent       (must protect data)
  STANDARD  → the specific rule      (AES-256 encryption required)
  PROCEDURE → the steps to do it     (how to encrypt a drive)
  GUIDELINE → optional best practice (recommended tools)
```

A policy says *what and why*; standards say *what exactly*; procedures say *how*; guidelines *suggest*.

---

## 3. Types of Security Policies

Organizations maintain many policies. Common categories:

| Policy | Covers |
|--------|--------|
| **Acceptable Use Policy (AUP)** | How employees may use company systems |
| **Access Control Policy** | Who can access what, and how |
| **Password Policy** | Password and authentication requirements |
| **Data Classification Policy** | How data is labeled and protected by sensitivity |
| **Incident Response Policy** | How security incidents are handled |
| **Remote Work / BYOD Policy** | Rules for remote and personal devices |
| **Data Retention Policy** | How long data is kept and when deleted |
| **Encryption Policy** | When and how data must be encrypted |
| **Network Security Policy** | Firewall, segmentation, monitoring rules |
| **Backup & Recovery Policy** | Backup frequency and disaster recovery |

Some classify policies into three levels:

```
ORGANIZATIONAL (master)  → overall security program direction
ISSUE-SPECIFIC           → a particular topic (email, internet, BYOD)
SYSTEM-SPECIFIC          → a specific system or technology
```

---

## 4. Aligning Policies with Business Objectives

Security policies exist to **support the business**, not obstruct it. A policy that ignores how the business actually works gets bypassed or ignored.

### How alignment works

- Policies should **enable** business goals safely, not block them
- They must balance **security vs usability** — too strict and people work around them
- They protect what the **business values** (revenue, reputation, customer trust)
- They reflect the organization's **risk appetite**

```
Business goal:  "Let employees work remotely"
Bad policy:     "No remote access allowed"          → blocks the goal
Good policy:    "Remote access via VPN + MFA only"  → enables it safely
```

A well-aligned policy makes security a business enabler, gaining leadership support and user buy-in.

---

## 5. Essential Elements of a Security Policy

A complete policy document typically includes:

| Element | Purpose |
|---------|---------|
| **Purpose / Objective** | Why the policy exists |
| **Scope & Applicability** | Who and what it covers |
| **Policy Statements** | The actual rules |
| **Roles & Responsibilities** | Who does what |
| **Compliance & Enforcement** | Consequences of violations |
| **Exceptions** | How to request an exception |
| **Review cycle** | When it's reviewed/updated |
| **Definitions** | Key terms explained |
| **References** | Related policies, laws, standards |
| **Approval & version** | Who approved it, version history, dates |

A policy missing scope, enforcement, or a review cycle is incomplete and hard to apply.

---

## 6. Scope & Applicability

**Scope** defines exactly **who and what** a policy covers — drawing the boundaries so there's no ambiguity.

### What scope answers

```
WHO does it apply to?   → employees, contractors, third parties, all staff
WHAT does it cover?     → systems, data, devices, locations
WHERE does it apply?    → on-site, remote, specific departments
WHAT'S EXCLUDED?        → anything explicitly out of scope
```

Example scope statement:

> *"This policy applies to all employees, contractors, and third parties who access company systems, including all company-owned and personal devices used for work, whether on-site or remote."*

Clear scope prevents the "I didn't think it applied to me" problem and makes enforcement fair.

---

## 7. Policy Enforcement & Compliance

A policy nobody follows is useless. **Enforcement** ensures the rules are actually applied; **compliance** is the state of following them.

### How policies are enforced

| Method | Example |
|--------|---------|
| **Technical controls** | System forces 12-char passwords automatically |
| **Monitoring & auditing** | Logs reviewed for violations |
| **Consequences** | Disciplinary action for violations |
| **Training** | Staff taught the rules |
| **Acknowledgment** | Employees sign that they've read the policy |

### Compliance has two meanings here

```
Internal compliance  → following your OWN policies
External compliance  → meeting LAWS/STANDARDS (GDPR, HIPAA, PCI-DSS)
```

Enforcement should be **consistent and fair** — selective enforcement undermines the whole policy. Technical enforcement (where the system *prevents* violations) is the strongest because it doesn't rely on people remembering.

---

## 8. Policy Review & Updates

Policies aren't "write once." They must stay current as threats, technology, and regulations change.

### When to review

| Trigger | Review needed |
|---------|---------------|
| **Scheduled** | At least **annually** (common best practice) |
| **After an incident** | Learn and adjust |
| **Technology change** | New systems, cloud migration |
| **Regulatory change** | New laws (e.g., GDPR updates) |
| **Business change** | Mergers, new products, restructuring |
| **Audit findings** | Gaps identified |

```
Best practice: review every policy at least once a year,
plus whenever something significant changes.
```

Outdated policies are dangerous — they create a false sense of security and may conflict with current law or practice. Version control and review dates keep them honest.

---

## 9. Acceptable Use Policy (AUP)

An **AUP** defines how employees may (and may not) use company systems, networks, and devices.

### Typically covers

- Acceptable and prohibited uses of company systems
- Personal use limits
- Prohibited activities (illegal content, unauthorized software)
- Email and internet usage rules
- Consequences of misuse
- Privacy expectations (the company may monitor usage)

> Example rule: *"Company email may not be used to send confidential data to personal accounts."*

The AUP is often the **first policy** new employees sign — it sets baseline expectations for everyone.

---

## 10. Access Control Policy

An **Access Control Policy** defines **who can access what** resources and under what conditions. It's central to protecting confidentiality and integrity.

### Typically covers

- **Principle of least privilege** — users get only the access they need
- **Role-based access control (RBAC)** — access based on job role
- How access is **requested, approved, and revoked**
- Authentication requirements (MFA)
- Regular **access reviews** (recertification)
- Handling of privileged/admin accounts
- Offboarding (revoking access when people leave)

```
Core principle: least privilege — give the minimum access needed,
nothing more, and remove it when no longer needed.
```

---

## 11. Incident Response Policy

An **Incident Response Policy** defines how the organization detects, responds to, and recovers from security incidents. (Often aligned with **NIST SP 800-61**.)

### The incident response lifecycle

```
1. PREPARATION   → tools, team, plans ready in advance
2. DETECTION & ANALYSIS → identify and confirm the incident
3. CONTAINMENT   → stop it from spreading
4. ERADICATION   → remove the threat
5. RECOVERY      → restore normal operations
6. LESSONS LEARNED → review and improve
```

### Typically covers

- What counts as an incident + severity levels
- Roles and the response team (CSIRT)
- Reporting and escalation procedures
- Communication (internal + external, including breach notification)
- Required timelines (e.g., **GDPR Article 33**: report breaches within 72 hours)

A clear incident response policy means the organization reacts fast and consistently under pressure instead of improvising.

---

## 12. Data Classification Policy

A **Data Classification Policy** defines how data is labeled by sensitivity and how each level must be protected. You can't protect data appropriately if you don't know how sensitive it is.

### Typical classification levels

| Level | Meaning | Example | Protection |
|-------|---------|---------|------------|
| **Public** | No harm if disclosed | Marketing material | Minimal |
| **Internal** | For employees only | Internal memos | Basic access control |
| **Confidential** | Sensitive business data | Financials, contracts | Encryption + restricted access |
| **Restricted / Highly Confidential** | Severe harm if leaked | PII, health, card data | Strong encryption + strict controls |

### Why it matters

```
Classify data → apply protection proportional to sensitivity
→ don't waste resources over-protecting public data
→ don't under-protect critical data
```

Classification drives encryption, access control, retention, and handling rules.

---

## 13. Password Policy

A **Password Policy** defines authentication requirements. (Modern guidance follows **NIST SP 800-63B**.)

### Modern best practices (NIST 800-63B)

| Practice | Modern guidance |
|----------|-----------------|
| **Length** | Prioritize length (e.g., 12+ chars); longer beats complex |
| **Complexity** | Don't force arbitrary complexity rules |
| **Forced rotation** | Don't force periodic changes unless compromise suspected |
| **Breach checking** | Block passwords found in breach lists |
| **MFA** | Require multi-factor authentication |
| **No hints / security questions** | Avoid weak recovery methods |

```
Old thinking:  "P@ss1!" changed every 30 days  → users write it down
Modern:        long passphrase + MFA, only change if breached
```

> Length and MFA matter far more than forcing `!@#` symbols. Forced frequent changes actually *weaken* security (people pick predictable variations).

---

## 14. Policies & Regulatory Compliance

Many policies exist because **laws and standards require them**. Policies are how an organization demonstrates compliance.

| Regulation | Applies to | Key requirements |
|------------|-----------|------------------|
| **GDPR** | EU personal data | Consent, data protection, **72-hour breach notification** (Art. 33), data subject rights |
| **HIPAA** | US health data (PHI) | Security Rule: safeguards for health information |
| **PCI-DSS** | Payment card data | Protect cardholder data, network security, access control |
| **SOX** | Public company finances | Financial data integrity controls |

### How policies support compliance

```
Regulation requires X  →  policy mandates X  →  controls enforce X
→  audits verify X  →  organization stays compliant
```

For example, GDPR requires breach notification, so your **Incident Response Policy** includes a 72-hour notification procedure. PCI-DSS requires access control, so your **Access Control Policy** enforces it. Policies translate legal requirements into actionable internal rules.

---

## 15. Frameworks & Standards

Policies are usually built on established frameworks rather than from scratch:

| Framework | What it provides |
|-----------|------------------|
| **NIST Cybersecurity Framework 2.0** | Govern, Identify, Protect, Detect, Respond, Recover |
| **NIST SP 800-53** | Detailed catalog of security controls |
| **NIST SP 800-61** | Incident handling guidance |
| **NIST SP 800-63B** | Modern password/authentication guidelines |
| **CIS Controls v8** | Prioritized list of defensive actions |
| **ISO 27001** | International standard for information security management (ISMS) |
| **SANS Templates** | Free ready-made policy templates |
| **OWASP** | Web application security guidance & cheat sheets |
| **CISA** | US government cybersecurity resources (e.g., MFA guidance) |

### NIST CSF 2.0 — the six functions

```
GOVERN    → set strategy, roles, risk management (new in 2.0)
IDENTIFY  → know your assets and risks
PROTECT   → safeguards to limit impact
DETECT    → find incidents quickly
RESPOND   → take action on incidents
RECOVER   → restore after incidents
```

Using frameworks means you don't reinvent the wheel — and auditors recognize them.

---

## 16. Policy Exception Process

Sometimes a policy can't be followed in a specific case. An **exception process** provides a controlled way to handle this — instead of people silently ignoring the rule.

### How it works

```
1. REQUEST    → someone formally requests an exception, with justification
2. ASSESS     → security evaluates the risk of granting it
3. APPROVE/DENY → an authority decides (often risk-based)
4. DOCUMENT   → record the exception, its reason, and scope
5. TIME-LIMIT → exceptions expire and are re-reviewed (not permanent)
6. COMPENSATE → require compensating controls to reduce the added risk
```

### Why it matters

A formal exception process keeps security **realistic and accountable**. Without it, people work around policies in hidden, unmanaged ways. With it, every deviation is documented, risk-assessed, time-bound, and visible.

> Example: a legacy system can't support MFA → an exception is granted for 6 months with extra monitoring as a compensating control, while a fix is planned.

---

## 17. Measuring Policy Effectiveness

A policy is only useful if it actually works. Effectiveness is measured with **metrics** and reviews.

### Common metrics

| Metric | Tells you |
|--------|-----------|
| **Compliance rate** | % of staff/systems following the policy |
| **Number of violations** | How often it's broken |
| **Incident frequency** | Are incidents dropping? |
| **Training completion** | % of staff trained on the policy |
| **Audit findings** | Gaps found in reviews |
| **Time to remediate** | How fast violations are fixed |
| **Exception count** | Too many exceptions = policy may be unrealistic |

### How to measure

```
1. Define the policy's goal
2. Pick metrics that reflect that goal
3. Collect data (audits, logs, surveys)
4. Compare against targets
5. Adjust the policy if it's not working
```

> A high number of exceptions or violations often signals the policy is too strict or unrealistic — a sign to revise it, not just enforce harder.

Measurement closes the loop: write → enforce → measure → improve.

---

## 18. Quick Reference

### The hierarchy

```
POLICY     → what & why    (mandatory, high-level)
STANDARD   → what exactly   (mandatory, specific)
PROCEDURE  → how            (mandatory, step-by-step)
GUIDELINE  → suggestions    (optional, recommended)
```

### Key policies

```
AUP                  → how to use company systems
Access Control       → who can access what (least privilege)
Password             → authentication rules (length + MFA)
Data Classification  → label & protect by sensitivity
Incident Response    → how to handle incidents
```

### Essential policy elements

```
Purpose · Scope · Policy statements · Roles
Enforcement · Exceptions · Review cycle · Approval
```

### Compliance mapping

```
GDPR     → EU data, 72-hr breach notice
HIPAA    → US health data (PHI)
PCI-DSS  → payment card data
```

### Frameworks

```
NIST CSF 2.0 (Govern·Identify·Protect·Detect·Respond·Recover)
NIST 800-53 (controls) · 800-61 (incidents) · 800-63B (passwords)
CIS Controls v8 · ISO 27001 · SANS templates
```

### Three rules

1. **Policies enable the business safely** — align with goals, balance security and usability
2. **Write → enforce → review → measure** — policies are living documents, reviewed at least yearly
3. **Have an exception process** — controlled deviations beat silent workarounds
