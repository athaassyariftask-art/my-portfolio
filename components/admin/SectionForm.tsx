'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Layout, Role, Section } from '@/lib/sections'
import { LAYOUTS, PRESETS, ROLES } from './sectionMeta'
import { btnGhost, btnPrimary, input, label, readError } from './ui'

type Row = { key?: string; label: string; role: Role }

export default function SectionForm({ section }: { section?: Section }) {
  const router = useRouter()
  const [title, setTitle] = useState(section?.title ?? '')
  const [layout, setLayout] = useState<Layout>(section?.layout ?? 'cards')
  const [rows, setRows] = useState<Row[]>(section?.schema ?? PRESETS.kosong.fields)
  const [hasImage, setHasImage] = useState(section?.has_image ?? false)
  const [order, setOrder] = useState(section?.order ?? 0)
  const [visible, setVisible] = useState(section?.is_visible ?? true)
  const [nav, setNav] = useState(section?.show_in_nav ?? false)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const update = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  const remove = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i))
  const move = (i: number, dir: -1 | 1) =>
    setRows((rs) => {
      const j = i + dir
      if (j < 0 || j >= rs.length) return rs
      const next = [...rs]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  function applyPreset(id: string) {
    const p = PRESETS[id]
    if (!p) return
    if (!title.trim()) setTitle(p.title)
    setLayout(p.layout)
    setHasImage(p.hasImage)
    setRows(p.fields.map((f) => ({ ...f })))
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setSaved(false)

    const res = await fetch(section ? `/api/admin/sections/${section.id}` : '/api/admin/sections', {
      method: section ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        layout,
        schema: rows,
        has_image: hasImage,
        order: Number(order) || 0,
        is_visible: visible,
        show_in_nav: nav,
      }),
    })

    if (!res.ok) {
      setError(await readError(res))
      setBusy(false)
      return
    }

    if (section) {
      setSaved(true)
      router.refresh()
      setBusy(false)
    } else {
      const created = await res.json()
      router.push(`/admin/sections/${created.id}`)
      router.refresh()
    }
  }

  const roleHint = (r: Role) => ROLES.find((x) => x.value === r)?.hint

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {!section && (
        <div>
          <label className={label} htmlFor="preset">Mulai dari template</label>
          <select
            id="preset"
            defaultValue=""
            onChange={(e) => applyPreset(e.target.value)}
            className={input}
          >
            <option value="" disabled>Pilih template (opsional)…</option>
            {Object.entries(PRESETS).map(([id, p]) => (
              <option key={id} value={id}>{p.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className={label} htmlFor="s-title">Nama section</label>
          <input id="s-title" required value={title} onChange={(e) => setTitle(e.target.value)} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="s-layout">Tampilan</label>
          <select id="s-layout" value={layout} onChange={(e) => setLayout(e.target.value as Layout)} className={input}>
            {LAYOUTS.map((l) => (
              <option key={l.value} value={l.value}>{l.label} — {l.hint}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className={label}>Field (kolom isian untuk tiap entri)</span>
        <ul className="space-y-3">
          {rows.map((r, i) => (
            <li key={r.key ?? `new-${i}`} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
                <input
                  aria-label="Nama field"
                  required
                  placeholder="Nama field, mis. Tahun"
                  value={r.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                  className={input}
                />
                <select
                  aria-label="Jenis field"
                  value={r.role}
                  onChange={(e) => update(i, { role: e.target.value as Role })}
                  className={input}
                >
                  {ROLES.map((x) => (
                    <option key={x.value} value={x.value}>{x.label}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1 text-slate-500">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Naikkan" className="px-2 py-1 hover:text-slate-900 disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Turunkan" className="px-2 py-1 hover:text-slate-900 disabled:opacity-30">↓</button>
                  <button type="button" onClick={() => remove(i)} aria-label="Hapus field" className="px-2 py-1 text-rose-600 hover:underline">Hapus</button>
                </div>
              </div>
              <p className="mt-2 font-mono text-xs text-slate-400">{roleHint(r.role)}</p>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setRows((rs) => [...rs, { label: '', role: 'extra' }])}
          className={`${btnGhost} mt-3`}
        >
          + Tambah field
        </button>
        {section && (
          <p className="mt-3 text-sm text-slate-500">
            Menghapus field menyembunyikan datanya dari website. Entri lama tetap aman, dan field baru tampil kosong
            sampai kamu mengisinya.
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <label className={label} htmlFor="s-order">Urutan di halaman</label>
          <input id="s-order" type="number" min={0} value={order} onChange={(e) => setOrder(Number(e.target.value))} className={input} />
        </div>
        <label className="flex items-center gap-3 pt-6 text-slate-700">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="h-4 w-4" />
          Tampilkan di website
        </label>
        <label className="flex items-center gap-3 pt-6 text-slate-700">
          <input type="checkbox" checked={nav} onChange={(e) => setNav(e.target.checked)} className="h-4 w-4" />
          Masuk menu navigasi
        </label>
      </div>

      <label className="flex items-center gap-3 text-slate-700">
        <input type="checkbox" checked={hasImage} onChange={(e) => setHasImage(e.target.checked)} className="h-4 w-4" />
        Tiap entri boleh punya gambar
      </label>

      {error && <p className="whitespace-pre-line rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      {saved && <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">Tersimpan.</p>}

      <div className="flex gap-3">
        <button disabled={busy} className={btnPrimary}>
          {busy ? 'Menyimpan…' : section ? 'Simpan pengaturan' : 'Buat section'}
        </button>
        {!section && <Link href="/admin/sections" className={btnGhost}>Batal</Link>}
      </div>
    </form>
  )
}
