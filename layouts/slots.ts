import type { Field, Item, Slot, Slotted } from './types'

// Data item berasal dari JSON yang bisa kosong/berbeda bentuk (mis. item lama belum punya field baru,
// atau field diganti jenisnya). Semua pembacaan lewat sini supaya View tidak pernah error.

export const asStr = (v: unknown): string => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '')

/** Array teks; string biasa dipecah per baris/koma supaya field yang jenisnya diganti tetap terbaca. */
export const asList = (v: unknown): string[] => {
  const raw = Array.isArray(v) ? v : typeof v === 'string' ? v.split(/\n|,/) : []
  return raw.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean)
}

/** Hanya izinkan http(s) dan alamat relatif /media/..., supaya "javascript:" dari JSON tidak jadi link. */
export const safeUrl = (v: unknown): string => {
  const s = asStr(v).trim()
  return /^https?:\/\//i.test(s) || /^\/media\//.test(s) ? s : ''
}

const first = (fields: Field[], slot: Slot) => fields.find((f) => f.slot === slot)

/** Petakan item ke slot berdasarkan schema section. Field pertama yang memakai slot itu yang dipakai. */
export function readSlots(item: Item, fields: Field[]): Slotted {
  const raw = (slot: Slot) => {
    const f = first(fields, slot)
    return f ? item[f.name] : undefined
  }
  return {
    title: asStr(raw('title')),
    meta: asStr(raw('meta')),
    subtitle: asStr(raw('subtitle')),
    body: asStr(raw('body')),
    list: asList(raw('list')),
    tags: asList(raw('tags')),
    link: safeUrl(raw('link')),
    image: safeUrl(raw('image')),
  }
}

export const itemTitle = (item: Item, fields: Field[]): string => readSlots(item, fields).title
