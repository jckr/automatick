import React from 'react';
import { EXAMPLES } from '../examples';
import { ExampleVignette } from '../components/ExampleVignette';
import styles from './ExamplesGalleryPage.module.css';

/**
 * Visual gallery of all curated examples — a wall of vignettes that acts as a
 * more discoverable entry point than the sidebar list. Driven by the shared
 * examples manifest (src/examples.ts) so it never drifts from the sidebar.
 */
export function ExamplesGalleryPage() {
  return (
    <div className='playground'>
      <header className='pg-header'>
        <div>
          <h1>Examples</h1>
        </div>
        <div className='meta'>
          <span>
            {EXAMPLES.length} · <span className='now'>examples</span>
          </span>
        </div>
      </header>
      <div className={styles.grid}>
        {EXAMPLES.map((ex) => (
          <ExampleVignette key={ex.slug} ex={ex} />
        ))}
      </div>
    </div>
  );
}
