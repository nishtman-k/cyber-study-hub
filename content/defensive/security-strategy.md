# Security Governance & Strategy

> `Plans are worthless, but planning is everything.` — Dwight D. Eisenhower

> **Scope:** Turning security findings into a business-aligned, cost-justified security strategy. This covers governance, the major frameworks (NIST CSF, CIS Controls, ISO 27001), quantitative risk analysis, risk treatment, control selection, and building an actionable roadmap. The goal is not finding vulnerabilities but deciding what to do about them and justifying the spend.

---

## Table of Contents
- [Security Governance](#security-governance)
- [NIST Cybersecurity Framework 2.0](#nist-cybersecurity-framework-20)
- [CIS Controls v8.1](#cis-controls-v81)
- [ISO 27001](#iso-27001)
- [How the Frameworks Fit Together](#how-the-frameworks-fit-together)
- [Security and Data Roles](#security-and-data-roles)
- [The RACI Matrix](#the-raci-matrix)
- [Quantitative Risk Analysis](#quantitative-risk-analysis)
- [Risk Treatment](#risk-treatment)
- [Risk Appetite vs Tolerance](#risk-appetite-vs-tolerance)
- [The Risk Register](#the-risk-register)
- [Cost-Benefit Analysis](#cost-benefit-analysis)
- [Control Selection](#control-selection)
- [The Security Roadmap](#the-security-roadmap)
- [Acceptable Use Policy](#acceptable-use-policy)
- [Communicating with Executives](#communicating-with-executives)
- [The Security Strategy Document](#the-security-strategy-document)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Security Governance

**Security governance** ensures that cybersecurity activity actually supports the business: its objectives, its regulatory obligations, and its risk appetite. Governance is the layer that keeps security aligned with what the organization is trying to achieve, rather than being a disconnected technical function.

### Governance components

The pieces that make up a governance program: policies, standards, procedures, guidelines, risk management, compliance management, and clearly defined roles and responsibilities.

### The policy hierarchy

Governance documents sit in a hierarchy, from broad intent down to specific instruction.

```text
Policy        high-level statement of intent and expectation
  ↓
Standard      specific, mandatory requirements that support the policy
  ↓
Procedure     step-by-step instructions to meet the standard
  ↓
Guideline     recommended, non-mandatory best practice
```

The distinction matters in practice. A **policy** says what must be true ("access must be controlled"). A **standard** makes it specific and mandatory ("MFA is required on all remote access"). A **procedure** is the exact steps to do it. A **guideline** is advice, not a requirement. Confusing a guideline for a policy, or writing a policy so specific it should have been a standard, is a common governance mistake.

## 2. NIST Cybersecurity Framework 2.0

The NIST Cybersecurity Framework (CSF) provides a structured approach for managing cybersecurity risk. Version 2.0 is built around **six functions**.

| Function | Purpose | Includes |
|----------|---------|----------|
| **GV, Govern** | Establish and oversee the security strategy | Strategy, risk management, oversight, policies, compliance |
| **ID, Identify** | Understand what needs protecting | Asset inventory, risk assessment, data classification, business context |
| **PR, Protect** | Put safeguards in place | MFA, access control, encryption, security awareness |
| **DE, Detect** | Spot incidents as they happen | Monitoring, logging, SIEM, alerts |
| **RS, Respond** | Act on detected incidents | Incident response, containment, communications, investigation |
| **RC, Recover** | Restore after an incident | Disaster recovery, business continuity, lessons learned, restoration |

**Govern is the change in CSF 2.0.** The original framework had five functions (Identify, Protect, Detect, Respond, Recover). Version 2.0 added **Govern** as a sixth, wrapping around the others to emphasize that cybersecurity is an organizational risk to be managed at leadership level, not just an IT activity.

### CSF profiles and gap analysis

The framework is applied by comparing where you are against where you want to be.

| Profile | Meaning |
|---------|---------|
| **Current profile** | The organization's cybersecurity state today |
| **Target profile** | The desired cybersecurity state |

The distance between them drives the plan:

```text
Current Profile        where we are now
      ↓
Gap Analysis           what is missing between the two
      ↓
Target Profile         where we want to be
      ↓
Roadmap                the prioritized plan to close the gap
```

This is the mechanism that turns a framework from a checklist into a strategy: assess the current state, define the target, and the gap between them becomes the roadmap.

## 3. CIS Controls v8.1

The CIS Controls are a **prioritized** set of safeguards against the most common cyber threats. Where a framework describes outcomes, the CIS Controls give specific, ordered actions. Version 8.1 (released June 2024) reduced the historical 20 controls to **18** and aligned with NIST CSF 2.0, including adding governance safeguards to match CSF's new Govern function.

### Implementation groups

The controls are tiered so organizations adopt them according to their size, resources, and risk.

| Group | Level | For |
|-------|-------|-----|
| **IG1** | Essential cyber hygiene | The foundational safeguards every organization should implement |
| **IG2** | Intermediate maturity | Organizations managing greater operational complexity |
| **IG3** | Advanced security programs | Mature organizations facing sophisticated, targeted threats |

Every organization starts at **IG1**, the baseline defense against common, non-targeted attacks. IG2 and IG3 build on it.

### The 18 controls

| # | Control | # | Control |
|---|---------|---|---------|
| 1 | Inventory and Control of Enterprise Assets | 10 | Malware Defenses |
| 2 | Inventory and Control of Software Assets | 11 | Data Recovery |
| 3 | Data Protection | 12 | Network Infrastructure Management |
| 4 | Secure Configuration | 13 | Network Monitoring and Defense |
| 5 | Account Management | 14 | Security Awareness and Skills Training |
| 6 | Access Control Management | 15 | Service Provider Management |
| 7 | Continuous Vulnerability Management | 16 | Application Software Security |
| 8 | Audit Log Management | 17 | Incident Response Management |
| 9 | Email and Web Browser Protection | 18 | Penetration Testing |

The ordering is deliberate: the first controls (knowing your assets and software) come first because you cannot protect what you have not inventoried. This is the practical, "how to implement" companion to a framework's "what to achieve."

## 4. ISO 27001

ISO 27001 is the international standard for an **Information Security Management System (ISMS)**. It is a management-system standard, meaning it defines how to run security as an ongoing, governed, auditable program, and it is certifiable.

### Core concepts

Risk-based security, continuous improvement, governance, documentation, and auditing. The emphasis is on a managed system rather than a fixed list of controls.

### The PDCA cycle

ISO 27001 runs on the Plan-Do-Check-Act cycle, which builds continuous improvement into the standard.

```text
Plan     establish the ISMS, assess risk, plan controls
 ↓
Do       implement the controls and processes
 ↓
Check    monitor, measure, and audit against the plan
 ↓
Act      correct, improve, and refine, then repeat
```

The loop is the point. Security is never "done"; PDCA institutionalizes the idea that the system is continually assessed and improved, which is why ISO 27001 certification requires ongoing surveillance audits rather than a one-time pass.

## 5. How the Frameworks Fit Together

The three are complementary, not competing. Each answers a different question, and mature programs use them together.

| Framework | Role | Answers |
|-----------|------|---------|
| **NIST CSF** | Risk framework | What to achieve |
| **CIS Controls** | Technical controls | How to implement |
| **ISO 27001** | Management system | How to govern and certify |

The clean way to remember it: **NIST CSF says what to achieve, CIS Controls say how to implement, and ISO 27001 is the management system that governs it all.** CSF v2.0 and CIS v8.1 were deliberately aligned, so mapping between them is now straightforward, and both feed the documented, audited ISMS that ISO 27001 defines.

## 6. Security and Data Roles

Governance depends on clear ownership. Four data-related roles come up repeatedly, and confusing them is a frequent error.

| Role | Responsible for |
|------|-----------------|
| **Data Owner** | Classification, access approval, and business decisions about the data |
| **Data Custodian** | Storage, maintenance, and technical protection of the data |
| **Data Controller** | Determining why and how data is processed |
| **Data Processor** | Processing data on behalf of the controller |

**The key distinctions:** the **owner** makes business decisions and is accountable; the **custodian** implements and maintains the protection technically. Separately, in data protection law, the **controller** decides the purpose and means of processing while the **processor** merely acts on the controller's instructions. Owner versus custodian is about accountability versus implementation; controller versus processor is about who decides versus who executes.

## 7. The RACI Matrix

A RACI matrix assigns responsibility for each activity so nothing falls through the gaps and no decision has two owners.

| Letter | Meaning |
|--------|---------|
| **R** | Responsible: does the work |
| **A** | Accountable: owns the outcome, one per activity |
| **C** | Consulted: gives input before the work |
| **I** | Informed: kept updated on progress |

**Worked example:**

| Activity | Security | IT | CFO |
|----------|----------|-----|-----|
| MFA deployment | A | R | I |
| Budget approval | C | C | A |

The rule that matters: there is **exactly one Accountable per activity**. Responsibility can be shared, but accountability cannot, or ownership becomes ambiguous. In the example, Security owns the MFA outcome while IT does the work; for the budget, the CFO owns the decision while Security and IT are consulted.

## 8. Quantitative Risk Analysis

Quantitative analysis expresses risk in money, which is what makes it possible to justify spending to a board or CFO.

| Term | Meaning |
|------|---------|
| **Asset Value (AV)** | The value of the asset being protected |
| **Exposure Factor (EF)** | The percentage of the asset lost in one event |
| **Single Loss Expectancy (SLE)** | The expected loss from one occurrence |
| **Annual Rate of Occurrence (ARO)** | The expected frequency per year |
| **Annualized Loss Expectancy (ALE)** | The expected loss per year |

**The formulas:**

```text
SLE = AV × EF
ALE = SLE × ARO
```

**Worked example:**
- Asset value 500,000, exposure factor 40 percent.
- SLE = 500,000 × 0.4 = **200,000** per occurrence.
- Expected once every two years, so ARO = 0.5.
- ALE = 200,000 × 0.5 = **100,000** per year.

**Reading ARO:** it is simply frequency per year. 1.0 is once a year, 0.5 is once every two years, 2.0 is twice a year. The ALE, expressed in currency per year, is the number that drives budget decisions, because it can be compared directly against the annual cost of a control.

## 9. Risk Treatment

For every significant risk, one of four responses is chosen. Knowing all four, and that accept is legitimate, is essential.

| Option | Meaning | Examples |
|--------|---------|----------|
| **Mitigate** | Reduce the likelihood or impact with controls | MFA, EDR, network segmentation |
| **Transfer** | Shift some of the loss to a third party | Cyber insurance, outsourcing |
| **Accept** | Acknowledge and retain the residual risk | Accept a low risk cheaper to bear than to fix |
| **Avoid** | Eliminate the activity that creates the risk | Shut down an unnecessary risky service |

**Accept** is a valid, documented decision requiring sign-off from an authorized owner, not neglect. **Transfer** does not remove the operational or reputational impact, only some of the financial loss. Most treatment in practice is mitigation, but the other three are real options a strategy should consider explicitly.

## 10. Risk Appetite vs Tolerance

Two related terms that describe how much risk an organization accepts, at different levels.

| | Risk appetite | Risk tolerance |
|---|---------------|----------------|
| **Definition** | The amount of risk leadership is willing to accept in pursuit of objectives | The acceptable deviation from a specific objective |
| **Level** | Broad and strategic | Specific and measurable |
| **Set by** | Senior leadership and the board | Business and risk owners |

**Appetite** is the organization's overall stance on risk, set at the top. **Tolerance** is the specific, measurable limit around a particular objective. Appetite sets the direction; tolerance sets the number that must not be crossed. A treatment decision flows from these: a risk within tolerance can often be accepted, while one that exceeds it must be treated.

## 11. The Risk Register

The risk register is the master record where every risk is tracked. It is the single source of truth that a strategy is built on.

### Required fields

Risk ID, description, asset, owner, likelihood, impact, SLE, ALE, treatment, and status.

### Worked example

| Risk ID | Risk | ALE | Treatment |
|---------|------|-----|-----------|
| R-001 | Ransomware | 120,000 | Mitigate |
| R-002 | Phishing | 45,000 | Mitigate |

A full register carries far more per row than this summary, but the essentials are the risk, its quantified exposure (ALE), who owns it, and what is being done about it. A risk with no owner never gets treated, which is why the owner field is not optional.

## 12. Cost-Benefit Analysis

Cost-benefit analysis compares the cost of a control against the risk reduction it delivers. It is the argument that turns a security request into a funded decision.

**Worked example:**
- Annual expected loss before the control: ALE = 120,000.
- After deploying MFA, the residual ALE drops to 20,000.
- Risk reduction = 120,000 − 20,000 = **100,000** per year.
- The control costs 25,000 per year.
- Since the risk reduction (100,000) far exceeds the control cost (25,000), **implement the control.**

The logic is simple and it is what a CFO responds to: a control that removes more expected loss than it costs is a sound investment. Expressed this way, "spend 25,000 to avoid 100,000 in expected annual loss" is a business case, not a technical request.

## 13. Control Selection

Controls should be chosen through a repeatable process that ties each one back to a risk and a framework, rather than bought ad hoc.

```text
Identify Risk                start from a real risk in the register
      ↓
Map to Framework             locate the relevant framework control
      ↓
Select Controls              choose specific safeguards
      ↓
Perform Cost-Benefit Analysis   confirm the control is worth the spend
      ↓
Implement                    deploy and then verify
```

### Common risk-to-control mappings

Mapping risks to CIS Controls shows the reasoning behind each recommendation.

| Risk | CIS Controls |
|------|--------------|
| Ransomware | 11 (Data Recovery), 13 (Network Monitoring), 14 (Awareness Training) |
| Phishing | 9 (Email and Web Protection), 14 (Awareness Training) |
| Credential theft | 5 (Account Management), 6 (Access Control) |
| Unpatched systems | 7 (Continuous Vulnerability Management) |
| Weak configuration | 4 (Secure Configuration) |

Mapping to a recognized framework does two things: it justifies the control with authority rather than opinion, and it ensures coverage is systematic rather than reactive.

## 14. The Security Roadmap

A roadmap sequences improvements into phases so the plan is achievable rather than an overwhelming list. A common structure runs across three phases.

### Phase 1: 0 to 30 days (foundational)

Asset inventory, critical patching, MFA deployment, and backup validation. The fast, high-impact basics that reduce the most risk soonest.

### Phase 2: 30 to 90 days (building)

Vulnerability management, logging improvements, security awareness training, and incident response updates. Establishing ongoing processes on top of the foundation.

### Phase 3: 90 to 180 days (maturing)

SIEM deployment, vendor risk management, framework alignment, and broader security maturity improvements. Longer-term, higher-effort capabilities.

The sequencing logic is to do the cheap, high-value work first (inventory, MFA, patching), then build repeatable processes, then invest in the heavier capabilities. Front-loading the basics means risk drops early, before the expensive projects even begin.

## 15. Acceptable Use Policy

An Acceptable Use Policy (AUP) defines how company technology resources may be used. It is a foundational governance document that sets expectations for every user.

**Typical sections:** authorized use, account security, password requirements, device usage, internet usage, a monitoring notice, and violations and enforcement.

The AUP matters because it establishes the rules of the road for users and provides the basis for enforcement when they are broken. The monitoring notice in particular is important, since it sets the expectation that activity may be monitored, which has legal significance.

## 16. Communicating with Executives

A strategy only gets funded if it is expressed in business terms. The same recommendation lands very differently depending on how it is framed.

| Framing | Example |
|---------|---------|
| **Technical** | "Deploy MFA to prevent credential stuffing." |
| **Executive** | "Invest 25,000 to reduce account compromise risk by 70 percent." |

The technical version describes an action. The executive version describes an **investment and its return**, which is what leadership decides on. The difference is not dumbing down; it is translating a control into the cost-and-benefit terms a decision-maker needs.

**What a CFO prioritizes:** cost, return on investment, risk reduction, compliance, and business impact. Framing every recommendation against these is what turns a security ask into an approved budget line.

## 17. The Security Strategy Document

The deliverable of the blueprint is a strategy document, and a strong one answers six questions.

| Question | Provided by |
|----------|-------------|
| What are the highest risks? | The risk register |
| What should be fixed first? | The prioritized roadmap |
| Which controls are required? | Control selection mapped to frameworks |
| What will implementation cost? | Budget and cost-benefit analysis |
| What risk reduction is expected? | Quantitative assessment |
| How will success be measured? | Defined metrics and target profile |

If the document cannot answer all six, it is not complete. Together they form the full argument: what the risks are, the order to address them, the controls needed, the cost, the expected benefit, and how success will be judged. That is what a leadership team needs to approve and fund a security program with confidence.

## 18. Fast Recall

- The blueprint's goal is a **business-aligned, cost-justified strategy,** not a vulnerability list. Architects design fundable solutions.
- **Governance** aligns security with business objectives, regulation, and risk appetite. Policy hierarchy: policy, standard, procedure, guideline.
- **NIST CSF 2.0 has six functions:** Govern, Identify, Protect, Detect, Respond, Recover. Govern is the addition in 2.0.
- **CSF is applied via profiles:** current profile, target profile, and the gap between them becomes the roadmap.
- **CIS Controls v8.1:** 18 prioritized controls, aligned with CSF 2.0. Implementation groups IG1 (essential hygiene) to IG3 (advanced). Everyone starts at IG1.
- **ISO 27001** is the ISMS standard, run on the **Plan-Do-Check-Act** cycle of continuous improvement.
- **How they fit:** NIST CSF = what to achieve, CIS Controls = how to implement, ISO 27001 = how to govern and certify.
- **Data roles:** owner decides and is accountable, custodian implements and maintains. Controller decides purpose, processor acts on instructions.
- **RACI:** Responsible does it, Accountable owns it (exactly one), Consulted gives input, Informed is updated.
- **Quantitative risk:** SLE = AV × EF, and ALE = SLE × ARO. ALE in currency per year drives budget.
- **Four treatments:** mitigate, transfer, accept, avoid. Accept needs sign-off; transfer does not remove impact.
- **Appetite** is the broad strategic stance on risk; **tolerance** is the specific measurable limit.
- **Cost-benefit:** if risk reduction (ALE before minus ALE after) exceeds the control cost, implement it.
- **Control selection:** identify risk, map to framework, select controls, cost-benefit, implement. Map risks to CIS Controls.
- **Roadmap in phases:** foundational basics first (inventory, MFA, patching), then processes, then heavier capabilities.
- **Executive framing:** state controls as investment and return, not technical action. CFOs care about cost, ROI, and risk reduction.
- **A complete strategy document** answers six questions: highest risks, fix-first order, required controls, cost, expected risk reduction, and how success is measured.

## 19. Resources

**Frameworks and standards**
- [NIST Cybersecurity Framework 2.0](https://www.nist.gov/cyberframework)
- [NIST CSF 2.0 official publication](https://csrc.nist.gov/pubs/cswp/29/the-nist-cybersecurity-framework-csf-20/final)
- [CIS Controls v8.1](https://www.cisecurity.org/controls/v8-1)
- [ISO/IEC 27001:2022](https://www.iso.org/standard/27001)

**Risk and governance**
- [NIST SP 800-30, Guide for Conducting Risk Assessments](https://csrc.nist.gov/pubs/sp/800/30/r1/final)
- [NIST SP 800-39, Managing Information Security Risk](https://csrc.nist.gov/pubs/sp/800/39/final)
- [ISO/IEC 31000:2018, Risk Management](https://www.iso.org/standard/65694.html)

**Control mapping**
- [CIS Controls Navigator (mappings to other frameworks)](https://www.cisecurity.org/controls/cis-controls-navigator)
