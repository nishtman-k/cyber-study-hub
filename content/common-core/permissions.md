# Linux Permissions, Ownership & Special Bits

---

## 1. The Three User-Based Permission Groups

Every file and directory in Linux has permissions defined for **three categories of users**:

| Group | Symbol | Who it represents |
|-------|--------|-------------------|
| **User (Owner)** | `u` | The person who owns the file (usually the creator) |
| **Group** | `g` | A group of users who share access (e.g., `developers`, `staff`) |
| **Others** | `o` | Everyone else on the system |
| **All** | `a` | All three above (shorthand for `ugo`) |

**Why this matters:** Linux is multi-user. By splitting permissions into 3 groups, you can give different access levels to different people. Example: a config file readable by you, your team, but not the public.

---

## 2. Reading File Permissions

```bash
ls -l file.txt
# -rw-r--r-- 1 nishan staff 256 May 9 10:15 file.txt
```

**The 10-character permission string broken down:**

```
- rw- r-- r--
│  │   │   │
│  │   │   └── others    (read only)
│  │   └────── group     (read only)
│  └────────── owner     (read + write)
└──────────── file type  (- = file, d = dir, l = link)
```

**The other columns:**

| Column | Meaning |
|--------|---------|
| `1` | Number of hard links |
| `nishan` | Owner |
| `staff` | Group |
| `256` | Size in bytes |
| `May 9 10:15` | Last modified |
| `file.txt` | Filename |

---

## 3. Permission Types

Three actions can be performed on a file/directory:

| Symbol | Numeric | On a **file** | On a **directory** |
|--------|---------|---------------|-------------------|
| `r` | 4 | Read content | List contents (`ls`) |
| `w` | 2 | Modify/delete content | Add/delete files inside |
| `x` | 1 | Execute as program | Enter the directory (`cd`) |
| `-` | 0 | No permission | No permission |

**Important nuance for directories:**
- `r` without `x` → can list filenames but can't see file details
- `x` without `r` → can `cd` in if you know the filename, but can't list it
- You usually want `r` and `x` together on directories

---

## 4. `chmod` — Change Permissions

### Symbolic mode (operators)

| Operator | Meaning |
|----------|---------|
| `+` | Add permission |
| `-` | Remove permission |
| `=` | Set exact permission |

```bash
chmod u+x script.sh        # add execute for owner
chmod g-w file             # remove write from group
chmod o=r file             # set others to read only
chmod a+x script.sh        # add execute for all (a = all)
chmod ug+rw file           # owner + group can read/write
chmod o-rwx secret.txt     # remove ALL permissions from others
```

### Numeric (octal) mode

Each digit represents one permission group, calculated as: `r(4) + w(2) + x(1)`.

| Octal | Permissions | What it allows |
|-------|------------|----------------|
| `0` | `---` | Nothing |
| `1` | `--x` | Execute only |
| `2` | `-w-` | Write only |
| `3` | `-wx` | Write + execute |
| `4` | `r--` | Read only |
| `5` | `r-x` | Read + execute |
| `6` | `rw-` | Read + write |
| `7` | `rwx` | Full access |

```bash
chmod 644 file.txt         # rw-r--r-- (typical file)
chmod 755 script.sh        # rwxr-xr-x (typical executable)
chmod 700 ~/.ssh           # rwx------ (only you)
chmod 600 ~/.ssh/id_rsa    # rw------- (private SSH key)
chmod 444 readme.md        # r--r--r-- (read-only for everyone)
chmod 777 file             # rwxrwxrwx ⚠️ DANGEROUS — anyone can do anything
```

### Recursive mode

```bash
chmod -R 755 mydir/         # apply to directory + all contents
```

⚠️ **Be careful:** `chmod -R 777` on a directory tree can wreck your system's security.

---

## 5. `chown` — Change Owner

```bash
sudo chown nishan file              # change owner only
sudo chown nishan:hackers file      # change owner AND group
sudo chown :hackers file            # change group only (using chown)
sudo chown -R nishan:nishan dir/    # recursive (whole directory)
```

**Why `sudo`?** Only root can change file ownership.

**Real-world examples:**

```bash
# Transfer a project from one user to another
sudo chown -R newdev:newdev /home/projects/myapp

# Fix ownership after restoring from backup
sudo chown -R www-data:www-data /var/www/html
```

---

## 6. `chgrp` — Change Group Only

Dedicated command for **just** changing the group:

```bash
sudo chgrp developers file.txt
sudo chgrp -R staff /shared/projects/
```

### `chown` vs `chgrp` — The Difference

| Command | What it changes |
|---------|----------------|
| `chown user file` | Owner only |
| `chown user:group file` | Owner **AND** group |
| `chown :group file` | Group only (the `:` form) |
| `chgrp group file` | Group only (cleaner syntax) |

**In short:** `chgrp` is `chown` specialized for groups — both can change groups, but `chgrp` is the dedicated, more readable tool.

---

## 7. Special Permission Bits

Beyond `rwx`, Linux has 3 special permissions that change how files/directories behave.

### SUID — Set User ID (`s` on owner's `x`)

When set on an executable, the program runs **with the owner's privileges**, not the user who launched it.

```bash
ls -l /usr/bin/passwd
# -rwsr-xr-x 1 root root 68208 ... /usr/bin/passwd
#    ↑
#    's' here = SUID set
```

**Why `passwd` needs SUID:** Regular users need to update their passwords in `/etc/shadow` (which is root-only). SUID makes `passwd` run as root just for that operation.

**Set SUID:**

```bash
chmod u+s /path/to/program       # symbolic
chmod 4755 /path/to/program      # numeric (4 = SUID)
```

### SGID — Set Group ID (`s` on group's `x`)

Two different behaviors:

**On a file:** runs with the file's **group** privileges (similar to SUID but for groups).

**On a directory:** new files created inside **inherit the directory's group** (instead of the creator's group). Great for shared team folders.

```bash
chmod g+s /shared/team        # symbolic
chmod 2775 /shared/team       # numeric (2 = SGID)

# Now any file created in /shared/team belongs to the directory's group
```

### Sticky Bit (`t` on others' `x`)

On a directory, only the **file's owner** (or root) can delete files inside — even if others have write permission.

```bash
ls -ld /tmp
# drwxrwxrwt 10 root root 4096 ... /tmp
#          ↑
#          't' = sticky bit
```

**Why `/tmp` uses it:** Anyone can write there, but you can only delete your own files — preventing one user from deleting another's work.

**Set sticky bit:**

```bash
chmod +t /shared/dropbox      # symbolic
chmod 1777 /shared/dropbox    # numeric (1 = sticky)
```

### Numeric summary for special bits

The **4th digit** (leftmost in 4-digit modes) controls special bits:

| Digit | Bit | Meaning |
|-------|-----|---------|
| `4` | SUID | Run as file's owner |
| `2` | SGID | Run as file's group / inherit group |
| `1` | Sticky | Only owner can delete |

```bash
chmod 4755 file       # SUID + rwxr-xr-x
chmod 2775 dir        # SGID + rwxrwxr-x
chmod 1777 dir        # Sticky + rwxrwxrwx
chmod 6755 file       # SUID + SGID + rwxr-xr-x
```

### Find SUID/SGID files (security audit)

```bash
# Find all SUID files
sudo find / -perm -4000 -type f 2>/dev/null

# Find all SGID files
sudo find / -perm -2000 -type f 2>/dev/null

# Find both
sudo find / -perm -6000 -type f 2>/dev/null
```

⚠️ **Security note:** SUID/SGID binaries are **classic privilege escalation targets**. Attackers look for misconfigured SUID files to get root access. Always audit them.

---

## 8. `umask` — Default Permission Mask

`umask` defines the **default permissions** for new files and directories.

### How it works

It's a "subtraction mask" applied to default base permissions:

- **Files** start at `666` (rw-rw-rw-)
- **Directories** start at `777` (rwxrwxrwx)
- The mask **removes** permissions

### Common umask values

| umask | Files become | Directories become | Use case |
|-------|-------------|-------------------|----------|
| `000` | `666` (rw-rw-rw-) | `777` (rwxrwxrwx) | ⚠️ insecure, never use |
| `022` | `644` (rw-r--r--) | `755` (rwxr-xr-x) | Default on most systems |
| `027` | `640` (rw-r-----) | `750` (rwxr-x---) | Good for sensitive servers |
| `077` | `600` (rw-------) | `700` (rwx------) | Maximum privacy |

### Calculating umask

```
File:  666 - 022 = 644 (rw-r--r--)
Dir:   777 - 022 = 755 (rwxr-xr-x)
```

### Commands

```bash
umask                    # show current umask
umask 077                # set umask for current shell session
```

### Make umask permanent

Add to `~/.bashrc` or `/etc/profile`:

```bash
echo "umask 077" >> ~/.bashrc
source ~/.bashrc
```

---

## 9. `sudo` and `su` — Privilege Escalation

### `sudo` — Super User Do

Run a single command as another user (usually root).

```bash
sudo apt update                    # run as root
sudo -u nishan whoami              # run as nishan
sudo -i                            # interactive root shell
sudo !!                            # repeat last command with sudo
```

**Configuration file:** `/etc/sudoers` — never edit directly! Use:

```bash
sudo visudo                        # safe editor for sudoers
```

**See what you can run:**

```bash
sudo -l                            # list YOUR sudo permissions
```

### `su` — Switch User

Become a different user (start their shell).

```bash
su                                 # switch to root (asks root's password)
su -                               # switch to root with their environment
su nishan                          # switch to user 'nishan'
su - nishan                        # full login shell as nishan
```

### `sudo` vs `su` — The Key Difference

| | `sudo` | `su` |
|---|--------|------|
| Asks for **whose** password? | **YOUR** password | **Target user's** password |
| Permission source | `/etc/sudoers` | Knowing the password |
| Audit trail | All actions logged | Less auditable |
| Recommended | ✅ Yes (safer) | ❌ Avoid for root |

**Modern Linux best practice:** disable root login, use `sudo` instead.

---

## 10. Users and Groups

### Identity commands

```bash
whoami                       # current username
id                           # UID, GID, all groups
id nishan                    # info about another user
groups                       # groups YOU belong to
groups nishan                # groups another user belongs to
```

Example output:

```bash
id
# uid=1000(nishan) gid=1000(nishan) groups=1000(nishan),27(sudo),100(users)
```

### Creating users

**`adduser`** (high-level, friendly — Debian/Ubuntu/Kali):

```bash
sudo adduser maroua
# Prompts for password, full name, etc.
# Creates home dir, copies skeleton files, etc.
```

**`useradd`** (low-level, scriptable — works on all Linux):

```bash
sudo useradd -m -s /bin/bash maroua    # create with home dir + bash shell
sudo passwd maroua                      # set password manually
```

| | `adduser` | `useradd` |
|---|----------|----------|
| Type | Friendly script | Raw binary |
| Defaults | Sensible (home, password prompt) | Minimal — you must specify |
| Best for | Manual creation | Scripts, automation |

### Creating groups

**`addgroup`** or **`groupadd`**:

```bash
sudo addgroup developers
sudo groupadd developers          # equivalent
```

### Add user to group

```bash
sudo usermod -aG developers nishan       # add nishan to developers
sudo gpasswd -a nishan developers        # alternative
```

⚠️ **Always use `-a`** (append). Without it, `usermod -G` **replaces** all of the user's groups!

### Remove from group

```bash
sudo gpasswd -d nishan developers        # remove from group
sudo deluser nishan developers           # alternative (Debian/Kali)
```

### Delete users/groups

```bash
sudo userdel nishan                      # delete user
sudo userdel -r nishan                   # delete user AND home directory
sudo groupdel developers                 # delete group
```

---

## 11. Best Practices for File Permissions

### General principles

1. **Principle of least privilege** — grant only the minimum permissions needed.
2. **Avoid `777`** — virtually never necessary; opens severe security holes.
3. **Use groups** for collaboration instead of opening files to "others".
4. **Sensitive files = `600`** — private keys, configs with passwords.
5. **Audit SUID/SGID regularly** — they're privilege escalation targets.
6. **Set a strict umask** for sensitive systems (`077` or `027`).
7. **Use `sudo`, not direct root login**.
8. **Never give world-write on system directories**.

### Sensible defaults

| Resource | Recommended permission |
|----------|----------------------|
| Personal home dir (`~`) | `700` or `750` |
| `~/.ssh/` | `700` |
| `~/.ssh/id_rsa` (private key) | `600` |
| `~/.ssh/id_rsa.pub` (public key) | `644` |
| `~/.ssh/authorized_keys` | `600` |
| Web server files (`/var/www/`) | `755` dirs, `644` files |
| Scripts you wrote | `755` (if shared) or `700` (private) |
| Configuration with secrets | `600` |
| System logs | `640` (root + adm group) |

### Real hardening commands

```bash
# Lock down SSH directory
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub
chmod 600 ~/.ssh/authorized_keys

# Find and fix world-writable files (security risk)
sudo find / -type f -perm -o+w 2>/dev/null
# Review the list, then:
sudo chmod o-w /path/to/file

# Find files with no owner (often signs of intrusion)
sudo find / -nouser -o -nogroup 2>/dev/null
```

---

## 12. Auditing Permission Changes

### Real-time monitoring with `auditd`

```bash
sudo apt install auditd

# Watch a sensitive file for changes
sudo auditctl -w /etc/passwd -p wa -k passwd_changes
sudo auditctl -w /etc/shadow -p wa -k shadow_changes

# View audit logs
sudo ausearch -k passwd_changes
sudo aureport -f                      # file-level report
```

| Flag | Meaning |
|------|---------|
| `-w` | Watch this file/directory |
| `-p wa` | Watch for **w**rite and **a**ttribute changes |
| `-k` | Tag (key) for searching |

### Quick checks without auditd

```bash
# Recent permission/ownership changes (mtime within 1 day)
sudo find /etc -mtime -1 -type f 2>/dev/null

# Recent files modified in critical dirs
sudo find /etc /usr/bin /usr/sbin -mtime -7 -type f 2>/dev/null

# Compare with a known-good baseline
ls -laR /etc > /tmp/etc_now.txt
diff /tmp/etc_baseline.txt /tmp/etc_now.txt
```

### Logs that matter

```bash
sudo grep "chmod\|chown\|chgrp" /var/log/auth.log
sudo journalctl _COMM=sudo            # all sudo invocations
```

---

## 13. Practical Real-World Examples

### Setting up a shared team directory

```bash
# 1. Create a group
sudo groupadd team

# 2. Add users
sudo usermod -aG team alice
sudo usermod -aG team bob

# 3. Create the shared directory
sudo mkdir /srv/teamspace
sudo chown :team /srv/teamspace
sudo chmod 2775 /srv/teamspace      # SGID = files inherit team group

# 4. Set sticky bit so users can't delete each other's files
sudo chmod +t /srv/teamspace
```

### Locking down a config file

```bash
sudo chown root:root /etc/important.conf
sudo chmod 600 /etc/important.conf
sudo chattr +i /etc/important.conf      # also make immutable
```

### Auditing for SUID misuse

```bash
# Get a baseline of all SUID binaries
sudo find / -perm -4000 -type f 2>/dev/null > /root/suid_baseline.txt

# Later — check for new SUIDs (potential backdoors)
sudo find / -perm -4000 -type f 2>/dev/null > /tmp/suid_now.txt
diff /root/suid_baseline.txt /tmp/suid_now.txt
```

### Recover from a chmod disaster

If someone runs `chmod -R 777 /` (the classic mistake):

```bash
# You can usually recover from a backup, or:
# Reset critical system permissions from package manager (Debian/Ubuntu)
sudo dpkg --get-selections | awk '{print $1}' | xargs sudo dpkg --reconfigure
```

(Prevention is better — never run wide chmod without thinking.)

---

## 14. Quick Reference Tables

### Permission cheat table

| Want | Symbolic | Numeric |
|------|----------|---------|
| Read-only file (everyone) | `a=r` | `444` |
| Standard file | `u=rw,go=r` | `644` |
| Standard executable | `u=rwx,go=rx` | `755` |
| Private file | `u=rw,go=` | `600` |
| Private executable | `u=rwx,go=` | `700` |
| Open shared dir (with sticky) | — | `1777` |
| Team shared dir (with SGID) | — | `2775` |
| SUID binary | — | `4755` |

### Command summary

| Command | Purpose |
|---------|---------|
| `chmod` | Change permissions |
| `chown` | Change owner (and optionally group) |
| `chgrp` | Change group only |
| `umask` | View/set default permission mask |
| `id` | Show user identity (UID, GID, groups) |
| `groups` | List groups for a user |
| `whoami` | Show current user |
| `sudo` | Run command as another user (usually root) |
| `su` | Switch to another user's shell |
| `useradd` / `adduser` | Create user |
| `groupadd` / `addgroup` | Create group |
| `usermod -aG` | Add user to a group |
| `passwd` | Change password |
| `find / -perm` | Find files by permission |
| `auditctl` / `ausearch` | Audit file changes |
