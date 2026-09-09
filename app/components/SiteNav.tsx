"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Moon, Refrigerator, Sun } from "lucide-react";
import { fa } from "@/messages/fa";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/", label: fa.nav.home },
  { href: "/ingredients", label: fa.nav.ingredients },
  { href: "/saved", label: fa.nav.saved },
];

export default function SiteNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-20 border-b border-hairline bg-shab/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-nana text-shab">
            <Refrigerator className="size-5" strokeWidth={2.2} />
          </span>
          <span className="font-display text-xl">{fa.brand}</span>
        </Link>

        <div className="flex items-center gap-1">
          {LINKS.map((link) => {
            const current = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? "page" : undefined}
                className="relative px-3 py-1.5 text-sm text-mist transition-colors hover:text-barf aria-[current=page]:text-barf"
              >
                {link.label}
                {current && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-nana"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </Link>
            );
          })}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={fa.nav.toggleTheme}
            title={fa.nav.toggleTheme}
            className="ms-1 rounded-full text-mist hover:text-barf"
          >
            {theme === "dark" ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
          </Button>
        </div>
      </div>
    </nav>
  );
}
