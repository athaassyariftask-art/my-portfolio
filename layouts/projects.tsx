import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import Reveal from '@/components/Reveal'
import { popColor } from '@/components/pop/colors'
import type { ProjectsProps } from './types'

const num = (i: number) => String(i + 1).padStart(2, '0')
const plain = (s: string) => s.replace(/[#*_`>\[\]]/g, '').replace(/\s+/g, ' ').trim().slice(0, 160)

/**
 * Projects as a grid of cards: cover (or a tinted block with the index), title, summary, tags.
 * The whole card links to the project page, so one click opens it.
 */
export default function ProjectsView({ projects }: ProjectsProps) {
  if (projects.length === 0) {
    return <p className="pop-card p-10 font-medium">No projects to show yet.</p>
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {projects.map((p, i) => (
        <Reveal key={p.id} delay={(i % 2) * 0.08}>
          <Link
            href={`/projects/${p.id}`}
            className="pop-card pop-hover group flex h-full flex-col overflow-hidden"
          >
            <div className={`aspect-[16/9] overflow-hidden border-b border-[color:var(--line)] ${popColor(i)}`}>
              {p.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.cover} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="pop-display text-6xl opacity-40">{num(i)}</span>
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col p-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="pop-label">Project {num(i)}</span>
                {p.date && <span className="pop-label">{p.date}</span>}
              </div>
              <h3 className="pop-display mb-2 text-2xl leading-tight">{p.title}</h3>
              <p className="text-[15px] leading-relaxed text-[color:var(--muted)]">
                {p.summary || plain(p.description) || 'No summary yet.'}
              </p>

              {p.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <span key={t} className="pop-pill">{t}</span>
                  ))}
                </div>
              )}

              <span className="pop-link mt-auto pt-5 text-sm">
                Open project
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </div>
          </Link>
        </Reveal>
      ))}
    </div>
  )
}
