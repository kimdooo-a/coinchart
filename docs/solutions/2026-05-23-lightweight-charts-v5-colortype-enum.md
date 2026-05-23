---
title: lightweight-charts v5 ColorType 문자열 리터럴 → enum 전환 호환성
date: 2026-05-23
session: 9
tags: [lightweight-charts, typescript, chart-options, v5-migration, tradingview]
category: workaround
confidence: high
---

## 문제

`lib/chart/theme.ts`에서 TradingView Lightweight Charts 옵션 객체를 정의할 때 다음 코드가 TS2322 에러 발생:

```ts
import type { DeepPartial, ChartOptions } from 'lightweight-charts';

export const LIGHT_CHART_THEME: DeepPartial<ChartOptions> = {
  layout: {
    background: { type: 'solid' as const, color: '#ffffff' },
    // ...
  },
};
```

```
lib/chart/theme.ts(8,19): error TS2322: Type '"solid"' is not assignable to type 'ColorType | undefined'.
```

T08 작업 명세서(spec)에 적혀 있던 코드 그대로 작성했음에도 컴파일 실패.

## 원인

lightweight-charts **v5.0.9** (본 프로젝트 `package.json`에 명시) 부터 `ColorType`이 string literal union이 아닌 **TypeScript enum**으로 강화됨. v4까지는 `'solid' | 'vertical-gradient'` 같은 union으로 받아주었지만, v5에서는 enum 값을 명시적으로 import해서 사용해야 한다.

`as const`로 좁혀도 `'solid'` 문자열은 enum 값(`ColorType.Solid`)과 nominal 호환되지 않는다.

## 해결

`ColorType`을 type-only import가 아닌 **value import**로 가져와서 enum 값을 직접 사용:

```ts
import { ColorType, type DeepPartial, type ChartOptions } from 'lightweight-charts';

export const LIGHT_CHART_THEME: DeepPartial<ChartOptions> = {
  layout: {
    background: { type: ColorType.Solid, color: '#ffffff' },
    textColor: '#191b24',
    fontFamily: 'Noto Sans KR, sans-serif',
  },
  // ...
};
```

다른 ColorType 값:
- `ColorType.Solid` — 단색 배경
- `ColorType.VerticalGradient` — 수직 그라데이션 배경

## 교훈

- **외부 라이브러리 spec에 적힌 코드도 메이저 버전 차이로 깨질 수 있다.** Plan 단계에서 적힌 코드는 spec 작성 시점의 API 가정. 실제 적용 시 `package.json`의 설치 버전과 대조.
- TS2322가 string literal vs enum에서 발생하면 해당 타입의 정의(`ColorType`)가 enum인지 union인지 d.ts 확인 — VSCode의 "Go to Type Definition"이 즉시 답 줌.
- type-only import(`import type { X }`)는 enum 값을 사용할 수 없다. enum을 value로 사용할 때는 일반 import 필요.

## 관련 파일

- `lib/chart/theme.ts` (본 솔루션 적용)
- `docs/orchestration/2026-05-23-R1-mainpage/T08-chart-theme-editor-tone.md` (원본 spec — 후속 버전에서 수정 권장)
- `docs/handover/2026-05-23-R1-T08-chart-theme-editor-tone.md` (T09·T10·T11 안내)

## 후속 권장사항 (T09·T10·T11)

기존 차트 파일들(`components/Chart/CryptoChart.tsx`, `components/Chart/StockChart.tsx`, `components/DetailedChart.tsx`, `components/hero-chart.tsx`)에서 차트 옵션을 정의하는 부분이 있다면 동일하게 ColorType.Solid를 사용하거나, 더 깔끔하게 `getChartTheme('light')` 헬퍼만 호출하면 된다.
