'use client';

import { useMemo } from 'react';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

interface BlogPostContentProps {
  content: Record<string, unknown>;
}

export default function BlogPostContent({ content }: BlogPostContentProps) {
  const html = useMemo(() => {
    if (!content || !content.type) return '';

    try {
      return generateHTML(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content as any,
        [
          StarterKit.configure({ codeBlock: false }),
          Image,
          LinkExtension,
          CodeBlockLowlight.configure({ lowlight }),
        ]
      );
    } catch (err) {
      console.error('HTML 변환 오류:', err);
      return '<p>콘텐츠를 표시할 수 없습니다.</p>';
    }
  }, [content]);

  return (
    <div
      className="prose prose-invert prose-lg max-w-none
        prose-headings:text-white prose-headings:font-bold
        prose-p:text-gray-300 prose-p:leading-relaxed
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-strong:text-white
        prose-code:text-primary prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
        prose-pre:bg-black/60 prose-pre:border prose-pre:border-white/10
        prose-blockquote:border-l-primary prose-blockquote:text-gray-400
        prose-img:rounded-xl prose-img:border prose-img:border-white/10
        prose-hr:border-white/10
        prose-li:text-gray-300"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
