# Reverse Engineering Fundamentals

> **⚠️ AUTHORIZED USE ONLY.** For education and authorized analysis only. Reverse engineering software can carry licensing and legal restrictions, and malware samples are dangerous. Work only on binaries you are permitted to analyze, and run unknown samples only in an isolated lab. See the [Legal and Terms of Use](/legal) page.

**Scope:** the foundations. What reverse engineering is, how a binary is built and how you read it back, the structure of an ELF file, and the command-line tools you use before ever opening a disassembler. This is the first sheet in a series. **Static analysis, dynamic analysis, and malware analysis each get their own sheet**, so the heavy tool work (Ghidra, GDB, debugging, unpacking) lives there. This sheet gives you the vocabulary and the groundwork.

**Recommended background:** the Linux command line, and a rough idea of what compiling code does. No assembly knowledge is assumed, though a little helps.

**Conventions:** `$` is a normal shell prompt. Sample outputs are representative, not captured from one specific binary. Examples target **ELF** on Linux, because that is what the required tools work on.

## Table of Contents

- [Quick Reference](#quick-reference)
- [What Reverse Engineering Is](#what-reverse-engineering-is)
- [From Source to Binary, and Back](#from-source-to-binary-and-back)
- [Static vs Dynamic Analysis](#static-vs-dynamic-analysis)
- [Executable File Formats](#executable-file-formats)
- [Inside an ELF Binary](#inside-an-elf-binary)
- [file: the First Look](#file-the-first-look)
- [readelf: Headers, Sections, Symbols](#readelf-headers-sections-symbols)
- [objdump: Disassembly](#objdump-disassembly)
- [strings: Readable Text](#strings-readable-text)
- [ldd: Shared Library Dependencies](#ldd-shared-library-dependencies)
- [The Analysis Tools](#the-analysis-tools)
- [Reading Program Structure](#reading-program-structure)
- [Anti-Reverse-Engineering](#anti-reverse-engineering)
- [A Basic Workflow](#a-basic-workflow)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

---

## 1. Quick Reference

**Skim this now, return to it later.** Each command is explained properly in the section noted beside it.

```bash
file ./target                       # what kind of binary is this?        (Section 7)
strings ./target                    # readable text inside it             (Section 10)
readelf -h ./target                 # ELF header: type, arch, entry point (Section 8)
readelf -S ./target                 # list the sections                   (Section 8)
objdump -M intel -d ./target        # disassemble the code                (Section 9)
ldd ./target                        # which shared libraries it needs     (Section 11)
```

The order above is the order you run them: identify the file, pull its strings, read its structure, then disassemble. Static tools only, nothing is executed except `ldd`.

| Command   | Answers the question                                         |
| --------- | ------------------------------------------------------------ |
| `file`    | 32 or 64-bit? Stripped? Dynamically linked?                  |
| `strings` | Any URLs, passwords, error messages, or file paths baked in? |
| `readelf` | How is the binary laid out, and where does it start?         |
| `objdump` | What do the instructions actually do?                        |
| `ldd`     | What external code does it pull in?                          |

---

## 2. What Reverse Engineering Is

**The definition:** reverse engineering is working out how a program functions when you do not have its source code. You start from the compiled binary and recover its logic, structure, and behavior.

**Why it is a core security skill:**

| Use                        | What RE gives you                                                              |
| -------------------------- | ------------------------------------------------------------------------------ |
| **Malware analysis**       | Understand what a malicious sample does so you can detect and remove it        |
| **Vulnerability research** | Find security flaws in software whose source you cannot see                    |
| **Incident response**      | Identify the unknown binary running on a compromised host                      |
| **Software compatibility** | Understand an undocumented format or protocol, or recover lost source behavior |

The investigation scenario for this project is the normal case: an unknown program on a server, no documentation, suspicious network traffic. Reverse engineering is how you turn "we don't know what this does" into "it collects system data and sends it to this address."

### Two things it is built from

| Term              | Meaning                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------- |
| **Disassembly**   | Turning machine code into **assembly**, a human-readable form of the exact same instructions |
| **Decompilation** | Turning machine code into something resembling **high-level source** such as C               |

Both are covered next. The distinction between them is one of the most tested ideas in the fundamentals.

---

## 3. From Source to Binary, and Back

**Why this matters:** reverse engineering is undoing compilation, so you have to know what compilation did.

### The forward path

```
source code  ->  compiler  ->  assembly  ->  assembler  ->  machine code (binary)
   main.c                        .s                            ./target
```

| Stage        | What it is                                                           |
| ------------ | -------------------------------------------------------------------- |
| Source code  | What the developer wrote, `main.c`                                   |
| Assembly     | Human-readable instructions, one step above the machine              |
| Machine code | The raw bytes the CPU executes. This is all that ships in the binary |

**The key loss:** compilation throws away variable names, comments, and most structure. The CPU does not need them, so they are gone. This is why reversing is work rather than a clean undo.

### The reverse path

You cannot perfectly recover the source, but you can recover two useful levels:

| Going backward    | Produces              | Tool                                  |
| ----------------- | --------------------- | ------------------------------------- |
| **Disassembly**   | Assembly instructions | `objdump`, and every disassembler     |
| **Decompilation** | C-like pseudocode     | Hex-Rays, Ghidra's decompiler, RetDec |

### Disassembly vs decompilation

|             | Disassembly                                                  | Decompilation                                               |
| ----------- | ------------------------------------------------------------ | ----------------------------------------------------------- |
| Output      | Assembly                                                     | C-like pseudocode                                           |
| Accuracy    | **Exact.** One machine instruction maps to one assembly line | **Approximate.** The tool guesses at the original structure |
| Readability | Lower, you read instruction by instruction                   | Higher, closer to source                                    |
| Trust       | What you see is what runs                                    | A helpful reconstruction, sometimes wrong                   |

**The rule:** the decompiler is faster to read, the disassembly is the truth. When they disagree, or when the decompiler produces nonsense (common with obfuscated or hand-written assembly), you fall back to the disassembly.

---

## 4. Static vs Dynamic Analysis

**Why this is here:** these are the two halves of reverse engineering, and each has its own sheet later in the series. Knowing which you are doing keeps you oriented.

|             | Static analysis                                        | Dynamic analysis                                            |
| ----------- | ------------------------------------------------------ | ----------------------------------------------------------- |
| Definition  | Examining the binary **without running it**            | Observing the binary **while it runs**                      |
| Tools       | `file`, `strings`, `readelf`, `objdump`, disassemblers | Debuggers (GDB, x64dbg), sandboxes, network monitors        |
| Shows you   | Structure, code, embedded data                         | Actual behavior, runtime values, what it does to the system |
| Risk        | Safe, nothing executes                                 | **Dangerous with malware**, must be in an isolated lab      |
| This series | The _Static Analysis_ sheet                            | The _Dynamic Analysis_ sheet                                |

**This fundamentals sheet is almost entirely static.** You start static because it is safe and it tells you where to look before you ever run anything.

---

## 5. Executable File Formats

**What a format is:** a binary is not just raw code. It has a defined structure, a header plus sections, that tells the operating system how to load and run it. Each OS has its own format.

| Format                                   | OS                         | Identify it by                          |
| ---------------------------------------- | -------------------------- | --------------------------------------- |
| **ELF** (Executable and Linkable Format) | Linux, Unix                | First bytes `7f 45 4c 46` (`\x7fELF`)   |
| **PE** (Portable Executable)             | Windows, `.exe` and `.dll` | Starts `MZ`, contains a `PE\0\0` header |
| **Mach-O**                               | macOS                      | Magic bytes `feedface` / `feedfacf`     |

All three share the same idea: a **header** describing the file, then **sections** holding code and data. This sheet focuses on ELF, because that is what `objdump`, `readelf`, and `ldd` are built to read. The structure concepts carry over to PE and Mach-O even though the section names differ.

---

## 6. Inside an ELF Binary

**Why this is the most important section:** nearly every fundamentals question is about ELF structure. If you know what each section holds, the tools in the following sections make immediate sense.

### The layout

An ELF file is an **ELF header**, then **sections**, each holding one kind of thing.

### The sections you must know

| Section       | Holds                                                                                     | Read/write     |
| ------------- | ----------------------------------------------------------------------------------------- | -------------- |
| **`.text`**   | **The executable code.** The actual instructions                                          | Read + execute |
| **`.data`**   | **Initialized** global and static variables (a global set to a value)                     | Read + write   |
| **`.bss`**    | **Uninitialized** global and static variables. Takes no space in the file, zeroed at load | Read + write   |
| **`.rodata`** | **Read-only** data: string literals, constants                                            | Read only      |
| **`.symtab`** | The symbol table: function and variable names. **Removed when a binary is "stripped"**    | —              |
| **`.dynsym`** | Dynamic symbol table: names and addresses of dynamically linked functions                 | —              |
| **`.plt`**    | Procedure Linkage Table: stubs that call into shared libraries                            | Read + execute |
| **`.got`**    | Global Offset Table: addresses resolved at runtime                                        | Read + write   |
| **`.debug`**  | Debugging information (DWARF). Present only in debug builds                               | —              |

**How to keep the data sections straight:**

| You wrote                                 | It lives in |
| ----------------------------------------- | ----------- |
| `int count = 5;` (global, has a value)    | `.data`     |
| `int count;` (global, no value)           | `.bss`      |
| `char *s = "hello";` (the `"hello"` text) | `.rodata`   |
| the function body                         | `.text`     |

### The entry point

The **entry point** is the address where execution begins. It is stored in the ELF header, not in a section. It is usually `_start` (C runtime startup code), **not** `main`, which the startup code calls a little later. You read it with `readelf -h` (Section 8).

### Stripped vs not

A **stripped** binary has had `.symtab` removed, so function names are gone and you see only addresses. Malware and release builds are almost always stripped. `.dynsym` survives stripping, because the loader needs it, so the names of imported library functions are still visible even in a stripped binary. That is often your only foothold.

---

## 7. file: the First Look

**What it does:** identifies a file's type by reading its magic bytes and header. Always your first command, because it decides everything that follows.

```bash
file ./target
```

```
./target: ELF 64-bit LSB pie executable, x86-64, dynamically linked,
          interpreter /lib64/ld-linux-x86-64.so.2, not stripped
```

Read every field, each one changes your approach:

| Field                        | Meaning                      | Why you care                          |
| ---------------------------- | ---------------------------- | ------------------------------------- |
| `ELF 64-bit`                 | Format and word size         | Decides 64-bit tools and registers    |
| `LSB`                        | Little-endian byte order     | How to read multi-byte values         |
| `pie executable`             | Position-independent         | Addresses are offsets, not fixed      |
| `x86-64`                     | CPU architecture             | Which instruction set you are reading |
| `dynamically linked`         | Uses shared libraries        | Check them with `ldd` (Section 11)    |
| `interpreter ...ld-linux...` | The dynamic linker           | Confirms dynamic linking              |
| **`not stripped`**           | **Symbol names are present** | Good news. Function names will show   |

`statically linked` instead would mean the libraries are baked in, so `ldd` finds nothing and the binary is much larger. `stripped` would mean no function names.

---

## 8. readelf: Headers, Sections, Symbols

**What it does:** displays the structure of an ELF file, the header and sections from Section 6, in detail. It only reads the format, it never disassembles code. This is your map of the binary.

### The ELF header

```bash
readelf -h ./target
```

`-h` shows the header.

```
ELF Header:
  Class:                             ELF64
  Data:                              2's complement, little endian
  Type:                              DYN (Position-Independent Executable)
  Machine:                           Advanced Micro Devices X86-64
  Entry point address:               0x1060
```

| Field                             | Meaning                                                                   |
| --------------------------------- | ------------------------------------------------------------------------- |
| `Class: ELF64`                    | 64-bit                                                                    |
| `Type: DYN`                       | A PIE executable. `EXEC` would be a non-PIE with fixed addresses          |
| `Machine`                         | The architecture                                                          |
| **`Entry point address: 0x1060`** | **Where execution starts.** This is the entry-point answer from Section 6 |

### The sections

```bash
readelf -S ./target
```

`-S` (capital) lists the section headers.

```
[Nr] Name         Type       Address    Size    Flags
[13] .text        PROGBITS   00001060   000215  AX
[16] .rodata      PROGBITS   00002000   000040  A
[23] .data        PROGBITS   00004020   000010  WA
[24] .bss         NOBITS     00004030   000008  WA
```

| Column  | Meaning                                                                                                 |
| ------- | ------------------------------------------------------------------------------------------------------- |
| `Name`  | The section, from Section 6                                                                             |
| `Type`  | `PROGBITS` has file content, `NOBITS` does not. Note `.bss` is `NOBITS`, matching "takes no file space" |
| `Flags` | `A` allocated in memory, `X` executable, `W` writable                                                   |

`.text` has `AX` (allocated, executable). `.data` has `WA` (writable, allocated). `.bss` is `NOBITS`. These flags confirm the read/write/execute table in Section 6 straight from the binary.

### The symbols

```bash
readelf -s ./target
```

`-s` (lowercase) shows the symbol tables, both `.symtab` and `.dynsym`.

```
Symbol table '.dynsym' contains 7 entries:
   Num:    Value          Type    Name
     1: 0000000000000000  FUNC    puts@GLIBC_2.2.5
     2: 0000000000000000  FUNC    printf@GLIBC_2.2.5

Symbol table '.symtab' contains 36 entries:
    35: 0000000000001149  FUNC    main
```

`.dynsym` lists imported library functions (`puts`, `printf`), visible even when stripped. `.symtab` lists the program's own functions (`main`), gone when stripped.

### The dynamic dependencies

```bash
readelf -d ./target | grep NEEDED
```

`-d` shows the dynamic section.

```
0x0000000000000001 (NEEDED)    Shared library: [libc.so.6]
```

Each `NEEDED` line is a required shared library. **This is the safe way to list dependencies**, because unlike `ldd` (Section 11) it does not run anything.

---

## 9. objdump: Disassembly

**What it does:** the required tool for turning ELF machine code into assembly. This is disassembly from Section 3, on the command line.

### Disassemble the code

```bash
objdump -M intel -d ./target
```

| Flag       | What it does                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `-d`       | Disassemble the executable sections (mainly `.text`)                                                                                                   |
| `-M intel` | Use **Intel** syntax, which reads `destination, source`. Without it you get AT&T syntax, which reads `source, destination` and uses `%` and `$` sigils |

`-D` (capital) disassembles **every** section, including data, which is occasionally useful but mostly noise. Use `-d`.

```
0000000000001149 <main>:
    1149:  55                    push   rbp
    114a:  48 89 e5              mov    rbp,rsp
    114d:  48 8d 05 b0 0e 00 00  lea    rax,[rip+0xeb0]
    1154:  48 89 c7              mov    rdi,rax
    1157:  e8 d4 fe ff ff        call   1030 <puts@plt>
    115c:  b8 00 00 00 00        mov    eax,0x0
    1161:  5d                    pop    rbp
    1162:  c3                    ret
```

Read one line:

```
    114d:  48 8d 05 b0 0e 00 00   lea    rax,[rip+0xeb0]
    ^^^^   ^^^^^^^^^^^^^^^^^^^^^   ^^^    ^^^^^^^^^^^^^^^
    addr   machine code bytes      op     operands
```

| Part              | Meaning                                                  |
| ----------------- | -------------------------------------------------------- |
| `114d:`           | The address of the instruction                           |
| `48 8d 05 ...`    | The raw machine code bytes, the exact thing the CPU runs |
| `lea`             | The mnemonic, the operation                              |
| `rax,[rip+0xeb0]` | The operands                                             |

| Line                       | What it does                                                               |
| -------------------------- | -------------------------------------------------------------------------- |
| `<main>:`                  | A function label, readable because this binary is not stripped             |
| `push rbp` / `mov rbp,rsp` | The standard function prologue, setting up the stack frame                 |
| `call 1030 <puts@plt>`     | **Calls `puts` through the PLT** (Section 6). The program prints something |
| `ret`                      | Return from the function                                                   |

The `@plt` suffix is the Procedure Linkage Table in action: the call goes to a stub that jumps into `libc`.

### Other useful modes

```bash
objdump -d -j .text ./target     # only the .text section
objdump -s -j .rodata ./target   # raw contents of .rodata, to see the strings
objdump -T ./target              # dynamic symbols, like readelf but objdump's view
objdump -f ./target              # file header summary, including the start address
```

`-j <section>` limits output to one section, and `-s` dumps a section's full bytes rather than disassembling.

---

## 10. strings: Readable Text

**What it does:** extracts sequences of printable characters from a binary. One of the fastest ways to learn what a program does, because developers leave URLs, file paths, error messages, and sometimes credentials in plain text inside `.rodata`.

```bash
strings ./target
```

```
/lib64/ld-linux-x86-64.so.2
Enter the password:
http://192.168.1.50/collect
Access granted
libc.so.6
puts
printf
```

| Line                          | What it suggests                                                             |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `Enter the password:`         | A prompt, so there is an authentication check to find                        |
| `http://192.168.1.50/collect` | **A hardcoded URL.** In the project scenario, this is the external server    |
| `Access granted`              | Search the disassembly for where this string is referenced to find the check |

### Useful flags

```bash
strings -n 10 ./target      # only strings of at least 10 characters, less noise
strings -t x ./target       # show each string's offset in hex
strings -e l ./target       # 16-bit little-endian (wide) strings, common in Windows binaries
strings -a ./target         # scan the whole file, not just loaded sections
```

| Flag       | What it does                                                         |
| ---------- | -------------------------------------------------------------------- |
| `-n <len>` | Minimum length. Raising it cuts noise from short random byte runs    |
| `-t x`     | Print the offset, so you can jump to that spot in a disassembler     |
| `-e l`     | Encoding. `l` catches UTF-16 text that the default ASCII scan misses |

**The limit of strings:** it finds text, not logic. A hardcoded URL tells you _where_ the program talks, not _when_ or _why_. For that you follow the string into the disassembly (Section 13, cross-referencing).

---

## 11. ldd: Shared Library Dependencies

**What it does:** the required tool for listing the shared libraries a dynamically linked binary needs, and showing where the system would load each from.

```bash
ldd ./target
```

```
    linux-vdso.so.1 (0x00007ffd...)
    libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f3c...)
    /lib64/ld-linux-x86-64.so.2 (0x00007f3c...)
```

| Line                              | Meaning                                                      |
| --------------------------------- | ------------------------------------------------------------ |
| `linux-vdso.so.1`                 | A kernel-provided virtual library, always present, ignore it |
| `libc.so.6 => /lib/.../libc.so.6` | The C library, resolved to a real path on disk               |
| `ld-linux-x86-64.so.2`            | The dynamic linker itself                                    |

The `=>` shows which file on disk satisfies each dependency. A `not found` would mean a missing library, which stops the program running.

### A safety warning worth knowing

**`ldd` can execute the binary.** It works by asking the dynamic linker to resolve dependencies, which on some systems runs code from the target. **Never run `ldd` on untrusted malware.** Use the static alternative instead:

```bash
readelf -d ./target | grep NEEDED
```

This reads the same `NEEDED` entries from the ELF structure (Section 8) without running anything. For a trusted binary, `ldd` is more convenient. For an unknown sample, `readelf -d` is the safe choice.

---

## 12. The Analysis Tools

**What this section is:** the landscape of tools named in the project. The command-line tools above are what you use first. The tools below are the heavyweight environments, and **each is covered in depth in a later sheet in this series**, so here you only need what each one is and when to reach for it.

### Disassemblers

These turn a whole binary into navigable assembly, with a graphical view of the code.

| Tool        | What it is                          | Notes                                                                           |
| ----------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| **IDA Pro** | The long-standing industry standard | Commercial, expensive. Best-in-class analysis. Hex-Rays decompiler is an add-on |
| **Ghidra**  | Free, open-source, from the NSA     | Includes a strong built-in decompiler. The usual starting point today           |
| **Radare2** | Free, open-source, command-line     | Steep learning curve, scriptable, very powerful. `cutter` is its GUI            |

**How they differ in one line:** IDA is the polished commercial tool, Ghidra is the free tool with a decompiler included, Radare2 is the scriptable command-line tool.

### Debuggers

These run the binary and let you pause it, step through instructions, and inspect memory. This is **dynamic** analysis (Section 4).

| Tool        | Platform         | Notes                                                                                       |
| ----------- | ---------------- | ------------------------------------------------------------------------------------------- |
| **GDB**     | Linux            | The standard command-line debugger. Plugins like `pwndbg` and `gef` make it far more usable |
| **x64dbg**  | Windows          | Open-source, friendly GUI. The common choice for Windows analysis and malware               |
| **OllyDbg** | Windows (32-bit) | Older, simple, effective for 32-bit binaries. Largely superseded by x64dbg                  |

### Decompilers

These go one step past disassembly to C-like pseudocode (Section 3).

| Tool                | Notes                                                    |
| ------------------- | -------------------------------------------------------- |
| **Hex-Rays**        | The decompiler plugin for IDA Pro. The quality benchmark |
| **RetDec**          | Free, open-source decompiler, handles several formats    |
| (Ghidra's built-in) | Free and bundled, which is why Ghidra is so widely used  |

### Other static tools

| Tool        | What it is                                                                       |
| ----------- | -------------------------------------------------------------------------------- |
| **Binwalk** | Finds and extracts files embedded in other files. Essential for firmware images  |
| **strings** | Section 10, listed here because the project groups it with static analysis tools |

---

## 13. Reading Program Structure

**Why this matters:** disassembly gives you thousands of instructions. These three ideas are how you turn that flat list into an understanding of the program. All three are features of the disassemblers above.

### Control Flow Graph (CFG)

**What it is:** a diagram of how execution moves through a function. Each box is a straight run of instructions (a "basic block"), and arrows show the jumps and branches between them.

```
      [ check password ]
         /          \
    equal?         not equal?
       |               |
 [ Access granted ] [ Access denied ]
```

**Why it helps:** a function's logic is far easier to read as boxes and arrows than as a list. Branches (an `if`), loops, and the path to an interesting string all become visible at a glance. Ghidra and IDA draw the CFG automatically.

### Cross-referencing (xrefs)

**What it is:** finding every place that a function, variable, or string is used.

**Why it is the most useful habit in RE:** `strings` found `Access granted` in Section 10. Cross-referencing that string shows you the exact instruction that loads it, which is right next to the password check you want to understand. You work backward from an interesting piece of data to the code that touches it, instead of reading the whole program.

### Function identification

**What it is:** recognizing where functions begin and end, and naming known ones.

**Why it is needed:** in a stripped binary (Section 6) there are no names, just addresses. Tools identify functions by recognizing the prologue (`push rbp; mov rbp,rsp` from Section 9) and by matching known library code against signatures (IDA's FLIRT), so even a stripped binary gets `strcpy` labeled instead of a bare address.

---

## 14. Anti-Reverse-Engineering

**What this is:** techniques authors use to make analysis harder, especially malware authors. Fundamentals is about recognizing them, not defeating them in depth, which belongs to the malware sheet.

| Technique          | What it does                                                              | How you spot it                                                    |
| ------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Obfuscation**    | Scrambles the code's structure and names so logic is hard to follow       | Meaningless names, bloated or nonsensical control flow             |
| **Packing**        | Compresses or encrypts the binary; it unpacks itself in memory at runtime | Very few strings, high entropy, a tiny `.text` with a large loader |
| **Anti-debugging** | Detects a debugger and changes behavior or quits                          | Calls to `ptrace` (Linux) or `IsDebuggerPresent` (Windows)         |

### Recognizing a packed binary

The tools you already have give it away:

```bash
strings ./packed | wc -l
```

A normal program has hundreds of readable strings. A packed one has almost none, because the real content is compressed until runtime. A nearly empty `strings` output plus an unusual section layout in `readelf -S` is the classic packing signature. **UPX** is the most common packer, and the honest ones unpack with the same tool:

```bash
upx -d ./packed -o ./unpacked
```

### Bypassing, at the fundamentals level

The general approaches, each developed in the later sheets:

| Against        | Approach                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------- |
| Packing        | Unpack it, either with the packer's own tool or by dumping memory after it self-unpacks (dynamic) |
| Anti-debugging | Patch out or skip the detection check in a debugger                                               |
| Obfuscation    | Lean on dynamic analysis, since watching what the code _does_ sidesteps how unreadable it _looks_ |

The theme: **when static analysis is deliberately blocked, dynamic analysis usually still works**, because the program has to actually run to do its job.

---

## 15. A Basic Workflow

A repeatable order for a first look at an unknown binary. Static throughout, which is safe.

1. **Identify.** `file ./target`. Format, architecture, stripped or not, static or dynamic.
2. **Pull strings.** `strings -n 8 ./target`. URLs, paths, messages, anything that hints at purpose.
3. **Read the structure.** `readelf -h` for the entry point, `readelf -S` for sections, `readelf -s` for symbols.
4. **List dependencies.** `readelf -d | grep NEEDED` for an unknown sample, or `ldd` for a trusted one.
5. **Disassemble.** `objdump -M intel -d ./target`, or open it in Ghidra for the CFG and decompiler.
6. **Cross-reference.** Follow the interesting strings from step 2 into the code to find the logic around them.
7. **Go dynamic if needed.** If static analysis is blocked or the behavior is unclear, move to a debugger in an isolated lab. That is the next sheet.
8. **Document.** Record what the binary does, where it connects, and anything suspicious.

---

## 16. Fast Recall

- **RE is recovering how a program works without its source.** Core to malware analysis, vulnerability research, and incident response.
- **Disassembly = machine code to assembly, exact.** Decompilation = machine code to C-like pseudocode, approximate. The disassembly is the truth, the decompilation is easier to read.
- **Static analysis** reads the binary without running it (safe). **Dynamic analysis** runs it (dangerous with malware, needs a lab).
- **Formats:** ELF (Linux, `\x7fELF`), PE (Windows, `MZ`), Mach-O (macOS). All are header plus sections.
- **ELF sections:** `.text` = code, `.data` = initialized globals, `.bss` = uninitialized globals (no file space), `.rodata` = read-only data and strings, `.symtab` = names (stripped away in release), `.dynsym`/`.plt` = dynamic linking.
- **Entry point** is in the ELF header, usually `_start`, not `main`. Read it with `readelf -h`.
- **Stripped** means `.symtab` is gone, so no local function names. `.dynsym` survives, so imported library names still show.
- **`file`** first: 32/64-bit, stripped, static/dynamic.
- **`strings`**: readable text, often URLs and messages. `-n` to cut noise, `-e l` for wide strings. Finds text, not logic.
- **`readelf`**: `-h` header, `-S` sections, `-s` symbols, `-d` dependencies. Reads structure, never disassembles.
- **`objdump -M intel -d`**: disassemble. Intel syntax is `dest, src`. Each line is address, bytes, mnemonic, operands. `@plt` = a call into a shared library.
- **`ldd`**: shared libraries. **Can execute the binary, so never run it on malware**; use `readelf -d | grep NEEDED` instead.
- **Disassemblers:** IDA (commercial standard), Ghidra (free, decompiler included), Radare2 (free, command-line).
- **Debuggers:** GDB (Linux), x64dbg (Windows), OllyDbg (old 32-bit Windows).
- **Decompilers:** Hex-Rays (IDA plugin), RetDec, Ghidra's built-in.
- **CFG** shows execution as blocks and branches. **Cross-referencing** finds every use of a string or function, the way you work backward from data to code. **Function identification** recovers functions in stripped binaries by prologue and signature.
- **Anti-RE:** obfuscation (scrambled logic), packing (self-unpacking, almost no strings), anti-debugging (`ptrace`/`IsDebuggerPresent`). When static is blocked, dynamic usually still works.

---

## 17. Resources

**Reference**

- [OpenSecurityTraining: Intro to x86](https://opensecuritytraining.info/IntroX86.html)
- [ELF specification (man page)](https://man7.org/linux/man-pages/man5/elf.5.html)
- [Ghidra tutorial series](https://ghidra-sre.org/)

**Books**

- [Reverse Engineering for Beginners (Dennis Yurichev), free](https://beginners.re/)
- _Practical Reverse Engineering_ — Dang, Gazet, Bachaalany
- _The IDA Pro Book_ — Chris Eagle

**Tools**

- [Ghidra](https://ghidra-sre.org/)
- [IDA (free edition)](https://hex-rays.com/ida-free/)
- [Radare2](https://rada.re/n/)
- [x64dbg](https://x64dbg.com/)
- `objdump`, `readelf`, `ldd`, `strings`, `file`, `nm` — part of GNU binutils, already on Linux

**Practice**

- [crackmes.one](https://crackmes.one/) — binaries made for practice
- [pwn.college](https://pwn.college/)
- picoCTF — reverse engineering category

---

_Next in this series: Static Analysis, Dynamic Analysis, Malware Analysis._
