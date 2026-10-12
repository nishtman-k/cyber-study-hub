# Threat Hunting

"The absence of evidence is not evidence of absence." - Threat hunting principle

> **⚠️ AUTHORIZED USE ONLY.** This material is for education, defensive threat hunting, and authorized security analysis. Hunt only within datasets and environments you are permitted to access. Preserve source exports, protect account and host data, document query scope, and never treat a weak anomaly as proof of compromise. Threat-hunting findings should move through approved escalation, incident-response, and detection-engineering processes. See the [Legal and Terms of Use](/legal) page.

**Scope:** Hypothesis-driven threat hunting with local SIEM exports and baseline artifacts: hunt planning, positive-finding definitions, telemetry validation, administrator baselining, maintenance-schedule filtering, service-account authorization, off-hours analysis, Living Off The Land activity, PsExec, WMI, PowerShell Remoting, credential misuse, lateral movement, evidence correlation, attack timelines, ATT&CK mapping, hunt-to-detection conversion, coverage-gap analysis, SOC reporting, and leadership communication.

## Table of Contents

- [Core Concepts](#core-concepts)
- [Detection Versus Threat Hunting](#detection-versus-threat-hunting)
- [Threat Hunting Loop](#threat-hunting-loop)
- [Hunt Inputs](#hunt-inputs)
- [Hunt Hypothesis Development](#hunt-hypothesis-development)
- [Positive Finding Definition](#positive-finding-definition)
- [Hunt Scope and Boundaries](#hunt-scope-and-boundaries)
- [Telemetry Validation](#telemetry-validation)
- [Baseline Requirements](#baseline-requirements)
- [Administrator Behavior Baseline](#administrator-behavior-baseline)
- [Authorized Schedule Baseline](#authorized-schedule-baseline)
- [Service Account Authorization Matrix](#service-account-authorization-matrix)
- [Living Off The Land](#living-off-the-land)
- [Contextual Risk Model](#contextual-risk-model)
- [Off-Hours Analysis](#off-hours-analysis)
- [PsExec Hunting](#psexec-hunting)
- [WMI Hunting](#wmi-hunting)
- [PowerShell Remoting Hunting](#powershell-remoting-hunting)
- [Service Account Misuse](#service-account-misuse)
- [Credential and Authentication Evidence](#credential-and-authentication-evidence)
- [Lateral Movement Correlation](#lateral-movement-correlation)
- [Reconnaissance and Staging](#reconnaissance-and-staging)
- [jq Hunting Toolkit](#jq-hunting-toolkit)
- [Frequency and Rarity Analysis](#frequency-and-rarity-analysis)
- [Sequence and Time-Window Analysis](#sequence-and-time-window-analysis)
- [Hunt Findings](#hunt-findings)
- [Unified Attack Timeline](#unified-attack-timeline)
- [ATT&CK Mapping](#attck-mapping)
- [Hunt Outcomes](#hunt-outcomes)
- [Hunt to Detection](#hunt-to-detection)
- [Coverage Illusion](#coverage-illusion)
- [Remaining Gaps](#remaining-gaps)
- [Threat Hunting Report](#threat-hunting-report)
- [Evidence Package](#evidence-package)
- [Quality Gates](#quality-gates)
- [Professional Judgment](#professional-judgment)
- [Framework and Tool Map](#framework-and-tool-map)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Concepts

| Term                     | Meaning                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| **Threat hunting**       | Proactive, hypothesis-driven search for threat activity not already surfaced by automated detections |
| **Hypothesis**           | Testable statement describing suspected behavior, context, and expected evidence                     |
| **Baseline**             | Documented reference for normal users, hosts, times, tools, targets, and sequences                   |
| **Positive finding**     | Evidence pattern defined in advance that would support the hypothesis                                |
| **Negative finding**     | Sufficient data was searched and the defined behavior was not found                                  |
| **Inconclusive finding** | Data quality or visibility prevents the hypothesis from being resolved                               |
| **Living Off The Land**  | Abuse of legitimate tools, binaries, scripts, or administration functions                            |
| **Pivot**                | New search derived from an entity or relationship found during a hunt                                |
| **Hunt lead**            | Suspicious result requiring validation or deeper investigation                                       |
| **Hunt package**         | Queries, baselines, evidence, findings, timelines, gaps, and detection proposals                     |

### The core idea

```text
Advisory or coverage gap
     ↓
Testable hypothesis
     ↓
Expected positive evidence
     ↓
Validated telemetry and baseline
     ↓
Queries and pivots
     ↓
Correlated findings
     ↓
Incident, detection, baseline update, or gap
```

Threat hunting is not browsing logs until something looks unusual. It is a documented analytical experiment with a defined question, evidence requirements, and measurable outcome.

## 2. Detection Versus Threat Hunting

| Detection                                                | Threat hunting                                                           |
| -------------------------------------------------------- | ------------------------------------------------------------------------ |
| Waits for a rule or model to generate an alert           | Begins with a hypothesis and searches data directly                      |
| Executes continuously or on a schedule                   | Usually time-bounded and analyst-led                                     |
| Uses predetermined matching logic                        | Iterates through pivots and contextual questions                         |
| Optimized for repeatability and queue handling           | Optimized for discovery and learning                                     |
| Requires stable logic and acceptable false-positive rate | Can tolerate exploratory queries and manual validation                   |
| Output is an alert                                       | Output may be an incident, detection, baseline update, or visibility gap |

### Example distinction

```text
Detection:
Alert whenever PsExec is observed.

Hunt:
Determine whether PsExec originated from a non-administration workstation,
used an unauthorized account, targeted a critical server,
and occurred outside an approved maintenance window.
```

### Relationship

A successful hunt should improve future automated detection. Repeated hunts for the same stable behavior indicate that the logic may be ready for operationalization.

## 3. Threat Hunting Loop

```text
Prepare
     ↓
Hypothesize
     ↓
Collect and validate
     ↓
Query
     ↓
Pivot and enrich
     ↓
Correlate
     ↓
Conclude
     ↓
Operationalize
     ↓
Measure and repeat
```

### Loop outputs

| Phase              | Output                                                                       |
| ------------------ | ---------------------------------------------------------------------------- |
| **Prepare**        | Hunt requirement and advisory summary                                        |
| **Hypothesize**    | Testable hypothesis and positive definition                                  |
| **Validate**       | Telemetry coverage report                                                    |
| **Query**          | Reproducible query set and result counts                                     |
| **Pivot**          | Entity and relationship expansion                                            |
| **Correlate**      | Timeline and evidence chain                                                  |
| **Conclude**       | Supported, not supported within the tested scope, or inconclusive hypothesis |
| **Operationalize** | Detection, hunt, baseline, or collection change                              |

## 4. Hunt Inputs

| Input                      | Purpose                                              |
| -------------------------- | ---------------------------------------------------- |
| **Threat advisory**        | Describes behaviors, time patterns, and likely tools |
| **ATT&CK gap analysis**    | Identifies uncovered techniques and telemetry needs  |
| **SIEM exports**           | Provides searchable normalized evidence              |
| **Administrator baseline** | Defines ordinary tools, sources, targets, and users  |
| **Maintenance schedule**   | Identifies approved windows and systems              |
| **Service-account matrix** | Defines authorized logon paths and purposes          |
| **Asset inventory**        | Adds role, site, zone, criticality, and owner        |
| **Change records**         | Explains approved unusual activity                   |
| **Previous incidents**     | Supplies known internal patterns and entities        |
| **Detection catalog**      | Shows what would already have alerted                |

### Working directory and query schema

Create a working package and run subsequent commands from its root. Place verified, read-only copies of normalized exports in `exports/`, authorization records in `baselines/`, and labeled query fixtures in `tests/`.

```bash
mkdir -p threat_hunting/{exports,work,scope,telemetry,baselines,queries,results,findings,timeline,attack,detections,gaps,reports,tests}
cd threat_hunting || exit 1
```

These examples assume one JSON object per line, UTC timestamps normalized to the same fixed-width format, and consistent field types. `.source_type` identifies the log source; `.source` is an object describing the initiating host or IP. `.host.name` identifies the event-producing host. Interpret host roles using event context before correlating source and target.

```json
{
  "event_id": "evt-example-001",
  "source_type": "authentication",
  "timestamp_utc": "2026-09-08T02:14:00Z",
  "event": { "category": ["authentication"], "action": "logon" },
  "user": { "name": "svc-example", "type": "service" },
  "source": { "host": "workstation-07", "ip": "192.0.2.7" },
  "host": { "name": "database-01" }
}
```

For this target-side authentication event, `host.name` is the target host. Adapt exports to this schema; retain the original source records and document every field mapping. Resolve account aliases and casing before matching matrix entries. The matrix is one JSON object with an `accounts` array; each account has `account`, `source_hosts`, and `target_hosts` fields. `.user.type` must come from trusted inventory enrichment, not a guessed account-name prefix. Missing enrichment is a baseline gap.

### Input rule

Never assume the advisory behavior maps directly to local fields. Translate each behavioral statement into the available schema and document missing fields.

## 5. Hunt Hypothesis Development

A useful hypothesis specifies actor behavior, affected entities, context, and expected evidence.

### Hypothesis template

```text
If [threat behavior] occurred in [environment and time range],
then [specific telemetry] should show [observable pattern]
that differs from [documented baseline].
```

### Example hypotheses

```text
H1: If lateral movement used PsExec, process and service telemetry should show
remote execution from a non-administration source to a server outside an approved window.
```

```text
H2: If WMI was used for remote discovery or execution, WMI and process events
should show unusual remote targets, commands, or source hosts between 01:00 and 05:00.
```

```text
H3: If a stolen service account enabled lateral movement, authentication events
should show that account logging in from a source or to a target not listed in its authorization matrix.
```

```text
H4: If PowerShell Remoting staged files, process, remoting, file, and network events
should form a sequence linking a pivot host to a target server and a new staged artifact.
```

### Hypothesis quality checks

- Testable with available evidence.
- Expressed in observable terms.
- Time-bounded.
- Includes expected baseline deviation.
- Can produce supported, not supported within the tested scope, or inconclusive outcomes.
- Relevant to a defensive decision.

## 6. Positive Finding Definition

Define a positive result before running the main query. This reduces hindsight bias.

### Positive finding fields

| Field                   | Purpose                                     |
| ----------------------- | ------------------------------------------- |
| **required evidence**   | Events that must exist                      |
| **contextual evidence** | Conditions that raise confidence            |
| **exclusions**          | Known authorized patterns                   |
| **correlation keys**    | User, source, destination, process, or time |
| **time window**         | Maximum separation between related events   |
| **minimum confidence**  | Threshold for escalation                    |

### Example

```json
{
  "hypothesis_id": "HUNT-H1",
  "positive_requires": [
    "PsExec-compatible remote execution evidence",
    "Source host outside approved administration hosts",
    "Target server outside source host's normal peer set"
  ],
  "confidence_increases": [
    "Activity between 01:00 and 05:00",
    "Service account outside authorization matrix",
    "File staging follows within 15 minutes"
  ],
  "exclusions": ["Matching approved maintenance ticket"]
}
```

### Positive-definition rule

A single tool execution may be a lead. A positive hunt finding should satisfy the behavior and context defined by the hypothesis.

## 7. Hunt Scope and Boundaries

### Scope fields

| Field               | Example                                                                   |
| ------------------- | ------------------------------------------------------------------------- |
| **Time range**      | Last 14 full days in UTC                                                  |
| **Environment**     | Production Windows hosts                                                  |
| **Sites and zones** | Business, application, server, or management zones                        |
| **Accounts**        | Administrators and service accounts                                       |
| **Tools**           | PsExec, WMI, PowerShell Remoting                                          |
| **Techniques**      | Remote execution and lateral movement behaviors                           |
| **Data sources**    | Authentication, process, service, WMI, remoting, file, and network events |
| **Exclusions**      | Approved test and maintenance systems                                     |

### Boundaries

- Exported evidence may not include every source event.
- Missing alerts are not the same as missing activity.
- Data retention may truncate the beginning of the window.
- Clock skew can break sequence analysis.
- Normalization can lose source-specific fields.
- Successful network connectivity does not prove successful authentication.

## 8. Telemetry Validation

A negative hunt is meaningful only when the required telemetry is present and complete.

### Validation checks

| Check                 | Question                                                           |
| --------------------- | ------------------------------------------------------------------ |
| **Source presence**   | Are required log sources represented?                              |
| **Host coverage**     | Are all in-scope hosts reporting?                                  |
| **Time coverage**     | Does each source cover the full 14-day window?                     |
| **Field coverage**    | Are user, source, target, process, command, and outcome populated? |
| **Volume anomalies**  | Are there unexpected gaps or duplicate bursts?                     |
| **Timestamp quality** | Are events normalized to UTC and ordered correctly?                |
| **Retention**         | Was any evidence aged out?                                         |
| **Export limits**     | Were results capped or sampled?                                    |

### Validation commands

```bash
jq -r '.source_type // "unknown"' exports/events.jsonl | sort | uniq -c | sort -nr

jq -r '[.source_type // "unknown", .host.name // "unknown"] | @tsv' exports/events.jsonl \
  | sort -u

jq -r '[.source_type // "unknown", ((.timestamp_utc // "unknown")[0:10])] | @tsv' exports/events.jsonl \
  | sort | uniq -c

jq -r 'select(.timestamp_utc == null or .host.name == null) | .event_id' exports/events.jsonl \
  | wc -l
```

### Negative-result rule

Do not write `activity did not occur` when the accurate conclusion is `activity was not observed in the available telemetry`.

## 9. Baseline Requirements

Hunting legitimate tools requires context that static IOCs cannot provide.

### Baseline dimensions

| Dimension           | Examples                                           |
| ------------------- | -------------------------------------------------- |
| **User**            | Approved administrator or service account          |
| **Source host**     | Management workstation or deployment server        |
| **Target host**     | Authorized server population                       |
| **Tool**            | PsExec, WMI, WinRM, PowerShell                     |
| **Time**            | Business hours or maintenance window               |
| **Frequency**       | Typical runs, target count, and duration           |
| **Command purpose** | Deployment, inventory, patching, or support        |
| **Sequence**        | Authentication, tool execution, file copy, cleanup |

### Baseline principle

A baseline should state what is known, the observation period, sample size, and exceptions. A list of approved tools without users, sources, targets, and times is not an adequate baseline.

## 10. Administrator Behavior Baseline

### Administrator profile

| Field                     | Purpose                                        |
| ------------------------- | ---------------------------------------------- |
| **administrator_id**      | User or team identity                          |
| **approved_source_hosts** | Normal administration workstations and servers |
| **approved_tools**        | Tools normally used                            |
| **approved_targets**      | Host groups or roles                           |
| **usual_hours**           | Expected activity periods                      |
| **maintenance_windows**   | Approved scheduled work                        |
| **typical_frequency**     | Normal target and execution counts             |
| **ticket_requirement**    | Required change or support record              |

### Baseline query

```bash
jq -r 'select(((.event.category // []) | index("process")) != null and .user.name != null) |
  [.user.name, .host.name, .process.name, .timestamp_utc[11:13]] | @tsv' exports/events.jsonl \
  | sort | uniq -c | sort -nr
```

### Baseline warning

Historical administrator activity may already contain compromise. Validate unusual baseline values against owners and change records before accepting them as normal.

## 11. Authorized Schedule Baseline

Maintenance windows reduce false positives only when they match the observed scope.

### Schedule checks

| Check             | Question                                                   |
| ----------------- | ---------------------------------------------------------- |
| **Time**          | Did the event occur within the approved interval?          |
| **Account**       | Was the observed user authorized?                          |
| **Source**        | Did the action originate from an approved management host? |
| **Target**        | Was the target included in the maintenance scope?          |
| **Tool**          | Was the administration method approved?                    |
| **Action**        | Does the command match the change purpose?                 |
| **Ticket status** | Was the work approved and active?                          |

### Filtering rule

A timestamp overlap alone is not sufficient. The user, source, target, tool, and action must fit the authorization record.

## 12. Service Account Authorization Matrix

Service accounts should have bounded purposes and predictable authentication paths.

### Matrix fields

| Field                   | Purpose                                 |
| ----------------------- | --------------------------------------- |
| **account**             | Service identity                        |
| **purpose**             | Business or technical function          |
| **source_hosts**        | Systems permitted to use the account    |
| **target_hosts**        | Systems the account may access          |
| **logon_types**         | Expected authentication types           |
| **protocols**           | SMB, WinRM, database, service, or batch |
| **time restrictions**   | Expected schedule                       |
| **interactive_allowed** | Whether interactive use is permitted    |
| **owner**               | Responsible team                        |
| **credential_rotation** | Rotation and management expectation     |

### Authorization check

```text
Observed account + source + target + logon type + protocol + time
     ↓ compare with
Authorization matrix
     ↓
Authorized, anomalous, or unknown
```

### High-risk deviations

- Interactive use of a non-interactive account.
- New source workstation.
- New target or cross-zone access.
- Off-hours use outside a batch schedule.
- Explicit credentials used from a user workstation.
- Broad authentication fan-out.
- Administrative share or remote execution shortly after login.

## 13. Living Off The Land

Living Off The Land activity uses legitimate functionality already trusted or expected in the environment. The [LOLBAS](https://lolbas-project.github.io/) project catalogs Windows binaries, scripts, and libraries with documented abuse-relevant functions such as execution, download, upload, persistence, and credential-related activity.

### Why static IOCs struggle

- The binary may be Microsoft-signed or legitimately installed.
- The filename and path may be expected.
- The same command family may be used by administrators.
- No attacker-controlled file hash is required.
- Internal protocols and infrastructure may be reused.
- Maliciousness depends on context and sequence.

### Context dimensions

```text
Who used the tool?
From which host?
Against which target?
At what time?
With which command?
Under which authorization?
What happened immediately before and after?
```

## 14. Contextual Risk Model

Score context components separately so that the analyst can explain the finding.

| Component    | Low risk                  | High risk                                       |
| ------------ | ------------------------- | ----------------------------------------------- |
| **User**     | Approved administrator    | Service account or unknown user                 |
| **Source**   | Dedicated management host | Non-administration workstation                  |
| **Target**   | Normal managed peer       | Critical database or identity server            |
| **Time**     | Approved window           | 01:00 to 05:00 without approval                 |
| **Tool**     | Expected for team         | Rare for source role                            |
| **Command**  | Documented maintenance    | Discovery, staging, or encoded execution        |
| **Sequence** | Ticketed deployment       | Credential anomaly followed by lateral movement |

### Risk formula example

```text
context_score =
  user_anomaly
  + source_anomaly
  + target_criticality
  + off_hours
  + command_risk
  + sequence_confirmation
  - approved_change_evidence
```

### Scoring caution

A score prioritizes review. It does not prove maliciousness.

## 15. Off-Hours Analysis

Off-hours activity is useful only relative to role, schedule, site, and business operations.

### UTC-aware extraction

```bash
jq -c '
  (try (.timestamp_utc[11:13] | tonumber) catch null) as $hour |
  select($hour != null and $hour >= 1 and $hour < 5)
' exports/events.jsonl > work/off_hours.jsonl
```

This filter uses an illustrative 01:00–05:00 UTC window, not local business hours. Validate timestamps first and convert site schedules to UTC for each date, including daylight-saving changes. Missing or invalid timestamps must be reported as data-quality gaps.

### Off-hours questions

- Which timezone governs the schedule?
- Does daylight-saving time affect the window?
- Are 24-hour business operations expected?
- Are backups, patching, or batch jobs scheduled?
- Is the user normally active at this time?
- Is the source host a management system?
- Does the target match the approved job scope?

### Time principle

Time is a contextual multiplier, not a standalone verdict.

## 16. PsExec Hunting

[PsExec](https://learn.microsoft.com/en-us/sysinternals/downloads/psexec) is a Microsoft administration tool for executing processes on remote systems. [MITRE ATT&CK](https://attack.mitre.org/software/S0029/) documents its use with remote services, administrative shares, lateral tool transfer, and temporary service execution.

### Expected evidence

| Source side                                               | Target side                               |
| --------------------------------------------------------- | ----------------------------------------- |
| PsExec-compatible process or command line                 | Network logon and remote-service activity |
| Authentication with explicit credentials where applicable | Administrative share access               |
| SMB connection to target                                  | Temporary executable or service artifact  |
| File copy when copy option is used                        | Service-started child process             |
| One-to-many execution pattern                             | Service deletion or cleanup               |

### Hunt filters

```bash
# Process name, original filename, or command-line evidence
jq -c 'select(
  ((.process.name // "") | ascii_downcase | contains("psexec")) or
  ((.process.command_line // "") | ascii_downcase | contains("psexec")) or
  ((.file.pe.original_file_name // "") | ascii_downcase == "psexec.c")
)' exports/events.jsonl

# Temporary service or PsExec-style service evidence
jq -c 'select(
  ((.event.category // []) | any(. == "process" or . == "configuration")) and
  (((.service.name // "") | ascii_downcase | contains("psexesvc")) or
   ((.process.name // "") | ascii_downcase | contains("psexesvc")))
)' exports/events.jsonl
```

### Contextual red flags

- Source is not an approved management host.
- Target is a critical server outside the user's normal scope.
- Activity occurs outside a maintenance window.
- Alternate or service credentials are used unexpectedly.
- Tool is renamed but metadata or behavior remains consistent.
- File copy, service creation, and execution occur in a short sequence.
- Execution fans out across many hosts.

### Tool-name caution

Do not rely only on `psexec.exe`. Renamed copies, alternate implementations, and equivalent remote-service patterns require behavioral hunting.

## 17. WMI Hunting

WMI supports local and remote management, inventory, process creation, and method execution. [MITRE ATT&CK](https://attack.mitre.org/techniques/T1047/) recommends correlating process creation, command execution, WMI events, and network connections for remote WMI abuse.

### Evidence sources

| Evidence                   | Hunt value                                             |
| -------------------------- | ------------------------------------------------------ |
| **WMI activity events**    | Query, namespace, consumer, filter, and result context |
| **Process creation**       | wmic, PowerShell WMI cmdlets, or WMI provider children |
| **WmiPrvSE child process** | Remote or provider-hosted execution clue               |
| **Network connections**    | DCOM, RPC, WinRM, or remote target relationships       |
| **Authentication events**  | User, source, target, and outcome                      |
| **Persistence artifacts**  | Permanent event subscription components                |

### Hunt filters

```bash
jq -c 'select(
  ((.process.name // "") | ascii_downcase) as $p |
  (($p == "wmic.exe") or ($p == "wmiprvse.exe") or
   ((.process.command_line // "") | ascii_downcase | contains("invoke-wmimethod")) or
   ((.process.command_line // "") | ascii_downcase | contains("get-wmiobject")) or
   ((.process.command_line // "") | ascii_downcase | contains("ciminstance")) or
   ((.process.parent.name // "") | ascii_downcase == "wmiprvse.exe"))
)' exports/events.jsonl
```

### Contextual red flags

- WMI command execution from a user workstation.
- `WmiPrvSE` launching shell or script interpreters.
- High target fan-out during a short interval.
- Queries outside the normal inventory schedule.
- Remote process creation on critical systems.
- WMI followed by service, file, or remoting activity.
- New event-consumer or subscription relationships.

## 18. PowerShell Remoting Hunting

[PowerShell](https://learn.microsoft.com/en-us/powershell/scripting/security/remoting/running-remote-commands) Remoting can execute commands across one or many systems using WS-Management; PowerShell 6 and later also support SSH-based remoting. It can establish interactive or persistent sessions.

### Evidence sources

| Evidence                        | Hunt value                                        |
| ------------------------------- | ------------------------------------------------- |
| **PowerShell operational logs** | Remoting, host, pipeline, and script context      |
| **Script block logs**           | Commands and decoded script content where enabled |
| **Process creation**            | PowerShell command line and parent process        |
| **WinRM events**                | Session and remote-management context             |
| **Network events**              | Source, target, and service ports                 |
| **Authentication**              | User, logon source, and outcome                   |
| **File events**                 | Staged scripts, archives, or payloads             |

### Command indicators

- `Invoke-Command`
- `Enter-PSSession`
- `New-PSSession`
- `ComputerName` parameter use
- `Session` parameter use
- Encoded or hidden PowerShell
- Remoting from a workstation not used for administration

### Hunt filter

```bash
jq -c 'select(
  (((.process.name // "") | ascii_downcase | contains("powershell")) or
   ((.process.name // "") | ascii_downcase == "pwsh.exe")) and
  (((.process.command_line // "") | ascii_downcase | contains("invoke-command")) or
   ((.process.command_line // "") | ascii_downcase | contains("enter-pssession")) or
   ((.process.command_line // "") | ascii_downcase | contains("new-pssession")) or
   ((.process.command_line // "") | ascii_downcase | contains("-computername")))
)' exports/events.jsonl
```

These command-line filters produce leads, not complete remoting coverage. Local `Invoke-Command` use can match, while commands inside scripts, aliases, renamed binaries, and SSH-based sessions may not. Correlate target-side `wsmprovhost.exe`, WinRM or SSH events, script logs, and authentication evidence.

### Contextual red flags

- Remoting launched from a compromised or non-admin workstation.
- Service account used interactively.
- Critical server targeted outside approved patching.
- Remoting followed by archive creation or new executable files.
- One source opens sessions to many targets.
- PowerShell runs under an unexpected parent process.

## 19. Service Account Misuse

Service-account misuse is a credential-compromise problem expressed through context.

### Hunt patterns

| Pattern              | Why it matters                                        |
| -------------------- | ----------------------------------------------------- |
| New source host      | Credential appears outside its assigned service       |
| New target host      | Account expands beyond authorized dependency          |
| Interactive logon    | Human use of a non-human account                      |
| Explicit credentials | Manual credential use or remote execution context     |
| Off-hours burst      | Operator-driven activity outside normal schedule      |
| Broad fan-out        | Lateral movement or discovery                         |
| Tool chain           | Account followed by PsExec, WMI, or remoting activity |
| Privilege change     | Account gains or uses unexpected rights               |

### Authorization comparison concept

```bash
jq -s --slurpfile matrix baselines/service-account-matrix.json '
  map(select(.user.name != null and .user.type == "service"))
  | map(. as $event |
      [$matrix[0].accounts[]? | select(.account == $event.user.name)] as $matches |
      ($matches[0] // null) as $auth |
      . + {hunt: {authorization:
        (if ($matches | length) > 1 then "unknown_duplicate_matrix_entries"
         elif $auth == null then "unknown_account_not_documented"
         elif $event.source.host == null or $event.host.name == null then "unknown_missing_host"
         elif ($auth.source_hosts | type) != "array" or
              ($auth.target_hosts | type) != "array" then "unknown_incomplete_matrix"
         elif ($auth.source_hosts | index($event.source.host)) == null or
              ($auth.target_hosts | index($event.host.name)) == null then "outside_host_allowlist"
         else "matches_host_allowlist"
         end)}}
    )
  | map(select(.hunt.authorization != "matches_host_allowlist"))
' exports/authentication.jsonl
```

This query checks host allowlists for accounts enriched as `.user.type = "service"`. It retains undocumented accounts and missing context as unknowns. A host-allowlist match does not validate logon type, protocol, schedule, tool, or ticket; check those separately.

### Matrix caution

An incomplete authorization matrix can generate false anomalies. Distinguish unauthorized from undocumented and assign owner validation.

## 20. Credential and Authentication Evidence

### Authentication dimensions

| Dimension      | Examples                                                    |
| -------------- | ----------------------------------------------------------- |
| **User**       | Administrator, service account, workstation user            |
| **Source**     | Host, IP, zone, or VPN origin                               |
| **Target**     | Server, workstation, database, or domain controller         |
| **Outcome**    | Success or failure                                          |
| **Logon type** | Interactive, network, service, batch, or remote interactive |
| **Method**     | Kerberos, NTLM, explicit credentials, WinRM, SMB            |
| **Time**       | Business hours, maintenance window, or off-hours            |
| **Sequence**   | Failures, success, remote execution, and staging            |

### Hunt questions

- Did failures precede success?
- Was the source new for the account?
- Did the account authenticate to an unusual role or site?
- Was NTLM used where Kerberos is normally expected?
- Was the account used shortly before remote execution?
- Did multiple privileged targets receive the same source account?
- Did a dormant account become active?

## 21. Lateral Movement Correlation

Individual events become meaningful when combined into a sequence.

### Correlation chain

```text
Credential anomaly
     ↓
Remote authentication success
     ↓
SMB, RPC, WMI, or WinRM connection
     ↓
PsExec, WMI, or PowerShell remote execution
     ↓
File staging or service creation
     ↓
Reconnaissance, collection, or next-hop authentication
```

### Correlation keys

| Key                      | Use                                          |
| ------------------------ | -------------------------------------------- |
| **User**                 | Link authentication and execution            |
| **Source host or IP**    | Identify pivot point                         |
| **Target host**          | Identify movement path                       |
| **Time window**          | Bind separate sources into one activity      |
| **Process GUID or PID**  | Link command and network behavior            |
| **Logon ID**             | Link session-specific events where available |
| **Service or task name** | Link persistence or execution artifacts      |
| **File path or hash**    | Link staging and execution                   |

### Correlation rule

Retain each source event ID. A correlation claim must be reversible to the events that support it.

## 22. Reconnaissance and Staging

### Reconnaissance indicators

- WMI inventory or system queries across many hosts.
- Account, group, process, service, or network enumeration.
- Broad connectivity tests.
- Database server discovery.
- Share enumeration and administrative-share access.

### Staging indicators

- New scripts or archives on remote systems.
- Temporary file paths followed by execution.
- PowerShell content copied through remoting.
- Share writes before service or process launch.
- Compression before transfer.
- Cleanup shortly after execution.

### Sequence principle

Reconnaissance and staging may be legitimate individually. Their combination with anomalous credentials, source hosts, targets, and time raises confidence.

## 23. jq Hunting Toolkit

[jq](https://jqlang.org/manual/) processes JSON as filters that accept input and produce output; filters can be chained to select, transform, group, and construct results.

### Core queries

```bash
# Select one user
jq -c 'select(.user.name == "svc-example")' exports/events.jsonl

# Select one source host
jq -c 'select(.source.host == "workstation-07")' exports/events.jsonl

# Select critical targets
jq -c 'select(.asset.criticality == "critical")' exports/events.jsonl

# Select events in a time range
jq -c 'select(
  .timestamp_utc >= "2026-09-01T00:00:00Z" and
  .timestamp_utc < "2026-09-15T00:00:00Z"
)' exports/events.jsonl

# Produce a compact investigation view
jq -r '[
  .timestamp_utc,
  .event_id,
  .user.name // "unknown",
  .source.host // .source.ip // "unknown",
  .host.name // "unknown",
  .process.name // .event.action // "unknown"
] | @tsv' exports/events.jsonl
```

Timestamp string comparisons assume every timestamp uses the same fixed-width UTC format. Normalize offsets and fractional-second precision before these comparisons. `jq -s` loads the full input into memory; use streaming aggregation or a database for exports too large to fit.

### Query design

- Filter by structured fields.
- Preserve event IDs.
- Use UTC timestamps.
- Export intermediate results.
- Record command and count.
- Avoid message-text matching unless structured fields are unavailable.
- Validate null and array handling.

## 24. Frequency and Rarity Analysis

### Useful rarity questions

| Question                                                   | Grouping                  |
| ---------------------------------------------------------- | ------------------------- |
| Which users run the tool rarely?                           | User and process          |
| Which source hosts have never administered servers before? | Source and target role    |
| Which accounts have new target systems?                    | User and target           |
| Which tools appear only off-hours?                         | Process and hour          |
| Which source hosts have broad fan-out?                     | Source and unique targets |
| Which targets receive unusual remote methods?              | Target and protocol       |

### Frequency commands

```bash
# Process by source host
jq -r 'select(.process.name != null) |
  [.source.host // .host.name // "unknown", .process.name] | @tsv' exports/events.jsonl \
  | sort | uniq -c | sort -nr

# User, source, and target combinations
jq -r 'select(.user.name != null and .host.name != null) |
  [.user.name, .source.host // .source.ip // "unknown", .host.name] | @tsv' exports/events.jsonl \
  | sort | uniq -c | sort -n

# Unique targets per source
jq -s 'map(select((.source.host // .source.ip) != null and .host.name != null)) |
  group_by(.source.host // .source.ip) |
  map({
    source: (.[0].source.host // .[0].source.ip),
    unique_targets: ([.[].host.name] | unique | length),
    targets: ([.[].host.name] | unique)
  }) | sort_by(-.unique_targets)' exports/events.jsonl
```

The fan-out query excludes events with missing source or target identities. Track excluded events as data-quality gaps. Here, `host.name` is the event-producing host; treat it as a remote target only for target-side events where that role is established. Process events alone do not prove a remote destination.

### Rarity caution

Rare does not mean malicious. It means the behavior deserves contextual validation.

## 25. Sequence and Time-Window Analysis

Living Off The Land behavior is often best detected as a sequence.

### Example sequence

```text
Service account login from new workstation
     ↓ within 5 minutes
SMB connection to database server
     ↓ within 2 minutes
Temporary service creation
     ↓ within 10 minutes
PowerShell Remoting session
     ↓ within 15 minutes
Archive or staged file appears
```

### Sequence record

```json
{
  "sequence_id": "SEQ-004",
  "user": "svc-example",
  "source": "workstation-07",
  "target": "database-01",
  "start_utc": "2026-09-08T02:12:00Z",
  "end_utc": "2026-09-08T02:28:30Z",
  "event_ids": ["evt-101", "evt-105", "evt-118", "evt-140"],
  "confidence": "high"
}
```

### Time-window rule

Choose windows based on the behavior being tested. Do not use one arbitrary interval for all correlations.

## 26. Hunt Findings

### Finding fields

| Field                      | Purpose                                               |
| -------------------------- | ----------------------------------------------------- |
| **finding_id**             | Stable identifier                                     |
| **hypothesis_id**          | Hunt hypothesis tested                                |
| **status**                 | Positive, negative, or inconclusive                   |
| **summary**                | Bounded conclusion                                    |
| **confidence**             | Strength of conclusion                                |
| **time_range**             | First and last related events                         |
| **entities**               | Users, sources, targets, and tools                    |
| **baseline_deviations**    | Context that differs from normal                      |
| **authorization_check**    | Schedule, matrix, ticket, and owner validation        |
| **event_ids**              | Supporting evidence                                   |
| **contradictory_evidence** | Facts that weaken the conclusion                      |
| **next_action**            | Escalation, detection, baseline, or collection change |

### Finding example

```json
{
  "finding_id": "HUNT-FND-002",
  "hypothesis_id": "HUNT-H1",
  "status": "positive",
  "summary": "A service account initiated PsExec-compatible remote execution from a non-administration workstation to a critical database server outside approved maintenance hours.",
  "confidence": "high",
  "baseline_deviations": [
    "New source host for account",
    "Target absent from authorization matrix",
    "Activity occurred at 02:14 UTC"
  ],
  "event_ids": ["evt-201", "evt-209", "evt-225"],
  "contradictory_evidence": [],
  "next_action": "Escalate as incident and preserve involved hosts"
}
```

## 27. Unified Attack Timeline

### Timeline fields

| Field              | Purpose                                                 |
| ------------------ | ------------------------------------------------------- |
| **timestamp_utc**  | Ordered event time                                      |
| **event_id**       | Source evidence reference                               |
| **source_type**    | Authentication, process, WMI, service, file, or network |
| **user**           | Identity involved                                       |
| **source_host**    | Pivot or initiating system                              |
| **target_host**    | Destination system                                      |
| **action**         | Observed behavior                                       |
| **interpretation** | Bounded meaning                                         |
| **confidence**     | Strength of interpretation                              |

### Timeline stages

```text
Credential access or first anomalous use
     ↓
Authentication to pivot or target
     ↓
Reconnaissance
     ↓
Remote execution
     ↓
Lateral movement
     ↓
File or script staging
     ↓
Collection, persistence, or next-hop activity
```

### Timeline rule

Order facts first. Add interpretation in a separate field. Avoid writing one continuous narrative before event order is validated.

## 28. ATT&CK Mapping

### Common behavior mappings

| Observed behavior                                 | ATT&CK context                                                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| PsExec remote execution through temporary service | System Services: Service Execution                                                                                 |
| PsExec over administrative shares                 | Remote Services: SMB/Windows Admin Shares                                                                          |
| Remote WMI command or process creation            | Windows Management Instrumentation                                                                                 |
| PowerShell command execution                      | PowerShell                                                                                                         |
| PowerShell Remoting over WinRM                    | Remote Services: Windows Remote Management (T1021.006); PowerShell (T1059.001) when command execution is supported |
| PowerShell Remoting over SSH                      | Remote Services: SSH (T1021.004); PowerShell (T1059.001) when command execution is supported                       |
| Service-account credential use                    | Valid Accounts context                                                                                             |
| Remote tool or script copied to target            | Lateral Tool Transfer                                                                                              |
| Host and service enumeration                      | Discovery techniques matching exact evidence                                                                       |

### Mapping record

```json
{
  "technique_id": "T1047",
  "status": "observed",
  "evidence_ids": ["evt-301", "evt-305"],
  "behavior": "Remote WMI process creation from a non-admin workstation",
  "confidence": "high",
  "coverage_before_hunt": "gap",
  "recommended_detection": "Correlate WMI execution, remote source, target role, and user context"
}
```

### Mapping rule

Map observed behavior, not the advisory alone. If the local data does not confirm a technique, classify it as not observed or unknown according to telemetry quality.

## 29. Hunt Outcomes

| Outcome              | Meaning                                                       | Required next step                                    |
| -------------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| **Positive**         | Evidence supports target threat behavior                      | Escalate, scope, contain through approval, and detect |
| **Negative**         | Adequate telemetry was searched and behavior was not observed | Record scope and schedule repeat if necessary         |
| **Inconclusive**     | Missing or unreliable telemetry prevents resolution           | Open collection gap                                   |
| **Benign deviation** | Activity is unusual but authorized and explained              | Update baseline with evidence                         |
| **Detection gap**    | Behavior exists but no automated detection covers it          | Create and validate rule                              |
| **Baseline gap**     | Normal authorization or schedule data is incomplete           | Assign owner and improve baseline                     |

### Outcome principle

A negative hunt can still be valuable if it validates telemetry, improves a baseline, and documents what remains unknown.

## 30. Hunt to Detection

Turn repeatable, high-confidence hunt logic into automated detection.

### Conversion workflow

```text
Positive hunt finding
     ↓
Identify minimum reliable predicate
     ↓
Add contextual fields and exclusions
     ↓
Build labeled positive and negative tests
     ↓
Measure TP, FP, TN, and FN
     ↓
Tune and deploy
     ↓
Monitor analyst workload and misses
```

### Detection opportunities

| Hunt insight                               | Detection concept                                 |
| ------------------------------------------ | ------------------------------------------------- |
| PsExec from non-admin source               | Remote service execution plus source-role anomaly |
| WMI remote execution off-hours             | WMI process chain plus time and target context    |
| Service account on new source              | Authorization-matrix violation                    |
| PowerShell Remoting followed by staging    | Remoting plus file creation sequence              |
| One source targeting many servers          | Lateral-movement fan-out threshold                |
| Explicit credentials then remote execution | Credential-to-execution correlation               |

### Detection caution

Do not turn every exploratory filter into an alert. Operational detections need stable fields, measured quality, and manageable analyst workload.

## 31. Coverage Illusion

ATT&CK coverage percentages can create false confidence when they count mappings instead of tested detection quality.

### Why percentages mislead

- One rule may cover only one implementation of a broad technique.
- Mapped rules may be untested.
- Required telemetry may be missing.
- Coverage may ignore user, source, target, and time context.
- Living Off The Land behavior can resemble approved administration.
- Attack sequences can occur across individually covered techniques without a correlation rule.
- Detection quality and response readiness may not be included.

### Better coverage dimensions

| Dimension            | Question                                                    |
| -------------------- | ----------------------------------------------------------- |
| **Telemetry**        | Is the required data collected and complete?                |
| **Detection**        | Does tested logic exist?                                    |
| **Behavior breadth** | Which implementations are actually covered?                 |
| **Context**          | Are user, source, target, time, and authorization included? |
| **Correlation**      | Can multi-step behavior be linked?                          |
| **Validation**       | Were malicious and benign tests performed?                  |
| **Operations**       | Can analysts investigate and respond?                       |

### Leadership explanation

```text
A mapped ATT&CK coverage percentage does not guarantee attack visibility.
Legitimate tools used in an unauthorized context may resemble maintenance.
Contextual hunting can expose this gap by combining tool use with account,
source, target, time, authorization, and sequence evidence.
```

## 32. Remaining Gaps

### Gap categories

| Gap                | Example                                                |
| ------------------ | ------------------------------------------------------ |
| **Telemetry gap**  | WMI operational events missing on some hosts           |
| **Field gap**      | Source workstation absent from authentication export   |
| **Baseline gap**   | Service-account owners or targets undocumented         |
| **Detection gap**  | No correlation of login, remote execution, and staging |
| **Retention gap**  | Data older than seven days unavailable                 |
| **Export gap**     | SIEM export capped or excludes raw events              |
| **Validation gap** | Rule exists but has no labeled tests                   |
| **Response gap**   | No owner or procedure for service-account compromise   |

### Gap record

```json
{
  "gap_id": "GAP-007",
  "type": "telemetry_gap",
  "description": "PowerShell script-block logging is absent on 18 percent of in-scope servers.",
  "hunt_impact": "Remote script content cannot be validated on affected systems.",
  "owner": "endpoint_engineering",
  "priority": "high",
  "recommended_action": "Enable and validate script-block collection"
}
```

## 33. Threat Hunting Report

### Required sections

| Section                  | Content                                                    |
| ------------------------ | ---------------------------------------------------------- |
| **Executive summary**    | Answer to the hunt question and business meaning           |
| **Hunt trigger**         | Advisory, incident, gap, or intelligence source            |
| **Scope**                | Time, systems, accounts, tools, and sources                |
| **Hypotheses**           | Testable statements and positive definitions               |
| **Data quality**         | Coverage, limitations, and gaps                            |
| **Baseline**             | Normal administration, schedule, and account authorization |
| **Methodology**          | Queries, pivots, and correlation approach                  |
| **Findings**             | Positive, negative, inconclusive, and benign results       |
| **Timeline**             | Unified evidence sequence                                  |
| **ATT&CK mapping**       | Techniques supported by local evidence                     |
| **New detections**       | Proposed or validated operational logic                    |
| **Coverage explanation** | Why mapped percentage did not guarantee visibility         |
| **Recommendations**      | Prioritized actions, owners, and deadlines                 |
| **Remaining gaps**       | Unknowns and collection requirements                       |

### SOC summary pattern

```text
The hunt identified one high-confidence lateral-movement sequence involving a service account, a non-administration workstation, remote-service execution, and a critical database server. The sequence occurred outside every approved maintenance window and violated the account authorization matrix. Two additional anomalies were explained by approved maintenance, and one WMI lead remains inconclusive because source-host telemetry is incomplete.
```

### Leadership summary pattern

```text
In this illustrative scenario, tool-name-only detections missed the activity. Correlating identity, source workstation, target criticality, time, authorization, and sequence supported the malicious interpretation. The hunt produced correlation-detection proposals and identified telemetry and account-governance gaps. Validate any claimed detection failure against the actual rule logic and telemetry.
```

## 34. Evidence Package

```text
threat_hunting/
├── README.md
├── exports/
│   ├── events.jsonl
│   └── authentication.jsonl
├── work/
├── tests/
│   ├── positive.jsonl
│   └── negative.jsonl
├── scope/
│   ├── hunt-plan.json
│   ├── hypotheses.json
│   └── positive-definitions.json
├── telemetry/
│   ├── source-coverage.json
│   └── data-quality.json
├── baselines/
│   ├── administrator-baseline.json
│   ├── maintenance-schedule.json
│   └── service-account-matrix.json
├── queries/
│   ├── psexec.jq
│   ├── wmi.jq
│   ├── powershell-remoting.jq
│   └── service-account-misuse.jq
├── results/
│   ├── query-summary.json
│   └── hunt-leads.jsonl
├── findings/
│   └── hunt-findings.jsonl
├── timeline/
│   └── attack-timeline.jsonl
├── attack/
│   └── technique-mapping.json
├── detections/
│   ├── proposed-rules.yml
│   └── validation-plan.json
├── gaps/
│   └── remaining-gaps.json
├── reports/
│   ├── soc-report.md
│   └── leadership-summary.md
├── MANIFEST.json
└── SHA256SUMS
```

### Package principle

Every finding must trace to a hypothesis, query, baseline comparison, authorization check, and source event.

## 35. Quality Gates

| Gate                    | Pass condition                                                       |
| ----------------------- | -------------------------------------------------------------------- |
| **Trigger**             | Advisory or coverage gap is documented                               |
| **Hypotheses**          | Each hypothesis is testable and time-bounded                         |
| **Positive definition** | Required evidence is defined before query execution                  |
| **Scope**               | Hosts, users, time, tools, and sources are explicit                  |
| **Telemetry**           | Coverage and export limitations are measured                         |
| **Baseline**            | Administrator, schedule, and service-account references exist        |
| **Queries**             | Commands are reproducible and preserve event IDs                     |
| **Results**             | Query counts and pivots are documented                               |
| **Context**             | User, source, target, time, command, and authorization are evaluated |
| **Findings**            | Positive, negative, or inconclusive status is justified              |
| **Correlation**         | Multi-source findings retain all evidence IDs                        |
| **ATT&CK**              | Mappings are supported by local observed behavior                    |
| **Detection**           | Proposed automation includes validation requirements                 |
| **Gaps**                | Remaining visibility and governance gaps have owners                 |
| **Integrity**           | Manifest and hashes verify                                           |

### Validation commands

Run from `threat_hunting/`. Create the root hash manifest using paths relative to this directory before final verification.

```bash
python3 - <<'PY'
import json
from pathlib import Path

for path in Path(".").rglob("*.json"):
    with path.open(encoding="utf-8") as stream:
        json.load(stream)

for path in Path(".").rglob("*.jsonl"):
    with path.open(encoding="utf-8") as stream:
        for number, line in enumerate(stream, 1):
            try:
                record = json.loads(line)
                if not isinstance(record, dict):
                    raise ValueError("expected one JSON object per line")
            except ValueError as error:
                raise SystemExit(f"{path}:{number}: {error}")

print("JSON syntax and JSONL record format validated; schemas still require validation.")
PY

# Compile standalone jq queries without executing them against null input.
find queries -name '*.jq' -print0 | while IFS= read -r -d '' query; do
    jq --slurpfile matrix baselines/service-account-matrix.json -f "$query" /dev/null >/dev/null || exit 1
done

# Example behavioral test: compare actual event IDs with labeled expectations.
jq -c -f queries/psexec.jq tests/positive.jsonl > results/psexec-positive.jsonl
jq -c -f queries/psexec.jq tests/negative.jsonl > results/psexec-negative.jsonl
sha256sum -c SHA256SUMS
```

The example fixture commands assume `psexec.jq` returns full event objects. Queries with external variables or files need the same bindings used during the hunt, including `--slurpfile matrix baselines/service-account-matrix.json` for the matrix query. Successful compilation does not establish correct results: compare outputs with expected evidence IDs, including missing accounts, missing fields, multi-category events, and benign administration.

## 36. Professional Judgment

### Decision principles

- No alert does not mean no activity.
- No query result does not prove absence unless telemetry is adequate.
- A legitimate tool is not automatically benign.
- A rare event is not automatically malicious.
- Off-hours activity is meaningful only relative to a schedule and role.
- A maintenance ticket explains only activity inside its scope.
- An undocumented service-account path is not automatically malicious, but it is a governance gap.
- Tool name alone is weaker than tool, account, source, target, time, and sequence.
- Context scores prioritize review; they do not prove compromise.
- Correlated evidence is stronger than isolated findings.
- Negative hunts should preserve scope, coverage, and limitations.
- Hunts should produce durable improvements in detections, baselines, collection, or response.

## 37. Framework and Tool Map

| Item                          | Purpose                                                                |
| ----------------------------- | ---------------------------------------------------------------------- |
| **Hypothesis-driven hunting** | Converts intelligence and gaps into testable searches                  |
| **MITRE ATT&CK**              | Behavior vocabulary and gap prioritization                             |
| **LOLBAS**                    | Catalog of abuse-relevant Windows binaries, scripts, and libraries     |
| **PsExec**                    | Legitimate remote-process execution tool requiring contextual analysis |
| **WMI**                       | Local and remote management, discovery, and execution interface        |
| **PowerShell Remoting**       | Remote command and session mechanism                                   |
| **Authentication logs**       | User, source, target, outcome, and logon context                       |
| **Process telemetry**         | Tool, parent, command, and execution evidence                          |
| **Service and WMI logs**      | Remote execution, persistence, and management evidence                 |
| **Network telemetry**         | SMB, RPC, WinRM, and target relationships                              |
| **jq**                        | Reproducible analysis of local JSON exports                            |
| **Baselines**                 | Administrator, schedule, and account authorization context             |

## 38. Fast Recall

- **Detection waits for a rule. Hunting starts with a hypothesis.**
- **Define the positive finding before running the main query.**
- **A hunt needs scope, evidence requirements, baseline, and measurable outcome.**
- **Validate telemetry before interpreting a negative result.**
- **Use `not observed in available telemetry`, not `did not happen`, when visibility is limited.**
- **Living Off The Land abuse depends on context: user, source, target, time, command, authorization, and sequence.**
- **PsExec, WMI, and PowerShell Remoting are legitimate tools that can support malicious lateral movement.**
- **Do not hunt only for filenames. Hunt for behavior and relationships.**
- **A complete TCP or remote-management connection does not prove successful user authentication.**
- **Off-hours activity is a multiplier, not proof.**
- **Maintenance filters must match user, source, target, tool, action, and time.**
- **Service-account use must be checked against an authorization matrix.**
- **New source, new target, interactive use, and broad fan-out are strong service-account leads.**
- **Rarity creates a lead, not a verdict.**
- **Sequence analysis is essential for credential use, lateral movement, reconnaissance, and staging.**
- **Preserve every event ID in correlated findings.**
- **Hunt outcomes include positive, negative, inconclusive, benign deviation, detection gap, and baseline gap.**
- **Operationalize stable findings into tested detections.**
- **ATT&CK coverage percentage does not measure telemetry quality, behavioral breadth, correlation, validation, or response readiness.**
- **A successful hunt improves future prevention, detection, collection, or response.**

## 39. Resources

**Threat behavior and lateral movement**

- [MITRE ATT&CK PsExec](https://attack.mitre.org/software/S0029/)
- [MITRE ATT&CK WMI Detection Strategy](https://attack.mitre.org/detectionstrategies/DET0364/)
- [MITRE ATT&CK Lateral Movement](https://attack.mitre.org/tactics/TA0008/)

**Living Off The Land and administration tools**

- [LOLBAS Project](https://lolbas-project.github.io/)
- [LOLBAS Repository](https://github.com/LOLBAS-Project/LOLBAS)
- [Microsoft PsExec Documentation](https://learn.microsoft.com/en-us/sysinternals/downloads/psexec)
- [Microsoft PowerShell Remote Commands](https://learn.microsoft.com/en-us/powershell/scripting/security/remoting/running-remote-commands)

**Querying**

- [jq Manual](https://jqlang.org/manual/)

**Man or help**

```text
man jq
man grep
man sort
man uniq
man wc
man date
```
