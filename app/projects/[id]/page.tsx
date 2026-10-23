import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { ArrowUpRight } from 'lucide-react'
import EditableBlocks from '@/components/EditableBlocks'
import InlineText from '@/components/InlineText'
import PageShell, { ContentCard, titleClass } from '@/components/PageShell'
import { getDetail, isAdmin } from '@/lib/details'
import { getProject } from '@/lib/projects'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getProject(id)
  return p ? { title: p.title, description: p.summary } : {}
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getProject(id) // drafts are excluded because the backend filters them out for the public
  if (!p) notFound()
  const [blocks, admin] = await Promise.all([getDetail(`project-${p.id}`), isAdmin()])

  return (
    <PageShell back={{ href: '/#projects', text: 'All projects' }}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {p.date && <span className="pop-pill pop-yellow">{p.date}</span>}
        {p.tags.map((t) => (
          <span key={t} className="pop-pill">{t}</span>
        ))}
      </div>

      <div className="mb-4">
        <InlineText endpoint={`projects/${p.id}`} field="title" initial={p.title} canEdit={admin} required as="h1"
          className={titleClass} />
      </div>
      <div className="mb-6">
        <InlineText endpoint={`projects/${p.id}`} field="summary" initial={p.summary} canEdit={admin}
          placeholder="Write a short summary (shown on the project card)…" className="text-lg text-[color:var(--muted)]" />
      </div>

      {/* Buttons only appear when their link is filled in */}
      {(p.demo || p.repo) && (
        <div className="mb-8 flex flex-wrap gap-3">
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

      {p.cover && (
        <div className="pop-card mb-8 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.cover} alt={p.title} className="w-full" />
        </div>
      )}

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
      <p className="mt-8">
        <Link href="/#projects" className="pop-link">← All projects</Link>
      </p>
    </PageShell>
  )
}
