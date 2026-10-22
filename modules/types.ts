import type { ComponentType } from 'react'
import type { Project } from '@/lib/projects'

/** Satu item di dalam section (bentuknya ditentukan schema modul). */
export type Item = Record<string, unknown>

/**
 * Jenis field yang dikenal form admin:
 *  text / url / textarea -> string
 *  tags  -> string[]  (diketik dipisah koma)
 *  lines -> string[]  (satu baris = satu poin)
 */
export type FieldType = 'text' | 'textarea' | 'url' | 'tags' | 'lines'

export type Field = {
  name: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  help?: string
}

export type ViewProps<T extends Item = Item> = {
  items: T[]
  /** Data project (hanya dipakai modul "projects"). */
  projects: Project[]
  /** Alamat halaman detail item (/d/<id>), atau null kalau item belum punya / belum ada isi. */
  detailHref: (item: Item) => string | null
}

/**
 * Satu modul = satu jenis section di halaman depan.
 * Menambah modul baru: buat folder di modules/<kind>/index.tsx lalu daftarkan di registry.ts.
 */
export type SectionModule<T extends Item = Item> = {
  kind: string
  label: string // nama jenis di admin, mis. "Achievement"
  description: string
  title: string // judul section bawaan
  itemLabel: string // nama 1 item di admin, mis. "Penghargaan"
  fields: Field[] // <- tambah field baru cukup di sini
  itemTitle: (item: T) => string // judul item di form admin
  defaults: T[] // isi awal (juga cadangan kalau database kosong)
  defaultOn?: boolean // ikut dibuat saat "Buat dari bawaan" (default: true)
  alwaysShow?: boolean // tetap tampil walau tanpa item (default: false)
  page?: 'home' | 'about' // tampil di beranda (default) atau halaman /about
  managedElsewhere?: { href: string; text: string } // data dikelola di menu lain (projects)
  View: ComponentType<ViewProps<T>>
}
