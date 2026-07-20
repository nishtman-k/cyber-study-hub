# CVE, CWE & NVD

> CVE, CWE, and the NVD form the backbone of the global vulnerability management ecosystem — a standardized way to identify, classify, and score the vulnerabilities discovered every day.

> "You cannot patch what you cannot name."

---

## 1. The Big Picture — How They Fit Together

Three separate-but-connected systems work as a pipeline:

```
CWE   →  defines the TYPE of weakness   (the root cause / category)
CVE   →  names a SPECIFIC vulnerability  (one instance in real software)
NVD   →  enriches CVEs with scores & data (severity, impact, configs)
```

A quick way to remember the difference:

| System | Answers | Example |
|--------|---------|---------|
| **CWE** | "What *kind* of weakness is this?" | CWE-89: SQL Injection (the category) |
| **CVE** | "*Which* product is vulnerable?" | CVE-2024-1234 (SQLi in a specific app) |
| **NVD** | "*How bad* is it?" | CVSS 9.8 Critical + affected versions |

So a single CVE (a real vulnerability) is **caused by** a CWE (a weakness type) and is **scored/enriched by** the NVD.

---

## 2. What is a CVE?

**CVE** = **Common Vulnerabilities and Exposures**. It's a public dictionary of *specific, known* cybersecurity vulnerabilities, each given a unique identifier. Run by **MITRE**, sponsored by the US government (CISA).

### How CVEs help

- **Common reference** — everyone in the world refers to the same flaw by the same ID
- **Information sharing** — vendors, researchers, and defenders coordinate using the ID
- **Tooling** — scanners, advisories, and databases all map to CVE IDs
- **Tracking** — you can follow a vulnerability from discovery to patch

Before CVE (created in 1999), every vendor and tool named vulnerabilities differently, making it almost impossible to tell if two reports described the same flaw.

---

## 3. Structure of a CVE Identifier

```
CVE - 2024 - 1234
 │     │      │
 │     │      └── Sequence number (unique that year; 4+ digits, can be longer)
 │     └───────── Year the CVE was assigned/reserved
 └─────────────── Fixed "CVE" prefix
```

| Part | Meaning |
|------|---------|
| **CVE** | The prefix — identifies it as a CVE record |
| **Year** | The year it was reserved (not always the year discovered/published) |
| **Number** | An arbitrary sequence number, unique within that year |

The sequence number has **no built-in meaning** (it's not severity or order) — it's just a unique counter. It can be 4 digits or more (e.g., `CVE-2024-123456`) since the format expanded to allow more than 9,999 per year.

---

## 4. CVE Numbering Authorities (CNAs)

A **CNA** is an organization authorized to assign CVE IDs within its scope, without going through MITRE for every single one. This distributes the workload globally.

### What CNAs do

- Reserve and assign CVE IDs for vulnerabilities in their products/scope
- Write the initial CVE record (description, affected versions)
- Coordinate with researchers reporting flaws

### Examples of CNAs

Major vendors (Microsoft, Google, Apple, Red Hat, Oracle), open-source projects, bug bounty platforms, and CERTs are CNAs. MITRE is the **root** CNA, and there are hundreds worldwide organized in a hierarchy.

### Becoming a CNA (general criteria)

- Have a defined **scope** (e.g., your own products)
- Follow the **CVE Program rules** and processes
- Demonstrate ability to write proper CVE records and disclose responsibly
- Be sponsored/approved by a higher-level CNA or the Program

The idea: organizations closest to the affected software assign the IDs, which is faster and more accurate than centralizing everything at MITRE.

---

## 5. The CVE Entry Process

How a vulnerability becomes a CVE, step by step:

```
1. DISCOVERY   → a researcher/vendor finds a vulnerability
2. REPORT      → it's reported to a relevant CNA (or MITRE)
3. RESERVE     → a CVE ID is reserved (status: RESERVED)
4. REVIEW      → the CNA validates it's a real, in-scope, distinct vuln
5. DOCUMENT    → description, affected products/versions, references written
6. PUBLISH     → the CVE record goes public (status: PUBLISHED)
7. ENRICH      → NVD adds CVSS scores, CWE mapping, config data
```

A CVE can sit in **RESERVED** state (ID assigned but details withheld) during responsible disclosure, then move to **PUBLISHED** once the fix is available. Records can also be **REJECTED** or **DISPUTED**.

---

## 6. Searching the CVE Database

```
Official CVE site:   https://www.cve.org
NVD (enriched):      https://nvd.nist.gov
```

### Ways to look up a CVE

- **By ID** — search `CVE-2024-1234` directly
- **By keyword** — product name, vendor, or vulnerability type
- **By vendor/product** — find all CVEs affecting a specific software
- **Via the NVD** — richer view with severity scores and affected configs

### What a CVE record tells you

- Description of the vulnerability
- Affected products and versions
- References (advisories, patches, exploit info)
- (Via NVD) CVSS score, CWE type, and remediation links

For automation, both CVE.org and the NVD offer **APIs and data feeds** so tools can pull records programmatically.

---

## 7. What is a CWE?

**CWE** = **Common Weakness Enumeration**. It's a community-developed catalog of *types* of software and hardware weaknesses — the underlying flaws that *lead to* vulnerabilities. Also maintained by MITRE.

### CWE vs CVE — the key distinction

```
CWE = the WEAKNESS TYPE (a category/pattern that can appear anywhere)
CVE = a SPECIFIC INSTANCE of that weakness in real software
```

| | **CWE** | **CVE** |
|---|---------|---------|
| **Describes** | A *class* of weakness | A *specific* vulnerability |
| **Example** | CWE-79: Cross-Site Scripting | CVE-2024-xxxx: XSS in App Y v2.1 |
| **Reusable?** | Yes — applies to many products | No — tied to one product/version |
| **Purpose** | Understand & prevent root causes | Track & patch a real flaw |

### How CWEs help

- Identify the **root cause** behind vulnerabilities
- Help developers **avoid** introducing the same flaws
- Provide a shared language for weakness *types*
- Guide secure coding, training, and testing

---

## 8. CWE Categories, Types & Hierarchy

CWE is organized as a **hierarchy** (tree), from broad to specific.

### Levels of abstraction

```
PILLAR        broadest    (e.g., "Improper Neutralization")
  └─ CLASS    general     (e.g., "Injection")
      └─ BASE specific    (e.g., CWE-89: SQL Injection)
          └─ VARIANT  most specific (a particular form)
```

### Common CWE examples

| CWE ID | Weakness |
|--------|----------|
| **CWE-79** | Cross-Site Scripting (XSS) |
| **CWE-89** | SQL Injection |
| **CWE-20** | Improper Input Validation |
| **CWE-22** | Path Traversal |
| **CWE-78** | OS Command Injection |
| **CWE-287** | Improper Authentication |
| **CWE-352** | Cross-Site Request Forgery (CSRF) |
| **CWE-434** | Unrestricted File Upload |
| **CWE-502** | Deserialization of Untrusted Data |
| **CWE-798** | Hardcoded Credentials |

### The CWE Top 25

MITRE publishes a **"Top 25 Most Dangerous Software Weaknesses"** list each year — the most common and impactful CWEs based on real-world CVE data. It's a great priority list for developers and security teams.

---

## 9. How CWE and CVE Relate

When a CVE is published and enriched, it's usually **mapped to one or more CWEs** that describe the underlying weakness.

```
CVE-2024-1234  (a specific SQL injection in App Y)
       │  is an instance of
       ▼
CWE-89  (SQL Injection — the weakness type)
```

This mapping is powerful because it lets you:
- See **what kind** of flaw a CVE is, not just that it exists
- Spot **patterns** — "we keep getting CWE-79, we have a systemic XSS problem"
- Connect a specific patch to a **root cause** you can train against

So CWE explains *why* the vulnerability (CVE) exists.

---

## 10. Mitigating CWE Weaknesses

Each CWE entry includes **mitigation guidance**. General best practices by weakness family:

| Weakness type | Mitigation |
|---------------|------------|
| Injection (CWE-89, 78) | Parameterized queries, input validation, least privilege |
| XSS (CWE-79) | Output encoding, Content Security Policy |
| CSRF (CWE-352) | Anti-CSRF tokens, SameSite cookies |
| Input validation (CWE-20) | Allow-lists, strict type/format checks |
| Authentication (CWE-287) | MFA, strong session management |
| Hardcoded creds (CWE-798) | Secrets managers, environment variables |
| Deserialization (CWE-502) | Avoid untrusted deserialization, use safe formats |

The advantage of thinking in CWEs: fixing the *weakness type* prevents **all future CVEs** of that kind, not just the one you're patching now.

---

## 11. Prioritizing Weaknesses

Not every weakness deserves equal attention. Prioritize based on:

| Factor | Question |
|--------|----------|
| **Severity** | How much damage if exploited? |
| **Exploitability** | How easy is it to exploit? |
| **Impact** | What's exposed (data, systems, scope)? |
| **Exposure** | Is it reachable by attackers (internet-facing)? |
| **Prevalence** | How common is this weakness in your code? |

### CWSS — Common Weakness Scoring System

CWE has its own scoring framework, **CWSS**, for rating weaknesses (similar idea to CVSS but for weakness *types* rather than specific vulnerabilities). Combined with the **CWE Top 25** (ranked by real-world frequency and impact), it helps teams focus on what matters most.

---

## 12. What is the NVD?

**NVD** = **National Vulnerability Database**, run by **NIST** (US government). It's the US government's repository of vulnerability data, built **on top of** the CVE list.

### Its role in the ecosystem

The NVD **doesn't assign CVE IDs** — it *enriches* them. When a CVE is published, the NVD adds:

- **CVSS scores** (severity ratings)
- **CWE mapping** (the weakness type)
- **Affected configurations** (CPE — which products/versions)
- **References** and impact analysis

```
MITRE/CNAs publish CVE  →  NVD enriches it  →  tools & teams consume it
```

So the CVE list is the "what," and the NVD is the "how bad, what type, and what's affected."

---

## 13. NVD Data Feeds

The NVD provides machine-readable data so tools can automate vulnerability management:

| Feed / data | Contains |
|-------------|----------|
| **Vulnerability feeds (JSON)** | Full CVE records with enrichment |
| **CVSS metrics** | Base, temporal, environmental scores |
| **CPE dictionary** | Standardized product/version identifiers (configurations) |
| **CWE mapping** | Weakness type for each CVE |
| **NVD API** | Query vulnerabilities programmatically |

These feeds power vulnerability scanners, SIEMs, and patch-management platforms — they pull NVD data to know what's vulnerable and how severe it is.

---

## 14. CVSS — Scoring Severity

**CVSS** = **Common Vulnerability Scoring System**. A standardized 0–10 score for how severe a vulnerability is. The NVD attaches a CVSS score to (most) CVEs.

### Severity ratings

| CVSS Score | Severity |
|------------|----------|
| **0.0** | None |
| **0.1 – 3.9** | Low |
| **4.0 – 6.9** | Medium |
| **7.0 – 8.9** | High |
| **9.0 – 10.0** | Critical |

### The three metric groups

| Group | What it measures |
|-------|------------------|
| **Base** | Intrinsic severity (constant — exploitability + impact) |
| **Temporal** | Changes over time (exploit availability, patches) |
| **Environmental** | Severity *in your specific environment* |

The **Base score** is what you usually see (e.g., "CVSS 9.8 Critical"). It's built from factors like attack vector (network vs local), attack complexity, privileges required, user interaction, and the impact on confidentiality/integrity/availability (CIA).

> CVSS tells you *how severe*, but always combine it with **context** — a Critical CVE on an internal test box may matter less than a Medium one on your public login page.

---

## 15. Searching & Filtering the NVD

```
https://nvd.nist.gov
```

### Ways to search

- **By CVE ID** — direct lookup
- **By keyword** — product, vendor, vulnerability type
- **By CVSS score range** — e.g., only Critical (9.0+)
- **By date** — recently published/modified
- **By CWE** — all CVEs of a given weakness type
- **By CPE** — all CVEs affecting a specific product/version

### Example workflow

```
1. Search your product (e.g., "Apache 2.4.49")
2. Filter by CVSS ≥ 7.0 (High + Critical)
3. Filter by recently published
4. Review each CVE's description, CWE, and patch references
5. Prioritize and patch
```

---

## 16. Integrating NVD with Security Tools

NVD data is designed for **automation**. Tools pull it to power vulnerability management:

| Tool type | How it uses NVD |
|-----------|-----------------|
| **Vulnerability scanners** (Nessus, OpenVAS, Qualys) | Match found software against NVD CVEs |
| **SCA tools** (OWASP Dependency-Check, Snyk) | Check dependencies against known CVEs |
| **SIEM / SOC platforms** | Correlate alerts with vulnerability data |
| **Patch management** | Prioritize patches by CVSS severity |
| **CI/CD pipelines** | Fail builds with Critical CVEs |

### Typical automated flow

```
1. Tool inventories your software/dependencies
2. Queries the NVD API/feed for matching CVEs
3. Pulls CVSS scores + CWE types
4. Prioritizes by severity
5. Alerts / creates tickets / blocks deployment
```

This is how organizations manage thousands of vulnerabilities at scale — automation backed by NVD data.

---

## 17. Putting It All Together

A real vulnerability management flow using all three:

```
1. A researcher finds a flaw in App Y
2. A CNA assigns it CVE-2024-1234 (CVE)
3. The record is published with description + affected versions
4. NVD enriches it: maps it to CWE-89 (SQL Injection),
   assigns CVSS 9.8 (Critical), lists affected CPEs
5. Your scanner pulls NVD data, sees you run App Y
6. It flags CVE-2024-1234 as Critical
7. You prioritize and patch it fast
8. CWE-89 tells your devs the root cause → train to prevent more SQLi
```

That's the ecosystem: **CWE** (type) + **CVE** (instance) + **NVD/CVSS** (severity & data) = effective, prioritized vulnerability management.

---

## 18. Quick Reference

### The three systems

```
CWE  → weakness TYPE       (CWE-89 = SQL Injection)     — MITRE
CVE  → specific VULN       (CVE-2024-1234)              — MITRE/CNAs
NVD  → enrichment + scores (CVSS, CWE map, configs)     — NIST
```

### CVE ID structure

```
CVE - YYYY - NNNN
prefix  year  sequence (unique that year, no meaning)
```

### CVSS severity bands

```
0.0       None
0.1–3.9   Low
4.0–6.9   Medium
7.0–8.9   High
9.0–10.0  Critical
```

### Where to look

```
CVE records:  https://www.cve.org
Enriched:     https://nvd.nist.gov
CWE list:     https://cwe.mitre.org   (+ CWE Top 25)
```

### Key relationships

```
CWE explains WHY a CVE exists (root cause)
CVE names a specific vulnerability
NVD scores it (CVSS) and maps it to a CWE
CNAs assign the CVE IDs
```

### Three things to remember

1. **CWE = type, CVE = instance, NVD = severity & data** — different jobs, one ecosystem
2. **CVSS gives severity, but context decides priority** — where the flaw lives matters
3. **Fixing the CWE prevents future CVEs** — patch the instance, fix the weakness type
