import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { ArrowUpRight } from 'lucide-react'
import BrowserFrame from '@/components/BrowserFrame'
import EditableBlocks from '@/components/EditableBlocks'
import InlineText from '@/components/InlineText'
import PageShell, { AsideCard, ContentCard, ReadingGrid, titleClass } from '@/components/PageShell'
import { getDetail, isAdmin } from '@/lib/details'
import { getProject, getProjects } from '@/lib/projects'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getProject(id)
  return p ? { title: p.title, description: p.summary } : {}
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getProject(id) // drafts are excluded because the backend filters them out for the public
  if (!p) notFound()
  const [blocks, admin, all] = await Promise.all([getDetail(`project-${p.id}`), isAdmin(), getProjects()])
  const others = all.filter((o) => o.id !== p.id)

  return (
    <PageShell back={{ href: '/#projects', text: 'All projects' }}>
      <span className="pop-label mb-4 block">Project</span>

      <div className="mb-5 max-w-5xl">
        <InlineText endpoint={`projects/${p.id}`} field="title" initial={p.title} canEdit={admin} required as="h1"
          className={titleClass} />
      </div>
      <div className="mb-7 max-w-3xl">
        <InlineText endpoint={`projects/${p.id}`} field="summary" initial={p.summary} canEdit={admin}
          placeholder="Write a short summary (shown on the project card)…" className="text-lg text-[color:var(--muted)] md:text-xl" />
      </div>

      {/* Buttons only appear when their link is filled in */}
      {(p.demo || p.repo) && (
        <div className="mb-10 flex flex-wrap gap-3">
          {p.demo && (
            <a href={p.demo} target="_blank" rel="noreferrer" className="pop-btn pop-btn-ink !px-5 !py-2 text-sm">
              Demo <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
          {p.repo && (
            <a href={p.repo} target="_blank" rel="noreferrer" className="pop-btn pop-btn-ghost !px-5 !py-2 text-sm">
              Repo <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </div>
      )}

      {/* Full-width screenshot in a browser window: tilts on hover and scrolls through the page */}
      {p.cover && (
        <BrowserFrame
          src={p.cover}
          alt={p.title}
          label={p.title}
          aspect="aspect-[16/9] xl:aspect-[2/1]"
          className="mb-12"
        />
      )}

      <ReadingGrid
        aside={
          <>
            <AsideCard title="At a glance">
              <dl className="space-y-4 text-sm">
                {p.date && (
                  <div>
                    <dt className="pop-label mb-1">Date</dt>
                    <dd className="font-medium">{p.date}</dd>
                  </div>
                )}
                {p.tags.length > 0 && (
                  <div>
                    <dt className="pop-label mb-2">Built with</dt>
                    <dd className="flex flex-wrap gap-2">
                      {p.tags.map((t) => (
                        <span key={t} className="pop-pill">{t}</span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </AsideCard>

            {others.length > 0 && (
              <AsideCard title="More projects">
                <ul className="-mx-2">
                  {others.map((o) => (
                    <li key={o.id}>
                      <Link
                        href={`/projects/${o.id}`}
                        className="group flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors hover:bg-[color:var(--cream)]"
                      >
                        <span>{o.title}</span>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-[color:var(--muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[color:var(--accent)]" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </AsideCard>
            )}
          </>
        }
      >
        <ContentCard>
          <EditableBlocks
            detailKey={`project-${p.id}`}
            initial={blocks}
            canEdit={admin}
            seedMarkdown={p.description}
            fallback={
              <div className="text-slate-700">
                <ReactMarkdown
                  components={{
                    h2: ({ node, ...props }) => <h2 className="pop-display mb-3 mt-10 text-2xl text-slate-900" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="pop-display mb-2 mt-8 text-xl text-slate-900" {...props} />,
                    p: ({ node, ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
                    ul: ({ node, ...props }) => <ul className="mb-4 list-disc space-y-1 pl-6" {...props} />,
                    ol: ({ node, ...props }) => <ol className="mb-4 list-decimal space-y-1 pl-6" {...props} />,
                    a: ({ node, ...props }) => <a className="text-[color:var(--accent)] underline" {...props} />,
                    code: ({ node, ...props }) => (
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm" {...props} />
                    ),
                    img: ({ node, ...props }) => (
                      // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
                      <img className="my-6 w-full rounded-2xl border border-[color:var(--line)]" {...props} />
                    ),
                  }}
                >
                  {p.description}
                </ReactMarkdown>
              </div>
            }
          />
        </ContentCard>
      </ReadingGrid>
    </PageShell>
  )
}
