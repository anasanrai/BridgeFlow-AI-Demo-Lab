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
        base: "#000000",
        surface: "#0A0A0A",
        card: "#111111",
        elevated: "#1C1C1E",
        accent: "#6366F1",
        "accent-dim": "rgba(99,102,241,0.12)",
        t1: "#FFFFFF",
        t2: "#EBEBF5",
        t3: "#8E8EA0",
        t4: "#48484A",
        "border-s": "rgba(255,255,255,0.06)",
        "border-d": "rgba(255,255,255,0.10)",
        "border-st": "rgba(255,255,255,0.18)",
        live: "#30D158",
        warn: "#FF9F0A",
        error: "#FF453A",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        pill: "980px",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "14px", letterSpacing: "0.12em" }],
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "'SF Pro Display'", "'SF Pro Text'", "system-ui", "sans-serif"],
        mono: ["'SF Mono'", "'Fira Code'", "monospace"],
      },
      backdropBlur: {
        apple: "20px",
      },
      animation: {
        "fade-up": "fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "pulse-dot": "pulseDot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
