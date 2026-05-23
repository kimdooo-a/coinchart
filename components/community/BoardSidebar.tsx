"use client";

// 게시판 목록/상세 공용 사이드바 (R2/T01, 2026-05-23)
// 시세·핫이슈·FNG·공식글을 클라이언트 fetch로 실데이터화 (기존 mock-coins 의존 제거).
// 각 위젯은 데이터가 없거나 fetch 실패 시 조용히 숨김 → 전체 페이지 깨짐 방지.

import { useEffect, useState } from "react";
import PriceTickerWidget, { type TickerItem } from "./widgets/PriceTickerWidget";
import HotIssueWidget, { type HotIssue } from "./widgets/HotIssueWidget";
import FngGaugeWidget from "./widgets/FngGaugeWidget";
import OfficialPostsWidget, { type OfficialPost } from "./widgets/OfficialPostsWidget";
import ToolsShortcutWidget from "./widgets/ToolsShortcutWidget";
import {
  fetchSidebarTickers,
  fetchSidebarHotIssues,
  fetchSidebarFng,
  fetchSidebarOfficialPosts,
  type SidebarFng,
} from "@/lib/community/board-queries";

export default function BoardSidebar({ showTools = true }: { showTools?: boolean }) {
  const [tickers, setTickers] = useState<TickerItem[]>([]);
  const [hotIssues, setHotIssues] = useState<HotIssue[]>([]);
  const [fng, setFng] = useState<SidebarFng | null>(null);
  const [official, setOfficial] = useState<OfficialPost[]>([]);

  useEffect(() => {
    let alive = true;
    // 각 위젯은 독립 fetch — 하나가 실패해도 나머지는 표시
    fetchSidebarTickers()
      .then((d) => alive && setTickers(d))
      .catch(() => undefined);
    fetchSidebarHotIssues()
      .then((d) => alive && setHotIssues(d))
      .catch(() => undefined);
    fetchSidebarFng()
      .then((d) => alive && setFng(d))
      .catch(() => undefined);
    fetchSidebarOfficialPosts()
      .then((d) => alive && setOfficial(d))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  return (
    <aside className="w-full lg:w-[300px] flex-shrink-0 space-y-4">
      {tickers.length > 0 && <PriceTickerWidget items={tickers.slice(0, 6)} />}
      {hotIssues.length > 0 && <HotIssueWidget items={hotIssues} />}
      {fng && <FngGaugeWidget value={fng.value} prevValue={fng.prevValue} />}
      {official.length > 0 && <OfficialPostsWidget posts={official} />}
      {showTools && <ToolsShortcutWidget />}
    </aside>
  );
}
