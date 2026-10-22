// Data item berasal dari JSON yang bisa saja kosong/berbeda bentuk (mis. item lama
// belum punya field yang baru ditambahkan). Helper ini membuat View tidak pernah error.

export const asStr = (v: unknown): string => (typeof v === 'string' ? v : '')

export const asList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : []

/** Hanya izinkan http(s) supaya "javascript:" dari JSON tidak jadi link. */
export const safeUrl = (v: unknown): string => {
  const s = asStr(v).trim()
  return /^https?:\/\//i.test(s) ? s : ''
}
