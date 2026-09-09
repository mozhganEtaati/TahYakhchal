# Implementation Plan: Photo-Based Recipe Suggestions

**Branch**: `001-photo-recipe-suggestions` | **Date**: 2026-09-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-photo-recipe-suggestions/spec.md`

## Summary

A home cook submits 1–3 photos of their fridge or counter; the app returns 2–3 Persian
recipes makeable from what it can see, each with a title, the ingredients it uses, and
step-by-step instructions. When fewer than 2 non-staple ingredients are recognized, it
returns a friendly Persian "upload a different photo" message instead of inventing a dish.

Technical approach: a single Next.js App Router application in TypeScript. The browser
page is a client component that collects photos and renders one of four states (idle,
processing, results, error). It POSTs the photos as `multipart/form-data` to a server-side
route handler, which is the only place `GEMINI_API_KEY` is read. That route sends the
images to a vision-capable Gemini model in a single call that both recognizes ingredients
and drafts recipes, validates the model's JSON reply against a strict schema, and returns
either recipes or a typed error code. Nothing is written to disk or a database; the photo
bytes live only in the request and are released when the response is sent.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 20+ (local toolchain is Node 24.11.1)

**Primary Dependencies**: Next.js 15 (App Router, React 19), `@google/genai` (Google Gen AI
JS SDK), `zod` for validating the model's JSON reply. UI: Tailwind CSS v4 + shadcn/ui
primitives (button, card, input, badge, skeleton, separator — vendored into
`components/ui/`, not an npm runtime dependency), `motion` for animation, `lucide-react` for
icons. Typefaces `@fontsource/lalezar` (display) and `@fontsource-variable/estedad` (body),
self-hosted so no CDN is fetched at runtime.

**Storage**: No database, no file storage, no server-side cache, no server-side session —
the server is fully stateless and uploaded bytes exist only for the lifetime of the request.
Two values live in the viewer's own browser via `localStorage`, under the FR-013a carve-out:
saved recipes and the theme choice. Nothing else is stored, and nothing leaves the browser.

**Testing**: Manual verification against `quickstart.md`. No automated suite; see
Constitution Check for why this does not violate any principle.

**Target Platform**: Any standard Node.js-compatible host. Deployment target deliberately
undecided; the plan avoids host-specific APIs so it runs under `next start` anywhere.

**Project Type**: Single web application (Next.js frontend + its own server routes).

**Performance Goals**: One request at a time, single-user demo. End-to-end result or error
within 30 seconds (FR-011a, SC-008); first paint of the idle page is a static render.

**Constraints**: `GEMINI_API_KEY` is server-only and must never reach the client bundle;
`.env` stays gitignored. Hard 30-second ceiling on the Gemini call. All user-facing text in
Persian, RTL. Usable on mobile and desktop viewports.

**Scale/Scope**: Three screens (home, my ingredients, saved), one API route, ~8 supporting
modules. No concurrent-load planning.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

Constitution v1.0.1.

| Principle | Verdict | Evidence |
|---|---|---|
| I. Minimal Surface Area | PASS | Every module below maps to an FR in spec.md. No feature is planned that the spec does not describe; no auth, no history, no sharing, no ratings. |
| II. External-Service-First | PASS | Recognition and recipe generation are delegated entirely to the Gemini API. No custom model, no training, no bespoke image processing. Provider named here in Technical Context, as the principle requires — not in the constitution. The UI layer follows the same rule: shadcn/ui primitives and `motion` are adopted rather than hand-rolled, and the two Persian typefaces are installed rather than reimplemented. |
| III. No Persistence Without Justification | PASS, with a spec-justified carve-out | None of the four things the principle names is present: no database, no file storage, no server-side cache, no server-side session. The server stays fully stateless and photos are stored nowhere. Two values live in the viewer's own browser: saved recipes and the theme choice. FR-013a states what is stored, why, and for how long in the spec's own text — the written justification the principle requires — and FR-013 still forbids everything else. Not a dilution: statelessness remains the default, with one narrow, user-initiated exception. |
| IV. Contract Stability Across Features | PASS | This is the first feature, so it establishes rather than changes a contract. `contracts/suggest-api.md` documents it so later features extend rather than break it. |
| Quality: predictable AI-dependent UX | PASS | The client renders an explicit processing state for the whole request duration; the submit control is disabled while in flight (FR-010). |
| Quality: graceful AI failure | PASS | The route handler maps every failure — timeout, transport error, malformed model output, refusal — to a typed error code; the client renders a friendly Persian message for each. No raw error text reaches the user (FR-011). |
| Quality: cross-device usability | PASS | Single-column responsive layout, tested at mobile and desktop widths per quickstart.md (FR-015). |
| Workflow: lifecycle order | PASS | spec.md → clarify → this plan. `/speckit-tasks` follows. |

**Testing posture**: no constitution principle and no spec requirement mandates automated
tests. The constitution's quality constraints are behavioral (loading state, graceful
failure, cross-device) and are verified by the scripted scenarios in `quickstart.md`. This
is a recorded decision, not an omission — if a later feature adds a rule that needs
regression protection, tests become that feature's cost.

**Post-Phase-1 re-check**: PASS. The design added no storage, no second service, no
capability outside the spec. See `research.md` for the decisions behind each choice.

## Project Structure

### Documentation (this feature)

```text
specs/001-photo-recipe-suggestions/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── suggest-api.md   # Phase 1 output
├── checklists/
│   └── requirements.md  # From /speckit-specify
└── tasks.md             # Created by /speckit-tasks, not here
```

### Source Code (repository root)

```text
app/
├── layout.tsx            # <html lang="fa" dir="rtl">, theme script, providers, nav, footer
├── page.tsx              # Home: hero + chef figure, two CTAs, chips, slots, how-it-works
├── ingredients/page.tsx  # My ingredients: editable list, free-text add, ask for recipes
├── saved/page.tsx        # Saved recipes, with empty state
├── globals.css           # Tailwind v4 @theme tokens for dark + light, base + utilities
├── components/
│   ├── SiteNav.tsx       # Client: three-screen nav + theme toggle
│   ├── PhotoSlots.tsx    # Client: up to 3 photo slots, validation, HEIC chip fallback
│   ├── QuickChips.tsx    # Client: one-tap common ingredients
│   ├── IngredientList.tsx# Client: rename / remove / add ingredients
│   ├── ResultList.tsx    # Client: recipe cards with a save control
│   ├── StatusPanel.tsx   # Client: processing / error states
│   ├── EmptyState.tsx    # Client: shared friendly empty state
│   └── RandomDish.tsx    # Client: feature 002 — random dish control and result
└── api/
    ├── suggest/route.ts  # Server-only POST handler; a reader of GEMINI_API_KEY
    └── random/route.ts   # Feature 002 — second server-only handler

components/               # Design-system layer, outside the route tree
├── ui/                   # shadcn/ui primitives, vendored: button, card, input,
│                         #   badge, skeleton, separator
└── motion-primitives.tsx # ReactBits patterns on `motion`: BlurText, Magnet, Spark

lib/
├── gemini.ts             # Builds both Gemini requests, enforces the 30s ceiling
├── prompt.ts             # Persian system prompts + JSON response schemas
├── schema.ts             # zod schemas for the model replies and the API responses
├── errors.ts             # Error codes shared by routes and client
├── session.tsx           # Client: in-visit state (photos, ingredients, suggestions, random)
├── saved.tsx             # Client: saved recipes, the FR-013a localStorage carve-out
├── theme.tsx             # Client: theme choice, the other FR-013a value
└── utils.ts              # cn() class merger required by the shadcn primitives

messages/
└── fa.ts                 # Every user-facing Persian string in one place

public/
└── chef.png              # Decorative hero figure (see Assumptions in spec.md)

.env                      # Already exists, gitignored — GEMINI_API_KEY, optional GEMINI_MODEL
.env.example              # Already exists — documents the same keys, no values
components.json           # shadcn/ui config: aliases, base colour, RSC mode
postcss.config.mjs        # Tailwind v4 via @tailwindcss/postcss
eslint.config.mjs         # Flat config extending next/core-web-vitals
```

**Kept current as of 2026-09-09.** Files marked "feature 002" belong to
`specs/002-random-recipe-button/` and are listed here only so this tree matches the
repository; that feature owns their requirements.

**Structure Decision**: Single Next.js project at the repository root. The App Router gives
one deployable unit where the API route and the page ship together, which is what keeps the
API key server-side without standing up a second service. `lib/` holds pure, UI-free logic
(prompt construction, schema validation, timeout) so the route handler stays thin.
`messages/fa.ts` centralizes Persian copy so FR-007 is verifiable by reading one file.

In-visit state (photos, the working ingredient list, current suggestions) lives in a React
context in `lib/session.tsx` so it survives navigation between the three screens but dies on
reload, exactly as FR-013 requires. The two persisted values are isolated in `lib/saved.tsx`
and `lib/theme.tsx` — the only two modules in the codebase permitted to touch
`localStorage`, which makes the FR-013a boundary reviewable by grepping for one API name.

## Complexity Tracking

No constitution violations. Section intentionally empty.
