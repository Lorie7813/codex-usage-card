# Windows sidebar-ring preview

Community Windows port of the v0.9.4 Beta release agent. This is an experimental contribution for upstream review, not an official Windows release.

## Requirements and start

- Windows 10/11, Microsoft Store Codex installed and signed in.
- Node.js 24+ on PATH. No npm dependencies.
- Keep this folder together. Save work and fully quit Codex, then run `node windows.cjs start` or `Start.cmd`.
- Hover or keyboard-focus the left rail rings for remaining quota, reset times and available reset cards. Start refuses to interrupt an existing Codex session. The original app icon does not enable the debugging connection.
- `node windows.cjs status` reports current placement. Normal visible main window: `placed=true`, `badgeCount=1`, `stale=false`.
- `node windows.cjs stop` stops the owned monitor/agent and removes the rings without closing Codex. Fully quit Codex and reopen from its original icon to close the debugging endpoint. Remove any login shortcut before deleting this folder.

## Optional sign-in startup

Run `node autostart.cjs` from a current-user Windows sign-in task or shortcut. The entry detects already placed rings and skips them, attaches to an existing compatible local debugging endpoint, or starts Codex through the launcher. Registering a shortcut is opt-in and must use the user's installed Node path; no machine-specific shortcut is included. `Start.cmd` is interactive and should not be used as a silent login task. Fully automatic sign-in startup has not been reboot-tested.

## Privacy and compatibility

The original app-server quota reader and sidebar renderer are included from `CodexUsageCard-macOS-0.9.4.zip` (published SHA-256 `e41cbb00fd01b785eb0cac73a946115a35dd2d9a2410c196ec7287ce4b1737f8`). Windows defaults retain 60-second active polling, the 5-second checking interval and `account/rateLimits/updated` notifications. No extra last-sync text is rendered.

When the CLI omits reset-card fields, `reset-credits.cjs` reads the current `CODEX_HOME/auth.json` (default `~/.codex/auth.json`) and sends a read-only authenticated GET to `https://chatgpt.com/backend-api/wham/rate-limit-reset-credits`. This is an undocumented endpoint. Credentials are not logged, exported or sent to third parties; redirects are rejected. Failures display unavailable rather than zero cards. This fallback expands on the macOS release's app-server-only data path and needs upstream review.

The launcher uses CDP on `127.0.0.1:39222`. Local software can access this powerful interface; do not forward or expose it. Application packages, login files and Codex settings are not modified. No automatic updater, forced restart or system-wide security-policy change is included. Logs and status output may reveal local paths and quota metadata; redact before sharing.

## Validation and limitations

`node --test windows.test.cjs` runs offline tests. On one Windows machine with Codex `26.1023.6621.0`, sidebar placement, hover details, one badge per visible rail, real quotas, reset-card fallback, refresh timestamp advancement and stop/reattach were checked. Login entry duplicate detection was smoke-tested; a real reboot was not performed. Other versions, account switching, concurrent launcher races, long-term reconnect behavior and non-Store installations are not verified. A temporary local endpoint failure currently stops the monitor; restarting the launcher may be necessary.

The public repository does not contain the full development/build tree, so this directory includes the readable release agent as its baseline. Maintainers may prefer integrating these changes into their private source/build pipeline. The repository MIT license and original copyright apply.
