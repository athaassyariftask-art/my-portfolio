'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { readError } from './ui'

/** Hapus item lewat proxy admin, mis. endpoint="projects/3". redirectTo: pindah halaman setelah terhapus. */
export default function DeleteButton({
  endpoint,
  name,
  redirectTo,
  warning,
}: {
  endpoint: string
  name: string
  redirectTo?: string
  warning?: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!confirm(`Hapus "${name}"? ${warning ?? 'Tindakan ini tidak bisa dibatalkan.'}`)) return
        setBusy(true)
        const res = await fetch(`/api/admin/${endpoint}`, { method: 'DELETE' })
        if (!res.ok) {
          alert(await readError(res))
          setBusy(false)
          return
        }
        if (redirectTo) router.push(redirectTo)
        router.refresh()
        setBusy(false)
      }}
      className="text-sm font-semibold text-rose-600 hover:underline disabled:opacity-50"
    >
      Hapus
    </button>
  )
}
