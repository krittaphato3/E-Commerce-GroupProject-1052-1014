# Omazon — CR-01 Contract Review (teammate)

| Item | Value |
|---|---|
| Document | `docs/labs/lab-07/CR-01-contract-review.md` |
| Change request | CR-01, CHG-07, Issues [#76](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/issues/76), [#77](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/issues/77) |
| Branch | `docs/CR-01-contract` → `sprint-3-staging` |
| Status | **Not reviewed** |

The teammate who did not write the revision completes this sheet **before implementation (#78) starts**, through the contract pull request, with substantive comments and not only an approval. The author leaves every field below blank.

## Reviewer record

| Field | Value |
|---|---|
| Reviewer name | |
| Review date | |
| Reviewed commit | |
| Pull request | |

## Checklist

Mark each line `OK`, `Change needed` or `N/A`.

| # | Question | Result | Comment |
|---|---|---|---|
| 1 | Is the rule right, including the table for stock 12, 10, 8, 4, 3, 2, 1 and 0 (DEC-58)? | | |
| 2 | Is putting the cap inside the single `UPDATE` race-free under the stated assumptions, with the lock order kept (DEC-59, System SDS §9.2)? | | |
| 3 | Is the error precedence right, including TEST-22, 400 for 6 or more on a sold-out item, and the case where stock rises before the error read (DEC-60)? | | |
| 4 | Are the error shape acceptable (`itemId` here, `menuItemId` in `ITEM_UNAVAILABLE`) and the message wording? | | |
| 5 | Is one pure function plus a SQL copy, compared through behaviour, enough (DEC-61, TEST-160)? | | |
| 6 | Is `maxOrderQuantity` right for sold-out and disabled items and for Operator responses (DEC-62)? | | |
| 7 | Is the UI behavior right, including the fallback of 5 and clamping only the named line (DEC-63)? | | |
| 8 | Is it acceptable to keep the `CHECK` 1..10, with no database enforcement of the new limit and an untested no-migration conclusion (DEC-64)? | | |
| 9 | Is the several-orders limitation acceptable (DEC-65)? | | |
| 10 | Is the E2E chunk arithmetic correct, and is it acceptable that the journey may not exercise it (DEC-66)? | | |
| 11 | Do AC-10 (revised), AC-18 (revised) and AC-148 to AC-160 have clear inputs and results, and does each have a test? | | |
| 12 | Is every listed old test change a real requirement change, with no assertion removed or loosened? Is any affected test missing? | | |
| 13 | Are AC-19, TEST-19, BR-03, BR-05, BR-07 and R-01 preserved (impact analysis §3)? | | |
| 14 | Is the original Sprint 1 text still readable, with old and new values named? | | |
| 15 | Do status labels say proposed, not implemented and `NOT RUN`, with no new `PASS`? | | |
| 16 | Are the open questions in the pull request description answered? | | |

## Findings

| # | Finding | Severity | Resolution (commit or reply) |
|---|---|---|---|
| | | | |

## Verdict

| Field | Value |
|---|---|
| Verdict (`Approve` / `Changes required`) | |
| Conditions before #78 starts | |
