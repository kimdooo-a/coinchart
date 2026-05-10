import Link from "next/link";
import { cn } from "@/lib/utils";

export type NewsSentiment = "positive" | "negative" | "neutral" | "mixed";

export interface NewsHeadlineItem {
  id: string;
  title: string;
  summary: string;
  sentiment: NewsSentiment;
  category?: string;
  source: string;
  timeLabel: string; // "10분 전"
  importance?: number; // 1~10
  link: string; // 외부 원문
  discussionHref?: string; // 사이트 내 토론
  commentCount?: number;
}

const SENTIMENT_STYLE: Record<
  NewsSentiment,
  { badgeClass: string; borderHover: string; label: string; subLabel: string }
> = {
  // 한국식: 호재=빨강
  positive: {
    badgeClass: "bg-[var(--color-positive)] text-white",
    borderHover: "hover:border-[var(--color-positive)]",
    label: "호재",
    subLabel: "Bullish",
  },
  // 한국식: 악재=파랑
  negative: {
    badgeClass: "bg-[var(--color-negative)] text-white",
    borderHover: "hover:border-[var(--color-negative)]",
    label: "악재",
    subLabel: "Bearish",
  },
  mixed: {
    badgeClass: "bg-[var(--color-mixed)] text-white",
    borderHover: "hover:border-[var(--color-mixed)]",
    label: "혼조",
    subLabel: "Mixed",
  },
  neutral: {
    badgeClass: "bg-surface-container-high text-on-surface-variant",
    borderHover: "hover:border-outline",
    label: "중립",
    subLabel: "Neutral",
  },
};

export default function NewsHeadlineCard({ item }: { item: NewsHeadlineItem }) {
  const style = SENTIMENT_STYLE[item.sentiment];

  return (
    <article
      className={cn(
        "bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden transition-all flex flex-col",
        style.borderHover
      )}
    >
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-sm uppercase font-bold tracking-wider",
              style.badgeClass
            )}
          >
            {style.label} · {style.subLabel}
          </span>
          {item.importance !== undefined && (
            <span className="text-meta text-outline-variant">
              ★ {item.importance}/10
            </span>
          )}
        </div>

        {item.category && (
          <span className="text-meta text-on-surface-variant">{item.category}</span>
        )}

        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-h2 leading-tight text-on-surface hover:text-primary transition-colors line-clamp-2"
        >
          {item.title}
        </a>

        <p className="text-body-sm text-on-surface-variant line-clamp-2">
          {item.summary}
        </p>
      </div>

      <footer className="border-t border-outline-variant px-4 py-2.5 flex items-center justify-between text-meta text-on-surface-variant">
        <span>
          {item.source} · {item.timeLabel}
        </span>
        {item.discussionHref && (
          <Link
            href={item.discussionHref}
            className="text-primary hover:underline font-bold"
          >
            💬 토론 {item.commentCount ?? 0}
          </Link>
        )}
      </footer>
    </article>
  );
}
