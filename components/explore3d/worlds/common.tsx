"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { InstancedModel, MED, Placement, Prop } from "../Prop";
import { Collider, seeded } from "../game";
import { Vec3 } from "../types";

export type Placed = {
  model: string;
  position: Vec3;
  rotation?: number;
  scale?: number;
  /** Circle radius, or [halfWidth, halfDepth] for a box. */
  collide?: number | [number, number];
};

/** Renders one-off props and returns nothing else; colliders are collected separately. */
export function Props({ items }: { items: Placed[] }) {
  return (
    <>
      {items.map((p, i) => (
        <Prop key={i} url={p.model} position={p.position} rotation={p.rotation} scale={p.scale} />
      ))}
    </>
  );
}

export function collidersOf(items: Placed[]): Collider[] {
  return items
    .filter((p) => p.collide)
    .map((p) =>
      typeof p.collide === "number"
        ? { x: p.position[0], z: p.position[2], r: p.collide }
        : { x: p.position[0], z: p.position[2], hw: p.collide![0], hd: p.collide![1] },
    );
}

/** Groups placements by model so each model becomes one instanced draw. */
export function Instanced({ items, shadows = true, tint }: { items: Placed[]; shadows?: boolean; tint?: string }) {
  const groups = useMemo(() => {
    const byModel = new Map<string, Placement[]>();
    for (const p of items) {
      const list = byModel.get(p.model) ?? [];
      list.push({ position: p.position, rotation: p.rotation, scale: p.scale });
      byModel.set(p.model, list);
    }
    return [...byModel.entries()];
  }, [items]);
  return (
    <>
      {groups.map(([url, list]) => (
        <InstancedModel key={url} url={url} items={list} shadows={shadows} tint={tint} />
      ))}
    </>
  );
}

/** Big puffy clouds drifting slowly across the sky. */
export function Clouds({ seed = 7, count = 9, radius = 60, height = 20 }: { seed?: number; count?: number; radius?: number; height?: number }) {
  const clouds = useMemo(() => {
    const rand = seeded(seed);
    return Array.from({ length: count }, (_, i) => ({
      model: MED(i % 3 === 0 ? "cloud_small" : "cloud_big"),
      x: (rand() - 0.5) * radius * 2,
      y: height + rand() * 8,
      z: -radius * 0.3 - rand() * radius,
      s: 2.2 + rand() * 2.2,
      speed: 0.4 + rand() * 0.5,
    }));
  }, [seed, count, radius, height]);
  const refs = useRef<(THREE.Group | null)[]>([]);

  useFrame((_, delta) => {
    refs.current.forEach((g, i) => {
      if (!g) return;
      g.position.x += clouds[i].speed * delta;
      if (g.position.x > radius * 1.2) g.position.x = -radius * 1.2;
    });
  });

  return (
    <>
      {clouds.map((c, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={[c.x, c.y, c.z]}
        >
          <Prop url={c.model} position={[0, 0, 0]} scale={c.s} />
        </group>
      ))}
    </>
  );
}

/** A soft dirt path following a smooth curve through the given points. */
export function Path({ points, width = 2.4, color = "#e2c48b", y = 0.02 }: { points: [number, number][]; width?: number; color?: string; y?: number }) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)));
    const steps = points.length * 16;
    const positions: number[] = [];
    const uvs: number[] = [];
    const index: number[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const side = new THREE.Vector3().crossVectors(up, tangent).normalize();
      // Slight width wobble looks hand-painted.
      const w = width * (0.5 + 0.06 * Math.sin(t * 40));
      positions.push(p.x + side.x * w, y, p.z + side.z * w, p.x - side.x * w, y, p.z - side.z * w);
      uvs.push(0, t, 1, t);
      if (i < steps) {
        const a = i * 2;
        index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(index);
    g.computeVertexNormals();
    return g;
  }, [points, width, y]);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color={color} roughness={1} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  );
}
