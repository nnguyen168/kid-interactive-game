import { ArtKey } from "../art";
import { ThemeId } from "../types";

export type Hotspot = {
  id: string;
  position: [number, number, number];
  art: ArtKey;
  fact: string;
};

export const EXPLORE_HOTSPOTS: Record<ThemeId, Hotspot[]> = {
  chevalier: [
    {
      id: "bouclier",
      position: [-4.2, 1.6, -1],
      art: "shield",
      fact: "Les chevaliers portaient une armure en métal qui pouvait peser plus de 30 kilos !",
    },
    {
      id: "epee",
      position: [4.2, 1.6, -1],
      art: "swords",
      fact: "Les chevaliers s'entraînaient à cheval avec une lance pour devenir de bons cavaliers.",
    },
    {
      id: "tour",
      position: [0, 5.6, -5],
      art: "castle",
      fact: "Un château fort avait un pont-levis qu'on relevait pour empêcher les ennemis d'entrer.",
    },
    {
      id: "pont",
      position: [0, 1, 0.5],
      art: "crown",
      fact: "Le roi et la reine vivaient dans la plus haute tour du château, bien protégés.",
    },
  ],
  pompier: [
    {
      id: "camion",
      position: [3.4, 1.8, 0.5],
      art: "fire-engine",
      fact: "Le camion de pompiers est rouge pour qu'on le voie de loin très vite.",
    },
    {
      id: "echelle",
      position: [3.4, 3.6, 0.5],
      art: "ladder",
      fact: "Les pompiers utilisent une grande échelle pour sauver des personnes dans les immeubles.",
    },
    {
      id: "caserne",
      position: [0, 3.4, -5],
      art: "helmet",
      fact: "Les pompiers portent un casque solide pour protéger leur tête des chutes d'objets.",
    },
    {
      id: "bouche",
      position: [-3.4, 1, 1],
      art: "droplet",
      fact: "Pour éteindre un feu, les pompiers utilisent de l'eau ou de la mousse spéciale.",
    },
  ],
  foot: [
    {
      id: "but",
      position: [0, 2, -5.5],
      art: "goal",
      fact: "Le gardien de but est le seul joueur qui peut toucher le ballon avec les mains.",
    },
    {
      id: "ballon",
      position: [0, 1, 0],
      art: "ball",
      fact: "Une équipe de foot a 11 joueurs sur le terrain en même temps.",
    },
    {
      id: "trophee",
      position: [-3.6, 1.6, -2],
      art: "trophy",
      fact: "La Coupe du Monde de foot a lieu tous les 4 ans entre les meilleures équipes du monde.",
    },
    {
      id: "tribune",
      position: [4, 2.4, -3],
      art: "megaphone",
      fact: "Un match de foot dure normalement 90 minutes, avec une pause à la mi-temps.",
    },
  ],
};
