"use client";

import { use, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Info } from "lucide-react";
import FooterSection from "@/components/footer-section";
import { BOARD_META, type BoardSlug } from "@/lib/community/mock-posts";

const BlogEditor = dynamic(() => import("@/components/Blog/editor/BlogEditor"), {
    ssr: false,
    loading: () => (
        <div className="min-h-[400px] border border-outline-variant rounded-md p-4 text-on-surface-variant text-body-sm">
            에디터 로딩 중...
        </div>
    ),
});

const VALID_SLUGS: BoardSlug[] = ["free", "market", "info"];

export default function PostWritePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = use(params);
    if (!VALID_SLUGS.includes(slug as BoardSlug)) notFound();

    const router = useRouter();
    const initialBoard = slug as BoardSlug;

    const [boardSlug, setBoardSlug] = useState<BoardSlug>(initialBoard);
    const [category, setCategory] = useState("잡담");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [guestNick, setGuestNick] = useState("");
    const [guestPwd, setGuestPwd] = useState("");
    const [postAsAnonymous, setPostAsAnonymous] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const meta = BOARD_META[boardSlug];

    const addTag = () => {
        const t = tagInput.trim().replace(/^#/, "");
        if (!t || tags.includes(t) || tags.length >= 10) return;
        setTags([...tags, t]);
        setTagInput("");
    };

    const handleSubmit = () => {
        if (!title.trim()) {
            alert("제목을 입력해주세요.");
            return;
        }
        if (!content.trim()) {
            alert("내용을 입력해주세요.");
            return;
        }
        if (postAsAnonymous && (!guestNick.trim() || !guestPwd.trim())) {
            alert("익명 작성 시 닉네임과 비밀번호를 입력해주세요.");
            return;
        }
        setSubmitting(true);
        // TODO: 실제 API 연동은 다음 세션
        setTimeout(() => {
            setSubmitting(false);
            alert("게시글이 등록되었습니다 (더미 동작). 다음 세션에서 DB 연동 예정.");
            router.push(`/board/${boardSlug}`);
        }, 600);
    };

    return (
        <main className="flex-1 bg-surface-container-low">
            <div className="max-w-[900px] mx-auto px-4 lg:px-6 py-6">
                {/* 브레드크럼 */}
                <nav className="text-meta text-on-surface-variant mb-3">
                    <Link href="/" className="hover:text-primary">홈</Link>
                    <span className="mx-1">›</span>
                    <Link href={`/board/${boardSlug}`} className="hover:text-primary">{meta.name}</Link>
                    <span className="mx-1">›</span>
                    <span>글쓰기</span>
                </nav>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-md p-5 lg:p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <h1 className="text-h2">새 게시글</h1>
                        <div className="ml-auto flex items-center gap-1 text-meta text-on-surface-variant">
                            <Info className="w-3.5 h-3.5" />
                            게시판 가이드라인을 준수해주세요.
                        </div>
                    </div>

                    {/* 게시판 / 카테고리 선택 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className="text-label-bold text-on-surface-variant block mb-1">게시판</label>
                            <select
                                value={boardSlug}
                                onChange={(e) => {
                                    const newSlug = e.target.value as BoardSlug;
                                    setBoardSlug(newSlug);
                                    setCategory(BOARD_META[newSlug].categories[1]);
                                }}
                                className="w-full bg-surface-container-lowest border border-outline-variant rounded-md text-body-sm px-3 py-2 focus:outline-none focus:border-primary"
                            >
                                {VALID_SLUGS.map((s) => (
                                    <option key={s} value={s}>
                                        {BOARD_META[s].emoji} {BOARD_META[s].name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-label-bold text-on-surface-variant block mb-1">카테고리</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-surface-container-lowest border border-outline-variant rounded-md text-body-sm px-3 py-2 focus:outline-none focus:border-primary"
                            >
                                {meta.categories.filter((c) => c !== "전체").map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 익명 작성 정보 */}
                    {postAsAnonymous && (
                        <div className="bg-surface-container-low border border-outline-variant rounded-md p-3 mb-4">
                            <div className="text-meta text-on-surface-variant mb-2">
                                ※ 비밀번호는 수정·삭제 시 사용됩니다. 분실 시 복구 불가.
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    placeholder="닉네임"
                                    value={guestNick}
                                    onChange={(e) => setGuestNick(e.target.value)}
                                    maxLength={12}
                                    className="border border-outline-variant rounded text-body-sm px-3 py-2 focus:outline-none focus:border-primary"
                                />
                                <input
                                    type="password"
                                    placeholder="비밀번호 (4자 이상)"
                                    value={guestPwd}
                                    onChange={(e) => setGuestPwd(e.target.value)}
                                    minLength={4}
                                    className="border border-outline-variant rounded text-body-sm px-3 py-2 focus:outline-none focus:border-primary"
                                />
                            </div>
                        </div>
                    )}

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
                        <BlogEditor content="" onChange={setContent} />
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

                    {/* 옵션 */}
                    <div className="flex items-center gap-4 mb-6 text-body-sm">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={postAsAnonymous}
                                onChange={(e) => setPostAsAnonymous(e.target.checked)}
                            />
                            익명으로 작성
                        </label>
                    </div>

                    {/* 버튼 */}
                    <div className="flex justify-end gap-2 border-t border-outline-variant pt-4">
                        <Link
                            href={`/board/${boardSlug}`}
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
                            {submitting ? "등록 중..." : "등록"}
                        </button>
                    </div>
                </div>
            </div>
            <FooterSection />
        </main>
    );
}
