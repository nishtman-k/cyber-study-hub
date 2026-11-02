# Attack Reconstruction

"The investigator who sees only one piece of the puzzle risks drawing the wrong picture." - Digital forensics principle

> **⚠️ AUTHORIZED USE ONLY.** This material is for education, defensive incident reconstruction, and authorized forensic analysis. Preserve original evidence, document every transformation, respect legal holds and handling restrictions, and involve privacy, compliance, and legal counsel for regulatory decisions. This cheatsheet supports technical analysis and does not provide legal advice. See the [Legal and Terms of Use](/legal) page.

**Scope:** Full attack reconstruction from multi-source evidence: evidence intake, provenance, source authority, timeline normalization, clock-skew analysis, cross-evidence correlation, convergences and divergences, temporal anchors, confirmed and inferred sequences, memory and disk artifacts, firewall sessions, deleted archives, scheduled-task persistence, secondary-infrastructure assessment, dwell and breakout time, ATT&CK mapping with confidence, coverage-gap analysis, impact and exposure assessment, HIPAA-oriented evidence questions, executive reporting, technical reporting, evidence citations, uncertainty management, and remediation planning.

## Table of Contents
- [Core Concepts](#core-concepts)
- [Reconstruction Versus Summary](#reconstruction-versus-summary)
- [Reconstruction Workflow](#reconstruction-workflow)
- [Evidence Inventory](#evidence-inventory)
- [Evidence Preservation and Provenance](#evidence-preservation-and-provenance)
- [Source Authority Matrix](#source-authority-matrix)
- [Evidence Reliability](#evidence-reliability)
- [Evidence Claim Ledger](#evidence-claim-ledger)
- [Cross-Evidence Correlation](#cross-evidence-correlation)
- [Convergences](#convergences)
- [Divergences](#divergences)
- [Contradiction Resolution](#contradiction-resolution)
- [Time Normalization](#time-normalization)
- [Clock Skew and Timestamp Semantics](#clock-skew-and-timestamp-semantics)
- [Temporal Anchors](#temporal-anchors)
- [Timeline Construction](#timeline-construction)
- [Confirmed and Inferred Sequences](#confirmed-and-inferred-sequences)
- [Causality Versus Temporal Proximity](#causality-versus-temporal-proximity)
- [Dwell Time and Breakout Time](#dwell-time-and-breakout-time)
- [Operational Tempo](#operational-tempo)
- [Memory Evidence](#memory-evidence)
- [Disk Evidence](#disk-evidence)
- [Firewall Session Evidence](#firewall-session-evidence)
- [Scheduled Task Persistence](#scheduled-task-persistence)
- [Deleted Archive and Staging Analysis](#deleted-archive-and-staging-analysis)
- [Secondary Infrastructure Assessment](#secondary-infrastructure-assessment)
- [IOC Cross-Reference](#ioc-cross-reference)
- [Complete Attack Chain](#complete-attack-chain)
- [ATT&CK Mapping at Scale](#attck-mapping-at-scale)
- [Technique Confidence](#technique-confidence)
- [Coverage Gap Analysis](#coverage-gap-analysis)
- [Impact Assessment](#impact-assessment)
- [Data Exposure States](#data-exposure-states)
- [Exfiltration Assessment](#exfiltration-assessment)
- [HIPAA-Oriented Risk Questions](#hipaa-oriented-risk-questions)
- [Unknowns and Collection Gaps](#unknowns-and-collection-gaps)
- [Recommendations](#recommendations)
- [Attack Reconstruction Report](#attack-reconstruction-report)
- [Evidence Citation Model](#evidence-citation-model)
- [Executive Communication](#executive-communication)
- [Reconstruction Package](#reconstruction-package)
- [Quality Gates](#quality-gates)
- [Professional Judgment](#professional-judgment)
- [Framework and Tool Map](#framework-and-tool-map)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Concepts

| Term | Meaning |
| --- | --- |
| **Attack reconstruction** | Evidence-driven integration of fragmented observations into one bounded chronological account |
| **Evidence item** | Preserved source artifact such as a file, event, packet, memory object, or report |
| **Claim** | Statement the reconstruction asks the evidence to support |
| **Temporal anchor** | High-confidence event used to position less certain events |
| **Convergence** | Independent sources support the same material claim |
| **Divergence** | Sources conflict, omit, or support different interpretations |
| **Provenance** | Origin, custody, transformation, and analytical history of evidence |
| **Dwell time** | Time between initial compromise and discovery or containment, depending on the stated definition |
| **Breakout time** | Time from initial foothold to lateral movement or expansion beyond the first system |
| **Operational tempo** | Pace and spacing of adversary actions across the attack |

### The core idea

```text
Preserve all sources
     ↓
Normalize evidence and time
     ↓
Build a claim ledger
     ↓
Find convergences and divergences
     ↓
Resolve contradictions
     ↓
Construct a bounded timeline
     ↓
Map behavior, scope, and impact
     ↓
State knowns, unknowns, and recommendations
```

A reconstruction is credible when another analyst can trace every material statement to specific evidence and reproduce the reasoning.

## 2. Reconstruction Versus Summary

| Summary | Reconstruction |
| --- | --- |
| Repeats earlier conclusions | Re-evaluates conclusions against all evidence |
| Organizes findings by project or source | Organizes activity by time, entity, phase, and claim |
| Preserves contradictions without resolution | Investigates why evidence differs |
| Lists ATT&CK techniques | Maps techniques to exact evidence and confidence |
| Lists IOCs | Cross-references role, first seen, last seen, and source |
| Describes impact generally | Maps affected assets to data and business consequences |
| Reports what is known | Reports known, probable, possible, disproved, and unknown |

### Reconstruction question

```text
What happened, in what order, to which assets and data,
with what evidence, confidence, impact, and remaining uncertainty?
```

## 3. Reconstruction Workflow

| Phase | Main activity | Output |
| --- | --- | --- |
| **Intake** | Inventory and hash every source | Evidence manifest |
| **Normalize** | Standardize entities, timestamps, and identifiers | Normalized evidence records |
| **Assess** | Grade source authority and evidence reliability | Source matrix |
| **Decompose** | Turn reports into individual claims | Claim ledger |
| **Correlate** | Join events by time, user, host, process, network, file, and behavior | Correlation graph |
| **Resolve** | Explain contradictions and gaps | Divergence register |
| **Sequence** | Establish anchors and event order | Master timeline |
| **Map** | Attach ATT&CK techniques and attack phases | Technique matrix |
| **Assess impact** | Map access and activity to assets and data | Impact assessment |
| **Report** | Produce technical and executive accounts | Reconstruction report |
| **Improve** | Prioritize remediation, detection, and collection | Recommendation package |

## 4. Evidence Inventory

### Evidence families

| Domain | Examples | Best used for |
| --- | --- | --- |
| **Email** | Raw messages, headers, URLs, attachments | Delivery and targeting |
| **Network** | PCAP, DNS, TLS, firewall sessions, NetFlow | Communications and transfer patterns |
| **Endpoint** | Process, file, registry, task, service, and EDR data | Execution, persistence, staging |
| **Memory** | Processes, connections, modules, handles, volatile credentials | State at acquisition time |
| **Disk** | Files, deleted artifacts, MFT, prefetch, task XML | Historical host behavior |
| **Identity** | Authentication, VPN, account, and session records | Credential use and access paths |
| **SIEM** | Normalized and correlated events | Broad search and cross-source linkage |
| **Threat intelligence** | Advisories, infrastructure, malware, and TTPs | External context and hypotheses |
| **Asset records** | Role, owner, criticality, and classification | Scope and impact |
| **IR notes** | Analyst observations and actions | Leads, not automatic facts |

### Inventory fields

| Field | Purpose |
| --- | --- |
| **evidence_id** | Stable reference |
| **source_path** | Original location |
| **source_type** | Memory, disk, firewall, summary, or reference |
| **system_or_scope** | Host, network segment, account, or campaign |
| **collection_start_utc** | Beginning of represented time |
| **collection_end_utc** | End of represented time |
| **acquired_at_utc** | Acquisition time |
| **collector** | Tool or team |
| **sha256** | Integrity hash |
| **handling** | Access, TLP, legal hold, or privacy requirements |
| **limitations** | Gaps, truncation, parsing, or clock issues |

### Intake commands

```bash
find reconstruction_input -type f -printf '%P\t%s\n' | sort > work/source-inventory.tsv
find reconstruction_input -type f -print0 | sort -z | xargs -0 sha256sum > work/source-SHA256SUMS
find reconstruction_input -name '*.json' -print0 | xargs -0 -n1 jq empty
```

## 5. Evidence Preservation and Provenance

### Provenance chain

```text
Original source
     ↓ hash
Verified working copy
     ↓ parse or extract
Derived artifact
     ↓ analyze
Finding
     ↓ cite
Report claim
```

### Derived-artifact fields

| Field | Purpose |
| --- | --- |
| **derived_id** | Stable identifier |
| **parent_evidence_ids** | Original evidence inputs |
| **command_or_method** | Reproducible transformation |
| **tool_version** | Repeatability |
| **generated_at_utc** | Creation time |
| **analyst** | Responsible person |
| **sha256** | Derived-artifact integrity |
| **transformations** | Parsing, decoding, normalization, or filtering |

### Preservation principles

- Never edit an original artifact.
- Hash before and after transfer.
- Record timezone and timestamp semantics.
- Preserve raw values alongside normalized values.
- Distinguish evidence from analyst notes.
- Record failed parsing and unsupported records.
- Preserve contradictory evidence.
- Track every correction as derived metadata.

## 6. Source Authority Matrix

Different sources are authoritative for different claims.

| Claim | Strongest direct source | Supporting sources | Common limitations |
| --- | --- | --- | --- |
| Email delivery and header path | Raw message and gateway record | User report | Forwarding can alter evidence |
| DNS query and network session | PCAP or sensor record | Firewall, proxy, DNS log | Capture location and loss |
| Process active at memory capture | Memory image | EDR and process logs | Snapshot only |
| Historical execution | Prefetch, MFT, process logs | Memory and sandbox | Deletion and retention gaps |
| Scheduled-task definition | Task XML and registry artifacts | Event logs and memory | Creation time may be uncertain |
| Authentication success | Identity or target security log | Network session | Network connection is not authentication |
| File content and hash | Acquired file | Sandbox report | Sample may be incomplete or transformed |
| Data classification | Current authoritative asset inventory | Owner confirmation | Classification may be stale |
| Regulatory conclusion | Privacy and legal review | Technical evidence | Analyst is not legal authority |

### Authority rule

The most convenient source is not always the most authoritative source. Use the source closest to the event or object while accounting for its collection limitations.

## 7. Evidence Reliability

### Reliability factors

- Direct observation versus analyst interpretation.
- Original artifact versus derived summary.
- Completeness and collection scope.
- Integrity verification.
- Timestamp quality.
- Tool and parser limitations.
- Independence from other sources.
- Possibility of attacker manipulation.
- Consistency with physical or protocol constraints.

### Evidence confidence

| Rating | Meaning |
| --- | --- |
| **High** | Direct, preserved, reliable evidence with independent support |
| **Moderate** | Credible evidence with one meaningful limitation or unresolved alternative |
| **Low** | Indirect, incomplete, single-source, or weakly attributable evidence |

### Reliability caution

Two reports that copied the same original observation are not two independent sources.

## 8. Evidence Claim Ledger

Break previous reports into atomic claims instead of importing conclusions wholesale.

### Claim fields

| Field | Purpose |
| --- | --- |
| **claim_id** | Stable identifier |
| **claim_text** | One testable statement |
| **claim_type** | Fact, assessment, hypothesis, or assumption |
| **source_refs** | Evidence references |
| **supporting_refs** | Independent support |
| **contradictory_refs** | Evidence against the claim |
| **status** | Confirmed, probable, possible, disproved, or unknown |
| **confidence** | High, moderate, or low |
| **reasoning** | Why the status was assigned |
| **information_needed** | Evidence required to resolve uncertainty |

### Claim example

```json
{
  "claim_id": "CLM-042",
  "claim_text": "WS-RECV-03 contained a scheduled task that executed nightly at 02:00.",
  "claim_type": "fact",
  "source_refs": [
    "MEM-001:scheduled_task_extract",
    "DISK-001:task_xml"
  ],
  "contradictory_refs": [],
  "status": "confirmed",
  "confidence": "high"
}
```

## 9. Cross-Evidence Correlation

Correlation joins evidence through shared entities and relationships.

### Correlation keys

| Key | Examples |
| --- | --- |
| **Time** | Normalized UTC and uncertainty range |
| **Host** | Hostname, asset ID, IP, MAC, or disk identity |
| **User** | Account, SID, email, service account, or logon ID |
| **Process** | PID, process GUID, executable, parent, command line |
| **Network** | Source, destination, port, protocol, domain, SNI |
| **File** | Path, filename, SHA-256, MFT entry, archive member |
| **Persistence** | Task name, task action, service, Run key |
| **Technique** | Behavior mapped to ATT&CK |
| **Case** | Incident, finding, alert, or evidence package ID |

### Correlation rule

Every join must state the correlation key and uncertainty. A matching filename alone is weaker than a matching hash, path, time, user, and parent process.

## 10. Convergences

A convergence occurs when independent sources support the same material conclusion.

### Examples

| Claim | Source one | Source two | Confidence effect |
| --- | --- | --- | --- |
| Scheduled-task persistence | Memory registry extract | Disk task XML | Raises to high |
| Archive staging | Recovered deleted archive | MFT and prefetch timeline | Raises to high |
| External connection | Memory active connection | Firewall session record | Raises to high |
| Malware execution | Prefetch entry | Process or sandbox behavior | Raises confidence |
| Credential use | Authentication record | Remote-execution sequence | Raises confidence |

### Convergence record

```json
{
  "convergence_id": "CNV-011",
  "claim_id": "CLM-042",
  "independent_sources": ["memory", "disk"],
  "evidence_refs": ["MEM-001:task", "DISK-001:task_xml"],
  "effect": "confidence_increased_from_moderate_to_high"
}
```

### Independence rule

Confirm that sources were collected independently and did not simply restate one report.

## 11. Divergences

A divergence is a difference that requires explanation, not concealment.

### Divergence types

| Type | Example |
| --- | --- |
| **Timestamp conflict** | PCAP and SIEM record the same connection at different times |
| **Presence conflict** | IOC appears in malware strings but not observed network data |
| **Technique conflict** | Intelligence inferred one technique, local evidence confirms another variant |
| **Identity conflict** | IP maps to different hosts across DHCP periods |
| **Scope conflict** | One source covers a segment that another source does not |
| **Interpretation conflict** | IR notes call traffic C2 while evidence also supports legitimate software |
| **Collection conflict** | Deleted files exist on disk but are absent from endpoint logs |

### Divergence record

```json
{
  "divergence_id": "DIV-006",
  "topic": "Timestamp of initial external connection",
  "source_a": "PCAP frame 4812 at 02:14:07.418Z",
  "source_b": "SIEM event evt-220 at 02:19:09Z",
  "possible_causes": [
    "five-minute host clock skew",
    "SIEM ingestion timestamp used instead of event timestamp"
  ],
  "status": "resolved",
  "resolution": "SIEM field was ingestion time; PCAP time retained as primary event anchor"
}
```

## 12. Contradiction Resolution

### Resolution workflow

```text
State the exact contradiction
     ↓
Inspect original values and timestamp types
     ↓
Compare source coverage and collection points
     ↓
Check clock, timezone, ingestion, and parsing behavior
     ↓
Test alternative explanations
     ↓
Resolve, bound, or leave explicitly unresolved
```

### Common causes

- UTC versus local time.
- Daylight-saving offset.
- Host clock skew.
- Sensor clock skew.
- Event time versus ingestion time.
- Start time versus end time.
- Rounded timestamps.
- NAT or DHCP reassignment.
- Packet duplication or asymmetric routing.
- Parser timezone assumptions.
- Log retention gaps.
- Deleted or overwritten artifacts.
- Export row limits.

### Resolution principle

Do not force agreement. When the evidence cannot be reconciled, document the competing interpretations and their consequences.

## 13. Time Normalization

Store original and normalized timestamps together.

### Time record

```json
{
  "source": "siem",
  "original_timestamp": "2026-09-08 22:14:09 -0400",
  "timestamp_type": "event_time",
  "normalized_utc": "2026-09-09T02:14:09Z",
  "precision": "seconds",
  "clock_correction_seconds": -2,
  "uncertainty_seconds": 2
}
```

### Normalization steps

1. Identify the timestamp field's meaning.
2. Preserve the original string.
3. Identify timezone or offset.
4. Convert to UTC.
5. Record precision.
6. Apply documented clock correction only when supported.
7. Record uncertainty.
8. Never silently replace the original.

### Command examples

```bash
date -u -d '2026-09-08 22:14:09 -0400' '+%Y-%m-%dT%H:%M:%SZ'

jq -r '[.timestamp_original, .timestamp_utc, .event_id] | @tsv' normalized/events.jsonl \
  | sort -k2,2
```

## 14. Clock Skew and Timestamp Semantics

### Timestamp semantics

| Timestamp | Meaning |
| --- | --- |
| **Event time** | Time assigned when activity occurred |
| **Collection time** | Time sensor obtained evidence |
| **Ingestion time** | Time SIEM accepted the record |
| **File creation time** | Filesystem metadata, subject to manipulation and semantics |
| **File modification time** | Content-change metadata |
| **MFT entry time** | NTFS metadata with specific update behavior |
| **Memory acquisition time** | Snapshot collection interval |
| **Session start and end** | Boundaries of network communication |

### Skew estimation

Use a shared event visible in two trusted sources, calculate the offset, test it against several events, and apply only within the period where the offset is stable.

```text
clock_offset = source_time - trusted_reference_time
```

### Skew caution

A host clock can drift or be corrected during the incident. One offset may not apply to the entire timeline.

## 15. Temporal Anchors

Temporal anchors are fixed points with high-confidence time evidence.

### Strong anchors

- Gateway-recorded email delivery.
- PCAP packet timestamp from a synchronized sensor.
- Firewall session start tied to sensor time.
- Memory acquisition start and end.
- Verified identity-provider authentication.
- Change-ticket or isolation action recorded by a trusted system.
- File hash acquisition and imaging time.

### Anchor fields

| Field | Purpose |
| --- | --- |
| **anchor_id** | Stable reference |
| **event** | Anchored activity |
| **timestamp_utc** | Normalized time |
| **uncertainty_seconds** | Time tolerance |
| **source_refs** | Evidence support |
| **reason_for_authority** | Why this timestamp is trusted |

### Anchor principle

Use anchors to order weaker artifacts. Do not treat every timestamp as equally reliable.

## 16. Timeline Construction

### Timeline fields

| Field | Purpose |
| --- | --- |
| **timeline_id** | Stable event identifier |
| **timestamp_utc** | Normalized time |
| **earliest_utc and latest_utc** | Uncertainty interval when exact time is unavailable |
| **source_refs** | Evidence citations |
| **actor_or_user** | Identity involved |
| **source_asset** | Initiating system |
| **target_asset** | Affected system |
| **action** | Factual event description |
| **attack_phase** | Initial access, persistence, lateral movement, or other phase |
| **sequence_status** | Confirmed or inferred relationship |
| **confidence** | High, moderate, or low |
| **notes** | Contradictions, assumptions, and limitations |

### Timeline sorting

```bash
jq -s 'sort_by(.timestamp_utc, .timeline_id)' work/timeline-events.jsonl \
  > work/master-timeline.json

jq -r '.[] | [
  .timestamp_utc,
  .timeline_id,
  .source_asset // "",
  .target_asset // "",
  .action,
  .confidence
] | @tsv' work/master-timeline.json
```

### Construction principle

Build the factual timeline before writing the narrative. Narrative should follow evidence order, not the order in which analysts discovered it.

## 17. Confirmed and Inferred Sequences

| Sequence type | Standard |
| --- | --- |
| **Confirmed sequence** | Direct identifiers, causal artifacts, or tightly correlated evidence link event A to event B |
| **Probable sequence** | Strong circumstantial evidence supports the order and alternatives are weaker |
| **Possible sequence** | Technique logic supports the order, but direct linkage is absent |
| **Unknown sequence** | Evidence cannot determine the order or relationship |

### Sequence example

```json
{
  "from_event": "TL-031",
  "to_event": "TL-032",
  "relationship": "caused",
  "status": "confirmed",
  "evidence": [
    "Document macro command contains downloaded path",
    "Child process executes the same path two seconds later"
  ]
}
```

### Sequence language

- `caused` requires direct support.
- `preceded` states time order only.
- `likely enabled` indicates probable analytical linkage.
- `may be related` indicates possible linkage.

## 18. Causality Versus Temporal Proximity

Two events occurring close together are not automatically causally related.

### Causality indicators

- Shared unique identifier.
- Parent-child process relationship.
- Same logon ID or process GUID.
- Command line references the created file.
- DNS answer immediately used by a connection.
- Task action points to the executed payload.
- Archive contains the files enumerated by the preceding query.
- Authentication session directly precedes remote execution under the same identity.

### Weak relationships

- Same day only.
- Same host only.
- Same common filename.
- Same shared cloud IP.
- Similar ATT&CK technique.
- Similar analyst narrative.

### Causality rule

State temporal proximity as temporal proximity unless the evidence supports causation.

## 19. Dwell Time and Breakout Time

### Definitions

| Metric | Start | End |
| --- | --- | --- |
| **Dwell time to discovery** | Earliest supported compromise | First detection or discovery |
| **Dwell time to containment** | Earliest supported compromise | Effective containment |
| **Breakout time** | Initial foothold | First supported movement to another system |
| **Time to persistence** | Initial execution | First persistence artifact |
| **Time to staging** | Initial foothold | First data-staging evidence |
| **Time to exfiltration attempt** | Initial foothold | First supported outbound transfer attempt |

### Metric record

```json
{
  "metric": "breakout_time",
  "start_event": "TL-010",
  "end_event": "TL-044",
  "duration_seconds": 18340,
  "confidence": "high",
  "limitations": ["Earlier lateral movement may exist outside retained logs"]
}
```

### Metric rule

Always state the exact start and end definitions. `Dwell time` without definition is ambiguous.

## 20. Operational Tempo

Operational tempo describes how rapidly and regularly the attacker acted.

### Tempo measures

| Measure | Meaning |
| --- | --- |
| **Inter-event interval** | Time between related actions |
| **Active periods** | Clusters of adversary activity |
| **Quiet periods** | Possible waiting, automation, or missing evidence |
| **Off-hours concentration** | Timing relative to staffing and maintenance |
| **Target expansion rate** | New hosts reached over time |
| **Persistence recurrence** | Scheduled or repeated execution interval |
| **Staging cadence** | Frequency of archive creation or collection |

### Interpretation caution

Quiet periods can mean inactivity, delayed commands, anti-analysis behavior, or collection gaps.

## 21. Memory Evidence

Memory captures preserve volatile state near acquisition time.

### Memory review areas

- Running and hidden processes.
- Parent-child relationships.
- Command lines.
- Active and recently closed network connections where available.
- Loaded modules and injected regions.
- Handles to files, registry keys, mutexes, and pipes.
- In-memory scripts and decoded configuration.
- Logged-on sessions and tokens.
- Registry hive artifacts.
- Scheduled-task or persistence definitions resident in memory.

### Memory authority

Memory is strong evidence that an object existed at or near acquisition. It may not establish when the object was first created or every action it performed.

### Memory finding record

```json
{
  "finding_id": "MEM-FND-004",
  "object": "scheduled_task_definition",
  "host": "WS-RECV-03",
  "observed_at_utc": "2026-09-15T14:20:00Z",
  "task_trigger": "daily_02_00",
  "task_action": "redacted executable path",
  "confidence": "high",
  "source_ref": "memory_artifacts.txt:task-section"
}
```

## 22. Disk Evidence

Disk evidence provides historical artifacts that may survive process termination and deletion.

### Disk review areas

| Artifact | Use |
| --- | --- |
| **MFT** | File names, paths, timestamps, and allocation state |
| **Prefetch** | Program execution context on supported systems |
| **Task XML** | Trigger, action, principal, and settings |
| **Registry hives** | Persistence, execution, user, and system configuration |
| **Deleted files** | Recovered payloads, archives, scripts, and logs |
| **LNK and Jump Lists** | User interaction and file access context |
| **USN journal** | File-system change history when available |
| **Browser artifacts** | Download and navigation context |
| **Anti-forensics artifacts** | Clearing, deletion, timestomping, and tool traces |

### Disk caution

Filesystem timestamps can have different semantics, can be altered, and may reflect extraction or copying. Corroborate with other artifacts.

## 23. Firewall Session Evidence

Firewall sessions provide network metadata even when packet payloads are unavailable.

### Useful fields

| Field | Purpose |
| --- | --- |
| **source_ip and destination_ip** | Communication endpoints |
| **source_port and destination_port** | Transport context |
| **protocol** | TCP, UDP, or other protocol |
| **session_start and end** | Timing and duration |
| **bytes_out and bytes_in** | Directional volume |
| **action** | Allowed, denied, reset, or timed out |
| **NAT fields** | Address translation context |
| **interface or zone** | Network path |

### Session analysis

```bash
jq -r '.sessions[] |
  [.start_utc, .end_utc, .source_ip, .destination_ip,
   .destination_port, .protocol, .bytes_out, .bytes_in, .action] | @tsv' \
  ir_evidence/firewall_sessions_ws_recv_03.json \
  | sort -k1,1

jq -r '.sessions[] |
  [.destination_ip, .destination_port, .protocol] | @tsv' \
  ir_evidence/firewall_sessions_ws_recv_03.json \
  | sort | uniq -c | sort -nr
```

### Firewall limitation

A permitted session proves network communication was allowed and observed. It does not reveal encrypted content or necessarily identify the initiating process.

## 24. Scheduled Task Persistence

### Reconstruction questions

- What is the task name and path?
- Which user or principal runs it?
- What trigger is configured?
- What executable, script, or command is invoked?
- When was the task definition created or modified?
- Did execution artifacts appear at scheduled times?
- Did network sessions follow execution?
- Was the task visible in SIEM or endpoint logs?
- Is an approved software or maintenance record available?

### Evidence chain

```text
Task XML or registry definition
     ↓
Scheduled trigger at 02:00
     ↓
Prefetch, process, or memory evidence
     ↓
Network session or file activity
     ↓
Repeated daily pattern
```

### Persistence finding

```json
{
  "technique_status": "confirmed",
  "mechanism": "scheduled_task",
  "host": "WS-RECV-03",
  "trigger": "daily at 02:00",
  "evidence_refs": [
    "MEM-001:task-definition",
    "DISK-001:task-xml",
    "DISK-001:prefetch"
  ],
  "detection_gap": "scheduled task creation was not collected or alerted"
}
```

## 25. Deleted Archive and Staging Analysis

Recovered archives can establish collection and staging, but not automatically exfiltration.

### Archive questions

- Is the recovered file complete or partial?
- What archive format and compression are used?
- Are file names and directory paths recoverable?
- Do contents resemble database query results or exports?
- Are patient identifiers or regulated fields present?
- Which process or user created the archive?
- When was the archive created, modified, accessed, and deleted?
- Did an outbound session follow creation?
- Did transferred bytes plausibly cover the archive size?
- Was secure deletion attempted?

### Exposure statement

```text
The presence of recovered archives containing patient-record data confirms local access and staging.
It does not by itself confirm that the archives left the environment.
```

### Staging confidence

| Evidence | Interpretation |
| --- | --- |
| Archive contains sensitive exports | Confirmed local staging |
| Archive process and source files linked | Strong collection evidence |
| Archive deleted after outbound session | Supports possible exfiltration |
| Outbound bytes equal or exceed archive size | Supports transfer hypothesis |
| Packet or application evidence contains archive content | Confirms transfer more strongly |

## 26. Secondary Infrastructure Assessment

An unknown destination requires a fresh assessment rather than automatic campaign attribution.

### Assessment dimensions

| Dimension | Question |
| --- | --- |
| **Temporal relationship** | Did sessions occur during confirmed malicious activity? |
| **Source process** | Can the initiating process be identified? |
| **Session behavior** | Beaconing, interactive, bulk transfer, or ordinary service? |
| **Volume and direction** | Low-volume C2 or high-volume transfer? |
| **Protocol and port** | Expected or anomalous for the host role? |
| **Infrastructure context** | Dedicated, shared, cloud, CDN, or business service? |
| **DNS and TLS relationship** | Which domains or certificates map to the IP? |
| **Cross-host prevalence** | Is the IP unique to the compromised host? |
| **Campaign overlap** | Shared certificate, path, timing, protocol, or configuration? |
| **Benign explanation** | Approved vendor, update, or operational dependency? |

### Classification outcomes

| Outcome | Meaning |
| --- | --- |
| **Confirmed campaign infrastructure** | Multiple direct links support the role |
| **Probable secondary channel** | Strong behavioral and temporal evidence, one gap remains |
| **Possible campaign infrastructure** | Some supporting context, plausible alternatives remain |
| **Unrelated benign infrastructure** | Business purpose is validated |
| **Unresolved** | Evidence is insufficient |

### Attribution rule

An IP not present in previous IOC lists can still be campaign infrastructure, but novelty alone is not evidence.

## 27. IOC Cross-Reference

### IOC matrix fields

| Field | Purpose |
| --- | --- |
| **indicator_id** | Stable reference |
| **type and value** | Domain, IP, hash, path, task, service, or behavior |
| **role** | Delivery, C2, persistence, staging, or exfiltration |
| **first_seen_utc** | Earliest supported observation |
| **last_seen_utc** | Latest supported observation |
| **source_domains** | Email, network, disk, memory, malware, SIEM, or intelligence |
| **host_or_scope** | Affected entity |
| **confidence** | Evidence strength |
| **false_positive_risk** | Operational safety |
| **status** | Active, historical, expired, disputed, or unresolved |

### Cross-reference query

```bash
jq -s '
  add
  | group_by([.type, .value_normalized])
  | map({
      type: .[0].type,
      value: .[0].value_normalized,
      sources: ([.[].source] | unique),
      first_seen_utc: ([.[].first_seen_utc] | min),
      last_seen_utc: ([.[].last_seen_utc] | max),
      roles: ([.[].role] | unique)
    })
' indicators/*.json
```

### Cross-reference caution

An IOC embedded in malware is not automatically an IOC observed in local traffic. Record static presence and observed use separately.

## 28. Complete Attack Chain

### Reconstruction phases

| Phase | Evidence questions |
| --- | --- |
| **Targeting** | Who was targeted and why? |
| **Delivery** | Which email, URL, or attachment reached the user? |
| **Credential exposure** | Were credentials entered or later used? |
| **Execution** | Which process or script executed? |
| **Persistence** | How was access maintained? |
| **Command and control** | Which channels, intervals, and infrastructure were used? |
| **Discovery** | Which systems, accounts, and services were enumerated? |
| **Lateral movement** | Which credentials, tools, sources, and targets were involved? |
| **Collection** | Which data was accessed or queried? |
| **Staging** | Where and how was data packaged? |
| **Exfiltration** | Was data transfer attempted or completed? |
| **Anti-forensics** | Which files, logs, or timestamps were altered? |
| **Containment** | When was attacker access interrupted? |

### Phase rule

Do not force every phase to confirmed status. A complete reconstruction includes explicitly unknown phases.

## 29. ATT&CK Mapping at Scale

<Organization>MITRE ATT&CK</Organization> models adversary behavior using tactics, techniques, sub-techniques, and real-world procedures. Use it as a behavior vocabulary, not as a substitute for evidence.

### Mapping fields

| Field | Purpose |
| --- | --- |
| **technique_id** | ATT&CK technique or sub-technique |
| **behavior** | Plain-language local observation |
| **attack_phase** | Position in reconstructed sequence |
| **status** | Confirmed, probable, possible, not observed, or unknown |
| **confidence** | High, moderate, or low |
| **evidence_refs** | Direct support |
| **contradictory_refs** | Evidence against the mapping |
| **affected_assets** | Local systems involved |
| **detection_coverage** | Covered, partial, gap, or collection-limited |
| **response_action** | Containment, detection, or collection improvement |

### Mapping example

```json
{
  "technique_id": "T1053.005",
  "behavior": "Nightly scheduled task executed the implant at 02:00",
  "status": "confirmed",
  "confidence": "high",
  "evidence_refs": [
    "MEM-001:task-definition",
    "DISK-001:task-xml",
    "DISK-001:prefetch"
  ],
  "detection_coverage": "gap"
}
```

## 30. Technique Confidence

| Status | Evidence standard |
| --- | --- |
| **Confirmed** | Direct local evidence shows the behavior |
| **Probable** | Strong circumstantial evidence and converging sources support it |
| **Possible** | Technique logic fits, but evidence is indirect or incomplete |
| **Not observed** | Adequate reviewed telemetry does not show the behavior |
| **Unknown** | Collection cannot determine whether the behavior occurred |

### Confidence rule

Technique status and confidence are related but separate. A confirmed event can have moderate confidence if the evidence source has significant limitations.

## 31. Coverage Gap Analysis

### Gap types

| Gap | Meaning |
| --- | --- |
| **True detection gap** | Telemetry existed, but no analytic detected the behavior |
| **Collection gap** | Required evidence was not collected or retained |
| **Normalization gap** | Source field was lost or mistranslated |
| **Correlation gap** | Individual events existed but were not linked |
| **Baseline gap** | Authorization or normal behavior was undocumented |
| **Validation gap** | Rule existed but was untested or ineffective |
| **Response gap** | Alert or finding lacked an actionable procedure |

### Gap test

```text
Was required telemetry present?
  No → Collection gap
  Yes ↓
Was behavior represented correctly?
  No → Parsing or normalization gap
  Yes ↓
Did detection logic exist?
  No → Detection gap
  Yes ↓
Did the rule trigger?
  No → Validation or logic gap
  Yes ↓
Was the activity investigated and acted on?
  No → Triage or response gap
```

### Coverage principle

A technique marked covered can still hide an uncovered implementation, sequence, asset class, or data source.

## 32. Impact Assessment

Map compromised assets and actions to organizational consequences.

### Impact dimensions

| Dimension | Questions |
| --- | --- |
| **Confidentiality** | Was sensitive data accessed, staged, viewed, or transferred? |
| **Integrity** | Were systems, tasks, services, files, or records altered? |
| **Availability** | Was care delivery or business operation disrupted? |
| **Scope** | Which hosts, users, records, and sites were involved? |
| **Privilege** | What access did compromised accounts provide? |
| **Duration** | How long did unauthorized access persist? |
| **Propagation** | Did the attacker move beyond the initial host? |
| **Recoverability** | Were artifacts removed and credentials rotated? |
| **Regulatory relevance** | Did evidence involve protected or regulated data? |

### Asset impact record

```json
{
  "asset": "WS-RECV-03",
  "role": "reception_workstation",
  "compromise_status": "confirmed",
  "data_access": "indirect access path to health records database",
  "persistence": "confirmed scheduled task",
  "lateral_movement": "confirmed",
  "business_impact": "credential and network pivot risk",
  "confidence": "high"
}
```

## 33. Data Exposure States

| State | Definition | Evidence example |
| --- | --- | --- |
| **Confirmed access** | Evidence shows unauthorized viewing, query, read, or collection | Query output or access record |
| **Confirmed local staging** | Sensitive data was packaged or stored for transfer | Recovered archive containing records |
| **Confirmed exfiltration** | Evidence supports data leaving organizational control | Transfer content, destination receipt, or complete transfer evidence |
| **Probable exfiltration** | Strong transfer evidence exists but content or completion is not directly visible | Outbound volume and timing match staged archive |
| **Possible exposure** | Access was feasible, but use is unconfirmed | Compromised account had permissions |
| **Prevented exposure** | Staging or access attempt was stopped before transfer | Containment precedes any supported transfer |
| **Unknown** | Evidence cannot resolve exposure | Missing packet, proxy, or application logs |

### Exposure rule

Do not label local staging as confirmed exfiltration. Do not label mere permission as confirmed access.

## 34. Exfiltration Assessment

### Exfiltration evidence ladder

```text
Capability exists
     ↓
Sensitive data accessed
     ↓
Data collected
     ↓
Archive or staging artifact created
     ↓
Outbound channel established
     ↓
Outbound volume consistent with staged data
     ↓
Transferred content or destination-side evidence confirmed
```

### Assessment fields

| Field | Purpose |
| --- | --- |
| **staged_artifact** | Archive, export, database result, or temporary file |
| **artifact_size** | Expected transfer volume |
| **creation_and_deletion_time** | Correlation window |
| **outbound_destination** | Known, new, or unresolved infrastructure |
| **bytes_out** | Session transfer volume |
| **protocol** | DNS, HTTPS, or other channel |
| **session_completion** | Complete, reset, denied, or unknown |
| **content_visibility** | Full, partial, metadata only, or encrypted |
| **assessment** | Confirmed, probable, possible, prevented, or unknown |

### Volume caution

Firewall byte counts may include protocol overhead, retransmissions, encryption expansion, multiple objects, or unrelated traffic. Similar size supports correlation but does not prove content identity.

## 35. HIPAA-Oriented Risk Questions

**Legal caution:** Technical analysts should preserve facts and support the formal risk assessment. Privacy and legal authorities determine notification obligations.

### Four-factor evidence questions

| Factor | Technical evidence to provide |
| --- | --- |
| **Nature and extent of PHI** | Data types, identifiers, record counts, sensitivity, and re-identification context |
| **Unauthorized person** | Actor, account, destination, recipient, and whether another regulated entity was involved |
| **Actually acquired or viewed** | Queries, reads, archives, screenshots, transfers, or destination-side evidence |
| **Mitigation** | Isolation, credential reset, blocking, deletion confirmation, or recipient assurances |

### Regulatory evidence package

- Exact systems and databases involved.
- Data classifications and fields.
- Number or estimate of affected individuals.
- Evidence of access, staging, and transfer.
- Encryption state and key exposure.
- Unauthorized identities and destinations.
- Containment and mitigation times.
- Known limitations and unresolved questions.
- Chain of custody and evidence integrity.
- Privacy and legal decision record.

### Regulatory principle

Do not conclude `no breach` merely because exfiltration is unconfirmed. The formal assessment considers impermissible access or disclosure and the probability that protected information was compromised.

## 36. Unknowns and Collection Gaps

Document unknowns with the same rigor as findings.

### Unknown record

```json
{
  "unknown_id": "UNK-009",
  "question": "Did the recovered patient-data archive leave the environment?",
  "known": [
    "Archive existed locally",
    "Archive was deleted",
    "Outbound sessions occurred after staging"
  ],
  "unknown": [
    "Encrypted session content",
    "Destination-side receipt"
  ],
  "impact_if_true": "Potential disclosure of patient records",
  "information_needed": [
    "Proxy or packet payload evidence",
    "Destination-side evidence",
    "Application upload logs"
  ],
  "owner": "incident_response"
}
```

### Unknown categories

- Evidence never collected.
- Evidence collected but unavailable.
- Evidence destroyed or overwritten.
- Evidence encrypted or incomplete.
- Claim unresolved despite available evidence.
- Attribution unresolved.
- Scope unresolved.
- Impact unresolved.

## 37. Recommendations

Recommendations should connect directly to reconstruction findings and gaps.

### Recommendation categories

| Category | Examples |
| --- | --- |
| **Containment** | Isolate remaining assets, revoke sessions, rotate credentials |
| **Eradication** | Remove tasks, services, payloads, and unauthorized accounts |
| **Recovery** | Rebuild, validate, monitor, and restore systems |
| **Detection** | Scheduled-task analytics, staging detection, session correlation |
| **Collection** | Task creation logs, script logs, proxy retention, memory readiness |
| **Identity** | Service-account restrictions and privileged-access controls |
| **Network** | Egress controls, segmentation, DNS monitoring, deny direct resolver use |
| **Data protection** | Database auditing, DLP, export controls, encryption validation |
| **Governance** | Asset ownership, retention, legal escalation, and evidence readiness |

### Recommendation record

```json
{
  "recommendation_id": "REC-012",
  "finding_refs": ["FND-PERSIST-001", "GAP-003"],
  "action": "Collect and alert on scheduled-task creation and modification across all Windows assets",
  "priority": "critical",
  "owner": "detection_engineering",
  "target_date": "2026-10-31",
  "success_measure": "Validated malicious test detected with acceptable false-positive rate"
}
```

## 38. Attack Reconstruction Report

### Report structure

| Section | Content |
| --- | --- |
| **Executive summary** | What happened, impact, confidence, and priority actions |
| **Scope and handling** | Systems, dates, evidence, and restrictions |
| **Methodology** | Preservation, normalization, correlation, and confidence model |
| **Evidence inventory** | Sources, hashes, coverage, and limitations |
| **Key judgments** | Most important supported conclusions |
| **Master timeline** | Chronological multi-source events |
| **Attack narrative** | Connected phase-by-phase reconstruction |
| **Convergences** | Claims strengthened by independent evidence |
| **Divergences** | Contradictions and resolutions |
| **ATT&CK mapping** | Technique, evidence, status, and coverage |
| **Compromise scope** | Hosts, identities, accounts, and paths |
| **Data impact** | Access, staging, transfer, and uncertainty |
| **Regulatory support** | Technical facts for privacy and legal review |
| **Detection and collection gaps** | Why controls missed activity |
| **Recommendations** | Priority, owner, deadline, and validation |
| **Unknowns** | Unresolved questions and required evidence |
| **Appendices** | IOC matrix, claim ledger, query log, and citations |

### Executive key judgment

```text
The reconstruction confirms a multi-stage compromise that progressed from phishing and credential exposure to endpoint execution, persistent scheduled-task access, lateral movement, database access, and local staging of patient-record data. Available evidence supports outbound command-and-control activity and a possible data-transfer channel. It does not yet establish with high confidence that the recovered patient-data archive completed transfer outside the environment.
```

## 39. Evidence Citation Model

Every material claim should cite exact evidence.

### Citation format

```text
[EVIDENCE_ID | artifact or event | timestamp or location]
```

### Examples

```text
[MEM-001 | scheduled task extract | acquisition 2026-09-15T14:20:00Z]
[DISK-001 | task XML | path and report line reference]
[FW-001 | session record 8814 | start 2026-09-09T02:14:07Z]
[PCAP-002 | frame 4812 | 2026-09-09T02:14:07.418Z]
[SIEM-004 | event evt-220 | event time 2026-09-09T02:14:09Z]
```

### Citation rules

- Cite original evidence where possible.
- Cite derived analysis separately.
- Include source location and timestamp.
- Use stable IDs, not only filenames.
- Preserve line, frame, event, or record numbers.
- Do not cite a summary for a fact when raw evidence is available.
- Cite contradictory evidence beside the claim it affects.

## 40. Executive Communication

### Technical versus executive emphasis

| Technical audience | Executive audience |
| --- | --- |
| Event IDs, frames, hashes, fields, and commands | Business impact, confidence, decisions, and accountability |
| Detailed contradictions and parser limitations | Material uncertainty and consequence |
| Technique implementation | Attack progression and defensive failure |
| Detection logic | Risk reduction plan |
| Collection details | Assurance and remaining exposure |

### Three board questions

```text
1. What happened?
A chronological, evidence-supported account with confidence and unknowns.

2. What data was at risk, and did it leave?
A distinction among access, local staging, probable transfer, confirmed transfer, and unknown.

3. What changes prevent recurrence?
Prioritized identity, endpoint, network, data, detection, and response controls with owners and validation.
```

### Communication principle

Uncertainty should be precise, not vague. Intellectual honesty strengthens the report because it prevents unsupported assurance.

## 41. Reconstruction Package

```text
attack_reconstruction/
├── README.md
├── evidence/
│   ├── evidence-inventory.json
│   ├── source-authority.json
│   └── source-SHA256SUMS
├── provenance/
│   └── derived-artifacts.jsonl
├── claims/
│   ├── claim-ledger.jsonl
│   ├── convergences.json
│   └── divergences.json
├── time/
│   ├── clock-analysis.json
│   ├── temporal-anchors.json
│   └── normalized-events.jsonl
├── timeline/
│   ├── master-timeline.jsonl
│   └── sequence-relationships.json
├── entities/
│   ├── assets.json
│   ├── identities.json
│   └── infrastructure.json
├── iocs/
│   └── cross-reference.json
├── attack/
│   ├── phase-reconstruction.json
│   ├── technique-mapping.json
│   └── navigator-layer.json
├── impact/
│   ├── asset-impact.json
│   ├── data-exposure.json
│   └── regulatory-evidence.json
├── gaps/
│   ├── detection-gaps.json
│   ├── collection-gaps.json
│   └── unknowns.json
├── recommendations/
│   └── action-plan.json
├── reports/
│   ├── technical-reconstruction.md
│   ├── executive-summary.md
│   └── evidence-citation-index.md
├── MANIFEST.json
└── SHA256SUMS
```

### Package principle

A reviewer should be able to start from any report claim and navigate backward to evidence, or start from any evidence item and identify every claim that depends on it.

## 42. Quality Gates

| Gate | Pass condition |
| --- | --- |
| **Inventory** | Every source is identified, hashed, scoped, and limitation-labeled |
| **Provenance** | Every derived artifact points to parent evidence and method |
| **Claims** | Every material conclusion exists in the claim ledger |
| **Authority** | Source authority matches the claim type |
| **Time** | Original and normalized timestamps are preserved |
| **Clock analysis** | Skew, timezone, precision, and timestamp semantics are documented |
| **Anchors** | High-confidence fixed points are identified |
| **Correlation** | Every join states its key and uncertainty |
| **Convergences** | Independence of supporting sources is verified |
| **Divergences** | Contradictions are resolved or explicitly left open |
| **Timeline** | Facts are ordered before narrative interpretation |
| **Sequence** | Causality is distinguished from temporal proximity |
| **ATT&CK** | Every mapping has status, confidence, and evidence |
| **Impact** | Access, staging, and exfiltration are separated |
| **Regulatory support** | Facts are preserved for privacy and legal decision-makers |
| **Unknowns** | Every critical unknown has impact, evidence need, and owner |
| **Recommendations** | Every action maps to a finding or gap |
| **Citations** | Every material report claim has stable evidence references |
| **Integrity** | Manifest and hashes verify |

### Validation commands

```bash
find attack_reconstruction -name '*.json' -print0 | xargs -0 -n1 jq empty
find attack_reconstruction -name '*.jsonl' -print0 | while IFS= read -r -d '' file; do jq -c . "$file" >/dev/null || exit 1; done
sha256sum -c attack_reconstruction/SHA256SUMS

diff -u previous_findings/4x02_attack_mapping.json \
  attack_reconstruction/attack/technique-mapping.json \
  > attack_reconstruction/attack/attck-changes.diff || true
```

## 43. Professional Judgment

### Decision principles

- Reconstruction is a new analysis, not a compilation of earlier reports.
- Original evidence is stronger than a summary when both are available.
- Two copied reports are not independent corroboration.
- Timestamps must be interpreted according to their source semantics.
- Temporal proximity is not causality.
- An IOC embedded in malware is not automatically observed locally.
- An allowed firewall session does not identify encrypted content.
- A recovered archive confirms staging, not necessarily exfiltration.
- Permission to access data is not proof that data was accessed.
- Data access is not automatically data transfer.
- Similar outbound byte volume supports but does not prove content identity.
- ATT&CK coverage percentage does not establish detection quality.
- Collection gaps and detection gaps require different remedies.
- Unknowns should be specific, material, and assigned for resolution.
- Technical analysts provide facts for regulatory review; authorized privacy and legal teams make legal determinations.
- A report is stronger when it clearly distinguishes confirmed, probable, possible, disproved, and unknown claims.

## 44. Framework and Tool Map

| Item | Purpose |
| --- | --- |
| **NIST SP 800-86** | Integrate computer and network forensics into incident response |
| **CISA Incident Response Playbook** | Standardize response, coordination, remediation, recovery, and tracking |
| **MITRE ATT&CK** | Describe adversary tactics, techniques, sub-techniques, and procedures |
| **HHS Breach Notification Rule guidance** | Frame technical evidence needed for privacy risk review |
| **Memory forensics** | Preserve volatile processes, connections, modules, and registry state |
| **Disk forensics** | Reconstruct historical execution, files, tasks, and deletions |
| **PCAP and firewall logs** | Reconstruct communications and transfer characteristics |
| **SIEM and identity logs** | Search authentication, execution, and cross-source activity |
| **Asset inventory** | Translate technical compromise into business and data impact |
| **jq** | Normalize, correlate, validate, and summarize JSON evidence |
| **diff** | Compare previous and reconstructed mappings or findings |
| **sha256sum** | Preserve evidence and package integrity |

## 45. Fast Recall

- **Reconstruction is evidence integration, not project summarization.**
- **Inventory and hash everything before analysis.**
- **Preserve original values and record every transformation.**
- **Different sources are authoritative for different claims.**
- **Break previous reports into atomic claims.**
- **Every claim needs supporting, contradictory, and missing evidence.**
- **Independent convergence raises confidence. Copied reporting does not.**
- **Divergences are analytical work items, not formatting problems.**
- **Normalize to UTC but retain original timestamp, type, precision, skew, and uncertainty.**
- **Use trusted temporal anchors to position weaker events.**
- **Separate confirmed, probable, possible, and unknown sequences.**
- **Preceded does not mean caused.**
- **Define dwell time and breakout time with explicit start and end events.**
- **Memory proves volatile state near acquisition, not complete history.**
- **Disk artifacts can preserve execution and deleted staging but timestamps require interpretation.**
- **Firewall sessions prove observed communication, not encrypted content.**
- **Scheduled-task XML plus execution artifacts can confirm persistence.**
- **Recovered sensitive archives confirm local staging, not automatically exfiltration.**
- **Assess unknown infrastructure from timing, process, session shape, prevalence, and benign context.**
- **Map ATT&CK from local behavior evidence and annotate technique confidence.**
- **Coverage can fail through collection, normalization, detection, correlation, validation, or response.**
- **Distinguish confirmed access, local staging, probable exfiltration, confirmed exfiltration, prevented exposure, and unknown.**
- **HIPAA-related decisions require documented facts and authorized privacy and legal review.**
- **Every material statement needs a stable evidence citation.**
- **Unknowns deserve owners, impact statements, and collection requirements.**
- **Recommendations must trace to findings and include owners and validation measures.**

## 46. Resources

**Forensic reconstruction**
- [NIST SP 800-86: Guide to Integrating Forensic Techniques into Incident Response](https://csrc.nist.gov/pubs/sp/800/86/final)
- [CISA Federal Cybersecurity Incident and Vulnerability Response Playbooks](https://www.cisa.gov/resources-tools/resources/federal-government-cybersecurity-incident-and-vulnerability-response-playbooks)

**Adversary behavior**
- [MITRE ATT&CK Get Started](https://attack.mitre.org/resources/)
- [MITRE ATT&CK Detections and Analytics](https://attack.mitre.org/resources/get-started/detections-and-analytics/)

**Healthcare breach evidence context**
- [HHS HIPAA Breach Notification Rule](https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html)
- [45 CFR Part 164 Subpart D](https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-D)

**Man or help**
```text
man jq
man grep
man sort
man uniq
man date
man diff
```
