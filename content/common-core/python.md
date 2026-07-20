# Python for Cybersecurity

> Python is the top language in cybersecurity — automation, scripting, tooling, scanning, and analysis all live here.

---

## 1. Python Fundamentals

### Writing a proper Python script

```python
#!/usr/bin/env python3
"""Module docstring — what this script does."""

import socket


def main():
    print("Hello, cybersecurity")


if __name__ == "__main__":
    main()
```

- Shebang `#!/usr/bin/env python3` lets you run it directly
- `if __name__ == "__main__":` runs `main()` only when executed directly (not when imported)

### Variables, data types & operators

```python
# Data types
host = "10.0.0.1"        # str
port = 80                # int
timeout = 1.5            # float
is_open = True           # bool
ports = [22, 80, 443]    # list
config = {"host": host}  # dict
unique = {1, 2, 3}       # set
coords = (10, 20)        # tuple (immutable)

# Operators
2 + 3, 10 - 4, 6 * 7, 15 / 4    # arithmetic (/ → float)
15 // 4, 15 % 4, 2 ** 8         # floor div, modulo, power
x == y, x != y, x < y           # comparison
a and b, a or b, not a          # logical
"ll" in "hello"                 # membership
```

### Built-in functions

```python
print("output")                 # display to stdout
name = input("Enter target: ")  # read user input (returns str)
len("hello")                     # → 5 (length of string/list/dict)
len([1, 2, 3])                   # → 3
open("file.txt")                 # open a file (see §2)
int("80"), str(80), float("1.5") # type conversion
range(1, 100)                    # sequence of numbers
type(port)                       # → <class 'int'>
sorted([3, 1, 2])                # → [1, 2, 3]
sum([1, 2, 3]), max(...), min(...)
```

### String methods

```python
s = "  Hello World  "
s.strip()              # "Hello World" — remove surrounding whitespace
s.upper(), s.lower()   # case conversion
s.split()              # ["Hello", "World"] — split on whitespace
s.split(",")           # split on a delimiter
",".join(["a", "b"])   # "a,b" — join a list into a string
s.replace("l", "L")    # replace substrings
s.startswith("  He"), s.endswith("  ")
"ll" in s              # membership test

# .format() — older string formatting
"Scanning {}:{}".format(host, port)        # positional
"Host {h} Port {p}".format(h=host, p=port) # named

# f-strings — modern preferred way
f"Scanning {host}:{port}"

# encoding (useful for hashing, payloads)
s.encode()             # str → bytes
b"data".decode()       # bytes → str
"Hello".encode().hex() # → '48656c6c6f'
```

### List operations

```python
lst = [1, 2, 3]
lst.append(4)          # add to end → [1,2,3,4]
lst.insert(0, 0)       # insert at index
lst.remove(2)          # remove first matching value
lst.pop()              # remove & return last
lst[-1]                # last element
lst[1:3]               # slice
lst.sort()             # sort in place
lst.reverse()          # reverse in place
len(lst)               # count
3 in lst               # membership
[x * 2 for x in lst]   # list comprehension
```

### Dictionaries & sets

```python
d = {"a": 1, "b": 2}
d["a"]                  # access (KeyError if missing)
d.get("c", 0)           # safe access with default
d.keys(), d.values(), d.items()
d["c"] = 3              # add/update

s = {1, 2, 3}
s.add(4)
s & {2, 3}              # intersection
s | {5}                 # union
s - {1}                 # difference
```

---

## 2. Control Flow

### if / elif / else

```python
status = 403

if status == 200:
    print("OK — page exists")
elif status == 403:
    print("Forbidden — exists but blocked (interesting!)")
elif status == 404:
    print("Not found")
else:
    print(f"Other status: {status}")
```

`elif` checks another condition only if the previous ones were False. `else` catches everything remaining.

### for loop vs while loop

```python
# FOR loop — when you know how many iterations / iterate a collection
for port in range(1, 1025):
    print(port)

for host in ["10.0.0.1", "10.0.0.2"]:
    print(host)

# WHILE loop — when you loop until a condition changes
attempts = 0
while attempts < 3:
    if try_login():
        break
    attempts += 1
```

| | **for** | **while** |
|---|---------|-----------|
| **Use when** | You know the range / have a collection | You loop until a condition is met |
| **Driven by** | An iterable (list, range, file) | A boolean condition |
| **Risk** | Finite (ends with the iterable) | Can loop forever if condition never changes |

### Loop control

```python
for i in range(10):
    if i == 3:
        continue   # skip this iteration
    if i == 7:
        break      # exit the loop entirely
```

### try / except — error handling

```python
try:
    risky_operation()
except ConnectionRefusedError:
    print("port closed")
except Exception as e:
    print(f"unexpected: {e}")
finally:
    cleanup()   # always runs
```

---

## 3. Functions

```python
def scan(host: str, port: int = 80, timeout: float = 1.0) -> bool:
    """Return True if the TCP port is open.

    Args:
        host: target IP or hostname
        port: port number (default 80)
        timeout: seconds to wait (default 1.0)
    """
    return check_port(host, port, timeout)

# Call it
scan("10.0.0.1")                 # uses defaults
scan("10.0.0.1", 443)            # positional
scan("10.0.0.1", port=22, timeout=2)  # keyword args
```

- **Parameters** = inputs; **default values** make them optional
- **`return`** sends a value back; without it, the function returns `None`
- Type hints (`: str`, `-> bool`) are optional but improve readability

### *args and **kwargs

```python
def fn(*args, **kwargs):
    print(args)     # tuple of positional args
    print(kwargs)   # dict of keyword args

fn(1, 2, 3, key="val")   # args=(1,2,3) kwargs={"key":"val"}
```

---

## 4. PEP 8 Style Rules

- **4-space indents**, never tabs
- `snake_case` for functions/variables, `PascalCase` for classes, `UPPER_CASE` for constants
- Lines ≤ 79 chars (or 99 if your team agrees)
- Two blank lines between top-level functions/classes
- One import per line, standard-library imports first

```python
# Good
import socket
import sys

MAX_PORTS = 1024

def scan_host(target_ip):
    ...
```

---

## 5. File I/O

### Always use `with` (context manager — auto-closes the file)

```python
# Read whole file
with open("hosts.txt", "r") as f:
    content = f.read()

# Read into a list of lines
with open("hosts.txt") as f:
    lines = [line.strip() for line in f]

# Write (truncates existing content!)
with open("results.txt", "w") as f:
    f.write("scan complete\n")

# Append (adds to end)
with open("log.txt", "a") as f:
    f.write("found open port\n")

# Binary (malware samples, payloads, captures)
with open("sample.bin", "rb") as f:
    data = f.read()
```

### File modes

| Mode | Meaning |
|------|---------|
| `r` | read (default) — error if file doesn't exist |
| `w` | write — **truncates** (erases) existing content |
| `a` | append — adds to the end, keeps existing |
| `x` | create — fails if file already exists |
| `b` | binary (combine: `rb`, `wb`) |
| `+` | read+write (e.g., `r+`) |

### Parse a file line by line (memory-efficient for big files)

```python
with open("huge.log") as f:
    for line in f:          # streams — doesn't load all into RAM
        line = line.strip()
        if "FAIL" in line:
            print(line)
```

### Why context managers matter

`with` guarantees the file is closed even if an error occurs mid-read. Without it, you'd need a manual `try/finally` with `f.close()`.

---

## 6. `socket` — Network Programming

```python
import socket
```

### Resolve a domain to an IP

```python
socket.gethostbyname("example.com")      # → "93.184.216.34"
socket.gethostbyaddr("8.8.8.8")          # reverse lookup → hostname
socket.getaddrinfo("example.com", 443)   # full record set (IPv4 + IPv6)
```

`socket.gethostbyname()` takes a hostname and returns its IPv4 address — the simplest DNS resolution in Python.

### Check if a port is open — `connect_ex()`

```python
def is_open(host, port, timeout=1):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(timeout)
        result = s.connect_ex((host, port))
        return result == 0
```

**`socket.connect_ex()` returns `0` if the port is OPEN.** Any non-zero value is an error code (port closed/filtered). This is preferred over `connect()` for scanning because it returns a code instead of raising an exception.

### TCP port scan over a range

```python
for port in range(1, 1025):
    if is_open("10.0.0.1", port):
        print(f"[+] {port}/tcp open")
```

### Banner grabbing

```python
with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.settimeout(2)
    s.connect(("example.com", 80))
    s.sendall(b"HEAD / HTTP/1.0\r\n\r\n")
    print(s.recv(4096).decode(errors="ignore"))
```

### UDP probe

```python
with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
    s.settimeout(2)
    s.sendto(b"probe", ("10.0.0.1", 53))
    try:
        data, addr = s.recvfrom(4096)
        print(f"response from {addr}: {data}")
    except socket.timeout:
        print("no response (open|filtered)")
```

### Address families & socket types

| Constant | Meaning |
|----------|---------|
| `AF_INET` | IPv4 |
| `AF_INET6` | IPv6 |
| `SOCK_STREAM` | TCP |
| `SOCK_DGRAM` | UDP |
| `SOCK_RAW` | raw sockets (needs root) |

---

## 7. Installing & Importing Packages

### pip — the package installer

```bash
pip install requests              # install a package
pip install dnspython beautifulsoup4 lxml   # multiple at once
pip install --upgrade requests    # upgrade
pip list                          # show installed packages
pip show requests                 # package details
pip freeze > requirements.txt     # export dependencies
pip install -r requirements.txt   # install from a list
```

### Steps to use an external module

```python
# 1. Install it:   pip install requests
# 2. Import it:
import requests
# 3. Read the docs to learn its functions
# 4. Use it:
r = requests.get("https://example.com")
```

### Reading library documentation — what to look for

- **Installation** — the exact `pip install` name (often differs from import name, e.g. `pip install beautifulsoup4` → `import bs4`)
- **Quickstart / basic usage** — copy-paste a first example
- **Function signatures** — required vs optional arguments and defaults
- **Return values** — what type comes back (object? dict? list?)
- **Exceptions** — what errors it can raise so you can handle them
- **Examples** — real-world snippets

---

## 8. `dnspython` — Advanced DNS Queries

```bash
pip install dnspython
```

```python
import dns.resolver
```

For anything beyond `socket.gethostbyname()` (MX, TXT, NS, zone transfers), use **dnspython**.

### Common queries

```python
# A record
for r in dns.resolver.resolve("example.com", "A"):
    print(r.address)

# MX (mail servers)
for r in dns.resolver.resolve("example.com", "MX"):
    print(r.preference, r.exchange)

# TXT (SPF, DKIM, verification)
for r in dns.resolver.resolve("example.com", "TXT"):
    print(r.strings)
```

### Use a specific resolver

```python
resolver = dns.resolver.Resolver()
resolver.nameservers = ["8.8.8.8", "1.1.1.1"]
resolver.timeout = 2
resolver.lifetime = 4
```

### Subdomain brute force

```python
with open("subdomains.txt") as f:
    for sub in f:
        sub = sub.strip()
        try:
            ans = dns.resolver.resolve(f"{sub}.target.com", "A")
            print(f"[+] {sub}.target.com → {ans[0]}")
        except dns.resolver.NXDOMAIN:
            pass
        except Exception:
            pass
```

---

## 9. `requests` — HTTP Client

```bash
pip install requests
```

```python
import requests
```

`requests` is **the** library for making HTTP requests in Python — simpler than the stdlib `urllib`.

### Make a GET request

```python
r = requests.get("https://example.com")
print(r.status_code)   # 200
print(r.text)          # body as string
```

### All the verbs

```python
requests.get(url)
requests.post(url, data={"user": "admin", "pass": "x"})
requests.post(url, json={"key": "val"})    # JSON body
requests.put(url, json={...})
requests.delete(url)
requests.head(url)      # headers only — fast recon
requests.options(url)   # allowed methods
```

### Access response data & headers

```python
r.status_code            # 200, 404, 500…
r.text                   # body as str
r.content                # body as bytes
r.json()                 # parse JSON body
r.headers                # response headers (dict-like)
r.headers.get("Server")  # specific header
r.cookies                # cookies
r.url                    # final URL after redirects
r.history                # redirect chain
```

### Custom headers / user-agent

```python
headers = {
    "User-Agent": "Mozilla/5.0",
    "Authorization": "Bearer TOKEN",
}
requests.get(url, headers=headers)
```

### Sessions — persist cookies across requests

```python
s = requests.Session()
s.headers.update({"User-Agent": "scanner/1.0"})
s.post("https://target/login", data={"u": "a", "p": "b"})
s.get("https://target/dashboard")   # cookies kept automatically
```

### Timeouts, redirects, SSL, proxies

```python
requests.get(url, timeout=5)
requests.get(url, allow_redirects=False)
requests.get(url, verify=False)     # disable TLS check (lab only!)
requests.get(url, proxies={"http": "http://127.0.0.1:8080",
                           "https": "http://127.0.0.1:8080"})  # Burp
```

### Using third-party APIs effectively

```python
# 1. Read the API docs (endpoints, auth, rate limits)
# 2. Authenticate (usually a header token)
headers = {"Authorization": "Bearer YOUR_API_KEY"}
# 3. Make the request with a timeout
r = requests.get("https://api.service.com/v1/data",
                 headers=headers, timeout=10)
# 4. Check status, then parse
if r.status_code == 200:
    data = r.json()
# 5. Respect rate limits (handle 429)
```

### Error handling

```python
try:
    r = requests.get(url, timeout=3)
    r.raise_for_status()    # raises on 4xx/5xx
except requests.Timeout:
    print("timed out")
except requests.HTTPError as e:
    print(f"http error: {e}")
except requests.RequestException as e:
    print(f"request failed: {e}")
```

---

## 10. `BeautifulSoup` — HTML Parsing

```bash
pip install beautifulsoup4 lxml
```

```python
from bs4 import BeautifulSoup
import requests

html = requests.get("https://example.com").text
soup = BeautifulSoup(html, "lxml")   # or "html.parser"
```

**BeautifulSoup** parses HTML/XML into a navigable tree so you can extract data (links, forms, tokens, text) without regex.

### `.prettify()`

```python
print(soup.prettify())
```

`.prettify()` returns the HTML reformatted with **proper indentation and line breaks** — making messy/minified HTML readable. Great for inspecting page structure during recon.

### Finding elements

```python
soup.title.text                          # <title> content
soup.find("a")                           # first <a>
soup.find_all("a")                       # all <a> tags
soup.find("div", class_="login")         # by class
soup.find("input", {"name": "csrf"})     # by attribute
soup.select("div.card > a.btn")          # CSS selectors
soup.select_one("#main")                 # by id
```

### Extracting data

```python
# All links
for link in soup.find_all("a"):
    print(link.get("href"), "→", link.text.strip())

# All forms (and their inputs)
for form in soup.find_all("form"):
    print(form.get("action"), form.get("method"))
    for inp in form.find_all("input"):
        print(" ", inp.get("name"), "=", inp.get("value"))

# Hidden CSRF token
csrf = soup.find("input", {"name": "csrf_token"}).get("value")
```

### Walking the tree

```python
elem.parent
elem.children          # generator of child elements
elem.next_sibling
elem.attrs             # dict of attributes
elem.text              # all descendant text
```

---

## 11. Web Scraping vs Web Crawling

### Web scraping

**Web scraping** = extracting specific data from a web page (prices, emails, links, form fields). You target ONE page (or a known set) and pull out the data you want.

```python
# Scrape all email addresses from a page
import re, requests
html = requests.get("https://example.com/contact").text
emails = re.findall(r"[\w.+-]+@[\w-]+\.[\w.-]+", html)
print(emails)
```

### Web crawling

**Web crawling** = automatically discovering and following links to traverse MANY pages across a site (what search engines do). A crawler scrapes a page, finds its links, then visits those links, and repeats.

```
scraping  = extract data from a page
crawling  = discover & follow links across pages (often scraping each)
```

### Recursion in web crawling

**Recursion** = a function that calls itself. It's natural for crawling because each page leads to more pages (a tree structure).

```python
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

visited = set()

def crawl(url, depth=2):
    # Base case — stop recursing
    if depth == 0 or url in visited:
        return
    visited.add(url)
    print(f"[crawling] {url}")

    try:
        html = requests.get(url, timeout=3).text
    except requests.RequestException:
        return

    soup = BeautifulSoup(html, "lxml")
    for link in soup.find_all("a"):
        href = link.get("href")
        if href:
            full = urljoin(url, href)        # resolve relative URLs
            if full.startswith("http"):
                crawl(full, depth - 1)        # recursive call

crawl("https://example.com", depth=2)
```

**How the recursion works:**
- **Base case:** stop when `depth == 0` or the URL was already visited (prevents infinite loops)
- **Recursive case:** for each link found, call `crawl()` again with `depth - 1`
- The `visited` set prevents revisiting the same page (critical — otherwise it loops forever)

---

## 12. Quick Cybersec Recipes

### Multi-threaded port scanner

```python
from concurrent.futures import ThreadPoolExecutor
import socket

def check(port, host="10.0.0.1"):
    with socket.socket() as s:
        s.settimeout(0.5)
        if s.connect_ex((host, port)) == 0:
            return port

with ThreadPoolExecutor(max_workers=100) as ex:
    open_ports = [p for p in ex.map(check, range(1, 1025)) if p]
print(open_ports)
```

### Directory brute force (web)

```python
import requests
with open("wordlist.txt") as f:
    for word in f:
        url = f"https://target.com/{word.strip()}"
        r = requests.get(url, timeout=2)
        if r.status_code not in (404, 403):
            print(f"[{r.status_code}] {url}")
```

### Hashing

```python
import hashlib
hashlib.md5(b"password").hexdigest()
hashlib.sha256(b"password").hexdigest()

# Hash a file in chunks
h = hashlib.sha256()
with open("file.bin", "rb") as f:
    for chunk in iter(lambda: f.read(8192), b""):
        h.update(chunk)
print(h.hexdigest())
```

### Base64 / hex encoding

```python
import base64
base64.b64encode(b"hello")       # b'aGVsbG8='
base64.b64decode(b"aGVsbG8=")    # b'hello'
bytes.fromhex("48656c6c6f")      # b'Hello'
b"Hello".hex()                   # '48656c6c6f'
```

### Regex for IOC extraction

```python
import re
text = open("log.txt").read()
ips    = re.findall(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", text)
emails = re.findall(r"[\w.+-]+@[\w-]+\.[\w.-]+", text)
md5s   = re.findall(r"\b[a-fA-F0-9]{32}\b", text)
```

### argparse — CLI-friendly scripts

```python
import argparse
p = argparse.ArgumentParser(description="TCP port scanner")
p.add_argument("host")
p.add_argument("-p", "--ports", default="1-1024")
p.add_argument("-t", "--timeout", type=float, default=1.0)
args = p.parse_args()
print(args.host, args.ports, args.timeout)
```

---

## 13. HTTP Status Codes

| Code | Class | Meaning | Cybersec note |
|------|-------|---------|---------------|
| 200 | 2xx Success | OK | Page exists |
| 201 | 2xx | Created | POST often returns this |
| 204 | 2xx | No Content | Endpoint exists, empty body |
| 301 | 3xx Redirect | Moved Permanently | Follow the trail |
| 302 | 3xx | Found / temp redirect | Login flow signal |
| 304 | 3xx | Not Modified | Cached |
| 400 | 4xx Client error | Bad Request | Malformed input |
| 401 | 4xx | Unauthorized | Needs auth — try creds |
| 403 | 4xx | Forbidden | Exists but blocked — interesting! |
| 404 | 4xx | Not Found | Doesn't exist |
| 405 | 4xx | Method Not Allowed | Try other verbs |
| 429 | 4xx | Too Many Requests | Rate-limited — slow down |
| 500 | 5xx Server error | Internal Error | Might leak stack trace |
| 502 | 5xx | Bad Gateway | Proxy issue |
| 503 | 5xx | Service Unavailable | Overloaded |

**Recon tip:** `403` and `401` are gold — they confirm a resource *exists*. `404` means nothing's there.

---

## 14. Quick Reference

```python
# Resolve domain → IP
import socket
socket.gethostbyname("example.com")

# Check if a port is open (0 = open)
s = socket.socket()
s.settimeout(1)
open_ = s.connect_ex(("10.0.0.1", 80)) == 0

# HTTP GET + headers
import requests
r = requests.get("https://example.com")
r.status_code, r.headers.get("Server"), r.text

# Advanced DNS
import dns.resolver
dns.resolver.resolve("example.com", "MX")

# Parse HTML
from bs4 import BeautifulSoup
soup = BeautifulSoup(r.text, "lxml")
soup.prettify()
soup.find_all("a")

# File read line by line
with open("f.txt") as f:
    for line in f:
        process(line.strip())

# pip
# pip install requests dnspython beautifulsoup4
```

### Key answers (quiz prep)

| Question | Answer |
|----------|--------|
| Resolve domain to IP | `socket.gethostbyname(host)` |
| `connect_ex()` return for open port | `0` |
| Library for advanced DNS | `dnspython` |
| Library for HTTP requests | `requests` |
| Make a GET request | `requests.get(url)` |
| Access response headers | `r.headers` |
| Library to parse HTML | `BeautifulSoup` (bs4) |
| What `.prettify()` does | Formats HTML with indentation for readability |
| Web scraping | Extract data from a page |
| Web crawling | Follow links to traverse many pages |
| Recursion | A function calling itself (used to crawl link trees) |
| Install a package | `pip install <name>` |
| File modes | `r` read, `w` write (truncate), `a` append |
| `for` vs `while` | `for` = known iterations/collection; `while` = until condition |
