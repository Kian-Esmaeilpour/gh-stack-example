# Turning a PBI into a stack instead of one big PR

The habit worth building is this: when you pick up a backlog item, ask **"what are the layers?"**
before you ask "what files do I touch?" A PBI is a unit of *value*. A PR is a unit of *review*.
They are almost never the same size.

## The default (one PR)

```
PBI: "As a customer, I want to see where my order is."
 └── PR #1  +640 / -12 across 9 files
             contract + BFF + BFF tests + component + component tests + wiring
```

One reviewer, one sitting, six concerns. In practice this gets a 👍 and a "looks good to me"
because the alternative is an hour of work. The contract — the part that is most expensive to
get wrong and cheapest to change — gets the least attention, because it is buried on line 400.

## The same PBI as a stack

```
main
 └── order-status/contract    → PR #14   the shape both sides agree on
  └── order-status/bff        → PR #15   aggregation logic
   └── order-status/bff-tests → PR #16   backend behaviour as a spec
    └── order-status/web      → PR #17   presentation only
     └── order-status/web-tests → PR #18 frontend behaviour as a spec
      └── order-status/wire-up  → PR #19 the ten-line diff that ships it
```

Each PR is a diff a reviewer can hold in their head. The contract gets its own conversation.
Frontend reviewers never scroll past aggregation code. And the risky integration step is a
ten-line diff at the top rather than being invisible inside a 640-line one.

## How to find the layer boundaries

Ask these in order. Every "yes" is a branch boundary.

1. **Does anything else need to agree with this before it can be built?** → that agreement is the bottom layer (types, schema, API contract, migration).
2. **Does the reviewer audience change?** → BFF and frontend are different PRs even when written by the same person.
3. **Is this a statement of behaviour rather than behaviour itself?** → tests can be their own layer.
4. **Is this the step that makes it user-visible?** → keep it last and keep it tiny.

The one hard rule: **if code in layer A imports code from layer B, B must be at or below A.**
Dependencies run downward. A stack cannot express "these two need each other."

## Should tests really be their own PR?

Sometimes. This repo demonstrates it in stack 4 (PRs #16 and #18) because it is a pattern people
ask about, not because it is always right.

**It works well when:** the implementation is large enough that mixing tests in doubles the diff;
a different person or role reviews test quality; or you want the test PR to read as an
executable spec that can be argued with independently.

**Prefer tests alongside the code when:** the change is small; the tests are the main evidence
the implementation is correct (splitting them means PR *n* is unreviewable without PR *n+1*);
or your CI gates on coverage per PR.

A reasonable middle ground: keep the tests that *prove the layer works* with the layer, and split
out only broad integration or contract test suites.

## When a stack is the wrong tool

- **The work is genuinely one concern.** A two-line bug fix does not need three PRs.
- **The layers need each other.** Stacks are strictly linear — one parent, one child. Mutually dependent work belongs in one PR.
- **Nobody will review it in order.** A stack only pays off if reviewers start at the bottom. If your team merges whatever is green first, the rebases will cost more than the review clarity saves.
