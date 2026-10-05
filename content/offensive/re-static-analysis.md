# Static Analysis in Reverse Engineering

> **Authorized analysis.** Examine software you are permitted to analyze, and handle unknown binaries in an isolated analysis environment. Static analysis avoids running the target, but analysis tools still parse untrusted data. See the [Legal and Terms of Use](/legal) page.

**Scope:** understanding compiled programs through their structure, data, and instructions before executing them. This sheet develops the practical methods introduced in [Reverse Engineering Fundamentals](/cheatsheet/re-fundamentals/): string investigation, function analysis, cross-references, control flow, arithmetic reconstruction, and evidence-based security findings.

**Purpose:** turn observations such as “this file contains a password prompt” into supported explanations such as “this function transforms user input and compares the result with an embedded value.” Static analysis supports malware investigation, security auditing, compatibility research, and debugging when source code is unavailable.

**Recommended background:** the Linux command line, ELF basics, hexadecimal numbers, and simple C expressions. Assembly concepts are introduced where needed.

**Conventions:** terminal commands use relative paths and assume GNU tools on Linux. Assembly examples use x86-64 Intel syntax unless marked otherwise. Radare2 commands run at its own prompt. Addresses, symbols, constants, and outputs are illustrative; substitute values observed in the file being examined. Python examples implement recovered mathematics and do not execute the target binary.

## Table of Contents

- [Quick Reference](#quick-reference)
- [What Static Analysis Establishes](#what-static-analysis-establishes)
- [Headers, Formats, and Addresses](#headers-formats-and-addresses)
- [Strings: From Text to Evidence](#strings-from-text-to-evidence)
- [The Static Analysis Toolkit](#the-static-analysis-toolkit)
- [A First Pass in Ghidra](#a-first-pass-in-ghidra)
- [A First Pass in Radare2](#a-first-pass-in-radare2)
- [Reading Assembly and Function Calls](#reading-assembly-and-function-calls)
- [Control Flow Graphs and Decisions](#control-flow-graphs-and-decisions)
- [Cross-References and Function Identification](#cross-references-and-function-identification)
- [Reconstructing High-Level Logic](#reconstructing-high-level-logic)
- [Recovering Hidden Data](#recovering-hidden-data)
- [Reversing Arithmetic Transformations](#reversing-arithmetic-transformations)
- [Optimizing Expensive Calculations](#optimizing-expensive-calculations)
- [Collisions and Constrained Search](#collisions-and-constrained-search)
- [Reading Raw Assembly Source](#reading-raw-assembly-source)
- [Recognizing Security Weaknesses](#recognizing-security-weaknesses)
- [Limits, Obfuscation, and Analysis Errors](#limits-obfuscation-and-analysis-errors)
- [A Repeatable Workflow and Findings Record](#a-repeatable-workflow-and-findings-record)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

---

## 1. Quick Reference

**Start with a question, then choose the command that answers it.**

```bash
file ./sample                          # identify format and architecture
readelf -hW ./sample                    # ELF header
readelf -SW ./sample                    # ELF sections, one row per section
readelf -lW ./sample                    # ELF segments and section mapping
readelf -dW ./sample                    # dynamic entries, including NEEDED
strings -a -t x ./sample                # printable sequences and file offsets
strings -a -e l ./sample                # 16-bit little-endian text
objdump -d -M intel ./sample            # disassemble executable sections
r2 -e bin.relocs.apply=true -A ./sample  # open for static analysis
```

Inside Radare2:

```text
afl
pdf @ main
iz
ii
```

| Question | First useful view |
| --- | --- |
| What is this file? | Format, architecture, byte order, entry point |
| What does it contain? | Sections, strings, constants, imports |
| What does it do with input? | Callers, callees, arguments, comparisons |
| Why does it choose one outcome? | Conditional branches and data flow |
| Can a transformation be reconstructed? | Exact operations, widths, keys, loop bounds |
| Is a suspected weakness reachable? | Input source, validation, dangerous operation, path conditions |

`grep`, `less`, and `printf` are shell utilities used for filtering, reading, or recording results. They do not replace the binary-analysis tools.

---

## 2. What Static Analysis Establishes

**Definition:** static analysis examines a program's stored representation without executing the target program. It can recover structure, possible behavior, and constraints on execution.

| Method | Main output | What needs checking |
| --- | --- | --- |
| Header and section inspection | Layout and architecture | Malformed metadata and misleading names |
| String extraction | Printable byte sequences | Meaning, encoding, and actual use |
| Disassembly | Instructions decoded from bytes | Instruction boundaries, code versus data |
| Decompilation | C-like reconstruction | Types, signedness, arguments, control flow |
| Data-flow analysis | How values reach operations | Aliases, indirect calls, unresolved inputs |

Disassembly is closer to machine behavior than decompiled pseudocode, but automatic disassembly can start at the wrong byte or decode data as instructions. Check the bytes, architecture, and reachable paths when a listing looks implausible.

### Separate three kinds of claim

| Claim | Example |
| --- | --- |
| **Observed** | A string contains a configuration path |
| **Inferred** | A reachable function passes that path to a file-opening routine |
| **Runtime-confirmed** | An isolated execution actually opens the file |

A static finding can establish a reachable defect without executing it. It cannot establish that every possible environment will exercise that path. Running a recovered mathematical model validates the model's calculations; it is different from observing the original process.

---

## 3. Headers, Formats, and Addresses

**Why this comes first:** correct architecture, bitness, byte order, and load layout determine how later bytes are interpreted. A filename extension is only a hint.

| Format | Typical platform | Structural features to inspect |
| --- | --- | --- |
| ELF | Linux and other Unix-like systems | ELF header, program headers, section headers, dynamic entries |
| PE | Windows | DOS header and PE signature, COFF/optional headers, section table, import directory |
| Mach-O | macOS and other Apple systems | Mach header, load commands, segments and their sections; universal files may hold multiple architecture slices |

For ELF, `readelf -hW` establishes architecture and entry point; `-SW` lists sections; `-lW` describes loadable segments; `-dW` includes declared shared-library dependencies. These views describe different parts of the format. [GNU readelf reference](https://sourceware.org/binutils/docs/binutils/readelf.html).

`ET_DYN` alone does not establish that an ELF is a PIE executable: shared objects also use this type. Consider the remaining metadata. Runtime permissions follow segment mappings and later loader changes, not section names alone.

### Do not confuse these locations

| Location | Meaning |
| --- | --- |
| File offset | Byte position in the file on disk |
| Analysis virtual address | Address assigned by the tool's loaded image |
| Runtime address | Actual address after loading and relocation |

For a byte inside a file-backed ELF load segment:

```text
ELF virtual address = p_vaddr + (file_offset - p_offset)
runtime address     = ELF virtual address + load_bias
```

The file offset must fall within that segment's `p_filesz` range. Zero-filled memory beyond the file-backed bytes has no corresponding data bytes in the file. Tool rebasing must also be accounted for.

For PE, distinguish a relative virtual address (RVA), an image-base-adjusted address, and a raw file offset. [Microsoft PE format](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format).

**Practical consequence:** an offset printed by `strings -t x` is not automatically an address suitable for a disassembler's jump command.

---

## 4. Strings: From Text to Evidence

**What strings provides:** printable sequences, which may be messages, names, configuration values, or coincidental bytes. GNU `strings` normally uses a minimum of four characters.

```bash
strings -a -t x ./sample
strings -a -n 8 ./sample
strings -a -e l ./sample
```

| Option | Purpose |
| --- | --- |
| `-a` | Scan the complete file |
| `-t x` | Prefix results with hexadecimal file offsets |
| `-n 8` | Require at least eight printable characters |
| `-e l` | Search 16-bit little-endian character sequences |

These options are documented in the [GNU strings reference](https://sourceware.org/binutils/docs/binutils/strings.html).

### Filter, then recover context

```bash
strings -a -t x ./sample | grep -iE 'password|secret|token|config|denied|granted'
strings -a -t x ./sample | grep -F -B 8 -A 8 'Access denied'
```

The second command prints surrounding results, not surrounding instructions. Nearby text may be unrelated.

| Observation | Useful next step |
| --- | --- |
| Success or failure message | Find code that references it |
| A function-like name | Look for a symbol, then inspect its callers |
| Configuration path | Trace whether it is used, constructed, or only logged |
| Large volume of library messages | Separate application functions from runtime code |

**Filtering can hide the answer.** A secret need not contain the word “secret.” When keyword searches fail, inspect surrounding data, wider encodings, and code that builds or transforms strings. No matching text is not proof that the data is absent.

---

## 5. The Static Analysis Toolkit

**Choose tools by the view needed.** Opening a binary in a reverse-engineering interface does not require starting its debugger.

| Tool | Role |
| --- | --- |
| Ghidra | Disassembly, decompilation, cross-references, data types, function graphs |
| IDA Pro | Interactive disassembly, graph navigation, signatures, annotations |
| Hex-Rays Decompiler | High-level pseudocode integrated with IDA; architecture support depends on the available product |
| Radare2 | Command-oriented inspection, analysis, scripting, and optional debugging |
| Binary Ninja | Disassembly and intermediate-language views for tracing computations |
| Cutter | Graphical reverse-engineering interface powered by Rizin |
| Binwalk | Identify possible embedded formats and firmware components |
| Hex viewer | Inspect exact bytes, widths, alignment, and encodings |

Current Cutter uses **Rizin** as its engine; do not assume Radare2 commands and extensions are interchangeable with its console. [Cutter documentation](https://cutter.re/).

Binary Ninja's intermediate languages provide additional representations between instructions and high-level logic. Compare them when inferred types obscure an operation. [Binary Ninja guide](https://docs.binary.ninja/guide/index.html).

For firmware triage:

```bash
binwalk ./firmware.bin
```

A format-signature match is a lead to inspect. Automatic extraction is a separate step with additional parsers and output files. [Binwalk documentation](https://github.com/ReFirmLabs/binwalk).

GDB is principally a debugger. Loading symbols can assist inspection, but starting or attaching to a process moves the workflow into dynamic analysis.

---

## 6. A First Pass in Ghidra

**Purpose:** connect readable data, disassembly, and pseudocode in one analysis view.

1. Create a local workspace using **File → New Project**, then import the binary.
2. Verify the detected format, processor, endianness, and compiler specification.
3. Open the program in CodeBrowser and allow automatic analysis.
4. Inspect **Window → Defined Strings** for useful messages. Use **Search → For Strings** when text has not been defined.
5. Follow references from a useful string to the function using it.
6. Compare the **Listing** and **Decompiler** views.
7. Open **Window → Function Graph** to inspect branching.
8. Rename functions and variables only when their role is supported by evidence; preserve original addresses in notes.

These views and workflows are described in the [official Ghidra introduction](https://ghidra.re/ghidra_docs/GhidraClass/Beginner/Introduction_to_Ghidra_Student_Guide.html).

**A useful reading order:** function parameters → input handling → transformations → comparisons → returned result. Revisit inferred types whenever the pseudocode conflicts with the instruction widths.

---

## 7. A First Pass in Radare2

Start from the terminal:

```bash
r2 -e bin.relocs.apply=true -A ./sample
```

`-A` requests automatic analysis. The relocation setting applies supported relocations to the analysis view; it does not launch the target. This command does not request debugger mode or writable access to the original file.

Inside Radare2:

| Command | Purpose |
| --- | --- |
| `iI` | Binary information |
| `iS` | Sections |
| `ii` | Imports |
| `afl` | Analyzed functions |
| `pdf @ main` | Disassemble a function |
| `iz` | Strings identified in data sections |
| `izz` | Broader string scan |
| `axt @ sym.verify_input` | References to a named function |
| `agf @ sym.verify_input` | Function graph |
| `q` | Quit |

Replace `main` and `sym.verify_input` with symbols or addresses actually shown by analysis. Stripped binaries may lack those names. [Radare2 code analysis](https://book.rada.re/analysis/code_analysis.html).

### Read data with the correct width

```text
psz @ 0x2040
px 32 @ 0x2040
pxw 16 @ 0x4020
pxq 24 @ 0x4040
```

| Command | Interpretation |
| --- | --- |
| `psz` | Zero-terminated string |
| `px 32` | 32 bytes in a hex dump |
| `pxw 16` | 16 bytes displayed as four-byte words |
| `pxq 24` | 24 bytes displayed as eight-byte words |

Lengths here are **bytes**, not element counts. The addresses are placeholders. Integer displays depend on the configured byte order. For a pointer variable, first read its pointer value, then inspect the pointed-to address. [Radare2 print modes](https://book.rada.re/commandline/print_modes.html).

---

## 8. Reading Assembly and Function Calls

**Start with data movement.** Track where a value came from, its width, and which instruction changes it.

| Instruction pattern | Meaning |
| --- | --- |
| `mov eax, 5` | Assign 5 to `eax` |
| `movzx eax, byte [rdi]` | Load one byte and zero-extend it |
| `movsx eax, byte [rdi]` | Load one byte and sign-extend it |
| `lea rdi, [rbp-0x40]` | Compute an address, without loading its contents |
| `xor eax, eax` | Set `eax` to zero |
| `cmp eax, 0` | Set flags according to a subtraction, without storing it |
| `test eax, eax` | Set flags from a bitwise AND; commonly test for zero |
| `je` / `jne` | Branch according to the zero flag |
| `call` / `ret` | Call a routine / return to its caller |

Register slices share storage: `rax` is 64 bits, `eax` its low 32 bits, and `al` its low 8 bits. In 64-bit mode, writing `eax` clears the upper half of `rax`; writing `al` does not. [Intel architecture manuals](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html).

### Recovering arguments

Under the **System V AMD64 ABI**, ordinary integer/pointer arguments commonly start in `rdi`, `rsi`, `rdx`, `rcx`, `r8`, and `r9`; scalar results commonly return in `rax`. Windows x64 uses a different convention. Verify the applicable ABI. [x86-64 psABI](https://gitlab.com/x86-psABIs/x86-64-ABI).

```asm
lea rdi, [rbp-0x40]      ; destination buffer
mov esi, 64             ; buffer capacity supplied to fgets
mov rdx, [rel stdin]    ; stream pointer
call fgets
test rax, rax           ; did fgets return NULL?
je read_error
```

This fragment illustrates arguments and a return-value check; it is not a standalone program. Establish the actual buffer allocation before concluding the supplied size is safe.

---

## 9. Control Flow Graphs and Decisions

**A control flow graph (CFG)** connects basic blocks: instruction sequences with a single entry and no internal control-flow branching. Edges represent possible transfers of control.

```text
             [read input]
                   |
             [read succeeds?]
              /           \
            no             yes
            |               |
        [return error]  [transform input]
                            |
                       [compare result]
                        /          \
                     equal       different
                       |             |
                   [accept]       [reject]
```

### Read the condition before naming the branch

```asm
call strcmp
test eax, eax
jne reject
```

`strcmp` returns zero when the strings are equal. Here, nonzero leads to rejection. A different predicate function may return nonzero for success; its caller determines the meaning.

For a loop, identify:

1. Initialization of the counter and state.
2. Condition and branch type, including signed versus unsigned comparison.
3. Work performed inside the loop.
4. Counter or state update.
5. Exit behavior.

A branch back toward an earlier address often indicates a loop, but address direction alone is not proof. A **call graph** relates functions; a CFG describes paths within a function. Indirect calls and jumps may leave either graph incomplete.

---

## 10. Cross-References and Function Identification

**Cross-referencing means finding uses of an address, symbol, or value.** It connects a promising observation to the instructions that give it meaning.

```text
success message
    → referencing block
    → preceding conditional branch
    → compared value
    → function that produced the value
    → input and embedded constants
```

Start with references to a message, then inspect both its callers and neighboring decision blocks. Follow the value backward to its origin and forward to its eventual use. This avoids treating unrelated nearby strings as one logical group.

### Recognizing code without names

| Clue | Possible interpretation | Confirmation needed |
| --- | --- | --- |
| Repeated byte loads and comparison | Comparison routine | Bounds, termination, and return convention |
| Loop over source and destination pointers | Copy or transformation | Per-byte operations and destination capacity |
| Pointer to a format string followed by a call | Formatted output | Actual callee and argument order |
| Recognized runtime signature | Known library function | Version, calling context, and matching bytes |

Signature systems such as IDA's FLIRT can identify library code even without original names. A signature match supplies a useful label; it does not establish that surrounding application logic is safe. [Hex-Rays FLIRT reference](https://docs.hex-rays.com/user-guide/signatures/flirt).

Do not require a particular function prologue. Optimization, inlining, and frame-pointer omission can remove familiar patterns. Keep a coverage list of application functions, callbacks, initialization routines, and unresolved indirect targets.

---

## 11. Reconstructing High-Level Logic

**Translate behavior before trying to recreate original source.** Write a short description for each block, then combine those descriptions into pseudocode.

An input-verification path might become:

```c
/* Illustrative pseudocode; helper behavior must be established separately. */
if (read_line(input, input_capacity) == FAILURE)
    return READ_ERROR;

remove_trailing_newline(input);
size_t n = input_length(input);
transform(input, output, n);
hex_encode(output, n, hex_output);
return strings_equal(hex_output, expected_text);
```

Questions to resolve from the instructions:

| Question | Why it matters |
| --- | --- |
| Is a value a pointer, byte, integer, or length? | Determines dereferences and arithmetic |
| What are the actual allocation sizes? | Determines whether writes fit |
| Is the loop bound inclusive? | Determines how many elements are accessed |
| Is the comparison signed? | Changes behavior for high-bit values |
| Does a helper return a length, pointer, or Boolean? | Changes the caller's condition |
| Can transformed data contain zero? | Affects string-based length calculations |

### Check buffer arithmetic

Encoding `n` bytes as hexadecimal text requires **`2*n + 1` bytes** including the terminator. If input is bounded at 63 bytes, the output needs at least 127 bytes. Also verify that the size calculation itself cannot overflow and that the destination really has that capacity.

Decompiler variable names and inferred types are provisional. Names such as `local_40`, an apparent array length, or an inferred argument count are evidence to examine, not original source declarations.

---

## 12. Recovering Hidden Data

**A readable value may be constructed rather than stored as contiguous text.** Search the instructions that populate a comparison buffer when string extraction produces no useful result.

### Individual byte stores

```asm
mov byte [rbp-4], 0x4f   ; O
mov byte [rbp-3], 0x4b   ; K
mov byte [rbp-2], 0x21   ; !
mov byte [rbp-1], 0      ; terminator
```

These stores construct `OK!` in memory. Their character bytes are separated by instruction encodings in the file, so ordinary string extraction may miss the result. Reconstruct the bytes by **destination offset**, not merely by the order of lines on screen; later stores can overwrite earlier ones.

### Packed integers and byte order

A little-endian 32-bit store of `0x214b4f` places these bytes in ascending memory addresses:

```text
4f 4b 21 00  →  O K ! NUL
```

An analyst-written calculation can verify the interpretation:

```python
value = 0x214b4f
raw = value.to_bytes(4, "little")
assert raw == b"OK!\x00"
```

### Strings versus binary buffers

`strlen` stops at the first zero byte. A ciphertext buffer may contain zero anywhere, so its length should normally be tracked separately. Hex encoding changes a representation; it does not encrypt it. Reversing hex text gives bytes, which may still require decryption or another transformation.

---

## 13. Reversing Arithmetic Transformations

**Write the transformation exactly, including where values are truncated.** Then reverse operations in the opposite order when an inverse exists.

| Forward operation | Possible inverse | Condition |
| --- | --- | --- |
| `y = x XOR k` | `x = y XOR k` | Same bit width |
| `y = (x + k) mod 256` | `x = (y - k) mod 256` | Byte arithmetic |
| `y = rotate_left(x, r)` | Rotate right by `r` | Same rotation width |
| `y = a*x mod m` | Multiply by modular inverse of `a` | `gcd(a, m) = 1` |
| `y = x AND mask` | Usually multiple candidates | Masked bits are lost |

### Worked byte transformation

Suppose the recovered expression is:

```text
y = ((x XOR 0x2a) + 7) AND 0xff
```

For `x = 0x63` (`c`), the encoded byte is `0x50`. Subtract before undoing XOR:

```python
def encode_byte(x):
    return ((x ^ 0x2a) + 7) & 0xff

def decode_byte(y):
    return ((y - 7) & 0xff) ^ 0x2a

assert encode_byte(ord("c")) == 0x50
assert decode_byte(0x50) == ord("c")
assert all(decode_byte(encode_byte(x)) == x for x in range(256))
```

**Width changes the problem.** An eight-bit store wraps modulo 256; a 32-bit operation has different overflow behavior. Signed loads also change the interpretation of bytes above `0x7f`. Model observed machine behavior explicitly rather than relying on a high-level language's default integer semantics.

If a table is accessed as `base + index*4`, inspect four-byte elements. The table may contain character values in 32-bit slots; that is not automatically a normal byte string.

---

## 14. Optimizing Expensive Calculations

**Recover the mathematical result before reproducing the implementation's cost.** A slow loop can be an inefficient implementation of a simple expression.

Consider:

```text
result = 1
repeat exponent times:
    result = (result * base) mod modulus
```

This computes modular exponentiation with a number of multiplications proportional to the exponent. Exponentiation by squaring processes the exponent's bits instead, requiring a number of loop iterations proportional to its bit length.

```python
def mod_power(base, exponent, modulus):
    if exponent < 0 or modulus <= 0:
        raise ValueError("Require exponent >= 0 and modulus > 0")

    result = 1 % modulus
    base %= modulus

    while exponent:
        if exponent & 1:
            result = (result * base) % modulus
        base = (base * base) % modulus
        exponent >>= 1

    return result

assert mod_power(7, 13, 101) == 75
assert mod_power(7, 13, 101) == pow(7, 13, 101)
```

Python's three-argument `pow(base, exponent, modulus)` computes modular power without constructing the full power first. Python integers also avoid fixed-width multiplication overflow. [Python built-in functions](https://docs.python.org/3/library/functions.html#pow).

For `exponent = 2**40 - 1`, the naive loop has over a trillion iterations; this implementation has 40 iterations and at most two modular multiplications per iteration. That comparison counts operations, not a guaranteed wall-clock speedup.

### Preserve semantics while optimizing

Check whether the original multiplication uses a wider intermediate, such as 128 bits for 64-bit operands. A replacement that silently overflows before taking the remainder is not equivalent. Also establish that the original loop has no required side effects.

If the modular result supplies an XOR key, retain the observed block width, byte order, output length, and treatment of zero bytes when reconstructing the message. Verify the optimized result against an independent implementation and small inputs for which the original method is practical.

---

## 15. Collisions and Constrained Search

**A collision occurs when different inputs produce the same compared output.** Multiplication is not inherently irreversible; multiplication followed by reduction may lose information.

For `a*x mod m`, invertibility depends on `gcd(a, m)`. If the greatest common divisor is `d > 1`, a reachable output has `d` solutions modulo `m`.

Example:

```text
f(x) = ((12*x) XOR 0x5a) AND 0xff
```

Because `gcd(12, 256) = 4`, each reachable output has four byte-valued preimages. A later XOR does not restore the lost information.

### Enumerate each character when positions are independent

```python
def transform(x):
    return ((12 * x) ^ 0x5a) & 0xff

expected = 0xd6
all_candidates = [x for x in range(256) if transform(x) == expected]
assert all_candidates == [33, 97, 161, 225]

allowed = "abcdefghijklmnopqrstuvwxyz_"
restricted = [c for c in allowed if transform(ord(c)) == expected]
assert restricted == ["a"]
```

Both `!` and `a` are printable candidates. An independently established lowercase-letter constraint selects `a` in this example.

**Do not silently impose a guessed format.** If a constraint eliminates every candidate, check the copied constants, index parity, widths, and the constraint itself. If several candidates remain, report ambiguity; readable wording is supporting evidence rather than mathematical proof of uniqueness.

Independent byte checks need at most 256 trials per position. Checks that mix neighboring characters or carry evolving state require a joint search or constraint model. Testing every possible whole string is unnecessary when the structure permits a smaller search.

---

## 16. Reading Raw Assembly Source

**Assembly source can be read directly.** A `.asm` suffix suggests text but does not prove the file's format.

```bash
cat ./example.asm
```

NASM-style declarations distinguish element widths:

| Declaration | Meaning |
| --- | --- |
| `db` | Initialized byte elements |
| `dw` | Initialized two-byte elements |
| `dd` | Initialized four-byte elements |
| `dq` | Initialized eight-byte elements |
| `resb 64` | Reserve 64 bytes, commonly in `.bss` |

A table indexed four bytes at a time needs a matching layout. A value such as `0x123` cannot be represented intact by a single `db` element. Reserving an input buffer does not read any input. [NASM language reference](https://www.nasm.us/doc/nasm03.html).

### Follow actual register effects

In 32-bit signed division, `idiv ecx` divides `EDX:EAX`; the quotient goes to `eax`, and the remainder to `edx`. `cdq` sign-extends `eax` into that register pair, overwriting `edx`. [Intel instruction reference](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html).

```asm
; Fragment: decode a nonnegative value held in EBX.
mov eax, ebx
xor eax, 0x2a
sub eax, 5
cdq
mov ecx, 3
idiv ecx
; EAX is the quotient; EDX is the remainder.
```

When reconstructing source, distinguish **what the author appears to intend** from **what the instructions implement**. Check declarations, strides, initialized registers, input acquisition, comparisons, and exit behavior. A label named `success` is not evidence that success is reported correctly.

---

## 17. Recognizing Security Weaknesses

**A pattern is an investigation lead. A finding needs a reachable path and a violated condition.**

| Pattern | Potential problem | What must be established |
| --- | --- | --- |
| Copy or formatting into a fixed buffer | Out-of-bounds write | Maximum produced length exceeds available capacity |
| Input-controlled format argument | Format-string vulnerability | Untrusted bytes reach the format parameter |
| Unchecked input function result | Use of invalid or uninitialized data | Failure path proceeds to consume the buffer |
| `strlen(s)-1` before validating length | Access before the buffer | Empty or invalid input can reach that expression |
| `strlen` applied to ciphertext | Truncation or out-of-bounds read | Embedded zero or missing terminator affects processing |
| Embedded key and reversible transform | Recoverable secret | Both algorithm and sufficient key material are available |
| Length multiplication or narrowing cast | Size miscalculation | Overflow or truncation breaks the allocation/write relationship |
| Comparison of only a fixed prefix | Incomplete validation | Trailing input is accepted contrary to the intended contract |

### Inspect the call, not just its name

```c
printf(user_input);        /* input controls formatting */
printf("%s", user_input);  /* input is a string argument */
```

Likewise, an imported `sprintf` is not proof of overflow. Establish its format, argument lengths, destination capacity, and reachable callers. A stack canary may detect some corruptions; it does not make an invalid write correct or prevent every form of exploitation.

### Track one value from source to use

```text
untrusted length
    → conversion to integer
    → multiplication for allocation
    → allocation result
    → loop bound for copying
```

At each step, record widths, signedness, limits, and failure handling. This produces a testable explanation of the weakness rather than a list of suspicious functions. Keep claims about exploitability separate from proof of a memory-safety violation.

---

## 18. Limits, Obfuscation, and Analysis Errors

**Unexpected output can reflect either the binary's design or an incorrect analysis assumption.**

| Observation | Possible explanations | Next check |
| --- | --- | --- |
| Few readable strings | Packing, encryption, short messages, or little text | Layout, decoding routines, encodings |
| Very many library strings | Static linking or bundled dependencies | Call graph and application entry paths |
| Missing function names | Stripping or absent symbols | Call targets, signatures, and references |
| Nonsensical instructions | Wrong architecture, wrong boundary, data decoded as code | Header, bytes, incoming branches |
| Confusing decompiled arithmetic | Wrong types or genuine obfuscation | Operand widths, extensions, truncation |
| Unresolved branch destinations | Jump table, callback, virtual dispatch | Address computation and referenced tables |
| Decoding produces only partly readable text | Wrong key, endianness, stride, or lossy transform | Exact model and forward verification |

High entropy, unusual section names, or sparse strings are indicators to investigate, not verdicts that a file is packed or malicious. Encrypted and compressed legitimate data can produce similar observations.

A recovered loop can be simulated in an analyst-written model. Executing the original program, stepping with a debugger, or observing runtime-unpacked memory belongs to dynamic analysis. If static evidence is insufficient, state the unresolved question and the observation needed to answer it.

---

## 19. A Repeatable Workflow and Findings Record

**Use one evidence trail from identification to conclusion.**

1. **Identify the sample.** Record its hash, format, architecture, byte order, and size. A locally recorded hash supports later comparison; authenticity requires a trusted reference.
2. **Map its structure.** Inspect headers, sections, segments, imports, exports, and symbols.
3. **Extract clues.** Record strings with file offsets; expand searches beyond initial keywords.
4. **Locate relevant code.** Follow references and identify the function's callers and callees.
5. **Describe behavior.** Track input, validation, transformations, comparisons, output, and failure paths.
6. **Reconstruct computations.** Preserve widths, byte order, loop bounds, and modular operations.
7. **Validate conclusions.** Check original constants, re-encoding, independent calculations, and boundary cases.
8. **Account for coverage.** Note application routines examined, library routines recognized, and unresolved paths.
9. **Document results.** Separate observations, deductions, assumptions, and remaining uncertainty.

### Compact findings record

| Field | Example of what to record |
| --- | --- |
| Identity | SHA-256, filename, architecture, tool versions |
| Location | Function, instruction address, address basis, relevant data range |
| Observation | Exact call sequence, bounds, bytes, or transformation |
| Interpretation | What the evidence means and why |
| Preconditions | Required input, configuration, or reachable path |
| Validation | Reproduction commands, model checks, boundary cases |
| Impact | Concrete consequence supported by the evidence |
| Confidence and limits | Established facts, assumptions, missing information |

### Example finding

> **Observation:** after an input-read call, the caller immediately scans the destination without checking the returned pointer. **Interpretation:** a failed read can leave data unsuitable for string processing. **Next validation:** establish prior buffer initialization and whether the failure path can reach an unbounded scan. **Limit:** the presence of this pattern alone does not establish a particular exploit outcome.

A successful forward transform shows that a recovered candidate satisfies the modeled arithmetic. It does not prove uniqueness, completeness of the model, or that the original binary has been executed successfully.

---

## 20. Fast Recall

- **Static analysis examines the target without executing it.** It establishes code structure and supported possible behavior.
- **Strings are clues.** Keyword filters, character encodings, and runtime construction can hide relevant values.
- **Offsets and addresses differ.** Translate through the correct file mapping and load bias.
- **Disassembly and decompilation both need checking.** Instruction boundaries and inferred types can be wrong.
- **A CFG explains branches within a function; a call graph connects functions.**
- **Cross-references turn data into context.** Follow a value to its origin, transformation, and use.
- **Calling conventions identify arguments.** Confirm architecture and ABI first.
- **Width and signedness are part of the algorithm.** Keep overflow, truncation, and byte order explicit.
- **Constructed strings require reconstructing stores.** Use destination offsets and track overwrites.
- **Reverse operations in reverse order.** Re-encode results to check the model.
- **Modular exponentiation can be optimized.** Preserve intermediate precision and side-effect semantics.
- **Collisions mean several inputs may pass.** Multiplication modulo a number is invertible only when the multiplier and modulus are coprime.
- **Raw assembly may contain mistakes.** Explain actual behavior separately from apparent intent.
- **A risky API is not a vulnerability finding by itself.** Trace inputs, bounds, failure paths, and reachable effects.
- **Document uncertainty.** Acceptance, uniqueness, and runtime verification are different claims.

---

## 21. Resources

### Practical analysis

- [Ghidra introduction and interface guide](https://ghidra.re/ghidra_docs/GhidraClass/Beginner/Introduction_to_Ghidra_Student_Guide.html) — importing, analysis, strings, references, and graph views.
- [Radare2 code analysis](https://book.rada.re/analysis/code_analysis.html) and [print modes](https://book.rada.re/commandline/print_modes.html) — function investigation and interpreting stored data.
- [Binary Ninja user guide](https://docs.binary.ninja/guide/index.html) — analysis views and intermediate representations.
- [Hex-Rays FLIRT documentation](https://docs.hex-rays.com/user-guide/signatures/flirt) — recognizing library functions through signatures.
- [Cutter](https://cutter.re/) and [Binwalk](https://github.com/ReFirmLabs/binwalk) — graphical inspection and embedded-format analysis.

### Formats and command references

- [GNU strings](https://sourceware.org/binutils/docs/binutils/strings.html) and [GNU readelf](https://sourceware.org/binutils/docs/binutils/readelf.html) — extraction and ELF inspection options.
- [Microsoft PE format](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format) — PE headers, sections, addresses, and imports.
- [Apple Mach-O loader definitions](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/loader.h) — authoritative Mach-O structures and constants.

### Instructions and mathematical models

- [Intel architecture manuals](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html) — instruction operands, register effects, flags, and exceptions.
- [System V x86-64 ABI](https://gitlab.com/x86-psABIs/x86-64-ABI) — calling conventions and binary interfaces.
- [NASM language reference](https://www.nasm.us/doc/nasm03.html) — declarations, addressing, and assembly syntax.
- [Python modular power](https://docs.python.org/3/library/functions.html#pow) — efficient modular exponentiation for independent calculations.

---

_Companion reading: Reverse Engineering Fundamentals. Continue with dynamic analysis for controlled runtime observation and malware analysis for behavior-focused investigation._
