import Link from 'next/link'
import { isAdmin } from '@/lib/details'

/** Tombol kecil di pojok halaman publik, hanya terlihat kalau sedang login admin. */
export default async function AdminButton() {
  if (!(await isAdmin())) return null
  return (
    <Link
      href="/admin"
      className="fixed bottom-5 right-5 z-50 rounded-full bg-slate-900 px-4 py-2 font-mono text-xs uppercase tracking-widest text-white shadow-lg transition-colors hover:bg-blue-600"
    >
      Admin
    </Link>
  )
}
