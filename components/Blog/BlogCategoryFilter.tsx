'use client';

import type { BlogCategory } from '@/types/blog';
import { useLanguage } from '@/context/LanguageContext';

interface BlogCategoryFilterProps {
  categories: BlogCategory[];
  selected: string | null; // category slug 또는 null (전체)
  onSelect: (slug: string | null) => void;
}

export default function BlogCategoryFilter({
  categories,
  selected,
  onSelect,
}: BlogCategoryFilterProps) {
  const { lang } = useLanguage();

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${
          selected === null
            ? 'bg-primary text-on-primary border-primary font-medium'
            : 'text-on-surface-variant border-outline-variant hover:text-on-surface hover:border-outline'
        }`}
      >
        {lang === 'ko' ? '전체' : 'All'}
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.slug)}
          className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${
            selected === cat.slug
              ? 'font-medium'
              : 'text-on-surface-variant border-outline-variant hover:text-on-surface hover:border-outline'
          }`}
          style={
            selected === cat.slug
              ? {
                  backgroundColor: `${cat.color}20`,
                  color: cat.color,
                  borderColor: `${cat.color}50`,
                }
              : undefined
          }
        >
          {lang === 'ko' ? cat.name_ko : cat.name_en}
        </button>
      ))}
    </div>
  );
}
