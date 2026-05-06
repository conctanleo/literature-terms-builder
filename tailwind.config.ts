import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#cc785c",
          active: "#a9583e",
          disabled: "#e6dfd8",
          ring: "rgba(204,120,92,0.20)",
        },
        ink: {
          DEFAULT: "#141413",
          body: "#3d3d3a",
          strong: "#252523",
        },
        muted: { DEFAULT: "#6c6a64", soft: "#8e8b82" },
        hairline: { DEFAULT: "#e6dfd8", soft: "#ebe6df" },
        canvas: { DEFAULT: "#faf9f5" },
        surface: {
          soft: "#f5f0e8",
          card: "#efe9de",
          "cream-strong": "#e8e0d2",
          dark: "#181715",
          "dark-elevated": "#252320",
          "dark-soft": "#1f1e1b",
        },
        "on-dark": { DEFAULT: "#faf9f5", soft: "#a09d96" },
        accent: { teal: "#5db8a6", amber: "#e8a55a" },
        semantic: { success: "#5db872", warning: "#d4a017", error: "#c64545" },
      },
      fontFamily: {
        display: [
          '"Cormorant Garamond"',
          '"Tiempos Headline"',
          '"EB Garamond"',
          "Garamond",
          "Georgia",
          "serif",
        ],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
          '"Cascadia Code"',
          "ui-monospace",
          "monospace",
        ],
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        pill: "9999px",
      },
      spacing: { section: "96px" },
    },
  },
  plugins: [],
};
export default config;
