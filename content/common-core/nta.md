# Network Traffic Analysis — Wireshark & tcpdump

> Attackers can't fully hide at the network layer. Traffic analysis lets defenders detect intrusions, data exfiltration, C2 channels, lateral movement, and protocol abuse.

---

## 1. What is Packet Capture?

**Packet capture** (PCAP) is recording the raw network packets traveling across a network interface — every frame, header, and payload — for later inspection.

### Why it matters

| Use case | What you find |
|----------|---------------|
| **Intrusion detection** | Unauthorized connections, scans, brute-force |
| **Incident response** | What an attacker did, when, and how |
| **Data exfiltration** | Large/unusual outbound transfers |
| **C2 detection** | Beaconing to command-and-control servers |
| **Forensics** | Reconstruct exactly what happened |
| **Troubleshooting** | Latency, dropped packets, misconfigurations |
| **Malware analysis** | What a sample talks to |

### The key truth

Even encrypted traffic reveals **metadata**: who talked to whom, when, how much, how often, and over what protocol. Attackers can encrypt payloads but can't hide the existence of the connection.

### PCAP file formats

- **`.pcap`** — classic libpcap format
- **`.pcapng`** — newer "next generation" format (Wireshark default, supports more metadata)

---

## 2. The Two Tools

| | **Wireshark** | **tcpdump** |
|---|---------------|-------------|
| **Interface** | GUI (graphical) | CLI (terminal) |
| **Best for** | Deep analysis, visualization, learning | Quick captures, headless servers, scripting |
| **Resource usage** | Heavy | Lightweight |
| **Remote servers** | Awkward (needs GUI/X) | Perfect (SSH-friendly) |
| **Filtering** | Capture + display filters | Capture filters (BPF) |
| **Stream following** | Yes (point-and-click) | Manual |
| **Statistics tools** | Extensive | None built-in |

**Common workflow:** capture with `tcpdump` on a remote server → transfer the `.pcap` → analyze in Wireshark on your machine.

### Install

```bash
sudo apt install wireshark tcpdump
# Allow non-root capture during Wireshark install when prompted
```

---

## 3. tcpdump — Command-Line Capture

```bash
tcpdump [options] [filter expression]
```

### Essential options

| Flag | Purpose |
|------|---------|
| `-i eth0` | Interface to capture on (`-i any` = all) |
| `-w file.pcap` | Write packets to a file |
| `-r file.pcap` | Read packets from a file |
| `-n` | Don't resolve hostnames (faster) |
| `-nn` | Don't resolve hostnames OR port names |
| `-c 100` | Capture only 100 packets |
| `-v` / `-vv` / `-vvv` | Verbosity levels |
| `-X` | Show packet contents in hex + ASCII |
| `-A` | Show packet contents in ASCII (great for HTTP) |
| `-s 0` | Capture full packet (no truncation) |
| `-e` | Show Ethernet (MAC) headers |
| `-tttt` | Human-readable timestamps |
| `-q` | Quiet (less protocol info) |

### List interfaces

```bash
tcpdump -D            # or: ip link
```

### Basic captures

```bash
# Capture on eth0, show on screen
sudo tcpdump -i eth0

# Capture 100 packets to a file, no name resolution
sudo tcpdump -i eth0 -nn -c 100 -w capture.pcap

# Read a saved capture
tcpdump -r capture.pcap -nn

# Capture full packets with ASCII payload (good for HTTP)
sudo tcpdump -i eth0 -A -s 0
```

---

## 4. tcpdump Filter Expressions (BPF)

tcpdump uses **Berkeley Packet Filter (BPF)** syntax. Filters keep captures small and relevant.

### Filter by host

```bash
tcpdump host 10.0.0.5              # to OR from this host
tcpdump src host 10.0.0.5         # only FROM
tcpdump dst host 10.0.0.5         # only TO
```

### Filter by network

```bash
tcpdump net 192.168.1.0/24
tcpdump src net 10.0.0.0/8
```

### Filter by port

```bash
tcpdump port 80                   # port 80 (either direction)
tcpdump src port 443
tcpdump dst port 22
tcpdump portrange 1-1024
```

### Filter by protocol

```bash
tcpdump tcp
tcpdump udp
tcpdump icmp
tcpdump arp
```

### Combine with logic operators

```bash
tcpdump 'host 10.0.0.5 and port 80'
tcpdump 'tcp and port 443 and not host 10.0.0.1'
tcpdump 'src 10.0.0.5 or dst 10.0.0.5'
tcpdump '(port 80 or port 443) and host 10.0.0.5'
```

`and` / `or` / `not` (or `&&` / `||` / `!`) — wrap complex filters in quotes.

### Advanced — match TCP flags

```bash
# Only SYN packets (connection attempts)
tcpdump 'tcp[tcpflags] & tcp-syn != 0'

# SYN without ACK (initial connection requests — scan detection)
tcpdump 'tcp[tcpflags] & (tcp-syn|tcp-ack) == tcp-syn'

# RST packets (resets)
tcpdump 'tcp[tcpflags] & tcp-rst != 0'
```

### Practical capture recipes

```bash
# Capture only web traffic
sudo tcpdump -i eth0 -nn 'port 80 or port 443' -w web.pcap

# Capture DNS queries
sudo tcpdump -i eth0 -nn 'udp port 53'

# Capture traffic to/from a suspicious host
sudo tcpdump -i eth0 -nn host 185.220.101.5 -w suspicious.pcap

# Capture SSH brute-force attempts (many SYNs to port 22)
sudo tcpdump -i eth0 -nn 'tcp port 22 and tcp[tcpflags] & tcp-syn != 0'

# Rotate capture files every 100MB (long-running monitoring)
sudo tcpdump -i eth0 -w capture -C 100 -W 10
```

---

## 5. When to Use tcpdump vs Wireshark

**Use tcpdump when:**
- Capturing on a **remote/headless server** (over SSH)
- You need a **lightweight** capture (low CPU/RAM)
- **Scripting / automation** captures
- Quick "what's hitting this port right now?" checks

**Use Wireshark when:**
- **Deep analysis** of a capture
- You need **visual** protocol dissection
- **Following TCP streams** / reassembling conversations
- Running **statistics** (top talkers, protocol hierarchy)
- **Learning** — it color-codes and explains everything

**The classic combo:** capture remotely with tcpdump, analyze locally in Wireshark.

```bash
# On the server
sudo tcpdump -i eth0 -nn -w /tmp/cap.pcap

# Transfer to your machine
scp user@server:/tmp/cap.pcap .

# Open in Wireshark
wireshark cap.pcap
```

---

## 6. Wireshark — How It Displays Packets

Wireshark dissects packets into a readable, layered view.

### The three panes

```
┌─────────────────────────────────────────┐
│ PACKET LIST    (one row per packet)      │  ← No, Time, Src, Dst, Proto, Info
├─────────────────────────────────────────┤
│ PACKET DETAILS (expandable layers)       │  ← Frame > Ethernet > IP > TCP > HTTP
├─────────────────────────────────────────┤
│ PACKET BYTES   (raw hex + ASCII)         │  ← the actual bytes
└─────────────────────────────────────────┘
```

### Packet dissection (layers)

Wireshark breaks each packet into its protocol layers, matching the OSI model:

```
Frame            → capture metadata (time, length)
Ethernet II      → source/dest MAC addresses
Internet Protocol → source/dest IP, TTL
Transmission Control Protocol → ports, seq/ack, flags
HyperText Transfer Protocol → the actual application data
```

Click any layer to expand it and see every field decoded.

### Color coding

Wireshark color-codes packets by default:
- **Green** — HTTP traffic
- **Light blue** — UDP
- **Black** — packets with problems (retransmissions, errors)
- **Light purple** — TCP

You can customize: View → Coloring Rules.

---

## 7. Capture Filters vs Display Filters

**This is a critical distinction.**

| | **Capture Filter** | **Display Filter** |
|---|--------------------|--------------------|
| **When applied** | BEFORE capture (decides what's recorded) | AFTER capture (decides what's shown) |
| **Syntax** | BPF (same as tcpdump) | Wireshark's own syntax |
| **Can recover filtered data?** | ❌ No — discarded forever | ✅ Yes — just hidden, change anytime |
| **Where** | Capture options box | Filter bar at top |
| **Example** | `port 80` | `http` |
| **Use when** | Reducing huge captures | Drilling into a capture |

### Capture filter examples (BPF — same as tcpdump)

```
host 10.0.0.5
port 443
tcp and not port 22
net 192.168.1.0/24
```

### Display filter examples (Wireshark syntax)

```
http                          # all HTTP
ip.addr == 10.0.0.5           # to/from this IP
ip.src == 10.0.0.5            # from this IP
tcp.port == 443               # this TCP port
dns                           # all DNS
http.request.method == "POST" # only POST requests
tcp.flags.syn == 1            # SYN packets
frame contains "password"     # packets containing the string
tcp.analysis.retransmission   # retransmitted packets
http.response.code == 200     # HTTP 200 responses
ip.addr == 10.0.0.5 && tcp.port == 80   # combine with &&
!arp                          # exclude ARP
```

**Rule of thumb:** Use a **capture filter** when you know what you want before capturing (and want to save space). Use a **display filter** to explore a capture without losing data.

---

## 8. Display Filter Cookbook

```
# By protocol
http, dns, tls, ssh, ftp, smtp, icmp, arp, dhcp

# By IP
ip.addr == 10.0.0.5
ip.src == 10.0.0.5
ip.dst == 8.8.8.8
ip.addr == 192.168.1.0/24

# By port
tcp.port == 80
udp.port == 53
tcp.dstport == 443

# By TCP flags
tcp.flags.syn == 1 && tcp.flags.ack == 0   # connection attempts
tcp.flags.reset == 1                        # resets
tcp.flags.fin == 1                          # connection closes

# HTTP
http.request                                # all requests
http.request.method == "GET"
http.request.uri contains "admin"
http.host == "example.com"
http.response.code == 404

# DNS
dns.qry.name contains "suspicious"
dns.flags.response == 0                      # queries only
dns.flags.response == 1                      # responses only

# Content search
frame contains "password"
tcp contains "FLAG"

# Anomalies
tcp.analysis.retransmission
tcp.analysis.duplicate_ack
tcp.analysis.zero_window
expert.severity == error
```

---

## 9. Following TCP Streams

One of Wireshark's most powerful features — reassemble a full conversation.

### How to do it

1. Right-click any packet in a TCP conversation
2. Select **Follow → TCP Stream**
3. Wireshark reassembles all packets in both directions into readable text

### What you see

```
GET /login HTTP/1.1          ← client (red)
Host: example.com

HTTP/1.1 200 OK              ← server (blue)
Set-Cookie: session=abc123
...
```

### Why it's powerful

- See full HTTP requests + responses
- Extract credentials sent in plaintext (HTTP, FTP, Telnet)
- Reconstruct file transfers
- Read chat/command sessions
- Understand the full back-and-forth of an attack

### Stream types

- **Follow → TCP Stream** — TCP conversations
- **Follow → UDP Stream** — UDP conversations
- **Follow → HTTP Stream** — HTTP specifically
- **Follow → TLS Stream** — encrypted (shows ciphertext unless you have keys)

---

## 10. Wireshark Statistics Tools

Found under the **Statistics** menu — essential for spotting anomalies fast.

| Tool | What it shows |
|------|---------------|
| **Protocol Hierarchy** | Breakdown of protocols by % of traffic |
| **Conversations** | Every pair of hosts talking + byte counts |
| **Endpoints** | All hosts, sorted by traffic (find top talkers) |
| **IO Graph** | Traffic volume over time (spot spikes) |
| **Flow Graph** | Visual sequence of a conversation |
| **DNS** | All DNS queries/responses |
| **HTTP → Requests** | Every HTTP request by host/URI |
| **Capture File Properties** | Summary stats of the whole capture |

### Finding top talkers (data exfil / C2 detection)

```
Statistics → Conversations → sort by Bytes
```

A host sending **far more data out than in**, or talking to an unknown external IP repeatedly, is suspicious.

### Protocol Hierarchy for quick triage

```
Statistics → Protocol Hierarchy
```

Shows what % is HTTP, DNS, TLS, etc. Unexpected protocols (e.g., lots of ICMP, IRC, or unknown TCP) are red flags.

---

## 11. Analyzing DNS Traffic

DNS is heavily abused by attackers (tunneling, C2, exfiltration) and is a goldmine for analysts.

### Display filters for DNS

```
dns                                  # all DNS
dns.flags.response == 0              # queries only
dns.flags.response == 1             # responses only
dns.qry.name contains "evil"        # specific domains
dns.qry.type == 1                   # A records
dns.qry.type == 16                  # TXT records (often abused)
dns.count.answers == 0              # queries with no answer (NXDOMAIN)
```

### What to look for

| Indicator | Possible meaning |
|-----------|------------------|
| **Very long subdomain names** | DNS tunneling / exfiltration |
| **High volume of TXT queries** | DNS-based C2 |
| **Many NXDOMAIN responses** | Domain generation algorithm (malware) |
| **Queries to random-looking domains** | DGA malware C2 |
| **DNS to non-standard servers** | Bypassing monitoring |
| **Repeated queries at fixed intervals** | Beaconing |

### Example: spot DNS tunneling

Long, encoded-looking subdomains like `aGVsbG8gd29ybGQ.tunnel.evil.com` are classic data exfiltration over DNS.

```
Statistics → DNS    (review query name lengths and frequency)
```

---

## 12. Detecting Network Anomalies

### Common indicators of compromise (IOCs) in traffic

| Anomaly | What it looks like |
|---------|-------------------|
| **Port scan** | One host → many ports, many SYNs, few completed handshakes |
| **Host sweep** | One host → many IPs on the same port |
| **Brute force** | Many connection attempts to one service (SSH 22, RDP 3389) |
| **Data exfiltration** | Large outbound transfer to an external/unknown IP |
| **C2 beaconing** | Regular, periodic small connections to one external host |
| **DNS tunneling** | Abnormally long/frequent DNS queries |
| **Lateral movement** | Internal host suddenly connecting to many other internal hosts |
| **Unusual protocols** | IRC, unexpected ports, cleartext where TLS is expected |

### Detect a port scan

```
# Many SYN packets, few SYN-ACKs
tcp.flags.syn == 1 && tcp.flags.ack == 0
```

Then check Statistics → Conversations — one source hitting dozens of ports = scan.

### Detect RDP brute-force (the project's example)

RDP runs on **port 3389**. A brute-force shows many rapid connection attempts:

```
# Wireshark display filter
tcp.port == 3389

# tcpdump
sudo tcpdump -i eth0 -nn 'tcp port 3389 and tcp[tcpflags] & tcp-syn != 0'
```

Look for: one external IP making **repeated, rapid connections** to 3389 on one of your hosts. Combined with many short-lived sessions = brute-force attempt.

### Identifying unauthorized connections

1. **Statistics → Conversations** → look for external IPs you don't recognize
2. **Statistics → Endpoints** → sort by bytes, find unexpected top talkers
3. Filter `ip.addr == <suspicious_ip>` and Follow TCP Stream
4. Check if the destination IP is known-malicious (VirusTotal, AbuseIPDB)

---

## 13. How Encryption Affects Analysis

Modern traffic is mostly encrypted (TLS/HTTPS). This changes what you can see.

### What you CAN still see (metadata)

- **Source/destination IPs and ports** — who's talking
- **Connection timing and frequency** — beaconing patterns
- **Data volume** — possible exfiltration
- **TLS handshake details** — SNI (server name), certificate info, cipher suites
- **JA3/JA3S fingerprints** — identify client/server software (even malware)

### What you CANNOT see

- The actual **payload** (the decrypted content)
- HTTP URIs, POST bodies, credentials (inside TLS)

### TLS handshake is still revealing

```
# Display filter
tls.handshake.type == 1                       # Client Hello
tls.handshake.extensions_server_name          # SNI — the domain being visited!
```

Even with encryption, the **SNI field** in the TLS Client Hello often reveals which website is being accessed (until Encrypted Client Hello rolls out).

### Decrypting TLS (when you have the keys)

If you control the client, you can log session keys:

```bash
# Set before launching the browser
export SSLKEYLOGFILE=~/sslkeys.log
```

Then in Wireshark: Preferences → Protocols → TLS → (Pre)-Master-Secret log filename → point to that file. Wireshark decrypts the traffic.

### The takeaway

Encryption hides **content** but not **behavior**. SOC analysts pivot to metadata analysis: who, when, how much, how often.

---

## 14. Best Practices for Capturing Traffic

| Practice | Why |
|----------|-----|
| **Capture at the right point** | Mirror port / SPAN / TAP to see all traffic |
| **Use capture filters** | Avoid massive files; capture only what you need |
| **Capture full packets** (`-s 0`) | Truncated packets lose payload data |
| **Use `-nn`** | Skip DNS resolution — faster, avoids polluting the capture |
| **Rotate files** (`-C`, `-G`, `-W`) | Prevent giant unmanageable files |
| **Timestamp accurately** | Sync clocks (NTP) for correlation |
| **Get authorization** | Capturing others' traffic may be illegal |
| **Store securely** | PCAPs contain sensitive data (credentials, PII) |
| **Document** | Note when, where, why you captured |
| **Minimize on production** | Captures add load; use targeted filters |

### Legal note

Packet captures can contain passwords, personal data, and confidential information. Only capture traffic on networks you own or have **written authorization** to monitor. Unauthorized interception is a crime in most jurisdictions.

---

## 15. A SOC Analyst Workflow

A typical investigation of a suspicious PCAP:

```
1. OVERVIEW
   Statistics → Capture File Properties   (size, duration, packet count)
   Statistics → Protocol Hierarchy        (what protocols are present?)

2. FIND TOP TALKERS
   Statistics → Conversations → sort by bytes
   Statistics → Endpoints → identify unknown external IPs

3. TRIAGE SUSPICIOUS HOSTS
   Filter: ip.addr == <suspicious_ip>
   Check: known-bad? (VirusTotal / AbuseIPDB)

4. DRILL INTO CONNECTIONS
   Follow → TCP Stream on suspicious conversations
   Look for: cleartext creds, commands, file transfers

5. CHECK DNS
   Statistics → DNS
   Look for: tunneling, DGA domains, beaconing

6. LOOK FOR ATTACKS
   Port scans: tcp.flags.syn==1 && tcp.flags.ack==0
   Brute force: many connections to 22/3389/etc.
   Exfil: large outbound transfers

7. DOCUMENT FINDINGS
   IOCs (IPs, domains, hashes), timeline, evidence
```

---

## 16. Quick Reference

### tcpdump

```bash
sudo tcpdump -D                              # list interfaces
sudo tcpdump -i eth0 -nn                     # capture, no resolution
sudo tcpdump -i eth0 -w cap.pcap             # save to file
tcpdump -r cap.pcap -nn                      # read a file
sudo tcpdump -i eth0 -A 'port 80'            # HTTP in ASCII
sudo tcpdump -i eth0 'host 10.0.0.5 and port 443'
sudo tcpdump -i eth0 'tcp[tcpflags] & tcp-syn != 0'   # SYN packets
```

### Wireshark display filters

```
http                              dns
ip.addr == 10.0.0.5               tcp.port == 443
http.request.method == "POST"     dns.qry.name contains "evil"
tcp.flags.syn == 1                frame contains "password"
tls.handshake.extensions_server_name    # SNI
tcp.analysis.retransmission       tcp.port == 3389   # RDP
```

### Capture vs display filters

```
CAPTURE FILTER (BPF, before capture):   port 80
DISPLAY FILTER (Wireshark, after):      http
```

### Statistics shortcuts

```
Protocol Hierarchy → what protocols
Conversations      → host pairs + bytes (top talkers)
Endpoints          → all hosts sorted by traffic
DNS                → DNS query analysis
IO Graph           → traffic over time
```

### Three rules

1. **Capture filters reduce; display filters explore** — capture broad, filter the view
2. **Encryption hides content, not behavior** — pivot to metadata
3. **Always follow the stream** — individual packets tell little; conversations tell the story
