"use client";

import { motion } from "motion/react";

/** Shared empty state: an invitation to act, not a shrug (FR-023). */
export default function EmptyState({
  emoji,
  title,
  body,
  action,
}: {
  emoji: string;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-hairline px-6 py-12 text-center">
      <motion.span
        aria-hidden="true"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        className="mb-4 block text-5xl"
      >
        {emoji}
      </motion.span>
      <h3 className="font-display text-xl">{title}</h3>
      <p className="mx-auto mt-2 max-w-[38ch] text-mist">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
