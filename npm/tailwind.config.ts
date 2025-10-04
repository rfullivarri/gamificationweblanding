import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#05070F",
        surface: {
          DEFAULT: "#0E1325",
          soft: "rgba(24,31,54,0.7)",
          strong: "rgba(12,17,33,0.85)"
        },
        accent: {
          DEFAULT: "#7D3CFF",
          soft: "#B892FF",
          glow: "rgba(125,60,255,0.45)"
        }
      },
      fontFamily: {
        sans: ["var(--font-manrope)", ...defaultTheme.fontFamily.sans],
        display: ["var(--font-sora)", "var(--font-manrope)", ...defaultTheme.fontFamily.sans]
      },
      boxShadow: {
        glow: "0 20px 50px rgba(125, 60, 255, 0.25)",
        panel: "0 25px 60px rgba(8, 10, 20, 0.55)"
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top, rgba(125,60,255,0.28), rgba(5,7,15,0.6) 60%)",
        "mesh-gradient":
          "radial-gradient(at top left, rgba(125,60,255,0.35), transparent 45%), radial-gradient(at bottom right, rgba(79,172,254,0.25), transparent 55%)"
      }
    }
  },
  plugins: []
};

export default config;
