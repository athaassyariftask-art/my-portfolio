'use client'

import dynamic from 'next/dynamic'

// Three.js/Rapier hanya jalan di browser
const InteractiveLanyard = dynamic(() => import('./InteractiveLanyard'), { ssr: false })

type Props = { name: string; role: string; affiliation: string; photo?: string }

// Shadow jatuh ke halaman: satu lembut & lebar (jarak), satu rapat & tipis (kontak).
// Warna slate-900 supaya menyatu dengan latar putih, bukan hitam pekat.
const SHADOW = 'drop-shadow(0 24px 26px rgba(15,23,42,0.20)) drop-shadow(0 4px 6px rgba(15,23,42,0.16))'

/**
 * Layer lanyard seukuran satu layar di bagian atas halaman. Ikut bergulir bersama halaman
 * (tidak menempel di layar), jadi hilang saat pengunjung scroll ke bawah. Klik tembus ke halaman; hanya kartu yang bisa di-drag.
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
