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
  course: [
    { id: "feux", art: "traffic-light", fact: "Au départ, les feux rouges s'allument un par un. Quand ils s'éteignent tous : c'est parti !" },
    { id: "pneus", art: "wheel", fact: "Les voitures de course ont des pneus très larges et tout lisses pour bien coller à la piste." },
    { id: "chrono", art: "stopwatch", fact: "Le chronomètre mesure le temps des pilotes au centième de seconde près, c'est super précis !" },
    { id: "drapeau", art: "checkered-flag", fact: "Le drapeau à damier noir et blanc annonce la fin de la course. Le premier à le voir a gagné !" },
  ],
  espace: [
    { id: "lune", art: "moon", fact: "Sur la Lune, on est six fois plus léger que sur la Terre : on peut sauter très, très haut !" },
    { id: "fusee", art: "rocket", fact: "Une fusée crache un énorme feu vers le bas pour monter très vite vers le ciel." },
    { id: "terre", art: "globe", fact: "Vue de l'espace, la Terre est toute bleue, parce qu'elle est couverte d'océans." },
    { id: "soleil", art: "sun", fact: "Le Soleil est une étoile, comme celles qu'on voit la nuit, mais bien plus proche de nous." },
  ],
  tennis: [
    { id: "balle", art: "tennis", fact: "Les balles de tennis sont jaune fluo pour qu'on les voie bien, même à la télévision." },
    { id: "terre-battue", art: "trophy", fact: "À Roland-Garros, à Paris, les champions jouent sur de la terre battue toute orange." },
    { id: "filet", art: "goal", fact: "Au tennis, la balle doit passer au-dessus du filet pour que le point continue." },
    { id: "score", art: "numbers", fact: "Au tennis, on compte les points d'une façon rigolote : quinze, trente, quarante, jeu !" },
  ],
  cuisine: [
    { id: "pain", art: "baguette", fact: "Le boulanger se lève très tôt, avant le soleil, pour que le pain soit prêt le matin !" },
    { id: "poule", art: "egg", fact: "Les œufs viennent des poules. Une poule peut pondre presque un œuf chaque jour !" },
    { id: "lait", art: "milk", fact: "Le lait vient des vaches. Avec le lait, on fabrique aussi le beurre, le fromage et les yaourts." },
    { id: "chocolat", art: "chocolate", fact: "Le chocolat est fait avec les graines du cacaoyer, un arbre qui pousse dans les pays chauds." },
  ],
};

export const MISSIONS: Record<ThemeId, Mission> = {
  chevalier: {
    intro: "Bienvenue au royaume ! Ramasse les étoiles dorées et frappe les tonneaux avec ton épée : des étoiles sont cachées dedans !",
    goalLabel: "Étoiles",
    goalArt: "glowing-star",
    goalCount: 10,
    win: "Bravo chevalier ! Tu as exploré tout le royaume !",
  },
  pompier: {
    intro: "Alerte ! Trois feux dans la ville, et un petit chat coincé sur un toit ! Arrose les feux, puis grimpe à l'échelle pour sauver le chat.",
    goalLabel: "Sauvetages",
    goalArt: "fire",
    goalCount: 4,
    win: "Mission réussie ! Les feux sont éteints et le chat est sauvé. Bravo pompier !",
  },
  foot: {
    intro: "C'est le match ! Marque trois buts. Attention, le gardien plonge ! Et ramasse les étoiles en dribblant.",
    goalLabel: "Buts",
    goalArt: "ball",
    goalCount: 3,
    win: "Trois buts ! Tu es le champion du stade !",
  },
  course: {
    intro: "En piste, pilote ! Fais trois tours du circuit en passant sous toutes les arches. Les flèches jaunes te donnent un turbo !",
    goalLabel: "Tours",
    goalArt: "checkered-flag",
    goalCount: 3,
    win: "Trois tours ! Drapeau à damier, tu as gagné la course !",
  },
  espace: {
    intro: "Bienvenue sur la Lune, astronaute ! Ramasse les cinq piles d'énergie pour la fusée, puis monte dedans et appuie sur Décoller !",
    goalLabel: "Mission",
    goalArt: "rocket",
    goalCount: 6,
    win: "Trois, deux, un… décollage ! Bravo astronaute, direction les étoiles !",
  },
  tennis: {
    intro: "Jeu, set et match ! Le lance-balles t'envoie des balles. Quand la balle arrive, appuie sur Frapper pour toucher les cibles de l'autre côté du filet !",
    goalLabel: "Cibles",
    goalArt: "tennis",
    goalCount: 5,
    win: "Cinq cibles ! Tu es le champion de Roland-Garros !",
  },
  cuisine: {
    intro: "Bienvenue au marché, chef ! Trouve les ingrédients qui brillent et rapporte-les à la cuisine. D'abord des crêpes, ensuite une pizza !",
    goalLabel: "Étapes",
    goalArt: "cooking",
    goalCount: 10,
    win: "Des crêpes et une pizza ! Tu es un grand chef, bravo Loukas !",
  },
};
