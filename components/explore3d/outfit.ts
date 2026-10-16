import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { ThemeId } from "@/lib/types";

const ALWAYS_HIDDEN = ["1H_Sword_Offhand", "Rectangle_Shield", "Round_Shield", "Spike_Shield", "2H_Sword"];
const KNIGHT_ONLY = ["Knight_Helmet", "Knight_Cape", "1H_Sword", "Badge_Shield"];

type Look = {
  hide: string[];
  /** Flat colours replacing the knight's metal texture on body parts. */
  paint: Record<string, string>;
  dress?: (head: THREE.Object3D, chest: THREE.Object3D | undefined, root: THREE.Object3D) => void;
};

function mat(color: string, extra: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
}

function spaceSuit(head: THREE.Object3D, chest: THREE.Object3D | undefined) {
  // A big glass bubble helmet, so the face stays visible.
  const glass = new THREE.Mesh(
    new THREE.SphereGeometry(0.88, 32, 24),
    new THREE.MeshStandardMaterial({ color: "#bfdbfe", transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.2, depthWrite: false }),
  );
  glass.position.set(0, 0.45, 0.02);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.08, 12, 32), mat("#e2e8f0", { roughness: 0.4 }));
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, -0.36, 0);
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), mat("#ef4444", { emissive: "#ef4444", emissiveIntensity: 1.5 }));
  light.position.set(0, 1.33, 0);
  head.add(glass, collar, light);
  if (chest) {
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.05, 0.45), mat("#cbd5e1", { roughness: 0.5 }));
    pack.position.set(0, 0.25, -0.78);
    chest.add(pack);
  }
}

/** A tennis racket held in the right hand, in place of the knight's sword. */
function tennisKit(head: THREE.Object3D, root: THREE.Object3D) {
  // A red sweatband around his own hair.
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.62, 0.13, 36, 1, true), mat("#ef4444", { side: THREE.DoubleSide }));
  band.position.set(0, 0.66, -0.02);
  head.add(band);
  // three.js strips dots from node names: "handslot.r" becomes "handslotr".
  const hand = root.getObjectByName("handslotr") ?? root.getObjectByName("handslot.r");
  if (!hand) return;
  const racket = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.62, 10), mat("#1f2937"));
  handle.position.y = 0.2;
  const throat = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.3, 8), mat("#84cc16"));
  throat.position.y = 0.62;
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 10, 32), mat("#84cc16", { roughness: 0.35 }));
  frame.scale.set(0.82, 1, 1);
  frame.position.y = 1.05;
  const strings = new THREE.Mesh(
    new THREE.CircleGeometry(0.31, 24),
    new THREE.MeshStandardMaterial({ color: "#f8fafc", transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
  );
  strings.scale.set(0.82, 1, 1);
  strings.position.y = 1.05;
  racket.add(handle, throat, frame, strings);
  hand.add(racket);
}

const LOOKS: Record<ThemeId, Look> = {
  espace: {
    hide: KNIGHT_ONLY,
    paint: {
      Knight_Body: "#f1f5f9",
      Knight_ArmLeft: "#e2e8f0",
      Knight_ArmRight: "#e2e8f0",
      Knight_LegLeft: "#e2e8f0",
      Knight_LegRight: "#e2e8f0",
    },
    dress: (head, chest) => spaceSuit(head, chest),
  },
  tennis: {
    hide: KNIGHT_ONLY,
    paint: {
      Knight_Body: "#f8fafc",
      Knight_ArmLeft: "#f8fafc",
      Knight_ArmRight: "#f8fafc",
      Knight_LegLeft: "#1e3a8a",
      Knight_LegRight: "#1e3a8a",
    },
    dress: (head, _chest, root) => tennisKit(head, root),
  },
  course: {
    hide: KNIGHT_ONLY,
    paint: {
      Knight_Body: "#ea580c",
      Knight_ArmLeft: "#ea580c",
      Knight_ArmRight: "#ea580c",
      Knight_LegLeft: "#1f2937",
      Knight_LegRight: "#1f2937",
    },
    dress: (head) => racingHelmet(head),
  },
  chevalier: {
    hide: [],
    paint: {},
  },
  pompier: {
    hide: KNIGHT_ONLY,
    paint: {
      Knight_Body: "#1e3a8a",
      Knight_ArmLeft: "#1e3a8a",
      Knight_ArmRight: "#1e3a8a",
      Knight_LegLeft: "#1e293b",
      Knight_LegRight: "#1e293b",
    },
    dress: (head) => {
      const helmet = new THREE.Group();
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.64, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        mat("#ef4444", { roughness: 0.25, metalness: 0.1 }),
      );
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.84, 0.08, 40), mat("#dc2626", { roughness: 0.3 }));
      brim.position.y = 0.02;
      const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 24), mat("#fcd34d", { metalness: 0.7, roughness: 0.25 }));
      badge.rotation.x = Math.PI / 2;
      badge.position.set(0, 0.36, 0.56);
      helmet.add(dome, brim, badge);
      helmet.position.set(0, 0.6, 0.02);
      head.add(helmet);
    },
  },
  foot: {
    hide: KNIGHT_ONLY,
    paint: {
      Knight_Body: "#2563eb",
      Knight_ArmLeft: "#2563eb",
      Knight_ArmRight: "#2563eb",
      Knight_LegLeft: "#f8fafc",
      Knight_LegRight: "#f8fafc",
    },
    dress: (head, chest) => {
      const hairMat = mat("#7c4a1e", { roughness: 0.8 });
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.67, 32, 16, 0, Math.PI * 2, 0, Math.PI / 1.9), hairMat);
      hair.scale.set(1, 0.95, 1.03);
      hair.position.set(0, 0.53, -0.05);
      const fringe = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), hairMat);
      fringe.scale.set(1.5, 0.4, 0.6);
      fringe.position.set(0.05, 0.88, 0.5);
      fringe.rotation.z = -0.2;
      head.add(hair, fringe);
      if (chest) {
        // Jersey number patch on the back.
        const patch = new THREE.Mesh(new THREE.CircleGeometry(0.26, 24), mat("#ffffff"));
        patch.position.set(0, 0.35, -0.62);
        patch.rotation.y = Math.PI;
        chest.add(patch);
      }
    },
  },
};

function racingHelmet(head: THREE.Object3D) {
  const helmet = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.74, 32, 20), mat("#f8fafc", { roughness: 0.2, metalness: 0.1 }));
  shell.scale.set(1, 1.02, 1.05);
  const stripe = new THREE.Mesh(
    new THREE.SphereGeometry(0.75, 32, 20, Math.PI * 0.44, Math.PI * 0.12, 0, Math.PI * 0.62),
    mat("#ea580c", { roughness: 0.25 }),
  );
  stripe.scale.copy(shell.scale);
  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(0.77, 32, 16, Math.PI * 0.2, Math.PI * 0.6, Math.PI * 0.36, Math.PI * 0.22),
    mat("#0f172a", { roughness: 0.05, metalness: 0.6 }),
  );
  visor.rotation.y = Math.PI;
  visor.scale.copy(shell.scale);
  helmet.add(shell, stripe, visor);
  helmet.position.set(0, 0.5, 0);
  head.add(helmet);
}

/** Clones the knight rig and dresses it up for the chosen theme. */
export function dressHero(source: THREE.Object3D, themeId: ThemeId, paint?: Record<string, string>) {
  const hero = SkeletonUtils.clone(source);
  const look = paint ? { ...LOOKS[themeId], paint } : LOOKS[themeId];
  for (const name of [...ALWAYS_HIDDEN, ...look.hide]) {
    const node = hero.getObjectByName(name);
    if (node) node.visible = false;
  }
  hero.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const color = look.paint[mesh.name];
    if (color) {
      const painted = (mesh.material as THREE.MeshStandardMaterial).clone();
      painted.map = null;
      painted.color = new THREE.Color(color);
      painted.metalness = 0;
      painted.roughness = 0.6;
      mesh.material = painted;
    }
  });
  const head = hero.getObjectByName("head");
  if (head && look.dress) look.dress(head, hero.getObjectByName("chest"), hero);
  return hero;
}
