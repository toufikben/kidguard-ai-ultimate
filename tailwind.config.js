/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE',
          300: '#93C5FD', 400: '#60A5FA', 500: '#3B82F6',
          600: '#2563EB', 700: '#1D4ED8', 800: '#1E40AF',
          900: '#1E3A8A',
        },
        danger: {
          400: '#F87171', 500: '#EF4444', 600: '#DC2626', 700: '#B91C1C',
        },
        success: {
          400: '#34D399', 500: '#10B981', 600: '#059669',
        },
        warn: {
          400: '#FBBF24', 500: '#F59E0B', 600: '#D97706',
        },
        surface: {
          light: '#F8FAFC',
          dark: '#0B1220',
          card: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Cairo', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        glow: '0 0 20px rgba(59, 130, 246, 0.35)',
        danger: '0 0 24px rgba(239, 68, 68, 0.45)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
};
