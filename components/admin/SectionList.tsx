'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getLayout } from '@/layouts'
import type { Preset } from '@/lib/sections'
import DeleteButton from './DeleteButton'
import { btnPrimary, card, readError } from './ui'

type Row = {
  id: number
  slug: string
  kind: string
  title: string
  layout: string
  page: string
  is_visible: boolean
  order: number
  count: number
}

async function send(method: string, url: string, body?: unknown) {
  const res = await fetch(`/api/admin/${url}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await readError(res))
  return res.status === 204 ? null : res.json()
}

export default function SectionList({ sections, presets }: { sections: Row[]; presets: Preset[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [picking, setPicking] = useState(sections.length === 0)

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError('')
    try {
      await fn()
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    }
    setBusy(false)
  }

  // Urutan dinomori ulang (0, 10, 20, ...) supaya tidak bentrok kalau banyak yang bernilai sama.
  const move = (i: number, d: -1 | 1) =>
    run(async () => {
      const j = i + d
      if (j < 0 || j >= sections.length) return
      const next = [...sections]
      ;[next[i], next[j]] = [next[j], next[i]]
      await Promise.all(
        next.map((s, idx) => (s.order !== idx * 10 ? send('PATCH', `sections/${s.id}`, { order: idx * 10 }) : null)),
      )
    })

  const toggle = (s: Row) => run(async () => void (await send('PATCH', `sections/${s.id}`, { is_visible: !s.is_visible })))

  const nextOrder = () => sections.reduce((n, s) => Math.max(n, s.order), -10) + 10

  const create = (body: Record<string, unknown>) =>
    run(async () => {
      const created = (await send('POST', 'sections', { ...body, order: nextOrder(), is_visible: true })) as { slug: string }
      router.push(`/s/${created.slug}`) // langsung diedit di halamannya
    })

  const fromPreset = (p: Preset) =>
    create({
      kind: 'items',
      title: p.title,
      layout: p.layout,
      options: p.options,
      page: p.page,
      schema: p.schema,
      items: p.items,
    })

  const hasProjects = sections.some((s) => s.kind === 'projects')

  return (
    <div className="space-y-8">
      {sections.length > 0 && (
        <ul className={`${card} divide-y divide-slate-100 overflow-hidden`}>
          {sections.map((s, i) => (
            <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
              <div className="flex shrink-0 flex-col text-xs font-semibold text-slate-400">
                <button disabled={busy || i === 0} onClick={() => move(i, -1)} aria-label="Naikkan" className="hover:text-slate-900 disabled:opacity-30">↑</button>
                <button disabled={busy || i === sections.length - 1} onClick={() => move(i, 1)} aria-label="Turunkan" className="hover:text-slate-900 disabled:opacity-30">↓</button>
              </div>
              <div className="min-w-0 flex-1 basis-48">
                <p className="truncate font-semibold text-slate-900">{s.title}</p>
                <p className="flex flex-wrap gap-x-2 text-xs text-slate-500">
                  <span>{s.kind === 'projects' ? 'Project' : getLayout(s.layout).label}</span>
                  {s.kind !== 'projects' && <span>{s.count} item</span>}
                  <span>{s.page === 'about' ? 'Halaman Tentang saya' : 'Beranda'}</span>
                  {!s.is_visible && <span className="font-semibold text-amber-600">Disembunyikan</span>}
                </p>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={s.is_visible} disabled={busy} onChange={() => toggle(s)} />
                Tampil
              </label>
              <Link href={`/s/${s.slug}`} className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-600">
                Buka &amp; edit
              </Link>
              <DeleteButton endpoint={`sections/${s.id}`} name={s.title} />
            </li>
          ))}
        </ul>
      )}

      {!picking ? (
        <button onClick={() => setPicking(true)} className={btnPrimary}>+ Section baru</button>
      ) : (
        <div className={`${card} p-6`}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">Mulai dari template</h2>
              <p className="text-sm text-slate-500">
                Template hanya titik awal. Setelah dibuat kamu bebas mengganti layout dan isian di halaman section-nya.
              </p>
            </div>
            {sections.length > 0 && (
              <button onClick={() => setPicking(false)} className="text-sm font-medium text-slate-500 hover:text-slate-900">Tutup</button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {presets.map((p) => (
              <button
                key={p.key}
                disabled={busy}
                onClick={() => fromPreset(p)}
                className="rounded-2xl border border-slate-200 p-4 text-left transition-colors hover:border-slate-900 disabled:opacity-50"
              >
                <span className="block font-semibold text-slate-900">{p.label}</span>
                <span className="block text-sm text-slate-500">{p.description}</span>
                <span className="mt-2 block text-xs text-slate-400">Layout: {getLayout(p.layout).label}</span>
              </button>
            ))}
            {!hasProjects && (
              <button
                disabled={busy}
                onClick={() => create({ kind: 'projects', title: 'Selected projects', layout: 'cards' })}
                className="rounded-2xl border border-slate-200 p-4 text-left transition-colors hover:border-slate-900 disabled:opacity-50"
              >
                <span className="block font-semibold text-slate-900">Project</span>
                <span className="block text-sm text-slate-500">Kartu project dari menu Project.</span>
                <span className="mt-2 block text-xs text-slate-400">Isi dikelola di Admin → Project</span>
              </button>
            )}
          </div>
          {presets.length === 0 && (
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              Template tidak bisa dimuat. Pastikan backend Django berjalan dan sudah di-migrate.
            </p>
          )}
        </div>
      )}

      {error && <p className="whitespace-pre-line rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
    </div>
  )
}
