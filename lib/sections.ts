import type { Field, Item, Options } from '@/layouts/types'
import { apiGet, unwrapList } from './api'

export type Section = {
  id: number
  kind: 'items' | 'projects' | string
  slug: string
  title: string
  layout: string
  schema: Field[]
  options: Options
  page: 'home' | 'about'
  items: Item[]
  is_visible: boolean
  order: number
}

export type Preset = {
  key: string
  label: string
  description: string
  title: string
  layout: string
  options: Options
  page: 'home' | 'about'
  schema: Field[]
  items: Item[]
}

type Raw = Partial<Section> & { id: number; slug: string }

const map = (r: Raw): Section => ({
  id: r.id,
  kind: r.kind ?? 'items',
  slug: r.slug,
  title: r.title ?? '',
  layout: r.layout ?? 'cards',
  schema: Array.isArray(r.schema) ? r.schema : [],
  options: r.options && typeof r.options === 'object' ? r.options : {},
  page: r.page === 'about' ? 'about' : 'home',
  items: Array.isArray(r.items) ? r.items : [],
  is_visible: r.is_visible ?? true,
  order: r.order ?? 0,
})

/** Untuk website publik: hanya section yang tampil. Backend mati -> daftar kosong (hero dan kontak tetap tampil). */
export async function getSections(): Promise<Section[]> {
  const data = await apiGet<unknown>('/sections/')
  return data ? unwrapList<Raw>(data).map(map) : []
}

/** Untuk admin: apa adanya dari database (termasuk yang disembunyikan). */
export async function getAdminSections(): Promise<Section[]> {
  const data = await apiGet<unknown>('/sections/', { auth: true })
  return data ? unwrapList<Raw>(data).map(map) : []
}

/** Satu section lewat slug. Admin (auth) bisa melihat yang disembunyikan juga. */
export async function getSectionBySlug(slug: string, opts?: { auth?: boolean }): Promise<Section | null> {
  const data = await apiGet<unknown>(`/sections/?slug=${encodeURIComponent(slug)}`, opts)
  const row = data ? unwrapList<Raw>(data)[0] : null
  return row ? map(row) : null
}

/** Template section siap pakai (dari backend, satu sumber kebenaran). */
export async function getPresets(): Promise<Preset[]> {
  const data = await apiGet<{ presets?: Preset[] }>('/section-presets/')
  return Array.isArray(data?.presets) ? data.presets : []
}
