# Applied Cryptography

> **Scope:** Securing databases, backups, TLS, authentication, and data flows using modern cryptographic controls.

---

## 1. Core Concepts

| Concept | Purpose |
|----------|---------|
| Confidentiality | Prevent unauthorized disclosure |
| Integrity | Prevent unauthorized modification |
| Availability | Ensure access when needed |
| Authentication | Verify identity |
| Non-Repudiation | Prevent denial of actions |

## 2. Symmetric vs Asymmetric Encryption

### Symmetric

- Same key encrypts and decrypts
- Fast
- Used for bulk data encryption

Examples:
- AES
- ChaCha20

### Asymmetric

- Public/private key pair
- Slower
- Solves key distribution problem

Examples:
- RSA
- ECC

TLS uses both.

## 3. Modern Algorithms

| Algorithm | Use | Status |
|------------|------|--------|
| AES-256-GCM | Data encryption | Recommended |
| ChaCha20-Poly1305 | Faster on low-power devices | Recommended |
| RSA-3072+ | Certificates | Acceptable |
| ECC P-256 | Certificates & signatures | Recommended |
| SHA-256 | Hashing | Recommended |
| SHA-3 | Hashing | Recommended |
| MD5 | Hashing | Broken |
| SHA-1 | Hashing | Broken |
| DES | Encryption | Broken |

## 4. Hashing

Properties:

- Deterministic
- One-way
- Collision resistant
- Preimage resistant

### Password Storage

Never store passwords with:

- MD5
- SHA-1
- Plain SHA-256

Use:

- bcrypt
- scrypt
- Argon2

#### Salt

Unique random value added before hashing.

#### Key Stretching

Makes brute-force attacks slower.

## 5. Diffie-Hellman

Purpose:

Secure key exchange over insecure channels.

Benefits:

- Shared secret generation
- No prior shared key required

Limitation:

Vulnerable to MiTM without authentication.

TLS solves this using certificates.

## 6. Digital Signatures

Provide:

- Integrity
- Authentication
- Non-repudiation

Workflow:

```text
Hash Data
 ↓
Sign Hash
 ↓
Verify Signature
```

## 7. Encryption vs Related Technologies

| Technology | Purpose |
|------------|---------|
| Encryption | Conceal data |
| Hashing | Verify integrity |
| Tokenization | Replace sensitive values |
| Masking | Hide partial values |
| Obfuscation | Make data harder to understand |
| Steganography | Hide data inside data |

## 8. X.509 Certificates

Important Fields:

- Subject
- Issuer
- Serial Number
- Validity Dates
- Public Key
- Signature Algorithm
- SAN Extension

Inspect:

```bash
openssl x509 -in cert.pem -text -noout
```

## 9. Chain of Trust

```text
Root CA
   ↓
Intermediate CA
   ↓
Leaf Certificate
```

Browser trust depends on the chain validating successfully.

## 10. Certificate Lifecycle

#### Generate Key

```bash
openssl genrsa -out server.key 4096
```

#### Create CSR

```bash
openssl req -new -key server.key -out server.csr
```

#### Lifecycle

Generate → CSR → Issue → Deploy → Renew → Revoke

## 11. Certificate Types

| Type | Purpose |
|--------|---------|
| Self-Signed | Testing |
| Public CA | Internet services |
| Wildcard | *.example.com |
| SAN | Multiple names |

## 12. TLS Essentials

### Use

- TLS 1.2
- TLS 1.3

### Disable

- SSL
- TLS 1.0
- TLS 1.1

### Preferred Ciphers

- AES-256-GCM
- ChaCha20-Poly1305

Avoid:

- RC4
- DES
- 3DES

## 13. OpenSSL Essentials

#### Hash File

```bash
openssl dgst -sha256 file.txt
```

#### Encrypt File

```bash
openssl enc -aes-256-cbc -salt -in secret.txt -out secret.enc
```

#### Generate Key Pair

```bash
openssl genpkey -algorithm RSA -out private.key
```

#### View Certificate

```bash
openssl x509 -text -noout -in cert.pem
```

#### Test TLS

```bash
openssl s_client -connect example.com:443
```

## 14. Data States

| State | Example | Control |
|---------|---------|---------|
| At Rest | Database | AES, LUKS |
| In Transit | HTTPS | TLS |
| In Use | Running Application | Access Controls |

## 15. Encryption Levels

| Level | Example |
|----------|---------|
| Full Disk | LUKS |
| Partition | Encrypted partition |
| Volume | Encrypted volume |
| File | Individual file |
| Database | TDE |
| Record | Field-level encryption |

## 16. LUKS

#### Format Device

```bash
cryptsetup luksFormat /dev/sdb
```

#### Open Device

```bash
cryptsetup luksOpen /dev/sdb securedata
```

#### Verify

```bash
cryptsetup status securedata
```

Use for:

- Servers
- Laptops
- Backup systems

## 17. Hardware Security

### TPM

- Secure key storage
- Measured boot

### HSM

- Dedicated cryptographic appliance
- Highest protection level

### KMS

- Centralized key management

### Secure Enclaves

- Isolated execution environments

## 18. MedDefense Decisions

| Requirement | Recommended Control |
|-------------|--------------------|
| Database Encryption | AES-256-GCM |
| Patient Portal | TLS 1.3 |
| Backup Storage | LUKS |
| DICOM Traffic | TLS |
| Certificates | CA-issued SAN certificates |
| Password Storage | Argon2 or bcrypt |

## 19. Fast Recall

- AES = symmetric encryption.
- RSA/ECC = asymmetric encryption.
- TLS uses both.
- Hashing is not encryption.
- Salt defeats rainbow tables.
- Argon2 is preferred for passwords.
- Digital signatures provide integrity and authentication.
- TLS 1.3 is preferred.
- Disable TLS 1.0 and TLS 1.1.
- LUKS protects Linux disks.
- Certificates establish trust.
- Private keys must never be shared.

## Resources

- NIST SP 800-175B
- NIST SP 800-111
- Crypto 101
- SSL Labs
- badssl.com
- OpenSSL Documentation
- cryptsetup Documentation
