# The Alert Factory

**⚠️ AUTHORIZED USE ONLY.** Education, authorized defensive analysis, and detection engineering only. Detection matches are investigative leads, not proof of malicious activity.

**Scope:** Sigma detection engineering — rule structure, log sources, modifiers, boolean conditions, aggregation, correlation, MITRE ATT&CK mapping, sigma-cli, testing, metrics, tuning, and alert queue generation.

---

## Table of Contents
- [Core Concepts](#core-concepts)
- [Detection Types](#detection-types)
- [Detection Outcomes](#detection-outcomes)
- [Precise Predicates](#precise-predicates)
- [Sigma Rule Structure](#sigma-rule-structure)
- [Log Sources and Field Taxonomy](#log-sources-and-field-taxonomy)
- [Selections and Modifiers](#selections-and-modifiers)
- [Conditions and Boolean Logic](#conditions-and-boolean-logic)
- [Aggregation and Timeframes](#aggregation-and-timeframes)
- [Rule Examples](#rule-examples)
- [MITRE ATT&CK Mapping](#mitre-attck-mapping)
- [sigma-cli Validation](#sigma-cli-validation)
- [Ground Truth and Testing](#ground-truth-and-testing)
- [Metrics: Precision, Recall, FPR](#metrics-precision-recall-fpr)
- [Detection Tuning](#detection-tuning)
- [Cross-Source Correlation](#cross-source-correlation)
- [Correlation Primitives](#correlation-primitives)
- [Risk-Driven Prioritization](#risk-driven-prioritization)
- [ATT&CK Coverage and Gaps](#attck-coverage-and-gaps)
- [Quality Gates](#quality-gates)
- [Alert Queue Generation](#alert-queue-generation)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

---

## Core Concepts

| Term | Meaning |
| --- | --- |
| **Detection rule** | Reproducible predicate that identifies security-relevant activity in telemetry |
| **True positive** | Rule fires on activity correctly labeled as targeted behavior |
| **False positive** | Rule fires on benign activity |
| **False negative** | Targeted activity occurs but the rule does not fire |
| **True negative** | Benign activity correctly produces no alert |
| **Detection catalog** | Versioned collection of rules, tests, metrics, mappings, and ownership data |

```text
Threat behavior → Telemetry fields → Precise predicate → Known-positive/negative tests → Quality measurement → Tuning → Risk-ranked alert
```

A rule is not production-ready because it parses. It is production-ready when its behavior is measurable, explainable, repeatable, and acceptable for the analysts who triage its output.

### Lab: confirm your environment

```bash
# Install sigma-cli
pip3 install sigma-cli

# Install a backend (Splunk example)
sigma plugin install splunk

# List installed backends
sigma list

# Confirm jq is available
jq --version
```

Expected: `sigma-cli` version, backend listed, `jq` version printed.

---

## Detection Types

| Type | Question | Strength | Weakness |
| --- | --- | --- | --- |
| **Signature** | Did a known value appear? | Precise and simple | Fragile when indicators change |
| **Anomaly** | Did activity differ from normal? | Finds unknown deviations | Benign novelty generates noise |
| **Behavioral** | Did an adversary-like action occur? | Survives indicator changes | Requires context and tuning |
| **Correlation** | Did related signals form a suspicious sequence? | Higher confidence | Complex and backend-dependent |

```text
Known artifact available?            → signature
Reliable clean baseline available?  → anomaly
Stable adversary behavior?          → behavioral
Multiple weak signals together?     → correlation
```

---

## Detection Outcomes

| Actual activity | Rule fires | Rule does not fire |
| --- | --- | --- |
| Target behavior present | True positive | False negative |
| Target behavior absent | False positive | True negative |

| Outcome | SOC consequence |
| --- | --- |
| TP | Useful alert |
| FP | Wasted analyst time, alert fatigue |
| FN | Missed activity, false confidence |
| TN | Benign activity stays quiet |

Do not report only match count. A detection needs labeled positives and negatives so both successful detection and unnecessary alerting can be measured.

---

## Precise Predicates

A detection must reduce to a predicate against defined fields before it can be written as a rule.

```text
When [observable behavior]
appears in [specific telemetry]
with [field conditions]
within [scope or timeframe],
create [alert meaning].
```

| Weak idea | Precise predicate |
| --- | --- |
| Suspicious PowerShell | process.name = powershell.exe AND command_line contains -encodedcommand |
| Too many SSH failures | 5 failed SSH auth events from same src_ip to same host within 5 minutes |
| Unusual login | Successful privileged login outside host-role baseline hours |

Use free-text matching only when no reliable structured field exists. Messages may be localized and wording changes between vendor versions.

---

## Sigma Rule Structure

Sigma is a vendor-neutral YAML format. Backends translate it into target query languages.

### Primary fields

| Field | Purpose |
| --- | --- |
| **title** | Human-readable rule name |
| **id** | Stable UUID |
| **status** | experimental, test, stable, deprecated |
| **description** | Behavior and intent |
| **logsource** | Required telemetry category, product, service |
| **detection** | Selections and condition |
| **falsepositives** | Known legitimate triggers |
| **level** | informational, low, medium, high, critical |
| **tags** | ATT&CK and other taxonomy mappings |

### Minimal rule

```yaml
title: Encoded PowerShell Command
id: 11111111-2222-4333-8444-555555555555
status: experimental
description: Detects PowerShell execution with an encoded command argument
author: Detection Team
date: 2026-09-19
logsource:
    category: process_creation
    product: windows
detection:
    selection_image:
        Image|endswith: '\powershell.exe'
    selection_flag:
        CommandLine|contains:
            - ' -enc '
            - ' -encodedcommand '
    condition: selection_image and selection_flag
falsepositives:
    - Approved administrative automation using encoded commands
level: high
tags:
    - attack.execution
    - attack.t1059.001
```

### Lab: validate a rule

```bash
# Save rule above as rules/encoded_powershell.yml
mkdir -p rules

# Validate
sigma check rules/encoded_powershell.yml

# Convert to Splunk SPL
sigma convert -t splunk -p sysmon rules/encoded_powershell.yml
```

Expected: no schema errors, a valid SPL query printed.

---

## Log Sources and Field Taxonomy

The log source scopes where the rule runs and what fields it assumes.

| Category | Typical telemetry |
| --- | --- |
| **process_creation** | Sysmon Event 1, Windows 4688, EDR process events |
| **network_connection** | Sysmon Event 3, flow records |
| **registry_event** | Sysmon registry events |
| **file_event** | Sysmon file creation, auditd PATH |
| **authentication** | Windows Security, Linux auth, VPN, IdP |
| **dns_query** | Sysmon DNS, resolver logs |
| **firewall** | Allowed and denied network events |
| **webserver** | HTTP access or error logs |

```text
Sigma field → normalized dataset field → source-native field
```

The runner must document this mapping. A rule expecting `CommandLine` cannot run against a dataset that stores it as `process.command_line` without a processing transformation.

---

## Selections and Modifiers

Selections describe field-value predicates. Modifiers change how a value is compared.

| Modifier | Meaning |
| --- | --- |
| **contains** | Field contains value |
| **startswith** | Field begins with value |
| **endswith** | Field ends with value |
| **all** | Every listed value must match |
| **re** | Regular-expression match |
| **cidr** | IP belongs to network range |
| **exists** | Field presence or absence |
| **cased** | Case-sensitive comparison |
| **lt, lte, gt, gte** | Numeric comparison |

```yaml
detection:
    selection_name:
        process.name|endswith: '\cmd.exe'
    selection_args:
        process.command_line|contains|all:
            - '/c'
            - 'whoami'
    condition: selection_name and selection_args
```

Use the narrowest reliable comparison. Prefer exact values over broad contains logic.

---

## Conditions and Boolean Logic

The condition combines selections and filters.

| Pattern | Meaning |
| --- | --- |
| `selection` | Match one selection |
| `selection_a and selection_b` | Both must match |
| `selection_a or selection_b` | Either may match |
| `selection and not filter` | Match except known benign |
| `1 of selection_*` | Any named selection matches |
| `all of selection_*` | Every named selection matches |
| `1 of them` | Any detection identifier matches |

```yaml
detection:
    selection:
        process.name: 'powershell.exe'
        process.command_line|contains: 'DownloadString'
    filter_approved:
        user.name: 'svc-automation'
        process.command_line|contains: 'approved-update.ps1'
    condition: selection and not filter_approved
```

Every exclusion creates a possible false negative. Scope filters narrowly and attach evidence showing why the exclusion is safe.

---

## Aggregation and Timeframes

A single event may not be suspicious. Counts and timeframes detect repeated behavior.

| Component | Purpose |
| --- | --- |
| **Selection** | Events eligible for counting |
| **Grouping field** | src_ip, user, host, process, or destination |
| **Timeframe** | Maximum interval for grouped events |
| **Threshold** | Count or statistical requirement |

```text
5 failed SSH logins
from the same source IP
to the same destination host
within 5 minutes
```

Aggregation support differs between backends. Validate the generated query or preprocess events into correlation primitives when backend support is incomplete.

---

## Rule Examples

### SSH authentication failure

```yaml
title: Linux SSH Authentication Failure
id: 22222222-3333-4444-8555-666666666666
name: ssh_auth_failure
status: test
description: Identifies failed SSH authentication events
logsource:
    product: linux
    service: auth
detection:
    selection:
        event.category: 'authentication'
        event.outcome: 'failure'
        network.application: 'ssh'
    condition: selection
falsepositives:
    - User typing error
level: low
tags:
    - attack.credential_access
    - attack.t1110
```

### Scheduled task creation

```yaml
title: Windows Scheduled Task Creation
id: 44444444-5555-4666-8777-888888888888
status: experimental
description: Detects command-line creation of a scheduled task
logsource:
    category: process_creation
    product: windows
detection:
    selection_image:
        process.name|endswith: '\schtasks.exe'
    selection_create:
        process.command_line|contains: '/create'
    condition: selection_image and selection_create
falsepositives:
    - Software deployment and administrative scheduling
level: medium
tags:
    - attack.persistence
    - attack.t1053.005
```

### Lab: run a rule against flat JSON events

```bash
# Create a minimal test event
cat > tests/events.jsonl << 'EOF'
{"event_id": "evt-001", "process.name": "powershell.exe", "CommandLine": "powershell.exe -encodedcommand dGVzdA=="}
{"event_id": "evt-002", "process.name": "notepad.exe", "CommandLine": "notepad.exe readme.txt"}
EOF

# Run via jq as a quick smoke test
jq 'select(.["process.name"] == "powershell.exe" and (.CommandLine | test("-enc|-encodedcommand"; "i")))' tests/events.jsonl
```

Expected: `evt-001` returned, `evt-002` silent.

---

## MITRE ATT&CK Mapping

Map observable behavior to ATT&CK techniques in rule tags. Mapping proves what telemetry enables detection, not just what the rule is named.

```yaml
tags:
    - attack.execution
    - attack.t1059.001
```

```json
{
  "technique_id": "T1059.001",
  "rule_id": "11111111-2222-4333-8444-555555555555",
  "coverage_type": "partial",
  "required_sources": ["process_creation"],
  "tested": true,
  "quality_gate": "pass"
}
```

Avoid claiming complete technique coverage. One rule rarely detects every form of a technique. Review mapping when logic changes — tuning may narrow actual coverage.

---

## sigma-cli Validation

Validation checks syntax and conversion before dataset testing.

```bash
# List available plugins
sigma plugin list

# Install a backend
sigma plugin install splunk

# List installed backends and pipelines
sigma list

# Validate a rule file
sigma check rules/encoded_powershell.yml

# Convert to Splunk SPL with Sysmon pipeline
sigma convert -t splunk -p sysmon rules/encoded_powershell.yml

# Write output to file
sigma convert -t splunk -p sysmon rules/encoded_powershell.yml -o build/encoded_powershell.spl
```

| Validation layer | Question |
| --- | --- |
| **YAML** | Is the file syntactically valid? |
| **Sigma schema** | Are required rule fields present and valid? |
| **Log source** | Does the rule declare appropriate telemetry? |
| **Field mapping** | Can expected fields map to the dataset? |
| **Backend conversion** | Can the backend represent the logic? |

A successful conversion proves only that the tooling could translate the rule. It does not prove detection quality.

### Lab: validate and convert

```bash
mkdir -p rules build

# Save the encoded PowerShell rule as rules/encoded_powershell.yml
sigma check rules/encoded_powershell.yml
sigma convert -t splunk -p sysmon rules/encoded_powershell.yml -o build/encoded_powershell.spl
cat build/encoded_powershell.spl
```

Expected: schema valid, SPL query written to file.

---

## Ground Truth and Testing

Testing needs labeled evidence and explicit expectations.

| Field | Purpose |
| --- | --- |
| **event_id** | Links label to normalized evidence |
| **label** | positive or negative for targeted behavior |
| **behavior_id** | Detection behavior being tested |
| **technique_id** | ATT&CK mapping where applicable |
| **justification** | Why the label is trusted |

```json
{
  "rule_id": "11111111-2222-4333-8444-555555555555",
  "test_id": "encoded-powershell-positive-001",
  "dataset": "tests/positive/encoded-powershell.jsonl",
  "expected_matches": ["evt-1004"],
  "expected_match_count": 1,
  "expected_result": "pass"
}
```

| Test class | Purpose |
| --- | --- |
| **Known positive** | Proves targeted behavior fires |
| **Known negative** | Proves benign activity stays quiet |
| **Boundary** | Tests thresholds, timeframes, case handling |
| **Missing field** | Verifies safe null behavior |
| **Regression** | Prevents old false positives from returning |

### Lab: build positive and negative test sets

```bash
mkdir -p tests/positive tests/negative

# Positive: encoded PowerShell
cat > tests/positive/encoded-powershell.jsonl << 'EOF'
{"event_id": "evt-1004", "Image": "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe", "CommandLine": "powershell.exe -encodedcommand dGVzdA=="}
EOF

# Negative: normal PowerShell
cat > tests/negative/encoded-powershell.jsonl << 'EOF'
{"event_id": "evt-2001", "Image": "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe", "CommandLine": "powershell.exe Get-Process"}
EOF

# Quick check with jq
echo "=== Should match (positive) ==="
jq 'select(.Image | test("powershell.exe$"; "i")) | select(.CommandLine | test("-enc|-encodedcommand"; "i"))' tests/positive/encoded-powershell.jsonl

echo "=== Should be empty (negative) ==="
jq 'select(.Image | test("powershell.exe$"; "i")) | select(.CommandLine | test("-enc|-encodedcommand"; "i"))' tests/negative/encoded-powershell.jsonl
```

Expected: positive file returns `evt-1004`, negative file returns nothing.

---

## Metrics: Precision, Recall, FPR

Quality metrics reveal different failure modes.

```text
precision          = TP / (TP + FP)
recall             = TP / (TP + FN)
false_positive_rate = FP / (FP + TN)
false_negative_rate = FN / (FN + TP)
```

| Metric | High means | Low means |
| --- | --- | --- |
| **Precision** | Most alerts are useful | Analysts receive noisy alerts |
| **Recall** | Most targeted activity detected | Important activity is missed |
| **FPR** | High = bad, benign often alerts | Low is preferred |
| **FNR** | High = bad, targeted evidence missed | Low is preferred |

```json
{
  "rule_id": "11111111-2222-4333-8444-555555555555",
  "tp": 8,
  "fp": 1,
  "tn": 992,
  "fn": 2,
  "precision": 0.8889,
  "recall": 0.8,
  "false_positive_rate": 0.001007,
  "quality_gate": "pass"
}
```

Always include raw counts beside rates. Metrics from very few positives are unstable.

### Lab: compute metrics from test results

```bash
# After running rules against labeled events, compute metrics
python3 << 'EOF'
tp, fp, tn, fn = 8, 1, 992, 2
precision = tp / (tp + fp)
recall    = tp / (tp + fn)
fpr       = fp / (fp + tn)

print(f"precision: {precision:.4f}")
print(f"recall:    {recall:.4f}")
print(f"FPR:       {fpr:.6f}")
print(f"gate:      {'pass' if precision >= 0.85 and recall >= 0.75 else 'fail'}")
EOF
```

Expected: precision 0.8889, recall 0.8, FPR 0.001007.

---

## Detection Tuning

Tuning reduces unnecessary alerts without weakening the targeted behavior.

```text
Inspect false positives
     ↓
Identify shared benign context
     ↓
Choose narrow field-based exclusion
     ↓
Re-run all positive and negative tests
     ↓
Compare precision and recall
     ↓
Document trade-off
```

| Method | Example |
| --- | --- |
| **Add required context** | Require both process name and suspicious argument |
| **Scope asset roles** | Apply rule to servers only |
| **Use parent-child relation** | Require unusual parent process |
| **Use path context** | Distinguish system binary from user-writable path |
| **Narrow allowlist** | Exclude one approved automation account and script |
| **Raise count threshold** | Require more events in the same timeframe |

Do not add broad exclusions such as entire admin groups or management subnets to reduce noise.

---

## Cross-Source Correlation

Correlation combines weak signals into one higher-confidence finding.

| Signal A | Signal B | Combined meaning |
| --- | --- | --- |
| Repeated auth failures | Success from new source | Possible brute force then access |
| New process | New outbound destination | Possible execution and C2 |
| File creation | Process execution | Possible payload staging and launch |
| Registry change | New process at logon | Possible persistence |
| Privileged login | Scheduled task creation | Possible persistence after account compromise |

Correlation requirements: define base rules, grouping keys, timeframe, order when necessary, preserve every source event ID, emit one finding not duplicate alerts.

---

## Correlation Primitives

When the backend cannot express complex relationships, preprocess events into stable primitives.

| Primitive | Meaning |
| --- | --- |
| **auth_failure_burst** | Threshold of grouped failures reached |
| **new_success_source** | Successful login from unseen source |
| **new_process** | Process absent from baseline |
| **new_external_destination** | Destination absent from network baseline |
| **sensitive_file_write** | Write to protected path |
| **off_hours_privileged_login** | Privileged success outside approved hours |

```json
{
  "primitive_type": "auth_failure_burst",
  "timestamp_utc": "2026-09-19T02:14:00Z",
  "group": {
    "source_ip": "192.0.2.50",
    "destination_host": "workstation-01",
    "user": "admin-a"
  },
  "count": 8,
  "timeframe_seconds": 300,
  "evidence_ids": ["evt-1", "evt-2", "evt-3"]
}
```

Preprocessing must be versioned and deterministic. A primitive retains links to all source records.

---

## Risk-Driven Prioritization

Catalog order must reflect organizational loss if a behavior is missed.

| Input | Purpose |
| --- | --- |
| **Asset criticality** | Impact of compromise |
| **Data sensitivity** | Exposure of regulated data |
| **Threat likelihood** | Relevance to observed adversary behavior |
| **Detection quality** | Precision, recall, confidence |
| **Coverage uniqueness** | Whether another rule covers the same behavior |
| **Response urgency** | Time before harm increases |

```text
priority_score =
  business_impact × 3
  + threat_likelihood × 2
  + coverage_uniqueness × 2
  + detection_quality × 2
  + response_urgency
  - analyst_cost
```

A technically novel rule with weak business relevance ranks below a reliable rule that protects a critical service from a likely attack.

---

## ATT&CK Coverage and Gaps

| State | Meaning |
| --- | --- |
| **Tested** | Rule passed quality gate against labeled evidence |
| **Partial** | Rule covers only one observable form of technique |
| **Untested** | Rule exists but lacks sufficient validation |
| **Telemetry gap** | Required source or fields unavailable |
| **Detection gap** | Telemetry exists but no acceptable rule exists |
| **Not applicable** | Technique irrelevant to environment scope |

Counting mapped rules is not measuring coverage. Ten weak rules do not equal one tested high-confidence detection.

---

## Quality Gates

Rules that fail the quality gate do not ship.

| Gate | Pass condition |
| --- | --- |
| **Schema validation** | Rule conforms to Sigma specification |
| **Unique ID** | ID does not collide with catalog |
| **Log source mapping** | Required fields exist in normalized data |
| **Positive test** | Known-positive behavior matches |
| **Negative test** | Known benign test stays quiet |
| **Precision** | Meets catalog threshold |
| **Recall** | Meets behavior-specific threshold |
| **FPR** | Below approved threshold on clean window |
| **ATT&CK mapping** | Supported by actual rule logic |
| **False-positive guidance** | Known benign cases documented |
| **Ownership** | Maintainer and review date assigned |

```json
{
  "rule_id": "11111111-2222-4333-8444-555555555555",
  "schema_valid": true,
  "positive_tests_passed": 4,
  "negative_tests_passed": 12,
  "precision": 0.92,
  "recall": 0.85,
  "false_positive_rate": 0.002,
  "ships": true
}
```

---

## Alert Queue Generation

The alert queue is the direct handoff to Tier 1 triage.

| Field | Purpose |
| --- | --- |
| **alert_id** | Stable queue identifier |
| **rule_id** | Detection that generated the alert |
| **rule_title** | Analyst-readable detection name |
| **timestamp_utc** | Alert time |
| **host** | Affected asset |
| **asset_criticality** | Business context |
| **severity** | Rule severity |
| **priority_score** | Queue ordering value |
| **technique_ids** | ATT&CK mapping |
| **summary** | Concise reason for alert |
| **evidence_ids** | Supporting normalized records |
| **rule_quality** | Precision and recall snapshot |

```json
{
  "alert_id": "ALT-000104",
  "rule_id": "55555555-6666-4777-8888-999999999999",
  "rule_title": "Authentication Failure Burst Followed by New Success",
  "timestamp_utc": "2026-09-19T02:15:30Z",
  "host": "workstation-01",
  "asset_criticality": "high",
  "severity": "high",
  "priority_score": 87,
  "technique_ids": ["T1110", "T1078"],
  "summary": "Eight failures followed by a successful login from a new source within 90 seconds",
  "evidence_ids": ["evt-101", "evt-102", "evt-109"],
  "source_count": 2,
  "rule_quality": {
    "precision": 0.94,
    "recall": 0.88
  }
}
```

```text
Queue order: priority_score desc → severity desc → asset_criticality desc → source_count desc → timestamp asc → alert_id asc
```

---

## Fast Recall

- **Four detection types: signature, anomaly, behavioral, correlation.**
- **TP and TN are correct decisions. FP wastes analyst time. FN misses targeted activity.**
- **Every rule must reduce to a precise predicate against known fields.**
- **Use free-text matching only when structured fields are unavailable.**
- **Sigma stores portable detection intent. Backends and pipelines still need testing.**
- **Core Sigma fields: title, id, status, logsource, detection, condition, falsepositives, level, tags.**
- **Selections define matches. Conditions combine them. Modifiers change comparison behavior.**
- **Every exclusion can create a false negative. Scope filters narrowly.**
- **Aggregation combines repeated events. Correlation combines related detections.**
- **ATT&CK mapping must reflect actual observable behavior. It is not decoration.**
- **Successful conversion does not prove detection quality.**
- **Test known positives, known negatives, boundaries, missing fields, and regressions.**
- **Precision measures alert usefulness. Recall measures detection completeness.**
- **Always publish raw TP, FP, TN, FN counts beside rates.**
- **Tune by adding meaningful context, not broad allowlists.**
- **Prioritize by organizational risk, not technical novelty.**
- **Rules that fail quality gates do not ship.**

---

## Resources

**Sigma format and authoring**
- [Sigma Specification](https://sigmahq.io/sigma-specification/)
- [Sigma Rules Specification](https://sigmahq.io/sigma-specification/specification/sigma-rules-specification.html)
- [Sigma Correlation Rules Specification](https://github.com/SigmaHQ/sigma-specification/blob/main/specification/sigma-correlation-rules-specification.md)
- [SigmaHQ Rule Repository](https://github.com/SigmaHQ/sigma)

**Detection tooling**
- [sigma-cli](https://github.com/SigmaHQ/sigma-cli)
- [pySigma Documentation](https://sigmahq-pysigma.readthedocs.io/)

**Detection theory and coverage**
- [MITRE ATT&CK Enterprise Matrix](https://attack.mitre.org/matrices/enterprise/)
- [The Pyramid of Pain](https://detect-respond.blogspot.com/2013/03/the-pyramid-of-pain.html)

**Man or help**
```text
sigma --help
sigma convert --help
jq --help
man python3
```
