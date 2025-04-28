/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#121212',
        'black-grid': '#0a0a0a',
        'black-border': '#1a1a1a',
        'black-hover': '#2a2a2a',
      },
      boxShadow: {
        'neon': '0 0 10px rgba(0, 0, 0, 0.5)',
      },
      gridTemplateColumns: {
        '20': 'repeat(20, minmax(0, 1fr))',
      },
      gridTemplateRows: {
        '20': 'repeat(20, minmax(0, 1fr))',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'pulse': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.82s cubic-bezier(.36,.07,.19,.97) both'
      },
      keyframes: {
        'pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: .5 },
        },
        'shake': {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' }
        }
      }
    },
  },
  plugins: [],
}
