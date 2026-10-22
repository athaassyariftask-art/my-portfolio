'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Site } from '@/lib/profile'
import type { Item, Field } from './ItemsEditor'
import ItemsEditor, { findMissing } from './ItemsEditor'
import { btnPrimary, input, label, readError } from './ui'

const LINK_FIELDS: Field[] = [
  { name: 'label', label: 'Nama', type: 'text', required: true, placeholder: 'GitHub' },
  { name: 'href', label: 'URL', type: 'url', required: true, placeholder: 'https://github.com/…' },
]

export default function ProfileForm({ initial }: { initial: Site }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const links = useRef<Item[]>(initial.links)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setSaved(false)

    const raw = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
    const body: Record<string, unknown> = {
      name: raw.name,
      role: raw.role,
      affiliation: raw.affiliation,
      email: raw.email,
      intro: raw.intro,
    }
    const missing = findMissing(LINK_FIELDS, links.current, 'Link')
    if (missing) {
      setError(missing)
      setBusy(false)
      return
    }
    body.links = links.current

    const res = await fetch('/api/admin/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) setError(await readError(res))
    else {
      setSaved(true)
      router.refresh()
    }
    setBusy(false)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className={label} htmlFor="name">Nama</label>
          <input id="name" name="name" defaultValue={initial.name} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="email">Email</label>
          <input id="email" name="email" type="email" defaultValue={initial.email} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="role">Role</label>
          <input id="role" name="role" defaultValue={initial.role} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="affiliation">Afiliasi</label>
          <input id="affiliation" name="affiliation" defaultValue={initial.affiliation} className={input} />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="intro">Intro singkat</label>
        <textarea id="intro" name="intro" rows={4} defaultValue={initial.intro} className={input} />
      </div>

      <div>
        <p className={label}>Link sosial</p>
        <ItemsEditor
          fields={LINK_FIELDS}
          initial={initial.links}
          onChange={(v) => (links.current = v)}
          itemLabel="Link"
          itemTitle={(i) => String(i.label ?? '')}
        />
      </div>

      {error && <p className="whitespace-pre-line rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      {saved && <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">Tersimpan. Website sudah memakai data terbaru.</p>}

      <button disabled={busy} className={btnPrimary}>
        {busy ? 'Menyimpan…' : 'Simpan profil'}
      </button>
    </form>
  )
}
