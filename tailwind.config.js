/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:      '#0F1117',
        bg2:     '#1A1D27',
        bg3:     '#22263A',
        accent:  '#F5A623',
        accent2: '#E8882A',
        text:    '#F0F0F0',
        subtext: '#9099B0',
        success: '#2ECC71',
        danger:  '#E74C3C',
        info:    '#3498DB',
        purple:  '#9B59B6',
        border:  '#2E3350',
        'row-odd':  '#1A1D27',
        'row-even': '#1E2135',
      },
      fontFamily: {
        sans:    ["'Sora'", 'system-ui', 'sans-serif'],
        mono:    ['ui-monospace', 'monospace'],
        display: ["'DM Serif Display'", 'serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-in-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
