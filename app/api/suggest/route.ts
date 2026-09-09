import { NextResponse } from "next/server";
import { ERROR_STATUS, type ErrorCode } from "@/lib/errors";
import { GeminiTimeoutError, requestSuggestions, type ImagePart } from "@/lib/gemini";
import { modelReplySchema, type RecipeSuggestion, type RecognizedIngredient } from "@/lib/schema";
import { PANTRY_STAPLES } from "@/lib/prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PHOTOS = 3;
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);

/** Minimum non-staple ingredients before the app will attempt recipes (FR-008). */
const MIN_INGREDIENTS = 2;
/** Recipe count bounds for a successful response (FR-004). */
const MIN_RECIPES = 2;
const MAX_RECIPES = 3;

function failure(code: ErrorCode) {
  // Body carries only ok + code: no stack trace, no upstream text (FR-011).
  return NextResponse.json({ ok: false, code }, { status: ERROR_STATUS[code] });
}

function normalize(value: string): string {
  return value.trim().replace(/‌/g, " ").replace(/\s+/g, " ").toLowerCase();
}

const STAPLE_KEYS = new Set(PANTRY_STAPLES.map(normalize));

function isStapleName(name: string): boolean {
  const key = normalize(name);
  return STAPLE_KEYS.has(key) || [...STAPLE_KEYS].some((staple) => key.includes(staple));
}

/** Union across all photos, deduplicated by normalized name (FR-003). */
function dedupeIngredients(ingredients: RecognizedIngredient[]): RecognizedIngredient[] {
  const seen = new Map<string, RecognizedIngredient>();
  for (const ingredient of ingredients) {
    const key = normalize(ingredient.name);
    if (!key || seen.has(key)) continue;
    seen.set(key, {
      name: ingredient.name,
      // Trust the staple list over the model's own flag.
      isStaple: ingredient.isStaple || isStapleName(ingredient.name),
    });
  }
  return [...seen.values()];
}

/** A recipe may only use recognized ingredients plus pantry staples (FR-006). */
function isMakeable(recipe: RecipeSuggestion, pool: Set<string>): boolean {
  return recipe.ingredients.every(
    (ingredient) => pool.has(normalize(ingredient)) || isStapleName(ingredient),
  );
}

const MAX_MANUAL_INGREDIENTS = 30;
const MAX_INGREDIENT_LENGTH = 60;

/** Typed ingredients arrive as a JSON array in the same form body (FR-017). */
function readManualIngredients(raw: FormDataEntryValue | null): string[] | null {
  if (raw === null) return [];
  if (typeof raw !== "string") return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed) || parsed.length > MAX_MANUAL_INGREDIENTS) return null;

  const names: string[] = [];
  for (const entry of parsed) {
    if (typeof entry !== "string") return null;
    const clean = entry.trim();
    if (!clean || clean.length > MAX_INGREDIENT_LENGTH) return null;
    names.push(clean);
  }
  return names;
}

export async function POST(request: Request) {
  // --- 1. Read and validate the upload (authoritative check; FR-001, FR-014)
  let files: File[];
  let manual: string[] | null;
  try {
    const formData = await request.formData();
    files = formData.getAll("photos").filter((entry): entry is File => entry instanceof File);
    manual = readManualIngredients(formData.get("manualIngredients"));
  } catch {
    return failure("INVALID_UPLOAD");
  }

  // A request needs photos or typed ingredients — at least one of the two (FR-001).
  if (manual === null || files.length > MAX_PHOTOS || (files.length === 0 && manual.length === 0)) {
    return failure("INVALID_UPLOAD");
  }

  for (const file of files) {
    const typeOk = ACCEPTED_TYPES.has(file.type) || (file.type === "" && /\.hei[cf]$/i.test(file.name));
    if (!typeOk || file.size > MAX_BYTES || file.size === 0) {
      return failure("INVALID_UPLOAD");
    }
  }

  // --- 2. One call to Gemini; the vision pass is skipped when there are no photos
  let rawReply: string;
  try {
    const images: ImagePart[] = await Promise.all(
      files.map(async (file) => ({
        mimeType: file.type || "image/heic",
        data: Buffer.from(await file.arrayBuffer()).toString("base64"),
      })),
    );
    rawReply = await requestSuggestions(images, manual);
  } catch (error) {
    if (error instanceof GeminiTimeoutError) {
      return failure("TIMEOUT");
    }
    console.error("[suggest] upstream failure:", error);
    return failure("SERVICE_ERROR");
  }

  // --- 3. Validate the reply before trusting any of it (FR-009)
  let parsed;
  try {
    parsed = modelReplySchema.safeParse(JSON.parse(rawReply));
  } catch (error) {
    console.error("[suggest] reply was not valid JSON:", error);
    return failure("SERVICE_ERROR");
  }

  if (!parsed.success) {
    console.error("[suggest] reply did not match schema:", parsed.error.issues);
    return failure("SERVICE_ERROR");
  }

  // --- 4. Merge recognized and typed ingredients, then apply the floor in code (FR-008, FR-017)
  const ingredients = dedupeIngredients([
    ...manual.map((name) => ({ name, isStaple: isStapleName(name) })),
    ...parsed.data.ingredients,
  ]);
  const substantive = ingredients.filter((ingredient) => !ingredient.isStaple);

  if (substantive.length < MIN_INGREDIENTS) {
    return failure("NO_INGREDIENTS");
  }

  // --- 5. Drop unmakeable recipes, then apply the count rule (FR-006, FR-008a)
  const pool = new Set(ingredients.map((ingredient) => normalize(ingredient.name)));
  const recipes = parsed.data.recipes
    .filter((recipe) => isMakeable(recipe, pool))
    .slice(0, MAX_RECIPES);

  if (recipes.length < MIN_RECIPES) {
    return failure("NO_RECIPES");
  }

  return NextResponse.json({ ok: true, ingredients, recipes }, { status: 200 });
}
