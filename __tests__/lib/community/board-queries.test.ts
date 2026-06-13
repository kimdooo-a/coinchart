// board-queries.ts 순수 매퍼 단위 테스트 (kdyswarm 갈래 A)
//
// 검증 대상(3종 순수 매퍼):
//   - toBoardListItem(row): PostListRow → BoardListItem
//   - toBoardPostDetail(row, counts?): PostDetailRow → BoardPostDetail
//   - toBoardComment(row): CommentRow → BoardCommentItem
//
// 네트워크/Supabase 호출 없이 인메모리 fixture row만 주입해 매핑 규칙만 검증한다.
// createdAt은 내부 relativeTime(Date.now() 사용, export 안 됨)에 의존하므로
// vi.useFakeTimers()로 시각을 고정한 뒤 created_at을 기준 상대값으로 만들어 결정적으로 단언한다.

import { describe, it, expect, vi, afterEach } from "vitest";
import {
  toBoardListItem,
  toBoardPostDetail,
  toBoardComment,
  type PostListRow,
  type PostDetailRow,
  type CommentRow,
} from "@/lib/community/board-queries";

// 고정 기준 시각: 2026-06-13T00:00:00Z
const NOW_ISO = "2026-06-13T00:00:00Z";
const NOW_MS = new Date(NOW_ISO).getTime();

/** NOW에서 minutes 분 이전 시각의 ISO 문자열 */
function minutesAgo(minutes: number): string {
  return new Date(NOW_MS - minutes * 60_000).toISOString();
}

// ─────────────────────────────────────────────────────────────
// fixture 빌더 (필요 필드만 override)
// ─────────────────────────────────────────────────────────────

function makeListRow(overrides: Partial<PostListRow> = {}): PostListRow {
  return {
    id: "uuid-list-1",
    board_slug: "free",
    title: "테스트 제목",
    author_id: "user-1",
    guest_nickname: null,
    guest_ip_masked: null,
    category: "잡담",
    tags: ["태그1"],
    coin_symbol: "BTC",
    view_count: 100,
    like_count: 7,
    comment_count: 3,
    is_notice: false,
    is_hot: false,
    created_at: NOW_ISO,
    updated_at: NOW_ISO,
    ...overrides,
  };
}

function makeDetailRow(overrides: Partial<PostDetailRow> = {}): PostDetailRow {
  return {
    ...makeListRow(),
    id: "uuid-detail-1",
    content_html: "<p>본문</p>",
    is_deleted: false,
    ...overrides,
  };
}

function makeCommentRow(overrides: Partial<CommentRow> = {}): CommentRow {
  return {
    id: "uuid-comment-1",
    post_id: "uuid-detail-1",
    parent_id: null,
    content: "댓글 내용",
    author_id: "user-9",
    guest_nickname: null,
    guest_ip_masked: null,
    like_count: 2,
    created_at: NOW_ISO,
    ...overrides,
  };
}

afterEach(() => {
  // fake timers를 켠 테스트가 있으므로 항상 원복
  vi.useRealTimers();
});

// ─────────────────────────────────────────────────────────────
// toBoardListItem
// ─────────────────────────────────────────────────────────────

describe("toBoardListItem - 회원/익명 매핑", () => {
  it("회원(author_id 존재): author='회원', authorIp=undefined, 전 필드 매핑", () => {
    const row = makeListRow({
      id: "uuid-A",
      author_id: "user-1",
      guest_nickname: "무시될닉",
      guest_ip_masked: "211.34.*.*",
      view_count: 1234,
      like_count: 56,
      comment_count: 78,
      is_notice: true,
      is_hot: true,
      category: "분석",
    });
    const item = toBoardListItem(row);

    expect(item.uuid).toBe("uuid-A");
    expect(item.id).toBe(0); // 표시용 placeholder
    expect(item.title).toBe("테스트 제목");
    expect(item.author).toBe("회원");
    expect(item.authorIp).toBeUndefined();
    expect(item.views).toBe(1234);
    expect(item.likes).toBe(56);
    expect(item.commentCount).toBe(78);
    expect(item.isNotice).toBe(true);
    expect(item.isHot).toBe(true);
    expect(item.category).toBe("분석");
  });

  it("익명(author_id null): author=guest_nickname, authorIp=마스킹 변환", () => {
    const row = makeListRow({
      author_id: null,
      guest_nickname: "익명전사",
      guest_ip_masked: "211.34.*.*",
    });
    const item = toBoardListItem(row);

    expect(item.author).toBe("익명전사");
    expect(item.authorIp).toBe("211.34"); // "211.34.*.*" → "211.34"
  });

  it("익명이며 guest_nickname null: author='익명'", () => {
    const row = makeListRow({
      author_id: null,
      guest_nickname: null,
      guest_ip_masked: "10.0.*.*",
    });
    const item = toBoardListItem(row);

    expect(item.author).toBe("익명");
    expect(item.authorIp).toBe("10.0");
  });

  it("익명이며 guest_ip_masked null: authorIp=undefined", () => {
    const row = makeListRow({
      author_id: null,
      guest_nickname: "닉",
      guest_ip_masked: null,
    });
    const item = toBoardListItem(row);

    expect(item.authorIp).toBeUndefined();
  });
});

describe("toBoardListItem - category 방어", () => {
  it("category null → undefined", () => {
    expect(toBoardListItem(makeListRow({ category: null })).category).toBeUndefined();
  });

  it('category "전체" → undefined', () => {
    expect(toBoardListItem(makeListRow({ category: "전체" })).category).toBeUndefined();
  });

  it("그 외 category 값은 그대로", () => {
    expect(toBoardListItem(makeListRow({ category: "호재" })).category).toBe("호재");
  });
});

// ─────────────────────────────────────────────────────────────
// toBoardPostDetail
// ─────────────────────────────────────────────────────────────

describe("toBoardPostDetail - 기본 매핑", () => {
  it("회원 상세: 전 필드 매핑 + counts 미제공 시 likes=like_count, dislikes=0", () => {
    const row = makeDetailRow({
      id: "uuid-D",
      board_slug: "coin",
      title: "상세 제목",
      content_html: "<p>HTML</p>",
      tags: ["t1", "t2"],
      coin_symbol: "ETH",
      view_count: 999,
      like_count: 42,
      comment_count: 5,
      is_notice: true,
      is_hot: false,
      category: "분석",
      author_id: "user-1",
    });
    const dto = toBoardPostDetail(row);

    expect(dto.id).toBe("uuid-D");
    expect(dto.boardSlug).toBe("coin");
    expect(dto.title).toBe("상세 제목");
    expect(dto.contentHtml).toBe("<p>HTML</p>");
    expect(dto.author).toBe("회원");
    expect(dto.authorIp).toBeUndefined();
    expect(dto.isAdmin).toBe(false);
    expect(dto.category).toBe("분석");
    expect(dto.tags).toEqual(["t1", "t2"]);
    expect(dto.coinSymbol).toBe("ETH");
    expect(dto.views).toBe(999);
    expect(dto.likes).toBe(42); // counts 미제공 → like_count 폴백
    expect(dto.dislikes).toBe(0); // counts 미제공 → 0
    expect(dto.commentCount).toBe(5);
    expect(dto.isNotice).toBe(true);
    expect(dto.isHot).toBe(false);
  });

  it("익명 상세: author=guest_nickname, authorIp 마스킹", () => {
    const dto = toBoardPostDetail(
      makeDetailRow({
        author_id: null,
        guest_nickname: "익명러",
        guest_ip_masked: "192.168.*.*",
      })
    );
    expect(dto.author).toBe("익명러");
    expect(dto.authorIp).toBe("192.168");
  });

  it("익명이며 guest_nickname null → author='익명'", () => {
    const dto = toBoardPostDetail(
      makeDetailRow({ author_id: null, guest_nickname: null, guest_ip_masked: null })
    );
    expect(dto.author).toBe("익명");
    expect(dto.authorIp).toBeUndefined();
  });
});

describe("toBoardPostDetail - counts 분기", () => {
  it("counts 제공 시 likes=counts.likes, dislikes=counts.dislikes (like_count 무시)", () => {
    const dto = toBoardPostDetail(makeDetailRow({ like_count: 42 }), {
      likes: 100,
      dislikes: 13,
    });
    expect(dto.likes).toBe(100);
    expect(dto.dislikes).toBe(13);
  });

  it("counts.likes=0 같은 falsy 값도 그대로 반영 (counts 객체 존재 기준)", () => {
    const dto = toBoardPostDetail(makeDetailRow({ like_count: 42 }), {
      likes: 0,
      dislikes: 0,
    });
    expect(dto.likes).toBe(0);
    expect(dto.dislikes).toBe(0);
  });
});

describe("toBoardPostDetail - null/누락 필드 방어", () => {
  it("content_html null → contentHtml=''", () => {
    expect(toBoardPostDetail(makeDetailRow({ content_html: null })).contentHtml).toBe("");
  });

  it("tags null → tags=[]", () => {
    expect(toBoardPostDetail(makeDetailRow({ tags: null })).tags).toEqual([]);
  });

  it("coin_symbol null → coinSymbol=undefined", () => {
    expect(toBoardPostDetail(makeDetailRow({ coin_symbol: null })).coinSymbol).toBeUndefined();
  });

  it("category null/'전체' → undefined", () => {
    expect(toBoardPostDetail(makeDetailRow({ category: null })).category).toBeUndefined();
    expect(toBoardPostDetail(makeDetailRow({ category: "전체" })).category).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────
// toBoardComment
// ─────────────────────────────────────────────────────────────

describe("toBoardComment - 매핑", () => {
  it("회원 댓글: author='회원', parentId/content/likes 매핑", () => {
    const row = makeCommentRow({
      id: "uuid-C",
      parent_id: "uuid-parent",
      content: "리플 댓글",
      author_id: "user-9",
      like_count: 5,
    });
    const c = toBoardComment(row);

    expect(c.id).toBe("uuid-C");
    expect(c.parentId).toBe("uuid-parent");
    expect(c.author).toBe("회원");
    expect(c.authorIp).toBeUndefined();
    expect(c.isAdmin).toBe(false);
    expect(c.content).toBe("리플 댓글");
    expect(c.likes).toBe(5);
  });

  it("익명 댓글: author=guest_nickname, authorIp 마스킹", () => {
    const c = toBoardComment(
      makeCommentRow({
        author_id: null,
        guest_nickname: "익명댓글러",
        guest_ip_masked: "1.2.*.*",
      })
    );
    expect(c.author).toBe("익명댓글러");
    expect(c.authorIp).toBe("1.2");
  });

  it("익명이며 guest_nickname null → author='익명'", () => {
    const c = toBoardComment(
      makeCommentRow({ author_id: null, guest_nickname: null, guest_ip_masked: null })
    );
    expect(c.author).toBe("익명");
    expect(c.authorIp).toBeUndefined();
  });

  it("parent_id null → parentId=null", () => {
    expect(toBoardComment(makeCommentRow({ parent_id: null })).parentId).toBeNull();
  });

  it("like_count nullish → likes=0", () => {
    // like_count는 타입상 number지만 런타임 누락(nullish) 방어를 검증
    const row = makeCommentRow();
    // @ts-expect-error 런타임 누락 시나리오 강제 주입
    row.like_count = null;
    expect(toBoardComment(row).likes).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// createdAt 상대시간 경계 (fake timers)
// 라벨: "방금 전" / "N분전" / "N시간전" / "N일전" / "N주전" (분/시간/일/주는 공백 없음)
// ─────────────────────────────────────────────────────────────

describe("createdAt 상대시간 경계", () => {
  function withFrozenNow<T>(fn: () => T): T {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW_ISO));
    try {
      return fn();
    } finally {
      vi.useRealTimers();
    }
  }

  it("0분 전 (< 1분) → '방금 전'", () => {
    withFrozenNow(() => {
      const item = toBoardListItem(makeListRow({ created_at: minutesAgo(0) }));
      expect(item.createdAt).toBe("방금 전");
    });
  });

  it("30분 전 → '30분전'", () => {
    withFrozenNow(() => {
      const item = toBoardListItem(makeListRow({ created_at: minutesAgo(30) }));
      expect(item.createdAt).toBe("30분전");
    });
  });

  it("59분 전 (분 경계 직전) → '59분전'", () => {
    withFrozenNow(() => {
      const item = toBoardListItem(makeListRow({ created_at: minutesAgo(59) }));
      expect(item.createdAt).toBe("59분전");
    });
  });

  it("60분 전 (시간 경계) → '1시간전'", () => {
    withFrozenNow(() => {
      const item = toBoardListItem(makeListRow({ created_at: minutesAgo(60) }));
      expect(item.createdAt).toBe("1시간전");
    });
  });

  it("23시간 전 → '23시간전'", () => {
    withFrozenNow(() => {
      const item = toBoardListItem(makeListRow({ created_at: minutesAgo(23 * 60) }));
      expect(item.createdAt).toBe("23시간전");
    });
  });

  it("24시간 전 (일 경계) → '1일전'", () => {
    withFrozenNow(() => {
      const item = toBoardListItem(makeListRow({ created_at: minutesAgo(24 * 60) }));
      expect(item.createdAt).toBe("1일전");
    });
  });

  it("6일 전 → '6일전'", () => {
    withFrozenNow(() => {
      const item = toBoardListItem(makeListRow({ created_at: minutesAgo(6 * 24 * 60) }));
      expect(item.createdAt).toBe("6일전");
    });
  });

  it("7일 전 (주 경계) → '1주전'", () => {
    withFrozenNow(() => {
      const item = toBoardListItem(makeListRow({ created_at: minutesAgo(7 * 24 * 60) }));
      expect(item.createdAt).toBe("1주전");
    });
  });

  it("상세/댓글 매퍼도 동일한 상대시간 규칙 적용", () => {
    withFrozenNow(() => {
      const detail = toBoardPostDetail(makeDetailRow({ created_at: minutesAgo(60) }));
      expect(detail.createdAt).toBe("1시간전");

      const comment = toBoardComment(makeCommentRow({ created_at: minutesAgo(2 * 24 * 60) }));
      expect(comment.createdAt).toBe("2일전");
    });
  });
});
