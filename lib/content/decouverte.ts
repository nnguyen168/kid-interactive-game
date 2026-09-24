import { DecouverteCard } from "../types";

export const DECOUVERTE_CARDS: DecouverteCard[] = [
  {
    id: "eau-robinet",
    title: "L'eau du robinet",
    question: "D'où vient l'eau du robinet ?",
    art: ["tap-water", "droplet"],
    explanation: [
      "La pluie tombe du ciel et coule dans les rivières et sous la terre.",
      "Cette eau va jusqu'à une usine spéciale qui la nettoie bien.",
      "Ensuite, elle voyage dans de longs tuyaux jusqu'à ta maison.",
      "Quand tu ouvres le robinet, l'eau propre arrive directement chez toi !",
    ],
    quiz: {
      question: "Avant d'arriver chez toi, l'eau passe d'abord par...",
      choices: ["une usine qui la nettoie", "un magasin de jouets", "le ciel directement"],
      answerIndex: 0,
    },
  },
  {
    id: "eau-petillante",
    title: "L'eau qui pétille",
    question: "Comment fait-on de l'eau qui pétille ?",
    art: ["bubbles", "cup"],
    explanation: [
      "L'eau qui pétille s'appelle de l'eau gazeuse.",
      "On y ajoute un gaz invisible, le même gaz que celui que tu respires.",
      "Ce gaz se cache dans l'eau sous forme de toutes petites bulles.",
      "Quand tu bois, les bulles remontent et ça chatouille ta langue !",
    ],
    quiz: {
      question: "Les petites bulles dans l'eau gazeuse, c'est...",
      choices: ["du gaz", "du sucre", "de la peinture"],
      answerIndex: 0,
    },
  },
  {
    id: "ciel-bleu",
    title: "Le ciel bleu",
    question: "Pourquoi le ciel est-il bleu ?",
    art: ["sun-cloud", "rainbow"],
    explanation: [
      "La lumière du soleil paraît blanche, mais elle contient toutes les couleurs.",
      "Quand cette lumière traverse le ciel, l'air disperse surtout la couleur bleue.",
      "C'est pour ça que le ciel te paraît bleu pendant la journée.",
      "Le soir, le soleil est plus bas et le ciel devient orange et rose !",
    ],
    quiz: {
      question: "Le ciel est bleu à cause de...",
      choices: [
        "la lumière du soleil dispersée dans l'air",
        "de la peinture bleue géante",
        "de la mer qui se reflète dedans",
      ],
      answerIndex: 0,
    },
  },
  {
    id: "pain",
    title: "Le pain",
    question: "D'où vient le pain ?",
    art: ["wheat", "bread"],
    explanation: [
      "Le pain commence dans un champ, où pousse une plante appelée le blé.",
      "On récolte le blé et on écrase ses grains pour faire de la farine.",
      "Le boulanger mélange la farine avec de l'eau, du sel et de la levure.",
      "Il fait cuire la pâte dans un four très chaud pour obtenir du bon pain doré !",
    ],
    quiz: {
      question: "La farine du pain vient...",
      choices: ["du blé", "des pommes", "du chocolat"],
      answerIndex: 0,
    },
  },
  {
    id: "jour-nuit",
    title: "Le jour et la nuit",
    question: "Pourquoi y a-t-il le jour et la nuit ?",
    art: ["sun-face", "moon"],
    explanation: [
      "La Terre est comme une grosse boule qui tourne sur elle-même.",
      "Le côté qui fait face au soleil est éclairé : c'est le jour.",
      "Le côté opposé, qui ne voit pas le soleil, reste dans le noir : c'est la nuit.",
      "La Terre met environ 24 heures pour faire un tour complet sur elle-même !",
    ],
    quiz: {
      question: "Il fait nuit quand...",
      choices: [
        "notre partie de la Terre ne fait plus face au soleil",
        "le soleil disparaît pour toujours",
        "quelqu'un éteint une lumière géante",
      ],
      answerIndex: 0,
    },
  },
];
