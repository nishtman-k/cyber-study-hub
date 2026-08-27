# The Defensible Endpoint Package

> **⚠️ AUTHORIZED USE ONLY.** This material is for education, defensive security engineering, and authorized system administration. Apply hardening, telemetry, patching, firewall, and validation scripts only to systems you own or are explicitly authorized to manage. State-changing scripts can interrupt services or lock out administrators. Capture the baseline first, keep recovery access open, validate every stage, and preserve evidence integrity. See the [Legal and Terms of Use](/legal) page.

> "The job is not finished when the system is hardened. The job is finished when somebody else can take the hardened system, verify it in one command and use it the same night without calling you." (Engineering handoff principle, adapted)

**Scope:** Integrated endpoint delivery for Linux and Windows: baseline intake, machine-readable target state, Linux and Windows hardening, endpoint telemetry, patch engineering, network defense, idempotent orchestration, binary validation, compliance reporting, evidence normalization, manifest generation, file hashing, archive signing, integrity verification, executable runbooks, and professional handoff.

## Table of Contents
- [Core Concepts](#core-concepts)
- [Capstone Workflow](#capstone-workflow)
- [Environment Intake and Baseline](#environment-intake-and-baseline)
- [Target State as Data](#target-state-as-data)
- [Package Architecture](#package-architecture)
- [Linux Hardening Integration](#linux-hardening-integration)
- [Windows Hardening Integration](#windows-hardening-integration)
- [Telemetry Integration](#telemetry-integration)
- [Patch Pipeline Integration](#patch-pipeline-integration)
- [Perimeter Defense Integration](#perimeter-defense-integration)
- [Idempotent Orchestration](#idempotent-orchestration)
- [Exit Codes and Failure Handling](#exit-codes-and-failure-handling)
- [Binary Validation Criteria](#binary-validation-criteria)
- [Machine-Readable Compliance Report](#machine-readable-compliance-report)
- [Schema-Compatible Evidence](#schema-compatible-evidence)
- [Executable Runbook and README](#executable-runbook-and-readme)
- [Manifest, Hashes, and Signing](#manifest-hashes-and-signing)
- [Handoff Verification](#handoff-verification)
- [Quality Gates](#quality-gates)
- [Professional Judgment](#professional-judgment)
- [Framework and Tool Map](#framework-and-tool-map)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Concepts

| Term | Meaning |
| --- | --- |
| **Defensible endpoint** | A system that is hardened, observable, patched, segmented, validated, and supportable |
| **Baseline** | Structured evidence describing the environment before changes |
| **Target state** | Machine-readable definition of the required configuration and controls |
| **Orchestrator** | Script that coordinates component scripts and captures evidence at each stage |
| **Idempotence** | Re-running the same workflow safely produces the same intended state |
| **Compliance report** | Machine-readable pass-fail result covering all controls in scope |
| **Manifest** | Inventory of package files, metadata, and cryptographic hashes |
| **Integrity verification** | Proving delivered files have not changed since packaging |
| **Handoff bundle** | Archive containing scripts, configurations, evidence, reports, and verification tools |
| **Quality gate** | Binary condition that must pass before the workflow continues or the package is accepted |

### The core idea

```text
Raw environment
     ↓
Baseline captured
     ↓
Target state loaded
     ↓
Controls applied
     ↓
Evidence collected
     ↓
Controls validated
     ↓
Bundle packaged
     ↓
Receiver verifies independently
```

The system is not finished when controls are applied. It is finished when another engineer can reproduce the verdict using the delivered package without additional explanation.

## 2. Capstone Workflow

The capstone combines separate defensive disciplines into one measurable workflow.

| Stage | Purpose | Primary output |
| --- | --- | --- |
| **Intake** | Discover assets, operating systems, interfaces, services, and risks | baseline.json |
| **Define** | Express required controls as data | target-state.json |
| **Apply** | Run Linux, Windows, telemetry, patch, and network controls | stage logs and evidence |
| **Validate** | Test every required control | compliance-report.json |
| **Normalize** | Align telemetry and network artifacts to the shared schema | evidence bundle |
| **Package** | Create manifest, hashes, archive, and signature | handoff archive |
| **Verify** | Allow receiver to check integrity and controls | verification report |

### End-to-end flow

```text
preflight → baseline → harden → instrument → patch → segment → validate → package → verify
```

Every stage must write structured evidence even when it skips work or fails safely.

## 3. Environment Intake and Baseline

Intake records the starting condition before any script changes state.

### Baseline categories

| Category | Linux evidence | Windows evidence |
| --- | --- | --- |
| **Identity** | hostnamectl, OS release, kernel | ComputerInfo, OS build, domain state |
| **Accounts** | passwd, groups, sudo access | Local users, groups, administrators |
| **Services** | systemd units, listening sockets | Services, listening connections |
| **Packages** | dpkg-query, apt holds | Installed applications, features, updates |
| **Security controls** | AppArmor, auditd, nftables, SSH | Defender, firewall, audit policy, PowerShell logging |
| **Network** | addresses, routes, neighbors | IP configuration, routes, profiles |
| **Time** | timezone and synchronization | timezone and time service |

### Linux intake commands

```bash
hostnamectl
cat /etc/os-release
uname -r
ip -json address show
ip -json route show
ss -tulpn
dpkg-query -W -f='${binary:Package}\t${Version}\n'
systemctl list-unit-files --state=enabled
sudo nft list ruleset
sudo auditctl -l
```

### Windows intake commands

```powershell
Get-ComputerInfo
Get-LocalUser
Get-LocalGroupMember -Group Administrators
Get-Service
Get-NetTCPConnection -State Listen
Get-NetIPConfiguration
Get-NetFirewallProfile
Get-NetFirewallRule -Enabled True
Get-MpComputerStatus
auditpol /get /category:*
```

### Baseline rule

Baseline collection is read-only. If a required discovery tool is missing, record an environment error instead of silently omitting the evidence.

## 4. Target State as Data

A target state is not narrative guidance. It is structured data that scripts and validators can consume.

### Required fields

| Field | Purpose |
| --- | --- |
| **control_id** | Stable identifier used across scripts and reports |
| **platform** | linux, windows, or network |
| **category** | hardening, telemetry, patching, firewall, validation |
| **desired_state** | Exact state required |
| **severity** | Criticality of failure |
| **validator** | Check that proves the state |
| **remediation** | Script or function that establishes the state |
| **evidence_path** | Location of supporting output |

### Target-state example

```json
{
  "schema_version": "1.0",
  "controls": [
    {
      "control_id": "LIN-SSH-001",
      "platform": "linux",
      "category": "hardening",
      "desired_state": "PermitRootLogin no",
      "severity": "high",
      "validator": "validate_sshd_root_login",
      "remediation": "linux/apply-ssh-hardening.sh",
      "evidence_path": "evidence/linux/ssh.json"
    }
  ]
}
```

### Design principle

The same control ID must appear in the target state, stage evidence, compliance report, and final summary. This creates traceability from requirement to proof.

## 5. Package Architecture

The directory layout should be predictable, portable, and readable without reverse engineering.

```text
defensible-endpoint-package/
├── README.md
├── bin/
│   ├── run-all.sh
│   ├── verify-handoff.sh
│   └── Invoke-FullPipeline.ps1
├── config/
│   ├── target-state.json
│   ├── sysmon.xml
│   ├── audit.rules
│   └── firewall.nft
├── scripts/
│   ├── linux/
│   ├── windows/
│   ├── telemetry/
│   ├── patching/
│   └── network/
├── evidence/
│   ├── baseline/
│   ├── telemetry/
│   ├── network/
│   └── validation/
├── reports/
│   ├── compliance-report.json
│   └── handoff-summary.json
├── manifest.json
├── SHA256SUMS
└── SIGNATURE.asc
```

### Layout rules

| Rule | Reason |
| --- | --- |
| Keep state-changing and validation scripts separate | Makes safety boundaries obvious |
| Put generated evidence outside source directories | Prevents confusing code with output |
| Use stable relative paths | Supports portable verification |
| Version the schema | Prevents silent format drift |
| End every text file with a newline | Meets tooling and project requirements |

## 6. Linux Hardening Integration

Linux hardening should be applied as a controlled, evidence-producing stage.

### Control groups

| Group | Examples |
| --- | --- |
| **Accounts and authentication** | PAM, password policy, sudo, root restrictions |
| **SSH** | Root login disabled, secure algorithms, restricted access |
| **Kernel and network** | sysctl controls, forwarding, redirects, source routing |
| **Mandatory access control** | AppArmor enabled and profiles enforced |
| **Services** | Unneeded services disabled |
| **Logging** | journald, auditd, log permissions |
| **Firewall** | nftables default-deny and approved paths |

### Stage contract

```text
Input: target-state.json + current Linux state
Action: apply only missing or incorrect controls
Output: evidence/linux/*.json
Exit: 0 success, 1 controlled failure, 2 environment error
```

### Idempotent pattern

```bash
#!/bin/bash
set -u

current_value=$(sysctl -n net.ipv4.ip_forward 2>/dev/null) || exit 2

if [ "$current_value" = "0" ]; then
    printf '%s\n' 'already_compliant'
    exit 0
fi

sudo sysctl -w net.ipv4.ip_forward=0 >/dev/null || exit 1

[ "$(sysctl -n net.ipv4.ip_forward)" = "0" ] || exit 1
exit 0
```

## 7. Windows Hardening Integration

Windows hardening uses the same target-state and evidence principles as Linux.

### Control groups

| Group | Examples |
| --- | --- |
| **Accounts** | Local admin restrictions, password controls, LAPS where applicable |
| **Authentication** | MFA readiness, NTLM restrictions, Kerberos settings where domain-managed |
| **Audit policy** | Logon, process creation, account management, policy change |
| **PowerShell** | Script Block Logging, Module Logging, transcription policy |
| **Application control** | AppLocker or App Control audit and enforcement state |
| **Services and protocols** | SMBv1 disabled, RDP restricted, NLA enabled |
| **Firewall** | Profiles enabled, default inbound block, scoped allow rules |

### Idempotent PowerShell pattern

```powershell
$ErrorActionPreference = 'Stop'

try {
    $profile = Get-NetFirewallProfile -Profile Public
    if ($profile.DefaultInboundAction -ne 'Block') {
        Set-NetFirewallProfile -Profile Public -DefaultInboundAction Block
    }

    $verified = Get-NetFirewallProfile -Profile Public
    if ($verified.DefaultInboundAction -ne 'Block') {
        exit 1
    }

    exit 0
}
catch {
    Write-Error $_
    exit 2
}
```

### Validation rule

Do not treat successful cmdlet execution as proof. Query the final state and write the observed value into evidence.

## 8. Telemetry Integration

Telemetry proves that security-relevant activity leaves usable evidence.

### Required sources

| Platform | Source | Minimum proof |
| --- | --- | --- |
| **Windows** | Sysmon | Process, network, file, registry, DNS events as configured |
| **Windows** | PowerShell | Script Block Logging and Module Logging events |
| **Windows** | Security log | Logon, process creation, account and policy activity |
| **Linux** | auditd | Execution, file access, privilege, and identity records |
| **Linux** | Authentication logs | SSH, sudo, su, and PAM outcomes |
| **Both** | Firewall logs | Allowed or denied connection evidence where configured |

### Telemetry validation flow

```text
Run benign test action
     ↓
Record ground truth in UTC
     ↓
Search expected source
     ↓
Confirm required fields
     ↓
Write detection result
```

### Shared evidence fields

| Field | Purpose |
| --- | --- |
| **timestamp_utc** | Cross-platform timeline |
| **host** | Endpoint identity |
| **os_family** | linux or windows |
| **source** | sysmon, powershell, security, auditd, auth, firewall |
| **event_id** | Native or normalized event identifier |
| **user** | Account associated with activity |
| **process_name** | Executable or command |
| **action** | Observed behavior |
| **evidence_pointer** | File, record ID, or line reference |

## 9. Patch Pipeline Integration

The patch stage measures exposure, repairs package state if necessary, applies approved fixes, and validates both security and service health.

### Patch stage gates

| Gate | Pass condition |
| --- | --- |
| **Package manager health** | No unresolved or half-configured package state |
| **Inventory complete** | Installed and candidate versions recorded |
| **Maintenance condition** | Allowed window or documented override |
| **Snapshot captured** | Package, service, and config state preserved |
| **Patch applied** | Target package reaches fixed version |
| **Service validated** | Critical service remains healthy |
| **Drift reviewed** | Unexpected changes classified |
| **Rollback available** | Previous version or snapshot path recorded |

### Linux patch sequence

```bash
sudo dpkg --audit
sudo dpkg --configure -a
sudo apt-get install -f
sudo apt-get update
sudo apt-get -s upgrade
sudo apt-get install --only-upgrade package-name
```

### Patch evidence

Record package name, previous version, new version, related CVEs, command outcome, reboot requirement, service status, and rollback status.

## 10. Perimeter Defense Integration

Network controls define and enforce the paths required by the target state.

### Integrated network controls

| Control | Proof |
| --- | --- |
| **Zone assignment** | Host and subnet mapped in zone-model.json |
| **Default-deny inbound** | Firewall policy and denied test |
| **Required allow paths** | Successful connection tests from approved sources |
| **Management restriction** | SSH or RDP reachable only from management sources |
| **Secure protocols** | No unauthorized Telnet, FTP, or cleartext admin surface |
| **DNS control** | Approved resolver paths and blocked bypass tests |
| **Network evidence** | Firewall logs, connection matrix, Suricata or PCAP output |

### Validation matrix

| Test result | Meaning |
| --- | --- |
| **allowed_expected** | Required path works |
| **denied_expected** | Prohibited path is blocked |
| **allowed_unexpected** | Critical segmentation failure |
| **denied_unexpected** | Availability or rule-design failure |

## 11. Idempotent Orchestration

The orchestrator composes prior controls into a new workflow and records each stage. It must do more than call scripts in sequence.

### Orchestrator responsibilities

| Responsibility | Requirement |
| --- | --- |
| **Preflight** | Verify dependencies, permissions, inputs, and paths |
| **Stage control** | Run components in the required order |
| **Evidence capture** | Save start time, end time, exit code, and artifact paths |
| **Fail-safe behavior** | Stop before unsafe dependent stages |
| **Resume support** | Skip stages already verified when safe |
| **Summary** | Produce one final machine-readable result |

### Bash orchestrator skeleton

```bash
#!/bin/bash
set -u

readonly ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
readonly REPORT="$ROOT_DIR/reports/pipeline-run.json"

run_stage() {
    stage_name=$1
    stage_script=$2

    start_time=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
    "$stage_script"
    stage_rc=$?
    end_time=$(date -u +'%Y-%m-%dT%H:%M:%SZ')

    jq -n \
      --arg stage "$stage_name" \
      --arg started "$start_time" \
      --arg finished "$end_time" \
      --argjson exit_code "$stage_rc" \
      '{stage:$stage,started_at:$started,finished_at:$finished,exit_code:$exit_code}'

    return "$stage_rc"
}
```

### Safe re-run behavior

A second run should validate controls already in place, skip unnecessary changes, refresh evidence, and produce the same compliant result.

## 12. Exit Codes and Failure Handling

Every script uses the same documented exit contract.

| Exit code | Meaning | Orchestrator action |
| --- | --- | --- |
| **0** | Success or already compliant | Continue |
| **1** | Controlled failure, failed check, or unapplied control | Record failure and stop dependent stages |
| **2** | Environment error, missing dependency, or missing input | Record error and stop immediately |

### Failure record example

```json
{
  "stage": "linux-hardening",
  "status": "failed",
  "exit_code": 1,
  "control_id": "LIN-SSH-001",
  "message": "Final validation did not match target state",
  "timestamp_utc": "2026-08-27T09:00:00Z"
}
```

### Error-handling principle

Do not collapse all failures into one exit code. The receiver must distinguish a security check failure from an unusable execution environment.

## 13. Binary Validation Criteria

Evaluation criteria must be binary and countable. Avoid subjective labels such as good, strong, appropriate, or secure enough.

### Criterion structure

| Field | Meaning |
| --- | --- |
| **control_id** | Unique test identifier |
| **expected** | Exact state or value |
| **observed** | Actual measured state |
| **result** | pass, fail, error, or not_applicable |
| **evidence_pointer** | Machine-verifiable proof |
| **severity** | Impact of failure |

### Good and bad criteria

| Weak criterion | Binary replacement |
| --- | --- |
| SSH is secure | PermitRootLogin equals no |
| Firewall is configured properly | Default inbound action equals block |
| Logging is enabled | Required log channel enabled and test event found |
| Packages are current | Installed package version meets fixed version |
| Network is segmented | Every forbidden matrix path returns denied_expected |

### Countable summary

```text
pass_count + fail_count + error_count + not_applicable_count = total_control_count
```

## 14. Machine-Readable Compliance Report

The compliance report is the single source of truth for final readiness.

### Report structure

```json
{
  "schema_version": "1.0",
  "generated_at_utc": "2026-08-27T09:15:00Z",
  "package_id": "defensible-endpoint-package-001",
  "summary": {
    "total": 120,
    "passed": 118,
    "failed": 0,
    "errors": 0,
    "not_applicable": 2,
    "ready": true
  },
  "controls": [
    {
      "control_id": "NET-FW-001",
      "expected": "default inbound block",
      "observed": "block",
      "result": "pass",
      "evidence_pointer": "evidence/network/firewall.json"
    }
  ]
}
```

### Readiness equation

```text
ready = true only when:
failed = 0
errors = 0
all mandatory controls are pass or approved not_applicable
manifest verification passes
```

## 15. Schema-Compatible Evidence

Telemetry and network evidence must retain the same field names and directory layout expected by downstream analysts.

### Compatibility rules

| Rule | Requirement |
| --- | --- |
| **Stable fields** | Do not rename timestamp_utc, host, source, action, or evidence_pointer |
| **Stable directories** | Preserve telemetry and network evidence locations |
| **Schema version** | Include explicit version in every top-level artifact |
| **UTC timestamps** | Normalize time before packaging |
| **Raw preservation** | Keep original evidence beside normalized records |
| **No synthetic events** | Do not invent data to fill missing fields |

### Normalized record example

```json
{
  "schema_version": "1.0",
  "timestamp_utc": "2026-08-27T09:10:00Z",
  "host": "endpoint-01",
  "os_family": "linux",
  "source": "auditd",
  "event_id": "EXECVE",
  "user": "authorized-tester",
  "process_name": "curl",
  "action": "process_execution",
  "evidence_pointer": "evidence/telemetry/linux-events.json:42"
}
```

## 16. Executable Runbook and README

The runbook is executable. Operational steps belong in scripts, not explanatory prose.

### Mandatory README content

The root README contains only:

```markdown
# The Defensible Endpoint Package

`sudo ./bin/run-all.sh`

`./bin/verify-handoff.sh`
```

### Runbook design

| Requirement | Implementation |
| --- | --- |
| One command to run | Root orchestrator |
| One command to verify | Independent verification script |
| No hidden manual steps | All prerequisites checked by preflight |
| Clear output | Green or red result plus report path |
| Repeatable | Same inputs produce the same target state |

### Newline validation

```bash
find . -type f -print0 | while IFS= read -r -d '' file; do
    [ -s "$file" ] || continue
    [ "$(tail -c 1 "$file" | wc -l)" -eq 1 ] || printf '%s\n' "missing newline: $file"
done
```

## 17. Manifest, Hashes, and Signing

The manifest proves what was delivered. Hashes prove whether files changed after packaging. A signature can bind the manifest or archive to the sender.

### Manifest fields

| Field | Purpose |
| --- | --- |
| **package_id** | Unique bundle identifier |
| **created_at_utc** | Packaging timestamp |
| **schema_version** | Manifest format version |
| **file_count** | Count of included files |
| **path** | Relative file path |
| **size_bytes** | File size |
| **sha256** | Integrity hash |
| **content_type** | script, config, evidence, report, or documentation |

### Hash generation

```bash
find . -type f \
  ! -name SHA256SUMS \
  ! -name SIGNATURE.asc \
  -print0 \
  | sort -z \
  | xargs -0 sha256sum > SHA256SUMS

sha256sum -c SHA256SUMS
```

### Archive and sign

```bash
tar --sort=name \
    --owner=0 \
    --group=0 \
    --numeric-owner \
    -czf defensible-endpoint-package.tar.gz defensible-endpoint-package/

gpg --armor --detach-sign defensible-endpoint-package.tar.gz
```

### Integrity rule

Generate hashes only after final content is complete. Changing any file after manifest creation invalidates the handoff and requires regeneration.

## 18. Handoff Verification

Verification must work independently of the build process.

### Verification sequence

```text
Check required files
     ↓
Verify archive signature
     ↓
Verify SHA-256 hashes
     ↓
Validate JSON syntax and schema versions
     ↓
Check script lint results
     ↓
Run non-destructive control validators
     ↓
Recalculate compliance summary
     ↓
Return final exit code
```

### Verification commands

```bash
gpg --verify defensible-endpoint-package.tar.gz.asc defensible-endpoint-package.tar.gz
tar -tzf defensible-endpoint-package.tar.gz
sha256sum -c SHA256SUMS
find evidence reports config -name '*.json' -print0 | xargs -0 -n1 jq empty
shellcheck bin/*.sh scripts/linux/*.sh scripts/telemetry/*.sh scripts/patching/*.sh scripts/network/*.sh
```

### Verification result

| Result | Meaning |
| --- | --- |
| **PASS** | Integrity, syntax, schema, and mandatory controls verified |
| **FAIL** | One or more controls or integrity checks failed |
| **ERROR** | Verification could not run because the environment or package is incomplete |

## 19. Quality Gates

Quality gates stop incomplete or unsafe bundles from being accepted.

| Gate | Pass condition |
| --- | --- |
| **README** | Contains only title, run command, and verify command |
| **Bash lint** | shellcheck reports no errors |
| **PowerShell lint** | PSScriptAnalyzer default rules pass |
| **Idempotence** | Second run causes no harmful or duplicate changes |
| **Exit code contract** | Every script documents and uses 0, 1, and 2 |
| **JSON validity** | Every JSON artifact parses successfully |
| **Schema compatibility** | Expected fields and paths are unchanged |
| **Control coverage** | Every target-state control has a result |
| **Integrity** | Hashes and signature verify |
| **Newlines** | Every text file ends with a newline |
| **One-command operation** | Full run and verification each use one command |

### Final gate

```text
No failed mandatory controls
No environment errors
No invalid JSON
No lint errors
No hash mismatches
No undocumented evidence gaps
```

## 20. Professional Judgment

A binary report does not remove professional judgment. It makes judgment visible and traceable.

**Mark a control not applicable only when** the condition truly does not exist and the reason is recorded.

**Accept an exception only when** the remaining risk, reason, compensating control, owner, and expiry are documented.

| Field | Records |
| --- | --- |
| **control_id** | Control affected by the exception |
| **risk** | Exposure that remains |
| **reason** | Why the target state cannot be met |
| **compensating_control** | Alternative protection |
| **owner** | Person accepting the risk |
| **expires_at** | Date and time when the exception ends |
| **evidence_pointer** | Proof supporting the decision |

The receiver should never need to guess whether a missing control was forgotten, failed, or intentionally excluded.

## 21. Framework and Tool Map

| Item | Purpose |
| --- | --- |
| **NIST SP 800-53 Rev. 5** | Security and privacy control catalog, including acquisition and unsupported-component considerations |
| **CIS Controls v8 IG1** | Essential cyber hygiene baseline for newly managed endpoints |
| **NIST SP 800-137** | Continuous monitoring and evidence of control effectiveness |
| **Linux hardening tools** | sysctl, AppArmor, PAM, auditd, systemd, SSH |
| **Windows hardening tools** | PowerShell, audit policy, Sysmon, Windows Firewall, AppLocker |
| **Patch tools** | apt, dpkg, unattended-upgrades, package validation |
| **Network tools** | nftables, Suricata, tshark, tcpdump |
| **jq** | JSON creation, parsing, and validation |
| **sha256sum** | File-integrity hashing |
| **tar** | Archive creation and inspection |
| **GPG** | Detached signing and signature verification |
| **shellcheck** | Bash static analysis |
| **PSScriptAnalyzer** | PowerShell static analysis |

## 22. Fast Recall

- **The capstone is synthesis, not copy-paste.** New orchestrators must capture evidence at every stage.
- **Baseline before change.** The unhardened state is part of the evidence.
- **Target state belongs in data.** Scripts and validators consume it directly.
- **One control ID should connect requirement, remediation, evidence, and result.**
- **The workflow is harden, instrument, patch, segment, validate, package, verify.**
- **Idempotent means safe to re-run.** Already-correct controls are verified, not re-applied blindly.
- **Exit codes are fixed:** 0 success, 1 controlled failure, 2 environment error.
- **Every state-changing script must validate its final state.** Command success is not proof.
- **Binary criteria use exact expected and observed values.** Avoid subjective scoring.
- **The compliance report is the readiness source of truth.**
- **Module-compatible evidence keeps stable fields, paths, schema versions, and UTC timestamps.**
- **README contains only the title, run command, and verify command.**
- **Every text file ends with a newline.**
- **Bash must pass shellcheck. PowerShell must pass PSScriptAnalyzer.**
- **Hash after finalizing content.** Any later change invalidates the manifest.
- **A signature proves origin; hashes prove integrity.** Use both where required.
- **The handoff is complete only when another engineer can verify it independently.**

## 23. Resources

**Handoff and controls**
- [NIST SP 800-53 Rev. 5: Security and Privacy Controls](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)
- [CIS Controls v8 Implementation Group 1](https://www.cisecurity.org/controls/implementation-groups/ig1)
- [CIS Controls Implementation Groups](https://www.cisecurity.org/controls/implementation-groups)

**Evidence and validation**
- [NIST SP 800-137: Information Security Continuous Monitoring](https://csrc.nist.gov/pubs/sp/800/137/final)
- [NIST SP 800-137A: Assessing ISCM Programs](https://csrc.nist.gov/pubs/sp/800/137/a/final)

**Prior project references**
- Linux hardening, Windows hardening, endpoint telemetry, patch engineering, and perimeter defense tools and references remain applicable.

**Man or help**
```text
man tar
man sha256sum
man jq
man systemctl
man nft
shellcheck --help
Get-Help Invoke-ScriptAnalyzer
```
