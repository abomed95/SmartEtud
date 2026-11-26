/** @type {import('tailwindcss').Config} */
// Les échelles « slate » et « primary » pointent vers des variables CSS (voir index.css).
// Résultat : toutes les pages existantes passent en mode sombre sans réécriture,
// car slate-900 (texte) devient clair et slate-50 (fond) devient noir en mode sombre.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
const scale = (prefix) => Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((k) => [k, v(`${prefix}-${k}`)])
);

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: scale('gray'),
        primary: scale('accent'),
        surface: { DEFAULT: v('surface'), elevated: v('surface-elevated'), grouped: v('grouped') },
        label: { DEFAULT: v('label'), secondary: v('label-secondary') },
        separator: v('separator'),
        dj: { blue: '#6AB2E7', green: '#12AD2B', red: '#D7141A' }, // drapeau de Djibouti
        success: '#34C759', danger: '#FF3B30', warning: '#FF9500',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', 'Inter', '"Segoe UI"', 'Roboto', 'system-ui', 'sans-serif'],
        mono: ['"SF Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.125rem', '3xl': '1.5rem' },
      boxShadow: {
        card: '0 0 0 0.5px rgb(var(--separator) / 0.6), 0 1px 2px rgb(0 0 0 / 0.04)',
        'card-hover': '0 0 0 0.5px rgb(var(--separator) / 0.6), 0 8px 24px -8px rgb(0 0 0 / 0.12)',
        sheet: '0 24px 64px -12px rgb(0 0 0 / 0.35)',
      },
      transitionTimingFunction: { apple: 'cubic-bezier(0.25, 0.1, 0.25, 1)' },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
