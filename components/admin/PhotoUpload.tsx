'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MAX_IMAGE_MB, uploadImage } from '@/lib/upload'
import { btnGhost, label, readError } from './ui'

/** Upload / hapus foto profil (muncul di kartu lanyard). Langsung tersimpan begitu file dipilih. */
export default function PhotoUpload({ photo }: { photo: string }) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [broken, setBroken] = useState(false)

  async function upload(file: File) {
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) return setError(`Ukuran maksimal ${MAX_IMAGE_MB} MB.`)
    setBusy(true)
    setError('')
    try {
      const url = await uploadImage(file)
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: url }),
      })
      if (!res.ok) setError(await readError(res))
      else {
        setBroken(false)
        router.refresh()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload gagal.')
    }
    setBusy(false)
    if (input.current) input.current.value = ''
  }

  async function remove() {
    if (!confirm('Hapus foto profil?')) return
    setBusy(true)
    setError('')
    const res = await fetch('/api/admin/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo: '' }),
    })
    if (!res.ok) setError(await readError(res))
    else router.refresh()
    setBusy(false)
  }

  return (
    <div>
      <p className={label}>Foto profil (di kartu lanyard)</p>
      <div className="flex items-center gap-5">
        <div className="flex h-32 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-xs text-slate-400">
          {photo && !broken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={photo} src={photo} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
          ) : (
            'Belum ada'
          )}
        </div>
        <div className="space-y-3">
          <input
            ref={input}
            type="file"
            accept="image/*"
            disabled={busy}
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            className="block text-sm text-slate-600"
          />
          <p className="text-xs text-slate-400">Potret, rasio ±4:5, maks {MAX_IMAGE_MB} MB. Tersimpan otomatis.</p>
          <button type="button" disabled={busy} onClick={remove} className={btnGhost}>Hapus foto</button>
        </div>
      </div>
      {error && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    </div>
  )
}
