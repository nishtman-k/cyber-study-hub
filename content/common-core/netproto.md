# Network Protocols: Auditing & Securing

---

## 1. The Three Security Goals

Every secure protocol aims to achieve the **CIA triad**:

| Goal | Meaning | Achieved by |
|------|---------|-------------|
| **Confidentiality** | Data is unreadable to third parties | Encryption |
| **Integrity** | Data isn't tampered with in transit | Hashes / HMACs / signatures |
| **Authentication** | Both sides prove who they are | Certificates / keys / passwords |

> "Security is only as strong as the weakest protocol running on your system."

A protocol that only encrypts (confidentiality) but doesn't authenticate is vulnerable to man-in-the-middle. A protocol that authenticates but doesn't encrypt leaks all the data. You need all three.

---

## 2. Application Layer vs Network Layer Protocols

Networking is organized in **layers** (OSI model). Protocols at different layers solve different problems.

| | **Application Layer (Layer 7)** | **Network Layer (Layer 3)** |
|---|--------------------------------|------------------------------|
| **What they do** | Define how applications communicate | Move packets between networks |
| **Aware of** | The data being sent | IP addresses and routing |
| **Examples** | HTTP, HTTPS, SSH, FTP, SMTP, DNS | IP, IPSec, ICMP |
| **Where applied** | At the endpoints (browsers, servers) | At routers and OS network stack |
| **Encryption** | Protects specific applications | Protects ALL traffic (VPNs) |

### Why both matter

- **App-layer security (TLS)**: protects one specific service (HTTPS protects web only)
- **Network-layer security (IPSec, WireGuard)**: protects everything traveling between two networks (VPN tunnels)

You can — and often should — use both together.

---

## 3. Ports

A **port** is a 16-bit number (0-65535) identifying a specific service on a host.

```
192.168.1.10:443    →  IP + port = exact destination
   ↑           ↑
   server      service
```

### Three categories

| Range | Name | Use |
|-------|------|-----|
| **0 - 1023** | Well-known | Standard services (need root to bind) |
| **1024 - 49151** | Registered | Vendor-specific services |
| **49152 - 65535** | Dynamic / Ephemeral | Temporary client connections |

### Critical ports to memorize

| Port | Protocol | Service |
|------|----------|---------|
| 21 | TCP | FTP (insecure) |
| 22 | TCP | SSH / SFTP |
| 23 | TCP | Telnet (insecure!) |
| 25 | TCP | SMTP |
| 53 | UDP/TCP | DNS |
| 80 | TCP | HTTP |
| 110 | TCP | POP3 |
| 143 | TCP | IMAP |
| 161 | UDP | SNMP |
| 443 | TCP | HTTPS |
| 445 | TCP | SMB |
| 587 | TCP | SMTP (submission) |
| 993 | TCP | IMAPS |
| 995 | TCP | POP3S |
| 1194 | UDP | OpenVPN |
| 2049 | TCP | NFS |
| 4500 | UDP | IPSec NAT-T |
| 51820 | UDP | WireGuard |

---

## 4. SSL vs TLS

**SSL** and **TLS** are the cryptographic protocols that secure HTTPS, SMTPS, IMAPS, FTPS, etc.

| Version | Year | Status |
|---------|------|--------|
| SSL 1.0 | — | Never released (security flaws) |
| SSL 2.0 | 1995 | ❌ Broken |
| SSL 3.0 | 1996 | ❌ Broken (POODLE attack) |
| TLS 1.0 | 1999 | ❌ Deprecated |
| TLS 1.1 | 2006 | ❌ Deprecated |
| TLS 1.2 | 2008 | ✅ Still widely used |
| TLS 1.3 | 2018 | ✅ Current standard |

**Everyone still says "SSL" by habit, but everything modern is actually TLS.** If someone offers you an "SSL certificate," they really mean a TLS certificate.

### The TLS handshake (simplified)

```
CLIENT                                      SERVER
   │                                           │
   ├─── ClientHello ─────────────────────────→ │  (versions, cipher suites)
   │                                           │
   │ ←──── ServerHello + Certificate ─────────┤  (chosen cipher, server's cert)
   │                                           │
   │ ←──── Server key exchange ───────────────┤  (for forward secrecy)
   │                                           │
   ├─── Client key exchange ─────────────────→ │  (encrypted session key data)
   │                                           │
   ├─── ChangeCipherSpec + Finished ─────────→ │  (now encrypted)
   │                                           │
   │ ←──── ChangeCipherSpec + Finished ───────┤  (server confirms)
   │                                           │
   ╞═══ Encrypted application data ═══════════╡
```

**TLS 1.3 is faster** — handshake takes 1 round trip (vs 2 in TLS 1.2) because it removes weak ciphers and combines steps.

### Inspect a server's TLS

```bash
# Check what TLS version + cipher a server supports
openssl s_client -connect example.com:443 -tls1_3
openssl s_client -connect example.com:443 -tls1_2

# View the certificate
echo | openssl s_client -connect example.com:443 2>/dev/null | openssl x509 -text -noout

# Quick certificate expiry check
echo | openssl s_client -connect example.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## 5. SSH — The Problem It Solved

Before SSH, remote login used **Telnet** (port 23). Telnet sends **everything in plaintext** — including your password.

### Telnet vs SSH

| | **Telnet** | **SSH** |
|---|-----------|---------|
| **Port** | 23 | 22 |
| **Encryption** | ❌ None | ✅ Strong |
| **Authentication** | Password (cleartext) | Password / public key / certificate |
| **Tampering protection** | ❌ None | ✅ HMAC integrity check |
| **Use today** | ❌ Never | ✅ Standard for remote access |

In 1995, anyone with a network sniffer could capture Telnet credentials. SSH (1995) replaced it by encrypting the entire session.

### SSH public key authentication — how it works

```
1. You generate a key pair:    private (secret) + public (shareable)
2. You copy the PUBLIC key to the server's ~/.ssh/authorized_keys
3. When you connect:
   - Server: "Prove you have the private key for this public key"
   - Client: Signs a challenge with the private key
   - Server: Verifies the signature using your public key
4. If signature is valid → access granted
```

**Why it's better than passwords:**

- Private key never leaves your machine
- Even if the server is compromised, your private key isn't exposed
- Can't be brute-forced over the network (no passwords to guess)
- Easy to revoke (delete from `authorized_keys`)

### Set up SSH keys

```bash
# Generate a modern key (Ed25519 = small + fast + strong)
ssh-keygen -t ed25519 -C "your_email@example.com"
# Creates: ~/.ssh/id_ed25519 (private), ~/.ssh/id_ed25519.pub (public)

# Copy public key to a server
ssh-copy-id user@server.com

# Now you can SSH without a password
ssh user@server.com
```

---

## 6. Secure vs Insecure Protocol Pairs

Most insecure protocols have a secure replacement. Use the secure one.

| ❌ Avoid | ✅ Use instead | Port (insecure → secure) |
|---------|---------------|--------------------------|
| HTTP | HTTPS | 80 → 443 |
| FTP | SFTP / FTPS | 21 → 22 / 990 |
| Telnet | SSH | 23 → 22 |
| POP3 | POP3S | 110 → 995 |
| IMAP | IMAPS | 143 → 993 |
| SMTP (port 25) | SMTPS / SMTP+STARTTLS | 25 → 465 / 587 |
| SNMP v1/v2c | SNMP v3 | 161 |
| NFS v3 (no auth) | NFS v4 + Kerberos | 2049 |
| LDAP | LDAPS | 389 → 636 |
| PPTP | WireGuard / IPSec / OpenVPN | 1723 → various |

### Why HTTPS is mandatory now

- **Modern browsers** mark plain HTTP as "Not Secure"
- **Many features only work on HTTPS**: HTTP/2, service workers, geolocation, camera, microphone, push notifications
- **SEO penalty**: Google ranks HTTPS sites higher
- **User trust**: the padlock icon (or lack of warning) is critical
- **Legal requirements**: GDPR, HIPAA, PCI-DSS all effectively require HTTPS for sensitive data
- **Cost is zero**: Let's Encrypt provides free certificates

---

## 7. IPSec — VPN at the Network Layer

**IPSec** secures IP traffic itself — protecting all upper-layer protocols (HTTP, SSH, anything) by encrypting at Layer 3.

### Transport mode vs Tunnel mode

| | **Transport Mode** | **Tunnel Mode** |
|---|--------------------|--------------------|
| **What's encrypted** | Just the payload | Entire IP packet |
| **Headers** | Original IP header kept | New outer IP header added |
| **Use case** | Host-to-host within a trusted network | Site-to-site VPNs, remote-access VPNs |
| **Common in** | End-to-end encryption between two hosts | Almost all real-world VPN setups |

```
Original packet:    [ IP HEADER ][ PAYLOAD ]

Transport mode:     [ IP HEADER ][ ENCRYPTED PAYLOAD ]
                    (sender visible)  (data hidden)

Tunnel mode:        [ NEW IP HEADER ][ ENCRYPTED [ orig IP + PAYLOAD ] ]
                    (tunnel endpoints visible) (everything else hidden)
```

**For VPNs you almost always use Tunnel mode.**

### AH vs ESP

IPSec has two component protocols:

| | **AH** (Authentication Header) | **ESP** (Encapsulating Security Payload) |
|---|--------------------------------|--------------------------------------------|
| **Provides** | Authentication + integrity | Authentication + integrity + **encryption** |
| **Encrypts data?** | ❌ No | ✅ Yes |
| **NAT-friendly?** | ❌ Breaks through NAT | ✅ Works with NAT (NAT-T) |
| **Used today** | Rare | Standard |

Real-world IPSec deployments almost always use **ESP** because it both encrypts AND authenticates. AH alone is mostly historical.

---

## 8. VPN Protocols Compared

| Protocol | Year | Security | Speed | Notes |
|----------|------|----------|-------|-------|
| **PPTP** | 1999 | ❌ Broken | Fast | **Never use** — MS-CHAPv2 cracked in minutes |
| **L2TP/IPSec** | 1999 | ⚠️ Moderate | Slower (double encapsulation) | Still works, dated |
| **OpenVPN** | 2002 | ✅ Strong | Decent | Mature, widely supported, complex config |
| **IKEv2/IPSec** | 2005 | ✅ Strong | Fast | Great mobile support, reconnects fast |
| **SSTP** | 2007 | ✅ Strong | Decent | Windows-centric, uses HTTPS port |
| **WireGuard** | 2018 | ✅ Strong | **Fastest** | Modern crypto, tiny codebase (~4K lines) |

### Why PPTP should never be used

- Uses MS-CHAPv2 for authentication — **cracked in 24 hours** with cloud computing
- Encryption (MPPE) uses RC4 — broken
- US Government (NIST) banned it from federal use
- If you see a service offering PPTP "for compatibility," don't use it

### Why WireGuard is the modern favorite

| | **OpenVPN** | **WireGuard** |
|---|-------------|---------------|
| **Codebase size** | ~600,000 lines | ~4,000 lines (auditable) |
| **Cryptography** | Configurable (many options) | Fixed set of modern primitives (ChaCha20, Poly1305, Curve25519) |
| **Configuration** | Complex (.ovpn files) | Simple (small INI-like config) |
| **Performance** | Slower (user-space) | Faster (kernel-space) |
| **Handshake** | TLS-style (multiple round-trips) | 1-RTT |
| **Mobile roaming** | Drops on network change | Seamless (UDP, stateless) |

WireGuard's small codebase means it can be audited line-by-line — a huge security advantage.

---

## 9. NFS — Network File System

**NFS** lets a server share filesystems over a network. Other machines mount the shares as if they were local.

- Port: **2049 (TCP/UDP)**
- Original NFS (v3) used IP-based authorization — easy to spoof
- NFS v4 added Kerberos auth (much better) but most deployments still use v3

### Common misconfigurations

| Misconfiguration | Risk |
|------------------|------|
| Export shared as `*` (any IP) | Anyone on the internet can mount your filesystem |
| `no_root_squash` enabled | Remote root has root privileges on the share |
| Read+write shares without authentication | Anyone can modify files |
| Old NFS v3 (no Kerberos) | No real authentication |

### Discovering NFS exports

```bash
# Show all exports a server makes available
showmount -e target.com

# Example output:
# Export list for target.com:
# /srv/data            *
# /home                192.168.1.0/24
# /var/backups         (everyone)
```

That output tells an attacker exactly what to mount. Anything exported to `*` is wide open.

### Mount it (as a test)

```bash
# As root
mkdir /mnt/test
mount -t nfs target.com:/srv/data /mnt/test
ls /mnt/test
```

If you can mount as a non-trusted host, the export is misconfigured.

### Hardening NFS

```bash
# /etc/exports - good practice example:
/srv/data    192.168.1.0/24(rw,root_squash,sync,no_subtree_check)

# Then:
sudo exportfs -ra
```

Key flags:
- **Restrict to specific IPs/networks** — never `*`
- `root_squash` — remote root becomes nobody locally
- Better: use NFS v4 with Kerberos

---

## 10. SMTP — Mail Server Enumeration

SMTP (port 25) has two commands historically used to verify users — and attackers abuse them.

### VRFY and EXPN

```
VRFY alice           → server confirms if alice exists locally
EXPN sales           → server expands the mailing list "sales"
```

These were intended for debugging but became a recon goldmine. An attacker connects and tests usernames:

```
$ telnet mail.example.com 25
220 mail.example.com ESMTP
HELO attacker.com
250 OK
VRFY admin
250 admin@example.com         ← user exists!
VRFY notauser
550 No such user
```

### Test if a server is vulnerable

```bash
# Connect manually
telnet mail.example.com 25
# Then type: VRFY <username>

# Or with nmap script
nmap -p 25 --script smtp-enum-users mail.example.com

# With smtp-user-enum tool
smtp-user-enum -M VRFY -U usernames.txt -t mail.example.com
```

### How to fix

In Postfix (`/etc/postfix/main.cf`):

```
disable_vrfy_command = yes
```

This blocks VRFY entirely. EXPN should also be disabled — most modern mail servers disable both by default.

```bash
sudo postconf -e "disable_vrfy_command = yes"
sudo systemctl restart postfix
```

---

## 11. SNMP — Network Monitoring's Old Wound

**SNMP** (Simple Network Management Protocol) lets admins monitor and manage network devices (routers, switches, printers, servers).

- Port: **161 (UDP)**
- Three versions: v1, v2c, v3

### Why SNMP is risky

| Version | Authentication | Encryption | Use |
|---------|---------------|------------|-----|
| **v1** | "Community string" (basically a plaintext password) | ❌ None | ❌ Don't use |
| **v2c** | Same as v1 | ❌ None | ❌ Don't use |
| **v3** | Username + password | ✅ Yes | ✅ Use this |

### Default community strings

- Default read community: `public`
- Default write community: `private`

**Networking equipment is shipped with these defaults**. Many admins never change them. An attacker who guesses `public` can read:

- Routing tables
- Interface statistics
- Running processes
- ARP tables
- User account info
- Sometimes complete configurations

### Probe SNMP

```bash
# Try the default community string
snmpwalk -v 2c -c public target.com
snmpwalk -v 2c -c private target.com   # write community

# Use a wordlist
onesixtyone -c /usr/share/seclists/Miscellaneous/snmp/common-snmp-community-strings-onesixtyone.txt target.com

# nmap script
nmap -sU -p 161 --script snmp-brute target.com
```

### Hardening

```bash
# /etc/snmp/snmpd.conf — good practice:
# Disable v1/v2c entirely
# Configure v3 with SHA + AES:

createUser monitor SHA "strong-password" AES "strong-encryption-key"
rouser monitor priv

# Restart
sudo systemctl restart snmpd
```

---

## 12. System Hardening Basics

### Why patches and updates matter

Most "sophisticated" breaches actually exploit **known vulnerabilities with patches available**. Unpatched servers are low-hanging fruit.

- **Heartbleed (2014)**: OpenSSL bug, patches available within hours — exploited for months on unpatched servers
- **EternalBlue (2017)**: Microsoft patched it 2 months before WannaCry — hit hundreds of thousands of unpatched machines
- **Log4Shell (2021)**: Patches released same day — exploited for years afterward

### Basic hardening checklist

- [ ] **OS up to date**: `sudo apt update && sudo apt upgrade`
- [ ] **Unnecessary services disabled**: `sudo systemctl list-unit-files --state=enabled`
- [ ] **Firewall enabled**: `iptables` or `ufw` with deny-by-default policy
- [ ] **SSH hardened**: no root login, no password auth, modern ciphers only
- [ ] **Strong passwords / SSH keys** required
- [ ] **fail2ban** installed for SSH/web brute-force protection
- [ ] **Automatic security updates** enabled
- [ ] **Logs monitored**: `/var/log/auth.log`, `/var/log/syslog`
- [ ] **Backups** taken regularly and tested
- [ ] **lynis** audit run periodically

---

## 13. Firewall Configuration with iptables

`iptables` is the classic Linux firewall. Rules are organized into **chains**:

```
INPUT   →  incoming connections to this machine
OUTPUT  →  outgoing connections from this machine
FORWARD →  connections this machine routes for others
```

### Basic concepts

```
[Action]    What to do:  ACCEPT, DROP, REJECT, LOG
[Source]    -s <ip/network>
[Destination] -d <ip/network>
[Protocol]  -p tcp / -p udp / -p icmp
[Port]      --dport 22 / --sport 22
```

### Default deny-all firewall example

```bash
# Set default policy: drop everything
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
sudo iptables -P OUTPUT ACCEPT

# Allow loopback (your own machine talking to itself)
sudo iptables -A INPUT -i lo -j ACCEPT

# Allow established connections (replies to your outgoing traffic)
sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow SSH from a specific subnet only
sudo iptables -A INPUT -p tcp -s 192.168.1.0/24 --dport 22 -j ACCEPT

# Allow HTTPS from anywhere
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow ICMP (ping)
sudo iptables -A INPUT -p icmp -j ACCEPT

# Everything else is dropped by the default policy
```

### Useful iptables commands

```bash
# Show current rules
sudo iptables -L -v -n

# Show with line numbers
sudo iptables -L -v -n --line-numbers

# Delete a rule by line number
sudo iptables -D INPUT 5

# Flush all rules (careful!)
sudo iptables -F

# Save rules permanently
sudo iptables-save | sudo tee /etc/iptables/rules.v4

# Restore on boot
sudo iptables-restore < /etc/iptables/rules.v4
```

### `ufw` — the easier alternative

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from 192.168.1.0/24 to any port 22
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

`ufw` is a friendlier frontend for iptables — same firewall underneath.

---

## 14. SSH Hardening

The `sshd_config` file at `/etc/ssh/sshd_config` controls the SSH server.

### Common weaknesses and fixes

```bash
# Edit
sudo nano /etc/ssh/sshd_config
```

| Weakness | Default | Hardened |
|----------|---------|----------|
| Root login allowed | `PermitRootLogin yes` | `PermitRootLogin no` |
| Password authentication | `PasswordAuthentication yes` | `PasswordAuthentication no` (keys only) |
| Empty passwords | `PermitEmptyPasswords no` (good) | Keep `no` |
| SSH protocol 1 | (deprecated) | Force `Protocol 2` |
| Default port | `Port 22` | Optional: change to non-default |
| Weak ciphers | Allowed | Restrict to modern: `Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com` |
| X11 forwarding (often unneeded) | `X11Forwarding yes` | `X11Forwarding no` |
| Unlimited login attempts | (default) | `MaxAuthTries 3` |
| No idle timeout | (default) | `ClientAliveInterval 300`, `ClientAliveCountMax 0` |

### Recommended hardened sshd_config

```
Port 22
Protocol 2
PermitRootLogin no
PasswordAuthentication no
PermitEmptyPasswords no
PubkeyAuthentication yes
X11Forwarding no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 0
AllowUsers alice bob
LogLevel VERBOSE
```

Apply changes:

```bash
sudo sshd -t                          # test config syntax
sudo systemctl restart sshd
```

⚠️ **Always test in another terminal before logging out** — if you misconfigure, you could lock yourself out.

---

## 15. Auditing Tools

### `lynis` — comprehensive security audit

```bash
sudo apt install lynis
sudo lynis audit system

# Quick summary:
sudo lynis show details

# Save report
sudo lynis audit system --report-file /var/log/lynis-report.dat
```

`lynis` checks hundreds of items: file permissions, service configs, auth settings, kernel hardening, etc. Each finding includes a hardening suggestion.

### `nmap` — port scanning & service detection

```bash
# Quick TCP scan of common ports
nmap target.com

# Full TCP port scan (slower but thorough)
nmap -p- target.com

# Service version detection
nmap -sV target.com

# OS detection
nmap -O target.com

# Aggressive scan (versions + OS + scripts + traceroute)
nmap -A target.com

# UDP scan (for SNMP, DNS, etc.)
sudo nmap -sU -p 53,161 target.com

# Run vulnerability scripts
nmap --script vuln target.com

# Specific service scripts
nmap --script smtp-enum-users target.com
nmap --script snmp-brute target.com
```

### `hping3` — packet crafting & firewall testing

`hping3` lets you send custom-crafted TCP/UDP/ICMP packets — useful for testing firewall rules and finding which packets get through.

```bash
sudo apt install hping3

# Test if port is open with a SYN packet
sudo hping3 -S target.com -p 80 -c 3

# Send a UDP probe
sudo hping3 --udp target.com -p 53

# Test firewall: send fragments
sudo hping3 -f target.com -p 80

# Spoofed source IP (test ingress filtering)
sudo hping3 -a 10.0.0.1 -S target.com -p 80

# Flood test (use ONLY on systems you own)
sudo hping3 -i u100 -S target.com -p 80   # 1 packet per 100 microseconds
```

### `showmount` — NFS exports discovery

```bash
showmount -e target.com    # show exported filesystems
showmount -a target.com    # show all active mounts
showmount -d target.com    # show directories currently mounted
```

If `showmount -e` returns anything to you from outside the trusted network, that's a misconfiguration.

---

## 16. Audit Workflow

A typical protocol audit on a Linux server:

```
1. RECONNAISSANCE
   nmap -sV -p- target.com           → what's listening?
   nmap -sU --top-ports 100 target.com  → UDP services
       
2. SERVICE-SPECIFIC TESTS
   Web (80/443):     curl -kI, sslyze, testssl.sh, nikto
   SSH (22):         nmap --script ssh-auth-methods, ssh-audit
   SMTP (25):        nmap --script smtp-enum-users
   SNMP (161):       snmpwalk -v 2c -c public, onesixtyone
   NFS (2049):       showmount -e
   FTP (21):         test for anonymous login
       
3. TLS/SSL HEALTH
   openssl s_client -connect target:443
   testssl.sh target:443
       
4. SYSTEM AUDIT (on the host itself)
   sudo lynis audit system
   sudo iptables -L -v -n
   cat /etc/ssh/sshd_config | grep -iE "permitroot|password|protocol"
       
5. PATCH STATUS
   apt list --upgradable
   # or
   dnf check-update
       
6. REPORT
   Document findings: protocol used, version, vulnerability, remediation
```

---

## 17. Common Mistakes to Avoid

| Mistake | Why it's bad |
|---------|-------------|
| Leaving Telnet/FTP/POP3 enabled | Credentials in cleartext |
| Using default SNMP community strings | Free recon for attackers |
| NFS exports to `*` (anywhere) | Anyone can mount your data |
| SSH with `PermitRootLogin yes` + passwords | Direct brute-force target |
| Self-signed certs in production | Users get scary warnings, click through |
| Disabling certificate validation in clients | Defeats the purpose of TLS |
| Running outdated TLS versions (1.0/1.1) | Vulnerable to BEAST, POODLE, etc. |
| Using PPTP in 2026 | Broken cryptography |
| Firewall with `ACCEPT` default policy | Anything not explicitly denied is allowed |
| Never running `lynis` or audits | Vulnerabilities accumulate silently |

---

## 18. Quick Reference

### Always use the secure version

```
TELNET → SSH                    HTTP → HTTPS
FTP → SFTP                      POP3 → POP3S
SMTP → SMTPS                    IMAP → IMAPS
SNMP v1/v2c → SNMP v3           NFS v3 → NFS v4 + Kerberos
PPTP → WireGuard / IPSec
```

### Default-deny firewall principle

```
1. Drop all incoming by default
2. Allow established connections back
3. Open ONLY the specific ports you actually need
4. Restrict admin ports (22) to known IPs
```

### CIA triad applied to protocols

```
Confidentiality   →  TLS, IPSec ESP, SSH
Integrity         →  HMAC, signatures, AH
Authentication    →  Certificates, public keys, MFA
```

### Three "always" rules

```
1. ALWAYS patch and update
2. ALWAYS use the secure protocol version when one exists
3. ALWAYS verify your defaults — never trust them
```

### Key audit commands at a glance

```bash
# Find what's listening on your system
sudo ss -tulnp

# Scan a target's open ports + versions
nmap -sV -p- target.com

# Find NFS shares
showmount -e target.com

# Check TLS health
openssl s_client -connect target.com:443

# Comprehensive system audit
sudo lynis audit system

# View firewall rules
sudo iptables -L -v -n

# SSH server config check
sudo sshd -t && grep -iE "permitroot|password|protocol" /etc/ssh/sshd_config
```
