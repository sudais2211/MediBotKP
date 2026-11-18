/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        robotics: {
          dark: '#0b0f19',
          panel: '#111827',
          surface: '#1f2937',
          border: '#374151',
          accent: '#06b6d4',
          cyan: '#06b6d4',
          teal: '#14b8a6',
          danger: '#ef4444',
          warning: '#f59e0b',
          success: '#10b981',
          purple: '#8b5cf6'
        }
      }
    },
  },
  plugins: [],
}
