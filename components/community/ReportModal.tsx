"use client";

// 신고 모달 — 게시글·댓글 공용 (Task 8)
// props: open, targetType, targetId, onClose
// 접근성: role="dialog", aria-modal, ESC 닫기, 라디오 그룹

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  REPORT_REASON_LABELS,
  submitReport,
  type ReportReason,
} from "@/lib/community/report-client";

interface ReportModalProps {
  open: boolean;
  targetType: "post" | "comment";
  targetId: string;
  onClose: () => void;
}

export default function ReportModal({
  open,
  targetType,
  targetId,
  onClose,
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason>("spam");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // 언마운트 시 타이머 cleanup
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // 상태 초기화는 닫기 핸들러에서 처리 (setter는 안정적이므로 deps는 onClose만)
  const handleClose = useCallback(() => {
    setReason("spam");
    setDetail("");
    setBusy(false);
    setMessage(null);
    onClose();
  }, [onClose]);

  // ESC 닫기 (상태 리셋을 위해 handleClose 경유)
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, handleClose]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    const result = await submitReport({ targetType, targetId, reason, detail: detail.trim() || undefined });
    setBusy(false);
    if (result.ok) {
      setMessage({ text: "신고가 접수되었습니다. 검토 후 처리됩니다.", isError: false });
      timerRef.current = setTimeout(handleClose, 1500);
    } else if (result.status === 409) {
      setMessage({ text: "이미 신고한 콘텐츠입니다.", isError: true });
    } else {
      setMessage({ text: result.error ?? "신고 처리에 실패했습니다.", isError: true });
    }
  };

  const reasonKeys = Object.keys(REPORT_REASON_LABELS) as ReportReason[];

  return (
    /* 백드롭 */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      {/* 다이얼로그 */}
      <div
        role="dialog"
        aria-modal={true}
        aria-labelledby="report-modal-title"
        className="bg-surface border border-outline-variant rounded-md w-full max-w-md mx-4 p-5 shadow-xl"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h2 id="report-modal-title" className="text-body-base font-bold text-on-surface">
            신고하기
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="닫기"
            className="p-1 rounded hover:bg-surface-container text-on-surface-variant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 사유 라디오 */}
        <fieldset className="mb-4">
          <legend className="text-body-sm font-bold text-on-surface mb-2">신고 사유</legend>
          <div className="space-y-2">
            {reasonKeys.map((key) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer text-body-sm text-on-surface">
                <input
                  type="radio"
                  name="report-reason"
                  value={key}
                  checked={reason === key}
                  onChange={() => setReason(key)}
                  className="accent-primary"
                />
                {REPORT_REASON_LABELS[key]}
              </label>
            ))}
          </div>
        </fieldset>

        {/* 상세 내용 */}
        <div className="mb-4">
          <label htmlFor="report-detail" className="text-body-sm font-bold text-on-surface block mb-1">
            상세 내용 <span className="text-on-surface-variant font-normal">(선택)</span>
          </label>
          <textarea
            id="report-detail"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="신고 사유를 자세히 적어주세요..."
            className="w-full border border-outline-variant rounded text-body-sm px-2 py-1.5 focus:outline-none focus:border-primary bg-transparent resize-none"
          />
          <span className="text-meta text-on-surface-variant">{detail.length}/500</span>
        </div>

        {/* 피드백 메시지 */}
        {message && (
          <p className={`text-body-sm mb-3 ${message.isError ? "text-error" : "text-[var(--color-positive)]"}`}>
            {message.text}
          </p>
        )}

        {/* 액션 버튼 */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="text-label-bold px-4 py-1.5 rounded-md border border-outline-variant hover:bg-surface-container text-on-surface-variant"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="bg-primary text-on-primary text-label-bold px-4 py-1.5 rounded-md hover:bg-primary-container disabled:opacity-50"
          >
            {busy ? "신고 중..." : "신고"}
          </button>
        </div>
      </div>
    </div>
  );
}
