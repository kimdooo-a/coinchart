'use client';

import { useState } from 'react';
import { Link2, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface BlogShareButtonsProps {
  title: string;
  slug: string;
}

export default function BlogShareButtons({ title, slug }: BlogShareButtonsProps) {
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/blog/${slug}`
    : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 폴백
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareToX = () => {
    const text = encodeURIComponent(title);
    const shareUrl = encodeURIComponent(url);
    window.open(
      `https://x.com/intent/tweet?text=${text}&url=${shareUrl}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-on-surface-variant">
        {lang === 'ko' ? '공유' : 'Share'}:
      </span>
      <button
        onClick={copyLink}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-on-surface-variant border border-outline-variant rounded-lg hover:text-on-surface hover:border-outline transition-colors"
        title={lang === 'ko' ? '링크 복사' : 'Copy link'}
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Link2 className="w-3.5 h-3.5" />}
        {copied
          ? lang === 'ko' ? '복사됨' : 'Copied'
          : lang === 'ko' ? '링크 복사' : 'Copy link'}
      </button>
      <button
        onClick={shareToX}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-on-surface-variant border border-outline-variant rounded-lg hover:text-on-surface hover:border-outline transition-colors"
        title="Share on X"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        X
      </button>
    </div>
  );
}
