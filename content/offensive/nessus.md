# Nessus and Vulnerability Management

> **⚠️ AUTHORIZED USE ONLY.** This material is for education and authorized security testing. Vulnerability scanning sends probes directly to target systems and **is detectable and logged**. Scanning systems you do not own or lack **explicit written permission** to test is unauthorized access and a criminal offence in most jurisdictions. Nessus Essentials is licensed for up to 16 IPs; point it only at systems you own or dedicated legal labs. You are solely responsible for how you use this. See the Legal and Terms of Use page.

> A practical reference for Nessus, a vulnerability scanner that probes a target and reports known weaknesses with CVSS scores and CVE references, set in the wider discipline of vulnerability management. Covers the free Essentials edition on Kali, installation and configuration, the scan workflow, reading and prioritizing results, and how scanning feeds patch and risk management.

**Section ID:** `nessus`

## Table of Contents

- [Vulnerability Management Fundamentals](#vulnerability-management-fundamentals)
- [The Role of Vulnerability Scanning](#the-role-of-vulnerability-scanning)
- [What is Nessus?](#what-is-nessus)
- [Scanning Solutions Compared](#scanning-solutions-compared)
- [Nessus Editions](#nessus-editions)
- [Installing Nessus](#installing-nessus)
- [Starting and Accessing Nessus](#starting-and-accessing-nessus)
- [Configuring Nessus](#configuring-nessus)
- [Navigating the Interface](#navigating-the-interface)
- [Authenticated vs Unauthenticated Scans](#authenticated-vs-unauthenticated-scans)
- [Scan Templates and Policies](#scan-templates-and-policies)
- [Creating, Scheduling, and Managing Scans](#creating-scheduling-and-managing-scans)
- [Reading the Results](#reading-the-results)
- [Vulnerability Types and Severity](#vulnerability-types-and-severity)
- [Prioritization and Remediation](#prioritization-and-remediation)
- [Generating Reports](#generating-reports)
- [Where Nessus Fits](#where-nessus-fits)
- [Command Quick Reference](#command-quick-reference)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Vulnerability Management Fundamentals

**Vulnerability management** is the ongoing, cyclical process of identifying, evaluating, treating, and reporting security weaknesses across systems and software. Scanning is one step inside it, not the whole thing. The distinction matters: running a scan is an event, managing vulnerabilities is a continuous program.

### The vulnerability management lifecycle

| Phase                    | What happens                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------- |
| **Discover / inventory** | Identify all assets on the network. You cannot protect what you do not know exists |
| **Assess / scan**        | Scan assets to detect known vulnerabilities and misconfigurations                  |
| **Prioritize**           | Rank findings by severity, exploitability, and business context                    |
| **Remediate**            | Patch, reconfigure, or otherwise treat the weakness                                |
| **Verify**               | Rescan to confirm the fix worked                                                   |
| **Report / monitor**     | Track trends, feed patch and risk management, and repeat continuously              |

The loop never ends. New vulnerabilities are disclosed daily and new assets are deployed constantly, so a point-in-time scan is stale almost immediately. Maturity is measured by how continuous and how risk-driven the loop is: the least mature organizations scan annually and act on nothing, while the most mature scan continuously, assign remediation owners with deadlines, and prioritize by real-world exploitability.

### Why it matters

- It feeds **patch management** directly, turning findings into a prioritized fix queue.
- It feeds **risk management**, providing the raw technical input that risk assessment translates into business terms.
- It supports **compliance**, since standards such as PCI DSS require regular scanning.
- It shrinks the **window of exposure** between a vulnerability being disclosed and being fixed.

## 2. The Role of Vulnerability Scanning

Vulnerability scanning is the **automated detection** step of the lifecycle. A scanner checks devices (routers, firewalls, switches), servers, workstations, and applications against a database of known vulnerabilities and misconfigurations, at both the network and application level.

**What scanning is, and is not:**

- It **detects and reports** potential weaknesses. It generally does **not exploit** them, with some exceptions for safe dynamic checks.
- Its output requires **manual verification** by a professional to separate real vulnerabilities from false positives.
- It is **one phase of a penetration test**, not a substitute for one. A full pentest adds manual exploitation that goes well beyond automated scanning.

### Static and dynamic testing

Scanners combine two techniques:

| Technique           | How it works                                      | Example                                                                 |
| ------------------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| **Static testing**  | Compares software and versions against known CVEs | Flagging Apache 2.4.49 as carrying a known path-traversal CVE           |
| **Dynamic testing** | Sends safe payloads and observes the response     | Testing an input with a benign SQL injection or command injection probe |

### Scan cadence and coverage

Organizations are encouraged to run scans **regularly**, and to run **both** unauthenticated and credentialed scans (covered in Section 10). Regular scanning ensures systems stay patched and that newly deployed assets are secure, feeding directly into patch and risk management programs. A scan run once is a snapshot; scanning on a schedule is a control.

## 3. What is Nessus?

**Nessus** is a **vulnerability scanner**. You point it at a target (an IP or range), and it checks that target against a large database of known vulnerability signatures, then reports what it found, how severe each issue is, and often the matching CVE.

Where **nmap** tells you what is open and what version is running, **Nessus** goes further and tells you which of those things are known to be vulnerable. It automates the step of matching a service version to known CVEs, which you would otherwise do by hand on NVD.

Key idea: Nessus is a **detection** tool, not an exploitation tool. It finds and rates weaknesses. It does not break in. You take its findings and, in a pentest, verify or exploit them with something like Metasploit.

Nessus is made by **Tenable** and is one of the most widely used scanners in the industry, which is why it is worth learning even in its free form.

## 4. Scanning Solutions Compared

Nessus is the focus here, but knowing the alternatives is a common objective and useful in practice.

| Scanner                 | Type                              | Notes                                                           |
| ----------------------- | --------------------------------- | --------------------------------------------------------------- |
| **Nessus**              | Commercial (free Essentials tier) | Industry standard, broad plugin coverage, easy to learn         |
| **Qualys**              | Commercial, cloud-based           | Enterprise platform, strong for continuous cloud scanning       |
| **Nexpose / InsightVM** | Commercial (Rapid7)               | Integrates with the Rapid7 ecosystem and Metasploit             |
| **OpenVAS / Greenbone** | Open source, free                 | The main free alternative, no IP cap, heavier to set up and run |

### Nessus vs OpenVAS in short

|               | Nessus                                    | OpenVAS                                               |
| ------------- | ----------------------------------------- | ----------------------------------------------------- |
| **Cost**      | Free tier capped at 16 IPs, paid for more | Fully free and open source                            |
| **Setup**     | Simple installer, quick to running        | More involved to install and maintain                 |
| **Interface** | Polished, beginner-friendly               | Functional, steeper learning curve                    |
| **Coverage**  | Very broad, frequently updated plugins    | Broad, community-driven feed                          |
| **Best for**  | Learning, professional use, ease          | No-cost scanning, no IP limit, open-source preference |

For learning with an easy interface, Nessus Essentials is the usual pick. Where the 16-IP cap or licensing is a blocker, OpenVAS is the free alternative that scales without a per-IP limit.

## 5. Nessus Editions

| Edition                     | Cost                                        | Limit                                        | Good for                                       |
| --------------------------- | ------------------------------------------- | -------------------------------------------- | ---------------------------------------------- |
| **Nessus Essentials**       | Free                                        | Up to 16 IPs, 30-day plugin update delay     | Learning, home labs, students                  |
| **Nessus Essentials Plus**  | Low annual cost, free for verified students | Up to 20 IPs, real-time plugin updates       | Students and hobbyists needing current plugins |
| **Nessus Professional**     | Paid                                        | Unlimited IPs, real-time updates, compliance | Professional pentesters                        |
| **Nessus Expert**           | Paid                                        | Adds web app, external attack surface, cloud | Advanced professional use                      |
| **Tenable.io / Tenable.sc** | Paid                                        | Enterprise, cloud or on-prem managed         | Large organizations                            |

For academy work and home labs, **Nessus Essentials** is the right choice. It is fully featured for small scans, just capped at 16 target IPs, which is plenty for a single target machine. You register for a free activation code to use it.

**Two current details worth knowing:**

- The free Essentials tier applies a **30-day delay on plugin updates**, so the newest vulnerability checks arrive later than on paid tiers. Fine for learning, a limitation for time-sensitive professional work.
- Tenable **removed the non-commercial-use restriction** on Essentials, so it can legally be used for limited professional assessments, though the 16-IP cap makes it impractical for most real engagements.

## 6. Installing Nessus

Nessus runs on Windows, macOS, and Linux. On Kali it is not preinstalled, so you download the installer package from Tenable and install it.

### On Kali and Debian-based Linux

```bash
# 1. Download the Debian package from tenable.com
#    Pick the correct architecture: amd64 for x86-64,
#    or aarch64/arm64 for ARM Kali.

# 2. Install the downloaded .deb
sudo dpkg -i Nessus-*.deb

# 3. If dpkg reports missing dependencies, fix them
sudo apt-get install -f
```

### On other operating systems

| OS                            | Package          | Install method                               |
| ----------------------------- | ---------------- | -------------------------------------------- |
| **Windows**                   | `.msi` installer | Run the installer, then browse to the web UI |
| **macOS**                     | `.dmg` / `.pkg`  | Run the installer package                    |
| **Red Hat / CentOS / Fedora** | `.rpm`           | `sudo rpm -ivh Nessus-*.rpm`                 |
| **Debian / Kali / Ubuntu**    | `.deb`           | `sudo dpkg -i Nessus-*.deb`                  |

Whatever the OS, the pattern is the same: install the package, start the service, then drive it through the browser at port 8834.

> Architecture note: on ARM64 Kali you need the **aarch64** build. Downloading the wrong architecture is a common mistake, and the package will refuse to install or run.

## 7. Starting and Accessing Nessus

Nessus runs as a background service, and you drive it through a **web interface**, not the terminal.

```bash
# Start the Nessus service
sudo systemctl start nessusd

# Enable it to start on boot (optional)
sudo systemctl enable nessusd

# Check it is running
sudo systemctl status nessusd
```

Then open a browser and go to:

```text
https://localhost:8834
```

- You will get a certificate warning (self-signed cert). It is safe to proceed for local use.
- On first run you register the edition (Nessus Essentials), enter your free activation code, and create an admin login.
- Nessus then **downloads and compiles its plugins**. This takes a while on first setup, often 20 to 40 minutes, and can look frozen. The scanner is only ready once plugins finish.

> The registration screen shows only a "Register" option because a fresh install has no local user yet. This is the setup wizard, not a login. Your Tenable account holds the activation code; the local admin account you create here is what you log in with afterward.

## 8. Configuring Nessus

A few settings tune Nessus for reliable performance, especially on a resource-limited lab machine such as an emulated VM.

### Keep plugins current

Plugins are the vulnerability checks, and out-of-date plugins miss recent vulnerabilities.

```bash
# Update plugins from the command line
sudo /opt/nessus/sbin/nessuscli update --all
```

The web UI also updates plugins automatically, but a manual update confirms you are current. Remember the Essentials tier lags paid tiers by 30 days regardless.

### Performance settings that matter

| Setting                           | Where                   | Effect                                                      |
| --------------------------------- | ----------------------- | ----------------------------------------------------------- |
| **Max hosts per scan**            | Scan or policy settings | Lower it on weak hardware to avoid overload                 |
| **Max checks per host**           | Scan or policy settings | Controls concurrency against a single host                  |
| **Scan performance / throttling** | Advanced settings       | Slow the scan to reduce load on fragile targets             |
| **Port scan range**               | Scan settings           | Narrow it to speed up scans when the service scope is known |

On an emulated or slow target, lowering concurrency and throttling the scan prevents timeouts and keeps results reliable. Aggressive settings can overwhelm a weak host and produce incomplete or misleading output.

## 9. Navigating the Interface

Nessus is driven entirely through the web UI. The main areas:

| Area                       | Purpose                                                               |
| -------------------------- | --------------------------------------------------------------------- |
| **Scans**                  | Where you create, launch, view, and manage scans. Your main workspace |
| **My Scans folder**        | The default folder holding your scans and their results               |
| **New Scan / templates**   | The gallery of scan templates to start from                           |
| **Policies**               | Saved, reusable scan configurations                                   |
| **Plugins / plugin rules** | The vulnerability check database and per-plugin overrides             |
| **Settings**               | Software updates, accounts, proxies, and scanner configuration        |

The typical flow reads left to right: pick a template, configure the scan, launch it, then open the completed scan to read findings. Results are organized per scan, and within a scan by host and by severity.

## 10. Authenticated vs Unauthenticated Scans

One of the most important distinctions in vulnerability scanning, and a frequent objective. Organizations should run both.

|               | Unauthenticated (uncredentialed)       | Authenticated (credentialed)                             |
| ------------- | -------------------------------------- | -------------------------------------------------------- |
| **Access**    | No login to the target                 | Uses valid credentials to log in                         |
| **Viewpoint** | What an outside attacker sees          | What is visible from inside the host                     |
| **Depth**     | Surface: exposed services and versions | Deep: installed patches, local config, missing updates   |
| **Accuracy**  | More false positives                   | Far more accurate, fewer false positives                 |
| **Detects**   | Network-facing vulnerabilities         | Missing patches, weak local settings, software inventory |

**Why run both:** an **unauthenticated** scan shows the attacker's external view, the exposed attack surface. A **credentialed** scan logs into the host and reads its actual patch level and configuration, catching things invisible from outside and cutting false positives sharply. Credentialed scanning is what makes vulnerability data reliable enough to drive patch management, which is why regular credentialed scans are strongly recommended alongside unauthenticated ones.

In Nessus, credentials are added under the scan's **Credentials** settings (SSH for Linux, SMB/Windows credentials for Windows, and others).

## 11. Scan Templates and Policies

### Templates

Nessus offers preset **templates** so you do not configure every check by hand.

| Template                     | What it does                                           |
| ---------------------------- | ------------------------------------------------------ |
| **Basic Network Scan**       | General-purpose scan of a host, good default           |
| **Advanced Scan**            | Full control over every setting, no preset assumptions |
| **Host Discovery**           | Just finds live hosts, like an nmap ping sweep         |
| **Web Application Tests**    | Focused on web application vulnerabilities             |
| **Malware Scan**             | Looks for malware indicators                           |
| **Credentialed Patch Audit** | Logs in to check for missing patches                   |
| **Advanced Dynamic Scan**    | Custom scan using dynamic plugin filters               |

For a standard target assessment, **Basic Network Scan** is the go-to. It probes ports, identifies services, and matches them against the plugin database to surface known vulnerabilities.

### Policies

A **policy** is a saved, reusable scan configuration. You set up the options once (templates, plugins, credentials, performance) and reuse the policy across many scans, keeping them consistent. Where a template is Tenable's starting point, a policy is your own customized, saved version of one.

|             | Template                  | Policy                              |
| ----------- | ------------------------- | ----------------------------------- |
| **Origin**  | Provided by Tenable       | Created and saved by you            |
| **Purpose** | Starting point for a scan | Reusable standardized configuration |
| **Reuse**   | Pick each time            | Save once, apply repeatedly         |

Policies matter for a real program because they make scanning **repeatable**: the same policy run monthly produces comparable results over time, which is what lets you track whether your posture is improving.

## 12. Creating, Scheduling, and Managing Scans

### Creating and launching a scan

Once logged into the web UI:

```text
1. Click "New Scan"
2. Choose a scan template (or a saved policy)
3. Give the scan a Name
4. Set "Targets" to the target IP (e.g. 192.168.64.2)
5. (Optional) add Credentials for an authenticated scan
6. Save
7. Launch the scan (the play button)
```

The scan runs in the background. Progress shows per-host, and results populate as it goes. On an emulated or slow target, a full scan can take a while. This is normal.

### Scheduling scans

Regular scanning is the point of a vulnerability management program, and Nessus can run scans on a schedule rather than on demand.

- In the scan's settings, open the **Schedule** section and enable it.
- Set the **frequency** (once, daily, weekly, monthly) and the **start time**.
- Scheduled scans run automatically, which is what turns scanning from a one-off event into an ongoing control feeding patch management.

### Managing scans

| Action           | How                                               |
| ---------------- | ------------------------------------------------- |
| **View results** | Click the scan in My Scans                        |
| **Re-run**       | Launch an existing scan again to verify a fix     |
| **Configure**    | Edit targets, template, credentials, or schedule  |
| **Export**       | Produce a report (Section 16)                     |
| **Compare**      | Some editions diff two scans to show what changed |

Re-running a scan after remediation is the **verify** step of the lifecycle: it confirms the fix actually closed the finding.

## 13. Reading the Results

When the scan finishes, open it to see findings grouped by **severity**, using the same bands as CVSS.

| Severity     | Colour (typical) | Meaning                      |
| ------------ | ---------------- | ---------------------------- |
| **Critical** | Red              | Fix urgently                 |
| **High**     | Orange           | Serious, address soon        |
| **Medium**   | Yellow           | Worth fixing                 |
| **Low**      | Green            | Minor                        |
| **Info**     | Blue             | Not a flaw, just information |

Clicking any finding shows the detail that matters for your report:

- **Description:** what the vulnerability is
- **CVSS score and vector:** severity, which ties into the CVSS Scoring material
- **CVE reference:** the ID to research on NVD
- **Plugin output:** the evidence Nessus used to decide
- **Solution:** the recommended fix (patch, config change)

For a vulnerable target, look for the **Critical or High** finding that names a specific CVE. That is usually your route in. For example, on a Windows SMB target, Nessus flagging an SMB-related Critical with a CVE points you straight at the exploit to research.

> Remember: scanners produce **false positives**. A finding is a lead to verify, not proof. In a pentest you confirm it by actually testing or exploiting it.

## 14. Vulnerability Types and Severity

### Common vulnerability types a scanner finds

| Type                            | Example                                                     |
| ------------------------------- | ----------------------------------------------------------- |
| **Missing patches**             | An unpatched OS or application with a known CVE             |
| **Misconfigurations**           | Default credentials, weak permissions, unnecessary services |
| **Outdated software**           | End-of-life versions no longer receiving fixes              |
| **Weak or default credentials** | Accounts left on shipped defaults                           |
| **Exposed services**            | Unnecessary open ports and services reachable from outside  |
| **Weak encryption**             | Deprecated TLS versions or weak ciphers                     |
| **Information disclosure**      | Services leaking version or configuration detail            |

### Assessing severity

Nessus rates each finding using **CVSS**, the standard severity system, scored 0 to 10 and banded into Info, Low, Medium, High, and Critical.

| Severity | CVSS band               |
| -------- | ----------------------- |
| Critical | 9.0 to 10.0             |
| High     | 7.0 to 8.9              |
| Medium   | 4.0 to 6.9              |
| Low      | 0.1 to 3.9              |
| Info     | No score, informational |

**Important:** CVSS measures **technical severity, not risk.** A Critical CVSS on an isolated lab box may matter less than a Medium on an internet-facing production server holding sensitive data. Severity is the starting point for prioritization, not the whole answer. Nessus also provides a **VPR (Vulnerability Priority Rating)** on some editions, which blends CVSS with real-world threat intelligence to sharpen prioritization.

## 15. Prioritization and Remediation

A scan can return hundreds of findings. The skill is deciding what to fix first, since you cannot fix everything at once.

### How to prioritize

Do not simply sort by CVSS and work down. Combine several signals:

| Factor              | Question                                                  |
| ------------------- | --------------------------------------------------------- |
| **Severity (CVSS)** | How dangerous is the flaw in general?                     |
| **Exploitability**  | Is there a public exploit, or is it on the CISA KEV list? |
| **Asset value**     | How important is the affected system and its data?        |
| **Exposure**        | Is the asset internet-facing or internally isolated?      |
| **Threat context**  | Is this being actively exploited in the wild (VPR, EPSS)? |

A Medium-severity flaw on an exposed, business-critical server that is being actively exploited outranks a Critical on an isolated test box that no one can reach. **Prioritize by real risk, not raw severity.**

### Remediation

Each Nessus finding includes a **Solution** field with the recommended fix. Typical remediations:

- **Patch** the affected software to a fixed version.
- **Reconfigure** to remove the weakness (disable a service, change a default, harden a setting).
- **Mitigate** with a compensating control where an immediate patch is not possible.
- **Accept** the risk, with documented sign-off, where the cost of fixing exceeds the risk.

After remediating, **rescan to verify** the finding is gone. This closes the lifecycle loop and confirms the fix worked rather than assuming it did. Findings, owners, and deadlines then feed the organization's patch management and risk register.

## 16. Generating Reports

For a deliverable, export the scan results to attach or reference.

```text
1. Open the completed scan
2. Click "Report" (or "Export")
3. Choose a format:
   - PDF    -> clean, human-readable, good for reports
   - HTML   -> viewable in a browser
   - CSV    -> raw data for spreadsheets and filtering
   - Nessus -> XML, re-importable into Nessus
4. Save
```

For an academy report, **PDF** is usually the cleanest to include or summarize from. CSV is useful when you want to filter or sort findings in a spreadsheet, and the Nessus XML format preserves everything for re-import.

A good report does not just dump findings. It leads with a summary of the most serious issues in plain terms, then provides the detail and evidence beneath. The raw scan output belongs in an appendix, not the opening page.

## 17. Where Nessus Fits

Nessus sits in the middle of the assessment chain, between discovery and exploitation.

```text
1. nmap         -> discover host, ports, service versions
2. NESSUS       -> scan those services for known vulnerabilities (CVE + CVSS)
3. NVD          -> research the flagged CVE to understand it
4. Metasploit   -> exploit the confirmed vulnerability
5. post-exploit -> extract hashes, find the flag, escalate
```

It is the tool that turns "here is an open SMB service running version X" into "that version has a known Critical flaw, here is its CVE." That handoff, from open port to named vulnerability, is exactly what Nessus automates. In a defensive program, the same output feeds patch management instead of exploitation.

## 18. Command Quick Reference

| Command                                        | What it does                             |
| ---------------------------------------------- | ---------------------------------------- |
| `sudo dpkg -i Nessus-*.deb`                    | Install the Nessus package (Debian/Kali) |
| `sudo rpm -ivh Nessus-*.rpm`                   | Install on Red Hat/Fedora                |
| `sudo apt-get install -f`                      | Fix missing dependencies                 |
| `sudo systemctl start nessusd`                 | Start the Nessus service                 |
| `sudo systemctl enable nessusd`                | Start Nessus on boot                     |
| `sudo systemctl status nessusd`                | Check if Nessus is running               |
| `sudo systemctl stop nessusd`                  | Stop the Nessus service                  |
| `sudo /opt/nessus/sbin/nessuscli update --all` | Update plugins from the CLI              |
| `https://localhost:8834`                       | Open the web interface                   |

| Concept                        | One-line meaning                                                          |
| ------------------------------ | ------------------------------------------------------------------------- |
| **Vulnerability management**   | The ongoing cycle of finding, assessing, fixing, and verifying weaknesses |
| **Vulnerability scanning**     | The automated detection step of that cycle                                |
| **Nessus**                     | Vulnerability scanner that finds known weaknesses                         |
| **Essentials**                 | Free edition, up to 16 IPs, 30-day plugin delay                           |
| **Plugin**                     | A single vulnerability check in Nessus's database                         |
| **Policy**                     | A saved, reusable scan configuration                                      |
| **Credentialed scan**          | An authenticated scan that logs in for deeper, more accurate results      |
| **Basic Network Scan**         | The default general-purpose scan template                                 |
| **False positive**             | A reported flaw that is not actually exploitable                          |
| **CVSS**                       | The 0 to 10 severity score Nessus assigns findings                        |
| **Detection not exploitation** | Nessus finds flaws; it does not break in                                  |

## 19. Fast Recall

- **Vulnerability management** is a continuous cycle: discover, assess, prioritize, remediate, verify, report. Scanning is one step in it.
- **Vulnerability scanning detects and reports; it does not exploit.** Findings need manual verification.
- A **vulnerability scan is one phase of a penetration test,** not a replacement. A pentest adds manual exploitation.
- Scanners use **static testing** (versions vs CVEs) and **dynamic testing** (safe payloads).
- **Nessus is a detection tool made by Tenable.** nmap finds open ports; Nessus tells you which are vulnerable.
- Free alternatives: **OpenVAS** (no IP cap, heavier setup). Others: Qualys, Nexpose.
- **Essentials is free, capped at 16 IPs, with a 30-day plugin update delay.**
- Install matches the OS: `.deb` on Kali (use **aarch64** on ARM), `.rpm` on Red Hat, `.msi` on Windows. Drive it at **https://localhost:8834**.
- **Run both unauthenticated and credentialed scans.** Unauthenticated is the attacker's outside view; credentialed logs in for deep, accurate results and fewer false positives.
- A **template** is Tenable's starting config; a **policy** is your saved reusable version. **Basic Network Scan** is the default.
- **Schedule scans** to make scanning an ongoing control, not a one-off.
- Results are banded by **CVSS**: Critical, High, Medium, Low, Info. Each finding has a description, CVSS, CVE, plugin output, and solution.
- **CVSS is severity, not risk.** Prioritize by combining severity, exploitability (KEV, EPSS, VPR), asset value, and exposure.
- **Remediate then rescan to verify.** Feed findings into patch and risk management.
- Export reports as **PDF** for readability, **CSV** for filtering, **Nessus XML** for re-import.

## 20. Resources

**Official**

- [Nessus Documentation](https://docs.tenable.com/nessus.htm)
- [Nessus Essentials product page](https://www.tenable.com/products/nessus/nessus-essentials)
- [Tenable Community Forums](https://community.tenable.com/)
- [Nessus download page](https://www.tenable.com/downloads/nessus)

**Guides and tutorials**

- [Nessus Essentials: beginner scan guide (Tenable)](https://docs.tenable.com/nessus/Content/GettingStarted.htm)
- [Tenable Nessus Fundamentals course](https://www.tenable.com/education)

**Comparison and alternatives**

- [OpenVAS / Greenbone](https://www.greenbone.net/)
- [NIST National Vulnerability Database](https://nvd.nist.gov/)
- [CISA Known Exploited Vulnerabilities Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)

**Standards**

- [NIST SP 800-40, Guide to Enterprise Patch Management](https://csrc.nist.gov/pubs/sp/800/40/r4/final)
- [CVSS Calculator (FIRST)](https://www.first.org/cvss/calculator/3.1)
