import type { Layout, Role } from '@/lib/sections'

// Konstanta khusus admin (tidak mengimpor kode server, aman dipakai di komponen client)

export const ROLES: { value: Role; label: string; hint: string }[] = [
  { value: 'title', label: 'Judul utama', hint: 'Teks besar. Wajib ada satu.' },
  { value: 'subtitle', label: 'Subjudul', hint: 'Teks abu di bawah judul (penyelenggara, organisasi, dll.)' },
  { value: 'meta', label: 'Info kecil', hint: 'Tahun / periode / kategori, tampil kecil' },
  { value: 'body', label: 'Deskripsi', hint: 'Teks panjang. Pada Timeline: satu baris = satu poin' },
  { value: 'tags', label: 'Daftar tag', hint: 'Beberapa item dipisah koma, tampil sebagai chip' },
  { value: 'link', label: 'Link (URL)', hint: 'Tampil sebagai tautan bernama sesuai nama field' },
  { value: 'extra', label: 'Info tambahan', hint: 'Tampil sebagai "NAMA FIELD: nilai"' },
]

export const LAYOUTS: { value: Layout; label: string; hint: string }[] = [
  { value: 'cards', label: 'Kartu', hint: 'Grid kartu, bisa dengan gambar' },
  { value: 'timeline', label: 'Timeline', hint: 'Periode di kiri, detail di kanan' },
  { value: 'chips', label: 'Grup tag', hint: 'Judul grup + chip (cocok untuk toolbox)' },
  { value: 'list', label: 'Daftar', hint: 'Baris sederhana, rapat' },
]

export type Preset = {
  label: string
  title: string
  layout: Layout
  hasImage: boolean
  fields: { label: string; role: Role }[]
}

// Titik awal untuk section baru. Semua bisa diubah setelahnya.
export const PRESETS: Record<string, Preset> = {
  kosong: {
    label: 'Mulai kosong',
    title: '',
    layout: 'cards',
    hasImage: false,
    fields: [
      { label: 'Judul', role: 'title' },
      { label: 'Deskripsi', role: 'body' },
    ],
  },
  achievement: {
    label: 'Achievement / prestasi',
    title: 'Achievement',
    layout: 'cards',
    hasImage: false,
    fields: [
      { label: 'Nama prestasi', role: 'title' },
      { label: 'Penyelenggara', role: 'subtitle' },
      { label: 'Tahun', role: 'meta' },
      { label: 'Deskripsi', role: 'body' },
      { label: 'Link sertifikat', role: 'link' },
    ],
  },
  sertifikasi: {
    label: 'Sertifikasi / kursus',
    title: 'Sertifikasi',
    layout: 'list',
    hasImage: false,
    fields: [
      { label: 'Nama sertifikat', role: 'title' },
      { label: 'Penerbit', role: 'subtitle' },
      { label: 'Tahun', role: 'meta' },
      { label: 'Link kredensial', role: 'link' },
    ],
  },
  organisasi: {
    label: 'Organisasi / kepanitiaan',
    title: 'Organisasi',
    layout: 'timeline',
    hasImage: false,
    fields: [
      { label: 'Periode', role: 'meta' },
      { label: 'Jabatan', role: 'title' },
      { label: 'Organisasi', role: 'subtitle' },
      { label: 'Tanggung jawab (satu baris = satu poin)', role: 'body' },
    ],
  },
}
