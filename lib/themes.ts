import { Theme, ThemeId } from "./types";

export const THEMES: Record<ThemeId, Theme> = {
  chevalier: {
    id: "chevalier",
    name: "Chevalier",
    mascotName: "Léo le Chevalier",
    greeting: "Salut ! Je suis Léo le Chevalier. Prêt pour l'aventure au château ?",
    iconArt: "shield",
    colors: {
      primary: "#7C3AED",
      secondary: "#F59E0B",
      soft: "#EDE9FE",
      text: "#3B0764",
    },
    sky: { top: "#7DD3FC", bottom: "#E0F2FE" },
    items: [
      { art: "shield", singular: "bouclier", plural: "boucliers" },
      { art: "swords", singular: "épée", plural: "épées" },
      { art: "crown", singular: "couronne", plural: "couronnes" },
      { art: "castle", singular: "château", plural: "châteaux" },
    ],
    badgeName: "écu doré",
    badgeArt: "shield",
    challenge: { mover: "horse", target: "castle", win: "Tu as conquis le château !" },
  },
  pompier: {
    id: "pompier",
    name: "Pompier",
    mascotName: "Max le Pompier",
    greeting: "Salut ! Je suis Max le Pompier. On part en mission ensemble ?",
    iconArt: "helmet",
    colors: {
      primary: "#DC2626",
      secondary: "#FBBF24",
      soft: "#FEE2E2",
      text: "#7F1D1D",
    },
    sky: { top: "#60A5FA", bottom: "#FDE68A" },
    items: [
      { art: "fire-engine", singular: "camion", plural: "camions" },
      { art: "helmet", singular: "casque", plural: "casques" },
      { art: "extinguisher", singular: "extincteur", plural: "extincteurs" },
      { art: "fire", singular: "flamme", plural: "flammes" },
    ],
    badgeName: "médaille du courage",
    badgeArt: "medal",
    challenge: { mover: "fire-engine", target: "fire", win: "Le feu est éteint !" },
  },
  foot: {
    id: "foot",
    name: "Foot",
    mascotName: "Théo le Footballeur",
    greeting: "Salut ! Je suis Théo le Footballeur. On va marquer plein de buts ?",
    iconArt: "ball",
    colors: {
      primary: "#16A34A",
      secondary: "#2563EB",
      soft: "#DCFCE7",
      text: "#14532D",
    },
    sky: { top: "#3B82F6", bottom: "#BFDBFE" },
    items: [
      { art: "ball", singular: "ballon", plural: "ballons" },
      { art: "tshirt", singular: "maillot", plural: "maillots" },
      { art: "goal", singular: "but", plural: "buts" },
      { art: "trophy", singular: "trophée", plural: "trophées" },
    ],
    badgeName: "coupe des champions",
    badgeArt: "trophy",
    challenge: { mover: "ball", target: "goal", win: "BUUUT ! Tu as marqué !" },
  },
};

export const THEME_ORDER: ThemeId[] = ["chevalier", "pompier", "foot"];
