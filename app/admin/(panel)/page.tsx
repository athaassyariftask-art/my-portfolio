import Link from 'next/link'
import { FolderKanban, Layers, Mail, UserRound } from 'lucide-react'
import PageHeader from '@/components/admin/PageHeader'
import { card } from '@/components/admin/ui'
import { apiGet, unwrapList } from '@/lib/api'
import { getProjects } from '@/lib/projects'
import { getAdminSections } from '@/lib/sections'

export default async function AdminHome() {
  const [projects, sections, messages] = await Promise.all([
    getProjects({ auth: true }),
    getAdminSections(),
    apiGet<unknown>('/contact/', { auth: true }).then((d) => unwrapList(d)),
  ])
  const hidden = sections.filter((s) => !s.is_visible).length
  const drafts = projects.filter((p) => !p.published).length

  const tiles = [
    {
      href: '/admin/sections',
      icon: Layers,
      title: 'Section',
      value: sections.length,
      note: hidden ? `${hidden} disembunyikan` : 'Semua tampil',
      hint: 'Susun blok di halaman depan',
    },
    {
      href: '/admin/projects',
      icon: FolderKanban,
      title: 'Project',
      value: projects.length,
      note: drafts ? `${drafts} draft` : 'Semua terbit',
      hint: 'Tambah dan atur project',
    },
    {
      href: '/admin/messages',
      icon: Mail,
      title: 'Pesan',
      value: messages.length,
      note: messages.length ? 'Dari form kontak' : 'Belum ada',
      hint: 'Pesan dari pengunjung',
    },
    {
      href: '/admin/profile',
      icon: UserRound,
      title: 'Profil',
      value: null,
      note: 'Nama, foto, CV, link',
      hint: 'Identitas di halaman depan',
    },
  ]

  return (
    <>
      <PageHeader
        title="Ringkasan"
        hint="Isi section dan halaman detail diedit langsung di website (login lalu klik Edit). Di sini hanya pengaturan struktur."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map(({ href, icon: Icon, title, value, note, hint }) => (
          <Link key={href} href={href} className={`${card} group p-5 transition-colors hover:border-slate-900`}>
            <div className="mb-4 flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white">
                <Icon className="h-4 w-4" />
              </span>
              {value !== null && <span className="text-3xl font-bold text-slate-900">{value}</span>}
            </div>
            <p className="font-semibold text-slate-900">{title}</p>
            <p className="text-sm text-slate-500">{hint}</p>
            <p className="mt-2 text-xs text-slate-400">{note}</p>
          </Link>
        ))}
      </div>
    </>
  )
}
