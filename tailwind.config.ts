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
          50: '#F7F3EF', // Світло-бежевий фон
          100: '#EDE5DC',
          200: '#DDD0C1',
          300: '#CCBAA6',
          400: '#BCA58B',
          500: '#AB8F70',
          600: '#8C7359',
          700: '#6D5842',
          800: '#4E3D2B',
          900: '#2F2214',
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
      },
    },
  },
  plugins: [],
}
export default config
