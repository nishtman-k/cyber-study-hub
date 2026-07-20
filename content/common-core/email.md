# Email Security Protocols — SPF, DKIM & DMARC

---

## 1. Why Email Authentication Matters

Email was designed in the 1970s with **no authentication**. Anyone can claim to send from any address — like writing any return address on a postcard. That's why we need SPF, DKIM, and DMARC.

### The threats they defend against

| Threat | What it is |
|--------|-----------|
| **Email spoofing** | Forging the sender address in the email (the visible "From" field) |
| **Domain impersonation** | Pretending to send from a real domain (`paypal.com`, `yourbank.com`) |
| **Phishing** | Fooling recipients into clicking malicious links / sharing credentials |
| **Business Email Compromise (BEC)** | Impersonating executives to authorize wire transfers |
| **Spam reputation damage** | Attackers using your domain to spam → your real emails go to spam |

### Spoofing vs domain impersonation

- **Spoofing** — forging the `From:` header. SPF/DKIM/DMARC stop this.
- **Domain impersonation** — registering `paypa1.com` (with a "1") to look real. These protocols can't stop this — only user training + filters can.

---

## 2. The Three Protocols in 30 Seconds

| | What it checks |
|---|----------------|
| **SPF** | "Did this server have permission to send for this domain?" |
| **DKIM** | "Was this email cryptographically signed and unchanged?" |
| **DMARC** | "What should I do when SPF/DKIM fail? And tell me about failures." |

```
SPF  → Authorizes WHICH servers can send
DKIM → Cryptographically signs the message
DMARC → Policy + reporting layer on top of SPF and DKIM
```

You need **all three** for solid protection.

### How they fit together

```
1. Sender's mail server sends an email
2. Receiving server checks:
       a. SPF  — was the IP authorized?
       b. DKIM — is the signature valid?
       c. DMARC — does at least one pass AND align with From:?
3. Based on DMARC policy (none / quarantine / reject):
       - Pass: deliver
       - Fail: deliver / spam folder / reject
4. Receiver sends aggregate reports back to the domain owner
```

---

## 3. SPF — Sender Policy Framework

**SPF** is a DNS TXT record that lists which IP addresses or servers are authorized to send mail for your domain.

### How it works

```
1. Receiver sees email from "user@example.com"
2. Receiver looks up DNS TXT record for example.com
3. Receiver checks: is the sending IP allowed in the SPF record?
4. Result: pass, fail, softfail, neutral, etc.
```

### SPF record syntax

Example:

```
example.com.  IN  TXT  "v=spf1 ip4:203.0.113.5 include:_spf.google.com ~all"
```

Breaks down as:

| Part | Meaning |
|------|---------|
| `v=spf1` | SPF version 1 (required, always first) |
| `ip4:203.0.113.5` | This specific IPv4 is allowed |
| `include:_spf.google.com` | Also include rules from Google's SPF record |
| `~all` | Soft-fail any other sender |

### SPF mechanisms

| Mechanism | What it authorizes | Example |
|-----------|-------------------|---------|
| `ip4:` | A specific IPv4 address or range | `ip4:203.0.113.5` or `ip4:203.0.113.0/24` |
| `ip6:` | A specific IPv6 address or range | `ip6:2001:db8::/32` |
| `a` | Any IP listed as A record of the domain | `a` or `a:mail.example.com` |
| `mx` | Any IP listed as MX record of the domain | `mx` |
| `include:` | Inherit rules from another domain's SPF | `include:_spf.google.com` |
| `exists:` | The domain has any A record (used in macros) | rare |
| `ptr` | Reverse DNS match | **deprecated — don't use** |
| `all` | Catches everything not matched above | Always last, with a qualifier |

### SPF qualifiers

Each mechanism can have a prefix that says what to do if it matches:

| Qualifier | Meaning | Result |
|-----------|---------|--------|
| `+` (default) | Pass — explicitly authorize | Pass |
| `-` | Fail — reject hard | Fail |
| `~` | SoftFail — suspicious, accept but mark | SoftFail |
| `?` | Neutral — make no judgment | Neutral |

Examples:

```
+ip4:203.0.113.5    same as  ip4:203.0.113.5   (pass)
-all                 fail anything not matched (strict)
~all                 softfail anything not matched (recommended start)
```

### SPF results

| Result | What it means |
|--------|--------------|
| `pass` | The IP is authorized |
| `fail` | The IP is explicitly NOT authorized (hard fail) |
| `softfail` | Probably not authorized but don't reject |
| `neutral` | Domain owner makes no statement |
| `none` | No SPF record exists for the domain |
| `permerror` | Permanent error (invalid syntax) |
| `temperror` | Temporary error (DNS issue) |

### The `-all` debate

- `-all` (hard fail) — most secure, but breaks forwarding
- `~all` (softfail) — recommended start; works with forwarders but less strict
- `?all` (neutral) — useless, just don't
- `+all` — **CRITICAL DANGER** — allows the WHOLE INTERNET to send as you. Never use.

### The 10 DNS lookup limit

SPF records can recursively include other SPF records. To prevent abuse, **you're limited to 10 DNS lookups per SPF evaluation**. Exceed it → `permerror`.

Mechanisms that count: `include:`, `a`, `mx`, `ptr`, `exists:`, `redirect=`

Common cause of breakage: stacking lots of `include:` for SaaS tools (Mailchimp, Google Workspace, Salesforce, etc.). Each one is a lookup.

**Mitigation:**
- Use SPF flattening services (replace `include:` with hardcoded `ip4:` lists)
- Reduce number of email-sending services
- Use subdomains for some senders (`marketing.example.com`)

### Why SPF breaks email forwarding

```
1. alice@example.com sends to forward@othersite.com
2. othersite.com forwards to bob@bobsite.com
3. bobsite.com receives email "from alice@example.com" but coming from othersite.com's IP
4. SPF check: othersite.com is NOT in example.com's SPF record
5. SPF fails ❌
```

This is one of SPF's biggest weaknesses. DKIM survives forwarding — see next section.

### Test SPF records

```bash
# Look up SPF record
dig +short TXT example.com | grep spf

# Or use:
nslookup -type=TXT example.com
host -t TXT example.com
```

Use online tools like the Kitterman SPF Validator to validate syntax and lookup counts.

---

## 4. DKIM — DomainKeys Identified Mail

**DKIM** cryptographically signs outgoing emails with the sender's private key. Receivers verify the signature using the public key published in DNS.

### How DKIM differs from SPF

| | **SPF** | **DKIM** |
|---|---------|----------|
| **Checks** | Sender IP | Cryptographic signature |
| **Verifies** | Server authorization | Message integrity + origin |
| **Survives forwarding?** | ❌ No | ✅ Yes |
| **Cryptography** | None | RSA / Ed25519 signatures |
| **Key in DNS?** | No (just IPs) | Yes (public key) |

### The DKIM signing process

```
1. Sending server takes the email (specific headers + body)
2. Hashes them
3. Signs the hash with the domain's PRIVATE key
4. Adds a header: DKIM-Signature: v=1; a=rsa-sha256; d=example.com; s=mail; ...
5. Sends the email
```

### The DKIM verification process

```
1. Receiver sees DKIM-Signature header
2. Extracts d= (domain) and s= (selector) values
3. Looks up DNS: <selector>._domainkey.<domain>  → gets PUBLIC key
4. Re-hashes the same headers + body
5. Verifies the signature using the public key
6. Match → DKIM pass. Mismatch → DKIM fail.
```

### DKIM signature header — anatomy

```
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
    d=example.com; s=mail2024; t=1716700000;
    h=From:To:Subject:Date;
    bh=base64hashofbody==;
    b=base64signature==
```

| Tag | Meaning |
|-----|---------|
| `v=` | DKIM version (1) |
| `a=` | Algorithm (`rsa-sha256` standard, `ed25519-sha256` modern) |
| `c=` | Canonicalization (header/body) |
| `d=` | Signing domain |
| `s=` | Selector (which key to use) |
| `t=` | Timestamp |
| `h=` | Which headers were signed |
| `bh=` | Body hash |
| `b=` | The actual signature |

### What's a DKIM selector?

A **selector** lets you have multiple DKIM keys per domain — useful for key rotation, separate keys per service, or testing.

The public key DNS record uses this pattern:

```
<selector>._domainkey.<domain>     TXT     "v=DKIM1; k=rsa; p=<public_key>"
```

Examples:

```
mail2024._domainkey.example.com   → key used in 2024
google._domainkey.example.com     → key Google uses to sign your email
mailchimp._domainkey.example.com  → key Mailchimp uses
```

In the DKIM-Signature header you'd see `s=mail2024; d=example.com`, and the receiver looks up `mail2024._domainkey.example.com`.

### DKIM canonicalization

When DKIM signs, it has to be tolerant to small formatting changes from mail servers. Canonicalization defines what counts as a "match."

| Method | Behavior |
|--------|----------|
| `simple/simple` | Strict — even one whitespace change breaks signature |
| `relaxed/relaxed` | **Default and recommended** — tolerates whitespace and minor header changes |
| `simple/relaxed` or `relaxed/simple` | Mixed (header method / body method) |

The format is **header-canonicalization/body-canonicalization**.

### Generating DKIM keys

```bash
# Generate a 2048-bit RSA key pair
openssl genrsa -out private.key 2048

# Extract the public key (in PKCS8 format)
openssl rsa -in private.key -pubout -outform PEM | \
    grep -v "PUBLIC KEY" | tr -d '\n'
```

The public key output goes into your DNS record. Private key stays on your mail server.

### Recommended key sizes

| Key size | Security | Notes |
|----------|----------|-------|
| 1024-bit RSA | ⚠️ Deprecated | Some old systems still use it; too weak |
| **2048-bit RSA** | ✅ Standard | Industry minimum, recommended |
| 4096-bit RSA | ✅ Maximum | Some DNS providers reject (record too large) |
| Ed25519 | ✅ Modern | Smaller, faster, but not universally supported |

### DKIM DNS record format

```
mail2024._domainkey.example.com.  IN  TXT  "v=DKIM1; k=rsa; p=MIIBIjANBgkqhk..."
```

| Tag | Meaning |
|-----|---------|
| `v=DKIM1` | Version |
| `k=rsa` | Key type (or `ed25519`) |
| `p=` | The public key (base64) |
| `s=email` | Service type (optional) |
| `t=y` | Test mode (optional) |

### DKIM key rotation

Best practice: rotate DKIM keys every **6–12 months**. Process:

```
1. Create new selector (e.g., mail2025) with new key
2. Publish new public key in DNS
3. Configure mail server to sign with new key
4. Verify everything works
5. Wait 1-2 weeks (let any in-transit mail be verified)
6. Delete old DNS record
```

You never directly "replace" — you publish a new selector and retire the old one.

### Test DKIM

```bash
# Look up a DKIM record
dig +short TXT mail2024._domainkey.example.com

# Common Google Workspace selector
dig +short TXT google._domainkey.example.com
```

---

## 5. DMARC — Domain-Based Message Authentication, Reporting & Conformance

**DMARC** ties SPF and DKIM together with a **policy** ("what to do on failure") and **reporting** ("tell me about failures").

### Without DMARC

SPF and DKIM produce results, but each receiver decides what to do. Inconsistent enforcement. No visibility.

### With DMARC

You publish a DMARC policy saying:
- "If SPF and DKIM both fail, **reject** the email."
- "Send me a daily report of all email claiming to be from my domain."

### DMARC record example

```
_dmarc.example.com.  IN  TXT  "v=DMARC1; p=reject; rua=mailto:dmarc@example.com; sp=reject; adkim=s; aspf=s; pct=100"
```

### DMARC tags

| Tag | Required? | Meaning |
|-----|-----------|---------|
| `v=DMARC1` | ✅ Required | Version (always `DMARC1`) |
| `p=` | ✅ Required | Policy: `none`, `quarantine`, or `reject` |
| `sp=` | Optional | Subdomain policy (defaults to `p` value) |
| `rua=` | Optional | Where to send aggregate reports (`mailto:...`) |
| `ruf=` | Optional | Where to send forensic reports |
| `pct=` | Optional | Percentage of messages to apply policy to (0-100) |
| `adkim=` | Optional | DKIM alignment: `s` (strict) or `r` (relaxed, default) |
| `aspf=` | Optional | SPF alignment: `s` (strict) or `r` (relaxed, default) |
| `fo=` | Optional | When to generate forensic reports |
| `rf=` | Optional | Report format |
| `ri=` | Optional | Report interval (default 86400 = 1 day) |

### DMARC policy levels

| Policy | What receivers do | When to use |
|--------|-------------------|-------------|
| **`p=none`** | Monitor mode — collect reports, deliver normally | **Always start here** for 1-3 months |
| **`p=quarantine`** | Failed mail goes to spam/junk folder | Once monitoring shows your legitimate mail is aligned |
| **`p=reject`** | Failed mail is bounced/rejected entirely | Final state — highest protection |

### DMARC alignment — the key concept

DMARC doesn't just trust SPF/DKIM passes — they must also **align** with the `From:` header domain.

#### SPF alignment

- Email says it's from `info@example.com` (`From:` header)
- SPF passed for `mail.example.com`
- **Relaxed alignment** (`aspf=r`, default): pass — same root domain
- **Strict alignment** (`aspf=s`): fail — exact match needed

#### DKIM alignment

- DKIM signature has `d=example.com`
- Email says it's from `info@example.com`
- Aligned if `d=` matches `From:` domain (relaxed) or matches exactly (strict)

### Conditions for DMARC pass

DMARC passes if **AT LEAST ONE** of these is true:

1. **SPF passes AND aligns** with the `From:` domain
2. **DKIM passes AND aligns** with the `From:` domain

If both fail OR if both pass but neither aligns, DMARC fails.

### Why this matters

If you forward email, SPF often fails — but DKIM passes (forwarding doesn't break the signature). DMARC sees that DKIM passed AND aligned, so the email is allowed through. This is why DKIM is forwarding-friendly.

### The `pct` tag — gradual rollout

```
v=DMARC1; p=reject; pct=10; rua=mailto:reports@example.com
```

`pct=10` means: apply the `reject` policy to **only 10%** of failing messages. The other 90% are treated as if `p=none`.

Use this to **slowly ramp up enforcement** without risking mass-rejecting legitimate mail you didn't know about.

### The `sp` tag — subdomain policy

By default, the subdomain inherits the main policy. You can override:

```
v=DMARC1; p=reject; sp=quarantine
```

This means:
- `example.com` → reject failures
- `sub.example.com` → quarantine failures

Useful if you can't yet roll out strict policies for marketing subdomains.

### DMARC reports

#### Aggregate reports (RUA)

XML reports sent **daily** (by default) to the address in `rua=`. They contain:

- Source IPs that sent email
- Number of messages
- SPF results, DKIM results, DMARC alignment results
- Receiver's policy decision

#### Forensic reports (RUF)

Individual failure reports sent in real-time (when configured). They contain:

- Failing message headers (sometimes the full body)
- Authentication results
- More privacy-sensitive — many providers don't send these

### Reading a DMARC report

A typical XML report has sections like:

```xml
<record>
  <row>
    <source_ip>203.0.113.5</source_ip>
    <count>42</count>
    <policy_evaluated>
      <disposition>none</disposition>
      <dkim>pass</dkim>
      <spf>pass</spf>
    </policy_evaluated>
  </row>
  <auth_results>
    <spf>
      <domain>example.com</domain>
      <result>pass</result>
    </spf>
    <dkim>
      <domain>example.com</domain>
      <result>pass</result>
    </dkim>
  </auth_results>
</record>
```

Tools that parse these for you: dmarcian, Postmark, Valimail.

---

## 6. DMARC Deployment Strategy — Step by Step

The biggest mistake: jumping straight to `p=reject`. Do this instead:

```
WEEK 1-2: Discovery
  → Set p=none, rua=mailto:reports@example.com
  → Wait for reports to come in
  → Identify all legitimate senders you forgot about
  (newsletter tool, CRM, billing system, support desk...)

WEEK 3-6: Fix issues
  → Add SPF entries for legitimate senders
  → Configure DKIM signing for each service
  → Re-check reports

WEEK 6-8: Quarantine slowly
  → Set p=quarantine, pct=10
  → Monitor reports
  → Increase pct to 25, 50, 75, 100 over 2-4 weeks

WEEK 8+: Enforce
  → Set p=reject (start with pct=10, ramp up to 100)
  → You're now fully protected
```

---

## 7. Putting It All Together

### The complete authentication flow

```
Sender sends email
       ↓
Receiver gets the email
       ↓
1. SPF CHECK
   → Look up SPF record for envelope-from domain
   → Compare sending IP to allowed list
   → Result: pass / fail / softfail
       ↓
2. DKIM CHECK
   → Find DKIM-Signature header
   → Look up public key via selector + domain
   → Verify signature
   → Result: pass / fail
       ↓
3. DMARC EVALUATION
   → Look up DMARC record
   → Check: does SPF pass AND align with From:?
   → Check: does DKIM pass AND align with From:?
   → At least one true → DMARC pass
   → Otherwise → DMARC fail
       ↓
4. APPLY DMARC POLICY
   → On pass: deliver
   → On fail + p=none: deliver but report
   → On fail + p=quarantine: send to spam
   → On fail + p=reject: bounce
       ↓
5. Send aggregate reports
   → Daily XML to rua= address
```

### Scenarios

| SPF | DKIM | DMARC outcome (with p=reject) |
|-----|------|-------------------------------|
| Pass + aligned | Pass + aligned | ✅ Delivered |
| Pass + aligned | Fail | ✅ Delivered (DKIM not needed) |
| Fail | Pass + aligned | ✅ Delivered (typical for forwarded mail) |
| Fail | Fail | ❌ Rejected |
| Pass but not aligned | Pass but not aligned | ❌ Rejected |

---

## 8. DNS Records Summary

| Record | DNS location | Type |
|--------|--------------|------|
| **SPF** | `example.com` | TXT |
| **DKIM** | `<selector>._domainkey.example.com` | TXT |
| **DMARC** | `_dmarc.example.com` | TXT |

### Look them all up

```bash
# SPF
dig +short TXT example.com | grep spf

# DKIM (replace 'selector' with the actual selector name)
dig +short TXT selector._domainkey.example.com

# DMARC
dig +short TXT _dmarc.example.com

# All TXT records of a domain
dig TXT example.com +short
```

### Common DKIM selectors to try

You don't always know the selector. Common ones:

| Service | Selector pattern |
|---------|-----------------|
| Google Workspace | `google._domainkey.example.com` |
| Microsoft 365 | `selector1._domainkey.example.com`, `selector2._domainkey.example.com` |
| Mailchimp | `k1._domainkey.example.com` |
| SendGrid | `s1._domainkey.example.com` |
| Custom | varies — check the email's DKIM-Signature header `s=` value |

---

## 9. Implementation Examples

### Example 1 — Simple domain using Google Workspace

```
example.com.            TXT    "v=spf1 include:_spf.google.com ~all"
google._domainkey.example.com  TXT    "v=DKIM1; k=rsa; p=MIIBIjANBgk..."
_dmarc.example.com.     TXT    "v=DMARC1; p=none; rua=mailto:dmarc@example.com"
```

### Example 2 — Domain with multiple senders

```
example.com.            TXT    "v=spf1 ip4:203.0.113.5 include:_spf.google.com include:mailgun.org ~all"
mail2024._domainkey.example.com   TXT  "v=DKIM1; k=rsa; p=..."
mailgun._domainkey.example.com    TXT  "v=DKIM1; k=rsa; p=..."
_dmarc.example.com.     TXT    "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com; pct=50"
```

### Example 3 — Strict enforcement (post-rollout)

```
example.com.            TXT    "v=spf1 ip4:203.0.113.5 -all"
_dmarc.example.com.     TXT    "v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s; rua=mailto:dmarc@example.com"
```

---

## 10. Common Mistakes

### SPF mistakes

| Mistake | Why it's bad |
|---------|--------------|
| Using `+all` | Authorizes the entire internet to send as you |
| Multiple SPF records | RFC violation, often causes `permerror` |
| Exceeding 10 lookups | Causes `permerror` — emails get rejected |
| Using `ptr` mechanism | Deprecated, slow, unreliable |
| Forgetting third-party senders | Breaks email from CRM, marketing tools |
| Not testing before deploy | Risk of breaking all email |

### DKIM mistakes

| Mistake | Why it's bad |
|---------|--------------|
| Never rotating keys | Compromised key stays valid forever |
| Using 1024-bit RSA | Too weak |
| Storing private key insecurely | Anyone with it can sign as you |
| Not configuring DKIM at all | Email lacks integrity protection |
| Reusing selectors after deletion | Causes confusion in older logs |

### DMARC mistakes

| Mistake | Why it's bad |
|---------|--------------|
| Going straight to `p=reject` | Mass-rejects legitimate mail you forgot about |
| No `rua=` configured | Zero visibility into what's happening |
| Ignoring DMARC reports | Defeats the purpose of having DMARC |
| Strict alignment too early | Causes alignment failures for forwarded mail |
| No DMARC record at all | No policy, no protection, no reports |

---

## 11. Troubleshooting

### "Why is my email going to spam?"

```bash
# Step 1: Check all three records exist
dig +short TXT example.com
dig +short TXT selector._domainkey.example.com
dig +short TXT _dmarc.example.com

# Step 2: View the email headers
# In Gmail: Show original
# In Outlook: View → Source
# Look for: Authentication-Results: ...
```

A typical `Authentication-Results` header:

```
Authentication-Results: mx.google.com;
       dkim=pass header.i=@example.com;
       spf=pass smtp.mailfrom=example.com;
       dmarc=pass header.from=example.com
```

If any says `fail` or `softfail`, that's your problem.

### Diagnosing SPF failures

| Cause | Fix |
|-------|-----|
| Sending IP not in record | Add it (`ip4:` mechanism) |
| 10-lookup limit exceeded | Flatten includes |
| Multiple SPF records | Merge into one |
| Email forwarded | Use DKIM (survives forwarding) |

### Diagnosing DKIM failures

| Cause | Fix |
|-------|-----|
| DNS record missing/wrong | Verify with `dig` |
| Wrong selector | Check email's `s=` value |
| Signature broken by middleware | Use relaxed canonicalization |
| Body modified in transit | Mail filter or list service modifying body |
| Key size mismatch | Re-generate and republish |

### Diagnosing DMARC failures

| Cause | Fix |
|-------|-----|
| SPF passed but didn't align | Set `aspf=r` (relaxed) or change `From:` domain |
| DKIM passed but didn't align | Configure DKIM `d=` to match `From:` domain |
| No DMARC record | Publish one with `p=none` to start |
| Subdomain inherited reject | Set `sp=none` or `sp=quarantine` while testing |

---

## 12. Testing Commands & Tools

### DNS queries

```bash
# Quick SPF lookup
dig +short TXT example.com | grep spf

# DKIM (with selector you know)
dig +short TXT mail2024._domainkey.example.com

# DMARC
dig +short TXT _dmarc.example.com

# Use a different DNS server
dig @1.1.1.1 +short TXT _dmarc.example.com

# Test multiple records at once
for sel in google selector1 selector2 k1 mail mailchimp; do
  echo -n "$sel: "
  dig +short TXT ${sel}._domainkey.example.com | head -1
done
```

### Online tools

| Tool | Use |
|------|-----|
| Kitterman SPF Validator | SPF syntax check + lookup count |
| MXToolbox | All three protocols + email header analyzer |
| Mail-Tester | Send a test email, get a deliverability score |
| DMARCIAN | DMARC record + report parsing |
| Google Postmaster Tools | Gmail-specific delivery analytics |

### Send a test email and see results

```bash
# 1. Get a test address from mail-tester.com (e.g., test-abc123@mail-tester.com)

# 2. Send a test email to it from your domain
echo "Hello" | mail -s "DKIM test" test-abc123@mail-tester.com

# 3. Visit mail-tester.com/abc123 to see SPF / DKIM / DMARC results
```

### Reading email headers

In Gmail:

1. Open email
2. Click ⋮ → **Show original**
3. Look for:
   - `Authentication-Results:` (the verdict)
   - `Received-SPF:` (SPF detail)
   - `DKIM-Signature:` (DKIM detail)

---

## 13. Best Practices Summary

### SPF

- ✅ Start with `~all`, move to `-all` once tested
- ✅ Keep under 10 DNS lookups
- ✅ List third-party senders explicitly
- ✅ Maintain one record per domain
- ❌ Never use `+all`
- ❌ Don't use `ptr` mechanism

### DKIM

- ✅ Use 2048-bit RSA minimum
- ✅ Rotate keys every 6-12 months
- ✅ Use `relaxed/relaxed` canonicalization
- ✅ Use a selector per service for clarity
- ✅ Sign important headers (From, To, Subject, Date)
- ❌ Don't reuse selectors after deletion
- ❌ Don't share private keys

### DMARC

- ✅ Always start with `p=none` and `rua=`
- ✅ Wait 1-3 months at each policy level before escalating
- ✅ Use `pct=` for gradual rollout
- ✅ Read every aggregate report initially
- ✅ Use a DMARC report parser tool
- ❌ Don't jump straight to `p=reject`
- ❌ Don't skip subdomain policy (`sp=`)
- ❌ Don't ignore the reports

---

## 14. Quick Reference Card

```
SPF record:      example.com   TXT   "v=spf1 include:_spf.google.com -all"
DKIM record:     sel._domainkey.example.com   TXT   "v=DKIM1; k=rsa; p=<key>"
DMARC record:    _dmarc.example.com   TXT   "v=DMARC1; p=reject; rua=mailto:reports@example.com"

Look up records:
  dig +short TXT example.com
  dig +short TXT sel._domainkey.example.com
  dig +short TXT _dmarc.example.com

SPF qualifiers:    + pass   - fail   ~ softfail   ? neutral
DMARC policies:    none → quarantine → reject (deploy in that order)
DMARC alignment:   r = relaxed (default)   s = strict
Key size:          RSA 2048-bit (minimum), 4096-bit (max), Ed25519 (modern)
Key rotation:      every 6-12 months

DMARC pass conditions (need at least ONE):
  ✓ SPF passes AND aligns with From: domain
  ✓ DKIM passes AND aligns with From: domain

Deployment timeline:
  Week 1-2:   p=none + rua=        (discover senders)
  Week 3-6:   fix SPF/DKIM gaps
  Week 6-8:   p=quarantine + pct=10..100
  Week 8+:    p=reject + pct=10..100
```
