# Quickstart & Validation: Photo-Based Recipe Suggestions

**Feature**: `001-photo-recipe-suggestions` | **Date**: 2026-09-09

This is the acceptance procedure for the feature. There is no automated suite — these
scenarios are what proves it works (see plan.md, Constitution Check, for why). Run all seven
before calling the feature done.

## Prerequisites

- Node.js 20 or newer (`node -v`).
- **Region check.** Google blocks the Gemini API from some locations with
  `400 FAILED_PRECONDITION — "User location is not supported for the API use."` If you are in
  one, every scenario that calls the model fails with the friendly Persian error no matter
  what you do. Start a VPN or proxy to a supported region first; the server log names this
  case explicitly when it happens.
- `.env` at the repository root containing `GEMINI_API_KEY=...`, optionally `GEMINI_MODEL=...`.
  This file already exists and is gitignored — do not commit it, do not print its contents.
- Four sample images ready:
  - `fridge.jpg` — an open fridge with at least 3 clearly visible ingredients
  - `counter.jpg` — a few different ingredients on a counter
  - `wall.jpg` — no food at all
  - `big.jpg` — any image over 10 MB
  - `phone.heic` — an unmodified iPhone photo, for the preview-fallback check

## Setup

```bash
npm install
npm run dev
```

Open the printed URL (default `http://localhost:3000`).

Before anything else, confirm the key is not leaking: search the built client output for the
variable name and for the key's first characters — both must return nothing.

```bash
npm run build
grep -r "GEMINI_API_KEY" .next/static/ || echo "PASS: key name absent from client bundle"
```

## Scenarios

### 1. Happy path, single photo (FR-001, FR-004, FR-005, FR-007 — User Story 1)

1. Upload `fridge.jpg`. Submit.
2. **Expect**: a processing state appears immediately; within 30 seconds, 2 or 3 recipe
   cards render. Each card shows a Persian title, the ingredients it uses, and numbered
   Persian steps. No Latin text anywhere on screen.

### 2. Multiple photos combine (FR-003 — User Story 2)

1. Upload `fridge.jpg` and `counter.jpg` together. Submit.
2. **Expect**: recipes draw on ingredients from both photos. At least one suggestion uses
   something that only appears in `counter.jpg`.

### 3. Photo limits (FR-001, FR-002, FR-014)

1. Try to select a fourth photo.
   **Expect**: blocked, with a Persian message about the 1–3 limit.
2. Remove one selected photo.
   **Expect**: it disappears; the others stay selected.
3. Try to submit with nothing selected.
   **Expect**: submit is unavailable, or a Persian prompt asks for at least one photo.
4. Try to select `big.jpg`.
   **Expect**: rejected before submission with a Persian size explanation; any other valid
   selections remain.
5. Select `phone.heic`.
   **Expect**: either a thumbnail or a filename chip with the file size — never a
   broken-image icon — and the file is still submittable.

### 4. Unrecognizable photo (FR-008, FR-009 — User Story 3)

1. Upload `wall.jpg`. Submit.
2. **Expect**: a friendly Persian message asking for a different photo. **Zero** recipe
   cards. Nothing invented, no partial recipe.
3. Now select `fridge.jpg` and submit again.
   **Expect**: the error clears and recipes appear — the app is usable without a reload.

### 5. Timeout ceiling (FR-011a, SC-008)

1. In DevTools, throttle the network to a very slow profile so the request genuinely stalls.
   Submit `fridge.jpg`.

   Do **not** test this by setting an invalid `GEMINI_MODEL` — an unknown model id fails fast
   with an upstream error, which produces `SERVICE_ERROR` in about a second and never reaches
   the ceiling. That case belongs to scenario 6.
2. **Expect**: at 30 seconds the processing state ends and a friendly Persian failure
   message appears with a way to retry. It must not spin past 30 seconds, show a raw error,
   or leave the page frozen. Time it.

### 6. Service failure (FR-011)

1. Stop the dev server mid-request, or temporarily set `GEMINI_API_KEY` to an invalid value
   and restart.
2. **Expect**: a friendly Persian failure message with a retry. No stack trace, no English
   error text, no error code shown to the user.
3. Restore the real key afterward.

### 7. Statelessness and responsiveness (FR-013, FR-015)

1. With results on screen, reload the page.
   **Expect**: back to the empty start state. Previous suggestions are unreachable.
2. Check DevTools → Application: no cookies, no `localStorage`, no `sessionStorage` entries
   written by the app.
3. Resize to a narrow mobile viewport (~390px) and a desktop width (~1440px).
   **Expect**: the full flow works at both; no horizontal scrolling, no clipped controls,
   text stays right-aligned RTL.

### 8. Manual ingredients, no photo (FR-017, FR-019 — User Story 4)

1. On the home screen, tap the chips مرغ and برنج, then press "خودم وارد می‌کنم".
2. **Expect**: both chips appear in the list on the ingredients screen. Press
   "ببین چی میشه پخت" and recipes come back with no photo ever selected.

### 9. Correcting the list (FR-018 — User Story 5)

1. After a recognition run, click an ingredient name and rename it; remove another with its
   × control; type a third into "چیز دیگری هم داری؟" and add it.
2. Press "ببین چی میشه پخت".
3. **Expect**: suggestions use the corrected names, and the removed ingredient appears in
   none of them.

### 10. Saving a recipe (FR-020, FR-013a — User Story 6)

1. Press the save control on a suggested recipe. Open "ذخیره‌شده‌ها".
   **Expect**: the recipe is listed with its title, ingredients, and steps.
2. Reload the page and open "ذخیره‌شده‌ها" again.
   **Expect**: still there.
3. Remove it, then reload.
   **Expect**: gone, and it does not come back.
4. Open the app in a different browser.
   **Expect**: the saved list is empty there — the store is per-browser.

### 11. Theme (FR-022)

1. Load any screen with no stored preference.
   **Expect**: dark, with no flash of light during load. Watch the first paint.
2. Press the theme toggle.
   **Expect**: light applies immediately. Reload — light persists. Toggle back and reload —
   dark persists.

### 12. Storage boundary (FR-013, FR-013a, SC-012)

1. DevTools → Application → Local Storage.
   **Expect**: at most two keys, one for saved recipes and one for theme. Nothing else.
   No cookies, no `sessionStorage`.
2. With photos selected, an edited ingredient list, and suggestions on screen, reload.
   **Expect**: photos, ingredient list, and unsaved suggestions are all gone; saved recipes
   remain.

## Sign-off

| # | Scenario | Covers | Pass |
|---|---|---|---|
| — | Key absent from client bundle | FR-016 | ☐ |
| 1 | Happy path, single photo | FR-001, FR-004, FR-005, FR-007, SC-002 | ☐ |
| 2 | Multiple photos combine | FR-003, User Story 2 | ☐ |
| 3 | Photo limits + HEIC preview | FR-001, FR-002, FR-014 | ☐ |
| 4 | Unrecognizable photo | FR-008, FR-009, SC-003 | ☐ |
| 5 | Timeout ceiling | FR-011a, SC-008 | ☐ |
| 6 | Service failure | FR-011, SC-006 | ☐ |
| 7 | Stateless + responsive | FR-012, FR-013, FR-015, SC-007 | ☐ |
| 8 | Manual ingredients, no photo | FR-017, FR-019, SC-009 | ☐ |
| 9 | Correcting the list | FR-018, SC-010 | ☐ |
| 10 | Saving a recipe | FR-020, FR-013a, SC-011 | ☐ |
| 11 | Theme | FR-022 | ☐ |
| 12 | Storage boundary | FR-013, FR-013a, SC-012 | ☐ |

## References

- Request/response shapes and error codes: [contracts/suggest-api.md](./contracts/suggest-api.md)
- Entity fields and validation rules: [data-model.md](./data-model.md)
- Requirement text: [spec.md](./spec.md)
