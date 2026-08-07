# Endpoint Detection & Telemetry

> **⚠️ AUTHORIZED USE ONLY.** This material is for education, defensive telemetry engineering, and authorized system administration. Apply these simulations and logging controls only to systems you own or are explicitly authorized to test. Controlled attacker-like actions can trigger alerts, create noisy logs, expose sensitive command content, or disrupt services if run carelessly. Validate in a lab first, scope every action, preserve a recovery path, and never run simulation commands against third-party systems. See the [Legal and Terms of Use](/legal) page.

> `You cannot protect what you cannot see.` — SANS Institute, Blue Team Operations motto

> **Scope:** Endpoint telemetry validation for hardened Windows and Linux systems: Sysmon, PowerShell Script Block Logging, Module Logging, transcription, Windows Event Logs, Linux auditd, auth.log, telemetry quality assessment, controlled attack simulation, ground-truth correlation, JSON export, normalized timestamps, detection matrices, MITRE ATT&CK mapping, and evidence handoff to the SOC.

---

## Table of Contents
- [Core Concepts](#core-concepts)
- [Endpoint Telemetry Fundamentals](#endpoint-telemetry-fundamentals)
- [Windows Telemetry Sources](#windows-telemetry-sources)
- [Linux Telemetry Sources](#linux-telemetry-sources)
- [Telemetry Engineering Methodology](#telemetry-engineering-methodology)
- [Sysmon Event IDs and Attacker Behavior](#sysmon-event-ids-and-attacker-behavior)
- [PowerShell Logging Controls](#powershell-logging-controls)
- [Linux auditd Rules and Records](#linux-auditd-rules-and-records)
- [auth.log and Authentication Visibility](#authlog-and-authentication-visibility)
- [Controlled Attack Simulation](#controlled-attack-simulation)
- [Ground Truth Logging](#ground-truth-logging)
- [Detection Matrix Construction](#detection-matrix-construction)
- [Telemetry Quality Assessment](#telemetry-quality-assessment)
- [JSON Export and Normalization](#json-export-and-normalization)
- [MITRE ATT&CK Mapping](#mitre-attck-mapping)
- [Coverage Gap Analysis](#coverage-gap-analysis)
- [Professional Judgment](#professional-judgment)
- [Framework and Tool Map](#framework-and-tool-map)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Concepts

| Term | Meaning |
|---|---|
| **Telemetry** | Security-relevant records produced by endpoints, services, sensors, and logs |
| **Visibility** | The ability to observe attacker-relevant behavior after it happens or while it is happening |
| **Protection** | A control that blocks, restricts, or reduces what an attacker can do |
| **Detection** | The process of identifying suspicious or malicious behavior from telemetry |
| **Ground truth** | The authoritative record of what was intentionally simulated, when, by whom, and on which host |
| **Coverage** | The percentage of expected security-relevant actions that produced usable telemetry |
| **Normalization** | Converting different log formats into consistent fields, timestamps, and record structure |
| **SOC handoff** | A structured evidence package analysts can ingest, search, correlate, and trust |


### The core idea

```text
Hardening reduces attacker options
     ↓
Telemetry records attacker behavior
     ↓
Detection turns records into alerts
     ↓
Response turns alerts into containment
```

The distinction from hardening is one of purpose. Hardening asks: **Can the attacker do this?** Telemetry asks: **If the attacker does this anyway, will we know?** A defended endpoint without visibility may still be compromised silently. An observable endpoint gives the SOC evidence, time, and a path to response.

## 2. Endpoint Telemetry Fundamentals

### Structure

Endpoint telemetry is organized from raw events up to analyst-ready evidence.

```text
Raw logs          native records from Windows, Linux, applications, and sensors
 ↓
Parsed events     fields extracted from raw records
 ↓
Normalized JSON   consistent schema, timestamps, hostnames, users, event types
 ↓
Detection matrix  expected action compared to captured evidence
 ↓
SOC package       exports, metadata, gaps, and analyst notes
```

### What telemetry controls

Telemetry does not usually block an attacker. It controls **knowledge**: what happened, when it happened, which account or process did it, where it ran, what it touched, and whether the environment can prove it. The value is not merely collecting logs; the value is proving that the right events exist with enough context to investigate.

### The crown jewels

These are the highest-value telemetry sources in this project:
| Source | Why it matters |
|---|---|
| **Sysmon Operational log** | Detailed Windows endpoint behavior: process, network, DNS, file, registry, and injection signals |
| **PowerShell logs** | Decoded command content, module activity, and attacker living-off-the-land behavior |
| **Windows Security log** | Logons, account use, process creation, privilege use, and audit events |
| **auditd records** | Kernel-level Linux audit records for execution, file access, privilege changes, and system calls |
| **auth.log / secure** | SSH, sudo, su, PAM, and authentication outcomes on Linux systems |


## 3. Windows Telemetry Sources

Windows visibility depends on multiple logs working together. Sysmon gives targeted endpoint telemetry, PowerShell logging exposes script behavior, and the Security log records authentication and audit events.

### Primary sources
| Source | Location | Primary use |
|---|---|---|
| **Sysmon** | Microsoft-Windows-Sysmon/Operational | Process, network, DNS, file, registry, and injection telemetry |
| **PowerShell Operational** | Microsoft-Windows-PowerShell/Operational | Script Block Logging, engine activity, command content |
| **PowerShellCore Operational** | PowerShellCore/Operational | PowerShell 7+ logging and script block telemetry |
| **Security log** | Windows Security Event Log | Logons, process creation, account changes, privilege use |
| **AppLocker logs** | Microsoft-Windows-AppLocker/* | Application control audit or enforcement decisions |


### Security reality

No single Windows log is enough. Sysmon may show that a process ran, PowerShell may show the decoded command, Security may show the logon context, and AppLocker may show whether execution would have been blocked. Correlation is the point.

## 4. Linux Telemetry Sources

Linux visibility combines kernel audit records, authentication logs, shell history where appropriate, systemd journal entries, and service logs. In this project, auditd and auth.log are the required foundation.

### Primary sources
| Source | Typical location | Primary use |
|---|---|---|
| **auditd** | /var/log/audit/audit.log | System calls, file watches, command execution, privilege use |
| **auth.log** | /var/log/auth.log | SSH, sudo, su, PAM authentication events on Debian/Ubuntu systems |
| **secure** | /var/log/secure | Authentication events on many RHEL-like systems |
| **journalctl** | systemd journal | Service activity and system events |
| **application logs** | /var/log/* or app-specific paths | Service-specific evidence and operational context |


### The security reality

Linux telemetry quality depends heavily on rules. auditd only records what the kernel audit subsystem is configured to watch. A running audit daemon with weak rules can create a false sense of visibility.

## 5. Telemetry Engineering Methodology

Telemetry engineering follows a validation sequence, not a hope-based deployment model.

```text
Inventory                 know systems, sensors, logs, and configured rules
 ↓
Define behaviors          list attacker-like actions that must be visible
 ↓
Create ground truth       record each simulated action precisely
 ↓
Run simulations           execute safe, controlled activity
 ↓
Collect telemetry         export Windows and Linux records
 ↓
Normalize                 convert to consistent JSON
 ↓
Correlate                 match ground truth to captured events
 ↓
Score coverage            measure complete, partial, missing, noisy
 ↓
Document gaps             map to risk and MITRE ATT&CK
 ↓
Package for SOC           deliver analyst-ready evidence
```

**Priority order,** highest value first:
- **Execution telemetry**, because every intrusion eventually runs something.
- **Authentication telemetry**, because attackers rely on valid credentials.
- **Network telemetry**, because command-and-control, lateral movement, and exfiltration need communication.
- **File and registry telemetry**, because payloads, persistence, and configuration changes leave traces.
- **Privilege escalation telemetry**, because compromise becomes impact when privileges increase.

## 6. Sysmon Event IDs and Attacker Behavior

Sysmon events are behavioral building blocks. A single event may be benign, but a sequence forms an investigation timeline.

### Critical Sysmon events
| Event ID | Meaning | Attacker behavior exposed |
|---|---|---|
| **1** | Process creation | Execution, LOLBin abuse, suspicious command lines |
| **3** | Network connection | C2, exfiltration, lateral movement attempts |
| **7** | Image loaded | DLL loading, suspicious module use, hijacking preparation |
| **8** | CreateRemoteThread | Process injection into another process |
| **10** | Process access | Credential theft attempts such as access to LSASS |
| **11** | File creation | Payload drops, staging, tool transfer |
| **12 / 13 / 14** | Registry object or value activity | Persistence, configuration changes, evasion |
| **16** | Sysmon configuration change | Telemetry tampering or sensor weakening |
| **22** | DNS query | Beaconing, suspicious infrastructure lookup, DGA-like behavior |


### Reading them for detection
| Pattern | Likely meaning |
|---|---|
| **Event 1** followed by **Event 3** | A newly launched process reached out to the network |
| PowerShell **Event 1** plus suspicious command line | Living-off-the-land execution requiring PowerShell log correlation |
| **Event 10** targeting lsass.exe | Credential access attempt or security tool inspection |
| **Event 13** under Run keys | Possible registry persistence |
| **Event 16** outside maintenance | Possible attempt to weaken or change telemetry collection |


## 7. PowerShell Logging Controls

PowerShell is an administrator tool and an attacker tool. Logging must reveal both the fact that PowerShell ran and the content it executed.

### Controls
| Control | What it records | Why it matters |
|---|---|---|
| **Script Block Logging** | The content of script blocks processed by PowerShell | Captures decoded commands, functions, and scripts, including many encoded or obfuscated payloads |
| **Module Logging** | Pipeline execution events for configured modules | Shows cmdlet and module-level activity that may not be obvious from process telemetry alone |
| **Transcription** | Interactive PowerShell input and output | Creates a session-style record that complements event logs |
| **PowerShell engine logs** | PowerShell start, stop, provider, and engine activity | Establishes session context and timeline |


### Event IDs worth knowing
| Event ID | Meaning |
|---|---|
| **4103** | Module logging / pipeline execution detail |
| **4104** | Script Block Logging content |
| **400 / 403** | PowerShell engine start and stop |
| **600** | Provider lifecycle activity |


**Accuracy note:** Script Block Logging can record sensitive content if scripts handle credentials, tokens, or secrets. Use protected logging where appropriate, restrict log access, and treat exported logs as sensitive evidence.

## 8. Linux auditd Rules and Records

auditd is the userspace component of the Linux Audit system and writes audit records to disk. Rules determine what is captured, and events often consist of multiple records sharing the same timestamp and serial number.

### Rule types
| Rule type | Example purpose | What it reveals |
|---|---|---|
| **Watch rule** | Monitor sensitive files such as /etc/passwd or /etc/sudoers | Read, write, execute, and attribute changes on watched paths |
| **Syscall rule** | Monitor execve, setuid, socket, connect, or chmod behavior | Kernel-level action details tied to users and processes |
| **Control rule** | Set audit behavior such as immutable mode | Whether audit configuration can be changed without reboot |
| **Keyed rule** | Add a searchable key such as identity-change or priv-esc | Analyst-friendly filtering and correlation |


### Common audit record fields
| Field | Meaning |
|---|---|
| **type** | Record category such as SYSCALL, PATH, CWD, EXECVE, USER_AUTH, USER_CMD |
| **msg=audit(time:serial)** | Timestamp and event serial used to group related records |
| **auid** | Audit user ID, often the original logged-in user |
| **uid / euid** | Real and effective user identity at execution time |
| **comm** | Command name |
| **exe** | Executable path |
| **key** | Rule label used for searching and reporting |


## 9. auth.log and Authentication Visibility

auth.log is the Linux authentication timeline. It gives context for SSH access, sudo elevation, su attempts, PAM decisions, and failed authentication.

### What to watch
| Pattern | Likely meaning |
|---|---|
| Repeated failed SSH password attempts | Password spraying or brute force |
| Accepted SSH login from unusual source | Possible valid-credential intrusion |
| sudo command by unexpected user | Possible privilege escalation or policy gap |
| su failure followed by sudo success | Interactive privilege probing |
| Authentication gap during known simulation | Export, time sync, or log source coverage issue |


### The correlation rule

Authentication logs answer **who got in**. auditd answers **what they did after they got in**. Together they turn a login event into an activity timeline.

## 10. Controlled Attack Simulation

Controlled simulation creates safe, repeatable actions that should produce telemetry. The point is not exploitation; the point is evidence.

### Simulation categories
| Behavior | Expected Windows signal | Expected Linux signal |
|---|---|---|
| **Process creation** | Sysmon 1, Security 4688 | auditd EXECVE or SYSCALL execve |
| **Network connection** | Sysmon 3, possibly DNS 22 | auditd socket/connect if configured, service logs |
| **File creation** | Sysmon 11 | auditd PATH/SYSCALL for watched paths |
| **Registry modification** | Sysmon 12/13/14 | Not applicable; use file/config watch equivalents |
| **Privilege escalation** | Security privilege-use and logon events | auth.log sudo/su plus auditd USER_CMD/SYSCALL |


### Safe simulation principles
- Use benign commands and local test files.
- Label every action with a unique test ID.
- Avoid destructive payloads, credential dumping, exploit code, or third-party targets.
- Run one behavior at a time when validating field completeness.
- Record exact start and stop time in UTC.
- Never confuse an attack simulation with permission to attack.

## 11. Ground Truth Logging

Ground truth is the answer key. Without it, you cannot know whether telemetry is complete, late, missing, or merely hard to find.

### Minimum ground-truth fields
| Field | Records |
|---|---|
| **test_id** | Unique identifier for the simulation action |
| **timestamp_utc** | Action start time in UTC |
| **host** | Endpoint where the action ran |
| **user** | Account used for the action |
| **behavior** | Process, network, file, registry, authentication, privilege escalation |
| **command_summary** | Safe description of what was run, without unnecessary secrets |
| **expected_sources** | Logs that should contain evidence |
| **operator** | Person who ran the simulation |


### The validation equation

```text
Expected behavior + known time window + known host + known user
     ↓
Search telemetry
     ↓
Confirm matching event fields
     ↓
Score complete, partial, missing, or noisy
```

## 12. Detection Matrix Construction

A detection matrix is the proof table. It compares what you did to what your sensors captured.

### Matrix fields
| Field | Meaning |
|---|---|
| **test_id** | Ground-truth action identifier |
| **behavior** | Simulated attacker-like behavior |
| **expected_event** | Event type, record type, or log source that should appear |
| **observed_event** | Actual matching event found |
| **status** | Complete, partial, missing, noisy, or false positive risk |
| **evidence_pointer** | File name, event record ID, timestamp, or JSON record reference |
| **notes** | Analyst explanation and next action |


### Scoring
| Score | Meaning |
|---|---|
| **Complete** | Expected telemetry exists with usable timestamp, host, user, process, and action context |
| **Partial** | Telemetry exists but lacks key fields or requires weak inference |
| **Missing** | No matching telemetry found in the expected window |
| **Noisy** | Telemetry exists but is difficult to isolate from excessive unrelated events |


## 13. Telemetry Quality Assessment

Telemetry quality is measurable. Good telemetry is complete, timely, consistent, searchable, and useful for decisions.

### Quality dimensions
| Dimension | Question |
|---|---|
| **Event type distribution** | Are important event classes present, or are logs dominated by low-value noise? |
| **Time coverage** | Are there collection gaps, clock drift, missing periods, or timezone inconsistencies? |
| **Field completeness** | Do records include host, user, process, command, parent, path, IP, and event identifiers where expected? |
| **Correlation value** | Can records be linked across sources using time, host, user, process GUID, PID, or audit serial? |
| **Noise level** | Can an analyst find the behavior without drowning in irrelevant events? |
| **Export reliability** | Do exports preserve evidence and parse correctly as JSON? |


### Coverage percentage
Complete detections ÷ total expected detections × 100 = coverage percentage  
A high score is not the goal by itself. The goal is trustworthy evidence. A lower score with clearly documented gaps is better than a vague claim of full visibility.

## 14. JSON Export and Normalization

Raw logs are not a SOC handoff package. Exports must be structured, normalized, and consistent enough for analysts to search immediately.

### Required normalized fields
| Field | Purpose |
|---|---|
| **timestamp_utc** | Single normalized timestamp format for cross-host correlation |
| **host** | Endpoint identity |
| **os_family** | Windows or Linux |
| **source** | Sysmon, PowerShell, Security, auditd, auth.log, journal |
| **event_id** | Windows Event ID, Sysmon ID, audit record type, or normalized event name |
| **user** | Account associated with the action |
| **process_name** | Executable or command name |
| **command_line** | Command context where safe and available |
| **parent_process** | Execution chain context |
| **src_ip / dst_ip / dst_port** | Network correlation fields |
| **file_path / registry_path** | Object modified, created, or accessed |
| **raw_event** | Original event text or structured payload for evidentiary traceability |


### Export rules

Use UTC, preserve raw evidence, document parser assumptions, avoid dropping fields prematurely, and validate that every output file is valid JSON. The SOC should receive records it can ingest, but investigators should still be able to trace a normalized field back to the original source.

### SOC handoff package

The handoff package is the final product. It should be usable by an analyst who did not run the simulations.

### Required package contents
| Artifact | Purpose |
|---|---|
| **README.md** | Explains package structure, hosts, time range, timezone, and assumptions |
| **ground_truth.json** | Authoritative simulation action log |
| **windows_events.json** | Normalized Windows telemetry export |
| **linux_events.json** | Normalized Linux telemetry export |
| **detection_matrix.csv or .json** | Expected versus observed coverage results |
| **coverage_summary.md** | Executive summary of completeness, gaps, and risk |
| **mitre_mapping.md** | Technique mapping and detection rationale |
| **gaps_and_exceptions.md** | Known limitations and remediation plan |


### Analyst-ready means

The SOC should not have to ask what timezone was used, which host generated which logs, what test ID means, or whether timestamps were normalized. If the package needs an explanation that is not included, it is not finished.

## 15. MITRE ATT&CK Mapping

MITRE ATT&CK mapping connects observed telemetry to adversary behavior. It is not decoration; it tells the SOC what tactic or technique the evidence supports.

### Common project mappings
| Behavior | Likely ATT&CK area | Useful telemetry |
|---|---|---|
| PowerShell execution | Command and Scripting Interpreter: PowerShell | Sysmon 1, PowerShell 4104, PowerShell 4103 |
| Suspicious process launch | Command and Scripting Interpreter / User Execution | Sysmon 1, Security 4688, auditd EXECVE |
| Outbound connection | Application Layer Protocol / Command and Control | Sysmon 3, Sysmon 22, firewall or network logs |
| Registry persistence | Boot or Logon Autostart Execution | Sysmon 12, 13, 14 |
| sudo or su elevation | Privilege Escalation | auth.log, auditd USER_CMD, auditd SYSCALL |
| Sensitive file modification | Defense Evasion / Persistence / Credential Access depending on path | auditd PATH and SYSCALL records |


### Accuracy note

ATT&CK maps behavior, not intent. A legitimate admin action and a malicious action may map to the same technique. The matrix should say what the telemetry supports, not overclaim that every mapped event is malicious.

## 16. Coverage Gap Analysis

A coverage gap is not failure. An undocumented gap is failure.

### Gap types
| Gap | Meaning |
|---|---|
| **Sensor gap** | The required tool or log source is not installed, enabled, or forwarding |
| **Rule gap** | The sensor exists, but its configuration does not capture the behavior |
| **Field gap** | The event exists, but lacks fields needed for investigation |
| **Time gap** | Clock drift, timezone mismatch, or missing collection window blocks correlation |
| **Parsing gap** | Raw evidence exists, but the export or parser loses structure |
| **Noise gap** | Events exist, but they are too noisy to support practical detection without filtering |


### Document every gap
| Field | Records |
|---|---|
| **Gap** | What was not captured or not usable |
| **Risk** | Which attacker behavior may be missed |
| **Affected hosts** | Where the gap exists |
| **ATT&CK mapping** | Relevant technique or tactic |
| **Fix** | Rule, configuration, parser, or operational change needed |
| **Owner** | Person or team responsible |


## 17. Professional Judgment

Telemetry engineering requires balance. More logs can improve visibility, but excessive logging can create cost, privacy, performance, and analyst-noise problems.  
**Increase telemetry when** the behavior is high-risk, investigation value is clear, and operational impact is acceptable.  
**Document an exception when** a telemetry source, rule, or export field must be skipped, recording four things:
| Field | Records |
|---|---|
| **Risk** | The attacker behavior or investigation question that may be missed |
| **Reason** | Why the telemetry cannot be collected or exported now |
| **Compensating control** | Alternative log source, detection, or operational process |
| **Approval** | Risk owner who accepted the visibility limitation |


A missing event is a finding. A hidden missing event is a future incident report.

## 18. Framework and Tool Map

| Item | Purpose |
|---|---|
| **Sysmon** | Detailed Windows endpoint telemetry |
| **Windows Event Log** | Native Windows event storage and export source |
| **PowerShell Script Block Logging** | Decoded PowerShell command and script visibility |
| **PowerShell Module Logging** | Pipeline and module activity visibility |
| **PowerShell Transcription** | Interactive command session recording |
| **auditd** | Linux kernel audit records for system calls and watched paths |
| **auth.log / secure** | Linux authentication and privilege-use timeline |
| **MITRE ATT&CK** | Behavioral mapping for adversary techniques and detection coverage |
| **JSON** | Structured export format for analyst ingestion |
| **Detection matrix** | Coverage proof comparing ground truth to captured telemetry |


## 19. Fast Recall
- **Hardening reduces what attackers can do.** Telemetry reveals what attackers are doing.
- **Visibility is not protection.** Protection blocks; visibility proves and detects.
- **Ground truth is the answer key.** Without it, coverage cannot be measured.
- **Sysmon essentials:** 1 process creation, 3 network connection, 7 image loaded, 8 remote thread, 10 process access, 11 file create, 13 registry value set, 16 config change, 22 DNS query.
- **PowerShell essentials:** 4104 script block content, 4103 module or pipeline detail, transcription for session context.
- **auditd essentials:** SYSCALL, EXECVE, PATH, CWD, USER_AUTH, USER_CMD, plus shared timestamp and serial for event grouping.
- **auth.log answers who authenticated.** auditd helps answer what they did after authentication.
- **Start with safe simulations:** process, network, file, registry, authentication, privilege use.
- **Normalize timestamps to UTC.** Timezone drift destroys correlation.
- **Export JSON with consistent fields.** Raw logs in many formats are not a SOC package.
- **Score coverage:** complete, partial, missing, noisy.
- **Document gaps by risk, reason, affected hosts, ATT&CK mapping, fix, and owner.**
- **ATT&CK maps behavior, not guilt.** Mapping does not automatically mean an event is malicious.
- **The SOC handoff must stand alone.** If an analyst cannot understand it without you, it is incomplete.
- **A missing event is a finding.** A silent missing event is a liability.

## 20. Resources

**Sysmon**
- [Microsoft Sysinternals: Sysmon](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon)
- [Microsoft: Sysmon events](https://learn.microsoft.com/en-us/windows/security/operating-system-security/sysmon/sysmon-events)  
**PowerShell logging**
- [Microsoft: about_Logging for Windows PowerShell 5.1](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_logging?view=powershell-5.1)
- [Microsoft: about_Logging_Windows for PowerShell 7+](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_logging_windows)  
**Linux Audit**
- [auditd Linux manual page](https://www.man7.org/linux/man-pages/man8/auditd.8.html)
- [Red Hat: Understanding Audit Log Files](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/7/html/security_guide/sec-understanding_audit_log_files)
- [Red Hat: Auditing the system](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/8/html/security_hardening/auditing-the-system_security-hardening)  
**MITRE ATT&CK and data sources**
- [MITRE ATT&CK: Data Sources](https://attack.mitre.org/datasources/)
- [MITRE ATT&CK: Data and Tools](https://attack.mitre.org/resources/attack-data-and-tools/)
- [MITRE ATT&CK Data Model: Detections, Data Sources, and STIX](https://mitre-attack.github.io/attack-data-model/docs/principles/attack-detections/)  
**Telemetry engineering and SOC handoff**
- [SANS: Endpoint Detection and Response](https://www.sans.org/white-papers/endpoint-detection-response/)
- [MITRE Center for Threat-Informed Defense: Atomic Data Sources](https://ctid.mitre.org/projects/atomic-data-sources/)
