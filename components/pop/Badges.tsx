// Lencana stiker bergaya poster: bintang bergerigi dan bunga tersenyum (SVG, tanpa gambar eksternal).

function starPoints(cx: number, cy: number, spikes: number, outer: number, inner: number) {
  return Array.from({ length: spikes * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner
    const a = (Math.PI * i) / spikes - Math.PI / 2
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')
}

/** Bintang bergerigi berisi tulisan, mis. "HALO!". */
export function Starburst({
  text,
  fill = 'var(--teal)',
  className = '',
}: {
  text: string
  fill?: string
  className?: string
}) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <polygon points={starPoints(60, 60, 12, 56, 44)} fill={fill} stroke="var(--ink)" strokeWidth="4" strokeLinejoin="round" />
      <text
        x="60"
        y="67"
        textAnchor="middle"
        fontSize="22"
        fontWeight="900"
        fill="var(--ink)"
        style={{ fontFamily: 'var(--font-display), Impact, sans-serif' }}
      >
        {text}
      </text>
    </svg>
  )
}

/** Bunga kelopak dengan wajah tersenyum. */
export function Flower({ className = '', petal = 'var(--pink)' }: { className?: string; petal?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse
          key={i}
          cx="60"
          cy="24"
          rx="15"
          ry="24"
          fill={petal}
          stroke="var(--ink)"
          strokeWidth="4"
          transform={`rotate(${i * 45} 60 60)`}
        />
      ))}
      <circle cx="60" cy="60" r="26" fill="var(--yellow)" stroke="var(--ink)" strokeWidth="4" />
      <circle cx="51" cy="55" r="3.5" fill="var(--ink)" />
      <circle cx="69" cy="55" r="3.5" fill="var(--ink)" />
      <path d="M48 66 Q60 79 72 66" fill="none" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
