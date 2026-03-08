// HTML 유틸리티 함수 (heading 추출, 텍스트 추출 등)

export interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

/**
 * HTML 문자열에서 h2/h3 heading 추출
 * BlogPostContent, BlogTableOfContents에서 공유
 */
export function extractHeadingsFromHtml(html: string): HeadingItem[] {
  const items: HeadingItem[] = [];
  const regex = /<h([23])([^>]*)>([\s\S]*?)<\/h[23]>/gi;
  let match;
  let idx = 0;

  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    // HTML 태그 제거하여 순수 텍스트 추출
    const text = match[3].replace(/<[^>]*>/g, '').trim();
    if (text) {
      items.push({
        id: `heading-${idx}`,
        text,
        level,
      });
      idx++;
    }
  }

  return items;
}

/**
 * HTML에 heading ID 부여 (h2, h3만)
 */
export function addHeadingIds(html: string): string {
  let idx = 0;
  return html.replace(/<(h[23])([^>]*)>/gi, (_match, tag, attrs) => {
    const id = `heading-${idx}`;
    idx++;
    return `<${tag}${attrs} id="${id}">`;
  });
}

/**
 * HTML에서 순수 텍스트 추출 (읽기시간 계산용)
 */
export function extractTextFromHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ');
}

/**
 * TipTap JSON에서 텍스트 재귀 추출 (마이그레이션 호환용)
 */
function extractTextFromTiptapJson(node: Record<string, unknown>): string {
  if (node.type === 'text' && typeof node.text === 'string') {
    return node.text;
  }
  if (Array.isArray(node.content)) {
    return (node.content as Record<string, unknown>[])
      .map(extractTextFromTiptapJson)
      .join(' ');
  }
  return '';
}

/**
 * 콘텐츠(HTML 문자열 또는 레거시 TipTap JSON)에서 텍스트 추출
 * DB 마이그레이션 완료 전 호환용
 */
export function extractText(content: string | Record<string, unknown>): string {
  if (typeof content === 'string') {
    return extractTextFromHtml(content);
  }
  return extractTextFromTiptapJson(content);
}

/**
 * 콘텐츠를 HTML 문자열로 정규화 (마이그레이션 호환용)
 * - 이미 string이면 그대로 반환
 * - TipTap JSON이면 빈 문자열 반환 (클라이언트에서 처리)
 */
export function normalizeContent(content: string | Record<string, unknown>): string {
  if (typeof content === 'string') return content;
  return '';
}
