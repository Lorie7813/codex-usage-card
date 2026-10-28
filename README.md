# Codex Usage Card

**Track your Codex usage directly in the sidebar.**

Codex Usage Card is an **unofficial macOS add-on** for the Codex desktop app. It displays your remaining usage allowance as compact progress rings in the sidebar, without adding a separate app icon.

**Status:** v0.9.4 Beta public candidate · macOS only. This version has been installed and checked on one Mac: launch from the original Codex icon, automatic Ring display, usage readings and UI VERSION 53 all passed. Startup takes a few seconds longer than the previous version; this is a known experience difference. Other devices and future Codex versions remain unverified. This project is **not affiliated with or endorsed by OpenAI**.

## Features

- Remaining usage as a percentage, not context-window size or conversation tokens.
- Separate 5-hour and weekly usage rings when the account and available rate-limit data support them. Other accounts may show one ring or unavailable data.
- Reset-time details on hover or keyboard focus, when provided by the client.
- Light and dark themes, accessible focus behavior, and a compact sidebar layout.
- Automatic loading when opening Codex through its original icon **under supported startup conditions**; no separate launcher is needed.

## Requirements

- macOS and an installed, signed-in Codex desktop application with an accessible bundled Codex CLI.
- Node.js **24 or later** for the installer. The launcher checks common bundled Node locations as well as your installed Node.
- A compatible Codex desktop version. This integration uses internal interfaces that may change without notice.

> **Important:** The installer and native startup helper are not Apple-notarized. Only install software you have independently decided to trust. Verify the Release checksum; do not disable macOS system-wide security protections.

## Install (macOS)

1. After the Beta release is published, download the macOS ZIP and `SHA256SUMS.txt` from this repository's **Releases** page.
2. Verify the ZIP checksum against the separately published SHA256 value, then fully extract it:

   ```bash
   shasum -a 256 CodexUsageCard-macOS-0.9.4.zip
   ```

3. With the extracted release open, run `安装.command` (Install), or use the terminal in the folder containing `manage.cjs`:

   ```bash
   node manage.cjs install
   ```

4. Save your work, completely quit Codex with **⌘Q**, and then launch it normally using its **original icon**. Under supported conditions, the startup helper may perform **one guarded, automatic restart** to enable the local connection needed for the usage card. This may add a short delay; it must not repeatedly restart an active work session.
5. Check whether the rings appear and show valid usage data. Availability depends on your account, login environment and the desktop client.

The installer registers per-user background tasks. This candidate does **not** automatically clean up legacy shortcuts, change Dock/Launchpad configuration, restart the Dock, or move existing shortcuts during installation. Compatibility cleanup code remains packaged but is not called by the installer. It does not modify the Codex application bundle or its signature.

**Existing manual-test installations:** A previously saved observation-only setting may persist across reinstallations and prevent automatic loading. Do not repeatedly reinstall or disable safeguards to force it to work; see [macOS help](docs/macos.md).

## Manage or uninstall

Run in the extracted release directory:

```bash
node manage.cjs status
node manage.cjs uninstall
```

The status output can contain local paths, account or usage metadata, and installation details. **Remove private information before sharing it.** Uninstall stops the add-on tasks and moves relevant installed files/logs and any verified owned legacy launcher entries to the Trash; it does not uninstall Codex.

Automatic updates are **disabled** in this Beta. This candidate omits legacy update shortcuts and the old update metadata. Updater modules remain only for compatibility, locking, ownership checks and safely disabling/quarantining an owned old updater. Obtain future versions manually from this project's Releases page after publication and verify their checksums.

## Privacy and limitations

- The add-on reads rate-limit information through the local Codex CLI app-server connection and renders it in the Codex sidebar.
- The current usage agent does **not** scan your projects, request chat contents, or read the Codex conversation database. No separate telemetry upload has been identified in the reviewed add-on path. This does not describe the Codex client's own data handling.
- To display the card, the add-on uses a loopback Chrome DevTools Protocol endpoint. **Other local software may be able to access this powerful debugging interface. Never forward or expose its port.**
- Internal app-server APIs and sidebar structure can change, breaking the add-on.
- The public repository is intended for documentation and reviewed release archives, **not the full development repository**. The install ZIP nevertheless contains readable JavaScript and helper scripts necessary for operation. This macOS candidate omits the old cover image, Windows and historical development documents.

Read [Installation and troubleshooting](docs/macos.md) and [Security & privacy](SECURITY.md) before installing.

## License

Distributed under the applicable [MIT license](LICENSE). The original copyright notice and license terms are preserved in the repository and installation package. This is an independent, unofficial add-on; it is not an OpenAI product.

---

## 中文说明

**Codex Usage Card** 是一款非官方 macOS 插件，可在 Codex 桌面客户端的侧栏显示**剩余额度**。支持在相应账号数据可用时分别显示 5 小时、每周额度圆环，并提供重置时间提示。

**当前版本：v0.9.4 Beta 公开候选，仅针对 macOS 维护。** 已在一台 Mac 上实际安装，原 Codex 图标启动、Ring 自动显示、额度读取和 UI VERSION 53 均通过。启动比原版本慢几秒，记录为已知体验差异；其他设备和未来 Codex 版本未验证。

**安装方法：** 公开发布后，从本项目 Releases 下载 macOS ZIP 和 SHA256 校验信息，核对后完整解压。在解压目录运行 `安装.command`，或使用 Node.js 24+ 执行 `node manage.cjs install`。保存工作并按 **⌘Q** 退出 Codex，再点击**原来的 Codex 图标**启动。为连接本地调试接口，插件可能在符合安全条件时自动重新打开一次客户端。

**重要提醒：** 安装包未经 Apple 公证；不要关闭系统级安全防护。插件使用本机调试端口，该接口具备较高权限，请勿转发或开放给其他设备。管理器仅接受指定端口的本机 WebSocket 地址，但本机地址校验并不提供身份认证。安装不会自动清理 Dock、Launchpad 或移动旧快捷方式，也不会重启 Dock。自动更新保持禁用，包内不提供更新快捷入口。卸载可在解压目录运行 `node manage.cjs uninstall`。

本项目与 OpenAI 无官方关联；保留适用的 MIT 许可证及原始版权声明。完整细节请阅读英文说明、[LICENSE](LICENSE) 和 [安全隐私说明](SECURITY.md)。
