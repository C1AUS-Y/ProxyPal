const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: {
        primary: token('primary'),
        accent: token('accent'),
        bg: token('bg'),
        surface: token('surface'),
        text: token('text'),
      },
      fontSize: {
        display: ['40px', { lineHeight: '44px', letterSpacing: '-0.03em' }],
        heading: ['30px', { lineHeight: '36px', letterSpacing: '-0.025em' }],
        subheading: ['19px', { lineHeight: '26px', letterSpacing: '-0.015em' }],
        body: ['16px', { lineHeight: '24px' }],
        small: ['13px', { lineHeight: '18px' }],
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 1px 2px rgb(var(--shadow) / 0.04), 0 10px 28px -12px rgb(var(--shadow) / 0.14)',
        float: '0 2px 6px rgb(var(--shadow) / 0.08), 0 18px 40px -10px rgb(var(--shadow) / 0.28)',
        pop: '0 1px 2px rgb(var(--shadow) / 0.25), 0 8px 20px -6px rgb(var(--shadow) / 0.35)',
      },
      transitionTimingFunction: {
        ios: 'cubic-bezier(0.32, 0.72, 0, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
