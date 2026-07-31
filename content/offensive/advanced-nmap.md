# Advanced Network Enumeration with Nmap

> **⚠️ AUTHORIZED USE ONLY.** This material is for education and authorized security testing. Port scanning sends traffic directly to target systems and **is detectable and logged**. Scanning systems you do not own or lack **explicit written permission** to test is unauthorized access and a criminal offence in most jurisdictions, including under the Computer Fraud and Abuse Act, the Computer Misuse Act, and equivalent laws. Practice only against systems you own or dedicated legal labs such as scanme.nmap.org, Hack The Box, and TryHackMe. You are solely responsible for how you use this. See the [Legal and Terms of Use](/legal) page.

> `A scan without purpose is noise. A scan with purpose is intelligence.`

> **Scope:** The mechanics behind Nmap's advanced scans: how each scan type works at the packet level, how responses reveal port state, how scans map firewalls, how the Nmap Scripting Engine extends the tool, and the legal boundaries of scanning. This sheet explains the **why**. For quick base-command syntax, see the companion **Nmap** reference sheet.

---

## Table of Contents
- [Why Nmap Matters](#why-nmap-matters)
- [The TCP Handshake and Port States](#the-tcp-handshake-and-port-states)
- [Standard vs Advanced Scans](#standard-vs-advanced-scans)
- [TCP Connect vs SYN Scan](#tcp-connect-vs-syn-scan)
- [ACK Scan and Firewall Mapping](#ack-scan-and-firewall-mapping)
- [FIN, NULL, and Xmas Scans](#fin-null-and-xmas-scans)
- [UDP Scanning](#udp-scanning)
- [Scan Type Reference](#scan-type-reference)
- [The Nmap Scripting Engine](#the-nmap-scripting-engine)
- [NSE Script Categories](#nse-script-categories)
- [Running and Organizing NSE Scripts](#running-and-organizing-nse-scripts)
- [Writing NSE Scripts and NSEDoc](#writing-nse-scripts-and-nsedoc)
- [Stealth and IDS Evasion](#stealth-and-ids-evasion)
- [Correlating Findings with Vulnerabilities](#correlating-findings-with-vulnerabilities)
- [What Enumeration Reveals](#what-enumeration-reveals)
- [Reporting](#reporting)
- [Legal and Ethical Boundaries](#legal-and-ethical-boundaries)
- [Operational Notes](#operational-notes)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Why Nmap Matters

Nmap (Network Mapper) is the industry-standard tool for network discovery and port scanning. It is essential to penetration testing because reconnaissance precedes everything: you cannot exploit what you cannot see.

Before targeting a system, an attacker must know what is exposed. Nmap answers the foundational questions of the reconnaissance phase:

- Which hosts are alive.
- Which ports are open.
- What services and versions run on them.
- What operating system is present.
- Where firewalls sit and how they filter.
- Which of the exposed services carry known vulnerabilities.

**What separates a professional from an amateur** is not knowing that Nmap exists, but understanding what each scan does at the packet level, why it behaves as it does against a firewall, and how to scan with purpose rather than blasting a target with noise. That depth is the subject of this sheet.

## 2. The TCP Handshake and Port States

Every TCP scan type is a variation on manipulating the TCP handshake. Understanding the handshake explains why each scan behaves the way it does.

### The three-way handshake

A normal TCP connection opens in three steps:

```text
Client  ──SYN──▶        Server     "I want to connect"
Client  ◀─SYN/ACK──     Server     "Acknowledged, and I want to connect too"
Client  ──ACK──▶        Server     "Acknowledged, connection established"
```

Scans exploit this by sending selected packets from the sequence and reading what comes back. The response, or the absence of one, reveals the port state.

### How responses map to state

| Probe sent | Response | Meaning |
|------------|----------|---------|
| SYN | SYN/ACK | Port is **open**, a service is listening |
| SYN | RST | Port is **closed**, nothing listening |
| SYN | No response, or ICMP unreachable | Port is **filtered**, a firewall dropped it |

### Port states in Nmap

| State | Meaning |
|-------|---------|
| **open** | A service is actively listening and accepted the probe |
| **closed** | The host responded but nothing is listening on that port |
| **filtered** | A firewall or filter dropped the probe; Nmap cannot tell open from closed |
| **unfiltered** | Reachable but state undetermined, seen in ACK scans |
| **open\|filtered** | Nmap cannot distinguish the two, common in UDP and stealth scans |

**The distinction that matters most** is closed versus filtered. A **closed** port actively refuses with a RST, proving the host is reachable and simply has nothing there. A **filtered** port gives silence, meaning a firewall dropped the packet and Nmap learns nothing about the port behind it. That difference is the basis of firewall mapping.

## 3. Standard vs Advanced Scans

**A standard scan** determines whether ports are open. The default SYN or Connect scan answers "what is listening here," and for most straightforward enumeration that is enough.

**An advanced scan** is crafted to answer a more specific question, or to behave differently against defenses. The difference is one of **intent and technique**, not merely of flags.

| | Standard scan | Advanced scan |
|---|---------------|---------------|
| **Goal** | Find open ports | Map firewalls, evade detection, probe specific behavior |
| **Packets** | Standard SYN or full connect | Crafted flag combinations (ACK, FIN, NULL, Xmas) |
| **Question answered** | What is open? | How is this filtered? What gets past the firewall? Can I stay quiet? |
| **Against a firewall** | May simply report filtered | Designed to extract information from how the firewall responds |
| **Detectability** | Normal, visible | Often designed to reduce or shape the signature |

Advanced scans exist because real networks have firewalls, intrusion detection, and stateful filtering. A standard scan that returns "filtered" for everything tells you little. An ACK scan against the same target reveals the firewall's rules. A FIN scan may slip past a filter that only watches for SYN. The advanced techniques turn obstacles into information.

## 4. TCP Connect vs SYN Scan

The two ways to check a TCP port, and the difference between them is fundamental.

### SYN scan (-sS)

Also called the half-open scan. It is the default when Nmap runs with root privileges.

```bash
sudo nmap -sS target
```

**How it works:** Nmap sends a SYN, and reads the reply. If it receives SYN/ACK the port is open, but Nmap then sends a **RST to tear the connection down before it completes**, rather than replying with the final ACK. The handshake is never finished.

```text
Nmap  ──SYN──▶       Target
Nmap  ◀─SYN/ACK──    Target     (port open)
Nmap  ──RST──▶       Target     (abort before completing)
```

**Why it is preferred:**
- **Faster:** it never completes the handshake, so it does less work per port.
- **Quieter:** because no full connection is established, the target application often never logs the connection. Historically this earned it the "stealth scan" name.
- **Requires root:** crafting raw SYN packets needs elevated privileges.

### Connect scan (-sT)

```bash
nmap -sT target
```

**How it works:** Nmap completes the **full three-way handshake** using the operating system's normal connection call, then closes the connection. It behaves exactly like a normal application connecting.

**When it is used:**
- **No root privileges.** Without root, Nmap cannot craft raw packets and falls back to this automatically.
- It is the only option in some restricted environments.

**The trade-off:** because it completes the connection, the target application **sees and logs a full connection**, making it noisier and more likely to appear in application logs.

### The core difference

| | SYN scan (-sS) | Connect scan (-sT) |
|---|----------------|--------------------|
| **Handshake** | Half-open, aborted with RST | Full, completed then closed |
| **Privileges** | Requires root | Works without root |
| **Speed** | Faster | Slower |
| **Logging** | Often unlogged by the application | Logged as a full connection |
| **Mechanism** | Raw crafted packets | OS connection call |

In short: the SYN scan never finishes the handshake, which makes it faster and quieter. The Connect scan finishes it, which makes it work without root but leaves a clearer trace.

## 5. ACK Scan and Firewall Mapping

The ACK scan does not find open ports. Its purpose is to **map firewall rules**, and understanding it is a common objective.

```bash
sudo nmap -sA target
```

**How it works:** Nmap sends a lone **ACK packet**, which pretends to be part of an already-established connection. Since no such connection exists, the response reveals how the network filters traffic:

```text
Nmap  ──ACK──▶       Target
Nmap  ◀─RST──        Target     → unfiltered (the packet reached the host)
Nmap  ──ACK──▶       Target
Nmap  ✕ (no reply)   Target     → filtered (a stateful firewall dropped it)
```

| Response to the ACK | Interpretation |
|---------------------|----------------|
| **RST returned** | The port is **unfiltered**. The packet passed through to the host, which replied RST because there is no connection |
| **No response, or ICMP unreachable** | The port is **filtered**. A stateful firewall dropped the unexpected ACK |

**Why this maps the firewall:** a **stateful firewall** tracks connections and drops ACK packets that do not belong to any known connection, so filtered ports mark where the firewall is enforcing rules. A port that returns RST is not being filtered for that traffic. By scanning a range with an ACK scan, you learn **which ports the firewall protects and which it lets through**, independent of whether a service is actually listening. The ACK scan tells you about the firewall, not the service.

## 6. FIN, NULL, and Xmas Scans

These three are the **stealth scans**. They share one mechanism and one purpose: to determine port state using unusual flag combinations that can slip past filters watching only for SYN packets.

### The shared mechanism

All three exploit a rule in the TCP specification: a compliant system that receives a packet with no SYN, RST, or ACK flag set should reply with **RST if the port is closed**, and **nothing if the port is open**. This inverts the usual logic.

```text
Probe (odd flags)  ──▶  closed port  →  RST returned
Probe (odd flags)  ──▶  open port    →  no response
```

| Scan | Flag | Flags set on the probe |
|------|------|------------------------|
| **FIN** (-sF) | `-sF` | FIN only |
| **NULL** (-sN) | `-sN` | No flags at all |
| **Xmas** (-sX) | `-sX` | FIN, PSH, and URG (the packet is "lit up like a Christmas tree") |

```bash
sudo nmap -sF target        # FIN scan
sudo nmap -sN target        # NULL scan
sudo nmap -sX target        # Xmas scan
```

### How to read the result

| Response | Port state |
|----------|-----------|
| **RST** | **closed** |
| **No response** | **open\|filtered** (open, or a firewall dropped the probe) |
| **ICMP unreachable** | **filtered** |

Note the result is `open|filtered`, not a clean "open." Because open ports simply stay silent, Nmap cannot distinguish a truly open port from one where a firewall ate the probe. Silence is ambiguous.

### Why and when they are used

- **Evasion:** a simple firewall or packet filter configured to block incoming SYN packets may not inspect for FIN, NULL, or Xmas packets, so these scans can pass through where a SYN scan is blocked.
- **Bypassing stateless filters:** they target older or simpler filtering that only reasons about connection initiation.

### The major limitation

These scans **rely on the target following the TCP specification exactly**, and many systems do not. **Windows, in particular, sends RST for every probe regardless of port state**, which makes every port appear closed and renders these scans useless against it. They are most reliable against compliant Unix-like network stacks, and their results always need corroboration.

## 7. UDP Scanning

TCP scans miss everything running on UDP, and critical services live there: DNS, SNMP, DHCP, NTP, and more.

```bash
sudo nmap -sU target
sudo nmap -sU --top-ports 20 target        # scoped, since UDP is slow
```

**How it works:** Nmap sends a UDP packet and interprets the response:

| Response | State |
|----------|-------|
| UDP response returned | **open** |
| ICMP port unreachable | **closed** |
| No response | **open\|filtered** |
| Other ICMP unreachable errors | **filtered** |

**Why UDP scanning is slow:** UDP is connectionless, so there is no handshake to confirm a port quickly. Open ports frequently send nothing back, forcing Nmap to wait for timeouts and retransmit before concluding anything. A full UDP scan can take a very long time, which is why scoping it with `--top-ports` is standard practice. Skipping UDP entirely, though, leaves a real part of the attack surface unseen.

## 8. Scan Type Reference

Consolidated, with the mechanism and purpose of each.

| Flag | Scan | Mechanism | Primary purpose |
|------|------|-----------|-----------------|
| `-sS` | SYN | Half-open, aborts before completing | Fast, quiet default port scan |
| `-sT` | Connect | Full handshake via OS | Scanning without root |
| `-sU` | UDP | UDP probe, reads ICMP | Finding UDP services |
| `-sA` | ACK | Lone ACK packet | Mapping firewall rules |
| `-sF` | FIN | FIN flag only | Stealth, evading SYN filters |
| `-sN` | NULL | No flags | Stealth, evading SYN filters |
| `-sX` | Xmas | FIN, PSH, URG | Stealth, evading SYN filters |
| `-sW` | Window | Examines TCP window in RST | Distinguishing open from closed on some systems |
| `-sn` | Ping | Host discovery only | Finding live hosts without port scanning |

## 9. The Nmap Scripting Engine

The Nmap Scripting Engine (NSE) is what turns Nmap from a port scanner into a full reconnaissance and vulnerability-assessment platform. It is one of the tool's most important capabilities.

**What it is:** a framework that runs scripts written in the **Lua** programming language to perform tasks far beyond basic scanning. Nmap ships with a library of hundreds of scripts.

**Why it matters:** a port scan tells you a port is open and what version runs there. NSE goes further, and can:

- Detect specific known vulnerabilities on a service.
- Enumerate details: users, shares, DNS records, certificates.
- Perform brute-force authentication attempts.
- Pull banners, HTTP titles, and configuration details.
- Discover additional hosts and services.

**How it works:** after Nmap has discovered hosts, ports, and services, NSE runs the selected scripts against the relevant open ports. Each script declares a **rule** determining when it should run, for example only against port 443, or only when an HTTP service is detected. Nmap matches each script's rule against the scan results and executes only those that apply, so an SMB script does not waste time running against a web server.

```bash
nmap -sC target                       # run the default script set
nmap --script vuln target             # run vulnerability-detection scripts
nmap -p 443 --script ssl-cert target  # run one specific script
```

## 10. NSE Script Categories

Scripts are grouped into categories so you can run a whole class at once. Knowing the categories is a common objective.

| Category | Purpose |
|----------|---------|
| **auth** | Authentication handling, checking credentials and bypasses |
| **broadcast** | Discovering hosts by broadcasting on the local network |
| **brute** | Brute-force guessing of credentials |
| **default** | The standard safe set, run with `-sC` or `--script default` |
| **discovery** | Actively gathering more information about the network and services |
| **dos** | Testing susceptibility to denial of service (can crash targets) |
| **exploit** | Actively attempting to exploit a vulnerability |
| **external** | Scripts that send data to a third-party service (for example, a whois lookup) |
| **fuzzer** | Sending unexpected input to find flaws |
| **intrusive** | Scripts that carry real risk of disrupting the target |
| **malware** | Detecting malware and backdoors on the target |
| **safe** | Scripts designed not to disrupt the target |
| **version** | Extending service and version detection |
| **vuln** | Checking for specific known vulnerabilities |

**The safe versus intrusive distinction matters most in practice.** `safe` scripts are unlikely to cause harm. `intrusive`, `dos`, and `exploit` scripts can crash services, lock accounts, or disrupt operations, and must only be run with authorization and awareness of the risk. Running `--script vuln` includes intrusive checks, so it is not a passive action.

## 11. Running and Organizing NSE Scripts

### The command-line arguments

| Argument | Function |
|----------|----------|
| `-sC` | Run the `default` category (shortcut for `--script default`) |
| `--script <name>` | Run a named script |
| `--script <category>` | Run an entire category |
| `--script "expression"` | Run scripts matching a boolean expression |
| `--script-args <args>` | Pass arguments to scripts |
| `--script-help <name>` | Show a script's documentation without running it |
| `--script-updatedb` | Rebuild the script database |

### Selection patterns

```bash
nmap -sC target                              # default scripts
nmap --script vuln target                    # a whole category
nmap --script "http-*" target                # wildcard: all HTTP scripts
nmap --script "default and safe" target      # boolean: in both sets
nmap --script "not intrusive" target         # everything except intrusive
nmap --script smb-os-discovery target        # a single named script
nmap --script http-title --script-args http.useragent="Mozilla" target
```

Boolean expressions with `and`, `or`, and `not`, combined with wildcards, let you target exactly the right scripts. `"not intrusive"` is a common way to run broadly while excluding risky checks.

### How scripts are organized on disk

Scripts live as `.nse` files in Nmap's scripts directory, typically `/usr/share/nmap/scripts/`. A database file, `script.db`, indexes them by category so Nmap can resolve category names to scripts quickly.

```bash
ls /usr/share/nmap/scripts/              # list installed scripts
nmap --script-help "ssl-*"               # read documentation for a set
```

## 12. Writing NSE Scripts and NSEDoc

NSE scripts are written in **Lua**. A script is structured around a few required and optional fields.

### The anatomy of a script

| Field | Purpose |
|-------|---------|
| **description** | A human-readable explanation of what the script does |
| **categories** | The categories the script belongs to, controlling when it runs in bulk selection |
| **author** | The script's author |
| **license** | The license, usually the same as Nmap |
| **The rule** | A function (`portrule`, `hostrule`, `prerule`, or `postrule`) that returns true when the script should run |
| **The action** | The function containing the logic that executes when the rule matches |

The **rule** decides *whether* to run (for example, "only on open port 443"), and the **action** defines *what to do* when it does.

### NSEDoc

NSEDoc is the documentation system for NSE scripts, comparable to documentation generators for other languages. It parses specially formatted comments in the script source to produce standardized reference documentation.

Key NSEDoc tags placed in comment blocks:

| Tag | Documents |
|-----|-----------|
| `@description` | What the script does (often the `description` field) |
| `@usage` | An example command showing how to run it |
| `@args` | The arguments the script accepts |
| `@output` | An example of the script's output |
| `@param` | A parameter to a function |
| `@return` | A function's return value |

Well-documented scripts use these tags so that `--script-help` and the online NSE documentation portal display consistent, usable reference material. Writing NSEDoc comments is what makes a script maintainable and shareable rather than a private one-off.

## 13. Stealth and IDS Evasion

Beyond the stealth scan types, Nmap offers techniques to shape or reduce a scan's signature against intrusion detection and prevention systems.

### Timing control

The single most effective evasion lever is slowing down, since IDS systems often trigger on the rate of probes.

| Template | Behavior | Use |
|----------|----------|-----|
| `-T0` Paranoid | Minutes between probes | Serious IDS evasion |
| `-T1` Sneaky | Slow | Stealthy |
| `-T2` Polite | Reduced rate | Light footprint |
| `-T3` Normal | Default | Standard |
| `-T4` Aggressive | Fast | Stable networks, authorized work |
| `-T5` Insane | Very fast | Loud, may miss results |

```bash
nmap -T1 target                        # slow to stay under detection thresholds
nmap --scan-delay 1s target            # fixed delay between probes
nmap --max-rate 10 target              # cap the packet rate
```

### Packet-level techniques

```bash
nmap -f target                         # fragment packets to slip past simple inspection
sudo nmap -D RND:10 target             # decoys: hide the real source among 10 fakes
sudo nmap -D 10.0.0.5,ME,10.0.0.6 target   # specific decoys, ME = your position
sudo nmap --source-port 53 target      # spoof source port (53 is often trusted)
nmap --data-length 50 target           # pad packets to alter their signature
sudo nmap --spoof-mac Cisco target     # spoof the MAC vendor (LAN only)
nmap --randomize-hosts target-range    # randomize host scan order
```

| Technique | Effect |
|-----------|--------|
| **Fragmentation (-f)** | Splits probes across packets to evade simple signature matching |
| **Decoys (-D)** | Makes the scan appear to come from multiple sources, hiding the real one |
| **Source port spoofing** | Disguises probes as traffic from a trusted port such as DNS |
| **Data padding** | Changes packet size to defeat length-based signatures |
| **MAC spoofing** | Alters the apparent hardware vendor, on the local segment only |

> **The honest limit:** modern IDS and IPS detect most of these techniques. They buy time and raise the effort required to spot a scan, but they do **not** provide invisibility. Treat evasion as reducing your signature, not erasing it. On an authorized test, the value is in demonstrating what the defenses do and do not catch.

## 14. Correlating Findings with Vulnerabilities

Enumeration produces a list of services and versions. The value comes from turning that into a list of likely vulnerabilities.

### Version detection is the pivot

```bash
nmap -sV target                        # detect service versions
nmap -sV --version-intensity 9 target  # maximum probing
```

A version is the bridge to a known vulnerability. "Port 80 open" is a fact. "Apache 2.4.49" is intelligence, because it maps to specific published CVEs.

### From version to vulnerability

```bash
nmap -sV --script vuln target          # NSE checks for known vulnerabilities
```

The NSE `vuln` category cross-references detected services against known-vulnerability checks and reports likely candidates. Scripts such as `vulners` map version banners directly to CVE identifiers.

### Verify before believing

Scanners report **potential** vulnerabilities from version banners, and banners lie. A distribution may **backport** a security fix while leaving the version string unchanged, so the service looks vulnerable but is patched. This produces false positives. Every finding needs manual confirmation, cross-referencing the actual service against the CVE details, before it is treated as real or acted upon.

```bash
searchsploit <service> <version>       # check whether public exploit code exists
```

The correlation chain is: **detect the version, map it to candidate CVEs, verify the service is genuinely affected, then check whether a working exploit exists.**

## 15. What Enumeration Reveals

An advanced scan builds a detailed picture of a network. Pulling the threads together, a thorough enumeration can reveal:

| Discovered | How | Value |
|------------|-----|-------|
| **Live hosts** | Host discovery | The real scope of the network |
| **Open ports** | Port scanning | Services that are listening |
| **Port states** | Response analysis | Open, closed, or filtered, revealing filtering |
| **Services and versions** | `-sV` | The software running, and its exact version |
| **Operating systems** | `-O` | Platform, narrowing the vulnerability set |
| **Firewall rules** | ACK scan | Which ports are filtered and which pass |
| **Network topology** | `--traceroute` | The path and structure between you and the target |
| **Device types** | OS and service detection | Routers, printers, servers, and more |
| **Vulnerabilities** | NSE `vuln` scripts | Candidate known weaknesses |
| **Configuration detail** | NSE enumeration scripts | Shares, certificates, users, banners |

Together this maps the attack surface: where the hosts are, what they run, how they are defended, and where they are likely weak.

## 16. Reporting

A scan that is not documented is not useful to anyone else. Professional engagements require the findings to be captured and communicated.

### Save output in machine-readable formats

```bash
nmap -oA scan target                   # all formats at once (recommended)
nmap -oN scan.txt target               # human-readable
nmap -oX scan.xml target               # XML, for parsing and tooling
nmap -oG scan.gnmap target             # greppable
```

`-oA` writes all formats simultaneously, which is the standard practice for any scan worth keeping. XML feeds reporting tools; greppable output suits quick command-line filtering.

### What a professional report includes

- **Scope and authorization:** what was tested, when, and under what permission.
- **Methodology:** the scan types and techniques used, so the work is reproducible.
- **Findings:** hosts, open ports, services, and versions, with the evidence.
- **Vulnerabilities:** each candidate weakness with its severity and the service affected.
- **Risk and impact:** what each finding means in practice, in terms the reader can act on.
- **Recommendations:** specific remediation for each issue.
- **Raw evidence:** the scan output, in an appendix.

The goal is a document that another professional can follow, that a defender can act on, and that a non-technical stakeholder can understand at the summary level. A scan is data; a report is intelligence.

## 17. Legal and Ethical Boundaries

Scanning is the point where legal exposure becomes real, because it sends traffic to systems that may not be yours.

### The core rule

Port scanning a system you do not own, without explicit authorization, may be **illegal** regardless of intent. Laws including the United States Computer Fraud and Abuse Act, the United Kingdom Computer Misuse Act, and equivalents worldwide criminalize unauthorized access and, in many readings, unauthorized scanning. Consequences include criminal prosecution and civil liability.

### What authorization requires

- **Written permission** from the system owner, naming the tester and the scope.
- **A defined scope:** the exact hosts and ranges permitted, and those excluded.
- **Awareness that scope is narrower than a domain.** A target behind a **CDN or shared host** resolves to infrastructure owned by a third party, and scanning that address attacks the provider, not the client. Confirm the origin is owned and in scope.
- **Rules of engagement:** permitted techniques, timing windows, and prohibited actions.

### Why legitimate scanning matters

Nmap is also a defensive tool. Organizations scan their own networks to find exposed ports before attackers do, to verify firewall rules, to inventory services, and to confirm that only intended ports are reachable. The same technique that maps a target defensively secures a network when applied to one's own systems with authority.

### Safe practice targets

Learn the tool legally against systems provided for it: your own machines, **scanme.nmap.org** (Nmap's official practice host), and dedicated labs such as **Hack The Box**, **TryHackMe**, and downloadable vulnerable VMs. Outside explicit authorization, these are the only lawful targets.

## 18. Operational Notes

- **Every scan type is a manipulation of the TCP handshake.** Understanding the handshake explains why each behaves as it does.
- **Closed versus filtered is the key distinction.** Closed replies with RST and proves reachability; filtered is silence caused by a firewall.
- **SYN scan is half-open and quiet; Connect scan completes and is logged.** The SYN scan needs root; the Connect scan is the no-root fallback.
- **The ACK scan maps firewalls, not open ports.** RST means unfiltered, silence means a stateful firewall dropped it.
- **FIN, NULL, and Xmas share one mechanism:** odd flags, RST from closed ports, silence from open ones. They evade SYN-only filters.
- **Stealth scans fail against Windows,** which sends RST regardless of port state, so their results always need corroboration.
- **UDP is slow but hides real services.** DNS, SNMP, and DHCP live there. Scope it with `--top-ports`.
- **NSE runs scripts by matching each script's rule to the scan results,** so only relevant scripts execute against a given port.
- **Safe versus intrusive is the category distinction that matters.** `vuln`, `exploit`, and `dos` scripts can disrupt a target.
- **Version detection is the pivot to vulnerabilities,** but banners can be backported, so verify before believing.
- **Evasion reduces a signature, it does not grant invisibility.** Modern IDS detects most techniques.
- **Save every scan with `-oA`,** and remember a scan is only intelligence once it is reported.
- **Authorization is mandatory, and scope is narrower than the domain.** A CDN address belongs to someone else.

## 19. Fast Recall

- **The TCP handshake is SYN, SYN/ACK, ACK.** Scans send parts of it and read the response.
- **SYN/ACK means open, RST means closed, silence means filtered.**
- **-sS SYN scan:** half-open, aborts with RST, fast, quiet, needs root.
- **-sT Connect scan:** full handshake, logged by the application, works without root.
- **-sA ACK scan:** maps firewall rules. RST returned is unfiltered; no reply is filtered by a stateful firewall.
- **-sF, -sN, -sX (FIN, NULL, Xmas):** odd flags. Closed ports send RST, open ports stay silent, giving open|filtered. Evade SYN filters, but fail against Windows.
- **-sU UDP scan:** finds DNS, SNMP, DHCP. Slow because open ports often send nothing back.
- **Port states:** open, closed, filtered, unfiltered, open|filtered.
- **NSE runs Lua scripts** after service detection, each with a rule deciding when it runs.
- **Key NSE categories:** default, safe, intrusive, vuln, exploit, brute, discovery, auth. `vuln` and `exploit` can disrupt.
- **NSE arguments:** `-sC` (default set), `--script <name/category>`, `--script-args`, `--script-help`.
- **NSEDoc** documents scripts via tagged comments (`@description`, `@usage`, `@args`, `@output`).
- **Evasion:** `-T0/-T1` slow timing, `-f` fragment, `-D` decoys, source-port spoofing. Reduces signature, not invisibility.
- **-sV version detection is the pivot to CVEs;** verify against backported patches before believing a finding.
- **Save with -oA.** Report scope, method, findings, vulnerabilities, and recommendations.
- **Scanning without written authorization is a crime.** Practice on scanme.nmap.org, Hack The Box, and TryHackMe.

## 20. Resources

**Official documentation**
- [Nmap Reference Guide](https://nmap.org/book/man.html)
- [Nmap: Port Scanning Techniques](https://nmap.org/book/man-port-scanning-techniques.html)
- [Nmap Scripting Engine documentation](https://nmap.org/book/nse.html)
- [NSE script categories](https://nmap.org/book/nse-usage.html#nse-categories)
- [NSEDoc reference portal](https://nmap.org/nsedoc/)
- [Writing NSE scripts](https://nmap.org/book/nse-tutorial.html)

**Scan and firewall detail**
- [Nmap: Firewall/IDS evasion and spoofing](https://nmap.org/book/man-bypass-firewalls-ids.html)
- [Nmap: TCP FIN, NULL, and Xmas scans](https://nmap.org/book/scan-methods-null-fin-xmas-scan.html)
- [Nmap: TCP ACK scan](https://nmap.org/book/scan-methods-ack-scan.html)
- [Nmap: Service and version detection](https://nmap.org/book/vscan.html)

**Vulnerability correlation**
- [searchsploit / Exploit-DB](https://www.exploit-db.com/searchsploit)
- [NIST National Vulnerability Database](https://nvd.nist.gov/)

**Legal practice**
- [scanme.nmap.org](http://scanme.nmap.org/)
- [Hack The Box](https://www.hackthebox.com/)
- [TryHackMe](https://tryhackme.com/)

---
