# macOS 0.9.5 sidebar popover fix

The sidebar rings can disappear when a chat opens a visible popover elsewhere
in the window. The renderer currently treats any visible `[popover]` as a
reason to hide the rings. This patch limits plain popovers to the card or
tooltip they overlap. Native menus and dialogs retain their existing priority.
The UI version advances to 56 so a running window can replace UI 55.

The public repository does not contain the renderer source. This patch targets
`agent.cjs` from the published [v0.9.5 Beta archive][release] (ZIP SHA-256
`7f2a8256738e4d03359a028f18f265518593beed452c4b6279013976ec11ba8c`).
From the extracted archive directory, substitute the path to the patch and run:

```sh
patch --dry-run -p1 < /path/to/macos-0.9.5-sidebar-popover.patch
patch -p1 < /path/to/macos-0.9.5-sidebar-popover.patch
node --check agent.cjs
```

For an upstream release, apply the equivalent changes to the renderer source
and regenerate the package and its checksums through the usual build process.

[release]: https://github.com/Lorie7813/codex-usage-card/releases/tag/v0.9.5-beta.1
