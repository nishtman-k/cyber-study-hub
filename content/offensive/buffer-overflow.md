# Buffer Overflow & Process Memory

> **⚠️ AUTHORIZED USE ONLY.** This material is for education, authorized security testing, and incident response. Reading or writing another process's memory, and testing for memory-corruption vulnerabilities, must only be done on systems you own or are explicitly authorized to work on. Modifying a live process can crash it or corrupt data, so practice on disposable lab systems first and understand that live memory edits are volatile and forensically destructive. Preserve evidence before altering a compromised host. See the [Legal and Terms of Use](/legal) page.

> "Memory does not know what your data means. It only knows where you told it to stop, and whether you kept your word."

**Scope:** Memory corruption from first principles: what a buffer is, Linux process memory layout, how overflows corrupt the stack and heap, overflow types, how attacks are orchestrated, detection methods, consequences, and modern mitigations. Includes practical inspection and modification of live process memory through `/proc`.

## Table of Contents
- [Core Vocabulary](#core-vocabulary)
- [What a Buffer Is](#what-a-buffer-is)
- [Linux Process Memory Layout](#linux-process-memory-layout)
- [What a Buffer Overflow Is](#what-a-buffer-overflow-is)
- [What Causes Buffer Overflows](#what-causes-buffer-overflows)
- [Unsafe Functions](#unsafe-functions)
- [The Stack Frame](#the-stack-frame)
- [Types of Buffer Overflow](#types-of-buffer-overflow)
- [How an Attack Is Orchestrated](#how-an-attack-is-orchestrated)
- [Reading Process Memory with /proc](#reading-process-memory-with-proc)
- [Locating the Heap](#locating-the-heap)
- [Modifying Live Process Memory](#modifying-live-process-memory)
- [Detection Methods](#detection-methods)
- [Consequences](#consequences)
- [Modern Mitigations](#modern-mitigations)
- [Checking Binary Protections](#checking-binary-protections)
- [Secure Coding](#secure-coding)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Vocabulary

| Term | Meaning |
|------|---------|
| **Buffer** | A contiguous block of memory allocated to hold data |
| **Buffer overflow** | Writing more data into a buffer than it was allocated to hold |
| **Stack** | Memory region holding local variables, arguments, and return addresses |
| **Heap** | Memory region for dynamic allocation (`malloc`, `new`) |
| **Return address** | The saved location a function jumps back to when it finishes |
| **Instruction pointer** | The register holding the next instruction to execute (`EIP` on x86, `RIP` on x86-64) |
| **Stack canary** | A guard value placed before the return address to detect overwrites |
| **ASLR** | Address Space Layout Randomization |
| **NX / DEP** | No-Execute, marks memory pages as non-executable |
| **Segmentation fault** | The crash produced when a process accesses invalid memory |
| **CWE-120 / CWE-787** | Classic buffer overflow / Out-of-bounds write |

**The root cause in one line:** the program writes data without verifying it fits in the space allocated for it, so the excess overwrites whatever sits next in memory.

## 2. What a Buffer Is

A buffer is simply a **reserved region of memory of a fixed size**, used to hold data temporarily. It might be an array of characters holding a username, a block holding a network packet, or a region holding a file being read.

```c
char username[32];      // a 32-byte buffer on the stack
char *data = malloc(64); // a 64-byte buffer on the heap
```

The critical property is that a buffer has a **defined size and a defined location**, and the memory immediately after it belongs to something else. C and C++ do not check whether a write stays inside those bounds. That responsibility falls entirely on the programmer, and where the programmer gets it wrong, the write continues into neighbouring memory.

## 3. Linux Process Memory Layout

Understanding overflow requires understanding what sits next to what. A Linux process's virtual address space is arranged in distinct segments.

```text
High addresses
┌────────────────────────┐
│  Kernel space          │  not accessible to the process
├────────────────────────┤
│  Stack                 │  local variables, arguments, return addresses
│         ↓ grows down   │
├────────────────────────┤
│                        │
│  (unmapped gap)        │
│                        │
├────────────────────────┤
│         ↑ grows up     │
│  Heap                  │  malloc, new, dynamic allocation
├────────────────────────┤
│  BSS                   │  uninitialized global and static variables
├────────────────────────┤
│  Data                  │  initialized global and static variables
├────────────────────────┤
│  Text (code)           │  the program instructions, read-only
└────────────────────────┘
Low addresses
```

| Segment | Contents | Writable | Executable |
|---------|----------|----------|-----------|
| **Text** | Compiled machine code | No | Yes |
| **Data** | Initialized globals and statics | Yes | No |
| **BSS** | Uninitialized globals and statics | Yes | No |
| **Heap** | Dynamically allocated memory | Yes | No (with NX) |
| **Stack** | Locals, arguments, return addresses | Yes | No (with NX) |

### The two facts that make overflow exploitable

1. **The stack grows downward, but buffers fill upward.** A local buffer is written from lower to higher addresses, toward the saved frame pointer and return address that sit above it. Overflowing a stack buffer therefore runs directly into the control data.
2. **Adjacent memory belongs to something.** Whatever follows a buffer, whether another variable, a heap chunk header, or a return address, is what gets overwritten first.

## 4. What a Buffer Overflow Is

A buffer overflow occurs when a program writes more data into a buffer than the buffer can hold, so the surplus spills into adjacent memory.

```c
char buffer[8];
strcpy(buffer, "AAAAAAAAAAAAAAAAAAAA");   // 20 bytes into an 8-byte buffer
```

```text
Intended:   [ 8 bytes ]
Actual:     [ 8 bytes ][ 12 bytes written past the end ]
                        ^^^ overwrites whatever was here
```

### Overflow versus attack

| | Buffer overflow | Buffer overflow attack |
|---|-----------------|------------------------|
| **Nature** | A bug: memory is corrupted | Deliberate exploitation of that bug |
| **Typical result** | A crash, or silent corruption | Controlled code execution |
| **Intent** | Accidental | Intentional |

A buffer overflow is a **software defect**. A buffer overflow **attack** is an attacker supplying input crafted so that the overwritten memory contains values of their choosing, converting a crash into control of execution. The distinction matters: most overflows found in testing simply crash, and turning a crash into an exploit is a separate and considerably harder step.

## 5. What Causes Buffer Overflows

| Cause | Explanation |
|-------|-------------|
| **No bounds checking** | C and C++ do not verify that a write stays within an allocation |
| **Unsafe library functions** | Functions that copy until a terminator rather than to a limit |
| **Trusting input length** | Assuming input will not exceed an expected size |
| **Off-by-one errors** | Loop or size arithmetic that permits one byte too many |
| **Incorrect size calculation** | Using the wrong variable, or `sizeof` on a pointer instead of an array |
| **Integer overflow in size math** | A size calculation wraps to a small value, so a small buffer is allocated for large data |
| **Unchecked array indexing** | Using an attacker-controlled index without validating range |
| **Manual memory management** | Programmer-managed allocation invites mistakes |

### Why C and C++ specifically

These languages provide direct memory access and no automatic bounds checking, which is what makes them fast and suitable for systems programming. That same property means the compiler will happily emit code that writes past the end of an array. Memory-safe languages such as Rust, Go, Java, Python, and C# perform bounds checks or manage memory automatically, which eliminates the classic overflow entirely, though they can still be affected through unsafe blocks or native library bindings.

## 6. Unsafe Functions

The functions below copy without respecting the destination's size. Finding them in source is the fastest static indicator of risk.

| Unsafe | Problem | Safer alternative |
|--------|---------|-------------------|
| `gets()` | No length limit at all. Removed from C11 | `fgets()` |
| `strcpy()` | Copies until a null terminator | `strncpy()`, `strlcpy()` |
| `strcat()` | Appends with no bound | `strncat()`, `strlcat()` |
| `sprintf()` | Writes formatted output with no bound | `snprintf()` |
| `vsprintf()` | Same, with a va_list | `vsnprintf()` |
| `scanf("%s", buf)` | Unbounded string read | `scanf("%31s", buf)` with a width |
| `memcpy()` with wrong size | Copies exactly what it is told | Validate the length first |

```c
// VULNERABLE
char buf[64];
strcpy(buf, user_input);

// SAFER: bounded, and explicitly terminated
char buf[64];
strncpy(buf, user_input, sizeof(buf) - 1);
buf[sizeof(buf) - 1] = '\0';

// PREFERRED where available
snprintf(buf, sizeof(buf), "%s", user_input);
```

> **A caveat on `strncpy`:** it does not guarantee null termination when the source fills the destination exactly. Always terminate manually, as above. `snprintf` and `strlcpy` do not have this problem, which is why they are preferred.

## 7. The Stack Frame

Understanding the stack frame explains why stack overflow leads to code execution.

When a function is called, the stack holds, from higher to lower addresses:

```text
Higher addresses
┌──────────────────────┐
│  Function arguments  │
├──────────────────────┤
│  Return address      │  ← where execution resumes after the function
├──────────────────────┤
│  Saved frame pointer │  ← saved RBP of the caller
├──────────────────────┤
│  Local variables     │
│  char buffer[64]     │  ← the buffer starts here and fills UPWARD
└──────────────────────┘
Lower addresses
```

### The mechanism

The buffer sits **below** the return address, and writes fill **upward** toward it. Writing 80 bytes into a 64-byte buffer therefore overwrites, in order: the remaining locals, the saved frame pointer, and then the **return address**.

When the function finishes, the CPU executes a `ret`, which loads whatever now sits in the return-address slot into the instruction pointer and jumps there. If the attacker controls that value, they control where the program goes next.

```text
Normal:     ret loads a valid address  →  execution continues correctly
Overflowed: ret loads attacker bytes    →  execution jumps wherever they chose
```

This single mechanism, control of the return address, is the foundation of classic stack-based exploitation.

## 8. Types of Buffer Overflow

| Type | Where | Mechanism |
|------|-------|-----------|
| **Stack-based** | Stack | Overwrites the saved frame pointer and return address. The classic form |
| **Heap-based** | Heap | Overwrites adjacent heap data or allocator metadata, corrupting function pointers or the free list |
| **Integer overflow** | Anywhere | A size calculation wraps, causing an undersized allocation for oversized data |
| **Off-by-one (fencepost)** | Usually stack | Exactly one byte past the boundary, often the saved frame pointer's least significant byte |
| **Format string** | Anywhere | User input used as a format string, allowing arbitrary read and write via `%n` and `%x` |
| **Unicode / encoding expansion** | Anywhere | A conversion produces more bytes than the source length suggested |

### Stack versus heap

| | Stack-based | Heap-based |
|---|-------------|------------|
| **Target** | Return address, saved frame pointer | Heap metadata, adjacent objects, function pointers |
| **Difficulty** | Lower, the layout is predictable | Higher, requires shaping the heap layout |
| **Detection** | Stack canaries catch most | Harder; relies on allocator hardening |
| **Historical prevalence** | Dominant in older software | More common in modern targets, since stacks are better protected |

Stack canaries and NX made stack overflows considerably harder to exploit, which is a large part of why serious modern memory-corruption research focuses on the heap and on use-after-free.

### Integer overflow leading to overflow

```c
// If len is attacker-controlled and very large, len + 1 can wrap to 0
char *buf = malloc(len + 1);
memcpy(buf, input, len);        // massive copy into a tiny allocation
```

The allocation succeeds with a tiny size, then the copy writes far past it. This is why size arithmetic must be checked before allocation, not just the copy afterward.

## 9. How an Attack Is Orchestrated

The progression from discovery to control, at a conceptual level.

```text
[1] Identify input        find a field that reaches a fixed-size buffer
      ↓
[2] Trigger a crash       send oversized input and observe a segfault
      ↓
[3] Find the offset       determine exactly how many bytes reach the return address
      ↓
[4] Control the pointer   confirm the instruction pointer holds attacker bytes
      ↓
[5] Find usable space     locate where a payload can be placed
      ↓
[6] Redirect execution    point the return address at chosen code
      ↓
[7] Defeat mitigations    work around NX, ASLR, and canaries
```

### The key steps explained

**Finding the offset.** Sending a long, non-repeating pattern and then reading which four or eight bytes landed in the instruction pointer reveals the exact distance from the buffer's start to the return address. This is why cyclic pattern generators exist in exploitation toolkits.

**Controlling the pointer.** Confirming that the instruction pointer contains bytes you chose (a recognizable value such as `0x42424242`) is the moment a crash becomes a candidate exploit. Everything before this is a bug; everything after is exploitation.

**Defeating mitigations** is where modern exploitation actually lives:

| Mitigation | Attacker response |
|------------|-------------------|
| **NX / DEP** stops injected code executing | Reuse code already in the process, via return-to-libc or ROP |
| **ASLR** randomizes addresses | Find an information leak that discloses a real address |
| **Stack canaries** detect overwrites | Leak the canary value, or use a technique that avoids overwriting it |

The practical consequence is that a modern exploit typically requires **chaining an information leak with a memory-corruption primitive**, rather than the single-step overflow of the 1990s. This is why exploitation is far harder now, and why reliable exploits are correspondingly valuable.

## 10. Reading Process Memory with /proc

Linux exposes each process's memory through the `/proc` filesystem, which makes memory layout directly observable and is the practical foundation for both incident response and exploitation research.

### The key files

| Path | Contents |
|------|----------|
| `/proc/PID/maps` | Memory regions: address ranges, permissions, and what they map |
| `/proc/PID/mem` | The process's memory, readable and writable by seeking to an address |
| `/proc/PID/cmdline` | The command line that started it |
| `/proc/PID/environ` | Environment variables |
| `/proc/PID/status` | Process state, UIDs, and capabilities |
| `/proc/PID/fd/` | Open file descriptors |

### Reading the memory map

```bash
cat /proc/$(pgrep -f myservice)/maps
```

Output format:

```text
5654a2f21000-5654a2f22000 r--p 00000000 08:01 1179745  /usr/local/bin/myservice
5654a2f22000-5654a2f23000 r-xp 00001000 08:01 1179745  /usr/local/bin/myservice
5654a4b1c000-5654a4b3d000 rw-p 00000000 00:00 0        [heap]
7ffd8c3a1000-7ffd8c3c2000 rw-p 00000000 00:00 0        [stack]
```

| Column | Meaning |
|--------|---------|
| `5654a4b1c000-5654a4b3d000` | Start and end address of the region |
| `rw-p` | Permissions: read, write, execute, and private or shared |
| `00000000` | Offset into the mapped file |
| `08:01` | Device |
| `1179745` | Inode |
| `[heap]` | The pathname or a special region label |

The bracketed labels `[heap]`, `[stack]`, `[vdso]`, and `[vvar]` identify the special regions directly, which is what makes locating them straightforward.

### Permissions required

To read another process's memory you must be the **same user** or hold `CAP_SYS_PTRACE` (typically root). Many systems also enforce `ptrace_scope`:

```bash
cat /proc/sys/kernel/yama/ptrace_scope
# 0 = any process of the same user
# 1 = only direct children (common default)
# 2 = admin only
# 3 = no attaching at all
```

## 11. Locating the Heap

The heap is where dynamically allocated data lives, including strings built at runtime, so it is the region to search for a value that was not compiled into the binary.

```bash
# find the process
pgrep -f myservice

# show only the heap region
grep '\[heap\]' /proc/PID/maps
```

```python
#!/usr/bin/env python3
"""Locate the heap region of a running process."""
import sys

def find_heap(pid):
    with open(f"/proc/{pid}/maps") as maps:
        for line in maps:
            if "[heap]" in line:
                addr_range = line.split()[0]
                start, end = (int(x, 16) for x in addr_range.split("-"))
                return start, end
    return None

pid = int(sys.argv[1])
region = find_heap(pid)
if region:
    start, end = region
    print(f"heap: 0x{start:x} - 0x{end:x}  ({end - start} bytes)")
else:
    print("no heap region found")
```

### Searching the heap for a string

```python
#!/usr/bin/env python3
"""Search a process heap for a target string and report its addresses."""
import sys

def heap_range(pid):
    with open(f"/proc/{pid}/maps") as maps:
        for line in maps:
            if "[heap]" in line:
                a, b = line.split()[0].split("-")
                return int(a, 16), int(b, 16)
    raise RuntimeError("heap not found")

pid = int(sys.argv[1])
needle = sys.argv[2].encode()

start, end = heap_range(pid)
with open(f"/proc/{pid}/mem", "rb") as mem:
    mem.seek(start)
    data = mem.read(end - start)

offset = data.find(needle)
while offset != -1:
    print(f"found at 0x{start + offset:x}")
    offset = data.find(needle, offset + 1)
```

Reading the whole region at once is simple but can be large. For big heaps, read in chunks and handle matches that straddle a chunk boundary by overlapping reads by the length of the search string.

## 12. Modifying Live Process Memory

This is the incident-response technique the scenario calls for: neutralizing a value inside a running process without stopping it.

```python
#!/usr/bin/env python3
"""Overwrite a string in a running process's heap.
Authorized incident response use only."""
import sys

def heap_range(pid):
    with open(f"/proc/{pid}/maps") as maps:
        for line in maps:
            if "[heap]" in line:
                a, b = line.split()[0].split("-")
                return int(a, 16), int(b, 16)
    raise RuntimeError("heap not found")

pid     = int(sys.argv[1])
target  = sys.argv[2].encode()

start, end = heap_range(pid)

with open(f"/proc/{pid}/mem", "rb+") as mem:
    mem.seek(start)
    data = mem.read(end - start)

    offset = data.find(target)
    if offset == -1:
        print("target not found")
        sys.exit(1)

    addr = start + offset
    mem.seek(addr)
    mem.write(b"\x00" * len(target))    # overwrite in place, same length
    print(f"neutralized {len(target)} bytes at 0x{addr:x}")
```

### The rules that make this safe

| Rule | Reason |
|------|--------|
| **Never change the length** | Writing more bytes than the original overwrites adjacent data and will likely crash the process |
| **Prefer null bytes or benign values** | A truncating null terminates the string harmlessly in C |
| **Verify before writing** | Read the region back and confirm the match is the intended one, not a coincidental substring |
| **Capture evidence first** | Dump the region before modifying it. The original value is evidence, and the edit destroys it |
| **Expect volatility** | The change exists only in RAM. A restart restores the original from disk |
| **Accept the risk of a crash** | Live memory editing can destabilize the process. Have a recovery plan |

### The forensic caveat that matters most

Modifying a live process **destroys evidence and is not a fix**. The malicious value is still in the binary or configuration on disk, so it returns on restart. This technique buys time in an incident, nothing more. The correct sequence is: **capture a full memory dump first**, then neutralize, then perform proper eradication on disk. Skipping the dump means losing the evidence that explains the compromise.

## 13. Detection Methods

| Method | Approach | Finds |
|--------|----------|-------|
| **Static analysis (SAST)** | Analyze source without running it | Unsafe function calls, missing bounds checks |
| **Compiler warnings** | `-Wall -Wextra -Werror` | Obvious size and type errors |
| **Fuzzing** | Feed malformed and oversized input at scale | Crashes revealing memory corruption |
| **AddressSanitizer (ASan)** | Compile-time instrumentation | Out-of-bounds reads and writes, use-after-free, with exact location |
| **Valgrind (Memcheck)** | Runtime analysis without recompiling | Invalid reads and writes, leaks |
| **Manual code review** | Human inspection | Logic errors that tools miss |
| **Crash triage** | Analyze core dumps and crash patterns | Whether a crash is exploitable |

### Practical commands

```bash
# compile with AddressSanitizer
gcc -fsanitize=address -g -o prog prog.c
./prog                        # reports the exact overflow location

# Valgrind on an existing binary
valgrind --leak-check=full --track-origins=yes ./prog

# grep source for unsafe functions
grep -rnE '\b(gets|strcpy|strcat|sprintf|vsprintf)\s*\(' src/

# fuzzing with AFL++
afl-fuzz -i inputs/ -o findings/ -- ./prog @@
```

**ASan is the highest-value tool** for development: it pinpoints the exact line and the exact allocation involved, turning a mysterious crash into a specific, fixable bug. Fuzzing is the highest-value tool for finding unknown bugs, because it explores input space no human would think to try.

### Detecting exploitation at runtime

| Signal | Indicates |
|--------|-----------|
| Repeated segmentation faults in one service | Possible overflow probing |
| `*** stack smashing detected ***` in logs | A stack canary fired |
| Unexpected child processes from a service | Possible successful exploitation |
| Crash reports with non-address values in the instruction pointer | Pointer control attempts |

## 14. Consequences

| Consequence | Detail |
|-------------|--------|
| **Crash / denial of service** | The most common outcome. The process dies |
| **Arbitrary code execution** | The attacker runs code with the process's privileges |
| **Privilege escalation** | Overflow in a setuid or service process yields elevated access |
| **Data corruption** | Adjacent variables silently overwritten, producing wrong results |
| **Information disclosure** | Over-read (as in Heartbleed) leaks adjacent memory contents |
| **Security control bypass** | Overwriting an authentication flag or permission variable |
| **Full system compromise** | Kernel or driver overflows yield ring-0 control |
| **Worm propagation** | Historically, remotely exploitable overflows enabled self-spreading malware |

### Why severity is contextual

The same bug rates very differently depending on where it lives. A local overflow in a user application is serious; the same flaw in an internet-facing service running as root is critical, and in a kernel driver it is catastrophic. Ratings should account for the process privilege, whether the input is remote, and whether mitigations are active.

## 15. Modern Mitigations

Defense here is layered, and the layers together are why classic overflow exploitation is now difficult.

| Mitigation | Mechanism | Defeats |
|------------|-----------|---------|
| **Stack canary** | A random value before the return address, checked on return | Straightforward stack smashing |
| **NX / DEP** | Marks stack and heap non-executable | Injected shellcode |
| **ASLR** | Randomizes segment base addresses each run | Hardcoded addresses in exploits |
| **PIE** | Position Independent Executable, lets the binary itself be randomized | Fixed code addresses |
| **RELRO** | Makes relocation data read-only after startup | GOT overwrite |
| **FORTIFY_SOURCE** | Compile-time bounds checks on known-size buffers | Many common overflows |
| **Control Flow Integrity (CFI)** | Validates indirect call and jump targets | ROP and code reuse |
| **Shadow stack / CET** | Hardware-backed return address protection | Return address overwrite |

### Compiler flags

```bash
gcc -o prog prog.c \
    -fstack-protector-strong \   # stack canaries
    -D_FORTIFY_SOURCE=2 -O2 \    # bounds checks on known sizes
    -Wl,-z,relro,-z,now \        # full RELRO
    -Wl,-z,noexecstack \         # non-executable stack
    -pie -fPIE                   # position independent
```

### System-level

```bash
# check ASLR status: 2 means full randomization
cat /proc/sys/kernel/randomize_va_space
```

### The honest limitation

None of these fixes the bug. They raise the cost of exploiting it, sometimes enormously, but a determined attacker with an information leak can still work around ASLR and canaries. **Mitigations buy time and eliminate mass exploitation; correct code eliminates the vulnerability.** Treat them as defense in depth, not as a reason to leave a known overflow unpatched.

## 16. Checking Binary Protections

```bash
checksec --file=/usr/local/bin/myservice
```

```text
RELRO           STACK CANARY   NX          PIE
Full RELRO      Canary found   NX enabled  PIE enabled
```

Alternatives when `checksec` is unavailable:

```bash
# non-executable stack?
readelf -l ./prog | grep -A1 GNU_STACK

# stack canary present?
objdump -d ./prog | grep -c __stack_chk_fail

# PIE? Type DYN indicates PIE, EXEC indicates non-PIE
readelf -h ./prog | grep Type
```

This is a standard first step in both defensive review and assessment: it tells you immediately which mitigations are in play and therefore how much protection a given overflow actually has behind it.

## 17. Secure Coding

### The hierarchy of fixes

| Priority | Approach |
|----------|----------|
| **1** | **Use a memory-safe language** where feasible. Rust, Go, Java, C#, and Python eliminate the class |
| **2** | **Use bounded functions** in C and C++: `snprintf`, `strlcpy`, `fgets` |
| **3** | **Validate input length** before any copy |
| **4** | **Check size arithmetic** for integer overflow before allocating |
| **5** | **Enable all compiler mitigations** |
| **6** | **Test with ASan and fuzzing** in CI |

### The core rules

```c
// Always bound the write to the destination size
snprintf(dest, sizeof(dest), "%s", src);

// Validate length before copying
if (input_len >= sizeof(buffer)) {
    return ERROR_TOO_LONG;
}
memcpy(buffer, input, input_len);

// Check arithmetic before allocating
if (count > SIZE_MAX / item_size) {
    return ERROR_OVERFLOW;
}
buf = malloc(count * item_size);

// sizeof on a pointer gives the pointer size, not the buffer size
void f(char *p) {
    // sizeof(p) is 8, not the buffer length. Pass the length explicitly.
}
```

**The single most important habit:** always know the size of the destination, and always bound the write to it. Every classic overflow comes from a write whose length was governed by the *source* rather than the *destination*.

## 18. Fast Recall

- **A buffer** is a fixed-size block of memory. **Buffer overflow** is writing past its end into adjacent memory. **CWE-120 / CWE-787**.
- **An overflow is a bug; an overflow attack is deliberate exploitation** of it to control execution.
- **Memory layout, low to high:** text (code), data, BSS, heap (grows up), gap, stack (grows down).
- **The stack grows down but buffers fill up**, so a stack buffer overflows into the saved frame pointer and then the **return address**.
- **Controlling the return address controls execution**, because `ret` loads it into the instruction pointer.
- **Root cause:** C and C++ perform no bounds checking, so the programmer must enforce limits.
- **Unsafe functions:** `gets`, `strcpy`, `strcat`, `sprintf`, `vsprintf`, `scanf("%s")`. Use `fgets`, `snprintf`, `strlcpy`.
- **`strncpy` does not guarantee null termination.** Terminate manually.
- **Types:** stack-based, heap-based, integer overflow, off-by-one, format string, encoding expansion.
- **Attack chain:** find input, crash it, find the offset, control the pointer, place a payload, defeat mitigations.
- **Modern exploitation needs an information leak** plus corruption, because ASLR and canaries defeat single-step attacks.
- **NX forces code reuse** (return-to-libc, ROP) rather than injected shellcode.
- **`/proc/PID/maps`** shows memory regions with `[heap]` and `[stack]` labelled. **`/proc/PID/mem`** is read and written by seeking to an address.
- **Reading another process's memory** requires the same user or `CAP_SYS_PTRACE`, and is further restricted by `ptrace_scope`.
- **When editing live memory, never change the length.** Overwrite in place with nulls.
- **Dump memory before modifying it.** The edit destroys evidence and is volatile, not a fix.
- **Detection:** ASan for precise location, Valgrind without recompiling, fuzzing for unknown bugs, static analysis for unsafe calls.
- **Mitigations:** stack canaries, NX/DEP, ASLR, PIE, RELRO, FORTIFY_SOURCE, CFI, shadow stacks. Check with **`checksec`**.
- **Mitigations raise cost; they do not fix the bug.** Correct code does.

## 19. Resources

**Fundamentals and classification**
- [OWASP: Buffer Overflow](https://owasp.org/www-community/vulnerabilities/Buffer_Overflow)
- [MITRE CWE-120: Classic Buffer Overflow](https://cwe.mitre.org/data/definitions/120.html)
- [MITRE CWE-787: Out-of-bounds Write](https://cwe.mitre.org/data/definitions/787.html)
- [MITRE CWE-121: Stack-based Buffer Overflow](https://cwe.mitre.org/data/definitions/121.html)
- [MITRE CWE-122: Heap-based Buffer Overflow](https://cwe.mitre.org/data/definitions/122.html)
- [SEI CERT C Coding Standard](https://wiki.sei.cmu.edu/confluence/display/c)

**Process memory and /proc**
- [The /proc filesystem (kernel documentation)](https://www.kernel.org/doc/Documentation/filesystems/proc.txt)
- [man proc(5)](https://man7.org/linux/man-pages/man5/proc.5.html)
- [man ptrace(2)](https://man7.org/linux/man-pages/man2/ptrace.2.html)

**Detection tooling**
- [AddressSanitizer](https://github.com/google/sanitizers/wiki/AddressSanitizer)
- [Valgrind](https://valgrind.org/)
- [AFL++ fuzzer](https://github.com/AFLplusplus/AFLplusplus)
- [checksec](https://github.com/slimm609/checksec.sh)

**Mitigations**
- [GCC instrumentation options](https://gcc.gnu.org/onlinedocs/gcc/Instrumentation-Options.html)
- [Debian Hardening Guide](https://wiki.debian.org/Hardening)

**Practice (authorized labs)**
- [pwn.college](https://pwn.college/)
- [Exploit Education (Phoenix, Protostar)](https://exploit.education/)
- [OverTheWire: Narnia](https://overthewire.org/wargames/narnia/)
