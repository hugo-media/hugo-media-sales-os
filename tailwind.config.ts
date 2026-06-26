import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        panel: "rgb(var(--color-panel) / <alpha-value>)",
        panel2: "rgb(var(--color-panel-2) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        violet: "rgb(var(--color-violet) / <alpha-value>)",
        blue: "rgb(var(--color-blue) / <alpha-value>)",
        mint: "rgb(var(--color-mint) / <alpha-value>)",
        amber: "rgb(var(--color-amber) / <alpha-value>)",
        rose: "rgb(var(--color-rose) / <alpha-value>)"
      },
      boxShadow: {
        glow: "var(--shadow-glow)"
      }
    }
  },
  plugins: []
};

export default config;
