'use client';

import Link from 'next/link';
import type { BlogTag } from '@/types/blog';

interface BlogTagBadgeProps {
  tag: BlogTag;
  linked?: boolean;
}

export default function BlogTagBadge({ tag, linked = true }: BlogTagBadgeProps) {
  const className =
    'inline-block px-2.5 py-0.5 text-xs text-on-surface-variant bg-surface-container border border-outline-variant rounded-full hover:text-on-surface hover:border-outline transition-colors';

  if (linked) {
    return (
      <Link href={`/blog/tag/${tag.slug}`} className={className}>
        #{tag.name}
      </Link>
    );
  }

  return <span className={className}>#{tag.name}</span>;
}
