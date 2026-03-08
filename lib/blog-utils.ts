// 블로그 유틸리티 함수

import { extractTextFromHtml } from '@/lib/blog-html-utils';

/**
 * 읽기 시간 계산 (분)
 * 한국어: 분당 약 500자, 영어: 분당 약 200단어
 */
export function calculateReadingTime(
  content: string,
  lang: 'ko' | 'en' = 'ko'
): number {
  const text = extractTextFromHtml(content);

  if (lang === 'ko') {
    // 한국어: 글자 수 기반
    const charCount = text.replace(/\s/g, '').length;
    return Math.max(1, Math.ceil(charCount / 500));
  }

  // 영어: 단어 수 기반
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * 사이트 기본 URL
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'https://chartmaster.pro';
}
