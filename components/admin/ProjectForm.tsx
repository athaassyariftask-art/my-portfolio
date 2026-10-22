'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Project } from '@/lib/projects'
import { uploadImage } from '@/lib/upload'
import { btnGhost, btnPrimary, input, label, readError } from './ui'

export default function ProjectForm({ project }: { project?: Project }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [removeImage, setRemoveImage] = useState(false)

  const filePreview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => { if (filePreview) URL.revokeObjectURL(filePreview) }, [filePreview])
  const preview = filePreview ?? (removeImage ? null : project?.cover ?? null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError('')

    const raw = new FormData(e.currentTarget)
    const payload: Record<string, unknown> = {
      title: String(raw.get('title') ?? ''),
      github_url: String(raw.get('github_url') ?? '') || null,
      demo_url: String(raw.get('demo_url') ?? '') || null,
      order: Number(raw.get('order') || 0),
      tech_stack: String(raw.get('tech_stack') ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      featured: Boolean(raw.get('featured')),
      is_published: Boolean(raw.get('is_published')),
    }
    let res: Response
    try {
      if (file) payload.image = await uploadImage(file)
      else if (removeImage) payload.image = null
      res = await fetch(project ? `/api/admin/projects/${project.id}` : '/api/admin/projects', {
        method: project ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload gagal.')
      setBusy(false)
      return
    }
    if (!res.ok) {
      setError(await readError(res))
      setBusy(false)
      return
    }
    router.push('/admin/projects')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className={label} htmlFor="title">Judul</label>
        <input id="title" name="title" required defaultValue={project?.title} className={input} />
      </div>

      <p className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
        Ringkasan dan isi halaman project diedit langsung di websitenya: buka halaman project saat login, lalu klik teks untuk mengetik.
      </p>

      <div>
        <label className={label} htmlFor="tech_stack">Tag / teknologi (pisahkan dengan koma)</label>
        <input
          id="tech_stack"
          name="tech_stack"
          defaultValue={project?.tags.join(', ')}
          placeholder="Django, AHP, PostgreSQL"
          className={input}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className={label} htmlFor="github_url">Link repo (opsional)</label>
          <input id="github_url" name="github_url" type="url" defaultValue={project?.repo ?? ''} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="demo_url">Link demo (opsional)</label>
          <input id="demo_url" name="demo_url" type="url" defaultValue={project?.demo ?? ''} className={input} />
        </div>
      </div>

      <div>
        <span className={label}>Gambar cover</span>
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview cover" className="mb-3 max-h-52 rounded-2xl border border-slate-200" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null)
            setRemoveImage(false)
          }}
          className="block text-sm text-slate-600"
        />
        {project?.cover && !file && (
          <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={removeImage} onChange={(e) => setRemoveImage(e.target.checked)} />
            Hapus gambar cover
          </label>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <label className={label} htmlFor="order">Urutan (kecil tampil dulu)</label>
          <input id="order" name="order" type="number" min={0} defaultValue={project?.order ?? 0} className={input} />
        </div>
        <label className="flex items-center gap-3 pt-6 text-slate-700">
          <input type="checkbox" name="is_published" defaultChecked={project?.published ?? true} className="h-4 w-4" />
          Tampilkan di website
        </label>
        <label className="flex items-center gap-3 pt-6 text-slate-700">
          <input type="checkbox" name="featured" defaultChecked={project?.featured ?? false} className="h-4 w-4" />
          Featured
        </label>
      </div>

      {error && <p className="whitespace-pre-line rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

      <div className="flex gap-3">
        <button disabled={busy} className={btnPrimary}>
          {busy ? 'Menyimpan…' : project ? 'Simpan perubahan' : 'Tambah project'}
        </button>
        <Link href="/admin/projects" className={btnGhost}>Batal</Link>
      </div>
    </form>
  )
}
