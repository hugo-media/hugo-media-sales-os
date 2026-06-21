import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#080A10",
        panel: "#11141F",
        panel2: "#171B29",
        line: "#262B3A",
        violet: "#8B5CF6",
        blue: "#38BDF8",
        mint: "#22C55E",
        amber: "#F59E0B",
        rose: "#FB7185"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(139, 92, 246, 0.18), 0 24px 70px rgba(0, 0, 0, 0.36)"
      }
    }
  },
  plugins: []
};

export default config;
