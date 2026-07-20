# CVSS Scoring — Reading

> A focused guide to the Common Vulnerability Scoring System: what the number means, how it is built from metrics, and how to read the vector string behind it. This pairs with the Understanding Vulnerabilities sheet, which covers CVE, CWE, and NVD at a higher level.

---

## 1. What is CVSS?

**CVSS** (Common Vulnerability Scoring System) is an open standard for rating how severe a vulnerability is. It produces a single number from **0.0 to 10.0**, where higher means more severe.

The point of CVSS is a **shared, repeatable way to compare vulnerabilities**. Instead of everyone guessing whether a flaw is "bad" or "really bad," CVSS breaks severity into defined metrics, so two people scoring the same vulnerability should land on a similar number.

The score is not pulled from thin air. It is calculated from a set of **metrics**, each describing one property of the vulnerability (how it is reached, how hard it is to exploit, what it damages). Those metrics combine into the final score.

The current standard is **CVSS v3.1**, with **v4.0** now published and slowly being adopted. The ideas below use v3.1, which is still the most common version you will see on NVD.

---

## 2. CVE vs CVSS vs NVD

These three go together constantly, so it helps to keep them straight.

| Term     | What it is                                              | Example                         |
| -------- | ------------------------------------------------------ | ------------------------------- |
| **CVE**  | A unique ID for one specific known vulnerability        | `CVE-2017-0144` (EternalBlue)   |
| **CVSS** | A scoring system that rates how severe that flaw is      | `8.1` / High                    |
| **NVD**  | A database that stores CVEs and adds CVSS scores + detail | The page you read to research it |

The typical flow when you research a vulnerability:

```markdown
1. You find a service and version (e.g. via nmap -sV)
2. You search for a matching CVE
3. You open the CVE on NVD
4. NVD shows you the CVSS score and vector string
5. The score tells you how seriously to treat it
```

So **CVE names it, CVSS scores it, NVD is where you read both.**

---

## 3. The Three Metric Groups

A full CVSS score can be built from three groups of metrics. Most of the time you only deal with the first one.

| Group             | Answers                                              | Changes over time? |
| ----------------- | --------------------------------------------------- | ------------------ |
| **Base**          | How severe is the flaw itself?                      | No — it is fixed   |
| **Temporal**      | How does severity shift as the situation evolves?   | Yes                |
| **Environmental** | How severe is it *in your specific environment*?    | Yes — per org      |

- **Base** is mandatory and is the score you almost always see quoted. It describes the vulnerability's intrinsic qualities, the things that do not change no matter who is affected.
- **Temporal** adjusts for real-world factors like whether a working exploit exists yet, or whether a patch is available.
- **Environmental** lets an organization re-score based on their own setup, for example turning up the score if the affected system holds critical data, or down if it is isolated.

When someone says "it's a 9.8," they almost always mean the **base score**.

---

## 4. Base Metrics in Detail

The base score is built from two sub-groups: **Exploitability** (how the flaw is reached and triggered) and **Impact** (what happens if it works).

### Exploitability metrics

| Metric                        | What it asks                                         | Values                        |
| ----------------------------- | ---------------------------------------------------- | ----------------------------- |
| **Attack Vector (AV)**        | How close must the attacker be?                      | Network, Adjacent, Local, Physical |
| **Attack Complexity (AC)**    | How hard is it to pull off?                          | Low, High                     |
| **Privileges Required (PR)**  | What access does the attacker need first?            | None, Low, High               |
| **User Interaction (UI)**     | Must a victim do something (click, open a file)?     | None, Required                |

The easier and more remote the attack, the higher these push the score. **Attack Vector = Network** with **Privileges Required = None** and **User Interaction = None** is the worst case: anyone on the network can hit it with no help. That combination is why remote, unauthenticated flaws like EternalBlue score so high.

### Impact metrics (the CIA triad)

| Metric                  | What it measures                        | Values             |
| ----------------------- | --------------------------------------- | ------------------ |
| **Confidentiality (C)** | Can the attacker read data they should not? | None, Low, High |
| **Integrity (I)**       | Can the attacker change data?           | None, Low, High    |
| **Availability (A)**    | Can the attacker take the system down?  | None, Low, High    |

These map directly onto the **CIA triad**. A flaw that fully compromises all three (High/High/High) contributes the most impact.

### Scope (S)

One more base metric: **Scope** asks whether the vulnerability can affect resources **beyond** the component it lives in. If exploiting a flaw in one component lets the attacker reach others (Scope = Changed), that raises severity.

---

## 5. Reading a Vector String

Every CVSS score comes with a **vector string**, a compact summary of every metric value. Once you can read it, you understand *why* a score is what it is, not just the number.

Example (this is the real vector for EternalBlue, CVE-2017-0144):

```ini
CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H
```

Decoded piece by piece:

| Part          | Meaning                                    |
| ------------- | ------------------------------------------ |
| `CVSS:3.1`    | Version 3.1                                |
| `AV:N`        | Attack Vector = Network (remote)          |
| `AC:H`        | Attack Complexity = High                   |
| `PR:N`        | Privileges Required = None                 |
| `UI:N`        | User Interaction = None                    |
| `S:U`         | Scope = Unchanged                          |
| `C:H`         | Confidentiality impact = High              |
| `I:H`         | Integrity impact = High                    |
| `A:H`         | Availability impact = High                 |

Reading that string in plain English: *a remote attacker, needing no privileges and no help from a victim, can fully compromise the data and availability of the system, though the attack itself is somewhat complex to execute.* That is a serious flaw, and it scores **8.1 (High)**.

Learning to read the vector is more useful than memorizing scores. The string tells you the story of the attack.

---

## 6. Severity Bands

CVSS turns the 0.0 to 10.0 number into named severity ratings. This is the "score" side of the learning objective.

| Score range   | Severity     |
| ------------- | ------------ |
| **0.0**       | None         |
| **0.1 – 3.9** | Low          |
| **4.0 – 6.9** | Medium       |
| **7.0 – 8.9** | High         |
| **9.0 – 10.0**| Critical     |

Rough rule of thumb for triage:

- **Critical / High** — patch urgently, especially if internet-facing
- **Medium** — schedule a fix, watch for exposure
- **Low** — note it, fix during normal maintenance

But the band alone is not the whole story, which leads to the next two sections.

---

## 7. Temporal and Environmental Metrics

The base score is fixed, but real severity shifts with context. These two optional groups adjust it.

### Temporal metrics (how the situation evolves)

| Metric                       | What it captures                                  |
| ---------------------------- | ------------------------------------------------- |
| **Exploit Code Maturity**    | Does a working, reliable exploit exist yet?       |
| **Remediation Level**        | Is there an official fix, a workaround, or nothing? |
| **Report Confidence**        | How confident are we the flaw is real and detailed? |

A flaw with a public, weaponized exploit and no patch is more dangerous *right now* than the base score alone suggests. Temporal metrics can only **lower or keep** the base score, never raise it above base.

### Environmental metrics (your specific setup)

These let you re-score for your own environment:

- **Modified base metrics** — override any base metric to fit your reality (for example, if the vulnerable system is not reachable from the network in your setup, lower Attack Vector's effect)
- **Security Requirements (CR, IR, AR)** — turn Confidentiality, Integrity, or Availability up or down based on how much each matters for that asset

So the same CVE can be a 9.8 in general but an effective 5.0 in your environment if the box is isolated and holds nothing sensitive, or the reverse if it is your crown-jewel database.

---

## 8. Using CVSS to Prioritize

CVSS is a **prioritization aid**, not a to-do list you follow blindly. Good practice:

```markdown
1. Pull CVSS base scores for all found vulnerabilities
2. Filter to Critical and High first
3. Re-rank by real exposure (is it internet-facing? reachable?)
4. Factor in whether a working exploit exists (temporal)
5. Factor in what the asset is worth (environmental)
6. Patch the ones that are both severe AND exposed AND valuable
```

A Medium-scored flaw on your public login server may deserve attention before a Critical-scored flaw on an isolated test box. The number starts the conversation; exposure and value finish it.

---

## 9. CVSS Is Not Risk

A common trap: treating the CVSS score as the risk. It is not.

- **CVSS measures severity** — how bad the flaw is in the abstract
- **Risk measures likelihood and impact in context** — as covered in the Understanding Vulnerabilities sheet, `RISK = THREAT × VULNERABILITY × IMPACT`

A Critical CVSS flaw on a system no attacker can reach is **low risk**. A Medium flaw on an exposed, valuable, actively targeted system can be **high risk**. CVSS feeds into risk assessment, but it does not replace it.

This is exactly why the environmental metrics exist: they are CVSS's own way of admitting that raw severity needs local context to become meaningful.

---

## 10. Key Terms Quick Reference

| Term                     | One-line meaning                                          |
| ------------------------ | --------------------------------------------------------- |
| **CVSS**                 | Scoring system rating vulnerability severity 0.0 to 10.0  |
| **Base score**           | The intrinsic, fixed severity of a flaw                   |
| **Temporal score**       | Base adjusted for exploit availability and patches        |
| **Environmental score**  | Base adjusted for your specific environment               |
| **Vector string**        | Compact code listing every metric value                   |
| **Attack Vector (AV)**   | How remote the attacker can be                            |
| **Attack Complexity (AC)**| How hard the attack is to pull off                       |
| **Privileges Required (PR)**| Access the attacker needs beforehand                   |
| **User Interaction (UI)**| Whether a victim must do something                        |
| **Scope (S)**            | Whether the flaw can affect other components              |
| **C / I / A**            | Confidentiality, Integrity, Availability impact           |
| **Severity band**        | None / Low / Medium / High / Critical                     |
| **CVSS vs Risk**         | Severity in the abstract vs likelihood + impact in context |
