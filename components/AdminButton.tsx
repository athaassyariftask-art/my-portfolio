import Link from 'next/link'
import { isAdmin } from '@/lib/details'

/** Small button in the corner of public pages, only visible while signed in as admin. */
export default async function AdminButton() {
  if (!(await isAdmin())) return null
  return (
    <Link
      href="/admin"
      className="fixed bottom-5 right-5 z-50 rounded-full bg-[color:var(--ink)] px-4 py-2 font-mono text-xs uppercase tracking-widest text-white shadow-lg transition-colors hover:bg-[color:var(--accent)]"
    >
      Admin
    </Link>
  )
}
