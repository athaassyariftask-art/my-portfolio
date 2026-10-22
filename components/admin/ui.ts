// Kelas Tailwind bersama untuk seluruh admin: ubah di sini, semua form ikut berubah.
export const input =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10'
export const label = 'mb-1.5 block text-sm font-medium text-slate-700'
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-50'
export const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-900 disabled:opacity-50'
export const card = 'rounded-2xl border border-slate-200 bg-white'

/** Ubah respons error DRF ({field: [pesan]}) jadi teks yang enak dibaca. */
export async function readError(res: Response): Promise<string> {
  if (res.status === 401) return 'Sesi habis. Silakan login lagi.'
  try {
    const data = await res.json()
    if (typeof data?.detail === 'string') return data.detail
    return Object.entries(data)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : String(v)}`)
      .join('\n')
  } catch {
    return `Gagal (kode ${res.status}).`
  }
}
