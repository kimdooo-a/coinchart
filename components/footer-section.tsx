"use client";

import Link from "next/link";
import { BarChart2, Github, Twitter, Mail } from "lucide-react";

export default function FooterSection() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-black border-t border-white/10 pt-16 pb-8">
            <div className="container mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="size-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
                                <BarChart2 className="size-5" />
                            </div>
                            <span className="text-white font-bold text-xl">사랑하는 마누라</span>
                        </Link>
                        <p className="text-gray-500 max-w-sm">
                            성공적인 암호화폐 투자를 위한 최고의 파트너.<br />
                            데이터에 기반한 객관적인 분석을 경험하세요.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="text-white font-bold mb-4">플랫폼</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href="/market" className="hover:text-white transition-colors">시장 개요</Link></li>
                            <li><Link href="/portfolio" className="hover:text-white transition-colors">포트폴리오</Link></li>
                            <li><Link href="/signal" className="hover:text-white transition-colors">AI 시그널</Link></li>
                            <li><Link href="/history" className="hover:text-white transition-colors">코인 히스토리</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-white font-bold mb-4">정보</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href="/terms" className="hover:text-white transition-colors">이용약관</Link></li>
                            <li><Link href="/terms" className="hover:text-white transition-colors">개인정보처리방침</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition-colors">문의하기</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-gray-600">
                        © {currentYear} 사랑하는 마누라. All rights reserved.
                        <span className="block mt-1 md:inline md:mt-0 md:ml-4 text-gray-700">
                            * 본 사이트의 정보는 투자 조언이 아니며, 투자 결과에 대한 책임은 본인에게 있습니다.
                        </span>
                    </p>

                    <div className="flex items-center gap-4">
                        <Link href="#" className="text-gray-500 hover:text-white transition-colors">
                            <Github className="w-5 h-5" />
                        </Link>
                        <Link href="#" className="text-gray-500 hover:text-white transition-colors">
                            <Twitter className="w-5 h-5" />
                        </Link>
                        <Link href="#" className="text-gray-500 hover:text-white transition-colors">
                            <Mail className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
