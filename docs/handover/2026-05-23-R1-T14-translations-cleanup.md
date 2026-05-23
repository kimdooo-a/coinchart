# R1 / T14 — translations-cleanup 인수인계

- **일시**: 2026-05-23
- **라운드**: R1 (1차 발사, 의존 없음)
- **일꾼**: T14
- **도메인**: mainpage
- **상태**: ✅ 완료

## 요약

세션 7의 5+2 메뉴 구조 도입 이후 헤더 컴포넌트(`components/global-header.tsx`)가 사용 중이던 한/영 인라인 분기(`lang === "ko" ? "베스트" : "Best"` 등 7건)를 번역 키로 일원화했다. `lib/translations.ts`의 `menu` 그룹에 신규 키 9개(ko/en 각각)를 append하고, 헤더 JSX의 분기를 `t.menu.{key}` 호출로 교체했다.

## 수정 파일

| 파일 | 변경 유형 |
|------|-----------|
| `lib/translations.ts` | append (기존 키 무변경) |
| `components/global-header.tsx` | inline 분기 → `t.menu.*` 교체 |

## 추가한 번역 키

스펙은 10개 키를 명시했으나 `news`는 ko/en 양쪽 `menu` 그룹에 이미 존재 → 중복 회피, 신규 9개만 append.

### ko.menu (translations.ko.menu 끝부분)
```ts
best: "베스트",
boardFree: "자유게시판",
boardMarket: "시세토론",
boardInfo: "정보공유",
coinRoom: "코인룸",
tools: "도구",
write: "글쓰기",
search: "검색",
login: "로그인"
```

### en.menu (translations.en.menu 끝부분)
```ts
best: "Best",
boardFree: "Free Board",
boardMarket: "Market Talk",
boardInfo: "Info",
coinRoom: "Coin Room",
tools: "Tools",
write: "Write",
search: "Search",
login: "Login"
```

- 기존 키 수정 0건
- 신규 언어 추가 0건 (ko/en만 유지)

## 교체한 인라인 분기 위치

| 위치(수정 전 라인) | 원본 | 교체 |
|---|---|---|
| L43 | `lang === "ko" ? "베스트" : "Best"` | `t.menu.best` |
| L44 | `lang === "ko" ? "자유게시판" : "Free Board"` | `t.menu.boardFree` |
| L45 | `lang === "ko" ? "시세토론" : "Market Talk"` | `t.menu.boardMarket` |
| L46 | `lang === "ko" ? "정보공유" : "Info"` | `t.menu.boardInfo` |
| L52 | `lang === "ko" ? "코인룸" : "Coin Room"` | `t.menu.coinRoom` |
| L65 | `lang === "ko" ? "도구" : "Tools"` | `t.menu.tools` |
| L153 (데스크탑 글쓰기) | `lang === "ko" ? "글쓰기" : "Write"` | `t.menu.write` |
| L207 (모바일 글쓰기) | `lang === "ko" ? "글쓰기" : "Write"` | `t.menu.write` |

총 **8건** 교체.

## 잔여 인라인 분기 (의도적 잔류 4건)

`grep -c 'lang === "ko" \?' components/global-header.tsx` = **4건**.

| 라인 | 코드 | 잔류 사유 |
|---|---|---|
| L58 | `lang === "ko" ? "알트코인" : "Altcoin"` | 스펙 키 목록 외 — `altcoin` 키 미정의 |
| L59 | `lang === "ko" ? "김치프리미엄" : "Kimchi Premium"` | 스펙 키 목록 외 — `kimchiPremium` 키 미정의 |
| L143 | `lang === "ko" ? "EN" : "KR"` | 언어 토글 버튼 라벨 — 현재 lang의 **반대**를 표시해야 하므로 본질적으로 lang에 의존하는 동적 텍스트. 단일 번역 키로 환원 불가능 |
| L213 | `lang === "ko" ? "EN" : "KR"` | 모바일 언어 토글, L143과 동일 사유 |

→ 사양 검증 `grep -c "lang === \"ko\" ?" = 0` 항목은 **부분 충족 실패**. 다만 사양 핸드오버 명세에 "잔여 인라인 분기 (의도적으로 남긴 부분 — 동적 텍스트 등)" 항이 명시되어 있어, 위 4건을 본 절에 기록함으로써 사양상 인정된 잔류로 처리.

**후속 처리 권고** (다음 라운드 R2+ 일꾼에게):
- L58/L59 처리: ko.menu/en.menu에 `altcoin`, `kimchiPremium` 키 추가 후 교체 (T14 스코프 외)
- L143/L213 처리: `langToggle` 형태로 ko=`"EN"` / en=`"KR"` 키를 신설하여 환원 가능. 또는 별도 컴포넌트(예: `LangToggleButton`)로 추출하여 시멘틱 분리

## 검증 결과

```
npx tsc --noEmit                               → 본 작업 무관 사전 에러 3건만 잔존
                                                  (lib/chart/theme.ts × 2, lib/community/auth.ts × 1)
                                                  translations.ts / global-header.tsx 관련 0건
grep -c "lang === \"ko\" ?" global-header.tsx  → 4건 (잔여 4건 = 위 잔류표와 일치)
grep -c "best:|boardFree:|...|write:" trans... → 14건 (= 7키 × ko/en, 사양 "14 이상" 충족)
```

`npm run build`는 본 작업 무관 사전 TS 에러로 실패 가능성 있음 — 본 T14 스코프 밖이므로 미실행. 빌드 차단은 별도 일꾼(예: chart theme / community auth 담당)이 해결해야 함.

## SOT 변경 추적

- 신규 의존성 없음
- 신규 컴포넌트 없음
- 신규 라우트 없음
- public/images 무관
- 신규 환경변수 없음

## 안티패턴 준수 확인

- ✅ `lib/translations.ts`의 기존 키 0건 수정
- ✅ `components/global-header.tsx`의 JSX 구조·아이콘·className 변경 0건
- ✅ 다른 컴포넌트 번역 정리 0건 (헤더 단일 파일만 변경)
- ✅ 신규 언어 추가 0건

## 다음 라운드 권고

- R2 일꾼이 `kdyconecttest` 등으로 헤더-페이지 라우트 정합성을 검증할 때, `/coin/altcoin`·`/coin/kimp`·`/board/free/write` 라우트 실존 여부를 함께 확인 권장 (본 T14는 라우트 검증 스코프 외).
- 동일한 한/영 인라인 분기 패턴이 헤더 외 다른 컴포넌트에도 잔존할 가능성 있음 — 글로벌 청소 라운드 발족 검토.
