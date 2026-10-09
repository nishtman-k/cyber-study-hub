# Phishing Email Analysis

"The attacker does not always attack the firewall. Sometimes the attacker sends an email." - Security awareness principle

> **⚠️ AUTHORIZED USE ONLY.** This material is for education, defensive email investigation, and authorized incident response. Analyze only messages and artifacts you are permitted to access. Never click suspicious links, open active content, enable macros, execute attachments, submit confidential files to public services, or contact attacker-controlled infrastructure from a production workstation. Preserve the original email, work from copies, defang indicators, and use approved isolated analysis services. See the [Legal and Terms of Use](/legal) page.

**Scope:** Safe phishing investigation: raw email preservation, MIME structure, SMTP routing, Received headers, sender identity, SPF, DKIM, DMARC alignment, social engineering analysis, URL extraction and defanging, attachment hashing and static inspection, IOC extraction, reputation context, lookalike-domain analysis, campaign clustering, click-impact investigation, credential-compromise assessment, endpoint and network correlation, ATT&CK mapping, detection-rule proposals, professional reporting, and evidence packaging.

## Table of Contents

- [Core Concepts](#core-concepts)
- [Phishing Investigation Workflow](#phishing-investigation-workflow)
- [Evidence Intake and Preservation](#evidence-intake-and-preservation)
- [Email Structure and MIME](#email-structure-and-mime)
- [Sender Identity Fields](#sender-identity-fields)
- [Received Header Chain](#received-header-chain)
- [Authentication-Results](#authentication-results)
- [SPF Analysis](#spf-analysis)
- [DKIM Analysis](#dkim-analysis)
- [DMARC Analysis](#dmarc-analysis)
- [Why Authentication Can Pass](#why-authentication-can-pass)
- [Header Red Flags](#header-red-flags)
- [Social Engineering Analysis](#social-engineering-analysis)
- [Safe URL Investigation](#safe-url-investigation)
- [Lookalike Domain Analysis](#lookalike-domain-analysis)
- [Attachment Analysis](#attachment-analysis)
- [IOC Extraction and Defanging](#ioc-extraction-and-defanging)
- [IOC Quality and Confidence](#ioc-quality-and-confidence)
- [Email Classification](#email-classification)
- [Campaign Correlation](#campaign-correlation)
- [Clicked-Link Investigation](#clicked-link-investigation)
- [Credential Compromise Assessment](#credential-compromise-assessment)
- [Endpoint and Network Correlation](#endpoint-and-network-correlation)
- [MITRE ATT&CK Mapping](#mitre-attck-mapping)
- [Detection Rule Proposals](#detection-rule-proposals)
- [Investigation Report Schema](#investigation-report-schema)
- [Evidence Package](#evidence-package)
- [Quality Gates](#quality-gates)
- [Professional Judgment](#professional-judgment)
- [Framework and Tool Map](#framework-and-tool-map)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Concepts

| Term                 | Meaning                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| **Phishing**         | Deceptive electronic communication intended to obtain access, information, money, or user action |
| **Spearphishing**    | Phishing targeted at a specific person, organization, industry, or role                          |
| **Header**           | Metadata describing message identity, routing, authentication, and handling                      |
| **MIME**             | Format used to represent message parts, content types, encodings, and attachments                |
| **Envelope sender**  | SMTP MAIL FROM identity, commonly reflected in Return-Path                                       |
| **Visible From**     | Author address displayed to the recipient by the mail client                                     |
| **Alignment**        | DMARC relationship between the visible From domain and authenticated SPF or DKIM domains         |
| **Lookalike domain** | Domain crafted to resemble a trusted domain visually or linguistically                           |
| **Defanging**        | Rewriting an indicator so it cannot be clicked or resolved accidentally                          |
| **IOC**              | Observable value that may help identify malicious infrastructure or artifacts                    |

### The core idea

```text
Preserve the message
     ↓
Parse headers and MIME
     ↓
Validate identity and routing
     ↓
Inspect content, URLs, and attachments safely
     ↓
Extract and score indicators
     ↓
Correlate related messages
     ↓
Assess user and endpoint impact
     ↓
Report and create detections
```

A suspicious email is not classified by one clue. The verdict comes from combined sender identity, routing, authentication, content, infrastructure, attachment, and impact evidence.

## 2. Phishing Investigation Workflow

Use the same workflow for every email so that results are comparable.

| Stage                          | Question                                                   | Output                    |
| ------------------------------ | ---------------------------------------------------------- | ------------------------- |
| **Intake**                     | What was received and is it intact?                        | Inventory and hashes      |
| **Parse**                      | What headers, MIME parts, links, and files exist?          | Parsed metadata           |
| **Authenticate**               | What do SPF, DKIM, and DMARC show?                         | Authentication assessment |
| **Analyze content**            | Which social engineering techniques are present?           | Content indicators        |
| **Investigate infrastructure** | What domains, IPs, URLs, and redirects are involved?       | IOC records               |
| **Inspect attachments**        | What file types, hashes, and static features exist?        | Attachment report         |
| **Correlate**                  | Are messages connected by infrastructure or behavior?      | Campaign clusters         |
| **Assess impact**              | Did a recipient click, authenticate, download, or execute? | Impact finding            |
| **Report**                     | What is the verdict and recommended action?                | Structured report         |

### Investigation order

```text
Headers before content
Static inspection before dynamic analysis
Reputation after local extraction
Impact assessment after message classification
```

## 3. Evidence Intake and Preservation

Preserve the original raw message before parsing or opening it in an email client.

### Intake fields

| Field               | Purpose                                 |
| ------------------- | --------------------------------------- |
| **email_id**        | Stable investigation identifier         |
| **source_file**     | Original EML, MSG, or raw-text path     |
| **sha256**          | Message integrity hash                  |
| **received_from**   | Reporter, gateway, or quarantine source |
| **received_at_utc** | Evidence intake time                    |
| **recipient**       | Intended mailbox                        |
| **handling_label**  | Access and sharing restriction          |
| **working_copy**    | Copy used for parsing                   |

### Preservation commands

```bash
mkdir -p phishing_case/{raw,work,parsed,attachments,reports,quarantine}
cp --preserve=timestamps suspicious.eml phishing_case/raw/
sha256sum phishing_case/raw/suspicious.eml > phishing_case/raw/SHA256SUMS
chmod -R a-w phishing_case/raw
cp phishing_case/raw/suspicious.eml phishing_case/work/
sha256sum -c phishing_case/raw/SHA256SUMS
```

### Preservation rule

Do not forward the message as a normal email because forwarding can alter headers, body structure, URLs, and attachments. Collect the original message as an attachment or raw source whenever possible.

## 4. Email Structure and MIME

A raw email contains headers, a blank line, and the message body. MIME allows multipart bodies and attachments.

### MIME fields

| Field                         | Meaning                                     |
| ----------------------------- | ------------------------------------------- |
| **MIME-Version**              | MIME format version                         |
| **Content-Type**              | Body or attachment media type               |
| **boundary**                  | Separator between multipart sections        |
| **Content-Disposition**       | Inline or attachment presentation           |
| **filename**                  | Suggested attachment name                   |
| **Content-Transfer-Encoding** | Base64, quoted-printable, or other encoding |
| **charset**                   | Character encoding for text content         |

### Safe parsing with Python

```python
#!/usr/bin/env python3
from email import policy
from email.parser import BytesParser
from pathlib import Path

message_path = Path("phishing_case/work/suspicious.eml")
message = BytesParser(policy=policy.default).parsebytes(message_path.read_bytes())

print("Subject:", message.get("subject"))
print("From:", message.get("from"))
print("To:", message.get("to"))
print("Message-ID:", message.get("message-id"))

for index, part in enumerate(message.walk()):
    print(index, part.get_content_type(), part.get_filename())
```

### MIME warning

File extensions and declared MIME types can lie. Determine file type from content using approved static tools and preserve the original filename separately.

## 5. Sender Identity Fields

Email contains several identities that may legitimately differ or may reveal deception.

| Field                  | Role                                 | Investigation use               |
| ---------------------- | ------------------------------------ | ------------------------------- |
| **From**               | Visible author identity              | Compare display name and domain |
| **Return-Path**        | Final envelope sender representation | SPF and bounce-routing context  |
| **Reply-To**           | Address used for replies             | Detect reply redirection        |
| **Sender**             | Sending agent acting for author      | Delegation context              |
| **Message-ID**         | Sender-generated message identifier  | Domain and campaign correlation |
| **To and Cc**          | Visible recipients                   | Targeting analysis              |
| **Envelope recipient** | SMTP delivery target                 | Mailing-list and BCC context    |

### Identity checks

- Does the display name impersonate a trusted person or service?
- Does the visible From domain match the claimed organization?
- Does Reply-To redirect responses to another domain?
- Does Message-ID use an unrelated domain?
- Does Return-Path reflect a legitimate sending provider or suspicious infrastructure?
- Are multiple From headers present?

## 6. Received Header Chain

Each mail transfer agent normally prepends a `Received` header. Read the chain from bottom to top to reconstruct the apparent route.

### Received fields

| Element       | Meaning                                  |
| ------------- | ---------------------------------------- |
| **from**      | Host claimed or observed as previous hop |
| **by**        | Receiving mail server                    |
| **with**      | SMTP transport variant                   |
| **id**        | Server queue identifier                  |
| **for**       | Recipient context, when included         |
| **timestamp** | Hop time and timezone                    |

### Routing analysis

```text
Bottom Received header: earliest recorded transit hop
     ↑
Intermediate Received headers: relays and gateways
     ↑
Top Received header: final handling before mailbox delivery
```

### Routing red flags

| Pattern                                                      | Meaning                                              |
| ------------------------------------------------------------ | ---------------------------------------------------- |
| Impossible time order                                        | Clock issue, forged lower header, or parsing problem |
| Unexpected country or provider                               | Infrastructure mismatch requiring context            |
| Private address at external boundary                         | Possible malformed or forged trace data              |
| Claimed hostname differs from connecting IP reverse identity | Weak identity or suspicious infrastructure           |
| Missing expected organizational gateway                      | Alternate route or incomplete evidence               |

### Trust boundary rule

Treat headers added by trusted receiving infrastructure as stronger than headers supplied inside the message by the sender. Attackers can forge lower, sender-controlled headers.

## 7. Authentication-Results

`Authentication-Results` records checks performed by a receiving system.

### Common results

| Result         | Meaning                                                             |
| -------------- | ------------------------------------------------------------------- |
| **spf=pass**   | Sending IP was authorized for the checked envelope identity         |
| **dkim=pass**  | A DKIM signature validated for the signing domain                   |
| **dmarc=pass** | At least one aligned SPF or DKIM path passed under DMARC evaluation |
| **spf=fail**   | Sending IP was not authorized by applicable SPF policy              |
| **dkim=fail**  | Signature validation failed                                         |
| **dmarc=fail** | No passing aligned authentication path was available                |
| **none**       | Required policy or authentication mechanism was absent              |

### Trust rule

Prefer authentication results added by the trusted destination gateway. A sender can insert a fake `Authentication-Results` header before delivery.

## 8. SPF Analysis

SPF checks whether the connecting sending IP is authorized for an SMTP identity, normally the envelope sender domain.

### SPF results

| Result        | Interpretation                                                               |
| ------------- | ---------------------------------------------------------------------------- |
| **pass**      | Sending IP is authorized by the evaluated SPF policy                         |
| **fail**      | Policy explicitly says the IP is not authorized                              |
| **softfail**  | Policy suggests the IP is probably unauthorized but requests softer handling |
| **neutral**   | Policy makes no assertion for the IP                                         |
| **none**      | No usable SPF policy was found                                               |
| **temperror** | Temporary DNS or processing failure                                          |
| **permerror** | Permanent policy or evaluation error                                         |

### SPF limitations

- SPF authenticates an SMTP domain, not the visible display name.
- Forwarding can break SPF.
- An attacker can pass SPF using a domain they control.
- SPF pass does not prove the sender is trustworthy.
- Review the identity that was actually checked.

### Investigation record

```json
{
  "mechanism": "spf",
  "result": "pass",
  "checked_domain": "mailer.example.net",
  "connecting_ip": "192.0.2.44",
  "aligned_with_from": false,
  "assessment": "SPF passed for an unrelated envelope domain"
}
```

## 9. DKIM Analysis

DKIM adds a cryptographic signature over selected headers and the body.

### Important DKIM tags

| Tag         | Meaning                                    |
| ----------- | ------------------------------------------ |
| **d**       | Signing domain                             |
| **s**       | DNS selector used to locate public key     |
| **a**       | Signing algorithm                          |
| **c**       | Header and body canonicalization method    |
| **h**       | Signed header list                         |
| **bh**      | Body hash                                  |
| **b**       | Signature value                            |
| **t and x** | Signing and expiration times, when present |

### What valid DKIM proves

- The signed content validated against the public key published for the `d=` domain.
- Signed headers and body were not modified beyond permitted canonicalization after signing.
- The signer controlled or used the signing domain's key.

### What valid DKIM does not prove

- The message is benign.
- The visible From identity is aligned.
- The signing domain belongs to the claimed brand.
- The sender account was not compromised.
- The linked website is safe.

## 10. DMARC Analysis

DMARC evaluates alignment between the visible From domain and a passing SPF or DKIM identity, then applies the domain's published policy.

### DMARC paths

```text
SPF passes + envelope domain aligns with visible From
OR
DKIM passes + signing domain aligns with visible From
     ↓
DMARC passes
```

### DMARC policies

| Policy         | Requested handling                                            |
| -------------- | ------------------------------------------------------------- |
| **none**       | Monitor and report without requesting quarantine or rejection |
| **quarantine** | Treat failing mail as suspicious                              |
| **reject**     | Reject failing mail where policy is applied                   |

### DMARC assessment fields

| Field            | Purpose                              |
| ---------------- | ------------------------------------ |
| **header_from**  | Visible From domain                  |
| **spf_result**   | SPF outcome                          |
| **spf_domain**   | Evaluated envelope domain            |
| **spf_aligned**  | Alignment decision                   |
| **dkim_result**  | DKIM outcome                         |
| **dkim_domain**  | Signing domain                       |
| **dkim_aligned** | Alignment decision                   |
| **dmarc_result** | Final DMARC outcome                  |
| **policy**       | Published policy applied by receiver |

## 11. Why Authentication Can Pass

An email can pass SPF, DKIM, and DMARC and still be malicious.

| Scenario                                | Why authentication passes                                          |
| --------------------------------------- | ------------------------------------------------------------------ |
| Attacker-owned domain                   | Attacker publishes valid SPF, DKIM, and DMARC                      |
| Compromised legitimate account          | Trusted provider signs malicious message                           |
| Compromised business domain             | Authorized infrastructure sends attacker content                   |
| Malicious tenant on legitimate platform | Platform is authorized for the tenant's domain                     |
| Lookalike domain                        | Authentication validates the lookalike, not the impersonated brand |
| Abused marketing service                | Message is technically authenticated but socially deceptive        |

### Analyst rule

Authentication answers questions about domain authorization, cryptographic integrity, and alignment. It does not answer whether the sender's intent or content is safe.

## 12. Header Red Flags

| Indicator                              | Why it matters                                        |
| -------------------------------------- | ----------------------------------------------------- |
| Display-name impersonation             | Trusted name paired with unrelated address            |
| From and Reply-To mismatch             | Replies redirected elsewhere                          |
| Lookalike From domain                  | Visual impersonation                                  |
| Message-ID domain mismatch             | Different sending infrastructure or generated message |
| Failed or absent DMARC                 | Visible identity lacks aligned authentication         |
| Unusual Received path                  | Delivery infrastructure does not fit claimed sender   |
| Multiple From headers                  | Invalid or suspicious header construction             |
| Future or impossible dates             | Clock error or manipulation                           |
| Unexpected X-Mailer                    | Sending client inconsistent with claimed workflow     |
| Authentication result at untrusted hop | Potential forged header                               |

### Scoring caution

Each red flag is contextual. Mailing lists, forwarding, ticketing systems, and delegated senders can create legitimate mismatches.

## 13. Social Engineering Analysis

Phishing content creates pressure that reduces careful decision-making.

### Common techniques

| Technique                  | Example pattern                                             |
| -------------------------- | ----------------------------------------------------------- |
| **Urgency**                | Act now, expires today, immediate verification              |
| **Authority**              | Executive, IT, bank, regulator, or clinician impersonation  |
| **Fear**                   | Account closure, penalty, missed payment, security incident |
| **Reward**                 | Refund, benefit, gift, invoice payment, document access     |
| **Curiosity**              | Unexpected shared file or private message                   |
| **Scarcity**               | Limited-time action or restricted availability              |
| **Familiar workflow**      | Portal alert, voicemail, invoice, password expiration       |
| **Conversation hijacking** | Reply within an existing trusted thread                     |

### Content review fields

- Claimed sender and role.
- Requested action.
- Deadline or pressure.
- Sensitive information requested.
- Link-display text versus actual target.
- Grammar and branding consistency.
- Personalization level.
- Business-process plausibility.
- Contact and payment changes.

## 14. Safe URL Investigation

Do not browse suspicious URLs directly from a normal workstation.

### Safe sequence

```text
Extract URL as text
     ↓
Preserve original and create defanged form
     ↓
Parse scheme, host, port, path, and query
     ↓
Compare display text with target
     ↓
Check local evidence and approved reputation sources
     ↓
Use approved isolated scanning or sandbox service if permitted
     ↓
Record redirects and final infrastructure
```

### Local parsing

```python
#!/usr/bin/env python3
from urllib.parse import urlsplit

value = "hxxps://portal-login[.]example/path?session=redacted"
refanged = value.replace("hxxps://", "https://").replace("[.]", ".")
parts = urlsplit(refanged)

print("scheme:", parts.scheme)
print("hostname:", parts.hostname)
print("port:", parts.port)
print("path:", parts.path)
print("query present:", bool(parts.query))
```

### URL red flags

| Pattern                   | Concern                                                      |
| ------------------------- | ------------------------------------------------------------ |
| IP literal as host        | Avoids domain reputation and brand comparison                |
| User-info trick           | Trusted text appears before the at-sign, actual host follows |
| Excessive subdomains      | Trusted brand appears as non-registrable label               |
| Punycode                  | Possible internationalized lookalike                         |
| URL shortener             | Conceals final destination                                   |
| Unusual port              | Nonstandard service or redirector                            |
| Sensitive values in query | Tokens, email addresses, or victim identifiers               |
| Mismatched display text   | Link target differs from visible claim                       |

### Safety rule

Do not use `curl`, `wget`, DNS tools, or a browser against suspicious infrastructure unless your organization has explicitly approved the isolated investigation path. Passive or third-party submissions may disclose your interest and may expose sensitive URLs.

## 15. Lookalike Domain Analysis

A lookalike domain imitates a trusted name using substitutions, additions, subdomains, or alternate suffixes.

### Lookalike patterns

| Pattern                | Example concept                                          |
| ---------------------- | -------------------------------------------------------- |
| Character substitution | Letter o versus zero, letter l versus one                |
| Added word             | secure, login, support, verify                           |
| Missing character      | Typographical omission                                   |
| Hyphenation            | Trusted words joined with hyphens                        |
| Alternate TLD          | Same label under another suffix                          |
| Subdomain deception    | Trusted brand appears left of attacker-owned base domain |
| Punycode               | Unicode resemblance encoded with the Punycode prefix     |

### Domain assessment

| Field                  | Purpose                                               |
| ---------------------- | ----------------------------------------------------- |
| **observed_domain**    | Domain extracted from message                         |
| **claimed_brand**      | Organization being impersonated                       |
| **registrable_domain** | Effective base domain                                 |
| **similarity_reason**  | Exact lookalike technique                             |
| **registration_age**   | Supporting context when authorized source provides it |
| **nameservers**        | Infrastructure linkage                                |
| **certificate_names**  | Additional related hostnames                          |
| **confidence**         | Strength of malicious assessment                      |

### Domain caution

Registration age and privacy-protected WHOIS data are context, not verdicts. Legitimate services may use new or delegated domains.

## 16. Attachment Analysis

Never execute an attachment during first-line analysis.

### Static workflow

```text
Extract attachment without opening
     ↓
Hash the file
     ↓
Identify true file type
     ↓
Inspect name, extension, MIME type, and metadata
     ↓
Extract safe strings and archive listing
     ↓
Check approved reputation source
     ↓
Escalate to isolated sandbox if authorized
```

### Commands

```bash
sha256sum phishing_case/attachments/*
file phishing_case/attachments/*
stat phishing_case/attachments/*
strings -a -n 8 phishing_case/attachments/suspicious.bin | head -n 100
unzip -l phishing_case/attachments/archive.zip
```

### Attachment red flags

| Pattern                                    | Concern                                      |
| ------------------------------------------ | -------------------------------------------- |
| Double extension                           | Executable disguised as document             |
| Extension and file type mismatch           | Misleading filename                          |
| Macro-enabled office file                  | Potential active content                     |
| Password-protected archive                 | Gateway evasion and concealed content        |
| Shortcut or script file                    | Direct command execution potential           |
| Unexpected executable                      | High-risk delivery mechanism                 |
| Embedded URL or command                    | Downloader or credential-harvesting behavior |
| Recently created signer or unsigned binary | Trust concern requiring context              |

### Public-service warning

Do not upload sensitive, confidential, or regulated attachments to public reputation or sandbox services unless policy explicitly permits it. Hash-only searches may be safer, but even hash queries can reveal investigative interest.

## 17. IOC Extraction and Defanging

Extract indicators in structured form and preserve both original and defanged values.

### IOC categories

| Type               | Examples                                       |
| ------------------ | ---------------------------------------------- |
| **Email**          | Sender, Reply-To, Return-Path                  |
| **Domain**         | Sender, link, Message-ID, DKIM signing domain  |
| **IP**             | Received hop, URL host, DNS answer             |
| **URL**            | Full target and redirect chain                 |
| **Hash**           | Message, attachment, downloaded file           |
| **Filename**       | Attachment or downloaded object                |
| **Certificate**    | Fingerprint, issuer, subject alternative names |
| **Infrastructure** | Nameserver, ASN, hosting provider              |

### Defanging examples

```text
https://login.example.com → hxxps://login[.]example[.]com
user@example.com → user[@]example[.]com
192.0.2.44 → 192[.]0[.]2[.]44
```

### IOC record

```json
{
  "indicator_id": "IOC-0007",
  "type": "domain",
  "value_original": "portal-login.example",
  "value_defanged": "portal-login[.]example",
  "source_email_ids": ["EMAIL-002", "EMAIL-005"],
  "role": "credential_harvest_host",
  "confidence": "high",
  "first_seen_utc": "2026-10-08T08:14:00Z",
  "false_positive_risk": "low"
}
```

## 18. IOC Quality and Confidence

Not every indicator has the same durability or false-positive risk.

### Indicator strength

| Strength   | Example                                            | Limitation                    |
| ---------- | -------------------------------------------------- | ----------------------------- |
| **Strong** | Unique malicious file hash                         | File can be changed easily    |
| **Strong** | Confirmed credential-harvest domain                | Domain can be abandoned       |
| **Medium** | Dedicated sender domain and related infrastructure | May host mixed activity       |
| **Medium** | Distinct attachment filename with supporting hash  | Filename alone is mutable     |
| **Weak**   | Shared cloud IP                                    | High false-positive potential |
| **Weak**   | Generic subject line                               | Common in legitimate mail     |
| **Weak**   | Common URL shortener                               | Service is dual-use           |

### Confidence factors

- Direct extraction from preserved evidence.
- Independent reputation confirmation.
- Repeated use across messages.
- Infrastructure dedicated to the activity.
- Behavioral support from endpoint or network evidence.
- Absence of plausible legitimate explanation.
- Source reliability and freshness.

### Confidence rule

Store confidence separately from severity. A high-impact hypothesis may still have low confidence.

## 19. Email Classification

Use consistent classifications across the evidence batch.

| Classification         | Meaning                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| **Malicious phishing** | Evidence supports credential theft, malware delivery, fraud, or unauthorized access intent |
| **Suspicious**         | Multiple concerns exist but evidence is insufficient for malicious verdict                 |
| **Spam**               | Unwanted bulk content without supported malicious intent                                   |
| **Benign**             | Legitimate message and infrastructure supported by evidence                                |
| **Unknown**            | Missing or contradictory evidence prevents classification                                  |

### Classification factors

```text
Authentication and alignment
Sender and routing consistency
Social engineering intent
URL and attachment behavior
Infrastructure reputation and overlap
Recipient context
Post-click or post-delivery activity
```

### Verdict rule

Do not classify an email solely because SPF failed, the domain is new, or the writing is poor. Combine independent evidence.

## 20. Campaign Correlation

Determine whether malicious emails are coordinated or unrelated.

### Correlation dimensions

| Dimension                   | Shared evidence                                  |
| --------------------------- | ------------------------------------------------ |
| **Sender infrastructure**   | Domain, IP, provider, Return-Path                |
| **Authentication identity** | DKIM domain, SPF domain, selector                |
| **URL infrastructure**      | Domain, path template, redirector, certificate   |
| **Attachment**              | Hash, family, filename pattern, archive password |
| **Content**                 | Subject, language, brand, request, template      |
| **Targeting**               | Department, role, site, recipient pattern        |
| **Time**                    | Delivery burst or sequence                       |
| **Message construction**    | Message-ID format, MIME boundary, mailer         |

### Campaign cluster example

```json
{
  "campaign_id": "PHISH-CAMP-001",
  "email_ids": ["EMAIL-002", "EMAIL-005", "EMAIL-008"],
  "shared_indicators": ["portal-login[.]example", "192[.]0[.]2[.]44"],
  "shared_features": ["patient portal impersonation", "same URL path template"],
  "targeted_departments": ["billing", "accounts_payable", "clinic"],
  "assessment": "coordinated credential-harvesting campaign",
  "confidence": "high"
}
```

### Campaign rule

A shared generic subject is weak linkage. Shared dedicated infrastructure plus a common template and targeting pattern is stronger.

## 21. Clicked-Link Investigation

When a user clicked, establish time, device, browser, destination, and subsequent activity.

### Questions to answer

| Question                            | Evidence source                                        |
| ----------------------------------- | ------------------------------------------------------ |
| When was the email delivered?       | Mail gateway and message headers                       |
| When was the link clicked?          | Safe-links, proxy, DNS, browser, firewall, or EDR logs |
| What device and user were involved? | Asset inventory and endpoint logs                      |
| Which redirects occurred?           | Proxy, URL scanner, browser, or PCAP evidence          |
| Were credentials entered?           | Identity logs, user interview, portal telemetry        |
| Was a file downloaded?              | Browser, proxy, Sysmon, EDR, or file-system telemetry  |
| Was code executed?                  | Process-creation and script logs                       |
| Did new authentication occur?       | Identity provider, VPN, SaaS, or domain logs           |

### Click timeline

```text
Email delivery
     ↓
DNS query
     ↓
Web connection and redirects
     ↓
Possible form submission
     ↓
New login or session activity
     ↓
Endpoint changes or downloads
```

### Safety rule

Do not recreate the click from the user's workstation. Investigate through preserved logs and approved isolated tooling.

## 22. Credential Compromise Assessment

A click does not prove credential submission. A successful login does not prove compromise without context.

### Compromise indicators

| Indicator                                  | Significance                                |
| ------------------------------------------ | ------------------------------------------- |
| Login from new IP, ASN, country, or device | Possible stolen credential use              |
| Impossible or improbable travel            | Identity anomaly requiring validation       |
| MFA prompt burst                           | Possible attacker attempting authentication |
| New inbox or forwarding rule               | Persistence and collection behavior         |
| New OAuth grant or application consent     | Cloud-account persistence                   |
| Password reset or recovery change          | Account-control attempt                     |
| Session activity after password change     | Possible active token compromise            |
| Access to sensitive mail or files          | Potential collection or impact              |

### Assessment outcomes

| Outcome                    | Meaning                                                 |
| -------------------------- | ------------------------------------------------------- |
| **Confirmed compromise**   | Evidence shows unauthorized account use                 |
| **Probable compromise**    | Strong supporting evidence, one gap remains             |
| **Possible compromise**    | Click or anomaly exists without sufficient confirmation |
| **No compromise observed** | No supporting activity in available telemetry           |
| **Undetermined**           | Visibility gap prevents conclusion                      |

## 23. Endpoint and Network Correlation

Correlate email evidence with endpoint, identity, DNS, proxy, firewall, and IDS data.

### Correlation keys

| Key                       | Use                                               |
| ------------------------- | ------------------------------------------------- |
| **Recipient email**       | Link message to user identity                     |
| **Message delivery time** | Bound search window                               |
| **URL domain**            | Search DNS and network logs                       |
| **Resolved IP**           | Search firewall, flow, and IDS records            |
| **Attachment hash**       | Search file and process telemetry                 |
| **Filename**              | Search file creation and execution                |
| **User and host**         | Build post-click timeline                         |
| **Process GUID or PID**   | Link browser, child process, and network activity |

### High-confidence chain

```text
Phishing email delivered
     ↓
Recipient clicks lookalike-domain link
     ↓
DNS and TLS connection observed
     ↓
New login from external source
     ↓
Mailbox rule or session anomaly appears
```

### Correlation rule

Preserve every event ID and indicate whether timestamps are observed, inferred, or corrected.

## 24. MITRE ATT&CK Mapping

Phishing is ATT&CK technique `T1566` under Initial Access. Relevant sub-techniques include attachments, links, services, and voice-related phishing as defined by the framework version in use.

### Common mappings

| Behavior                         | Technique                                         |
| -------------------------------- | ------------------------------------------------- |
| Malicious attachment             | T1566.001 Spearphishing Attachment                |
| Malicious link                   | T1566.002 Spearphishing Link                      |
| Third-party messaging or service | T1566.003 Spearphishing via Service               |
| Voice-based phishing             | T1566.004 Spearphishing Voice                     |
| User opens file or link          | T1204 User Execution family                       |
| Stolen credentials used          | T1078 Valid Accounts                              |
| Mailbox forwarding rule created  | Map according to observed cloud or email behavior |

### Mapping rule

Map what the evidence shows. Do not add execution, credential access, or valid-account techniques merely because the email attempted to cause them.

## 25. Detection Rule Proposals

Translate findings into detections across mail, identity, endpoint, and network sources.

### Detection opportunities

| Detection                              | Required fields                             |
| -------------------------------------- | ------------------------------------------- |
| From domain and Reply-To mismatch      | From, Reply-To                              |
| DMARC failure for protected brand      | Authentication results, From domain         |
| Lookalike domain in URL                | Extracted URL domain, protected-domain list |
| Shared malicious URL across recipients | URL, recipient, time window                 |
| Attachment hash match                  | File hash, attachment metadata              |
| Post-delivery click                    | User, URL, proxy or safe-link event         |
| Click followed by new login source     | User, time, source IP, device               |
| New mailbox forwarding rule            | User, rule action, destination              |

### Sigma-style concept

```yaml
title: Email Link to Known Credential Harvesting Domain
id: 11111111-2222-4333-8444-555555555555
status: experimental
logsource:
  category: email
detection:
  selection:
    email.url.domain: "portal-login.example"
  condition: selection
falsepositives:
  - None known during initial investigation
level: high
tags:
  - attack.initial_access
  - attack.t1566.002
```

### Detection quality rule

Test proposed detections against known malicious messages and unrelated benign or spam messages before shipping.

## 26. Investigation Report Schema

Every email should receive a structured report.

### Required fields

| Field                   | Purpose                                                  |
| ----------------------- | -------------------------------------------------------- |
| **email_id**            | Stable message identifier                                |
| **message_sha256**      | Original evidence hash                                   |
| **classification**      | Malicious, suspicious, spam, benign, or unknown          |
| **confidence**          | Confidence in verdict                                    |
| **sender_identities**   | From, Return-Path, Reply-To, DKIM domain                 |
| **authentication**      | SPF, DKIM, DMARC and alignment                           |
| **routing_summary**     | Important Received hops and anomalies                    |
| **social_engineering**  | Techniques observed                                      |
| **urls**                | Extracted and defanged URLs                              |
| **attachments**         | Filenames, hashes, types, and findings                   |
| **iocs**                | Structured indicator list                                |
| **campaign_id**         | Cluster identifier if linked                             |
| **user_impact**         | Click, submission, download, execution, or none observed |
| **evidence_ids**        | Supporting message and telemetry references              |
| **recommended_actions** | Defensive actions and escalation                         |
| **open_questions**      | Missing information                                      |

### Report example

```json
{
  "email_id": "EMAIL-005",
  "message_sha256": "example-hash",
  "classification": "malicious phishing",
  "confidence": "high",
  "authentication": {
    "spf": "pass",
    "dkim": "pass",
    "dmarc": "pass",
    "assessment": "Authentication validates attacker-controlled lookalike domain"
  },
  "social_engineering": ["urgency", "portal impersonation"],
  "urls": ["hxxps://portal-login[.]example/verify"],
  "attachments": [],
  "campaign_id": "PHISH-CAMP-001",
  "user_impact": "recipient reported link click",
  "evidence_ids": ["mail-005", "dns-220", "flow-991"],
  "recommended_actions": ["Escalate account review", "Block confirmed domain"],
  "open_questions": ["Whether credentials were submitted"]
}
```

## 27. Evidence Package

```text
phishing_dissection/
├── README.md
├── raw/
│   ├── EMAIL-001.eml
│   └── SHA256SUMS
├── parsed/
│   ├── headers.jsonl
│   ├── mime-parts.jsonl
│   └── authentication.jsonl
├── attachments/
│   ├── extracted/
│   └── attachment-report.json
├── indicators/
│   ├── iocs.json
│   └── domains.json
├── campaigns/
│   └── campaign-analysis.json
├── impact/
│   └── clicked-user-assessment.json
├── reports/
│   ├── EMAIL-001.json
│   └── batch-summary.json
├── detections/
│   └── proposed-rules.yml
├── MANIFEST.json
└── SHA256SUMS
```

### Batch summary fields

- Total emails received.
- Malicious, suspicious, spam, benign, and unknown counts.
- Campaign count.
- Recipients and departments targeted.
- Reported clicks.
- Confirmed or possible credential compromise.
- Strong indicators and defensive actions.
- Visibility gaps and unresolved questions.

## 28. Quality Gates

| Gate               | Pass condition                                                   |
| ------------------ | ---------------------------------------------------------------- |
| **Preservation**   | Every raw email is hashed and read-only                          |
| **Parsing**        | Headers and MIME parts are inventoried                           |
| **Routing**        | Received chain is reconstructed with trust boundaries            |
| **Authentication** | SPF, DKIM, DMARC, and alignment are assessed separately          |
| **URLs**           | All URLs are preserved and defanged                              |
| **Attachments**    | All files are hashed and not executed                            |
| **Indicators**     | Every IOC has source, confidence, and false-positive risk        |
| **Classification** | Every email has one verdict and confidence                       |
| **Campaigns**      | Linkage uses more than a generic subject or theme                |
| **Impact**         | Reported click is correlated with identity and endpoint evidence |
| **Reports**        | Every report validates against the locked schema                 |
| **Integrity**      | Final manifest and hashes verify                                 |

### Validation commands

```bash
find phishing_dissection -name '*.json' -print0 | xargs -0 -n1 jq empty
find phishing_dissection -name '*.jsonl' -print0 | while IFS= read -r -d '' file; do jq -c . "$file" >/dev/null || exit 1; done
sha256sum -c phishing_dissection/SHA256SUMS
```

## 29. Professional Judgment

Separate observed facts, analytical interpretation, and response recommendations.

| Statement type     | Example                                                             |
| ------------------ | ------------------------------------------------------------------- |
| **Fact**           | The link domain differs from the visible sender domain              |
| **Inference**      | The domain appears designed to imitate the patient portal           |
| **Hypothesis**     | The message belongs to a coordinated credential-harvesting campaign |
| **Recommendation** | Escalate the clicked user's account for identity-log review         |

### Decision principles

- Passing authentication does not make content safe.
- Failing authentication does not automatically prove maliciousness.
- A click does not prove credential submission.
- One shared hosting IP does not prove a campaign.
- Reputation-service results are context, not ground truth.
- Preserve uncertainty and contradictory evidence.
- Do not upload regulated data to public services without approval.
- Do not contact suspicious infrastructure from production systems.
- Recommend containment or credential reset through authorized response procedures.

## 30. Framework and Tool Map

| Item                                | Purpose                                               |
| ----------------------------------- | ----------------------------------------------------- |
| **SMTP and Received headers**       | Message transport and routing evidence                |
| **SPF**                             | Sending-IP authorization for an SMTP identity         |
| **DKIM**                            | Cryptographic integrity and signing-domain assertion  |
| **DMARC**                           | Alignment and domain policy for visible From identity |
| **Python email library**            | Safe local MIME and header parsing                    |
| **file, strings, unzip**            | Static attachment triage                              |
| **sha256sum**                       | Message and attachment integrity                      |
| **dig and whois**                   | Approved infrastructure context gathering             |
| **VirusTotal, urlscan.io, URLhaus** | Approved reputation and analysis context              |
| **MITRE ATT&CK T1566**              | Phishing behavior mapping                             |
| **HHS HC3**                         | Healthcare-sector threat context                      |
| **Sigma**                           | Portable detection-rule proposals                     |

## 31. Fast Recall

- **Preserve and hash the raw email before analysis.**
- **Read Received headers from bottom to top, but trust receiver-added headers more than sender-controlled ones.**
- **From, Return-Path, Reply-To, Sender, and Message-ID serve different identity roles.**
- **SPF checks sending-IP authorization for an SMTP identity.**
- **DKIM validates signed content and a signing domain.**
- **DMARC requires an aligned passing SPF or DKIM path.**
- **SPF, DKIM, and DMARC can all pass for a malicious attacker-controlled domain.**
- **Authentication verifies identity relationships, not benign intent.**
- **Never click suspicious links or execute attachments during first-line analysis.**
- **Defang URLs, domains, emails, and IPs in reports.**
- **Public reputation services may expose submitted indicators or sensitive files. Follow policy.**
- **File extension and MIME type can both be misleading. Hash and identify content statically.**
- **Score IOC confidence separately from severity.**
- **Classify every email consistently: malicious, suspicious, spam, benign, or unknown.**
- **Campaign linkage needs shared infrastructure, construction, targeting, or behavior, not only a common subject.**
- **A reported click starts an impact investigation; it does not prove compromise.**
- **Correlate email delivery, DNS, web, identity, endpoint, and mailbox activity.**
- **Map only behaviors actually supported by evidence.**
- **Every report must link verdicts to message, IOC, and telemetry evidence.**

## 32. Resources

**Email standards and authentication**

- [RFC 5321: Simple Mail Transfer Protocol](https://www.rfc-editor.org/rfc/rfc5321)
- [RFC 5322: Internet Message Format](https://www.rfc-editor.org/rfc/rfc5322)
- [RFC 7208: Sender Policy Framework](https://www.rfc-editor.org/rfc/rfc7208)
- [RFC 6376: DomainKeys Identified Mail](https://www.rfc-editor.org/rfc/rfc6376)
- [DMARC Overview](https://dmarc.org/overview/)

**Investigation resources**

- [VirusTotal](https://www.virustotal.com/)
- [urlscan.io](https://urlscan.io/)
- [URLhaus](https://urlhaus.abuse.ch/)
- [Hybrid Analysis](https://www.hybrid-analysis.com/)

**Threat intelligence and behavior mapping**

- [MITRE ATT&CK: Phishing T1566](https://attack.mitre.org/techniques/T1566/)
- [MITRE ATT&CK: Spearphishing Attachment T1566.001](https://attack.mitre.org/techniques/T1566/001/)
- [HHS Cyber Threat Briefs](https://tech.hhs.gov/cyber/threat-briefs)
- [HC3 Products](https://asprtracie.hhs.gov/technical-resources/resource/11041/hc3-products)

**Man or help**

```text
man grep
man awk
man curl
man dig
man whois
```
