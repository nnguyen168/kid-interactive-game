import { Theme, ThemeId } from "./types";

export const THEMES: Record<ThemeId, Theme> = {
  chevalier: {
    id: "chevalier",
    name: "Chevalier",
    mascotName: "Léo le Chevalier",
    mascotEmoji: "🤺",
    tagline: "En avant pour l'aventure au château !",
    colors: {
      primary: "#7C3AED",
      primaryDark: "#5B21B6",
      secondary: "#F59E0B",
      soft: "#EDE9FE",
      text: "#3B0764",
    },
    items: [
      { emoji: "🛡️", singular: "bouclier", plural: "boucliers" },
      { emoji: "⚔️", singular: "épée", plural: "épées" },
      { emoji: "👑", singular: "couronne", plural: "couronnes" },
      { emoji: "🏰", singular: "château", plural: "châteaux" },
    ],
    badgeName: "écu doré",
    badgeEmoji: "🛡️",
  },
  pompier: {
    id: "pompier",
    name: "Pompier",
    mascotName: "Max le Pompier",
    mascotEmoji: "🧑‍🚒",
    tagline: "À l'attaque, il faut sauver la caserne !",
    colors: {
      primary: "#DC2626",
      primaryDark: "#991B1B",
      secondary: "#FBBF24",
      soft: "#FEE2E2",
      text: "#7F1D1D",
    },
    items: [
      { emoji: "🚒", singular: "camion", plural: "camions" },
      { emoji: "🪖", singular: "casque", plural: "casques" },
      { emoji: "🧯", singular: "extincteur", plural: "extincteurs" },
      { emoji: "🔥", singular: "flamme", plural: "flammes" },
    ],
    badgeName: "flamme héroïque",
    badgeEmoji: "🔥",
  },
  foot: {
    id: "foot",
    name: "Foot",
    mascotName: "Capitaine Foot",
    mascotEmoji: "⚽",
    tagline: "C'est parti pour un match au stade !",
    colors: {
      primary: "#16A34A",
      primaryDark: "#166534",
      secondary: "#3B82F6",
      soft: "#DCFCE7",
      text: "#14532D",
    },
    items: [
      { emoji: "⚽", singular: "ballon", plural: "ballons" },
      { emoji: "👕", singular: "maillot", plural: "maillots" },
      { emoji: "🥅", singular: "but", plural: "buts" },
      { emoji: "🏆", singular: "trophée", plural: "trophées" },
    ],
    badgeName: "étoile du stade",
    badgeEmoji: "⭐",
  },
};

export const THEME_ORDER: ThemeId[] = ["chevalier", "pompier", "foot"];

export function getTheme(id: ThemeId): Theme {
  return THEMES[id];
}
