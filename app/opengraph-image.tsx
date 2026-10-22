import { ImageResponse } from 'next/og'
import { getProfile } from '@/lib/profile'

// Gambar preview saat link dibagikan (WhatsApp, LinkedIn, X, dll). Dibuat otomatis dari profil.
export const alt = 'Portofolio'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  const site = await getProfile()
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: '#f7f6f2',
          backgroundImage: 'radial-gradient(#d6d3cb 2px, transparent 2px)',
          backgroundSize: '40px 40px',
          color: '#0f172a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 28, color: '#64748b', letterSpacing: 4, textTransform: 'uppercase' }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, background: '#10b981' }} />
          {site.role}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 40, color: '#475569', marginBottom: 12 }}>Halo, saya</div>
          <div style={{ fontSize: 112, fontWeight: 800, lineHeight: 1.05, letterSpacing: -3, color: '#2563eb' }}>{site.name}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 30, color: '#475569' }}>
          <div>{site.affiliation}</div>
          <div style={{ color: '#0f172a', fontWeight: 700 }}>{site.name.split(' ')[0]}_</div>
        </div>
      </div>
    ),
    size,
  )
}
