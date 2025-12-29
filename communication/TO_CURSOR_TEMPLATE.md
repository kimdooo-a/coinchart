# 📋 TO_CURSOR 작업 지시 템플릿 가이드

이 문서는 `TO_CURSOR.md` 파일에 작업 지시를 작성할 때 사용하는 표준 템플릿입니다.

## 템플릿 구조

```markdown
[TO_CURSOR]

Objective:
- (구현 목표)

Target Path:
- (정확한 파일/디렉토리)

Implementation Notes:
- (제약, 스타일, 금지사항)

Dependencies:
- (연관 파일/모듈)

Done When:
- (완료 기준)
```

## 각 필드 설명

### Objective (구현 목표)
- **목적**: 이 작업이 달성해야 할 최종 목표를 명확히 기술
- **예시**: 
  - "사용자 인증 기능 구현"
  - "API 엔드포인트에 에러 핸들링 추가"
  - "컴포넌트 리팩토링으로 재사용성 향상"

### Target Path (정확한 파일/디렉토리)
- **목적**: 수정하거나 생성할 파일/디렉토리의 정확한 경로 지정
- **형식**: 
  - 단일 파일: `src/components/Button.tsx`
  - 디렉토리: `src/utils/`
  - 여러 파일: `src/api/*.ts`, `src/components/Header.tsx`
- **중요**: 상대 경로 또는 프로젝트 루트 기준 절대 경로 사용

### Implementation Notes (제약, 스타일, 금지사항)
- **목적**: 구현 시 준수해야 할 제약사항, 코딩 스타일, 금지사항 명시
- **포함 내용**:
  - 코딩 스타일 가이드 (예: TypeScript strict mode, 함수형 컴포넌트만 사용)
  - 아키텍처 제약 (예: 기존 패턴 준수, 특정 라이브러리 사용 금지)
  - 성능 요구사항 (예: 렌더링 최적화, 메모이제이션 필수)
  - 보안 고려사항 (예: 민감 정보 암호화, 입력 검증)

### Dependencies (연관 파일/모듈)
- **목적**: 이 작업과 연관된 다른 파일이나 모듈 나열
- **포함 내용**:
  - 참조해야 할 기존 파일
  - 함께 수정해야 할 관련 파일
  - 의존하는 외부 라이브러리나 모듈
  - 영향을 받는 다른 컴포넌트/함수

### Done When (완료 기준)
- **목적**: 작업이 완료되었다고 판단할 수 있는 명확한 기준 제시
- **형식**: 체크리스트 또는 명확한 조건
- **예시**:
  - "모든 단위 테스트 통과"
  - "TypeScript 컴파일 에러 없음"
  - "코드 리뷰 승인 완료"
  - "문서화 완료"

## 실제 사용 예시

### 예시 1: 새 컴포넌트 추가

```markdown
[TO_CURSOR]

Objective:
- 사용자 프로필 카드 컴포넌트 구현

Target Path:
- src/components/ProfileCard.tsx
- src/components/ProfileCard.test.tsx

Implementation Notes:
- React 함수형 컴포넌트만 사용
- TypeScript strict mode 준수
- Tailwind CSS 사용 (기존 스타일 시스템과 일관성 유지)
- 접근성(a11y) 고려 (ARIA 속성 포함)

Dependencies:
- src/types/user.ts (User 타입 정의)
- src/components/Avatar.tsx (아바타 컴포넌트 재사용)
- src/utils/formatDate.ts (날짜 포맷팅 유틸)

Done When:
- [ ] ProfileCard 컴포넌트 구현 완료
- [ ] 단위 테스트 작성 및 통과 (커버리지 80% 이상)
- [ ] TypeScript 컴파일 에러 없음
- [ ] Storybook 스토리 추가
- [ ] 접근성 테스트 통과
```

### 예시 2: API 엔드포인트 수정

```markdown
[TO_CURSOR]

Objective:
- 사용자 조회 API에 페이지네이션 기능 추가

Target Path:
- src/api/users.ts
- src/api/users.test.ts

Implementation Notes:
- 기존 API 호환성 유지 (기본값으로 기존 동작 보장)
- 페이지 크기 기본값: 20, 최대값: 100
- 에러 핸들링 강화 (400, 404, 500 에러 처리)
- 응답 타입 명시 (TypeScript 인터페이스 정의)

Dependencies:
- src/types/api.ts (PaginationResponse 타입)
- src/utils/validateQuery.ts (쿼리 파라미터 검증)
- src/middleware/auth.ts (인증 미들웨어)

Done When:
- [ ] 페이지네이션 파라미터 (page, limit) 지원
- [ ] 응답에 total, page, limit 필드 포함
- [ ] 단위 테스트 작성 및 통과
- [ ] API 문서 업데이트
- [ ] 기존 클라이언트 코드와 호환성 확인
```

### 예시 3: 리팩토링 작업

```markdown
[TO_CURSOR]

Objective:
- 중복된 유틸리티 함수 통합 및 모듈화

Target Path:
- src/utils/stringHelpers.ts (통합)
- src/utils/dateHelpers.ts (통합)
- src/utils/validation.ts (신규 생성)

Implementation Notes:
- 기존 함수 시그니처 유지 (하위 호환성 보장)
- JSDoc 주석 추가 필수
- 순수 함수 원칙 준수 (사이드 이펙트 없음)
- 기존 테스트는 수정하지 않고 통과해야 함

Dependencies:
- src/utils/stringUtils.ts (기존 파일 - 제거 예정)
- src/utils/dateUtils.ts (기존 파일 - 제거 예정)
- src/utils/validators.ts (기존 파일 - 제거 예정)
- 모든 import 경로 업데이트 필요

Done When:
- [ ] 중복 함수 제거 및 통합 완료
- [ ] 모든 import 경로 업데이트
- [ ] 기존 테스트 모두 통과
- [ ] JSDoc 주석 추가 완료
- [ ] 사용하지 않는 파일 삭제
- [ ] 타입 정의 명확화
```

## 작성 시 주의사항

1. **명확성**: 모호한 표현 지양, 구체적인 지시 사용
2. **측정 가능성**: Done When은 검증 가능한 기준으로 작성
3. **제약사항 명시**: 금지사항과 필수사항을 명확히 구분
4. **의존성 파악**: 작업 전 필요한 모든 파일/모듈 나열
5. **단계별 분리**: 큰 작업은 여러 개의 작은 작업으로 분리 권장

## Poly-Tech2 프로토콜 준수

- `TO_CURSOR.md`는 **Antigravity 또는 Human**만 작성 가능
- Cursor는 이 파일을 읽고 작업 수행
- 작업 완료 후 `TO_ANTIGRAVITY.md`에 보고
- 문제 발생 시 `TO_ANTIGRAVITY.md`에 에스컬레이션








