# Scenario 4 — One PBI split across BFF, frontend, and test PRs

> **PBI:** _As a customer, I want to see where my order is so that I stop emailing support to ask._
>
> **Acceptance criteria:** the order page shows every fulfilment step, marks which have been reached, and shows an estimated delivery date when one is known.
>
> **Stack #20 · PRs [#14](../../../pull/14) → [#15](../../../pull/15) → [#16](../../../pull/16) → [#17](../../../pull/17) → [#18](../../../pull/18) → [#19](../../../pull/19)**

This is the fullest example in the repo: six PRs, three audiences, one backlog item.

## The layer breakdown

| # | Branch | Concern | Audience |
|---|--------|---------|----------|
| 14 | `order-status/contract` | Shared types both sides agree on | Everyone — this is the API design conversation |
| 15 | `order-status/bff` | Aggregation of order + shipment | Backend |
| 16 | `order-status/bff-tests` | Backend behaviour as a spec | Backend / QA |
| 17 | `order-status/web` | Presentation | Frontend |
| 18 | `order-status/web-tests` | Frontend behaviour as a spec | Frontend / QA |
| 19 | `order-status/wire-up` | Connects the two halves | Whoever owns the feature |

Written as one PR this is roughly **+640 / -12 across 9 files** — one review, six concerns,
and the contract buried in the middle where nobody argues with it.

## Why this split

**Contract first.** The BFF and the component both depend on `OrderStatusView`, and neither depends
on the other. Landing the shape first means the expensive disagreement ("should `steps` be a map or
an array?") happens in a 20-line PR instead of on line 400 of a large one.

**BFF and frontend separate.** Different reviewers. A frontend reviewer opening PR #17 sees
presentation code and nothing else — no aggregation logic in the diff to skim past. This also
mirrors how the work is usually assigned: the two layers could be built by different people in
parallel, both against the contract in PR #14.

There is a cost to be honest about. A stack is **strictly linear** — one parent, one child — so
even though `order-status/web` depends only on the contract, it sits above the BFF and its tests
and cannot merge until they do. Work that is genuinely independent gets serialised. If the
frontend needs to ship on its own schedule, give it a **separate stack** rooted on the contract
branch (or on trunk once the contract has merged) rather than forcing it into this one.

**Tests as their own PRs.** PRs #16 and #18 contain only test files. The upside: the
implementation PR stays readable, and the test PR reads as an executable statement of expected
behaviour that reviewers can argue with on its own terms.

The trade-off is real, and worth stating: PR #15 lands without its tests, so between #15 and #16
the trunk-ward end of the stack has untested code. If your CI gates coverage per PR, or if the
tests are the main evidence the implementation is correct, keep them together instead. See
[00-pbi-to-stack.md](00-pbi-to-stack.md#should-tests-really-be-their-own-pr) for when each is right.

**Wiring last and tiny.** PR #19 is eight lines. Every other layer is independently reviewable but
invisible to users; this one is user-visible and almost empty. Integration risk ends up
concentrated in a diff you can read in ten seconds rather than diffused through a large PR.

## Walkthrough

```bash
gh stack init order-status/contract
git add src/orders/contract.ts package.json
git commit -m "Add order status contract shared by BFF and web"

gh stack add order-status/bff
git add src/orders/bff.ts
git commit -m "Add BFF aggregation for order status"

gh stack add order-status/bff-tests
git add src/orders/bff.test.ts
git commit -m "Add unit tests for the order status BFF"

gh stack add order-status/web
git add src/web/components/OrderStatusTracker.ts
git commit -m "Add order status tracker component"

gh stack add order-status/web-tests
git add src/web/components/OrderStatusTracker.test.ts
git commit -m "Add unit tests for the order status tracker"

gh stack add order-status/wire-up
git add src/web/orderStatusPage.ts
git commit -m "Wire the order status page end to end"

gh stack submit --auto --open
```

Branch names with slashes are used verbatim — `gh stack add order-status/bff` creates exactly
`order-status/bff`. Nothing is prefixed or transformed.

## Reviewing a stack like this

Reviewers should start at the **bottom**. A comment on PR #14 that changes the contract is cheap;
the same comment on PR #19 invalidates five PRs. If your team habitually reviews whatever is green
first, a stack this deep will cost more in rebases than it saves in clarity — that is a signal to
use shallower stacks, not a flaw in the tool.

## Merging

```bash
gh stack merge --yes --squash        # all six, bottom to top, atomically
gh stack merge 16 --yes --squash     # or land the backend half first: #14, #15, #16
```

Landing the backend half and continuing to iterate on the frontend layers is a common and
legitimate pattern. After that partial merge, run `gh stack sync --prune` to rebase the remaining
frontend branches onto the new trunk and drop the merged local branches.

If the base branch uses a **merge queue**, the stack is added to the queue instead of merging
directly. The queue picks the merge method (anything you pass is ignored with a warning), and the
PRs may land in separate groups rather than all at once.
