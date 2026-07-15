/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
      extend: {
        colors: {
          brand: {
            50: '#eef4ff', 100: '#dbe6fe', 500: '#3b6cf5', 600: '#2952d6', 700: '#1f3fa8',
          },
        },
      },
    },
    plugins: [],
  };