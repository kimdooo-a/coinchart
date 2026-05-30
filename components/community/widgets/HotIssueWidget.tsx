'use client';

import Link from "next/link";
import SidebarWidget from "../SidebarWidget";
import { cn } from "@/lib/utils";
import { useDisplaySettings } from "@/lib/config/display-settings";

export type HotIssueTrend = "up" | "down" | "new" | "same";

export interface HotIssue {
  rank: number;
  keyword: string;
  trend: HotIssueTrend;
  delta?: number; // up/down일 때 변동치
  href?: string;
}

// 기호(텍스트)는 모듈 상수로 고정. 색(className)은 컴포넌트 내부에서 동적 계산.
const TREND_TEXT: Record<HotIssueTrend, string> = {
  up: "↑",
  down: "↓",
  new: "NEW",
  same: "−",
};

export default function HotIssueWidget({
  title = "🔍 핫이슈",
  items,
}: {
  title?: string;
  items: HotIssue[];
}) {
  // 표시 환경설정 구독 (R14 / T01) — up/down만 등락색 체계(KR↔GLOBAL) 전환.
  // ⚠️ new=상태(text-secondary)·same=중립(text-on-surface-variant)은 등락이 아니므로 보존.
  const { changeColorClass } = useDisplaySettings();
  const trendClassName = (trend: HotIssueTrend): string => {
    if (trend === "up") return changeColorClass(1);
    if (trend === "down") return changeColorClass(-1);
    if (trend === "new") return "text-secondary";
    return "text-on-surface-variant"; // same
  };

  return (
    <SidebarWidget title={title} noPadding>
      <ol className="divide-y divide-outline-variant">
        {items.map((it) => {
          const content = (
            <li className="grid grid-cols-[24px_1fr_50px] gap-2 items-center px-3 py-1.5 hover:bg-surface-container-low transition-colors">
              <span
                className={cn(
                  "text-body-sm tabular-nums font-bold",
                  it.rank <= 3 ? "text-primary" : "text-on-surface-variant"
                )}
              >
                {it.rank}
              </span>
              <span className="text-body-sm truncate">{it.keyword}</span>
              <span className={cn("text-meta text-right", trendClassName(it.trend))}>
                {TREND_TEXT[it.trend]}
                {it.delta !== undefined && it.trend !== "new" && it.trend !== "same"
                  ? it.delta
                  : ""}
              </span>
            </li>
          );
          return it.href ? (
            <Link key={it.rank} href={it.href}>
              {content}
            </Link>
          ) : (
            <div key={it.rank}>{content}</div>
          );
        })}
      </ol>
    </SidebarWidget>
  );
}
