'use client';

import { useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface BlogTableOfContentsProps {
  content: Record<string, unknown>;
}

export default function BlogTableOfContents({ content }: BlogTableOfContentsProps) {
  const { lang } = useLanguage();

  const headings = useMemo(() => {
    const items: TocItem[] = [];
    if (!content || !content.content) return items;

    const nodes = content.content as Array<Record<string, unknown>>;
    let idx = 0;

    for (const node of nodes) {
      if (node.type === 'heading') {
        const level = (node.attrs as Record<string, number>)?.level || 2;
        if (level <= 3) {
          const textContent = ((node.content as Array<Record<string, unknown>>) || [])
            .map((c) => (c.text as string) || '')
            .join('');
          if (textContent) {
            items.push({
              id: `heading-${idx}`,
              text: textContent,
              level,
            });
            idx++;
          }
        }
      }
    }

    return items;
  }, [content]);

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
              className={`text-left text-sm text-gray-400 hover:text-white transition-colors line-clamp-1 ${
                h.level === 3 ? 'pl-4' : ''
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
