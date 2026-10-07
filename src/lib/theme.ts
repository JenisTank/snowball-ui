/**
 * Theme engine.
 *
 * A theme is five colours the user picks. Everything else — surfaces, sunken
 * wells, row shading, borders and the whole neomorphic shadow set — is derived
 * from them, because neomorphism only reads correctly when the light and dark
 * halves of each shadow relate to the surface they sit on. Asking someone to
 * choose a shadow colour is how custom themes end up looking broken.
 *
 * Derivation happens here in JS rather than in CSS so it can be exact: we read
 * the background's perceived lightness and flip the whole system — text,
 * shadows, sheen — when it crosses into light territory. That is what makes a
 * white theme actually work instead of turning into grey mud.
 */

export interface Theme {
  id: string
  name: string
  /** Background / main colour — page. */
  bg: string
  /** Card surface — if unset, derived (white on light, lifted on dark). */
  bg2?: string
  /** Sunken / inset surface — wells, search bars. */
  sunken?: string
  /** Foreground / accent — emphasis, links, active states. */
  accent: string
  /** Main font — headings and primary detail. */
  txt: string
  /** Secondary font — supporting detail. */
  txt2: string
  /** Shadow depth 0-100 — controls neomorphism intensity (Option B: hue-tinted but controllable). */
  depth?: number
  /** Optional explicit border colour (overrides derived neu-border). */
  border?: string
  builtIn?: boolean
  /** Table row — main element */
  row?: string
  /** Table row hover */
  rowHover?: string
  // ── 10-font hybrid overrides (auto-derived from Main if not set) ──
  /** Muted font — timestamps, counts */
  txt3?: string
  /** Accent2 — active tab, selected icon */
  accent2?: string
  /** Semantic — success/completed */
  ok?: string
  /** Semantic — warning/pending */
  warn?: string
  /** Semantic — danger/overdue */
  danger?: string
  /** Semantic — info/sent */
  info?: string
  /** Semantic — violet/progress */
  violet?: string
}

export const THEMES: Theme[] = [
  {
    id: 'snowball-dark',
    name: 'Snowball Dark',
    bg: '#0F1219',
    bg2: '#161B26',
    sunken: '#0A0D14',
    row: '#141822',
    rowHover: '#1c2333',
    accent: '#4cc3f7',
    accent2: '#7fd7ff',
    txt: '#e7eef7',
    txt2: '#aab7c9',
    txt3: '#6f7d90',
    ok: '#4ade80',
    warn: '#fbbf24',
    danger: '#fb7185',
    info: '#7dd3fc',
    violet: '#a5b4fc',
    depth: 60,
    builtIn: true,
  },
  {
    id: 'snowball-light',
    name: 'Snowball Light',
    // Image-3 exact + 10-dark lock: grey page #C7C7C7, white cards #FFFFFF, sunken #CBD5E1
    bg: '#C7C7C7',
    bg2: '#E2E8F0',
    sunken: '#CBD5E1',
    row: '#E2E8F0',
    rowHover: '#cbd5e1',
    accent: '#003652',
    accent2: '#1e293b',
    txt: '#000000',
    txt2: '#292929',
    txt3: '#4b5563',
    ok: '#065f46',
    warn: '#78350f',
    danger: '#7f1d1d',
    info: '#0f766e',
    violet: '#4c1d95',
    depth: 100,
    builtIn: true,
  },
  {
    id: 'snowball-light-cool',
    name: 'SnowLight Cool',
    // Clean clinical light: cool grey page (not pure white — needed for neomorphic shadows),
    // white cards, slate accent — maximum clarity with visible depth
    bg: '#E8EBEF',
    bg2: '#E2E8F0',
    sunken: '#CBD5E1',
    row: '#E2E8F0',
    rowHover: '#cbd5e1',
    accent: '#0F172A',
    accent2: '#1E293B',
    txt: '#0F172A',
    txt2: '#334155',
    txt3: '#64748B',
    ok: '#065F46',
    warn: '#92400E',
    danger: '#991B1B',
    info: '#0E7490',
    violet: '#4C1D95',
    depth: 90,
    builtIn: true,
  },
]

export const DEFAULT_THEME = THEMES[0]
// SnowDark/SnowLight are fixed built-ins — editing creates id:'custom', firm default is separate (FIRM_KEY)

/* ── colour maths ─────────────────────────────────────────────────────────── */

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '').trim()
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const n = parseInt(full.padEnd(6, '0').slice(0, 6), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

/**
 * Perceived lightness, 0–1. Uses the sRGB luma weights rather than a plain
 * average because the eye is far more sensitive to green than to blue: a plain
 * average calls pure blue "mid-bright" and picks black text for it.
 */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

export const isLight = (hex: string) => luminance(hex) > 0.5

/** Move a colour toward white (amount > 0) or black (amount < 0). */
export function tint(hex: string, amount: number): string {
  return shade(hex, amount)
}

export function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  const t = amount > 0 ? 255 : 0
  const p = Math.abs(amount)
  return rgbToHex(r + (t - r) * p, g + (t - g) * p, b + (t - b) * p)
}

/** `rgba()` string from a hex plus an alpha. */
export function alpha(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r},${g},${b},${a})`
}

/**
 * Contrast ratio per WCAG 2.1. Used to warn when a custom pairing would be
 * hard to read, rather than silently shipping unreadable text.
 */
export function contrast(fg: string, bg: string): number {
  const chan = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const rel = (hex: string) => {
    const [r, g, b] = hexToRgb(hex)
    return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b)
  }
  const a = rel(fg), b = rel(bg)
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}

/* ── derivation ───────────────────────────────────────────────────────────── */

/**
 * Turn the five chosen colours into the full variable set.
 *
 * The light/dark decision drives everything: on a dark background surfaces get
 * lighter and shadows get darker; on a light background surfaces get lighter
 * still while shadows become soft grey and the highlight becomes pure white.
 */
export function deriveVars(theme: Theme): Record<string, string> {
  // Page vs card lightness are different: fonts sit on card/row (surface), shadows sit on page (bg)
  // Bug fix 2026-09-20: font light/dark was bound to Main (bg) only — white-on-white when page dark + card white.
  const pageLight = isLight(theme.bg)

  const noHeadroom = luminance(theme.bg) > 0.93
  const noFloor = luminance(theme.bg) < 0.05

  // ── Surfaces ── honour explicit bg2/sunken if user pinned them, else derive from page
  const bg2 = theme.bg2
    ? theme.bg2
    : noHeadroom
      ? shade(theme.bg, -0.035) // near-white page: drop the card a touch so it still separates
      : pageLight
        ? '#ffffff'
        : noFloor ? shade(theme.bg, 0.10) : shade(theme.bg, 0.06)
  // For neumorphism Light cards same as page looks best when depth high; but keep white cards for pop.
  // If bg is exactly e8ecf4 we keep bg2 white for table gap? Actually we made bg2 e8ecf4 for valley.
  // Respect explicit bg2 (we set it to e8ecf4 for target) — fallback above already handles it.
  const sunken = theme.sunken
    ? theme.sunken
    : pageLight
      ? '#f1f5f9'
      : shade(theme.bg, -0.35)
  const row = theme.row ? theme.row : (pageLight ? '#ffffff' : shade(theme.bg, 0.04))
  const rowHover = theme.rowHover ? theme.rowHover : (pageLight ? '#f8fafc' : shade(theme.bg, 0.09))

  // Fonts & semantics sit on card/row — use card lightness, not page lightness
  const cardLight = isLight(bg2)
  const light = cardLight // shorthand for font/semantic checks below

  // ── 1) FONT auto ── card light -> dark font, card dark -> light font
  // If user explicitly set txt/txt2 that contrast well vs card, keep; else auto-derive so white-on-white never happens.
  // Auto: tint card for dark, shade card for light.
  let txt: string
  let txt2: string
  if (cardLight) {
    // 10-dark Light: lock to image-3 exact so every card is dark-on-light (no white fonts on white card)
    txt = '#000000'
    txt2 = '#292929'
    // txt3 from 10-set #4b5563, but ensure 4.5:1 vs bg2
    // keep exact if passes, otherwise darken slightly

  } else {
    // card dark -> light fonts, tint from card surface so mixed themes (dark page + white card) get dark font correctly
    txt = mix('#e7eef7', tint(bg2, 0.10), 0.20) // light text with subtle card tint
    // brute: tint card strongly
    const autoLight = tint(bg2, 0.88)
    if (contrast(autoLight, bg2) > contrast(txt, bg2)) txt = autoLight
    if (contrast(txt, bg2) < 9) txt = '#e7eef7'
    txt2 = tint(bg2, 0.55)
    if (contrast(txt2, bg2) < 4.6) txt2 = '#aab7c9'
    for (let k=0; k<3 && contrast(txt2, bg2) < 4.6; k++) txt2 = tint(txt2, 0.06)
  }
  // Allow explicit override if user picked txt that already contrasts well vs card (>4.5) — respects picker
  const userTxtOk = theme.txt && contrast(theme.txt, bg2) >= 4.5
  const userTxt2Ok = theme.txt2 && contrast(theme.txt2, bg2) >= 3.5
  if (userTxtOk) {
    // enforce polarity: card light must NOT keep light txt (white-on-white)
    const userIsLight = isLight(theme.txt)
    if (userIsLight !== cardLight && contrast(theme.txt, bg2) >= 7) txt = theme.txt
  }
  if (userTxt2Ok && contrast(theme.txt2, bg2) >= 4.5) {
    const user2IsLight = isLight(theme.txt2)
    if (user2IsLight !== cardLight || contrast(theme.txt2, bg2) >= 5) txt2 = theme.txt2
  }

  // ── 2) SHADOW auto ── tinted by Page (bg). Card floats on page, so shadow hue follows page.
  // Keep pageLight for shadow polarity so valley depth stays tied to page.
  const depth = typeof theme.depth === 'number' ? theme.depth : (cardLight ? 55 : 60)
  const a = Math.max(0, Math.min(1, depth / 100))
  // highlight = card lifted toward white (so it's visible on the card), shadow = page dropped toward black, both keep hue
  // Light page: highlight = white (card is white), shadow = soft slate-blue from page hue
  // Dark page: highlight subtle, shadow near black
  let shadowDark: string
  let shadowDarkSoft: string
  let shadowInsetDark: string
  let shadowLight: string
  let shadowLightSoft: string
  let shadowInsetLight: string
  let neuDark: string
  let neuLight: string
  if (pageLight) {
    // The lighter the page, the deeper the derived shadow must drop to read:
    // a #E8EBEF page needs a stronger drop than #C7C7C7 or its neomorphism
    // vanishes into the surface (SnowLight Cool rendered flat until this
    // scaled with page lightness).
    const pageLum = luminance(theme.bg)
    const drop = 0.24 + Math.max(0, pageLum - 0.86) * 1.2
    const baseShadow = shade(theme.bg, -drop) // hue-tinted darker — follows Page hue
    const baseHighlight = tint(theme.bg, 0.55)
    shadowDark = alpha(baseShadow, 0.08 + a * 0.62) // 0.08 (flat) .. 0.70 (strong) — slider now obvious
    shadowDarkSoft = alpha(baseShadow, 0.06 + a * 0.42)
    shadowInsetDark = alpha(baseShadow, 0.10 + a * 0.50)
    shadowLight = alpha(baseHighlight, 0.70 + a * 0.28) // also scales a bit
    shadowLightSoft = alpha(baseHighlight, 0.70 + a * 0.28)
    shadowInsetLight = alpha(baseHighlight, 0.80 + a * 0.16)
    neuDark = alpha(baseShadow, 0.08 + a * 0.58)
    // Highlight must be lighter than card (bg2) to be visible. Card is often white → highlight = white.
    neuLight = '#ffffff'
  } else {
    const baseShadow = shade(theme.bg, -0.60)
    const baseHighlight = tint(theme.bg, 0.10)
    shadowDark = alpha(baseShadow, 0.30 + a * 0.55)
    shadowDarkSoft = alpha(baseShadow, 0.20 + a * 0.40)
    shadowInsetDark = alpha(baseShadow, 0.35 + a * 0.50)
    shadowLight = alpha(baseHighlight, 0.02 + a*0.08)
    shadowLightSoft = alpha(baseHighlight, 0.03 + a*0.05)
    shadowInsetLight = alpha(baseHighlight, 0.015 + a*0.04)
    neuDark = alpha(baseShadow, 0.30 + a*0.50)
    neuLight = alpha(baseHighlight, 0.02 + a*0.06)
  }

  let txt3: string
  if (cardLight) {
    txt3 = '#4b5563'
    // ensure vs white cards, else darken
    if (contrast(txt3, bg2) < 4.5) txt3 = '#374151'
  } else {
    txt3 = mix(txt2, bg2, 0.30)
    for (let blend = 0.30; blend >= 0 && contrast(txt3, bg2) < 4.5; blend -= 0.06) {
      txt3 = mix(txt2, bg2, Math.max(0, blend))
    }
  }

  // 10-font hybrid: if user overrode via picker, use it; else use 10-set (keeps Snowball fixed but Custom editable)
  // Semantics also sit on card — use cardLight
  const accent2 = theme.accent2 || (cardLight ? '#1e293b' : shade(theme.accent, 0.25))
  const ok = theme.ok || (cardLight ? '#065f46' : '#4ade80')
  const warn = theme.warn || (cardLight ? '#78350f' : '#fbbf24')
  const danger = theme.danger || (cardLight ? '#7f1d1d' : '#fb7185')
  const info = theme.info || (cardLight ? '#0f766e' : '#7dd3fc')
  const violet = theme.violet || (cardLight ? '#4c1d95' : '#a5b4fc')
  // txt3 hybrid already derived, but allow override
  const finalTxt3 = theme.txt3 || txt3
  const finalAccent2 = accent2

  return {
    '--bg': theme.bg,
    '--bg2': bg2,
    '--sunken': sunken,
    '--row': row,
    '--row-hover': rowHover,
    '--neu-bg': theme.bg,
    '--neu-light': neuLight,
    '--neu-dark': neuDark,
    '--neu-dark-sm': shadowDarkSoft,
    '--neu-border': theme.border || (light ? 'rgba(15,23,42,.12)' : 'rgba(255,255,255,.04)'),
    '--accent': theme.accent,
    '--accent2': finalAccent2,
    '--txt': txt,
    '--txt2': txt2,
    '--txt3': finalTxt3,
    '--shadow-dark': shadowDark,
    '--shadow-dark-soft': shadowDarkSoft,
    '--shadow-light': shadowLight,
    '--shadow-light-soft': shadowLightSoft,
    '--shadow-inset-dark': shadowInsetDark,
    '--shadow-inset-light': shadowInsetLight,
    '--sheen': light ? 'rgba(255,255,255,.60)' : 'rgba(255,255,255,.03)',
    '--sheen-line': light ? 'rgba(255,255,255,.90)' : 'rgba(255,255,255,.05)',
    '--ok': ok,
    '--warn': warn,
    '--danger': danger,
    '--info': info,
    '--violet': violet,
  }
}

/** Blend two colours; `amount` is how much of `b` to mix into `a`. */
export function mix(a: string, b: string, amount: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return rgbToHex(r1 + (r2 - r1) * amount, g1 + (g2 - g1) * amount, b1 + (b2 - b1) * amount)
}

/** Write a theme onto the document. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  const vars = deriveVars(theme)
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
  // data-theme drives :root[data-theme='light'] overrides (pills, tables, chips).
  // Fonts sit on card/row, not page — bind to card surface so mixed themes (dark page + white card) stay readable.
  const cardBg = (vars['--bg2'] as string) || theme.bg2 || theme.bg
  const cardIsLight = isLight(cardBg)
  root.setAttribute('data-theme', cardIsLight ? 'light' : 'dark')
  root.style.colorScheme = cardIsLight ? 'light' : 'dark'
}

/* ── persistence ──────────────────────────────────────────────────────────── */

const KEY = 'theme-v1'

/**
 * Resolution order: this user's choice, else the firm default, else Snowball
 * Dark. The firm default is written by the owner in Settings and cached here so
 * the correct theme paints on first frame rather than flashing.
 */
export function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const t = JSON.parse(raw) as Theme
      if (t && typeof t.bg === 'string') return t
    }
    // No personal theme — fall back to firm default if admin set one
    const firmRaw = localStorage.getItem('firm-theme-v1')
    if (firmRaw) {
      const f = JSON.parse(firmRaw) as Theme
      if (f && typeof f.bg === 'string') return f
    }
  } catch { /* corrupt value: fall through to the default */ }
  return DEFAULT_THEME
}
export function loadFirmTheme(): Theme | null {
  try {
    const raw = localStorage.getItem('firm-theme-v1')
    if (raw) {
      const t = JSON.parse(raw) as Theme
      if (t && typeof t.bg === 'string') return t
    }
  } catch {}
  return null
}
export function loadPersonalTheme(): Theme | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const t = JSON.parse(raw) as Theme
      if (t && typeof t.bg === 'string') return t
    }
  } catch {}
  return null
}
export function themesEqual(a: Theme, b: Theme): boolean {
  return a.bg === b.bg
    && (a.bg2 ?? '') === (b.bg2 ?? '')
    && (a.sunken ?? '') === (b.sunken ?? '')
    && (a.row ?? '') === (b.row ?? '')
    && (a.rowHover ?? '') === (b.rowHover ?? '')
    && a.accent === b.accent
    && (a.accent2 ?? '') === (b.accent2 ?? '')
    && a.txt === b.txt
    && a.txt2 === b.txt2
    && (a.txt3 ?? '') === (b.txt3 ?? '')
    && (a.ok ?? '') === (b.ok ?? '')
    && (a.warn ?? '') === (b.warn ?? '')
    && (a.danger ?? '') === (b.danger ?? '')
    && (a.info ?? '') === (b.info ?? '')
    && (a.violet ?? '') === (b.violet ?? '')
    && (a.depth ?? 60) === (b.depth ?? 60)
    && (a.border ?? '') === (b.border ?? '')
}

export function saveTheme(theme: Theme) {
  try { localStorage.setItem(KEY, JSON.stringify(theme)) } catch { /* private mode */ }
  applyTheme(theme)
}

export function clearTheme() {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}
