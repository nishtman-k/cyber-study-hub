# Know Your Enemy

> **Project:** Know Your Enemy — Threat Landscape Analysis
> **Tab:** Defence (first module)
> **Section ID:** `know-your-enemy`
> **Scenario:** MedDefense Health Systems — Junior Security Analyst, Week 2. Use Marcus's threat-intelligence files, external evidence and the Project 0x00 posture assessment to explain who targets hospitals, how they attack, and which MedDefense gaps deserve priority. Deliverable: a board-ready Threat Landscape Report.
> **Why it matters:** A posture assessment describes internal weakness; a threat landscape describes external intent and capability. Defence becomes actionable only when the two are correlated. The goal is not to predict every possible attack. It is to identify the actors, paths and consequences that are both credible and relevant to MedDefense.

---

## Table of Contents

1. [Core Vocabulary](#core-vocabulary)
2. [Threat Actors — Six Categories](#threat-actors-six-categories)
3. [Motivations and Actor Profiling](#motivations-and-actor-profiling)
4. [Ransomware and the RaaS Model](#ransomware-and-the-raas-model)
5. [Insider and Supply-Chain Threats](#insider-and-supply-chain-threats)
6. [Threat Vectors — Complete Taxonomy](#threat-vectors-complete-taxonomy)
7. [Social Engineering](#social-engineering)
8. [Attack-Surface Decomposition](#attack-surface-decomposition)
9. [Tracing the Attack Path](#tracing-the-attack-path)
10. [MITRE ATT&CK](#mitre-attck)
11. [Cyber Kill Chain](#cyber-kill-chain)
12. [STRIDE Threat Modeling](#stride-threat-modeling)
13. [Correlating Threats with Posture Gaps](#correlating-threats-with-posture-gaps)
14. [Threat Scenarios for MedDefense](#threat-scenarios-for-meddefense)
15. [Threat Intelligence Collection and Validation](#threat-intelligence-collection-and-validation)
16. [Writing the Threat Landscape Report](#writing-the-threat-landscape-report)
17. [Framework Quick Map](#framework-quick-map)
18. [Fast Recall](#fast-recall)
19. [Resources](#resources)

---

## 1. Core Vocabulary

| Term | Definition | MedDefense example |
|---|---|---|
| **Threat actor** | Person, group or organization that can cause harm | Ransomware affiliate, malicious insider, nation-state operator |
| **Threat** | Potential cause of an unwanted incident | Credential theft leading to EHR access |
| **Motivation** | The outcome the actor wants | Profit, espionage, disruption, revenge |
| **Capability** | Resources and skills available to the actor | Purchased credentials, custom malware, legitimate employee access |
| **Intent** | What the actor is willing and planning to do | Steal PHI, encrypt systems, disrupt care |
| **Threat vector** | Medium or route used to reach the target | Email, VPN, USB, vendor connection |
| **Attack surface** | All reachable points where an actor could interact with or influence the organization | Internet services, staff, endpoints, suppliers and facilities |
| **Attack path** | Ordered sequence from entry to objective | Phish → stolen session → VPN → AD → EHR → exfiltration |
| **TTPs** | Tactics, techniques and procedures that describe adversary behavior | Valid accounts, remote services, credential dumping |
| **IOC** | Indicator of compromise: observable evidence that may indicate intrusion | Known malicious hash, domain or registry change |
| **IOA** | Indicator of attack: behavior showing malicious intent, often before a known IOC exists | One account enumerating many servers and disabling security tools |
| **Threat intelligence** | Evidence analyzed into context that supports a decision | An HC3 alert mapped to MedDefense's exposed VPN and missing MFA |
| **Attribution** | Assessment of who is responsible for activity | "Consistent with" a group is not proof that the group performed it |

### Information becomes intelligence only when it changes a decision

A list of ransomware groups is information. This is intelligence:

> Ransomware affiliates repeatedly obtain initial access through stolen credentials and exposed remote services. MedDefense has remote access without MFA and an unpatched VPN endpoint. Prioritize MFA and VPN remediation because they interrupt a credible path to clinical disruption.

**Core analytical chain:**
**Actor → motivation → target → vector → technique → MedDefense gap → business consequence → defensive decision**

---

## 2. Threat Actors — Six Categories

Use the academy's six-category model. Categories overlap; classify by observed behavior and operating model, not stereotypes.

| Category | Typical motivation | Resources / sophistication | Behavior | Healthcare relevance |
|---|---|---|---|---|
| **Cybercriminal** | Financial gain | Low to high; tools and access can be bought | Scales repeatable attacks; monetizes quickly | Ransomware, payment fraud, PHI theft and extortion |
| **Nation-state / APT** | Espionage, strategic advantage, pre-positioning or disruption | High; patient, funded and capable of custom operations | Long dwell time, targeted collection and operational security | Research, public-health intelligence, sensitive individuals and critical infrastructure |
| **Hacktivist** | Ideology, visibility or protest | Low to medium; sometimes organized | Public claims, DDoS, leaks and defacement | Hospitals may be targeted because of policy, conflict or affiliation |
| **Insider** | Profit, grievance, coercion, convenience or error | Existing knowledge and authorized access | Uses legitimate accounts, workflows and physical presence | PHI browsing, bulk export, sabotage or accidental disclosure |
| **Competitor / industrial spy** | Commercial advantage | Variable; may use contractors | Targets research, bids, pricing and strategy | Clinical trial, pharmaceutical or acquisition information |
| **Opportunist / script kiddie** | Curiosity, status, challenge or easy profit | Low; relies on public tools and known weaknesses | Scans broadly, exploits defaults and follows tutorials | Exposed devices and unpatched public services become targets by accident |

### Intent, capability and opportunity

A credible threat usually needs all three:

- **Intent:** the actor wants an outcome that MedDefense can provide.
- **Capability:** the actor can execute the required techniques or buy help.
- **Opportunity:** a reachable weakness creates a viable path.

An APT may have capability but little interest in a small billing system. An opportunist may have intent but no route past MFA. A ransomware affiliate has all three when healthcare disruption is monetizable and remote access is weak.

### Do not confuse sophistication with impact

A low-skill actor using leaked credentials can cause catastrophic harm. Rate risk using likelihood and impact, not admiration for the attacker.

---

## 3. Motivations and Actor Profiling

| Motivation | Likely objective | Signals | MedDefense concern |
|---|---|---|---|
| **Financial gain** | Ransom, fraud, resale or extortion | Rapid monetization, payment demand, data-leak pressure | Encryption of clinical systems; sale of PHI |
| **Espionage** | Quiet collection over time | Selective exfiltration, persistence, low-noise activity | Research, executive communications or sensitive patient information |
| **Disruption** | Reduce service availability or public confidence | DDoS, destructive actions, timed operational impact | Delayed care and diversion of patients |
| **Ideology / influence** | Publicity, embarrassment or pressure | Claims, slogans, leaks and visible disruption | Website, patient portal and public-facing services |
| **Grievance / revenge** | Punish the organization or an individual | Abuse near resignation or disciplinary action; targeted damage | Insider deletion, exposure or manipulation |
| **Convenience / negligence** | Complete work faster, not deliberately cause harm | Policy bypass, personal cloud, shared accounts | Accidental disclosure and unmanaged copies of PHI |
| **Recognition / challenge** | Status, learning or proof of skill | Broad scanning, public tools, bragging | Default credentials and exposed legacy devices |

### Profile behavior without overclaiming attribution

Record what evidence supports, then state confidence and alternatives.

- **Observed:** valid VPN login from unusual infrastructure followed by rapid internal discovery.
- **Assessed behavior:** credential-based initial access followed by environment enumeration.
- **Likely objectives:** access brokerage, ransomware preparation or espionage.
- **Confidence:** medium; logs show behavior, not operator identity.
- **Do not write:** "Group X attacked us" unless evidence and a competent authority support that claim.

### A practical actor profile

Actor profile fields:

- Actor category and confidence
- Known or assessed motivations
- Preferred targets and assets
- Resource level and operational tempo
- Initial-access patterns
- Post-compromise behaviors
- Likely objective
- Evidence sources and publication dates
- Relevance to MedDefense
- Intelligence gaps and alternative explanations

---

## 4. Ransomware and the RaaS Model

### Why healthcare attracts ransomware

- Clinical availability is time-critical, increasing extortion pressure.
- EHR, imaging, pharmacy and scheduling dependencies can turn IT downtime into patient-safety impact.
- Sensitive patient data enables double extortion: steal first, encrypt second.
- Legacy and vendor-managed technology can be difficult to patch or monitor.
- Large workforces, third parties and remote access increase the number of possible entry points.

### Ransomware-as-a-Service roles

| Role | Function |
|---|---|
| **RaaS operator** | Develops ransomware, hosts infrastructure, manages leak sites and provides support |
| **Affiliate** | Breaks into victims, moves laterally, steals data and deploys the ransomware |
| **Initial Access Broker** | Obtains and sells working access, such as VPN credentials or a compromised endpoint |
| **Credential / malware ecosystem** | Stealers, phishing services and markets provide credentials, sessions and tooling |
| **Negotiator / launderer** | Supports extortion communication and movement of criminal proceeds |

**Key implication:** Ransomware is an ecosystem, not one attacker doing every step. The affiliate that encrypts MedDefense may have purchased access from someone who never knew the final victim.

### Typical double-extortion path

Phishing or exposed service → valid account → discovery → privilege escalation → lateral movement → backup interference → data staging and exfiltration → encryption → payment pressure

Defenders should aim to break the chain at several points. Preventing initial access is valuable; detecting discovery, unusual remote administration, mass file access and backup tampering provides additional chances.

---

## 5. Insider and Supply-Chain Threats

### Malicious vs. negligent insider

| Type | Intent | Example | Defensive emphasis |
|---|---|---|---|
| **Malicious insider** | Deliberately causes harm or exceeds authorized purpose | Billing clerk exports patient records for resale | Least privilege, separation of duties, logging, DLP, behavioral review and rapid offboarding |
| **Negligent insider** | Causes exposure through mistake, convenience or policy bypass | Clinician uploads a spreadsheet to personal cloud storage | Usable secure workflows, training, technical guardrails and non-punitive reporting |
| **Compromised insider** | Legitimate user whose identity or device is controlled by an external actor | Phished nurse account used to enter the patient portal | MFA, conditional access, endpoint controls and anomaly detection |

**Important:** Authorized access does not equal authorized purpose. A nurse may be allowed to open patient records, but not browse a celebrity's file without a treatment relationship.

### Supply-chain risk

A supplier can introduce exposure through:

- Trusted remote access
- Software updates and dependencies
- Managed service accounts
- Cloud hosting and data processing
- Medical-device maintenance
- Concentration risk: one vendor supporting many critical services

MedDefense cannot patch a supplier's internal network, but it can control the relationship:

- Inventory vendors, services, data and connections.
- Assign a business owner and criticality.
- Require MFA, least privilege and named accounts for remote access.
- Time-bound and monitor vendor sessions.
- Define notification, evidence, recovery and right-to-audit requirements.
- Review fourth parties and software dependencies where material.
- Design an exit and continuity plan.

---

## 6. Threat Vectors — Complete Taxonomy

| Vector class | Examples | Primary question | Useful controls |
|---|---|---|---|
| **Message-based** | Email, SMS, voice, chat and social media | Can an attacker persuade a user or deliver a link? | Email authentication, filtering, awareness, reporting and phishing-resistant MFA |
| **File-based** | Office files, PDFs, archives, installers, scripts and removable media | Can content execute, exploit or mislead? | Sandboxing, macro controls, application allow-listing, EDR and protected view |
| **Network-based** | Exposed VPN, RDP, web application, cloud service, wireless and vulnerable protocol | What is reachable and exploitable? | Patch management, hardening, MFA, segmentation, WAF and exposure monitoring |
| **Physical** | Tailgating, theft, rogue device, USB drop and facility tampering | Can presence bypass logical controls? | Badges, visitor control, locks, port control, encryption and CCTV |
| **Human** | Manipulation, oversharing, weak passwords, error and coercion | Can trust or workload be abused? | Process verification, usable policy, training, least privilege and reporting culture |
| **Supply chain** | Compromised vendor, update, dependency, MSP or trusted connection | What inherited access or failure can MedDefense not directly operate? | Due diligence, contractual controls, isolation, monitoring, SBOM where relevant and contingency planning |

A vector is not necessarily the vulnerability. **Email** is a vector; lack of verification, weak authentication or code execution may be the weakness. Keep the concepts separate.

---

## 7. Social Engineering

| Technique | What it is | Healthcare example | Verification habit |
|---|---|---|---|
| **Phishing** | Deceptive message attempting theft, execution or action | Fake shared clinical document | Use a known route to the service; report the message |
| **Spear phishing** | Phishing tailored to a person or team | Message referencing a real procurement project | Verify context with the sender via another channel |
| **Vishing** | Voice-based deception | "IT support" requests an MFA code | Hang up and call the published help-desk number |
| **Smishing** | SMS or mobile-message phishing | Fake on-call scheduling link | Open scheduling through the managed app |
| **Pretexting** | Invented identity and situation used to build trust | Caller claims to be a physician needing emergency access | Follow emergency-access procedure; do not improvise identity proof |
| **BEC** | Business email compromise used to redirect money or sensitive information | Executive asks Finance to change a vendor bank account | Out-of-band approval for payment and account changes |
| **Impersonation** | Pretending to be a trusted person or organization | Fake vendor technician at reception | Check identity, work order and sponsor |
| **Watering hole** | Compromising a site the target population routinely visits | Regional healthcare association portal | Browser isolation, patching, filtering and endpoint detection |
| **Brand impersonation** | Copying a trusted brand's identity | Fake Microsoft 365 sign-in page | Check the actual domain; use bookmarks or known application launchers |
| **Typosquatting** | Registering a look-alike domain | `meddefnse.example` instead of the real domain | Domain monitoring, filtering and careful verification |

### Red flags are clues, not proof

Urgency, authority, secrecy, fear, unusual payment instructions, unexpected attachments, domain mismatch and MFA-code requests should trigger verification. A legitimate emergency can still be urgent; the correct response is a fast secure process, not blind compliance.

---

## 8. Attack-Surface Decomposition

### External surface — reachable before compromise

- Internet-facing VPN, portals, websites, APIs and mail gateways
- Cloud tenants, storage and identity endpoints
- Public DNS, domains and certificates
- Exposed remote-management services
- Vendor-hosted applications and remote-support paths
- Information leaked through job posts, repositories and documents

### Internal surface — reachable after access or from a trusted location

- Active Directory, identity tiers and privileged groups
- Flat network routes and permissive firewall rules
- Shared accounts, service accounts and stored credentials
- File shares, databases and management interfaces
- Legacy protocols and unsupported systems
- Backups, hypervisors and security-management consoles

### Human surface — reachable through trust and workflow

- Help desk, executives, clinicians, contractors and new starters
- Password reset and emergency-access procedures
- Payment, procurement and data-release approvals
- Social media and public professional information
- Fatigue, urgency, authority gradients and workarounds

### Record more than assets

For each attack-surface element capture:

- Owner and business purpose
- Exposure and trust boundary
- Authentication method
- Data and privilege available
- Dependencies
- Existing preventive and detective controls
- Logging and monitoring coverage
- Known gap and remediation status

---

## 9. Tracing the Attack Path

A useful threat scenario continues beyond initial access.

**Path template:**
**Reconnaissance → initial access → execution → persistence → privilege escalation → discovery → credential access → lateral movement → collection → exfiltration → impact**

Not every incident uses every step or uses them in this order. The sequence is an analytical model, not a law.

### Example: stolen remote-access credential

1. An employee enters credentials into a look-alike page.
2. The actor logs in to remote access. Missing MFA allows entry.
3. The actor enumerates hosts, shares and directory groups.
4. Weak service-account controls expose reusable credentials.
5. A flat network permits movement to a management server.
6. The actor reaches the EHR database and backup console.
7. PHI is staged and exfiltrated.
8. Backups are impaired and systems are encrypted.
9. Clinical operations move to downtime procedures.

### At every step ask

- What must the actor know or possess?
- Which MedDefense weakness enables the step?
- Which log or behavior could reveal it?
- Which control could prevent, detect or contain it?
- What assumption needs evidence?

---

## 10. MITRE ATT&CK

ATT&CK is a knowledge base of observed adversary behavior. It organizes behavior into **tactics** (the actor's goal), **techniques** (how the goal is achieved) and **sub-techniques** (more specific implementations).

| Tactic | Question it answers | MedDefense example |
|---|---|---|
| **Reconnaissance** | What can the actor learn before entry? | Identify staff and remote-access technology |
| **Resource Development** | What infrastructure or capability is prepared? | Register a look-alike domain |
| **Initial Access** | How does the actor enter? | Phishing, valid account or public-facing exploit |
| **Execution** | How is malicious activity run? | Command interpreter or user-executed file |
| **Persistence** | How is access maintained? | Create account or modify remote-access configuration |
| **Privilege Escalation** | How are higher permissions gained? | Exploit or abuse misconfiguration |
| **Defense Evasion** | How is detection avoided? | Disable tools or masquerade as normal administration |
| **Credential Access** | How are accounts or secrets obtained? | Credential dumping or password-store access |
| **Discovery** | How is the environment understood? | Enumerate systems, accounts and shares |
| **Lateral Movement** | How does the actor reach other systems? | Remote services using stolen admin credentials |
| **Collection** | How is target data gathered? | Archive database exports |
| **Command and Control** | How is compromised infrastructure controlled? | Web protocol or remote-access software |
| **Exfiltration** | How does data leave? | Transfer to actor-controlled cloud storage |
| **Impact** | How are operations or information harmed? | Data encrypted for impact |

### ATT&CK mapping rules

- Map behavior to the **most specific technique supported by evidence**.
- Separate observed facts from inferred steps.
- Do not map a vulnerability directly to a tactic without describing the actor behavior.
- ATT&CK does not calculate risk, likelihood or business impact.
- Use mappings to identify detection and control coverage, not to decorate a report.

### Example mapping

| Observed / modeled step | ATT&CK tactic | Possible technique | Relevant gap |
|---|---|---|---|
| Actor logs in with stolen VPN credentials | Initial Access | Valid Accounts | No MFA; weak sign-in monitoring |
| Actor lists domain groups and computers | Discovery | Account / System Network Discovery | Limited identity telemetry |
| Actor uses remote administration between servers | Lateral Movement | Remote Services | Flat network; reused privileged account |
| Actor sends archived PHI to cloud storage | Exfiltration | Exfiltration Over Web Service | No egress monitoring or DLP |
| Actor encrypts shared and local files | Impact | Data Encrypted for Impact | Broad write access; weak recovery isolation |

---

## 11. Cyber Kill Chain

| Phase | Attacker activity | Defensive opportunity |
|---|---|---|
| **Reconnaissance** | Research people, technology and exposure | Reduce public leakage; monitor domains and exposure |
| **Weaponization** | Prepare payload or malicious infrastructure | Threat-intelligence and infrastructure blocking |
| **Delivery** | Transmit link, file or traffic | Email, web and network controls |
| **Exploitation** | Exploit code, trust or credentials | Patching, MFA, hardening and secure process |
| **Installation** | Establish tooling or persistence | EDR, application control and change detection |
| **Command and Control** | Maintain external communication | DNS, proxy, firewall and endpoint analytics |
| **Actions on Objectives** | Steal, alter, encrypt or disrupt | Segmentation, DLP, behavior detection and recovery |

### Kill Chain vs. ATT&CK

- **Kill Chain:** compact story of attack progression; good for explaining sequence.
- **ATT&CK:** detailed vocabulary for behaviors within and across stages; good for technique and detection mapping.
- Use both when useful. Do not force a perfectly linear sequence onto activity that loops, branches or skips stages.

---

## 12. STRIDE Threat Modeling

STRIDE systematically asks what can go wrong at each component, data flow, data store, process, external entity and trust boundary.

| Category | Security property threatened | Question | EHR example |
|---|---|---|---|
| **Spoofing** | Authentication | Can someone pretend to be another identity? | Stolen clinician token accesses the portal |
| **Tampering** | Integrity | Can data or code be changed without authorization? | Allergy record altered in transit or storage |
| **Repudiation** | Accountability / non-repudiation | Can an action be denied because evidence is weak? | Shared admin account prevents attribution |
| **Information Disclosure** | Confidentiality | Can protected information be exposed? | PHI returned to an unauthorized user |
| **Denial of Service** | Availability | Can legitimate use be prevented? | Portal exhaustion or ransomware outage |
| **Elevation of Privilege** | Authorization | Can a user gain capabilities beyond their role? | Standard account becomes database administrator |

### STRIDE workflow

1. **Define scope and assumptions.** Example: patient portal, identity provider, EHR API and database.
2. **Draw the data-flow diagram.** Include external entities, processes, data stores, flows and trust boundaries.
3. **Walk each element and boundary.** Ask all relevant STRIDE questions.
4. **Write threat statements.** Actor, action, asset, weakness and consequence.
5. **Identify controls and evidence.** Existing prevention, detection and recovery.
6. **Rate and prioritize.** Use likelihood, impact and healthcare context.
7. **Validate with owners.** Confirm architecture, clinical workflow and constraints.

### STRIDE threat statement

> An external actor could spoof a clinician session at the portal because stolen credentials are accepted without strong MFA, allowing unauthorized EHR access and potential PHI disclosure.

STRIDE identifies possible threats. It does not prove that a threat is active or calculate priority by itself.

---

## 13. Correlating Threats with Posture Gaps

The useful question is not "What is vulnerable?" or "What is threatening?" It is:

> Which credible actor can use which weakness to reach which critical asset, and what happens to the business?

### Correlation method

1. Start with Critical and High assets from Project 0x00.
2. Import gaps with evidence and stable IDs.
3. Identify relevant actors, motivations and observed sector behaviors.
4. Build plausible attack paths through the gaps.
5. Map the path to ATT&CK and/or the Kill Chain.
6. Score likelihood and impact using stated criteria.
7. Record current controls and detection coverage.
8. Recommend the control that most effectively breaks the path.
9. State evidence, confidence, assumptions and intelligence gaps.

### Threat-to-gap matrix

| Threat scenario | Relevant Project 0x00 gap | Why correlation changes priority | Priority action |
|---|---|---|---|
| Ransomware affiliate uses valid remote credentials | G-01: remote access without MFA | High-frequency criminal path reaches clinical systems | Phishing-resistant MFA; conditional access; session monitoring |
| Actor exploits internet-facing VPN | G-02: unpatched public endpoint | External reachability removes the need to phish a user | Patch or isolate immediately; review logs and exposure |
| Compromised workstation reaches servers | G-03: flat network | One endpoint compromise becomes an enterprise event | Segment clinical, user, server and management zones |
| Insider exports bulk PHI | G-04: broad access and limited audit review | Authorized access can bypass perimeter controls | Role review, bulk-access alerts, DLP and audit ownership |
| Compromised vendor enters through trusted support | G-05: standing third-party account | Supplier access inherits trust that MedDefense does not operate | Named MFA accounts, approval, time limits and session recording |

### Recalibration rules

- **Raise priority** when a gap is externally reachable, actively exploited, connects to a Critical asset, has weak detection, or enables several later steps.
- **Lower priority carefully** when the actor lacks a credible path, the asset has low impact, or strong verified controls materially reduce likelihood.
- **Do not erase a risk** because it is less likely. Record residual risk and assumptions.
- A score supports judgment; it does not replace it.

---

## 14. Threat Scenarios for MedDefense

### Scenario A — Ransomware through remote access

**Actor:** financially motivated ransomware affiliate
**Motivation:** extortion
**Entry:** stolen credentials or VPN exploitation
**Path:** remote access → discovery → credential access → lateral movement → PHI exfiltration → backup interference → encryption
**Relevant gaps:** no MFA, unpatched VPN, reused admin credentials, flat network, weak backup isolation
**Business impact:** loss of EHR and scheduling availability, patient diversion, privacy notification, recovery cost and reputational harm
**Decision:** remediate internet-facing access first; add MFA, segmentation, identity monitoring and recoverability tests
**Confidence:** high that the scenario class is relevant; actor identity remains unknown until evidence exists

### Scenario B — Malicious insider exfiltrates patient records

**Actor:** employee or contractor with legitimate access
**Motivation:** profit or grievance
**Entry:** authorized account and workstation
**Path:** search high-value records → bulk access/export → personal storage or external transfer
**Relevant gaps:** excessive permissions, shared accounts, no bulk-access alert, weak offboarding
**Business impact:** confidentiality breach, regulatory exposure, patient harm and loss of trust
**Decision:** enforce role-based access; monitor unusual browsing and bulk export; test offboarding

### Scenario C — Negligent insider exposes PHI

**Actor:** well-intentioned staff member
**Motivation:** finish urgent work
**Entry:** legitimate workflow
**Path:** export data → use personal email/cloud or wrong recipient → uncontrolled copy
**Relevant gaps:** inconvenient secure sharing, weak data handling controls, limited DLP
**Business impact:** reportable disclosure and uncontrolled data persistence
**Decision:** make secure sharing easier than bypass; apply classification, DLP and rapid reporting procedures

### Scenario D — Compromised vendor connection

**Actor:** external actor using a supplier's identity or tool
**Motivation:** ransomware, espionage or access resale
**Entry:** standing vendor remote account
**Path:** trusted access → management network → credential capture → clinical systems
**Relevant gaps:** shared vendor account, no MFA, permanent access, limited logging and weak segmentation
**Business impact:** broad compromise with delayed attribution and contractual complexity
**Decision:** inventory vendor paths; require named MFA identities, approval windows, least privilege and monitored sessions

### Scenario E — Nation-state collection

**Actor:** state-aligned operator
**Motivation:** strategic health, research or sensitive-person intelligence
**Entry:** tailored phishing, supplier access or public-facing exploit
**Path:** low-noise persistence → privilege escalation → selective collection → covert exfiltration
**Relevant gaps:** weak egress visibility, excessive retention, limited privileged monitoring
**Business impact:** loss of research advantage, privacy harm and long-term persistence
**Decision:** protect the specific high-value dataset; improve privileged, endpoint and egress telemetry

---

## 15. Threat Intelligence Collection and Validation

### Intelligence levels

| Level | Audience | Question answered | Example |
|---|---|---|---|
| **Strategic** | Board and executives | Which threats change business risk and investment? | Ransomware threatens clinical continuity |
| **Operational** | Security leadership and incident response | How do campaigns operate and what should we prepare for? | Affiliates use valid accounts, remote tools and data theft before encryption |
| **Tactical** | Architects, engineers and defenders | Which TTPs should controls detect or prevent? | Valid Accounts, Remote Services, Data Encrypted for Impact |
| **Technical** | SOC and tooling | Which observables can be matched now? | Hashes, domains, IPs and detection rules |

Technical indicators decay quickly. Behavior and control gaps usually remain useful longer.

### Source hierarchy

- **Primary / authoritative:** CISA, HC3, HHS, NIST, ENISA, national CSIRTs and vendor advisories for their products.
- **Structured behavior:** MITRE ATT&CK, with its references and version dates.
- **Sector sharing:** H-ISAC and trusted peer communities.
- **Research:** established security vendors; review methodology, telemetry and commercial incentives.
- **Open sources:** news, blogs, forums and leak claims; corroborate before relying on them.

### Evaluate every source

- **Relevance:** same sector, technology, geography or actor behavior?
- **Recency:** publication date and observation period?
- **Reliability:** history, access to evidence and methodology?
- **Corroboration:** supported independently?
- **Specificity:** actionable detail or generic warning?
- **Bias:** sales motive, political motive, survivorship or reporting bias?
- **Confidence:** what is known, assessed and unknown?

### Intelligence record

Use this compact format:

```text
INTEL-ID: TI-2026-001
Claim: [one testable statement]
Source and date: [publisher, title, publication date, URL]
Evidence: [what supports the claim]
Relevance: [asset, gap and scenario]
Confidence: Low / Medium / High — [reason]
Alternatives: [other plausible explanation]
Decision: [what changes, owner and timeframe]
Review date: [when the claim should be revalidated]
```

### Avoid common analytical failures

- **Confirmation bias:** searching only for evidence that supports the first theory.
- **Availability bias:** overweighting a recent dramatic incident.
- **Mirror imaging:** assuming attackers make decisions as defenders do.
- **Attribution fixation:** spending effort naming a group instead of containing behavior.
- **IOC dependence:** treating absence of known indicators as absence of compromise.
- **False precision:** presenting uncertain likelihood as an exact fact.

---

## 16. Writing the Threat Landscape Report

### Recommended structure

1. **Executive summary** — top threats, why they matter, top decisions and confidence.
2. **Scope and methodology** — systems, dates, sources, assumptions and limitations.
3. **Organizational context** — critical services, data, dependencies and posture gaps.
4. **Threat landscape** — relevant actor categories, motivations and sector patterns.
5. **Attack surface and vectors** — MedDefense-specific entry points and trust paths.
6. **Priority threat scenarios** — actor, path, gap, ATT&CK mapping and business impact.
7. **Threat-to-gap correlation** — why priorities changed from Project 0x00.
8. **Recommendations and roadmap** — owners, timing, expected risk reduction and residual risk.
9. **Intelligence gaps** — what could not be verified and what collection is needed.
10. **Appendices** — source register, ATT&CK mappings, scoring method and diagrams.

### Finding template

```text
Finding ID and title:
Threat actor / category:
Motivation and likely objective:
Target asset / business service:
Initial vector:
Attack path:
ATT&CK tactics / techniques:
Linked posture gaps:
Existing controls and evidence:
Likelihood and rationale:
Impact and business consequence:
Confidence, assumptions and intelligence gaps:
Recommended decision, owner and timeframe:
Residual risk:
Sources and publication dates:
```

### Board translation table

| Do not stop at | Write |
|---|---|
| "Ransomware is a major threat" | "A stolen remote-access credential can reach clinical systems because MFA and segmentation are missing; a successful attack could interrupt EHR availability and patient care." |
| "ATT&CK T1078 observed" | "The actor used a legitimate account, so perimeter malware controls may not stop or identify the session." |
| "The VPN has a CVE" | "The internet gateway has a weakness that can provide entry without an employee clicking anything." |
| "Insider threat is high" | "Staff can export more patient data than their role requires, and no one is alerted when they do." |
| "Third-party risk exists" | "A supplier has permanent remote access to the management network through a shared account; MedDefense cannot reliably identify or contain individual vendor sessions." |

### Communication rules

- Lead with patient, operational, financial, regulatory or reputational consequence.
- Make every scenario specific to a MedDefense asset and gap.
- Distinguish **observed**, **reported**, **assessed** and **assumed**.
- Date the evidence. Threat intelligence has a shelf life.
- State confidence and intelligence gaps without hiding uncertainty.
- Recommend a decision, owner and timeframe — not merely a product.
- Show how the recommendation breaks or detects the attack path.
- Keep technical mappings in the body or appendix; keep jargon out of the executive summary.

---

## 17. Framework Quick Map

| Framework / source | Use it for | Do not misuse it as |
|---|---|---|
| **MITRE ATT&CK Enterprise** | Common language for observed adversary tactics and techniques | A risk score, vulnerability list or proof of attribution |
| **STRIDE** | Systematic design-time threat identification | Sector threat intelligence or likelihood data |
| **Cyber Kill Chain** | Communicating attack sequence and defensive breakpoints | A requirement that every attack be linear |
| **NIST CSF 2.0** | Organizing cybersecurity outcomes across Govern, Identify, Protect, Detect, Respond and Recover | An actor-behavior knowledge base |
| **NIST SP 800-61** | Incident-response planning and handling guidance | A current threat feed |
| **HC3** | Healthcare-sector threat briefs, alerts and analyst notes | A substitute for validating local exposure |
| **HHS HICP / 405(d)** | Healthcare threat context and practical cybersecurity practices | A complete map of MedDefense's architecture |
| **CISA advisories and KEV** | Authoritative alerts and vulnerabilities known to be exploited | Proof that MedDefense is compromised |
| **ENISA Threat Landscape** | Strategic European threat trends and methodology | A technical indicator feed |

---

## 18. Fast Recall

- **Actor = who. Motivation = why. Vector = route. Technique = how. Objective = desired result. Impact = what MedDefense suffers.**
- The six actor categories are **cybercriminal, nation-state/APT, hacktivist, insider, competitor/industrial spy, and opportunist/script kiddie**.
- Profile behavior, capability and objectives before attempting attribution.
- A low-skill actor can produce high impact when credentials and reachability do the work.
- RaaS separates roles: operator, affiliate, access broker and supporting criminal services.
- **Malicious** insiders intend harm; **negligent** insiders create harm through error or unsafe shortcuts; **compromised** insiders are controlled through stolen identity or device access.
- Vector taxonomy: **message, file, network, physical, human and supply chain**.
- Attack surface: **external, internal and human**. Suppliers cross all three.
- Initial access is only the first step. Trace the path through lateral movement to the objective.
- **ATT&CK** maps behavior. **Kill Chain** tells the attack story. **STRIDE** discovers design threats.
- STRIDE = **Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege**.
- ATT&CK mappings do not calculate risk or prove attribution.
- **Threat landscape + posture gap + critical asset = defensible priority.**
- Intelligence must be relevant, dated, corroborated and connected to a decision.
- A board needs consequences, confidence and choices — not a list of scary actor names.

---

## 19. Resources

**Threat actors and healthcare intelligence**
- [CISA Cybersecurity Advisories](https://www.cisa.gov/news-events/cybersecurity-advisories) — browse alert and advisory categories; record publication dates and affected technologies.
- [HHS HC3](https://www.hhs.gov/about/agencies/asa/ocio/hc3/index.html) — read at least two recent healthcare analyst notes and compare their evidence and relevance.
- [ENISA Threat Landscape](https://www.enisa.europa.eu/topics/cyber-threats/threats-and-trends) — read the latest available executive summary and methodology.
- [CISA Healthcare and Public Health Sector](https://www.cisa.gov/topics/critical-infrastructure-security-and-resilience/critical-infrastructure-sectors/healthcare-and-public-health-sector) — sector guidance and alerts.

**Attack vectors and incident handling**
- [NIST SP 800-61](https://csrc.nist.gov/pubs/sp/800/61/r3/final) — use the current NIST incident-response publication; if the academy supplies Rev.2 for Chapter 3, record that it has been superseded and follow the assigned extract.
- [KnowBe4 Social Engineering Red Flags](https://www.knowbe4.com/hubfs/Social-Engineering-Red-Flags.pdf) — practical recognition aid; validate defensive recommendations against authoritative guidance.

**Threat modeling and adversary behavior**
- [Microsoft Threat Modeling and STRIDE](https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats) — STRIDE categories and modeling guidance.
- [MITRE ATT&CK Enterprise Matrix](https://attack.mitre.org/matrices/enterprise/) — browse tactics first, then Initial Access and Lateral Movement techniques; follow technique references.

**Healthcare security practices**
- [HHS 405(d) Health Industry Cybersecurity Practices](https://405d.hhs.gov/) — healthcare threats and practices scaled to the organization.
- [CISA Known Exploited Vulnerabilities Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) — check whether any MedDefense technology gap is known to be exploited; do not treat catalog presence as proof of local compromise.

**Man or Help:** Not applicable. No lab environment is required. Work from the supplied artifacts, cited framework sources and the Project 0x00 Security Posture Assessment.
