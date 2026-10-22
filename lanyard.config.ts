// ============================================================
// Pengaturan kartu lanyard. Edit file ini, bukan kodenya.
// Semua gambar ditaruh di frontend/public/lanyard/ lalu tulis path-nya di `src`,
// mis. src: '/lanyard/stiker-1.png'. PNG transparan paling bagus (bentuk stiker ikut gambarnya).
// Slot yang `src`-nya kosong tampil sebagai kotak abu-abu bertanda "+" saat `npm run dev`,
// dan HILANG otomatis di production, jadi aman dibiarkan kosong.
// Foto profil diatur di site.config.ts (`photo`).
// ============================================================

export type StickerSlot = {
  id: string
  src?: string
  /** Posisi di kartu: x ke kanan, y ke atas. Kartu berukuran 3.6 x 2.6, titik tengah (0, 0). */
  x: number
  y: number
  /** Ukuran maksimum kotak stiker; gambar dimuat utuh di dalamnya (tidak terpotong). */
  w: number
  h: number
  /** Kemiringan dalam radian (0.2 ≈ 11°). */
  rot: number
  border?: boolean
}

export type CharmSlot = {
  id: string
  src?: string
  /** Tali mana yang ditempeli. */
  side: 'left' | 'right'
  /** Posisi sepanjang tali: 0 = titik gantung (atas), 1 = klip kartu (bawah). */
  t: number
  w: number
  h: number
  rot: number
  border?: boolean
}

export const lanyard = {
  /** Font kartu: file .ttf / .otf / .woff (bukan .woff2) di public/, mis. '/fonts/Inter-Bold.ttf'. Kosong = bawaan. */
  font: '/fonts/Poppins-Bold.ttf',

  /** Tulisan kecil di pita biru bagian atas kartu. */
  label: 'PORTFOLIO ID',

  /** Logo kecil di pojok kanan pita biru (mis. logo kampus / lab). */
  logo: undefined as string | undefined,

  showPlaceholders: process.env.NODE_ENV !== 'production',

  /** Stiker yang menempel di kartu. Tambah / hapus / geser sesukamu. */
  stickers: [
    { id: 'sticker-1', src: '/lanyard/sticker-1.png', border: false ,x: -1.52, y: 0.42, w: 0.7, h: 0.7, rot: 0.16 },
    { id: 'sticker-2', src: '/lanyard/sticker-3.png', border: false, x: -0.62, y: -0.98, w: 0.7, h: 0.7, rot: -0.1 },
    { id: 'sticker-3', src: '/lanyard/sticker-2.png', border: false, x: 1.42, y: -0.5, w: 0.6, h: 0.6, rot: 0.22 },
  ] as StickerSlot[],

  /** Charm / pin yang menempel di tali. */
  charms: [
    { id: 'charm-1', side: 'right', t: 0.32, w: 0.34, h: 0.34, rot: 0 },
    { id: 'charm-2', side: 'right', t: 0.55, w: 0.3, h: 0.42, rot: 0.12 },
  ] as CharmSlot[],
}
