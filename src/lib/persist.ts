/**
 * Generic localStorage persistence helpers.
 *
 * Extracted from the app's lib/store.ts so the kit (FloatingTheme's
 * "Firm default" button, and anything else that needs it) is self-contained.
 * localStorage is wrapped in try/catch because private-mode browsers throw.
 */

/** Read a JSON value from localStorage, falling back to `seed` on miss/corruption. */
export function loadPersisted<T>(key: string, seed: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : seed
  } catch { return seed }
}

/** Write a JSON value to localStorage. Never throws. */
export function savePersisted<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
}
