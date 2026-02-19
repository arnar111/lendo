/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F3EEFF',
          100: '#E9DFFE',
          200: '#D4BFFD',
          300: '#A78BFA',
          400: '#8B5CF6',
          500: '#7C3AED',
          600: '#6C3CE1',
          700: '#5B21B6',
          800: '#4C1D95',
          900: '#1E1B4B',
        },
      },
    },
  },
  plugins: [],
}
