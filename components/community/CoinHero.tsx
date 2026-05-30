"use client";

// CoinHero — 코인룸 상단 히어로 (R13 / T-A1 서버→클라 전환)
// 시세(가격)·등락색·sparkline을 useDisplaySettings() 구독으로 전역 전환.
// props는 전부 직렬화 가능 — 부모(코인룸 서버 페이지)가 데이터 fetch 후 전달.

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDisplaySettings } from "@/lib/config/display-settings";

export interface CoinHeroData {
  symbol: string; // BTC
  name: string; // Bitcoin
  nameKo?: string; // 비트코인
  logoEmoji?: string; // ₿
  logoColor: string; // hex
  price: number;
  changePct: number; // -1.58 or 1.58
  volume24hUsd: number;
  marketCapUsd: number;
  marketCapRank: number;
  tags?: string[]; // ["POW", "Layer1"]
  /** mini sparkline values (SVG path 데이터로 자동 변환) */
  sparkline?: number[];
}

interface CoinHeroProps {
  data: CoinHeroData;
  /** 차트분석 페이지 URL (예: /analysis/btc) */
  analysisHref: string;
  /** 글쓰기 URL */
  writeHref: string;
  className?: string;
}

export default function CoinHero({
  data,
  analysisHref,
  writeHref,
  className,
}: CoinHeroProps) {
  // 표시 환경설정 구독 (R13 / T-A1) — 통화(USD↔KRW)·등락 색(한국식↔글로벌) 전역 전환.
  const { formatPrice, changeColorClass, changeColor } = useDisplaySettings();
  const isUp = data.changePct >= 0;
  // 등락 색: KR=빨↑파↓ / GLOBAL=녹↑빨↓. flat(0)은 changeColorClass가 중립 처리.
  const trendColor = changeColorClass(data.changePct);
  // badge 배경 틴트 — trendColor와 정합. Tailwind JIT가 스캔하도록 리터럴 클래스로 분기.
  const trendBg = isUp
    ? changeColor === "GLOBAL"
      ? "bg-[var(--color-new)]/10"
      : "bg-[var(--color-kr-up)]/10"
    : changeColor === "GLOBAL"
      ? "bg-[var(--color-positive)]/10"
      : "bg-[var(--color-kr-down)]/10";
  const sparkPath = data.sparkline ? buildSparklinePath(data.sparkline) : null;
  // sparkline stroke — SVG 속성값이라 CSS 변수 직접 참조(런타임 해석). 등락 색과 정합.
  const sparkColor = isUp
    ? changeColor === "GLOBAL"
      ? "var(--color-new)"
      : "var(--color-kr-up)"
    : changeColor === "GLOBAL"
      ? "var(--color-positive)"
      : "var(--color-kr-down)";

  return (
    <section
      className={cn(
        "bg-surface-container-lowest border border-outline-variant rounded p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6",
        className
      )}
    >
      {/* 좌측: 로고 + 이름 */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
          style={{ backgroundColor: data.logoColor }}
        >
          {data.logoEmoji ?? data.symbol.charAt(0)}
        </div>
        <div className="min-w-0">
          <h1 className="text-h1">
            {data.nameKo ?? data.name}{" "}
            <span className="text-on-surface-variant">/ {data.symbol}</span>
          </h1>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <span className={cn("text-meta font-bold px-2 py-0.5 rounded", trendBg, trendColor)}>
              시총 #{data.marketCapRank}
            </span>
            {data.tags?.map((t) => (
              <span
                key={t}
                className="bg-surface-container-high text-on-surface-variant text-meta font-bold px-2 py-0.5 rounded"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 가운데: 미니 차트 */}
      {sparkPath && (
        <div className="hidden lg:block w-48 h-12 flex-shrink-0">
          <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path d={sparkPath} fill="none" stroke={sparkColor} strokeWidth="2" />
          </svg>
        </div>
      )}

      {/* 우측: 가격 정보 */}
      <div className="flex flex-col items-start md:items-end flex-1 md:flex-none">
        <div className="flex items-baseline gap-2">
          <span className={cn("text-h1", trendColor)}>{formatPrice(data.price)}</span>
          <span className={cn("text-body-base font-bold", trendColor)}>
            {isUp ? "▲" : "▼"} {data.changePct >= 0 ? "+" : ""}
            {data.changePct.toFixed(2)}%
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-meta text-on-surface-variant mt-1">
          <span>
            거래량(24h):{" "}
            <span className="text-on-surface font-bold">{formatUsd(data.volume24hUsd)}</span>
          </span>
          <span>
            시총:{" "}
            <span className="text-on-surface font-bold">
              {formatUsd(data.marketCapUsd)} ({data.marketCapRank}위)
            </span>
          </span>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
        <Link
          href={analysisHref}
          className="bg-primary text-on-primary text-label-bold py-2 px-6 rounded-md hover:bg-primary-container transition-colors text-center whitespace-nowrap"
        >
          📊 차트분석
        </Link>
        <Link
          href={writeHref}
          className="bg-surface-container-lowest border border-outline text-on-surface text-label-bold py-2 px-6 rounded-md hover:bg-surface-container-low transition-colors text-center whitespace-nowrap"
        >
          ✏ 글쓰기
        </Link>
      </div>
    </section>
  );
}

/** 시세 배열을 0~100 viewBox SVG path로 변환 */
function buildSparklinePath(values: number[]): string {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = 100 / (values.length - 1);
  return values
    .map((v, i) => {
      const x = i * stepX;
      const y = 30 - ((v - min) / range) * 30;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function formatUsd(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}
