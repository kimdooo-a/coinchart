/**
 * Classic Masters Design System Tokens
 * 
 * 3대 거장 × 3대 페이지 매핑:
 * - 🎨 MONET    → 홈 (Landing)     → 인상주의적 유동성
 * - 🌻 VAN GOGH → 코인 분석        → 표현주의적 역동성
 * - 📐 DA VINCI → 주식 분석        → 르네상스적 정밀함
 */

export const DESIGN_TOKENS = {
  monet: {
    // 색상 팔레트 - 수련, 빛의 반사
    colors: {
      primary: '#6B8E9F',      // 연못 블루
      secondary: '#A7C4BC',    // 수련 잎
      accent: '#E8B4BC',       // 새벽 핑크
      light: '#F5EDE0',        // 부드러운 크림
      dark: '#3A4A5C',         // 깊은 물
      background: '#0A0A0A',   // 다크 배경
      text: '#E4E4E4',         // 텍스트
      textSecondary: '#9CA3AF', // 보조 텍스트
    },
    // 형태 - 부드러운 경계
    shape: {
      radius: '24px',          // 둥근 모서리
      blur: '20px',            // 글래스모피즘
      border: '1px solid rgba(255,255,255,0.1)',
    },
    // 레이아웃 - 흐르는 구성
    layout: {
      gap: '2rem',
      padding: '3rem',
    },
    // 모션 - 물결치는 움직임
    motion: {
      duration: 0.8,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      type: 'spring' as const,
      stiffness: 100,
      damping: 20,
    },
    // 타이포그래피
    typography: {
      font: "'Inter', sans-serif",
      weight: 300,
    },
  },
  vangogh: {
    // 색상 팔레트 - 별이 빛나는 밤, 해바라기
    colors: {
      primary: '#1A3A5C',      // 깊은 밤하늘
      secondary: '#F4C430',    // 해바라기 노랑
      accent: '#E55B3C',       // 열정의 주황
      light: '#A8D5E2',       // 소용돌이 하늘
      dark: '#0D1B2A',        // 칠흑의 밤
      background: '#0D1B2A',  // 다크 배경
      text: '#E4E4E4',        // 텍스트
      textSecondary: '#9CA3AF', // 보조 텍스트
    },
    // 형태 - 역동적 곡선
    shape: {
      radius: '16px',
      border: '2px solid',
      shadow: '0 4px 30px rgba(244, 196, 48, 0.3)',
    },
    // 레이아웃 - 긴장감 있는 배치
    layout: {
      gap: '1.5rem',
      padding: '2rem',
    },
    // 모션 - 소용돌이
    motion: {
      duration: 0.5,
      easing: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
      type: 'spring' as const,
      stiffness: 300,
      damping: 15,
    },
    // 타이포그래피
    typography: {
      font: "'Space Grotesk', sans-serif",
      weight: 700,
    },
  },
  davinci: {
    // 색상 팔레트 - 해부도, 황금비
    colors: {
      primary: '#2C2C2C',      // 세피아 잉크
      secondary: '#C9A959',    // 금박
      accent: '#8B4513',      // 따뜻한 갈색
      light: '#F5F1E6',       // 양피지
      dark: '#1A1A1A',        // 깊은 그림자
      background: '#F5F1E6',   // 라이트 배경
      text: '#1A1A1A',        // 텍스트
      textSecondary: '#6B7280', // 보조 텍스트
    },
    // 형태 - 기하학적 정밀함
    shape: {
      radius: '4px',          // 각진 모서리
      border: '1px solid #C9A959',
      grid: 1.618,             // 황금비
    },
    // 레이아웃 - 황금 분할
    layout: {
      gap: '1rem',
      padding: '1.5rem',
    },
    // 모션 - 절제된 움직임
    motion: {
      duration: 0.3,
      easing: 'ease-out',
      type: 'tween' as const,
    },
    // 타이포그래피
    typography: {
      font: "'Cormorant Garamond', serif",
      weight: 400,
    },
  },
} as const;

// 공통 상태 색상 (세 거장 모두 공통)
export const STATE_COLORS = {
  positive: '#22C55E',  // 상승/성공
  negative: '#EF4444',  // 하락/실패
  neutral: '#6B7280',   // 중립/관망
  warning: '#F59E0B',  // 주의
} as const;

// 페이지별 토큰 매핑
export const PAGE_TOKENS = {
  '/': 'monet',
  '/analysis': 'vangogh',
  '/analysis/[symbol]': 'vangogh',
  '/stock': 'davinci',
  '/stock-market': 'davinci',
} as const;

export type DesignTokenKey = keyof typeof DESIGN_TOKENS;
export type PagePath = keyof typeof PAGE_TOKENS;








