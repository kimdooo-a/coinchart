'use client';

import { useMemo, useEffect, useRef } from 'react';
import { addHeadingIds, normalizeContent } from '@/lib/blog-html-utils';

interface BlogPostContentProps {
  content: string | Record<string, unknown>;
}

export default function BlogPostContent({ content }: BlogPostContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => {
    if (!content) return '';

    try {
      const htmlStr = normalizeContent(content);
      if (!htmlStr) return '<p>콘텐츠를 표시할 수 없습니다.</p>';
      // heading에 ID 부여 (TOC 연동)
      return addHeadingIds(htmlStr);
    } catch (err) {
      console.error('HTML 처리 오류:', err);
      return '<p>콘텐츠를 표시할 수 없습니다.</p>';
    }
  }, [content]);

  // 코드 블록에 복사 버튼 동적 삽입
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const preBlocks = container.querySelectorAll('pre');
    preBlocks.forEach((pre) => {
      // 이미 버튼이 있으면 스킵
      if (pre.querySelector('.code-copy-btn')) return;

      pre.style.position = 'relative';

      const btn = document.createElement('button');
      btn.className = 'code-copy-btn absolute top-2 right-2 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded text-gray-400 transition-colors';
      btn.textContent = 'Copy';

      btn.addEventListener('click', () => {
        const code = pre.querySelector('code');
        const text = code?.textContent || pre.textContent || '';
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = 'Copied!';
          setTimeout(() => {
            btn.textContent = 'Copy';
          }, 2000);
        });
      });

      pre.appendChild(btn);
    });
  }, [html]);

  return (
    <div
      ref={contentRef}
      className="prose prose-lg max-w-none
        prose-headings:text-on-surface prose-headings:font-bold
        prose-headings:mt-8 prose-headings:mb-4
        prose-h2:text-2xl prose-h3:text-xl
        prose-p:text-on-surface prose-p:leading-[1.8]
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-strong:text-on-surface
        prose-code:text-primary prose-code:bg-surface-container-high prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
        prose-pre:bg-black/60 prose-pre:border prose-pre:border-white/10 prose-pre:relative
        prose-blockquote:border-l-primary prose-blockquote:text-on-surface-variant
        prose-img:rounded-xl prose-img:border prose-img:border-outline-variant
        prose-hr:border-outline-variant
        prose-li:text-on-surface prose-li:leading-[1.8]
        prose-table:border-collapse
        prose-th:border prose-th:border-outline-variant prose-th:bg-surface-container prose-th:p-2 prose-th:text-left
        prose-td:border prose-td:border-outline-variant prose-td:p-2"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
