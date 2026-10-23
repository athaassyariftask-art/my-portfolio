'use client'

import { useRef, useState } from 'react'
import { uploadImage } from '@/lib/upload'
import { btnGhost, input, label } from './ui'

// Loose types so it works for sections (with slots) and for other forms like social links (without slots).
export type Item = Record<string, unknown>
export type Field = {
  name: string
  label: string
  type: 'text' | 'textarea' | 'url' | 'tags' | 'lines' | 'image'
  slot?: string
  required?: boolean
  placeholder?: string
  help?: string
}

// Item-list form generated automatically from a list of Fields (schema).
// Used by both the section editor AND the profile form (social links): one component for all.

type Row = { key: number; orig: Item; draft: Record<string, string> }

const toDraft = (fields: Field[], item: Item): Record<string, string> =>
  Object.fromEntries(
    fields.map((f) => {
      const v = item[f.name]
      if (f.type === 'tags') return [f.name, Array.isArray(v) ? v.join(', ') : '']
      if (f.type === 'lines') return [f.name, Array.isArray(v) ? v.join('\n') : '']
      return [f.name, typeof v === 'string' ? v : v == null ? '' : String(v)]
    }),
  )

const split = (s: string, sep: string) => s.split(sep).map((x) => x.trim()).filter(Boolean)

/** Draft (raw form text) -> item. Other keys on the original item (not in the schema) are preserved. */
function toItem(fields: Field[], orig: Item, draft: Record<string, string>): Item {
  const out: Item = { ...orig }
  for (const f of fields) {
    const raw = draft[f.name] ?? ''
    out[f.name] = f.type === 'tags' ? split(raw, ',') : f.type === 'lines' ? split(raw, '\n') : raw.trim()
  }
  return out
}

/** Error message if a required field is empty, or null if everything is fine. */
export function findMissing(fields: Field[], items: Item[], itemLabel: string): string | null {
  for (let i = 0; i < items.length; i++) {
    for (const f of fields) {
      if (!f.required) continue
      const v = items[i][f.name]
      if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) {
        return `${itemLabel} #${i + 1}: the "${f.label}" field is required.`
      }
    }
  }
  return null
}

type Props = {
  fields: Field[]
  initial: Item[]
  onChange: (items: Item[]) => void
  itemLabel?: string
  itemTitle?: (item: Item) => string
  /** Give new items a stable id (used by sections, so item detail pages have an address). */
  withIds?: boolean
  /** Link to the item's detail page (shown in the card header), or null. */
  itemHref?: (item: Item) => string | null
}

const newId = () => Math.random().toString(16).slice(2, 12).padEnd(10, '0')

function ImageField({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-xs text-slate-400">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          'None yet'
        )}
      </div>
      <div className="space-y-1.5">
        <input
          id={id}
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            setBusy(true)
            setErr('')
            try {
              onChange(await uploadImage(file))
            } catch (x) {
              setErr((x as Error).message)
            }
            setBusy(false)
            e.target.value = ''
          }}
          className="block text-sm text-slate-600"
        />
        {value && (
          <button type="button" onClick={() => onChange('')} className="text-sm font-medium text-rose-600 hover:underline">
            Remove image
          </button>
        )}
        {busy && <p className="text-xs text-slate-500">Uploading…</p>}
        {err && <p className="text-xs text-rose-600">{err}</p>}
      </div>
    </div>
  )
}

export default function ItemsEditor({ fields, initial, onChange, itemLabel = 'Item', itemTitle, withIds, itemHref }: Props) {
  const seq = useRef(0)
  const mk = (item: Item): Row => ({ key: seq.current++, orig: item, draft: toDraft(fields, item) })
  const [rows, setRows] = useState<Row[]>(() => initial.map(mk))

  const emit = (next: Row[]) => {
    setRows(next)
    onChange(next.map((r) => toItem(fields, r.orig, r.draft)))
  }
  const setField = (key: number, name: string, value: string) =>
    emit(rows.map((r) => (r.key === key ? { ...r, draft: { ...r.draft, [name]: value } } : r)))
  const move = (i: number, d: -1 | 1) => {
    const j = i + d
    if (j < 0 || j >= rows.length) return
    const next = [...rows]
    ;[next[i], next[j]] = [next[j], next[i]]
    emit(next)
  }

  return (
    <div className="space-y-4">
      {rows.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
          No {itemLabel.toLowerCase()} yet. Click the add button below.
        </p>
      )}

      {rows.map((r, i) => {
        const current = toItem(fields, r.orig, r.draft)
        const title = itemTitle?.(current)
        const href = itemHref?.(current)
        return (
          <div key={r.key} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="truncate text-xs font-semibold text-slate-500">
                {itemLabel} {i + 1}
                {title ? ` · ${title}` : ''}
              </p>
              <div className="flex shrink-0 items-center gap-3 text-sm font-semibold">
                {href && (
                  <a href={href} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    Detail page ↗
                  </a>
                )}
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-slate-500 hover:text-slate-900 disabled:opacity-30">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} className="text-slate-500 hover:text-slate-900 disabled:opacity-30">↓</button>
                <button type="button" onClick={() => emit(rows.filter((x) => x.key !== r.key))} className="text-rose-600 hover:underline">Delete</button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {fields.map((f) => {
                const id = `f-${r.key}-${f.name}`
                const multiline = f.type === 'textarea' || f.type === 'lines' || f.type === 'image'
                return (
                  <div key={f.name} className={multiline ? 'md:col-span-2' : ''}>
                    <label className={label} htmlFor={id}>
                      {f.label}
                      {f.required && <span className="text-rose-500"> *</span>}
                    </label>
                    {f.type === 'image' ? (
                      <ImageField id={id} value={r.draft[f.name] ?? ''} onChange={(v) => setField(r.key, f.name, v)} />
                    ) : multiline ? (
                      <textarea
                        id={id}
                        rows={f.type === 'lines' ? 4 : 3}
                        value={r.draft[f.name] ?? ''}
                        placeholder={f.placeholder}
                        onChange={(e) => setField(r.key, f.name, e.target.value)}
                        className={input}
                      />
                    ) : (
                      <input
                        id={id}
                        type={f.type === 'url' ? 'url' : 'text'}
                        value={r.draft[f.name] ?? ''}
                        placeholder={f.placeholder}
                        onChange={(e) => setField(r.key, f.name, e.target.value)}
                        className={input}
                      />
                    )}
                    {f.help && <p className="mt-1 text-xs text-slate-400">{f.help}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <button type="button" onClick={() => emit([...rows, mk(withIds ? { _id: newId() } : {})])} className={btnGhost}>
        + Add {itemLabel.toLowerCase()}
      </button>
    </div>
  )
}
