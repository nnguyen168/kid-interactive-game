# L'Aventure du Vendredi

A small French-language educational game built for a 15-minute Friday-night ritual
with a 5-year-old learning maths and French in *CP* (first grade). Pick a hero
(Léo le Chevalier, Max le Pompier or Théo le Footballeur), learn a little, discover
how the world works, then play.

- **Les nombres / Les lettres** — counting (tap each object to count it out loud),
  addition, subtraction and comparisons; letter sounds, word–picture matching and
  missing letters. Rounds of 8 questions end with a 3-star result screen, and
  difficulty levels up automatically as stars are earned.
- **Le monde** — a bookshelf of narrated picture-books ("D'où vient l'eau du
  robinet ?", "Comment fait-on de l'eau qui pétille ?", ...) with a spoken quiz.
- **Le défi** — a themed challenge with hearts: every answer moves the ball toward
  the goal, the fire truck toward the fire, or the horse toward the castle.
- **J'explore** — a little 3D adventure game for each hero. Tap the ground (or use the
  arrow keys) to walk around; glowing spots tell fun facts. The knight collects 10 stars
  in his kingdom, the firefighter puts out 3 fires in the city with the *Arroser* button,
  and the footballer dribbles and shoots 3 goals past the keeper in a packed stadium.
- **L'aventure** — the guided 15-minute session: learn → story → challenge → reward.

Designed for a child who is just learning to read: every question is read aloud
by the hero (browser text-to-speech in French) and his mouth moves while he talks;
tap the hero or the bubble to hear it again. Answers use pictures with a small
speaker to hear each word. A wrong answer is never punished — the child simply
tries again, and after two misses the right answer glows. Sounds are synthesized
in the browser, so there are no audio files.

All progress (stars, levels, badges) is saved locally in the browser
(`localStorage`) — there's no account, no backend, and no data collection.

## Playing with the keyboard

Everything works without a mouse:

- **Arrow keys** move between the big buttons (answers, heroes, activities, books), and
  **Enter** or **Space** presses the highlighted one (yellow ring).
- Pop-ups and end-of-round screens focus their main button, so **Enter** continues.
- In **J'explore**, the arrow keys (or WASD) walk the hero, and **Space** or **Enter**
  sprays water or shoots the ball when the big action button is showing.

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
app/                Pages (home hub, maths, francais, decouverte, jeu, seance, explore)
components/
  Mascot.tsx        SVG hero with moods (idle, happy, wave, encourage) and a talking mouth
  SceneBackground   Illustrated castle / fire station / stadium worlds
  ui/               Candy buttons, top bar, progress trail, speech bubble
  quiz/             Question cards, answer tiles, story reader, result screen
  explore3d/        J'explore game: hero controller, worlds, missions (react-three-fiber)
lib/                Themes, progress store, speech + sound effects, content generators
public/art/         3D illustrations
public/models/      3D models (glTF) for J'explore
```

## Credits

The 3D illustrations in `public/art/` are from
[Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (MIT licence,
see `public/art/LICENSE.txt`).

The 3D models in `public/models/` are from [KayKit](https://kaylousberg.itch.io) by
Kay Lousberg: Medieval Hexagon Pack, City Builder Bits and Character Pack: Adventurers
(CC0 licence, see the `LICENSE.txt` files next to them). The fire station, fire truck,
stadium, fires and ball are built in code.
