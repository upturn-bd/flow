import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Note: In Tailwind CSS 4, darkMode and theme configuration is done in CSS
  // See src/app/globals.css for @custom-variant dark and @theme customizations
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
