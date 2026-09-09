import type { ErrorCode } from "@/lib/errors";

/**
 * Every user-facing string in the app (FR-007).
 * Keeping them in one file makes "is all of it Persian?" a one-file review.
 */
export const fa = {
  appTitle: "ته‌یخچال",
  appDescription: "با همان چیزی که داری بپز — از روی عکس مواد، پیشنهاد غذا بگیر.",

  brand: "ته‌یخچال",
  tagline: "ته‌یخچال — با همان چیزی که داری بپز.",

  nav: {
    home: "خانه",
    ingredients: "موادِ من",
    saved: "ذخیره‌شده‌ها",
    toggleTheme: "تغییر روشنایی",
  },

  home: {
    titleLine1: "امروز",
    titleLine2: "چی بپزم؟",
    intro:
      "چیزهایی که توی خونه داری رو بگو یا ازشون عکس بگیر. سه تا ایده می‌گیری که با همون‌ها درست می‌شود.",
    photoCta: "از موادم عکس می‌گیرم",
    manualCta: "خودم وارد می‌کنم",
    chipsLabel: "یا از همین‌جا شروع کن:",
    slotsTitle: "عکس‌هات رو همین‌جا بنداز",
    slotsHint: "یخچال، فریزر یا کابینت — تا ۳ عکس",
    addPhoto: "عکس اضافه کن",
    emptySlot: "جای خالی",
    stepsTitle: "چطور کار می‌کند",
    steps: [
      { title: "عکس می‌گیری", body: "از یخچال، فریزر یا کابینت — تا سه عکس." },
      { title: "مواد را می‌بینی", body: "هرچه اشتباه بود همان‌جا اصلاحش می‌کنی." },
      { title: "سه ایده می‌گیری", body: "خوشت نیامد، سه تای تازه بدون تکرار." },
    ],
  },

  ingredients: {
    heading: "این‌ها رو پیدا کردم 👀",
    subheading:
      "اگه چیزی رو اشتباه دیدم، اصلاحش کن. روی هر ماده کلیک کنی قابل ویرایش می‌شود.",
    cardTitle: "موادی که داری",
    emptyTitle: "هنوز نمی‌دونم چی داری 😅",
    emptyBody: "یک عکس بفرست یا چند ماده بنویس تا شروع کنیم.",
    emptyAction: "مواد غذاییم رو اضافه می‌کنم",
    addPlaceholder: "چیز دیگری هم داری؟ اینجا بنویس",
    addAction: "افزودن",
    removeIngredient: "حذف این ماده",
    submit: "ببین چی میشه پخت",
    addMorePhotos: "عکس دیگری اضافه کن",
    analysing: "دارم عکس‌ها رو نگاه می‌کنم…",
  },

  saved: {
    heading: "ذخیره‌شده‌ها",
    subheading: "غذاهایی که کنار گذاشتی تا یک وقت دیگر بپزی.",
    emptyTitle: "هنوز چیزی ذخیره نکردی",
    emptyBody: "روی نشان کنار هر غذا بزن تا اینجا بماند.",
    emptyAction: "برو سراغ پیشنهادها",
    remove: "حذف از ذخیره‌شده‌ها",
    save: "ذخیره کن",
    unsave: "از ذخیره‌شده‌ها بردار",
  },

  random: {
    heading: "نمی‌دونی چی بپزی؟",
    intro: "یک غذا برایت انتخاب می‌کنم؛ خوشت نیامد، یکی دیگر.",
    button: "یک غذا پیشنهاد بده",
    again: "یکی دیگر",
    processing: "دارم فکر می‌کنم…",
  },

  uploadHint: "هر عکس حداکثر ۱۰ مگابایت",
  removePhoto: "حذف عکس",
  processing: "در حال بررسی…",
  resultsHeading: "این‌ها رو می‌تونی درست کنی",
  ingredientsLabel: "مواد لازم:",
  retry: "دوباره تلاش کنید",

  errors: {
    INVALID_UPLOAD:
      "این فایل قابل استفاده نیست. لطفاً عکس با فرمت JPEG، PNG، WebP یا HEIC و حجم کمتر از ۱۰ مگابایت انتخاب کنید.",
    NO_INGREDIENTS:
      "متأسفانه مادهٔ غذایی مشخصی پیدا نشد. لطفاً عکس دیگری بفرستید یا چند ماده بنویسید.",
    NO_RECIPES:
      "متأسفانه مادهٔ غذایی مشخصی پیدا نشد. لطفاً عکس دیگری بفرستید یا چند ماده بنویسید.",
    TIMEOUT: "پاسخ‌گویی بیش از حد طول کشید. لطفاً دوباره تلاش کنید.",
    SERVICE_ERROR: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
  } satisfies Record<ErrorCode, string>,

  /** Fallback for any code this client build does not recognize (contract extension rule). */
  unknownError: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",

  tooManyPhotos: "حداکثر ۳ عکس می‌توانید انتخاب کنید.",
  noPhotoSelected: "لطفاً حداقل یک عکس یا یک ماده اضافه کنید.",

  quickChips: ["مرغ", "تخم مرغ", "گوجه", "برنج", "پیاز", "سیب زمینی"],
} as const;
