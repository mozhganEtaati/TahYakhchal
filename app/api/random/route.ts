import { NextResponse } from "next/server";
import { ERROR_STATUS, type ErrorCode } from "@/lib/errors";
import { GeminiTimeoutError, requestRandomDish } from "@/lib/gemini";
import { randomReplySchema } from "@/lib/schema";

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

  // --- 2. One call for one dish
  let rawReply: string;
  try {
    rawReply = await requestRandomDish(seenTitles);
  } catch (error) {
    if (error instanceof GeminiTimeoutError) {
      return failure("TIMEOUT");
    }
    console.error("[random] upstream failure:", error);
    return failure("SERVICE_ERROR");
  }

  // --- 3. Validate before trusting any of it; a partial dish is a failure (FR-107)
  let parsed;
  try {
    parsed = randomReplySchema.safeParse(JSON.parse(rawReply));
  } catch (error) {
    console.error("[random] reply was not valid JSON:", error);
    return failure("SERVICE_ERROR");
  }

  if (!parsed.success) {
    console.error("[random] reply did not match schema:", parsed.error.issues);
    return failure("SERVICE_ERROR");
  }

  return NextResponse.json({ ok: true, recipe: parsed.data.recipe }, { status: 200 });
}
