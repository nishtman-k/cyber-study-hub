# Nessus — Vulnerability Scanner

> A practical reference for Nessus, a vulnerability scanner that probes a target and reports known weaknesses with CVSS scores and CVE references. This sheet covers the free Essentials edition on Kali, the workflow of running a scan, and how to read what it finds.

---

## 1. What is Nessus?

**Nessus** is a **vulnerability scanner**. You point it at a target (an IP or range), and it checks that target against a large database of known vulnerability signatures, then reports what it found, how severe each issue is, and often the matching CVE.

Where **nmap** tells you *what is open and what version is running*, **Nessus** goes further and tells you *which of those things are known to be vulnerable*. It automates the step of matching a service version to known CVEs, which you would otherwise do by hand on NVD.

Key idea: Nessus is a **detection** tool, not an exploitation tool. It finds and rates weaknesses. It does not break in. You take its findings and, in a pentest, verify or exploit them with something like Metasploit.

---

## 2. Nessus Editions

| Edition                | Cost      | Limit                          | Good for                     |
| ---------------------- | --------- | ------------------------------ | ---------------------------- |
| **Nessus Essentials**  | Free      | Up to 16 IPs                   | Learning, home labs, students |
| **Nessus Professional**| Paid      | Unlimited IPs                  | Professional pentesters       |
| **Tenable.io / .sc**   | Paid      | Enterprise, cloud-managed      | Large organizations           |

For academy work and home labs, **Nessus Essentials** is the right choice. It is fully featured for small scans, just capped at 16 target IPs, which is plenty for a single target machine. You register for a free activation code to use it.

---

## 3. Installing on Kali

Nessus is not preinstalled on Kali. You download the installer package from Tenable and install it.

```bash
# 1. Download the Debian package from tenable.com
#    (pick the correct architecture: amd64, or aarch64/arm64 for ARM Kali)

# 2. Install the downloaded .deb
sudo dpkg -i Nessus-*.deb

# 3. If dpkg reports missing dependencies, fix them
sudo apt-get install -f
```

> Architecture note: on ARM64 Kali you need the **aarch64** build, not amd64. Downloading the wrong architecture is a common mistake, and the package will refuse to install or run.

---

## 4. Starting and Accessing Nessus

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

```markdown
https://localhost:8834
```

- You will get a certificate warning (self-signed cert). It is safe to proceed for local use.
- On first run you register the edition (Nessus Essentials), enter your free activation code, and create an admin login.
- Nessus then **downloads and compiles its plugins**. This takes a while on first setup. The scanner is only ready once plugins finish.

---

## 5. Creating a Scan

Once logged into the web UI:

```markdown
1. Click "New Scan"
2. Choose a scan template (see next section)
3. Give the scan a Name
4. Set "Targets" to the target IP (e.g. 192.168.64.2)
5. Save
6. Launch the scan (the play button)
```

The scan runs in the background. Progress shows per-host, and results populate as it goes. On an emulated or slow target, a full scan can take a while. This is normal.

---

## 6. Scan Templates

Nessus offers preset templates so you do not configure every check by hand.

| Template                  | What it does                                     |
| ------------------------- | ------------------------------------------------ |
| **Basic Network Scan**    | General-purpose scan of a host, good default     |
| **Advanced Scan**         | Full control over every setting                  |
| **Host Discovery**        | Just finds live hosts (like an nmap ping sweep)  |
| **Web Application Tests** | Focused on web app vulnerabilities               |
| **Malware Scan**          | Looks for malware indicators                     |

For a standard target assessment, **Basic Network Scan** is the go-to. It probes ports, identifies services, and matches them against the plugin database to surface known vulnerabilities.

---

## 7. Reading the Results

When the scan finishes, open it to see findings grouped by **severity**, using the same bands as CVSS.

| Severity     | Colour (typical) | Meaning                       |
| ------------ | ---------------- | ----------------------------- |
| **Critical** | Red              | Fix urgently                  |
| **High**     | Orange           | Serious, address soon         |
| **Medium**   | Yellow           | Worth fixing                  |
| **Low**      | Green            | Minor                         |
| **Info**     | Blue             | Not a flaw, just information   |

Clicking any finding shows the detail that matters for your report:

- **Description** — what the vulnerability is
- **CVSS score and vector** — severity (ties into the CVSS Scoring sheet)
- **CVE reference** — the ID to research on NVD
- **Plugin output** — the evidence Nessus used to decide
- **Solution** — the recommended fix (patch, config change)

For a vulnerable target, look for the **Critical or High** finding that names a specific CVE. That is usually your route in. For example, on a Windows SMB target, Nessus flagging an SMB-related Critical with a CVE points you straight at the exploit to research.

> Remember: scanners produce **false positives**. A finding is a lead to verify, not proof. In a pentest you confirm it by actually testing or exploiting it.

---

## 8. Exporting Reports

For a deliverable, export the scan results to attach or reference.

```markdown
1. Open the completed scan
2. Click "Report" (or "Export")
3. Choose a format:
   - PDF    → clean, human-readable, good for reports
   - HTML   → viewable in a browser
   - CSV    → raw data for spreadsheets and filtering
   - Nessus → XML, re-importable into Nessus
4. Save
```

For an academy report, **PDF** is usually the cleanest to include or summarize from.

---

## 9. Where Nessus Fits

Nessus sits in the middle of the assessment chain, between discovery and exploitation.

```markdown
1. nmap         → discover host, ports, service versions
2. NESSUS       → scan those services for known vulnerabilities (CVE + CVSS)
3. NVD          → research the flagged CVE to understand it
4. Metasploit   → exploit the confirmed vulnerability
5. post-exploit → extract hashes, find the flag, escalate
```

It is the tool that turns "here is an open SMB service running version X" into "that version has a known Critical flaw, here is its CVE." That handoff, from open port to named vulnerability, is exactly what Nessus automates.

---

## 10. Command Quick Reference

| Command                              | What it does                        |
| ------------------------------------ | ----------------------------------- |
| `sudo dpkg -i Nessus-*.deb`          | Install the Nessus package          |
| `sudo apt-get install -f`            | Fix missing dependencies            |
| `sudo systemctl start nessusd`       | Start the Nessus service            |
| `sudo systemctl enable nessusd`      | Start Nessus on boot                |
| `sudo systemctl status nessusd`      | Check if Nessus is running          |
| `sudo systemctl stop nessusd`        | Stop the Nessus service             |
| `https://localhost:8834`             | Open the web interface              |

| Concept                        | One-line meaning                                  |
| ------------------------------ | ------------------------------------------------- |
| **Nessus**                     | Vulnerability scanner that finds known weaknesses |
| **Essentials**                 | Free edition, up to 16 IPs                         |
| **Plugin**                     | A single vulnerability check in Nessus's database |
| **Basic Network Scan**         | The default general-purpose scan template         |
| **False positive**             | A reported flaw that is not actually exploitable  |
| **Detection not exploitation** | Nessus finds flaws; it does not break in          |
