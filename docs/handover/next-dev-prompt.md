# 다음 개발 프롬프트

> 최종 갱신: 2026-03-08

## 최근 완료된 작업

- **세션 4 (2026-03-08)**: Giscus 댓글 활성화 + Vitest 테스트 20개 도입 + any 타입 35개→1개 정리 (핵심 코드)
- **세션 3 (2026-03-08)**: 블로그 SEO 최적화 + 디자인 강화 — Typography 활성화, 서버/클라이언트 분리 (메타데이터), JSON-LD, robots.txt, sitemap 확장, 카드 깊이감, TOC 스크롤 하이라이팅, 코드 복사 버튼
- **세션 2 (2026-03-08)**: 블로그 확장 Phase 5 — RSS 피드, 동적 sitemap, 읽기 시간, Giscus 댓글, Admin 블로그 링크, 네비게이션 독립 배치, 시드 데이터 3글, Supabase 설정 완료
- **세션 1 (2026-03-08)**: 블로그 기능 전체 구현 (Phase 1~4) — DB 스키마, SSOT, API 11개, TipTap 에디터, 관리자 UI, 공개 블로그 페이지, 네비게이션/번역/SEO

## 추천 다음 작업 (우선순위)

1. **Giscus App 설치** — https://github.com/apps/giscus 에서 kimdooo-a/coinchart 리포 연결 (수동, 1분)
2. **OG 이미지 자동 생성** — `app/blog/[slug]/opengraph-image.tsx` (Next.js ImageResponse)
3. **대형 파일 리팩토링** — `analysis/[symbol]/page.tsx` 807줄 분리
4. **테스트 커버리지 확대** — analysis, backtest, probability 모듈 테스트
5. **scripts/ any 타입 정리** — 45개 잔존 (낮은 우선순위)

## 알려진 이슈 및 주의사항

- ~~Supabase DB 마이그레이션~~ → 완료
- ~~Supabase Storage blog-images 버킷~~ → 완료
- ~~블로그 SEO 미성숙~~ → 80%로 개선
- ~~Giscus 미설정~~ → 코드 설정 완료, **App 설치만 필요**
- ~~테스트 프레임워크 미도입~~ → Vitest 20개 테스트 동작 중
- ~~any 타입 78회 사용~~ → 핵심 코드 1개 (라이브러리 호환), scripts/ 45개
- analysis/[symbol]/page.tsx 807줄 (리팩토링 필요)

## 빌드 상태

- Next.js 빌드: ✅ 성공
- TypeScript: ✅ 에러 없음
- Vitest: ✅ 20/20 통과
- Git: 미커밋 변경 6개 파일 존재
