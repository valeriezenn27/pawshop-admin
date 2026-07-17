import type { Config } from "tailwindcss";

function withOpacity(variable: string) {
  return `rgb(var(${variable}) / <alpha-value>)`;
}

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: withOpacity("--brand-50"),
          100: withOpacity("--brand-100"),
          200: withOpacity("--brand-200"),
          300: withOpacity("--brand-300"),
          400: withOpacity("--brand-400"),
          500: withOpacity("--brand-500"),
          600: withOpacity("--brand-600"),
          700: withOpacity("--brand-700"),
          800: withOpacity("--brand-800"),
          900: withOpacity("--brand-900"),
        },
        stone: {
          50: withOpacity("--stone-50"),
          100: withOpacity("--stone-100"),
          200: withOpacity("--stone-200"),
          300: withOpacity("--stone-300"),
          400: withOpacity("--stone-400"),
          500: withOpacity("--stone-500"),
          600: withOpacity("--stone-600"),
          700: withOpacity("--stone-700"),
          800: withOpacity("--stone-800"),
          900: withOpacity("--stone-900"),
          950: withOpacity("--stone-950"),
        },
        surface: withOpacity("--surface"),
        accent: withOpacity("--accent"),
        "inverse-from": withOpacity("--inverse-from"),
        "inverse-to": withOpacity("--inverse-to"),
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
