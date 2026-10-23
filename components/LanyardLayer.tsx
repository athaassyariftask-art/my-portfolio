'use client'

import dynamic from 'next/dynamic'

// Three.js/Rapier only run in the browser
const InteractiveLanyard = dynamic(() => import('./InteractiveLanyard'), { ssr: false })

type Props = { name: string; role: string; affiliation: string; photo?: string }

// Shadow cast onto the page: one soft and wide (distance), one tight and thin (contact).
// Navy-tinted to match the page's soft card shadows instead of pure black.
const SHADOW = 'drop-shadow(0 24px 26px rgba(15,27,51,0.18)) drop-shadow(0 4px 6px rgba(15,27,51,0.14))'

/**
 * Lanyard layer, one screen tall at the top of the page. It scrolls with the page (not fixed to the screen),
 * so it disappears as the visitor scrolls down. Clicks pass through to the page; only the card can be dragged.
 */
export default function LanyardLayer(props: Props) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-40 hidden h-screen md:block"
      style={{ filter: SHADOW }}
    >
      <InteractiveLanyard {...props} />
    </div>
  )
}
