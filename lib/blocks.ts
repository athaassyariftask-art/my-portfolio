// Model blok ala Notion + operasi pohon (blok bisa bersarang: toggle punya children, columns punya cols).
// Tidak ada kode React di sini supaya bisa dipakai server maupun client.

export type BlockType =
  | 'text' | 'h1' | 'h2' | 'h3' | 'bullet' | 'number' | 'todo' | 'toggle' | 'quote' | 'callout' | 'code'
  | 'divider' | 'image' | 'gallery' | 'embed' | 'video' | 'columns'
  | 'heading' // lama (versi sebelumnya), diubah jadi h2/h3 oleh normalize()

export type Block = {
  id: string
  type: BlockType
  text?: string
  checked?: boolean // todo
  open?: boolean // toggle
  children?: Block[] // toggle
  cols?: Block[][] // columns
  url?: string // image, embed, video
  urls?: string[] // gallery
  caption?: string // image
  level?: 2 | 3 // heading lama
}

export const uid = () => Math.random().toString(36).slice(2, 10)

export const TEXTUAL: BlockType[] = ['text', 'h1', 'h2', 'h3', 'bullet', 'number', 'todo', 'toggle', 'quote', 'callout', 'code']
export const isTextual = (t: BlockType) => TEXTUAL.includes(t)

export function makeBlock(type: BlockType, id: string = uid()): Block {
  switch (type) {
    case 'columns':
      return { id, type, cols: [[makeBlock('text')], [makeBlock('text')]] }
    case 'toggle':
      return { id, type, text: '', open: true, children: [] }
    case 'todo':
      return { id, type, text: '', checked: false }
    case 'gallery':
      return { id, type, urls: [] }
    default:
      return { id, type, text: '' }
  }
}

/** Menu "/" dan "Ubah jadi". `turn` = boleh dipakai untuk mengubah blok teks yang sudah ada. */
export const MENU: { type: BlockType; label: string; hint: string; keys: string; turn: boolean }[] = [
  { type: 'text', label: 'Teks', hint: 'Paragraf biasa', keys: 'text teks paragraf', turn: true },
  { type: 'h1', label: 'Judul 1', hint: '# + spasi', keys: 'h1 judul heading besar', turn: true },
  { type: 'h2', label: 'Judul 2', hint: '## + spasi', keys: 'h2 judul heading sedang', turn: true },
  { type: 'h3', label: 'Judul 3', hint: '### + spasi', keys: 'h3 judul heading kecil', turn: true },
  { type: 'bullet', label: 'Daftar poin', hint: '- + spasi', keys: 'bullet list daftar poin', turn: true },
  { type: 'number', label: 'Daftar angka', hint: '1. + spasi', keys: 'number list daftar angka', turn: true },
  { type: 'todo', label: 'To-do', hint: '[] + spasi', keys: 'todo checklist centang', turn: true },
  { type: 'toggle', label: 'Toggle', hint: 'Isi yang bisa dilipat', keys: 'toggle lipat', turn: true },
  { type: 'quote', label: 'Kutipan', hint: '> + spasi', keys: 'quote kutipan', turn: true },
  { type: 'callout', label: 'Callout', hint: 'Kotak catatan', keys: 'callout catatan', turn: true },
  { type: 'code', label: 'Kode', hint: '``` ', keys: 'code kode', turn: true },
  { type: 'divider', label: 'Garis', hint: '---', keys: 'divider garis', turn: false },
  { type: 'image', label: 'Foto', hint: 'Upload gambar', keys: 'image foto gambar', turn: false },
  { type: 'gallery', label: 'Galeri', hint: 'Banyak foto', keys: 'gallery galeri foto', turn: false },
  { type: 'video', label: 'Video (upload)', hint: 'MP4 / WebM, maks 100 MB', keys: 'video upload mp4 film', turn: false },
  { type: 'embed', label: 'Video YouTube', hint: 'Tempel tautan', keys: 'video embed youtube vimeo link', turn: false },
  { type: 'columns', label: '2 kolom', hint: 'Bagi jadi kolom', keys: 'columns kolom 2', turn: false },
]

/** Pastikan tiap blok punya id dan ubah blok format lama. */
export function normalize(blocks: Block[]): Block[] {
  return (Array.isArray(blocks) ? blocks : []).map((b) => {
    const nb: Block = { ...b, id: b.id || uid() }
    if (nb.type === 'heading') nb.type = nb.level === 3 ? 'h3' : 'h2'
    if (nb.children) nb.children = normalize(nb.children)
    if (nb.cols) nb.cols = nb.cols.map(normalize)
    return nb
  })
}

// ---- operasi pohon (immutable) ----
function withKids(b: Block, f: (l: Block[]) => Block[]): Block {
  if (b.children) return { ...b, children: f(b.children) }
  if (b.cols) return { ...b, cols: b.cols.map(f) }
  return b
}

export function findIn(blocks: Block[], id: string): Block | null {
  for (const b of blocks) {
    if (b.id === id) return b
    for (const l of b.children ? [b.children] : (b.cols ?? [])) {
      const f = findIn(l, id)
      if (f) return f
    }
  }
  return null
}

export const updateIn = (blocks: Block[], id: string, fn: (b: Block) => Block): Block[] =>
  blocks.map((b) => (b.id === id ? fn(b) : withKids(b, (l) => updateIn(l, id, fn))))

export const removeIn = (blocks: Block[], id: string): Block[] =>
  blocks.filter((b) => b.id !== id).map((b) => withKids(b, (l) => removeIn(l, id)))

export function insertAfterIn(blocks: Block[], id: string, nb: Block): Block[] {
  const out: Block[] = []
  for (const b of blocks) {
    out.push(b.id === id ? b : withKids(b, (l) => insertAfterIn(l, id, nb)))
    if (b.id === id) out.push(nb)
  }
  return out
}

export function insertBeforeIn(blocks: Block[], id: string, nb: Block): Block[] {
  const out: Block[] = []
  for (const b of blocks) {
    if (b.id === id) out.push(nb)
    out.push(b.id === id ? b : withKids(b, (l) => insertBeforeIn(l, id, nb)))
  }
  return out
}

export function moveIn(blocks: Block[], id: string, dir: -1 | 1): Block[] {
  const i = blocks.findIndex((b) => b.id === id)
  if (i >= 0) {
    const j = i + dir
    if (j < 0 || j >= blocks.length) return blocks
    const n = [...blocks]
    ;[n[i], n[j]] = [n[j], n[i]]
    return n
  }
  return blocks.map((b) => withKids(b, (l) => moveIn(l, id, dir)))
}

/** Pindahkan blok `dragId` ke tepat sebelum `targetId` (tidak boleh ke dalam dirinya sendiri). */
export function relocate(blocks: Block[], dragId: string, targetId: string): Block[] {
  const d = findIn(blocks, dragId)
  if (!d || dragId === targetId || findIn([d], targetId)) return blocks
  return insertBeforeIn(removeIn(blocks, dragId), targetId, d)
}

export function cloneDeep(b: Block): Block {
  return {
    ...b,
    id: uid(),
    children: b.children?.map(cloneDeep),
    cols: b.cols?.map((l) => l.map(cloneDeep)),
  }
}

/** Kolom tidak boleh kosong sama sekali (supaya selalu ada tempat mengetik). */
export function fixCols(blocks: Block[]): Block[] {
  return blocks.map((b) => {
    if (b.cols) return { ...b, cols: b.cols.map((l) => (l.length ? fixCols(l) : [makeBlock('text')])) }
    if (b.children) return { ...b, children: fixCols(b.children) }
    return b
  })
}

/** Teks markdown polos dari satu string (untuk mengisi awal dari deskripsi lama). */
export const textBlock = (text: string): Block => ({ ...makeBlock('text'), text })
