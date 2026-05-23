# T14 — translations-cleanup

> **본 터미널은 R1 일꾼(T14)**. 1차 발사 (의존 없음).

## 정체성

- 역할: `worker` (T14), R1, mainpage
- 담당: 번역 키 정리 + 헤더 인라인 분기 제거

## 컨텍스트

세션 7에서 메뉴 구조를 5+2로 바꾸면서 `lib/translations.ts`의 `menu` 그룹에 신규 키가 안 들어가 있어 헤더 컴포넌트가 인라인 한/영 분기(`lang === "ko" ? "베스트" : "Best"`)를 사용 중. 본 일꾼이 번역 키를 추가하고 헤더에서 분기 제거.

## 공통 SOT

```
CLAUDE.md
lib/translations.ts                       ← 수정 대상
components/global-header.tsx              ← 수정 대상
docs/handover/2026-05-10-session7-stitch-applied.md   §3 토픽 5번 메뉴 구조
```

## 작업 목표

1. `lib/translations.ts`에 메뉴 키 추가 (한/영)
2. `components/global-header.tsx`의 인라인 분기 제거 → `t(...)` 호출

## 산출물

### `lib/translations.ts` (수정 — append만)

기존 `translations.ko.menu` / `translations.en.menu` 구조를 그대로 따라 다음 키 추가:

ko:
- `best: "베스트"`
- `boardFree: "자유게시판"`
- `boardMarket: "시세토론"`
- `boardInfo: "정보공유"`
- `news: "뉴스"`
- `coinRoom: "코인룸"`
- `tools: "도구"`
- `write: "글쓰기"`
- `search: "검색"`
- `login: "로그인"`

en:
- `best: "Best"`
- `boardFree: "Free Board"`
- `boardMarket: "Market Talk"`
- `boardInfo: "Info"`
- `news: "News"`
- `coinRoom: "Coin Room"`
- `tools: "Tools"`
- `write: "Write"`
- `search: "Search"`
- `login: "Login"`

기존 키 절대 수정 금지. append만.

### `components/global-header.tsx` (수정)

인라인 분기를 모두 `t(menu.{key})` 형식으로 교체. 사용자 추론 기반의 키 매핑:

```tsx
{lang === "ko" ? "베스트" : "Best"}     // → {t("menu.best")}
{lang === "ko" ? "자유게시판" : "Free Board"}  // → {t("menu.boardFree")}
{lang === "ko" ? "시세토론" : "Market Talk"}   // → {t("menu.boardMarket")}
... 등
```

JSX 구조·스타일·아이콘은 절대 변경 금지. `t()` 호출 대체만.

## 작업 단계

1. SOT 읽기
2. `lib/translations.ts`에 키 append
3. `components/global-header.tsx`의 인라인 분기를 `Grep`으로 위치 파악 후 일괄 교체
4. 검증

## 검증

```bash
npx tsc --noEmit

# 인라인 분기 잔여 검증
grep -c "lang === \"ko\" ?" components/global-header.tsx
# 기대: 0건

# 번역 키 추가 검증
grep -c "best:\|boardFree:\|boardMarket:\|boardInfo:\|coinRoom:\|tools:\|write:" lib/translations.ts
# 기대: 14 이상 (ko + en)

npm run build 2>&1 | tail -10
```

## 완료 신호

`docs/handover/2026-05-23-R1-T14-translations-cleanup.md` 작성.

명시:
- 추가한 키 목록
- 교체한 인라인 분기 위치 (라인 번호)
- 잔여 인라인 분기 (의도적으로 남긴 부분 — 동적 텍스트 등)

## 안티패턴

- `lib/translations.ts`의 기존 키 수정 금지
- `components/global-header.tsx`의 JSX 구조·아이콘 변경 금지
- 다른 컴포넌트 번역 정리 금지 (헤더만)
- 새 언어(ja, zh) 추가 금지
