# Offensive vs Defensive Security

> `To defeat the attacker, you must first think like one.`

Cybersecurity is a constant battle between **attackers** and **defenders**. To protect systems well, you need to understand both how attacks are carried out and how they are detected and stopped.

---

## What is Offensive Security?

- A **proactive** approach: simulate real attacks to find weaknesses **before** real attackers do.
- Mindset: "think like an attacker."
- Carried out by **ethical hackers, penetration testers, red teams**.
- Goal: find and exploit vulnerabilities, show the real impact, then report them so they can be fixed.
- It is about **breaking in (with permission)** to make the system stronger.

## What is Defensive Security?

- A mix of **proactive and reactive** work: protect, monitor, detect, respond, recover.
- Carried out by **blue teams, SOC analysts, incident responders**.
- Goal: prevent attacks, detect them quickly, limit the damage, and restore normal operations.
- It is about **keeping attackers out** and **catching them fast** when they get in.

## Offensive vs Defensive at a Glance

| | Offensive Security | Defensive Security |
|---|--------------------|--------------------|
| **Mindset** | Attacker | Defender |
| **Goal** | Find and exploit weaknesses | Prevent, detect, respond |
| **Team** | Red team | Blue team |
| **Approach** | Proactive (simulate attacks) | Proactive + reactive (monitor/respond) |
| **Typical roles** | Pentester, ethical hacker | SOC analyst, incident responder |
| **Example activity** | Exploiting a SQL injection | Blocking it with a WAF and alerting |

---

## The Teams: Red, Blue, and Purple

### Red Team (Offensive)

- Simulates real adversaries to test the organization's defenses.
- Uses the same tools and techniques as real attackers.
- **Contribution:** exposes weaknesses in people, processes, and technology, and shows how far an attacker could actually get.

### Blue Team (Defensive)

- **Role:** defends the organization day to day.
- Monitors systems, analyzes logs, detects intrusions, responds to incidents, and hardens defenses.
- Runs the SOC, tunes alerts, manages firewalls/IDS/IPS, and leads incident response.

### Purple Team (Collaboration)

- Not a separate team so much as a **function that connects red and blue**.
- Red shares its attack techniques, blue improves detection and response based on them.
- **Purpose:** make sure lessons from offensive testing actually improve the defense, closing the feedback loop.

| Team | Color | Focus |
|------|-------|-------|
| Red | Attack | Simulate real attacks, find gaps |
| Blue | Defend | Monitor, detect, respond, harden |
| Purple | Bridge | Share knowledge so both sides improve |

---

## Ethical Hacking

- **Authorized** hacking done with **explicit permission** and a defined **scope**.
- Same skills as a malicious hacker, but **legal** and aimed at improving security.
- Also called **white-hat hacking**.

**Types of hackers:**

| Hat | Meaning |
|-----|---------|
| **White hat** | Ethical, authorized, works to defend |
| **Black hat** | Malicious, illegal, personal gain or harm |
| **Grey hat** | In between: may hack without permission but without malicious intent |

---

## Penetration Testing

A **simulated, authorized attack** on a system to find and exploit vulnerabilities.

**Purpose:**
- Identify weaknesses that a real attacker could exploit.
- Show the **real-world impact** of those weaknesses (proof, not theory).
- Test whether existing defenses actually work.
- Provide a report so the organization can fix issues and meet compliance needs.

**Types by knowledge given to the tester:**

| Type | Tester knows |
|------|--------------|
| **Black box** | Nothing (simulates an outside attacker) |
| **White box** | Full info (code, architecture, credentials) |
| **Grey box** | Partial info (e.g., a normal user account) |

**Common pentest phases:**
1. **Planning / scoping** (rules of engagement, permission)
2. **Reconnaissance** (gather info about the target)
3. **Scanning / enumeration** (find open ports, services, vulns)
4. **Exploitation** (gain access)
5. **Post-exploitation** (privilege escalation, pivoting, persistence)
6. **Reporting** (findings, impact, remediation)

---

## Vulnerability Assessment vs Penetration Testing

Both find weaknesses, but they are **not** the same.

| | Vulnerability Assessment | Penetration Testing |
|---|--------------------------|---------------------|
| **Goal** | Find and list vulnerabilities | Find **and exploit** vulnerabilities |
| **Depth** | Broad, surface-level | Deep, proves real impact |
| **Method** | Mostly automated scans | Manual + automated, human-driven |
| **Exploitation** | No (just identifies) | Yes (actively exploits) |
| **Output** | List of vulns, often ranked | Report showing what was actually breached |
| **Frequency** | Often, routine | Periodic, targeted |

**One-liner:** a vulnerability assessment tells you the doors that might be unlocked; a penetration test walks through them.

---

## The Cyber Kill Chain

A model (from **Lockheed Martin**) describing the **7 stages of an attack**. Defenders aim to **break the chain** at any stage to stop the attack.

| # | Phase | What the attacker does |
|---|-------|------------------------|
| 1 | **Reconnaissance** | Gather info about the target |
| 2 | **Weaponization** | Build the malicious payload/exploit |
| 3 | **Delivery** | Send it (email, USB, malicious link) |
| 4 | **Exploitation** | Trigger the vulnerability to run code |
| 5 | **Installation** | Install malware / establish a foothold |
| 6 | **Command & Control (C2)** | Remote channel to control the victim |
| 7 | **Actions on Objectives** | Steal data, encrypt, destroy, pivot |

> **Key idea:** the earlier you break the chain, the less damage is done.

**Related framework — MITRE ATT&CK:** a large, detailed knowledge base of real-world attacker **tactics and techniques**. Where the kill chain is a simple linear model, ATT&CK is a granular matrix defenders use to map, detect, and respond to specific attacker behaviors.

---

## SIEM (Security Information and Event Management)

A system that **collects, centralizes, and analyzes logs** from across the environment (servers, firewalls, endpoints, apps).

**How it helps defense:**
- **Aggregates** logs from many sources into one place.
- **Correlates** events to spot patterns a single log would miss.
- **Alerts** analysts in real time on suspicious activity.
- Supports **investigation, threat hunting, and compliance reporting**.

**Examples:** Splunk, IBM QRadar, Microsoft Sentinel, Elastic (ELK) Stack.

---

## Common Offensive Tools

| Tool | Category | Purpose |
|------|----------|---------|
| **Nmap** | Recon / scanning | Discover hosts, ports, services |
| **Metasploit** | Exploitation | Framework of ready-made exploits |
| **Burp Suite** | Web app | Intercept and test web traffic |
| **sqlmap** | Web app | Automate SQL injection |
| **John the Ripper / hashcat** | Cracking | Crack password hashes |
| **Hydra** | Cracking | Brute-force logins (SSH, FTP, etc.) |
| **Gobuster / dirb** | Web app | Brute-force directories and files |
| **Wireshark** | Sniffing | Capture and analyze packets |
| **aircrack-ng** | Wireless | Attack Wi-Fi (WEP/WPA) |
| **Nikto** | Web app | Scan web servers for known issues |

---

## Common Defensive Measures

| Measure | What it does |
|---------|--------------|
| **Firewall** | Filters traffic based on rules (allow/deny) |
| **IDS / IPS** | Detects (IDS) or blocks (IPS) malicious traffic |
| **Antivirus / EDR** | Detects and stops malware on endpoints |
| **MFA** | Adds a second factor beyond passwords |
| **Patching / updates** | Closes known vulnerabilities |
| **Least privilege** | Users get only the access they need |
| **Network segmentation** | Limits how far an attacker can move |
| **Encryption** | Protects data at rest and in transit |
| **Backups** | Enable recovery after ransomware/loss |
| **Security awareness training** | Reduces human error and phishing success |

**IDS vs IPS:**

| | IDS | IPS |
|---|-----|-----|
| **Action** | Detects and **alerts** | Detects and **blocks** |
| **Position** | Out of band (watches) | In line (stops traffic) |

---

## Threat Hunting

A **proactive** search for threats that have **already evaded** existing defenses. It assumes attackers may already be inside.

**How it works:**
- **Hypothesis-driven:** the hunter forms a theory (e.g., "an attacker is using stolen credentials at odd hours").
- Uses logs, SIEM data, endpoint data, and threat intelligence to test the theory.
- Looks for **indicators of compromise (IOCs)** and abnormal behavior, not just known-bad signatures.
- Findings feed back into detections so alerts improve over time.

**Difference from monitoring:** monitoring waits for alerts; hunting actively goes looking, even with no alert firing.

---

## Incident Response (IR) Phases

Two common models. Learn both, they map closely.

**NIST (4 phases):**
1. **Preparation** — tools, plans, and training in place
2. **Detection & Analysis** — identify and confirm the incident
3. **Containment, Eradication & Recovery** — stop the spread, remove the threat, restore systems
4. **Post-Incident Activity** — lessons learned, improve defenses

**SANS (6 phases — "PICERL"):**

| # | Phase |
|---|-------|
| 1 | **P**reparation |
| 2 | **I**dentification |
| 3 | **C**ontainment |
| 4 | **E**radication |
| 5 | **R**ecovery |
| 6 | **L**essons Learned |

> **Key idea:** IR is a cycle, not a one-time fix. The last phase feeds back into preparation.

---

## Security Awareness Training

**Why it matters:**
- People are often the **weakest link**: most breaches involve human error.
- Attackers heavily use **phishing** and **social engineering**, which target humans, not machines.
- Training teaches staff to spot phishing, use strong passwords/MFA, handle data safely, and report incidents.
- A trained workforce becomes a **human firewall**, reducing the chance an attack succeeds even when technical defenses are bypassed.

---

## Quick Reference

| Term | One-line meaning |
|------|------------------|
| **Offensive security** | Simulate attacks to find weaknesses |
| **Defensive security** | Protect, detect, and respond to threats |
| **Red team** | Attackers (simulate real threats) |
| **Blue team** | Defenders (monitor and respond) |
| **Purple team** | Bridge that shares red's findings with blue |
| **Ethical hacking** | Authorized, legal hacking to improve security |
| **Penetration test** | Authorized attack that exploits and proves impact |
| **Vulnerability assessment** | Finds and lists vulns, does not exploit |
| **Cyber kill chain** | 7 stages of an attack; break it to stop it |
| **MITRE ATT&CK** | Detailed matrix of attacker tactics/techniques |
| **SIEM** | Central log collection, correlation, alerting |
| **Threat hunting** | Proactively search for hidden threats |
| **Incident response** | Structured process to handle a breach |
| **Security awareness** | Training people to be a human firewall |

---
