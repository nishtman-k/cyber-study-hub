# Passive Reconnaissance Tools

> **⚠️ AUTHORIZED USE ONLY.** This material is for education and authorized security testing. Reconnaissance against systems you do not own or lack **explicit written permission** to test may be illegal in your jurisdiction. Passive techniques carry lower risk than active ones, but aggregating personal data and querying certain sources still carry legal and privacy obligations. You are solely responsible for how you use this. See the [Legal and Terms of Use](/legal) page.

> **Scope:** Gathering information about a target **without sending traffic to target-controlled infrastructure**. Structured as a workflow: where to start, what to run, and what to reach for when a tool comes up short.

---

## Table of Contents
- [The Passive vs Active Boundary](#the-passive-vs-active-boundary)
- [Workflow Overview](#workflow-overview)
- [Scenario](#scenario)
- [Stage 1: Domain and Ownership](#stage-1-domain-and-ownership)
- [Stage 2: DNS Intelligence](#stage-2-dns-intelligence)
- [Stage 3: Subdomain Discovery](#stage-3-subdomain-discovery)
- [Stage 4: Infrastructure and Exposed Services](#stage-4-infrastructure-and-exposed-services)
- [Stage 5: People, Emails, and Credentials](#stage-5-people-emails-and-credentials)
- [Stage 6: Content, Code, and Metadata](#stage-6-content-code-and-metadata)
- [Stage 7: Correlation](#stage-7-correlation)
- [Tool Fallback Reference](#tool-fallback-reference)
- [Operational Notes](#operational-notes)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. The Passive vs Active Boundary

The dividing rule used throughout this material:

> **Passive:** no packets originate from your machine to infrastructure the target controls. Information comes from third parties, public records, and archives.
> **Active:** your machine interacts directly with the target's systems.

Passive reconnaissance is effectively undetectable by the target, because the target's own logs never record you. You are querying registries, search engines, certificate logs, and databases that other parties populated.

### The grey zone

The boundary is not always clean. These cases cause the most confusion:

| Activity | Classification | Reason |
|----------|---------------|--------|
| Viewing the target's website in a browser | Treated as passive | Indistinguishable from normal visitor traffic, though it does touch their server |
| WHOIS and DNS lookups via public resolvers | Passive | The query goes to a registry or public resolver, not the target |
| Querying Shodan or Censys | Passive **for you** | Those services did the active scanning earlier; you only read their stored results |
| `theHarvester` | Mostly passive | Most modules query third parties, but some data sources touch the target |
| Certificate transparency search | Passive | Public append-only logs, no target contact |
| DNS zone transfer attempt | **Active** | Connects directly to the target's name server |
| Subdomain brute-force | **Active** | Generates DNS queries resolved against target infrastructure |

**When uncertain, treat it as active** and confirm you are authorized before proceeding. The cost of misclassifying is asymmetric: calling something active when it was passive wastes a moment, the reverse can be unauthorized access.

## 2. Workflow Overview

Passive recon expands outward from a single seed. Each stage produces selectors that feed the next.

```text
Seed (domain, company name, or email)
    │
    ▼
[1] Domain & ownership      whois, registries → registrant, dates, nameservers
    │
    ▼
[2] DNS intelligence        dig, passive DNS → mail, hosting, services
    │
    ▼
[3] Subdomain discovery     crt.sh, subfinder → attack surface expands
    │
    ▼
[4] Infrastructure          Shodan, Censys, ASN → exposed services, IP ranges
    │
    ▼
[5] People & credentials    theHarvester, HIBP → emails, names, breach exposure
    │
    ▼
[6] Content & metadata      dorks, archives, ExifTool → documents, secrets
    │
    ▼
[7] Correlation             build the map, assign confidence
```

**The guiding principle:** exhaust passive sources before touching anything active. Everything above generates no traffic to the target, so it costs nothing in detection risk and can be done before authorization for active testing is even granted.

## 3. Scenario

**A worked passive engagement.** You are authorized to assess the external footprint of `example-corp.com`. Active testing is not yet approved, so this entire stage is passive. The objective is to map the attack surface an adversary could see before sending a single packet to the company.

Each stage below carries this scenario forward, showing the command, what it reveals, and where to turn when the primary tool falls short.

## 4. Stage 1: Domain and Ownership

**Goal:** establish who owns the domain, when it was registered, and what name servers it uses.

### Primary: whois

```bash
whois example-corp.com
```

**Yields:** registrar, creation and expiry dates, name servers, and on corporate domains often the registrant organization. Registration date hints at how established the target is; expiry date can reveal domains at risk of lapse.

### When WHOIS is redacted

Privacy services now redact most registrant contact fields. What remains useful:

- **Registrar and name servers** are never redacted and reveal the DNS and hosting provider.
- **Dates** are almost always visible.
- **Registrant organization** on corporate domains is frequently left unredacted.

### Fallback chain

| If | Then try | Why |
|----|----------|-----|
| CLI `whois` is redacted or thin | **whois.domaintools.com**, **who.is** | Web services aggregate historical and cached registration data |
| You need historical ownership | **WhoisXML**, **DomainTools history** | Shows registrant before privacy redaction was applied |
| You want ownership across many domains | **Reverse WHOIS** (ViewDNS) | Finds other domains registered by the same entity |
| The domain is a ccTLD | The relevant **national registry** | Some ccTLDs are not in generic WHOIS and have their own lookup |

**Scenario result:** `example-corp.com` was registered in 2016, uses a well-known managed DNS provider's name servers, and the registrant organization reads "Example Corp Holdings," a name that becomes a new selector for company-level searches.

## 5. Stage 2: DNS Intelligence

**Goal:** map the domain's DNS records to reveal mail, hosting, and third-party services. Public-resolver lookups are passive because the query goes to a resolver, not the target.

### Primary: dig

```bash
dig example-corp.com A              # host address
dig example-corp.com MX             # mail servers, reveals the mail provider
dig example-corp.com TXT            # SPF, DMARC, service verification records
dig example-corp.com NS             # authoritative name servers
dig example-corp.com CNAME          # aliases pointing to third-party services
```

**High-value target: TXT records.** SPF and DMARC entries list every service permitted to send mail as the domain, and verification records (`google-site-verification`, `MS=`, and similar) disclose which SaaS platforms the organization uses.

### Fallback chain

| If | Then try | Why |
|----|----------|-----|
| `dig` is unavailable | **nslookup**, **host** | Present on nearly every system |
| You want it all at once, visually | **DNSDumpster**, **dnsenum** (passive mode) | Aggregated records plus a hosting map, no manual per-record queries |
| You need historical DNS | **SecurityTrails**, **passive DNS** providers | Shows infrastructure the target used previously, now removed |
| You want to see all records cleanly | **`dig example-corp.com ANY`** | One query, though many resolvers now refuse ANY |

**Note:** a **zone transfer** (`dig axfr`) would reveal every record at once but connects directly to the target's name server. That is **active** and belongs in the active recon workflow.

**Scenario result:** MX records point to a hosted email provider, indicating that platform is in use. A TXT verification record reveals a helpdesk SaaS. A CNAME on `status.example-corp.com` points to a third-party status-page service. Three external services identified, none by touching the target.

## 6. Stage 3: Subdomain Discovery

**Goal:** expand the attack surface by finding subdomains. This is where passive recon delivers the most, because organizations forget subdomains, and forgotten hosts are frequently the weakest.

### Primary: certificate transparency

Every TLS certificate ever issued is logged in public, append-only transparency logs. Searching them reveals subdomains, including internal and development hosts, with zero target contact.

```bash
curl -s "https://crt.sh/?q=%25.example-corp.com&output=json" | jq -r '.[].name_value' | sort -u
```

Or search `crt.sh` in a browser directly. This is often the single highest-yield passive source for subdomains.

### Secondary: passive aggregators

```bash
subfinder -d example-corp.com                       # many passive sources at once
amass enum -passive -d example-corp.com             # passive mode only, no brute-force
theHarvester -d example-corp.com -b crtsh,bing,duckduckgo
```

### Fallback chain

| If | Then try | Why |
|----|----------|-----|
| `crt.sh` yields little | **subfinder**, **amass -passive** | Pull from dozens of sources beyond certificate logs |
| Coverage still feels thin | **SecurityTrails**, **Netlas**, **Chaos** | Large historical subdomain datasets |
| You want maximum passive breadth | Run **subfinder + amass -passive + crt.sh** and merge | Each source has gaps; the union is far better than any one |
| Passive sources are exhausted | **DNS brute-force** (active, needs authorization) | Only after passive is done, and only if in scope |

> **The boundary reminder:** everything above is passive. The moment you brute-force subdomains against the target's DNS, you have crossed into active reconnaissance. Confirm authorization first.

**Scenario result:** merging `crt.sh`, `subfinder`, and `amass -passive` produces 34 unique subdomains, including `dev.example-corp.com`, `vpn.example-corp.com`, and `legacy-api.example-corp.com`. The dev and legacy hosts are immediate points of interest, discovered without a single packet reaching the company.

## 7. Stage 4: Infrastructure and Exposed Services

**Goal:** learn what services are exposed and which IP ranges the target owns, using databases populated by others' scanning.

### Primary: Shodan and Censys

These services continuously scan the internet and store the results. Querying them is passive **for you**, since the scanning already happened.

```text
Shodan queries:
  org:"Example Corp"                organization-owned hosts
  ssl:"example-corp.com"            hosts presenting the target's certificate
  hostname:example-corp.com         hosts with matching hostname
  net:203.0.113.0/24                a specific range
```

**Yields:** open ports, service banners, software versions, and sometimes screenshots, all without scanning the target yourself.

### Establishing owned IP ranges

```bash
whois 203.0.113.10                  # which organization and ASN owns this IP
```

Knowing the true netblocks and ASN defines the real perimeter and, critically, prevents later active testing from straying out of scope onto a shared-hosting neighbor.

### Fallback chain

| If | Then try | Why |
|----|----------|-----|
| Shodan coverage is thin | **Censys**, **ZoomEye**, **Netlas** | Different scan engines see different hosts |
| You need the ASN and ranges | **bgp.he.net**, **ipinfo.io**, **asnlookup** | Maps an organization to its owned IP blocks |
| You want other domains on an IP | **Reverse IP** (ViewDNS, SecurityTrails) | Finds co-hosted sites, indicating shared hosting or related properties |
| Free-tier limits are hit | Authenticated API keys, or space out queries | Most of these services rate-limit anonymous use |

**Scenario result:** Shodan shows `legacy-api.example-corp.com` exposing an outdated service version on a non-standard port. ASN lookup confirms the company owns a small netblock, while the main site sits behind a CDN. This matters: the CDN-fronted addresses are not the origin, so any future active testing must target the confirmed origin ranges, not the CDN.

## 8. Stage 5: People, Emails, and Credentials

**Goal:** identify personnel, derive the email format, and check breach exposure.

### Primary: theHarvester

```bash
theHarvester -d example-corp.com -b all
theHarvester -d example-corp.com -b bing,duckduckgo,crtsh -l 500
```

**Yields:** email addresses, employee names, and hostnames collected from search engines and public sources.

### Deriving the email format

A few confirmed addresses reveal the pattern, letting the rest be inferred:

| Pattern | Example |
|---------|---------|
| `first.last@` | jane.doe@example-corp.com |
| `finitial.last@` | jdoe@example-corp.com |
| `first@` | jane@example-corp.com |

### Breach exposure

```text
Have I Been Pwned:  check an address or the whole domain for breach appearances
```

Exposure indicates credentials for that identity are circulating, which is directly relevant to credential-based attack risk. **Checking exposure is passive. Using any exposed credential is illegal.**

### Fallback chain

| If | Then try | Why |
|----|----------|-----|
| `theHarvester` returns little | **hunter.io**, **phonebook.cz** | Dedicated email-discovery databases |
| You need names and roles | **LinkedIn** (via search), job postings | Personnel, structure, and the technology stack from hiring requirements |
| You want breach detail | **HIBP domain search**, **DeHashed** | Domain-wide exposure across many accounts |
| Username pivoting is needed | **Sherlock**, **WhatsMyName** | Links a handle across platforms |

**Scenario result:** the format is confirmed as `first.last@`. Three staff addresses appear in historical breaches. A LinkedIn search reveals the company is hiring for a specific cloud platform administrator, confirming that platform is in use, another piece of stack intelligence gathered passively.

## 9. Stage 6: Content, Code, and Metadata

**Goal:** find exposed documents, leaked secrets, and revealing metadata through search engines and archives.

### Primary: search engine dorking

```text
site:example-corp.com filetype:pdf                     documents for metadata extraction
site:example-corp.com (filetype:xlsx OR filetype:docx) spreadsheets and documents
site:example-corp.com intitle:"index of"               open directory listings
site:example-corp.com inurl:(login OR admin OR portal) authentication endpoints
site:github.com "example-corp.com"                     code mentioning the domain
site:pastebin.com "example-corp.com"                   leaked content references
"@example-corp.com" -site:example-corp.com             addresses referenced elsewhere
```

Querying a search engine's index is passive. The search engine already crawled the content.

### Metadata extraction

Once documents are collected, extract embedded metadata:

```bash
exiftool report.pdf
exiftool -Author -Creator -Software -Company *.pdf     bulk across files
```

**Yields:** internal usernames, software versions, internal file paths, and sometimes device or location data.

### Archives and code history

| Source | Value |
|--------|-------|
| **Wayback Machine** | Removed content, old staff pages, previous technology references |
| **GitHub / GitLab search** | Hardcoded credentials, internal hostnames, API keys in public repos |
| **Git commit history** | Secrets removed in a later commit remain fully retrievable in history |

### Fallback chain

| If | Then try | Why |
|----|----------|-----|
| Google limits or captchas you | **Bing**, **DuckDuckGo** | Different indexes, different exposure, no captcha friction |
| You want catalogued dork patterns | **Google Hacking Database (GHDB)** | Curated queries organized by what they expose |
| You need repo secret scanning | **trufflehog**, **gitleaks** on a public clone | Automated detection of secrets in history |
| Live content was removed | **Wayback Machine**, **Google cache** | Retains what the owner deleted |

**Scenario result:** a public PDF's metadata reveals the internal username format and a file server path. A GitHub search surfaces a developer's personal repo containing a hardcoded staging credential. Both found without contacting the company.

## 10. Stage 7: Correlation

**Goal:** turn scattered findings into a structured map with confidence levels.

Passive recon produces fragments across seven stages. Correlation assembles them into an attack surface picture and flags what matters.

- **Map relationships.** Connect subdomains to IPs, IPs to services, people to roles, documents to internal paths.
- **Assign confidence.** A subdomain confirmed by both certificate logs and passive DNS is high confidence. A single-source finding is not.
- **Date everything.** A breach from years ago or a subdomain that no longer resolves may be stale.
- **Identify priority targets.** The dev, legacy, and VPN hosts stand out as the weakest and most valuable pivots.

### Tool: Maltego

Maltego graphs entities and their relationships, with transforms that pivot automatically from one to related ones. It is the standard for visualizing how the fragments connect, and it turns a list into a picture.

**Scenario conclusion:** the passive engagement, run without a single packet reaching `example-corp.com`, produced a registrant identity, the DNS and mail configuration, three external SaaS services, 34 subdomains, an exposed outdated service on a legacy host, the email format, breached staff accounts, the internal username convention, and a leaked staging credential. This is the map an attacker would build before doing anything detectable, and it is the correct handoff point to authorized active reconnaissance.

## 11. Tool Fallback Reference

Primary tool first, alternates in order of when to reach for them.

| Task | Primary | Fallback 1 | Fallback 2 |
|------|---------|-----------|-----------|
| Domain ownership | whois | who.is / DomainTools | Reverse WHOIS (ViewDNS) |
| DNS records | dig | nslookup / host | DNSDumpster / SecurityTrails |
| Historical DNS | SecurityTrails | passive DNS providers | Netlas |
| Subdomains | crt.sh | subfinder | amass -passive / Chaos |
| Exposed services | Shodan | Censys | ZoomEye / Netlas |
| ASN and IP ranges | bgp.he.net | ipinfo.io | asnlookup |
| Reverse IP | ViewDNS | SecurityTrails | Shodan |
| Emails and staff | theHarvester | hunter.io | phonebook.cz |
| Breach exposure | Have I Been Pwned | DeHashed | HIBP domain search |
| Username pivot | Sherlock | WhatsMyName | Maltego transforms |
| Documents and dorks | Google dorks | Bing / DuckDuckGo | GHDB |
| Metadata | ExifTool | (built in) | (built in) |
| Code and secrets | GitHub search | trufflehog | gitleaks |
| Archives | Wayback Machine | Google cache | archive.today |
| Correlation | Maltego | SpiderFoot | manual mapping |

## 12. Operational Notes

- **Exhaust passive before active.** Everything here is undetectable by the target. Do all of it before sending a single packet, and before you even need active-testing authorization.
- **No single subdomain source is complete.** Merge certificate logs, passive aggregators, and historical datasets. The union beats any one by a wide margin.
- **Certificate transparency is the highest-yield passive subdomain source,** because it is comprehensive, free, and includes internal hostnames.
- **Identify the CDN before mapping origins.** A CDN-fronted address is not the origin server. Confirm true owned ranges via ASN before any future active testing.
- **TXT records disclose the SaaS stack** through SPF entries and verification tokens.
- **Metadata is routinely underestimated.** Published documents leak usernames, software versions, and internal paths.
- **Repository history retains deleted secrets.** A credential removed later is still in the commit history.
- **Checking breach exposure is passive; using a credential is a crime.** The line is absolute.
- **Shodan and Censys are passive for you** but reflect earlier active scanning, so their data can be slightly stale. Recent changes may not appear.
- **Date every finding.** Passive sources are heavy with historical data that may no longer be true.
- **Public does not mean unregulated.** Aggregating personal data from public sources still carries data protection obligations.

## 13. Fast Recall

- **Passive = no packets to target infrastructure.** Information comes from third parties, registries, and archives. Effectively undetectable.
- **Grey zone:** viewing the site is treated as passive; zone transfer and subdomain brute-force are active. When unsure, treat as active.
- **Workflow:** ownership → DNS → subdomains → infrastructure → people → content → correlation.
- **whois** for ownership. Registrar, dates, and name servers survive privacy redaction.
- **dig** for DNS. **TXT records** reveal the SaaS stack; **MX** reveals the mail provider.
- **crt.sh (certificate transparency)** is the top passive subdomain source. Merge with **subfinder** and **amass -passive**.
- **Shodan and Censys** show exposed services passively, since they did the scanning.
- **ASN lookup** establishes true owned IP ranges and distinguishes origin from CDN.
- **theHarvester** for emails and staff; derive the email format from a few confirmed addresses.
- **Have I Been Pwned** for breach exposure. Checking is legal; using credentials is not.
- **Google dorks** find exposed documents; **ExifTool** extracts their metadata.
- **GitHub search and git history** leak hardcoded secrets, including deleted ones.
- **Maltego** correlates the fragments into a relationship map.
- **Exhaust passive first.** The handoff to active recon comes only after the passive map is complete and authorization is confirmed.

## 14. Resources

**DNS and domain**
- [crt.sh Certificate Transparency](https://crt.sh/)
- [DNSDumpster](https://dnsdumpster.com/)
- [SecurityTrails](https://securitytrails.com/)
- [ViewDNS.info](https://viewdns.info/)
- [bgp.he.net (ASN lookup)](https://bgp.he.net/)

**Infrastructure databases**
- [Shodan](https://www.shodan.io/)
- [Censys](https://search.censys.io/)
- [ZoomEye](https://www.zoomeye.org/)
- [Netlas](https://netlas.io/)

**Tools**
- [theHarvester](https://github.com/laramies/theHarvester)
- [subfinder](https://github.com/projectdiscovery/subfinder)
- [Amass](https://github.com/owasp-amass/amass)
- [Sherlock](https://github.com/sherlock-project/sherlock)
- [ExifTool](https://exiftool.org/)
- [SpiderFoot](https://github.com/smicallef/spiderfoot)
- [Maltego](https://www.maltego.com/)
- [trufflehog](https://github.com/trufflesecurity/trufflehog)
- [gitleaks](https://github.com/gitleaks/gitleaks)

**People and exposure**
- [Have I Been Pwned](https://haveibeenpwned.com/)
- [hunter.io](https://hunter.io/)

**Search and archives**
- [Google Hacking Database](https://www.exploit-db.com/google-hacking-database)
- [Wayback Machine](https://web.archive.org/)

---
