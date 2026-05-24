// 게시판 정적 메타 SSOT — R3/T01(2026-05-24)에서 mock-posts.ts로부터 분리.
// 게시판 슬러그와 표시 메타(이름·이모지·카테고리)의 단일 진실 공급원이다.
// 정적 상수이므로 별도 파일로 관리한다. (R3/T05에서 mock-posts.ts는 삭제됨 —
// 모든 소비처는 본 파일을 직접 import한다.)

/** 게시판 슬러그 — 자유게시판 / 시세토론 / 정보공유 3종 */
export type BoardSlug = "free" | "market" | "info";

/** 게시판별 표시 메타 (이름·영문명·이모지·설명·카테고리 목록) */
export const BOARD_META: Record<
  BoardSlug,
  { name: string; nameEn: string; emoji: string; description: string; categories: string[] }
> = {
  free: {
    name: "자유게시판",
    nameEn: "Free Board",
    emoji: "💬",
    description: "일상·잡담·뉴스 반응을 자유롭게",
    categories: ["전체", "잡담", "질문", "후기", "인증", "공지"],
  },
  market: {
    name: "시세토론",
    nameEn: "Market Talk",
    emoji: "📈",
    description: "차트·진입가·전략을 함께 나눠요",
    categories: ["전체", "비트코인", "이더리움", "알트코인", "주식", "분석글"],
  },
  info: {
    name: "정보공유",
    nameEn: "Info",
    emoji: "📚",
    description: "분석글·자료·뉴스 정리",
    categories: ["전체", "뉴스정리", "자료", "분석글", "거래소", "가이드"],
  },
};
