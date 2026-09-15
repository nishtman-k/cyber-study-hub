# AD Directory Enumeration (Hands-On)

> **⚠️ AUTHORIZED USE ONLY.** For education and authorized testing only. These commands query a live domain controller and read its directory. Run them only against a lab you built or a domain explicitly in scope for an authorized engagement. See the [Legal and Terms of Use](/legal) page.

> "The directory tells you everything, if you know which door to knock on."

**Scope:** Enumerating an Active Directory domain through its different query channels: anonymous and authenticated LDAP with `ldapsearch`, bulk enumeration with NetExec and CrackMapExec, RPC with `rpcclient`, graph collection with BloodHound, and advanced LDAP filters that target specific account configurations. The theme is that the same directory looks different through each protocol, and thorough enumeration means checking all of them. Builds on **AD Fundamentals**, and complements **AD Enumeration and Credential Abuse**, which covers what to _do_ with what you find here.

**Recommended background:** the AD Fundamentals sheet (LDAP, DN, DC, `userAccountControl`) and a Linux shell.

## Table of Contents

- [Why Enumerate Four Ways](#why-enumerate-four-ways)
- [Setup](#setup)
- [Anonymous LDAP](#anonymous-ldap)
- [Authenticated ldapsearch](#authenticated-ldapsearch)
- [LDAP Filter Syntax](#ldap-filter-syntax)
- [userAccountControl Filters](#useraccountcontrol-filters)
- [Reading Attributes That Matter](#reading-attributes-that-matter)
- [Bulk Enumeration with NetExec](#bulk-enumeration-with-netexec)
- [RPC Enumeration with rpcclient](#rpc-enumeration-with-rpcclient)
- [Graph Collection with BloodHound](#graph-collection-with-bloodhound)
- [Which Protocol Shows What](#which-protocol-shows-what)
- [Lab: The Same Domain Through Four Protocols](#lab-the-same-domain-through-four-protocols)
- [Detection](#detection)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Why Enumerate Four Ways

The single most useful idea in this sheet: **the same directory data is reachable through several protocols, and each one exposes things the others hide.** An attribute invisible to a default LDAP query may appear in RPC output, or surface in BloodHound's property collection, or only show up when you write a precise filter for it.

A thorough enumeration is not "run one tool". It is running LDAP, RPC, and a graph collector and comparing what each returns, because a misconfiguration or a hidden value tends to reveal itself in exactly one of them.

| Channel           | Tool                  | Strength                                                           |
| ----------------- | --------------------- | ------------------------------------------------------------------ |
| **LDAP**          | `ldapsearch`          | Raw, precise, filterable; the reference channel                    |
| **LDAP at scale** | NetExec, CrackMapExec | All users and attributes at once, fast anomaly spotting            |
| **RPC**           | `rpcclient`           | A different interface; some fields LDAP does not return by default |
| **Graph**         | BloodHound            | Every object and property collected together, plus relationships   |

The Fundamentals sheet established _why_ this works: any authenticated user, and sometimes an anonymous one, can read most of the directory. This sheet is the practical how, and the discipline of not stopping at the first tool.

## 2. Setup

```bash
# LDAP client
sudo apt install ldap-utils          # provides ldapsearch

# RPC client
sudo apt install samba-common-bin    # provides rpcclient

# bulk enumeration
pipx install netexec                 # nxc, the maintained CrackMapExec successor

# BloodHound collector and GUI
pipx install bloodhound-ce           # python collector
# the GUI is a separate download, see the BloodHound section
```

**Two things that break AD tooling, from the Enumeration sheet, worth repeating because they cause most failures:**

```bash
# 1. resolve domain names through the DC
echo "nameserver <DC_IP>" | sudo tee /etc/resolv.conf

# 2. sync your clock to the DC, or Kerberos rejects your tickets
sudo ntpdate <DC_IP>
```

Set variables once:

```bash
export DC=10.0.0.10
export DOMAIN=corp.local
export BASE="DC=corp,DC=local"          # the base DN, derived from the domain
export USER=student
export PASS='Str0ngPass!2026'
```

The base DN is just the domain name rewritten: `corp.local` becomes `DC=corp,DC=local`. You will pass it to nearly every LDAP command.

## 3. Anonymous LDAP

Some domain controllers permit **anonymous binding**, connecting with no credentials, usually left on for a legacy application. When present, it hands a large amount of directory data to an unauthenticated attacker. Always check for it first.

```bash
# what naming contexts exist? this works even when little else does
ldapsearch -x -H ldap://$DC -s base namingcontexts

# attempt a full anonymous query of user objects
ldapsearch -x -H ldap://$DC -b "$BASE" "(objectClass=user)"

# anonymous, but ask for specific attributes
ldapsearch -x -H ldap://$DC -b "$BASE" "(objectClass=user)" sAMAccountName description
```

| Flag           | Meaning                                         |
| -------------- | ----------------------------------------------- |
| `-x`           | Simple authentication                           |
| `-H`           | The LDAP server URL                             |
| `-b`           | Base DN, where to start                         |
| `-s base`      | Search only the base object itself, not below   |
| no `-D` / `-w` | The absence of these is what makes it anonymous |

**The key detail: leaving off `-D` and `-w` is the anonymous bind.** `-D` is the bind identity and `-w` its password. Omit both and you are connecting as nobody.

**What to read when it works:** the `description` field first, always. Administrators drop passwords, onboarding notes, and reminders there, and an anonymous read of descriptions across every user is a common quick win. After that, look for any attribute holding unexpected text, since a value stored where it does not belong is exactly the kind of thing that stands out.

If anonymous binding is disabled, you get an error like `inappropriate authentication`, and you move to authenticated queries with any valid account.

## 4. Authenticated ldapsearch

With any domain account, the full directory opens. The command gains `-D` (who you are) and `-w` (your password).

```bash
ldapsearch -x -H ldap://$DC \
  -D "$USER@$DOMAIN" -w "$PASS" \
  -b "$BASE" \
  "(objectClass=user)" sAMAccountName
```

Read it as: authenticate as `$USER`, start at the base DN, match all user objects, return just their account names.

**Requesting all attributes** for a specific object, which is how you find hidden values:

```bash
# every attribute of one user, no attribute list means "all"
ldapsearch -x -H ldap://$DC -D "$USER@$DOMAIN" -w "$PASS" \
  -b "$BASE" "(sAMAccountName=jsmith)"
```

Leaving off the trailing attribute names returns **everything** the directory holds on that object. That is the move when you suspect a value is tucked into a non-standard attribute: pull all of them and read.

**LDAPS**, the TLS version on port 636, when plaintext is blocked:

```bash
ldapsearch -x -H ldaps://$DC:636 -D "$USER@$DOMAIN" -w "$PASS" -b "$BASE" "(objectClass=user)"
```

## 5. LDAP Filter Syntax

Filters are how you ask a precise question, and precision is what separates useful enumeration from a wall of output. From the Fundamentals sheet, filters use prefix notation, the operator before its operands.

```text
(sAMAccountName=jsmith)                         one exact account
(objectClass=user)                              all users
(cn=*admin*)                                    wildcard, cn containing "admin"
(&(objectClass=user)(department=Finance))       AND: users in Finance
(|(cn=admin)(cn=administrator))                 OR: either name
(!(objectClass=computer))                       NOT: everything except computers
(&(objectClass=user)(!(memberOf=*)))            users in no groups
```

| Operator | Meaning                             |
| -------- | ----------------------------------- |
| `&`      | AND, all conditions must match      |
| `\|`     | OR, any condition                   |
| `!`      | NOT, negate                         |
| `=`      | Equals                              |
| `*`      | Wildcard, or "attribute is present" |

**`(attribute=*)` means "this attribute exists"**, which is one of the most useful patterns:

```bash
# every account that has ANY description set
ldapsearch -x -H ldap://$DC -D "$USER@$DOMAIN" -w "$PASS" \
  -b "$BASE" "(&(objectClass=user)(description=*))" sAMAccountName description
```

That filter returns only users who have a description, cutting a thousand accounts down to the handful worth reading.

## 6. userAccountControl Filters

`userAccountControl` (UAC) is a single attribute holding many account flags packed into bits: disabled, locked, pre-auth setting, password-never-expires, and more. Filtering on individual bits is how you find specific dangerous configurations, This is the advanced-filter technique worth mastering.

The bitwise match uses a special rule identifier:

```text
(userAccountControl:1.2.840.113556.1.4.803:=FLAG)
```

`1.2.840.113556.1.4.803` is the **"bitwise AND"** matching rule. It tests whether the given bit is set. You do not memorize the number, you recognize the pattern and change the flag value.

The flags worth knowing:

| Flag value | Meaning                         | Why it matters                             |
| ---------- | ------------------------------- | ------------------------------------------ |
| `2`        | Account disabled                | Filter these out to see only live accounts |
| `16`       | Locked out                      | Currently locked                           |
| `65536`    | Password never expires          | Often old, weak, set-and-forgotten         |
| `524288`   | Trusted for delegation          | Delegation abuse target                    |
| `4194304`  | Pre-authentication not required | **AS-REP Roasting target**                 |

```bash
# accounts with pre-auth disabled: the AS-REP roastable accounts
ldapsearch -x -H ldap://$DC -D "$USER@$DOMAIN" -w "$PASS" \
  -b "$BASE" "(userAccountControl:1.2.840.113556.1.4.803:=4194304)" \
  sAMAccountName userAccountControl

# password-never-expires accounts
ldapsearch -x -H ldap://$DC -D "$USER@$DOMAIN" -w "$PASS" \
  -b "$BASE" "(userAccountControl:1.2.840.113556.1.4.803:=65536)" sAMAccountName

# enabled users only: NOT disabled
ldapsearch -x -H ldap://$DC -D "$USER@$DOMAIN" -w "$PASS" \
  -b "$BASE" "(&(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))" sAMAccountName
```

Combine the pre-auth filter with an all-attributes request to find anything hidden on a roastable account:

```bash
# every attribute of every pre-auth-disabled account
ldapsearch -x -H ldap://$DC -D "$USER@$DOMAIN" -w "$PASS" \
  -b "$BASE" "(userAccountControl:1.2.840.113556.1.4.803:=4194304)"
```

**Finding Kerberoastable accounts** uses a plain attribute-presence filter instead, since an SPN is just an attribute:

```bash
ldapsearch -x -H ldap://$DC -D "$USER@$DOMAIN" -w "$PASS" \
  -b "$BASE" "(&(objectClass=user)(servicePrincipalName=*))" sAMAccountName servicePrincipalName
```

## 7. Reading Attributes That Matter

Enumeration is only useful if you know what to look at. These are the attributes worth reading, and why.

| Attribute                     | Holds                           | Why you read it                                 |
| ----------------------------- | ------------------------------- | ----------------------------------------------- |
| `sAMAccountName`              | The login name                  | The account's identity                          |
| `description`                 | Free text                       | Passwords and notes administrators leave        |
| `memberOf`                    | Group memberships               | Privilege, and nesting toward admin             |
| `userAccountControl`          | Account flags                   | Disabled, pre-auth, delegation                  |
| `servicePrincipalName`        | Registered services             | Kerberoastable if set on a user                 |
| `pwdLastSet`                  | Last password change            | Old value means stale, likely weak              |
| `lastLogon`                   | Last logon time                 | Dormant accounts, less monitored                |
| `adminCount`                  | 1 if in a protected admin group | Marks currently or formerly privileged accounts |
| `info` / `comment`            | More free text                  | Another place secrets hide                      |
| `scriptPath`, `homeDirectory` | Paths                           | Internal servers and share names                |

**The non-obvious ones people miss:** beyond `description`, the `info` (sometimes shown as `comment` or "Notes" in the GUI) attribute is a second free-text field that is just as likely to hold a secret and is not returned by default. When a value seems to be hidden somewhere, requesting **all** attributes and scanning them is how you find it, because it will be sitting in a field nobody thinks to query.

```bash
# pull the free-text fields specifically
ldapsearch -x -H ldap://$DC -D "$USER@$DOMAIN" -w "$PASS" \
  -b "$BASE" "(objectClass=user)" sAMAccountName description info comment
```

## 8. Bulk Enumeration with NetExec

`ldapsearch` queries what you ask for. NetExec (and its predecessor CrackMapExec) enumerates **everything at once**, which is far faster for spotting an anomaly across the whole domain. The command is `nxc`; the older `crackmapexec` / `cme` works the same way.

```bash
# all users, with descriptions inline
nxc ldap $DC -u $USER -p $PASS --users

# all groups
nxc ldap $DC -u $USER -p $PASS --groups

# find AS-REP roastable accounts (pre-auth disabled)
nxc ldap $DC -u $USER -p $PASS --asreproast asrep.txt

# find Kerberoastable accounts (SPN set)
nxc ldap $DC -u $USER -p $PASS --kerberoasting kerb.txt

# accounts where password never expires
nxc ldap $DC -u $USER -p $PASS --password-not-required
```

**Why `--users` matters for finding hidden data:** it prints every user with the common attributes including `description` in one pass. Scrolling that output, or grepping it, is how you spot the one account with something unusual stored where the other thousand have nothing.

```bash
# dump all users, then hunt for anything odd in the output
nxc ldap $DC -u $USER -p $PASS --users | tee allusers.txt
grep -iE 'flag|pass|pwd|secret|key' allusers.txt
```

NetExec also carries **LDAP modules** for specific checks:

```bash
nxc ldap $DC -u $USER -p $PASS -M get-desc-users     # pull all descriptions
nxc ldap $DC -u $USER -p $PASS -M user-desc          # same idea, module varies by version
nxc ldap $DC -u $USER -p $PASS -M laps               # read LAPS passwords if permitted
```

The point of the bulk tools is **scale for anomaly detection**: one command returns the whole domain, and the outlier stands out against the uniform rest.

## 9. RPC Enumeration with rpcclient

RPC is a **completely different interface** to the same directory, and this is the practical payoff of Section 1: `rpcclient` returns some fields that a default LDAP query does not, so it is worth running even after LDAP.

Connect, often with a null session:

```bash
# null session, no credentials
rpcclient -U "" -N $DC

# with credentials
rpcclient -U "$DOMAIN/$USER%$PASS" $DC
```

Once at the `rpcclient $>` prompt, the enumeration commands:

```text
enumdomusers              list all domain users, with their RIDs
enumdomgroups             list all groups
querydispinfo             user info including the description field
queryuser 0x457           full detail on one user, by RID
querygroup 0x200          detail on one group
getdompwinfo              the domain password policy
lsaenumsid                enumerate SIDs
lookupnames Administrator resolve a name to its SID
```

`enumdomusers` gives you every account and its RID:

```text
user:[Administrator] rid:[0x1f4]
user:[jsmith] rid:[0x457]
```

Then `queryuser` on a RID dumps that account's full detail, which sometimes includes fields not surfaced elsewhere:

```text
rpcclient $> queryuser 0x457
```

**The reason RPC finds things LDAP misses:** it is a separate protocol implemented separately, so the two do not return an identical view. `querydispinfo` in particular returns the description for every user in one command, and `queryuser` on a specific RID can show account detail formatted differently from LDAP. When a value is hidden, the protocol that surfaces it is often not the one you tried first.

Run it non-interactively with `-c`:

```bash
rpcclient -U "" -N $DC -c "enumdomusers"
rpcclient -U "" -N $DC -c "querydispinfo"
```

## 10. Graph Collection with BloodHound

BloodHound collects **every object and every property at once** into a graph, then lets you query relationships. Its full attack-path analysis is covered in its own sheet; here the relevant point is that its collection phase is itself a thorough enumeration, and it gathers object properties that ad-hoc queries miss.

Collect with the Python ingestor, from Kali:

```bash
pipx install bloodhound-ce      # or: pip install bloodhound

bloodhound-python -u $USER -p "$PASS" -d $DOMAIN -dc $DC -c All -ns $DC
```

| Flag        | Meaning                               |
| ----------- | ------------------------------------- |
| `-u` / `-p` | Credentials                           |
| `-d`        | Domain                                |
| `-dc`       | Domain controller                     |
| `-c All`    | Collection methods: gather everything |
| `-ns`       | Name server, point DNS at the DC      |

This produces a set of JSON files (or a ZIP), which you import into the BloodHound GUI.

**Why it surfaces hidden properties:** `-c All` collects the full property set of every object, not just the attributes a person would think to query. In the GUI, selecting any node shows its properties, and a value tucked into an unusual attribute appears there alongside the standard ones. Collecting the whole graph and then browsing an object's properties is a different way of finding the same hidden data, one that does not require guessing which attribute to ask for.

The GUI's node properties, the raw Cypher query console, and the search all expose collected attributes. Even without doing path analysis, the collection is a complete directory snapshot you can search offline.

## 11. Which Protocol Shows What

The summary that ties the sheet together. When something is hidden, this is where to look next.

| You want                             | Best channel          | Command                                          |
| ------------------------------------ | --------------------- | ------------------------------------------------ |
| A precise, filtered query            | LDAP                  | `ldapsearch` with a filter                       |
| All users and descriptions fast      | LDAP bulk             | `nxc ldap --users`                               |
| A specific account's every attribute | LDAP                  | `ldapsearch "(sAMAccountName=x)"` (no attr list) |
| Fields LDAP omits by default         | RPC                   | `rpcclient` `queryuser`, `querydispinfo`         |
| Everything collected and searchable  | Graph                 | `bloodhound-python -c All`                       |
| AS-REP roastable accounts            | LDAP filter           | UAC bitwise `:=4194304`                          |
| Kerberoastable accounts              | LDAP filter           | `(servicePrincipalName=*)`                       |
| Enumeration with no credentials      | LDAP anon or RPC null | `ldapsearch -x` / `rpcclient -N`                 |

**The working method:** start with LDAP because it is precise. If you suspect something is hidden and LDAP's defaults do not show it, request all attributes. If that still does not surface it, try RPC, which returns a different field set. And collect with BloodHound to get everything at once and search it. A value that hides from one channel rarely hides from all four.

## 12. Lab: The Same Domain Through Four Protocols

**What you are doing:** enumerating one lab domain through anonymous LDAP, authenticated LDAP with a targeted filter, RPC, and BloodHound, and seeing how each reveals something the others do not. **Targets the Windows Server DC you built for the AD series.**

**Time:** about 40 minutes. **Prerequisites:** the AD lab (Kali plus a Windows Server DC), and the `student` account.

### Step 1: Prepare Kali

```bash
export DC=<your DC IP>
export DOMAIN=corp.local           # your lab's actual domain
export BASE="DC=corp,DC=local"     # rewritten from the domain
export USER=student
export PASS='Str0ngPass!2026'

echo "nameserver $DC" | sudo tee /etc/resolv.conf
sudo ntpdate $DC
```

### Step 2: Try anonymous LDAP first

```bash
# does the DC allow anonymous binding?
ldapsearch -x -H ldap://$DC -s base namingcontexts

# if it does, read descriptions with no credentials
ldapsearch -x -H ldap://$DC -b "$BASE" "(objectClass=user)" sAMAccountName description
```

Expected: either the naming contexts and some user data (anonymous allowed), or `inappropriate authentication` (disabled). Both are findings, note which.

### Step 3: Bulk-enumerate with NetExec and scan for anomalies

```bash
nxc ldap $DC -u $USER -p $PASS --users | tee allusers.txt

# scan every field for anything that stands out
grep -iE 'flag|pass|pwd|secret|key|admin' allusers.txt
```

Expected: a full user list, and any account with unusual text in a field stands out against the uniform rest. This is the "spot the outlier at scale" technique from Section 8.

### Step 4: Pull one suspicious account's every attribute

```bash
# replace jsmith with whichever account looked unusual
ldapsearch -x -H ldap://$DC -D "$USER@$DOMAIN" -w "$PASS" \
  -b "$BASE" "(sAMAccountName=jsmith)"
```

Requesting no attribute list returns everything. Read the free-text fields, `description`, `info`, `comment`, closely.

### Step 5: Target roastable accounts with a UAC filter

```bash
ldapsearch -x -H ldap://$DC -D "$USER@$DOMAIN" -w "$PASS" \
  -b "$BASE" "(userAccountControl:1.2.840.113556.1.4.803:=4194304)"
```

Expected: the pre-auth-disabled accounts, with all attributes. A value hidden on one of these only appears with this precise filter, which is the point of the advanced-filter technique.

### Step 6: Cross-check with RPC

```bash
# null session first
rpcclient -U "" -N $DC -c "enumdomusers"

# descriptions for every user, via RPC
rpcclient -U "" -N $DC -c "querydispinfo"

# with creds, full detail on one user by RID
rpcclient -U "$DOMAIN/$USER%$PASS" $DC -c "queryuser 0x457"
```

Expected: the user list again, but possibly with a field RPC returns that your LDAP query did not. Compare the RPC output against Step 4.

### Step 7: Collect everything with BloodHound

```bash
bloodhound-python -u $USER -p "$PASS" -d $DOMAIN -dc $DC -c All -ns $DC
ls *.json
```

Expected: JSON files for users, groups, computers, and more. Import them into the BloodHound GUI, select a user node, and read its properties. A value in an unusual property appears here alongside the standard ones.

### Step 8: Compare what each channel showed

Line up the four results. The lesson of the whole sheet is that they are not identical: anonymous LDAP, authenticated LDAP, RPC, and BloodHound each surfaced a slightly different view of the same domain, and a thorough enumeration used all of them rather than stopping at the first.

### Cleanup

```bash
rm -f allusers.txt *.json asrep.txt kerb.txt
```

## 13. Detection

Directory enumeration is quiet, but not silent. The defensive view, per good practice.

| Activity                  | Signal                                                           |
| ------------------------- | ---------------------------------------------------------------- |
| **Anonymous LDAP bind**   | An unauthenticated LDAP session, which should not normally occur |
| **Bulk LDAP queries**     | One account pulling the entire directory in a short window       |
| **RPC null session**      | An anonymous SMB/RPC session (event 4624 with anonymous logon)   |
| **BloodHound collection** | A burst of LDAP and SAMR queries touching every object at once   |
| **UAC bitwise filters**   | Rare, targeted queries for pre-auth or delegation flags          |

**Why it is hard to catch:** every one of these is a legitimate operation that applications also perform, so detection relies on **volume and context**, one account reading the whole directory, rather than on the query itself being forbidden.

**The fixes:**

| Weakness                          | Fix                                                                |
| --------------------------------- | ------------------------------------------------------------------ |
| Anonymous LDAP enabled            | Disable anonymous binding on the DC                                |
| Null-session RPC                  | Restrict anonymous access via policy                               |
| Secrets in `description` / `info` | Audit and clear free-text attributes; never store passwords there  |
| Broad read access                 | It is largely by design, so monitor volume rather than block reads |

## 14. Fast Recall

- **The same directory is reachable through several protocols, and each hides different things.** Thorough enumeration checks LDAP, RPC, and a graph collector, not just one.
- **Fix DNS and time first**, or Kerberos-based tooling fails.
- **The base DN is the domain rewritten:** `corp.local` becomes `DC=corp,DC=local`.
- **Anonymous LDAP** is leaving off `-D` and `-w`. Check for it first; when enabled it leaks the directory with no credentials.
- **Always read `description` and `info`.** Administrators store passwords in free-text fields, and they are not returned by default.
- **Requesting no attribute list returns every attribute** of an object, which is how you find a value hidden in an unusual field.
- **LDAP filters are prefix notation:** `(&(a)(b))` AND, `(|(a)(b))` OR, `(!(a))` NOT, `(attr=*)` means the attribute exists.
- **`userAccountControl` bitwise filter:** `(userAccountControl:1.2.840.113556.1.4.803:=4194304)` finds AS-REP-roastable (pre-auth-disabled) accounts. `65536` is password-never-expires, `2` is disabled.
- **Kerberoastable accounts** are found with `(servicePrincipalName=*)`, a plain presence filter.
- **NetExec `nxc ldap --users`** dumps every user and description at once, for spotting the one anomaly at scale.
- **`rpcclient`** is a different interface: `enumdomusers`, `querydispinfo`, `queryuser <RID>`. It returns fields LDAP omits, and a null session (`-N`) often works.
- **`bloodhound-python -c All`** collects every object's full property set into a searchable graph, surfacing hidden properties without guessing the attribute.
- **When a value hides from one channel, try another.** LDAP defaults, then all-attributes, then RPC, then BloodHound.
- **Detection is by volume and context**, since each query is individually legitimate. Anonymous binds and one account reading the whole directory are the signals.

## 15. Resources

**Tools**

- [ldapsearch (OpenLDAP)](https://www.openldap.org/software/man.cgi?query=ldapsearch)
- [NetExec](https://github.com/Pennyw0rth/NetExec)
- [rpcclient (Samba)](https://www.samba.org/samba/docs/current/man-html/rpcclient.1.html)
- [BloodHound Community Edition](https://github.com/SpecterOps/BloodHound)
- [bloodhound-python collector](https://github.com/dirkjanm/BloodHound.py)

**LDAP and UAC reference**

- [Microsoft: userAccountControl flags](https://learn.microsoft.com/en-us/troubleshoot/windows-server/active-directory/useraccountcontrol-manipulate-account-properties)
- [Microsoft: LDAP matching rules (bitwise)](https://learn.microsoft.com/en-us/windows/win32/adsi/search-filter-syntax)
- [LDAP filter syntax (RFC 4515)](https://datatracker.ietf.org/doc/html/rfc4515)

**Technique references**

- [The Hacker Recipes: AD enumeration](https://www.thehacker.recipes/ad/recon/)
- [HackTricks: AD enumeration](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology)

**Related sheets**

- Active Directory Fundamentals, for the concepts and LDAP basics
- Active Directory Enumeration and Credential Abuse, for the attacks that use this data
- Active Directory Attack Path Analysis, for BloodHound in depth

**Practice**

- [GOAD: Game of Active Directory](https://github.com/Orange-Cyberdefense/GOAD)
- [TryHackMe](https://tryhackme.com/)
