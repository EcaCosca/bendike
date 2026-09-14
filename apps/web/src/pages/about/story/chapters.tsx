import { Link as RouterLink } from 'react-router-dom';
import { SOCIAL_LINKS, WHATSAPP_HREF, WHATSAPP_LABEL } from '../../../components/site/site-content';
import { ABOUT_ASSETS, CHAPTERS, CTA_LABEL, TITLE, imageSources } from './about-story-content';

function Photo({ base, alt, className }: { base: string; alt: string; className?: string }) {
  const { src, srcSet } = imageSources(base);
  return <img src={src} srcSet={srcSet} sizes="(max-width: 860px) 100vw, 50vw" alt={alt} className={className} />;
}

export function TitlePage() {
  return (
    <section className="as-title" data-sc-act="flow" data-chapter="title">
      <div className="sc-wrap as-title__wrap" data-sc-in data-sc-stagger="90">
        <p className="as-title__name">
          {TITLE.name} <span className="as-title__nick">“{TITLE.nickname}”</span>
        </p>
        <h1 className="as-title__words">
          {TITLE.words.map((word) => (
            <span key={word} className="as-title__word">
              {word}
            </span>
          ))}
        </h1>
        <p className="as-title__place">{TITLE.place}</p>
      </div>
    </section>
  );
}

export function FlightChapter() {
  const chapter = CHAPTERS.air;
  return (
    <section className="as-air" data-sc-act="scrub" data-sc-span="3.6" data-sc-dwell="0.42" data-chapter="air">
      <div data-sc-stage>
        <picture>
          <source media="(max-width: 860px)" srcSet={ABOUT_ASSETS.flightPosterMobile} />
          <img className="sc-stage__poster" src={ABOUT_ASSETS.flightPoster} alt="" />
        </picture>
        <video
          data-sc-scrub
          data-sc-src={ABOUT_ASSETS.flight}
          data-sc-src-mobile={ABOUT_ASSETS.flightMobile}
          muted
          playsInline
          aria-label={chapter.caption}
        />
        <div className="sc-scrim sc-scrim--lead" aria-hidden="true" />
        <div className="sc-copy sc-copy--lead" data-sc-cue="0.05 0.5 0.3">
          <p className="as-folio-mark">
            {chapter.number} {chapter.title}
          </p>
          <h2 className="sc-display sc-display--xl">{chapter.lines[0]}</h2>
        </div>
        <div className="sc-copy sc-copy--lead" data-sc-cue="0.5 0.94">
          <p className="sc-lede as-air__line">{chapter.lines[1]}</p>
        </div>
      </div>
    </section>
  );
}

const PREP_DIRECTIONS = ['up', 'left', 'right', 'up', 'down', 'left', 'right', 'up'] as const;

export function PreparationChapter() {
  const chapter = CHAPTERS.preparation;
  return (
    <section className="sc-section as-prep" data-sc-act="flow" data-chapter="preparation">
      <div className="sc-wrap">
        <div className="sc-stack as-prep__intro" data-sc-in data-sc-stagger="70">
          <p className="as-folio-mark">
            {chapter.number} {chapter.title}
          </p>
          <h2 className="sc-display sc-display--lg">{chapter.heading}</h2>
          <p className="sc-body">{chapter.body}</p>
        </div>
        <ul className="as-montage">
          {chapter.labels.map((label, index) => {
            const start = 0.12 + index * 0.075;
            return (
              <li key={label} className={`as-montage__cell as-montage__cell--${index + 1}`}>
                <figure
                  className="as-figure"
                  data-sc-reveal={PREP_DIRECTIONS[index]}
                  data-sc-reveal-at={`${start.toFixed(3)} ${(start + 0.14).toFixed(3)}`}
                >
                  <Photo base={ABOUT_ASSETS.prep[index] ?? ''} alt={label} />
                  <figcaption className="sc-label">{label}</figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function LoftChapter() {
  const chapter = CHAPTERS.loft;
  return (
    <section className="sc-section as-loft" data-sc-act="flow" data-chapter="loft">
      <div className="sc-wrap as-spread">
        <div className="as-spread__media">
          <figure className="as-figure" data-sc-parallax="-0.5">
            <Photo base={ABOUT_ASSETS.loft[0]} alt={chapter.captions[0]} />
            <figcaption className="sc-label">{chapter.captions[0]}</figcaption>
          </figure>
          <figure className="as-figure as-figure--offset" data-sc-parallax="0.35">
            <Photo base={ABOUT_ASSETS.loft[1]} alt={chapter.captions[1]} />
            <figcaption className="sc-label">{chapter.captions[1]}</figcaption>
          </figure>
        </div>
        <div className="sc-stack as-spread__text" data-sc-in data-sc-stagger="70">
          <p className="as-folio-mark">
            {chapter.number} {chapter.title}
          </p>
          <h2 className="sc-display sc-display--lg">{chapter.heading}</h2>
          {chapter.paragraphs.map((paragraph) => (
            <p key={paragraph} className="sc-body as-body">
              {paragraph}
            </p>
          ))}
          <dl className="as-credentials">
            {chapter.credentials.map((credential) => (
              <div key={credential.text} className="as-credentials__row">
                <dt className="sc-nums">{credential.year}</dt>
                <dd>{credential.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export function AirAndCodeChapter() {
  const chapter = CHAPTERS.airAndCode;
  return (
    <section className="sc-section as-code" data-sc-act="flow" data-chapter="airAndCode">
      <div className="sc-wrap as-spread as-spread--reverse">
        <div className="sc-stack as-spread__text" data-sc-in data-sc-stagger="70">
          <p className="as-folio-mark">
            {chapter.number} {chapter.title}
          </p>
          <h2 className="sc-display sc-display--lg">{chapter.heading}</h2>
          {chapter.paragraphs.map((paragraph) => (
            <p key={paragraph} className="sc-body as-body">
              {paragraph}
            </p>
          ))}
          <dl className="as-figures">
            {chapter.figures.map((figure, index) => (
              <div key={figure.label} className="as-figures__item">
                <dt>
                  <span
                    className="sc-nums as-figures__value"
                    data-sc-count={`0 ${figure.value}`}
                    data-sc-count-at={`${(0.22 + index * 0.06).toFixed(2)} ${(0.62 + index * 0.06).toFixed(2)}`}
                  >
                    0
                  </span>
                  <span className="as-figures__suffix">{figure.suffix}</span>
                </dt>
                <dd>{figure.label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="as-spread__media">
          <figure className="as-figure">
            <Photo base={ABOUT_ASSETS.pilot} alt={chapter.captions[0]} />
            <figcaption className="sc-label">{chapter.captions[0]}</figcaption>
          </figure>
          <figure className="as-figure as-figure--offset">
            <Photo base={ABOUT_ASSETS.teach} alt={chapter.captions[1]} />
            <figcaption className="sc-label">{chapter.captions[1]}</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

export function SonsChapter() {
  const chapter = CHAPTERS.sons;
  return (
    <section className="sc-section as-sons" data-sc-act="flow" data-chapter="sons">
      <div className="sc-wrap as-sons__grid">
        <figure className="as-figure as-sons__portrait" data-sc-reveal="iris" data-sc-reveal-at="0.18 0.62">
          <Photo base={ABOUT_ASSETS.kids} alt={chapter.caption} className="as-sons__img" />
          <figcaption className="sc-label">{chapter.caption}</figcaption>
        </figure>
        <div className="sc-stack as-sons__text" data-sc-in data-sc-stagger="120">
          <p className="as-folio-mark">
            {chapter.number} {chapter.title}
          </p>
          <h2 className="sc-display sc-display--lg">{chapter.heading}</h2>
          <blockquote className="as-quote">
            {chapter.paragraphs.map((paragraph) => (
              <p key={paragraph} className="sc-lede">
                {paragraph}
              </p>
            ))}
            <footer className="sc-label">{chapter.attribution}</footer>
          </blockquote>
        </div>
      </div>
    </section>
  );
}

export function Colophon() {
  const chapter = CHAPTERS.colophon;
  const credentials = [...CHAPTERS.loft.credentials, { year: '2015', text: 'Private Aircraft Pilot, ANAC' }].sort(
    (a, b) => a.year.localeCompare(b.year),
  );
  return (
    <section className="sc-section as-colophon" data-sc-act="flow" data-chapter="colophon">
      <div className="sc-wrap">
        <div className="sc-stack as-colophon__lead" data-sc-in data-sc-stagger="80">
          <img src="/brand/mark-gold-320.png" alt="Bendike" className="as-colophon__mark" width="160" height="80" />
          <h2 className="sc-display sc-display--lg">{chapter.heading}</h2>
          <p className="sc-body as-body">{chapter.body}</p>
          <p className="as-colophon__cta">
            {chapter.ctaLead}{' '}
            <RouterLink to="/register" className="as-running-link">
              {CTA_LABEL}
            </RouterLink>
            .
          </p>
        </div>
        <div className="as-colophon__plate">
          <dl className="as-credentials as-credentials--small">
            {credentials.map((credential) => (
              <div key={credential.text} className="as-credentials__row">
                <dt className="sc-nums">{credential.year}</dt>
                <dd>{credential.text}</dd>
              </div>
            ))}
          </dl>
          <nav className="as-colophon__links" aria-label="Elsewhere">
            <RouterLink to="/">Home</RouterLink>
            <RouterLink to="/login">Log in</RouterLink>
            {SOCIAL_LINKS.map((link) => (
              <a key={link.id} href={link.href} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            ))}
            <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer">
              {WHATSAPP_LABEL}
            </a>
          </nav>
          <p className="sc-label">© {new Date().getFullYear()} Bendike. Rosario, Argentina.</p>
        </div>
      </div>
    </section>
  );
}
