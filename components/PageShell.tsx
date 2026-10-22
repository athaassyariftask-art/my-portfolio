import '@/app/fun.css'
import '@/app/pop.css'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AdminButton from '@/components/AdminButton'
import ReadingProgress from '@/components/ReadingProgress'
import { display } from '@/lib/fonts'

/** Kelas judul halaman (h1) supaya seragam di semua halaman baca. */
export const titleClass = 'pop-display text-5xl uppercase leading-[1.05] md:text-7xl'

/**
 * Kerangka halaman baca (About, detail item, detail project) dengan tema yang sama seperti halaman depan:
 * latar putih, tombol kembali kecil, dan isi di dalam kartu bergaris tipis.
 */
export default function PageShell({
  back,
  children,
}: {
  back: { href: string; text: string }
  children: React.ReactNode
}) {
  return (
    <main className={`pop-page ${display.variable} relative min-h-screen overflow-x-clip`}>
      <ReadingProgress />
      <div className="relative z-10 mx-auto max-w-3xl px-6 pb-24 pt-10">
        <Link
          href={back.href}
          className="pop-pill pop-paper mb-8"
          // style inline karena .pop-pill (display: inline-block) mengalahkan kelas Tailwind
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.9rem' }}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {back.text}
        </Link>
        {children}
      </div>
      <AdminButton />
    </main>
  )
}

/** Kartu tempat isi halaman (blok ala Notion) ditulis/dibaca. */
export function ContentCard({ children }: { children: React.ReactNode }) {
  return <div className="pop-card p-6 md:p-10">{children}</div>
}
