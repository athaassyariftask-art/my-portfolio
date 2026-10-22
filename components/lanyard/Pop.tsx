import * as THREE from 'three'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { lanyard } from '@/lanyard.config'
import { COLOR } from './theme'
import { Plate } from './shapes'

type Props = {
  children: ReactNode
  /** Tulisan kecil yang muncul saat kursor di atas stiker (opsional). Tulis di lanyard.config.ts: note: '...' */
  note?: string
  /** Ukuran stiker, untuk menaruh tooltip tepat di atasnya. */
  h: number
  /** true = tooltip di bawah stiker (untuk stiker yang dekat tepi atas kartu). */
  tipBelow?: boolean
}

/**
 * Efek main-main untuk stiker / charm: membesar sedikit saat disentuh kursor,
 * bergoyang saat diklik, dan (kalau ada `note`) memunculkan tooltip.
 */
export default function Pop({ children, note, h, tipBelow }: Props) {
  const body = useRef<THREE.Group>(null)
  const tip = useRef<THREE.Group>(null)
  const [hover, setHover] = useState(false)
  const wiggle = useRef(0) // energi goyang, turun ke 0
  const scale = useRef(1)
  const t = useRef(0)
  const calm = useRef(false)

  useEffect(() => {
    calm.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useFrame((_, dt) => {
    if (!body.current) return
    t.current += dt
    wiggle.current = Math.max(0, wiggle.current - dt * 1.5)
    const target = hover ? 1.14 : 1
    scale.current += (target - scale.current) * Math.min(1, dt * 12)
    const pop = calm.current ? 0 : wiggle.current * 0.1
    body.current.scale.setScalar(scale.current + pop)
    body.current.rotation.z = calm.current ? 0 : Math.sin(t.current * 24) * 0.28 * wiggle.current
    if (tip.current) {
      const s = tip.current.scale.x + ((hover ? 1 : 0) - tip.current.scale.x) * Math.min(1, dt * 14)
      tip.current.scale.setScalar(Math.max(s, 0.0001))
      tip.current.visible = s > 0.02
    }
  })

  // Perkiraan ukuran tooltip dari panjang tulisan (satu atau dua baris)
  const text = note ?? ''
  const w = Math.min(1.5, 0.062 * text.length + 0.28)
  const perLine = Math.max(1, Math.floor((w - 0.24) / 0.062))
  const lines = Math.max(1, Math.ceil(text.length / perLine))
  const th = 0.12 + lines * 0.115
  const ty = tipBelow ? -(h / 2 + th / 2 + 0.08) : h / 2 + th / 2 + 0.08

  return (
    <group
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onClick={(e) => {
        if (e.delta > 5) return // digeser (menyeret kartu), bukan klik
        e.stopPropagation()
        wiggle.current = 1
      }}
    >
      <group ref={body}>{children}</group>
      {text && (
        <group ref={tip} position={[0, ty, 0.2]} scale={0.0001} visible={false}>
          <Plate w={w} h={th} r={0.08} color={COLOR.frame} basic />
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.085}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            textAlign="center"
            maxWidth={w - 0.2}
            font={lanyard.font}
          >
            {text}
          </Text>
        </group>
      )}
    </group>
  )
}
