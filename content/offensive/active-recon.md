# Active Reconnaissance Tools

> **⚠️ AUTHORIZED USE ONLY.** This material is for education and authorized security testing. Active reconnaissance sends traffic directly to target systems and **is detectable and logged**. Running these tools against systems you do not own or lack **explicit written permission** to test is unauthorized access and is a criminal offence in most jurisdictions, including under the Computer Fraud and Abuse Act, the Computer Misuse Act, and equivalent laws. Practice only against systems you own or dedicated legal labs. You are solely responsible for how you use this. See the [Legal and Terms of Use](/legal) page.

> **Scope:** Directly interacting with a target's systems to enumerate hosts, ports, services, and content. Structured as a workflow: where to start, what to run, and what to reach for when a tool comes up short. **Read Section 1 before running anything.**

---

## Table of Contents
- [Authorization First](#authorization-first)
- [The Passive vs Active Boundary](#the-passive-vs-active-boundary)
- [Workflow Overview](#workflow-overview)
- [Scenario](#scenario)
- [Stage 1: Host Discovery](#stage-1-host-discovery)
- [Stage 2: Port Scanning](#stage-2-port-scanning)
- [Stage 3: Service and Version Detection](#stage-3-service-and-version-detection)
- [Stage 4: Web Enumeration](#stage-4-web-enumeration)
- [Stage 5: DNS Active Enumeration](#stage-5-dns-active-enumeration)
- [Stage 6: Vulnerability Identification](#stage-6-vulnerability-identification)
- [Tool Fallback Reference](#tool-fallback-reference)
- [Operational Notes](#operational-notes)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Authorization First

Active reconnaissance is the point where legal exposure becomes real. Passive recon reads what others published. Active recon **sends packets to the target**, appears in their logs, and triggers their alerts. Without authorization, it is a crime.

### Before any active tool runs

| Requirement | What it means |
|-------------|---------------|
| **Written authorization** | Explicit, signed permission naming you and the scope. Verbal is not enough |
| **Defined scope** | The exact domains, IP ranges, and hosts you may touch, and which are excluded |
| **Rules of engagement** | Permitted techniques, forbidden actions, testing windows, rate limits |
| **Points of contact** | Who to notify on discovering a critical issue or causing disruption |
| **Data handling** | How findings are stored, transmitted, and destroyed |

### Scope is narrower than it looks

- **A domain in scope does not mean its IP is in scope.** If the target sits behind a **CDN or shared host**, scanning that IP hits infrastructure the target does not own. You would be attacking Cloudflare or a hosting provider, not your client. Confirm the origin is owned and in scope before scanning it.
- **Subdomains may resolve to third parties.** A `status.` subdomain often points to a SaaS provider. In scope for the domain, out of scope for the IP.
- **Cloud-hosted targets** may require the cloud provider's own authorization in addition to the client's, depending on the test type and provider policy.

### Safe places to practice

Use these to learn the tools legally, with no authorization needed beyond their own terms:

| Target | Purpose |
|--------|---------|
| **Systems you own** | Your own VMs and lab networks |
| **scanme.nmap.org** | Nmap's official host, explicitly provided for scan practice |
| **Hack The Box, TryHackMe** | Dedicated legal lab environments |
| **OWASP Juice Shop, DVWA** | Deliberately vulnerable web apps, run locally |
| **VulnHub** | Downloadable vulnerable VMs for a home lab |

> **The absolute rule:** if you do not have explicit written permission for a specific target, the only lawful targets are the ones above. There is no grey area here, and "I was just curious" is not a defense.

## 2. The Passive vs Active Boundary

The dividing rule used throughout this material:

> **Passive:** no packets originate from your machine to infrastructure the target controls. Information comes from third parties, public records, and archives.
> **Active:** your machine interacts directly with the target's systems.

Active reconnaissance is detectable because every packet you send can be logged, rate-limited, blocked, and alerted on by the target's defenses.

### The grey zone

The boundary is not always clean. These cases cause the most confusion:

| Activity | Classification | Reason |
|----------|---------------|--------|
| Viewing the target's website in a browser | Treated as passive | Indistinguishable from a normal visitor |
| WHOIS and DNS lookups via public resolvers | Passive | The query goes to a registry or resolver, not the target |
| Querying Shodan or Censys | Passive for you | They did the scanning; you read stored results |
| DNS zone transfer attempt | **Active** | Connects directly to the target's name server |
| Subdomain brute-force | **Active** | Generates DNS queries against target infrastructure |
| Port scanning | **Active** | Sends packets directly to target hosts |
| Web directory brute-force | **Active** | Sends many requests to the target web server |

**When uncertain, treat it as active** and confirm authorization before proceeding.

## 3. Workflow Overview

Active recon narrows from a broad host sweep down to specific services and their weaknesses. It typically **begins where passive recon ended**, using the passive map to target scanning precisely rather than blindly.

```text
Authorized scope (confirmed owned IPs and hosts)
    │
    ▼
[1] Host discovery          nmap -sn → which hosts are alive
    │
    ▼
[2] Port scanning           nmap → which ports are open
    │
    ▼
[3] Service & version       nmap -sV → what runs on each port
    │
    ▼
[4] Web enumeration         gobuster, nikto → paths, files, server issues
    │
    ▼
[5] DNS active enum         zone transfer, brute-force → more hosts
    │
    ▼
[6] Vulnerability ID        nmap scripts, scanners → likely weaknesses
```

**The guiding principle:** be precise and proportionate. Active traffic is detectable and can disrupt fragile systems, so scan what the passive map identified rather than blasting broad ranges. Loud, blind scanning gets blocked and can break things.

## 4. Scenario

**A worked active engagement.** You now hold written authorization to actively test `example-corp.com`, with a defined scope: the confirmed owned netblock `203.0.113.0/24` and named subdomains. The main site behind the CDN is explicitly **out of scope**, so you target only the origin ranges the passive phase confirmed the company owns.

This is an independent scenario from the passive sheet, using the same stage-by-stage structure: command, what it reveals, and where to turn when the primary tool falls short.

## 5. Stage 1: Host Discovery

**Goal:** determine which hosts in the authorized range are alive before scanning ports, so effort focuses on real systems.

### Primary: nmap ping sweep

```bash
nmap -sn 203.0.113.0/24                    # ping sweep, no port scan
nmap -sn 203.0.113.0/24 -oA hosts_alive    # save in all formats
```

`-sn` disables port scanning and only checks which hosts respond, a fast, light first pass.

### When hosts block ping

Many hosts drop ICMP, appearing dead when they are not. Force discovery another way:

```bash
nmap -sn -PS22,80,443 203.0.113.0/24       # TCP SYN to common ports
nmap -sn -PA80 203.0.113.0/24              # TCP ACK ping
nmap -Pn 203.0.113.10                      # skip discovery, assume host is up
```

`-Pn` treats every host as alive and scans regardless. Slower, but it catches hosts that suppress ping entirely.

### Fallback chain

| If | Then try | Why |
|----|----------|-----|
| Nmap ping sweep finds nothing | **nmap -Pn** | Hosts may block ICMP but still run services |
| You want a faster sweep of a large range | **masscan**, **fping** | Built for speed across big ranges |
| ICMP is filtered | **-PS / -PA** (TCP discovery) | Probes ports instead of relying on ping |
| You need ARP on a local segment | **arp-scan**, **netdiscover** | Layer 2 discovery, reliable on the same LAN |

**Scenario result:** the sweep finds 6 live hosts in the range. Two responded only to TCP SYN on port 443, not to ping, and would have been missed by an ICMP-only sweep.

## 6. Stage 2: Port Scanning

**Goal:** find open ports on the live hosts. Open ports are the doors; this is the core of active recon.

### Primary: nmap

```bash
nmap 203.0.113.10                          # top 1000 ports, default
nmap -p- 203.0.113.10                      # all 65535 ports, thorough
nmap -p 22,80,443,8080 203.0.113.10        # specific ports, fast
nmap --top-ports 100 203.0.113.10          # 100 most common, quick
nmap -F 203.0.113.10                       # fast scan, top 100
```

### Scan types

| Flag | Scan | Note |
|------|------|------|
| `-sS` | SYN scan | Default with root, fast, does not complete the handshake |
| `-sT` | Connect scan | Full handshake, used without root, more logged |
| `-sU` | UDP scan | Slow but finds DNS, SNMP, and other UDP services others miss |

### Timing and stealth

```bash
nmap -T4 203.0.113.10                       # faster, fine for most authorized tests
nmap -T2 203.0.113.10                       # slower, lighter footprint
```

`-T0` and `-T1` are very slow evasion timings; `-T3` is default; `-T4` is a good balance for authorized work; `-T5` is aggressive and may overwhelm fragile hosts.

### Fallback chain

| If | Then try | Why |
|----|----------|-----|
| Nmap is too slow on a wide range | **masscan** | Scans huge ranges in minutes, then confirm with nmap |
| You want a modern, fast alternative | **rustscan** | Finds ports fast, then pipes into nmap for detail |
| A firewall drops SYN scans | **-sT** (connect) or **-sA** (ACK) | Different scan types behave differently against filters |
| You need UDP services | **nmap -sU --top-ports 20** | UDP is slow, so scope it to common ports |

> **Practical pattern:** many testers use masscan or rustscan for speed to find open ports across a range, then hand those specific ports to nmap for accurate service detection. Fast discovery, accurate enrichment.

**Scenario result:** the legacy host exposes ports 22, 80, 443, and an unusual 8443. The passive phase had already flagged this host as running an outdated service, and the open 8443 confirms an administrative interface worth investigating.

## 7. Stage 3: Service and Version Detection

**Goal:** identify exactly what software and version runs on each open port. Versions drive everything that follows, since a known version maps to known vulnerabilities.

### Primary: nmap version detection

```bash
nmap -sV 203.0.113.10                       # detect service versions
nmap -sV --version-intensity 9 203.0.113.10 # maximum probing
nmap -sV -O 203.0.113.10                     # add OS detection
nmap -A 203.0.113.10                         # aggressive: -sV, -O, scripts, traceroute
```

`-A` is the all-in-one heavy scan: version, OS, default scripts, and route. Thorough and loud.

### Banner grabbing manually

When you want a raw look without nmap's interpretation:

```bash
nc 203.0.113.10 22                           # netcat, read the banner
curl -I http://203.0.113.10                  # HTTP headers, server software
openssl s_client -connect 203.0.113.10:443   # TLS certificate and details
```

### Fallback chain

| If | Then try | Why |
|----|----------|-----|
| Nmap version detection is unsure | Manual **netcat** / **curl -I** banner grab | Raw banners without interpretation |
| You need web tech specifically | **whatweb**, **wappalyzer** | Identifies frameworks, CMS, and libraries |
| TLS details matter | **openssl s_client**, **sslscan**, **testssl.sh** | Certificate, cipher, and protocol detail |
| OS detection is inconclusive | Combine **-O** with service inference | Service versions often imply the OS |

**Scenario result:** version detection confirms an outdated web server on port 80 and an SSH version tied to a specific distribution release. `whatweb` on 8443 reveals an old admin panel framework with publicly documented vulnerabilities.

## 8. Stage 4: Web Enumeration

**Goal:** for hosts running web services, discover hidden paths, files, and server misconfigurations. This is where most web attack surface actually lives.

### Directory and file discovery

```bash
gobuster dir -u http://203.0.113.10 -w /usr/share/wordlists/dirb/common.txt
feroxbuster -u http://203.0.113.10 -w wordlist.txt        # recursive by default
ffuf -u http://203.0.113.10/FUZZ -w wordlist.txt          # fast, flexible fuzzing
```

### Web server scanning

```bash
nikto -h http://203.0.113.10                # known misconfigurations and outdated software
```

Nikto checks for thousands of known issues: dangerous files, outdated versions, and revealing headers. Loud, but fast and comprehensive for known problems.

### Virtual host discovery

```bash
gobuster vhost -u http://203.0.113.10 -w vhosts.txt        # find name-based vhosts
ffuf -u http://203.0.113.10 -H "Host: FUZZ.example-corp.com" -w wordlist.txt
```

One IP often serves multiple sites by hostname. Vhost discovery finds those not linked anywhere public.

### Fallback chain

| If | Then try | Why |
|----|----------|-----|
| gobuster is missing features | **feroxbuster** (recursive), **ffuf** (flexible) | Recursion and richer filtering |
| Too many false positives | Filter by **status code, size, word count** | Cuts noise from catch-all responses |
| The default wordlist is thin | **SecLists** wordlists | Far larger, purpose-built lists |
| You need parameter discovery | **ffuf** with parameter fuzzing, **arjun** | Finds hidden query and body parameters |
| You want a full proxy workflow | **Burp Suite**, **OWASP ZAP** | Intercept, manipulate, and spider interactively |

**Scenario result:** gobuster finds `/admin`, `/backup`, and an exposed `/.git/` directory on the legacy host. The exposed git directory is significant: it can leak the entire application source. Nikto flags an outdated server version and a directory listing left enabled.

## 9. Stage 5: DNS Active Enumeration

**Goal:** actively query the target's own name servers for records that passive sources missed. This touches target DNS infrastructure directly, which is why it is active.

### Zone transfer attempt

A misconfigured name server may hand over its entire zone, exposing every record at once:

```bash
dig axfr @ns1.example-corp.com example-corp.com
dnsrecon -d example-corp.com -t axfr
```

Rarely succeeds on modern infrastructure, but when it does, it is the single highest-yield DNS finding possible. Always worth one attempt.

### DNS brute-force

When passive subdomain discovery is exhausted and it is in scope:

```bash
dnsrecon -d example-corp.com -D wordlist.txt -t brute
gobuster dns -d example-corp.com -w subdomains.txt
amass enum -active -d example-corp.com       # active mode, includes brute-force
ffuf -u http://example-corp.com -H "Host: FUZZ.example-corp.com" -w wordlist.txt
```

### Fallback chain

| If | Then try | Why |
|----|----------|-----|
| Zone transfer is refused | **DNS brute-force** | The normal outcome; brute-force fills the gap |
| gobuster dns is slow | **massdns**, **puredns** | Built for high-speed DNS resolution |
| You want combined active enum | **amass enum -active** | Brute-force plus permutations and resolution |
| Wildcard DNS causes false hits | Tools with **wildcard filtering** (puredns) | Wildcards make every subdomain appear to resolve |

**Scenario result:** the zone transfer is refused, as expected. Active brute-force against the name servers finds `internal-vpn.example-corp.com` and `backup.example-corp.com`, neither of which appeared in certificate logs, expanding the surface beyond what passive recon alone revealed.

## 10. Stage 6: Vulnerability Identification

**Goal:** map the enumerated services and versions to likely vulnerabilities. This bridges reconnaissance and exploitation, and is the natural end of the recon phase.

### Nmap scripting engine

```bash
nmap --script vuln 203.0.113.10              # run known-vulnerability scripts
nmap --script default 203.0.113.10           # safe default scripts (same as -sC)
nmap --script "http-*" 203.0.113.10          # category-specific scripts
nmap -sV --script vulners 203.0.113.10       # map versions to known CVEs
```

The `vulners` script cross-references detected versions against a CVE database, turning version detection directly into a list of candidate vulnerabilities.

### Dedicated scanners

```bash
nikto -h http://203.0.113.10                 # web server issues
```

Larger platforms such as **OpenVAS/Greenbone** and **Nessus** run comprehensive authenticated and unauthenticated checks, and are appropriate where scope and authorization allow heavier scanning.

### Manual verification matters

Scanners report **potential** vulnerabilities based on version banners. A reported CVE may be patched via backport while the banner still shows the old version, producing a false positive. Every finding needs manual confirmation before it is treated as real, and certainly before any exploitation attempt.

### Fallback chain

| If | Then try | Why |
|----|----------|-----|
| nmap vuln scripts are thin | **nuclei** with community templates | Large, current template library, very fast |
| You need web-specific depth | **nikto**, then **Burp** / **ZAP** | Automated breadth, then manual depth |
| You want full infrastructure scanning | **OpenVAS/Greenbone**, **Nessus** | Comprehensive, though heavier and noisier |
| A version looks vulnerable | **searchsploit**, **Exploit-DB** | Find whether a public exploit exists for that version |

**Scenario result:** `nmap --script vuln` and `nuclei` both flag the outdated web server and the old admin framework on 8443 as carrying known CVEs. `searchsploit` confirms public exploit code exists for the admin framework version. Combined with the exposed `/.git/` directory, this host is the clear priority, and the recon phase has produced a concrete, evidenced path forward for the authorized engagement.

## 11. Tool Fallback Reference

Primary tool first, alternates in order of when to reach for them.

| Task | Primary | Fallback 1 | Fallback 2 |
|------|---------|-----------|-----------|
| Host discovery | nmap -sn | nmap -Pn | masscan / fping |
| Local segment discovery | arp-scan | netdiscover | nmap -PR |
| Port scanning | nmap | rustscan | masscan |
| Fast wide-range scan | masscan | rustscan | nmap -T4 -F |
| Version detection | nmap -sV | netcat / curl -I | whatweb |
| Web tech fingerprint | whatweb | wappalyzer | curl -I |
| TLS inspection | testssl.sh | sslscan | openssl s_client |
| Directory brute-force | gobuster | feroxbuster | ffuf |
| Web server scan | nikto | nuclei | Burp / ZAP |
| Virtual hosts | gobuster vhost | ffuf Host fuzzing | (manual) |
| Parameter discovery | ffuf | arjun | Burp |
| Zone transfer | dig axfr | dnsrecon | fierce |
| DNS brute-force | dnsrecon | gobuster dns | amass -active / puredns |
| Vulnerability scan | nmap --script vuln | nuclei | OpenVAS / Nessus |
| Exploit lookup | searchsploit | Exploit-DB | nuclei templates |
| Wordlists | SecLists | dirb lists | rockyou (creds) |

## 12. Operational Notes

- **Authorization is not optional, and scope is not the domain.** Confirm the IP is owned and in scope before scanning. CDN and shared-host addresses belong to someone else.
- **Active recon is logged.** Every packet can be recorded, rate-limited, and alerted on. Assume you are visible.
- **Start from the passive map.** Scan what passive recon identified, not broad blind ranges. Precise is faster, quieter, and safer.
- **ICMP blocking hides live hosts.** Use `-Pn` and TCP discovery when a ping sweep comes up empty.
- **Fast scanner then nmap is the standard pattern.** masscan or rustscan for speed, nmap for accurate service detection.
- **Versions are the pivot.** Service and version detection is what turns open ports into known vulnerabilities.
- **UDP is slow but hides real services.** DNS, SNMP, and others live on UDP and are missed by TCP-only scans.
- **An exposed `/.git/` directory can leak entire source code.** Always test for it during web enumeration.
- **Always attempt one zone transfer.** It usually fails, but success is the highest-yield DNS outcome available.
- **Scanners report potential, not confirmed, vulnerabilities.** Version backports cause false positives. Verify manually before acting.
- **Aggressive timing can break fragile systems.** `-T5` and heavy parallelism may take down old or under-resourced hosts. Match intensity to the target and the rules of engagement.
- **Loud scanning gets blocked.** Overly aggressive scans trip defenses that then block you for the rest of the engagement.

## 13. Fast Recall

- **Active = packets sent directly to the target.** Detectable, logged, and illegal without authorization.
- **Authorization first, and scope is narrower than the domain.** A CDN or shared-host IP is out of scope even if the domain is in.
- **Legal practice targets:** your own systems, scanme.nmap.org, Hack The Box, TryHackMe, Juice Shop, VulnHub.
- **Workflow:** host discovery → port scan → version detection → web enum → DNS active enum → vulnerability ID.
- **nmap -sn** for host discovery. Use **-Pn** when hosts block ICMP.
- **nmap -p-** scans all ports; **--top-ports** and **-F** are the fast options.
- **-sS** SYN scan (root, default), **-sT** connect (no root), **-sU** UDP (slow, finds hidden services).
- **masscan / rustscan for speed, then nmap for accuracy** is the standard pattern.
- **nmap -sV** detects versions; **-A** is the aggressive all-in-one. Versions map to vulnerabilities.
- **gobuster / feroxbuster / ffuf** for directory brute-force; **nikto** for web server issues.
- **An exposed `/.git/` directory can leak full source code.**
- **dig axfr** attempts a zone transfer; DNS brute-force fills the gap when it fails.
- **nmap --script vuln** and **nuclei** identify known vulnerabilities; **searchsploit** finds public exploits.
- **Scanners report potential vulnerabilities.** Backported patches cause false positives. Verify manually.
- **Match scan intensity to the target.** Aggressive timing can break fragile systems and get you blocked.

## 14. Resources

**Scanning**
- [Nmap](https://nmap.org/) and the [Nmap Scripting Engine](https://nmap.org/nsereference/)
- [masscan](https://github.com/robertdavidgraham/masscan)
- [RustScan](https://github.com/RustScan/RustScan)
- [scanme.nmap.org (practice host)](http://scanme.nmap.org/)

**Web enumeration**
- [gobuster](https://github.com/OJ/gobuster)
- [feroxbuster](https://github.com/epi052/feroxbuster)
- [ffuf](https://github.com/ffuf/ffuf)
- [Nikto](https://github.com/sullo/nikto)
- [WhatWeb](https://github.com/urbanadventurer/WhatWeb)
- [nuclei](https://github.com/projectdiscovery/nuclei)

**DNS**
- [dnsrecon](https://github.com/darkoperator/dnsrecon)
- [puredns](https://github.com/d3mondev/puredns)
- [amass](https://github.com/owasp-amass/amass)

**TLS**
- [testssl.sh](https://github.com/drwetter/testssl.sh)
- [sslscan](https://github.com/rbsec/sslscan)

**Vulnerability and exploit**
- [OpenVAS / Greenbone](https://www.greenbone.net/)
- [searchsploit / Exploit-DB](https://www.exploit-db.com/searchsploit)

**Wordlists**
- [SecLists](https://github.com/danielmiessler/SecLists)

**Legal practice environments**
- [Hack The Box](https://www.hackthebox.com/)
- [TryHackMe](https://tryhackme.com/)
- [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/)
- [VulnHub](https://www.vulnhub.com/)

---
