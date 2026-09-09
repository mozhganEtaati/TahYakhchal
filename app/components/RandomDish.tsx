"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Dices } from "lucide-react";
import ResultList from "@/app/components/ResultList";
import { ErrorPanel } from "@/app/components/StatusPanel";
import { Magnet } from "@/components/motion-primitives";
import { Button } from "@/components/ui/button";
import { fa } from "@/messages/fa";
import { useSession } from "@/lib/session";

/** Client-side ceiling so the user is never left waiting past 30s (SC-106). */
const CLIENT_TIMEOUT_MS = 30_000;

/**
 * One press, one dish (FR-101). Deliberately reads neither photos nor the
 * ingredient list, and never clears them (FR-110).
 */
export default function RandomDish() {
  const {
    randomRecipe,
    setRandomRecipe,
    randomStatus,
    setRandomStatus,
    randomErrorCode,
    setRandomErrorCode,
    seenTitles,
    addSeenTitle,
  } = useSession();

  const inFlight = useRef(false);
  const busy = randomStatus === "processing";

  async function pickDish() {
    // Extra presses are ignored, not queued (FR-105).
    if (inFlight.current || busy) return;
    inFlight.current = true;

    setRandomStatus("processing");
    setRandomErrorCode(null);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

    try {
      const response = await fetch("/api/random", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seenTitles }),
        signal: controller.signal,
      });
      const result = await response.json();

      if (result?.ok === true) {
        setRandomRecipe(result.recipe);
        addSeenTitle(result.recipe.title);
        setRandomStatus("done");
      } else {
        setRandomStatus("error");
        setRandomErrorCode(result?.code ?? "SERVICE_ERROR");
      }
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "AbortError";
      setRandomStatus("error");
      setRandomErrorCode(timedOut ? "TIMEOUT" : "SERVICE_ERROR");
    } finally {
      clearTimeout(timer);
      inFlight.current = false;
    }
  }

  return (
    <section className="rounded-2xl border border-hairline bg-taaqche p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl">{fa.random.heading}</h2>
          <p className="mt-1 text-sm text-mist">{fa.random.intro}</p>
        </div>

        <Magnet>
          <Button
            size="lg"
            onClick={pickDish}
            disabled={busy}
            className="gap-2 rounded-xl text-base"
          >
            <motion.span
              animate={busy ? { rotate: 360 } : { rotate: 0 }}
              transition={
                busy
                  ? { duration: 1.1, repeat: Infinity, ease: "linear" }
                  : { type: "spring", stiffness: 300, damping: 20 }
              }
              className="inline-flex"
            >
              <Dices className="size-4.5" />
            </motion.span>
            {busy ? fa.random.processing : randomRecipe ? fa.random.again : fa.random.button}
          </Button>
        </Magnet>
      </div>

      {/*
        Screen readers get no signal from a spinning icon or a changed button label,
        so state changes are announced here. Politely, so an arriving dish does not
        interrupt whatever the user is reading. ErrorPanel already carries role="alert".
      */}
      <p aria-live="polite" className="sr-only">
        {busy
          ? fa.random.processing
          : randomStatus === "done" && randomRecipe
            ? `${fa.resultsHeading}: ${randomRecipe.title}`
            : ""}
      </p>

      <AnimatePresence mode="wait">
        {randomStatus === "error" && randomErrorCode && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ErrorPanel code={randomErrorCode} />
          </motion.div>
        )}

        {randomStatus === "done" && randomRecipe && (
          <motion.div
            // Keyed by title so a new dish animates in rather than swapping silently.
            key={randomRecipe.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Reuses the ingredient-flow card, so saving works and the two look identical. */}
            <ResultList recipes={[randomRecipe]} heading={null} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
