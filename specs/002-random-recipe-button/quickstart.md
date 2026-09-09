# Quickstart & Validation: Random Recipe Button

**Feature**: `002-random-recipe-button` | **Date**: 2026-09-09

The acceptance procedure for this feature. No automated suite — these scenarios are the proof,
consistent with feature 001. Run all six before calling it done.

## Prerequisites

- Feature 001 working: `npm run dev` starts, the home screen renders.
- `.env` at the repository root with a **working** `GEMINI_API_KEY`.
- **Region note**: Google blocks the Gemini API from some locations with
  `400 FAILED_PRECONDITION — "User location is not supported for the API use."` If you hit
  that, every scenario below except 5 will fail with the friendly Persian error. Run a VPN or
  proxy to a supported region before starting, and check the server log — it names this case
  explicitly.

## Setup

```bash
npm install
npm run dev
```

Open the printed URL (default `http://localhost:3000`).

## Scenarios

### 1. One press, one dish (FR-101, FR-102, FR-103 — User Story 1)

1. On the home screen, with no photos selected and no ingredients entered, press the random
   dish button.
2. **Expect**: a visible processing state, then one recipe with a Persian title, an ingredient
   list, and numbered Persian steps. No Latin text. Nothing else on the page changed.
3. Read the steps.
   **Expect**: enough to cook the dish without opening another source.

### 2. Press again, get something else (FR-104 — User Story 2)

1. Press the button five times, noting each title.
2. **Expect**: five different dishes. No repeat within the five.
3. While one request is still processing, press again.
   **Expect**: the second press is ignored — no overlapping request, no double result.

### 3. It ignores what I already entered (FR-110)

1. Select a photo and tap two ingredient chips on the home screen.
2. Press the random dish button.
3. **Expect**: a dish unrelated to those ingredients, **and** the photo and chips still
   selected exactly as they were. The random flow neither uses nor clears them.

### 4. Saving a random dish (FR-108 — User Story 3)

1. Press the save control on a random dish. Open "ذخیره‌شده‌ها".
   **Expect**: it is listed, looking exactly like a recipe saved from the ingredient flow.
2. Reload the page and open the saved screen again.
   **Expect**: still there.
3. Return to the home screen.
   **Expect**: the random dish area is back to its starting state — the dish itself did not
   survive the reload, only the save (FR-109).

### 5. Failure and timeout (FR-106, FR-107)

1. Temporarily set `GEMINI_API_KEY` to an invalid value and restart. Press the button.
   **Expect**: a friendly Persian message with a way to retry. No stack trace, no English
   error, no error code shown, no half-rendered recipe card.
2. Restore the key. Throttle the network to a very slow profile in DevTools and press again.
   **Expect**: at 30 seconds the processing state ends and the friendly failure message
   appears. Time it — it must not spin past 30 seconds.
3. Restore the network.

### 6. Cross-device and statelessness (FR-111, FR-112, FR-109)

1. Check the button and a returned recipe at ~390px and ~1440px.
   **Expect**: usable at both, no horizontal scrolling, no clipped controls, text right-aligned
   RTL.
2. With a random dish on screen, reload.
   **Expect**: the dish is gone and the seen-list is reset — pressing again may legitimately
   return a dish you saw before the reload.
3. DevTools → Application.
   **Expect**: still only the two `localStorage` keys from feature 001 (saved recipes, theme).
   This feature adds none.

## Sign-off

| # | Scenario | Covers | Pass |
|---|---|---|---|
| 1 | One press, one dish | FR-101, FR-102, FR-103, SC-101, SC-103, SC-104 | ☐ |
| 2 | Press again, get something else | FR-104, FR-105, SC-102 | ☐ |
| 3 | Ignores existing input | FR-110 | ☐ |
| 4 | Saving a random dish | FR-108, SC-107 | ☐ |
| 5 | Failure and timeout | FR-106, FR-107, SC-106 | ☐ |
| 6 | Cross-device and stateless | FR-109, FR-111, FR-112 | ☐ |

## References

- Request/response shapes and error codes: [contracts/random-api.md](./contracts/random-api.md)
- Entity fields and validation rules: [data-model.md](./data-model.md)
- Requirement text: [spec.md](./spec.md)
- Reused behavior (recipe shape, saving, timeout, error copy): `specs/001-photo-recipe-suggestions/`
