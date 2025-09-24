import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0ea5a0",
          light: "#6ee7e1",
          dark: "#0d9488",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

