# Project agent skills

## Greptile (PR review)

Upstream: [greptileai/skills](https://github.com/greptileai/skills) (vendored at `greptile/` via git submodule).

| Skill | Invoke when |
|-------|-------------|
| [check-pr](check-pr/) | Triage a PR: unresolved review comments, failing checks, incomplete description; fix and resolve. |
| [greploop](greploop/) | Loop Greptile review → fix → re-review until 5/5 confidence and zero comments. |

**Requirements:** `git` and [`gh`](https://cli.github.com) authenticated (`gh auth login`). This repo uses GitHub.

**Update vendored skills:**

```bash
git submodule update --remote .cursor/skills/greptile
```

**Fresh clone:** run `git submodule update --init --recursive` after `git clone`.
