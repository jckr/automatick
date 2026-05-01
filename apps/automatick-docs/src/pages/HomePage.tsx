import React from 'react';
import { Link } from 'react-router-dom';
import { HeroBubbles } from '../components/HeroBubbles';
import { ArrowIcon } from '../layout/icons';

export function HomePage() {
  return (
    <>
      <section
        style={{
          width: '100%',
          minHeight: '50vh',
          padding: 0,
          margin: 0,
          display: 'block',
        }}
      >
        <HeroBubbles />
      </section>

      <section
        className='hero'
        style={{
          gridTemplateColumns: '1fr',
          paddingTop: 48,
          paddingBottom: 96,
        }}
      >
        <div>
          <h1>animations that run themselves</h1>
          <p className='lede'>
            You provide three things: starting data, how to update it, how
            to render it.
          </p>
          <p className='lede'>
            Automatick handles the plumbing. The same engine works whether:
          </p>
          <ul
            className='lede'
            style={{ paddingLeft: '1.4em', margin: '0 0 28px' }}
          >
            <li>you use React or not,</li>
            <li>the update runs on the main thread or in a web worker,</li>
            <li>you render with HTML/SVG, Canvas or WebGL.</li>
          </ul>
          <div className='cta-row'>
            <Link to='/examples/automatick-hero' className='btn primary'>
              See examples
              <span className='kbd-inline'>
                <ArrowIcon />
              </span>
            </Link>
            <Link to='/guide/tutorial' className='btn'>
              Read the tutorial
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
