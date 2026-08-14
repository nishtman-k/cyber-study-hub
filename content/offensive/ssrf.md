# Server-Side Request Forgery (SSRF)

> **⚠️ AUTHORIZED USE ONLY.** This material is for education and authorized security testing. SSRF testing makes the target server issue requests to internal infrastructure, and can reach systems well beyond the application in scope. Perform it only on systems you own, a designated lab platform, or a target explicitly in scope for an authorized engagement, and confirm that internal-network pivoting is permitted by the rules of engagement before starting. Cloud metadata endpoints hold live credentials; never retrieve or use them outside an authorized test. See the Legal and Terms of Use page.

> "The firewall stopped everyone on the outside. It could not stop the server it was protecting."

**Scope:** Forcing a server to make attacker-controlled requests. What SSRF is, how it works, its types, the internal and cloud targets it reaches, filter-bypass techniques, blind SSRF detection, and the layered defenses that prevent it.

## Table of Contents
- [Core Vocabulary](#core-vocabulary)
- [What SSRF Is](#what-ssrf-is)
- [How SSRF Works](#how-ssrf-works)
- [Why the Server Is a Weapon](#why-the-server-is-a-weapon)
- [Types of SSRF](#types-of-ssrf)
- [Impact and Risks](#impact-and-risks)
- [Where SSRF Appears](#where-ssrf-appears)
- [Common Attack Scenarios](#common-attack-scenarios)
- [Internal Network Enumeration](#internal-network-enumeration)
- [Cloud Metadata Attacks](#cloud-metadata-attacks)
- [Protocol Smuggling](#protocol-smuggling)
- [Finding SSRF](#finding-ssrf)
- [Blind SSRF Detection](#blind-ssrf-detection)
- [Filter Bypass: IP Representation](#filter-bypass-ip-representation)
- [Filter Bypass: URL Parsing](#filter-bypass-url-parsing)
- [Filter Bypass: Redirects and DNS](#filter-bypass-redirects-and-dns)
- [Prevention: Network Controls](#prevention-network-controls)
- [Prevention: Application Controls](#prevention-application-controls)
- [Defense in Depth](#defense-in-depth)
- [Professional Reporting](#professional-reporting)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Vocabulary

| Term | Meaning |
|------|---------|
| **SSRF** | Server-Side Request Forgery: making a server issue requests to a destination the attacker chooses |
| **In-band** | The server's response to the forged request is returned to the attacker |
| **Blind** | No response is returned; success is inferred out of band or by timing |
| **Metadata endpoint** | A cloud-internal address serving instance data and credentials |
| **IMDS** | Instance Metadata Service, the cloud metadata mechanism |
| **Link-local address** | The `169.254.0.0/16` range, reachable only from the host itself |
| **Allow-list** | An explicit list of permitted destinations, everything else denied |
| **DNS rebinding** | Changing a hostname's resolution between validation and use |
| **Out-of-band (OAST)** | Detecting a vulnerability through a callback to a server you control |
| **CWE-918** | The formal classification for SSRF |

**The definition in one sentence:** SSRF occurs when an application fetches a resource from a **user-supplied URL** without validating the destination, allowing an attacker to redirect that request to internal systems the server can reach but they cannot.

## 2. What SSRF Is

Web servers routinely act on behalf of users: fetching a remote image, importing a file from a URL, calling a third-party API, generating a PDF from a web page, or verifying a webhook. Each of these means the server makes an outbound request to an address the user influenced.

SSRF is the abuse of that behavior. When the application takes a URL from the user and fetches it without checking where it points, the attacker can point it anywhere the **server** can reach, including places they cannot reach themselves.

### Where it sits in the standards

SSRF is classified as **CWE-918**. In the OWASP Top 10 it was significant enough to appear as its own category, **A10:2021 Server-Side Request Forgery**, added following an industry survey that ranked it highly despite relatively low data-driven incidence. In the **2025 edition it was consolidated into A01 Broken Access Control**, reflecting that SSRF is fundamentally an access-control failure: the server accesses a resource on the attacker's behalf that the attacker is not authorized to reach.

Cite the edition when referencing it, since the category number changed.

### The vulnerable pattern

```python
# VULNERABLE: fetches whatever URL the user supplies
@app.route('/fetch')
def fetch():
    url = request.args.get('url')
    response = requests.get(url)      # no validation of the destination
    return response.text
```

```http
GET /fetch?url=https://example.com/image.png     legitimate use
GET /fetch?url=http://127.0.0.1:6379/            the attack
GET /fetch?url=http://169.254.169.254/           cloud credentials
```

Nothing about the second and third requests is malformed. They are valid URLs. The flaw is that the application never asked whether the destination was one it should be fetching.

## 3. How SSRF Works

The mechanism has three parties, and the trick is that the attacker never talks to the target directly.

```text
[Attacker]  ──(1) supplies URL──▶  [Vulnerable Server]  ──(2) fetches it──▶  [Internal Target]
                                            │                                        │
     ◀──────────(4) response (if in-band)────┘◀────────(3) responds───────────────────┘
```

1. The attacker submits a URL pointing at an internal or otherwise restricted destination.
2. The vulnerable server, trusting the input, makes the request **from its own network position**.
3. The internal target responds to the server, because the request came from a trusted internal source.
4. If the application returns the fetched content, the attacker reads the response. If not, the attack is blind.

### Why the request succeeds

The internal target applies its access controls based on **where the request came from**. It came from the application server, which sits inside the network, often on an allow-listed IP, sometimes with credentials attached automatically. From the target's perspective this is an entirely legitimate internal request.

The attacker has not bypassed the firewall. They have borrowed a machine that is already inside it.

## 4. Why the Server Is a Weapon

The reason SSRF is so serious is the difference between the attacker's network position and the server's.

| | Attacker's position | Server's position |
|---|---------------------|-------------------|
| **Internal network** | Blocked by the firewall | Directly connected |
| **`localhost` services** | Unreachable | Reachable, and often unauthenticated |
| **Cloud metadata** | Unreachable | Reachable, serving live credentials |
| **Admin panels bound to internal interfaces** | Unreachable | Reachable |
| **Trust from other internal services** | None | Frequently allow-listed by IP |

Internal services are commonly built on the assumption that anything reaching them is already trusted, so they run **without authentication**: internal APIs, databases, caches, admin consoles, monitoring dashboards, and orchestration endpoints. That assumption holds only while nothing outside can reach them.

SSRF breaks exactly that assumption. It converts an internet-facing application into a **proxy into the internal network**, and everything that was safe because it was unreachable becomes reachable.

## 5. Types of SSRF

SSRF is classified first by whether the response comes back, and then by the destination.

### By response visibility

| Type | Behavior | Exploitation |
|------|----------|--------------|
| **In-band (basic)** | The fetched content is returned in the application's response | Direct reading of internal resources. The most valuable |
| **Semi-blind** | No content, but status codes, error messages, or response times differ | Enumeration by inference |
| **Blind** | No usable feedback at all | Confirmed out of band; exploited to trigger actions rather than read data |

### By destination

| Target | Purpose |
|--------|---------|
| **Loopback (`127.0.0.1`)** | Services bound to localhost, admin interfaces, unauthenticated APIs |
| **Internal network (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)** | Host discovery, port scanning, internal applications |
| **Cloud metadata (`169.254.169.254`)** | Instance credentials and configuration |
| **External** | Using the server as a proxy to attack third parties or exfiltrate data |

### By protocol

Where the URL handler supports more than HTTP, the impact widens considerably. Covered in Section 11.

## 6. Impact and Risks

The impact is determined by what the server can reach, which is usually far more than the application itself exposes.

| Impact | Description |
|--------|-------------|
| **Internal network mapping** | Discover live hosts and open ports behind the firewall |
| **Sensitive data disclosure** | Read internal APIs, configuration endpoints, admin panels |
| **Cloud credential theft** | Retrieve IAM role credentials from the metadata service |
| **Full cloud account compromise** | Stolen credentials used against the provider's API |
| **Local file disclosure** | Where `file://` is supported, read files from the server |
| **Remote code execution** | Via protocol smuggling into services such as caches or queues |
| **Authentication bypass** | Reach internal endpoints that trust the server's IP |
| **Denial of service** | Direct the server at large resources or at itself |
| **Attack proxying** | Launch attacks against third parties from the victim's IP, with attribution landing on them |

### Why cloud metadata is the highest-value target

On a cloud instance, the metadata service hands out **temporary credentials for the instance's IAM role** to anything on the host that asks. No authentication is required, because the service assumes anything running on the instance is authorized.

An SSRF that reaches it therefore does not just leak data, it leaks **the identity of the server itself**. Whatever that role can do (read storage buckets, query databases, launch instances, modify infrastructure) the attacker can now do, from their own machine, using the stolen credentials. This is the path by which a single unvalidated URL parameter has repeatedly turned into full cloud account compromise, most famously in the 2019 Capital One breach.

## 7. Where SSRF Appears

Any feature that fetches something by URL is a candidate. These are the recurring ones.

| Feature | Why it fetches |
|---------|----------------|
| **URL preview and link unfurling** | Retrieves the page to render a thumbnail and title |
| **Webhooks** | Sends requests to a user-configured callback URL |
| **File import from URL** | Downloads a document, image, or dataset |
| **PDF and screenshot generators** | Renders a page, and often loads its subresources |
| **Image processing and thumbnails** | Fetches a remote image to transform |
| **Document converters** | Retrieves referenced resources while converting |
| **RSS and feed readers** | Fetch remote feeds |
| **Proxy and fetch endpoints** | Explicitly designed to retrieve a URL |
| **SSO and OIDC flows** | Fetch discovery documents and JWKS keys from a configured issuer |
| **Integrations and API connectors** | Call a user-specified base URL |
| **XML parsers** | XXE can trigger outbound requests, a distinct flaw that produces SSRF |
| **Health checks and monitoring** | Fetch a user-supplied endpoint to verify it |

### Parameters worth hunting

```text
url, uri, link, src, source, target, dest, destination
redirect, redirect_uri, return, returnUrl, next, continue
fetch, load, get, path, file, document, image, img
callback, webhook, endpoint, host, domain, site, feed, proxy
```

**A useful habit:** any parameter whose value is a URL, or that looks like it might become one, deserves a test. Also check JSON bodies, where URLs frequently appear nested inside configuration objects that never surface in the interface.

## 8. Common Attack Scenarios

Four scenarios cover most real SSRF exploitation.

### Scenario 1: reaching localhost services

An application fetches a user-supplied URL for a preview. The attacker points it at the server itself.

```http
GET /preview?url=http://127.0.0.1:8080/admin
GET /preview?url=http://localhost/server-status
```

Administrative interfaces are frequently bound to `localhost` on the assumption that only local processes can reach them. SSRF makes the application a local process acting on the attacker's behalf.

### Scenario 2: cloud credential theft

```http
GET /fetch?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

Covered in detail in Section 10. This is the highest-impact scenario in any cloud-hosted application.

### Scenario 3: internal network enumeration

Iterating through internal addresses and ports, using response differences to map what exists. Covered in Section 9.

### Scenario 4: webhook abuse

An application lets a user configure a webhook URL and then sends requests to it. The attacker sets the webhook to an internal address, and every triggered event becomes a forged internal request. This is a common blind SSRF, and it is often overlooked because webhooks are a legitimate, expected outbound-request feature.

## 9. Internal Network Enumeration

The classic demonstration: using the server to map the network behind the firewall.

### The approach

```http
GET /fetch?url=http://192.168.1.1/
GET /fetch?url=http://192.168.1.2/
GET /fetch?url=http://10.0.0.5:8080/
```

Because the requests originate from inside, they reach hosts the attacker cannot touch directly. The **differences between responses** reveal the topology.

### Reading the differences

| Observation | Inference |
|-------------|-----------|
| **Fast error, connection refused** | Host is up, that port is closed |
| **Slow response, then timeout** | No host at that address, or the packet was dropped |
| **Content returned** | A service is listening and responded |
| **Distinct error message** | The service exists but rejected the request |
| **Different response length** | Something answered differently, worth investigating |

Even a fully blind SSRF leaks information through **timing**: a refused connection returns quickly, a filtered or non-existent host hangs until timeout. That difference alone is enough to distinguish live hosts from empty addresses.

### Ports worth probing

| Port | Service |
|------|---------|
| 22 | SSH |
| 80, 443, 8000, 8080, 8443 | Web and admin interfaces |
| 3306 | MySQL |
| 5432 | PostgreSQL |
| 6379 | Redis (historically unauthenticated by default) |
| 9200 | Elasticsearch |
| 11211 | Memcached |
| 27017 | MongoDB |
| 2375 | Docker API (unauthenticated where exposed) |
| 8500 | Consul |

The databases and caches on this list are the reason SSRF escalates: many are designed for internal use and ship without authentication, so simply reaching them is often enough.

> **In authorized testing, keep enumeration narrow and slow.** Sweeping an internal range through a production application generates significant traffic and load, and is frequently outside the rules of engagement even when SSRF itself is in scope.

## 10. Cloud Metadata Attacks

Every major cloud provider runs a metadata service on the **link-local address `169.254.169.254`**, reachable only from the instance itself. It serves instance configuration and, critically, temporary credentials.

### AWS

```http
http://169.254.169.254/latest/meta-data/
http://169.254.169.254/latest/meta-data/iam/security-credentials/
http://169.254.169.254/latest/meta-data/iam/security-credentials/ROLE-NAME
```

The final request returns an access key, secret key, and session token for the instance's IAM role.

### IMDSv1 vs IMDSv2, the important distinction

| | IMDSv1 | IMDSv2 |
|---|--------|--------|
| **Method** | A simple `GET` | Requires a `PUT` to obtain a session token first |
| **Header required** | None | `X-aws-ec2-metadata-token` |
| **Hop limit** | None | Defaults to 1, so proxied requests are dropped |
| **SSRF exposure** | **Fully exploitable** | Largely mitigated |

IMDSv2 defeats most SSRF because a typical vulnerable fetcher can only issue simple `GET` requests, cannot set custom headers, and its request appears as an extra network hop. **Enforcing IMDSv2 is the single most effective cloud-side control against SSRF credential theft**, and it should be required rather than merely available.

### Other providers

```text
GCP:    http://metadata.google.internal/computeMetadata/v1/
        (requires header Metadata-Flavor: Google)

Azure:  http://169.254.169.254/metadata/instance?api-version=2021-02-01
        (requires header Metadata: true)

DigitalOcean: http://169.254.169.254/metadata/v1/
```

GCP and Azure both require a custom header, which provides similar protection to IMDSv2 against basic SSRF, since simple fetchers cannot add headers. Where an SSRF primitive **can** control headers, that protection disappears.

### The alternate representations

Filters that block the literal string `169.254.169.254` are frequently bypassed with an equivalent representation of the same address, using the techniques in Section 14.

## 11. Protocol Smuggling

If the URL handler supports schemes beyond HTTP, SSRF widens from "fetch a page" to "speak arbitrary protocols."

| Scheme | Capability |
|--------|-----------|
| `file://` | Read local files from the server's filesystem |
| `gopher://` | Send largely arbitrary bytes to a TCP port, enabling protocol smuggling |
| `dict://` | Query a port and retrieve a banner, useful for service fingerprinting |
| `ftp://` | Connect to FTP services |
| `ldap://` | Query directory services |
| `sftp://`, `tftp://` | Further file transfer paths |

### file:// for local file disclosure

```text
file:///etc/passwd
file:///proc/self/environ           environment variables, often including secrets
file:///var/www/config.php
file:///home/user/.aws/credentials
```

### Why gopher:// is the dangerous one

`gopher://` allows the attacker to specify raw bytes sent to an arbitrary TCP port. Because many internal services speak simple text protocols, this permits **constructing a complete valid command sequence** to a service that was never meant to be reachable.

The practical consequence is that a read-only-looking SSRF becomes a **write** primitive against internal services: setting cache entries, queuing jobs, sending mail through an internal relay, or issuing commands to an unauthenticated data store. This is the usual path from SSRF to remote code execution.

**The defense is simple and categorical:** the URL fetcher should permit **only `http` and `https`**, and every other scheme should be rejected. Most libraries support far more schemes than any application actually needs, and the unused ones are pure attack surface.

## 12. Finding SSRF

### The testing loop

| Step | Action |
|------|--------|
| **1. Enumerate** | Identify every parameter that accepts or might accept a URL |
| **2. Baseline** | Submit a legitimate external URL you control and confirm the fetch happens |
| **3. Confirm reachability** | Watch your own server's logs for the incoming request |
| **4. Redirect inward** | Point the parameter at `127.0.0.1`, then internal ranges, then metadata |
| **5. Read the difference** | Compare status codes, body content, error messages, and timing |
| **6. Escalate** | Test alternate ports, schemes, and bypass representations |
| **7. Document** | Record the request, the evidence, and what was reachable |

**Step 2 and 3 come first for a reason.** Before testing internal addresses, confirm the server actually fetches a URL you control. A hit in your own logs proves the SSRF primitive exists, which is a valid finding on its own, and tells you the requests are going somewhere before you start probing internal space.

### Confirming with a listener

```bash
# simple listener on a host you control
python3 -m http.server 8000

# or capture the raw request
nc -lvnp 8000
```

Then submit `http://your-server.example:8000/test` and watch for the connection. The request's source IP and `User-Agent` also tell you what is doing the fetching, which is useful context for the report.

### Test payload progression

```text
http://your-server.example/                  confirm the primitive exists
http://127.0.0.1/                            loopback
http://127.0.0.1:8080/                       common local admin ports
http://localhost/                            hostname form
http://169.254.169.254/                      cloud metadata
http://192.168.0.1/                          internal ranges
file:///etc/passwd                            alternate scheme
```

## 13. Blind SSRF Detection

When nothing comes back, detection moves out of band: make the server contact a host **you** control, and watch for the callback.

### Out-of-band tooling

| Tool | Notes |
|------|-------|
| **Burp Collaborator** | Burp Professional's OAST service, gives a unique domain per test |
| **interactsh** | Open-source OAST, self-hostable, works with Burp Community |
| **Your own server** | A VPS with a listener and DNS you control |

Submit a unique subdomain in the vulnerable parameter and watch for interaction:

```text
http://uniqueid.oast.example/
```

### DNS versus HTTP callbacks

This distinction matters and is frequently misread:

| Observed | Meaning |
|----------|---------|
| **DNS lookup only** | The server resolved the hostname but the connection was blocked, likely by egress filtering. SSRF exists but outbound HTTP is restricted |
| **DNS lookup plus HTTP request** | The server both resolved and connected. Full outbound SSRF |

A DNS-only callback is still a genuine finding: it proves attacker-controlled input reaches a network request, and internal destinations may still be reachable even when external ones are not.

### Exploiting blind SSRF

Without a response, blind SSRF is exploited by **causing effects rather than reading data**: triggering state-changing requests against internal services, reaching endpoints that act on a `GET`, and inferring topology from timing differences. Timing is the main enumeration channel, as described in Section 9.

## 14. Filter Bypass: IP Representation

Applications commonly block internal destinations with a denylist of strings such as `127.0.0.1` and `169.254.169.254`. The same address has many valid representations, which is precisely why denylisting fails here.

### Representations of 127.0.0.1

| Form | Value |
|------|-------|
| Decimal | `2130706433` |
| Octal | `0177.0.0.1` or `017700000001` |
| Hexadecimal | `0x7f000001` |
| Short form | `127.1` |
| Mixed | `0x7f.1` |
| IPv6 loopback | `[::1]` |
| IPv4-mapped IPv6 | `[::ffff:127.0.0.1]` |
| Alternate loopback | `127.0.0.2` through `127.255.255.254` |
| All-zeros | `0.0.0.0` |

```text
http://2130706433/
http://0x7f000001/
http://127.1/
http://[::1]/
http://0/
```

### Representations of 169.254.169.254

```text
http://2852039166/                  decimal
http://0xa9fea9fe/                  hexadecimal
http://[::ffff:169.254.169.254]/    IPv4-mapped IPv6
```

### Resolver services

Public DNS services resolve an embedded address to that address, so a hostname passes a string filter while resolving internally:

```text
http://127.0.0.1.nip.io/
http://169.254.169.254.nip.io/
```

**The defensive conclusion:** never validate a destination by string-matching the URL. **Resolve the hostname to an IP address, then validate the resolved IP** against the reserved and internal ranges. That is the only approach that handles every representation at once, because they all resolve to the same address.

## 15. Filter Bypass: URL Parsing

These bypasses exploit disagreements between the component that **validates** the URL and the component that **fetches** it. When two parsers read the same string differently, the check and the action target different hosts.

### Credentials in the authority

```text
http://trusted.example@127.0.0.1/
http://trusted.example@169.254.169.254/
```

Everything before `@` is userinfo, not the host. A naive validator sees `trusted.example` at the start of the string and approves; the HTTP client correctly parses the host as the address after the `@`.

### Fragment truncation

```text
http://127.0.0.1#trusted.example
http://127.0.0.1%23trusted.example
```

A validator that searches for the allowed domain anywhere in the string finds it; the client discards everything after `#`.

### Path and subdomain confusion

```text
http://trusted.example.attacker.example/       attacker-controlled domain that starts with the allowed one
http://attacker.example/trusted.example        allowed string appears only in the path
```

Both defeat validators that use a substring or `startsWith` check rather than parsing the URL properly.

### Encoding and case

```text
http://127.0.0.1/         →  http://127.0.0.1%2F
http://LOCALHOST/                                  case variation
http://%6c%6f%63%61%6c%68%6f%73%74/                URL-encoded "localhost"
```

Double encoding is worth testing wherever a value passes through more than one decoding layer.

**The defensive conclusion:** validate using a **proper URL parser**, extract the host component, and check that, rather than pattern-matching the raw string. Then resolve and check the IP, as in Section 14. Substring matching on a URL is never a sound control.

## 16. Filter Bypass: Redirects and DNS

These two techniques defeat validation that is otherwise implemented correctly, which is why they matter most.

### Redirect-based bypass

The attacker supplies a URL on a domain they control, which passes validation cleanly. That server then responds with a redirect to an internal address, and the fetching client follows it.

```text
1. Submit:  http://attacker.example/redirect
2. Validation passes: the host is external and unremarkable
3. The server fetches it
4. attacker.example responds:  HTTP/1.1 302 Found
                               Location: http://169.254.169.254/latest/meta-data/
5. The HTTP client follows the redirect to the internal address
```

Validation happened once, on the original URL. The redirect target was never checked.

**The defense:** disable automatic redirect following in the fetching client, or re-validate the destination at **every** hop before following it. Most HTTP libraries follow redirects by default, so this must be turned off explicitly.

### DNS rebinding

A time-of-check to time-of-use attack against the resolution step.

```text
1. attacker.example resolves to a harmless public IP
2. The application resolves it, validates the IP, and approves
3. The DNS record's TTL expires (set very low by the attacker)
4. The application makes the actual request, resolving again
5. This time the hostname resolves to 127.0.0.1
```

The check and the request used different answers to the same question.

**The defense:** resolve the hostname **once**, validate that resolved IP, and then connect to **that IP address directly** rather than re-resolving the hostname. This closes the window between validation and use. Pinning the resolved address is the practical implementation.

## 17. Prevention: Network Controls

Network-layer controls limit what SSRF can reach even when the application flaw exists, which makes them essential rather than optional.

| Control | Effect |
|---------|--------|
| **Egress filtering** | Restrict outbound traffic from application servers to only the destinations they legitimately need |
| **Block link-local from the app tier** | Deny `169.254.0.0/16` where metadata access is not required |
| **Enforce IMDSv2** | Require the token-based metadata service, and set the hop limit to 1 |
| **Network segmentation** | Place internal services where the web tier cannot reach them |
| **Authenticate internal services** | Remove the assumption that internal traffic is trusted traffic |
| **Isolate the fetcher** | Run URL-fetching functionality in a separate, network-restricted service or container |

**The most important architectural point:** internal services should not be unauthenticated merely because they are internal. That design makes SSRF catastrophic rather than merely serious. Requiring authentication everywhere means a successful SSRF reaches a login prompt instead of an open admin console.

**Isolating the fetcher** is the strongest structural mitigation available. If URL fetching runs in a dedicated component with no route to internal networks or metadata, SSRF against it reaches nothing of value regardless of how the URL is crafted.

## 18. Prevention: Application Controls

| Control | Detail |
|---------|--------|
| **Allow-list destinations** | Permit only an explicit list of domains or IPs. The single most effective application-level control |
| **Never use a denylist** | Section 14 and 15 show why blocking known-bad strings cannot work |
| **Validate with a URL parser** | Extract the host properly; never substring-match the raw URL |
| **Resolve, then validate the IP** | Check the resolved address against reserved and private ranges, then connect to that IP |
| **Restrict schemes to http and https** | Reject `file`, `gopher`, `dict`, `ftp`, and everything else |
| **Disable redirect following** | Or re-validate at every hop |
| **Do not return raw responses** | Returning the fetched body to the user converts blind SSRF into in-band SSRF |
| **Set strict timeouts and size limits** | Limits enumeration by timing and prevents resource exhaustion |
| **Log outbound requests** | Enables detection of internal probing |

### The ranges to block after resolution

```text
127.0.0.0/8         loopback
10.0.0.0/8          private
172.16.0.0/12       private
192.168.0.0/16      private
169.254.0.0/16      link-local, including cloud metadata
0.0.0.0/8           this network
100.64.0.0/10       carrier-grade NAT
::1/128             IPv6 loopback
fc00::/7            IPv6 unique local
fe80::/10           IPv6 link-local
```

Remember to check IPv6 as well as IPv4. Filters that handle only IPv4 are routinely bypassed with the IPv6 forms shown in Section 14.

### Why allow-listing wins

An allow-list is the only application control that does not depend on anticipating every bypass. If the application legitimately needs to fetch from three known partner domains, permitting exactly those three and rejecting everything else makes representation tricks, parser confusion, and redirects all irrelevant, because none of them produce a destination on the list.

## 19. Defense in Depth

| Layer | Role |
|-------|------|
| **Destination allow-list** | The primary application fix |
| **Resolve-then-validate with IP pinning** | Handles alternate representations and DNS rebinding |
| **Scheme restriction** | Removes protocol smuggling entirely |
| **No redirect following** | Closes the redirect bypass |
| **Egress filtering** | Contains what a successful SSRF can reach |
| **IMDSv2 enforcement** | Protects the highest-value cloud target |
| **Internal service authentication** | Removes the "internal equals trusted" assumption |
| **Isolated fetching service** | Structural containment |
| **Response suppression** | Keeps blind SSRF blind |
| **Monitoring and outbound logging** | Detection when prevention fails |

**The priority:** allow-listing plus resolve-then-validate is the fix at the application layer. Egress filtering and IMDSv2 are the controls that decide whether a missed SSRF is an incident or a footnote. Defending only at one layer leaves the other doing nothing.

## 20. Professional Reporting

### What to include

| Element | Content |
|---------|---------|
| **Title** | The vulnerability, the endpoint, and the parameter |
| **Severity** | With justification based on what was reachable |
| **Affected endpoint** | Exact URL, method, and parameter |
| **Type** | In-band, semi-blind, or blind |
| **Reproduction steps** | The exact request and observed response |
| **Evidence** | Request, response, and callback logs, with credentials redacted |
| **What was reachable** | Internal hosts, ports, or metadata confirmed, without full exploitation |
| **Business impact** | What an attacker achieves, especially in cloud terms |
| **Remediation** | Allow-listing, scheme restriction, resolve-and-validate, IMDSv2 |
| **References** | CWE-918, OWASP guidance |

### Rating severity

Weigh what the SSRF actually reached. In-band with metadata access is critical. Blind with DNS-only callback is materially lower. The factors that move the rating are: whether cloud credentials are obtainable, whether internal services responded, whether non-HTTP schemes work, and whether the response content is returned.

### Writing the impact

| Instead of | Write |
|------------|-------|
| "The `url` parameter is vulnerable to SSRF." | "An attacker can make the application server issue requests to any internal address. In testing this reached the cloud metadata service, which serves temporary credentials for the instance's IAM role. Those credentials would grant the attacker the same access to cloud resources that the application itself holds, from outside the network entirely." |

**Handle credentials carefully.** If a test retrieves live IAM credentials, do not include them in the report, note that they were obtainable and were not used, and inform the client promptly so the role can be rotated. Proving reachability of the metadata path is sufficient evidence.

## 21. Fast Recall

- **SSRF** makes a server issue requests to attacker-chosen destinations because it fetches a user-supplied URL without validating where it points. **CWE-918**.
- **OWASP:** its own category **A10:2021**, consolidated into **A01 Broken Access Control in 2025**. Cite the edition.
- **The attacker never touches the target.** The server does, from inside the network, where it is trusted.
- **Types by visibility:** in-band (content returned), semi-blind (status or timing differ), blind (out-of-band only).
- **Key destinations:** loopback `127.0.0.1`, private ranges, and cloud metadata at **`169.254.169.254`**.
- **Cloud metadata is the highest-value target** because it serves live IAM credentials to anything that asks.
- **IMDSv2 is the key cloud defense:** it requires a `PUT` for a token, a custom header, and defaults to a hop limit of 1, which defeats typical SSRF.
- **GCP and Azure metadata require custom headers**, giving similar protection against simple fetchers.
- **Enumerate internally by response differences:** fast refusal means host up port closed, timeout means no host, content means a service answered. Timing alone works when blind.
- **Unauthenticated internal services** (Redis, Elasticsearch, Docker API, admin panels) are why SSRF escalates.
- **Scheme matters:** `file://` reads local files, `gopher://` smuggles raw bytes into TCP services and is the usual path to RCE. **Allow only http and https.**
- **Confirm the primitive first** by pointing at a listener you control before probing internal space.
- **Blind SSRF** is detected out of band with Burp Collaborator or interactsh. **DNS-only callback means egress is filtered but the flaw is real.**
- **IP representation bypasses:** decimal `2130706433`, hex `0x7f000001`, short `127.1`, IPv6 `[::1]`, and resolver domains like `nip.io`.
- **URL parser bypasses:** `@` userinfo, `#` fragment truncation, subdomain and path confusion. Never substring-match a URL.
- **Redirects bypass validation** because only the first URL is checked. Disable redirect following or re-validate every hop.
- **DNS rebinding** defeats correct validation by changing resolution between check and use. **Resolve once, validate the IP, connect to that IP.**
- **Allow-list destinations.** Denylists cannot work, given the number of equivalent representations.
- **Do not return the fetched response** to the user; it turns blind SSRF into in-band SSRF.
- **Defense in depth:** allow-list plus resolve-and-validate at the app layer, egress filtering plus IMDSv2 plus internal authentication at the infrastructure layer.

## 22. Resources

**Standards and prevention**
- [OWASP: Server-Side Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP: Server-Side Request Forgery](https://owasp.org/www-community/attacks/Server_Side_Request_Forgery)
- [OWASP Top 10: A10:2021 Server-Side Request Forgery](https://owasp.org/Top10/A10_2021-Server-Side_Request_Forgery_%28SSRF%29/)
- [MITRE CWE-918](https://cwe.mitre.org/data/definitions/918.html)
- [OWASP WSTG: Testing for Server-Side Request Forgery](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/19-Testing_for_Server-Side_Request_Forgery)

**Cloud metadata**
- [AWS: Instance metadata and IMDSv2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-metadata.html)
- [Google Cloud: Instance metadata](https://cloud.google.com/compute/docs/metadata/overview)
- [Azure: Instance Metadata Service](https://learn.microsoft.com/en-us/azure/virtual-machines/instance-metadata-service)

**Practice (authorized labs)**
- [PortSwigger Web Security Academy: SSRF](https://portswigger.net/web-security/ssrf)
- [PortSwigger: Blind SSRF](https://portswigger.net/web-security/ssrf/blind)
- [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/)

**Tools**
- [Burp Suite and Collaborator](https://portswigger.net/burp)
- [interactsh (open-source OAST)](https://github.com/projectdiscovery/interactsh)
- [OWASP ZAP](https://www.zaproxy.org/)
