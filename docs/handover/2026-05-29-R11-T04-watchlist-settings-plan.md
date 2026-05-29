# 인수인계 — R11 / T04: watchlist·settings 신규 기능 기획

> 작성일: 2026-05-29
> 터미널 역할: R11-reconcile-refactor Wave 1 / **T04 일꾼**
> 성격: **기획·스펙 산출만** (코드 미작성 — 구현은 R12+)
> 쓰기 영역: `docs/design-brief/` (격리 준수, 코드·`docs/references/` 미접촉)

---

## 1. 산출 기획 문서

| 경로 | 구성 |
|------|------|
| `docs/design-brief/06-watchlist-settings.md` (신규) | 0.위치 / 1.현황분석 / 2.watchlist기획 / 3.settings기획 / 4.솎아내기결론 / 5.구현로드맵+미결정 / 6.Stitch지시 / 7.검증 / 8.다음단계 |
| `docs/design-brief/README.md` (수정) | 의뢰서 목록 표에 06 행 추가 (인덱스 등록) |

- 기존 design-brief 양식(00~05) 일관: 화면 와이어 ASCII, 섹션별 명세, 더미/Stitch 지시, 다음 단계 체크리스트.
- 근거 기반(추측 금지): `app/watchlist/page.tsx`·`app/settings/page.tsx`(스텁), `PROJECT_DIRECTION.md`, `00-overview.md`, `_SCHEMA_REFERENCE.md`(community/secure_memos), `_API_REFERENCE.md`(ticker/quote/kimchi), `lib/supabase/crypto.ts` 정독.

---

## 2. watchlist — 핵심 결정과 근거

- **인증 모델 = localStorage(익명) + DB 동기화(회원) 2단계**
  - 근거: community 익명 모델(글마다 닉+비번)은 즐겨찾기에 부적합(별 누를 때마다 비번 불가). 즐겨찾기는 공개 콘텐츠가 아닌 순수 개인 상태 → IP마스킹·추천dedup 등 community 장치 전부 불필요.
  - 익명=서버 0(localStorage), 회원=기기 간 동기화(부가가치). 회원 강제 없음(코인판 정신 정합).
- **데이터 모델 = `user_watchlist`** (회원 동기화 단계에서만 DB)
  - `community_*`(게시판) 차용 안 함. `secure_memos`의 개인 소유 패턴(user_id FK + 본인 RLS) 따름.
  - 컬럼: `user_id, asset_type(CRYPTO/STOCK), symbol, sort_order, created_at`, UNIQUE(user_id,asset_type,symbol).
  - 심볼 표기: CRYPTO=`BTCUSDT`(Binance pair), STOCK=`AAPL`(티커) — 각 SSOT 입력 형식과 일치.
- **API = 시세는 신규 0개** (`/api/coins/ticker?symbols=`·`/api/stock/quote` **재사용**). 신규 4개는 모두 회원 동기화용(`GET/POST/DELETE /api/watchlist` + `/api/watchlist/sync`). **MVP는 신규 API 없이 localStorage만으로 시세 표시까지 완결**.
- **알림**: 이메일/웹푸시는 인프라 필요 → v3.0(PROJECT_DIRECTION §10). MVP는 즐겨찾기+실시간 시세 표시까지.

---

## 3. settings — 솎아내기 결과

**뺀 것 (스텁 3그룹 전부 MVP 제외)**:
- 🔔 알림(이메일/푸시) → watchlist 알림이 v3.0이라 의존 대상 부재 + 익명에 이메일 불가
- 🛡 보안(비밀번호/2FA) → 회원이 OAuth(구글/카카오) 중심이라 자체 비번·2FA는 이중관리·과설계
- 🎨 테마/언어 → 테마=1차 라이트 고정(v2.1 다크), 언어=헤더에 이미 존재(중복)

**남긴 것 (익명에게도 동작하는 클라이언트 표시 설정으로 재정의)**:
- 표시 설정: 시세 통화(USD/KRW), 등락 색상(한국식/글로벌)
- 관심종목: watchlist 바로가기 + 동기화 상태
- 데이터: 로컬 데이터 초기화
- 계정(회원만): 로그인 계정·OAuth 표시 + 로그아웃 (보안 그룹의 현실적 대체)

→ 재정의 핵심: 스텁의 "회원 SaaS 설정"을 v2.0 정체성(익명 1급·라이트 고정·OAuth)에 맞춰 변환. "구현 예정" 빈 껍데기 방지.

---

## 4. R12 구현 로드맵 요약

- **단계**: W1(watchlist localStorage MVP) · S1(settings 표시설정) · D1(`user_watchlist` 마이그레이션)이 **상호 독립=병렬 가능**. W2(현장 ⭐토글) / S2(전역 적용) / D2(회원 API) / D3(동기화 합류)는 선행 의존.
- **MVP 경계**: W1+W2+S1+S2 = **익명 기준 완전 동작(서버 0)**. D1~D3는 회원 동기화 부가가치로 분리 출시 가능.
- **권장 분할**: T-A(watchlist), T-B(settings), T-C(DB·API) 3터미널.

### 미결정(taste) 항목 — 지휘자/사용자 결정 필요
1. 주식 시세 다건 조회: 배치 API 신설 vs 클라이언트 병렬 vs 쿼터 제한
2. 회원 전환 시 로컬↔DB 충돌 해소: 로컬 우선 병합(제안) vs DB 우선 vs 사용자 선택
3. 즐겨찾기 상한(익명 30 / 회원 100 등)
4. 등락 색상 기본값(한국식 고정 제안)
5. settings 진입점(회원 드롭다운 / 도구▼ / 둘 다)
6. 다크모드 시점(settings 테마를 v2.1 다크와 묶을지)
7. 브랜드 컬러(그린 vs 블루, `00-overview.md` §3-3) — 토글·CTA 색 직결, 상위 결정 대기

---

## 5. 검증 (T04 작업 자체)

- ✅ 기획 문서 자기완결(현황·기능·데이터·API·UI·인증·로드맵·미결정 전부 포함)
- ✅ 기존 design-brief 양식 일관 (와이어·명세·Stitch지시·체크리스트)
- ✅ v2.0 방향성 정합 (익명+회원 혼용, 라이트 고정, OAuth, 한국식 색상)
- ✅ 코드·스키마 근거 기반 (추측 기획 아님)
- ✅ 격리 준수: `docs/design-brief/`만 수정, 코드·`docs/references/` 미접촉
- ✅ 코드 미작성 (안티패턴 회피)

## 6. 후속 권장

- 지휘자: §4 미결정 7항목을 사용자 taste 결정으로 확정 → R12 착수 입력 확보.
- 본 터미널은 일꾼이므로 cs 미수행(통합 cs는 지휘자 담당).
