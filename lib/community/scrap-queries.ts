// 게시글 스크랩 토글 클라이언트 fetch 래퍼 (Task 9)
// POST /api/community/scrap 호출 → { scrapped: boolean } 또는 에러 객체 반환

export async function toggleScrap(
  postId: string
): Promise<{ scrapped: boolean } | { error: string; status: number }> {
  const res = await fetch("/api/community/scrap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postId }),
  });
  if (res.ok) return (await res.json()) as { scrapped: boolean };
  const data = await res.json().catch(() => ({}));
  return { error: (data as { error?: string }).error ?? "오류", status: res.status };
}
