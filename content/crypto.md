# Cryptography Basics

---

## 1. What is Cryptography?

**Cryptography** is the science of protecting information by transforming it into a form unreadable to anyone except the intended recipient.

The word comes from Greek:
- **kryptós** = hidden
- **graphein** = to write

So literally: "hidden writing."

### The basic idea

```
Plaintext ──[encrypt with key]──→ Ciphertext ──[decrypt with key]──→ Plaintext
"Hello"                          "X#k@9!Bz"                         "Hello"
```

Anyone intercepting the ciphertext without the key sees only garbage.

### Real-world example

When you visit `https://bank.com`:
- Your password is encrypted before leaving your browser
- It travels across the internet as scrambled bytes
- Only the bank's server can decrypt it
- Anyone sniffing the network sees only ciphertext

Without cryptography, **every password, message, and bank transaction would be visible to anyone on the network**.

---

## 2. Why Cryptography Matters

Cryptography solves four fundamental security problems — the **CIA + Non-repudiation** model:

| Problem | What cryptography provides | Example |
|---------|---------------------------|---------|
| **Confidentiality** | Only authorized people can read the data | Encrypted messages, HTTPS |
| **Integrity** | Detect if data has been changed | Hashes, digital signatures |
| **Authentication** | Prove who someone is | Digital certificates, MFA |
| **Non-repudiation** | Sender can't deny they sent it | Digital signatures |

### Where you use cryptography daily (often without knowing)

- **HTTPS** — every secure website
- **Wi-Fi (WPA2/3)** — protects your network traffic
- **Messaging** — WhatsApp, Signal, iMessage
- **Banking** — ATMs, online banking, credit cards
- **Cloud storage** — Dropbox, iCloud encryption
- **Operating systems** — disk encryption (BitLocker, FileVault, LUKS)
- **Cryptocurrencies** — Bitcoin signatures, blockchain
- **Passwords** — stored as hashes, not plaintext
- **Software updates** — signed packages prove authenticity
- **SSH** — secure remote login

---

## 3. Encryption vs Decryption

| | **Encryption** | **Decryption** |
|---|----------------|----------------|
| **What it does** | Scramble plaintext into ciphertext | Reverse it back to plaintext |
| **Input** | Plaintext + key | Ciphertext + key |
| **Output** | Ciphertext (unreadable) | Plaintext (readable) |
| **Who does it** | The sender | The recipient |

### Simple example with Caesar cipher (shift by 3)

```
Plaintext:    "HELLO"
              H→K, E→H, L→O, L→O, O→R
Ciphertext:   "KHOOR"

Decryption:   K→H, H→E, O→L, O→L, R→O
Plaintext:    "HELLO"
```

This is **trivially weak** — there are only 25 possible keys — but it shows the core concept.

---

## 4. Types of Cryptography

Three main categories:

### A) Symmetric Encryption — "Same key both ways"

```
Same key (e.g., "secret123") used to encrypt AND decrypt
```

Both parties must already share a secret key. Fast and efficient, but key distribution is hard.

**Common algorithms:**

| Algorithm | Key size | Status | Use |
|-----------|----------|--------|-----|
| **DES** | 56-bit | ❌ Broken (1990s) | Don't use |
| **3DES** | 168-bit | ⚠️ Deprecated | Legacy only |
| **AES-128** | 128-bit | ✅ Strong | Standard |
| **AES-256** | 256-bit | ✅ Very strong | High security |
| **ChaCha20** | 256-bit | ✅ Strong | Mobile, modern TLS |
| **Blowfish** | 32-448 bit | ⚠️ Aging | Legacy |

**AES (Advanced Encryption Standard)** is the gold standard for symmetric encryption today.

**Example with OpenSSL:**

```bash
# Encrypt a file with AES-256
openssl enc -aes-256-cbc -salt -in secret.txt -out secret.enc

# Decrypt it
openssl enc -aes-256-cbc -d -in secret.enc -out secret.txt
```

### B) Asymmetric Encryption — "Public + Private key pair"

Each user has **two related keys**:
- **Public key** — shared with anyone
- **Private key** — kept secret, never shared

```
Anyone uses your PUBLIC key to ENCRYPT a message → only YOU (with private key) can DECRYPT it
You use your PRIVATE key to SIGN a message → anyone with your PUBLIC key can VERIFY it
```

**Common algorithms:**

| Algorithm | Key size | Use |
|-----------|----------|-----|
| **RSA** | 2048-bit (minimum) / 4096-bit (recommended) | SSL/TLS, SSH keys, signatures |
| **ECC (Elliptic Curve)** | 256-bit (≈ RSA 3072) | Modern, smaller keys, faster |
| **Ed25519** | 256-bit | SSH keys, signatures |
| **Diffie-Hellman (DH)** | Various | Key exchange |
| **ECDH** | 256-bit+ | Elliptic-curve DH (modern) |

**Example — generate an RSA keypair:**

```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -pubout -out public.pem

# Encrypt a file with someone's public key
openssl rsautl -encrypt -inkey public.pem -pubin -in secret.txt -out secret.enc

# Decrypt with your private key
openssl rsautl -decrypt -inkey private.pem -in secret.enc -out secret.txt
```

**Example — generate an SSH key (Ed25519, the modern standard):**

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
# Creates ~/.ssh/id_ed25519 (private) and ~/.ssh/id_ed25519.pub (public)
```

### C) Hashing — "One-way fingerprint"

Not really "encryption" — there's no key, and you can't reverse it. Hashing produces a **fixed-size fingerprint** of any input.

```
Any input ──[hash function]──→ Fixed-size output (always same length)
"Hello"     →  SHA-256  →  185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969
```

Used for: passwords, integrity checks, digital signatures. More on this in section 7.

### Comparison — when to use which

| | **Symmetric** | **Asymmetric** | **Hashing** |
|---|---------------|----------------|-------------|
| **Speed** | Fast | Slow (1000× slower) | Very fast |
| **Key management** | Hard (must share secret) | Easy (share public key) | No keys |
| **Reversible?** | Yes (decrypt) | Yes (decrypt) | **No (one-way)** |
| **Use** | Bulk data encryption | Key exchange, signatures, identity | Passwords, integrity |

**In practice** — HTTPS uses **all three together**:
1. **Asymmetric** to exchange a session key (slow but secure)
2. **Symmetric** to encrypt the actual traffic (fast)
3. **Hashing** to verify integrity

---

## 5. Hash Algorithms

A **hash function** takes any input and produces a fixed-length output (the "digest" or "fingerprint").

### Key properties of a good hash

1. **Deterministic** — same input always gives same output
2. **Fast to compute** — quickly produces the hash
3. **Fixed output length** — regardless of input size
4. **Avalanche effect** — tiny input change → completely different hash
5. **One-way** — can't reverse a hash to get the input
6. **Collision-resistant** — virtually impossible to find two inputs with the same hash

### Demonstration of avalanche effect

```bash
echo -n "Hello" | sha256sum
# 185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969

echo -n "hello" | sha256sum     # tiny change (capital → lowercase)
# 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824

# Output is completely different even though only one bit changed
```

### Common hash algorithms

| Algorithm | Output size | Status | Use |
|-----------|-------------|--------|-----|
| **MD5** | 128 bits (32 hex chars) | ❌ Broken (collisions found 2004) | File integrity only (NOT security) |
| **SHA-1** | 160 bits | ❌ Broken (collisions found 2017) | Don't use |
| **SHA-256** | 256 bits | ✅ Strong | Current standard |
| **SHA-512** | 512 bits | ✅ Very strong | High security |
| **SHA-3** | Variable | ✅ Strong | Modern alternative |
| **bcrypt** | 192 bits | ✅ Strong (for passwords) | Password hashing |
| **scrypt** | Variable | ✅ Strong (for passwords) | Memory-hard hashing |
| **Argon2** | Variable | ✅ State of the art | Best password hashing |

### SHA — Secure Hash Algorithm

**SHA** = **Secure Hash Algorithm**, a family of hash functions designed by the NSA and published by NIST.

The family:

| Version | Year | Output | Status |
|---------|------|--------|--------|
| **SHA-0** | 1993 | 160-bit | Withdrawn (had flaws) |
| **SHA-1** | 1995 | 160-bit | ❌ Broken |
| **SHA-2** | 2001 | 224/256/384/512-bit | ✅ Current standard (SHA-256, SHA-512) |
| **SHA-3** | 2015 | 224/256/384/512-bit | ✅ Modern alternative (different design) |

**When someone says "SHA," they usually mean SHA-2 (specifically SHA-256).**

### Hash commands

```bash
# Compute hashes
echo -n "Hello" | md5sum
echo -n "Hello" | sha1sum
echo -n "Hello" | sha256sum
echo -n "Hello" | sha512sum

# Hash a file
sha256sum file.txt

# Verify a downloaded file matches a published hash
sha256sum -c checksums.txt
```

### Why password hashing is different

Regular hashes (SHA-256) are **too fast** — attackers can try billions per second. For passwords, use **slow, salted** algorithms:

| Algorithm | Why it's good for passwords |
|-----------|---------------------------|
| **bcrypt** | Configurable cost factor, slow by design |
| **scrypt** | Memory-hard — resists GPU/ASIC attacks |
| **Argon2** | Winner of the Password Hashing Competition (2015) — current best practice |

**Salt** = random data added to the password before hashing, so two users with the same password get different hashes. Prevents rainbow table attacks.

---

## 6. Applications of Cryptography

### A) Securing communications

| Application | Cryptography used |
|-------------|------------------|
| **HTTPS (TLS)** | RSA/ECDH for key exchange, AES for traffic, SHA-256 for integrity |
| **SSH** | RSA/Ed25519 for auth, AES/ChaCha20 for traffic |
| **VPN** | IPsec, OpenVPN — symmetric encryption |
| **Email (PGP/GPG)** | Asymmetric for keys, symmetric for content |
| **Messaging (Signal/WhatsApp)** | Double Ratchet algorithm (forward secrecy) |

### B) Storing data securely

- **Full disk encryption** — LUKS (Linux), BitLocker (Windows), FileVault (macOS)
- **Encrypted file containers** — VeraCrypt
- **Encrypted databases** — TDE (Transparent Data Encryption)
- **Password managers** — encrypted vaults (1Password, Bitwarden, KeePass)

### C) Authentication

- **Password hashing** — store hashes, not plaintext
- **Digital certificates** — SSL/TLS for websites
- **JWT (JSON Web Tokens)** — signed authentication tokens
- **MFA (Multi-Factor Auth)** — TOTP codes use HMAC + time

### D) Integrity checks

- **Checksums** — SHA-256 to verify downloads
- **Code signing** — verifies software comes from trusted publisher
- **Git** — uses SHA-1 (transitioning to SHA-256) to identify commits
- **Blockchain** — chains of hashes form an immutable record

### E) Digital signatures

A way to prove **authenticity** and **non-repudiation**:

```
1. You hash a document.
2. You encrypt the hash with your PRIVATE key.
3. Recipient decrypts with your PUBLIC key to get the hash.
4. They hash the document themselves.
5. If hashes match: you definitely signed it, and it's unchanged.
```

Used for: code signing, document signing, software updates, cryptocurrency transactions.

---

## 7. OpenSSL — The Swiss Army Knife

**OpenSSL** is the most widely used cryptography toolkit. It provides:
- Encryption / decryption
- Hashing
- Key generation
- Certificate management
- SSL/TLS testing

### Basic syntax

```bash
openssl <command> [options]
```

### Encryption / Decryption

```bash
# Encrypt a file with AES-256 (interactive password prompt)
openssl enc -aes-256-cbc -salt -in file.txt -out file.enc -pbkdf2

# Decrypt
openssl enc -aes-256-cbc -d -in file.enc -out file.txt -pbkdf2

# Base64 encode (not encryption, just encoding)
openssl enc -base64 -in file.txt -out file.b64
openssl enc -base64 -d -in file.b64 -out file.txt
```

### Hashing

```bash
# Hash a string
echo -n "Hello" | openssl dgst -sha256
echo -n "Hello" | openssl dgst -md5
echo -n "Hello" | openssl dgst -sha512

# Hash a file
openssl dgst -sha256 file.txt
```

### Key generation

```bash
# Generate RSA private key (2048 bit)
openssl genrsa -out private.pem 2048

# Generate RSA private key with stronger size
openssl genrsa -out private.pem 4096

# Extract public key from private key
openssl rsa -in private.pem -pubout -out public.pem

# Generate elliptic curve key (more modern, smaller)
openssl ecparam -genkey -name prime256v1 -out ec_private.pem
openssl ec -in ec_private.pem -pubout -out ec_public.pem

# View key details
openssl rsa -in private.pem -text -noout
```

### Random data generation

```bash
# Generate random bytes
openssl rand -base64 32       # 32 random bytes, base64 encoded
openssl rand -hex 16          # 16 random bytes, hex encoded
openssl rand -out key.bin 32  # write 32 random bytes to a file

# Generate a random password
openssl rand -base64 16
```

### Certificate operations

```bash
# Create a self-signed certificate (1 year)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# View certificate details
openssl x509 -in cert.pem -text -noout

# Check a remote site's certificate
openssl s_client -connect google.com:443 -servername google.com

# Convert formats
openssl x509 -in cert.pem -outform DER -out cert.der    # PEM → DER
openssl x509 -in cert.der -inform DER -out cert.pem     # DER → PEM
```

### Useful one-liners

```bash
# Generate a strong password
openssl rand -base64 16

# Verify a file's SHA-256 matches a published hash
openssl dgst -sha256 ubuntu.iso

# Test if a website supports TLS 1.3
openssl s_client -connect example.com:443 -tls1_3

# See certificate expiration
echo | openssl s_client -connect example.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## 8. John the Ripper — Password Cracker

**John the Ripper** (or simply "John") is one of the most popular password-cracking tools, used by penetration testers and forensic examiners.

### What it does

Given a **hash** (e.g., from a leaked database, a captured file, or an encrypted file), John tries to find the **original password** by:
- Trying words from dictionaries
- Mutating them with rules (capitalize, append numbers, etc.)
- Brute-forcing all character combinations

### Installation

```bash
# Kali (pre-installed) or Debian/Ubuntu
sudo apt install john

# Test it works
john --help
```

### Basic usage workflow

```bash
# 1. Get the hash into a file (one hash per line)
echo 'user:$6$salt$hashedpassword...' > hashes.txt

# 2. Run John (uses default modes automatically)
john hashes.txt

# 3. View cracked passwords
john --show hashes.txt
```

### John's three attack modes (in order)

| Mode | What it does |
|------|-------------|
| **Single crack** | Tries usernames + simple variations as passwords |
| **Wordlist** | Tries each word from a wordlist (with optional rules) |
| **Incremental (brute-force)** | Tries every combination — slow, but exhaustive |

### Wordlist mode

```bash
# Use a specific wordlist
john --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt

# With rules (mutations like capitalize, append numbers)
john --wordlist=rockyou.txt --rules hashes.txt

# Specific rule set
john --wordlist=rockyou.txt --rules=Wordlist hashes.txt
```

### Specifying hash format

John auto-detects, but for tricky cases specify it:

```bash
# Linux shadow file hash (SHA-512)
john --format=sha512crypt hashes.txt

# MD5
john --format=raw-md5 hashes.txt

# Windows NTLM
john --format=NT hashes.txt

# List all supported formats
john --list=formats
```

### Cracking different hash types

```bash
# Linux /etc/shadow (need root + unshadow)
sudo unshadow /etc/passwd /etc/shadow > combined.txt
john combined.txt

# ZIP file password
zip2john secret.zip > zip_hash.txt
john zip_hash.txt

# RAR file password
rar2john archive.rar > rar_hash.txt
john rar_hash.txt

# PDF password
pdf2john.pl secret.pdf > pdf_hash.txt
john pdf_hash.txt

# SSH key passphrase
ssh2john id_rsa > ssh_hash.txt
john ssh_hash.txt

# OpenSSL encrypted file
# (Convert manually — John supports various formats)
```

### Viewing results and managing sessions

```bash
# Show all cracked passwords
john --show hashes.txt

# Show with format
john --show --format=sha512crypt hashes.txt

# Resume a previous session
john --restore

# Save and resume named session
john --session=crackrun hashes.txt
john --restore=crackrun
```

### Speed tips

```bash
# Use multiple CPU cores
john --wordlist=rockyou.txt --fork=4 hashes.txt

# Show cracking speed
john --test
```

### John's password storage

Cracked passwords go to `~/.john/john.pot`. To start fresh:

```bash
rm ~/.john/john.pot
```

---

## 9. Advanced Hash Cracking with John

### Custom wordlists

The default `rockyou.txt` (~14 million passwords) is great, but for targeted attacks make custom wordlists:

```bash
# Create from a website with cewl
cewl https://target.com -d 2 -m 6 -w wordlist.txt

# Combine multiple wordlists, remove duplicates
cat wordlist1.txt wordlist2.txt | sort -u > combined.txt
```

### Mask attack — when you know part of the password

If you know the password is 8 characters, starts with uppercase, ends with year (2024 or 2025):

```bash
john --mask='?u?l?l?l?l2024' hashes.txt
john --mask='?u?l?l?l?l2025' hashes.txt
```

**Mask characters:**

| Character | Matches |
|-----------|---------|
| `?l` | lowercase a-z |
| `?u` | uppercase A-Z |
| `?d` | digits 0-9 |
| `?s` | special characters |
| `?a` | all printable ASCII |

### Incremental mode (pure brute-force)

```bash
# All lowercase letters
john --incremental=Lower hashes.txt

# All ASCII
john --incremental=ASCII hashes.txt

# Custom: length 6-8, only digits
# (configure in john.conf first)
```

### Custom rules

John has rule sets that mutate words. You can create your own in `/etc/john/john.conf`:

```
[List.Rules:MyRule]
A0"123"                   # Append "123"
A0"!"                     # Append "!"
$1$2$3                    # Append "123" (alternative)
c                         # Capitalize first letter
sa@                       # Substitute "a" with "@"
```

Use it:

```bash
john --wordlist=rockyou.txt --rules=MyRule hashes.txt
```

---

## 10. Hashcat — The GPU-Accelerated Cracker

**Hashcat** is "the world's fastest password cracker" — it runs on **GPUs**, which can be 100-1000× faster than CPU cracking.

### Hashcat vs John

| | **John the Ripper** | **Hashcat** |
|---|---------------------|-------------|
| **Best for** | CPU work, fewer hash types | Massive GPU-parallel attacks |
| **Speed** | Fast on CPU | Way faster on GPU |
| **Hash format detection** | Auto-detect | You must specify a hash mode (`-m`) |
| **Wordlist mutations** | Built-in rules | Built-in rules |
| **Ease of use** | Slightly easier | Steeper learning curve |

In practice, security pros use **both**, depending on the situation.

### Installation

```bash
sudo apt install hashcat
hashcat --help
```

### Hashcat attack modes (`-a`)

| Mode | Type | Example |
|------|------|---------|
| `0` | Wordlist (straight) | Try each word in a list |
| `1` | Combination | Combine words from 2 wordlists |
| `3` | Brute-force / mask | Try character patterns |
| `6` | Wordlist + mask | Words with appended pattern |
| `7` | Mask + wordlist | Pattern with appended words |
| `9` | Association | Use a hint per hash |

### Hash modes (`-m`)

Hashcat supports 300+ hash types. You **must specify the mode**.

| Mode | Hash type |
|------|-----------|
| `0` | MD5 |
| `100` | SHA-1 |
| `1400` | SHA-256 |
| `1700` | SHA-512 |
| `1800` | sha512crypt (Linux shadow) |
| `3200` | bcrypt |
| `1000` | NTLM (Windows) |
| `5500` | NetNTLMv1 |
| `5600` | NetNTLMv2 |
| `7100` | macOS v10.8+ |
| `13100` | Kerberos 5 TGS-REP (Kerberoasting) |
| `22000` | WPA-PBKDF2 (Wi-Fi) |

See full list: `hashcat --help` or [hashcat.net/wiki/doku.php?id=example_hashes](https://hashcat.net/wiki/doku.php?id=example_hashes)

### Basic usage

```bash
# Syntax: hashcat -m <hash_mode> -a <attack_mode> <hash_file> <wordlist>

# Crack MD5 hashes with a wordlist
hashcat -m 0 -a 0 hashes.txt rockyou.txt

# Crack SHA-256 hashes
hashcat -m 1400 -a 0 hashes.txt rockyou.txt

# Crack Wi-Fi WPA2 handshake
hashcat -m 22000 -a 0 capture.hc22000 rockyou.txt
```

### Wordlist + rules

```bash
# Apply rules during attack
hashcat -m 0 -a 0 hashes.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule
```

### Brute-force / mask attack (`-a 3`)

```bash
# All 8-character lowercase + digit passwords
hashcat -m 0 -a 3 hashes.txt ?a?a?a?a?a?a?a?a

# Word ending in 4 digits (e.g., password2024)
hashcat -m 0 -a 6 hashes.txt rockyou.txt ?d?d?d?d
```

### Useful options

```bash
hashcat -m 1400 -a 0 hashes.txt rockyou.txt \
  --status                  # show live progress
  --force                   # ignore warnings
  -o cracked.txt            # save cracked hashes to file
  --remove                  # remove cracked hashes from input file
  -O                        # optimized kernels (faster but length-limited)
  -w 3                      # workload profile (1-4, higher = more aggressive)
  --session=run1            # name the session (for resume)
```

### Show cracked results

```bash
# View all cracked hashes
hashcat -m 1400 hashes.txt --show

# Show progress without running
hashcat --status
```

### Performance benchmarks

```bash
# Test cracking speed for all hash types
hashcat -b

# Benchmark a specific hash mode
hashcat -b -m 1400         # SHA-256 benchmark
```

A modern GPU can try **billions of MD5 hashes per second** but only **thousands of bcrypt hashes per second** (bcrypt is deliberately slow).

---

## 11. Real-World Workflow Examples

### Example 1: Crack a Linux user's password

```bash
# Step 1: Combine /etc/passwd and /etc/shadow (need root)
sudo unshadow /etc/passwd /etc/shadow > hashes.txt

# Step 2: Try John with rockyou
john --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt

# Step 3: Show results
john --show hashes.txt
```

### Example 2: Crack a WPA2 Wi-Fi password

```bash
# Step 1: Capture the handshake (using airodump-ng, separate step)
# This produces a .cap or .hccapx file

# Step 2: Convert to hashcat format
hcxpcapngtool -o handshake.hc22000 capture.cap

# Step 3: Crack with hashcat (GPU-accelerated)
hashcat -m 22000 -a 0 handshake.hc22000 rockyou.txt
```

### Example 3: Verify a downloaded file

```bash
# Compare published hash with computed hash
sha256sum ubuntu-22.04.iso
# 1234abcd...

# Compare to published hash on Ubuntu's website manually,
# OR use a checksum file:
sha256sum -c SHA256SUMS
```

### Example 4: Encrypt a file before emailing it

```bash
# Encrypt with AES-256
openssl enc -aes-256-cbc -pbkdf2 -salt -in resume.pdf -out resume.enc

# Recipient decrypts with the password (shared via different channel)
openssl enc -aes-256-cbc -pbkdf2 -d -in resume.enc -out resume.pdf
```

### Example 5: Generate SSH keys for passwordless login

```bash
# Generate Ed25519 key (modern, recommended)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key to remote server
ssh-copy-id user@server.com

# Now you can SSH without a password
ssh user@server.com
```

---

## 12. Wordlists — The Cracker's Ammunition

Cracking is only as good as your wordlists.

### Built-in Kali wordlists

```bash
ls /usr/share/wordlists/
# rockyou.txt.gz        - ~14M passwords (decompress with gunzip)
# fasttrack.txt         - Common passwords
# dirb/                 - Web directory wordlists
# wfuzz/                - Web fuzzing lists
```

### Decompress rockyou

```bash
sudo gunzip /usr/share/wordlists/rockyou.txt.gz
ls -lh /usr/share/wordlists/rockyou.txt
```

### Popular external wordlists

- **SecLists** — comprehensive collection: `git clone https://github.com/danielmiessler/SecLists`
- **CrackStation** — 15GB of common passwords
- **HaveIBeenPwned** — 600M+ leaked password hashes

### Tools to generate custom wordlists

```bash
# Generate from a website's text
cewl https://target.com -d 2 -m 6 -w custom.txt

# Generate password combinations
crunch 8 8 -p Acme corp 2024 > company_passwords.txt

# Mutate an existing wordlist
john --wordlist=base.txt --rules --stdout > mutated.txt
```

---

## 13. Defensive Cryptography — How to Make Cracking Impossible

If you're on the **defensive** side, here's how to make cracking attempts useless:

### Password storage best practices

```bash
# Never store passwords in plaintext
# Never use fast hashes (MD5, SHA-256) for passwords
# Always use:
# - bcrypt, scrypt, or Argon2
# - Unique salt per user
# - High work factor (slows brute force)
```

### Encryption best practices

| Practice | Why |
|----------|-----|
| Use **AES-256** for symmetric | Strong, well-tested |
| Use **RSA 4096** or **ECC 256+** | Future-proof |
| Use **SHA-256+** for hashing | SHA-1 is broken |
| Always **salt** password hashes | Prevents rainbow tables |
| Use **PBKDF2/bcrypt/Argon2** for passwords | Slow on purpose |
| **Authenticated encryption** (AES-GCM, ChaCha20-Poly1305) | Encryption + integrity together |
| **Strong randomness** for keys | Don't generate keys from `Math.random()` |
| Don't roll your own crypto | Use libraries from experts |

### Network practices

- **TLS 1.3** wherever possible
- **HSTS** to force HTTPS
- Disable old protocols (SSLv3, TLS 1.0, 1.1)
- Strong cipher suites only

---

## 14. Common Mistakes to Avoid

| Mistake | Why it's bad | What to do instead |
|---------|--------------|-------------------|
| Using MD5 or SHA-1 | Broken — collisions exist | SHA-256 or better |
| Using SHA-256 for passwords | Too fast → easy to brute-force | bcrypt, scrypt, Argon2 |
| Reusing passwords | Breach in one site = breach in all | Password manager + unique passwords |
| Storing passwords in plaintext | One breach = total disaster | Always hash with salt |
| Rolling your own crypto | Subtle bugs = total failure | Use vetted libraries (OpenSSL, libsodium) |
| Hardcoded keys in source code | Public on GitHub = compromised | Environment variables, secrets managers |
| Self-signed certs in production | Users get scary warnings | Get free certs from Let's Encrypt |
| Disabling certificate validation | Defeats the purpose of TLS | Validate properly |
| Using ECB mode | Patterns visible in ciphertext | Use CBC or GCM mode |
| Short key sizes (RSA < 2048) | Crackable with current hardware | Use 4096-bit RSA or ECC |

---

## 15. Quick Reference

### Commands cheat sheet

```bash
# Hashing
echo -n "text" | sha256sum
sha256sum file
openssl dgst -sha256 file

# Symmetric encryption
openssl enc -aes-256-cbc -pbkdf2 -in file -out file.enc
openssl enc -aes-256-cbc -pbkdf2 -d -in file.enc -out file

# Asymmetric keys
openssl genrsa -out key.pem 4096
ssh-keygen -t ed25519

# Random data
openssl rand -base64 32

# John the Ripper
john --wordlist=rockyou.txt hashes.txt
john --show hashes.txt
john --format=NT hashes.txt

# Hashcat
hashcat -m 0 -a 0 hashes.txt rockyou.txt           # MD5
hashcat -m 1400 -a 0 hashes.txt rockyou.txt        # SHA-256
hashcat -m 1800 -a 0 hashes.txt rockyou.txt        # Linux shadow
hashcat -m 22000 -a 0 hashes.txt rockyou.txt       # WPA2
```

### Hash type cheat sheet

| Hash | Length (hex) | Identifier |
|------|--------------|------------|
| MD5 | 32 chars | — |
| SHA-1 | 40 chars | — |
| SHA-256 | 64 chars | — |
| SHA-512 | 128 chars | — |
| bcrypt | 60 chars | starts with `$2a$` or `$2b$` |
| sha512crypt | varies | starts with `$6$` |
| NTLM | 32 chars | (no identifier — context needed) |

### When to use what

| Task | Use |
|------|-----|
| Encrypt a file | `openssl enc -aes-256-cbc` |
| Hash for integrity | SHA-256 |
| Hash for password | bcrypt / Argon2 |
| Generate SSH key | `ssh-keygen -t ed25519` |
| Verify a download | `sha256sum -c` |
| Generate random password | `openssl rand -base64 16` |
| Crack a password hash | John or Hashcat |
| Crack Wi-Fi | hashcat -m 22000 |
| Test a website's TLS | `openssl s_client` |

### Algorithm recommendations (2026)

| Need | Use |
|------|-----|
| Symmetric encryption | AES-256-GCM or ChaCha20-Poly1305 |
| Asymmetric encryption | RSA 4096 or ECC P-384 |
| Digital signatures | Ed25519 or ECDSA P-256 |
| Password hashing | Argon2id (or bcrypt cost 12+) |
| File integrity | SHA-256 or SHA-3 |
| Key derivation | PBKDF2 / HKDF / Argon2 |
| Random numbers | OS-provided CSPRNG (`/dev/urandom`, `openssl rand`) |
