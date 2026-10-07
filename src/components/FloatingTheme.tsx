import { useState, useMemo, useEffect } from 'react'
import { THEMES, applyTheme, loadTheme, saveTheme, loadPersonalTheme, themesEqual, deriveVars, isLight, type Theme } from '../lib/theme'
import { loadPersisted, savePersisted } from '../lib/persist'
import { Icon } from './ui'

const FIRM_KEY = 'firm-theme-v1'

export default function FloatingTheme() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Theme>(() => loadTheme())
  const [showFonts, setShowFonts] = useState(false)
  const pageLight = isLight(draft.bg)
  const cardLight = isLight(draft.bg2 || (pageLight ? '#FFFFFF' : '#161B26'))
  const light = pageLight // keep pageLight for surfaces/shadows; cardLight for fonts
  const vars = useMemo(() => deriveVars(draft), [draft])

  useEffect(() => { applyTheme(draft) }, [draft])

  // keep in sync if Settings changes theme elsewhere + Esc to close
  useEffect(() => {
    const onStorage = () => setDraft(loadTheme())
    window.addEventListener('storage', onStorage)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('keydown', onKey) }
  }, [])

  return (
    <>
      {/* Floating button above Help (? at bottom-5). Place at bottom-[76px] so not overlapping.
         Keyboard: this is a native <button>, so it lands in the tab order at the
         position the DOM places it — but a fixed-position control at the end of
         the tree only gets focus after every other focusable element on the page.
         The trapdoor fix is `tabIndex={0}` (already implicit on <button>) plus a
         visible focus ring so keyboard users can see where they are. We keep
         aria-label + title for screen-reader / hover parity. */}
      <button
        onClick={() => setOpen(v => !v)}
        /* UI-50: the floating gear was static — users had no signal that it
           was an actual control. We now lift / tint / spin it on hover and
           press it down on active so it reads as live + tappable. The
           spin-on-hover hints at "settings", which is what the gear icon
           is conventionally associated with. */
        className="fixed bottom-[76px] right-5 z-[69] grid h-12 w-12 place-items-center rounded-full neo-lg bg-neu-surface border border-neu-border text-[color:var(--accent)] shadow-lg transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[color:var(--accent)]/10 hover:text-[color:var(--accent2)] hover:shadow-[0_8px_18px_rgba(76,195,247,.35),0_0_0_4px_rgba(76,195,247,.12)] active:translate-y-0 active:scale-95 active:bg-[color:var(--accent)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)] motion-safe:hover:[&_svg]:rotate-45"
        title="Theme — live on any page"
        aria-label="Open theme drawer"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Icon name="gear" size={18} className="transition-transform duration-200" />
      </button>

      {/* Backdrop — transparent so live view stays sharp and the theme does not darken */}
      {open && <div className="fixed inset-0 z-[80] bg-transparent" onClick={() => setOpen(false)} />}

      {/* Right drawer */}
      <div className={`fixed top-0 right-0 z-[81] h-dvh w-[320px] max-w-[85vw] bg-[color:var(--bg)] border-l border-neu-border shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-neu-border">
          <h2 className="text-[14px] font-bold text-[color:var(--txt)] flex items-center gap-2">
            <span className="dot" style={{ background: draft.accent, boxShadow: `0 0 8px ${draft.accent}` }} /> Theme — live
          </h2>
          <button onClick={() => setOpen(false)} className="neo grid h-8 w-8 place-items-center rounded-lg text-[color:var(--txt3)]">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Presets */}
          <div>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[1.2px] text-[color:var(--txt2)]">Presets — SnowDark / SnowLight fixed + My theme</div>
            <div className="flex flex-wrap gap-2">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setDraft(t)}
                  className={`neo-chip !px-3 !py-1.5 text-[12px] ${draft.id === t.id ? 'neo-chip-on !border-[color:var(--accent)] !bg-[color:var(--accent)]/10 !text-[color:var(--accent)]' : ''}`}
                >
                  <span className="mr-1.5 inline-block h-3 w-3 rounded-full align-middle" style={{ background: t.bg, border: `1.5px solid ${t.accent}` }} />
                  {t.name}
                </button>
              ))}
              {(() => {
                const my = loadPersonalTheme();
                if (!my) {
                  return (
                    <span title="Save for me first — then My theme restores it" className="neo-chip !px-3 !py-1.5 text-[12px] border border-dashed border-[color:var(--neu-border)] opacity-50">
                      <span className="mr-1.5 inline-block h-3 w-3 rounded-full align-middle bg-[color:var(--bg)] border border-[color:var(--neu-border)]" />
                      My theme
                    </span>
                  );
                }
                const active = themesEqual(draft, my);
                return (
                  <button
                    onClick={() => setDraft(my)}
                    title="Restore your saved My theme — SnowDark/SnowLight only preview, My theme stays saved"
                    className={`neo-chip !px-3 !py-1.5 text-[12px] ${active ? 'neo-chip-on !border-[color:var(--accent)] !bg-[color:var(--accent)]/10 !text-[color:var(--accent)] font-bold' : 'border border-[color:var(--accent)]/40 bg-[color:var(--accent)]/5'}`}
                  >
                    <span className="mr-1.5 inline-block h-3 w-3 rounded-full align-middle" style={{ background: my.bg, border: `1.5px solid ${my.accent}` }} />
                    My theme
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Main surfaces — inline, no collapsed */}
          <div className="space-y-3 rounded-xl border border-[color:var(--neu-border)] bg-[color:var(--bg2)]/40 p-3">
            <div className="text-[11px] font-bold uppercase tracking-[1px] text-[color:var(--txt2)]">Surfaces — card / row / inset / depth</div>
            {[
              { key: 'bg', label: 'Main — page', val: draft.bg, light: '#C7C7C7', dark: '#0F1219' },
              { key: 'bg2', label: 'Card surface', val: draft.bg2 || (light ? '#FFFFFF' : '#161B26') },
              { key: 'sunken', label: 'Sunken / Inset', val: draft.sunken || (light ? '#CBD5E1' : '#0A0D14') },
              { key: 'row', label: 'Table row', val: (draft as any).row || (light ? '#FFFFFF' : '#141822') },
              { key: 'rowHover', label: 'Row hover', val: (draft as any).rowHover || (light ? '#f1f5f9' : '#1c2333') },
            ].map(f => (
              <label key={f.key} className="flex items-center gap-2.5">
                <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-white shadow-sm">
                  <input type="color" value={f.val} onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value, id: 'custom', name: 'Custom' } as any))} className="absolute -left-1 -top-1 h-12 w-12 cursor-pointer" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[12px] font-semibold text-[color:var(--txt)]">{f.label}</span>
                  <span className="block text-[10px] text-[color:var(--txt2)] truncate">{f.val.toUpperCase()}</span>
                </span>
                <input value={f.val.toUpperCase()} onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value, id: 'custom', name: 'Custom' } as any))} className="field !w-[86px] !py-1.5 font-mono text-[11px]" />
              </label>
            ))}
            <div className="rounded-xl bg-[color:var(--bg)] p-2.5 border border-[color:var(--neu-border)]">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-[color:var(--txt)]">Shadow depth</span>
                <span className="rounded-full bg-[color:var(--accent)]/10 px-2 py-0.5 text-[11px] font-bold text-[color:var(--accent)]">{draft.depth ?? (light ? 100 : 60)}%</span>
              </div>
              <input type="range" min={0} max={100} value={draft.depth ?? (light ? 100 : 60)} onChange={e => setDraft(d => ({ ...d, depth: parseInt(e.target.value, 10), id: 'custom', name: 'Custom' } as any))} className="mt-2 w-full accent-[color:var(--accent)]" />
            </div>
          </div>

          {/* Fonts — 4 main + 10 hybrid */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-[1.2px] text-[color:var(--txt2)]">Fonts</div>
            {[
              { key: 'txt', label: 'Main font', val: draft.txt },
              { key: 'txt2', label: 'Secondary', val: draft.txt2 },
              { key: 'accent', label: 'Accent', val: draft.accent },
            ].map(f => (
              <label key={f.key} className="flex items-center gap-2.5">
                <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-white shadow-sm">
                  <input type="color" value={f.val} onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value, id: 'custom', name: 'Custom' } as any))} className="absolute -left-1 -top-1 h-12 w-12 cursor-pointer" />
                </span>
                <span className="flex-1 text-[12px] font-semibold text-[color:var(--txt)]">{f.label}</span>
                <input value={f.val.toUpperCase()} onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value, id: 'custom', name: 'Custom' } as any))} className="field !w-[86px] !py-1.5 font-mono text-[11px]" />
              </label>
            ))}
            <button type="button" onClick={() => setShowFonts(v => !v)} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[1px] text-[color:var(--txt2)]">
              <span className={`inline-block transition-transform ${showFonts ? 'rotate-90' : ''}`}>▸</span> 10 fonts — muted/status
            </button>
            {showFonts && (
              <div className="space-y-2 rounded-xl border border-[color:var(--neu-border)] p-2">
                {[
                  { key: 'txt3', label: 'Muted', val: (draft as any).txt3 || (cardLight ? '#4b5563' : '#6f7d90') },
                  { key: 'accent2', label: 'Active', val: (draft as any).accent2 || (cardLight ? '#1e293b' : '#7fd7ff') },
                  { key: 'ok', label: 'Success', val: (draft as any).ok || (cardLight ? '#065f46' : '#4ade80') },
                  { key: 'warn', label: 'Warning', val: (draft as any).warn || (cardLight ? '#78350f' : '#fbbf24') },
                  { key: 'danger', label: 'Danger', val: (draft as any).danger || (cardLight ? '#7f1d1d' : '#fb7185') },
                  { key: 'info', label: 'Info', val: (draft as any).info || (cardLight ? '#0f766e' : '#7dd3fc') },
                  { key: 'violet', label: 'Violet', val: (draft as any).violet || (cardLight ? '#4c1d95' : '#a5b4fc') },
                ].map(f => (
                  <label key={f.key} className="flex items-center gap-2">
                    <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg border border-white">
                      <input type="color" value={f.val} onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value, id: 'custom', name: 'Custom' } as any))} className="absolute -left-1 -top-1 h-10 w-10 cursor-pointer" />
                    </span>
                    <span className="flex-1 text-[11px] font-semibold text-[color:var(--txt)]">{f.label}</span>
                    <input value={f.val.toUpperCase()} onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value, id: 'custom', name: 'Custom' } as any))} className="field !w-[86px] !py-1 font-mono text-[10px]" />
                  </label>
                ))}
              </div>
            )}
          </div>


        </div>

        <div className="border-t border-neu-border p-3 flex gap-2">
          <button onClick={() => { saveTheme(draft); setOpen(false) }} className="neo-btn neo-btn-primary flex-1 !py-2 text-[12px]">Save for me</button>
          <button onClick={() => { savePersisted(FIRM_KEY, draft); saveTheme(draft); setOpen(false) }} className="neo-btn flex-1 !py-2 text-[12px]">Firm default</button>
        </div>
      </div>
    </>
  )
}
