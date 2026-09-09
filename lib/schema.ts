import { z } from "zod";
import { ERROR_CODES } from "@/lib/errors";

/**
 * Schemas for the model reply and the API response.
 * Field rules mirror specs/001-photo-recipe-suggestions/data-model.md.
 */

const nonEmpty = z
  .string()
  .transform((s) => s.trim())
  .refine((s) => s.length > 0, { message: "must be non-empty after trim" });

/** A single food item the model reports as visible. */
export const recognizedIngredientSchema = z.object({
  name: nonEmpty,
  isStaple: z.boolean(),
});

/** One proposed dish: title, the ingredients it uses (names only), ordered steps. */
export const recipeSuggestionSchema = z.object({
  title: nonEmpty,
  ingredients: z.array(nonEmpty).min(1),
  steps: z.array(nonEmpty).min(2),
});

/** What the model is asked to return. */
export const modelReplySchema = z.object({
  ingredients: z.array(recognizedIngredientSchema),
  recipes: z.array(recipeSuggestionSchema),
});

export type RecognizedIngredient = z.infer<typeof recognizedIngredientSchema>;
export type RecipeSuggestion = z.infer<typeof recipeSuggestionSchema>;
export type ModelReply = z.infer<typeof modelReplySchema>;

/** The API response: recipes or an error, never both. */
export const suggestionResultSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    ingredients: z.array(recognizedIngredientSchema),
    recipes: z.array(recipeSuggestionSchema),
  }),
  z.object({
    ok: z.literal(false),
    code: z.enum(ERROR_CODES),
  }),
]);

export type SuggestionResult = z.infer<typeof suggestionResultSchema>;

/**
 * Feature 002 — random dish.
 * Reuses recipeSuggestionSchema unchanged, which is what makes a random dish
 * interchangeable with an ingredient-based one everywhere it is displayed or saved.
 */
export const randomReplySchema = z.object({
  recipe: recipeSuggestionSchema,
});

export type RandomReply = z.infer<typeof randomReplySchema>;

/** Singular `recipe` by design: this endpoint returns exactly one dish, never a list. */
export const randomResultSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    recipe: recipeSuggestionSchema,
  }),
  z.object({
    ok: z.literal(false),
    code: z.enum(ERROR_CODES),
  }),
]);

export type RandomResult = z.infer<typeof randomResultSchema>;
