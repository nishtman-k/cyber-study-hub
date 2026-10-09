# Dynamic Analysis in Reverse Engineering

**Scope:** observe a running binary, explain its decisions, and connect its internal state to operating-system activity. This follows [Reverse Engineering Fundamentals](/cheatsheet/re-fundamentals/) and [Static Analysis in Reverse Engineering](/cheatsheet/re-static-analysis/).

**Why it matters:** static analysis reconstructs possible behavior from stored code and data. Dynamic analysis reveals the instructions, values, and effects produced during a particular execution. Combining them helps explain unpacked code, constructed strings, input checks, crashes, and environment-dependent behavior.

**Conventions:** shell examples assume Linux; debugger blocks run inside the named debugger. Register and assembly examples use **x86-64** unless stated otherwise. Addresses, filenames, and outputs are illustrative, not observations from a supplied binary. Replace example addresses with values from your own session. Commands that launch the sample belong in the analysis environment.

**Platform note:** Kali ARM on Apple Silicon runs AArch64 binaries natively. An x86-64 ELF needs a compatible execution environment or emulation; selecting an architecture in a disassembler does not make it executable. Windows PE exercises need a compatible Windows environment. Check the target's architecture before using register examples.

## Table of Contents

- [Quick Reference](#quick-reference)
- [Static and Dynamic Analysis](#static-and-dynamic-analysis)
- [Prepare and Observe a Run](#prepare-and-observe-a-run)
- [Choose the Right Tool](#choose-the-right-tool)
- [Start Debugging with GDB](#start-debugging-with-gdb)
- [Breakpoints and Watchpoints](#breakpoints-and-watchpoints)
- [Registers, Memory, and Function Arguments](#registers-memory-and-function-arguments)
- [Step and Trace Execution](#step-and-trace-execution)
- [Dump Memory and Inspect Crashes](#dump-memory-and-inspect-crashes)
- [Linux System Calls and Library Calls](#linux-system-calls-and-library-calls)
- [Windows Debugging with x64dbg and OllyDbg](#windows-debugging-with-x64dbg-and-ollydbg)
- [Monitor Windows with Process Monitor](#monitor-windows-with-process-monitor)
- [Inspect Network Behavior with Wireshark](#inspect-network-behavior-with-wireshark)
- [Unpacking and Self-Modifying Code](#unpacking-and-self-modifying-code)
- [Recognize and Investigate Anti-Debugging](#recognize-and-investigate-anti-debugging)
- [SAT, SMT, and Z3](#sat-smt-and-z3)
- [Symbolic and Concolic Execution](#symbolic-and-concolic-execution)
- [Memory Errors and Analysis Pitfalls](#memory-errors-and-analysis-pitfalls)
- [Document Findings and Reproduce Results](#document-findings-and-reproduce-results)
- [Applications and Fast Recall](#applications-and-fast-recall)
- [Resources](#resources)

---

## 1. Quick Reference

**Choose an observation that answers a question.** A breakpoint explains a decision; a syscall trace explains an operating-system interaction; a packet capture explains traffic visible at the capture point.

| Question                              | First useful technique                                        |
| ------------------------------------- | ------------------------------------------------------------- |
| Which branch accepts this input?      | Break before the comparison; inspect operands and flags       |
| What bytes exist after decoding?      | Stop after the decoding loop; examine or dump its destination |
| Who changes this value?               | Watchpoint on the relevant memory location                    |
| Which files does the process open?    | `strace` on Linux; Process Monitor on Windows                 |
| Which address does it contact?        | Process network events plus Wireshark                         |
| Where did it crash?                   | Faulting instruction, registers, call stack, input            |
| Which input satisfies several checks? | Reconstruct constraints; solve; test the candidate            |

Linux terminal, using a known training binary in an analysis VM:

```bash
file ./sample
sha256sum ./sample
mkdir -p evidence
gdb -q --args ./sample test-input
```

Inside GDB, when `main` is available:

```text
set disassembly-flavor intel
set disable-randomization off
break main
run
x/8i $pc
info registers
bt
```

`--args` separates the target and its arguments from GDB options. `x/8i $pc` shows eight instructions at the program counter; `bt` shows the current call stack. The Intel disassembly setting applies to x86 targets.

---

## 2. Static and Dynamic Analysis

| Aspect           | Static analysis                                     | Dynamic analysis                                               |
| ---------------- | --------------------------------------------------- | -------------------------------------------------------------- |
| Target execution | Examines the stored program without running it      | Runs the program or examines a captured runtime state          |
| Main evidence    | Instructions, references, constants, possible paths | Executed paths, actual values, memory, calls, external effects |
| Main strength    | Broad structural understanding                      | Concrete behavior under specified conditions                   |
| Main difficulty  | Obfuscation, indirect calls, uncertain types        | Coverage, setup, timing, anti-analysis behavior                |
| Typical tools    | Disassembler, decompiler, file inspector            | Debugger, tracer, monitor, packet capture                      |

**Neither method answers everything alone.** Static reasoning can sometimes recover packed or obfuscated logic without running the original sample. Dynamic execution reveals only the paths exercised by that input and environment.

Example: static inspection finds a URL in the binary. A runtime capture shows a DNS request for its hostname. These support different claims: the URL exists; the hostname was queried. Neither observation alone establishes a successful connection or data transfer.

Use a loop:

```text
Static hypothesis → focused runtime observation → revised explanation → new test
```

---

## 3. Prepare and Observe a Run

For unknown binaries, use a disposable VM with a clean snapshot, no personal credentials or shared folders, and a controlled network. NAT alone does not isolate a sample from external services. Start offline or use a dedicated simulated network when network behavior is part of the exercise.

| Step                                               | Purpose                                                        |
| -------------------------------------------------- | -------------------------------------------------------------- |
| Identify format and architecture                   | Choose an environment and debugger that can execute the target |
| Hash the original file                             | Tie every result to the exact binary                           |
| Record OS, arguments, working directory, and input | Make differences between runs explainable                      |
| Start monitoring before execution                  | Capture short-lived processes and early startup activity       |
| Run a baseline with a known input                  | Establish what happens before modifying state                  |
| Change one condition per run                       | Connect a behavioral difference to its likely cause            |
| Save evidence, then restore the snapshot           | Preserve findings while resetting the environment              |

**Baseline** means the original program under a recorded setup. Debugging, tracing, network restrictions, and emulation can themselves change behavior; note which were present.

An apparently inactive program may be waiting for input, missing a file, sleeping, or taking an untested branch. “Nothing happened” is a starting question, not a conclusion.

---

## 4. Choose the Right Tool

| Tool                   | Role in this project                                                            |
| ---------------------- | ------------------------------------------------------------------------------- |
| GDB                    | Control execution, inspect registers and memory, debug ELF binaries             |
| x64dbg / x32dbg        | Debug Windows x64 / x86 targets with disassembly, memory, and breakpoint views  |
| OllyDbg                | Analyze 32-bit x86 Windows programs in older course exercises                   |
| Process Monitor        | Correlate Windows file, Registry, and process/thread events                     |
| Wireshark              | Inspect captured packets and application protocols                              |
| `strace` / `ltrace`    | Trace Linux system calls / selected library calls                               |
| Valgrind Memcheck      | Investigate invalid memory use and leaks on supported targets                   |
| Intel Pin              | Instrument supported binaries to collect selected execution events              |
| Z3                     | Solve constraints involving bit-vectors, integers, and other supported theories |
| MiniSat                | Solve Boolean satisfiability problems encoded as clauses                        |
| Cuckoo Sandbox         | Automate execution and collection of behavior reports in configured guests      |
| IDA Pro / Binary Ninja | Link static analysis to debugging when a suitable backend is available          |
| Immunity Debugger      | Recognize it in older Windows x86 debugging exercises                           |

You do not need all these tools in one investigation. Learn one debugger, one system monitor, and one packet analyzer first. Tool architecture, guest OS, backend, and version support must match the target.

Pin adds instrumentation to collect events such as instruction execution or memory access; this introduces overhead and can affect timing. See the [Intel Pin overview](https://www.intel.com/content/www/us/en/developer/articles/tool/pin-a-binary-instrumentation-tool-downloads.html). OllyDbg's original focus is 32-bit Windows analysis; use the appropriate debugger for a 64-bit target. [OllyDbg project](https://www.ollydbg.de/).

---

## 5. Start Debugging with GDB

**A debugger pauses a program so you can inspect its state.** Opening a file in GDB and running it are separate actions.

```bash
gdb -q --args ./sample hello
```

Inside GDB:

```text
set disassembly-flavor intel
set pagination off
set logging file evidence/gdb.txt
set logging enabled on
show architecture
show args
set disable-randomization off
break main
run
```

`-q` reduces the startup banner. Pagination controls debugger output. Logging saves GDB's output; capture the target's own output separately if you need a complete transcript. [GDB logging](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Logging-Output.html).

`run` starts the target; issuing it again restarts execution. `continue` resumes the stopped process. `start` runs to the main procedure when available. For a stripped binary with no `main` symbol, use `starti` to stop at the first executed instruction, which may be inside the dynamic loader. [Starting a program](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Starting.html).

### ASLR and runtime addresses

ASLR changes where memory is mapped. On supported platforms, GDB commonly disables it for programs it launches; `set disable-randomization off` leaves the OS's normal randomization behavior in effect. Record the setting instead of assuming the address from an earlier run still applies.

After startup:

```text
info files
info proc mappings
info sharedlibrary
```

These views connect the executable, mappings, and loaded libraries. `info proc mappings` is platform-dependent. For ELF, translate through the correct load bias; the start of an arbitrary mapping is not automatically the bias. For PE:

```text
runtime address = loaded module base + RVA
```

Prefer symbols when available; otherwise record module-relative locations alongside runtime addresses.

---

## 6. Breakpoints and Watchpoints

**A breakpoint stops at code. A watchpoint stops on a data condition. A catchpoint stops on an event.**

| GDB command                  | Meaning                                                            |
| ---------------------------- | ------------------------------------------------------------------ |
| `break main`                 | Stop when execution reaches the resolved function breakpoint       |
| `break *0x401180`            | Stop at this exact runtime instruction address                     |
| `tbreak *0x401180`           | Remove the breakpoint after its first hit                          |
| `break check if length > 32` | Stop only when the expression is true; symbols must be available   |
| `info breakpoints`           | List breakpoints, watchpoints, and catchpoints                     |
| `disable 2` / `enable 2`     | Turn breakpoint 2 off / on                                         |
| `delete 2`                   | Remove breakpoint 2                                                |
| `catch syscall openat`       | Stop at entry to and return from this syscall on supported targets |

Addresses and breakpoint numbers above are examples. A named breakpoint may resolve after a function prologue; use an exact entry address when arguments must be inspected before any instructions change them. [GDB breakpoints](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Set-Breaks.html).

For a known valid address containing a four-byte integer:

```text
watch -l *(unsigned int *)0x404040
continue
```

Illustrative output:

```text
Hardware watchpoint 2: -location *(unsigned int *)0x404040
Old value = 0
New value = 1
```

The value changed. Inspect nearby instructions and the call stack to identify the writer. On x86, a data watchpoint typically stops after the access, so the current instruction may be the one following the write.

`watch` detects a value change; a store of the same value may not produce a reported change. `rwatch` watches reads; `awatch` watches reads and writes. Hardware support, slot counts, sizes, and alignment limit what can be watched. Software watchpoints can be much slower. [GDB watchpoints](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Set-Watchpoints.html).

Software breakpoints typically replace instruction bytes with a trap; hardware execution breakpoints avoid that code-byte modification but are limited. In GDB, `hbreak *ADDRESS` requests a hardware execution breakpoint.

---

## 7. Registers, Memory, and Function Arguments

**Registers hold the current working values; memory holds code, buffers, objects, and stack data.** Inspect them at the point where they have meaning.

```text
info registers
x/10i $pc
x/16bx $rsp
x/8gx $rsp
bt
```

GDB's memory syntax is `x/COUNT-FORMAT-UNIT ADDRESS`:

| Example          | Read it as                                     |
| ---------------- | ---------------------------------------------- |
| `x/16bx ADDRESS` | 16 one-byte units in hexadecimal               |
| `x/8gx ADDRESS`  | 8 eight-byte units in hexadecimal              |
| `x/s ADDRESS`    | A null-terminated byte string                  |
| `x/10i $pc`      | 10 decoded instructions at the program counter |

`x/s` is appropriate only when a readable, terminated string is expected. Use a bounded byte view for binary data or uncertain termination. [GDB memory inspection](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Memory.html).

### Find arguments using the calling convention

For ordinary integer/pointer arguments:

| ABI                   | First arguments                | Typical scalar integer return    |
| --------------------- | ------------------------------ | -------------------------------- |
| Linux x86-64 System V | `RDI, RSI, RDX, RCX, R8, R9`   | `RAX` / `EAX` according to width |
| Windows x64           | `RCX, RDX, R8, R9`, then stack | `RAX` / `EAX` according to width |
| AArch64 AAPCS64       | `X0` through `X7`              | `X0` / `W0` according to width   |

Floating-point values, structures, methods, and variadic functions can follow additional rules. Windows x64 reserves stack shadow space; do not interpret its stack as a Linux call frame. [Microsoft x64 calling convention](https://learn.microsoft.com/en-us/cpp/build/x64-calling-convention).

For the other table rows, see the [System V x86-64 ABI](https://gitlab.com/x86-psABIs/x86-64-ABI) and [Arm AAPCS64](https://github.com/ARM-software/abi-aa/blob/main/aapcs64/aapcs64.rst). On a native AArch64 target, use its register names, for example:

```text
info registers x0 x1 sp pc
x/8i $pc
x/16bx $sp
```

Here, `X0` and `X1` hold the first two ordinary integer/pointer arguments at function entry. Skip the x86-only Intel disassembly setting.

### Example: inspect a comparison

On Linux x86-64, stop **immediately before a known call to `strcmp`**. The caller has prepared its arguments:

```text
x/s $rdi
x/s $rsi
```

Illustrative output:

```text
0x7fffffffe120: "hello"
0x555555556020: "open"
```

This call will compare those strings. Use `nexti` to execute the call, then inspect its `int` result:

```text
print/d (int)$eax
```

For `strcmp`, zero means equal; a negative or positive result indicates lexical ordering. Do not assume every failure returns exactly `-1`, or that the program treats zero as success without inspecting the caller's branch. Inlined comparisons may never call `strcmp` at all.

---

## 8. Step and Trace Execution

**Stepping** advances execution under your control. **Tracing** records a sequence of events or instructions for later inspection.

| GDB command      | Effect                                                                      |
| ---------------- | --------------------------------------------------------------------------- |
| `stepi` / `si`   | Execute one machine instruction, entering calls                             |
| `nexti` / `ni`   | Advance over one instruction, running a called function until it returns    |
| `step` / `s`     | Step at source-line level, entering calls where possible                    |
| `next` / `n`     | Step at source-line level, stepping over calls                              |
| `finish`         | Continue until the current function returns, unless another stop intervenes |
| `continue` / `c` | Resume until a stop event or termination                                    |
| `display/i $pc`  | Print the current instruction at each debugger stop                         |

Stepping over a call **executes it**, including its side effects. Prefer instruction stepping when source information is missing. [GDB stepping](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Continuing-and-Stepping.html).

### Follow one decision

```asm
cmp eax, 5
jne rejected
```

1. Stop before `cmp`; inspect `EAX`.
2. Execute `cmp` with `si`; inspect `eflags` on x86.
3. If `EAX` equals 5, the comparison sets the zero flag (`ZF=1`).
4. Execute `jne`; it jumps when `ZF=0`.
5. Confirm where the program counter actually goes.

Signed branches such as `jl` and unsigned branches such as `jb` interpret flags differently. The branch mnemonic is part of the recovered condition.

### Record a short instruction trace

With logging enabled and the process stopped:

```text
set $count = 0
while $count < 20
  x/i $pc
  stepi
  set $count = $count + 1
end
```

This records up to 20 step attempts and may stop early on exit or error. It does not guarantee 20 instructions of application code: a call may enter a library. Limit traces to the region answering your question; large traces quickly become hard to interpret.

For threaded programs, record the thread as well as the instruction. Other threads may run while you step, depending on debugger settings.

---

## 9. Dump Memory and Inspect Crashes

**A memory dump preserves bytes as they exist at a specific point in execution.** Use it for decoded strings, generated code, transformed input, or crash investigation.

Suppose a mapped buffer occupies `0x600000` through `0x600fff` in the current run:

```text
dump binary memory evidence/buffer.bin 0x600000 0x601000
```

The end address is exclusive, so this saves `0x1000` bytes (4096 bytes). Check the mapping first. [GDB dump command](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Dump_002fRestore-Files.html).

In the Linux terminal:

```bash
xxd -g 1 -l 64 evidence/buffer.bin
strings -a -n 4 evidence/buffer.bin
sha256sum evidence/buffer.bin
```

`xxd` shows the first 64 bytes; `strings` extracts printable runs of at least four characters. Neither establishes what the bytes mean without the location and execution context.

### Raw dump versus core dump

| Artifact                 | Contains                                | Main limitation                              |
| ------------------------ | --------------------------------------- | -------------------------------------------- |
| Raw memory range         | Selected bytes                          | No automatic address map or register context |
| Core dump                | Registers and selected process mappings | Platform and dump settings can omit regions  |
| Reconstructed executable | A repaired loadable image               | Usually requires more than copying memory    |

On a supported GDB target:

```text
generate-core-file evidence/sample.core
```

Later, open it with the matching binary:

```bash
gdb -q ./sample evidence/sample.core
```

Inside GDB:

```text
bt
info registers
x/8i $pc
```

A core file supports postmortem inspection, not resuming the captured process. Preserve the matching executable and relevant libraries. [GDB core generation](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Core-File-Generation.html).

---

## 10. Linux System Calls and Library Calls

**An API call is a request to an interface; a syscall enters the kernel.** A library function can make several syscalls, delay one through buffering, or make none.

Example:

```text
Application → fopen()/fread() → openat()/read() → kernel → filesystem
```

### Trace operating-system interactions

```bash
strace -f -tt -s 256 -o evidence/strace.log ./sample test-input
```

| Option    | Purpose                                          |
| --------- | ------------------------------------------------ |
| `-f`      | Follow child processes created during tracing    |
| `-tt`     | Include time-of-day timestamps with microseconds |
| `-s 256`  | Increase the string display limit                |
| `-o FILE` | Write the trace to a file                        |

To focus a later run:

```bash
strace -f -e trace=%file,%network,%process -o evidence/behavior.log ./sample
```

The filter selects syscall categories; it does not preserve every subsequent read or write. Keep a broader trace when the exact data flow matters. [strace manual](https://github.com/strace/strace/blob/master/doc/strace.1.in).

Illustrative output:

```text
openat(AT_FDCWD, "config.ini", O_RDONLY) = 3
read(3, "mode=test\n", 4096) = 10
connect(4, {sa_family=AF_INET, sin_port=htons(443),
           sin_addr=inet_addr("192.0.2.10")}, 16) = -1 ECONNREFUSED
```

The file open returned descriptor 3. The read returned 10 bytes. The connection attempt failed; this does not show a successful session. `192.0.2.10` is a documentation address.

File descriptors can be reused after closing and belong to a process context. Correlate PID, timestamps, and return values. Dynamic-loader activity may explain many early file accesses.

### Library calls and focused debugger stops

```bash
ltrace -f -s 128 -o evidence/ltrace.log ./sample
```

`ltrace` observes supported library-call boundaries. Inlining, static linking, direct syscalls, and platform support can limit visibility; missing output does not prove an operation is absent. [ltrace project](https://ltrace.org/).

In GDB:

```text
catch syscall openat
catch syscall connect
continue
```

A syscall catchpoint normally stops both on entry and return. Inspect the returned value at the return stop. Syscall availability varies by OS and architecture. [GDB catchpoints](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Set-Catchpoints.html).

Linux x86-64 syscalls use `RDI, RSI, RDX, R10, R8, R9` for arguments; argument four uses `R10`, unlike a normal System V function call. Do not apply this register layout to AArch64.

---

## 11. Windows Debugging with x64dbg and OllyDbg

**Use x64dbg for x64 targets and x32dbg for x86 targets.** For an older course exercise using OllyDbg, the same concepts apply: disassembly, registers, stack, memory, breakpoints, and stepping.

### First pass

1. Open the executable in the matching debugger and record the command line.
2. Identify the current module and stop reason; a system breakpoint may occur before application code.
3. Locate a relevant function or API call using the static-analysis findings.
4. Set a breakpoint, run to it, and inspect arguments before the call.
5. Step over the call and inspect its documented return value.
6. Follow the next branch and correlate it with the external behavior.

| View               | What it helps answer                      |
| ------------------ | ----------------------------------------- |
| CPU / disassembly  | Which instruction executes next?          |
| Registers          | What values and flags drive the decision? |
| Dump               | What bytes does a pointer refer to?       |
| Stack / call stack | Which function called this code?          |
| Memory map         | Which regions and permissions exist?      |
| Breakpoints        | Which events will stop execution?         |

In x64dbg's command box, when `CreateFileW` resolves:

```text
bp CreateFileW
run
```

`bp` sets a software breakpoint at the resolved address. If an export is forwarded or unresolved, locate the actual implementation in the loaded modules. [x64dbg breakpoint command](https://help.x64dbg.com/en/latest/commands/breakpoint-control/SetBPX.html).

At entry to `CreateFileW` on Windows x64, `RCX` points to the UTF-16 filename. Follow it in the Dump view and select a suitable text display. A successful call returns a handle; failure returns `INVALID_HANDLE_VALUE`. Inspect the other arguments and the result before claiming a file was created: the API can also open existing files. [CreateFileW reference](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilew).

Use **Step Into**, **Step Over**, **Run**, and **Run until selection** from the Debug menu. x64dbg's **Execute till return** stops at a return instruction; it is not identical to GDB's `finish`, which continues through the return. [x64dbg Debug menu](https://help.x64dbg.com/en/latest/gui/menus/Debug.html).

In OllyDbg, use the corresponding Run and Step controls and set a breakpoint on the selected disassembly instruction. Its 32-bit registers and stack arguments require the target's x86 calling convention; the Windows x64 register table does not apply.

---

## 12. Monitor Windows with Process Monitor

**Process Monitor connects a process to observable system activity.** It is useful when the question is “what file or Registry value did the program access?” rather than “what does this register contain?”

1. Start Process Monitor in the analysis VM before launching the sample.
2. Clear old events and begin capture.
3. Run the sample with a recorded input.
4. Use Process Tree and process details to identify its PID and children.
5. Filter to those processes; stop capture when the test is complete.
6. Save the native PML for detailed review and export selected rows when useful.

| Field         | Interpretation                                                  |
| ------------- | --------------------------------------------------------------- |
| Process / PID | Which process produced the event                                |
| Operation     | Activity such as `CreateFile`, `WriteFile`, or `RegSetValue`    |
| Path          | File, Registry key, or other object involved                    |
| Result        | Whether the operation succeeded or why it failed                |
| Detail        | Access mode, length, disposition, or event-specific information |

Process Monitor's filesystem `CreateFile` event can represent opening an existing file. Check disposition and result before claiming a new file was created. A `NAME NOT FOUND` result may be a normal fallback search. An event name is not proof of malicious intent.

Display filtering normally preserves captured events, but capture-time dropping or exclusions can lose evidence. A filter for only the original PID can hide child-process behavior. Process Monitor is not a full trace of every user-mode API and does not replace packet capture. [Microsoft Process Monitor](https://learn.microsoft.com/en-us/sysinternals/downloads/procmon).

---

## 13. Inspect Network Behavior with Wireshark

**Wireshark shows packets visible on the selected capture interface.** Start capture before execution and save the result as PCAPNG.

Capture filters decide which traffic is collected; display filters select from traffic already collected. They use different syntax.

| Type           | Example                                    | Meaning                                          |
| -------------- | ------------------------------------------ | ------------------------------------------------ |
| Capture filter | `host 192.0.2.10`                          | Collect traffic to or from this host             |
| Display filter | `ip.addr == 192.0.2.10`                    | Show IPv4 packets involving this address         |
| Display filter | `dns`                                      | Show packets decoded as DNS                      |
| Display filter | `http.request`                             | Show decoded HTTP requests                       |
| Display filter | `tcp.flags.syn == 1 && tcp.flags.ack == 0` | Show initial TCP connection attempts             |
| Display filter | `tcp.stream eq 0`                          | Show the stream assigned index 0 in this capture |

Use **Follow TCP Stream** for a chosen TCP conversation. Encrypted TLS payload remains encrypted without suitable session secrets and protocol support. A stream number is local to the capture. [Wireshark filtering guide](https://www.wireshark.org/docs/wsug_html_chunked/ChWorkBuildDisplayFilterSection.html).

### Turn packets into a supported explanation

| Evidence                     | Supported conclusion                                          |
| ---------------------------- | ------------------------------------------------------------- |
| DNS query                    | The hostname was requested through visible DNS traffic        |
| TCP SYN without a reply      | A connection was attempted; completion is not shown           |
| Completed TCP handshake      | A TCP connection was established                              |
| HTTP request and response    | A visible HTTP exchange occurred                              |
| TLS application-data records | Encrypted traffic was exchanged; plaintext content is unknown |

Ordinary packet captures do not reliably identify the originating process. Correlate addresses, ports, and timestamps with process monitoring. Missing packets may reflect the wrong interface, capture timing, filters, cached DNS, encrypted name resolution, or a path that was never executed.

---

## 14. Unpacking and Self-Modifying Code

**Packed code** is stored in a transformed form and restored during execution. **Self-modifying code** changes instructions in memory. Decoding a string is runtime data transformation, but is not by itself self-modifying code.

| Observation                                | What to investigate                                              |
| ------------------------------------------ | ---------------------------------------------------------------- |
| Allocation followed by many writes         | Is a buffer being built, decoded, or loaded?                     |
| Permission change adding execute access    | Will execution enter this region?                                |
| Indirect jump into recently written memory | Is control transferring to generated or unpacked code?           |
| Bytes differ from the file                 | Are these relocations, breakpoints, patches, or runtime changes? |

On Linux, useful events include `mmap` and `mprotect`; Windows equivalents to inspect include `VirtualAlloc` and `VirtualProtect`. These are also used legitimately by loaders and JIT engines. An executable mapping alone does not establish malware or unpacking.

### Capture the useful moment

1. Identify the destination region and its bounds.
2. Observe writes or stop after the suspected decoding routine.
3. Stop before execution enters the completed region.
4. Dump the bytes and record the runtime base, size, permissions, and current instruction.
5. Load a copy into a disassembler with the correct architecture and base address.
6. Compare the recovered code with the original static hypothesis.

A dumped image may contain runtime relocations, unresolved disk layout, incomplete headers, and already-resolved imports. It is not automatically a runnable PE or ELF. A jump into unpacked code is a candidate handoff point; it does not prove you have found the original entry point.

---

## 15. Recognize and Investigate Anti-Debugging

**Anti-debugging changes behavior when debugging is detected or suspected.** First identify the actual check; environment failures can look similar.

| Technique                    | Possible clue                                 | Focused investigation                               |
| ---------------------------- | --------------------------------------------- | --------------------------------------------------- |
| Debugger-status query        | `IsDebuggerPresent`, other status APIs        | Inspect the result and the caller's branch          |
| Linux tracing check          | `ptrace` result or `/proc/self/status` access | Identify the request, result, and error handling    |
| Timing check                 | Elapsed-time comparison around a region       | Compare baseline and instrumented runs              |
| Code-integrity check         | Checksum or byte comparison over code         | Account for software breakpoints and modified bytes |
| Exception-based control flow | Deliberately raised exceptions                | Record whether the debugger or program handles them |

`IsDebuggerPresent` reports nonzero when the calling process is being debugged. It is one check, not a universal detection mechanism. [Microsoft API contract](https://learn.microsoft.com/en-us/windows/win32/api/debugapi/nf-debugapi-isdebuggerpresent).

### Controlled investigation in a training binary

Suppose static inspection identifies this caller:

```asm
call IsDebuggerPresent
test eax, eax
jne debugger_detected
```

Break at the `test` instruction after the call returns. Record the original `EAX`, then edit it to zero for a separate experiment and step through the branch. This tests what lies behind that one condition. It does not prove the unmodified program naturally takes that path or remove other checks.

The GDB equivalent of editing this register on an x86 target is:

```text
set $eax = 0
```

Only apply an edit after identifying the relevant return value and stopping point. For a Linux `ptrace` check, failure can also arise from tracing restrictions or an existing tracer; interpreting every failure as debugger detection is incorrect.

Prefer temporary, documented state changes for experiments. Keep the original run and any modified run clearly labeled. A patched outcome is evidence about the experiment, not evidence of an unmodified protection bypass.

---

## 16. SAT, SMT, and Z3

**Constraint solving finds values that satisfy conditions you specify.** It is useful after reversing an input check; it does not discover the correct program model for you.

| Term    | Meaning                            | Reverse-engineering use                                            |
| ------- | ---------------------------------- | ------------------------------------------------------------------ |
| SAT     | Satisfiability of Boolean formulas | Find true/false assignments satisfying all clauses                 |
| SMT     | Satisfiability modulo theories     | Model arithmetic, arrays, bit-vectors, and other supported domains |
| MiniSat | A SAT solver                       | Solve an already encoded Boolean formula                           |
| Z3      | An SMT solver                      | Express machine-width arithmetic and logical constraints           |

An integer variable in a solver is not automatically a machine integer. A Z3 `BitVec` has a fixed width and wraps arithmetic at that width. If the real program widens before an operation, model the extension and any later truncation explicitly. Signed comparisons differ from unsigned `ULT`, `ULE`, `UGT`, and `UGE`. [Z3 bit-vectors](https://microsoft.github.io/z3guide/docs/theories/Bitvectors/).

### Worked two-byte example

Assume analysis established that two uppercase ASCII bytes must satisfy:

```text
(a + b) modulo 256 = 131
a XOR b           = 3
a < b             (unsigned)
```

Install the Python bindings in a separate environment if needed:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install z3-solver
```

Save as `solve_check.py`:

```python
from z3 import BitVec, Solver, UGE, ULE, ULT, sat, unsat

a = BitVec("a", 8)
b = BitVec("b", 8)
s = Solver()
s.add(UGE(a, 65), ULE(a, 90))
s.add(UGE(b, 65), ULE(b, 90))
s.add(a + b == 131, a ^ b == 3, ULT(a, b))

result = s.check()
if result == sat:
    model = s.model()
    candidate = bytes([model[a].as_long(), model[b].as_long()])
    x, y = candidate
    assert 65 <= x <= 90 and 65 <= y <= 90
    assert ((x + y) & 0xff) == 131 and (x ^ y) == 3 and x < y
    print(candidate.decode("ascii"))
elif result == unsat:
    print("No input satisfies this model")
else:
    print("Solver returned unknown:", s.reason_unknown())
```

```bash
.venv/bin/python solve_check.py
```

Expected result for this example:

```text
AB
```

`sat` supplies a satisfying assignment; `unsat` means the supplied constraints conflict; `unknown` is inconclusive. An incorrect model can be satisfiable or unsatisfiable. Test the candidate in the original program with the expected encoding and input method. A solver result alone does not establish runtime acceptance or uniqueness. [Z3 project and Python bindings](https://github.com/Z3Prover/z3), [MiniSat project](https://github.com/niklasso/minisat).

---

## 17. Symbolic and Concolic Execution

**Concrete execution** uses actual values such as the bytes `AB`. **Symbolic execution** represents input as variables and accumulates conditions required to follow a path.

```text
if input[0] == 'A':
    if input[1] == 'B':
        accept
```

The accepting path requires `input[0] == 65` and `input[1] == 66`. A symbolic engine can ask a solver for an input that reaches it. Z3 solves the constraints; an execution engine such as angr handles program state and path exploration. [angr symbolic execution](https://docs.angr.io/en/latest/core-concepts/symbolic.html).

**Concolic execution** combines concrete execution with symbolic tracking. It follows a real input, collects branch conditions, and can negate a condition to generate an input for another path.

| Difficulty                   | Why it matters                                                   |
| ---------------------------- | ---------------------------------------------------------------- |
| Path explosion               | Repeated branches create too many possible states                |
| Environment modeling         | Files, network responses, time, and APIs affect behavior         |
| Loops and complex arithmetic | Exploration or solving may become expensive                      |
| Missing constraints          | The solver can produce inputs the real environment cannot supply |

Use static analysis to identify the small region and success/failure locations, dynamic analysis to inspect real state, and symbolic execution to explore a focused input problem. Always replay generated inputs against the original binary. A timeout or “no path found” result under limited exploration does not prove a path is impossible.

---

## 18. Memory Errors and Analysis Pitfalls

### Use Valgrind for supported memory-error investigations

```bash
valgrind --tool=memcheck --leak-check=full --track-origins=yes ./sample test-input
```

`memcheck` checks memory use; `--leak-check=full` provides detailed leak reports; `--track-origins=yes` helps trace uninitialized values and increases overhead. Debug symbols improve locations when available. [Valgrind quick start](https://valgrind.org/docs/manual/quick-start.html).

Illustrative report fragment:

```text
Invalid read of size 1
  at 0x401234: check_input (sample.c:18)
Address ... is 0 bytes after a block of size 8 alloc'd
```

This indicates a one-byte read immediately beyond the reported allocation. Preserve the triggering input and trace the access; a memory error or crash alone does not establish exploitability. A leak, uninitialized value, out-of-bounds access, and use-after-free are different findings.

| Pitfall                              | Better interpretation                                   |
| ------------------------------------ | ------------------------------------------------------- |
| Copying an old absolute address      | Resolve the current module mapping and location         |
| Assuming every string is terminated  | Inspect a bounded region first                          |
| Assuming an API call succeeded       | Check its return contract and result                    |
| Treating one run as full coverage    | State which inputs and paths were tested                |
| Ignoring children or threads         | Track process lineage and thread context                |
| Treating imports as runtime evidence | Confirm the call or observable effect                   |
| Calling every crash an exploit       | Establish the defect, reachability, control, and impact |
| Assuming a tool preserves timing     | Record instrumentation and compare runs                 |

---

## 19. Document Findings and Reproduce Results

**Write enough for another person to reproduce the observation and assess the claim.** Record facts separately from interpretations.

| Record          | Include                                                                        |
| --------------- | ------------------------------------------------------------------------------ |
| Sample identity | Filename, SHA-256, format, architecture                                        |
| Environment     | OS, tool versions, snapshot, network mode, ASLR setting                        |
| Input           | Arguments, stdin/file bytes, working directory, relevant environment variables |
| Execution point | Module, relative offset or symbol, runtime address, PID/thread                 |
| Observation     | Registers, memory, call arguments/results, system events, packets              |
| Evidence        | Log, dump, capture, screenshot where helpful; timestamps and time zone         |
| Interpretation  | What the observation supports and why                                          |
| Limits          | Untested paths, missing traffic, emulation, instrumentation, modified state    |
| Reproduction    | Steps from a clean state and the expected observable result                    |

### Example finding record

```text
Question: Does the sample send the contents of config.ini?
Sample: SHA-256 recorded in the run manifest
Setup: Clean Linux VM; original binary; strace and packet capture active
Input: ./sample test-input
Observed: config.ini opened and 10 bytes read; connect() returned ECONNREFUSED
Evidence: strace.log with PID/timestamp; matching packets in traffic.pcapng
Interpretation: The process read the file and attempted a connection
Limit: This run does not show successful transmission or establish payload contents
Next test: Inspect the send buffer if execution reaches a send operation in the lab
```

For a suspected vulnerability, add the exact trigger, fault or violated assumption, reproducibility, and demonstrated impact. Keep solver-generated candidates and analyst-modified runs separate from outcomes reproduced with the original program.

---

## 20. Applications and Fast Recall

| Scenario               | How dynamic analysis helps                                                            |
| ---------------------- | ------------------------------------------------------------------------------------- |
| Malware analysis       | Observe decoded data, process creation, files, Registry changes, and network attempts |
| Security testing       | Reproduce reachable validation failures and inspect security-relevant decisions       |
| Vulnerability research | Connect malformed input to memory errors, crashes, or incorrect state transitions     |
| Software debugging     | Find the exact state that causes a failure without relying only on source reading     |
| Compatibility research | Observe expected file formats, API usage, and protocol behavior                       |

- **Dynamic analysis observes an execution, not all possible behavior.** Combine it with static reasoning.
- **Breakpoints watch code; watchpoints watch data; catchpoints watch events.**
- **Inspect arguments before a call and results after it.** Use the target's ABI and the function's contract.
- **Step over still executes the call.** It does not skip side effects.
- **Runtime addresses depend on loading.** Preserve module-relative locations.
- **A raw memory dump is not automatically an executable.** Keep its base address and capture context.
- **System monitors and packet analyzers answer different questions.** Correlate their evidence.
- **Anti-debugging experiments change the run.** Label all register edits and patches.
- **SAT/SMT solves a model; symbolic execution builds path conditions.** Replay candidate inputs.
- **Document the input, environment, observation, evidence, and limits.**

---

## 21. Resources

Public references complement the academy's authenticated reading links; this sheet does not reproduce those private lessons.

- [GDB manual](https://sourceware.org/gdb/current/onlinedocs/gdb.html/) — execution control, breakpoints, memory, and process inspection.
- [x64dbg documentation](https://help.x64dbg.com/en/latest/) — Windows debugging views and commands.
- [OllyDbg](https://www.ollydbg.de/) — the debugger used in older 32-bit Windows exercises.
- [Process Monitor](https://learn.microsoft.com/en-us/sysinternals/downloads/procmon) — Windows activity capture and filtering.
- [Wireshark User's Guide](https://www.wireshark.org/docs/wsug_html_chunked/) — capture, display filters, and stream analysis.
- [strace](https://strace.io/) — Linux system-call tracing.
- [Valgrind quick start](https://valgrind.org/docs/manual/quick-start.html) — practical memory-error investigation.
- [Intel Pin](https://www.intel.com/content/www/us/en/developer/articles/tool/pin-a-binary-instrumentation-tool-downloads.html) — dynamic binary instrumentation.
- [Z3 guide](https://microsoft.github.io/z3guide/) and [MiniSat](https://github.com/niklasso/minisat) — SMT and SAT concepts and implementations.
- [angr symbolic execution](https://docs.angr.io/en/latest/core-concepts/symbolic.html) — symbolic values, constraints, and states.

_Continue with malware analysis for a deeper investigation of malicious behavior. This sheet focuses on the runtime techniques that support that work._
