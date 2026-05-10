import Link from "next/link";
import { cn } from "@/lib/utils";

interface SidebarWidgetProps {
  title: string;
  /** 우측 상단 "더보기" 링크 */
  moreHref?: string;
  moreLabel?: string;
  /** 우측 상단 커스텀 액션 (moreHref와 배타) */
  action?: React.ReactNode;
  /** 본문 패딩 제거 (테이블·리스트가 좌우 끝까지 가도록) */
  noPadding?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function SidebarWidget({
  title,
  moreHref,
  moreLabel = "더보기",
  action,
  noPadding = false,
  children,
  className,
}: SidebarWidgetProps) {
  return (
    <section
      className={cn(
        "bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden",
        className
      )}
    >
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-outline-variant">
        <h3 className="text-body-sm font-bold text-on-surface">{title}</h3>
        {moreHref ? (
          <Link
            href={moreHref}
            className="text-meta text-on-surface-variant hover:text-primary transition-colors"
          >
            {moreLabel} ›
          </Link>
        ) : (
          action
        )}
      </header>
      <div className={cn(!noPadding && "p-3")}>{children}</div>
    </section>
  );
}
