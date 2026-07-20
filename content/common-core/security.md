# Linux Security

---

## 1. What is Linux

- **Linux** = a free, open-source operating system kernel created by Linus Torvalds in 1991.
- The "kernel" is the core that talks to hardware (CPU, RAM, disk, network).
- A **distribution (distro)** = kernel + tools + package manager + desktop environment.
- Popular distros: **Ubuntu, Debian, Fedora, Arch, Kali, CentOS**.
- **Why Linux dominates cybersecurity:**
  - Open source — you can audit every line of code
  - Stable, fast, and lightweight
  - Most servers (75%+ of web servers) run Linux
  - All major security tools are built for Linux first
  - Full control over the system (unlike Windows/macOS)

## 2. What is Kali Linux

- A **Debian-based distribution** designed specifically for **penetration testing and ethical hacking**.
- Maintained by **Offensive Security**.
- Comes with **600+ pre-installed security tools**: nmap, Metasploit, Wireshark, Burp Suite, John the Ripper, Aircrack-ng, etc.
- Default user used to be `root`; modern Kali (2020+) uses a regular user `kali` with `sudo`.
- Used by red teams, penetration testers, forensic analysts, security researchers.

```bash
# Check Kali version
cat /etc/os-release
lsb_release -a
uname -a            # kernel version
```

---

## 3. The Shell

- The **shell** is the program that reads your commands and tells the kernel what to do.
- Most common shell: **Bash** (`/bin/bash`). Kali uses Zsh by default.
- The **terminal** is the window; the **shell** is the program inside it.
- **Shell prompt** example: `nishan@kali:~$` — user @ host : current directory $.

**Key shell features:**
- **Tab completion** — saves typing
- **History** — `↑/↓` arrows or `history` command
- **Pipes (`|`)** — send output of one command to another: `ps aux | grep nginx`
- **Redirection** — `>` overwrite, `>>` append, `<` read input
- **Variables** — `$1` (first argument), `$$` (current PID), `$HOME` (home dir)

---

## 4. Linux OS Structure

Linux is built in 4 layers:

| Layer | Description | Example |
|-------|------------|---------|
| **Hardware** | Physical components | CPU, RAM, disk, NIC |
| **Kernel** | Manages hardware, processes, memory, I/O | Linux kernel |
| **Shell** | Translates user commands for the kernel | Bash, Zsh |
| **Applications** | Programs you actually use | nmap, Firefox, Vim |

**The kernel handles:**
- **Process management** — scheduling which program runs when
- **Memory management** — RAM allocation
- **File system** — reading/writing files
- **Device drivers** — talking to hardware
- **Networking** — sending/receiving packets

---

## 5. The Filesystem Hierarchy Standard (FHS)

**FHS** is the official standard that defines where every type of file should live in a Linux system.

### Why FHS exists / Benefits:
- **Predictability** — you always know where to find configs, logs, binaries
- **Portability** — scripts and tools work across different distros
- **Security** — separates system files from user files, executables from data
- **Easier administration** — sysadmins work the same way on any Linux system
- **Package manager compatibility** — apt, yum, dnf all rely on FHS

### Complete Directory Reference

| Directory | Purpose | Real example |
|-----------|---------|-------------|
| `/` | Root of everything | top of the tree |
| `/bin` | Essential user binaries | `ls`, `cp`, `cat`, `bash` |
| `/sbin` | System binaries (root use) | `iptables`, `fdisk`, `reboot` |
| `/etc` | System config files | `/etc/passwd`, `/etc/ssh/sshd_config`, `/etc/ufw/` |
| `/home` | User home dirs | `/home/nishan/` |
| `/root` | Root user's home dir | `/root/` (NOT same as `/`) |
| `/var` | Variable data (changes) | `/var/log/`, `/var/www/`, `/var/spool/` |
| `/var/log` | System logs | `auth.log`, `syslog`, `kern.log` |
| `/tmp` | Temporary files (cleared on reboot) | scratch space, anyone can write |
| `/usr` | User programs and libraries | `/usr/bin/nmap`, `/usr/local/` |
| `/usr/local` | Locally installed software | software not from package manager |
| `/dev` | Device files | `/dev/sda` (disk), `/dev/null`, `/dev/random` |
| `/proc` | Virtual FS — running process info | `/proc/cpuinfo`, `/proc/<PID>/` |
| `/sys` | Virtual FS — kernel/hardware info | `/sys/class/net/` |
| `/boot` | Kernel + bootloader files | `vmlinuz`, `grub/` |
| `/lib`, `/lib64` | Shared libraries for `/bin`, `/sbin` | `.so` files |
| `/opt` | Optional 3rd-party software | manually installed apps |
| `/mnt` | Manually mounted filesystems | `/mnt/usb` |
| `/media` | Auto-mounted removable media | USB sticks, CDs |
| `/srv` | Data served by services | website files, FTP roots |

### Key files for security

| File | What it contains |
|------|-----------------|
| `/etc/passwd` | All user accounts (one per line) |
| `/etc/shadow` | Password hashes (root only) |
| `/etc/group` | All groups |
| `/etc/sudoers` | Who can use sudo (edit with `visudo`) |
| `/etc/hosts` | Local hostname → IP mappings |
| `/etc/resolv.conf` | DNS server settings |
| `/etc/ssh/sshd_config` | SSH server config |
| `/var/log/auth.log` | All authentication attempts |
| `/var/log/syslog` | Generic system messages |
| `/var/log/kern.log` | Kernel messages |
| `~/.bash_history` | Commands the user typed |

---

## 6. Linux Commands

A command has 3 parts: **command + options + arguments**.

```bash
ls -la /etc
↑   ↑   ↑
│   │   └── argument (the path)
│   └────── options (-l long format, -a show hidden)
└────────── command
```

### Categories of commands you'll use

| Category | Commands |
|----------|---------|
| **Navigation** | `pwd`, `cd`, `ls` |
| **File ops** | `cp`, `mv`, `rm`, `touch`, `mkdir`, `rmdir`, `ln` |
| **Reading** | `cat`, `less`, `more`, `head`, `tail`, `grep` |
| **Permissions** | `chmod`, `chown`, `chgrp`, `umask`, `chattr` |
| **Process** | `ps`, `top`, `htop`, `kill`, `pgrep`, `pkill`, `nice` |
| **Network** | `ip`, `ifconfig`, `ping`, `netstat`, `ss`, `traceroute`, `dig`, `nslookup` |
| **Users** | `whoami`, `who`, `id`, `useradd`, `usermod`, `passwd`, `su`, `sudo` |
| **Disk** | `df`, `du`, `mount`, `umount`, `lsblk`, `fdisk` |
| **Search** | `find`, `locate`, `which`, `whereis` |
| **Archives** | `tar`, `gzip`, `gunzip`, `zip`, `unzip` |
| **Text** | `awk`, `sed`, `cut`, `sort`, `uniq`, `wc`, `tr` |
| **Help** | `man`, `help`, `info`, `--help` |

---

## 7. Protecting Files and Directories

### File permission basics

```bash
ls -l /etc/passwd
# -rw-r--r-- 1 root root 1932 Apr 15 10:23 /etc/passwd
```

The first column breakdown:
- **First char**: file type (`-` file, `d` directory, `l` symlink)
- **Next 3**: owner permissions (`rw-`)
- **Next 3**: group permissions (`r--`)
- **Last 3**: others permissions (`r--`)

### `chmod` — Change permissions

**Symbolic mode:**

```bash
chmod u+x script.sh        # add execute for owner
chmod g-w file             # remove write from group
chmod o=r file             # set others to read only
chmod a+x script.sh        # add execute for all (a = all)
chmod ug+rw file           # owner + group can read/write
```

**Numeric mode (most common):**

| Octal | Permissions | Binary |
|-------|------------|--------|
| 0 | `---` | 000 |
| 1 | `--x` | 001 |
| 2 | `-w-` | 010 |
| 4 | `r--` | 100 |
| 5 | `r-x` | 101 |
| 6 | `rw-` | 110 |
| 7 | `rwx` | 111 |

```bash
chmod 644 file.txt         # rw-r--r-- (typical file)
chmod 755 script.sh        # rwxr-xr-x (typical executable)
chmod 600 ~/.ssh/id_rsa    # rw------- (private key, owner only)
chmod 700 ~/.ssh           # rwx------ (SSH dir)
chmod 777 file             # rwxrwxrwx (DANGEROUS — everyone can do anything)
```

### `chown` — Change owner

```bash
sudo chown nishan file              # change owner only
sudo chown nishan:hackers file      # change owner AND group
sudo chown :hackers file            # change group only
sudo chown -R nishan:nishan dir/    # recursive (whole directory)
```

### `chattr` — Change attributes (advanced protection)

```bash
sudo chattr +i file        # immutable (CAN'T be deleted/modified, even by root)
sudo chattr -i file        # remove immutable
sudo chattr +a logfile     # append-only (only adding allowed, useful for logs)
lsattr file                # check attributes
```

### Special permissions

| Bit | Symbol | Purpose | Example |
|-----|--------|---------|---------|
| **SUID** | `s` (owner x) | Run as file owner | `/usr/bin/passwd` |
| **SGID** | `s` (group x) | Run as group | shared dirs |
| **Sticky** | `t` (others x) | Only owner can delete | `/tmp` |

```bash
chmod 4755 file    # SUID
chmod 2755 file    # SGID
chmod 1755 dir     # sticky (like /tmp)
```

### `umask` — Default permission mask

```bash
umask              # show current mask (typically 022 or 002)
umask 077          # new files: 600, new dirs: 700 (private)
```

Mask works by **subtraction** from `666` (files) or `777` (dirs):
- umask `022` → new files = `644`, new dirs = `755`
- umask `077` → new files = `600`, new dirs = `700`

### Real-world security examples

```bash
# Lock down a sensitive file
chmod 600 secrets.txt
chown root:root secrets.txt

# Make a config file read-only for everyone
sudo chmod 444 /etc/important.conf

# Make a logfile that even root can't tamper with easily
sudo chattr +a /var/log/audit.log

# Find all SUID files (potential privilege escalation targets)
sudo find / -perm -4000 -type f 2>/dev/null

# Find world-writable files (security risk)
sudo find / -perm -o+w -type f 2>/dev/null
```

---

## 8. Monitoring and Investigating System Activity

### Live monitoring

```bash
top                       # real-time process view
htop                      # prettier, color-coded version
ps aux                    # snapshot of ALL processes
ps -ef                    # alternative format
ps aux --sort=-%cpu       # sort by CPU usage (highest first)
ps aux --sort=-%mem       # sort by memory
watch -n 1 'ps aux'       # refresh ps every 1 second
```

### Who's logged in?

```bash
who                       # currently logged-in users
w                         # who + what they're doing
whoami                    # current user
id                        # current user's UID, GID, groups
last                      # login history (read /var/log/wtmp)
last -f /var/log/btmp     # FAILED login attempts
lastlog                   # last login per user
```

### Log files (the most important security skill)

```bash
# Real-time log watching
sudo tail -f /var/log/auth.log         # SSH/sudo logins
sudo tail -f /var/log/syslog           # general messages
sudo tail -f /var/log/kern.log         # kernel events

# Search logs
sudo grep "Failed password" /var/log/auth.log
sudo grep "sudo" /var/log/auth.log
sudo grep -i "error" /var/log/syslog

# systemd logs (modern Linux)
journalctl                              # all logs
journalctl -u ssh                       # only SSH service logs
journalctl --since "1 hour ago"
journalctl -p err                       # only errors
journalctl -f                           # follow live (like tail -f)
```

### Investigating suspicious activity

```bash
# Find recently modified files (possible intrusion)
sudo find / -mtime -1 -type f 2>/dev/null   # modified in last 24h
sudo find /etc -mtime -7                    # modified configs in last 7 days

# Hidden files anywhere
find / -name ".*" 2>/dev/null

# Files owned by no user (deleted user, possible backdoor)
sudo find / -nouser -o -nogroup 2>/dev/null

# Check for unusual SUID binaries
sudo find / -perm -4000 -type f 2>/dev/null

# See who's connected
who
ss -tnp                  # active TCP connections + processes
```

### Disk and resource usage

```bash
df -h                    # disk space (human readable)
du -sh /var/log          # size of a directory
du -sh * | sort -h       # size of everything in current dir
free -h                  # RAM usage
uptime                   # system uptime + load average
```

---

## 9. Identifying and Terminating Malicious Processes

### Find suspicious processes

```bash
ps aux                              # see all processes
ps aux | grep -v grep | grep nc     # look for netcat (often used in attacks)
ps -ef --forest                     # tree view of process hierarchy
top                                 # CPU/RAM hogs
ps aux --sort=-%cpu | head          # top 10 CPU users
```

**Red flags in `ps aux`:**
- Processes from unknown users
- Strange process names (random strings, names mimicking system processes)
- Processes consuming 100% CPU/RAM
- Network listeners on weird ports
- Processes whose binary path is in `/tmp` or `/dev/shm`

### Kill them

```bash
kill PID                  # gentle (SIGTERM)
kill -9 PID               # force (SIGKILL — cannot be ignored)
pkill firefox             # kill by name
pkill -9 -f "bad_script"  # force kill by command-line pattern
killall nginx             # kill all matching name
```

### Trace a process

```bash
ls -l /proc/PID/exe       # what binary the process is running
ls -l /proc/PID/cwd       # working directory
cat /proc/PID/cmdline     # command line that started it
ls -l /proc/PID/fd/       # files the process has open
sudo lsof -p PID          # files + sockets it's using
sudo strace -p PID        # see system calls in real time
```

### Real example: investigate a suspicious process

```bash
ps aux | grep suspicious_name
# nishan  4521  98.0  ...  /tmp/.x

ls -l /proc/4521/exe       # confirms it's running from /tmp/.x
cat /proc/4521/cmdline     # see arguments
sudo lsof -p 4521          # check what files/network it touches
sudo kill -9 4521          # terminate
sudo rm /tmp/.x            # delete the binary
```

---

## 10. Network Monitoring

### `netstat` (older) and `ss` (newer, faster)

```bash
# Listening ports + which programs
sudo netstat -tulnp
sudo ss -tulnp

# All TCP connections
ss -tan
netstat -an

# Real-time count of connections
watch -n 1 'ss -tan | wc -l'

# Show only ESTABLISHED connections
ss -tan state established
```

**Flag reference:**
| Flag | Meaning |
|------|---------|
| `t` | TCP |
| `u` | UDP |
| `l` | Listening |
| `n` | Numeric (no DNS lookup) |
| `p` | Show process |
| `a` | All |

### Real network monitoring examples

```bash
# What's listening on my machine?
sudo ss -tulnp

# Who is my server connected to right now?
sudo ss -tnp state established

# Is port 22 open and listening?
sudo ss -tlnp | grep :22

# Detect a backdoor listening on a high port
sudo ss -tlnp | grep -E ':[0-9]{4,5}'
```

### Other networking commands

```bash
ip a                       # show all interfaces + IPs (modern)
ifconfig                   # older equivalent
ip route                   # routing table
ping 8.8.8.8               # check connectivity
traceroute google.com      # route to a host
dig google.com             # DNS lookup
nslookup google.com        # alternative DNS lookup
arp -a                     # ARP table (local network neighbors)
```

---

## 11. Network Analysis Tools

### `nmap` — Network Scanner

The Swiss army knife of network discovery and security auditing.

```bash
# Basic scans
nmap 192.168.1.1                   # default scan (top 1000 ports)
nmap 192.168.1.0/24                # whole subnet
nmap 192.168.1.1-50                # range
nmap scanme.nmap.org               # by hostname
nmap -iL targets.txt               # list of targets from file

# Port specification
nmap -p 22,80,443 target           # specific ports
nmap -p 1-1000 target              # port range
nmap -p- target                    # ALL 65535 ports
nmap --top-ports 100 target        # top 100 most common

# Scan types
nmap -sS target                    # SYN scan (stealth, needs root)
nmap -sT target                    # TCP connect scan (no root needed)
nmap -sU target                    # UDP scan
nmap -sn 192.168.1.0/24            # ping scan only (host discovery)
nmap -Pn target                    # skip host discovery (target blocks ping)

# Detection
nmap -sV target                    # service version detection
nmap -O target                     # OS detection
nmap -A target                     # aggressive (OS + version + scripts + traceroute)

# Output
nmap -oN scan.txt target           # normal output to file
nmap -oX scan.xml target           # XML output
nmap -oG scan.gnmap target         # greppable

# Scripts (NSE — Nmap Scripting Engine)
nmap --script vuln target          # check for vulnerabilities
nmap --script http-title target    # get HTTP page titles
nmap --script default target       # default script set
```

**Real-world examples:**

```bash
# Find live hosts on your local network
nmap -sn 192.168.1.0/24

# Check what services are running on a server
sudo nmap -sV -sC -O target.com

# Quick vulnerability check
sudo nmap --script vuln target.com

# Stealthier scan (slower, less detectable)
sudo nmap -sS -T2 target.com
```

### `tcpdump` — Packet Sniffer

Captures network packets in real time. Powerful for traffic analysis.

```bash
# Basic captures
sudo tcpdump                       # capture on default interface
sudo tcpdump -i eth0               # specific interface
sudo tcpdump -i any                # all interfaces
sudo tcpdump -D                    # list available interfaces

# Filtering
sudo tcpdump host 192.168.1.10     # only traffic to/from a host
sudo tcpdump src 192.168.1.10      # only from a host
sudo tcpdump dst 192.168.1.10      # only to a host
sudo tcpdump port 80               # only HTTP
sudo tcpdump port 22               # only SSH
sudo tcpdump tcp                   # only TCP
sudo tcpdump udp                   # only UDP
sudo tcpdump icmp                  # only ping

# Combined filters
sudo tcpdump 'tcp port 80 and host 10.0.0.1'

# Output options
sudo tcpdump -n                    # don't resolve names (faster)
sudo tcpdump -nn                   # no name OR port resolution
sudo tcpdump -c 100                # capture 100 packets and stop
sudo tcpdump -v                    # verbose
sudo tcpdump -X                    # show packet contents (hex + ASCII)
sudo tcpdump -A                    # show packet contents (ASCII only)

# Save and read
sudo tcpdump -w capture.pcap       # save to file
sudo tcpdump -r capture.pcap       # read from file
```

**Real-world examples:**

```bash
# Detect someone scanning you
sudo tcpdump -i any 'tcp[tcpflags] == tcp-syn'

# Capture all traffic to your web server
sudo tcpdump -i eth0 -w web.pcap port 80 or port 443

# See plaintext passwords in HTTP traffic
sudo tcpdump -i any -A port 80 | grep -i "password"

# Monitor DNS queries
sudo tcpdump -i any port 53
```

### `lynis` — Security Auditing Tool

Automated scanner that audits the entire system and gives you a hardening report.

```bash
sudo lynis audit system            # full system audit
sudo lynis audit system --quick    # faster scan
sudo lynis show details            # detailed findings
sudo lynis show categories         # what categories it checks
sudo lynis update info             # check for updates

# Generate report
sudo lynis audit system --report-file /tmp/lynis-report.dat
```

After scanning, Lynis gives you:
- A **Hardening Index** score (0–100)
- **Warnings** (must fix) and **Suggestions** (should fix)
- Specific recommendations per category (auth, kernel, network, etc.)

Reports go to: `/var/log/lynis.log` and `/var/log/lynis-report.dat`

---

## 12. Firewall Configuration

### `ufw` — Uncomplicated Firewall

Easy front-end for iptables. Great for beginners.

```bash
# Status and basic control
sudo ufw status                    # see current status + rules
sudo ufw status verbose            # detailed
sudo ufw status numbered           # numbered rules (for deletion)
sudo ufw enable                    # turn ON (will start at boot)
sudo ufw disable                   # turn OFF
sudo ufw reset                     # wipe all rules

# Default policies
sudo ufw default deny incoming     # block all incoming by default
sudo ufw default allow outgoing    # allow all outgoing by default

# Allow / deny rules
sudo ufw allow 22                  # allow port 22 (any protocol)
sudo ufw allow 22/tcp              # allow port 22 TCP only
sudo ufw allow ssh                 # by service name
sudo ufw allow 80/tcp              # HTTP
sudo ufw allow 443/tcp             # HTTPS
sudo ufw deny 23                   # block telnet
sudo ufw allow from 192.168.1.0/24                  # allow whole subnet
sudo ufw allow from 10.0.0.5 to any port 22         # allow specific IP to SSH
sudo ufw deny from 5.6.7.8                          # block one IP

# Rate limiting (anti-brute-force)
sudo ufw limit ssh                 # limit SSH connection attempts

# Delete rules
sudo ufw delete allow 80           # delete by rule
sudo ufw delete 3                  # delete by number (use status numbered)

# Logging
sudo ufw logging on
sudo ufw logging medium            # off, low, medium, high, full
```

**Typical web server setup:**

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### `iptables` — The Real Firewall (low-level)

`ufw` is just a wrapper around `iptables`. For finer control, use iptables directly.

```bash
# View rules
sudo iptables -L                   # list all rules
sudo iptables -L -v -n             # verbose, numeric
sudo iptables -L INPUT             # specific chain

# Common chains
# INPUT   = packets coming IN to your machine
# OUTPUT  = packets going OUT
# FORWARD = packets being routed through (for routers)
```

**Add rules:**

```bash
# Allow SSH
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow HTTP/HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Block a specific IP
sudo iptables -A INPUT -s 5.6.7.8 -j DROP

# Allow only from a subnet
sudo iptables -A INPUT -p tcp --dport 22 -s 192.168.1.0/24 -j ACCEPT

# Allow established/related connections (essential!)
sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Default policy: drop everything else
sudo iptables -P INPUT DROP
```

**Targets (`-j`):**
| Target | What it does |
|--------|-------------|
| `ACCEPT` | Allow the packet |
| `DROP` | Silently discard (sender gets nothing back) |
| `REJECT` | Discard but tell sender |
| `LOG` | Log it and continue |

**Manage rules:**

```bash
sudo iptables -D INPUT 1           # delete rule #1
sudo iptables -F                   # flush ALL rules (careful!)
sudo iptables -F INPUT             # flush only INPUT chain
sudo iptables-save > rules.v4      # save rules to file
sudo iptables-restore < rules.v4   # load rules from file
```

### `Fwbuilder`

A graphical tool for designing complex firewall rules. Builds rules for `iptables`, `pf`, Cisco, etc. Useful for managing many machines or complex rule sets — drag-and-drop interface, then deploy generated rules.

---

## 13. Securely Transferring Files (SCP)

`scp` = **Secure Copy** — uses SSH for encrypted file transfer.

### Basic syntax

```bash
scp [options] source destination
```

### Common usage

```bash
# Local → Remote
scp file.txt nishan@192.168.1.10:/home/nishan/
scp file.txt nishan@server.com:~/backup/

# Remote → Local
scp nishan@192.168.1.10:/home/nishan/file.txt .
scp nishan@server.com:/var/log/syslog ./

# Remote → Remote
scp user1@host1:/path/file user2@host2:/path/

# Whole directory
scp -r mydir/ nishan@server.com:~/backup/

# Different SSH port (not default 22)
scp -P 2222 file.txt nishan@server.com:~/

# Use a specific SSH key
scp -i ~/.ssh/mykey file.txt nishan@server.com:~/

# Verbose output (debugging)
scp -v file.txt user@host:~/

# Preserve timestamps and permissions
scp -p file.txt user@host:~/

# Compress during transfer (faster on slow connections)
scp -C bigfile.tar user@host:~/
```

### Real-world security workflow

```bash
# 1. Generate SSH keys (one-time setup)
ssh-keygen -t ed25519 -C "your_email@example.com"

# 2. Copy your public key to the server
ssh-copy-id user@server.com

# 3. Now SCP works without a password
scp file.txt user@server.com:~/
```

**Other secure transfer tools:**
- **`sftp`** — interactive file transfer over SSH
- **`rsync`** — synchronizes files (only sends changes, very efficient)
  ```bash
  rsync -avz --progress mydir/ user@server.com:~/backup/
  ```

---

## 14. Linux Networking Basics

### Show network info

```bash
ip a                                # all interfaces and IPs
ip link                             # interfaces only
ip route                            # routing table
ip neigh                            # ARP table
hostname                            # machine name
hostname -I                         # all IPs

# Older equivalents (still work)
ifconfig
route -n
arp -a
```

### Test connectivity

```bash
ping -c 4 google.com                # send 4 pings
ping -c 4 8.8.8.8                   # IP-only (skips DNS)
traceroute google.com               # path to a host
mtr google.com                      # live traceroute (great tool)
curl -I https://google.com          # check if HTTP/HTTPS works
wget google.com                     # download a page
```

### DNS lookups

```bash
dig google.com                      # detailed DNS info
dig google.com MX                   # mail records
dig @8.8.8.8 google.com             # use specific DNS server
nslookup google.com                 # alternative
host google.com                     # simple version
```

---

## 15. Why Linux for Cybersecurity?

| Advantage | Why it matters |
|-----------|---------------|
| **Open source** | Can audit code; no hidden backdoors |
| **Free** | Deploy on as many machines as needed |
| **Stable** | Servers run for years without restart |
| **Customizable** | Strip down to bare minimum (smaller attack surface) |
| **Powerful CLI** | Automate everything with scripts |
| **Tool ecosystem** | Every security tool runs on Linux first |
| **Granular permissions** | True multi-user, fine-grained access control |
| **Networking** | Built from the ground up for networks |
| **Community** | Massive support, rapid security patches |

