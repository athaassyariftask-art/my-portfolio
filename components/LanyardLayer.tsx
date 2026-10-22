'use client'

import dynamic from 'next/dynamic'

// Three.js/Rapier hanya jalan di browser
const InteractiveLanyard = dynamic(() => import('./InteractiveLanyard'), { ssr: false })

type Props = { name: string; role: string; affiliation: string; photo?: string }

// Shadow jatuh ke halaman: satu lembut & lebar (jarak), satu rapat & tipis (kontak).
// Warna slate-900 supaya menyatu dengan background kertas, bukan hitam pekat.
const SHADOW = 'drop-shadow(0 24px 26px rgba(15,23,42,0.20)) drop-shadow(0 4px 6px rgba(15,23,42,0.16))'

/** Layer fullscreen untuk lanyard. Klik tembus ke halaman; hanya kartu yang bisa di-drag. */
export default function LanyardLayer(props: Props) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 hidden h-screen w-screen md:block"
      style={{ filter: SHADOW }}
    >
      <InteractiveLanyard {...props} />
    </div>
  )
}
