# Linux System Hardening

> **⚠️ AUTHORIZED USE ONLY.** This material is for education and authorized system administration. Apply hardening only to systems you own or are explicitly authorized to change. Several controls here (disabling password auth, default-deny firewalls, AppArmor enforce mode) can lock you out or break services if applied without testing. Always keep a working access path open and validate on a non-production system first. See the Legal and Terms of Use page.

> **Scope:** Hardening Linux servers with CIS-based controls, automation, and measurable improvement. This sheet explains not just what to set but why, and how to decide what to skip.

## Table of Contents

- [Core Concepts](#core-concepts)
- [CIS Benchmarks](#cis-benchmarks)
- [Hardening Methodology](#hardening-methodology)
- [SSH Hardening](#ssh-hardening)
- [Kernel Hardening with sysctl](#kernel-hardening-with-sysctl)
- [Filesystem Security](#filesystem-security)
- [PAM and Authentication](#pam-and-authentication)
- [AppArmor](#apparmor)
- [auditd](#auditd)
- [Logging and rsyslog](#logging-and-rsyslog)
- [Host Firewall](#host-firewall)
- [Lynis](#lynis)
- [Idempotent Hardening Scripts](#idempotent-hardening-scripts)
- [JSON Output Standards](#json-output-standards)
- [The Master Hardening Pipeline](#the-master-hardening-pipeline)
- [Professional Judgment](#professional-judgment)
- [Framework and Tool Map](#framework-and-tool-map)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Concepts

| Term                     | Meaning                                                                        |
| ------------------------ | ------------------------------------------------------------------------------ |
| **Hardening**            | Reducing a system's attack surface by removing or securing anything not needed |
| **Attack surface**       | The reachable, exploitable functionality an attacker can target                |
| **Baseline**             | The approved, known-good secure configuration for a system                     |
| **CIS Benchmark**        | A prioritized, consensus set of secure configuration recommendations           |
| **Idempotent script**    | A script that produces the same result whether run once or many times          |
| **Compensating control** | An alternative safeguard used when the ideal control cannot be applied         |
| **Least privilege**      | Granting the minimum access required to do the job                             |
| **Defense in depth**     | Layering controls so one failure does not mean full compromise                 |

**The core idea:** attackers rarely need a zero-day. They need a default SSH config, an unnecessary running service, and a missing audit trail. Hardening is the unglamorous work of removing those easy wins. The methodology learned on Linux transfers directly to Windows, firewalls, and network devices.

## 2. CIS Benchmarks

A **CIS Benchmark** is a prioritized set of secure configuration recommendations for a specific technology, maintained by consensus and used as an industry baseline. The Ubuntu benchmark alone runs to hundreds of pages.

### How a benchmark is structured

Benchmarks are organized into sections, typically covering: initial setup, services, network configuration, logging and auditing, access control, authentication, and system maintenance. Each recommendation carries a rationale, the audit steps to check compliance, and the remediation steps to fix it.

### Levels and profiles

Recommendations are grouped into levels:

| Level       | Meaning                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| **Level 1** | Practical, broadly safe hardening with minimal operational impact         |
| **Level 2** | Defense-in-depth for high-security environments, may affect functionality |

Level 1 is the sensible default for most servers. Level 2 suits systems where security outweighs convenience, such as a log collection host.

### The rule that matters most

**Do not blindly implement every recommendation.** A benchmark is guidance applied with judgment, not law. Each control is a decision:

```text
Security Benefit + Operational Impact + Threat Model = Decision
```

A control that greatly reduces risk with no operational cost is an easy yes. One that breaks a clinical application to close a low risk is a candidate to skip with a documented compensating control. Blind compliance can break production; blind non-compliance leaves easy wins. Judgment is the skill being trained.

## 3. Hardening Methodology

Hardening is a repeatable cycle, not a one-time pass.

```text
Audit           measure the current state
 ↓
Identify Gaps   compare against the baseline
 ↓
Prioritize      rank by risk and threat model
 ↓
Automate        script the changes idempotently
 ↓
Validate        confirm the changes worked and broke nothing
 ↓
Measure         quantify the improvement (Lynis delta)
 ↓
Maintain        re-run and re-audit as the system changes
```

**Where to focus first,** in order of return on effort:

1. **Internet-facing services:** the reachable attack surface an outside attacker hits first.
2. **Authentication controls:** SSH, passwords, and lockout, the front door.
3. **Logging and detection:** so a compromise is visible rather than silent.
4. **Privilege escalation paths:** SUID binaries, sudo, and kernel exposure.
5. **Recovery capability:** backups and the ability to rebuild.

The logic is to reduce the most exposed risk soonest, then ensure that anything that does happen is detected, then limit how far it can spread.

## 4. SSH Hardening

SSH is the primary remote access path and the most attacked service on most servers. Hardening it closes off password spraying, credential stuffing, and brute force.

### Required controls

Disable root login, disable password authentication, enforce key-based authentication, limit which users may connect, set an idle timeout, enable logging, and enforce protocol 2 only.

### Secure sshd_config settings

```bash
# /etc/ssh/sshd_config
PermitRootLogin no              # no direct root login, use a user then sudo
PasswordAuthentication no       # keys only, defeats password guessing
PubkeyAuthentication yes        # enable key authentication
MaxAuthTries 4                  # limit guesses per connection
ClientAliveInterval 300         # disconnect idle sessions after 300s
ClientAliveCountMax 0           # no keepalive grace, drop on timeout
AllowUsers admin deploy         # allow-list specific users only
Protocol 2                      # modern protocol only
X11Forwarding no                # disable unless explicitly needed
LoginGraceTime 30               # short window to authenticate
```

Apply and validate:

```bash
sshd -t                         # test the config for syntax errors FIRST
systemctl restart ssh           # apply (Ubuntu service is 'ssh')
```

> **Lockout warning:** before disabling password authentication, confirm your key-based login works in a separate session. Test with `sshd -t`, and keep an existing session open while you apply changes. Losing SSH on a remote server can mean losing access entirely.

### Risk reduced

Password spraying, credential stuffing, and brute-force attacks all depend on password authentication being available. Key-only authentication removes the entire class.

## 5. Kernel Hardening with sysctl

`sysctl` tunes kernel parameters at runtime. A handful of settings meaningfully harden the network stack and memory model.

### Key protections

```bash
# /etc/sysctl.d/99-hardening.conf
net.ipv4.tcp_syncookies = 1              # mitigate SYN flood attacks
net.ipv4.conf.all.accept_redirects = 0   # ignore ICMP redirects
net.ipv4.conf.all.send_redirects = 0     # do not send ICMP redirects
net.ipv4.conf.all.accept_source_route = 0 # reject source-routed packets
net.ipv4.ip_forward = 0                  # not a router, disable forwarding
net.ipv4.conf.all.rp_filter = 1          # reverse-path filtering, anti-spoof
kernel.randomize_va_space = 2            # full ASLR
fs.suid_dumpable = 0                     # no core dumps from SUID programs
kernel.kptr_restrict = 2                 # hide kernel pointers from userspace
```

Apply:

```bash
sysctl --system                 # reload all sysctl config files
sysctl -a | grep syncookies     # verify a specific value took effect
```

### What each protection does

| Setting                   | Reduces                                        |
| ------------------------- | ---------------------------------------------- |
| **SYN cookies**           | SYN flood denial of service                    |
| **Redirect disable**      | Traffic manipulation via forged ICMP redirects |
| **Source route reject**   | Attacker-controlled packet routing             |
| **IP forward disable**    | The host being abused to route traffic         |
| **Reverse-path filter**   | IP address spoofing                            |
| **ASLR**                  | Reliable memory-corruption exploitation        |
| **Core dump restriction** | Leakage of sensitive data via crash dumps      |

**Context matters:** `ip_forward = 0` is correct for a normal server but wrong for a machine that is deliberately a router or runs certain container networking. This is a live example of judgment: verify the role before applying.

## 6. Filesystem Security

The filesystem holds two common privilege-escalation paths: dangerous SUID/SGID binaries and writable locations. Both should be audited and constrained.

### What to review

- **SUID and SGID binaries:** programs that run with the owner's or group's privileges, a classic escalation route if unnecessary ones are left in place.
- **World-writable files:** anything any user can modify.
- **Mount options:** how filesystems are mounted affects what can run from them.

### Finding the risks

```bash
# Find all SUID binaries
find / -perm -4000 -type f 2>/dev/null

# Find all SGID binaries
find / -perm -2000 -type f 2>/dev/null

# Find world-writable files
find / -xdev -type f -perm -0002 2>/dev/null

# Find world-writable directories without the sticky bit
find / -xdev -type d -perm -0002 ! -perm -1000 2>/dev/null
```

Remove the SUID bit from a binary that does not need it:

```bash
chmod u-s /path/to/binary
```

### High-value mount options

Applied to writable, non-system partitions to limit what can happen there:

| Option     | Effect                                          |
| ---------- | ----------------------------------------------- |
| **noexec** | No binaries can be executed from the filesystem |
| **nosuid** | SUID and SGID bits are ignored                  |
| **nodev**  | Device files are not interpreted                |

**Typical targets** are the temporary and shared-memory paths, where executables should never run:

```text
/tmp        noexec, nosuid, nodev
/var/tmp    noexec, nosuid, nodev
/dev/shm    noexec, nosuid, nodev
```

Applying `noexec` to `/tmp` blocks a common attacker pattern: dropping a payload in a world-writable temp directory and running it.

## 7. PAM and Authentication

PAM (Pluggable Authentication Modules) enforces password quality and account lockout, hardening the login process itself.

### Password quality with pam_pwquality

Enforces strength requirements: a minimum length, character complexity, password history to prevent reuse, and dictionary resistance to reject common words.

```text
# /etc/security/pwquality.conf
minlen = 14          # minimum length
dcredit = -1         # at least one digit
ucredit = -1         # at least one uppercase
lcredit = -1         # at least one lowercase
ocredit = -1         # at least one special character
dictcheck = 1        # reject dictionary words
```

### Account lockout with pam_faillock

Locks an account after repeated failed attempts, slowing brute force to a crawl.

```text
# example policy
deny = 5             # lock after 5 failed attempts
unlock_time = 900    # stay locked for 900 seconds (15 minutes)
```

### Benefits

Together these reduce brute-force and password-guessing risk. Quality rules make each password harder to guess; lockout limits how many guesses an attacker gets. Note the operational trade-off: aggressive lockout can enable denial of service by deliberately locking legitimate accounts, so tune the threshold to the environment.

## 8. AppArmor

AppArmor confines a program to a defined set of capabilities, so that compromising one service does not hand the attacker the whole server. It is Ubuntu's default mandatory access control system.

### Modes

| Mode         | Behavior                                                              |
| ------------ | --------------------------------------------------------------------- |
| **Complain** | Permits actions but logs violations, used to build and test a profile |
| **Enforce**  | Blocks any action outside the profile                                 |

The safe rollout is complain first, review the logs to confirm the profile does not break legitimate behavior, then switch to enforce.

### Working with profiles

```bash
aa-status                       # show profiles and their modes
aa-enforce /etc/apparmor.d/usr.sbin.apache2   # put a profile in enforce
aa-complain /etc/apparmor.d/usr.sbin.mysqld   # put a profile in complain
apparmor_parser -r /etc/apparmor.d/profile    # reload a profile
```

### What to confine

The exposed, internet-reachable services first: Apache, Nginx, MySQL, and any custom application service. These are the processes most likely to be compromised, so confining them contains the blast radius.

**The goal:** compromise of one service should not equal compromise of the server. AppArmor is the layer that enforces that boundary.

## 9. auditd

auditd is the Linux audit daemon. It records security-relevant events, creating the forensic trail that turns a silent compromise into a visible, investigable one. On a log host especially, this evidence is the point.

### What it captures

Privilege escalation, account changes, security policy changes, and access to sensitive files. Without it, an attacker who gains access may leave no trace.

### Monitoring sensitive files

```bash
# /etc/audit/rules.d/hardening.rules
-w /etc/passwd -p wa -k identity        # watch writes/attribute changes
-w /etc/shadow -p wa -k identity
-w /etc/sudoers -p wa -k privilege
-w /etc/sudoers.d/ -p wa -k privilege
-w /etc/ssh/sshd_config -p wa -k sshd
-a always,exit -F arch=b64 -S execve -F euid=0 -k root_cmd   # log root commands
```

The `-w` watches a path, `-p wa` triggers on write and attribute changes, and `-k` tags events with a searchable key.

### Managing auditd

```bash
auditctl -l                     # list active rules
augenrules --load               # load rules from rules.d
ausearch -k identity            # search events by key
aureport --summary              # summary report
```

**Security value:** auditd creates evidence. If the audit trail is intact, you can reconstruct what happened. This is exactly why a log server must be the most hardened machine in the environment: if the attacker can erase the evidence, the trail is worthless.

## 10. Logging and rsyslog

rsyslog collects, structures, and forwards logs. Good logging serves four goals: centralization (logs gathered in one place), retention (kept long enough to investigate), integrity (protected from tampering), and searchability (structured for analysis).

### Sources worth collecting

SSH, sudo, auditd, the kernel, and application services. Together these cover authentication, privilege use, system-level events, and service behavior.

### Centralized forwarding

```bash
# /etc/rsyslog.d/forward.conf
# forward all logs to a central log host over TCP
*.* @@log-host.internal:514
```

The `@@` denotes TCP (more reliable than the single-`@` UDP). Centralizing to a hardened log host means an attacker who compromises one server cannot quietly delete its logs, since a copy already left the machine.

### Log rotation

`logrotate` prevents logs from filling the disk while preserving retention.

```bash
# /etc/logrotate.d/custom
/var/log/custom/*.log {
    weekly
    rotate 12          # keep 12 weeks
    compress
    missingok
    notifempty
}
```

Rotation protects against two failures at once: disk exhaustion from logs that grow forever, and loss of history from logs discarded too soon.

## 11. Host Firewall

A host firewall enforces a default-deny posture, so only explicitly permitted traffic reaches the server. This is defense in depth: even if a network firewall is misconfigured, the host protects itself.

### The default strategy

```text
Default Deny Inbound        block everything not explicitly allowed
Default Allow Outbound      permit the server's own outbound needs
Allow Required Services Only  open only the ports the role requires
```

### Scoping ports to the server's role

Only the ports a server actually needs should be open. A role-based example:

| Server role | Required inbound                                 |
| ----------- | ------------------------------------------------ |
| Billing     | SSH, HTTPS, MySQL (restricted to app hosts only) |
| Web         | HTTPS, SSH                                       |
| Log         | SSH, Syslog                                      |

Note that MySQL is not open to the world but restricted to the specific hosts that need it. A database port open to the internet is a frequent, serious exposure.

### UFW workflow

```bash
ufw default deny incoming       # default-deny inbound
ufw default allow outgoing      # allow outbound
ufw allow 22/tcp                # SSH
ufw allow 443/tcp               # HTTPS
ufw allow from 10.0.0.5 to any port 3306   # MySQL from one host only
ufw logging on                  # enable logging
ufw enable                      # activate
ufw status verbose              # validate the ruleset
```

> **Lockout warning:** allow SSH _before_ enabling the firewall, or you will drop your own remote connection the moment it activates.

## 12. Lynis

Lynis audits a system's security posture and produces a measurable score, which is how you prove the system is harder to break than it was yesterday.

### Running an audit

```bash
lynis audit system              # full system audit
lynis audit system --quick      # non-interactive
lynis show details              # detailed findings
```

### Key outputs

| Output              | Meaning                                    |
| ------------------- | ------------------------------------------ |
| **Warnings**        | Higher-priority issues to address          |
| **Suggestions**     | Recommended improvements                   |
| **Hardening Index** | A single 0 to 100 score of overall posture |

The report and machine-readable data are written to `/var/log/lynis.log` and `/var/log/lynis-report.dat`, the latter being what a script parses to extract the score.

### Measuring the delta

The point is the before-and-after. Audit first to capture the baseline index, apply the hardening, then audit again. A typical goal is raising the hardening index from around 50 on a default install to above 80. That number, before versus after, is the objective evidence that the hardening worked.

```bash
grep "hardening_index" /var/log/lynis-report.dat   # extract the score programmatically
```

## 13. Idempotent Hardening Scripts

Automation is only safe if it is idempotent: running it twice does no harm and produces the same end state. A script that appends a setting every time it runs will corrupt a config file by the third run.

### The rules

A hardening script must check before it changes, handle re-runs safely, produce a consistent result every time, and log what it did.

### The core pattern

Check whether the desired state already exists, update it if present, add it if not, rather than blindly appending.

```bash
# idempotent: ensure a setting exists exactly once with the right value
set_config() {
    local key="$1" value="$2" file="$3"
    if grep -qE "^\s*${key}\b" "$file"; then
        sed -i "s|^\s*${key}.*|${key} ${value}|" "$file"   # update in place
    else
        echo "${key} ${value}" >> "$file"                  # add if missing
    fi
}

set_config "PermitRootLogin" "no" /etc/ssh/sshd_config
```

### What to avoid

Duplicate entries from blind appending, interactive prompts that block automation, and hardcoded assumptions about the system's starting state. Each of these breaks the "run it anywhere, any number of times" property that makes automation trustworthy.

## 14. JSON Output Standards

Every hardening action should emit structured output, so results can be collected, validated, and fed into a pipeline rather than read by eye.

```json
{
  "control": "ssh_password_auth",
  "status": "remediated",
  "result": "success",
  "timestamp": "2026-01-15T10:30:00Z",
  "detail": "PasswordAuthentication set to no"
}
```

### Why structured output

| Advantage                | Benefit                                         |
| ------------------------ | ----------------------------------------------- |
| **Automation**           | Machines can parse and act on results           |
| **Reporting**            | Roll many controls into one status summary      |
| **Validation**           | Confirm each control reached its intended state |
| **Pipeline integration** | Feed results between stages programmatically    |

A useful convention is a consistent status vocabulary, for example `remediated`, `already_compliant`, `skipped`, or `failed`, so the pipeline can count outcomes and flag anything that needs attention.

## 15. The Master Hardening Pipeline

The end goal is a single script that takes a server from default to production-ready in one execution, in minutes rather than hours. Ordering matters.

```text
Pre-Audit            capture the baseline Lynis score
 ↓
Package Updates      patch known vulnerabilities first
 ↓
SSH Hardening        secure remote access
 ↓
Kernel Hardening     apply sysctl protections
 ↓
Filesystem Controls  SUID audit, mount options
 ↓
PAM Controls         password quality and lockout
 ↓
AppArmor             confine exposed services
 ↓
auditd               enable the audit trail
 ↓
Firewall             default-deny, allow required
 ↓
Logging              rsyslog and rotation
 ↓
Post-Audit           capture the new Lynis score
 ↓
JSON Summary         report the delta and per-control results
```

**Why this order:** patch first so you are hardening a current system. Secure access early. Apply the deeper controls in the middle. Enable the firewall late, once required services are known, so it does not block a step. Audit at both ends to measure the delta.

### Success criteria

A higher Lynis score than the baseline, a demonstrably reduced attack surface, and reusable automation that can harden the next server in minutes. The script itself is the deliverable, not a report about it.

## 16. Professional Judgment

The objectives stress this above blind compliance: not every CIS recommendation should be implemented, and knowing what to skip is as important as knowing what to apply.

### When to apply a control

- The risk it addresses is high.
- The operational impact is low.
- It clearly reduces a threat in the environment's threat model.

### When to skip a control

- It would break a clinical or business-critical operation.
- It conflicts with a documented vendor requirement.
- A better compensating control already addresses the risk.

### Documenting a skip

A skipped control is a decision that must be recorded, not a silent omission. Document four things:

| Field                   | Records                                                |
| ----------------------- | ------------------------------------------------------ |
| **Risk**                | What exposure remains by not applying the control      |
| **Reason**              | Why it was skipped (operational, vendor, compensating) |
| **Alternative control** | What compensating measure covers the risk instead      |
| **Approval**            | Who signed off on accepting the residual risk          |

This is the same discipline as risk acceptance: a documented, owned decision rather than an unexplained gap. Balancing hardening against operational requirements, and recording the trade-offs, is what distinguishes professional hardening from mechanical checklist-following.

## 17. Framework and Tool Map

| Item                | Purpose                                               |
| ------------------- | ----------------------------------------------------- |
| **CIS Benchmark**   | The secure configuration baseline and recommendations |
| **NIST SP 800-123** | General server security and hardening guidance        |
| **AppArmor**        | Mandatory access control, application confinement     |
| **auditd**          | Security event auditing and the forensic trail        |
| **rsyslog**         | Log collection, structuring, and forwarding           |
| **logrotate**       | Log retention and disk protection                     |
| **Lynis**           | Hardening assessment and scoring                      |
| **UFW**             | Host firewall front end                               |
| **PAM**             | Authentication policy: password quality and lockout   |
| **sysctl**          | Kernel parameter tuning                               |

## 18. Fast Recall

- **Hardening reduces attack surface** by removing the easy wins attackers depend on: default configs, unnecessary services, missing logs.
- **CIS Benchmarks are guidance, not law.** Decide with security benefit plus operational impact plus threat model.
- **SSH should be key-only:** disable root login, disable password auth, limit users, set idle timeout. Test with `sshd -t` and keep a session open.
- **sysctl protections:** SYN cookies, disable ICMP redirects, disable IP forwarding, full ASLR (`kernel.randomize_va_space = 2`), no SUID core dumps.
- **Audit SUID/SGID binaries** with `find / -perm -4000`, and mount `/tmp`, `/var/tmp`, `/dev/shm` with noexec, nosuid, nodev.
- **PAM:** pam_pwquality for password strength, pam_faillock for lockout after failed attempts.
- **AppArmor** confines services so one compromise is not full compromise. Complain mode to build, enforce mode to protect.
- **auditd creates the forensic trail.** Watch /etc/passwd, /etc/shadow, /etc/sudoers, and sshd_config.
- **Centralize logs** to a hardened log host so an attacker cannot delete local evidence. Rotate to protect disk and retention.
- **Host firewall is default-deny inbound,** allow only required ports. Allow SSH before enabling, or you lock yourself out.
- **Lynis measures the delta.** Audit before, harden, audit after. Target the hardening index from ~50 to 80+.
- **Scripts must be idempotent:** check before changing, safe to re-run, no blind appends, no interactive prompts.
- **Emit structured JSON** per control so results feed a pipeline.
- **The pipeline order:** pre-audit, update, SSH, kernel, filesystem, PAM, AppArmor, auditd, firewall, logging, post-audit, JSON summary.
- **The log server must be the most hardened machine,** because if it falls, the evidence falls with it.
- **Skipping a control is a documented decision:** record the risk, reason, compensating control, and approval.

## 19. Resources

**Benchmarks and standards**

- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks)
- [CIS Ubuntu Linux Benchmarks](https://www.cisecurity.org/benchmark/ubuntu_linux)
- [NIST SP 800-123, Guide to General Server Security](https://csrc.nist.gov/pubs/sp/800/123/final)

**Tool documentation**

- [Linux Audit (auditd) documentation](https://github.com/linux-audit/audit-documentation/wiki)
- [AppArmor wiki](https://gitlab.com/apparmor/apparmor/-/wikis/home)
- [Lynis (CISOfy)](https://cisofy.com/lynis/)
- [rsyslog documentation](https://www.rsyslog.com/doc/)
- [UFW documentation](https://help.ubuntu.com/community/UFW)

**Manual pages**

- `man sshd_config`, `man sysctl`, `man sysctl.conf`
- `man pam_pwquality`, `man pam_faillock`
- `man auditd`, `man auditctl`, `man ausearch`
- `man aa-status`, `man aa-enforce`
- `man lynis`, `man rsyslog.conf`, `man ufw`, `man logrotate`
