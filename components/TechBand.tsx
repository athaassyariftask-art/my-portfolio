import TechIcon from '@/components/TechIcon'

/**
 * Full-width blue band listing the tools you work with: a white logo plus a mono label for each.
 * Names without a known logo still show as text.
 */
export default function TechBand({ stack }: { stack: string[] }) {
  if (stack.length === 0) return null
  return (
    <section aria-label="Tech stack" className="relative z-10 mb-24 bg-[color:var(--accent)] text-white">
      <div className="pop-wrap py-10 md:py-14">
        <p className="pop-label mb-8 !text-white/75">/ Tech stack</p>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {stack.map((t) => (
            <li key={t} className="flex flex-col items-start gap-3">
              <span className="flex h-12 items-center">
                {/* brightness-0 + invert turns the coloured logo into a clean white one */}
                <TechIcon name={t} size={44} className="brightness-0 invert" />
              </span>
              <span className="pop-label !text-white">{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
