"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, X } from "lucide-react";
import { fa } from "@/messages/fa";
import { useSession } from "@/lib/session";
import { itemVariants, listVariants } from "@/components/motion-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Rename, remove, add — the corrected list is what recipes are built from (FR-018). */
export default function IngredientList() {
  const { ingredients, renameIngredient, removeIngredient, addIngredient } = useSession();
  const [draft, setDraft] = useState("");

  function submitDraft(event: React.FormEvent) {
    event.preventDefault();
    if (addIngredient(draft)) setDraft("");
  }

  return (
    <>
      <motion.ul
        variants={listVariants}
        initial="hidden"
        animate="show"
        className="flex flex-wrap gap-2"
      >
        <AnimatePresence mode="popLayout">
          {ingredients.map((name, index) => (
            <motion.li
              key={`${name}-${index}`}
              layout
              variants={itemVariants}
              exit="exit"
              className="inline-flex items-center gap-1 rounded-full border border-hairline bg-taaqche-2 py-1 pe-1 ps-3.5"
            >
              <input
                value={name}
                aria-label={name}
                onChange={(event) => renameIngredient(index, event.target.value)}
                style={{ width: `${Math.max(name.length, 4)}ch` }}
                className="border-0 bg-transparent p-0 text-sm text-barf outline-none focus:border-b focus:border-nana"
              />
              <button
                type="button"
                aria-label={fa.ingredients.removeIngredient}
                onClick={() => removeIngredient(index)}
                className="grid size-6 place-items-center rounded-full text-mist transition-colors hover:bg-destructive/15 hover:text-destructive"
              >
                <X className="size-3.5" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      <form onSubmit={submitDraft} className="mt-5 flex gap-2 border-t border-hairline pt-5">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={fa.ingredients.addPlaceholder}
          aria-label={fa.ingredients.addPlaceholder}
          className="h-11 rounded-xl border-hairline bg-transparent text-base placeholder:text-mist"
        />
        <Button
          type="submit"
          variant="outline"
          disabled={!draft.trim()}
          className="h-11 gap-1.5 rounded-xl border-hairline hover:border-nana"
        >
          <Plus className="size-4" />
          {fa.ingredients.addAction}
        </Button>
      </form>
    </>
  );
}
