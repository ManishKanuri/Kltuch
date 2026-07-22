import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — flip between light/dark via CSS vars (globals.css)
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        elevated: "rgb(var(--elevated) / <alpha-value>)",
        content: "rgb(var(--content) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        faint: "rgb(var(--faint) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",

        // KLUTCH brand — fixed in both themes (from the logo)
        klutch: {
          blue: "#2244db",
          "blue-bright": "#4f7bff",
          orange: "#f26b1d",
          "orange-bright": "#ff8a3d",
          tennis: "#c7ee3e",
          "tennis-deep": "#a6ce2e",
          ink: "#0a0b0d",
        },

        // Sport identity (categorical — always paired with icon + label)
        sport: {
          football: "#2244db",
          basketball: "#f26b1d",
          tennis: "#a6ce2e",
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(120deg, #2244db 0%, #7a3fb0 45%, #f26b1d 100%)",
        "brand-gradient-soft":
          "linear-gradient(120deg, rgba(34,68,219,0.14), rgba(242,107,29,0.14))",
        "sidebar-glow":
          "radial-gradient(120% 60% at 0% 0%, rgba(34,68,219,0.35), transparent 60%), radial-gradient(90% 50% at 100% 100%, rgba(242,107,29,0.18), transparent 55%)",
      },
      boxShadow: {
        brand: "0 10px 34px -8px rgba(34,68,219,0.45)",
        "brand-orange": "0 10px 34px -8px rgba(242,107,29,0.45)",
        card: "0 1px 2px rgba(10,11,13,0.06), 0 6px 20px -12px rgba(10,11,13,0.25)",
        "card-dark": "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -12px rgba(0,0,0,0.6)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "pulse-dot": {
          "0%,100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.82)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "grow-bar": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 1.6s ease-in-out infinite",
        "fade-up": "fade-up 0.35s ease-out both",
        "grow-bar": "grow-bar 0.7s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
