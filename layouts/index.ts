import Cards from './cards'
import Chips from './chips'
import List from './list'
import Text from './text'
import Timeline from './timeline'
import type { FieldType, Layout, LayoutKey, Slot } from './types'

/**
 * Daftar layout. Menambah layout baru: buat layouts/<nama>.tsx (salin dari yang mirip),
 * tambahkan satu entri di bawah, dan satu key di LAYOUTS (backend/portfolio_api/presets.py).
 */
export const layouts: Record<LayoutKey, Layout> = {
  cards: {
    key: 'cards',
    label: 'Kartu',
    description: 'Grid kartu berwarna. Bisa dengan gambar.',
    uses: ['image', 'meta', 'title', 'subtitle', 'body', 'list', 'tags', 'link'],
    columns: true,
    View: Cards,
  },
  timeline: {
    key: 'timeline',
    label: 'Timeline',
    description: 'Garis waktu vertikal. Cocok untuk pengalaman.',
    uses: ['meta', 'title', 'subtitle', 'body', 'list', 'tags', 'link'],
    View: Timeline,
  },
  list: {
    key: 'list',
    label: 'Daftar',
    description: 'Baris ringkas satu per satu. Cocok untuk achievement.',
    uses: ['meta', 'title', 'subtitle', 'body', 'tags', 'link'],
    View: List,
  },
  chips: {
    key: 'chips',
    label: 'Chip / tag',
    description: 'Grup berjudul berisi chip. Cocok untuk toolbox.',
    uses: ['title', 'body', 'tags'],
    columns: true,
    View: Chips,
  },
  text: {
    key: 'text',
    label: 'Teks panjang',
    description: 'Judul + paragraf (Markdown). Cocok untuk cerita.',
    uses: ['title', 'subtitle', 'body'],
    View: Text,
  },
}

export const layoutList = Object.values(layouts)
export const getLayout = (key: string): Layout => layouts[key as LayoutKey] ?? layouts.cards

export const FIELD_TYPES: { key: FieldType; label: string }[] = [
  { key: 'text', label: 'Teks pendek' },
  { key: 'textarea', label: 'Teks panjang' },
  { key: 'url', label: 'Link' },
  { key: 'tags', label: 'Tag (pisah koma)' },
  { key: 'lines', label: 'Poin (satu baris satu poin)' },
  { key: 'image', label: 'Gambar' },
]

export const SLOTS: { key: Slot; label: string }[] = [
  { key: 'title', label: 'Judul' },
  { key: 'meta', label: 'Label kecil (periode, tahun)' },
  { key: 'subtitle', label: 'Sub-judul (organisasi, penyelenggara)' },
  { key: 'body', label: 'Deskripsi' },
  { key: 'list', label: 'Daftar poin' },
  { key: 'tags', label: 'Tag' },
  { key: 'link', label: 'Tombol link' },
  { key: 'image', label: 'Gambar' },
]
