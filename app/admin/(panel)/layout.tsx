import AdminNav from '@/components/admin/AdminNav'
import { apiGet, unwrapList } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'

export const metadata = { title: 'Admin', robots: { index: false, follow: false } }

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin() // not signed in -> redirect to /admin/login
  const messages = unwrapList(await apiGet<unknown>('/contact/', { auth: true })).length

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 md:flex">
      <AdminNav messages={messages} />
      <main className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-10">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  )
}
