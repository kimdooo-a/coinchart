---
title: kdydispatch — docs/references 갱신은 일꾼 발사 불가, 항상 지휘자 전담
date: 2026-06-13
session: 35
tags: [kdydispatch, write-guard, hooks, isolation, references, conductor]
category: pattern
confidence: high
---

## 문제

R9 라운드 설계 시 "레퍼런스 정합 갱신"(`_API_REFERENCE`·`_COMPONENT_MAP`·`_SCHEMA_REFERENCE`)을 T09 외부 일꾼 터미널로 발사하려 했다. 그러나 발사 전 hook 메커니즘을 점검하니, 이 작업은 **일꾼 역할로는 hook이 쓰기를 차단**해 수행 불가능했다.

## 원인

`.claude/hooks/dispatch-write-guard.ps1`(PreToolUse Edit/Write 가드)는 `role !== "ceo"`인 모든 역할(worker/lieutenant/squad)에 대해 **공통 SOT를 하드코딩으로 차단**한다:

```powershell
if ($role -ne "ceo") {
    $sotPatterns = @(
        "*\CLAUDE.md", "*\docs\references\*", "*\docs\rules\*",
        "*\.claude\settings.json", "*\.claude\hooks\*"
    )
    # 매칭 시 exit 2 (도구 호출 차단)
}
```

즉 `docs/references/` 경로는 `allowed_dirs`에 넣어도 **그 이전 단계에서 무조건 차단**된다. 이는 의도된 설계 — kdydispatch SKILL 규칙 "공통 SOT 읽기 전용 — `CLAUDE.md`·`docs/references/*` 수정 금지(**지휘자만**)"의 집행 장치다.

## 해결

레퍼런스 갱신 작업은 **외부 일꾼으로 발사하지 않고 지휘자(CEO)가 Phase 4 회수 후 직접 수행**한다. 지휘자 본 세션은 `DK_DISPATCH_ROLE`이 미설정(이미 부팅돼 SessionStart hook 재실행 안 됨)이라 write-guard가 pass하고, CEO 역할은 애초에 공통 SOT 예외(archive만 차단)다.

- 발사 워커 수를 N−1로 조정(R9: 10작업 → 9 발사 + T09 지휘자 직접).
- T09 통합 프롬프트(`T09-*.md`)는 그대로 작성하되, **지휘자 작업 명세**로 활용. T03(스키마 변경)·T04(API 변경) handover를 lazy 참조해 반영.
- 지휘자가 위임 에이전트(Agent 도구)로 처리해도 됨 — 본 세션 env에 role이 없어 그 Agent의 Write도 write-guard pass(충돌 0: 활성 일꾼 회수 완료 후라 CONDUCTOR_UNIVERSE ≈ 전체).

## 교훈

- **공통 SOT(`docs/references/`·`docs/rules/`·`CLAUDE.md`·`.claude/`) 갱신은 kdydispatch에서 일꾼 작업 단위가 될 수 없다.** Phase 1 작업 분해 시 이런 작업은 처음부터 "지휘자 직접" 트랙으로 분류하라.
- 코드 변경(스키마/API)과 그 레퍼런스 반영은 **분리**: 코드는 일꾼, 레퍼런스는 지휘자가 일꾼 handover를 회수해 반영. 일꾼은 handover에 "변경 시그니처/상태코드"를 명기만 한다(R9 T03·T04가 이 패턴 준수).

## 관련 파일
- `.claude/hooks/dispatch-write-guard.ps1` (공통 SOT 차단 로직 L54~80)
- `docs/orchestration/2026-06-13-R9-gap-verify/T09-reference-sync.md` (지휘자 명세로 활용)
- `docs/handover/2026-06-13-R9-_SUMMARY.md`
