/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        dourado: {
          DEFAULT: "#c9a227",
          light: "#e0c05a",
          dark: "#9c7d1a",
        },
        preto: {
          DEFAULT: "#151312",
          soft: "#211e1c",
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        gold: "0 8px 24px -8px rgba(201, 162, 39, 0.45)",
      },
    },
  },
  plugins: [],
};
