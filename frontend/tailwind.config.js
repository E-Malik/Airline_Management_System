/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aerolux: {
          burgundy: '#6B1D2F',
          'burgundy-dark': '#4A1420',
          'burgundy-light': '#8A263D',
          'burgundy-50': '#FBF3F4',
          'burgundy-100': '#F7E6E9',
          gold: '#D4AF37',
          'gold-light': '#F5E7B2',
          'gold-dark': '#9A7D1C',
          charcoal: '#1A1D20',
          slate: '#2B303A',
          platinum: '#F8F9FA',
          pearl: '#F3F4F6'
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
