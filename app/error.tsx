'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

/**
 * 루트 에러 바운더리 (App Router).
 * 라우트 세그먼트 렌더링 중 던져진 에러를 잡아 폴백 UI 를 표시한다.
 * 'use client' 필수 — reset() 으로 세그먼트 재렌더(복구)를 시도한다.
 * GlobalHeader/Provider 는 layout 에서 유지된다(전역 크래시는 global-error 가 담당).
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 운영 환경에서는 콘솔로만 기록(별도 텔레메트리 미연결). digest 로 서버 로그와 대조 가능.
    console.error('[route-error]', error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] w-full flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mb-6 inline-flex items-center justify-center rounded-full border border-error/20 bg-error/10 p-5">
        <AlertTriangle className="h-10 w-10 text-error" aria-hidden="true" />
      </div>

      <h1 className="text-2xl font-bold text-on-surface">
        문제가 발생했습니다
      </h1>
      <p className="mt-3 max-w-md text-base text-on-surface-variant">
        페이지를 표시하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
        문제가 계속되면 잠시 뒤에 접속해 주세요.
      </p>

      {error.digest && (
        <p className="mt-3 font-mono text-xs text-on-surface-variant/70">
          오류 코드: {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98]"
        >
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
          다시 시도
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-container px-6 py-3 text-base font-bold text-on-surface transition-all hover:bg-surface-container-high"
        >
          <Home className="h-5 w-5" aria-hidden="true" />
          홈으로
        </Link>
      </div>
    </main>
  );
}
