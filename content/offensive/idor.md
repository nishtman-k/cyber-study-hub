# Insecure Direct Object Reference (IDOR)

> **⚠️ AUTHORIZED USE ONLY.** This material is for education and authorized security testing. IDOR testing accesses other users' data by design, so it must only be performed on systems you own, a designated lab platform, or a target explicitly in scope for an authorized engagement or bug bounty program. Accessing another person's records without authorization is a criminal offence in most jurisdictions, and it remains so even when the application makes it trivially easy. When testing in scope, access the minimum needed to prove the finding and never exfiltrate real user data. See the Legal and Terms of Use page.

> "The application asked who you are at the door, then never asked again."

**Scope:** Broken object-level authorization. What IDOR is, how it works, its types and impact, a practical detection methodology using Burp Suite, curl, and ffuf, and the access-control designs that actually prevent it.

## Table of Contents
- [Core Vocabulary](#core-vocabulary)
- [What IDOR Is](#what-idor-is)
- [How IDOR Works](#how-idor-works)
- [IDOR vs Other Vulnerabilities](#idor-vs-other-vulnerabilities)
- [How an Attack Happens](#how-an-attack-happens)
- [Types of IDOR](#types-of-idor)
- [Horizontal and Vertical Escalation](#horizontal-and-vertical-escalation)
- [Impact](#impact)
- [Where Object References Hide](#where-object-references-hide)
- [The Detection Methodology](#the-detection-methodology)
- [Testing with Burp Suite](#testing-with-burp-suite)
- [Testing with curl and ffuf](#testing-with-curl-and-ffuf)
- [Reading the Response](#reading-the-response)
- [Blind IDOR](#blind-idor)
- [Advanced Testing Techniques](#advanced-testing-techniques)
- [Prevention: Access Control](#prevention-access-control)
- [Prevention: Indirect References](#prevention-indirect-references)
- [Why UUIDs Are Not a Fix](#why-uuids-are-not-a-fix)
- [Mitigation Best Practices](#mitigation-best-practices)
- [Professional Reporting](#professional-reporting)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Vocabulary

| Term | Meaning |
|------|---------|
| **IDOR** | Insecure Direct Object Reference: accessing another user's object by changing its identifier |
| **Direct object reference** | An identifier in a request that points straight at a backend object (a database row, a file) |
| **Object-level authorization** | Checking that *this* user owns or may access *this specific* object |
| **Function-level authorization** | Checking that this user may perform this type of action at all |
| **Horizontal escalation** | Accessing data belonging to another user at the same privilege level |
| **Vertical escalation** | Gaining access to a higher privilege level, such as an administrator |
| **BOLA** | Broken Object Level Authorization, the API-specific name for the same flaw |
| **Enumeration** | Iterating through identifiers to harvest many objects |
| **Indirect reference** | A per-session token that maps to a real object ID, never exposing the real one |
| **CWE-639** | The formal classification: Authorization Bypass Through User-Controlled Key |

**The definition in one sentence:** IDOR occurs when an application exposes a reference to an internal object and **fails to verify that the requesting user is authorized to access that specific object**, so changing the reference grants access to someone else's data.

## 2. What IDOR Is

Break the name into its three parts, because each word carries meaning:

| Word | Meaning |
|------|---------|
| **Insecure** | The reference is not protected by an authorization check |
| **Direct** | The identifier points straight at the real backend object, with no indirection |
| **Object reference** | An account ID, document ID, order number, filename, or any pointer to data |

So an insecure direct object reference is **an unprotected pointer to real data that the user can change at will**.

### Where it sits in the standards

IDOR is a specific instance of **broken access control**, which is **A01 in the OWASP Top 10**, the top-ranked category in both the 2021 and 2025 editions. Its formal classification is **CWE-639**, Authorization Bypass Through User-Controlled Key. In API security it appears as **BOLA** (Broken Object Level Authorization), the number one item in the OWASP API Security Top 10, and it is consistently among the most commonly reported vulnerability classes in bug bounty programs.

The reason it is so prevalent is that it requires no special skill to exploit. There is no payload, no encoding, no filter to evade. The attacker changes a number.

## 3. How IDOR Works

The mechanism is a **missing check**, not a malicious input.

### The vulnerable pattern

Consider an application that shows a user their account:

```http
GET /api/account/1042 HTTP/1.1
Host: target.example
Cookie: session=valid-session-for-user-1042
```

The server-side code behind it:

```python
# VULNERABLE: fetches whatever ID was asked for
@app.route('/api/account/<account_id>')
def get_account(account_id):
    if not session.get('user_id'):        # authentication: are you logged in?
        return 401
    return db.query("SELECT * FROM accounts WHERE id = ?", account_id)
```

The code checks **authentication** (is this a logged-in user?) but never checks **authorization** (does this logged-in user own account 1042?). So the attacker changes one digit:

```http
GET /api/account/1043 HTTP/1.1
Host: target.example
Cookie: session=valid-session-for-user-1042
```

The server dutifully returns account 1043, belonging to someone else.

### The critical distinction

```text
Authentication  =  Who are you?           (the login)
Authorization   =  What may you access?   (the ownership check)
```

IDOR is an **authorization** failure. The attacker is a fully legitimate, authenticated user. Their session is real, their credentials are real, and nothing about their request is malformed. They simply asked for an object they do not own, and the application never checked.

This is why IDOR cannot be caught by input validation, a WAF, or sanitization. `1043` is a perfectly valid account ID. Nothing about it looks like an attack.

## 4. IDOR vs Other Vulnerabilities

A frequently tested distinction. IDOR is categorically different from injection-class flaws.

| | IDOR | Injection (SQLi, XSS) |
|---|------|----------------------|
| **Root cause** | Missing authorization check | Untrusted input parsed as code |
| **The payload** | A legitimate, valid identifier | Crafted syntax (`' OR 1=1`, `<script>`) |
| **Input validity** | The input is perfectly valid data | The input is malformed by design |
| **Who exploits it** | An authenticated, legitimate user | Often an unauthenticated attacker |
| **WAF detection** | Very difficult, nothing looks malicious | Signature-based detection is feasible |
| **Automated scanning** | Poor, scanners cannot infer ownership | Good, payloads produce recognizable responses |
| **The fix** | Enforce per-object authorization | Parameterize, encode output |

### Why scanners miss IDOR

An automated scanner sees a `200 OK` with valid-looking JSON and has no way to know that the record belongs to a different person. Understanding ownership requires **business logic context**: knowing which account should belong to which user. This is exactly the class of flaw that requires a human tester, which is why IDOR remains so common in applications that pass automated scanning cleanly.

### Related access-control flaws

| Flaw | Distinction |
|------|-------------|
| **Broken function level authorization (BFLA)** | Accessing an entire administrative *function* rather than another user's *object* |
| **Forced browsing** | Reaching a page or endpoint by guessing its URL, with no authorization check |
| **Mass assignment** | Sending extra fields (`"role": "admin"`) that the model binds without filtering |
| **Path traversal** | Escaping a directory with `../` to reach unintended files |

All are access-control failures. IDOR is specifically the object-level case.

## 5. How an Attack Happens

The attack chain is short, which is part of what makes it dangerous.

```text
[1] Authenticate        attacker creates a normal, legitimate account
      ↓
[2] Observe             capture their own requests, note object references
      ↓
[3] Identify pattern    IDs are sequential, predictable, or leaked elsewhere
      ↓
[4] Manipulate          change the reference to another user's object
      ↓
[5] Confirm access      the response returns data they should not see
      ↓
[6] Enumerate           script the request across the full ID range
      ↓
[7] Exfiltrate          harvest every record in the range
```

### A worked example

An attacker registers a normal account and views their profile:

```http
GET /api/users/3301/profile HTTP/1.1
Cookie: session=attacker-session
```

They note the ID `3301`. Testing `3300` returns another user's profile with full name, email, address, and phone number. The application never checked ownership.

They then automate it across the entire range, harvesting tens of thousands of records in minutes. Nothing in the traffic looks like an attack: every request is well-formed, authenticated, and returns `200 OK`. The only anomaly is **volume**, which is why rate limiting and anomaly detection matter as containment even though they do not fix the flaw.

> **In authorized testing, stop at step 5.** Proving access to one or two other objects establishes the finding. Mass enumeration of real user data is unnecessary, harmful, and typically outside the rules of engagement.

## 6. Types of IDOR

IDOR is classified by **where the manipulated reference lives**. Each location needs to be tested separately, because an application may protect one and neglect another.

### URL parameter and path tampering

The most common form. The reference appears in the query string or the URL path.

```text
https://target.example/account?id=1042        →  ?id=1043
https://target.example/api/users/1042         →  /api/users/1043
https://target.example/invoice?ref=INV-2024-8891
```

### Body manipulation

The reference is in the POST or PUT body, in form data or JSON. Often overlooked because it is not visible in the browser's address bar.

```http
POST /api/transfer HTTP/1.1
Content-Type: application/json

{"from_account": 1042, "to_account": 9988, "amount": 100}
```

Changing `from_account` to an account you do not own tests whether the server verifies ownership of the source.

### Hidden form fields

A reference rendered into the page as a hidden input, which the client is trusted not to alter.

```html
<input type="hidden" name="user_id" value="1042">
```

Anything sent from the client is attacker-controlled, including hidden fields. This is a classic case of trusting the client.

### Cookie and header manipulation

The reference is carried in a cookie or a custom header.

```http
Cookie: session=abc123; user_id=1042
X-User-Id: 1042
X-Account-Number: 55012
```

An application that reads identity from a client-supplied header rather than from the server-side session is trivially bypassed.

### Static file references

The reference points to a file rather than a database row.

```text
https://target.example/uploads/invoices/invoice_1042.pdf
https://target.example/documents/user_3301_report.pdf
https://target.example/files/2024/03/contract-8891.pdf
```

Files are frequently served by the web server directly, bypassing the application's authorization logic entirely. Predictable file naming makes enumeration straightforward.

### HTTP method manipulation

The application authorizes `GET` correctly but neglects other verbs.

```http
GET    /api/posts/500     →  403 Forbidden   (correctly denied)
DELETE /api/posts/500     →  200 OK          (never checked)
PUT    /api/posts/500     →  200 OK          (never checked)
```

Always test the full set of methods an endpoint accepts, not just the one the interface uses.

### Blind IDOR

The manipulated reference succeeds but returns no visible data, so the effect must be confirmed indirectly. Covered in Section 14.

## 7. Horizontal and Vertical Escalation

IDOR is also classified by the **direction** of the unauthorized access, which directly affects severity.

| | Horizontal | Vertical |
|---|-----------|----------|
| **Direction** | Sideways, to a peer at the same privilege level | Upward, to a higher privilege level |
| **Example** | User A reads User B's invoices | A standard user reaches an administrator's records or functions |
| **Typical severity** | High | Critical |

```text
Horizontal:  /api/users/1042  →  /api/users/1043     (another customer)
Vertical:    /api/users/1042  →  /api/users/1        (often the first admin account)
```

**A practical testing note:** low-numbered IDs (`1`, `2`, `100`) are frequently the earliest accounts created, which are often administrator or test accounts. Testing the low end of a sequential range is a fast way to find vertical escalation, and it materially raises the severity of the finding.

## 8. Impact

The impact of IDOR is determined by **what the object is** and **how many of them there are**.

| Impact | Description |
|--------|-------------|
| **Mass data disclosure** | Enumeration harvests every record in a range, not just one |
| **Privacy breach** | PII, health records, financial data, private messages |
| **Financial fraud** | Viewing or altering transactions, transfers, orders, invoices |
| **Account takeover** | Where the object is a password reset token, email address, or credential |
| **Data tampering** | Modifying records belonging to other users |
| **Data destruction** | Deleting other users' objects via `DELETE` |
| **Privilege escalation** | Reaching administrative objects and functions |
| **Regulatory exposure** | GDPR, HIPAA, and PCI DSS all treat unauthorized personal data access as a reportable breach |

### Why the impact multiplies

A single SQL injection is severe because it reaches the whole database at once. A single IDOR is severe for a different reason: it is **trivially automatable**. One vulnerable endpoint plus a sequential ID range equals the entire user table, retrieved through the application's own legitimate interface, with valid authentication, producing normal-looking log entries.

Some of the largest reported breaches in bug bounty history have been IDORs, precisely because the exploitation is so simple that its scale is limited only by the ID range.

## 9. Where Object References Hide

Before testing, enumerate every place the application exposes a reference. This reconnaissance step determines your coverage.

| Location | What to look for |
|----------|------------------|
| **URL path** | `/users/1042`, `/orders/8891/items` |
| **Query string** | `?id=`, `?user=`, `?account=`, `?doc=`, `?ref=`, `?file=` |
| **POST body** | Form fields and JSON keys carrying identifiers |
| **JSON API payloads** | Nested objects often contain IDs the interface never shows |
| **Hidden form fields** | View the page source, not just the rendered page |
| **Cookies** | Any cookie holding a user or account identifier |
| **Custom headers** | `X-User-Id`, `X-Account`, `X-Customer-Number` |
| **JavaScript files** | API endpoints and parameter names not used by the current interface |
| **File paths** | Uploads, exports, invoices, generated reports |
| **API documentation** | Swagger and OpenAPI specs list every endpoint and parameter |
| **Mobile app traffic** | Mobile clients frequently use APIs with weaker checks than the web interface |

### Parameter names worth hunting

```text
id, uid, user_id, userid, account, account_id, acct
doc, document_id, file, filename, path
order, order_id, invoice, invoice_id, ref, reference
key, num, no, pid, cid, gid, tid
```

**A high-value habit:** read the application's JavaScript bundles. They routinely reference API endpoints and parameters that the current user interface does not expose, and those forgotten endpoints are often the ones nobody applied authorization checks to.

## 10. The Detection Methodology

Testing for IDOR is systematic. The single most important prerequisite is **two accounts**.

### Set up

| Requirement | Reason |
|-------------|--------|
| **Two separate accounts (A and B)** | You need a legitimate object of your own to target, so you are never guessing at a stranger's data |
| **Known object IDs for each** | Account A's document ID, order ID, profile ID, and so on |
| **A proxy capturing traffic** | Burp Suite or ZAP to observe and replay requests |
| **Separate browsers or containers** | Keeps the two sessions from colliding |

Two accounts turn the test from "can I guess someone else's data" into a clean controlled experiment: **take Account A's session and ask for Account B's object.** If it works, that is the finding, and you have proven it without touching a real user's data.

### The loop

| Step | Action | Purpose |
|------|--------|---------|
| **1. Map** | Browse the whole application as Account A with the proxy running | Build a full picture of endpoints and references |
| **2. Identify** | Note every request carrying an object reference | Build the test list |
| **3. Baseline** | Record Account A's normal response for each | Know what success looks like |
| **4. Substitute** | Replay the request with Account A's session but **Account B's object ID** | The core test |
| **5. Compare** | Examine status code, length, and content | Determine whether access was granted |
| **6. Verify** | Confirm the returned data really belongs to B | Rule out coincidence and generic responses |
| **7. Expand** | Test other methods, other endpoints, nested objects | Find the full extent |
| **8. Document** | Record request, response, and impact | Produce reproducible evidence |

### The test matrix

For each endpoint, run all four combinations:

| Session | Object ID | Expected result |
|---------|-----------|-----------------|
| Account A | A's object | 200 OK (baseline) |
| Account A | **B's object** | **Should be 403. If 200, this is IDOR** |
| No session | A's object | Should be 401 |
| Account B | A's object | Should be 403 (confirms both directions) |

## 11. Testing with Burp Suite

Burp is the standard tool for this, and its workflow maps directly onto the methodology.

### Manual workflow with Repeater

1. Browse as Account A with **Proxy** intercepting, building history.
2. Find a request containing an object reference in **HTTP history**.
3. Right-click, **Send to Repeater**.
4. In Repeater, change the object ID to Account B's.
5. Click **Send** and read the response.
6. Compare status code, `Content-Length`, and body against the baseline.

Repeater is the core tool because it lets you change one variable at a time and see the exact effect, which is precisely what this test needs.

### Enumeration with Intruder

To test a range of IDs, send the request to **Intruder**:

1. Set the payload position on the ID: `GET /api/users/§1042§/profile`
2. Payload type **Numbers**, from `1000` to `1100`, step `1`
3. Start the attack, then sort results by **Status** and **Length**

Responses that differ from the denied baseline stand out immediately in the length column. A block of `403` responses with one `200`, or a set of uniform lengths with several outliers, is where the vulnerability is.

> Burp Community's Intruder is heavily rate-limited. For large ranges, use ffuf (Section 12) instead.

### Comparing responses

**Comparer** takes two responses and highlights every difference, which is useful when a denied response and a successful one look superficially similar.

### Authorization extensions

Two Burp extensions automate the entire two-account comparison, and they are the biggest time-saver in access-control testing:

| Extension | How it works |
|-----------|--------------|
| **Autorize** | Configure it with Account B's session cookie, then browse as Account A. It automatically replays every request with B's session and flags anything that returns the same content, meaning authorization is not enforced |
| **AuthMatrix** | Build a matrix of roles against endpoints and test the whole grid systematically |

Autorize is the practical default: it turns manual per-request testing into passive detection while you browse normally.

## 12. Testing with curl and ffuf

Command-line testing is faster for enumeration and easy to script.

### Single request with curl

```bash
# baseline: your own object
curl -s -i -b "session=YOUR_SESSION" \
  "https://target.example/api/users/1042/profile"

# the test: your session, someone else's object
curl -s -i -b "session=YOUR_SESSION" \
  "https://target.example/api/users/1043/profile"
```

`-i` includes response headers so you see the status code. Compare the two outputs directly.

### Testing other HTTP methods

```bash
curl -s -i -X DELETE -b "session=YOUR_SESSION" \
  "https://target.example/api/posts/500"

curl -s -i -X PUT -b "session=YOUR_SESSION" \
  -H "Content-Type: application/json" \
  -d '{"title":"modified"}' \
  "https://target.example/api/posts/500"
```

### Testing a JSON body reference

```bash
curl -s -i -b "session=YOUR_SESSION" \
  -H "Content-Type: application/json" \
  -d '{"account_id": 1043}' \
  "https://target.example/api/statement"
```

### Enumeration with ffuf

`ffuf` iterates an ID range quickly and filters out the uninteresting responses.

```bash
# generate the range
seq 1000 1100 > ids.txt

# fuzz the ID position, hiding 403 responses
ffuf -u "https://target.example/api/users/FUZZ/profile" \
     -w ids.txt \
     -H "Cookie: session=YOUR_SESSION" \
     -fc 403
```

Useful filters:

| Flag | Effect |
|------|--------|
| `-fc 403` | Hide responses with status 403 |
| `-fs 1234` | Hide responses of a specific size |
| `-mc 200` | Show only status 200 |
| `-fr "not authorized"` | Hide responses matching a regex |
| `-rate 20` | Limit requests per second |

**Filtering by size is often the key.** Many applications return `200 OK` with an error message rather than a proper `403`, so filtering on status alone misses the finding. Filter on the *length* of the denied response instead, and anything different surfaces.

> Keep `-rate` low on any authorized engagement. High-speed enumeration against a live application can degrade service and will usually breach the rules of engagement.

## 13. Reading the Response

Determining whether access was actually granted requires care, because applications respond inconsistently.

| Response | Interpretation |
|----------|---------------|
| **200 with another user's data** | Confirmed IDOR |
| **403 or 401** | Authorization is enforced on this endpoint |
| **404** | Ambiguous: either the object does not exist, or the app returns 404 to hide existence |
| **200 with an error message in the body** | Denied, despite the status code. Check the body, not just the code |
| **200 with an empty or generic object** | Possibly filtered, possibly a placeholder. Verify the content |
| **302 redirect to login or an error page** | Usually denied |
| **500 error** | The check may be missing while something else fails. Worth investigating |

### Verify that the data is really the other user's

A `200` alone is not proof. Confirm the response contains data that is **identifiably Account B's**: their email address, their name, their order total. This is exactly why the two-account setup matters, because you know what B's data should look like and can confirm the match unambiguously.

### The 404 subtlety

Returning `404` for an object that exists but is not yours is a legitimate design choice, since it avoids confirming the object's existence. But `404` can also mean the ID range you are testing is simply empty. Distinguish them by checking whether a **known-valid ID belonging to Account B** returns `404` under Account A's session. If B's real object returns `404` to A, the control is working.

## 14. Blind IDOR

In blind IDOR, the manipulated request succeeds but returns nothing useful, so the effect must be confirmed through a side channel.

**Typical situations:** an endpoint that updates a record and returns only `{"status":"ok"}`, an action that triggers an email, an export that is generated asynchronously, or a delete that returns an empty body.

### Confirming it indirectly

| Method | How |
|--------|-----|
| **Log in as the victim account** | Use Account B's own session to check whether B's data actually changed |
| **Check for side effects** | An email sent, a notification generated, a file appearing |
| **Compare response timing** | A processed request may take measurably longer than a rejected one |
| **Look for a readable endpoint** | The same object may be readable through a different endpoint that does return data |
| **Observe subsequent state** | Re-request the object through a legitimate path and see whether it changed |

Because you control both accounts, blind IDOR is straightforward to confirm in testing: perform the action as A against B's object, then log in as B and look. That is unambiguous proof, and it is only possible because you set up two accounts at the start.

## 15. Advanced Testing Techniques

When the obvious test returns `403`, these are the variations that frequently succeed.

### Parameter pollution

Supply the parameter twice; different layers may read different occurrences.

```text
/api/users?id=1042&id=1043
/api/users?id=1043&id=1042
```

### Array and type manipulation

Wrap the value in an array or change its type. Some frameworks handle these inconsistently.

```json
{"id": [1043]}
{"id": {"value": 1043}}
{"id": "1043"}
```

### Wildcards and alternate values

```text
/api/users/*
/api/users/%2A
/api/users/0
/api/users/-1
```

### ID encoding

If IDs appear encoded rather than plain, decode, alter, and re-encode. Base64 identifiers are common and offer no protection.

```bash
echo -n "MTA0Mg==" | base64 -d      # decodes to 1042
echo -n "1043" | base64             # re-encode the target ID
```

Hashed IDs are worth checking too: if an MD5 of a sequential number is used as the reference, the hashes are computable for the whole range.

### Method override headers

Where `DELETE` is blocked at the proxy, some frameworks honor an override header on a `POST`.

```http
POST /api/posts/500 HTTP/1.1
X-HTTP-Method-Override: DELETE
```

### API version differences

An older API version may lack the checks added to the current one.

```text
/api/v2/users/1043     →  403
/api/v1/users/1043     →  200      (older version, no check)
```

### Related object references

If the direct object is protected, look for the same data reachable through a **nested or related** path, which developers often forget to protect.

```text
/api/orders/8891              →  403
/api/users/1042/orders/8891   →  200
/api/orders/8891/items        →  200
```

## 16. Prevention: Access Control

The fix for IDOR is not obscuring the identifier. It is **verifying ownership on every request**.

### The secure pattern

```python
# SECURE: the query is scoped to the authenticated user
@app.route('/api/account/<account_id>')
def get_account(account_id):
    user_id = session.get('user_id')
    if not user_id:
        return 401

    account = db.query(
        "SELECT * FROM accounts WHERE id = ? AND owner_id = ?",
        account_id, user_id
    )
    if not account:
        return 404          # object does not exist for THIS user
    return account
```

The essential change is the `AND owner_id = ?` clause. The query can now only ever return an object belonging to the session's user, no matter what ID is supplied. The authorization check is enforced **in the data access itself**, which is the most reliable place for it.

### The principles

| Principle | Meaning |
|-----------|---------|
| **Check on every request** | Authorization is per-request, not per-session. Checking at login is not enough |
| **Deny by default** | Access is refused unless a rule explicitly permits it |
| **Derive identity server-side** | Take the user ID from the session or a validated token, **never** from a client-supplied parameter |
| **Scope queries to the owner** | Filter at the data layer so unauthorized objects cannot be returned at all |
| **Centralize the logic** | One authorization component used everywhere, rather than per-endpoint checks that get forgotten |
| **Cover every method and endpoint** | GET, POST, PUT, PATCH, DELETE, and every API version |

### The single most important rule

**Never trust a user identifier that came from the client.** If the request says `user_id=1042` and the server uses that to decide whose data to return, the application has no access control at all. The user's identity must come from the server-side session or a cryptographically validated token. The client may say *which object* it wants, but never *who it is*.

## 17. Prevention: Indirect References

An indirect reference replaces the real object identifier with a per-user, per-session value that is meaningless to anyone else.

```text
Direct:    /api/documents/49281        the real database row ID
Indirect:  /api/documents/a7f3c9e1     a session-scoped token mapping to it
```

The server keeps a mapping, valid only for that user's session:

```text
Session ABC:  a7f3c9e1  →  document 49281
              b2d8f440  →  document 49302
```

A reference stolen or guessed from another session simply does not resolve, because the mapping does not exist there.

**Where it helps:** it prevents enumeration outright, since there is no sequence to walk, and it stops references leaking real internal IDs.

**The essential caveat:** indirect references are a **defense-in-depth measure, not a replacement for authorization checks.** An application that uses indirect references but still fails to verify ownership is vulnerable to anyone who obtains a valid reference. Implement the ownership check first; add indirection as reinforcement.

## 18. Why UUIDs Are Not a Fix

A common and inadequate response to IDOR is to replace sequential integers with UUIDs.

```text
Before:  /api/users/1042
After:   /api/users/f47ac10b-58cc-4372-a567-0e02b2c3d479
```

This makes **enumeration** impractical, which is a genuine benefit, since an attacker cannot iterate through a 128-bit space. But it does not fix the vulnerability, for several reasons:

| Reason | Explanation |
|--------|-------------|
| **It is obscurity, not access control** | The missing ownership check is still missing. Anyone holding a valid UUID gets the data |
| **UUIDs leak constantly** | They appear in shared links, referrer headers, logs, exports, emails, notifications, API responses, and support tickets |
| **Other endpoints disclose them** | A search, listing, or team-members endpoint frequently returns UUIDs belonging to other users |
| **Not all UUIDs are random** | Version 1 UUIDs encode a timestamp and MAC address and are partially predictable |
| **Collaborative features expose them** | Any feature that shares an object hands the reference to another party |

**The correct framing:** UUIDs raise the cost of *discovering* a reference. They do nothing about what happens once one is discovered. Use them, because reducing enumerability is worthwhile, but only alongside a real authorization check, never instead of one.

## 19. Mitigation Best Practices

The complete defensive picture, in priority order.

| Priority | Practice | Detail |
|----------|----------|--------|
| **1** | **Enforce object-level authorization on every request** | Verify the authenticated user owns or may access the specific object requested |
| **2** | **Derive identity from the server-side session** | Never accept a user identifier from a parameter, header, or cookie the client controls |
| **3** | **Scope database queries to the owner** | Add the ownership condition to the query itself so unauthorized rows cannot be returned |
| **4** | **Deny by default** | Refuse access unless a rule explicitly grants it |
| **5** | **Centralize authorization logic** | A single, tested component, rather than checks scattered per endpoint |
| **6** | **Cover all methods and versions** | GET, POST, PUT, PATCH, DELETE, and every deployed API version |
| **7** | **Use indirect or unpredictable references** | Session-scoped tokens or UUIDs, as reinforcement |
| **8** | **Protect static files through the application** | Serve documents via an authorizing endpoint, not directly from the web server |
| **9** | **Rate limit and monitor** | Limits abuse volume and surfaces enumeration attempts |
| **10** | **Log access to sensitive objects** | Enables detection and investigation |
| **11** | **Test authorization automatically** | Include access-control cases in the test suite so regressions are caught |

### Detection: what enumeration looks like in logs

Since IDOR traffic is individually legitimate, detection relies on **patterns rather than payloads**:

- One session requesting many distinct object IDs in a short window.
- Sequential ID access patterns.
- A user accessing objects far outside their normal working set.
- A spike in `403` responses from one account, which indicates probing.

These belong in monitoring rules. They do not prevent IDOR, but they shorten the window between exploitation and discovery.

## 20. Professional Reporting

IDOR findings are easy to reproduce, which makes for strong reports if written precisely.

### What to include

| Element | Content |
|---------|---------|
| **Title** | The vulnerability type, the endpoint, and the object type affected |
| **Severity** | Rating with justification (data sensitivity, horizontal vs vertical, record count) |
| **Affected endpoint** | Exact URL, method, and parameter |
| **Accounts used** | Which test account accessed which test account's object |
| **Reproduction steps** | Numbered, exact, with the full request |
| **Evidence** | Request and response, with the other account's data visible and sensitive values redacted |
| **Business impact** | What an attacker achieves at scale |
| **Remediation** | The specific ownership check needed at that endpoint |
| **References** | CWE-639, OWASP A01 |

### Rating severity

Weigh: the sensitivity of the exposed data (financial and health records rate higher), whether it is horizontal or vertical (vertical is more severe), whether the IDs are enumerable (sequential means mass disclosure), whether the flaw permits modification or only reading, and how many records the range implies.

### Writing the impact

| Instead of | Write |
|------------|-------|
| "The `id` parameter is vulnerable to IDOR." | "Any authenticated user can retrieve the full profile, including name, address, and phone number, of any other customer by changing a single number in the URL. With sequential IDs, all 100,000 customer records are retrievable in a scripted run, which constitutes a reportable personal data breach." |

Quantifying the range is what turns a single-record demonstration into a correctly rated finding. Show one record, then state what the enumerable range implies.

## 21. Fast Recall

- **IDOR** is accessing another user's object by changing its reference, because the application never verified ownership. **CWE-639**, under **OWASP A01 Broken Access Control**.
- The name breaks down as: **insecure** (unprotected), **direct** (points at the real object), **object reference** (an ID, filename, or key).
- **It is an authorization failure, not authentication.** The attacker is a legitimate logged-in user making a valid request.
- **Authentication asks who you are. Authorization asks what you may access.** IDOR is the second check missing.
- **Unlike injection, the input is completely valid,** which is why WAFs and scanners miss it and human testing is required.
- **Attack chain:** authenticate, observe references, spot the pattern, manipulate, confirm, enumerate, exfiltrate.
- **Types by location:** URL path and query, request body, hidden fields, cookies and headers, static files, HTTP method, blind.
- **Horizontal** is peer-to-peer access; **vertical** reaches higher privilege. Low IDs (`1`, `2`) are often admin accounts.
- **Impact multiplies through enumeration.** One endpoint plus sequential IDs equals the whole user table.
- **Testing requires two accounts.** Use Account A's session to request Account B's object; that is the whole test.
- **Test matrix:** A's session with A's object (baseline), A's session with B's object (the finding), no session, and B's session with A's object.
- **Burp workflow:** Repeater to change one ID, Intruder or ffuf to enumerate, **Autorize** to detect automatically while browsing.
- **Filter by response length, not just status code,** since many apps return `200` with an error in the body.
- **Verify the data is really the other account's,** not a generic or empty response.
- **Blind IDOR** is confirmed by logging in as the victim account and observing the change.
- **The fix is an ownership check on every request,** ideally enforced in the query itself (`WHERE id = ? AND owner_id = ?`).
- **Never take the user's identity from client-supplied input.** Derive it from the server-side session.
- **UUIDs are not a fix.** They stop enumeration but leak constantly, and the missing check is still missing.
- **Indirect references** are defense in depth, not a substitute for authorization.
- **Test every HTTP method, every endpoint, and every API version.** Old versions frequently lack the checks.

## 22. Resources

**Standards and classification**
- [OWASP: Insecure Direct Object Reference Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html)
- [OWASP: Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [OWASP Top 10: A01 Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [OWASP API Security Top 10: API1 Broken Object Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/)
- [MITRE CWE-639: Authorization Bypass Through User-Controlled Key](https://cwe.mitre.org/data/definitions/639.html)
- [OWASP WSTG: Testing for Insecure Direct Object References](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/04-Testing_for_Insecure_Direct_Object_References)

**Practice (authorized labs)**
- [PortSwigger Web Security Academy: Access control vulnerabilities](https://portswigger.net/web-security/access-control)
- [PortSwigger: IDOR](https://portswigger.net/web-security/access-control/idor)
- [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/)

**Tools**
- [Burp Suite](https://portswigger.net/burp)
- [Autorize (Burp extension)](https://github.com/PortSwigger/autorize)
- [AuthMatrix (Burp extension)](https://github.com/PortSwigger/auth-matrix)
- [ffuf](https://github.com/ffuf/ffuf)
- [OWASP ZAP](https://www.zaproxy.org/)
