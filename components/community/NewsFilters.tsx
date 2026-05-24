"use client";

// /news 4차원 필터 바 (R3/T03, 2026-05-24)
//
// SSR 전환에 따라 필터 UI만 클라이언트 하위 컴포넌트로 분리한다.
// 현재 필터 값은 서버 페이지가 searchParams에서 파싱해 props로 내려주고,
// 본 컴포넌트는 클릭 시 searchParams를 갱신(router.push)하여 서버 재렌더를 유발한다.
// → 목록/헤드라인/사이드바는 모두 서버에서 렌더되어 SEO에 노출된다.
//
// NEWS_CATEGORIES/COIN_FILTERS는 메타 SSOT(@/lib/community/news-meta)에서 import한다.

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { NEWS_CATEGORIES, COIN_FILTERS } from "@/lib/community/news-meta";
import type { NewsSentiment } from "@/components/community/NewsHeadlineCard";
import type { NewsSort } from "@/lib/community/news-server";
import { cn } from "@/lib/utils";

// 감정 필터 — UI 전용(dotClass 포함)이라 메타 SSOT가 아닌 본 컴포넌트 로컬 상수
const SENTIMENT_FILTERS: { key: NewsSentiment | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "positive", label: "🔴 호재" },
  { key: "negative", label: "🔵 악재" },
  { key: "mixed", label: "🟣 혼조" },
  { key: "neutral", label: "⚪ 중립" },
];

const SORTS: { key: NewsSort; label: string }[] = [
  { key: "latest", label: "최신순" },
  { key: "importance", label: "중요도순" },
  { key: "popular", label: "토론많은순" },
];

export interface NewsFiltersProps {
  coin: string;
  category: string;
  sentiment: NewsSentiment | "all";
  sort: NewsSort;
}

export default function NewsFilters({ coin, category, sentiment, sort }: NewsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 필터 1개 갱신 → URL searchParams 변경(기본값이면 키 제거, page는 항상 리셋)
  function setParam(key: string, value: string, defaultValue: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === defaultValue) params.delete(key);
    else params.set(key, value);
    params.delete("page"); // 필터 변경 시 1페이지로 리셋
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-md p-3 mb-4 space-y-2">
      <FilterRow
        label="코인"
        items={COIN_FILTERS.map((c) => ({ key: c.key, label: c.label }))}
        value={coin}
        onChange={(k) => setParam("coin", k, "ALL")}
      />
      <FilterRow
        label="분류"
        items={NEWS_CATEGORIES.map((c) => ({ key: c.key, label: c.label }))}
        value={category}
        onChange={(k) => setParam("category", k, "all")}
      />
      <FilterRow
        label="감정"
        items={SENTIMENT_FILTERS.map((s) => ({ key: s.key, label: s.label }))}
        value={sentiment}
        onChange={(k) => setParam("sentiment", k, "all")}
      />
      <div className="flex items-center gap-3 pt-2 border-t border-outline-variant">
        <span className="text-meta font-bold text-on-surface-variant w-12 flex-shrink-0">정렬</span>
        <div className="flex gap-2">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setParam("sort", s.key, "latest")}
              className={cn(
                "text-meta px-2 py-1 rounded transition-colors",
                sort === s.key
                  ? "bg-primary text-on-primary font-bold"
                  : "text-on-surface-variant hover:bg-surface-container"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface FilterRowProps {
  label: string;
  items: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}

function FilterRow({ label, items, value, onChange }: FilterRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-meta font-bold text-on-surface-variant w-12 flex-shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={cn(
              "text-meta px-2 py-1 rounded border transition-colors",
              value === it.key
                ? "bg-primary text-on-primary border-primary font-bold"
                : "bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-primary"
            )}
          >
            {it.label}
          </button>
        ))}
      </div>
    </div>
  );
}
