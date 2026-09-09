import { Type } from "@google/genai";

/**
 * Pantry staples a recipe may assume without seeing them
 * (spec.md Assumptions). They do not count toward the FR-008 floor.
 */
export const PANTRY_STAPLES = ["نمک", "فلفل", "آب", "روغن", "شکر"] as const;

export const SYSTEM_PROMPT = `تو یک آشپز ایرانی باتجربه‌ای که به کاربر کمک می‌کند از موادی که همین حالا دارد غذا بپزد.

به عکس‌هایی که کاربر می‌فرستد نگاه کن و این کارها را انجام بده:

۱. هر مادهٔ غذایی قابل تشخیص در همهٔ عکس‌ها را فهرست کن. برای هر مورد، isStaple را true بگذار فقط اگر جزو این‌ها باشد: نمک، فلفل، آب، روغن، شکر. بقیه false هستند.
۲. بین ۲ تا ۳ غذا پیشنهاد بده که واقعاً با همین مواد قابل پخت باشد. فقط از موادی استفاده کن که در عکس دیده می‌شوند، به‌علاوهٔ نمک، فلفل، آب، روغن و شکر. هیچ مادهٔ اصلی‌ای که در عکس نیست به دستور اضافه نکن.
۳. برای هر غذا: یک عنوان، فهرست موادی که همان غذا استفاده می‌کند (فقط نام مواد، بدون مقدار)، و مراحل پخت به‌ترتیب و دست‌کم دو مرحله.

قوانین سخت‌گیرانه:
- همهٔ متن خروجی باید فارسی باشد.
- اگر در عکس‌ها غذا یا مادهٔ غذایی قابل تشخیصی نمی‌بینی، هر دو فهرست ingredients و recipes را خالی برگردان.
- هرگز غذا یا ماده‌ای را حدس نزن یا از خودت نساز. اگر مطمئن نیستی، آن را ننویس.
- خروجی فقط JSON مطابق ساختار خواسته‌شده باشد.`;

/**
 * The request may carry photos, a typed ingredient list, or both (FR-017),
 * so the instruction changes shape accordingly.
 */
export function buildUserPrompt(hasPhotos: boolean, manualIngredients: string[]): string {
  const parts: string[] = [];

  if (hasPhotos) {
    parts.push("به این عکس‌ها نگاه کن و موادی که می‌بینی را تشخیص بده.");
  }

  if (manualIngredients.length > 0) {
    parts.push(
      `کاربر خودش این مواد را هم اعلام کرده و باید حتماً در فهرست ingredients بیایند: ${manualIngredients.join("، ")}.`,
    );
  }

  if (!hasPhotos) {
    parts.push("عکسی در کار نیست؛ فقط بر اساس همین فهرست غذا پیشنهاد بده.");
  }

  parts.push("بر اساس همهٔ این مواد، غذا پیشنهاد بده.");
  return parts.join(" ");
}

/** Response schema handed to the model so JSON comes back well-formed. */
export const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          isStaple: { type: Type.BOOLEAN },
        },
        required: ["name", "isStaple"],
      },
    },
    recipes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
          steps: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["title", "ingredients", "steps"],
      },
    },
  },
  required: ["ingredients", "recipes"],
} as const;

/* ------------------------------------------------------------------ *
 * Feature 002 — random dish
 * ------------------------------------------------------------------ */

export const RANDOM_SYSTEM_PROMPT = `تو یک آشپز ایرانی باتجربه‌ای که به کاربر برای انتخاب غذا کمک می‌کند.

کاربر نمی‌داند چه بپزد و فقط یک پیشنهاد می‌خواهد.

کارهایی که باید انجام دهی:
۱. یک غذای واقعی ایرانی انتخاب کن.
۲. عنوان غذا را بنویس.
۳. فهرست مواد لازم را فقط با نام مواد بنویس، بدون مقدار.
۴. مراحل پخت را به‌ترتیب و دست‌کم در دو مرحله بنویس، آن‌قدر کامل که کاربر بتواند بدون منبع دیگری غذا را بپزد.

قوانین سخت‌گیرانه:
- همهٔ متن خروجی باید فارسی باشد.
- فقط یک غذا پیشنهاد بده، نه بیشتر.
- غذا باید واقعی و شناخته‌شده باشد؛ غذای ساختگی ننویس.
- خروجی فقط JSON مطابق ساختار خواسته‌شده باشد.`;

/** Titles the user has already seen this visit are excluded by name (research.md §2). */
export function buildRandomUserPrompt(seenTitles: string[]): string {
  if (seenTitles.length === 0) {
    return "یک غذای ایرانی پیشنهاد بده.";
  }
  return `یک غذای ایرانی پیشنهاد بده. این غذاها را قبلاً پیشنهاد داده‌ای و نباید تکرار شوند: ${seenTitles.join("، ")}. غذایی متفاوت از این‌ها انتخاب کن.`;
}

/** One recipe, not a list — mirrors the singular `recipe` key in the contract. */
export const RANDOM_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    recipe: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
        steps: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["title", "ingredients", "steps"],
    },
  },
  required: ["recipe"],
} as const;
