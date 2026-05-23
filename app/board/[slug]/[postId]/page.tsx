"use client";

import { use, useState, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { ThumbsUp, ThumbsDown, Share2, Bookmark, Flag, Edit, Trash2 } from "lucide-react";
import BoardRow, { BoardTableHeader } from "@/components/community/BoardRow";
import CommunityBadge from "@/components/community/Badge";
import BoardSidebar from "@/components/community/BoardSidebar";
import FooterSection from "@/components/footer-section";
import { BOARD_META, type BoardSlug } from "@/lib/community/mock-posts";
import {
    fetchBoardPost,
    fetchBoardList,
    createComment,
    togglePostLike,
    deleteBoardPost,
    type BoardPostDetail,
    type BoardCommentItem,
    type BoardListItem,
} from "@/lib/community/board-queries";

const VALID_SLUGS: BoardSlug[] = ["free", "market", "info"];

export default function PostDetailPage({
    params,
}: {
    params: Promise<{ slug: string; postId: string }>;
}) {
    const { slug, postId } = use(params);
    if (!VALID_SLUGS.includes(slug as BoardSlug)) notFound();

    const boardSlug = slug as BoardSlug;
    const meta = BOARD_META[boardSlug];
    const router = useRouter();

    const [post, setPost] = useState<BoardPostDetail | null>(null);
    const [comments, setComments] = useState<BoardCommentItem[]>([]);
    const [siblings, setSiblings] = useState<BoardListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 추천/비추 상태
    const [liked, setLiked] = useState(false);
    const [disliked, setDisliked] = useState(false);
    const [likes, setLikes] = useState(0);
    const [likeBusy, setLikeBusy] = useState(false);

    // 댓글 입력
    const [commentInput, setCommentInput] = useState("");
    const [guestNick, setGuestNick] = useState("");
    const [guestPwd, setGuestPwd] = useState("");
    const [commentSort, setCommentSort] = useState<"latest" | "popular">("latest");
    const [commentBusy, setCommentBusy] = useState(false);

    // 게시글 + 댓글 로드
    useEffect(() => {
        let alive = true;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetchBoardPost(boardSlug, postId);
                if (!alive) return;
                setPost(res.post);
                setComments(res.comments);
                setLikes(res.post.likes);
            } catch (e: unknown) {
                if (!alive) return;
                setError(e instanceof Error ? e.message : "게시글을 불러오지 못했습니다.");
            } finally {
                if (alive) setLoading(false);
            }
        };
        void load();
        return () => {
            alive = false;
        };
    }, [boardSlug, postId]);

    // 같은 게시판 글 (이전/다음 + 다른 글 미니표)
    useEffect(() => {
        let alive = true;
        fetchBoardList(boardSlug, { limit: 30, sort: "latest" })
            .then((res) => alive && setSiblings(res.posts))
            .catch(() => undefined);
        return () => {
            alive = false;
        };
    }, [boardSlug]);

    const handleLike = async () => {
        if (!post || likeBusy) return;
        setLikeBusy(true);
        try {
            const { liked: nowLiked, likeCount } = await togglePostLike(post.id, 1);
            setLiked(nowLiked);
            setLikes(likeCount);
            if (nowLiked) setDisliked(false);
        } catch (e: unknown) {
            alert(e instanceof Error ? e.message : "추천 처리에 실패했습니다.");
        } finally {
            setLikeBusy(false);
        }
    };

    const handleDislike = async () => {
        if (!post || likeBusy) return;
        setLikeBusy(true);
        const wasDisliked = disliked;
        try {
            const { likeCount } = await togglePostLike(post.id, -1);
            setLikes(likeCount);
            setDisliked(!wasDisliked);
            if (!wasDisliked) setLiked(false);
        } catch (e: unknown) {
            alert(e instanceof Error ? e.message : "비추 처리에 실패했습니다.");
        } finally {
            setLikeBusy(false);
        }
    };

    const handleCommentSubmit = async () => {
        if (!post || !commentInput.trim() || commentBusy) return;
        setCommentBusy(true);
        try {
            const created = await createComment({
                postId: post.id,
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

    const handleDelete = async () => {
        if (!post) return;
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        let guestPassword: string | undefined;
        // 익명 글(authorIp 존재)은 작성 비밀번호 필요
        if (post.authorIp) {
            guestPassword = window.prompt("작성 시 입력한 비밀번호") ?? undefined;
            if (!guestPassword) return;
        }
        try {
            await deleteBoardPost(boardSlug, post.id, guestPassword);
            alert("삭제되었습니다.");
            router.push(`/board/${boardSlug}`);
        } catch (e: unknown) {
            alert(e instanceof Error ? e.message : "삭제에 실패했습니다.");
        }
    };

    // 로딩/에러 fallback
    if (loading) {
        return (
            <main className="flex-1 bg-surface-container-low">
                <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-16 text-center text-on-surface-variant text-body-sm">
                    불러오는 중...
                </div>
                <FooterSection />
            </main>
        );
    }
    if (error || !post) {
        return (
            <main className="flex-1 bg-surface-container-low">
                <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-16 text-center">
                    <p className="text-body-base text-on-surface mb-3">
                        {error ?? "게시글을 찾을 수 없습니다."}
                    </p>
                    <Link href={`/board/${boardSlug}`} className="text-primary font-bold hover:underline">
                        {meta.name} 목록으로 →
                    </Link>
                </div>
                <FooterSection />
            </main>
        );
    }

    const idx = siblings.findIndex((p) => p.uuid === post.id);
    const prev = idx >= 0 ? siblings[idx + 1] : undefined;
    const next = idx > 0 ? siblings[idx - 1] : undefined;
    const sameBoardPosts = siblings.filter((p) => p.uuid !== post.id).slice(0, 10);

    const topComments = comments.filter((c) => !c.parentId);
    const sortedTopComments =
        commentSort === "popular"
            ? [...topComments].sort((a, b) => b.likes - a.likes)
            : [...topComments].reverse(); // 최신순 (API는 created_at 오름차순 반환)

    return (
        <main className="flex-1 bg-surface-container-low">
            <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-6 flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0">
                    {/* 브레드크럼 */}
                    <nav className="text-meta text-on-surface-variant mb-3">
                        <Link href="/" className="hover:text-primary">홈</Link>
                        <span className="mx-1">›</span>
                        <Link href={`/board/${boardSlug}`} className="hover:text-primary">{meta.name}</Link>
                        <span className="mx-1">›</span>
                        <span className="truncate max-w-[200px] inline-block align-bottom">{post.title}</span>
                    </nav>

                    {/* 게시글 헤더 */}
                    <header className="bg-surface-container-lowest border border-outline-variant rounded-md p-5 mb-3">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            {post.isHot && <CommunityBadge variant="hot">HOT</CommunityBadge>}
                            {post.isNotice && <CommunityBadge variant="primary">공지</CommunityBadge>}
                            {post.category && <CommunityBadge variant="outline">{post.category}</CommunityBadge>}
                        </div>
                        <h1 className="text-h2 leading-tight mb-3">{post.title}</h1>
                        <div className="flex items-center justify-between flex-wrap gap-2 text-meta text-on-surface-variant border-t border-outline-variant pt-3">
                            <div>
                                {post.isAdmin ? (
                                    <span className="text-primary font-bold">{post.author} 🛡</span>
                                ) : (
                                    <>
                                        <strong className="text-on-surface">{post.author}</strong>
                                        {post.authorIp && <span className="ml-1 text-outline">({post.authorIp}.*.*)</span>}
                                    </>
                                )}
                                <span className="mx-2">·</span>
                                <span>{post.createdAt}</span>
                                <span className="mx-2">·</span>
                                <span>조회 {post.views.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="hover:text-primary inline-flex items-center gap-1" type="button">
                                    <Edit className="w-3 h-3" />수정
                                </button>
                                <button onClick={handleDelete} className="hover:text-error inline-flex items-center gap-1" type="button">
                                    <Trash2 className="w-3 h-3" />삭제
                                </button>
                                <button className="hover:text-primary inline-flex items-center gap-1" type="button">
                                    <Share2 className="w-3 h-3" />공유
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* 본문 */}
                    <article className="bg-surface-container-lowest border border-outline-variant rounded-md px-5 py-8 mb-4">
                        <div
                            className="prose prose-sm max-w-none prose-headings:text-on-surface prose-p:text-on-surface prose-a:text-primary"
                            dangerouslySetInnerHTML={{ __html: post.contentHtml ?? "" }}
                        />

                        {/* 태그 */}
                        {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-6">
                                {post.tags.map((t) => (
                                    <span
                                        key={t}
                                        className="text-meta px-2 py-0.5 rounded bg-surface-container text-primary hover:bg-primary-fixed cursor-pointer"
                                    >
                                        {t}
                                    </span>
                                ))}
                            </div>
                        )}
                    </article>

                    {/* 추천·공유 바 */}
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
                            <span className="font-bold">비추 {disliked ? 1 : 0}</span>
                        </button>
                        <button type="button" className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-body-sm text-on-surface-variant hover:bg-surface-container">
                            <Bookmark className="w-4 h-4" />스크랩
                        </button>
                        <button type="button" className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-body-sm text-on-surface-variant hover:bg-surface-container">
                            <Flag className="w-4 h-4" />신고
                        </button>
                    </div>

                    {/* 댓글 영역 */}
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
                                            <button className="hover:text-[var(--color-positive)] inline-flex items-center gap-0.5">
                                                <ThumbsUp className="w-3 h-3" />
                                                {c.likes}
                                            </button>
                                            <button className="hover:text-primary">답글</button>
                                            <button className="hover:text-error">신고</button>
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
                                                    <button className="hover:text-[var(--color-positive)] inline-flex items-center gap-0.5">
                                                        <ThumbsUp className="w-3 h-3" />
                                                        {cc.likes}
                                                    </button>
                                                    <button className="hover:text-primary">답글</button>
                                                </div>
                                            </div>
                                        ))}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {/* 이전/다음 */}
                    <nav className="bg-surface-container-lowest border border-outline-variant rounded-md divide-y divide-outline-variant mb-4">
                        {prev && (
                            <Link
                                href={`/board/${boardSlug}/${prev.uuid}`}
                                className="grid grid-cols-[60px_1fr] gap-3 px-4 py-2.5 text-body-sm hover:bg-surface-container-low transition-colors"
                            >
                                <span className="text-meta text-on-surface-variant">◀ 이전</span>
                                <span className="truncate">{prev.title}</span>
                            </Link>
                        )}
                        {next && (
                            <Link
                                href={`/board/${boardSlug}/${next.uuid}`}
                                className="grid grid-cols-[60px_1fr] gap-3 px-4 py-2.5 text-body-sm hover:bg-surface-container-low transition-colors"
                            >
                                <span className="text-meta text-on-surface-variant">▶ 다음</span>
                                <span className="truncate">{next.title}</span>
                            </Link>
                        )}
                    </nav>

                    {/* 같은 게시판 미니 표 */}
                    <section className="bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-outline-variant flex items-center justify-between">
                            <h3 className="text-body-sm font-bold">{meta.name} 다른 글</h3>
                            <Link href={`/board/${boardSlug}`} className="text-meta text-on-surface-variant hover:text-primary">
                                목록 ›
                            </Link>
                        </div>
                        <BoardTableHeader />
                        <div className="divide-y divide-outline-variant">
                            {sameBoardPosts.map((p) => (
                                <BoardRow
                                    key={p.uuid}
                                    post={p}
                                    href={`/board/${boardSlug}/${p.uuid}`}
                                    compact
                                />
                            ))}
                        </div>
                    </section>
                </div>

                {/* Sidebar */}
                <BoardSidebar showTools={false} />
            </div>
            <FooterSection />
        </main>
    );
}
