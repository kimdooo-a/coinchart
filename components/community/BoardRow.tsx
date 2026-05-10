import Link from "next/link";
import { MessageSquare, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import CommunityBadge, { type BadgeVariant } from "./Badge";

export interface BoardPost {
  id: number;
  number?: number;
  title: string;
  author: string;
  authorIp?: string; // 익명 글의 IP 앞2옥텟 (예: "211.34")
  isAdmin?: boolean;
  createdAt: string; // ISO 또는 상대시간 라벨
  views: number;
  likes: number;
  commentCount?: number;
  hasImage?: boolean;
  isNotice?: boolean;
  isHot?: boolean;
  isNew?: boolean;
  category?: string;
}

interface BoardRowProps {
  post: BoardPost;
  href: string;
  /** 표 컬럼 그리드 (기본은 시안 _3) */
  gridClassName?: string;
  /** 호버·방문 효과 끄기 (홈 미니 리스트용) */
  compact?: boolean;
}

const DEFAULT_GRID =
  "grid grid-cols-[60px_1fr_100px_80px_60px_60px] gap-4 py-2 px-3 items-center";

export default function BoardRow({
  post,
  href,
  gridClassName,
  compact = false,
}: BoardRowProps) {
  const isNotice = post.isNotice;

  return (
    <Link
      href={href}
      className={cn(
        gridClassName ?? DEFAULT_GRID,
        "transition-colors group",
        isNotice
          ? "bg-surface-container-low"
          : "hover:bg-surface-container",
        compact && "py-1.5"
      )}
    >
      {/* No / 뱃지 */}
      <div className="text-center">
        {isNotice ? (
          <CommunityBadge variant="primary">공지</CommunityBadge>
        ) : (
          <span className="text-meta text-outline">{post.number ?? post.id}</span>
        )}
      </div>

      {/* 제목 + 인라인 뱃지 */}
      <div className="flex items-center gap-1.5 overflow-hidden min-w-0">
        {!isNotice && post.isHot && (
          <span className="border border-error text-error px-1 py-0.5 rounded-sm text-[9px] font-bold leading-none">
            HOT
          </span>
        )}
        {!isNotice && post.isNew && (
          <span className="border border-secondary text-secondary px-1 py-0.5 rounded-sm text-[9px] font-bold leading-none">
            NEW
          </span>
        )}
        <span
          className={cn(
            "text-body-base truncate group-hover:text-primary",
            isNotice && "font-bold"
          )}
        >
          {post.title}
        </span>
        {post.commentCount && post.commentCount > 0 && (
          <span className="text-meta text-primary font-bold flex-shrink-0">
            [{post.commentCount}]
          </span>
        )}
        {post.hasImage && (
          <ImageIcon className="w-3 h-3 text-on-surface-variant flex-shrink-0" />
        )}
        {post.category && (
          <span className="ml-1 text-meta text-on-surface-variant flex-shrink-0">
            #{post.category}
          </span>
        )}
      </div>

      {/* 작성자 */}
      <div className="text-meta text-on-surface-variant truncate">
        {post.isAdmin ? (
          <span className="text-primary font-bold">{post.author} 🛡</span>
        ) : (
          <>
            {post.author}
            {post.authorIp && (
              <span className="ml-1 text-outline">({post.authorIp}.*.*)</span>
            )}
          </>
        )}
      </div>

      {/* 시간 */}
      <div className="text-meta text-on-surface-variant text-right">{post.createdAt}</div>

      {/* 조회 */}
      <div className="text-meta text-on-surface-variant text-right tabular-nums">
        {formatCount(post.views)}
      </div>

      {/* 추천 */}
      <div
        className={cn(
          "text-meta text-right tabular-nums",
          post.likes > 0 ? "text-error font-bold" : "text-on-surface-variant"
        )}
      >
        {formatCount(post.likes)}
      </div>
    </Link>
  );
}

function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

/** 표 헤더 (No / Title / Author / Time / Views / Rec) */
export function BoardTableHeader({
  gridClassName,
}: {
  gridClassName?: string;
}) {
  return (
    <div
      className={cn(
        gridClassName ?? DEFAULT_GRID,
        "py-2.5 px-3 border-y border-outline-variant bg-surface-container-low text-on-surface-variant font-label-bold text-meta uppercase tracking-wider"
      )}
    >
      <div className="text-center">No</div>
      <div>제목</div>
      <div>작성자</div>
      <div className="text-right">시간</div>
      <div className="text-right">조회</div>
      <div className="text-right">추천</div>
    </div>
  );
}

export const BOARD_GRID = DEFAULT_GRID;
