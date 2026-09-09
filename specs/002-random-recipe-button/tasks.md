---

description: "Task list for feature implementation"
---

# Tasks: Random Recipe Button

**Input**: Design documents from `/specs/002-random-recipe-button/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/random-api.md, quickstart.md

**Tests**: No automated test tasks. plan.md records manual verification against `quickstart.md` as the acceptance procedure, consistent with feature 001 — no constitution principle or spec requirement mandates a test suite. Scenario numbers below refer to that file.

**Organization**: Tasks are grouped by user story so each can be implemented and verified independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are given in every task

## Path Conventions

Existing Next.js project at the repository root, per plan.md: `app/`, `lib/`, `messages/`, `components/`.

**Requirement ids**: this feature owns FR-101…FR-112 and SC-101…SC-107. Feature 001 owns FR-001…FR-023 and SC-001…SC-012; where a task cites one of those, it is a constraint inherited rather than redefined.

---

## Phase 1: Setup

**Purpose**: Nothing to install — this feature adds no dependencies

- [X] T001 Confirm the working tree builds clean before changes: run `npx tsc --noEmit`, `npx eslint .`, and `npm run build`, so any later failure is attributable to this feature

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared pieces every user story below depends on

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 [P] Add Persian copy to `messages/fa.ts` under a `random` key: button label, a short line introducing the result, the processing text, and the "try another" label. Reuse the existing `errors` map — this feature adds no new error codes
- [X] T003 [P] Add the random reply schema to `lib/schema.ts`: `randomReplySchema` wrapping the **existing** `recipeSuggestionSchema` as a single `recipe` field, plus the response union — success is `{ ok: true, recipe }` (singular, never an array per contracts/random-api.md), failure is exactly `{ ok: false, code }`
- [X] T004 Add the random dish prompt to `lib/prompt.ts`: a Persian instruction to return exactly one real Iranian dish with a title, its ingredient names without quantities, and at least two ordered steps, all in Persian; accept a list of titles to avoid and state they must not be repeated; add the matching single-recipe response schema for the model
- [X] T005 Export `requestRandomDish(seenTitles: string[])` from `lib/gemini.ts`: reads `process.env.GEMINI_API_KEY` and `GEMINI_MODEL` server-side only, issues one call with a raised temperature for variety (research.md §2), and races it against the same 30-second `AbortController` ceiling, throwing `GeminiTimeoutError` on expiry (FR-106, SC-106). MUST NOT change the signature or behavior of the existing `requestSuggestions`

**Checkpoint**: Schema, prompt, copy, and the model call exist — route and UI work can begin

---

## Phase 3: User Story 1 - Give me one dish, I'll decide later (Priority: P1) — MVP

**Goal**: One press with no photo and no ingredients returns one complete Persian dish.

**Independent Test**: quickstart.md scenario 1 — press the button on a clean home screen, expect a processing state then one recipe with title, ingredients, and ordered steps.

- [X] T006 [US1] Create `app/api/random/route.ts` as a server-only `POST` handler: parse an optional JSON body, read `seenTitles` (defaults to `[]`; each entry non-empty after trim and ≤ 120 characters; at most 40 entries honored, extras ignored rather than rejected per data-model.md), and reject a malformed body as `SERVICE_ERROR`
- [X] T007 [US1] In `app/api/random/route.ts`, call `requestRandomDish`, validate the reply with `randomReplySchema`, and return `{ ok: true, recipe }` with status 200. A reply lacking a title, ≥ 1 ingredient, or ≥ 2 steps MUST become a failure, never a partial card (FR-107)
- [X] T008 [US1] In `app/api/random/route.ts`, map failures to the existing codes only — `TIMEOUT` (504) on abort, `SERVICE_ERROR` (502) for transport failure, upstream error, unparseable reply, schema failure, or missing key — returning only `{ ok: false, code }` with no stack trace, upstream text, or model output (FR-106). `INVALID_UPLOAD`, `NO_INGREDIENTS`, and `NO_RECIPES` MUST NOT be returned here
- [X] T009 [US1] Add `randomRecipe`, `randomStatus`, and `randomErrorCode` to the visit state in `lib/session.tsx`, alongside the existing photo and ingredient fields. These MUST NOT be written to any storage, so a reload clears them (FR-109)
- [X] T010 [US1] Build `app/components/RandomDish.tsx` (client): the button, its `idle → processing → shown | error` state machine, a `fetch` to `/api/random` guarded by its own 30-second abort, and rendering of the returned dish through the **existing** `ResultList` card path so a random dish looks identical to an ingredient-based one (FR-102, SC-107)
- [X] T011 [US1] Mount `RandomDish` on `app/page.tsx` as a distinct entry point, reachable without entering photos or ingredients (FR-101), and confirm it neither reads nor clears the existing photo and ingredient state (FR-110)

**Checkpoint**: One press returns one dish. This is the MVP.

---

## Phase 4: User Story 2 - Not that one, give me another (Priority: P2)

**Goal**: Pressing again returns a dish not seen this visit, and rapid presses cannot overlap.

**Independent Test**: quickstart.md scenario 2 — press five times, expect five different dishes; press during a request and expect it ignored.

- [X] T012 [US2] Add `seenTitles: string[]` to `lib/session.tsx` with an append action, cleared only by a reload (data-model.md). It MUST NOT be persisted
- [X] T013 [US2] In `app/components/RandomDish.tsx`, send `seenTitles` in the request body and append each successful dish title on arrival (FR-104)
- [X] T014 [US2] In `app/api/random/route.ts`, pass the seen titles into the prompt as an explicit exclusion list, capped at the 40 most recent, and allow a repeat rather than an error once the pool is exhausted (research.md §4, spec.md Edge Cases)
- [X] T015 [US2] In `app/components/RandomDish.tsx`, disable the control for the whole in-flight request and ignore further presses rather than queueing them (FR-105)

**Checkpoint**: Repeated presses give fresh dishes without overlapping requests.

---

## Phase 5: User Story 3 - Keep the one I liked (Priority: P3)

**Goal**: A random dish saves and unsaves like any other recipe.

**Independent Test**: quickstart.md scenario 4 — save a random dish, reload, confirm it is on the saved screen; the dish itself is gone but the save remains.

- [X] T016 [US3] Confirm the save control already works on a random dish through the existing `lib/saved.tsx` and `ResultList` path; if `RandomDish` renders its own card instead of reusing `ResultList`, refactor it to reuse that path rather than duplicating the save logic (FR-108, SC-107)
- [ ] T017 [US3] Verify a saved random dish is indistinguishable from an ingredient-based one on `app/saved/page.tsx` and survives a reload, with no new `localStorage` key introduced (FR-108, FR-109, SC-107)

**Checkpoint**: All three user stories work.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification across the feature

- [X] T018 [P] Review the new copy in `messages/fa.ts` and `app/components/RandomDish.tsx` for stray Latin text in anything user-facing (FR-111)
- [ ] T019 [P] Check the button and a returned recipe at ~390px and ~1440px: no horizontal scrolling, no clipped controls, text right-aligned RTL (FR-112, quickstart.md scenario 6)
- [X] T020 Confirm no new storage: `localStorage` still appears only in `lib/saved.tsx` and `lib/theme.tsx`, and a reload clears the random dish and the seen list (FR-109, quickstart.md scenario 6)
- [X] T021 Confirm `/api/suggest` is byte-identical to its pre-feature state — `git diff` on `app/api/suggest/route.ts` MUST be empty — proving the Principle IV promise that this feature only adds
- [X] T022 Run `npx tsc --noEmit`, `npx eslint .`, and `npm run build`, then confirm `GEMINI_API_KEY` appears nowhere under `.next/static/` (FR-016, inherited from feature 001)
- [ ] T023 Walk all six quickstart.md scenarios and record pass/fail in its sign-off table. Scenarios 1–4 need a working key and, in a blocked region, a VPN — see quickstart.md Prerequisites

---

## Dependencies

**Phase order**: Setup (T001) → Foundational (T002–T005) → US1 (T006–T011) → US2 (T012–T015) → US3 (T016–T017) → Polish (T018–T023)

**Story dependencies**:

- **US1** depends only on Setup and Foundational. It is a complete, shippable slice — one press, one dish.
- **US2** extends the route and the component built in US1; it needs both to exist.
- **US3** is mostly verification: if T010 reuses the existing card path as instructed, US3 is already satisfied and T016 becomes a check rather than a build.

US2 and US3 both touch `app/components/RandomDish.tsx`, so run them in sequence, not in parallel.

**Task-level dependencies within US1**: T007 depends on T003, T004, T005, T006. T008 depends on T007. T010 depends on T009 and the route being callable. T011 depends on T010.

## Parallel Execution Examples

**Foundational**: T002 and T003 touch different files — run together. T004 then T005, since T005 consumes the prompt.

**US1**: no `[P]` tasks — T006, T007, T008 all edit `app/api/random/route.ts`, and T010, T011 are sequential on the UI.

**US2**: no `[P]` tasks — every task edits either the route or the component another task in the phase also edits.

**Polish**: T018 and T019 are independent reviews — run together.

## Implementation Strategy

**MVP**: Phases 1–3 (T001–T011). One press, one Persian dish, rendered and readable. Demoable on its own.

**Increment 2**: Phase 4 (T012–T015). Repeat-avoidance, which is what makes rejecting a suggestion cheap enough for the feature to feel usable.

**Increment 3**: Phase 5 (T016–T017). Saving — largely free if T010 reused the existing card path.

**Close**: Phase 6 (T018–T023), ending with the full quickstart walkthrough. T021 is the one that proves this feature kept its Principle IV promise.

---

## Phase 7: Convergence

**Purpose**: Close gaps found by `/speckit-converge` between the artifacts and the code as it currently stands. Appended 2026-09-09; existing tasks above are untouched.

- [X] T024 Enforce the no-repeat rule in code, not only in the prompt: in `app/api/random/route.ts`, compare the returned `recipe.title` against the submitted `seenTitles` and handle a collision deterministically — either one bounded re-ask or an explicit documented accept — so a model that ignores the exclusion instruction cannot silently break the guarantee, per FR-104 and SC-102 (partial). Feature 001 made the same call for FR-008 and put the rule in code because prompt wording drifts; research.md §2 chose prompt-only exclusion and §4 rejected unbounded re-rolling, so keep any retry bounded to one and inside the 30-second ceiling
- [X] T025 Announce the random flow's state changes to assistive technology in `app/components/RandomDish.tsx`: a `role="status" aria-live="polite"` region covering the processing-to-result transition, and `role="alert"` on the error, matching the pattern already established in `app/components/StatusPanel.tsx`, per Constitution "Quality: predictable AI-dependent UX" — a screen-reader user currently gets no signal that a request started or that a dish arrived (missing)
- [X] T026 Record the `app/components/ResultList.tsx` touch-point in `specs/002-random-recipe-button/plan.md`: this feature added an optional `heading` prop so a single random dish renders through the existing card, but the plan's structure block omits the file while naming `errors.ts` and `saved.tsx` as UNTOUCHED, per plan: touch-point list (unrequested). The edit itself is correct and required by FR-102 — only its absence from the plan needs fixing, so do not revert it

---

## Phase 8: Convergence

**Purpose**: Close the gap found by the second `/speckit-converge` run. Appended 2026-09-09; existing tasks above are untouched.

- [X] T027 Share one 30-second deadline across both random-dish attempts, per contracts/random-api.md invariant 3 and FR-106 (contradicts). `lib/gemini.ts` starts a fresh `REQUEST_TIMEOUT_MS` timer inside `requestRandomDish`, so the retry added by T024 lets `app/api/random/route.ts` run for up to ~60 seconds. Thread a remaining-budget or absolute-deadline argument through `requestRandomDish`, or skip the second attempt when too little of the window is left, so the route itself honors the ceiling. Note the reason this matters beyond the number: research.md §6 chose to abort rather than ignore the call precisely so no work keeps running against the API after the user has been told it failed, and the current retry reintroduces that. Do not change the client-side guard, which already caps the user's wait correctly
