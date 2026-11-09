'use client'

import dynamic from 'next/dynamic'

// Three.js/Rapier only run in the browser
const InteractiveLanyard = dynamic(() => import('./InteractiveLanyard'), { ssr: false })

type Props = { name: string; role: string; affiliation: string; photo?: string }

/**
 * Lanyard layer. Put it as the FIRST child of a `relative` wrapper: it covers that whole wrapper, and the inner
 * screen-tall box is `sticky`, so the lanyard stays on screen while the visitor scrolls through the wrapper
 * (hero + About) and then scrolls away with its end. Clicks pass through to the page; only the card can be dragged.
 * The shadow comes from --lanyard-shadow (app/pop.css), which has a light and a dark version.
 */
export default function LanyardLayer(props: Props) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-40 hidden md:block">
      <div className="sticky top-0 h-screen" style={{ filter: 'var(--lanyard-shadow)' }}>
        <InteractiveLanyard {...props} />
      </div>
    </div>
  )
}
