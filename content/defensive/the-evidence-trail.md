# The Evidence Trail

"Every contact leaves a trace." - Edmond Locard

> **⚠️ AUTHORIZED USE ONLY.** This material is for education, defensive digital forensics, and authorized investigations. Preserve original evidence, follow the litigation hold, record every transfer and transformation, and work only from verified forensic copies. Coordinate legal, privacy, regulatory, and disclosure decisions with authorized counsel and leadership. This cheatsheet supports technical analysis and does not provide legal advice.

**Scope:** Defensible forensic investigation from evidence intake through reporting: litigation hold, chain of custody, integrity verification, order of volatility, forensic copies, disk-image triage, partition and filesystem analysis, The Sleuth Kit, NTFS artifacts, Windows persistence, registry analysis, deleted-file recovery, Volatility 3 memory analysis, process and network correlation, Plaso super timelines, timeline normalization, evidentiary confidence, HIPAA-oriented scope assessment, and two-audience forensic reporting.

## Table of Contents
- [Core Concepts](#core-concepts)
- [Forensic Investigation Workflow](#forensic-investigation-workflow)
- [Legal Hold and Evidence Governance](#legal-hold-and-evidence-governance)
- [Chain of Custody](#chain-of-custody)
- [Evidence Intake](#evidence-intake)
- [Integrity Verification](#integrity-verification)
- [Originals and Working Copies](#originals-and-working-copies)
- [Order of Volatility](#order-of-volatility)
- [Forensic Soundness](#forensic-soundness)
- [Evidence Reference Model](#evidence-reference-model)
- [Disk Image Triage](#disk-image-triage)
- [Partition Analysis](#partition-analysis)
- [Filesystem Analysis with TSK](#filesystem-analysis-with-tsk)
- [Filesystem Timeline](#filesystem-timeline)
- [NTFS Timestamp Interpretation](#ntfs-timestamp-interpretation)
- [Deleted File Recovery](#deleted-file-recovery)
- [Windows Execution Artifacts](#windows-execution-artifacts)
- [Windows Registry Analysis](#windows-registry-analysis)
- [Persistence Artifacts](#persistence-artifacts)
- [Scheduled Tasks](#scheduled-tasks)
- [Services and Autoruns](#services-and-autoruns)
- [WMI Persistence](#wmi-persistence)
- [Anti-Forensics Indicators](#anti-forensics-indicators)
- [Memory Forensics Workflow](#memory-forensics-workflow)
- [Volatility 3 Fundamentals](#volatility-3-fundamentals)
- [Process Analysis](#process-analysis)
- [Network Analysis in Memory](#network-analysis-in-memory)
- [Injected Code and Suspicious Memory](#injected-code-and-suspicious-memory)
- [Handles, DLLs, and Command Lines](#handles-dlls-and-command-lines)
- [Memory Artifact Extraction](#memory-artifact-extraction)
- [Cross-Artifact Correlation](#cross-artifact-correlation)
- [Plaso Super Timeline](#plaso-super-timeline)
- [Timeline Normalization](#timeline-normalization)
- [Confirmed, Probable, and Possible Findings](#confirmed-probable-and-possible-findings)
- [Finding Development](#finding-development)
- [Attack Timeline Reconstruction](#attack-timeline-reconstruction)
- [Compromise Scope](#compromise-scope)
- [Data Access and Exposure](#data-access-and-exposure)
- [HIPAA-Oriented Evidence Assessment](#hipaa-oriented-evidence-assessment)
- [Technical Forensic Report](#technical-forensic-report)
- [Executive Summary](#executive-summary)
- [Evidence Citation Rules](#evidence-citation-rules)
- [Limitations and Unknowns](#limitations-and-unknowns)
- [Forensic Package](#forensic-package)
- [Quality Gates](#quality-gates)
- [Professional Judgment](#professional-judgment)
- [Framework and Tool Map](#framework-and-tool-map)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Concepts

| Term | Meaning |
| --- | --- |
| **Digital forensics** | Identification, preservation, examination, analysis, and reporting of digital evidence |
| **Artifact** | Data object that records or reflects system activity |
| **Evidence item** | Preserved artifact with identity, provenance, custody, and integrity records |
| **Forensic image** | Bit-for-bit acquisition of storage media or a defined evidence source |
| **Memory image** | Acquisition of volatile system memory |
| **Chain of custody** | Continuous record of evidence possession, access, movement, and transformation |
| **Order of volatility** | Priority based on how quickly evidence may disappear or change |
| **Timeline** | Chronological integration of filesystem, memory, log, registry, and network events |
| **Finding** | Evidence-supported analytical conclusion |
| **Evidence reference** | Stable citation linking a claim to an exact artifact location |

## 2. Forensic Investigation Workflow

```text
Receive authority and scope
  ↓
Inventory and verify evidence
  ↓
Create protected working copies
  ↓
Triage disk and memory
  ↓
Extract filesystem, registry, process, and network artifacts
  ↓
Build and normalize timelines
  ↓
Correlate across artifact types
  ↓
Develop bounded findings
  ↓
Assess scope and data impact
  ↓
Produce technical and executive reports
```

| Phase | Output |
| --- | --- |
| **Authority** | Case scope, litigation hold, and handling rules |
| **Intake** | Evidence manifest and custody entries |
| **Verification** | Matching cryptographic hashes |
| **Examination** | Extracted artifacts and tool outputs |
| **Analysis** | Findings, timeline, confidence, and contradictions |
| **Impact** | Affected systems, identities, and data |
| **Reporting** | Technical report, executive summary, and citation index |

## 3. Legal Hold and Evidence Governance

### Governance fields

| Field | Purpose |
| --- | --- |
| **case_number** | Links evidence to the legal matter |
| **hold_reference** | Litigation-hold identifier |
| **custodian** | Person or system controlling the evidence |
| **scope** | Systems, users, dates, data, and artifacts covered |
| **preservation instruction** | What must not be altered or deleted |
| **access restriction** | Authorized personnel and purpose |
| **retention requirement** | Minimum preservation period |
| **approval authority** | Legal or executive owner |

### Governance rule

Do not alter, dispose of, reimage, or release evidence covered by a hold without documented authorization.

## 4. Chain of Custody

Chain of custody is continuous. It begins at acquisition and includes every access, copy, transfer, extraction, and return.

### Required fields

```text
Case number
Evidence ID
Description
Source system or location
Collector
Acquisition date and time in UTC
Acquisition method and tool version
Original hash
Storage location
Handling classification
Transfer from and to
Transfer purpose
Access date and purpose
Derived artifact IDs
Return or disposition authorization
```

### Custody entry example

```json
{
  "case_id": "LH-2026-0414-01",
  "evidence_id": "EVD-001",
  "action": "working_copy_created",
  "time_utc": "2026-11-03T10:12:44Z",
  "performed_by": "analyst-01",
  "source": "evidence-store/raw/WST-WS-031.E01",
  "destination": "work/WST-WS-031-analysis.E01",
  "sha256_verified": true,
  "purpose": "read-only forensic examination"
}
```

## 5. Evidence Intake

### Intake checklist

- Confirm written authority and scope.
- Assign a unique evidence ID.
- Photograph or record physical packaging when applicable.
- Record filenames, sizes, formats, and acquisition metadata.
- Record source host, serial number, and asset ID.
- Record acquisition start and end time.
- Record collector and tool version.
- Calculate SHA-256 before analysis.
- Compare with acquisition hash or manifest.
- Place originals in protected storage.
- Create verified forensic working copies.

### Evidence manifest

| Evidence ID | Artifact | Source | Format | Role |
| --- | --- | --- | --- | --- |
| **EVD-001** | Workstation disk image | WST-WS-031 | E01 or raw image | Filesystem and registry history |
| **EVD-002** | Workstation memory image | WST-WS-031 | Raw memory | Volatile processes and connections |
| **EVD-003** | Peer workstation memory image | WST-WS-017 | Raw memory | Scope comparison and corroboration |

## 6. Integrity Verification

### Commands

```bash
sha256sum evidence/raw/* > evidence/raw/SHA256SUMS
sha256sum -c evidence/raw/SHA256SUMS
stat evidence/raw/* > evidence/raw/file-metadata.txt
```

### Verification record

```json
{
  "evidence_id": "EVD-001",
  "algorithm": "SHA-256",
  "expected": "expected_digest_here",
  "observed": "observed_digest_here",
  "result": "match",
  "verified_at_utc": "2026-11-03T09:58:00Z",
  "verified_by": "analyst-01"
}
```

### Integrity rule

If a hash does not match, stop analysis on that copy, preserve the mismatch evidence, notify the evidence custodian, and obtain a verified source.

## 7. Originals and Working Copies

```text
Original evidence
  ↓ write-protected and sealed
Verified forensic master
  ↓ hash checked
Working copy
  ↓ analysis
Derived artifacts and reports
```

### Controls

- Originals are read-only and access-restricted.
- Working copies receive new evidence IDs or derivative IDs.
- Tool output identifies its parent evidence.
- Analysis notes never replace original evidence.
- Final verification confirms originals remain unchanged.

## 8. Order of Volatility

| Priority | Evidence examples |
| --- | --- |
| **Highest volatility** | CPU state, registers, cache, live process state |
| **High volatility** | Memory, network connections, logged-on sessions, running processes |
| **Moderate volatility** | Temporary files, active logs, routing and ARP information |
| **Lower volatility** | Disk images, persistent logs, registry hives, backups |
| **External and archival** | Central logs, provider records, tapes, offline archives |

### Principle

Collect the most volatile evidence first when safe and authorized, because shutdown, isolation, process termination, or normal activity can destroy it.

## 9. Forensic Soundness

### Requirements

- Use documented, repeatable methods.
- Operate on verified copies.
- Minimize changes to evidence.
- Record tool names, versions, options, and errors.
- Preserve raw output before filtering.
- Validate parser output against the source when material.
- Record timezone, locale, and clock assumptions.
- Separate examination from interpretation.
- Retain contradictory and exculpatory evidence.

### Tool rule

A tool result is a derived artifact. It must retain the source evidence ID, command, version, timestamp, and output hash.

## 10. Evidence Reference Model

### Reference format

```text
[EVIDENCE_ID | artifact | exact location | timestamp if applicable]
```

### Examples

```text
[EVD-001 | NTFS $MFT | record 48155 | 2026-10-31T02:03:12Z]
[EVD-001 | SYSTEM hive | ControlSet001\Services\ExampleSvc]
[EVD-002 | windows.pslist | PID 4028]
[EVD-002 | windows.netscan | offset 0x9f81...]
[EVD-003 | windows.pstree | PID 2196]
```

## 11. Disk Image Triage

### Initial questions

- What image format is present?
- Does the image integrity verify?
- Which partition table and filesystems exist?
- Is encryption present?
- Which partition contains Windows?
- What timezone and hostname artifacts are available?
- Are deleted or unallocated regions relevant?
- Is the image complete or segmented?

### Triage commands

```bash
file work/WST-WS-031.img
img_stat work/WST-WS-031.img
mmls work/WST-WS-031.img
```

### Safety rule

Do not mount a forensic image read-write. Use forensic tools or a verified read-only mount.

## 12. Partition Analysis

### `mmls` use

```bash
mmls work/WST-WS-031.img > analysis/disk/mmls.txt
```

Record:

- Partition start sector.
- Partition length.
- Filesystem type.
- Unallocated gaps.
- Recovery or boot partitions.
- Sector size.

### Offset calculation

```text
offset_bytes = partition_start_sector × sector_size
```

## 13. Filesystem Analysis with TSK

<Software>The Sleuth Kit</Software> provides command-line tools and a library for forensic analysis of filesystems including NTFS, FAT, EXT, and FFS. citeturn23search40

### Core tools

| Tool | Purpose |
| --- | --- |
| **mmls** | Display partition layout |
| **fsstat** | Display filesystem details |
| **fls** | List allocated and deleted files |
| **icat** | Extract file content by metadata address |
| **istat** | Display metadata details for one object |
| **tsk_recover** | Recover files from an image |
| **mactime** | Convert body files into chronological timelines |

### Commands

```bash
fsstat -o START_SECTOR work/WST-WS-031.img > analysis/disk/fsstat.txt
fls -o START_SECTOR -r -p work/WST-WS-031.img > analysis/disk/all-files.txt
fls -o START_SECTOR -r -d -p work/WST-WS-031.img > analysis/disk/deleted-files.txt
istat -o START_SECTOR work/WST-WS-031.img METADATA_ADDRESS
icat -o START_SECTOR work/WST-WS-031.img METADATA_ADDRESS > extracted/artifact.bin
sha256sum extracted/artifact.bin
```

## 14. Filesystem Timeline

The Sleuth Kit timeline method gathers temporal data into a body file and uses `mactime` to sort and merge it into a timeline. citeturn23search42

### Timeline creation

```bash
fls -o START_SECTOR -m 'C:/' -r work/WST-WS-031.img > analysis/timeline/bodyfile.txt
mactime -b analysis/timeline/bodyfile.txt -d > analysis/timeline/filesystem-timeline.csv
```

### Investigation windows

- Initial suspicious execution.
- Persistence creation.
- Credential or remote-service activity.
- Sensitive file access.
- Archive creation and deletion.
- Cleanup or anti-forensics.
- Containment and remediation.

### Timeline rule

Use a broad timeline for context, then create targeted views around high-confidence events.

## 15. NTFS Timestamp Interpretation

| Timestamp | General meaning |
| --- | --- |
| **Modified** | File content changed |
| **Accessed** | File access time, subject to system policy and reduced precision |
| **Changed** | Metadata changed |
| **Created** | File or metadata entry creation time |

### NTFS caution

- Multiple timestamp sets may exist.
- Copying, extraction, restore, and timestomping can alter values.
- Access-time updates may be disabled or delayed.
- Deleted-file recovery may be partial.
- One timestamp alone should not establish execution or causality.

## 16. Deleted File Recovery

### Workflow

```text
Identify deleted metadata entry
  ↓
Record path, timestamps, and allocation status
  ↓
Extract with icat or forensic tool
  ↓
Hash recovered content
  ↓
Identify type and completeness
  ↓
Correlate with timeline and memory
```

### Commands

```bash
fls -o START_SECTOR -r -d -p work/WST-WS-031.img
icat -o START_SECTOR work/WST-WS-031.img METADATA_ADDRESS > extracted/deleted-item.bin
file extracted/deleted-item.bin
sha256sum extracted/deleted-item.bin
strings -a -n 8 extracted/deleted-item.bin > analysis/deleted-item-strings.txt
```

### Recovery caution

A recovered file can contain overwritten or partial data. Record completeness and never assume the original content is intact.

## 17. Windows Execution Artifacts

| Artifact | Evidentiary value |
| --- | --- |
| **Prefetch** | Program execution context on supported systems |
| **Amcache** | Program and file metadata useful for execution history |
| **Shimcache** | File presence and compatibility metadata; not standalone proof of execution |
| **UserAssist** | User-launched GUI program evidence |
| **BAM and DAM** | Application execution context on supported versions |
| **LNK files** | File and path interaction context |
| **Jump Lists** | User application and file activity |
| **Event logs** | Process, task, service, logon, and system events |
| **PowerShell logs** | Engine, module, and script-block activity when enabled |

### Interpretation rule

No single execution artifact is universally conclusive. Correlate path, time, user, process, and supporting artifacts.

## 18. Windows Registry Analysis

### Important hives

| Hive | Use |
| --- | --- |
| **SYSTEM** | Services, control sets, devices, network, and system configuration |
| **SOFTWARE** | Applications, policies, and machine-wide configuration |
| **SAM** | Local accounts and groups |
| **SECURITY** | Security policy and cached secrets context |
| **NTUSER.DAT** | User activity and user-specific persistence |
| **UsrClass.dat** | Shell, COM, and user interaction artifacts |

### Registry workflow

- Preserve hive and transaction logs.
- Record hive path and hash.
- Determine active control set.
- Review services, autoruns, profiles, and recent activity.
- Record exact key, value, data, and last-write time.
- Correlate with filesystem and memory evidence.

## 19. Persistence Artifacts

| Mechanism | Primary evidence |
| --- | --- |
| **Scheduled task** | Task XML, registry task cache, event logs, executable |
| **Service** | SYSTEM hive, service events, image path, account |
| **Run key** | Registry values and target file |
| **Startup folder** | Startup file and related execution artifacts |
| **WMI subscription** | Filter, consumer, and binding |
| **PowerShell profile** | Modified profile and script content |
| **Office add-in** | Registry and add-in file |
| **DLL search-order abuse** | Loaded module path and application behavior |
| **Account persistence** | New account, role, group, key, or remote access |

## 20. Scheduled Tasks

### Evidence to extract

```text
Task name and path
Author and registration time
Principal and run level
Trigger and repetition
Action and arguments
Working directory
Hidden state
Task file hash
Task cache registry entries
Execution events
```

### Confirmation model

```text
Task XML or registry definition
  +
Referenced payload or script
  +
Execution artifact near trigger time
  =
High-confidence scheduled-task persistence finding
```

## 21. Services and Autoruns

### Service fields

- Service name and display name.
- Image path and arguments.
- Start type.
- Service account.
- Creation or modification time.
- Referenced binary hash and signature.
- Event-log and memory evidence.

### Autorun review

- Machine and user Run keys.
- RunOnce keys.
- Startup directories.
- Winlogon and shell values.
- Browser extensions.
- Office add-ins.
- File-association handlers.

## 22. WMI Persistence

```text
Event Filter
  +
Event Consumer
  +
Filter-to-Consumer Binding
```

### Evidence questions

- What event triggers the filter?
- Which command or script does the consumer run?
- Which user and namespace own the objects?
- When were they created?
- Are equivalent objects present in memory?
- Did the action execute near the trigger time?

## 23. Anti-Forensics Indicators

- Event-log clearing.
- File deletion or secure-delete tooling.
- Timestomping or inconsistent timestamp sets.
- History and temporary-file cleanup.
- Disabled logging or security controls.
- Deleted scheduled task after execution.
- Renamed system utilities.
- Archive deletion after network activity.
- Registry transaction artifacts without current values.

### Anti-forensics rule

Absence of an artifact may result from normal retention, cleanup, or attack activity. State the alternatives.

## 24. Memory Forensics Workflow

```text
Verify memory hash
  ↓
Identify operating system and symbol requirements
  ↓
List processes and process tree
  ↓
Review command lines, DLLs, handles, and users
  ↓
Review network connections
  ↓
Scan for terminated or hidden processes
  ↓
Review suspicious memory and injected regions
  ↓
Extract targeted artifacts
  ↓
Correlate with disk and logs
```

## 25. Volatility 3 Fundamentals

<Software>Volatility 3</Software> is an open-source memory-forensics framework with plugins, symbol support, output renderers, scanners, and Windows, Linux, and macOS analysis capabilities. citeturn23search37turn23search38

### Basic commands

```bash
python3 vol.py -f memory/WST-WS-031.raw windows.info
python3 vol.py -f memory/WST-WS-031.raw windows.pslist
python3 vol.py -f memory/WST-WS-031.raw windows.pstree
python3 vol.py -f memory/WST-WS-031.raw windows.psscan
python3 vol.py -f memory/WST-WS-031.raw windows.cmdline
python3 vol.py -f memory/WST-WS-031.raw windows.netscan
```

### Output preservation

```bash
python3 vol.py -f memory/WST-WS-031.raw -r csv windows.pslist \
  > analysis/memory/WST-WS-031-pslist.csv
sha256sum analysis/memory/WST-WS-031-pslist.csv
```

## 26. Process Analysis

### Process questions

- Is the process expected for the host role?
- Who is the parent and child?
- Does creation time fit the incident window?
- Is the executable path normal?
- Does the command line reference suspicious files or remote systems?
- Is the process visible in both list and scan results?
- Does it own network connections?
- Which user or token is associated with it?
- Are name, path, signature, and behavior consistent?

### Process matrix

| Evidence | Interpretation |
| --- | --- |
| Process in pslist and psscan | Active process visible through normal structures |
| Process only in scan result | Terminated, unlinked, or requires validation |
| Office or browser parent to build utility | Suspicious execution chain on a clinical host |
| System process with unusual executable path | Possible masquerading |
| Process with external connection and unusual command | Strong behavioral lead |

## 27. Network Analysis in Memory

### Review fields

- Local and remote address.
- Local and remote port.
- Protocol.
- Connection state.
- Owning PID and process.
- Creation time when available.
- Destination relationship to firewall, DNS, and threat intelligence.

### Command

```bash
python3 vol.py -f memory/WST-WS-031.raw windows.netscan \
  > analysis/memory/WST-WS-031-netscan.txt
```

### Network caution

Memory captures one point in time. Closed connections may not remain, and the initiating process may have exited.

## 28. Injected Code and Suspicious Memory

### Analysis targets

- Executable private memory.
- Process hollowing indicators.
- Unbacked executable regions.
- Suspicious protection changes.
- Inconsistent process name and image path.
- Unexpected thread start addresses.
- Extracted PE or script content.

### Commands

```bash
python3 vol.py -f memory/WST-WS-031.raw windows.malfind \
  > analysis/memory/WST-WS-031-malfind.txt
```

### Interpretation rule

A suspicious memory region is a lead. Confirm with process context, code or string analysis, and independent artifacts.

## 29. Handles, DLLs, and Command Lines

```bash
python3 vol.py -f memory/WST-WS-031.raw windows.cmdline
python3 vol.py -f memory/WST-WS-031.raw windows.dlllist --pid PID
python3 vol.py -f memory/WST-WS-031.raw windows.handles --pid PID
```

### Uses

| Artifact | Value |
| --- | --- |
| **Command line** | Execution intent, arguments, paths, and remote targets |
| **DLL list** | Unexpected modules, side-loading, and path anomalies |
| **Handles** | Open files, registry keys, processes, mutexes, and named objects |

## 30. Memory Artifact Extraction

### Extraction rules

- Record source memory hash.
- Record plugin, options, and version.
- Assign derivative evidence ID.
- Hash every extracted artifact.
- Identify file type.
- Preserve raw extraction before analysis.
- Correlate extracted content with disk.

### Derivative record

```json
{
  "derived_id": "DRV-MEM-014",
  "parent_evidence": "EVD-002",
  "method": "Volatility 3 targeted extraction",
  "source_object": "PID 4028",
  "sha256": "digest_here",
  "generated_at_utc": "2026-11-03T15:32:00Z"
}
```

## 31. Cross-Artifact Correlation

| Disk or log evidence | Memory evidence | Analytical value |
| --- | --- | --- |
| Prefetch entry | Running or scanned process | Supports execution |
| Scheduled task XML | Process near trigger time | Supports persistence execution |
| Service registry key | Service process in memory | Supports service activity |
| Deleted payload | Process or loaded module | Links recovered file to runtime |
| Firewall session | netscan connection | Supports endpoint ownership |
| Registry Run key | Command line and process | Supports autorun execution |
| User logon event | Process token or session | Links identity to activity |

### Correlation principle

Two independent artifact types supporting the same claim usually raise confidence, but dependence and collection timing must be considered.

## 32. Plaso Super Timeline

<Software>Plaso</Software>, also known as `log2timeline`, is a Python-based engine for automatically creating broad or targeted forensic timelines from many artifact formats. citeturn23search43turn23search44turn23search45

### Workflow

```bash
log2timeline.py analysis/timeline/WST-WS-031.plaso work/WST-WS-031.img
psort.py -o l2tcsv analysis/timeline/WST-WS-031.plaso \
  > analysis/timeline/WST-WS-031-super-timeline.csv
```

### Targeted filtering

```bash
psort.py -o l2tcsv \
  -q 'date > 2026-10-31T00:00:00 and date < 2026-11-04T00:00:00' \
  analysis/timeline/WST-WS-031.plaso \
  > analysis/timeline/incident-window.csv
```

### Plaso caution

Record the Plaso version, enabled parsers, processing errors, timezone, and filter expression. Parser support and behavior vary by version.

## 33. Timeline Normalization

### Required fields

| Field | Purpose |
| --- | --- |
| **original_timestamp** | Preserved source value |
| **timestamp_type** | Created, modified, event, ingestion, or acquisition time |
| **timezone_or_offset** | Interpretation context |
| **normalized_utc** | Cross-source comparison time |
| **precision** | Seconds, milliseconds, or date only |
| **uncertainty** | Known tolerance or ambiguity |
| **source_ref** | Exact artifact citation |

### Normalization rule

Never silently correct a timestamp. Preserve the original, document the correction, and state uncertainty.

## 34. Confirmed, Probable, and Possible Findings

| Finding status | Evidence standard |
| --- | --- |
| **Confirmed** | Direct evidence or strong independent convergence supports the claim |
| **Probable** | Strong circumstantial evidence supports the claim and alternatives are weaker |
| **Possible** | Evidence is consistent with the claim, but material alternatives remain |
| **Not supported** | Available evidence does not substantiate the claim |
| **Unknown** | Evidence cannot resolve the question |

### Confidence language

```text
Confirmed: The scheduled task existed and executed the referenced payload.
Probable: The recovered archive was created for data staging.
Possible: The archive was transferred through the observed encrypted session.
Unknown: Whether every record in the archive was successfully received externally.
```

## 35. Finding Development

### Finding fields

| Field | Purpose |
| --- | --- |
| **finding_id** | Stable report reference |
| **title** | Specific conclusion |
| **status** | Confirmed, probable, possible, not supported, or unknown |
| **confidence** | High, moderate, or low |
| **evidence_refs** | Direct supporting artifacts |
| **contradictory_refs** | Evidence against the claim |
| **analysis** | Reasoning from evidence to conclusion |
| **scope** | Affected users, hosts, data, and time |
| **limitations** | What the evidence cannot show |
| **impact** | Technical, business, and regulatory relevance |

### Finding example

```json
{
  "finding_id": "FND-007",
  "title": "Unauthorized scheduled-task persistence",
  "status": "confirmed",
  "confidence": "high",
  "evidence_refs": [
    "EVD-001:task-xml",
    "EVD-001:task-cache-registry",
    "EVD-002:process-at-trigger"
  ],
  "limitations": ["Exact task creation mechanism was not recovered"]
}
```

## 36. Attack Timeline Reconstruction

### Timeline phases

```text
Initial access
  ↓
Execution
  ↓
Persistence
  ↓
Credential or account use
  ↓
Discovery and lateral movement
  ↓
Data access and collection
  ↓
Staging or transfer
  ↓
Cleanup and containment
```

### Timeline rule

Order facts first. Add analytical relationships separately. `Preceded` is not the same as `caused`.

## 37. Compromise Scope

### Scope matrix

| Entity | Status | Evidence |
| --- | --- | --- |
| **WST-WS-031** | Confirmed affected | Disk and memory evidence |
| **WST-WS-017** | Confirmed, probable, reviewed, or unknown | Memory and correlated evidence |
| **Daniel Marsh account** | Compromised, exposed, reviewed, or unknown | Identity and process evidence |
| **Laboratory Information System** | Accessed, targeted, unaffected, or unknown | Application and database audit evidence |

### Scope rule

Distinguish affected, exposed, reviewed, and unknown. Access permission alone does not prove access.

## 38. Data Access and Exposure

| State | Meaning |
| --- | --- |
| **Possible access** | Account or process had permission, but access is unconfirmed |
| **Confirmed access** | Audit, file, query, or memory evidence shows access or viewing |
| **Confirmed local staging** | Data was copied, exported, or archived locally |
| **Probable transfer** | Timing and volume strongly support outbound transfer |
| **Confirmed transfer** | Content, complete protocol evidence, or destination evidence confirms transfer |
| **Prevented transfer** | Containment occurred before supported transfer |
| **Unknown** | Evidence cannot resolve the data state |

### Exposure principle

Do not convert possible access into confirmed acquisition. Do not convert local staging into confirmed exfiltration.

## 39. HIPAA-Oriented Evidence Assessment

**Legal caution:** Forensic analysts provide facts. Authorized privacy and legal personnel determine breach-notification obligations.

### Evidence questions

| Risk factor | Forensic evidence |
| --- | --- |
| **Nature and extent of PHI** | Fields, identifiers, sensitivity, record count, and re-identification context |
| **Unauthorized person** | Account, actor, destination, recipient, and relationship |
| **Actually acquired or viewed** | Query, file, memory, export, staging, and transfer evidence |
| **Mitigation** | Isolation, revocation, deletion, recovery, and recipient assurances |

### Scope package

- Systems and applications containing PHI.
- User and service-account permissions.
- Access and query evidence.
- Files, exports, archives, and recovered data.
- Network transfer evidence and destinations.
- Encryption state and key access.
- Number or defensible estimate of individuals.
- Containment and mitigation timestamps.
- Evidence limitations and unresolved questions.

## 40. Technical Forensic Report

### Structure

```text
Case and authority
Scope and questions
Evidence inventory
Chain of custody
Tools and versions
Methodology
Integrity verification
System and artifact overview
Detailed findings
Master timeline
Persistence analysis
Memory analysis
Data-access and exposure analysis
Compromise scope
Contradictory evidence
Limitations and unknowns
Conclusions
Evidence reference index
Appendices and command log
```

### Technical writing rule

State the evidence, interpretation, confidence, and limitation for every material conclusion.

## 41. Executive Summary

### Structure

```text
What happened
How access was obtained
Which systems and identities were affected
What persistence and attacker activity were confirmed
What data was accessed, staged, transferred, or remains unknown
Operational and regulatory significance
Confidence and major limitations
Immediate and long-term actions
```

### Audience rule

The executive section should communicate impact and decisions. Technical details remain available through evidence references and appendices.

## 42. Evidence Citation Rules

- Cite every factual assertion that affects scope, cause, impact, or confidence.
- Use stable evidence IDs.
- Include exact plugin row, metadata record, registry path, file path, or timeline entry.
- Cite original evidence before summaries.
- Identify derived artifacts as derived.
- Cite contradictory evidence beside the affected conclusion.
- Preserve timestamps and timezone.
- Do not cite only a screenshot when structured evidence exists.

## 43. Limitations and Unknowns

### Common limitations

- Memory is a point-in-time snapshot.
- Disk artifacts may have been deleted or overwritten.
- Filesystem timestamps can be manipulated or misunderstood.
- Event logs may be cleared, incomplete, or outside retention.
- Encrypted traffic may hide content.
- A memory plugin may fail because symbols or structures are incomplete.
- A recovered deleted file may be partial.
- Lack of evidence is not proof that an event did not occur.

### Unknown record

```json
{
  "unknown_id": "UNK-004",
  "question": "Was PHI transferred from the Laboratory Information System?",
  "known": ["Account had access", "local staging artifact recovered"],
  "unknown": ["complete outbound content", "destination receipt"],
  "evidence_needed": ["application export logs", "proxy body metadata", "destination-side evidence"],
  "impact": "Material to privacy and notification assessment"
}
```

## 44. Forensic Package

```text
the_evidence_trail/
├── README.md
├── authority/
│   ├── scope.md
│   └── litigation-hold-reference.md
├── evidence/
│   ├── evidence-manifest.jsonl
│   ├── chain-of-custody.jsonl
│   ├── acquisition-metadata.json
│   └── SHA256SUMS
├── disk/
│   ├── partition-layout.txt
│   ├── filesystem-statistics.txt
│   ├── bodyfile.txt
│   ├── filesystem-timeline.csv
│   ├── registry-findings.jsonl
│   └── recovered-files.jsonl
├── memory/
│   ├── WST-WS-031/
│   │   ├── pslist.csv
│   │   ├── pstree.csv
│   │   ├── psscan.csv
│   │   ├── cmdline.csv
│   │   ├── netscan.csv
│   │   └── malfind.txt
│   └── WST-WS-017/
├── timeline/
│   ├── super-timeline.csv
│   ├── incident-window.csv
│   └── master-timeline.jsonl
├── findings/
│   ├── forensic-findings.jsonl
│   ├── scope-matrix.json
│   └── data-exposure.json
├── reports/
│   ├── forensic-report.md
│   ├── executive-summary.md
│   └── evidence-reference-index.md
├── commands/
│   └── command-log.txt
├── MANIFEST.json
└── SHA256SUMS
```

## 45. Quality Gates

| Gate | Pass condition |
| --- | --- |
| **Authority** | Scope and hold reference documented |
| **Custody** | Every access, copy, transfer, and extraction recorded |
| **Integrity** | Original and working-copy hashes verify |
| **Soundness** | Analysis occurs on protected copies with repeatable methods |
| **Disk triage** | Image, partitions, filesystems, and offsets documented |
| **Timeline** | Filesystem and super timelines preserve source references |
| **Registry** | Persistence findings include exact hive, key, value, and time |
| **Memory** | Process, command, network, and suspicious-memory reviews completed |
| **Correlation** | Material findings use more than one artifact where possible |
| **Confidence** | Confirmed, probable, possible, not supported, and unknown are separated |
| **Scope** | Affected, exposed, reviewed, and unknown entities distinguished |
| **Data impact** | Permission, access, staging, and transfer states separated |
| **Citations** | Every material assertion links to evidence |
| **Limitations** | Missing, incomplete, or ambiguous evidence documented |
| **Reporting** | Technical and executive audiences both served |
| **Final integrity** | Evidence and package hashes verify after analysis |

### Validation commands

```bash
find the_evidence_trail -name '*.json' -print0 | xargs -0 -n1 jq empty
find the_evidence_trail -name '*.jsonl' -print0 | while IFS= read -r -d '' file; do jq -c . "$file" >/dev/null || exit 1; done
sha256sum -c the_evidence_trail/SHA256SUMS
sha256sum -c the_evidence_trail/evidence/SHA256SUMS
```

## 46. Professional Judgment

- Chain of custody is a continuous discipline, not an intake form.
- Verify evidence before analysis and again after transfer or copying.
- Work from forensic copies, not originals.
- Collect volatile evidence before less volatile evidence when safe and authorized.
- A parser result is not self-proving. Retain the source and command.
- A timestamp has meaning only when its source, semantics, timezone, and precision are understood.
- One artifact can support a lead, but material findings should seek independent corroboration.
- A recovered deleted file may be partial.
- A process scan result requires context and validation.
- A suspicious memory region is not automatically malicious code.
- Access permission is not proof of data access.
- Local staging is not automatically external transfer.
- Absence of an artifact is not proof that activity did not occur.
- Report exculpatory and contradictory evidence.
- Bound conclusions to the evidence, even when the deadline is short.
- Legal and privacy authorities make regulatory decisions using forensic facts.

## 47. Framework and Tool Map

| Item | Purpose |
| --- | --- |
| **NIST SP 800-86** | Integrate file, OS, network, and application forensics into incident response |
| **RFC 3227** | Evidence collection, order of volatility, archiving, privacy, and custody guidance |
| **The Sleuth Kit** | Partition, filesystem, metadata, extraction, and timeline analysis |
| **Volatility 3** | Memory process, network, module, handle, registry, and scanning analysis |
| **Plaso** | Automated broad and targeted forensic timeline creation |
| **SHA-256** | Evidence identity and integrity verification |
| **Write protection** | Reduce changes to original storage evidence |
| **Registry hives** | Windows configuration, execution, account, and persistence analysis |
| **NTFS artifacts** | Filesystem activity, deletion, and temporal reconstruction |
| **HHS OCR guidance** | Evidence context for healthcare privacy and risk review |

## 48. Fast Recall

- **If you cannot cite the artifact, do not state the finding as fact.**
- **Verify hashes before analysis.**
- **Record every transfer, access, copy, and extraction.**
- **Analyze forensic working copies, not originals.**
- **Collect volatile evidence first when safe and authorized.**
- **The Sleuth Kit uses tools such as mmls, fsstat, fls, icat, istat, and mactime.**
- **Use fls to create body-file data and mactime to generate a filesystem timeline.**
- **NTFS timestamps require semantic and anti-forensics awareness.**
- **Deleted recovery may be incomplete or overwritten.**
- **Registry persistence needs exact hive, key, value, data, and last-write context.**
- **Scheduled tasks require definition, payload, and execution correlation.**
- **Volatility 3 process analysis should compare pslist, pstree, and psscan.**
- **Correlate memory network objects with firewall, DNS, and disk evidence.**
- **Malfind output is a lead, not a verdict.**
- **Hash every memory or disk artifact you extract.**
- **Plaso creates broad or targeted super timelines from many artifact types.**
- **Preserve original timestamp, timezone, precision, and normalized UTC.**
- **Separate confirmed, probable, possible, not supported, and unknown findings.**
- **Distinguish affected, exposed, reviewed, and unknown systems.**
- **Distinguish permission, access, staging, probable transfer, and confirmed transfer.**
- **Write technical detail for analysts and impact for executives.**
- **Document limitations with the same care as findings.**

## 49. Resources

**Digital forensic standards**
- [NIST SP 800-86](https://csrc.nist.gov/pubs/sp/800/86/final)
- [RFC 3227](https://www.rfc-editor.org/info/rfc3227/)

**Forensic tooling**
- [Volatility 3 Documentation](https://volatility3.readthedocs.io/en/latest/)
- [The Sleuth Kit Documentation](https://www.sleuthkit.org/sleuthkit/docs.php)
- [The Sleuth Kit Timelines](https://wiki.sleuthkit.org/Timelines/)
- [Plaso Documentation](https://plaso.readthedocs.io/)

**Healthcare evidence context**
- [HHS HIPAA Breach Notification Rule](https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html)
- [HHS Guidance on Risk Analysis](https://www.hhs.gov/hipaa/for-professionals/security/guidance/guidance-risk-analysis/index.html)
