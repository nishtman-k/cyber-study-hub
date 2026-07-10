# Passive Reconnaissance

---

## 1. What is Passive Reconnaissance?

**Passive reconnaissance** is gathering information about a target **without directly interacting with it**. You learn about the target by querying third-party sources, public records, and search engines — the target never sees you.

### Passive vs Active

| | **Passive** | **Active** |
|---|-------------|------------|
| **Interaction with target** | None — you query third parties | Direct — packets to target |
| **Target sees you?** | ❌ No | ✅ Yes (in logs) |
| **Speed** | Slow | Fast |
| **Detail** | Limited to public info | Detailed (ports, versions) |
| **Legal risk** | Low — public info | Higher (may need authorization) |
| **Detection risk** | Near zero | Real (IDS, firewall logs) |
| **Tools** | whois, Google, Shodan, dig | nmap, ping, sqlmap |

### Why start with passive?

- **You stay invisible** — target has no idea they're being researched
- **No legal exposure** — accessing public records is legal almost everywhere
- **Builds context** — you understand the target before active recon
- **Surprising amount of info** — owners, infrastructure, employee names, exposed services, leaked credentials

> Rule: passive recon FIRST, active recon AFTER. By the time you scan ports, you should already know who runs the target, what tech they use, and where their data leaks are.

---

## 2. The Reconnaissance Phase in the Kill Chain

The **Unified Kill Chain** describes the steps of a cyber attack:

```
1. RECONNAISSANCE   ← passive + active info gathering (you are here)
2. Weaponization    → craft an exploit
3. Delivery         → send the exploit
4. Exploitation     → execute it
5. Installation     → persistent access
6. C2               → command & control channel
7. Actions          → data theft, destruction, etc.
```

Recon is **the foundation**. A weak recon phase ruins the rest.

---

## 3. What Can We Learn About a Server?

Even before touching the target directly, public sources can reveal:

| Info | Source |
|------|--------|
| **Owner / company** | WHOIS records |
| **Registrar** | WHOIS |
| **Hosting provider** | DNS A/AAAA records, IP WHOIS |
| **IP address(es)** | DNS lookup |
| **Geographic location** | IP geolocation (ipinfo.io, ipgeolocation.io) |
| **Subdomains** | subfinder, crt.sh, DNS Dumpster |
| **Mail servers** | MX records |
| **Name servers** | NS records |
| **TLS certificates** | crt.sh (certificate transparency logs) |
| **Open services / banners** | Shodan, Censys |
| **Web stack** | Wappalyzer, BuiltWith |
| **Historical data** | Wayback Machine, DNS history sites |
| **Employee names / emails** | LinkedIn, hunter.io, social media |
| **Code / leaks** | GitHub, GitLab, Pastebin |

---

## 4. What Happens When You Type a URL and Hit Enter?

A simplified walkthrough:

```
You type:        www.example.com

1. Browser checks its DNS cache.
   Cached? → Skip to step 5.
   Not cached? → Continue.

2. OS asks the configured DNS resolver (e.g., 8.8.8.8):
   "What's the IP of www.example.com?"

3. The resolver works through the DNS hierarchy:
   - Root servers: "Ask .com servers"
   - .com TLD servers: "Ask example.com's authoritative name server"
   - example.com's NS: "It's 93.184.216.34"

4. Resolver returns 93.184.216.34 to your OS, which gives it to the browser.

5. Browser opens a TCP connection to 93.184.216.34:443.

6. TLS handshake: server presents certificate, client verifies.

7. Encrypted HTTPS request:  GET / HTTP/1.1, Host: www.example.com

8. Server responds with the page.

9. Browser parses HTML, fetches CSS/JS/images, renders.

10. Subsequent requests use cached DNS for ~TTL seconds.
```

Every step leaks information that recon can capture — DNS records, TLS certs, server banners, response headers.

---

## 5. WHOIS — Who Owns a Domain?

**WHOIS** is the public registry that records who owns a domain name. Defined in **RFC 3912**.

### What WHOIS reveals

- **Registrant** (the owner / organization)
- **Admin contact** (administrative person)
- **Tech contact** (technical contact)
- **Registrar** (the company they registered through)
- **Registration date / expiration date**
- **Name servers**
- Sometimes a physical address, phone, and email

### Modern privacy

Since GDPR (2018), most personal info is **redacted** for individuals — replaced with the registrar's privacy service. Corporate domains often still expose real owner info.

### Command-line WHOIS

```bash
# Install
sudo apt install whois

# Basic query
whois example.com

# IP WHOIS (find who owns an IP block)
whois 93.184.216.34

# Search by ASN (for big networks)
whois AS15169   # Google's ASN
```

### Online WHOIS tools

- `whois.com`
- `who.is`
- `viewdns.info`
- ICANN Lookup (`lookup.icann.org`)

### Useful WHOIS fields to grep

```bash
whois example.com | grep -iE "registrant|admin|tech|registrar|name server|creation|expir"
```

---

## 6. What is a DNS Server?

A **DNS server** translates human-readable domain names (`example.com`) to machine-readable IP addresses (`93.184.216.34`). It's the internet's phone book.

### Types of DNS servers

| Type | Role |
|------|------|
| **Recursive resolver** | Where your computer asks (your ISP, 8.8.8.8, 1.1.1.1) |
| **Root server** | Top of the hierarchy — knows TLD servers |
| **TLD server** | Knows which authoritative server handles each `.com`, `.org`, etc. |
| **Authoritative server** | The actual owner of a domain's records |

### Why DNS matters for recon

Every record type exposes different info — and DNS is **public by design**. Querying DNS is passive (you're asking a third-party DNS server, not the target).

---

## 7. DNS Record Types

| Record | Maps | Example |
|--------|------|---------|
| **A** | Hostname → IPv4 | `example.com → 93.184.216.34` |
| **AAAA** | Hostname → IPv6 | `example.com → 2606:2800:220:1::` |
| **CNAME** | Alias for another name | `www.example.com → example.com` |
| **MX** | Domain → mail servers | `example.com → mail.example.com (priority 10)` |
| **NS** | Domain → name servers | `example.com → ns1.example.com` |
| **TXT** | Arbitrary text | SPF, DKIM, domain verification |
| **PTR** | IP → hostname (reverse) | `34.216.184.93.in-addr.arpa → example.com` |
| **SOA** | Start of Authority | Admin email, refresh intervals |
| **SRV** | Service location | `_sip._tcp.example.com → server.example.com:5060` |
| **CAA** | Which CAs can issue certs | Restricts who can issue TLS certs for the domain |

### What each tells a recon analyst

| Record | Recon value |
|--------|-------------|
| A / AAAA | Where the website is hosted |
| MX | Email infrastructure (Google? Microsoft? Self-hosted?) |
| NS | DNS provider (Cloudflare? Route53? In-house?) |
| TXT | SPF/DKIM reveal which services send mail for this domain |
| CAA | Which certificate authority they use |

---

## 8. dig — The DNS Query Tool

`dig` (Domain Information Groper) is the standard tool for querying DNS records.

### Basic syntax

```bash
dig <domain> <record_type> @<dns_server>
```

### Common queries

```bash
dig example.com                  # default = A record + full info
dig example.com A                # IPv4 only
dig example.com AAAA             # IPv6
dig example.com MX               # mail servers
dig example.com NS               # name servers
dig example.com TXT              # text records (SPF/DKIM/etc)
dig example.com SOA              # admin info, timers
dig example.com any              # all records

# Reverse lookup (IP → name)
dig -x 93.184.216.34
```

### Use a specific DNS server

```bash
dig @8.8.8.8 example.com         # via Google's DNS
dig @1.1.1.1 example.com         # via Cloudflare
dig @ns1.example.com example.com # via the authoritative server itself
```

### Cleaner output

```bash
dig +short example.com                    # just the IP
dig +short example.com MX                 # just MX records
dig +noall +answer example.com any        # only the answer section
dig +noall +answer any example.com @8.8.8.8   # full, clean
```

### Zone transfer (rarely works on modern DNS)

```bash
# Find name servers
dig +short NS example.com

# Try a zone transfer
dig axfr @ns1.example.com example.com
```

A successful zone transfer dumps **the entire DNS zone** — every record at once. Huge win, but most servers block this.

---

## 9. nslookup — The Classic DNS Tool

Older than `dig`, still widely used. Available on Windows, macOS, and Linux.

### Interactive mode

```bash
nslookup
> set type=MX
> example.com
> server 8.8.8.8
> example.com
> exit
```

### Single-command mode

```bash
nslookup example.com                # default A record
nslookup -type=MX example.com       # mail servers
nslookup -type=any example.com 8.8.8.8   # all records via Google DNS
nslookup -type=PTR 93.184.216.34   # reverse lookup
```

### dig vs nslookup

| | **dig** | **nslookup** |
|---|---------|--------------|
| **Best for** | Detailed forensic queries | Quick lookups |
| **Output** | Verbose, structured | Shorter |
| **Available on** | Linux, macOS | Linux, macOS, Windows |
| **Modern recommendation** | ✅ Preferred | Still works fine |

Both query the same DNS — different tools, same data.

---

## 10. Subdomain Enumeration

Companies often have many subdomains: `mail.example.com`, `dev.example.com`, `staging.example.com`. These are recon goldmines because dev/staging environments often have weaker security.

### Methods (all passive)

| Method | Tool / Source | What it does |
|--------|---------------|--------------|
| **Search engine queries** | Google dorks | `site:*.example.com -site:www.example.com` |
| **Certificate transparency** | `crt.sh` | Every TLS cert ever issued (public log) |
| **Passive DNS** | DNSDumpster, SecurityTrails | Historical DNS data |
| **OSINT aggregators** | Subfinder, Amass | Combine many sources |
| **Search engines** | Shodan, Censys | Cross-reference with services |

### subfinder — the modern standard

```bash
# Install
sudo apt install subfinder

# Basic enumeration (passive — uses many public APIs)
subfinder -d example.com -silent

# Save to file
subfinder -d example.com -silent -o subs.txt

# With IPs
subfinder -d example.com -silent -ip -nW

# More verbose / specific sources
subfinder -d example.com -all -sources crtsh,virustotal,wayback
subfinder -d example.com -list domains.txt   # multiple domains
```

Subfinder pulls from dozens of sources — none of which touch the target.

### crt.sh — certificate transparency

Every TLS certificate issued is recorded in **public certificate transparency logs**. You can search them:

```bash
# Get all certs for a domain (passive — query the log, not the target)
curl -s "https://crt.sh/?q=%.example.com&output=json" | jq -r '.[].name_value' | sort -u
```

This reveals subdomains that someone got a cert for — including internal/dev names that aren't otherwise public.

### Other tools

```bash
# amass — comprehensive (slower, more sources)
amass enum -passive -d example.com

# assetfinder — fast Go tool
assetfinder example.com

# Sublist3r — older Python tool
sublist3r -d example.com
```

---

## 11. DNSDumpster — Visual DNS Recon

**DNSDumpster** is a free website (`dnsdumpster.com`) that gathers DNS information about a domain and visualizes it.

### What it gives you

- Subdomains
- DNS server map
- MX records and mail server map
- TXT records
- IP ranges + ASN
- Hosting / geographic info
- Interactive network map showing relationships

### How to use it

1. Visit `dnsdumpster.com`
2. Enter the domain
3. Click "Search"
4. Review the map, table of hosts, and downloadable Excel report

### Why it's useful

- **Visual** — easier to spot relationships
- **Pulls from passive sources** — target never knows
- **Free** — generous query limits
- **Export to Excel / map image** — great for reports

It's effectively `subfinder` + DNS lookups + visualization, all in a browser.

---

## 12. Shodan.io — The Search Engine for Devices

**Shodan** continuously scans the internet, indexes every reachable service, and lets you search it. Think of it as **Google for connected devices**.

### What you can find

- All servers running a specific software version
- Webcams accessible without password
- Industrial control systems (SCADA)
- Routers with default credentials
- Misconfigured databases (MongoDB, Elasticsearch, Redis)
- Specific countries' exposed services

### Basic searches

```
apache                          all Apache servers
country:"FR"                    only France
city:"Paris"                    Paris only
port:22                         SSH only
hostname:example.com            this domain
org:"Google"                    Google's IP space
"default password"              banners containing that text
product:"OpenSSH" version:7.4   specific version
ssl.cert.issuer:"Let's Encrypt"  certs from Let's Encrypt
```

### Combine filters

```
apache country:"DE" port:80 -title:"403"
```

Apache on port 80 in Germany, **excluding** sites with 403 in the title.

### Command-line Shodan

```bash
# Install
pip install shodan

# Initialize with API key
shodan init YOUR_API_KEY

# Search
shodan search "apache country:FR"
shodan host 93.184.216.34
shodan count "product:OpenSSH"
```

### Why this is passive

You're searching Shodan's **pre-existing scan data** — not scanning the target yourself. The target doesn't see any of your queries.

### Related search engines

| Service | Speciality |
|---------|-----------|
| **Censys** (censys.io) | Similar to Shodan, strong cert search |
| **ZoomEye** | Chinese equivalent |
| **BinaryEdge** | Real-time scanning |
| **FOFA** | Asian focus |
| **GreyNoise** | Identifies internet "noise" sources |

---

## 13. Google Dorking — Search Operators

**Google Hacking** (or Dorking) uses advanced search operators to find specific information that Google has indexed about a target.

### Useful operators

| Operator | What it does |
|----------|-------------|
| `site:example.com` | Only results from this domain |
| `-site:www.example.com` | Exclude this domain |
| `inurl:admin` | URL contains "admin" |
| `intitle:"index of"` | Page title contains this |
| `intext:"password"` | Page body contains this |
| `filetype:pdf` | Only PDF files |
| `ext:sql` | Only files with .sql extension |
| `cache:example.com` | Google's cached version |
| `"exact phrase"` | Exact match |
| `*` | Wildcard |

### Real-world recon examples

```
site:example.com filetype:pdf                  # exposed PDFs
site:example.com inurl:admin                    # admin pages
site:example.com intitle:"index of"             # open directory listings
site:example.com intext:"api_key"               # leaked API keys
site:*.example.com -www                         # subdomains
"example.com" filetype:env                      # exposed .env files
site:github.com "example.com" password          # leaked creds on GitHub
site:pastebin.com "example.com"                 # leaks on Pastebin
```

### Google Hacking Database (GHDB)

Exploit-DB maintains a database of dorks at `exploit-db.com/google-hacking-database`. Categories include:
- Files containing usernames / passwords
- Sensitive directories
- Vulnerable servers
- Error messages
- Login portals

### Other search engines

Don't only use Google — different engines index different things:
- `duckduckgo.com`
- `bing.com`
- `yandex.com` (sometimes shows what others hide)
- `kagi.com`

---

## 14. Other Passive OSINT Sources

### People / employees

| Source | What you find |
|--------|---------------|
| **LinkedIn** | Employee names, roles, tech stack mentioned in jobs |
| **theHarvester** | Aggregates emails / names from public sources |
| **hunter.io** | Email patterns and verified addresses |
| **email-format.com** | How a company structures emails |

```bash
sudo apt install theharvester

theHarvester -d example.com -l 500 -b google
theHarvester -d example.com -l 500 -b linkedin
```

### Historical / archived data

| Source | What you find |
|--------|---------------|
| **Wayback Machine** (`web.archive.org`) | Past versions of websites |
| **archive.today** | On-demand snapshots |
| **SecurityTrails** | DNS history |
| **DNSdb** | Historical DNS records |

### Code / leaks

| Source | What you find |
|--------|---------------|
| **GitHub** | Accidentally committed secrets, internal URLs |
| **GitLab** | Same |
| **Pastebin / GitHub Gist** | Data dumps, leaks |
| **HaveIBeenPwned** | Whether emails appeared in breaches |

```bash
# Search GitHub for leaks
# Use the search box: "example.com" password
# Or: "example.com" api_key
# Or: org:example   filename:.env
```

### Infrastructure

| Source | What you find |
|--------|---------------|
| **BuiltWith** | Web tech stack |
| **Wappalyzer** (extension) | Same, browser-based |
| **BGPView** | IP ranges and ASN data |
| **Hurricane Electric** (`bgp.he.net`) | Routing info |

---

## 15. A Typical Passive Recon Workflow

A clean OSINT workflow against an authorized target:

```
1. Domain ownership
   whois example.com
   → registrar, contacts, dates

2. Map DNS
   dig example.com any +noall +answer @8.8.8.8
   dig example.com TXT @8.8.8.8
   dig example.com MX @8.8.8.8
   → IPs, mail infrastructure, SPF/DKIM hints

3. Discover subdomains
   subfinder -d example.com -silent | tee subs.txt
   curl -s "https://crt.sh/?q=%.example.com&output=json" | jq -r '.[].name_value' | sort -u >> subs.txt
   sort -u subs.txt > subs_unique.txt
   → list of every public subdomain ever seen

4. Cross-reference with Shodan
   shodan search "hostname:example.com"
   → exposed services + versions

5. Look for leaks / archived data
   site:github.com "example.com" password
   web.archive.org/web/*/example.com
   → leaked creds, old config

6. Identify people
   theHarvester -d example.com -b google,linkedin
   → emails, names, roles

7. Visual map
   dnsdumpster.com → review and export

8. Document findings
   Build a profile: owner, infra, employees, exposed assets, weak spots
```

By the time you start active recon, you already know **where to focus**.

---

## 16. Tools Cheat Sheet

```bash
# WHOIS
whois example.com

# DNS
dig example.com any +noall +answer @8.8.8.8
dig -x 93.184.216.34
nslookup -type=MX example.com 8.8.8.8

# Subdomains
subfinder -d example.com -silent -o subs.txt
amass enum -passive -d example.com
curl -s "https://crt.sh/?q=%.example.com&output=json" | jq -r '.[].name_value' | sort -u

# Search engines
# Browser: shodan.io, censys.io, dnsdumpster.com, web.archive.org, crt.sh

# Email / people OSINT
theHarvester -d example.com -b all

# Google dorking — use the browser
# site:example.com filetype:pdf
# site:example.com inurl:admin
```

### One-liner combos

```bash
# Get every public subdomain, dedupe, save
{
  subfinder -d example.com -silent
  curl -s "https://crt.sh/?q=%.example.com&output=json" | jq -r '.[].name_value'
  amass enum -passive -d example.com
} | sort -u > subdomains.txt

# Resolve which subdomains are actually alive (technically active but minimal)
cat subdomains.txt | httpx -silent -status-code
```

---

## 17. What Passive Recon Can NOT Tell You

Useful boundaries:

- ❌ **Whether a port is open RIGHT NOW** — that needs active scanning
- ❌ **The exact version of a service** — banner grabbing is active
- ❌ **What's behind a login page** — needs authenticated testing
- ❌ **Internal network topology** — that's behind the firewall
- ❌ **Real-time application state** — only public data is searchable

Passive recon paints the **outline**. Active recon fills in the **details**.

---

## 18. Quick Reference

### Three questions passive recon answers

1. **Who?** — owner, employees, organization, contacts
2. **What?** — infrastructure, technology, subdomains, services
3. **Where?** — IPs, hosting providers, geographic location

### Mental model

> Passive recon = reading the target's public footprint.
> Active recon = touching them and seeing how they respond.

### Difference summary

| | **Passive** | **Active** |
|---|-------------|------------|
| **Sends packets to target?** | No | Yes |
| **Detected by target?** | No | Yes (likely) |
| **Legal risk** | Low | Higher |
| **Speed** | Slow | Fast |
| **Tools** | whois, dig, subfinder, Shodan, Google | nmap, sqlmap, nc, telnet |
| **Order in engagement** | First | Second |

### Three rules

1. **Always do passive recon first.** Cheap, invisible, surprisingly revealing.
2. **Document everything.** Domains, IPs, emails, subdomains, versions.
3. **Cross-reference sources.** One tool gives partial info — combining them gives the full picture.
