import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import Markdown from '@/components/Markdown'
import { BODY, CALLOUT, CODE, H1, H2, H3, QUOTE } from '@/components/notion/style'
import { colWidth, normalize, sizeStyle, type Block } from '@/lib/blocks'
import { markdownSchema } from '@/lib/markdownSchema'

/** Hanya izinkan embed dari situs video yang dikenal (jangan iframe sembarang alamat). */
export function embedSrc(raw?: string): string | null {
  if (!raw) return null
  try {
    const u = new URL(raw)
    if (u.protocol !== 'https:') return null
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = u.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null
    }
    if (host === 'youtu.be') return `https://www.youtube.com/embed/${encodeURIComponent(u.pathname.slice(1))}`
    if (host === 'player.vimeo.com') return u.toString()
    if (host === 'vimeo.com') return `https://player.vimeo.com/video/${encodeURIComponent(u.pathname.slice(1))}`
    return null
  } catch {
    return null
  }
}

/** Markdown satu baris (tebal, miring, `kode`, tautan) tanpa pembungkus paragraf. */
export function Inline({ children }: { children: string }) {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSchema]]}
      components={{
        p: ({ children }) => <>{children}</>,
        a: ({ href, children }) => <a href={href} className="text-blue-600 underline">{children}</a>,
        code: ({ children }) => <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm">{children}</code>,
      }}
    >
      {children}
    </ReactMarkdown>
  )
}

/* eslint-disable @next/next/no-img-element */
function One({ b, n }: { b: Block; n: number }) {
  const t = b.text ?? ''
  // Alignment only applies to the handful of single-paragraph block types (see ALIGNABLE in lib/blocks.ts)
  const align: React.CSSProperties | undefined = b.align && b.align !== 'left' ? { textAlign: b.align } : undefined
  switch (b.type) {
    case 'text':
      return t.trim() ? <div style={align}><Markdown>{t}</Markdown></div> : null
    case 'h1':
      return <h2 className={H1} style={align}><Inline>{t}</Inline></h2>
    case 'h2':
      return <h3 className={H2} style={align}><Inline>{t}</Inline></h3>
    case 'h3':
      return <h4 className={H3} style={align}><Inline>{t}</Inline></h4>
    case 'bullet':
      return (
        <ul className={`${BODY} list-disc pl-6`}>
          <li><Inline>{t}</Inline></li>
        </ul>
      )
    case 'number':
      return (
        <ol start={n} className={`${BODY} list-decimal pl-6`}>
          <li><Inline>{t}</Inline></li>
        </ol>
      )
    case 'todo':
      return (
        <div className={`${BODY} flex items-start gap-3`}>
          <input type="checkbox" checked={!!b.checked} readOnly className="mt-1.5 h-4 w-4 accent-blue-600" />
          <span className={b.checked ? 'text-[color:var(--muted)] line-through' : ''}><Inline>{t}</Inline></span>
        </div>
      )
    case 'toggle':
      return (
        <details open={b.open !== false} className="my-1">
          <summary className={`${BODY} cursor-pointer font-semibold`}><Inline>{t}</Inline></summary>
          <div className="mt-2 border-l border-[color:var(--line)] pl-5">
            <Blocks blocks={b.children ?? []} />
          </div>
        </details>
      )
    case 'quote':
      return <blockquote className={`my-3 ${QUOTE}`} style={align}><Inline>{t}</Inline></blockquote>
    case 'callout':
      return <div className={`my-3 ${CALLOUT}`} style={align}><Inline>{t}</Inline></div>
    case 'code':
      return (
        <pre className={`my-4 overflow-x-auto ${CODE}`}>
          <code>{t}</code>
        </pre>
      )
    case 'divider':
      return <hr className="my-8 border-[color:var(--line)]" />
    case 'image':
      return b.url ? (
        <figure className="my-6" style={sizeStyle(b.size)}>
          <img src={b.url} alt={b.caption ?? ''} className="w-full rounded-2xl border border-[color:var(--line)]" />
          {b.caption && <figcaption className="mt-2 text-center font-mono text-xs text-[color:var(--muted)]">{b.caption}</figcaption>}
        </figure>
      ) : null
    case 'gallery':
      return b.urls?.length ? (
        <div className="my-6 grid grid-cols-2 gap-3 md:grid-cols-3">
          {b.urls.map((u, i) => (
            <img key={u + i} src={u} alt="" className="aspect-square w-full rounded-xl border border-[color:var(--line)] object-cover" />
          ))}
        </div>
      ) : null
    case 'video':
      return b.url ? (
        <figure className="my-6" style={sizeStyle(b.size)}>
          <video src={b.url} controls preload="metadata" className="w-full rounded-2xl border border-[color:var(--line)] bg-black" />
          {b.caption && <figcaption className="mt-2 text-center font-mono text-xs text-[color:var(--muted)]">{b.caption}</figcaption>}
        </figure>
      ) : null
    case 'embed': {
      const src = embedSrc(b.url)
      return src ? (
        <div className="my-6 aspect-video overflow-hidden rounded-2xl border border-[color:var(--line)]" style={sizeStyle(b.size)}>
          <iframe src={src} className="h-full w-full" allowFullScreen loading="lazy" title="Embed" />
        </div>
      ) : null
    }
    case 'columns': {
      const cols = b.cols ?? []
      // Stacked on mobile; at md+ the columns sit side by side using each one's own width (defaults to even)
      const template = cols.map((_, i) => `${colWidth(b, i)}fr`).join(' ')
      return (
        <div
          className="my-4 grid grid-cols-1 items-start gap-6 md:[grid-template-columns:var(--cols)]"
          style={{ '--cols': template } as React.CSSProperties}
        >
          {cols.map((c, i) => (
            <div key={i} className="min-w-0"><Blocks blocks={c} /></div>
          ))}
        </div>
      )
    }
    default:
      return null
  }
}

export default function Blocks({ blocks }: { blocks: Block[] }) {
  let n = 0
  return (
    <div>
      {normalize(blocks).map((b) => {
        n = b.type === 'number' ? n + 1 : 0
        return <One key={b.id} b={b} n={n} />
      })}
    </div>
  )
}
