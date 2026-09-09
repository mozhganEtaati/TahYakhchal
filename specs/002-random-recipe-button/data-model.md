# Phase 1 Data Model: Random Recipe Button

**Feature**: `002-random-recipe-button` | **Date**: 2026-09-09

Nothing here is persisted. Every entity lives in one request (server) or one visit (client),
per FR-109 and Constitution Principle III. The one exception is a dish the user explicitly
saves, which goes through feature 001's existing FR-013a store unchanged.

## Entities

### RandomDishRequest (request body)

One press of the control.

| Field | Type | Rules |
|---|---|---|
| `seenTitles` | `string[]` | Titles already shown this visit, to be avoided. Optional; defaults to `[]`. Each entry non-empty after trim and ≤ 120 characters. The server accepts at most 40 entries and ignores the rest. |

- Carries no photos and no ingredient pool. The FR-008 two-ingredient floor does **not** apply
  to this flow.
- Anything the user has entered on the home screen is deliberately not sent (FR-110).

### RecipeSuggestion (reused, unchanged)

Defined by feature 001 in `lib/schema.ts`. A random dish is exactly this — that reuse is what
makes FR-102 and SC-107 true rather than aspirational.

| Field | Type | Rules |
|---|---|---|
| `title` | `string` | Persian, non-empty after trim. |
| `ingredients` | `string[]` | Names only, no quantities. Minimum 1 (FR-107). |
| `steps` | `string[]` | Ordered Persian instructions. Minimum 2, each non-empty after trim (FR-107). |

A reply failing any of these rules is a failure, not a partial card — the same
`recipeSuggestionSchema` that guards feature 001 enforces it here.

### SeenTitles (client, visit-scoped)

The titles shown so far in this visit.

| Property | Value |
|---|---|
| Lives in | `lib/session.tsx` context, alongside photos and the ingredient list |
| Written | After each successful random dish, appending its title |
| Cleared | On reload or navigation away from the app — never stored (FR-109) |
| Sent | With every subsequent request, capped at the 40 most recent |

### RandomResult (response)

A discriminated union, identical in shape to feature 001's response so the client handles both
the same way.

| Variant | Shape | Meaning |
|---|---|---|
| success | `{ ok: true, recipe: RecipeSuggestion }` | One validated dish. |
| failure | `{ ok: false, code: ErrorCode }` | `TIMEOUT` or `SERVICE_ERROR` only. |

Note the success field is `recipe` (singular), not `recipes` — this endpoint returns exactly
one dish by definition, and a one-element array would invite the client to render a list.

## Client UI state

The random control is a small state machine inside the home screen, independent of the photo
and ingredient state around it.

```text
idle ──press──> processing ──success──> shown ──press again──> processing
                    │                              │
                    └──failure/timeout──> error ────┘
```

- `processing` disables the control, so a second press is ignored rather than queued (FR-105).
- Entering `shown` appends the dish title to `SeenTitles`.
- Reload returns everything to `idle` with no dish and an empty `SeenTitles` (FR-109).
- None of these transitions touch the photo or ingredient state (FR-110).

## Validation summary

| Rule | Where enforced |
|---|---|
| `seenTitles` well-formed, ≤ 40 entries honored | Route handler |
| Reply matches the recipe schema | Route handler, `recipeSuggestionSchema` — the same one feature 001 uses |
| At least 1 ingredient and 2 steps | Same schema; a failure below this becomes `SERVICE_ERROR`, never a partial card (FR-107) |
| Not a title already seen | Requested via the prompt's exclusion list; a repeat is tolerated once the pool is exhausted, per the spec's edge case |
| 30-second ceiling | Route handler `AbortController` and the client `fetch` guard, reused from feature 001 |
| All text Persian | Prompt instruction plus the non-empty checks; button and state copy live in `messages/fa.ts` |
