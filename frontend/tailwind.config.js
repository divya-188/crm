/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary - Blue (#0062FF)
        primary: {
          50: '#e6f0ff',
          100: '#cce0ff',
          200: '#99c2ff',
          300: '#66a3ff',
          400: '#3385ff',
          500: '#0062FF', // Main brand color
          600: '#0056e6',
          700: '#0049cc',
          800: '#003db3',
          900: '#003099',
        },
        // Secondary - Yellow (#FFC542)
        secondary: {
          50: '#fff9e6',
          100: '#fff3cc',
          200: '#ffe799',
          300: '#ffdb66',
          400: '#ffcf33',
          500: '#FFC542', // Secondary/Accent color
          600: '#e6b03b',
          700: '#cc9b34',
          800: '#b3862d',
          900: '#997126',
        },
        // Accent - Light Blue (#50B5FF)
        accent: {
          50: '#e6f5ff',
          100: '#cceaff',
          200: '#99d6ff',
          300: '#66c1ff',
          400: '#50B5FF', // Accent/Light Blue
          500: '#33adff',
          600: '#1a9fe6',
          700: '#0091cc',
          800: '#0083b3',
          900: '#007599',
        },
        // Success - Green (#3DD598)
        success: {
          50: '#e6f9f2',
          100: '#ccf3e5',
          200: '#99e7cb',
          300: '#66dbb1',
          400: '#3DD598', // Success color
          500: '#33cf8a',
          600: '#2eb97c',
          700: '#29a36e',
          800: '#248d60',
          900: '#1f7752',
        },
        // Danger/Error - Use Primary Blue for errors too
        danger: {
          50: '#e6f0ff',
          100: '#cce0ff',
          200: '#99c2ff',
          300: '#66a3ff',
          400: '#3385ff',
          500: '#0062FF',
          600: '#0056e6',
          700: '#0049cc',
          800: '#003db3',
          900: '#003099',
        },
        // Warning - Use Secondary Yellow
        warning: {
          50: '#fff9e6',
          100: '#fff3cc',
          200: '#ffe799',
          300: '#ffdb66',
          400: '#ffcf33',
          500: '#FFC542',
          600: '#e6b03b',
          700: '#cc9b34',
          800: '#b3862d',
          900: '#997126',
        },
        // Info - Use Accent Light Blue
        info: {
          50: '#e6f5ff',
          100: '#cceaff',
          200: '#99d6ff',
          300: '#66c1ff',
          400: '#50B5FF',
          500: '#33adff',
          600: '#1a9fe6',
          700: '#0091cc',
          800: '#0083b3',
          900: '#007599',
        },
        // Neutral - Slate
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
        body: ['Roboto', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 15px -3px rgba(139, 92, 246, 0.1), 0 10px 20px -2px rgba(139, 92, 246, 0.04)',
        glow: '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-secondary': '0 0 20px rgba(6, 182, 212, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s linear infinite',
        'bounce-soft': 'bounceSoft 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
