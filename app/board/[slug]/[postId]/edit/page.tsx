"use client";

// 게시글 수정 페이지 — R-B/T10 (2026-06-20)
// 마운트 시 fetchBoardPost로 기존 글 prefill → PATCH /api/board/[slug]/[postId]
// 익명 글: 비밀번호 입력 게이트(guestPassword 동봉). 회원 글: 바로 편집.

import { use, useState, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Info } from "lucide-react";
import FooterSection from "@/components/footer-section";
import { BOARD_META, type BoardSlug } from "@/lib/community/board-meta";
import { fetchBoardPost, updateBoardPost } from "@/lib/community/board-queries";

const BlogEditor = dynamic(() => import("@/components/Blog/editor/BlogEditor"), {
    ssr: false,
    loading: () => (
        <div className="min-h-[400px] border border-outline-variant rounded-md p-4 text-on-surface-variant text-body-sm">
            에디터 로딩 중...
        </div>
    ),
});

const VALID_SLUGS: BoardSlug[] = ["free", "market", "info"];

type LoadState =
    | { status: "loading" }
    | { status: "password-gate" }  // 익명 글: 비번 미확인
    | { status: "ready" }
    | { status: "error"; message: string };

export default function PostEditPage({
    params,
}: {
    params: Promise<{ slug: string; postId: string }>;
}) {
    const { slug, postId } = use(params);
    if (!VALID_SLUGS.includes(slug as BoardSlug)) notFound();

    const router = useRouter();
    const boardSlug = slug as BoardSlug;
    const meta = BOARD_META[boardSlug];

    // 폼 상태
    const [category, setCategory] = useState("잡담");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [coinSymbol, setCoinSymbol] = useState("");

    // 익명 게이트
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [guestPwd, setGuestPwd] = useState("");
    const [guestPwdInput, setGuestPwdInput] = useState(""); // 게이트 입력값

    // 페이지 상태
    const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
    const [submitting, setSubmitting] = useState(false);

    // 마운트: 기존 글 로드
    useEffect(() => {
        async function load() {
            try {
                const { post } = await fetchBoardPost(boardSlug, postId);
                setTitle(post.title);
                setContent(post.contentHtml ?? "");
                setCategory(post.category || meta.categories[1] || "잡담");
                setTags(post.tags ?? []);
                setCoinSymbol(post.coinSymbol ?? "");

                const anon = !!post.authorIp; // guest_ip_masked 존재 → 익명 글
                setIsAnonymous(anon);

                if (anon) {
                    // 비밀번호 게이트로 진입 — 이미 prefill은 완료
                    setLoadState({ status: "password-gate" });
                } else {
                    setLoadState({ status: "ready" });
                }
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : "게시글을 불러올 수 없습니다.";
                setLoadState({ status: "error", message: msg });
            }
        }
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [boardSlug, postId]);

    // 태그 추가
    const addTag = () => {
        const t = tagInput.trim().replace(/^#/, "");
        if (!t || tags.includes(t) || tags.length >= 10) return;
        setTags([...tags, t]);
        setTagInput("");
    };

    // 비밀번호 게이트 통과
    const handleGateConfirm = () => {
        if (!guestPwdInput.trim()) {
            alert("비밀번호를 입력해주세요.");
            return;
        }
        setGuestPwd(guestPwdInput);
        setLoadState({ status: "ready" });
    };

    // 수정 제출
    const handleSubmit = async () => {
        if (!title.trim()) {
            alert("제목을 입력해주세요.");
            return;
        }
        if (!content.trim()) {
            alert("내용을 입력해주세요.");
            return;
        }
        setSubmitting(true);
        try {
            await updateBoardPost(boardSlug, postId, {
                title: title.trim(),
                contentHtml: content,
                category,
                tags,
                coinSymbol: coinSymbol.trim() || undefined,
                guestPassword: isAnonymous ? guestPwd : undefined,
            });
            router.push(`/board/${boardSlug}/${postId}`);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "수정에 실패했습니다.";
            // 권한 오류는 별도 안내
            if (msg.includes("403") || msg.includes("Forbidden") || msg.includes("비밀번호 불일치")) {
                alert("수정 권한이 없거나 비밀번호가 일치하지 않습니다.");
                // 익명 글이면 게이트로 되돌리기
                if (isAnonymous) {
                    setGuestPwd("");
                    setGuestPwdInput("");
                    setLoadState({ status: "password-gate" });
                }
            } else {
                alert(msg);
            }
            setSubmitting(false);
        }
    };

    // ── 로딩 ──
    if (loadState.status === "loading") {
        return (
            <main className="flex-1 bg-surface-container-low">
                <div className="max-w-[900px] mx-auto px-4 lg:px-6 py-16 text-center text-on-surface-variant text-body-sm">
                    게시글을 불러오는 중...
                </div>
                <FooterSection />
            </main>
        );
    }

    // ── 에러(404/410/기타) ──
    if (loadState.status === "error") {
        return (
            <main className="flex-1 bg-surface-container-low">
                <div className="max-w-[900px] mx-auto px-4 lg:px-6 py-16 text-center">
                    <p className="text-body-base text-on-surface mb-3">{loadState.message}</p>
                    <Link href={`/board/${boardSlug}`} className="text-primary font-bold hover:underline">
                        {meta.name} 목록으로 →
                    </Link>
                </div>
                <FooterSection />
            </main>
        );
    }

    // ── 익명 비밀번호 게이트 ──
    if (loadState.status === "password-gate") {
        return (
            <main className="flex-1 bg-surface-container-low">
                <div className="max-w-[480px] mx-auto px-4 py-16">
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-md p-6">
                        <h1 className="text-h2 mb-2">게시글 수정</h1>
                        <p className="text-body-sm text-on-surface-variant mb-4">
                            익명 게시글 수정을 위해 작성 시 입력한 비밀번호를 확인합니다.
                        </p>
                        <input
                            type="password"
                            placeholder="비밀번호 (4자 이상)"
                            value={guestPwdInput}
                            onChange={(e) => setGuestPwdInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleGateConfirm();
                            }}
                            className="w-full border border-outline-variant rounded text-body-sm px-3 py-2 focus:outline-none focus:border-primary mb-4"
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <Link
                                href={`/board/${boardSlug}/${postId}`}
                                className="px-4 py-2 rounded-md border border-outline-variant text-body-sm text-on-surface hover:bg-surface-container-low"
                            >
                                취소
                            </Link>
                            <button
                                type="button"
                                onClick={handleGateConfirm}
                                className="bg-primary text-on-primary text-label-bold px-6 py-2 rounded-md hover:bg-primary-container"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
                <FooterSection />
            </main>
        );
    }

    // ── 편집 폼 ──
    return (
        <main className="flex-1 bg-surface-container-low">
            <div className="max-w-[900px] mx-auto px-4 lg:px-6 py-6">
                {/* 브레드크럼 */}
                <nav className="text-meta text-on-surface-variant mb-3">
                    <Link href="/" className="hover:text-primary">홈</Link>
                    <span className="mx-1">›</span>
                    <Link href={`/board/${boardSlug}`} className="hover:text-primary">{meta.name}</Link>
                    <span className="mx-1">›</span>
                    <Link href={`/board/${boardSlug}/${postId}`} className="hover:text-primary">게시글</Link>
                    <span className="mx-1">›</span>
                    <span>수정</span>
                </nav>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-md p-5 lg:p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <h1 className="text-h2">게시글 수정</h1>
                        <div className="ml-auto flex items-center gap-1 text-meta text-on-surface-variant">
                            <Info className="w-3.5 h-3.5" />
                            게시판 가이드라인을 준수해주세요.
                        </div>
                    </div>

                    {/* 카테고리 선택 */}
                    <div className="mb-4">
                        <label className="text-label-bold text-on-surface-variant block mb-1">카테고리</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full sm:w-1/2 bg-surface-container-lowest border border-outline-variant rounded-md text-body-sm px-3 py-2 focus:outline-none focus:border-primary"
                        >
                            {meta.categories.filter((c) => c !== "전체").map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* 제목 */}
                    <label className="text-label-bold text-on-surface-variant block mb-1">제목</label>
                    <input
                        type="text"
                        placeholder="제목을 입력하세요"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={100}
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-md text-body-base px-3 py-2.5 focus:outline-none focus:border-primary mb-4"
                    />

                    {/* 본문 (TipTap 에디터) */}
                    <label className="text-label-bold text-on-surface-variant block mb-1">본문</label>
                    <div className="mb-4">
                        <BlogEditor key={postId} content={content} onChange={setContent} tone="light" />
                    </div>

                    {/* 태그 */}
                    <label className="text-label-bold text-on-surface-variant block mb-1">태그 (선택)</label>
                    <div className="flex flex-wrap items-center gap-1.5 mb-4 p-2 border border-outline-variant rounded-md min-h-[40px]">
                        {tags.map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setTags(tags.filter((x) => x !== t))}
                                className="text-meta px-2 py-0.5 rounded bg-primary-fixed text-primary hover:bg-error-container hover:text-error"
                            >
                                #{t} ✕
                            </button>
                        ))}
                        {tags.length < 10 && (
                            <input
                                type="text"
                                placeholder={tags.length === 0 ? "태그 입력 후 엔터 (최대 10개)" : "추가..."}
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === ",") {
                                        e.preventDefault();
                                        addTag();
                                    }
                                }}
                                className="flex-1 min-w-[120px] text-body-sm bg-transparent focus:outline-none px-1"
                            />
                        )}
                    </div>

                    {/* 버튼 */}
                    <div className="flex justify-end gap-2 border-t border-outline-variant pt-4">
                        <Link
                            href={`/board/${boardSlug}/${postId}`}
                            className="px-4 py-2 rounded-md border border-outline-variant text-body-sm text-on-surface hover:bg-surface-container-low"
                        >
                            취소
                        </Link>
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={handleSubmit}
                            className="bg-primary text-on-primary text-label-bold px-6 py-2 rounded-md hover:bg-primary-container disabled:opacity-60"
                        >
                            {submitting ? "저장 중..." : "저장"}
                        </button>
                    </div>
                </div>
            </div>
            <FooterSection />
        </main>
    );
}
