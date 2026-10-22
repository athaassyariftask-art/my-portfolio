
import { ImageResponse } from 'next/og'
import { getProfile } from '@/lib/profile'

export const alt = 'Portofolio'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  const site = await getProfile()

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: '72px',
          backgroundColor: '#f7f6f2',
          backgroundImage:
            'radial-gradient(#d6d3cb 2px, transparent 2px)',
          backgroundSize: '40px 40px',
          color: '#0f172a',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '28px',
            color: '#64748b',
            letterSpacing: '4px',
            textTransform: 'uppercase',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '18px',
              height: '18px',
              borderRadius: '9px',
              backgroundColor: '#10b981',
            }}
          />
          <span style={{ display: 'flex' }}>{site.role}</span>
        </div>

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: '40px',
              color: '#475569',
              marginBottom: '12px',
            }}
          >
            Halo, saya
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: '112px',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-3px',
              color: '#2563eb',
            }}
          >
            {site.name}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '30px',
            color: '#475569',
          }}
        >
          <div style={{ display: 'flex' }}>
            {site.affiliation}
          </div>

          <div
            style={{
              display: 'flex',
              color: '#0f172a',
              fontWeight: 700,
            }}
          >
            {site.name.split(' ')[0]}_
          </div>
        </div>
      </div>
    ),
    {
      width: size.width,
      height: size.height,
    },
  )
}
