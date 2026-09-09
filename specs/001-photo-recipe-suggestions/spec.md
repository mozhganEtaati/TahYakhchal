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

- **FR-001**: The app MUST let a user select and submit between 1 and 3 photos in a
  single request, and MUST prevent submission of 0 photos or more than 3.
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
- **FR-013**: The app MUST NOT persist photos, recognized ingredients, or suggestions
  beyond the request that produced them; each visit MUST start from an empty state and
  past suggestions MUST NOT be retrievable after leaving or reloading the page.
- **FR-014**: The app MUST reject files that are not supported images or that exceed the
  size limit, with a Persian explanation, before submission.
- **FR-015**: The app MUST be usable on both mobile and desktop browser viewports.

### Key Entities

- **Photo Submission**: The 1–3 images a user submits in one request. Exists only for
  the duration of that request; never stored afterwards.
- **Recognized Ingredient**: A single food item the app identified as visible in the
  submission. Has a Persian name. Collectively these form the ingredient pool for one
  request.
- **Recipe Suggestion**: One proposed dish returned for a submission. Has a Persian
  title, the subset of Recognized Ingredients it uses (names only, no quantities), and
  an ordered list of Persian instruction steps. Exists only in the displayed result.

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
