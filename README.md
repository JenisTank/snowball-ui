# @snowball/ui

Snowball neumorphic UI kit — extracted from CA.Snowball. One package gives you:

- **Runtime theme engine** — pick 5 colours, everything else (surfaces, sunken wells, row shading, the whole neomorphic shadow set, sheen) is derived in JS, including an automatic light/dark polarity flip based on perceived luminance
- **Built-in themes** — Snowball Dark, Snowball Light, SnowLight Cool (plus fully custom themes)
- **Token CSS** — `.neo` / `.neo-btn` / `.neo-chip` / `.field` / `.card` / `.tbl` / `.pill` / `.navlink` component classes, status pills, toast, skeletons — all driven by CSS variables
- **Tailwind preset** — `bg-neu-surface`, `text-txt`, `shadow-neu-btn`, … resolve to the theme variables
- **React component kit** — `Icon` (60+ icons), `Avatar`, `StatusPill`, `Modal`, `EmptyState`, `AsyncButton`, `Skeleton`, `ProgressOverlay`, `ErrorBoundary`, `PageHead`, `useToast`, `formatError`/`reportError`
- **Theme drawer** — `<FloatingTheme />` live-preview picker (presets, colour pickers, shadow-depth slider, per-user + firm-default persistence)

Requires **React ≥ 18**, **Tailwind CSS ≥ 3.4**, and a Vite-style bundler that runs CSS through PostCSS.

## Install

```bash
npm install github:JenisTank/snowball-ui#v1.0.0
```

Always pin a **tag** (or commit SHA), not a branch — branches move under you. npm builds `dist/` automatically on install via the package's `prepare` script.

> **Private repo?** `snowball-ui` is private, so every machine or CI runner that runs `npm install` needs GitHub **read** access to `JenisTank/snowball-ui` — an HTTPS credential-helper login or an SSH key that can read the repo. npm fetches git dependencies through git, so it uses git's own credentials. (Public repo = zero setup.)

Upgrade later with:

```bash
npm update @snowball/ui
# or bump the tag explicitly:
npm install github:JenisTank/snowball-ui#v1.1.0
```

## Wire it up (4 steps)

**1. Tailwind preset** — `tailwind.config.js`:

```js
import snowballPreset from '@snowball/ui/tailwind-preset'

export default {
  presets: [snowballPreset],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    // utilities used INSIDE the kit's components must be scanned too:
    './node_modules/@snowball/ui/dist/**/*.js',
  ],
}
```

**2. Styles + first paint** — in your entry (`src/main.tsx`), before React mounts:

```tsx
import '@snowball/ui/styles.css'   // kit CSS FIRST — see the note below
import './index.css'               // your own stylesheet keeps the 3 @tailwind directives
import { applyTheme, loadTheme } from '@snowball/ui/theme'

// Paint the saved theme before React mounts — doing this inside a component
// would flash the default palette for one frame.
applyTheme(loadTheme())
```

**Import order matters:** import `@snowball/ui/styles.css` *before* your own stylesheet. Tailwind flattens each file's `@layer components` into its `@tailwind components` position, so this puts the kit's component classes ahead of your `@tailwind utilities` in the final CSS — which is what lets your utilities override them (e.g. adding `bg-[color:var(--bg)]` to a kit `Modal`, or `text-[12px]` on a `neo-btn`). The kit's CSS deliberately carries only `@tailwind components;` — your stylesheet keeps `@tailwind base` and `@tailwind utilities`, so nothing is emitted twice. Kit classes beat preflight by specificity in either order.

**3. Components:**

```tsx
import { Icon, StatusPill, Modal, EmptyState, PageHead } from '@snowball/ui/components'
import FloatingTheme from '@snowball/ui/FloatingTheme'   // optional theme drawer
```

**4. (Optional) Theme drawer** — drop `<FloatingTheme />` anywhere in your layout (it renders a fixed gear button + right-side drawer with live preview).

That's the whole integration.

## Theming

A theme is **5 colours** (`bg`, `accent`, `txt`, `txt2`, plus optional `bg2`/`sunken`/`row`/`rowHover`/semantics) and a `depth` 0–100. Everything else is derived:

```ts
import { THEMES, DEFAULT_THEME, deriveVars, applyTheme, saveTheme, type Theme } from '@snowball/ui/theme'

const myTheme: Theme = {
  id: 'acme', name: 'Acme',
  bg: '#101418', accent: '#f59e0b', txt: '#f1f5f9', txt2: '#c7d2e8',
  depth: 70,
}
applyTheme(myTheme)   // writes ~28 CSS vars onto <html>, sets data-theme
saveTheme(myTheme)    // persists to localStorage (key: theme-v1)
```

- `deriveVars(theme)` returns the full variable map — handy for previews/swatches.
- `loadTheme()` resolves: personal choice → firm default (`firm-theme-v1`) → Snowball Dark.
- Colour maths are exported too: `luminance`, `isLight`, `contrast` (WCAG 2.1), `shade`/`tint`, `mix`, `alpha`, `hexToRgb`/`rgbToHex`.

**The one rule:** components use tokens (`var(--bg2)`, `bg-neu-surface`, `text-txt2`, …) and never hardcode hex — a raw hex freezes that element out of theming. The kit enforces this on itself:

```bash
npm run check                          # inside the package repo
npx tsx node_modules/@snowball/ui/scripts/theme-check.ts --scan src   # in YOUR app
```

## Package layout

| Export | What it is |
|---|---|
| `@snowball/ui/theme` | Theme engine: `Theme`, `THEMES`, `deriveVars`, `applyTheme`, persistence, colour maths |
| `@snowball/ui/persist` | `loadPersisted` / `savePersisted` localStorage helpers |
| `@snowball/ui/components` | React component kit (`ui.tsx`) |
| `@snowball/ui/FloatingTheme` | Theme drawer component |
| `@snowball/ui/styles.css` | Token + neomorphic component CSS (source — your Tailwind processes it) |
| `@snowball/ui/tailwind-preset` | Tailwind preset (colours + shadows → CSS vars) |

## Development (this repo)

```bash
npm install
npm run check     # math + contrast + shadow-visibility + parse + no-hardcoded-hex checks
npm run build     # tsc → dist/ (also runs automatically on git installs via `prepare`)
```

### Release flow

1. `npm run build && npm run check` — green
2. Bump `version` in package.json, commit
3. `git tag v1.x.0 && git push origin main --tags`
4. Consumers: `npm install github:JenisTank/snowball-ui#v1.x.0`

## Notes & known gaps

- **Fixed during extraction:** a near-white custom page (`bg` luminance > 0.93) used to derive a card identical to the page (the `noHeadroom` guard was computed but never wired). The card now drops slightly so surfaces always separate.
- **Not derived (yet):** the `.neo-btn-primary` gradient (`--primary-from`/`--primary-to`) is static per `data-theme`, not derived from `accent` — custom themes keep the default indigo gradient. Candidate for a v1.1.
- localStorage keys are `theme-v1` (personal) and `firm-theme-v1` (firm default). If two apps ever share an origin (same host+port), namespace them per app.
- The kit ships TypeScript-compiled ESM (`dist/`) plus `.d.ts`; the CSS and Tailwind preset ship as source.
