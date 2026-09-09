import { NextResponse } from "next/server";
import { ERROR_STATUS, type ErrorCode } from "@/lib/errors";
import { GeminiTimeoutError, REQUEST_TIMEOUT_MS, requestRandomDish } from "@/lib/gemini";
import { randomReplySchema, type RecipeSuggestion } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** At most this many seen titles are sent upstream; extras are ignored (research.md §4). */
const MAX_SEEN_TITLES = 40;
const MAX_TITLE_LENGTH = 120;

function failure(code: ErrorCode) {
  // Body carries only ok + code: no stack trace, no upstream text (FR-106).
  return NextResponse.json({ ok: false, code }, { status: ERROR_STATUS[code] });
}

/**
 * Titles already shown this visit. Absent, empty, or `{}` all mean "no exclusions";
 * a malformed shape is a failure. Only the most recent MAX_SEEN_TITLES are honored —
 * once the pool is exhausted a repeat is preferable to an error (spec.md Edge Cases).
 */
function readSeenTitles(body: unknown): string[] | null {
  if (body === null || body === undefined) return [];
  if (typeof body !== "object") return null;

  const raw = (body as { seenTitles?: unknown }).seenTitles;
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) return null;

  const titles: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== "string") return null;
    const clean = entry.trim();
    if (!clean || clean.length > MAX_TITLE_LENGTH) return null;
    titles.push(clean);
  }

  return titles.slice(-MAX_SEEN_TITLES);
}

/** Loose comparison so spacing and ZWNJ differences do not hide a repeat. */
function normalizeTitle(value: string): string {
  return value.trim().replace(/‌/g, " ").replace(/\s+/g, " ").toLowerCase();
}

/**
 * Fetch one dish and validate it. Returns null when the reply is unusable.
 * `deadline` is shared by every attempt in the request, so retries stay inside
 * the single 30-second ceiling (contracts/random-api.md invariant 3).
 */
async function fetchDish(
  seenTitles: string[],
  deadline: number,
): Promise<RecipeSuggestion | null> {
  const rawReply = await requestRandomDish(seenTitles, deadline);

  let parsed;
  try {
    parsed = randomReplySchema.safeParse(JSON.parse(rawReply));
  } catch (error) {
    console.error("[random] reply was not valid JSON:", error);
    return null;
  }

  if (!parsed.success) {
    console.error("[random] reply did not match schema:", parsed.error.issues);
    return null;
  }

  return parsed.data.recipe;
}

export async function POST(request: Request) {
  // --- 1. Read the optional exclusion list
  let seenTitles: string[] | null;
  try {
    const text = await request.text();
    seenTitles = readSeenTitles(text ? JSON.parse(text) : null);
  } catch {
    return failure("SERVICE_ERROR");
  }

  if (seenTitles === null) {
    return failure("SERVICE_ERROR");
  }

  // --- 2. Ask for a dish, and enforce the no-repeat rule in code rather than
  // trusting the prompt (FR-104, SC-102). The exclusion list is an instruction the
  // model may ignore, so a collision gets exactly one re-ask — bounded, because
  // research.md §4 rejected unbounded re-rolling against the 30-second ceiling.
  const seenKeys = new Set(seenTitles.map(normalizeTitle));
  const attemptsAllowed = seenKeys.size > 0 ? 2 : 1;

  // One budget for the whole request, not one per attempt.
  const deadline = Date.now() + REQUEST_TIMEOUT_MS;

  let recipe: RecipeSuggestion | null = null;
  try {
    for (let attempt = 0; attempt < attemptsAllowed; attempt += 1) {
      const candidate = await fetchDish(seenTitles, deadline);
      if (!candidate) break;

      recipe = candidate;
      if (!seenKeys.has(normalizeTitle(candidate.title))) break;

      // A repeat on the final allowed attempt is kept: the spec's edge case says a
      // repeat is more useful than an error once fresh ideas run out.
      console.warn(
        `[random] model repeated a seen title on attempt ${attempt + 1}/${attemptsAllowed}`,
      );
    }
  } catch (error) {
    if (error instanceof GeminiTimeoutError) {
      return failure("TIMEOUT");
    }
    console.error("[random] upstream failure:", error);
    return failure("SERVICE_ERROR");
  }

  if (!recipe) {
    return failure("SERVICE_ERROR");
  }

  return NextResponse.json({ ok: true, recipe }, { status: 200 });
}
