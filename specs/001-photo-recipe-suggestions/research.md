# Phase 0 Research: Photo-Based Recipe Suggestions

**Feature**: `001-photo-recipe-suggestions` | **Date**: 2026-09-09

All Technical Context items were supplied by the user or derived from the spec; no
`NEEDS CLARIFICATION` markers remain. This document records why each choice was made so a
later session can revisit it without re-deriving the reasoning.

## 1. Application shape

**Decision**: One Next.js 15 App Router project in TypeScript, with the AI call in a route
handler at `app/api/suggest/route.ts`.

**Rationale**: The API key must stay server-side (user requirement, and a client-visible key
would be a security defect). A route handler is the smallest thing that provides a server
boundary while keeping one deploy unit, one `package.json`, and one dev command — which
matters for a live workshop. `next dev` also gives RTL layout and responsive work a normal
React feedback loop.

**Alternatives considered**: A Vite SPA plus an Express backend — rejected as two processes
and two deploys for no gain at this scale. A static page plus a serverless function —
rejected because it pins the plan to a specific host, which the user explicitly deferred.

## 2. Number of Gemini calls

**Decision**: A single call. The photos and one instruction go to the model together; it
returns recognized ingredients and 2–3 recipes in one JSON reply.

**Rationale**: The user asked for whichever chaining is simplest. A vision-capable model can
identify items and compose recipes in one pass, and one call is the only shape that fits
comfortably inside the 30-second ceiling. Two chained calls (recognize, then generate) would
double latency and add a second failure point for no behavioral benefit — the spec never
shows the user a standalone recognition step.

**Alternatives considered**: Recognize-then-generate chaining — rejected for latency and
complexity. Client-side pre-recognition — rejected outright; it would expose the key.

## 3. Model and SDK

**Decision**: The Google Gen AI JS SDK (`@google/genai`), calling a vision-capable Gemini
model. The model id is read from `process.env.GEMINI_MODEL` with a sensible flash-tier
default, so it can be swapped without a code change.

**Rationale**: `.env.example` already documents `GEMINI_API_KEY` and an optional
`GEMINI_MODEL`, so the plan follows what the repository already declares. A flash-tier model
is the right latency/cost point for a demo that must answer inside 30 seconds. Keeping the
id in an environment variable means a model rename never becomes a code edit mid-workshop.

**Verify at implementation time**: pin the exact SDK version and confirm the current model
id from Google's docs before writing `lib/gemini.ts` — model ids and SDK package names move
faster than this document does.

**Confirmed 2026-09-09 against the live API** (`@google/genai` 1.52.0):

- `gemini-2.5-flash` returns 404 for new keys — "no longer available to new users",
  with Google's error naming `gemini-3.6-flash` as the replacement. The default is now
  `gemini-flash-latest`, overridable via `GEMINI_MODEL`.
- **Environment constraint, not a code fault**: from this machine's location the API returns
  `400 FAILED_PRECONDITION — "User location is not supported for the API use."` for every
  model. The key and the request are valid; Google blocks the region. Running the live demo
  requires a VPN or proxy terminating in a supported region, or a proxy layer in front of the
  API. The app degrades correctly in the meantime: the failure maps to `SERVICE_ERROR` and
  the user sees the friendly Persian message rather than a raw error (FR-011).

**Alternatives considered**: Raw `fetch` against the REST endpoint — viable and dependency-
free, but hand-rolling multipart image encoding and error shapes costs more than the SDK
saves. A non-Google provider — rejected; the key the user holds is a Gemini key.

## 4. Getting structured output back

**Decision**: Ask the model for JSON via its structured-output/response-schema setting, then
re-validate the parsed reply with `zod` on the server before it is trusted.

**Rationale**: FR-009 forbids showing fabricated or malformed recipes. Model-side schema
enforcement makes well-formed replies the common case; server-side `zod` validation is what
actually guarantees the contract, since a truncated or off-schema reply must become a
friendly error rather than a half-rendered card. Belt and braces, and the braces are cheap.

**Alternatives considered**: Free-text reply plus regex parsing — rejected as brittle and
directly at odds with FR-009. Trusting the model's JSON without validation — rejected for
the same reason.

## 5. Enforcing the ingredient floor (FR-008)

**Decision**: The model returns its recognized non-staple ingredients alongside the recipes;
the server counts them and, when fewer than 2, discards any recipes and returns the
`NO_INGREDIENTS` error code.

**Rationale**: The rule is a hard, countable gate from the clarification session, so it must
live in code the app controls, not in prompt wording the model may drift from. The prompt
still states the rule — that improves compliance — but the server decides.

**Alternatives considered**: Prompt-only enforcement — rejected; unverifiable and
non-deterministic. Client-side counting — rejected; the client should not re-derive rules.

## 6. The 30-second ceiling (FR-011a)

**Decision**: The route handler races the Gemini call against a 30-second `AbortController`
timer. On expiry it aborts the request and returns the `TIMEOUT` error code. The client also
guards the whole `fetch` so a stalled network cannot outlive the ceiling.

**Rationale**: SC-008 says no submission leaves the user waiting past 30 seconds — measured
from the user's seat, so the guarantee has to hold even if the server itself is unreachable.
Aborting rather than merely ignoring the call also avoids leaving work running against the
API after the user has been told it failed.

**Alternatives considered**: A host-level function timeout — rejected; it varies by host and
the deployment target is undecided. No ceiling — rejected; it violates FR-011a.

## 7. Persian text and RTL

**Decision**: `<html lang="fa" dir="rtl">` in the root layout; every user-facing string
lives in `messages/fa.ts`; the prompt instructs the model to answer only in Persian, and the
server rejects a reply whose recipes are empty or blank.

**Rationale**: FR-007 covers both app copy and model output. Centralizing app strings makes
"is all of it Persian?" a one-file review instead of a grep across components. `dir="rtl"`
at the root is what makes native form controls, scrollbars, and text alignment behave
without per-component overrides.

**Alternatives considered**: A full i18n library (next-intl and similar) — rejected; there is
exactly one locale and no switcher, so a library would be infrastructure for a solved
problem the project does not have (Principle I).

## 8. Photo transport and validation

**Decision**: The client validates type and size before upload (JPEG/PNG/WebP/HEIC, 10 MB
per photo, 1–3 photos) and posts them as `multipart/form-data`. The route handler re-checks
the same limits server-side, then converts each file to the inline base64 part the SDK
expects.

**Rationale**: Client checks give an instant Persian error (FR-014) without a round trip;
the server check is what actually enforces the limit, since a client is not a security
boundary. `multipart/form-data` streams binary without the ~33% inflation of a base64 JSON
body.

**Alternatives considered**: Base64 in a JSON body — rejected for payload size. Direct
browser-to-Gemini upload — rejected; it would expose the key.

## 9. Statelessness

**Decision**: No database, no cache, no filesystem writes, no cookies, no session. Photos are
read from the request into memory, sent to Gemini, and dropped when the response is returned.
Results live only in React state and vanish on reload.

**Rationale**: Principle III makes statelessness the default and the spec's FR-013 asks for
exactly this behavior. It is also the simplest thing that works for a single-user demo.

**Alternatives considered**: Caching results by image hash to speed up repeat demos —
rejected; it is persistence with no spec justification, which Principle III says to refuse.

## 10. Testing posture

**Decision**: Manual verification only, scripted in `quickstart.md`.

**Rationale**: The user scoped this as a workshop demo rather than a system under CI, and no
constitution principle or spec requirement calls for automated tests. The behaviors that
matter — loading state, friendly failure, Persian-only copy, the ingredient floor, the
timeout — are all observable from the browser and are written up as numbered scenarios.

**Alternatives considered**: Unit tests for the validator and floor rule — genuinely useful
and the first thing to add if this outgrows the demo, but out of scope by the user's
explicit instruction. Recorded here so the tradeoff is visible rather than forgotten.
