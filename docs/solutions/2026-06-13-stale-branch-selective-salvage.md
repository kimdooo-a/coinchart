---
title: 스테일 분기 브랜치의 통합 판단 — 전체머지 대신 선별 회수
date: 2026-06-13
session: 50
tags: [git, merge, branch-management, merge-tree, selective-salvage, e2e]
category: workaround
confidence: high
---

## 문제

원격에 없는 로컬 전용 브랜치(`r9-gap-verify-local`, 세션35 R9, 4커밋)가 오래 방치되어
main과 크게 분기한 상태에서 "main과 통합"을 요청받음. 단순 `git merge`를 시도하면
대규모 충돌이 예상되고, 그 충돌을 수동 해결한 결과물이 실제로 가치가 있는지조차 불확실.

- 머지베이스 `c9abf66` 이후 main은 31커밋(세션36→49) 전진
- 브랜치 규모 100파일 / +5,900줄(코드+마이그레이션+e2e+세션 문서)
- 분기 기간 동안 main이 비슷한 작업(리팩토링·타입안전·community 기능)을 **독립적으로** 진행했을 가능성

## 원인

장기 분기 브랜치는 "앞선 커밋 수"만 보면 가치 있어 보이지만, 실제로는 main이 같은 목표를
독립 재구현해 **이미 구식화(superseded)**된 경우가 많다. 이를 확인하지 않고 머지하면
add/add·modify/delete 충돌을 수동 해결하는 데 큰 비용을 쓰고도 대부분 "main 쪽 채택"으로
귀결되어 순가치가 거의 없다.

## 해결

머지 전에 **"중복도 + 충돌도"를 정량 측정**하여 머지 vs 선별 회수 vs 폐기를 결정하는 절차:

```bash
# 1) divergence 측정 (앞/뒤 커밋 수)
git rev-list --left-right --count main...<branch>   # left=main ahead, right=branch ahead
git merge-base main <branch>

# 2) 브랜치 고유 변경 파일 + 신규/삭제 파일이 main에 실재하는지
git diff --stat <merge-base> <branch>
git cat-file -e HEAD:<path>   # 신규파일이 main에 이미 있나 / 삭제파일이 main에 남아있나

# 3) 양쪽이 동시 수정한 파일(충돌 후보) 교집합
comm -12 <(git diff --name-only <merge-base> main | sort -u) \
         <(git diff --name-only <merge-base> <branch> | sort -u)

# 4) 실제 충돌 dry-run (워킹트리 무오염)
git merge-tree --write-tree --name-only main <branch>   # CONFLICT 라인 = 실제 충돌 파일

# 5) 충돌이 크고 대부분 main이 우월하면 → 선별 회수:
#    main 미커버 고유 가치만 신규 파일로 포팅(중복 테스트/코드는 제외)

# 6) 브랜치 삭제 전 무손실 보존 (reflog 의존 X)
git tag -a archive/<branch> <branch> -m "아카이브 사유 + 복구법"
git branch -D <branch>
git push origin archive/<branch>   # 복구: git show archive/<branch> / git checkout -b x archive/<branch>
```

본 사례 결과: `merge-tree` ~31파일 충돌, R9 작업 대부분이 main에 독립 재구현 확인 →
전체머지 기각, e2e 고유 테스트 3건(N-D1/N-D2/N-D4)만 신규 파일로 회수, 나머지는 태그 보존 후 삭제.

## 교훈

- "앞선 커밋 수"가 아니라 **`merge-tree` dry-run + 신규/삭제 파일의 main 실재 여부**로 통합 가치를 판정하라. 장기 분기는 superseded가 기본값에 가깝다.
- 브랜치 삭제는 `git branch -D` 직전에 **annotated 태그로 박제**하면 무손실·비클러터(브랜치 목록 오염 없음)이며 reflog 만료와 무관하게 복구 가능하다.
- Bash 도구(Git Bash, POSIX sh)에서는 PowerShell heredoc(`@'...'@`)이 동작하지 않는다. 멀티라인 커밋 메시지는 `git commit -F - <<'EOF' ... EOF` 사용. (잘못 쓰면 메시지 앞뒤에 리터럴 `@`가 섞임 → 푸시 전 `--amend`로 교정.)

## 관련 파일
- `e2e/community-news-detail.spec.ts` (회수 산출물)
- `docs/handover/2026-06-13-session50-git-main-integration.md`
- git tag `archive/r9-gap-verify-local` (원본 브랜치 박제)
