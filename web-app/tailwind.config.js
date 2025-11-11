/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme "The Athletic" inspired
        dark: {
          bg: '#121212',
          surface: '#1A1A1A',
          surfaceLight: '#2A2A2A',
          border: '#374151',
          borderLight: '#4B5563',
        },
        light: {
          bg: '#F6F7FB',
          surface: '#FFFFFF',
          surfaceLight: '#F3F4F6',
          border: '#E5E7EB',
          borderLight: '#F3F4F6',
        },
        accent: {
          DEFAULT: '#10B981',
          dark: '#059669',
          light: '#34D399',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
