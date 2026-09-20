# Reading the Noise

> **⚠️ AUTHORIZED USE ONLY.** This material is for education, defensive security analysis, and authorized log investigation. Analyze only datasets and systems you are permitted to access. Behavioral baselines can expose sensitive user, host, process, network, and operational patterns. Protect the source evidence, preserve provenance, document assumptions, and never label a person or system malicious based only on an anomaly score. See the [Legal and Terms of Use](/legal) page.

> "Before you can spot an intruder, you must know what normal looks like." (SOC lead principle)

**Scope:** Behavioral analysis of normalized security evidence: source profiling, field presence and cardinality, reusable CLI queries, baseline and evaluation window selection, authentication baselines, process inventories, network destination baselines, file activity baselines, temporal profiles, host and role specificity, anomaly detection, cross-source correlation, composite scoring, false-positive validation, machine-readable baseline storage, and reusable analytical packaging.

## Table of Contents
- [Core Concepts](#core-concepts)
- [Reading Normalized Security Data](#reading-normalized-security-data)
- [Analysis Workflow](#analysis-workflow)
- [Dataset Validation](#dataset-validation)
- [Source Enumeration and Profiling](#source-enumeration-and-profiling)
- [Field Presence and Cardinality](#field-presence-and-cardinality)
- [Reusable CLI Query Toolkit](#reusable-cli-query-toolkit)
- [Baseline and Evaluation Windows](#baseline-and-evaluation-windows)
- [Behavioral Baselines](#behavioral-baselines)
- [Authentication Baseline](#authentication-baseline)
- [Process Baseline](#process-baseline)
- [Network Baseline](#network-baseline)
- [File Activity Baseline](#file-activity-baseline)
- [Temporal Baseline](#temporal-baseline)
- [Host, Role, and Time Specificity](#host-role-and-time-specificity)
- [Machine-Readable Baseline Format](#machine-readable-baseline-format)
- [Anomaly Detection](#anomaly-detection)
- [Deviation Magnitude](#deviation-magnitude)
- [Cross-Source Correlation](#cross-source-correlation)
- [Composite Risk Scoring](#composite-risk-scoring)
- [Anomaly Ranking and Triage](#anomaly-ranking-and-triage)
- [False-Positive Validation](#false-positive-validation)
- [Reusable Baseline Package](#reusable-baseline-package)
- [Professional Judgment](#professional-judgment)
- [Framework and Tool Map](#framework-and-tool-map)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Concepts

| Term | Meaning |
| --- | --- |
| **Behavioral baseline** | Machine-readable description of activity observed during a known-clean historical window |
| **Evaluation window** | Later period compared against the baseline to find deviations |
| **Anomaly** | Activity that differs from the expected behavior described by the baseline |
| **Static threshold** | Fixed limit applied broadly, regardless of host, role, time, or historical behavior |
| **Cardinality** | Number of distinct values observed in a field |
| **Field presence** | Percentage or count of records containing a field |
| **Deviation magnitude** | Measure of how far evaluation activity differs from baseline behavior |
| **Correlation** | Linking related events across sources, hosts, users, processes, networks, or time |
| **Composite score** | Combined ranking based on impact, deviation, confidence, and corroboration |
| **False positive** | Benign activity incorrectly surfaced as suspicious |

### The core idea

```text
Known-clean history
     ↓
Describe normal behavior
     ↓
Store normal as data
     ↓
Compare new activity
     ↓
Surface deviations
     ↓
Correlate supporting evidence
     ↓
Rank the most important findings first
```

A baseline does not prove that activity is safe. It provides a reference that makes unusual activity visible and explainable.

## 2. Reading Normalized Security Data

Normalized data creates consistency across sources, but analysts still need to understand what each source can and cannot reveal.

### Common analytical questions

| Question | Useful fields |
| --- | --- |
| What sources are present? | source, observer.product, log.channel |
| Which hosts produce each source? | host.name, source, observer.product |
| What event types dominate? | event.kind, event.category, event.code |
| Which fields are consistently populated? | Field presence profile |
| Which values are rare or unique? | Cardinality and frequency distribution |
| What time range is covered? | timestamp_utc |
| Are there gaps? | Hourly counts and expected source cadence |
| Which assets are most important? | asset.criticality, asset.role, environment |

### Reading rule

Do not interpret a field without checking its source, datatype, presence rate, and example values. The same field name can have different operational meaning when produced by different tools.

## 3. Analysis Workflow

The analysis sequence should be deterministic and reusable.

```text
Validate dataset
     ↓
Split baseline and evaluation windows
     ↓
Profile sources and fields
     ↓
Build behavioral baselines
     ↓
Validate baselines on known-clean data
     ↓
Compare evaluation activity
     ↓
Correlate anomalies across sources
     ↓
Score and rank findings
     ↓
Export package and quality report
```

### Stage outputs

| Stage | Output |
| --- | --- |
| **Validate** | dataset-profile.json |
| **Split** | window-manifest.json |
| **Profile** | source-profile.json and field-profile.json |
| **Baseline** | auth, process, network, file, and temporal JSON files |
| **Validate baseline** | false-positive-report.json |
| **Detect** | anomalies.jsonl |
| **Correlate** | correlated-findings.jsonl |
| **Rank** | ranked-findings.json |
| **Package** | baseline-package-manifest.json |

## 4. Dataset Validation

Analysis begins by confirming that the evidence is readable, normalized, chronologically valid, and attributable.

### Validation checks

| Check | Pass condition |
| --- | --- |
| **JSON validity** | Every line parses successfully |
| **Required fields** | Event ID, timestamp, source, and provenance are present |
| **Time order** | Timestamps parse and fall inside expected range |
| **Source attribution** | Every event identifies its producing source |
| **Host attribution** | Host field is present where expected or explicitly unmatched |
| **Duplicate status** | Duplicate handling is documented |
| **Schema version** | Dataset schema is supported |
| **Evidence integrity** | Input hash matches the handoff manifest |

### Validation commands

```bash
jq -c . evidence/events.jsonl >/dev/null
jq -r '.schema_version' evidence/events.jsonl | sort | uniq -c
jq -r '.source // .observer.product // "unknown"' evidence/events.jsonl | sort | uniq -c | sort -nr
jq -r '.timestamp_utc' evidence/events.jsonl | sort | sed -n '1p;$p'
sha256sum -c SHA256SUMS
```

### Stop condition

Do not build baselines from a dataset with unresolved timestamp corruption, unsupported schema, or unknown source coverage. Quality problems become baseline problems.

## 5. Source Enumeration and Profiling

Source profiling identifies every telemetry family and its operational role.

### Source profile fields

| Field | Purpose |
| --- | --- |
| **source_name** | Normalized source identity |
| **observer_product** | Producing tool or platform |
| **record_count** | Total records from source |
| **host_count** | Number of contributing hosts |
| **first_event_utc** | Earliest event |
| **last_event_utc** | Latest event |
| **event_kinds** | Event categories produced |
| **top_event_codes** | Most frequent codes or IDs |
| **required_field_rate** | Percentage containing required fields |

### Enumeration commands

```bash
jq -r '.source // .observer.product // "unknown"' evidence/events.jsonl \
  | sort \
  | uniq -c \
  | sort -nr

jq -r '[.source // .observer.product // "unknown", .host.name // "unknown"] | @tsv' evidence/events.jsonl \
  | sort -u

jq -r '[.source // "unknown", .event.kind // "unknown"] | @tsv' evidence/events.jsonl \
  | sort \
  | uniq -c \
  | sort -nr
```

### Operational role indicators

| Pattern | Likely role |
| --- | --- |
| High process and command-line presence | Endpoint execution telemetry |
| Source and destination fields on most events | Network, firewall, or flow telemetry |
| File paths and operation types | File or audit telemetry |
| User, logon type, and result fields | Authentication telemetry |
| Signature, severity, category, and flow ID | IDS alert telemetry |

## 6. Field Presence and Cardinality

Field presence shows what a source can usually answer. Cardinality shows how diverse the values are.

### Presence interpretation

| Presence rate | Interpretation |
| --- | --- |
| **Near 100%** | Reliable field for general queries |
| **High but not complete** | Useful with null-aware logic |
| **Low** | Source-specific or event-specific context |
| **Unexpectedly zero** | Parser, schema, or source-mapping issue |

### Cardinality interpretation

| Cardinality pattern | Possible meaning |
| --- | --- |
| One value | Constant metadata or parsing mistake |
| Few values | Controlled categories, zones, actions, or severities |
| Many values | Users, processes, domains, files, or event IDs |
| Nearly unique | Event IDs, hashes, command lines, or high-noise values |

### Python field profiler

```python
#!/usr/bin/env python3
import json
import sys
from collections import Counter, defaultdict

present = Counter()
values = defaultdict(Counter)
total = 0

for line in open(sys.argv[1], encoding="utf-8"):
    event = json.loads(line)
    total += 1
    for field in ("source", "timestamp_utc"):
        if event.get(field) is not None:
            present[field] += 1
            values[field][str(event[field])] += 1

print(json.dumps({
    "total": total,
    "presence": dict(present),
    "cardinality": {key: len(counter) for key, counter in values.items()}
}, indent=2))
```

### Profiling rule

Calculate field presence and cardinality per source, not only for the entire dataset. Global statistics hide source-specific gaps.

## 7. Reusable CLI Query Toolkit

A query toolkit should provide consistent filters, pivots, and summaries without requiring a SIEM.

### Core queries

```bash
# Events for one host
jq -c 'select(.host.name == "server-01")' evidence/events.jsonl

# Events in a UTC time range
jq -c 'select(.timestamp_utc >= "2026-09-01T00:00:00Z" and .timestamp_utc < "2026-09-02T00:00:00Z")' evidence/events.jsonl

# Authentication failures
jq -c 'select(.event.category[]? == "authentication" and .event.outcome == "failure")' evidence/events.jsonl

# Distinct process names per host
jq -r 'select(.process.name != null) | [.host.name,.process.name] | @tsv' evidence/events.jsonl | sort -u

# Top destination IPs
jq -r 'select(.destination.ip != null) | .destination.ip' evidence/events.jsonl | sort | uniq -c | sort -nr | head

# Events by source and hour
jq -r '[.timestamp_utc[0:13], .source] | @tsv' evidence/events.jsonl | sort | uniq -c
```

### Toolkit design

| Requirement | Why it matters |
| --- | --- |
| Accept input path as argument | Reuse across evidence drops |
| Emit JSON or JSON Lines | Support downstream scripts |
| Preserve event IDs | Maintain traceability |
| Use UTC ranges | Avoid timezone ambiguity |
| Fail visibly on invalid input | Prevent silent partial results |
| Document query assumptions | Support peer review |

## 8. Baseline and Evaluation Windows

The baseline window should contain representative known-clean activity. The evaluation window should be separated and never influence the baseline.

### Window selection

| Window | Purpose |
| --- | --- |
| **Baseline** | Learn normal behavior from trusted historical data |
| **Validation** | Test false positives using known-clean data not used for training |
| **Evaluation** | Surface deviations in new or unreviewed activity |

### Eight-day split example

```text
Days 1 to 6: baseline training
Day 7: known-clean validation
Day 8: evaluation
```

Using all seven clean days for training leaves no independent clean day to estimate false positives. When possible, reserve part of the clean window for validation.

### Window manifest example

```json
{
  "timezone": "UTC",
  "baseline_start": "2026-09-01T00:00:00Z",
  "baseline_end": "2026-09-07T00:00:00Z",
  "validation_start": "2026-09-07T00:00:00Z",
  "validation_end": "2026-09-08T00:00:00Z",
  "evaluation_start": "2026-09-08T00:00:00Z",
  "evaluation_end": "2026-09-09T00:00:00Z"
}
```

## 9. Behavioral Baselines

A behavioral baseline models observed patterns. A static threshold applies the same cutoff everywhere.

### Baseline versus threshold

| Behavioral baseline | Static threshold |
| --- | --- |
| Learns host-specific normal | Uses one fixed limit |
| Can model hour and weekday | Often ignores time context |
| Can include sets and distributions | Usually counts one metric |
| Requires clean historical data | Easier to deploy quickly |
| Adapts when intentionally retrained | Remains fixed until edited |

### Baseline design principles

- Build per host or role when enough data exists.
- Store counts, allowed sets, distributions, and time profiles.
- Include observation count and coverage period.
- Record schema and algorithm version.
- Keep baseline generation separate from evaluation.
- Never update a trusted baseline automatically with unreviewed anomalies.

## 10. Authentication Baseline

Authentication baselines describe who logs in, where, when, how, and with what normal outcome.

### Baseline dimensions

| Dimension | Examples |
| --- | --- |
| **Host** | Target system receiving authentication |
| **User** | Normal accounts for the host or role |
| **Source** | Source IP, workstation, or zone |
| **Method** | SSH, console, RDP, network, service logon |
| **Outcome** | Success and failure counts |
| **Time** | Hour of day and day of week |
| **Failure pattern** | Typical failures before success, if any |

### Useful authentication events

| Source | Examples |
| --- | --- |
| **Windows Security** | 4624 success, 4625 failure, 4648 explicit credentials |
| **Linux auth logs** | SSH accepted or failed, sudo, su, PAM outcomes |
| **VPN or firewall** | Remote access authentication and source context |

### Baseline record example

```json
{
  "host": "server-01",
  "users": ["svc-app", "admin-a"],
  "source_zones": ["management"],
  "success_by_hour": {
    "08": 12,
    "09": 18
  },
  "failure_stats": {
    "daily_mean": 2.1,
    "daily_max": 5
  }
}
```

### Authentication anomalies

- New user for host.
- New source IP or zone.
- New logon method.
- Failures far above historical range.
- Success shortly after repeated failures.
- Privileged authentication at an unusual time.

## 11. Process Baseline

Process baselines describe which executables, parents, users, and command patterns normally appear on a host.

### Baseline dimensions

| Dimension | Purpose |
| --- | --- |
| **process.name** | Identify known executables |
| **process.executable** | Distinguish same name in different paths |
| **process.parent.name** | Model normal parent-child relationships |
| **user.name** | Link execution to account context |
| **command_line pattern** | Detect unusual arguments without storing secrets unnecessarily |
| **hash** | Distinguish binary versions when available |
| **frequency** | Separate common operations from rare ones |

### Process inventory query

```bash
jq -r 'select(.process.name != null) | [.host.name,.process.name,.process.parent.name // "unknown",.user.name // "unknown"] | @tsv' baseline.jsonl \
  | sort \
  | uniq -c \
  | sort -nr
```

### Process anomalies

| Anomaly | Why it matters |
| --- | --- |
| New executable name | Possible new software or malicious tool |
| Known name from new path | Possible masquerading or sideloading |
| New parent-child pair | Possible abuse of trusted process |
| Rare process becomes frequent | Behavioral shift or automation |
| Interactive shell under service account | Possible account misuse |
| Encoded or obfuscated command pattern | Possible evasion |

## 12. Network Baseline

Network baselines describe normal destinations, ports, protocols, DNS names, zones, and traffic timing.

### Baseline dimensions

| Dimension | Examples |
| --- | --- |
| **Destination IP** | Approved external or internal endpoints |
| **Destination domain** | Normal DNS or TLS server names |
| **Destination port** | Expected service ports |
| **Protocol** | TCP, UDP, DNS, TLS, HTTP, SMB |
| **Direction** | Inbound, outbound, lateral |
| **Zone pair** | User to server, server to DNS, management to server |
| **Frequency** | Connections per hour or day |
| **Volume** | Bytes and packets when available |

### Destination baseline query

```bash
jq -r 'select(.destination.ip != null) | [.host.name,.destination.ip,(.destination.port // 0),(.network.application // .network.transport // "unknown")] | @tsv' baseline.jsonl \
  | sort \
  | uniq -c \
  | sort -nr
```

### Network anomalies

- New external destination.
- New destination port.
- New zone crossing.
- Rare protocol on a sensitive host.
- DNS query for unseen domain.
- Large data volume relative to host history.
- Periodic connections at unusual intervals.

## 13. File Activity Baseline

File baselines describe expected paths, operations, users, processes, and timing.

### Baseline dimensions

| Dimension | Purpose |
| --- | --- |
| **file.path** | Identify normal working and configuration locations |
| **event.action** | create, modify, delete, read, rename |
| **process.name** | Link file activity to expected applications |
| **user.name** | Identify authorized account context |
| **time profile** | Separate backups and maintenance from unusual access |
| **path sensitivity** | Weight configuration, credential, and system paths more heavily |

### Useful patterns

| Pattern | Interpretation |
| --- | --- |
| Repeated writes to application data directory | Normal application activity |
| Scheduled reads by backup process | Expected maintenance |
| New executable written to temporary directory | Potential staging |
| Service account modifying shell profile | Suspicious persistence opportunity |
| Unexpected access to credential stores | Possible credential discovery |

## 14. Temporal Baseline

Temporal baselines describe when activity occurs and how volume changes across hours and weekdays.

### Temporal profiles

| Profile | Use |
| --- | --- |
| **Events per hour** | Identify spikes and quiet-period activity |
| **Events per weekday** | Separate weekday and weekend patterns |
| **Source counts per hour** | Detect missing or unusually noisy sources |
| **Host counts per hour** | Detect host-specific shifts |
| **Authentication by hour** | Identify off-hours access |
| **Process launches by hour** | Detect unusual execution timing |

### Hourly count query

```bash
jq -r '[.host.name // "unknown", .timestamp_utc[0:13]] | @tsv' baseline.jsonl \
  | sort \
  | uniq -c \
  | sort -k2,2 -k3,3
```

### Temporal anomaly rule

A count is not suspicious only because it is high. Compare it to the same host, same source, same hour, and preferably the same weekday class.

## 15. Host, Role, and Time Specificity

A global baseline often describes no system accurately.

| Scope | Strength | Weakness |
| --- | --- | --- |
| **Global** | Works with little data | Hides host differences |
| **Per role** | Generalizes across similar systems | Requires accurate role labels |
| **Per host** | Most specific | Needs enough historical data |
| **Per host and hour** | Captures timing | Can become sparse |
| **Per host and weekday class** | Models weekday and weekend differences | More complex storage and validation |

### Hierarchical fallback

```text
Use host-specific baseline when sample size is sufficient
Else use role-specific baseline
Else use environment-wide baseline
Always record which level was used
```

### Minimum context fields

- Host or asset ID.
- Asset role.
- Environment, such as production or test.
- Criticality.
- Hour of day.
- Weekday or weekend.
- Source type.

## 16. Machine-Readable Baseline Format

Another script must be able to consume the baseline without human interpretation.

### Baseline metadata

| Field | Purpose |
| --- | --- |
| **schema_version** | Defines file structure |
| **baseline_id** | Stable identifier |
| **generated_at_utc** | Creation time |
| **window_start_utc** | First included event time |
| **window_end_utc** | Last included event time |
| **source_dataset_hash** | Links baseline to source evidence |
| **algorithm_version** | Reproduces the calculation |
| **sample_count** | Shows statistical support |
| **scope** | Host, role, source, and temporal dimensions |

### Baseline file example

```json
{
  "schema_version": "1.0",
  "baseline_id": "network-server-role-v1",
  "generated_at_utc": "2026-09-19T20:00:00Z",
  "window_start_utc": "2026-09-01T00:00:00Z",
  "window_end_utc": "2026-09-07T00:00:00Z",
  "algorithm_version": "1.0.0",
  "scope": {
    "asset_role": "application_server",
    "environment": "production"
  },
  "sample_count": 9200,
  "normal_destinations": [
    {
      "ip": "198.51.100.20",
      "port": 443,
      "frequency": 740
    }
  ]
}
```

## 17. Anomaly Detection

Anomaly detection compares evaluation activity to the values, sets, distributions, and time profiles stored in the baseline.

### Anomaly classes

| Class | Example |
| --- | --- |
| **Novel value** | New process, user, domain, IP, port, or file path |
| **Frequency deviation** | Event count far above normal |
| **Temporal deviation** | Normal activity at an unusual hour |
| **Relationship deviation** | Known process with new parent or destination |
| **Cross-zone deviation** | Host communicates across an unseen zone pair |
| **Missing expected activity** | Telemetry source or scheduled process disappears |

### Detection record

```json
{
  "anomaly_id": "ANO-00042",
  "timestamp_utc": "2026-09-08T02:14:22Z",
  "host": "server-01",
  "anomaly_type": "new_process_destination_pair",
  "observed": {
    "process": "powershell.exe",
    "destination_ip": "203.0.113.77",
    "destination_port": 443
  },
  "baseline_reference": "process-network-server-01-v1",
  "deviation_score": 0.92,
  "evidence_ids": ["evt-1001", "evt-1002"]
}
```

### Detection rule

Novelty is not guilt. Every anomaly must retain the observed event, baseline reference, deviation reason, and supporting evidence IDs.

## 18. Deviation Magnitude

Deviation magnitude measures how far observation differs from expectation.

### Useful methods

| Method | Appropriate for |
| --- | --- |
| **Set membership** | New users, processes, IPs, domains, or files |
| **Ratio to mean** | Count spikes when mean is stable and nonzero |
| **Percentile** | Skewed count distributions |
| **Median absolute deviation** | Robust volume baselines with outliers |
| **Z-score** | Roughly symmetric distributions with sufficient samples |
| **Rarity score** | Infrequent values and relationships |

### Simple count deviation

```text
deviation_ratio = observed_count / max(baseline_mean, 1)
```

### Z-score concept

```text
z = (observed - baseline_mean) / baseline_standard_deviation
```

### Deviation caution

Small samples and zero variance can produce misleading scores. Record sample size and use explicit fallback logic.

## 19. Cross-Source Correlation

A single-source anomaly may be benign. Independent evidence from another source increases confidence.

### Correlation keys

| Key | Use |
| --- | --- |
| **Host or asset ID** | Link endpoint and network events |
| **Time window** | Group activity occurring close together |
| **User** | Link authentication and execution |
| **Process ID or GUID** | Link process creation and network connection |
| **IP and port** | Link firewall, flow, DNS, and endpoint activity |
| **Domain** | Link DNS query, TLS SNI, and process activity |
| **File path or hash** | Link file creation and execution |

### Correlation example

```text
02:14:20 authentication anomaly on server-01
02:14:22 new process on server-01
02:14:25 new DNS query from server-01
02:14:26 new outbound connection from server-01
     ↓
One correlated finding with four evidence sources
```

### Correlation window

Choose windows based on behavior. One minute may fit process-to-network activity, while authentication-to-lateral-movement correlation may require several minutes.

## 20. Composite Risk Scoring

Composite scoring ranks findings. It does not prove maliciousness.

### Scoring inputs

| Input | Example range |
| --- | --- |
| **Asset criticality** | 0 to 5 |
| **Deviation magnitude** | 0 to 5 |
| **Cross-source confirmation** | 0 to 5 |
| **Privilege context** | 0 to 3 |
| **Behavior severity** | 0 to 5 |
| **Data quality confidence** | 0 to 2 |
| **Known benign explanation** | 0 to minus 5 |

### Example formula

```text
score =
  asset_criticality × 2
  + deviation_magnitude × 2
  + cross_source_confirmation × 3
  + privilege_context
  + behavior_severity × 2
  + data_quality_confidence
  - benign_explanation
```

### Score record requirements

- Store each component separately.
- Store the formula version.
- Do not hide missing evidence inside a total score.
- Use deterministic tie breaking.
- Let analysts inspect why one item ranked above another.

## 21. Anomaly Ranking and Triage

The output should place the most dangerous and best-supported finding first.

### Ranking order

```text
1. Composite score descending
2. Cross-source count descending
3. Asset criticality descending
4. Timestamp ascending
5. Anomaly ID ascending
```

### Triage levels

| Level | Suggested meaning |
| --- | --- |
| **Critical** | High-impact asset, major deviation, multiple independent sources |
| **High** | Strong anomaly with meaningful business or privilege context |
| **Medium** | Credible deviation needing review but limited corroboration |
| **Low** | Weak novelty, low-impact asset, or likely operational change |
| **Informational** | Baseline drift or data-quality observation |

### Ranked finding fields

| Field | Purpose |
| --- | --- |
| **rank** | Queue position |
| **finding_id** | Stable identifier |
| **score** | Composite score |
| **severity** | Triage category |
| **summary** | One-line human-readable description |
| **host** | Affected asset |
| **first_seen_utc** | Timeline start |
| **last_seen_utc** | Timeline end |
| **source_count** | Number of independent telemetry sources |
| **evidence_ids** | Supporting normalized events |
| **score_components** | Explainable scoring inputs |

## 22. False-Positive Validation

Every baseline should be tested against known-clean data not used to build it.

### Validation workflow

```text
Train baseline on clean subset
     ↓
Run anomaly detector on separate clean subset
     ↓
Measure findings and analyst review burden
     ↓
Adjust scope or scoring
     ↓
Repeat until false-positive rate is bounded
```

### Validation metrics

| Metric | Meaning |
| --- | --- |
| **Clean events evaluated** | Size of validation set |
| **Anomalies generated** | Total findings on clean data |
| **False positives confirmed** | Benign findings after review |
| **False-positive rate** | False findings divided by evaluated units |
| **Findings per host per day** | Operational analyst burden |
| **Top noisy baseline** | Baseline producing most benign alerts |

### Validation principle

A baseline that flags normal operations continuously is not useful, even if the mathematics are correct.

## 23. Reusable Baseline Package

The package should run against a fresh normalized dataset with one command and no source-code edits.

```text
baseline_package/
├── README.md
├── bin/
│   ├── build-baselines.sh
│   ├── detect-anomalies.sh
│   └── run-analysis.sh
├── config/
│   ├── windows.json
│   ├── scoring.json
│   └── roles.json
├── queries/
│   ├── source-profile.jq
│   ├── auth-failures.jq
│   ├── process-inventory.jq
│   └── network-destinations.jq
├── baselines/
│   ├── authentication.json
│   ├── processes.json
│   ├── network.json
│   ├── files.json
│   └── temporal.json
├── output/
│   ├── anomalies.jsonl
│   ├── correlated-findings.jsonl
│   ├── ranked-findings.json
│   └── validation-report.json
└── manifest.json
```

### One-command execution

```bash
./bin/run-analysis.sh \
  --input evidence/events.jsonl \
  --package baseline_package \
  --output analysis-output
```

### Package qualities

| Quality | Requirement |
| --- | --- |
| **Portable** | Uses relative paths and declared dependencies |
| **Deterministic** | Same input and config produce equivalent output |
| **Explainable** | Anomalies show baseline and score components |
| **Validated** | Includes known-clean false-positive report |
| **Versioned** | Schema, algorithm, and scoring versions recorded |
| **Zero configuration** | Defaults work for documented normalized schema |

## 24. Professional Judgment

Behavioral anomalies are leads, not verdicts.

**Escalate when** deviation is meaningful, the asset is important, independent sources corroborate it, and no known benign explanation fits.

**Tune or suppress only when** the benign explanation is verified, scope is narrow, expiry is defined, and evidence remains available.

| Decision field | What it records |
| --- | --- |
| **finding_id** | Anomaly or correlated finding |
| **disposition** | escalate, investigate, benign, tune, or monitor |
| **reason** | Evidence-based explanation |
| **supporting_evidence** | Event IDs and source pointers |
| **reviewer** | Analyst making the decision |
| **expires_at** | End of temporary suppression or exception |

Do not retrain a baseline on unexplained anomalies. Review them first, then deliberately accept or reject the behavior.

## 25. Framework and Tool Map

| Item | Purpose |
| --- | --- |
| **NIST SP 800-137** | Continuous monitoring, visibility, and control-effectiveness context |
| **MITRE ATT&CK** | Relate behaviors to useful telemetry and detection strategies |
| **Windows Security events** | Authentication, account, process, and policy activity |
| **Linux audit framework** | System calls, execution, file, identity, and privilege evidence |
| **Suricata EVE JSON** | Network alerts, flows, DNS, HTTP, TLS, and anomalies |
| **jq** | Query and aggregate normalized JSON |
| **Python** | Baseline computation, statistics, correlation, and packaging |
| **awk** | Lightweight text processing and tabular summaries |
| **sort and uniq** | Deterministic frequency and cardinality analysis |
| **date** | UTC window calculations |

## 26. Fast Recall

- **A baseline describes normal behavior from known-clean history.** It is not the same as a static threshold.
- **Validate dataset quality before analysis.** Timestamp or source errors contaminate baselines.
- **Profile every source.** Count records, hosts, event kinds, fields, and time coverage.
- **Field presence tells you what a source can answer. Cardinality tells you how diverse it is.**
- **Build CLI queries that accept paths and emit structured output.**
- **Keep training, validation, and evaluation windows separate.**
- **Authentication baselines model users, sources, methods, outcomes, and time.**
- **Process baselines model names, paths, parents, users, commands, and frequency.**
- **Network baselines model destinations, ports, protocols, domains, zones, and volume.**
- **File baselines model paths, actions, processes, users, and sensitive locations.**
- **Temporal baselines should be host, source, hour, and weekday aware.**
- **Use host baselines when samples are sufficient, otherwise fall back to role baselines.**
- **Store baselines as versioned JSON with window and sample metadata.**
- **Novelty is not guilt.** Preserve the reason, baseline reference, and evidence.
- **Cross-source confirmation multiplies confidence.**
- **Composite scores must be explainable.** Store every component and formula version.
- **Validate on known-clean data to bound false positives.**
- **Never retrain on unexplained anomalies.**

## 27. Resources

**Baseline analysis and continuous monitoring**
- [NIST SP 800-137: Information Security Continuous Monitoring](https://csrc.nist.gov/pubs/sp/800/137/final)
- [NIST SP 800-137A: Assessing ISCM Programs](https://csrc.nist.gov/pubs/sp/800/137/a/final)

**Log field semantics**
- [Microsoft: Audit logon events](https://learn.microsoft.com/en-us/windows/security/threat-protection/auditing/basic-audit-logon-events)
- [Linux Audit documentation](https://linux-audit.com/)
- [Suricata EVE JSON Output](https://docs.suricata.io/en/latest/output/eve/eve-json-output.html)

**Correlation and detection theory**
- [MITRE ATT&CK: Data Sources](https://attack.mitre.org/datasources/)
- [MITRE ATT&CK: Data and Tools](https://attack.mitre.org/resources/attack-data-and-tools/)
- [MITRE ATT&CK Data Model: Detections and Data Sources](https://mitre-attack.github.io/attack-data-model/docs/principles/attack-detections/)
- [The Pyramid of Pain](https://detect-respond.blogspot.com/2013/03/the-pyramid-of-pain.html)

**Man or help**
```text
man jq
man awk
man sort
man date
man python3
```
