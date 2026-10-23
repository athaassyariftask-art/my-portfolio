import '@/app/fun.css'
import '@/app/pop.css'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AdminButton from '@/components/AdminButton'
import ReadingProgress from '@/components/ReadingProgress'

/** Page title (h1) class so every reading page looks the same. */
export const titleClass = 'pop-display text-4xl md:text-6xl xl:text-7xl'

/**
 * Frame for reading pages (About, item detail, project detail) with the same theme as the home page:
 * warm paper background, a small back link, and a wide container that uses the whole screen.
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
      <div className="pop-wrap relative z-10 pb-24 pt-10">
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

/**
 * Two columns for wide screens: a sticky side column (facts, links, related pages) next to the main content.
 * On small screens the side column stacks on top.
 */
export function ReadingGrid({ aside, children }: { aside: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] xl:gap-12">
      <aside className="space-y-4 lg:sticky lg:top-8">{aside}</aside>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** Small titled card for the side column. */
export function AsideCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pop-card p-5">
      <p className="pop-label mb-3">{title}</p>
      {children}
    </div>
  )
}
