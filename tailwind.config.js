/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Green color scheme
        primary: {
          DEFAULT: '#2d6a4f',
          light: '#d4ecdb',
          dark: '#1b4332',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#40916c',
          600: '#2d6a4f',
          700: '#1b4332',
          800: '#14532d',
          900: '#052e16',
        },
        accent: {
          DEFAULT: '#40916c',
          light: '#95d5b2',
          dark: '#2d6a4f',
        },
      },
    },
  },
  plugins: [],
};
