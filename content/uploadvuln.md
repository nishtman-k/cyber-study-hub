# Upload Vulnerabilities

> File upload features are everywhere — profile pictures, documents, attachments. When they don't properly validate what's uploaded, attackers can bypass access controls, run malicious code, or compromise the server. This covers how upload attacks work and, just as importantly, how to defend against them.

---

## 1. What is an Unrestricted File Upload?

An **unrestricted file upload** is a vulnerability where a web application lets users upload files **without properly checking** what they are. The app accepts the file based on weak or missing validation, allowing an attacker to upload something dangerous (like a script) instead of the expected file (like an image).

```
Expected:  user uploads  profile.jpg   (a harmless image)
Attack:    user uploads  shell.php      (executable server-side code)
```

If the server then **stores it somewhere reachable** and **executes it**, the attacker gains control.

---

## 2. Why Are File Uploads a Security Risk?

File uploads are risky because they let an **outsider place a file onto your server** — something normally tightly controlled. If validation is weak, the consequences are severe:

| Risk | Result |
|------|--------|
| **Remote code execution** | Upload a script → run commands on the server |
| **Web shell** | Persistent backdoor access |
| **Overwrite files** | Replace existing files (config, other users' data) |
| **Bypass access control** | Reach areas you shouldn't |
| **Stored XSS** | Upload an HTML/SVG file with malicious script |
| **Denial of service** | Upload huge files to exhaust storage/memory |
| **Malware distribution** | Host malicious files on a trusted domain |

A file upload is one of the highest-impact web vulnerabilities because it can lead directly to **full server compromise**.

---

## 3. How Upload Forms Can Be Exploited

A typical upload form sends a `multipart/form-data` POST request:

```
POST /upload HTTP/1.1
Content-Type: multipart/form-data; boundary=---X

-----X
Content-Disposition: form-data; name="file"; filename="profile.jpg"
Content-Type: image/jpeg

<file bytes here>
-----X
```

An attacker intercepts this request (e.g., with Burp Suite) and **manipulates** parts of it:
- Changes the `filename` (e.g., to `shell.php`)
- Changes the `Content-Type` header (content-type spoofing)
- Alters the file's content or its magic bytes
- Tries different extensions to slip past filters

The goal: get a file the server will **execute** into a location the attacker can **reach via a URL**.

---

## 4. What is a Web Shell?

A **web shell** is a malicious script uploaded to a server that gives an attacker **remote control** through their browser. Once uploaded and executed, it acts as a backdoor.

```
1. Attacker uploads shell.php to the server
2. Server stores it at  https://target.com/uploads/shell.php
3. Attacker visits that URL, passing commands:
       https://target.com/uploads/shell.php?cmd=whoami
4. The server runs the command and returns the output
5. Attacker now has command execution on the server
```

A web shell turns a simple upload flaw into **full command execution** — the attacker can read files, pivot deeper, steal data, or install persistence. This is why preventing executable uploads is critical.

---

## 5. MIME Types & Upload Security

A **MIME type** (Media Type) tells the browser/server what kind of file something is, e.g.:

```
image/jpeg      a JPEG image
image/png       a PNG image
text/html       an HTML page
application/pdf a PDF
application/x-php  a PHP script
```

During upload, the MIME type appears in the request's `Content-Type` header. Many weak apps **trust this header** to decide if a file is allowed.

The problem: the `Content-Type` is **supplied by the client**, so it can be faked. Relying on it for security is a mistake — which leads directly to content-type spoofing.

---

## 6. Content-Type Spoofing

**Content-type spoofing** is faking the `Content-Type` header so a malicious file appears to be an allowed type.

```
Real request (blocked):
Content-Disposition: form-data; name="file"; filename="shell.php"
Content-Type: application/x-php          ← server rejects

Spoofed request (may pass):
Content-Disposition: form-data; name="file"; filename="shell.php"
Content-Type: image/jpeg                 ← server thinks it's an image!
```

The file is still a PHP script — only the *declared* type changed. If the server checks only the `Content-Type` header (not the real content), the malicious file slips through.

**Lesson:** never trust the client-supplied MIME type. Verify the *actual* file content server-side.

---

## 7. Bypassing Client-Side Checks

Many upload forms validate in the **browser** with JavaScript (e.g., "only .jpg allowed"). This is **purely cosmetic** for security — the attacker controls their own browser and the requests it sends.

### How client-side checks are bypassed

| Technique | How |
|-----------|-----|
| **Disable JavaScript** | The check never runs |
| **Intercept the request** | Upload a valid file, then change it in Burp before it reaches the server |
| **Edit the request directly** | Craft the POST manually with any filename/content |
| **Modify the HTML form** | Remove the `accept` attribute in dev tools |

```
1. Pick a real image (passes the JS check)
2. Click upload — intercept the request in Burp
3. Change filename to shell.php and the content to PHP code
4. Forward the modified request
→ The browser's check was satisfied, but the server gets the malicious file
```

**Key principle:** client-side validation improves user experience but provides **zero security**. All real validation must happen **server-side**.

---

## 8. Common Bypass Techniques (Educational)

Understanding these helps you both test and defend. Each is a way attackers try to defeat weak filters:

### Extension tricks

```
shell.php.jpg        double extension (some servers run the .php)
shell.pHp            case variation (defeats case-sensitive blocklists)
shell.php5 / .phtml  alternate executable extensions
shell.php%00.jpg     null byte (legacy) — truncates at the null
shell.php.            trailing dot/space (stripped by some systems)
```

### Magic number / content manipulation

Servers that check the file's **magic number** (the first few bytes that identify a real file type) can be fooled by adding valid magic bytes:

```
GIF89a;<?php system($_GET['cmd']); ?>
└──┬──┘ └──────────┬──────────────┘
magic bytes      malicious PHP
(looks like a GIF) (still executes as PHP)
```

The file starts with a real GIF signature (passes magic-number checks) but still contains executable code.

### Content-Type spoofing

Covered above — fake the `Content-Type` header.

These techniques exist because filters are often **incomplete**. Robust defense requires multiple layers (below), not a single check.

---

## 9. Server-Side Validation

**Server-side validation** is the real defense — checks performed on the server that the attacker can't bypass. Effective validation combines several checks:

| Check | What it does |
|-------|-------------|
| **File extension (allow-list)** | Only permit known-safe extensions (`.jpg`, `.png`) |
| **MIME type (verified server-side)** | Detect the *real* type, don't trust the header |
| **Magic number / content inspection** | Verify the file's actual bytes match its claimed type |
| **File size limit** | Reject oversized files |
| **Filename sanitization** | Strip dangerous characters and paths |
| **Re-encoding** | Re-process images to strip embedded code |

The strongest approach uses **multiple checks together** — any single check can be bypassed, but combining them dramatically raises the bar.

---

## 10. File Extension Filtering

Controlling which extensions are allowed is one of the most important defenses.

### Allow-list vs Block-list

```
BLOCK-LIST (weak):   "reject .php, .exe, .sh ..."
   Problem: you'll always miss one (.phtml, .php5, .pht ...)

ALLOW-LIST (strong): "ONLY accept .jpg, .png, .gif"
   Anything not explicitly allowed is rejected — much safer
```

**Always use an allow-list.** It's far more secure because you define exactly what's permitted, instead of trying to guess every dangerous extension (an impossible game of whack-a-mole).

Also: validate the extension **server-side** and account for tricks like double extensions, case variations, and trailing characters.

---

## 11. File Size Limitation

Limiting upload size protects against **denial-of-service** and resource exhaustion.

```
Without limits:
  attacker uploads 50 GB file → fills disk → server crashes
  many large uploads at once → memory/bandwidth exhausted

With a sensible limit (e.g., max 5 MB for images):
  oversized uploads are rejected immediately
```

Size limits should be enforced **server-side** (client-side limits are bypassable) and set appropriately for the expected file type. This is a simple but important layer of defense.

---

## 12. Risks of Storing Files on the Same Domain

Where uploaded files are stored matters a lot.

### The same-domain problem

If user uploads are served from your **main domain**, an uploaded malicious file inherits that domain's trust:

```
https://app.com/uploads/evil.html
```

| Risk on the same domain | Why |
|-------------------------|-----|
| **Stored XSS** | An uploaded HTML/SVG runs script in your domain's context — can steal session cookies |
| **Cookie theft** | Same-origin = access to your domain's cookies |
| **Code execution** | If the dir is executable, an uploaded script runs |
| **Trust abuse** | Malware served from your trusted domain |

### The safer approach

Serve uploads from a **separate domain or dedicated storage** (e.g., a different domain, a sandboxed subdomain, or object storage like S3 with no execution). That way, even a malicious file can't access your main site's cookies or session, and can't be executed as server code.

---

## 13. File Permissions & Executable Directories

Two server-configuration defenses that are easy to overlook but very effective.

### File permissions

Uploaded files should have **minimal permissions** — readable as data, but **never executable**.

```bash
# Uploaded files should NOT be executable
chmod 644 uploaded_file        # rw-r--r--  (read/write owner, read others)
# NOT:
chmod 755 uploaded_file        # rwxr-xr-x  ← executable = dangerous
```

If an uploaded file lacks the execute bit and the server is configured not to run it, even a successfully uploaded web shell can't run.

### Why upload directories must NOT be executable

This is one of the most important defenses. If the web server can **execute scripts** in the upload directory, a malicious uploaded script runs when requested.

```
Upload dir executable:
  upload shell.php → visit /uploads/shell.php → server EXECUTES it → compromise

Upload dir NOT executable (correct):
  upload shell.php → visit /uploads/shell.php → server SERVES it as plain text
  → the PHP code is shown, NOT run → no compromise
```

### How to disable execution

```apache
# Apache — in the uploads directory's .htaccess
<Directory /var/www/uploads>
    php_admin_flag engine off
    Options -ExecCGI
    AddType text/plain .php .phtml .php5 .pht
</Directory>
```

```nginx
# Nginx — deny script execution in uploads
location /uploads/ {
    location ~ \.(php|phtml|php5|pht)$ {
        deny all;
    }
}
```

Making the upload directory non-executable means that **even if an attacker bypasses every other check** and uploads a web shell, it simply can't run — a critical last line of defense.

---

## 14. Secure File Upload Practices

A complete defense uses **multiple layers** (defense in depth). No single control is enough.

### The full checklist

```
✓ Use an ALLOW-LIST of permitted extensions (.jpg, .png ...)
✓ Validate the REAL content (magic numbers), not just the header
✓ Don't trust the client-supplied Content-Type (MIME)
✓ Enforce a maximum file SIZE (server-side)
✓ RENAME uploaded files (random names, don't keep user's filename)
✓ SANITIZE filenames (strip paths, special chars, null bytes)
✓ Store uploads OUTSIDE the webroot or on a separate domain/storage
✓ Make the upload directory NON-EXECUTABLE
✓ Set minimal FILE PERMISSIONS (never executable)
✓ RE-ENCODE images to strip embedded payloads
✓ Scan uploads with ANTIVIRUS where appropriate
✓ Do ALL validation SERVER-SIDE (client-side is UX only)
✓ Log uploads and monitor for abuse
```

### Why renaming helps

```
User uploads:  shell.php
Server stores: a8f3e9c1.jpg   (random name + safe extension)
→ Attacker can't predict the URL, and the extension is harmless
```

### The layered mindset

Each control can be bypassed individually, but **stacked together** they make a successful attack extremely difficult:

```
extension allow-list  +  content verification  +  rename
+  non-executable dir  +  separate domain  +  size limit
= even if one layer fails, the others still protect you
```

---

## 15. Testing Upload Forms (Defensive Pentesting)

How a pentester safely tests an upload feature (on authorized targets):

```
1. Upload a normal valid file — observe where it's stored, the URL
2. Try a different extension (.php, .phtml) — accepted?
3. Try content-type spoofing in Burp (change Content-Type)
4. Try double extensions (shell.php.jpg)
5. Try magic-byte tricks (GIF89a + code)
6. If a script uploads, check if it EXECUTES (the real risk)
7. Document findings + recommend the layered defenses above
```

Tools commonly used: **Burp Suite** (intercept/modify requests), **curl** (craft custom uploads), and the browser dev tools (bypass client-side checks).

```bash
# Example: crafting an upload with curl
curl -X POST https://target.com/upload \
     -F "file=@shell.php;type=image/jpeg"
```

Always test only systems you own or are authorized to assess.

---

## 16. Quick Reference

### The core vulnerability

```
Unrestricted upload = app accepts files without proper validation
→ attacker uploads a web shell
→ if stored reachably + executable = remote code execution
```

### Attack techniques (to understand & defend against)

```
Content-type spoofing   fake the Content-Type header
Client-side bypass      intercept/modify the request (Burp)
Double extension        shell.php.jpg
Case variation          shell.pHp
Magic bytes             GIF89a;<?php ... ?>
Null byte (legacy)      shell.php%00.jpg
```

### Defenses (layered — use ALL)

```
Allow-list extensions       (not block-list)
Verify real content         (magic numbers, not the header)
Server-side validation      (client-side = UX only)
Size limits                 (prevent DoS)
Rename + sanitize filenames
Store off-webroot / separate domain
Non-executable upload dir   ← critical
Minimal file permissions    (never executable)
Re-encode images
```

### The single most important rules

1. **Validate server-side** — client-side checks provide zero security
2. **Use an allow-list** — define what's permitted, don't chase what's dangerous
3. **Make upload directories non-executable** — the last line of defense; even a successful upload can't run
4. **Don't trust the Content-Type header** — verify the actual file content
5. **Store uploads separately** — keep them off your main domain and outside the webroot
