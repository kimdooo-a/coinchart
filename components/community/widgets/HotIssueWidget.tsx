import Link from "next/link";
import SidebarWidget from "../SidebarWidget";
import { cn } from "@/lib/utils";

export type HotIssueTrend = "up" | "down" | "new" | "same";

export interface HotIssue {
  rank: number;
  keyword: string;
  trend: HotIssueTrend;
  delta?: number; // up/down일 때 변동치
  href?: string;
}

const TREND_LABEL: Record<HotIssueTrend, { text: string; className: string }> = {
  up: { text: "↑", className: "text-[var(--color-kr-up)]" },
  down: { text: "↓", className: "text-[var(--color-kr-down)]" },
  new: { text: "NEW", className: "text-secondary" },
  same: { text: "−", className: "text-on-surface-variant" },
};

export default function HotIssueWidget({
  title = "🔍 핫이슈",
  items,
}: {
  title?: string;
  items: HotIssue[];
}) {
  return (
    <SidebarWidget title={title} noPadding>
      <ol className="divide-y divide-outline-variant">
        {items.map((it) => {
          const trend = TREND_LABEL[it.trend];
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
              <span className={cn("text-meta text-right", trend.className)}>
                {trend.text}
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
