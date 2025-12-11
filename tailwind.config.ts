import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#ec4899', // Pink-500
          orange: '#f97316', // Orange-500
          purple: '#a855f7', // Purple-500
        },
        neutral: {
          850: '#1f1f1f',
          900: '#121212',
          950: '#000000',
        }
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #a855f7 100%)',
        'brand-gradient-hover': 'linear-gradient(135deg, #fb923c 0%, #f472b6 50%, #c084fc 100%)',
      }
    },
  },
  plugins: [],
};
export default config;