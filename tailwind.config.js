module.exports = {
  purge: { content: ["./public/**/*.html", "./src/**/*.vue"] },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: { margin: { "-4": "-4px" } },
  },
  variants: {
    extend: {},
  },
  plugins: [require("@tailwindcss/forms")],
};
