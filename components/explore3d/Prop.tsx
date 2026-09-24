"use client";

import { Clone, useGLTF } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Vec3 } from "./types";

export const MED = (name: string) => `/models/medieval/${name}.gltf`;
export const CITY = (name: string) => `/models/city/${name}.gltf`;

export function Prop({
  url,
  position,
  rotation = 0,
  scale = 1,
}: {
  url: string;
  position: Vec3;
  rotation?: number;
  scale?: number | Vec3;
}) {
  const { scene } = useGLTF(url);
  return <Clone object={scene} position={position} rotation={[0, rotation, 0]} scale={scale} castShadow receiveShadow />;
}

export type Placement = { position: Vec3; rotation?: number; scale?: number };

/** Renders many copies of a model with GPU instancing (one draw call per mesh part). */
export function InstancedModel({
  url,
  items,
  shadows = true,
  tint,
}: {
  url: string;
  items: Placement[];
  shadows?: boolean;
  /** Multiplies the model's colours, e.g. to calm down a very saturated texture. */
  tint?: string;
}) {
  const { scene } = useGLTF(url);
  const parts = useMemo(() => {
    scene.updateMatrixWorld(true);
    const found: { geometry: THREE.BufferGeometry; material: THREE.Material; base: THREE.Matrix4 }[] = [];
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      let material = mesh.material as THREE.Material;
      if (tint) {
        const tinted = (material as THREE.MeshStandardMaterial).clone();
        tinted.color.multiply(new THREE.Color(tint));
        material = tinted;
      }
      found.push({ geometry: mesh.geometry, material, base: mesh.matrixWorld.clone() });
    });
    return found;
  }, [scene, tint]);

  return (
    <>
      {parts.map((part, i) => (
        <InstancedPart key={i} geometry={part.geometry} material={part.material} base={part.base} items={items} shadows={shadows} />
      ))}
    </>
  );
}

function InstancedPart({
  geometry,
  material,
  base,
  items,
  shadows,
}: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  base: THREE.Matrix4;
  items: Placement[];
  shadows: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    items.forEach((item, i) => {
      const s = item.scale ?? 1;
      q.setFromAxisAngle(up, item.rotation ?? 0);
      m.compose(new THREE.Vector3(...item.position), q, new THREE.Vector3(s, s, s)).multiply(base);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items, base]);
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, items.length]}
      castShadow={shadows}
      receiveShadow
      frustumCulled={false}
    />
  );
}
