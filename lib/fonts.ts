import { Archivo_Black } from 'next/font/google'

// Font tebal untuk judul besar saja (teks biasa tetap memakai font situs).
// Mau ganti? Cari font lain di next/font/google dan ubah di sini; kelas .pop-display ikut berubah.
export const display = Archivo_Black({ subsets: ['latin'], weight: '400', variable: '--font-display', display: 'swap' })
