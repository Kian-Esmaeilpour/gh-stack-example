# Scenario 1 — The happy path: one PBI, four reviewable PRs

> **PBI:** _As a support agent, I want to track customer tickets so that nothing gets lost between shifts._
>
> **Acceptance criteria:** tickets can be created with a title, listed, fetched by id, and closed.
>
> **Stack #5 · PRs [#1](../../../pull/1) → [#2](../../../pull/2) → [#3](../../../pull/3) → [#4](../../../pull/4)**

## The layer breakdown

| Branch | PR | Concern | Why it is its own layer |
|--------|----|---------|-------------------------|
| `ticket-types` | #1 | Domain types | Everything above is written against this shape — argue about it here, where it is free to change |
| `ticket-store` | #2 | In-memory persistence | Pure module, no HTTP; reviewable without a server |
| `ticket-api` | #3 | Route handlers | Different concern: status codes and validation |
| `ticket-cli` | #4 | CLI shim | The user-visible layer; makes the PBI demonstrable |

Note the dependency direction: `cli` imports `api` imports `store` imports `types`. Nothing points
upward. That is what makes the chain rebasable.

## Walkthrough

```bash
# One-time setup so nothing prompts
git config rerere.enabled true
git config remote.pushDefault origin

# 1. Start the stack with the bottom layer
gh stack init ticket-types
#    → creates the branch and checks it out

# 2. Write and commit that layer with ordinary git
git add src/tickets/types.ts
git commit -m "Add Ticket domain types"

# 3. Each new concern gets a new layer
gh stack add ticket-store
git add src/tickets/store.ts
git commit -m "Add in-memory ticket store"

gh stack add ticket-api
git add src/tickets/api.ts
git commit -m "Add ticket HTTP route handlers"

gh stack add ticket-cli
git add src/tickets/cli.ts
git commit -m "Add tickets CLI shim"

# 4. Push all four branches and open all four PRs, correctly based on each other
gh stack submit --auto --open
```

Output:

```
✓ Created PR #1 for ticket-types
✓ Created PR #2 for ticket-store
✓ Created PR #3 for ticket-api
✓ Created PR #4 for ticket-cli
✓ Stack created on GitHub with 4 PRs (stack #5)
```

`--auto` generates PR titles from commit subjects (required — without it `submit` prompts per PR).
`--open` opens them ready for review; omit it to get drafts.

## Inspecting and navigating

```bash
gh stack view --json | jq -r '.branches[] | "\(.name)\t#\(.pr.number)\t\(.pr.state)"'

gh stack bottom     # jump to ticket-types
gh stack up 2       # → ticket-api
gh stack top        # → ticket-cli
gh stack down       # → ticket-api
```

Always pass `--json` to `view`. Without it you get an interactive TUI.

## Merging the stack

`gh pr merge` does **not** work on stacked PRs. Use:

```bash
gh stack merge --yes --squash          # merges the whole stack, bottom to top, atomically
gh stack merge 2 --yes --squash        # merges only up to and including PR #2
```

The merge is all-or-nothing: if any PR cannot be merged, none are.

## What to look at on GitHub

Open PR #3. The diff contains `api.ts` **only** — not the store or the types, even though the branch
technically contains all of them. That is the entire point: the base is `ticket-store`, so the diff
is one layer deep.
