# Changelog

## v0.9.4 Beta — first public candidate (macOS)

- Usage-only sidebar card with remaining-rate-limit ring(s); separate 5-hour and weekly rings when the rate-limit response supports them.
- Light/dark theme, keyboard focus and tooltips. UI component version: 53.
- Protected original-icon launch handoff, including a fix to allow a single hidden relaunch after a successful guarded quit even when subsequent input prevents focus stealing.
- This version has been installed and checked on one Mac: launch from the original Codex icon, automatic Ring display, usage readings and UI VERSION 53 all passed. Startup takes a few seconds longer than the previous version; this is a known experience difference. Other devices and future Codex versions remain unverified.
- Manager CDP connections now require the WebSocket protocol, a loopback host and the expected debugging port.
- Installation no longer calls legacy launcher cleanup: no automatic Dock/Launchpad changes, Dock restart or shortcut moves. Compatibility cleanup code is retained.
- No active auto-update mechanism; legacy update shortcuts and old update metadata are omitted. Safety migration modules are retained. Future updates require a manually obtained and checked package.
- Public English/Chinese documentation and the original MIT license are included; the old cover, Windows and historical development documents are omitted.
- No project size, folder-color or conversation-token feature in the current usage-only agent.

**Compatibility and security:** Not Apple-notarized. Uses a local debugging interface with significant privileges. See [SECURITY.md](SECURITY.md).

The applicable MIT license and original copyright notice are preserved in [LICENSE](LICENSE).
