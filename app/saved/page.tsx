"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import EmptyState from "@/app/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fa } from "@/messages/fa";
import { useSaved } from "@/lib/saved";

export default function SavedPage() {
  const { saved, removeSaved, ready } = useSaved();

  return (
    <main className="mx-auto max-w-4xl px-5 pb-20 pt-12">
      <h1 className="font-display text-3xl sm:text-4xl">{fa.saved.heading}</h1>
      <p className="mt-3 max-w-[52ch] text-mist">{fa.saved.subheading}</p>

      <div className="mt-8">
        {/* Before mount the store is unknown; render nothing rather than a wrong empty state. */}
        {!ready ? null : saved.length === 0 ? (
          <EmptyState
            emoji="📌"
            title={fa.saved.emptyTitle}
            body={fa.saved.emptyBody}
            action={
              <Button asChild size="lg" className="rounded-xl">
                <Link href="/">{fa.saved.emptyAction}</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {saved.map((recipe) => (
                <motion.div
                  key={recipe.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                >
                  <Card className="gap-0 rounded-2xl border-hairline bg-taaqche p-6 shadow-none">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="font-display text-xl text-zaferan">{recipe.title}</h2>
                      <button
                        type="button"
                        aria-label={fa.saved.remove}
                        title={fa.saved.remove}
                        onClick={() => removeSaved(recipe.id)}
                        className="grid size-10 flex-none place-items-center rounded-xl border border-hairline text-mist transition-colors hover:border-destructive hover:text-destructive"
                      >
                        <X className="size-5" />
                      </button>
                    </div>

                    <p className="mt-4 text-sm text-mist">{fa.ingredientsLabel}</p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {recipe.ingredients.map((ingredient, i) => (
                        <li
                          key={`${ingredient}-${i}`}
                          className="rounded-full border border-hairline bg-taaqche-2 px-3 py-0.5 text-sm"
                        >
                          {ingredient}
                        </li>
                      ))}
                    </ul>

                    <ol className="mt-5 grid gap-3">
                      {recipe.steps.map((step, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="mt-2.5 size-1.5 flex-none rounded-full bg-nana" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}
