// 커뮤니티 날짜 포맷 공용 유틸
// - formatRelativeTime: 상대 시간 ("방금 전", "N분 전" 등) — /scraps 등에서 사용
// - formatDateTime: 절대 시각 (toLocaleString 기반) — 관리자 페이지 등에서 사용

/** 상대 시간 포맷 ("방금 전", "N분 전", "N시간 전", "N일 전", 그 외 월/일) */
export function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}시간 전`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
}

/** 절대 시각 포맷 (연/월/일 시:분, toLocaleString 기반) */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
