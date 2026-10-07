/**
 * Snowball UI — Tailwind preset.
 *
 * Maps Tailwind's colour and shadow utilities onto the CSS variables that
 * lib/theme.ts writes at runtime, so a class such as `bg-neu-surface` or
 * `shadow-neu-btn` re-themes automatically when the theme changes. Hardcoding
 * hex here would freeze the dark palette into the utilities and break the
 * light theme.
 *
 * Usage in the consuming app's tailwind.config.js — see README.md for the
 * full wiring. The example below is in line comments on purpose: a content
 * glob contains a star-slash sequence that would close a block comment early
 * and break every JS parser that loads this file (Tailwind loads it via
 * jiti/sucrase when processing the app's stylesheets).
 */

//   import snowballPreset from '@snowball/ui/tailwind-preset'
//   export default {
//     presets: [snowballPreset],
//     content: [
//       './index.html',
//       './src/**/*.{ts,tsx}',
//       './node_modules/@snowball/ui/dist/**/*.js', // utilities used inside the kit
//     ],
//   }

export default {
  theme: {
    extend: {
      colors: {
        'neu-base': 'var(--bg)',
        'neu-surface': 'var(--bg2)',
        'neu-sunken': 'var(--sunken)',
        'neu-row': 'var(--row)',
        'neu-row-hover': 'var(--row-hover)',
        'neu-border': 'var(--neu-border)',
        ink: 'var(--bg2)',
        ink2: 'var(--row-hover)',
        panel: 'var(--bg2)',
        'txt': 'var(--txt)',
        'txt2': 'var(--txt2)',
        'txt3': 'var(--txt3)',
        accent: 'var(--accent)',
        accent2: 'var(--accent2)',
        ok: 'var(--ok)',
        warn: 'var(--warn)',
        danger: 'var(--danger)',
        info: 'var(--info)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
      },
      boxShadow: {
        'neu-panel': '8px 8px 20px var(--shadow-dark), -6px -6px 16px var(--shadow-light), inset 0 1px 1px var(--sheen-line)',
        'neu-inset': 'inset 3px 3px 6px var(--shadow-inset-dark), inset -2px -2px 5px var(--shadow-inset-light)',
        'neu-row': '0 4px 10px var(--shadow-dark), inset 0 1px 0 var(--shadow-light-soft)',
        'neu-row-hover': '0 6px 14px var(--shadow-dark), inset 0 1px 0 var(--sheen-line)',
        'neu-btn': '4px 4px 10px var(--shadow-dark), -2px -2px 6px var(--shadow-light-soft), inset 0 1px 1px var(--sheen-line)',
        'neu-btn-pressed': 'inset 2px 2px 5px var(--shadow-inset-dark), inset -1px -1px 3px var(--shadow-inset-light)',
        'neu-pill': '2px 2px 5px var(--shadow-dark), -1px -1px 3px var(--shadow-light)',
        neo: '5px 5px 12px var(--shadow-dark), -5px -5px 12px var(--shadow-light-soft)',
        'neo-lg': '9px 9px 20px var(--shadow-dark), -9px -9px 20px var(--shadow-light-soft)',
        'neo-in': 'inset 4px 4px 9px var(--shadow-inset-dark), inset -4px -4px 9px var(--shadow-inset-light)',
        'neo-in-lg': 'inset 6px 6px 13px var(--shadow-inset-dark), inset -6px -6px 13px var(--shadow-inset-light)'
      }
    }
  }
}
