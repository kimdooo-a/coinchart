# 다음 개발 프롬프트

> 최종 갱신: 2026-03-08

## 최근 완료된 작업

- **세션 2 (2026-03-08)**: 블로그 확장 Phase 5 — RSS 피드, 동적 sitemap, 읽기 시간, Giscus 댓글, Admin 블로그 링크, 네비게이션 독립 배치, 시드 데이터 3글, Supabase 설정 완료
- **세션 1 (2026-03-08)**: 블로그 기능 전체 구현 (Phase 1~4) — DB 스키마, SSOT, API 11개, TipTap 에디터, 관리자 UI, 공개 블로그 페이지, 네비게이션/번역/SEO

## 추천 다음 작업 (우선순위)

1. **Giscus 댓글 활성화** — GitHub repo Discussions 활성화 → `components/Blog/BlogComments.tsx`의 `GISCUS_CONFIG` 값 교체
2. **테스트 프레임워크 도입** — Vitest + Playwright 설정, 블로그 CRUD E2E 테스트
3. **any 타입 정리** — 78개 any 타입 제거/교체
4. **대형 파일 리팩토링** — `analysis/[symbol]/page.tsx` 807줄 분리
5. **블로그 이미지 업로드 E2E 테스트** — 이미지 업로드/표시 동작 확인

## 알려진 이슈 및 주의사항

- ~~Supabase DB 마이그레이션~~ → 완료
- ~~Supabase Storage blog-images 버킷~~ → 완료
- Giscus 미설정 (댓글 비활성 상태, 안내 메시지 표시 중)
- 테스트 프레임워크 미도입 (테스트 0개)
- any 타입 78회 사용
- analysis/[symbol]/page.tsx 807줄 (리팩토링 필요)

## 빌드 상태

- Next.js 빌드: ✅ 성공
- TypeScript: ✅ 에러 없음
- Git: ✅ clean, push 완료 (b97f263)
