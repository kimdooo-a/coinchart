import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "hot"
  | "new"
  | "notice"
  | "positive"
  | "negative"
  | "mixed"
  | "neutral"
  | "primary"
  | "secondary"
  | "outline";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  hot: "bg-[var(--color-hot)] text-white",
  new: "bg-[var(--color-new)] text-white",
  notice: "bg-[var(--color-notice)] text-on-surface",
  positive: "bg-[var(--color-positive)] text-white",
  negative: "bg-[var(--color-negative)] text-white",
  mixed: "bg-[var(--color-mixed)] text-white",
  neutral: "bg-surface-container text-on-surface-variant",
  primary: "bg-primary text-on-primary",
  secondary: "bg-secondary text-on-secondary",
  outline: "border border-outline-variant text-on-surface-variant bg-transparent",
};

interface CommunityBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export default function CommunityBadge({
  variant = "neutral",
  children,
  className,
}: CommunityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded-sm font-label-bold text-label-bold whitespace-nowrap",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
