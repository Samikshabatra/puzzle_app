/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './services/**/*.{js,ts,jsx,tsx}',
    './db/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary:   '#2563EB',
          secondary: '#7C3AED',
          accent:    '#E11D48',
          deep:      '#090E17',
          dark:      '#1E293B',
          surface:   '#FFFFFF',
          light:     '#F8FAFC',
          soft:      '#E2E8F0',
          bg:        '#F3F4F6',
        }
      },
      fontFamily: {
        sans: ['"Inter"', '"Outfit"', '"Poppins"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        serif: ['"Merriweather"', 'serif'],
      },
      animation: {
        'fade-in':     'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up':    'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft':  'pulseSoft 3s ease-in-out infinite',
        'float':       'float 6s ease-in-out infinite',
        'reverse-spin':'reverseSpin 1.5s linear infinite',
        'shake':       'shake 0.4s ease',
        'pop':         'pop 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      },
      keyframes: {
        fadeIn:      { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:     { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft:   { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.85' } },
        float:       { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        reverseSpin: { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(-360deg)' } },
        shake:       { '0%,100%': { transform: 'translateX(0)' }, '20%,60%': { transform: 'translateX(-6px)' }, '40%,80%': { transform: 'translateX(6px)' } },
        pop:         { '0%': { transform: 'scale(0.85)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
      },
      boxShadow: {
        'glass':      '0 8px 32px -4px rgba(37, 99, 235, 0.08)',
        'glass-hover':'0 12px 48px -8px rgba(37, 99, 235, 0.15)',
        'premium':    '0 20px 40px -15px rgba(9, 14, 23, 0.05)',
        'inner-glow': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.3)',
      },
      spacing: { '18': '4.5rem' },
    }
  },
  plugins: [],
};
