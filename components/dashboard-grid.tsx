"use client";

import { type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { TRANSLATIONS } from "@/lib/translations";

interface DashboardCardProps {
    title: string;
    description: string;
    content: ReactNode;
    colSpan?: "lg:col-span-2" | "lg:col-span-3" | "lg:col-span-4" | "lg:col-span-6";
    maxHeight?: string;
    href?: string;
}

interface DashboardGridProps {
    className?: string;
}

function DashboardCard({
    title,
    description,
    content,
    colSpan = "lg:col-span-3",
    maxHeight,
    href,
}: DashboardCardProps) {
    const CardContent = (
        <div
            className={cn(
                "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-border py-6 shadow-sm justify-between h-full overflow-hidden hover:bg-muted/50 transition-colors",
                "group-hover:border-primary/50 group-hover:shadow-md"
            )}
            data-slot="card"
        >
            {content}
            <div className="flex flex-col px-6 gap-1.5" data-slot="card-header">
                <div className="text-xl leading-tight font-semibold group-hover:text-primary transition-colors">{title}</div>
                <p className="text-muted-foreground/70 text-sm group-hover:text-muted-foreground">{description}</p>
            </div>
        </div>
    );

    const ContainerClass = cn(
        "md:p-1.5 bg-muted border border-border shadow-md rounded-[1.4rem] ring-inset *:first:border *:first:border-border *:first:rounded-[1.0rem] w-full h-full overflow-hidden transition-all duration-300 hover:shadow-lg p-1.5 group cursor-pointer",
        colSpan,
        maxHeight
    );

    if (href) {
        return (
            <Link href={href} className={ContainerClass}>
                {CardContent}
            </Link>
        )
    }

    return (
        <div
            className={ContainerClass}
        >
            {CardContent}
        </div>
    );
}

// Glass Icon Component
function GlassIcon({
    icon: Icon,
    gradientFrom,
    gradientTo,
    glowColor
}: {
    icon: any,
    gradientFrom: string,
    gradientTo: string,
    glowColor: string
}) {
    return (
        <div className="relative group/icon">
            <div className={cn(
                "absolute inset-0 rounded-2xl blur-xl opacity-40 transition-all duration-500 group-hover/icon:opacity-60",
                glowColor
            )} />
            <div className={cn(
                "relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-md shadow-xl transition-all duration-500 group-hover/icon:scale-110 group-hover/icon:-translate-y-1",
                "bg-gradient-to-br from-white/10 to-transparent"
            )}>
                <div className={cn(
                    "absolute inset-0 rounded-2xl opacity-20",
                    `bg-gradient-to-br ${gradientFrom} ${gradientTo}`
                )} />
                <Icon className="w-10 h-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" strokeWidth={1.5} />
            </div>
        </div>
    );
}

import { Activity, Siren, Newspaper, BarChart2, Landmark, History, Calendar, Briefcase } from "lucide-react";

export default function DashboardGrid({
    className,
}: DashboardGridProps) {
    const { lang } = useLanguage();
    const t = TRANSLATIONS[lang];

    const cards: DashboardCardProps[] = [
        {
            title: t.cards.analysis.title,
            description: t.cards.analysis.desc,
            href: "/analysis",
            colSpan: "lg:col-span-3",
            content: (
                <div className="relative flex-1 min-h-[160px] flex items-center justify-center overflow-hidden bg-black/20">
                    <GlassIcon
                        icon={BarChart2}
                        gradientFrom="from-purple-500"
                        gradientTo="to-pink-500"
                        glowColor="bg-purple-500"
                    />
                </div>
            )
        },
        {
            title: t.cards.stock.title,
            description: t.cards.stock.desc,
            href: "/stock",
            colSpan: "lg:col-span-3",
            content: (
                <div className="relative flex-1 min-h-[160px] flex items-center justify-center overflow-hidden bg-black/20">
                    <GlassIcon
                        icon={Landmark}
                        gradientFrom="from-indigo-500"
                        gradientTo="to-violet-500"
                        glowColor="bg-indigo-500"
                    />
                </div>
            )
        },
        {
            title: t.cards.market.title,
            description: t.cards.market.desc,
            href: "/market",
            colSpan: "lg:col-span-2",
            content: (
                <div className="relative flex-1 min-h-[160px] flex items-center justify-center overflow-hidden bg-black/20">
                    <GlassIcon
                        icon={Activity}
                        gradientFrom="from-green-500"
                        gradientTo="to-emerald-500"
                        glowColor="bg-green-500"
                    />
                </div>
            )
        },
        {
            title: t.cards.signal.title,
            description: t.cards.signal.desc,
            href: "/signal",
            colSpan: "lg:col-span-2",
            content: (
                <div className="relative flex-1 min-h-[160px] flex items-center justify-center overflow-hidden bg-black/20">
                    <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
                    <GlassIcon
                        icon={Siren}
                        gradientFrom="from-red-500"
                        gradientTo="to-orange-500"
                        glowColor="bg-red-500"
                    />
                </div>
            )
        },
        {
            title: t.cards.news.title,
            description: t.cards.news.desc,
            href: "/news",
            colSpan: "lg:col-span-2",
            content: (
                <div className="relative flex-1 min-h-[160px] flex items-center justify-center overflow-hidden bg-black/20">
                    <GlassIcon
                        icon={Newspaper}
                        gradientFrom="from-blue-500"
                        gradientTo="to-cyan-500"
                        glowColor="bg-blue-500"
                    />
                </div>
            )
        },
        {
            title: t.cards.history.title,
            description: t.cards.history.desc,
            href: "/history",
            colSpan: "lg:col-span-2",
            content: (
                <div className="relative flex-1 min-h-[160px] flex items-center justify-center overflow-hidden bg-black/20">
                    <GlassIcon
                        icon={History}
                        gradientFrom="from-amber-500"
                        gradientTo="to-orange-500"
                        glowColor="bg-amber-500"
                    />
                </div>
            )
        },
        {
            title: t.cards.calendar.title,
            description: t.cards.calendar.desc,
            href: "/calendar",
            colSpan: "lg:col-span-2",
            content: (
                <div className="relative flex-1 min-h-[160px] flex items-center justify-center overflow-hidden bg-black/20">
                    <GlassIcon
                        icon={Calendar}
                        gradientFrom="from-violet-500"
                        gradientTo="to-fuchsia-500"
                        glowColor="bg-violet-500"
                    />
                </div>
            )
        },
        {
            title: t.cards.portfolio?.title || "Portfolio",
            description: t.cards.portfolio?.desc || "Manage assets",
            href: "/portfolio",
            colSpan: "lg:col-span-2",
            content: (
                <div className="relative flex-1 min-h-[160px] flex items-center justify-center overflow-hidden bg-black/20">
                    <GlassIcon
                        icon={Briefcase}
                        gradientFrom="from-sky-500"
                        gradientTo="to-blue-500"
                        glowColor="bg-sky-500"
                    />
                </div>
            )
        },
    ];

    return (
        <section
            className={cn("relative mt-20 px-3 md:px-0", className)}
            id="dashboard-grid"
        >
            {/* Header */}
            <div className="container z-10 mx-auto mb-10 mt-10 flex w-full flex-col gap-y-2 text-center sm:mb-10 sm:mt-12">
                <Badge
                    variant="outline"
                    className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs w-fit whitespace-nowrap shrink-0 gap-1 max-w-xs self-center opacity-80 bg-background"
                >
                    {t.dashboard.badge}
                </Badge>
                <h2 className="relative mx-auto inline-flex max-w-3xl gap-x-2 text-center text-4xl font-bold leading-none tracking-normal md:text-5xl md:tracking-tight">
                    {t.dashboard.title}
                </h2>
                <p className="text-xs md:text-md mx-auto mt-2 max-w-4xl leading-tight text-muted-foreground/90 md:px-24">
                    {t.dashboard.subtitle}
                </p>
            </div>

            {/* Background Gradient */}
            <div className="relative">
                <div
                    aria-hidden="true"
                    className="absolute left-1/2 -translate-x-1/2 top-0 z-[-5] pointer-events-none"
                >
                    <div className="aspect-video rounded-full bg-gradient-to-tl blur-[100px] from-primary/20 to-orange-600/10 opacity-50 h-[718px] w-[855px]"></div>
                </div>

                {/* Cards Grid */}
                <div className="relative z-1 flex flex-col items-center justify-center max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 gap-4 md:gap-2 lg:grid-cols-6 w-full">
                        {cards.map((card, index) => (
                            <DashboardCard key={index} {...card} />
                        ))}
                    </div>
                </div>

                {/* Disclaimer */}
                {t.dashboard.disclaimer && (
                    <div className="mx-auto mt-4 flex max-w-md md:max-w-xl items-start justify-center gap-x-1 text-center text-xs text-muted-foreground/40 md:[&_p]:text-xxs [&_p]:text-[8px]">
                        <p>{t.dashboard.disclaimer}</p>
                    </div>
                )}
            </div>
        </section>
    );
}
