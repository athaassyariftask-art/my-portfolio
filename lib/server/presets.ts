// Kosakata section: layout, jenis field, slot, dan template siap pakai (porting dari presets.py Django).

export const LAYOUTS: Record<string, string> = {
  cards: 'Kartu',
  timeline: 'Timeline',
  list: 'Daftar',
  chips: 'Chip / tag',
  text: 'Teks panjang',
}

export const FIELD_TYPES: Record<string, string> = {
  text: 'Teks pendek',
  textarea: 'Teks panjang',
  url: 'Link',
  tags: 'Tag (pisah koma)',
  lines: 'Poin (satu baris satu poin)',
  image: 'Gambar',
}

export const SLOTS: Record<string, string> = {
  title: 'Judul',
  meta: 'Label kecil (periode, tahun)',
  subtitle: 'Sub-judul (organisasi, penyelenggara)',
  body: 'Deskripsi',
  list: 'Daftar poin',
  tags: 'Tag',
  link: 'Tombol link',
  image: 'Gambar',
}

const f = (name: string, label: string, type: string, slot: string, required = false) => ({
  name,
  label,
  type,
  slot,
  required,
})

export const PRESETS = [
  {
    key: 'experience',
    label: 'Pengalaman',
    description: 'Riwayat kerja/organisasi, ditampilkan sebagai timeline.',
    title: 'Pengalaman',
    layout: 'timeline',
    options: { detail: true },
    page: 'home',
    schema: [
      f('period', 'Periode', 'text', 'meta'),
      f('title', 'Posisi', 'text', 'title', true),
      f('org', 'Organisasi', 'text', 'subtitle'),
      f('points', 'Poin tugas', 'lines', 'list'),
    ],
    items: [
      {
        period: '20XX — Sekarang',
        title: 'Asisten Laboratorium',
        org: 'Nama laboratorium / organisasi',
        points: ['Tulis tugas atau pencapaianmu di sini.'],
      },
    ],
  },
  {
    key: 'focus',
    label: 'Fokus',
    description: 'Kartu bidang yang kamu tekuni.',
    title: 'Fokus',
    layout: 'cards',
    options: { columns: 3, detail: true },
    page: 'home',
    schema: [f('title', 'Judul', 'text', 'title', true), f('desc', 'Deskripsi', 'textarea', 'body')],
    items: [
      { title: 'Sistem Informasi', desc: 'Analisis dan perancangan sistem, serta pengembangan aplikasi web.' },
      { title: 'Data & Business Intelligence', desc: 'Memakai data untuk mendukung keputusan bisnis.' },
      { title: 'Optimasi & Keputusan', desc: 'Metode keputusan multikriteria dan pendekatan optimasi.' },
    ],
  },
  {
    key: 'toolbox',
    label: 'Toolbox',
    description: 'Skill dan tools, dikelompokkan dalam chip.',
    title: 'Toolbox',
    layout: 'chips',
    options: { columns: 4, detail: false },
    page: 'home',
    schema: [f('group', 'Nama grup', 'text', 'title', true), f('items', 'Tools', 'tags', 'tags')],
    items: [
      { group: 'Data & Backend', items: ['Python', 'Django', 'PostgreSQL'] },
      { group: 'Frontend & Visual', items: ['Next.js', 'React', 'Figma'] },
    ],
  },
  {
    key: 'achievements',
    label: 'Achievement',
    description: 'Penghargaan, juara lomba, sertifikat.',
    title: 'Achievement',
    layout: 'list',
    options: { detail: true },
    page: 'home',
    schema: [
      f('title', 'Judul', 'text', 'title', true),
      f('issuer', 'Penyelenggara', 'text', 'subtitle'),
      f('year', 'Tahun', 'text', 'meta'),
      f('description', 'Deskripsi singkat', 'textarea', 'body'),
      f('url', 'Link bukti / sertifikat', 'url', 'link'),
    ],
    items: [],
  },
  {
    key: 'story',
    label: 'Cerita (halaman About)',
    description: 'Teks panjang, tampil di halaman /about.',
    title: 'Tentang saya',
    layout: 'text',
    options: { detail: false },
    page: 'about',
    schema: [f('heading', 'Judul bagian', 'text', 'title'), f('body', 'Isi cerita (boleh Markdown)', 'textarea', 'body')],
    items: [{ heading: 'Siapa saya', body: 'Ceritakan tentang dirimu di sini.' }],
  },
  {
    key: 'blank',
    label: 'Kosong (susun sendiri)',
    description: 'Mulai dari judul + deskripsi, lalu tambah field dan pilih layout sesukamu.',
    title: 'Section baru',
    layout: 'cards',
    options: { columns: 3, detail: true },
    page: 'home',
    schema: [f('title', 'Judul', 'text', 'title', true), f('desc', 'Deskripsi', 'textarea', 'body')],
    items: [],
  },
]
