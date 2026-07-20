# ffuf & SecLists — Practical Cheatsheet

---

## 1. What is ffuf?

**ffuf** (Fuzz Faster U Fool) is a fast web fuzzer written in Go. It takes a wordlist and a target URL, then sends a request for every word — using a placeholder called `FUZZ` to mark where each word goes.

### What you use it for

| Use case | Example |
|----------|---------|
| **Directory / file discovery** | Find hidden paths on a web app |
| **Subdomain enumeration** | Find subdomains like `dev.target.com` |
| **Parameter discovery** | Find hidden GET/POST parameters |
| **Authentication brute force** | Try common passwords against a login |
| **Virtual host discovery** | Find sites served by Host header |
| **API endpoint enumeration** | Discover `/api/v1/users`, `/api/admin`, etc. |

### Install

```bash
sudo apt install ffuf
ffuf -V                   # check version
```

---

## 2. What is SecLists?

**SecLists** is a giant collection of `.txt` wordlists used in security testing. Think of it as a library where each file is a "guess list" for different scenarios.

### Install

```bash
sudo apt install seclists
```

After install, everything lives under:

```
/usr/share/seclists/
```

### What's inside

| Folder | What's in it |
|--------|-------------|
| `Usernames/` | Common usernames (admin, root, guest, etc.) |
| `Passwords/` | Common passwords, leaked databases, default creds |
| `Discovery/Web-Content/` | URL paths, filenames, API endpoints |
| `Discovery/DNS/` | Subdomain wordlists |
| `Fuzzing/` | Special-purpose fuzz strings (SQLi payloads, XSS, etc.) |
| `Payloads/` | Exploit payloads for various attacks |
| `Web-Shells/` | Web shell code (for authorized pentesting) |

### Most-used files (memorize these paths)

```
/usr/share/seclists/Usernames/top-usernames-shortlist.txt
/usr/share/seclists/Usernames/Names/names.txt

/usr/share/seclists/Passwords/Common-Credentials/10-million-password-list-top-1000.txt
/usr/share/seclists/Passwords/darkweb2017-top100.txt
/usr/share/seclists/Passwords/Common-Credentials/best15.txt

/usr/share/seclists/Discovery/Web-Content/common.txt
/usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt
/usr/share/seclists/Discovery/Web-Content/api/api-endpoints.txt
/usr/share/seclists/Discovery/Web-Content/raft-small-words.txt

/usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt
```

### Quick wordlist navigation

```bash
# List a folder
ls /usr/share/seclists/Passwords/Common-Credentials/

# Search for a wordlist by keyword
find /usr/share/seclists/ -iname "*api*" -type f

# Check how many entries
wc -l /usr/share/seclists/Discovery/Web-Content/common.txt

# Look at the first 10 entries
head /usr/share/seclists/Passwords/darkweb2017-top100.txt

# Verify a word exists in a list
grep -n "^password$" /usr/share/seclists/Passwords/Common-Credentials/10-million-password-list-top-1000.txt
```

---

## 3. The FUZZ Placeholder

`FUZZ` is the magic word — wherever you write it, ffuf substitutes one entry from the wordlist per request.

### Where you can put FUZZ

```
URL path:          https://target.com/FUZZ
URL query:         https://target.com/page?id=FUZZ
Host header:       -H "Host: FUZZ.target.com"
POST body:         -d '{"username":"FUZZ"}'
HTTP method:       -X FUZZ
```

### Multiple wordlists with custom keywords

You can use more than one wordlist with named keywords:

```bash
ffuf -w users.txt:USER -w pass.txt:PASS \
     -u https://target.com/login \
     -X POST \
     -d "username=USER&password=PASS"
```

Each request uses one username + one password combination (clusterbomb-style by default).

---

## 4. Basic Syntax

```bash
ffuf -w <wordlist>:FUZZ -u <url-with-FUZZ>
```

### Minimal example — directory discovery

```bash
ffuf -w /usr/share/seclists/Discovery/Web-Content/common.txt:FUZZ \
     -u https://target.com/FUZZ
```

### Common flags

| Flag | What it does |
|------|--------------|
| `-w wordlist.txt:KEY` | Wordlist + keyword (default keyword is `FUZZ`) |
| `-u URL` | Target URL |
| `-X POST` | HTTP method (default GET) |
| `-d 'body'` | POST body |
| `-H "Header: value"` | Custom header (repeat for multiple) |
| `-k` | Ignore SSL cert errors |
| `-t 40` | Threads (default 40) |
| `-rate 50` | Limit requests per second |
| `-r` | Follow redirects |
| `-c` | Color output |
| `-v` | Verbose (show full URL) |
| `-s` | Silent (only successful results) |
| `-o results.json -of json` | Save output |

---

## 5. Filtering Results

This is the **most important skill** in ffuf. Without filters, you get noise. With good filters, the answer jumps out.

### Filter (`-f...`) vs Match (`-m...`)

- `-f...` = **filter out** (hide) — exclude responses matching this
- `-m...` = **match** — show only responses matching this

You usually use **one or the other**, not both.

### Filter / match options

| Flag | What it filters by | Example |
|------|-------------------|---------|
| `-fc` / `-mc` | Status code | `-fc 404` hide 404s |
| `-fs` / `-ms` | Size (bytes) | `-fs 1234` hide responses of size 1234 |
| `-fw` / `-mw` | Word count | `-fw 100` hide responses with 100 words |
| `-fl` / `-ml` | Line count | `-fl 5` hide 5-line responses |
| `-fr` / `-mr` | Regex on response body | `-mr "admin"` show only responses containing "admin" |
| `-ft` / `-mt` | Response time | `-ft <100` hide fast responses |

### Workflow — find your filter baseline first

Before bruteforcing, **always test one wrong guess manually** to learn what "fail" looks like. Note its size and status code. That's your filter.

```bash
# 1. Manual test with a guess you KNOW won't work
curl -ki https://target.com/login -X POST -d "username=admin&password=WRONGPASSWORD"
# Note: status code, content-length, or specific text in body

# 2. Build ffuf to hide that pattern
ffuf -w wordlist.txt:FUZZ -u https://target.com/... -fs <size_from_step_1>
```

### Auto-calibration

For directory fuzzing, ffuf can auto-detect the "baseline" 404-equivalent response:

```bash
ffuf -w wordlist.txt:FUZZ -u https://target.com/FUZZ -ac
```

`-ac` (auto-calibrate) sends a random non-existent path first, learns the response pattern, then filters it out automatically. Saves you manual baseline testing.

---

## 6. Practical Recipes

### Recipe 1 — Directory / file discovery

```bash
ffuf -w /usr/share/seclists/Discovery/Web-Content/common.txt:FUZZ \
     -u https://target.com/FUZZ \
     -fc 404 \
     -k
```

Find common web paths. Filter out 404s.

### Recipe 2 — File extension fuzzing

Try multiple extensions for each word:

```bash
ffuf -w wordlist.txt:FUZZ \
     -u https://target.com/FUZZ \
     -e .php,.html,.txt,.bak \
     -fc 404
```

`-e` appends each extension to every word: `admin → admin.php, admin.html, admin.txt, admin.bak`.

### Recipe 3 — Subdomain discovery

```bash
ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt:FUZZ \
     -u https://target.com \
     -H "Host: FUZZ.target.com" \
     -fs <size_of_main_site>
```

The Host header tells the server which virtual host to serve. Filter out the size of the default page to find genuine subdomains.

### Recipe 4 — Hidden GET parameter discovery

```bash
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
     -u "https://target.com/page?FUZZ=test" \
     -fs <baseline_size>
```

Finds parameter names the server reacts to. A different response size means the server accepts that parameter.

### Recipe 5 — Login brute force (form-encoded)

```bash
ffuf -w /usr/share/seclists/Passwords/darkweb2017-top100.txt:FUZZ \
     -u https://target.com/login \
     -X POST \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=admin&password=FUZZ" \
     -fs <size_of_failed_login>
```

Try common passwords for a known username. Filter out the failure-page size.

### Recipe 6 — JSON API fuzzing

```bash
ffuf -w /usr/share/seclists/Usernames/top-usernames-shortlist.txt:FUZZ \
     -u https://target.com/api/check_username \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"username":"FUZZ"}' \
     -mr "exists"
```

POST JSON body. Match by content using regex (`-mr`) to find responses containing the word "exists".

### Recipe 7 — Multi-wordlist (username + password combo)

```bash
ffuf -w users.txt:USER -w pass.txt:PASS \
     -u https://target.com/login \
     -X POST \
     -d "username=USER&password=PASS" \
     -mode clusterbomb \
     -fs <fail_size>
```

| Mode | Behavior |
|------|----------|
| `clusterbomb` (default) | Every USER × every PASS (full combination) |
| `pitchfork` | Pair index-by-index (line 1 with line 1, line 2 with line 2, etc.) |

### Recipe 8 — Fuzz HTTP methods

```bash
ffuf -w methods.txt:FUZZ \
     -u https://target.com/api/admin \
     -X FUZZ
```

Where `methods.txt` contains `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, etc. Useful when an endpoint accepts unexpected methods.

### Recipe 9 — Output to file for later review

```bash
ffuf -w wordlist.txt:FUZZ \
     -u https://target.com/FUZZ \
     -o results.json -of json
```

Output formats: `json`, `html`, `md`, `csv`, `ejson`.

### Recipe 10 — Rate-limit-friendly scan

```bash
ffuf -w wordlist.txt:FUZZ \
     -u https://target.com/FUZZ \
     -t 5 \
     -rate 20 \
     -p 0.1-1.0
```

| Flag | Purpose |
|------|---------|
| `-t 5` | 5 threads (slow and quiet) |
| `-rate 20` | Max 20 requests/sec |
| `-p 0.1-1.0` | Random delay between 0.1s and 1.0s |

Use when fuzzing real targets to avoid getting blocked.

---

## 7. Reading ffuf Output

```
admin                   [Status: 200, Size: 12404, Words: 4459, Lines: 245, Duration: 318ms]
guest                   [Status: 200, Size: 12404, Words: 4459, Lines: 245, Duration: 318ms]
login                   [Status: 200, Size: 8723,  Words: 2210, Lines: 110, Duration: 245ms]
```

| Column | What it means |
|--------|---------------|
| First column | The word from your wordlist |
| **Status** | HTTP status code returned |
| **Size** | Response body size in bytes |
| **Words** | Number of whitespace-separated tokens |
| **Lines** | Number of lines in the response |
| **Duration** | How long the request took |

**Key insight:** identical **Size + Words + Lines** = identical response = same page = probably a false positive. The one that **differs** is interesting.

---

## 8. Common Filters by Scenario

| Scenario | Suggested filter |
|----------|-----------------|
| Directory fuzzing | `-ac` (auto-calibrate) or `-fc 404` |
| Login brute force | `-fs <fail_page_size>` |
| Subdomain discovery | `-fs <default_site_size>` |
| Parameter discovery | `-fs <unchanged_response_size>` |
| API enumeration | `-mr "<word_that_appears_on_success>"` or `-fs <not_found_size>` |
| Anything with redirects | `-fc 301,302` or `-mc 200,401,403` |

---

## 9. Wordlist Picking Guide

### Don't reach for the biggest list first

| Phase | Wordlist size | Why |
|-------|---------------|-----|
| **Quick recon** | < 1,000 entries | Fast, finds obvious stuff |
| **Targeted attack** | 5,000 - 50,000 | Better coverage |
| **Exhaustive** | 100,000+ | Last resort, slow |

### My go-to lists (start here)

```bash
# Directory discovery (use this first)
/usr/share/seclists/Discovery/Web-Content/common.txt              # ~4,600 entries
/usr/share/seclists/Discovery/Web-Content/raft-small-words.txt    # ~13,000

# Then escalate if nothing found
/usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt   # ~220,000

# Usernames
/usr/share/seclists/Usernames/top-usernames-shortlist.txt          # ~17 entries
/usr/share/seclists/Usernames/xato-net-10-million-usernames-1000000.txt   # 1M

# Passwords (small to large)
/usr/share/seclists/Passwords/darkweb2017-top100.txt              # 100
/usr/share/seclists/Passwords/Common-Credentials/10-million-password-list-top-1000.txt   # 1K
/usr/share/seclists/Passwords/Common-Credentials/10k-most-common.txt     # 10K
/usr/share/seclists/Passwords/Common-Credentials/100k-most-used-passwords-NCSC.txt   # 100K

# Subdomains
/usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt  # 5K
/usr/share/seclists/Discovery/DNS/subdomains-top1million-110000.txt  # 110K
```

---

## 10. Workflow — Putting It All Together

A typical web app pentest workflow with ffuf:

```
1. Map the surface
   → ffuf for directories with common.txt
   → Note interesting paths (login, admin, api, etc.)

2. Explore each path manually
   → curl -ki to see headers and body
   → Find forms, API endpoints, parameters

3. Enumerate further on found paths
   → If /api/ exists → fuzz /api/FUZZ
   → If a form has fields → look for hidden parameters

4. Test authentication
   → Try default creds first (admin/admin, admin/password)
   → Then bruteforce with small password list

5. Establish filter baseline
   → Manually test a wrong guess
   → Note size/status/content
   → Apply as -fs / -fc / -fr filter

6. Run targeted ffuf
   → Small wordlist first
   → Escalate to larger only if needed
```

---

## 11. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| **"Errors: 0" but no results** | Default matcher missed your response | Check actual response with curl, adjust `-mc` |
| **All entries show as results** | No filter applied, or filter wrong | Find unique attribute, filter on it |
| **SSL cert error** | Self-signed or mismatched cert | Add `-k` |
| **Connection refused** | Target down or wrong port | Verify with curl first |
| **Rate-limited / 429s** | Sending too fast | Add `-rate 20` and `-t 5` |
| **Got blocked / 403** | Target detected bot | Add `-H "User-Agent: Mozilla/5.0 ..."`, slow down |
| **Same size everywhere** | Server returns generic page | Server might be ignoring your input — verify endpoint works |

---

## 12. Quick Reference Card

```bash
# Directory discovery (the most common use)
ffuf -w /usr/share/seclists/Discovery/Web-Content/common.txt:FUZZ \
     -u https://target.com/FUZZ -ac

# Subdomain discovery
ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt:FUZZ \
     -u https://target.com -H "Host: FUZZ.target.com" -fs SIZE

# Login bruteforce
ffuf -w /usr/share/seclists/Passwords/darkweb2017-top100.txt:FUZZ \
     -u https://target.com/login -X POST \
     -d "username=admin&password=FUZZ" -fs SIZE

# JSON API user enumeration
ffuf -w /usr/share/seclists/Usernames/top-usernames-shortlist.txt:FUZZ \
     -u https://target.com/api/users -X POST \
     -H "Content-Type: application/json" \
     -d '{"username":"FUZZ"}' -mr "exists"

# Parameter discovery
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
     -u "https://target.com/page?FUZZ=test" -fs SIZE
```

---

## 13. Mindset

> ffuf doesn't think. **You** think.

ffuf just sends requests fast. The real skill is:

1. **Picking the right wordlist** for the target
2. **Finding the right filter** to separate signal from noise
3. **Manually verifying** anything ffuf flags before reporting

Always do reconnaissance manually with `curl` first, then automate with ffuf once you understand the target.
