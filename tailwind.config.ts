import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        gold: {
          DEFAULT: "#C5A059",
          light: "#DFCDA4",
          dark: "#A37F3F",
        },
        charcoal: "#1A1A1A",
        offwhite: "#FAFAFA",
        surface: "#FFFFFF",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-dm-sans)", "sans-serif"],
      },
      transitionTimingFunction: {
        luxury: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      boxShadow: {
        luxury: "0 4px 20px -5px rgba(197, 160, 89, 0.15)",
      },
    },
  },
  plugins: [],
};
export default config;
