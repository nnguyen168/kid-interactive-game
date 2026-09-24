export const ART_KEYS = [
  "shield", "swords", "crown", "castle", "dragon", "horse",
  "fire-engine", "helmet", "extinguisher", "fire", "droplet", "siren", "ladder",
  "ball", "tshirt", "goal", "trophy", "stadium", "megaphone",
  "cat", "dog", "house", "sun", "moon", "apple", "fish", "flower", "book", "bird",
  "tap-water", "bubbles", "cup", "sun-cloud", "rainbow", "wheat", "bread", "sun-face",
  "star", "glowing-star", "sparkles", "party", "medal", "heart", "heart-empty",
  "home", "speaker", "compass", "numbers", "letters", "globe", "game", "rocket",
  "gift", "bulb", "cloud", "tree", "thumbs-up", "clap", "wave", "map",
  // Racing theme and the bigger word bank.
  "anchor", "ant", "banana", "bear", "bed", "bee", "bell", "bike", "boat", "bus", "butterfly", "cabbage", "cake", "candy", "car", "carrot", "chair", "checkered-flag", "cheese", "cherries", "cow", "crocodile", "dolphin", "door", "drum", "duck", "elephant", "fir", "fox", "frog", "fuel", "giraffe", "glasses", "grapes", "guitar", "hat", "hen", "ice-cream", "key", "ladybug", "lemon", "lion", "lollipop", "monkey", "motorcycle", "mouse", "mushroom", "octopus", "orange", "owl", "pear", "pencil", "penguin", "piano", "pig", "pineapple", "plane", "rabbit", "racing-car", "ring", "robot", "scissors", "shark", "sheep", "snail", "snowman", "socks", "spider", "stopwatch", "strawberry", "teddy", "tent", "tiger", "tomato", "traffic-light", "train", "turtle", "umbrella", "unicorn", "watermelon", "wheel", "wolf", "wrench", "zebra",
] as const;

export type ArtKey = (typeof ART_KEYS)[number];
