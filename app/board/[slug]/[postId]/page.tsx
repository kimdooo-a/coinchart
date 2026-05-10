"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ThumbsUp, ThumbsDown, Share2, Bookmark, Flag, Edit, Trash2 } from "lucide-react";
import BoardRow, { BoardTableHeader } from "@/components/community/BoardRow";
import CommunityBadge from "@/components/community/Badge";
import PriceTickerWidget from "@/components/community/widgets/PriceTickerWidget";
import HotIssueWidget from "@/components/community/widgets/HotIssueWidget";
import FngGaugeWidget from "@/components/community/widgets/FngGaugeWidget";
import OfficialPostsWidget from "@/components/community/widgets/OfficialPostsWidget";
import FooterSection from "@/components/footer-section";
import {
    BOARD_META,
    MOCK_POSTS,
    MOCK_COMMENTS,
    getPost,
    type BoardSlug,
} from "@/lib/community/mock-posts";
import { TICKER_LIST, HOT_ISSUES, OFFICIAL_POSTS } from "@/lib/community/mock-coins";

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
    const post = getPost(boardSlug, parseInt(postId, 10));
    if (!post) notFound();

    const [liked, setLiked] = useState(false);
    const [disliked, setDisliked] = useState(false);
    const [likes, setLikes] = useState(post.likes);
    const [commentInput, setCommentInput] = useState("");
    const [guestNick, setGuestNick] = useState("");
    const [guestPwd, setGuestPwd] = useState("");
    const [commentSort, setCommentSort] = useState<"latest" | "popular">("latest");

    const sameBoardPosts = MOCK_POSTS[boardSlug]
        .filter((p) => !p.isNotice && p.id !== post.id)
        .slice(0, 10);

    const idx = MOCK_POSTS[boardSlug].findIndex((p) => p.id === post.id);
    const prev = MOCK_POSTS[boardSlug][idx + 1];
    const next = MOCK_POSTS[boardSlug][idx - 1];

    const handleLike = () => {
        if (liked) {
            setLikes((v) => v - 1);
            setLiked(false);
        } else {
            if (disliked) setDisliked(false);
            setLikes((v) => v + 1);
            setLiked(true);
        }
    };

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
                        <span>#{post.number}</span>
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
                                <button className="hover:text-error inline-flex items-center gap-1" type="button">
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
                            className={`inline-flex items-center gap-2 px-5 py-2 rounded-md border transition-colors ${
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
                            onClick={() => setDisliked((v) => !v)}
                            className={`inline-flex items-center gap-2 px-5 py-2 rounded-md border transition-colors ${
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
                            댓글 <span className="text-primary">{MOCK_COMMENTS.length}</span>개
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
                                className="w-full text-body-sm bg-transparent focus:outline-none resize-none"
                            />
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-meta text-on-surface-variant">{commentInput.length}/1000</span>
                                <button
                                    type="button"
                                    className="bg-primary text-on-primary text-label-bold px-4 py-1.5 rounded-md hover:bg-primary-container disabled:opacity-50"
                                    disabled={!commentInput.trim()}
                                >
                                    등록
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
                        <ul className="space-y-3">
                            {MOCK_COMMENTS.filter((c) => !c.parentId).map((c) => (
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
                                    {MOCK_COMMENTS.filter((cc) => cc.parentId === c.id).map((cc) => (
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
                    </section>

                    {/* 이전/다음 */}
                    <nav className="bg-surface-container-lowest border border-outline-variant rounded-md divide-y divide-outline-variant mb-4">
                        {prev && (
                            <Link
                                href={`/board/${boardSlug}/${prev.id}`}
                                className="grid grid-cols-[60px_1fr] gap-3 px-4 py-2.5 text-body-sm hover:bg-surface-container-low transition-colors"
                            >
                                <span className="text-meta text-on-surface-variant">◀ 이전</span>
                                <span className="truncate">{prev.title}</span>
                            </Link>
                        )}
                        {next && (
                            <Link
                                href={`/board/${boardSlug}/${next.id}`}
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
                                    key={p.id}
                                    post={p}
                                    href={`/board/${boardSlug}/${p.id}`}
                                    compact
                                />
                            ))}
                        </div>
                    </section>
                </div>

                {/* Sidebar */}
                <aside className="w-full lg:w-[300px] flex-shrink-0 space-y-4">
                    <PriceTickerWidget items={TICKER_LIST.slice(0, 6)} />
                    <HotIssueWidget items={HOT_ISSUES} />
                    <FngGaugeWidget value={72} prevValue={68} />
                    <OfficialPostsWidget posts={OFFICIAL_POSTS} />
                </aside>
            </div>
            <FooterSection />
        </main>
    );
}
