# The Patch Equation

> **⚠️ AUTHORIZED USE ONLY.** This material is for education, defensive vulnerability management, and authorized Linux administration. Apply package repairs, upgrades, downgrades, holds, pinning, rollback, and unattended-upgrades configuration only to systems you own or are explicitly authorized to administer. Patch operations can break services, restart daemons, change dependencies, remove packages, or leave systems unrebooted with vulnerable code still loaded. Measure first, snapshot before changing, validate after every action, and keep a rollback path open. See the [Legal and Terms of Use](/legal) page.

> "The window between disclosure and exploitation is measured in hours. The window between patch availability and deployment is measured in months." (Mandiant M-Trends, 2024)

**Scope:** Linux patch engineering and vulnerability management: package inventory, CVE-to-package mapping, CVSS and exploit-based prioritization, apt and dpkg state repair, security-only patching, maintenance-window enforcement as code, snapshots, drift checks, rollback with downgrade, apt-mark hold, apt preferences pinning, unattended-upgrades configuration, validation, structured JSON artifacts, and auditable change logs.

## Table of Contents
- [Core Concepts](#core-concepts)
- [Vulnerability Management Fundamentals](#vulnerability-management-fundamentals)
- [APT and dpkg Fundamentals](#apt-and-dpkg-fundamentals)
- [Patch Engineering Methodology](#patch-engineering-methodology)
- [Package Inventory and CVE Mapping](#package-inventory-and-cve-mapping)
- [Patch Prioritization](#patch-prioritization)
- [Patch Types and Risk Profiles](#patch-types-and-risk-profiles)
- [Pre-Change Safety Checks](#pre-change-safety-checks)
- [Broken apt and dpkg Recovery](#broken-apt-and-dpkg-recovery)
- [Maintenance Window Enforcement](#maintenance-window-enforcement)
- [Security-Only Patching](#security-only-patching)
- [Validation After Patching](#validation-after-patching)
- [Configuration Drift Detection](#configuration-drift-detection)
- [Rollback and Pinning](#rollback-and-pinning)
- [unattended-upgrades](#unattended-upgrades)
- [Structured JSON Artifacts](#structured-json-artifacts)
- [End-to-End Patch Pipeline](#end-to-end-patch-pipeline)
- [Professional Judgment](#professional-judgment)
- [Framework and Tool Map](#framework-and-tool-map)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Concepts

| Term | Meaning |
| --- | --- |
| **Patch** | A vendor-provided change that fixes security, stability, or functionality issues |
| **Security patch** | A package update that remediates a vulnerability or reduces security exposure |
| **CVE** | A public vulnerability identifier used to track a known flaw |
| **CVSS** | A scoring system that estimates technical severity, but does not fully represent real-world risk |
| **Exploit availability** | Evidence that exploit code or active exploitation exists |
| **Asset criticality** | Business or mission importance of the affected system or service |
| **Exposure** | Whether the vulnerable service is reachable, internet-facing, authenticated, or isolated |
| **Rollback** | Restoring a previous package version, snapshot, or known-good state after regression |
| **Drift** | Configuration or package state that changed unexpectedly from the approved baseline |
| **Idempotence** | A script property where safe re-runs produce the same intended state without duplicate damage |

### The core idea

```text
Vulnerabilities appear
     ↓
Packages are mapped
     ↓
Risk is prioritized
     ↓
State is captured
     ↓
Patches are applied
     ↓
Outcomes are validated
     ↓
Evidence is exported
```

A patch command succeeding is not the same as risk being resolved. The patch equation is: **exposure removed + service still works + evidence captured + rollback possible**. If any part is missing, the operation is incomplete.

## 2. Vulnerability Management Fundamentals

Vulnerability management turns advisories into concrete action. The goal is to answer four questions quickly and repeatably: which systems are affected, how severe the risk is, what the patch may break, and whether the patch actually fixed the issue.

### The core workflow

```text
Advisory received
     ↓
Extract CVEs and affected packages
     ↓
Inventory installed package versions
     ↓
Map packages to vulnerability sources
     ↓
Prioritize by risk
     ↓
Patch safely
     ↓
Verify fixed versions and service health
     ↓
Export evidence
```

### Why raw CVSS is incomplete

| Signal | What it tells you | What it misses |
| --- | --- | --- |
| **CVSS** | Technical severity of the vulnerability | Whether your asset is exposed, exploited, or mission-critical |
| **CISA KEV** | Known exploitation in the wild | Whether the vulnerable product exists in your environment |
| **Exploit code** | Practical attacker availability | Whether the exploit works against your specific version or config |
| **Asset criticality** | Business impact if compromised | Technical exploitability |
| **Network exposure** | Reachability by attackers | Internal privilege paths and local attack paths |

### The security reality

Patching is preventive maintenance. It reduces the probability that a known flaw becomes an incident. But patching also changes production systems, so it needs engineering controls: inventory, dependency analysis, snapshots, validation, rollback, and evidence.

## 3. APT and dpkg Fundamentals

APT is the high-level package manager. dpkg is the lower-level package database and installer. APT resolves dependencies and retrieves packages; dpkg records installed package state and configures packages.

### Package management roles

| Tool | Role |
| --- | --- |
| **apt** | Human-friendly package operations: install, upgrade, remove, search, list |
| **apt-get** | Script-friendly package operations with stable behavior |
| **apt-cache** | Package metadata queries |
| **apt-mark** | Mark packages as held, automatic, or manual |
| **dpkg** | Low-level package install, remove, configure, and database inspection |
| **dpkg-query** | Query installed package metadata and package status |
| **apt preferences** | Pin package versions or repositories using priority rules |
| **unattended-upgrades** | Automatic package upgrade mechanism, commonly used for security updates |

### Package states worth recognizing

| State | Meaning | Action |
| --- | --- | --- |
| **install ok installed** | Package is installed and configured | Normal state |
| **half-installed** | Installation failed partway | Repair before patching |
| **unpacked** | Files are unpacked but not configured | Run configure or fix dependencies |
| **half-configured** | Configuration scripts failed | Diagnose maintainer script or dependency issue |
| **config-files** | Package removed, config files remain | Purge only if intended |
| **hold** | Package is pinned from upgrade by apt-mark | Review before applying security updates |

## 4. Patch Engineering Methodology

Patch engineering follows a deterministic sequence. Do not change first and investigate later.

```text
Inventory              collect packages, versions, services, holds, repos
     ↓
Assess exposure        map CVEs to installed versions and reachable services
     ↓
Prioritize             rank by KEV, exploitability, CVSS, criticality, exposure
     ↓
Preflight              verify apt health, locks, disk, backups, windows
     ↓
Snapshot               capture package state, config hashes, service status
     ↓
Patch                  apply targeted security updates
     ↓
Validate               prove fixed version and service health
     ↓
Drift check            compare expected and unexpected changes
     ↓
Rollback if needed     downgrade, restore snapshot, hold, pin
     ↓
Export evidence        structured JSON and change log
```

**Priority order,** highest value first:
- **Actively exploited vulnerabilities**, especially those present in KEV or confirmed by credible threat intelligence.
- **Internet-facing remote code execution**, because unauthenticated network paths compress response time.
- **Privilege escalation on multi-user or exposed systems**, because a foothold becomes root.
- **Cryptographic and TLS libraries**, because one vulnerable library may affect many services.
- **Kernel updates**, because they often require reboot planning and loaded-code validation.

## 5. Package Inventory and CVE Mapping

Package inventory is the evidence foundation. A CVE is not actionable until you know whether the affected package and vulnerable version are actually installed.

### Inventory commands

```bash
# List installed packages with versions
dpkg-query -W -f='${binary:Package}\t${Version}\t${Architecture}\n'

# Show packages with available upgrades
apt list --upgradable

# Show installed package details
dpkg -s openssh-server

# Show candidate and installed versions
apt-cache policy openssh-server

# Review package changelog for CVE references
apt-get changelog openssh-server
```

### Evidence fields

| Field | Purpose |
| --- | --- |
| **host** | System where the package was observed |
| **package** | Binary package name |
| **installed_version** | Version currently installed |
| **candidate_version** | Version apt would install |
| **architecture** | Package architecture, such as amd64 |
| **repository** | Source repository or pocket |
| **cve_id** | Vulnerability identifier being assessed |
| **fixed_version** | Version that remediates the issue |
| **status** | vulnerable, fixed, not_installed, unknown, held, unsupported |

### Mapping logic

```text
CVE affects package X before fixed version Y
     ↓
Host has package X installed at version Z
     ↓
Compare Z to Y using distribution version rules
     ↓
Mark vulnerable, fixed, not installed, or unknown
```

**Accuracy note:** Ubuntu and Debian often backport security fixes without changing to the upstream version that public scanners expect. Always compare against distribution security notices and package changelogs, not only upstream version numbers.

## 6. Patch Prioritization

Prioritization decides what must move now, what can wait for the next standard window, and what needs compensating controls.

### Prioritization inputs

| Input | Why it matters |
| --- | --- |
| **CISA KEV presence** | Confirms known exploitation in the wild |
| **CVSS base score** | Measures technical severity |
| **Exploit availability** | Shows how quickly attackers can operationalize the flaw |
| **Asset criticality** | Measures business impact if the host fails or is compromised |
| **Network exposure** | Determines whether attackers can reach the vulnerable service |
| **Privilege required** | Separates pre-auth remote risk from local post-compromise risk |
| **Patch complexity** | Indicates service restart, dependency, or reboot risk |
| **Compensating controls** | Firewalls, AppArmor, segmentation, and service restrictions can modify urgency |

### Suggested risk decision table

| Condition | Priority | Expected action |
| --- | --- | --- |
| In KEV and exposed | Emergency | Patch or mitigate immediately, validate, export evidence |
| Pre-auth RCE on reachable service | Emergency | Patch in expedited window, or isolate until fixed |
| Critical library used by many services | High | Patch, restart affected services, verify loaded libraries |
| Kernel local privilege escalation | High | Patch, schedule reboot, confirm running kernel changed |
| Medium CVSS on isolated non-critical host | Standard | Patch in normal cycle |
| Patch breaks critical service and exploit is not active | Exception | Document risk, owner, compensating control, and review date |

### Priority score model

```text
priority = severity + exploitation + exposure + asset_criticality - compensating_controls - patch_risk_adjustment
```

The score is a guide, not the final decision. Active exploitation and internet exposure should override a comfortable-looking calendar.

## 7. Patch Types and Risk Profiles

Different updates fail in different ways. Treating every package like a simple application update is how production outages happen.

| Patch type | Examples | Deployment concern | Rollback concern |
| --- | --- | --- | --- |
| **Security patch** | openssh-server CVE fix | May restart exposed services | Downgrade can reintroduce vulnerability |
| **Feature update** | Major application behavior change | New behavior may break configs | Config format may not downgrade cleanly |
| **Kernel update** | linux-image | Requires reboot to take effect | Bootloader and module compatibility matter |
| **Library update** | libssl3 | Dependent services may need restart | Many processes may keep old library loaded |
| **Service update** | apache2, nginx, ssh | Service restart can interrupt users | Older configs may not match older binary |
| **Dependency update** | libc, openssl dependency chain | Wide blast radius | Partial downgrade can create dependency conflicts |

### Loaded code matters

A package can be updated on disk while vulnerable code is still running in memory. For kernels, verify the running kernel. For libraries, identify processes using deleted or old library mappings and restart affected services.

## 8. Pre-Change Safety Checks

Preflight gates prevent the pipeline from making a bad situation worse.

### Required checks

| Check | Why it matters |
| --- | --- |
| **apt lock status** | Avoid colliding with another package operation |
| **dpkg health** | Broken states must be repaired before upgrading |
| **disk space** | Full disks can corrupt package transactions |
| **repository reachability** | Missing mirrors cause partial plans or stale metadata |
| **held packages** | Holds may prevent security fixes |
| **backup or snapshot exists** | Rollback needs a known-good state |
| **service health baseline** | Validation requires a before and after comparison |
| **maintenance window** | Production changes must be intentionally timed |

### Preflight command set

```bash
# Check dpkg audit state
sudo dpkg --audit

# Check held packages
apt-mark showhold

# Check pending upgrades
apt list --upgradable

# Check available disk space
df -h /

# Check apt timers and possible concurrent activity
systemctl list-timers 'apt*'
ps aux | grep -E 'apt|dpkg' | grep -v grep

# Refresh metadata safely
sudo apt-get update
```

## 9. Broken apt and dpkg Recovery

A broken package state must be repaired before normal patching. The goal is to return the package database to a consistent state, not to force upgrades blindly.

### Common broken states

| Symptom | Likely cause | First response |
| --- | --- | --- |
| dpkg lock present | Active or dead package process | Confirm no active process before removing stale lock |
| half-configured package | Interrupted config script | Run dpkg configure after reviewing errors |
| unmet dependencies | Partial upgrade or missing repo | Use apt-get install -f after metadata refresh |
| apt cache conflict | Stale package lists | Clean and update carefully |
| service failed post-install | Maintainer script failure | Inspect journal and package scripts |

### Recovery sequence

```bash
# 1. Confirm no active package manager is running
ps aux | grep -E 'apt|dpkg' | grep -v grep

# 2. Inspect package database issues
sudo dpkg --audit

# 3. Configure unpacked packages
sudo dpkg --configure -a

# 4. Fix dependencies
sudo apt-get install -f

# 5. Refresh metadata
sudo apt-get update

# 6. Re-check package health
sudo dpkg --audit
```

**Lock warning:** never remove dpkg or apt lock files just because a command told you they exist. First prove that no apt, apt-get, unattended-upgrades, or dpkg process is actively running.

## 10. Maintenance Window Enforcement

Maintenance windows can be enforced as code. A safe patch script should refuse to apply changes outside approved windows unless explicitly run in an emergency mode with logging.

### Enforcement model

```text
Read window policy
     ↓
Compare current UTC time to allowed window
     ↓
If outside window and no emergency flag, exit safely
     ↓
If inside window, continue to snapshot and patch
     ↓
Record decision in JSON
```

### Example window policy JSON

```json
{
  "timezone": "UTC",
  "windows": [
    {
      "name": "standard-security-window",
      "days": ["Tue", "Thu"],
      "start": "22:00",
      "end": "23:30"
    }
  ],
  "emergency_override_requires": ["operator", "reason", "ticket"]
}
```

### Script behavior

| Condition | Script action |
| --- | --- |
| Inside approved window | Continue |
| Outside window | Exit with no changes |
| Emergency flag missing metadata | Exit with no changes |
| Emergency flag complete | Continue and mark report as emergency |
| Dry run mode | Produce plan only, no changes |

## 11. Security-Only Patching

Security-only patching limits change scope. The goal is to apply fixes from the security pocket without pulling unrelated feature or stability updates unless required by dependencies.

### Safer patch commands

```bash
# Show security-related upgrades available from configured repositories
apt list --upgradable

# Simulate an upgrade before applying it
sudo apt-get -s upgrade

# Install or upgrade a specific package only
sudo apt-get install --only-upgrade openssh-server

# Use noninteractive mode carefully in scripts
sudo DEBIAN_FRONTEND=noninteractive apt-get install --only-upgrade -y openssh-server
```

### Package targeting rules

| Rule | Reason |
| --- | --- |
| Patch the smallest package set that resolves the CVE | Reduces blast radius |
| Simulate first with apt-get -s | Reveals dependency changes before touching the system |
| Record package plan before apply | Makes the change auditable |
| Avoid unattended broad upgrade for emergency CVEs | Emergency response should be targeted and validated |
| Verify fixed version after apply | Command success does not prove vulnerability resolution |

## 12. Validation After Patching

Validation proves the patch resolved the intended exposure and did not break critical function.

### Validation layers

| Layer | Question |
| --- | --- |
| **Package version** | Is the installed version at or above the distribution fixed version? |
| **CVE status** | Does the advisory or changelog show the CVE is fixed? |
| **Service health** | Is the service running and responding as expected? |
| **Loaded code** | Are old vulnerable binaries or libraries still mapped into running processes? |
| **Kernel state** | Is the running kernel the patched kernel after reboot? |
| **Configuration state** | Did critical config files drift unexpectedly? |
| **Logs** | Did post-install scripts, services, or package triggers fail? |

### Validation commands

```bash
# Confirm installed version
dpkg-query -W -f='${binary:Package}\t${Version}\n' openssh-server

# Check candidate and installed version
apt-cache policy openssh-server

# Search changelog for a CVE reference
apt-get changelog openssh-server | grep -i 'CVE-'

# Validate service state
systemctl is-active ssh
systemctl status ssh --no-pager

# Confirm running kernel
uname -r

# Identify processes holding deleted files or old libraries
sudo lsof | grep deleted
```

### Validation status values

| Status | Meaning |
| --- | --- |
| **fixed_verified** | Fixed version installed and service health checks passed |
| **fixed_pending_reboot** | Package installed but running kernel or loaded code still old |
| **partial** | Package updated but not all validation checks passed |
| **failed** | Package update or service validation failed |
| **not_applicable** | Package or CVE does not apply to the host |
| **unknown** | Evidence is insufficient |

## 13. Configuration Drift Detection

Patch operations can change configuration files, service files, package dependencies, and runtime behavior. Drift detection separates expected changes from surprises.

### What to baseline

| Baseline item | Example |
| --- | --- |
| **Package list** | dpkg-query output before and after |
| **Held packages** | apt-mark showhold |
| **Critical config hashes** | /etc/ssh/sshd_config, /etc/pam.d/*, /etc/sysctl.conf |
| **Service state** | systemctl is-enabled and is-active for critical services |
| **Listening ports** | ss -tulpn |
| **Kernel version** | uname -r and installed linux-image packages |
| **Repository files** | /etc/apt/sources.list and /etc/apt/sources.list.d/* |

### Drift workflow

```text
Capture baseline before patch
     ↓
Apply patch
     ↓
Capture same measurements after patch
     ↓
Diff baseline and post-state
     ↓
Classify expected, unexpected, or harmful
     ↓
Export drift findings
```

### Example drift status

| Drift type | Meaning | Action |
| --- | --- | --- |
| **Expected** | Package version changed as planned | Record as accepted |
| **Unexpected** | Config, service, or dependency changed outside plan | Investigate before closing |
| **Harmful** | Service broke, config reset, package removed | Roll back or remediate |
| **Pending** | Requires reboot or service restart to settle | Track until resolved |

## 14. Rollback and Pinning

Rollback is not one command. It is a plan for returning to a known-good state while preserving evidence of why the rollback happened.

### Rollback options

| Method | Use when | Risk |
| --- | --- | --- |
| **Snapshot restore** | Full-system regression and snapshot exists | May revert unrelated changes |
| **apt downgrade** | Specific package version caused the regression | Older version may be vulnerable |
| **apt-mark hold** | Prevent immediate re-upgrade of a bad package | Holds can block future security fixes |
| **APT pinning** | Force or prefer a specific version or repo | Bad priorities can freeze packages unexpectedly |
| **Config restore** | Patch changed config unexpectedly | Old config may not fit new binary |

### Downgrade and hold example

```bash
# Show available package versions
apt-cache policy openssh-server

# Install a specific previous version
sudo apt-get install openssh-server=1:9.6p1-3ubuntu13.5

# Hold package to prevent re-upgrade
sudo apt-mark hold openssh-server

# Confirm hold
apt-mark showhold
```

### APT preferences pin example

```text
Package: openssh-server
Pin: version 1:9.6p1-3ubuntu13.5
Pin-Priority: 1001
```

**Rollback warning:** downgrading a security patch may reopen the vulnerability you just closed. If rollback is necessary, pair it with compensating controls such as firewall restriction, service isolation, AppArmor confinement, or temporary service shutdown.

## 15. unattended-upgrades

unattended-upgrades can apply updates automatically, but production configuration should be explicit. Security-only updates, blacklist controls, logging, and reboot suppression are the safe baseline.

### Important files

| File or directory | Purpose |
| --- | --- |
| **/etc/apt/apt.conf.d/20auto-upgrades** | Controls whether package lists and unattended upgrades run |
| **/etc/apt/apt.conf.d/50unattended-upgrades** | Controls allowed origins, package blacklist, reboot behavior, and options |
| **/var/log/unattended-upgrades/** | Logs unattended-upgrades activity |
| **apt-daily.timer** | systemd timer for apt daily activity |
| **apt-daily-upgrade.timer** | systemd timer for unattended upgrade activity |

### Security-only baseline

```text
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
```

```text
Unattended-Upgrade::Allowed-Origins {
        "${distro_id}:${distro_codename}-security";
};

Unattended-Upgrade::Package-Blacklist {
        "linux-image*";
        "openssh-server";
};

Unattended-Upgrade::Automatic-Reboot "false";
```

### What to verify

Verify package presence, apt timer state, dry-run behavior, log output, and reboot settings before relying on automatic updates.

```bash
# Confirm unattended-upgrades is installed
dpkg -s unattended-upgrades

# Check apt timers
systemctl list-timers 'apt*'

# Run a dry run with debug output
sudo unattended-upgrade --dry-run --debug

# Inspect unattended-upgrades logs
ls -l /var/log/unattended-upgrades/

# Review reboot policy in the main configuration
grep -R "Automatic-Reboot" /etc/apt/apt.conf.d/50unattended-upgrades
```

**Production rule:** automatic security patching is useful for routine exposure reduction, not a replacement for emergency vulnerability response, explicit validation, or rollback planning.

## 16. Structured JSON Artifacts

The pipeline should emit structured data every time it runs. JSON makes the output searchable, comparable, and suitable for dashboards or later SOC and compliance handoff.

### Required artifacts

| Artifact | Purpose |
| --- | --- |
| **inventory.json** | Installed packages, versions, holds, repositories, services |
| **exposure_report.json** | CVE-to-host and CVE-to-package assessment |
| **patch_plan.json** | Proposed package changes before applying them |
| **prechange_snapshot.json** | Baseline state and hashes before patching |
| **change_log.json** | What changed, when, by whom, and with what result |
| **validation_report.json** | Proof that the vulnerability is fixed and services work |
| **drift_report.json** | Expected and unexpected differences after patching |
| **rollback_report.json** | Rollback action and residual risk, if rollback occurred |

### Minimum change-log fields

| Field | Purpose |
| --- | --- |
| **timestamp_utc** | Normalized event time |
| **host** | System changed |
| **operator** | User or automation identity |
| **action** | inventory, repair, patch, validate, rollback, hold, pin |
| **package** | Package affected |
| **from_version** | Version before change |
| **to_version** | Version after change |
| **cve_ids** | CVEs connected to the action |
| **outcome** | success, failed, partial, skipped, rolled_back |
| **evidence_pointer** | Log file, command output, or artifact reference |

### Example validation JSON

```json
{
  "timestamp_utc": "2026-08-18T15:00:00Z",
  "host": "linux-server-01",
  "package": "openssh-server",
  "cve_id": "CVE-YYYY-NNNN",
  "installed_version": "1:9.6p1-3ubuntu13.6",
  "fixed_version": "1:9.6p1-3ubuntu13.6",
  "validation_status": "fixed_verified",
  "service_checks": [
    {
      "service": "ssh",
      "status": "active"
    }
  ],
  "reboot_required": false,
  "operator": "patch-pipeline"
}
```

## 17. End-to-End Patch Pipeline

The pipeline is the engine underneath change management. It should be safe to run repeatedly and should produce useful output even when it refuses to patch.

### Pipeline stages

| Stage | Input | Output |
| --- | --- | --- |
| **Inventory** | Host state | inventory.json |
| **Assess** | CVEs, package data, advisories | exposure_report.json |
| **Plan** | Exposure and package candidates | patch_plan.json |
| **Preflight** | System health checks | preflight_report.json |
| **Snapshot** | Package state, configs, services | prechange_snapshot.json |
| **Apply** | Approved package plan | change_log.json |
| **Validate** | Fixed versions and services | validation_report.json |
| **Drift** | Before and after state | drift_report.json |
| **Rollback** | Failure or regression | rollback_report.json |
| **Summarize** | All artifacts | patch_summary.json |

### Idempotent behavior

| Situation | Correct pipeline behavior |
| --- | --- |
| Package already fixed | Skip patch, emit fixed evidence |
| Host not affected | Mark not_applicable |
| Outside maintenance window | Exit with no changes and explain why |
| Broken dpkg state | Repair first or exit safely if repair fails |
| Held vulnerable package | Flag as blocked and require decision |
| Patch applied but reboot pending | Mark fixed_pending_reboot |
| Validation fails | Stop, preserve evidence, invoke rollback path |

### Final success condition

```text
Affected host identified
     ↓
Correct package fixed
     ↓
Service still healthy
     ↓
No harmful drift
     ↓
Evidence exported
     ↓
Rollback path documented
```

## 18. Professional Judgment

Patching is not simply "always upgrade everything immediately." It is risk reduction under operational constraints.

**Apply immediately when** exploitation is active, exposure is reachable, impact is high, and the patch or mitigation is viable.

**Defer only when** the operational risk is greater than the vulnerability risk, and the deferral has an owner, compensating control, and review date.

| Field | Records |
| --- | --- |
| **Risk** | Vulnerability and exposure that remain |
| **Reason** | Why the patch cannot be applied now |
| **Compensating control** | Firewall rule, service isolation, AppArmor, monitoring, or shutdown |
| **Owner** | Person accepting the temporary risk |
| **Review date** | When the exception expires |
| **Rollback plan** | How to recover if the eventual patch breaks |

A skipped patch is a managed risk decision only if it is recorded, owned, time-limited, and compensated. Otherwise, it is just invisible exposure.

## 19. Framework and Tool Map

| Item | Purpose |
| --- | --- |
| **NIST SP 800-40 Rev. 4** | Enterprise patch management planning reference |
| **CISA KEV** | Known exploited vulnerability prioritization input |
| **NVD** | CVE and vulnerability metadata source |
| **Ubuntu Security Notices** | Distribution-specific CVE-to-package mapping |
| **apt / apt-get** | Package installation, upgrade, simulation, and repair |
| **dpkg / dpkg-query** | Package database state and installed package inventory |
| **apt-get changelog** | Package changelog and CVE fix evidence |
| **apt-mark** | Holds and package selection state |
| **apt preferences** | Version pinning and downgrade control |
| **unattended-upgrades** | Automatic security update mechanism |
| **needrestart** | Identifies services or sessions needing restart after library updates |
| **JSON** | Structured evidence format for repeatable reporting |

## 20. Fast Recall

- **Patch management is engineering, not housekeeping.** Inventory, snapshot, patch, validate, export.
- **Command success is not proof.** Prove the fixed version, service health, loaded code state, and drift status.
- **Raw CVSS is incomplete.** Prioritize with KEV, exploit availability, asset criticality, exposure, and patch risk.
- **Security patches, feature updates, kernel updates, and library updates have different rollback profiles.** Treat them differently.
- **APT resolves dependencies. dpkg records and configures packages.** Broken dpkg state must be repaired before patching.
- **Never remove apt or dpkg locks blindly.** First prove no package process is active.
- **Use apt-get -s before applying changes.** Simulate the plan.
- **Use targeted upgrades for emergency CVEs.** Avoid broad unattended upgrades during incident response.
- **Kernel patches require reboot validation.** Installed package does not equal running kernel.
- **Library patches may require service restarts.** Old code can stay mapped in memory.
- **unattended-upgrades should be security-focused by default.** Suppress automatic reboots unless tested.
- **Rollback can reintroduce exposure.** Pair rollback with compensating controls.
- **apt-mark hold is powerful and dangerous.** Holds can block future security fixes.
- **Every run should emit JSON.** The answer to "are we vulnerable?" should come from evidence.
- **A deferred patch needs owner, reason, compensating control, and review date.** Silent deferral is unmanaged risk.

## 21. Resources

**Patch management**
- [NIST SP 800-40 Rev. 4: Guide to Enterprise Patch Management Planning](https://csrc.nist.gov/pubs/sp/800/40/r4/final)
- [CISA Known Exploited Vulnerabilities Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)
- [NVD CVE Data Feeds](https://nvd.nist.gov/vuln/data-feeds)

**Ubuntu and Debian security**
- [Ubuntu Security Notices](https://ubuntu.com/security/notices)
- [Ubuntu CVE Tracker](https://ubuntu.com/security/cves)
- [Debian Security Tracker](https://security-tracker.debian.org/tracker/)

**APT, dpkg, and unattended upgrades**
- [Ubuntu Server Docs: Automatic updates](https://ubuntu.com/server/docs/how-to/software/automatic-updates/)
- [Debian manpage: apt_preferences](https://manpages.debian.org/bookworm/apt/apt_preferences.5.en.html)
- [Debian Administrator's Handbook: Debian Package Management](https://www.debian.org/doc/manuals/debian-handbook/debian-packaging-system.en.html)

**Man or help**
```text
man apt
man apt-get
man apt-mark
man apt_preferences
man dpkg
man dpkg-query
man unattended-upgrades
man needrestart
```
