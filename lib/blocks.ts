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
  colWidths?: number[] // columns: each column's width as a % of the row, same length as cols, sums to ~100
  url?: string // image, embed, video
  urls?: string[] // gallery
  caption?: string // image
  size?: BlockSize // image, video, embed: how wide it is shown (default full)
  align?: Align // text, h1, h2, h3, quote, callout: paragraph alignment
  level?: 2 | 3 // legacy heading
}

export type BlockSize = 'sm' | 'md' | 'lg' | 'full'
/** Width of an image/video/embed as a share of the text column */
export const SIZE_PCT: Record<BlockSize, number> = { sm: 45, md: 65, lg: 85, full: 100 }
export const SIZE_LABEL: Record<BlockSize, string> = { sm: 'S', md: 'M', lg: 'L', full: 'Full' }
export const sizeStyle = (s?: BlockSize) => ({ width: '100%', maxWidth: `${SIZE_PCT[s ?? 'full'] ?? 100}%`, marginInline: 'auto' as const })

export type Align = 'left' | 'center' | 'right'
export const ALIGN_LABEL: Record<Align, string> = { left: 'Left', center: 'Center', right: 'Right' }
/** Block types whose Field can be aligned (list/code/toggle keep a fixed layout, so they're left out). */
export const ALIGNABLE: BlockType[] = ['text', 'h1', 'h2', 'h3', 'quote', 'callout']

export const MIN_COLS = 2
export const MAX_COLS = 4
/** Even width (%) for `n` columns, used whenever a column count changes and widths need to be reset. */
export const evenWidths = (n: number): number[] => Array.from({ length: n }, () => 100 / Math.max(n, 1))
/** A column's width in %, falling back to an even split if the block predates `colWidths` or the count changed. */
export const colWidth = (b: Block, i: number): number => {
  const n = b.cols?.length ?? 1
  return b.colWidths?.length === n ? b.colWidths[i] : 100 / n
}

/** Patch to add one more column (up to MAX_COLS), widths reset to an even split. */
export function addColumn(b: Block): Partial<Block> {
  const cols = [...(b.cols ?? []), [makeBlock('text')]]
  if (cols.length > MAX_COLS) return {}
  return { cols, colWidths: evenWidths(cols.length) }
}

/** Patch to remove column `i` (stops at MIN_COLS), widths reset to an even split. */
export function removeColumn(b: Block, i: number): Partial<Block> {
  const cur = b.cols ?? []
  if (cur.length <= MIN_COLS) return {}
  const cols = cur.filter((_, j) => j !== i)
  return { cols, colWidths: evenWidths(cols.length) }
}

/**
 * Patch to resize the border between columns `i` and `i+1` by `deltaPct` (a share of the row, positive = grabbed
 * width moves from column i+1 into column i). Each column is kept at least 10% so none can be dragged to nothing.
 */
export function resizeColumns(b: Block, i: number, deltaPct: number): Partial<Block> {
  const n = b.cols?.length ?? 0
  if (n < 2 || i < 0 || i >= n - 1) return {}
  const widths = [...Array.from({ length: n }, (_, k) => colWidth(b, k))]
  const min = 10
  const d = Math.max(min - widths[i], Math.min(widths[i + 1] - min, deltaPct))
  widths[i] += d
  widths[i + 1] -= d
  return { colWidths: widths }
}

export const uid = () => Math.random().toString(36).slice(2, 10)

export const TEXTUAL: BlockType[] = ['text', 'h1', 'h2', 'h3', 'bullet', 'number', 'todo', 'toggle', 'quote', 'callout', 'code']
export const isTextual = (t: BlockType) => TEXTUAL.includes(t)

export function makeBlock(type: BlockType, id: string = uid()): Block {
  switch (type) {
    case 'columns':
      return { id, type, cols: [[makeBlock('text')], [makeBlock('text')]], colWidths: evenWidths(2) }
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

// ---- inline formatting ("marks") -------------------------------------------------------------
// Text is still one plain markdown string per block (see Block.text above) — a mark is just markdown
// (or, for underline/highlight/color, a small fixed set of HTML tags the renderer allows; see
// lib/markdownSchema.ts) wrapped around the selected range. There is no separate rich-text data model,
// which keeps every other block-editing operation (split on Enter, merge on Backspace, "/" shortcuts, …)
// working exactly as it does today, unchanged.
export type MarkKey = 'bold' | 'italic' | 'underline' | 'highlight' | 'red' | 'green' | 'purple'
export const MARKS: Record<MarkKey, { label: string; prefix: string; suffix: string; swatch?: string }> = {
  bold: { label: 'Bold', prefix: '**', suffix: '**' },
  italic: { label: 'Italic', prefix: '_', suffix: '_' },
  underline: { label: 'Underline', prefix: '<u>', suffix: '</u>' },
  highlight: { label: 'Highlight', prefix: '<mark>', suffix: '</mark>' },
  red: { label: 'Red', prefix: '<span class="clr-red">', suffix: '</span>', swatch: 'var(--clr-red)' },
  green: { label: 'Green', prefix: '<span class="clr-green">', suffix: '</span>', swatch: 'var(--clr-green)' },
  purple: { label: 'Purple', prefix: '<span class="clr-purple">', suffix: '</span>', swatch: 'var(--clr-purple)' },
}

/**
 * Wrap (or, if the selection is already wrapped in exactly this mark, unwrap) the selected range of `text`
 * with `prefix`/`suffix`. With nothing selected, an empty pair is inserted and the cursor parked between
 * the two halves, ready to type. Returns the new text plus where the selection should land afterwards.
 */
export function applyMark(
  text: string,
  start: number,
  end: number,
  prefix: string,
  suffix: string,
): { text: string; start: number; end: number } {
  if (start === end) {
    const next = text.slice(0, start) + prefix + suffix + text.slice(start)
    return { text: next, start: start + prefix.length, end: start + prefix.length }
  }
  const before = text.slice(0, start)
  const sel = text.slice(start, end)
  const after = text.slice(end)
  if (before.endsWith(prefix) && after.startsWith(suffix)) {
    const next = before.slice(0, before.length - prefix.length) + sel + after.slice(suffix.length)
    return { text: next, start: start - prefix.length, end: end - prefix.length }
  }
  const next = before + prefix + sel + suffix + after
  return { text: next, start: start + prefix.length, end: end + prefix.length }
}
