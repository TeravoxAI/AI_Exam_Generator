/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#275441',
          light: '#3d7a5e',
          dark: '#1a3a2d',
        },
        background: {
          DEFAULT: '#ded9d5',
          light: '#f5f3f1',
        },
        surface: '#FFFFFF',
        border: {
          DEFAULT: '#c5c0bc',
          light: '#e5e2df',
        },
        text: {
          primary: '#1a1a1a',
          secondary: '#5a5a5a',
          muted: '#8a8a8a',
        },
        success: '#3d8a5a',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
      },
    },
  },
  plugins: [],
}
