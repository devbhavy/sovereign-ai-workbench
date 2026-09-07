"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * Which icon shows is decided in CSS off the `.dark` class rather than from
 * React state, so there is no hydration mismatch and no first-paint flash —
 * next-themes sets the class before the page renders.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar focus-visible:outline-none"
    >
      <SunIcon className="hidden size-4 dark:block" aria-hidden />
      <MoonIcon className="block size-4 dark:hidden" aria-hidden />
    </button>
  );
}
