# Mandatory Access Control (MAC), SELinux & AppArmor

---

## 1. Access Control Models Overview

Before diving into MAC, let's see how it compares to the other major access control models.

| Model | Full name | How it works | Example |
|-------|-----------|--------------|---------|
| **DAC** | Discretionary Access Control | Owner of a file decides who can access it (the standard `rwx` permissions) | `chmod 644 file` |
| **MAC** | **Mandatory Access Control** | The **system** (via policies) decides — not the user, not even root can override | SELinux, AppArmor |
| **RBAC** | Role-Based Access Control | Permissions assigned to **roles**, users assigned to roles | Database admin, regular user |
| **ABAC** | Attribute-Based Access Control | Decisions based on **attributes** (user, resource, environment, time) | "Allow if user.department = HR AND time < 18:00" |

**Key insight:** Standard Linux uses DAC by default (rwx permissions). MAC adds an **additional, stricter layer** on top — even if DAC allows access, MAC can still deny it.

---

## 2. What is MAC (Mandatory Access Control)?

**Mandatory Access Control** is a security model where access decisions are **enforced by the system based on predefined policies** — not by the file owner.

### Key characteristics

- **Centralized policy** — admins/security teams define rules, not individual users
- **Non-discretionary** — users (including root!) **cannot override** the policy
- **Label-based** — every process and resource gets a security label
- **Default-deny** — anything not explicitly allowed is denied

### MAC vs DAC — practical difference

```bash
# DAC (standard Linux): You own the file → you control it
chmod 777 myfile.txt    # you decide

# MAC: The system has the final say, regardless of DAC
# Even with chmod 777, MAC can still block access if the policy says so
```

### Why MAC matters

- Limits damage if a process is **compromised** (e.g., hacked Apache can't read `/etc/shadow` even if it tries)
- Enforces **least privilege** at the OS level
- Critical for **multi-tenant servers**, government systems, and security-sensitive environments

---

## 3. The Two Main MAC Systems on Linux

| | **SELinux** | **AppArmor** |
|---|-------------|--------------|
| **Origin** | NSA (yes, that NSA) | Immunix → Novell → Canonical |
| **Default on** | RHEL, CentOS, Fedora, Rocky | Ubuntu, Debian, openSUSE |
| **Approach** | **Label-based** (labels every file, process) | **Path-based** (rules tied to file paths) |
| **Complexity** | Powerful but harder to learn | Simpler, more user-friendly |
| **Granularity** | Very fine-grained (per-process, per-file, per-port) | Coarser-grained but easier to write |
| **Config file** | `/etc/selinux/config` | `/etc/apparmor.d/` |
| **Logs** | `/var/log/audit/audit.log` | `/var/log/syslog` or `dmesg` |

**Mental model:**
- **SELinux** = like having a passport sticker on every file and process; access is decided by checking labels
- **AppArmor** = like having a list of "this program can only touch these paths"

---

## 4. The Concept of Policy

A **policy** is the **rulebook** that defines what's allowed in a MAC system.

### What a policy contains

- **Subjects** — who's acting (a user, a process)
- **Objects** — what's being acted upon (a file, port, socket)
- **Actions** — what's being done (read, write, execute, connect)
- **Conditions/Labels** — the security context that determines if it's allowed

### Example mental policy

> "The web server process (`httpd`) is **only allowed** to:
> - Read files labeled `httpd_sys_content_t`
> - Write to files labeled `httpd_log_t`
> - Bind to TCP port 80
> 
> Everything else → **denied**."

### Why policies matter

Without them, MAC is just labels. The **policy** is what gives MAC its power.

---

## 5. How SELinux Works

### The label/context system

Every **process, file, port, and resource** gets a 4-part security context:

```
user:role:type:level
 ↑    ↑    ↑    ↑
 │    │    │    └── Sensitivity (for MLS — Multi-Level Security)
 │    │    └────── Type (the most important part)
 │    └──────────── Role (used in RBAC)
 └───────────────── SELinux user (different from Linux user)
```

**Example contexts:**

```bash
# File context
system_u:object_r:httpd_sys_content_t:s0
                  ↑
                  Type — tells SELinux it's web content

# Process context
system_u:system_r:httpd_t:s0
                  ↑
                  Type — tells SELinux it's a web server
```

### View contexts

```bash
ls -Z /var/www/html/index.html
# system_u:object_r:httpd_sys_content_t:s0 index.html

ps -eZ | grep httpd
# system_u:system_r:httpd_t:s0 1234 ? 00:00:01 httpd

id -Z
# unconfined_u:unconfined_r:unconfined_t:s0    (your shell's context)
```

### Type Enforcement (TE) — the heart of SELinux

The **most-used** SELinux feature. Rules say which **process types** can access which **file types**.

**Example rule:** `httpd_t` (web server type) can read files of type `httpd_sys_content_t` (web content type).

If `httpd_t` tries to read a file with type `etc_t` (system config) → **denied**, no matter what DAC says.

### Role-Based Access Control (RBAC) in SELinux

Roles connect SELinux users to types they can transition into.

```
SELinux user ─→ Role ─→ Type
```

Less commonly used than TE for everyday tasks, but powerful for separating admin duties.

### Multi-Level Security (MLS)

Classification-based, like military secret levels:

| Level | Example |
|-------|---------|
| `s0` | Unclassified |
| `s1` | Confidential |
| `s2` | Secret |
| `s3` | Top Secret |

Information can only flow **up** (less secret → more secret) by default. Rarely needed outside government/military.

---

## 6. SELinux Modes

SELinux has 3 operating modes:

| Mode | Behavior |
|------|----------|
| **Enforcing** | Policy actively blocks denials. **Production mode.** |
| **Permissive** | Policy logs denials but doesn't block them. **Great for testing.** |
| **Disabled** | SELinux is completely off. Not recommended. |

### Check current status

```bash
getenforce              # quick — prints "Enforcing", "Permissive", or "Disabled"
sestatus                # detailed status report
sestatus -v             # very detailed (includes process contexts)
```

### Change mode (temporary — until reboot)

```bash
sudo setenforce 0       # switch to Permissive
sudo setenforce 1       # switch to Enforcing
```

### Change mode (permanent)

Edit `/etc/selinux/config`:

```bash
sudo nano /etc/selinux/config
```

```ini
SELINUX=enforcing       # enforcing | permissive | disabled
SELINUXTYPE=targeted    # targeted (default) | mls
```

Then reboot for changes to take effect.

---

## 7. Common SELinux Commands

| Command | Purpose |
|---------|---------|
| `getenforce` | Show current mode |
| `setenforce 0/1` | Change mode temporarily |
| `sestatus` | Detailed status |
| `ls -Z` | View file contexts |
| `ps -eZ` | View process contexts |
| `id -Z` | View your shell's context |
| `chcon` | Change file context (temporary) |
| `restorecon` | Restore default file context |
| `semanage` | Manage policy (permanent changes) |
| `setsebool` | Toggle SELinux booleans |
| `getsebool` | View boolean values |
| `audit2allow` | Generate policy from denials |
| `seinfo` | Show policy info |
| `sealert` | Analyze SELinux alerts |

---

## 8. Setting File Contexts in SELinux

### Temporary change with `chcon`

```bash
# Change the type of a file
sudo chcon -t httpd_sys_content_t /var/www/html/index.html

# Recursive
sudo chcon -R -t httpd_sys_content_t /var/www/html/

# Copy context from another file
sudo chcon --reference=/var/www/html/index.html newfile.html
```

⚠️ **chcon changes don't survive `restorecon`** — for permanent changes, use `semanage`.

### Permanent change with `semanage`

```bash
# Add a permanent rule for a new directory
sudo semanage fcontext -a -t httpd_sys_content_t "/srv/website(/.*)?"

# Apply the rule (relabel)
sudo restorecon -Rv /srv/website
```

### Restore default contexts

```bash
sudo restorecon -v /path/to/file       # restore one file
sudo restorecon -Rv /path/to/dir       # restore recursively
sudo restorecon -RFv /                 # restore entire system (takes time)
```

---

## 9. SELinux Booleans

**Booleans** are on/off switches that toggle policy rules without writing custom policy.

```bash
# View all booleans
getsebool -a

# View specific boolean
getsebool httpd_can_network_connect

# Toggle a boolean (temporary)
sudo setsebool httpd_can_network_connect on

# Toggle permanently (survives reboot)
sudo setsebool -P httpd_can_network_connect on

# Search for booleans related to a service
semanage boolean -l | grep httpd
```

**Common booleans for web servers:**

| Boolean | What it does |
|---------|-------------|
| `httpd_can_network_connect` | Apache can connect to external services |
| `httpd_enable_homedirs` | Serve user home directories |
| `httpd_can_sendmail` | Apache can send mail |

---

## 10. `semanage` — The Policy Management Swiss Army Knife

`semanage` makes **permanent** changes to SELinux policy.

### Common uses

```bash
# Manage file contexts
sudo semanage fcontext -a -t httpd_sys_content_t "/srv/web(/.*)?"
sudo semanage fcontext -l                                # list rules
sudo semanage fcontext -d "/srv/web(/.*)?"               # delete rule

# Manage ports
sudo semanage port -a -t http_port_t -p tcp 8080         # allow Apache on port 8080
sudo semanage port -l | grep http                        # list http-related ports
sudo semanage port -d -t http_port_t -p tcp 8080         # remove rule

# Manage booleans
sudo semanage boolean -m --on httpd_can_network_connect
sudo semanage boolean -l                                 # list all

# Manage SELinux users
sudo semanage user -l                                    # list SELinux users
sudo semanage login -l                                   # map Linux users to SELinux users
```

### Why semanage matters

- Changes persist across reboots
- Survives `restorecon` (unlike `chcon`)
- Tracks rules in `/etc/selinux/targeted/contexts/files/file_contexts.local`

---

## 11. Troubleshooting SELinux

### Common symptom: "It works in Permissive but not Enforcing!"

That means SELinux is blocking something. Here's how to find and fix it.

### Step 1: Check audit logs

```bash
sudo tail -f /var/log/audit/audit.log | grep AVC      # live denial monitor
sudo ausearch -m AVC                                   # search all denials
sudo ausearch -m AVC -ts recent                        # recent only
sudo ausearch -m AVC -ts today                         # today's denials
```

Each denial looks like:

```
type=AVC msg=audit(...): avc:  denied  { read } for  pid=1234 comm="httpd" 
  name="config.conf" scontext=system_u:system_r:httpd_t:s0 
  tcontext=system_u:object_r:etc_t:s0 tclass=file permissive=0
```

| Field | Meaning |
|-------|---------|
| `denied { read }` | What action was blocked |
| `comm="httpd"` | Which process |
| `scontext` | Source context (the process) |
| `tcontext` | Target context (the file) |

### Step 2: Get a human-readable explanation

```bash
sudo sealert -a /var/log/audit/audit.log
sudo journalctl -t setroubleshoot
```

`sealert` will tell you **what was denied** and often **how to fix it**.

### Step 3: Generate a policy fix (if needed)

```bash
sudo ausearch -m AVC -ts recent | audit2allow -M mypolicy
sudo semodule -i mypolicy.pp
```

This creates a custom policy module that allows what was denied. **Use sparingly** — usually a boolean or file context fix is cleaner.

### Step 4: Quick diagnosis flow

```
Something not working?
    ↓
setenforce 0  (switch to permissive)
    ↓
Does it work now?
    ↓ Yes               ↓ No
SELinux is the issue   Not an SELinux problem
    ↓
Check audit log → find the denial → fix it → setenforce 1
```

---

## 12. AppArmor — The Simpler Alternative

AppArmor takes a **path-based** approach — much easier to read and write.

### Check status

```bash
sudo aa-status              # show loaded profiles + their modes
sudo apparmor_status        # alternative
```

Output shows:
- Loaded profiles (and modes)
- Processes in each mode

### AppArmor profile modes

| Mode | What it does |
|------|-------------|
| **Enforce** | Actively blocks violations |
| **Complain** | Logs violations but allows them (like SELinux permissive) |
| **Disable** | Profile not loaded |

### AppArmor profile structure

Profiles live in `/etc/apparmor.d/`. Each profile is a text file.

**Example: `/etc/apparmor.d/usr.sbin.nginx`:**

```
#include <tunables/global>

profile nginx /usr/sbin/nginx {
    #include <abstractions/base>
    #include <abstractions/nis>
    
    capability net_bind_service,
    capability setuid,
    capability setgid,
    
    /var/www/** r,                     # nginx can read web files
    /var/log/nginx/*.log w,            # nginx can write logs
    /etc/nginx/** r,                   # nginx can read its config
    /usr/sbin/nginx mr,
    
    deny /home/** rwx,                 # explicit deny on home dirs
}
```

**Notation:**
- `r` = read, `w` = write, `x` = execute
- `**` = anything recursively
- `*` = anything in this dir
- `deny` = explicit block

### Manage profiles

```bash
# Put profile in enforce mode
sudo aa-enforce /etc/apparmor.d/usr.sbin.nginx

# Put profile in complain mode (testing)
sudo aa-complain /etc/apparmor.d/usr.sbin.nginx

# Disable a profile
sudo aa-disable /etc/apparmor.d/usr.sbin.nginx

# Reload a profile after editing
sudo apparmor_parser -r /etc/apparmor.d/usr.sbin.nginx

# Reload ALL profiles
sudo systemctl reload apparmor

# Generate a profile interactively
sudo aa-genprof /path/to/program
```

### Troubleshooting AppArmor

```bash
# Watch live denials
sudo tail -f /var/log/syslog | grep apparmor
sudo tail -f /var/log/kern.log | grep apparmor

# Search dmesg
sudo dmesg | grep -i apparmor

# Use complain mode for testing
sudo aa-complain /etc/apparmor.d/<profile>
```

---

## 13. SELinux vs AppArmor — When to Use Which

| Use case | Recommendation |
|----------|---------------|
| RHEL/CentOS/Fedora server | **SELinux** (it's the default, deeply integrated) |
| Ubuntu/Debian desktop or server | **AppArmor** (default, simpler) |
| Multi-tenant cloud / government / high-security | **SELinux** (more granular) |
| Single-purpose service hardening | **AppArmor** (faster to set up) |
| Learning security concepts | Start with **AppArmor**, then SELinux |

---

## 14. Least Privilege in MAC

**Principle of least privilege:** every process should have **only the permissions it needs to do its job**, and nothing more.

### How MAC enforces it

Standard Linux DAC often runs services with way more access than needed (especially root daemons). MAC fixes this by:

1. **Confining each service** to its own profile/policy
2. **Default-denying** anything not explicitly allowed
3. **Isolating compromised processes** — if attackers break in, they can't escape the profile

### Real example: Apache web server

Without MAC: a hacked Apache process running as root could read `/etc/shadow`, modify any file, etc.

With MAC (SELinux `httpd_t` or AppArmor nginx profile): even a fully compromised Apache can only touch web content, logs, and ports it's explicitly allowed to use. Everything else → denied.

---

## 15. Audit Logs in MAC Systems

Audit logs are the **forensic record** of every security event. Critical for:

- Investigating breaches
- Debugging policy issues
- Compliance (HIPAA, PCI-DSS, etc.)

### SELinux audit logs

**Location:** `/var/log/audit/audit.log`

```bash
# View raw log
sudo less /var/log/audit/audit.log

# Search for denials
sudo ausearch -m AVC

# Search by time
sudo ausearch -m AVC -ts today
sudo ausearch -m AVC -ts "10:00:00" -te "11:00:00"

# Generate human-readable report
sudo aureport
sudo aureport -a                # AVC events
sudo aureport -f                # file access events
```

### AppArmor audit logs

**Location:** `/var/log/syslog`, `/var/log/audit/audit.log`, or `dmesg`

```bash
sudo tail -f /var/log/syslog | grep apparmor
sudo journalctl _TRANSPORT=audit | grep apparmor
```

### Why audit logs matter

- **Detect intrusions** — denials may reveal an attacker probing the system
- **Compliance** — required by many security standards
- **Policy refinement** — see what your apps actually need

---

## 16. Linux Capabilities — Splitting Root's Powers

Traditionally, processes were either:
- **Root** (UID 0) — could do absolutely anything
- **Non-root** — limited

**Capabilities** break root's power into ~40 smaller pieces, so a process can have just the privileges it needs.

### Common capabilities

| Capability | What it grants |
|------------|---------------|
| `CAP_NET_BIND_SERVICE` | Bind to ports below 1024 (without being root) |
| `CAP_NET_RAW` | Use raw sockets (for `ping`, packet sniffers) |
| `CAP_SYS_ADMIN` | The "almost root" capability — many admin tasks |
| `CAP_DAC_OVERRIDE` | Bypass file permission checks |
| `CAP_CHOWN` | Change file ownership |
| `CAP_KILL` | Send signals to any process |
| `CAP_SETUID` / `CAP_SETGID` | Change UIDs/GIDs |
| `CAP_SYS_PTRACE` | Trace any process (used by debuggers) |

### Commands

```bash
# View a process's capabilities
getpcaps <PID>

# View a file's capabilities (effective on execution)
getcap /usr/bin/ping

# Set a capability on a binary
sudo setcap cap_net_raw+ep /usr/local/bin/myping

# Remove all capabilities from a binary
sudo setcap -r /usr/local/bin/myping

# Find all files with capabilities
sudo getcap -r / 2>/dev/null
```

### Real example: replacing SUID with capabilities

Old way: `ping` was SUID root (security risk)
New way: `ping` has `cap_net_raw` capability (just enough to send raw packets)

```bash
getcap /usr/bin/ping
# /usr/bin/ping = cap_net_raw+ep
```

Much safer than full root.

---

## 17. Quick Reference Tables

### Mode commands

| System | Check status | Change to enforcing | Change to permissive |
|--------|-------------|--------------------|--------------------|
| **SELinux** | `getenforce` | `sudo setenforce 1` | `sudo setenforce 0` |
| **AppArmor** | `sudo aa-status` | `sudo aa-enforce <profile>` | `sudo aa-complain <profile>` |

### Context/profile commands

| Task | SELinux | AppArmor |
|------|---------|----------|
| View labels | `ls -Z`, `ps -eZ` | (path-based, no labels) |
| Modify temporarily | `chcon` | `aa-complain` |
| Modify permanently | `semanage fcontext` | edit profile + `apparmor_parser -r` |
| Restore defaults | `restorecon` | reload from `/etc/apparmor.d/` |
| Manage policy | `semanage`, `setsebool` | edit profiles in `/etc/apparmor.d/` |

### Log locations

| System | Main log |
|--------|----------|
| SELinux | `/var/log/audit/audit.log` |
| AppArmor | `/var/log/syslog`, `dmesg`, or `/var/log/audit/audit.log` |

### "I think MAC is blocking me" cheat flow

```
1. sudo setenforce 0   (or aa-complain <profile>)
2. Test if it works now
3. If yes:  check audit log → identify denial → fix it
4. sudo setenforce 1   (or aa-enforce <profile>)
```

---

## 18. Real-World Scenarios

### Scenario 1: Web server can't serve files from a custom directory

```bash
# SELinux is blocking httpd from reading /srv/website
sudo semanage fcontext -a -t httpd_sys_content_t "/srv/website(/.*)?"
sudo restorecon -Rv /srv/website
```

### Scenario 2: Apache needs to listen on a non-standard port

```bash
sudo semanage port -a -t http_port_t -p tcp 8888
```

### Scenario 3: Find why a service keeps failing under SELinux

```bash
sudo setenforce 0          # confirm SELinux is the cause
# test the service — if it works, SELinux is blocking
sudo ausearch -m AVC -ts recent      # find the denial
sudo sealert -a /var/log/audit/audit.log    # get explanation
```

### Scenario 4: Custom AppArmor profile for a new app

```bash
sudo aa-genprof /usr/local/bin/myapp     # interactive profile generation
# Run the app and exercise its features
# aa-genprof learns what it needs and writes a profile
sudo aa-enforce /etc/apparmor.d/usr.local.bin.myapp
```

### Scenario 5: Allow a binary to bind to port 80 without being root

```bash
sudo setcap cap_net_bind_service+ep /path/to/binary
# Now it can bind to port 80 even when run as a regular user
```
