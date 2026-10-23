'use client'

import { useState } from 'react'

const field =
  'w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/45 focus:border-[color:var(--hi)] focus:outline-none'

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
      setMsg(res?.status === 429 ? 'Too many messages. Please try again later.' : 'Your message could not be sent. Please try again.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input name="name" required maxLength={100} placeholder="Name" className={field} />
      <input name="email" type="email" required placeholder="Email" className={field} />
      <textarea name="message" required rows={4} placeholder="Message" className={field} />
      <button
        disabled={state === 'sending'}
        className="rounded-full bg-[color:var(--hi)] px-7 py-3 font-semibold text-[color:var(--ink)] transition-colors hover:bg-white disabled:opacity-50"
      >
        {state === 'sending' ? 'Sending…' : 'Send message'}
      </button>
      {state === 'ok' && <p className="text-sm text-emerald-400">Thanks, your message has been sent.</p>}
      {state === 'error' && <p className="text-sm text-rose-400">{msg}</p>}
    </form>
  )
}
