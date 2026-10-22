import achievements from './achievements'
import experience from './experience'
import focus from './focus'
import projects from './projects'
import story from './story'
import toolbox from './toolbox'
import type { SectionModule } from './types'

/**
 * Daftar semua modul. Menambah jenis section baru:
 *   1) buat modules/<nama>/index.tsx (salin dari modul lain)
 *   2) tambahkan satu baris di bawah
 * Urutan di sini = urutan bawaan di halaman depan.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const list: SectionModule<any>[] = [projects, focus, experience, toolbox, achievements, story]

export const modules = list
export const getModule = (kind: string) => list.find((m) => m.kind === kind)
