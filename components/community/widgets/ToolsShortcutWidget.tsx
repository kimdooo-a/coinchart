import Link from "next/link";
import { LineChart, Bell, Activity, Calendar } from "lucide-react";
import SidebarWidget from "../SidebarWidget";

const TOOLS = [
  { label: "차트분석", href: "/analysis", icon: LineChart },
  { label: "AI시그널", href: "/signal", icon: Bell },
  { label: "마켓무드", href: "/market", icon: Activity },
  { label: "캘린더", href: "/calendar", icon: Calendar },
];

export default function ToolsShortcutWidget() {
  return (
    <SidebarWidget title="🛠 도구 바로가기">
      <div className="grid grid-cols-2 gap-2">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="flex flex-col items-center gap-1 p-3 rounded-md border border-outline-variant hover:border-primary hover:bg-primary-fixed transition-colors group"
          >
            <tool.icon className="w-5 h-5 text-on-surface-variant group-hover:text-primary" />
            <span className="text-meta text-on-surface group-hover:text-primary font-bold">
              {tool.label}
            </span>
          </Link>
        ))}
      </div>
    </SidebarWidget>
  );
}
