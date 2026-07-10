# Mastering Content Discovery

> **Content discovery** is the process of finding hidden resources — directories, backup files, config files, admin panels, and forgotten endpoints — that exist on a web server without any links pointing to them.

> "What you don't know about your web application is exactly what attackers will find first."

---

## 1. What is Content Discovery?

Every web application has **two surfaces**:

```
VISIBLE surface    → pages linked in the navigation, what users see
HIDDEN surface     → directories, files, endpoints with NO links to them
                     (admin panels, backups, configs, old pages, APIs)
```

**Content discovery** is systematically probing a web server to find that hidden surface — files and directories that aren't publicly advertised but still exist and respond.

### Three ways content is discovered

| Method | How |
|--------|-----|
| **Passive** | From third-party sources (Wayback Machine, crt.sh, Google) — no requests to target |
| **Active brute-force** | Send thousands of guesses for paths/files (gobuster, ffuf, dirb) |
| **Crawling/Spidering** | Follow links automatically (Burp Spider, ZAP) |

---

## 2. Why Content Discovery Matters

Hidden resources are often where the weaknesses live:

| Hidden resource | Why attackers want it |
|-----------------|----------------------|
| `/admin`, `/dashboard` | Privileged interfaces |
| `/backup.zip`, `.bak` files | Source code, credentials, database dumps |
| `/.git/`, `/.svn/` | Full source code history |
| `/config.php`, `.env` | Database creds, API keys, secrets |
| `/api/v1/`, `/api/internal/` | Undocumented endpoints, weaker auth |
| `/test/`, `/dev/`, `/staging/` | Debug features, weaker security |
| `/phpinfo.php` | Server configuration leak |
| Old/forgotten pages | Unpatched vulnerabilities |

### For attackers vs defenders

- **Attackers** map the full attack surface before exploiting — more surface = more chances
- **Defenders** run the *same* discovery to find and remove exposed resources before attackers do

> The full attack surface is almost always bigger than the visible site. Content discovery reveals it.

---

## 3. Hidden Directories & Files

A "hidden" resource isn't protected — it's just **unlinked**. The server still serves it if you request the right path.

### Common hidden items

```
/admin/              admin panels
/backup/  /old/      backups
/.git/  /.svn/       version-control directories (source code leak)
/.env                environment secrets
/config/  /conf/     configuration files
/uploads/            user-uploaded files (sometimes listable)
/api/  /v1/  /v2/    API endpoints
/test/  /dev/        development leftovers
/wp-admin/           CMS admin (WordPress)
/phpmyadmin/         database admin
robots.txt           often LISTS paths the owner wants hidden (!)
sitemap.xml          lists known pages
.htaccess  .htpasswd config / credential files
*.bak *.old *.swp ~  editor/backup file extensions
```

### Quick wins to always check first

```bash
curl https://target.com/robots.txt      # often reveals hidden paths
curl https://target.com/sitemap.xml      # lists pages
curl https://target.com/.git/HEAD        # exposed git repo?
curl https://target.com/.env             # exposed secrets?
```

`robots.txt` is ironic gold — site owners list paths they want search engines to *avoid*, which tells attackers exactly where to look.

---

## 4. How Directory Brute-Forcing Works

Directory brute-forcing sends **many HTTP requests**, each guessing a different path from a **wordlist**, and watches the **response codes** to find what exists.

```
1. Take a wordlist:        admin, login, backup, config, test, api...
2. For each word, request: https://target.com/<word>
3. Read the response code:
     200 OK        → exists!
     301/302       → exists (redirect)
     403 Forbidden → exists but access blocked (interesting!)
     404 Not Found → doesn't exist
4. Report everything that ISN'T a 404
```

### Interpreting status codes

| Code | Meaning | Discovery value |
|------|---------|-----------------|
| **200** | OK | Resource exists and is accessible |
| **301/302** | Redirect | Resource exists (often a directory) |
| **401** | Unauthorized | Exists — needs authentication |
| **403** | Forbidden | **Exists but blocked — very interesting** |
| **404** | Not Found | Doesn't exist (filter these out) |
| **500** | Server Error | Exists but errored (may leak info) |

The core skill: **filtering out the noise** (404s and generic "not found" pages) so only real findings remain.

---

## 5. Wordlists — The Fuel

A **wordlist** is a text file of candidate names (one per line) used as guesses. Discovery is only as good as the wordlist.

### SecLists — the standard collection

```bash
sudo apt install seclists
# Lives at /usr/share/seclists/
```

### Key wordlists for content discovery

```bash
# Directory/file discovery — start here
/usr/share/seclists/Discovery/Web-Content/common.txt              # ~4,700 — quick
/usr/share/seclists/Discovery/Web-Content/raft-small-words.txt    # ~13,000
/usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt  # ~220,000 — thorough
/usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt
/usr/share/seclists/Discovery/Web-Content/raft-medium-files.txt

# Technology-specific
/usr/share/seclists/Discovery/Web-Content/CMS/wordpress.txt
/usr/share/seclists/Discovery/Web-Content/apache.txt
/usr/share/seclists/Discovery/Web-Content/IIS.txt

# API endpoints
/usr/share/seclists/Discovery/Web-Content/api/api-endpoints.txt

# Backup/config files
/usr/share/seclists/Discovery/Web-Content/Common-DB-Backups.txt
```

### Choosing the right wordlist

| Situation | Wordlist |
|-----------|----------|
| First quick pass | `common.txt` |
| Thorough scan | `directory-list-2.3-medium.txt` |
| Known WordPress | `CMS/wordpress.txt` |
| Hunting backups | `Common-DB-Backups.txt` + extensions |
| API target | `api/api-endpoints.txt` |

**Strategy:** start small and fast (`common.txt`), then escalate to bigger lists if needed. Match the wordlist to the target's technology.

---

## 6. Fuzzing in Web Security

**Fuzzing** = sending many automated, varied inputs to a target to discover hidden behavior, content, or vulnerabilities. In content discovery, you "fuzz" the URL path or parameters.

### What you can fuzz

| Fuzz target | Example | Finds |
|-------------|---------|-------|
| **Directories/files** | `target.com/FUZZ` | Hidden paths |
| **File extensions** | `target.com/admin.FUZZ` | `.php`, `.bak`, `.old` |
| **Subdomains** | `FUZZ.target.com` | Hidden hosts |
| **Parameters** | `target.com/page?FUZZ=1` | Hidden parameters |
| **Parameter values** | `target.com/page?id=FUZZ` | IDOR, injection |
| **Virtual hosts** | `Host: FUZZ.target.com` | Hidden vhosts |

The `FUZZ` keyword marks **where** each wordlist entry is inserted. Each request swaps `FUZZ` for the next wordlist word.

```bash
# ffuf: FUZZ in the path = directory discovery
ffuf -w wordlist.txt:FUZZ -u https://target.com/FUZZ

# FUZZ as extension
ffuf -w extensions.txt:FUZZ -u https://target.com/admin.FUZZ

# FUZZ as parameter name
ffuf -w params.txt:FUZZ -u "https://target.com/page?FUZZ=test"
```

---

## 7. Gobuster

Fast Go-based brute-forcer. (See the dedicated Gobuster cheatsheet for full depth.)

```bash
# Directory discovery
gobuster dir -u https://target.com -w /usr/share/seclists/Discovery/Web-Content/common.txt

# With extensions
gobuster dir -u https://target.com -w wordlist.txt -x php,html,txt,bak -k

# Hide noise
gobuster dir -u https://target.com -w wordlist.txt -b 404,403 --exclude-length 1234

# DNS subdomains
gobuster dns -d target.com -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt
```

**Strengths:** fast, simple, great for directories and DNS. **Modes:** `dir`, `dns`, `vhost`, `fuzz`, `s3`.

---

## 8. Feroxbuster

A fast, **recursive** Rust-based content discovery tool. Its standout feature: when it finds a directory, it **automatically recurses into it**.

```bash
sudo apt install feroxbuster

# Basic recursive scan
feroxbuster -u https://target.com

# With wordlist and extensions
feroxbuster -u https://target.com \
    -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt \
    -x php,html,txt

# Control recursion depth
feroxbuster -u https://target.com --depth 2

# Filter by status / size
feroxbuster -u https://target.com -C 404,403 -S 1234
```

| Flag | Purpose |
|------|---------|
| `-u` | Target URL |
| `-w` | Wordlist |
| `-x` | Extensions |
| `-d` / `--depth` | Recursion depth |
| `-C` | Filter status codes |
| `-S` | Filter response sizes |
| `-t` | Threads |
| `-k` | Ignore SSL errors |

**Strength:** automatic recursion finds deeply nested content others miss (`/admin/` → `/admin/users/` → `/admin/users/export/`).

---

## 9. DirBuster & dirb

### DirBuster

A **GUI** Java tool (OWASP project) for directory/file brute-forcing. It pioneered the technique.

```bash
dirbuster   # launches the GUI
```

- Point-and-click interface — set target URL, pick a wordlist, choose extensions
- Multi-threaded
- Can do recursive scanning
- **Purpose:** the original GUI directory brute-forcer — still works, but command-line tools (gobuster, feroxbuster) are faster and more common today

### dirb

The classic command-line predecessor:

```bash
dirb https://target.com                              # default wordlist
dirb https://target.com /usr/share/seclists/Discovery/Web-Content/common.txt
dirb https://target.com -X .php,.bak                 # specific extensions
dirb https://target.com -r                           # non-recursive
```

Simple and reliable, comes with its own wordlists in `/usr/share/dirb/wordlists/`.

---

## 10. Nikto — Web Server Scanner

**Nikto** isn't a pure brute-forcer — it's a web server vulnerability scanner that *also* discovers content. It checks for thousands of known dangerous files, outdated software, and misconfigurations.

```bash
nikto -h https://target.com
nikto -h https://target.com -p 443 -ssl
nikto -h https://target.com -o report.html -Format htm
nikto -h https://target.com -Tuning 1234   # specific test categories
```

### What Nikto finds

- Dangerous/default files (`/phpinfo.php`, `/test.cgi`)
- Outdated server software with known CVEs
- Insecure HTTP headers
- Default credentials
- Directory indexing enabled
- Known backup/config file locations

**When to use:** quick first-pass to find "low-hanging fruit" misconfigurations. It's **loud** (easily detected) — not stealthy.

---

## 11. Burp Suite for Content Discovery

Burp Suite contributes to content discovery in several ways (see the Burp Suite cheatsheet for depth):

| Burp feature | Content discovery use |
|--------------|----------------------|
| **Spider / Crawler** | Automatically follows links to map the site |
| **Target → Site map** | Builds a tree of all discovered content |
| **Intruder** | Brute-force paths (mark `§position§`, load wordlist) |
| **Engagement tools → Discover content** (Pro) | Dedicated content discovery feature |
| **Proxy HTTP history** | Passive discovery as you browse |

### Brute-forcing paths with Intruder

```
1. Capture a request:  GET /FUZZ HTTP/1.1  (send to Intruder)
2. Positions: GET /§§ HTTP/1.1  (mark the path)
3. Payloads: load a SecLists wordlist
4. Start attack → sort results by status/length
5. Anything not 404 = discovered content
```

Burp's **"Discover content"** (Pro engagement tool) automates this — it crawls, brute-forces, and analyzes naming patterns to find more content intelligently.

---

## 12. OWASP ZAP for Content Discovery

**OWASP ZAP** (Zed Attack Proxy) is the free, open-source alternative to Burp. For content discovery it provides:

| ZAP feature | Use |
|-------------|-----|
| **Spider** | Crawls links to map the application |
| **AJAX Spider** | Handles JavaScript-heavy apps (clicks/renders) |
| **Forced Browse** (via add-on) | Directory/file brute-forcing with wordlists |
| **Site tree** | Shows all discovered content |

### Forced Browse

ZAP's directory brute-forcing is called **Forced Browse** (based on the old DirBuster engine, integrated via an add-on):

```
1. Install "Forced Browse" from the ZAP Marketplace
2. Right-click a site → Attack → Forced Browse site
3. Choose a wordlist (DirBuster lists are bundled)
4. ZAP brute-forces paths and adds findings to the site tree
```

**ZAP vs Burp:** ZAP is fully free and open-source with strong automation; Burp is the commercial industry standard. Both spider + brute-force content effectively.

---

## 13. Tool Comparison

| Tool | Type | Recursive | Best for |
|------|------|-----------|----------|
| **gobuster** | CLI brute-force | Manual | Fast directory/DNS scans |
| **feroxbuster** | CLI brute-force | **Auto** | Deep recursive discovery |
| **ffuf** | CLI fuzzer | Manual | Flexible fuzzing (params, vhosts) |
| **dirb** | CLI brute-force | Yes | Simple classic scans |
| **DirBuster** | GUI brute-force | Yes | Point-and-click |
| **Nikto** | Vuln scanner | — | Known files + misconfigs |
| **Burp Spider/Intruder** | Proxy suite | Yes | Integrated testing workflow |
| **ZAP Spider/Forced Browse** | Proxy suite | Yes | Free integrated workflow |

**No single tool is "best"** — pros combine them: spider with Burp/ZAP, brute-force with feroxbuster/gobuster, quick-scan with Nikto.

---

## 14. A Content Discovery Workflow

Against a target like **Cyber - WebSec 0x04**:

```
1. PASSIVE FIRST (free, invisible)
   curl https://target/robots.txt
   curl https://target/sitemap.xml
   # check Wayback Machine, crt.sh for old paths/subdomains

2. QUICK BASELINE
   curl -kI https://target/randomnonexistent   # learn what a 404 looks like
   gobuster dir -u https://target -w common.txt -b 404 -k

3. DEEPER BRUTE FORCE
   feroxbuster -u https://target \
       -w raft-medium-directories.txt -x php,html,bak

4. KNOWN FILES & MISCONFIGS
   nikto -h https://target

5. CRAWL FOR LINKED CONTENT
   # Burp Spider or ZAP Spider to follow links

6. TARGET WHAT YOU FIND
   # Found /admin? → test it
   # Found /backup.zip? → download & inspect
   # Found /.git/? → dump the source
   # Found /api/? → enumerate endpoints

7. DOCUMENT
   # Every discovered path, its status code, and significance
```

---

## 15. Useful curl Checks

```bash
# Headers only (fast)
curl -kI https://target.com/admin

# Follow redirects, show final
curl -kL https://target.com/old

# Check a specific file
curl -ks https://target.com/.env

# Common quick checks
for p in robots.txt sitemap.xml .git/HEAD .env config.php backup.zip; do
    echo "=== $p ==="
    curl -kI "https://target.com/$p" 2>/dev/null | head -1
done
```

---

## 16. Defensive Side

If you own the app, reduce your hidden attack surface:

| Defense | Why |
|---------|-----|
| **Remove unused files** (backups, old pages, test scripts) | Nothing to discover |
| **Disable directory listing** | Can't browse folders |
| **Block access to `.git`, `.env`, config files** | No source/secret leaks |
| **Put admin panels behind auth + IP allowlist** | `/admin` not freely reachable |
| **Return consistent 404s** | Harder to distinguish real from fake |
| **Don't expose dev/staging on production domains** | Fewer weak endpoints |
| **Monitor for scanning** (many 404s fast = brute force) | Detect and block |
| **Run discovery on yourself** | Find what attackers will find |

---

## 17. Quick Reference

```bash
# Passive quick checks
curl -kI https://target/robots.txt
curl -ks https://target/.git/HEAD
curl -ks https://target/.env

# Gobuster
gobuster dir -u https://target -w common.txt -x php,bak -b 404 -k

# Feroxbuster (recursive)
feroxbuster -u https://target -w raft-medium-directories.txt -x php

# ffuf (flexible fuzzing)
ffuf -w wordlist.txt:FUZZ -u https://target/FUZZ -fc 404

# dirb
dirb https://target /usr/share/seclists/Discovery/Web-Content/common.txt

# Nikto (vuln + content)
nikto -h https://target

# DirBuster (GUI)
dirbuster
```

### Concepts in one line each

```
Content discovery   → find hidden/unlinked web resources
Directory brute-force → guess paths from a wordlist, read status codes
Wordlist            → list of candidate names to try (SecLists)
Fuzzing             → send many varied inputs to find hidden behavior
Hidden files/dirs   → resources that exist but have no links to them
FUZZ keyword        → marks where each wordlist word is inserted
```

### Three rules

1. **Passive first** — check robots.txt, sitemap, Wayback before brute-forcing
2. **Filter the noise** — learn the 404 baseline, then hide it (`-b 404` / `--exclude-length`)
3. **Get authorization** — brute-forcing generates thousands of requests; only run against targets you own or are permitted to test (`Cyber - WebSec 0x04`, your own labs, PortSwigger Academy)
