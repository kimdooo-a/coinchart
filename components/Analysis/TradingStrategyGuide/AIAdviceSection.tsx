'use client';

import React from 'react';

// AI 요약 박스 — getAIAdvice 결과(title/desc/color)를 받아 렌더한다.
// 상태/계산 로직은 부모에 있고, 결과 객체만 props로 전달받는다.
interface AIAdvice {
    title: string;
    desc: string;
    color: string;
}

interface Props {
    aiAdvice: AIAdvice;
}

export const AIAdviceSection: React.FC<Props> = ({ aiAdvice }) => {
    return (
        <div className={`p-5 border-b border-outline-variant ${aiAdvice.color}`}>
            <h3 className="text-lg md:text-xl font-bold mb-1 flex items-center gap-2">
                {aiAdvice.title}
            </h3>
            <p className="text-sm md:text-base opacity-90 leading-relaxed">
                {aiAdvice.desc}
            </p>
        </div>
    );
};
