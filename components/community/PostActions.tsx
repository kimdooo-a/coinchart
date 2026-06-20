"use client";

// 게시글 헤더 액션 (수정/삭제/공유) — R3/T02 상세 SSR 전환 시 인터랙션부 분리
// 삭제는 board-queries의 deleteBoardPost(클라 fetch) 사용. 익명 글은 비밀번호 prompt.

import { useRouter } from "next/navigation";
import { Share2, Edit, Trash2 } from "lucide-react";
import { deleteBoardPost } from "@/lib/community/board-queries";
import type { BoardSlug } from "@/lib/community/board-meta";

interface PostActionsProps {
  slug: BoardSlug;
  postId: string;
  /** 익명 글이면 삭제 시 작성 비밀번호 필요 */
  requiresPassword: boolean;
}

export default function PostActions({ slug, postId, requiresPassword }: PostActionsProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    let guestPassword: string | undefined;
    if (requiresPassword) {
      guestPassword = window.prompt("작성 시 입력한 비밀번호") ?? undefined;
      if (!guestPassword) return;
    }
    try {
      await deleteBoardPost(slug, postId, guestPassword);
      alert("삭제되었습니다.");
      router.push(`/board/${slug}`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        className="hover:text-primary inline-flex items-center gap-1"
        type="button"
        onClick={() => router.push(`/board/${slug}/${postId}/edit`)}
      >
        <Edit className="w-3 h-3" />수정
      </button>
      <button onClick={handleDelete} className="hover:text-error inline-flex items-center gap-1" type="button">
        <Trash2 className="w-3 h-3" />삭제
      </button>
      <button className="hover:text-primary inline-flex items-center gap-1" type="button">
        <Share2 className="w-3 h-3" />공유
      </button>
    </div>
  );
}
