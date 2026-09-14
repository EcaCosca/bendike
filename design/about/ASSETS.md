# About page assets: what to drop where

Put the raw files in this folder, `design/about/raw/`, with **exactly these names**. Then run:

```bash
npm run about:assets -w @bendike/web
```

The script grades and encodes the clip for scrubbing, converts every photo to WebP at two sizes, writes posters,
and generates a plain placeholder for anything still missing so the page always renders. It prints a checklist of
what it found and what it faked. Re-run it whenever you add or replace a file. Raw files are git-ignored; the
generated files in `apps/web/public/about/` are committed.

## The one clip (chapter 1, Air)

| Raw file                         | What it should be                                                                                                                                                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `flight.mp4` (or `.mov`)         | The wingsuit flight. 8 to 20 seconds, one continuous shot, no cuts, no camera reversal, nothing entering or leaving frame. Terrain visible and getting closer is the whole point. Landscape 16:9 or wider. Any fps; the script lands it at 30. |
| `flight-portrait.mp4` (optional) | Same flight shot or cropped portrait 9:16 for phones. If missing, the script centre-crops `flight.mp4`, which loses the sides.                                                                                                                 |

## Preparation montage (chapter 2), eight photos

Landscape or square, 1600px wide or more. The labels are editable in `about-story-content.ts`.

| Raw file      | Suggested subject                  |
| ------------- | ---------------------------------- |
| `prep-01.jpg` | Gear laid out before a jump        |
| `prep-02.jpg` | Pin check or closing loop          |
| `prep-03.jpg` | Packing a main or reserve          |
| `prep-04.jpg` | The aircraft, on the ground        |
| `prep-05.jpg` | Winds, weather, briefing, manifest |
| `prep-06.jpg` | Exit or door shot                  |
| `prep-07.jpg` | Canopy or landing                  |
| `prep-08.jpg` | You, geared up, before or after    |

## The loft (chapter 3), two photos

| Raw file      | Suggested subject                                |
| ------------- | ------------------------------------------------ |
| `loft-01.jpg` | Wide shot of the loft: table, tools, rigs        |
| `loft-02.jpg` | Hands on the work: sewing, inspecting, repacking |

## Air and code (chapter 4), two photos

| Raw file       | Suggested subject                                 |
| -------------- | ------------------------------------------------- |
| `pilot-01.jpg` | You flying, or with the aircraft, or the drone    |
| `teach-01.jpg` | Teaching, a classroom, a bootcamp, or at the desk |

## Ben and Ike (chapter 5)

| Raw file   | Status                                                                                                                             |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `kids.jpg` | Already supplied as `chicos.jpg` in Downloads/bendike; the script copies it from there if `kids.jpg` is absent. Portrait is right. |

## Portrait (colophon)

| Raw file  | Suggested subject                           |
| --------- | ------------------------------------------- |
| `eca.jpg` | A straight portrait of you, any orientation |

## Tips

- Bigger is better; the script downsizes. Do not pre-compress.
- Phone footage is fine. HEVC from an iPhone works; the script re-encodes.
- If a clip has people walking in and out of frame, trim it first, or tell me the in and out times.
- Nothing needs text baked in. Every word on the page is real markup.
