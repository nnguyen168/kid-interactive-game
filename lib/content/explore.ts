import { ArtKey } from "../art";
import { ThemeId } from "../types";

export type ExploreFact = {
  id: string;
  art: ArtKey;
  fact: string;
};

export type Mission = {
  intro: string;
  goalLabel: string;
  goalArt: ArtKey;
  goalCount: number;
  win: string;
};

export const EXPLORE_FACTS: Record<ThemeId, ExploreFact[]> = {
  chevalier: [
    { id: "bouclier", art: "shield", fact: "Les chevaliers portaient une armure en métal qui pouvait peser plus de 30 kilos !" },
    { id: "epee", art: "swords", fact: "Les chevaliers s'entraînaient à cheval avec une lance pour devenir de bons cavaliers." },
    { id: "tour", art: "castle", fact: "Un château fort avait un pont-levis qu'on relevait pour empêcher les ennemis d'entrer." },
    { id: "pont", art: "wheat", fact: "Le moulin à vent utilise le vent pour écraser le blé et faire de la farine pour le pain !" },
  ],
  pompier: [
    { id: "camion", art: "fire-engine", fact: "Le camion de pompiers est rouge pour qu'on le voie de loin très vite." },
    { id: "echelle", art: "ladder", fact: "Les pompiers utilisent une grande échelle pour sauver des personnes dans les immeubles." },
    { id: "caserne", art: "helmet", fact: "Les pompiers portent un casque solide pour protéger leur tête des chutes d'objets." },
    { id: "bouche", art: "droplet", fact: "La bouche d'incendie donne beaucoup d'eau aux pompiers pour éteindre le feu." },
  ],
  foot: [
    { id: "but", art: "goal", fact: "Le gardien de but est le seul joueur qui peut toucher le ballon avec les mains." },
    { id: "ballon", art: "ball", fact: "Une équipe de foot a 11 joueurs sur le terrain en même temps." },
    { id: "trophee", art: "trophy", fact: "La Coupe du Monde de foot a lieu tous les 4 ans entre les meilleures équipes du monde." },
    { id: "tribune", art: "megaphone", fact: "Un match de foot dure normalement 90 minutes, avec une pause à la mi-temps." },
  ],
};

export const MISSIONS: Record<ThemeId, Mission> = {
  chevalier: {
    intro: "Bienvenue au royaume ! Trouve les 4 secrets du château et ramasse toutes les étoiles dorées.",
    goalLabel: "Étoiles",
    goalArt: "glowing-star",
    goalCount: 10,
    win: "Bravo chevalier ! Tu as exploré tout le royaume !",
  },
  pompier: {
    intro: "Alerte ! Il y a trois feux dans la ville. Approche-toi et appuie sur le bouton pour arroser !",
    goalLabel: "Feux éteints",
    goalArt: "fire",
    goalCount: 3,
    win: "Mission réussie ! Tu as éteint tous les feux, bravo pompier !",
  },
  foot: {
    intro: "C'est le match ! Pousse le ballon dans le but pour marquer trois buts.",
    goalLabel: "Buts",
    goalArt: "ball",
    goalCount: 3,
    win: "Trois buts ! Tu es le champion du stade !",
  },
};
