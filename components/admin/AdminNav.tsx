'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ExternalLink, FolderKanban, Layers, LayoutDashboard, Mail, UserRound } from 'lucide-react'
import LogoutButton from './LogoutButton'

const items = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/sections', label: 'Section', icon: Layers },
  { href: '/admin/projects', label: 'Project', icon: FolderKanban },
  { href: '/admin/profile', label: 'Profile', icon: UserRound },
  { href: '/admin/messages', label: 'Messages', icon: Mail },
]

/** Admin sidebar (becomes a top bar on small screens). */
export default function AdminNav({ messages }: { messages: number }) {
  const path = usePathname()
  const active = (href: string, exact?: boolean) => (exact ? path === href : path.startsWith(href))

  return (
    <aside className="border-b border-slate-200 bg-white md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
      <div className="flex items-center justify-between px-5 py-4 md:py-6">
        <Link href="/admin" className="text-base font-bold tracking-tight text-slate-900">Admin</Link>
        <div className="md:hidden"><LogoutButton /></div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible md:pb-0">
        {items.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              active(href, exact) ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {href === '/admin/messages' && messages > 0 && (
              <span className="ml-auto rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">{messages}</span>
            )}
          </Link>
        ))}
      </nav>

      <div className="hidden space-y-1 border-t border-slate-200 p-3 md:block">
        <Link href="/" target="_blank" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
          <ExternalLink className="h-4 w-4" /> View site
        </Link>
        <div className="px-3 py-2 text-sm"><LogoutButton /></div>
      </div>
    </aside>
  )
}
