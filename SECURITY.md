# Security & Privacy

Codex Usage Card is an **unofficial macOS add-on**. This page describes the **v0.9.4 Beta public candidate**, not a security guarantee for every computer, package, or future Codex release. This version has been installed and checked on one Mac: launch from the original Codex icon, automatic Ring display, usage readings and UI VERSION 53 all passed. Startup takes a few seconds longer than the previous version; this is a known experience difference. Other devices and future Codex versions remain unverified. The add-on has **not been Apple-notarized**.

## What it accesses

- The current agent requests rate-limit data from the local Codex CLI **app-server** through a standard-input/output connection. The CLI may make its own authenticated network requests.
- The add-on does not ask you to paste API keys, session cookies, or access tokens. It depends on your existing Codex login environment, which must remain private.
- The reviewed usage-only agent does not scan local projects, request chat contents, or read Codex conversation SQLite databases. Legacy source modules for unrelated features are not part of the current agent build.
- No independent analytics/telemetry upload has been identified in this reviewed add-on code path. This statement does **not** cover the Codex application or unrelated software.
- Rate-limit data can contain account-related metadata and should not be shared unredacted.

## Local debugging port: important risk

The card is injected via Chrome DevTools Protocol using `127.0.0.1:39222`. The manager accepts only `ws:` URLs with a loopback host and the expected port `39222` before opening a connection. Debugging endpoints can evaluate JavaScript inside app windows, so they can provide access beyond usage statistics. Binding to the local computer does **not** provide authentication or isolation from other local processes. **Never forward this port to another device or network.** Do not run untrusted local software while relying on this protection alone.

## What installation changes

The installer copies files into your user application-support directory and registers per-user background LaunchAgents. It does not change files inside the signed Codex application bundle. The startup helper monitors application launch state and limited system input activity **counts/timestamps**, not keystroke text or screenshots. In strictly guarded circumstances it may request one orderly quit and hidden relaunch of a newly opened Codex process to enable the local debugging endpoint. No forced termination should be used if a quit is refused.

**Installation boundary:** the installer does not call legacy launcher cleanup. It does not automatically modify Dock/Launchpad configuration, restart Dock, or move old shortcuts. Compatibility cleanup code remains in the package but is not invoked by installation. Existing shortcuts are left in place during installation. Explicit uninstall can move verified owned legacy add-on launcher entries to Trash, alongside the add-on's installed files/logs.

The native helper is ad-hoc signed, **not Apple-notarized**. The add-on relies on internal application interfaces and may stop working when Codex changes.

## Updates and local files

Automatic update execution remains disabled. This candidate omits legacy update shortcuts and the old `update.json`. Updater modules are retained for compatibility, installation locking, ownership checks, and safely disabling/quarantining a verified owned old updater. Their presence does not enable updates. Download future versions manually only after verifying their source and checksums.

Operational files and logs may reside in `~/Library/Application Support/CodexUsageBadge`, `~/Library/LaunchAgents`, `~/Library/Logs`, and `~/Library/Caches`. Some may reveal local paths, launch details or usage metadata. **Do not share them without careful redaction.**

## Reporting a problem

Do not post credentials, user paths, raw `status` outputs, chat content, account identifiers, full debug logs or unreviewed screenshots in public Issues. For security-sensitive reports, use GitHub's private vulnerability reporting feature **if enabled**. If unavailable, provide only a non-sensitive summary publicly and request a private reporting channel.

## Distribution and licensing

The public repository may contain documentation and a release archive without hosting the complete development source tree. **The release archive itself includes human-readable JavaScript and helper scripts** needed for operation, and should not be considered opaque or private. Applicable MIT license and copyright statements are included.
