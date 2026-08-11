// ---------------------------------------------------------------------------
// Single source of truth for cheatsheet metadata.
//
// Cards on the landing page and the per-cheatsheet routes both read from this
// array. The Markdown body for each entry lives in `/content/<id>.md`.
//
// `icon`  is the zero-padded sequence number shown on each card; cards are
//         sorted newest-first (highest number on top).
// `color` is one of the four "Tropical Punch" accents.
// ---------------------------------------------------------------------------

export type CheatsheetColor =
  | "orange"
  | "pink"
  | "yellow"
  | "teal"
  | "red"
  | "purple";

/** Landing-page tab a cheatsheet belongs to. */
export type CheatsheetCategory = "common-core" | "offensive" | "defensive";

export const DEFAULT_CATEGORY: CheatsheetCategory = "common-core";

export interface Cheatsheet {
  /** URL slug, also the filename of the Markdown body in /content. */
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  /** Zero-padded sequence number, e.g. "01". Sort key (desc = newest first). */
  icon: string;
  color: CheatsheetColor;
  /** Number of `##` sections in the Markdown body. */
  topicCount: number;
  /** Landing-page tab. Omitted entries fall back to `DEFAULT_CATEGORY`. */
  category?: CheatsheetCategory;
}

/** Tabs shown on the landing page, in display order. */
export const CATEGORIES: { id: CheatsheetCategory; label: string }[] = [
  { id: "common-core", label: "Foundations" },
  { id: "offensive", label: "Offensive Security" },
  { id: "defensive", label: "Defensive Security" },
];

/** A cheatsheet's category, resolving the default for untagged entries. */
export function categoryOf(sheet: Cheatsheet): CheatsheetCategory {
  return sheet.category ?? DEFAULT_CATEGORY;
}

export const CHEATSHEETS: Cheatsheet[] = [
  {
    "id": "careers",
    "title": "Career Pathways in Cybersecurity",
    "subtitle": "Roles, skills & certs",
    "description": "A map of cybersecurity careers — offensive vs defensive (red/blue/purple), roles (pentester, red team, consultant, bug bounty), progression to CISO, skills, languages, soft skills, and certifications (OSCP vs CEH vs GPEN).",
    "tags": [
      "careers",
      "red team",
      "blue team",
      "OSCP",
      "CEH",
      "pentester",
      "certifications"
    ],
    "icon": "29",
    "color": "orange",
    "topicCount": 19
  },
  {
    "id": "secpolicy",
    "title": "Security Policy Analysis",
    "subtitle": "Policies & compliance",
    "description": "Security policies explained — policy vs standard vs procedure vs guideline, policy types (AUP, access control, password, data classification, incident response), enforcement, exceptions, frameworks (NIST, ISO 27001, CIS), and compliance (GDPR, HIPAA, PCI-DSS).",
    "tags": [
      "policy",
      "compliance",
      "NIST",
      "ISO 27001",
      "GDPR",
      "HIPAA",
      "PCI-DSS",
      "AUP"
    ],
    "icon": "28",
    "color": "teal",
    "topicCount": 18
  },
  {
    "id": "threatmodel",
    "title": "Threat Modeling Fundamentals",
    "subtitle": "Think like an attacker",
    "description": "Structured threat modeling — CIA triad, assets/threats/vulnerabilities/risks, trust boundaries, DFDs, STRIDE, DREAD, PASTA, risk scoring, prioritized threat lists, mitigations, and the tools.",
    "tags": [
      "threat modeling",
      "STRIDE",
      "DREAD",
      "PASTA",
      "CIA triad",
      "risk",
      "DFD"
    ],
    "icon": "27",
    "color": "yellow",
    "topicCount": 17
  },
  {
    "id": "uploadvuln",
    "title": "Upload Vulnerabilities",
    "subtitle": "Unsafe file uploads",
    "description": "How unrestricted file uploads are exploited and defended — web shells, MIME/content-type spoofing, client-side bypass, magic bytes, extension filtering, size limits, permissions, and non-executable upload dirs.",
    "tags": [
      "file upload",
      "web shell",
      "MIME",
      "content-type",
      "validation",
      "bypass"
    ],
    "icon": "26",
    "color": "pink",
    "topicCount": 16
  },
  {
    "id": "cvecwenvd",
    "title": "CVE, CWE & NVD",
    "subtitle": "Vulnerability identifiers",
    "description": "How the global vulnerability ecosystem works — CVE identifiers and CNAs, CWE weakness types and the Top 25, the NVD with CVSS scoring, data feeds, searching, and tool integration.",
    "tags": [
      "CVE",
      "CWE",
      "NVD",
      "CVSS",
      "CNA",
      "vulnerability management"
    ],
    "icon": "25",
    "color": "orange",
    "topicCount": 18
  },
  {
    "id": "vulnread",
    "title": "Understanding Vulnerabilities",
    "subtitle": "Concepts & reading",
    "description": "Conceptual guide to vulnerabilities — types (software/hardware/network/human), vulnerability vs threat vs risk, CVE/CVSS, vulnerability management, static vs dynamic analysis, injection, CSRF, patching, and responsible disclosure.",
    "tags": [
      "vulnerability",
      "CVE",
      "threat",
      "risk",
      "SAST",
      "DAST",
      "CSRF",
      "patching"
    ],
    "icon": "24",
    "color": "teal",
    "topicCount": 14
  },
  {
    "id": "contentdisc",
    "title": "Mastering Content Discovery",
    "subtitle": "Finding hidden resources",
    "description": "Discover hidden directories, files, and endpoints — directory brute-forcing, wordlists, fuzzing, and the full toolset: gobuster, feroxbuster, ffuf, dirb, DirBuster, Nikto, Burp, and ZAP.",
    "tags": [
      "content discovery",
      "gobuster",
      "feroxbuster",
      "Nikto",
      "wordlists",
      "fuzzing",
      "dirb"
    ],
    "icon": "23",
    "color": "yellow",
    "topicCount": 17
  },
  {
    "id": "burpsuite",
    "title": "Burp Suite Fundamentals",
    "subtitle": "Web app testing proxy",
    "description": "The industry-standard web pentesting proxy — proxy setup, HTTPS cert config, components (Repeater, Intruder, Scanner, Spider), attack types, and result interpretation.",
    "tags": [
      "Burp Suite",
      "proxy",
      "Repeater",
      "Intruder",
      "Scanner",
      "web pentest"
    ],
    "icon": "22",
    "color": "pink",
    "topicCount": 15
  },
  {
    "id": "owasp",
    "title": "OWASP Top 10",
    "subtitle": "Web app security risks",
    "description": "The 2021 OWASP Top 10 — broken access control, injection/XSS, crypto failures, misconfiguration/XXE, vulnerable components, auth failures, insecure deserialization, SSRF, and modern API risks.",
    "tags": [
      "OWASP",
      "XSS",
      "injection",
      "SSRF",
      "access control",
      "API",
      "XXE"
    ],
    "icon": "21",
    "color": "orange",
    "topicCount": 15
  },
  {
    "id": "nta",
    "title": "Network Traffic Analysis",
    "subtitle": "Wireshark & tcpdump",
    "description": "Packet capture and analysis — tcpdump BPF filters, Wireshark dissection, capture vs display filters, following TCP streams, statistics tools, DNS analysis, anomaly detection, and SOC workflows.",
    "tags": [
      "Wireshark",
      "tcpdump",
      "PCAP",
      "BPF",
      "SOC",
      "DNS",
      "C2",
      "forensics"
    ],
    "icon": "20",
    "color": "teal",
    "topicCount": 16
  },
  {
    "id": "python",
    "title": "Python for Cybersecurity",
    "subtitle": "Scripting & automation",
    "description": "Python fundamentals, file I/O, the socket module, dnspython, requests, and BeautifulSoup — plus web scraping vs crawling, recursion, and quick cybersec recipes.",
    "tags": [
      "Python",
      "socket",
      "requests",
      "dnspython",
      "BeautifulSoup",
      "scraping"
    ],
    "icon": "19",
    "color": "yellow",
    "topicCount": 14
  },
  {
    "id": "aircrack",
    "title": "Aircrack-ng Suite",
    "subtitle": "Wi-Fi auditing",
    "description": "Full wireless audit workflow — monitor mode, airodump-ng captures, deauth attacks, WPA2 handshake cracking with aircrack-ng and hashcat, PMKID, WPS attacks.",
    "tags": [
      "aircrack-ng",
      "airodump",
      "WPA2",
      "Wi-Fi",
      "deauth",
      "PMKID"
    ],
    "icon": "18",
    "color": "pink",
    "topicCount": 13
  },
  {
    "id": "wpscan",
    "title": "WPScan",
    "subtitle": "WordPress security",
    "description": "WordPress version + plugin + theme vulnerabilities, user enumeration, password brute-force, stealth options, API token usage, and WP hardening checklist.",
    "tags": [
      "WPScan",
      "WordPress",
      "CVE",
      "plugins",
      "enumeration"
    ],
    "icon": "17",
    "color": "orange",
    "topicCount": 15
  },
  {
    "id": "sqlmap",
    "title": "SQLMap Deep Dive",
    "subtitle": "Automated SQL injection",
    "description": "Detection techniques (boolean/error/union/time), database enumeration, dumping, WAF bypass with tamper scripts, file system access, OS shell, and full workflow examples.",
    "tags": [
      "sqlmap",
      "SQLi",
      "MySQL",
      "tamper",
      "dump",
      "WAF bypass"
    ],
    "icon": "16",
    "color": "teal",
    "topicCount": 15
  },
  {
    "id": "gobuster",
    "title": "Gobuster",
    "subtitle": "Directory & DNS brute-force",
    "description": "Directory, DNS, vhost, and S3 bucket discovery — modes, filtering by length/status, authenticated scans, extension fuzzing, and comparison with ffuf.",
    "tags": [
      "gobuster",
      "directories",
      "subdomains",
      "vhost",
      "fuzzing"
    ],
    "icon": "15",
    "color": "yellow",
    "topicCount": 12
  },
  {
    "id": "nmap",
    "title": "Nmap — Network Mapper",
    "subtitle": "Port scanner deep dive",
    "description": "Complete nmap reference — host discovery, all scan types (SYN/UDP/ACK/etc), service & OS detection, NSE scripts, timing, evasion, output formats, and practical recipes.",
    "tags": [
      "nmap",
      "scanning",
      "NSE",
      "ports",
      "fingerprinting"
    ],
    "icon": "14",
    "color": "pink",
    "topicCount": 21
  },
  {
    "id": "active",
    "title": "Active Reconnaissance",
    "subtitle": "Scanning & enumeration",
    "description": "Host discovery, port scanning with nmap, OS fingerprinting, banner grabbing, DNS enumeration, SMTP user enumeration, web tech fingerprinting (Wappalyzer), and sqlmap for SQL injection.",
    "tags": [
      "nmap",
      "sqlmap",
      "Wappalyzer",
      "DNS",
      "SMTP",
      "OS fingerprint",
      "recon"
    ],
    "icon": "13",
    "color": "orange",
    "topicCount": 14
  },
  {
    "id": "passive",
    "title": "Passive Reconnaissance",
    "subtitle": "OSINT & footprinting",
    "description": "Gather info without touching the target — WHOIS, DNS records, dig/nslookup, subdomain enumeration with subfinder & crt.sh, DNSDumpster, Shodan, Google dorking, and OSINT workflows.",
    "tags": [
      "WHOIS",
      "DNS",
      "dig",
      "subfinder",
      "Shodan",
      "OSINT",
      "crt.sh",
      "dorking"
    ],
    "icon": "12",
    "color": "teal",
    "topicCount": 18
  },
  {
    "id": "netproto",
    "title": "Network Protocols: Auditing & Securing",
    "subtitle": "Hardening & audits",
    "description": "SSL/TLS, SSH, IPSec, WireGuard, NFS, SNMP, SMTP enumeration, iptables firewall rules, SSH hardening, and auditing tools (lynis, nmap, hping3, showmount).",
    "tags": [
      "TLS",
      "SSH",
      "IPSec",
      "WireGuard",
      "iptables",
      "lynis",
      "SNMP",
      "NFS"
    ],
    "icon": "11",
    "color": "yellow",
    "topicCount": 18
  },
  {
    "id": "email",
    "title": "Email Security Protocols",
    "subtitle": "SPF, DKIM & DMARC",
    "description": "Email authentication with SPF, DKIM, and DMARC — record syntax, alignment, policy deployment, key rotation, troubleshooting, and how all three work together.",
    "tags": [
      "SPF",
      "DKIM",
      "DMARC",
      "DNS",
      "email",
      "phishing",
      "anti-spoofing"
    ],
    "icon": "10",
    "color": "pink",
    "topicCount": 14
  },
  {
    "id": "ffuf",
    "title": "FFUF & SecLists Tools",
    "subtitle": "Web fuzzing",
    "description": "ffuf web fuzzer with SecLists wordlists — directory discovery, subdomain enumeration, login bruteforce, JSON API fuzzing, parameter discovery, and filtering strategies.",
    "tags": [
      "ffuf",
      "SecLists",
      "fuzzing",
      "bruteforce",
      "subdomains",
      "FUZZ"
    ],
    "icon": "09",
    "color": "orange",
    "topicCount": 13
  },
  {
    "id": "auth",
    "title": "Authentication vs Authorization",
    "subtitle": "Identity & access",
    "description": "AuthN vs AuthZ, three authentication factors, MFA, RBAC vs ABAC, authorization components, 401 vs 403, OAuth/SAML/JWT, and OWASP access control.",
    "tags": [
      "AuthN",
      "AuthZ",
      "MFA",
      "RBAC",
      "ABAC",
      "OAuth",
      "JWT",
      "401/403"
    ],
    "icon": "08",
    "color": "teal",
    "topicCount": 18
  },
  {
    "id": "crypto",
    "title": "Cryptography Basics",
    "subtitle": "Encryption & cracking",
    "description": "Symmetric & asymmetric encryption, hashing (SHA family), OpenSSL toolkit, password cracking with John the Ripper and hashcat, and defensive cryptography.",
    "tags": [
      "AES",
      "RSA",
      "SHA-256",
      "OpenSSL",
      "John",
      "hashcat",
      "bcrypt"
    ],
    "icon": "07",
    "color": "yellow",
    "topicCount": 15
  },
  {
    "id": "networking",
    "title": "Networking Foundations",
    "subtitle": "Network architecture",
    "description": "OSI/TCP-IP models, subnetting, DNS, DHCP, NAT, routing, VLANs, Wi-Fi security, firewalls, IDS/IPS, port scanning, and Zero Trust architecture.",
    "tags": [
      "OSI",
      "TCP/IP",
      "DNS",
      "DHCP",
      "VLAN",
      "BGP",
      "nmap",
      "subnetting"
    ],
    "icon": "06",
    "color": "pink",
    "topicCount": 33
  },
  {
    "id": "forensics",
    "title": "Digital Forensics & Ethics",
    "subtitle": "Investigations",
    "description": "Digital forensics ethics, ACPO principles, chain of custody, evidence handling, forensic methodologies, SIEM, and Linux forensic analysis.",
    "tags": [
      "ACPO",
      "chain of custody",
      "Autopsy",
      "SIEM",
      "NIST",
      "evidence"
    ],
    "icon": "05",
    "color": "orange",
    "topicCount": 19
  },
  {
    "id": "mac",
    "title": "MAC, SELinux & AppArmor",
    "subtitle": "Advanced defense",
    "description": "Mandatory Access Control concepts, SELinux labels and policy, AppArmor profiles, capabilities, and troubleshooting audit logs.",
    "tags": [
      "SELinux",
      "AppArmor",
      "semanage",
      "MAC",
      "capabilities"
    ],
    "icon": "04",
    "color": "teal",
    "topicCount": 18
  },
  {
    "id": "permissions",
    "title": "Permissions, SUID & SGID",
    "subtitle": "Access control",
    "description": "Master file permissions, ownership, special bits (SUID/SGID/sticky), umask, users & groups, and how to audit it all.",
    "tags": [
      "chmod",
      "chown",
      "SUID",
      "umask",
      "sudo",
      "useradd"
    ],
    "icon": "03",
    "color": "yellow",
    "topicCount": 14
  },
  {
    "id": "security",
    "title": "Linux Security Complete",
    "subtitle": "Comprehensive guide",
    "description": "Deep dive into Kali Linux, the shell, permissions, monitoring, network analysis with nmap/tcpdump/lynis, firewalls, and SCP workflows.",
    "tags": [
      "Kali",
      "nmap",
      "tcpdump",
      "iptables",
      "lynis",
      "ss"
    ],
    "icon": "02",
    "color": "pink",
    "topicCount": 15
  },
  {
    "id": "basics",
    "title": "Linux Security Basics",
    "subtitle": "Fundamentals",
    "description": "Linux fundamentals, the file system hierarchy, monitoring system activity, network basics, and your first firewall.",
    "tags": [
      "Linux",
      "FHS",
      "ps",
      "netstat",
      "ufw",
      "scp"
    ],
    "icon": "01",
    "color": "orange",
    "topicCount": 13
  },
  {
  "id": "offensive-vs-defensive",
  "title": "Offensive vs Defensive Security",
  "subtitle": "Red, Blue & Purple Teams",
  "description": "The two sides of cybersecurity: how red, blue, and purple teams work together, plus pentesting, the cyber kill chain, SIEM, threat hunting, and incident response.",
  "tags": [
    "Red Team",
    "Blue Team",
    "Purple Team",
    "Pentesting",
    "Kill Chain",
    "SIEM",
    "Incident Response"
  ],
  "icon": "01",
  "color": "red",
  "topicCount": 15,
  "category": "offensive"
  },
  {
    "id": "cvss-scoring",
    "title": "CVSS Scoring",
    "subtitle": "Reading severity scores",
    "description": "How CVSS rates vulnerability severity — the base, temporal, and environmental metric groups, reading a vector string, the 0–10 severity bands, and how CVSS ties into CVE and NVD when prioritizing.",
    "tags": [
      "CVSS",
      "CVE",
      "NVD",
      "vector string",
      "severity",
      "risk"
    ],
    "icon": "02",
    "color": "teal",
    "topicCount": 10,
    "category": "offensive"
  },
  {
    "id": "nessus",
    "title": "Nessus",
    "subtitle": "Vulnerability scanner",
    "description": "The Nessus vulnerability scanner — installing Essentials on Kali, starting the service, running a scan, reading results and CVSS scores, exporting reports, and where it fits between discovery and exploitation.",
    "tags": [
      "Nessus",
      "vuln scanner",
      "CVE",
      "CVSS",
      "Kali",
      "scanning"
    ],
    "icon": "03",
    "color": "orange",
    "topicCount": 10,
    "category": "offensive"
  },
  {
    "id": "metasploit",
    "title": "Metasploit",
    "subtitle": "Exploitation framework",
    "description": "The standard exploitation framework — core concepts (exploit, payload, module, session), msfconsole, the search-use-set-run workflow, staged vs stageless payloads, Meterpreter, and hashdump for post-exploitation.",
    "tags": [
      "Metasploit",
      "msfconsole",
      "Meterpreter",
      "payload",
      "exploit",
      "hashdump"
    ],
    "icon": "04",
    "color": "pink",
    "topicCount": 11,
    "category": "offensive"
  },
  {
    "id": "risk-assessment",
    "title": "Risk Assessment & Mitigation",
    "subtitle": "From findings to decisions",
    "description": "Turning raw findings into business decisions — the components of risk, inherent vs residual, appetite vs tolerance, qualitative/quantitative methods (SLE, ARO, ALE, ROSI), the risk matrix, CVSS vs EPSS vs KEV, DREAD, FAIR loss forms, the four T's of treatment, remediation SLAs, breach economics, and the Equifax and Colonial Pipeline case studies.",
    "tags": [
      "risk",
      "risk matrix",
      "ALE",
      "CVSS",
      "EPSS",
      "KEV",
      "DREAD",
      "FAIR",
      "NIST 800-30",
      "breach cost"
    ],
    "icon": "05",
    "color": "yellow",
    "topicCount": 24,
    "category": "offensive"
  },
  {
    "id": "osint",
    "title": "OSINT Profile Builder",
    "subtitle": "Open-source intelligence",
    "description": "Collecting, validating, and reporting open-source intelligence — the intelligence cycle, legal and ethical boundaries, target profiling, Google dorking, username and email pivots, WHOIS/DNS/certificate transparency, metadata extraction, confidence levels, ATT&CK reconnaissance, and defensive OSINT.",
    "tags": [
      "OSINT",
      "recon",
      "Google dorks",
      "theHarvester",
      "Sherlock",
      "Shodan",
      "ExifTool",
      "Maltego"
    ],
    "icon": "06",
    "color": "teal",
    "topicCount": 16,
    "category": "offensive"
  },
  {
    "id": "web-fundamentals",
    "title": "Web Fundamentals",
    "subtitle": "How the web works",
    "description": "The web end to end for security work — the request lifecycle, HTTP methods/status codes/headers, cookie attributes, Web 1.0 to 3.0, PWAs and service workers, REST and API flaws (BOLA, mass assignment), same-origin policy and CORS, sessions vs JWTs, the OWASP Top 10:2025, SAST/DAST/SCA, and bug bounty programs.",
    "tags": [
      "HTTP",
      "OWASP Top 10",
      "CORS",
      "same-origin",
      "JWT",
      "XSS",
      "REST API",
      "bug bounty"
    ],
    "icon": "07",
    "color": "orange",
    "topicCount": 17,
    "category": "offensive"
  },
  {
    "id": "passive-recon",
    "title": "Passive Recon Tools",
    "subtitle": "Recon without a packet",
    "description": "Mapping a target's footprint without sending traffic to it — a stage-by-stage workflow with primary tools and fallbacks: WHOIS and ownership, DNS intelligence, certificate-transparency subdomains, Shodan/Censys and ASN mapping, theHarvester and breach exposure, dorking and metadata, and correlation in Maltego.",
    "tags": [
      "passive recon",
      "OSINT",
      "whois",
      "crt.sh",
      "Shodan",
      "theHarvester",
      "subfinder",
      "Maltego"
    ],
    "icon": "08",
    "color": "teal",
    "topicCount": 14,
    "category": "offensive"
  },
  {
    "id": "active-recon",
    "title": "Active Recon Tools",
    "subtitle": "Scanning & enumeration",
    "description": "Directly enumerating hosts, ports, services, and content under authorization — a stage-by-stage workflow with primary tools and fallbacks: nmap host discovery and port scanning, service/version detection, gobuster/nikto web enumeration, DNS zone transfer and brute-force, and nmap/nuclei vulnerability identification.",
    "tags": [
      "active recon",
      "nmap",
      "masscan",
      "gobuster",
      "nikto",
      "nuclei",
      "port scan",
      "authorization"
    ],
    "icon": "09",
    "color": "red",
    "topicCount": 14,
    "category": "offensive"
  },
  {
    "id": "advanced-nmap",
    "title": "Advanced Network Enumeration with Nmap",
    "subtitle": "Scan Mechanics & NSE",
    "description": "The mechanics behind Nmap's advanced scans: how SYN, Connect, ACK, FIN, NULL, and Xmas scans work at the packet level, how they map firewalls and evade IDS, how the Nmap Scripting Engine and NSEDoc work, and how to correlate findings with known vulnerabilities.",
    "tags": [
      "Nmap",
      "NSE",
      "Port Scanning",
      "SYN Scan",
      "Firewall",
      "Enumeration",
      "Stealth"
    ],
    "icon": "10",
    "color": "purple",
    "topicCount": 20,
    "category": "offensive"
  },
  {
    "id": "advanced-shell-bash",
    "title": "Advanced Shell & Bash",
    "subtitle": "Shells, scripting & bypasses",
    "description": "A deep shell reference across Linux and Windows — how Bash (text streams) and PowerShell (object pipeline) work, Bash basics, redirection, expansions, scripting and test operators, CMD vs PowerShell, cross-platform pwsh, automation, and the offensive techniques for bypassing command restrictions and escaping restricted shells.",
    "tags": [
      "Bash",
      "PowerShell",
      "scripting",
      "restricted shell",
      "GTFOBins",
      "command injection",
      "globbing",
      "pwsh"
    ],
    "icon": "11",
    "color": "orange",
    "topicCount": 20,
    "category": "offensive"
  },
  {
    "id": "sql-nosql-injection",
    "title": "SQL & NoSQL Injection",
    "subtitle": "Injection attacks & defenses",
    "description": "The full injection attack chain and its defenses — finding injection points, in-band and UNION-based extraction, information_schema, blind (boolean and time-based) and second-order SQLi, NoSQL/MongoDB operator injection and $regex enumeration, and the code-level fixes: parameterized queries, validation, ORMs, stored procedures, and escaping.",
    "tags": [
      "SQLi",
      "NoSQL",
      "MongoDB",
      "UNION",
      "blind injection",
      "CWE-89",
      "parameterized queries",
      "ORM"
    ],
    "icon": "12",
    "color": "teal",
    "topicCount": 21,
    "category": "offensive"
  },
  {
    "id": "xss",
    "title": "Cross-Site Scripting (XSS)",
    "subtitle": "Client-side exploitation",
    "description": "Client-side exploitation through XSS: reflected, stored, and DOM-based families, injection contexts and breakouts, sources and sinks, postMessage and eval, filter and encoding evasion, Content Security Policy and its bypasses, plus the output-encoding defenses that actually stop it.",
    "tags": [
      "XSS",
      "DOM XSS",
      "CSP",
      "filter bypass",
      "JavaScript",
      "OWASP",
      "client-side"
    ],
    "icon": "13",
    "color": "pink",
    "topicCount": 27,
    "category": "offensive"
  },
  {
    "id": "security-assessment",
    "title": "Security Posture Assessment",
    "subtitle": "Assets, criticality & gaps",
    "description": "Asset inventory, criticality and data classification, gap analysis, and risk treatment for a board-ready posture assessment — the CIA triad, control categories/functions, threat intel validation, and writing for the board.",
    "tags": [
      "risk assessment",
      "asset inventory",
      "CIA triad",
      "gap analysis",
      "risk treatment",
      "NIST CSF",
      "GRC"
    ],
    "icon": "01",
    "color": "teal",
    "topicCount": 13,
    "category": "defensive"
  },
  {
    "id": "threat-intelligence",
    "title": "Threat Intelligence & Landscape",
    "subtitle": "Actors, TTPs & ATT&CK",
    "description": "Correlating external threats with internal posture gaps — the six threat-actor categories, motivations, ransomware/RaaS, insider and supply-chain risk, threat vectors, social engineering, attack-path tracing, MITRE ATT&CK, the Cyber Kill Chain, STRIDE, and writing a board-ready threat landscape report.",
    "tags": [
      "threat actors",
      "MITRE ATT&CK",
      "kill chain",
      "STRIDE",
      "ransomware",
      "social engineering",
      "threat intelligence"
    ],
    "icon": "02",
    "color": "red",
    "topicCount": 19,
    "category": "defensive"
  },
  {
    "id": "vulnerability-assessment",
    "title": "Vulnerability Assessment",
    "subtitle": "CVE, CVSS & triage",
    "description": "Turning a vulnerability scan into threat-informed intelligence — the CVE/NVD/CVSS/CWE ecosystem, NVD research workflow, exploit research with searchsploit, CISA KEV as a prioritisation signal, the vulnerability taxonomy, the management lifecycle, triage, false positives, and response strategies.",
    "tags": [
      "vulnerability",
      "CVE",
      "CVSS",
      "CWE",
      "KEV",
      "Exploit-DB",
      "triage",
      "Lynis"
    ],
    "icon": "03",
    "color": "orange",
    "topicCount": 19,
    "category": "defensive"
  },
  {
    "id": "linux-hardening",
    "title": "Linux System Hardening",
    "subtitle": "CIS baselines & auditing",
    "description": "Hardening Linux servers with CIS-inspired controls and automation — SSH and kernel (sysctl) hardening, filesystem and mount options, PAM password quality and lockout, AppArmor confinement, auditd, rsyslog, host firewalls, Lynis scoring, and idempotent hardening scripts with JSON output.",
    "tags": [
      "hardening",
      "CIS Benchmark",
      "SSH",
      "sysctl",
      "PAM",
      "AppArmor",
      "auditd",
      "Lynis"
    ],
    "icon": "07",
    "color": "yellow",
    "topicCount": 19,
    "category": "defensive"
  },
  {
    "id": "applied-cryptography",
    "title": "Applied Cryptography",
    "subtitle": "Encryption, hashing & PKI",
    "description": "Applying cryptography across a real environment — symmetric vs asymmetric, modern algorithm choices, hashing and password storage (bcrypt/Argon2), Diffie-Hellman, digital signatures, X.509 certificates and the chain of trust, TLS configuration, OpenSSL recipes, LUKS, and TPM/HSM/KMS hardware.",
    "tags": [
      "AES",
      "RSA",
      "TLS",
      "hashing",
      "Argon2",
      "X.509",
      "OpenSSL",
      "LUKS"
    ],
    "icon": "05",
    "color": "pink",
    "topicCount": 20,
    "category": "defensive"
  },
  {
    "id": "risk-communication",
    "title": "Executive Risk Communication",
    "subtitle": "Reporting & incident response",
    "description": "The capstone: turning technical findings into a decision a board can fund — the four levels of security thinking, translating an advisory into organisational risk, attack-chain and ATT&CK mapping, business impact categories, SLE/ALE quantification, risk treatment, the 72-hour response plan, the IR lifecycle, and briefing executives under pressure.",
    "tags": [
      "board briefing",
      "risk",
      "business impact",
      "ALE",
      "MITRE ATT&CK",
      "incident response",
      "executive comms"
    ],
    "icon": "06",
    "color": "purple",
    "topicCount": 19,
    "category": "defensive"
  },
  {
    "id": "security-strategy",
    "title": "Security Governance & Strategy",
    "subtitle": "Frameworks, GRC & roadmap",
    "description": "Building a business-aligned, cost-justified security strategy — governance and the policy hierarchy, NIST CSF 2.0, CIS Controls v8.1 and implementation groups, ISO 27001 and PDCA, data roles and RACI, SLE/ALE quantification, risk treatment, cost-benefit analysis, control selection, and a phased roadmap.",
    "tags": [
      "governance",
      "NIST CSF",
      "CIS Controls",
      "ISO 27001",
      "RACI",
      "ALE",
      "roadmap",
      "risk register"
    ],
    "icon": "04",
    "color": "teal",
    "topicCount": 19,
    "category": "defensive"
  },
  {
    "id": "windows-hardening",
    "title": "Windows & Active Directory Hardening",
    "subtitle": "GPO, Kerberos & Tier 0",
    "description": "Securing Windows and Active Directory — AD and Group Policy, password and Kerberos hardening, advanced audit policy and critical event IDs, Sysmon, PowerShell controls, AppLocker/WDAC, Windows Firewall, SMB/RDP hardening, gMSA service accounts, Tier 0 domain-controller protection, and defending the AD attack chain.",
    "tags": [
      "Windows",
      "Active Directory",
      "Group Policy",
      "Kerberos",
      "Sysmon",
      "AppLocker",
      "gMSA",
      "Tier 0"
    ],
    "icon": "08",
    "color": "red",
    "topicCount": 20,
    "category": "defensive"
  },
  {
    "id": "endpoint-detection",
    "title": "Endpoint Detection & Telemetry",
    "subtitle": "Detection engineering & ATT&CK coverage",
    "description": "Validating endpoint telemetry on hardened systems: Sysmon event IDs mapped to attacker behavior, PowerShell Script Block Logging, auditd and auth.log, controlled attack simulation, ground-truth correlation, detection matrices, telemetry quality assessment, JSON export and normalization, and MITRE ATT&CK gap analysis.",
    "tags": [
      "telemetry",
      "detection engineering",
      "Sysmon",
      "auditd",
      "MITRE ATT&CK",
      "SOC",
      "blue team"
    ],
    "icon": "09",
    "color": "orange",
    "topicCount": 20,
    "category": "defensive"
  }
];

/** Cheatsheets sorted newest-first (highest icon number on top). */
export const CHEATSHEETS_SORTED: Cheatsheet[] = [...CHEATSHEETS].sort(
  (a, b) => Number(b.icon) - Number(a.icon)
);

export function getCheatsheet(id: string): Cheatsheet | undefined {
  return CHEATSHEETS.find((c) => c.id === id);
}
