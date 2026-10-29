# Verify a downloaded macOS ZIP before running it

The independent verifier is a single Python 3 script using only the standard library. It checks a local file against the **exact GitHub Release asset** in **`Lorie7813/codex-usage-card`**. It never extracts or executes the ZIP, starts Codex, installs anything, or enables updates.

## Obtain the verifier independently

**Do not use a verifier taken from the ZIP to prove that same ZIP's origin.** Obtain and review the script separately through the known repository over HTTPS, ideally at a reviewed immutable commit. A checksum or repository label inside an untrusted ZIP is not independent evidence.

The standalone verifier is available separately in this public repository at [scripts/verify_release.py](../scripts/verify_release.py). Obtain and review it over HTTPS independently of any installation ZIP. For reproducibility, pin to a reviewed commit instead of relying on a moving branch. The commands below assume the verifier was saved to `scripts/verify_release.py`.

## Online check

For example, to check the existing v0.9.4 Beta download:

```bash
python3 scripts/verify_release.py \
  --zip ./downloads/CodexUsageCard-macOS-0.9.4.zip \
  --tag v0.9.4-beta.1 \
  --asset CodexUsageCard-macOS-0.9.4.zip
```

Use the exact published tag and asset filename for another version. The tool does not select `latest`, fall back to another repository, follow metadata redirects, or trust ZIP-supplied metadata. The optional `--repo` argument can only repeat the fixed trusted repository; it cannot select another source. Add `--json` for machine-readable output.

| Result / exit code | Meaning |
| --- | --- |
| `VERIFIED` / `0` | Repository, published tag, asset identity, byte size and GitHub SHA256 digest match the local bytes. Output includes the repository, tag, asset and digest. |
| `REJECTED` / `1` | A deterministic mismatch or invalid input was found, including missing tag, missing/ambiguous asset, invalid metadata/digest or changed bytes. Do not run the ZIP. |
| `UNVERIFIED` / `2` | Network/API verification is unavailable, or the check is offline. This is not success. Obtain independent evidence before trusting the download. |

GitHub's published asset metadata is the trust reference. A match does **not** independently authenticate the publisher if the GitHub account, repository or verifier itself has been compromised. It is not malware analysis, compatibility testing, Apple signing or notarization verification.

The local file is rechecked after the network lookup; changes during verification are rejected. Keep the verified file unchanged before using its contents.

## Offline integrity only

If an expected digest was independently obtained through a trusted channel:

```bash
python3 scripts/verify_release.py \
  --zip ./downloads/CodexUsageCard-macOS-0.9.4.zip \
  --tag v0.9.4-beta.1 \
  --asset CodexUsageCard-macOS-0.9.4.zip \
  --offline --sha256 YOUR_INDEPENDENTLY_OBTAINED_SHA256
```

A matching offline digest reports `integrity: MATCH` but still returns **`UNVERIFIED` / exit `2`** for provenance. Without that digest, it only reports the local hash. A mismatch is rejected. A digest bundled with the same untrusted ZIP is not an independent trust source.

Normal installation remains possible without contacting GitHub; the installer does not call this verifier or claim that a skipped source check passed. Automatic updates remain disabled. Do not disable system-wide macOS security protections.

## 中文简要说明

先从独立可信的仓库检出取得并审阅 `scripts/verify_release.py`，不要运行 ZIP 内自带脚本来证明该 ZIP 的来源。独立校验器已单独发布于本公开仓库的 `scripts/verify_release.py`，请从仓库中独立获取并审阅，不要从待检查的 ZIP 中获取。按上面的命令指定本地 ZIP、准确的 Release tag 和附件名；成功只表示本地字节与指定 GitHub 附件一致，不保证发布账号未被攻陷。网络不可用或离线时会明确返回 `UNVERIFIED`，不能当作通过。安装器不会强制联网，自动更新仍关闭。
