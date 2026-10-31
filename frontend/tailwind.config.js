/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        korzinka: {
          red: '#E31E24',
          yellow: '#FFCB05',
          green: '#22B14C',
          dark: '#1C1C1E',
          gray: '#F4F5F7'
        }
      }
    },
  },
  plugins: [],
}
