/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "prfc-red": "#831002",
        "prfc-brown": "#523018",
        "prfc-tan": "#fadfc4",
        "prfc-cream": "#EDDDCC",
        "prfc-dark-brown": "#3e1c00",
        "prfc-border": "#968676",
      },
      fontFamily: {
        komika: ["Komika Axis", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
      },
    },
  },
  plugins: [],
};
