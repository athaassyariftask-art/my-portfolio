'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, CornerDownLeft, Search } from 'lucide-react'
import { toggleTheme } from '@/components/ThemeToggle'

export type Command = {
  id: string
  label: string
  group: 'Go to' | 'Links' | 'Actions'
  /** Internal path ("/about", "/#projects"), external https:// address, or an action name. */
  href?: string
  action?: 'theme' | 'copy-email'
  hint?: string
  value?: string
}

/** Simple fuzzy match: every typed letter must appear in order. */
export function matches(query: string, text: string): boolean {
  const q = query.toLowerCase().replace(/\s+/g, '')
  const t = text.toLowerCase()
  let i = 0
  for (const ch of t) if (ch === q[i]) i++
  return i >= q.length
}

/**
 * Command palette: press Ctrl/⌘ + K (or "/") anywhere to jump to a section, open a link, copy the email or
 * flip the theme. Arrow keys move, Enter runs, Esc closes.
 */
export default function CommandPalette({ commands }: { commands: Command[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const [note, setNote] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const shown = useMemo(() => commands.filter((c) => !q || matches(q, c.label + ' ' + (c.hint ?? ''))), [commands, q])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const typing = /^(input|textarea|select)$/i.test((e.target as HTMLElement)?.tagName ?? '') || (e.target as HTMLElement)?.isContentEditable
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === '/' && !typing && !open) {
        e.preventDefault()
        setOpen(true)
      } else if (e.key === 'Escape') setOpen(false)
    }
    function onOpen() {
      setOpen(true)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-palette', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-palette', onOpen)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setQ('')
      setSel(0)
      setNote('')
      const t = window.setTimeout(() => inputRef.current?.focus(), 30)
      return () => window.clearTimeout(t)
    }
  }, [open])

  useEffect(() => setSel(0), [q])
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-sel="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [sel])

  async function run(c: Command) {
    if (c.action === 'theme') {
      toggleTheme()
      setOpen(false)
    } else if (c.action === 'copy-email' && c.value) {
      try {
        await navigator.clipboard.writeText(c.value)
        setNote(`Copied ${c.value}`)
        window.setTimeout(() => setOpen(false), 700)
      } catch {
        setNote(c.value)
      }
    } else if (c.href) {
      setOpen(false)
      if (/^https?:\/\//i.test(c.href) || c.href.startsWith('mailto:')) window.open(c.href, '_blank', 'noopener,noreferrer')
      else router.push(c.href)
    }
  }

  if (!open) return null

  let lastGroup = ''
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[14vh]" role="dialog" aria-modal="true" aria-label="Command palette">
      <button type="button" aria-label="Close" className="absolute inset-0 cursor-default bg-[rgba(8,14,28,0.55)] backdrop-blur-[2px]" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--paper)] shadow-[var(--shadow-md)]">
        <div className="flex items-center gap-3 border-b border-[color:var(--line)] px-4">
          <Search className="h-4 w-4 shrink-0 text-[color:var(--muted)]" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(shown.length - 1, s + 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)) }
              if (e.key === 'Enter' && shown[sel]) { e.preventDefault(); void run(shown[sel]) }
            }}
            placeholder="Type a command or search…"
            aria-label="Search commands"
            className="h-12 w-full bg-transparent font-mono text-sm outline-none placeholder:text-[color:var(--muted)]"
          />
          <kbd className="rounded border border-[color:var(--line)] px-1.5 py-0.5 font-mono text-[10px] text-[color:var(--muted)]">Esc</kbd>
        </div>

        <ul ref={listRef} className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
          {shown.length === 0 && <li className="px-3 py-6 text-center text-sm text-[color:var(--muted)]">Nothing matches “{q}”.</li>}
          {shown.map((c, i) => {
            const header = c.group !== lastGroup ? c.group : ''
            lastGroup = c.group
            const on = i === sel
            return (
              <li key={c.id} role="presentation">
                {header && <p className="pop-label px-3 pb-1 pt-3">{header}</p>}
                <button
                  type="button"
                  role="option"
                  aria-selected={on}
                  data-sel={on}
                  onMouseMove={() => setSel(i)}
                  onClick={() => void run(c)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${on ? 'bg-[color:var(--cream)] text-[color:var(--ink)]' : 'text-[color:var(--ink)]'}`}
                >
                  <span className="font-medium">{c.label}</span>
                  <span className="flex items-center gap-2 font-mono text-xs text-[color:var(--muted)]">
                    {c.hint}
                    {on && (c.href && /^https?:/i.test(c.href) ? <ArrowUpRight className="h-3.5 w-3.5" /> : <CornerDownLeft className="h-3.5 w-3.5" />)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center justify-between border-t border-[color:var(--line)] px-4 py-2 font-mono text-[11px] text-[color:var(--muted)]">
          <span>{note || '↑ ↓ to move · Enter to run'}</span>
          <span>Ctrl K</span>
        </div>
      </div>
    </div>
  )
}
