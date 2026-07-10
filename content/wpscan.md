# WPScan — WordPress Security Scanner

---

## 1. What is WPScan?

**WPScan** is a black-box vulnerability scanner specifically for **WordPress** websites. It identifies:

- WordPress version (and whether it's outdated)
- Installed themes and plugins (with versions)
- Known vulnerabilities (CVEs) for the WordPress version, themes, and plugins
- Enumerable usernames
- Weak passwords (brute-force capable)
- Misconfigurations (exposed `wp-config.php`, debug logs, etc.)

### Why it matters

WordPress powers **~40% of all websites**. Most breaches come from:
1. Outdated plugins (the #1 attack vector)
2. Weak admin passwords
3. Outdated WordPress core
4. Misconfigured themes

WPScan finds all four.

### Install

```bash
sudo apt install wpscan
wpscan --version
```

---

## 2. Get a Free API Token

WPScan's CVE database lookup requires an API token. **Get one (free) here:**

```
https://wpscan.com/register
```

Free tier: **25 API requests per day**. Without a token, WPScan still scans but doesn't cross-reference findings against the vulnerability database.

Once you have a token:

```bash
# Pass with every scan
wpscan --url https://target.com --api-token YOUR_TOKEN

# Or set as environment variable
export WPSCAN_API_TOKEN=YOUR_TOKEN
wpscan --url https://target.com
```

---

## 3. Basic Usage

```bash
wpscan --url https://target.com
```

This runs a passive scan — confirms it's WordPress, version, themes (passive only).

### Aggressive scan with enumeration

```bash
wpscan --url https://target.com \
    --enumerate vp,vt,u \
    --random-user-agent \
    --api-token YOUR_TOKEN
```

What this enables:
- `vp` = vulnerable plugins
- `vt` = vulnerable themes
- `u` = users (enumerable usernames)
- `--random-user-agent` = harder to detect

---

## 4. Enumeration Options

`--enumerate` flag controls what to enumerate. Combine with commas (e.g., `--enumerate vp,vt,u`).

| Option | What it enumerates |
|--------|-------------------|
| `vp` | **V**ulnerable **P**lugins |
| `ap` | **A**ll **P**lugins (much slower) |
| `p` | **P**opular plugins only |
| `vt` | **V**ulnerable **T**hemes |
| `at` | **A**ll **T**hemes |
| `t` | Popular themes |
| `tt` | **T**imthumb files (legacy vuln) |
| `cb` | **C**onfig **B**ackups (wp-config.php.bak etc.) |
| `dbe` | **D**B Export files |
| `u` | **U**sers |
| `m` | **M**edia (uploaded files) |

### Common combinations

```bash
# Most useful — vulnerable plugins/themes + users
wpscan --url https://target.com --enumerate vp,vt,u --api-token TOKEN

# Aggressive — find ALL plugins (catches hidden ones)
wpscan --url https://target.com --enumerate ap,at,u --api-token TOKEN --plugins-detection aggressive

# Just users (for brute-force prep)
wpscan --url https://target.com --enumerate u

# Look for accidental backups
wpscan --url https://target.com --enumerate cb,dbe
```

---

## 5. Detection Modes

WPScan has 3 detection modes for plugins/themes:

| Mode | How | Stealth | Coverage |
|------|-----|---------|----------|
| `passive` | Reads HTML for clues | High | Low |
| `mixed` (default) | Passive + light probing | Medium | Medium |
| `aggressive` | Tries every plugin path explicitly | Low (loud) | **High** |

```bash
# Find every plugin, even hidden ones
wpscan --url https://target.com --plugins-detection aggressive

# Same for themes
wpscan --url https://target.com --themes-detection aggressive
```

Aggressive mode is the most thorough but generates lots of 404 noise.

---

## 6. User Enumeration

WordPress leaks usernames in multiple places. WPScan checks them all:

```bash
wpscan --url https://target.com --enumerate u
```

How it works:
- `/?author=1`, `/?author=2`, etc. — redirects often expose usernames
- `/wp-json/wp/v2/users` — REST API leak
- RSS feeds — author info embedded
- Login error messages — "Invalid username" vs "Invalid password"

### Output example

```
[i] User(s) Identified:
[+] admin
  | Found By: Author Posts - Author Pattern (Passive Detection)
[+] john
  | Found By: Wp Json Api (Aggressive Detection)
```

Now you have usernames for password brute-forcing.

---

## 7. Password Brute Force

Once you have usernames, brute-force their passwords:

```bash
wpscan --url https://target.com \
    --usernames admin \
    --passwords /usr/share/wordlists/rockyou.txt \
    --max-threads 20
```

### Brute force multiple users

```bash
# From a file
wpscan --url https://target.com \
    --usernames users.txt \
    --passwords /usr/share/wordlists/rockyou.txt
```

### Specific login attack flag

```bash
wpscan --url https://target.com \
    --usernames admin \
    --passwords passwords.txt \
    --max-threads 10 \
    --request-timeout 30
```

⚠️ **WordPress has built-in login throttling** in most modern setups (especially with security plugins like Wordfence). Expect to be slowed or blocked quickly.

---

## 8. Stealth & Evasion

Sites with WAFs (Cloudflare, Wordfence) detect WPScan's default behavior. Mitigations:

```bash
# Random User-Agent
wpscan --url https://target.com --random-user-agent

# Specific User-Agent
wpscan --url https://target.com --user-agent "Mozilla/5.0 (X11; Linux x86_64)"

# Slow down requests
wpscan --url https://target.com --request-timeout 60 --max-threads 5

# Use a proxy (Burp Suite)
wpscan --url https://target.com --proxy http://127.0.0.1:8080

# Through Tor
wpscan --url https://target.com --proxy socks5://127.0.0.1:9050
```

### Stealth combo

```bash
wpscan --url https://target.com \
    --random-user-agent \
    --max-threads 3 \
    --request-timeout 60
```

---

## 9. Authentication

If you have credentials and want to scan as a logged-in user:

```bash
# HTTP Basic Auth
wpscan --url https://target.com --http-auth user:pass

# WordPress login cookies (grab from browser)
wpscan --url https://target.com --cookie-string "wordpress_logged_in_abc=xyz"

# Custom headers (e.g., bearer tokens)
wpscan --headers "Authorization: Bearer abc123"
```

---

## 10. Output Formats

```bash
# Save to text file
wpscan --url https://target.com --output report.txt

# JSON output (parseable)
wpscan --url https://target.com --format json --output report.json

# CLI without colors (for piping)
wpscan --url https://target.com --no-color
```

---

## 11. Practical Recipes

### Recipe 1 — Quick first-pass scan

```bash
wpscan --url https://target.com \
    --enumerate vp,vt,u \
    --random-user-agent \
    --api-token TOKEN
```

### Recipe 2 — Maximum coverage scan

```bash
wpscan --url https://target.com \
    --enumerate ap,at,u,cb,dbe \
    --plugins-detection aggressive \
    --themes-detection aggressive \
    --random-user-agent \
    --api-token TOKEN \
    --output scan.txt
```

### Recipe 3 — Brute force admin (after enumeration)

```bash
wpscan --url https://target.com \
    --usernames admin \
    --passwords /usr/share/wordlists/rockyou.txt \
    --max-threads 10
```

### Recipe 4 — Stealth scan behind WAF

```bash
wpscan --url https://target.com \
    --enumerate vp,vt,u \
    --random-user-agent \
    --max-threads 3 \
    --request-timeout 60 \
    --api-token TOKEN
```

### Recipe 5 — Recover info from a poorly-configured site

```bash
# Find accidentally exposed config backups
wpscan --url https://target.com --enumerate cb,dbe

# Plus see all files in /uploads/
wpscan --url https://target.com --enumerate m
```

---

## 12. Interpreting WPScan Output

### Headers section

Shows server tech (nginx, Apache, Cloudflare). Note if Cloudflare is in front — explains 403s during enumeration.

### WordPress version

```
[+] WordPress version 5.8.1 identified (Outdated, released on 2021-09-09)
```

Outdated = check what CVEs apply to that version. The API token gives you this automatically.

### Plugins

```
[+] Plugin: contact-form-7
 | Location: https://target.com/wp-content/plugins/contact-form-7/
 | Latest Version: 5.7.5
 | Found By: Urls In Homepage (Passive Detection)
[!] 1 vulnerability identified:
 | CVE-2023-1234: ...
```

That `[!]` is what you're looking for — a confirmed vulnerability tied to a CVE.

### Users found

```
[i] User(s) Identified:
[+] admin
[+] editor
```

Use these in brute-force.

---

## 13. Common Misconfigurations to Look For

| Finding | Severity | Fix |
|---------|----------|-----|
| Outdated WP core | 🔴 High | Update WP |
| Outdated plugins with CVEs | 🔴 High | Update or remove |
| Username `admin` enumerable | 🟡 Medium | Rename/hide |
| XML-RPC enabled | 🟡 Medium | Disable if unused |
| Directory listing enabled | 🟡 Medium | Disable in web server |
| Exposed `wp-config.php.bak` | 🔴 Critical | Delete it |
| Debug log accessible | 🟡 Medium | Move outside webroot |
| WP-Cron exposed | 🟢 Low | Use system cron |
| No security plugin / WAF | 🟡 Medium | Add one (Wordfence, etc.) |

---

## 14. Defensive Side — Hardening WordPress

If you OWN a WordPress site, here's how to make WPScan find nothing useful:

```
1. Keep WP core + plugins + themes UPDATED religiously
2. Use strong admin passwords (or just use Sign-In With Google)
3. Install a security plugin: Wordfence, Sucuri, or Solid Security
4. Limit login attempts (built into most security plugins)
5. Disable XML-RPC if you don't use it
6. Hide WP version from headers/RSS
7. Move wp-config.php outside the webroot (or restrict via .htaccess)
8. Use a CDN/WAF (Cloudflare)
9. Disable file editing in WordPress dashboard
10. Use 2FA for admin accounts
```

To disable file editing, add to `wp-config.php`:

```php
define('DISALLOW_FILE_EDIT', true);
```

---

## 15. Quick Reference

```bash
# Basic scan
wpscan --url https://target.com

# Comprehensive scan with API
wpscan --url https://target.com \
    --enumerate vp,vt,u \
    --random-user-agent \
    --api-token TOKEN

# Just enumerate users
wpscan --url https://target.com --enumerate u

# Find all plugins (loud)
wpscan --url https://target.com --enumerate ap --plugins-detection aggressive

# Brute force login
wpscan --url https://target.com \
    --usernames admin \
    --passwords /usr/share/wordlists/rockyou.txt

# JSON output
wpscan --url https://target.com --format json --output scan.json

# Behind WAF
wpscan --url https://target.com --random-user-agent --max-threads 3
```

### Three rules

1. **Always get an API token** — without it, you get findings but no CVE context
2. **Use `--enumerate vp,vt,u`** as your default — covers the high-value targets
3. **Get authorization in writing** — even for "just enumeration" against sites you don't own
