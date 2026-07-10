# Gobuster — Directory, DNS & VHost Brute-Forcer

---

## 1. What is Gobuster?

**Gobuster** is a fast brute-forcing tool written in Go. It's used for:

- **Directory / file discovery** on web servers
- **DNS subdomain** enumeration
- **Virtual host** discovery (Host header)
- **AWS S3 / GCS bucket** discovery
- **Generic fuzzing**

It's a close cousin of ffuf — similar use cases, slightly different syntax. Both are widely used; many pentesters carry both.

### Install

```bash
sudo apt install gobuster
gobuster version
```

---

## 2. The Modes

| Mode | Use | Command |
|------|-----|---------|
| `dir` | Files / directories | `gobuster dir -u URL -w wordlist` |
| `dns` | DNS subdomains | `gobuster dns -d domain -w wordlist` |
| `vhost` | Virtual hosts via Host header | `gobuster vhost -u URL -w wordlist` |
| `fuzz` | Generic FUZZ-keyword fuzzing | `gobuster fuzz -u URL -w wordlist` |
| `s3` | AWS S3 buckets | `gobuster s3 -w wordlist` |
| `gcs` | Google Cloud buckets | `gobuster gcs -w wordlist` |

---

## 3. Directory Mode — `dir`

The most common use — finding hidden paths on a web server.

### Basic syntax

```bash
gobuster dir -u http://target.com -w /usr/share/seclists/Discovery/Web-Content/common.txt
```

### Common flags

| Flag | Purpose |
|------|---------|
| `-u URL` | Target URL |
| `-w wordlist` | Wordlist file |
| `-k` | Ignore SSL certificate errors |
| `-t 50` | Threads (default 10) |
| `-x ext` | Extensions: `-x php,html,txt,bak` |
| `-s 200,301,302` | Show only these status codes |
| `-b 404,403` | Hide these status codes (blacklist) |
| `--exclude-length 1234` | Hide responses of size 1234 |
| `--exclude-length 100-200` | Hide responses in size range |
| `-r` | Follow redirects |
| `-o file` | Output to file |
| `-q` | Quiet (no banner) |
| `-z` | No status codes in output |
| `-e` | Show full URL in output |
| `-c "cookie"` | Send cookies |
| `-H "Header: value"` | Custom headers |
| `-a "User-Agent"` | Custom user agent |
| `-U user -P pass` | HTTP basic auth |
| `--timeout 10s` | Request timeout |

### Practical recipes

```bash
# Standard scan with extensions
gobuster dir -u http://target.com -w wordlist.txt -x php,html,txt -k

# Hide 404s and 403s
gobuster dir -u http://target.com -w wordlist.txt -b 404,403

# Filter by response length (the most powerful filter)
gobuster dir -u http://target.com -w wordlist.txt --exclude-length 1234

# Fast scan with more threads
gobuster dir -u http://target.com -w wordlist.txt -t 50

# Save results
gobuster dir -u http://target.com -w wordlist.txt -o results.txt -q

# Behind authentication
gobuster dir -u http://target.com -w wordlist.txt -c "PHPSESSID=abc123"

# Stealthy with custom UA
gobuster dir -u http://target.com -w wordlist.txt -a "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"

# Show only specific statuses
gobuster dir -u http://target.com -w wordlist.txt -s 200,204,301,302,403
```

---

## 4. DNS Mode — `dns`

Find subdomains by brute-forcing DNS queries.

```bash
gobuster dns -d target.com -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt
```

### Useful flags

| Flag | Purpose |
|------|---------|
| `-d domain` | Base domain |
| `-r resolver` | Custom DNS server (e.g., `-r 8.8.8.8`) |
| `-i` | Show IPs in output |
| `--wildcard` | Continue even if wildcard DNS is detected |
| `--timeout 5s` | DNS query timeout |

### Practical examples

```bash
# Basic subdomain brute force
gobuster dns -d target.com -w wordlist.txt

# Show IPs
gobuster dns -d target.com -w wordlist.txt -i

# Use Google's DNS
gobuster dns -d target.com -w wordlist.txt -r 8.8.8.8

# Fast scan
gobuster dns -d target.com -w wordlist.txt -t 50

# Save to file
gobuster dns -d target.com -w wordlist.txt -o subdomains.txt
```

---

## 5. VHost Mode — `vhost`

Discover **virtual hosts** — different sites served from the same IP based on the Host header.

### Basic syntax

```bash
gobuster vhost -u http://target.com -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt --append-domain
```

`--append-domain` automatically appends the base domain to each wordlist entry.

### When to use vhost vs dns mode

| | **DNS mode** | **VHost mode** |
|---|--------------|----------------|
| **Resolves DNS first** | Yes (only works if DNS records exist) | No (works even without DNS) |
| **Tests via** | DNS query | HTTP Host header |
| **Finds** | Subdomains with DNS records | All virtual hosts on the IP |
| **Best when** | Discovering all subdomains | Bypassing DNS for hidden sites |

```bash
# Filter by response size to detect real vhosts
gobuster vhost -u http://target.com -w wordlist.txt --append-domain --exclude-length 1234 -k
```

---

## 6. Fuzz Mode — `fuzz`

Generic fuzzing like ffuf — uses `FUZZ` as a placeholder.

```bash
gobuster fuzz -u "http://target.com/page?id=FUZZ" -w wordlist.txt
```

Use this when `dir` mode doesn't fit (e.g., fuzzing query parameters, headers).

---

## 7. Practical Workflow Examples

### Recipe 1 — Initial web recon

```bash
# Quick scan with common.txt
gobuster dir -u http://target.com -w /usr/share/seclists/Discovery/Web-Content/common.txt -t 50 -k

# If nothing found, escalate to bigger wordlist
gobuster dir -u http://target.com -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt -t 50 -k -b 404
```

### Recipe 2 — Fuzz with extensions for a specific tech stack

```bash
# PHP application
gobuster dir -u http://target.com -w wordlist.txt -x php,php.bak,phps,inc -k

# ASP.NET
gobuster dir -u http://target.com -w wordlist.txt -x aspx,asp,config,old -k

# Java
gobuster dir -u http://target.com -w wordlist.txt -x jsp,do,action,war -k

# Backup files
gobuster dir -u http://target.com -w wordlist.txt -x bak,old,backup,zip,tar.gz -k
```

### Recipe 3 — Authenticated scan

```bash
# Get the session cookie from your browser first
gobuster dir -u http://target.com -w wordlist.txt -c "session=abc123; auth=token" -k
```

### Recipe 4 — Subdomain discovery

```bash
# DNS brute force
gobuster dns -d target.com -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -i

# Then verify with vhost (some subdomains don't have DNS but exist as vhosts)
gobuster vhost -u http://target.com -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt --append-domain -k --exclude-length BASELINE_SIZE
```

### Recipe 5 — Find backup files

```bash
# Use a wordlist of common file names + bak extensions
gobuster dir -u http://target.com -w /usr/share/seclists/Discovery/Web-Content/common.txt -x bak,old,backup,zip,tar.gz,7z,rar
```

---

## 8. Wordlist Picks

Same SecLists paths as ffuf:

```bash
# Directory discovery — start here
/usr/share/seclists/Discovery/Web-Content/common.txt              # 4,600 entries
/usr/share/seclists/Discovery/Web-Content/raft-small-words.txt    # 13,000

# More aggressive
/usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt   # 220,000
/usr/share/seclists/Discovery/Web-Content/raft-medium-words.txt           # 30,000

# Subdomains
/usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt    # 5,000
/usr/share/seclists/Discovery/DNS/subdomains-top1million-110000.txt  # 110,000

# Backup files
/usr/share/seclists/Discovery/Web-Content/raft-small-extensions.txt
```

---

## 9. Filtering Strategy

The biggest skill in any fuzzing tool: **filtering noise**.

### The baseline approach

1. Make ONE manual request to confirm what "doesn't exist" looks like
2. Note the response size / status code
3. Filter that out

```bash
# Step 1: probe a random URL to see what 404-equivalent looks like
curl -kI http://target.com/asdfqwerty1234

# Note the size or status
# If 404 returns 1234 bytes:

gobuster dir -u http://target.com -w wordlist.txt --exclude-length 1234
```

### When many responses are the same size

The app might serve a generic "page not found" page that returns 200 OK with the same size for every invalid URL. The `--exclude-length` filter is critical here.

### Hide common noise

```bash
gobuster dir -u http://target.com -w wordlist.txt \
    -b 404,400,403 \
    --exclude-length 1234,5678 \
    -k
```

---

## 10. Gobuster vs ffuf

| | **gobuster** | **ffuf** |
|---|--------------|----------|
| **Best at** | Directory + DNS + vhost (specialized modes) | Generic fuzzing (any URL part) |
| **Multiple wordlists** | No | Yes (with custom keywords) |
| **FUZZ placeholder anywhere** | No | Yes |
| **POST body fuzzing** | Limited | Excellent |
| **Headers as FUZZ targets** | Limited | Yes |
| **Speed** | Fast | Fast |
| **Auto-calibration** | No | Yes (`-ac`) |
| **Best for** | Quick web/DNS recon | Complex fuzzing scenarios |

**My pick:**
- gobuster for **directory + DNS brute force**
- ffuf for **login forms, JSON APIs, headers, multi-wordlist combos**

Many pros use both — same techniques, different tool depending on the situation.

---

## 11. Common Mistakes

| Mistake | Fix |
|---------|-----|
| Forgetting `-k` on HTTPS | Add `-k` to skip cert check |
| Too many threads → rate limited | Lower `-t` or add timeout |
| No filtering → wall of noise | Use `--exclude-length` |
| Wrong wordlist for the tech | Match wordlist to target stack |
| Forgetting extensions | Use `-x php,html,txt` |
| Using DNS mode when subdomain has no DNS | Switch to vhost mode |

---

## 12. Quick Reference

```bash
# Standard directory scan
gobuster dir -u http://target.com -w /usr/share/seclists/Discovery/Web-Content/common.txt -k -b 404

# With extensions
gobuster dir -u http://target.com -w wordlist.txt -x php,html,bak -k

# Subdomain DNS
gobuster dns -d target.com -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -i

# Subdomain vhost
gobuster vhost -u http://target.com -w wordlist.txt --append-domain -k --exclude-length SIZE

# With authentication
gobuster dir -u http://target.com -w wordlist.txt -c "session=abc123"

# Save results
gobuster dir -u http://target.com -w wordlist.txt -o results.txt -q

# Fuzz a parameter
gobuster fuzz -u "http://target.com/page?id=FUZZ" -w wordlist.txt
```

### Three rules

1. **Filter aggressively** — `--exclude-length` is your best friend
2. **Match wordlist to target** — PHP site → PHP extensions
3. **Be polite** — `-t 10` on production sites, save the aggressive scans for VMs you own
