import SectionForm from '@/components/admin/SectionForm'

export default function NewSection() {
  return (
    <>
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900">Section baru</h1>
      <p className="mb-8 text-slate-500">
        Tentukan nama, tampilan, dan field-nya dulu. Setelah dibuat, kamu bisa langsung mengisi entrinya.
      </p>
      <SectionForm />
    </>
  )
}
