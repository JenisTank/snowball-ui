/**
 * Snowball UI — theme engine + packaging checks.
 *
 * Run: npm run check   (tsx scripts/theme-check.ts)
 *
 * Unlike the app-era check, this does NOT mirror the derivation maths — it
 * imports the real deriveVars() / applyTheme() from src/lib/theme, so the
 * test can never drift from the code it guards. Two jobs:
 *
 *   1. The maths — every shipped theme derives a complete, readable token
 *      set; hostile custom themes (pure white, pure black, saturated hues)
 *      still resolve to something usable; very light pages still cast
 *      visible neomorphic shadows.
 *   2. The plumbing — no component hardcodes a colour, every shipped source
 *      file parses, the stylesheet is token-driven, and the Tailwind preset
 *      resolves utilities to variables.
 *
 * Consuming apps can point the same hex-scan at their own source:
 *   npx tsx node_modules/@snowball/ui/scripts/theme-check.ts --scan <dir>
 * (the math checks always run against the installed engine).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import {
  THEMES, DEFAULT_THEME, deriveVars, applyTheme,
  isLight, luminance, contrast, hexToRgb, type Theme,
} from '../src/lib/theme'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

let pass = 0, fail = 0
const failures: string[] = []
function ok(name: string, cond: boolean, detail = '') {
  if (cond) { pass++; console.log(`  \x1b[32m✓\x1b[0m ${name}`) }
  else { fail++; failures.push(name); console.log(`  \x1b[31m✗\x1b[0m ${name} ${detail}`) }
}

/* ── helpers over the REAL derived vars ─────────────────────────────────── */

const EXPECTED_VARS = [
  '--bg', '--bg2', '--sunken', '--row', '--row-hover',
  '--neu-bg', '--neu-light', '--neu-dark', '--neu-dark-sm', '--neu-border',
  '--accent', '--accent2', '--txt', '--txt2', '--txt3',
  '--shadow-dark', '--shadow-dark-soft', '--shadow-light', '--shadow-light-soft',
  '--shadow-inset-dark', '--shadow-inset-light', '--sheen', '--sheen-line',
  '--ok', '--warn', '--danger', '--info', '--violet',
]

/** Parse an `rgba(r,g,b,a)` token back to numbers. */
function parseRgba(v: string): [number, number, number, number] | null {
  const m = v.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/)
  if (!m) return null
  return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])]
}

/** Composite a translucent rgba() over an opaque hex, the way CSS would. */
function over(fg: string, bgHex: string): string {
  const rgba = parseRgba(fg)
  if (!rgba) throw new Error(`not an rgba token: ${fg}`)
  const [r, g, b, a] = rgba
  const [br, bg, bb] = hexToRgb(bgHex)
  const mix = (f: number, base: number) => Math.round(f * a + base * (1 - a))
  return `#${[mix(r, br), mix(g, bg), mix(b, bb)].map(v => v.toString(16).padStart(2, '0')).join('')}`
}

/* ── 1. the maths ───────────────────────────────────────────────────────── */

console.log('\n\x1b[1mShipped themes derive a complete, readable token set\x1b[0m')
for (const t of THEMES) {
  const v = deriveVars(t)
  const missing = EXPECTED_VARS.filter(k => !(k in v))
  ok(`${t.name}: deriveVars emits all ${EXPECTED_VARS.length} tokens`,
    missing.length === 0, `missing: ${missing.join(', ')}`)
  ok(`${t.name}: main text clears WCAG AA (4.5:1) on the card surface`,
    contrast(v['--txt'], v['--bg2']) >= 4.5, `(${contrast(v['--txt'], v['--bg2']).toFixed(2)})`)
  ok(`${t.name}: secondary text clears AA`,
    contrast(v['--txt2'], v['--bg2']) >= 4.5, `(${contrast(v['--txt2'], v['--bg2']).toFixed(2)})`)
  ok(`${t.name}: muted text clears the 3:1 floor`,
    contrast(v['--txt3'], v['--bg2']) >= 3, `(${contrast(v['--txt3'], v['--bg2']).toFixed(2)})`)
  ok(`${t.name}: accent is visible on the surface`,
    contrast(v['--accent'], v['--bg2']) >= 3, `(${contrast(v['--accent'], v['--bg2']).toFixed(2)})`)
  ok(`${t.name}: card surface separates from the page`,
    v['--bg2'] !== t.bg && Math.abs(luminance(v['--bg2']) - luminance(t.bg)) > 0.008)
  ok(`${t.name}: sunken well is darker than the surface`,
    luminance(v['--sunken']) < luminance(v['--bg2']))
}

console.log('\n\x1b[1mLight and dark are detected correctly\x1b[0m')
ok('near-black is dark', isLight('#0F1219') === false)
ok('off-white is light', isLight('#eef1f6') === true)
ok('pure white is light', isLight('#ffffff') === true)
ok('pure black is dark', isLight('#000000') === false)
// Luma weighting matters: a plain RGB average calls saturated blue mid-bright
// and would pick black text for it.
ok('saturated blue is treated as dark', isLight('#0000ff') === false)
ok('saturated yellow is treated as light', isLight('#ffff00') === true)
ok('mid grey sits on the dark side of the line', isLight('#777777') === false)

console.log('\n\x1b[1mHostile custom themes still resolve\x1b[0m')
const hostile: Theme[] = [
  { id: 'x', name: 'pure white', bg: '#ffffff', accent: '#2563eb', txt: '#111827', txt2: '#4b5563' },
  { id: 'x', name: 'pure black', bg: '#000000', accent: '#38bdf8', txt: '#f8fafc', txt2: '#cbd5e1' },
  { id: 'x', name: 'deep navy', bg: '#0b1a3a', accent: '#f59e0b', txt: '#f1f5f9', txt2: '#c7d2e8' },
  { id: 'x', name: 'warm cream', bg: '#faf5eb', accent: '#b45309', txt: '#1c1917', txt2: '#57534e' },
]
for (const t of hostile) {
  const v = deriveVars(t)
  ok(`${t.name}: surface is distinct from the background`, v['--bg2'] !== t.bg)
  ok(`${t.name}: muted text stays above 3:1`,
    contrast(v['--txt3'], v['--bg2']) >= 3, `(${contrast(v['--txt3'], v['--bg2']).toFixed(2)})`)
  ok(`${t.name}: derived colours are valid hex`,
    /^#[0-9a-f]{6}$/i.test(v['--bg2'])
    && /^#[0-9a-f]{6}$/i.test(v['--txt3'])
    && /^#[0-9a-f]{6}$/i.test(v['--sunken'])
    && /^#[0-9a-f]{6}$/i.test(v['--row']))
}

console.log('\n\x1b[1mVery light pages still cast visible shadows (Weber >= 0.13)\x1b[0m')
// Uses the REAL --neu-dark token: composite it over the page and measure the
// perceived drop. A flat shadow (the SnowLight Cool bug) fails this.
const lightShadowCases: Theme[] = [
  THEMES.find(t => t.id === 'snowball-light')!,
  THEMES.find(t => t.id === 'snowball-light-cool')!,
  { id: 'x', name: 'pure white custom', bg: '#ffffff', accent: '#2563eb', txt: '#111827', txt2: '#4b5563', depth: 55 },
]
for (const t of lightShadowCases) {
  const v = deriveVars(t)
  const rendered = over(v['--neu-dark'], t.bg)
  const weber = (luminance(t.bg) - luminance(rendered)) / luminance(t.bg)
  ok(`${t.name}: derived dark half reads against the page`,
    weber >= 0.13, `(Weber ${weber.toFixed(3)})`)
}

console.log('\n\x1b[1mapplyTheme writes the tokens and flips data-theme\x1b[0m')
// Minimal DOM stub — applyTheme only touches document.documentElement.
const written: Record<string, string> = {}
let dataTheme: string | null = null
const documentElementStub = {
  style: {
    setProperty: (k: string, val: string) => { written[k] = val },
    colorScheme: '',
  },
  setAttribute: (k: string, v: string) => { if (k === 'data-theme') dataTheme = v },
}
;(globalThis as Record<string, unknown>).document = { documentElement: documentElementStub }

const lightTheme = THEMES.find(t => t.id === 'snowball-light')!
applyTheme(lightTheme)
ok('light theme sets data-theme="light"', dataTheme === 'light', `(got ${dataTheme})`)
ok('light theme sets color-scheme: light', documentElementStub.style.colorScheme === 'light')
ok(`all ${EXPECTED_VARS.length} tokens written to <html>`,
  EXPECTED_VARS.every(k => k in written), `(${Object.keys(written).length} vars)`)
ok('written tokens match deriveVars', written['--bg2'] === deriveVars(lightTheme)['--bg2'])
applyTheme(DEFAULT_THEME)
ok('dark theme sets data-theme="dark"', dataTheme === 'dark', `(got ${dataTheme})`)
ok('dark theme sets color-scheme: dark', documentElementStub.style.colorScheme === 'dark')

/* ── 2. the plumbing ────────────────────────────────────────────────────── */

console.log('\n\x1b[1mComponents do not hardcode colours\x1b[0m')
const walk = (dir: string): string[] => readdirSync(dir).flatMap(f => {
  const p = join(dir, f)
  return statSync(p).isDirectory() ? walk(p) : [p]
})
// theme.ts owns the palettes by definition; FloatingTheme holds the picker's
// default swatch values. Everything else must use tokens.
const OWNERS = ['lib/theme.ts', 'FloatingTheme.tsx']
const offenders: string[] = []
for (const f of walk(join(ROOT, 'src')).filter(f => f.endsWith('.tsx'))) {
  if (OWNERS.some(o => f.endsWith(o))) continue
  const hits = (readFileSync(f, 'utf8').match(/#[0-9a-fA-F]{6}\b/g) ?? [])
  if (hits.length) offenders.push(`${f.slice(ROOT.length + 1)} (${hits.length})`)
}
ok('no component carries a raw hex colour',
  offenders.length === 0, `\n      ${offenders.join('\n      ')}`)

console.log('\n\x1b[1mEvery shipped source file parses\x1b[0m')
// Guards against the classic "glob inside a block comment" bug: a content
// glob contains a star-slash sequence that closes the comment early, and the
// remainder parses as code. Tailwind loads the preset through jiti/sucrase,
// so one broken comment takes down the consumer's whole CSS build.
const parseTargets = [
  ...walk(join(ROOT, 'src')).filter(f => /\.(ts|tsx|js)$/.test(f)),
  join(ROOT, 'scripts/theme-check.ts'),
]
for (const f of parseTargets) {
  const source = readFileSync(f, 'utf8')
  const kind = f.endsWith('.tsx') ? ts.ScriptKind.TSX
    : f.endsWith('.ts') ? ts.ScriptKind.TS
    : ts.ScriptKind.JS
  const sf = ts.createSourceFile(f, source, ts.ScriptTarget.Latest, true, kind)
  const errors = sf.parseDiagnostics
  const rel = f.slice(ROOT.length + 1)
  if (errors.length) {
    const first = errors[0]
    const pos = sf.getLineAndCharacterOfPosition(first.start ?? 0)
    ok(`${rel} parses cleanly`, false,
      `(line ${pos.line + 1}:${pos.character + 1} ${ts.flattenDiagnosticMessageText(first.messageText, ' ')})`)
  } else {
    ok(`${rel} parses cleanly`, true)
  }
}

const css = readFileSync(join(ROOT, 'src/styles/tokens.css'), 'utf8')
console.log('\n\x1b[1mThe stylesheet is driven by tokens\x1b[0m')
ok('the dark theme defines the token set', css.includes(':root {') && css.includes('--shadow-dark'))
ok('a light theme block exists', css.includes("[data-theme='light']"))
ok('shadows reference tokens, not literals', css.includes('var(--shadow-dark)'))
ok('the sheen is tokenised', css.includes('var(--sheen)'))
ok('status pills are re-tuned for light mode',
  /:root\[data-theme='light'\] \.st-pending \{ color:#[0-9a-f]{6}/i.test(css))
ok('kit classes live in @layer components', css.includes('@layer components'))
ok('carries only @tailwind components (base/utilities stay in the app)',
  /^\s*@tailwind components;\s*$/m.test(css)
  && !/^\s*@tailwind (base|utilities);/m.test(css))

const preset = readFileSync(join(ROOT, 'src/tailwind/preset.js'), 'utf8')
console.log('\n\x1b[1mTailwind utilities follow the theme\x1b[0m')
ok('colour utilities resolve to variables', preset.includes("'neu-surface': 'var(--bg2)'"))
ok('text utilities resolve to variables', preset.includes("'txt': 'var(--txt)'"))
ok('shadow utilities resolve to variables', preset.includes('var(--shadow-dark)'))
ok('no hex survives in the tailwind palette', !/#[0-9a-fA-F]{6}\b/.test(preset))

/* ── optional: point the hex-scan at a consuming app ────────────────────── */

const scanIdx = process.argv.indexOf('--scan')
if (scanIdx !== -1 && process.argv[scanIdx + 1]) {
  const target = process.argv[scanIdx + 1]
  console.log(`\n\x1b[1mScanning ${target} for hardcoded colours\x1b[0m`)
  const appOffenders: string[] = []
  for (const f of walk(target).filter(f => f.endsWith('.tsx'))) {
    const hits = (readFileSync(f, 'utf8').match(/#[0-9a-fA-F]{6}\b/g) ?? [])
    if (hits.length) appOffenders.push(`${f} (${hits.length})`)
  }
  ok('no component carries a raw hex colour',
    appOffenders.length === 0, `\n      ${appOffenders.slice(0, 8).join('\n      ')}`)
}

/* ── verdict ────────────────────────────────────────────────────────────── */

console.log(`\n\x1b[1m${pass} passed, ${fail} failed\x1b[0m`)
if (fail > 0) {
  console.error('\x1b[31m❌ failed:\x1b[0m ' + failures.join(', '))
  process.exit(1)
}
console.log('\x1b[32m✅ all checks passed\x1b[0m')
