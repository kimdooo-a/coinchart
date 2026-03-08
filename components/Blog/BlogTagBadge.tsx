'use client';

import Link from 'next/link';
import type { BlogTag } from '@/types/blog';

interface BlogTagBadgeProps {
  tag: BlogTag;
  linked?: boolean;
}

export default function BlogTagBadge({ tag, linked = true }: BlogTagBadgeProps) {
  const className =
    'inline-block px-2.5 py-0.5 text-xs text-gray-400 bg-white/5 border border-white/10 rounded-full hover:text-white hover:border-white/20 transition-colors';

  if (linked) {
    return (
      <Link href={`/blog/tag/${tag.slug}`} className={className}>
        #{tag.name}
      </Link>
    );
  }

  return <span className={className}>#{tag.name}</span>;
}
