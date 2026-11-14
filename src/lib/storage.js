import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? initial : JSON.parse(raw)
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  }, [key, value])

  // Listen for local changes from other components in the same tab
  useEffect(() => {
    const handler = (e) => {
      if (e.detail && e.detail.key === key) {
        setValue(e.detail.value)
      }
    }
    window.addEventListener('local-storage', handler)
    return () => window.removeEventListener('local-storage', handler)
  }, [key])

  const setSyncedValue = useCallback((newValue) => {
    setValue((prev) => {
      const next = typeof newValue === 'function' ? newValue(prev) : newValue
      window.dispatchEvent(new CustomEvent('local-storage', { detail: { key, value: next } }))
      return next
    })
  }, [key])

  return [value, setSyncedValue]
}

const READ_PREFIX = 'llb1.read.'
export function getProgress(id) {
  try { const raw = localStorage.getItem(READ_PREFIX + id); return raw ? JSON.parse(raw) : null } catch { return null }
}
export function saveProgress(id, obj) {
  try { localStorage.setItem(READ_PREFIX + id, JSON.stringify(obj)) } catch {}
}
export function clearProgress(id) {
  try { localStorage.removeItem(READ_PREFIX + id) } catch {}
}
export function getLastRead() {
  let best = null
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k || k.indexOf(READ_PREFIX) !== 0) continue
      try {
        const p = JSON.parse(localStorage.getItem(k))
        if (p && p.updated && (!best || p.updated > best.updated)) {
          best = { id: k.slice(READ_PREFIX.length), pct: p.pct || 0, complete: !!p.complete, updated: p.updated }
        }
      } catch {}
    }
  } catch {}
  if (!best || best.complete) return null
  return best
}

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function todayISO() { return new Date().toISOString().slice(0, 10) }
export function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10) }
export function daysFromNow(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
export function fmtDate(iso) { const d = new Date(iso + 'T00:00:00'); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` }
export function daysBetween(iso) {
  const a = new Date(todayISO() + 'T00:00:00')
  const b = new Date(iso + 'T00:00:00')
  return Math.round((b - a) / 86400000)
}
export function relDate(iso) {
  const diff = daysBetween(iso)
  if (diff > 0) return fmtDate(iso)
  const past = -diff
  if (past === 0) return 'Today'
  if (past === 1) return 'Yesterday'
  if (past < 7) return `${past} days ago`
  if (past < 30) return `${Math.floor(past / 7)}w ago`
  const d = new Date(iso + 'T00:00:00')
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}
export function countdown(mins) {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60); const m = mins % 60
  return `${h}h${m ? ` ${m}m` : ''}`
}
export function toMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m }
export function useDocumentTitle(title) {
  useEffect(() => {
    const prev = document.title
    document.title = title ? `${title} · LLB 1 Hub` : 'LLB 1 Hub · UNIPORT'
    return () => { document.title = prev }
  }, [title])
}
