// 블로그 유틸리티 함수

/**
 * HTML 태그를 제거하고 텍스트만 추출
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ');
}

/**
 * TipTap JSON에서 텍스트 추출
 */
function extractTextFromTiptap(node: Record<string, unknown>): string {
  if (node.type === 'text' && typeof node.text === 'string') {
    return node.text;
  }

  if (Array.isArray(node.content)) {
    return (node.content as Record<string, unknown>[])
      .map(extractTextFromTiptap)
      .join(' ');
  }

  return '';
}

/**
 * 읽기 시간 계산 (분)
 * 한국어: 분당 약 500자, 영어: 분당 약 200단어
 */
export function calculateReadingTime(
  content: string | Record<string, unknown>,
  lang: 'ko' | 'en' = 'ko'
): number {
  const text = typeof content === 'string'
    ? stripHtml(content)
    : extractTextFromTiptap(content);

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
