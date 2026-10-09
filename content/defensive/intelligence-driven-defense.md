# Intelligence-Driven Defense

"The goal is to turn data into information, and information into insight." - Intelligence analysis principle

> **⚠️ AUTHORIZED USE ONLY.** This material is for education, defensive threat intelligence, and authorized security analysis. Use only intelligence and samples you are permitted to access. Respect handling labels, licensing, privacy, and source restrictions. Do not contact suspicious infrastructure from production systems, upload sensitive samples to public services without approval, or turn low-confidence indicators into automatic blocks without validation. See the [Legal and Terms of Use](/legal) page.

**Scope:** Intelligence lifecycle operations: collection planning, source intake, processing, Admiralty-style source and information grading, confidence assessment, indicator normalization and deduplication, ACTIONABLE/CONTEXTUAL/NOISE triage, enrichment, infrastructure clustering, campaign reconstruction, attribution-label reconciliation, ATT&CK mapping, Navigator layers, defensive-gap analysis, YARA authoring and testing, detection and hunting operationalization, dissemination, feedback, and professional intelligence reporting.

## Table of Contents

- [Core Concepts](#core-concepts)
- [Intelligence Lifecycle](#intelligence-lifecycle)
- [Intelligence Requirements](#intelligence-requirements)
- [Intelligence Levels](#intelligence-levels)
- [Collection and Source Intake](#collection-and-source-intake)
- [Processing and Provenance](#processing-and-provenance)
- [Source Reliability Assessment](#source-reliability-assessment)
- [Information Credibility Assessment](#information-credibility-assessment)
- [Admiralty Code](#admiralty-code)
- [Confidence Language](#confidence-language)
- [Facts, Assessments, and Assumptions](#facts-assessments-and-assumptions)
- [Conflicting Intelligence](#conflicting-intelligence)
- [Attribution Label Reconciliation](#attribution-label-reconciliation)
- [Indicator Normalization](#indicator-normalization)
- [Indicator Deduplication](#indicator-deduplication)
- [Indicator Triage](#indicator-triage)
- [Actionable, Contextual, and Noise](#actionable-contextual-and-noise)
- [Enrichment Workflow](#enrichment-workflow)
- [Domain and IP Enrichment](#domain-and-ip-enrichment)
- [Certificate and Passive DNS Enrichment](#certificate-and-passive-dns-enrichment)
- [Reputation Enrichment](#reputation-enrichment)
- [Infrastructure Clustering](#infrastructure-clustering)
- [Pivot Analysis](#pivot-analysis)
- [Campaign Reconstruction](#campaign-reconstruction)
- [ATT&CK Mapping](#attck-mapping)
- [Observed and Inferred Techniques](#observed-and-inferred-techniques)
- [ATT&CK Navigator Layer](#attck-navigator-layer)
- [Detection Gap Analysis](#detection-gap-analysis)
- [YARA Fundamentals](#yara-fundamentals)
- [YARA Rule Development](#yara-rule-development)
- [YARA Testing and Metrics](#yara-testing-and-metrics)
- [Operationalization](#operationalization)
- [Intelligence Brief](#intelligence-brief)
- [Intelligence Package](#intelligence-package)
- [Quality Gates](#quality-gates)
- [Professional Judgment](#professional-judgment)
- [Framework and Tool Map](#framework-and-tool-map)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Concepts

| Term                         | Meaning                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------- |
| **Threat data**              | Raw observations such as domains, IPs, hashes, events, and reports               |
| **Threat information**       | Processed data with source, time, context, and relationships                     |
| **Threat intelligence**      | Analyzed information that supports a decision or defensive action                |
| **Intelligence requirement** | Question the intelligence process must answer                                    |
| **Indicator**                | Observable value associated with activity or infrastructure                      |
| **TTP**                      | Tactic, technique, or procedure describing adversary behavior                    |
| **Enrichment**               | Adding contextual data to an indicator or observation                            |
| **Cluster**                  | Group of related infrastructure, behavior, or activity                           |
| **Attribution**              | Assessment linking activity to an actor, group, or campaign                      |
| **Operationalization**       | Converting intelligence into detections, hunts, blocks, collection, or decisions |

### The core idea

```text
Raw sources
     ↓
Preserve provenance
     ↓
Assess reliability and credibility
     ↓
Normalize and enrich
     ↓
Analyze relationships and behavior
     ↓
Produce judgments with confidence
     ↓
Operationalize
     ↓
Collect feedback and repeat
```

Intelligence is not a list of indicators. It is an evidence-based assessment designed to support a specific decision.

## 2. Intelligence Lifecycle

The intelligence lifecycle is continuous because collection results, defensive outcomes, and stakeholder feedback change future requirements.

| Phase             | Purpose                                                          | Typical output             |
| ----------------- | ---------------------------------------------------------------- | -------------------------- |
| **Direction**     | Define priorities and questions                                  | Intelligence requirements  |
| **Collection**    | Acquire relevant internal and external data                      | Source inventory           |
| **Processing**    | Parse, normalize, deduplicate, and preserve provenance           | Structured records         |
| **Analysis**      | Evaluate evidence, alternatives, relationships, and implications | Assessments                |
| **Dissemination** | Deliver intelligence in the format needed by consumers           | Brief, feed, rules, report |
| **Feedback**      | Measure usefulness and identify gaps                             | Updated requirements       |

### Lifecycle question

```text
What decision must this intelligence support?
```

Without a decision requirement, collection expands without limit and produces data rather than intelligence.

## 3. Intelligence Requirements

Requirements keep the analysis bounded and relevant.

### Example requirements

| Requirement                             | Consumer                | Decision supported             |
| --------------------------------------- | ----------------------- | ------------------------------ |
| Which indicators can be blocked safely? | Network defense         | Preventive control             |
| Which behaviors should be detected?     | Detection engineering   | Rule development               |
| Which systems need hunting?             | SOC and threat hunting  | Investigation scope            |
| Which campaign stages are visible?      | SOC leadership          | Coverage investment            |
| Is attribution supported?               | Executives and partners | Communication and risk context |
| Which collections are missing?          | Security engineering    | Telemetry improvement          |

### Requirement record

```json
{
  "requirement_id": "IR-001",
  "question": "Which campaign indicators are safe for automated blocking?",
  "consumer": "network_defense",
  "priority": "high",
  "decision_deadline_utc": "2026-10-20T12:00:00Z",
  "acceptance_criteria": [
    "Indicator has current malicious evidence",
    "False-positive risk is low",
    "Source and enrichment are documented"
  ]
}
```

## 4. Intelligence Levels

| Level           | Focus                                                           | Example output                       |
| --------------- | --------------------------------------------------------------- | ------------------------------------ |
| **Strategic**   | Business risk, trends, targeting, and investment                | Executive threat brief               |
| **Operational** | Campaign goals, stages, infrastructure, and likely next actions | Campaign assessment                  |
| **Tactical**    | TTPs, detections, hunting logic, and control gaps               | ATT&CK mapping and detection backlog |
| **Technical**   | Domains, IPs, hashes, certificates, and signatures              | IOC database and YARA rules          |

### Level rule

The same source can support several intelligence levels, but the language and detail must match the consumer.

## 5. Collection and Source Intake

Collect internal evidence and external reporting without merging away source identity.

### Source categories

| Source                            | Strength                                  | Common limitation                              |
| --------------------------------- | ----------------------------------------- | ---------------------------------------------- |
| **Government or sector advisory** | Sector context and vetted reporting       | May redact sensitive details                   |
| **Commercial feed**               | Scale and enrichment                      | Noise, opaque scoring, shared infrastructure   |
| **Research publication**          | Technical depth and pivots                | Attribution may be speculative                 |
| **Internal investigation**        | Direct relevance and first-party evidence | Narrow visibility and limited external context |
| **Sample corpus**                 | Testable artifacts                        | May not represent all campaign variants        |

### Source inventory fields

| Field                 | Purpose                                          |
| --------------------- | ------------------------------------------------ |
| **source_id**         | Stable source identifier                         |
| **publisher**         | Originating organization or analyst              |
| **title**             | Source title                                     |
| **published_at_utc**  | Publication time                                 |
| **received_at_utc**   | Intake time                                      |
| **handling**          | TLP, license, or sharing restrictions            |
| **source_type**       | Advisory, feed, blog, internal report, or corpus |
| **sha256**            | Artifact integrity                               |
| **reliability_grade** | Source assessment                                |

## 6. Processing and Provenance

Processing converts heterogeneous sources into structured records while retaining origin and transformation history.

### Processing stages

```text
Inventory source
     ↓
Hash and preserve original
     ↓
Parse claims, indicators, behaviors, and references
     ↓
Normalize types and timestamps
     ↓
Deduplicate with provenance retained
     ↓
Validate schema
```

### Provenance fields

| Field                 | Purpose                                            |
| --------------------- | -------------------------------------------------- |
| **source_id**         | Original source                                    |
| **source_record_id**  | Line, section, or entry reference                  |
| **extracted_at_utc**  | Processing time                                    |
| **extractor_version** | Reproducibility                                    |
| **original_value**    | Value exactly as published                         |
| **normalized_value**  | Canonical analysis value                           |
| **transforms**        | Defanging, casing, decoding, or parsing operations |

## 7. Source Reliability Assessment

Source reliability evaluates the source separately from the specific claim.

### Reliability factors

- Historical accuracy.
- Access to primary evidence.
- Technical competence.
- Editorial or review process.
- Transparency of methodology.
- Incentives, bias, or commercial pressure.
- Correction history.
- Independence from other sources.

### Reliability rule

A generally reliable source can publish an incorrect claim. A weak source can publish a correct claim. Never allow source reputation to replace claim assessment.

## 8. Information Credibility Assessment

Information credibility evaluates one claim using corroboration, internal logic, consistency, and direct evidence.

### Credibility factors

| Factor                      | Question                                              |
| --------------------------- | ----------------------------------------------------- |
| **Corroboration**           | Is the claim supported independently?                 |
| **Primary evidence**        | Are logs, samples, screenshots, or records available? |
| **Consistency**             | Does it fit verified facts?                           |
| **Specificity**             | Is the claim precise enough to test?                  |
| **Freshness**               | Is the information still relevant?                    |
| **Contradiction**           | Does reliable evidence disagree?                      |
| **Alternative explanation** | Is there a plausible benign or unrelated cause?       |

### Claim record

```json
{
  "claim_id": "CLM-017",
  "claim": "The campaign uses service-based persistence",
  "source_id": "SRC-HC3-001",
  "supporting_evidence": ["sample-03", "incident-04"],
  "contradictory_evidence": [],
  "information_grade": 1,
  "assessment": "confirmed by independent sources"
}
```

## 9. Admiralty Code

The Admiralty-style method grades source reliability and information credibility independently.

### Source reliability grades

| Grade | Meaning                      |
| ----- | ---------------------------- |
| **A** | Completely reliable          |
| **B** | Usually reliable             |
| **C** | Fairly reliable              |
| **D** | Not usually reliable         |
| **E** | Unreliable                   |
| **F** | Reliability cannot be judged |

### Information credibility grades

| Grade | Meaning                          |
| ----- | -------------------------------- |
| **1** | Confirmed by independent sources |
| **2** | Probably true                    |
| **3** | Possibly true                    |
| **4** | Doubtful                         |
| **5** | Improbable                       |
| **6** | Truth cannot be judged           |

### Combined examples

```text
A1 = highly reliable source and independently confirmed information
B2 = usually reliable source and information assessed probably true
F3 = source history unknown and information assessed possibly true
```

### Scoring caution

The combined code describes evidence quality. It does not automatically set technical severity or business impact.

## 10. Confidence Language

Confidence describes the strength of the analytical judgment, not the seriousness of the threat.

| Confidence   | Use when                                                                    |
| ------------ | --------------------------------------------------------------------------- |
| **High**     | Multiple reliable sources and direct evidence support one explanation       |
| **Moderate** | Evidence supports the judgment, but a meaningful gap or alternative remains |
| **Low**      | Evidence is limited, weakly corroborated, or supports several explanations  |

### Confidence statement

```text
We assess with moderate confidence that the two infrastructure clusters support the same campaign because they share certificate and malware configuration patterns, but ownership cannot be confirmed.
```

### Confidence rule

Always state the reasons for confidence and the evidence that would raise or lower it.

## 11. Facts, Assessments, and Assumptions

| Type            | Meaning                                   | Example                                        |
| --------------- | ----------------------------------------- | ---------------------------------------------- |
| **Fact**        | Directly supported observation            | Two samples contact the same domain            |
| **Assessment**  | Analytical judgment derived from evidence | The domain likely supports command and control |
| **Assumption**  | Unverified condition used temporarily     | The feed timestamps use UTC                    |
| **Hypothesis**  | Testable explanation                      | Two clusters may share an operator             |
| **Requirement** | Information needed to decide              | Obtain sample configuration from cluster B     |

### Writing rule

Do not write an assessment as though it were a fact. Label assumptions and revisit them when new evidence arrives.

## 12. Conflicting Intelligence

Conflicts are normal because sources have different access, timing, methods, and confidence thresholds.

### Reconciliation workflow

```text
Separate exact claims
     ↓
Compare source access and publication time
     ↓
Identify shared primary evidence
     ↓
List contradictions explicitly
     ↓
Test alternative hypotheses
     ↓
Issue bounded judgment with confidence
```

### Conflict record

| Field                | Purpose                             |
| -------------------- | ----------------------------------- |
| **topic**            | Claim under dispute                 |
| **source_positions** | What each source says               |
| **shared_evidence**  | Facts accepted across sources       |
| **contradictions**   | Specific disagreements              |
| **assessment**       | Current analytical judgment         |
| **confidence**       | Strength of judgment                |
| **collection_gap**   | Evidence needed to resolve conflict |

## 13. Attribution Label Reconciliation

Campaign and actor names are labels, not proof that sources describe the same entity.

### Recommended model

```text
One internal activity cluster ID
+ external aliases
+ source-specific confidence
+ explicit relationship assessment
```

### Alias record

```json
{
  "internal_cluster": "HEALTHBANE",
  "aliases": [
    { "name": "VITALSCORE", "source_id": "SRC-COMM-001" },
    { "name": "APT-MEDAGENT", "source_id": "SRC-RES-001" }
  ],
  "relationship": "partial_overlap_assessed",
  "confidence": "moderate",
  "reasoning": [
    "Shared phishing infrastructure pattern",
    "Overlapping sample configuration",
    "Different attribution claims remain unresolved"
  ]
}
```

### Attribution rule

Use campaign or activity-cluster language unless actor identity is supported by strong, independently corroborated evidence.

## 14. Indicator Normalization

Normalize values so equivalent indicators compare correctly.

### Normalization rules

| Type                        | Canonical approach                                               |
| --------------------------- | ---------------------------------------------------------------- |
| **Domain**                  | Lowercase, remove trailing dot, preserve original                |
| **URL**                     | Parse scheme, host, port, path, and query separately             |
| **IPv4 and IPv6**           | Canonical address representation                                 |
| **Hash**                    | Lowercase and validate expected length and alphabet              |
| **Email address**           | Separate local part and domain; preserve case-sensitive original |
| **Certificate fingerprint** | Remove separators and normalize case                             |
| **Filename**                | Preserve exact value plus normalized comparison value            |
| **Timestamp**               | UTC ISO 8601 with original value retained                        |

### Indicator schema

```json
{
  "indicator_id": "IOC-00001",
  "type": "domain",
  "value_original": "Example-Domain.invalid.",
  "value_normalized": "example-domain.invalid",
  "first_seen_utc": "2026-09-01T08:00:00Z",
  "last_seen_utc": "2026-09-12T16:30:00Z",
  "sources": ["SRC-HC3-001", "SRC-INT-001"],
  "campaign": "HEALTHBANE"
}
```

## 15. Indicator Deduplication

Deduplication merges equivalent values without losing source-level differences.

### Deduplication keys

| Type            | Key                                                     |
| --------------- | ------------------------------------------------------- |
| **Domain**      | Normalized domain                                       |
| **IP**          | Canonical address                                       |
| **URL**         | Canonicalized components according to documented policy |
| **Hash**        | Algorithm plus normalized digest                        |
| **Certificate** | Fingerprint algorithm plus digest                       |
| **Email**       | Full normalized address with original retained          |

### Merge rule

Combine source references, first and last seen, relationships, and enrichment entries. Do not overwrite conflicting confidence, classification, or role values.

## 16. Indicator Triage

Triage decides what the organization should do with each indicator.

### Triage questions

- Is the value specific enough to act on?
- Is the evidence current?
- Does the indicator belong to dedicated or shared infrastructure?
- Is malicious use confirmed or only associated?
- Could blocking disrupt legitimate business?
- Is the indicator visible in available telemetry?
- Which action is reversible?
- How quickly is the indicator likely to decay?

### Triage record

```json
{
  "indicator_id": "IOC-00001",
  "classification": "ACTIONABLE",
  "recommended_actions": ["block", "retro_hunt", "alert"],
  "confidence": "high",
  "false_positive_risk": "low",
  "decay": "short_lived",
  "review_at_utc": "2026-10-25T00:00:00Z"
}
```

## 17. Actionable, Contextual, and Noise

| Class          | Meaning                                                                               | Typical handling                                        |
| -------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **ACTIONABLE** | Specific, current, sufficiently supported, and low enough risk for a defensive action | Block, alert, hunt, or isolate through approved process |
| **CONTEXTUAL** | Useful for correlation or understanding but unsafe for direct blocking                | Enrich, monitor, score, or use in investigations        |
| **NOISE**      | Unsupported, malformed, expired, overly broad, or demonstrably unrelated              | Retain with reason, exclude from active use             |

### Examples

| Indicator                            | Likely class | Reason                                          |
| ------------------------------------ | ------------ | ----------------------------------------------- |
| Confirmed malicious attachment hash  | ACTIONABLE   | Specific and low collision risk                 |
| Dedicated credential-harvest domain  | ACTIONABLE   | Strong role and low benign overlap              |
| Shared cloud-hosting IP              | CONTEXTUAL   | High legitimate-use risk                        |
| Registrar name                       | CONTEXTUAL   | Infrastructure context, not malicious by itself |
| Private IP from another organization | NOISE        | Not globally actionable                         |
| Malformed hash                       | NOISE        | Cannot be matched reliably                      |

### Classification rule

NOISE does not mean delete. Preserve the value, source, and exclusion reason for auditability.

## 18. Enrichment Workflow

Enrichment adds context but can also introduce new errors.

```text
Start with preserved indicator
     ↓
Query approved passive sources
     ↓
Record retrieval time and source
     ↓
Store raw enrichment result
     ↓
Extract relationships and context
     ↓
Reassess confidence and action
```

### Enrichment fields

| Field                 | Purpose                                              |
| --------------------- | ---------------------------------------------------- |
| **provider**          | Enrichment source                                    |
| **retrieved_at_utc**  | Freshness                                            |
| **query_value**       | Indicator submitted                                  |
| **result**            | Raw or referenced response                           |
| **relationship**      | Resolved IP, certificate, domain, or reputation link |
| **confidence_effect** | Increased, decreased, or unchanged                   |
| **limitations**       | Visibility, privacy, or source caveats               |

## 19. Domain and IP Enrichment

### Domain context

- Registration date and registrar.
- Nameservers.
- Registrant pattern where legally available.
- Current and historical DNS resolutions.
- Certificate names.
- Hosting provider and ASN.
- Related URLs or samples.
- First and last observed times.

### IP context

- ASN and network owner.
- Hosting, residential, CDN, VPN, or cloud classification.
- Reverse DNS.
- Passive DNS names.
- Co-hosted domains.
- Geolocation as weak context only.
- Abuse and reputation history.

### Safety rule

Prefer passive enrichment. Direct DNS, HTTP, or TLS interaction can disclose investigative interest and may alter attacker behavior.

## 20. Certificate and Passive DNS Enrichment

Certificate transparency and passive DNS create historical infrastructure relationships.

### Certificate pivots

| Pivot                         | Value                                      |
| ----------------------------- | ------------------------------------------ |
| **Fingerprint**               | Exact certificate reuse                    |
| **Subject alternative names** | Related domains on one certificate         |
| **Issuer and validity**       | Deployment patterns                        |
| **Serial number**             | Certificate identity context               |
| **Public key**                | Stronger reuse relationship when available |

### Passive DNS pivots

| Pivot                    | Value                        |
| ------------------------ | ---------------------------- |
| Domain to historical IP  | Infrastructure migration     |
| IP to historical domains | Co-hosting and related names |
| First and last seen      | Timeline support             |
| Nameserver reuse         | Registration pattern         |
| Resolution overlap       | Cluster relationship         |

### Enrichment caution

Co-hosting and shared certificate services can create false relationships. Require more than one weak pivot before clustering infrastructure.

## 21. Reputation Enrichment

Reputation platforms aggregate detections, submissions, relationships, and community context.

### Safe use

- Check organizational policy before submitting files, URLs, or domains.
- Prefer hash lookups for sensitive files when allowed.
- Record detection count and vendor disagreement rather than only a final label.
- Distinguish first-party analysis from community comments.
- Record retrieval time because reputation changes.
- Treat zero detections as absence of known detection, not proof of safety.

### Reputation record

```json
{
  "indicator_id": "IOC-00022",
  "provider": "approved_reputation_service",
  "retrieved_at_utc": "2026-10-08T12:00:00Z",
  "malicious_detections": 14,
  "total_engines": 72,
  "assessment": "supporting evidence only",
  "confidence_effect": "increased"
}
```

## 22. Infrastructure Clustering

Cluster infrastructure using multiple independent features.

### Clustering features

| Feature                           | Relative value                 |
| --------------------------------- | ------------------------------ |
| Exact malware configuration value | Strong                         |
| Reused certificate or public key  | Strong when not shared service |
| Dedicated IP overlap              | Strong                         |
| Domain naming and path template   | Medium                         |
| Registrar and registration timing | Medium                         |
| Nameserver reuse                  | Medium                         |
| Hosting provider or ASN           | Weak alone                     |
| Visual similarity                 | Weak alone                     |
| Shared public cloud IP            | Weak                           |

### Cluster record

```json
{
  "cluster_id": "INFRA-CLUSTER-A",
  "nodes": ["IOC-00001", "IOC-00007", "IOC-00022"],
  "shared_features": [
    "same certificate public key",
    "same phishing path pattern",
    "registration within 24 hours"
  ],
  "assessment": "likely shared campaign infrastructure",
  "confidence": "high"
}
```

## 23. Pivot Analysis

A pivot expands from one known observation to related evidence.

### Useful pivots

```text
Domain → IP → co-hosted domains
Domain → certificate → related names
Hash → contacted domains → infrastructure
Email sender → Return-Path → sending provider
URL path → similar URLs → campaign template
Sample configuration → campaign ID → additional samples
```

### Pivot rule

Record the exact relationship that justifies every pivot. Do not treat search-result proximity as a relationship.

## 24. Campaign Reconstruction

Reconstruct the campaign from confirmed events and carefully marked inference.

### Campaign stages

| Stage                   | Evidence examples                               |
| ----------------------- | ----------------------------------------------- |
| **Targeting**           | Healthcare-themed lures and recipient selection |
| **Initial access**      | Phishing links or attachments                   |
| **Execution**           | User execution, scripts, or document behavior   |
| **Persistence**         | Service, task, registry, or account changes     |
| **Command and control** | Domains, protocols, beaconing, and certificates |
| **Collection**          | Staging paths, archives, or targeted data       |
| **Exfiltration**        | Network channel and destination                 |
| **Impact**              | Encryption, disruption, fraud, or data exposure |

### Reconstruction record

```json
{
  "campaign": "HEALTHBANE",
  "stage": "persistence",
  "status": "observed_external",
  "evidence": ["SRC-HC3-001:section-4", "sample-03"],
  "assessment": "Service-based persistence is confirmed in two external incidents",
  "confidence": "high",
  "internal_visibility": "detectable_with_current_service_logs"
}
```

## 25. ATT&CK Mapping

ATT&CK provides a common language for adversary behavior. Tactics represent why an adversary acts, techniques represent how goals are achieved, and sub-techniques describe behavior more specifically.

### Mapping record

| Field              | Purpose                            |
| ------------------ | ---------------------------------- |
| **technique_id**   | Technique or sub-technique         |
| **status**         | OBSERVED or INFERRED               |
| **evidence_refs**  | Supporting source references       |
| **campaign_stage** | Position in reconstructed activity |
| **confidence**     | Mapping strength                   |
| **data_sources**   | Telemetry required for detection   |
| **coverage**       | Covered, partial, gap, or unknown  |

### Mapping rule

Do not map a technique only because it is common for similar actors. Map observed behavior directly, or label the mapping INFERRED with reasoning.

## 26. Observed and Inferred Techniques

| Status           | Definition                                                | Required support                                 |
| ---------------- | --------------------------------------------------------- | ------------------------------------------------ |
| **OBSERVED**     | Direct evidence describes behavior matching the technique | Sample, log, PCAP, or detailed incident evidence |
| **INFERRED**     | Behavior is plausible but not directly visible            | Explicit reasoning and confidence                |
| **NOT OBSERVED** | Reviewed evidence does not show the behavior              | Scope and visibility statement                   |
| **UNKNOWN**      | Collection cannot determine whether behavior occurred     | Identified collection gap                        |

### Example

```json
{
  "technique_id": "T1543.003",
  "status": "OBSERVED",
  "evidence_refs": ["sample-03", "SRC-HC3-001:section-4"],
  "confidence": "high"
}
```

## 27. ATT&CK Navigator Layer

ATT&CK Navigator layers can visualize campaign techniques, confidence, and defensive coverage.

### Layer design

| Color or score | Meaning                                          |
| -------------- | ------------------------------------------------ |
| High score     | Observed and high-confidence technique           |
| Medium score   | Observed with limitations or moderate confidence |
| Low score      | Inferred technique                               |
| Separate color | Detection gap                                    |
| Comment        | Evidence reference and status                    |

### Minimal layer example

```json
{
  "name": "HEALTHBANE Campaign",
  "versions": {
    "attack": "current-at-analysis-time",
    "navigator": "current-at-analysis-time",
    "layer": "4.5"
  },
  "domain": "enterprise-attack",
  "description": "Observed and inferred campaign behavior",
  "techniques": [
    {
      "techniqueID": "T1566.002",
      "score": 90,
      "comment": "OBSERVED: credential-harvesting links"
    },
    {
      "techniqueID": "T1543.003",
      "score": 90,
      "comment": "OBSERVED externally: service persistence"
    }
  ]
}
```

### Layer rule

Record the ATT&CK version used. Technique definitions and identifiers can evolve.

## 28. Detection Gap Analysis

A mapped technique becomes a defensive requirement only after visibility and coverage are assessed.

### Gap states

| State              | Meaning                                                   |
| ------------------ | --------------------------------------------------------- |
| **Covered**        | Tested detection and required telemetry exist             |
| **Partial**        | Only one implementation or stage is detected              |
| **Telemetry gap**  | Detection logic is possible, but required data is missing |
| **Detection gap**  | Telemetry exists, but no validated detection exists       |
| **Validation gap** | Rule exists without labeled testing                       |
| **Not applicable** | Technique is outside documented environment scope         |

### Prioritization factors

- Observed campaign behavior.
- Business impact.
- Asset exposure.
- Likelihood of recurrence.
- Current visibility.
- Detection feasibility.
- Expected false-positive cost.
- Time required to close the gap.

## 29. YARA Fundamentals

YARA rules contain a rule identifier, optional metadata and strings, and a required condition. Strings can be text, hexadecimal, or regular-expression patterns.

### Rule sections

| Section       | Purpose                                                |
| ------------- | ------------------------------------------------------ |
| **meta**      | Description, author, reference, hash, date, confidence |
| **strings**   | Text, byte, or regular-expression patterns             |
| **condition** | Boolean logic deciding whether the rule matches        |
| **tags**      | Optional categories attached to the rule               |

### Basic rule

```yara
rule HEALTHBANE_PDF_Lure_Example
{
    meta:
        description = "Detects tested HEALTHBANE-style PDF lure characteristics"
        author = "Threat Intelligence Team"
        status = "experimental"
        confidence = "medium"

    strings:
        $pdf = { 25 50 44 46 }
        $link_a = "/URI" ascii
        $theme_a = "secure patient portal" ascii nocase
        $theme_b = "verify your account" ascii nocase

    condition:
        uint32(0) == 0x46445025 and
        $link_a and
        1 of ($theme_*) and
        filesize < 5MB
}
```

### YARA principle

Avoid rules based only on generic words or metadata. Combine structural and campaign-specific features that remain useful across variants.

## 30. YARA Rule Development

### Development sequence

```text
Study malicious samples
     ↓
Identify stable distinctive features
     ↓
Compare with benign corpus
     ↓
Write narrow rule
     ↓
Compile and test
     ↓
Inspect false positives and false negatives
     ↓
Tune and rerun regression set
```

### Rule-design guidance

| Goal             | Practice                                      |
| ---------------- | --------------------------------------------- |
| **Durability**   | Prefer behavior and structure over exact hash |
| **Specificity**  | Require multiple independent features         |
| **Transparency** | Document why every string exists              |
| **Safety**       | Scan samples without execution                |
| **Performance**  | Avoid expensive broad regular expressions     |
| **Portability**  | Use supported syntax and test engine version  |
| **Governance**   | Include owner, status, date, and reference    |

### Email-pattern rule concept

```yara
rule HEALTHBANE_Raw_Email_Pattern
{
    meta:
        description = "Matches raw email artifacts with campaign-specific header and lure patterns"
        status = "experimental"

    strings:
        $header_a = "Reply-To:" ascii nocase
        $header_b = "Authentication-Results:" ascii nocase
        $lure_a = "patient portal" ascii nocase
        $lure_b = "verify" ascii nocase
        $campaign_domain = "example-domain.invalid" ascii nocase

    condition:
        $header_a and $header_b and
        1 of ($lure_*) and
        $campaign_domain
}
```

## 31. YARA Testing and Metrics

Test rules against labeled malicious and benign samples.

### Commands

```bash
# Syntax and match test
yara rules/healthbane.yar corpus/

# Recursive scan
yara -r rules/healthbane.yar corpus/

# Show matching strings during testing
yara -s rules/healthbane.yar corpus/malicious/

# Fail on warnings when supported by the installed version
yara --fail-on-warnings rules/healthbane.yar corpus/
```

### Confusion matrix

| Actual sample | Rule matches   | Rule does not match |
| ------------- | -------------- | ------------------- |
| **Malicious** | True positive  | False negative      |
| **Benign**    | False positive | True negative       |

### Metrics

```text
precision = TP / (TP + FP)
recall = TP / (TP + FN)
false_positive_rate = FP / (FP + TN)
false_negative_rate = FN / (FN + TP)
```

### Deployment states

| State       | Meaning                                                          |
| ----------- | ---------------------------------------------------------------- |
| **Deploy**  | Quality gates pass and false-positive risk is acceptable         |
| **Monitor** | Useful signal, but not safe for blocking or automated response   |
| **Tune**    | Detection value exists, but metrics or coverage are insufficient |
| **Reject**  | Rule is too broad, brittle, redundant, or unsupported            |

## 32. Operationalization

Intelligence must produce actions matched to confidence and false-positive risk.

### Operational outputs

| Output                 | Use                                                           |
| ---------------------- | ------------------------------------------------------------- |
| **Blocklist entry**    | Prevent communication with confirmed dedicated infrastructure |
| **Alert rule**         | Detect high-confidence observable behavior                    |
| **Hunt query**         | Search historical data for contextual or uncertain indicators |
| **YARA rule**          | Detect files or raw artifacts with distinctive patterns       |
| **Collection request** | Acquire telemetry needed to resolve a gap                     |
| **Watchlist**          | Track changing infrastructure without automatic blocking      |
| **Executive brief**    | Support business and investment decisions                     |
| **Partner submission** | Share validated intelligence under appropriate handling rules |

### Action matrix

| Confidence | False-positive risk | Recommended use                            |
| ---------- | ------------------- | ------------------------------------------ |
| High       | Low                 | Block, alert, and retro-hunt               |
| High       | High                | Alert and hunt with contextual checks      |
| Moderate   | Low                 | Alert or monitor, validate before blocking |
| Moderate   | High                | Hunt and enrich                            |
| Low        | Any                 | Context, collection, and watchlist only    |

## 33. Intelligence Brief

A professional brief separates the bottom line, evidence, uncertainty, defensive impact, and next steps.

### Brief structure

| Section                    | Content                                              |
| -------------------------- | ---------------------------------------------------- |
| **Key judgment**           | Most important conclusion in one paragraph           |
| **Scope and handling**     | Sources, dates, and sharing restrictions             |
| **Campaign overview**      | Targeting, stages, infrastructure, and behavior      |
| **Source assessment**      | Reliability and credibility summary                  |
| **Confirmed findings**     | Facts and observed techniques                        |
| **Analytical assessments** | Judgments with confidence                            |
| **Indicators**             | Actionable and contextual IOC summary                |
| **Defensive posture**      | Current visibility and coverage                      |
| **Gaps**                   | Telemetry, detection, validation, and knowledge gaps |
| **Recommendations**        | Prioritized actions and owners                       |
| **Outstanding questions**  | Collection requirements and feedback request         |

### Key-judgment pattern

```text
We assess with high confidence that HEALTHBANE is a healthcare-focused credential theft and malware-delivery campaign using related but rotating infrastructure. We assess with moderate confidence that reports labeled VITALSCORE and APT-MEDAGENT partially overlap with HEALTHBANE, but available evidence does not support actor-level attribution.
```

## 34. Intelligence Package

```text
intelligence_driven_defense/
├── README.md
├── sources/
│   ├── source-inventory.json
│   └── SHA256SUMS
├── requirements/
│   └── intelligence-requirements.json
├── claims/
│   └── claims.jsonl
├── indicators/
│   ├── indicator-database.json
│   ├── actionable.json
│   ├── contextual.json
│   └── noise.json
├── enrichment/
│   └── enrichment-results.jsonl
├── infrastructure/
│   ├── clusters.json
│   └── relationships.json
├── campaign/
│   ├── campaign-assessment.json
│   └── alias-mapping.json
├── attack/
│   ├── techniques.json
│   ├── navigator-layer.json
│   └── detection-gaps.json
├── yara/
│   ├── healthbane.yar
│   ├── test-results.json
│   └── corpus-manifest.json
├── operationalization/
│   ├── detection-backlog.json
│   ├── hunting-plan.json
│   └── block-recommendations.json
├── brief/
│   └── intelligence-brief.md
├── MANIFEST.json
└── SHA256SUMS
```

### Package principle

Every assessment must trace to source claims, every indicator must retain provenance, and every rule must retain test evidence.

## 35. Quality Gates

| Gate                  | Pass condition                                                  |
| --------------------- | --------------------------------------------------------------- |
| **Requirements**      | Every major output answers a documented question                |
| **Source intake**     | Every source is inventoried, hashed, and handling-labeled       |
| **Source assessment** | Reliability and information credibility are separate            |
| **Claims**            | Facts, assessments, assumptions, and contradictions are labeled |
| **Indicators**        | Values are normalized, deduplicated, and provenance-preserving  |
| **Triage**            | Every indicator is ACTIONABLE, CONTEXTUAL, or NOISE with reason |
| **Enrichment**        | Provider, time, raw result, and confidence effect are recorded  |
| **Clusters**          | Relationships use more than one weak feature                    |
| **Attribution**       | Aliases and confidence are explicit                             |
| **ATT&CK**            | OBSERVED and INFERRED mappings are separated                    |
| **Coverage**          | Every prioritized technique has a coverage state                |
| **YARA**              | Rules compile and have labeled benign and malicious tests       |
| **Metrics**           | TP, FP, TN, FN, precision, recall, and FPR are reported         |
| **Dissemination**     | Brief matches consumer needs and handling restrictions          |
| **Integrity**         | Manifest and hashes verify                                      |

### Validation commands

```bash
find intelligence_driven_defense -name '*.json' -print0 | xargs -0 -n1 jq empty
find intelligence_driven_defense -name '*.jsonl' -print0 | while IFS= read -r -d '' file; do jq -c . "$file" >/dev/null || exit 1; done
yara intelligence_driven_defense/yara/healthbane.yar intelligence_driven_defense/yara/corpus/
sha256sum -c intelligence_driven_defense/SHA256SUMS
```

## 36. Professional Judgment

Threat intelligence analysis manages uncertainty rather than hiding it.

### Decision principles

- Source reliability and claim credibility are independent.
- Vendor confidence scores are inputs, not conclusions.
- Shared infrastructure does not automatically prove shared ownership.
- Attribution labels from different sources may partially overlap.
- A high-confidence indicator can still have high false-positive risk.
- An indicator suitable for hunting may be unsafe for blocking.
- Enrichment can reduce confidence as well as increase it.
- Zero reputation detections do not prove benign status.
- ATT&CK mappings must trace to evidence.
- Inferred techniques must never be presented as observed.
- A YARA match is a lead unless the rule and corpus support a stronger conclusion.
- Feedback from detection, hunting, and incident response restarts the cycle.

## 37. Framework and Tool Map

| Item                         | Purpose                                                                  |
| ---------------------------- | ------------------------------------------------------------------------ |
| **Intelligence lifecycle**   | Direction, collection, processing, analysis, dissemination, and feedback |
| **Admiralty Code**           | Independent source reliability and information credibility grading       |
| **CISA advisories**          | Government alerts, advisories, TTPs, IOCs, and mitigations               |
| **HHS HC3**                  | Healthcare-sector threat intelligence                                    |
| **MITRE ATT&CK**             | Common language for adversary behavior                                   |
| **ATT&CK Navigator**         | Visualize campaign behavior and defensive coverage                       |
| **WHOIS and RDAP**           | Registration context                                                     |
| **Passive DNS**              | Historical domain and IP relationships                                   |
| **Certificate transparency** | Certificate and domain pivots                                            |
| **Reputation platforms**     | Supporting detection and relationship context                            |
| **YARA**                     | File and artifact pattern matching                                       |
| **jq**                       | JSON processing and validation                                           |
| **sha256sum**                | Source, corpus, and package integrity                                    |

## 38. Fast Recall

- **Intelligence starts with a decision requirement.**
- **The lifecycle is direction, collection, processing, analysis, dissemination, and feedback.**
- **Strategic intelligence supports leadership. Operational intelligence explains campaigns. Tactical intelligence supports detections and hunts. Technical intelligence contains observables.**
- **Preserve provenance before normalization and deduplication.**
- **Assess source reliability separately from information credibility.**
- **Admiralty-style grades combine A through F source ratings with 1 through 6 information ratings.**
- **Confidence is not severity.**
- **Separate facts, assessments, assumptions, and hypotheses.**
- **Conflicting intelligence is normal and must be reconciled claim by claim.**
- **Campaign aliases do not prove actor equivalence.**
- **Normalize indicators by type and preserve original values.**
- **ACTIONABLE indicators support defensive action. CONTEXTUAL indicators support correlation. NOISE is retained with an exclusion reason.**
- **Shared cloud IPs and common hosting providers are weak cluster evidence alone.**
- **Use passive enrichment where possible and record retrieval time.**
- **Enrichment can raise or lower confidence.**
- **OBSERVED ATT&CK techniques require direct evidence. INFERRED techniques require explicit reasoning.**
- **Navigator layers should record ATT&CK version, status, evidence, and coverage.**
- **A technique mapping is not detection coverage.**
- **YARA rules need metadata, strings or patterns, and a required condition.**
- **Test YARA against both malicious and benign corpora.**
- **Report TP, FP, TN, FN, precision, recall, and false-positive rate.**
- **Operationalize intelligence through blocks, alerts, hunts, collection, watchlists, and decision support according to confidence and risk.**
- **Feedback restarts the intelligence cycle.**

## 39. Resources

**Threat intelligence and advisories**

- [CISA Cybersecurity Alerts and Advisories](https://www.cisa.gov/news-events/cybersecurity-advisories)
- [HHS HC3 Products](https://asprtracie.hhs.gov/technical-resources/resource/11041/hc3-products)

**MITRE ATT&CK**

- [MITRE ATT&CK Get Started](https://attack.mitre.org/resources/)
- [ATT&CK Data and Tools](https://attack.mitre.org/resources/attack-data-and-tools/)
- [ATT&CK Navigator](https://mitre-attack.github.io/attack-navigator/)

**OSINT and enrichment**

- [VirusTotal](https://www.virustotal.com/)
- [crt.sh](https://crt.sh/)
- [URLhaus](https://urlhaus.abuse.ch/)
- [ICANN Lookup](https://lookup.icann.org/)

**YARA**

- [YARA Documentation](https://yara.readthedocs.io/)
- [Writing YARA Rules](https://yara.readthedocs.io/en/stable/writingrules.html)

**Man or help**

```text
man yara
man grep
man jq
man whois
man dig
```
