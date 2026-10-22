import { Anton } from 'next/font/google'

// Font condensed tebal untuk judul besar saja (teks biasa tetap memakai font situs).
// Mau ganti? Cari font lain di next/font/google dan ubah di sini; kelas .pop-display ikut berubah.
export const display = Anton({ subsets: ['latin'], weight: '400', variable: '--font-display', display: 'swap' })
