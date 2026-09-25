# L'Aventure du Vendredi

A small French-language educational game built for a 15-minute Friday-night ritual
with a 5-year-old learning maths and French in *CP* (first grade). Pick a hero —
Loukas the knight, firefighter, footballer or racing driver — learn a little, discover
how the world works, then play.

- **Les nombres** — counting (tap each object to count it out loud), number words up
  to sixty, "what comes next", written additions and subtractions up to 20, making 10,
  doubles, counting by 2s and 10s, comparing numbers and little spoken story problems.
- **Les lettres** — first letters and first syllables, upper/lower case, reading words
  (with look-alike distractors), clapping syllables, finding a sound (*on, ou, an, in,
  oi, ch*), rhymes, the alphabet, and missing letters or syllables — over a bank of
  about 100 illustrated words.
- Rounds of 8 questions end with a 3-star result screen. Difficulty levels up
  automatically (three answers at level 1, four afterwards), and recent questions are
  not repeated.
- **Le monde** — a bookshelf of narrated picture-books ("D'où vient l'eau du
  robinet ?", "Comment fait-on de l'eau qui pétille ?", ...) with a spoken quiz.
- **Le défi** — a themed challenge with hearts: every answer moves the ball toward
  the goal, the fire truck toward the fire, or the horse toward the castle.
- **J'explore** — a little 3D adventure game for each hero. Tap the ground (or use the
  arrow keys) to walk around, *Sauter* (Shift / Maj) to jump; glowing spots tell fun facts.
  - The knight collects 10 stars in his kingdom, swinging his sword (*Épée*) to break
    barrels with stars inside and to knock the training dummies.
  - The firefighter puts out 3 fires (at random places all over the city, new ones
    every game) with *Arroser*,
    and climbs a ladder onto a roof to rescue a cat.
  - The footballer dribbles and shoots 3 goals past a keeper who dives (usually the
    wrong way, sometimes making a save!). Each goal lights up the big screen behind
    the goal with fireworks and confetti, the ball flies with a rainbow trail and
    comes back from a different spot, bonus stars lie around the pitch, and
    *Saluer* starts a Mexican wave in the stands.
  - The racing driver drives a kart for 3 laps through the arches, with turbo pads,
    a jump ramp, cones to knock over and a *Turbo* button. Racing controls: ↑ to
    accelerate, ← → to steer, ↓ to brake; the kart gently follows the track when
    you don't steer. *V* (or the button) switches between the view from behind and
    the driver's view; on a tablet, use the on-screen pedals.
- **L'aventure** — the guided 15-minute session: learn → story → challenge → reward.

Designed for a child who is just learning to read: every question is read aloud
by the hero (browser text-to-speech in French) and his mouth moves while he talks;
tap the hero or the bubble to hear it again. Answers use pictures with a small
speaker to hear each word. A wrong answer is never punished — the child simply
tries again, and after two misses the right answer glows. Sounds are synthesized
in the browser, so there are no audio files.

**Espace parents** — the gear next to the star counter on the home screen shows the
difficulty level of *Les nombres* and *Les lettres* and lets you pick level 1, 2 or 3
for each (or put both back to level 1). Levels still go up on their own as stars are
earned.

The star counter starts at zero on every visit (refreshing the page starts a new
session). Levels, badges and discovered facts are saved locally in the browser
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

Live app: https://kid-interactive-game.vercel.app/

### Continuous deployment (recommended)

Connect the Vercel project to this GitHub repository once. After that:

- every push to `main` deploys to production automatically;
- every other branch and pull request gets its own preview URL.

To connect it: in the Vercel dashboard, open the project → **Settings** → **Git** →
**Connect Git Repository** → GitHub → `nnguyen168/kid-interactive-game`
(authorise the Vercel GitHub app for this repository if asked). Check that the
production branch is `main`.

### Continuous integration

`.github/workflows/ci.yml` runs on every push to `main` and on every pull request:
install (`npm ci`), lint, and a production build (which also type-checks). A red
check means the change would not deploy cleanly. To block merging a pull request
until it passes, add the **Lint and build** check as a required status check in
GitHub → Settings → Branches.

### Manual deploy

You can still deploy from your computer with the included script:

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
