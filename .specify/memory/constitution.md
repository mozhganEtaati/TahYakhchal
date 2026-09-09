# TahYakhchal Constitution

## Core Principles

### I. Minimal Surface Area (NON-NEGOTIABLE)

Every capability MUST trace back to an approved spec before it is built.

- **No speculative features.** Capabilities not described in an approved `spec.md`
  MUST NOT be implemented, regardless of how small or "obviously useful" they seem.
- **No incidental scope creep.** A task implementing feature A MUST NOT also touch
  unrelated feature B, even as a convenience fix.
- **Every deviation is visible.** If an implementation needs to go beyond its spec,
  the spec MUST be amended first — not silently exceeded during coding.

**Rationale:** The workshop's teaching value depends on a clean, traceable line from
spec → plan → tasks → code. Untracked scope breaks that line and hides the pattern
participants are there to learn.

### II. External-Service-First for Non-Core Capabilities

Capabilities outside the project's core differentiator MUST be delegated to hosted,
managed services rather than built in-house.

- **No custom ML/inference.** Image understanding, text generation, and any AI
  capability MUST call an external AI API. Building or training a custom model is
  prohibited.
- **No custom infrastructure for solved problems.** Authentication, storage, queuing,
  and similar solved concerns MUST use an existing managed service or library if one
  is adopted for the project — not a bespoke implementation — should the project ever
  need them.
- **Provider choice is a plan-level decision.** Which specific vendor or SDK is used
  is decided and documented in `plan.md`'s Technical Context, never hardcoded here.

**Rationale:** The project exists to demonstrate the spec-kit workflow, not to prove
custom AI infrastructure can be built from scratch. Every hour spent reinventing a
solved problem is an hour not spent on the thing being taught.

### III. No Persistence Without Justification

The default state of the system is stateless.

- **No implicit storage.** A database, file storage, cache, or server-side session
  MUST NOT be introduced unless a specific feature spec explicitly requires it.
- **Justification is written, not assumed.** A spec introducing persistence MUST state
  what is stored, why, and for how long, in its own text — not left to the
  implementer's discretion.
- **Statelessness is the reviewable default.** Any PR introducing storage without a
  corresponding spec justification MUST be rejected on that basis alone.

**Rationale:** Statelessness keeps the demo simple to run, simple to reason about, and
safe by default — and makes the moment a future feature *does* need persistence a
deliberate, teachable decision rather than an accident.

### IV. Contract Stability Across Features

Each feature's input/output contract is a promise to every feature built after it.

- **Extend, never break.** A new feature MUST add to an existing contract (new
  optional fields, new endpoints) rather than changing the shape or meaning of what
  already exists.
- **Breaking changes require an amendment.** If a contract genuinely must change
  incompatibly, that MUST be recorded as a constitution amendment (version bump),
  not slipped in through a feature's plan.
- **Downstream features are a compatibility check.** Before merging a contract change,
  every feature that consumes the old contract MUST be identified and updated in the
  same change.

**Rationale:** This is what lets a sequence of workshop sessions build on each other
instead of each one quietly invalidating the last.

## Quality & Reliability Constraints

- **Predictable AI-dependent UX.** Any user-facing action that waits on an external AI
  call MUST show a visible loading/processing state; the user MUST never be left
  wondering whether the app is frozen.
- **Graceful AI failure.** If an external AI call fails, times out, or returns an
  unusable result, the app MUST show a clear, friendly failure message — never a raw
  error, a crash, or a silent hang.
- **Cross-device usability.** The UI MUST be usable on both mobile and desktop browser
  viewports, since sessions are demoed live from different devices.

## Development Workflow & Quality Gates

- **Feature lifecycle is fixed.** Every feature MUST go through `spec.md` →
  Constitution Check → `plan.md` → `tasks.md` → implementation, in that order. Skipping
  a stage is not a shortcut, it is a violation.
- **Constitution Check is not optional.** `/speckit.plan` MUST evaluate its output
  against Principles I–IV before implementation begins, and again after design; any
  conflict MUST be resolved by changing the spec or plan, not by ignoring the
  principle.
- **Each workshop session is a checkpoint.** A feature introduced in one session MUST
  leave the project in a state where the next session's `/specify` can build on it
  without unrecorded assumptions.

## Governance

- **Authority.** Principles I–IV are binding gates for every feature, current or
  future. Conflicts between an implementation and a MUST-level rule are resolved by
  changing the spec, plan, or tasks — never by diluting the principle.
- **Amendments.** Changes to this document require a deliberate, explicit update (not
  incidental edits during feature work) and MUST be accompanied by a Sync Impact
  Report describing what changed and why.
- **Versioning policy (SemVer for governance).** MAJOR = a principle is removed or
  redefined incompatibly; MINOR = a new principle or section is added; PATCH =
  wording clarifications with no semantic change.
- **Compliance review.** Every feature's plan MUST state explicitly whether it
  complies with each principle; any deviation MUST be justified in the plan's
  Complexity Tracking section. Unjustified violations block moving to `tasks.md`.

**Version**: 1.0.1 | **Ratified**: 2026-09-09 | **Last Amended**: 2026-09-09
