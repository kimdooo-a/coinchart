# T02 — /history 메뉴 정합 (도구 드롭다운 노출 정리)

## 1. 컨텍스트
- 프로젝트: Crypto Chart Analysis (코인 차트 분석) — Next.js 16 App Router. v2.0 커뮤니티 피벗(코인판×네이버). AI 차트 분석은 "도구" 메뉴로 격리(URL 유지).
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T02 / 3** (R9-tree-reconcile, Wave 1) — `/history` 라우트의 헤더 메뉴 노출 상태를 정합한다(도구 드롭다운에 추가하거나, 폐기 결정 시 라우트·메뉴·번역키 제거).
- 쓰기 영역(격리): `components/global-header.tsx`·`lib/translations.ts`·`app/history/`(폐기 결정 시).

## 2. 배경 — 핵심 사실 (지휘부 사전 검증)
- **`/history` 라우트 실존**: `app/history/page.tsx` 존재.
- **번역 키 존재**: `lib/translations.ts`에 `history: "코인 역사"`(ko) / `"History"`(en) 메뉴 라벨 + `history: { title: "코인 대서사시", desc: ... }` 카드 텍스트 존재(ko/en 양쪽).
- **헤더에 "도구 드롭다운" 존재**: `components/global-header.tsx` line ~64 `const tools: MenuDropdown = { label: t.menu.tools, ... }` — `coinRoom`·`tools` 두 그룹을 데스크탑/모바일 양쪽에서 렌더(`[coinRoom, tools].map(...)`).
- 즉 **폐기가 아니라 "메뉴 노출 정합" 문제**: `/history`가 도구 드롭다운에 들어있는지, 누락됐는지, 깨진 링크인지 확인 후 결정.

알려진 이슈(current.md/next-dev-prompt): "`/history` 메뉴 미배치 — 신규 메뉴 5+2에 미포함. 도구 드롭다운 추가 또는 폐기 결정 필요."

## 3. 공통 SOT (읽기 전용)
- `CLAUDE.md` — 메뉴 구조(5+2)·v2.0 피벗(AI 도구 격리)
- `docs/status/current.md` — "/history 메뉴 미배치" 이슈 맥락
- `app/history/page.tsx` — 페이지 실제 내용(살아있는 기능인지 판단 근거)
- `docs/orchestration/2026-05-29-R9-tree-reconcile/_INDEX.md` — 본 라운드 매트릭스·제약

## 4. 작업 목표

### Phase 1: 현황 확정
- `components/global-header.tsx`의 `tools` 드롭다운 구성 항목을 정독 → `/history`가 포함됐는지, 어떤 도구들이 노출되는지 확인.
- `app/history/page.tsx`를 열어 **기능이 살아있는지**(실데이터/정적/스텁) 판단.

### Phase 2: 결정 + 반영 (택1, handover에 사유 명시)
- **방안 A — 도구 드롭다운에 추가**: `/history`가 의미 있는 기능이면 `tools` 그룹에 항목 추가(라벨은 기존 `t.menu.history` "코인 역사" 재사용, 링크 `/history`). 아이콘은 기존 도구 항목과 일관(lucide-react).
- **방안 B — 폐기**: 기능이 미완/불필요하면 `app/history/` 라우트 제거 + 번역키 정리(`menu.history` 및 카드 텍스트 중 미사용분). 단 다른 곳에서 `/history`를 링크하는지 grep으로 먼저 확인 후 제거.
- 권장: **방안 A**(라우트·번역·페이지가 이미 존재하므로 노출만 정합하는 것이 보존적). 단 페이지가 명백히 스텁/미완이면 B 고려. 최종 판단은 일꾼이 `app/history/page.tsx` 내용을 보고 결정하되 사유를 handover에 기록.

### Phase 3: 검증
- 메뉴 추가/폐기 후 tsc·build 깨짐 0, `/history` 링크·라우트 정합.

## 5. 도구 권장
- Grep으로 `/history` 링크 사용처 전수 확인 후 편집. 헤더 메뉴 구조(`MenuDropdown` 타입)를 따라 일관되게 항목 추가.

## 6. 의존성
- **독립** (Wave 1). T01과 쓰기 영역 무충돌(T01은 `components/` 루트 dead, 본 터미널은 `global-header.tsx`).
- 본 터미널의 메뉴/라우트 변경은 **T03(레퍼런스 정합)의 입력**. handover에 변경 요약 기록.

## 7. 검증
```powershell
npx tsc --noEmit                       # 0
npm run build                          # green (라우트 수 변화 시 handover에 명시: 폐기면 53, 유지면 54)
# /history 링크 정합 — 폐기 시 잔존 링크 0, 유지 시 헤더에 노출
Select-String -Path app/**/*.tsx,components/**/*.tsx -Pattern '/history'
```
```bash
npx tsc --noEmit && npm run build
grep -rn "/history" app components --include=*.tsx
```

## 8. 완료 신호
`docs/handover/2026-05-29-R9-T02-history-menu.md` 작성. 포함 필수:
- 현황(도구 드롭다운 구성·`/history` 포함 여부·페이지 기능 상태)
- **결정(방안 A 추가 / B 폐기) + 사유**
- 변경 파일·변경 내용(메뉴 항목·번역키·라우트)
- 라우트 수 변화(54→? )·tsc 0·build green·`/history` 링크 정합 근거

## 안티패턴
- ❌ `app/page.tsx`·`components/` 루트 dead 컴포넌트 수정·삭제 (T01 전담)
- ❌ `docs/references/` 수정 (T03 전담 — handover에만 기록)
- ❌ `/history` 링크 사용처 확인 없이 라우트 폐기 (깨진 링크 발생)
- ❌ 번역키 한쪽 언어만 수정(ko/en 불균형)
- ❌ 한국어 주석·handover 누락
