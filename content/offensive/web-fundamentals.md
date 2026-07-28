# Web Fundamentals

> `You cannot secure what you do not understand.`

> **Scope:** How the web works end to end: request lifecycle, HTTP mechanics, the evolution from Web 1.0 to 3.0, front-end and back-end communication, state management, data structure, the OWASP Top Ten, and bug bounty programs.

---

## Table of Contents
- [Core Vocabulary](#core-vocabulary)
- [How the Web Works](#how-the-web-works)
- [HTTP Fundamentals](#http-fundamentals)
- [Web Applications](#web-applications)
- [Web 1.0 vs 2.0 vs 3.0](#web-10-vs-20-vs-30)
- [Progressive Web Applications](#progressive-web-applications)
- [Front-End and Back-End Communication](#front-end-and-back-end-communication)
- [Same-Origin Policy and CORS](#same-origin-policy-and-cors)
- [Stateful vs Stateless](#stateful-vs-stateless)
- [Structured vs Unstructured Data](#structured-vs-unstructured-data)
- [Web Application Security Risks](#web-application-security-risks)
- [The OWASP Top Ten](#the-owasp-top-ten)
- [Security Testing Approaches](#security-testing-approaches)
- [Bug Bounty Programs](#bug-bounty-programs)
- [Operational Notes](#operational-notes)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Vocabulary

| Term | Meaning |
|------|---------|
| **Client** | The software making the request, typically a browser |
| **Server** | The system receiving the request and returning a response |
| **HTTP** | HyperText Transfer Protocol, the request and response protocol of the web |
| **HTTPS** | HTTP wrapped in TLS encryption |
| **URL** | Uniform Resource Locator, the full address of a resource |
| **DNS** | Domain Name System, resolves hostnames to IP addresses |
| **TCP** | Transport protocol providing reliable, ordered delivery |
| **TLS** | Transport Layer Security, provides encryption, integrity, and server authentication |
| **Front-end** | Everything running in the browser: HTML, CSS, JavaScript |
| **Back-end** | Server-side application logic, databases, and services |
| **API** | Application Programming Interface, a defined contract for programmatic communication |
| **Endpoint** | A specific URL path that an API exposes |
| **Session** | A server-side record of an ongoing interaction with a client |
| **Cookie** | A small piece of data stored by the browser and returned with requests |
| **Token** | A credential passed with a request to prove identity, commonly a JWT |
| **Origin** | The combination of scheme, host, and port |
| **Payload** | The data carried in a request or response body |
| **Rendering** | Converting code and data into the visual page the user sees |

## 2. How the Web Works

### The request lifecycle

What happens between typing a URL and seeing a page:

1. **URL parsing.** The browser breaks the address into scheme, host, port, path, query, and fragment.
2. **DNS resolution.** The hostname is resolved to an IP address, checking browser cache, OS cache, and resolver in turn.
3. **TCP connection.** A connection is established to the server, typically on port 80 or 443.
4. **TLS handshake.** For HTTPS, the client and server negotiate encryption and the server presents its certificate.
5. **HTTP request.** The browser sends a request line, headers, and optionally a body.
6. **Server processing.** The server routes the request, executes application logic, queries data stores, and builds a response.
7. **HTTP response.** The server returns a status code, headers, and body.
8. **Rendering.** The browser parses HTML into the DOM, applies CSS, executes JavaScript, and paints the page.
9. **Subresource requests.** Images, stylesheets, scripts, and fonts each trigger their own request cycle.

### Anatomy of a URL

```text
https://shop.example.com:443/products/list?category=books&page=2#reviews
└─┬─┘   └───────┬───────┘└┬┘└──────┬─────┘└──────────┬─────────┘└──┬──┘
scheme        host      port      path             query       fragment
```

| Component | Purpose | Security relevance |
|-----------|---------|--------------------|
| **Scheme** | Protocol used | `http` transmits in cleartext, `https` is encrypted |
| **Host** | Server to contact | Part of the origin, used in same-origin decisions |
| **Port** | Service on the host | Part of the origin, defaults 80 for HTTP and 443 for HTTPS |
| **Path** | Resource requested | Common target for traversal and access control flaws |
| **Query** | Parameters passed to the server | Primary injection entry point, and visible in logs |
| **Fragment** | Client-side anchor | Never sent to the server, relevant to DOM-based issues |

The fragment staying client-side matters: data placed after `#` does not appear in server logs, which is why it features in DOM-based attacks that leave no server-side trace.

## 3. HTTP Fundamentals

### Request structure

```http
GET /api/users/42 HTTP/1.1
Host: example.com
User-Agent: Mozilla/5.0
Accept: application/json
Cookie: session=a1b2c3d4
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...

[optional body]
```

### Methods

| Method | Purpose | Safe | Idempotent |
|--------|---------|------|-----------|
| **GET** | Retrieve a resource | Yes | Yes |
| **POST** | Submit data, create a resource | No | No |
| **PUT** | Replace a resource entirely | No | Yes |
| **PATCH** | Partially modify a resource | No | No |
| **DELETE** | Remove a resource | No | Yes |
| **HEAD** | Retrieve headers only | Yes | Yes |
| **OPTIONS** | Query supported methods, used in CORS preflight | Yes | Yes |

**Safe** means the method should not change server state. **Idempotent** means repeating the request produces the same result as sending it once. State-changing operations placed behind GET are a recurring design flaw, since GET requests are cached, logged, prefetched, and easily triggered cross-site.

### Status codes

| Range | Class | Common examples |
|-------|-------|-----------------|
| **1xx** | Informational | 101 Switching Protocols |
| **2xx** | Success | 200 OK, 201 Created, 204 No Content |
| **3xx** | Redirection | 301 Moved Permanently, 302 Found, 304 Not Modified |
| **4xx** | Client error | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Too Many Requests |
| **5xx** | Server error | 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable |

**401 versus 403:** 401 means authentication is missing or invalid, meaning the server does not know who is asking. 403 means authentication succeeded but authorization failed, meaning the server knows who is asking and is refusing.

### Security-relevant headers

| Header | Function |
|--------|----------|
| **Strict-Transport-Security** | Forces HTTPS for future requests, preventing downgrade |
| **Content-Security-Policy** | Restricts which sources may load scripts and other resources, a primary XSS defense |
| **X-Frame-Options** | Prevents the page being framed, blocking clickjacking |
| **X-Content-Type-Options** | `nosniff` prevents MIME type guessing |
| **Set-Cookie** | Issues cookies, with attributes controlling their security |
| **Access-Control-Allow-Origin** | Declares which origins may read the response |
| **Referrer-Policy** | Controls how much URL data leaks in the Referer header |

### Cookie attributes

| Attribute | Effect |
|-----------|--------|
| **HttpOnly** | Blocks JavaScript access, limiting session theft via XSS |
| **Secure** | Sent only over HTTPS |
| **SameSite** | `Strict`, `Lax`, or `None`, controlling whether the cookie is sent cross-site. Primary CSRF defense |
| **Domain / Path** | Scope of the cookie |
| **Expires / Max-Age** | Lifetime, with session cookies cleared on browser close |

## 4. Web Applications

A web application is software delivered over HTTP and executed partly in the browser and partly on a server, requiring no local installation.

### Website versus web application

| | Website | Web application |
|---|---------|-----------------|
| **Content** | Largely static, informational | Dynamic, generated per user |
| **Interaction** | Read-only browsing | Input, processing, and state change |
| **Authentication** | Usually none | Usually required |
| **Complexity** | Presentation layer | Business logic, data layer, integrations |

The distinction is a spectrum rather than a hard line, and most modern sites sit somewhere in the middle.

### Examples by category

| Category | Examples | Sensitive assets |
|----------|----------|------------------|
| **Financial** | Online banking, payment platforms, trading | Funds, account data, transaction history |
| **Communication** | Webmail, messaging, video conferencing | Message content, contacts, metadata |
| **Social** | Social networks, forums, content platforms | Personal data, private posts, social graph |
| **Commerce** | Online retail, marketplaces, booking | Payment data, addresses, order history |
| **Productivity** | Document editors, project management, CRM | Business data, intellectual property |
| **Cloud services** | Storage, infrastructure consoles, SaaS platforms | Files, credentials, infrastructure control |
| **Healthcare** | Patient portals, telemedicine, records systems | Health records, regulated personal data |
| **Government** | Tax filing, identity services, benefits portals | Identity documents, financial and civic records |

### Typical architecture

```text
Browser (front-end)
    │  HTTPS
    ▼
Web server / reverse proxy      TLS termination, routing, static content
    │
    ▼
Application server (back-end)   Authentication, business logic, validation
    │
    ├──► Database                Persistent structured storage
    ├──► Cache                   Sessions, frequently accessed data
    ├──► Object storage          Files and media
    └──► External APIs           Payment, mail, identity providers
```

Each boundary in this chain is a trust boundary, and each is a place where validation is either enforced or wrongly assumed to have happened already.

## 5. Web 1.0 vs 2.0 vs 3.0

| | **Web 1.0** | **Web 2.0** | **Web 3.0** |
|---|-------------|-------------|-------------|
| **Period** | Roughly 1990 to 2004 | Roughly 2004 to present | Emerging |
| **Nature** | Read-only | Read and write | Read, write, and own |
| **Content** | Static pages published by owners | User-generated content | Decentralized, user-controlled data |
| **Interaction** | Passive consumption | Participation and social interaction | Machine-readable, semantic, autonomous agents |
| **Architecture** | Static HTML files on servers | Centralized platforms and APIs | Distributed ledgers, peer-to-peer networks |
| **Data control** | Publisher | Platform | User |
| **Technology** | HTML, basic CSS, CGI | AJAX, JavaScript frameworks, REST APIs, cloud | Blockchain, smart contracts, semantic web, decentralized identity |
| **Identity** | Rarely required | Platform accounts | Cryptographic wallets and self-sovereign identity |
| **Examples** | Early static sites, directories | Social networks, wikis, SaaS platforms | Decentralized applications, token-based systems |

### Security implications of each era

**Web 1.0:** small attack surface. Static files with limited server-side processing meant few injection points. Risks centered on server software vulnerabilities and defacement.

**Web 2.0:** the attack surface expanded dramatically. User-generated content introduced XSS. Database-driven pages introduced injection. Session-based authentication introduced session attacks and CSRF. APIs exposed logic directly. Centralized platforms created concentrated breach targets holding data for millions.

**Web 3.0:** shifts risk rather than removing it. Smart contract logic flaws are immutable once deployed and financially exploitable immediately. Private key compromise is unrecoverable with no reset mechanism. Decentralization removes the central authority that could freeze, reverse, or remediate. Front-ends remain conventional web applications with conventional vulnerabilities.

## 6. Progressive Web Applications

A PWA is a web application built to deliver a native-app-like experience: installable, offline-capable, and able to receive push notifications, while remaining a website delivered over HTTP.

### Core requirements

| Requirement | Purpose |
|-------------|---------|
| **HTTPS** | Mandatory. Service workers are unavailable over plain HTTP |
| **Service worker** | A background script proxying network requests, enabling offline function and caching |
| **Web app manifest** | JSON file defining name, icons, start URL, and display mode for installation |
| **Responsive design** | Adapts across device sizes |

### Characteristics

- **Installable** to the home screen or desktop without an app store.
- **Offline capable** through service worker caching.
- **Push notifications** on supported platforms.
- **Background sync** deferring actions until connectivity returns.
- **Linkable** via URL, unlike native applications.
- **No app store distribution** required, reducing review friction and cost.

### Security considerations

The **service worker** is the defining security concern. It sits between the application and the network, can intercept and modify every request, and persists after the page closes.

- A service worker registered through an XSS vulnerability persists beyond the original page load, converting a transient flaw into a durable foothold.
- Scope is bound to the path where the service worker is registered, so allowing user-controlled file upload to a root path can permit registration with site-wide scope.
- Cached responses may retain sensitive data on disk after logout unless cache invalidation is handled explicitly.
- The HTTPS requirement is itself a mitigation, preventing a network attacker from injecting a malicious service worker.

## 7. Front-End and Back-End Communication

### Division of responsibility

| | Front-end | Back-end |
|---|-----------|----------|
| **Runs on** | The user's browser | The server |
| **Technologies** | HTML, CSS, JavaScript, frameworks | Application languages, databases, services |
| **Responsibilities** | Rendering, interaction, presentation | Authentication, authorization, business logic, persistence |
| **Trust level** | **Untrusted** | Trusted, and responsible for enforcement |

**The foundational security principle:** the front-end is entirely under the user's control. Its code can be read, its logic modified, and its requests replayed or forged with any values. Client-side validation is a usability feature, not a security control. **Every check must be enforced server-side, without exception.**

### Communication mechanisms

| Mechanism | Model | Typical use |
|-----------|-------|-------------|
| **Form submission** | Full page request and reload | Traditional server-rendered applications |
| **AJAX / Fetch** | Asynchronous background request | Dynamic updates without reload |
| **REST API** | Resource-oriented HTTP, stateless | The prevailing API style |
| **GraphQL** | Single endpoint, client-specified query | Flexible data fetching, avoids over-fetching |
| **WebSocket** | Persistent bidirectional connection | Chat, live feeds, collaborative editing |
| **Server-Sent Events** | Server-to-client stream | Notifications, live updates |
| **gRPC** | Binary RPC over HTTP/2 | Service-to-service communication |

### REST conventions

```http
GET    /api/users          Retrieve a collection
GET    /api/users/42       Retrieve one resource
POST   /api/users          Create
PUT    /api/users/42       Replace
PATCH  /api/users/42       Partially update
DELETE /api/users/42       Remove
```

### Data formats

**JSON**, the dominant format:

```json
{ "id": 42, "name": "Jane Doe", "role": "admin", "active": true }
```

**XML**, common in enterprise and legacy systems. Its parsers introduce a distinct risk class, **XML External Entity (XXE)** processing, where an attacker-supplied entity definition causes the parser to read local files or make outbound requests.

### Recurring API security issues

- **Broken object level authorization (BOLA):** the endpoint returns whatever object ID is requested without verifying the caller owns it. Changing `/api/users/42` to `/api/users/43` returns another user's data. The most exploited API flaw.
- **Broken function level authorization (BFLA):** administrative endpoints are hidden from the interface but remain reachable by direct request.
- **Excessive data exposure:** the API returns a full object and relies on the front-end to display only part of it, leaving the remainder visible in the raw response.
- **Mass assignment:** the API binds every supplied field to the data model, allowing an added `"role": "admin"` to be accepted.
- **Missing rate limiting:** permits credential stuffing, enumeration, and resource exhaustion.

## 8. Same-Origin Policy and CORS

### Same-Origin Policy

The foundational browser security control. Scripts from one origin cannot read responses from another origin. An **origin** is the combination of **scheme, host, and port**, and all three must match.

| URL | Same origin as `https://example.com/app`? | Reason |
|-----|-------------------------------------------|--------|
| `https://example.com/other` | Yes | Path is not part of the origin |
| `http://example.com/app` | No | Different scheme |
| `https://api.example.com/app` | No | Different host, subdomains count |
| `https://example.com:8443/app` | No | Different port |

Without this policy, any site visited could read a logged-in session on any other site.

### CORS

Cross-Origin Resource Sharing is the mechanism by which a server **relaxes** the Same-Origin Policy, declaring which other origins may read its responses.

```http
Access-Control-Allow-Origin: https://trusted-app.example.com
Access-Control-Allow-Methods: GET, POST, PUT
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

For requests that are not simple, the browser first sends an **OPTIONS preflight** request to confirm the actual request is permitted.

**Common misconfigurations:**

| Misconfiguration | Consequence |
|------------------|-------------|
| `Access-Control-Allow-Origin: *` on authenticated endpoints | Any origin may read the response |
| Reflecting the request `Origin` header without validation | Effectively permits every origin |
| `Allow-Credentials: true` combined with a permissive origin | Allows cross-origin reading of authenticated responses |
| Weak origin matching | `evil-example.com` matches a check for `example.com` |

**A frequent misconception:** CORS is not a defense against CSRF. CORS governs whether a response may be **read** cross-origin. CSRF concerns whether a request is **sent and processed**, which happens regardless. SameSite cookies and anti-CSRF tokens address CSRF.

## 9. Stateful vs Stateless

**HTTP itself is stateless.** Each request is independent and carries no inherent memory of previous requests. Applications requiring continuity must add state deliberately.

| | Stateful | Stateless |
|---|----------|-----------|
| **Server memory** | Server stores session data between requests | Server stores nothing between requests |
| **Request content** | Carries a session identifier | Carries all context needed to process it |
| **Scaling** | Requires sticky sessions or shared session storage | Any server can handle any request |
| **Revocation** | Immediate, delete the server-side session | Difficult, a valid token remains valid until expiry |
| **Failure impact** | Server loss can drop sessions | No session loss |
| **Typical use** | Traditional server-rendered applications | REST APIs, microservices |

### Session-based (stateful)

```text
Login  →  server creates session, stores it, returns session ID in a cookie
Request →  cookie sent automatically, server looks up the session
Logout →  server destroys the session, the ID becomes useless immediately
```

**Security profile:** the session ID is the entire credential, so it must be long, random, transmitted only over HTTPS, marked HttpOnly and SameSite, and regenerated on privilege change. **Session fixation** occurs when the identifier is not regenerated at login, letting an attacker set a known value beforehand.

### Token-based (stateless)

```text
Login   →  server issues a signed token, stores nothing
Request →  client sends the token, typically in an Authorization header
Server  →  verifies the signature and reads the claims, no lookup required
```

A **JWT** has three base64url-encoded parts: header, payload, signature.

**Security profile:** the payload is **encoded, not encrypted**, and is readable by anyone holding the token, so it must never contain secrets. Signature verification must be enforced, and the `alg` field must never be trusted from the token itself, since accepting `none` or permitting an algorithm switch defeats verification entirely. Because there is no server-side record, **revocation is the core weakness**: a stolen token remains valid until it expires. Practical mitigations are short expiry with refresh tokens, or a denylist, which reintroduces state.

### Choosing between them

Stateful suits applications needing immediate revocation and fine-grained session control. Stateless suits horizontally scaled APIs where any node must serve any request. Many systems combine both: stateless access tokens with short lifetimes, backed by stateful refresh tokens that can be revoked.

## 10. Structured vs Unstructured Data

| | Structured | Unstructured |
|---|-----------|--------------|
| **Organization** | Predefined schema, fixed fields and types | No predefined model |
| **Storage** | Relational databases, spreadsheets | File systems, object storage, document stores |
| **Query** | SQL and precise querying | Full-text search, parsing, machine learning |
| **Examples** | Customer records, transactions, inventory, logs with fixed fields | Documents, email bodies, images, video, audio, free text |
| **Proportion of data** | Minority of organizational data | Large majority |
| **Analysis** | Straightforward aggregation and reporting | Requires extraction and interpretation |

**Semi-structured** data sits between the two: it carries organizational markers such as tags or keys without conforming to a rigid schema. JSON, XML, and YAML are the common examples, and this is the form most web APIs actually exchange.

### Security implications

| Data type | Primary concerns |
|-----------|------------------|
| **Structured** | Injection attacks targeting the query language, mass extraction through a single flaw, clear regulatory classification |
| **Semi-structured** | Parser vulnerabilities such as XXE and deserialization flaws, schema validation gaps, type confusion |
| **Unstructured** | Difficult to inventory and classify, metadata leakage, sensitive content hidden inside documents, upload handling flaws |

The practical difficulty with unstructured data is **discovery**. An organization can enumerate the tables containing personal data with a query, but cannot easily determine which of several million documents contains a copied spreadsheet of customer records. Data loss prevention and classification tooling exists because this problem does not solve itself.

## 11. Web Application Security Risks

### Why web applications are heavily targeted

- **Public exposure by design.** They must be reachable, which means the attack surface cannot be removed by firewalling.
- **Direct access to valuable data.** The application is the interface to the database.
- **Complexity.** Multiple languages, frameworks, dependencies, and integrations produce large surfaces.
- **Rapid deployment.** Continuous delivery outpaces security review.
- **Dependency depth.** A typical application inherits thousands of transitive dependencies.
- **Uniform tooling.** A single widespread framework flaw becomes exploitable across thousands of organizations simultaneously.

### Core vulnerability classes

| Class | Mechanism | Primary defense |
|-------|-----------|-----------------|
| **Injection** | Untrusted input interpreted as code or commands | Parameterized queries, strict separation of code and data |
| **Cross-Site Scripting (XSS)** | Untrusted input rendered as script in a victim's browser | Context-aware output encoding, Content Security Policy |
| **Cross-Site Request Forgery (CSRF)** | A victim's browser is induced to send an authenticated request | SameSite cookies, anti-CSRF tokens |
| **Broken access control** | Authorization not enforced on every request | Server-side checks per request, deny by default |
| **Broken authentication** | Weak credentials, session handling, or recovery flows | MFA, secure session management, rate limiting |
| **Insecure deserialization** | Attacker-controlled serialized data instantiated by the application | Avoid deserializing untrusted input, use data-only formats |
| **SSRF** | The server is induced to make requests to attacker-chosen destinations | Allow-list outbound destinations, block internal ranges |
| **Path traversal** | Manipulated file paths escape the intended directory | Canonicalize and validate paths, avoid user input in paths |
| **XXE** | XML parser processes attacker-supplied external entities | Disable external entity resolution |

### XSS variants

| Type | Where the payload lives | Detection note |
|------|------------------------|----------------|
| **Reflected** | Returned immediately in the response to a crafted request | Visible in HTTP traffic |
| **Stored** | Persisted server-side and served to other users | Highest impact, affects every viewer |
| **DOM-based** | Never reaches the server, executed entirely client-side | **Not visible in HTTP traffic**, requires browser-level analysis |

DOM-based XSS is the variant proxy-based tooling misses, because the payload can travel in the URL fragment and never appears in a request the server or an intercepting proxy records.

## 12. The OWASP Top Ten

The OWASP Top Ten is a **standard awareness document** representing broad consensus on the most critical web application security risks. It is not a complete security standard or a compliance checklist, though it is frequently used as a baseline in both.

### OWASP Top 10:2025

The current edition, announced November 2025 and finalized January 2026. It is the first revision since 2021 and introduces two new categories, one consolidation, and significant re-ranking.

| Rank | Category | Description |
|------|----------|-------------|
| **A01** | **Broken Access Control** | Users act outside their intended permissions. Now also absorbs SSRF. Covers BOLA and BFLA API authorization failures |
| **A02** | **Security Misconfiguration** | Insecure defaults, unnecessary features enabled, missing hardening, verbose errors. Rose from fifth place |
| **A03** | **Software Supply Chain Failures** | **New.** Vulnerable and compromised dependencies, build systems, and distribution channels across the software lifecycle |
| **A04** | **Cryptographic Failures** | Weak, missing, or misapplied cryptography exposing data in transit or at rest |
| **A05** | **Injection** | Untrusted input interpreted as a command or query. Includes SQL injection, command injection, and XSS |
| **A06** | **Insecure Design** | Missing or ineffective security controls at the design stage, which no amount of correct implementation can fix |
| **A07** | **Authentication Failures** | Weak credential handling, flawed session management, broken recovery flows |
| **A08** | **Software or Data Integrity Failures** | Code or data accepted without integrity verification, including insecure deserialization and unverified updates |
| **A09** | **Security Logging and Alerting Failures** | Insufficient logging, detection, and response, allowing breaches to persist undetected |
| **A10** | **Mishandling of Exceptional Conditions** | **New.** Failure to prevent, detect, or respond appropriately to unusual conditions, causing crashes and unexpected behavior |

**Key changes from 2021:**

- **Two new categories:** Software Supply Chain Failures (A03) and Mishandling of Exceptional Conditions (A10).
- **SSRF consolidated** into Broken Access Control, having been its own category (A10) in 2021.
- **Security Misconfiguration** rose from fifth to second, reflecting the exposure created by continuous deployment without continuous scanning.
- **Broken Access Control** remains first, unchanged across four consecutive editions.
- **Emphasis on root causes over symptoms.** The list deliberately names underlying failures rather than their visible effects.

The 2025 edition was built from analysis of more than 175,000 CVE records, with CWEs mapped across the ten categories.

### OWASP Top 10:2021

The prior edition, still referenced in much existing material, tooling, and training:

| Rank | Category |
|------|----------|
| A01 | Broken Access Control |
| A02 | Cryptographic Failures |
| A03 | Injection |
| A04 | Insecure Design |
| A05 | Security Misconfiguration |
| A06 | Vulnerable and Outdated Components |
| A07 | Identification and Authentication Failures |
| A08 | Software and Data Integrity Failures |
| A09 | Security Logging and Monitoring Failures |
| A10 | Server-Side Request Forgery (SSRF) |

**Mapping note:** 2021's A06 Vulnerable and Outdated Components is broadened into 2025's A03 Software Supply Chain Failures. 2021's A10 SSRF moves into 2025's A01. Both editions appear in current practice, so the edition should be stated whenever a category is cited.

### Related OWASP projects

- **OWASP API Security Top 10:** dedicated to API-specific risks, led by BOLA and BFLA.
- **OWASP Mobile Top 10:** mobile application risks.
- **OWASP ASVS:** the Application Security Verification Standard, a detailed and testable requirements set, unlike the awareness-focused Top Ten.
- **OWASP Cheat Sheet Series:** implementation guidance per topic.

## 13. Security Testing Approaches

| Approach | Method | Strengths | Limits |
|----------|--------|-----------|--------|
| **SAST** | Static analysis of source code | Early in the lifecycle, full code coverage, precise location | High false positives, cannot find runtime or configuration flaws |
| **DAST** | Testing the running application from outside | Finds runtime and configuration issues, no source needed | Late in the lifecycle, limited coverage, no code location |
| **IAST** | Instrumentation inside the running application | Accurate, links runtime findings to code | Requires instrumentation, language-dependent |
| **SCA** | Dependency and component analysis | Identifies known vulnerable and outdated components | Limited to known and published vulnerabilities |
| **Manual penetration testing** | Human-driven testing | Finds business logic and chained flaws no scanner detects | Time-bound, point-in-time, resource-intensive |

**The critical gap:** automated tooling cannot find **business logic flaws**. A scanner cannot determine that a negative quantity should be rejected, that a discount code should not stack indefinitely, or that a workflow step can be skipped. These require a human who understands what the application is supposed to do, which is why manual testing remains necessary alongside automation.

### Common tooling

| Tool | Purpose |
|------|---------|
| **Burp Suite** | Intercepting proxy, request manipulation, and testing workflow |
| **OWASP ZAP** | Open-source intercepting proxy and scanner |
| **Browser developer tools** | Inspecting DOM, network traffic, storage, and client-side execution |
| **Nikto** | Web server misconfiguration scanning |
| **Gobuster / ffuf** | Directory, file, and parameter discovery |
| **sqlmap** | Automated SQL injection detection and exploitation |

Browser developer tools are the required instrument for **DOM-based XSS**, since the vulnerability executes entirely client-side and does not appear in intercepted HTTP traffic.

## 14. Bug Bounty Programs

A bug bounty program invites external researchers to find and report vulnerabilities in exchange for recognition or payment, under defined rules.

### How programs work

1. **Scope definition.** The organization states which assets are in scope, which are excluded, and which vulnerability classes qualify.
2. **Rules of engagement.** Permitted techniques, prohibited actions such as denial of service or social engineering, and data handling requirements.
3. **Safe harbor.** A commitment not to pursue legal action against researchers acting within the rules. This is what makes participation lawful.
4. **Submission.** The researcher reports with reproduction steps and evidence of impact.
5. **Triage.** The program validates, deduplicates, and assesses severity.
6. **Reward.** Payment scaled to severity and impact.
7. **Remediation and disclosure.** The organization fixes, and the report may be published by agreement.

### Program types

| Type | Access | Characteristics |
|------|--------|-----------------|
| **Public** | Open to all researchers | High volume, high duplicate rate, broad coverage |
| **Private** | Invitation only | Selected researchers, less noise, often higher rewards |
| **Vulnerability Disclosure Program (VDP)** | Open reporting channel | **No monetary reward**, provides a lawful route to report |
| **Time-bound** | Limited window | Focused campaign against a specific target or release |

### Bug bounty compared to penetration testing

| | Bug bounty | Penetration test |
|---|-----------|------------------|
| **Duration** | Continuous | Fixed engagement window |
| **Testers** | Many, with varied skills and approaches | A small defined team |
| **Payment** | Per valid finding | Fixed fee for the engagement |
| **Coverage** | Unpredictable, driven by researcher interest | Methodical against an agreed scope |
| **Deliverable** | Individual reports as found | Comprehensive report |
| **Compliance value** | Rarely satisfies requirements alone | Commonly required by standards |

The two are complementary rather than alternative. A penetration test provides assured methodical coverage at a point in time. A bounty provides continuous, diverse attention. Neither replaces secure development practice.

### Legal boundaries

Participation is lawful **only within the published scope and rules**. Testing an asset that is out of scope, or using a prohibited technique, removes safe harbor protection and constitutes unauthorized access. Reading the program policy in full before testing is not optional.

Standard prohibitions include: accessing or exfiltrating other users' data beyond minimal proof, denial of service testing, social engineering of staff or users, physical attacks, automated scanning that degrades service, and public disclosure before remediation.

### Major platforms

HackerOne, Bugcrowd, Intigriti, YesWeHack, and Synack operate as intermediaries handling scope publication, triage, and payment. Many large organizations also run independent programs directly.

## 15. Operational Notes

- **The front-end cannot enforce anything.** Client-side validation improves usability and reduces server load. It provides no security, because the client is fully attacker-controlled.
- **HTTP is stateless by design.** All session continuity is something the application adds deliberately, and every mechanism for adding it introduces its own risks.
- **The fragment never reaches the server.** Anything after `#` is client-side only, which is why DOM-based flaws leave no server-side evidence.
- **Encoding is not encryption.** Base64 and URL encoding are reversible by anyone. A JWT payload is readable by whoever holds the token.
- **CORS does not prevent CSRF.** It governs reading responses, not sending requests.
- **Same-origin requires scheme, host, and port to match.** Subdomains are different origins.
- **Stateless tokens cannot be easily revoked.** Short expiry with refresh tokens is the standard compromise.
- **Cite the OWASP edition.** Category numbers changed between 2021 and 2025, and both remain in circulation.
- **Broken Access Control has ranked first in four consecutive editions,** and remains the most consequential category.
- **Scanners cannot find business logic flaws.** Automation and manual testing address different classes of problem.
- **A service worker persists beyond the page.** Registration through an XSS flaw converts a transient vulnerability into a durable one.
- **Bug bounty safe harbor applies only within scope.** Outside it, testing is unauthorized access.

## 16. Fast Recall

- **Request lifecycle:** URL parse, DNS resolution, TCP connect, TLS handshake, HTTP request, server processing, response, render.
- **URL components:** scheme, host, port, path, query, fragment. The **fragment is never sent to the server**.
- **Safe methods** do not change state (GET, HEAD, OPTIONS). **Idempotent** methods produce the same result when repeated (GET, PUT, DELETE).
- **401** means not authenticated. **403** means authenticated but not authorized.
- **Cookie security attributes:** HttpOnly (no JavaScript access), Secure (HTTPS only), SameSite (CSRF defense).
- **Web 1.0 read-only, Web 2.0 read and write, Web 3.0 read, write, and own.**
- **PWA requirements:** HTTPS, service worker, web app manifest, responsive design.
- **The front-end is untrusted.** All security enforcement happens server-side.
- **Origin = scheme + host + port.** All three must match for same-origin.
- **CORS relaxes the Same-Origin Policy.** It does not defend against CSRF.
- **HTTP is stateless.** Stateful uses server-side sessions with a session ID cookie. Stateless uses self-contained signed tokens.
- **Stateful revokes instantly; stateless cannot revoke easily.** That is the central trade-off.
- **A JWT payload is encoded, not encrypted.** Never place secrets in it.
- **Structured** data has a predefined schema. **Unstructured** does not. **Semi-structured** (JSON, XML) sits between and is what APIs exchange.
- **XSS variants:** reflected, stored, and DOM-based. **DOM-based does not appear in HTTP traffic.**
- **OWASP Top 10:2025 A01 is Broken Access Control** (now including SSRF), **A02 Security Misconfiguration**, **A03 Software Supply Chain Failures** (new), **A10 Mishandling of Exceptional Conditions** (new).
- **In 2021, A03 was Injection and A10 was SSRF.** Always state the edition.
- **SAST** analyzes code, **DAST** tests the running application, **SCA** examines dependencies. None find business logic flaws.
- **A VDP offers a lawful reporting channel with no payment.** A bug bounty pays per valid finding.
- **Safe harbor applies only inside the published scope.**

## 17. Resources

**Web fundamentals**
- [MDN Web Docs](https://developer.mozilla.org/en-US/)
- [MDN: How the Web works](https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/How_the_Web_works)
- [MDN: HTTP overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview)
- [MDN: Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [web.dev](https://web.dev/)

**OWASP**
- [OWASP Top 10:2025](https://owasp.org/Top10/2025/)
- [OWASP Top 10:2021](https://owasp.org/Top10/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [OWASP Application Security Verification Standard (ASVS)](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

**Practice and training**
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/)
- [PentesterLab](https://pentesterlab.com/)

**Tools**
- [Burp Suite](https://portswigger.net/burp)
- [OWASP ZAP](https://www.zaproxy.org/)
- [sqlmap](https://sqlmap.org/)
- [ffuf](https://github.com/ffuf/ffuf)

**Bug bounty platforms**
- [HackerOne](https://www.hackerone.com/)
- [Bugcrowd](https://www.bugcrowd.com/)
- [Intigriti](https://www.intigriti.com/)
- [YesWeHack](https://www.yeswehack.com/)

---
