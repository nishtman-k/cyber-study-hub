# Cross-Platform Detection Analysis

"The best tool for the job is the one you know. The best professional for the job is the one who knows more than one." - Security operations principle

> **⚠️ AUTHORIZED USE ONLY.** This material is for education, defensive security analysis, and authorized platform evaluation. Analyze only evidence you are permitted to access. Preserve source artifacts, record query assumptions, validate translated rules before use, and do not rank vendors using unverified marketing claims or a single investigation result. See the [Legal and Terms of Use](/legal) page.

**Scope:** Tool-independent incident investigation across a CLI evidence pipeline and pre-exported SIEM artifacts: evidence validation, field reconciliation, locked finding schemas, workflow measurement, Sigma-to-Wazuh XML translation, XML validation, jq, Sigma, KQL, and Lucene comparison, canonical filter/aggregation/time decomposition, tool-agnostic investigation playbooks, bounded vendor evaluation, and reproducible package delivery.

## Table of Contents

- [Core Concepts](#core-concepts)
- [Cross-Platform Analysis Model](#cross-platform-analysis-model)
- [Evidence Export Mode](#evidence-export-mode)
- [Investigation Workflow](#investigation-workflow)
- [CLI Investigation](#cli-investigation)
- [SIEM Export Investigation](#siem-export-investigation)
- [Locked Finding Schema](#locked-finding-schema)
- [Field Reconciliation](#field-reconciliation)
- [Workflow Measurement](#workflow-measurement)
- [Canonical Query Components](#canonical-query-components)
- [jq Query Model](#jq-query-model)
- [Sigma Query Model](#sigma-query-model)
- [KQL Query Model](#kql-query-model)
- [Lucene Query Model](#lucene-query-model)
- [Four-Language Query Comparison](#four-language-query-comparison)
- [Sigma to Wazuh Mapping](#sigma-to-wazuh-mapping)
- [Wazuh XML Rule Structure](#wazuh-xml-rule-structure)
- [Aggregation and Correlation Translation](#aggregation-and-correlation-translation)
- [Wazuh XML Validation](#wazuh-xml-validation)
- [Translation Limits](#translation-limits)
- [Tool-Agnostic Investigation Playbook](#tool-agnostic-investigation-playbook)
- [Interface-Dependent and Independent Skills](#interface-dependent-and-independent-skills)
- [Vendor Evaluation Metrics](#vendor-evaluation-metrics)
- [Vendor Evaluation Brief](#vendor-evaluation-brief)
- [Tool Evaluation Package](#tool-evaluation-package)
- [Quality Gates](#quality-gates)
- [Professional Judgment](#professional-judgment)
- [Framework and Tool Map](#framework-and-tool-map)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Concepts

| Term                        | Meaning                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| **Cross-platform analysis** | Applying the same investigative reasoning through different interfaces and query systems |
| **Evidence export**         | Local artifact representing results or workflow data exported from a SIEM                |
| **Field mapping**           | Documented relationship between equivalent attributes in different schemas               |
| **Locked schema**           | Fixed finding structure used by every investigation interface                            |
| **Query translation**       | Expressing the same analytical intent in another language or rule engine                 |
| **Native rule**             | Detection written in the target platform's own syntax                                    |
| **Workflow trace**          | Counted record of searches, filters, fields, actions, and time used during analysis      |
| **Time to first answer**    | Elapsed time from investigation start to first substantiated finding                     |
| **Analytical parity**       | Equivalent evidence and conclusion produced through different interfaces                 |
| **Vendor evaluation**       | Bounded comparison based on counted operational evidence and documented criteria         |

### The core idea

```text
Same evidence
     ↓
Same investigative question
     ↓
Different interface and syntax
     ↓
Equivalent filters, pivots, and time windows
     ↓
Same locked finding schema
     ↓
Counted workflow comparison
```

The interface changes. The cognitive model does not: scope, filter, pivot, correlate, validate, conclude, and preserve evidence.

## 2. Cross-Platform Analysis Model

The purpose is not to prove one interface is universally better. It is to measure how each supports the same work.

| Layer         | Interface-independent question                             |
| ------------- | ---------------------------------------------------------- |
| **Scope**     | Which scenario, hosts, users, and time range are in scope? |
| **Filter**    | Which events satisfy the investigative predicate?          |
| **Pivot**     | Which field connects the next search?                      |
| **Aggregate** | Which values, counts, or relationships stand out?          |
| **Correlate** | Which events belong to the same activity?                  |
| **Validate**  | Does source evidence support the conclusion?               |
| **Report**    | Can the result be expressed in the locked schema?          |

### Parity rule

Both interfaces must use the same scenario definition, evidence scope, time window, and finding schema. Otherwise, differences may come from methodology rather than tooling.

## 3. Evidence Export Mode

Export mode replaces live dashboard interaction with pre-generated search results and workflow traces.

### Export artifacts

| Artifact                   | Purpose                                           |
| -------------------------- | ------------------------------------------------- |
| **search_results.json**    | Events returned by dashboard searches             |
| **workflow_trace.json**    | Filters, fields, pivots, and interaction sequence |
| **field_mapping.json**     | Platform field names mapped to normalized fields  |
| **scenario_metadata.json** | Time window, hosts, and investigation question    |
| **dashboard_summary.json** | Saved counts, visual summaries, or aggregations   |

### Export validation

```bash
find wazuh_exports -type f -name '*.json' -print0 | xargs -0 -n1 jq empty
find wazuh_exports -type f -print0 | sort -z | xargs -0 sha256sum
jq -r '.scenario_id // empty' wazuh_exports/*/*.json | sort | uniq -c
```

### Access-method principle

Export mode can reproduce evidence review and workflow comparison, but it cannot measure live rendering, interactive latency, permission behavior, or unscripted dashboard exploration unless those properties are explicitly captured.

## 4. Investigation Workflow

Use the same sequence for CLI and SIEM-export analysis.

```text
Read scenario question
     ↓
Set UTC time window
     ↓
Identify primary source and fields
     ↓
Filter candidate events
     ↓
Pivot on host, user, process, IP, domain, or rule
     ↓
Aggregate and correlate
     ↓
Validate against source evidence
     ↓
Write locked finding
     ↓
Record workflow metrics
```

### Investigation outputs

| Output               | Requirement                                  |
| -------------------- | -------------------------------------------- |
| **Finding**          | One record in locked schema                  |
| **Query log**        | Exact commands or exported query expressions |
| **Evidence list**    | Stable event IDs and source pointers         |
| **Workflow metrics** | Time, events reviewed, fields touched, steps |
| **Confidence**       | Evidence-based rating with explanation       |

## 5. CLI Investigation

The CLI path uses normalized JSON, jq, scripts, and Sigma tooling.

### CLI workflow

```bash
# Validate input
jq -c . evidence/events.jsonl >/dev/null

# Scope by time and host
jq -c 'select(
  .timestamp_utc >= "2026-10-01T00:00:00Z" and
  .timestamp_utc < "2026-10-02T00:00:00Z" and
  .host.name == "workstation-01"
)' evidence/events.jsonl > work/scoped.jsonl

# Count event categories
jq -r '.event.category[]? // "unknown"' work/scoped.jsonl | sort | uniq -c | sort -nr

# Pivot on source IP
jq -c 'select(.source.ip == "192.0.2.50")' work/scoped.jsonl
```

### CLI strengths

- Exact, reproducible commands.
- Easy version control.
- Transparent transformations.
- Efficient automation and bulk processing.
- Direct access to raw normalized fields.

### CLI constraints

- Requires schema and syntax literacy.
- Field discovery may be slower without visual assistance.
- Complex aggregations need scripts.
- Collaboration requires disciplined command and output logging.

## 6. SIEM Export Investigation

The export path reconstructs dashboard investigation from staged local artifacts.

### Export workflow

```text
Open scenario metadata
     ↓
Read saved search query
     ↓
Review result count and selected fields
     ↓
Follow documented pivot
     ↓
Inspect correlated result export
     ↓
Verify event IDs and timestamps
     ↓
Write finding in locked schema
```

### Export checks

```bash
jq '.query, .time_range, .result_count' wazuh_exports/scenario-01/search_results.json
jq -r '.events[] | [.timestamp,.agent.name,.rule.id,.rule.description] | @tsv' wazuh_exports/scenario-01/search_results.json
jq '.steps' wazuh_exports/scenario-01/workflow_trace.json
```

### Export constraint

Do not infer clicks, latency, or dashboard capability that the workflow trace does not record. Mark unavailable measurements as not observed.

## 7. Locked Finding Schema

Every finding must read the same regardless of interface.

### Required fields

| Field                | Purpose                        |
| -------------------- | ------------------------------ |
| **finding_id**       | Stable identifier              |
| **scenario_id**      | Scenario being investigated    |
| **interface**        | cli or wazuh_export            |
| **title**            | Concise finding name           |
| **summary**          | Evidence-based conclusion      |
| **first_seen_utc**   | Activity start                 |
| **last_seen_utc**    | Activity end                   |
| **hosts**            | Affected assets                |
| **users**            | Relevant identities            |
| **source_ips**       | Relevant origins               |
| **technique_ids**    | ATT&CK mappings                |
| **severity**         | Triage level                   |
| **confidence**       | Confidence rating              |
| **evidence_ids**     | Supporting events              |
| **queries**          | Query or command references    |
| **workflow_metrics** | Counted interface measurements |

### Finding example

```json
{
  "finding_id": "FND-S01-CLI",
  "scenario_id": "S01",
  "interface": "cli",
  "title": "Failure burst followed by successful authentication",
  "summary": "Eight failures from one source preceded a successful login within 90 seconds.",
  "first_seen_utc": "2026-10-01T02:14:00Z",
  "last_seen_utc": "2026-10-01T02:15:30Z",
  "hosts": ["workstation-01"],
  "users": ["admin-a"],
  "source_ips": ["192.0.2.50"],
  "technique_ids": ["T1110", "T1078"],
  "severity": "high",
  "confidence": "high",
  "evidence_ids": ["evt-1001", "evt-1002", "evt-1010"],
  "queries": ["queries/scenario-01-cli.jq"],
  "workflow_metrics": {
    "time_to_first_answer_seconds": 145,
    "events_reviewed": 34,
    "fields_touched": 8,
    "steps": 6
  }
}
```

## 8. Field Reconciliation

Equivalent evidence may use different field names.

### Mapping examples

| Normalized concept | CLI schema           | Wazuh export example                              |
| ------------------ | -------------------- | ------------------------------------------------- |
| Event time         | timestamp_utc        | timestamp                                         |
| Host name          | host.name            | agent.name                                        |
| Event code         | event.code           | data.win.system.eventID                           |
| Rule ID            | rule.id              | rule.id                                           |
| Rule description   | rule.name            | rule.description                                  |
| Source IP          | source.ip            | data.srcip or data.src_ip                         |
| Destination IP     | destination.ip       | data.dstip or data.dest_ip                        |
| User               | user.name            | data.dstuser or data.win.eventdata.targetUserName |
| Process image      | process.executable   | data.win.eventdata.image                          |
| Command line       | process.command_line | data.win.eventdata.commandLine                    |

### Mapping document

```json
{
  "timestamp_utc": ["timestamp"],
  "host.name": ["agent.name"],
  "source.ip": ["data.srcip", "data.src_ip"],
  "destination.ip": ["data.dstip", "data.dest_ip"],
  "process.command_line": ["data.win.eventdata.commandLine"]
}
```

### Reconciliation rule

Map fields by meaning and source semantics, not spelling alone. Record one-to-many mappings and unresolved fields explicitly.

## 9. Workflow Measurement

Comparison becomes defensible when operational work is counted.

### Core metrics

| Metric                       | Definition                                              |
| ---------------------------- | ------------------------------------------------------- |
| **Time to first answer**     | Seconds from start to first supported conclusion        |
| **Time to complete finding** | Seconds from start to final locked finding              |
| **Events reviewed**          | Distinct records manually or programmatically inspected |
| **Fields touched**           | Distinct fields used in filters, pivots, or validation  |
| **Queries issued**           | Number of search or command executions                  |
| **Pivots performed**         | Number of entity-to-entity transitions                  |
| **Corrections**              | Query or syntax revisions required                      |
| **Evidence traceability**    | Percentage of claims linked to event IDs                |
| **Reproducibility**          | Whether another analyst reproduced the result           |

### Measurement record

```json
{
  "scenario_id": "S01",
  "interface": "wazuh_export",
  "started_at_utc": "2026-10-08T10:00:00Z",
  "first_answer_at_utc": "2026-10-08T10:03:05Z",
  "completed_at_utc": "2026-10-08T10:08:20Z",
  "events_reviewed": 41,
  "fields_touched": 9,
  "queries_issued": 5,
  "pivots": 3,
  "corrections": 1,
  "evidence_traceability_rate": 1.0
}
```

## 10. Canonical Query Components

Any investigation query can be decomposed into filter, aggregation, and time window.

| Component       | Question                                                    |
| --------------- | ----------------------------------------------------------- |
| **Filter**      | Which records qualify?                                      |
| **Aggregation** | How are qualifying records grouped, counted, or summarized? |
| **Time window** | During which interval, and relative to what grouping?       |

### Canonical question

```text
Filter: failed SSH authentication
Aggregation: count by source IP and destination host
Time window: five minutes
Condition: count >= 5
```

### Translation principle

Translate intent first, syntax second. If a language cannot express one component, preprocess data or document the limitation.

## 11. jq Query Model

jq treats a program as a filter from JSON input to JSON output.

### Filter example

```bash
jq -c 'select(
  .event.category[]? == "authentication" and
  .event.outcome == "failure" and
  .network.application == "ssh"
)' events.jsonl
```

### Aggregation example

```bash
jq -s '
  map(select(.event.outcome == "failure"))
  | group_by([.source.ip, .host.name])
  | map({
      source_ip: .[0].source.ip,
      host: .[0].host.name,
      count: length
    })
' events.jsonl
```

### jq characteristics

| Strength                     | Limitation                                      |
| ---------------------------- | ----------------------------------------------- |
| Powerful JSON transformation | No built-in persistent index                    |
| Transparent pipelines        | Large slurped datasets can consume memory       |
| Easy scripting               | Time-bucket correlation requires explicit logic |
| Produces structured output   | Schema mistakes are easy without validation     |

## 12. Sigma Query Model

Sigma expresses portable detection intent through logsource, selection, condition, and optional correlation.

```yaml
title: SSH Authentication Failure
id: 11111111-2222-4333-8444-555555555555
status: test
logsource:
  product: linux
  service: auth
detection:
  selection:
    event.category: "authentication"
    event.outcome: "failure"
    network.application: "ssh"
  condition: selection
level: low
```

### Sigma characteristics

| Strength                          | Limitation                                  |
| --------------------------------- | ------------------------------------------- |
| Vendor-neutral rule source        | Requires field mappings and backend support |
| Version-controllable YAML         | Not an interactive investigation language   |
| Supports metadata and ATT&CK tags | Conversion may not preserve every semantic  |
| Reusable across targets           | Aggregation and correlation support varies  |

## 13. KQL Query Model

KQL here means Kibana Query Language (Elastic), not Kusto Query Language (Microsoft Sentinel). The distinction matters: Kusto aggregates and transforms, Kibana KQL does not. This sheet means Kibana KQL throughout. It is a text-based filtering language: it filters documents but does not itself aggregate, transform, or sort them.

```text
network.application: ssh and event.outcome: failure and event.category: authentication
```

### KQL patterns

```text
host.name: "workstation-01"
source.ip: 192.0.2.50
rule.id: (100100 or 100110)
timestamp >= "2026-10-01T00:00:00Z" and timestamp < "2026-10-02T00:00:00Z"
process.command_line: *encodedcommand*
```

### KQL characteristics

| Strength                          | Limitation                                     |
| --------------------------------- | ---------------------------------------------- |
| Clear field-based filtering       | Aggregations happen outside the KQL expression |
| Existence and range checks        | Behavior depends on field mappings             |
| Boolean expressions and wildcards | Not a rule metadata format                     |
| Suited to interactive search      | Export mode may limit iterative exploration    |

## 14. Lucene Query Model

Lucene query syntax supports fielded terms, Boolean operators, ranges, wildcards, and other search constructs.

```text
network.application:ssh AND event.outcome:failure AND event.category:authentication
```

### Lucene patterns

```text
host.name:"workstation-01"
source.ip:192.0.2.50
rule.id:(100100 OR 100110)
timestamp:[2026-10-01T00:00:00Z TO 2026-10-02T00:00:00Z}
process.command_line:*encodedcommand*
```

### Lucene characteristics

| Strength                                      | Limitation                                   |
| --------------------------------------------- | -------------------------------------------- |
| Mature fielded search syntax                  | Boolean operators and escaping require care  |
| Ranges and wildcards                          | Mapping and analyzer behavior affect results |
| Regex or fuzzy features in supported contexts | Less readable for some analysts              |
| Useful for legacy dashboard searches          | Not a full aggregation language by itself    |

## 15. Four-Language Query Comparison

### Investigative question

Find failed SSH authentications from one source to one host within the selected time range.

### jq

```bash
jq -c 'select(
  .event.category[]? == "authentication" and
  .event.outcome == "failure" and
  .network.application == "ssh" and
  .source.ip == "192.0.2.50" and
  .host.name == "server-01"
)' events.jsonl
```

### Sigma

```yaml
detection:
  selection:
    event.category: "authentication"
    event.outcome: "failure"
    network.application: "ssh"
    source.ip: "192.0.2.50"
    host.name: "server-01"
  condition: selection
```

### KQL

```text
event.category: authentication and event.outcome: failure and network.application: ssh and source.ip: 192.0.2.50 and host.name: "server-01"
```

### Lucene

```text
event.category:authentication AND event.outcome:failure AND network.application:ssh AND source.ip:192.0.2.50 AND host.name:"server-01"
```

### Comparison rule

The four expressions are equivalent only if field mappings, value types, analyzers, case behavior, and time scope are equivalent.

## 16. Sigma to Wazuh Mapping

Sigma and Wazuh XML represent related concepts differently.

| Sigma concept       | Wazuh XML adaptation                                          |
| ------------------- | ------------------------------------------------------------- |
| **title**           | description or catalog metadata                               |
| **id**              | Numeric custom rule ID plus external mapping                  |
| **logsource**       | decoded_as, category, program_name, if_sid, or groups         |
| **selection field** | field element or native option such as srcip                  |
| **contains**        | Regex or field expression                                     |
| **condition and**   | Multiple conditions in one rule or chained parent rules       |
| **condition or**    | Regex alternatives or sibling rules grouped under correlation |
| **not filter**      | negate attribute or separate logic where supported            |
| **level**           | Wazuh numeric severity level                                  |
| **tags**            | group, mitre, or external catalog metadata                    |
| **falsepositives**  | Documentation, not direct execution logic                     |
| **aggregation**     | frequency, timeframe, if_matched_sid, and same-field options  |

### Translation rule

Do not translate text mechanically. Translate detection semantics and document every adaptation.

## 17. Wazuh XML Rule Structure

Wazuh custom rules are XML elements grouped inside a rule group.

```xml
<group name="local,authentication,">
  <rule id="100100" level="5">
    <decoded_as>json</decoded_as>
    <field name="event.category">^authentication$</field>
    <field name="event.outcome">^failure$</field>
    <field name="network.application">^ssh$</field>
    <description>SSH authentication failure</description>
    <group>authentication_failed,attack_t1110,</group>
  </rule>
</group>
```

### Rule elements

| Element                     | Purpose                                      |
| --------------------------- | -------------------------------------------- |
| **rule id**                 | Numeric rule identifier                      |
| **level**                   | Wazuh severity level                         |
| **decoded_as**              | Required decoder identity                    |
| **if_sid**                  | Match event already matched by parent rule   |
| **if_matched_sid**          | Correlate prior matches of a rule            |
| **field**                   | Match decoded field with expression          |
| **match or regex**          | Match raw or decoded log text                |
| **description**             | Human-readable alert meaning                 |
| **group**                   | Classification, filtering, or mapping labels |
| **frequency and timeframe** | Threshold correlation                        |

## 18. Aggregation and Correlation Translation

A threshold rule typically uses a base rule plus a correlation rule.

```xml
<group name="local,authentication,">
  <rule id="100100" level="5">
    <decoded_as>json</decoded_as>
    <field name="event.outcome">^failure$</field>
    <field name="network.application">^ssh$</field>
    <description>SSH authentication failure</description>
    <group>authentication_failed,</group>
  </rule>

  <rule id="100110" level="12" frequency="5" timeframe="300">
    <if_matched_sid>100100</if_matched_sid>
    <same_source_ip />
    <description>Five SSH authentication failures from one source in five minutes</description>
    <group>authentication_bruteforce,attack_t1110,</group>
  </rule>
</group>
```

### Translation risks

- On some Wazuh versions `frequency` counts matches _after_ the first, so `frequency="5"` can require six events before firing. Verify the count against your version rather than trusting the number alone.
- The required field may not map to Wazuh's canonical source IP.
- Grouping options differ by decoded field.
- Ordered sequences may need more than frequency and timeframe.
- Cross-source fields may use incompatible names.
- Backend correlation may not preserve Sigma semantics.

## 19. Wazuh XML Validation

Validate XML syntax before catalog acceptance.

```bash
xmllint --noout rules/local_rules.xml
xmllint --format rules/local_rules.xml > build/local_rules.formatted.xml
```

### Validation layers

| Layer                     | Question                                         |
| ------------------------- | ------------------------------------------------ |
| **XML well-formedness**   | Does xmllint accept the document?                |
| **Rule ID control**       | Are custom IDs unique and in the approved range? |
| **Decoder compatibility** | Do target fields exist after decoding?           |
| **Semantic test**         | Does the rule fire on known-positive sample?     |
| **Negative test**         | Does benign sample stay quiet?                   |
| **Correlation test**      | Does grouping and timeframe behave as intended?  |

### Validation principle

xmllint proves XML well-formedness. It does not prove Wazuh semantics, decoder compatibility, or detection quality.

## 20. Translation Limits

Some Sigma features map cleanly; others need adaptation.

| Sigma feature                    | Translation quality                        |
| -------------------------------- | ------------------------------------------ |
| Exact single-field match         | Usually clean                              |
| Simple AND across decoded fields | Usually clean                              |
| Simple OR values                 | Often clean with regex or sibling rules    |
| Contains, startswith, endswith   | Requires careful regex adaptation          |
| Negative filters                 | Depends on negate and rule structure       |
| Field existence                  | Decoder and field behavior dependent       |
| Count in timeframe               | Adaptable with frequency and timeframe     |
| Group by arbitrary field         | May require decoder or same-field support  |
| Ordered multi-rule correlation   | May require preprocessing or custom logic  |
| Backend-independent taxonomy     | Must be carried through metadata or groups |

### Automatic-conversion caution

Automatic conversion cannot resolve missing decoders, semantic field mismatches, analyzer behavior, or unsupported correlation. Manual validation remains mandatory.

## 21. Tool-Agnostic Investigation Playbook

The playbook describes reasoning, not interface clicks.

### Playbook stages

| Stage         | Analyst action                                       |
| ------------- | ---------------------------------------------------- |
| **Define**    | State the question and expected output               |
| **Scope**     | Set UTC time range, hosts, users, and sources        |
| **Validate**  | Confirm evidence completeness and schema             |
| **Filter**    | Select candidate events                              |
| **Pivot**     | Follow entities and relationships                    |
| **Aggregate** | Count and group behavior                             |
| **Correlate** | Join endpoint, identity, and network evidence        |
| **Challenge** | Search for benign explanation and contradictory data |
| **Conclude**  | State supported finding and confidence               |
| **Package**   | Save finding, queries, evidence IDs, and metrics     |

### Interface substitution

```text
CLI command or script
SIEM query bar or saved search
API request
Exported search artifact
```

All can implement the same playbook when the evidence and field semantics are understood.

## 22. Interface-Dependent and Independent Skills

| Interface-independent skills       | Interface-dependent skills    |
| ---------------------------------- | ----------------------------- |
| Framing the investigative question | Remembering menu location     |
| Choosing time windows              | Dashboard navigation          |
| Understanding field semantics      | Query language syntax         |
| Pivoting on entities               | Saved-search workflow         |
| Correlating sources                | Visualization configuration   |
| Evaluating contradictory evidence  | Export controls               |
| Writing supported conclusions      | Platform-specific rule syntax |
| Preserving evidence traceability   | Role and permission setup     |

### Professional principle

Tools accelerate reasoning. They do not replace field literacy, evidence validation, correlation, or judgment.

## 23. Vendor Evaluation Metrics

Evaluate operational outcomes, not feature lists.

### Metric categories

| Category                  | Metrics                                                       |
| ------------------------- | ------------------------------------------------------------- |
| **Investigation speed**   | Time to first answer, time to final finding                   |
| **Analyst effort**        | Steps, queries, fields touched, corrections                   |
| **Evidence quality**      | Traceability, field completeness, export fidelity             |
| **Detection portability** | Sigma conversion, native-rule effort, semantic loss           |
| **Reproducibility**       | Peer reproduction rate and variance                           |
| **Automation**            | Scriptability, API or export support, batch processing        |
| **Governance**            | Audit trail, versioning, role control, retention evidence     |
| **Operational fit**       | Skills, maintenance, infrastructure, availability constraints |

### Score record

```json
{
  "criterion": "time_to_first_answer",
  "weight": 0.15,
  "cli_value": 145,
  "wazuh_export_value": 185,
  "unit": "seconds",
  "evidence_pointer": "metrics/scenario-01.json",
  "limitations": [
    "Wazuh measurement used export workflow rather than live dashboard"
  ]
}
```

### Evaluation rule

Use the same scenarios and scoring definitions for every interface. State limitations beside scores instead of hiding them.

## 24. Vendor Evaluation Brief

The brief is bounded, evidence-based, and decision-oriented.

### Brief structure

| Section               | Content                                                    |
| --------------------- | ---------------------------------------------------------- |
| **Decision question** | What decision the evaluation supports                      |
| **Scope**             | Interfaces, scenarios, dataset, and export-mode limitation |
| **Method**            | Locked schema and counted metrics                          |
| **Results**           | Side-by-side measurements                                  |
| **Rule portability**  | Sigma and native-rule translation findings                 |
| **Operational risks** | Skills, lock-in, maintenance, and evidence access          |
| **Recommendation**    | Preferred operating model and conditions                   |
| **Limitations**       | What was not measured                                      |

### Recommendation principle

A recommendation should separate analytical capability, operational usability, and deployment constraints. The fastest interface in three scenarios may not be the best platform overall.

## 25. Tool Evaluation Package

```text
tool_evaluation/
├── README.md
├── findings/
│   ├── scenario-01-cli.json
│   ├── scenario-01-wazuh.json
│   ├── scenario-02-cli.json
│   ├── scenario-02-wazuh.json
│   ├── scenario-03-cli.json
│   └── scenario-03-wazuh.json
├── queries/
│   ├── jq/
│   ├── sigma/
│   ├── kql/
│   └── lucene/
├── rules/
│   ├── sigma/
│   └── wazuh/
├── mappings/
│   └── field-mapping.json
├── metrics/
│   └── workflow-metrics.json
├── playbook/
│   └── investigation-playbook.md
├── brief/
│   └── vendor-evaluation.md
├── manifest.json
└── SHA256SUMS
```

### Required deliverables

| Deliverable                 | Count                          |
| --------------------------- | ------------------------------ |
| Structured findings         | Six                            |
| Sigma-to-Wazuh translations | Three                          |
| Four-language comparisons   | At least one per core question |
| Tool-agnostic playbook      | One                            |
| Vendor evaluation brief     | One                            |
| Manifest and hashes         | One complete set               |

## 26. Quality Gates

| Gate                     | Pass condition                                           |
| ------------------------ | -------------------------------------------------------- |
| **Schema parity**        | All six findings validate against one schema             |
| **Scenario parity**      | Both interfaces use identical scope and evidence         |
| **Traceability**         | Every conclusion links to evidence IDs                   |
| **Field mapping**        | Every translated query field is documented               |
| **XML validity**         | All Wazuh XML files pass xmllint                         |
| **Semantic tests**       | Known-positive and negative samples behave correctly     |
| **Metrics completeness** | Required workflow counts exist or are marked unavailable |
| **Query comparison**     | Filter, aggregation, and time are explicit               |
| **Brief limitations**    | Export-mode limits are stated                            |
| **Integrity**            | Manifest hashes verify                                   |

### Final validation commands

```bash
find findings mappings metrics -name '*.json' -print0 | xargs -0 -n1 jq empty
find rules/wazuh -name '*.xml' -print0 | xargs -0 -n1 xmllint --noout
sha256sum -c SHA256SUMS
```

## 27. Professional Judgment

A fair evaluation does not exaggerate either the CLI or the SIEM.

**Credit an interface when** counted evidence shows it improved speed, clarity, reproducibility, or evidence access.

**Record a limitation when** export mode, field mappings, missing features, or workflow traces prevent direct measurement.

| Decision field            | Purpose                           |
| ------------------------- | --------------------------------- |
| **criterion**             | What is being judged              |
| **evidence**              | Counted measurement or artifact   |
| **interpretation**        | What the evidence supports        |
| **limitation**            | What it cannot prove              |
| **weight**                | Importance to the organization    |
| **recommendation_impact** | How it affects the final decision |

Do not convert tool familiarity into a vendor score. Familiarity is a measurable training factor, not a permanent product property.

## 28. Framework and Tool Map

| Item               | Purpose                                                           |
| ------------------ | ----------------------------------------------------------------- |
| **jq**             | CLI filtering, transformation, aggregation, and structured output |
| **Sigma**          | Vendor-neutral detection intent                                   |
| **sigma-cli**      | Sigma rule validation and conversion                              |
| **Wazuh ruleset**  | Native XML detection and correlation rules                        |
| **xmllint**        | XML well-formedness validation                                    |
| **KQL**            | Field-based dashboard filtering                                   |
| **Lucene syntax**  | Legacy fielded search syntax                                      |
| **Chainsaw**       | Rapid Windows forensic artifact search with Sigma support         |
| **yq**             | YAML inspection and transformation                                |
| **NIST SP 800-92** | Vendor-independent log-management principles                      |
| **Security+ 4.4**  | Security monitoring and alert handling                            |
| **Security+ 4.7**  | Automation and orchestration concepts                             |

## 29. Fast Recall

- **The interface changes; the investigation model does not.**
- **Use the same evidence scope, time window, and locked schema for fair comparison.**
- **Export mode supports evidence analysis but does not prove live dashboard performance.**
- **Every finding needs stable event IDs and query references.**
- **Map fields by meaning and source semantics, not spelling.**
- **Count time to answer, events reviewed, fields touched, queries, pivots, and corrections.**
- **Every query has filter, aggregation, and time components.**
- **jq transforms JSON streams. KQL filters documents. Lucene provides fielded search syntax. Sigma expresses detection intent.**
- **KQL does not itself aggregate, transform, or sort.**
- **Sigma portability still requires field mappings and backend validation.**
- **Wazuh XML uses decoded fields, parent rules, groups, frequency, and timeframe.**
- **xmllint proves well-formed XML, not detection correctness.**
- **Translate semantics, not text.**
- **Preprocess correlation primitives when native rule semantics are insufficient.**
- **Separate interface-independent analytical skills from interface-specific operation.**
- **Vendor evaluation must use counted evidence and explicit limitations.**
- **A recommendation should consider analysis, operations, governance, and deployment constraints.**

## 30. Resources

**CLI toolkit**

- [jq Manual](https://jqlang.org/manual/)
- [sigma-cli](https://github.com/SigmaHQ/sigma-cli)
- [Chainsaw](https://github.com/WithSecureLabs/chainsaw)
- [yq Documentation](https://mikefarah.gitbook.io/yq/)

**Wazuh rules and investigation**

- [Wazuh Rules Syntax](https://documentation.wazuh.com/current/user-manual/ruleset/ruleset-xml-syntax/rules.html)
- [Wazuh Ruleset XML Syntax](https://documentation.wazuh.com/current/user-manual/ruleset/ruleset-xml-syntax/index.html)
- [Wazuh Dashboard Documentation](https://documentation.wazuh.com/current/user-manual/wazuh-dashboard/index.html)

**Query languages and detection format**

- [Kibana Query Language](https://www.elastic.co/docs/explore-analyze/query-filter/languages/kql)
- [Apache Lucene Query Parser Syntax](https://lucene.apache.org/core/9_12_3/queryparser/org/apache/lucene/queryparser/classic/package-summary.html)
- [Sigma Detection Format](https://sigmahq.io/docs/)

**Vendor-independent log management**

- [NIST SP 800-92: Guide to Computer Security Log Management](https://csrc.nist.gov/pubs/sp/800/92/final)

**Man or help**

```text
man jq
man docker
man curl
man yq
man date
xmllint --help
```
