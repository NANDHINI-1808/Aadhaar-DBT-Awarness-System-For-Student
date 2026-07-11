/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        govNavy: '#0A2647',
        govSaffron: '#FF9933',
        govGreen: '#0F8B45',
        govCream: '#FBF8F2',
      },
      fontFamily: {
        serifDisplay: ['Fraunces', 'Georgia', 'serif'],
        sansClean: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
