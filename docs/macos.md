# macOS Installation & Troubleshooting

This document applies to the **Codex Usage Card v0.9.4 Beta public candidate** (macOS), not the original project's other releases. This is an unofficial add-on, not an OpenAI product. This version has been installed and checked on one Mac: launch from the original Codex icon, automatic Ring display, usage readings and UI VERSION 53 all passed. Startup takes a few seconds longer than the previous version; this is a known experience difference. Other devices and future Codex versions remain unverified.

## Before installing

1. Install and sign in to the Codex desktop app. Its associated Codex CLI must be accessible.
2. Have Node.js 24+ available. The `.command` entry script first checks common Node executables bundled with the app, then the system-installed `node`.
3. After publication, download the exact ZIP from the **public Codex Usage Card Release**, not from another repository. Compare `shasum -a 256 <downloaded-file>.zip` with the corresponding SHA256 published separately.
4. Keep a copy of your work. The installation registers background tasks, and subsequent first launch may perform a protected restart of Codex.
5. This build has an ad-hoc-signed native helper and is **not notarized by Apple**. Do not disable macOS security globally to run it.

## Install

Fully extract `CodexUsageCard-macOS-0.9.4.zip`. Keep the extracted folder intact. Use either the included `安装.command` or, from the folder containing `manage.cjs`:

```bash
node --version
node manage.cjs install
```

The Node version must be 24 or newer if using the direct `node` command. If you previously installed in a manual-test/observation-only mode, the saved `allowClientRestart=false` setting may remain in place. Ordinary reinstall does **not** necessarily reset that safety policy. In such a case, do not change it blindly; request guidance with sanitized details.

The add-on installs into `~/Library/Application Support/CodexUsageBadge` and registers per-user Agent/Startup launch tasks. It does not patch `Codex.app`. Installation does **not** call the retained legacy cleanup code: it does not automatically change Dock/Launchpad configuration, restart Dock, or move older shortcuts. Existing legacy shortcuts remain for you to review separately.

## First launch

Save your work, quit Codex completely with **⌘Q**, and open the **original Codex icon** as normal. The helper observes new launches. If its protective conditions are met, it may request an orderly quit and relaunch Codex once with a localhost debugging endpoint, allowing the card to be injected. Existing active windows, recent user input, other instances, or cooldown may prevent a handoff. It should not forcibly terminate Codex or repeatedly grab focus.

The current implementation requires a local CDP endpoint at `127.0.0.1:39222`. Before connecting, the manager requires `ws:`, a loopback host and port `39222`; it rejects other endpoints. This interface is powerful and **not authenticated simply because it is localhost**. Do not forward, proxy or expose it.

## Inspect status

From the extracted release folder:

```bash
node manage.cjs status
```

Expected for a working installation: Agent/Startup running, usage card present, a current valid rate-limit value, and updater disabled. `UI VERSION 53` identifies the reviewed sidebar component, not the software release number. Some plans or account states may legitimately show only one ring or no available rate-limit reading.

**Privacy:** Status output can include your local account paths, account-related values and other operational details. Do not post raw output or logs publicly.

## Troubleshooting

| Symptom | First check |
| --- | --- |
| Installer says Node missing | Check Node.js 24+ or a compatible bundled executable. |
| Usage card missing after ordinary launch | Quit Codex, then launch it once normally; if still missing, inspect sanitized Startup status. Prior manual-test settings may disable automatic handoff. |
| Slow launch or repeated relaunch | Stop retrying and preserve sanitized timestamps. Avoid modifying startup settings without identifying the cause. |
| Percent missing or stale | Confirm you are signed in, network is available, and the CLI supports rate-limit data for your account. |
| Works until a Codex update | The internal app-server or renderer UI may have changed. Check the public release page for a compatible update. |
| Updater appears enabled | Do not use legacy updater commands or upstream release ZIPs. Confirm task ownership and settings before changing anything. |

## Uninstall

From the extracted release folder:

```bash
node manage.cjs uninstall
```

Uninstall stops the add-on tasks and moves its relevant installed files/logs and any verified owned legacy launcher entries to Trash. Unlike installation, this explicit uninstall may move the add-on's old owned Desktop/Applications launcher entries. It does not remove Codex. If a previously injected UI remains in a disconnected window, it should disappear when that window later exits.

## Updates

Automatic updates are intentionally **disabled** for this build. This candidate removes all legacy update shortcuts and the old `update.json`; updater modules remain for installation safety and compatibility, including disabling and quarantining a verified owned old updater. Check this project's public Releases manually after publication. Any updated package should have a fresh independently published SHA256 checksum and clear change notes.
