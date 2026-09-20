# Evidence Pipeline

> **⚠️ AUTHORIZED USE ONLY.** This material is for education, defensive evidence engineering, and authorized log processing. Process only evidence you are permitted to access. Raw logs can contain personal data, credentials, tokens, internal addresses, and regulated information. Preserve originals, restrict access, record transformations, use UTC consistently, and never overwrite source evidence. See the [Legal and Terms of Use](/legal) page.

> "Before you can find the needle, you have to build the haystack you can actually search." (SOC engineering proverb)

**Scope:** Security evidence engineering without a centralized SIEM: source inventory, EVTX parsing, Linux syslog parsing, Suricata EVE JSON processing, firewall CSV parsing, JSON ingestion, unified event schema design, timestamp normalization, duplicate detection, malformed-record quarantine, encoding repair, asset and network enrichment, chronological indexing, quality validation, provenance preservation, single-command orchestration, bounded pipeline specification, and analyst-ready evidence handoff.

## Table of Contents
- [Core Concepts](#core-concepts)
- [Evidence Pipeline Fundamentals](#evidence-pipeline-fundamentals)
- [Pipeline Architecture](#pipeline-architecture)
- [Source Inventory](#source-inventory)
- [Raw Format Differences](#raw-format-differences)
- [Intake and Evidence Preservation](#intake-and-evidence-preservation)
- [Parsing Windows EVTX](#parsing-windows-evtx)
- [Parsing Linux Syslog](#parsing-linux-syslog)
- [Parsing Suricata EVE JSON](#parsing-suricata-eve-json)
- [Parsing Firewall CSV](#parsing-firewall-csv)
- [Parsing Generic JSON and Telemetry Packages](#parsing-generic-json-and-telemetry-packages)
- [Unified Event Schema](#unified-event-schema)
- [Required and Optional Fields](#required-and-optional-fields)
- [Timestamp Normalization](#timestamp-normalization)
- [Cleaning Dirty Data](#cleaning-dirty-data)
- [Deduplication](#deduplication)
- [Fidelity and Searchability](#fidelity-and-searchability)
- [Asset and Network Enrichment](#asset-and-network-enrichment)
- [Chronological Timeline](#chronological-timeline)
- [Data Quality Validation](#data-quality-validation)
- [Single-Command Pipeline](#single-command-pipeline)
- [Pipeline Specification](#pipeline-specification)
- [Evidence Handoff Package](#evidence-handoff-package)
- [Professional Judgment](#professional-judgment)
- [Framework and Tool Map](#framework-and-tool-map)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Concepts

| Term | Meaning |
| --- | --- |
| **Evidence pipeline** | A repeatable workflow that turns raw security exports into validated, analyst-ready records |
| **Intake** | Discovering, identifying, hashing, and registering source files |
| **Parsing** | Converting source-specific syntax into structured fields |
| **Normalization** | Mapping different source fields into a common schema |
| **Cleaning** | Correcting, flagging, or quarantining malformed and inconsistent records |
| **Enrichment** | Adding asset, network, ownership, or criticality context without changing the original event |
| **Indexing** | Organizing events for chronological or field-based lookup |
| **Provenance** | Information showing where an event came from and how it was transformed |
| **Quarantine** | Separate storage for records that cannot be safely normalized |
| **Analyst-ready evidence** | Validated records with consistent timestamps, fields, source attribution, and useful context |

### The core idea

```text
Raw exports
     ↓
Intake and preserve
     ↓
Parse source formats
     ↓
Normalize fields
     ↓
Clean dirty records
     ↓
Enrich with context
     ↓
Index chronologically
     ↓
Validate quality
     ↓
Deliver analyst-ready evidence
```

A pipeline does not make bad evidence true. It makes quality, uncertainty, and provenance visible enough that an analyst can use the evidence safely.

## 2. Evidence Pipeline Fundamentals

The SOC depends on reliable records. Detection, hunting, triage, and timelines fail when timestamps disagree, fields disappear, sources are misidentified, or duplicates inflate activity.

### Why each stage exists

| Stage | Purpose | Failure if omitted |
| --- | --- | --- |
| **Intake** | Register files and preserve originals | Missing files, unknown origin, broken chain of evidence |
| **Parse** | Extract structured fields | Data remains unsearchable text or binary |
| **Normalize** | Use consistent names and types | Queries work on one source but fail on another |
| **Clean** | Handle malformed or inconsistent records | Bad timestamps and fields corrupt analysis |
| **Enrich** | Add asset and network meaning | Analysts cannot judge importance quickly |
| **Index** | Order and organize events | Timelines and lookup become slow or inaccurate |
| **Validate** | Measure completeness and correctness | Pipeline failures remain silent |

### Pipeline contract

```text
Input: immutable raw exports + schema + enrichment data
Output: normalized JSON Lines + timeline + quality report + quarantine
Guarantee: every output record points back to its source
```

## 3. Pipeline Architecture

A secure pipeline separates immutable evidence, temporary work, final output, and rejected records.

```text
evidence-pipeline/
├── README.md
├── bin/
│   └── run-pipeline.sh
├── config/
│   ├── schema.json
│   ├── source-map.json
│   └── enrichment.json
├── parsers/
│   ├── parse_evtx.py
│   ├── parse_syslog.py
│   ├── parse_eve.py
│   ├── parse_firewall_csv.py
│   └── parse_json.py
├── raw/
├── work/
├── output/
│   ├── events.jsonl
│   ├── timeline.jsonl
│   ├── source-inventory.json
│   ├── quality-report.json
│   └── pipeline-summary.json
├── quarantine/
├── logs/
└── manifest.json
```

### Directory rules

| Directory | Rule |
| --- | --- |
| **raw/** | Read-only source evidence, never modified |
| **work/** | Temporary parsed or intermediate data |
| **output/** | Validated analyst-ready artifacts only |
| **quarantine/** | Rejected records plus failure reason |
| **logs/** | Pipeline execution and stage diagnostics |
| **config/** | Versioned schema, mappings, and enrichment data |

## 4. Source Inventory

Inventory answers what arrived, from where, in which format, and whether it changed.

### Required inventory fields

| Field | Purpose |
| --- | --- |
| **source_file** | Relative path to the export |
| **source_type** | evtx, syslog, eve_json, firewall_csv, json, or unknown |
| **size_bytes** | Detect truncation or unexpected emptiness |
| **sha256** | Verify file integrity |
| **modified_at_utc** | File-system timestamp for operational context |
| **first_event_utc** | Earliest successfully parsed event |
| **last_event_utc** | Latest successfully parsed event |
| **record_count** | Number of raw or parsed records |
| **parser** | Parser selected for the file |
| **status** | pending, parsed, partial, failed, or unsupported |

### Inventory commands

```bash
find raw -type f -printf '%P\t%s\t%TY-%Tm-%TdT%TH:%TM:%TSZ\n' | sort
find raw -type f -print0 | sort -z | xargs -0 sha256sum
file raw/*
```

### Inventory principle

Unknown files are findings. Record them as unsupported or unknown rather than silently skipping them.

## 5. Raw Format Differences

Security sources describe events differently. Parsing must preserve those differences before normalization reconciles them.

| Source | Typical structure | Common challenge |
| --- | --- | --- |
| **Windows EVTX** | Binary records with provider, channel, Event ID, XML fields | Binary parsing, provider-specific fields, localized messages |
| **Linux syslog** | Plain text with timestamp, host, process, PID, and message | Missing year or timezone, multiline records, inconsistent messages |
| **Suricata EVE** | JSON object per line with event-specific nested objects | Mixed event types and changing source-specific fields |
| **Firewall CSV** | Header plus delimited rows | Delimiter, quoting, column drift, repeated headers |
| **Generic JSON** | Object, array, or JSON Lines | Inconsistent nesting, types, schemas, and encodings |
| **Telemetry package** | Multiple files and source conventions | Duplicate events, mixed time formats, uncertain precedence |

### Reconciliation principle

Normalize shared meaning but preserve source-specific detail under a dedicated source object or raw-event field.

## 6. Intake and Evidence Preservation

Intake must protect originals before parsing begins.

### Intake sequence

```text
Discover file
     ↓
Determine type
     ↓
Calculate hash
     ↓
Record metadata
     ↓
Set raw evidence read-only
     ↓
Create working copy or stream read-only
```

### Preservation commands

```bash
mkdir -p raw work output quarantine logs
find raw -type f -print0 | sort -z | xargs -0 sha256sum > output/raw-SHA256SUMS
chmod -R a-w raw
sha256sum -c output/raw-SHA256SUMS
```

### Provenance fields

| Field | Meaning |
| --- | --- |
| **observer.name** | System or tool that produced the source record |
| **source.file** | Original relative file path |
| **source.record_id** | Native record number, line number, or event identifier |
| **source.sha256** | Hash of original file |
| **pipeline.parser** | Parser name and version |
| **pipeline.run_id** | Unique pipeline execution ID |
| **pipeline.ingested_at_utc** | Time the record entered the pipeline |

## 7. Parsing Windows EVTX

EVTX is a binary Windows Event Log format. The parser should extract structured XML or JSON rather than depend only on rendered message text.

### Important fields

| Native field | Normalized purpose |
| --- | --- |
| **EventID** | event.code |
| **Provider Name** | event.provider |
| **Channel** | log.channel |
| **Computer** | host.name |
| **TimeCreated** | event.created and timestamp_utc |
| **EventRecordID** | source.record_id |
| **Security UserID** | user.id where applicable |
| **EventData** | Source-specific fields preserved in event.original_fields |

### EVTX conversion example

```bash
mkdir -p work/evtx

evtx_dump raw/Security.evtx \
  --format jsonl \
  --output work/evtx/security.jsonl

wc -l work/evtx/security.jsonl
head -n 1 work/evtx/security.jsonl | jq .
```

### Parsing rules

- Preserve Event ID as an integer when possible.
- Preserve the provider and channel.
- Do not drop fields only because they are unknown.
- Keep the native record ID for traceability.
- Quarantine records that cannot be decoded, including the parser error.

## 8. Parsing Linux Syslog

Syslog often looks simple but may omit year, timezone, host, or structured fields.

### Common classic syslog pattern

```text
Jan 15 08:42:17 host sshd[2451]: Failed password for invalid user admin from 192.0.2.10 port 51120 ssh2
```

### Extractable fields

| Field | Example |
| --- | --- |
| **Timestamp fragment** | Jan 15 08:42:17 |
| **Hostname** | host |
| **Process** | sshd |
| **PID** | 2451 |
| **Message** | Failed password... |
| **Source IP** | 192.0.2.10, when present |
| **Source port** | 51120, when present |

### Parsing considerations

```text
If year is missing: infer only from documented file context
If timezone is missing: use source metadata, never guess silently
If hostname is missing: enrich only when source mapping is reliable
If a line is a continuation: join using documented multiline rules
```

### Command-line inspection

```bash
awk '{print NR "\t" $0}' raw/auth.log | head
sed -n '1,20p' raw/syslog
file -bi raw/auth.log
```

## 9. Parsing Suricata EVE JSON

Suricata EVE commonly stores one JSON event per line. Events share top-level context but contain event-specific objects such as alert, dns, http, tls, flow, fileinfo, or anomaly.

### Common top-level mappings

| EVE field | Unified field |
| --- | --- |
| **timestamp** | timestamp_utc |
| **event_type** | event.kind or event.category |
| **src_ip** | source.ip |
| **src_port** | source.port |
| **dest_ip** | destination.ip |
| **dest_port** | destination.port |
| **proto** | network.transport |
| **app_proto** | network.application |
| **flow_id** | network.flow_id |
| **alert.signature_id** | rule.id |
| **alert.signature** | rule.name |
| **alert.severity** | event.severity |

### EVE checks

```bash
jq -c . raw/eve.json > work/eve-valid.jsonl
jq -r '.event_type' work/eve-valid.jsonl | sort | uniq -c | sort -nr
jq -c 'select(.event_type == "alert")' work/eve-valid.jsonl | head
jq -r 'select(.event_type == "alert") | [.timestamp,.src_ip,.dest_ip,.alert.signature] | @tsv' work/eve-valid.jsonl
```

### Preservation rule

Keep the complete original EVE object or its lossless source-specific subtree. Different event types contain different fields, and flattening everything can destroy useful protocol detail.

## 10. Parsing Firewall CSV

CSV parsing must use a CSV-aware parser. Splitting on commas with awk breaks quoted values, embedded commas, and escaped text.

### CSV risks

| Risk | Example effect |
| --- | --- |
| **Embedded delimiter** | Message field splits into extra columns |
| **Quoted newline** | One event appears as several physical lines |
| **Repeated header** | Header becomes a false event |
| **Column drift** | New firmware adds or renames fields |
| **Mixed types** | Port appears as number, blank, or text |
| **Encoding variation** | Parser fails on non-UTF-8 characters |

### Python CSV pattern

```python
#!/usr/bin/env python3
import csv
import json
import sys

with open(sys.argv[1], newline="", encoding="utf-8-sig", errors="replace") as handle:
    reader = csv.DictReader(handle)
    for row_number, row in enumerate(reader, start=2):
        print(json.dumps({
            "source_record": row_number,
            "fields": row
        }, ensure_ascii=False))
```

### Firewall mappings

| Firewall field | Unified field |
| --- | --- |
| Source address | source.ip |
| Source port | source.port |
| Destination address | destination.ip |
| Destination port | destination.port |
| Protocol | network.transport |
| Action | event.action |
| Rule or policy ID | rule.id |
| Interface or zone | source.zone or destination.zone |
| Bytes sent and received | network.bytes or directional byte fields |

## 11. Parsing Generic JSON and Telemetry Packages

Generic JSON may be a single object, an array, or JSON Lines. Detect the representation before processing.

### Representation tests

```bash
jq type raw/events.json
jq -e . raw/events.json >/dev/null
head -n 1 raw/events.jsonl | jq .
```

### Parser behavior

| Input shape | Expected handling |
| --- | --- |
| **Single object** | Emit one parsed record |
| **Array** | Emit one parsed record per element |
| **JSON Lines** | Parse each line independently |
| **Nested package** | Walk known files using source-map configuration |
| **Invalid JSON** | Quarantine record or file with error details |

### Source-map example

```json
{
  "patterns": [
    {
      "glob": "**/*.evtx",
      "source_type": "windows_evtx",
      "parser": "parse_evtx.py"
    },
    {
      "glob": "**/eve.json",
      "source_type": "suricata_eve",
      "parser": "parse_eve.py"
    },
    {
      "glob": "**/*.csv",
      "source_type": "firewall_csv",
      "parser": "parse_firewall_csv.py"
    }
  ]
}
```

## 12. Unified Event Schema

A unified schema gives analysts predictable fields across sources while keeping source-specific evidence available.

### Schema layers

| Layer | Purpose |
| --- | --- |
| **Core** | Fields required for every usable event |
| **Context** | Common user, process, network, file, and rule fields |
| **Enrichment** | Asset, owner, criticality, and zone data |
| **Provenance** | Original file, record ID, parser, and pipeline metadata |
| **Source-specific** | Native fields that do not map safely into the common schema |

### Unified event example

```json
{
  "schema_version": "1.0",
  "event_id": "run-001:suricata:4831",
  "timestamp_utc": "2026-09-19T18:42:17.123Z",
  "event": {
    "kind": "alert",
    "category": ["network", "intrusion_detection"],
    "action": "allowed",
    "severity": 2,
    "code": "2100498"
  },
  "host": {
    "name": "sensor-01"
  },
  "source": {
    "ip": "192.0.2.10",
    "port": 51120,
    "zone": "user"
  },
  "destination": {
    "ip": "198.51.100.20",
    "port": 443,
    "zone": "server"
  },
  "network": {
    "transport": "tcp",
    "application": "tls",
    "flow_id": "123456789"
  },
  "rule": {
    "id": "2100498",
    "name": "Example network alert"
  },
  "asset": {
    "criticality": "high",
    "owner": "infrastructure"
  },
  "observer": {
    "product": "suricata"
  },
  "provenance": {
    "source_file": "raw/eve.json",
    "source_record_id": "4831",
    "parser": "parse_eve.py",
    "pipeline_run_id": "run-001"
  },
  "source_specific": {}
}
```

## 13. Required and Optional Fields

Required fields make events searchable and traceable. Optional fields appear only when supported by evidence.

### Required fields

| Field | Justification |
| --- | --- |
| **schema_version** | Identifies interpretation rules |
| **event_id** | Uniquely identifies the normalized record |
| **timestamp_utc** | Enables chronology and correlation |
| **event.kind** | Gives broad event meaning |
| **observer.product** | Identifies producing technology |
| **provenance.source_file** | Links to original evidence |
| **provenance.source_record_id** | Links to the native record |
| **provenance.pipeline_run_id** | Links to transformation execution |

### Optional fields

| Field group | Present when |
| --- | --- |
| **host** | Event relates to an identifiable host |
| **user** | Source contains account context |
| **process** | Process identity or command is available |
| **source and destination** | Event contains network endpoints |
| **file** | File activity is present |
| **rule** | Alert or firewall rule generated the event |
| **asset** | Reliable enrichment match exists |
| **source_specific** | Native fields do not map safely |

### Null rule

Do not invent values. Use null only when the schema allows it and the distinction from absent is meaningful. Record enrichment failures explicitly rather than guessing.

## 14. Timestamp Normalization

Chronology fails when timestamps use different zones, precision, or assumptions.

### Normalization target

```text
UTC ISO 8601 with explicit Z suffix
Example: 2026-09-19T18:42:17.123Z
```

### Timestamp issues

| Problem | Safe handling |
| --- | --- |
| Missing timezone | Use documented source timezone or mark unresolved |
| Missing year | Infer only from file context and record the inference |
| Local daylight-saving transition | Use timezone database, not fixed offset guessing |
| Mixed second precision | Preserve source precision, normalize display format |
| Clock drift | Preserve original time and add a documented correction field |
| Invalid date | Quarantine or mark timestamp invalid |

### GNU date examples

```bash
date -u -d '2026-09-19 22:42:17 +0400' +'%Y-%m-%dT%H:%M:%SZ'
date -u -d @1758307337 +'%Y-%m-%dT%H:%M:%SZ'
```

### Time fields

| Field | Meaning |
| --- | --- |
| **event.original_timestamp** | Timestamp exactly as received |
| **timestamp_utc** | Normalized event time |
| **pipeline.ingested_at_utc** | Intake time |
| **timestamp_quality** | exact, converted, inferred, corrected, or invalid |

## 15. Cleaning Dirty Data

Cleaning makes defects explicit. It must not silently rewrite evidence without preserving the original.

### Common dirty-data conditions

| Condition | Cause | Handling |
| --- | --- | --- |
| Malformed timestamp | Vendor bug, truncated record, bad export | Quarantine or mark invalid |
| Duplicate event | Re-export, overlapping collection, replay | Deduplicate with documented key |
| Encoding error | Mixed code pages or damaged bytes | Decode with replacement and flag quality |
| Missing hostname | Source omitted host field | Enrich only from reliable source mapping |
| Mixed field type | Port or severity represented inconsistently | Coerce safely and preserve original |
| Truncated line | Interrupted copy or rotation | Quarantine with reason |
| Repeated CSV header | Concatenated exports | Detect and skip as metadata |
| Invalid IP address | Bad source data | Preserve raw value and mark invalid |

### Quarantine record example

```json
{
  "pipeline_run_id": "run-001",
  "source_file": "raw/firewall.csv",
  "source_record_id": "211",
  "failure_stage": "normalize",
  "reason_code": "INVALID_TIMESTAMP",
  "reason": "Timestamp could not be parsed using declared source timezone",
  "raw_record": "..."
}
```

### Cleaning principle

Correct only when the transformation is deterministic and documented. Otherwise, preserve, flag, and quarantine.

## 16. Deduplication

Duplicate records distort alert counts, timelines, and frequency-based detections.

### Deduplication keys

| Source | Candidate key |
| --- | --- |
| **EVTX** | File hash + channel + EventRecordID |
| **Suricata EVE** | File hash + line number, or stable event fields when overlapping files are known |
| **Syslog** | Source file + line number for identity; content fingerprint for overlap detection |
| **Firewall CSV** | Device ID + native event ID, or normalized field fingerprint |
| **Generic JSON** | Native ID where reliable; otherwise canonical content hash |

### Canonical fingerprint concept

```text
fingerprint = SHA-256(
  normalized timestamp + source type + host + event code +
  source IP + destination IP + message or action
)
```

### Duplicate statuses

| Status | Meaning |
| --- | --- |
| **unique** | No matching event found |
| **exact_duplicate** | Same stable ID or byte-equivalent content |
| **probable_duplicate** | Matching fingerprint within defined window |
| **retained_duplicate** | Duplicate kept because source attribution differs materially |

## 17. Fidelity and Searchability

Normalization is a trade-off. A narrow common schema makes searching easier but can remove details needed for investigation.

| Choice | Benefit | Cost |
| --- | --- | --- |
| Flatten all fields | Easy simple queries | Collisions and lost nesting |
| Keep only common fields | Consistent analytics | Drops source-specific evidence |
| Preserve entire raw object | Maximum fidelity | Larger records and harder queries |
| Hybrid schema | Searchable core plus native detail | More design and storage complexity |

### Recommended pattern

```text
Normalized core fields
+ typed context objects
+ provenance
+ complete source-specific subtree
+ pointer to immutable raw evidence
```

### Loss register

Every parser should document fields renamed, coerced, combined, dropped, or moved. If a field is intentionally discarded, record why.

## 18. Asset and Network Enrichment

The same event has different operational meaning when it affects a critical server instead of a test system.

### Enrichment sources

| Source | Added context |
| --- | --- |
| **Asset inventory** | Asset ID, hostname, owner, platform, criticality |
| **Network map** | Zone, subnet, site, environment |
| **Identity directory** | Department, account type, privilege level |
| **Service catalog** | Application role and business service |
| **Threat intelligence** | Indicator reputation and confidence, when available |

### Enrichment data example

```json
{
  "assets": {
    "10.30.0.20": {
      "asset_id": "AST-0020",
      "hostname": "app-server-01",
      "criticality": "high",
      "owner": "applications",
      "zone": "server",
      "environment": "production"
    }
  }
}
```

### Enrichment rules

- Keep enrichment separate from observed source data.
- Record the enrichment source and version.
- Do not overwrite native hostnames or addresses.
- Mark unmatched assets explicitly.
- Prefer stable asset IDs over mutable hostnames.

## 19. Chronological Timeline

The timeline is the primary lookup tool during an incident. It must be sortable, attributable, and traceable.

### Timeline sort order

```text
1. timestamp_utc
2. event_id
3. provenance.source_file
4. provenance.source_record_id
```

A deterministic secondary order makes repeated builds produce the same result.

### Timeline generation

```bash
jq -c . output/events.jsonl \
  | sort -t '"' -k4,4 \
  > output/timeline.jsonl
```

For robust production use, parse the timestamp into a sortable key rather than relying on field position.

### Timeline view fields

| Field | Analyst use |
| --- | --- |
| **timestamp_utc** | Event order |
| **event_id** | Stable lookup |
| **host.name** | Affected system |
| **event.kind** | Broad event type |
| **event.action** | What happened |
| **source.ip** | Origin of network activity |
| **destination.ip** | Target of network activity |
| **observer.product** | Source attribution |
| **asset.criticality** | Triage context |
| **provenance pointer** | Return to source evidence |

## 20. Data Quality Validation

Quality validation measures whether the output can support detection and investigation.

### Quality dimensions

| Dimension | Question |
| --- | --- |
| **Validity** | Do records conform to schema and field types? |
| **Completeness** | Are required fields present? |
| **Uniqueness** | Are duplicates measured and handled? |
| **Timeliness** | Is the expected time range covered? |
| **Consistency** | Are timestamps, IPs, ports, and severities typed consistently? |
| **Traceability** | Can every event return to original evidence? |
| **Coverage** | Did every identified source produce parsed output or a visible failure? |

### Quality metrics

```text
parse_success_rate = parsed_records / attempted_records × 100
required_field_rate = records_with_all_required_fields / normalized_records × 100
duplicate_rate = duplicates / parsed_records × 100
enrichment_match_rate = enriched_records / enrichable_records × 100
quarantine_rate = quarantined_records / attempted_records × 100
```

### Quality report example

```json
{
  "pipeline_run_id": "run-001",
  "attempted_records": 50000,
  "parsed_records": 49600,
  "normalized_records": 49550,
  "quarantined_records": 450,
  "duplicates_removed": 1200,
  "required_field_rate": 99.8,
  "enrichment_match_rate": 94.2,
  "source_failures": 0,
  "quality_gate": "pass"
}
```

## 21. Single-Command Pipeline

The complete workflow must run from one command and generalize to unseen files that match documented source patterns.

### Pipeline command

```bash
./bin/run-pipeline.sh \
  --input raw \
  --output output \
  --config config \
  --quarantine quarantine
```

### Orchestrator stages

```text
preflight
inventory
parse
normalize
clean
establish duplicate status
enrich
index
validate
package
```

### Exit codes

| Exit code | Meaning |
| --- | --- |
| **0** | Pipeline completed and quality gates passed |
| **1** | Controlled data-quality failure or unsupported records found |
| **2** | Environment error, missing dependency, missing configuration, or unreadable input |

### Reproducibility requirements

- Stable schema and configuration versions.
- Deterministic event IDs and sort order.
- No modification of raw evidence.
- Stage counts recorded before and after transformations.
- Parser versions included in provenance.
- Same inputs and configuration produce equivalent outputs.

## 22. Pipeline Specification

The specification is bounded and rebuildable. It describes stages, inputs, outputs, assumptions, and failure modes without becoming a narrative report.

### Specification template

| Section | Required content |
| --- | --- |
| **Purpose** | One paragraph defining the pipeline outcome |
| **Inputs** | Supported formats, locations, encodings, and assumptions |
| **Stages** | Intake, parse, normalize, clean, enrich, index, validate |
| **Outputs** | Exact files, schemas, and directory layout |
| **Failure modes** | Parser failure, invalid time, schema error, missing enrichment, duplicate |
| **Quality gates** | Numeric or binary acceptance criteria |
| **Exit codes** | Operational result meanings |
| **Rebuild requirements** | Dependencies, versions, and one command |

### Stage contract example

```text
Stage: normalize
Input: work/parsed/*.jsonl
Output: work/normalized/events.jsonl
Rejects: quarantine/normalize-errors.jsonl
Required fields: event_id, timestamp_utc, event.kind, observer.product, provenance
Failure modes: invalid timestamp, type mismatch, missing provenance
```

## 23. Evidence Handoff Package

The handoff package must let a downstream analyst use the evidence without re-parsing it.

### Required artifacts

| Artifact | Purpose |
| --- | --- |
| **README.md** | One-command usage and package map |
| **pipeline-spec.md** | Bounded rebuild specification |
| **source-inventory.json** | Sources, hashes, formats, parsers, and status |
| **schema.json** | Unified event schema |
| **events.jsonl** | Normalized and enriched events |
| **timeline.jsonl** | Deterministically sorted events |
| **quality-report.json** | Counts, rates, gaps, and quality result |
| **quarantine.jsonl** | Rejected records and reasons |
| **manifest.json** | File list, sizes, and hashes |
| **pipeline-summary.json** | Run ID, configuration version, timing, counts, and exit result |

### Handoff success condition

```text
Every source is represented
Every output record has provenance
Every rejection has a reason
Every timestamp is normalized or flagged
Every transformation is countable
Every artifact validates
```

## 24. Professional Judgment

A pipeline must never hide uncertainty to make the quality score look better.

**Normalize automatically when** the mapping is deterministic and supported by source evidence.

**Quarantine or flag when** the timestamp, host, encoding, identity, or field meaning cannot be resolved safely.

| Decision field | What it records |
| --- | --- |
| **issue** | Data-quality problem |
| **affected_source** | File or source type |
| **risk** | Detection or investigation impact |
| **handling** | corrected, flagged, retained, or quarantined |
| **reason** | Why that action was selected |
| **reviewer** | Person or process approving the choice |

A smaller truthful dataset is safer than a larger timeline built on invented timestamps and hostnames.

## 25. Framework and Tool Map

| Item | Purpose |
| --- | --- |
| **NIST SP 800-92** | Security log management concepts and practices |
| **EVTX parser** | Convert Windows Event Log files to structured records |
| **Suricata EVE JSON** | Structured network security and protocol events |
| **Elastic Common Schema** | Reference for common security-event field naming |
| **OCSF** | Vendor-neutral cybersecurity event schema reference |
| **MITRE ATT&CK data sources** | Relate telemetry sources to detectable behavior |
| **jq** | Stream, filter, transform, and validate JSON |
| **Python csv and json** | Safe parsing and structured output |
| **date** | Timestamp conversion and UTC normalization |
| **sort** | Deterministic timeline ordering |
| **sha256sum** | Raw evidence and package integrity |

## 26. Fast Recall

- **The pipeline stages are intake, parse, normalize, clean, enrich, index, and validate.**
- **Preserve raw evidence.** Never overwrite source files.
- **Inventory every file before parsing.** Unknown sources are visible findings.
- **Parsing extracts structure. Normalization reconciles meaning.** They are different stages.
- **Required fields support identity, time, meaning, and provenance.** Optional fields must not be invented.
- **Normalize time to UTC with an explicit quality status.** Never guess silently.
- **Dirty data includes malformed time, duplicates, encoding errors, missing hosts, mixed types, and truncation.**
- **Quarantine is not data loss.** It is visible handling of unsafe records.
- **Deduplication requires a documented key.** Similar does not always mean duplicate.
- **Normalization trades fidelity for searchability.** Preserve source-specific fields and raw pointers.
- **Enrichment changes operational meaning.** Criticality, owner, environment, and zone accelerate triage.
- **Keep enrichment separate from observed source data.**
- **A timeline needs deterministic ordering and source attribution.**
- **Measure parse success, required fields, duplicates, enrichment matches, and quarantine rate.**
- **One command should rebuild the outputs from raw evidence and configuration.**
- **Every downstream detection is limited by the quality of these records.**

## 27. Resources

**Log management and parsing**
- [NIST SP 800-92: Guide to Computer Security Log Management](https://csrc.nist.gov/pubs/sp/800/92/final)
- [NIST SP 800-92 Rev. 1 Initial Public Draft](https://csrc.nist.gov/pubs/sp/800/92/r1/ipd)
- [evtx_dump project documentation](https://github.com/omerbenamram/evtx)

**Network evidence**
- [Suricata EVE JSON Output](https://docs.suricata.io/en/latest/output/eve/eve-json-output.html)
- [Suricata EVE JSON Schema](https://docs.suricata.io/en/latest/appendix/eve-schema.html)

**Unified schemas**
- [Elastic Common Schema Reference](https://www.elastic.co/docs/reference/ecs)
- [Open Cybersecurity Schema Framework](https://schema.ocsf.io/)

**Data quality and detection context**
- [Google SRE Book: Data Integrity](https://sre.google/sre-book/data-integrity/)
- [MITRE ATT&CK: Data Sources](https://attack.mitre.org/datasources/)

**Man or help**
```text
man jq
man date
man awk
man python3
man sort
```
