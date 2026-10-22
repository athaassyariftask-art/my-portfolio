'use client'

import { useState } from 'react'

const field =
  'w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none'

export default function ContactForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setState('sending')
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    }).catch(() => null)

    if (res?.ok) {
      setState('ok')
      form.reset()
    } else {
      setState('error')
      setMsg(res?.status === 429 ? 'Terlalu banyak pesan. Coba lagi nanti.' : 'Pesan gagal terkirim. Coba lagi.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input name="name" required maxLength={100} placeholder="Nama" className={field} />
      <input name="email" type="email" required placeholder="Email" className={field} />
      <textarea name="message" required rows={4} placeholder="Pesan" className={field} />
      <button
        disabled={state === 'sending'}
        className="rounded-full bg-white px-7 py-3 font-semibold text-slate-900 transition-colors hover:bg-blue-500 hover:text-white disabled:opacity-50"
      >
        {state === 'sending' ? 'Mengirim…' : 'Kirim pesan'}
      </button>
      {state === 'ok' && <p className="text-sm text-emerald-400">Terima kasih, pesan terkirim.</p>}
      {state === 'error' && <p className="text-sm text-rose-400">{msg}</p>}
    </form>
  )
}
