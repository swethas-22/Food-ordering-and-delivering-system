/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme]'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          midnight: '#0F0F0F',
          gold: '#D4AF37',
          goldHover: '#E5C354',
          royalBlue: '#102542',
          velvetBurgundy: '#4A0E17',
        }
      }
    },
  },
  plugins: [],
}
