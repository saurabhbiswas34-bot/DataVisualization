# Wealth Tracker

Intended upstream: [github.com/spatil00/wealthtracker](https://github.com/spatil00/wealthtracker).

## Why this folder is empty

1. **Upstream clone:** That URL cannot be cloned from this environment (GitHub responds as if the repository does not exist or is private). Public repositories under `spatil00` at last check were: `DeepSeek-V3`, `technical-discussion`, `Test`, and `tools-python` — there was no public `wealthtracker` repository.

2. **Separate GitHub repo:** The automation token here only has access to **`saurabhbiswas34-bot/DataVisualization`** (this repository). It cannot create a new GitHub repository or push to `saurabhbiswas34-bot/wealthtracker` until that repo exists **and** the same GitHub App / integration is granted access to it.

## What you can do locally

After you create **`https://github.com/saurabhbiswas34-bot/wealthtracker`** on GitHub and grant your Cursor/GitHub integration access to it (or use a personal access token with `repo` scope):

```bash
# One-time: populate this folder from the real upstream once you have a working URL
./wealthtracker/sync-from-upstream.sh 'https://github.com/spatil00/wealthtracker.git'

# Push this folder to the new repository (from repo root)
git subtree split --prefix wealthtracker -b wealthtracker-split
git push https://github.com/saurabhbiswas34-bot/wealthtracker.git wealthtracker-split:main
```

Or mirror the upstream directly without this folder:

```bash
git clone --mirror <upstream-url>
cd wealthtracker.git
git remote set-url origin https://github.com/saurabhbiswas34-bot/wealthtracker.git
git push --mirror
```
