# When the Alarm Sounds

"Plans are nothing; planning is everything." - Dwight D. Eisenhower

> **⚠️ AUTHORIZED USE ONLY.** This material is for education, defensive incident response, and authorized organizational planning. It does not replace legal, privacy, regulatory, clinical-safety, emergency-management, or executive advice. Confirm notification duties, evidence-handling requirements, and external communications with authorized counsel and leadership. Never delay urgent patient-safety actions solely to preserve digital evidence.

**Scope:** Building an operational healthcare incident-response capability: governance, team design, roles, severity classification, activation, escalation, on-call procedures, evidence preservation, containment trade-offs, eradication, recovery, healthcare continuity, regulatory coordination, communication templates, playbook design, exercises, validation, metrics, lessons learned, and artifact governance.

## Table of Contents
- [Core Concepts](#core-concepts)
- [Incident Response Capability](#incident-response-capability)
- [Lifecycle and Operating Model](#lifecycle-and-operating-model)
- [Governance and Mandate](#governance-and-mandate)
- [Team Structure](#team-structure)
- [Roles and Decision Authority](#roles-and-decision-authority)
- [RACI Model](#raci-model)
- [Contact and Escalation Tree](#contact-and-escalation-tree)
- [Severity Model](#severity-model)
- [Patient and Operational Impact](#patient-and-operational-impact)
- [Severity Classification Workflow](#severity-classification-workflow)
- [Incident Declaration](#incident-declaration)
- [Activation and War Room](#activation-and-war-room)
- [Incident Record](#incident-record)
- [On-Call Analyst First 15 Minutes](#on-call-analyst-first-15-minutes)
- [Evidence Preservation](#evidence-preservation)
- [Containment Decision Model](#containment-decision-model)
- [Eradication and Recovery](#eradication-and-recovery)
- [Recovery Prioritization](#recovery-prioritization)
- [Clinical Continuity](#clinical-continuity)
- [Playbook Design](#playbook-design)
- [Playbook Template](#playbook-template)
- [Common Incident Playbooks](#common-incident-playbooks)
- [Ransomware Playbook](#ransomware-playbook)
- [Phishing and Account Compromise](#phishing-and-account-compromise)
- [Malware Playbook](#malware-playbook)
- [Data Exposure Playbook](#data-exposure-playbook)
- [Third-Party Incident Playbook](#third-party-incident-playbook)
- [Communication Principles](#communication-principles)
- [Internal Communication Templates](#internal-communication-templates)
- [Executive Communication Template](#executive-communication-template)
- [Legal and Privacy Coordination](#legal-and-privacy-coordination)
- [External Communication Templates](#external-communication-templates)
- [HIPAA-Oriented Evidence Questions](#hipaa-oriented-evidence-questions)
- [Situation Reports](#situation-reports)
- [Handoffs and Shift Changes](#handoffs-and-shift-changes)
- [Recovery Validation](#recovery-validation)
- [Post-Incident Review](#post-incident-review)
- [Exercises and Validation](#exercises-and-validation)
- [Metrics](#metrics)
- [Artifact Package](#artifact-package)
- [Quality Gates](#quality-gates)
- [Professional Judgment](#professional-judgment)
- [Framework and Tool Map](#framework-and-tool-map)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Concepts

| Term | Meaning |
| --- | --- |
| **Event** | Observable occurrence that may require review |
| **Alert** | Notification produced by a control, tool, or person |
| **Incident** | Event or group of events requiring coordinated response |
| **Severity** | Current operational priority based on impact, scope, urgency, and uncertainty |
| **Incident Commander** | Person accountable for coordinating the response and decisions |
| **Workstream** | Focused response function such as technical, legal, clinical, or communications |
| **Containment** | Action that limits spread, access, or impact |
| **Eradication** | Removal of attacker access, malicious artifacts, and root causes |
| **Recovery** | Safe restoration of services and confidence |
| **Playbook** | Executable, role-aware procedure for a defined incident type |

## 2. Incident Response Capability

A capability is more than a written plan. It combines authority, people, process, technology, information, and validation.

| Capability element | Required artifact |
| --- | --- |
| **Mandate** | IR charter and executive approval |
| **Authority** | Decision and escalation matrix |
| **People** | Team roster, alternates, and on-call schedule |
| **Process** | Lifecycle, severity model, and playbooks |
| **Technology** | Case management, communications, evidence storage, and tooling |
| **Information** | Asset inventory, data classification, contacts, and dependencies |
| **Coordination** | Legal, privacy, communications, clinical, HR, vendors, and insurers |
| **Validation** | Tabletop, simulation, technical exercise, and after-action review |
| **Improvement** | Metrics, lessons, owners, deadlines, and retesting |

## 3. Lifecycle and Operating Model

```text
Prepare
  ↓
Detect and analyze
  ↓
Declare and activate
  ↓
Contain
  ↓
Eradicate
  ↓
Recover
  ↓
Review and improve
```

### Lifecycle outputs

| Phase | Output |
| --- | --- |
| **Prepare** | Contacts, tools, access, baselines, playbooks, and exercises |
| **Detect and analyze** | Validated incident, scope, severity, and evidence |
| **Declare and activate** | Incident ID, commander, workstreams, and cadence |
| **Contain** | Approved isolation or restriction actions |
| **Eradicate** | Removed persistence, compromised accounts, and root cause |
| **Recover** | Validated services, monitoring, and business acceptance |
| **Review** | Lessons, actions, owners, deadlines, and retest plan |

## 4. Governance and Mandate

### IR charter fields

| Field | Purpose |
| --- | --- |
| **Mission** | What the capability protects and supports |
| **Constituency** | Sites, business units, workforce, systems, and data |
| **Scope** | Cybersecurity incidents and related coordination |
| **Authority** | Who may declare, contain, communicate, and recover |
| **Services** | Triage, coordination, forensics, recovery, reporting, and improvement |
| **Availability** | Coverage hours and on-call expectations |
| **Escalation** | Executive, clinical, legal, privacy, and external thresholds |
| **Evidence obligations** | Preservation, custody, retention, and access |
| **Review cycle** | Owner, approval date, and next review date |

### Governance principle

Decision authority must be documented before an incident. A tired analyst should not need to negotiate basic authority at 2 AM.

## 5. Team Structure

| Role | Primary responsibility |
| --- | --- |
| **Executive sponsor** | Organizational authority, risk acceptance, and executive support |
| **Incident Commander** | Overall coordination, priorities, decisions, and cadence |
| **SOC or technical lead** | Analysis, scoping, containment, eradication, and detection |
| **Infrastructure lead** | Server, endpoint, identity, backup, and recovery actions |
| **Network lead** | Segmentation, blocking, capture, and network restoration |
| **Clinical operations lead** | Patient-safety and care-continuity decisions |
| **Legal counsel** | Privilege, legal obligations, contracts, and law enforcement coordination |
| **Privacy officer** | PHI risk assessment and notification coordination |
| **Communications lead** | Workforce, media, patient, and public messaging |
| **Business continuity lead** | Downtime procedures and operational restoration |
| **Evidence custodian** | Evidence inventory, custody, integrity, and access |
| **Scribe** | Decision log, timeline, actions, and situation reports |

### Staffing rule

Every critical role needs a named alternate. The same person may hold several roles in lower-severity incidents, but authority and accountability must remain explicit.

## 6. Roles and Decision Authority

| Decision | Recommended authority |
| --- | --- |
| Declare low-severity incident | SOC or on-call lead |
| Declare high or critical incident | Incident Commander or executive delegate |
| Isolate non-clinical endpoint | Technical lead within pre-approved conditions |
| Isolate clinical or life-supporting system | Clinical and technical authority under emergency procedure |
| Disable privileged or service account | Identity lead with Incident Commander approval, unless emergency authority applies |
| Shut down major service | Incident Commander plus business or clinical owner |
| Engage insurer or external IR | Legal or executive authority |
| Notify regulator, patients, or media | Authorized legal, privacy, executive, and communications leadership |
| Return critical system to production | Technical owner plus business or clinical acceptance |

### Authority rule

Specify emergency authority, normal authority, consultation requirements, and retrospective review separately.

## 7. RACI Model

| Activity | Incident Commander | SOC | IT | Clinical | Legal and Privacy | Communications |
| --- | --- | --- | --- | --- | --- | --- |
| Validate incident | A | R | C | I | I | I |
| Assign severity | A | R | C | C | C | I |
| Preserve evidence | A | R | R | I | C | I |
| Contain endpoint | A | R | R | C when clinical | C | I |
| Activate downtime procedure | A | C | C | R | I | I |
| Assess PHI risk | I | C | C | C | A and R | I |
| Approve external message | A | I | I | C | C | R |
| Restore service | A | C | R | R for clinical acceptance | I | I |
| Conduct review | A | R | R | C | C | C |

`R` means Responsible, `A` means Accountable, `C` means Consulted, and `I` means Informed.

## 8. Contact and Escalation Tree

### Contact record

| Field | Purpose |
| --- | --- |
| **role** | Functional role, not only a person's name |
| **primary and alternate** | Resilience |
| **business and emergency contact** | Normal and urgent channels |
| **secure channel** | Out-of-band coordination path |
| **availability** | Coverage hours and rotation |
| **escalation timeout** | Wait before contacting alternate |
| **vendor or authority contact** | External dependency |
| **last verified** | Freshness |

### Escalation sequence

```text
On-call analyst
  ↓
SOC or technical lead
  ↓
Incident Commander
  ↓
Clinical, legal, privacy, IT, and communications workstreams
  ↓
Executive leadership and approved external parties
```

### Contact-tree rule

Test every urgent contact path. A contact list that has not been called is not validated.

## 9. Severity Model

Severity should reflect current impact and urgency, not attacker sophistication or media attention alone.

| Severity | Typical condition | Response expectation |
| --- | --- | --- |
| **SEV-4 Low** | Limited suspicious activity, no material impact, contained scope | Normal queue and documented review |
| **SEV-3 Moderate** | Confirmed incident with limited scope or recoverable operational effect | Coordinated response, same-day updates |
| **SEV-2 High** | Significant compromise, sensitive data risk, multiple assets, or major service degradation | Immediate activation and executive notification |
| **SEV-1 Critical** | Patient-safety risk, widespread outage, active exfiltration, destructive activity, or uncontrolled privileged compromise | Full crisis response and continuous command cadence |

### Severity dimensions

- Patient safety.
- Clinical service availability.
- Data sensitivity and exposure.
- Scope and propagation.
- Privilege and attacker access.
- Operational and financial impact.
- Public or regulatory significance.
- Containment status.
- Evidence uncertainty.

## 10. Patient and Operational Impact

| Impact level | Patient and operational meaning |
| --- | --- |
| **None** | No care or critical operation affected |
| **Minor** | Local delay with effective workaround |
| **Moderate** | Multiple users or services affected, downtime procedure required |
| **Major** | Hospital-wide or multi-site degradation, patient-care delay risk |
| **Critical** | Immediate patient-safety risk or inability to provide essential care safely |

### Healthcare principle

Patient safety may require continued operation of a potentially compromised system while compensating controls and urgent migration are established. The decision must be explicit, owned, time-bounded, and documented.

## 11. Severity Classification Workflow

```text
Validate security incident
  ↓
Assess patient safety and service availability
  ↓
Assess data, identity, scope, and attacker access
  ↓
Assess containment and uncertainty
  ↓
Assign provisional severity
  ↓
Activate required roles and cadence
  ↓
Reassess whenever facts change
```

### Severity record

```json
{
  "incident_id": "INC-2026-0042",
  "severity": "SEV-2",
  "assigned_at_utc": "2026-11-02T02:14:00Z",
  "reason": [
    "confirmed privileged account misuse",
    "two clinical systems affected",
    "PHI exposure under assessment"
  ],
  "approver": "incident_commander",
  "next_review_utc": "2026-11-02T03:00:00Z"
}
```

## 12. Incident Declaration

### Declaration criteria

- Confirmed unauthorized access.
- Malware execution or persistence.
- Material confidentiality, integrity, or availability impact.
- Privileged credential compromise.
- Patient-safety or clinical-continuity concern.
- Sensitive-data exposure requiring coordinated assessment.
- Widespread or rapidly propagating activity.
- Event requiring more than routine SOC triage.

### Declaration output

```text
Incident ID
Declared time
Current severity
Incident Commander
Known impact
Affected systems and sites
Immediate safety concern
Containment status
Communication cadence
Next decision point
```

## 13. Activation and War Room

### Activation checklist

- Create incident record and evidence location.
- Assign Incident Commander and scribe.
- Open secure primary and backup communication channels.
- Confirm participants and alternates.
- Establish current facts, assumptions, and unknowns.
- Set operational objectives.
- Assign technical, clinical, legal, privacy, and communications workstreams.
- Set update cadence and next decision time.
- Begin decision, action, and evidence logs.
- Restrict distribution according to handling needs.

### War-room rule

Use one authoritative incident record. Chat is coordination, not the official case file.

## 14. Incident Record

### Minimum fields

| Field | Purpose |
| --- | --- |
| **incident_id** | Stable identifier |
| **title and status** | Current incident label and state |
| **severity and history** | Current and previous classifications |
| **commander and scribe** | Accountability |
| **declared_at_utc** | Activation time |
| **scope** | Systems, users, sites, vendors, and data |
| **objectives** | Current response priorities |
| **timeline** | Evidence and response events |
| **decisions** | Decision, owner, reason, and time |
| **actions** | Owner, deadline, state, and outcome |
| **evidence** | Artifact IDs and custody |
| **communications** | Audience, approval, send time, and message version |
| **unknowns and risks** | Unresolved issues |
| **next update** | Cadence and checkpoint |

## 15. On-Call Analyst First 15 Minutes

```text
1. Protect life and patient safety.
2. Record the alert and current time in UTC.
3. Preserve the original alert and supporting evidence.
4. Validate that the activity is plausible and in scope.
5. Identify affected user, host, service, site, and data.
6. Check for active spread, privileged access, or destructive activity.
7. Assign provisional severity.
8. Escalate through the contact tree.
9. Take only pre-authorized containment actions.
10. Record every decision and action.
```

### First-update template

```text
Incident ID:
Time detected:
Current severity:
What happened:
Affected systems or users:
Patient or clinical impact:
Data at risk:
Active threat status:
Actions completed:
Decision required:
Next update:
```

## 16. Evidence Preservation

### Evidence priorities

| Evidence | Preservation action |
| --- | --- |
| **Alert and raw events** | Export original records with IDs and timestamps |
| **Volatile memory** | Capture before shutdown when safe and authorized |
| **Active connections** | Record endpoints, sessions, and owning processes |
| **Disk and files** | Hash and acquire using approved method |
| **Identity evidence** | Preserve sign-in, MFA, session, and audit records |
| **Network evidence** | Preserve PCAP, flow, DNS, proxy, and firewall logs |
| **Cloud evidence** | Export audit, consent, mailbox, storage, and token records |
| **Communications** | Preserve approved message versions and decisions |

### Chain-of-custody fields

```text
Evidence ID
Description
Source system
Collector
Acquisition time
Method and tool version
Hash
Original location
Storage location
Access history
Transfers
Handling restrictions
```

## 17. Containment Decision Model

Containment balances safety, evidence, attacker access, service continuity, and reversibility.

| Question | Consideration |
| --- | --- |
| Is there immediate patient-safety risk? | Clinical authority and downtime procedure |
| Is the attacker active? | Speed and scope of containment |
| Is data leaving? | Egress restriction and evidence capture |
| Is the account privileged? | Session revocation and credential reset |
| Will isolation disrupt care? | Segmentation or compensating controls |
| Is volatile evidence needed? | Capture before power-off when feasible |
| Can action be reversed? | Prefer safe reversible controls first |
| Will action alert the attacker? | Coordinate containment sequence |
| Are dependencies understood? | Avoid cascading outages |

### Containment options

- Isolate endpoint through EDR.
- Restrict VLAN or firewall path.
- Block confirmed infrastructure.
- Revoke tokens and sessions.
- Disable or rotate accounts.
- Stop a malicious process or service.
- Disable a scheduled task.
- Remove public exposure.
- Place systems in read-only or degraded mode.
- Activate clinical downtime procedures.

### Decision record

```json
{
  "decision_id": "DEC-017",
  "time_utc": "2026-11-02T02:32:00Z",
  "decision": "Segment affected clinical workstation instead of powering it off",
  "reason": "Preserve volatile evidence while preventing lateral movement",
  "patient_safety_consideration": "Workstation replaced with clean spare",
  "approver": "incident_commander",
  "review_at_utc": "2026-11-02T03:00:00Z"
}
```

## 18. Eradication and Recovery

### Eradication checklist

- Remove malicious files, tasks, services, rules, applications, and accounts.
- Close exploited vulnerabilities and exposed services.
- Rotate compromised credentials, secrets, keys, and tokens.
- Revoke sessions and refresh trust relationships.
- Rebuild systems when integrity cannot be established.
- Hunt for the same behavior across the environment.
- Validate backups before restoration.
- Update detections before restoring normal connectivity.
- Preserve required evidence before cleanup.

### Recovery checklist

- Define recovery objectives and sequence.
- Verify clean build or restoration source.
- Validate identity, configuration, logging, and security controls.
- Restore connectivity in stages.
- Perform functional and clinical acceptance testing.
- Increase monitoring for recurrence.
- Confirm backup and rollback options.
- Document residual risk and acceptance.
- Obtain technical and business approval.

## 19. Recovery Prioritization

| Priority factor | Question |
| --- | --- |
| **Patient safety** | Which service is necessary for safe care? |
| **Clinical dependency** | Which downstream services depend on it? |
| **Data integrity** | Can records be trusted? |
| **Identity dependency** | Does recovery require directory or privileged services? |
| **Network dependency** | Is segmentation available during restoration? |
| **Recovery readiness** | Is a validated backup or clean build available? |
| **Monitoring readiness** | Can recurrence be detected? |
| **Business acceptance** | Who accepts return-to-service risk? |

### Recovery rule

Do not restore the fastest system first. Restore the safest critical dependency in the correct order.

## 20. Clinical Continuity

### Clinical response questions

- Which care functions are affected?
- Are downtime procedures active and usable?
- Are medication, laboratory, imaging, and patient-identification workflows safe?
- Can a clean alternate device or site support operations?
- Could inaccurate data create patient harm?
- Who has authority to suspend or restore the workflow?
- How will delayed data be reconciled after restoration?
- Which actions require clinical verification?

### Continuity principle

Cyber containment and clinical continuity are joint decisions when patient care could be affected.

## 21. Playbook Design

A playbook should be executable under pressure.

### Design requirements

- Starts with activation criteria.
- Uses numbered actions and command verbs.
- Identifies role ownership.
- Defines stop, escalate, and approval points.
- Lists required evidence.
- Includes containment alternatives.
- Protects patient safety and business continuity.
- Includes communication triggers.
- Defines recovery and closure criteria.
- Includes validation tests.
- Fits the available tools and staffing.
- Records version, owner, and last exercise date.

### Writing rule

Write for the person performing the action, not for the person studying incident response.

## 22. Playbook Template

```text
Playbook ID and title
Purpose and scope
Activation criteria
Severity guidance
Required roles
Required access and tools
Safety and continuity warnings
Initial actions
Evidence to preserve
Analysis steps
Containment options and approvals
Eradication steps
Recovery steps and acceptance
Communication triggers
Legal and privacy checkpoints
Escalation conditions
Closure criteria
Artifacts to produce
Validation scenario
Owner, version, approval, and review date
```

### Step format

```text
STEP 04: Revoke active identity sessions
Owner: Identity Lead
Approval: Incident Commander for SEV-2 and SEV-1
Input: Confirmed affected account
Action: Revoke sessions and record completion time
Evidence: Identity-provider audit record
Stop condition: Account identity is uncertain
Escalate if: Privileged or break-glass account is involved
Output: Session-revocation evidence and decision-log entry
```

## 23. Common Incident Playbooks

Recommended baseline playbooks:

- Phishing and credential compromise.
- Malware on endpoint.
- Ransomware or destructive activity.
- Privileged account compromise.
- Data exposure or suspected breach.
- Cloud account or mailbox compromise.
- Lost or stolen device.
- Third-party or supply-chain incident.
- Denial of service.
- Insider threat.
- Medical or clinical device incident.
- Vulnerability exploitation.

## 24. Ransomware Playbook

### Immediate priorities

1. Protect patient safety and activate downtime procedures where needed.
2. Identify active encryption and propagation.
3. Isolate affected hosts and network paths under approved authority.
4. Protect identity systems, backups, hypervisors, and management infrastructure.
5. Preserve ransom note, process, memory, logs, and encrypted-file samples.
6. Disable compromised accounts and revoke sessions.
7. Determine affected sites, systems, and services.
8. Engage legal, privacy, insurer, executive, and external IR contacts.
9. Validate backup integrity before restoration.
10. Rebuild or restore in dependency order with heightened monitoring.

### Do not

- Delete the ransom note.
- Connect backups before scoping compromise.
- Assume encryption is the only impact.
- Communicate externally without approval.
- Restore before identity and persistence are addressed.

## 25. Phishing and Account Compromise

### Immediate actions

- Preserve the original email and headers.
- Identify recipients, delivery time, links, and attachments.
- Search for related messages.
- Determine clicks, downloads, and credential submission.
- Review sign-ins, MFA, sessions, mailbox rules, and OAuth grants.
- Revoke sessions and reset credentials through approved procedure.
- Remove malicious messages from mailboxes.
- Block confirmed indicators where safe.
- Scope endpoint and data access.
- Notify privacy or legal when sensitive data may be affected.

## 26. Malware Playbook

### Immediate actions

- Preserve alert, file, hash, process tree, command line, and network evidence.
- Isolate under approved authority.
- Determine execution, persistence, privilege, and spread.
- Acquire memory or disk evidence when required.
- Search hashes, paths, domains, services, tasks, and behaviors across the environment.
- Remove or rebuild according to integrity confidence.
- Rotate credentials exposed on the system.
- Validate clean state and monitoring before release.

## 27. Data Exposure Playbook

### Immediate actions

- Identify system, data type, users, and access path.
- Preserve application, database, identity, endpoint, and network evidence.
- Stop unauthorized access without destroying evidence.
- Determine access, acquisition, staging, transfer, and destination separately.
- Record encryption state and key exposure.
- Estimate affected individuals and records.
- Engage privacy and legal immediately.
- Preserve mitigation evidence.
- Maintain approved message and notification timelines.

### Exposure states

```text
Possible access
Confirmed access or viewing
Confirmed local staging
Probable external transfer
Confirmed external transfer
Prevented transfer
Unknown due to evidence gap
```

## 28. Third-Party Incident Playbook

### Questions

- Which services, systems, data, and sites depend on the vendor?
- What did the vendor confirm, and what remains an assessment?
- What contractual notification and evidence requirements apply?
- Are vendor accounts, integrations, tokens, or network paths active?
- Can access be suspended safely?
- Is independent internal evidence available?
- What continuity alternative exists?
- Who approves public and patient communication?

### Third-party rule

Do not rely solely on vendor reassurance. Validate local access, indicators, account use, and data flows.

## 29. Communication Principles

- Use one approved source of truth.
- Separate facts, assessments, decisions, and unknowns.
- Mark sensitivity and audience.
- Use UTC timestamps.
- Avoid speculation and attribution without approval.
- State patient and operational impact clearly.
- State what recipients must do.
- Use version numbers for formal messages.
- Record approvers and send times.
- Never include unnecessary PHI in broad communications.

## 30. Internal Communication Templates

### SOC escalation

```text
Subject: [SEV-x] Incident escalation - [Incident ID]

Detected at:
Current status:
Affected users, assets, and sites:
Patient or clinical impact:
Data at risk:
Evidence summary:
Actions completed:
Actions in progress:
Decision required:
Incident Commander:
Next update:
Handling restriction:
```

### Workforce advisory

```text
Subject: Required action regarding [service or security issue]

What is happening:
Who is affected:
What employees must do now:
What employees must not do:
Approved workaround:
Where to report issues:
Next update time:
```

## 31. Executive Communication Template

```text
Incident ID and severity:
Bottom line:
Patient and operational impact:
Data and privacy impact:
Current scope:
Containment status:
Critical decisions made:
Decisions needed from leadership:
Regulatory and contractual review status:
Recovery estimate and dependencies:
Top risks and unknowns:
Next update:
```

### Executive rule

Lead with impact and decisions. Place technical details in an appendix or supporting situation report.

## 32. Legal and Privacy Coordination

### Early engagement triggers

- Suspected exposure of PHI or other regulated data.
- Law-enforcement involvement.
- Cyber-insurance notice requirement.
- Third-party or contractual notification.
- Potential litigation or privilege consideration.
- Patient, media, regulator, or public communication.
- Cross-border data or operations.
- Insider or workforce investigation.

### Coordination principle

Technical teams establish evidence. Authorized legal and privacy personnel interpret obligations and approve notifications.

## 33. External Communication Templates

### Vendor evidence request

```text
Incident reference:
Relevant service and time range:
Requested logs and artifacts:
Required timestamp and timezone format:
Requested preservation action:
Secure transfer method:
Handling restrictions:
Response deadline:
Technical and legal contacts:
```

### Initial regulator or authority holding statement

```text
Organization and incident reference:
Date of discovery:
Nature of the incident currently known:
Systems and data under assessment:
Containment and mitigation completed:
Current evidence limitations:
Point of contact:
Planned supplemental update:
```

### Media holding statement

```text
We are investigating a cybersecurity incident affecting [approved scope].
We activated our incident response procedures and are working to maintain safe operations.
The investigation is ongoing, and we will provide verified updates through approved channels.
```

## 34. HIPAA-Oriented Evidence Questions

**Legal caution:** The following supports evidence collection. It does not determine whether notification is legally required.

| Risk factor | Evidence question |
| --- | --- |
| **Nature and extent of PHI** | What fields, identifiers, sensitivity, and record counts were involved? |
| **Unauthorized person** | Who accessed or received the data, and what is known about that party? |
| **Actually acquired or viewed** | What evidence shows viewing, query, download, staging, or transfer? |
| **Mitigation** | What actions reduced risk, and how is completion proven? |

### Preserve

- Data classification and record counts.
- Access, query, export, staging, and transfer evidence.
- Encryption and key state.
- Identities and destinations.
- Isolation, revocation, deletion, and recovery evidence.
- Decision and notification timelines.
- Privacy and legal assessments.

## 35. Situation Reports

### SITREP structure

```text
SITREP number and time:
Incident ID and severity:
Operational objectives:
Changes since last update:
Patient and service impact:
Technical scope:
Data and privacy status:
Containment and eradication status:
Recovery status:
Decisions made:
Decisions required:
Risks and unknowns:
Actions and owners:
Next update:
```

### Cadence guidance

| Severity | Typical cadence |
| --- | --- |
| **SEV-1** | Continuous command with formal updates every 30 to 60 minutes |
| **SEV-2** | Formal updates every 1 to 2 hours |
| **SEV-3** | Updates at defined milestones or several times daily |
| **SEV-4** | Case notes and normal queue cadence |

Cadence should change with operational needs. Document the chosen schedule.

## 36. Handoffs and Shift Changes

### Handoff fields

- Current severity and reason.
- Incident Commander and active workstream leads.
- Current objectives.
- Confirmed facts and material unknowns.
- Patient and operational impact.
- Scope and containment status.
- Evidence preserved and pending.
- Actions completed and open.
- Decisions pending.
- Communication cadence.
- Next milestone and update time.

### Handoff rule

The incoming analyst should continue from the record without requiring an oral reconstruction.

## 37. Recovery Validation

### Technical validation

- Known indicators absent.
- Persistence removed.
- Accounts, sessions, secrets, and keys secured.
- Vulnerability or root cause corrected.
- Logging and endpoint controls operational.
- Network segmentation and blocks active.
- Backup or image integrity validated.
- Heightened monitoring produces expected events.

### Business and clinical validation

- Critical workflows function safely.
- Data is accurate and reconciled.
- Downtime records are integrated.
- Performance and dependencies are acceptable.
- Owners accept residual risk.
- Rollback remains available.

### Exit criteria

Recovery requires evidence of safe service, not only system availability.

## 38. Post-Incident Review

### Review questions

- What happened and why?
- What went well?
- What slowed the response?
- Which decisions lacked authority or information?
- Which evidence was missing?
- Which containment action created operational risk?
- Which communication was late, unclear, or inconsistent?
- Did playbooks match actual tools and staffing?
- Which controls failed or were bypassed?
- Which changes require testing?

### Improvement record

```json
{
  "action_id": "PIR-024",
  "lesson": "No tested after-hours path existed to obtain clinical approval for isolation.",
  "action": "Create and exercise clinical isolation authority tree",
  "owner": "clinical_operations",
  "priority": "high",
  "due_date": "2026-12-15",
  "validation": "Tabletop and live contact-tree test"
}
```

## 39. Exercises and Validation

| Exercise | Purpose |
| --- | --- |
| **Document review** | Check completeness, ownership, and currency |
| **Contact-tree test** | Validate reachability and escalation timing |
| **Tabletop exercise** | Test decisions and cross-functional coordination |
| **Functional exercise** | Execute playbook actions in controlled systems |
| **Technical simulation** | Validate telemetry, containment, and recovery |
| **Full-scale exercise** | Test people, process, technology, and continuity together |

### Exercise injects

- Primary Incident Commander unavailable.
- Clinical device cannot be immediately isolated.
- Backup is available but integrity is uncertain.
- Media inquiry arrives before facts are complete.
- Vendor delays evidence delivery.
- PHI staging is confirmed but transfer is unknown.
- Secure chat service is unavailable.
- Recovery introduces a new alert.

### Validation rule

A playbook is not approved because it reads well. It is approved after representative users execute it and deficiencies are corrected.

## 40. Metrics

| Metric | Purpose |
| --- | --- |
| **Time to acknowledge** | On-call responsiveness |
| **Time to declare** | Decision speed |
| **Time to assign commander** | Command readiness |
| **Time to contain** | Threat-limitation speed |
| **Time to clinical workaround** | Care-continuity performance |
| **Time to preserve key evidence** | Forensic readiness |
| **Time to recover** | Restoration performance |
| **Contact success rate** | Escalation readiness |
| **Playbook step completion rate** | Operational usability |
| **Decision logging completeness** | Auditability |
| **Exercise finding closure rate** | Improvement discipline |
| **Recurrence rate** | Eradication and control effectiveness |

### Metric caution

Speed metrics must not reward unsafe action. Pair time measures with quality, patient safety, evidence, and recurrence measures.

## 41. Artifact Package

```text
when_the_alarm_sounds/
├── README.md
├── governance/
│   ├── ir-charter.md
│   ├── scope-and-mandate.md
│   └── decision-authority.json
├── team/
│   ├── role-descriptions.md
│   ├── raci-matrix.md
│   ├── contact-tree.json
│   └── on-call-procedure.md
├── severity/
│   ├── severity-model.md
│   └── classification-form.json
├── operations/
│   ├── activation-checklist.md
│   ├── first-15-minutes.md
│   ├── evidence-custody-form.md
│   ├── decision-log.jsonl
│   ├── action-log.jsonl
│   └── handoff-template.md
├── playbooks/
│   ├── phishing-account-compromise.md
│   ├── malware.md
│   ├── ransomware.md
│   ├── data-exposure.md
│   ├── third-party-incident.md
│   └── clinical-device-incident.md
├── communications/
│   ├── soc-escalation.md
│   ├── executive-update.md
│   ├── workforce-advisory.md
│   ├── vendor-request.md
│   ├── regulator-holding-statement.md
│   └── media-holding-statement.md
├── recovery/
│   ├── recovery-priorities.md
│   ├── validation-checklist.md
│   └── acceptance-form.md
├── exercises/
│   ├── tabletop-scenario.md
│   ├── participant-guide.md
│   └── after-action-template.md
├── metrics/
│   └── metrics-catalog.json
├── MANIFEST.json
└── SHA256SUMS
```

## 42. Quality Gates

| Gate | Pass condition |
| --- | --- |
| **Mandate** | Executive-approved scope and authority exist |
| **Team** | Primary and alternate roles are assigned |
| **Contact tree** | Urgent paths have been tested |
| **Severity** | Patient, operational, data, scope, and uncertainty criteria exist |
| **Authority** | Isolation, shutdown, account, communication, and recovery decisions are assigned |
| **Activation** | First-15-minute procedure is executable |
| **Evidence** | Custody, hashing, storage, and retention are defined |
| **Containment** | Clinical continuity and evidence trade-offs are explicit |
| **Playbooks** | Steps have owners, approvals, outputs, and stop conditions |
| **Communications** | Audience-specific approved templates exist |
| **Regulatory coordination** | Legal and privacy checkpoints are documented |
| **Recovery** | Technical and clinical acceptance criteria exist |
| **Exercises** | Representative users have executed the design |
| **Improvement** | Findings have owners, deadlines, and validation |
| **Governance** | Version, owner, approver, and next review are recorded |

## 43. Professional Judgment

- Patient safety takes priority, but safety does not eliminate the need to document decisions.
- Severity is provisional and should change as facts change.
- Containment that causes a clinical outage can be harmful.
- Delayed containment can allow spread or exfiltration.
- Evidence preservation is important, but it is not absolute when life or safety is at risk.
- A ticket or vendor statement is context, not proof.
- External communication must use verified facts and authorized approval.
- Technical teams should not make legal notification determinations alone.
- Recovery means trustworthy service, not merely reachable service.
- A plan that has not been exercised is an assumption.
- Every critical action needs an owner, deadline, output, and completion evidence.
- Procedures should be short enough to use under pressure and detailed enough to prevent improvisation.

## 44. Framework and Tool Map

| Item | Purpose |
| --- | --- |
| **NIST SP 800-61 Rev. 3** | Integrate incident response with cybersecurity risk management and CSF 2.0 |
| **NIST SP 800-184** | Plan, test, execute, and improve cybersecurity recovery |
| **CISA IR Playbook** | Standardized incident-response procedures and checklists |
| **FIRST CSIRT Services Framework** | Define a CSIRT mandate and service portfolio |
| **HHS HIPAA Breach Notification Rule** | Regulatory context for unsecured PHI breach assessment and notification |
| **HICP** | Healthcare cybersecurity practices and sector context |
| **ISO/IEC 27035** | Incident-management principles and process structure |
| **Case management** | Authoritative incident, decision, action, and evidence record |
| **Out-of-band communications** | Coordination when normal systems are unavailable or untrusted |
| **Asset and dependency inventory** | Severity, continuity, containment, and recovery decisions |

## 45. Fast Recall

- **IR capability is authority, people, process, technology, information, coordination, and validation.**
- **Define authority before the incident.**
- **Every critical role needs an alternate.**
- **Severity reflects patient safety, operational impact, data, scope, privilege, containment, and uncertainty.**
- **Reassess severity when facts change.**
- **Create one incident ID and one authoritative record.**
- **The first 15 minutes prioritize safety, evidence, validation, scope, severity, escalation, and documentation.**
- **Chat is not the official incident record.**
- **Preserve volatile evidence before shutdown when safe and authorized.**
- **Containment balances attacker access, evidence, continuity, dependencies, and reversibility.**
- **Clinical and technical leaders jointly decide when care may be affected.**
- **Recovery requires validated integrity, functionality, monitoring, and business acceptance.**
- **Write playbooks as commands with owners, approvals, stop conditions, and outputs.**
- **Separate facts, assessments, decisions, and unknowns in communications.**
- **Do not broadly distribute unnecessary PHI.**
- **Legal and privacy teams make regulatory determinations using technical evidence.**
- **Situation reports need a fixed cadence and a next decision point.**
- **Handoffs must stand alone.**
- **Metrics must measure both speed and quality.**
- **Standardize before scaling.**
- **Validate the design by running it.**

## 46. Resources

**Incident response and recovery**
- [NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final)
- [NIST SP 800-184](https://csrc.nist.gov/pubs/sp/800/184/final)
- [CISA Federal Cybersecurity Incident and Vulnerability Response Playbooks](https://www.cisa.gov/resources-tools/resources/federal-government-cybersecurity-incident-and-vulnerability-response-playbooks)

**Team and service design**
- [FIRST CSIRT Services Framework Version 2.1](https://www.first.org/standards/frameworks/csirts/csirt_services_framework_v2-1)

**Healthcare regulatory context**
- [HHS HIPAA Breach Notification Rule](https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html)
- [45 CFR Part 164 Subpart D](https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-D)
