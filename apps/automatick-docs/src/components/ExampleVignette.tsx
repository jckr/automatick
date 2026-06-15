import React from 'react';
import { Link } from 'react-router-dom';
import { ExampleMeta, examplePath, thumbnailUrl } from '../examples';
import styles from './ExampleVignette.module.css';

/**
 * A single gallery tile: thumbnail (cover-cropped to the tile aspect) plus the
 * example title, linking to the example page. Falls back to a labeled
 * placeholder when the thumbnail image is missing, so the gallery renders even
 * before thumbnails have been captured.
 */
export function ExampleVignette({ ex }: { ex: ExampleMeta }) {
  const [failed, setFailed] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  // A cached image can finish loading before React attaches `onLoad`; catch
  // that case so the skeleton doesn't linger over an already-painted tile.
  React.useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  return (
    <Link to={examplePath(ex)} className={styles.vignette} data-testid='example-vignette'>
      <div className={`${styles.thumb} ${loaded || failed ? styles.settled : ''}`}>
        {failed ? (
          <div className={styles.placeholder} aria-hidden>
            <span>{ex.label}</span>
          </div>
        ) : (
          <img
            ref={imgRef}
            src={thumbnailUrl(ex)}
            alt={ex.label}
            loading='lazy'
            decoding='async'
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            style={ex.objectPosition ? { objectPosition: ex.objectPosition } : undefined}
          />
        )}
      </div>
      <div className={styles.caption}>{ex.label}</div>
    </Link>
  );
}
