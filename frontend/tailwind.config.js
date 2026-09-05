/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ch: {
          bg: '#07070b',
          surface: '#0c0c14',
          elevated: '#111119',
          border: 'rgba(255, 255, 255, 0.06)',
          borderHover: 'rgba(255, 255, 255, 0.12)',
          accent: '#818cf8',
          accentMuted: 'rgba(129, 140, 248, 0.15)',
          cyan: '#67e8f9',
          cyanMuted: 'rgba(103, 232, 249, 0.12)',
          text: '#e2e8f0',
          textMuted: '#64748b',
          textFaint: '#475569',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      animation: {
        'glow': 'glow 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'glass': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'glow-sm': '0 0 20px -4px rgba(129, 140, 248, 0.25)',
        'glow-md': '0 0 32px -4px rgba(129, 140, 248, 0.35), 0 0 20px -4px rgba(103, 232, 249, 0.2)',
        'glow-lg': '0 0 48px -4px rgba(129, 140, 248, 0.4), 0 0 32px -4px rgba(103, 232, 249, 0.25)',
      },
    },
  },
  plugins: [],
}
