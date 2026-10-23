import '@/app/fun.css'
import '@/app/pop.css'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AdminButton from '@/components/AdminButton'
import ReadingProgress from '@/components/ReadingProgress'

/** Page title (h1) class so every reading page looks the same. */
export const titleClass = 'pop-display text-4xl md:text-6xl'

/**
 * Frame for reading pages (About, item detail, project detail) with the same theme as the home page:
 * warm paper background, a small back link, and the content inside a hairline card.
 */
export default function PageShell({
  back,
  children,
}: {
  back: { href: string; text: string }
  children: React.ReactNode
}) {
  return (
    <main className="pop-page relative min-h-screen overflow-x-clip">
      <ReadingProgress />
      <div className="relative z-10 mx-auto max-w-3xl px-6 pb-24 pt-10">
        <Link href={back.href} className="pop-link mb-8 text-sm">
          <ArrowLeft className="h-3.5 w-3.5" /> {back.text}
        </Link>
        {children}
      </div>
      <AdminButton />
    </main>
  )
}

/** Card where the page content (Notion-style blocks) is written and read. */
export function ContentCard({ children }: { children: React.ReactNode }) {
  return <div className="pop-card p-6 md:p-10">{children}</div>
}
