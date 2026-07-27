# Risk Assessment & Mitigation Strategies

> `Risk that is not communicated is risk that is not managed.`

> **What this covers:** Turning raw security findings into business decisions. How to define risk, score it, prioritize it, treat it, and explain it to people who do not care about CVEs. Finding a vulnerability is half the job. This is the other half.

---

## Table of Contents
- [Core Vocabulary](#core-vocabulary)
- [Why Risk Assessment Matters](#why-risk-assessment-matters)
- [The Components of Risk](#the-components-of-risk)
- [Inherent vs Residual Risk](#inherent-vs-residual-risk)
- [Risk Appetite vs Risk Tolerance](#risk-appetite-vs-risk-tolerance)
- [Threat Actors and How Motivation Drives Likelihood](#threat-actors-and-how-motivation-drives-likelihood)
- [Categorizing Vulnerabilities](#categorizing-vulnerabilities)
- [Risk Assessment Methodologies](#risk-assessment-methodologies)
- [The Risk Matrix](#the-risk-matrix)
- [CVSS and Vulnerability Scoring](#cvss-and-vulnerability-scoring)
- [Risk Treatment and Mitigation Strategies](#risk-treatment-and-mitigation-strategies)
- [Security Control Types](#security-control-types)
- [Translating Technical Risk into Business Language](#translating-technical-risk-into-business-language)
- [The Risk Assessment Process](#the-risk-assessment-process)
- [Frameworks and Standards Map](#frameworks-and-standards-map)
- [Templates](#templates)
- [Field Notes](#field-notes)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Vocabulary

| Term | Plain meaning |
|------|---------------|
| **Asset** | Anything of value worth protecting: data, systems, people, reputation |
| **Threat** | Something that can cause harm to an asset (a threat source plus a threat event) |
| **Threat source** | The actor or origin behind a threat: attacker, insider, malware, nature |
| **Vulnerability** | A weakness that a threat can exploit |
| **Exploit** | The method or code that actually uses a vulnerability |
| **Likelihood** | The chance the threat exploits the vulnerability |
| **Impact** | How much harm results if it happens |
| **Risk** | The combination of likelihood and impact: the chance of harm times how bad it is |
| **Control** | A safeguard that reduces risk (also called a countermeasure or mitigation) |
| **Inherent risk** | Risk before any controls are applied (raw risk) |
| **Residual risk** | Risk left over after controls are applied |
| **Risk appetite** | The broad amount of risk an organization is willing to take to meet its goals |
| **Risk tolerance** | The acceptable variation around appetite for a specific risk |
| **Risk owner** | The person accountable for managing a specific risk |
| **Risk register** | The master list where every risk is recorded and tracked |
| **Risk treatment** | The decision on what to do about a risk (mitigate, transfer, accept, avoid) |
| **Threat modeling** | Structured way to find threats against a system during design |

**The risk relationship in one line:**
**A threat exploits a vulnerability against an asset, and the result is risk (likelihood of it happening times the impact if it does).**

If any one of threat, vulnerability, or impact is zero, the risk is zero. No weakness means nothing to exploit. No impact means nothing to lose.

## 2. Why Risk Assessment Matters

A vulnerability scan tells you what is broken. A risk assessment tells you what to fix first and why.

Organizations never have enough time, money, or people to fix everything. Risk assessment is how they decide where to spend limited resources for the most protection.

**Its role in a pentest and a wider security program:**

- Turns a raw findings list into a ranked set of business decisions.
- Answers the three questions leadership actually asks: how bad is it, how likely is it, and what will it cost to fix versus accept.
- Connects a technical bug to a business consequence (downtime, fines, lost customers, safety).
- Makes the difference between a report that gets ignored and one that gets budget.

**A pentester who cannot communicate risk is only half effective.** Anyone can run a scanner. The valuable skill is sitting across from a CEO and explaining, in plain language, what is at stake and what to do about it.

> A vulnerability scan or a pentest is an **input** to risk assessment, not the assessment itself. The scan finds the weakness. The assessment decides what it means.

## 3. The Components of Risk

Risk is built from four parts. Learn these cold, they are the most tested items in the project.

| Component | Question it answers | Example |
|-----------|---------------------|---------|
| **Threat** | Who or what could cause harm? | Ransomware group, malicious insider |
| **Vulnerability** | What weakness lets them in? | Unpatched VPN, no MFA |
| **Likelihood** | How probable is it? | High: the exploit is public and the system is exposed |
| **Impact** | How bad if it happens? | Clinical systems down, PHI stolen, regulatory fines |

**The common risk equations:**

```text
Risk = Likelihood × Impact                 (the standard model)
Risk = Threat × Vulnerability × Impact      (expanded model)
Risk = Loss Event Frequency × Loss Magnitude   (FAIR / quantitative model)
```

They all say the same thing. Risk grows when an attack is both more likely and more damaging.

**What actually drives likelihood:**
- Threat capability and motivation (does someone want in, and can they).
- Vulnerability severity (how easy is the weakness to exploit).
- Existing controls (what already stands in the way).

**What actually drives impact:**
- Value and sensitivity of the asset.
- Business dependency on it (what breaks downstream).
- Data type (PHI, PII, financial, credentials).
- Regulatory, safety, and reputational consequences.

## 4. Inherent vs Residual Risk

This distinction comes up constantly. Keep it simple.

| Risk type | When it is measured | Meaning |
|-----------|---------------------|---------|
| **Inherent risk** | Before controls | The raw risk with no defenses in place |
| **Residual risk** | After controls | What remains once you have applied your safeguards |

```text
Residual risk = Inherent risk − effect of controls
```

**Key points:**
- Residual risk is never zero. There is always some leftover. The goal is to reduce it to a level the organization can accept.
- If residual risk is still too high, you add more controls or choose a different treatment.
- Residual risk should be formally **accepted and signed off** by someone with the authority to own it.

**A useful third term:** some reports also track **current risk** (with the controls you have today) and **target risk** (the level you expect after a planned fix). The journey is inherent → current → target → residual.

> Real-world note: auditors love this question. "You applied a control. What is the residual risk, and who accepted it?" If you cannot answer, the risk is not actually managed.

## 5. Risk Appetite vs Risk Tolerance

Both describe how much risk an organization will accept, but at different levels.

| | Risk appetite | Risk tolerance |
|---|---------------|----------------|
| **Level** | Strategic, organization-wide | Tactical, specific to a risk or objective |
| **Set by** | Board and senior leadership | Business or risk owners |
| **Nature** | Broad, often qualitative | Specific, often measurable thresholds |
| **Answers** | How much risk are we willing to take overall? | How much can we bear on this specific thing? |

**Analogy:** appetite is your general willingness to drive fast. Tolerance is the exact speed on a specific road that you will not cross. Appetite sets the attitude, tolerance sets the number.

**Example:**
- Appetite: "We are risk-averse about patient data and will invest heavily to protect it."
- Tolerance: "No more than 4 hours of EHR downtime per year," or "zero unencrypted PHI leaving the network."

Treatment decisions flow from these. A risk inside tolerance can often be accepted. A risk outside it must be treated.

## 6. Threat Actors and How Motivation Drives Likelihood

You covered actor categories in the Know Your Enemy project. Here the focus is narrow: **how an actor's motivation changes the likelihood of an attack.**

| Actor | Main motivation | Effect on likelihood |
|-------|-----------------|----------------------|
| **Cybercriminal** | Financial gain | High for any org with monetizable data or the ability to pay ransom |
| **Nation-state / APT** | Espionage, strategic advantage | Low for a random org, very high for a strategic or high-value target |
| **Hacktivist** | Ideology, protest | Depends on the org's public profile, politics, or affiliations |
| **Insider** | Grievance, greed, error | Raised by weak access control, poor offboarding, low monitoring |
| **Script kiddie / opportunist** | Curiosity, status, easy wins | High for exposed, unpatched, or default-configured systems |

**The core idea:** likelihood is not only about how exploitable a bug is. It is about **who wants to attack you and why.** A credible threat needs intent, capability, and opportunity together.

- A powerful APT with no interest in your small billing system is a low likelihood.
- A low-skill opportunist with a public exploit and your exposed server is a high likelihood.

> Do not confuse sophistication with likelihood or impact. A low-skill attacker using leaked credentials can cause a catastrophic breach. Rate risk on likelihood and impact, not on how clever the attacker is.

## 7. Categorizing Vulnerabilities

Vulnerabilities are not only technical. Sorting them into categories helps you see gaps that a scanner will never find.

| Category | What it is | Examples |
|----------|-----------|----------|
| **Technical** | Weaknesses in software, systems, or configuration | Unpatched CVEs, misconfigurations, weak crypto, default credentials, open ports |
| **Human** | Weaknesses in people and behavior | Phishing susceptibility, weak passwords, oversharing, poor security awareness |
| **Procedural** | Weaknesses in policies and processes | No change management, missing onboarding/offboarding process, no incident plan |
| **Operational** | Gaps in day-to-day running of security | Irregular patching, no log review, untested backups, poor asset inventory |
| **Physical** | Weaknesses in the physical environment | Unlocked server rooms, no CCTV, tailgating, unsecured or lost devices |

**Why this matters:** technical controls cannot fix a procedural or human weakness. A perfectly patched server behind an untrained help desk that resets passwords for anyone who calls is still wide open. Real defense covers all five categories.

## 8. Risk Assessment Methodologies

Three ways to measure risk. Know when to use each.

| Method | How it works | Strengths | Weaknesses |
|--------|--------------|-----------|------------|
| **Qualitative** | Descriptive scales like Low / Medium / High or 1 to 5 | Fast, easy, great for communication and prioritizing | Subjective, hard to compare precisely |
| **Quantitative** | Real numbers and money (SLE, ARO, ALE, FAIR) | Objective, supports cost-benefit and budget cases | Needs data, time, and effort; false precision risk |
| **Semi-quantitative** | Numeric scores mapped to qualitative bands | Balances speed and rigor; good middle ground | Still partly subjective |

### Qualitative

The risk matrix approach. You rate likelihood and impact on a scale, multiply or plot them, and get a rating. Most day-to-day risk work is qualitative because it is quick and communicates well.

### Quantitative (the money math)

Learn these formulas, they are frequently tested:

```text
SLE (Single Loss Expectancy) = Asset Value × Exposure Factor (EF)
ARO (Annualized Rate of Occurrence) = expected number of times per year
ALE (Annualized Loss Expectancy) = SLE × ARO
```

- **Exposure Factor (EF):** the percentage of the asset lost in one incident (0 to 1).
- **ALE** is the headline number: expected loss per year, in currency.

**Worked example:**
- Customer database value: 500,000
- A breach exposes 40 percent of it, so EF = 0.4
- SLE = 500,000 × 0.4 = **200,000**
- It is expected once every two years, so ARO = 0.5
- ALE = 200,000 × 0.5 = **100,000 per year**

**Cost-benefit of a control:**
- A control costs 30,000 per year and cuts the rate to once every 10 years (ARO = 0.1).
- New ALE = 200,000 × 0.1 = 20,000 per year.
- Benefit = 100,000 − 20,000 = 80,000 saved. Minus the 30,000 cost = **50,000 net benefit.** Worth it.

```text
ROSI (Return on Security Investment) = (ALE_before − ALE_after − Cost) / Cost
Example: (100,000 − 20,000 − 30,000) / 30,000 ≈ 1.67, or about 167%
```

This is the math that wins budget. "This 30k control saves us 50k a year" beats "the CVSS is 9.8."

### Semi-quantitative

You assign numbers to qualitative bands so you can rank and do light math without full quantitative rigor. Example: a 5x5 matrix produces scores from 1 to 25, or impact bands map to money ranges (Low = under 10k, Medium = 10k to 100k, High = over 100k). This is what most mature teams actually use.

## 9. The Risk Matrix

The main tool for prioritizing findings. Also called a risk heatmap.

- Two axes: **Likelihood** and **Impact**, usually 5 by 5.
- Each cell is a risk level, usually color-coded green, yellow, orange, red.
- Score = Likelihood value × Impact value (1 to 25 on a 5x5).

```text
IMPACT →
        1-Min   2-Low   3-Mod   4-High  5-Sev
L  5     5      10      15      20      25
I  4     4       8      12      16      20
K  3     3       6       9      12      15
E  2     2       4       6       8      10
L  1     1       2       3       4       5
↑ LIKELIHOOD
```

**How to use it during testing:**
1. Rate each finding's likelihood and impact.
2. Plot it on the matrix or calculate its score.
3. Sort by score. The top-right corner (high likelihood, high impact) gets fixed first.
4. Assign owners and treatment to the highest scores.

**Typical banding:**

| Score | Level | Rough action |
|-------|-------|--------------|
| 1 to 4 | Low | Accept or fix at leisure |
| 5 to 9 | Medium | Plan a fix |
| 10 to 15 | High | Fix soon |
| 16 to 25 | Critical | Fix now |

> Caution: a matrix compresses a lot of detail into one number. Two risks can share a score but have very different profiles. Keep your scoring criteria written down so scores are not argued in the room. The matrix is a communication tool as much as an analytical one.

## 10. CVSS and Vulnerability Scoring

CVSS (Common Vulnerability Scoring System) rates the **severity** of a vulnerability from 0 to 10. It is the standard used by the NVD and most scanners.

| Severity | Score |
|----------|-------|
| None | 0.0 |
| Low | 0.1 to 3.9 |
| Medium | 4.0 to 6.9 |
| High | 7.0 to 8.9 |
| Critical | 9.0 to 10.0 |

**Two versions you will see:**
- **CVSS v3.1:** metric groups are Base, Temporal, Environmental.
- **CVSS v4.0** (released November 2023): renames and adds groups (Base, Threat, Environmental, Supplemental). It replaced the Temporal group with a Threat group, and split the old Scope metric into Vulnerable System and Subsequent System impact for more precision.

**The most important idea about CVSS:**

> CVSS measures **severity, not risk.** It tells you how dangerous a flaw is in general. It does not know your asset value, your exposure, or whether anyone is actually attacking it. Risk = severity plus context.

A CVSS 9.8 on an isolated lab box you are about to wipe is lower risk than a CVSS 6.5 on your internet-facing crown-jewel database.

**Combine three signals for real patch prioritization:**
- **CVSS:** how severe the flaw is.
- **EPSS (Exploit Prediction Scoring System):** the probability it will be exploited in the wild.
- **CISA KEV (Known Exploited Vulnerabilities):** whether it is being actively exploited right now.

Patching purely by CVSS wastes effort. A medium-CVSS bug that is on the KEV list and has high EPSS deserves attention before a critical-CVSS bug nobody is exploiting.

## 11. Risk Treatment and Mitigation Strategies

Once a risk is scored, you decide what to do with it. There are four standard options, often called the four T's.

| Option (the four T's) | Also called | What it means | Example |
|-----------------------|-------------|---------------|---------|
| **Treat** | Mitigate / Reduce | Apply controls to lower likelihood or impact | Patch the system, add MFA, segment the network |
| **Transfer** | Share | Shift some of the loss to a third party | Cyber insurance, outsourcing, contract clauses |
| **Tolerate** | Accept / Retain | Acknowledge the risk and live with it, with sign-off | Accept a low risk that costs more to fix than it saves |
| **Terminate** | Avoid | Remove the activity or asset causing the risk | Shut down an unused legacy service |

(Some frameworks add a fifth: **Escalate**, when the risk is above your authority to decide.)

**Two ways to mitigate (treat):**
- **Reduce likelihood:** patching, MFA, hardening, least privilege, awareness training.
- **Reduce impact:** backups, network segmentation, encryption, an incident response plan.

The strongest programs do both, so that if prevention fails, the damage is contained. That layered approach is **defense in depth.**

**Important notes:**
- **Accept is a valid and common choice.** Not every risk gets fixed. The key is that acceptance is a documented, owned decision, not neglect.
- **Transfer does not erase impact.** Insurance may cover some financial loss, but not the downtime, the reputation hit, or the regulatory duty. You still own the operational consequence.
- The chosen treatment should aim to bring **residual risk** within the organization's tolerance.

## 12. Security Control Types

Controls are grouped two ways: by **what they do** and by **what they are.**

**By function (what they do):**

| Type | Purpose | Example |
|------|---------|---------|
| **Preventive** | Stop an incident before it happens | Firewall, MFA, access control |
| **Detective** | Spot an incident in progress | IDS, log monitoring, alerts |
| **Corrective** | Fix or reduce damage after | Patching, restoring from backup |
| **Deterrent** | Discourage an attacker | Warning banners, visible cameras |
| **Recovery** | Restore normal operation | Backups, disaster recovery site |
| **Compensating** | An alternative when the ideal control is not possible | Extra monitoring where a legacy system cannot be patched |

**By nature (what they are):**

| Type | Meaning | Example |
|------|---------|---------|
| **Technical (logical)** | Enforced by technology | Encryption, firewalls, MFA |
| **Administrative (managerial)** | Enforced by policy and process | Security policies, training, risk reviews |
| **Physical** | Enforced in the real world | Locks, badges, guards, CCTV |

A good recommendation usually blends all three natures. Buying a tool without a policy and training behind it rarely works.

## 13. Translating Technical Risk into Business Language

This is the skill that separates a report that drives decisions from one that gets filed and forgotten. Leadership does not care about CVE numbers. They care about money, downtime, compliance, reputation, and safety.

**Rules:**
- Lead with the business consequence, not the technical detail.
- Give likelihood, impact, a recommendation, and a cost.
- Use plain analogies. Skip the jargon in the executive summary.
- Tie every risk to something the organization already worries about.

**Translation table:**

| Do not say | Say instead |
|------------|-------------|
| "The VPN has a critical CVE (CVSS 9.8)." | "Our remote access gateway has a weakness that lets an attacker in without a password. If exploited, staff lose access to core systems." |
| "T1078 Valid Accounts was observed." | "An attacker used a real employee login, so our anti-malware tools would not have flagged it." |
| "We found SQL injection in the portal." | "An attacker could read our entire customer database through the public website. That is a reportable breach with regulatory fines." |
| "MFA is not enforced." | "A single stolen password is enough to access patient records. A second login step would stop the most common attack we see." |
| "Insider threat risk is high." | "Staff can export more data than their role needs, and no one is alerted when they do." |

**The formula for a finding a board will act on:**
**Business consequence + likelihood + impact + recommended action + cost to fix versus cost to accept.**

## 14. The Risk Assessment Process

The standard flow, based on **NIST SP 800-30**. Four stages.

1. **Prepare.** Define scope, purpose, assumptions, and constraints. Identify the threat sources you care about and the risk model you will use.
2. **Conduct the assessment.** This is the core, in five steps:
   - Identify **threat sources and events**.
   - Identify **vulnerabilities and predisposing conditions**.
   - Determine **likelihood** of each threat event.
   - Determine **impact** if it occurs.
   - Determine **risk** as a combination of likelihood and impact.
3. **Communicate results.** Share findings with decision-makers in language they can act on. Feed the risk register.
4. **Maintain.** Monitor risks over time, update as the environment changes, and re-assess. Risk assessment is a cycle, not a one-time event.

> Practical flow you will actually run: scope it, list assets, find threats and vulnerabilities, score likelihood and impact, plot on the matrix, recommend treatment, record everything in the register, and review on a schedule.

## 15. Frameworks and Standards Map

Know what each one is **for**, not every clause. Tests ask "which standard covers X," not the full text.

| Framework | Use it for | Do not treat it as |
|-----------|-----------|--------------------|
| **NIST SP 800-30** | How to conduct a risk assessment (the methodology) | A controls catalog |
| **NIST SP 800-37** | The Risk Management Framework (RMF), the full lifecycle | A quick risk-scoring method |
| **NIST SP 800-53** | A catalog of security and privacy controls to choose from | A risk assessment process |
| **NIST SP 800-39** | Managing risk across the whole organization (three tiers) | A technical test guide |
| **NIST SP 800-137** | Continuous monitoring (ISCM) | A one-time assessment |
| **NIST SP 800-160** | Building security into systems engineering | A compliance checklist |
| **ISO/IEC 27001** | Running a certifiable Information Security Management System (ISMS) | A risk method by itself |
| **ISO/IEC 27005** | Information security risk management guidance | A mandatory step list |
| **ISO/IEC 31000** | Enterprise risk management principles (all risk, not just IT) | An IT-only standard |
| **ISO/IEC 31010** | A toolbox of risk assessment techniques | A management system |
| **FAIR** | Quantifying risk in financial terms | A qualitative shortcut |
| **OCTAVE (Allegro)** | Asset-focused, self-directed operational risk assessment | A technical scanner |
| **CIS Controls** | A prioritized list of defensive actions (18 controls, IG1 to IG3) | A risk-scoring formula |
| **OWASP Risk Rating** | Rating application security risks (Likelihood × Impact with factors) | An enterprise-wide standard |

**A few worth knowing deeper:**

- **NIST RMF (800-37) has 7 steps:** Prepare, Categorize, Select, Implement, Assess, Authorize, Monitor.
- **NIST SP 800-39 uses 3 tiers:** organization, mission/business process, and information system.
- **OWASP Risk Rating** breaks likelihood into threat-agent and vulnerability factors, and impact into technical and business factors, then combines them. It is the go-to for scoring findings in a web app pentest, which fits your AppSec direction.
- **ISO 31000 vs 27005:** 31000 is the broad enterprise risk umbrella; 27005 applies those ideas specifically to information security. 27005 supports 27001.

## 16. Templates

Copy these skeletons straight into a sheet or doc. They are simple on purpose. For diagrams (threat models), use draw.io or OWASP Threat Dragon and link the file, do not try to draw inside the register.

### Risk Register

The master tracking list. One row per risk.

| Column | What goes in it |
|--------|-----------------|
| Risk ID | Unique ID, for example R-001 |
| Risk title / description | Short, clear statement of the risk |
| Asset affected | What is at stake |
| Threat / vulnerability | The source and the weakness |
| Category | Technical, human, procedural, operational, physical |
| Likelihood | Score or Low/Med/High |
| Impact | Score or Low/Med/High |
| Inherent risk | Likelihood × impact before controls |
| Existing controls | What is already in place |
| Residual risk | Risk level after existing controls |
| Treatment option | Treat, transfer, tolerate, terminate |
| Treatment actions | The planned fix |
| Risk owner | Who is accountable |
| Target date | When it will be done |
| Status | Open, in progress, closed, accepted |

### Risk Assessment Report

The document that presents the assessment.

```text
1. Executive summary        top risks, why they matter, key decisions, confidence
2. Scope and methodology     systems, dates, method used, assumptions, limits
3. Assets and context        what was assessed and why it matters to the business
4. Threats and vulnerabilities   what was found
5. Risk analysis             matrix, scores, ratings
6. Prioritized findings      ranked list with likelihood and impact
7. Recommendations           treatment per risk, with cost and owner
8. Appendices                evidence, scoring criteria, raw data
```

### Risk Treatment Plan

Tracks the decision and the fix for each risk you chose to act on.

| Column | What goes in it |
|--------|-----------------|
| Risk ID / description | Links back to the register |
| Chosen treatment | Treat, transfer, tolerate, terminate |
| Control(s) to implement | The specific safeguards |
| Owner | Who delivers it |
| Resources / cost | Budget, people, time |
| Timeline / milestones | Key dates |
| Success criteria | How you know it worked |
| Target residual risk | The level you expect after the fix |
| Status | Progress tracking |

### Threat Model

Best done with a diagram plus this structure (STRIDE fits well here).

```text
- System / scope           what you are modeling
- Data flow diagram        components, data stores, flows, trust boundaries
- Assets                   what is valuable in this system
- Threats                  per component, ask STRIDE: Spoofing, Tampering,
                           Repudiation, Information disclosure, Denial of
                           service, Elevation of privilege
- Existing controls        what already defends each threat
- Risk rating              likelihood and impact per threat
- Mitigations              what to add, with owner
```

### Risk Report (board-facing)

A short, high-level summary for leadership. Not the full assessment.

```text
- Top risks summary        the handful that matter most, in business terms
- Risk heatmap             the matrix, color-coded
- Trend                    are we getting better or worse since last time
- Decisions needed         what leadership must approve or fund
- Treatment progress       what has been fixed since last report
```

## 17. Field Notes

Practical things that matter in real work and rarely appear in the slides.

- **A scan is not a risk assessment.** The scan is an input. Risk = the finding plus asset value, exposure, and threat context.
- **CVSS is severity, not risk.** Never hand a board a raw list of CVEs. Translate to consequence.
- **Combine CVSS + EPSS + KEV + asset value** for patch order. A medium bug being actively exploited beats a critical nobody touches.
- **Every risk needs an owner.** A risk with no name next to it never gets fixed.
- **Residual risk needs explicit sign-off** from someone with the authority to accept it. Write down who accepted it and when.
- **Likelihood is the hardest number to get right.** Be honest about uncertainty. Use ranges rather than fake precision.
- **Qualitative for speed and communication. Quantitative when you need budget.** Money math wins arguments with finance.
- **Keep your scoring criteria written down.** Otherwise every score becomes a debate. A matrix is political as much as analytical.
- **Accept is a real, common treatment.** Document why, do not pretend the risk is gone.
- **Transfer (insurance) does not remove operational or reputational impact,** only some of the financial loss.
- **Map recommendations to a framework the org already uses** (NIST or ISO). Recommendations land better when they fit the existing language.
- **Your web dev background is an edge here.** OWASP Risk Rating and threat modeling of web apps will feel natural, and that is exactly where AppSec risk work lives.

## 18. Fast Recall

- **Risk = Likelihood × Impact.** If threat, vulnerability, or impact is zero, risk is zero.
- Four risk components: **threat, vulnerability, likelihood, impact.**
- **Inherent** risk is before controls. **Residual** risk is what is left after. Residual is never zero.
- **Appetite** is the broad, strategic willingness to take risk. **Tolerance** is the specific, measurable limit for one risk.
- Likelihood depends on **intent, capability, and opportunity**, not just how exploitable a bug is.
- Vulnerability categories: **technical, human, procedural, operational, physical.**
- Three methodologies: **qualitative** (scales), **quantitative** (money: SLE, ARO, ALE), **semi-quantitative** (numbers mapped to bands).
- **SLE = Asset Value × EF. ALE = SLE × ARO.** ALE is the yearly expected loss.
- The **risk matrix** plots likelihood against impact to prioritize; fix the top-right first.
- **CVSS = severity, not risk.** Add EPSS and KEV for real prioritization.
- Four treatment options (the four T's): **Treat, Transfer, Tolerate, Terminate.** Accept is valid but must be signed off.
- Controls by function: **preventive, detective, corrective** (plus deterrent, recovery, compensating). By nature: **technical, administrative, physical.**
- Translate to business language: **consequence + likelihood + impact + action + cost.**
- **NIST 800-30** = how to assess risk. **800-37** = RMF lifecycle. **800-53** = controls catalog.
- **ISO 31000** = enterprise risk. **27005** = infosec risk. **FAIR** = quantitative. **OCTAVE** = asset-focused.
- Risk assessment is a **cycle**: prepare, conduct, communicate, maintain.

## 19. Resources

**NIST publications** (free, authoritative)
- [NIST SP 800-30 Rev.1, Guide for Conducting Risk Assessments](https://csrc.nist.gov/pubs/sp/800/30/r1/final)
- [NIST SP 800-37 Rev.2, Risk Management Framework](https://csrc.nist.gov/pubs/sp/800/37/r2/final)
- [NIST SP 800-53 Rev.5, Security and Privacy Controls](https://csrc.nist.gov/pubs/sp/800/53/r5/final)
- [NIST SP 800-39, Managing Information Security Risk](https://csrc.nist.gov/pubs/sp/800/39/final)
- [NIST SP 800-137, Information Security Continuous Monitoring](https://csrc.nist.gov/pubs/sp/800/137/final)
- [NIST Risk Management Framework hub](https://csrc.nist.gov/projects/risk-management)

**ISO standards** (overviews are free, full text is paid)
- [ISO/IEC 27005:2022, Information security risk management](https://www.iso.org/standard/80585.html)
- [ISO/IEC 31000:2018, Risk management guidelines](https://www.iso.org/standard/65694.html)
- [ISO/IEC 31010:2019, Risk assessment techniques](https://www.iso.org/standard/72140.html)
- [ISO/IEC 27001:2022, Information security management systems](https://www.iso.org/standard/27001)

**Other frameworks**
- [FAIR Institute (quantitative risk analysis)](https://www.fairinstitute.org/)
- [OCTAVE Allegro at Carnegie Mellon SEI](https://www.sei.cmu.edu/library/security-risk-assessment-using-octave-allegro/)
- [CIS Controls](https://www.cisecurity.org/controls)
- [OWASP Risk Rating Methodology](https://owasp.org/www-community/OWASP_Risk_Rating_Methodology)

**Vulnerability scoring and databases**
- [CVSS v4.0 Calculator (FIRST)](https://www.first.org/cvss/calculator/4.0)
- [CVSS v3.1 Calculator (FIRST)](https://www.first.org/cvss/calculator/3.1)
- [NIST National Vulnerability Database](https://nvd.nist.gov/)
- [CVE.org](https://www.cve.org/)
- [CVE Details](https://www.cvedetails.com/)
- [CISA Known Exploited Vulnerabilities Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)

**Threat modeling and diagramming tools**
- [OWASP Threat Dragon](https://owasp.org/www-project-threat-dragon/)
- [Microsoft Threat Modeling Tool](https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool)
- [draw.io](https://www.drawio.com/)

**Risk platforms** (commercial, good to know by name)
- [RiskLens (FAIR-based)](https://www.risklens.com/)
- [Archer](https://www.archerirm.com/)
- [ServiceNow GRC](https://www.servicenow.com/products/governance-risk-and-compliance.html)

**Templates:** the register, treatment plan, and report skeletons in Section 16 are built to copy straight into Excel, Google Sheets, or a SharePoint list. For threat model diagrams, build them in draw.io or Threat Dragon and link the file rather than embedding.

---
