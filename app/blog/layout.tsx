import type { Metadata } from 'next';

// 블로그 공통 메타데이터 (하위 페이지 generateMetadata와 자동 병합)
export const metadata: Metadata = {
  openGraph: {
    siteName: 'ChartMaster',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
