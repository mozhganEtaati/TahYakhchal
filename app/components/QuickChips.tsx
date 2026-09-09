"use client";

import { motion } from "motion/react";
import { Check, Plus } from "lucide-react";
import { fa } from "@/messages/fa";
import { useSession } from "@/lib/session";

/** One-tap common ingredients (FR-019). Each tap gets a spring. */
export default function QuickChips() {
  const { ingredients, addIngredient, removeIngredient } = useSession();

  return (
    <div>
      <p className="mb-3 text-sm text-mist">{fa.home.chipsLabel}</p>
      <div className="flex flex-wrap gap-2">
        {fa.quickChips.map((name) => {
          const index = ingredients.indexOf(name);
          const added = index !== -1;
          return (
            <motion.button
              key={name}
              type="button"
              aria-pressed={added}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 500, damping: 24 }}
              onClick={() => (added ? removeIngredient(index) : addIngredient(name))}
              className={
                added
                  ? "inline-flex items-center gap-1.5 rounded-full border border-nana bg-nana/12 px-4 py-1.5 text-sm text-nana"
                  : "inline-flex items-center gap-1.5 rounded-full border border-dashed border-hairline px-4 py-1.5 text-sm text-barf transition-colors hover:border-nana hover:text-nana"
              }
            >
              {added ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
              {name}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
