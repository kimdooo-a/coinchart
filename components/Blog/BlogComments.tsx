'use client';

import { useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface BlogCommentsProps {
  slug: string;
}

/**
 * Giscus 기반 댓글 컴포넌트
 * GitHub Discussions를 활용한 댓글 시스템
 *
 * 설정 방법:
 * 1. https://giscus.app 에서 리포지토리 설정
 * 2. 아래 REPO, REPO_ID, CATEGORY_ID를 실제 값으로 교체
 */
const GISCUS_CONFIG = {
  repo: 'kimdooo-a/coinchart' as `${string}/${string}`,
  repoId: 'R_kgDOQoFNbg',
  category: 'General',
  categoryId: 'DIC_kwDOQoFNbs4C38fP',
};

export default function BlogComments({ slug }: BlogCommentsProps) {
  const { lang } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !GISCUS_CONFIG.repoId) return;

    // 기존 giscus iframe 제거
    const existing = ref.current.querySelector('.giscus');
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', GISCUS_CONFIG.repo);
    script.setAttribute('data-repo-id', GISCUS_CONFIG.repoId);
    script.setAttribute('data-category', GISCUS_CONFIG.category);
    script.setAttribute('data-category-id', GISCUS_CONFIG.categoryId);
    script.setAttribute('data-mapping', 'specific');
    script.setAttribute('data-term', slug);
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', 'dark_dimmed');
    script.setAttribute('data-lang', lang === 'ko' ? 'ko' : 'en');
    script.setAttribute('data-loading', 'lazy');
    script.crossOrigin = 'anonymous';
    script.async = true;

    ref.current.appendChild(script);
  }, [slug, lang]);

  // Giscus 미설정 시 안내 메시지
  if (!GISCUS_CONFIG.repoId) {
    return (
      <div className="mt-12 pt-8 border-t border-outline-variant">
        <h3 className="text-lg font-bold mb-4">
          {lang === 'ko' ? '댓글' : 'Comments'}
        </h3>
        <p className="text-sm text-on-surface-variant">
          {lang === 'ko'
            ? '댓글 기능은 Giscus 설정 후 활성화됩니다.'
            : 'Comments will be enabled after Giscus configuration.'}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-12 pt-8 border-t border-outline-variant">
      <h3 className="text-lg font-bold mb-4">
        {lang === 'ko' ? '댓글' : 'Comments'}
      </h3>
      <div ref={ref} />
    </div>
  );
}
