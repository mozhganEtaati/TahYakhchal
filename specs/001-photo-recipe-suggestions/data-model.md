# Phase 1 Data Model: Photo-Based Recipe Suggestions

**Feature**: `001-photo-recipe-suggestions` | **Date**: 2026-09-09

Nothing here is persisted. Every entity is in-memory for the duration of one request
(server) or one page visit (client), per FR-013 and Constitution Principle III. There is no
schema migration, no identity, and no lifecycle beyond the request.

## Entities

### PhotoSubmission (client + request body)

The 1–3 images a user submits in one request.

| Field | Type | Rules |
|---|---|---|
| `photos` | `File[]` (client) / `File[]` from `formData` (server) | 1–3 items (FR-001). Each ≤ 10 MB. Each MIME type in `image/jpeg`, `image/png`, `image/webp`, `image/heic` (FR-014). |

- Validated on the client for instant feedback, and again in the route handler, which is the
  enforcing check.
- Removing a photo before submit (FR-002) is a client-state operation only.
- Released when the response is sent. Never written to disk.

### RecognizedIngredient (model reply → server → response)

One food item the model reports as visible across the submission.

| Field | Type | Rules |
|---|---|---|
| `name` | `string` | Persian, non-empty after trim. |
| `isStaple` | `boolean` | True for the pantry staples listed in spec.md Assumptions (salt, pepper, water, cooking oil, sugar). Staples do not count toward the FR-008 floor. |

- The ingredient pool is the union across all submitted photos (FR-003), deduplicated by
  name.
- **Floor rule (FR-008)**: if the count of ingredients with `isStaple === false` is fewer
  than 2, the server discards any recipes the model returned and responds with the
  `NO_INGREDIENTS` error. This is enforced in code, not by the prompt.

### RecipeSuggestion (model reply → server → response → UI)

One proposed dish.

| Field | Type | Rules |
|---|---|---|
| `title` | `string` | Persian, non-empty after trim (FR-005, FR-007). |
| `ingredients` | `string[]` | Names only, no quantities (FR-005). Each must appear in the recognized pool or be a pantry staple (FR-006). Minimum 1. |
| `steps` | `string[]` | Ordered Persian instructions. Minimum 2 entries, each non-empty after trim. |

- **Count rule (FR-004, FR-008a)**: the response carries 2 or 3 recipes. If validation leaves
  fewer than 2 usable recipes, the server responds with `NO_RECIPES` instead of returning a
  partial list.

### SuggestionResult (API response)

A discriminated union — the response is either recipes or an error, never both.

| Variant | Shape | Meaning |
|---|---|---|
| success | `{ ok: true, ingredients: RecognizedIngredient[], recipes: RecipeSuggestion[] }` | 2–3 validated recipes. |
| failure | `{ ok: false, code: ErrorCode }` | One of the codes below. Carries no raw error text (FR-011). |

### ErrorCode

Defined once in `lib/errors.ts`; each maps to exactly one Persian message in `messages/fa.ts`.

| Code | Cause | Spec reference |
|---|---|---|
| `INVALID_UPLOAD` | Wrong count, unsupported type, or oversized file. | FR-001, FR-014 |
| `NO_INGREDIENTS` | Fewer than 2 non-staple ingredients recognized. | FR-008 |
| `NO_RECIPES` | Ingredients sufficed but fewer than 2 valid recipes survived validation. | FR-008a |
| `TIMEOUT` | The 30-second ceiling expired. | FR-011a, SC-008 |
| `SERVICE_ERROR` | Transport failure, non-2xx from Gemini, malformed or unparseable reply, or a missing API key. | FR-011 |

`NO_INGREDIENTS` and `NO_RECIPES` both render the "upload a different photo" message; they
are kept distinct so a failing demo can be diagnosed from the server log without changing
what the user sees.

## Client UI state

`app/page.tsx`'s client subtree is a single state machine. There is no other client state
and nothing is written to `localStorage` (FR-013).

```text
idle ──submit──> processing ──success──> results ──new submit──> processing
                     │
                     └──failure/timeout──> error ──new submit──> processing
```

- `processing` disables the submit control, blocking overlapping requests (FR-010).
- A page reload or navigation returns the app to `idle` with no way back to prior results
  (FR-013).

## Validation summary

| Rule | Where enforced |
|---|---|
| 1–3 photos, type, size | Client (fast feedback) **and** route handler (authoritative) |
| Reply matches schema | Route handler, `zod` against the parsed model JSON |
| ≥ 2 non-staple ingredients | Route handler, counted from the reply |
| 2–3 recipes, each with title + ingredients + ≥2 steps | Route handler, after per-recipe validation |
| Recipe ingredients ⊆ recognized pool ∪ staples | Route handler; a recipe failing this is dropped before the count rule is applied |
| All text Persian | Prompt instruction plus a non-empty check; app copy centralized in `messages/fa.ts` |
| 30-second ceiling | Route handler (`AbortController`) and client `fetch` guard |
