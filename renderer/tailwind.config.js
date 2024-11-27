const colors = require('tailwindcss/colors')

module.exports = {
  prefix: 'tw-',
  content: ['./renderer/pages/**/*.{js,ts,jsx,tsx}', './renderer/src/components/**/*.{js,ts,jsx,tsx}', './renderer/src/layout/**/*.{js,ts,jsx,tsx}'],
  theme: {
    colors: {
      // use colors only specified
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
      'respect-nm-5': '#f5bb01',
      'respect-nm-10': '#f95b08aa',
      'respect-nm-15': '#f30253aa',
      'respect-sc-5': '#df0074',
      'respect-sc-10': '#c604e4',
      'respect-sc-15': '#3d66ff',
    },
    extend: {
      animation: {
        fadeInDown: 'fadeInDown 0.5s ease-out forwards',
        fadeInLeft: 'fadeInLeft 0.5s ease-out forwards',
        fadeIn: 'fadeIn 0.5s ease-out',
        fadeOut: 'fadeOut 0.5s ease-in',
        fadeInOut: 'fadeInOut 1s ease infinite alternate',
        fadeInOnly: 'fadeInOut 1s ease forwards',
        notificationProgress: 'notificationProgress 10s linear forwards',
        scaleUpAndScaleDown: 'scaleUpAndScaleDown 0.5s forwards',
        scaleDownAndScaleUp: 'scaleDownAndScaleUp 0.5s forwards',
        fadeInSlideRight: 'fadeInSlideRight 0.4s ease-out',
        fadeOutSlideRight: 'fadeOutSlideRight 0.4s ease-in forwards',
      },
      keyframes: {
        fadeInOut: {
          '0%': { opacity: '0.25' },
          '100%': { opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeOut: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(10px)' },
        },
        notificationProgress: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translateX(10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleUpAndScaleDown: {
          '0%': { transform: 'scale(1.0)' },
          '50%': { transform: 'scale(1.4)' },
          '100%': { transform: 'scale(1.0)' },
        },
        scaleDownAndScaleUp: {
          '0%': { transform: 'scale(1.0)' },
          '50%': { transform: 'scale(0.6)' },
          '100%': { transform: 'scale(1.0)' },
        },
        fadeInSlideRight: {
          '0%': {
            transform: 'translateX(100%)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        fadeOutSlideRight: {
          '0%': {
            transform: 'translateX(0)',
            opacity: '1',
          },
          '100%': {
            transform: 'translateX(100%)',
            opacity: '0',
          },
        },
      },
      scale: {
        102: '1.02',
      },
    },
  },
  plugins: [],
}
