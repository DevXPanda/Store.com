"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

function cn(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function ThemeToggle({ variant = "default" }: { variant?: "default" | "header" }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "h-9 w-9 shrink-0 rounded-lg border",
          variant === "header" ? "border-white/15 bg-white/10" : "border-border bg-muted/50"
        )}
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition",
        variant === "header"
          ? "border-white/15 bg-white/10 text-header-foreground hover:bg-white/20 dark:border-white/10"
          : "border-border bg-card text-card-foreground shadow-sm hover:bg-muted dark:bg-white/10 dark:text-forest-100"
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
    </button>
  );
}
