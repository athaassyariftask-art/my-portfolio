import Link from 'next/link'
import DeleteButton from '@/components/admin/DeleteButton'
import NewPage from '@/components/admin/NewPage'
import { getAdminPages } from '@/lib/pages'

export default async function AdminPages() {
  const pages = await getAdminPages()
  return (
    <>
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900">Halaman</h1>
      <p className="mb-8 text-slate-500">Halaman bebas ala Notion. Alamatnya <span className="font-mono">/p/nama-halaman</span>.</p>
      <NewPage />
      <ul className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
        {pages.length === 0 && <li className="p-5 text-slate-500">Belum ada halaman.</li>}
        {pages.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-4 p-5">
            <div>
              <Link href={`/admin/pages/${p.slug}`} className="font-semibold text-slate-900 hover:text-blue-600">{p.title}</Link>
              <p className="font-mono text-xs text-slate-400">/p/{p.slug} · {p.is_published ? 'terbit' : 'draft'}</p>
            </div>
            <div className="flex items-center gap-4">
              {p.is_published && <Link href={`/p/${p.slug}`} target="_blank" className="text-sm text-blue-600 hover:underline">Lihat ↗</Link>}
              <DeleteButton endpoint={`pages/${p.slug}`} name={p.title} />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
