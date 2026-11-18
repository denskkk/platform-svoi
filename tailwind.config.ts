import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF9E6',
          100: '#FFF0B3',
          200: '#FFE680',
          300: '#FFDD4D',
          400: '#FFD41A',
          500: '#FFCA00', // Жовтий (український)
          600: '#E6B800',
          700: '#CC9F00',
          800: '#B38600',
          900: '#996D00',
        },
        space: {
          50: '#EAF1FF', 100: '#D3E2FF', 200: '#A8C4FF', 300: '#6E98F0', 400: '#3D6FD6',
          500: '#1F4FB5', 600: '#133B93', 700: '#0D2B70', 800: '#0A1F44', 900: '#06122B',
        },
        accent: {
          50: '#E6F2FF',
          100: '#B3DBFF',
          200: '#80C4FF',
          300: '#4DADFF',
          400: '#1A96FF',
          500: '#007FE6', // Блакитний (український)
          600: '#0066B3',
          700: '#004D80',
          800: '#00334D',
          900: '#001A26',
        },
        neutral: {
          50: '#F2F6FD', // Світло-блакитний фон (замість беж)
          100: '#E4ECF8',
          200: '#CFDAEE',
          300: '#B0C0DC',
          400: '#8799BD',
          500: '#657799',
          600: '#4B5B7A',
          700: '#37445F',
          800: '#232E45',
          900: '#121A2C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'ukrainian-pattern': "url('/patterns/ukrainian-pattern.svg')",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config
