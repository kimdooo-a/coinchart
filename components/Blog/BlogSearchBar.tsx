'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface BlogSearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

export default function BlogSearchBar({ onSearch, initialQuery = '' }: BlogSearchBarProps) {
  const { lang } = useLanguage();
  const [query, setQuery] = useState(initialQuery);
  const timerRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    // 디바운스 300ms
    timerRef.current = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, onSearch]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={lang === 'ko' ? '블로그 검색...' : 'Search blog...'}
        className="w-full pl-10 pr-10 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-colors"
      />
      {query && (
        <button
          onClick={() => setQuery('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
