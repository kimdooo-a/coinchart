export const DETAILED_TEMPLATES = {
    PARTIAL: {
        evidence: "현재 {riseProb}%의 상승 통계가 산출되었습니다. {strongFactors} 등이 주요 상승 요인으로 작용하고 있으며, {regime} 시장 환경에서 긍정적 패턴이 포착되었습니다.",
        risk: "다만 {dropProb}%의 하락 가능성도 존재하므로, 리스크 관리 관점에서 분할 진입을 권장합니다. {riskNotes}",
        watch: "향후 {watchNext} 구간 돌파 여부와 거래량 변화를 지속적으로 확인하시기 바랍니다."
    },
    HOLD: {
        evidence: "현재 상승 확률이 {riseProb}%로 다소 중립적입니다. 시장은 {regime} 상태를 보이고 있으며, 뚜렷한 방향성이 확인되지 않고 있습니다.",
        risk: "변동성이 {volatility} 수준으로, 급격한 시세 변화 가능성이 있습니다. 현재 기술적 지표 {grade} 등급으로 관망이 유리한 구간입니다.",
        watch: "{watchNext} 지지선 이탈 여부를 주의 깊게 살피며, 확실한 신호 발생 시까지 대기하는 것이 좋습니다."
    },
    STOP_LOSS: {
        evidence: "하락 확률이 {dropProb}%로 하락 추세가 우세합니다. 주요 지표인 {topSignals}에서 약세 패턴이 확인되었습니다.",
        risk: "추가적인 하락 가능성이 높으므로({regime}), 리스크 관리를 최우선으로 고려해야 합니다. {riskNotes}",
        watch: "반등 시도가 나오더라도 거래량이 동반되지 않는다면 보수적인 접근을 유지하십시오."
    }
};

export const DEFAULT_DETAILED_VALUES = {
    riskNotes: "특이 사항 없음",
    watchNext: "주요 지지/저항",
    strongFactors: "기술적 지표",
    volatility: "보통"
};
