# Mobile Application Fundamentals and Security

> **⚠️ AUTHORIZED USE ONLY.** For education and authorized testing only. Analyze, decompile, or test apps only when you own them or have explicit written permission. Reverse engineering and security testing of third-party apps can breach store terms and law. See the [Legal and Terms of Use](/legal) page.

**Scope:** how Android apps are built, and where that construction becomes attack surface. You cannot find weaknesses in an app whose structure you do not understand, so this sheet teaches the fundamentals first (components, manifest, lifecycle, layouts, build artifacts) and layers the security view on each: what a tester looks for, and how a developer closes it. Focus is Android, the platform the project targets.

**Recommended background:** basic programming, the command line, and the ideas from the *Malware Analysis* sheet (which owns the deep APK-reversing toolchain: `apktool`, `jadx`, `frida`).

**Conventions:** `$` is a shell prompt. XML snippets are from `AndroidManifest.xml` or layout files. Code is Java/Kotlin. Security notes are for finding and fixing weaknesses, never for attacking apps you do not own.

## Table of Contents
- [Quick Reference](#quick-reference)
- [How an Android App Is Built](#how-an-android-app-is-built)
- [App Types: Native, Web, Hybrid](#app-types-native-web-hybrid)
- [The Development Toolchain](#the-development-toolchain)
- [Project Structure and Resources](#project-structure-and-resources)
- [The AndroidManifest](#the-androidmanifest)
- [Build Artifacts: APK, AAR, JAR, DEX](#build-artifacts-apk-aar-jar-dex)
- [Core Components](#core-components)
- [The Activity Lifecycle](#the-activity-lifecycle)
- [Layouts and UI](#layouts-and-ui)
- [Lists: ListView vs RecyclerView](#lists-listview-vs-recyclerview)
- [Navigation: Tasks and the Back Stack](#navigation-tasks-and-the-back-stack)
- [Background Work](#background-work)
- [Intents](#intents)
- [Permissions](#permissions)
- [The Mobile Attack Surface](#the-mobile-attack-surface)
- [Common Security Threats](#common-security-threats)
- [Insecure Data Storage](#insecure-data-storage)
- [Secure Communication](#secure-communication)
- [Authentication](#authentication)
- [Input Validation](#input-validation)
- [Hardening and Best Practices](#hardening-and-best-practices)
- [Analyzing an APK](#analyzing-an-apk)
- [Fast Recall](#fast-recall)
- [Resources](#resources)

---

## 1. Quick Reference

The fundamentals the rest of the sheet builds on, in one view.

| Thing | Answer | Section |
|-------|--------|---------|
| Primary app component | **Activity** (one screen) | 8 |
| File declaring components, permissions, metadata | **AndroidManifest.xml** | 6 |
| Default language | **Java** (Kotlin is the modern default) | 4 |
| Build tool / IDE | **Android Studio** (wraps Gradle) | 4 |
| Distribution file | **.apk** | 7 |
| Library bundle for developers | **AAR** | 7 |
| Resources folder | **res/** (layouts, drawables, values) | 5 |
| Images and icons | **res/drawable/** | 5 |
| Background, no UI | **Service** | 8 |
| Shared data between apps | **ContentProvider** | 8 |
| Receives system/app broadcasts | **BroadcastReceiver** | 8 |
| Handles clicks and touches | **View** | 8 |
| Relative positioning layout | **ConstraintLayout** | 10 |
| Efficient scrollable list | **RecyclerView** | 11 |
| Activity back stack | **Task** | 12 |
| Periodic/conditional background jobs | **WorkManager** | 13 |
| Log/debug monitoring | **Logcat** (via ADB) | 4 |

**The security throughline:** every component, permission, and stored file is also an entry point. A tester reads the manifest first (Section 6) because it lists the doors.

---

## 2. How an Android App Is Built

**Why start here:** finding weaknesses requires knowing how the pieces fit. The pipeline mirrors the one from the RE sheets, but for Android.

```
Java / Kotlin source
     ↓  (Android Studio + Gradle)
Compiled to Dalvik bytecode  →  classes.dex
     ↓  packaged with resources + manifest
APK file  →  installed on the device
```

| Stage | What happens |
|-------|--------------|
| Source | Written in Java or Kotlin |
| Compile | Turned into **Dalvik bytecode**, stored in `classes.dex`, not native machine code |
| Package | The `.dex`, resources, and manifest are zipped into an **APK** |
| Sign | The APK is cryptographically signed; Android refuses unsigned apps |
| Install | The user (or Play Store) installs the APK |

**Why this matters to a tester:** because an APK is a signed ZIP of bytecode and resources, it can be unpacked and the bytecode decompiled back toward Java (Section 23). Anything shipped inside the app, including hardcoded secrets, is recoverable.

---

## 3. App Types: Native, Web, Hybrid

| Type | Built with | Runs | Trade-off |
|------|-----------|------|-----------|
| **Native** | Platform SDK (Java/Kotlin for Android, Swift for iOS) | Directly on the OS | Best performance and full API access; one codebase per platform |
| **Web** | HTML, CSS, JavaScript | Inside the mobile browser; no install | One codebase, no store; limited device access, no offline by default |
| **Hybrid** | Web technologies wrapped in a native shell (a WebView) | As an installed app that hosts web content | One codebase across platforms; performance and security depend on the WebView |

**Security note:** hybrid apps add the web attack surface (XSS, insecure WebView settings) on top of the native one. A WebView with JavaScript enabled and a bridge to native code is a classic weak point (Section 21).

---

## 4. The Development Toolchain

| Tool | Role |
|------|------|
| **Android Studio** | The official IDE. Combines the editor, emulator, and **Gradle** build system with Android-specific features. The tool used to build Android apps |
| **Gradle** | The underlying build system Android Studio drives |
| **Java / Kotlin** | The official languages. **Java** is the long-standing default; **Kotlin** is Google's preferred modern language |
| **Android SDK** | The libraries and build tools; always target a recent version for the latest security features |
| **ADB (Android Debug Bridge)** | Command-line bridge to a device or emulator: install, shell, pull files, read logs |
| **Logcat** | The logging system; the primary tool for **monitoring logs and debugging** app behavior |

### ADB and Logcat in practice

```bash
adb devices                 # list connected devices/emulators
adb install app.apk         # install an APK
adb logcat                  # stream the device log
adb logcat | grep -i "password\|token\|http"   # hunt for leaks in logs
adb shell                   # a shell on the device
```

**Security note:** `adb logcat` is also where sensitive data leaks show up. Apps that log passwords, tokens, or full requests are a common finding — a developer's debug line becomes a data-leakage bug. The fix is to strip logging from release builds.

---

## 5. Project Structure and Resources

An Android project separates code from resources. Knowing where things live tells a tester where to look.

```
app/
├── src/main/
│   ├── java/ (or kotlin/)      ← source code
│   ├── AndroidManifest.xml     ← declarations (Section 6)
│   └── res/                    ← resources
│       ├── layout/             ← UI layout XML (Section 10)
│       ├── drawable/           ← images, icons, graphics
│       ├── values/             ← strings.xml, colors.xml, styles.xml
│       └── mipmap/             ← launcher icons
├── assets/                     ← raw files bundled as-is
└── build.gradle                ← build config and dependencies
```

| Folder/file | Holds |
|-------------|-------|
| **res/** | App **resources**: layouts, images, strings, colors, styles |
| **res/drawable/** | **Images, icons, and graphics** |
| **res/layout/** | UI layout XML files (Section 10) |
| **res/values/** | `strings.xml`, `colors.xml`, `styles.xml` |
| **assets/** | Raw files read verbatim at runtime |
| **build.gradle** | Dependencies and build settings |

**Security note:** `res/values/strings.xml` and `assets/` are where developers wrongly park secrets — API keys, backend URLs, credentials. All of it ships in the APK and is trivially readable after unpacking. Secrets belong on the server, never in resources.

---

## 6. The AndroidManifest

**What it is:** `AndroidManifest.xml` is the single file that **declares the app's components, permissions, and metadata**. It is the app's blueprint, and a tester's first read.

```xml
<manifest package="com.example.app">
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.CAMERA"/>

    <application android:allowBackup="true" android:debuggable="false">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
        <service android:name=".SyncService" android:exported="false"/>
        <provider android:name=".DataProvider" android:exported="false"/>
    </application>
</manifest>
```

What a tester reads from it:

| Line | Why it matters |
|------|----------------|
| `uses-permission` | Every permission the app can use. Over-broad permissions are finding #1 |
| `android:exported="true"` | **The component can be launched by other apps.** Every exported component is an entry point |
| `android:debuggable="true"` | If true in a release, anyone can attach a debugger. A serious finding |
| `android:allowBackup="true"` | App data can be extracted via ADB backup |
| `intent-filter` | What implicit intents the component responds to (Section 14) |

**The rule:** read the manifest first. It lists the doors into the app before you look at a single line of code.

---

## 7. Build Artifacts: APK, AAR, JAR, DEX

These are often confused, and the distinction is tested.

| Artifact | What it is | For |
|----------|-----------|-----|
| **APK** (Android Package Kit) | The complete, installable app: `.dex` + resources + manifest, signed | **Distribution to users / devices** |
| **AAR** (Android Archive) | A library bundle: compiled code **plus Android resources** | **Reuse by developers** in other apps |
| **JAR** (Java Archive) | Compiled Java classes only, no Android resources | Plain Java libraries |
| **DEX** (Dalvik Executable) | The compiled bytecode itself (`classes.dex`) | The code inside an APK |

The clean distinction: **APK ships to users, AAR ships to developers** (and unlike a JAR it carries Android resources), **DEX is the bytecode** inside both.

---

## 8. Core Components

The building blocks of every Android app. Each is a potential entry point if exported.

| Component | What it is | Security relevance |
|-----------|-----------|--------------------|
| **Activity** | A single screen; manages the UI. The **primary component** — every app has at least one | Exported activities can be launched directly, skipping login screens |
| **Fragment** | A modular, reusable part of an Activity's UI | Lives inside an Activity; not independently exported |
| **Service** | **Background task with no UI** (music, sync) | Exported services can be invoked by other apps |
| **ContentProvider** | **Manages and shares data between apps** through a structured interface | The classic SQL-injection and data-exposure surface |
| **BroadcastReceiver** | **Responds to system or app broadcasts** (SMS received, low battery) | Exported receivers can be triggered by crafted broadcasts |
| **View** | A single UI element; **handles user interactions** such as clicks and touches | Input entry point |
| **Intent** | The messaging object that ties components together (Section 14) | The medium of inter-component attacks |

### Who sends broadcasts, who receives

A **BroadcastReceiver** is the component for the broadcast mechanism: it registers for events and reacts. Broadcasts are *sent* with an Intent (`sendBroadcast()`), and received by receivers. An exported receiver that acts on a broadcast without checking the sender is a common flaw.

### ContentProvider: the shared-data surface

A ContentProvider exposes data through a URI-based interface so other apps can query it. If it is exported and does not validate its queries, it leaks data or is vulnerable to injection through the query parameters. This is why ContentProviders default to `exported="false"` on modern Android.

---

## 9. The Activity Lifecycle

**Why it matters:** Android creates, pauses, and destroys activities as the user navigates and as resources demand. Lifecycle methods are where the app saves state, releases resources, and, importantly for security, where data can be left exposed.

```
onCreate()  →  onStart()  →  onResume()
                                  ↕  (user interacts)
                              onPause()  →  onStop()  →  onDestroy()
```

| Method | Called when |
|--------|-------------|
| **onCreate()** | The activity is first created; set up UI here |
| **onStart()** | Just before the activity becomes visible |
| **onResume()** | The app starts interacting with the user (now in the foreground) |
| **onPause()** | The app loses focus but is still partly visible |
| **onStop()** | The activity is no longer visible |
| **onDestroy()** | Before the activity is destroyed and cleaned from memory |

**`onExecute()` is not a lifecycle method** — a common trick answer. The real set is onCreate, onStart, onResume, onPause, onStop, onDestroy (plus onRestart).

**Security note:** `onPause()` is the right place to hide sensitive data before the app goes to the background, because Android screenshots the screen for the app switcher. Banking apps blank the screen in `onPause()` so the thumbnail does not leak balances.

---

## 10. Layouts and UI

A layout is an XML file in `res/layout/` that **defines the positioning of UI elements**. The layout types:

| Layout | Positions elements |
|--------|--------------------|
| **ConstraintLayout** | **Relative to each other** and to the parent, via constraints. The modern default, flat and flexible |
| **LinearLayout** | In a single row or column |
| **FrameLayout** | Stacked on top of each other, for a single item or overlays |
| **GridLayout** | In a grid of rows and columns |

A minimal layout:

```xml
<TextView
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:text="Hello" />
```

| Attribute | Sets |
|-----------|------|
| **android:layout_width** | The component's width (`match_parent`, `wrap_content`, or a fixed `dp`) |
| `android:layout_height` | The component's height |
| `android:text` | Displayed text |
| `android:gravity` | Alignment of content inside the view |

A **View** is the base class for every UI element (buttons, text fields) and is what **handles user interactions** like clicks and touches.

---

## 11. Lists: ListView vs RecyclerView

Showing a scrollable list efficiently is a core task, and the two classes are tested against each other.

| Class | Notes |
|-------|-------|
| **RecyclerView** | The modern, **efficient** scrollable list. Recycles off-screen views, so a list of thousands scrolls smoothly. The recommended choice |
| **ListView** | The older list widget. Simpler but less efficient and less flexible |
| **ScrollView** | Scrolls a single large view, not a list of repeating items |
| **GridView** | A scrollable grid |

**Why RecyclerView wins:** it reuses a small pool of view objects as you scroll instead of creating one per item, which is what makes it efficient for large datasets.

---

## 12. Navigation: Tasks and the Back Stack

**What a Task is:** a **Task** is the stack of activities the user moves through. As you open screens, activities are pushed onto the stack; pressing Back pops them off, letting you **navigate backward through the app's screens**. This stack is the "back stack."

```
Task (back stack):
   [ DetailActivity ]   ← top, visible now
   [ ListActivity   ]
   [ MainActivity   ]   ← bottom, where you started
   Back button pops the top
```

**Security note:** `launchMode` and task affinity settings can let a malicious app insert itself into another app's task (task hijacking / StrandHogg). Setting a sensible `launchMode` and `taskAffinity` is the defense.

---

## 13. Background Work

Several mechanisms run code without the user looking at a screen. Choosing the right one is both a correctness and a battery concern.

| Mechanism | Use for |
|-----------|---------|
| **Service** | General background work while the app runs (the component; Section 8) |
| **WorkManager** | **Periodic or conditional deferrable jobs** (sync when on Wi-Fi and charging). The modern, recommended API |
| **JobScheduler** | The older system job API that WorkManager builds on |
| **AlarmManager** | Running code at a specific wall-clock time |
| **IntentService** | Deprecated; one-off background tasks off the main thread |

**For jobs that must run periodically or under certain conditions, the answer is WorkManager.** It survives reboots and respects battery constraints, which the older APIs handled poorly.

---

## 14. Intents

**What an intent is:** a messaging object used to request an action from a component, within the app or across apps. Intents are how components communicate.

| Type | Target | Example |
|------|--------|---------|
| **Explicit** | Names the exact component | Start `DetailActivity` from `MainActivity` |
| **Implicit** | Describes an action; the system picks a handler | "Open this URL" — the system offers browsers |

```java
// Explicit: I know exactly what I'm starting
startActivity(new Intent(this, DetailActivity.class));

// Implicit: I describe what I want done
Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse("https://example.com"));
startActivity(i);
```

### Intent security

| Risk | What happens |
|------|--------------|
| **Implicit intent interception** | A malicious app registers an `intent-filter` for the same action and receives data meant for another app |
| **Sensitive data in an implicit intent** | Any app that can handle the action sees the payload |
| **Exported component started by a crafted intent** | An attacker launches an internal screen or service directly |

**The rule:** use **explicit** intents for anything sensitive or internal, so only your named component can receive it. Reserve implicit intents for genuinely open actions (open a URL, share text), and never put secrets in them.

---

## 15. Permissions

**What permissions do:** they control which sensitive resources and data an app can access (camera, contacts, location). They are declared in the manifest and, for sensitive ones, approved by the user.

### The two classes

| Class | Risk | Granted |
|-------|------|---------|
| **Normal** | Low (set an alarm, use the internet) | **Automatically** at install |
| **Dangerous** | Affects privacy (location, camera, contacts, SMS) | **Explicitly by the user** |

### Declaration and runtime request

Declared in the manifest:

```xml
<uses-permission android:name="android.permission.CAMERA"/>
```

Since **Android 6.0 (API 23)**, dangerous permissions must also be requested **at runtime**, so the user decides when the app actually needs them:

```java
ActivityCompat.requestPermissions(this,
    new String[]{Manifest.permission.CAMERA}, REQUEST_CODE);
```

### Permission best practices

| Practice | Why |
|----------|-----|
| Request only what the app truly needs | Least privilege; over-permissioned apps are a privacy risk and a red flag |
| Explain why, in-app, before prompting | Users grant informed permissions; blind prompts get denied |
| Handle denial gracefully | The app must still work, degraded, when a permission is refused |

**Security note:** a tester reads the permission list against the app's actual function. A flashlight app requesting SMS and contacts is the textbook sign of over-collection or malware.

---

## 16. The Mobile Attack Surface

Where the fundamentals above become weaknesses. This is the map a security tester works from.

| Surface | The weakness | Fundamental it comes from |
|---------|--------------|---------------------------|
| **Exported components** | Activities, services, receivers, providers callable by other apps | Manifest `exported` (Section 6, 8) |
| **Implicit intents** | Interception or injection of inter-app messages | Intents (Section 14) |
| **ContentProviders** | Data exposure or SQL injection through queries | ContentProvider (Section 8) |
| **Insecure storage** | Secrets and data readable on the device | Resources, files (Section 18) |
| **Hardcoded secrets** | API keys and URLs shipped in the APK | Resources (Section 5) |
| **Cleartext traffic** | Unencrypted network communication | Secure comms (Section 19) |
| **WebViews** | XSS and native bridges in hybrid apps | App types (Section 3, 21) |
| **Debuggable / backup flags** | Debugger attachment, data extraction | Manifest (Section 6) |

This maps closely to the **OWASP Mobile Top 10**, the standard checklist for mobile testing. The point: nearly every weakness traces back to a fundamental, which is why the fundamentals come first.

---

## 17. Common Security Threats

The threat categories from the project, with what each looks like.

| Threat | What it is | Example |
|--------|-----------|---------|
| **Malware** | Malicious software that steals data, damages the system, or spies | A trojan app with a hidden keylogger or spyware payload |
| **Phishing** | Fake apps or messages that trick users into giving up credentials | A lookalike banking app, or a link to a fake login |
| **Data leakage** | Unintended exposure of personal or sensitive data | Logging tokens to Logcat, world-readable files, data in implicit intents |
| **Weak encryption** | Poorly implemented or absent encryption | Storing passwords in plaintext, using a broken cipher or a hardcoded key |

These are the same families from the *Malware Analysis* sheet, viewed from the app-design side: the goal here is to not build the weakness in the first place.

---

## 18. Insecure Data Storage

**The principle:** anything stored on the device can be read by an attacker who has the device, root, or a backup. Sensitive data must be encrypted, and most data should not be stored at all.

| Storage | Default safety | Note |
|---------|----------------|------|
| `SharedPreferences` | Plaintext XML | Readable with root/backup; use `EncryptedSharedPreferences` |
| Internal files | App-private, but not encrypted | Fine for non-sensitive data |
| External storage (SD) | **World-readable historically** | Never store sensitive data here |
| SQLite database | Plaintext on disk | Use SQLCipher for sensitive data |
| `strings.xml` / `assets/` | Shipped in the APK | Never for secrets (Section 5) |

| Do | Not |
|----|-----|
| Encrypt sensitive data at rest | Store passwords or tokens in plaintext |
| Use the Android Keystore for keys | Hardcode encryption keys in the app |
| Store the minimum necessary | Keep sensitive data you do not need |

**The Android Keystore** generates and holds keys in hardware-backed storage so the key material never enters the app's own memory, which is the right place for cryptographic keys.

---

## 19. Secure Communication

**The principle:** always encrypt network traffic between the app and the backend with **SSL/TLS**. Cleartext HTTP exposes everything to anyone on the network path.

| Control | What it does |
|---------|--------------|
| **HTTPS / TLS everywhere** | Encrypts data in transit |
| **Block cleartext** | `android:usesCleartextTraffic="false"` refuses plain HTTP |
| **Certificate pinning** | The app accepts only a known server certificate, defeating a man-in-the-middle with a rogue CA |
| **Network Security Config** | An XML file centralizing TLS rules and pins |

**Security note:** a tester checks for cleartext endpoints and for whether pinning is present. An app without pinning can be intercepted with a proxy and a trusted CA certificate during authorized testing, which exposes the full API traffic. The defense is pinning plus a strict Network Security Config.

---

## 20. Authentication

**The principle:** verify identity with strong, modern methods, and never trust the client alone.

| Method | Strength |
|--------|----------|
| **OAuth 2.0 / OpenID Connect** | Delegated auth with tokens; no password stored in the app |
| **Biometrics** (fingerprint, face) | Strong and convenient; use the `BiometricPrompt` API, gated by the Keystore |
| **MFA** | A second factor beyond the password; blocks most credential attacks |

| Do | Not |
|----|-----|
| Store tokens in the Keystore / EncryptedSharedPreferences | Store passwords on the device |
| Enforce auth server-side | Rely on a client-side check an attacker can patch out |
| Expire and rotate tokens | Use long-lived tokens that never expire |

**Security note:** client-side authentication checks can be bypassed by patching the APK or hooking with Frida. Authentication and authorization must be enforced on the **server**, because the client is fully under the attacker's control once installed.

---

## 21. Input Validation

**The principle:** treat all input as hostile — from users, from other apps via intents, from the network. Validate and sanitize it.

| Vulnerability | Where it appears | Defense |
|---------------|------------------|---------|
| **SQL injection** | ContentProvider queries, local SQLite | **Parameterized queries**, never string concatenation |
| **XSS** | WebViews in hybrid apps rendering untrusted content | Encode output; disable JavaScript unless required |
| **Path traversal** | File access from intent or network input | Canonicalize and whitelist paths |
| **Intent injection** | Data arriving via intents | Validate extras before using them |

### WebView hardening (hybrid apps)

```java
webView.getSettings().setJavaScriptEnabled(false);   // enable only if required
webView.getSettings().setAllowFileAccess(false);
```

**Security note:** `setJavaScriptEnabled(true)` combined with `addJavascriptInterface()` exposes native methods to web content. If that content is attacker-controlled (a loaded URL, an injected script), it can call into the app. Disable JavaScript unless the app genuinely needs it, and never bridge untrusted content to native code.

---

## 22. Hardening and Best Practices

The project's security objectives, consolidated.

| Practice | What to do |
|----------|-----------|
| **Secure storage** | Encrypt sensitive data; use Keystore and EncryptedSharedPreferences; store the minimum (Section 18) |
| **Strong authentication** | OAuth, biometrics, MFA; enforce server-side (Section 20) |
| **Least-privilege permissions** | Request only what is needed; explain why; handle denial (Section 15) |
| **Secure communication** | TLS everywhere, block cleartext, pin certificates (Section 19) |
| **Input validation** | Parameterize queries, sanitize all input, harden WebViews (Section 21) |
| **Minimize attack surface** | Set `exported="false"` unless a component must be public; `debuggable="false"` and `allowBackup="false"` in release |
| **Regular updates** | Ship patches promptly; dependencies have CVEs too |
| **Latest SDK** | Target a recent `targetSdkVersion` to get current security defaults |
| **Code obfuscation** | Use R8/ProGuard to slow reverse engineering (it does not stop it) |

**The two that get skipped:** regular updates and targeting the latest SDK. Both are free security wins — a current SDK turns on stricter defaults (scoped storage, cleartext blocking, stricter exported rules), and prompt patching closes known holes before they are exploited.

---

## 23. Analyzing an APK

A light security-testing pass. The deep reversing toolchain (`apktool`, `jadx`, `frida`) is covered in the *Malware Analysis* sheet; here is how it applies to app security review.

```bash
# 1. Unpack and decode the manifest and resources
apktool d target.apk -o unpacked/

# 2. Read the manifest first — permissions and exported components
grep -E "uses-permission|exported|debuggable|allowBackup" unpacked/AndroidManifest.xml

# 3. Decompile to readable Java to review logic and hunt secrets
jadx -d src/ target.apk
grep -rniE "password|api[_-]?key|secret|http://|BEGIN (RSA|PRIVATE)" src/

# 4. Install into a test device/emulator and watch behavior
adb install target.apk
adb logcat | grep -i "token\|password\|http"
```

The order mirrors the sheet: manifest (doors), then code (logic and secrets), then runtime (behavior). Everything shipped in the APK is recoverable, which is the whole reason secrets must live on the server and auth must be enforced there.

---

## 24. Fast Recall

- **Activity = the primary component** (one screen). Fragment = reusable UI part. Service = background, no UI. ContentProvider = shares data between apps. BroadcastReceiver = handles broadcasts. View = handles clicks/touches.
- **AndroidManifest.xml declares components, permissions, and metadata.** Read it first — `exported`, `debuggable`, `allowBackup`, permissions.
- **Default language Java** (Kotlin is the modern preference). **Android Studio** is the IDE, wrapping **Gradle**.
- **res/ holds resources:** `drawable/` = images/icons, `layout/` = UI XML, `values/` = strings/colors/styles.
- **Build artifacts:** APK ships to users, AAR ships to developers (carries resources), JAR is plain Java, DEX is the bytecode.
- **Lifecycle:** onCreate → onStart → onResume → onPause → onStop → onDestroy. **onExecute() is NOT real.** Blank sensitive screens in onPause().
- **Layouts:** ConstraintLayout = relative positioning (modern default), LinearLayout = row/column, FrameLayout = stacked, GridLayout = grid. `android:layout_width` sets width.
- **RecyclerView** = efficient scrollable list (recycles views); ListView is the older, simpler one.
- **Task** = the activity back stack; Back pops the top.
- **WorkManager** = periodic/conditional background jobs; JobScheduler/AlarmManager are older.
- **Intents:** explicit names the target (use for sensitive/internal); implicit describes an action (can be intercepted — no secrets in them).
- **Permissions:** normal = auto-granted, dangerous = user-granted at **runtime since API 23**. Declared in the manifest. Least privilege.
- **Logcat** (via **ADB**) is the debug/log monitor — and a common data-leakage sink.
- **Threats:** malware, phishing, data leakage, weak encryption.
- **Best practices:** encrypt storage (Keystore), strong auth (OAuth/biometrics/MFA) enforced **server-side**, TLS + cert pinning, input validation (parameterized queries), least-privilege permissions, `exported="false"`, regular updates, latest SDK.
- **Attack surface** = exported components, implicit intents, ContentProviders, insecure storage, hardcoded secrets, cleartext traffic, WebViews. Maps to the OWASP Mobile Top 10.
- **Everything in the APK is recoverable** — secrets on the server, auth on the server, obfuscation only slows reversing.

---

## 25. Resources

**Fundamentals**
- [Android Developers Documentation](https://developer.android.com/docs)
- [Android App Components](https://developer.android.com/guide/components/fundamentals)
- [Activity Lifecycle](https://developer.android.com/guide/components/activities/activity-lifecycle)

**Security**
- [OWASP Mobile Security Project](https://owasp.org/www-project-mobile-app-security/)
- [OWASP Mobile Top 10](https://owasp.org/www-project-mobile-top-10/)
- [OWASP MASVS / MASTG](https://mas.owasp.org/) — the mobile testing standard and guide
- [Android Security Best Practices](https://developer.android.com/privacy-and-security/security-tips)
- [Android Keystore](https://developer.android.com/privacy-and-security/keystore)
- [Network Security Configuration](https://developer.android.com/privacy-and-security/security-config)

**Tooling** (deep usage in the *Malware Analysis* sheet)
- [apktool](https://apktool.org/), [jadx](https://github.com/skylot/jadx), [Frida](https://frida.re/)
- [adb](https://developer.android.com/tools/adb)

**Practice**
- [DIVA / InsecureBankv2 / OWASP GoatDroid](https://mas.owasp.org/MASTG/apps/) — deliberately vulnerable apps for authorized practice
