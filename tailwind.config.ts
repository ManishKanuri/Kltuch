import type { Config } from "tailwindcss";

// Tokens mirror www.klutchsportsedu.com's :root variables (field, ink, paper,
// rule, cta, lime) so the dashboard and the marketing site share one brand.
export default {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Theme-aware surfaces + text — flip between light/dark via CSS vars (globals.css)
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        elevated: "rgb(var(--elevated) / <alpha-value>)",
        content: "rgb(var(--content) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        faint: "rgb(var(--faint) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",

        // Text-safe semantic colors (contrast-checked per theme)
        accent: "rgb(var(--accent) / <alpha-value>)",
        good: "rgb(var(--good) / <alpha-value>)",
        warn: "rgb(var(--warn) / <alpha-value>)",
        bad: "rgb(var(--bad) / <alpha-value>)",

        // Brand hues for fills (bars, markers, icons) — brighter on dark
        hue: {
          blue: "rgb(var(--hue-blue) / <alpha-value>)",
          orange: "rgb(var(--hue-orange) / <alpha-value>)",
          lime: "rgb(var(--hue-lime) / <alpha-value>)",
          amber: "rgb(var(--hue-amber) / <alpha-value>)",
        },

        // Fixed brand colors — same in both themes
        klutch: {
          field: "#123AD6",
          "field-deep": "#0A2288",
          "field-line": "#1E3F86",
          ink: "#0B1228",
          cta: "#CC3A11",
          "cta-hover": "#B5300D",
          lime: "#9FC516",
          // on-dark variants, for fixed navy/blue surfaces (sidebar, report panels)
          "blue-bright": "#4E7BFF",
          "orange-bright": "#FF7043",
          "lime-bright": "#C6E24A",
        },
      },
      // Brand geometry is square: 2px controls, 4px containers. The scale is
      // compressed on purpose so every rounded-* in the app reads as the brand.
      borderRadius: {
        sm: "2px",
        DEFAULT: "2px",
        md: "3px",
        lg: "4px",
        xl: "4px",
        "2xl": "4px",
        "3xl": "6px",
      },
      boxShadow: {
        card: "0 1px 0 rgba(11, 18, 40, 0.04)",
        "card-dark": "none",
        modal: "0 24px 64px -16px rgba(4, 14, 52, 0.55)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      transitionTimingFunction: {
        brand: "cubic-bezier(.22,.61,.36,1)",
        "brand-out": "cubic-bezier(.16,1,.3,1)",
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
        "fade-up": "fade-up 0.3s cubic-bezier(.16,1,.3,1) both",
        "grow-bar": "grow-bar 0.7s cubic-bezier(.16,1,.3,1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
