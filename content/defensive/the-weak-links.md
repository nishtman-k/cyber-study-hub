# The Weak Links

> **Scope:** Transforming a vulnerability scan into threat-informed intelligence — determining which findings matter, which are noise, which are exploitable, and what should be fixed first.

---

## Table of Contents
- [Core Vocabulary](#core-vocabulary)
- [The Vulnerability Ecosystem](#the-vulnerability-ecosystem)
- [CVE Fundamentals](#cve-fundamentals)
- [NVD Research Workflow](#nvd-research-workflow)
- [CVSS v3.1 Explained](#cvss-v31-explained)
- [CVE vs CWE](#cve-vs-cwe)
- [Exploit Research](#exploit-research)
- [CISA KEV](#cisa-known-exploited-vulnerabilities-kev)
- [Vulnerability Taxonomy](#vulnerability-taxonomy-sec-23)
- [Misconfigurations & EOL Systems](#misconfigurations-end-of-life-systems)
- [Vulnerability Management Lifecycle](#vulnerability-management-lifecycle)
- [Triage & Prioritization](#triage-prioritization)
- [False Positives](#false-positives)
- [Response Strategies](#response-strategies)
- [Lynis](#lynis-security-auditing)
- [Reporting](#writing-the-vulnerability-assessment-summary)
- [Framework Map](#framework-quick-map)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Vocabulary

| Term | Meaning |
|------|---------|
| Vulnerability | Weakness that could be exploited |
| Exposure | Condition increasing likelihood of compromise |
| Exploit | Method used to abuse a weakness |
| CVE | Standard identifier for a disclosed vulnerability |
| CVSS | Severity scoring framework |
| CWE | Weakness category |
| KEV | Known Exploited Vulnerability |
| Risk | Likelihood × Impact |
| False Positive | Scanner finding that is not actually vulnerable |
| Compensating Control | Alternative risk reduction when patching is impossible |

**Formula:**

Vulnerability + Asset + Threat Actor + Impact = Risk

## 2. The Vulnerability Ecosystem

### Key Components

| Component | Purpose |
|-----------|---------|
| CVE | Unique vulnerability identifier |
| NVD | Vulnerability enrichment database |
| CVSS | Severity measurement |
| CWE | Weakness classification |
| Exploit-DB | Public exploit references |
| searchsploit | Local Exploit-DB search tool |
| KEV | Active exploitation tracking |

### Workflow

Discovery → CVE Assignment → NVD Analysis → CVSS Scoring → Exploit Research → Prioritization → Remediation

## 3. CVE Fundamentals

### Structure

```text
CVE-2025-12345
│    │
│    └── Unique identifier
└──── Year assigned
```

### Lifecycle

| State | Meaning |
|---------|----------|
| Reserved | Identifier assigned but details unpublished |
| Published | Publicly disclosed |
| Modified | Updated after publication |
| Rejected | Assigned by mistake |

### Example Questions

- What product is affected?
- What versions are vulnerable?
- What is the attack vector?
- Is a patch available?
- Is exploitation documented?

## 4. NVD Research Workflow

For every important finding:

1. Locate the CVE.
2. Read description.
3. Review affected versions.
4. Review CVSS vector.
5. Review references.
6. Check CWE mapping.
7. Check exploit availability.
8. Check KEV status.
9. Compare against MedDefense assets.

### NVD Entry Components

- Description
- CVSS metrics
- References
- CWE association
- Vendor advisories
- CPE affected products

## 5. CVSS v3.1 Explained

### Base Metrics

| Metric | Meaning |
|----------|---------|
| AV | Attack Vector |
| AC | Attack Complexity |
| PR | Privileges Required |
| UI | User Interaction |
| S | Scope |
| C | Confidentiality |
| I | Integrity |
| A | Availability |

### Attack Vector

| Value | Description |
|---------|------------|
| Network | Remote exploitation |
| Adjacent | Same network segment |
| Local | Local access required |
| Physical | Physical presence required |

### Severity Scale

| Score | Rating |
|---------|--------|
| 0.0 | None |
| 0.1–3.9 | Low |
| 4.0–6.9 | Medium |
| 7.0–8.9 | High |
| 9.0–10.0 | Critical |

### Most Important Lesson

**CVSS measures severity, not business risk.**

## 6. CVE vs CWE

| CVE | CWE |
|------|------|
| Specific vulnerability | Weakness category |
| Instance | Root cause type |
| Thousands | Hundreds |

Example:

```text
CVE-2024-XXXX
       ↓
CWE-89
SQL Injection
```

Common CWEs:

- CWE-79 Cross-Site Scripting
- CWE-89 SQL Injection
- CWE-287 Improper Authentication
- CWE-22 Path Traversal
- CWE-798 Hardcoded Credentials

## 7. Exploit Research

### Exploit-DB

Used to determine:

- Public exploit existence
- Weaponization maturity
- Exploitation complexity

### searchsploit

```bash
searchsploit apache 2.4
searchsploit CVE-2024-12345
```

Useful flags:

```bash
searchsploit -m <id>
searchsploit -x <id>
```

### Questions

- Is exploit code public?
- Is exploitation reliable?
- Is authentication required?
- Is remote code execution possible?

## 8. CISA Known Exploited Vulnerabilities (KEV)

KEV contains vulnerabilities confirmed to be exploited in the wild and should be treated as a major prioritization signal. 

### Prioritization Order

1. KEV-listed vulnerabilities
2. Public exploit available
3. Internet-exposed assets
4. Critical business systems
5. Remaining findings

### Practical Rule

A CVSS 7.5 vulnerability in KEV may be more urgent than a CVSS 9.8 vulnerability nobody is exploiting. KEV exists specifically to support prioritization based on real-world exploitation activity. 

## 9. Vulnerability Taxonomy (Sec+ 2.3)

### Application

- Buffer overflow
- Injection flaws
- Authentication issues

### Operating System

- Kernel vulnerabilities
- Privilege escalation

### Web-Based

- XSS
- SQLi
- CSRF

### Hardware / Firmware

- BIOS flaws
- Device firmware weaknesses

### End-of-Life

- Unsupported operating systems
- Unsupported appliances

### Virtualization

- VM escape
- Hypervisor weaknesses

### Cloud

- Misconfigured storage
- IAM weaknesses

### Supply Chain

- Third-party compromise
- Malicious updates

### Cryptographic

- Weak protocols
- Deprecated ciphers

### Misconfiguration

- Default credentials
- Excessive permissions
- Open storage buckets

### Mobile

- Unmanaged devices
- Insecure applications

### Zero-Day

- Publicly unknown prior to exploitation

## 10. Misconfigurations & End-of-Life Systems

### Misconfigurations Matter

They often:

- Have no CVE
- Are missed by patch programs
- Cause major breaches

Examples:

| Misconfiguration | Risk |
|------------------|------|
| No MFA | Credential compromise |
| Open SMB | Lateral movement |
| Shared admin accounts | Accountability loss |
| Default credentials | Initial access |

### End-of-Life Systems

Permanent problem:

- No security updates
- New vulnerabilities continue to appear
- Unsupported by vendor

EOL = growing risk over time.

## 11. Vulnerability Management Lifecycle

```text
Identify
   ↓
Analyze
   ↓
Prioritize
   ↓
Remediate
   ↓
Validate
   ↓
Report
   ↓
Repeat
```

### Continuous Process

Vulnerability management is a program, not a project.

New disclosures appear constantly.

## 12. Triage & Prioritization

### What Actually Matters?

Evaluate:

| Factor | Question |
|----------|-----------|
| CVSS | How severe? |
| KEV | Actively exploited? |
| Exploit | Public exploit available? |
| Exposure | Internet facing? |
| Asset | Critical system? |
| Threats | Relevant actor? |
| Controls | Existing protections? |

### MedDefense Example

| Finding | CVSS | Priority |
|----------|-------|-----------|
| Critical CVE on isolated test server | 9.8 | Medium |
| VPN flaw exploited by ransomware groups | 8.2 | Critical |

Why?

Context beats score.

## 13. False Positives

### Common Causes

- Banner grabbing errors
- Fingerprinting mistakes
- Patched backported software
- Incomplete scanning permissions

### Validation Process

1. Reproduce finding.
2. Verify version.
3. Review vendor advisory.
4. Review configuration.
5. Test safely.
6. Document conclusion.

### Rule

Never assume scanner output is correct.

## 14. Response Strategies

### 1. Patch

Preferred solution.

### 2. Compensating Controls

Examples:

- Network segmentation
- Application allowlisting
- Enhanced monitoring

### 3. Configuration Change

Examples:

- Disable vulnerable protocols
- Remove default accounts
- Enforce MFA

### 4. Exception / Risk Acceptance

Requirements:

- Business justification
- Risk owner
- Approval
- Review date

## 15. Lynis Security Auditing

### Purpose

Lynis identifies:

- Hardening weaknesses
- Missing controls
- Misconfigurations
- Compliance gaps

### Common Commands

```bash
lynis audit system
```

```bash
lynis show details
```

```bash
lynis --help
```

### Output Sections

- Warnings
- Suggestions
- Hardening Index
- Plugin Results

### Interpretation Rule

Warnings require investigation.

Suggestions improve security posture.

## 16. Writing the Vulnerability Assessment Summary

Every finding should answer:

### What?

What vulnerability exists?

### Where?

Which asset is affected?

### Who?

Which threat actor would use it?

### How?

What attack path exists?

### So What?

Business impact.

### Now What?

Remediation recommendation.

### Finding Template

```text
Finding ID:
Affected Asset:
CVE/CWE:
CVSS:
Exploit Availability:
KEV Status:
Threat Actor:
Business Impact:
Priority:
Recommendation:
Owner:
Target Date:
```

## 17. Framework Quick Map

| Framework | Purpose |
|------------|---------|
| CVE | Vulnerability ID |
| NVD | Analysis and enrichment |
| CVSS | Severity scoring |
| CWE | Weakness classification |
| ATT&CK | Adversary behavior |
| CISA KEV | Exploitation evidence |
| Lynis | Security auditing |

## 18. Fast Recall

- CVE = vulnerability identifier.
- CWE = weakness category.
- CVSS = severity, not risk.
- KEV = actively exploited vulnerabilities. 
- Public exploit availability increases priority.
- Misconfigurations are vulnerabilities even without CVEs.
- End-of-life systems become riskier every year.
- Scanner findings require validation.
- Vulnerability management is continuous.
- Context beats CVSS.
- Prioritize assets, threats, exploitability and business impact together.
- The best remediation is the one that breaks the attacker path.

## 19. Resources

**CVE & NVD**
- MITRE CVE Program
- National Vulnerability Database (NVD)

**CVSS**
- FIRST CVSS v3.1 Specification
- NIST CVSS Calculator

**CWE**
- CWE Official Site
- CWE Top 25

**Exploit Research**
- Exploit-DB
- searchsploit Manual

**Prioritization**
- CISA Known Exploited Vulnerabilities Catalog 

**Auditing**
- Lynis Documentation
- man searchsploit
- lynis --help
