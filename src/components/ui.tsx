import * as React from 'react'
import { Component, useEffect, useId, useState, type ErrorInfo, type ReactNode } from 'react'
/** Two-letter avatar initials (inlined from the app's lib/data so the kit is self-contained). */
export const initials = (n: string) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

/* ---------- Error helpers (UI-56) ---------- */
/**
 * Pull the best human-readable message out of any error shape.
 *
 * Site code was spread across `e?.message || 'fallback'`, which printed
 * literally `[object Object]` for Fetch / Axios failures and `{}` for
 * our own typed errors. This walks the common response shapes so the
 * toast can show "Server: 422 — GSTIN is required" instead of a blank
 * line. Always logs the original object so a developer can still see
 * the stack / status / network trace in DevTools.
 *
 * Pass an optional default (the user-friendly fallback you would have
 * written anyway).
 */
export function formatError(e: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!e) return fallback
  if (typeof e === 'string') return e || fallback
  // Plain Error
  if (e instanceof Error && e.message) return e.message
  // Axios / Fetch response-shaped: { message, error }
  if (typeof e === 'object') {
    const anyE = e as { message?: unknown; error?: unknown; status?: unknown; statusText?: unknown; errors?: unknown }
    if (typeof anyE.message === 'string' && anyE.message) return anyE.message
    if (typeof anyE.error === 'string' && anyE.error) return anyE.error
    if (typeof anyE.status === 'number' && typeof anyE.statusText === 'string') {
      return `Server returned ${anyE.status} ${anyE.statusText}.`
    }
    // { errors: [{ message }, …] } — express-validator style
    if (Array.isArray(anyE.errors)) {
      const firstMsg = (anyE.errors[0] as { message?: string })?.message
      if (firstMsg) return firstMsg
    }
  }
  return fallback
}

/**
 * One-stop place to surface an error: log it with the right severity so
 * devs see the stack, and return the user-friendly text for the toast.
 * UI-56: pages used to either silently swallow the error or push
 * `[object Object]` to the toast. `reportError` always both, with a
 * single call.
 */
export function reportError(e: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const message = formatError(e, fallback)
  // Surface a tag so production observability can group by it. Keep the
  // original object intact in console.
  if (typeof console !== 'undefined') {
    console.error('[erp]', message, e)
  }
  return message
}

/* ---------- icons ---------- */
const PATHS: Record<string, ReactNode> = {
  lock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></>,
  reply: <><path d="M9 14 4 9l5-5" /><path d="M4 9h7a9 9 0 0 1 9 9v2" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
  columns: <><rect x="4" y="4" width="6" height="16" rx="1" /><rect x="14" y="4" width="6" height="16" rx="1" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  layers: <><path d="M12 2 3 7l9 5 9-5-9-5z" /><path d="M3 12l9 5 9-5" /><path d="M3 17l9 5 9-5" /></>,
  briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></>,
  check: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="m16 11 2 2 4-4" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /></>,
  fileText: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></>,
  chart: <><path d="M3 3v18h18" /><rect x="7" y="10" width="3" height="8" /><rect x="12" y="6" width="3" height="12" /><rect x="17" y="13" width="3" height="5" /></>,
  gear: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></>,
  filter: <><path d="M3 4h18l-7 8v6l-4 2v-8z" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></>,
  kanban: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /><path d="M15 3v18" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  export: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
  dots: <><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>,
  receipt: <><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" /><path d="M16 8H8" /><path d="M16 12H8" /><path d="M10 16H8" /></>,
  percent: <><line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>,
  shield2: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>,
  bank: <><path d="m3 9 9-6 9 6" /><path d="M3 9h18" /><path d="M4 9v8h16V9" /><path d="M4 17v4h16v-4" /><path d="M3 21h18" /><path d="M12 17v2" /></>,
  inbox: <><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>,
  whatsapp: <><path d="M3.2 20.8l1.25-4.55a8.5 8.5 0 1 1 3.3 3.24L3.2 20.8z" /><path d="M8.8 8.1c.2-.45.4-.46.6-.47h.5c.16 0 .4-.06.6.47l.66 1.6c.06.14.1.3 0 .47l-.3.45-.24.26c-.1.1-.2.22-.09.42.12.2.53.87 1.13 1.4.78.7 1.43.92 1.63 1.02.2.1.32.09.44-.05l.63-.73c.14-.17.28-.14.47-.07l1.5.7c.2.1.34.14.39.22.05.08.05.47-.13.92-.18.45-1.05.88-1.42.91-.37.03-.72.17-2.42-.5-2.05-.81-3.33-2.9-3.43-3.04-.1-.14-.82-1.08-.82-2.06 0-.98.52-1.46.7-1.66z" /><path d="M3.2 20.8l1.25-4.55a8.5 8.5 0 1 1 3.3 3.24L3.2 20.8z" /></>,
  chat: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>,
  help: <><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></>,
  send: <><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4z" /></>,
  phone: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></>,
  pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>,
  checkCircle: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></>,
  x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  rupee: <><path d="M6 3h12" /><path d="M6 8h12" /><path d="m6 13 8.5 8" /><path d="M6 13h3" /><path d="M9 13c6.667 0 6.667-10 0-10" /></>,
  ticket: <><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" /><path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" /></>,
  play: <><polygon points="6 3 20 12 6 21 6 3" /></>,
  chevL: <><path d="m15 18-6-6 6-6" /></>,
  chevR: <><path d="m9 18 6-6-6-6" /></>,
  trash: <><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M10 11v6" /><path d="M14 11v6" /></>,
  edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></>,
  alert: <><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /></>,
  sync: <><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" /></>,
  refresh: <><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" /></>,
  repeat: <><path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></>,
  slash: <><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></>,
  checkSquare: <><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
  folder: <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></>,
  info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
  drag: <><circle cx="9" cy="5" r="1.5" /><circle cx="9" cy="12" r="1.5" /><circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="5" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="15" cy="19" r="1.5" /></>,
  external: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></>,
  'chevron-down': <><path d="m6 9 6 6 6-6" /></>,
  chevD: <><path d="m6 9 6 6 6-6" /></>,
  chevronDown: <><path d="m6 9 6 6 6-6" /></>,
  'chevron-up': <><path d="m18 15-6-6-6 6" /></>,
  chevU: <><path d="m18 15-6-6-6 6" /></>,
  chevronUp: <><path d="m18 15-6-6-6 6" /></>,
  'chevron-left': <><path d="m15 18-6-6 6-6" /></>,
  'chevron-right': <><path d="m9 18 6-6-6-6" /></>,
  'arrow-left': <><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></>,
  arrowLeft: <><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></>,
  'arrow-right': <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>,
  arrowRight: <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>,
  tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></>,
  xCircle: <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>,
  paperclip: <><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></>,
  attachment: <><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></>,
  messageSquare: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>,
  messageCircle: <><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></>,
}

export function Icon({ name, size = 16, className = '' }: { name: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {PATHS[name] ?? null}
    </svg>
  )
}

/* ---------- avatar ---------- */
export function Avatar({ name, size = 38, idx = 0 }: { name: string; size?: number; idx?: number }) {
  // Long names used to overflow the fixed square and clip mid-letter. Two
  // defences: (1) the label uses truncate + max-w so it never paints past
  // the box, and (2) the box itself is flex so the centred initials can
  // shrink to fit. The full name is kept in `title` for hover tooltips so
  // the truncation isn't data-loss.
  const label = initials(name)
  return (
    <span
      /* UI-51: avatars used to pop in instantly when a row mounted, which
         read as a layout jump. A short opacity + scale fade makes them
         appear alongside the rest of the row rather than before it. The
         idx prop carries the column position so each avatar in a list
         starts at a slightly different time, giving the table a more
         "natural" staggered reveal without any JS work. */
      className="grid shrink-0 place-items-center overflow-hidden rounded-xl bg-neu-sunken shadow-neu-inset border border-white/[0.03] text-cyan-400 font-bold text-xs transition-all duration-200 ease-out motion-safe:animate-[avatar-pop_220ms_ease-out_both]"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        lineHeight: 1,
        animationDelay: `${Math.min(idx * 25, 250)}ms`,
      }}
      title={name}
      aria-label={name}
    >
      <span className="block max-w-full truncate px-1">{label}</span>
    </span>
  )
}

/* ---------- status pill ---------- */
const STATUS_LABEL: Record<string, string> = {
  vip: 'VIP', active: 'Active', pending: 'Pending', inactive: 'Inactive',
  open: 'Open', inprogress: 'In Progress', submitted: 'Submitted',
  approved: 'Approved', rejected: 'Request Changes', completed: 'Completed', cancelled: 'Cancelled',
  draft: 'Draft', sent: 'Sent', partial: 'Partial', paid: 'Paid', overdue: 'Overdue',
  responded: 'Responded', closed: 'Closed',
}
export function StatusPill({ status }: { status: string }) {
  return (
    /* UI-52: status pills now fade in on mount so they don't pop alongside
       the rest of the row. The transition is short (150 ms) so it never
       delays a user who is skimming — it only smooths the very first
       paint of a row that just loaded. */
    <span className={`pill st-${status} motion-safe:animate-[pill-fade_150ms_ease-out_both] transition-colors duration-150`}>
      <span className="dot" />{STATUS_LABEL[status] ?? status}
    </span>
  )
}

/* ---------- toast ---------- */
export function useToast() {
  const [msg, setMsg] = useState<{ text: string; kind: 'ok' | 'err' } | null>(null)
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), msg.kind === 'err' ? 6000 : 2600)
    return () => clearTimeout(t)
  }, [msg])
  const toast = (m: string, kind: 'ok' | 'err' = 'ok') => setMsg({ text: m, kind })
  const el = msg ? (
    /* UI-18: aria-live + role make screen readers announce the toast the
       moment it lands. Success toasts use 'polite' so they don't interrupt
       the user mid-task; errors use 'assertive' because the user must know
       something failed. focusable=true lets a SR "find" the live region
       even if it's not the document's current focus. */
    <div
      className={`toast show rise ${msg.kind === 'err' ? 'toast-err' : 'toast-ok'}`}
      role={msg.kind === 'err' ? 'alert' : 'status'}
      aria-live={msg.kind === 'err' ? 'assertive' : 'polite'}
      aria-atomic="true"
      tabIndex={-1}
    >
      <span className={msg.kind === 'err' ? 'text-[color:var(--danger)]' : 'text-[color:var(--ok)]'} aria-hidden="true">
        <Icon name={msg.kind === 'err' ? 'alert' : 'checkCircle'} size={18} />
      </span>
      <span className="font-semibold text-[color:var(--txt)]">{msg.text}</span>
    </div>
  ) : null
  return { toast, el }
}

/* ---------- KPI sparkline ---------- */
export function Spark({ d }: { d: string }) {
  return (
    <svg className="spark absolute bottom-3.5 right-3.5" width="86" height="34" viewBox="0 0 86 34">
      <path d={d} />
    </svg>
  )
}

/* ---------- Empty state (UI-54) ---------- */
/**
 * Illustrated empty state for data lists (clients / tasks / invoices).
 *
 * Lists previously fell through to "No rows match your search." with no
 * icon and no recovery path — the user sees blank space and has to
 * figure out why. This component paints the missing CTA in the centre:
 * a soft icon badge, a one-line headline, optional supporting copy, and
 * either an inline primary action ("Add your first client") or a
 * secondary suggestion. `noun` keeps the headline grammatical when the
 * caller passes a plural ("clients" → "No clients yet").
 *
 * Lives here rather than in DataTable so pages that don't use the
 * table component can still reach for it.
 */
export function EmptyState({
  icon = 'inbox',
  headline,
  description,
  primaryAction,
  secondaryAction,
  noun,
}: {
  icon?: keyof typeof PATHS | string
  headline: string
  description?: ReactNode
  primaryAction?: ReactNode
  secondaryAction?: ReactNode
  /** Optional plural noun shown in the headline ("No clients yet"). */
  noun?: string
}) {
  return (
    <div className="grid place-items-center py-12 px-4 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[color:var(--accent)]/10 text-[color:var(--accent2)] border border-[color:var(--accent)]/20 mb-3">
        <Icon name={icon as string} size={26} aria-hidden="true" />
      </div>
      <div className="text-[14.5px] font-bold text-[color:var(--txt)]">
        {noun ? `No ${noun} yet` : headline}
      </div>
      {description && (
        <p className="mt-1.5 max-w-sm text-[12px] text-[color:var(--txt3)] leading-relaxed">
          {description}
        </p>
      )}
      {(primaryAction || secondaryAction) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {primaryAction}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}

/* ---------- page heading ---------- */
export function PageHead({ title, badge, actions }: { title: string; sub?: string; badge?: string; actions?: ReactNode }) {
  return (
    /* `flex-wrap` is on the outer so the badge drops to its own line on
       narrow screens instead of overflowing the flex container. */
    <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2.5 min-w-0">
        <h1 className="h2 min-w-0">
          {title}
        </h1>
        {badge && (
          <span className="neo shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-[color:var(--accent2)]">
            {badge}
          </span>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/* ---------- Modal dialog & Escape Key Handler ---------- */
export function useEscapeKey(handler: () => void, active = true) {
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handler()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handler, active])
}

/* ---------- Progress overlay (UI-37) ---------- */
/**
 * Indeterminate progress overlay for long-running ops (invoice generation,
 * GST filing, client import). The previous UX showed a per-button
 * "Generating…" label but no global indicator, so users couldn't tell
 * whether the page had frozen or the task was still working — especially
 * for jobs that took longer than a second.
 *
 * Caller passes `label` and (optionally) a `progress` 0–100 number for
 * determinate work; a Cancel button calls `onCancel` if the job is
 * cancelable. Renders nothing when `active` is false so it's safe to
 * leave mounted.
 */
export function ProgressOverlay({
  active,
  label,
  /* 0..1 — when provided the bar renders determinate; otherwise indeterminate. */
  progress,
  onCancel,
  cancelLabel = 'Cancel',
}: {
  active: boolean
  label: string
  /** Optional 0..1 determinate progress. */
  progress?: number
  onCancel?: () => void
  cancelLabel?: string
}) {
  if (!active) return null
  const pct = typeof progress === 'number'
    ? Math.max(0, Math.min(1, progress))
    : null
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed inset-x-0 bottom-4 z-[78] mx-auto w-[min(420px,calc(100vw-2rem))] rounded-2xl bg-[color:var(--bg)] border border-neu-border shadow-2xl p-3.5 flex items-center gap-3 rise"
      style={{ boxShadow: '0 12px 32px rgba(0,0,0,.45), 0 0 0 1px var(--accent)' }}
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[color:var(--accent2)] bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/30">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-bold text-[color:var(--txt)]">{label}</div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--sunken)]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct !== null ? Math.round(pct * 100) : undefined}>
          {pct !== null ? (
            <div className="h-full rounded-full bg-[color:var(--accent)] transition-[width] duration-200" style={{ width: `${pct * 100}%` }} />
          ) : (
            <div className="h-full w-1/3 animate-[indeterminate_1.4s_ease-in-out_infinite] rounded-full bg-[color:var(--accent)]" />
          )}
        </div>
      </div>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 rounded-lg px-2.5 py-1 text-[11.5px] font-semibold text-[color:var(--txt2)] hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/60"
        >
          {cancelLabel}
        </button>
      )}
    </div>
  )
}

/* ---------- AsyncButton (UI-29) ---------- */
/**
 * Submit / save button that bakes in the disabled + aria-busy pattern. Pages
 * previously inlined `disabled={busy}` and toggled the label between
 * "Save" and "Saving…", but no SR feedback made it past that — the form
 * looked identical to the eye for a moment, and a screen reader user got
 * no indication the action had started. AsyncButton sets aria-busy on the
 * button so AT can announce "Saving…" when the request is in flight, and
 * keeps the visual label in sync so sighted users get the same hint.
 *
 * Drop the spinner inline; the button is intentionally tiny so it sits in
 * the same row as a Cancel control.
 */
export function AsyncButton({
  loading,
  loadingLabel,
  children,
  className = '',
  disabled,
  type = 'button',
  onClick,
  ...rest
}: {
  loading: boolean
  /** Label to show while in flight. Defaults to "Working…". */
  loadingLabel?: string
  children: ReactNode
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}) {
  const isDisabled = !!loading || !!disabled
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      className={`${className} disabled:opacity-60 disabled:cursor-not-allowed`}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="mr-1.5 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {loading ? (loadingLabel ?? 'Working…') : children}
    </button>
  )
}

/* ---------- Skeleton (UI-31) ---------- */
/**
 * Pulsing placeholder block. Pages previously showed either nothing or a
 * spinner during a refetch, which left the table area empty long enough to
 * look broken. Skeletons preserve the page layout while data is on the
 * wire, so the eye expects the rows that are about to land.
 */
export function Skeleton({
  className = '',
  /** Pixel-height override. Default is the height of one body row. */
  height = 24,
  /** Rounded corner scale; 'md' matches table cells. */
  radius = 'md',
}: {
  className?: string
  height?: number
  radius?: 'sm' | 'md' | 'lg' | 'full'
}) {
  const r = radius === 'sm' ? '0.5rem' : radius === 'md' ? '0.75rem' : radius === 'lg' ? '1rem' : '9999px'
  return (
    <span
      aria-hidden="true"
      className={`inline-block ${className}`}
      style={{
        height,
        width: '100%',
        borderRadius: r,
        background: 'linear-gradient(90deg, var(--sunken) 0%, var(--row) 50%, var(--sunken) 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.4s ease-in-out infinite',
      }}
    />
  )
}

/** Pre-built table-row skeleton: an avatar circle + two text lines. */
export function SkeletonRow() {
  return (
    <div role="presentation" className="flex items-center gap-3 px-3 py-2">
      <Skeleton height={28} radius="full" className="!w-7 !shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton height={11} className="!w-1/3" />
        <Skeleton height={9} className="!w-2/3" />
      </div>
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  useEscapeKey(onClose, open);
  /* UI-13: unique id per title so aria-labelledby points at the heading.
     role="dialog" + aria-modal="true" tell AT to dim everything else; the
     H3 itself is the accessible name via aria-labelledby. */
  const titleId = useId()
  if (!open) return null;
  /* UI-24: caller passes a single Tailwind class for the largest viewport
     (e.g. "max-w-lg"). Smaller viewports step the width down so the dialog
     does not overflow a 375px iPhone. */
  const responsiveMaxWidth = `${maxWidth} max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-3rem)]`
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-2 backdrop-blur-sm animate-fade-in sm:p-4" onClick={onClose}>
      <div
        className={`neo-lg rise flex max-h-[90vh] w-full ${responsiveMaxWidth} flex-col rounded-2xl bg-[color:var(--bg)] shadow-2xl border border-neu-border overflow-hidden`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex items-center justify-between border-b border-neu-border/60 px-6 py-4 bg-neu-surface/50">
          <h3 id={titleId} className="text-[15.5px] font-bold text-[color:var(--txt)]">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            title="Close (Esc)"
            className="p-1 rounded-lg text-[color:var(--txt3)] hover:text-[color:var(--txt)] hover:bg-white/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/60"
          >
            <Icon name="x" size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto p-6 bg-neu-surface">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Error Boundary ---------- */
export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode; onReset?: () => void },
  { hasError: boolean; error: Error | null }
> {
  public state = { hasError: false, error: null as Error | null }

  public static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  public reset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="p-8 text-center space-y-4 max-w-lg mx-auto neo rounded-2xl my-8">
          <div className="text-3xl">⚠️</div>
          <h2 className="text-base font-bold text-rose-400">Something went wrong in this section</h2>
          <p className="text-xs text-[color:var(--txt3)] font-mono bg-black/20 p-3 rounded-lg break-words">
            {this.state.error?.message || 'An unexpected rendering error occurred'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button type="button" className="neo-btn" onClick={this.reset}>
              Retry
            </button>
            {this.props.onReset && (
              <button type="button" className="neo-btn neo-btn-primary" onClick={this.props.onReset}>
                ← Return to List
              </button>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

