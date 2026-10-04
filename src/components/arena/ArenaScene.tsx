import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Edges, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import type { ArenaVariant } from './ArenaVisual';

type Palette = { ground: string; surface: string; primary: string; accent: string; amber: string; foreground: string; border: string };
type Pointer = { x: number; y: number };

function Floor({ palette }: { palette: Palette }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = palette.surface;
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = palette.border;
      ctx.lineWidth = 2;
      ctx.strokeRect(4, 4, 248, 248);
      ctx.lineWidth = 1;
      for (let i = 16; i < 256; i += 16) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
      }
      ctx.fillStyle = palette.accent;
      ctx.fillRect(6, 6, 22, 3);
      ctx.fillRect(6, 6, 3, 22);
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(12, 12);
    return map;
  }, [palette]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh rotation-x={-Math.PI / 2} position-y={-1.3}>
    <planeGeometry args={[55, 55]} />
    <meshStandardMaterial map={texture} metalness={0.55} roughness={0.55} />
  </mesh>;
}

function HexFrame({ radius, color, rotation = 0 }: { radius: number; color: string; rotation?: number }) {
  const points = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const a = i * Math.PI / 3;
    return new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0);
  }), [radius]);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0), [points]);
  return <mesh rotation-z={rotation}>
    <tubeGeometry args={[curve, 48, 0.045, 6, false]} />
    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} metalness={0.5} roughness={0.25} />
  </mesh>;
}

function SkillCore({ variant, palette, motion }: { variant: ArenaVariant; palette: Palette; motion: boolean }) {
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const time = useRef(0);
  const color = variant === 'battle' || variant === 'shop' ? palette.amber : variant === 'coach' || variant === 'history' ? palette.accent : palette.primary;
  useFrame((_, rawDelta) => {
    if (!motion) return;
    const dt = Math.min(rawDelta, 0.05);
    time.current += dt;
    if (outer.current) {
      outer.current.rotation.y += dt * 0.17;
      outer.current.position.y = 1.5 + Math.sin(time.current * 0.7) * 0.13;
    }
    if (inner.current) { inner.current.rotation.y -= dt * 0.35; inner.current.rotation.z += dt * 0.08; }
  });
  return <group ref={outer} position={[0, 1.5, 0]} rotation={[0.15, -0.25, 0.1]}>
    <HexFrame radius={2.6} color={color} />
    <group rotation={[0, Math.PI / 2, Math.PI / 6]}><HexFrame radius={2.35} color={palette.accent} /></group>
    <group ref={inner}>
      {variant === 'battle' ? <>
        {[-1, 1].map((sign) => <mesh key={sign} position={[sign * 0.55, 0, 0]} rotation={[0.5, 0.3, sign * Math.PI / 4]}>
          <octahedronGeometry args={[1.15, 0]} />
          <meshStandardMaterial color={sign === 1 ? palette.primary : palette.amber} metalness={0.8} roughness={0.24} />
          <Edges color={palette.foreground} />
        </mesh>)}
      </> : variant === 'shop' ? <mesh rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[1.25, 1.25, 0.35, 6]} />
        <meshStandardMaterial color={palette.amber} metalness={0.85} roughness={0.2} />
        <Edges color={palette.foreground} />
      </mesh> : variant === 'learning' ? <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <boxGeometry args={[1.75, 1.75, 1.75]} />
        <meshStandardMaterial color={palette.surface} metalness={0.65} roughness={0.24} />
        <Edges color={palette.primary} linewidth={2} />
      </mesh> : <mesh>
        <icosahedronGeometry args={[1.4, variant === 'coach' ? 1 : 0]} />
        <meshStandardMaterial color={palette.surface} metalness={0.8} roughness={0.18} flatShading />
        <Edges color={color} linewidth={2} />
      </mesh>}
    </group>
    {Array.from({ length: variant === 'progress' ? 8 : 4 }, (_, i) => {
      const angle = i * Math.PI * 2 / (variant === 'progress' ? 8 : 4);
      return <mesh key={i} position={[Math.cos(angle) * 2.9, Math.sin(angle) * 2.9, 0]} rotation={[0, 0, angle]}>
        <boxGeometry args={[0.25, variant === 'progress' ? 0.4 + i * 0.12 : 0.25, 0.25]} />
        <meshStandardMaterial color={i % 2 ? palette.amber : palette.accent} emissive={i % 2 ? palette.amber : palette.accent} emissiveIntensity={0.5} />
      </mesh>;
    })}
  </group>;
}

function World({ palette, variant, pointer, motion }: { palette: Palette; variant: ArenaVariant; pointer: React.MutableRefObject<Pointer>; motion: boolean }) {
  const target = useMemo(() => new THREE.Vector3(), []);
  const compact = variant !== 'entrance';
  useFrame(({ camera }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    target.set(6 + (motion ? pointer.current.x * 1.4 : 0), 5 + (motion ? pointer.current.y * 0.7 : 0), compact ? 13 : 15);
    camera.position.lerp(target, 1 - Math.exp(-3 * dt));
    camera.lookAt(compact ? -2.7 : -0.5, 1, 0);
  });
  return <>
    <color attach="background" args={[palette.ground]} />
    <fog attach="fog" args={[palette.ground, 18, 48]} />
    <ambientLight intensity={0.8} />
    <directionalLight position={[2, 8, 6]} intensity={2.5} color={palette.foreground} />
    <pointLight position={[-5, 4, 2]} intensity={35} color={palette.primary} />
    <Environment resolution={64}>
      <Lightformer intensity={3} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} color={palette.foreground} />
      <Lightformer intensity={2} position={[-5, 1, 0]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} color={palette.accent} />
    </Environment>
    <Floor palette={palette} />
    <SkillCore palette={palette} variant={variant} motion={motion} />
    <group position-y={-1.15} rotation-x={-Math.PI / 2}>
      {[3.4, 4.2, 5.8].map((r, i) => <HexFrame key={r} radius={r} color={i === 1 ? palette.amber : palette.primary} rotation={Math.PI / 6} />)}
    </group>
    {[-1, 1].map((side) => <group key={side} position={[side * 8, 0, -4]}>
      {[0, 1, 2, 3].map((i) => <mesh key={i} position={[0, i * 0.12, -i * 4]}>
        <boxGeometry args={[0.08, 5 + i, 0.08]} />
        <meshStandardMaterial color={palette.accent} emissive={palette.accent} emissiveIntensity={1} />
      </mesh>)}
    </group>)}
  </>;
}

export default function ArenaScene({ variant }: { variant: ArenaVariant }) {
  const [palette, setPalette] = useState<Palette | null>(null);
  const [active, setActive] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(true);
  const host = useRef<HTMLDivElement>(null);
  const pointer = useRef<Pointer>({ x: 0, y: 0 });
  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    const token = (name: string) => `hsl(${css.getPropertyValue(name).trim().split(/\s+/).join(', ')})`;
    setPalette({ ground: token('--background'), surface: token('--card'), primary: token('--primary'), accent: token('--accent'), amber: token('--secondary'), foreground: token('--foreground'), border: token('--border') });
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReduced(media.matches);
    const updateVisible = () => setVisible(!document.hidden);
    const move = (e: PointerEvent) => {
      const rect = host.current?.getBoundingClientRect();
      if (!rect) return;
      pointer.current.x = THREE.MathUtils.clamp((e.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
      pointer.current.y = THREE.MathUtils.clamp((e.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
    };
    updateMotion(); updateVisible();
    media.addEventListener('change', updateMotion);
    document.addEventListener('visibilitychange', updateVisible);
    window.addEventListener('pointermove', move, { passive: true });
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { threshold: 0.01 });
    if (host.current) observer.observe(host.current);
    return () => { observer.disconnect(); media.removeEventListener('change', updateMotion); document.removeEventListener('visibilitychange', updateVisible); window.removeEventListener('pointermove', move); };
  }, []);
  return <div ref={host} className="arena-canvas">
    {palette && <Canvas dpr={1} camera={{ position: [6, 5, variant === 'entrance' ? 15 : 13], fov: variant === 'entrance' ? 48 : 40 }} frameloop={active && visible && !reduced ? 'always' : 'demand'} gl={{ antialias: true, powerPreference: 'low-power' }} onCreated={({ gl, camera }) => { camera.lookAt(variant === 'entrance' ? -0.5 : -2.7, 1, 0); gl.domElement.dataset.ready = 'true'; }}>
      <Suspense fallback={null}><World palette={palette} variant={variant} pointer={pointer} motion={!reduced && visible && active} /></Suspense>
    </Canvas>}
  </div>;
}