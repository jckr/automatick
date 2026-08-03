import React from 'react';
import { Link } from 'react-router-dom';
import { EXAMPLES, EXAMPLE_CATEGORIES, ExampleMeta, examplePath, thumbnailUrl } from '../examples';
import styles from './ExamplesGalleryPage.module.css';

/**
 * Examples gallery — the "Specimen Wall": one uninterrupted flush mosaic of
 * sim thumbnails separated only by 1px gridlines. The most spectacular sims
 * get 2x2 feature tiles; `grid-auto-flow: dense` keeps the wall gap-free.
 * Categories don't interrupt the wall — they appear as a legend in the header
 * and as an accent tab on the first tile of each category. Driven by the
 * shared examples manifest (src/examples.ts) so it never drifts from the
 * sidebar.
 */

/** Sims that earn a 2x2 feature tile on the wall. */
const FEATURES = new Set([
  'boids',
  'gray-scott',
  'physarum',
  'particle-life',
  'fireworks',
  'terrain',
]);

type WallItem = { ex: ExampleMeta; category?: string; isFirstInCategory: boolean };

/** EXAMPLES reordered by category; uncategorized examples appended at the end. */
function buildWall(): WallItem[] {
  const bySlug = new Map(EXAMPLES.map((ex) => [ex.slug, ex]));
  const items: WallItem[] = [];
  const seen = new Set<string>();

  for (const category of EXAMPLE_CATEGORIES) {
    let first = true;
    for (const slug of category.slugs) {
      const ex = bySlug.get(slug);
      if (!ex) continue;
      items.push({ ex, category: category.name, isFirstInCategory: first });
      first = false;
      seen.add(slug);
    }
  }
  // Safety net: never drop an example that hasn't been categorized yet.
  for (const ex of EXAMPLES) {
    if (!seen.has(ex.slug)) items.push({ ex, isFirstInCategory: false });
  }
  return items;
}

function WallTile({ item }: { item: WallItem }) {
  const { ex } = item;
  const [failed, setFailed] = React.useState(false);
  const isFeature = FEATURES.has(ex.slug);

  return (
    <Link
      to={examplePath(ex)}
      className={`${styles.cell} ${isFeature ? styles.feature : ''}`}
      data-testid='example-vignette'
    >
      {failed ? (
        <div className={styles.placeholder} aria-hidden>
          <span>{ex.label}</span>
        </div>
      ) : (
        <img
          src={thumbnailUrl(ex)}
          alt={ex.label}
          loading='lazy'
          onError={() => setFailed(true)}
          style={{ objectPosition: ex.objectPosition || 'center' }}
        />
      )}
      <div className={styles.tagGroup}>
        {item.isFirstInCategory && item.category && (
          <div className={`${styles.tab} ${styles.tabCategory}`}>{item.category}</div>
        )}
        <div className={`${styles.tab} ${styles.tabLabel}`}>{ex.label}</div>
      </div>
    </Link>
  );
}

export function ExamplesGalleryPage() {
  const wall = buildWall();

  return (
    <div className='playground'>
      <header className='pg-header'>
        <div>
          <h1>Examples</h1>
          <div className={styles.headerLegend}>
            {EXAMPLE_CATEGORIES.map((category, idx) => (
              <React.Fragment key={category.name}>
                <span>{category.name}</span>
                {idx < EXAMPLE_CATEGORIES.length - 1 && <span className={styles.sep}>/</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className='meta'>
          <span>
            {wall.length} · <span className='now'>specimens</span>
          </span>
        </div>
      </header>
      <div className={styles.grid}>
        {wall.map((item) => (
          <WallTile key={item.ex.slug} item={item} />
        ))}
      </div>
    </div>
  );
}
