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
      note: hidden ? `${hidden} hidden` : 'All visible',
      hint: 'Arrange blocks on the home page',
    },
    {
      href: '/admin/projects',
      icon: FolderKanban,
      title: 'Project',
      value: projects.length,
      note: drafts ? `${drafts} draft` : 'All published',
      hint: 'Add and manage projects',
    },
    {
      href: '/admin/messages',
      icon: Mail,
      title: 'Messages',
      value: messages.length,
      note: messages.length ? 'From the contact form' : 'None yet',
      hint: 'Messages from visitors',
    },
    {
      href: '/admin/profile',
      icon: UserRound,
      title: 'Profile',
      value: null,
      note: 'Name, photo, CV, links',
      hint: 'Your identity on the home page',
    },
  ]

  return (
    <>
      <PageHeader
        title="Overview"
        hint="Section content and detail pages are edited directly on the website (sign in, then click Edit). This area only manages structure."
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
