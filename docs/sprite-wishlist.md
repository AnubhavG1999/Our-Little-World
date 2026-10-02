# Sprite wish-list for Pratiksha

Everything in the game is drawn from your sprites. These are the pieces that would make it come alive further, roughly in order of how much difference they'd make. None of them are required: the game works without them.

## How to make them

- **Same style and scale as the current sprites.** Standing characters are about 85–115 px wide and 157–172 px tall; Pair moments are about 110–210 px wide.
- **Transparent PNG**, feet touching the bottom edge, nothing cropped.
- **Name them like the existing ones** in `assets/sprites/` (`g_…` for you, `b_…` for Anubhav), and send them over. They get wired in from there.

## 0. The room without its labels (quick win)

`bg-clean.webp`: the same room painting (same size, 1536×1024) **without** the "Our Little World" title, the left-hand menu, the Day badge and the bottom control bar, just the room continuing underneath them. On phones the game currently has to frame those painted labels out, which hides the left wall and the top of the window; with a clean painting the phone view can show the whole room. (The computer view keeps your original with the labels.)

## 1. Walking (biggest upgrade)

Right now each direction is a single picture that bobs. Two or three frames per direction would make real walking:

| File | What |
|---|---|
| `g_down_1.png`, `g_down_2.png` | walking toward the camera, left foot / right foot |
| `g_up_1.png`, `g_up_2.png` | walking away |
| `g_left_1.png`, `g_left_2.png` | walking left |
| `g_right_1.png`, `g_right_2.png` | walking right |

…and the same eight for `b_`.

## 2. Standing side-on

`g_idle_left.png`, `g_idle_right.png` (and `b_`): standing still but facing sideways, so the two of you can turn to face each other when you're close. The walking-side pictures look frozen mid-step if used for this.

## 3. Outfits

The wardrobe recolours your current clothes for now. Real outfits would sit alongside it, for example:

- `g_dress_idle.png` (+ the other poses), `g_kurta_…`, `g_pajamas_…`, `g_winter_…`
- `b_kurta_…`, `b_hoodie_…`, `b_pajamas_…`

Even just the idle + 4 walking pictures for one outfit is enough to start.

## 4. More Pair moments

Any new "together" picture (e.g. `dance.png`, `cook.png`, `stargaze.png`, `read.png`) can become a new button, with two lines of dialogue like the existing ones.

## 5. The cat

`cat_blink.png`, `cat_tail.png` (tail flick), `cat_stretch.png`: little idle moments.

## 6. A wider scene (optional)

The blurred room fills the space around the game on wide screens. A painting of what's outside the room (the street, the sky, the city) at the same pixel style, about 2400×1400, could replace that blur.

## Note for whoever wires them in

Sprites are cached by the app (`sw.js`). If an existing file is redrawn under the same name, bump `CACHE` in `sw.js` so phones pick up the new picture.
