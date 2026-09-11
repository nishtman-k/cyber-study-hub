# Active Directory Fundamentals

> **⚠️ AUTHORIZED USE ONLY.** This material explains how Active Directory works and why it is targeted. Apply it only to environments you own or are authorized to assess. See the [Legal and Terms of Use](/legal) page.

> "Active Directory is the backbone of identity in most organizations, which is exactly why it is the first thing an attacker goes looking for."

**Scope:** The concepts and vocabulary of Active Directory: what it is, authentication versus authorization, the domain and forest structure, domain controllers, users and groups, Group Policy, trusts, and LDAP. Conceptual groundwork for the enumeration and attack material that follows.

## Table of Contents
- [What Active Directory Is](#what-active-directory-is)
- [Authentication and Authorization](#authentication-and-authorization)
- [The Structure](#the-structure)
- [Domains](#domains)
- [Domain Controllers](#domain-controllers)
- [Trees, Forests, and Trusts](#trees-forests-and-trusts)
- [Objects: Users, Groups, Computers](#objects-users-groups-computers)
- [Groups and How Permissions Accumulate](#groups-and-how-permissions-accumulate)
- [Organizational Units](#organizational-units)
- [Group Policy Objects](#group-policy-objects)
- [LDAP](#ldap)
- [How a Logon Actually Works](#how-a-logon-actually-works)
- [Why Attackers Target Active Directory](#why-attackers-target-active-directory)
- [Terminology Reference](#terminology-reference)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. What Active Directory Is

**Active Directory (AD)** is Microsoft's directory service. It is a central database that stores information about everything in a Windows network, and the set of services that let computers and users query and use that information.

Think of a company with 5,000 employees and 3,000 computers. Without AD, every machine would hold its own list of users and passwords, and changing someone's password would mean touching every machine they use. AD solves that by holding **one** authoritative record of every user, computer, group, and printer, and letting every machine in the network consult it.

**What it actually does:**

| Function | Meaning |
|----------|---------|
| **Stores identities** | One record per user, computer, group, and resource |
| **Authenticates** | Confirms who someone is when they log on |
| **Authorizes** | Decides what they are allowed to reach |
| **Applies configuration** | Pushes settings and policy to machines centrally |
| **Organizes** | Groups objects logically so they can be managed at scale |

**Why it dominates:** Active Directory is used by the large majority of enterprises worldwide. That ubiquity is exactly why it matters in security. A single system that holds every identity and grants every permission is the most valuable target in the network, and compromising it usually means compromising the organization.

## 2. Authentication and Authorization

Two words that get used interchangeably and mean completely different things. Getting this distinction right is foundational, because most AD attacks exploit a failure in one or the other.

| | **Authentication** | **Authorization** |
|---|-------------------|-------------------|
| **Question** | Who are you? | What are you allowed to do? |
| **When** | At logon | On every access attempt afterwards |
| **Proves** | Identity | Permission |
| **Example** | Entering your password | Being allowed to open the finance folder |
| **Failure looks like** | Login rejected | "Access denied" |

**The order matters.** Authentication happens first and once; authorization happens continuously. You log on in the morning (authentication), and then every file you open, every share you reach, every printer you use is an authorization decision made against the identity you proved earlier.

**A plain analogy:** authentication is showing your ID at the door of an office building. Authorization is which floors your badge opens once you are inside. Proving who you are does not tell the building what you may reach.

In Active Directory:

- **Authentication** is handled by **Kerberos** (the modern default) or **NTLM** (older, still present).
- **Authorization** is handled by **access control lists** on objects, which check your identity and group memberships.

**Why attackers care:** these are two separate doors. An attacker who steals a password defeats authentication. An attacker who exploits a misconfigured permission defeats authorization without ever needing a password. Both routes end in the same place.

## 3. The Structure

Active Directory is hierarchical. Everything sits inside something larger.

```text
Forest                    the outermost security boundary
└── Domain                an administrative and replication unit
    └── OU                Organizational Unit, a container for organizing
        └── Objects       users, computers, groups, printers
```

A fuller picture of a real environment:

```text
Forest: corp.local
│
├── Domain: corp.local                    (the root domain)
│   ├── OU: Finance
│   │   ├── User:     jsmith
│   │   ├── Computer: FIN-WS-01
│   │   └── Group:    Finance-Staff
│   ├── OU: IT
│   │   ├── User:     admin.dave
│   │   └── Computer: IT-WS-04
│   └── Domain Controllers
│       ├── DC01
│       └── DC02
│
└── Domain: eu.corp.local                 (a child domain)
    └── OU: Sales
```

Read it from the inside out: **objects** live in **OUs**, OUs live in a **domain**, domains live in a **forest**.

| Level | What it is | Purpose |
|-------|-----------|---------|
| **Forest** | One or more domains sharing a schema and configuration | The **security boundary** |
| **Domain** | A group of objects sharing a database and policy | Administration and replication |
| **OU** | A container inside a domain | Organizing objects, applying policy |
| **Object** | A user, computer, group, printer | The actual thing being managed |

**The critical point for security: the forest is the security boundary, not the domain.** People often assume separate domains means separate security. It does not. Domains within a forest trust each other, so compromising one domain in a forest frequently leads to compromising the whole forest. Genuine isolation requires a separate forest.

## 4. Domains

A **domain** is a logical grouping of objects that share a common directory database, security policy, and namespace.

Everything in a domain shares:

| Shared thing | Meaning |
|--------------|---------|
| **A directory database** | One copy of the objects, replicated between its domain controllers |
| **Security policies** | Password rules, lockout thresholds, Kerberos settings |
| **A namespace** | A DNS name such as `corp.local` |
| **Authentication** | Any domain controller in the domain can authenticate any of its users |

Domain names look like DNS names, because AD depends on DNS:

```text
corp.local              a domain
eu.corp.local           a child domain of corp.local
marketing.eu.corp.local a child of that
```

**Why an organization uses more than one domain:** geographic separation with different policies, regulatory requirements, or a merger where two directories were joined. Each domain sets its own password policy, which is often the practical reason.

**The `domain\user` format** you see everywhere is a reference to this:

```text
CORP\jsmith                 the NetBIOS form
jsmith@corp.local           the UPN (User Principal Name) form
```

Both identify the same account. You will meet both, and tools differ in which they expect.

## 5. Domain Controllers

A **domain controller (DC)** is a server running Active Directory Domain Services. It holds a copy of the directory database and answers authentication and directory requests.

**What a DC does:**

| Job | Detail |
|-----|--------|
| **Stores the directory** | A copy of `NTDS.dit`, the database of every object in the domain |
| **Authenticates** | Validates logons via Kerberos or NTLM |
| **Replicates** | Syncs changes with the other DCs in the domain |
| **Runs DNS** | Usually, since AD depends on DNS to find services |
| **Applies Group Policy** | Serves GPOs to machines that request them |

**Domains have more than one DC** for redundancy. If one fails, others continue authenticating users. Changes made on any DC replicate to the others, typically within minutes.

### Why domain controllers are the crown jewel

`NTDS.dit` contains the **password hashes of every account in the domain**, including every administrator. An attacker who reads that file, or who gains code execution on a DC, effectively owns the entire domain.

This is why DCs are classed as **Tier 0** assets and get the strictest controls: administered only from dedicated secure workstations, never used for general-purpose work, and monitored more closely than anything else in the environment.

**In practice:** every AD attack path you will study ends at a domain controller. That is the objective, and everything before it is a route toward it.

## 6. Trees, Forests, and Trusts

### Trees

A **tree** is a set of domains sharing a contiguous DNS namespace:

```text
corp.local
├── eu.corp.local
└── us.corp.local
```

All three share the `corp.local` name, so they form one tree.

### Forests

A **forest** is one or more trees. Domains in a forest share:

- A common **schema**, the definition of what object types exist and what attributes they have
- A common **global catalog**, an index for searching across the whole forest
- **Automatic two-way trusts** between all domains in it

```text
Forest: corp.local
├── Tree: corp.local
│   ├── eu.corp.local
│   └── us.corp.local
└── Tree: acquired-company.com          (different namespace, same forest)
```

### Trusts

A **trust** is a relationship that lets users in one domain access resources in another.

| Type | Meaning |
|------|---------|
| **Two-way** | Both domains trust each other |
| **One-way** | A trusts B, but B does not trust A |
| **Transitive** | Trust flows onward: if A trusts B and B trusts C, A trusts C |
| **Non-transitive** | Trust stops at the two domains involved |
| **Parent-child** | Automatic, two-way, transitive, between a domain and its child |
| **External** | Manually created to a domain in another forest, non-transitive |

**Within a forest, all trusts are automatic, two-way, and transitive.** That is convenient administratively and significant for security: a user in any domain of the forest can potentially be granted access in any other.

**Why trusts matter to an attacker:** a trust is a path. Compromising a low-value domain that is trusted by a high-value one can provide a route into the high-value one. Mapping trust relationships is therefore a standard early step in an internal engagement, and it is the reason "the forest is the security boundary" is worth remembering.

## 7. Objects: Users, Groups, Computers

Everything in AD is an **object**, and every object has **attributes**.

| Object type | Represents | Common attributes |
|-------------|-----------|-------------------|
| **User** | A person's account | `sAMAccountName`, `userPrincipalName`, `memberOf`, `description` |
| **Computer** | A machine joined to the domain | `dNSHostName`, `operatingSystem`, `servicePrincipalName` |
| **Group** | A collection of other objects | `member`, `groupType` |
| **OU** | A container | `name`, linked GPOs |
| **GPO** | A policy object | settings, links |

Every object also has a **unique identifier**:

```text
SID  (Security Identifier)   S-1-5-21-1234567890-...-1103
GUID (Globally Unique ID)    a unique value that never changes
DN   (Distinguished Name)    CN=jsmith,OU=Finance,DC=corp,DC=local
```

**The Distinguished Name is worth reading carefully**, because it appears constantly in LDAP queries and tool output:

```text
CN=jsmith,OU=Finance,DC=corp,DC=local
│         │          │
│         │          └── Domain Component: corp.local
│         └───────────── Organizational Unit: Finance
└─────────────────────── Common Name: the object itself
```

Read it right to left and it is a path from the domain down to the object.

**Where attackers look in attributes:** the `description` field is a notorious one, because administrators sometimes write passwords or hints into it, and every authenticated user can read it by default.

## 8. Groups and How Permissions Accumulate

Permissions are rarely assigned to individual users. They are assigned to **groups**, and users inherit them through membership.

### Group scope

| Scope | Can contain | Can be granted access |
|-------|-------------|----------------------|
| **Domain Local** | Accounts from any domain in the forest | Only in its own domain |
| **Global** | Accounts from its own domain only | Anywhere in the forest |
| **Universal** | Accounts from any domain in the forest | Anywhere in the forest |

### Group type

- **Security groups** grant permissions. These are the ones that matter for access control.
- **Distribution groups** are for email only and grant nothing.

### The groups worth knowing by name

These are the high-value memberships an attacker looks for immediately:

| Group | Power |
|-------|-------|
| **Domain Admins** | Full control of the domain |
| **Enterprise Admins** | Full control of the entire forest |
| **Schema Admins** | Can modify the AD schema |
| **Administrators** | Full control of the local machine or DC |
| **Account Operators** | Can create and modify most accounts |
| **Backup Operators** | Can read any file, including `NTDS.dit`, by backup right |
| **Server Operators** | Can manage services on domain controllers |
| **DnsAdmins** | Historically a path to code execution on a DC |

**Nested groups are where things go wrong.** A group can contain another group, which contains another. A user three levels deep inherits everything from all of them, and nobody notices because no single membership list looks alarming.

```text
jsmith
  └── member of: Finance-Staff
        └── member of: Finance-Managers
              └── member of: Server Operators      ← effective privilege
```

Looking at `jsmith` shows one harmless-looking group. The effective privilege is administrative. **This is precisely why attack path analysis tools exist**, and it is the subject of the BloodHound material later in this series.

## 9. Organizational Units

An **Organizational Unit (OU)** is a container inside a domain used to organize objects.

Two reasons they exist:

1. **Applying Group Policy.** A GPO is linked to an OU, and applies to everything inside it. This is the main reason.
2. **Delegating administration.** You can grant someone rights over one OU without making them a domain admin.

```text
corp.local
├── OU=Finance
│   ├── OU=Finance-Users
│   └── OU=Finance-Computers
├── OU=IT
└── OU=Servers
```

**OUs are not security boundaries.** They organize and they receive policy, but putting an object in an OU does not isolate it. Only a forest is a true security boundary.

**Why delegation matters to an attacker:** delegated rights over an OU mean the ability to modify objects in it, and modifying a user object can mean resetting its password. A delegation intended as a convenience for a helpdesk can be a privilege escalation path.

## 10. Group Policy Objects

A **Group Policy Object (GPO)** is a collection of settings applied to users and computers automatically. It is how an organization enforces configuration at scale, without touching machines individually.

**What a GPO can control:**

| Category | Examples |
|----------|----------|
| **Security** | Password policy, account lockout, audit settings |
| **Software** | Install or remove applications |
| **Scripts** | Run at startup, shutdown, logon, logoff |
| **Restrictions** | Block Control Panel, restrict USB, set the desktop |
| **Firewall** | Rules pushed to every machine |
| **Certificates** | Trusted roots and auto-enrollment |

### How GPOs apply: LSDOU

Policies apply in a fixed order, and **later policies override earlier ones** where they conflict:

```text
Local        set on the machine itself
  ↓
Site         based on the AD site
  ↓
Domain       applies to the whole domain
  ↓
OU           applies to the OU, and wins conflicts because it is last
```

The mnemonic is **LSDOU**. Because OU-level policy applies last, a targeted OU policy can refine or override a broad domain policy.

### Why GPOs are a security concern

A GPO's reach is its danger. **A GPO that runs a script can run that script on every machine it is linked to.**

If an attacker can modify a GPO linked to a broad OU, or link a new one, they can execute code on every machine in scope at once. This is a favoured technique in human-operated ransomware: gain control of AD, then use the organization's own management infrastructure to distribute the payload everywhere simultaneously.

**The defensive consequence:** who can edit GPOs is as sensitive as who is a domain admin, and GPO changes belong on the monitoring list. Write access to a GPO is effectively code execution on everything it touches.

## 11. LDAP

**LDAP (Lightweight Directory Access Protocol)** is the protocol used to query and modify a directory. Active Directory is a directory service; LDAP is how you talk to it.

| | |
|---|---|
| **Full name** | Lightweight Directory Access Protocol |
| **Port** | 389 (plaintext), 636 (LDAPS, over TLS) |
| **Also** | 3268 and 3269 for the Global Catalog |
| **Used for** | Searching, reading, and modifying directory objects |

**The relationship in one line: Active Directory is the database, LDAP is the query language and protocol for reaching it.** Similar to how a database is the storage and SQL is how you ask it questions.

### How an LDAP query is structured

```text
ldap://dc01.corp.local:389
Base DN:  DC=corp,DC=local            where to start searching
Scope:    subtree                      how deep to search
Filter:   (objectClass=user)           what to match
Attributes: sAMAccountName, memberOf   what to return
```

### Filter syntax

LDAP filters use prefix notation, with the operator before its operands:

```text
(objectClass=user)                          all users
(&(objectClass=user)(department=Finance))   users AND in Finance
(|(cn=admin)(cn=administrator))             cn is admin OR administrator
(!(objectClass=computer))                   NOT computers
(sAMAccountName=jsmith)                     one specific account
(cn=*admin*)                                wildcard match
```

| Operator | Meaning |
|----------|---------|
| `&` | AND |
| `\|` | OR |
| `!` | NOT |
| `=` | Equals |
| `*` | Wildcard |

### Why this matters for security

**LDAP is the primary enumeration channel in Active Directory.** By default, **any authenticated domain user can query most of the directory**. That is by design, since applications and users need to look things up, but it means a single low-privileged account is enough to read the structure of the entire domain: every user, every group, every computer, every OU, and most attributes.

That single fact is the foundation of AD enumeration, and it is why the next sheets in this series exist. The queries, the tooling, and the attack paths all build on LDAP access that ordinary users already have.

**Anonymous binding**, connecting without credentials, is disabled by default on modern AD, but is worth checking during an assessment because it is occasionally re-enabled for a legacy application.

## 12. How a Logon Actually Works

Tying the concepts together with what happens when someone types their password.

```text
[1] User enters credentials on a domain-joined workstation
      ↓
[2] The workstation contacts a Domain Controller
      ↓
[3] Kerberos authentication: the DC verifies the credentials
      ↓
[4] The DC issues a Ticket Granting Ticket (TGT)
      ↓
[5] The user's group memberships are included in the ticket
      ↓
[6] To reach a resource, the user presents the TGT and requests a service ticket
      ↓
[7] The resource checks the ticket's groups against its own permissions
      ↓
[8] Access granted or denied
```

Steps 1 to 4 are **authentication**. Steps 6 to 8 are **authorization**. The TGT is the proof of identity carried around after logon, which is why stealing tickets is such a significant attack technique.

**NTLM** is the older mechanism, still enabled in most environments for compatibility. It is weaker than Kerberos and is the basis of several well-known attacks, which is why hardening guidance pushes toward Kerberos-only where possible.

## 13. Why Attackers Target Active Directory

Pulling the thread through everything above.

| Reason | Detail |
|--------|--------|
| **It holds every identity** | One system, every user and every credential |
| **It grants every permission** | Compromising it grants access to everything it controls |
| **Everything trusts it** | Domain-joined machines accept what AD tells them |
| **It is complex** | Nested groups, delegations, and GPOs create paths nobody intended |
| **It is readable by default** | Any authenticated user can enumerate most of the directory over LDAP |
| **It is everywhere** | The same skills apply to almost every enterprise |

**The typical progression**, which the rest of this series covers in depth:

```text
Initial access          a phished user or an exposed service
      ↓
Enumeration             read the directory over LDAP as that user
      ↓
Find a path             nested groups, delegations, weak permissions
      ↓
Escalate                move from a normal user to a privileged one
      ↓
Domain Controller       reach NTDS.dit and the whole domain falls
```

Notice that **enumeration comes immediately after initial access**, and it works with the permissions an ordinary user already has. That is the direct consequence of Section 11, and it is why understanding LDAP and the object model matters before any tool is introduced.

## 14. Terminology Reference

| Term | Meaning |
|------|---------|
| **AD DS** | Active Directory Domain Services, the role that makes a server a DC |
| **DC** | Domain Controller, a server holding the directory |
| **Domain** | A group of objects sharing a database, policy, and namespace |
| **Tree** | Domains sharing a contiguous namespace |
| **Forest** | One or more trees, the **security boundary** |
| **OU** | Organizational Unit, a container for organizing and applying policy |
| **GPO** | Group Policy Object, a set of settings applied automatically |
| **LDAP** | The protocol for querying the directory, port 389 or 636 |
| **Kerberos** | The default authentication protocol, ticket-based |
| **NTLM** | The older authentication protocol, weaker, still present |
| **TGT** | Ticket Granting Ticket, proof of identity after logon |
| **SID** | Security Identifier, a unique ID for a security principal |
| **DN** | Distinguished Name, the full path to an object |
| **CN** | Common Name, an object's name component |
| **SPN** | Service Principal Name, identifies a service for Kerberos |
| **NTDS.dit** | The database file on a DC containing every account and hash |
| **Global Catalog** | A forest-wide searchable index |
| **Schema** | The definition of object types and attributes |
| **Trust** | A relationship letting one domain's users access another's resources |
| **Tier 0** | The most privileged assets: DCs, domain admins |

## 15. Fast Recall

- **Active Directory** is Microsoft's directory service: one central database of users, computers, and groups, plus the services to authenticate and authorize them.
- **Authentication is "who are you", authorization is "what may you access".** Authentication happens once at logon; authorization happens on every access.
- **Structure, outermost first:** Forest → Domain → OU → Objects.
- **The forest is the security boundary, not the domain.** Domains in a forest trust each other automatically, so one compromised domain often means the whole forest.
- **A domain** shares one directory database, one security policy, and one DNS namespace.
- **A Domain Controller** holds the directory, authenticates users, and replicates changes. It runs DNS too, usually.
- **`NTDS.dit` on a DC holds every account's password hash**, which is why DCs are Tier 0 and why every attack path ends there.
- **Trusts are paths.** Within a forest they are automatic, two-way, and transitive.
- **Permissions come through groups**, and groups nest. A user three levels deep inherits everything, which is how unintended admin access happens.
- **High-value groups:** Domain Admins, Enterprise Admins, Backup Operators (can read NTDS.dit), Account Operators, DnsAdmins.
- **OUs organize and receive policy but are not security boundaries.**
- **GPOs apply in LSDOU order:** Local, Site, Domain, OU. OU applies last and wins conflicts.
- **A GPO that runs a script runs it everywhere it is linked**, which is why GPO write access is effectively mass code execution.
- **LDAP is how you query AD.** Port 389, or 636 for LDAPS. AD is the database, LDAP is the protocol.
- **LDAP filters are prefix notation:** `(&(objectClass=user)(department=Finance))`. `&` AND, `|` OR, `!` NOT.
- **Any authenticated domain user can read most of the directory by default.** That single fact is the foundation of AD enumeration.
- **A Distinguished Name reads right to left:** `CN=jsmith,OU=Finance,DC=corp,DC=local`.
- **Kerberos issues a TGT at logon** that carries your group memberships. NTLM is the older, weaker alternative still present for compatibility.

## 16. Resources

**Microsoft documentation**
- [Active Directory Domain Services overview](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview)
- [AD DS architecture and structure](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/understanding-active-directory-site-topology)
- [Group Policy overview](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2012-r2-and-2012/hh831791(v=ws.11))
- [Best practices for securing Active Directory](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/security-best-practices/best-practices-for-securing-active-directory)
- [Securing privileged access and the tier model](https://learn.microsoft.com/en-us/security/privileged-access-workstations/overview)

**Protocols**
- [LDAP overview (RFC 4511)](https://datatracker.ietf.org/doc/html/rfc4511)
- [Kerberos authentication overview](https://learn.microsoft.com/en-us/windows-server/security/kerberos/kerberos-authentication-overview)

**Security guidance**
- [CISA: Detecting and mitigating Active Directory compromises](https://www.cisa.gov/resources-tools/resources/detecting-and-mitigating-active-directory-compromises)
- [MITRE ATT&CK: Domain Trust Discovery (T1482)](https://attack.mitre.org/techniques/T1482/)

**Building a practice lab**
- [Microsoft Evaluation Center (Windows Server trial)](https://www.microsoft.com/en-us/evalcenter/evaluate-windows-server-2022)
- [GOAD: Game of Active Directory (vulnerable AD lab)](https://github.com/Orange-Cyberdefense/GOAD)
- [TryHackMe: Active Directory paths](https://tryhackme.com/)

**Later in this series**
- Active Directory Enumeration and Credential Abuse
- Active Directory LDAP
- Active Directory Attack Path Analysis (BloodHound and PowerView)
