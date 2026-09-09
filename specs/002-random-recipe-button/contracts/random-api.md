# Contract: Random Dish API

**Feature**: `002-random-recipe-button` | **Date**: 2026-09-09

A second endpoint alongside feature 001's `POST /api/suggest`. Under Constitution Principle IV
this is an **addition**: `/api/suggest` keeps its exact request shape, response shape, and
meaning, and every existing consumer of it continues to work untouched.

## `POST /api/random`

Returns one random Persian dish. Stateless: no cookies, no session, no auth, nothing stored.

### Request

**Content-Type**: `application/json`

```json
{ "seenTitles": ["قورمه سبزی", "کوکو سبزی"] }
```

| Field | Required | Constraints |
|---|---|---|
| `seenTitles` | No — defaults to `[]` | Array of strings. Each non-empty after trim, ≤ 120 characters. At most 40 entries are honored; extras are ignored rather than rejected. |

A body that is absent, empty, or `{}` is valid and means "no exclusions". A malformed body
(not JSON, or `seenTitles` not an array of strings) is rejected as `SERVICE_ERROR`.

No photos, no ingredients, no other fields are read. Unknown fields are ignored.

### Response

**Content-Type**: `application/json`. Always a JSON body, including on failure.

**200 — success**

```json
{
  "ok": true,
  "recipe": {
    "title": "میرزا قاسمی",
    "ingredients": ["بادمجان", "گوجه‌فرنگی", "سیر", "تخم‌مرغ"],
    "steps": ["بادمجان‌ها را کباب کنید.", "..."]
  }
}
```

- Exactly one recipe, under the singular key `recipe`. Never an array, never zero, never two.
- `recipe` is the same `RecipeSuggestion` shape feature 001 returns inside its `recipes` array,
  which is what lets the same card render it and the same store save it.
- Every string is Persian. `steps` is ordered; render order is array order.

**Failure** — same shape as feature 001, drawn from the same `ErrorCode` set:

```json
{ "ok": false, "code": "SERVICE_ERROR" }
```

| `code` | HTTP status | Cause |
|---|---|---|
| `TIMEOUT` | 504 | The 30-second ceiling expired |
| `SERVICE_ERROR` | 502 | Transport failure, upstream error, malformed request body, unparseable reply, a dish failing validation, or a missing API key |

`INVALID_UPLOAD`, `NO_INGREDIENTS`, and `NO_RECIPES` are **never** returned here — there is no
upload and no ingredient floor in this flow.

### Invariants

1. The body is never both `ok: true` and carrying an error, and never neither.
2. A failure body carries **only** `ok` and `code` — no stack trace, no upstream text, no model
   output (FR-106).
3. The route responds within 30 seconds with a dish or `TIMEOUT` (FR-106, SC-106).
4. A returned recipe always has a title, ≥ 1 ingredient, and ≥ 2 steps. Anything less is a
   failure, never a partial card (FR-107).
5. No `Set-Cookie`, no auth, no server-side persistence of the request or response.
6. `GEMINI_API_KEY` is read only inside server modules, never in a response, a log line, or the
   client bundle (FR-016, still binding from feature 001).

### Relationship to `POST /api/suggest`

- `/api/suggest` is **not modified by this feature**. No new field, no changed meaning, no new
  required input.
- The two endpoints share `RecipeSuggestion`, the `ErrorCode` set, the 30-second ceiling, and
  the failure body shape. A client that already handles one handles the other's failures
  unchanged.
- They deliberately differ in one respect: `/api/suggest` enforces the FR-008 two-ingredient
  floor; `/api/random` has no ingredients to floor.

### Extension rules for later features

- Adding an optional response field to `recipe` is allowed and requires no amendment.
- Adding a new error `code` is allowed; clients must render a generic friendly Persian message
  for codes they do not recognize.
- Renaming `recipe` to `recipes`, returning more than one dish, or reusing an existing code for
  a new meaning are breaking changes: amend the constitution first, then update every consumer
  in the same change.

## UI contract

- The control is reachable from the home screen without entering photos or ingredients
  (FR-101).
- Pressing it never modifies the user's selected photos or ingredient list (FR-110).
- While a request is in flight the control is disabled and a processing state is visible;
  further presses are ignored, not queued (FR-105).
- Each `code` maps to a Persian message from `messages/fa.ts`; the client never displays the
  code itself or any raw error.
- On success the dish title is appended to the visit's seen list and sent with the next press.
