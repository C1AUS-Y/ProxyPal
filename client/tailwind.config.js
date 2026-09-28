// Design tokens live here (see docs/03-design-system.md).
// Colours, type scale and fonts are the ones from the design reference.
// Spacing uses Tailwind's default scale: gap-2 = 8px (tight),
// gap-6 = 24px (standard), px-4 = 16px (screen edge).

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#606060', // links, buttons, active states, secondary text
        accent: '#e0e0e0', // one call-to-action, highlights
        bg: '#efefef', // page background
        surface: '#ffffff', // cards, panels
        text: '#222222', // body text
      },
      fontSize: {
        heading: ['24px', '32px'],
        subheading: ['18px', '26px'],
        body: ['16px', '24px'],
        small: ['13px', '18px'],
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
