# Scenario 2 — Realising mid-stack that a lower layer must change

> **PBI:** _As an on-call engineer, I want to be notified through my preferred channel so that I hear about incidents where I actually am._
>
> **Acceptance criteria:** notifications can be sent to email or Slack, sent in batches, and a partial batch failure is reported rather than swallowed.
>
> **Stack #9 · PRs [#6](../../../pull/6) → [#7](../../../pull/7) → [#8](../../../pull/8)**

This is the scenario that separates people who *use* stacks from people who *fight* them.

## The situation

The stack was planned as:

```
main
 └── notify-types      → PR #6
  └── notify-dispatcher → PR #7
   └── notify-api       → PR #8
```

While building `notify-api` (the top), it became clear the batch endpoint needs to pass a
**retry count** down to the dispatcher — and the dispatcher does not support retries.

## The wrong instinct

Implement retries in `notify-api`, because that is where you are standing. The consequences:

- PR #8's diff now contains dispatcher logic that has nothing to do with batching.
- PR #7 — the PR actually *about* dispatching — does not contain its own retry logic.
- The two PRs can no longer be reviewed independently, which is the only reason the stack exists.

## The right move

Go down, fix it where it belongs, and carry the change back up.

```bash
# 1. Navigate to the layer that owns the concern
gh stack down
#    ✓ Checked out notify-dispatcher, 1 branch down

# 2. Make the change there and commit it there
git add src/notifications/dispatcher.ts
git commit -m "Support retries in the dispatcher"

# 3. Replay every branch above onto the new commit
gh stack rebase --upstack
```

Output:

```
Rebasing branches in order, starting from notify-dispatcher to notify-api
✓ Rebased notify-dispatcher onto notify-types
✓ Rebased notify-api onto notify-dispatcher
```

```bash
# 4. Go back to where you were and use the thing you just built
gh stack top
git add src/notifications/api.ts
git commit -m "Expose retries through the batch send endpoint"

# 5. Push everything
gh stack submit --auto --open
```

## Why `--upstack` and not a bare `rebase`

| Command | Rebases |
|---------|---------|
| `gh stack rebase` | the whole stack, and fetches/rebases onto trunk first |
| `gh stack rebase --upstack` | the current branch and everything **above** it |
| `gh stack rebase --downstack` | trunk up to the current branch |
| `gh stack rebase --no-trunk` | branches onto each other only — no fetch, no trunk |

After a mid-stack commit, `--upstack` is what you want: only the branches above are stale.
It also avoids pulling unrelated trunk movement into the middle of your edit.

## The result on GitHub

PR #7 has two commits — the original dispatcher and the retry support. PR #8's diff shows the
batch endpoint *using* `retries`, and nothing about how retries work. Each PR still answers
exactly one question.

## Rule of thumb

> If you catch yourself writing code that "belongs" one layer down, stop. `gh stack down`,
> commit, `gh stack rebase --upstack`, `gh stack top`. It takes about fifteen seconds and it is
> the difference between a stack and three branches that happen to be chained.
