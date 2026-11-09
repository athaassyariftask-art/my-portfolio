import Link from 'next/link'
import Reveal from '@/components/Reveal'

/**
 * Heading shared by the home page and the About page: a mono index, a serif title and a hairline.
 * `editHref` (admin only) adds a small Edit link at the end of the line.
 */
export default function SectionHeading({
  n,
  label,
  editHref,
}: {
  n: string
  label: string
  editHref?: string
}) {
  return (
    <Reveal>
      <div className="mb-[34px] border-t border-[color:var(--ink)] pt-4">
        <div className="flex items-center justify-between gap-4">
          <span className="pop-label !text-[color:var(--accent)]">/ {n}</span>
          <span className="flex items-center gap-4">
            <span className="pop-label hidden !normal-case sm:inline" aria-hidden>
              ~/{label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}
            </span>
            {editHref && (
              <Link href={editHref} className="pop-pill pop-yellow">
                Edit ✎
              </Link>
            )}
          </span>
        </div>
        <h2 className="pop-display t-h1 mt-3">{label}</h2>
      </div>
    </Reveal>
  )
}
