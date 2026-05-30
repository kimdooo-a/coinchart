"use client";

// PriceTickerWidget — 사이드바 실시간 시세 스트립 (R13 / T-A1 서버→클라 전환)
// 가격(통화)·등락색을 useDisplaySettings() 구독으로 전역 전환.

import Link from "next/link";
import SidebarWidget from "../SidebarWidget";
import { cn } from "@/lib/utils";
import { useDisplaySettings } from "@/lib/config/display-settings";

export interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  href?: string; // 코인룸 또는 차트분석으로
}

interface PriceTickerWidgetProps {
  title?: string;
  items: TickerItem[];
}

export default function PriceTickerWidget({
  title = "실시간 시세",
  items,
}: PriceTickerWidgetProps) {
  // 표시 환경설정 구독 (R13 / T-A1) — 통화(USD↔KRW)·등락 색(한국식↔글로벌) 전역 전환.
  const { formatPrice, changeColorClass } = useDisplaySettings();
  return (
    <SidebarWidget title={title} noPadding>
      <ul className="divide-y divide-outline-variant">
        {items.map((it) => {
          const isUp = it.changePct >= 0;
          // 등락 색: KR=빨↑파↓ / GLOBAL=녹↑빨↓. flat(0)은 중립.
          const trendColor = changeColorClass(it.changePct);
          const Inner = (
            <li className="grid grid-cols-[1fr_auto_60px] gap-2 items-center px-3 py-2 hover:bg-surface-container-low transition-colors">
              <div className="min-w-0">
                <div className="text-body-sm font-bold truncate">{it.symbol}</div>
                <div className="text-meta text-on-surface-variant truncate">{it.name}</div>
              </div>
              <div className="text-body-sm tabular-nums text-right">
                {formatPrice(it.price)}
              </div>
              <div className={cn("text-meta font-bold tabular-nums text-right", trendColor)}>
                {isUp ? "▲" : "▼"} {Math.abs(it.changePct).toFixed(2)}%
              </div>
            </li>
          );

          return it.href ? (
            <Link key={it.symbol} href={it.href}>
              {Inner}
            </Link>
          ) : (
            <div key={it.symbol}>{Inner}</div>
          );
        })}
      </ul>
    </SidebarWidget>
  );
}
