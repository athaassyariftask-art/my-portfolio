import Reveal from '@/components/Reveal'
import StatsStrip, { type Stat } from '@/components/StatsStrip'

/**
 * Short "About" row under the hero: text, an optional photo and the achievement cards. Everything sits in the
 * left ~60% so the lanyard (which follows the scroll down to the end of this row) has the right side to itself.
 * Text: Admin → Profile → Short intro. Photo: Admin → Profile → About photo. Cards: Admin → Profile → Home content.
 */
export default function AboutBand({
  n,
  name,
  photo,
  text,
  stats,
}: {
  n: string
  name: string
  photo: string
  text: string
  stats: Stat[]
}) {
  return (
    <section id="about" aria-label="About" className="relative z-10 scroll-mt-24 border-y border-[color:var(--ink)]">
      <Reveal>
        <div className="pop-wrap py-[55px] md:py-[89px]">
          <div className="lg:max-w-[62%]">
            <div className={photo ? 'grid gap-[34px] sm:grid-cols-[10rem_minmax(0,1fr)]' : ''}>
              {photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt={name} className="aspect-[4/5] w-40 rounded-2xl border border-[color:var(--line)] object-cover sm:w-full" />
              )}
              <div>
                <p className="pop-label mb-[21px] !text-[color:var(--accent)]">/ {n} About</p>
                <p className="t-measure whitespace-pre-line text-[15px] leading-[1.7]">{text}</p>
              </div>
            </div>

            {stats.length > 0 && (
              <div className="mt-[34px] md:mt-[55px]">
                <StatsStrip stats={stats} />
              </div>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  )
}
