# Art brief for ChatGPT

Pratiksha, this is everything to feed ChatGPT so the new art matches yours exactly. Do the requests in order; each one says **which reference images to attach** and **what to name the result**. Send the finished images back to Anubhav — the cutting, sizing and lining up is done on our side, so they don't need to be pixel-perfect.

## What's happened so far, and what this is for

**Where it started.** You made *Our Little World* as **one single HTML file**: the room picture, every sprite of the two of us and the cat, and all the code were packed inside that one file. It only worked inside Claude, and messages couldn't be shared between two phones.

**What we did with it.** Anubhav put your game online so both of you can play it together from your own phones, live:
- It now lives at **https://anubhavg1999.github.io/Our-Little-World/**. You sign in with Google, and it's locked to just your two accounts.
- Your one file was **unpacked into separate pieces**: the room picture (`bg.webp`), each sprite as its own little image (`g_idle.png`, `kiss.png`…), and the code. **Your art itself was not changed**; the game still uses your exact pictures.
- You each control your own character, and you see each other move, kiss, cuddle and sit in real time. Messages and Letters pop up as speech bubbles.
- Your "coming soon" menu now works: Memories (photos and snapshots), Games, Our Map, Future Plans, Surprise Me (a jar of notes), Music (Spotify), Settings, plus a wardrobe, a plant to water together and a day counter.
- On phones there's a close-up "game" view that follows your character.

**Why we need new art now.** Your pictures were made as one finished scene, so a few things can't be done well with them:
- **The room has its menus painted in** (the title, the left menu, the Day badge, the bottom control bar). On phones the game has to hide part of the room to keep those out of the way. Anubhav and Claude tried painting over them by hand, and it looked fake.
- **Characters only have one picture per direction**, so walking is just a bob, not real steps.
- **Sleeping and cuddling are pictures placed on top of the room**, so they look like stickers rather than you being *in* the bed or *on* the sofa.

**How the game uses the art (why the rules below matter).** The room is a fixed background. Everything you can click (the bed, sofa, mailbox, TV, mirror) and everywhere the characters can walk is set at exact positions on it, so **the room's layout must not move**. The characters and the cat are separate images on clear (transparent) backgrounds, which the game moves around and stacks on top of the room. That's why they need **transparent backgrounds and a consistent size**.

**What happens after you send them.** Anubhav passes your images to Claude, which cuts the frames, sizes them, lines them up, and checks the new room against your original before anything changes in the game. You'll see them live after that.

## How to do it

1. Open **one new ChatGPT chat** and keep using it for everything (it remembers the style better within one chat).
2. Send the **style message** below first, with the attachments it lists.
3. Then send the requests **one at a time**. Each request lists the reference images to attach again (ChatGPT follows them much more closely when they're attached to that message).
4. Download each result as **PNG** and rename it to the file name given.
5. If a result drifts (a different face, hairstyle or outfit, or a changed room), reply: *"Closer to the attached reference: same face, same hair, same clothes, same style. Only change what I asked for."* and try again.

All the reference images are in the zip Anubhav sends you, also online at `https://github.com/AnubhavG1999/Our-Little-World/tree/main/assets`.

---

## Step 1 · The style message (send this first)

**Attach:** `bg.webp`, `portrait-g.png`, `portrait-b.png`, `g_idle.png`, `b_idle.png`, `kiss.png`, `cat_sit.png`

> I'm making new art for my pixel-art game "Our Little World". The attached images are the existing art: the room background (a cozy pink bedroom at night), and character sprites of me (long wavy brown hair with blonde highlights, a bindi, pink top, jeans), my boyfriend (black wavy hair, short beard, white t-shirt, black trousers, gold chain) and our grey Persian cat.
>
> How the game uses them: it's a small 2D game for the two of us. The room picture is a fixed background, and clickable spots and walking areas sit at exact positions on it, so the room's layout must never move. The characters and the cat are separate sprites on transparent backgrounds that the game moves around on top of the room, so they need transparent backgrounds and a consistent size. I'll ask you for a version of the room without its painted-in menus, walking animation frames, a few new poses and outfits, and some scenes painted into pieces of the room.
>
> Every image I ask for must match these exactly:
> - the same chibi pixel-art style: soft shading, 1–2 px dark outlines, warm pink palette
> - the same proportions (big head, small body, about 2½ heads tall) and the same slight top-down 3/4 view as the room
> - the same faces, hair and clothes, unless I ask for a different outfit
>
> Unless I say otherwise, every image should have: a **transparent background**, the **whole body visible** with nothing cropped, **no ground shadow**, **no text, border or frame**, and nothing else in the picture. Please just reply "Ready" for now.

---

## Step 2 · The room without its labels (most important)

**Attach:** `bg.webp` · **Save as:** `bg-clean.png`

> Edit the attached room picture. Remove **only** these overlays and paint the room continuing naturally underneath them:
> 1. the "OUR LITTLE WORLD / A place for us, always" banner (top left)
> 2. the menu panel on the left (Home, Our Letters, Memories, Games, Our Map, Future Plans, Music, Settings)
> 3. the "Day 1 / Our Little World" badge (top right)
> 4. the "Controls" bar along the bottom
>
> Underneath them: the left wall, the bookshelf at the top, the wall at the top right, and the floor and front edge of the room at the bottom.
>
> Keep **everything else exactly the same**: same size (1536 × 1024), same furniture in the same places, same perspective, same night window, same colours and lighting. Keep the four small labels "Letters", "Games", "Memories" and "Surprise Me".

*If ChatGPT moves any furniture, say: "Keep the layout pixel-identical to the original; only replace the four overlays."*

**Optional, same request but:** "…and make it **daytime**: sunny sky in the window, warm daylight, lamps off." · **Save as:** `bg-day.png`

---

## Step 3 · Scenes drawn into the room (so they look seamless)

Right now sleeping, cuddling and sitting are pictures placed *on top of* the room, so you can tell they're stickers. For these, ChatGPT edits **the exact piece of the room** instead, and the result goes back over that same spot, so you're really *in* the bed, *on* the sofa, *at* the desk.

The pieces are in the zip under `references/scenes/`. They are not transparent: they're little paintings of that corner of the room.

**Attach:** the scene piece, plus `g_idle.png` and `b_idle.png` (and `kiss.png`, `cuddle.png` for the together ones)

> Edit the attached picture: it's a piece of our room. Draw **[what's happening]** into it, in our exact style (see the character references). Keep **everything else in the picture identical**: same size and framing, same furniture in the same places, same perspective, lighting and colours, same small labels. Only add us. Return the whole picture, not just us.

| Save as | Room piece to attach | What's happening |
|---|---|---|
| `scene_bed_sleep.png` | `scene-bed.png` | the two of us **asleep in the bed** under the flowery blanket, cuddled up, heads on the pillows (the bunny and bear can move to the side) |
| `scene_bed_sit_g.png` | `scene-bed.png` | **me sitting on the edge of the bed**, relaxed |
| `scene_bed_sit_b.png` | `scene-bed.png` | **him sitting on the edge of the bed**, relaxed |
| `scene_sofa_cuddle.png` | `scene-sofa.png` | the two of us **cuddling on the sofa** under a pink blanket |
| `scene_sofa_sit.png` | `scene-sofa.png` | the two of us **sitting side by side on the sofa**, holding hands |
| `scene_sofa_phone_g.png` | `scene-sofa.png` | **me curled up on the sofa scrolling my phone** |
| `scene_sofa_phone_b.png` | `scene-sofa.png` | **him lounging on the sofa scrolling his phone** |
| `scene_desk_g.png` | `scene-desk.png` | **me sitting in the desk chair typing on the laptop** (seen from behind / three-quarter) |
| `scene_desk_b.png` | `scene-desk.png` | **him sitting in the desk chair typing on the laptop** |
| `scene_tv_play.png` | `scene-tv.png` | the two of us **sitting on the floor in front of the TV playing video games** with the controllers |
| `scene_catbed_sleep.png` | `scene-catbed.png` | **the grey Persian cat curled up asleep** in her bed *(optional)* |

*Tips: if ChatGPT changes the furniture or the size, say "Keep the picture identical, only add us." If it crops or moves things a little, that's OK: we line it back up. Sleeping in bed works best at night (like the original room).*

---

## Step 4 · Walking (the biggest upgrade)

Right now each direction is one picture that bobs. These sheets make real walking.

**Attach for her:** `g_idle.png`, `g_down.png`, `g_up.png`, `g_left.png`, `g_right.png`
**Attach for him:** `b_idle.png`, `b_down.png`, `b_up.png`, `b_left.png`, `b_right.png`

Send this once per character and direction (8 requests), filling in the blanks:

> Make a **walking animation sprite sheet** of **[me / my boyfriend]** walking **[toward the viewer / away from the viewer / to the right / to the left]**: **4 frames side by side in one row** (left foot forward, passing, right foot forward, passing). Same character, same size and same height in every frame, feet on the same line, evenly spaced, transparent background.

| Save as | Who | Direction |
|---|---|---|
| `g_walk_down.png` | her | toward the viewer |
| `g_walk_up.png` | her | away from the viewer |
| `g_walk_right.png` | her | to the right |
| `g_walk_left.png` | her | to the left *(optional: the right one can be mirrored)* |
| `b_walk_down.png` | him | toward the viewer |
| `b_walk_up.png` | him | away from the viewer |
| `b_walk_right.png` | him | to the right |
| `b_walk_left.png` | him | to the left *(optional)* |

---

## Step 5 · Standing side-on

So the two of you can turn to face each other when you're standing close.

**Attach:** the same images as step 4 for that person · **Save as:** `g_idle_side.png`, `b_idle_side.png`

> Make **2 frames side by side in one row**: [me / my boyfriend] **standing still** (not mid-step, relaxed) **facing right**, then the same **facing left**. Transparent background.

---

## Step 6 · Outfits for the wardrobe

The wardrobe recolours your current clothes for now; real outfits sit next to that. Do any you like. For each outfit, two requests:

**Attach:** `g_idle.png` and `g_down.png` (or `b_idle.png` and `b_down.png` for him)

> Draw [me / my boyfriend] wearing **[outfit]**, standing exactly like the attached idle picture. Transparent background.

> Now a walking sprite sheet in that outfit toward the viewer: 4 frames in one row, same size and height in every frame, transparent background.

Ideas: a pastel sundress, a lehenga or saree, a kurta, a cozy hoodie, matching pajamas, a winter coat and scarf.

**Save as:** `g_outfit_<name>_idle.png` and `g_outfit_<name>_walk.png` (or `b_…` for him), e.g. `g_outfit_sundress_idle.png`.

---

## Step 7 · More together-moments

Each one becomes a new button in the game.

**Attach:** `kiss.png`, `cuddle.png`, `hug.png`, `portrait-g.png`, `portrait-b.png`

> Draw the two of us **[dancing / cooking together / stargazing on a blanket / reading together / slow dancing / feeding each other cake]** in the same style and at the same size as the attached together-pictures. Both full body, transparent background.

**Save as:** `pair_<name>.png` (e.g. `pair_dance.png`). For each one, also write **two short lines** to say: one from you, one from him (e.g. "Dance with me?" / "Always.").

---

## Step 8 · The cat (small but sweet)

**Attach:** `cat_sit.png`, `cat_sleep.png`, `cat_r1.png`, `cat_r2.png`

| Request | Save as |
|---|---|
| The cat sitting, **blinking** (eyes closed), same pose as cat_sit | `cat_blink.png` |
| **Tail flick**: 4 frames in one row, sitting, tail moving | `cat_tail.png` |
| The cat **stretching** | `cat_stretch.png` |

---

## Sizes, for reference

ChatGPT makes big images (1024 or 1536 px); we shrink them to match. Today's sprites are about:

| | Size (px) |
|---|---|
| Room | 1536 × 1024 |
| Her standing | ~98 × 163 |
| Him standing | ~85 × 172 |
| Together-moments | ~110–210 wide × 110–150 tall |
| Cat sitting / walking | ~68 × 78 / 108 × 72 |

Characters should be about as tall, relative to the room, as in the current game: a little under a fifth of the room's height.

## Checklist to send back

- [ ] `bg-clean.png` (and optional `bg-day.png`)
- [ ] the room scenes from step 3 (bed, sofa, desk, TV)
- [ ] the 6–8 walking sheets
- [ ] `g_idle_side.png`, `b_idle_side.png`
- [ ] any outfits, together-moments (with their two lines) and cat pictures

---

### Note for whoever wires them in

Sprite sheets get sliced into frames, trimmed, scaled to the sizes above and aligned on the feet. Room scenes are scaled back to their piece's exact size, lined up against the original piece (crop boxes on the 1536×1024 painting: bed 1090,130–1490,470 · sofa 110,560–410,852 · desk 215,120–610,410 · TV 1090,420–1440,800 · cat bed 290,430–510,590), their edges feathered into the room, and shown in place of the sticker version while that moment is happening. The clean background is checked against the original for any moved furniture before it goes live (hotspots and walkable areas depend on positions). Sprites are cached by the app (`sw.js`): if an existing file is replaced under the same name, bump `CACHE` in `sw.js`.
