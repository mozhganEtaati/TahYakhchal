"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * ReactBits-style motion primitives, implemented directly on `motion`
 * so nothing is fetched at build time.
 *
 * House rule: the hero gets ONE orchestrated load moment (BlurText).
 * Everything else here answers a user action.
 */

/** BlurText — words arrive out of focus and settle. Hero only. */
export function BlurText({
  text,
  className,
  delay = 0,
  stagger = 0.08,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const reduced = useReducedMotion();
  const words = text.split(" ");

  if (reduced) return <span className={className}>{text}</span>;

  return (
    <span className={cn("inline-flex flex-wrap gap-x-[0.25em]", className)}>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          initial={{ opacity: 0, filter: "blur(12px)", y: "0.35em" }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{
            duration: 0.7,
            delay: delay + index * stagger,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/** Shared list choreography: items enter and leave in sequence. */
export const listVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 420, damping: 30 },
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
};

/** Magnet — the primary action leans toward the pointer. Pointer devices only. */
export function Magnet({
  children,
  strength = 0.22,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const reduced = useReducedMotion();
  const [fine, setFine] = useState(false);

  useEffect(() => {
    setFine(window.matchMedia("(pointer: fine)").matches);
  }, []);

  const active = fine && !reduced;

  return (
    <motion.div
      ref={ref}
      className={cn("inline-block", className)}
      animate={offset}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      onPointerMove={(event) => {
        if (!active || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        setOffset({
          x: (event.clientX - (rect.left + rect.width / 2)) * strength,
          y: (event.clientY - (rect.top + rect.height / 2)) * strength,
        });
      }}
      onPointerLeave={() => setOffset({ x: 0, y: 0 })}
    >
      {children}
    </motion.div>
  );
}

/** ClickSpark — a short burst confirming a save landed. */
export function Spark({ trigger }: { trigger: number }) {
  const reduced = useReducedMotion();
  if (reduced || trigger === 0) return null;

  return (
    <span className="pointer-events-none absolute inset-0 grid place-items-center">
      {Array.from({ length: 6 }).map((_, index) => {
        const angle = (index / 6) * Math.PI * 2;
        return (
          <motion.span
            key={`${trigger}-${index}`}
            className="absolute size-1 rounded-full bg-limu"
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{
              opacity: 0,
              x: Math.cos(angle) * 22,
              y: Math.sin(angle) * 22,
              scale: 0.3,
            }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />
        );
      })}
    </span>
  );
}
