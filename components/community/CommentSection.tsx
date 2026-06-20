"use client";

// 게시글 댓글 영역 (입력/정렬/목록/대댓글) — R3/T02 상세 SSR 전환 시 인터랙션부 분리
//
// 서버가 첫 페이지 댓글(initialComments)을 SSR로 넘긴다 → 클라 컴포넌트지만 초기 댓글은
// 서버 렌더된 HTML에 포함되어 SEO를 유지한다. 등록은 board-queries의 createComment(클라 fetch).

import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import {
  createComment,
  toggleCommentLike,
  type BoardCommentItem,
} from "@/lib/community/board-queries";
import ReportModal from "@/components/community/ReportModal";

interface CommentSectionProps {
  postId: string;
  initialComments: BoardCommentItem[];
}

export default function CommentSection({ postId, initialComments }: CommentSectionProps) {
  const [comments, setComments] = useState<BoardCommentItem[]>(initialComments);
  const [commentInput, setCommentInput] = useState("");
  const [guestNick, setGuestNick] = useState("");
  const [guestPwd, setGuestPwd] = useState("");
  const [commentSort, setCommentSort] = useState<"latest" | "popular">("latest");
  const [commentBusy, setCommentBusy] = useState(false);
  // 추천 처리 중인 댓글 id 집합 — 진행 중 중복 클릭 가드 (PostVoteButtons의 likeBusy 패턴)
  const [likeBusyIds, setLikeBusyIds] = useState<Set<string>>(new Set());

  // 신고 모달 상태 — 신고 대상 댓글 id (null이면 닫힘)
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);

  // 답글 상태 — 최상위 폼과 분리하여 입력 충돌 방지
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [replyNick, setReplyNick] = useState("");
  const [replyPwd, setReplyPwd] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);

  // 답글 폼 토글 — 다른 댓글로 전환 시 입력값을 초기화해 이월 제출 버그 방지
  const toggleReply = (commentId: string) => {
    if (replyingTo !== commentId) {
      setReplyInput("");
      setReplyNick("");
      setReplyPwd("");
    }
    setReplyingTo(replyingTo === commentId ? null : commentId);
  };

  const handleCommentSubmit = async () => {
    if (!commentInput.trim() || commentBusy) return;
    setCommentBusy(true);
    try {
      const created = await createComment({
        postId,
        content: commentInput.trim(),
        // 닉네임을 입력하면 익명 댓글, 아니면 회원 댓글(세션) 시도
        postAsAnonymous: guestNick.trim().length > 0,
        guestNickname: guestNick.trim() || undefined,
        guestPassword: guestPwd || undefined,
      });
      setComments((prev) => [...prev, created]);
      setCommentInput("");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "댓글 등록에 실패했습니다.");
    } finally {
      setCommentBusy(false);
    }
  };

  // 답글 제출 — parentId는 항상 최상위 댓글(c.id)로 고정하여 1depth 평면화
  const handleReplySubmit = async (parentId: string) => {
    if (!replyInput.trim() || replyBusy) return;
    setReplyBusy(true);
    try {
      const created = await createComment({
        postId,
        content: replyInput.trim(),
        parentId,
        postAsAnonymous: replyNick.trim().length > 0,
        guestNickname: replyNick.trim() || undefined,
        guestPassword: replyPwd || undefined,
      });
      setComments((prev) => [...prev, created]);
      setReplyInput("");
      setReplyNick("");
      setReplyPwd("");
      setReplyingTo(null);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "답글 등록에 실패했습니다.");
    } finally {
      setReplyBusy(false);
    }
  };

  // 댓글 추천 토글 — PATCH /api/community/comment 응답 likeCount로 해당 댓글 likes 확정 갱신
  const handleCommentLike = async (commentId: string) => {
    if (likeBusyIds.has(commentId)) return; // 진행 중 중복 클릭 차단
    setLikeBusyIds((prev) => new Set(prev).add(commentId));
    try {
      const { likeCount } = await toggleCommentLike(commentId, 1);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, likes: likeCount } : c))
      );
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "댓글 추천에 실패했습니다.");
    } finally {
      setLikeBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  const topComments = comments.filter((c) => !c.parentId);
  const sortedTopComments =
    commentSort === "popular"
      ? [...topComments].sort((a, b) => b.likes - a.likes)
      : [...topComments].reverse(); // 최신순 (API는 created_at 오름차순 반환)

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-md p-5 mb-4">
      <h2 className="text-body-base font-bold mb-3">
        댓글 <span className="text-primary">{comments.length}</span>개
      </h2>

      {/* 댓글 입력 */}
      <div className="border border-outline-variant rounded-md p-3 mb-4">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input
            type="text"
            placeholder="닉네임 (비회원)"
            value={guestNick}
            onChange={(e) => setGuestNick(e.target.value)}
            className="border border-outline-variant rounded text-body-sm px-2 py-1.5 focus:outline-none focus:border-primary"
          />
          <input
            type="password"
            placeholder="비밀번호 (수정/삭제 시)"
            value={guestPwd}
            onChange={(e) => setGuestPwd(e.target.value)}
            className="border border-outline-variant rounded text-body-sm px-2 py-1.5 focus:outline-none focus:border-primary"
          />
        </div>
        <textarea
          placeholder="댓글을 입력하세요..."
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          rows={3}
          maxLength={2000}
          className="w-full text-body-sm bg-transparent focus:outline-none resize-none"
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-meta text-on-surface-variant">{commentInput.length}/2000</span>
          <button
            type="button"
            onClick={handleCommentSubmit}
            className="bg-primary text-on-primary text-label-bold px-4 py-1.5 rounded-md hover:bg-primary-container disabled:opacity-50"
            disabled={!commentInput.trim() || commentBusy}
          >
            {commentBusy ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>

      {/* 정렬 */}
      <div className="flex gap-3 text-meta text-on-surface-variant border-b border-outline-variant pb-2 mb-3">
        <button
          onClick={() => setCommentSort("latest")}
          className={commentSort === "latest" ? "text-primary font-bold" : "hover:text-primary"}
        >
          최신순
        </button>
        <button
          onClick={() => setCommentSort("popular")}
          className={commentSort === "popular" ? "text-primary font-bold" : "hover:text-primary"}
        >
          추천순
        </button>
      </div>

      {/* 댓글 리스트 */}
      {comments.length === 0 ? (
        <div className="py-8 text-center text-on-surface-variant text-body-sm">
          첫 댓글을 남겨보세요.
        </div>
      ) : (
        <ul className="space-y-3">
          {sortedTopComments.map((c) => (
            <li key={c.id} className="border-b border-outline-variant pb-3 last:border-b-0">
              <div className="flex items-center gap-2 text-meta mb-1">
                {c.isAdmin ? (
                  <span className="text-primary font-bold">{c.author} 🛡</span>
                ) : (
                  <>
                    <strong className="text-on-surface">{c.author}</strong>
                    {c.authorIp && <span className="text-outline">({c.authorIp}.*.*)</span>}
                  </>
                )}
                <span className="text-on-surface-variant">{c.createdAt}</span>
              </div>
              <p className="text-body-sm text-on-surface mb-2">{c.content}</p>
              <div className="flex items-center gap-3 text-meta text-on-surface-variant">
                <button
                  type="button"
                  onClick={() => handleCommentLike(c.id)}
                  disabled={likeBusyIds.has(c.id)}
                  className="hover:text-[var(--color-positive)] inline-flex items-center gap-0.5 disabled:opacity-60"
                >
                  <ThumbsUp className="w-3 h-3" />
                  {c.likes}
                </button>
                <button
                  type="button"
                  onClick={() => toggleReply(c.id)}
                  className="hover:text-primary"
                >
                  답글
                </button>
                <button
                  type="button"
                  onClick={() => setReportingCommentId(c.id)}
                  className="hover:text-error"
                >
                  신고
                </button>
              </div>

              {/* 대댓글 */}
              {comments.filter((cc) => cc.parentId === c.id).map((cc) => (
                <div key={cc.id} className="ml-6 mt-3 border-l-2 border-outline-variant pl-3">
                  <div className="flex items-center gap-2 text-meta mb-1">
                    <strong className="text-on-surface">{cc.author}</strong>
                    {cc.authorIp && <span className="text-outline">({cc.authorIp}.*.*)</span>}
                    <span className="text-on-surface-variant">{cc.createdAt}</span>
                  </div>
                  <p className="text-body-sm text-on-surface mb-1">{cc.content}</p>
                  <div className="flex gap-3 text-meta text-on-surface-variant">
                    <button
                      type="button"
                      onClick={() => handleCommentLike(cc.id)}
                      disabled={likeBusyIds.has(cc.id)}
                      className="hover:text-[var(--color-positive)] inline-flex items-center gap-0.5 disabled:opacity-60"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      {cc.likes}
                    </button>
                    {/* 대댓글의 답글도 parentId는 최상위 c.id로 고정(1depth 평면화) */}
                    <button
                      type="button"
                      onClick={() => toggleReply(c.id)}
                      className="hover:text-primary"
                    >
                      답글
                    </button>
                  </div>
                </div>
              ))}

              {/* 인라인 답글 폼 — replyingTo가 이 댓글일 때만 렌더 */}
              {replyingTo === c.id && (
                <div className="ml-6 mt-3 border-l-2 border-primary pl-3">
                  <div className="border border-outline-variant rounded-md p-3">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="닉네임 (비회원)"
                        value={replyNick}
                        onChange={(e) => setReplyNick(e.target.value)}
                        className="border border-outline-variant rounded text-body-sm px-2 py-1.5 focus:outline-none focus:border-primary"
                      />
                      <input
                        type="password"
                        placeholder="비밀번호 (수정/삭제 시)"
                        value={replyPwd}
                        onChange={(e) => setReplyPwd(e.target.value)}
                        className="border border-outline-variant rounded text-body-sm px-2 py-1.5 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <textarea
                      placeholder="답글을 입력하세요..."
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                      rows={2}
                      maxLength={2000}
                      className="w-full text-body-sm bg-transparent focus:outline-none resize-none"
                    />
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-meta text-on-surface-variant">{replyInput.length}/2000</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyInput("");
                            setReplyNick("");
                            setReplyPwd("");
                          }}
                          className="text-label-bold px-3 py-1.5 rounded-md border border-outline-variant hover:bg-surface-container text-on-surface-variant"
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReplySubmit(c.id)}
                          className="bg-primary text-on-primary text-label-bold px-4 py-1.5 rounded-md hover:bg-primary-container disabled:opacity-50"
                          disabled={!replyInput.trim() || replyBusy}
                        >
                          {replyBusy ? "등록 중..." : "등록"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* 신고 모달 — 최상위 댓글 신고 버튼과 연결 */}
      {reportingCommentId !== null && (
        <ReportModal
          open={true}
          targetType="comment"
          targetId={reportingCommentId}
          onClose={() => setReportingCommentId(null)}
        />
      )}
    </section>
  );
}
