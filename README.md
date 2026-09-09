# ته‌یخچال — TahYakhchal

Point your phone at the fridge, get three Persian recipes you can actually cook from what's
in there. Built with [Spec Kit](https://github.com/github/spec-kit) as a workshop project:
every capability traces from a written spec through a plan and a task list to the code.

## Quick start

```bash
npm install
cp .env.example .env    # then paste your key into GEMINI_API_KEY
npm run dev
```

Open http://localhost:3000.

### Two things that will bite you

**1. The API key must be real.** `.env.example` ships with `GEMINI_API_KEY=` empty. With an
empty key every request returns the friendly Persian failure message — the app is working
correctly, it just has nothing to call. Get a key at
[aistudio.google.com/apikey](https://aistudio.google.com/apikey).

**2. Google blocks the Gemini API from some regions**, including Iran, returning
`400 FAILED_PRECONDITION — "User location is not supported for the API use."` for every
model. A valid key does not help; you need a VPN or proxy terminating in a supported region,
running before you start the dev server. The server log says so explicitly when it happens:

```
[gemini] Google blocks API calls from this location. A VPN or proxy to a
supported region is required — this is not a code fault.
```

If the model id ever retires (`gemini-2.5-flash` already has), set `GEMINI_MODEL` in `.env`
rather than editing code.

## What it does

| Screen | Path | Purpose |
|---|---|---|
| خانه | `/` | Hero, photo slots, one-tap ingredient chips, random-dish button |
| موادِ من | `/ingredients` | What the app recognized, editable, then "ببین چی میشه پخت" |
| ذخیره‌شده‌ها | `/saved` | Recipes you kept, stored in your own browser |

Three ways in: photograph up to 3 shelves, type ingredients yourself, or press the random
button and skip the whole question.

## Architecture

A single Next.js 15 App Router application. No separate backend, no database.

```
app/                  routes, screens, and the two API handlers
components/ui/        shadcn/ui primitives (vendored, editable)
components/           motion primitives (BlurText, Magnet, Spark)
lib/                  Gemini calls, prompts, zod schemas, React contexts
messages/fa.ts        every user-facing Persian string, in one file
specs/                the specs, plans, and task lists this code came from
```

**Stack**: Next.js 15 · React 19 · TypeScript · Tailwind v4 · shadcn/ui · `motion` ·
`@google/genai` · `zod`. Typefaces are Lalezar (display) and Estedad (body), installed as npm
packages so nothing is fetched from a CDN at runtime.

### API

| Endpoint | Body | Returns |
|---|---|---|
| `POST /api/suggest` | `multipart/form-data`: 0–3 `photos`, optional `manualIngredients` JSON array | `{ ok: true, ingredients, recipes }` — 2–3 recipes |
| `POST /api/random` | `application/json`: optional `seenTitles` array | `{ ok: true, recipe }` — exactly one dish |

Both fail as `{ ok: false, code }` with one of `INVALID_UPLOAD`, `NO_INGREDIENTS`,
`NO_RECIPES`, `TIMEOUT`, `SERVICE_ERROR`. Full contracts live in
`specs/*/contracts/`.

## Rules this codebase holds itself to

These come from `.specify/memory/constitution.md` and are worth knowing before you change
anything:

- **The API key never reaches the browser.** `lib/gemini.ts` is the only module that reads
  it, and it imports `server-only` so a client import becomes a build error.
- **The server stores nothing.** No database, no session, no cache, no file writes. Photos
  live in the request and are dropped when the response is sent.
- **Exactly two things persist**, both in the viewer's own browser: saved recipes and the
  theme choice. `lib/saved.tsx` and `lib/theme.tsx` are the only files permitted to touch
  `localStorage` — `grep -rl localStorage app lib components` should return those two and
  nothing else.
- **Contracts extend, never break.** A new feature adds an endpoint or an optional field. It
  does not change the shape or meaning of what already exists.
- **All user-facing text is Persian**, and lives in `messages/fa.ts` so that claim is
  checkable by reading one file.

## Verifying a change

```bash
npx tsc --noEmit && npx eslint . && npm run build
```

Then walk the scenarios in `specs/<feature>/quickstart.md` — they are the acceptance
procedure. There is no automated test suite; that is a recorded decision for a workshop
demo, not an oversight, and the reasoning is in each plan's Constitution Check.

## The spec-kit workflow

Each feature was built by running, in order:

```
/speckit-constitution   → .specify/memory/constitution.md   (once, for the project)
/speckit-specify        → specs/NNN-name/spec.md
/speckit-clarify        → resolves ambiguity back into the spec
/speckit-plan           → plan.md, research.md, data-model.md, contracts/, quickstart.md
/speckit-tasks          → tasks.md
/speckit-analyze        → cross-artifact consistency check
/speckit-implement      → the code
```

Features so far:

- `specs/001-photo-recipe-suggestions/` — the core app, all three screens
- `specs/002-random-recipe-button/` — the random dish button

## Known gaps

Tracked in the task lists; none blocks normal use.

- The browser-based checks — responsive behavior at 390px and 1440px, and the DevTools
  storage inspection — were reasoned about from the code but never viewed in a browser.
- The live recipe path is unverified end to end from a region-blocked machine.
- `npm audit` reports PostCSS advisories reached only through Next's build tooling. Not a
  runtime exposure here; `audit fix --force` would downgrade Next.
- The hero figure is a stock cartoon holding a pizza, which is off-cuisine for the app.
  Swap `public/chef.png` for any transparent PNG — no code change needed.
