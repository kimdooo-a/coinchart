import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import GlobalHeader from "@/components/global-header";
import JsonLd from "@/components/seo/JsonLd";
import { generateWebsiteJsonLd } from "@/lib/seo/json-ld";
import { getSiteUrl } from "@/lib/blog-utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "ChartMaster - AI Crypto & Stock Analysis",
    template: "%s | ChartMaster",
  },
  description: "AI 기반 암호화폐/주식 시장 분석 플랫폼",
  openGraph: {
    siteName: "ChartMaster",
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden`}
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
