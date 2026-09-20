# Bendike presentation

A slide deck for riggers, dropzone owners, skydivers and associations: the problems Bendike solves and every feature
built so far, with screenshots. It is one static page in English, Spanish and Portuguese, and it includes the read-only view an authority such as ANAC gets
of every rigger's virtual log.

## Present it

Open [`index.html`](index.html) in a browser (double-click it, or serve the folder). Then:

| Key                       | What it does                       |
| ------------------------- | ---------------------------------- |
| Right arrow, space, Enter | Next slide                         |
| Left arrow, Backspace     | Previous slide                     |
| `L`                       | Next language: English, Spanish, Portuguese |
| `F`                       | Full screen                        |
| Home, End                 | First and last slide               |

Add `?lang=en`, `?lang=es` or `?lang=pt` to the address to choose the language (the EN, ES and PT buttons at the
bottom right do the same), and `#12` to open a slide. It defaults to the
language of the browser. On a phone, swipe.

## Share it as one file

```bash
node docs/presentation/embed.mjs
```

That writes `bendike-deck.standalone.html` (git-ignored) with every screenshot inside it, so it can be emailed or sent
by WhatsApp and opened anywhere.

## Print or save as PDF

Print the page from the browser (landscape, margins none, background graphics on): every slide becomes one page.

## About the screenshots

Every screenshot shows **demo data**: made-up accounts, rigs and serial numbers, a fictional manufacturer for the sample
service bulletin, and sample documents. Nothing here comes from a real customer or a real dropzone. Keep it that way
when you retake them.
