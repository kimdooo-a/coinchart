"use client";

import { motion } from "framer-motion";
import { Shield, Zap, RefreshCw } from "lucide-react";

export default function AboutSection() {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full bg-black/50 -z-10" />

            <div className="container mx-auto px-4 md:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-6">
                        우리의 미션과 가치
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        개인 투자자들에게도 기관 수준의 데이터와 분석 도구를 제공하여,
                        투명하고 현명한 암호화폐 투자 문화를 만들어갑니다.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: <Shield className="w-8 h-8 text-blue-400" />,
                            title: "투명한 데이터",
                            description: "실시간 시장 데이터와 검증된 지표만을 사용하여, 왜곡 없는 정확한 시장 상황을 전달합니다."
                        },
                        {
                            icon: <Zap className="w-8 h-8 text-yellow-400" />,
                            title: "초고속 분석",
                            description: "복잡한 시장 패턴을 프랙탈 엔진으로 실시간 분석하여, 누구보다 빠른 의사결정을 지원합니다."
                        },
                        {
                            icon: <RefreshCw className="w-8 h-8 text-green-400" />,
                            title: "지속적인 혁신",
                            description: "AI 기반 예측 모델과 사용자 피드백을 통해 서비스를 끊임없이 발전시킵니다."
                        }
                    ].map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors"
                        >
                            <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                                {item.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                            <p className="text-gray-400 leading-relaxed">
                                {item.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
