import type { Item, Options } from '@/layouts/types'
import { apiGet, isStaff } from './api'
import type { Block } from './pages'

/** Isi detail (blok) untuk satu key, mis. "project-3", "item-ab12cd34", "about". Kosong kalau belum ada. */
export async function getDetail(key: string): Promise<Block[]> {
  const d = await apiGet<{ blocks?: Block[] }>(`/details/${encodeURIComponent(key)}/`)
  return Array.isArray(d?.blocks) ? d.blocks : []
}

/** Pengunjung yang sedang login sebagai admin (tanda tangan cookie diperiksa; server memeriksa lagi saat menyimpan). */
export async function isAdmin(): Promise<boolean> {
  return isStaff()
}

export type DetailFull = { exists: boolean; blocks: Block[]; title: string; parent: string }

export async function getDetailFull(key: string): Promise<DetailFull | null> {
  const d = await apiGet<Partial<DetailFull>>(`/details/${encodeURIComponent(key)}/`)
  if (!d) return null
  return {
    exists: Boolean(d.exists),
    blocks: Array.isArray(d.blocks) ? d.blocks : [],
    title: d.title ?? '',
    parent: d.parent ?? '',
  }
}

/** Alamat halaman untuk sebuah key detail (dipakai tombol "kembali" di sub-halaman). */
export function keyHref(key: string): string {
  if (key.startsWith('project-')) return `/projects/${key.slice(8)}`
  if (key.startsWith('item-')) return `/d/${key.slice(5)}`
  if (key.startsWith('sub-')) return `/n/${key}`
  if (key === 'about') return '/about'
  return '/'
}

export type DetailContext = { keys: string[]; admin: boolean }

/** Dipakai halaman yang menampilkan Sections: key mana yang sudah punya isi + apakah pengunjung admin. */
export async function getDetailContext(): Promise<DetailContext> {
  const [d, admin] = await Promise.all([apiGet<{ keys?: string[] }>('/details/'), isAdmin()])
  return { keys: Array.isArray(d?.keys) ? d.keys : [], admin }
}

export const itemDetailKey = (item: Item): string | null => {
  const id = item._id
  return typeof id === 'string' && id ? `item-${id}` : null
}

/** Tautan ke halaman detail item. Pengunjung biasa hanya melihatnya kalau sudah ada isinya. */
export function makeDetailHref(ctx: DetailContext, options?: Options) {
  return (item: Item): string | null => {
    if (options?.detail === false) return null // section ini tidak memakai halaman detail
    const key = itemDetailKey(item)
    if (!key) return null
    return ctx.admin || ctx.keys.includes(key) ? `/d/${key.slice(5)}` : null
  }
}
