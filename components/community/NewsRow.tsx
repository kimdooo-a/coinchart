import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NewsHeadlineItem, NewsSentiment } from "./NewsHeadlineCard";

interface NewsRowProps {
  item: NewsHeadlineItem & { coinTag?: string };
  className?: string;
}

const SENTIMENT_DOT: Record<NewsSentiment, string> = {
  positive: "bg-[var(--color-positive)]",
  negative: "bg-[var(--color-negative)]",
  mixed: "bg-[var(--color-mixed)]",
  neutral: "bg-outline-variant",
};

const COIN_COLOR: Record<string, string> = {
  BTC: "bg-[#F7931A] text-white",
  ETH: "bg-[#627EEA] text-white",
  XRP: "bg-[#23292F] text-white",
  SOL: "bg-[#9945FF] text-white",
  DOGE: "bg-[#C2A633] text-white",
  ALT: "bg-on-surface-variant text-on-primary",
  STOCK: "bg-[#1A6FCC] text-white",
};

export default function NewsRow({ item, className }: NewsRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[64px_auto_1fr_120px_50px_60px] gap-3 items-center px-3 py-2.5 hover:bg-surface-container transition-colors group",
        className
      )}
    >
      {/* 시간 */}
      <span className="text-meta text-outline">{item.timeLabel}</span>

      {/* 코인 / 카테고리 태그 */}
      <div className="flex items-center gap-1">
        {item.coinTag && (
          <span
            className={cn(
              "px-1.5 py-0.5 rounded-sm text-[10px] font-bold",
              COIN_COLOR[item.coinTag] ?? "bg-surface-container-high text-on-surface-variant"
            )}
          >
            {item.coinTag}
          </span>
        )}
        {item.category && (
          <span className="px-1.5 py-0.5 rounded-sm text-[10px] bg-surface-container text-on-surface-variant">
            {item.category}
          </span>
        )}
      </div>

      {/* 제목 + 감정 점 */}
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 min-w-0"
      >
        <span
          className={cn(
            "w-2 h-2 rounded-full flex-shrink-0",
            SENTIMENT_DOT[item.sentiment]
          )}
          aria-label={item.sentiment}
        />
        <span className="text-body-base text-on-surface group-hover:text-primary truncate">
          {item.title}
        </span>
      </a>

      {/* 매체 */}
      <span className="text-meta text-on-surface-variant truncate">{item.source}</span>

      {/* 중요도 */}
      <span className="text-meta text-on-surface-variant text-right tabular-nums">
        {item.importance !== undefined ? `★${item.importance}` : "—"}
      </span>

      {/* 토론 */}
      {item.discussionHref ? (
        <Link
          href={item.discussionHref}
          className="text-meta text-primary hover:underline text-right inline-flex items-center justify-end gap-0.5"
        >
          <MessageSquare className="w-3 h-3" />
          {item.commentCount ?? 0}
        </Link>
      ) : (
        <span className="text-meta text-outline text-right">—</span>
      )}
    </div>
  );
}
