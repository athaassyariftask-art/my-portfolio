'use client'

import { useEffect, useRef, useState } from 'react'
import Blocks from '@/components/Blocks'
import NotionEditor from '@/components/notion/NotionEditor'
import { normalize, textBlock, type Block } from '@/lib/blocks'
import { readError } from '@/components/admin/ui'

type Status = 'saved' | 'dirty' | 'saving' | 'error'

/**
 * Isi halaman ala Notion.
 * - Pengunjung: hanya membaca (`fallback` tampil selama blok masih kosong).
 * - Admin yang login: langsung bisa mengetik di halaman. Tersimpan otomatis ±1 detik setelah berhenti mengetik.
 *   `seedMarkdown` = isi lama (mis. deskripsi project) yang dimasukkan sebagai blok teks pertama.
 */
export default function EditableBlocks({
  detailKey,
  initial,
  canEdit,
  fallback,
  seedMarkdown,
}: {
  detailKey: string
  initial: Block[]
  canEdit: boolean
  fallback?: React.ReactNode
  seedMarkdown?: string
}) {
  const [blocks, setBlocks] = useState<Block[]>(() =>
    normalize(initial.length || !seedMarkdown?.trim() ? initial : [textBlock(seedMarkdown)]),
  )
  const [status, setStatus] = useState<Status>('saved')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(false)
  const [uploading, setUploading] = useState(false)
  const latest = useRef(blocks)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saving = useRef(false)
  const dirty = useRef(false)

  async function save() {
    if (saving.current) return // simpan berikutnya dijalankan setelah yang sekarang selesai
    saving.current = true
    setStatus('saving')
    setError('')
    const sent = latest.current
    dirty.current = false
    let ok = false
    try {
      const res = await fetch(`/api/admin/details/${detailKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks: sent }),
      })
      if (res.ok) ok = true
      else setError(await readError(res))
    } catch {
      setError('Tidak bisa menghubungi server.')
    }
    saving.current = false
    if (!ok) {
      dirty.current = true
      setStatus('error')
    } else if (latest.current !== sent) {
      save() // ada ketikan baru selama menyimpan
    } else {
      setStatus('saved')
    }
  }

  function change(next: Block[]) {
    latest.current = next
    setBlocks(next)
    dirty.current = true
    setStatus('dirty')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(save, 1000)
  }

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current || saving.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  if (!canEdit) {
    return initial.length > 0 ? <Blocks blocks={initial} /> : <>{fallback}</>
  }

  const label: Record<Status, string> = {
    saved: '✓ Tersimpan',
    dirty: 'Belum disimpan…',
    saving: 'Menyimpan…',
    error: 'Gagal menyimpan',
  }
  const color = status === 'error' ? 'text-rose-600' : status === 'saved' ? 'text-emerald-600' : 'text-slate-500'

  return (
    <div>
      <div className="sticky top-3 z-20 mb-6 flex items-center justify-between rounded-full border border-slate-200 bg-white/90 px-4 py-2 shadow-sm backdrop-blur">
        <span className={`font-mono text-xs ${color}`}>
          {uploading ? 'Mengunggah foto…' : label[status]}
          {status === 'error' && error && <span className="ml-2 text-rose-600">{error}</span>}
        </span>
        <div className="flex items-center gap-3">
          {status === 'error' && (
            <button type="button" onClick={save} className="font-mono text-xs font-semibold text-blue-600 hover:underline">Coba lagi</button>
          )}
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            className="rounded-full border border-slate-300 px-3 py-1 font-mono text-xs text-slate-700 hover:border-slate-900"
          >
            {preview ? '✎ Edit' : '👁 Pratinjau'}
          </button>
        </div>
      </div>
      {preview ? <Blocks blocks={blocks} /> : <NotionEditor blocks={blocks} onChange={change} onBusy={setUploading} />}
    </div>
  )
}
