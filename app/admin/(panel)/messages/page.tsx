import DeleteButton from '@/components/admin/DeleteButton'
import PageHeader from '@/components/admin/PageHeader'
import { card } from '@/components/admin/ui'
import { apiGet, unwrapList } from '@/lib/api'

type Message = { id: number; name: string; email: string; message: string; created_at: string }

export default async function AdminMessages() {
  const data = await apiGet<unknown>('/contact/', { auth: true })
  const messages = unwrapList<Message>(data)

  return (
    <>
      <PageHeader title="Messages" hint="Messages from the contact form on the home page." />

      {messages.length === 0 ? (
        <p className={`${card} border-dashed p-10 text-center text-slate-500`}>No messages yet.</p>
      ) : (
        <ul className="space-y-4">
          {messages.map((m) => (
            <li key={m.id} className={`${card} p-5`}>
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{m.name}</p>
                  <a href={`mailto:${m.email}`} className="text-sm text-blue-600 hover:underline">{m.email}</a>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400">{m.created_at.slice(0, 10)}</span>
                  <DeleteButton endpoint={`contact/${m.id}`} name={`message from ${m.name}`} />
                </div>
              </div>
              <p className="whitespace-pre-line text-slate-700">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
