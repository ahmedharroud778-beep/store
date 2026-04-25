import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => mounted && setTheme(isDark ? "light" : "dark")}
      className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
      title={isDark ? "Light mode" : "Dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      disabled={!mounted}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}

