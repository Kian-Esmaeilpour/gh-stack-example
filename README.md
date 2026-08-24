# gh-stack-example

A deliberately small TypeScript project demonstrating **native GitHub stacked pull requests** via
the [`gh-stack`](https://github.com/github/gh-stack) CLI extension.

The code is intentionally boring. The interesting part is the *shape of the pull requests*: each
stack below is a chain of small PRs where every PR's base is the branch below it, so a reviewer
only ever sees one layer of diff at a time.

Every stack here starts from a **product backlog item**, not from a set of files — the recurring
question is "how does one PBI become four or six PRs instead of one?"

## Start here

**[docs/scenarios/00-pbi-to-stack.md](docs/scenarios/00-pbi-to-stack.md)** — how to find the layer
boundaries in a backlog item, when tests deserve their own PR, and when a stack is the wrong tool.

## Setup

```bash
gh extension install github/gh-stack
git config rerere.enabled true        # remember conflict resolutions across rebases
git config remote.pushDefault origin  # avoid the remote picker
```

## Scenarios

| # | PBI | Demonstrates | PRs | Walkthrough |
|---|-----|--------------|-----|-------------|
| 1 | Support agents track customer tickets | The happy path: `init` → `add` → `submit`, navigation, merging | [#1](../../pull/1) → [#4](../../pull/4) | [01-happy-path.md](docs/scenarios/01-happy-path.md) |
| 2 | On-call engineers get notified on their channel | Discovering mid-stack that a *lower* layer must change, and `rebase --upstack` | [#6](../../pull/6) → [#8](../../pull/8) | [02-mid-stack-change.md](docs/scenarios/02-mid-stack-change.md) |
| 3 | Service owners see SLA breaches automatically | A real rebase conflict, `rerere`, and `sync --prune` after a squash-merge | [#10](../../pull/10) → [#12](../../pull/12) | [03-conflicts-and-sync.md](docs/scenarios/03-conflicts-and-sync.md) |
| 4 | Customers see where their order is | One PBI → contract, BFF, frontend, and **separate unit-test PRs** | [#14](../../pull/14) → [#19](../../pull/19) | [04-bff-frontend-tests.md](docs/scenarios/04-bff-frontend-tests.md) |

### PR title convention

Every PR in this repo is titled:

```
[S<scenario> <layer>/<total> <slug>] <what the layer does>
     │            │       │      │
     │            │       │      └── theme, so the scenario is obvious at a glance
     │            │       └────────── how many PRs are in the stack
     │            └────────────────── this PR's position, bottom = 1
     └─────────────────────────────── scenario number (matches the table above)
```

So `[S4 3/6 bff-frontend-tests] Add unit tests for the order status BFF` reads as: scenario 4,
third of six PRs, the BFF/frontend/tests split.

This exists because the PR **list** view is where you lose the thread — GitHub shows the stack
relationship on the PR page and in the stack UI, but a flat list of sixteen PRs is unreadable
without it. The prefix also makes the list sort into coherent groups, and `x/y` tells a reviewer
where to start (always `1/y`) without opening anything.

`gh stack submit --auto` generates titles from commit subjects, so it will not produce this format
on its own — the prefixes here were applied afterwards with `gh pr edit --title`. On a real team
you would either adopt a shorter convention (many teams use just `[1/4]`) or add the prefix to the
commit subject itself so `--auto` picks it up.

### Scenario number vs. GitHub stack number

The `S1`–`S4` above are this repo's own numbering. GitHub assigns its own stack numbers, which are
what `gh stack checkout <n>` and `gh stack merge <n>` expect:

| Scenario | GitHub stack | Check it out with |
|----------|--------------|-------------------|
| S1 happy-path | #5 | `gh stack checkout 5` |
| S2 mid-stack-rebase | #9 | `gh stack checkout 9` |
| S3 conflict-recovery | #13 | `gh stack checkout 13` |
| S4 bff-frontend-tests | #20 | `gh stack checkout 20` |

They differ because GitHub numbers stacks and PRs from the same sequence.

All PRs are left **open and ready for review** so the stacks can be explored in the GitHub UI.
Each PR body states the PBI, what that layer does, what it deliberately excludes, and what to
review.

## The mental model

```
main (trunk)
 └── layer-1   → PR #1 (base: main)          ← bottom, closest to trunk
  └── layer-2  → PR #2 (base: layer-1)
   └── layer-3 → PR #3 (base: layer-2)       ← top, furthest from trunk
```

`gh stack up` / `down` move away from / toward trunk; `top` and `bottom` jump to the ends.

The one hard rule: **dependencies run downward.** If code in layer A imports code from layer B,
B must be at or below A. Foundational work (types, contracts, schema) goes low; consumers (API,
UI, wiring) go high.

## Command cheat sheet

| Task | Command |
|------|---------|
| Start a stack | `gh stack init <branch>` |
| Add a layer | `gh stack add <branch>` |
| Open/update all PRs | `gh stack submit --auto --open` |
| Inspect the stack | `gh stack view --json` |
| Move around | `gh stack up` / `down` / `top` / `bottom` |
| Replay layers above a change | `gh stack rebase --upstack` |
| Continue after a conflict | `git add <file>` then `gh stack rebase --continue` |
| Undo a rebase entirely | `gh stack rebase --abort` |
| Routine catch-up with trunk | `gh stack sync --prune` |
| Merge the stack | `gh stack merge --yes --squash` |
| Restructure (reorder/rename) | `gh stack unstack` then `gh stack init ...` |

### Non-interactive flags that are not optional

`view` without `--json` opens a TUI; `submit` without `--auto` prompts for every PR title; `init`,
`add`, and `checkout` prompt when given no argument. In scripts, CI, or agent workflows, always
pass them.

`gh pr merge` does **not** work on stacked PRs — use `gh stack merge`.
