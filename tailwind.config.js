/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ── Semantic surface colors (via CSS vars) ── */
        surface: {
          DEFAULT:  'var(--bg-primary)',
          secondary:'var(--bg-secondary)',
          elevated: 'var(--bg-elevated)',
          reader:   'var(--bg-reader)',
        },
        /* ── Semantic text colors ── */
        ink: {
          DEFAULT:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary:  'var(--text-tertiary)',
          ghost:     'var(--text-ghost)',
        },
        /* ── Accent (runtime-overridable) ── */
        accent: {
          DEFAULT: 'var(--accent)',
          soft:    'var(--accent-soft)',
          glow:    'var(--accent-glow)',
        },
        border:  'var(--border)',
        success: 'var(--success)',
        danger:  'var(--danger)',

      },
      fontFamily: {
        /* UI fonts */
        sans:       ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        serif:      ['Literata', 'Georgia', 'serif'],
        mono:       ['IBM Plex Mono', 'ui-monospace', 'monospace'],
        /* Reader fonts (user-selectable) */
        literata:     ['Literata', 'Georgia', 'serif'],
        atkinson:     ['Atkinson Hyperlegible', 'sans-serif'],
        merriweather: ['Merriweather', 'Georgia', 'serif'],
        'ibm-plex':   ['IBM Plex Sans', 'sans-serif'],
        outfit:       ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        warm:  '0 2px 12px var(--shadow)',
        'warm-lg': '0 4px 24px var(--shadow)',
        'warm-sm': '0 1px 6px var(--shadow)',
      },
      borderRadius: {
        card: '12px',
        modal: '16px',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)',
      },
    },
  },
  plugins: [],
}
