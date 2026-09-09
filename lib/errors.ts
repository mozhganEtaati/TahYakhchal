/**
 * Error codes shared by the API route and the client.
 * Source of truth: specs/001-photo-recipe-suggestions/contracts/suggest-api.md
 */

export const ERROR_CODES = [
  "INVALID_UPLOAD",
  "NO_INGREDIENTS",
  "NO_RECIPES",
  "TIMEOUT",
  "SERVICE_ERROR",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** HTTP status for each failure, per the contract. */
export const ERROR_STATUS: Record<ErrorCode, number> = {
  INVALID_UPLOAD: 400,
  NO_INGREDIENTS: 422,
  NO_RECIPES: 422,
  TIMEOUT: 504,
  SERVICE_ERROR: 502,
};

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && (ERROR_CODES as readonly string[]).includes(value);
}
