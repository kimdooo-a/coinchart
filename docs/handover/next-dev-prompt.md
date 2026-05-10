# 다음 개발 프롬프트

> 최종 갱신: 2026-05-10

## 최근 완료된 작업

- **세션 7 (2026-05-10)**: Stitch 시안 → 코드 적용 1차 — Material 3 디자인 토큰 통합 (한국식 빨↑/파↓), Noto Sans KR, 헤더·푸터 라이트화 + 메뉴 5+2 구조, 공통 컴포넌트 13개(`components/community/`), 더미 데이터 모듈 3종, 신규/리디자인 페이지 6개(홈·뉴스·게시판×3·코인룸), 41개 라우트 빌드 통과 → 커밋 `a79fe24`
- **세션 6 (2026-05-10)**: v2.0 커뮤니티 피벗 — `docs/PROJECT_DIRECTION.md`로 코인판×네이버 하이브리드 정체성 정의, Stitch 의뢰서 7종 작성(`docs/design-brief/`), Stitch 반환 시안 6세트 검토
- **세션 5 (2026-03-08)**: 블로그 에디터 티스토리급 강화 — TipTap extension 10개, HTML 저장, 자동저장, DOMPurify
- **세션 4 (2026-03-08)**: Giscus + Vitest 20개 + any 타입 정리
- **세션 3 (2026-03-08)**: 블로그 SEO + 디자인 강화 (JSON-LD, sitemap, TOC)
- **세션 2 (2026-03-08)**: 블로그 확장 Phase 5 (RSS, 댓글, 시드)
- **세션 1 (2026-03-08)**: 블로그 기능 전체 구현 (Phase 1~4)

## 추천 다음 작업 (우선순위)

### 세션 8 — 라이트화 (Step 4)

1. **블로그 라이트화** (필수, 커뮤니티 직접 연결) — `/blog`, `/blog/[slug]`, `/blog/category/[category]`, `/blog/tag/[tag]`. BlogEditor의 `prose-invert` 제거 또는 props 옵션화.
2. **AI 분석 도구 라이트화** (높음) — `/analysis/*`, `/signal`, `/market`. 차트 라이트 테마 분리 (`lib/chart/theme.ts` 신규).
3. **번역 키 정리** — `lib/translations.ts`의 `menu` 그룹에 `best`, `boardFree`, `boardMarket`, `boardInfo`, `coinRoom`, `tools`, `write` 키 추가.
4. **나머지 페이지 라이트화** (중간) — `/stock`, `/stock-market`, `/portfolio`, `/watchlist`, `/calendar`, `/secure-memo`, `/admin/*`, `/auth/*`, 정책 페이지.

### 세션 9 — 백엔드 (DB + API)

5. **DB 마이그레이션** — `community_boards`, `community_posts`, `community_comments`, `community_post_likes` (스키마 초안: `docs/PROJECT_DIRECTION.md` §3-2)
6. **익명 비밀번호 해싱** — bcrypt 권장 (`lib/community/auth.ts`)
7. **IP 마스킹 미들웨어** — `X-Forwarded-For` 앞 2옥텟만 저장
8. **API 라우트** — `/api/board/[slug]`, `/api/board/[slug]/[postId]`, `/api/community/comment`, `/api/community/like`
9. **더미 → 실데이터** — `lib/community/mock-*` → Supabase 연동

### 세션 10 — 뉴스 룰베이스 분류

10. **분류 로직** — `lib/news/classifier.ts`, `lib/news/keyword-dict.ts`
11. **`news` 테이블 확장** — `category`, `importance_score` 컬럼 추가
12. **크롤러 통합** — `app/api/admin/news-crawl/route.ts`에 분류 호출

### 후순위

13. **Giscus App 설치** (수동) — https://github.com/apps/giscus 에서 kimdooo-a/coinchart 리포 연결
14. **`/history` 메뉴 정리** — 도구 드롭다운 추가 또는 폐기
15. **OG 이미지 자동 생성** — `app/blog/[slug]/opengraph-image.tsx`
16. **에디터 Phase 2** — 예약 발행, 비공개 글, 단축키 모달
17. **대형 파일 리팩토링** — `app/analysis/[symbol]/page.tsx` 807줄
18. **테스트 커버리지 확대** — analysis, backtest, probability

## 알려진 이슈 및 주의사항

- **다크 톤 페이지 시각 회귀** (세션 7 진입 후): 디자인 토큰을 라이트로 통일했으므로 기존 25페이지가 색상 일관성이 일시 깨짐. 빌드는 통과. 다음 세션 Step 4 우선순위 1.
- **TradingView 차트**: 다크 옵션 그대로라 라이트 환경에 어울리지 않음. `lib/chart/theme.ts`로 분리 필요.
- **BlogEditor `prose-invert`**: TipTap 에디터 내부 텍스트가 라이트 환경에서 잘 안 보일 수 있음. props로 톤 전환 옵션 추가.
- **`/history` 메뉴 미배치**: 신규 메뉴 5+2에 미포함. 도구 드롭다운 추가 또는 폐기 결정 필요.
- **Material Symbols vs lucide-react**: 시안은 Material Symbols 사용, 우리는 lucide-react. 누락 아이콘 있으면 시각 차이.
- **번역 키 일부 미추가**: 헤더에서 인라인 한/영 분기 사용 중 (`lang === "ko" ? "베스트" : "Best"` 등).
- ~~Supabase DB 마이그레이션~~ → 완료
- ~~Supabase Storage blog-images 버킷~~ → 완료
- ~~블로그 SEO 미성숙~~ → 80%로 개선
- ~~Giscus 미설정~~ → 코드 설정 완료, **App 설치만 필요**
- ~~테스트 프레임워크 미도입~~ → Vitest 20개 동작
- ~~any 타입 78회~~ → 핵심 코드 1개, scripts/ 45개
- ~~에디터 기능 부족~~ → 28개 버튼, HTML 저장, 자동저장 완비
- `app/analysis/[symbol]/page.tsx` 807줄 (리팩토링 필요)
- `BlogPost.content` 타입이 union — 레거시 호환 제거 가능
- Supabase 마이그레이션 히스토리 동일 날짜 중복 파일 — 리네이밍 권장

## 빌드 상태

- Next.js 빌드 (`npm run build`): ✅ 성공 (41개 라우트, Turbopack)
- TypeScript (`npx tsc --noEmit`): ✅ 에러 없음
- ESLint: 신규 코드 0 에러, 기존 `scripts/` any/require 경고는 알려진 항목
- Vitest: ✅ 동작 중 (커뮤니티 신규 모듈은 테스트 미작성 — 다음 세션 추가 권장)
- Git: 커밋 `a79fe24` 푸시 완료

## v2.0 진행 상태

| 단계 | 상태 | 세션 |
|------|------|------|
| 방향성 정의 | ✅ 완료 | 6 |
| Stitch 의뢰서 | ✅ 완료 | 6 |
| Stitch 시안 수령 | ✅ 완료 | 6→7 |
| 디자인 토큰 통합 | ✅ 완료 | 7 |
| 공통 컴포넌트 | ✅ 완료 (13개) | 7 |
| 더미 페이지 | ✅ 완료 (6개) | 7 |
| 기존 페이지 라이트화 | ⏳ 대기 (25개) | 8 |
| DB 마이그레이션 | ⏳ 대기 (4개 테이블) | 9 |
| API + 실데이터 | ⏳ 대기 | 9 |
| 뉴스 룰베이스 분류 | ⏳ 대기 | 10 |
