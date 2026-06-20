import { Loader2 } from 'lucide-react';

/**
 * 루트 로딩 바운더리 (App Router).
 * 라우트 세그먼트 전환·서버 컴포넌트 데이터 페치 중 Suspense 폴백으로 표시된다.
 * GlobalHeader 는 layout 에 고정 마운트되므로 헤더 공간(pt) 확보 후 중앙 정렬.
 */
export default function Loading() {
  return (
    <div
      className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-4 px-4 py-24 text-on-surface-variant"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm font-medium">불러오는 중…</p>
      <span className="sr-only">콘텐츠를 불러오고 있습니다.</span>
    </div>
  );
}
