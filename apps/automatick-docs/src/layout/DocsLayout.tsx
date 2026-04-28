import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Topbar } from './Topbar';
import { Footer } from './Footer';

export function DocsLayout() {
  const { pathname, hash } = useLocation();

  // Reset scroll on route change (unless the route includes a hash anchor).
  React.useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return (
    <>
      <Topbar />
      <Outlet />
      <Footer />
    </>
  );
}
