# Perimeter and Network Defense

> **⚠️ AUTHORIZED USE ONLY.** This material is for education, defensive network administration, and authorized security monitoring. Apply firewall rules, scans, packet capture analysis, Suricata replay, and protocol audits only to networks and systems you own or are explicitly authorized to test. Network controls can block legitimate service paths, interrupt administration, expose sensitive traffic in captures, or generate misleading alerts if tested carelessly. Validate in a safe window, keep console or recovery access available, and preserve evidence integrity. See the [Legal and Terms of Use](/legal) page.

> "The network is the only place where you can see an attacker before they are inside a machine. Lose that view and you lose the first move." (Richard Bejtlich, The Practice of Network Security Monitoring)

**Scope:** Perimeter and internal network defense for Linux and Windows hosts: interface discovery, attack-surface enumeration, zone design, host firewall policy, nftables default-deny rules, Windows Firewall alignment, stateful filtering, connection tracking, secure-protocol replacement, DNS filtering and validation, firewall log analysis, scan detection, Suricata offline PCAP replay, EVE JSON parsing, custom Suricata rule writing, tshark and tcpdump investigation, PCAP summarization, and structured network evidence packaging.

## Table of Contents
- [Core Concepts](#core-concepts)
- [Network Defense Fundamentals](#network-defense-fundamentals)
- [Zones and Segmentation](#zones-and-segmentation)
- [Firewall Models](#firewall-models)
- [nftables Fundamentals](#nftables-fundamentals)
- [Default-Deny Host Firewall Design](#default-deny-host-firewall-design)
- [Zone-Based Allow Rules](#zone-based-allow-rules)
- [Windows Firewall Alignment](#windows-firewall-alignment)
- [Connection Testing and Rule Validation](#connection-testing-and-rule-validation)
- [Secure Protocol Audit](#secure-protocol-audit)
- [DNS Filtering and Query Validation](#dns-filtering-and-query-validation)
- [Firewall Logging and Scan Detection](#firewall-logging-and-scan-detection)
- [IDS, IPS, and Suricata Modes](#ids-ips-and-suricata-modes)
- [Suricata Offline PCAP Replay](#suricata-offline-pcap-replay)
- [Custom Suricata Rules](#custom-suricata-rules)
- [PCAP Investigation with tshark and tcpdump](#pcap-investigation-with-tshark-and-tcpdump)
- [Network Evidence Package](#network-evidence-package)
- [Professional Judgment](#professional-judgment)
- [Framework and Tool Map](#framework-and-tool-map)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Concepts

| Term | Meaning |
| --- | --- |
| **Perimeter** | The boundary where traffic crosses between zones, networks, hosts, or trust levels |
| **Segmentation** | Dividing a network into zones so compromise in one area does not automatically reach another |
| **Default-deny** | A security posture where traffic is blocked unless explicitly allowed |
| **Allow rule** | A firewall rule that permits a defined source, destination, protocol, and port |
| **Stateful firewall** | A firewall that tracks connection state and allows related return traffic |
| **Stateless firewall** | A firewall that evaluates each packet independently without connection context |
| **IDS** | Intrusion detection system that observes traffic and produces alerts |
| **IPS** | Intrusion prevention system that can block or drop traffic inline |
| **PCAP** | Packet capture file containing recorded network traffic |
| **EVE JSON** | Suricata machine-readable event output format for alerts, flows, DNS, HTTP, TLS, and other records |

### The core idea

```text
Flat network
     ↓
Any host can reach any host
     ↓
One compromise can become many
     ↓
Zones restrict paths
     ↓
Firewall rules enforce intent
     ↓
Logs and PCAPs prove what happened
```

The network layer is where you can limit lateral movement before it touches another endpoint. Endpoint hardening controls what happens on a host. Network defense controls which paths exist between hosts.

## 2. Network Defense Fundamentals

Network defense is not just blocking inbound internet traffic. It is the deliberate design, enforcement, testing, and monitoring of allowed communication paths.

### What network defense controls

| Control area | Purpose |
| --- | --- |
| **Reachability** | Decide which systems can talk to which services |
| **Blast radius** | Limit how far compromise can spread |
| **Protocol safety** | Replace cleartext and legacy protocols with encrypted or authenticated alternatives |
| **Visibility** | Produce firewall logs, alerts, flows, and PCAP summaries |
| **Evidence** | Package network observations so analysts can investigate without reprocessing raw data |

### The network defense loop

```text
Map interfaces and neighbors
     ↓
Enumerate listening services
     ↓
Define zones and allowed paths
     ↓
Enforce rules locally
     ↓
Test every allow and deny
     ↓
Log blocked traffic
     ↓
Analyze PCAPs and IDS alerts
     ↓
Export structured evidence
```

### Security reality

A hardened host on a flat network is still exposed to every other host on that network. Segmentation does not assume attackers will fail. It assumes one system may fall and makes the next step harder.

## 3. Zones and Segmentation

Zones express intent. A server zone, management zone, user zone, guest zone, and device zone should not have identical access paths.

### Common zone model

| Zone | Typical systems | Baseline posture |
| --- | --- | --- |
| **Management** | Admin workstations, jump hosts | Can administer approved targets only |
| **Server** | Web, database, application, logging servers | Allows required service paths only |
| **User** | Workstations and clinical or office endpoints | Limited access to published services |
| **Guest** | Guest Wi-Fi and unmanaged clients | Internet-only or tightly constrained |
| **Device** | Printers, medical devices, appliances, sensors | Vendor-required paths only, heavily restricted |
| **Logging** | Log collectors or evidence hosts | Receives logs from approved sources |

### Segmentation principle

```text
Every allowed path must answer four questions:
Who is the source?
What is the destination?
Which protocol and port are required?
Why does the business or system need this path?
```

### Blast-radius reduction

| Without segmentation | With segmentation |
| --- | --- |
| Any compromised host can scan every service | Compromised host sees only allowed paths |
| Guest networks can reach internal services | Guest networks are isolated |
| Legacy devices expose weak protocols broadly | Legacy devices are reachable only from required managers |
| SMB, RDP, SSH, and database services sprawl | Administrative and data paths are explicit |

## 4. Firewall Models

Firewalls exist at different layers and locations. The right design often uses both network firewalls and host firewalls.

### Host-based versus network-based

| Firewall type | Where it runs | Strength | Limitation |
| --- | --- | --- | --- |
| **Host-based firewall** | On the endpoint itself | Protects the host even inside the network | Must be managed consistently per host |
| **Network firewall** | Between networks or zones | Enforces boundaries for many systems | May not see host-local or same-segment traffic |
| **Cloud security group** | Around cloud interfaces or workloads | Simple policy near workload | Cloud-specific semantics and visibility |
| **Personal firewall** | Workstation host firewall | Controls endpoint exposure | Can be changed by local admin if not centrally governed |

### Stateful versus stateless

| Model | How it decides | Use case |
| --- | --- | --- |
| **Stateful filtering** | Tracks connection state such as established and related | Most host and perimeter firewall rules |
| **Stateless filtering** | Evaluates each packet independently | Simple edge cases, high-performance filtering, pre-filtering |
| **Application-aware filtering** | Understands protocol or proxy context | Web proxies, gateways, specialized inspection |

### Baseline decision

Use stateful default-deny for host protection unless there is a clear reason not to. It allows return traffic for approved sessions without opening broad inbound paths.

## 5. nftables Fundamentals

nftables is built from tables, chains, rules, expressions, statements, and sets. Readable design matters because firewall rules become operational documentation.

### Building blocks

| Component | Meaning |
| --- | --- |
| **Table** | Container for chains, usually grouped by family such as inet |
| **Chain** | Ordered container of rules, optionally attached to a hook |
| **Rule** | Match conditions plus action, such as accept, drop, reject, log, or counter |
| **Set** | Named group of values such as ports, IP addresses, or networks |
| **Hook** | Packet processing point such as input, forward, or output |
| **Policy** | Default verdict for a base chain, commonly drop or accept |
| **Connection tracking** | Kernel state tracking used for established and related traffic |

### Basic inspection commands

```bash
# Show all rules
sudo nft list ruleset

# Show tables only
sudo nft list tables

# Validate a ruleset file without applying it
sudo nft -c -f ruleset.nft

# Load a ruleset atomically from a file
sudo nft -f ruleset.nft

# Flush ruleset only when you have recovery access
sudo nft flush ruleset
```

### Readability rule

Use named sets for zones, service ports, and trusted sources. Repeating raw IP addresses across many rules makes the firewall harder to audit and easier to break.

## 6. Default-Deny Host Firewall Design

Default-deny means the host accepts only traffic that has a documented reason to exist. It is the baseline for every interface, not only internet-facing interfaces.

### Minimal server ruleset pattern

```nft
flush ruleset

table inet filter {
    set mgmt_hosts {
        type ipv4_addr
        elements = { 10.10.10.10, 10.10.10.11 }
    }

    set web_ports {
        type inet_service
        elements = { 80, 443 }
    }

    chain input {
        type filter hook input priority 0; policy drop;

        iif lo accept
        ct state established,related accept
        ct state invalid drop

        ip protocol icmp limit rate 5/second accept
        ip saddr @mgmt_hosts tcp dport 22 ct state new accept
        tcp dport @web_ports ct state new accept

        limit rate 10/minute log prefix "nft-drop-input " flags all
        counter drop
    }

    chain forward {
        type filter hook forward priority 0; policy drop;
    }

    chain output {
        type filter hook output priority 0; policy accept;
    }
}
```

### Default-deny checklist

| Requirement | Why it matters |
| --- | --- |
| **Loopback allowed** | Local services often depend on loopback traffic |
| **Established and related allowed** | Return traffic for approved sessions must work |
| **Invalid dropped** | Broken or suspicious connection states should not pass |
| **Management restricted** | SSH or RDP should not be open to every source |
| **Service ports explicit** | Every listener needs a documented reason |
| **Logging rate-limited** | Logs should be useful without flooding disk |
| **Recovery path available** | Bad rules can lock out administrators |

## 7. Zone-Based Allow Rules

Zone-based rules translate architecture into enforcement. If a path is not in the zone matrix, the firewall should deny it.

### Zone matrix example

| Source zone | Destination zone | Allowed purpose |
| --- | --- | --- |
| Management | Server | Administration to approved ports only |
| User | Server | Published application ports only |
| Server | Logging | Log forwarding only |
| Server | DNS resolver | DNS queries only |
| Guest | Internal zones | None by default |
| Device | Vendor manager | Vendor-required management path only |

### nftables set pattern

```nft
table inet filter {
    set mgmt_hosts {
        type ipv4_addr
        elements = { 10.10.10.10, 10.10.10.11 }
    }

    set user_subnets {
        type ipv4_addr
        flags interval
        elements = { 10.20.0.0/16 }
    }

    set published_ports {
        type inet_service
        elements = { 443 }
    }

    chain input {
        type filter hook input priority 0; policy drop;
        iif lo accept
        ct state established,related accept
        ip saddr @mgmt_hosts tcp dport 22 accept
        ip saddr @user_subnets tcp dport @published_ports accept
        log prefix "zone-deny " flags all
        drop
    }
}
```

### Rule review questions

```text
Does the rule state source, destination, protocol, and port?
Is the source a zone or named set, not the whole network?
Is the destination service actually listening?
Is the business purpose documented?
Was the rule tested for both allow and deny behavior?
```

## 8. Windows Firewall Alignment

Windows Firewall should enforce the same zone model as Linux host firewalls. The syntax differs, but the intent should match.

### Alignment fields

| Field | Linux nftables concept | Windows Firewall concept |
| --- | --- | --- |
| **Source zone** | IP set or subnet match | RemoteAddress |
| **Destination service** | Port match | LocalPort |
| **Protocol** | tcp, udp, icmp | Protocol |
| **Action** | accept, drop, reject | Allow or Block |
| **Profile** | Interface or host context | Domain, Private, Public |
| **Logging** | log statement | Firewall log settings |

### PowerShell examples

```powershell
# Default block inbound on all profiles
Set-NetFirewallProfile -Profile Domain,Private,Public -DefaultInboundAction Block

# Allow HTTPS from user subnet
New-NetFirewallRule `
  -DisplayName "Allow HTTPS from user zone" `
  -Direction Inbound `
  -Action Allow `
  -Protocol TCP `
  -LocalPort 443 `
  -RemoteAddress 10.20.0.0/16 `
  -Profile Domain

# Allow RDP only from management hosts
New-NetFirewallRule `
  -DisplayName "Allow RDP from management" `
  -Direction Inbound `
  -Action Allow `
  -Protocol TCP `
  -LocalPort 3389 `
  -RemoteAddress 10.10.10.10,10.10.10.11 `
  -Profile Domain
```

### Alignment rule

If a Linux server and Windows server live in the same zone, their allowed inbound paths should be explainable using the same policy matrix.

## 9. Connection Testing and Rule Validation

A firewall rule is not finished until it has been tested. Validate both the path that should work and the paths that should fail.

### Validation command set

```bash
# Show local interfaces and addresses
ip addr show

# Show routes
ip route show

# Show listening TCP and UDP sockets
ss -tulpn

# Test TCP connectivity to a port
nc -vz 10.30.0.20 443

# Trace route path
traceroute 10.30.0.20

# Capture attempted connection for proof
sudo tcpdump -nn -i eth0 host 10.30.0.20 and port 443

# Review firewall counters
sudo nft list ruleset
```

### Validation matrix fields

| Field | Meaning |
| --- | --- |
| **test_id** | Unique identifier for the connection test |
| **source_host** | Host where the test originated |
| **source_zone** | Zone assigned to the source |
| **destination_host** | Target host |
| **destination_port** | Port tested |
| **expected_result** | allow or deny |
| **observed_result** | connected, refused, timed_out, dropped, rejected |
| **evidence_pointer** | Command output, firewall log, packet capture, or counter reference |

### Testing principle

Test from at least one permitted source and one denied source. A rule that allows the right traffic but also allows everything else is not correct.

## 10. Secure Protocol Audit

Insecure protocols expose credentials, sessions, and administration paths. Protocol audit turns listening services and network captures into a remediation plan.

### Protocol replacement map

| Insecure protocol | Risk | Replacement |
| --- | --- | --- |
| **Telnet** | Cleartext credentials and commands | SSH |
| **FTP** | Cleartext credentials and data | SFTP, SCP, or FTPS where required |
| **HTTP admin surface** | Cleartext admin sessions | HTTPS with valid certificates |
| **SNMPv1** | Weak community-based access | SNMPv3 with authentication and privacy |
| **SNMPv2c** | Community strings sent without modern protection | SNMPv3 |
| **LDAP on 389** | Cleartext bind risk unless protected | LDAPS or StartTLS with validation |
| **Unrestricted SMB** | Lateral movement and file exposure | Restricted SMB, signing, and source limits |
| **Exposed RDP** | High-value remote access path | VPN or jump host plus restricted source and MFA |

### Discovery commands

```bash
# Show local listening services
ss -tulpn

# Scan known internal host from authorized scanner
nmap -sV -p 21,22,23,80,389,443,445,3389,161 10.30.0.20

# Search a PCAP for cleartext HTTP requests
tshark -r traffic.pcap -Y http.request -T fields -e ip.src -e http.host -e http.request.uri

# Search a PCAP for Telnet traffic
tshark -r traffic.pcap -Y telnet
```

### Protocol audit output

| Field | Meaning |
| --- | --- |
| **host** | System exposing or using protocol |
| **protocol** | Protocol observed |
| **port** | Port number |
| **evidence** | Socket, scan, firewall log, or PCAP reference |
| **risk** | Why the protocol is unsafe |
| **replacement** | Secure equivalent |
| **owner** | Team responsible for remediation |
| **status** | open, accepted_exception, remediated, blocked |

## 11. DNS Filtering and Query Validation

DNS is both infrastructure and an attack path. Malware commonly uses DNS for discovery, command-and-control, tunneling, or staging.

### DNS controls

| Control | Purpose |
| --- | --- |
| **Restrict resolvers** | Force clients to use approved DNS resolvers only |
| **Block direct external DNS** | Prevent clients from bypassing resolver policy |
| **Log queries** | Preserve domain evidence for investigations |
| **Validate DNSSEC where appropriate** | Reduce spoofing and tampering risk where supported |
| **Filter known-bad domains** | Block threat infrastructure and policy violations |
| **Detect tunneling patterns** | Identify high-volume, long-label, or unusual query behavior |

### nftables DNS restriction example

```nft
table inet filter {
    set approved_dns {
        type ipv4_addr
        elements = { 10.50.0.53, 10.50.0.54 }
    }

    chain output {
        type filter hook output priority 0; policy accept;
        udp dport 53 ip daddr != @approved_dns log prefix "dns-bypass " drop
        tcp dport 53 ip daddr != @approved_dns log prefix "dns-bypass " drop
    }
}
```

### Query investigation commands

```bash
# Extract DNS query names from PCAP
tshark -r traffic.pcap -Y dns.qry.name -T fields -e frame.time -e ip.src -e dns.qry.name

# Count most frequent queried names
tshark -r traffic.pcap -Y dns.qry.name -T fields -e dns.qry.name | sort | uniq -c | sort -nr | head

# Show long DNS labels that may suggest tunneling
tshark -r traffic.pcap -Y dns.qry.name -T fields -e dns.qry.name | awk 'length($0) > 80'
```

## 12. Firewall Logging and Scan Detection

Firewall logs are useful only if they are consistent, rate-limited, and parseable. Logging every packet without structure creates noise, not visibility.

### What to log

| Event | Why it matters |
| --- | --- |
| **Denied inbound connection attempts** | Shows scanning and blocked access attempts |
| **Denied cross-zone traffic** | Reveals policy violations or lateral movement attempts |
| **DNS bypass attempts** | Indicates evasion of resolver policy |
| **Denied management access** | Highlights unauthorized SSH, RDP, or management probes |
| **Invalid connection states** | May indicate malformed traffic or scanning |
| **Rule counters** | Confirms whether rules are being hit |

### Scan patterns

| Pattern | Likely meaning |
| --- | --- |
| One source hits many ports on one host | Vertical port scan |
| One source hits same port on many hosts | Horizontal scan |
| Many sources hit one service | Distributed scanning or worm-like activity |
| Repeated denied management attempts | Unauthorized admin access probing |
| DNS bypass logs from one host | Policy evasion or hardcoded resolver |

### Log parsing example

```bash
# Extract nftables drop logs from journal
journalctl -k --since "1 hour ago" | grep 'nft-drop-input'

# Count denied attempts by source IP when log format includes SRC=
journalctl -k --since "1 hour ago" | grep 'nft-drop-input' | awk -F'SRC=' '{print $2}' | awk '{print $1}' | sort | uniq -c | sort -nr

# Count denied destination ports when log format includes DPT=
journalctl -k --since "1 hour ago" | grep 'nft-drop-input' | awk -F'DPT=' '{print $2}' | awk '{print $1}' | sort | uniq -c | sort -nr
```

## 13. IDS, IPS, and Suricata Modes

IDS and IPS use similar detection engines but carry different operational risk. Offline analysis is ideal when the requirement is deterministic investigation of captured traffic.

### Mode comparison

| Mode | What it does | Operational risk |
| --- | --- | --- |
| **IDS passive** | Observes traffic and alerts | Misses prevention, lower availability risk |
| **IPS inline** | Can drop or reject traffic | False positives can break production traffic |
| **Offline PCAP replay** | Analyzes existing captures | No live blocking, reproducible investigation |
| **Rule test mode** | Validates rule syntax and configuration | No traffic analysis unless paired with replay |

### Why offline replay

```text
Captured traffic is fixed
     ↓
Analysis is repeatable
     ↓
Rules can be tested safely
     ↓
Alerts can be parsed into JSON
     ↓
Evidence can be packaged for analysts
```

Offline replay is not a replacement for live monitoring, but it is the right tool for post-incident analysis, rule validation, and repeatable training datasets.

## 14. Suricata Offline PCAP Replay

Suricata offline mode reads a PCAP and writes alerts and protocol metadata to logs, commonly EVE JSON.

### Replay workflow

```bash
# Create an isolated output directory for the run
mkdir -p suricata-out/run-001

# Validate configuration and rules
suricata -T -c suricata.yaml -S local.rules

# Replay a PCAP offline
suricata -c suricata.yaml -S local.rules -k none -r suspicious.pcap -l suricata-out/run-001

# Count alert events
jq -r 'select(.event_type == "alert") | .alert.signature_id' suricata-out/run-001/eve.json | wc -l

# List alert signatures
jq -r 'select(.event_type == "alert") | [.alert.severity, .alert.signature_id, .alert.signature] | @tsv' suricata-out/run-001/eve.json
```

### EVE JSON fields to preserve

| Field | Why it matters |
| --- | --- |
| **timestamp** | Timeline construction |
| **event_type** | alert, flow, dns, http, tls, fileinfo, anomaly, stats |
| **src_ip and src_port** | Source endpoint |
| **dest_ip and dest_port** | Destination endpoint |
| **proto** | Transport protocol |
| **flow_id** | Correlates events from the same network flow |
| **alert.signature** | Human-readable alert name |
| **alert.severity** | Alert triage priority |
| **app_proto** | Application protocol detected by Suricata |
| **pcap_cnt** | Packet number reference back to capture |

### Alert classification

| Severity | Interpretation |
| --- | --- |
| **1** | Highest urgency in many Suricata rule conventions |
| **2** | Important suspicious or malicious traffic |
| **3** | Lower severity policy, scan, or suspicious behavior |
| **Unknown** | Missing or custom severity requiring manual review |

## 15. Custom Suricata Rules

Custom rules should be specific enough to detect the intended behavior without matching normal traffic. Every rule needs positive and negative validation.

### Rule-writing fields

| Field | Purpose |
| --- | --- |
| **Action** | alert, pass, drop, reject, depending on mode |
| **Protocol** | tcp, udp, http, tls, dns, smb, or other supported protocol |
| **Source and destination** | Network direction and scope |
| **Message** | Analyst-readable explanation |
| **Content or keywords** | Detection logic |
| **sid** | Unique signature ID |
| **rev** | Rule revision number |
| **classtype** | Alert category |
| **metadata** | Ownership, deployment, or project context |

### Custom rule examples

```suricata
alert http any any -> any any (msg:"ORG POLICY Cleartext admin path over HTTP"; http.uri; content:"/admin"; nocase; classtype:policy-violation; sid:9000001; rev:1;)

alert dns any any -> any any (msg:"ORG DNS suspicious long query label"; dns.query; pcre:"/[A-Za-z0-9+\/]{45,}\./"; classtype:trojan-activity; sid:9000002; rev:1;)

alert tcp any any -> any 23 (msg:"ORG Telnet connection attempt"; flow:to_server; classtype:policy-violation; sid:9000003; rev:1;)
```

### Rule validation loop

```bash
# 1. Validate syntax
suricata -T -c suricata.yaml -S local.rules

# 2. Run against known-positive PCAP
suricata -c suricata.yaml -S local.rules -k none -r positive.pcap -l out-positive

# 3. Confirm expected alert fired
jq -r 'select(.event_type == "alert") | [.alert.signature_id, .alert.signature] | @tsv' out-positive/eve.json

# 4. Run against known-negative PCAP
suricata -c suricata.yaml -S local.rules -k none -r negative.pcap -l out-negative

# 5. Confirm the rule did not fire unexpectedly
jq -r 'select(.event_type == "alert") | .alert.signature_id' out-negative/eve.json | sort | uniq -c
```

### Rule quality checklist

| Question | Why it matters |
| --- | --- |
| Does the rule fire on known-positive traffic? | Proves detection works |
| Does it stay quiet on known-negative traffic? | Reduces false positives |
| Is the message analyst-readable? | Supports downstream triage |
| Is the SID unique? | Prevents collision with other rules |
| Is the rule scoped to the intended protocol? | Reduces accidental matches |

## 16. PCAP Investigation with tshark and tcpdump

PCAP analysis turns raw packets into evidence: conversations, protocols, DNS names, files, anomalies, and timelines.

### Investigation workflow

```text
Preserve original PCAP
     ↓
Generate hash
     ↓
Extract capture metadata
     ↓
Summarize conversations
     ↓
Identify protocols and top talkers
     ↓
Extract DNS, HTTP, TLS, and file indicators
     ↓
Correlate with Suricata alerts
     ↓
Export structured summary
```

### Useful commands

```bash
# Hash the capture for evidence integrity
sha256sum suspicious.pcap

# Basic capture metadata
capinfos suspicious.pcap

# Top IP conversations
tshark -r suspicious.pcap -q -z conv,ip

# Top TCP conversations
tshark -r suspicious.pcap -q -z conv,tcp

# Extract DNS queries
tshark -r suspicious.pcap -Y dns.qry.name -T fields -e frame.time -e ip.src -e dns.qry.name

# Extract HTTP hosts and URIs
tshark -r suspicious.pcap -Y http.request -T fields -e frame.time -e ip.src -e http.host -e http.request.uri

# Extract TLS server names
tshark -r suspicious.pcap -Y tls.handshake.extensions_server_name -T fields -e frame.time -e ip.src -e tls.handshake.extensions_server_name

# Quick packet-level view with tcpdump
 tcpdump -nn -r suspicious.pcap
```

### What to extract

| Evidence type | Why it matters |
| --- | --- |
| **Top talkers** | Shows systems generating most traffic |
| **Conversations** | Reveals source to destination relationships |
| **DNS queries** | Identifies domains and possible tunneling |
| **HTTP requests** | Shows cleartext paths, hosts, and user agents |
| **TLS SNI** | Reveals requested TLS hostnames when available |
| **File transfers** | Supports exfiltration or malware staging analysis |
| **Protocol anomalies** | Highlights malformed, unexpected, or policy-violating traffic |

## 17. Network Evidence Package

The evidence package is the final product. It must be boring, consistent, and easy for a downstream analyst to ingest.

### Required package contents

| Artifact | Purpose |
| --- | --- |
| **README.md** | Explains package structure, capture time range, timezone, hosts, and assumptions |
| **zone_model.json** | Zones, subnets, hosts, and allowed paths |
| **firewall_rules.nft** | nftables ruleset applied or proposed |
| **windows_firewall_rules.ps1** | Windows Firewall alignment commands or export |
| **validation_matrix.json** | Allowed and denied connection tests with outcomes |
| **firewall_log_summary.json** | Parsed deny logs, scan patterns, and counters |
| **suricata_eve.json** | Raw or preserved Suricata EVE output |
| **suricata_alert_summary.json** | Parsed alert, severity, and signature summary |
| **pcap_summary.json** | Conversation, DNS, HTTP, TLS, and file metadata |
| **custom_rules.rules** | Local Suricata rules created for the project |
| **analyst_notes.md** | Findings, unresolved questions, and recommended next steps |

### Required normalized fields

| Field | Purpose |
| --- | --- |
| **timestamp_utc** | Normalized time for correlation |
| **source** | firewall, suricata, pcap, validation, scan, dns |
| **host** | System that generated evidence |
| **src_ip and src_port** | Source endpoint |
| **dst_ip and dst_port** | Destination endpoint |
| **protocol** | Network or application protocol |
| **zone_src and zone_dst** | Source and destination zones |
| **action** | allowed, denied, alerted, observed, validated |
| **rule_id** | Firewall rule, Suricata SID, or validation test ID |
| **severity** | Triage priority where applicable |
| **evidence_pointer** | File path, packet number, flow ID, or log reference |

### Example evidence JSON

```json
{
  "timestamp_utc": "2026-08-18T15:30:00Z",
  "source": "suricata",
  "event_type": "alert",
  "src_ip": "10.20.5.44",
  "src_port": 51514,
  "dst_ip": "10.40.2.20",
  "dst_port": 23,
  "protocol": "TCP",
  "zone_src": "user",
  "zone_dst": "device",
  "action": "alerted",
  "rule_id": "9000003",
  "severity": 3,
  "evidence_pointer": "suricata/eve.json:flow_id=123456789"
}
```

## 18. Professional Judgment

Network controls must reduce risk without hiding mistakes or breaking critical operations silently.

**Block by default when** the path has no documented purpose, uses an insecure protocol, crosses zones unnecessarily, or exposes administration broadly.

**Allow by exception when** the business or technical need is clear, the source and destination are scoped, the protocol is justified, and logging or monitoring is in place.

| Field | Records |
| --- | --- |
| **Risk** | Exposure created by the allowed path or insecure protocol |
| **Reason** | Why the path must exist |
| **Scope** | Source, destination, protocol, port, and zone |
| **Compensating control** | Logging, rate limit, authentication, VPN, jump host, or isolation |
| **Owner** | Person or team accepting the path |
| **Review date** | When the exception must be revalidated |

A network exception is not a permanent hole. It is a time-limited, owned decision with evidence.

## 19. Framework and Tool Map

| Item | Purpose |
| --- | --- |
| **NIST SP 800-41 Rev. 1** | Firewall policy, architecture, testing, deployment, and management guidance |
| **nftables** | Linux packet filtering and host firewall enforcement |
| **Windows Firewall** | Windows host firewall enforcement aligned to zones |
| **Connection tracking** | Stateful firewall behavior for established and related traffic |
| **Suricata** | IDS or IPS engine and offline PCAP analysis tool |
| **EVE JSON** | Structured Suricata event output |
| **Emerging Threats Open** | Community IDS rule baseline |
| **tshark** | Scriptable packet analysis and field extraction |
| **tcpdump** | Packet capture and packet-level inspection |
| **ss** | Listening socket and connection enumeration |
| **ip** | Interface, address, and route inspection |
| **JSON** | Structured evidence format for downstream analysis |

## 20. Fast Recall

- **Flat networks expand blast radius.** Segmentation limits what a compromised host can reach.
- **Default-deny inbound is the baseline.** Allow only documented paths.
- **Every firewall rule should express intent.** Source, destination, protocol, port, and purpose.
- **Host firewalls protect inside the perimeter.** Network firewalls alone do not cover every same-segment path.
- **Stateful filtering is the normal server baseline.** Allow established and related return traffic.
- **nftables uses tables, chains, rules, sets, hooks, and policies.** Sets make rules maintainable.
- **Test both allow and deny cases.** A successful allow test is not enough.
- **Do not leave management ports open broadly.** Restrict SSH and RDP to management sources.
- **Cleartext protocols are findings.** Replace Telnet, FTP, HTTP admin, SNMPv1/v2c, and plain LDAP.
- **DNS is infrastructure and evidence.** Restrict resolvers and inspect suspicious query patterns.
- **Firewall logs need structure and rate limits.** Noise is not visibility.
- **IDS alerts detect. IPS can block.** Inline prevention has higher operational risk.
- **Suricata offline replay is deterministic.** It is ideal for PCAP investigation and rule validation.
- **EVE JSON flow_id is a key correlation field.** Preserve it.
- **Custom rules need positive and negative PCAP validation.** Fire when intended, stay quiet otherwise.
- **PCAP summaries should include conversations, DNS, HTTP, TLS, files, and anomalies.**
- **The evidence package must stand alone.** Analysts should not need to call the engineer to understand it.

## 21. Resources

**Firewalls and segmentation**
- [NIST SP 800-41 Rev. 1: Guidelines on Firewalls and Firewall Policy](https://csrc.nist.gov/pubs/sp/800/41/r1/final)
- [nftables Wiki: Main Page](https://wiki.nftables.org/wiki-nftables/index.php/Main_Page)
- [nftables Wiki: Quick reference in 10 minutes](https://wiki.nftables.org/wiki-nftables/index.php/Quick_reference-nftables_in_10_minutes)
- [Arch Wiki: nftables](https://wiki.archlinux.org/title/Nftables)

**Suricata**
- [Suricata User Guide](https://docs.suricata.io/)
- [Suricata EVE JSON Output](https://docs.suricata.io/en/latest/output/eve/)
- [Suricata EVE JSON Format](https://docs.suricata.io/en/latest/output/eve/eve-json-format.html)
- [Emerging Threats Open Ruleset](https://rules.emergingthreats.net/open/)

**Packet analysis**
- [Wireshark User Guide](https://www.wireshark.org/docs/wsug_html_chunked/)
- [tshark manual page](https://www.wireshark.org/docs/man-pages/tshark.html)
- [tcpdump manual page](https://www.tcpdump.org/manpages/tcpdump.1.html)

**Man or help**
```text
man nft
man nftables
man suricata
man suricatasc
man tshark
man tcpdump
man ss
man ip
```
