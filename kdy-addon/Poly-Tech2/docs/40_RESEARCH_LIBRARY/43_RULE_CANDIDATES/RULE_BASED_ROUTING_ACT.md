# Law Candidate: Rule-Based Routing Act

## [LAW-CANDIDATE] Deterministic Routing Priority
- **목적**: 불필요한 LLM 비용과 지연 시간을 제거하고, 예측 가능한 오케스트레이션을 보장한다.
- **적용 범위**: 모든 파일 변경 이벤트에 대한 1차 라우팅 결정.
- **헌법과의 관계**: Article 2 (Latency Stratification) - 즉각적인(Real-time) 처리를 위해 무거운 추론(Deep Reasoning)을 배제하고 결정론적 규칙을 우선한다.

## [LAW-CANDIDATE] File System Event Triggering
- **목적**: 에이전트의 실행을 추상적인 '요청'이 아닌 물리적인 '파일 변경'에 귀속시킨다.
- **적용 범위**: Watchdog이 감지하는 모든 Create, Modify, Move 이벤트.
- **헌법과의 관계**: Article 3 (File System Sovereignty) - 파일 시스템의 상태 변화를 유일한 진실(Truth)로 간주하고, 이를 기반으로 에이전트 동작을 트리거한다.

## [LAW-CANDIDATE] Lock File Governance
- **목적**: 동시성 문제와 에이전트 간 충돌을 방지한다.
- **적용 범위**: `.agent_lock` 파일이 존재하는 모든 디렉토리.
- **헌법과의 관계**: Article 3 (File System Sovereignty) - Isolation 원칙을 구체화하여, 락 파일이 존재하는 영역에 대한 에이전트의 쓰기 권한을 물리적으로 차단한다.
