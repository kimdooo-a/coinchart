# EXPLANATION TEMPLATES — "왜 이 확률인가?" 설명 시스템

**Version**: 1.0
**Date**: 2025-12-27
**Author**: Claude Code
**Constraint**: ML 모델 / 외부 LLM 호출 금지

---

## 1. 설계 원칙

### 1-A. 설명이 필요한 이유

```
[사용자 심리]
"65% 상승 확률"을 보면 생기는 질문:
1. 이 숫자는 어디서 왔나?
2. 얼마나 믿을 수 있나?
3. 어떤 조건에서 계산된 건가?
4. 비슷한 상황이 과거에 몇 번 있었나?
5. 그때 실제로 어떻게 됐나?
```

### 1-B. 설명 없는 확률의 문제

| 문제 | 결과 |
|------|------|
| 블랙박스 | 신뢰도 하락 |
| 맥락 부재 | 오해/오용 |
| 근거 없음 | "도박" 느낌 |
| 한계 미고지 | 과신 → 손실 |

---

## 2. 템플릿 구조

### 2-A. 4단계 설명 프레임워크

```
┌─────────────────────────────────────────────────────────┐
│  Level 1: 헤드라인 (1줄)                                 │
│  "RSI 과매도 + MACD 골든크로스로 상승 확률 67%"          │
├─────────────────────────────────────────────────────────┤
│  Level 2: 요약 (3줄)                                     │
│  - 현재 상태 진단                                        │
│  - 핵심 근거 2-3개                                       │
│  - 신뢰도/한계                                           │
├─────────────────────────────────────────────────────────┤
│  Level 3: 상세 (펼치면 보이는)                           │
│  - 각 지표별 기여도                                      │
│  - 과거 유사 사례                                        │
│  - 크기별 확률 분포                                      │
├─────────────────────────────────────────────────────────┤
│  Level 4: 전문가용 (별도 탭)                             │
│  - 백테스트 전체 지표                                    │
│  - 시장 상태별 조건부 확률                               │
│  - 신뢰구간/샘플 통계                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 템플릿 라이브러리

### 3-A. 헤드라인 템플릿 (Level 1)

```typescript
interface HeadlineTemplate {
  pattern: string;
  variables: string[];
  condition: (data: AnalysisData) => boolean;
}

const HEADLINE_TEMPLATES: HeadlineTemplate[] = [
  // === 강한 상승 신호 ===
  {
    pattern: "📈 {indicator1} + {indicator2}로 상승 확률 {prob}%",
    variables: ['indicator1', 'indicator2', 'prob'],
    condition: (d) => d.riseProb >= 65 && d.buySignals >= 2
  },
  {
    pattern: "🚀 {count}개 지표 동시 매수 신호! 상승 확률 {prob}%",
    variables: ['count', 'prob'],
    condition: (d) => d.buySignals >= 5
  },

  // === 강한 하락 신호 ===
  {
    pattern: "📉 과매수 경고: {indicator}가 {value} 도달, 조정 확률 {prob}%",
    variables: ['indicator', 'value', 'prob'],
    condition: (d) => d.dropProb >= 60 && d.rsi > 70
  },

  // === 횡보/중립 ===
  {
    pattern: "⚖️ 혼조세: 상승 {rise}% vs 하락 {drop}%, 방향 탐색 중",
    variables: ['rise', 'drop'],
    condition: (d) => Math.abs(d.riseProb - 50) < 10
  },

  // === 고변동성 ===
  {
    pattern: "⚡ 변동성 급등! 방향 불명확 (신뢰도 {grade}등급)",
    variables: ['grade'],
    condition: (d) => d.volatility > 5
  },

  // === 패턴 기반 ===
  {
    pattern: "🔄 과거 유사 패턴 {count}회 중 {winCount}회 상승 ({prob}%)",
    variables: ['count', 'winCount', 'prob'],
    condition: (d) => d.patternMatches > 10
  }
];

function generateHeadline(data: AnalysisData): string {
  const template = HEADLINE_TEMPLATES.find(t => t.condition(data));
  if (!template) {
    return `분석 완료: 상승 확률 ${data.riseProb}%`;
  }

  let result = template.pattern;
  template.variables.forEach(v => {
    result = result.replace(`{${v}}`, String(data[v]));
  });
  return result;
}
```

### 3-B. 요약 템플릿 (Level 2)

```typescript
interface SummaryTemplate {
  id: string;
  condition: (d: AnalysisData) => boolean;
  generate: (d: AnalysisData, lang: 'ko' | 'en') => SummaryContent;
}

interface SummaryContent {
  situation: string;      // 현재 상태 진단
  keyPoints: string[];    // 핵심 근거 (2-3개)
  confidence: string;     // 신뢰도/한계
}

const SUMMARY_TEMPLATES: Record<string, SummaryTemplate> = {

  // === 강력 매수 ===
  STRONG_BUY: {
    id: 'STRONG_BUY',
    condition: (d) => d.riseProb >= 70 && d.confidence.grade === 'A',
    generate: (d, lang) => ({
      situation: lang === 'ko'
        ? `현재 ${d.symbol}은(는) 강한 상승 모멘텀 구간에 진입했습니다.`
        : `${d.symbol} has entered a strong bullish momentum zone.`,

      keyPoints: lang === 'ko' ? [
        `RSI ${d.rsi.toFixed(1)}로 과매도에서 반등 중`,
        `MACD 히스토그램 ${d.macdHist > 0 ? '양전환' : '상승 중'}`,
        `거래량 ${d.volumeRatio > 1 ? '평균 대비 ' + (d.volumeRatio * 100 - 100).toFixed(0) + '% 증가' : '안정적'}`
      ] : [
        `RSI at ${d.rsi.toFixed(1)}, bouncing from oversold`,
        `MACD histogram ${d.macdHist > 0 ? 'turned positive' : 'rising'}`,
        `Volume ${d.volumeRatio > 1 ? (d.volumeRatio * 100 - 100).toFixed(0) + '% above average' : 'stable'}`
      ],

      confidence: lang === 'ko'
        ? `신뢰도 ${d.confidence.grade}등급 (과거 ${d.sampleSize}건 분석)`
        : `Confidence: Grade ${d.confidence.grade} (${d.sampleSize} historical samples)`
    })
  },

  // === 과매도 반등 ===
  OVERSOLD_BOUNCE: {
    id: 'OVERSOLD_BOUNCE',
    condition: (d) => d.rsi < 30 && d.riseProb >= 55,
    generate: (d, lang) => ({
      situation: lang === 'ko'
        ? `${d.symbol}의 RSI가 ${d.rsi.toFixed(1)}로 과매도 구간입니다.`
        : `${d.symbol}'s RSI is at ${d.rsi.toFixed(1)}, in oversold territory.`,

      keyPoints: lang === 'ko' ? [
        `과매도(RSI<30) 구간에서 과거 ${d.oversoldBounceRate}% 확률로 반등`,
        `현재 지지선 $${d.support.toLocaleString()}에서 ${((d.currentPrice - d.support) / d.support * 100).toFixed(1)}% 위`,
        d.macdCrossing ? 'MACD 골든크로스 임박' : 'MACD 하락세 둔화 중'
      ] : [
        `Historically, ${d.oversoldBounceRate}% bounce from oversold (RSI<30)`,
        `Currently ${((d.currentPrice - d.support) / d.support * 100).toFixed(1)}% above support at $${d.support.toLocaleString()}`,
        d.macdCrossing ? 'MACD golden cross imminent' : 'MACD decline slowing'
      ],

      confidence: lang === 'ko'
        ? `단, 추세 하락 중이면 추가 하락 ${100 - d.riseProb}% 가능`
        : `Caution: ${100 - d.riseProb}% chance of further decline if downtrend continues`
    })
  },

  // === 과매수 경고 ===
  OVERBOUGHT_WARNING: {
    id: 'OVERBOUGHT_WARNING',
    condition: (d) => d.rsi > 70,
    generate: (d, lang) => ({
      situation: lang === 'ko'
        ? `⚠️ ${d.symbol}의 RSI가 ${d.rsi.toFixed(1)}로 과매수 구간입니다.`
        : `⚠️ ${d.symbol}'s RSI is at ${d.rsi.toFixed(1)}, in overbought territory.`,

      keyPoints: lang === 'ko' ? [
        `과매수(RSI>70) 후 과거 ${d.overboughtDropRate}% 확률로 조정 발생`,
        `볼린저 상단 밴드 근접 (현재가가 밴드의 ${d.bbPosition}% 위치)`,
        `단기 차익실현 압력 예상`
      ] : [
        `Historically, ${d.overboughtDropRate}% correction after overbought (RSI>70)`,
        `Near upper Bollinger Band (price at ${d.bbPosition}% of band)`,
        `Short-term profit-taking pressure expected`
      ],

      confidence: lang === 'ko'
        ? `강한 상승 추세에서는 과매수 상태가 지속될 수 있음`
        : `Note: Overbought can persist in strong uptrends`
    })
  },

  // === 횡보 ===
  RANGING: {
    id: 'RANGING',
    condition: (d) => d.regime === 'RANGING_TIGHT' || d.regime === 'RANGING_WIDE',
    generate: (d, lang) => ({
      situation: lang === 'ko'
        ? `${d.symbol}은(는) 현재 $${d.support.toLocaleString()} ~ $${d.resistance.toLocaleString()} 박스권 횡보 중입니다.`
        : `${d.symbol} is ranging between $${d.support.toLocaleString()} and $${d.resistance.toLocaleString()}.`,

      keyPoints: lang === 'ko' ? [
        `ADX ${d.adx.toFixed(1)}로 추세 약함`,
        `볼린저 밴드 폭 ${d.bbWidth.toFixed(1)}%로 변동성 축소`,
        `돌파 방향 주시 필요`
      ] : [
        `ADX at ${d.adx.toFixed(1)}, indicating weak trend`,
        `Bollinger Band width ${d.bbWidth.toFixed(1)}%, volatility contracting`,
        `Watch for breakout direction`
      ],

      confidence: lang === 'ko'
        ? `횡보장에서 추세 지표 신뢰도 낮음 (역추세 지표 참고)`
        : `Trend indicators less reliable in ranging markets (use mean-reversion)`
    })
  },

  // === 고변동성 ===
  HIGH_VOLATILITY: {
    id: 'HIGH_VOLATILITY',
    condition: (d) => d.atrPercent > 5,
    generate: (d, lang) => ({
      situation: lang === 'ko'
        ? `⚡ ${d.symbol}의 변동성이 평소의 ${(d.atrPercent / d.avgAtrPercent * 100).toFixed(0)}% 수준으로 급등했습니다.`
        : `⚡ ${d.symbol}'s volatility has spiked to ${(d.atrPercent / d.avgAtrPercent * 100).toFixed(0)}% of normal levels.`,

      keyPoints: lang === 'ko' ? [
        `ATR ${d.atrPercent.toFixed(1)}% (일반적 ${d.avgAtrPercent.toFixed(1)}%)`,
        `급격한 방향 전환 가능성 높음`,
        `손절 폭 확대 필요`
      ] : [
        `ATR ${d.atrPercent.toFixed(1)}% (normal: ${d.avgAtrPercent.toFixed(1)}%)`,
        `High probability of sudden direction changes`,
        `Wider stop-loss recommended`
      ],

      confidence: lang === 'ko'
        ? `🔴 고변동성으로 모든 예측 신뢰도 하락. 포지션 축소 권장.`
        : `🔴 All predictions less reliable in high volatility. Reduce position size.`
    })
  }
};

function generateSummary(data: AnalysisData, lang: 'ko' | 'en'): SummaryContent {
  for (const template of Object.values(SUMMARY_TEMPLATES)) {
    if (template.condition(data)) {
      return template.generate(data, lang);
    }
  }
  // 기본 템플릿
  return {
    situation: lang === 'ko'
      ? `${data.symbol} 분석이 완료되었습니다.`
      : `Analysis complete for ${data.symbol}.`,
    keyPoints: [],
    confidence: ''
  };
}
```

### 3-C. 상세 설명 템플릿 (Level 3)

```typescript
interface DetailedExplanation {
  indicatorBreakdown: IndicatorContribution[];
  historicalCases: HistoricalCase[];
  magnitudeDistribution: MagnitudeDistribution;
  caveats: string[];
}

interface IndicatorContribution {
  name: string;
  value: number;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  contribution: number;      // -10 ~ +10
  explanation: string;
}

function generateDetailedExplanation(
  data: AnalysisData,
  lang: 'ko' | 'en'
): DetailedExplanation {

  // 지표별 기여도
  const indicatorBreakdown: IndicatorContribution[] = [
    {
      name: 'RSI (14)',
      value: data.rsi,
      signal: data.rsi < 30 ? 'BUY' : data.rsi > 70 ? 'SELL' : 'NEUTRAL',
      contribution: data.rsi < 30 ? 8 : data.rsi > 70 ? -8 : 0,
      explanation: lang === 'ko'
        ? `RSI ${data.rsi.toFixed(1)} - ${data.rsi < 30 ? '과매도로 반등 기대' : data.rsi > 70 ? '과매수로 조정 예상' : '중립 구간'}`
        : `RSI ${data.rsi.toFixed(1)} - ${data.rsi < 30 ? 'Oversold, bounce expected' : data.rsi > 70 ? 'Overbought, correction expected' : 'Neutral zone'}`
    },
    {
      name: 'MACD',
      value: data.macdHist,
      signal: data.macdHist > 0 ? 'BUY' : data.macdHist < 0 ? 'SELL' : 'NEUTRAL',
      contribution: Math.sign(data.macdHist) * Math.min(Math.abs(data.macdHist) * 10, 7),
      explanation: lang === 'ko'
        ? `MACD 히스토그램 ${data.macdHist > 0 ? '양수 (상승 모멘텀)' : '음수 (하락 모멘텀)'}`
        : `MACD histogram ${data.macdHist > 0 ? 'positive (bullish momentum)' : 'negative (bearish momentum)'}`
    },
    // ... 나머지 지표들
  ];

  // 과거 유사 사례
  const historicalCases: HistoricalCase[] = data.topMatches.slice(0, 5).map(match => ({
    date: match.date,
    similarity: match.similarity,
    outcome: match.returnPct,
    description: lang === 'ko'
      ? `${match.date}: 유사도 ${match.similarity}% → ${match.returnPct > 0 ? '+' : ''}${match.returnPct.toFixed(1)}%`
      : `${match.date}: ${match.similarity}% similar → ${match.returnPct > 0 ? '+' : ''}${match.returnPct.toFixed(1)}%`
  }));

  // 크기별 분포
  const magnitudeDistribution = {
    labels: lang === 'ko'
      ? ['3%+ 상승', '1-3% 상승', '0-1% 상승', '0-1% 하락', '1-3% 하락', '3%+ 하락']
      : ['+3%+ Rise', '+1-3% Rise', '+0-1% Rise', '0-1% Drop', '1-3% Drop', '3%+ Drop'],
    values: [
      data.magnitude.strongRise,
      data.magnitude.moderateRise,
      data.magnitude.slightRise,
      data.magnitude.slightDrop,
      data.magnitude.moderateDrop,
      data.magnitude.strongDrop
    ]
  };

  // 주의사항
  const caveats: string[] = [];

  if (data.sampleSize < 30) {
    caveats.push(lang === 'ko'
      ? `⚠️ 표본 수(${data.sampleSize}개)가 적어 통계적 신뢰도가 낮습니다.`
      : `⚠️ Sample size (${data.sampleSize}) is small, statistical confidence is low.`
    );
  }

  if (data.atrPercent > 4) {
    caveats.push(lang === 'ko'
      ? `⚠️ 현재 변동성(${data.atrPercent.toFixed(1)}%)이 높아 예측 불확실성이 큽니다.`
      : `⚠️ Current volatility (${data.atrPercent.toFixed(1)}%) is high, prediction uncertainty increased.`
    );
  }

  if (data.regime !== data.historicalRegime) {
    caveats.push(lang === 'ko'
      ? `⚠️ 현재 시장 상태(${data.regime})가 과거 패턴 시점과 다릅니다.`
      : `⚠️ Current market regime (${data.regime}) differs from historical pattern periods.`
    );
  }

  return {
    indicatorBreakdown,
    historicalCases,
    magnitudeDistribution,
    caveats
  };
}
```

---

## 4. UI 컴포넌트 설계

### 4-A. 설명 카드 컴포넌트

```tsx
// components/Analysis/ProbabilityExplanation.tsx

interface Props {
  data: AnalysisData;
  lang: 'ko' | 'en';
  defaultLevel?: 1 | 2 | 3;
}

export const ProbabilityExplanation: React.FC<Props> = ({
  data,
  lang,
  defaultLevel = 2
}) => {
  const [level, setLevel] = useState(defaultLevel);

  const headline = generateHeadline(data);
  const summary = generateSummary(data, lang);
  const detailed = generateDetailedExplanation(data, lang);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Level 1: 헤드라인 (항상 표시) */}
      <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-900">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          {headline}
          <ConfidenceBadge grade={data.confidence.grade} />
        </h3>
      </div>

      {/* Level 2: 요약 (기본 표시) */}
      <div className="p-4 border-t border-gray-800">
        <p className="text-gray-300 mb-3">{summary.situation}</p>

        <ul className="space-y-2">
          {summary.keyPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
              <span className="text-blue-400">•</span>
              {point}
            </li>
          ))}
        </ul>

        <p className="mt-3 text-xs text-gray-500 italic">
          {summary.confidence}
        </p>
      </div>

      {/* Level 3: 상세 (펼치기) */}
      <Collapsible>
        <CollapsibleTrigger className="w-full p-3 text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2 border-t border-gray-800">
          {lang === 'ko' ? '상세 분석 보기' : 'View Detailed Analysis'}
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>

        <CollapsibleContent className="p-4 border-t border-gray-800 space-y-6">
          {/* 지표별 기여도 */}
          <section>
            <h4 className="text-sm font-bold text-gray-300 mb-3">
              {lang === 'ko' ? '📊 지표별 기여도' : '📊 Indicator Contributions'}
            </h4>
            <div className="space-y-2">
              {detailed.indicatorBreakdown.map(ind => (
                <IndicatorBar
                  key={ind.name}
                  name={ind.name}
                  value={ind.value}
                  signal={ind.signal}
                  contribution={ind.contribution}
                  explanation={ind.explanation}
                />
              ))}
            </div>
          </section>

          {/* 과거 유사 사례 */}
          <section>
            <h4 className="text-sm font-bold text-gray-300 mb-3">
              {lang === 'ko' ? '📜 과거 유사 사례' : '📜 Historical Similar Cases'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {detailed.historicalCases.map((c, i) => (
                <HistoricalCaseCard key={i} case={c} />
              ))}
            </div>
          </section>

          {/* 크기별 분포 */}
          <section>
            <h4 className="text-sm font-bold text-gray-300 mb-3">
              {lang === 'ko' ? '📈 예상 수익률 분포' : '📈 Expected Return Distribution'}
            </h4>
            <MagnitudeChart data={detailed.magnitudeDistribution} />
          </section>

          {/* 주의사항 */}
          {detailed.caveats.length > 0 && (
            <section className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3">
              <h4 className="text-sm font-bold text-yellow-400 mb-2">
                {lang === 'ko' ? '⚠️ 주의사항' : '⚠️ Caveats'}
              </h4>
              <ul className="space-y-1 text-xs text-yellow-300/80">
                {detailed.caveats.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </section>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
```

### 4-B. 지표 기여도 바

```tsx
const IndicatorBar: React.FC<{
  name: string;
  value: number;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  contribution: number;  // -10 ~ +10
  explanation: string;
}> = ({ name, value, signal, contribution, explanation }) => {
  const barColor = signal === 'BUY' ? 'bg-green-500' :
                   signal === 'SELL' ? 'bg-red-500' : 'bg-gray-500';

  const barWidth = Math.abs(contribution) * 5;  // 0-50%

  return (
    <div className="flex items-center gap-3 p-2 bg-gray-800/50 rounded">
      {/* 지표명 */}
      <div className="w-24 text-xs font-mono text-gray-400">{name}</div>

      {/* 값 */}
      <div className="w-16 text-xs text-gray-300">{value.toFixed(1)}</div>

      {/* 기여도 바 */}
      <div className="flex-1 h-2 bg-gray-700 rounded-full relative">
        <div
          className={`absolute top-0 h-full rounded-full ${barColor}`}
          style={{
            left: contribution >= 0 ? '50%' : `${50 - barWidth}%`,
            width: `${barWidth}%`
          }}
        />
        <div className="absolute left-1/2 top-0 h-full w-px bg-gray-500" />
      </div>

      {/* 시그널 */}
      <div className={`w-12 text-xs font-bold text-center ${
        signal === 'BUY' ? 'text-green-400' :
        signal === 'SELL' ? 'text-red-400' : 'text-gray-400'
      }`}>
        {signal}
      </div>

      {/* 툴팁 */}
      <Tooltip content={explanation}>
        <Info className="h-4 w-4 text-gray-500 cursor-help" />
      </Tooltip>
    </div>
  );
};
```

---

## 5. 동적 문장 생성 규칙

### 5-A. 조건부 문장 조합

```typescript
type ConditionKey =
  | 'RSI_OVERSOLD'
  | 'RSI_OVERBOUGHT'
  | 'MACD_GOLDEN'
  | 'MACD_DEAD'
  | 'BB_LOWER_TOUCH'
  | 'BB_UPPER_TOUCH'
  | 'VOLUME_SURGE'
  | 'HIGH_VOLATILITY'
  | 'STRONG_TREND'
  | 'WEAK_TREND';

const CONDITION_PHRASES: Record<ConditionKey, { ko: string; en: string }> = {
  RSI_OVERSOLD: {
    ko: 'RSI가 과매도 구간({value})에서',
    en: 'With RSI in oversold territory ({value}),'
  },
  RSI_OVERBOUGHT: {
    ko: 'RSI가 과매수 구간({value})으로',
    en: 'With RSI in overbought territory ({value}),'
  },
  MACD_GOLDEN: {
    ko: 'MACD 골든크로스가 발생하여',
    en: 'with MACD golden cross occurring,'
  },
  MACD_DEAD: {
    ko: 'MACD 데드크로스가 발생하여',
    en: 'with MACD death cross occurring,'
  },
  BB_LOWER_TOUCH: {
    ko: '볼린저 하단 밴드에 닿아',
    en: 'touching the lower Bollinger Band,'
  },
  BB_UPPER_TOUCH: {
    ko: '볼린저 상단 밴드에 닿아',
    en: 'touching the upper Bollinger Band,'
  },
  VOLUME_SURGE: {
    ko: '거래량이 평균 대비 {ratio}% 급증하며',
    en: 'with volume surging {ratio}% above average,'
  },
  HIGH_VOLATILITY: {
    ko: '고변동성 환경에서',
    en: 'in a high-volatility environment,'
  },
  STRONG_TREND: {
    ko: '강한 추세가 확인되어',
    en: 'with a strong trend confirmed,'
  },
  WEAK_TREND: {
    ko: '추세가 약해지는 가운데',
    en: 'amid weakening trend,'
  }
};

function buildDynamicSentence(
  conditions: ConditionKey[],
  probability: number,
  lang: 'ko' | 'en',
  variables: Record<string, string | number>
): string {
  const phrases = conditions.map(c => {
    let phrase = CONDITION_PHRASES[c][lang];
    Object.entries(variables).forEach(([key, value]) => {
      phrase = phrase.replace(`{${key}}`, String(value));
    });
    return phrase;
  });

  const conclusion = lang === 'ko'
    ? `상승 확률은 ${probability}%로 분석됩니다.`
    : `the probability of rise is analyzed at ${probability}%.`;

  return phrases.join(' ') + ' ' + conclusion;
}

// 사용 예시
buildDynamicSentence(
  ['RSI_OVERSOLD', 'MACD_GOLDEN', 'VOLUME_SURGE'],
  72,
  'ko',
  { value: 28.5, ratio: 150 }
);
// → "RSI가 과매도 구간(28.5)에서 MACD 골든크로스가 발생하여 거래량이 평균 대비 150% 급증하며 상승 확률은 72%로 분석됩니다."
```

---

## 6. 결론 문장 라이브러리

### 6-A. 확률 범위별 결론

```typescript
const CONCLUSIONS: Record<string, { ko: string; en: string }[]> = {
  VERY_HIGH: [ // 75%+
    {
      ko: '역사적으로 이 조합에서는 높은 확률로 상승이 이어졌습니다.',
      en: 'Historically, this combination has led to rises with high probability.'
    },
    {
      ko: '현재 상황은 매수에 유리한 환경으로 보입니다.',
      en: 'Current conditions appear favorable for buying.'
    }
  ],
  HIGH: [ // 60-75%
    {
      ko: '상승 가능성이 높지만, 리스크 관리는 필수입니다.',
      en: 'High probability of rise, but risk management is essential.'
    },
    {
      ko: '분할 매수 전략이 적합해 보입니다.',
      en: 'A DCA (split entry) strategy seems appropriate.'
    }
  ],
  NEUTRAL: [ // 45-60%
    {
      ko: '방향성이 불분명하므로 관망을 권합니다.',
      en: 'Direction is unclear; staying on the sidelines is recommended.'
    },
    {
      ko: '확실한 신호가 나올 때까지 기다리는 것이 좋겠습니다.',
      en: 'Better to wait for a clearer signal.'
    }
  ],
  LOW: [ // 35-45%
    {
      ko: '하락 압력이 우세한 상황입니다. 신중해야 합니다.',
      en: 'Downward pressure prevails. Caution is advised.'
    },
    {
      ko: '매수보다는 현금 보유가 나을 수 있습니다.',
      en: 'Holding cash may be preferable to buying.'
    }
  ],
  VERY_LOW: [ // <35%
    {
      ko: '매수 시그널이 없습니다. 추가 하락에 주의하세요.',
      en: 'No buy signals. Beware of further decline.'
    },
    {
      ko: '단기 트레이더라면 숏 포지션을 고려할 수 있습니다.',
      en: 'Short-term traders may consider short positions.'
    }
  ]
};

function getConclusion(probability: number, lang: 'ko' | 'en'): string {
  const tier = probability >= 75 ? 'VERY_HIGH' :
               probability >= 60 ? 'HIGH' :
               probability >= 45 ? 'NEUTRAL' :
               probability >= 35 ? 'LOW' : 'VERY_LOW';

  const options = CONCLUSIONS[tier];
  return options[Math.floor(Math.random() * options.length)][lang];
}
```

---

## 7. 파일 구조

```
lib/
├── explanation/
│   ├── templates.ts        # 템플릿 정의
│   ├── generator.ts        # 문장 생성기
│   ├── conditions.ts       # 조건 문구
│   └── conclusions.ts      # 결론 라이브러리
├── types/
│   └── explanation.ts      # 타입 정의
components/
├── Analysis/
│   ├── ProbabilityExplanation.tsx
│   ├── IndicatorBar.tsx
│   ├── HistoricalCaseCard.tsx
│   └── MagnitudeChart.tsx
```

---

**Status**: DESIGN COMPLETE
**Next**: Commander 승인 → 구현
