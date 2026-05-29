# 인수인계 — R12 / T-B: settings 구현 (표시 환경설정)

> 작성일: 2026-05-29 (세션 R12)
> 역할: **일꾼 T-B (4명 중 1)** — settings(표시 환경설정·S1) 단일 영역. 지휘관 아님 · **cs 미수행**.
> 입력 SOT: `docs/orchestration/2026-05-29-R12-watchlist-settings/T-B-settings.md`, `docs/design-brief/06-watchlist-settings.md` §3·§4, `docs/handover/2026-05-29-R11-T04-r12-kickoff.md` §1, `docs/design-brief/00-overview.md` §3-4·§9-4·§10

---

## 1. 산출 파일

| 파일 | 역할 | 상태 |
|------|------|------|
| `lib/config/display-settings.tsx` | 표시 환경설정 Context/Provider/훅 + 순수 헬퍼. localStorage(`cca:display`) 영속, 즉시 반영, KRW 환율(`/api/kimchi`) 재사용 | 신규 |
| `lib/config/local-data.ts` | 로컬 사용자 데이터 키 SSOT + `clearLocalData()` + `getWatchlistCount()` | 신규 |
| `components/Settings/SegmentedToggle.tsx` | 2~N지 세그먼트 토글(보더 1px·rounded-md·활성=브랜드 그린·포커스 링) | 신규 |
| `components/Settings/SettingsCard.tsx` | 그룹 카드 + `SettingRow` 프리미티브 | 신규 |
| `components/Settings/DisplaySettingsCard.tsx` | 시세 통화(USD/KRW) · 등락 색상(한국식/글로벌) + 즉시 미리보기 | 신규 |
| `components/Settings/WatchlistCard.tsx` | 관심종목 개수 + 회원 동기화 상태 + `/watchlist` 바로가기 | 신규 |
| `components/Settings/DataResetCard.tsx` | 로컬 데이터 초기화(confirm 1회 + 인라인 완료 안내) | 신규 |
| `components/Settings/AccountCard.tsx` | 회원만: 이메일 + OAuth provider 표시 + 로그아웃 (익명은 null) | 신규 |
| `components/Settings/useAuthUser.ts` | 로그인 사용자 훅(AuthButton 패턴) + `providerLabel()` | 신규 |
| `app/settings/page.tsx` | v1.0 잔재 스텁(78줄, 그라디언트·블러·`rounded-3xl`·"구현 예정" 3카드) → v2.0 실동작 페이지로 교체 | 교체 |

쓰기 영역: `app/settings/`·`components/Settings/`·`lib/config/` **만** (격리 준수, §6 참조).

---

## 2. Context 인터페이스 (S2 전역 적용 구독용 명세)

`lib/config/display-settings.tsx`:

```ts
type Currency = 'USD' | 'KRW';
type ChangeColor = 'KR' | 'GLOBAL';          // KR: 빨↑파↓ · GLOBAL: 녹↑빨↓

const DISPLAY_SETTINGS_STORAGE_KEY = 'cca:display';
const DEFAULT_DISPLAY_SETTINGS = { currency: 'USD', changeColor: 'KR' };  // taste #4

interface DisplaySettingsContextValue {
  currency: Currency;
  changeColor: ChangeColor;
  isHydrated: boolean;                         // SSR/하이드레이션 불일치 방지
  exchangeRate: number;                        // USD→KRW (KRW 모드 시 /api/kimchi에서 갱신, 폴백 1450)
  setCurrency(c: Currency): void;              // 즉시 반영 (저장 버튼 없음)
  setChangeColor(c: ChangeColor): void;
  formatPrice(usdValue: number): string;       // USD 기준값 → 현재 통화 문자열
  changeColorClass(changeValue: number): string; // 등락 부호 → Tailwind 텍스트 색 클래스
}

function useDisplaySettings(): DisplaySettingsContextValue;  // Provider 밖이면 throw

// 비-컴포넌트(React 외부)에서도 쓰는 순수 헬퍼
function getChangeColorClass(changeValue: number, mode: ChangeColor): string;
function formatDisplayPrice(usdValue: number, currency: Currency, exchangeRate: number): string;
```

**색상 매핑** (`getChangeColorClass`):
- KR: 상승 `text-kr-up`(빨강) / 하락 `text-kr-down`(파랑) / flat `text-on-surface-variant`
- GLOBAL: 상승 `text-new`(녹) / 하락 `text-positive`(빨강) / flat `text-on-surface-variant`

**동기화 메커니즘**: set → localStorage 기록 + `window.dispatchEvent('cca:display:changed')`. Provider는 `useSyncExternalStore`로 `'storage'`(다른 탭) + `'cca:display:changed'`(같은 탭 다른 구독자)를 구독 → 모든 인스턴스 즉시 리렌더. **Provider 중첩 시에도 안전**(같은 localStorage·같은 이벤트).

> **구현 메모**: 하이드레이션 패턴은 `useEffect`+`setState` 대신 `useSyncExternalStore`를 사용했다. localStorage는 외부 스토어이며, 이 선택으로 `react-hooks/set-state-in-effect` 린트 규칙을 (억제 주석 없이) 정석으로 통과한다. 객체 스냅샷은 raw 문자열 캐시로 안정 참조를 보장(무한 렌더 방지), `isHydrated`는 `useSyncExternalStore(noop, ()=>true, ()=>false)`로 effect 없이 도출.

### S2 (전역 적용) 착수 가이드 — 후속 터미널용
1. `DisplaySettingsProvider`를 **`app/layout.tsx` 루트**로 끌어올린다(`LanguageProvider` 안쪽 권장).
2. `app/settings/page.tsx`의 **로컬 `<DisplaySettingsProvider>` 래퍼를 제거**(중첩 무해하나 단일 마운트가 정석).
3. 시세 표시 컴포넌트(시세 스트립·코인룸·analysis·watchlist 표 등)에서 `useDisplaySettings()` 구독 →
   - 가격: `formatPrice(usdValue)` 로 USD↔KRW 전환
   - 등락 색: `changeColorClass(value)` 또는 `getChangeColorClass(value, changeColor)` 로 한국식/글로벌 전환
4. `app/layout.tsx`는 **T-B 쓰기 영역 밖**이라 S1에서 건드리지 않음 — S2(또는 nav 담당)가 수행.

---

## 3. 검증

- ✅ `npx tsc --noEmit` — 통과(에러 0).
- ✅ `npx eslint app/settings components/Settings lib/config/display-settings.tsx lib/config/local-data.ts` — 통과(에러/경고 0).
- 수동 검증 항목(설계 의도):
  - 통화 USD↔KRW 세그먼트 즉시 반영, KRW 선택 시 `/api/kimchi` 환율로 환산.
  - 등락 색상 한국식↔글로벌 즉시 토글 + 카드 내 미리보기(`▲ +1.58% / ▼ -0.74%`) 즉시 색 변경.
  - 데이터 초기화: confirm 후 `cm.watchlist.v1`·`cca:recent-symbols`·`cca:search-history` 삭제 + "초기화되었습니다" 안내. 설정(`cca:display`·`app-lang`)은 보존.
  - 새로고침 후 통화·색상 설정 유지(localStorage).
  - 계정 카드: 로그인 시만 노출(이메일+OAuth+로그아웃), 익명은 카드 0.
- ✅ 미구현 "구현 예정" 카드 **0** (전 항목 실동작).
- ✅ v2.0 네이버 톤: 그라디언트·블러·큰 라운드 잔재 제거, 보더 1px·`rounded-md`. 활성 토글=브랜드 그린(taste #7). 한국식 색상 기본(taste #4).
- ✅ 다크모드/언어/알림/2FA 미구현(솎아내기 §4 준수).
- ✅ SSOT 위반 0 (crypto/stock 교차 임포트 없음).

---

## 4. TODO / 후속 의존

- **S2 (후속 터미널)**: §2 가이드대로 Provider를 루트로 올리고 시세 컴포넌트들이 구독. settings 페이지의 로컬 래퍼 제거.
- **T-D (nav)**: settings 진입점 = 계정 드롭다운 + 도구▼ **둘 다**(taste #5). 본 페이지는 `/settings`에 존재하므로 링크만 연결하면 됨.
- **T-A (watchlist) 키 정합**: `WatchlistCard` 개수/초기화는 `cm.watchlist.v1`(design-brief §2-3) 기준. T-A `useWatchlist`가 다른 키를 채택하면 `lib/config/local-data.ts`의 `WATCHLIST_STORAGE_KEY`·`LOCAL_DATA_KEYS`를 맞춰 갱신 필요.
- **회원 동기화 상태**: 현재 "켜짐/꺼짐"은 로그인 여부 기준 표시만. 실제 DB 동기화 토글·로직은 D3(T-A+T-C 합류) 후속.
- **최근 본 종목·검색 기록**: 키(`cca:recent-symbols`·`cca:search-history`)만 선등록. 해당 기능 구현 시 이 키로 기록하면 초기화에 자동 포함됨.

---

## 5. 격리 확인

- 쓰기 파일 전부 `app/settings/`·`components/Settings/`·`lib/config/` 내 — 허용 영역 밖 쓰기 **0**.
- `app/layout.tsx`(루트 Provider 마운트)는 영역 밖이라 미접촉 → S2/nav로 이관(§2-4).
- 타 일꾼 영역(T-A watchlist·T-C api/supabase·T-D common) 미접촉.
- **cs 미수행** (일꾼 규칙). 본 산출물은 미커밋 — R12 지휘자가 회수·통합·커밋.
