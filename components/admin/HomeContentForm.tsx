'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ICON_KEYS, type HomeExpertise, type HomeStat, type StatMode } from '@/lib/home'
import { btnGhost, btnPrimary, input, label, readError } from './ui'

const MODES: { value: StatMode; text: string }[] = [
  { value: 'number', text: 'A fixed number' },
  { value: 'years', text: 'Years since a month' },
  { value: 'projects', text: 'Number of my projects' },
]

type Props = {
  /** What the site shows right now (saved content, or the defaults from hero.config.ts) */
  tagline: string
  stats: HomeStat[]
  expertise: HomeExpertise[]
}

/** Edit the hero tagline, the achievement cards and the Expertise columns. Add, remove and reorder freely. */
export default function HomeContentForm(initial: Props) {
  const router = useRouter()
  const [tagline, setTagline] = useState(initial.tagline)
  const [stats, setStats] = useState<HomeStat[]>(initial.stats)
  const [expertise, setExpertise] = useState<HomeExpertise[]>(initial.expertise)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const move = <T,>(list: T[], i: number, d: number): T[] => {
    const j = i + d
    if (j < 0 || j >= list.length) return list
    const next = [...list]
    ;[next[i], next[j]] = [next[j], next[i]]
    return next
  }

  async function send(home: unknown) {
    setBusy(true)
    setError('')
    setSaved(false)
    const res = await fetch('/api/admin/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ home }),
    })
    if (!res.ok) setError(await readError(res))
    else {
      setSaved(true)
      router.refresh()
    }
    setBusy(false)
  }

  const save = () => send({ tagline, stats: stats.filter((s) => s.label.trim()), expertise: expertise.filter((e) => e.title.trim()) })
  const reset = () => {
    if (confirm('Go back to the defaults from hero.config.ts? Your edits here will be removed.')) void send({})
  }

  const small = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none'
  const mini = 'rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-900 disabled:opacity-30'

  return (
    <div className="space-y-8">
      <div>
        <label className={label} htmlFor="tagline">Line under your name (hero)</label>
        <textarea id="tagline" rows={2} value={tagline} onChange={(e) => setTagline(e.target.value)} className={input} />
      </div>

      {/* Achievement cards */}
      <div>
        <p className={label}>Achievement cards (the big numbers)</p>
        <div className="space-y-3">
          {stats.map((s, i) => (
            <div key={i} className="grid items-end gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[1.4fr_1.2fr_1fr_5rem_auto]">
              <div>
                <span className="mb-1 block text-xs text-slate-500">Label</span>
                <input value={s.label} onChange={(e) => setStats(stats.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} className={small} placeholder="Years as lab assistant" />
              </div>
              <div>
                <span className="mb-1 block text-xs text-slate-500">Number comes from</span>
                <select value={s.mode} onChange={(e) => setStats(stats.map((x, k) => (k === i ? { ...x, mode: e.target.value as StatMode } : x)))} className={small}>
                  {MODES.map((m) => (
                    <option key={m.value} value={m.value}>{m.text}</option>
                  ))}
                </select>
              </div>
              <div>
                {s.mode === 'number' && (
                  <>
                    <span className="mb-1 block text-xs text-slate-500">Number</span>
                    <input type="number" min={0} value={s.value} onChange={(e) => setStats(stats.map((x, k) => (k === i ? { ...x, value: Number(e.target.value) } : x)))} className={small} />
                  </>
                )}
                {s.mode === 'years' && (
                  <>
                    <span className="mb-1 block text-xs text-slate-500">Since (YYYY-MM)</span>
                    <input value={s.since} onChange={(e) => setStats(stats.map((x, k) => (k === i ? { ...x, since: e.target.value } : x)))} className={small} placeholder="2024-11" />
                  </>
                )}
                {s.mode === 'projects' && <p className="pb-2 text-xs text-slate-500">Counts your published projects.</p>}
              </div>
              <div>
                <span className="mb-1 block text-xs text-slate-500">Suffix</span>
                <input value={s.suffix} maxLength={4} onChange={(e) => setStats(stats.map((x, k) => (k === i ? { ...x, suffix: e.target.value } : x)))} className={small} placeholder="+" />
              </div>
              <div className="flex gap-1.5">
                <button type="button" className={mini} disabled={i === 0} onClick={() => setStats(move(stats, i, -1))} aria-label="Move up">↑</button>
                <button type="button" className={mini} disabled={i === stats.length - 1} onClick={() => setStats(move(stats, i, 1))} aria-label="Move down">↓</button>
                <button type="button" className={mini} onClick={() => setStats(stats.filter((_, k) => k !== i))} aria-label="Remove">✕</button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" className={`${btnGhost} mt-3`} disabled={stats.length >= 8} onClick={() => setStats([...stats, { label: '', mode: 'number', value: 0, since: '', suffix: '' }])}>
          + Add card
        </button>
      </div>

      {/* Expertise */}
      <div>
        <p className={label}>Expertise columns</p>
        <div className="space-y-3">
          {expertise.map((e, i) => (
            <div key={i} className="grid items-end gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[8rem_1fr_2fr_auto]">
              <div>
                <span className="mb-1 block text-xs text-slate-500">Icon</span>
                <select value={e.icon} onChange={(ev) => setExpertise(expertise.map((x, k) => (k === i ? { ...x, icon: ev.target.value as HomeExpertise['icon'] } : x)))} className={small}>
                  {ICON_KEYS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="mb-1 block text-xs text-slate-500">Title</span>
                <input value={e.title} onChange={(ev) => setExpertise(expertise.map((x, k) => (k === i ? { ...x, title: ev.target.value } : x)))} className={small} />
              </div>
              <div>
                <span className="mb-1 block text-xs text-slate-500">Short description</span>
                <input value={e.text} onChange={(ev) => setExpertise(expertise.map((x, k) => (k === i ? { ...x, text: ev.target.value } : x)))} className={small} />
              </div>
              <div className="flex gap-1.5">
                <button type="button" className={mini} disabled={i === 0} onClick={() => setExpertise(move(expertise, i, -1))} aria-label="Move up">↑</button>
                <button type="button" className={mini} disabled={i === expertise.length - 1} onClick={() => setExpertise(move(expertise, i, 1))} aria-label="Move down">↓</button>
                <button type="button" className={mini} onClick={() => setExpertise(expertise.filter((_, k) => k !== i))} aria-label="Remove">✕</button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" className={`${btnGhost} mt-3`} disabled={expertise.length >= 8} onClick={() => setExpertise([...expertise, { icon: 'code', title: '', text: '' }])}>
          + Add column
        </button>
      </div>

      {error && <p className="whitespace-pre-line rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {saved && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">Saved. The home page is updated.</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={busy} onClick={save} className={btnPrimary}>{busy ? 'Saving…' : 'Save home content'}</button>
        <button type="button" disabled={busy} onClick={reset} className={btnGhost}>Reset to defaults</button>
      </div>
    </div>
  )
}
