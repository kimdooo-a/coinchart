import Link from "next/link";
import SidebarWidget from "../SidebarWidget";
import { cn } from "@/lib/utils";

export interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  href?: string; // 코인룸 또는 차트분석으로
}

interface PriceTickerWidgetProps {
  title?: string;
  items: TickerItem[];
}

export default function PriceTickerWidget({
  title = "실시간 시세",
  items,
}: PriceTickerWidgetProps) {
  return (
    <SidebarWidget title={title} noPadding>
      <ul className="divide-y divide-outline-variant">
        {items.map((it) => {
          const isUp = it.changePct >= 0;
          const trendColor = isUp ? "text-[var(--color-kr-up)]" : "text-[var(--color-kr-down)]";
          const Inner = (
            <li className="grid grid-cols-[1fr_auto_60px] gap-2 items-center px-3 py-2 hover:bg-surface-container-low transition-colors">
              <div className="min-w-0">
                <div className="text-body-sm font-bold truncate">{it.symbol}</div>
                <div className="text-meta text-on-surface-variant truncate">{it.name}</div>
              </div>
              <div className="text-body-sm tabular-nums text-right">
                ${formatPrice(it.price)}
              </div>
              <div className={cn("text-meta font-bold tabular-nums text-right", trendColor)}>
                {isUp ? "▲" : "▼"} {Math.abs(it.changePct).toFixed(2)}%
              </div>
            </li>
          );

          return it.href ? (
            <Link key={it.symbol} href={it.href}>
              {Inner}
            </Link>
          ) : (
            <div key={it.symbol}>{Inner}</div>
          );
        })}
      </ul>
    </SidebarWidget>
  );
}

function formatPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}
