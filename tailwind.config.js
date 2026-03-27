/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        fredoka: ['Fredoka', 'sans-serif'],
        nunito: ['Nunito', 'sans-serif'],
      },
      colors: {
        brand: {
          purple: '#7C3AED',
          pink: '#EC4899',
          orange: '#F97316',
          yellow: '#FBBF24',
          green: '#10B981',
          blue: '#3B82F6',
        },
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(253,224,71,0.2), 0 0 30px rgba(124,58,237,0.1)' },
          '50%': { boxShadow: '0 0 25px rgba(253,224,71,0.45), 0 0 60px rgba(124,58,237,0.25)' },
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
