import type { BoardPost } from "@/components/community/BoardRow";

export type BoardSlug = "free" | "market" | "info";

export interface MockPost extends BoardPost {
  boardSlug: BoardSlug;
  category: string; // "잡담", "질문" 등
  contentHtml?: string;
  tags?: string[];
  coinSymbol?: string; // 코인 태그 (BTC 등)
}

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

const NICKNAMES = [
  "차트마스터", "존버9년차", "김씨네아저씨", "BTC홀더", "이더리움맘",
  "솔라나단타충", "리플러", "도지코인러버", "알트사냥꾼", "고래트래커",
  "선물고수", "현물러", "투자자A", "한강뷰어", "월스트릿가이",
];

const IPS = [
  "211.34", "218.55", "121.157", "175.223", "59.6",
  "203.246", "112.144", "180.69", "61.97",
];

const DUMMY_TITLES_FREE = [
  "비트코인 13만 달러 또 갱신... 다들 어디까지 보세요?",
  "이더리움 ETF 들어왔다는데 호재인가요?",
  "솔라나 단타로 50만원 벌었습니다 ㅎㅎ",
  "FOMC 회의 일정 정리 (5월)",
  "리플 SEC 소송 이거 결국 어떻게 될까요",
  "오늘 시장 분위기 좀 이상하지 않나요",
  "바이낸스 vs 업비트, 다들 어디 쓰세요?",
  "처음 코인 사봤는데 너무 무섭네요 ㅠㅠ",
  "이번 사이클은 진짜 다른 것 같아요",
  "도지코인 다시 가는거 맞죠?",
  "스팟 ETF 자금 유입 진짜 미쳤다",
  "지금 들어가도 되나요? 고점 같은데",
  "코인 세금 신고 해보신 분?",
  "콜드월렛 추천 부탁드려요",
  "MEV 봇 때문에 매번 슬리피지 나는데",
  "스테이킹 수익률 어디가 좋나요",
  "차트 보는 법 배우려는데 책 추천?",
  "이번주 호재 일정 정리합니다",
  "[질문] 거래소 출금 막혔는데 해결법?",
  "[후기] 1년 차트 보고 매매한 결과",
  "오늘도 존버하시는 분들 화이팅",
  "고래 지갑 1만 BTC 옮겼대요",
  "에어드랍 받을 수 있는 프로젝트 모음",
  "비트코인 김치프리미엄 다시 +5% 떴네요",
  "내가 본 가장 큰 손절 후기 공유",
];

const DUMMY_TITLES_MARKET = [
  "BTC/USDT 13만 저항선 분석 — 4시간봉 다이버전스 발생",
  "[차트] 이더리움 일봉 200MA 돌파 시도 중",
  "솔라나 245달러 박스권, 돌파 시 270 가능성",
  "도지 단기 매도 신호, 거래량 급감 주의",
  "XRP 항소심 앞두고 변동성 확대 예상",
  "BTC 도미넌스 53% 돌파 — 알트시즌은 아직",
  "이더리움/비트코인 환율 차트 분석",
  "지금 매수해야 할 알트 5종 (개인 의견)",
  "선물 청산 맵 — 13.5만에 큰 롱 청산 라인",
  "[전략] 분할매수 vs 일괄매수 백테스트",
  "RSI 일봉 70 돌파, 단기 차익실현 고민",
  "월봉 차트 보면 아직 한참 남았는데...",
  "이더리움 가스비 또 폭등, 트랜잭션 비용 분석",
  "S&P 500 사상 최고, 코인과의 상관관계",
  "온체인 데이터 — 고래 매집 가속화",
];

const DUMMY_TITLES_INFO = [
  "[정리] 이번주 코인 주요 뉴스 TOP 10",
  "FOMC 5월 일정 — 시장 영향 분석",
  "비트코인 반감기 후 사이클 분석 (역사적 데이터)",
  "이더리움 펙트라 업그레이드 정리",
  "거래소별 수수료 비교 (2026년 5월)",
  "바이낸스 일부 토큰 상장폐지 — 영향 분석",
  "SEC vs 코인업체 소송 현황 정리",
  "[가이드] 콜드월렛 설정 A to Z",
  "스테이블코인 종류와 위험도 비교",
  "[자료] 연방준비제도 금리 결정 일정",
  "한국 코인 과세 가이드 2026",
  "디파이 프로토콜 TVL 순위",
  "비트코인 ETF 발행사별 자금 유입",
  "[분석글] 이번 사이클의 특징과 다음 사이클 예측",
  "주요 거래소 보안 사고 히스토리",
];

const COIN_SYMBOLS = ["BTC", "ETH", "XRP", "SOL", "DOGE", "ALT", undefined];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function relativeTime(hoursAgo: number): string {
  if (hoursAgo < 1) return `${Math.max(1, Math.round(hoursAgo * 60))}분전`;
  if (hoursAgo < 24) return `${Math.floor(hoursAgo)}시간전`;
  const days = Math.floor(hoursAgo / 24);
  if (days < 7) return `${days}일전`;
  return `${Math.floor(days / 7)}주전`;
}

function generatePosts(slug: BoardSlug, titles: string[], baseId: number): MockPost[] {
  const meta = BOARD_META[slug];
  const result: MockPost[] = [];

  // 공지 2개
  result.push({
    boardSlug: slug,
    id: 1,
    number: 1,
    title: "[공지] 사이트 이용 가이드 (필독)",
    author: "운영자",
    isAdmin: true,
    createdAt: "3일전",
    views: 8100,
    likes: 156,
    commentCount: 12,
    isNotice: true,
    category: "공지",
    contentHtml: "<p>ChartMaster Community 이용 가이드입니다.</p>",
  });
  result.push({
    boardSlug: slug,
    id: 2,
    number: 2,
    title: "[공지] 게시판 규칙 (반드시 읽어주세요)",
    author: "운영자",
    isAdmin: true,
    createdAt: "1주전",
    views: 2340,
    likes: 42,
    commentCount: 5,
    isNotice: true,
    category: "공지",
    contentHtml: "<p>게시판 규칙입니다.</p>",
  });

  // 일반 글 50개
  for (let i = 0; i < 50; i++) {
    const isAnonymous = i % 3 === 0;
    const isHot = i < 5;
    const isNew = i < 3;
    const hoursAgo = i * 0.7 + 0.5;
    result.push({
      boardSlug: slug,
      id: baseId + 50 - i,
      number: baseId + 50 - i,
      title: pick(titles, i),
      author: isAnonymous ? "익명" : pick(NICKNAMES, i),
      authorIp: isAnonymous ? pick(IPS, i) : undefined,
      createdAt: relativeTime(hoursAgo),
      views: 100 + Math.floor(Math.random() * 3000),
      likes: Math.floor(Math.random() * 80),
      commentCount: Math.floor(Math.random() * 50),
      hasImage: i % 5 === 0,
      isHot,
      isNew,
      category: meta.categories[1 + (i % (meta.categories.length - 1))],
      coinSymbol: pick(COIN_SYMBOLS, i),
      tags: ["#" + pick(["비트코인", "이더리움", "분석", "차트", "ETF", "FOMC", "단타"], i)],
      contentHtml: `<p>본문은 더미 데이터입니다. 실제 게시글에는 마크다운/HTML로 풍부한 콘텐츠가 들어갑니다.</p>
<p>이 글은 ${pick(titles, i)} 에 대한 토론 글입니다.</p>
<blockquote>다양한 의견을 자유롭게 나눠주세요.</blockquote>`,
    });
  }

  return result;
}

export const MOCK_POSTS: Record<BoardSlug, MockPost[]> = {
  free: generatePosts("free", DUMMY_TITLES_FREE, 8400),
  market: generatePosts("market", DUMMY_TITLES_MARKET, 5200),
  info: generatePosts("info", DUMMY_TITLES_INFO, 3100),
};

export function getPost(slug: BoardSlug, id: number): MockPost | null {
  return MOCK_POSTS[slug]?.find((p) => p.id === id) ?? null;
}

export function getPostsByBoard(slug: BoardSlug, page = 1, perPage = 30): MockPost[] {
  const posts = MOCK_POSTS[slug] ?? [];
  const notices = posts.filter((p) => p.isNotice);
  const regular = posts.filter((p) => !p.isNotice);
  const start = (page - 1) * perPage;
  return [...notices, ...regular.slice(start, start + perPage)];
}

export function getTotalPages(slug: BoardSlug, perPage = 30): number {
  const posts = MOCK_POSTS[slug] ?? [];
  const regular = posts.filter((p) => !p.isNotice);
  return Math.max(1, Math.ceil(regular.length / perPage));
}

export function getBestPosts(limit = 30): MockPost[] {
  // 모든 게시판에서 hot/likes 상위
  const all = (Object.keys(MOCK_POSTS) as BoardSlug[]).flatMap((s) => MOCK_POSTS[s]);
  return all
    .filter((p) => !p.isNotice)
    .sort((a, b) => b.likes + b.views * 0.01 - (a.likes + a.views * 0.01))
    .slice(0, limit);
}

export function getPostsForCoin(symbol: string, limit = 20): MockPost[] {
  const all = (Object.keys(MOCK_POSTS) as BoardSlug[]).flatMap((s) => MOCK_POSTS[s]);
  return all
    .filter((p) => !p.isNotice && p.coinSymbol === symbol)
    .slice(0, limit);
}

export interface MockComment {
  id: number;
  parentId?: number;
  author: string;
  authorIp?: string;
  isAdmin?: boolean;
  content: string;
  createdAt: string;
  likes: number;
}

export const MOCK_COMMENTS: MockComment[] = [
  {
    id: 1,
    author: "존버9년차",
    content: "진짜 어디까지 갈지 궁금하네요. 14만 가면 절반 청산할 듯",
    createdAt: "2시간전",
    likes: 12,
  },
  {
    id: 2,
    parentId: 1,
    author: "익명",
    authorIp: "211.34",
    content: "저도 그게 궁금... 14만 vs 15만",
    createdAt: "1시간전",
    likes: 3,
  },
  {
    id: 3,
    author: "김씨네아저씨",
    content: "이번엔 좀 다른 것 같아요. 기관 매수가 진짜네요",
    createdAt: "1시간전",
    likes: 8,
  },
  {
    id: 4,
    author: "익명",
    authorIp: "218.55",
    content: "나만 못탔네 ㅠㅠ 다음 사이클 기다려야 할 듯",
    createdAt: "1시간전",
    likes: 2,
  },
  {
    id: 5,
    author: "차트마스터",
    isAdmin: true,
    content: "차트 분석 글로 별도 정리해서 올리겠습니다.",
    createdAt: "30분전",
    likes: 15,
  },
];
