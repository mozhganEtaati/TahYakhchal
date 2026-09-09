import "server-only";

import { GoogleGenAI } from "@google/genai";
import {
  buildRandomUserPrompt,
  buildUserPrompt,
  RANDOM_RESPONSE_SCHEMA,
  RANDOM_SYSTEM_PROMPT,
  RESPONSE_SCHEMA,
  SYSTEM_PROMPT,
} from "@/lib/prompt";

/**
 * The only module that reads the API credential (FR-016).
 * `server-only` makes importing this from a client component a build error.
 */

export const REQUEST_TIMEOUT_MS = 30_000;

// gemini-2.5-flash is closed to new API keys; Google's own 404 points here instead.
// Override with GEMINI_MODEL when a newer id ships.
const DEFAULT_MODEL = "gemini-flash-latest";

export type ImagePart = { mimeType: string; data: string };

export class GeminiTimeoutError extends Error {
  constructor() {
    super("Gemini request exceeded the timeout ceiling");
    this.name = "GeminiTimeoutError";
  }
}

/**
 * One call: the model both recognizes ingredients and drafts recipes
 * (research.md §2). Raises GeminiTimeoutError once the ceiling expires.
 */
export async function requestSuggestions(
  images: ImagePart[],
  manualIngredients: string[] = [],
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            ...images.map((image) => ({
              inlineData: { mimeType: image.mimeType, data: image.data },
            })),
            { text: buildUserPrompt(images.length > 0, manualIngredients) },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        abortSignal: controller.signal,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned an empty response");
    }
    return text;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new GeminiTimeoutError();
    }
    logUpstreamDiagnosis(error, model);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Two upstream failures look identical to the user but need different fixes,
 * so name them in the server log. The user still sees only the friendly message.
 */
function logUpstreamDiagnosis(error: unknown, model: string) {
  const message = String((error as Error)?.message ?? "");
  if (message.includes("User location is not supported")) {
    console.error(
      "[gemini] Google blocks API calls from this location. A VPN or proxy to a supported region is required — this is not a code fault.",
    );
  } else if (message.includes("no longer available")) {
    console.error(
      `[gemini] Model "${model}" is retired for this key. Set GEMINI_MODEL to a current id.`,
    );
  }
}

/**
 * Feature 002 — one random dish, avoiding titles already seen this visit.
 * Temperature is raised for this call only: at the default the model returns the
 * same handful of well-known dishes and the second press would repeat (research.md §2).
 *
 * `deadline` is an absolute epoch-ms cutoff shared across every attempt in one request,
 * so a retry cannot buy itself a second full window — the route must still answer inside
 * 30 seconds (contracts/random-api.md invariant 3). Omit it for a single-attempt call.
 */
export async function requestRandomDish(
  seenTitles: string[] = [],
  deadline?: number,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const remaining =
    deadline === undefined ? REQUEST_TIMEOUT_MS : deadline - Date.now();

  // Already out of budget: fail as a timeout rather than starting a call that
  // would outlive the request (research.md §6 — no work left running after the
  // user has been told it failed).
  if (remaining <= 0) {
    throw new GeminiTimeoutError();
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), remaining);

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: buildRandomUserPrompt(seenTitles) }] }],
      config: {
        systemInstruction: RANDOM_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: RANDOM_RESPONSE_SCHEMA,
        temperature: 1.3,
        abortSignal: controller.signal,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned an empty response");
    }
    return text;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new GeminiTimeoutError();
    }
    logUpstreamDiagnosis(error, model);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
