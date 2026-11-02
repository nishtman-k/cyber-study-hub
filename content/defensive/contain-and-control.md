# Contain and Control

"Everybody has a plan until they get punched in the mouth." - Mike Tyson

> **⚠️ AUTHORIZED USE ONLY.** This material is for education, defensive incident response, and authorized organizational operations. Perform containment, evidence acquisition, credential actions, and system changes only within approved authority. Protect patient safety and clinical continuity. Do not execute untrusted code, expose protected data, or destroy evidence. Coordinate high-impact actions and regulatory questions with authorized clinical, legal, privacy, and executive personnel.

**Scope:** Live incident handling from the first alert through clean handoff: triage, authoritative timelines, known-versus-assumed statements, volatile and non-volatile evidence preservation, containment trade-offs, severity reassessment, Windows persistence review, credential and network eviction, eradication verification, recovery proof, monitoring, decision logs, action logs, evidence custody, and self-contained handoff packages.

## Table of Contents
- [Core Concepts](#core-concepts)
- [Incident Handling Workflow](#incident-handling-workflow)
- [First Thirty Minutes](#first-thirty-minutes)
- [Incident Declaration](#incident-declaration)
- [Authoritative Timeline](#authoritative-timeline)
- [Known, Assessed, Assumed, and Unknown](#known-assessed-assumed-and-unknown)
- [Initial Triage](#initial-triage)
- [Alert Validation](#alert-validation)
- [Scope Assessment](#scope-assessment)
- [Severity Classification](#severity-classification)
- [Severity Reassessment](#severity-reassessment)
- [Order of Operations](#order-of-operations)
- [Evidence Preservation Strategy](#evidence-preservation-strategy)
- [Volatile Evidence](#volatile-evidence)
- [Non-Volatile Evidence](#non-volatile-evidence)
- [Chain of Custody](#chain-of-custody)
- [Evidence Integrity](#evidence-integrity)
- [Containment Decision Model](#containment-decision-model)
- [Containment Options](#containment-options)
- [Clinical Workstation Containment](#clinical-workstation-containment)
- [Account and Session Containment](#account-and-session-containment)
- [Network Containment](#network-containment)
- [Containment Verification](#containment-verification)
- [Scope Expansion](#scope-expansion)
- [Windows Persistence Surfaces](#windows-persistence-surfaces)
- [Process and Service Eradication](#process-and-service-eradication)
- [Scheduled Task Eradication](#scheduled-task-eradication)
- [Registry and Startup Eradication](#registry-and-startup-eradication)
- [WMI Persistence](#wmi-persistence)
- [Credential Eradication](#credential-eradication)
- [Network Persistence and Reentry](#network-persistence-and-reentry)
- [Living Off The Land and MSBuild](#living-off-the-land-and-msbuild)
- [Remote Services and Impacket](#remote-services-and-impacket)
- [Eradication Checklist](#eradication-checklist)
- [Eradication Verification](#eradication-verification)
- [Recovery Planning](#recovery-planning)
- [Recovery Validation](#recovery-validation)
- [Heightened Monitoring](#heightened-monitoring)
- [Decision Log](#decision-log)
- [Action Log](#action-log)
- [Situation Updates](#situation-updates)
- [Handoff Package](#handoff-package)
- [Handoff Quality](#handoff-quality)
- [Closure Criteria](#closure-criteria)
- [Incident Artifact Package](#incident-artifact-package)
- [Quality Gates](#quality-gates)
- [Professional Judgment](#professional-judgment)
- [Framework and Tool Map](#framework-and-tool-map)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Concepts

| Term | Meaning |
| --- | --- |
| **Triage** | Rapid validation, classification, and initial scoping of an alert or incident |
| **Containment** | Action that limits attacker access, spread, data loss, or operational impact |
| **Eradication** | Removal of malicious artifacts, persistence, compromised access, and root causes |
| **Recovery** | Controlled restoration of trustworthy service |
| **Volatile evidence** | Data likely to disappear after shutdown, restart, process exit, or session revocation |
| **Non-volatile evidence** | Data that normally persists on disk, in logs, or in managed services |
| **Authoritative timeline** | The official chronological incident record |
| **Decision log** | Record of what was decided, by whom, when, and why |
| **Action log** | Record of assigned and completed response actions |
| **Handoff** | Transfer of incident ownership with sufficient evidence and context to continue immediately |

### The core idea

```text
Validate
  ↓
Declare and document
  ↓
Preserve what will disappear
  ↓
Contain deliberately
  ↓
Reassess scope and severity
  ↓
Eradicate every access path
  ↓
Recover with proof
  ↓
Hand off without ambiguity
```

## 2. Incident Handling Workflow

| Phase | Main question | Output |
| --- | --- | --- |
| **Triage** | Is this real, active, and material? | Validated incident record |
| **Preservation** | What evidence will disappear when action is taken? | Evidence manifest |
| **Containment** | How can risk be reduced with acceptable operational cost? | Containment decision and proof |
| **Scope reassessment** | Did the incident expand or reveal additional assets and identities? | Updated severity and scope |
| **Eradication** | What enables execution, persistence, credentials, or reentry? | Verified eradication checklist |
| **Recovery** | Can service return safely and be monitored? | Recovery evidence and acceptance |
| **Handoff** | Can another analyst continue without asking basic questions? | Complete ownership-transfer package |

## 3. First Thirty Minutes

```text
00 to 05 minutes
- Record detection time in UTC.
- Preserve the original alerts.
- Open incident, timeline, decision, action, and evidence records.
- Identify host, user, process, destination, and clinical role.

05 to 15 minutes
- Validate process and network evidence.
- Determine whether activity is continuing.
- Identify privilege, patient-safety, and data risks.
- Preserve volatile evidence that containment would destroy.
- Assign provisional severity.

15 to 30 minutes
- Compare containment options and costs.
- Obtain required approval or invoke pre-authorized emergency authority.
- Execute and verify containment.
- Search for related assets, users, destinations, and behaviors.
- Reassess severity and prepare the first formal update.
```

### First-thirty-minute rule

Move quickly, but never faster than the evidence and authority allow. Record decisions when they are made, not after the incident.

## 4. Incident Declaration

### Declaration fields

| Field | Purpose |
| --- | --- |
| **incident_id** | Stable case reference |
| **declared_at_utc** | Exact declaration time |
| **declared_by** | Accountable analyst or commander |
| **provisional_severity** | Current priority |
| **trigger** | Alert, report, or observed behavior |
| **affected_user and host** | Initial entities |
| **clinical_role** | Patient-care and operational context |
| **known_impact** | Confirmed current impact |
| **active_threat_status** | Active, contained, unknown, or inactive |
| **next_decision_time** | Required reassessment point |

### Declaration statement

```text
Incident [ID] was declared at [UTC time] after [alerts or evidence] confirmed
[behavior] on [host] under [account]. Current severity is [level] because of
[patient, operational, data, privilege, and scope reasons].
```

## 5. Authoritative Timeline

Open the timeline immediately. Include evidence events and response actions.

### Timeline fields

| Field | Purpose |
| --- | --- |
| **timestamp_utc** | Normalized event or response time |
| **recorded_at_utc** | Time the entry was added |
| **event_id** | Stable timeline identifier |
| **type** | Evidence, action, decision, communication, or observation |
| **source** | Alert, EDR, analyst, identity, network, or host |
| **actor** | User, process, analyst, or system |
| **asset** | Affected host or service |
| **description** | Factual event statement |
| **evidence_refs** | Supporting artifacts |
| **confidence** | High, moderate, or low |
| **owner** | Responsible responder |

### Timeline example

```json
{
  "timestamp_utc": "2026-11-03T02:47:12Z",
  "recorded_at_utc": "2026-11-03T02:49:01Z",
  "event_id": "TL-0001",
  "type": "evidence",
  "source": "endpoint_alert",
  "actor": "msbuild.exe",
  "asset": "WST-WS-031",
  "description": "Endpoint control reported MSBuild spawning a child process and opening an external connection.",
  "evidence_refs": ["EVD-001", "EVD-002"],
  "confidence": "high"
}
```

### Timeline rule

Never rewrite history. Add corrections as new entries that reference the original record.

## 6. Known, Assessed, Assumed, and Unknown

| Category | Meaning | Example |
| --- | --- | --- |
| **Known** | Directly supported by preserved evidence | Host initiated a connection to an external IP |
| **Assessed** | Analytical conclusion supported by evidence | Process behavior is likely malicious |
| **Assumed** | Temporary condition used to act | Account may be compromised |
| **Unknown** | Material question not yet resolved | Whether additional hosts executed the same project file |

### Status board

```text
KNOWN
- Alert and EDR evidence identify the same host and process chain.
- The workstation can access the Laboratory Information System.

ASSESSED
- Code execution is likely unauthorized.

ASSUMED
- User credentials may be exposed until identity review is complete.

UNKNOWN
- Initial execution method.
- Whether lateral movement occurred.
- Whether patient data was accessed.
```

## 7. Initial Triage

### Triage questions

- What triggered the response?
- Are two independent signals available?
- What host, user, process, parent, child, path, and command are involved?
- Is the process allowed for this asset role?
- Which destination, protocol, and byte direction are involved?
- Does activity continue?
- Is the user present and expected to be active?
- Does the host support clinical care?
- What identities and data can the host access?
- Is there evidence of persistence, credential use, spread, or staging?

### Minimum triage output

```text
Alert validity
Affected user and host
Process tree and command line
Network destination
Clinical and data context
Active-threat status
Preliminary scope
Provisional severity
Evidence to preserve
Containment recommendation
```

## 8. Alert Validation

### Validation paths

| Signal | Corroboration |
| --- | --- |
| Network alert | EDR connection, firewall session, DNS, process owner |
| EDR process alert | Process tree, command line, file hash, file origin |
| User anomaly | Identity records, source host, MFA, session, normal schedule |
| Suspicious binary | Signature, original filename, parent, path, network, behavior |
| Clinical workstation anomaly | Asset inventory, application baseline, IT owner validation |

### Validation principle

A signed or legitimate binary can execute malicious content. Validate behavior and context, not reputation alone.

## 9. Scope Assessment

### Scope pivots

| Pivot | Search target |
| --- | --- |
| **User** | Other hosts, sessions, failed logins, MFA, and privileged access |
| **Host** | Processes, files, tasks, services, registry, connections, and shares |
| **Destination** | Other sources, domains, certificates, and session patterns |
| **Hash or path** | Environment-wide prevalence and first seen |
| **Command line** | Similar execution across systems |
| **Parent-child chain** | Alternate binaries or hosts using the same technique |
| **Remote service evidence** | Source and destination systems |
| **Clinical application access** | Database queries, exports, and record access |

### Scope statuses

```text
Confirmed affected
Probably affected
Under investigation
Reviewed with no evidence observed
Out of scope
```

## 10. Severity Classification

### Severity dimensions

| Dimension | Low | High |
| --- | --- | --- |
| **Patient safety** | No care impact | Immediate or credible care risk |
| **Operational impact** | One user, workaround available | Critical service or multiple sites affected |
| **Data** | No sensitive access | PHI access, staging, or transfer possible |
| **Privilege** | Standard user | Service, administrator, or domain privilege |
| **Scope** | Single contained host | Multiple hosts or active lateral movement |
| **Threat activity** | Inactive | Active execution, spread, or exfiltration |
| **Containment** | Fully contained | Uncontained or uncertain |
| **Evidence uncertainty** | Good visibility | Major gaps with material consequences |

### Severity rule

Use a provisional severity and document why. Severity is a current operational judgment, not a permanent label.

## 11. Severity Reassessment

Reassess when any of the following occurs:

- Another host or account is implicated.
- Privileged credentials are involved.
- Persistence is discovered.
- Remote execution or lateral movement appears.
- Data access, staging, or transfer becomes plausible.
- A clinical service is degraded.
- Containment fails or is bypassed.
- A previously unknown network path appears.
- Evidence quality materially changes.

### Reassessment record

```json
{
  "time_utc": "2026-11-03T03:18:00Z",
  "previous_severity": "SEV-3",
  "new_severity": "SEV-2",
  "reason": [
    "same account authenticated to a second clinical host",
    "remote service creation observed",
    "containment no longer limited to one workstation"
  ],
  "approved_by": "on_call_incident_commander"
}
```

## 12. Order of Operations

```text
1. Protect patient safety.
2. Preserve evidence that the next action will destroy.
3. Contain the highest active risk.
4. Verify containment.
5. Expand scope.
6. Preserve additional evidence.
7. Eradicate all access and persistence paths.
8. Verify eradication.
9. Recover in controlled stages.
10. Validate with evidence and hand off.
```

### Exception principle

If delay creates immediate safety, destructive, propagation, or exfiltration risk, contain first and document which evidence may have been lost.

## 13. Evidence Preservation Strategy

### Preservation questions

- What evidence disappears if the process is killed?
- What evidence disappears if the host is isolated?
- What evidence disappears if the account is disabled?
- What evidence disappears if the host is shut down?
- Which logs may roll over soon?
- Which remote systems contain independent corroboration?
- Which evidence can be preserved without delaying urgent containment?

### Evidence priority model

| Priority | Evidence |
| --- | --- |
| **Immediate** | Memory state, processes, connections, command lines, sessions, volatile keys |
| **Urgent** | EDR telemetry, identity events, firewall sessions, DNS, task and service state |
| **Early** | Suspicious files, registry, PowerShell logs, event logs, configuration |
| **Follow-up** | Disk image, historical exports, backups, vendor logs, user interview |

## 14. Volatile Evidence

### Volatile evidence checklist

- Current UTC and host-local time.
- Logged-on users and active sessions.
- Process list and process tree.
- Full command lines.
- Network connections and owning processes.
- Loaded modules.
- Open files and handles.
- Services and scheduled tasks currently active.
- Memory capture when authorized and feasible.
- Clipboard or console history only when relevant and policy permits.
- Temporary files and runtime configuration.

### Volatile evidence rule

A screenshot is context, not a substitute for structured export or acquisition.

## 15. Non-Volatile Evidence

### Non-volatile evidence checklist

- Original alert and raw event records.
- EDR incident export.
- Suspicious file and SHA-256.
- Relevant Windows event logs.
- PowerShell operational and script-block logs.
- Scheduled task XML.
- Service configuration.
- Autorun registry locations.
- WMI subscription artifacts.
- Prefetch, Amcache, Shimcache, and MFT where authorized.
- Browser or download artifacts.
- Firewall, DNS, proxy, and authentication logs.
- Clinical application and database audit logs.

## 16. Chain of Custody

### Required fields

```text
Evidence ID
Incident ID
Description
Source host or service
Collector
Acquisition start and end time
Acquisition method and tool version
Original and working location
Hash
Handling classification
Every transfer, access, or transformation
```

### Custody principle

The record must show who controlled the evidence from acquisition through reporting.

## 17. Evidence Integrity

```bash
mkdir -p incident/{raw,work,analysis,timeline,logs,reports}
sha256sum incident/raw/* > incident/raw/SHA256SUMS
sha256sum -c incident/raw/SHA256SUMS
chmod -R a-w incident/raw
```

### Evidence rules

- Hash originals before analysis.
- Analyze verified working copies.
- Record every extraction and transformation.
- Preserve original timestamps and timezone.
- Store command output as evidence artifacts.
- Do not place untrusted binaries in ordinary shared folders.

## 18. Containment Decision Model

### Compare each option

| Factor | Question |
| --- | --- |
| **Risk reduction** | Which attacker capability is removed? |
| **Evidence loss** | What disappears after action? |
| **Clinical impact** | Will patient care or laboratory workflow be disrupted? |
| **Operational impact** | Which dependencies are affected? |
| **Reversibility** | Can the action be safely undone? |
| **Speed** | How quickly does it reduce harm? |
| **Attacker awareness** | Will action trigger evasion or retaliation? |
| **Completeness** | Does the action stop one symptom or the full access path? |
| **Authority** | Who must approve? |
| **Verification** | How will success be proven? |

### Decision quality rule

Containment is not complete until the intended effect is verified.

## 19. Containment Options

| Option | Benefit | Cost or risk |
| --- | --- | --- |
| **EDR network isolation** | Fast host containment with management channel retained | May disrupt clinical application access |
| **Switch-port or VLAN restriction** | Strong network control | Can remove EDR or evidence access |
| **Firewall block** | Limits known destination or protocol | Does not remove local persistence or alternate channels |
| **Kill process** | Stops immediate execution | Destroys volatile process evidence and may restart |
| **Disable task or service** | Stops known persistence | May alert attacker and miss alternate persistence |
| **Disable account** | Stops many account uses | Operational impact; existing tokens may remain |
| **Revoke sessions** | Removes active identity access | Does not change compromised password alone |
| **Credential rotation** | Invalidates known secret | Must cover services, tokens, keys, and dependencies |
| **Power off** | Stops activity immediately | Maximum volatile-evidence loss and possible clinical impact |

## 20. Clinical Workstation Containment

### Decision sequence

```text
Assess immediate patient-care use
  ↓
Provide clean replacement or downtime workflow
  ↓
Preserve minimum critical volatile evidence
  ↓
Apply network containment
  ↓
Verify clinical workflow continues safely
  ↓
Begin expanded scoping
```

### Clinical containment record

```text
Workstation role:
Current patient-care use:
Approved workaround:
Containment selected:
Evidence preserved first:
Clinical approver:
Containment time:
Verification:
Residual risk:
Review time:
```

## 21. Account and Session Containment

### Actions

- Confirm exact account and identity type.
- Identify active sessions, tokens, MFA methods, and delegated access.
- Preserve sign-in and audit evidence.
- Revoke sessions and refresh tokens.
- Disable account when approved.
- Rotate password, secrets, application credentials, and service dependencies.
- Review MFA registration and recovery methods.
- Remove unauthorized mailbox rules, OAuth grants, roles, and group membership.
- Hunt use of the same identity across endpoints and services.

### Account rule

A password reset alone may not invalidate active sessions, tokens, API credentials, or alternate authentication methods.

## 22. Network Containment

### Network actions

- Block confirmed malicious destinations.
- Restrict east-west paths from affected assets.
- Limit administrative protocols.
- Force DNS through approved resolvers.
- Preserve firewall, DNS, proxy, and packet evidence.
- Monitor blocked attempts after containment.
- Search other internal sources contacting the same infrastructure.
- Review NAT and address assignment before attributing sessions.

### Network verification

```text
No new successful sessions from contained host
Blocked attempts visible as expected
No alternate destination or protocol observed
No other host reproduces the same pattern
Management and evidence channels remain available where required
```

## 23. Containment Verification

| Containment | Verification evidence |
| --- | --- |
| **Host isolation** | EDR state and failed network test from controlled source |
| **Firewall block** | Denied session logs and absence of allowed sessions |
| **Account disablement** | Directory audit and rejected authentication |
| **Session revocation** | Audit record and invalidated test session |
| **Process termination** | Process absent and no respawn |
| **Task disablement** | Task state plus no execution at next trigger |
| **Service stop** | Service stopped and no restart or child process |

### Verification rule

Record expected result, actual result, timestamp, and observer.

## 24. Scope Expansion

When scope expands:

1. Add the new entity to the incident record.
2. Preserve evidence before changing it.
3. Reassess severity.
4. Re-evaluate containment strategy.
5. Search backward for the source and forward for next-hop activity.
6. Update leadership and specialist escalation.
7. Record the original assumption that changed.
8. Verify whether existing containment remains effective.

### Scope-change statement

```text
At [time], scope expanded from [original scope] to [new scope] after [evidence].
Severity changed from [old] to [new]. The containment plan was modified because [reason].
```

## 25. Windows Persistence Surfaces

| Surface | Evidence and checks |
| --- | --- |
| **Processes** | Running, hidden, injected, renamed, or respawning processes |
| **Services** | New or modified service name, path, account, and start mode |
| **Scheduled tasks** | Task XML, action, trigger, principal, hidden state |
| **Run keys** | HKCU and HKLM autorun values |
| **Startup locations** | User and system startup files |
| **WMI subscriptions** | Filter, consumer, and binding |
| **PowerShell profiles** | User and system profile modifications |
| **Office add-ins and templates** | Startup templates and add-in persistence |
| **DLL search order** | Unexpected libraries loaded by legitimate applications |
| **Accounts and groups** | New users, roles, keys, or group membership |
| **Remote tools** | Agents, services, tunnels, and management software |
| **Boot and logon** | Winlogon, shell, boot, and authentication modifications |

## 26. Process and Service Eradication

### Checklist

- Identify full process lineage and owning user.
- Preserve memory or process evidence when required.
- Identify executable, configuration, and dependencies.
- Stop process under approved authority.
- Disable and remove malicious service.
- Remove dropped binaries and related files.
- Search for the same service name, image path, and hash everywhere.
- Verify no respawn after restart or trigger.
- Confirm legitimate services were not damaged.

### Service verification

```text
Service no longer exists or is restored to approved configuration
Image path is trusted
Service account is authorized
No related child process appears
No network activity recurs
```

## 27. Scheduled Task Eradication

### Checklist

- Export task XML before modification.
- Record task name, path, author, principal, trigger, action, and settings.
- Identify executable or script referenced by the task.
- Disable task when containment requires it.
- Remove malicious task and payload during eradication.
- Search all hosts for matching task attributes.
- Validate task does not return after restart or policy refresh.
- Add detection for creation and modification.

## 28. Registry and Startup Eradication

### Review areas

- User and machine Run and RunOnce keys.
- Startup folders.
- Shell and Winlogon keys.
- Image File Execution Options.
- AppInit and known DLL locations.
- Office add-ins.
- PowerShell profiles.
- File-association handlers.
- Browser extensions and policies.

### Registry rule

Export and preserve suspicious values before removal. Record exact key, value, data, owner, and last-write context.

## 29. WMI Persistence

### Components

```text
Event filter
  +
Event consumer
  +
Filter-to-consumer binding
```

### Eradication steps

- Preserve WMI objects and creation evidence.
- Identify command or script executed.
- Remove malicious binding, consumer, and filter.
- Search other hosts for equivalent objects.
- Verify WMI repository and legitimate management functions.
- Monitor for recreation.

## 30. Credential Eradication

Credential eradication removes every access method, not only the password.

### Checklist

- Identify accounts and secrets available on the affected host.
- Rotate user, service, privileged, application, API, and local administrator credentials as required.
- Revoke sessions, tokens, cookies, keys, certificates, and consent grants.
- Review MFA methods and recovery contacts.
- Remove unauthorized accounts and group membership.
- Check persistence through delegated access and service principals.
- Update dependent services safely.
- Hunt prior and subsequent use of the credentials.
- Validate old credentials and sessions no longer work.

## 31. Network Persistence and Reentry

### Reentry paths

- Alternate C2 domains and IPs.
- Reverse tunnels and proxies.
- Remote management agents.
- VPN or third-party access.
- Cloud applications and OAuth grants.
- DNS tunneling.
- Scheduled outbound callbacks.
- Compromised network devices.
- Unchanged embedded credentials.

### Verification

- Review new external destinations after cleanup.
- Monitor blocked indicators and alternate protocols.
- Search for periodic low-volume sessions.
- Confirm unauthorized remote tools are absent.
- Validate ingress and egress controls.

## 32. Living Off The Land and MSBuild

<Software>MSBuild</Software> is a legitimate build utility that can compile and execute code. Suspicion depends on parent process, source file, path, user, network behavior, and asset role rather than filename alone.

### MSBuild indicators

- Execution on a clinical workstation without a development purpose.
- Parent is Office, script interpreter, browser, or unusual shell.
- Project file resides in user-writable or temporary location.
- Child shell, script, or network-capable process.
- External connection from MSBuild.
- Renamed binary or unexpected execution path.
- Encoded content or inline task in project XML.

### Response steps

- Preserve process tree, command line, project file, file hash, and network evidence.
- Do not delete the project file before acquisition.
- Isolate if active malicious behavior is supported.
- Search for the project content, hash, command pattern, and child processes.
- Remove malicious project, payload, persistence, and credentials.
- Validate legitimate build workflows are not affected.

## 33. Remote Services and Impacket

Remote-service abuse may involve SMB, WMI, WinRM, scheduled tasks, or temporary services. Tool absence does not disprove the behavior.

### Evidence to collect

- Network logons and authentication method.
- Administrative-share access.
- Service creation and deletion.
- Remote process execution.
- Temporary executable or script files.
- WMI provider child processes.
- PowerShell Remoting events.
- Source host, target host, account, and logon ID.
- Fan-out to additional systems.

### Response principle

Contain the credential and the movement path, not only the executable found on one host.

## 34. Eradication Checklist

```text
[ ] Malicious processes stopped
[ ] Malicious files removed or host rebuilt
[ ] Services reviewed and malicious services removed
[ ] Scheduled tasks reviewed and malicious tasks removed
[ ] Registry and startup persistence reviewed
[ ] WMI subscriptions reviewed
[ ] Accounts, roles, keys, and MFA methods reviewed
[ ] Sessions and tokens revoked
[ ] Credentials and secrets rotated
[ ] Remote tools and tunnels removed
[ ] Vulnerability or initial access path corrected
[ ] Related hosts and identities hunted
[ ] Network indicators and alternate channels reviewed
[ ] Detections updated
[ ] Every action verified
```

## 35. Eradication Verification

### Verification matrix

| Eradication target | Proof |
| --- | --- |
| **Process** | No process, child, or respawn after trigger or restart |
| **File** | File absent, quarantine recorded, and hash not found elsewhere |
| **Service** | Service absent or restored, no event recurrence |
| **Task** | Task absent and no execution at scheduled time |
| **Registry** | Value absent and not recreated |
| **WMI** | Filter, consumer, and binding absent |
| **Credential** | Old secret rejected and sessions invalidated |
| **Network channel** | No successful callback or alternate destination |
| **Initial access** | Exploit, email, exposed service, or account path closed |

### Eradication rule

`Removed` describes an action. `Verified absent after relevant triggers` describes a result.

## 36. Recovery Planning

### Recovery prerequisites

- Scope is stable enough to restore safely.
- Active attacker access is removed or controlled.
- Persistence surfaces are reviewed.
- Credentials and trust material are secured.
- Root cause or initial access path is corrected.
- Recovery source is validated.
- Monitoring and rollback plans exist.
- Clinical and business owners understand residual risk.

### Recovery order

```text
Identity and management trust
  ↓
Core network and security controls
  ↓
Critical clinical dependencies
  ↓
Application and data services
  ↓
User endpoints and normal connectivity
```

## 37. Recovery Validation

### Technical proof

- Clean build or backup hash and source recorded.
- Required patches and configuration applied.
- EDR, logging, time sync, and controls healthy.
- Known malicious artifacts absent.
- Accounts and permissions validated.
- Network traffic matches expected baseline.
- Detection tests produce expected events.
- No persistence recurrence after reboot and scheduled triggers.

### Clinical and operational proof

- Laboratory workflow tested by authorized owner.
- Laboratory Information System access works correctly.
- Patient-test data is accurate and reconciled.
- Clean substitute or downtime workflow is retired safely.
- Performance and dependencies are acceptable.
- Rollback remains available.

### Recovery acceptance

```text
Asset or service:
Validation tests:
Evidence references:
Residual risk:
Monitoring period:
Technical approver:
Clinical or business approver:
Return-to-service time:
```

## 38. Heightened Monitoring

### Monitoring targets

- Original and related IOCs.
- Process and parent-child behavior.
- Service and task creation.
- WMI and PowerShell activity.
- Account use and authentication anomalies.
- Network callbacks and new destinations.
- Clinical application access and exports.
- Disabled control or logging activity.

### Monitoring period

Set a documented duration based on persistence, credential exposure, dwell time, and business risk. Define who reviews alerts and what reopens containment.

## 39. Decision Log

### Decision fields

| Field | Purpose |
| --- | --- |
| **decision_id** | Stable reference |
| **time_utc** | Decision time |
| **decision** | Action selected or declined |
| **options_considered** | Alternatives reviewed |
| **evidence_available** | Facts at decision time |
| **trade-offs** | Evidence, safety, service, speed, and attacker risk |
| **authority** | Approver or emergency authority |
| **expected_result** | Intended outcome |
| **review_time** | Reassessment point |
| **actual_result** | Verified result |

### Decision example

```json
{
  "decision_id": "DEC-0004",
  "time_utc": "2026-11-03T03:02:00Z",
  "decision": "EDR isolate WST-WS-031 after targeted volatile collection",
  "options_considered": ["kill process", "switch-port shutdown", "power off"],
  "trade_offs": "Preserves management channel while stopping most network access",
  "authority": "pre_authorized_SEV3_endpoint_isolation",
  "expected_result": "No new external or east-west sessions",
  "review_time": "2026-11-03T03:12:00Z"
}
```

## 40. Action Log

### Action fields

```text
Action ID
Assigned time
Owner
Action
Priority
Dependencies
Deadline
Status
Completion time
Evidence of completion
Result
Follow-up
```

### Action rule

Every action needs a completion artifact. `Done` without evidence is not a verified response step.

## 41. Situation Updates

### Update template

```text
Incident ID and severity:
Current time:
What changed:
Confirmed scope:
Patient and clinical impact:
Data risk:
Containment status:
Evidence preserved:
Eradication status:
Recovery status:
Decisions made:
Decisions required:
Known risks and unknowns:
Actions and owners:
Next update:
```

## 42. Handoff Package

### Required handoff content

- Incident ID, severity, commander, and current owner.
- One-paragraph bottom line.
- Authoritative timeline location.
- Confirmed facts, assessments, assumptions, and unknowns.
- Affected and reviewed entities.
- Evidence manifest and custody status.
- Containment decisions and verification.
- Scope changes and severity history.
- Eradication checklist and proof.
- Recovery tests and approvals.
- Open actions with owners and deadlines.
- Communication history and next update.
- Conditions that require immediate escalation.

### Handoff summary

```text
Current state:
What happened:
What is contained:
What is not contained:
What has been eradicated and verified:
What has recovered and been accepted:
What remains unknown:
Next three actions:
Next decision point:
Escalate immediately if:
```

## 43. Handoff Quality

| Quality measure | Pass condition |
| --- | --- |
| **Completeness** | All required sections are populated |
| **Traceability** | Claims and actions reference evidence IDs |
| **Currency** | Timeline, severity, and action states are current |
| **Clarity** | Known, assessed, assumed, and unknown are separated |
| **Ownership** | Every open action has one accountable owner |
| **Executability** | Incoming analyst can perform the next action immediately |
| **Verification** | Containment, eradication, and recovery claims include proof |
| **Escalation** | Trigger conditions and contacts are explicit |

### Handoff test

Give the package to an uninvolved analyst. Measure clarification questions, missed actions, and time to take ownership.

## 44. Closure Criteria

An incident can move toward closure when:

- Scope is documented and accepted.
- Active attacker access is removed.
- Persistence and reentry paths are eradicated and verified.
- Affected credentials and sessions are secured.
- Root cause or initial access path is corrected.
- Recovery is technically and operationally accepted.
- Heightened monitoring is active or complete.
- Evidence is preserved and indexed.
- Legal, privacy, and communications actions are tracked.
- Open risks have owners and deadlines.
- Post-incident review is scheduled.

## 45. Incident Artifact Package

```text
contain_and_control/
├── README.md
├── incident/
│   ├── declaration.json
│   ├── severity-history.jsonl
│   ├── known-assessed-assumed-unknown.md
│   └── current-status.md
├── timeline/
│   └── authoritative-timeline.jsonl
├── evidence/
│   ├── evidence-manifest.jsonl
│   ├── chain-of-custody.jsonl
│   └── SHA256SUMS
├── triage/
│   ├── alert-validation.md
│   ├── scope-matrix.json
│   └── process-network-analysis.md
├── decisions/
│   └── decision-log.jsonl
├── actions/
│   └── action-log.jsonl
├── containment/
│   ├── option-analysis.md
│   ├── execution-record.md
│   └── verification.md
├── eradication/
│   ├── windows-persistence-checklist.md
│   ├── credential-eviction.md
│   └── verification.md
├── recovery/
│   ├── recovery-plan.md
│   ├── validation-results.md
│   └── acceptance.md
├── communications/
│   └── situation-updates.md
├── handoff/
│   ├── handoff-summary.md
│   ├── open-actions.md
│   └── escalation-conditions.md
├── MANIFEST.json
└── SHA256SUMS
```

## 46. Quality Gates

| Gate | Pass condition |
| --- | --- |
| **Declaration** | Incident ID, time, owner, severity, and trigger recorded |
| **Timeline** | Opened immediately and maintained in UTC |
| **Analytical clarity** | Known, assessed, assumed, and unknown separated |
| **Triage** | Host, user, process, network, clinical, and data context reviewed |
| **Preservation** | Evidence at risk from containment acquired first when feasible |
| **Custody** | Every artifact has source, collector, time, method, and hash |
| **Containment decision** | Options and operational trade-offs documented |
| **Containment proof** | Intended restriction verified |
| **Scope** | Related users, hosts, destinations, and behaviors searched |
| **Severity** | Reassessed after material changes |
| **Eradication** | Process, persistence, credentials, network, and entry path addressed |
| **Eradication proof** | Absence tested after restart, trigger, or authentication attempt |
| **Recovery** | Technical and clinical tests passed |
| **Monitoring** | Heightened monitoring and re-escalation triggers defined |
| **Handoff** | Incoming analyst can continue without oral reconstruction |
| **Traceability** | Decisions and actions reference evidence |

## 47. Professional Judgment

- Protect life and patient safety first.
- Preserve evidence before destructive actions when delay is safe.
- Contain first when delay creates immediate harm, spread, destruction, or exfiltration risk.
- A legitimate binary can perform malicious behavior.
- Killing one process is not equivalent to containment.
- Isolating one host is not equivalent to scoping the incident.
- Resetting one password is not equivalent to credential eviction.
- Removing one artifact is not equivalent to eradication.
- System availability is not proof of trustworthy recovery.
- A verification step must test the condition that mattered.
- Severity must change when scope or impact changes.
- A written decision should reflect the evidence available at that moment.
- Do not rewrite old decisions using facts learned later.
- Separate confirmed evidence from analytical assessment and temporary assumptions.
- A strong handoff is a measurable operational outcome.

## 48. Framework and Tool Map

| Item | Purpose |
| --- | --- |
| **NIST SP 800-61 Rev. 3** | Integrate detection, response, recovery, and improvement with risk management |
| **NIST SP 800-86** | Forensic evidence sources, collection, examination, analysis, and reporting |
| **CISA IR Playbook** | Operational containment, eradication, recovery, coordination, and checklists |
| **CISA Eviction Strategies Tool** | Build coordinated actor-aware containment and eviction plans |
| **Microsoft IR playbooks** | Prerequisites, workflows, checklists, investigation, containment, and recovery guidance |
| **CISA AA22-277A** | Real incident context for Impacket, remote services, account auditing, and segmentation |
| **MITRE ATT&CK** | Lateral movement and related behavior vocabulary |
| **LOLBAS** | Context for legitimate Windows tools with abuse-capable functions |
| **EDR** | Isolation, process, file, and behavioral evidence |
| **Identity provider** | Account, session, token, MFA, and audit response |
| **Firewall and DNS** | Network containment and verification |
| **Case management** | Timeline, decisions, actions, evidence, and handoff |

## 49. Fast Recall

- **Open the timeline at declaration, not after containment.**
- **Use UTC and preserve original timestamps.**
- **Separate known, assessed, assumed, and unknown.**
- **Preserve what the next action will destroy.**
- **Contain first when delay creates immediate safety or threat risk.**
- **Every containment choice has evidence and operational costs.**
- **Containment is incomplete until verified.**
- **When scope expands, reassess severity immediately.**
- **Search user, host, destination, hash, path, command, process chain, and remote-service behavior.**
- **A clinical asset requires continuity planning before disruptive action when time permits.**
- **Eradication covers process, file, service, task, registry, WMI, credentials, network, and initial access.**
- **Credential eviction includes sessions, tokens, keys, MFA, consent, and dependent services.**
- **MSBuild is suspicious through context, not name alone.**
- **Remote-execution response must contain both credentials and movement paths.**
- **Removed is an action. Verified absent is a result.**
- **Recovery requires clean source, controls, monitoring, clinical validation, and approval.**
- **Every decision needs time, evidence, trade-offs, authority, and expected result.**
- **Every action needs an owner and completion proof.**
- **The handoff should eliminate basic clarification questions.**
- **Document everything in the order it happened.**

## 50. Resources

**Incident response and forensics**
- [NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final)
- [NIST SP 800-86](https://csrc.nist.gov/pubs/sp/800/86/final)
- [CISA Federal Cybersecurity Incident and Vulnerability Response Playbooks](https://www.cisa.gov/resources-tools/resources/federal-government-cybersecurity-incident-and-vulnerability-response-playbooks)
- [CISA Eviction Strategies Tool](https://www.cisa.gov/resources-tools/resources/eviction-strategies-tool)

**Operational response**
- [Microsoft Incident Response Playbooks](https://learn.microsoft.com/en-us/security/operations/incident-response-playbooks)
- [CISA AA22-277A](https://www.cisa.gov/news-events/cybersecurity-advisories/aa22-277a)

**Adversary behavior**
- [MITRE ATT&CK Lateral Movement](https://attack.mitre.org/tactics/TA0008/)
- [LOLBAS MSBuild](https://lolbas-project.github.io/lolbas/Binaries/Msbuild/)
