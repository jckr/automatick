import React from 'react';
import { Link } from 'react-router-dom';

const REPO_URL = 'https://github.com/jckr/automatick';
const NPM_URL = 'https://www.npmjs.com/package/automatick';

export function Footer() {
  return (
    <footer className='site-footer'>
      <div className='col brand-col'>
        <Link
          to='/'
          className='brand'
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 8,
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: 'var(--fg1)',
            textDecoration: 'none',
            fontSize: 15,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 14,
              background: 'var(--accent)',
              transform: 'translateY(2px)',
            }}
          />
          automatick
        </Link>
        <p>
          A React simulation engine for building tick-based state simulations.
          MIT licensed.
        </p>
        <div
          className='mono'
          style={{ color: 'var(--fg4)', fontSize: 11 }}
        >
          by <a href={REPO_URL} style={{ color: 'var(--fg3)' }}>jckr</a> · built
          in the open
        </div>
      </div>
      <div className='col'>
        <div className='lbl'>Docs</div>
        <Link to='/'>Overview</Link>
        <Link to='/guide/getting-started'>Getting started</Link>
        <Link to='/guide/tutorial'>Tutorial</Link>
        <Link to='/api/define-sim'>API reference</Link>
      </div>
      <div className='col'>
        <div className='lbl'>Examples</div>
        <Link to='/examples/counter'>Counter</Link>
        <Link to='/examples/game-of-life'>Game of Life</Link>
        <Link to='/examples/boids'>Boids</Link>
        <Link to='/examples/gray-scott'>Gray-Scott</Link>
      </div>
      <div className='col'>
        <div className='lbl'>Community</div>
        <a href={REPO_URL} target='_blank' rel='noreferrer'>GitHub</a>
        <a href={NPM_URL} target='_blank' rel='noreferrer'>npm</a>
        <a href={`${REPO_URL}/issues`} target='_blank' rel='noreferrer'>
          Report an issue
        </a>
      </div>
      <div className='copyright'>
        <span>© {new Date().getFullYear()} jckr · MIT license</span>
        <span>v0.0.1</span>
      </div>
    </footer>
  );
}
