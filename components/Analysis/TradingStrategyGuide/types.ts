// TradingStrategyGuide 하위 컴포넌트 공용 타입 정의

export type TradingStyle = 'trend' | 'reversal' | 'breakout';
export type EntryStyle = 'conservative' | 'aggressive';

// 부모에서 생성하는 번역 객체 t의 형태
export interface TStrings {
    title: string;
    styles: Record<TradingStyle, string>;
    entryStyles: Record<EntryStyle, string>;
    labels: {
        tradingStyle: string;
        entryStyle: string;
        stopLoss: string;
        entryPlan: string;
        stopLossPrice: string;
    };
    descriptions: {
        trend: string;
        reversal: string;
        breakout: string;
        safe_split: string;
        agg_split: string;
    };
}
