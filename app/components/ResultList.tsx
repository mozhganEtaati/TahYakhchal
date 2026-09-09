"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { fa } from "@/messages/fa";
import type { RecipeSuggestion } from "@/lib/schema";
import { useSaved } from "@/lib/saved";
import { Spark } from "@/components/motion-primitives";
import { Card } from "@/components/ui/card";

/**
 * Card order is title → ingredients → steps, per FR-005.
 * `heading` defaults to the results heading; pass null to render cards alone
 * (feature 002 embeds a single card under its own heading).
 */
export default function ResultList({
  recipes,
  heading = fa.resultsHeading,
}: {
  recipes: RecipeSuggestion[];
  heading?: string | null;
}) {
  return (
    <section className={heading ? "mt-10" : "mt-6"}>
      {heading && <h2 className="mb-5 font-display text-2xl">{heading}</h2>}
      <div className="grid gap-4">
        {recipes.map((recipe, index) => (
          <RecipeCard key={`${recipe.title}-${index}`} recipe={recipe} index={index} />
        ))}
      </div>
    </section>
  );
}

function RecipeCard({ recipe, index }: { recipe: RecipeSuggestion; index: number }) {
  const { isSaved, toggleSave } = useSaved();
  const [sparkKey, setSparkKey] = useState(0);
  const saved = isSaved(recipe);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.09, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="gap-0 rounded-2xl border-hairline bg-taaqche p-6 shadow-none">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-display text-xl text-zaferan">{recipe.title}</h3>

          <button
            type="button"
            aria-pressed={saved}
            aria-label={saved ? fa.saved.unsave : fa.saved.save}
            title={saved ? fa.saved.unsave : fa.saved.save}
            onClick={() => {
              if (!saved) setSparkKey((key) => key + 1);
              toggleSave(recipe);
            }}
            className={
              saved
                ? "relative grid size-10 flex-none place-items-center rounded-xl bg-limu text-shab"
                : "relative grid size-10 flex-none place-items-center rounded-xl border border-hairline text-mist transition-colors hover:border-limu hover:text-limu"
            }
          >
            {saved ? <BookmarkCheck className="size-5" /> : <Bookmark className="size-5" />}
            <Spark trigger={sparkKey} />
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
  );
}
