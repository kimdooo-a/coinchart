"use client";

// 게시글 추천·공유 바 (추천/비추/스크랩/신고) — R3/T02 상세 SSR 전환 시 인터랙션부 분리
// 추천/비추는 board-queries의 togglePostLike(클라 fetch) 사용. 스크랩: Task 9 결선.

import { useState } from "react";
import { ThumbsUp, ThumbsDown, Bookmark, Flag } from "lucide-react";
import { togglePostLike } from "@/lib/community/board-queries";
import { toggleScrap } from "@/lib/community/scrap-queries";
import ReportModal from "@/components/community/ReportModal";

interface PostVoteButtonsProps {
  postId: string;
  initialLikes: number;
  /** 초기 비추 수(분리 집계). 상세 페이지가 community_post_like_counts 실값을 전달(R5/#2). 미전달 시 0. */
  initialDislikes?: number;
  /** 초기 스크랩 여부(SSR에서 로그인 사용자 기준으로 계산). 비회원/미전달 시 false. */
  initialScrapped?: boolean;
}

export default function PostVoteButtons({
  postId,
  initialLikes,
  initialDislikes = 0,
  initialScrapped = false,
}: PostVoteButtonsProps) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [likeBusy, setLikeBusy] = useState(false);
  const [scrapped, setScrapped] = useState(initialScrapped);
  const [scrapBusy, setScrapBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const handleLike = async () => {
    if (likeBusy) return;
    setLikeBusy(true);
    try {
      const { liked: nowLiked, likeCount, dislikeCount } = await togglePostLike(postId, 1);
      setLiked(nowLiked);
      setLikes(likeCount);
      setDislikes(dislikeCount); // 응답의 분리 집계 비추 수 반영
      if (nowLiked) setDisliked(false);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "추천 처리에 실패했습니다.");
    } finally {
      setLikeBusy(false);
    }
  };

  const handleDislike = async () => {
    if (likeBusy) return;
    setLikeBusy(true);
    const wasDisliked = disliked;
    try {
      const { likeCount, dislikeCount } = await togglePostLike(postId, -1);
      setLikes(likeCount);
      setDislikes(dislikeCount); // 응답의 분리 집계 비추 수 반영
      setDisliked(!wasDisliked);
      if (!wasDisliked) setLiked(false);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "비추 처리에 실패했습니다.");
    } finally {
      setLikeBusy(false);
    }
  };

  const handleScrap = async () => {
    if (scrapBusy) return;
    setScrapBusy(true);
    try {
      const result = await toggleScrap(postId);
      if ("status" in result) {
        // 에러 응답
        if (result.status === 401) {
          if (confirm("스크랩하려면 로그인이 필요합니다. 로그인 페이지로 이동할까요?")) {
            window.location.href = "/auth/login";
          }
        } else {
          alert(result.error || "스크랩 처리에 실패했습니다.");
        }
      } else {
        setScrapped(result.scrapped);
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "스크랩 처리에 실패했습니다.");
    } finally {
      setScrapBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 py-6 mb-4">
      <button
        type="button"
        onClick={handleLike}
        disabled={likeBusy}
        className={`inline-flex items-center gap-2 px-5 py-2 rounded-md border transition-colors disabled:opacity-60 ${
          liked
            ? "border-[var(--color-positive)] bg-[var(--color-positive)]/10 text-[var(--color-positive)]"
            : "border-outline-variant hover:border-[var(--color-positive)] text-on-surface"
        }`}
      >
        <ThumbsUp className="w-4 h-4" />
        <span className="font-bold">추천 {likes}</span>
      </button>
      <button
        type="button"
        onClick={handleDislike}
        disabled={likeBusy}
        className={`inline-flex items-center gap-2 px-5 py-2 rounded-md border transition-colors disabled:opacity-60 ${
          disliked
            ? "border-[var(--color-negative)] bg-[var(--color-negative)]/10 text-[var(--color-negative)]"
            : "border-outline-variant hover:border-[var(--color-negative)] text-on-surface"
        }`}
      >
        <ThumbsDown className="w-4 h-4" />
        <span className="font-bold">비추 {dislikes}</span>
      </button>
      <button
        type="button"
        onClick={handleScrap}
        disabled={scrapBusy}
        className={`inline-flex items-center gap-1 px-3 py-2 rounded-md text-body-sm transition-colors disabled:opacity-60 ${
          scrapped
            ? "text-primary bg-primary/10 hover:bg-primary/20"
            : "text-on-surface-variant hover:bg-surface-container"
        }`}
      >
        <Bookmark className={`w-4 h-4 ${scrapped ? "fill-current" : ""}`} />스크랩
      </button>
      <button
        type="button"
        onClick={() => setReportOpen(true)}
        className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-body-sm text-on-surface-variant hover:bg-surface-container"
      >
        <Flag className="w-4 h-4" />신고
      </button>
      <ReportModal
        open={reportOpen}
        targetType="post"
        targetId={postId}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
}
