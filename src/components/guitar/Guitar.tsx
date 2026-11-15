"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  CanvasTexture,
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  type Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PMREMGenerator,
  type PointLight,
  Quaternion,
  Scene,
  Shape,
  SphereGeometry,
  Vector2,
  Vector3,
  type WebGLRenderer,
} from "three";
import {
  BODY_FRONT_Z,
  BRIDGE_Y,
  FRETBOARD_BACK_Z,
  GUITAR_DIMENSIONS as D,
  fretY,
  NECK_FRONT_Z,
  neckWidthAt,
  proceduralAnchors,
  type GuitarAnchors,
} from "./guitarModel";
import { site } from "@/config/site";
import {
  CAMERA_POSES,
  STAGE_SHIFT,
  STAGE_SHIFT_MIN_WIDTH,
  sampleCamera,
  type CameraPose,
  type StopId,
} from "./journey";
import type { PlaybackSignal } from "./playback";

type Palette = {
  bg: Color;
  surface: Color;
  surface2: Color;
  border: Color;
  text: Color;
  textMuted: Color;
  textDim: Color;
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
    textMuted: token("--text-muted"),
    textDim: token("--text-dim"),
    highlight: token("--highlight"),
  };
}

const STRING_SEGMENTS = 48;
const STRING_Z = NECK_FRONT_Z + 0.025;
const MAX_STRING_AMPLITUDE = 0.025;
const STRING_DECAY_PER_SECOND = 3.5;
const FRAME_DELTA_CAP = 1 / 30;
const HEADSTOCK_FACE_Z = NECK_FRONT_Z - 0.02;
const PLAY_LIGHT_INTENSITY = 6;

function clampLitFret(litFret: number, fretCount: number): number | null {
  if (Number.isNaN(litFret) || litFret < 0) return null;
  return Math.min(Math.round(litFret), fretCount - 1);
}

/* ------------------------------------------------------------------------ */
/* Geometry helpers                                                          */
/* ------------------------------------------------------------------------ */

/** A smooth closed outline through `points` (centripetal Catmull-Rom). */
function smoothShape(points: ReadonlyArray<readonly [number, number]>, divisions = 160): Shape {
  const curve = new CatmullRomCurve3(
    points.map(([x, y]) => new Vector3(x, y, 0)),
    true,
    "centripetal",
  );
  return new Shape(curve.getSpacedPoints(divisions).map((p) => new Vector2(p.x, p.y)));
}

function roundedRect(width: number, height: number, radius: number): Shape {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);
  const shape = new Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);
  return shape;
}

// Offset-waist solid body, authored around (0, bodyCenterY). The longer horn
// sits on the bass side (-x); the neck pocket is the flat run at the top.
const BODY_OUTLINE: ReadonlyArray<readonly [number, number]> = [
  [0.16, 1.1],
  [0.36, 1.06],
  [0.52, 1.2],
  [0.68, 1.27],
  [0.83, 1.13],
  [0.88, 0.84],
  [0.88, 0.46],
  [0.74, 0.08],
  [0.8, -0.32],
  [1.0, -0.76],
  [1.01, -1.18],
  [0.82, -1.47],
  [0.36, -1.62],
  [-0.16, -1.63],
  [-0.66, -1.53],
  [-0.98, -1.26],
  [-1.08, -0.86],
  [-0.96, -0.42],
  [-0.8, -0.02],
  [-0.88, 0.4],
  [-0.92, 0.86],
  [-0.86, 1.3],
  [-0.68, 1.55],
  [-0.5, 1.5],
  [-0.38, 1.26],
  [-0.16, 1.1],
];

const PICKGUARD_OUTLINE: ReadonlyArray<readonly [number, number]> = [
  [0.2, 1.06],
  [0.44, 0.96],
  [0.54, 0.68],
  [0.47, 0.34],
  [0.38, 0.04],
  [0.42, -0.34],
  [0.36, -0.6],
  [0.08, -0.68],
  [-0.34, -0.84],
  [-0.7, -0.94],
  [-0.88, -0.74],
  [-0.82, -0.34],
  [-0.66, 0.0],
  [-0.72, 0.42],
  [-0.74, 0.86],
  [-0.62, 1.1],
  [-0.38, 1.08],
];

// Six-in-line headstock, authored from the nut (y = 0) upward; tuners on the bass side.
const HEADSTOCK_OUTLINE: ReadonlyArray<readonly [number, number]> = [
  [0.105, -0.06],
  [0.11, 0.18],
  [0.13, 0.4],
  [0.2, 0.58],
  [0.235, 0.76],
  [0.19, 0.92],
  [0.07, 0.99],
  [-0.06, 1.01],
  [-0.15, 0.95],
  [-0.175, 0.75],
  [-0.165, 0.4],
  [-0.14, 0.15],
  [-0.105, -0.06],
  [0, -0.08],
];

const BODY_BEVEL = 0.06;

/** String x at height y: strings fan out from the nut to the bridge. */
function stringX(index: number, y: number): number {
  const t = D.stringCount > 1 ? index / (D.stringCount - 1) : 0.5;
  const nutX = -0.08 + t * 0.16;
  const bridgeX = -0.11 + t * 0.22;
  const u = (D.nutY - y) / D.scaleLength;
  return nutX + (bridgeX - nutX) * u;
}

function postPosition(index: number): Vector3 {
  // Low E (index 0) winds on the post nearest the nut, high E on the tip.
  return new Vector3(-0.085, D.nutY + 0.22 + index * 0.125, HEADSTOCK_FACE_Z + 0.05);
}

/** A cylinder from `a` to `b`. */
function segmentGeometry(a: Vector3, b: Vector3, radius: number): CylinderGeometry {
  const direction = new Vector3().subVectors(b, a);
  const geometry = new CylinderGeometry(radius, radius, direction.length(), 6, 1, true);
  geometry.applyQuaternion(
    new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()),
  );
  const middle = new Vector3().addVectors(a, b).multiplyScalar(0.5);
  geometry.translate(middle.x, middle.y, middle.z);
  return geometry;
}

function glowTexture(): CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (context) {
    // Grayscale alpha falloff; the material tints it with --highlight.
    const gradient = context.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.4, "rgba(255,255,255,0.35)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  return new CanvasTexture(canvas);
}

type Disposable = { dispose(): void };

/** Creates three.js resources once (single or arrays of them) and disposes them on unmount. */
function useDisposables<T extends Record<string, Disposable | readonly Disposable[]>>(
  factory: () => T,
): T {
  const [resources] = useState(factory);
  useEffect(
    () => () => {
      for (const resource of Object.values(resources)) {
        for (const item of Array.isArray(resource) ? resource : [resource]) item.dispose();
      }
    },
    [resources],
  );
  return resources;
}

function createMaterials(palette: Palette) {
  return {
    // Piano-black gloss: defined by the environment reflections, not by albedo.
    gloss: new MeshPhysicalMaterial({
      color: palette.surface,
      roughness: 0.35,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
    }),
    satin: new MeshStandardMaterial({ color: palette.surface2, roughness: 0.55, metalness: 0 }),
    fretboard: new MeshStandardMaterial({ color: palette.bg, roughness: 0.7, metalness: 0 }),
    pickguard: new MeshStandardMaterial({ color: palette.surface2, roughness: 0.25, metalness: 0 }),
    chrome: new MeshStandardMaterial({ color: palette.textMuted, roughness: 0.22, metalness: 1 }),
    inlay: new MeshStandardMaterial({ color: palette.textMuted, roughness: 0.3, metalness: 0 }),
    bone: new MeshStandardMaterial({ color: palette.textMuted, roughness: 0.45, metalness: 0 }),
    knob: new MeshStandardMaterial({ color: palette.surface2, roughness: 0.3, metalness: 0.2 }),
    litFret: new MeshStandardMaterial({
      color: palette.highlight,
      emissive: palette.highlight,
      emissiveIntensity: 2.2,
      roughness: 0.3,
      metalness: 0.5,
    }),
  };
}

type Materials = ReturnType<typeof createMaterials>;

/* ------------------------------------------------------------------------ */
/* Scene parts                                                               */
/* ------------------------------------------------------------------------ */

/**
 * Bakes a tiny softbox "studio" into a PMREM environment once. The gloss
 * finish is read almost entirely from these reflections.
 */
function StudioEnvironment({ palette }: { palette: Palette }) {
  const gl = useThree((state) => state.gl);
  const studio = useDisposables(() => bakeStudio(gl, palette));
  return <primitive attach="environment" object={studio.target.texture} />;
}

function bakeStudio(gl: WebGLRenderer, palette: Palette) {
  const studio = new Scene();
  const geometry = new PlaneGeometry(1, 1);
  const boxes: Array<{
    size: [number, number];
    at: [number, number, number];
    power: number;
    tilt?: number;
  }> = [
    { size: [1, 8], at: [-5, 1, 4], power: 3 },
    // Narrow diagonal strip in front: the gloss streak across the body face.
    { size: [0.7, 10], at: [2.4, 0.8, 7.6], power: 1.4, tilt: 0.5 },
    { size: [0.6, 8], at: [5, 0, 2], power: 3.5 },
    { size: [4, 4], at: [0, 7, 2], power: 1.6 },
    { size: [6, 6], at: [0, 0, -6], power: 0.3 },
  ];
  const materials = boxes.map(({ size, at, power, tilt = 0 }) => {
    const material = new MeshBasicMaterial({
      color: palette.text.clone().multiplyScalar(power),
      side: DoubleSide,
      toneMapped: false,
    });
    const panel = new Mesh(geometry, material);
    panel.scale.set(size[0], size[1], 1);
    panel.position.set(...at);
    panel.lookAt(0, 0, 0);
    panel.rotateZ(tilt);
    studio.add(panel);
    return material;
  });
  const generator = new PMREMGenerator(gl);
  const target = generator.fromScene(studio, 0.03);
  // The softbox scene is only needed for the bake.
  geometry.dispose();
  for (const material of materials) material.dispose();
  return { target, generator };
}

type GuitarString = {
  mesh: Mesh;
  rest: Float32Array;
  along: Float32Array; // 0 at the nut, 1 at the bridge, per vertex
  frequency: number;
  material: MeshStandardMaterial;
};

function createStrings(palette: Palette): GuitarString[] {
  return Array.from({ length: D.stringCount }, (_, index) => {
    const radius = 0.0095 - index * 0.001;
    const geometry = new CylinderGeometry(radius, radius, 1, 6, STRING_SEGMENTS, true);
    const position = geometry.getAttribute("position") as BufferAttribute;
    const along = new Float32Array(position.count);
    for (let v = 0; v < position.count; v += 1) {
      const u = 0.5 - position.getY(v); // cylinder spans y in [-0.5, 0.5]
      along[v] = u;
      const y = D.nutY - D.scaleLength * u;
      position.setXYZ(v, position.getX(v) + stringX(index, y), y, position.getZ(v) + STRING_Z);
    }
    geometry.computeVertexNormals();
    const material = new MeshStandardMaterial({
      color: palette.textMuted,
      roughness: 0.3,
      metalness: 1,
      emissive: palette.highlight,
      emissiveIntensity: 0,
    });
    return {
      mesh: new Mesh(geometry, material),
      rest: (position.array as Float32Array).slice(),
      along,
      frequency: 34 - index * 3,
      material,
    };
  });
}

function Strings({ signal, palette, reducedMotion }: GuitarStringsProps) {
  const [strings] = useState(() => createStrings(palette));
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
      for (const { mesh, material } of strings) {
        mesh.geometry.dispose();
        material.dispose();
      }
    };
  }, [strings]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, FRAME_DELTA_CAP);
    const level = signal.level;
    const time = state.clock.elapsedTime;
    let active = level > 0;
    strings.forEach(({ mesh, rest, along, frequency, material }, index) => {
      const decayed = (energy.current[index] ?? 0) * Math.exp(-STRING_DECAY_PER_SECOND * delta);
      const value = decayed < 0.002 ? 0 : decayed;
      energy.current[index] = value;
      const energyLevel = Math.max(value, level * 0.35);
      if (energyLevel > 0) active = true;
      // Reduced motion: strings never move; only their glow follows the signal.
      const amplitude = reducedMotion ? 0 : MAX_STRING_AMPLITUDE * energyLevel;
      const attribute = mesh.geometry.getAttribute("position");
      if (!(attribute instanceof BufferAttribute)) return;
      const positions = attribute.array as Float32Array;
      const wave = Math.sin(time * frequency);
      for (let v = 0; v < along.length; v += 1) {
        const u = along[v] ?? 0;
        positions[v * 3] = (rest[v * 3] ?? 0) + amplitude * Math.sin(Math.PI * u) * wave;
      }
      attribute.needsUpdate = true;
      material.emissiveIntensity = Math.min(1, energyLevel * 1.5);
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
      {strings.map(({ mesh }, index) => (
        <primitive key={index} object={mesh} />
      ))}
    </>
  );
}

function Headstock({ palette, materials }: { palette: Palette; materials: Materials }) {
  const geometry = useDisposables(() => {
    const thickness = 0.07;
    const plate = new ExtrudeGeometry(smoothShape(HEADSTOCK_OUTLINE), {
      depth: thickness - 0.02,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 4,
    });
    // Front face at HEADSTOCK_FACE_Z.
    plate.translate(0, D.nutY, HEADSTOCK_FACE_Z - (thickness - 0.01));
    const runs = Array.from({ length: D.stringCount }, (_, index) => {
      const from = new Vector3(stringX(index, D.nutY), D.nutY, STRING_Z);
      return segmentGeometry(from, postPosition(index), 0.0095 - index * 0.001);
    });
    return {
      plate,
      runs,
      post: new CylinderGeometry(0.016, 0.016, 0.07, 16).rotateX(Math.PI / 2),
      bushing: new CylinderGeometry(0.03, 0.032, 0.012, 24).rotateX(Math.PI / 2),
      shaft: new CylinderGeometry(0.009, 0.009, 0.07, 10).rotateZ(Math.PI / 2),
      button: new SphereGeometry(1, 20, 12),
      nut: new BoxGeometry(D.neckWidthAtNut, 0.025, 0.03),
    };
  });

  return (
    <group>
      <mesh geometry={geometry.plate} material={materials.gloss} />
      <HeadstockLogo palette={palette} />
      <mesh
        geometry={geometry.nut}
        material={materials.bone}
        position={[0, D.nutY, NECK_FRONT_Z + 0.005]}
      />
      {geometry.runs.map((run, index) => {
        const post = postPosition(index);
        const backZ = HEADSTOCK_FACE_Z - 0.06;
        return (
          <group key={index}>
            <mesh geometry={run} material={materials.chrome} />
            <mesh
              geometry={geometry.post}
              material={materials.chrome}
              position={[post.x, post.y, HEADSTOCK_FACE_Z + 0.035]}
            />
            <mesh
              geometry={geometry.bushing}
              material={materials.chrome}
              position={[post.x, post.y, HEADSTOCK_FACE_Z + 0.006]}
            />
            <mesh
              geometry={geometry.shaft}
              material={materials.chrome}
              position={[-0.2, post.y, backZ]}
            />
            <mesh
              geometry={geometry.button}
              material={materials.chrome}
              position={[-0.255, post.y, backZ]}
              scale={[0.042, 0.03, 0.013]}
            />
          </group>
        );
      })}
    </group>
  );
}

/**
 * The wordmark silkscreened on the headstock, drawn with the brand blackletter
 * once the web font is ready (the only place the 3D scene uses it).
 */
function HeadstockLogo({ palette }: { palette: Palette }) {
  const [texture, setTexture] = useState<CanvasTexture | null>(null);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    let cancelled = false;
    let created: CanvasTexture | null = null;
    const family =
      getComputedStyle(document.body).getPropertyValue("--font-bandland-gothic").trim() || "serif";
    const font = `700 96px ${family}`;
    const draw = () => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 128;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.font = font;
      // Read as an alpha mask only; the material tints it.
      context.fillStyle = palette.text.getStyle();
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(site.name, 256, 70, 492);
      created = new CanvasTexture(canvas);
      created.anisotropy = 4;
      setTexture(created);
      invalidate();
    };
    document.fonts.load(font).then(draw, draw);
    return () => {
      cancelled = true;
      created?.dispose();
    };
  }, [invalidate, palette]);

  if (!texture) return null;
  return (
    <mesh
      position={[0.115, D.nutY + 0.66, HEADSTOCK_FACE_Z + 0.001]}
      rotation={[0, 0, Math.PI / 2]}
    >
      <planeGeometry args={[0.42, 0.105]} />
      <meshStandardMaterial
        color={palette.textMuted}
        alphaMap={texture}
        transparent
        roughness={0.45}
        depthWrite={false}
      />
    </mesh>
  );
}

const INLAY_FRETS = [3, 5, 7, 9, 15, 17, 19, 21];

function Neck({
  palette,
  materials,
  anchors,
  litFret,
}: {
  palette: Palette;
  materials: Materials;
  anchors: GuitarAnchors;
  litFret: number;
}) {
  const lit = clampLitFret(litFret, anchors.fretCount);
  const geometry = useDisposables(() => {
    const height = D.nutY - D.neckBottomY;
    const centerY = D.nutY - height / 2;
    // Fretboard: a thin slab tapered per vertex from the nut to the body end.
    const board = new BoxGeometry(1, height, D.fretboardThickness);
    board.translate(0, centerY, FRETBOARD_BACK_Z + D.fretboardThickness / 2);
    const position = board.getAttribute("position") as BufferAttribute;
    for (let v = 0; v < position.count; v += 1) {
      position.setX(v, position.getX(v) * neckWidthAt(position.getY(v)));
    }
    board.computeVertexNormals();
    // Neck back: half a tapered cylinder, flattened to a C profile.
    const back = new CylinderGeometry(
      D.neckWidthAtNut / 2,
      D.neckWidthAtEnd / 2,
      height,
      24,
      1,
      false,
      Math.PI / 2,
      Math.PI,
    );
    back.scale(1, 1, 0.85);
    back.translate(0, centerY, FRETBOARD_BACK_Z);
    return {
      board,
      back,
      fret: new CylinderGeometry(0.007, 0.007, 1, 8).rotateZ(Math.PI / 2),
      dot: new CircleGeometry(0.026, 24),
      glow: new PlaneGeometry(1, 1),
    };
  });
  const glow = useDisposables(() => {
    const map = glowTexture();
    return {
      map,
      material: new MeshBasicMaterial({
        color: palette.highlight,
        map,
        transparent: true,
        opacity: 0.6,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    };
  });

  const inlayY = (fret: number) => (fretY(fret - 1) + fretY(fret)) / 2;
  const litY = lit === null ? null : anchors.fretPosition(lit)[1];

  return (
    <group>
      <mesh geometry={geometry.back} material={materials.satin} />
      <mesh geometry={geometry.board} material={materials.fretboard} />
      {Array.from({ length: D.totalFrets }, (_, index) => {
        const y = fretY(index + 1);
        return (
          <mesh
            key={index}
            geometry={geometry.fret}
            material={index === lit ? materials.litFret : materials.chrome}
            position={[0, y, NECK_FRONT_Z + 0.002]}
            scale={[neckWidthAt(y), 1, 1]}
          />
        );
      })}
      {INLAY_FRETS.map((fret) => (
        <mesh
          key={fret}
          geometry={geometry.dot}
          material={materials.inlay}
          position={[0, inlayY(fret), NECK_FRONT_Z + 0.0005]}
        />
      ))}
      {[-0.06, 0.06].map((x) => (
        <mesh
          key={x}
          geometry={geometry.dot}
          material={materials.inlay}
          position={[x, inlayY(12), NECK_FRONT_Z + 0.0005]}
        />
      ))}
      {litY === null ? null : (
        <mesh
          geometry={geometry.glow}
          material={glow.material}
          position={[0, litY, NECK_FRONT_Z + 0.012]}
          scale={[neckWidthAt(litY) * 2.2, 0.2, 1]}
        />
      )}
    </group>
  );
}

function Body({
  signal,
  palette,
  materials,
  reducedMotion,
}: {
  signal: PlaybackSignal;
  palette: Palette;
  materials: Materials;
  reducedMotion: boolean;
}) {
  const body = useRef<Group>(null);
  const playLight = useRef<PointLight>(null);
  const geometry = useDisposables(() => {
    const shell = new ExtrudeGeometry(smoothShape(BODY_OUTLINE), {
      depth: D.bodyDepth - BODY_BEVEL * 2,
      bevelEnabled: true,
      bevelThickness: BODY_BEVEL,
      bevelSize: BODY_BEVEL,
      bevelSegments: 8,
    });
    shell.translate(0, 0, BODY_BEVEL); // front face lands on BODY_FRONT_Z
    const guard = new ExtrudeGeometry(smoothShape(PICKGUARD_OUTLINE), {
      depth: 0.004,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.004,
      bevelSegments: 2,
    });
    guard.translate(0, 0, BODY_FRONT_Z);
    const pickup = new ExtrudeGeometry(roundedRect(0.44, 0.13, 0.05), {
      depth: 0.03,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 3,
    });
    return {
      shell,
      guard,
      pickup,
      pole: new CircleGeometry(0.012, 16),
      bridgeBlock: new BoxGeometry(0.44, 0.15, 0.05),
      saddle: new BoxGeometry(0.04, 0.07, 0.03),
      knob: new CylinderGeometry(0.056, 0.06, 0.06, 32).rotateX(Math.PI / 2),
      knobCap: new CircleGeometry(0.036, 32),
      switchTip: new SphereGeometry(0.02, 16, 10),
    };
  });
  const pickupMaterials = useRef<Array<MeshStandardMaterial | null>>([]);

  useFrame(() => {
    const level = reducedMotion ? 0 : signal.level;
    if (body.current) body.current.scale.setScalar(1 + 0.02 * level);
    for (const material of pickupMaterials.current) {
      if (material) material.emissiveIntensity = level * 0.8;
    }
    if (playLight.current) playLight.current.intensity = PLAY_LIGHT_INTENSITY * level;
  });

  const localY = (y: number) => y - D.bodyCenterY;
  const pickups = [D.neckPickupY, D.bridgePickupY];
  const bodyTop = BODY_FRONT_Z + 0.004;

  return (
    <group ref={body} position={[0, D.bodyCenterY, 0]}>
      <mesh geometry={geometry.shell} material={materials.gloss} />
      <mesh geometry={geometry.guard} material={materials.pickguard} />
      {pickups.map((y, pickupIndex) => (
        <group key={y} position={[0, localY(y), bodyTop]}>
          <mesh geometry={geometry.pickup}>
            <meshStandardMaterial
              ref={(material: MeshStandardMaterial | null) => {
                pickupMaterials.current[pickupIndex] = material;
              }}
              color={palette.surface2}
              roughness={0.4}
              emissive={palette.highlight}
              emissiveIntensity={0}
            />
          </mesh>
          {Array.from({ length: D.stringCount }, (_, index) => (
            <mesh
              key={index}
              geometry={geometry.pole}
              material={materials.chrome}
              position={[stringX(index, y), 0, 0.0385]}
            />
          ))}
        </group>
      ))}
      <group position={[0, localY(BRIDGE_Y), 0]}>
        <mesh
          geometry={geometry.bridgeBlock}
          material={materials.chrome}
          position={[0, 0, BODY_FRONT_Z + 0.025]}
        />
        {Array.from({ length: D.stringCount }, (_, index) => (
          <mesh
            key={index}
            geometry={geometry.saddle}
            material={materials.chrome}
            position={[stringX(index, BRIDGE_Y), 0.01, STRING_Z - 0.03]}
          />
        ))}
      </group>
      {[
        [0.7, -0.95],
        [0.84, -0.6],
      ].map(([x = 0, y = 0]) => (
        <group key={`${x}`} position={[x, y, bodyTop + 0.03]}>
          <mesh geometry={geometry.knob} material={materials.knob} />
          <mesh geometry={geometry.knobCap} material={materials.chrome} position={[0, 0, 0.031]} />
        </group>
      ))}
      <mesh
        geometry={geometry.switchTip}
        material={materials.bone}
        position={[0.62, 0.62, bodyTop + 0.02]}
      />
      {/* Play state: a warm under-light that only exists while the signal is live. */}
      <pointLight
        ref={playLight}
        color={palette.highlight}
        intensity={0}
        distance={6}
        position={[0, -1.9, 0.7]}
      />
    </group>
  );
}

type GuitarStringsProps = { signal: PlaybackSignal; palette: Palette; reducedMotion: boolean };

export function Guitar({
  signal,
  palette,
  litFret,
  reducedMotion,
  anchors = proceduralAnchors,
}: {
  signal: PlaybackSignal;
  palette: Palette;
  litFret: number;
  reducedMotion: boolean;
  anchors?: GuitarAnchors;
}) {
  const materials = useDisposables(() => createMaterials(palette));
  return (
    <group>
      <Body signal={signal} palette={palette} materials={materials} reducedMotion={reducedMotion} />
      <Neck palette={palette} materials={materials} anchors={anchors} litFret={litFret} />
      <Headstock palette={palette} materials={materials} />
      <Strings signal={signal} palette={palette} reducedMotion={reducedMotion} />
    </group>
  );
}

/**
 * Camera goal for the stage: reduced motion pins the hero pose and ignores scroll.
 * At the neck stop, `fretY` (the lit fret's height) slides the camera along the
 * neck so the lit fret stays in frame; the shift fades out away from that stop.
 */
export function stagePose(
  route: readonly StopId[],
  position: number,
  reducedMotion: boolean,
  fretY: number | null = null,
): CameraPose {
  if (reducedMotion) return CAMERA_POSES.hero;
  const pose = sampleCamera(route, position);
  const neckIndex = route.indexOf("neck");
  if (fretY === null || neckIndex < 0) return pose;
  const weight = Math.max(0, 1 - Math.abs(position - neckIndex));
  const dy = (fretY - CAMERA_POSES.neck.target[1]) * weight;
  if (dy === 0) return pose;
  const [px, py, pz] = pose.position;
  const [tx, ty, tz] = pose.target;
  return { position: [px, py + dy, pz], target: [tx, ty + dy, tz] };
}

function CameraRig({
  route,
  position,
  reducedMotion,
  litFret,
  anchors = proceduralAnchors,
}: {
  route: readonly StopId[];
  position: number;
  reducedMotion: boolean;
  litFret: number;
  anchors?: GuitarAnchors;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const lookAt = useRef(new Vector3(...CAMERA_POSES.hero.target));
  const goalPosition = useRef(new Vector3());
  const goalTarget = useRef(new Vector3());

  useEffect(() => {
    invalidate();
  }, [route, position, reducedMotion, litFret, invalidate]);

  const fret = clampLitFret(litFret, anchors.fretCount);
  const fretY = fret === null ? null : anchors.fretPosition(fret)[1];

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, FRAME_DELTA_CAP);
    const pose = stagePose(route, position, reducedMotion, fretY);
    goalPosition.current.set(...pose.position);
    goalTarget.current.set(...pose.target);
    // Reduced motion snaps straight to the pose instead of easing (no scrub).
    const k = reducedMotion ? 1 : 1 - Math.exp(-delta * 6);
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

/** Slides the render sideways (an off-axis projection) without moving the camera. */
function ViewShift() {
  const camera = useThree((state) => state.camera);
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    if (width >= STAGE_SHIFT_MIN_WIDTH) {
      camera.setViewOffset(width, height, -STAGE_SHIFT * width, 0, width, height);
    } else {
      camera.clearViewOffset();
    }
    invalidate();
  }, [camera, width, height, invalidate]);
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

/** Reports once that a frame has been drawn, so the poster underneath can fade out. */
function FirstFrame({ onReady }: { onReady?: (() => void) | undefined }) {
  const reported = useRef(false);
  useFrame(() => {
    if (reported.current) return;
    reported.current = true;
    if (onReady) window.requestAnimationFrame(onReady);
  });
  return null;
}

export type GuitarCanvasProps = {
  signal: PlaybackSignal;
  route: readonly StopId[];
  position: number;
  litFret: number;
  active: boolean;
  reducedMotion: boolean;
  onContextLost: () => void;
  onReady?: () => void;
};

export function GuitarCanvas({
  signal,
  route,
  position,
  litFret,
  active,
  reducedMotion,
  onContextLost,
  onReady,
}: GuitarCanvasProps) {
  const [palette] = useState(readPalette);
  const detachContextLost = useRef<(() => void) | null>(null);

  // R3F forces a context loss on the old canvas after unmount; that must not
  // be reported as a real loss, so the listener goes away with the component.
  useEffect(() => {
    return () => {
      detachContextLost.current?.();
      detachContextLost.current = null;
    };
  }, []);

  const playing = useSyncExternalStore(
    signal.subscribe,
    () => signal.playing,
    () => false,
  );
  // Render on demand while idle, continuously while playing, never while hidden.
  // Reduced motion stays on demand: the strings request frames while they glow.
  const frameloop = !active ? "never" : playing && !reducedMotion ? "always" : "demand";

  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, 2]}
      camera={{ position: CAMERA_POSES.hero.position, fov: 35, near: 0.1, far: 40 }}
      // Transparent: the stage backdrop (light pool, floor, vignette) is CSS, shared with the poster.
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      fallback={null}
      onCreated={({ gl, scene }) => {
        gl.toneMappingExposure = 1.15;
        scene.environmentIntensity = 0.7;
        const element = gl.domElement;
        detachContextLost.current?.();
        element.addEventListener("webglcontextlost", onContextLost);
        detachContextLost.current = () =>
          element.removeEventListener("webglcontextlost", onContextLost);
      }}
    >
      <StudioEnvironment palette={palette} />
      {/* Key from the upper left, two rims from behind to trace the bevels. */}
      <directionalLight color={palette.text} position={[-3.5, 5, 6]} intensity={1.6} />
      <directionalLight color={palette.text} position={[4.5, 2, -3]} intensity={3.2} />
      <directionalLight color={palette.text} position={[-4, -2, -3.5]} intensity={1.8} />
      <Invalidator deps={[active, litFret, reducedMotion]} />
      <CameraRig
        route={route}
        position={position}
        reducedMotion={reducedMotion}
        litFret={litFret}
      />
      <Guitar signal={signal} palette={palette} litFret={litFret} reducedMotion={reducedMotion} />
      <ViewShift />
      <FirstFrame onReady={onReady} />
    </Canvas>
  );
}
