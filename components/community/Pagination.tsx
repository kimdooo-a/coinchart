"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** 같은 라우트의 쿼리스트링 변경용 베이스 URL (예: /board/free?page=) */
  baseHref?: string;
  /** 클릭 핸들러 (baseHref가 없을 때 사용) */
  onPageChange?: (page: number) => void;
  className?: string;
}

const VISIBLE = 10;

export default function Pagination({
  currentPage,
  totalPages,
  baseHref,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const blockStart = Math.floor((currentPage - 1) / VISIBLE) * VISIBLE + 1;
  const blockEnd = Math.min(blockStart + VISIBLE - 1, totalPages);

  const renderItem = (page: number, label: React.ReactNode, isActive = false, disabled = false) => {
    const className = cn(
      "min-w-8 h-8 px-2 inline-flex items-center justify-center text-body-sm rounded transition-colors",
      isActive
        ? "text-primary font-bold bg-surface-container"
        : disabled
        ? "text-outline-variant cursor-not-allowed"
        : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
    );

    if (disabled) {
      return (
        <span key={`disabled-${page}-${typeof label === "string" ? label : "icon"}`} className={className}>
          {label}
        </span>
      );
    }

    if (baseHref) {
      return (
        <Link key={page} href={`${baseHref}${page}`} className={className} aria-current={isActive ? "page" : undefined}>
          {label}
        </Link>
      );
    }

    return (
      <button
        key={page}
        type="button"
        onClick={() => onPageChange?.(page)}
        className={className}
        aria-current={isActive ? "page" : undefined}
      >
        {label}
      </button>
    );
  };

  const items: React.ReactNode[] = [];

  // 이전 블록
  if (blockStart > 1) {
    items.push(renderItem(blockStart - 1, <ChevronLeft className="w-4 h-4" />));
  } else {
    items.push(renderItem(1, <ChevronLeft className="w-4 h-4" />, false, true));
  }

  // 숫자
  for (let p = blockStart; p <= blockEnd; p++) {
    items.push(renderItem(p, p, p === currentPage));
  }

  // 다음 블록
  if (blockEnd < totalPages) {
    items.push(renderItem(blockEnd + 1, <ChevronRight className="w-4 h-4" />));
  } else {
    items.push(renderItem(totalPages, <ChevronRight className="w-4 h-4" />, false, true));
  }

  return (
    <nav className={cn("flex items-center justify-center gap-1", className)} aria-label="페이지 이동">
      {items}
    </nav>
  );
}
