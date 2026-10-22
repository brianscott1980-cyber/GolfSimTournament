"use client";

import { useTheme } from "./theme-provider";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({
  className = "",
  showLabel = false,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${className}`}
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to Masters daylight mode" : "Switch to Masters twilight mode"}
      title={isDark ? "Switch to Daylight (Light mode)" : "Switch to Twilight (Dark mode)"}
    >
      {isDark ? (
        <Sun size={15} className="theme-toggle-icon sun" />
      ) : (
        <Moon size={15} className="theme-toggle-icon moon" />
      )}
      {showLabel && (
        <span className="theme-toggle-label">
          {isDark ? "Daylight" : "Twilight"}
        </span>
      )}
    </button>
  );
}

