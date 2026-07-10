# Networking Foundations & Architecture

---

## 1. What is Networking?

**Networking** is connecting devices so they can communicate and share resources.

### Why it matters

- **Resource sharing** — files, printers, internet, applications
- **Communication** — email, video calls, messaging
- **Centralized management** — patch one server, all clients get the update
- **Foundation of cybersecurity** — every attack travels over a network. You can't defend what you don't understand.

### Real-world example

When you visit `youtube.com`, your laptop sends a request through:
1. Your home router → 2. Your ISP → 3. The internet backbone → 4. Google's data center

Dozens of devices, multiple protocols, and several security layers are involved in a single video starting to play.

---

## 2. LAN vs WAN

| | **LAN** (Local Area Network) | **WAN** (Wide Area Network) |
|---|------------------------------|------------------------------|
| **Size** | Single building, home, office | Cities, countries, globally |
| **Speed** | Fast (Gbps) | Slower (Mbps to Gbps) |
| **Ownership** | You own it | Telecom company owns infrastructure |
| **Examples** | Home Wi-Fi, office network | The internet, corporate site-to-site |
| **Latency** | Very low (1-5ms) | High (50-300ms) |

**MAN (Metropolitan Area Network)** sits in between — covers a city. Used by ISPs, universities.

**PAN (Personal Area Network)** is smaller — Bluetooth headphones, smartwatch syncing to phone.

---

## 3. Network Topologies

### Physical topologies

| Topology | How it works | Pros | Cons |
|----------|--------------|------|------|
| **Bus** | All devices on one cable | Cheap, simple | Single point of failure |
| **Star** | All devices connect to central hub/switch | Easy to manage, scalable | Hub failure = network down |
| **Ring** | Each device connects to two others, forming a loop | Predictable performance | Break in ring breaks network |
| **Mesh** | Every device connects to every other | Highly redundant | Expensive, complex |
| **Hybrid** | Mix of above | Flexible | Complex design |

**Most common today:** **Star topology** (with a switch at the center).

### Physical vs Logical topology

- **Physical** — how cables and devices are physically wired together
- **Logical** — how data actually flows through the network (often differs from physical)

**Example:** A network may be **physically a star** (all PCs plug into a switch) but **logically a bus** (data is broadcast to all devices in some older Ethernet hubs).

---

## 4. The OSI Model — 7 Layers

The **OSI** (Open Systems Interconnection) model is a conceptual framework for understanding how data moves through a network.

```
Layer 7 — Application       (HTTP, FTP, SSH — what users interact with)
Layer 6 — Presentation      (encryption, compression, format conversion)
Layer 5 — Session           (sessions between apps, dialog control)
Layer 4 — Transport         (TCP/UDP, ports, reliable delivery)
Layer 3 — Network           (IP addresses, routing between networks)
Layer 2 — Data Link         (MAC addresses, switching within a network)
Layer 1 — Physical          (cables, electrical signals, radio waves)
```

### Mnemonic to remember
> **"All People Seem To Need Data Processing"** (from top to bottom: Application, Presentation, Session, Transport, Network, Data Link, Physical)

### What happens at each layer

| Layer | What it does | Examples |
|-------|--------------|----------|
| **7 Application** | User-facing protocols | HTTP, FTP, SSH, DNS, SMTP |
| **6 Presentation** | Data formatting, encryption | SSL/TLS, JPEG, ASCII |
| **5 Session** | Manages connections between apps | NetBIOS, RPC |
| **4 Transport** | End-to-end delivery, segmentation | TCP, UDP |
| **3 Network** | Routing, IP addressing | IP, ICMP, OSPF, BGP |
| **2 Data Link** | MAC addressing, frames | Ethernet, Wi-Fi, ARP |
| **1 Physical** | Bits over physical medium | Cables, fiber, radio |

---

## 5. TCP/IP Model — 4 Layers

The **TCP/IP** model is what the actual internet uses. It's simpler than OSI.

```
Layer 4 — Application       (combines OSI 5, 6, 7)
Layer 3 — Transport         (TCP, UDP)
Layer 2 — Internet          (IP, ICMP)
Layer 1 — Network Access    (combines OSI 1, 2)
```

### OSI vs TCP/IP

| OSI Layer | TCP/IP Layer |
|-----------|--------------|
| 7 Application | Application |
| 6 Presentation | Application |
| 5 Session | Application |
| 4 Transport | Transport |
| 3 Network | Internet |
| 2 Data Link | Network Access |
| 1 Physical | Network Access |

**Why both models exist:** OSI is for **teaching/understanding**. TCP/IP is what **actually runs** the internet.

---

## 6. Encapsulation and Decapsulation

As data moves down the layers, each layer adds its own header. This is **encapsulation**.

### Encapsulation (sending data)

```
User types data → [Application Header]
                  ↓
[App Header][Data] → [Transport Header (port info)]
                  ↓
[TCP][App][Data] → [Network Header (IP info)]
                  ↓
[IP][TCP][App][Data] → [Data Link Header (MAC info)]
                  ↓
[MAC][IP][TCP][App][Data][CRC] → bits on the wire
```

### Decapsulation (receiving data)

Reverse the process — each layer strips its header and passes the rest up.

### Named units at each layer

| Layer | What the data is called |
|-------|-------------------------|
| 7-5 (Application) | **Data** |
| 4 (Transport) | **Segment** (TCP) / **Datagram** (UDP) |
| 3 (Network) | **Packet** |
| 2 (Data Link) | **Frame** |
| 1 (Physical) | **Bits** |

---

## 7. Network Devices

### Hub (Layer 1) — Mostly obsolete

- Repeats signals to **all ports**
- No intelligence
- Creates one big collision domain → terrible performance
- **Security nightmare** — every device sees all traffic

### Switch (Layer 2)

- Forwards traffic based on **MAC addresses**
- Each port is its own collision domain
- Builds a **MAC address table** to know which device is on which port
- Standard device in modern networks

### Router (Layer 3)

- Forwards traffic between different networks
- Uses **IP addresses** and a **routing table**
- Connects your LAN to the internet
- Can perform NAT, firewalling, DHCP

### Firewall (Layer 3-7)

- Filters traffic based on rules (IPs, ports, protocols, even content)
- Can be a separate device or built into a router
- Different types: packet filtering, stateful, next-gen (NGFW)

### Layer 2 vs Layer 3 device comparison

| | Layer 2 (Switch) | Layer 3 (Router) |
|---|------------------|------------------|
| **Identifies devices by** | MAC address | IP address |
| **Decision based on** | MAC table | Routing table |
| **Connects** | Devices in same network | Different networks |
| **Broadcast domain** | One per VLAN | One per interface |
| **Speed** | Fast (hardware-based) | Slower (CPU-based) |

---

## 8. VLANs (Virtual LANs)

A **VLAN** is a logical sub-network inside a switch, separating devices even though they're on the same physical equipment.

### Why VLANs

- **Segmentation** — separate departments (HR, IT, Finance) for security
- **Reduce broadcast domains** — less broadcast traffic
- **Flexibility** — move users to a different VLAN without re-cabling
- **Security** — VLANs can't talk to each other without routing

### 802.1Q Tagging

When a frame travels between switches, it gets a **VLAN tag** (a 4-byte header) so the receiving switch knows which VLAN it belongs to.

```
[Ethernet Header][802.1Q Tag (VLAN ID)][Payload]
```

- VLAN IDs: **1 to 4094** (VLAN 1 is default, 4095 is reserved)
- The tag adds 4 bytes to the frame

### VLAN Hopping attacks

Attackers escape one VLAN to access another. Two main methods:

| Attack | How it works |
|--------|-------------|
| **Switch Spoofing** | Attacker's machine pretends to be a switch, negotiates a trunk link |
| **Double Tagging** | Attacker adds two VLAN tags. Switch removes the outer tag, forwards with inner tag to another VLAN |

### How to prevent VLAN hopping

```bash
# On Cisco switches:
switchport mode access              # Set ports as access (not trunk)
switchport access vlan 10           # Assign to a specific VLAN
switchport nonegotiate              # Disable DTP (Dynamic Trunking Protocol)
no switchport trunk native vlan 1   # Don't use VLAN 1 as native
```

### Inter-VLAN routing

VLANs are isolated by default. To allow communication between them, you need a **router** or **Layer 3 switch**:

- **Router-on-a-stick** — single router interface with sub-interfaces for each VLAN
- **Layer 3 switch** — switch with built-in routing (faster, more common)

---

## 9. MAC Addresses

A **MAC** (Media Access Control) address is a unique hardware identifier burned into every network card.

### Format

```
00:1A:2B:3C:4D:5E
↑           ↑
└─ 24 bits ─┘└─── 24 bits ───┘
   OUI         NIC-specific
```

- **48 bits total** (6 bytes, written as 12 hex chars)
- **OUI (Organizationally Unique Identifier)** — first 24 bits, identifies the manufacturer
- **NIC-specific** — last 24 bits, unique per device from that manufacturer

### Lookup commands

```bash
# Show your MAC addresses
ip link
ifconfig

# Find vendor from MAC (first 3 octets)
# Use https://standards-oui.ieee.org/ or:
sudo apt install ieee-data
grep -i "001a2b" /var/lib/ieee-data/oui.txt
```

### Special MAC addresses

| Type | Example | Meaning |
|------|---------|---------|
| **Unicast** | First octet's LSB is `0` (e.g., `00:1A:2B:...`) | One destination |
| **Multicast** | First octet's LSB is `1` (e.g., `01:00:5E:...`) | Group of receivers |
| **Broadcast** | `FF:FF:FF:FF:FF:FF` | All devices on the network |
| **Locally administered** | Second-LSB is `1` (e.g., `02:00:00:...`) | Manually assigned (VMs, etc.) |

---

## 10. IPv4 Addresses

An **IPv4 address** is a 32-bit number that uniquely identifies a device on a network.

### Format

```
192.168.1.100
↑   ↑   ↑ ↑
└─8─┘└─8─┘└─8─┘└─8─┘ bits = 32 bits total
```

Written as 4 **octets** (0-255), separated by dots.

### Address classes (historical, mostly replaced by CIDR)

| Class | First octet range | Default mask | Use |
|-------|------------------|--------------|-----|
| **A** | 1-126 | /8 (255.0.0.0) | Huge networks (16M hosts) |
| **B** | 128-191 | /16 (255.255.0.0) | Medium networks (65K hosts) |
| **C** | 192-223 | /24 (255.255.255.0) | Small networks (254 hosts) |
| **D** | 224-239 | — | Multicast |
| **E** | 240-255 | — | Experimental/reserved |

**127.x.x.x** is reserved for **loopback** (your own machine).

### Private IP ranges (RFC 1918)

Not routable on the public internet — used inside private networks:

| Class | Range | Common use |
|-------|-------|-----------|
| **A** | `10.0.0.0/8` | Large enterprises |
| **B** | `172.16.0.0/12` | Medium organizations |
| **C** | `192.168.0.0/16` | Home routers, small offices |

### Special IPv4 addresses

| Address | Purpose |
|---------|---------|
| `127.0.0.1` | Loopback — "this machine" |
| `0.0.0.0` | All interfaces / unknown |
| `255.255.255.255` | Limited broadcast (this network only) |
| `169.254.x.x` | APIPA — auto-assigned when DHCP fails |
| `224.0.0.0 - 239.255.255.255` | Multicast |

---

## 11. CIDR and Subnetting

**CIDR** (Classless Inter-Domain Routing) replaced the rigid class system. It uses a **prefix length** instead.

### CIDR notation

```
192.168.1.0/24
              ↑
              prefix = number of network bits
```

- `/24` = first 24 bits are the network, last 8 bits are hosts
- Equivalent to subnet mask `255.255.255.0`

### How to calculate subnet info

| /prefix | Subnet mask | Hosts | Use |
|---------|------------|-------|-----|
| /8 | 255.0.0.0 | 16,777,214 | Huge |
| /16 | 255.255.0.0 | 65,534 | Large |
| /24 | 255.255.255.0 | 254 | Small office |
| /25 | 255.255.255.128 | 126 | Half of a /24 |
| /26 | 255.255.255.192 | 62 | Quarter of a /24 |
| /27 | 255.255.255.224 | 30 | Department subnet |
| /28 | 255.255.255.240 | 14 | Small group |
| /30 | 255.255.255.252 | 2 | Point-to-point links |
| /32 | 255.255.255.255 | 1 | Single host |

### Math behind subnetting

**Formula:** Hosts per subnet = `2^(host_bits) - 2`

- Subtract 2 because: 1 address is the **network address**, 1 is the **broadcast address**

**Example:**
- `/24` has 8 host bits → 2^8 - 2 = **254 usable hosts**
- `/26` has 6 host bits → 2^6 - 2 = **62 usable hosts**

### Subnetting example

Given `192.168.10.0/24`, split into 4 equal subnets:

```
192.168.10.0/26    → hosts 192.168.10.1 - 192.168.10.62
192.168.10.64/26   → hosts 192.168.10.65 - 192.168.10.126
192.168.10.128/26  → hosts 192.168.10.129 - 192.168.10.190
192.168.10.192/26  → hosts 192.168.10.193 - 192.168.10.254
```

Each subnet has 62 usable hosts.

### Useful CLI tool

```bash
sudo apt install ipcalc

ipcalc 192.168.1.0/24
# Shows network, broadcast, host range, mask in binary
```

---

## 12. ARP — Address Resolution Protocol

**ARP** translates **IP addresses** to **MAC addresses** within a local network.

### How ARP works

```
1. Computer A wants to talk to 192.168.1.5
2. A doesn't know B's MAC, so it broadcasts:
   "Who has 192.168.1.5? Tell 192.168.1.1"
3. B replies (only to A): "192.168.1.5 is at AA:BB:CC:DD:EE:FF"
4. A caches the mapping and sends the data
```

### View the ARP cache

```bash
arp -a              # show ARP cache
ip neigh            # modern equivalent
```

### Security concerns — ARP Spoofing / Poisoning

Attacker sends fake ARP replies to associate **their MAC** with **someone else's IP** (often the gateway). Used in **Man-in-the-Middle attacks**.

```bash
# Tools (Kali) for ARP spoofing:
sudo arpspoof -i eth0 -t 192.168.1.5 192.168.1.1
sudo ettercap -T -M arp:remote /// ///
```

### Defenses

- **Static ARP entries** for critical devices: `arp -s 192.168.1.1 aa:bb:cc:dd:ee:ff`
- **Dynamic ARP Inspection (DAI)** on switches (validates ARP replies against DHCP)
- **Network segmentation** — limits attack scope

---

## 13. IPv6

IPv4 has ~4.3 billion addresses — not enough for modern devices. **IPv6** has 128 bits = 340 undecillion addresses.

### Format

```
2001:0db8:85a3:0000:0000:8a2e:0370:7334
↑                                       ↑
└── 8 groups of 4 hex digits ──────────┘
```

### Shortening rules

```
2001:0db8:0000:0000:0000:0000:0000:7334
       ↓
2001:db8:0:0:0:0:0:7334        # remove leading zeros
       ↓
2001:db8::7334                  # replace consecutive zeros with :: (once per address)
```

### Key differences from IPv4

| | IPv4 | IPv6 |
|---|------|------|
| **Address size** | 32 bits | 128 bits |
| **Notation** | Decimal dots | Hexadecimal colons |
| **Total addresses** | 4.3 billion | 340 undecillion |
| **Broadcast** | Yes | No (uses multicast) |
| **NAT typically needed?** | Yes | No (plenty of addresses) |
| **Auto-configuration** | Need DHCP | Built-in (SLAAC) |
| **Header** | Variable | Fixed (faster routing) |

### IPv6 address types

- **Global Unicast** (`2000::/3`) — public, routable
- **Link-Local** (`fe80::/10`) — local segment only
- **Loopback** — `::1` (equivalent to 127.0.0.1)
- **Unspecified** — `::` (equivalent to 0.0.0.0)

---

## 14. Ports

Ports are 16-bit numbers (0-65535) that identify a specific service on a device.

### Port ranges

| Range | Name | Use |
|-------|------|-----|
| **0 - 1023** | Well-known ports | Standard services (need root to bind) |
| **1024 - 49151** | Registered ports | Vendor-specific services |
| **49152 - 65535** | Dynamic / Ephemeral | Temporary client ports |

### Critical well-known ports

| Port | Protocol | Service |
|------|----------|---------|
| **20, 21** | TCP | FTP (data, control) |
| **22** | TCP | SSH |
| **23** | TCP | Telnet (insecure!) |
| **25** | TCP | SMTP (email) |
| **53** | TCP/UDP | DNS |
| **67, 68** | UDP | DHCP (server, client) |
| **80** | TCP | HTTP |
| **110** | TCP | POP3 (email retrieval) |
| **123** | UDP | NTP (time sync) |
| **143** | TCP | IMAP (email) |
| **161, 162** | UDP | SNMP (management) |
| **389** | TCP | LDAP |
| **443** | TCP | HTTPS |
| **445** | TCP | SMB (Windows file sharing) |
| **636** | TCP | LDAPS (secure LDAP) |
| **3306** | TCP | MySQL |
| **3389** | TCP | RDP (Windows remote desktop) |
| **5432** | TCP | PostgreSQL |

---

## 15. Main Protocols

### HTTP / HTTPS — Web

| | HTTP | HTTPS |
|---|------|-------|
| **Port** | 80 | 443 |
| **Encryption** | None | TLS/SSL |
| **Use** | Web browsing (deprecated for production) | Secure web browsing |

### FTP / SFTP — File Transfer

- **FTP** (port 21) — old, plaintext credentials. Insecure.
- **SFTP** (port 22) — runs over SSH, encrypted. Use this.
- **FTPS** (port 990) — FTP wrapped in TLS. Less common.

### SSH — Secure Shell

- Port 22, encrypted remote terminal access
- Replaces telnet, rlogin, rsh
- Used for admin tasks, secure tunneling, port forwarding

### DNS — Domain Name System

- Port 53, translates names (`google.com`) to IPs (`142.250.184.46`)
- More on this in section 18

### DHCP — Dynamic Host Configuration Protocol

- Ports 67 (server), 68 (client), automatically assigns IPs
- More on this in section 17

### TCP vs UDP

| | **TCP** | **UDP** |
|---|---------|---------|
| **Connection** | Connection-oriented (3-way handshake) | Connectionless |
| **Reliability** | Reliable (acknowledgments, retransmits) | Unreliable (no acknowledgments) |
| **Order** | Guaranteed | Not guaranteed |
| **Speed** | Slower (more overhead) | Faster |
| **Use cases** | Web, email, file transfer | Video streaming, gaming, DNS, VoIP |
| **Header size** | 20 bytes | 8 bytes |

### TCP 3-way handshake

```
Client                    Server
   ──── SYN ─────────────→ 
   ←─── SYN-ACK ─────────  
   ──── ACK ─────────────→ 
   [connection established]
```

---

## 16. Transmission Media

### Wired

| Media | Speed | Distance | Use |
|-------|-------|----------|-----|
| **Cat5e** | 1 Gbps | 100m | Home/office Ethernet |
| **Cat6** | 10 Gbps (55m) | 100m | Modern offices |
| **Cat6a / Cat7** | 10 Gbps | 100m | High-density data centers |
| **Fiber (single-mode)** | 10-400 Gbps | 100+ km | ISPs, backbones |
| **Fiber (multi-mode)** | 1-100 Gbps | 2 km | Within data centers |
| **Coaxial** | varies | varies | Cable TV/internet |

### Wireless

| Tech | Range | Use |
|------|-------|-----|
| **Wi-Fi** | 30-100m | Local networks |
| **Bluetooth** | 10-100m | Peripherals |
| **Cellular (4G/5G)** | km | Mobile |
| **Satellite** | global | Remote areas |
| **Microwave** | km | Point-to-point links |

---

## 17. DHCP — Dynamic Host Configuration Protocol

**DHCP** automatically gives devices an IP address, gateway, DNS, etc. when they join a network.

### The DORA process

```
1. DISCOVER  → Client broadcasts "I need an IP!" (UDP 67)
2. OFFER     → DHCP server replies with an IP offer
3. REQUEST   → Client says "I'll take that IP"
4. ACK       → Server confirms, IP is now assigned
```

### DHCP lease

- IPs aren't permanent — they're "leased" for a duration (typically 24h to 7 days)
- At **50%** of lease, client tries to **renew** with same server (REQUEST → ACK)
- At **87.5%**, client **rebinds** by broadcasting to any DHCP server
- If lease expires without renewal, the IP returns to the pool

### Manual commands

```bash
# Linux — release and renew DHCP lease
sudo dhclient -r              # release
sudo dhclient                 # request new

# Show current lease
cat /var/lib/dhcp/dhclient.leases
```

### DHCP attacks

| Attack | How it works | Impact |
|--------|-------------|--------|
| **Rogue DHCP Server** | Attacker runs a DHCP server, hands out malicious gateway/DNS | MitM, traffic redirection |
| **DHCP Starvation** | Attacker requests IPs with fake MACs until pool is exhausted | DoS — legitimate clients can't get IPs |

### DHCP Snooping (defense)

A switch feature that:
- Marks ports as **trusted** (where legitimate DHCP servers connect) or **untrusted**
- **Drops DHCP responses** from untrusted ports
- Builds a binding table for inspection

```bash
# Cisco config example
ip dhcp snooping
ip dhcp snooping vlan 10
interface GigabitEthernet0/1
 ip dhcp snooping trust    # only trust this port (DHCP server)
```

---

## 18. NAT — Network Address Translation

**NAT** lets multiple devices share one public IP — essential because IPv4 ran out.

### Why NAT

- Conserves IPv4 addresses
- Hides internal network structure
- Adds a layer of security (incoming connections must be initiated from inside)

### Types of NAT

| Type | Description | Use |
|------|-------------|-----|
| **Static NAT** | One private IP ↔ one public IP (fixed) | Servers that need to be reachable |
| **Dynamic NAT** | Pool of public IPs, mapped as needed | Less common |
| **PAT (Port Address Translation) / NAPT** | Many private IPs share **one** public IP via ports | Most common (home routers) |

### How PAT works

```
Internal:                      External (Internet):
192.168.1.5:54321  ────────→  203.0.113.1:54321 ────→ google.com:443
192.168.1.6:55555  ────────→  203.0.113.1:55555 ────→ google.com:443
```

The router tracks: `external_port → internal_IP:internal_port` in a NAT table.

### Port Forwarding

Allows incoming connections to reach a specific internal device. Used for:
- Hosting a game server at home
- Remote access to a NAS
- Self-hosted websites

```
Internet → router_public_ip:8080  →  192.168.1.50:80  (your web server)
```

### NAT Traversal (for P2P apps)

NAT makes peer-to-peer connections hard. Tools to work around it:

| Tool | What it does |
|------|--------------|
| **STUN** | Tells a client its public IP and port |
| **TURN** | Relays traffic through a server when STUN fails |
| **ICE** | Combines STUN + TURN, picks best path |

Used by: Skype, WebRTC, video calls, online gaming.

### CGNAT — Carrier-Grade NAT

ISPs run NAT for their entire customer base — your "public" IP is actually shared with other customers. Makes hosting servers from home harder.

---

## 19. DNS — Domain Name System

**DNS** translates domain names (`example.com`) into IP addresses (`93.184.216.34`).

### DNS hierarchy

```
                .  (Root)
                ↓
        .com  .org  .net  .uk  (TLDs - Top Level Domains)
                ↓
            example.com         (Authoritative servers)
                ↓
    www  mail  ftp  api          (Subdomains / records)
```

### DNS resolution process

```
1. Browser asks OS:        "What's the IP of example.com?"
2. OS checks local cache.   If found, use it. Done.
3. Asks recursive resolver  (usually ISP's DNS or 8.8.8.8)
4. Resolver checks cache.   If found, return. Done.
5. Resolver asks ROOT.      "Who handles .com?"
6. Root replies:            "Ask the .com TLD servers"
7. Resolver asks TLD.       "Who handles example.com?"
8. TLD replies:             "Ask example.com's authoritative server"
9. Authoritative server:    "example.com is at 93.184.216.34"
10. Resolver caches it,     returns to your OS/browser
```

### Main DNS record types

| Record | Purpose | Example |
|--------|---------|---------|
| **A** | Hostname → IPv4 | `example.com → 93.184.216.34` |
| **AAAA** | Hostname → IPv6 | `example.com → 2606:2800:220:1::` |
| **CNAME** | Alias for another name | `www.example.com → example.com` |
| **MX** | Mail server | `example.com → mail.example.com (priority 10)` |
| **NS** | Authoritative name server | `example.com → ns1.example.com` |
| **TXT** | Arbitrary text (SPF, DKIM, verification) | `"v=spf1 include:_spf.google.com -all"` |
| **PTR** | Reverse DNS (IP → name) | `34.216.184.93.in-addr.arpa → example.com` |
| **SOA** | Start of Authority (zone info) | Admin email, refresh timers |
| **SRV** | Service location | `_sip._tcp.example.com → sipserver.example.com:5060` |

### DNS commands

```bash
dig example.com                  # full DNS info
dig example.com A                # only A records
dig example.com MX               # mail records
dig @8.8.8.8 example.com         # use specific resolver
nslookup example.com             # alternative
host example.com                 # simple lookup

# Reverse DNS
dig -x 93.184.216.34
```

### DNS security threats

| Attack | Description |
|--------|-------------|
| **DNS Spoofing / Cache Poisoning** | Inject fake DNS records into a resolver's cache → users get sent to malicious sites |
| **DNS Hijacking** | Attacker takes over the domain's DNS records (compromise registrar account) |
| **DNS Tunneling** | Smuggling data (or malware C2) over DNS queries to bypass firewalls |
| **NXDOMAIN flooding** | DoS by querying random non-existent subdomains |
| **DNS Amplification** | Send small DNS queries with spoofed source → big responses flood victim (DDoS) |

### DNS security solutions

| Tech | Purpose |
|------|---------|
| **DNSSEC** | Signs DNS records cryptographically — prevents spoofing |
| **DoH (DNS over HTTPS)** | Encrypts DNS queries (port 443) — hides them from ISPs/network operators |
| **DoT (DNS over TLS)** | Encrypts DNS queries (port 853) — same goal as DoH |

---

## 20. Authentication & Directory Services

### RADIUS (Remote Authentication Dial-In User Service)

- **UDP** ports 1812 (auth), 1813 (accounting)
- Centralized authentication for network devices (routers, switches, VPN, Wi-Fi)
- Used in **802.1X** port-based authentication
- Encrypts only the password field

### TACACS+ (Terminal Access Controller Access-Control System Plus)

- **TCP** port 49
- Cisco proprietary, but widely supported
- Separates AAA into 3 distinct processes (more granular than RADIUS)
- Encrypts the **entire payload** (more secure than RADIUS)

### RADIUS vs TACACS+

| | **RADIUS** | **TACACS+** |
|---|------------|-------------|
| **Transport** | UDP | TCP |
| **Encryption** | Password only | Entire payload |
| **Use case** | Network access (Wi-Fi, VPN, 802.1X) | Device admin (router/switch login) |
| **Standard** | Open standard (RFC) | Cisco proprietary |

### Kerberos

Network authentication using **tickets** instead of passwords. Used by Active Directory.

- **Port 88** (TCP/UDP)
- 3 components: **KDC** (Key Distribution Center), **client**, **service**
- Uses timestamps → clocks must be synced (within ~5 min)

**Common attacks:**

| Attack | What it does |
|--------|-------------|
| **Pass-the-Ticket** | Steal a Kerberos ticket from memory, replay it |
| **Golden Ticket** | Forge a TGT (Ticket Granting Ticket) with stolen KRBTGT hash → access anything |
| **Silver Ticket** | Forge a service ticket → access one specific service |
| **Kerberoasting** | Request service tickets, crack them offline to get service account passwords |

### LDAP (Lightweight Directory Access Protocol)

- **Port 389** (or 636 for LDAPS/secure)
- Used to query directory services (Active Directory, OpenLDAP)
- Stores users, groups, devices in a hierarchical tree

```bash
# Query LDAP
ldapsearch -x -H ldap://dc.example.com -b "dc=example,dc=com" "(uid=alice)"
```

---

## 21. NTP and Syslog

### NTP (Network Time Protocol)

- **UDP port 123**
- Synchronizes clocks across devices
- **Critical for security** — Kerberos needs synced clocks, log timestamps need to be accurate for forensics

```bash
sudo systemctl status systemd-timesyncd
timedatectl status
```

### Syslog

Standardized way for devices and apps to log events to a central server.

- **UDP port 514** (or TCP 6514 for syslog-TLS)
- **Severity levels:**

| Level | Name | Description |
|-------|------|-------------|
| 0 | Emergency | System unusable |
| 1 | Alert | Immediate action needed |
| 2 | Critical | Critical conditions |
| 3 | Error | Error conditions |
| 4 | Warning | Warning conditions |
| 5 | Notice | Normal but significant |
| 6 | Informational | Informational messages |
| 7 | Debug | Debug-level messages |

**Mnemonic:** "Every Awesome Coder Eats Waffles Now Indulging Daily"

---

## 22. Internet Routing — AS, BGP, Peering

### Autonomous System (AS)

An **AS** is a network under a single organization's control (ISP, large company, university). Identified by an **ASN** (Autonomous System Number).

- ASNs: 1 - 4,294,967,295 (32-bit)
- Examples: Google (AS15169), Cloudflare (AS13335), AT&T (AS7018)

### BGP (Border Gateway Protocol)

How ASes tell each other "I can reach these networks" — the **routing protocol of the internet**.

- **TCP port 179**
- Used between ISPs to exchange routes
- Decisions based on policy (cheapest, fastest, preferred peering)

### BGP attacks

| Attack | How it works |
|--------|-------------|
| **BGP Hijacking** | An AS advertises routes it doesn't own → traffic redirected to attacker |
| **Route Leaks** | Misconfiguration accidentally advertises customer routes upstream |

Real example: In 2008, Pakistan accidentally hijacked YouTube's routes globally for 2 hours by trying to block YouTube domestically.

### Peering vs Transit

| | **Peering** | **Transit** |
|---|------------|-------------|
| **Cost** | Free / settlement-free | Paid |
| **Routes shared** | Only their own + customers | Full internet routing |
| **Used between** | Networks with mutual benefit (e.g., two ISPs) | ISP → larger ISP / Tier 1 |

### IXP (Internet Exchange Point)

Physical locations where many ISPs meet to peer with each other. Reduces costs and latency.

Major IXPs: **AMS-IX** (Amsterdam), **DE-CIX** (Frankfurt), **LINX** (London).

### CDN and Anycast

**CDN (Content Delivery Network)** caches content close to users (CloudFlare, Akamai, AWS CloudFront).

**Anycast** — same IP advertised from multiple locations. The internet routes you to the nearest one. Used by:
- Public DNS (`8.8.8.8`, `1.1.1.1`)
- CDN edge servers
- DDoS protection services

---

## 23. Wi-Fi

### Frequency bands

| Band | Range | Speed | Notes |
|------|-------|-------|-------|
| **2.4 GHz** | Longer range, walls OK | Slower | Crowded (microwaves, Bluetooth) |
| **5 GHz** | Shorter range | Faster | Less interference |
| **6 GHz** | Shortest range | Fastest | New (Wi-Fi 6E) |

### Wi-Fi standards (802.11)

| Standard | Year | Speed | Frequency |
|----------|------|-------|-----------|
| 802.11a | 1999 | 54 Mbps | 5 GHz |
| 802.11b | 1999 | 11 Mbps | 2.4 GHz |
| 802.11g | 2003 | 54 Mbps | 2.4 GHz |
| 802.11n (Wi-Fi 4) | 2009 | 600 Mbps | 2.4/5 GHz |
| 802.11ac (Wi-Fi 5) | 2014 | 6.9 Gbps | 5 GHz |
| 802.11ax (Wi-Fi 6) | 2019 | 9.6 Gbps | 2.4/5 GHz |
| 802.11ax (Wi-Fi 6E) | 2020 | 9.6 Gbps | + 6 GHz |
| 802.11be (Wi-Fi 7) | 2024 | 46 Gbps | 2.4/5/6 GHz |

### Wi-Fi security protocols

| | **WEP** | **WPA** | **WPA2** | **WPA3** |
|---|---------|---------|----------|----------|
| **Year** | 1999 | 2003 | 2004 | 2018 |
| **Encryption** | RC4 (broken) | TKIP | AES-CCMP | AES-GCMP |
| **Status** | ❌ Cracked in minutes | ⚠️ Deprecated | ✅ Still common | ✅ Current standard |
| **Brute-force resistance** | Poor | Poor | Moderate | Strong (SAE handshake) |

### Common Wi-Fi attacks

| Attack | Description |
|--------|-------------|
| **Evil Twin** | Fake AP with same SSID as legitimate one → MitM victims |
| **Deauthentication** | Send deauth frames to kick clients off → force reconnect (for capturing handshakes) |
| **KRACK (Key Reinstallation Attack)** | WPA2 vulnerability that allowed handshake replay |
| **WPS PIN attack** | Brute-force the 8-digit WPS PIN |
| **Rogue AP** | Unauthorized AP connected to corporate network |

### Wireless security best practices

- Use **WPA3** if supported, otherwise **WPA2** with a strong passphrase
- **Disable WPS** (vulnerable to brute force)
- Use **enterprise authentication (802.1X)** for business
- Change default admin passwords
- **Hide SSID is NOT real security** (attackers can still find it)
- **MAC filtering is NOT real security** (easily spoofed)
- Use a **separate VLAN/SSID** for guests

### PSK vs Enterprise

| | **PSK (Pre-Shared Key)** | **Enterprise (802.1X)** |
|---|--------------------------|-------------------------|
| **Authentication** | Shared password | Per-user credentials |
| **Use** | Home, small office | Corporate |
| **Backend** | None needed | RADIUS server |
| **If one user leaves** | Whole password changes | Just disable that user |

---

## 24. Core Security Concepts

### The CIA Triad

The three pillars of information security:

| Pillar | Meaning | How to protect |
|--------|---------|---------------|
| **Confidentiality** | Data is only seen by authorized people | Encryption, access controls |
| **Integrity** | Data is accurate, not modified | Hashing, digital signatures |
| **Availability** | Data and services are accessible when needed | Redundancy, DDoS protection |

Sometimes extended to **CIANA** (+ Non-repudiation + Authentication) or **DAD** (Disclosure, Alteration, Destruction — the negative side).

### Defense in Depth

Multiple layers of security so that if one fails, others still protect.

```
Outer    →   Perimeter firewall
                Inner firewalls + WAF
                    Network segmentation
                        Endpoint protection
                            User access control
Innermost →             Data encryption + backups
```

### Key principles

| Principle | Meaning |
|-----------|---------|
| **Least Privilege** | Give users/processes only the permissions they need, nothing more |
| **Zero Trust** | Never trust — always verify, even for internal traffic |
| **Need to Know** | Information shared only with those who need it |
| **Separation of Duties** | No single person can complete a critical action alone |
| **Fail Secure** | When something fails, default to secure (deny access) |

### AAA — Authentication, Authorization, Accounting

| | What it answers |
|---|-----------------|
| **Authentication** | Who are you? (verify identity) |
| **Authorization** | What can you do? (check permissions) |
| **Accounting** | What did you do? (log activity) |

---

## 25. Attack Categories

### Reconnaissance

Gathering info before attacking:
- **Passive** — public info, social media, WHOIS, DNS records (no contact)
- **Active** — port scans, banner grabbing, ping sweeps (sends traffic)

### Interception (Man-in-the-Middle)

Sit between sender and receiver to eavesdrop or modify traffic.

**MitM techniques:**
- ARP spoofing (LAN)
- DNS hijacking
- Rogue Wi-Fi AP (Evil Twin)
- SSL stripping (downgrading HTTPS to HTTP)
- BGP hijacking (internet-scale)

### Denial of Service (DoS/DDoS)

Make a service unavailable.

| Type | How it works | Example |
|------|-------------|---------|
| **Volumetric** | Flood with massive traffic | UDP flood, DNS amplification |
| **Protocol** | Exploit protocol weaknesses | SYN flood, Ping of Death |
| **Application** | Overwhelm app logic | Slowloris, HTTP flood |

**DDoS** = Distributed DoS, using a botnet of thousands of devices.

### Password attacks

| Attack | Description |
|--------|-------------|
| **Brute-force** | Try every possible password |
| **Dictionary** | Try common words from a wordlist |
| **Credential stuffing** | Use leaked credentials from other breaches |
| **Password spraying** | Try a few common passwords across many accounts |
| **Rainbow tables** | Precomputed hash → password lookup |
| **Pass-the-Hash** | Use a stolen password hash directly (Windows) |
| **Keylogging** | Capture keystrokes |
| **Phishing** | Trick users into revealing credentials |

---

## 26. Firewalls

### Types of firewalls

| Type | How it works | Pros | Cons |
|------|-------------|------|------|
| **Packet Filtering** | Inspects each packet header (IP, port, protocol) | Fast, simple | Stateless — can't track sessions |
| **Stateful** | Tracks connection state (established, related, new) | More accurate | Higher resource use |
| **Application-layer (Proxy)** | Inspects application-layer data | Deep visibility | Slow, app-specific |
| **NGFW (Next-Gen Firewall)** | Stateful + app awareness + IDS/IPS + threat intel | Comprehensive | Expensive, complex |
| **WAF (Web Application Firewall)** | Specifically protects web apps (SQL injection, XSS) | Web-focused | Only protects web layer |

### Firewall rules

A rule typically has:
- **Action** — Allow / Deny / Log
- **Source** — IP, port, or interface
- **Destination** — IP, port
- **Protocol** — TCP / UDP / ICMP / Any
- **State** — New / Established / Related (for stateful firewalls)

Example with iptables:

```bash
# Allow established connections back in
sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow SSH from local network
sudo iptables -A INPUT -p tcp -s 192.168.1.0/24 --dport 22 -j ACCEPT

# Allow HTTPS from anywhere
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Drop everything else
sudo iptables -P INPUT DROP
```

### Rule order matters

Most firewalls process rules **top-down, first match wins**. A "deny all" rule should be **last**.

### DMZ (Demilitarized Zone)

A **DMZ** is a network segment between the internet and the internal network, hosting public-facing services (web, mail, DNS).

```
Internet ── Firewall ── DMZ (Web, Mail, DNS) ── Firewall ── Internal LAN
```

If the DMZ server is compromised, attackers still can't easily reach the internal network.

---

## 27. IDS vs IPS

| | **IDS** (Intrusion Detection System) | **IPS** (Intrusion Prevention System) |
|---|---------------------------------------|---------------------------------------|
| **Action** | Detects and alerts | Detects and blocks |
| **Placement** | Out-of-band (taps a copy of traffic) | In-line (sits in the traffic path) |
| **Impact if it fails** | Just stops detecting | Can block all traffic (single point of failure) |
| **False positives** | Annoying | Disruptive (blocks legitimate traffic) |
| **Tools** | Snort, Suricata (in IDS mode), Zeek | Snort, Suricata (in IPS mode), Cisco IPS |

### Detection methods

| Method | How it works | Strength | Weakness |
|--------|-------------|----------|----------|
| **Signature-based** | Matches known attack patterns | Reliable for known threats | Misses zero-days |
| **Anomaly-based** | Baselines normal traffic, flags deviations | Catches novel attacks | High false positives |
| **Heuristic / Behavioral** | Uses rules about suspicious behavior | Balance of above | Tuning required |

---

## 28. Network Segmentation

Dividing a network into separate zones to limit attack spread.

### Why segment

- **Limit blast radius** — breach in one segment doesn't compromise the rest
- **Compliance** — PCI-DSS, HIPAA often require segmentation
- **Performance** — smaller broadcast domains
- **Access control** — different rules per segment

### Common segmentation patterns

```
Corporate LAN (users)  ───   Internet
       │
       ├── Servers VLAN
       ├── Guest Wi-Fi VLAN  →  DMZ
       ├── IoT VLAN          →  No internet
       ├── DMZ              →  Public services
       └── Management VLAN   →  Admin only
```

### Zero Trust

Modern security architecture: **"Never trust, always verify."**

- Don't trust devices just because they're on the internal network
- Every connection requires authentication
- Continuously verify (not just at login)
- Tools: SDP (Software-Defined Perimeter), microsegmentation, Identity-Aware Proxies

---

## 29. SIEM and NAC

### SIEM (Security Information and Event Management)

Aggregates logs from across your infrastructure for analysis and alerting.

**What to monitor:**
- Firewall logs (allowed/denied connections)
- Authentication events (logins, failures, sudo)
- DNS queries (data exfiltration, C2 detection)
- Endpoint logs (process execution, file changes)
- Network flow data (NetFlow, sFlow)
- IDS/IPS alerts

**Popular SIEMs:** Splunk, QRadar, Elastic SIEM, Microsoft Sentinel, Wazuh (open source).

### NAC (Network Access Control)

Decides if a device is allowed on the network and on which segment.

**Common NAC checks:**
- Is this device known? (MAC address known?)
- Is it authenticated? (802.1X passed?)
- Is it healthy? (antivirus updated, patches applied)
- Is it managed? (corporate-owned vs personal)

Based on the answers, NAC may:
- Grant full access
- Place in quarantine/remediation VLAN
- Deny entirely

---

## 30. 802.1X and EAP

**802.1X** is port-based network authentication — devices must authenticate before getting access to a network port (wired or Wi-Fi).

### Components

```
Supplicant  ─────  Authenticator  ─────  Authentication Server
(client)          (switch / AP)         (RADIUS server)
```

1. Supplicant requests access
2. Authenticator forwards the request to RADIUS
3. RADIUS authenticates (uses EAP)
4. Authenticator grants or denies port access

### EAP (Extensible Authentication Protocol) methods

| Method | How it authenticates | Security | Use |
|--------|---------------------|----------|-----|
| **EAP-MD5** | Username + password (MD5 hash) | Weak — no server validation | ❌ Avoid |
| **EAP-TLS** | Certificate-based (client + server certs) | Very strong | Enterprise |
| **EAP-TTLS** | Server cert + any inner method (password) | Strong | Common |
| **PEAP** | Server cert + MSCHAPv2 inner | Strong | Microsoft environments |
| **EAP-FAST** | Cisco's lightweight alternative | Moderate | Cisco environments |

---

## 31. Port Scanning and Network Enumeration

### Types of port scans

| Scan type | nmap flag | How it works | Stealthy? |
|-----------|-----------|--------------|-----------|
| **TCP Connect** | `-sT` | Full 3-way handshake | Loud (logged everywhere) |
| **SYN (half-open)** | `-sS` | Sends SYN, waits for SYN-ACK, never completes | Needs root, somewhat stealthy |
| **UDP** | `-sU` | Sends UDP packets | Slow (UDP is connectionless) |
| **FIN** | `-sF` | Sends FIN packet | Bypasses basic firewalls |
| **NULL** | `-sN` | Sends packet with no flags | Bypasses basic firewalls |
| **XMAS** | `-sX` | FIN + PSH + URG flags set | Bypasses basic firewalls |
| **ACK** | `-sA` | Maps firewall rules | Doesn't find open ports |
| **Ping sweep** | `-sn` | Just finds live hosts | Fast |

### Port states reported by nmap

| State | Meaning |
|-------|---------|
| **Open** | Service is actively listening |
| **Closed** | No service listening (but host is up) |
| **Filtered** | Firewall is blocking — can't determine open/closed |
| **Unfiltered** | Port is reachable, state unknown (ACK scan) |
| **Open\|Filtered** | Either open or filtered (UDP scans often return this) |

### Network enumeration protocols

| Protocol | Port | What attackers can extract |
|----------|------|---------------------------|
| **SNMP** | UDP 161 | System info, network config, running services (if community string is `public`) |
| **NetBIOS** | UDP 137-139 | Windows hostnames, share names, users |
| **SMB** | TCP 445 | Shares, users, OS version, sometimes anonymous read access |
| **LDAP** | TCP 389 | Users, groups, computers in AD (if anonymous bind allowed) |
| **DNS** | TCP 53 | Zone transfers (AXFR) reveal all records |
| **NTP** | UDP 123 | Peer list (monlist command) |
| **rpcbind** | TCP 111 | RPC services running |

### Defending against reconnaissance

| Defense | What it does |
|---------|-------------|
| **Firewall** | Block unsolicited inbound, drop ICMP from internet |
| **IDS/IPS** | Detect/block scan patterns (many ports in short time) |
| **Network segmentation** | Limit what attackers can see if they get inside |
| **Disable unused services** | Reduces attack surface |
| **Banner suppression** | Don't reveal version info in service banners |
| **Honeypots** | Fake services to detect scans early |
| **Rate limiting** | Slow down rapid connection attempts |
| **Disable SMB null sessions** | Block anonymous SMB enumeration |
| **Disable LDAP anonymous bind** | Require authentication for queries |
| **Strong SNMP community strings** | Or disable SNMP entirely |

---

## 32. Essential CLI Reference

### Network info

```bash
ip a                    # all interfaces and IPs
ip link                 # interfaces only
ip route                # routing table
ip neigh                # ARP table (neighbors)
hostname -I             # all your IPs

ifconfig                # older, still common
route -n                # older routing table
arp -a                  # older ARP table
```

### Connectivity testing

```bash
ping -c 4 google.com
ping6 -c 4 ipv6.google.com    # IPv6
traceroute google.com
mtr google.com                 # live traceroute
```

### DNS lookups

```bash
dig example.com                 # full info
dig example.com A               # only A records
dig example.com MX              # mail records
dig @8.8.8.8 example.com        # specific resolver
dig +short example.com          # just the answer
nslookup example.com
host example.com
```

### Port checks

```bash
nc -zv example.com 443                # is port 443 open?
nc -zv example.com 20-25              # scan port range
telnet example.com 80                 # interactive
```

### Connections and listening ports

```bash
ss -tulnp               # listening (modern)
netstat -tulnp          # listening (older)
ss -tanp                # all connections + processes
lsof -i                 # open network connections
lsof -i :80             # what's using port 80
```

### Scanning

```bash
nmap 192.168.1.0/24                # full subnet
nmap -sn 192.168.1.0/24            # just live hosts
nmap -sV target                     # detect services + versions
nmap -O target                      # OS detection
nmap --script vuln target          # check for vulnerabilities
```

### Packet capture

```bash
sudo tcpdump -i eth0                # capture on interface
sudo tcpdump -i any port 80         # only HTTP
sudo tcpdump -w capture.pcap        # save to file
sudo tcpdump -r capture.pcap        # read from file
```

---

## 33. Quick Reference — Things That Save Lives

### TCP/IP layers vs OSI

```
OSI                          TCP/IP
7 Application      ┐
6 Presentation     ├────  Application
5 Session          ┘
4 Transport        ──────  Transport
3 Network          ──────  Internet
2 Data Link        ┐
1 Physical         ┴────  Network Access
```

### Key ports to memorize

```
22  SSH        80  HTTP      143 IMAP    389 LDAP
25  SMTP       110 POP3      443 HTTPS   445 SMB
53  DNS        123 NTP       3389 RDP
```

### Power of 2 (subnetting)

```
2¹ = 2       2⁵ = 32
2² = 4       2⁶ = 64
2³ = 8       2⁷ = 128
2⁴ = 16      2⁸ = 256
```

### CIA Triad

> "Information that's **Confidential**, **Integrity** preserved, and **Available** when needed."

### When asked "what's the difference between..."

| Pair | Key difference |
|------|----------------|
| LAN vs WAN | Geographic size |
| Hub vs Switch | Switch is intelligent (uses MAC table) |
| Switch vs Router | Switch = same network. Router = between networks |
| TCP vs UDP | TCP reliable, UDP fast |
| IDS vs IPS | IDS alerts, IPS blocks |
| OSI vs TCP/IP | OSI = 7 layers (theory), TCP/IP = 4 layers (reality) |
| RADIUS vs TACACS+ | RADIUS = network access, TACACS+ = device admin |
| Authentication vs Authorization | Who are you? vs What can you do? |
| Symmetric vs Asymmetric encryption | Same key both sides vs Different keys (public/private) |
| Physical vs Logical topology | How it's wired vs How data flows |
