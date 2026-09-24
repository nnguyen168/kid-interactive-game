"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, N8AO, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { game } from "./game";
import { WorldDef } from "./types";

const lookAt = new THREE.Vector3();
const wanted = new THREE.Vector3();

/** Third-person camera that smoothly trails the hero. */
export function CameraRig({ world }: { world: WorldDef }) {
  const look = useRef(new THREE.Vector3(...world.spawn));
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(world.spawn[0], world.camera.height + 6, world.spawn[2] + world.camera.distance + 8);
  }, [camera, world]);

  useFrame(({ size }, delta) => {
    const dt = Math.min(delta, 0.1);
    // Pull back on tall/narrow screens so the world still fits side to side.
    const zoom = THREE.MathUtils.clamp(1.45 / (size.width / size.height), 1, 1.8);
    wanted.set(game.hero.x, game.hero.y + world.camera.height * zoom, game.hero.z + world.camera.distance * zoom);
    camera.position.lerp(wanted, 1 - Math.exp(-dt * 3.2));
    lookAt.set(game.hero.x, game.hero.y + 1.4, game.hero.z - 3);
    look.current.lerp(lookAt, 1 - Math.exp(-dt * 5));
    camera.lookAt(look.current);
  });
  return null;
}

/** Warm key light that follows the hero so shadows stay crisp everywhere. */
export function Lights({ sun = "#fff8ec", intensity = 2.6 }: { sun?: string; intensity?: number }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const { scene } = useThree();

  useEffect(() => {
    const l = light.current;
    if (!l) return;
    scene.add(l.target);
    return () => {
      scene.remove(l.target);
    };
  }, [scene]);

  useFrame(() => {
    const l = light.current;
    if (!l) return;
    l.position.set(game.hero.x + 14, 26, game.hero.z + 10);
    l.target.position.set(game.hero.x, 0, game.hero.z);
  });

  return (
    <>
      <hemisphereLight args={["#dff3ff", "#7a8f5a", 1.35]} />
      <directionalLight
        ref={light}
        color={sun}
        intensity={intensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-radius={3}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-near={1}
        shadow-camera-far={70}
      />
    </>
  );
}

const SKY_VERTEX = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const SKY_FRAGMENT = /* glsl */ `
uniform vec3 top;
uniform vec3 horizon;
uniform vec3 sunDir;
varying vec3 vDir;
void main() {
  float h = clamp(vDir.y, 0.0, 1.0);
  vec3 col = mix(horizon, top, pow(h, 0.55));
  float sun = max(dot(normalize(vDir), normalize(sunDir)), 0.0);
  col += vec3(1.0, 0.92, 0.7) * (pow(sun, 350.0) * 1.4 + pow(sun, 12.0) * 0.18);
  gl_FragColor = vec4(col, 1.0);
}`;

/** Painted gradient sky with a soft sun glow. */
export function SkyDome({ top, horizon }: { top: string; horizon: string }) {
  const uniforms = useMemo(
    () => ({
      top: { value: new THREE.Color(top) },
      horizon: { value: new THREE.Color(horizon) },
      sunDir: { value: new THREE.Vector3(0.5, 0.35, -1) },
    }),
    [top, horizon],
  );
  return (
    <mesh scale={260} renderOrder={-1}>
      <sphereGeometry args={[1, 32, 16]} />
      <shaderMaterial
        vertexShader={SKY_VERTEX}
        fragmentShader={SKY_FRAGMENT}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}

/** Invisible floor that turns taps and drags into a walk target, plus the target marker. */
export function GroundClick() {
  const pressing = useRef(false);
  const marker = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const floor = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const release = () => {
      pressing.current = false;
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, []);

  function aim(point: THREE.Vector3) {
    if (game.paused || game.cinematic) return;
    game.target = new THREE.Vector3(point.x, 0, point.z);
  }

  useFrame(({ clock }) => {
    // The invisible floor rises to the rooftop when the hero is up there.
    if (floor.current) floor.current.position.y = (game.zone?.y ?? 0) + 0.01;
    const m = marker.current;
    if (!m) return;
    m.visible = game.target !== null;
    if (game.target) {
      m.position.set(game.target.x, (game.zone?.y ?? 0) + 0.06, game.target.z);
      const pulse = 1 + Math.sin(clock.elapsedTime * 8) * 0.12;
      ring.current?.scale.setScalar(pulse);
    }
  });

  return (
    <>
      <mesh
        ref={floor}
        rotation-x={-Math.PI / 2}
        position-y={0.01}
        onPointerDown={(e) => {
          pressing.current = true;
          aim(e.point);
        }}
        onPointerMove={(e) => {
          if (pressing.current) aim(e.point);
        }}
      >
        <planeGeometry args={[400, 400]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>
      <group ref={marker} visible={false}>
        <mesh ref={ring} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.45, 0.62, 40]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} toneMapped={false} depthWrite={false} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.2, 24]} />
          <meshBasicMaterial color="#fde047" toneMapped={false} depthWrite={false} />
        </mesh>
      </group>
    </>
  );
}

/** Keyboard arrows / WASD for grown-ups on a computer. */
export function useKeyboardControls() {
  useEffect(() => {
    const map: Record<string, keyof typeof game.keys> = {
      ArrowUp: "up",
      KeyW: "up",
      ArrowDown: "down",
      KeyS: "down",
      ArrowLeft: "left",
      KeyA: "left",
      ArrowRight: "right",
      KeyD: "right",
    };
    const down = (e: KeyboardEvent) => {
      const key = map[e.code];
      if (!key) return;
      e.preventDefault();
      game.keys[key] = true;
    };
    const up = (e: KeyboardEvent) => {
      const key = map[e.code];
      if (key) game.keys[key] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);
}

export function Effects({ high }: { high: boolean }) {
  return (
    <EffectComposer multisampling={high ? 4 : 0} enableNormalPass={false}>
      {high ? <N8AO aoRadius={1.6} intensity={2.2} distanceFalloff={0.6} halfRes color="#1b2a4a" /> : <></>}
      <Bloom mipmapBlur intensity={0.65} luminanceThreshold={0.92} luminanceSmoothing={0.2} />
      <Vignette eskil={false} offset={0.22} darkness={0.45} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    </EffectComposer>
  );
}
