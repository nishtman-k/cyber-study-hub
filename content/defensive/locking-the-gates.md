# Locking the Gates

> **Scope:** Hardening Linux servers using CIS-inspired controls, automation, and measurable security improvements.

---

## Table of Contents
- [Core Concepts](#core-concepts)
- [CIS Benchmarks](#cis-benchmarks)
- [Hardening Methodology](#hardening-methodology)
- [SSH Hardening](#ssh-hardening)
- [Kernel Hardening (sysctl)](#kernel-hardening-sysctl)
- [Filesystem Security](#filesystem-security)
- [PAM & Authentication](#pam-authentication)
- [AppArmor](#apparmor)
- [auditd](#auditd)
- [Logging & rsyslog](#logging-rsyslog)
- [Host Firewalls](#host-firewall)
- [Lynis](#lynis)
- [Idempotent Hardening Scripts](#idempotent-hardening-scripts)
- [JSON Output Standards](#json-output-standards)
- [Master Hardening Pipeline](#master-hardening-pipeline)
- [Professional Judgment](#professional-judgment)
- [Framework Quick Map](#framework-quick-map)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Concepts

| Term | Meaning |
|------|---------|
| Hardening | Reducing attack surface |
| Baseline | Approved secure configuration |
| CIS Benchmark | Security configuration guidance |
| Idempotent Script | Safe to run repeatedly |
| Compensating Control | Alternative risk reduction |
| Attack Surface | Reachable and exploitable functionality |
| Principle of Least Privilege | Minimum required access |
| Defense in Depth | Multiple security layers |

**Goal:** Remove attacker easy wins.

## 2. CIS Benchmarks

A CIS Benchmark is a prioritized set of secure configuration recommendations.

### Benchmark Structure

- Initial Setup
- Services
- Network Configuration
- Logging and Auditing
- Access Control
- Authentication
- System Maintenance

### Important Rule

Do not blindly implement every recommendation.

Use:

Security Benefit + Operational Impact + Threat Model = Decision

## 3. Hardening Methodology

```text
Audit
 ↓
Identify Gaps
 ↓
Prioritize
 ↓
Automate
 ↓
Validate
 ↓
Measure
 ↓
Maintain
```

Focus first on:

1. Internet-facing services
2. Authentication controls
3. Logging and detection
4. Privilege escalation paths
5. Recovery capability

## 4. SSH Hardening

### Required Controls

- Disable root login
- Disable password authentication
- Enforce key authentication
- Limit allowed users/groups
- Configure idle timeout
- Enable logging
- Use Protocol 2 only

### Secure Settings

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 4
ClientAliveInterval 300
ClientAliveCountMax 0
```

### Risk Reduced

- Password spraying
- Credential stuffing
- Brute force attacks

## 5. Kernel Hardening (sysctl)

### Key Protections

```text
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.ip_forward = 0
kernel.randomize_va_space = 2
fs.suid_dumpable = 0
```

### Purpose

| Setting | Reduces |
|----------|---------|
| SYN Cookies | SYN floods |
| Redirect Disable | Traffic manipulation |
| IP Forward Disable | Unwanted routing |
| ASLR | Memory exploitation |
| Core Dump Restrictions | Information leakage |

## 6. Filesystem Security

### Review

- SUID binaries
- SGID binaries
- World-writable files
- Mount options

### High-Value Mount Options

```text
nodev
nosuid
noexec
```

### Typical Targets

```text
/tmp
/var/tmp
/dev/shm
```

## 7. PAM & Authentication

### Password Quality

Use pam_pwquality.

Requirements:

- Minimum length
- Complexity
- Password history
- Dictionary resistance

### Account Lockout

Use pam_faillock.

Example Policy:

- 5 failed attempts
- 15-minute lockout

### Benefits

- Reduces brute force risk
- Slows password guessing

## 8. AppArmor

### Modes

| Mode | Behavior |
|--------|----------|
| Complain | Logs violations |
| Enforce | Blocks violations |

### Protect

- Apache
- Nginx
- MySQL
- Custom services

### Goal

Compromise of one service should not equal compromise of the server.

## 9. auditd

### Why auditd Matters

Logs:

- Privilege escalation
- Account changes
- Policy changes
- File access events

### Monitor

```text
/etc/passwd
/etc/shadow
/etc/sudoers
/etc/ssh/
```

### Security Value

Creates evidence.

## 10. Logging & rsyslog

### Objectives

- Centralization
- Retention
- Integrity
- Searchability

### Log Sources

- SSH
- sudo
- auditd
- kernel
- services

### Log Rotation

Protects against:

- Disk exhaustion
- Missing retention

## 11. Host Firewall

### Default Strategy

```text
Default Deny Inbound
Default Allow Outbound
Allow Required Services Only
```

### Example Services

| Server | Required Ports |
|---------|---------------|
| Billing | SSH, HTTPS, MySQL (restricted) |
| Web | HTTPS, SSH |
| Log | SSH, Syslog |

### UFW Workflow

```text
Deny All
Allow Required
Enable Logging
Validate
```

## 12. Lynis

### Purpose

Measures security posture.

### Commands

```bash
lynis audit system
```

```bash
lynis show details
```

### Key Outputs

- Warnings
- Suggestions
- Hardening Index

### Project Goal

Increase hardening index from ~50 to 80+.

## 13. Idempotent Hardening Scripts

### Rules

Scripts must:

- Check before changing
- Handle re-runs safely
- Produce consistent results
- Log actions

### Good Pattern

```text
IF setting exists
   Update
ELSE
   Add
ENDIF
```

### Avoid

- Duplicate entries
- Interactive prompts
- Hardcoded assumptions

## 14. JSON Output Standards

Every script should produce structured results.

Example:

```json
{
  "control": "ssh_password_auth",
  "status": "remediated",
  "result": "success"
}
```

Advantages:

- Automation
- Reporting
- Validation
- Pipeline integration

## 15. Master Hardening Pipeline

### Recommended Sequence

```text
Pre-Audit
 ↓
Package Updates
 ↓
SSH Hardening
 ↓
Kernel Hardening
 ↓
Filesystem Controls
 ↓
PAM Controls
 ↓
AppArmor
 ↓
auditd
 ↓
Firewall
 ↓
Logging
 ↓
Post-Audit
 ↓
JSON Summary
```

### Success Criteria

- Higher Lynis score
- Reduced attack surface
- Reusable automation

## 16. Professional Judgment

Not every CIS recommendation should be implemented.

### Apply When

- High risk
- Low operational impact
- Clear threat reduction

### Skip When

- Breaks clinical operations
- Conflicts with vendor requirements
- Better compensating controls exist

### Document

- Risk
- Reason
- Alternative control
- Approval

## 17. Framework Quick Map

| Framework | Purpose |
|------------|---------|
| CIS Benchmark | Secure configuration baseline |
| NIST 800-123 | Server hardening guidance |
| AppArmor | Application confinement |
| auditd | Security auditing |
| rsyslog | Log management |
| Lynis | Hardening assessment |
| UFW | Host firewall |

## 18. Fast Recall

- Hardening reduces attack surface.
- CIS Benchmarks are guidance, not law.
- SSH should be key-only.
- Disable direct root login.
- Use ASLR and sysctl protections.
- Remove unnecessary SUID binaries.
- auditd provides forensic evidence.
- AppArmor limits service impact.
- Default-deny firewalls are preferred.
- Lynis measures improvement.
- Scripts must be idempotent.
- Automate everything repeatable.

## 19. Resources

- CIS Ubuntu 22.04 Benchmark
- CIS Benchmark Overview
- NIST SP 800-123
- Linux Audit System Documentation
- AppArmor Documentation
- man sshd_config
- man sysctl
- man pam_pwquality
- man pam_faillock
- man auditd
- man auditctl
- man aa-enforce
- man lynis
- man rsyslog.conf
- man ufw
