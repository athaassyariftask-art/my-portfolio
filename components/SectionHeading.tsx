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
      <div className="mb-10 flex items-center gap-4">
        <span className="pop-badge pop-yellow">{n}</span>
        <h2 className="pop-display text-3xl md:text-4xl">{label}</h2>
        <span className="h-px flex-1 bg-[color:var(--line)]" />
        {editHref && (
          <Link href={editHref} className="pop-pill pop-yellow">
            Edit ✎
          </Link>
        )}
      </div>
    </Reveal>
  )
}
