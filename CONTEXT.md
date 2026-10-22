# Komtekle — project context for LLMs / new contributors

Komtekle is a daily "guess who" web game (Wordle/Loldle style) about people and places in the Komtek
community (NTNU-ish student environment). UI text is **Norwegian**. Deployed at https://komtekle.netlify.app
(Netlify, builds from `main` of github.com/perhenrikgithub/komtekle). No backend: everything is client-side,
deterministic per date, and progress lives in `localStorage`.

## Stack
- Vite + React 19 + TypeScript, Tailwind CSS 3, `canvas-confetti`.
- Scripts: `npm run dev`, `npm run build`, `npm run lint`. No test suite.
- `t.py` (repo root): helper that lists characters without an image and images without a character.

## File map
| File | Purpose |
|---|---|
| `src/App.tsx` | Shell: title, mode switcher (`klassisk` / `bilde`, synced to `?mode=bilde`), Halloween styling. |
| `src/ClassicGame.tsx` | Classic mode: guess a character, each guess shows coloured feedback per feature column (desktop table + mobile cards). |
| `src/ImageGame.tsx` | Image mode ("Bilde"): zoomed-in photo of the target, zooms out one step (`ZOOM_STEPS`, 7 steps) per wrong guess. Zoom focus point is seeded per date. |
| `src/charachterPickLogic.ts` | (sic, misspelled filename) Daily target selection for both modes + `useDailyGuesses` localStorage hook. |
| `src/gameConfig.ts` | `AVOID_N_LAST_CHARACTERS` (currently 7) and `GAME_FEATURES` (the columns of classic mode). |
| `src/utils.ts` | `seededRandom` (FNV-1a + murmur fmix32 → [0,1)), `getImagePath`, `evaluateFeature`, `isPotentialAnswer`, `isHalloween`, confetti. |
| `src/share.ts` | Builds the share text (emoji grid) for whatever modes were won today. |
| `src/types.ts` | `Character`, `FeatureConfig`, `ComparisonResult`. |
| `src/components/SearchBox.tsx` | Autocomplete name input (hides already-guessed names; `showImages={false}` in image mode). |
| `src/components/WinCard.tsx` | Win screen + share button. |
| `src/data/characters.json` | **The data.** Array of characters (60 as of 2026-10-22). |
| `public/character_images/` | One `.jpg` per character + `default_male_avatar.jpg` / `default_female_avatar.jpg`. |

## Data model (`characters.json`)
```json
{
  "name": "Aksel Wilhelmsen",
  "gender": "Mann",                       // "Mann" | "Kvinne" | other
  "role": ["Student", "5."],              // string or string[] (PARTIAL feature)
  "height": "Litt kortere enn menneskehøyde", // must be one of the rankOrder values in gameConfig
  "certified mojavebabe": "Nei",          // "Ja" | "Nei"  (underscore spelling also accepted)
  "verv-whipped": "Ja",                   // "Ja" | "Nei"  (underscore spelling also accepted)
  "region": "Vest",
  "profil": "Krypto",
  "dateAdded": "2026-01-01"               // YYYY-MM-DD, REQUIRED — see below
}
```
- Characters are not only people: places/things like "Sahara", "Mojave", "Komtekrommet", "Bæsjestøvsuger" are valid entries.
- **`dateAdded`**: a character is only eligible on dates `>= dateAdded`. This keeps past days' picks stable
  when someone is added. When adding a character, set `dateAdded` to the date it goes live (today or later),
  **never in the past** — otherwise past days' (and therefore today's exclusion list) change.
- Don't reorder, rename or delete existing entries casually: the pick is an index into the eligible list,
  so changing the list changes which character each day maps to.
- Image file name = `name.toLowerCase()` with everything except `a-z0-9æøå` stripped, + `.jpg`
  (e.g. "Moppa (Andreas Indreråk)" → `moppaandreasindreråk.jpg`). Characters without an image fall back
  to the default avatar in classic mode and are skipped in image mode.
- As of 2026-10-22 missing images: Anna, Iqra, Manav, Ole Marcus, T-ruls, Viktor, Ortega, Komtekrommet.
  `serengeti.jpg` exists with no matching character.

## Adding a feature column
See README: add the key to every character, then add an entry to `GAME_FEATURES` with
`type: 'EXACT' | 'PARTIAL' | 'RANKED'` (RANKED needs `rankOrder`, low→high). Components and share text
are driven entirely by `GAME_FEATURES`.

## Daily target selection (the important/fragile part)
- Date key = **UTC** date (`new Date().toISOString().slice(0,10)`). In Norway the day flips at 01:00/02:00
  local time, not midnight.
- Everyone gets the same target because it's `seededRandom(seed + dateKey)` over the eligible list.
  Seeds: classic `classic-${date}`, image `bilde-v2-${date}`, zoom focus `bilde-x-`/`bilde-y-`.
- Goal: don't repeat a character within `AVOID_N_LAST_CHARACTERS` days (per mode), and image mode must
  never equal today's classic target.
- localStorage keys: `komtekle-${date}` (classic guesses), `komtekle-bilde-${date}` (image guesses),
  `komtekle-bilde-vunnet-${date}` (image won flag). Changing the algorithm mid-day means players who
  already started see a different target, so ship algorithm changes so they take effect from a future date.

### How picks work (since 2026-10-23)
`getPicksForDate(date)` in `charachterPickLogic.ts` returns `{ classic, image }`, memoized.
- From `PICK_HISTORY_START` (2026-10-23) on, picks are **chained forward**: each day excludes the
  characters *actually* served in that mode during the previous `AVOID_N_LAST_CHARACTERS` days.
  Image mode additionally excludes today's classic target and only chooses characters that have an image.
- Days before `PICK_HISTORY_START` use the legacy algorithm (kept only to reproduce what was served).
  Never change `PICK_HISTORY_START` — it would rewrite past/current picks.
- Which images exist comes from the `virtual:character-images` module, generated at build time by a small
  plugin in `vite.config.js` from `public/character_images/`. Adding an image changes the image-mode pool,
  so (like `dateAdded`) add images/characters before the day they should go live, not mid-day.
- Exports: `getDailyClassicCharacter(date)`, `getDailyImageCharacter(date)`, `getPicksForDate`, `hasImage`.

History: the first version (2026-10-09 → 10-22) excluded the *unfiltered* picks of past days instead of the
real ones, so repeats happened (e.g. image mode Sahara on 10-18 and 10-22). Fixed by the chaining above;
verified 0 repeats over 2 years.
