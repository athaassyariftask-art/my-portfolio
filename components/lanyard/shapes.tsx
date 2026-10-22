import * as THREE from 'three'
import { useEffect, useMemo } from 'react'

function roundedRectShape(w: number, h: number, r: number) {
  const x = -w / 2
  const y = -h / 2
  const s = new THREE.Shape()
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

type Props = {
  w: number
  h: number
  r?: number // radius sudut
  /** Ada depth = balok membulat bertebal (bodi kartu). Tanpa depth = pelat tipis datar. */
  depth?: number
  color?: string
  map?: THREE.Texture | null
  /** Material tanpa pencahayaan (untuk foto/stiker supaya warnanya apa adanya). */
  basic?: boolean
  opacity?: number
  roughness?: number
  metalness?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
}

/** Persegi panjang bersudut membulat: pondasi seluruh desain kartu. */
export function Plate({
  w,
  h,
  r = 0.1,
  depth,
  color = '#ffffff',
  map,
  basic,
  opacity = 1,
  roughness = 0.7,
  metalness = 0,
  position,
  rotation,
}: Props) {
  const geo = useMemo(() => {
    const shape = roundedRectShape(w, h, Math.min(r, w / 2, h / 2))
    if (depth !== undefined) {
      const b = 0.02 // bevel tipis supaya tepi menangkap cahaya
      const g = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelThickness: b,
        bevelSize: b,
        bevelOffset: -b,
        bevelSegments: 3,
        curveSegments: 12,
      })
      g.translate(0, 0, -depth / 2)
      return g
    }
    const g = new THREE.ShapeGeometry(shape, 12)
    // UV 0..1 supaya foto/stiker (map) pas di bingkai
    const pos = g.attributes.position
    const uv = new Float32Array(pos.count * 2)
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = (pos.getX(i) + w / 2) / w
      uv[i * 2 + 1] = (pos.getY(i) + h / 2) / h
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    return g
  }, [w, h, r, depth])

  useEffect(() => () => geo.dispose(), [geo])

  return (
    <mesh geometry={geo} position={position} rotation={rotation}>
      {basic ? (
        // key: memaksa material dibuat ulang saat gambar baru datang. Tanpa ini, three.js tetap memakai
        // shader lama (tanpa tekstur) sehingga foto yang dimuat belakangan tampil sebagai kotak putih.
        <meshBasicMaterial
          key={map ? 'with-map' : 'no-map'}
          color={color}
          map={map ?? null}
          transparent={opacity < 1 || !!map}
          opacity={opacity}
          toneMapped={false}
        />
      ) : (
        <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} transparent={opacity < 1} opacity={opacity} />
      )}
    </mesh>
  )
}
