import type { ComponentType } from 'react'
import type { Project } from '@/lib/projects'

/** Satu item di section: key-nya mengikuti nama field di schema section. */
export type Item = Record<string, unknown>

/**
 * Jenis isian di form:
 *  text / textarea / url -> string, tags -> string[] (diketik dipisah koma),
 *  lines -> string[] (satu baris = satu poin), image -> alamat gambar (diupload)
 */
export type FieldType = 'text' | 'textarea' | 'url' | 'tags' | 'lines' | 'image'

/** Bagian layout yang diisi sebuah field. Layout hanya membaca slot, bukan nama field. */
export type Slot = 'title' | 'meta' | 'subtitle' | 'body' | 'list' | 'tags' | 'link' | 'image'

export type Field = {
  name: string
  label: string
  type: FieldType
  slot: Slot
  required?: boolean
  placeholder?: string
  help?: string
}

export type Options = { columns?: number; detail?: boolean }

export type LayoutKey = 'cards' | 'timeline' | 'list' | 'chips' | 'text' | 'journey'

/** Isi item yang sudah dipetakan ke slot (lihat slots.ts). */
export type Slotted = {
  title: string
  meta: string
  subtitle: string
  body: string
  list: string[]
  tags: string[]
  link: string
  image: string
}

export type LayoutProps = {
  items: Item[]
  fields: Field[]
  options: Options
  /** Alamat halaman detail item (/d/<id>), atau null kalau item belum punya / belum ada isi. */
  detailHref: (item: Item) => string | null
}

export type Layout = {
  key: LayoutKey
  label: string
  description: string
  /** Slot yang dipakai layout ini (untuk petunjuk di builder). */
  uses: Slot[]
  /** Layout ini punya opsi jumlah kolom? */
  columns?: boolean
  View: ComponentType<LayoutProps>
}

export type ProjectsProps = { projects: Project[] }
