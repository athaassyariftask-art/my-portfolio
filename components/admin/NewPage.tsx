'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { btnPrimary, input, readError } from './ui'

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)

export default function NewPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function create() {
    const slug = slugify(title)
    if (!slug) return setError('Enter a title first.')
    setBusy(true)
    setError('')
    const res = await fetch('/api/admin/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), slug, blocks: [], is_published: false }),
    })
    if (!res.ok) {
      setError(await readError(res))
      setBusy(false)
      return
    }
    router.push(`/admin/pages/${slug}`)
  }

  return (
    <div className="flex flex-wrap items-start gap-3">
      <input
        className={`${input} max-w-sm`}
        placeholder="New page title, e.g. Community service documentation"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && create()}
      />
      <button type="button" disabled={busy} onClick={create} className={btnPrimary}>+ Create page</button>
      {error && <p className="w-full rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    </div>
  )
}
