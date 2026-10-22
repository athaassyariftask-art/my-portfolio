import LoginForm from '@/components/admin/LoginForm'

export const metadata = { title: 'Admin login', robots: { index: false, follow: false } }

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2] px-6">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-blue-600">Admin</p>
        <h1 className="mb-8 text-2xl font-extrabold tracking-tight text-slate-900">Masuk ke dashboard</h1>
        <LoginForm />
      </div>
    </main>
  )
}
