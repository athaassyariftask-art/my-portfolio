// In-memory storage: for automated tests (no database). Data is lost when the process stops.
import type { DetailRow, Message, Profile, Project, SectionRow, Store } from './types'

export function memStore(): Store {
  let pid = 0, sid = 0, mid = 0
  const projects: Project[] = []
  const sections: SectionRow[] = []
  const details = new Map<string, DetailRow>()
  const messages: (Message & { ip: string; at: number })[] = []
  let profile: Profile = { name: '', role: '', affiliation: '', email: '', intro: '', photo: '', cv: '', links: [] }
  const byOrder = <T extends { order: number; id: number }>(a: T[]) => [...a].sort((x, y) => x.order - y.order || x.id - y.id)
  const pub = ({ ip: _i, at: _a, ...m }: Message & { ip: string; at: number }): Message => (void _i, void _a, m)

  return {
    async listProjects({ publishedOnly }) {
      return byOrder(projects.filter((p) => !publishedOnly || p.is_published))
    },
    async getProject(id) { return projects.find((p) => p.id === id) ?? null },
    async insertProject(p) { const r = { ...p, id: ++pid, created_at: new Date().toISOString() }; projects.push(r); return r },
    async updateProject(id, patch) { const p = projects.find((x) => x.id === id); if (!p) return null; Object.assign(p, patch); return p },
    async deleteProject(id) { const i = projects.findIndex((p) => p.id === id); if (i < 0) return false; projects.splice(i, 1); return true },
    async getProfile() { return profile },
    async saveProfile(patch) { profile = { ...profile, ...patch }; return profile },
    async listSections({ visibleOnly, slug }) {
      return byOrder(sections.filter((s) => (!visibleOnly || s.is_visible) && (!slug || s.slug === slug)))
    },
    async getSection(id) { return sections.find((s) => s.id === id) ?? null },
    async slugTaken(slug, exceptId) { return sections.some((s) => s.slug === slug && s.id !== exceptId) },
    async insertSection(s) { const r = { ...s, id: ++sid }; sections.push(r); return r },
    async updateSection(id, patch) { const s = sections.find((x) => x.id === id); if (!s) return null; Object.assign(s, patch); return s },
    async deleteSection(id) { const i = sections.findIndex((s) => s.id === id); if (i < 0) return false; sections.splice(i, 1); return true },
    async listDetailKeys() { return [...details.keys()].sort() },
    async getDetail(key) { return details.get(key) ?? null },
    async upsertDetail(key, patch) {
      const d = { ...(details.get(key) ?? { key, blocks: [], title: '', parent: '' }), ...patch }
      details.set(key, d)
      return d
    },
    async listMessages() { return [...messages].reverse().map(pub) },
    async getMessage(id) { const m = messages.find((x) => x.id === id); return m ? pub(m) : null },
    async insertMessage(m) {
      const r = { id: ++mid, name: m.name, email: m.email, message: m.message, created_at: new Date().toISOString(), ip: m.ip, at: Date.now() }
      messages.push(r)
      return pub(r)
    },
    async countRecentMessages(ip) { return messages.filter((m) => m.ip === ip && Date.now() - m.at < 3_600_000).length },
    async deleteMessage(id) { const i = messages.findIndex((m) => m.id === id); if (i < 0) return false; messages.splice(i, 1); return true },
  }
}
