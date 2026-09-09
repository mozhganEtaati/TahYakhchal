# Feature Specification: Photo-Based Recipe Suggestions

**Feature Branch**: `001-photo-recipe-suggestions`

**Created**: 2026-09-09

**Status**: Draft

**Input**: User description: "TahYakhchal helps a home cook figure out what to make from what they already have. A user uploads 1 to 3 photos — their open fridge, and/or ingredients laid out on a counter. The app looks at what's visible and suggests 2 to 3 recipes the user could realistically make with those ingredients, each with a title and step-by-step cooking instructions. All user-facing text — labels, messages, and the recipe suggestions and instructions themselves — is in Persian. If the uploaded photos don't show any recognizable food or ingredients (a blurry photo, an empty fridge, an unrelated image), the app shows a simple, friendly error message and asks the user to upload a different photo. It never guesses or fabricates a recipe from unclear input. There is no login and no saved history — each visit starts fresh, and the user can't revisit past suggestions after leaving the page."

## Clarifications

### Session 2026-09-09

- Q: When the photos show only a couple of recognizable ingredients, what should decide between showing recipes and showing the "upload a different photo" message? → A: Fewer than 2 recognized ingredients (excluding pantry staples) triggers the error message; 2 or more attempts recipes.
- Q: Should each suggested recipe also list which of the spotted ingredients it uses, or show only a title and cooking steps? → A: Title, then the list of spotted ingredients that recipe uses, then the steps — no quantities.
- Q: How long may the app keep the user waiting after they submit photos before it gives up and shows the friendly failure message? → A: 30 seconds, then show the failure message with a retry.

### Session 2026-09-09 (design amendment)

Design mockups introduced three screens, manual ingredient entry, ingredient correction, a
dark theme, and saved recipes. Two decisions were required before amending:

- Q: How should saved recipes (ذخیره‌شده‌ها) survive? → A: Browser `localStorage` — no database, no server-side session, no account. FR-013 is amended with an explicit carve-out and the justification Principle III requires.
- Q: How much of the mockups should land in this amendment? → A: All three screens: home, my-ingredients, and saved.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get recipes from a photo of what I have (Priority: P1)

A home cook opens the app, uploads one photo of their open fridge, and asks for
suggestions. The app examines the photo, identifies the food items it can see, and
returns 2 to 3 recipes that can realistically be cooked from those items. Each recipe
shows a title and numbered, step-by-step cooking instructions, all in Persian.

**Why this priority**: This is the entire product value. Without it there is no app —
every other story is a refinement of, or a guard around, this one flow.

**Independent Test**: Upload a single clear photo containing recognizable ingredients
and confirm 2–3 Persian recipes with titles and ordered steps appear on screen. This
alone is a shippable MVP.

**Acceptance Scenarios**:

1. **Given** a user on the start screen with no photo selected, **When** they select one
   clear photo of an open fridge containing recognizable ingredients and submit it,
   **Then** the app displays between 2 and 3 recipe suggestions, each with a Persian
   title, the ingredients it uses, and Persian step-by-step instructions.
2. **Given** a submitted photo whose ingredients are recognizable, **When** the results
   are displayed, **Then** every suggested recipe's required ingredients are drawn from
   the items visible in the photo, plus only the common pantry staples listed in the
   Assumptions section.
3. **Given** a user viewing results, **When** they read any label, button, message, or
   recipe text, **Then** all of it is in Persian and laid out right-to-left.

---

### User Story 2 - Combine several photos of my ingredients (Priority: P2)

The cook's ingredients are in more than one place — some in the fridge, some on the
counter. They upload up to 3 photos in a single request, and the app treats every item
across all photos as one shared pool of available ingredients when suggesting recipes.

**Why this priority**: It meaningfully improves suggestion quality for real kitchens,
but the app is already useful with a single photo, so it comes after P1.

**Independent Test**: Upload 2 photos where the ingredients for a given dish are split
across both, and confirm at least one suggested recipe uses items from both photos.

**Acceptance Scenarios**:

1. **Given** a user on the start screen, **When** they select 3 photos and submit,
   **Then** the app accepts all 3 and returns 2–3 recipes based on the combined set of
   ingredients visible across them.
2. **Given** a user who has already selected 3 photos, **When** they attempt to add a
   fourth, **Then** the app prevents it and shows a Persian message explaining the
   1-to-3 photo limit.
3. **Given** a user who has selected photos but not yet submitted, **When** they remove
   one selected photo, **Then** it is dropped from the request and the remaining photos
   stay selected.

---

### User Story 3 - Be told clearly when a photo can't be used (Priority: P3)

The cook uploads something the app cannot work with — a blurry image, an empty fridge,
or a picture unrelated to food. Instead of inventing a recipe, the app shows a simple,
friendly Persian message explaining that no ingredients were recognized and inviting
them to upload a different photo.

**Why this priority**: It protects trust and prevents the app's worst failure mode
(fabricated recipes), but it is a guard on the P1 flow rather than a standalone value
slice.

**Independent Test**: Upload a photo with no recognizable food (for example a photo of a
wall) and confirm a friendly Persian error message appears, that no recipes are shown,
and that the user can immediately try another photo.

**Acceptance Scenarios**:

1. **Given** a user who submits one or more photos containing no recognizable food or
   ingredients, **When** processing finishes, **Then** the app shows a friendly Persian
   message asking for a different photo and displays zero recipes.
2. **Given** a user submits photos in which fewer than 2 non-staple ingredients are
   recognized, **When** processing finishes, **Then** the app shows the same "upload a
   different photo" message rather than a partial or invented recipe.
3. **Given** the error message is displayed, **When** the user selects new photos and
   submits again, **Then** the app clears the error and processes the new request.

---

### User Story 4 - Tell the app what I have without a photo (Priority: P2)

The cook does not want to photograph anything — they already know what is in the fridge.
They type ingredients in, or tap the common ones offered on the home screen, and ask for
recipes from that list alone.

**Why this priority**: It removes the app's hardest precondition (good lighting, a tidy
fridge, a phone in hand) and makes the demo work even with no camera. It rides on the same
suggestion path as P1, so it is cheap once P1 exists.

**Independent Test**: With no photo selected, tap two quick-start chips and type one more
ingredient, then ask for recipes and confirm suggestions come back.

**Acceptance Scenarios**:

1. **Given** a user on the home screen with no photos, **When** they tap two common
   ingredient chips and submit, **Then** the app returns recipes built from those
   ingredients.
2. **Given** a user with one photo selected, **When** they also type an ingredient the
   photo does not show, **Then** the request carries both and the suggestions may use
   either.
3. **Given** a user with no photos and no typed ingredients, **When** they look at the
   submit control, **Then** it is unavailable until they add at least one of the two.

---

### User Story 5 - Fix what the app got wrong (Priority: P2)

The app reports what it saw. The cook spots a mistake — a cucumber read as a zucchini, an
item that is not really there, something it missed — and corrects the list before asking
for recipes.

**Why this priority**: Recognition will be wrong sometimes, and a cook who cannot correct
it either gets a useless recipe or loses trust in the whole app. It also turns a failed
recognition into a recoverable moment instead of a dead end.

**Independent Test**: After a recognition run, rename one ingredient, delete another, add a
third, then ask for recipes and confirm the suggestions reflect the corrected list.

**Acceptance Scenarios**:

1. **Given** a list of recognized ingredients on screen, **When** the user renames one,
   **Then** the new name is what recipes are built from.
2. **Given** the same list, **When** the user removes an item, **Then** it no longer
   appears and no suggested recipe uses it.
3. **Given** the corrected list has fewer than 2 non-staple ingredients, **When** the user
   asks for recipes, **Then** the app shows the friendly "not enough ingredients" message
   rather than guessing.

---

### User Story 6 - Keep a recipe for later (Priority: P3)

The cook likes a suggestion but is not cooking it right now. They save it, and it is
waiting on the saved screen the next time they open the app on that browser.

**Why this priority**: It is the only part of the app that outlives a visit, and it is
useful only once suggestions exist — so it comes last.

**Independent Test**: Save a recipe, reload the page, open the saved screen, and confirm the
recipe is still there with its title, ingredients, and steps.

**Acceptance Scenarios**:

1. **Given** a suggested recipe on screen, **When** the user taps its save control, **Then**
   the recipe appears on the saved screen and the control shows it as saved.
2. **Given** a saved recipe, **When** the user reloads the page or returns later in the same
   browser, **Then** the recipe is still on the saved screen.
3. **Given** a saved recipe, **When** the user removes it from saved, **Then** it disappears
   from the saved screen and does not return on reload.
4. **Given** nothing has been saved, **When** the user opens the saved screen, **Then** a
   friendly Persian empty state invites them to go look at suggestions.

---

### Edge Cases

- Photos are submitted but the recognition service is unreachable, times out, or returns
  an unusable result: the app shows a friendly Persian failure message and lets the user
  retry; it never shows a raw error or hangs silently.
- Some photos in a multi-photo submission are usable and others are not: the app
  proceeds using the recognizable ingredients and only falls back to the "different
  photo" message when the combined set is insufficient.
- A selected file is not a supported image type, or exceeds the size limit: the app
  rejects it before submission with a Persian explanation and keeps other valid
  selections.
- The user submits with zero photos selected: the submit action is unavailable or shows
  a Persian prompt to add at least one photo.
- The user leaves the page or reloads while results are displayed: results are gone and
  the app returns to the empty start state, with no way to recover the previous
  suggestions.
- The user submits a second time while a request is still processing: the app prevents
  overlapping requests, keeping one visible processing state.
- Recognized items are edible but cannot form a realistic dish together: the app shows
  the "different photo" message rather than stretching to fill the 2–3 recipe range.
- Processing exceeds the 30-second ceiling: the app stops waiting and shows the friendly
  failure message with a retry, rather than continuing to spin.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST let a user select and submit up to 3 photos in a single
  request, and MUST prevent submission of more than 3. A request MUST carry at least one
  photo **or** at least one manually entered ingredient (FR-017); a request with neither
  MUST be prevented.
- **FR-002**: The app MUST let a user remove an individual selected photo before
  submitting.
- **FR-003**: The app MUST identify the food items and ingredients visible across all
  submitted photos and treat them as one combined ingredient pool.
- **FR-004**: When the recognized ingredients support it, the app MUST return between 2
  and 3 recipe suggestions per request.
- **FR-005**: Each returned recipe MUST include, in this order, a Persian title, the
  list of recognized ingredients that recipe uses, and ordered step-by-step cooking
  instructions. The ingredient list MUST NOT include quantities.
- **FR-006**: Each returned recipe MUST be realistically makeable from the recognized
  ingredients plus common pantry staples (see Assumptions); it MUST NOT require a
  principal ingredient absent from both.
- **FR-007**: All user-facing text — labels, buttons, status messages, error messages,
  recipe titles, and instructions — MUST be in Persian, presented right-to-left.
- **FR-008**: When fewer than 2 ingredients are recognized across the submission
  (pantry staples from the Assumptions section do not count toward this floor), the app
  MUST show a simple, friendly Persian message asking the user to upload a different
  photo, and MUST display no recipes.
- **FR-008a**: When 2 or more ingredients are recognized, the app MUST attempt recipe
  suggestions; if it still cannot produce at least 2 realistic recipes from them, it
  MUST show the same "upload a different photo" message rather than returning a single
  recipe or an invented one.
- **FR-009**: The app MUST NOT fabricate, guess at, or partially invent a recipe from
  input it could not recognize.
- **FR-010**: While a submission is being processed, the app MUST show a visible
  processing state, and MUST prevent a second overlapping submission.
- **FR-011**: If recognition or suggestion fails for any reason (unreachable service,
  timeout, unusable result), the app MUST show a clear, friendly Persian failure message
  and allow the user to retry; it MUST NOT surface a raw error, crash, or hang.
- **FR-011a**: The app MUST stop waiting on a submission after 30 seconds and show the
  FR-011 failure message with a retry option; it MUST NOT leave the processing state
  running past that ceiling.
- **FR-012**: The app MUST NOT require login, account creation, or any user identity.
- **FR-013**: The app MUST NOT persist photos anywhere, and MUST NOT persist recognized
  ingredients or suggestions server-side. No database, no file storage, no server-side
  cache, and no server-side session may be introduced.
- **FR-013a**: As the single exception to FR-013, the app MUST store, in the viewer's own
  browser only, exactly two things:
  - **Saved recipes** — recipes the user explicitly saved via the save control (FR-020).
    Stored: recipe title, its ingredient names, and its steps. Why: the saved screen's
    entire purpose is to keep a dish for a later cooking session, which is worthless if it
    vanishes on reload. How long: until the user removes it or clears their browser data.
  - **Theme preference** — light or dark (FR-022). Why: a theme that resets on every visit
    reads as a bug. How long: same as above.

  Nothing else may be stored. Photos, the working ingredient list, and unsaved suggestions
  MUST still be gone after a reload. The store MUST be per-browser: it MUST NOT reach a
  server, another device, or another visitor.
- **FR-014**: The app MUST reject files that are not supported images or that exceed the
  size limit, with a Persian explanation, before submission.
- **FR-015**: The app MUST be usable on both mobile and desktop browser viewports.
- **FR-016**: The credential used to reach the external AI service MUST remain server-side
  only. It MUST NOT appear in anything delivered to the browser, in any response body, or
  in any message shown to the user.
- **FR-017**: The app MUST let a user add ingredients by typing them, without any photo,
  and MUST accept a request built from typed ingredients alone.
- **FR-018**: The app MUST show the recognized ingredients back to the user and let them
  correct the list before asking for recipes: rename an item, remove an item, and add one.
  The corrected list, not the raw recognition, MUST be what recipes are built from.
- **FR-019**: The app MUST offer a set of one-tap common ingredients on the home screen
  that add themselves to the ingredient list when tapped.
- **FR-020**: The app MUST let a user save a suggested recipe and later remove it from
  saved, and MUST show saved recipes on their own screen. Saving MUST be an explicit user
  action — never automatic.
- **FR-021**: The app MUST provide navigation between three screens — home, my
  ingredients, and saved — with the current screen indicated.
- **FR-022**: The app MUST default to a dark theme, MUST offer a control to switch between
  dark and light, and MUST remember the choice for that browser.
- **FR-023**: Every screen MUST show a friendly Persian empty state when it has nothing to
  display, with a control leading to the next useful action.

### Key Entities

- **Photo Submission**: The 1–3 images a user submits in one request. Exists only for
  the duration of that request; never stored afterwards.
- **Recognized Ingredient**: A single food item the app identified as visible in the
  submission. Has a Persian name. Collectively these form the ingredient pool for one
  request.
- **Recipe Suggestion**: One proposed dish returned for a submission. Has a Persian
  title, the subset of Recognized Ingredients it uses (names only, no quantities), and
  an ordered list of Persian instruction steps. Exists only in the displayed result unless
  the user saves it.
- **Ingredient List**: The working set of ingredients a request is built from. Assembled
  from three sources — recognized from photos, typed by the user, tapped from the common
  chips — and freely editable by the user (FR-018). Lives only in the current visit.
- **Saved Recipe**: A Recipe Suggestion the user explicitly kept (FR-020). Holds the same
  title, ingredients, and steps, plus the time it was saved. Stored in the viewer's own
  browser per FR-013a; never sent to a server.
- **Theme Preference**: Dark or light (FR-022). One value, stored in the viewer's own
  browser per FR-013a.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can go from opening the app to reading a suggested
  recipe in under 60 seconds, without help beyond what is on screen.
- **SC-002**: For photos that clearly show at least 3 recognizable ingredients, the app
  returns 2–3 recipes in at least 90% of submissions.
- **SC-003**: For photos with no recognizable food, the app shows the "upload a
  different photo" message in 100% of cases and shows a recipe in 0% of them.
- **SC-004**: In review of returned recipes, at least 90% are judged realistically
  makeable from the ingredients visible in the submitted photos plus common pantry
  staples.
- **SC-005**: 100% of user-facing text shown in any state — start, processing, results,
  error — is in Persian.
- **SC-006**: The app never leaves the user without feedback: in 100% of submissions the
  user sees either a processing state, results, or a friendly failure message.
- **SC-008**: No submission leaves the user waiting longer than 30 seconds before either
  results or a friendly failure message appears.
- **SC-007**: The primary flow is completable on both a common mobile viewport and a
  common desktop viewport, with no horizontal scrolling or clipped controls.
- **SC-009**: A user with no camera photo can reach recipe suggestions using typed and
  tapped ingredients alone, in under 60 seconds.
- **SC-010**: A correction the user makes to the ingredient list is reflected in 100% of
  subsequent suggestions; a removed ingredient appears in 0% of them.
- **SC-011**: A saved recipe survives a page reload and a browser restart on the same
  browser in 100% of cases; it appears on no other browser or device.
- **SC-012**: After a reload, unsaved suggestions, selected photos, and the working
  ingredient list are all gone in 100% of cases.

## Assumptions

- Users are home cooks reading Persian; no other language is offered in this feature.
- "Common pantry staples" that a recipe may assume without seeing them means salt,
  pepper, water, cooking oil, and sugar. Anything else must be visible in the photos.
- Photos are supplied from the user's device (camera roll or file picker); no camera
  capture flow, URL import, or gallery integration is in scope.
- Supported image formats are the common web photo formats (JPEG, PNG, WebP, HEIC), with
  a per-photo size limit of 10 MB. Photos are transmitted for the request and discarded
  afterwards.
- The app is a browser-based experience; no native mobile app is in scope.
- Recognition and recipe generation are performed by an external AI service, per the
  project constitution's External-Service-First principle. The specific provider is a
  plan-level decision and is not fixed here.
- Nutrition data, cooking times, portion counts, dietary/allergen filters, ingredient
  quantities, recipe images, sharing, printing, and rating are out of scope for this
  feature.
- No analytics, tracking, or user-identifying data is collected, consistent with the
  no-login, no-history constraint.
- Users have a working internet connection; offline use is out of scope.
- The home screen carries a decorative cook figure beside the headline. It is presentation
  only — it conveys no information, is hidden from assistive technology, and no requirement
  depends on it. Recorded here so its presence is traceable rather than untracked.
- **Environment constraint discovered in testing**: Google blocks the Gemini API from some
  regions, returning `User location is not supported for the API use.` for every model. The
  key and request are valid; the app degrades correctly (friendly Persian failure per
  FR-011), but running the live flow from a blocked region needs a VPN or proxy. See
  `research.md` §3.
