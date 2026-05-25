# Dispatch Checkpoint

- round: R6
- tag: polish
- started_at: 2026-05-25
- orchestrator: 지휘부(CEO) 세션
- terminals: 5 (T01~T05)
- hierarchy: flat
- status: phase-3-launch-ready

## 매트릭스
- T01: admin-e2e | `e2e/` | wave 1 | 독립
- T02: migration-normalize | `supabase/`·`docs/db/` | wave 1 | 독립
- T03: queries-ssot | `app/page.tsx`·`lib/community/queries.ts` | wave 1 | 독립
- T04: chart-colors | `components/Chart/*`·`DetailedChart`·`hero-chart`·`lib/chart/theme.ts` | wave 1 | 독립
- T05: token-unify | 전역 className | **wave 2** | T01~T04 통합 후

## 발사 순서
- Wave 1: T01 T02 T03 T04 (동시)
- Wave 2: T05 (Wave1 통합·커밋 후)

## 라이브 환경 메모 (사용자 고지 2026-05-25)
- R1~R5는 실제 프로덕션 배포 완료(라이브). 배포 = GitHub Release 발행 게이트, 마이그 자동적용 없음.
- T01만 라이브 DB 쓰기 → §2-1 안전장치(finally 정리·[E2E-TEST] 마커·잔여 0). 배포 검증은 코드까지만.

## 라운드 상태
- [ ] Wave1 발사
- [ ] Wave1 회수 (T01~T04 handover)
- [ ] Wave1 통합 검증 + 커밋
- [ ] Wave2 발사 (T05)
- [ ] Wave2 회수 + 통합 커밋
- [ ] R6 _SUMMARY 작성 + 마커 archive

## 이전 라운드
- R5 summary: docs/handover/2026-05-25-session30-r5.md (단독 세션, dispatch 아님)
- R4 summary: docs/handover/2026-05-25-R4-_SUMMARY.md
