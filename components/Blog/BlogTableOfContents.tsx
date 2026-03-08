'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { extractHeadingsFromHtml, normalizeContent } from '@/lib/blog-html-utils';

interface BlogTableOfContentsProps {
  content: string | Record<string, unknown>;
}

export default function BlogTableOfContents({ content }: BlogTableOfContentsProps) {
  const { lang } = useLanguage();
  const [activeId, setActiveId] = useState<string>('');

  const headings = useMemo(() => {
    if (!content) return [];
    const htmlStr = normalizeContent(content);
    if (!htmlStr) return [];
    return extractHeadingsFromHtml(htmlStr);
  }, [content]);

  // IntersectionObserver로 현재 보이는 heading 추적
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

    if (visible.length > 0) {
      setActiveId(visible[0].target.id);
    }
  }, []);

  useEffect(() => {
    if (headings.length < 2) return;

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: '-80px 0px -60% 0px',
      threshold: 0,
    });

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings, handleIntersection]);

  if (headings.length < 2) return null;

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="p-5 border border-white/10 rounded-xl bg-white/5 sticky top-24">
      <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">
        {lang === 'ko' ? '목차' : 'Table of Contents'}
      </h3>
      <ul className="space-y-1.5">
        {headings.map((h) => (
          <li key={h.id}>
            <button
              onClick={() => scrollToHeading(h.id)}
              className={`text-left text-sm transition-colors line-clamp-1 w-full ${
                h.level === 3 ? 'pl-4' : ''
              } ${
                activeId === h.id
                  ? 'text-primary font-medium border-l-2 border-primary pl-3'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {h.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
