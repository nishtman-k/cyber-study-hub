# OSINT Profile Builder

> `Data is everywhere, yet intelligence is knowing what to do with it.`

> **Scope:** Collecting, validating, and reporting open-source intelligence. Covers the fundamentals, the legal and ethical boundaries, profiling methodology, search and technical collection, correlation and confidence, and how OSINT maps to both attack and defense.

---

## Table of Contents
- [Core Vocabulary](#core-vocabulary)
- [OSINT Fundamentals](#osint-fundamentals)
- [Ethics and Legal Boundaries](#ethics-and-legal-boundaries)
- [Target Profiling](#target-profiling)
- [Search and Discovery](#search-and-discovery)
- [Identity and Social Media Intelligence](#identity-and-social-media-intelligence)
- [Technical OSINT](#technical-osint)
- [Metadata Analysis](#metadata-analysis)
- [Validation and Correlation](#validation-and-correlation)
- [OSINT in the Attack Chain](#osint-in-the-attack-chain)
- [Defensive OSINT](#defensive-osint)
- [Reporting and Documentation](#reporting-and-documentation)
- [Tool Reference](#tool-reference)
- [Operational Notes](#operational-notes)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Vocabulary

| Term | Meaning |
|------|---------|
| **OSINT** | Intelligence produced from publicly and legally available information |
| **Open source** | Any information available to the general public without circumventing access controls |
| **Passive reconnaissance** | Gathering information without interacting with the target's systems |
| **Active reconnaissance** | Gathering information by directly interacting with target systems (scanning, probing) |
| **Digital footprint** | The total set of traces an entity leaves across public sources |
| **Attack surface** | The set of points where an unauthorized party could attempt entry |
| **Pivot** | Using one confirmed data point to discover another (username to email to domain) |
| **Selector** | A unique identifier used as a search anchor: email, username, phone, domain, hash |
| **Enrichment** | Adding context to a data point from additional sources |
| **Correlation** | Establishing that two data points refer to the same entity |
| **Confidence level** | A stated measure of how reliable a finding is |
| **False positive** | A correlation that appears valid but links unrelated entities |
| **OPSEC** | Operational security. Two applications: protecting the investigator's own identity and intent, and, for a subject, avoiding exposure of sensitive information through public behavior |
| **OPSEC failure** | Exposure of sensitive information through public behavior, such as a photograph disclosing a badge or a post revealing a travel window |
| **Metadata** | Data about data. Descriptive information embedded in a file that documents its origin, authorship, software, and history |
| **Data minimization** | Also called minimalism. Collecting only what the objective requires, and no more |
| **Scope** | The authorized boundary of an engagement, defining what may be collected |

**Information vs intelligence:**
Information is raw and unevaluated. Intelligence is information that has been verified, correlated, assessed for confidence, and made relevant to a specific question. A list of employee email addresses is information. An assessment that the finance team uses a predictable address format and three of its members appear in a credential breach is intelligence.

## 2. OSINT Fundamentals

### Definition

Open-Source Intelligence is the collection and analysis of publicly available information to produce actionable intelligence. The defining characteristic is not that the data is free, but that it is **legally accessible without authentication bypass or system compromise**. Paid commercial databases and subscription services still qualify as open source.

### The intelligence cycle

OSINT is a process, not a collection of tools.

| Phase | Purpose |
|-------|---------|
| **Direction** (also called planning and scoping) | Define the intelligence requirement and the authorized boundary. What question needs answering, and what is in scope? |
| **Collection** | Gather raw data from selected sources |
| **Processing** | Normalize, translate, deduplicate, and structure the data |
| **Analysis** | Correlate, evaluate, and assess confidence |
| **Dissemination** | Deliver findings to the requester in a usable form |
| **Feedback** | Refine requirements based on what the results revealed |

Skipping Direction is the most common failure. Collection without a defined requirement produces volume, not intelligence.

**Terminology note:** the first phase appears under several names depending on the source. **Direction**, **planning and scoping**, **planning and direction**, and **requirements** all describe the same phase. Whatever it is called, it comes first, and it is where scope is defined. Scoping before collection is what prevents ethical and legal violations, because it establishes what may be collected before any collection begins.

### Passive vs active reconnaissance

| | Passive (OSINT) | Active |
|---|-----------------|--------|
| **Interaction with target** | None, or only via third parties | Direct connection to target systems |
| **Detectability** | Very low, no logs on target infrastructure | High, appears in target logs and IDS |
| **Examples** | WHOIS lookup, certificate transparency, cached pages, social media review, breach databases | Port scanning, banner grabbing, vulnerability scanning, directory brute-forcing |
| **Authorization** | Generally lawful for public data | Requires explicit authorization |
| **Risk to investigator** | Minimal | Legal exposure without written permission |

The boundary is not always clean. Visiting a target's public website is technically an interaction that appears in their logs, but is universally treated as passive because it is indistinguishable from normal traffic. Running a subdomain brute-force against their DNS is active.

### Why OSINT matters

- **Attack surface discovery:** organizations frequently do not know what they have exposed. Forgotten subdomains, public storage, and stale DNS records are found through OSINT before any scan.
- **Threat modeling:** understanding what an adversary can learn about an organization defines the realistic starting point of an attack.
- **Cost asymmetry:** collection requires no exploitation and carries near-zero detection risk, making it the natural first phase of any operation.
- **Investigations and due diligence:** fraud, brand abuse, insider threat, and vendor risk assessment all depend on open sources.

### What qualifies as open source

| Category | Examples |
|----------|----------|
| **Public web** | Websites, blogs, forums, archived pages, cached content |
| **Social media** | Profiles, posts, connections, images, engagement patterns |
| **Government and legal** | Company registries, court filings, patents, procurement records, regulatory disclosures |
| **Technical registries** | WHOIS, DNS, BGP and ASN data, certificate transparency logs |
| **Commercial data** | Paid databases, marketing data, business intelligence platforms |
| **Media** | News, broadcast, press releases, conference talks |
| **Academic** | Papers, theses, research repositories |
| **Leaked or breached data** | Publicly circulating credential dumps (legally sensitive, see Section 3) |
| **Geospatial** | Satellite and street imagery, mapping data |

## 3. Ethics and Legal Boundaries

### What keeps OSINT lawful

OSINT is legal when it involves observing information that has been made publicly available, without deception that induces disclosure, and without circumventing any technical or contractual access control.

**The line is crossed by:**

| Action | Why it is prohibited |
|--------|---------------------|
| Using credentials found in a breach to log in | Unauthorized access, regardless of how the credentials were obtained |
| Bypassing authentication, paywalls, or rate limits | Circumvention of access controls |
| Accessing systems via exposed but unintended endpoints | Lack of authorization is what matters, not lack of a password prompt |
| Social engineering to elicit non-public information | Pretexting and deception, prohibited in most jurisdictions |
| Scraping in violation of terms of service | Contractual breach, and in some jurisdictions a computer misuse offence |
| Creating fake identities to gain private group access | Deceptive access to restricted content |
| Retaining personal data beyond the engagement need | Data protection violation |

### Relevant legal frameworks

| Framework | Jurisdiction | Relevance |
|-----------|-------------|-----------|
| **Computer Fraud and Abuse Act (CFAA)** | United States | Criminalizes unauthorized access to protected computers |
| **Computer Misuse Act** | United Kingdom | Unauthorized access and unauthorized modification offences |
| **GDPR** | European Union | Governs processing of personal data, including data collected from public sources |
| **Data protection law generally** | Most jurisdictions | Public availability does not remove processing obligations |

**A critical point on GDPR:** the fact that personal data is publicly visible does not make it free to process. Collecting, storing, and analyzing personal data still requires a lawful basis, and data subjects retain rights over it. Public does not mean unregulated.

### Authorization and scope

For any engagement against an organization, the following should be established in writing before collection begins:

- **Defined targets:** which domains, entities, and individuals are in scope.
- **Explicit exclusions:** systems, subsidiaries, and third parties that are out of scope.
- **Passive-only boundary:** whether any active interaction is permitted.
- **Handling requirements:** how findings are stored, encrypted, transmitted, and destroyed.
- **Escalation path:** what to do on discovering an active compromise or illegal material.
- **Retention period:** when collected data must be deleted.

Scope creep is the characteristic failure of OSINT work. A pivot from a corporate domain to an employee's personal social media to that employee's family members happens naturally through linked data and is frequently outside authorization.

### OSINT vs surveillance

| | OSINT | Surveillance |
|---|-------|-------------|
| **Temporality** | Point-in-time collection of existing data | Ongoing monitoring of a subject over time |
| **Subject** | Often organizational or infrastructural | Typically a specific individual |
| **Legal footing** | Lawful access to public information | Frequently requires legal authority or warrant |
| **Intent** | Answer a defined intelligence question | Track behavior and movement |

Sustained monitoring of a named individual, even using entirely public sources, becomes surveillance and carries different legal obligations. Aggregation is the mechanism: individually trivial public facts, combined, can produce a profile the subject never consented to and never made public.

### Responsible handling

- **Minimize:** collect only what the requirement demands. Do not gather family details, home addresses, or health information unless directly in scope and justified.
- **Secure:** encrypt findings at rest, restrict access, avoid personal devices and accounts.
- **Report, do not exploit:** discovering valid credentials means reporting them, never testing them.
- **Escalate immediately:** child exploitation material, evidence of active crime, or credible threat to life must be routed to appropriate authorities without further investigation.
- **Destroy on schedule:** delete collected personal data at the end of the retention period.

## 4. Target Profiling

### What an OSINT profile is

A structured compilation of verified, sourced findings about a target, assembled to answer a specific intelligence question. It is not an unfiltered data dump. Every entry carries a source, a collection date, and a confidence level.

**Typical profile contents:** identity information, organizational role and affiliations, public infrastructure and domains, digital footprint across platforms, and relationship mapping between entities.

**What does not belong in a profile:** private credentials. Passwords, session tokens, and API keys are not open-source intelligence even when they appear in a public breach dump. Their presence in a profile serves no analytical purpose, creates legal and data protection exposure for the investigator, and invites unauthorized use. The correct handling is to record that an identity appears in a breach, without recording the credential itself, and to report the exposure through the agreed channel.

### Target types and typical collection

| Target type | Typical objectives | Primary sources |
|-------------|-------------------|-----------------|
| **Individual** | Identity confirmation, role, affiliations, digital footprint, exposure | Social media, breach data, public records, username enumeration |
| **Organization** | Structure, personnel, technology stack, suppliers, exposed assets | Corporate registries, job postings, LinkedIn, press, filings |
| **Domain** | Ownership, history, subdomains, mail configuration, associated infrastructure | WHOIS, DNS, certificate transparency, passive DNS, archives |
| **Infrastructure** | IP ranges, hosting, ASN, exposed services, technology fingerprints | Shodan, Censys, BGP data, reverse DNS |

### The profile build sequence

1. **Define the requirement.** State the specific question the profile must answer.
2. **Seed.** Identify starting selectors: a domain, a name, an email, a username.
3. **Expand.** Pivot from each confirmed selector to discover new ones.
4. **Verify.** Confirm each finding against a second independent source.
5. **Correlate.** Establish which findings refer to the same entity, and record why.
6. **Assess.** Assign confidence to each conclusion.
7. **Report.** Present findings, evidence, confidence, and limitations.

### Common profiling mistakes

| Mistake | Consequence |
|---------|-------------|
| Collecting without a requirement | Volume with no answer, and unnecessary privacy intrusion |
| Assuming name matches equal identity matches | Wrong subject entirely, particularly with common names |
| Single-source acceptance | Propagating stale or fabricated data |
| Ignoring data age | Acting on employment, location, or infrastructure that changed years ago |
| Confirmation bias | Collecting only what supports an initial theory |
| Failing to record provenance | Findings become unusable in a report and unverifiable later |
| Treating absence as evidence | No result means not found, not that it does not exist |
| Scope creep through pivoting | Collection outside authorization |

## 5. Search and Discovery

### How indexing works

Search engines crawl links, parse content, and build an inverted index. Three consequences matter for OSINT:

- **Coverage is incomplete.** Content behind authentication, disallowed by `robots.txt`, or unlinked from anywhere is typically absent. Different engines index different subsets, so querying several is not redundant.
- **The index lags reality.** Cached copies and archives frequently retain content the owner has removed. Deletion from a site does not mean deletion from the record.
- **Exposure is often accidental.** `robots.txt` is a request, not a control, and the file itself reveals which paths the owner considers sensitive.

### Google search operators

| Operator | Function | Example |
|----------|----------|---------|
| `site:` | Restrict to a domain | `site:example.com` |
| `filetype:` | Restrict to a file extension | `filetype:pdf site:example.com` |
| `intitle:` | Term in page title | `intitle:"index of"` |
| `inurl:` | Term in URL | `inurl:admin` |
| `intext:` | Term in body text | `intext:"internal use only"` |
| `cache:` | Cached version of a page | `cache:example.com` |
| `related:` | Similar sites | `related:example.com` |
| `"exact phrase"` | Exact match | `"confidential"` |
| `-term` | Exclude | `site:example.com -www` |
| `OR` / `\|` | Alternation | `site:example.com (pdf OR docx)` |
| `*` | Wildcard | `"* @example.com"` |
| `..` | Numeric range | `2020..2024` |

**Practical query patterns:**

```text
site:example.com filetype:pdf                      Documents for metadata extraction
site:example.com -inurl:www                        Subdomains outside the main site
site:example.com intitle:"index of"                Directory listings
site:example.com (filetype:xls OR filetype:xlsx)   Spreadsheets, often containing internal data
site:linkedin.com/in "Example Corp"                Employee enumeration
site:pastebin.com "example.com"                    Leaked content mentioning the domain
site:github.com "example.com" password             Credentials in public repositories
"@example.com" -site:example.com                   Email addresses referenced elsewhere
site:example.com inurl:(login OR admin OR portal)  Authentication endpoints
```

The Google Hacking Database (GHDB) maintains a catalogued set of these patterns organized by what they expose.

### Archives and historical sources

| Source | Value |
|--------|-------|
| **Wayback Machine** | Historical page versions, removed content, previous staff listings, old technology references |
| **Google cache** | Recently removed content still served |
| **Certificate transparency logs** | Every certificate issued for a domain, revealing internal and development hostnames |
| **Passive DNS** | Historical DNS resolution, showing infrastructure changes over time |
| **Public code repositories** | Commit history retains secrets even after deletion from the current branch |

Version control history is a frequent source of exposure. A credential removed in a later commit remains fully retrievable in the repository history.

## 6. Identity and Social Media Intelligence

### Username correlation

Users reuse handles across platforms, which makes a username one of the strongest pivot selectors available.

```bash
sherlock username                      # search a username across hundreds of platforms
sherlock user1 user2 --timeout 5
sherlock username --site GitHub --site Reddit
```

**Correlation caution:** a matching username is a lead, not proof. Common handles are registered independently by unrelated people. Confirm with corroborating evidence: matching profile image, consistent biography, cross-linked accounts, shared contacts, or writing style. Never assert identity on handle match alone.

### Email as a selector

Organizations use predictable address formats. Establishing the pattern from a small number of confirmed addresses allows the rest to be inferred.

| Pattern | Example |
|---------|---------|
| `first.last@` | jane.doe@example.com |
| `finitial.last@` | jdoe@example.com |
| `first@` | jane@example.com |
| `first_last@` | jane_doe@example.com |

Breach exposure checking against a confirmed address indicates whether credentials for that identity are circulating, which is directly relevant to credential-based attack risk.

### Assessing account authenticity

Indicators that an account may be fabricated or disposable:

- Creation date recent relative to claimed history.
- Profile image that reverse-searches to a stock source or another person.
- Follower and following counts that are disproportionate or reciprocal-only.
- Activity confined to a narrow topic or timeframe.
- Biography details that do not corroborate against any independent source.
- Generic username patterns with appended digits.
- No engagement history predating a specific event.

### Organizational inference

Public professional profiles and job postings reveal more about an organization than most other sources combined:

- **Reporting structure** from titles and stated relationships.
- **Technology stack** from job requirements. A posting seeking a specific platform administrator confirms that platform is deployed.
- **Security posture** from security role postings, tooling requirements, and compliance mentions.
- **Growth and change** from hiring patterns and departures.
- **Physical footprint** from office locations and site-based roles.

### OPSEC failures in personal profiles

| Failure | Exposure created |
|---------|-----------------|
| Photographs including badges, screens, or whiteboards | Credentials, internal systems, physical access card design |
| Location metadata or geotagged posts | Residence, workplace, routine and movement patterns |
| Detailed role descriptions | Access level and system responsibility, useful for targeting |
| Publicly listed connections | Organizational chart reconstruction |
| Consistent handle reuse across contexts | Links professional identity to personal accounts |
| Answers to common security questions in posts | Pet names, schools, birthplaces, used in account recovery |
| Out-of-office and travel announcements | Absence windows, useful for pretexting and fraud |

## 7. Technical OSINT

### WHOIS

Registration data for domains and IP ranges. Registrant details are frequently redacted by privacy services, but the remaining fields retain value.

```bash
whois example.com
whois 93.184.216.34                    # IP allocation and responsible organization
```

Useful regardless of redaction: registrar, creation and expiry dates, name servers, and registrant organization on corporate domains, which is often not redacted.

### DNS enumeration

```bash
dig example.com ANY
dig example.com MX                     # mail infrastructure, reveals mail provider
dig example.com TXT                    # SPF, DMARC, and service verification records
dig example.com NS
dig -x 93.184.216.34                   # reverse lookup
host -t MX example.com
nslookup example.com
```

**Record types and what they reveal:**

| Record | Intelligence value |
|--------|-------------------|
| **A / AAAA** | Hosting location and provider |
| **MX** | Mail provider, indicating platform in use |
| **TXT** | SPF and DMARC policy, plus verification records disclosing third-party services in use |
| **NS** | DNS provider |
| **CNAME** | Third-party services and hosted platforms |
| **SOA** | Administrative contact, sometimes an internal address |

Zone transfers are misconfigurations that expose the entire zone, though rarely available on modern infrastructure:

```bash
dig axfr @nameserver example.com
```

### Subdomain discovery

Passive sources first, since they generate no target traffic:

- **Certificate transparency logs** (`crt.sh`) list every certificate issued, including for internal and development hostnames.
- **Passive DNS** providers hold historical resolution data.
- **Search engine enumeration** via `site:` with exclusions.

```bash
amass enum -passive -d example.com
subfinder -d example.com
theHarvester -d example.com -b crtsh,bing,duckduckgo
curl -s "https://crt.sh/?q=%25.example.com&output=json"
```

Brute-force subdomain discovery generates DNS queries against the target's infrastructure and should be treated as active reconnaissance.

### Email and personnel harvesting

```bash
theHarvester -d example.com -b all
theHarvester -d example.com -b linkedin
theHarvester -d example.com -b bing -l 500
```

Collects email addresses, hostnames, and employee names from search engines, certificate data, and public sources.

### Infrastructure mapping

| Source | Provides |
|--------|----------|
| **Shodan** | Internet-exposed services, banners, versions, screenshots |
| **Censys** | Certificate and host data, scan results |
| **BGP and ASN lookups** | IP ranges owned by an organization, upstream providers |
| **Reverse IP** | Other domains hosted on the same address, indicating shared hosting or related properties |

```text
Shodan query patterns:
  org:"Example Corp"
  ssl:"example.com"
  hostname:example.com
  net:93.184.216.0/24
  port:22 org:"Example Corp"
```

ASN and netblock data establishes which addresses an organization actually owns, which defines the true perimeter and prevents out-of-scope testing.

### Automated collection

```bash
spiderfoot -s example.com -m sfp_dnsresolve,sfp_whois,sfp_crt
spiderfoot -l 127.0.0.1:5001           # web interface
```

Automated platforms accelerate collection considerably but generate high false-positive volume. Output requires manual validation before entering a profile.

## 8. Metadata Analysis

**Metadata is data about data.** It is descriptive information embedded within a file that documents the file itself rather than its visible content: who created it, with which software, when, on what device, and from what location.

Documents and images published by an organization frequently retain metadata disclosing internal detail never intended for release. Rich, structured file formats such as **PDF, Office documents, and images** carry the most metadata, since their specifications provide dedicated fields for authorship, software, and device information. **Plain text files** carry almost none, as the format has no facility for it. **Encrypted archives and compiled binaries** expose little usable metadata, the former because the content is unreadable and the latter because build processes typically strip it.

```bash
exiftool document.pdf
exiftool -a -u -g1 image.jpg           # all tags, grouped
exiftool -r -ext pdf /path/to/files    # recursive across a directory
exiftool -GPS* image.jpg               # location tags only
exiftool -Author -Creator -Software *.docx
```

| Metadata field | Intelligence value |
|----------------|-------------------|
| **Author / Creator** | Employee names and internal username format |
| **Company / Organization** | Confirms document origin |
| **Software / Producer** | Application versions in use, indicating patch level |
| **Operating system** | Platform in use |
| **File paths** | Internal directory structure, server names, share names |
| **GPS coordinates** | Capture location of images |
| **Device make and model** | Hardware in use |
| **Creation and modification times** | Working hours and timezone |
| **Revision history** | Prior editors and, in some formats, deleted content |

A single organizational PDF frequently discloses the internal username convention, the software version, and an internal file server path. Collecting documents through `filetype:` queries and extracting metadata in bulk is a standard early collection step.

## 9. Validation and Correlation

### Why validation is mandatory

Open sources contain stale data, transcription errors, deliberate misinformation, and automated content that propagates errors across sites. An unverified finding presented as fact is an analytical failure regardless of how it was collected.

### Validation practice

- **Require two independent sources.** Two sites that both syndicate the same original are one source, not two.
- **Trace to origin.** Follow a claim back to its earliest appearance rather than accepting an aggregator.
- **Date every finding.** Record both the content date and the collection date. Employment, infrastructure, and affiliation change constantly.
- **Prefer authoritative sources.** Registries, filings, and technical records outrank secondary reporting.
- **Test the negative.** Actively seek evidence that would contradict the finding.

### Avoiding false positives

| Risk | Control |
|------|---------|
| Common name collision | Require a second distinguishing attribute before asserting identity |
| Username coincidence | Corroborate with content, image, or linked account evidence |
| Outdated record | Check the date and seek current confirmation |
| Shared hosting | Confirm ownership before attributing a co-hosted domain |
| Automated tool output | Manually verify before entering into a profile |
| Deliberate deception | Consider whether the target has reason to seed false information |

### Confidence levels

Every assessment should carry an explicit confidence statement.

| Level | Meaning |
|-------|---------|
| **High** | Multiple independent, authoritative sources agree; no significant contradiction |
| **Moderate** | Credible sourcing with some corroboration; plausible alternatives remain |
| **Low** | Single source, uncorroborated, or based primarily on inference |

The **Admiralty Code** provides a more granular convention, rating source reliability A to F and information credibility 1 to 6, producing ratings such as B2. It is worth recognizing in intelligence reporting contexts.

### Timelines and relationship mapping

Structuring findings makes patterns visible that a list obscures.

- **Timelines** establish sequence and expose gaps or contradictions in a narrative.
- **Link analysis** maps entities and the relationships between them, revealing central nodes and unexpected connections.

Maltego is the standard tool for entity and relationship graphing, with transforms that pivot automatically from one entity to related ones.

### Limitations of OSINT

Open sources have structural limits that no amount of collection effort removes. Stating them is part of competent reporting.

| Limitation | Implication |
|------------|-------------|
| **It cannot perfectly represent reality** | Open sources show only what has been published, indexed, and retained. The picture is always partial |
| **Attribution is not guaranteed** | Correlation establishes probability, not certainty. Shared handles, common names, and deliberate misdirection all defeat confident attribution |
| **Data is not necessarily current** | Records persist long after the underlying fact changes. Employment, infrastructure, and affiliation all move faster than the sources documenting them |
| **It does not replace active testing** | OSINT identifies what appears exposed. Only authorized active testing confirms whether an exposure is exploitable |
| **Absence of evidence is not evidence of absence** | A negative result means not found through the methods used, not that the thing does not exist |
| **Sources can be deliberately seeded** | A target aware of being investigated can publish false information |

The practical consequence is that every OSINT product should carry an explicit limitations section stating what was not covered, what remains uncertain, and where confidence is low.

## 10. OSINT in the Attack Chain

OSINT is the reconnaissance phase. Its output determines the realism and success rate of everything that follows.

| Attack activity | OSINT contribution |
|-----------------|-------------------|
| **Phishing** | Employee names, address format, roles, reporting lines, vendor relationships, and current events used to build a plausible pretext |
| **Spear phishing** | Individual interests, recent activity, and relationships enabling highly targeted lures |
| **Social engineering** | Internal terminology, project names, org structure, and staff absence windows supporting a convincing pretext |
| **Credential attacks** | Breach exposure, username conventions, and password patterns for targeted spraying |
| **Physical penetration testing** | Site imagery, badge design from photographs, delivery schedules, smoking area locations, contractor identification |
| **Vulnerability targeting** | Software versions from metadata and job postings, narrowing exploit selection before any scan |

### MITRE ATT&CK mapping

Reconnaissance is tactic **TA0043**.

| Technique | Description |
|-----------|-------------|
| **T1589** | Gather Victim Identity Information (credentials, email addresses, employee names) |
| **T1590** | Gather Victim Network Information (domains, DNS, IP ranges, topology) |
| **T1591** | Gather Victim Org Information (physical locations, business relationships, roles) |
| **T1592** | Gather Victim Host Information (hardware, software, configuration) |
| **T1593** | Search Open Websites and Domains (search engines, social media, code repositories) |
| **T1594** | Search Victim-Owned Websites |
| **T1595** | Active Scanning (active, not OSINT) |
| **T1596** | Search Open Technical Databases (WHOIS, DNS, certificates, scan databases) |
| **T1597** | Search Closed Sources (purchased data, threat intelligence feeds) |
| **T1598** | Phishing for Information (elicitation, not passive OSINT) |

The distinction within this tactic matters: T1593, T1594, and T1596 are passive OSINT. T1595 and T1598 involve direct interaction and require authorization.

## 11. Defensive OSINT

The same techniques applied to one's own organization identify exposure before an adversary does.

### Self-assessment programme

1. **Inventory the footprint.** Enumerate domains, subdomains, IP ranges, cloud storage, code repositories, and social accounts using the same passive methods an attacker would.
2. **Search for exposure.** Run dork patterns against owned domains. Check public repositories for committed secrets. Check paste sites for references.
3. **Extract metadata.** Audit published documents for internal paths, usernames, and software versions.
4. **Check breach exposure.** Monitor corporate domains against credential exposure services.
5. **Review personnel exposure.** Assess what staff profiles disclose about roles, systems, and access.
6. **Repeat continuously.** The footprint changes with every deployment, posting, and hire.

### Reduction measures

| Exposure | Countermeasure |
|----------|---------------|
| Document metadata | Strip metadata in the publishing workflow before release |
| Secrets in repositories | Pre-commit secret scanning, credential rotation, history rewriting where feasible |
| Forgotten subdomains and stale DNS | Regular certificate transparency review and DNS record audit |
| Overly detailed job postings | Generalize technology references, avoid naming specific versions |
| Public cloud storage | Account-level public access blocking, posture management tooling |
| Employee oversharing | Awareness training covering profile hygiene, photograph review, and recovery question exposure |
| WHOIS registrant detail | Registrar privacy services on all owned domains |

### OSINT-driven threat modeling

Building a threat model from the adversary's realistic starting knowledge produces materially different conclusions than modeling from an internal architecture diagram. Documenting what is externally discoverable, then asking what an attacker could do with only that, identifies the attack paths that actually exist rather than those that theoretically could.

## 12. Reporting and Documentation

### Report structure

```text
1. Executive summary        Key findings and risk implications in business terms
2. Objective and scope      The intelligence requirement and authorized boundary
3. Methodology              Sources, tools, techniques, and collection dates
4. Findings                 Each with evidence, source, date, and confidence
5. Analysis                 Correlation, patterns, and assessed significance
6. Risk implications        What the exposure enables and its consequence
7. Recommendations          Specific, actionable remediation
8. Limitations              What was not covered, and what remains uncertain
9. Appendices               Raw evidence, tool output, full data
```

### Evidence standards

| Requirement | Practice |
|-------------|----------|
| **Source attribution** | Full URL and access path for every finding |
| **Timestamping** | Date and time of collection, in a stated timezone |
| **Preservation** | Screenshot plus archived copy, since sources are removed or altered |
| **Reproducibility** | Document the exact query or command used |
| **Chain of custody** | For any finding that may support legal or disciplinary action |

**Screenshots versus links:** both are required. A link demonstrates authenticity and allows independent verification, but breaks when content is removed or edited. A screenshot preserves the finding but is trivially fabricated and carries no inherent authenticity. Include the link, the screenshot, the collection timestamp, and where possible an archived copy at a preservation service.

### Writing findings

- **Separate observation from inference.** State what was found, then state what it suggests, clearly distinguished.
- **Attach confidence to every assessment.** An unqualified claim implies certainty that OSINT rarely supports.
- **Use calibrated language.** "Indicates," "suggests," and "confirms" are not interchangeable.
- **State the significance.** A finding without an articulated consequence gives the reader nothing to act on.
- **Record what was not found,** and whether that absence is meaningful.

### Ethical disclosure

- Report exposed credentials and sensitive data to the affected organization through a defined channel, without testing or further access.
- Follow coordinated disclosure practice where a vulnerability is identified.
- Redact personal data from reports where it is not essential to the finding.
- Restrict distribution to authorized recipients, and encrypt in transit and at rest.
- Destroy collected data in line with the agreed retention period.

## 13. Tool Reference

| Tool | Category | Function |
|------|----------|----------|
| **Maltego** | Correlation | Entity and relationship graphing with automated pivot transforms |
| **SpiderFoot** | Automation | Automated multi-source reconnaissance with 200+ modules |
| **theHarvester** | Enumeration | Email, subdomain, and personnel collection from public sources |
| **Sherlock** | Identity | Username enumeration across social platforms |
| **Amass** | Infrastructure | Subdomain enumeration and network mapping, passive and active modes |
| **Subfinder** | Infrastructure | Passive subdomain discovery |
| **ExifTool** | Metadata | Metadata extraction and removal across file formats |
| **Have I Been Pwned** | Exposure | Breach exposure checking by address or domain |
| **Shodan** | Infrastructure | Internet-exposed service and device search |
| **Censys** | Infrastructure | Host, certificate, and scan data |
| **crt.sh** | Infrastructure | Certificate transparency log search |
| **Wayback Machine** | Archives | Historical page versions |
| **Recon-ng** | Framework | Modular reconnaissance framework with database-backed workspaces |
| **Google Dorks / GHDB** | Search | Catalogued query patterns for exposure discovery |

## 14. Operational Notes

- **Direction before collection.** Undirected collection produces volume, consumes time, and expands privacy intrusion without answering anything.
- **Passive first, always.** Exhaust passive sources before considering any active technique. Passive collection is undetectable and carries minimal legal exposure.
- **A username match is a lead, not an identity.** Requiring corroboration before assertion prevents the most common false positive in the discipline.
- **Date everything.** Findings without dates are unusable, since employment, infrastructure, and affiliation all change.
- **Certificate transparency is frequently the highest-yield subdomain source,** because it is comprehensive, passive, and includes internal hostnames.
- **Metadata is systematically underestimated.** Published documents routinely disclose usernames, internal paths, and software versions.
- **Repository history retains deleted secrets.** Removal in a later commit does not remove the credential from history.
- **Automated tools require manual validation.** Their false-positive rate makes unreviewed output unsuitable for a report.
- **Absence of evidence is not evidence of absence.** A negative result means not found through the methods used, and that limitation belongs in the report.
- **Scope discipline is the primary ethical control.** Pivots lead naturally outside authorization, and the boundary must be checked deliberately at each step.
- **Investigator OPSEC matters.** Collection conducted from attributable accounts and addresses discloses interest to the target.
- **Public does not mean unregulated.** Data protection obligations apply to personal data regardless of how openly it was published.

## 15. Fast Recall

- **OSINT** is intelligence from legally and publicly accessible information. Paid sources still qualify. Authentication bypass does not.
- **Passive** reconnaissance does not touch target systems. **Active** reconnaissance does and requires authorization.
- **Information** is raw. **Intelligence** is verified, correlated, assessed, and relevant to a requirement.
- The **intelligence cycle**: direction, collection, processing, analysis, dissemination, feedback.
- OSINT becomes illegal at **unauthorized access**, credential use, authentication or paywall circumvention, and deceptive elicitation.
- **Public availability does not remove data protection obligations.** GDPR applies to personal data collected from open sources.
- **OSINT versus surveillance**: point-in-time collection versus sustained monitoring of an individual. Aggregation shifts one toward the other.
- **Target types**: individuals, organizations, domains, infrastructure.
- Core **Google operators**: `site:`, `filetype:`, `intitle:`, `inurl:`, `intext:`, `cache:`.
- **Certificate transparency** logs reveal internal and development subdomains passively.
- **DNS records**: A (host), MX (mail), TXT (SPF, DMARC, service verification), NS (nameserver), CNAME (third-party services).
- **ExifTool** extracts author, software version, internal file paths, and GPS data from published documents.
- **Username reuse** is the strongest identity pivot, and requires corroboration before identity is asserted.
- **Validation** requires two genuinely independent sources, traced to origin, with dates recorded.
- **Confidence levels**: high, moderate, low, stated explicitly on every assessment.
- **MITRE ATT&CK Reconnaissance is TA0043**, covering T1589 through T1598.
- Evidence requires **link, screenshot, timestamp, and reproducible query**.
- **Defensive OSINT** applies the same techniques inward to find and reduce organizational exposure. The defining question is what information about us is publicly visible.
- **Metadata is data about data.** PDFs, Office documents, and images carry the most. Plain text carries almost none.
- **The first phase of the cycle** is direction, also called planning and scoping. Scoping first is what prevents ethical and legal violations.
- **Data minimization (minimalism)**: collect only what the requirement demands.
- **An OPSEC failure** is exposure of sensitive information through public behavior.
- **Credentials do not belong in an OSINT profile.** Record that an exposure exists, not the credential itself.
- **OSINT limitations**: it cannot perfectly represent reality, cannot guarantee attribution, is not always current, and does not replace active testing.

## 16. Resources

**Frameworks and methodology**
- [OSINT Framework](https://osintframework.com/)
- [Bellingcat Online Investigation Toolkit](https://www.bellingcat.com/category/resources/)
- [MITRE ATT&CK Reconnaissance (TA0043)](https://attack.mitre.org/tactics/TA0043/)
- [NIST SP 800-61 Rev. 2, Computer Security Incident Handling Guide](https://csrc.nist.gov/pubs/sp/800/61/r2/final)

**Search and discovery**
- [Google Hacking Database (GHDB)](https://www.exploit-db.com/google-hacking-database)
- [Wayback Machine](https://web.archive.org/)
- [crt.sh Certificate Transparency Search](https://crt.sh/)

**Technical collection**
- [Shodan](https://www.shodan.io/)
- [Censys](https://search.censys.io/)
- [DNSDumpster](https://dnsdumpster.com/)
- [ViewDNS.info](https://viewdns.info/)

**Tools**
- [theHarvester](https://github.com/laramies/theHarvester)
- [Sherlock](https://github.com/sherlock-project/sherlock)
- [SpiderFoot](https://github.com/smicallef/spiderfoot)
- [Amass](https://github.com/owasp-amass/amass)
- [Recon-ng](https://github.com/lanmaster53/recon-ng)
- [ExifTool](https://exiftool.org/)
- [Maltego](https://www.maltego.com/)

**Exposure checking**
- [Have I Been Pwned](https://haveibeenpwned.com/)
- [Have I Been Pwned Domain Search](https://haveibeenpwned.com/DomainSearch)

---
