"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export interface TabItem {
  key: string;
  label: string;
  href?: string;
  count?: number;
}

interface CommunityTabsProps {
  items: TabItem[];
  activeKey: string;
  onChange?: (key: string) => void;
  className?: string;
  variant?: "underline" | "pill";
}

export default function CommunityTabs({
  items,
  activeKey,
  onChange,
  className,
  variant = "underline",
}: CommunityTabsProps) {
  return (
    <nav
      className={cn(
        "flex items-center gap-6 border-b border-outline-variant",
        className
      )}
      role="tablist"
    >
      {items.map((tab) => {
        const isActive = tab.key === activeKey;
        const baseClass = cn(
          "py-3 text-body-base transition-colors cursor-pointer whitespace-nowrap",
          variant === "underline" &&
            (isActive
              ? "text-primary font-bold border-b-2 border-primary -mb-px"
              : "text-on-surface-variant hover:text-primary"),
          variant === "pill" &&
            (isActive
              ? "bg-primary text-on-primary px-3 rounded"
              : "text-on-surface-variant hover:bg-surface-container px-3 rounded")
        );

        const content = (
          <>
            {tab.label}
            {typeof tab.count === "number" && (
              <span
                className={cn(
                  "ml-1 text-meta",
                  isActive ? "text-primary" : "text-on-surface-variant"
                )}
              >
                {tab.count.toLocaleString()}
              </span>
            )}
          </>
        );

        if (tab.href) {
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={baseClass}
              role="tab"
              aria-selected={isActive}
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange?.(tab.key)}
            className={baseClass}
            role="tab"
            aria-selected={isActive}
          >
            {content}
          </button>
        );
      })}
    </nav>
  );
}
