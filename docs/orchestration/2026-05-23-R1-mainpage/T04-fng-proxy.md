# T04 — fng-proxy

> **본 터미널은 R1 일꾼(T04)**. 1차 발사 (의존 없음).

## 정체성

- 역할: `worker` (T04), R1, mainpage
- 담당: Alternative.me Fear & Greed Index 프록시
- 메인페이지 사이드바의 `FngGaugeWidget value={72}` 하드코딩을 실데이터로 교체

## 컨텍스트

`components/community/widgets/FngGaugeWidget.tsx`는 `value`/`prevValue` 두 숫자만 props로 받는다. 현재 메인페이지는 `value={72} prevValue={68}` 하드코딩. Alternative.me가 무료 + 무인증 API를 제공하므로 단순 프록시 + 1시간 캐시면 충분.

## 공통 SOT

```
CLAUDE.md
components/community/widgets/FngGaugeWidget.tsx     ← props 시그니처 확인
app/api/news/route.ts                                ← API 라우트 스타일
docs/references/_API_REFERENCE.md
docs/references/_ENV_REFERENCE.md
```

외부 API: `https://api.alternative.me/fng/?limit=2`

## 작업 목표

1. `lib/community/fng.ts` 신규 — fetch + 캐시
2. `app/api/fng/route.ts` 신규 — 메인페이지 호출용
3. references append

## 산출물

#### 1. `lib/community/fng.ts`

```ts
export interface FngSnapshot {
  value: number;       // 0~100
  classification: string;  // "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed"
  prevValue?: number;
  timestamp: number;   // unix ms
}

const FNG_URL = "https://api.alternative.me/fng/?limit=2&format=json";
let cache: { data: FngSnapshot; expiresAt: number } | null = null;
const TTL_MS = 60 * 60 * 1000;

export async function fetchFng(): Promise<FngSnapshot> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.data;

  const res = await fetch(FNG_URL, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`[fng] ${res.status}`);
  const json = await res.json() as { data?: Array<{ value: string; value_classification: string; timestamp: string }> };
  const arr = json.data ?? [];
  if (arr.length === 0) throw new Error("[fng] empty response");

  const snap: FngSnapshot = {
    value: Number(arr[0].value),
    classification: arr[0].value_classification,
    prevValue: arr[1] ? Number(arr[1].value) : undefined,
    timestamp: Number(arr[0].timestamp) * 1000,
  };
  cache = { data: snap, expiresAt: now + TTL_MS };
  return snap;
}
```

#### 2. `app/api/fng/route.ts`

```ts
import { NextResponse } from "next/server";
import { fetchFng } from "@/lib/community/fng";

export const revalidate = 3600;

export async function GET() {
  try {
    const fng = await fetchFng();
    return NextResponse.json(fng);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "fng fetch failed" },
      { status: 502 }
    );
  }
}
```

#### 3. `docs/references/_API_REFERENCE.md` (append)

```markdown
### GET /api/fng

R1 (2026-05-23) 추가. Alternative.me 프록시.

응답: `FngSnapshot { value, classification, prevValue?, timestamp }`
캐시: 1시간 (Next revalidate + 메모리)
```

#### 4. `docs/references/_ENV_REFERENCE.md` (append)

```markdown
### FNG 외부 API
- `/api/fng`는 `https://api.alternative.me/fng/?limit=2`를 프록시. 무인증, ENV 추가 없음.
```

## 작업 단계

1. SOT 읽기
2. 3개 파일 작성 + 2개 references append
3. 검증

## 검증

```bash
npx tsc --noEmit
npx tsx -e "import('./lib/community/fng').then(async m => { console.log(await m.fetchFng()); })"
```

`value`가 0~100 사이 정수면 PASS.

## 완료 신호

`docs/handover/2026-05-23-R1-T04-fng-proxy.md` 작성.

명시:
- 1시간 캐시 정책
- T15가 호출할 엔드포인트: `/api/fng`
- 외부 API 다운 시 502 반환 — 메인페이지는 fallback UI 노출 권장 (T15에 메모)

## 안티패턴

- `FngGaugeWidget.tsx` 수정 금지 (T15 또는 별도 영역)
- 다른 외부 API 추가 금지 (FNG만)
- ENV 추가 금지
- 메인페이지(`app/page.tsx`) 절대 손대지 말 것
