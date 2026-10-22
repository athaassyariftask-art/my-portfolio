'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { normalize, type Block } from '@/lib/blocks'
import type { Page } from '@/lib/pages'
import NotionEditor from '@/components/notion/NotionEditor'
import { btnPrimary, input, label, readError } from './ui'

export default function PageEditor({ page }: { page: Page }) {
  const router = useRouter()
  const [title, setTitle] = useState(page.title)
  const [published, setPublished] = useState(page.is_published)
  const [blocks, setBlocks] = useState<Block[]>(() => normalize(page.blocks))
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function save() {
    setSaving(true)
    setMsg(null)
    const res = await fetch(`/api/admin/pages/${page.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), is_published: published, blocks }),
    })
    setMsg(res.ok ? { ok: true, text: 'Tersimpan.' } : { ok: false, text: await readError(res) })
    setSaving(false)
    if (res.ok) router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <label className={label}>Judul</label>
          <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 pb-3 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4" />
          Terbitkan
        </label>
      </div>
      <p className="font-mono text-xs text-slate-400">Alamat: /p/{page.slug}</p>

      <NotionEditor blocks={blocks} onChange={setBlocks} onBusy={setUploading} />

      {msg && <p className={`rounded-xl p-3 text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{msg.text}</p>}
      <div className="flex items-center gap-4">
        <button type="button" disabled={saving || uploading} onClick={save} className={btnPrimary}>
          {uploading ? 'Mengunggah…' : saving ? 'Menyimpan…' : 'Simpan'}
        </button>
        <Link href="/admin/pages" className="text-sm text-slate-500 hover:text-slate-900">← Daftar halaman</Link>
        {published && <Link href={`/p/${page.slug}`} target="_blank" className="text-sm text-blue-600 hover:underline">Lihat ↗</Link>}
      </div>
    </div>
  )
}
