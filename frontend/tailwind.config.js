/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        surface: {
          DEFAULT: "#0b0f14",
          elevated: "#121a24",
          card: "#161f2c",
          border: "rgba(255,255, 255, 0.08)",
        },
        accent: {
          DEFAULT: "#34d399",
          dim: "#10b981",
          glow: "#6ee7b7",
          muted: "rgba(52, 211, 153, 0.15)",
        },
        pastel: {
          lavender: "#e8e4f5",
          mint: "#d1fae5",
          blush: "#fce7f3",
          sky: "#e0f2fe",
        },
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          900: "#064e3b",
        },
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.12), 0 1px 0 rgba(255, 255, 255, 0.06) inset",
        "glass-lg": "0 24px 48px rgba(0, 0, 0, 0.2), 0 1px 0 rgba(255, 255, 255, 0.08) inset",
        glow: "0 0 40px rgba(52, 211, 153, 0.15)",
        "glow-sm": "0 0 20px rgba(52, 211, 153, 0.12)",
        bento: "0 4px 24px rgba(0, 0, 0, 0.25), 0 1px 0 rgba(255, 255, 255, 0.04) inset",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
      animation: {
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        float: "float 8s ease-in-out infinite",
        shimmer: "shimmer 3s ease-in-out infinite",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
      },
      backdropBlur: {
        xs: "2px",
        glass: "16px",
      },
    },
  },
  plugins: [],
};
