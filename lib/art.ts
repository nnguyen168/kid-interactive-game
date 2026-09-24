export const ART_KEYS = [
  "shield", "swords", "crown", "castle", "dragon", "horse",
  "fire-engine", "helmet", "extinguisher", "fire", "droplet", "siren", "ladder",
  "ball", "tshirt", "goal", "trophy", "stadium", "megaphone",
  "cat", "dog", "house", "sun", "moon", "apple", "fish", "flower", "book", "bird",
  "tap-water", "bubbles", "cup", "sun-cloud", "rainbow", "wheat", "bread", "sun-face",
  "star", "glowing-star", "sparkles", "party", "medal", "heart", "heart-empty",
  "home", "speaker", "compass", "numbers", "letters", "globe", "game", "rocket",
  "gift", "bulb", "cloud", "tree", "thumbs-up", "clap", "wave", "map",
] as const;

export type ArtKey = (typeof ART_KEYS)[number];
