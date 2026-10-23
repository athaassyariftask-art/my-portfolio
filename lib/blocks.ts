// Notion-style block model + tree operations (blocks can nest: toggle has children, columns has cols).
// No React code here, so it can be used on both server and client.

export type BlockType =
  | 'text' | 'h1' | 'h2' | 'h3' | 'bullet' | 'number' | 'todo' | 'toggle' | 'quote' | 'callout' | 'code'
  | 'divider' | 'image' | 'gallery' | 'embed' | 'video' | 'columns'
  | 'heading' // legacy (earlier version), converted to h2/h3 by normalize()

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
  level?: 2 | 3 // legacy heading
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

/** The "/" menu and "Turn into". `turn` = may be used to convert an existing text block. */
export const MENU: { type: BlockType; label: string; hint: string; keys: string; turn: boolean }[] = [
  { type: 'text', label: 'Text', hint: 'Plain paragraph', keys: 'text teks paragraf paragraph', turn: true },
  { type: 'h1', label: 'Heading 1', hint: '# + space', keys: 'h1 judul heading besar', turn: true },
  { type: 'h2', label: 'Heading 2', hint: '## + space', keys: 'h2 judul heading sedang', turn: true },
  { type: 'h3', label: 'Heading 3', hint: '### + space', keys: 'h3 judul heading kecil', turn: true },
  { type: 'bullet', label: 'Bulleted list', hint: '- + space', keys: 'bullet list daftar poin', turn: true },
  { type: 'number', label: 'Numbered list', hint: '1. + space', keys: 'number list daftar angka', turn: true },
  { type: 'todo', label: 'To-do', hint: '[] + space', keys: 'todo checklist centang', turn: true },
  { type: 'toggle', label: 'Toggle', hint: 'Collapsible content', keys: 'toggle lipat collapse', turn: true },
  { type: 'quote', label: 'Quote', hint: '> + space', keys: 'quote kutipan', turn: true },
  { type: 'callout', label: 'Callout', hint: 'Note box', keys: 'callout catatan note', turn: true },
  { type: 'code', label: 'Code', hint: '``` ', keys: 'code kode', turn: true },
  { type: 'divider', label: 'Divider', hint: '---', keys: 'divider garis line', turn: false },
  { type: 'image', label: 'Photo', hint: 'Upload an image', keys: 'image foto gambar photo', turn: false },
  { type: 'gallery', label: 'Gallery', hint: 'Multiple photos', keys: 'gallery galeri foto', turn: false },
  { type: 'video', label: 'Video (upload)', hint: 'MP4 / WebM, max 100 MB', keys: 'video upload mp4 film', turn: false },
  { type: 'embed', label: 'YouTube video', hint: 'Paste a link', keys: 'video embed youtube vimeo link', turn: false },
  { type: 'columns', label: '2 columns', hint: 'Split into columns', keys: 'columns kolom 2', turn: false },
]

/** Make sure every block has an id and convert legacy-format blocks. */
export function normalize(blocks: Block[]): Block[] {
  return (Array.isArray(blocks) ? blocks : []).map((b) => {
    const nb: Block = { ...b, id: b.id || uid() }
    if (nb.type === 'heading') nb.type = nb.level === 3 ? 'h3' : 'h2'
    if (nb.children) nb.children = normalize(nb.children)
    if (nb.cols) nb.cols = nb.cols.map(normalize)
    return nb
  })
}

// ---- tree operations (immutable) ----
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

/** Move block `dragId` to just before `targetId` (cannot move into itself). */
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

/** Columns must never be completely empty (so there is always somewhere to type). */
export function fixCols(blocks: Block[]): Block[] {
  return blocks.map((b) => {
    if (b.cols) return { ...b, cols: b.cols.map((l) => (l.length ? fixCols(l) : [makeBlock('text')])) }
    if (b.children) return { ...b, children: fixCols(b.children) }
    return b
  })
}

/** A plain markdown text block from a string (to pre-fill from an old description). */
export const textBlock = (text: string): Block => ({ ...makeBlock('text'), text })
