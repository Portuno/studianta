/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.tsx",
    "./constants.tsx",
    "./types.ts",
  ],
  theme: {
    extend: {
      colors: {
        'rosy-bg': '#FFF0F5',
        'rosy-bg-alt': '#FDEEF4',
        'plum': '#4A233E',
        'mauve': '#8B5E75',
        'sophisticated-pink': '#E35B8F',
        'gold': '#D4AF37',
        'border-pink': '#F8C8DC',
        'glass-pink': 'rgba(255, 245, 250, 0.92)',
      },
      fontFamily: {
        'cinzel': ['Marcellus', 'serif'],
        'inter': ['Inter', 'sans-serif'],
        'garamond': ['EB Garamond', 'serif'],
      },
    },
  },
  plugins: [],
}

