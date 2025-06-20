/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors'

export default {
  content: [
    './index.html',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './utils/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './styles/**/*.{js,ts,jsx,tsx}',
    './types/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: ['class'],
  prefix: 'tw',
  theme: {
    colors: {
      black: colors.black,
      white: colors.white,
      gray: colors.gray,
      blue: colors.blue,
      slate: colors.slate,
      zinc: colors.zinc,
      neutral: colors.neutral,
      stone: colors.stone,
      red: colors.red,
      orange: colors.orange,
      amber: colors.amber,
      yellow: colors.yellow,
      lime: colors.lime,
      green: colors.green,
      emerald: colors.emerald,
      teal: colors.teal,
      cyan: colors.cyan,
      sky: colors.sky,
      indigo: colors.indigo,
      violet: colors.violet,
      purple: colors.purple,
      fuchsia: colors.fuchsia,
      pink: colors.pink,
      rose: colors.rose,
      'djmax_respect_v-NM': '#f6c700',
      'djmax_respect_v-HD': '#f9a06a', // 파스텔 톤 주황색
      'djmax_respect_v-MX': '#f57b8a', // 파스텔 톤 핑크색
      'djmax_respect_v-SC': '#6a9eff',
      'platina_lab-EASY': '#ffb31a',
      'platina_lab-HD': '#fd6c6e',
      'platina_lab-OVER': '#bb63da',
      'platina_lab-PLUS-1': '#7581bf',
      'platina_lab-PLUS-2': '#7581bf',
      'platina_lab-PLUS-3': '#7581bf',
    },
    extend: {
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
}
