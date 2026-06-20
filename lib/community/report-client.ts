export type ReportReason = "spam" | "abuse" | "sexual" | "fraud" | "etc";
export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: "스팸/광고", abuse: "욕설/비방", sexual: "음란물", fraud: "사기/허위", etc: "기타",
};
export async function submitReport(input: {
  targetType: "post" | "comment"; targetId: string; reason: ReportReason; detail?: string;
}): Promise<{ ok: boolean; status: number; error?: string }> {
  const res = await fetch("/api/community/report", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  });
  if (res.ok) return { ok: true, status: res.status };
  const data = await res.json().catch(() => ({}));
  return { ok: false, status: res.status, error: data.error };
}
