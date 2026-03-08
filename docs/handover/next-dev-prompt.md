# 다음 개발 프롬프트

> 최종 갱신: 2026-03-08

## 최근 완료된 작업

- **세션 5 (2026-03-08)**: 블로그 에디터 티스토리급 강화 — TipTap extension 10개 추가 (Underline/Highlight/Color/Align/Table/YouTube), HTML 저장 전환, 자동저장, 뷰모드(편집/HTML/미리보기), 전체화면, DOMPurify 보안, D&D/paste 이미지
- **세션 4 (2026-03-08)**: Giscus 댓글 활성화 + Vitest 테스트 20개 도입 + any 타입 35개→1개 정리 (핵심 코드)
- **세션 3 (2026-03-08)**: 블로그 SEO 최적화 + 디자인 강화 — Typography 활성화, 서버/클라이언트 분리 (메타데이터), JSON-LD, robots.txt, sitemap 확장, 카드 깊이감, TOC 스크롤 하이라이팅, 코드 복사 버튼
- **세션 2 (2026-03-08)**: 블로그 확장 Phase 5 — RSS 피드, 동적 sitemap, 읽기 시간, Giscus 댓글, Admin 블로그 링크, 네비게이션 독립 배치, 시드 데이터 3글, Supabase 설정 완료
- **세션 1 (2026-03-08)**: 블로그 기능 전체 구현 (Phase 1~4) — DB 스키마, SSOT, API 11개, TipTap 에디터, 관리자 UI, 공개 블로그 페이지, 네비게이션/번역/SEO

## 추천 다음 작업 (우선순위)

1. **Giscus App 설치** — https://github.com/apps/giscus 에서 kimdooo-a/coinchart 리포 연결 (수동, 1분)
2. **에디터 Phase 2** — 예약 발행 (DB `scheduled_at` + cron), 비공개/비밀번호 글, 단축키 안내 모달
3. **OG 이미지 자동 생성** — `app/blog/[slug]/opengraph-image.tsx` (Next.js ImageResponse)
4. **대형 파일 리팩토링** — `analysis/[symbol]/page.tsx` 807줄 분리
5. **테스트 커버리지 확대** — analysis, backtest, probability 모듈 테스트

## 알려진 이슈 및 주의사항

- ~~Supabase DB 마이그레이션~~ → 완료
- ~~Supabase Storage blog-images 버킷~~ → 완료
- ~~블로그 SEO 미성숙~~ → 80%로 개선
- ~~Giscus 미설정~~ → 코드 설정 완료, **App 설치만 필요**
- ~~테스트 프레임워크 미도입~~ → Vitest 20개 테스트 동작 중
- ~~any 타입 78회 사용~~ → 핵심 코드 1개 (레거시 호환), scripts/ 45개
- ~~에디터 기능 부족~~ → 28개 버튼, HTML 저장, 자동저장, 뷰모드 완비
- analysis/[symbol]/page.tsx 807줄 (리팩토링 필요)
- `BlogPost.content` 타입이 union — 레거시 호환 제거 가능 (데이터 이미 HTML)
- Supabase 마이그레이션 히스토리 동일 날짜 중복 파일 — 리네이밍 권장

## 빌드 상태

- Next.js 빌드: ✅ 성공
- TypeScript: ✅ 에러 없음
- Vitest: ✅ 7/7 통과 (blog-utils)
- Git: 커밋 대기 중
