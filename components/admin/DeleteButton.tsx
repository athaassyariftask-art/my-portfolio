'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { readError } from './ui'

/** Delete an item through the admin proxy, e.g. endpoint="projects/3". redirectTo: page to go to after deletion. */
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
        if (!confirm(`Delete "${name}"? ${warning ?? 'This cannot be undone.'}`)) return
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
      Delete
    </button>
  )
}
