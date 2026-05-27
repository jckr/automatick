import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Topbar } from './Topbar';
import { Footer } from './Footer';

const PR_NUMBER = import.meta.env.VITE_PR_NUMBER;

function PreviewBanner() {
  if (!PR_NUMBER) return null;
  return (
    <div
      style={{
        background: '#1a56db',
        color: '#fff',
        padding: '6px 16px',
        fontSize: 13,
        textAlign: 'center',
      }}
    >
      Preview for{' '}
      <a
        href={`https://github.com/jckr/automatick/pull/${PR_NUMBER}`}
        style={{ color: '#fff', fontWeight: 600 }}
        target='_blank'
        rel='noopener noreferrer'
      >
        PR #{PR_NUMBER}
      </a>
    </div>
  );
}

export function DocsLayout() {
  const { pathname, hash } = useLocation();

  // Reset scroll on route change (unless the route includes a hash anchor).
  React.useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return (
    <>
      <PreviewBanner />
      <Topbar />
      <Outlet />
      <Footer />
    </>
  );
}
