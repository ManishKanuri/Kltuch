"use client";

import { useEffect, useState } from "react";
import { Icon } from "./icons";

type Theme = "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem("klutch-theme") as Theme) || "dark";
    setTheme(stored);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("klutch-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  return (
    <button
      onClick={toggle}
      className="group relative flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-content transition hover:border-klutch-blue-bright hover:text-klutch-blue-bright"
      aria-label={`Switch to ${theme === "dark" ? "day" : "night"} mode`}
      title={theme === "dark" ? "Night mode" : "Day mode"}
    >
      <Icon name={theme === "dark" ? "moon" : "sun"} size={17} />
    </button>
  );
}
