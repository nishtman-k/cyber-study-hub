# Burp Suite — Fundamentals

> **Burp Suite** is the industry-standard toolkit for web application security testing. It sits as a proxy between your browser and the target, giving you full visibility and control over every HTTP/HTTPS request and response.

> "You cannot defend what you cannot see."

---

## 1. What is Burp Suite?

Burp Suite is an integrated platform for **web application security testing**, made by PortSwigger. It's used by penetration testers and bug bounty hunters worldwide.

The core idea: Burp acts as a **man-in-the-middle proxy** between your browser and the web app. Every request your browser sends and every response the server returns passes through Burp, where you can **inspect, modify, replay, and attack**.

```
[ Your Browser ] ⇄ [ Burp Suite Proxy ] ⇄ [ Target Web App ]
                         ↑
            intercept · modify · replay · attack · scan
```

### Editions

| Edition | Cost | Key limits |
|---------|------|-----------|
| **Community** | Free | Has Proxy, Repeater, Decoder, Comparer; Intruder is throttled; no scanner |
| **Professional** | Paid | Full Intruder speed, Burp Scanner, save/restore projects |
| **Enterprise** | Paid | Automated, CI/CD scanning at scale |

Kali Linux ships with **Burp Suite Community** pre-installed.

```bash
# Launch from terminal
burpsuite
# Or find it in the Kali menu under "Web Application Analysis"
```

---

## 2. Main Components

Burp is organized into tabs, each a tool:

| Component | What it does |
|-----------|-------------|
| **Proxy** | Intercept and modify traffic between browser and target (the heart of Burp) |
| **Target** | Site map + scope definition; tree of everything discovered |
| **Repeater** | Manually resend and tweak individual requests |
| **Intruder** | Automate customized attacks (fuzzing, brute force) |
| **Scanner** | Automated vulnerability scanning (Pro only) |
| **Spider / Crawler** | Automatically map the application's content |
| **Decoder** | Encode/decode data (Base64, URL, hex, etc.) |
| **Comparer** | Diff two pieces of data (responses, requests) |
| **Sequencer** | Analyze randomness of tokens (session IDs, CSRF) |
| **Extender / BApp Store** | Add plugins to extend Burp |

The typical workflow flows between them: **Proxy** captures interesting requests → send to **Repeater** to experiment → send to **Intruder** to automate → confirm with **Scanner**.

---

## 3. Setting Up the Proxy

The proxy is the foundation — nothing works until traffic flows through Burp.

### Step 1 — Burp's proxy listener

By default Burp listens on `127.0.0.1:8080`. Check it under:

```
Proxy → Proxy settings → Proxy listeners
```

You should see `127.0.0.1:8080` running.

### Step 2 — Point your browser at Burp

Two options:

**Option A — Burp's built-in browser (easiest):**
```
Proxy → Intercept → "Open Browser"
```
This Chromium instance is pre-configured to route through Burp with the certificate already trusted. **Recommended for beginners.**

**Option B — Your own browser:**
Configure your browser (or FoxyProxy extension) to use an HTTP proxy at `127.0.0.1:8080`.

```
Firefox: Settings → Network Settings → Manual proxy
HTTP Proxy: 127.0.0.1   Port: 8080
[✓] Also use this proxy for HTTPS
```

### Step 3 — Test it

Browse to any site. In Burp's **Proxy → HTTP history**, you should see the requests appearing. If you do, the proxy works.

---

## 4. Configuring Burp for HTTPS Traffic

By default, HTTPS sites will throw certificate errors because Burp intercepts (decrypts) the encrypted traffic. To fix this, you install **Burp's CA certificate** in your browser so it trusts Burp as the man-in-the-middle.

### Why this is needed

HTTPS encrypts traffic end-to-end. For Burp to read/modify it, Burp decrypts the traffic, then re-encrypts it with **its own certificate**. Your browser must trust that certificate, or it warns you of a "man-in-the-middle."

### Install Burp's CA certificate

```
1. With the proxy running, browse to:  http://burp
2. Click "CA Certificate" (top right) → downloads cacert.der
3. Import it into your browser as a trusted Certificate Authority:

   Firefox: Settings → Privacy & Security → Certificates →
            View Certificates → Authorities → Import →
            select cacert.der → [✓] Trust for websites

   Chrome:  Settings → Privacy → Security → Manage certificates →
            Authorities → Import
```

After importing, HTTPS sites load cleanly through Burp and you can inspect their decrypted traffic.

**Note:** If you use Burp's built-in browser (Option A above), the certificate is **already trusted** — you can skip this step entirely.

---

## 5. Proxy — Intercept & Modify Traffic

The Proxy is where you capture and tamper with live requests.

### Intercept mode

```
Proxy → Intercept
```

- **Intercept ON** → every request pauses, waiting for you to "Forward," "Drop," or modify it
- **Intercept OFF** → traffic flows freely but is still logged in HTTP history

### Working with an intercepted request

```
GET /login?user=admin HTTP/1.1
Host: web0x02.hbtn
...
```

While intercepted, you can:
- Edit any part (URL, headers, parameters, body)
- **Forward** — send the (modified) request onward
- **Drop** — discard it
- Right-click → **Send to Repeater / Intruder**

### HTTP history

```
Proxy → HTTP history
```

A full log of every request/response that passed through Burp. Click any entry to see the full request and response. This is where you hunt for interesting endpoints.

### Match and replace

Automatically rewrite parts of every request/response (e.g., change User-Agent on the fly):

```
Proxy → Proxy settings → Match and replace
```

---

## 6. Target & Scope

### Site map

```
Target → Site map
```

A tree of every host, directory, and file Burp has seen — built passively as you browse and actively when you crawl. Shows discovered endpoints, parameters, and responses.

### Defining scope

**Always set your scope** to avoid accidentally attacking out-of-bounds hosts:

```
Target → Scope → Add → https://web0x02.hbtn
```

Then enable **"Show only in-scope items"** and configure Burp to **drop out-of-scope traffic**. This keeps your testing legal and focused, and stops your HTTP history filling with noise (analytics, ads, CDNs).

---

## 7. Spider / Crawler — Mapping the App

The **Spider** (called the **Crawler** in newer Burp versions) automatically discovers content by following links and submitting forms.

### How Spider works

```
1. Starts from a seed URL (e.g., the homepage)
2. Parses the response for links, forms, and resources
3. Follows each link → fetches that page
4. Parses THAT page for more links
5. Repeats recursively until it has mapped the whole site
6. Adds everything to the Target site map
```

It's essentially **recursive web crawling** — the same concept as crawling in general, but focused on building a complete map of the application's attack surface (pages, parameters, forms, hidden endpoints).

### Running it

```
Right-click a host in Target → Site map → "Spider this host"
   (or in newer Burp: "Crawl")
```

Spider can also **auto-submit forms** (with junk or specified data) to reach pages behind forms. Be careful — this can create accounts, post data, or trigger actions on the target.

---

## 8. Repeater — Manual Request Manipulation

**Repeater** lets you take a single request, modify it, and resend it as many times as you want — watching how the response changes.

### Purpose

It's your manual experimentation lab. Perfect for:
- Testing how a parameter affects the response
- Manually probing for SQL injection, XSS, IDOR
- Tweaking headers, cookies, methods
- Understanding application logic

### Workflow

```
1. In Proxy HTTP history, right-click an interesting request
2. "Send to Repeater"
3. Switch to the Repeater tab
4. Modify the request (change a parameter, header, etc.)
5. Click "Send"
6. Read the response on the right
7. Repeat — tweak and resend endlessly
```

### Example — manual SQLi test

```
Original:   GET /product?id=2
Try:        GET /product?id=2'           → SQL error? (injectable!)
Try:        GET /product?id=2 OR 1=1     → returns all products?
Try:        GET /product?id=2 AND 1=2    → returns nothing?
```

Each "Send" shows the response immediately, so you learn exactly how the app reacts to each change.

---

## 9. Intruder — Automated Attacks

**Intruder** automates sending many customized requests — for fuzzing, brute-forcing, and enumeration. You mark **positions** in a request and supply **payloads** to inject there.

> ⚠️ In Burp Community, Intruder is **heavily throttled** (slow). Pro removes the limit.

### Workflow

```
1. Send a request to Intruder (right-click → "Send to Intruder")
2. Positions tab → mark where payloads go with § markers
3. Payloads tab → load a wordlist or define a payload set
4. Click "Start attack"
5. Review results — sort by status code / response length
```

### Attack types

| Type | How payloads are placed | Use case |
|------|------------------------|----------|
| **Sniper** | One position at a time, one payload set | Test a single field (most common) |
| **Battering ram** | Same payload in all positions | Same value everywhere |
| **Pitchfork** | Multiple sets in parallel (1st with 1st, 2nd with 2nd) | Paired data (user+pass lists in lockstep) |
| **Cluster bomb** | Every combination of multiple sets | Brute force (every user × every password) |

### Example — login brute force (Cluster bomb)

```
POST /login
username=§admin§&password=§password§
                ↑              ↑
          payload set 1   payload set 2
          (usernames)     (passwords)

→ Cluster bomb tries every username with every password
→ Sort results by response length — the successful login
  usually has a different length (redirect / dashboard)
```

### Reading Intruder results

Look for the **anomaly**: a different status code (302 vs 200), a different response length, or a different time. That outlier is usually your hit (valid credential, injectable parameter, existing user).

---

## 10. Burp Scanner — Automated Vulnerability Scanning

**Burp Scanner** (Pro only) automatically crawls and audits a target for vulnerabilities.

### What it does

- **Crawls** the application to map content
- **Audits** each request for vulnerabilities by sending crafted probes
- Reports findings with severity, confidence, and remediation advice

### When to use it

| Use Scanner when... | Use manual tools when... |
|---------------------|--------------------------|
| You need broad coverage fast | You're testing specific logic |
| Confirming common vuln classes | Hunting subtle/business-logic flaws |
| You have Pro and authorization | You're on Community edition |

### Two scan modes

```
- Crawl only          → just map the site
- Crawl and audit     → map + actively test for vulnerabilities
```

### What Scanner can find

SQL injection, XSS, command injection, path traversal, CSRF, insecure headers, SSL/TLS issues, information disclosure, and many more.

**Important:** automated scanners produce **false positives**. Always manually verify findings (using Repeater) before reporting them.

---

## 11. Common Issues Burp Can Identify

Burp (via Scanner, or manually via Proxy/Repeater/Intruder) helps find:

| Vulnerability | How Burp helps |
|---------------|----------------|
| **SQL Injection** | Repeater (manual `'`/`OR 1=1`), Scanner (automated) |
| **XSS** | Inject script payloads, observe reflection |
| **Authentication weaknesses** | Intruder brute force, session analysis |
| **IDOR** | Repeater — change object IDs |
| **CSRF** | Check for missing/weak anti-CSRF tokens |
| **Input validation flaws** | Intruder fuzzing with bad input |
| **Session token weakness** | Sequencer — test randomness |
| **Security misconfiguration** | Inspect headers, error messages |
| **Information disclosure** | Read responses, error stack traces |
| **Insecure HTTP headers** | Proxy/Scanner header analysis |

This maps directly to the **OWASP Top 10** — Burp is the go-to tool for testing each category.

---

## 12. Interpreting Results

Reading Burp's output is a skill. Focus on **differences and anomalies**:

### In responses, watch for

- **Status codes**: `200` (OK), `302` (redirect — often a successful login), `403` (forbidden — exists but blocked), `500` (server error — may leak a stack trace or confirm injection)
- **Response length**: an outlier length in Intruder usually marks the interesting result
- **Response time**: a long delay can confirm **time-based blind SQL injection** (`SLEEP(5)`)
- **Error messages**: SQL errors, stack traces, framework info = information disclosure + injection clues
- **Reflected input**: your payload appearing in the response = potential XSS

### Severity & confidence (Scanner)

Burp rates findings by **severity** (High/Medium/Low/Info) and **confidence** (Certain/Firm/Tentative). Prioritize High + Certain, but **manually verify everything** — scanners get things wrong.

### The golden rule

```
Automated finding → reproduce it manually in Repeater → confirm → report
```

Never report a vulnerability you haven't manually confirmed.

---

## 13. A Typical Burp Workflow

Putting it all together against a target like `https://web0x02.hbtn`:

```
1. SETUP
   - Launch Burp, open built-in browser (cert pre-trusted)
   - Set scope: Target → Scope → add https://web0x02.hbtn

2. MAP
   - Browse the app manually (proxy logs everything)
   - Crawl/Spider the host to fill the site map

3. ANALYZE
   - Review HTTP history for interesting endpoints
   - Note parameters, login forms, API calls

4. PROBE (manual)
   - Send interesting requests to Repeater
   - Test parameters for SQLi, XSS, IDOR by hand

5. AUTOMATE
   - Send login to Intruder → brute force / fuzz
   - Sort results by length/status to find hits

6. SCAN (if Pro + authorized)
   - Crawl and audit for broad vulnerability coverage

7. VERIFY
   - Reproduce every finding manually in Repeater

8. REPORT
   - Document: vulnerability, request/response evidence,
     impact, and remediation
```

---

## 14. Useful Tips & Shortcuts

```
Ctrl+R          Send request to Repeater
Ctrl+I          Send request to Intruder
Ctrl+Shift+B    Send to Decoder (selection)
Ctrl+Space      Send request in Repeater (issue request)
```

| Tip | Why |
|-----|-----|
| Always **set scope first** | Keeps testing legal and history clean |
| Use the **built-in browser** | No cert setup, isolated session |
| **Drop out-of-scope** traffic | Avoid attacking third parties |
| Turn **Intercept OFF** while browsing | Less interruption; history still records |
| Use **Comparer** on two responses | Spot subtle differences |
| Use **Decoder** for tokens | Decode Base64/URL/JWT payloads |
| Save work (Pro) | Community can't save projects |

---

## 15. Quick Reference

### Component → purpose

```
Proxy      → intercept & modify traffic (the core)
Target     → site map + scope
Repeater   → manually resend & tweak one request
Intruder   → automate attacks (fuzz, brute force)
Scanner    → automated vuln scanning (Pro)
Spider     → crawl & map the app
Decoder    → encode/decode data
Comparer   → diff two items
Sequencer  → test token randomness
```

### Setup checklist

```
1. Launch Burp (burpsuite)
2. Open built-in browser (Proxy → Open Browser)
   — OR set browser proxy to 127.0.0.1:8080
3. For own browser + HTTPS: install CA cert from http://burp
4. Set scope (Target → Scope → add target)
5. Browse → traffic appears in Proxy → HTTP history
```

### Intruder attack types

```
Sniper         → 1 position, 1 list (single field)
Battering ram  → same payload, all positions
Pitchfork      → parallel lists (paired)
Cluster bomb   → all combinations (brute force)
```

### Three rules

1. **Set your scope** before you touch anything — stay legal and focused
2. **Manually verify** every automated finding before reporting it
3. **Get written authorization** — Burp actively attacks targets; only test what you're allowed to (`web0x02.hbtn`, your own labs, or PortSwigger's Web Security Academy)
