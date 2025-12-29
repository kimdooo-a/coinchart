다음은 Poly-Tech2/docs의 표준 구조다.
이 구조를 기준으로 모든 문서를 분류하고 배치하라.

Poly-Tech2/docs/
├─ 00_CONSTITUTION/          # 헌법 (불변 원칙)
├─ 10_LAWS/                  # 법률 (헌법의 실행 규칙)
├─ 20_REGULATIONS/           # 시행령/지침 (프로젝트별 조정 가능)
├─ 30_CASELAW/               # 판례/사례
├─ 40_RESEARCH_LIBRARY/
│  ├─ 41_SOURCES_RAW/        # 원문 연구자료
│  ├─ 42_SUMMARIES/          # 요약본
│  └─ 43_RULE_CANDIDATES/    # 규칙 후보
├─ 50_TEMPLATES/             # 범용 템플릿
├─ 60_PROTOCOLS/             # 포맷/스키마
└─ 80_RUNTIME_CONTRACTS/     # 에이전트 계약 파일 (CLAUDE.md 등)

이 구조는 범용 라이브러리이며,
개별 프로젝트에서는 kdy-addon 하위로 그대로 복사되어 사용된다.
