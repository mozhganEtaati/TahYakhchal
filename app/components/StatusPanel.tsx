"use client";

import { motion } from "motion/react";
import { fa } from "@/messages/fa";
import { isErrorCode } from "@/lib/errors";

/**
 * Processing and error states.
 * Only ever shows Persian copy from messages/fa.ts — never a code,
 * never raw error text (FR-010, FR-011).
 */

export function ProcessingPanel() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-6 rounded-2xl border border-hairline bg-taaqche p-8 text-center"
    >
      <div className="mx-auto mb-4 flex w-fit gap-1.5">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            className="size-2.5 rounded-full bg-nana"
            animate={{ y: [0, -7, 0], opacity: [0.45, 1, 0.45] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: index * 0.14,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      {fa.processing}
    </div>
  );
}

export function ErrorPanel({ code }: { code: string }) {
  const message = isErrorCode(code) ? fa.errors[code] : fa.unknownError;

  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 rounded-2xl border border-destructive/45 bg-destructive/8 p-6 text-center text-destructive"
    >
      {message}
    </motion.div>
  );
}
