'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MAX_CV_MB, uploadPdf } from '@/lib/upload'
import { btnGhost, label, readError } from './ui'

/** Upload / hapus CV (PDF) untuk tombol "Unduh CV". Langsung tersimpan begitu file dipilih. */
export default function CvUpload({ cv }: { cv: string }) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function upload(file: File) {
    if (file.size > MAX_CV_MB * 1024 * 1024) return setError(`Ukuran maksimal ${MAX_CV_MB} MB.`)
    setBusy(true)
    setError('')
    try {
      const url = await uploadPdf(file)
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv: url }),
      })
      if (!res.ok) setError(await readError(res))
      else router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload gagal.')
    }
    setBusy(false)
    if (input.current) input.current.value = ''
  }

  async function remove() {
    if (!confirm('Hapus CV? Tombol "Unduh CV" akan hilang dari website.')) return
    setBusy(true)
    setError('')
    const res = await fetch('/api/admin/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cv: '' }),
    })
    if (!res.ok) setError(await readError(res))
    else router.refresh()
    setBusy(false)
  }

  return (
    <div>
      <p className={label}>CV (PDF) untuk tombol "Unduh CV"</p>
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          {cv ? (
            <>Sudah ada: <a href={cv} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 underline">lihat CV</a></>
          ) : (
            'Belum ada. Tombol "Unduh CV" baru tampil setelah kamu upload.'
          )}
        </p>
        <input
          ref={input}
          type="file"
          accept="application/pdf,.pdf"
          disabled={busy}
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          className="block text-sm text-slate-600"
        />
        <p className="text-xs text-slate-400">PDF, maks {MAX_CV_MB} MB. Tersimpan otomatis.</p>
        {cv && <button type="button" disabled={busy} onClick={remove} className={btnGhost}>Hapus CV</button>}
      </div>
      {error && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    </div>
  )
}
