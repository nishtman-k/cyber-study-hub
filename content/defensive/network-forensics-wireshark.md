# Network Forensics with Wireshark

"Packets record what crossed the wire. The analyst's job is to turn that traffic into a defensible timeline." - Network forensics principle

> **⚠️ AUTHORIZED USE ONLY.** This material is for education, defensive network forensics, and authorized packet-capture analysis. Analyze only captures you are permitted to access. PCAPs can contain credentials, session identifiers, internal addressing, regulated data, and reconstructed files. Preserve originals, work from verified copies, restrict access, avoid contacting observed infrastructure, and never replay captured traffic into a production network. See the [Legal and Terms of Use](/legal) page.

**Scope:** Self-contained network-forensics analysis using Wireshark, TShark, and tcpdump: capture intake, integrity validation, traffic baselining, endpoint and conversation inventories, TCP session interpretation, DNS analysis, TLS metadata analysis without decryption, phishing-click reconstruction, beacon detection, timing statistics, DNS tunneling and exfiltration estimation, RDP and SMB lateral-movement analysis, VPN activity, IOC extraction, cross-PCAP correlation, ATT&CK mapping, packet-referenced timelines, and professional reporting.

## Table of Contents

- [Core Concepts](#core-concepts)
- [Network Forensics Workflow](#network-forensics-workflow)
- [PCAP Intake and Integrity](#pcap-intake-and-integrity)
- [Capture Metadata and Coverage](#capture-metadata-and-coverage)
- [Wireshark and TShark Fundamentals](#wireshark-and-tshark-fundamentals)
- [Capture Filters and Display Filters](#capture-filters-and-display-filters)
- [Endpoint and Conversation Inventory](#endpoint-and-conversation-inventory)
- [Traffic Baseline](#traffic-baseline)
- [Traffic Metrics](#traffic-metrics)
- [TCP Session Analysis](#tcp-session-analysis)
- [DNS Fundamentals](#dns-fundamentals)
- [DNS Behavioral Analysis](#dns-behavioral-analysis)
- [TLS Metadata Analysis](#tls-metadata-analysis)
- [Phishing Click Reconstruction](#phishing-click-reconstruction)
- [Beaconing Fundamentals](#beaconing-fundamentals)
- [Beacon Timing Analysis](#beacon-timing-analysis)
- [Human Browsing Versus Automation](#human-browsing-versus-automation)
- [DNS Tunneling Detection](#dns-tunneling-detection)
- [DNS Exfiltration Estimation](#dns-exfiltration-estimation)
- [Lateral Movement Analysis](#lateral-movement-analysis)
- [RDP Analysis](#rdp-analysis)
- [SMB Analysis](#smb-analysis)
- [Authentication-Related Traffic](#authentication-related-traffic)
- [VPN and External Access](#vpn-and-external-access)
- [Cross-PCAP Correlation](#cross-pcap-correlation)
- [Attack Timeline Reconstruction](#attack-timeline-reconstruction)
- [IOC Extraction](#ioc-extraction)
- [MITRE ATT&CK Mapping](#mitre-attck-mapping)
- [Network Forensics Report](#network-forensics-report)
- [Evidence Package](#evidence-package)
- [Quality Gates](#quality-gates)
- [Professional Judgment](#professional-judgment)
- [Framework and Tool Map](#framework-and-tool-map)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Concepts

| Term             | Meaning                                                                   |
| ---------------- | ------------------------------------------------------------------------- |
| **PCAP**         | File containing captured network packets                                  |
| **Frame**        | Link-layer unit recorded in a capture file                                |
| **Packet**       | Network-layer unit, commonly an IP packet                                 |
| **Segment**      | Transport-layer TCP unit                                                  |
| **Flow**         | Related traffic sharing endpoint and protocol properties                  |
| **Conversation** | Bidirectional communication between endpoints                             |
| **Five-tuple**   | Source IP, source port, destination IP, destination port, and protocol    |
| **Beacon**       | Repeated automated communication between a host and remote infrastructure |
| **Jitter**       | Variation in time between repeated events or connections                  |
| **DNS tunnel**   | Covert channel that places command or data content inside DNS traffic     |

### The core idea

```text
Preserve the capture
     ↓
Measure coverage
     ↓
Establish normal traffic
     ↓
Find deviations
     ↓
Analyze protocol and timing evidence
     ↓
Correlate conversations across captures
     ↓
Reconstruct the attack chronologically
     ↓
Report with packet references
```

Packets show observed network behavior, not the intent behind it. Conclusions must remain bounded by capture location, visibility, packet loss, encryption, and collection time.

## 2. Network Forensics Workflow

Use a repeatable sequence for every capture.

| Stage                 | Question                                                            | Output             |
| --------------------- | ------------------------------------------------------------------- | ------------------ |
| **Intake**            | Is the capture intact and authorized for analysis?                  | Hash and inventory |
| **Coverage**          | What time, interfaces, segments, and packet counts are represented? | Capture profile    |
| **Inventory**         | Which endpoints, conversations, and protocols exist?                | Traffic inventory  |
| **Baseline**          | What activity is normal for this network and period?                | Baseline metrics   |
| **Hunt**              | Which destinations, names, ports, intervals, and volumes deviate?   | Candidate findings |
| **Protocol analysis** | What do DNS, TLS, TCP, RDP, and SMB reveal?                         | Protocol evidence  |
| **Correlation**       | How do activities connect across captures?                          | Unified timeline   |
| **Report**            | What can be concluded and with what confidence?                     | Forensics report   |

### Sequence rule

```text
Statistics before packet-by-packet review
Conversations before individual frames
Behavior before signatures
Timeline before narrative
```

## 3. PCAP Intake and Integrity

Hash every original capture before opening it for analysis.

### Intake fields

| Field               | Purpose                       |
| ------------------- | ----------------------------- |
| **capture_id**      | Stable identifier             |
| **source_file**     | Original filename             |
| **sha256**          | Integrity hash                |
| **capture_point**   | Sensor, interface, or segment |
| **received_at_utc** | Evidence intake time          |
| **analyst**         | Person performing analysis    |
| **handling_label**  | Access and sharing boundary   |
| **working_copy**    | Copy used for investigation   |

### Preservation commands

```bash
mkdir -p network_case/{raw,work,output,reports}
cp --preserve=timestamps *.pcap network_case/raw/
find network_case/raw -type f -print0 | sort -z | xargs -0 sha256sum > network_case/raw/SHA256SUMS
chmod -R a-w network_case/raw
cp network_case/raw/*.pcap network_case/work/
sha256sum -c network_case/raw/SHA256SUMS
```

### Preservation rule

Do not edit, merge, truncate, or repair the original capture. Create derived captures in the working directory and record the command used.

## 4. Capture Metadata and Coverage

Before investigating behavior, determine what the capture can actually show.

### Coverage fields

| Field                      | Meaning                                            |
| -------------------------- | -------------------------------------------------- |
| **First packet time**      | Beginning of observed evidence                     |
| **Last packet time**       | End of observed evidence                           |
| **Duration**               | Capture coverage interval                          |
| **Packet count**           | Number of recorded frames                          |
| **Average packet rate**    | Frames per second                                  |
| **Average data rate**      | Bytes or bits per second                           |
| **Interfaces**             | Capture interfaces represented                     |
| **Encapsulation**          | Ethernet, Linux cooked capture, or other link type |
| **Snap length**            | Maximum bytes preserved per frame                  |
| **Packet loss indicators** | Evidence of missing frames or capture drops        |

### Metadata commands

```bash
capinfos network_case/work/*.pcap
tshark -r network_case/work/full_timeline.pcap -q -z io,stat,60
tshark -r network_case/work/full_timeline.pcap -T fields -e frame.number -e frame.time_epoch | sed -n '1p;$p'
```

### Coverage caution

An absent packet does not prove an absent action. The traffic may have used another segment, occurred outside the window, been encrypted, or been dropped by the capture process.

## 5. Wireshark and TShark Fundamentals

Wireshark provides interactive packet inspection. TShark provides the same protocol-dissection engine through the command line and can read saved captures with the `-r` option.

### Three-pane reasoning

| View               | Analyst use                                    |
| ------------------ | ---------------------------------------------- |
| **Packet list**    | Time, endpoints, protocol, length, and summary |
| **Packet details** | Decoded protocol fields and relationships      |
| **Packet bytes**   | Raw captured bytes and selected-field location |

### Core TShark commands

```bash
# Packet summary
tshark -r capture.pcap

# Verbose decode
tshark -r capture.pcap -V

# Apply a display filter
tshark -r capture.pcap -Y 'dns'

# Extract selected fields
tshark -r capture.pcap -T fields \
  -e frame.number \
  -e frame.time_epoch \
  -e ip.src \
  -e ip.dst

# Emit structured JSON
tshark -r capture.pcap -T json > output/capture.json
```

## 6. Capture Filters and Display Filters

Capture filters decide which packets are recorded. Display filters decide which already-recorded packets are shown. Wireshark and TShark share a display-filter engine that can test field existence, compare values, and combine conditions.

### Filter comparison

| Filter type        | Applied when                | Syntax family                  | Risk                                 |
| ------------------ | --------------------------- | ------------------------------ | ------------------------------------ |
| **Capture filter** | Before or during collection | Berkeley Packet Filter         | Excluded traffic cannot be recovered |
| **Display filter** | After capture               | Wireshark fields and operators | Does not modify original capture     |

### Display filter examples

```text
dns
tls
ip.addr == 10.20.30.40
tcp.port == 443
dns.qry.type == 16
tls.handshake.type == 1
rdp or tcp.port == 3389
smb2 or tcp.port == 445
```

### Filter principle

During forensic analysis, prefer display filters on the complete preserved capture. Create reduced captures only as derived artifacts with documented commands.

## 7. Endpoint and Conversation Inventory

Start with who communicated, how often, over which protocols, and in which direction.

### Inventory commands

```bash
# Protocol hierarchy
tshark -r capture.pcap -q -z io,phs

# IPv4 conversations
tshark -r capture.pcap -q -z conv,ip

# TCP conversations
tshark -r capture.pcap -q -z conv,tcp

# UDP conversations
tshark -r capture.pcap -q -z conv,udp

# Endpoints
tshark -r capture.pcap -q -z endpoints,ip
```

### Inventory questions

- Which internal addresses are most active?
- Which external destinations appear?
- Which ports and protocols dominate?
- Are expected DNS resolvers and gateways used?
- Are there cross-subnet connections?
- Which hosts communicate rarely or only once?
- Are there unexpectedly long or repetitive connections?

## 8. Traffic Baseline

A baseline describes normal behavior for a comparable host, segment, and time period.

### Baseline dimensions

| Dimension        | Examples                                          |
| ---------------- | ------------------------------------------------- |
| **Endpoints**    | Normal internal and external peers                |
| **Protocols**    | DNS, TLS, RDP, SMB, NTP, DHCP                     |
| **Destinations** | Common IPs, domains, and service providers        |
| **Ports**        | Expected service ports                            |
| **Timing**       | Hourly rates, intervals, and quiet periods        |
| **Volume**       | Bytes, packets, and duration per conversation     |
| **DNS**          | Query types, labels, domains, and response codes  |
| **TLS**          | SNI, versions, certificates, and session patterns |

### Baseline workflow

```text
Profile normal capture
     ↓
Calculate endpoints and conversations
     ↓
Record normal DNS and TLS values
     ↓
Measure duration, bytes, and intervals
     ↓
Compare incident captures using identical metrics
```

### Baseline caution

A baseline from a short period may miss legitimate periodic activity. Record observation length and sample counts with every baseline value.

## 9. Traffic Metrics

| Metric                 | Calculation or meaning                       |
| ---------------------- | -------------------------------------------- |
| **Packet count**       | Frames in a conversation or interval         |
| **Byte count**         | Captured or wire bytes transferred           |
| **Session duration**   | Last packet time minus first packet time     |
| **Inter-arrival time** | Current event time minus previous event time |
| **Query rate**         | DNS queries divided by observation time      |
| **Connection rate**    | New sessions divided by observation time     |
| **Direction ratio**    | Outbound bytes compared with inbound bytes   |
| **Fan-out**            | Unique destinations contacted by one source  |
| **Fan-in**             | Unique sources contacting one destination    |
| **Jitter**             | Variation in repeated connection intervals   |

### Conversation extraction

```bash
tshark -r capture.pcap -Y 'tcp' -T fields \
  -e frame.time_epoch \
  -e ip.src \
  -e tcp.srcport \
  -e ip.dst \
  -e tcp.dstport \
  -e frame.len \
  -E header=y -E separator=, > output/tcp_packets.csv
```

### Measurement rule

Distinguish captured length from original wire length when packets may have been truncated by snap length.

## 10. TCP Session Analysis

TCP evidence can show connection attempts, successful handshakes, resets, retransmissions, duration, and byte direction.

### TCP signals

| Signal             | Interpretation                                      |
| ------------------ | --------------------------------------------------- |
| **SYN**            | Connection attempt                                  |
| **SYN and ACK**    | Server accepted initial handshake step              |
| **ACK**            | Established-stream traffic or acknowledgment        |
| **FIN**            | Graceful close                                      |
| **RST**            | Abrupt reset, rejection, or application termination |
| **Retransmission** | Loss, delay, congestion, or blocked path            |
| **Zero window**    | Receiver temporarily cannot accept more data        |

### Useful filters

```text
tcp.flags.syn == 1 and tcp.flags.ack == 0
tcp.flags.reset == 1
tcp.analysis.retransmission
tcp.analysis.lost_segment
tcp.stream == 42
```

### Session commands

```bash
# List initial SYN packets
tshark -r capture.pcap -Y 'tcp.flags.syn == 1 and tcp.flags.ack == 0' \
  -T fields -e frame.time_epoch -e ip.src -e tcp.srcport -e ip.dst -e tcp.dstport

# Follow an identified TCP stream
tshark -r capture.pcap -q -z follow,tcp,ascii,42
```

### Interpretation caution

A SYN and SYN-ACK show network reachability, not successful application authentication. A complete TCP handshake does not prove the user logged in.

## 11. DNS Fundamentals

DNS messages contain a header, question section, and response sections with resource records. RFC 1035 defines standard queries, responses, resource-record formats, and DNS transport behavior.

### DNS fields

| Field              | Meaning                                  |
| ------------------ | ---------------------------------------- |
| **Transaction ID** | Matches query and response               |
| **QR flag**        | Query or response                        |
| **Opcode**         | Type of operation                        |
| **Response code**  | NOERROR, NXDOMAIN, SERVFAIL, and others  |
| **Query name**     | Requested domain name                    |
| **Query type**     | A, AAAA, TXT, CNAME, MX, PTR, and others |
| **Answer**         | Returned resource data                   |
| **TTL**            | Cache lifetime                           |

### DNS extraction

```bash
tshark -r capture.pcap -Y 'dns.flags.response == 0' -T fields \
  -e frame.number \
  -e frame.time_epoch \
  -e ip.src \
  -e dns.qry.name \
  -e dns.qry.type

tshark -r capture.pcap -Y 'dns.flags.response == 1' -T fields \
  -e frame.time_epoch \
  -e ip.src \
  -e dns.flags.rcode \
  -e dns.a \
  -e dns.aaaa
```

## 12. DNS Behavioral Analysis

Legitimate applications and malicious tools can both use DNS. Behavior emerges from names, types, timing, errors, and volume.

### Useful DNS metrics

| Metric                       | Investigative value                               |
| ---------------------------- | ------------------------------------------------- |
| **Queries per client**       | Identify noisy or unusual hosts                   |
| **Queries per domain**       | Identify concentrated infrastructure              |
| **Unique subdomains**        | Detect generated labels or data chunks            |
| **Label length**             | Identify unusually long encoded labels            |
| **TXT query count**          | Identify uncommon use or potential tunnel traffic |
| **NXDOMAIN rate**            | Identify failed generation or discovery behavior  |
| **Entropy or character mix** | Identify encoded or algorithmic labels            |
| **Interval regularity**      | Identify automated communications                 |

### DNS summary commands

```bash
# Query names by frequency
tshark -r capture.pcap -Y 'dns.flags.response == 0 and dns.qry.name' \
  -T fields -e dns.qry.name | sort | uniq -c | sort -nr

# TXT queries
tshark -r capture.pcap -Y 'dns.flags.response == 0 and dns.qry.type == 16' \
  -T fields -e frame.time_epoch -e ip.src -e dns.qry.name

# NXDOMAIN responses
tshark -r capture.pcap -Y 'dns.flags.response == 1 and dns.flags.rcode == 3' \
  -T fields -e frame.time_epoch -e ip.dst -e dns.qry.name
```

## 13. TLS Metadata Analysis

TLS protects application content from passive inspection, but capture evidence may still expose endpoints, timing, versions, handshake behavior, certificate metadata, and some extensions. RFC 8446 specifies TLS 1.3 as a protocol designed to prevent eavesdropping, tampering, and message forgery.

### Observable TLS evidence

| Evidence                           | Investigative value                                 |
| ---------------------------------- | --------------------------------------------------- |
| **Destination IP and port**        | Remote infrastructure                               |
| **ClientHello time**               | Session start and timing                            |
| **Server Name Indication**         | Requested hostname when visible                     |
| **TLS version**                    | Protocol compatibility and anomaly context          |
| **Cipher suites**                  | Client fingerprinting context                       |
| **Certificate subject and issuer** | Server identity context when certificate is visible |
| **Certificate validity**           | Age and lifecycle context                           |
| **Session duration and bytes**     | Behavioral comparison                               |
| **Repeated handshakes**            | Beacon or retry behavior                            |

### TLS filters

```text
tls.handshake.type == 1
tls.handshake.extensions_server_name
tls.handshake.type == 11
tls.record.version
tcp.port == 443
```

### TLS extraction

```bash
tshark -r capture.pcap -Y 'tls.handshake.type == 1' -T fields \
  -e frame.number \
  -e frame.time_epoch \
  -e ip.src \
  -e ip.dst \
  -e tls.handshake.extensions_server_name \
  -e tls.handshake.version
```

### TLS limitation

Absence of visible SNI or certificate data does not prove the session is malicious. Capture position, resumed sessions, protocol version, encrypted client hello, and incomplete packet coverage can limit metadata.

## 14. Phishing Click Reconstruction

Reconstruct the click from DNS, TCP, TLS, and application metadata.

### Expected chain

```text
Victim host resolves suspicious domain
     ↓
DNS response supplies destination address
     ↓
Victim opens TCP connection
     ↓
TLS ClientHello or HTTP request identifies target
     ↓
Redirects or additional domains appear
     ↓
Outbound request and inbound response sizes change
```

### Analysis questions

- Which host initiated the traffic?
- Which domain was resolved?
- Which IP was returned?
- How soon after DNS did TCP and TLS begin?
- Was SNI visible?
- Were redirects or additional hostnames contacted?
- Was HTTP form submission visible in cleartext traffic?
- Did packet sizes indicate only page loading or a later upload?
- Did the same host begin new activity after the click?

### Credential-submission caution

Encrypted HTTPS may prevent confirmation of submitted form contents. A POST cannot be inferred solely from byte volume. Report what the network evidence supports and identify required identity or endpoint evidence.

## 15. Beaconing Fundamentals

Beaconing appears as repeated sessions with similar destinations, intervals, durations, and byte sizes.

### Beacon features

| Feature              | Suspicious pattern                                         |
| -------------------- | ---------------------------------------------------------- |
| **Destination**      | Same external IP or domain repeatedly                      |
| **Interval**         | Regular or intentionally jittered timing                   |
| **Duration**         | Short and similar session lengths                          |
| **Bytes**            | Low, stable request and response volumes                   |
| **Protocol**         | Common protocol used without normal application behavior   |
| **Time coverage**    | Persists through inactive user periods                     |
| **Connection shape** | Repeated new handshakes rather than long browsing sessions |

### Why signatures may miss beaconing

- Traffic is encrypted.
- Infrastructure is new or unknown.
- Protocol syntax is valid.
- Payload contains no known signature.
- Each session is individually ordinary.
- Maliciousness appears only across time.

## 16. Beacon Timing Analysis

Calculate connection start times and inter-arrival intervals for one endpoint pair.

### Extract initial connections

```bash
tshark -r c2_beaconing.pcap \
  -Y 'tcp.flags.syn == 1 and tcp.flags.ack == 0' \
  -T fields \
  -e frame.time_epoch \
  -e ip.src \
  -e ip.dst \
  -e tcp.dstport \
  -E separator=, > output/syn_starts.csv
```

### Interval analysis with Python

```python
#!/usr/bin/env python3
import csv
import statistics
import sys

rows = []
with open(sys.argv[1], newline="", encoding="utf-8") as handle:
    for row in csv.reader(handle):
        if len(row) >= 4 and row[0]:
            rows.append((float(row[0]), row[1], row[2], row[3]))

groups = {}
for timestamp, source, destination, port in rows:
    groups.setdefault((source, destination, port), []).append(timestamp)

for key, timestamps in groups.items():
    timestamps.sort()
    intervals = [b - a for a, b in zip(timestamps, timestamps[1:])]
    if len(intervals) < 2:
        continue
    mean = statistics.mean(intervals)
    stdev = statistics.pstdev(intervals)
    print(key, "count=", len(timestamps), "mean=", round(mean, 3), "stdev=", round(stdev, 3))
```

### Timing measures

| Measure                      | Interpretation                |
| ---------------------------- | ----------------------------- |
| **Mean interval**            | Typical repeat period         |
| **Median interval**          | Robust central interval       |
| **Standard deviation**       | Absolute timing variability   |
| **Coefficient of variation** | Variability relative to mean  |
| **Minimum and maximum**      | Outliers and missed sessions  |
| **Session count**            | Evidence strength across time |

### Timing caution

Scheduled legitimate software can beacon. Timing must be combined with destination context, host role, process evidence when available, bytes, and baseline comparison.

## 17. Human Browsing Versus Automation

| Human browsing                           | Automated beaconing               |
| ---------------------------------------- | --------------------------------- |
| Bursty navigation and idle periods       | Repeated machine-timed intervals  |
| Many related domains and content hosts   | Small stable destination set      |
| Variable session duration                | Similar short duration            |
| Variable request and response sizes      | Stable low byte counts            |
| Sessions aligned with user activity      | Continues overnight or unattended |
| Connection sequences follow page content | Repeated isolated sessions        |

### Classification rule

These are tendencies, not proof. Background browser services, software updates, monitoring agents, and synchronization clients can also be periodic.

## 18. DNS Tunneling Detection

DNS tunneling encodes commands or data into query names, resource records, or responses.

### Suspicious DNS characteristics

| Characteristic                | Why it matters                                       |
| ----------------------------- | ---------------------------------------------------- |
| Long leftmost labels          | Possible encoded data chunks                         |
| High unique-subdomain count   | Each query carries new data                          |
| TXT query concentration       | Potential bidirectional data transport               |
| Restricted character alphabet | Base32, Base64-like, hexadecimal, or custom encoding |
| High entropy                  | Labels resemble encoded or compressed content        |
| Regular timing                | Automated tunnel client                              |
| One unusual base domain       | Controlled tunnel endpoint                           |
| Query-response size asymmetry | Upload or download direction clue                    |
| Low cache reuse               | Unique names avoid caching                           |

### Extraction commands

```bash
# TXT query names
tshark -r dns_exfil.pcap -Y 'dns.flags.response == 0 and dns.qry.type == 16' \
  -T fields -e frame.time_epoch -e ip.src -e dns.qry.name > output/txt_queries.tsv

# All query lengths
tshark -r dns_exfil.pcap -Y 'dns.flags.response == 0 and dns.qry.name' \
  -T fields -e dns.qry.name | awk '{ print length($0), $0 }' | sort -nr

# Unique query count
tshark -r dns_exfil.pcap -Y 'dns.flags.response == 0 and dns.qry.name' \
  -T fields -e dns.qry.name | sort -u | wc -l
```

### Encoding caution

Do not decode arbitrary labels as though they are definitely exfiltrated data. First identify the character set, padding behavior, chunk order, and base domain. Preserve original labels and document every transformation.

## 19. DNS Exfiltration Estimation

Estimate likely payload volume without claiming exact original data size.

### Estimation model

```text
For each suspicious query:
  isolate encoded data labels
  remove sequence numbers and fixed metadata
  measure encoded characters
  apply encoding ratio when encoding is supported by evidence
  sum estimated decoded bytes
```

### Common theoretical ratios

| Encoding           | Approximate decoded capacity            |
| ------------------ | --------------------------------------- |
| **Hexadecimal**    | One byte per two encoded characters     |
| **Base32**         | Five bytes per eight encoded characters |
| **Base64**         | Three bytes per four encoded characters |
| **Unknown custom** | Report encoded character volume only    |

### Estimation record

```json
{
  "base_domain": "tunnel.example",
  "query_count": 420,
  "encoded_character_count": 23800,
  "suspected_encoding": "base32",
  "estimated_decoded_bytes": 14875,
  "confidence": "medium",
  "limitations": [
    "Protocol overhead and sequence labels excluded heuristically",
    "Compression before encoding cannot be measured"
  ]
}
```

### Estimation rule

Use words such as estimated, lower bound, or encoded volume. Packet evidence may not reveal compression ratio, retries, duplicate chunks, padding, or application framing.

## 20. Lateral Movement Analysis

Lateral movement appears as new cross-subnet connections, administrative protocols, authentication exchanges, and changing internal communication paths.

### Indicators

| Pattern                                 | Investigative value                     |
| --------------------------------------- | --------------------------------------- |
| New source-to-destination pair          | Unexpected pivot path                   |
| Workstation initiates SMB to server     | File access or remote administration    |
| Workstation initiates RDP to peer       | Interactive movement possibility        |
| Many failed connections before success  | Discovery or credential guessing        |
| One host contacts many internal systems | Scanning or broad movement              |
| New high-port RPC connections           | Windows remote-service activity context |
| VPN source followed by internal pivot   | External access relationship            |

### Cross-subnet query

```bash
tshark -r lateral_movement.pcap -Y 'tcp.flags.syn == 1 and tcp.flags.ack == 0' \
  -T fields -e frame.time_epoch -e ip.src -e ip.dst -e tcp.dstport | sort -u
```

### Movement caution

Network traffic can show access attempts and protocol sessions, but it may not reveal which credentials were used or whether authorization succeeded when application traffic is encrypted.

## 21. RDP Analysis

RDP commonly uses TCP port 3389, but port alone is not proof of protocol or successful login.

### RDP evidence

| Evidence                            | Meaning                                             |
| ----------------------------------- | --------------------------------------------------- |
| TCP handshake to 3389               | Reachable service and connection attempt            |
| RDP negotiation                     | Protocol identification                             |
| TLS handshake after RDP negotiation | Encrypted RDP session setup                         |
| Repeated short attempts             | Possible failures, scanning, or connection problems |
| Sustained bidirectional session     | Possible interactive session                        |
| Session after VPN login             | Potential remote-access chain                       |

### Filters

```text
rdp
tcp.port == 3389
tpkt or cotp
tls and tcp.port == 3389
```

### RDP caution

A sustained RDP connection is evidence of an established network session, not definitive proof of authenticated desktop access. State the distinction.

## 22. SMB Analysis

SMB traffic can reveal negotiation, sessions, tree connections, file access, and administrative-share use when fields are visible.

### SMB evidence

| Evidence               | Investigative value            |
| ---------------------- | ------------------------------ |
| SMB2 negotiate         | Protocol setup                 |
| Session setup response | Authentication result context  |
| Tree connect           | Share access                   |
| ADMIN$ or C$           | Administrative-share activity  |
| File create or write   | Remote file operation          |
| Named pipe access      | Remote service or RPC activity |
| Repeated status errors | Failed access attempts         |

### Filters

```text
smb2
tcp.port == 445
smb2.cmd == 0
smb2.cmd == 1
smb2.cmd == 3
smb2.filename
```

### SMB extraction

```bash
tshark -r lateral_movement.pcap -Y 'smb2' -T fields \
  -e frame.number \
  -e frame.time_epoch \
  -e ip.src \
  -e ip.dst \
  -e smb2.cmd \
  -e smb2.nt_status \
  -e smb2.filename
```

## 23. Authentication-Related Traffic

Network evidence can expose protocol handshakes and authentication outcomes, but credential contents are often encrypted.

### Relevant protocols

| Protocol              | Evidence value                                                    |
| --------------------- | ----------------------------------------------------------------- |
| **Kerberos**          | Ticket requests, service access, and error codes                  |
| **NTLMSSP**           | Challenge-response negotiation and account metadata where visible |
| **LDAP**              | Directory queries and bind behavior when not encrypted            |
| **SMB session setup** | Authentication success or failure context                         |
| **RDP negotiation**   | Remote-access preparation and session behavior                    |
| **VPN protocol**      | External connection and tunnel establishment                      |

### Interpretation rule

Differentiate network connection success, protocol negotiation success, and user authentication success. They are separate events.

## 24. VPN and External Access

Assess whether external access preceded internal movement.

### VPN analysis fields

| Field                        | Purpose                                 |
| ---------------------------- | --------------------------------------- |
| **External source IP**       | Remote origin                           |
| **Gateway IP and port**      | VPN service endpoint                    |
| **Tunnel start and end**     | Access window                           |
| **Assigned internal IP**     | Link remote session to internal traffic |
| **Authentication metadata**  | User or result when visible             |
| **Post-tunnel destinations** | Internal access path                    |
| **Byte direction**           | Session behavior                        |

### Correlation chain

```text
External source contacts VPN gateway
     ↓
Tunnel or authenticated session begins
     ↓
Assigned address appears internally
     ↓
RDP or SMB connection begins
     ↓
Target host communication follows
```

### VPN caution

Encrypted VPN payload may hide internal activity from a perimeter capture. Correlate captures from both sides of the tunnel when available.

## 25. Cross-PCAP Correlation

Multiple captures may overlap, contain duplicates, use different timestamp precision, or observe the same flow at different points.

### Correlation keys

| Key                                | Use                                   |
| ---------------------------------- | ------------------------------------- |
| **Timestamp**                      | Order activity and align captures     |
| **Five-tuple**                     | Match transport flows                 |
| **DNS transaction and name**       | Link name resolution to later traffic |
| **TLS SNI and destination**        | Link hostname to encrypted session    |
| **TCP sequence context**           | Identify duplicated observations      |
| **Packet length and payload hash** | Support same-packet comparison        |
| **Capture point**                  | Explain NAT or addressing differences |

### Merge workflow

```bash
# Preserve originals, then create a derived merged capture
mergecap -w network_case/work/merged_timeline.pcap \
  network_case/work/phishing_click.pcap \
  network_case/work/c2_beaconing.pcap \
  network_case/work/dns_exfil.pcap \
  network_case/work/lateral_movement.pcap

sha256sum network_case/work/merged_timeline.pcap
capinfos network_case/work/merged_timeline.pcap
```

### Merge caution

Merging does not automatically remove duplicate packets or correct clock skew. Record capture-point offsets and deduplication logic separately.

## 26. Attack Timeline Reconstruction

Build the timeline from packet-level facts before writing the narrative.

### Timeline fields

| Field                 | Purpose                                          |
| --------------------- | ------------------------------------------------ |
| **timestamp_utc**     | Normalized event time                            |
| **capture_id**        | Source PCAP                                      |
| **frame_number**      | Exact packet reference                           |
| **src_ip and dst_ip** | Endpoints                                        |
| **protocol**          | DNS, TLS, RDP, SMB, VPN, or other                |
| **action**            | Query, connection, handshake, transfer, or reset |
| **indicator**         | Domain, IP, SNI, certificate, or share           |
| **interpretation**    | Bounded analytical meaning                       |
| **confidence**        | Strength of conclusion                           |

### Attack-chain phases

```text
Phishing-domain resolution and click
     ↓
Possible credential submission
     ↓
External or VPN access
     ↓
Internal authentication and lateral movement
     ↓
Command-and-control beaconing
     ↓
Collection or staging indicators
     ↓
DNS tunneling or other exfiltration
```

### Timeline rule

Every timeline statement should point to a capture and frame number or a reproducible conversation statistic.

## 27. IOC Extraction

### Network indicators

| Indicator                       | Source                                |
| ------------------------------- | ------------------------------------- |
| **Domain**                      | DNS query, SNI, HTTP host             |
| **IP address**                  | DNS answer or conversation peer       |
| **Port and protocol**           | Flow and service context              |
| **URL**                         | Cleartext HTTP fields when present    |
| **Certificate fingerprint**     | TLS certificate metadata when visible |
| **JA3-like client fingerprint** | Tool-generated context when supported |
| **SMB share or filename**       | Lateral movement evidence             |
| **Beacon interval**             | Behavioral indicator                  |
| **DNS label pattern**           | Tunnel behavior                       |

### IOC record

```json
{
  "indicator_id": "NET-IOC-001",
  "type": "domain",
  "value": "example.invalid",
  "role": "suspected_command_and_control",
  "first_seen_utc": "2026-10-09T01:15:00Z",
  "last_seen_utc": "2026-10-09T06:45:00Z",
  "source_capture": "c2_beaconing.pcap",
  "frame_numbers": [120, 488, 855],
  "confidence": "high",
  "false_positive_risk": "medium"
}
```

### IOC rule

Store infrastructure indicators and behavioral indicators separately. Shared hosting IPs may have high false-positive risk, while a stable beacon pattern can remain useful after infrastructure changes.

## 28. MITRE ATT&CK Mapping

ATT&CK mapping should follow observed network behavior.

| Observed behavior                    | ATT&CK area                                                         |
| ------------------------------------ | ------------------------------------------------------------------- |
| Repeated encrypted outbound sessions | Command and Control tactic, technique selected by protocol evidence |
| DNS used for command traffic         | Application Layer Protocol: DNS context                             |
| DNS used to move stolen data         | Exfiltration Over Alternative Protocol context                      |
| RDP used for internal movement       | Remote Services: Remote Desktop Protocol context                    |
| SMB used for internal movement       | Remote Services or SMB-related movement context                     |
| VPN or valid remote access           | Valid Accounts or external remote services when supported           |

MITRE ATT&CK describes T1048 as exfiltration over a protocol different from the main command-and-control channel and explicitly includes DNS among possible alternative protocols.

### Mapping rule

Do not map DNS exfiltration solely because TXT queries are unusual. Support the mapping with encoded labels, volume, timing, controlled infrastructure, and a data-transfer interpretation.

## 29. Network Forensics Report

### Required fields

| Field                       | Purpose                                         |
| --------------------------- | ----------------------------------------------- |
| **case_id**                 | Stable investigation identifier                 |
| **capture_manifest**        | Files, hashes, coverage, and sensors            |
| **executive_summary**       | Bounded conclusion                              |
| **baseline_summary**        | Normal traffic reference                        |
| **findings**                | Evidence-supported analytical findings          |
| **timeline**                | Chronological packet references                 |
| **affected_hosts**          | Internal systems involved                       |
| **external_infrastructure** | Domains, IPs, ports, and certificates           |
| **beacon_analysis**         | Intervals, jitter, durations, and bytes         |
| **dns_tunnel_analysis**     | Names, types, encoding, and estimated volume    |
| **lateral_movement**        | Source, target, protocol, and success evidence  |
| **iocs**                    | Structured network indicators                   |
| **techniques**              | ATT&CK mappings                                 |
| **limitations**             | Visibility and confidence boundaries            |
| **recommended_actions**     | Defensive next steps through authorized process |

### Finding example

```json
{
  "finding_id": "NET-FND-003",
  "title": "Periodic encrypted outbound sessions",
  "severity": "high",
  "confidence": "high",
  "source_host": "10.20.30.40",
  "destination_ip": "203.0.113.50",
  "destination_port": 443,
  "connection_count": 64,
  "mean_interval_seconds": 300.8,
  "interval_stdev_seconds": 7.2,
  "median_duration_seconds": 2.1,
  "evidence": [
    { "capture": "c2_beaconing.pcap", "frame": 120 },
    { "capture": "c2_beaconing.pcap", "frame": 488 }
  ],
  "assessment": "Traffic is consistent with automated beaconing and differs from the clinical baseline.",
  "limitations": ["Encrypted payload prevents command-content inspection"]
}
```

## 30. Evidence Package

```text
wire_shark_territory/
├── README.md
├── raw/
│   └── SHA256SUMS
├── inventory/
│   ├── capture-manifest.json
│   ├── protocol-hierarchy.txt
│   └── conversations.json
├── baseline/
│   └── clinical-baseline.json
├── phishing/
│   └── click-timeline.json
├── beaconing/
│   ├── connection-starts.csv
│   └── beacon-analysis.json
├── dns/
│   ├── dns-queries.jsonl
│   └── tunnel-analysis.json
├── lateral_movement/
│   ├── rdp-analysis.json
│   └── smb-analysis.json
├── timeline/
│   └── attack-timeline.jsonl
├── indicators/
│   └── network-iocs.json
├── reports/
│   └── network-forensics-report.json
├── MANIFEST.json
└── SHA256SUMS
```

### Package principle

Derived CSV, JSON, and reduced PCAP files must include the source capture hash, command used, tool version, and generation time.

## 31. Quality Gates

| Gate                 | Pass condition                                                                |
| -------------------- | ----------------------------------------------------------------------------- |
| **Integrity**        | Every original PCAP has a verified hash                                       |
| **Coverage**         | Time range, packet count, and capture point are recorded                      |
| **Baseline**         | Normal and suspicious captures use identical metrics                          |
| **Conversations**    | Top endpoints and flows are inventoried                                       |
| **DNS**              | Query names, types, clients, and response codes are analyzed                  |
| **TLS**              | Metadata conclusions state encryption limitations                             |
| **Beacon**           | Timing result includes count, intervals, variability, and baseline comparison |
| **Tunnel**           | Encoding and volume claims are explicitly qualified                           |
| **Lateral movement** | Network reachability is separated from authentication success                 |
| **Timeline**         | Every significant claim has packet or statistic references                    |
| **IOCs**             | Every indicator has source, time, confidence, and false-positive risk         |
| **Report**           | Findings and limitations validate against the required schema                 |

### Validation commands

```bash
find wire_shark_territory -name '*.json' -print0 | xargs -0 -n1 jq empty
find wire_shark_territory -name '*.jsonl' -print0 | while IFS= read -r -d '' file; do jq -c . "$file" >/dev/null || exit 1; done
sha256sum -c wire_shark_territory/SHA256SUMS
capinfos wire_shark_territory/raw/*.pcap
```

## 32. Professional Judgment

Separate packet facts, protocol interpretation, and attacker-behavior hypotheses.

| Statement type  | Example                                                         |
| --------------- | --------------------------------------------------------------- |
| **Fact**        | One host opened 64 TCP sessions to one IP on port 443           |
| **Measurement** | Mean interval was approximately five minutes with low variation |
| **Inference**   | Sessions were likely generated by automated software            |
| **Hypothesis**  | Activity is consistent with command-and-control beaconing       |
| **Limitation**  | Encrypted payload prevents command-content confirmation         |

### Decision principles

- Packets are evidence of observed traffic, not complete environmental truth.
- A TCP handshake does not prove successful application authentication.
- Port numbers do not prove application protocol.
- Encrypted traffic can be analyzed behaviorally but not treated as decrypted content.
- Repetition alone does not prove malware; compare with a suitable baseline.
- Long DNS labels alone do not prove tunneling.
- A DNS tunnel does not automatically prove useful data was exfiltrated.
- Report capture gaps, truncation, clock skew, asymmetric routing, and packet loss.
- Never contact suspicious infrastructure from a production system.

## 33. Framework and Tool Map

| Item                    | Purpose                                             |
| ----------------------- | --------------------------------------------------- |
| **Wireshark**           | Interactive protocol dissection and visual analysis |
| **TShark**              | Reproducible command-line packet analysis           |
| **tcpdump**             | Packet summaries and packet-level filtering         |
| **capinfos**            | Capture metadata and statistics                     |
| **mergecap**            | Create derived merged captures                      |
| **editcap**             | Create bounded or transformed working captures      |
| **RFC 1035**            | DNS message and resource-record structure           |
| **RFC 8446**            | TLS 1.3 protocol and handshake reference            |
| **MITRE ATT&CK TA0011** | Command-and-control behavior context                |
| **MITRE ATT&CK T1048**  | Alternative-protocol exfiltration context           |
| **MITRE ATT&CK TA0008** | Lateral-movement behavior context                   |
| **Python statistics**   | Interval, jitter, and distribution measurement      |
| **sha256sum**           | Evidence and package integrity                      |

## 34. Fast Recall

- **Hash original PCAPs and analyze verified working copies.**
- **Measure capture coverage before drawing conclusions.**
- **Start with protocol hierarchy, endpoints, and conversations.**
- **Use the same metrics for baseline and suspicious captures.**
- **Capture filters remove traffic before recording. Display filters only change the analysis view.**
- **TShark reads saved captures with the r option and uses Wireshark display filters with the Y option.**
- **A TCP handshake proves reachability, not successful login.**
- **DNS analysis needs names, types, clients, responses, rates, and timing.**
- **TLS content may be encrypted, but timing, endpoints, SNI, versions, certificates, and volumes may remain useful.**
- **Beaconing appears across time through repeated destination, interval, duration, and byte patterns.**
- **Low jitter supports automation but does not prove malware.**
- **Human browsing is usually burstier and more variable than simple beaconing.**
- **DNS tunneling often creates long, unique, encoded-looking labels and unusual query behavior.**
- **Estimate exfiltration volume conservatively and document encoding assumptions.**
- **RDP and SMB can show movement paths, but encrypted application evidence may limit authentication conclusions.**
- **Cross-PCAP merging does not automatically correct duplicates or clock skew.**
- **Every timeline claim needs a capture and frame number or reproducible statistic.**
- **Separate indicators of infrastructure from indicators of behavior.**
- **State limitations as clearly as findings.**

## 35. Resources

**Wireshark and TShark**

- [Wireshark Display Filter Reference](https://www.wireshark.org/docs/dfref/)
- [Wireshark Display Filter Manual](https://www.wireshark.org/docs/man-pages/wireshark-filter.html)
- [TShark Manual](https://www.wireshark.org/docs/man-pages/tshark.html)

**Protocol references**

- [RFC 1035: Domain Names, Implementation and Specification](https://datatracker.ietf.org/doc/html/rfc1035)
- [RFC 8446: TLS 1.3](https://datatracker.ietf.org/doc/html/rfc8446)

**Attack behavior**

- [MITRE ATT&CK: Command and Control](https://attack.mitre.org/tactics/TA0011/)
- [MITRE ATT&CK: Exfiltration Over Alternative Protocol T1048](https://attack.mitre.org/techniques/T1048/)
- [MITRE ATT&CK: Lateral Movement](https://attack.mitre.org/tactics/TA0008/)

**Man or help**

```text
man tshark
man tcpdump
man wireshark-filter
man dig
man base64
```
