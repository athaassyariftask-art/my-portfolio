import type { ReactNode } from 'react'

const K = { color: '#f4a0b8' } // keywords
const P = { color: '#9ec5f0' } // property names
const S = { color: '#8fd6b8' } // strings
const D = { color: '#8d9ab3' } // punctuation / comments

const str = (v: string) => <span style={S}>&quot;{v}&quot;</span>

/**
 * A small "code window" that introduces you as a TypeScript object. Purely presentational: the values come
 * from Admin → Profile and hero.config.ts, so it never needs editing by hand.
 */
export default function HeroCode({
  name,
  role,
  focus,
  stack,
  status,
}: {
  name: string
  role: string
  focus: string
  stack: string[]
  status: string
}) {
  const ident = (name.split(/\s+/)[0] || 'me').toLowerCase().replace(/[^a-z0-9_]/g, '') || 'me'
  const line = (key: string, value: ReactNode) => (
    <div className="pl-6">
      <span style={P}>{key}</span>
      <span style={D}>: </span>
      {value}
      <span style={D}>,</span>
    </div>
  )
  return (
    <div
      className="mt-10 max-w-xl overflow-hidden rounded-2xl border border-[color:var(--line)] shadow-[var(--shadow-md)]"
      style={{ backgroundColor: '#101010' }}
      role="img"
      aria-label={`${name}: ${role}. ${focus}.`}
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#f4a0b8' }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#f6c650' }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#8fd6b8' }} />
        <span className="ml-3 font-mono text-xs text-white/55">about.ts</span>
      </div>
      <pre className="overflow-x-auto px-5 py-4 font-mono text-[13px] leading-[1.75] text-white/90" aria-hidden>
        <code>
          <div>
            <span style={K}>const</span> {ident} <span style={D}>=</span> <span style={D}>{'{'}</span>
          </div>
          {line('role', str(role))}
          {line('focus', str(focus))}
          {line(
            'stack',
            <>
              <span style={D}>[</span>
              {stack.slice(0, 5).map((t, i) => (
                <span key={t}>
                  {i > 0 && <span style={D}>, </span>}
                  {str(t)}
                </span>
              ))}
              <span style={D}>]</span>
            </>,
          )}
          {status && line('status', str(status))}
          <div>
            <span style={D}>{'}'}</span>
            <span className="pop-caret ml-1 align-middle" style={{ background: '#f6c650' }} />
          </div>
        </code>
      </pre>
    </div>
  )
}
