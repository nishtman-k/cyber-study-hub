# Social Engineering Operations

> **⚠️ AUTHORIZED USE ONLY.** Test only the sites, people, systems, and methods covered by written authorization. Keep emergency exits functional, use harmless proofs, and stop when safety or scope is uncertain. See [Legal and Terms of Use](/legal).

> `A practical reference for authorized assessments of human trust, email controls, simulated phishing, and response readiness.`

Social engineering manipulates a person's decisions through a misleading request, identity, or situation. Technical controls matter, but organizations must also make verification and reporting easy. Successful assessments measure how people, processes, and technology work together; they do not assign blame to individual employees.

**Use these techniques only within explicit written authorization.** Examples use reserved names, dummy accounts, and isolated systems. This reference describes procedures; it does not represent an executed campaign or verified compromise.

## 1. Core Concepts

| Term | Meaning | Example |
|---|---|---|
| Phishing | Deceptive message intended to trigger an unsafe action | A false account notice |
| Spear phishing | A message tailored to a specific person or group | A department-specific request |
| Pretext | The story that makes a request seem legitimate | A supposed document review |
| Vishing | Social engineering through voice calls | An impersonated help desk |
| Smishing | Phishing through text messages | A false delivery alert |
| Business email compromise | Fraud using impersonated or compromised business email | A changed payment instruction |
| Credential harvesting | Collecting credentials through a misleading interface | A copied sign-in page |
| Payload | Content or code delivered to cause an action | A lab callback program |
| Listener | A service waiting for a network connection | An assessment callback receiver |

A phishing message may aim for a click, a submitted password, an approval, a file execution, or a financial action. These are different outcomes and require different evidence.

## 2. Human Behavior and Persuasion

Common triggers include authority, urgency, fear of loss, curiosity, reciprocity, familiarity, and social proof. A request can combine several triggers: a familiar sender, an urgent deadline, and a claim that colleagues already complied.

Analyze a pretext with four questions:

1. Who does the sender claim to be?
2. Why would the recipient believe the claim?
3. What action is requested?
4. Which verification step does the request discourage or bypass?

A convincing appearance is not proof of authenticity. Logos, signatures, organizational vocabulary, HTTPS, and polished writing can all appear in malicious messages. Conversely, an awkwardly written message is not automatically malicious.

## 3. Authorization and Assessment Design

Agree on the recipient group, approved identities and domains, schedule and timezone, infrastructure, permitted actions, data retention, and emergency contact. Define which controls will remain active and whether defenders know the timing.

Separate three levels of testing:

| Level | Objective | Suitable evidence |
|---|---|---|
| Awareness simulation | Measure interaction and reporting | Delivery, click, dummy submission, report time |
| Credential-control test | Assess sign-in protections using test accounts | Authentication logs and approved dummy credentials |
| Endpoint execution test | Assess execution prevention and response in lab hosts | Process, network, endpoint, and containment evidence |

Approval for an awareness email does not automatically authorize executing code on employee systems. Define stop conditions such as real credential collection, delivery outside the approved group, unexpected service impact, or exposure of sensitive records. Test the stop procedure before launch.

## 4. Lab Architecture and Evidence Plan

Use an isolated sender, a local SMTP test service, a controlled landing page, test mailboxes, and a disposable Windows VM for endpoint exercises. Keep administration interfaces reachable only from the management network. Snapshot systems and synchronize clocks.

An illustrative flow is:

```text
Approved test sender → test mailbox → controlled page
                                     ↓
                               dummy submission

Separate endpoint exercise:
Disposable VM → lab callback listener → defender investigation
```

The two branches may be evaluated independently. A page submission does not establish code execution.

Record tool versions, configuration, artifact hashes, campaign identifiers, timestamps, and limitations. Use UTC in raw evidence, with a stated timezone in narrative timelines. Do not include passwords, session cookies, access tokens, or complete recipient lists in general reports.

## 5. Reconnaissance and Pretext Selection

Within scope, review public organizational pages, role descriptions, published contact formats, and normal communication patterns. Record where each observation came from and when it was collected. Public availability does not remove privacy obligations.

Prefer the smallest amount of information needed to test the agreed hypothesis. A hypothesis might be: “Recipients will follow a document-review link when it appears to originate from a familiar internal function.” Define what evidence would support or contradict it.

Avoid sensitive personal themes and unnecessary personal profiling. A fictional organization can use invented departments and synthetic recipient data. Keep the material independent of real patient, clinical, or employee information.

## 6. Email Identity and Header Analysis

Email has several identities that may differ:

| Identity | Where it appears | Why it matters |
|---|---|---|
| Display name | Mail client sender label | Easy to imitate |
| Author address | `From:` header | Domain DMARC evaluates |
| Reply destination | `Reply-To:` header | Replies may go elsewhere |
| Envelope sender | SMTP `MAIL FROM`, often represented by `Return-Path` | Identity SPF normally evaluates |
| DKIM signing domain | `d=` in `DKIM-Signature` | Domain responsible for the signature |

Examine full headers from the receiving system. Trust authentication results added by your receiving infrastructure, rather than an arbitrary `Authentication-Results` field supplied upstream. Preserve the original message for analysis.

Illustrative header excerpt:

```text
From: Document Review <review@training.example>
Reply-To: support@training.example
Return-Path: <bounce@mailer.training.example>
Authentication-Results: mx.receiver.example;
 spf=pass smtp.mailfrom=mailer.training.example;
 dkim=pass header.d=training.example;
 dmarc=pass header.from=training.example
```

This example is fabricated. A pass authenticates a domain relationship; it does not prove the message is benign.

## 7. SPF, DKIM, and DMARC

| Mechanism | What it checks | Main limitation |
|---|---|---|
| SPF | Whether the connecting sender IP is authorized for the envelope domain | Does not authenticate the visible `From:` on its own; forwarding can affect results |
| DKIM | A domain signature over selected headers and the body | A valid signature does not establish benign intent; modifications may break it |
| DMARC | Whether a passing SPF or DKIM identity aligns with the author domain | Does not prevent lookalike-domain messages or abuse of a compromised account |

DMARC passes when **at least one** of SPF or DKIM passes with the required alignment. A passing SPF result for an unrelated domain does not satisfy DMARC. Relaxed alignment generally allows domains in the same organizational domain; strict alignment requires exact domain matches.

The policies `none`, `quarantine`, and `reject` express increasingly restrictive handling preferences for DMARC failures. Receiver policy can still affect disposition. `p=none` supports observation but does not request rejection. The protocol was updated in May 2026: RFC 9989 replaces RFC 7489 and RFC 9091. See the [current DMARC specification](https://www.rfc-editor.org/rfc/rfc9989.html).

Inspect records for an owned lab domain, substituting its real name:

```bash
# Inspect published SPF and other TXT records.
dig TXT training.example +short

# Inspect DMARC at its dedicated DNS name.
dig TXT _dmarc.training.example +short

# Use the selector found in an actual DKIM-Signature header.
dig TXT selector1._domainkey.training.example +short
```

These reserved example names need not resolve. An empty response alone does not prove a vulnerability: check the queried name, DNS errors, DKIM selector, and DMARC policy discovery. Finding a weak record is configuration evidence, not proof that a particular message reached an inbox.

## 8. Spoofing and Lookalike Domains

**Display-name spoofing** changes the sender label. **Domain spoofing** claims another domain in the visible address. **Typosquatting** uses a different domain with a small spelling change. Homoglyphs use visually similar characters; misleading subdomains exploit how people read domain names.

For example, in `signin.training.example.attacker.test`, the string `training.example` is a subdomain label sequence, not the owning domain. Always identify the actual domain boundary, including multi-label public suffixes when relevant.

An attacker-controlled lookalike can pass SPF, DKIM, and DMARC for its own domain. Defenses therefore also need domain awareness, independent verification, URL analysis, and account protections. For simulations, use organization-owned training infrastructure rather than registering confusing names without explicit approval.

## 9. SET Setup and Navigation

The Social-Engineer Toolkit (SET) is a guided framework for authorized social-engineering assessments. Its modules include website attack vectors, mail delivery, and payload-related workflows. Dependencies and menus vary by release; follow the installed version's labels rather than memorizing numeric choices.

On Kali, install and launch manually:

```bash
# Refresh package information.
sudo apt update

# Install the distribution's SET package.
sudo apt install set

# Record the installed package version.
dpkg-query -W set

# Open the interactive console; this does not authorize starting a campaign.
sudo setoolkit
```

Inspect each module before starting it: identify network listeners, interfaces, output files, and any automatic launch behavior. Do not use unrelated attack vectors just because they appear in the menu. Installation and console usage are documented in the [official SET repository](https://github.com/trustedsec/social-engineer-toolkit).

## 10. SET Credential Harvester Exercise

Use a simple sign-in page that you own and a dummy password unique to this exercise. Avoid external identity providers and real organizational login pages for the initial practice.

Typical menu labels are **Social-Engineering Attacks → Website Attack Vectors → Credential Harvester Attack Method → Site Cloner**. Confirm the wording in your installed release.

1. Start the source page on an isolated lab server. Check that its form uses a normal HTML submission.
2. Select the credential-harvester workflow and the clone option.
3. Supply the lab address reachable by the test browser and the URL of your owned source page.
4. Inspect the resulting HTML, form destinations, scripts, and external resource references before browsing it.
5. Submit a dummy username and password from the test browser.
6. Compare the browser request with the harvester's output. Record only redacted evidence.
7. Stop the service and remove the dummy data according to the retention plan.

A copied page may look correct while failing to submit. JavaScript-heavy pages, single-sign-on redirects, content security policy, and missing resources can break cloning. A clone does not recreate the legitimate authentication backend, bypass MFA, or prove the collected string would authenticate.

**Success condition:** a known dummy submission appears in the lab receiver with a matching timestamp. Page appearance alone is insufficient.

## 11. SET Mailer and Message Construction

SET's **Mass Mailer Attack** workflow can send assessment messages through a configured SMTP service. The name does not mean large-scale delivery is required. Start with one test mailbox and an SMTP sink; do not use an unrestricted relay.

Configure the approved sender identity, SMTP endpoint and authentication, single test recipient, subject, body, and controlled link. Review the generated message and destination before delivery. Keep credentials out of screenshots and shared configuration files.

A safe practice message can explicitly identify the exercise:

```text
Subject: Training exercise: review a sample document

Hello Test User,

This is a scheduled security training message. Open the document-review
page on the isolated training portal and use the supplied dummy account.
Do not enter a real password.

Training team
```

For an authorized susceptibility assessment, approve the pretext and wording in advance. Measure whether the recipient follows the requested action; do not increase realism by collecting real secrets or adding unapproved executable attachments.

A successful SMTP submission means the server accepted a message for processing. It does not prove inbox placement, reading, or human interaction. Check receiver-side evidence and classify bounces separately.

## 12. Payloads, Listeners, and Reverse Shells

A reverse shell makes an outbound connection from a host and exposes command execution through that connection. A listener accepts the callback. This differs from a bind shell, where the target listens for inbound connections.

SET's payload-generation workflows may offer executable payloads and compatible handlers. Available choices depend on the installed version and external components. Before an isolated endpoint exercise, document:

- Target OS and architecture.
- Payload type and matching handler type.
- Callback address reachable from the disposable target.
- Callback port, bind interface, and permitted network path.
- Artifact hash, expiration or teardown procedure, and allowed validation commands.

A listener's bind address and the payload's callback address serve different purposes. `0.0.0.0` is a bind wildcard, not a useful destination to embed in a target callback. A private address also will not become externally reachable merely by entering it in SET.

Keep generated payloads inside the isolated lab. Do not email them to live recipients as an extension of an awareness simulation. Use only approved manual execution in the disposable host, validate the agreed identity command, then end the session. Avoid persistence, privilege escalation, credential access, and sensitive files.

**Evidence ladder:** file generated → file delivered → process executed → network callback → interactive command result. Record the highest step actually observed. A TCP connection alone does not prove an active shell; a shell alone does not prove access to sensitive data.

## 13. Encoded PowerShell

Windows PowerShell's `-EncodedCommand` accepts Base64 representing UTF-16LE command text. Encoding transports text; it is neither encryption nor an assurance of safety. An encoded command may be harmless or malicious. See [Microsoft's PowerShell command-line documentation](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_powershell_exe?view=powershell-5.1).

Practice encoding with a harmless local marker in Windows PowerShell:

```powershell
$command = 'Write-Output "TRAINING_MARKER"'
$bytes = [System.Text.Encoding]::Unicode.GetBytes($command)
$encoded = [Convert]::ToBase64String($bytes)

# Inspect the decoded text before running it.
[System.Text.Encoding]::Unicode.GetString(
    [Convert]::FromBase64String($encoded)
)

# Run only the marker command created above.
powershell.exe -NoProfile -EncodedCommand $encoded
```

Illustrative expected output from the final command:

```text
TRAINING_MARKER
```

In SET, inspect the available PowerShell payload workflow and its output in the isolated lab. Identify the decoded instructions, destination, port, execution context, and compatible listener before any approved execution. This harmless encoding example does not create a reverse shell or establish that a SET payload will execute.

Defenders should investigate process ancestry, decoded script content, network activity, and endpoint events together. `-EncodedCommand` by itself is a lead, not a verdict. Do not disable endpoint protections merely to produce a successful demonstration.

## 14. GoPhish Campaign Workflow

GoPhish combines recipient groups, email templates, landing pages, sending profiles, and campaign tracking. Create a single-recipient test campaign before any approved group delivery.

1. Restrict the administration interface and configure the approved mail relay.
2. Add synthetic recipients to a test group.
3. Create an email template using the campaign URL placeholder `{{.URL}}`.
4. Create an owned landing page and preview it.
5. Leave password capture disabled; prefer a dummy action or submission marker.
6. Select the group, template, page, sending profile, campaign URL, and schedule.
7. Verify delivery, tracking, reporting, and cleanup with the test mailbox.
8. Launch only the approved scope, then export evidence and reconcile results.

GoPhish uses a recipient identifier, commonly the `rid` parameter, to select campaign context. A generic visit without it may return 404. This does not necessarily mean the campaign page is broken. Treat tracked URLs as sensitive because forwarding them can misattribute activity.

GoPhish documentation warns that captured credentials are stored in plaintext. Disabling password capture does not automatically prevent other form fields from being stored; inspect the whole form and submission configuration. See the official [landing-page documentation](https://docs.getgophish.com/user-guide/documentation/landing-pages) and [campaign documentation](https://docs.getgophish.com/user-guide/documentation/campaigns).

## 15. Metrics and Interpretation

Choose denominators before launching. Count unique recipients for recipient rates, and keep repeat events separately. An SMTP “sent” status is not a direct measurement of inbox delivery.

| Metric | Example definition | Caveat |
|---|---|---|
| Send acceptance | SMTP-accepted messages / attempted messages | Not confirmed inbox placement |
| Open rate | Unique tracked opens / accepted recipients | Image blocking and automated fetching distort it |
| Click rate | Unique tracked clickers / accepted recipients | Link scanners can click automatically |
| Submission rate | Unique dummy submitters / accepted recipients | Test traffic and forwarding can affect attribution |
| Click-to-submit rate | Unique submitters / unique clickers | State how unmatched events are treated |
| Reporting rate | Unique reporters / accepted recipients | Often needs help-desk or reporting-button data |
| Time to report | First valid report time minus agreed start event | State whether measured from send or receipt |
| Response time | First containment action minus detection time | Requires defender evidence |

Illustrative dataset: 100 attempts, 5 immediate failures, 95 SMTP acceptances, 30 unique tracked opens, 12 unique clickers, 3 dummy submitters, and 20 reporters.

```text
Click rate       = 12 / 95 × 100 = 12.6%
Submission rate  =  3 / 95 × 100 =  3.2%
Click-to-submit  =  3 / 12 × 100 = 25.0%
Reporting rate   = 20 / 95 × 100 = 21.1%
```

These are fabricated figures, not assessment results. Reporters and clickers may overlap. With a zero denominator, report “not applicable,” not zero percent. Preserve raw events and document exclusions before calculating adjusted metrics.

Compare campaigns only when their populations, delivery conditions, difficulty, and observation windows are sufficiently similar. Small groups create unstable percentages and privacy risks.

## 16. Detection and Response Readiness

Correlate the message identifier and recipient token with mail gateway events, browser/proxy requests, DNS queries, endpoint process creation, script logs where configured, and network connections. Document telemetry gaps rather than treating silence as proof that nothing happened.

A useful response exercise asks whether defenders can:

1. Receive and triage a user report.
2. Identify related messages and affected accounts.
3. Remove messages or block the controlled destination.
4. Investigate suspicious endpoint execution and outbound activity.
5. Isolate the disposable host when the scenario warrants it.
6. Revoke sessions or reset credentials if real exposure is suspected.
7. Communicate clearly and preserve evidence.

Measure the actual detection and containment timestamps. A scheduled training completion page is not an incident-response action.

## 17. Troubleshooting

| Symptom | Checks | Interpretation |
|---|---|---|
| Message absent | SMTP result, bounce, quarantine, receiver trace | Accepted mail can still be filtered |
| SPF passes, DMARC fails | Envelope identity and alignment; DKIM result | Authentication without alignment is insufficient |
| Page loads, no submission | Form action, field names, browser request, server logs | Rendering does not establish harvesting |
| GoPhish page returns 404 | Test campaign URL and recipient context | Missing `rid` can explain the response |
| Immediate clicks from many recipients | Gateway scanner behavior and timing | Automation may inflate click counts |
| No payload callback | Execution evidence, architecture, route, firewall, handler match | Failure is not automatically user resistance |
| Listener accepts, no shell | Protocol match and command-response evidence | Network reachability is weaker evidence than execution |
| Encoded command fails | UTF-16LE encoding and quoting | Base64 text can encode the wrong command |

Change one variable at a time. Keep a successful baseline and record failed attempts when they affect the conclusion.

## 18. Reporting Findings

A professional report should include scope, authorization boundaries, methodology, dates, tool versions, evidence, results, limitations, prioritized recommendations, and retest criteria. Use aggregate awareness statistics and restrict recipient-level details.

For each finding, write:

```text
Title:
Affected control and scope:
Observed behavior:
Expected behavior:
Reproduction conditions:
Evidence identifiers and timestamps:
Impact supported by evidence:
Limitations and alternative explanations:
Recommendation and owner:
Retest success criterion:
```

Example: “The receiving gateway accepted a controlled message claiming the tested author domain despite a recorded DMARC failure.” Support that claim with the original message, trusted receiver authentication results, and delivery trace. DNS policy alone does not establish delivery behavior.

Avoid statements such as “clinical records were compromised” when the evidence only shows a click or dummy submission. Distinguish observations, plausible consequences, and untested hypotheses. A technically valid finding still needs a realistic impact explanation.

## 19. Defensive Controls and Cleanup

Use layered controls:

| Layer | Controls | Retest evidence |
|---|---|---|
| Email identity | Correct SPF/DKIM and an enforced DMARC policy after sender inventory | Legitimate delivery plus controlled spoof handling |
| Message handling | URL and attachment inspection, impersonation detection | Gateway trace for approved test messages |
| Authentication | Phishing-resistant MFA such as properly deployed FIDO2/WebAuthn | Controlled sign-in exercise with test accounts |
| Endpoints | Application control, least privilege, script visibility, endpoint protection | Block or detection events for approved lab execution |
| Network | Restricted egress and monitored DNS/proxy activity | Allowed and blocked test connection evidence |
| People and process | Easy reporting, independent callbacks, payment verification | Report and response timestamps |

MFA is not uniform: a code that can be relayed offers different phishing resistance from an origin-bound authenticator. No single control stops every form of social engineering.

At closure, stop campaigns and listeners, remove hosted pages and payload artifacts, revoke temporary relay credentials, delete dummy captured data, and restore disposable hosts. Check that services are actually stopped and that evidence access and retention match the agreement. Provide constructive feedback and reinforce reporting behavior.

## 20. Knowledge Check and References

Explain these without consulting notes:

1. Why can DMARC pass on a lookalike domain?
2. Which identity does SPF normally authenticate?
3. Why is a cloned page not equivalent to the real authentication system?
4. What evidence separates a click, a submission, execution, and a working shell?
5. Why does PowerShell encoding not imply encryption or evasion?
6. How can a mail scanner distort campaign metrics?
7. What is the difference between SMTP acceptance and confirmed delivery?
8. Which measurements demonstrate response readiness?
9. Why should awareness testing and endpoint execution have separate scope?
10. What observations would make a retest successful?

Primary references, checked 22 October 2026:

- [TrustedSec SET repository and installation guidance](https://github.com/trustedsec/social-engineer-toolkit)
- [SET user manual](https://github.com/trustedsec/social-engineer-toolkit/blob/master/readme/User_Manual.pdf) — compare older screenshots with the installed version.
- [GoPhish user guide](https://docs.getgophish.com/user-guide)
- [GoPhish campaign configuration](https://docs.getgophish.com/user-guide/documentation/campaigns)
- [GoPhish landing pages and data capture](https://docs.getgophish.com/user-guide/documentation/landing-pages)
- [RFC 9989: DMARC](https://www.rfc-editor.org/rfc/rfc9989.html)
- [RFC 7208: SPF](https://www.rfc-editor.org/rfc/rfc7208)
- [RFC 6376: DKIM](https://www.rfc-editor.org/rfc/rfc6376)
- [Windows PowerShell command-line parameters](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_powershell_exe?view=powershell-5.1)

Documentation review does not constitute runtime validation. SET, GoPhish, DNS, mail delivery, and PowerShell examples were not executed as an assessment while preparing this reference.
