/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",],
  theme: {
    extend: {
      gridTemplateColumns: {
        'pongTopPage': 'minmax(500px, 1fr) minmax(400px, 1fr)',
      },
      backgroundImage: {
        'navbar-img': "url('./src/assets/NavBar.svg')",
      },
      colors: {
        'primary': '#353535',
        'secondary': '#5D5D5D',
      },
      fontFamily: {
        sans: ["PixelMplus", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
}
