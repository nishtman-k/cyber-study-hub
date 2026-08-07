# Windows & Active Directory Hardening

> `Attackers don't hack in. They log in.` — Jen Easterly

> **⚠️ AUTHORIZED USE ONLY.** This material is for education and authorized system administration. Apply these controls only to systems you own or are explicitly authorized to administer. Several controls here (AppLocker enforce mode, firewall default-deny, Kerberos and authentication changes) can lock out users or break services if applied without testing. Validate in a lab or audit mode first, and keep a recovery path open. See the [Legal and Terms of Use](/legal) page.

> **Scope:** Securing Windows and Active Directory environments: AD and Group Policy, authentication and Kerberos hardening, auditing and event monitoring, Sysmon, PowerShell controls, AppLocker, Windows Firewall, SMB and RDP, service accounts, and domain controller protection.

---

## Table of Contents

- [Core Concepts](#core-concepts)
- [Active Directory Fundamentals](#active-directory-fundamentals)
- [Group Policy Fundamentals](#group-policy-fundamentals)
- [Windows Hardening Methodology](#windows-hardening-methodology)
- [Password and Authentication Hardening](#password-and-authentication-hardening)
- [Advanced Audit Policies](#advanced-audit-policies)
- [Critical Windows Event IDs](#critical-windows-event-ids)
- [Sysmon](#sysmon)
- [PowerShell Security Controls](#powershell-security-controls)
- [Application Control: AppLocker and WDAC](#application-control-applocker-and-wdac)
- [Windows Firewall](#windows-firewall)
- [SMB and RDP Hardening](#smb-and-rdp-hardening)
- [Service Account Security](#service-account-security)
- [Domain Controller Protection](#domain-controller-protection)
- [PowerShell Validation](#powershell-validation)
- [Defending the AD Attack Chain](#defending-the-ad-attack-chain)
- [Professional Judgment](#professional-judgment)
- [Framework and Tool Map](#framework-and-tool-map)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Concepts

| Term                       | Meaning                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| **Active Directory (AD)**  | The centralized directory that handles authentication and authorization across a Windows domain |
| **Domain Controller (DC)** | A server that runs AD and authenticates users and computers                                     |
| **Group Policy (GPO)**     | Centralized configuration and security management pushed to domain-joined machines              |
| **Kerberos**               | The default Windows domain authentication protocol, based on tickets                            |
| **Sysmon**                 | A system monitoring tool providing detailed endpoint telemetry beyond default logging           |
| **AppLocker / WDAC**       | Application allow-listing, restricting what software may run                                    |
| **Audit policy**           | The configuration that determines which security events are logged                              |
| **Tier 0**                 | The most privileged assets (DCs, domain admins), whose compromise means enterprise compromise   |

### The core idea

```text
Compromise AD          gain control of the directory
     ↓
Compromise Trust       every domain-joined system trusts AD
     ↓
Compromise Enterprise  that trust becomes control of everything
```

The distinction from Linux hardening is one of scope. Hardening a Linux server protects **that server**. Active Directory is the trust fabric of the whole organization, so compromising it compromises **every machine that trusts it**. That is why Windows security centers on protecting AD above all else, and why an attacker who reaches Domain Admin has effectively won.

## 2. Active Directory Fundamentals

### Structure

AD is organized as a hierarchy, from the broadest container down to individual objects.

```text
Forest           the top-level security boundary, one or more domains
 ↓
Domain           a unit of administration and replication
 ↓
OU               Organizational Unit, a container for grouping objects
 ↓
Users / Computers / Groups   the actual directory objects
```

### What AD controls

Authentication, authorization, password policies, group membership, security settings, and GPO deployment. In practice, AD is the single point through which access across the entire environment is granted and enforced.

### The crown jewels

These are the highest-value targets, and protecting them is the priority of everything that follows:

| Asset                  | Why it matters                                               |
| ---------------------- | ------------------------------------------------------------ |
| **Domain Controllers** | Hold the entire directory and its password data              |
| **Domain Admins**      | Full control over the domain                                 |
| **Enterprise Admins**  | Full control across the entire forest                        |
| **Service accounts**   | Often over-privileged and a common escalation path           |
| **GPO infrastructure** | Can push configuration, or malware, to every machine at once |

## 3. Group Policy Fundamentals

Group Policy is how security configuration is deployed centrally. It is also, in the wrong hands, how an attacker deploys damage centrally.

### LSDOU processing order

Policies apply in a defined order, and later policies override earlier ones on conflict.

```text
Local        policy set on the machine itself
 ↓
Site         policy for the physical or network site
 ↓
Domain       policy for the whole domain
 ↓
OU           policy for the Organizational Unit (applied last, wins conflicts)
```

The mnemonic is **LSDOU**: Local, Site, Domain, OU. Because OU-level policy applies last, it takes precedence, which is why targeted OU policies can refine or override broad domain settings.

### Security uses

Password policy, firewall rules, audit policy, AppLocker, PowerShell security, and general system hardening are all deployed through GPO. It is the primary mechanism for enforcing a security baseline at scale.

### The security reality

Group Policy's reach is also its danger. **A malicious GPO can deploy ransomware to every domain-joined machine simultaneously.** This is a favored technique in human-operated ransomware: gain control of AD, then use the organization's own management infrastructure to distribute the payload everywhere at once. Monitoring GPO changes is therefore a critical detection control, not an optional one.

## 4. Windows Hardening Methodology

Hardening Windows follows a sequence, prioritizing the highest-value assets first.

```text
Inventory                know every asset and account
 ↓
Audit                    measure the current state
 ↓
Harden Authentication    passwords, Kerberos, lockout
 ↓
Enable Logging           advanced audit policy
 ↓
Deploy Sysmon            deep endpoint telemetry
 ↓
Deploy Application Control   AppLocker or WDAC
 ↓
Enforce Firewall         default-deny per profile
 ↓
Validate                 confirm controls are in place
 ↓
Monitor                  continuous detection
```

**Priority order,** highest value first:

1. **Domain Controllers**, the Tier 0 crown jewels.
2. **Authentication**, the front door for every attack.
3. **Logging**, so anything that happens is visible.
4. **Application control**, to stop unauthorized code.
5. **Endpoint segmentation**, to limit how far an intrusion spreads.

## 5. Password and Authentication Hardening

### Password policy

A traditional strong baseline:

| Setting          | Value              |
| ---------------- | ------------------ |
| Minimum length   | 14 characters      |
| Complexity       | Enabled            |
| Password history | 24 remembered      |
| Maximum age      | 90 days (see note) |

> **Accuracy note on expiration:** mandatory periodic password expiration is now discouraged by current guidance. Microsoft removed the password-expiration recommendation from its security baseline in 2019, and NIST SP 800-63B advises against forced periodic rotation unless there is evidence of compromise, because it drives predictable, weaker passwords. Many benchmarks still include a maximum age, so the value above reflects traditional CIS guidance, but the modern approach favors length, MFA, and screening against breached-password lists over forced rotation.

### Account lockout

| Setting           | Value             |
| ----------------- | ----------------- |
| Lockout threshold | 5 failed attempts |
| Lockout duration  | 15 minutes        |

Lockout slows brute force and password spraying, but an overly aggressive threshold enables denial of service by deliberately locking accounts, so tune it to the environment.

### Kerberos hardening

Kerberos is the domain authentication protocol, and its weaker legacy encryption types are directly exploitable.

| Disable | Enable |
| ------- | ------ |
| DES     | AES128 |
| RC4     | AES256 |

RC4 in particular is what makes **Kerberoasting** practical: an attacker requests a service ticket, which is encrypted with the service account's password hash, and cracks it offline. Weak encryption and weak service-account passwords make this fast. Enforcing AES and using strong, long service-account passwords (or managed accounts) is the direct defense.

### Additional authentication controls

- **MFA** on privileged and remote access, the single highest-impact control given that most intrusions begin with valid credentials.
- **Windows LAPS** (Local Administrator Password Solution, now built into Windows) randomizes and rotates each machine's local administrator password, preventing one stolen local-admin hash from unlocking every workstation.
- **Protected Users group** and **Credential Guard** reduce the exposure of credentials in memory, limiting credential theft.

**Reduces:** brute force, password spraying, and Kerberoasting.

## 6. Advanced Audit Policies

Logging is the foundation of detection. Without it, an intrusion is invisible.

Enable auditing for: logon events, account management, process creation, policy changes, directory service access, and privilege use. Advanced Audit Policy (configured via GPO) gives finer control than the legacy basic audit settings and should be used in preference to them.

```text
Without logging:  Attack = Invisible
```

Enabling **process creation auditing (with command-line capture)** is especially valuable, since it records exactly what was run, which is essential for spotting living-off-the-land attacks that abuse built-in tools.

## 7. Critical Windows Event IDs

The Security event log entries most worth knowing for detection.

| Event ID | Meaning                                            |
| -------- | -------------------------------------------------- |
| **4624** | Successful logon                                   |
| **4625** | Failed logon                                       |
| **4648** | Logon using explicit credentials                   |
| **4688** | Process creation                                   |
| **4720** | User account created                               |
| **4726** | User account deleted                               |
| **4728** | Member added to a security-enabled global group    |
| **4732** | Member added to a security-enabled local group     |
| **4756** | Member added to a security-enabled universal group |
| **1102** | Audit (security) log cleared                       |

### Reading them for detection

| Pattern                                     | Likely meaning                                 |
| ------------------------------------------- | ---------------------------------------------- |
| A spike in **4625**                         | Password spraying or brute force               |
| **4728 / 4732 / 4756** on a sensitive group | Privilege escalation (added to an admin group) |
| **4720** unexpectedly                       | Attacker creating a persistence account        |
| **1102**                                    | Log clearing, a classic anti-forensics step    |

A single 1102 outside a planned maintenance window is one of the highest-fidelity alerts available: legitimate administrators rarely clear the security log, but attackers do it to cover their tracks.

## 8. Sysmon

Sysmon (System Monitor, from Sysinternals) provides far deeper endpoint telemetry than default Windows logging, recording detailed process, network, and system activity. It is free and widely deployed as a detection foundation.

### Critical Sysmon events

| Event  | Meaning                                                  |
| ------ | -------------------------------------------------------- |
| **1**  | Process creation                                         |
| **3**  | Network connection                                       |
| **7**  | Image (DLL) loaded                                       |
| **8**  | CreateRemoteThread (code injection into another process) |
| **11** | File creation                                            |
| **13** | Registry value set                                       |
| **22** | DNS query                                                |

### What it detects

PowerShell abuse, credential theft, persistence mechanisms, malware execution, and command-and-control traffic. The combination of process creation (1), network connections (3), and DNS queries (22) is particularly powerful for spotting an intrusion's activity.

### Recommended baseline

The **SwiftOnSecurity Sysmon configuration** is a widely used, well-documented starting point. Sysmon logs only what its configuration tells it to, so a good config is what makes it useful; deployed with an empty config it captures little.

## 9. PowerShell Security Controls

PowerShell is both an administrator's tool and an attacker's favorite, because it is powerful, built-in, and often unmonitored. These controls make its use visible and constrained.

**Enable:**

- **Script Block Logging**, which records the actual code executed, including deobfuscated and encoded commands.
- **Module Logging**, which records pipeline execution detail.
- **Constrained Language Mode**, which restricts the dangerous language features attackers rely on.

**Benefits:** these record scripts, commands, encoded payloads, and module activity, and they reduce the effectiveness of fileless malware and living-off-the-land attacks that run entirely in memory. Script Block Logging in particular defeats the common tactic of passing a base64-encoded command to hide its contents, since the decoded block is logged.

## 10. Application Control: AppLocker and WDAC

Application control inverts the traditional security model.

| Model                                | Approach                                                                      |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| **Traditional (blocklist)**          | Allow everything, block known-bad. Fails against anything new                 |
| **Application control (allow-list)** | Block everything, allow only approved software. Stops unknown code by default |

The allow-list model is stronger because it does not depend on recognizing the threat: anything not explicitly approved simply does not run.

### AppLocker rule types

| Type          | Basis                                                            |
| ------------- | ---------------------------------------------------------------- |
| **Publisher** | The software's digital signature (most robust, survives updates) |
| **Path**      | The file location (weakest, a writable allowed path is a bypass) |
| **Hash**      | The exact file hash (precise, but breaks on every update)        |

### Deployment

```text
Audit Mode      log what would be blocked, without blocking
 ↓
Review          confirm no legitimate software is caught
 ↓
Enforce         switch to actively blocking
```

Always run in audit mode first. Enforcing an allow-list without testing will block legitimate applications and disrupt users.

> **Accuracy note:** Microsoft now positions **WDAC (Windows Defender Application Control, recently rebranded App Control for Business)** as its primary, more tamper-resistant application-control technology, with AppLocker as a supplementary or legacy control. AppLocker remains widely taught and used, but for new deployments WDAC is Microsoft's recommended direction.

## 11. Windows Firewall

The built-in Windows Firewall enforces host-level segmentation, limiting what can reach each machine even inside the network.

### Profiles

Windows applies one of three firewall profiles depending on the network:

| Profile     | Applies to                                      |
| ----------- | ----------------------------------------------- |
| **Domain**  | Networks where a domain controller is reachable |
| **Private** | Trusted networks such as home or office         |
| **Public**  | Untrusted networks such as public Wi-Fi         |

### Best practice

```text
Enable all profiles
Default deny inbound
Allow only required services
```

**Reduces:** lateral movement, worm propagation, and unauthorized access. Host firewalls are a key containment control: even if an attacker lands on one machine, a default-deny inbound posture limits how easily they can reach the next.

## 12. SMB and RDP Hardening

Two of the most abused Windows services, and both have well-known hardening steps.

### SMB (file sharing)

| Action                 | Reason                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **Disable SMBv1**      | Obsolete and the vector for WannaCry (EternalBlue). It has no place on a modern network |
| **Enable SMB signing** | Prevents tampering and certain relay attacks                                            |

### RDP (remote desktop)

| Action                                         | Reason                                                                           |
| ---------------------------------------------- | -------------------------------------------------------------------------------- |
| **Require Network Level Authentication (NLA)** | Forces authentication before a session is established, blocking pre-auth attacks |
| **Restrict access**                            | Limit who and where RDP is reachable from                                        |
| **Never expose RDP to the internet**           | Internet-facing RDP is a leading ransomware entry point                          |

Exposed RDP and legacy SMBv1 are two of the most common initial-access vectors in real incidents, which is why both appear on nearly every hardening checklist.

## 13. Service Account Security

Service accounts run applications and services, and they are a favorite escalation path because they are often powerful and poorly managed.

### The risks

Excessive privileges, shared accounts, weak passwords, and forgotten accounts that no one owns or reviews. A service account with domain-admin rights and a weak, never-changed password is a direct route to full compromise, and exactly what Kerberoasting targets.

### Best practices

| Practice                            | Benefit                                                                |
| ----------------------------------- | ---------------------------------------------------------------------- |
| **Least privilege**                 | Grant only the access the service needs, never domain admin by default |
| **Managed service accounts (gMSA)** | Automatically managed, strong, rotating passwords                      |
| **Ownership tracking**              | Every account has a known owner and purpose                            |
| **Regular review**                  | Find and remove stale or over-privileged accounts                      |

Group Managed Service Accounts (gMSA) are the strong default: Windows manages a long, random password and rotates it automatically, removing the weak-static-password problem that makes Kerberoasting effective.

## 14. Domain Controller Protection

Domain Controllers are **Tier 0** assets. Their compromise is the compromise of the entire domain, so they receive the strongest controls in the environment.

### Required controls

MFA, Sysmon, advanced auditing, restricted administration, firewall controls, and continuous monitoring. DCs should be administered only from secured, dedicated privileged-access workstations, never from a general-purpose desktop that also browses the web and reads email.

### What to monitor closely

| Watch for              | Because it may indicate                        |
| ---------------------- | ---------------------------------------------- |
| **GPO changes**        | An attacker preparing mass deployment          |
| **New admin accounts** | Persistence being established                  |
| **Kerberos abuse**     | Kerberoasting, or golden/silver ticket forgery |
| **Failed logons**      | Spraying or brute force against the domain     |

The **Tier 0 model** is the core principle: keep the most privileged credentials and systems isolated so that compromising an ordinary workstation cannot cascade into compromising a Domain Controller.

## 15. PowerShell Validation

Hardening is not a one-time act. Regular validation confirms the controls are still in place and flags drift.

### What to verify regularly

Password policy, lockout settings, Kerberos configuration, firewall status, Sysmon deployment, AppLocker or WDAC status, and audit policies. A scheduled PowerShell script can collect all of these and compare them against the intended baseline.

### The validation workflow

```text
Collect      gather the current state from each system
 ↓
Compare      check it against the defined baseline
 ↓
Report       produce a structured pass/fail result
 ↓
Remediate    fix any control that has drifted
```

This mirrors the idempotent-validation approach used in Linux hardening: measure the real state, compare to the intended state, and correct the difference on a schedule.

## 16. Defending the AD Attack Chain

Human-operated ransomware against a Windows environment follows a recognizable chain. Understanding it shows where each control breaks the sequence.

```text
Initial Access              phishing, exposed RDP, valid credentials
 ↓
Credential Theft            harvest passwords and hashes from memory
 ↓
Kerberoasting               crack weak service-account passwords offline
 ↓
Lateral Movement            spread across machines using stolen credentials
 ↓
Domain Controller Compromise   reach Tier 0, gain full domain control
 ↓
Malicious GPO               use Group Policy to reach every machine
 ↓
Ransomware Deployment       push the payload domain-wide at once
```

### Where the controls apply

Each defensive control interrupts a specific stage, and the earlier the break, the less damage:

| Control                       | Breaks the chain at                        |
| ----------------------------- | ------------------------------------------ |
| Strong passwords, MFA         | Initial access and credential theft        |
| Account lockout               | Brute force and spraying at initial access |
| Kerberos hardening, gMSA      | Kerberoasting                              |
| Sysmon, firewall segmentation | Lateral movement (detect and contain)      |
| Tier 0 protection, MFA on DCs | Domain controller compromise               |
| GPO change monitoring         | Malicious GPO                              |
| AppLocker or WDAC enforcement | Ransomware execution                       |

The lesson is layered defense: no single control stops every stage, but together they turn a smooth chain into a series of obstacles, each of which buys detection time.

## 17. Professional Judgment

As with all hardening, controls are applied with judgment rather than blindly.

**Apply a control when** the risk reduction is significant and the business impact is acceptable.

**Document an exception when** a control must be skipped, recording four things:

| Field                    | Records                             |
| ------------------------ | ----------------------------------- |
| **Risk**                 | The exposure that remains           |
| **Reason**               | Why the control was skipped         |
| **Compensating control** | The alternative protection in place |
| **Approval**             | The risk owner who accepted it      |

A skipped control is a documented, owned decision, never a silent gap. Balancing hardening against operational and application requirements, and recording the trade-offs, is what separates professional hardening from mechanical checklist-following.

## 18. Framework and Tool Map

| Item                             | Purpose                                             |
| -------------------------------- | --------------------------------------------------- |
| **Active Directory**             | Centralized authentication and authorization        |
| **Group Policy**                 | Centralized security configuration at scale         |
| **Sysmon**                       | Deep endpoint visibility and telemetry              |
| **AppLocker / WDAC**             | Application control and allow-listing               |
| **Windows Firewall**             | Host-level segmentation                             |
| **PowerShell**                   | Automation, validation, and (if unmonitored) attack |
| **Windows LAPS**                 | Local administrator password randomization          |
| **CIS Benchmark**                | Consensus hardening baseline                        |
| **Microsoft Security Baselines** | Microsoft's recommended security configuration      |

## 19. Fast Recall

- **AD is the crown jewel.** Compromising it compromises the whole enterprise, because every machine trusts it.
- **LSDOU** is the GPO processing order: Local, Site, Domain, OU. OU applies last and wins conflicts.
- **A malicious GPO can push ransomware to every domain-joined machine.** Monitor GPO changes.
- **Key event IDs:** 4624 successful logon, 4625 failed logon, 4688 process creation, 4720 user created, 4728/4732 added to group, 1102 log cleared.
- **A 4625 spike** is spraying; **1102** is likely anti-forensic log clearing.
- **Sysmon events:** 1 process creation, 3 network connection, 7 DLL load, 8 remote thread, 11 file creation, 13 registry, 22 DNS.
- **Deploy Sysmon** with a real config (SwiftOnSecurity baseline). Empty config captures little.
- **Password baseline:** length 14, complexity, history 24. Modern guidance favors length, MFA, and breach screening over forced expiration.
- **Account lockout:** threshold around 5, duration 15 minutes. Too aggressive enables DoS.
- **Kerberos:** disable DES and RC4, enable AES. Weak RC4 and weak service passwords enable Kerberoasting.
- **Use gMSA** for service accounts, and **LAPS** for local admin passwords.
- **Enable PowerShell Script Block Logging**, which defeats encoded-command hiding.
- **Application control:** allow-list, not blocklist. Audit mode first, then enforce. WDAC is Microsoft's current primary; AppLocker is widely used.
- **Enable the firewall on all profiles**, default-deny inbound.
- **Disable SMBv1** (the WannaCry vector). Enable SMB signing.
- **RDP requires NLA** and must never be exposed directly to the internet.
- **Domain Controllers are Tier 0.** Protect them first, administer them from dedicated privileged workstations.
- **Break the attack chain early:** the earlier a control interrupts initial access to ransomware, the less damage.

## 20. Resources

**Active Directory and Windows security**

- [Microsoft: Best Practices for Securing Active Directory](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/security-best-practices/best-practices-for-securing-active-directory)
- [CISA: Detecting and Mitigating Active Directory Compromises](https://www.cisa.gov/resources-tools/resources/detecting-and-mitigating-active-directory-compromises)
- [Microsoft: Securing Privileged Access (Tier model)](https://learn.microsoft.com/en-us/security/privileged-access-workstations/overview)
- [Microsoft: Windows LAPS](https://learn.microsoft.com/en-us/windows-server/identity/laps/laps-overview)

**Endpoint monitoring**

- [Sysinternals Sysmon](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon)
- [SwiftOnSecurity Sysmon configuration](https://github.com/SwiftOnSecurity/sysmon-config)

**Application control**

- [Microsoft: Windows Defender Application Control (App Control for Business)](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/appcontrol)
- [Microsoft: AppLocker overview](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/applocker/applocker-overview)

**Hardening baselines**

- [CIS Microsoft Windows Server Benchmarks (2025 is current)](https://www.cisecurity.org/benchmark/microsoft_windows_server)
- [Microsoft Security Baselines and the Security Compliance Toolkit](https://learn.microsoft.com/en-us/windows/security/operating-system-security/device-management/windows-security-configuration-framework/security-compliance-toolkit-10)

**PowerShell help**

```powershell
Get-Help Set-ADDefaultDomainPasswordPolicy
Get-Help New-GPO
Get-Help Set-GPRegistryValue
Get-Help Get-WinEvent
Get-Help New-NetFirewallRule
```
