# SOC Shift Operations

"Detection is a process, not a product." - Richard Bejtlich, The Tao of Network Security Monitoring

> **⚠️ AUTHORIZED USE ONLY.** This material is for education, defensive incident response, and authorized security operations. Analyze only evidence and systems you are permitted to access. Preserve originals, respect handling restrictions, record uncertainty, and do not contain, disable, or modify production systems without explicit authority. When facts are incomplete, document the ambiguity and escalate instead of guessing. See the [Legal and Terms of Use](/legal) page.

**Scope:** Full-shift SOC operation against an unseen 24-hour evidence pack: intake, integrity verification, parsing, normalization, dirty-data recovery, baselining, detection catalog execution, alert triage, CLI and exported-SIEM investigation, IOC analysis, campaign linkage, ATT&CK mapping, incident reporting, tuning proposals, shift metrics, and professional handoff packaging.

## Table of Contents

- [Core Concepts](#core-concepts)
- [Shift Operating Model](#shift-operating-model)
- [Shift Timeline and Priorities](#shift-timeline-and-priorities)
- [Evidence Pack Intake](#evidence-pack-intake)
- [Chain of Custody and Integrity](#chain-of-custody-and-integrity)
- [Pipeline Execution](#pipeline-execution)
- [Dirty Data Recovery](#dirty-data-recovery)
- [Baseline Execution](#baseline-execution)
- [Detection Catalog Execution](#detection-catalog-execution)
- [Alert Queue Triage](#alert-queue-triage)
- [Triage Dispositions](#triage-dispositions)
- [Approved Change Validation](#approved-change-validation)
- [IOC Feed Analysis](#ioc-feed-analysis)
- [CLI Investigation](#cli-investigation)
- [Wazuh Export Investigation](#wazuh-export-investigation)
- [Multi-Source Correlation](#multi-source-correlation)
- [Incident Reconstruction](#incident-reconstruction)
- [Campaign Analysis](#campaign-analysis)
- [HC-RED7 Assessment](#hc-red7-assessment)
- [MITRE ATT&CK Mapping](#mitre-attck-mapping)
- [Ambiguity and Escalation](#ambiguity-and-escalation)
- [Incident Report Schema](#incident-report-schema)
- [Tuning Proposals](#tuning-proposals)
- [Shift Metrics](#shift-metrics)
- [Shift Handoff Package](#shift-handoff-package)
- [Quality Gates](#quality-gates)
- [Professional Judgment](#professional-judgment)
- [Framework and Tool Map](#framework-and-tool-map)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Concepts

| Term                           | Meaning                                                                                        |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| **Shift pack**                 | Evidence, alerts, findings, reports, metrics, and handoff artifacts from one operational watch |
| **Incident**                   | One or more security events requiring coordinated analysis or response                         |
| **Alert**                      | Detection output requiring triage; not automatically an incident                               |
| **Finding**                    | Evidence-supported analytical conclusion                                                       |
| **Campaign**                   | Related incidents linked by indicators, infrastructure, behavior, timing, or objectives        |
| **IOC**                        | Observable indicator associated with potentially malicious activity                            |
| **TTP**                        | Tactic, technique, or procedure describing adversary behavior                                  |
| **Disposition**                | Triage outcome such as incident, benign, noise, duplicate, or escalated                        |
| **Containment recommendation** | Proposed action to limit harm, subject to authorization                                        |
| **Handoff**                    | Structured package enabling the next analyst to continue without verbal reconstruction         |

### The core idea

```text
Fresh evidence
     ↓
Pipeline
     ↓
Baselines and detections
     ↓
Triage
     ↓
Investigation
     ↓
Incident and campaign analysis
     ↓
Tuning and reporting
     ↓
Shift handoff
```

The capstone tests sustained operation. Every stage must produce countable artifacts and preserve traceability to the original evidence.

## 2. Shift Operating Model

The full chain combines the outputs of earlier engineering and analysis work.

| Phase                 | Input                                  | Output                                          |
| --------------------- | -------------------------------------- | ----------------------------------------------- |
| **Intake**            | Raw evidence pack                      | Inventory, hashes, intake record                |
| **Pipeline**          | Raw source files                       | Normalized timeline, quarantine, quality report |
| **Baseline**          | Normalized events                      | Anomalies and deviation scores                  |
| **Detection**         | Events, rules, labels, risk data       | Ranked alert queue                              |
| **Triage**            | Alerts and context                     | Dispositions and investigation cases            |
| **Investigation**     | Evidence, exports, PCAPs, intelligence | Findings and incident reports                   |
| **Campaign analysis** | Incident reports and intelligence      | Link analysis and attribution assessment        |
| **Handoff**           | All shift artifacts                    | Manifested package for next analyst             |

### Operating principle

Do not skip stages because an IOC match appears obvious. A known indicator can accelerate prioritization, but it does not replace timeline reconstruction, context validation, or evidence preservation.

## 3. Shift Timeline and Priorities

Time pressure requires bounded work and explicit checkpoints.

### Suggested shift allocation

| Window            | Primary objective                           |
| ----------------- | ------------------------------------------- |
| **Hour 0 to 1**   | Intake, hashes, preflight, source inventory |
| **Hour 1 to 3**   | Pipeline execution and quality review       |
| **Hour 3 to 5**   | Baseline and detection execution            |
| **Hour 5 to 8**   | Triage and case creation                    |
| **Hour 8 to 16**  | Investigations and incident reconstruction  |
| **Hour 16 to 20** | Campaign linkage and ATT&CK mapping         |
| **Hour 20 to 22** | Tuning proposals and validation             |
| **Hour 22 to 24** | Package verification and handoff            |

### Priority order

```text
Active harm or high-criticality asset
Known campaign indicator with supporting behavior
Credential compromise or privileged access
Persistence and command-and-control
Collection or staging
Unresolved ambiguity on critical systems
Low-confidence noise and batch closure
```

## 4. Evidence Pack Intake

Treat the pack as unknown and potentially dirty.

### Expected source families

| Source                     | Analytical value                                                    |
| -------------------------- | ------------------------------------------------------------------- |
| **Windows EVTX**           | Authentication, process, service, task, policy, and account events  |
| **Linux auth and syslog**  | SSH, sudo, services, system activity                                |
| **Linux audit logs**       | Execution, file, privilege, and syscall evidence                    |
| **Sysmon JSON**            | Process, network, DNS, file, registry, and process-access telemetry |
| **Suricata EVE**           | Alerts, flows, DNS, HTTP, TLS, files, and anomalies                 |
| **Firewall CEF-like logs** | Allowed and denied network activity                                 |
| **PCAP and NetFlow**       | Packet and conversation evidence                                    |
| **Asset inventory**        | Site, zone, criticality, owner, and data classification             |
| **IOC feed**               | Host and network indicators with intelligence context               |
| **Change tickets**         | Approved activity and expected change windows                       |
| **Prior-shift notes**      | Open questions and continuity context                               |

### Intake commands

```bash
export CAPSTONE_PACK=/path/to/capstone_pack

find "$CAPSTONE_PACK" -type f -printf '%P\t%s\n' | sort
find "$CAPSTONE_PACK" -type f -print0 | sort -z | xargs -0 sha256sum > intake-SHA256SUMS
file "$CAPSTONE_PACK"/*
jq empty "$CAPSTONE_PACK/assets.json"
jq empty "$CAPSTONE_PACK/ioc_feed.json"
jq empty "$CAPSTONE_PACK/change_tickets.json"
```

## 5. Chain of Custody and Integrity

Evidence integrity supports repeatable analysis and credible handoff.

### Intake record fields

| Field                 | Purpose                         |
| --------------------- | ------------------------------- |
| **pack_id**           | Unique evidence-pack identifier |
| **received_at_utc**   | Intake time                     |
| **received_by**       | Analyst identity                |
| **source_path**       | Original pack location          |
| **file_count**        | Expected file count             |
| **total_size_bytes**  | Detect incomplete copies        |
| **manifest_hash**     | Integrity reference             |
| **handling_label**    | Sharing and access restrictions |
| **working_copy_path** | Analysis location               |

### Preservation sequence

```text
Hash originals
     ↓
Record metadata
     ↓
Set original pack read-only
     ↓
Create working copy
     ↓
Verify copied hashes
     ↓
Analyze working copy only
```

### TLP handling

Keep the original handling label on intelligence and exported artifacts. Do not redistribute beyond the permitted audience. Current TLP 2.0 labels are TLP:RED, TLP:AMBER, TLP:AMBER+STRICT, TLP:GREEN, and TLP:CLEAR.

## 6. Pipeline Execution

The pipeline should ingest the pack without manual edits to source evidence.

```bash
./evidence_pipeline/bin/run-pipeline.sh \
  --input "$CAPSTONE_PACK" \
  --output shift_work/evidence_handoff \
  --config evidence_pipeline/config \
  --quarantine shift_work/quarantine
```

### Pipeline acceptance checks

| Check                | Expected result                                  |
| -------------------- | ------------------------------------------------ |
| **Source inventory** | Every file represented                           |
| **Parse status**     | Success, partial, failed, or unsupported visible |
| **JSON validity**    | All normalized records parse                     |
| **Required fields**  | Identity, time, source, and provenance present   |
| **Time range**       | Covers the declared 24-hour window               |
| **Quarantine**       | Every rejected record has a reason               |
| **Duplicates**       | Duplicate status is documented                   |
| **Output hashes**    | Final artifacts are hashed                       |

### Count reconciliation

```text
attempted records = normalized + quarantined + documented duplicates + documented unsupported
```

## 7. Dirty Data Recovery

Dirty data is expected and must not stop the entire shift.

| Condition            | Safe handling                                                |
| -------------------- | ------------------------------------------------------------ |
| **Clock skew**       | Preserve original timestamp, add correction and quality flag |
| **Duplicate stream** | Identify overlap, deduplicate with documented key            |
| **Sysmon gap**       | Record start, end, host, cause, and confidence impact        |
| **Malformed syslog** | Quarantine line with parser error and source pointer         |
| **Missing host**     | Enrich only from reliable file or source mapping             |
| **Encoding error**   | Decode with replacement only when recorded and reversible    |

### Time correction record

```json
{
  "host": "endpoint-07",
  "original_offset_seconds": 312,
  "correction_method": "trusted_ntp_comparison",
  "effective_start_utc": "2026-10-07T00:00:00Z",
  "effective_end_utc": "2026-10-08T00:00:00Z",
  "confidence": "high"
}
```

### Recovery principle

Never silently repair evidence. Preserve the original value and record every correction as derived metadata.

## 8. Baseline Execution

Run the approved baseline package against the normalized pack.

```bash
./baseline_package/bin/run-analysis.sh \
  --input shift_work/evidence_handoff/output/events.jsonl \
  --package baseline_package \
  --output shift_work/baseline_output
```

### Baseline outputs to review

| Output                       | Use                                               |
| ---------------------------- | ------------------------------------------------- |
| **Authentication anomalies** | New users, sources, methods, and off-hours access |
| **Process anomalies**        | New executables, paths, parents, or commands      |
| **Network anomalies**        | New destinations, ports, domains, and zone paths  |
| **File anomalies**           | New paths, writes, deletes, and sensitive access  |
| **Temporal anomalies**       | Spikes, quiet-hour activity, and source gaps      |
| **Validation report**        | Baseline quality and known limitations            |

### Baseline caution

A fresh data pack may contain legitimate new behavior. Baseline deviation is a lead, not a verdict.

## 9. Detection Catalog Execution

Run the catalog using the current risk register, baseline package, and normalized evidence.

```bash
./detection_catalog/bin/run-catalog.sh \
  --events shift_work/evidence_handoff/output/events.jsonl \
  --baseline baseline_package \
  --risk-register "$CAPSTONE_PACK/assets.json" \
  --output shift_work/detection_output
```

### Catalog review

| Check                     | Question                                                  |
| ------------------------- | --------------------------------------------------------- |
| **Rule version**          | Which catalog version generated the alert?                |
| **Quality metrics**       | What precision, recall, and FPR were previously measured? |
| **Evidence IDs**          | Which events caused the match?                            |
| **Risk score**            | How did asset criticality affect rank?                    |
| **Source count**          | Is the alert single-source or correlated?                 |
| **Known false positives** | Does change activity explain it?                          |

## 10. Alert Queue Triage

Triage orders alerts by urgency and creates investigation cases.

### Triage sequence

```text
Validate alert structure
     ↓
Confirm supporting events exist
     ↓
Check asset criticality
     ↓
Check IOC and campaign relevance
     ↓
Check approved changes
     ↓
Check baseline deviation
     ↓
Assign disposition and confidence
     ↓
Open investigation if required
```

### High-priority signals

- Known IOC plus supporting behavior.
- Credential failures followed by success.
- New service or scheduled-task persistence.
- New process communicating externally.
- Sensitive data access followed by staging or transfer.
- Multiple independent sources supporting one chain.
- Critical asset or regulated-data exposure.

## 11. Triage Dispositions

| Disposition        | Meaning                                          | Required evidence                |
| ------------------ | ------------------------------------------------ | -------------------------------- |
| **incident**       | Confirmed or strongly supported harmful activity | Incident ID and evidence chain   |
| **escalate**       | Suspicious but unresolved within Tier 1 scope    | Ambiguity and required next step |
| **benign change**  | Approved activity explains the alert             | Change-ticket reference          |
| **false positive** | Rule logic matched benign activity               | Tuning evidence                  |
| **noise**          | Correct event with no meaningful security value  | Batch-close rationale            |
| **duplicate**      | Same underlying activity already tracked         | Parent alert or incident ID      |
| **data quality**   | Alert caused by pipeline or telemetry problem    | Quality issue reference          |

### Triage record

```json
{
  "alert_id": "ALT-000104",
  "disposition": "escalate",
  "confidence": "medium",
  "reason": "Persistence behavior confirmed, but approved deployment status is unresolved.",
  "evidence_ids": ["evt-101", "evt-118"],
  "required_next_step": "Confirm service installation with application owner",
  "analyst": "tier1-shift"
}
```

## 12. Approved Change Validation

Approved activity can trigger real rules. Validate scope instead of assuming every ticket explains every event.

### Change-ticket checks

| Check       | Question                                                           |
| ----------- | ------------------------------------------------------------------ |
| **Time**    | Did activity occur inside the approved window?                     |
| **Host**    | Was the affected asset listed?                                     |
| **Account** | Was the executing identity authorized?                             |
| **Action**  | Did the ticket include this command, service, file, or connection? |
| **Source**  | Did activity originate from the approved management path?          |
| **Outcome** | Did observed behavior match the expected change result?            |

### Decision rule

A ticket is context, not automatic closure. If behavior exceeds ticket scope, continue the investigation.

## 13. IOC Feed Analysis

IOC matching identifies candidate activity but requires context.

### IOC types

| Type                        | Match fields                               |
| --------------------------- | ------------------------------------------ |
| **IPv4 or IPv6**            | Source IP, destination IP, DNS answer      |
| **Domain**                  | DNS query, TLS SNI, HTTP host              |
| **URL**                     | HTTP URL and request fields                |
| **File hash**               | Process, file, or downloaded artifact hash |
| **File name or path**       | File and process fields                    |
| **Service name**            | Service-installation events                |
| **Certificate fingerprint** | TLS or file-signing metadata               |

### IOC matching concept

```bash
jq -r '.indicators[] | [.type,.value,.confidence,.tlp] | @tsv' "$CAPSTONE_PACK/ioc_feed.json"

jq -c --slurpfile feed "$CAPSTONE_PACK/ioc_feed.json" '
  select(.destination.ip as $ip | any($feed[0].indicators[]; .type == "ipv4" and .value == $ip))
' shift_work/evidence_handoff/output/events.jsonl
```

### IOC assessment fields

- Indicator value and type.
- Intelligence source and confidence.
- First and last seen.
- Direction and context.
- Asset involved.
- Supporting behavior.
- Possible benign overlap.
- Campaign relevance.

## 14. CLI Investigation

Use CLI tools for reproducible filtering, correlation, and source inspection.

### Core pivots

```bash
# Host timeline
jq -c 'select(.host.name == "server-01")' events.jsonl | sort > server-01.jsonl

# User activity
jq -c 'select(.user.name == "user-a")' events.jsonl

# Process and network relationship
jq -c 'select(.process.name != null and .destination.ip != null)' events.jsonl

# Events around a timestamp
jq -c 'select(.timestamp_utc >= "2026-10-08T02:10:00Z" and .timestamp_utc <= "2026-10-08T02:20:00Z")' events.jsonl

# Suricata alert summary
jq -r 'select(.event.module == "suricata" and .event.kind == "alert") | [.timestamp_utc,.source.ip,.destination.ip,.rule.name] | @tsv' events.jsonl
```

### PCAP checks

```bash
sha256sum "$CAPSTONE_PACK/network/suspicious.pcap"
tshark -r "$CAPSTONE_PACK/network/suspicious.pcap" -q -z conv,ip
tshark -r "$CAPSTONE_PACK/network/suspicious.pcap" -Y dns.qry.name -T fields -e frame.time_epoch -e ip.src -e dns.qry.name
tcpdump -nn -r "$CAPSTONE_PACK/network/suspicious.pcap"
```

## 15. Wazuh Export Investigation

Use exported SIEM artifacts as a second interface and evidence source.

### Export workflow

```text
Validate export JSON
     ↓
Confirm scenario and time scope
     ↓
Review saved query and result count
     ↓
Map Wazuh fields to normalized fields
     ↓
Confirm event identifiers
     ↓
Compare CLI and export conclusions
```

### Parity checks

| Check              | Expected result                                   |
| ------------------ | ------------------------------------------------- |
| **Time range**     | Same UTC bounds in both interfaces                |
| **Host and user**  | Same entities                                     |
| **Event identity** | Same underlying records                           |
| **Conclusion**     | Equivalent supported finding                      |
| **Differences**    | Explained by mapping, export, or interface limits |

### Export caution

Pre-exported evidence cannot prove live dashboard latency, role behavior, or unsaved exploratory searches. Do not invent measurements.

## 16. Multi-Source Correlation

Incidents emerge from relationships across fragmented sources.

### Correlation keys

| Key               | Examples                                         |
| ----------------- | ------------------------------------------------ |
| **Host**          | Agent name, computer, hostname, asset ID         |
| **User**          | Account name, SID, UID, audit user ID            |
| **Process**       | PID, process GUID, executable, command line      |
| **Network**       | Source IP, destination IP, port, domain, flow ID |
| **File**          | Path, name, hash                                 |
| **Time**          | Corrected UTC event time                         |
| **Rule or alert** | Sigma rule ID, Wazuh rule ID, Suricata SID       |

### High-confidence chain

```text
Authentication anomaly
     ↓
Execution anomaly
     ↓
Persistence event
     ↓
DNS and outbound connection
     ↓
Collection or staging
```

### Correlation rule

Preserve every source event ID. A correlated finding must be reversible to its component evidence.

## 17. Incident Reconstruction

Build a factual timeline before writing the narrative.

### Timeline fields

| Field             | Purpose                                        |
| ----------------- | ---------------------------------------------- |
| **timestamp_utc** | Ordered activity time                          |
| **event_id**      | Stable evidence reference                      |
| **source**        | Telemetry origin                               |
| **host**          | Affected system                                |
| **user**          | Associated identity                            |
| **action**        | What occurred                                  |
| **object**        | Process, file, service, domain, or destination |
| **confidence**    | Confidence in interpretation                   |
| **notes**         | Ambiguity or correction                        |

### Reconstruction stages

```text
Initial access
Execution
Persistence
Privilege or credential activity
Discovery and lateral movement
Command and control
Collection and staging
Exfiltration or impact
```

Do not force every incident into every stage. Record only stages supported by evidence.

## 18. Campaign Analysis

Campaign linkage requires more than one shared IP or filename.

### Linkage dimensions

| Dimension                  | Evidence                                          |
| -------------------------- | ------------------------------------------------- |
| **Shared indicators**      | Domains, IPs, hashes, service names               |
| **Temporal proximity**     | Overlapping or sequential incidents               |
| **Infrastructure pattern** | Common hosting, certificates, DNS, ports          |
| **Behavioral consistency** | Similar persistence, beaconing, staging, or tools |
| **Victimology**            | Similar sites, roles, or data targets             |
| **Operational sequence**   | Similar technique order and timing                |

### Campaign confidence

| Level            | Meaning                                            |
| ---------------- | -------------------------------------------------- |
| **High**         | Multiple independent indicator and behavior links  |
| **Medium**       | One strong link plus tactical consistency          |
| **Low**          | Limited overlap or common commodity behavior       |
| **Unrelated**    | Evidence supports a distinct actor or benign cause |
| **Undetermined** | Insufficient evidence                              |

## 19. HC-RED7 Assessment

Treat the activity-cluster name as case intelligence, not a known public actor profile.

### Matching criteria

| Criterion                | Question                                                          |
| ------------------------ | ----------------------------------------------------------------- |
| **IOC match**            | Does observed evidence match the provided feed?                   |
| **Credential access**    | Is credential compromise or suspicious authentication visible?    |
| **Phishing context**     | Is there evidence of user execution or message-delivered payload? |
| **Service persistence**  | Was a service installed or modified?                              |
| **Beacon behavior**      | Is there irregular recurring outbound communication?              |
| **Staging behavior**     | Was data collected under an approved process or location?         |
| **Tactical consistency** | Does the sequence align with the advisory?                        |

### Assessment example

```json
{
  "incident_id": "INC-003",
  "campaign": "HC-RED7",
  "assessment": "probable",
  "confidence": "medium",
  "supporting_iocs": ["203.0.113.44"],
  "supporting_techniques": ["T1543.003", "T1071", "T1074"],
  "contradictory_evidence": [],
  "information_needed": [
    "Endpoint memory capture",
    "Service binary hash reputation"
  ]
}
```

### Attribution rule

Use terms such as consistent with, possible, probable, or confirmed according to evidence strength. Do not claim campaign attribution from one indicator alone.

## 20. MITRE ATT&CK Mapping

Map observed behavior to ATT&CK techniques after establishing the facts.

### Mapping record

| Field                 | Purpose                           |
| --------------------- | --------------------------------- |
| **technique_id**      | ATT&CK technique or sub-technique |
| **tactic**            | Adversary objective               |
| **evidence_ids**      | Supporting events                 |
| **observed_behavior** | What happened in this environment |
| **confidence**        | Strength of mapping               |
| **data_sources**      | Telemetry supporting the mapping  |

### Mapping rules

- Map behavior, not tool name alone.
- Use sub-technique when evidence supports it.
- One event may support several hypotheses, but avoid over-mapping.
- Record partial coverage and missing telemetry.
- Include ATT&CK version or retrieval date in the package.

## 21. Ambiguity and Escalation

Ambiguous findings are valid outputs when uncertainty is documented.

### Escalation record

```json
{
  "finding_id": "FND-AMB-002",
  "status": "escalated",
  "known": [
    "A new service was installed on a critical host",
    "The binary path is user-writable"
  ],
  "unknown": [
    "Whether the deployment was authorized",
    "Whether the binary is trusted"
  ],
  "hypotheses": ["Unauthorized persistence", "Emergency vendor maintenance"],
  "information_needed": [
    "Application owner confirmation",
    "Binary hash and signature validation"
  ],
  "recommended_next_step": "Do not close; escalate to Tier 2"
}
```

### Ambiguity rule

Do not convert missing evidence into certainty. State what is known, unknown, contradictory, and required next.

## 22. Incident Report Schema

Incident reports must conform to one locked schema.

### Required fields

| Field                           | Purpose                                           |
| ------------------------------- | ------------------------------------------------- |
| **incident_id**                 | Stable incident identifier                        |
| **title**                       | Concise incident name                             |
| **status**                      | open, contained, escalated, monitoring, or closed |
| **severity**                    | Business and technical priority                   |
| **confidence**                  | Confidence in incident assessment                 |
| **first_seen_utc**              | Earliest related activity                         |
| **last_seen_utc**               | Latest related activity                           |
| **affected_assets**             | Hosts and criticality                             |
| **affected_users**              | Identities involved                               |
| **summary**                     | Evidence-supported conclusion                     |
| **timeline**                    | Ordered evidence references                       |
| **techniques**                  | ATT&CK mappings                                   |
| **iocs**                        | Relevant indicators                               |
| **impact**                      | Known or potential effect                         |
| **containment_recommendations** | Authorized next actions                           |
| **evidence_ids**                | Supporting events                                 |
| **campaign_assessment**         | Campaign relation and confidence                  |
| **open_questions**              | Unresolved issues                                 |

### Incident JSON skeleton

```json
{
  "incident_id": "INC-001",
  "title": "Suspicious service persistence and outbound beaconing",
  "status": "escalated",
  "severity": "high",
  "confidence": "high",
  "first_seen_utc": "2026-10-07T22:14:00Z",
  "last_seen_utc": "2026-10-08T03:51:00Z",
  "affected_assets": [],
  "affected_users": [],
  "summary": "",
  "timeline": [],
  "techniques": [],
  "iocs": [],
  "impact": [],
  "containment_recommendations": [],
  "evidence_ids": [],
  "campaign_assessment": {},
  "open_questions": []
}
```

## 23. Tuning Proposals

Tuning proposals require counted evidence and regression protection.

### Proposal fields

| Field                | Purpose                                    |
| -------------------- | ------------------------------------------ |
| **rule_id**          | Rule to change                             |
| **problem**          | False-positive or missed-detection pattern |
| **current_metrics**  | TP, FP, TN, FN, precision, recall, FPR     |
| **evidence_count**   | Number of supporting events or alerts      |
| **proposed_change**  | Narrow logic adjustment                    |
| **expected_effect**  | Predicted metric and workload change       |
| **risk**             | Possible false-negative impact             |
| **regression_tests** | Positive and negative cases to rerun       |
| **approval_status**  | proposed, approved, rejected, or deferred  |

### Tuning rule

Do not suppress a rule because it fired during approved change activity. First determine whether the rule is correct and whether a scoped contextual filter can preserve malicious coverage.

## 24. Shift Metrics

Count operational performance and data quality.

| Metric                                         | Purpose                          |
| ---------------------------------------------- | -------------------------------- |
| **Source files received**                      | Intake completeness              |
| **Records attempted, normalized, quarantined** | Pipeline accountability          |
| **Duplicates removed**                         | Noise and quality measurement    |
| **Telemetry gaps**                             | Visibility limitation            |
| **Alerts generated**                           | Detection volume                 |
| **Alerts triaged**                             | Shift completion                 |
| **Incidents confirmed**                        | Security outcome                 |
| **Alerts batch-closed**                        | Noise handling                   |
| **Ambiguous cases escalated**                  | Responsible uncertainty handling |
| **Mean time to triage**                        | Queue efficiency                 |
| **Mean time to finding**                       | Investigation efficiency         |
| **Evidence traceability rate**                 | Report quality                   |

### Shift summary example

```json
{
  "shift_id": "WATCH-2026-10-08",
  "sources_received": 42,
  "records_attempted": 339000,
  "records_normalized": 337820,
  "records_quarantined": 180,
  "duplicates_removed": 1000,
  "alerts_generated": 86,
  "alerts_triaged": 86,
  "incidents_confirmed": 3,
  "alerts_batch_closed": 41,
  "cases_escalated": 2,
  "evidence_traceability_rate": 1.0
}
```

## 25. Shift Handoff Package

```text
shift_handoff/
├── README.md
├── intake/
│   ├── source-inventory.json
│   └── raw-SHA256SUMS
├── pipeline/
│   ├── pipeline-summary.json
│   ├── quality-report.json
│   └── quarantine.jsonl
├── baseline/
│   └── anomalies.jsonl
├── detection/
│   ├── alert_queue.json
│   └── rule-metrics.json
├── triage/
│   ├── triage-log.jsonl
│   └── batch-closures.json
├── findings/
│   └── findings.jsonl
├── incidents/
│   ├── INC-001.json
│   ├── INC-002.json
│   └── INC-003.json
├── campaign/
│   └── campaign-assessment.json
├── tuning/
│   └── tuning-proposals.json
├── metrics/
│   └── shift-summary.json
├── handoff/
│   └── next-shift-actions.json
├── MANIFEST.json
└── SHA256SUMS
```

### Handoff README

The README should state the shift ID, evidence window, package schema version, verification command, and entry points. Keep investigation details in structured artifacts.

### Next-shift actions

- Open incidents and current status.
- Unresolved ambiguity.
- Required owner confirmations.
- Recommended containment pending approval.
- Telemetry gaps and expected restoration.
- Deferred tuning proposals.
- Intelligence or campaign updates to monitor.

## 26. Quality Gates

| Gate                  | Pass condition                                          |
| --------------------- | ------------------------------------------------------- |
| **Intake**            | Every source file inventoried and hashed                |
| **Pipeline**          | Counts reconcile and quarantine has reasons             |
| **Timeline**          | UTC or corrected timestamps are traceable               |
| **Detection**         | Every alert links to rule and events                    |
| **Triage**            | Every alert has one disposition                         |
| **Change validation** | Benign closures reference approved scope                |
| **Incident reports**  | All reports validate against locked schema              |
| **Campaign analysis** | Confidence and contradictory evidence recorded          |
| **ATT&CK mapping**    | Every mapping links to observed behavior                |
| **Tuning**            | Proposals include counted evidence and regression tests |
| **Handoff**           | Open work and next actions are explicit                 |
| **Integrity**         | Manifest and hashes verify                              |

### Validation commands

```bash
find shift_handoff -name '*.json' -print0 | xargs -0 -n1 jq empty
find shift_handoff -name '*.jsonl' -print0 | while IFS= read -r -d '' file; do jq -c . "$file" >/dev/null || exit 1; done
sha256sum -c shift_handoff/SHA256SUMS
```

## 27. Professional Judgment

The analyst must separate fact, inference, hypothesis, and recommendation.

| Statement type     | Example                                                 |
| ------------------ | ------------------------------------------------------- |
| **Fact**           | A service-installation event exists at a specific time  |
| **Inference**      | The service likely provides persistence                 |
| **Hypothesis**     | The activity may relate to the named campaign           |
| **Recommendation** | Escalate and validate the service binary before closure |

### Decision principles

- Do not close unresolved persistence on a critical host as noise.
- Do not declare an incident from an IOC match alone.
- Do not treat a change ticket as unlimited authorization.
- Do not hide telemetry gaps from confidence ratings.
- Do not perform containment without authority.
- Preserve contradictory evidence.
- Escalate ambiguity with a precise request for missing information.

## 28. Framework and Tool Map

| Item                        | Purpose                                                |
| --------------------------- | ------------------------------------------------------ |
| **NIST SP 800-61 Rev. 3**   | Incident response recommendations aligned with CSF 2.0 |
| **MITRE ATT&CK Enterprise** | Behavior mapping and campaign analysis vocabulary      |
| **ATT&CK Navigator**        | Visualize observed and detected techniques             |
| **HHS HC3**                 | Healthcare threat briefs and sector context            |
| **Health-ISAC**             | Healthcare intelligence sharing and advisories         |
| **FIRST TLP 2.0**           | Intelligence-sharing boundaries                        |
| **Evidence pipeline**       | Parse, normalize, clean, enrich, and index             |
| **Baseline package**        | Identify behavioral deviations                         |
| **Detection catalog**       | Generate measured alerts                               |
| **jq and Python**           | Analysis, correlation, reporting, and packaging        |
| **sigma-cli and Chainsaw**  | Detection validation and Windows artifact analysis     |
| **Wazuh exports**           | Secondary investigation interface                      |
| **sha256sum**               | Evidence and package integrity                         |

## 29. Fast Recall

- **The full chain is intake, pipeline, baseline, detection, triage, investigation, campaign analysis, and handoff.**
- **Hash originals before analysis. Work from a verified copy.**
- **Every source file must appear in the inventory.**
- **Dirty data is handled visibly, not silently.** Preserve original timestamps and corrections.
- **Counts must reconcile across normalized, quarantined, duplicate, and unsupported records.**
- **An alert is not an incident. An IOC match is not attribution.**
- **Check asset criticality, baselines, intelligence, and approved changes during triage.**
- **A ticket explains only activity inside its documented scope.**
- **Correlate host, user, process, network, file, and time evidence.**
- **Use both CLI and exported-SIEM evidence where required, but do not invent live-dashboard measurements.**
- **Reconstruct facts before mapping ATT&CK techniques.**
- **Preserve every event ID in correlated findings and incident timelines.**
- **Campaign linkage needs multiple independent similarities.**
- **Use possible, probable, or confirmed according to evidence strength.**
- **Document known, unknown, contradictory, and required information for ambiguous cases.**
- **Every alert gets one disposition. Every incident uses the locked schema.**
- **Tuning proposals require counted evidence and regression tests.**
- **Do not contain production systems without authority.**
- **The next analyst should continue from the package without calling you.**

## 30. Resources

**Incident response and shift operation**

- [NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final)
- [NIST Incident Response Project](https://csrc.nist.gov/projects/incident-response)

**Attack frameworks**

- [MITRE ATT&CK Enterprise Matrix](https://attack.mitre.org/matrices/enterprise/)
- [MITRE ATT&CK Navigator](https://mitre-attack.github.io/attack-navigator/)

**Healthcare threat context**

- [HHS Cyber Threat Briefs](https://tech.hhs.gov/cyber/threat-briefs)
- [HC3 Products](https://asprtracie.hhs.gov/technical-resources/resource/11041/hc3-products)
- [Health-ISAC](https://health-isac.org/)
- [FIRST Traffic Light Protocol 2.0](https://www.first.org/tlp/)

**Tooling**

- [sigma-cli](https://github.com/SigmaHQ/sigma-cli)
- [Chainsaw](https://github.com/WithSecureLabs/chainsaw)
- [Wazuh Dashboard Documentation](https://documentation.wazuh.com/current/user-manual/wazuh-dashboard/index.html)

**Man or help**

```text
man jq
man docker
man bash
man date
man sha256sum
```
