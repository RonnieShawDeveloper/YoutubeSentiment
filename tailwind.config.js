/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          // Factory Stone Purple (#7c677f) - for headers and title bars
          50: '#f5f3f6',
          100: '#ebe7ec',
          200: '#d7cfd9',
          300: '#c3b7c6',
          400: '#af9fb3',
          500: '#9b87a0',
          600: '#7c677f', // Base color
          700: '#63526a',
          800: '#4a3e50',
          900: '#312937',
        },
        secondary: {
          // Purple Mountains Majesty (#8076a3) - for header and title shadow and accents, card backgrounds
          50: '#f4f3f7',
          100: '#e9e7ef',
          200: '#d3cfdf',
          300: '#bdb7cf',
          400: '#a79fbf',
          500: '#9187af',
          600: '#8076a3', // Base color
          700: '#675e85',
          800: '#4d4764',
          900: '#332f42',
        },
        accent: {
          // Grassy Green (#9bc400) - for eye-catching items or highlight items
          50: '#f6fae6',
          100: '#edf5cc',
          200: '#dbeb99',
          300: '#c9e166',
          400: '#b7d733',
          500: '#9bc400', // Base color
          600: '#7c9d00',
          700: '#5d7600',
          800: '#3e4e00',
          900: '#1f2700',
        },
        pink: {
          // Misty Mountain Pink (#f9c5bd) - for accents
          50: '#fef4f3',
          100: '#fde9e7',
          200: '#fbd3cf',
          300: '#f9c5bd', // Base color
          400: '#f6a79d',
          500: '#f3897c',
          600: '#c46e63',
          700: '#95524a',
          800: '#673732',
          900: '#381c19',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.5s ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    // Animations plugin is now imported in styles.css using @plugin directive
  ],
}
