# Active Reconnaissance

---

## 1. What is Active Reconnaissance?

**Active reconnaissance** is gathering information about a target by **directly interacting** with it — sending packets, scanning ports, querying services. The target's logs see you.

### Active vs Passive

| | **Passive** | **Active** |
|---|-------------|------------|
| **Interaction with target** | None | Direct |
| **Visible to target?** | No | Yes (in logs) |
| **Speed** | Slow | Fast |
| **Detail** | Limited | Detailed |
| **Tools** | whois, Google, Shodan, LinkedIn | nmap, ping, sqlmap, Burp |
| **Risk** | Low (legal usually) | Higher (may be unauthorized) |

> Passive: reading about your target online.
> Active: knocking on their door and asking questions.

### Why it matters

| For attackers | For defenders |
|---------------|---------------|
| Map the target's surface | Know what's exposed |
| Find open ports / services | Identify gaps before attackers do |
| Discover vulnerabilities | Practice detection (IDS/SIEM) |
| Choose attack vectors | Patch what's vulnerable |
| Find weak spots | Validate firewall rules |

**Always have written authorization before doing active recon on systems you don't own.** It can be illegal otherwise.

---

## 2. The Recon Workflow

A typical active reconnaissance phase:

```
1. Host discovery        → Is the target alive?  (ping, nmap -sn)
2. Port scanning         → What ports are open?  (nmap)
3. Service identification → What runs on each port?  (nmap -sV)
4. OS fingerprinting     → What OS?  (nmap -O)
5. Service enumeration   → Detail each service  (specific tools)
6. Vulnerability scan    → Known issues?  (nmap --script vuln, nikto)
7. Web-app analysis      → Stack, paths, params  (Wappalyzer, ffuf)
```

Each step narrows your understanding of the target.

---

## 3. Host Discovery — Is It Alive?

### ping — basic reachability

```bash
ping -c 4 target.com         # 4 packets only
ping6 -c 4 ipv6.target.com   # IPv6
```

What ping tells you:
- Whether the host responds to ICMP
- Approximate round-trip latency
- Packet loss

**Warning:** Many hosts block ICMP. Lack of ping reply ≠ host is down.

### traceroute — the path packets take

```bash
traceroute target.com
traceroute -T target.com     # TCP mode (when ICMP is blocked)
mtr target.com               # live-updating traceroute
```

Shows every router/hop between you and the target. Useful for:
- Identifying network paths
- Finding firewalls (where the trace stops)
- Estimating where the target is geographically

### nmap host discovery

```bash
nmap -sn 192.168.1.0/24      # ping sweep — find live hosts in a subnet
nmap -PR 192.168.1.0/24      # ARP-based (LAN only, very accurate)
nmap -Pn target.com          # skip discovery, treat as up (forced scan)
```

Use `-Pn` when ICMP is blocked but you want to scan anyway.

---

## 4. Port Scanning with nmap

`nmap` is the de-facto port scanner. Knowing its core flags pays for itself.

### Basic scans

```bash
nmap target.com                       # default: top 1000 TCP ports
nmap -p 22,80,443 target.com          # specific ports
nmap -p 1-1000 target.com             # range
nmap -p- target.com                   # ALL 65535 ports (slow)
nmap --top-ports 100 target.com       # top 100 most common
```

### Scan techniques

| Flag | Type | Notes |
|------|------|-------|
| `-sS` | SYN scan (half-open) | Default if root, stealthy |
| `-sT` | Full TCP connect | No root needed, loud |
| `-sU` | UDP scan | Slow but finds DNS, SNMP, NTP |
| `-sA` | ACK scan | Maps firewall rules |
| `-sF` | FIN scan | Tries to bypass filters |
| `-sN` | NULL scan | No flags set |
| `-sX` | XMAS scan | FIN+PSH+URG |

```bash
sudo nmap -sS target.com              # SYN scan (typical)
sudo nmap -sU --top-ports 20 target.com   # quick UDP top-20
```

### Service & version detection

```bash
nmap -sV target.com                   # detect service versions
nmap -sV --version-intensity 0 target.com   # less aggressive
nmap -sV --version-intensity 9 target.com   # exhaustive (slow)
```

### OS detection

```bash
sudo nmap -O target.com               # guess the OS
sudo nmap -O --osscan-guess target.com    # more aggressive guessing
```

### The "everything" scan

```bash
sudo nmap -A target.com   # versions + OS + scripts + traceroute
sudo nmap -sC -sV -O -p- target.com   # explicit version
```

### Timing templates

```
-T0  Paranoid  (very slow, IDS evasion)
-T1  Sneaky
-T2  Polite
-T3  Normal  (default)
-T4  Aggressive (faster, good on stable networks)
-T5  Insane   (very fast, may miss results)
```

### Output formats

```bash
nmap -oN out.txt target.com    # normal text
nmap -oX out.xml target.com    # XML (for tools)
nmap -oG out.grep target.com   # greppable
nmap -oA scan target.com       # all formats at once
```

---

## 5. OS Fingerprinting

Identifying the operating system tells you what attacks apply.

### How it works

OSes have unique behaviors in their TCP/IP stacks:
- TTL values (Linux 64, Windows 128, Cisco 255)
- TCP window sizes
- Response to malformed packets
- Open ports patterns

nmap fingerprints these and matches against its database.

### nmap OS detection

```bash
sudo nmap -O target.com

# Output example:
# Running: Linux 4.X|5.X
# OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5
# OS details: Linux 4.15 - 5.6
```

### Quick TTL check (manual)

```bash
ping -c 1 target.com | grep ttl

# TTL 64  →  probably Linux/macOS
# TTL 128 →  probably Windows
# TTL 255 →  probably network device (router/switch)
```

TTL decreases by 1 per hop, so add hop count back for accuracy.

### Service-based OS guesses

```bash
nmap -sV target.com | grep -i "os\|windows\|linux\|cisco"
```

Service banners often reveal the OS (e.g., "OpenSSH for Windows", "Apache/2.4.41 (Ubuntu)").

---

## 6. Banner Grabbing

Connect to a service and read the banner — services often advertise their version.

### Using netcat

```bash
nc -v target.com 22       # SSH banner
nc -v target.com 80       # HTTP — then type GET / HTTP/1.0 and hit Enter twice
nc -v target.com 25       # SMTP banner
nc -v target.com 21       # FTP banner
```

### Using telnet

```bash
telnet target.com 80
# Then type:
# GET / HTTP/1.0
# Host: target.com
# (blank line)
```

### Using curl for HTTP

```bash
curl -kI https://target.com               # headers only
curl -ks https://target.com | head        # body start
curl -kI -A "Mozilla/5.0" target.com      # spoof User-Agent
```

### What you learn from banners

- Software name + version (`Apache/2.4.41`)
- OS hints (`Server: nginx/1.18.0 (Ubuntu)`)
- Misconfigurations (verbose error messages)
- Outdated software → known CVEs to look up

---

## 7. DNS Enumeration

Find subdomains, mail servers, name servers, IP ranges — all by querying DNS.

### Basic DNS lookups

```bash
dig example.com                # full info
dig example.com A              # IPv4 only
dig example.com AAAA           # IPv6
dig example.com MX             # mail servers
dig example.com NS             # name servers
dig example.com TXT            # SPF, DKIM, verification records
dig example.com any +noall +answer    # everything in one shot
dig @8.8.8.8 example.com       # use Google DNS

# Reverse DNS (IP → name)
dig -x 93.184.216.34
```

### Zone transfer (if misconfigured server)

```bash
# Find name servers
dig ns example.com +short

# Try a zone transfer (rarely works on hardened DNS)
dig axfr @ns1.example.com example.com
```

A successful zone transfer dumps the **entire DNS zone** — huge win for the attacker.

### Subdomain enumeration tools

```bash
# subfinder — fast passive enumeration
subfinder -d example.com -silent

# With IPs
subfinder -d example.com -silent -ip -nW

# Output to file
subfinder -d example.com -silent -o subs.txt

# dnsenum — comprehensive (subdomains + zone transfers)
dnsenum example.com

# fierce — recursive subdomain scanner
fierce --domain example.com

# amass — large-scale passive + active recon
amass enum -d example.com

# dnsrecon — multiple methods
dnsrecon -d example.com
```

### Subdomain bruteforce with ffuf

```bash
ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt:FUZZ \
     -u https://example.com -H "Host: FUZZ.example.com" -fs SIZE
```

---

## 8. SMTP Enumeration

Mail servers historically supported commands that reveal valid users — a goldmine for attackers.

### The vulnerable commands

| Command | Purpose | Risk |
|---------|---------|------|
| `VRFY user` | Verify user exists | Confirms valid usernames |
| `EXPN list` | Expand a mailing list | Reveals members |
| `RCPT TO:<user>` | Recipient verification | Server confirms valid users |

### Manual enumeration

```bash
telnet mail.example.com 25

# At the prompt:
HELO test.com
VRFY alice           # "250 alice@example.com" = valid
VRFY notreal         # "550 No such user" = invalid
EXPN sales           # lists sales group members
QUIT
```

### Automated with nmap

```bash
nmap -p 25 --script smtp-enum-users --script-args \
     smtp-enum-users.methods={VRFY,EXPN,RCPT},userdb=/usr/share/seclists/Usernames/top-usernames-shortlist.txt \
     mail.example.com

# Other helpful SMTP scripts
nmap -p 25 --script smtp-commands target.com       # what commands are allowed
nmap -p 25 --script smtp-open-relay target.com     # check for open relay
```

### Automated with smtp-user-enum

```bash
sudo apt install smtp-user-enum

smtp-user-enum -M VRFY -U usernames.txt -t mail.example.com
smtp-user-enum -M EXPN -U usernames.txt -t mail.example.com
smtp-user-enum -M RCPT -U usernames.txt -t mail.example.com
```

### Defense (for the blue team perspective)

```bash
# In Postfix: /etc/postfix/main.cf
disable_vrfy_command = yes
```

---

## 9. Web Application Reconnaissance

### Wappalyzer — fingerprint web technologies

**Wappalyzer** identifies the technologies a website uses — CMS, frameworks, analytics, server software, even versions.

| Detects | Examples |
|---------|----------|
| **CMS** | WordPress, Joomla, Drupal, Magento |
| **Frameworks** | React, Vue, Angular, Laravel, Django |
| **Web servers** | nginx, Apache, IIS, Cloudflare |
| **Databases** | MySQL, PostgreSQL |
| **Analytics** | Google Analytics, Plausible |
| **CDN** | Cloudflare, Akamai, Fastly |
| **Programming language** | PHP, Python, Ruby |

### How to use Wappalyzer

**1. Browser extension** (easiest):
- Install in Chrome/Firefox
- Visit a site → click the extension icon → see tech stack

**2. CLI version:**

```bash
# Install via npm
npm install -g wappalyzer-cli
wappalyzer https://example.com
```

**3. Online:**
- `wappalyzer.com/lookup/example.com`

### Why this matters for active recon

Once you know the tech stack:
- WordPress site → check for vulnerable plugins
- Apache 2.2 → known CVEs
- Old jQuery → XSS via known bug
- Specific framework → look up its common misconfigurations

### Other web recon tools

```bash
# whatweb — alternative tech fingerprinting
whatweb example.com

# wafw00f — detect web application firewalls
wafw00f https://example.com

# nikto — vulnerability scanner (loud)
nikto -h https://example.com

# httpx — fast HTTP probing
echo "example.com" | httpx -title -tech-detect -status-code
```

---

## 10. SQLMap — Automated SQL Injection

**sqlmap** automates detection and exploitation of SQL injection vulnerabilities. It's the standard tool for SQLi testing.

### When to use it

You suspect a web parameter accepts SQL input:
- `https://target.com/product?id=5`
- A login form
- A search field
- Any input that ends up in a database query

### Basic usage

```bash
# Simple GET parameter test
sqlmap -u "https://target.com/product?id=5"

# POST data test
sqlmap -u "https://target.com/login" \
       --data="username=admin&password=test"

# Use cookies (for authenticated areas)
sqlmap -u "https://target.com/profile?id=1" \
       --cookie="session=abc123"

# Test a captured request (from Burp / curl)
sqlmap -r request.txt
```

### Specifying what to extract

```bash
# Step 1 — Confirm injection exists and list DBs
sqlmap -u "..." --dbs

# Step 2 — List tables in a database
sqlmap -u "..." -D database_name --tables

# Step 3 — List columns in a table
sqlmap -u "..." -D database_name -T users --columns

# Step 4 — Dump a table
sqlmap -u "..." -D database_name -T users --dump

# Step 5 — Dump everything (loud, may take hours)
sqlmap -u "..." --dump-all
```

### Useful flags

| Flag | Purpose |
|------|---------|
| `--batch` | Auto-accept defaults (no prompts) |
| `--random-agent` | Random user-agent (avoid simple bot detection) |
| `--level=5` | Test more injection patterns (1-5) |
| `--risk=3` | More aggressive payloads (1-3) |
| `--threads=10` | Faster scanning |
| `--tor` | Route through Tor |
| `--proxy=http://127.0.0.1:8080` | Use a proxy (e.g., Burp) |
| `--os-shell` | Get an OS shell (if DB allows) |
| `--sql-shell` | Interactive SQL shell |
| `--dump-format=CSV` | Export dumps as CSV |
| `--current-db` | Just the current DB name |
| `--current-user` | Just the current DB user |
| `--is-dba` | Check if current user is admin |

### A typical workflow

```bash
# 1. Test if injectable (light)
sqlmap -u "https://target.com/page?id=1" --batch

# 2. If injectable, see what DBs exist
sqlmap -u "https://target.com/page?id=1" --batch --dbs

# 3. Pick an interesting DB (e.g., 'webapp') and see tables
sqlmap -u "https://target.com/page?id=1" --batch -D webapp --tables

# 4. See columns in 'users' table
sqlmap -u "https://target.com/page?id=1" --batch -D webapp -T users --columns

# 5. Dump the users table
sqlmap -u "https://target.com/page?id=1" --batch -D webapp -T users --dump
```

### Defending against SQLi

- **Parameterized queries** (prepared statements) — the only real fix
- **Stored procedures** with proper input handling
- **ORM** (SQLAlchemy, ActiveRecord, Eloquent) — usually safe by default
- **WAF** (Cloudflare, ModSecurity) — secondary layer
- **Input validation** — never trust user input

---

## 11. Combining Tools — A Real Workflow

A practical reconnaissance session against an authorized target:

```bash
# 1. Discover the host
ping -c 2 target.com
nmap -sn 192.168.1.0/24    # if internal

# 2. Map open ports + services + OS
sudo nmap -sV -O -A target.com -oA initial_scan

# 3. Enumerate DNS
subfinder -d target.com -silent | tee subdomains.txt
dig target.com any +noall +answer @8.8.8.8

# 4. Fingerprint web tech
whatweb https://target.com
# Or browser extension Wappalyzer

# 5. If web app — find directories
ffuf -w /usr/share/seclists/Discovery/Web-Content/common.txt:FUZZ \
     -u https://target.com/FUZZ -k -fc 404

# 6. If you find a login or parameterized URL — test for SQLi
sqlmap -u "https://target.com/page?id=1" --batch --level=2

# 7. Document everything
mkdir target.com_recon
mv initial_scan.* subdomains.txt target.com_recon/
```

---

## 12. Stealth and Anti-Detection

If you need to be quieter (avoid IDS/IPS):

### Slow down

```bash
nmap -T1 target.com               # paranoid timing
nmap --scan-delay 5s target.com   # 5 seconds between probes
```

### Decoys (mask your real IP)

```bash
sudo nmap -D RND:10 target.com    # 10 random decoy IPs
sudo nmap -D 10.0.0.5,10.0.0.6,ME target.com  # specific decoys
```

### Fragment packets

```bash
sudo nmap -f target.com             # fragment packets
sudo nmap --mtu 8 target.com        # custom packet size
```

### Source port spoofing

```bash
sudo nmap --source-port 53 target.com   # pretend to come from DNS
```

### Use a proxy / Tor

```bash
proxychains nmap -sT target.com   # route through proxies
torify nmap -sT target.com        # via Tor (slow)
```

⚠️ Most of these don't fully hide you — modern IDS systems detect them. They just buy time.

---

## 13. Quick Reference

### Essential commands

```bash
# Host discovery
ping -c 4 target.com
traceroute target.com
nmap -sn 192.168.1.0/24

# Port scan
sudo nmap -sV -O target.com
sudo nmap -p- target.com

# OS detection
sudo nmap -O target.com
ping -c 1 target.com | grep ttl       # quick TTL check

# Banner grab
nc -v target.com 80
telnet target.com 25
curl -kI https://target.com

# DNS
dig target.com any +noall +answer @8.8.8.8
dig axfr @ns1.target.com target.com    # zone transfer
subfinder -d target.com -silent

# SMTP enumeration
nmap -p 25 --script smtp-enum-users target.com
smtp-user-enum -M VRFY -U users.txt -t mail.target.com

# Web fingerprinting
whatweb target.com
wappalyzer https://target.com

# SQL injection
sqlmap -u "https://target.com/p?id=1" --batch --dbs

# Directory fuzzing
ffuf -w wordlist.txt:FUZZ -u https://target.com/FUZZ -fc 404
```

### Common ports to scan first

```
21   FTP        53   DNS        139  NetBIOS    993  IMAPS
22   SSH        80   HTTP       143  IMAP       995  POP3S
23   Telnet     110  POP3       443  HTTPS      3306 MySQL
25   SMTP       111  RPC        445  SMB        3389 RDP
```

### What each tool is best at

| Tool | Best for |
|------|----------|
| `ping` | "Is it alive?" |
| `traceroute` | Network path |
| `nmap` | Port scanning, service detection, OS fingerprinting |
| `nc / telnet` | Manual banner grabbing |
| `dig / nslookup` | DNS queries |
| `subfinder / amass` | Subdomain enumeration |
| `Wappalyzer / whatweb` | Web tech fingerprinting |
| `nikto` | Web vulnerability scanning |
| `sqlmap` | SQL injection testing |
| `ffuf / gobuster` | Directory/file/parameter fuzzing |
| `smtp-user-enum` | SMTP user enumeration |

---

## 14. Mindset

> Recon is 80% of the work in any engagement.

The better you understand your target, the more accurate your attack (or defense) will be. **Document everything**:

- Every IP, hostname, port
- Every service + version
- Every interesting URL or parameter
- Every screenshot of an admin panel
- Every odd response

Pentesters who skip recon end up randomly throwing exploits at things. Skilled ones know **exactly** which weak spot to target before they even launch the attack.

**Three rules:**

1. **Get authorization in writing** before scanning anything you don't own
2. **Be methodical** — recon → enumeration → vulnerability → exploit
3. **Document as you go** — you'll forget details by the end of the day
