import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../components/useTheme';
import {
  GithubIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
} from './icons';

const VERSION = 'v0.0.1';
const REPO_URL = 'https://github.com/jckr/automatick';

const SECTIONS: Array<{ label: string; to: string; match: RegExp }> = [
  { label: 'Guide', to: '/guide/getting-started', match: /^\/guide\b|^\/$/ },
  { label: 'API', to: '/api/define-sim', match: /^\/api\b/ },
  { label: 'Examples', to: '/examples/counter', match: /^\/examples\b/ },
];

export function Topbar() {
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();

  return (
    <header className='topbar'>
      <Link to='/' className='brand'>
        <span className='mark' />
        <span className='name'>automatick</span>
        <span className='slash'>/</span>
        <span className='docs-tag mono'>docs</span>
      </Link>
      <span className='ver'>{VERSION}</span>
      <nav className='primary-nav'>
        {SECTIONS.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className={s.match.test(pathname) ? 'active' : undefined}
          >
            {s.label}
          </Link>
        ))}
      </nav>
      <div className='spacer' />
      <div className='search' aria-hidden>
        <SearchIcon />
        <span>Search docs</span>
        <span className='kbd'>⌘K</span>
      </div>
      <button
        className='icon-btn'
        type='button'
        onClick={toggle}
        title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
        aria-label='Toggle theme'
      >
        {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
      </button>
      <a
        className='icon-btn'
        href={REPO_URL}
        target='_blank'
        rel='noreferrer'
        title='GitHub'
        aria-label='GitHub'
      >
        <GithubIcon />
      </a>
    </header>
  );
}
