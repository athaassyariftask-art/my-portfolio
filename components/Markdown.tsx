import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { markdownSchema } from '@/lib/markdownSchema'

/* eslint-disable @typescript-eslint/no-unused-vars */
/** Markdown dengan gaya yang sama seperti halaman detail project. */
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="text-[color:var(--ink)]">
      <ReactMarkdown
        // rehypeRaw turns the <u>/<mark>/tags the block editor's formatting
        // toolbar writes into real elements; rehypeSanitize (with the narrow schema below) then
        // strips anything else, so no other raw HTML/CSS/JS can ride along.
        rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSchema]]}
        components={{
          h2: ({ node, ...props }) => <h2 className="mb-3 mt-10 text-2xl font-bold text-[color:var(--ink)]" {...props} />,
          h3: ({ node, ...props }) => <h3 className="mb-2 mt-8 text-xl font-bold text-[color:var(--ink)]" {...props} />,
          p: ({ node, ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
          ul: ({ node, ...props }) => <ul className="mb-4 list-disc space-y-1 pl-6" {...props} />,
          ol: ({ node, ...props }) => <ol className="mb-4 list-decimal space-y-1 pl-6" {...props} />,
          a: ({ node, ...props }) => <a className="text-blue-600 underline" {...props} />,
          code: ({ node, ...props }) => <code className="rounded bg-[color:var(--cream)] px-1.5 py-0.5 font-mono text-sm" {...props} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
