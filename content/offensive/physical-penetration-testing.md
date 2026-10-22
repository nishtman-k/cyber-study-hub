# Physical Penetration Testing

> **⚠️ AUTHORIZED USE ONLY.** Test only the sites, people, systems, and methods covered by written authorization. Keep emergency exits functional, use harmless proofs, and stop when safety or scope is uncertain. See [Legal and Terms of Use](/legal).

**Scope:** A field reference for authorization, Rules of Engagement, reconnaissance, access controls, social engineering, USB and badge tools, evidence, and reporting.

## Table of Contents

- [Authorization and Legal Boundaries](#authorization-and-legal-boundaries)
- [Scope and Rules of Engagement](#scope-and-rules-of-engagement)
- [Field Operations](#field-operations)
- [Reconnaissance and Control Checks](#reconnaissance-and-control-checks)
- [Social Engineering](#social-engineering)
- [Tool Selection](#tool-selection)
- [Badges and Access Control](#badges-and-access-control)
- [Controlled USB Drop Tests](#controlled-usb-drop-tests)
- [Locks, Doors, and Sensors](#locks-doors-and-sensors)
- [Evidence and Privacy](#evidence-and-privacy)
- [Reporting and Closeout](#reporting-and-closeout)
- [References](#references)

## 1. Authorization and Legal Boundaries

**Before touching anything:** obtain signed authorization from parties entitled to approve the property access, systems, and activities involved. IT approval alone may not cover the building, landlord, tenants, or employees.

Carry an authorization letter listing testers, dates, locations, permitted actions, and a reachable verification contact. Keep the detailed scope and Rules of Engagement (RoE) available. These document permission; they are not immunity from arrest, civil claims, or other laws.

| Boundary | What to establish before testing |
| --- | --- |
| Property | Who controls each building, shared area, car park, and waste area? |
| Systems | Does permission cover badge readers, endpoints, cameras, and networks? |
| People | Are staff interactions and approved pretexts covered? Who handles complaints? |
| Privacy | Have legal/privacy owners reviewed photography, recording, identifiers, and retention? |
| Tools | Do local rules restrict possession, transport, radio transmission, or use? |
| Third parties | Obtain their approval or exclude their assets; the client's contract does not authorize every neighboring system. |

Have qualified local counsel review applicable trespass, damage, computer-access, privacy, and recording rules. In the US, the **CFAA concerns computer access**; DOJ's good-faith research policy is a charging policy, not blanket permission for physical entry or exemption from other laws. [DOJ CFAA policy](https://www.justice.gov/jm/jm-9-48000-computer-fraud)

## 2. Scope and Rules of Engagement

Write down **what, where, when, how far, and when to stop**. RoE define permitted testing and constraints before work begins. [NIST RoE definition](https://csrc.nist.gov/glossary/term/rules_of_engagement)

| RoE item | Minimum detail |
| --- | --- |
| Objective | Demonstrate a defined outcome, such as reaching an approved test room. |
| Boundaries | Addresses, doors, floors, dates, hours, and excluded areas. |
| Methods | Separate permission for social engineering, USB drops, credential duplication, and lock/sensor testing. |
| Proof limit | A test marker, approved photograph, or logged test event; stop before accessing real confidential content. |
| Notification | Overt: relevant staff informed. Covert: ordinary staff unaware; a designated control group still authorizes and supervises. |
| Safety | Emergency routes, prohibited actions, stop phrase, check-ins, and incident contacts. |
| Response | What happens if a guard challenges a tester, equipment fails, or a real incident occurs? |
| Cleanup | Inventory, restoration, credential revocation, evidence return, and retest owner. |

**Default exclusions:** force, threats, weapons, destructive entry, emergency impersonation, interference with alarms or emergency services, and unapproved access to live data. Do not continue past a blocked control by inventing a new method outside scope.

## 3. Field Operations

| Term | Practical meaning |
| --- | --- |
| **Rally point** | Pre-agreed safe place to regroup before or after the assessment; choose a backup. |
| **Staging area** | Approved place for equipment checks, preparation, and recovery. |
| **SITREP** | Situation Report: time, team status, location, progress, hazards, and next action. |
| **Green / Amber / Red** | Agree meanings in RoE: proceed / pause and reassess / abort and follow the safety plan. These are not universal codes. |
| **Cover / concealment** | Cover provides protection from a physical hazard; concealment reduces visibility. Neither guarantees the other. |
| **Evacuate / evade** | Leave danger and avoid confrontation using the agreed safe route; never evade lawful authorities. |
| **Collect / exfiltrate** | Gather only approved evidence and transfer it through the agreed secure channel; no uncontrolled data removal. |

Keep a charged phone, identification, authorization, emergency contacts, and an equipment inventory. If challenged, stop testing, remain calm, and use the verification contact. Follow emergency procedures during a real incident.

## 4. Reconnaissance and Control Checks

Start with public information and observation from locations where you may lawfully be. Crossing a boundary, inspecting restricted waste, or recording people needs separate consideration.

| Assess | Useful observations | Improvement to recommend |
| --- | --- | --- |
| Perimeter | Uncontrolled routes, lighting, gates, and signage | Clear boundaries and monitored entry points |
| Reception | Visitor verification, escorts, badge return | Independent verification and escort accountability |
| Doors | Closure, latch engagement, propping, held-open alarms | Repair hardware and route alarms to responders |
| Vestibule | Door interlock and occupancy control | One-person passage with monitored exceptions |
| Cameras | Relevant coverage, image quality, time accuracy | Verify coverage and an actual response process |
| Waste | Sensitive paper or media in accessible bins | Locked disposal containers and verified destruction |

**Dumpster diving** means inspecting discarded material for sensitive information. Waste is not automatically free to search. **Strip-cut shredding** leaves long strips that are easier to reconstruct than smaller cross-cut or micro-cut fragments; select destruction requirements for the data's sensitivity and verify disposal.

## 5. Social Engineering

**Tailgating:** following an authorized person without their knowing cooperation. **Piggybacking:** entry with their knowing assistance. Terminology varies; define it in the engagement.

An **access-control vestibule**, often called a mantrap, interlocks doors so the first normally closes before the second releases. Occupancy detection, procedures, and staff response matter: interlocking doors alone do not guarantee one-person entry. Preserve emergency egress.

| Influence principle | Human tendency | Defensive response |
| --- | --- | --- |
| Reciprocity | Returning a favor | Courtesy does not grant access. |
| Authority | Following apparent authority | Verify identity through a trusted channel. |
| Social proof | Following what others appear to do | “Others let me in” does not replace policy. |
| Commitment / consistency | Continuing an earlier decision | Allow staff to stop and re-check. |
| Liking | Trusting familiar or agreeable people | Apply the same access checks to everyone. |
| Scarcity | Reacting to urgency or limited opportunity | Slow down and verify urgent requests. |
| Unity | Trusting someone presented as part of the group | Group identity is not authorization. |

These are Cialdini's influence principles; they explain tendencies, not guaranteed outcomes. Use approved scenarios and report control failures without shaming staff. [Cialdini's principles](https://www.influenceatwork.com/7-principles-of-persuasion/)

## 6. Tool Selection

Select by **control under test**, supported protocol, and approved proof. Check current hardware and firmware documentation.

| Tool | Use in an authorized assessment | Important limit |
| --- | --- | --- |
| Camera and notebook | Record approved evidence, location, and time | Avoid unrelated people and sensitive screens. |
| Test badges and access logs | Check permissions, expiry, revocation, and alarms | Use dedicated credentials and known doors. |
| [Proxmark3](https://github.com/RfidResearchGroup/proxmark3) | LF/HF RFID identification and credential research | Reading an identifier does not prove a working clone. |
| [Flipper Zero](https://docs.flipper.net/zero/rfid) | Portable checks on supported LF RFID/NFC protocols | No universal cloning of encrypted credentials. |
| [ACR122U](https://www.acs.com.hk/en/products/3/acr122u-usb-nfc-reader/) | 13.56 MHz NFC/HF reader-writer tasks | Not a 125 kHz HID Prox reader; card support varies. |
| [USB Rubber Ducky](https://docs.hak5.org/hak5-usb-rubber-ducky) | Keyboard/HID injection validation using DuckyScript | Test device admission, not just storage controls. |
| [Bash Bunny](https://docs.hak5.org/bash-bunny/writing-payloads/attackmode) | USB tests combining HID, storage, or network-device modes | Each enabled interface expands scope. |
| [O.MG Cable](https://docs.hak5.org/omg-cable) | Assess controls against an instrumented cable with HID capability | Features vary by model; inventory and recover it. |
| [USB armory](https://github.com/usbarmory/usbarmory) | Programmable USB security-research platform | Requires development; not a ready-made Ducky replacement. |
| Locksmith inspection tools | Approved lock and door-hardware assessment | Method-specific approval and competent handling. |

**HID** means Human Interface Device. Rubber Ducky is a common keyboard-emulation tool, but it is not the only device capable of keystroke injection. PayloadStudio is an authoring tool; review community scripts offline before use and never upload client secrets.

## 7. Badges and Access Control

| Credential family | What to establish |
| --- | --- |
| **LF, commonly 125 kHz** | Legacy HID Prox uses this band; static-identifier designs can permit duplication. Confirm the actual protocol. |
| **HF/NFC, 13.56 MHz** | Includes simple tags and cryptographic smart cards; frequency alone says nothing about cloning resistance. |
| **Cryptographic credentials / PIV** | Check authenticated transactions, key management, revocation, and reader configuration. |

Assess **credential → reader → controller → door → monitoring**. Check expired/revoked test badges, least-privilege door access, reader tamper alerts, and response logs. Badge UID, card data, and authentication keys are different things.

Prefer cryptographic authentication over identifier-only decisions. Review reader-to-controller protection, including properly configured **OSDP Secure Channel**. OSDP support alone does not establish that encryption is enabled. [SIA OSDP](https://www.securityindustry.org/industry-standards/open-supervised-device-protocol/)

NIST SP 800-116 addresses risk-based PIV use in US federal facility access; it is not a universal badge-cloning guide. [NIST SP 800-116 Rev. 1](https://csrc.nist.gov/pubs/sp/800/116/r1/final)

## 8. Controlled USB Drop Tests

A USB drop combines **physical placement, human behavior, and device interaction**. There is no universal percentage split between these components.

1. Approve locations, device count, duration, eligible endpoints, and recovery plan.
2. Use uniquely numbered test devices and harmless content or a harmless marker on designated test endpoints.
3. Distinguish discovery, reporting, connection, file opening, and execution; one does not prove the next.
4. Correlate approved device telemetry with timestamps and endpoint events; collect no passwords or real documents.
5. Recover every device, remove test artifacts, and verify normal operation.

**Controls:** lost-device reporting, device-class restrictions, endpoint monitoring, least privilege, and approved charging accessories. Blocking USB storage alone does not block a keyboard-emulating device.

Map added hardware/HID functionality to **ATT&CK T1200: Hardware Additions** when evidence supports it. **T1091** concerns replication through removable media; not every USB drop involves replication. [MITRE T1200](https://attack.mitre.org/techniques/T1200/)

## 9. Locks, Doors, and Sensors

These are assessment categories, not interchangeable methods. Use a bench or an explicitly approved door with a competent specialist.

| Category | What it tests | Typical remediation |
| --- | --- | --- |
| Pin-tumbler manipulation | Resistance of the cylinder to non-key manipulation | Suitable rated cylinders and key control |
| Bump-key susceptibility | Resistance to impact-based manipulation | Appropriate resistant hardware |
| Key impressioning | Risk of deriving a working key from lock interactions | Controlled keys and resistant systems |
| Door shim / latch bypass | Latch protection and correct installation | Correct deadlatching, strike alignment, and guarding |
| Door-gap / hardware bypass tools | Whether gaps expose release hardware | Suitable guards and compliant hardware |
| Request-to-exit / motion sensors | Whether unintended inputs can release a door | Correct positioning, configuration, and monitored events |
| Door contacts / alarms | Whether opening or holding a door is detected and handled | Supervision, alarm routing, and response testing |

A strong cylinder cannot compensate for an insecure door assembly. Never obstruct emergency exits or disable life-safety functions; involve the facility's safety owner. Requirements depend on local codes; [US OSHA exit-route rules](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.36) illustrate why ingress protection must preserve safe egress.

## 10. Evidence and Privacy

Record **test ID, timestamp and timezone, exact location, approved action, result, evidence reference, and restoration status**. Distinguish observation, attempted access, successful access, and untested inference.

Use the minimum proof needed. Redact faces, badge numbers, screen contents, and unrelated personal information. Encrypt evidence, restrict access, and follow the agreed retention/deletion schedule. Where GDPR applies, establish a lawful basis and apply purpose limitation, data minimization, and storage limitation; the pentest contract alone does not resolve every privacy obligation. [EDPB principles](https://www.edpb.europa.eu/topics/key-gdpr-concepts/basic-principles_en)

## 11. Reporting and Closeout

**Report:** executive summary → scope and exclusions → methodology → findings with evidence → risk and business impact → recommendations → limitations → retest results.

For each finding, capture:

```text
Finding / location / authorization reference
Control expected → action performed → result observed
Evidence IDs and timestamps
Impact and prerequisites; do not assume a full compromise
Risk rationale and relevant compensating controls
Remediation owner, priority, and retest condition
```

Before closing: account for all equipment and badges, revoke test credentials, restore approved changes, transfer evidence securely, and obtain client confirmation. An open door is not proof of data theft; report the access actually demonstrated.

## 12. References

- [NIST SP 800-115 — assessment planning, execution, and reporting](https://csrc.nist.gov/pubs/sp/800/115/final)
- [NIST SP 800-116 Rev. 1 — PIV facility access](https://csrc.nist.gov/pubs/sp/800/116/r1/final)
- [DOJ — CFAA charging policy](https://www.justice.gov/jm/jm-9-48000-computer-fraud)
- [EDPB — data-protection principles](https://www.edpb.europa.eu/topics/key-gdpr-concepts/basic-principles_en)
- [MITRE ATT&CK — Hardware Additions](https://attack.mitre.org/techniques/T1200/)

Use local legal and safety review for the engagement; standards and tool documentation do not grant permission to test.
