# SQL & NoSQL Injection

> **⚠️ AUTHORIZED USE ONLY.** This material is for education and authorized security testing. The injection payloads shown interact directly with a target application and its database, and are for use only on systems you own or are explicitly authorized to test (such as DVWA or a lab environment). Using them against systems you do not own is unauthorized access and a criminal offence in most jurisdictions. See the [Legal and Terms of Use](/legal) page.

> `A database does not get hacked because it is big. It gets hacked because it trusted the wrong input.`

> **Scope:** The full injection attack chain and its defenses. SQL injection from discovery through UNION, blind, and second-order techniques; NoSQL injection in MongoDB including authentication bypass and enumeration; and the code-level defenses (parameterized queries, input validation, ORMs, stored procedures, escaping) that stop them. Every attack is paired with its defense.

---

## Table of Contents
- [Core Concepts](#core-concepts)
- [What SQL Injection Is](#what-sql-injection-is)
- [The Risks](#the-risks)
- [Finding Injection Points](#finding-injection-points)
- [Classic In-Band Injection](#classic-in-band-injection)
- [UNION-Based Attacks](#union-based-attacks)
- [The Role of LIMIT](#the-role-of-limit)
- [Blind SQL Injection](#blind-sql-injection)
- [Second-Order Injection](#second-order-injection)
- [SQL vs NoSQL](#sql-vs-nosql)
- [NoSQL Injection in MongoDB](#nosql-injection-in-mongodb)
- [NoSQL Attack Vectors](#nosql-attack-vectors)
- [Defense: Parameterized Queries](#defense-parameterized-queries)
- [Defense: Input Validation](#defense-input-validation)
- [Defense: Regular Expressions](#defense-regular-expressions)
- [Defense: Escaping User Input](#defense-escaping-user-input)
- [Defense: Stored Procedures](#defense-stored-procedures)
- [Defense: ORMs](#defense-orms)
- [Defense in Depth](#defense-in-depth)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Concepts

| Term | Meaning |
|------|---------|
| **SQL injection (SQLi)** | Injecting malicious SQL into a query through unvalidated input |
| **NoSQL injection** | The same principle against a NoSQL database such as MongoDB |
| **Injection point** | An input that reaches a query without proper handling |
| **Payload** | The crafted input that alters the query's logic |
| **In-band** | The results come back through the same channel used to attack |
| **Blind** | No data is returned directly; results are inferred from behavior |
| **Parameterized query** | A query where user input is bound as data, never parsed as code |
| **ORM** | Object-Relational Mapper, a library that generates queries from code |
| **CWE-89** | The formal classification for SQL injection |
| **CWE-943** | The formal classification for NoSQL query injection |

**The universal root cause:** the application builds a query by mixing trusted code with untrusted input, and the interpreter cannot tell them apart. Every injection variant and every defense comes back to this one idea. The fix, in every case, is to keep user input as **data** and never let it become part of the **query structure**.

## 2. What SQL Injection Is

SQL injection is a vulnerability where an attacker inserts SQL syntax into an input that the application then executes as part of a database query. Because the application concatenates user input directly into the query string, input that contains SQL is parsed and run as code.

Injection remains one of the most exploited vulnerability classes. It ranks as **A05 in the OWASP Top 10:2025** (having moved down from A03 in 2021 as access-control failures rose above it), but it still produces some of the highest-severity individual incidents, because a single injectable field can expose an entire database. Its formal identifier is **CWE-89**.

### The vulnerable pattern

The flaw is almost always query construction by string concatenation:

```text
query = "SELECT * FROM users WHERE username = '" + input + "'"
```

If `input` is `admin`, the query is normal. If `input` is `' OR '1'='1`, the query becomes:

```sql
SELECT * FROM users WHERE username = '' OR '1'='1'
```

The `OR '1'='1'` is always true, so the `WHERE` clause matches every row. The attacker's text was parsed as SQL logic, not treated as a username. That is injection in its simplest form.

## 3. The Risks

A single injectable input can compromise the entire data layer and sometimes the host beneath it.

| Risk | Consequence |
|------|-------------|
| **Authentication bypass** | Log in without valid credentials |
| **Data theft** | Read the entire database: credentials, personal data, financial records |
| **Data tampering** | Modify or delete records |
| **Data destruction** | Drop tables, wipe data |
| **Privilege escalation** | Read or alter accounts and roles |
| **Remote code execution** | On some configurations, run commands on the database host |
| **Full compromise** | Databases hold credentials that unlock further systems |

Because databases sit at the core of nearly every service, storing credentials, personal data, transactions, and business logic, the impact of injection is rarely contained to one table. This is why it is treated as a critical-severity class despite being well understood and preventable.

## 4. Finding Injection Points

Injection testing starts by sending input a normal user would not, and watching how the application responds. Any input that reaches a query is a candidate: login fields, search boxes, filters, URL parameters, HTTP headers, and cookies.

### Probing techniques

| Test input | What a change signals |
|------------|-----------------------|
| `'` (single quote) | A database error or altered behavior suggests the quote broke query syntax |
| `''` (two quotes) | If the error disappears, the input is being placed inside a string |
| `' OR '1'='1` | Returning more rows than expected indicates injectable logic |
| `1+1` or `2-1` in numeric fields | If the result reflects `2`, the input is evaluated |
| `' AND '1'='2` | Returning nothing where data was expected confirms boolean control |

An unexpected database error, a change in the number of results, or different application behavior are the signals that input is reaching the query unfiltered. The single quote is the classic first probe because it terminates a string literal and breaks the query if unhandled.

## 5. Classic In-Band Injection

In-band (or classic) injection is where results return through the same channel used to inject, making it the most direct variant.

### Authentication bypass

The canonical example turns a login check into an always-true condition.

```sql
-- input in the username field: ' OR '1'='1' --
SELECT * FROM users WHERE username = '' OR '1'='1' -- ' AND password = '...'
```

The `--` begins a SQL comment, discarding the rest of the query including the password check. The condition matches every user, and the application logs the attacker in, often as the first user in the table.

### Error-based extraction

When an application displays database errors, an attacker can deliberately provoke errors that leak data in the error message, extracting values one at a time. This relies on verbose error reporting being enabled, which is itself a misconfiguration.

**The comment syntax varies by database**, which is also how injection can fingerprint the backend:

| Database | Line comment |
|----------|--------------|
| MySQL | `-- ` (with trailing space) or `#` |
| PostgreSQL | `--` |
| Microsoft SQL Server | `--` |
| Oracle | `--` |

## 6. UNION-Based Attacks

A UNION attack uses SQL's `UNION` operator to append a second query onto the first, so the attacker's chosen data is returned alongside (or instead of) the legitimate results. It is the primary technique for **exfiltrating** data through an in-band injection.

### How it works

`UNION SELECT` combines the results of two queries. For it to work, both queries must return the **same number of columns**, with compatible data types.

**Step 1: find the column count.** Increment `ORDER BY` until the query errors, or use `UNION SELECT NULL` with growing column counts.

```sql
' ORDER BY 1 --      (works)
' ORDER BY 2 --      (works)
' ORDER BY 3 --      (errors: there are 2 columns)

' UNION SELECT NULL, NULL --      (matches: 2 columns)
```

**Step 2: find which columns are displayed.** Place markers to see which appear on the page.

```sql
' UNION SELECT 'a', 'b' --        (see whether 'a' or 'b' is shown)
```

**Step 3: extract data.** Replace the markers with real queries against the database's metadata.

```sql
-- database version
' UNION SELECT @@version, NULL --

-- list tables (from the information_schema metadata)
' UNION SELECT table_name, NULL FROM information_schema.tables --

-- list columns of a table
' UNION SELECT column_name, NULL FROM information_schema.columns WHERE table_name = 'users' --

-- extract credentials
' UNION SELECT username, password FROM users --
```

**The key enabler is `information_schema`**, a metadata database that describes every table and column. It lets an attacker map the entire structure before extracting from it. UNION is fast and powerful, but requires the results to be visible, which is why blind techniques exist for when they are not.

## 7. The Role of LIMIT

The `LIMIT` clause (in MySQL and PostgreSQL) restricts how many rows a query returns, and it serves two purposes in injection.

**Controlling output volume.** When a page displays only one record but a query returns many, `LIMIT` and `OFFSET` walk through the data one row at a time.

```sql
' UNION SELECT username, password FROM users LIMIT 1 OFFSET 0 --   (first row)
' UNION SELECT username, password FROM users LIMIT 1 OFFSET 1 --   (second row)
```

**Isolating a single value.** Many extraction and blind techniques need exactly one value at a time, and `LIMIT 1` guarantees a single row so the query does not error or return ambiguous results.

```sql
' UNION SELECT password FROM users WHERE username='admin' LIMIT 1 --
```

`LIMIT` is therefore a practical tool for stepping through extracted data in a controlled way, especially where the application shows one result at a time. On Microsoft SQL Server the equivalent is `TOP`, and on Oracle it is `ROWNUM` or `FETCH FIRST`.

## 8. Blind SQL Injection

Blind injection applies when the application is injectable but **returns no data and no errors**. The attacker cannot see query output, so they infer it by observing the application's behavior, one bit at a time.

### Boolean-based blind

The attacker asks true/false questions and watches for a difference in the response (different content, a different page, present or absent results).

```sql
-- does the first character of the admin password come before 'm'?
' AND SUBSTRING((SELECT password FROM users WHERE username='admin'),1,1) < 'm' --
```

If the page behaves as "true," the guess narrows; if "false," it narrows the other way. Repeating this extracts each character through binary search. It is slow but reliable.

### Time-based blind

When there is no visible difference at all between true and false, the attacker forces the database to **wait** on a true condition, and measures the response time.

```sql
-- MySQL: sleep 5 seconds if the condition is true
' AND IF(SUBSTRING((SELECT password FROM users LIMIT 1),1,1)='a', SLEEP(5), 0) --

-- PostgreSQL
'; SELECT CASE WHEN (condition) THEN pg_sleep(5) ELSE pg_sleep(0) END --

-- Microsoft SQL Server
'; IF (condition) WAITFOR DELAY '0:0:5' --
```

A five-second delay means the condition was true; an immediate response means false. Time-based blind is the slowest technique but works even when the application reveals nothing else, which makes it the fallback when all other channels are closed.

> This character-by-character inference is exactly the tedious work that automated tools perform. Doing it manually is what reveals how the vulnerability actually functions, which is why learning it without a tool matters.

## 9. Second-Order Injection

Second-order (or stored) injection is one of the hardest variants to detect. The payload is **stored first and executed later**, in a different context from where it entered.

### How it works

1. The attacker submits input containing a payload, for example as a username during registration. The application **stores it safely**, often escaping it correctly on the way in, so nothing happens and no vulnerability appears.
2. Later, a different part of the application reads that stored value and uses it in a new query **without re-sanitizing it**, trusting it because it came from the database rather than directly from a user.
3. At that point the payload executes.

The danger is that the input looks harmless at the point of entry, where testing usually focuses, and only becomes dangerous later, at a point that may never be tested against user input because its data "comes from the database." Standard input testing at the entry field misses it entirely, because the entry field handled the input correctly.

**The defense is the same principle applied consistently:** treat data as untrusted every time it is used in a query, not just when it first arrives. Data from the database is not inherently safe if it originally came from a user.

## 10. SQL vs NoSQL

The injection principle carries into NoSQL databases, but the syntax and mechanics differ.

| | SQL (relational) | NoSQL (e.g. MongoDB) |
|---|------------------|----------------------|
| **Structure** | Tables, rows, columns, fixed schema | Collections of flexible documents (JSON-like) |
| **Query language** | SQL | Database-specific (MongoDB query objects, JSON) |
| **Examples** | MySQL, PostgreSQL, SQL Server, Oracle | MongoDB, CouchDB, Redis |
| **Injection via** | Malicious SQL syntax in a string | Malicious operators or objects in query input |
| **Classification** | CWE-89 | CWE-943 |

**Can NoSQL databases be injected? Yes.** The belief that NoSQL is immune to injection is a dangerous myth. NoSQL databases do not use SQL, so they are not vulnerable to *SQL* injection, but they are fully vulnerable to *their own* form of injection when they build queries from untrusted input. Same principle, different syntax.

## 11. NoSQL Injection in MongoDB

MongoDB queries are structured objects rather than text strings, so NoSQL injection typically works by injecting **query operators** where the application expects a plain value.

### How it occurs

A vulnerable login might build a query from request parameters like this:

```text
db.users.find({ username: input_user, password: input_pass })
```

If the application accepts structured input (for example, JSON in the request body) and places it into the query unvalidated, an attacker can supply a MongoDB **operator** instead of a value.

### Authentication bypass with operators

MongoDB comparison operators such as `$ne` (not equal), `$gt` (greater than), and `$regex` can turn a specific match into an always-true condition.

```json
{ "username": "admin", "password": { "$ne": "" } }
```

This asks for the admin user whose password is *not equal to empty*, which is true for any real password, bypassing the check. Supplied in a URL-encoded form, the same idea appears as `username=admin&password[$ne]=`.

```json
{ "username": { "$gt": "" }, "password": { "$gt": "" } }
```

This matches any username and password greater than an empty string, logging in as the first user.

### Data enumeration with $regex

The `$regex` operator enables blind extraction, testing a password character by character much like boolean-based blind SQLi.

```json
{ "username": "admin", "password": { "$regex": "^a" } }
```

If the login succeeds, the password starts with `a`; the attacker extends the pattern one character at a time. MongoDB also historically allowed JavaScript execution via `$where` clauses, which is an even more direct injection path where enabled.

## 12. NoSQL Attack Vectors

A NoSQL injection attack vector is any path through which untrusted input becomes part of a query's structure rather than its data.

| Vector | Mechanism |
|--------|-----------|
| **Operator injection** | Supplying `$ne`, `$gt`, `$regex`, and similar operators where a value is expected |
| **JSON/parameter pollution** | Sending structured objects (`param[$ne]=`) where the app expects a string |
| **JavaScript injection** | Injecting into `$where` clauses that evaluate JavaScript (where enabled) |
| **Blind inference** | Using `$regex` or boolean operators to extract data character by character |
| **Type mismatch** | Exploiting weak typing by sending an array or object instead of a string |

The common thread is that the application accepts **structured, attacker-controlled input** and passes it to the query engine without checking that each value is the expected type. A password field should contain a string; if the application accepts an object like `{"$ne": ""}` there instead, that is the vulnerability.

## 13. Defense: Parameterized Queries

Parameterized queries (also called prepared statements) are the **single most effective defense** against injection, and the primary recommendation of every guideline.

### How they work

Instead of building a query by concatenating strings, the query structure is defined first with **placeholders**, and the user input is sent separately and **bound** to those placeholders as data. The database treats bound input strictly as a value, never parsing it as query syntax.

```text
Vulnerable (concatenation):
    "SELECT * FROM users WHERE username = '" + input + "'"

Safe (parameterized):
    "SELECT * FROM users WHERE username = ?"     with input bound to ?
```

```python
# Python example: the ? is a placeholder, input is passed separately
cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
```

```php
// PHP PDO example
$stmt = $pdo->prepare("SELECT * FROM users WHERE username = :user");
$stmt->execute(['user' => $username]);
```

**Why it works:** the query structure is fixed and parsed *before* the input is ever attached, so no input, however crafted, can change the query's logic. A username of `' OR '1'='1` is simply searched for as a literal string that happens to contain quotes. This is what makes parameterization a structural fix rather than a filter that must anticipate every payload.

**One limit worth knowing:** placeholders bind *values*, not identifiers. Table and column names cannot be parameterized, so if those must come from user input, they require strict allow-listing instead.

## 14. Defense: Input Validation

Input validation checks that input matches what the application expects before it is used, rejecting anything that does not conform.

### Why it matters

Applications should never trust user input. Validation is the enforcement of that principle: it constrains input to an expected format, length, type, and range, shrinking the attack surface an injection payload could use. An email field should contain an email; a numeric ID should contain digits; a username should match a known-safe character set.

### Allow-list vs block-list

| Approach | Method | Strength |
|----------|--------|----------|
| **Allow-list (preferred)** | Define what is permitted, reject everything else | Strong: unanticipated payloads are rejected by default |
| **Block-list** | Define what is forbidden, allow the rest | Weak: attackers find inputs the list did not anticipate |

Allow-listing is strongly preferred, for the same reason it is in every other security context: it does not depend on predicting every malicious input.

**The critical caveat:** input validation is a valuable **defense-in-depth layer, but not a substitute for parameterized queries.** Validation reduces risk and catches malformed input, but determined injection can sometimes satisfy a validation rule while still carrying a payload. Parameterization removes the vulnerability; validation hardens around it. Use both.

## 15. Defense: Regular Expressions

Regular expressions (regex) are a common tool for implementing input validation by defining an exact pattern that input must match.

### How they are used

A regex describes the allowed format, and input is accepted only if it matches completely. Anchoring the pattern with `^` (start) and `$` (end) is essential, so the whole input is validated, not just part of it.

```text
Username, letters/digits/underscore, 3 to 16 characters:
    ^[a-zA-Z0-9_]{3,16}$

Numeric ID only:
    ^[0-9]+$

Basic email shape:
    ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
```

```python
import re
if not re.fullmatch(r'^[a-zA-Z0-9_]{3,16}$', username):
    reject()
```

**Two cautions.** First, always anchor with `^...$`, or a payload can hide in the unmatched portion of the input. Second, regex validation confirms format but does not make a query safe by itself; it is an input-validation layer that still sits on top of parameterized queries, not a replacement for them. Overly complex regex can also introduce its own denial-of-service risk, so patterns should be kept simple.

## 16. Defense: Escaping User Input

Escaping means transforming characters that have special meaning in a query so the database treats them as literal data rather than syntax, for example converting a single quote so it cannot terminate a string.

### How it fits

Escaping is a defense that neutralizes dangerous characters when input must be placed into a query. Database libraries provide escaping functions for this purpose.

**However, escaping is the weakest of the query-level defenses and is error-prone:**

- It is easy to miss a spot, and one unescaped input reintroduces the vulnerability.
- Escaping rules differ by database and by context, so a value escaped for one situation may be unsafe in another.
- It does not help with numeric contexts or with structural elements like table names.
- Second-order injection defeats naive escaping, because the value is escaped on input but used unescaped later.

For these reasons, escaping is a fallback for cases where parameterization genuinely cannot be used, not the primary defense. **Parameterized queries are preferred precisely because they escape and separate input automatically and correctly, removing the human error that manual escaping invites.**

## 17. Defense: Stored Procedures

A stored procedure is a predefined set of SQL statements stored in the database and called by name, rather than the application sending raw query text.

### How they help, and their limits

Stored procedures can reduce injection risk because the query logic lives in the database and the application passes parameters to it. When a stored procedure uses its **parameters safely** (as bound parameters), it provides protection similar to a parameterized query.

**But stored procedures are not automatically safe.** A stored procedure that builds a query by concatenating its parameters into **dynamic SQL** inside the procedure is just as injectable as any other concatenated query. The safety comes from parameterization, not from the fact that the code is a stored procedure.

```text
Safe:    the procedure uses its parameter directly in a fixed query
Unsafe:  the procedure builds "SELECT ... WHERE x = " + parameter as dynamic SQL
```

So stored procedures are a useful control when written correctly, but they are neither necessary nor sufficient on their own. Parameterized queries in application code achieve the same protection more simply.

## 18. Defense: ORMs

An Object-Relational Mapper (ORM) is a library that lets developers work with database records as objects in their programming language, generating the underlying SQL automatically. Examples include Hibernate, Entity Framework, Django ORM, and SQLAlchemy.

### The role of ORMs in prevention

ORMs help prevent injection because they **generate parameterized queries by default.** When a developer writes a query through the ORM's methods, the ORM binds the values as parameters rather than concatenating them, so ordinary ORM use is safe against injection without the developer having to think about it. This is a major reason injection has become less prevalent: modern frameworks make the safe path the default path.

**The caveat is the escape hatch.** Most ORMs allow developers to drop down to **raw SQL** for complex queries, and raw queries built by concatenation are just as vulnerable as any other. The ORM protects you until you bypass it. NoSQL ORMs and ODMs (such as Mongoose for MongoDB) play a similar role, adding schema enforcement and type checking that also help block operator-injection attacks.

So an ORM is a strong default defense, but it is not a guarantee: safety depends on using the ORM's parameterized methods and validating input even when using raw queries.

## 19. Defense in Depth

No single control is relied upon alone. Layered defenses ensure that if one fails, others still stand.

| Layer | Role |
|-------|------|
| **Parameterized queries** | The primary, structural fix. Keeps input as data |
| **ORM with safe methods** | Makes parameterization the default in application code |
| **Input validation (allow-list)** | Rejects malformed input before it reaches a query |
| **Least-privilege database account** | Limits what a successful injection can do |
| **Escaping** | A fallback where parameterization is impossible |
| **Disable verbose errors** | Denies attackers the feedback error-based injection needs |
| **WAF** | Catches common payloads, buying time (not a fix) |
| **Consistent re-validation** | Treats stored data as untrusted too, defeating second-order injection |

**The priority is unambiguous:** parameterized queries (or safe ORM use) are the fix; everything else is reinforcement. A least-privilege database account is especially valuable as a damage limiter: if the application connects as an account that can only read the tables it needs, an injection cannot drop tables or reach data outside its scope. The strongest programs combine prevention at the code level with containment at the database level.

## 20. Fast Recall

- **Injection's root cause** is mixing untrusted input with query code so the interpreter parses input as code. Every variant and defense traces to this.
- **SQL injection is CWE-89**, ranked **A05 in the OWASP Top 10:2025** (down from A03 in 2021, still critical severity).
- **The classic probe is a single quote (`'`)**; an error or behavior change signals injectability.
- **`' OR '1'='1' --`** makes a WHERE clause always true and comments out the rest, bypassing authentication.
- **UNION attacks** append `UNION SELECT` to exfiltrate data. Match the column count first (`ORDER BY` or `UNION SELECT NULL`), then read from `information_schema`.
- **`LIMIT`** steps through extracted rows one at a time and isolates a single value for blind and UNION techniques.
- **Blind injection** infers data with no visible output: **boolean-based** (true/false from response differences) and **time-based** (`SLEEP`/`WAITFOR` delays).
- **Second-order injection** stores a payload safely, then executes it later when reused unsanitized. Hard to detect because entry looks harmless.
- **NoSQL databases can be injected** (CWE-943). Not vulnerable to SQL, but fully vulnerable to their own injection.
- **MongoDB injection uses operators:** `{"$ne": ""}`, `{"$gt": ""}` for auth bypass, `{"$regex": "^a"}` for character-by-character enumeration.
- **A NoSQL attack vector** is any path where structured, attacker-controlled input becomes query structure instead of data.
- **Parameterized queries are the primary defense:** query structure is fixed and parsed before input is bound as data, so input cannot change logic.
- **Input validation** enforces "never trust input" via allow-listing. A defense-in-depth layer, not a replacement for parameterization.
- **Regex validation** must be anchored `^...$`; it validates format but does not make a query safe on its own.
- **Escaping** neutralizes special characters but is error-prone and the weakest query-level defense. A fallback, not the primary fix.
- **Stored procedures** help only when they parameterize; dynamic SQL inside a procedure is still injectable.
- **ORMs** generate parameterized queries by default, a strong default defense, until a developer drops to raw concatenated SQL.
- **Defense in depth:** parameterization plus safe ORM use plus validation plus least-privilege DB account plus disabled verbose errors.

## 21. Resources

**Foundations and prevention**
- [OWASP: SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [OWASP: SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [OWASP Top 10:2025 A05 Injection](https://owasp.org/Top10/2025/A05_2025-Injection/)
- [OWASP: Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP: Query Parameterization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Query_Parameterization_Cheat_Sheet.html)

**NoSQL**
- [OWASP: Testing for NoSQL Injection](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/05.6-Testing_for_NoSQL_Injection)
- [MongoDB: Query operators reference](https://www.mongodb.com/docs/manual/reference/operator/query/)

**Formal classifications**
- [MITRE CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)
- [MITRE CWE-943: Improper Neutralization of Special Elements in Data Query Logic](https://cwe.mitre.org/data/definitions/943.html)

**Practice (authorized labs)**
- [PortSwigger Web Security Academy: SQL injection](https://portswigger.net/web-security/sql-injection)
- [PortSwigger Web Security Academy: NoSQL injection](https://portswigger.net/web-security/nosql-injection)
- [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/)
- [DVWA (Damn Vulnerable Web Application)](https://github.com/digininja/DVWA)
