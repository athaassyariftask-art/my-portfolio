'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { readError } from '@/components/admin/ui'

/**
 * Teks pendek yang bisa diedit di tempat oleh admin (mis. judul dan ringkasan project).
 * Pengunjung hanya melihat teks biasa. Tersimpan otomatis saat kursor keluar dari kolom.
 */
export default function InlineText({
  endpoint,
  field,
  initial,
  canEdit,
  className,
  placeholder,
  required,
  as: Tag = 'p',
}: {
  endpoint: string // mis. "projects/3"
  field: string
  initial: string
  canEdit: boolean
  className: string
  placeholder?: string
  required?: boolean
  as?: 'p' | 'h1'
}) {
  const [value, setValue] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [status, setStatus] = useState<'' | 'saving' | 'ok' | 'error'>('')
  const [error, setError] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = el.scrollHeight + 'px'
  }, [value])

  if (!canEdit) return value ? <Tag className={className}>{value}</Tag> : null

  async function save() {
    const v = value.trim()
    if (v === saved) return
    if (required && !v) return setValue(saved) // judul tidak boleh kosong
    setStatus('saving')
    setError('')
    const res = await fetch(`/api/admin/${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: v }),
    })
    if (res.ok) {
      setSaved(v)
      setValue(v)
      setStatus('ok')
    } else {
      setError(await readError(res))
      setStatus('error')
    }
  }

  return (
    <div>
      <textarea
        ref={ref}
        rows={1}
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value.replace(/\n/g, ' '))}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), e.currentTarget.blur())}
        onBlur={save}
        className={`block w-full resize-none overflow-hidden rounded-lg bg-transparent outline-none ring-0 transition-colors hover:bg-white/60 focus:bg-white/80 placeholder:text-slate-300 ${className}`}
      />
      {status !== '' && (
        <p className={`mt-1 font-mono text-xs ${status === 'error' ? 'text-rose-600' : 'text-slate-400'}`}>
          {status === 'saving' ? 'Menyimpan…' : status === 'ok' ? '✓ Tersimpan' : error}
        </p>
      )}
    </div>
  )
}
