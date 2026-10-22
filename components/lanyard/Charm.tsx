import * as THREE from 'three'
import { useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import type { CharmSlot } from '@/lanyard.config'
import Pop from './Pop'
import Sticker from './Sticker'

/**
 * Charm yang menempel di tali dan ikut bergoyang bersamanya.
 * Posisi dihitung tiap frame dari kurva tali (t: 0 = atas, 1 = klip).
 */
export default function Charms({ curve, charms }: { curve: RefObject<THREE.CatmullRomCurve3>; charms: CharmSlot[] }) {
  const groups = useRef<(THREE.Group | null)[]>([])
  const v = useRef(new THREE.Vector3())
  const tv = useRef(new THREE.Vector3())

  useFrame(() => {
    charms.forEach((c, i) => {
      const g = groups.current[i]
      if (!g) return
      curve.current.getPoint(c.t, v.current)
      curve.current.getTangent(c.t, tv.current)
      g.position.set(v.current.x, v.current.y, 0.12)
      // Tali menunjuk ke bawah = charm tegak; ikut miring mengikuti arah tali
      g.rotation.z = Math.atan2(tv.current.y, tv.current.x) + Math.PI / 2 + c.rot
    })
  })

  return (
    <>
      {charms.map((c, i) => (
        <group
          key={c.id}
          ref={(el) => {
            groups.current[i] = el
          }}
        >
          <group position={[0, -c.h / 2, 0]}>
            <Pop note={(c as { note?: string }).note} h={c.h}>
              <Sticker src={c.src} w={c.w} h={c.h} slim border={c.border} />
            </Pop>
          </group>
        </group>
      ))}
    </>
  )
}
