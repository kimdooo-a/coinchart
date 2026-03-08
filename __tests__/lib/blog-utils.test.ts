import { describe, it, expect } from 'vitest';
import { calculateReadingTime } from '@/lib/blog-utils';

describe('calculateReadingTime', () => {
  it('한국어: 500자 이하는 1분', () => {
    const text = '가'.repeat(400);
    expect(calculateReadingTime(text, 'ko')).toBe(1);
  });

  it('한국어: 1000자는 2분', () => {
    const text = '가'.repeat(1000);
    expect(calculateReadingTime(text, 'ko')).toBe(2);
  });

  it('영어: 200단어 이하는 1분', () => {
    const text = Array(150).fill('word').join(' ');
    expect(calculateReadingTime(text, 'en')).toBe(1);
  });

  it('영어: 400단어는 2분', () => {
    const text = Array(400).fill('word').join(' ');
    expect(calculateReadingTime(text, 'en')).toBe(2);
  });

  it('HTML 태그 제거 후 계산', () => {
    const html = '<p>' + '가'.repeat(500) + '</p>';
    expect(calculateReadingTime(html, 'ko')).toBe(1);
  });

  it('TipTap JSON 콘텐츠 처리', () => {
    const tiptapContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '가'.repeat(1000) },
          ],
        },
      ],
    };
    expect(calculateReadingTime(tiptapContent, 'ko')).toBe(2);
  });

  it('빈 콘텐츠는 최소 1분', () => {
    expect(calculateReadingTime('', 'ko')).toBe(1);
    expect(calculateReadingTime('', 'en')).toBe(1);
  });

  it('기본 언어는 한국어', () => {
    const text = '가'.repeat(1000);
    expect(calculateReadingTime(text)).toBe(2);
  });
});
