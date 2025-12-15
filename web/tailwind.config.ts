import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        highlight: "#e5aa00",
        background: "#f7f2eb",
        section: "#f0cdb5",
        textDark: "#833000",
        textSubtle: "#a73c00",
        accent: "#b14300",
        brand: {
          primary: "#e5aa00",
          forest: "#833000",
          card: "#b14300",
          muted: "#f0cdb5",
          surface: "#a73c00"
        }
      }
    }
  },
  plugins: []
};

export default config;
