# BRIEF: Bendike About page ("Eca")

Interviewed 2026-09-14 in chat. Answers are Eca's words, verbatim, dictated. Q2 was answered inside Q3.

## The eight answers

1. **Vibe, references**: "Profesional, humane, deliberate. Star Wars Rogue One"
2. **Scroll journey**: not given separately. Direction from the same day: "explain a little bit about my carrer ...
   talk about me being a pilot and my pasion for air and also explain that Bendike comes from my two sons, Benjamin
   and Enrique who we call Ike, Ben and Ike BendIke" and "make sure to mention I am a father and I love flying, I
   dont want my children to follow my footsteps, but if they do I want them to be recived in a safer enviroment
   than the one I was recived in, and also make sure information is avalable for them from me and any other
   responsable proffed person"
3. **Energy curve**: "I want to use that scroll bit in hour about page energetic in the beggining and calm torwards
   the end"
4. **Feeling stage by stage, the one moment**: "Locked in, connecting with the terrain in a wingsuit flight, going
   deep, then getting memories flashbacks like a montage of preparation"
5. **The one thing no site does**: "Show a profesional website the shows that I am a profesional"
6. **Distance from premium-minimal**: "premium/minimal&brutalist very ableton live brand"
7. **One world or scenes**: "distinct scenes"
8. **Assets**: "I will upload all the assets from another computer and fire off the thing" (photos, LinkedIn text
   pasted in chat, kids photo `chicos.jpg` already supplied, logo cuts in `apps/web/public/brand/`)

## Feeling curve

| # | Chapter | Feeling | What on screen causes it |
|---|---|---|---|
| 0 | Title page | Attention | Brutalist type at scale on a solid gold block: his name, four words, one place. No media. The quiet before the drop. |
| 1 | Air | Locked in | The one clip on the page: wingsuit flight scrubbed by the hand, the real FlySight instruments moving with it. Sparse copy. The largest span. |
| 2 | Preparation | Flashback | "Luck is where opportunity meets preparation." Eight photographs cutting in one after another; the accident-chain paragraph. |
| 3 | The loft | Trust | Deep navy ground, dense spread, the rigger's hands and Eca's own words on being a reliable source of information, with the real dates 2015 to 2025. |
| 4 | Air and code | Respect | "Everything measured in jump tickets." The obsession, the engineer, the crossover; 350, 14, 100 counting in. |
| 5 | Ben and Ike | Tenderness | One portrait of the boys, wiped in slowly, and the father's own words. The quietest screen on the page. |
| 6 | Colophon | Resolve | Navy plate. "Safety as a habit." The CTA as a line of running text, the licences and the career in two small columns. |

Adjacent feelings all differ. Energy is highest at 1 and 2, then steps down, as asked.

## The peak

Chapter 1, Air. The sentence a visitor says to a friend:

> "You scroll and you are flying a wingsuit down a mountainside, the ground comes up under your hand, and then it
> cuts to all the quiet work that made that flight safe."

It gets the only clip, the largest span (3.6 viewport-heights), a dwell so the camera settles on the terrain, and
the silence of the media-free title page in front of it.

## Tell-someone sentence

It's the site where you fly Eca's wingsuit with your scroll wheel and the real altimeter and speed from his
FlySight tick under your hand, and it ends on his two sons.

## Signature move

**The FlySight readout.** Eca dislikes side panels (2026-09-14 feedback), so the logbook folio was removed. In its
place, the flight chapter carries a live altitude, horizontal speed, descent rate and glide-ratio readout driven by
the real FlySight track of that exact jump, interpolated to the clip's playhead: scrub the flight and the
instruments move with your hand. Real data only; if no track is supplied the readout does not render. Bespoke page
JS reading the video's playhead; the engine is untouched. Credentials live in the loft chapter and the colophon.

## Authored silence

The title page is deliberately media-free and holds for one viewport before the flight clip. It is the quiet
before the peak, not dead scroll.

## Grammar

**Chaptered editorial** (uniqueness.md §2.2) in a brutalist and premium-minimal aesthetic (Ableton's flat,
hard-cut colour blocks, big type). Why the others lost:

- Filmic one-shot: he asked for distinct scenes; a continuous chain would also spend the budget hiding cuts the
  brief wants.
- Live surface: the page is a person, not a product surface; nothing to operate.
- Continuous world: no geography to travel; explicitly not "one unbroken world".
- Typographic poster: photographs of him flying and packing are the trust argument; type alone would waste them.
- Gallery/catalog: he is not a collection of objects.
- Split stage: no two-sided argument here.
- Rhythmic cutlist: bans pin and dwell, so the wingsuit peak could not settle, and it is a pulse page for a story
  that has to end calm.

The grammar's bans hold: one scrub only (Air), no spotlight, no magnet, no drift (grounds are painted per
chapter and hard-cut), no full-bleed hero, no pinned crossfade type act, no centred hero copy. Media sits in its
own column with a caption everywhere except the single clip chapter.

## Score

| # | Chapter | Device | Why |
|---|---|---|---|
| 0 | Title page | `flow` + `in`, type only | The grammar's title page; the silence before the clip |
| 1 | Air | `scrub` (the one clip), span 3.6, dwell 0.42 | The peak; the hand flies the suit |
| 2 | Preparation | `flow` with eight sequential `reveal` windows | A montage is hard cuts; reveal is a change of state per photo |
| 3 | The loft | `flow` + `in`, media column with `parallax` | Dense editorial spread; depth in the column, not on the type |
| 4 | Air and code | `flow` + `count` on real figures | 350, 14, 100 are true; numbers landing read as competence |
| 5 | Ben and Ike | `flow` with one `reveal="iris"` on the portrait | The one iris on the page, for the one photo that matters most |
| 6 | Colophon | `flow` + `in`, hold | The plate resolves and stays; nothing fades |

Device families: flow, scrub, reveal, parallax, count (five). No family twice in a row as the primary device.
One scrub. Total length about 11.5 viewport-heights across 7 chapters, outside the 6-7 acts at 13.6-13.8vh band.

## Fingerprint gate

Registry `design/scrollcraft/FINGERPRINTS.md` is empty; nothing to clear. Row to append after shipping:
chaptered editorial · no chrome, folio marks inside chapters · title page (type on gold, no media) · flow, scrub, reveal-montage,
parallax-column, count, iris, colophon at ~11.5vh · colophon plate with running-text CTA, licences and career in small type ·
"FlySight altimeter and speed readout riding the scrubbed flight".

## World

Photographic, natural documentary: Eca's own photos and footage, graded consistently (levels expanded, slight
saturation lift) before encoding. No generated imagery. Grounds: gold `#E0A406` (title), navy `#0B2545` (Air,
colophon), paper `#F4EFE6` (Preparation, Air and code), deep navy `#071A33` (loft), warm paper `#F7F2EA` (Ben and
Ike). Two-stop accent as permitted for light/dark hard cuts: gold on dark grounds, navy on light grounds.
Type: Futura PT / Futura where available, Jost fallback, one family for display and text.
