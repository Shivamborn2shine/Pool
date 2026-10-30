import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-primary)",
        surface: "var(--bg-surface)",
        "surface-elevated": "var(--bg-elevated)",
        foreground: "var(--text-primary)",
        muted: "var(--text-muted)",
        border: "var(--border-color)",
        brand: {
          DEFAULT: "#18181B",
          light: "#27272A",
          dark: "#09090B",
        },
        accent: {
          DEFAULT: "#C2410C",
          hover: "#9A3412",
          soft: "#FFEDD5",
        },
        success: {
          DEFAULT: "#15803D",
          soft: "#DCFCE7",
        },
        warning: {
          DEFAULT: "#B45309",
          soft: "#FEF3C7",
        },
        danger: {
          DEFAULT: "#B91C1C",
          soft: "#FEE2E2",
        },
      },
      borderRadius: {
        none: "0px",
        xs: "2px",
        sm: "4px",
        DEFAULT: "4px",
        md: "6px",
        lg: "6px",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
