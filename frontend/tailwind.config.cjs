/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",],
  theme: {
    extend: {
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
