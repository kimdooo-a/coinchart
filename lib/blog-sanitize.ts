// HTML sanitization (DOMPurify)
import DOMPurify from 'isomorphic-dompurify';

/**
 * 블로그 콘텐츠 HTML 정제
 * - script, event handler 등 위험 요소 제거
 * - 블로그에 필요한 태그/속성은 허용
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      // 기본 텍스트
      'p', 'br', 'hr', 'span', 'div',
      // 제목
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      // 서식
      'strong', 'b', 'em', 'i', 'u', 's', 'del', 'mark', 'code', 'pre',
      // 리스트
      'ul', 'ol', 'li',
      // 인용/코드
      'blockquote',
      // 링크/이미지
      'a', 'img',
      // 테이블
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'colgroup', 'col',
      // 미디어
      'iframe', // YouTube 임베드용
      // 기타
      'figure', 'figcaption', 'sup', 'sub',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title', 'width', 'height',
      'class', 'id', 'style',
      // 테이블
      'colspan', 'rowspan', 'colwidth',
      // iframe (YouTube)
      'allowfullscreen', 'frameborder', 'allow',
      // 데이터 속성
      'data-youtube-video',
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    // YouTube iframe만 허용
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allowfullscreen', 'frameborder', 'allow'],
  });
}
