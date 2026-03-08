'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface AutoSaveData {
  title: string;
  content: string;
  excerpt: string;
  savedAt: number;
}

interface UseAutoSaveOptions {
  postId?: string; // 없으면 new post
  title: string;
  content: string;
  excerpt: string;
  debounceMs?: number;
  onRestore: (data: { title: string; content: string; excerpt: string }) => void;
}

function getStorageKey(postId?: string): string {
  return postId ? `blog-autosave-${postId}` : 'blog-autosave-new';
}

/**
 * 블로그 에디터 자동저장 훅
 * - localStorage 기반, 3초 디바운스
 * - 페이지 로드 시 복원 확인
 * - 수동 저장 성공 시 clearAutoSave() 호출
 */
export function useAutoSave({
  postId,
  title,
  content,
  excerpt,
  debounceMs = 3000,
  onRestore,
}: UseAutoSaveOptions) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasCheckedRestore, setHasCheckedRestore] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const key = getStorageKey(postId);

  // 자동저장 실행
  const save = useCallback(() => {
    // 내용이 비어있으면 저장하지 않음
    if (!title && !content) return;

    const data: AutoSaveData = {
      title,
      content,
      excerpt,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(key, JSON.stringify(data));
      setLastSaved(new Date());
    } catch {
      // localStorage 용량 초과 등 무시
    }
  }, [key, title, content, excerpt]);

  // 디바운스된 자동저장
  useEffect(() => {
    // 복원 확인 전에는 저장하지 않음
    if (!hasCheckedRestore) return;
    // 내용이 비어있으면 저장하지 않음
    if (!title && !content) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(save, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [title, content, excerpt, save, debounceMs, hasCheckedRestore]);

  // 페이지 로드 시 복원 확인
  useEffect(() => {
    if (hasCheckedRestore) return;

    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const data: AutoSaveData = JSON.parse(stored);
        // 24시간 이내의 자동저장만 복원 제안
        const hoursSince = (Date.now() - data.savedAt) / (1000 * 60 * 60);
        if (hoursSince < 24 && (data.title || data.content)) {
          const savedTime = new Date(data.savedAt).toLocaleString('ko-KR');
          const shouldRestore = window.confirm(
            `자동저장된 내용이 있습니다. (${savedTime})\n복원하시겠습니까?`
          );
          if (shouldRestore) {
            onRestore({
              title: data.title,
              content: data.content,
              excerpt: data.excerpt,
            });
          } else {
            localStorage.removeItem(key);
          }
        } else {
          // 만료된 자동저장 삭제
          localStorage.removeItem(key);
        }
      }
    } catch {
      // 파싱 에러 무시
    }

    setHasCheckedRestore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 수동 저장 성공 시 호출
  const clearAutoSave = useCallback(() => {
    localStorage.removeItem(key);
    setLastSaved(null);
  }, [key]);

  return {
    lastSaved,
    clearAutoSave,
  };
}
