# Nmap — Network Mapper

---

## 1. What is Nmap?

**Nmap** (Network Mapper) is the de-facto port scanner and network discovery tool. It's used by sysadmins, pentesters, red teams, blue teams — basically anyone who needs to understand what's on a network.

### What it does

- **Discover hosts** that are alive on a network
- **Find open ports** on those hosts
- **Identify services** running on each port (with versions)
- **Fingerprint operating systems**
- **Run NSE scripts** for deeper checks (vulnerability scans, brute force, enumeration)
- **Generate reports** in multiple formats

### Install

```bash
sudo apt install nmap
nmap --version
```

---

## 2. How Nmap Scanning Works

Nmap follows a defined sequence every time it runs:

```
1. TARGET ENUMERATION  → expand the target spec into a list of IPs
2. HOST DISCOVERY      → "ping" to find which hosts are alive (the "ping scan")
3. REVERSE DNS         → resolve names for live hosts
4. PORT SCANNING       → probe ports on live hosts
5. SERVICE DETECTION   → identify what's running (-sV)
6. OS DETECTION        → fingerprint the OS (-O)
7. NSE SCRIPTS         → run scripts for deeper checks
8. OUTPUT              → present/save results
```

### The core idea: send a probe, read the response

Nmap learns about a target by **sending crafted packets and analyzing the replies** (or lack of them):

- **A reply** → the host/port is reachable and tells nmap its state
- **A specific error (RST, ICMP unreachable)** → port is closed or filtered
- **No reply at all** → filtered (firewall dropping packets) or host down

Different scan types send **different kinds of packets** (TCP SYN, TCP ACK, UDP, ICMP, ARP) — each reveals different information and behaves differently against firewalls.

### Why host discovery happens first

Scanning all 65,535 ports on a dead host wastes time. So nmap first does a lightweight **"is this host alive?"** check (host discovery, a.k.a. ping scan), then only port-scans hosts that responded. You can skip this with `-Pn` (treat all as up) or do only this with `-sn` (discovery, no port scan).

---

## 3. Target Specification & Enumeration

Before scanning, nmap **enumerates targets** — expanding whatever you typed into a concrete list of IP addresses.

### Ways to specify targets

```bash
nmap 192.168.1.1                  # single IP
nmap example.com                  # hostname (resolved via DNS)
nmap 192.168.1.1 192.168.1.5      # multiple IPs (space-separated)
nmap 192.168.1.1-50               # range (last octet 1 to 50)
nmap 192.168.1-3.1-50             # range across octets
nmap 192.168.1.0/24               # CIDR (whole subnet — 256 addresses)
nmap 10.0.0.0/8                   # huge range (16 million addresses)
nmap 192.168.1.*                  # wildcard (same as 1.0/24)
nmap scanme.nmap.org              # nmap's official practice target
```

### From / to files

```bash
nmap -iL targets.txt              # read targets from a file (one per line)
nmap ... -oN results.txt          # write results to a file
```

### Excluding hosts

```bash
nmap 192.168.1.0/24 --exclude 192.168.1.1,192.168.1.254
nmap 192.168.1.0/24 --excludefile dontscan.txt
```

### Random targets (research/internet-wide)

```bash
nmap -iR 100                      # scan 100 random public IPs (use with care + authorization)
```

---

## 4. Subnetworks (Subnets) & CIDR

A **subnetwork** (subnet) is a logical division of a larger network. Nmap targets are often entire subnets, so understanding CIDR is essential.

### CIDR notation

```
192.168.1.0/24
              ↑
              prefix = number of "network" bits
```

The `/N` tells you how many addresses are in the subnet:

| CIDR | Subnet mask | Total addresses | Usable hosts | Nmap scans |
|------|-------------|-----------------|--------------|------------|
| `/24` | 255.255.255.0 | 256 | 254 | `192.168.1.0`–`192.168.1.255` |
| `/25` | 255.255.255.128 | 128 | 126 | half of a /24 |
| `/26` | 255.255.255.192 | 64 | 62 | quarter of a /24 |
| `/27` | 255.255.255.224 | 32 | 30 | a department |
| `/28` | 255.255.255.240 | 16 | 14 | small group |
| `/30` | 255.255.255.252 | 4 | 2 | point-to-point link |
| `/16` | 255.255.0.0 | 65,536 | 65,534 | `x.x.0.0`–`x.x.255.255` |
| `/8` | 255.0.0.0 | 16,777,216 | huge | entire `10.x.x.x` |

**Formula:** usable hosts = 2^(32 − prefix) − 2 (subtract network + broadcast addresses).

### Practical subnet scanning

```bash
# Scan a typical home/office subnet
nmap -sn 192.168.1.0/24

# Scan a smaller chunk
nmap -sn 192.168.1.0/28        # just 16 addresses

# Scan two subnets
nmap -sn 192.168.1.0/24 192.168.2.0/24
```

### Quick subnet helper

```bash
sudo apt install ipcalc
ipcalc 192.168.1.0/24       # shows network, broadcast, host range
```

### Why subnets matter for scanning

- A `/24` is fast (256 IPs)
- A `/16` takes much longer (65k IPs) — use `-sn` first to find live hosts, then scan only those
- ARP scan (`-PR`) only works **within your own subnet** (Layer 2) — across subnets you need IP-based discovery

---

## 5. Host Discovery — The Ping Scan

**Host discovery** (the "ping scan") finds which hosts are alive before port scanning. This is the heart of the Nmap enumeration project.

```bash
nmap -sn 192.168.1.0/24       # discovery only (no port scan)
nmap -Pn target.com           # skip discovery, assume host is up
```

By default (without `-sn` or `-Pn`), nmap sends a **mix of probes**:
- ICMP echo request
- TCP SYN to port 443
- TCP ACK to port 80
- ICMP timestamp request

If **any** get a reply, the host is "up." You can control exactly which probe type to use with the flags below.

### Host discovery probe types (overview)

| Flag | Probe type | Layer | Best for |
|------|-----------|-------|----------|
| `-PR` | ARP | 2 | Local subnet (most reliable on LAN) |
| `-PE` | ICMP Echo | 3 | Classic "ping" |
| `-PP` | ICMP Timestamp | 3 | When echo is blocked |
| `-PM` | ICMP Address Mask | 3 | When echo + timestamp blocked |
| `-PS` | TCP SYN ping | 4 | When ICMP is blocked |
| `-PA` | TCP ACK ping | 4 | Bypass simple firewalls |
| `-PU` | UDP ping | 4 | When TCP is filtered |
| `-Pn` | (none) | — | Skip discovery entirely |

Each is explained in detail in the next section.

---

## 6. Host Discovery Probe Types — In Detail

### ARP Scan — `-PR`

```bash
sudo nmap -PR -sn 192.168.1.0/24
```

- Sends **ARP requests** ("who has IP x.x.x.x?") at Layer 2
- **Only works within your own subnet** (ARP doesn't cross routers)
- **Most reliable LAN discovery** — hosts can't hide from ARP if they're on the network; even firewalled hosts must answer ARP to communicate
- Nmap uses ARP **automatically** when scanning a local subnet (even if you ask for ICMP), because it's faster and more accurate
- Disable with `--disable-arp-ping` to force IP-layer probes

### ICMP Echo Scan — `-PE`

```bash
sudo nmap -PE -sn 192.168.1.0/24
```

- Sends a classic **ICMP echo request** (the same packet as the `ping` command)
- If the host replies with an **ICMP echo reply**, it's up
- **Simple and fast**, but many firewalls/hosts **block ICMP echo** — so absence of reply ≠ host down
- This is "ping" in the traditional sense

### ICMP Timestamp Scan — `-PP`

```bash
sudo nmap -PP -sn 192.168.1.0/24
```

- Sends an **ICMP timestamp request** (ICMP type 13)
- Host replies with a timestamp reply (type 14)
- **Useful when echo (ping) is blocked** but timestamp isn't — some firewalls block echo but forget to block timestamp
- A "second-chance" discovery method

### ICMP Address Mask Scan — `-PM`

```bash
sudo nmap -PM -sn 192.168.1.0/24
```

- Sends an **ICMP address mask request** (ICMP type 17)
- Originally designed for diskless workstations to learn their subnet mask
- **Rarely answered by modern systems**, but occasionally slips past firewalls that block echo + timestamp
- Last-resort ICMP method

### TCP SYN Ping — `-PS`

```bash
sudo nmap -PS -sn target.com              # default port 80
sudo nmap -PS22,80,443 -sn target.com     # specific ports
```

- Sends a **TCP SYN** (connection request) to the given port(s)
- If the host replies (with SYN/ACK = open, or RST = closed), it's **up**
- **Works even when ICMP is blocked** — most firewalls allow SYN to common ports like 80/443
- Default port is 80 if you don't specify
- Doesn't complete the handshake (sends RST after SYN/ACK), so no full connection is made

### TCP ACK Ping — `-PA`

```bash
sudo nmap -PA -sn target.com
sudo nmap -PA80,443 -sn target.com
```

- Sends a **TCP ACK** packet (pretends to be part of an existing connection)
- A live host responds with **RST** (because there's no real connection) → proves it's up
- **Useful for bypassing stateless firewalls** that block incoming SYN but allow ACK
- Pairs well with `-PS` — try both: SYN gets through some firewalls, ACK gets through others

### UDP Ping — `-PU`

```bash
sudo nmap -PU -sn target.com
sudo nmap -PU53,161 -sn target.com
```

- Sends a **UDP packet** to the given port(s)
- A closed UDP port replies with **ICMP port unreachable** → host is up
- **Useful when TCP is heavily filtered** but UDP isn't
- Good for finding hosts behind firewalls that only filter TCP

### Combining probes

```bash
# Use multiple discovery methods at once (more thorough)
sudo nmap -sn -PE -PS21,22,23,80,443,3389 -PA80,443 -PU161 192.168.1.0/24

# Skip discovery entirely (when you KNOW the host is up but it blocks all pings)
nmap -Pn target.com
```

### Choosing the right probe

| Situation | Use |
|-----------|-----|
| Scanning your own LAN | `-PR` (ARP — automatic & best) |
| Standard internet host | default, or `-PE` |
| ICMP echo blocked | `-PP`, `-PM`, or `-PS`/`-PA` |
| Firewall blocks SYN | `-PA` (ACK) |
| Only UDP gets through | `-PU` |
| Host blocks ALL pings but you know it's up | `-Pn` |

---

## 7. Host Discovery — Quick Commands

```bash
nmap -sn 192.168.1.0/24            # ping sweep (no port scan)
nmap -Pn target.com                # skip ping, force scan (ICMP blocked)
sudo nmap -PR 192.168.1.0/24       # ARP scan (LAN only — most accurate)
sudo nmap -PE 192.168.1.0/24       # ICMP echo
sudo nmap -PP 192.168.1.0/24       # ICMP timestamp
sudo nmap -PM 192.168.1.0/24       # ICMP address mask
sudo nmap -PS22,80,443 target.com  # TCP SYN ping
sudo nmap -PA80,443 target.com     # TCP ACK ping
sudo nmap -PU53,161 target.com     # UDP ping
nmap -n -sn 192.168.1.0/24         # -n = skip reverse DNS (faster)
nmap -R -sn 192.168.1.0/24         # -R = always do reverse DNS
```

Use `-sn` to map a network before deciding which hosts to scan in detail.

---

## 8. Port Scanning Types

| Flag | Scan | When to use |
|------|------|-------------|
| `-sS` | SYN (half-open) | **Default if root** — stealthy and fast |
| `-sT` | TCP Connect | No root needed (full handshake, noisy) |
| `-sU` | UDP | Find DNS, SNMP, NTP, DHCP (slow) |
| `-sA` | ACK | Map firewall rules |
| `-sF` | FIN | Bypass basic firewalls |
| `-sN` | NULL | No flags set |
| `-sX` | XMAS | FIN+PSH+URG flags |
| `-sY` | SCTP INIT | SCTP services |

```bash
sudo nmap -sS target.com           # SYN (typical)
sudo nmap -sU --top-ports 20 target.com   # quick UDP scan
nmap -sT target.com                # no root needed
```

---

## 9. Port Selection

```bash
nmap target.com                          # default = top 1000 TCP ports
nmap -p 22 target.com                    # one port
nmap -p 22,80,443 target.com             # multiple
nmap -p 1-1000 target.com                # range
nmap -p- target.com                      # ALL 65535 ports (slow)
nmap --top-ports 100 target.com          # most common N
nmap -p T:22,U:53 target.com             # TCP 22 + UDP 53
nmap --exclude-ports 22 -p- target.com   # all except port 22
```

---

## 10. Service & Version Detection

```bash
nmap -sV target.com                       # detect service versions
nmap -sV --version-intensity 5 target.com # default intensity
nmap -sV --version-intensity 0 target.com # light (fast)
nmap -sV --version-intensity 9 target.com # heavy (slow, thorough)
nmap -sV --version-all target.com         # max intensity (shortcut for 9)
```

Service detection tells you not just "port 80 is open" but "Apache 2.4.41 on Ubuntu" — gold for finding known CVEs.

---

## 11. OS Detection

```bash
sudo nmap -O target.com                       # detect OS
sudo nmap -O --osscan-guess target.com        # aggressive guessing
sudo nmap -O --osscan-limit target.com        # only if ports are found
```

OS detection works by analyzing TCP/IP stack quirks. Needs at least one open and one closed port for accuracy.

---

## 12. What Nmap Can Detect

A complete nmap scan can reveal a lot about a target:

| Detection | Flag | What you learn |
|-----------|------|----------------|
| **Live hosts** | `-sn` | Which IPs are alive on a network |
| **Open ports** | default | Which services are listening |
| **Port state** | default | open / closed / filtered |
| **Services** | `-sV` | What software runs on each port |
| **Service versions** | `-sV` | Exact version (→ known CVEs) |
| **Operating system** | `-O` | OS family + version guess |
| **Device type** | `-O` | Router, printer, server, phone, etc. |
| **MAC address & vendor** | (LAN scans) | Hardware manufacturer |
| **Hostnames** | default | Reverse-DNS names |
| **Uptime guess** | `-O` | Approximate time since reboot |
| **Network path** | `--traceroute` | Hops between you and the target |
| **Firewall presence** | `-sA` | Whether packets are being filtered |
| **Vulnerabilities** | `--script vuln` | Known CVEs via NSE scripts |
| **Running scripts/apps** | NSE | Banners, titles, shares, certs, etc. |

### One command to detect most of it

```bash
sudo nmap -A target.com
```

`-A` enables: service/version detection (`-sV`), OS detection (`-O`), default scripts (`-sC`), and traceroute — giving you the fullest picture in a single run.

### What nmap can NOT reliably tell you

- Content **behind a login** (it sees the port, not the data)
- Application-layer logic bugs (that's for Burp/manual testing)
- Whether a "filtered" port is open or closed (firewall hides it)
- Exact OS with 100% certainty (it's an educated guess)

---

## 13. Aggressive Scanning

```bash
nmap -A target.com   # version + OS + scripts + traceroute (all-in-one)
```

`-A` = `-sV -O --script=default --traceroute`. Loud, but gives a complete picture in one command.

---

## 14. Timing Templates

Control speed vs stealth.

| Template | Speed | Use |
|----------|-------|-----|
| `-T0` Paranoid | Very slow (5 min between probes) | IDS evasion |
| `-T1` Sneaky | Slow | Stealthy |
| `-T2` Polite | Slower | Avoid bandwidth issues |
| `-T3` Normal | Default | Standard |
| `-T4` Aggressive | Fast | Stable networks |
| `-T5` Insane | Very fast | Loud, may miss results |

```bash
nmap -T4 target.com         # aggressive but reliable
nmap -T1 target.com         # stealthy
```

Also fine-grained:

```bash
nmap --max-rate 50 target.com         # max 50 packets/sec
nmap --min-rate 100 target.com        # min 100 packets/sec
nmap --scan-delay 1s target.com       # delay between probes
nmap --max-retries 1 target.com       # fewer retries (faster)
```

---

## 15. NSE — Nmap Scripting Engine

Nmap ships with **600+ scripts** for vulnerability detection, enumeration, brute force, etc.

```bash
nmap --script=default target.com         # standard scripts
nmap -sC target.com                       # shortcut for --script=default
nmap --script=vuln target.com             # check known vulnerabilities
nmap --script=auth target.com             # authentication-related
nmap --script=discovery target.com        # service discovery
nmap --script=brute target.com            # brute-force attempts
nmap --script=safe target.com             # only safe scripts
nmap --script "not intrusive" target.com  # exclude intrusive
```

### Specific useful scripts

```bash
# HTTP / Web
nmap -p 80,443 --script http-title target.com
nmap -p 80,443 --script http-enum target.com         # find common paths
nmap -p 80,443 --script http-headers target.com
nmap -p 80,443 --script http-methods target.com      # allowed methods
nmap -p 80,443 --script http-robots.txt target.com

# SSL/TLS
nmap -p 443 --script ssl-cert target.com             # show certificate
nmap -p 443 --script ssl-enum-ciphers target.com     # supported ciphers
nmap -p 443 --script ssl-heartbleed target.com       # CVE-2014-0160

# SMB
nmap -p 445 --script smb-os-discovery target.com
nmap -p 445 --script smb-enum-shares target.com
nmap -p 445 --script smb-vuln-ms17-010 target.com    # EternalBlue

# SMTP
nmap -p 25 --script smtp-commands target.com
nmap -p 25 --script smtp-enum-users target.com
nmap -p 25 --script smtp-open-relay target.com

# DNS
nmap -p 53 --script dns-zone-transfer --script-args dns-zone-transfer.domain=example.com target.com

# SNMP
nmap -sU -p 161 --script snmp-info target.com
nmap -sU -p 161 --script snmp-brute target.com

# FTP
nmap -p 21 --script ftp-anon target.com              # anonymous login
nmap -p 21 --script ftp-vuln-cve2010-4221 target.com

# MySQL
nmap -p 3306 --script mysql-empty-password target.com
nmap -p 3306 --script mysql-info target.com

# Vulnerability scanning
nmap --script vuln target.com
```

### List & search scripts

```bash
# All scripts
ls /usr/share/nmap/scripts/

# Search
nmap --script-help "http-*" | less
locate *.nse | head
```

---

## 16. Output Formats

```bash
nmap -oN out.txt target.com      # human-readable text
nmap -oX out.xml target.com      # XML (parseable)
nmap -oG out.grep target.com     # greppable
nmap -oJ out.json target.com     # JSON (newer nmap)
nmap -oA scan target.com         # all formats: scan.nmap, scan.xml, scan.gnmap
```

### Useful grep examples on `-oG` output

```bash
# Hosts with port 80 open
grep "80/open" scan.gnmap

# Just the IP addresses
grep "Status: Up" scan.gnmap | awk '{print $2}'

# All open ports across all hosts
grep "open" scan.gnmap
```

---

## 17. Stealth / Evasion

```bash
nmap -f target.com                         # fragment packets
nmap --mtu 16 target.com                   # custom MTU
sudo nmap -D RND:10 target.com             # 10 random decoy IPs
sudo nmap -D 10.0.0.5,10.0.0.6,ME target.com   # specific decoys
sudo nmap --source-port 53 target.com      # spoof source port (DNS)
nmap --data-length 100 target.com          # pad packets with extra bytes
nmap --randomize-hosts target.com 192.168.1.0/24   # randomize scan order
nmap --spoof-mac Cisco target.com          # spoof MAC address vendor
```

⚠️ Modern IDS systems detect most of these. They buy time, not invisibility.

---

## 18. Practical Recipes

### Quick recon scan

```bash
sudo nmap -sS -sV -O --top-ports 100 target.com
```

### Full TCP port scan with services

```bash
sudo nmap -sS -sV -p- -T4 target.com -oA fullscan
```

### UDP top services (slow but useful)

```bash
sudo nmap -sU --top-ports 50 target.com
```

### Web app pre-attack scan

```bash
sudo nmap -p 80,443,8080,8443,3000,8000 -sV --script "http-*" target.com
```

### Network sweep — alive hosts only

```bash
nmap -sn 192.168.1.0/24
```

### Discover live web servers on a subnet

```bash
nmap -p 80,443 --open 192.168.1.0/24
```

### Vulnerability scan (loud)

```bash
sudo nmap -sV --script vuln target.com
```

### Smart scan from a file of targets

```bash
nmap -iL targets.txt -sV -oA results
```

### TLS audit

```bash
nmap -p 443 --script "ssl-cert,ssl-enum-ciphers" target.com
```

### Find SSH versions across a network

```bash
nmap -p 22 -sV --open 192.168.1.0/24 -oG - | grep ssh
```

---

## 19. Interpreting Output

Sample output:

```
PORT     STATE    SERVICE     VERSION
22/tcp   open     ssh         OpenSSH 7.4 (protocol 2.0)
80/tcp   open     http        nginx 1.18.0
443/tcp  open     https       nginx 1.18.0
3306/tcp filtered mysql
```

### Port states

| State | Meaning |
|-------|---------|
| **open** | Service is actively listening |
| **closed** | No service listening, but host is up |
| **filtered** | Firewall blocked — can't tell if open or closed |
| **unfiltered** | Reachable but state unknown (ACK scan) |
| **open\|filtered** | Either open or filtered (UDP scans often return this) |

---

## 20. Common Mistakes

| Mistake | Fix |
|---------|-----|
| Forgetting `sudo` for SYN scan | Add `sudo` (else nmap falls back to slower Connect scan) |
| Scanning all 65535 ports without need | Start with `--top-ports 1000` or default |
| Ignoring UDP | Many critical services are UDP (DNS, SNMP, DHCP) |
| Not saving output | Always use `-oA` for important scans |
| Skipping version detection | Without `-sV`, you don't know WHICH version is running |
| Trusting "no host found" without `-Pn` | Many hosts block ping |

---

## 21. Quick Reference

```bash
# Discovery
nmap -sn 192.168.1.0/24                  # ping sweep
nmap -Pn target.com                      # skip ping

# Quick scan
sudo nmap -sS -sV -O target.com          # standard scan

# Full scan
sudo nmap -sS -sV -p- -T4 target.com -oA fullscan

# Aggressive everything
sudo nmap -A target.com

# Vulnerability scan
sudo nmap --script vuln target.com

# Service-specific scripts
sudo nmap -p 443 --script "ssl-*" target.com
sudo nmap -p 80,443 --script "http-*" target.com
sudo nmap -p 445 --script "smb-vuln-*" target.com

# Save all formats
nmap target.com -oA results

# Read targets from file
nmap -iL targets.txt
```

### Flag cheat sheet

```
-sS / -sT / -sU / -sA   scan types
-p / -p- / --top-ports  port selection
-sV                      version detection
-O                       OS detection
-A                       aggressive (everything)
-sC                      default scripts
--script <name>          specific scripts
-T0..T5                  timing template
-Pn                      skip host discovery
-sn                      host discovery only
-oN/X/G/J/A              output formats
-iL                      input file
--open                   show only open ports
-v / -vv                 verbose output
```

### Three rules

1. **Always have authorization** before scanning targets you don't own
2. **Save output** with `-oA` — you'll always want to refer back
3. **Start light, escalate** — top 100 → top 1000 → all ports
