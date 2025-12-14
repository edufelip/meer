import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        highlight: "#B55D05",
        background: "#FFFFFF",
        section: "#F3F4F6",
        textDark: "#374151",
        textSubtle: "#6B7280",
        accent: "#EC4899",
        brand: {
          primary: "#2bee79",
          forest: "#112218",
          card: "#234832",
          muted: "#92c9a8",
          surface: "#0f1a13"
        }
      }
    }
  },
  plugins: []
};

export default config;
