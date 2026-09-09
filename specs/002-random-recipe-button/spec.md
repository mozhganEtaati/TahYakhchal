# Feature Specification: Random Recipe Button

**Feature Branch**: `002-random-recipe-button`

**Created**: 2026-09-09

**Status**: Draft

**Input**: User description: "i want to have a button for random food and i see instruction"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Give me one dish, I'll decide later (Priority: P1)

A cook opens the app with no photo to take and no list to type. They press a single button
and get one Persian dish: its name, the ingredients it needs, and step-by-step instructions.
They read the steps and decide whether to cook it.

**Why this priority**: This is the whole feature. It gives the app a use for the moments when
the cook has no fridge photo and no patience for typing — the "I just want an idea" moment.

**Independent Test**: Press the random button from the home screen with nothing else entered
and confirm one complete Persian recipe appears with a title, ingredients, and ordered steps.

**Acceptance Scenarios**:

1. **Given** a user on the home screen with no photos and no ingredients entered, **When**
   they press the random dish button, **Then** the app shows a visible processing state and
   then one recipe with a Persian title, its ingredient list, and ordered Persian steps.
2. **Given** a returned random recipe, **When** the user reads it, **Then** the instructions
   are complete enough to cook from without opening anything else.
3. **Given** a returned random recipe, **When** the user presses the random button again,
   **Then** a different dish appears — not the one they just saw.

---

### User Story 2 - Not that one, give me another (Priority: P2)

The cook does not like the dish they were given. They press again and get a different one,
and keep going until something appeals.

**Why this priority**: A random suggestion is only useful if rejecting it is cheap. Without
repeat-avoidance the feature feels broken on the second press, but the first press already
delivers value, so this follows P1.

**Independent Test**: Press the button five times in a row and confirm five different dishes.

**Acceptance Scenarios**:

1. **Given** the user has seen one random dish, **When** they press again, **Then** the new
   dish differs from the previous one.
2. **Given** the user has pressed several times in one visit, **When** they press again,
   **Then** the app avoids repeating any dish already shown in this visit, until the pool of
   fresh ideas is exhausted.
3. **Given** a request is already processing, **When** the user presses again, **Then** the
   app ignores the second press rather than starting an overlapping request.

---

### User Story 3 - Keep the one I liked (Priority: P3)

The cook likes a random dish and saves it, the same way they save a suggestion built from
their own ingredients. It waits on the saved screen for later.

**Why this priority**: Reuses machinery that already exists, and only matters once dishes are
being produced. Cheap to add, but not what makes the feature worth building.

**Independent Test**: Save a random dish, reload the page, and confirm it is on the saved
screen.

**Acceptance Scenarios**:

1. **Given** a random recipe on screen, **When** the user presses its save control, **Then**
   it appears on the saved screen alongside recipes from the ingredient flow, indistinguishable
   from them.
2. **Given** a saved random recipe, **When** the user reloads, **Then** it is still saved.

---

### Edge Cases

- The suggestion service is unreachable, times out, or returns something unusable: the app
  shows the same friendly Persian failure message used elsewhere, with a way to try again.
- The user presses the button repeatedly and quickly: only one request runs at a time; extra
  presses while processing are ignored.
- The pool of unseen dishes runs out within a visit: the app may repeat an earlier dish
  rather than failing, since a repeat is more useful than an error.
- The user has photos or ingredients already entered: the random button ignores them
  entirely and still returns an unrelated dish — it is not a shortcut into the ingredient
  flow.
- The user leaves the page: the random dish is gone unless it was saved.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-101**: The app MUST offer a clearly labeled control that returns one random Persian
  dish, reachable without entering photos or ingredients.
- **FR-102**: Each returned dish MUST include a Persian title, the ingredients it needs, and
  ordered step-by-step Persian instructions — the same shape as an ingredient-based
  suggestion, so the two are interchangeable wherever recipes are displayed.
- **FR-103**: The instructions MUST be complete enough to cook the dish from start to finish
  without consulting another source.
- **FR-104**: Pressing the control again MUST return a dish the user has not been shown in
  the current visit, until no unseen dish remains; only then may one repeat.
- **FR-105**: While a random request is processing, the app MUST show a visible processing
  state and MUST ignore further presses until it finishes.
- **FR-106**: If the request fails, times out, or returns an unusable result, the app MUST
  show a clear, friendly Persian message and allow a retry; it MUST NOT show a raw error or
  an incomplete recipe.
- **FR-107**: The app MUST NOT invent a partial recipe: a returned dish either has a title,
  ingredients, and at least two steps, or it is treated as a failure.
- **FR-108**: A random dish MUST be savable and removable through the same saved-recipes
  mechanism as any other recipe.
- **FR-109**: The random dish MUST NOT persist beyond the visit unless the user saves it.
- **FR-110**: The random control MUST ignore any photos or ingredients the user has already
  entered, and MUST NOT clear them.
- **FR-111**: All user-facing text for this feature MUST be in Persian, presented
  right-to-left.
- **FR-112**: The control and the resulting recipe MUST be usable on both mobile and desktop
  browser viewports.

### Key Entities

- **Random Dish Request**: One press of the control. Carries no photos and no ingredient
  list — only the set of dish titles already shown this visit, so they can be avoided.
- **Seen-This-Visit List**: The dish titles already shown in the current visit. Exists only
  in the visit; never stored.
- **Recipe Suggestion**: Unchanged from feature 001 — a Persian title, the ingredients it
  uses, and ordered steps. A random dish produces exactly this, which is what lets it reuse
  the existing display and saving behavior.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-101**: A user with no photo and no typed ingredients can go from opening the app to
  reading a complete recipe in under 30 seconds and a single press.
- **SC-102**: Five consecutive presses in one visit return five different dishes in 100% of
  runs.
- **SC-103**: 100% of returned dishes include a title, at least one ingredient, and at least
  two ordered steps; 0% are partial.
- **SC-104**: In review, at least 90% of returned dishes are judged cookable from the
  instructions alone, without consulting another source.
- **SC-105**: 100% of user-facing text in this flow — button, processing state, recipe, error
  — is in Persian.
- **SC-106**: No press leaves the user waiting longer than 30 seconds before either a recipe
  or a friendly failure message appears.
- **SC-107**: A saved random dish is indistinguishable from a saved ingredient-based dish on
  the saved screen, and survives a reload in 100% of cases.

## Assumptions

- "Random food" means a random Persian dish, matching the app's audience and existing recipe
  voice. Dishes from other cuisines are out of scope.
- The dish is generated fresh rather than drawn from a fixed built-in list, so the variety is
  not bounded by a hardcoded set. This keeps the feature consistent with the project's
  external-service-first principle rather than shipping a recipe database.
- The random dish is unrelated to anything the user has in their fridge. This is a
  "surprise me" feature, not a filtered search.
- Repeat-avoidance covers the current visit only. A dish seen yesterday may appear again
  today, consistent with the app storing nothing but saved recipes.
- The 30-second waiting ceiling, the friendly failure message, and the loading state are the
  same ones feature 001 already established; this feature reuses them rather than defining
  new behavior.
- Ingredient quantities, portion sizes, cooking times, nutrition, images, dietary filters,
  and cuisine or difficulty selection are all out of scope.
- No new persistence is introduced: the only thing that outlives the visit is a recipe the
  user explicitly saves, through the mechanism feature 001 already justified.
