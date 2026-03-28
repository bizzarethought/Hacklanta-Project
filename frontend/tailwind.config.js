/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        climate: {
          bg: '#0a0e1a',
          cyan: '#00d4ff',
          panel: 'rgba(15, 23, 42, 0.7)',
          border: 'rgba(255, 255, 255, 0.1)',
          hazard: {
            low: '#f59e0b',
            medium: '#ea580c',
            high: '#ef4444'
          }
        }
      }
    },
  },
  plugins: [],
}
