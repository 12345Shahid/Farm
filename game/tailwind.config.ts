import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        crypto: {
          50: '#ebf5ff',
          100: '#d6ebff',
          200: '#a8d4ff',
          300: '#7ab8ff',
          400: '#4c9aff',
          500: '#1e7aff',
          600: '#0062e6',
          700: '#004db3',
          800: '#003880',
          900: '#00264d',
        },
        gain: '#00c853',
        loss: '#ff1744',
        gold: '#ffd700',
      },
      fontFamily: {
        mono: ['Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;