# Ruby Scripting for Security

> **⚠️ AUTHORIZED USE ONLY.** For education and authorized testing only. The network scripts here connect to real systems. Run them only against machines you own or that are in scope. Every lab targets `127.0.0.1` or a local file. See the [Legal and Terms of Use](/legal) page.

> "Knowing how systems can be broken is the first step to defending them."

**Scope:** Enough Ruby to read and write security scripts, then applying it: log parsing, HTTP requests, port scanning, hashing, and how Ruby is used inside Metasploit. Just the fundamentals you will actually use, not the whole language.

**Recommended background:** basic Linux shell, and having written a script in any language.

## Table of Contents

- [Why Ruby in Security](#why-ruby-in-security)
- [Running Ruby](#running-ruby)
- [The Fundamentals](#the-fundamentals)
- [Methods](#methods)
- [Blocks](#blocks)
- [Classes](#classes)
- [Exception Handling](#exception-handling)
- [Lab A: A Small Security Script](#lab-a-a-small-security-script)
- [Reading and Parsing Files](#reading-and-parsing-files)
- [HTTP Requests](#http-requests)
- [Lab B: Check Security Headers](#lab-b-check-security-headers)
- [Port Scanning with Sockets](#port-scanning-with-sockets)
- [Threading for Speed](#threading-for-speed)
- [Lab C: Threaded Port Scanner](#lab-c-threaded-port-scanner)
- [Hashing and Password Testing](#hashing-and-password-testing)
- [Lab D: Hash Cracker](#lab-d-hash-cracker)
- [Ruby in Metasploit](#ruby-in-metasploit)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Why Ruby in Security

One reason dominates: **Metasploit is written in Ruby.** Every exploit, payload, and module in the framework is Ruby code. To read what a module does before running it, or write your own, you read Ruby.

The rest follows from Ruby being quick to write and easy to read, which is what you want for a throwaway scanner or a proof of concept. You will write far more short scripts than finished tools.

Python has more security libraries and is the more common choice for standalone tools. Learn Ruby for Metasploit.

## 2. Running Ruby

```bash
ruby -v                 # check it is installed (preinstalled on Kali)
ruby script.rb          # run a file
ruby -e 'puts "hi"'     # run a one-liner
irb                     # interactive shell, good for testing snippets
```

A script starts with a shebang so it can run directly:

```ruby
#!/usr/bin/env ruby
puts "Hello"
```

```bash
chmod +x script.rb && ./script.rb
```

## 3. The Fundamentals

Just the pieces you need to read the rest of this sheet.

```ruby
name = "admin"          # String
port = 443              # Integer
open = true             # Boolean
nothing = nil           # nil means "no value"

ports = [22, 80, 443]                    # Array
host  = { ip: "10.0.0.1", os: "linux" }  # Hash
```

**String interpolation** puts a value inside a string with `#{}`. This is used constantly.

```ruby
ip = "10.0.0.1"
puts "Scanning #{ip}"       # Scanning 10.0.0.1
puts 'Scanning #{ip}'       # single quotes do NOT interpolate
```

Double quotes interpolate, single quotes are literal. That trips people up.

**Arrays and hashes**, the two containers you will use:

```ruby
ports = [22, 80, 443]
ports.include?(22)      # true
ports << 8080           # append
ports.length            # 4

host = { ip: "10.0.0.1", os: "linux" }
host[:ip]               # "10.0.0.1"
```

`:ip` is a **symbol**, a lightweight name used for hash keys. A method ending in `?` returns true or false.

## 4. Methods

Methods hold most of Ruby's small surprises, so read this one closely.

```ruby
def scan_port(host, port)
  puts "Scanning #{host}:#{port}"
end

scan_port("10.0.0.1", 22)
```

Names are `snake_case`. Ruby lets a name start with a capital, but nobody does it, because it looks like a constant.

**Default values** let you leave arguments out:

```ruby
def connect(host, port = 80)
  puts "#{host}:#{port}"
end

connect("10.0.0.1")          # 10.0.0.1:80
connect("10.0.0.1", 443)     # 10.0.0.1:443
```

**The implicit return** is the thing to remember: a method returns the value of its **last line**, with no `return` needed.

```ruby
def add(a, b)
  a + b          # this value is returned
end

def three
  x = 10
  y = 20
  z = 30         # the last line, so 30 is returned
end

puts three       # 30, not 10 and not nil
```

That last example catches everyone. The method returns `30`, the value of the final assignment.

**Variable arguments** with the splat `*`:

```ruby
def scan_all(*ports)
  puts "#{ports.length} ports: #{ports.join(', ')}"
end

scan_all(22, 80, 443)        # 3 ports: 22, 80, 443
```

`*ports` collects however many arguments you pass into an array.

**Class methods** are defined with `self.` and called without making an object:

```ruby
class Utils
  def self.valid_ip?(ip)
    ip.match?(/\A\d{1,3}(\.\d{1,3}){3}\z/)
  end
end

Utils.valid_ip?("10.0.0.1")   # true, no Utils.new needed
```

## 5. Blocks

A **block** is code you hand to a method. This replaces most loops in Ruby.

```ruby
ports = [22, 80, 443]

ports.each { |p| puts p }              # one line: braces

ports.each do |p|                       # many lines: do ... end
  puts "checking #{p}"
end
```

`|p|` holds each element in turn. The four you will actually use:

```ruby
ports.each   { |p| puts p }            # do something with each
ports.map    { |p| p * 2 }             # transform, returns a new array
ports.select { |p| p > 100 }           # keep matching
ports.find   { |p| p == 22 }           # first match
```

`map` and `select` are the everyday ones:

```ruby
ips = lines.map { |line| line.split(" ").first }        # pull a field from each line
fails = lines.select { |line| line.include?("Failed") } # keep only matching lines
```

**Ranges** give you a port range in one expression:

```ruby
(1..1024).each { |port| scan(port) }    # 1 to 1024 inclusive
```

## 6. Classes

A class bundles data with the methods that use it. Once a script grows, a class keeps it tidy.

```ruby
class PortScanner
  def initialize(host)
    @host = host          # @host is an instance variable, seen by every method
    @open = []
  end

  def scan(port)
    @open << port
  end

  def report
    "#{@host}: #{@open.length} open"
  end
end

s = PortScanner.new("10.0.0.1")
s.scan(22)
puts s.report
```

| Piece        | Meaning                                                     |
| ------------ | ----------------------------------------------------------- |
| `initialize` | The constructor, run by `.new`                              |
| `@host`      | An instance variable, available across the object's methods |
| `.new(...)`  | Creates one, passing arguments to `initialize`              |

**Inheritance** with `<`, and `super` to call the parent's version. This matters because **every Metasploit module is a class inheriting from a framework base**.

```ruby
class Scanner
  def scan; puts "generic"; end
end

class TcpScanner < Scanner    # inherits from Scanner
  def scan
    super                     # run the parent's scan first
    puts "tcp specifics"
  end
end
```

## 7. Exception Handling

Network code fails constantly, so this is not optional. A scanner without it dies on the first closed port.

```ruby
begin
  socket = TCPSocket.new(host, port)
rescue Errno::ECONNREFUSED
  puts "closed"
rescue Timeout::Error
  puts "filtered"
rescue => e
  puts "other: #{e.message}"
ensure
  socket&.close             # always runs; &. skips it if socket is nil
end
```

The errors you meet doing network work:

| Error                 | Means                                    |
| --------------------- | ---------------------------------------- |
| `Errno::ECONNREFUSED` | Port closed, nothing listening           |
| `Timeout::Error`      | Filtered, a firewall dropped it silently |
| `SocketError`         | The hostname would not resolve           |

`socket&.close` is **safe navigation**: it calls `close` only if `socket` exists, so cleanup does not crash when the connection never opened.

## 8. Lab A: A Small Security Script

**What you are doing:** combining methods, a class, a block, and inheritance. No network, nothing can break.

**Time:** about 10 minutes.

### Set up

```bash
mkdir -p ~/ruby-lab && cd ~/ruby-lab
```

### Write it

Save as `hosts.rb`:

```ruby
#!/usr/bin/env ruby

class Host
  def initialize(ip)
    @ip = ip
    @ports = []
  end

  def add_port(*ports)         # splat: any number of ports
    ports.each { |p| @ports << p }
  end

  def risky?
    @ports.any? { |p| [21, 23, 445].include?(p) }   # block returning true/false
  end

  def report
    status = risky? ? "REVIEW" : "ok"                # ternary: cond ? a : b
    "#{@ip.ljust(14)} #{@ports.sort.join(',').ljust(16)} #{status}"
  end
end

hosts = []

h1 = Host.new("10.0.0.1"); h1.add_port(22, 443); hosts << h1
h2 = Host.new("10.0.0.2"); h2.add_port(21, 22, 23); hosts << h2

puts "IP             PORTS            STATUS"
hosts.each { |h| puts h.report }

flagged = hosts.select { |h| h.risky? }
puts "\n#{flagged.length} of #{hosts.length} need review"
```

### Run it

```bash
ruby hosts.rb
```

Expected:

```text
IP             PORTS            STATUS
10.0.0.1       22,443           ok
10.0.0.2       21,22,23         REVIEW

1 of 2 need review
```

### Change something

Add `h1.add_port(445)` before the puts and re-run. `10.0.0.1` should flip to `REVIEW`. Keep the folder for later labs.

## 9. Reading and Parsing Files

Filtering log files is the most common real scripting task in this field.

```ruby
File.read("file.txt")          # whole file as one string
File.readlines("file.txt")     # array of lines

File.foreach("big.log") do |line|     # line by line, safe for huge files
  puts line if line.include?("Failed password")
end
```

**Use `File.foreach` for logs**, because `File.read` loads the entire file into memory.

Writing:

```ruby
File.write("out.txt", "content")           # overwrite
File.open("out.txt", "a") { |f| f.puts "line" }   # "a" = append
```

**A real parser: count failed logins per IP.**

```ruby
#!/usr/bin/env ruby
attempts = Hash.new(0)          # missing keys default to 0

File.foreach("auth.log") do |line|
  next unless line.include?("Failed password")
  attempts[$1] += 1 if line =~ /from (\d+\.\d+\.\d+\.\d+)/
end

attempts.sort_by { |_ip, n| -n }.first(10).each do |ip, n|
  puts "#{n.to_s.rjust(4)}  #{ip}"
end
```

| Piece         | Does                                     |
| ------------- | ---------------------------------------- |
| `Hash.new(0)` | Any new key starts at 0, so `+= 1` works |
| `next unless` | Skip the line unless it matches          |
| `=~ /(...)/`  | Test against a pattern                   |
| `$1`          | The first captured group from that match |

Count occurrences, then sort. That pattern covers most log analysis.

## 10. HTTP Requests

`Net::HTTP` is built in.

```ruby
require 'net/http'
require 'uri'

response = Net::HTTP.get_response(URI("http://127.0.0.1:8000/"))
puts response.code            # "200"
puts response['Server']       # a header
puts response.body[0, 100]    # first 100 characters
```

With a custom header:

```ruby
uri = URI("http://127.0.0.1:8000/")
http = Net::HTTP.new(uri.host, uri.port)
request = Net::HTTP::Get.new(uri)
request["User-Agent"] = "Scanner/1.0"
response = http.request(request)
```

Downloading a file:

```ruby
File.write("out.txt", Net::HTTP.get(URI("http://127.0.0.1:8000/file.txt")))
```

## 11. Lab B: Check Security Headers

**What you are doing:** fetching a page and reporting which security headers it is missing.

**Time:** about 10 minutes.

### Start a target

Second terminal:

```bash
cd ~/ruby-lab
python3 -m http.server 8000
```

### Write it

Save as `headers.rb`:

```ruby
#!/usr/bin/env ruby
require 'net/http'
require 'uri'

WANTED = %w[
  content-security-policy
  x-frame-options
  x-content-type-options
  strict-transport-security
]

url = ARGV[0] || "http://127.0.0.1:8000/"

begin
  response = Net::HTTP.get_response(URI(url))
rescue => e
  abort "Could not reach #{url}: #{e.message}"
end

puts "#{url}  ->  #{response.code}"
puts

WANTED.each do |header|
  if response[header]
    puts "[+] #{header}"
  else
    puts "[-] #{header} MISSING"
  end
end
```

### Run it

```bash
ruby headers.rb
```

Expected: all four reported missing, because `python3 -m http.server` sets none of them. That is the correct result, and it is what makes it a useful check.

| Piece                    | Meaning                                     |
| ------------------------ | ------------------------------------------- |
| `%w[...]`                | Array of strings shorthand                  |
| `ARGV[0]`                | First command-line argument                 |
| `ARGV[0] \|\| "default"` | Use the argument if given, else the default |
| `response[header]`       | Returns the header value, or nil if absent  |

Stop the server with `Ctrl-C` when done.

## 12. Port Scanning with Sockets

A socket is a network connection. Ruby's built-in `socket` library is all a scanner needs.

**How a TCP scan works:** try to open a connection. Success means something is listening. Refused means closed. Hangs until timeout means a firewall is dropping your packets.

```ruby
require 'socket'
require 'timeout'

def port_open?(host, port, timeout = 1)
  Timeout.timeout(timeout) do
    TCPSocket.new(host, port).close
    true
  end
rescue Errno::ECONNREFUSED
  false                    # closed
rescue Timeout::Error
  false                    # filtered
rescue
  false
end

puts port_open?("127.0.0.1", 22)
```

The three outcomes are three different findings:

| Result           | Meaning                                |
| ---------------- | -------------------------------------- |
| Connects         | Open                                   |
| `ECONNREFUSED`   | Closed, host replied but nothing there |
| `Timeout::Error` | Filtered, firewall dropped it silently |

The timeout matters: without it, a filtered port hangs your scanner for the OS default, often over a minute.

**Banner grabbing** reads what an open service announces, which identifies it:

```ruby
def grab_banner(host, port)
  Timeout.timeout(2) do
    socket = TCPSocket.new(host, port)
    banner = socket.gets      # read one line
    socket.close
    banner&.strip
  end
rescue
  nil
end
```

SSH and FTP announce themselves. HTTP stays quiet until you send a request first.

## 13. Threading for Speed

Scanning ports one at a time is slow. Threads check many at once.

```ruby
threads = []
[22, 80, 443].each do |port|
  threads << Thread.new { check(port) }
end
threads.each(&:join)          # wait for all to finish
```

`Thread.new` starts work and returns immediately. `join` waits for a thread. `&:join` is shorthand for `{ |t| t.join }`.

**Two rules.** Do not start thousands of threads at once, it exhausts the system, so work in fixed-size batches. And when several threads write to one shared array, wrap the write in a `Mutex` so only one goes at a time:

```ruby
mutex = Mutex.new
mutex.synchronize { open << port }    # safe shared write
```

## 14. Lab C: Threaded Port Scanner

**What you are doing:** combining sockets, exceptions, and threading into a working scanner. **`127.0.0.1` only.**

**Time:** about 15 minutes.

### Start a target

```bash
python3 -m http.server 8000
```

### Write it

Save as `scanner.rb`:

```ruby
#!/usr/bin/env ruby
require 'socket'
require 'timeout'

class PortScanner
  def initialize(host, ports, pool: 50, timeout: 0.5)
    @host = host
    @ports = ports
    @pool = pool
    @timeout = timeout
    @open = []
    @mutex = Mutex.new
  end

  def run
    started = Time.now
    @ports.each_slice(@pool) do |slice|              # fixed-size batches
      slice.map { |port| Thread.new { check(port) } }.each(&:join)
    end
    report(Time.now - started)
  end

  private

  def check(port)
    Timeout.timeout(@timeout) do
      TCPSocket.new(@host, port).close
      @mutex.synchronize { @open << port }           # safe shared write
    end
  rescue
    # closed or filtered
  end

  def report(seconds)
    puts "Open: #{@open.sort.join(', ')}"
    puts "#{@open.length} open in #{seconds.round(2)}s"
  end
end

host = ARGV[0] || "127.0.0.1"
abort "Lab is localhost only" unless ["127.0.0.1", "localhost"].include?(host)

PortScanner.new(host, (1..10000)).run
```

### Run it

```bash
ruby scanner.rb
```

Expected: port 8000 open in a couple of seconds.

### See what threading buys you

Change `pool: 50` to `pool: 1` in the `PortScanner.new` call and re-run. Compare the two durations. That difference is the whole point of threading.

Stop the server with `Ctrl-C`.

## 15. Hashing and Password Testing

Ruby's `digest` library computes hashes. This is how you check file integrity, and how you test whether a hash matches a password.

```ruby
require 'digest'

Digest::MD5.hexdigest("password")       # 5f4dcc3b5aa765d61d8327deb882cf99
Digest::SHA256.hexdigest("password")
Digest::SHA256.file("script.rb").hexdigest   # hash a file
```

**Hashes are one-way**, so you cannot reverse one. What you can do is hash guesses and compare. That is all a cracker does:

```ruby
require 'digest'

def crack(target, wordlist)
  File.foreach(wordlist) do |line|
    word = line.strip
    return word if Digest::MD5.hexdigest(word) == target
  end
  nil
end
```

Ruby is far slower than John or Hashcat, which use optimized code and GPUs. You write this to understand the mechanism, not to use on a real job.

**Why real password storage defeats it:** a **salt** means identical passwords hash differently, so an attacker cannot precompute a table. And **bcrypt or Argon2** are deliberately slow, so each guess costs real time. MD5 is fast, which is exactly why it is a bad choice for passwords.

## 16. Lab D: Hash Cracker

**What you are doing:** hashing a word, then recovering it from a small wordlist. All local.

**Time:** about 10 minutes.

### Make a target and a wordlist

```bash
cd ~/ruby-lab
ruby -e 'require "digest"; puts Digest::MD5.hexdigest("dragon")'
printf 'password\nadmin\nletmein\ndragon\nmonkey\n' > words.txt
```

The hash prints `8621ffdbc5698829397d97767ac13db3`.

### Write it

Save as `crack.rb`:

```ruby
#!/usr/bin/env ruby
require 'digest'

target = ARGV[0] || abort("usage: ruby crack.rb <md5-hash> [wordlist]")
wordlist = ARGV[1] || "words.txt"

found = nil
File.foreach(wordlist) do |line|
  word = line.strip
  if Digest::MD5.hexdigest(word) == target.downcase
    found = word
    break
  end
end

puts found ? "FOUND: #{found}" : "Not in wordlist"
```

### Run it

```bash
ruby crack.rb 8621ffdbc5698829397d97767ac13db3
```

Expected: `FOUND: dragon`.

### Confirm it fails honestly

```bash
ruby crack.rb $(ruby -e 'require "digest"; puts Digest::MD5.hexdigest("not-in-list")')
```

Expected: `Not in wordlist`. A tool that always succeeds tells you nothing.

**One real technique here:** hash length identifies the algorithm. 32 characters is MD5, 40 is SHA1, 64 is SHA256. It is the first thing you check on an unknown hash.

Clean up with `rm words.txt`.

## 17. Ruby in Metasploit

This is why Ruby is worth learning. Every Metasploit module is a Ruby class, and the concepts above are exactly what you need to read one.

```bash
# read the TCP scanner module
less /usr/share/metasploit-framework/modules/auxiliary/scanner/portscan/tcp.rb
```

The shape of a module:

```ruby
class MetasploitModule < Msf::Auxiliary        # inheritance (Section 6)
  def initialize(info = {})                    # constructor, default arg (Section 4)
    super(update_info(info,                    # super (Section 6)
      'Name'        => 'Example Scanner',
      'Description' => 'Demo'
    ))
  end

  def run_host(ip)                             # a method (Section 4)
    begin                                      # exceptions (Section 7)
      connect
      print_good("#{ip} responded")
    rescue ::Rex::ConnectionError
      print_error("#{ip} unreachable")
    end
  end
end
```

Every construct maps to a section here:

| Module code                  | Section               |
| ---------------------------- | --------------------- |
| `class ... < Msf::Auxiliary` | 6, inheritance        |
| `super(update_info(...))`    | 6, calling the parent |
| `def initialize(info = {})`  | 4, default parameter  |
| `begin / rescue`             | 7, exceptions         |
| `{ ... }` and `[ ... ]`      | 3, hashes and arrays  |

**The immediate payoff:** before running an exploit against a system you are responsible for, open the module and read what it actually does. That habit is what the language gives you. Writing your own modules is covered in the Metasploit Scripting material.

## 18. Fast Recall

- **Ruby matters because Metasploit is written in it.** Reading modules is the payoff.
- **Double quotes interpolate** (`"#{x}"`), single quotes do not.
- **Method names are `snake_case`.** A leading capital is allowed but never used.
- **A method returns its last line**, no `return` needed. Three assignments in a row returns the third value.
- **Default parameters:** `def connect(host, port = 80)`.
- **Splat `*args`** collects any number of arguments into an array.
- **`?` methods return true or false. `&.` skips the call if the object is nil.**
- **Blocks replace loops:** `each`, `map` (transform), `select` (keep), `find`.
- **`(1..1024)`** is an inclusive range, used for port ranges.
- **Classes:** `initialize` is the constructor, `@var` is an instance variable. `def self.x` is a class method, callable without `.new`.
- **`class Child < Parent`** inherits; **`super`** calls the parent's version. Every Metasploit module does this.
- **`begin / rescue / ensure`.** Network errors: `ECONNREFUSED` closed, `Timeout::Error` filtered, `SocketError` DNS failed.
- **`File.foreach`** for logs, not `File.read`, which loads the whole file.
- **`Hash.new(0)`** gives counters a default so `+= 1` works.
- **Port scan outcomes are three findings:** connects (open), refused (closed), timeout (filtered).
- **Banner grabbing** identifies a service. SSH announces itself, HTTP waits for a request.
- **Threading:** `Thread.new` then `threads.each(&:join)`. Work in batches, wrap shared writes in a `Mutex`.
- **Hash length identifies the algorithm:** 32 MD5, 40 SHA1, 64 SHA256.
- **Salt defeats precomputed tables; bcrypt and Argon2 defeat speed.** MD5 is bad for passwords because it is fast.

## 19. Resources

**Ruby**

- [Ruby official documentation](https://www.ruby-lang.org/en/documentation/)
- [Ruby core API reference](https://docs.ruby-lang.org/en/master/)
- [Learn Ruby the Hard Way](https://learnrubythehardway.org/book/)

**Standard library used here**

- [Socket](https://docs.ruby-lang.org/en/master/Socket.html)
- [Net::HTTP](https://docs.ruby-lang.org/en/master/Net/HTTP.html)
- [Digest](https://docs.ruby-lang.org/en/master/Digest.html)

**Metasploit**

- [Metasploit Framework source](https://github.com/rapid7/metasploit-framework)
- [Metasploit module development docs](https://docs.metasploit.com/docs/development/developing-modules/get-started-writing-an-exploit.html)

**Practice (authorized labs)**

- [Metasploitable 2](https://sourceforge.net/projects/metasploitable/)
- [TryHackMe](https://tryhackme.com/)
- [Hack The Box](https://www.hackthebox.com/)
