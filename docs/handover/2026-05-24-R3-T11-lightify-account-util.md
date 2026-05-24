# R3-T11 인수인계 — lightify-account-util

- **날짜**: 2026-05-24
- **라운드/일꾼**: R3 (community-finish) / T11 (12, Wave 1 독립)
- **상태**: 완료
- **의존**: 없음 (Wave 1 독립). T09·T10·T12와 디렉토리 분리
- **선행 참조**: R1-T09(blog-lightify), R1-T11(signal-market-lightify) 클래스 매핑 표 · 의미 컬러 보존 원칙

## 작업 목표

세션 7 디자인 토큰 라이트 전환 이후에도 다크 톤으로 남아 있던 **계정/유틸 인터랙티브 페이지 묶음**(포트폴리오·관심종목·캘린더·설정·시크릿 메모)과 SecureMemo 컴포넌트 4종을 라이트 토큰으로 통일. JSX 구조·로직·라우팅 무변경, **순수 클래스 교체만** 수행. 보안 상태 표시 의미 컬러와 빨↑/파↓ 시세 의미 컬러는 보존.

## 토큰 체계 결정

대상 페이지들이 이미 shadcn 시맨틱 토큰(`bg-background`·`bg-card`·`bg-muted`·`text-foreground`·`text-muted-foreground`·`border-border`·`text-destructive`)을 주로 사용 중이라, **파일 내 일관성**을 위해 shadcn 토큰 체계로 통일(R1 일꾼들의 `surface-container`/`on-surface` 토큰 대신). `app/globals.css`에서 두 체계는 동일 라이트 값으로 별칭됨:

```
--color-card / --color-popover / --color-background = surface-container-lowest (#ffffff)
--color-muted = surface-container (#ecedfa)   --color-muted-foreground = on-surface-variant (#424656)
--color-foreground = on-surface (#191b24)     --color-border = outline-variant (#c2c6d8)
```

> 참고: `--color-secondary`는 브랜드 그린(#006e2e)이므로 중립 취소 버튼에는 사용 불가 → 중립 표면/버튼은 `bg-muted` 사용.

## 수정한 파일 목록 (8개)

| 파일 | diff(+/-) | 교체 내용 |
|------|-----------|----------|
| `app/portfolio/page.tsx` | 20/20 | 요약·표 카드 보더(`border-white/10`), 표 base 텍스트·thead(`bg-black/40 text-gray-200`)·tbody(`divide-white/10 bg-black/20`)·행 hover(`hover:bg-white/5`)·셀 텍스트(`text-gray-300/400`) |
| `app/watchlist/page.tsx` | 3/3 | 헤더·섹션 카드 보더, 안내문 `text-gray-300` |
| `app/settings/page.tsx` | 3/3 | 헤더·섹션 카드 보더, 그룹 설명 `text-gray-300` |
| `app/secure-memo/page.tsx` | 2/2 | 빈 상태 아이콘 원형(`bg-gray-800/50`)·잠금 아이콘(`text-gray-600`) |
| `components/SecureMemo/MemoCard.tsx` | 3/3 | 카드 보더(`border-white/10`)·삭제 버튼 base(`text-gray-500`)·하단 구분선(`border-white/5`) |
| `components/SecureMemo/MemoCreateModal.tsx` | 13/13 | 스크림·패널(`bg-[#111]`)·닫기 X·제목·라벨 ×4·입력 ×4(`bg-[#1a1a1a]`)·취소 버튼 |
| `components/SecureMemo/MemoUnlockModal.tsx` | 8/8 | 스크림·패널·닫기 X·제목·안내문·라벨·입력·취소 버튼 |
| `components/SecureMemo/MemoViewModal.tsx` | 19/19 | 스크림·패널·닫기 X·제목 ×2·편집/삭제 버튼·내용 박스(`bg-[#1a1a1a]`)·pre·닫기 버튼·라벨 ×4·입력 ×4·취소 버튼 |

`git diff --stat` 합계: **8 files, 71/71 insertions·deletions** — 정확히 좌우 대칭 (순수 클래스 토큰 교체).

## 수정 불필요로 확정한 파일 (1개)

| 파일 | 사유 |
|------|------|
| `app/calendar/page.tsx` | 다크 톤 부재. 이미 shadcn 시맨틱 토큰(`bg-card`·`bg-muted`·`text-foreground`·`text-muted-foreground`·`border-border`·`text-destructive`)만 사용. high-impact 점 표시는 `bg-destructive`(의미 컬러)로 보존 대상 |

## 클래스 교체 매핑 표

| 다크 톤 (실제 팔레트) | 라이트 토큰 | 비고 |
|---|---|---|
| `bg-black/40` (표 thead) | `bg-muted` | |
| `bg-black/20` (표 tbody) | `bg-muted/30` | |
| `bg-black/80` (모달 스크림) | `bg-foreground/60` | foreground(#191b24)≈near-black, `bg-black` 잔여 제거하며 디밍 의미 유지 |
| `bg-[#111]` (모달 패널) | `bg-popover` | 다이얼로그 표면 토큰 |
| `bg-[#1a1a1a]` (입력/내용 박스) | `bg-muted` | 흰 패널과 구분되는 옅은 표면 (원본의 패널≠입력 음영 관계 유지) |
| `bg-gray-800/50` (빈 상태 원형) | `bg-muted` | |
| `bg-gray-800 hover:bg-gray-700` (취소 버튼) | `bg-muted hover:bg-muted/70` | |
| `border-gray-800`, `border-white/10`, `border-white/5` | `border-border` | |
| `divide-white/10` | `divide-border` | |
| `hover:bg-white/5` (행 hover) | `hover:bg-muted/50` | |
| `text-gray-200` (thead/pre), `text-gray-300` (셀/본문/취소 버튼) | `text-foreground` | |
| `text-gray-400` (표 base/라벨/날짜), `text-gray-500` (닫기 X·삭제 base), `text-gray-600` (빈 상태 아이콘) | `text-muted-foreground` | |
| `hover:text-white` (닫기 X) | `hover:text-foreground` | |

## 의도적으로 보존한 색 (보안 상태 / 시세 / 액센트)

전부 채도 높은 자체 배경 위 컬러이거나 의미론적 신호 → 보존. R1-T11 보존 원칙과 동일.

| 위치 | 클래스 | 사유 |
|------|--------|------|
| `app/portfolio/page.tsx:228,234,293` | `text-green-400` / `text-red-400` | **시세 의미 컬러** — P&L·수익률 상승(녹)/하락(적) |
| `app/portfolio/page.tsx:342` | `bg-green-900/40 text-green-400` / `bg-red-900/40 text-red-400` | **시세 의미 컬러** — BUY(녹)/SELL(적) 거래 뱃지 |
| `app/portfolio/page.tsx:274` | `bg-gradient-to-br from-indigo-500 to-purple-500 ... text-white` | 그라데이션 아바타 위 흰 글씨 가독성 |
| `app/secure-memo/page.tsx:104,116,150` | gradient / `bg-indigo-600` + `text-white` | 헤더 아이콘·신규 메모·빈 상태 버튼 (액센트 배경 위 흰 글씨) |
| `app/secure-memo/page.tsx:127·130`, `MemoCreateModal:163·165`, `MemoViewModal:229·231` | `bg-yellow-500/10 border-yellow-500/20 text-yellow-400` | **보안 상태 경고** — 비밀번호 분실 시 복구 불가 경고 배너 |
| `components/SecureMemo/MemoCard.tsx:48,56` | gradient `text-white` / `bg-yellow-500/20 text-yellow-400` "locked" 뱃지 | 잠금 아이콘 + **보안 상태(잠김) 표시 뱃지** |
| `MemoCreateModal:187`, `MemoUnlockModal:91·133`, `MemoViewModal:260` | gradient `text-white` (제출/잠금해제/저장 버튼·아이콘) | 액센트 그라데이션 위 흰 글씨 |
| `MemoCreateModal:170-171`, `MemoUnlockModal:116-117`, `MemoViewModal:236-237` | `bg-red-500/10 border-red-500/20 text-red-400` | **에러 메시지 의미 컬러** |
| `focus:border-indigo-500`, `hover:border-indigo-500/30`, `hover:text-indigo-400`, `hover:text-red-400` | (입력 포커스·카드 hover·편집/삭제 hover) | 인터랙션 액센트 보존 |

## 검증 결과

| 항목 | 명령 | 결과 |
|------|------|------|
| 타입 체크 | `npx tsc --noEmit` | **PASS** (exit 0, 에러 0건) |
| 엄격 잔여 다크 grep | `grep -rnE "bg-black\|bg-(gray\|slate\|zinc)-(8\|9)[0-9]{2}\|text-white\|dark:" <대상 6경로>` | `bg-black`·`bg-gray-8/9xx`·`dark:` **0건**. `text-white` 9건은 전부 indigo/purple 그라데이션·액센트 버튼 위 보존분 (아래 목록) |
| 광역 잔여 다크 grep | `grep -rnE "#111\|#1a1a1a\|bg-gray-[0-9]\|border-gray-[0-9]\|border-white/\|divide-white/\|bg-white/\|text-gray-[1-6]"` | **0건** |
| diff 대칭 | `git diff --stat` | 8 files, **71/71** (좌우 대칭) |
| 빌드 회귀 | `npm run build` | **BUILD_EXIT=0** — `/portfolio`·`/watchlist`·`/calendar`·`/settings`·`/secure-memo` 모두 ○ 정적 프리렌더 정상 등록 |

### 잔여 `text-white` 9건 (전부 보존 대상, R1-T11 9건 선례와 동일 구조)

1. `app/portfolio/page.tsx:274` — 보유자산 아바타 (indigo→purple 그라데이션)
2. `app/secure-memo/page.tsx:104` — 헤더 ShieldCheck 아이콘 (그라데이션)
3. `app/secure-memo/page.tsx:116` — "새 메모" 버튼 (그라데이션)
4. `app/secure-memo/page.tsx:150` — 빈 상태 버튼 (`bg-indigo-600`)
5. `components/SecureMemo/MemoCard.tsx:48` — 잠금 아이콘 (그라데이션)
6. `components/SecureMemo/MemoCreateModal.tsx:187` — 저장 버튼 (그라데이션)
7. `components/SecureMemo/MemoUnlockModal.tsx:91` — 잠금 아이콘 (그라데이션)
8. `components/SecureMemo/MemoUnlockModal.tsx:133` — 잠금 해제 버튼 (그라데이션)
9. `components/SecureMemo/MemoViewModal.tsx:260` — 저장 버튼 (그라데이션)

## 안티패턴 준수 확인

- ✅ `app/analysis/`·`app/admin/`·`app/{contact,...}` 미터치 (T09·T10·T12 영역)
- ✅ SecureMemo 보안 상태(잠김 뱃지·암호화 경고)·시세 의미 컬러(BUY/SELL·P&L) 무차별 제거 없음 — 전부 보존
- ✅ JSX 구조·로직 무변경 (클래스 교체만, diff 71/71 대칭)
- ✅ 한국어 주석 유지 (신규 주석 없음 — 클래스 교체만 발생)
- ✅ 새 패키지 설치·다크 모드 토글 추가 없음

## 시각 회귀 검증 안내 (PARTIAL)

`npm run build` 성공 확인. 시각 회귀는 dev 서버에서 수동 확인 권장:

```bash
npm run dev
# /portfolio  — 요약 카드(흰 표면+border-border), 표 thead(bg-muted)/행 hover(bg-muted/50), P&L 녹/적 보존
# /watchlist  — 헤더 구분선, "준비 중" 카드 안내문(text-foreground)
# /calendar   — (미수정) 이미 라이트, high-impact 점 destructive 보존
# /settings   — 설정 그룹 카드 보더·설명 텍스트
# /secure-memo — 빈 상태(bg-muted 원형), 경고 배너(노랑) 보존, 모달 3종(흰 패널 bg-popover, 입력 bg-muted, 그라데이션 버튼 보존)
```

## 후속 권장 (선택)

- **보안 경고 배너 가독성**: 라이트 배경에서 `text-yellow-400`/`text-red-400`의 대비가 다크 시절보다 낮음. 의미 컬러는 보존했으나, 완전한 라이트 톤 가독성을 원하면 후속 라운드에서 경고=`yellow-700`/에러=`red-600` 등 대비 상향 검토 가능 (본 일꾼은 "의미 컬러 무차별 제거 금지" 안티패턴 준수 위해 색조 변경 보류).
- **토큰 체계 통일**: 본 묶음은 shadcn 토큰(`bg-muted` 등), R1 blog/signal 일꾼은 `surface-container-*` 토큰 사용. globals.css에서 동일 값 별칭이라 시각 동일하나, 추후 단일 체계 통일 검토 권장 (R1-T11 handover line 122와 동일).
