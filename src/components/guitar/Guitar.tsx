"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  ExtrudeGeometry,
  Line,
  LineBasicMaterial,
  type Group,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
  Shape,
  Vector3,
} from "three";
import {
  BODY_FRONT_Z,
  BRIDGE_Y,
  GUITAR_DIMENSIONS as D,
  NECK_FRONT_Z,
  proceduralAnchors,
  type GuitarAnchors,
} from "./guitarModel";
import { CAMERA_POSES, sampleCamera, type StopId } from "./journey";
import type { PlaybackSignal } from "./playback";

type Palette = {
  bg: Color;
  surface: Color;
  surface2: Color;
  border: Color;
  text: Color;
  highlight: Color;
};

// Materials read the design tokens once at mount; no colors are defined here.
function readPalette(): Palette {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string) => {
    const color = new Color();
    const value = styles.getPropertyValue(name).trim();
    if (value) color.setStyle(value);
    return color;
  };
  return {
    bg: token("--bg"),
    surface: token("--surface"),
    surface2: token("--surface-2"),
    border: token("--border"),
    text: token("--text"),
    highlight: token("--highlight"),
  };
}

const STRING_SEGMENTS = 48;
const STRING_Z = NECK_FRONT_Z + 0.02;
const MAX_STRING_AMPLITUDE = 0.025;
const STRING_DECAY_PER_SECOND = 3.5;
const FRAME_DELTA_CAP = 1 / 30;

function clampLitFret(litFret: number, fretCount: number): number | null {
  if (Number.isNaN(litFret) || litFret < 0) return null;
  return Math.min(Math.round(litFret), fretCount - 1);
}

function createBodyGeometry(): ExtrudeGeometry {
  // Figure-eight outline centered on the body; lower bout wider than the upper.
  const shape = new Shape();
  shape.moveTo(0, -1.3);
  shape.bezierCurveTo(0.6, -1.3, 0.95, -1.0, 0.95, -0.5);
  shape.bezierCurveTo(0.95, -0.1, 0.6, 0.0, 0.6, 0.2);
  shape.bezierCurveTo(0.6, 0.45, 0.78, 0.55, 0.75, 0.75);
  shape.bezierCurveTo(0.72, 1.05, 0.35, 1.15, 0, 1.15);
  shape.bezierCurveTo(-0.35, 1.15, -0.72, 1.05, -0.75, 0.75);
  shape.bezierCurveTo(-0.78, 0.55, -0.6, 0.45, -0.6, 0.2);
  shape.bezierCurveTo(-0.6, 0.0, -0.95, -0.1, -0.95, -0.5);
  shape.bezierCurveTo(-0.95, -1.0, -0.6, -1.3, 0, -1.3);
  return new ExtrudeGeometry(shape, {
    depth: D.bodyDepth - 0.04,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3,
    curveSegments: 32,
  });
}

type GuitarString = { line: Line; rest: Float32Array; frequency: number };

function createStrings(color: Color): GuitarString[] {
  return Array.from({ length: D.stringCount }, (_, index) => {
    const t = D.stringCount > 1 ? index / (D.stringCount - 1) : 0.5;
    const nutX = -0.08 + t * 0.16;
    const bridgeX = -0.15 + t * 0.3;
    const rest = new Float32Array((STRING_SEGMENTS + 1) * 3);
    for (let s = 0; s <= STRING_SEGMENTS; s += 1) {
      const u = s / STRING_SEGMENTS;
      rest[s * 3] = nutX + (bridgeX - nutX) * u;
      rest[s * 3 + 1] = D.nutY + (BRIDGE_Y - D.nutY) * u;
      rest[s * 3 + 2] = STRING_Z;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(rest.slice(), 3));
    const material = new LineBasicMaterial({ color, transparent: true, opacity: 0.6 });
    return { line: new Line(geometry, material), rest, frequency: 34 - index * 3 };
  });
}

function Strings({ signal, palette }: { signal: PlaybackSignal; palette: Palette }) {
  const [strings] = useState(() => createStrings(palette.text));
  const energy = useRef<number[]>(Array.from({ length: D.stringCount }, () => 0));
  const plucks = useRef(0);
  const settled = useRef(true);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    // The signal does not say which string was plucked, so plucks walk a fixed
    // pattern across the strings whenever the envelope is re-triggered.
    return signal.subscribe(() => {
      if (signal.level >= 0.999) {
        const index = (plucks.current * 7 + 2) % D.stringCount;
        plucks.current += 1;
        energy.current[index] = 1;
      }
      invalidate();
    });
  }, [signal, invalidate]);

  useEffect(() => {
    return () => {
      for (const { line } of strings) {
        line.geometry.dispose();
        (line.material as LineBasicMaterial).dispose();
      }
    };
  }, [strings]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, FRAME_DELTA_CAP);
    const level = signal.level;
    const time = state.clock.elapsedTime;
    let active = level > 0;
    strings.forEach(({ line, rest, frequency }, index) => {
      const decayed = (energy.current[index] ?? 0) * Math.exp(-STRING_DECAY_PER_SECOND * delta);
      const value = decayed < 0.002 ? 0 : decayed;
      energy.current[index] = value;
      const amplitude = MAX_STRING_AMPLITUDE * Math.max(value, level * 0.35);
      if (amplitude > 0) active = true;
      const attribute = line.geometry.getAttribute("position");
      if (!(attribute instanceof BufferAttribute)) return;
      const positions = attribute.array as Float32Array;
      const wave = Math.sin(time * frequency);
      for (let s = 0; s <= STRING_SEGMENTS; s += 1) {
        const u = s / STRING_SEGMENTS;
        positions[s * 3] = (rest[s * 3] ?? 0) + amplitude * Math.sin(Math.PI * u) * wave;
      }
      attribute.needsUpdate = true;
      (line.material as LineBasicMaterial).opacity = 0.6 + 0.4 * Math.min(1, amplitude * 60);
    });
    if (active) {
      settled.current = false;
      state.invalidate();
    } else if (!settled.current) {
      settled.current = true;
      state.invalidate(); // one more frame to draw the strings at rest
    }
  });

  return (
    <>
      {strings.map(({ line }, index) => (
        <primitive key={index} object={line} />
      ))}
    </>
  );
}

function Headstock({ signal, palette, anchors }: GuitarPartProps) {
  const pegs = useRef<Group>(null);
  const ring = useRef<Group>(null);
  const ringMaterial = useRef<MeshBasicMaterial>(null);
  const height = D.headstockTopY - D.nutY;
  const centerY = D.nutY + height / 2;
  const pegYs = [0.2, 0.42, 0.64].map((offset) => D.nutY + offset);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, FRAME_DELTA_CAP);
    const level = signal.level;
    if (pegs.current && signal.playing) {
      for (const peg of pegs.current.children) peg.rotation.y += delta * 0.6;
    }
    if (ring.current) ring.current.scale.setScalar(1 + level * 0.5);
    if (ringMaterial.current) ringMaterial.current.opacity = level * 0.8;
  });

  return (
    <group>
      <mesh position={[0, centerY, NECK_FRONT_Z - 0.04]}>
        <boxGeometry args={[D.headstockWidth, height, 0.08]} />
        <meshStandardMaterial color={palette.surface2} roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh position={[0, D.nutY, NECK_FRONT_Z + 0.005]}>
        <boxGeometry args={[D.neckWidth, 0.03, 0.03]} />
        <meshStandardMaterial color={palette.border} roughness={0.6} />
      </mesh>
      <group ref={pegs}>
        {pegYs.flatMap((y) =>
          [-1, 1].map((side) => (
            <mesh
              key={`${side}-${y}`}
              position={[side * (D.headstockWidth / 2 + 0.07), y, NECK_FRONT_Z - 0.04]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.03, 0.03, 0.14, 12]} />
              <meshStandardMaterial color={palette.border} roughness={0.4} metalness={0.6} />
            </mesh>
          )),
        )}
      </group>
      <group
        ref={ring}
        position={[anchors.headstock[0], anchors.headstock[1], anchors.headstock[2] + 0.01]}
      >
        <mesh>
          <ringGeometry args={[0.3, 0.32, 64]} />
          <meshBasicMaterial
            ref={ringMaterial}
            color={palette.highlight}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}

function Neck({ palette, anchors, litFret }: GuitarPartProps & { litFret: number }) {
  const lit = clampLitFret(litFret, anchors.fretCount);
  const height = D.nutY - D.neckBottomY;
  return (
    <group>
      <mesh position={[0, D.neckBottomY + height / 2, BODY_FRONT_Z + D.neckDepth / 2]}>
        <boxGeometry args={[D.neckWidth, height, D.neckDepth]} />
        <meshStandardMaterial color={palette.surface2} roughness={0.85} metalness={0.05} />
      </mesh>
      {Array.from({ length: anchors.fretCount }, (_, index) => {
        const [x, y, z] = anchors.fretPosition(index);
        const isLit = index === lit;
        return (
          <mesh key={index} position={[x, y, z + 0.006]}>
            <boxGeometry args={[D.neckWidth, 0.014, 0.012]} />
            <meshStandardMaterial
              color={isLit ? palette.highlight : palette.border}
              emissive={palette.highlight}
              emissiveIntensity={isLit ? 1.4 : 0}
              roughness={0.4}
              metalness={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Body({ signal, palette, anchors }: GuitarPartProps) {
  const body = useRef<Group>(null);
  const pickupMaterials = useRef<Array<MeshStandardMaterial | null>>([]);
  const [geometry] = useState(createBodyGeometry);
  const pickupYs = [-1.75, -2.05];

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    const level = signal.level;
    if (body.current) body.current.scale.setScalar(1 + 0.02 * level);
    for (const material of pickupMaterials.current) {
      if (material) material.emissiveIntensity = level * 1.6;
    }
  });

  return (
    <group ref={body} position={[0, D.bodyCenterY, 0]}>
      <mesh geometry={geometry} position={[0, 0, 0.02]}>
        <meshStandardMaterial color={palette.surface} roughness={0.9} metalness={0.05} />
      </mesh>
      <group
        position={[
          anchors.soundHole[0],
          anchors.soundHole[1] - D.bodyCenterY,
          BODY_FRONT_Z + 0.003,
        ]}
      >
        <mesh>
          <circleGeometry args={[0.24, 48]} />
          <meshBasicMaterial color={palette.bg} />
        </mesh>
        <mesh position={[0, 0, 0.001]}>
          <ringGeometry args={[0.26, 0.3, 48]} />
          <meshStandardMaterial color={palette.border} roughness={0.6} />
        </mesh>
      </group>
      {pickupYs.map((y, index) => (
        <mesh key={y} position={[0, y - D.bodyCenterY, BODY_FRONT_Z + 0.02]}>
          <boxGeometry args={[0.62, 0.14, 0.04]} />
          <meshStandardMaterial
            ref={(material: MeshStandardMaterial | null) => {
              pickupMaterials.current[index] = material;
            }}
            color={palette.surface2}
            emissive={palette.highlight}
            emissiveIntensity={0}
            roughness={0.5}
          />
        </mesh>
      ))}
      <mesh position={[0, BRIDGE_Y - D.bodyCenterY, BODY_FRONT_Z + 0.03]}>
        <boxGeometry args={[0.5, 0.08, 0.06]} />
        <meshStandardMaterial color={palette.surface2} roughness={0.7} />
      </mesh>
    </group>
  );
}

type GuitarPartProps = { signal: PlaybackSignal; palette: Palette; anchors: GuitarAnchors };

export function Guitar({
  signal,
  palette,
  litFret,
  anchors = proceduralAnchors,
}: {
  signal: PlaybackSignal;
  palette: Palette;
  litFret: number;
  anchors?: GuitarAnchors;
}) {
  return (
    <group>
      <Body signal={signal} palette={palette} anchors={anchors} />
      <Neck signal={signal} palette={palette} anchors={anchors} litFret={litFret} />
      <Headstock signal={signal} palette={palette} anchors={anchors} />
      <Strings signal={signal} palette={palette} />
    </group>
  );
}

function CameraRig({ route, position }: { route: readonly StopId[]; position: number }) {
  const invalidate = useThree((state) => state.invalidate);
  const lookAt = useRef(new Vector3(...CAMERA_POSES.hero.target));
  const goalPosition = useRef(new Vector3());
  const goalTarget = useRef(new Vector3());

  useEffect(() => {
    invalidate();
  }, [route, position, invalidate]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, FRAME_DELTA_CAP);
    const pose = sampleCamera(route, position);
    goalPosition.current.set(...pose.position);
    goalTarget.current.set(...pose.target);
    const k = 1 - Math.exp(-delta * 6);
    state.camera.position.lerp(goalPosition.current, k);
    lookAt.current.lerp(goalTarget.current, k);
    state.camera.lookAt(lookAt.current);
    const moving =
      state.camera.position.distanceToSquared(goalPosition.current) > 1e-6 ||
      lookAt.current.distanceToSquared(goalTarget.current) > 1e-6;
    if (moving) state.invalidate();
  });

  return null;
}

function Invalidator({ deps }: { deps: readonly unknown[] }) {
  const invalidate = useThree((state) => state.invalidate);
  const key = deps.map(String).join("|");
  useEffect(() => {
    invalidate();
  }, [key, invalidate]);
  return null;
}

export type GuitarCanvasProps = {
  signal: PlaybackSignal;
  route: readonly StopId[];
  position: number;
  litFret: number;
  active: boolean;
  onContextLost: () => void;
};

export function GuitarCanvas({
  signal,
  route,
  position,
  litFret,
  active,
  onContextLost,
}: GuitarCanvasProps) {
  const [palette] = useState(readPalette);
  const playing = useSyncExternalStore(
    signal.subscribe,
    () => signal.playing,
    () => false,
  );
  // Render on demand while idle, continuously while playing, never while hidden.
  const frameloop = !active ? "never" : playing ? "always" : "demand";

  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, 2]}
      camera={{ position: CAMERA_POSES.hero.position, fov: 35, near: 0.1, far: 40 }}
      gl={{ antialias: true, powerPreference: "low-power" }}
      fallback={null}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", onContextLost, { once: true });
      }}
    >
      <color attach="background" args={[palette.bg]} />
      <fog attach="fog" args={[palette.bg, 6, 14]} />
      <ambientLight color={palette.text} intensity={0.12} />
      <directionalLight color={palette.text} position={[3, 4, 5]} intensity={1.3} />
      <directionalLight color={palette.text} position={[-4, 2, -4]} intensity={0.9} />
      <Invalidator deps={[active, litFret]} />
      <CameraRig route={route} position={position} />
      <Guitar signal={signal} palette={palette} litFret={litFret} />
    </Canvas>
  );
}
