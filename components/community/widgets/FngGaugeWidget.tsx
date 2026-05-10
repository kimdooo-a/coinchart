import SidebarWidget from "../SidebarWidget";
import { cn } from "@/lib/utils";

interface FngGaugeWidgetProps {
  /** 0~100 */
  value: number;
  /** "Greed", "Fear" 등 라벨 */
  label?: string;
  /** 어제 값 (변동 표시용) */
  prevValue?: number;
}

const FNG_LEVELS = [
  { max: 25, label: "극단적 공포", labelEn: "Extreme Fear", color: "#1A6FCC" },
  { max: 45, label: "공포", labelEn: "Fear", color: "#3B82F6" },
  { max: 55, label: "중립", labelEn: "Neutral", color: "#9CA3AF" },
  { max: 75, label: "탐욕", labelEn: "Greed", color: "#FB923C" },
  { max: 100, label: "극단적 탐욕", labelEn: "Extreme Greed", color: "#BA1A1A" },
];

export default function FngGaugeWidget({ value, label, prevValue }: FngGaugeWidgetProps) {
  const v = Math.max(0, Math.min(100, value));
  const level = FNG_LEVELS.find((l) => v <= l.max) ?? FNG_LEVELS[FNG_LEVELS.length - 1];
  const angle = (v / 100) * 180; // 반원
  const delta = prevValue !== undefined ? v - prevValue : null;

  return (
    <SidebarWidget title="공포·탐욕 지수">
      <div className="flex flex-col items-center py-2">
        {/* 반원 게이지 (SVG) */}
        <svg viewBox="0 0 200 110" className="w-full max-w-[220px] h-auto">
          {/* 배경 */}
          <path
            d="M 10 100 A 90 90 0 0 1 190 100"
            fill="none"
            stroke="var(--color-surface-container-high)"
            strokeWidth="14"
          />
          {/* 진행 */}
          <path
            d="M 10 100 A 90 90 0 0 1 190 100"
            fill="none"
            stroke={level.color}
            strokeWidth="14"
            strokeDasharray={`${(angle / 180) * Math.PI * 90} 999`}
            strokeLinecap="round"
          />
          {/* 값 */}
          <text
            x="100"
            y="85"
            textAnchor="middle"
            className="fill-on-surface"
            fontSize="36"
            fontWeight="800"
          >
            {v}
          </text>
        </svg>

        <div className="text-body-sm font-bold" style={{ color: level.color }}>
          {label ?? level.label} <span className="text-meta text-on-surface-variant">({level.labelEn})</span>
        </div>

        {delta !== null && (
          <div
            className={cn(
              "text-meta mt-1 tabular-nums",
              delta > 0 ? "text-[var(--color-kr-up)]" : delta < 0 ? "text-[var(--color-kr-down)]" : "text-on-surface-variant"
            )}
          >
            어제 대비 {delta > 0 ? "+" : ""}
            {delta}
          </div>
        )}
      </div>
    </SidebarWidget>
  );
}
