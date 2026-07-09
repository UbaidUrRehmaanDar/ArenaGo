import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ground: 'rgb(var(--color-ground) / <alpha-value>)',
        turf: 'rgb(var(--color-turf) / <alpha-value>)',
        chalk: 'rgb(var(--color-chalk) / <alpha-value>)',
        lime: 'rgb(var(--color-lime) / <alpha-value>)',
        amber: 'rgb(var(--color-amber) / <alpha-value>)',
        slate: 'rgb(var(--color-slate) / <alpha-value>)',
        mist: 'rgb(var(--color-mist) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        available: 'rgb(var(--color-available) / <alpha-value>)',
        booked: 'rgb(var(--color-booked) / <alpha-value>)',
        pending: 'rgb(var(--color-pending) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        'on-lime': 'rgb(var(--color-on-lime) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(64px, 10vw, 120px)', { lineHeight: '0.95', letterSpacing: '0.02em' }],
        'display-lg': ['clamp(40px, 6vw, 72px)', { lineHeight: '0.95', letterSpacing: '0.02em' }],
        'display-md': ['clamp(28px, 4vw, 48px)', { lineHeight: '1', letterSpacing: '0.02em' }],
        'body-sm': ['13px', { lineHeight: '1.6' }],
        'body-md': ['15px', { lineHeight: '1.65' }],
        'body-lg': ['18px', { lineHeight: '1.65' }],
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.4)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
