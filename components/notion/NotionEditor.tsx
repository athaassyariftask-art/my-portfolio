'use client'

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { embedSrc } from '@/components/Blocks'
import {
  cloneDeep, findIn, fixCols, insertAfterIn, isTextual, makeBlock, MENU, moveIn, relocate, removeIn, updateIn,
  type Block, type BlockType,
} from '@/lib/blocks'
import { MAX_VIDEO_MB, uploadImage, uploadVideo } from '@/lib/upload'
import { BODY, CALLOUT, CODE, H1, H2, H3, QUOTE } from './style'

/* eslint-disable @next/next/no-img-element */

// ---------------------------------------------------------------- konteks operasi
type Ops = {
  get: (id: string) => Block | null
  patch: (id: string, p: Partial<Block>) => void
  insertAfter: (id: string, b: Block) => void
  remove: (id: string) => void
  move: (id: string, d: -1 | 1) => void
  turn: (id: string, t: BlockType) => void // ubah jenis, teks dipertahankan
  replace: (id: string, t: BlockType) => void // ganti jadi blok baru kosong
  duplicate: (id: string) => void
  relocate: (drag: string, target: string) => void
  focus: (id: string, pos?: number | 'end') => void
  neighbor: (id: string, dir: -1 | 1) => string | null
  busy: (v: boolean) => void
  drag: { current: string | null }
}
const Ctx = createContext<Ops>(null as unknown as Ops)
const useOps = () => useContext(Ctx)

// ---------------------------------------------------------------- pintasan markdown
function shortcut(v: string): { type: BlockType; text: string; checked?: boolean } | null {
  let m: RegExpMatchArray | null
  if ((m = v.match(/^(#{1,3}) ([\s\S]*)$/))) return { type: (['h1', 'h2', 'h3'] as const)[m[1].length - 1], text: m[2] }
  if ((m = v.match(/^[-*+] ([\s\S]*)$/))) return { type: 'bullet', text: m[1] }
  if ((m = v.match(/^1[.)] ([\s\S]*)$/))) return { type: 'number', text: m[1] }
  if ((m = v.match(/^\[( |x)?\] ([\s\S]*)$/))) return { type: 'todo', text: m[2], checked: m[1] === 'x' }
  if ((m = v.match(/^> ([\s\S]*)$/))) return { type: 'quote', text: m[1] }
  if (v === '```') return { type: 'code', text: '' }
  if (v === '---') return { type: 'divider', text: '' }
  return null
}

// ---------------------------------------------------------------- menu (dipakai "/" dan ⋮⋮)
type Item = { key: string; label: string; hint?: string; danger?: boolean; head?: boolean; run: () => void }

function MenuList({ items, sel }: { items: Item[]; sel?: number }) {
  return (
    <div
      className="absolute left-0 top-full z-30 mt-1 max-h-80 w-60 overflow-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl"
      onMouseDown={(e) => e.preventDefault()} // jangan mencuri fokus dari textarea
    >
      {items.map((it, i) =>
        it.head ? (
          <p key={it.key} className="px-3 pb-1 pt-2 font-mono text-[10px] uppercase tracking-widest text-slate-400">{it.label}</p>
        ) : (
          <button
            key={it.key}
            type="button"
            onClick={it.run}
            className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-1.5 text-left text-sm ${
              i === sel ? 'bg-slate-100' : 'hover:bg-slate-50'
            } ${it.danger ? 'text-rose-600' : 'text-slate-700'}`}
          >
            <span className="font-medium">{it.label}</span>
            {it.hint && <span className="truncate font-mono text-[10px] text-slate-400">{it.hint}</span>}
          </button>
        ),
      )}
    </div>
  )
}

function useOutside(active: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!active) return
    const down = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && close()
    const key = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('mousedown', down)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', down)
      document.removeEventListener('keydown', key)
    }
  })
  return ref
}

// ---------------------------------------------------------------- kolom teks otomatis tinggi
function Field({ b, className, placeholder }: { b: Block; className: string; placeholder?: string }) {
  const ops = useOps()
  const ref = useRef<HTMLTextAreaElement>(null)
  const [sel, setSel] = useState(0)
  const [closedAt, setClosedAt] = useState<string | null>(null)
  const text = b.text ?? ''
  const isCode = b.type === 'code'

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = el.scrollHeight + 'px'
  }, [text])

  // menu "/" hanya di blok teks biasa, selama isinya satu baris diawali "/"
  const query = b.type === 'text' && text.startsWith('/') && !text.includes('\n') && closedAt !== text ? text.slice(1).toLowerCase() : null
  const matches = query === null ? [] : MENU.filter((m) => !query || (m.keys + ' ' + m.label.toLowerCase()).includes(query))
  const open = matches.length > 0

  const pick = (type: BlockType) => {
    ops.replace(b.id, type)
    if (type === 'divider') ops.insertAfter(b.id, makeBlock('text'))
  }

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value
    setSel(0)
    if (b.type === 'text') {
      const s = shortcut(v)
      if (s) {
        ops.patch(b.id, { type: s.type, text: s.text, ...(s.type === 'todo' ? { checked: !!s.checked } : {}) })
        if (s.type === 'divider') ops.insertAfter(b.id, makeBlock('text'))
        else ops.focus(b.id, 'end')
        return
      }
    }
    ops.patch(b.id, { text: v })
  }

  async function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const img = Array.from(e.clipboardData.files).find((f) => f.type.startsWith('image/'))
    if (!img) return
    e.preventDefault()
    ops.busy(true)
    try {
      const url = await uploadImage(img)
      ops.insertAfter(b.id, { ...makeBlock('image'), url })
    } catch { /* abaikan; pengguna bisa upload lewat blok Foto */ }
    ops.busy(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget
    if (open) {
      if (e.key === 'ArrowDown') { e.preventDefault(); return setSel((sel + 1) % matches.length) }
      if (e.key === 'ArrowUp') { e.preventDefault(); return setSel((sel - 1 + matches.length) % matches.length) }
      if (e.key === 'Enter') { e.preventDefault(); return pick(matches[Math.min(sel, matches.length - 1)].type) }
      if (e.key === 'Escape') { e.preventDefault(); return setClosedAt(text) }
    }
    const atStart = el.selectionStart === 0 && el.selectionEnd === 0
    const atEnd = el.selectionStart === text.length && el.selectionEnd === text.length

    if (e.key === 'Enter' && !e.shiftKey && !isCode) {
      e.preventDefault()
      const isList = b.type === 'bullet' || b.type === 'number' || b.type === 'todo'
      if (isList && text === '') return ops.patch(b.id, { type: 'text' }) // Enter di item kosong = keluar dari daftar
      const pos = el.selectionStart
      ops.patch(b.id, { text: text.slice(0, pos) })
      ops.insertAfter(b.id, { ...makeBlock(isList ? b.type : 'text'), text: text.slice(el.selectionEnd) })
      return
    }
    if (e.key === 'Backspace' && atStart) {
      if (b.type !== 'text') {
        e.preventDefault()
        return ops.patch(b.id, { type: 'text', checked: undefined, children: undefined })
      }
      const prevId = ops.neighbor(b.id, -1)
      const prev = prevId ? ops.get(prevId) : null
      if (!prev) return
      e.preventDefault()
      if (text === '') {
        ops.remove(b.id)
        return ops.focus(prev.id, 'end')
      }
      if (isTextual(prev.type) && prev.type !== 'code' && prev.type !== 'toggle') {
        const len = (prev.text ?? '').length
        ops.patch(prev.id, { text: (prev.text ?? '') + text })
        ops.remove(b.id)
        ops.focus(prev.id, len)
      }
      return
    }
    if (e.key === 'ArrowUp' && atStart && !e.shiftKey) {
      const id = ops.neighbor(b.id, -1)
      if (id) { e.preventDefault(); ops.focus(id, 'end') }
    }
    if (e.key === 'ArrowDown' && atEnd && !e.shiftKey) {
      const id = ops.neighbor(b.id, 1)
      if (id) { e.preventDefault(); ops.focus(id, 0) }
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={ref}
        data-bid={b.id}
        rows={1}
        value={text}
        spellCheck={false}
        placeholder={placeholder}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        className={`block w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-transparent focus:placeholder:text-slate-300 ${className}`}
      />
      {open && (
        <MenuList
          sel={Math.min(sel, matches.length - 1)}
          items={matches.map((m) => ({ key: m.type, label: m.label, hint: m.hint, run: () => pick(m.type) }))}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------- isi tiap jenis blok
function Gallery({ b }: { b: Block }) {
  const ops = useOps()
  const input = useRef<HTMLInputElement>(null)
  const [err, setErr] = useState('')
  async function add(files: FileList | null) {
    if (!files?.length) return
    ops.busy(true)
    setErr('')
    try {
      const urls = [...(ops.get(b.id)?.urls ?? [])]
      for (const f of Array.from(files)) urls.push(await uploadImage(f))
      ops.patch(b.id, { urls })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload gagal.')
    }
    ops.busy(false)
    if (input.current) input.current.value = ''
  }
  const urls = b.urls ?? []
  return (
    <div className="my-2 rounded-2xl border border-dashed border-slate-300 p-3">
      <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
        {urls.map((u, i) => (
          <div key={u + i} className="relative">
            <img src={u} alt="" className="aspect-square w-full rounded-lg object-cover" />
            <button type="button" onClick={() => ops.patch(b.id, { urls: urls.filter((_, j) => j !== i) })} className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full bg-rose-600 text-xs text-white">×</button>
          </div>
        ))}
        <button type="button" onClick={() => input.current?.click()} className="flex aspect-square items-center justify-center rounded-lg border border-slate-300 text-sm text-slate-500 hover:border-slate-900 hover:text-slate-900">+ Foto</button>
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} />
      {err && <p className="mt-2 text-sm text-rose-600">{err}</p>}
    </div>
  )
}

function ImageBody({ b }: { b: Block }) {
  const ops = useOps()
  const input = useRef<HTMLInputElement>(null)
  const [err, setErr] = useState('')
  async function pick(files: FileList | null) {
    const f = files?.[0]
    if (!f) return
    ops.busy(true)
    setErr('')
    try {
      ops.patch(b.id, { url: await uploadImage(f) })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload gagal.')
    }
    ops.busy(false)
    if (input.current) input.current.value = ''
  }
  return (
    <div className="my-2">
      {b.url ? (
        <figure>
          <div className="group/img relative">
            <img src={b.url} alt={b.caption ?? ''} className="w-full rounded-2xl border border-slate-200" />
            <button type="button" onClick={() => input.current?.click()} className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 opacity-0 shadow transition-opacity group-hover/img:opacity-100">Ganti foto</button>
          </div>
          <input
            value={b.caption ?? ''}
            onChange={(e) => ops.patch(b.id, { caption: e.target.value })}
            placeholder="Tambahkan keterangan…"
            className="mt-2 w-full bg-transparent text-center font-mono text-xs text-slate-500 outline-none placeholder:text-transparent focus:placeholder:text-slate-300"
          />
        </figure>
      ) : (
        <button type="button" onClick={() => input.current?.click()} className="flex w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 py-10 text-sm text-slate-500 transition-colors hover:border-blue-600 hover:text-blue-600">
          Klik untuk upload foto
        </button>
      )}
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files)} />
      {err && <p className="mt-2 text-sm text-rose-600">{err}</p>}
    </div>
  )
}

function VideoBody({ b }: { b: Block }) {
  const ops = useOps()
  const input = useRef<HTMLInputElement>(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  async function pick(files: FileList | null) {
    const f = files?.[0]
    if (!f) return
    ops.busy(true)
    setLoading(true)
    setErr('')
    try {
      ops.patch(b.id, { url: await uploadVideo(f) })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload gagal.')
    }
    setLoading(false)
    ops.busy(false)
    if (input.current) input.current.value = ''
  }
  return (
    <div className="my-2">
      {b.url ? (
        <figure>
          <div className="group/img relative">
            <video src={b.url} controls preload="metadata" className="w-full rounded-2xl border border-slate-200 bg-black" />
            <button type="button" onClick={() => input.current?.click()} className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 opacity-0 shadow transition-opacity group-hover/img:opacity-100">Ganti video</button>
          </div>
          <input
            value={b.caption ?? ''}
            onChange={(e) => ops.patch(b.id, { caption: e.target.value })}
            placeholder="Tambahkan keterangan…"
            className="mt-2 w-full bg-transparent text-center font-mono text-xs text-slate-500 outline-none placeholder:text-transparent focus:placeholder:text-slate-300"
          />
        </figure>
      ) : (
        <button type="button" disabled={loading} onClick={() => input.current?.click()} className="flex w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 py-10 text-sm text-slate-500 transition-colors hover:border-blue-600 hover:text-blue-600 disabled:opacity-60">
          {loading ? 'Mengunggah video…' : `Klik untuk upload video (MP4 / WebM / MOV, maks ${MAX_VIDEO_MB} MB)`}
        </button>
      )}
      <input ref={input} type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v" hidden onChange={(e) => pick(e.target.files)} />
      {err && <p className="mt-2 text-sm text-rose-600">{err}</p>}
    </div>
  )
}

function Embed({ b }: { b: Block }) {
  const ops = useOps()
  const src = embedSrc(b.url)
  return (
    <div className="my-2 space-y-2">
      <input
        data-bid={b.id}
        value={b.url ?? ''}
        onChange={(e) => ops.patch(b.id, { url: e.target.value })}
        placeholder="Tempel tautan YouTube atau Vimeo (https://…)"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-600"
      />
      {src ? (
        <div className="aspect-video overflow-hidden rounded-2xl border border-slate-200">
          <iframe src={src} className="h-full w-full" allowFullScreen loading="lazy" title="Embed" />
        </div>
      ) : b.url ? (
        <p className="text-sm text-amber-700">Tautan ini belum didukung. Pakai YouTube atau Vimeo (https).</p>
      ) : null}
    </div>
  )
}

function Body({ b, index }: { b: Block; index: number }) {
  const ops = useOps()
  switch (b.type) {
    case 'text':
      return <Field b={b} className={BODY} placeholder="Ketik “/” untuk perintah…" />
    case 'h1':
      return <Field b={b} className={H1} placeholder="Judul 1" />
    case 'h2':
      return <Field b={b} className={H2} placeholder="Judul 2" />
    case 'h3':
      return <Field b={b} className={H3} placeholder="Judul 3" />
    case 'bullet':
      return (
        <div className="flex gap-3">
          <span className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-700" />
          <div className="flex-1"><Field b={b} className={BODY} placeholder="Daftar" /></div>
        </div>
      )
    case 'number':
      return (
        <div className="flex gap-2">
          <span className={`${BODY} w-5 shrink-0 text-right`}>{index}.</span>
          <div className="flex-1"><Field b={b} className={BODY} placeholder="Daftar" /></div>
        </div>
      )
    case 'todo':
      return (
        <div className="flex gap-3">
          <input type="checkbox" checked={!!b.checked} onChange={(e) => ops.patch(b.id, { checked: e.target.checked })} className="mt-[0.45em] h-4 w-4 shrink-0 accent-blue-600" />
          <div className="flex-1"><Field b={b} className={`${BODY} ${b.checked ? 'text-slate-400 line-through' : ''}`} placeholder="To-do" /></div>
        </div>
      )
    case 'toggle': {
      const open = b.open !== false
      return (
        <div>
          <div className="flex gap-2">
            <button type="button" onClick={() => ops.patch(b.id, { open: !open })} className="mt-[0.2em] h-6 w-5 shrink-0 text-slate-500 hover:text-slate-900" aria-label="Buka/tutup">
              {open ? '▾' : '▸'}
            </button>
            <div className="flex-1"><Field b={b} className={`${BODY} font-semibold`} placeholder="Toggle" /></div>
          </div>
          {open && (
            <div className="ml-7 border-l border-slate-200 pl-3">
              {(b.children ?? []).length ? (
                <BlockList list={b.children ?? []} />
              ) : (
                <button type="button" onClick={() => { const t = makeBlock('text'); ops.patch(b.id, { children: [t] }); ops.focus(t.id, 0) }} className="py-1 text-sm text-slate-400 hover:text-slate-700">+ Isi di dalam toggle</button>
              )}
            </div>
          )}
        </div>
      )
    }
    case 'quote':
      return <div className={QUOTE}><Field b={b} className="italic" placeholder="Kutipan" /></div>
    case 'callout':
      return <div className={CALLOUT}><Field b={b} className="" placeholder="Catatan penting" /></div>
    case 'code':
      return <div className={CODE}><Field b={b} className="font-mono text-sm" placeholder="Kode" /></div>
    case 'divider':
      return <hr className="my-4 border-slate-300" />
    case 'image':
      return <ImageBody b={b} />
    case 'gallery':
      return <Gallery b={b} />
    case 'video':
      return <VideoBody b={b} />
    case 'embed':
      return <Embed b={b} />
    case 'columns': {
      const cols = b.cols ?? []
      return (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.max(cols.length, 1)}, minmax(0, 1fr))` }}>
          {cols.map((c, i) => (
            <div key={i} className="min-w-0 rounded-xl border border-dashed border-slate-200 p-2"><BlockList list={c} /></div>
          ))}
        </div>
      )
    }
    default:
      return null
  }
}

// ---------------------------------------------------------------- satu baris blok (gagang + isi)
function Row({ b, index }: { b: Block; index: number }) {
  const ops = useOps()
  const [menu, setMenu] = useState(false)
  const [adding, setAdding] = useState(false)
  const [over, setOver] = useState(false)
  const ref = useOutside(menu || adding, () => { setMenu(false); setAdding(false) })

  const close = (fn: () => void) => () => { setMenu(false); fn() }
  const insertItems: Item[] = MENU.map((m) => ({
    key: 'i-' + m.type,
    label: m.label,
    hint: m.hint,
    run: () => {
      setAdding(false)
      const nb = makeBlock(m.type)
      ops.insertAfter(b.id, nb)
      if (m.type === 'divider') ops.insertAfter(nb.id, makeBlock('text'))
    },
  }))
  const items: Item[] = []
  if (isTextual(b.type)) {
    items.push({ key: 'h-turn', label: 'Ubah jadi', head: true, run: () => {} })
    for (const m of MENU.filter((x) => x.turn)) {
      items.push({ key: 't-' + m.type, label: m.label + (m.type === b.type ? '  ✓' : ''), hint: m.hint, run: close(() => ops.turn(b.id, m.type)) })
    }
    items.push({ key: 'h-act', label: 'Aksi', head: true, run: () => {} })
  }
  items.push(
    { key: 'dup', label: 'Duplikat', run: close(() => ops.duplicate(b.id)) },
    { key: 'up', label: 'Pindah ke atas', run: close(() => ops.move(b.id, -1)) },
    { key: 'down', label: 'Pindah ke bawah', run: close(() => ops.move(b.id, 1)) },
    { key: 'del', label: 'Hapus', danger: true, run: close(() => ops.remove(b.id)) },
  )

  return (
    <div
      className={`group/row relative flex gap-1 rounded-lg py-0.5 ${over ? 'border-t-2 border-blue-500' : 'border-t-2 border-transparent'}`}
      onDragOver={(e) => { if (ops.drag.current) { e.preventDefault(); e.stopPropagation(); setOver(true) } }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault(); e.stopPropagation(); setOver(false)
        if (ops.drag.current) ops.relocate(ops.drag.current, b.id)
        ops.drag.current = null
      }}
    >
      <div ref={ref} className={`relative flex w-11 shrink-0 items-start justify-end gap-0.5 pt-1 transition-opacity focus-within:opacity-100 group-hover/row:opacity-100 ${menu || adding ? 'opacity-100' : 'opacity-40'}`}>
        <button
          type="button"
          title="Tambah blok di bawah (teks, foto, video, kolom, dll)"
          onClick={() => { setMenu(false); setAdding((v) => !v) }}
          className="h-6 w-5 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-800"
        >+</button>
        <button
          type="button"
          title="Seret untuk memindah, klik untuk menu"
          draggable
          onDragStart={(e) => { ops.drag.current = b.id; e.dataTransfer.setData('text/plain', b.id) }}
          onDragEnd={() => { ops.drag.current = null }}
          onClick={() => { setAdding(false); setMenu((v) => !v) }}
          className="h-6 w-5 cursor-grab rounded text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-800"
        >⋮⋮</button>
        {menu && <MenuList items={items} />}
        {adding && <MenuList items={insertItems} />}
      </div>
      <div className="min-w-0 flex-1"><Body b={b} index={index} /></div>
    </div>
  )
}

function BlockList({ list }: { list: Block[] }) {
  let n = 0
  return (
    <div>
      {list.map((b) => {
        n = b.type === 'number' ? n + 1 : 0
        return <Row key={b.id} b={b} index={n} />
      })}
    </div>
  )
}

// ---------------------------------------------------------------- editor
export default function NotionEditor({
  blocks,
  onChange,
  onBusy,
}: {
  blocks: Block[]
  onChange: (b: Block[]) => void
  onBusy?: (v: boolean) => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const latest = useRef(blocks)
  latest.current = blocks
  const pending = useRef<{ id: string; pos: number | 'end' } | null>(null)
  const drag = useRef<string | null>(null)
  const [, setTick] = useState(0) // dipakai supaya permintaan fokus selalu diikuti render

  const commit = (next: Block[]) => {
    latest.current = next
    onChange(next)
  }

  // setelah setiap render: pindahkan fokus/kursor kalau ada permintaan
  useEffect(() => {
    const p = pending.current
    if (!p) return
    pending.current = null
    const el = root.current?.querySelector<HTMLTextAreaElement | HTMLInputElement>(`[data-bid="${p.id}"]`)
    if (!el) return
    el.focus()
    const n = p.pos === 'end' ? el.value.length : p.pos
    try { el.setSelectionRange(n, n) } catch { /* input non-teks */ }
  })

  const ops: Ops = {
    get: (id) => findIn(latest.current, id),
    patch: (id, p) => commit(updateIn(latest.current, id, (b) => ({ ...b, ...p }))),
    insertAfter: (id, nb) => {
      commit(insertAfterIn(latest.current, id, nb))
      pending.current = { id: nb.id, pos: 0 }
    },
    remove: (id) => commit(fixCols(removeIn(latest.current, id))),
    move: (id, d) => commit(moveIn(latest.current, id, d)),
    turn: (id, t) =>
      commit(
        updateIn(latest.current, id, (b) => {
          const nb: Block = { ...b, type: t }
          if (t === 'toggle') { nb.children = b.children ?? []; nb.open = true }
          else delete nb.children
          if (t === 'todo') nb.checked = false
          return nb
        }),
      ),
    replace: (id, t) => {
      commit(updateIn(latest.current, id, () => makeBlock(t, id)))
      pending.current = { id, pos: 0 }
    },
    duplicate: (id) => {
      const b = findIn(latest.current, id)
      if (b) commit(insertAfterIn(latest.current, id, cloneDeep(b)))
    },
    relocate: (d, t) => commit(fixCols(relocate(latest.current, d, t))),
    focus: (id, pos = 0) => {
      pending.current = { id, pos }
      setTick((t) => t + 1)
    },
    neighbor: (id, dir) => {
      const all = Array.from(root.current?.querySelectorAll<HTMLElement>('[data-bid]') ?? [])
      const i = all.findIndex((el) => el.dataset.bid === id)
      return i < 0 ? null : (all[i + dir]?.dataset.bid ?? null)
    },
    busy: (v) => onBusy?.(v),
    drag,
  }

  function appendAtEnd() {
    const last = latest.current[latest.current.length - 1]
    if (last && last.type === 'text' && !(last.text ?? '')) {
      ops.focus(last.id, 0)
      return
    }
    const nb = makeBlock('text')
    pending.current = { id: nb.id, pos: 0 }
    commit([...latest.current, nb])
  }

  return (
    <Ctx.Provider value={ops}>
      <div ref={root} className="text-base">
        <BlockList list={blocks} />
        <div onClick={appendAtEnd} className="min-h-24 cursor-text py-3 text-sm text-slate-300 hover:text-slate-400">
          {blocks.length === 0 ? 'Klik di sini untuk mulai menulis. Ketik “/” untuk memilih jenis blok.' : ''}
        </div>
      </div>
    </Ctx.Provider>
  )
}
