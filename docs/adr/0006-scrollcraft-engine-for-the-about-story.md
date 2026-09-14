# The About page hosts the vendored scrollcraft engine inside the React app

---

status: accepted

---

Eca asked (2026-09-14) for the About page to be built with the scrollcraft method: scroll as a timeline, a
chaptered editorial grammar, one scrubbed clip, and a bespoke signature move. Scrollcraft ships a dependency-free
vanilla engine (`scrollcraft.js`, `scrollcraft.css`) that reads `data-sc-*` attributes off real markup and never
generates DOM. We decided to vendor both files byte-for-byte into the web app, render the chapters as React
components that emit that markup, dynamically import the engine when `/about` mounts, and inject the engine
stylesheet as a `<link>` for the life of the route only, because it styles `body` and would restyle the MUI app
everywhere else. The page's own styles live in `about-story.css` under an `as-` prefix, and every bespoke behaviour
(the logbook folio) is page code reading act progress, so the engine stays untouched as the method requires.

## Considered Options

- **Rebuild the devices in React (Framer Motion, GSAP ScrollTrigger)**: rejected. It would re-implement the
  scrub playhead lerp, iOS priming, cue contract and verification hooks the engine already has, and lose the
  harness that measures dead scroll and composited contrast.
- **Ship the About page as a standalone static HTML file outside React**: rejected. It would fork navigation,
  brand and auth state, and Vercel routing would need a second project or rewrite rules for one page.
- **Load the engine globally**: rejected. Its `body`, `html`, `::selection` and scrollbar rules would leak into the
  landing page and the signed-in app.
- **Vendored engine, route-scoped stylesheet, React chapters (chosen)**.

## Consequences

- `apps/web/src/pages/about/scrollcraft/scrollcraft.js` and `apps/web/public/scrollcraft/scrollcraft.css` are
  excluded from ESLint and Prettier; a checksum against the skill's copy is the "never edited" check.
- The engine exposes no unmount. Leaving `/about` removes the stylesheet and the `sc-ready` class but an idle
  animation-frame loop remains until reload. Acceptable for one page; a second scroll page would need a fork with
  a teardown, recorded as a new decision.
- Tests mock the engine module (jsdom has no `matchMedia`) and assert on the emitted markup, not on motion.
- Motion is verified by the scrollcraft harness in `design/scrollcraft/`, not by Jest.
- Raw assets never enter git; the encoded outputs in `apps/web/public/about/` do, so a fresh checkout renders the
  page without the pipeline.
