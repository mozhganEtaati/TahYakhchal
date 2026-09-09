# Phase 0 Research: Random Recipe Button

**Feature**: `002-random-recipe-button` | **Date**: 2026-09-09

No `NEEDS CLARIFICATION` markers remain. Feature 001 already settled the stack, the provider,
the timeout, and the error vocabulary, so this document only records decisions specific to
this feature.

## 1. New endpoint or a flag on the existing one

**Decision**: A new `POST /api/random`. `/api/suggest` is not modified in any way.

**Rationale**: The two requests differ in every meaningful respect — one carries photos and an
ingredient pool and enforces the FR-008 two-ingredient floor; the other carries neither and
must skip that floor entirely. Folding both into one endpoint would mean a mode flag that
silently disables validation, which makes the contract harder to reason about and puts
feature 001's guarantees at risk on every future edit. Principle IV explicitly allows new
endpoints and warns against changing the meaning of existing ones, so this is the sanctioned
shape.

**Alternatives considered**: A `mode=random` field on `/api/suggest` — rejected for the reason
above. A `GET` with query params — rejected because the seen-titles exclusion list grows with
each press and belongs in a body, not a URL.

## 2. Achieving randomness

**Decision**: Ask the model for one dish, passing the titles already seen this visit as an
explicit exclusion list, and raise the sampling temperature for this call only.

**Rationale**: The model is the source of variety, so the honest way to get a different answer
is to tell it what has already been used and to sample less deterministically. A default-
temperature call with the same prompt tends to return the same handful of well-known dishes,
which would fail SC-102 (five presses, five dishes) on the second press. The exclusion list
makes repeat-avoidance a property of the request rather than a retry loop.

**Alternatives considered**: A bundled list of Persian dishes picked at random client-side —
rejected under Principle II; it is a hand-built database for a problem the adopted service
already solves, and it caps variety at whatever was hardcoded. Re-rolling on the server until
a new title appears — rejected as it multiplies latency against a 30-second ceiling and can
loop when the model is stubborn.

## 3. Where the seen-this-visit list lives

**Decision**: In the existing `lib/session.tsx` context, as a plain array of titles. Sent up
with each request. Never stored.

**Rationale**: FR-109 says the dish itself must not outlive the visit, and the same logic
applies to the memory of what was shown. Session context is already the project's designated
home for in-visit state that survives navigation but dies on reload, so this needs no new
mechanism. Keeping it client-side also keeps the server stateless, which Principle III
requires.

**Alternatives considered**: A server-side set keyed by session — rejected outright; it is a
server-side session, which Principle III names as prohibited. `localStorage` — rejected; FR-013a
permits exactly two stored values and this is not one of them.

## 4. Exhausting the pool

**Decision**: When the exclusion list grows long, allow repeats rather than failing. Cap the
list sent upstream at roughly the 40 most recent titles.

**Rationale**: The spec's edge case is explicit that a repeat is more useful than an error. An
unbounded exclusion list would also grow the prompt on every press, eventually crowding the
request for no benefit — after a few dozen dishes in one sitting, a repeat is a perfectly
acceptable outcome and the user has long since found something to cook.

**Alternatives considered**: Failing with a dedicated "no more ideas" message — rejected; it
invents a new error code and a new user-facing state for a situation nobody will reach
legitimately.

## 5. Reusing the recipe shape

**Decision**: A random dish is a `RecipeSuggestion` — the same schema, validated by the same
`recipeSuggestionSchema` from `lib/schema.ts`, rendered by the same card, saved by the same
store.

**Rationale**: FR-102 asks for interchangeability, and reuse is what delivers it: a saved
random dish is indistinguishable from a saved ingredient-based one (SC-107) because it is
literally the same structure. It also means FR-107's "no partial recipes" rule is enforced by
validation that already exists and is already proven, rather than by a second implementation
that could drift.

**Alternatives considered**: A distinct `RandomDish` type with its own card — rejected; it
would duplicate rendering and saving logic and break SC-107 the moment the two drift.

## 6. Failure handling

**Decision**: Reuse `TIMEOUT` and `SERVICE_ERROR` from `lib/errors.ts` unchanged. Add no new
error codes.

**Rationale**: Every failure this feature can produce — unreachable service, timeout, malformed
reply, a dish that fails validation — is already covered by one of those two, and both already
map to friendly Persian messages. Adding codes would mean new copy for situations the user
cannot distinguish anyway. The `NO_INGREDIENTS` and `NO_RECIPES` codes are deliberately not
used here: there is no ingredient floor in this flow.

**Alternatives considered**: A `NO_DISH` code — rejected as indistinguishable from
`SERVICE_ERROR` from the user's seat.
