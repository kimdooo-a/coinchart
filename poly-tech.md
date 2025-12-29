# 🏗️ **Poly-Tech 프로젝트 - 3단계 분석**

---

## **🎯 1단계: 프로젝트 정체성 (Project Identity)**

**Reasoning**: Poly-Tech의 **핵심 목표와 역할**을 이해

### **What is Poly-Tech?**
```
Poly-Tech는 "멀티 에이전트 협업 엔진"입니다
- Claude (Claude.md)
- Cursor (.cursor/)
- Antigravity (.antigravity/)
- VSCode (.vscode/)

이 4개 에이전트가 동시에 같은 프로젝트를 편집할 때,
"충돌 없이 협력하게 만드는 오케스트레이션 시스템"
```

### **핵심 철학**
```
🔑 "엔진(Core) ≠ 애플리케이션(Apps)"

Core (라이브러리):
└─ Watcher (파일 변화 감시)
└─ Orchestrator (에이전트 조율)
└─ Communication Templates (소통 규약)

Apps (실제 프로젝트들):
├─ collaboration_hub (협업 허브)
├─ tetris_demo (테트리스 게임)
└─ _template (새 프로젝트 템플릿)
```

**결론**: Poly-Tech는 **멀티 에이전트 프로젝트 관리 플랫폼**

---

## **🔧 2단계: 핵심 메커니즘 (Core Mechanism)**

**Reasoning**: **어떻게** 에이전트들이 협력하는가를 파악

### **Watcher 시스템 (파일 감시 + 자동 실행)**

```python
# watcher.py의 핵심 로직

┌─────────────────────────────────────┐
│   File System Watcher (감시)         │
└────────────┬────────────────────────┘
             │ 파일 변화 감지
             ▼
┌─────────────────────────────────────┐
│   Rule-Based Router (규칙 기반 라우터) │
└────────────┬────────────────────────┘
      │
      ├─ Rule 1: *.test.ts 변경
      │          └─ npm test 실행
      │
      └─ Rule 2: TO_AGENT.md 변경
               └─ 파일 읽기 + 명령 실행
```

**실행 방식**:
```bash
# apps/collaboration_hub/ 에서 실행
python ../../core/orchestrator/watcher.py ./src ./communication

# 감시 대상:
# - ./src/**/*.ts (TypeScript 파일)
# - ./communication/TO_AGENT.md (에이전트 지시사항)
```

### **통신 프로토콜 (Communication Protocol)**

```
📁 core/templates/ (원본)
├─ TO_AGENT.md      (Claude에게 지시)
├─ TO_CURSOR.md     (Cursor에게 지시)
├─ TO_ANTIGRAVITY.md (Antigravity에게 지시)
└─ TO_HUMAN.md      (사용자에게 보고)

📁 apps/<project>/communication/ (프로젝트별 복사본)
└─ TO_AGENT.md 수정
   └─ Watcher 감지 + 명령 자동 실행
```

### **예시: 파일 변경 흐름**

```
1️⃣ Cursor가 src/index.ts 수정
   └─ Watcher가 감지

2️⃣ Cursor가 communication/TO_AGENT.md 작성:
   ```
   # Task: Refactor functions
   Run: npm run lint src/index.ts
   ```

3️⃣ Watcher가 TO_AGENT.md 변경 감지
   └─ 파일 파싱 + 명령 추출
   └─ npm run lint 자동 실행 ⚡

4️⃣ 결과를 communication/TO_HUMAN.md에 기록
   └─ 모든 에이전트가 실시간 공유 ✅
```

---

## **🧠 3단계: 아키텍처 설계 (Architecture Design)**

**Reasoning**: **왜** 이렇게 구조화했는지, **어떤 문제를 해결하는가**

### **A. 분리의 원칙 (Separation of Concerns)**

```
문제: 여러 에이전트가 같은 코드를 동시에 수정
└─ 충돌, 덮어쓰기, 락(Lock) 이슈

해결책: Core ≠ Apps

Core (단순, 변경 불가):
  ├─ Orchestrator ← 안정적
  ├─ Watcher.py ← 불변
  └─ Templates ← 읽기 전용 원본

Apps (프로젝트별 독립):
  ├─ collaboration_hub/
  │   ├─ src/ (자유로운 수정)
  │   └─ communication/ (독립적 소통)
  ├─ tetris_demo/
  │   ├─ src/
  │   └─ communication/
  └─ _template/ (새 프로젝트 템플릿)
```

**이점**:
- ✅ 각 프로젝트가 독립적으로 동작
- ✅ Core를 공유하되 서로 간섭 안함
- ✅ 새 프로젝트 추가가 간단

### **B. 멀티 에이전트 조율 (Multi-Agent Orchestration)**

```
4개 에이전트의 역할 분담:

┌─────────────┐
│   Claude    │ ← "Headless DevOps Engineer"
│             │   (인프라, 자동화, 검증)
└──────┬──────┘
       │ CLAUDE.md 지침
       │
┌──────▼────────────────────────────┐
│   TO_AGENT.md (공유 지시사항)      │
│   ← Cursor/Antigravity이 작성     │
└──────┬────────────────────────────┘
       │
       ├─→ TO_CURSOR.md (Cursor 역할)
       │    "UI/Frontend 담당"
       │
       ├─→ TO_ANTIGRAVITY.md (Antigravity 역할)
       │    "Architecture/Planning 담당"
       │
       └─→ TO_HUMAN.md (사용자)
            "최종 리포트"
```

### **C. Debouncing & Lock 메커니즘**

```python
# watcher.py의 debouncing 로직

class RuleBasedHandler:
    def __init__(self, debounce_seconds=0.5):
        self.last_processed = defaultdict(float)  # 파일별 마지막 처리 시간
    
    def should_process(self, file_path):
        current_time = time.time()
        last_time = self.last_processed.get(file_path, 0)
        
        # 0.5초 내 중복 이벤트 무시
        if current_time - last_time >= 0.5:
            self.last_processed[file_path] = current_time
            return True
        return False
```

**왜 필요한가?**
- 파일이 저장될 때 여러 번 감지될 수 있음
- 에이전트들이 동시에 같은 파일을 수정하려 할 때 충돌 방지

---

## **📊 3단계별 비교표**

| 단계 | 초점 | 답변 | 핵심 인사이트 |
|------|------|------|------------|
| **1단계** | **정체성** | "Poly-Tech가 무엇인가?" | 멀티 에이전트 협업 엔진 |
| **2단계** | **메커니즘** | "어떻게 작동하는가?" | 파일 감시 + 규칙 기반 라우팅 |
| **3단계** | **설계** | "왜 이렇게 만들었는가?" | 에이전트 간섭 최소화 + 공유 인프라 |

---

## **🚀 Poly-Tech의 혁신점**

```
기존 멀티 에이전트 시스템의 문제:
❌ 에이전트들이 같은 파일을 동시에 수정 → 충돌
❌ 중앙화된 조율자 필요 (병목)
❌ 새 프로젝트 추가 어려움

Poly-Tech의 해결책:
✅ 파일 감시 + 자동 실행 (Watcher)
✅ 분산 조율 (Decentralized Orchestration)
✅ 템플릿 기반 신규 프로젝트 추가
✅ Core/Apps 분리로 독립성 보장
```

---

## **📁 디렉토리 구조 상세 분석**

### **Core 구조**
```
core/
├── orchestrator/
│   └── watcher.py          # 파일 감시 + 규칙 기반 실행 엔진
└── templates/
    ├── TO_AGENT.md         # Claude에게 지시 (원본)
    ├── TO_CURSOR.md        # Cursor에게 지시 (원본)
    ├── TO_ANTIGRAVITY.md   # Antigravity에게 지시 (원본)
    └── TO_HUMAN.md         # 사용자 리포트 (원본)
```

### **Apps 구조**
```
apps/
├── collaboration_hub/
│   ├── src/                # 실제 코드
│   └── communication/       # 각 프로젝트의 TO_*.md (복사본)
├── tetris_demo/
│   ├── src/
│   └── communication/
└── _template/              # 새 프로젝트 생성 템플릿
```

---

## **🔄 워크플로우 예시**

### **Scenario: API 엔드포인트 추가**

```
1. Cursor가 TO_CURSOR.md에 작성:
   ---
   # Task: Add /api/users endpoint
   Status: in-progress
   ---

2. Watcher가 감지
   └─ 파일 파싱

3. Claude가 TO_AGENT.md에 작성:
   ---
   Run: npm run test -- src/api/users.test.ts
   Run: npm run lint
   ---

4. Watcher가 명령 실행
   └─ 테스트 + 린트 자동 실행

5. 결과를 TO_HUMAN.md에 기록:
   ---
   ✅ Tests passed
   ✅ Lint passed
   Ready to merge
   ---

6. 모든 에이전트가 상태 확인
   └─ 실시간 협업 완성! 🎉
```

---

## **💡 핵심 설계 원칙**

### **1. 이벤트 기반 (Event-Driven)**
- 파일 변경 감지 → 자동 실행
- 폴링이 아닌 감시 (Watching)

### **2. 규칙 기반 (Rule-Based)**
- 정규표현식으로 패턴 매칭
- LLM 없이 빠른 결정

### **3. 분산형 (Decentralized)**
- 중앙 컨트롤러 없음
- 각 프로젝트가 독립적

### **4. 템플릿 기반 (Template-Driven)**
- Core에서 복사하여 프로젝트별 커스터마이징
- 일관성 유지

---

## **⚙️ 기술 스택**

| 계층 | 기술 | 용도 |
|------|------|------|
| **Orchestration** | Python (watchdog) | 파일 감시 + 이벤트 처리 |
| **CLI** | Python (poly.py) | 설치 및 초기화 |
| **Applications** | TypeScript/JavaScript | 실제 프로젝트 코드 |
| **Communication** | Markdown | 에이전트 간 통신 |

---

## **🎓 학습 포인트**

1. **멀티 에이전트 협업의 핵심**: 충돌 방지를 위한 **분리**와 **자동화**
2. **Watcher 패턴**: 파일 시스템 이벤트를 활용한 확장 가능한 아키텍처
3. **마크다운 기반 소통**: 구조화된 텍스트로 에이전트 간 명확한 의사소통
4. **Core/Apps 분리**: 라이브러리와 애플리케이션의 완전한 분리로 재사용성 극대화

---

**작성일**: 2025-12-25
**분석 범위**: Poly-Tech 멀티 에이전트 오케스트레이션 프로젝트
