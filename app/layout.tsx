import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import GlobalHeader from "@/components/global-header";
import JsonLd from "@/components/seo/JsonLd";
import { generateWebsiteJsonLd } from "@/lib/seo/json-ld";
import { getSiteUrl } from "@/lib/blog-utils";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "ChartMaster Community - 코인·주식 정보 공유",
    template: "%s | ChartMaster",
  },
  description: "한국 투자자를 위한 코인·주식 정보 공유 커뮤니티. 자유 토론, 큐레이션 뉴스, 코인별 토론룸.",
  openGraph: {
    siteName: "ChartMaster Community",
    locale: "ko_KR",
  },
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${notoSansKr.variable} antialiased min-h-screen flex flex-col bg-surface-container-lowest text-on-surface overflow-x-hidden`}
      >
        <JsonLd data={generateWebsiteJsonLd()} />
        <LanguageProvider>
          <GlobalHeader />
          <div className="flex-1 w-full flex flex-col">
            {children}
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
