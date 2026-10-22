'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Entry, Section } from '@/lib/sections'
import DeleteButton from './DeleteButton'
import { btnGhost, btnPrimary, input, label, readError } from './ui'

const asText = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(', ') : v ?? '')

function entryTitle(section: Section, e: Entry) {
  const t = section.schema.find((f) => f.role === 'title')
  return (t ? asText(e.data[t.key]) : '') || '(tanpa judul)'
}

function EntryForm({ section, entry, onDone }: { section: Section; entry?: Entry; onDone: () => void }) {
  const router = useRouter()
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(section.schema.map((f) => [f.key, asText(entry?.data[f.key])]))
  )
  const [file, setFile] = useState<File | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const filePreview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => { if (filePreview) URL.revokeObjectURL(filePreview) }, [filePreview])
  const preview = filePreview ?? (removeImage ? null : entry?.image ?? null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const form = new FormData(e.currentTarget)

    const data = Object.fromEntries(
      section.schema.map((f) => {
        const v = values[f.key] ?? ''
        return [f.key, f.role === 'tags' ? v.split(',').map((s) => s.trim()).filter(Boolean) : v.trim()]
      })
    )

    const fd = new FormData()
    fd.set('section', String(section.id))
    fd.set('data', JSON.stringify(data))
    fd.set('order', String(form.get('order') || 0))
    fd.set('is_visible', form.get('is_visible') ? 'true' : 'false')
    if (file) fd.set('image', file)
    else if (removeImage) fd.set('image', '')

    const res = await fetch(entry ? `/api/admin/entries/${entry.id}` : '/api/admin/entries', {
      method: entry ? 'PATCH' : 'POST',
      body: fd,
    })
    if (!res.ok) {
      setError(await readError(res))
      setBusy(false)
      return
    }
    router.refresh()
    onDone()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-blue-200 bg-white p-6">
      <p className="font-mono text-xs uppercase tracking-widest text-blue-600">{entry ? 'Edit entri' : 'Entri baru'}</p>

      {section.schema.map((f) => {
        const id = `f-${f.key}`
        const set = (v: string) => setValues((s) => ({ ...s, [f.key]: v }))
        return (
          <div key={f.key}>
            <label className={label} htmlFor={id}>{f.label}</label>
            {f.role === 'body' ? (
              <textarea id={id} rows={4} value={values[f.key]} onChange={(e) => set(e.target.value)} className={input} />
            ) : (
              <input
                id={id}
                type={f.role === 'link' ? 'url' : 'text'}
                value={values[f.key]}
                onChange={(e) => set(e.target.value)}
                placeholder={f.role === 'tags' ? 'Pisahkan dengan koma' : f.role === 'link' ? 'https://…' : ''}
                className={input}
              />
            )}
            {f.role === 'body' && section.layout === 'timeline' && (
              <p className="mt-1 font-mono text-xs text-slate-400">Satu baris = satu poin.</p>
            )}
          </div>
        )
      })}

      {section.has_image && (
        <div>
          <span className={label}>Gambar</span>
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="mb-3 max-h-44 rounded-2xl border border-slate-200" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setRemoveImage(false)
            }}
            className="block text-sm text-slate-600"
          />
          {entry?.image && !file && (
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={removeImage} onChange={(e) => setRemoveImage(e.target.checked)} />
              Hapus gambar
            </label>
          )}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className={label} htmlFor="e-order">Urutan (kecil tampil dulu)</label>
          <input id="e-order" name="order" type="number" min={0} defaultValue={entry?.order ?? 0} className={input} />
        </div>
        <label className="flex items-center gap-3 pt-6 text-slate-700">
          <input type="checkbox" name="is_visible" defaultChecked={entry?.is_visible ?? true} className="h-4 w-4" />
          Tampilkan di website
        </label>
      </div>

      {error && <p className="whitespace-pre-line rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

      <div className="flex gap-3">
        <button disabled={busy} className={btnPrimary}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
        <button type="button" onClick={onDone} className={btnGhost}>Batal</button>
      </div>
    </form>
  )
}

export default function EntryManager({ section }: { section: Section }) {
  const [editing, setEditing] = useState<Entry | 'new' | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Isi ({section.entries.length})</h2>
        {editing === null && (
          <button onClick={() => setEditing('new')} className={btnPrimary}>+ Tambah entri</button>
        )}
      </div>

      {editing && (
        <EntryForm
          key={editing === 'new' ? 'new' : editing.id}
          section={section}
          entry={editing === 'new' ? undefined : editing}
          onDone={() => setEditing(null)}
        />
      )}

      {section.entries.length === 0 && editing === null ? (
        <p className="rounded-3xl border border-dashed border-slate-300 p-10 text-slate-500">
          Belum ada isi. Section ini tidak tampil di website sampai ada minimal satu entri.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-3xl border border-slate-200 bg-white">
          {section.entries.map((e) => (
            <li key={e.id} className="flex items-center gap-4 p-4">
              {section.has_image && (
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {e.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.image} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{entryTitle(section, e)}</p>
                <p className="flex gap-2 font-mono text-xs text-slate-500">
                  <span>#{e.order}</span>
                  {!e.is_visible && <span className="text-amber-600">DISEMBUNYIKAN</span>}
                </p>
              </div>
              <button onClick={() => setEditing(e)} className="text-sm font-semibold text-blue-600 hover:underline">
                Edit
              </button>
              <DeleteButton endpoint={`entries/${e.id}`} name={entryTitle(section, e)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
