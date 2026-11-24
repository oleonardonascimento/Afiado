"use client";

/**
 * ThemeToggle — alterna claro/escuro. Padrão segue o sistema (next-themes).
 * Teclado: botão nativo.
 */
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Usar tema claro" : "Usar tema escuro"}
    >
      <Sun className="hidden dark:block" strokeWidth={1.75} aria-hidden />
      <Moon className="dark:hidden" strokeWidth={1.75} aria-hidden />
    </Button>
  );
}
