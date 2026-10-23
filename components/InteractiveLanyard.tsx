'use client'

import * as THREE from 'three'
import { useRef, useState, useEffect, RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, useCursor } from '@react-three/drei'
import {
  Physics,
  RigidBody,
  BallCollider,
  CuboidCollider,
  interactionGroups,
  useRopeJoint,
  useSphericalJoint,
  RapierRigidBody,
} from '@react-three/rapier'
import { lanyard } from '@/lanyard.config'
import CardFace, { type BadgeInfo } from './lanyard/CardFace'
import Charms from './lanyard/Charm'
import { COLOR } from './lanyard/theme'

export type { BadgeInfo }

const SEGMENT = 1.4 // panjang tiap ruas tali (satu sisi tali = 3 x SEGMENT)
const SPREAD = 1.3 // jarak tiap titik gantung dari tengah (kiri & kanan)
const CLIP_Y = 1.4 // posisi klip di bagian atas kartu (koordinat lokal kartu)
const CLIP_SPREAD = 0.12 // jarak kiri/kanan titik sambung tali di klip
const ANCHOR_Y = 5.4 // titik gantung (rumah), sedikit di atas layar

// FULLSCREEN: saat kartu ditarik, titik gantung ikut bergeser supaya kartu
// bisa dibawa ke mana pun di layar. Lepas drag -> titik gantung kembali pelan.
const REACH = 2.8 // jarak maksimum titik gantung ke klip saat drag (harus < panjang tali)

// ANTI-GETAR
const SEGMENT_MASS = 0.2
const ROPE_DAMPING = 2
const TIME_STEP = 1 / 120
const NO_COLLISION = interactionGroups(1, [])

// ANGIN: goyangan tipis saat tidak disentuh supaya kartu tidak diam kaku.
// Kecilkan WIND_FORCE kalau terlalu goyang, besarkan kalau kurang terasa.
const WIND_FORCE = 0.8 // dorongan samping
const WIND_TWIST = 0.2 // putaran tipis kartu (sumbu Y)

type Body = RefObject<RapierRigidBody>

/** Satu sisi tali: tube yang mengikuti ruas-ruas fisika */
function Strap({
  anchorBody,
  joints,
  card,
  clipX,
  side,
}: {
  anchorBody: Body
  joints: Body[]
  card: Body
  clipX: number
  side: 'left' | 'right'
}) {
  const mesh = useRef<THREE.Mesh>(null!)
  const curve = useRef(
    new THREE.CatmullRomCurve3(
      Array.from({ length: joints.length + 2 }, () => new THREE.Vector3()),
      false,
      'catmullrom',
      0.5
    )
  )
  const tmp = useRef({
    q: new THREE.Quaternion(),
    clip: new THREE.Vector3(),
    pos: new THREE.Vector3(),
  })

  useFrame(() => {
    if (!card.current || !anchorBody.current || joints.some((j) => !j.current)) return
    const pts = curve.current.points
    const { q, clip, pos } = tmp.current

    const a = anchorBody.current.translation()
    pts[0].set(a.x, a.y, a.z)
    joints.forEach((j, i) => {
      const t = j.current!.translation()
      pts[i + 1].set(t.x, t.y, t.z)
    })

    const r = card.current.rotation()
    const c = card.current.translation()
    q.set(r.x, r.y, r.z, r.w)
    clip.set(clipX, CLIP_Y, 0).applyQuaternion(q).add(pos.set(c.x, c.y, c.z))
    pts[pts.length - 1].copy(clip)

    mesh.current.geometry.dispose()
    mesh.current.geometry = new THREE.TubeGeometry(curve.current, 32, 0.06, 8, false)
  })

  return (
    <>
      <mesh ref={mesh} frustumCulled={false}>
        <bufferGeometry />
        <meshStandardMaterial color={COLOR.strap} roughness={0.75} />
      </mesh>
      <Charms curve={curve} charms={lanyard.charms.filter((c) => c.side === side)} />
    </>
  )
}

function Lanyard({ anchorX, badge }: { anchorX: number; badge: BadgeInfo }) {
  const leftX = anchorX - SPREAD
  const rightX = anchorX + SPREAD

  const fixedL = useRef<RapierRigidBody>(null!)
  const fixedR = useRef<RapierRigidBody>(null!)
  const l1 = useRef<RapierRigidBody>(null!)
  const l2 = useRef<RapierRigidBody>(null!)
  const l3 = useRef<RapierRigidBody>(null!)
  const r1 = useRef<RapierRigidBody>(null!)
  const r2 = useRef<RapierRigidBody>(null!)
  const r3 = useRef<RapierRigidBody>(null!)
  const card = useRef<RapierRigidBody>(null!)

  const [hovered, setHovered] = useState(false)
  const [dragging, setDragging] = useState(false)
  const reduceMotion = useRef(false)
  const grabOffset = useRef(new THREE.Vector3())
  const anchorOffset = useRef({ x: 0, y: 0 })
  const tmp = useRef({ q: new THREE.Quaternion(), v: new THREE.Vector3() })

  useCursor(hovered && !dragging, 'grab')
  useCursor(dragging, 'grabbing')

  useRopeJoint(fixedL, l1, [[0, 0, 0], [0, 0, 0], SEGMENT])
  useRopeJoint(l1, l2, [[0, 0, 0], [0, 0, 0], SEGMENT])
  useRopeJoint(l2, l3, [[0, 0, 0], [0, 0, 0], SEGMENT])
  useSphericalJoint(l3, card, [[0, 0, 0], [-CLIP_SPREAD, CLIP_Y, 0]])

  useRopeJoint(fixedR, r1, [[0, 0, 0], [0, 0, 0], SEGMENT])
  useRopeJoint(r1, r2, [[0, 0, 0], [0, 0, 0], SEGMENT])
  useRopeJoint(r2, r3, [[0, 0, 0], [0, 0, 0], SEGMENT])
  useSphericalJoint(r3, card, [[0, 0, 0], [CLIP_SPREAD, CLIP_Y, 0]])

  useEffect(() => {
    const stop = () => setDragging(false)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    return () => {
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
  }, [])

  useEffect(() => {
    document.body.style.userSelect = dragging ? 'none' : ''
    return () => {
      document.body.style.userSelect = ''
    }
  }, [dragging])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduceMotion.current = mq.matches
    const onChange = (e: MediaQueryListEvent) => (reduceMotion.current = e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    card.current?.setAngvel({ x: 0, y: 0, z: -1 }, true)
    card.current?.setLinvel({ x: -1.5, y: 0, z: 0 }, true)
  }, [])

  useFrame(({ pointer, viewport, clock }, delta) => {
    const body = card.current
    if (!body || !fixedL.current || !fixedR.current) return

    // Posisi klip di dunia
    const c = body.translation()
    const r = body.rotation()
    const { q, v } = tmp.current
    q.set(r.x, r.y, r.z, r.w)
    v.set(0, CLIP_Y, 0).applyQuaternion(q)
    const clipX = c.x + v.x
    const clipY = c.y + v.y

    // 1) Drag: tarik kartu ke posisi kursor (di seluruh layar)
    if (dragging) {
      const targetX = (pointer.x * viewport.width) / 2 - grabOffset.current.x
      const targetY = (pointer.y * viewport.height) / 2 - grabOffset.current.y
      ;[l1, l2, l3, r1, r2, r3, card].forEach((rb) => rb.current?.wakeUp())
      const clamp = (n: number) => Math.max(-30, Math.min(30, n))
      body.setLinvel(
        {
          x: clamp((targetX - c.x) * 8),
          y: clamp((targetY - c.y) * 8),
          z: -c.z * 10,
        },
        true
      )
    }

    // 1b) Angin: beberapa gelombang lambat yang saling menumpuk -> hembusan tidak berulang kaku
    if (!dragging && !reduceMotion.current) {
      const t = clock.elapsedTime
      const dt = Math.min(delta, 0.05)
      const gust = Math.sin(t * 0.55) + 0.6 * Math.sin(t * 1.3 + 1.7) + 0.4 * Math.sin(t * 0.21 + 4.1)
      const swirl = Math.sin(t * 0.8 + 0.6) + 0.5 * Math.sin(t * 1.9)
      body.applyImpulse({ x: gust * WIND_FORCE * dt, y: 0, z: swirl * WIND_FORCE * 0.25 * dt }, true)
      body.applyTorqueImpulse({ x: 0, y: swirl * WIND_TWIST * dt, z: 0 }, true)
    }

    // 2) Titik gantung ikut bergeser kalau kartu ditarik lebih jauh dari REACH
    let tx = 0
    let ty = 0
    const vx = clipX - anchorX
    const vy = clipY - ANCHOR_Y
    const dist = Math.hypot(vx, vy)
    if (dragging && dist > REACH) {
      const k = (dist - REACH) / dist
      tx = vx * k
      ty = vy * k
    }
    const smooth = 1 - Math.exp(-(dragging ? 14 : 2.5) * delta)
    const off = anchorOffset.current
    off.x += (tx - off.x) * smooth
    off.y += (ty - off.y) * smooth

    if (Math.abs(off.x) + Math.abs(off.y) > 0.01) body.wakeUp()
    fixedL.current.setNextKinematicTranslation({ x: leftX + off.x, y: ANCHOR_Y + off.y, z: 0 })
    fixedR.current.setNextKinematicTranslation({ x: rightX + off.x, y: ANCHOR_Y + off.y, z: 0 })
  })

  // Posisi awal ruas: langsung di jalur titik gantung -> klip (tanpa tarikan paksa)
  const clipWorldY = ANCHOR_Y - 0.6
  const chain = (refs: Body[], startX: number, endX: number) =>
    refs.map((ref, i) => {
      const t = (i + 1) / refs.length
      return (
        <RigidBody
          key={i}
          ref={ref}
          position={[
            startX + (endX - startX) * t,
            ANCHOR_Y + (clipWorldY - ANCHOR_Y) * t,
            0,
          ]}
          colliders={false}
          linearDamping={ROPE_DAMPING}
          angularDamping={ROPE_DAMPING}
        >
          {/* mass di collider (bukan di RigidBody) supaya kompatibel di semua versi rapier */}
          <BallCollider args={[0.08]} mass={SEGMENT_MASS} collisionGroups={NO_COLLISION} />
        </RigidBody>
      )
    })

  return (
    <>
      {/* Titik gantung: kinematic supaya bisa digeser saat drag */}
      <RigidBody ref={fixedL} type="kinematicPosition" position={[leftX, ANCHOR_Y, 0]} />
      <RigidBody ref={fixedR} type="kinematicPosition" position={[rightX, ANCHOR_Y, 0]} />

      {chain([l1, l2, l3], leftX, anchorX - CLIP_SPREAD)}
      {chain([r1, r2, r3], rightX, anchorX + CLIP_SPREAD)}

      <RigidBody
        ref={card}
        position={[anchorX, clipWorldY - CLIP_Y, 0]}
        colliders={false}
        linearDamping={0.8}
        angularDamping={1.5}
      >
        {/* Collider eksplisit: bentuk fisika tetap walau dekorasi (stiker, tab) diubah-ubah */}
        <CuboidCollider args={[1.8, 1.3, 0.05]} />
        <group
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onPointerDown={(e) => {
            e.stopPropagation()
            const c = card.current.translation()
            grabOffset.current.set(e.point.x - c.x, e.point.y - c.y, 0)
            setDragging(true)
          }}
        >
          <CardFace badge={badge} hovered={hovered} />
        </group>
      </RigidBody>

      <Strap anchorBody={fixedL} joints={[l1, l2, l3]} card={card} clipX={-CLIP_SPREAD} side="left" />
      <Strap anchorBody={fixedR} joints={[r1, r2, r3]} card={card} clipX={CLIP_SPREAD} side="right" />
    </>
  )
}

function Scene({ badge }: { badge: BadgeInfo }) {
  const viewport = useThree((s) => s.viewport)
  const [anchorX] = useState(() => Math.min(4.5, viewport.width / 2 - SPREAD - 2.2))

  return (
    <>
      {/* Cahaya studio netral (tanpa unduhan HDR) supaya warna kartu terlihat jujur di latar putih */}
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2.2} color="#ffffff" position={[-3, 4, 6]} scale={[10, 6, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#f1f3ff" position={[6, 1, 4]} scale={[6, 8, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#ffffff" position={[0, -4, 3]} scale={[12, 2, 1]} />
      </Environment>
      <ambientLight intensity={0.7} color="#ffffff" />
      <directionalLight position={[-4, 5, 6]} intensity={0.9} color="#ffffff" />
      <Physics gravity={[0, -25, 0]} timeStep={TIME_STEP}>
        <Lanyard anchorX={anchorX} badge={badge} />
      </Physics>
    </>
  )
}

export default function InteractiveLanyard(props: BadgeInfo) {
  return (
    <Canvas
      camera={{ position: [0, 0, 13], fov: 35 }}
      gl={{ alpha: true }}
      // Event dibaca dari body: canvas pointer-events:none, website di bawahnya tetap bisa diklik
      eventSource={typeof document !== 'undefined' ? document.body : undefined}
      eventPrefix="client"
      style={{ pointerEvents: 'none' }}
    >
      <Scene badge={props} />
    </Canvas>
  )
}
