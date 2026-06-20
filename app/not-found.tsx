import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

/**
 * 루트 404 바운더리 (App Router).
 * 매칭되는 라우트가 없거나 notFound() 호출 시 표시된다.
 * 서버 컴포넌트 — GlobalHeader/Provider 는 layout 에서 유지된다.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] w-full flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mb-6 inline-flex items-center justify-center rounded-full border border-primary/20 bg-primary/10 p-5">
        <Compass className="h-10 w-10 text-primary" aria-hidden="true" />
      </div>

      <p className="text-5xl font-black tracking-tight text-on-surface">404</p>
      <h1 className="mt-4 text-2xl font-bold text-on-surface">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="mt-3 max-w-md text-base text-on-surface-variant">
        요청하신 페이지가 삭제되었거나 주소가 변경되었을 수 있습니다.
        입력하신 주소를 다시 확인해 주세요.
      </p>

      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98]"
      >
        <Home className="h-5 w-5" aria-hidden="true" />
        홈으로 돌아가기
      </Link>
    </main>
  );
}
