# Scenario 3 — Rebase conflicts, `rerere`, and life after a squash-merge

> **PBI:** _As a service owner, I want SLA breaches surfaced automatically so that I find out before the customer tells me._
>
> **Acceptance criteria:** each priority tier has a response target, breaches are detected against it, and a report counts breaches per tier.
>
> **Stack #13 · PRs [#10](../../../pull/10) → [#11](../../../pull/11) → [#12](../../../pull/12)**

## Part 1 — A real conflict, on purpose

The stack:

```
main
 └── sla-config  → PR #10   PRIORITIES + RESPONSE_HOURS
  └── sla-policy → PR #11   deadline logic, and tightens high: 4 → 2
   └── sla-report → PR #12  breach counts per tier
```

Note that **both** of the lower branches touch `RESPONSE_HOURS`. That is realistic — and it is a
conflict waiting for the next rebase.

Review then asks for an `urgent` tier. It belongs at the bottom, so:

```bash
gh stack bottom
# edit src/sla/config.ts — add "urgent" and adjust RESPONSE_HOURS
git add src/sla/config.ts
git commit -m "Add an urgent priority tier"

gh stack rebase --upstack
```

This time it stops (exit code **3**):

```
Resolve conflicts on sla-policy, then run `gh stack rebase --continue`
Or abort this operation with `gh stack rebase --abort`
```

`src/sla/config.ts` now contains:

```ts
export const RESPONSE_HOURS: Record<Priority, number> = {
  low: 72,
  normal: 24,
<<<<<<< HEAD
  high: 8,
  urgent: 1,
=======
  high: 2,
>>>>>>> a0b5d99 (Add SLA deadline policy and tighten the high-priority target)
};
```

Read the markers carefully — this is the part people get wrong:

- **`HEAD`** is the branch being rebased *onto* — the new `sla-config`, with `urgent`.
- **The bottom half** is the commit being replayed — `sla-policy`, with the tightened `high: 2`.

Both intents are wanted. Keep `high: 2` **and** `urgent: 1`:

```bash
cat > src/sla/config.ts <<'TS'
export const RESPONSE_HOURS: Record<Priority, number> = {
  low: 72,
  normal: 24,
  high: 2,
  urgent: 1,
};
TS

git add src/sla/config.ts
gh stack rebase --continue
```

```
✓ Rebased sla-policy onto sla-config
✓ Rebased sla-report onto sla-policy
```

Then push:

```bash
gh stack push
```

If you cannot untangle it, `gh stack rebase --abort` restores **every** branch to its pre-rebase state.

### Why `rerere` matters here

`git config rerere.enabled true` (set by `gh stack init`, but set it yourself to avoid a prompt)
makes git record this resolution. Stacks get rebased repeatedly — every trunk update, every
mid-stack fix. Without `rerere` you resolve the same conflict every time; with it, git replays
your resolution automatically.

### Note on PR #12

`sla-report` iterates `PRIORITIES`, so it picked up `urgent` with **no edit and no conflict**.
Putting a change in the correct layer means consumers often get it for free.

## Part 2 — Recovering after a squash-merge

> These PRs are left open in this repo so you can explore them. The commands below are what to run
> once the bottom PR is merged for real.

When PR #10 is squash-merged, its commits no longer exist in trunk history — trunk has *one* new
commit that does not match anything on your branches. A naive `git rebase` would try to replay
already-merged work and conflict against itself.

```bash
gh stack sync
```

`sync` handles it. In order, it:

1. fetches from the remote;
2. reconciles the stack on GitHub with the local one;
3. fast-forwards trunk;
4. detects that `sla-config` was merged and uses `git rebase --onto` to replay only the *remaining*
   branches on top of the new trunk;
5. force-pushes the updated branches;
6. re-syncs PR and stack state.

Expected output:

```
✓ Fetched latest changes from origin
✓ Trunk main fast-forwarded to <sha>
✓ Rebased sla-policy onto main
✓ Rebased sla-report onto sla-policy
✓ Pushed 2 branches
Merged: #10
```

Clean up the dead local branch:

```bash
gh stack sync --prune
```

In a non-interactive shell (CI, an agent) pruning **only** happens with the explicit `--prune`
flag — there is no prompt to fall back on.

Verify:

```bash
gh stack view --json | jq -r '.branches[] | "\(.name) merged=\(.isMerged) needsRebase=\(.needsRebase)"'
```

### If `sync` hits a conflict

It restores every branch to its pre-sync state and exits **3**. Nothing is pushed. Resolve it with
the `gh stack rebase` loop from Part 1, then run `gh stack sync` again.

### If `sync` reports divergence

```
⚠ Your local stack has diverged from the stack on GitHub
ℹ Sync aborted — no changes were made
```

This means the stack was restructured on GitHub while you restructured it locally. Non-interactive
shells cannot resolve it. The fix is to tear down and rebuild:

```bash
gh stack unstack --local          # drop local tracking, keep the GitHub stack intact
gh stack checkout 13              # pull the stack back down by its stack number
```

## Exit codes worth knowing

| Code | Meaning | What to do |
|------|---------|-----------|
| 2 | Not in a stack | `gh stack init` |
| 3 | Rebase conflict | Resolve, `git add`, `gh stack rebase --continue` |
| 6 | Branch is in multiple stacks | Check out a non-shared branch first |
| 7 | Rebase already in progress | `--continue` or `--abort` |
| 9 | Stacked PRs not enabled on the repo | Enable stacks on the repository |
