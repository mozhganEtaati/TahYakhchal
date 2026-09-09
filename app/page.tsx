"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Camera, PencilLine } from "lucide-react";
import PhotoSlots from "@/app/components/PhotoSlots";
import QuickChips from "@/app/components/QuickChips";
import RandomDish from "@/app/components/RandomDish";
import { BlurText, Magnet } from "@/components/motion-primitives";
import { Button } from "@/components/ui/button";
import { fa } from "@/messages/fa";
import { useSession } from "@/lib/session";

export default function Home() {
  const router = useRouter();
  const { photos, ingredients, setAnalysed } = useSession();

  /** Photo path: analyse on arrival at the ingredients screen. */
  function goWithPhotos() {
    setAnalysed(false);
    router.push("/ingredients");
  }

  /** Manual path: skip recognition entirely (FR-017). */
  function goManual() {
    setAnalysed(true);
    router.push("/ingredients");
  }

  const hasInput = photos.length > 0 || ingredients.length > 0;

  return (
    <main className="mx-auto max-w-4xl px-5 pb-12 pt-12">
      {/* The one orchestrated load moment on the whole site: headline, intro,
          actions and the cook arrive as a single sequence. */}
      <section className="grid items-center gap-6 md:grid-cols-[1.15fr_0.85fr] md:gap-4">
        <div>
          <h1 className="font-display text-[clamp(2.6rem,9vw,4.5rem)] leading-[1.25]">
            <BlurText text={fa.home.titleLine1} />
            <span className="block text-nana">
              <BlurText text={fa.home.titleLine2} delay={0.18} />
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-5 max-w-[46ch] text-mist"
          >
            {fa.home.intro}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.62, duration: 0.5 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Magnet>
              <Button size="lg" onClick={goWithPhotos} className="gap-2 rounded-xl text-base">
                <Camera className="size-4.5" />
                {fa.home.photoCta}
              </Button>
            </Magnet>
            <Button
              size="lg"
              variant="outline"
              onClick={goManual}
              className="gap-2 rounded-xl border-hairline text-base hover:border-nana"
            >
              <PencilLine className="size-4.5" />
              {fa.home.manualCta}
            </Button>
          </motion.div>
        </div>

        <ChefFigure />
      </section>

      <div className="mt-10">
        <QuickChips />
      </div>

      <div className="mt-10">
        <PhotoSlots />
      </div>

      {/* Sits directly under the input it acts on, not at the foot of the page. */}
      {hasInput && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="mt-6"
        >
          <Button
            size="lg"
            className="w-full rounded-xl text-base"
            onClick={photos.length > 0 ? goWithPhotos : goManual}
          >
            {fa.ingredients.submit}
          </Button>
        </motion.div>
      )}

      <div className="mt-10">
        <RandomDish />
      </div>

      {/* Numbered because this genuinely is a sequence; three across so the
          steps read as peers and the row uses the full width. */}
      <section className="mt-14 border-t border-hairline pt-8">
        <ol className="grid gap-8 sm:grid-cols-3 sm:gap-6">
          {fa.home.steps.map((step, index) => (
            <li key={step.title} className="relative flex gap-4 sm:block">
              {/* Hairline linking one step to the next, desktop only. */}
              {index < fa.home.steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute -start-3 top-4 hidden h-px w-3 bg-hairline sm:block"
                />
              )}
              <span className="grid size-9 flex-none place-items-center rounded-xl border border-nana/50 font-display text-lg text-nana sm:mb-3">
                {(index + 1).toLocaleString("fa-IR")}
              </span>
              <div>
                <p className="font-display text-lg">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-mist">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

    </main>
  );
}

/**
 * The cook. A saturated cartoon would read as clip art dropped on a cold navy
 * ground, so he stands in a pool of saffron — the one warm token, reserved for
 * food — with a soft contact shadow underneath so he is not floating.
 * He enters as the last beat of the hero's load sequence, not a second animation.
 */
function ChefFigure() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.34, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-48 md:mx-0 md:w-full md:max-w-[320px]"
      aria-hidden="true"
    >
      {/* Warm ground so the figure sits in the palette rather than on top of it. */}
      <span className="absolute inset-x-0 bottom-6 top-8 -z-10 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--zaferan)_22%,transparent),transparent)] blur-xl" />

      <Image
        src="/chef.png"
        alt=""
        width={1119}
        height={1406}
        priority
        sizes="(max-width: 768px) 192px, 320px"
        className="relative h-auto w-full select-none"
      />

      {/* Contact shadow. */}
      <span className="mx-auto block h-3 w-3/5 rounded-[100%] bg-black/35 blur-md" />
    </motion.div>
  );
}
