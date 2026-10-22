'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { btnPrimary, input, label } from './ui'

export default function LoginForm() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const data = Object.fromEntries(new FormData(e.currentTarget))
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      router.push('/admin')
      router.refresh()
      return
    }
    setError((await res.json().catch(() => ({}))).error ?? 'Gagal login.')
    setBusy(false)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className={label} htmlFor="username">Username</label>
        <input id="username" name="username" autoComplete="username" required className={input} />
      </div>
      <div>
        <label className={label} htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={input} />
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button disabled={busy} className={`${btnPrimary} w-full`}>
        {busy ? 'Masuk…' : 'Masuk'}
      </button>
    </form>
  )
}
