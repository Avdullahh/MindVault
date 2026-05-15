/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        leather: {
          50:  '#f5e6c8',
          100: '#e8d5a8',
          200: '#cdb888',
          300: '#a89070',
          400: '#7a6050',
          500: '#4a3520',
          600: '#3d2b1a',
          700: '#251d13',
          800: '#1e1810',
          900: '#141009',
        },
        gold: {
          400: '#d4a017',
          500: '#b8860b',
          600: '#9a6e08',
          700: '#7a5608',
          800: '#5a3e06',
          900: '#3a2804',
        },
        rust: {
          400: '#d45f3c',
          500: '#b84a2a',
          600: '#962f14',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
