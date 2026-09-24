# L'Aventure du Vendredi 🛡️🚒⚽

A small French-language educational web app built for a 15-minute Friday-night ritual
with a 5-year-old learning maths and French in *CP* (first grade). Pick a theme
(chevalier, pompier, or foot), study a few questions together, discover a fun
"how the world works" fact, then play a short themed game.

- **J'apprends** — counting, addition/subtraction and comparisons (Maths); letter
  recognition, word-picture matching and missing letters (Français). Difficulty
  auto-levels up as stars are earned.
- **Je découvre** — short, read-aloud explainer cards for real-world questions
  ("D'où vient l'eau du robinet ?", "Comment fait-on de l'eau qui pétille ?", ...)
  with a mini quiz.
- **Je joue** — a themed quiz game with hearts/lives, score, and a badge reward.
- **Séance du vendredi** — the guided 15-minute flow: study → discover → play → recap.

All progress (stars, levels, badges) is saved locally in the browser
(`localStorage`) — there's no account, no backend, and no data collection.
French narration is read aloud with the browser's built-in text-to-speech
(Web Speech API), so questions work even before a child can read fluently.

## Running it locally

Requirements: [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser
(or on a tablet on the same Wi-Fi network, using your computer's local IP
address instead of `localhost`).

Other useful commands:

```bash
npm run build   # production build (also used by Vercel)
npm run start   # run the production build locally
npm run lint    # check code style/correctness
```

## Deploying to Vercel

The easiest way is to connect this GitHub repository to Vercel — it auto-detects
Next.js and needs no configuration:

1. Go to [vercel.com/new](https://vercel.com/new) and import this repository.
2. Leave the default settings (Framework: Next.js) and click **Deploy**.
3. Every push to the main branch redeploys automatically.

Alternatively, deploy from the command line with the included script:

```bash
./scripts/deploy.sh
```

This installs dependencies, runs a local production build to catch errors
early, then deploys with the [Vercel CLI](https://vercel.com/docs/cli)
(`npx vercel --prod`). The first time you run it, the CLI will ask you to log
in and link the project to a Vercel account/project — after that, it
remembers the link (in a local, git-ignored `.vercel` folder) for future runs.

## Project structure

```
app/            Pages (home, maths, francais, decouverte, jeu, seance)
components/     Reusable UI (question cards, buttons, header, confetti, ...)
lib/            Theme + progress state, content generators, TTS hook
  content/      Maths/Français question generators and Découverte cards
```
