import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export const Disclaimer = () => {
    const { lang } = useLanguage();

    return (
        <div className="w-full max-w-7xl mx-auto my-8 px-4 md:px-0">
            <div className="bg-yellow-900/10 border border-yellow-700/30 rounded-lg p-4 flex flex-col md:flex-row items-start font-mono text-xs text-yellow-600/80 gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                    {lang === 'ko' ? (
                        <>
                            <p className="font-bold">투자 유의사항 (Disclaimer)</p>
                            <p>
                                본 서비스에서 제공하는 모든 콘텐츠(차트 분석, 시스템 백테스트, AI 진단, 뉴스 등)는 투자 판단을 위한 참고 자료일 뿐이며, 투자의 최종 책임은 이용자 본인에게 있습니다.
                                <br />
                                과거의 데이터나 수익률이 미래의 결과를 보장하지 않습니다. 암호화폐 및 주식 투자는 원금 손실의 위험이 있으므로 신중하게 결정하시기 바랍니다.
                                <br />
                                제공되는 데이터는 실시간성과 정확성을 보장하지 않으며, 시스템 오류나 지연이 발생할 수 있습니다.
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="font-bold">Disclaimer</p>
                            <p>
                                All content provided by this service (chart analysis, system backtest, AI diagnosis, news, etc.) is for reference only. The final responsibility for investment decisions lies with the user.
                                <br />
                                Past performance does not guarantee future results. Cryptocurrency and stock investments carry risks of capital loss, so please make decisions carefully.
                                <br />
                                Data provided is not guaranteed to be real-time or accurate, and system errors or delays may occur.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
