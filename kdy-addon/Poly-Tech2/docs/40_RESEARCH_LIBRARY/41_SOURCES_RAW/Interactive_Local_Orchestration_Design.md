# Interactive Local Orchestration: Design Specification (Option 3)

본 문서는 API 비용이 전혀 발생하지 않는 **'제3안: 규칙 기반 및 인간 협업 오케스트레이션'**의 상세 설계 및 구현 가이드입니다.

## 1. 아키텍처 개요
**"The Brain is YOU."**
거대 언어 모델(LLM)이 수행하던 '판단(Reasoning)' 영역을 **'정규표현식 규칙(Rule)'**과 **'사용자(Human)'**에게 이양합니다.
- **Router**: 파이썬 `watchdog` 라이브러리가 파일 변경을 감지하고, Regex 규칙에 따라 스크립트를 실행합니다.
- **Executor**: 복잡한 코딩은 사용자가 직접(혹은 Cursor의 무료 기능으로) 수행합니다.
- **Context**: 파일 시스템(Markdown)을 통해 상태를 공유합니다.

---

## 2. 규칙 기반 라우터 (Rule-Based Router) 설계

### 2.1 감지 및 라우팅 로직
고비용의 LLM 추론 대신, **파일 경로 패턴(Pattern Matching)**을 통해 작업의 종류를 결정합니다.

| 변경 감지 패턴 (Regex) | 작업/Intent 분류 | 실행 액션 (Action) |
| :--- | :--- | :--- |
| `src/.*\.test\.ts$` | 테스트 코드 변경 | `npm test <filename>` 자동 실행 |
| `docs/.*\.md$` | 문서 변경 | `gen_docs.py` 실행 (정적 사이트 빌드) |
| `.*/TODO\.md$` | **사용자 지시 사항** | 내용 파싱 후 `communication/TO_AGENT.md`로 이동 |
| `.*/\.agent_lock$` | 락 파일 생성 | 상태 표시줄 아이콘 변경 (VS Code Extension) |

### 2.2 Watchdog 스크립트 구조 (`core/orchestrator/watcher.py`)
```python
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import re

class RuleBasedHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.is_directory: return
        path = event.src_path
        
        # Rule 1: Test Execution (Generic)
        if re.search(r"\.test\.(ts|js)$", path):
            print(f"[TEST] Detected test file change: {path}")
            run_command(f"npm test {path}")
            
        # Rule 2: User Instruction (Generic)
        elif re.search(r"TO_AGENT\.md$", path):
            print(f"[USER] New instruction detected")
            process_user_instruction(path)

def start_watching():
    observer = Observer()
    # Watch the specific app directories (passed via CLI)
    observer.schedule(RuleBasedHandler(), path="./apps/my_new_app/src", recursive=True)
    observer.start()
    # ...
```

---

## 3. 인간-에이전트 소통 인터페이스 (Human-Centric Interface)

### 3.1 "Human-as-a-Service" 프로토콜
에이전트(스크립트)가 처리할 수 없는 예외 상황이 발생하면, 사용자에게 명시적으로 도움을 요청하는 파일 시스템 프로토콜입니다.

*   **요청 채널 (`communication/TO_HUMAN.md`)**
    *   에이전트가 문제 발생 시 이 파일에 이슈를 생성합니다.
    *   형식:
        ```markdown
        # [ISSUE] 테스트 실패 보고
        - 발생 시간: 2025-12-23 18:00
        - 에러 로그: `ReferenceError: x is not defined`
        - 요청 사항: 변수 x의 정의를 확인해주세요.
        ```

*   **지시 채널 (`communication/TO_AGENT.md`)**
    *   사용자가 에이전트(Script)에게 작업을 시킬 때 사용합니다.
    *   형식:
        ```markdown
        # [CMD] 빌드 배포
        - 명령: deploy-staging
        - 옵션: --verbose
        ```

### 3.2 Cursor 'Vibe Coding' 통합
*   사용자는 **Cursor의 Composer(Ctrl+I)** 기능을 사용하여 코드를 작성합니다.
*   오케스트레이터(Watcher)는 사용자가 파일을 저장하는 순간을 포착하여, **린트(Lint) 검사**나 **포맷팅(Prettier)**을 백그라운드에서 즉시 수행해 줍니다. 이는 "보이지 않는 보조자" 역할을 합니다.

---

## 4. 로컬 인프라 (Local Infrastructure)
기존 연구(2.1, 2.2)의 결과물을 그대로 사용하되, 비용이 드는 외부 연결만 제거합니다.

*   **SQLite Memory**: 로컬 작업 로그를 저장하여 "내가 어제 뭘 했지?"를 검색할 수 있게 합니다.
*   **File Lock**: `watcher.py`가 쓰기 작업을 감지하면 잠시 `.write_barrier`를 생성하여 중복 실행을 방지합니다.

---

## 5. 결론
이 설계는 **"지능은 사용자에게, 반복은 스크립트에게"**라는 철학을 따릅니다. API 비용은 0원이며, 사용자는 자신의 코딩 흐름(Flow)을 유지하면서도 자동화의 이점(테스트 자동 실행, 린팅 등)을 누릴 수 있습니다.
