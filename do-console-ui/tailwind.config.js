/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'do-blue': '#008bcf',
        'do-blue-dark': '#006ea6',
        'do-sidebar': '#f8f9fa',
        'do-panel': '#f1f3f4',
      },
      boxShadow: {
        'panel': '0 0 0 1px rgba(0,0,0,.06)',
      },
    },
  },
  plugins: [],
}
