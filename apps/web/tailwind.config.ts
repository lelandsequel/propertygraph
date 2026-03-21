import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        surface: "#111111",
        border: "#1a1a1a",
        "border-hover": "#2a2a2a",
        accent: "#3B82F6",
        amber: "#F59E0B",
        purple: "#8B5CF6",
        "signal-red": "#EF4444",
        "signal-amber": "#F59E0B",
        "signal-green": "#22C55E",
      },
    },
  },
  plugins: [],
};
export default config;
