---

description: "Task list for feature implementation"
---

# Tasks: Photo-Based Recipe Suggestions

**Input**: Design documents from `/specs/001-photo-recipe-suggestions/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/suggest-api.md, quickstart.md

**Tests**: No automated test tasks. plan.md records manual verification against `quickstart.md` as the acceptance procedure — no constitution principle or spec requirement mandates a test suite. Scenario numbers below refer to that file.

**Organization**: Tasks are grouped by user story so each can be implemented and verified independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are given in every task

## Path Conventions

Single Next.js project at the repository root, per plan.md: `app/`, `lib/`, `messages/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization

- [X] T001 Initialize a Next.js 15 App Router project with TypeScript in place at the repository root (`npx create-next-app@latest . --ts --app --no-src-dir --eslint`), keeping the existing `.specify/`, `.claude/`, `specs/`, `.env`, `.env.example`, and `.gitignore` intact
- [X] T002 Verify `.gitignore` still ignores `.env` and now also ignores `node_modules/` and `.next/`; `.env` MUST NOT be staged at any point
- [X] T003 Install runtime dependencies: `npm install @google/genai zod` — pin the exact `@google/genai` version and confirm the current vision-capable model id from Google's docs before writing `lib/gemini.ts` (research.md §3)
- [X] T004 [P] Set `<html lang="fa" dir="rtl">` and a Persian-capable font stack in `app/layout.tsx`, with page title and description in Persian
- [X] T005 [P] Write base and responsive styles in `app/globals.css`: single-column layout, readable at ~390px and ~1440px, no horizontal overflow (FR-015)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared modules every user story depends on

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 [P] Define the `ErrorCode` union in `lib/errors.ts` with exactly these members: `INVALID_UPLOAD`, `NO_INGREDIENTS`, `NO_RECIPES`, `TIMEOUT`, `SERVICE_ERROR`, plus the code-to-HTTP-status map (400, 422, 422, 504, 502 respectively) from contracts/suggest-api.md
- [X] T007 [P] Create `messages/fa.ts` exporting every user-facing Persian string: page title, upload prompt, submit label, remove-photo label, processing text, results heading, and one friendly message per `ErrorCode`. `NO_INGREDIENTS` and `NO_RECIPES` MUST map to the same "upload a different photo" wording (data-model.md)
- [X] T008 [P] Define zod schemas in `lib/schema.ts`: `RecognizedIngredient` (`name`: non-empty string after trim; `isStaple`: boolean), `RecipeSuggestion` (`title`: non-empty string after trim; `ingredients`: string array, min 1, names only with no quantities; `steps`: string array, min 2, each non-empty after trim), the model-reply schema wrapping both, and the `SuggestionResult` response union — success is `{ ok: true, ingredients, recipes }`, failure is exactly `{ ok: false, code }` and nothing else
- [X] T009 Write the Persian system prompt and response schema in `lib/prompt.ts`: instruct the model to list every recognized ingredient with an `isStaple` flag (staples are salt, pepper, water, cooking oil, sugar per spec.md Assumptions), to propose 2–3 recipes using only recognized ingredients plus those staples, to answer entirely in Persian, and to never invent a dish when it cannot see enough food (FR-006, FR-007, FR-009)
- [X] T010 Implement `lib/gemini.ts`: read `process.env.GEMINI_API_KEY` and `process.env.GEMINI_MODEL` (server-side only, never re-exported to a client module), accept image parts plus the prompt, issue one call, and race it against a 30-second `AbortController` timer that aborts and signals `TIMEOUT` on expiry (FR-011a, research.md §2 and §6)

**Checkpoint**: Shared modules exist — user story work can begin

---

## Phase 3: User Story 1 - Get recipes from a photo of what I have (Priority: P1) — MVP

**Goal**: A user uploads one photo and sees 2–3 Persian recipes, each with a title, the ingredients it uses, and ordered steps.

**Independent Test**: quickstart.md scenario 1 — upload `fridge.jpg`, expect a processing state then 2–3 recipe cards in Persian.

- [X] T011 [P] [US1] Build `app/components/PhotoPicker.tsx` (client component): select photos via a file input, show thumbnails, and enforce per-file rules before submit — MIME type in `image/jpeg`, `image/png`, `image/webp`, `image/heic`, size ≤ 10 MB — surfacing the Persian `INVALID_UPLOAD` message from `messages/fa.ts` on rejection (FR-014). Thumbnails use an object URL; when the browser cannot decode the image (HEIC in most browsers), fall back to a filename chip showing the file size rather than a broken-image icon, and keep the file submittable
- [X] T012 [P] [US1] Build `app/components/StatusPanel.tsx` (client component): render the processing state and the error state, taking an `ErrorCode` and rendering only its Persian message — never the code, never raw error text (FR-010, FR-011)
- [X] T013 [P] [US1] Build `app/components/ResultList.tsx` (client component): render each recipe card in the order title → ingredient list → numbered steps, matching the field order in FR-005 and data-model.md
- [X] T014 [US1] Implement the `POST` handler in `app/api/suggest/route.ts`: read `photos` from `multipart/form-data`, re-validate count (1–3), MIME type, and 10 MB size server-side as the authoritative check, convert each file to the inline base64 part the SDK expects, call `lib/gemini.ts`, and parse the reply with the `lib/schema.ts` model-reply schema (depends on T008, T009, T010)
- [X] T015 [US1] In `app/api/suggest/route.ts`, drop any recipe whose ingredients are not a subset of the recognized pool plus the pantry staples (FR-006), then return 2–3 surviving recipes as `{ ok: true, ingredients, recipes }` with status 200 per contracts/suggest-api.md
- [X] T016 [US1] Wire the client state machine in `app/page.tsx` and its client subtree: `idle → processing → results`, POSTing `multipart/form-data` to `/api/suggest`, disabling submit for the whole in-flight request to block overlapping submissions (FR-010), and holding results in React state only — no `localStorage`, `sessionStorage`, or cookies (FR-013)
- [X] T017 [US1] Run `npm run build` and confirm `GEMINI_API_KEY` appears nowhere under `.next/static/` (FR-016, quickstart.md setup step); if it does, move the offending import out of the client subtree before continuing

**Checkpoint**: The happy path works end to end. This is the MVP.

---

## Phase 4: User Story 2 - Combine several photos of my ingredients (Priority: P2)

**Goal**: A user uploads up to 3 photos and the app treats every item across them as one ingredient pool.

**Independent Test**: quickstart.md scenario 2 — upload `fridge.jpg` and `counter.jpg`, expect at least one recipe using something only visible in the second photo.

- [X] T018 [US2] Extend `app/components/PhotoPicker.tsx` to multi-select: accept up to 3 photos, block a fourth with the Persian 1-to-3 limit message from `messages/fa.ts`, and let the user remove an individual selected photo while the others stay selected (FR-001, FR-002)
- [X] T019 [US2] In `app/api/suggest/route.ts`, send all submitted images in the single Gemini call and deduplicate the returned ingredients by name so the pool is the union across photos (FR-003, data-model.md)
- [X] T020 [US2] In `app/page.tsx`, make submit unavailable when zero photos are selected, or show the Persian "add at least one photo" prompt (spec.md Edge Cases)

**Checkpoint**: Single-photo and multi-photo flows both work.

---

## Phase 5: User Story 3 - Be told clearly when a photo can't be used (Priority: P3)

**Goal**: Unusable input produces a friendly Persian message and zero recipes — never a guessed or partial dish.

**Independent Test**: quickstart.md scenario 4 — upload `wall.jpg`, expect the Persian "different photo" message and no recipe cards, then submit a good photo and get recipes without reloading.

- [X] T021 [US3] In `app/api/suggest/route.ts`, enforce the ingredient floor in code: count recognized ingredients where `isStaple === false`; if fewer than 2, discard any recipes the model returned and respond `{ ok: false, code: "NO_INGREDIENTS" }` with status 422 (FR-008, research.md §5)
- [X] T022 [US3] In `app/api/suggest/route.ts`, apply the recipe count rule: when the floor passes but fewer than 2 recipes survive validation, respond `{ ok: false, code: "NO_RECIPES" }` with status 422 rather than returning a single or invented recipe (FR-008a, FR-009)
- [X] T023 [US3] In `app/api/suggest/route.ts`, map every remaining failure — abort/timeout to `TIMEOUT` (504), and transport failure, non-2xx from Gemini, unparseable or off-schema reply, and missing API key to `SERVICE_ERROR` (502) — returning only `{ ok: false, code }` with no stack trace, upstream text, or model output in the body (FR-011, contracts/suggest-api.md invariant 2)
- [X] T024 [US3] In `app/page.tsx` and `app/components/StatusPanel.tsx`, render the `error` state from any failure code, clear it on the next submission so the user can retry without reloading, and fall back to a generic friendly Persian message for any unrecognized code (contracts/suggest-api.md extension rules)
- [X] T025 [US3] Guard the client `fetch` in `app/page.tsx` with its own 30-second abort so the user is never left waiting past the ceiling even when the server is unreachable (SC-008, research.md §6)

**Checkpoint**: All three user stories work independently.

---

## Phase 6: Design Amendment — Shell, Theme & Navigation (2026-09-09)

**Purpose**: Rebuild the app to the three-screen dark design. Blocking prerequisite for Phases 7–9.

- [X] T031 Rewrite `app/globals.css` around CSS custom properties for both themes: dark as the default (deep navy surfaces, lime primary, teal accent) and a light set under `[data-theme="light"]`, plus the shared type scale, card, chip, and button styles from the mockups (FR-022)
- [X] T032 [P] Implement `lib/theme.tsx`: a client context storing `"dark" | "light"` in `localStorage` under one key, defaulting to dark, applying it as `data-theme` on the document element. This is one of only two modules permitted to touch `localStorage` (FR-013a, FR-022)
- [X] T033 [P] Implement `lib/saved.tsx`: a client context for saved recipes in `localStorage` — add, remove, `isSaved`, list — storing only title, ingredients, steps, and saved-at time, wrapping every read and write in try/catch so a private window or blocked storage degrades to an empty list instead of throwing (FR-013a, FR-020)
- [X] T034 [P] Implement `lib/session.tsx`: a client context holding in-visit state only — selected photos, the working ingredient list, current suggestions, request status. It MUST NOT write to any storage, so a reload clears it (FR-013, SC-012)
- [X] T035 Build `app/components/SiteNav.tsx`: brand mark, links to the three screens with the active one indicated, and the theme toggle (FR-021, FR-022)
- [X] T036 Rewrite `app/layout.tsx`: wrap the tree in the theme, saved, and session providers; render `SiteNav` and the footer; add an inline pre-hydration script that reads the stored theme and sets `data-theme` before first paint so the dark default never flashes light
- [X] T037 [P] Build `app/components/EmptyState.tsx`: a shared friendly empty state taking an emoji, title, description, and one action control (FR-023)

**Checkpoint**: Shell, both themes, and navigation work across all three routes.

---

## Phase 7: Design Amendment — Home Screen (US1 + US4)

**Goal**: The home screen of the mockup: hero, two entry paths, quick-start chips, photo slots, how-it-works.

**Independent Test**: Tap two chips with no photo, press the primary action, and land on the ingredients screen with both chips in the list.

- [X] T038 [P] [US4] Build `app/components/QuickChips.tsx`: one-tap chips for مرغ، تخم مرغ، گوجه، برنج، پیاز، سیب زمینی that append to the working ingredient list, marking a chip as already added (FR-019)
- [X] T039 [US1] Replace `app/components/PhotoPicker.tsx` with `app/components/PhotoSlots.tsx`: three slots matching the mockup's card stack, the first being "add photo" and the rest "empty", keeping the existing type, size, count, and HEIC-chip-fallback rules intact (FR-001, FR-014)
- [X] T040 [US1] Rewrite `app/page.tsx` as the home screen: the "امروز چی بپزم؟" hero, the two entry buttons (photo path and manual path), `QuickChips`, `PhotoSlots`, and the three-step how-it-works strip (FR-021, FR-023)
- [X] T041 [US4] Wire both entry paths to `lib/session.tsx` and route to `/ingredients`, so a request may be built from photos, typed ingredients, or both (FR-017)

**Checkpoint**: Home matches the mockup and feeds the ingredients screen.

---

## Phase 8: Design Amendment — My Ingredients Screen (US5)

**Goal**: The user sees what the app found, corrects it, and asks for recipes from the corrected list.

**Independent Test**: After a recognition run, rename one item, delete another, add a third, ask for recipes, and confirm suggestions reflect the edits.

- [X] T042 [US5] Add `POST /api/suggest` support for a `manualIngredients` field: a JSON array of Persian ingredient names sent alongside (or instead of) photos, validated server-side as ≤ 30 entries of ≤ 60 characters each, non-empty after trim (FR-017)
- [X] T043 [US5] In `app/api/suggest/route.ts`, accept a request with zero photos when manual ingredients are present, skip the Gemini vision pass when there are no photos, and merge recognized and manual ingredients into one deduplicated pool before the FR-008 floor is applied (FR-001, FR-017)
- [X] T044 [P] [US5] Build `app/components/IngredientList.tsx`: each ingredient renaming inline on click, a remove control per item, and a free-text add field ("چیز دیگری هم داری؟ اینجا بنویس"), writing every change to the session ingredient list (FR-018)
- [X] T045 [US5] Build `app/ingredients/page.tsx`: the "این‌ها رو پیدا کردم 👀" heading, the ingredient card, the empty state ("هنوز نمی‌دونم چی داری 😅") with an add-ingredients action, the primary "ببین چی میشه پخت" action, and the secondary "عکس دیگری اضافه کن" action (FR-018, FR-023)
- [X] T046 [US5] Run recognition on arrival when photos are pending, showing the processing state, then populate the editable list from the result so the corrected list — not the raw recognition — is what the recipe request carries (FR-018, FR-010)

**Checkpoint**: Recognition, correction, and suggestion all work from one screen.

---

## Phase 9: Design Amendment — Saved Recipes (US6)

**Goal**: A recipe the user saves is still there after a reload.

**Independent Test**: Save a recipe, reload, open `/saved`, confirm it is intact; remove it and confirm it stays gone after another reload.

- [X] T047 [US6] Add a save/unsave control to each card in `app/components/ResultList.tsx`, reflecting current saved state and toggling it through `lib/saved.tsx` — explicit user action only, never automatic (FR-020)
- [X] T048 [US6] Build `app/saved/page.tsx`: the "ذخیره‌شده‌ها" heading, saved recipe cards with a remove control, and the empty state ("هنوز چیزی ذخیره نکردی") with a "برو سراغ پیشنهادها" action linking home (FR-020, FR-023)
- [X] T049 [US6] Guard against hydration mismatch on both persisted values: render the server-safe default first and read `localStorage` after mount, so a private window or blocked storage shows an empty saved list rather than throwing (FR-013a)

**Checkpoint**: All six user stories work.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Verification and final pass across stories

- [X] T026 [P] Review `messages/fa.ts` and every component for stray Latin text in user-facing copy — labels, buttons, statuses, errors — confirming FR-007 by reading one file plus the render output
- [ ] T027 [P] Check responsiveness at ~390px and ~1440px: no horizontal scrolling, no clipped controls, text right-aligned RTL (FR-015, quickstart.md scenario 7)
- [ ] T028 Verify the storage boundary in DevTools → Application: no cookies, no `sessionStorage`, and exactly two `localStorage` keys — saved recipes and theme. After a reload, photos, the working ingredient list, and unsaved suggestions are all gone while saved recipes remain (FR-012, FR-013, FR-013a, SC-011, SC-012)
- [X] T050 [P] Confirm `localStorage` is touched only by `lib/saved.tsx` and `lib/theme.tsx` — grep the codebase for the API name and expect no other hits, keeping the FR-013a boundary reviewable in one command
- [ ] T051 [P] Check both themes: dark renders by default with no light flash on first paint, the toggle switches both ways, and the choice survives a reload (FR-022)
- [X] T029 Update `.env.example` if `lib/gemini.ts` reads any environment variable beyond `GEMINI_API_KEY` and `GEMINI_MODEL`; never add real values
- [ ] T030 Walk all seven quickstart.md scenarios plus the bundle-secret check and record pass/fail in its sign-off table

---

## Dependencies

**Phase order**: Setup (T001–T005) → Foundational (T006–T010) → US1 (T011–T017) → US2 (T018–T020) → US3 (T021–T025) → Polish (T026–T030)

**Story dependencies**:

- **US1** depends only on Setup and Foundational. It is a complete, shippable slice on its own.
- **US2** extends the picker and the route's ingredient handling from US1. It needs US1's route to exist.
- **US3** adds error branches to the same route and page. It needs US1's route and client state machine.

US2 and US3 touch different concerns but both edit `app/api/suggest/route.ts` and `app/page.tsx`, so run them in sequence, not in parallel.

**Task-level dependencies within US1**: T014 depends on T008, T009, T010. T015 depends on T014. T016 depends on T011, T012, T013, T015. T017 depends on T016.

## Parallel Execution Examples

**Setup**: T004 and T005 touch different files — run together after T001.

**Foundational**: T006, T007, T008 are three independent files — run together. T009 and T010 follow, since T010 consumes the prompt.

**US1**: T011, T012, T013 are three separate components with no shared file — run all three in parallel, then do T014–T017 in sequence.

**Polish**: T026, T027 are independent checks — run together.

US2 and US3 have no `[P]` tasks: every task in those phases edits a file another task in the same phase also edits.

## Implementation Strategy

**MVP**: Phases 1–3 (T001–T017). That delivers the whole product value — photo in, Persian recipes out — and is demonstrable on its own.

**Increment 2**: Phase 4 (T018–T020). Multi-photo pooling, which raises suggestion quality for real kitchens.

**Increment 3**: Phase 5 (T021–T025). The trust guard: no fabricated recipes, friendly failures, enforced timeout.

**Close**: Phase 6 (T026–T030), ending with the full quickstart.md walkthrough as sign-off.

Each increment leaves the app in a working, demoable state, which is what the constitution's workshop-checkpoint rule asks for.

---

## Phase 11: Visual Refactor — shadcn/ui, ReactBits patterns, motion (2026-09-09)

**Purpose**: Replace hand-written CSS with a token-driven design system. No new capability — every screen behaves exactly as Phases 6–9 specified.

- [X] T052 Install Tailwind CSS v4 + `@tailwindcss/postcss`, `motion`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`; add `postcss.config.mjs`, `components.json`, and `lib/utils.ts`
- [X] T053 Vendor shadcn/ui primitives into `components/ui/` — button, card, input, badge, skeleton, separator — via `npx shadcn@latest add`
- [X] T054 Install `@fontsource/lalezar` (display) and `@fontsource-variable/estedad` (body) as npm packages so no font CDN is fetched at runtime
- [X] T055 Rewrite `app/globals.css` on Tailwind v4 `@theme`: the ته‌یخچال token set (shab, taaqche, limu, nana, zaferan, barf, mist, hairline) mapped to shadcn's semantic names, both themes, plus `fridge-light` and `shelf-line` utilities (FR-022)
- [X] T056 [P] Build `components/motion-primitives.tsx` with ReactBits patterns implemented on `motion` — `BlurText`, `Magnet`, `Spark`, shared list variants — each honoring `useReducedMotion`
- [X] T057 [P] Rebuild `SiteNav`, `EmptyState`, `StatusPanel` on shadcn primitives, with a `layoutId` underline tracking the active nav item
- [X] T058 [P] Rebuild `PhotoSlots`, `QuickChips`, `IngredientList` — spring on add/remove, `AnimatePresence` on exit, HEIC chip fallback preserved
- [X] T059 Rebuild `app/page.tsx` with the single orchestrated load moment (hero `BlurText`) and a `Magnet` primary action; all other motion answers a user action
- [X] T060 [P] Rebuild `ResultList` and `app/saved/page.tsx` on shadcn `Card`, with a save control that sparks on save (FR-020)
- [X] T061 Re-verify the invariants after the refactor: `localStorage` still only in `lib/saved.tsx` and `lib/theme.tsx`, `GEMINI_API_KEY` still absent from `.next/static/`, both themes compile, `prefers-reduced-motion` respected

**Checkpoint**: Same behavior, new design system.
