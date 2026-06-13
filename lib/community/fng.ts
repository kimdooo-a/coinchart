// Alternative.me Fear & Greed Index 프록시 (R1/T04, 2026-05-23)
// 메인페이지 사이드바 FngGaugeWidget 데이터 공급용

export interface FngSnapshot {
  /** 0~100 */
  value: number;
  /** "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed" */
  classification: string;
  /** 어제 값 (limit=2 응답에서 두 번째 데이터) */
  prevValue?: number;
  /** 측정 시각 (unix ms) */
  timestamp: number;
}

const FNG_URL = "https://api.alternative.me/fng/?limit=2&format=json";
const TTL_MS = 60 * 60 * 1000; // 1시간

let cache: { data: FngSnapshot; expiresAt: number } | null = null;

interface FngApiItem {
  value: string;
  value_classification: string;
  timestamp: string;
}

export async function fetchFng(): Promise<FngSnapshot> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.data;

  const res = await fetch(FNG_URL, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`[fng] ${res.status}`);

  // R9/T04: 응답 JSON 파싱 실패를 명시적 throw로 보강 — 깨진 응답 시
  // 런타임 예외/undefined 전파를 막고, 상위 queries.ts의 .catch() 폴백이 일관되게 받도록 한다.
  let json: { data?: FngApiItem[] };
  try {
    json = (await res.json()) as { data?: FngApiItem[] };
  } catch {
    throw new Error("[fng] invalid json");
  }
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
