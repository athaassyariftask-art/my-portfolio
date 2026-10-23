'use client'

import { FIELD_TYPES, SLOTS } from '@/layouts'
import type { Field, FieldType, Slot } from '@/layouts/types'
import { btnGhost, input } from '@/components/admin/ui'

/**
 * Configure a section's item fields: label, field type, and the layout "part" it fills (slot).
 * The internal field name is generated automatically and never changes, so renaming a label doesn't break existing data.
 */
export default function FieldsBuilder({
  fields,
  onChange,
  uses,
}: {
  fields: Field[]
  onChange: (f: Field[]) => void
  /** Slots shown by the selected layout; fields outside these get a note. */
  uses: Slot[]
}) {
  const set = (i: number, patch: Partial<Field>) => onChange(fields.map((f, j) => (j === i ? { ...f, ...patch } : f)))
  const move = (i: number, d: -1 | 1) => {
    const j = i + d
    if (j < 0 || j >= fields.length) return
    const next = [...fields]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  const add = () => {
    let n = fields.length + 1
    while (fields.some((f) => f.name === `field_${n}`)) n++
    onChange([...fields, { name: `field_${n}`, label: 'New field', type: 'text', slot: 'body' }])
  }

  return (
    <div className="space-y-3">
      {fields.map((f, i) => (
        <div key={f.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="grid gap-2 md:grid-cols-[1.2fr_1fr_1.2fr_auto] md:items-center">
            <input
              value={f.label}
              onChange={(e) => set(i, { label: e.target.value })}
              placeholder="Field name"
              aria-label="Field name"
              className={input}
            />
            <select
              value={f.type}
              onChange={(e) => set(i, { type: e.target.value as FieldType })}
              aria-label="Field type"
              className={input}
            >
              {FIELD_TYPES.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
            <select
              value={f.slot}
              onChange={(e) => set(i, { slot: e.target.value as Slot })}
              aria-label="Display as"
              className={input}
            >
              {SLOTS.map((s) => (
                <option key={s.key} value={s.key}>Display as: {s.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-3 text-sm font-semibold">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-slate-500 hover:text-slate-900 disabled:opacity-30">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === fields.length - 1} className="text-slate-500 hover:text-slate-900 disabled:opacity-30">↓</button>
              <button type="button" onClick={() => onChange(fields.filter((_, j) => j !== i))} className="text-rose-600 hover:underline">Delete</button>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={Boolean(f.required)} onChange={(e) => set(i, { required: e.target.checked })} />
              Required
            </label>
            {!uses.includes(f.slot) && <span className="text-amber-600">This layout doesn't display that part.</span>}
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className={btnGhost}>+ Add field</button>
      <p className="text-xs text-slate-500">
        Deleting a field doesn't delete its data on existing items. One field must be displayed as the Title.
      </p>
    </div>
  )
}
