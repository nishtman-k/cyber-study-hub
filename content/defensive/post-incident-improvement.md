# Post-Incident & Detection

"Learning is not compulsory... neither is survival." - W. Edwards Deming

> **⚠️ AUTHORIZED USE ONLY.** This material is for education, defensive post-incident improvement, detection engineering, threat intelligence, and authorized hardening. Test detections and configuration changes in controlled environments before production deployment. Follow change-management, privacy, legal, clinical-safety, and operational-approval requirements. Do not send sensitive indicators or incident data to public services without authorization.

**Scope:** Closing the incident-response loop with deployable artifacts: post-incident review, control-effectiveness audits, root-cause and contributing-factor analysis, Sigma rule development, positive and negative testing, false-positive measurement, rule tuning and deployment, IOC and TTP enrichment, forward-looking intelligence, hardening specifications, risk-register updates, playbook changes, implementation ownership, deadlines, acceptance criteria, and validation.

## Table of Contents
- [Core Concepts](#core-concepts)
- [Post-Incident Improvement Loop](#post-incident-improvement-loop)
- [Review Principles](#review-principles)
- [Evidence Inputs](#evidence-inputs)
- [Post-Incident Review Questions](#post-incident-review-questions)
- [Incident Timeline Review](#incident-timeline-review)
- [Control Effectiveness Audit](#control-effectiveness-audit)
- [Control States](#control-states)
- [Expected Versus Actual Behavior](#expected-versus-actual-behavior)
- [Root Cause and Contributing Factors](#root-cause-and-contributing-factors)
- [Detection Gap Analysis](#detection-gap-analysis)
- [Telemetry Gap Analysis](#telemetry-gap-analysis)
- [Detection Engineering Lifecycle](#detection-engineering-lifecycle)
- [Sigma Rule Anatomy](#sigma-rule-anatomy)
- [Sigma Rule Development](#sigma-rule-development)
- [MSBuild Detection](#msbuild-detection)
- [Pass-the-Ticket Detection](#pass-the-ticket-detection)
- [Correlation Detection](#correlation-detection)
- [Rule Testing](#rule-testing)
- [Positive and Negative Samples](#positive-and-negative-samples)
- [Detection Metrics](#detection-metrics)
- [False Positive Analysis](#false-positive-analysis)
- [Rule Tuning](#rule-tuning)
- [Deployment and Monitoring](#deployment-and-monitoring)
- [Threat Intelligence Enrichment](#threat-intelligence-enrichment)
- [IOC Enrichment](#ioc-enrichment)
- [TTP Enrichment](#ttp-enrichment)
- [Actor Mapping](#actor-mapping)
- [Forward-Looking Intelligence](#forward-looking-intelligence)
- [Hardening from Findings](#hardening-from-findings)
- [Attack Surface Reduction](#attack-surface-reduction)
- [Windows Baseline Hardening](#windows-baseline-hardening)
- [Identity and Kerberos Hardening](#identity-and-kerberos-hardening)
- [Logging and Visibility Improvements](#logging-and-visibility-improvements)
- [Risk Register Update](#risk-register-update)
- [Playbook Update](#playbook-update)
- [Implementation Backlog](#implementation-backlog)
- [Owner, Deadline, and Validation](#owner-deadline-and-validation)
- [Acceptance Criteria](#acceptance-criteria)
- [Retesting and Closure](#retesting-and-closure)
- [Executive Reporting](#executive-reporting)
- [Implementation Package](#implementation-package)
- [Quality Gates](#quality-gates)
- [Professional Judgment](#professional-judgment)
- [Framework and Tool Map](#framework-and-tool-map)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Concepts

| Term | Meaning |
| --- | --- |
| **Post-incident review** | Evidence-based review of what happened, what worked, what failed, and what changes |
| **Control effectiveness** | Whether a control worked as intended under real incident conditions |
| **Control gap** | Missing, misconfigured, bypassed, unmonitored, or operationally ineffective control |
| **Detection engineering** | Lifecycle for designing, testing, deploying, measuring, and maintaining detections |
| **Positive sample** | Data that should trigger the detection |
| **Negative sample** | Clean or expected data that should not trigger the detection |
| **False positive** | Benign activity incorrectly detected as malicious |
| **False negative** | Malicious activity missed by the detection |
| **Hardening specification** | Executable configuration change with scope, owner, test, rollback, and validation |
| **Corrective action** | Specific change tied to a finding, owner, deadline, and success measure |

### The core idea

```text
Incident evidence
  ↓
Control audit and root-cause analysis
  ↓
Detection, intelligence, hardening, risk, and playbook changes
  ↓
Testing and controlled deployment
  ↓
Validation against acceptance criteria
  ↓
Closure or further tuning
```

## 2. Post-Incident Improvement Loop

| Phase | Question | Deliverable |
| --- | --- | --- |
| **Review** | What actually happened? | Evidence-backed timeline |
| **Compare** | What should each control have done? | Control-effectiveness matrix |
| **Explain** | Why did the incident progress? | Root-cause and contributing-factor analysis |
| **Design** | Which changes address the observed failure modes? | Detection, hardening, and playbook specifications |
| **Test** | Do the changes work on malicious and clean data? | Validation results |
| **Deploy** | Can the changes be introduced safely? | Change and rollout plan |
| **Measure** | Did risk and detection quality improve? | Metrics and acceptance evidence |
| **Close** | Are all actions complete and validated? | PIR closure record |

## 3. Review Principles

- Use evidence rather than memory or blame.
- Separate detection failure from response failure.
- Review technology, process, people, authority, and dependencies.
- Preserve what worked as well as what failed.
- Distinguish root causes, contributing factors, and symptoms.
- Tie every recommendation to one or more findings.
- Prefer deployable artifacts over broad advice.
- Assign one accountable owner per action.
- Define a deadline and validation method before approval.
- Retest after deployment.

### Blameless does not mean vague

A blameless review avoids personal accusation while remaining precise about decisions, conditions, controls, and responsibilities.

## 4. Evidence Inputs

| Input | Purpose |
| --- | --- |
| **Forensic report** | Confirmed attack sequence and affected scope |
| **Authoritative timeline** | Compare attacker actions with detection and response times |
| **Alert history** | Determine what fired and when |
| **Detection catalog** | Identify expected analytics and coverage |
| **Control configuration** | Verify actual deployed state |
| **Telemetry coverage** | Determine whether required evidence existed |
| **Decision and action logs** | Review response execution and authority |
| **Handoff and communications** | Review coordination quality |
| **Asset and risk registers** | Connect incident to business risk |
| **Threat intelligence** | Compare observed behavior with related campaigns and likely next actions |

## 5. Post-Incident Review Questions

### Detection

- Which incident events should have produced alerts?
- Which alerts fired, did not fire, or fired too late?
- Was required telemetry collected and normalized?
- Did thresholds, filters, or exclusions suppress the behavior?
- Did analysts understand and prioritize the alert?

### Response

- Was severity assigned correctly?
- Was evidence preserved before containment?
- Did containment reduce the intended risk?
- Was scope reassessed when new evidence appeared?
- Were eradication and recovery verified?
- Could another analyst use the handoff without clarification?

### Prevention and resilience

- Which configuration allowed execution or credential abuse?
- Were application control and privilege boundaries appropriate?
- Were service accounts and Kerberos exposure reduced?
- Did segmentation limit movement?
- Were backups, logging, and clinical continuity adequate?

## 6. Incident Timeline Review

Overlay four timelines:

```text
Attacker activity
Detection activity
Response activity
Business and clinical impact
```

### Timeline comparison fields

| Field | Purpose |
| --- | --- |
| **attack_event** | Confirmed adversary action |
| **expected_control** | Control that should prevent, detect, or limit it |
| **actual_control_result** | Fired, blocked, logged only, missed, or unknown |
| **detection_delay** | Time from event to alert |
| **response_delay** | Time from alert to action |
| **impact_at_time** | Scope and operational consequence |
| **gap_reason** | Missing data, logic, configuration, triage, or authority |

### Timeline metric examples

```text
time_to_detect = first_valid_alert - first_supported_attack_event
time_to_triage = triage_start - first_valid_alert
time_to_contain = verified_containment - incident_declaration
breakout_time = first_lateral_movement - initial_compromise
```

## 7. Control Effectiveness Audit

Audit controls against the actual attack, not against policy statements.

### Control audit fields

| Field | Purpose |
| --- | --- |
| **control_id** | Stable control reference |
| **control_objective** | Intended risk reduction |
| **incident_event** | Attack behavior tested against the control |
| **expected_result** | What should have happened |
| **actual_result** | What happened |
| **evidence_refs** | Supporting evidence |
| **effectiveness** | Effective, partial, ineffective, absent, or unverified |
| **failure_mode** | Configuration, telemetry, logic, process, authority, or bypass |
| **corrective_action** | Specific improvement |
| **validation** | Test proving improvement |

### Audit example

```json
{
  "control_id": "CTRL-APP-004",
  "control_objective": "Prevent trusted developer utilities on clinical workstations",
  "incident_event": "MSBuild executed an attacker-controlled project file",
  "expected_result": "Execution blocked or alerted",
  "actual_result": "Execution succeeded without alert",
  "effectiveness": "ineffective",
  "failure_mode": "application control allowed MSBuild on non-development assets",
  "corrective_action": "Block MSBuild on clinical workstation policy group",
  "validation": "Approved simulation is blocked and logged"
}
```

## 8. Control States

| State | Meaning |
| --- | --- |
| **Effective** | Control achieved its intended outcome with acceptable side effects |
| **Partially effective** | Control reduced risk but did not fully prevent, detect, or contain behavior |
| **Ineffective** | Control existed but did not achieve the intended outcome |
| **Absent** | Required control did not exist |
| **Bypassed** | Attacker used an implementation outside control coverage |
| **Misconfigured** | Configuration prevented the control from working properly |
| **Unmonitored** | Control produced data, but nobody reviewed or alerted on it |
| **Unverified** | Evidence cannot determine actual effectiveness |

### Control principle

`Deployed` is not the same as `effective`.

## 9. Expected Versus Actual Behavior

```text
Expected control behavior
  ↓ compare with
Observed incident behavior
  ↓ determine
Failure mode and corrective action
```

### Failure modes

- Control disabled.
- Policy not applied to the affected asset.
- Logging not enabled.
- Telemetry dropped or not ingested.
- Field normalization failed.
- Detection logic too narrow.
- Threshold too high.
- Exclusion too broad.
- Alert severity too low.
- Analyst workflow delayed action.
- Attacker used a trusted or alternate path.
- Response authority or dependency slowed containment.

## 10. Root Cause and Contributing Factors

### Categories

| Category | Example |
| --- | --- |
| **Technical root cause** | Trusted utility allowed to execute untrusted project content |
| **Identity root cause** | Authentication material exposed and reusable |
| **Process factor** | No tested rule-deployment workflow |
| **Telemetry factor** | Command-line logging incomplete |
| **Governance factor** | Risk accepted without expiration or compensating control |
| **Human factor** | Analyst lacked a clear escalation procedure |
| **Dependency factor** | Clinical workflow limited immediate isolation |

### Five-whys caution

Use iterative questioning to expose system conditions, not to force one simplistic cause.

## 11. Detection Gap Analysis

### Gap types

| Gap | Meaning |
| --- | --- |
| **No analytic** | Telemetry existed, but no rule targeted the behavior |
| **Missing telemetry** | Required data was not available |
| **Field gap** | Needed field was absent or unreliable |
| **Behavior gap** | Rule covered one implementation but not the observed variant |
| **Correlation gap** | Separate events existed but were not linked |
| **Tuning gap** | Filter or threshold suppressed the event |
| **Validation gap** | Rule existed but was never tested on representative data |
| **Operational gap** | Alert fired but queue, severity, or workflow prevented action |

### Gap record

```json
{
  "gap_id": "DET-GAP-009",
  "attack_behavior": "MSBuild execution from a non-development workstation",
  "telemetry_available": true,
  "existing_detection": false,
  "gap_type": "no_analytic",
  "priority": "high",
  "owner": "detection_engineering"
}
```

## 12. Telemetry Gap Analysis

### Required telemetry for observed TTPs

| Behavior | Useful telemetry |
| --- | --- |
| **MSBuild proxy execution** | Process creation, command line, parent, path, file, network connection |
| **Pass-the-Ticket** | Kerberos ticket events, logons, source and target hosts, account context |
| **Remote services** | Authentication, SMB, service creation, WMI, WinRM, process creation |
| **Persistence** | Task, service, registry, WMI, startup, and account changes |
| **Data staging** | File creation, archive tools, directory access, and process context |
| **Exfiltration** | Network flows, proxy, DNS, destination, bytes, and process ownership |

### Telemetry decision

```text
Required field present?
  No → Collection action
  Yes ↓
Field normalized correctly?
  No → Parsing action
  Yes ↓
Data retained long enough?
  No → Retention action
  Yes ↓
Analytic uses field correctly?
  No → Detection action
```

## 13. Detection Engineering Lifecycle

```text
Define behavior and data requirements
  ↓
Write detection
  ↓
Syntax and schema validation
  ↓
Positive testing
  ↓
Negative and regression testing
  ↓
Tune documented filters
  ↓
Peer review and approval
  ↓
Pilot deployment
  ↓
Measure quality and workload
  ↓
Production deployment and maintenance
```

### Lifecycle artifacts

- Detection objective.
- Data-source requirements.
- Sigma source rule.
- Backend conversion output.
- Positive and negative datasets.
- Test results.
- Tuning notes.
- Deployment and rollback plan.
- Runbook and triage guidance.
- Metrics and review date.

## 14. Sigma Rule Anatomy

<Software>Sigma</Software> rules are YAML documents that describe log source, detection logic, and metadata for shareable SIEM detections. The detection section defines what to search for, while metadata explains intent, references, false positives, severity, and ownership. citeturn24search53turn24search54turn24search55

### Common fields

| Field | Purpose |
| --- | --- |
| **title** | Clear detection name |
| **id** | Stable UUID |
| **status** | Experimental, test, or stable lifecycle state |
| **description** | Behavior and intent |
| **references** | Incident, ATT&CK, or technical references |
| **author and date** | Ownership and history |
| **tags** | ATT&CK and organizational taxonomy |
| **logsource** | Product, service, or category |
| **detection** | Selections, filters, and condition |
| **falsepositives** | Known benign explanations |
| **level** | Intended severity |

### Metadata rule

Detection logic without data requirements, false-positive context, ownership, and validation history is incomplete.

## 15. Sigma Rule Development

### Development sequence

1. Describe the observed behavior in plain language.
2. Identify the minimum telemetry and fields.
3. Identify stable attributes and attacker-controlled attributes.
4. Define malicious positive examples.
5. Define legitimate negative examples.
6. Write the smallest reliable selection.
7. Add filters only from verified benign patterns.
8. Validate syntax and field mapping.
9. Test against positive and negative data.
10. Document results and deployment guidance.

### Rule quality questions

- Does the rule detect the observed incident data?
- Does it detect reasonable variants?
- Does it depend on one filename or hash?
- Are exclusions bounded and justified?
- Are all required fields actually collected?
- Can an analyst understand why the alert fired?
- Is the expected volume operationally manageable?

## 16. MSBuild Detection

<Organization>MITRE ATT&CK</Organization> documents MSBuild abuse under T1127.001. MSBuild can compile and execute inline code from XML project files, and its trusted Microsoft signature can help adversaries proxy execution through an allowed utility. citeturn24search56turn24search57turn24search58

### Detection features

- MSBuild on non-development assets.
- MSBuild from an unusual path.
- Project file in temporary, download, or user-writable directory.
- Office, browser, script engine, or shell parent.
- Suspicious or obfuscated arguments.
- Child process inconsistent with a build workflow.
- External connection from MSBuild or its child.
- Execution by a user with no development role.

### Example Sigma rule

```yaml
title: Suspicious MSBuild Execution on Non-Development Asset
id: 2e9e6124-28d2-48be-8a8d-31d3b93bef3d
status: test
description: Detects MSBuild activity matching incident-observed proxy execution patterns outside approved build systems.
references:
    - Internal incident finding FND-EXEC-004
    - https://attack.mitre.org/techniques/T1127/001/
author: Detection Engineering
logsource:
    category: process_creation
    product: windows
detection:
    selection_image:
        Image|endswith: '\MSBuild.exe'
    selection_context:
        CommandLine|contains:
            - '\Temp\'
            - '\Downloads\'
            - '\AppData\'
    filter_approved_hosts:
        Computer|startswith:
            - 'BUILD-'
            - 'DEV-'
    condition: selection_image and selection_context and not filter_approved_hosts
falsepositives:
    - Approved development or software packaging activity not represented in the host filter
level: high
tags:
    - attack.execution
    - attack.defense-evasion
    - attack.t1127.001
```

### Rule improvement

Correlate process creation with external network activity, suspicious parent process, project-file creation, or unusual child processes for higher confidence.

## 17. Pass-the-Ticket Detection

### Detection objective

Identify Kerberos ticket use that is inconsistent with the account, source host, target, time, or expected authentication sequence.

### Useful features

- Service-ticket activity without expected preceding authentication context.
- TGT or service-ticket use from a new source host.
- Privileged account accessing unusual targets.
- Ticket encryption or lifetime anomalies where available and validated.
- Kerberos use after credential reset or account containment.
- Multiple targets accessed rapidly with the same identity.
- Authentication followed by remote service or administrative-share activity.

### Detection caution

Kerberos telemetry and event semantics vary by data source. Validate fields and expected sequences before production use.

### Sigma-style concept

```yaml
title: Privileged Kerberos Use from Unusual Source
id: 283ebf1f-ee9f-44e1-8931-31956c9ae068
status: experimental
description: Detects privileged Kerberos service-ticket use from a source outside the approved administration baseline.
logsource:
    product: windows
    service: security
detection:
    selection:
        EventID: 4769
        TargetUserName|endswith: '$admin'
    filter_approved_sources:
        IpAddress:
            - '10.20.10.0/24'
    condition: selection and not filter_approved_sources
falsepositives:
    - Newly approved administration hosts not yet added to the baseline
level: high
tags:
    - attack.defense-evasion
    - attack.lateral-movement
    - attack.t1550.003
```

## 18. Correlation Detection

Single-event rules may miss the incident context.

### Correlation examples

```text
MSBuild process creation
  + within 2 minutes
External network connection from same process or child
  +
Host role is clinical workstation
```

```text
Kerberos ticket activity from new source
  + within 5 minutes
Administrative share or remote service activity
  +
Target is critical server
```

### Correlation fields

- User or account.
- Source and target host.
- Process GUID or PID.
- Logon ID.
- File hash or path.
- Time window.
- Host role and criticality.
- Authorization baseline.

## 19. Rule Testing

### Test stages

| Stage | Goal |
| --- | --- |
| **Syntax validation** | Rule parses and follows specification |
| **Field validation** | Fields exist and map correctly in target SIEM |
| **Positive replay** | Incident and variant samples trigger |
| **Negative replay** | Clean samples do not trigger unexpectedly |
| **Regression test** | Existing expected detections continue to work |
| **Performance test** | Query completes within acceptable resource limits |
| **Pilot test** | Production-like volume and analyst workflow are measured |
| **Adversary simulation** | Controlled behavior confirms end-to-end visibility |

### Test record

```json
{
  "rule_id": "2e9e6124-28d2-48be-8a8d-31d3b93bef3d",
  "test_id": "TEST-014",
  "dataset": "positive-incident-msbuild.jsonl",
  "expected_matches": 3,
  "actual_matches": 3,
  "result": "pass",
  "tested_at_utc": "2026-11-05T13:00:00Z"
}
```

## 20. Positive and Negative Samples

### Positive samples

- Original incident event.
- Incident-equivalent event with renamed project file.
- Alternate suspicious path.
- Approved simulation of MSBuild inline task.
- Pass-the-Ticket simulation with expected logging.
- Related parent-child and network variants.

### Negative samples

- Approved build server activity.
- Software packaging workflows.
- Developer workstation compilations.
- Approved administration authentication.
- Historical clean data from representative periods.
- High-volume operational events.

### Dataset rule

Do not evaluate a rule against only the incident sample. Variants and representative benign data are required.

## 21. Detection Metrics

```text
precision = TP / (TP + FP)
recall = TP / (TP + FN)
false_positive_rate = FP / (FP + TN)
false_negative_rate = FN / (FN + TP)
```

| Metric | Operational meaning |
| --- | --- |
| **True positive rate** | Malicious samples detected |
| **False positive rate** | Benign samples incorrectly detected |
| **Precision** | Proportion of alerts that are truly relevant |
| **Recall** | Proportion of known malicious samples detected |
| **Alert volume** | Expected analyst workload |
| **Time to alert** | Delay from event to detection |
| **Query runtime** | SIEM performance impact |
| **Triage time** | Analyst effort per alert |

### Metric caution

A low false-positive rate on a tiny clean dataset is not sufficient evidence of production quality.

## 22. False Positive Analysis

### False-positive record

| Field | Purpose |
| --- | --- |
| **event_id** | Exact benign event |
| **business_process** | Legitimate activity |
| **user and asset role** | Context |
| **triggered_selection** | Rule component that matched |
| **frequency** | Expected volume |
| **is_exclusion_safe** | Whether filtering preserves malicious coverage |
| **filter_scope** | Smallest reliable exclusion |
| **owner_validation** | Business or technical confirmation |

### Filter rule

Prefer bounded allowlists based on approved host role, signed project, account, or change window. Avoid broad exclusions such as removing all activity from one common parent process.

## 23. Rule Tuning

### Tuning options

- Add host-role context.
- Add parent or child process context.
- Add path or command-line features.
- Add network behavior.
- Correlate multiple events.
- Limit by account role or authorization matrix.
- Exclude verified application signatures or project paths.
- Adjust severity instead of suppressing the event.
- Split a broad rule into high-confidence and hunting rules.

### Tuning principle

Every filter is a detection gap. Document why it is safe and test that malicious positives still trigger.

## 24. Deployment and Monitoring

### Deployment stages

```text
Development
  ↓
Peer review
  ↓
Test environment
  ↓
Monitor-only pilot
  ↓
Limited production scope
  ↓
Full production
  ↓
Quality monitoring and scheduled review
```

### Deployment fields

- Rule version and owner.
- Target systems and SIEM backend.
- Required data sources.
- Expected alert volume.
- Triage instructions.
- Rollback method.
- Pilot start and end.
- Success criteria.
- Production approval.
- Review date.

## 25. Threat Intelligence Enrichment

Threat intelligence should improve confidence, context, prioritization, and anticipation.

### Enrichment workflow

```text
Preserve incident indicator or behavior
  ↓
Query approved sources
  ↓
Record source and retrieval time
  ↓
Assess reliability and credibility
  ↓
Extract relationships and context
  ↓
Compare with observed behavior
  ↓
Update detections, hunts, and forecasts
```

### Enrichment caution

Reputation scores and actor labels are inputs, not conclusions. Confirm provenance and independent support.

## 26. IOC Enrichment

### Fields

| Field | Purpose |
| --- | --- |
| **indicator** | Domain, IP, URL, hash, certificate, or account |
| **first and last seen** | Activity window |
| **sources** | Internal and external provenance |
| **reputation** | Malicious, suspicious, benign, or unknown context |
| **relationships** | Domains, certificates, samples, and infrastructure |
| **hosting and ownership** | ASN, provider, registrar, and service type |
| **campaign associations** | Reported activity clusters |
| **confidence** | Evidentiary strength |
| **recommended use** | Block, alert, hunt, watch, or context |
| **expiration or review** | Indicator decay control |

### Safe use

- Do not upload sensitive files or internal URLs without approval.
- Treat shared cloud and CDN infrastructure cautiously.
- Preserve retrieval time because reputation changes.
- Separate reported association from locally observed use.

## 27. TTP Enrichment

TTP enrichment is generally more durable than IOC enrichment.

### Questions

- Which actors or campaigns report the same techniques?
- Which technique combinations are distinctive?
- Which implementations differ from the incident?
- Which preceding and following techniques are commonly reported?
- Which data sources detect those techniques?
- Which techniques are not yet covered locally?
- Which hardening changes disrupt the behavior chain?

### TTP record

```json
{
  "technique_id": "T1127.001",
  "observed_locally": true,
  "external_reporting": ["multiple campaigns use MSBuild proxy execution"],
  "likely_follow_on_behaviors": ["payload execution", "defense evasion", "network communication"],
  "detection_status": "test_rule_created",
  "hardening_status": "application_control_change_planned"
}
```

## 28. Actor Mapping

<Organization>MITRE ATT&CK</Organization> group pages map publicly reported groups to techniques and software. Use actor mapping as context and hypothesis generation, not as automatic attribution.

### Attribution checks

- Independent sources.
- Shared infrastructure or malware configuration.
- Distinctive procedure combination.
- Targeting and victimology.
- Timing and operational pattern.
- Contradictory evidence.
- Confidence and alternative explanations.

### Attribution language

```text
Observed behavior overlaps with publicly reported activity associated with [group or campaign].
Available evidence is insufficient to attribute the incident to that actor.
```

## 29. Forward-Looking Intelligence

### Forecast outputs

| Output | Example |
| --- | --- |
| **Likely next technique** | Additional remote-service or credential activity |
| **Likely target** | Identity, management, backup, or data systems |
| **Infrastructure rotation** | New domains or IPs with similar certificate or hosting patterns |
| **Behavior variant** | Alternate trusted utility or authentication material |
| **Collection requirement** | New logs needed to test the forecast |
| **Hunt hypothesis** | Search for related behavior before an alert fires |

### Forecast format

```text
We assess with [confidence] that [behavior] may follow because [evidence and external context].
Watch for [observable signals]. This assessment would be strengthened or weakened by [collection].
```

## 30. Hardening from Findings

Hardening changes must trace to incident evidence.

### Specification fields

| Field | Purpose |
| --- | --- |
| **finding_ref** | Incident failure addressed |
| **configuration** | Exact setting or policy |
| **scope** | Assets, users, sites, or groups |
| **desired state** | Required value |
| **implementation method** | GPO, Intune, script, MDM, or application control |
| **dependencies** | Business and technical prerequisites |
| **exceptions** | Approved bounded exclusions |
| **test plan** | Functional and security tests |
| **rollback** | Reversal method |
| **owner and deadline** | Accountability |
| **validation evidence** | Proof the state is applied and effective |

## 31. Attack Surface Reduction

<Organization>Microsoft</Organization> Attack Surface Reduction rules target risky Windows behaviors such as obfuscated scripts, Office child processes, executable content, code injection, credential stealing, and WMI event-subscription persistence. Rules can be configured through supported management methods and evaluated in audit or enforcement modes. citeturn24search59

### Deployment workflow

```text
Identify incident-observed behavior
  ↓
Confirm applicable ASR rule and platform support
  ↓
Deploy in audit mode
  ↓
Measure applications, devices, and users affected
  ↓
Create narrow approved exclusions if necessary
  ↓
Move to warn or block mode
  ↓
Validate malicious test blocked and logged
  ↓
Monitor exceptions and drift
```

### Candidate controls

- Block Office applications from creating child processes.
- Block Office applications from creating executable content.
- Block executable content from email and webmail.
- Block potentially obfuscated scripts.
- Block credential stealing from LSASS.
- Block persistence through WMI event subscription.
- Block vulnerable signed driver abuse.

### ASR caution

Confirm current platform support and business impact before enforcement. Audit results are evidence, not a permanent deployment state.

## 32. Windows Baseline Hardening

<Organization>CIS</Organization> Benchmarks are consensus-based secure-configuration guides. Level 1 aims for broadly applicable essential security with minimal operational impact, while Level 2 can impose stronger restrictions and may reduce functionality. citeturn24search60turn24search61

### Baseline areas

- Audit process creation and command lines.
- PowerShell logging.
- Credential and LSASS protections.
- Local administrator control.
- Firewall profiles and remote administration.
- Application control.
- Macro and script restrictions.
- SMB and legacy authentication.
- Scheduled-task and service auditing.
- Defender and tamper protection.
- Event-log size and retention.
- Time synchronization.

### Baseline rule

Adopt a benchmark profile deliberately. Document deviations, business justification, compensating controls, owner, and expiration date.

## 33. Identity and Kerberos Hardening

### Improvements

- Restrict privileged accounts to dedicated administration hosts.
- Use separate daily and administrative identities.
- Reduce service-account privileges and host scope.
- Use managed service accounts where appropriate.
- Rotate exposed credentials and invalidate sessions.
- Protect LSASS and credential material.
- Shorten excessive ticket lifetimes through approved policy.
- Monitor sensitive Kerberos ticket events.
- Disable legacy or weak authentication where feasible.
- Review delegation, SPNs, trusts, and unconstrained access.
- Enforce MFA where supported.

### Identity validation

- Old credentials fail.
- Existing sessions and tokens are invalidated.
- Service dependencies function with new credentials.
- Privileged authentication occurs only from approved sources.
- Pass-the-Ticket simulation produces expected telemetry and alerts.

## 34. Logging and Visibility Improvements

### Required improvements

| Gap | Improvement |
| --- | --- |
| Missing process context | Collect parent, command line, user, hash, and process GUID |
| Missing MSBuild content path | Capture command line and project-file creation |
| Weak Kerberos visibility | Centralize ticket and logon events with source and target context |
| Missing persistence evidence | Collect scheduled task, service, registry, and WMI changes |
| Short retention | Increase retention to cover realistic dwell time |
| Missing asset context | Enrich events with role, owner, site, and criticality |
| Missing correlation | Create identity-to-process-to-network sequences |

### Visibility rule

Do not create a detection that depends on fields not reliably collected.

## 35. Risk Register Update

### Risk record fields

| Field | Purpose |
| --- | --- |
| **risk_id** | Stable record |
| **risk statement** | Cause, event, and impact |
| **incident evidence** | Finding and event references |
| **affected assets and data** | Scope |
| **inherent likelihood and impact** | Uncontrolled risk |
| **controls and effectiveness** | Actual state |
| **residual likelihood and impact** | Remaining risk |
| **treatment** | Mitigate, transfer, avoid, or accept |
| **owner** | Accountable business owner |
| **actions and deadlines** | Treatment plan |
| **validation** | Evidence required to reduce or close risk |
| **review date** | Reassessment schedule |

### Risk statement pattern

```text
Because [control weakness], an adversary can [threat event], resulting in [business impact].
The incident demonstrated this through [evidence references].
```

## 36. Playbook Update

### Update requirements

- Add observed indicators and behaviors.
- Add telemetry and query prerequisites.
- Add the decision point that caused delay or ambiguity.
- Add evidence-preservation steps.
- Add containment alternatives and approvals.
- Add severity escalation criteria.
- Add eradication verification.
- Add recovery tests.
- Add communication triggers.
- Add a scenario reproducing the incident behavior.

### Change record

```json
{
  "playbook": "malware-clinical-workstation",
  "change_id": "PB-CHG-011",
  "finding_refs": ["FND-EXEC-004", "DET-GAP-009"],
  "change": "Add MSBuild proxy-execution triage and application-control containment steps",
  "owner": "incident_response",
  "validation": "Functional exercise detects and contains approved simulation"
}
```

## 37. Implementation Backlog

### Backlog fields

| Field | Purpose |
| --- | --- |
| **action_id** | Stable identifier |
| **finding_refs** | Why the action exists |
| **deliverable** | Concrete artifact or configuration |
| **priority** | Risk-based order |
| **owner** | One accountable person or team |
| **dependencies** | Required approvals and technical prerequisites |
| **deadline** | Completion date |
| **acceptance_criteria** | Definition of done |
| **validation_method** | Proof of effectiveness |
| **rollback** | Safe reversal |
| **status** | Planned, active, blocked, validated, or closed |

### Backlog rule

Avoid actions such as `improve logging` or `enhance awareness`. Specify exact systems, settings, artifacts, and evidence of completion.

## 38. Owner, Deadline, and Validation

Every improvement requires:

```text
One accountable owner
One delivery deadline
One validation method
One acceptance authority
```

### Validation examples

| Improvement | Validation |
| --- | --- |
| Sigma rule | Positive and negative replay plus pilot metrics |
| ASR policy | Audit review, controlled test, then block confirmation |
| Application control | MSBuild denied on clinical asset and allowed on approved build host |
| Kerberos monitoring | Pass-the-Ticket simulation detected and triaged |
| Logging | Required fields observed from every in-scope asset |
| Playbook | Tabletop or functional exercise completed without critical ambiguity |
| Risk reduction | Residual risk reassessed with evidence |

## 39. Acceptance Criteria

### Good acceptance criteria are

- Specific.
- Measurable.
- Evidence-producing.
- Time-bounded.
- Assigned to an approver.
- Resistant to superficial completion.

### Examples

```text
Rule detects 100 percent of five approved positive samples,
produces no false positives in the labeled negative corpus,
and stays below the agreed pilot alert volume for 14 days.
```

```text
MSBuild is blocked on all clinical workstation policy groups,
remains available on approved build systems,
and policy compliance exceeds 98 percent.
```

## 40. Retesting and Closure

### Closure workflow

```text
Implementation completed
  ↓
Evidence collected
  ↓
Acceptance criteria tested
  ↓
Deficiency corrected or exception approved
  ↓
Owner and reviewer sign off
  ↓
Risk and playbook records updated
  ↓
Action closed with review date
```

### Closure principle

Do not close an action because a change request was completed. Close it when the intended risk reduction is demonstrated.

## 41. Executive Reporting

### Executive PIR summary

```text
What enabled the incident to progress
Which controls worked
Which controls failed or were bypassed
What changed immediately
What remains open
Who owns each major action
When actions will be complete
How effectiveness will be validated
How residual risk changed
```

### Executive rule

Report implementation status and residual risk, not only the number of recommendations.

## 42. Implementation Package

```text
lessons_learned/
├── README.md
├── review/
│   ├── incident-timeline-overlay.jsonl
│   ├── post-incident-review.md
│   └── root-cause-analysis.md
├── controls/
│   ├── control-effectiveness-matrix.json
│   ├── detection-gaps.json
│   └── telemetry-gaps.json
├── detections/
│   ├── sigma/
│   │   ├── msbuild_proxy_execution.yml
│   │   ├── unusual_kerberos_source.yml
│   │   └── correlation_rules.yml
│   ├── tests/
│   │   ├── positive/
│   │   ├── negative/
│   │   └── test-results.json
│   ├── deployment-plan.md
│   └── triage-runbook.md
├── intelligence/
│   ├── ioc-enrichment.json
│   ├── ttp-enrichment.json
│   └── forward-looking-assessment.md
├── hardening/
│   ├── asr-specification.md
│   ├── application-control-specification.md
│   ├── identity-hardening.md
│   ├── logging-requirements.md
│   └── validation-plan.md
├── governance/
│   ├── risk-register-update.json
│   ├── playbook-changes.json
│   └── implementation-backlog.json
├── reports/
│   ├── technical-improvement-report.md
│   └── executive-pir-summary.md
├── MANIFEST.json
└── SHA256SUMS
```

## 43. Quality Gates

| Gate | Pass condition |
| --- | --- |
| **Evidence** | Every lesson traces to incident evidence |
| **Control audit** | Expected and actual control behavior compared |
| **Root cause** | Root causes separated from symptoms and contributing factors |
| **Telemetry** | Required fields, coverage, retention, and normalization assessed |
| **Sigma** | Rules include metadata, log source, detection, filters, and false positives |
| **Testing** | Positive, negative, regression, and pilot tests documented |
| **Metrics** | TP, FP, TN, FN, precision, recall, and alert volume measured where applicable |
| **Tuning** | Every exclusion is bounded, justified, and regression-tested |
| **Intelligence** | Sources, retrieval time, confidence, and local relevance recorded |
| **Hardening** | Exact configuration, scope, test, rollback, owner, and deadline defined |
| **Risk** | Residual risk updated using operational evidence |
| **Playbooks** | Incident-observed gaps translated into executable steps |
| **Ownership** | Every action has one accountable owner |
| **Validation** | Every action has acceptance criteria and proof method |
| **Closure** | Actions close only after risk reduction is demonstrated |

### Validation commands

```bash
find lessons_learned -name '*.json' -print0 | xargs -0 -n1 jq empty
find lessons_learned -name '*.jsonl' -print0 | while IFS= read -r -d '' file; do jq -c . "$file" >/dev/null || exit 1; done
find lessons_learned/detections/sigma -name '*.yml' -print0 | xargs -0 -n1 sigma check
sha256sum -c lessons_learned/SHA256SUMS
```

## 44. Professional Judgment

- A control in the architecture is not necessarily a control that works.
- A rule that matches the incident once is not production-ready.
- Detection quality requires representative positive and negative data.
- Every exclusion creates potential attacker space.
- Low alert volume does not prove high detection quality.
- Threat intelligence should guide future hunts and controls, not only label the past.
- Actor overlap does not prove attribution.
- Hardening can create operational harm if dependencies are not tested.
- Audit mode is a deployment phase, not a permanent outcome.
- Risk acceptance needs an owner, reason, scope, compensating controls, and expiration.
- A recommendation without an owner, deadline, and validation method is not an action.
- Closing a ticket is not the same as reducing risk.
- Bound conclusions to evidence and recommendations to findings.
- Write artifacts another engineer can execute without clarification.

## 45. Framework and Tool Map

| Item | Purpose |
| --- | --- |
| **NIST SP 800-61 Rev. 3** | Integrate incident learning with cybersecurity risk management and CSF 2.0 |
| **Sigma** | Portable YAML detection rules, correlation logic, filters, metadata, and taxonomy |
| **MITRE ATT&CK** | Map observed TTPs, related actors, detections, and mitigations |
| **OTX and reputation services** | External IOC and campaign context |
| **Microsoft ASR rules** | Reduce risky Windows behaviors used by malware and adversaries |
| **Application control** | Restrict trusted utilities and unapproved content by asset role |
| **CIS Benchmarks** | Consensus-based secure configuration baselines |
| **Risk register** | Record operationally demonstrated risk and treatment |
| **Playbook governance** | Convert incident lessons into executable response steps |
| **Test corpora** | Measure rule behavior on malicious and benign events |

## 46. Fast Recall

- **The incident is not finished until improvements are implemented and validated.**
- **Audit controls against the actual incident timeline.**
- **Deployed does not mean effective.**
- **Separate root causes, contributing factors, and symptoms.**
- **Detection gaps can originate in telemetry, fields, logic, correlation, tuning, validation, or operations.**
- **Detection engineering is define, write, test, tune, deploy, measure, and maintain.**
- **Sigma rules need metadata, log source, detection logic, filters, false positives, and severity.**
- **MSBuild detection should use context, not filename alone.**
- **Pass-the-Ticket detection depends on validated Kerberos event semantics and baselines.**
- **Test original incidents, malicious variants, and representative benign data.**
- **Measure TP, FP, TN, FN, precision, recall, volume, and triage cost.**
- **Every filter must be justified and regression-tested.**
- **Monitor-only deployment should transition to a validated operational state.**
- **Enrich IOCs with source, time, relationships, confidence, and decay.**
- **Enrich TTPs to anticipate likely next behavior.**
- **Actor similarity does not prove attribution.**
- **Hardening specifications need exact settings, scope, tests, rollback, and evidence.**
- **Update the risk register with demonstrated control effectiveness and residual risk.**
- **Update playbooks before the next incident.**
- **Every action needs an owner, deadline, acceptance criteria, and validation method.**
- **Close improvements when risk reduction is proven, not when change tickets close.**

## 47. Resources

**Incident learning**
- [NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final)

**Detection engineering**
- [Sigma Specification](https://sigmahq.io/sigma-specification/)
- [Sigma Rule Documentation](https://sigmahq.io/docs/basics/rules.html)
- [MITRE ATT&CK T1127.001 MSBuild](https://attack.mitre.org/techniques/T1127/001/)
- [MITRE ATT&CK T1550.003 Pass the Ticket](https://attack.mitre.org/techniques/T1550/003/)

**Threat intelligence**
- [MITRE ATT&CK Groups](https://attack.mitre.org/groups/)
- [AlienVault OTX](https://otx.alienvault.com/)
- [AbuseIPDB](https://www.abuseipdb.com/)

**Hardening**
- [Microsoft ASR Rules Reference](https://learn.microsoft.com/en-us/defender-endpoint/attack-surface-reduction-rules-reference)
- [CIS Microsoft Windows Desktop Benchmarks](https://www.cisecurity.org/benchmark/microsoft_windows_desktop)
