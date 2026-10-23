'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MAX_CV_MB, uploadPdf } from '@/lib/upload'
import { btnGhost, label, readError } from './ui'

/** Upload / delete the CV (PDF) for the "Download CV" button. Saved immediately once a file is chosen. */
export default function CvUpload({ cv }: { cv: string }) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function upload(file: File) {
    if (file.size > MAX_CV_MB * 1024 * 1024) return setError(`Maximum size is ${MAX_CV_MB} MB.`)
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
      setError(e instanceof Error ? e.message : 'Upload failed.')
    }
    setBusy(false)
    if (input.current) input.current.value = ''
  }

  async function remove() {
    if (!confirm('Delete the CV? The "Download CV" button will disappear from the website.')) return
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
      <p className={label}>CV (PDF) for the "Download CV" button</p>
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          {cv ? (
            <>Uploaded: <a href={cv} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 underline">view CV</a></>
          ) : (
            'None yet. The "Download CV" button only appears once you upload one.'
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
        <p className="text-xs text-slate-400">PDF, max {MAX_CV_MB} MB. Saved automatically.</p>
        {cv && <button type="button" disabled={busy} onClick={remove} className={btnGhost}>Delete CV</button>}
      </div>
      {error && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    </div>
  )
}
