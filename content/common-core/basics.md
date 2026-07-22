# Linux Security Basics

---

## What is Linux?

- **Linux** is a free, open-source operating system kernel.
- The "Linux OS" is the kernel + tools (called a **distribution** or "distro").
- Examples of distros: **Ubuntu, Kali, Debian, Fedora, Arch**.
- It powers most servers, cloud infrastructure, Android phones, and embedded devices — making it essential to learn for cybersecurity.

## What is a Linux Command?

- A command is an instruction you type in the **shell** (terminal) that the OS executes.
- Example: `ls`, `pwd`, `cat`, `kill`, `nmap`.
- Commands can take **options** (`-l`, `-a`) and **arguments** (file names, IPs).

```bash
ls -l /etc       # ls = command, -l = option, /etc = argument
```

## Structure of the Linux OS

Linux has 4 main layers:

| Layer | What it does |
|-------|-------------|
| **Hardware** | CPU, RAM, disk, network card |
| **Kernel** | Core program that talks to hardware (memory, processes, drivers) |
| **Shell** | Lets you talk to the kernel via commands (Bash, Zsh) |
| **Applications** | Programs you use (Firefox, Vim, nmap) |

---

## What is the FHS?

**FHS** = **Filesystem Hierarchy Standard** — a rulebook that defines where things live in a Linux system.

**Why it exists / benefits:**
- Every distro follows the same layout, so tools and scripts work across them.
- You always know where to find configs, logs, binaries, etc.
- Makes Linux predictable and easier to manage.

## Main Directories in Linux

| Directory | Purpose |
|-----------|---------|
| `/` | The root (top of everything) |
| `/bin` | Essential user commands (`ls`, `cp`, `mv`) |
| `/sbin` | System admin commands (need root) |
| `/etc` | System configuration files (e.g., `/etc/passwd`) |
| `/home` | User home directories (`/home/nishan`) |
| `/root` | Home directory of the **root** user |
| `/var` | Variable data — logs (`/var/log`), mail, spool |
| `/tmp` | Temporary files (cleared on reboot) |
| `/usr` | User programs and libraries |
| `/dev` | Device files (disks, USB, terminals) |
| `/proc` | Virtual filesystem with info about running processes |
| `/boot` | Kernel and boot loader files |
| `/lib` | Shared libraries needed by `/bin` and `/sbin` |
| `/opt` | Optional/3rd-party software |
| `/mnt`, `/media` | Mounted external drives, USBs, ISOs |

---

## How to Protect Files and Directories

### Permissions (`chmod`)

Each file has 3 permission groups: **owner / group / others**, with 3 actions: **read (r), write (w), execute (x)**.

```bash
ls -l file.txt
# -rw-r--r--   1 nishan users  ...   file.txt
#  ↑↑↑↑↑↑↑↑↑
#  ┃└┬┘└┬┘└┬┘
#  ┃ owner│ │
#  ┃     group│
#  ┃        others
#  type (- = file, d = directory)
```

| Symbolic | Numeric | Meaning |
|----------|---------|---------|
| `chmod u+x file` | — | give owner execute |
| `chmod 644 file` | 644 | owner: rw, group: r, others: r |
| `chmod 755 file` | 755 | owner: rwx, group/others: rx |
| `chmod 600 file` | 600 | owner: rw, no one else |

### Ownership (`chown`)

```bash
sudo chown user:group file        # change owner and group
sudo chown nishan secret.txt      # change owner only
```

### Other protections

- `chattr +i file` — make a file **immutable** (can't be deleted/modified, even by root)
- `umask` — sets default permissions for new files
- `sudo` — run a command with root privileges

---

## How to Monitor System Activity

| Command | What it shows |
|---------|--------------|
| `ps aux` | Snapshot of all running processes |
| `top` / `htop` | Live view of processes, CPU, memory |
| `who` / `w` | Who's logged in |
| `last` | Login history |
| `uptime` | How long the system has been up |
| `dmesg` | Kernel ring buffer messages (hardware/driver events) |
| `journalctl` | systemd logs |
| `tail -f /var/log/auth.log` | Live view of authentication logs |
| `tail -f /var/log/syslog` | Live view of system logs |

---

## How to Identify and Terminate Malicious Processes

```bash
ps aux                  # list everything
ps aux | grep suspicious   # search by name
top                     # see CPU/RAM hogs in real time
pgrep -l name           # find PID by name
kill PID                # gentle stop (SIGTERM)
kill -9 PID             # force kill (SIGKILL)
pkill -f pattern        # kill by command-line pattern
```

---

## How to Monitor Network Traffic

### `netstat` (older) and `ss` (newer, faster)

| Command | Purpose |
|---------|---------|
| `netstat -tulnp` | List listening TCP/UDP ports + the program |
| `ss -tulnp` | Same as above, but faster (modern replacement) |
| `ss -tan` | All TCP connections |
| `netstat -an` | All connections (any state) |

**Flags explained:**
- `t` = TCP
- `u` = UDP
- `l` = listening
- `n` = numeric (no DNS resolution)
- `p` = show process

---

## Network Analysis Tools

### `nmap` — Network Scanner

Used to scan networks for hosts, open ports, and services.

```bash
nmap 192.168.1.1              # scan one host
nmap 192.168.1.0/24           # scan whole subnet
nmap -sV 192.168.1.1          # detect service versions
nmap -O 192.168.1.1           # detect OS
nmap -p 22,80,443 target      # scan specific ports
nmap -sS target               # stealth SYN scan (needs root)
```

### `tcpdump` — Packet Sniffer

Captures and analyzes network packets in real time.

```bash
sudo tcpdump -i eth0          # capture on interface eth0
sudo tcpdump -i any port 80   # only HTTP traffic
sudo tcpdump -w capture.pcap  # save to file
sudo tcpdump host 192.168.1.1 # only traffic to/from a host
```

### `lynis` — Security Auditing Tool

Audits the entire system and reports security issues.

```bash
sudo lynis audit system       # full system security audit
sudo lynis show details       # detailed view
```

---

## How to Configure and Manage a Firewall

### `ufw` — Uncomplicated Firewall (beginner-friendly)

```bash
sudo ufw enable               # turn firewall on
sudo ufw disable              # turn it off
sudo ufw status               # see current rules
sudo ufw allow 22             # allow SSH
sudo ufw allow 80/tcp         # allow HTTP on TCP only
sudo ufw deny 23              # block telnet
sudo ufw delete allow 22      # remove a rule
```

### `iptables` — Powerful, low-level firewall

```bash
sudo iptables -L                                  # list rules
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT  # allow SSH
sudo iptables -A INPUT -p tcp --dport 23 -j DROP    # block telnet
sudo iptables -F                                  # flush all rules (careful!)
```

**Common policies:**
- `ACCEPT` — allow the packet
- `DROP` — silently discard
- `REJECT` — discard but tell sender

---

## How to Securely Transfer Files (SCP)

`scp` = **Secure Copy** (uses SSH under the hood)

```bash
# copy local → remote
scp file.txt user@192.168.1.10:/home/user/

# copy remote → local
scp user@192.168.1.10:/home/user/file.txt .

# copy a whole directory (-r)
scp -r mydir/ user@192.168.1.10:/home/user/

# use a specific port
scp -P 2222 file.txt user@host:/path/
```

---

## Quick Tool Reference

| Tool | Category | Purpose |
|------|----------|---------|
| `ps`, `kill`, `pgrep`, `pkill` | Process | Find & kill processes |
| `netstat`, `ss` | Network | View open ports / connections |
| `nmap` | Network | Scan hosts and ports |
| `tcpdump` | Network | Capture packets |
| `lynis` | Audit | Security scan of the system |
| `ufw`, `iptables` | Firewall | Manage firewall rules |
| `scp` | Transfer | Securely copy files |
| `chmod`, `chown` | Permissions | Protect files |

---
