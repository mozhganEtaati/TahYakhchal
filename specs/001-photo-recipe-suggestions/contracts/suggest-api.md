# Contract: Recipe Suggestion API

**Feature**: `001-photo-recipe-suggestions` | **Date**: 2026-09-09

This is the app's only interface boundary. Under Constitution Principle IV it is a promise
to every feature built after this one: later features add optional fields or new endpoints,
they do not change the meaning or shape of what is defined here. An incompatible change
requires a constitution amendment.

## `POST /api/suggest`

Accepts photos, returns Persian recipe suggestions or a typed error. Stateless: no cookies,
no session, no auth header, nothing stored.

### Request

**Content-Type**: `multipart/form-data`

| Field | Cardinality | Constraints |
|---|---|---|
| `photos` | 0–3 entries, repeated under the same field name | Each ≤ 10 MB; MIME type one of `image/jpeg`, `image/png`, `image/webp`, `image/heic` |
| `manualIngredients` | 0 or 1 entry | A JSON array of Persian ingredient names; ≤ 30 entries, each ≤ 60 characters and non-empty after trim. Added 2026-09-09 as an optional field (FR-017) — an extension, not a break |

A request MUST carry at least one photo **or** at least one manual ingredient; one with
neither is rejected as `INVALID_UPLOAD`. When there are no photos the vision pass is skipped
and suggestions are built from the named ingredients alone.

No other fields are read. Unknown fields are ignored.

### Response

**Content-Type**: `application/json`. Always a JSON body, including on failure.

**200 — success**

```json
{
  "ok": true,
  "ingredients": [
    { "name": "گوجه‌فرنگی", "isStaple": false },
    { "name": "تخم‌مرغ", "isStaple": false },
    { "name": "نمک", "isStaple": true }
  ],
  "recipes": [
    {
      "title": "املت گوجه‌فرنگی",
      "ingredients": ["گوجه‌فرنگی", "تخم‌مرغ", "نمک"],
      "steps": ["گوجه‌فرنگی را خرد کنید.", "..."]
    }
  ]
}
```

- `recipes` always contains 2 or 3 entries when `ok` is true. Never 0, 1, or more than 3.
- `ingredients` is the deduplicated recognized pool across all submitted photos.
- Every string is Persian. `steps` is ordered; render order is the array order.

**Failure** — one shape for every failure, with the HTTP status matching the cause:

```json
{ "ok": false, "code": "NO_INGREDIENTS" }
```

| `code` | HTTP status | Cause |
|---|---|---|
| `INVALID_UPLOAD` | 400 | Wrong photo count, unsupported type, or oversized file |
| `NO_INGREDIENTS` | 422 | Fewer than 2 non-staple ingredients recognized |
| `NO_RECIPES` | 422 | Ingredients sufficed but fewer than 2 valid recipes survived validation |
| `TIMEOUT` | 504 | The 30-second ceiling expired |
| `SERVICE_ERROR` | 502 | Transport failure, upstream error, unparseable reply, or missing API key |

### Invariants

1. The response body is never both `ok: true` and carrying an error, and never neither.
2. A failure body carries **only** `ok` and `code`. No stack trace, no upstream error text,
   no model output — the client renders its own Persian copy from the code (FR-011).
3. The route responds within 30 seconds of receiving the request, with a result or
   `TIMEOUT` (FR-011a, SC-008).
4. No `Set-Cookie`, no auth, no rate-limit state, and no server-side persistence of the
   request or response (FR-012, FR-013). Anything the user chooses to keep lives in their
   own browser and never reaches this endpoint (FR-013a).
5. `GEMINI_API_KEY` is read only inside this route's server module. It never appears in a
   response, a log line, or the client bundle.

### Extension rules for later features

- Adding an **optional** response field (for example `cookingTimeMinutes` on a recipe) is
  allowed and does not require an amendment.
- Adding a new error `code` is allowed; clients must render a generic friendly Persian
  message for codes they do not recognize.
- Changing the meaning of an existing field, removing one, making an optional field
  required, or renaming a code is a breaking change: amend the constitution first, then
  update every consumer in the same change.

## UI contract (client behavior the API assumes)

Documented here because it is the other half of the promise: the client must not re-derive
server rules.

- The client renders exactly one of: idle, processing, results, error.
- The client shows the processing state for the entire request and disables submit while it
  is in flight (FR-010).
- The client maps each `code` to a Persian message from `messages/fa.ts`; it never displays
  the code itself or any raw error.
- The client applies the ingredient floor and recipe count as **display** expectations only —
  it does not recompute them. The server is the authority.
