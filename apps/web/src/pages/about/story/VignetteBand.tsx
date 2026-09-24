import { Vignette } from './Vignette';
import { VIGNETTE_BAND, VIGNETTES } from './vignette-content';

const REVEALS = ['up', 'left', 'down', 'right'] as const;

/**
 * The footage, as a montage. Scroll drives the reveals and the parallax; each
 * clip runs on its own timeline so nothing ever sits frozen mid-frame.
 */
export function VignetteBand() {
  return (
    <section className="sc-section as-vigband" data-sc-act="flow" data-chapter="material">
      <div className="sc-wrap">
        <div className="sc-stack as-vigband__intro" data-sc-in data-sc-stagger="70">
          <p className="as-folio-mark">
            {VIGNETTE_BAND.number} {VIGNETTE_BAND.title}
          </p>
          <h2 className="sc-display sc-display--lg">{VIGNETTE_BAND.heading}</h2>
          <p className="sc-body as-body">{VIGNETTE_BAND.body}</p>
        </div>

        <ul className="as-vigband__grid">
          {VIGNETTES.map((item, index) => {
            const start = 0.06 + index * 0.045;
            return (
              <li key={item.id} className="as-vigband__cell">
                <figure
                  className="as-figure as-vigband__figure"
                  data-sc-reveal={REVEALS[index % REVEALS.length]}
                  data-sc-reveal-at={`${start.toFixed(3)} ${(start + 0.12).toFixed(3)}`}
                >
                  <Vignette id={item.id} alt={item.alt} />
                  <figcaption className="sc-label">{item.caption}</figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
