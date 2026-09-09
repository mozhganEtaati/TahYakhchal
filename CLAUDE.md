# Working in this repository

A Persian RTL recipe app built with Spec Kit. Read this before changing code — several
constraints here are governance, not preference, and breaking one is a real defect.

## Where the truth lives

`.specify/memory/constitution.md` governs the project. `specs/NNN-*/spec.md` owns
requirements; `plan.md` owns technical decisions; `tasks.md` tracks what is done.

**Every capability must trace to an approved spec** (Principle I). If a change adds behavior
the spec does not describe, amend the spec first — do not build ahead of it. If a request is
ambiguous about whether it is spec content, ask.

## Invariants — verify these after any change

Each is a one-line check. If one fails, the change is wrong.

```bash
# 1. The API key never reaches the browser
npm run build && grep -r "GEMINI_API_KEY" .next/static/ && echo FAIL || echo PASS

# 2. Only two modules may touch localStorage
grep -rl "localStorage" app lib components   # must be exactly lib/saved.tsx, lib/theme.tsx

# 3. No server-side storage anywhere
grep -rn "sessionStorage\|document.cookie\|Set-Cookie\|writeFile" app lib   # must be empty

# 4. Nothing user-facing outside messages/fa.ts
#    All Persian copy belongs in one file so FR-007 stays checkable by reading it
```

Beyond those, always: `npx tsc --noEmit && npx eslint . && npm run build`.

## Contract stability (Principle IV)

`POST /api/suggest` and `POST /api/random` are promises to every future feature. Adding an
endpoint or an **optional** field is fine. Changing a field's shape or meaning, removing one,
making an optional field required, or reusing an error code for a new meaning is a breaking
change that requires a constitution amendment first.

When a feature claims it only adds, prove it — feature 002 did this by hashing
`app/api/suggest/route.ts` before and after and requiring the two to match.

## Persistence

The server is stateless. The only two things that outlive a visit are **saved recipes** and
the **theme choice**, both in the viewer's own browser, both justified in FR-013a of feature
001. Anything else that wants to persist needs its own written justification in a spec first
— what is stored, why, and for how long. Do not add a cache "for speed".

## Conventions

- **Persian copy** goes in `messages/fa.ts`, never inline in a component. Do not put an emoji
  in a button label that already renders a lucide icon — that ships two icons.
- **Design tokens** are in `app/globals.css` under Tailwind v4 `@theme`: `shab` (ground),
  `taaqche` (surface), `limu` (primary action), `nana` (wayfinding), `zaferan` (warmth,
  reserved for food), `barf`/`mist` (text). Use the tokens, not raw hex.
- **Motion**: one orchestrated load moment exists, in the hero. Everything else must answer a
  user action. Do not add fade-up entrances to every section. All motion respects
  `useReducedMotion`.
- **shadcn/ui primitives** in `components/ui/` are vendored and editable; regenerate with
  `npx shadcn@latest add <name>` rather than hand-writing equivalents.
- **RTL**: use logical properties (`ms-`, `me-`, `start-`, `end-`), never `ml-`/`left-`.

## Gemini

`lib/gemini.ts` is the only reader of `GEMINI_API_KEY`, and imports `server-only` so that
stays true. Model id comes from `GEMINI_MODEL` with a `gemini-flash-latest` default — model
ids retire (`gemini-2.5-flash` already did), so change the env var, not the code.

Two upstream failures look identical to the user and are distinguished only in the server
log: a retired model, and Google's regional block. Neither is a code fault. Both surface to
the user as the friendly Persian `SERVICE_ERROR` message, which is correct.

## Testing posture

There is no automated suite, deliberately: this is a workshop demo, no principle requires
one, and the reasoning is recorded in each plan's Constitution Check. Acceptance is the
numbered scenarios in `specs/<feature>/quickstart.md`. If you add a rule that genuinely needs
regression protection, tests become that feature's cost — say so in its plan rather than
adding them silently.

