import Link from 'next/link'
import DeleteButton from '@/components/admin/DeleteButton'
import PageHeader from '@/components/admin/PageHeader'
import { btnPrimary, card } from '@/components/admin/ui'
import { getProjects } from '@/lib/projects'

export default async function AdminProjects() {
  const projects = await getProjects({ auth: true }) // staff melihat draft juga

  return (
    <>
      <PageHeader title="Project" hint="Judul, ringkasan, dan isi halaman project diedit langsung di halaman project-nya.">
        <Link href="/admin/projects/new" className={btnPrimary}>+ Tambah project</Link>
      </PageHeader>

      {projects.length === 0 ? (
        <p className={`${card} border-dashed p-10 text-center text-slate-500`}>Belum ada project. Klik “Tambah project” untuk mulai.</p>
      ) : (
        <ul className={`${card} divide-y divide-slate-100 overflow-hidden`}>
          {projects.map((p) => (
            <li key={p.id} className="flex items-center gap-4 p-4">
              <div className="h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {p.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{p.title}</p>
                <p className="flex gap-2 text-xs text-slate-500">
                  <span>Urutan {p.order}</span>
                  {!p.published && <span className="font-semibold text-amber-600">Draft</span>}
                  {p.featured && <span className="font-semibold text-blue-600">Featured</span>}
                </p>
              </div>
              <Link href={`/projects/${p.id}`} className="text-sm font-semibold text-blue-600 hover:underline">Buka</Link>
              <Link href={`/admin/projects/${p.id}`} className="text-sm font-semibold text-slate-600 hover:underline">Pengaturan</Link>
              <DeleteButton endpoint={`projects/${p.id}`} name={p.title} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
