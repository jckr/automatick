import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowIcon } from './icons';

type Crumb = { label: string; to?: string };
type Sibling = { label: string; to: string };

type Props = {
  crumbs?: Crumb[];
  prev?: Sibling;
  next?: Sibling;
  children: React.ReactNode;
};

export function GuidePage({ crumbs, prev, next, children }: Props) {
  return (
    <>
      {crumbs && crumbs.length > 0 ? (
        <nav className='breadcrumbs'>
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 ? <span className='sep'>/</span> : null}
              {c.to && i < crumbs.length - 1 ? (
                <Link to={c.to}>{c.label}</Link>
              ) : (
                <span className='now'>{c.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      ) : null}
      {children}
      {(prev || next) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
            marginTop: 56,
            paddingTop: 24,
            borderTop: '1px solid var(--border)',
          }}
        >
          {prev ? (
            <Link to={prev.to} className='btn ghost' style={{ paddingLeft: 0 }}>
              ← {prev.label}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link to={next.to} className='btn'>
              {next.label} <ArrowIcon />
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </>
  );
}
