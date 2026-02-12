const winter = require('daisyui/src/theming/themes')['[data-theme=winter]'];
const halloween = require('daisyui/src/theming/themes')['[data-theme=halloween]'];

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        hungryLight: {
          ...winter,
          primary: '#2563eb',
          secondary: '#0ea5e9',
          accent: '#22c55e',
          neutral: '#1f2937',
          'base-100': '#f8fafc',
          'base-200': '#e2e8f0',
          'base-300': '#cbd5e1',
          info: '#38bdf8',
          success: '#16a34a',
          warning: '#f59e0b',
          error: '#dc2626',
        },
      },
      {
        hungryDark: {
          ...halloween,
          primary: '#f97316',
          secondary: '#fbbf24',
          accent: '#22d3ee',
          neutral: '#111827',
          'base-100': '#131720',
          'base-200': '#1f2430',
          'base-300': '#2e3748',
          info: '#38bdf8',
          success: '#22c55e',
          warning: '#facc15',
          error: '#fb7185',
        },
      },
    ],
    darkTheme: 'hungryDark',
  },
};
