# Digital Forensics Ethics & Methodologies

---

## 1. What is Digital Forensics?

**Digital forensics** is the process of identifying, preserving, analyzing, and presenting digital evidence in a way that is legally acceptable.

Think of it as "crime scene investigation, but for computers and networks."

### What it covers

| Area | What's examined | Example |
|------|----------------|---------|
| **Computer forensics** | Hard drives, SSDs, RAM, OS artifacts | Recovering deleted files from a suspect's laptop |
| **Mobile forensics** | Smartphones, tablets, SIM cards | Extracting call logs, messages, app data |
| **Network forensics** | Packets, logs, traffic flows | Analyzing a captured network intrusion |
| **Memory forensics** | RAM dumps, running processes | Finding malware that only lives in memory |
| **Cloud forensics** | Cloud storage, VMs, SaaS logs | Investigating unauthorized AWS access |
| **Database forensics** | Database transactions, logs | Detecting unauthorized data modifications |

### When digital forensics is used

- **Criminal investigations** — fraud, hacking, child exploitation, cyberstalking
- **Corporate incidents** — data breaches, insider threats, intellectual property theft
- **Civil litigation** — employment disputes, contract violations (e-discovery)
- **Incident response** — understanding what happened during a security breach
- **Regulatory compliance** — proving adherence to data protection laws (GDPR, HIPAA)

### Real-world example

> A company discovers unauthorized access to customer data. A forensic investigator images the compromised server's drives, analyzes login logs, identifies the attacker's IP and timeline, preserves all evidence with proper chain of custody, and produces a report that can be used in court.

---

## 2. Why Ethics Matter in Digital Forensics

Ethics are the **foundation** of forensic credibility. Without ethical conduct, evidence gets thrown out, cases collapse, and careers end.

### Why ethics are critical

1. **Legal admissibility** — Courts reject evidence obtained unethically or illegally
2. **Public trust** — Society depends on forensic examiners being impartial and honest
3. **Professional credibility** — One ethical violation can destroy an entire career
4. **Preventing harm** — Forensic examiners access highly sensitive personal data
5. **Justice** — Biased or fabricated evidence can convict innocent people or free guilty ones

### The ethical examiner's mindset

```
"I am not here to prove guilt or innocence.
 I am here to find and present the truth,
 wherever it leads."
```

An examiner who goes in trying to "find evidence against the suspect" has already failed ethically. The job is to **follow the evidence**, not a narrative.

---

## 3. Common Ethical Issues in Digital Forensics

| Issue | Description | Example |
|-------|-------------|---------|
| **Privacy invasion** | Accessing data beyond the scope of investigation | Reading personal emails unrelated to the case |
| **Bias / confirmation bias** | Only looking for evidence that supports a theory | Ignoring exculpatory evidence (evidence that clears the suspect) |
| **Evidence tampering** | Modifying, planting, or destroying evidence | Changing file timestamps to fit a narrative |
| **Unauthorized access** | Accessing systems without proper authorization | Examining a server without a warrant or consent |
| **Conflict of interest** | Personal relationship with involved parties | Investigating a case involving a close friend |
| **Exceeding scope** | Going beyond what the warrant or authorization allows | A warrant covers email but you search browser history |
| **Poor documentation** | Failing to record actions taken during analysis | Not logging which tools were used or what was examined |
| **Data mishandling** | Failing to protect sensitive data found during investigation | Leaving unencrypted evidence on an unsecured drive |

### How to handle ethical dilemmas

1. **Stop** — Pause before acting when something feels off
2. **Consult** — Talk to legal counsel or a supervisor
3. **Document** — Record the dilemma and your reasoning
4. **Follow policy** — Refer to organizational and professional codes of conduct
5. **Err on the side of caution** — When in doubt, do NOT access the data

---

## 4. Integrity in Forensic Analysis

**Integrity** means the evidence is exactly as it was when found — nothing added, nothing removed, nothing changed.

### Two types of integrity

| Type | What it means |
|------|---------------|
| **Evidence integrity** | The digital evidence itself hasn't been altered in any way |
| **Personal integrity** | The examiner is honest, unbiased, and transparent about their work |

### How to maintain evidence integrity

```bash
# 1. Use write blockers when connecting to evidence drives
# Hardware write blockers prevent ANY writes to the source drive

# 2. Create forensic images (bit-for-bit copies)
dd if=/dev/sda of=/mnt/evidence/image.raw bs=4M status=progress

# 3. Generate cryptographic hashes BEFORE and AFTER analysis
md5sum /mnt/evidence/image.raw > /mnt/evidence/image.md5
sha256sum /mnt/evidence/image.raw > /mnt/evidence/image.sha256

# 4. Compare hashes — they MUST match
# Before: d41d8cd98f00b204e9800998ecf8427e
# After:  d41d8cd98f00b204e9800998ecf8427e  ← identical = integrity preserved
```

### Why hashing matters

If the hash before analysis doesn't match the hash after, the evidence has been modified — and it **cannot be used in court**. The opposing lawyer will argue the evidence was tampered with.

| Algorithm | Strength | Use in forensics |
|-----------|----------|-----------------|
| `MD5` | Weak (collisions possible) | Still accepted in many courts, fast |
| `SHA-1` | Moderate | Being phased out |
| `SHA-256` | Strong | Current standard for forensic hashing |

**Best practice:** Use **both** MD5 and SHA-256. If both match before and after, integrity is virtually guaranteed.

---

## 5. Maintaining Objectivity in Investigations

**Objectivity** = following the evidence, not a preconceived conclusion.

### Threats to objectivity

| Threat | Description |
|--------|-------------|
| **Confirmation bias** | You look for evidence that supports what you already believe |
| **Pressure from management** | "We need evidence that employee X did this" |
| **Emotional involvement** | Cases involving crimes against children can cloud judgment |
| **Tunnel vision** | Fixating on one suspect/theory and ignoring alternatives |
| **Anchoring** | Relying too heavily on the first piece of evidence found |

### How to stay objective

1. **Document everything** — every action, every decision, every tool used
2. **Follow a methodology** — structured process prevents ad-hoc bias
3. **Look for exculpatory evidence** — actively search for evidence that DISPROVES your theory
4. **Peer review** — have a colleague independently verify your findings
5. **Use validated tools** — tools that have been tested and accepted by the forensic community
6. **Separate facts from interpretation** — in your report, clearly distinguish "what I found" from "what I think it means"

---

## 6. The ACPO Principles

**ACPO** = **Association of Chief Police Officers** (UK). Their 4 principles are the global gold standard for handling computer-based evidence.

### The 4 ACPO Principles

| # | Principle | What it means |
|---|-----------|---------------|
| 1 | **No action should change data** | Don't modify the evidence. Use write blockers, work on copies, not originals. |
| 2 | **Competent access when necessary** | If you MUST access original data, you must be competent, qualified, and able to explain why. |
| 3 | **Audit trail** | Create and preserve a complete record of all actions taken. A third party should be able to reproduce your results. |
| 4 | **Lead investigator responsibility** | The person in charge of the case is responsible for ensuring these principles are followed by everyone involved. |

### ACPO in practice

```
Scenario: You seize a suspect's laptop.

Principle 1 → Immediately use a write blocker before connecting the drive
Principle 2 → Only a trained forensic examiner handles the evidence
Principle 3 → Log: "2025-05-12 14:30 - Connected drive via Tableau write blocker,
               created forensic image using FTK Imager, verified hash SHA-256: abc123..."
Principle 4 → The lead investigator reviews the log and signs off
```

---

## 7. Ensuring Evidence is Admissible in Court

For digital evidence to be accepted by a court, it must meet several criteria:

### The 5 pillars of admissibility

| Pillar | Requirement | How to achieve it |
|--------|-------------|-------------------|
| **Authenticity** | Prove the evidence is real and unaltered | Cryptographic hashes, chain of custody |
| **Reliability** | Collected using sound, repeatable methods | Use validated tools, follow established methodologies |
| **Completeness** | Evidence hasn't been selectively presented | Include exculpatory evidence, don't cherry-pick |
| **Relevance** | Evidence relates to the case at hand | Don't include unrelated personal data |
| **Legality** | Obtained through legal means | Proper warrants, consent, or legal authority |

### What makes evidence inadmissible

- ❌ No chain of custody documentation
- ❌ Evidence obtained without a warrant (when one was required)
- ❌ Hash mismatch (evidence was modified)
- ❌ Examiner cannot explain their methodology
- ❌ Tools used are not accepted or validated
- ❌ Evidence was handled by unqualified personnel
- ❌ Original evidence was not preserved

---

## 8. Chain of Custody

**Chain of custody** is a documented, unbroken record of everyone who handled the evidence, when, where, and what they did with it.

### Why it's crucial

- Proves the evidence was **never tampered with**
- Shows **continuous accountability** from seizure to courtroom
- A **single gap** in the chain can make ALL evidence inadmissible
- It's the **first thing** defense lawyers attack

### What a chain of custody log records

| Field | Example |
|-------|---------|
| **Item description** | Dell Latitude 5520 laptop, SN: ABC123 |
| **Date/time received** | 2025-05-12 14:30 UTC |
| **Received from** | Officer Jane Smith, Badge #4521 |
| **Received by** | Forensic Examiner Nishan, ID: FE-089 |
| **Purpose** | Create forensic image for case #2025-1234 |
| **Storage location** | Evidence locker B, Shelf 3, Bag #445 |
| **Condition** | Powered off, sealed in anti-static bag |
| **Hash at intake** | SHA-256: a1b2c3d4e5f6... |
| **Date/time released** | 2025-05-13 09:00 UTC |
| **Released to** | Evidence Custodian, returned to locker |

### Chain of custody rules

1. **Minimize transfers** — fewer people touching evidence = fewer risks
2. **Always document** — even moving evidence from one room to another
3. **Seal evidence** — use tamper-evident bags with unique serial numbers
4. **Sign at every transfer** — both parties sign (giving and receiving)
5. **Store securely** — locked room, access log, climate-controlled if needed
6. **Never leave evidence unattended** — if you step away, lock it up

---

## 9. Stages of the Digital Forensic Process

Different frameworks define different stages, but they all follow a similar flow:

### The core stages (NIST SP 800-86 based)

```
1. IDENTIFICATION
   ↓
2. PRESERVATION
   ↓
3. COLLECTION
   ↓
4. EXAMINATION
   ↓
5. ANALYSIS
   ↓
6. REPORTING
   ↓
7. PRESENTATION
```

### Each stage explained

| Stage | What happens | Key activities |
|-------|-------------|---------------|
| **1. Identification** | Determine what is relevant | Identify devices, data sources, scope of investigation |
| **2. Preservation** | Protect evidence from alteration | Isolate systems, use write blockers, document scene |
| **3. Collection** | Gather the evidence | Create forensic images, capture volatile data (RAM), seize devices |
| **4. Examination** | Extract data from evidence | Recover deleted files, parse logs, extract metadata |
| **5. Analysis** | Interpret the data | Build timeline of events, correlate evidence, identify patterns |
| **6. Reporting** | Document findings | Write forensic report with methodology, findings, conclusions |
| **7. Presentation** | Communicate to stakeholders | Present in court, brief management, explain to jury in plain language |

### Order matters — especially for volatile data

**Collect volatile evidence FIRST** — it disappears when power is lost:

```
Most volatile → Least volatile (order of collection)

1. CPU registers/cache     ← gone in nanoseconds
2. RAM (memory)            ← gone when powered off
3. Network connections     ← change constantly
4. Running processes       ← gone when powered off
5. Disk (temporary files)  ← may be overwritten
6. Disk (permanent files)  ← most stable
7. Backups / archives      ← most stable
```

### Quick volatile data collection commands (Linux)

```bash
# Capture current date/time
date -u > /mnt/evidence/datetime.txt

# Running processes
ps auxf > /mnt/evidence/processes.txt

# Network connections
ss -tulnp > /mnt/evidence/network.txt
netstat -anp > /mnt/evidence/netstat.txt

# Logged-in users
who > /mnt/evidence/users.txt
w > /mnt/evidence/w_output.txt

# Open files
lsof > /mnt/evidence/open_files.txt

# Network interfaces
ip a > /mnt/evidence/interfaces.txt

# Routing table
ip route > /mnt/evidence/routes.txt

# ARP cache (local network neighbors)
ip neigh > /mnt/evidence/arp.txt

# RAM dump (requires special tools)
# Using LiME (Linux Memory Extractor):
insmod lime.ko "path=/mnt/evidence/memory.lime format=lime"
```

---

## 10. Documenting Findings in a Forensic Report

A forensic report is the **official deliverable** — it may be read by lawyers, judges, executives, and opposing experts.

### Structure of a forensic report

| Section | Contents |
|---------|----------|
| **Executive summary** | Non-technical overview for management/lawyers (1-2 pages) |
| **Scope & objectives** | What was the investigation about? What were you asked to find? |
| **Methodology** | Tools used, procedures followed, standards referenced |
| **Evidence inventory** | All items examined (drives, devices, files) with serial numbers and hashes |
| **Chain of custody** | Full custody log for each evidence item |
| **Findings** | What was found — facts only, no opinions |
| **Analysis** | Interpretation of findings — what the evidence means |
| **Timeline** | Chronological reconstruction of events |
| **Conclusions** | Summary of what happened based on evidence |
| **Appendices** | Raw data, screenshots, hash logs, tool output |

### Report writing best practices

1. **Be precise** — "File was modified at 2025-05-12 14:23:07 UTC" not "the file was recently changed"
2. **Use UTC timestamps** — avoids timezone confusion
3. **Separate facts from opinions** — "The log shows login at 14:23" (fact) vs "The suspect likely logged in" (opinion)
4. **Include what you DIDN'T find** — "No evidence of data exfiltration was found" is valuable
5. **Explain for non-technical readers** — judges and lawyers may not understand "SQL injection"
6. **Be reproducible** — another examiner should be able to follow your steps and get the same results
7. **Include screenshots** — visual evidence is powerful in court

---

## 11. Standard Digital Forensic Methodologies

These frameworks provide structured, repeatable approaches to investigations.

### Major methodologies

| Methodology | Organization | Focus |
|-------------|-------------|-------|
| **NIST SP 800-86** | National Institute of Standards and Technology | Guide to integrating forensics into incident response |
| **DFRWS Framework** | Digital Forensic Research Workshop | Academic research-driven investigation framework |
| **ACPO Good Practice Guide** | UK Association of Chief Police Officers | 4 principles for handling computer evidence |
| **ISO 27037** | International Standards Organization | Guidelines for identifying, collecting, and preserving digital evidence |
| **SWGDE** | Scientific Working Group on Digital Evidence | Standards for quality assurance in forensic labs |
| **SANS DFIR** | SANS Institute | Practical, skills-based incident response methodology |
| **EnCase Methodology** | Guidance Software (now OpenText) | Tool-specific methodology used with EnCase software |

### NIST SP 800-86 in detail

The most widely referenced standard. It defines 4 phases:

```
1. Collection    → Gather relevant data
2. Examination   → Process the data (recover, filter, search)
3. Analysis      → Draw conclusions from examined data
4. Reporting     → Document and communicate findings
```

### DFRWS Framework

Developed by the academic forensic community. More detailed stages:

```
1. Identification → Recognize an incident
2. Preservation  → Protect evidence
3. Collection    → Gather evidence
4. Examination   → Process evidence
5. Analysis      → Interpret evidence
6. Presentation  → Report and testify
7. Decision      → Determine next steps
```

---

## 12. Handling Digital Evidence

### The golden rules

1. **NEVER work on the original** — always make a forensic copy (image) first
2. **Use write blockers** — hardware or software that prevents writing to the source drive
3. **Hash everything** — before AND after every operation
4. **Document every step** — what you did, when, why, with what tool
5. **Maintain chain of custody** — unbroken, signed, timestamped

### Creating a forensic image

```bash
# Using dd (basic but universal)
dd if=/dev/sda of=/mnt/evidence/disk.raw bs=4M status=progress
# Verify with hash
sha256sum /dev/sda > /mnt/evidence/original.sha256
sha256sum /mnt/evidence/disk.raw > /mnt/evidence/image.sha256
diff /mnt/evidence/original.sha256 /mnt/evidence/image.sha256

# Using dcfldd (forensic version of dd — includes hashing)
dcfldd if=/dev/sda of=/mnt/evidence/disk.raw bs=4M hash=sha256 hashlog=/mnt/evidence/hash.log

# Using Guymager (GUI tool, popular in Kali)
# Launch from Kali menu → Forensics → Guymager
```

### Evidence storage best practices

| Practice | Why |
|----------|-----|
| Encrypt forensic images at rest | Protect sensitive data |
| Use tamper-evident bags for physical media | Proves no one opened the bag |
| Store in a locked, access-controlled room | Prevents unauthorized access |
| Climate control (cool, dry) | Prevents hardware degradation |
| Backup forensic images to a second location | Disaster recovery |
| Log every access to the evidence room | Auditability |

---

## 13. Common Digital Forensics Tools

### Open-source / free tools

| Tool | Purpose | Platform |
|------|---------|----------|
| **Autopsy** | Full forensic suite — file recovery, timeline, keyword search | Windows, Linux, macOS |
| **Sleuth Kit (TSK)** | Command-line disk analysis tools (Autopsy is its GUI) | Linux, macOS |
| **Volatility** | Memory (RAM) forensics — analyze malware, processes | Python (cross-platform) |
| **Wireshark** | Network packet analysis | Cross-platform |
| **FTK Imager** | Create forensic images, preview evidence | Windows (free) |
| **dcfldd** | Forensic disk imaging with built-in hashing | Linux |
| **YARA** | Malware identification through pattern matching | Cross-platform |
| **log2timeline / Plaso** | Create super-timelines from multiple evidence sources | Python |
| **RegRipper** | Windows registry analysis | Windows, Linux |
| **bulk_extractor** | Extract artifacts (emails, URLs, credit cards) without parsing filesystem | Linux |
| **Guymager** | GUI forensic imaging tool | Linux (Kali) |
| **LiME** | Linux Memory Extractor — dump RAM from live Linux systems | Linux kernel module |
| **NetworkMiner** | Passive network forensics — extract files, images from pcaps | Windows, Linux |

### Commercial tools

| Tool | Purpose | Used by |
|------|---------|---------|
| **EnCase** | Industry-standard forensic suite | Law enforcement, enterprise |
| **FTK (Forensic Toolkit)** | Comprehensive forensic analysis | Law enforcement, corporations |
| **Cellebrite UFED** | Mobile device forensics | Law enforcement worldwide |
| **X-Ways Forensics** | Fast, efficient disk forensics | European law enforcement |
| **Magnet AXIOM** | Computer + mobile + cloud forensics | Corporate + law enforcement |

### Tools available in Kali Linux

```bash
# Kali has forensic tools pre-installed or easily installable:
sudo apt install autopsy          # full forensic GUI
sudo apt install sleuthkit        # command-line disk tools
sudo apt install volatility3      # memory analysis
sudo apt install guymager         # forensic imaging
sudo apt install dc3dd            # forensic dd
sudo apt install yara             # malware rules
sudo apt install bulk-extractor   # artifact extraction
sudo apt install foremost         # file carving (recover deleted files)
sudo apt install scalpel          # file carving (alternative)
sudo apt install binwalk          # firmware analysis
```

### Kali forensic boot mode

Kali has a special **"Forensic Mode"** boot option:
- Mounts drives as **read-only** (no evidence modification)
- Doesn't auto-mount any drives
- Doesn't enable swap (prevents writing to disk)
- Ideal for evidence examination

---

## 14. Organizations That Set Standards

| Organization | Full name | What they do |
|-------------|-----------|-------------|
| **NIST** | National Institute of Standards and Technology | Publishes forensic guidelines (SP 800-86), maintains NSRL hash database |
| **SWGDE** | Scientific Working Group on Digital Evidence | Develops standards for forensic labs and evidence handling |
| **DFRWS** | Digital Forensic Research Workshop | Academic conference + framework development |
| **ISFCE** | International Society of Forensic Computer Examiners | Professional certification (CCE — Certified Computer Examiner) |
| **IACIS** | International Association of Computer Investigative Specialists | Training + CFCE certification |
| **SANS** | SANS Institute | GIAC certifications (GCFE, GCFA, GNFA) + training |
| **ACPO** | Association of Chief Police Officers (now NPCC) | 4 principles for handling digital evidence |
| **ISO** | International Standards Organization | ISO 27037 (digital evidence handling) |
| **ENISA** | European Union Agency for Cybersecurity | EU forensic guidelines |

### Key certifications in digital forensics

| Certification | Organization | Focus |
|--------------|-------------|-------|
| **GCFE** | SANS/GIAC | Forensic Examiner (Windows) |
| **GCFA** | SANS/GIAC | Forensic Analyst (Advanced) |
| **GNFA** | SANS/GIAC | Network Forensic Analyst |
| **CCE** | ISFCE | Certified Computer Examiner |
| **CFCE** | IACIS | Certified Forensic Computer Examiner |
| **EnCE** | OpenText (Guidance) | EnCase Certified Examiner |
| **CHFI** | EC-Council | Computer Hacking Forensic Investigator |
| **OSCP** | Offensive Security | Penetration testing (related, not forensic) |

---

## 15. Staying Current with Evolving Technology

Technology evolves rapidly — forensic examiners must keep up or their skills become obsolete.

### Challenges

- New operating systems, file systems, and encryption methods
- Cloud services that don't store data locally
- End-to-end encrypted messaging (Signal, WhatsApp)
- IoT devices (smart home, wearables, vehicles)
- Anti-forensic techniques (wiping tools, steganography, live OS like Tails)
- Cryptocurrency and blockchain forensics

### How to stay current

| Method | Examples |
|--------|---------|
| **Conferences** | DFRWS, SANS DFIR Summit, HTCIA, BSides, DEF CON |
| **Training** | SANS courses, TCM Security, CyberDefenders, LetsDefend |
| **Publications** | Forensic Focus blog, IJDE journal, SANS reading room |
| **Communities** | DFIR Discord, Reddit r/computerforensics, Twitter/X DFIR community |
| **Practice labs** | CyberDefenders.org, BlueTeamLabs, BTLO, MemLabs |
| **Certifications** | Require continuing education (CPE credits) — forces ongoing learning |
| **Tool updates** | Follow tool changelogs (Autopsy, Volatility, EnCase release notes) |
| **Research** | Read academic papers, contribute to open-source tools |

---

## 16. Legal Implications of Digital Forensic Investigations

### Legal authority to investigate

| Scenario | Legal requirement |
|----------|-----------------|
| **Law enforcement** | Warrant, subpoena, or court order |
| **Corporate (employer-owned devices)** | Acceptable use policy + employee consent (varies by jurisdiction) |
| **Corporate (personal devices / BYOD)** | Very limited — usually requires employee consent |
| **Incident response (own network)** | Generally permitted on your own infrastructure |
| **Third-party investigation** | Written authorization / contract required |

### Key legal concepts

| Concept | Meaning |
|---------|---------|
| **Search and seizure** | Legal process for taking evidence (4th Amendment in US) |
| **Warrant** | Court authorization to search specific places for specific things |
| **Subpoena** | Legal order to produce documents or testimony |
| **Consent** | Voluntary permission from the device owner |
| **Expectation of privacy** | Whether the person reasonably believed their data was private |
| **Fruit of the poisonous tree** | Evidence obtained illegally → everything derived from it is also inadmissible |
| **Expert witness** | Forensic examiner called to testify about their findings |
| **Daubert standard** | US standard for admitting expert testimony (methodology must be scientifically valid) |

### Laws that affect digital forensics

| Law / Regulation | Jurisdiction | What it covers |
|-----------------|-------------|----------------|
| **CFAA** (Computer Fraud and Abuse Act) | US | Unauthorized computer access |
| **ECPA** (Electronic Communications Privacy Act) | US | Intercepting electronic communications |
| **GDPR** (General Data Protection Regulation) | EU | Personal data protection, right to erasure |
| **Data Protection Act** | UK | Similar to GDPR for the UK |
| **HIPAA** | US | Health information privacy |
| **SOX** (Sarbanes-Oxley) | US | Financial records retention |
| **PCI-DSS** | Global | Payment card data security |

### What happens when you get it wrong

- ❌ Evidence thrown out of court → case dismissed
- ❌ Violation of privacy laws → civil lawsuit against the examiner / organization
- ❌ Unauthorized access → criminal charges under CFAA
- ❌ GDPR violation → fines up to €20 million or 4% of global revenue
- ❌ Loss of professional certification
- ❌ Damage to reputation and career

---

## 17. SIEM — Security Information and Event Management

**SIEM** tools are essential in forensic investigations because they **aggregate and correlate logs** from across the entire infrastructure.

### What SIEM does

| Function | Description |
|----------|-------------|
| **Log collection** | Gathers logs from servers, firewalls, endpoints, applications |
| **Normalization** | Converts different log formats into a standard format |
| **Correlation** | Links related events from different sources (login + file access + network) |
| **Alerting** | Fires alerts when suspicious patterns are detected |
| **Dashboards** | Visual overview of security events |
| **Retention** | Stores logs for forensic analysis (months/years) |
| **Reporting** | Generates compliance and investigation reports |

### Common SIEM platforms

| SIEM | Type | Used by |
|------|------|---------|
| **Splunk** | Commercial | Enterprise, SOCs |
| **IBM QRadar** | Commercial | Large organizations |
| **Microsoft Sentinel** | Cloud (Azure) | Microsoft-heavy environments |
| **Elastic SIEM (ELK)** | Open-source | Flexible, popular |
| **Wazuh** | Open-source | Host intrusion detection + SIEM |
| **OSSIM** | Open-source | AlienVault community edition |

### Why SIEM matters for forensics

During an investigation, SIEM is often the **first place to look** because:

1. **Centralized logs** — don't need to access 50 servers individually
2. **Timeline reconstruction** — correlate events across systems
3. **Pre-incident data** — logs from before the breach show normal vs abnormal
4. **Alert history** — were there early warnings that were missed?
5. **Legal retention** — properly stored SIEM logs are admissible as evidence

---

## 18. Unix/Linux-Specific Forensic Analysis

### Key evidence locations in Linux

| Location | What it contains |
|----------|-----------------|
| `/var/log/auth.log` | Authentication events (SSH, sudo, su) |
| `/var/log/syslog` | General system messages |
| `/var/log/kern.log` | Kernel events |
| `/var/log/wtmp` | Login records (read with `last`) |
| `/var/log/btmp` | Failed login attempts (read with `lastb`) |
| `/var/log/lastlog` | Last login per user |
| `/var/log/secure` | Security events (RHEL/CentOS) |
| `/var/log/apache2/` | Web server logs |
| `/etc/passwd` | User accounts |
| `/etc/shadow` | Password hashes |
| `/etc/group` | Group memberships |
| `/etc/crontab` | Scheduled tasks (persistence mechanism) |
| `/tmp` and `/dev/shm` | Attacker staging areas (temporary files) |
| `~/.bash_history` | Command history per user |
| `~/.ssh/` | SSH keys, known_hosts, authorized_keys |

### Forensic commands for Linux

```bash
# User/login investigation
last                              # login history
lastb                             # failed logins
cat /etc/passwd                   # all users
cat /etc/shadow                   # password hashes (root only)
cat /etc/sudoers                  # who has sudo access

# File investigation
find / -mtime -1 -type f          # files modified in last 24h
find / -ctime -1 -type f          # files changed (metadata) in last 24h
find / -name ".*" -type f         # hidden files
find / -perm -4000 -type f        # SUID binaries (privilege escalation)
find /tmp /dev/shm -type f        # attacker staging areas
stat file.txt                     # detailed file timestamps (created, modified, accessed)
file suspicious_binary            # determine file type

# Process investigation
ps auxf                           # process tree
lsof -i                           # open network connections per process
ss -tulnp                         # listening ports + processes
cat /proc/<PID>/cmdline           # how a process was started
ls -la /proc/<PID>/exe            # what binary the process is running

# Network investigation
ip a                              # network interfaces
ip route                          # routing table
arp -a                            # ARP cache (neighbor discovery)
cat /etc/hosts                    # local DNS overrides (possible DNS poisoning)
cat /etc/resolv.conf              # DNS servers configured
iptables -L -v -n                 # firewall rules

# Persistence mechanisms (how attackers survive reboots)
crontab -l                        # current user's cron jobs
ls /etc/cron.*                    # system cron directories
systemctl list-unit-files         # systemd services
cat /etc/rc.local                 # legacy startup script
ls ~/.config/autostart/           # desktop autostart entries
```

### Timeline creation (super-timeline)

Building a timeline from multiple sources is one of the most powerful forensic techniques:

```bash
# Using log2timeline (part of Plaso) to create a super-timeline:
log2timeline.py /mnt/evidence/timeline.plaso /mnt/evidence/disk.raw

# Convert to CSV for analysis:
psort.py -o l2tcsv /mnt/evidence/timeline.plaso > /mnt/evidence/timeline.csv

# Now you can filter, sort, and analyze events chronologically
# across ALL evidence sources (logs, file metadata, browser history, etc.)
```

---

## 19. Quick Reference Tables

### Investigation process checklist

| Step | Action | Tool/Method |
|------|--------|-------------|
| 1 | Document the scene | Photos, notes, sketches |
| 2 | Collect volatile data | RAM dump (LiME), `ps`, `ss`, `lsof` |
| 3 | Image the drive | `dd`, `dcfldd`, FTK Imager, Guymager |
| 4 | Hash the image | `sha256sum`, `md5sum` |
| 5 | Analyze the image | Autopsy, Sleuth Kit, Volatility |
| 6 | Build timeline | `log2timeline`, manual log correlation |
| 7 | Document findings | Forensic report |
| 8 | Present | Court testimony, management briefing |

### Key hashing commands

```bash
# Generate hash
md5sum file.raw
sha256sum file.raw

# Verify hash
echo "expected_hash  file.raw" | sha256sum --check

# Hash an entire disk
sha256sum /dev/sda

# Hash with dcfldd (during imaging)
dcfldd if=/dev/sda of=image.raw hash=sha256 hashlog=hash.log
```

### ACPO at a glance

| # | Principle | One-liner |
|---|-----------|-----------|
| 1 | No modification | Don't change the evidence |
| 2 | Competent access | Only qualified people handle evidence |
| 3 | Audit trail | Document everything, be reproducible |
| 4 | Lead responsibility | The case lead ensures compliance |
