# First Watch — Cheatsheet

> **Project:** First Watch — Security Posture Assessment
> **Tab:** Defence (first module)
> **Scenario:** MedDefense Health Systems — Junior Security Analyst, Day 1. 3 sites, ~2,000 staff, 12 IT staff, no prior security function. Deliverable: a board-ready posture assessment.
> **Why it matters:** Every security role starts here. SOC triage, IR prioritisation, pentest impact ratings and GRC audits all depend on knowing what you have, how critical it is, and what protects it. No scanning, no exploitation — this is the *Identify* function.

---

## Table of Contents

1. [Core Vocabulary](#1-core-vocabulary)
2. [The CIA Triad](#2-the-cia-triad)
3. [Security Controls — Two Dimensions](#3-security-controls--two-dimensions)
4. [Asset Inventory & Criticality](#4-asset-inventory--criticality)
5. [Data Classification & Data States](#5-data-classification--data-states)
6. [Gap Analysis](#6-gap-analysis)
7. [Risk Treatment](#7-risk-treatment)
8. [Prioritisation](#8-prioritisation)
9. [Threat Intelligence Validation](#9-threat-intelligence-validation)
10. [Writing for the Board](#10-writing-for-the-board)
11. [Framework Quick Map](#11-framework-quick-map)
12. [Fast Recall](#12-fast-recall)
13. [Resources](#13-resources)

---

## 1. Core Vocabulary

| Term | Definition | MedDefense example |
|---|---|---|
| **Asset** | Anything of value: system, data, person, facility, process | `billing-srv-01`, EHR database, badge system |
| **Threat** | A potential cause of an unwanted incident | Ransomware crew, insider, flood, power loss |
| **Threat actor** | The entity behind a threat | Ransomware affiliate, disgruntled staff, nation-state |
| **Vulnerability** | A weakness that can be exploited | Unpatched OS, shared admin password, propped-open door |
| **Exploit** | The method/code that abuses a vulnerability | Public PoC, tailgating |
| **Likelihood** | Probability the threat exploits the vulnerability | High (healthcare is heavily targeted) |
| **Impact** | Consequence if it happens | Surgeries cancelled, PHI leaked, €X fine |
| **Risk** | `Likelihood × Impact` — what actually matters | "Ransomware encrypts EHR → 350-bed hospital on paper charts" |
| **Inherent risk** | Risk before controls | — |
| **Residual risk** | Risk remaining after controls | — |
| **Risk appetite** | How much risk leadership accepts | Board decision, not yours |

### Decomposing an observation

Never report "the door was propped open." Break every observation into components:

```
Observation : Server room door held open with a wooden wedge
Asset       : Server room → EHR server, backup NAS, core switch  [CRITICAL]
Vulnerability: Physical access control defeated / no enforcement
Threat      : Unauthorised entry — theft, tampering, USB implant, insider
Impact      : C (data theft) + I (config tampering) + A (device shutdown)
Existing ctrl: Badge reader (bypassed), no camera, no door-ajar alarm
Risk        : HIGH — Critical asset, control non-functional, no detection
```

**Risk statement template:**
> If **[threat actor]** exploits **[vulnerability]** on **[asset]**, then **[technical outcome]**, resulting in **[business consequence]**.

---

## 2. The CIA Triad

| Pillar | Question | Broken by | Protected by |
|---|---|---|---|
| **Confidentiality** | Who can see it? | Disclosure, leak, theft | Encryption, access control, MFA, DLP |
| **Integrity** | Can I trust it's unaltered? | Alteration, corruption | Hashing, signatures, change control, WORM |
| **Availability** | Can I reach it when needed? | Denial, destruction, outage | Backups, HA, redundancy, DR, capacity |

**DAD triad** = the attacker's mirror: **D**isclosure, **A**lteration, **D**estruction/Denial.
**Extensions:** Authenticity, Non-repudiation, Accountability, Privacy.

### Applying CIA to an incident
Ask which pillar(s) broke, in what order. Ransomware = Availability (encryption) **+** Confidentiality (exfil before encrypt, double extortion) **+** Integrity (files altered).

### Applying CIA to an asset (this is how criticality is scored)
Rate each pillar High / Medium / Low for that asset. The highest rating drives criticality.

| Asset | C | I | A | Criticality | Reasoning |
|---|---|---|---|---|---|
| EHR database | H | H | H | **Critical** | PHI + clinical decisions + patient safety |
| Medical imaging (PACS) | H | H | H | **Critical** | Misread scan = wrong diagnosis |
| `billing-srv-01` | H | H | M | **High** | PHI + financial records; days of downtime survivable |
| Hospital website | L | M | M | **Medium** | Defacement = reputational, not clinical |
| Cafeteria menu display | L | L | L | **Low** | No sensitive data, no clinical dependency |

> **Healthcare inversion:** in most businesses Confidentiality leads. In a hospital, **Availability = patient safety**. An encrypted EHR at 3 a.m. is a clinical emergency, not an IT ticket. Say this in the report.

---

## 3. Security Controls — Two Dimensions

Every control is classified **twice**: by *category* (what it is) and by *function* (what it does).

### Categories — the nature of the control

| Category | What it is | Examples |
|---|---|---|
| **Technical** (logical) | Implemented in hardware/software | Firewall, EDR, MFA, encryption, ACLs, SIEM |
| **Administrative** (managerial) | People, policy, process | Policies, training, risk assessments, onboarding/offboarding, BCP |
| **Physical** | Real-world, tangible | Locks, badges, cameras, fences, guards, mantraps, fire suppression |

### Functions — what the control does relative to the event

| Function | Timing | Purpose | Examples |
|---|---|---|---|
| **Preventive** | Before | Stop it happening | Firewall rule, badge lock, MFA, security policy |
| **Detective** | During / after | Discover it happened | SIEM alert, IDS, CCTV review, log review, audit |
| **Corrective** | After | Fix and restore | Restore from backup, patch, incident response, quarantine |
| **Deterrent** | Before | Discourage the attempt | Warning banner, visible cameras, "prosecution" signage |
| **Compensating** | Anytime | Alternative when the primary control is impossible | Segmentation + monitoring in place of a patch |
| *(Directive)* | Before | Instruct expected behaviour — used in CompTIA models | AUP, signage, procedure documents |

### The grid — always classify on both axes

| | Preventive | Detective | Corrective | Deterrent |
|---|---|---|---|---|
| **Technical** | MFA, firewall | SIEM, IDS, FIM | Backup restore, auto-quarantine | Login banner |
| **Administrative** | Security policy, training | Access review, internal audit | IR plan, disciplinary process | Sanctions policy |
| **Physical** | Door lock, mantrap | CCTV, door-ajar alarm | Fire suppression, spare hardware | Visible camera, fence, signage |

### Compensating controls

A compensating control is used **when the required control cannot be implemented** — legacy system, vendor restriction, clinical safety, or cost. It must deliver *comparable* risk reduction, be documented, approved, and time-bounded.

> **Classic MedDefense case:** the legacy billing server runs an OS the vendor won't certify on a patched build. Patching is off the table.
> **Compensating set:** isolate on its own VLAN with deny-by-default ACLs → allow-list only the three required hosts → application-layer firewall → enhanced logging into the SIEM → weekly manual review → documented risk acceptance with a 12-month review date and a named owner.

**Exam trap:** a compensating control is *not* the same as a corrective one. Compensating = substitute for a missing control. Corrective = restores after an incident.

---

## 4. Asset Inventory & Criticality

You cannot protect, detect, or respond for an asset you do not know exists. Everything downstream depends on this table.

### Where the data hides
- IT ticketing system exports and old spreadsheets
- Active Directory / DHCP leases / DNS records
- Procurement and invoice records (finds shadow IT and expired warranties)
- Vendor and support contracts (finds third-party remote access)
- Network diagrams (usually wrong — verify)
- **Interviews.** Half of any environment lives only in someone's head. Ask "what breaks if this goes down?"
- Predecessor's notes — incomplete, but a starting point

### Minimum inventory fields

| Field | Why it's there |
|---|---|
| Asset ID | Stable reference for every later document |
| Name / hostname | Identification |
| Type | Server, endpoint, network, medical device, application, data store, facility |
| Site | Central / Westside / HQ / cloud |
| Business owner | Who decides — not who administers |
| Technical owner | Who patches it |
| Function | Plain-language purpose |
| Data classification | See §5 |
| **Dependencies** | What it needs, what needs it |
| C / I / A ratings | Drives criticality |
| Criticality | Critical / High / Medium / Low |
| Existing controls | Feeds the gap analysis |
| Notes | Legacy, EOL, vendor-managed, undocumented |

### Criticality scale

| Level | Definition | Downtime tolerance |
|---|---|---|
| **Critical** | Failure stops patient care or triggers regulatory breach | Minutes |
| **High** | Failure severely disrupts operations or exposes sensitive data | Hours |
| **Medium** | Failure degrades a business function; workarounds exist | Days |
| **Low** | Minor inconvenience | Weeks |

> **The Change Healthcare lesson:** the fatal gap was not a missing tool, it was **undocumented dependencies**. Record what each asset connects to. A "Medium" asset that every "Critical" asset depends on is not Medium.

---

## 5. Data Classification & Data States

### Classification levels

| Level | Meaning | Healthcare example | Handling |
|---|---|---|---|
| **Public** | Free release, no harm | Visiting hours, job ads | No restriction |
| **Internal** | Staff only; minor harm if leaked | Org charts, internal memos | Auth required |
| **Confidential** | Serious harm if leaked | HR files, contracts, financials | Need-to-know, encrypted, logged |
| **Restricted** | Severe harm; regulated | PHI/ePHI, card data, credentials | Strict need-to-know, encryption everywhere, full audit trail, MFA |

Classification is set by the **data owner**, applied by the **custodian**, used by the **user**. It follows the data — copies, exports and backups inherit the label. Aggregation can raise it: 1 patient record is Restricted; 50,000 in a CSV is a reportable event waiting to happen.

### The three states — all three need controls

| State | What it means | Controls | Common gap |
|---|---|---|---|
| **At rest** | Stored on disk, tape, backup, phone | Full-disk / DB / field encryption, access control, secure disposal | Unencrypted backups and laptops |
| **In transit** | Moving across a network | TLS 1.2+, VPN, SFTP, secure email | Internal traffic left in plaintext, legacy HL7 feeds |
| **In use** | Loaded in memory / on screen / being processed | Session controls, screen locks, privacy screens, clear-desk, memory protections | **Almost always ignored** — unlocked nurse station in a public corridor |

> Regulatory anchors: **HIPAA** (ePHI safeguards: Administrative / Physical / Technical), **GDPR** (health data = special category, Art. 9), **PCI DSS** (cardholder data).

---

## 6. Gap Analysis

**Gap = required control − control actually in place, weighted by asset criticality.**

### Method
1. Pick a baseline (NIST CSF 2.0, CIS v8 IG1/IG2, ISO 27001 Annex A, HICP).
2. For each Critical/High asset, list the controls the baseline requires.
3. Record what actually exists — **with evidence**, not with what someone claims.
4. Mark the delta.
5. Rate the risk using asset criticality × exposure × existing detection.

### Gap register format

| ID | Asset | Required control | Actual state | Evidence | Gap | Asset criticality | Risk |
|---|---|---|---|---|---|---|---|
| G-01 | EHR DB | MFA on admin access | Password only, shared account | AD screenshot | No MFA, no accountability | Critical | **Critical** |
| G-02 | Server room | Enforced physical access | Door wedged open | Site walkthrough photo | Control bypassed daily | Critical | **High** |
| G-03 | `billing-srv-01` | Patched, supported OS | Legacy, vendor-locked | Vendor email | Cannot patch → needs compensating set | High | **High** |
| G-04 | Website | WAF / hardening | Hosting default only | Vendor config | Limited hardening | Medium | **Low** |

**Three states worth naming separately:**
- **Missing** — the control does not exist.
- **Present but ineffective** — it exists and is bypassed (the wedged door, the disabled alert).
- **Present but unverified** — nobody has tested the restore, so the backup is a belief, not a control.

> **Same vulnerability, different risk.** No MFA on the cafeteria display = Low. No MFA on the EHR = Critical. Identical weakness, different asset. This is the single point the project is testing.

---

## 7. Risk Treatment

| Strategy | Meaning | When to use | Example |
|---|---|---|---|
| **Mitigate** (reduce) | Add controls to lower likelihood or impact | Default choice for Critical/High | Deploy MFA, segment the network |
| **Transfer** (share) | Shift financial consequence to a third party | Low-frequency, high-cost events | Cyber insurance, contractual liability with the EHR vendor |
| **Accept** | Consciously live with it | Cost of control > impact, or residual after mitigation | Accept low risk on the menu display |
| **Avoid** | Stop the activity creating the risk | The exposure isn't worth the value | Decommission the legacy portal instead of maintaining it |

**Rules that get marks and matter in real life:**
- Acceptance is only valid with a **named owner, documented rationale, sign-off at the right level, and a review date**. Undocumented acceptance = negligence.
- **Transfer never removes the risk.** Insurance pays; it does not restore patient care or your reputation. Regulatory liability is not transferable.
- **Avoidance is not always available** — you cannot "avoid" running an EHR.
- Every treatment leaves **residual risk**. Say what it is.

---

## 8. Prioritisation

### Scoring
`Risk score = Likelihood (1–5) × Impact (1–5)` → plot on a 5×5 matrix → 1–4 Low, 5–9 Medium, 10–14 High, 15–25 Critical.
Then adjust for **effort and cost** to sequence the work.

### Sequencing for a board audience

| Bucket | Criteria | MedDefense examples |
|---|---|---|
| **Immediate (0–30 days)** | Critical risk, low cost, no project needed | Close/alarm the server room door, kill shared admin accounts, verify one backup restore |
| **Short term (30–90 days)** | High risk, moderate effort | MFA on all clinical and remote access, patch cycle, log centralisation |
| **Strategic (90 days+)** | Needs budget, headcount, or vendor work | SIEM + monitoring capability, network segmentation, IR plan and tabletop, awareness programme |

**Tie-breakers:** patient safety first → regulatory exposure → single points of failure → number of assets covered by one control → quick wins that buy credibility for the expensive asks.

> Free and fast fixes go first in the report. They prove competence before you ask for money — and Marcus's departure suggests spending gets pushback here.

---

## 9. Threat Intelligence Validation

Internal findings are opinions until you tie them to what attackers actually do. This is what converts a nervous board into a funding decision.

| Source | Use |
|---|---|
| **CISA advisories + KEV catalogue** | Vulnerabilities under active exploitation — instant prioritisation |
| **HHS HC3** | Healthcare-sector threat briefs (US) |
| **H-ISAC** | Healthcare information sharing |
| **MITRE ATT&CK** | Map each gap to real adversary techniques |
| **Verizon DBIR** | Sector breach patterns and root causes |
| **ENISA Threat Landscape** | EU-side sector data |
| **Ransomware group leak sites / vendor reports** | Who is currently targeting hospitals |

**How to use it in a finding:**
> "Our lack of MFA on remote access (G-01) maps to ATT&CK T1078 *Valid Accounts*, the initial access vector in the majority of healthcare intrusions reported by CISA. This is not theoretical exposure."

---

## 10. Writing for the Board

### Structure

1. **Executive summary** — 1 page, no jargon. Overall posture, top 3 risks, headline ask.
2. **Scope & methodology** — what you assessed, how, what you could not verify.
3. **Asset inventory summary** — counts by criticality, not the full table.
4. **Key findings** — top 5–7, each with business impact.
5. **Gap analysis / risk register** — the structured detail.
6. **Prioritised roadmap** — phased, with owners, timelines and cost bands.
7. **Appendices** — full inventory, evidence, methodology notes.

### Translation table

| Don't write | Write |
|---|---|
| "No MFA on VPN" | "A single stolen password gives an attacker full remote access to patient records" |
| "Unpatched CVE-2023-xxxx on billing-srv-01" | "The billing system carries a flaw attackers are actively exploiting today; billing could stop for weeks" |
| "Backups are untested" | "We have never proven we can recover. In a ransomware event, our recovery time is unknown" |
| "Flat network" | "A compromise of one reception PC can reach the systems clinicians depend on" |

### Rules
- Lead with **impact**, follow with cause, close with the ask.
- **Quantify** wherever possible: beds, patients, hours of downtime, fine exposure, cost of control vs. cost of incident.
- One recommendation per finding. Give the board a **decision**, not a problem.
- State what you could **not** verify — assessed honesty beats false completeness.
- No tool names in the executive summary. Ever.

---

## 11. Framework Quick Map

| Framework | Use it for |
|---|---|
| **NIST CSF 2.0** — Govern, Identify, Protect, Detect, Respond, Recover | Overall structure. This project = **Identify**. *Govern* is new in 2.0 |
| **NIST SP 800-12 Rev.1** | Foundational concepts, roles and responsibilities |
| **NIST SP 800-30** | Risk assessment method: threat, vulnerability, likelihood, impact |
| **NIST SP 800-53 Rev.5** | Control catalogue and control-family taxonomy (learn the families, not all controls) |
| **CIS Controls v8** | 18 prioritised controls; IG1 is the realistic starting baseline for MedDefense |
| **ISO 27001 / 27002** | ISMS certification and gap-analysis methodology |
| **HHS HICP (405(d))** | Healthcare-specific practices scaled to organisation size |
| **HIPAA Security Rule** | Administrative / Physical / Technical safeguards — mirrors the control categories |

---

## 12. Fast Recall

- **Risk = Likelihood × Impact.** A vulnerability with no threat, or on a worthless asset, is not a meaningful risk.
- **Threat ≠ vulnerability ≠ risk.** Threat is the actor/event, vulnerability is the weakness, risk is the consequence-weighted combination.
- **Categories:** Technical, Administrative, Physical. **Functions:** Preventive, Detective, Corrective, Compensating, Deterrent. Classify on both axes, always.
- **Compensating** substitutes for an impossible control. **Corrective** restores after the event.
- **CIA for assets → criticality. CIA for incidents → what broke.**
- **Availability leads in healthcare** because downtime is a patient-safety event.
- **Data classification levels:** Public, Internal, Confidential, Restricted. **States:** at rest, in transit, **in use** — the third is the one people forget.
- **Treatments:** Mitigate, Transfer, Accept, Avoid. Acceptance needs an owner and an expiry date. Transfer never removes liability.
- **A control that is bypassed is not a control.** Record it as a gap.
- **Undocumented dependencies are the real breach multiplier.**
- **Same vulnerability, different asset = different risk.** If you remember one thing, remember this.

---

## 13. Resources

**Security fundamentals**
- NIST SP 800-12 Rev.1 — *An Introduction to Information Security* (Ch. 2–3)
- NIST SP 800-30 — *Guide for Conducting Risk Assessments* (Ch. 2)

**Security controls**
- NIST SP 800-53 Rev.5 — Introduction and control-family overview
- CIS Controls v8 — top-level descriptions of the 18 controls

**Asset management & data protection**
- NIST Cybersecurity Framework 2.0 — *Identify* function
- CISA — Healthcare and Public Health Sector guidance

**Gap analysis & risk treatment**
- IT Governance — ISO 27001 gap analysis methodology
- HHS — Health Industry Cybersecurity Practices (HICP): Executive Summary and Threat Overviews

**Case study**
- Change Healthcare (2024) — read it as an asset-inventory and dependency-mapping failure, not a hacking story.
