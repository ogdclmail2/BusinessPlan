/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f4f6f7',
          100: '#e4e9eb',
          200: '#c8d2d6',
          300: '#a3b2b8',
          400: '#788d95',
          500: '#5c727a',
          600: '#485a61',
          700: '#3c4a50',
          800: '#293338',
          900: '#171e21'
        },
        signal: {
          DEFAULT: '#0f6e63', // deep teal — primary actions, wells/production accent
          light: '#e7f3f1'
        },
        flag: {
          DEFAULT: '#b45309', // amber — reserved strictly for override/attention states
          light: '#fdf1e3'
        },
        accent: {
          blue: '#2563eb',    // oil / liquid metrics
          orange: '#f97316'   // gas / vapor metrics
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
