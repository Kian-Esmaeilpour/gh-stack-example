# gh-stack-example

A deliberately small TypeScript project used to demonstrate **native GitHub stacked pull requests**
via the [`gh-stack`](https://github.com/github/gh-stack) CLI extension.

The code here is intentionally boring. The interesting part is the *shape of the pull requests*:
each stack below is a chain of small PRs where every PR's base is the branch below it, so reviewers
only ever see one layer of diff at a time.

## Setup

```bash
gh extension install github/gh-stack
git config rerere.enabled true        # remember conflict resolutions
git config remote.pushDefault origin  # avoid the remote picker
```

## Scenarios

| # | Stack | What it demonstrates | Walkthrough |
|---|-------|----------------------|-------------|
| 1 | Ticket store feature | The happy path: a layered feature split into 4 reviewable PRs | [docs/scenarios/01-happy-path.md](docs/scenarios/01-happy-path.md) |
| 2 | Search & filtering | Discovering mid-stack that a lower layer must change, then `rebase --upstack` | [docs/scenarios/02-mid-stack-change.md](docs/scenarios/02-mid-stack-change.md) |
| 3 | Priority & SLA | Rebase conflicts, `rerere`, and recovering after a squash-merge with `sync --prune` | [docs/scenarios/03-conflicts-and-sync.md](docs/scenarios/03-conflicts-and-sync.md) |

## The mental model

```
main (trunk)
 └── layer-1   → PR #1 (base: main)          ← bottom, closest to trunk
  └── layer-2  → PR #2 (base: layer-1)
   └── layer-3 → PR #3 (base: layer-2)       ← top, furthest from trunk
```

`gh stack up` / `down` move away from / toward trunk. `top` and `bottom` jump to the ends.
Foundational code (types, storage) belongs in **lower** branches; consumers (API, UI, tests)
belong in **higher** ones.
