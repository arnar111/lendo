/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0faf4',
          100: '#d4f0e0',
          200: '#a7e1c0',
          300: '#6ec89b',
          400: '#3aad76',
          500: '#2d8a5e',
          600: '#1B4D3E',
          700: '#163f33',
          800: '#113228',
          900: '#0c251d',
        },
      },
    },
  },
  plugins: [],
}
