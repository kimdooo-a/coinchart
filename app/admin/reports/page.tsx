'use client';

// R-B 2026-06-20 / T12 — 관리자 신고 검토 페이지
// 신고 목록(pending/reviewed/dismissed 탭) + 상태변경(PATCH) + 대상 텍스트 표시.
// 권한: 클라 게이트는 표시용, 실제 권한은 /api/admin/reports 서버가 검증.
// 딥링크: target_id(uuid)만 제공되므로 정확한 /board/{slug}/{id} 생성 불가 → uuid 축약 텍스트 표시.
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { REPORT_REASON_LABELS, type ReportReason } from '@/lib/community/report-client';
import { formatDateTime } from '@/lib/community/format-utils';

// 클라 표시 게이트용 관리자 이메일(서버는 requireAdmin으로 별도 검증) — 기존 admin 페이지 관례 따름
const ADMIN_EMAIL = 'smartkdy7@gmail.com';

type ReportStatus = 'pending' | 'reviewed' | 'dismissed';

interface Report {
  id: string;
  target_type: 'post' | 'comment';
  target_id: string;
  reason: string;
  detail: string | null;
  reporter_user_id: string;
  status: ReportStatus;
  created_at: string;
}

const STATUS_TABS: { key: ReportStatus; label: string }[] = [
  { key: 'pending', label: '대기 중' },
  { key: 'reviewed', label: '검토 완료' },
  { key: 'dismissed', label: '기각' },
];

const STATUS_BADGE: Record<ReportStatus, string> = {
  pending: 'bg-warning-container text-warning',
  reviewed: 'bg-secondary-container text-secondary',
  dismissed: 'bg-surface-container text-on-surface-variant',
};

const STATUS_LABEL: Record<ReportStatus, string> = {
  pending: '대기',
  reviewed: '검토됨',
  dismissed: '기각',
};

function shortenUuid(uuid: string): string {
  return uuid.slice(0, 8) + '…';
}

export default function AdminReportsPage() {
  // 권한 게이트(표시용)
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  // 탭 + 목록
  const [activeTab, setActiveTab] = useState<ReportStatus>('pending');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // 상태변경 진행 표시(중복 클릭 방지)
  const [patchingId, setPatchingId] = useState<string | null>(null);

  const loadReports = useCallback(async (status: ReportStatus) => {
    setLoading(true);
    setListError(null);
    try {
      const res = await fetch(`/api/admin/reports?status=${encodeURIComponent(status)}`);
      const data: { reports?: Report[]; error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error ?? '신고 목록 로드 실패');
      setReports(data.reports ?? []);
    } catch (e: unknown) {
      setListError(e instanceof Error ? e.message : '신고 목록 로드 실패');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 마운트 시 관리자 검증
  useEffect(() => {
    const verifyAdmin = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const ok = !!user && user.email === ADMIN_EMAIL;
      setAuthorized(ok);
      setChecking(false);
      if (ok) void loadReports('pending');
    };
    void verifyAdmin();
  }, [loadReports]);

  const handleTabChange = (tab: ReportStatus) => {
    setActiveTab(tab);
    void loadReports(tab);
  };

  const handlePatch = async (reportId: string, nextStatus: ReportStatus) => {
    setPatchingId(reportId);
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status: nextStatus }),
      });
      const data: { ok?: boolean; error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error ?? '상태 변경 실패');
      // 목록 갱신(현재 탭 기준)
      void loadReports(activeTab);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '상태 변경에 실패했습니다.');
    } finally {
      setPatchingId(null);
    }
  };

  // 검증 중
  if (checking) {
    return (
      <main className="flex-1 bg-surface-container-low min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-body-sm">권한 확인 중...</p>
        </div>
      </main>
    );
  }

  // 접근 거부
  if (!authorized) {
    return (
      <main className="flex-1 bg-surface-container-low min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-md p-8 text-center max-w-md w-full">
          <h1 className="text-h2 text-error mb-3">접근 권한 없음</h1>
          <p className="text-on-surface-variant text-body-sm mb-6">
            관리자만 접근할 수 있는 페이지입니다.
          </p>
          <Link
            href="/"
            className="inline-block bg-primary text-on-primary text-label-bold px-6 py-2 rounded-md hover:bg-primary-container"
          >
            홈으로
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-surface-container-low min-h-screen">
      <div className="max-w-[900px] mx-auto px-4 lg:px-6 py-6">
        {/* 브레드크럼 */}
        <nav className="text-meta text-on-surface-variant mb-3">
          <Link href="/" className="hover:text-primary">홈</Link>
          <span className="mx-1">›</span>
          <Link href="/admin" className="hover:text-primary">관리자</Link>
          <span className="mx-1">›</span>
          <span>신고 검토</span>
        </nav>

        <h1 className="text-h2 mb-5">🚨 신고 검토</h1>

        {/* 상태 탭 */}
        <div className="flex gap-1 border-b border-outline-variant mb-5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={
                'px-4 py-2 text-label-bold rounded-t-md transition-colors ' +
                (activeTab === tab.key
                  ? 'bg-surface-container-lowest border border-b-transparent border-outline-variant text-primary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container')
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 에러 */}
        {listError && (
          <div className="bg-error-container text-error text-body-sm rounded-md px-4 py-3 mb-4">
            {listError}
          </div>
        )}

        {/* 신고 목록 */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-md">
          <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
            <h2 className="text-h3">
              신고 목록
              {loading && (
                <span className="text-meta text-on-surface-variant ml-2 font-normal">불러오는 중...</span>
              )}
            </h2>
            <span className="text-meta text-on-surface-variant">{reports.length}건</span>
          </div>

          {!loading && reports.length === 0 ? (
            <p className="text-on-surface-variant text-body-sm px-5 py-8 text-center">
              {activeTab === 'pending' && '대기 중인 신고가 없습니다.'}
              {activeTab === 'reviewed' && '검토 완료된 신고가 없습니다.'}
              {activeTab === 'dismissed' && '기각된 신고가 없습니다.'}
            </p>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {reports.map((r) => {
                const reasonLabel =
                  r.reason in REPORT_REASON_LABELS
                    ? REPORT_REASON_LABELS[r.reason as ReportReason]
                    : r.reason;
                const isPending = patchingId === r.id;

                return (
                  <li key={r.id} className="px-5 py-4">
                    {/* 상단 행: 타입 배지 + 사유 + 상태 배지 */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {/* 대상 타입 */}
                      <span
                        className={
                          'text-meta px-2 py-0.5 rounded shrink-0 ' +
                          (r.target_type === 'post'
                            ? 'bg-primary-fixed text-primary'
                            : 'bg-secondary-fixed text-secondary')
                        }
                      >
                        {r.target_type === 'post' ? '게시글' : '댓글'}
                      </span>

                      {/* 사유 라벨 */}
                      <span className="text-label-bold text-on-surface">{reasonLabel}</span>

                      {/* 상태 배지 */}
                      <span
                        className={
                          'text-meta px-2 py-0.5 rounded ml-auto shrink-0 ' +
                          STATUS_BADGE[r.status]
                        }
                      >
                        {STATUS_LABEL[r.status]}
                      </span>
                    </div>

                    {/* 대상 ID (딥링크 불가 — target_id만 있고 board slug 없음) */}
                    <div className="text-meta text-on-surface-variant mb-1">
                      대상 ID:{' '}
                      <span
                        className="font-mono bg-surface-container px-1.5 py-0.5 rounded text-xs"
                        title={r.target_id}
                      >
                        {shortenUuid(r.target_id)}
                      </span>
                    </div>

                    {/* 상세 내용 */}
                    {r.detail && (
                      <p className="text-body-sm text-on-surface mb-2 whitespace-pre-line line-clamp-3">
                        {r.detail}
                      </p>
                    )}

                    {/* 하단 행: 신고 시각 + 액션 버튼 */}
                    <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
                      <span className="text-meta text-on-surface-variant">
                        신고 시각: {formatDateTime(r.created_at)}
                      </span>

                      {/* 상태변경 버튼 */}
                      <div className="flex gap-2">
                        {r.status !== 'reviewed' && (
                          <button
                            type="button"
                            disabled={!!patchingId}
                            onClick={() => handlePatch(r.id, 'reviewed')}
                            className="text-meta bg-secondary text-on-secondary hover:bg-secondary-container px-3 py-1.5 rounded-md disabled:opacity-60"
                          >
                            {isPending ? '...' : '검토 완료'}
                          </button>
                        )}
                        {r.status !== 'dismissed' && (
                          <button
                            type="button"
                            disabled={!!patchingId}
                            onClick={() => handlePatch(r.id, 'dismissed')}
                            className="text-meta border border-outline-variant text-on-surface-variant hover:bg-surface-container-low px-3 py-1.5 rounded-md disabled:opacity-60"
                          >
                            {isPending ? '...' : '기각'}
                          </button>
                        )}
                        {r.status !== 'pending' && (
                          <button
                            type="button"
                            disabled={!!patchingId}
                            onClick={() => handlePatch(r.id, 'pending')}
                            className="text-meta border border-outline-variant text-on-surface-variant hover:bg-surface-container-low px-3 py-1.5 rounded-md disabled:opacity-60"
                          >
                            {isPending ? '...' : '대기로 되돌리기'}
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
