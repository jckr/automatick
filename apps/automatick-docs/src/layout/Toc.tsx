import React from 'react';
import { useLocation } from 'react-router-dom';

type Heading = { id: string; text: string; level: 2 | 3 };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function collectHeadings(): Heading[] {
  const root = document.querySelector('.content');
  if (!root) return [];
  const els = Array.from(
    root.querySelectorAll<HTMLElement>('h2, h3')
  );
  return els.map((el) => {
    if (!el.id) {
      const slug = slugify(el.textContent ?? '');
      if (slug) el.id = slug;
    }
    return {
      id: el.id,
      text: el.textContent ?? '',
      level: (el.tagName === 'H2' ? 2 : 3) as 2 | 3,
    };
  });
}

export function Toc() {
  const { pathname } = useLocation();
  const [headings, setHeadings] = React.useState<Heading[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Wait for the route's content to mount before scanning.
    const raf = requestAnimationFrame(() => {
      const found = collectHeadings();
      setHeadings(found);
      setActiveId(found[0]?.id ?? null);
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  React.useEffect(() => {
    if (!headings.length) return;
    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el != null);

    if (!elements.length) return;

    // Track which headings have crossed the top sentinel (89px = topbar 57 + 32 buffer).
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        const firstVisible = headings.find((h) => visible.has(h.id));
        if (firstVisible) {
          setActiveId(firstVisible.id);
          return;
        }
        // Nothing fully in zone — pick the last heading whose top is above the line.
        const line = 120;
        let lastAbove: string | null = null;
        for (const h of headings) {
          const el = document.getElementById(h.id);
          if (el && el.getBoundingClientRect().top < line) lastAbove = h.id;
          else break;
        }
        if (lastAbove) setActiveId(lastAbove);
      },
      { rootMargin: '-89px 0px -70% 0px', threshold: 0 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <aside className='toc'>
      <div className='toc-lbl'>On this page</div>
      <ul>
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`${h.level === 3 ? 'sub' : ''}${
                activeId === h.id ? ' active' : ''
              }`.trim()}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
