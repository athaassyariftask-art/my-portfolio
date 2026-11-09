import { ArrowUpRight } from 'lucide-react'
import { toWeeks, type GithubActivity as Data } from '@/lib/github'

const CELL = 11
const GAP = 3
const LEVEL = [
  'color-mix(in srgb, var(--ink) 9%, var(--paper))',
  'color-mix(in srgb, var(--accent) 28%, var(--paper))',
  'color-mix(in srgb, var(--accent) 50%, var(--paper))',
  'color-mix(in srgb, var(--accent) 75%, var(--paper))',
  'var(--accent)',
]
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** GitHub-style contribution heatmap for the last year. Server component: the data is fetched on the server. */
export default function GithubActivity({ data }: { data: Data }) {
  const weeks = toWeeks(data.days)
  const step = CELL + GAP
  const width = weeks.length * step - GAP
  const top = 16 // room for month labels
  const height = top + 7 * step - GAP

  // Label a column when a new month starts in it
  const labels: { x: number; text: string }[] = []
  let lastMonth = -1
  weeks.forEach((w, i) => {
    const d = w.find(Boolean)
    if (!d) return
    const m = Number(d.date.slice(5, 7)) - 1
    if (m !== lastMonth) {
      if (i < weeks.length - 2 || labels.length === 0) labels.push({ x: i * step, text: MONTHS[m] })
      lastMonth = m
    }
  })

  return (
    <div className="pop-card p-5 md:p-7">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="pop-display t-h1">{data.total.toLocaleString('en-US')}</p>
          <p className="pop-label mt-1">contributions in the last year</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-[color:var(--muted)]">
          {data.repos !== null && (
            <span>
              <b className="text-[color:var(--ink)]">{data.repos}</b> public repos
            </span>
          )}
          {data.followers !== null && (
            <span>
              <b className="text-[color:var(--ink)]">{data.followers}</b> followers
            </span>
          )}
          <a href={`https://github.com/${data.user}`} target="_blank" rel="noreferrer" className="pop-link">
            @{data.user} <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-label={`${data.total} GitHub contributions in the last year`}
          className="min-w-[640px]"
        >
          {labels.map((l) => (
            <text key={l.x} x={l.x} y={10} fontSize={10} fill="var(--muted)" fontFamily="var(--font-geist-mono), monospace">
              {l.text}
            </text>
          ))}
          {weeks.map((w, x) =>
            w.map((d, y) =>
              d ? (
                <rect key={d.date} x={x * step} y={top + y * step} width={CELL} height={CELL} rx={2.5} fill={LEVEL[d.level]}>
                  <title>{`${d.count} contribution${d.count === 1 ? '' : 's'} on ${d.date}`}</title>
                </rect>
              ) : null,
            ),
          )}
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-[color:var(--muted)]" aria-hidden>
        Less
        {LEVEL.map((c, i) => (
          <span key={i} className="h-2.5 w-2.5 rounded-[3px]" style={{ background: c }} />
        ))}
        More
      </div>
    </div>
  )
}
