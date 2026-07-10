# Threat Modeling Fundamentals

> Threat modeling is the structured process of **thinking like an attacker before they strike** — identifying what's valuable, how it could be attacked, how bad each attack would be, and what to fix first. You anticipate threats and design defenses *proactively*, before a breach happens.

---

## 1. What is Threat Modeling?

**Threat modeling** is a structured way to find and address security problems early — ideally during design, before code is even written. Instead of reacting to attacks, you map them out in advance.

It answers four core questions (the Shostack framework):

```
1. What are we building?       → understand the system
2. What can go wrong?          → identify threats
3. What are we going to do?    → decide on mitigations
4. Did we do a good job?       → validate and review
```

### Why it matters

- **Proactive, not reactive** — fix flaws before attackers find them
- **Cheaper** — fixing a design flaw early costs far less than after a breach
- **Prioritized** — focus limited resources on the biggest risks
- **Attacker mindset** — you learn to see your system the way an attacker does

> Example: analyzing a banking app's file-upload feature *before* launch reveals how an attacker might upload a web shell — so you add defenses first.

---

## 2. The CIA Triad

The **CIA Triad** is the foundation of all security goals. Every threat ultimately attacks one of these three.

| Goal | Meaning | Example attack against it |
|------|---------|---------------------------|
| **Confidentiality** | Only authorized people can read data | Data breach, eavesdropping |
| **Integrity** | Data isn't altered without authorization | Tampering, unauthorized changes |
| **Availability** | Systems/data are accessible when needed | DoS attack, ransomware |

### Why it matters

The CIA triad gives you a **checklist for what to protect**. When modeling threats, ask of each asset: *could an attacker break its confidentiality, its integrity, or its availability?* It frames the entire exercise.

```
Confidentiality  → keep secrets secret
Integrity        → keep data trustworthy
Availability     → keep services running
```

---

## 3. Assets, Threats, Vulnerabilities & Risks

These four terms are the vocabulary of threat modeling. Confusing them leads to muddled analysis.

| Term | Definition | Example |
|------|-----------|---------|
| **Asset** | Something valuable worth protecting | Customer database, user credentials |
| **Threat** | A potential event that could harm an asset | An attacker stealing the database |
| **Vulnerability** | A weakness that a threat could exploit | SQL injection in the login form |
| **Risk** | The likelihood × impact of a threat exploiting a vulnerability | High chance of DB theft via that SQLi = high risk |

### How they connect

```
A THREAT exploits a VULNERABILITY to harm an ASSET.
The RISK measures how likely and how damaging that is.
```

A useful sentence to lock it in:

> *"An **attacker** (threat) uses **SQL injection** (vulnerability) to steal the **customer database** (asset) — and because it's both likely and damaging, it's a high **risk**."*

You can only manage *risk* — you reduce it by removing vulnerabilities, protecting assets, or lowering impact.

---

## 4. Trust Boundaries

A **trust boundary** is any point where data or control passes between components with **different levels of trust**. These are the places where attacks usually happen, so finding them is central to threat modeling.

### Examples of trust boundaries

```
User's browser  ───┤  ←  boundary  →  Web server
   (untrusted)              (you control)

Web server  ───┤  →  Database
                       (different trust level)

Your app  ───┤  →  Third-party API
                    (external, less trusted)

Internet  ───┤  →  Internal network
                   (the classic firewall boundary)
```

### Why they matter

Data crossing a trust boundary should be **validated and authenticated** — you can't trust what comes from a less-trusted zone. In a data-flow diagram, you draw trust boundaries as lines; every place an arrow crosses one is a spot to scrutinize for threats.

> Most vulnerabilities live where untrusted input crosses into a trusted component — e.g., user input reaching a database query.

---

## 5. The Threat Modeling Process (Structured Steps)

A repeatable, structured workflow:

```
1. DEFINE SCOPE / IDENTIFY ASSETS
   → What system are we modeling? What's valuable?

2. CREATE AN ARCHITECTURE OVERVIEW
   → Draw the system: components, data flows, trust boundaries
   → A Data Flow Diagram (DFD) is the standard tool

3. IDENTIFY THREATS
   → For each component/data flow, ask "what can go wrong?"
   → Use a methodology like STRIDE

4. ASSESS & PRIORITIZE RISK
   → Score each threat (DREAD, CVSS, or likelihood × impact)
   → Build a prioritized threat list

5. DEFINE MITIGATIONS
   → Propose specific, actionable defenses for each threat

6. VALIDATE & REVIEW
   → Did we cover everything? Test the defenses. Repeat.
```

Threat modeling is **iterative** — you revisit it as the system changes.

---

## 6. Data Flow Diagrams (DFDs)

A **Data Flow Diagram** is the visual map of your system used in threat modeling. It shows how data moves and where trust boundaries are.

### Standard DFD elements

| Symbol | Element | Meaning |
|--------|---------|---------|
| Rectangle | **External entity** | Users, third parties (outside your control) |
| Circle | **Process** | Code that handles data (your app, a service) |
| Two lines | **Data store** | Where data rests (database, file) |
| Arrow | **Data flow** | Data moving between elements |
| Dashed line | **Trust boundary** | Where trust levels change |

```
[User] ──→ (Web App) ──→ [Database]
   │            │
   └─ trust ────┘  ← every boundary crossing = analyze for threats
      boundary
```

Drawing the DFD makes the attack surface visible — you literally see every point where an attacker could interact with the system.

---

## 7. STRIDE Methodology

**STRIDE** is Microsoft's threat-identification methodology. It's a checklist of **six threat categories** — for each component, you ask "is it vulnerable to each of these?" Each category maps to a CIA goal it violates.

| Letter | Threat | Violates | Example |
|--------|--------|----------|---------|
| **S** | **Spoofing** | Authentication | Pretending to be another user |
| **T** | **Tampering** | Integrity | Modifying data in transit or storage |
| **R** | **Repudiation** | Non-repudiation | Denying an action with no proof it happened |
| **I** | **Information Disclosure** | Confidentiality | Leaking sensitive data |
| **D** | **Denial of Service** | Availability | Crashing or overwhelming the system |
| **E** | **Elevation of Privilege** | Authorization | Gaining higher access than allowed |

### How to apply STRIDE

```
For each element in your DFD:
  → Could it be SPOOFED?
  → Could data be TAMPERED with?
  → Could actions be REPUDIATED?
  → Could information be DISCLOSED?
  → Could it be DENIED (DoS)?
  → Could privileges be ELEVATED?
```

STRIDE is systematic — going category by category over each component ensures you don't miss obvious threats.

### Mitigations map to STRIDE

| Threat | Typical defense |
|--------|-----------------|
| Spoofing | Strong authentication, MFA |
| Tampering | Integrity checks, hashing, signatures |
| Repudiation | Logging, audit trails |
| Information Disclosure | Encryption, access control |
| Denial of Service | Rate limiting, redundancy |
| Elevation of Privilege | Least privilege, authorization checks |

---

## 8. DREAD Scoring

**DREAD** is a methodology to **prioritize** threats by scoring five factors. Each factor is rated (commonly 1–10), then averaged or summed to rank threats.

| Letter | Factor | Question |
|--------|--------|----------|
| **D** | **Damage** | How bad if exploited? |
| **R** | **Reproducibility** | How easy to reproduce the attack? |
| **E** | **Exploitability** | How easy to launch the attack? |
| **A** | **Affected users** | How many users are impacted? |
| **D** | **Discoverability** | How easy to find the flaw? |

### How to calculate

```
DREAD score = (D + R + E + A + D) / 5      (each rated 1–10)

Example threat — SQL injection in login:
  Damage           = 9  (full DB access)
  Reproducibility  = 9  (works every time)
  Exploitability   = 8  (easy with sqlmap)
  Affected users   = 10 (all users)
  Discoverability  = 7
  → (9+9+8+10+7)/5 = 8.6  → HIGH priority
```

Higher score = higher priority. DREAD turns vague "this feels bad" judgments into comparable numbers so you know what to fix first.

> Note: DREAD's scoring can be subjective, so many teams use it as a rough guide alongside other methods like CVSS.

---

## 9. PASTA Methodology

**PASTA** = **Process for Attack Simulation and Threat Analysis**. It's a **risk-centric**, business-focused, 7-stage methodology. Where STRIDE focuses on technical threats, PASTA ties threats to **business impact**.

### The 7 stages

```
1. Define Objectives        → business goals + security requirements
2. Define Technical Scope   → map the architecture & dependencies
3. Application Decomposition → break down the app, data flows
4. Threat Analysis          → identify likely threats (threat intel)
5. Vulnerability Analysis   → find weaknesses that enable threats
6. Attack Modeling          → simulate attacks (attack trees)
7. Risk & Impact Analysis   → assess business risk, prioritize fixes
```

### When to use PASTA

- Larger, **risk-centric** assessments where business context matters
- When you need to connect technical threats to business consequences
- More thorough (and heavier) than STRIDE — better for mature programs

PASTA's strength is aligning security with **what the business actually cares about**, making it easier to justify mitigations to leadership.

---

## 10. Other Methodologies

| Methodology | Focus | Best for |
|-------------|-------|----------|
| **STRIDE** | Threat *types* per component | Technical, design-stage modeling |
| **DREAD** | *Scoring/prioritizing* threats | Ranking what to fix first |
| **PASTA** | *Risk-centric*, business-aligned | Mature, business-focused programs |
| **OCTAVE** | Organizational/operational risk | Enterprise risk management |
| **Attack Trees** | Mapping attack paths as a tree | Visualizing how a goal could be reached |
| **VAST** | Scalable, agile-friendly | Large orgs, automation |

You can combine them: e.g., use **STRIDE to find** threats, then **DREAD to prioritize** them.

---

## 11. Risk Scoring Methods

Beyond DREAD, common industry methods to quantify risk:

### Simple risk formula

```
RISK = LIKELIHOOD × IMPACT
```

| | Low impact | Medium impact | High impact |
|---|-----------|---------------|-------------|
| **High likelihood** | Medium | High | Critical |
| **Medium likelihood** | Low | Medium | High |
| **Low likelihood** | Low | Low | Medium |

This **risk matrix** quickly buckets threats into priority levels.

### CVSS

The **Common Vulnerability Scoring System** (0–10) — the industry standard for scoring specific vulnerabilities. Often used alongside threat modeling to rate identified weaknesses (see the CVE/CWE/NVD cheatsheet).

### NIST SP 800-30

A formal risk-assessment guide (likelihood × impact, with structured tables) widely used in government and enterprise.

The goal of any scoring method is the same: **turn subjective worry into comparable numbers** so you can prioritize objectively.

---

## 12. Creating a Prioritized Threat List

The output of threat modeling is a **ranked list of threats** with mitigations. A typical entry:

| Field | Example |
|-------|---------|
| **Threat** | SQL injection in login form |
| **Asset affected** | User credentials database |
| **STRIDE category** | Tampering / Information Disclosure |
| **Risk score** | DREAD 8.6 (High) |
| **Likelihood** | High |
| **Impact** | High (full DB access) |
| **Mitigation** | Parameterized queries + input validation + least privilege |
| **Status** | Open / In progress / Mitigated |

Sort by risk score so the team tackles the **highest-priority threats first**. This prioritized list is the actionable deliverable that drives remediation.

---

## 13. Proposing Mitigations

For each threat, propose **specific, actionable** defenses — not vague advice. There are four general ways to handle a risk:

| Strategy | Meaning | Example |
|----------|---------|---------|
| **Mitigate** | Reduce likelihood/impact | Add input validation |
| **Eliminate** | Remove the feature/risk entirely | Remove an unused upload form |
| **Transfer** | Shift the risk elsewhere | Use a third-party payment processor |
| **Accept** | Acknowledge & monitor (low risk) | Accept a minor, low-impact issue |

### Good vs vague mitigations

```
Vague:    "Make the login more secure"
Specific: "Use parameterized queries, enforce MFA, rate-limit
           login attempts to 5/min, and log failed attempts"
```

Tie each mitigation back to the threat it addresses and, where possible, to a STRIDE category and CWE.

---

## 14. Frameworks & Reference Standards

Threat modeling connects to broader security frameworks:

| Framework | What it provides |
|-----------|------------------|
| **OWASP Threat Modeling** | Practical web-app threat modeling guidance |
| **Microsoft SDL** | Secure Development Lifecycle (origin of STRIDE) |
| **MITRE ATT&CK** | Real attacker tactics & techniques (TTPs) — informs "what can go wrong" |
| **NIST CSF / 800-30** | Cybersecurity & risk-management standards |
| **CWE** | Catalog of weakness *types* threats exploit |
| **CVE** | Specific known vulnerabilities |

**MITRE ATT&CK** is especially useful — it's a knowledge base of how real attackers operate, so you can model realistic threats instead of guessing.

---

## 15. Tools

### Diagramming & modeling

| Tool | Type | Use |
|------|------|-----|
| **Draw.io** | Free | General diagramming (DFDs) |
| **Mermaid** | Free | Diagrams as code |
| **OWASP Threat Dragon** | Free, open-source | Dedicated threat-modeling tool |
| **Microsoft Threat Modeling Tool** | Free | STRIDE-based, integrates with SDL |

### Programmatic / DevSecOps

| Tool | Type | Use |
|------|------|-----|
| **PyTM** | Open-source (Python) | Threat models as code |
| **Threagile** | Open-source (CLI) | Code-based models for DevSecOps |
| **IriusRisk** | Commercial | Enterprise, automated modeling |
| **ThreatModeler** | Commercial | Large orgs, compliance |

### Validation / testing (confirm the threats are real)

```
OWASP ZAP    → web app scanning
Burp Suite   → web security testing
Nessus       → vulnerability scanning
Metasploit   → penetration testing
Wireshark    → network analysis
SQLMap       → SQL injection testing
```

After modeling threats, use these to **validate** that the vulnerabilities exist and the mitigations work.

---

## 16. A Worked Example — Banking File Upload

Putting it all together on a banking app's file-upload feature:

```
1. ASSET:           uploaded documents + the server itself
2. DFD:             [User] →| (Upload handler) → [File storage]
                            trust boundary
3. STRIDE threats:
     Tampering           → upload a malicious file
     Elevation of Priv.  → upload a web shell → run commands
     Info Disclosure     → access other users' files
     DoS                 → upload huge files
4. DREAD score (web shell):
     D9 R9 E8 A10 D7  → 8.6  HIGH
5. MITIGATIONS:
     - allow-list extensions, verify content (magic bytes)
     - non-executable upload directory
     - store off the main domain
     - size limits, rename files, access controls
6. VALIDATE:
     - test with Burp Suite: try bypasses, confirm shell can't run
```

This is exactly how threat modeling turns "we have an upload feature" into a prioritized, defended design. (See the Upload Vulnerabilities cheatsheet for the deep dive.)

---

## 17. Quick Reference

### The 4 questions

```
1. What are we building?     2. What can go wrong?
3. What will we do about it? 4. Did we do a good job?
```

### Core vocabulary

```
Asset          → what's valuable
Threat         → what could harm it
Vulnerability  → the weakness exploited
Risk           → likelihood × impact
Trust boundary → where trust levels change (attack hotspots)
```

### CIA triad

```
Confidentiality · Integrity · Availability
```

### STRIDE

```
Spoofing · Tampering · Repudiation
Information disclosure · Denial of service · Elevation of privilege
```

### DREAD

```
Damage · Reproducibility · Exploitability · Affected users · Discoverability
score = sum / 5   (higher = fix first)
```

### PASTA (7 stages)

```
Objectives → Technical scope → Decomposition → Threat analysis
→ Vulnerability analysis → Attack modeling → Risk & impact
```

### Process

```
Scope/assets → diagram (DFD) → identify threats (STRIDE)
→ score & prioritize (DREAD/CVSS) → mitigate → validate
```

### Three rules

1. **Model early** — threats found at design time are cheapest to fix
2. **Be systematic** — use STRIDE per component so nothing slips through
3. **Prioritize by risk** — score threats, fix the highest first, validate the fixes
