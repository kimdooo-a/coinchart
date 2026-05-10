"use client";

import Link from "next/link";
import { BarChart2, Github, Twitter, Mail } from "lucide-react";

export default function FooterSection() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-surface-container border-t border-outline-variant pt-12 pb-8">
            <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
                    {/* Brand */}
                    <div className="col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-3">
                            <div className="size-8 rounded-md bg-primary flex items-center justify-center text-on-primary">
                                <BarChart2 className="size-5" />
                            </div>
                            <span className="text-h2 text-primary tracking-tight">ChartMaster Community</span>
                        </Link>
                        <p className="text-body-sm text-on-surface-variant max-w-sm">
                            한국 투자자를 위한 코인·주식 정보 공유 커뮤니티.<br />
                            자유 토론, 큐레이션 뉴스, 코인별 토론룸이 한 자리에.
                        </p>
                    </div>

                    {/* 커뮤니티 */}
                    <div>
                        <h4 className="text-body-base font-bold text-on-surface mb-3">커뮤니티</h4>
                        <ul className="space-y-2 text-body-sm text-on-surface-variant">
                            <li><Link href="/board/free" className="hover:text-primary transition-colors">자유게시판</Link></li>
                            <li><Link href="/board/market" className="hover:text-primary transition-colors">시세토론</Link></li>
                            <li><Link href="/board/info" className="hover:text-primary transition-colors">정보공유</Link></li>
                            <li><Link href="/news" className="hover:text-primary transition-colors">뉴스</Link></li>
                            <li><Link href="/blog" className="hover:text-primary transition-colors">공식글</Link></li>
                        </ul>
                    </div>

                    {/* 정보 */}
                    <div>
                        <h4 className="text-body-base font-bold text-on-surface mb-3">정보</h4>
                        <ul className="space-y-2 text-body-sm text-on-surface-variant">
                            <li><Link href="/terms" className="hover:text-primary transition-colors">이용약관</Link></li>
                            <li><Link href="/privacy" className="hover:text-primary transition-colors">개인정보처리방침</Link></li>
                            <li><Link href="/contact" className="hover:text-primary transition-colors">문의하기</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-outline-variant pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <p className="text-meta text-on-surface-variant">
                        © {currentYear} ChartMaster Community. All rights reserved.
                        <span className="block mt-1 md:inline md:mt-0 md:ml-3 text-outline">
                            * 본 사이트의 모든 정보는 투자 권유가 아니며, 투자 결과의 책임은 본인에게 있습니다.
                        </span>
                    </p>

                    <div className="flex items-center gap-3">
                        <Link href="#" className="text-on-surface-variant hover:text-primary transition-colors" aria-label="GitHub">
                            <Github className="w-4 h-4" />
                        </Link>
                        <Link href="#" className="text-on-surface-variant hover:text-primary transition-colors" aria-label="Twitter">
                            <Twitter className="w-4 h-4" />
                        </Link>
                        <Link href="#" className="text-on-surface-variant hover:text-primary transition-colors" aria-label="Mail">
                            <Mail className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
