# File-Based Human-Agent Communication Protocol for QHDE Architecture

The "문서로 대화" (document-based conversation) paradigm enables **zero-cost, local human-agent orchestration** by replacing real-time APIs with Markdown files. This approach treats humans as "The Brain" for non-deterministic decisions while agents handle deterministic tasks autonomously. The protocol combines GitOps declarative state management, HITL (Human-in-the-Loop) checkpoint patterns, and structured Markdown communication to create a fully local, cost-free orchestration system.

## Core protocol design principles

The file-based Human-Agent Communication Interface (HACI) builds on three foundational concepts borrowed from production AI systems and GitOps workflows. First, **declarative state files** serve as the single source of truth—all task requests, agent responses, and human decisions exist as human-readable, machine-parseable Markdown files with YAML frontmatter. Second, the **reconciliation loop** pattern from GitOps ensures agents continuously monitor directories for new requests and state changes. Third, **confidence-based delegation** from HITL systems allows agents to autonomously handle high-confidence decisions while routing uncertain cases to human review.

The architecture uses a **directory-based queue structure** where file placement indicates task state. Moving a file from `pending/` to `in-progress/` to `completed/` provides atomic state transitions without database dependencies. This mirrors the "Active Moderation" pattern from production ML systems, where **85-95% of requests** can be auto-processed while **5-15%** requiring human judgment are queued for review based on confidence thresholds and task type.

```
.haci/                          # Human-Agent Communication Interface
├── config.yaml                 # Agent configuration and routing rules
├── state.yaml                  # Current system state
├── inbox/                      # TO_AGENT: Human → Agent communication
│   ├── pending/
│   │   └── 001-task-request.md
│   └── acknowledged/
├── outbox/                     # FROM_AGENT: Agent → Human communication  
│   ├── awaiting-human/
│   │   └── 002-decision-needed.md
│   └── resolved/
└── shared/                     # Bidirectional context
    ├── context.md              # Persistent conversation context
    └── decisions-log.md        # Human decision history
```

## TO_AGENT.md template specification

Human-to-agent messages follow a structured format inspired by FIPA ACL performatives and GitHub issue templates. The YAML frontmatter provides machine-parseable metadata while the Markdown body contains human-readable instructions.

```markdown
---
# Communication Metadata
type: task-request              # request | question | feedback | override
id: task-2024-1224-001
created: 2024-12-24T10:00:00+09:00
priority: high                  # critical | high | medium | low

# Routing Information
performative: request           # request | inform | query | delegate
sender: doyeong
receiver: agent-orchestrator
conversation_id: conv-forensic-001
reply_to: null

# Task Constraints
timeout: 2h
require_confirmation: true
allow_autonomous: false

# Context Tags
tags: [e-commerce, data-analysis]
project: forensic-research
---

# Task: Analyze transaction anomalies

## Context
전자상거래 거래 데이터에서 이상 패턴을 분석해야 합니다. 
이전 분석 결과는 `./shared/context.md`에 있습니다.

## Request
- [ ] Load transaction data from `./data/transactions.csv`
- [ ] Identify statistical outliers (>2 standard deviations)
- [ ] Cross-reference with known fraud patterns
- [ ] Generate summary report in Korean

## Constraints
- **Data sensitivity**: Do not expose PII in outputs
- **Format**: Results as Markdown table
- **Language**: Report in Korean (한국어)

## Expected Output
분석 결과를 `./outbox/awaiting-human/` 폴더에 리포트로 생성하세요.
불확실한 사항은 별도의 질문 파일로 요청하세요.

## Decision Authority
| Decision Type | Authority |
|--------------|-----------|
| Data filtering criteria | Agent (autonomous) |
| Threshold values | Human (require approval) |
| Report format | Agent (autonomous) |
| Fraud classification | Human (require approval) |
```

## FROM_AGENT.md template specification

Agent-to-human messages implement the **Human-as-a-Tool** pattern, clearly marking areas requiring human judgment with structured decision requests.

```markdown
---
# Response Metadata
type: decision-request          # result | decision-request | question | status-update
id: response-2024-1224-002
in_reply_to: task-2024-1224-001
created: 2024-12-24T11:30:00+09:00
status: awaiting-human          # pending | in-progress | awaiting-human | completed

# Confidence Metrics
confidence_score: 0.67          # 0.0 - 1.0 scale
uncertainty_type: ambiguous_threshold  # ambiguous_input | novel_case | high_stakes | policy_required
auto_action_blocked: true

# Response Deadline
timeout_at: 2024-12-24T13:30:00+09:00
timeout_action: defer           # auto_reject | auto_approve | defer | escalate

# Decision Options
decision_required: true
options: [approve, reject, modify, defer]
default_option: defer
---

# Analysis Complete: Decision Required

## Summary
거래 데이터 분석을 완료했습니다. **127개의 이상 거래**를 식별했으나, 
분류 기준에 대한 결정이 필요합니다.

## Findings

### Identified Anomalies
| Category | Count | Confidence | Agent Recommendation |
|----------|-------|------------|---------------------|
| High-value outliers | 45 | 0.92 | Flag as suspicious |
| Timing anomalies | 32 | 0.78 | Requires human review |
| Pattern matches | 50 | 0.67 | **Uncertain** - threshold unclear |

### Visualization
```
Anomaly Distribution:
High-value:    ████████████████████ 45 (0.92 confidence)
Timing:        ██████████████ 32 (0.78 confidence)  
Pattern:       ██████████████████████ 50 (0.67 confidence)
```

## ❓ Decision Required

### Question 1: Threshold for Pattern Matching
**현재 상황**: 패턴 매칭 신뢰도가 0.67로 기준값(0.75) 미만입니다.

**Options**:
- [ ] `approve`: 현재 기준(0.75)으로 진행 → 50건 중 12건만 플래그
- [ ] `lower_threshold`: 기준을 0.60으로 낮춤 → 50건 모두 포함
- [ ] `defer`: 추가 분석 후 재검토
- [ ] `custom`: 다른 기준 제시 (아래에 입력)

**Agent's Recommendation**: `defer` - 샘플 케이스 검토 후 결정 권장

**Your Decision**: `______` <!-- 여기에 결정 입력 -->

**Reasoning** (optional): 
<!-- 결정 이유를 입력하면 향후 유사 케이스에 활용됩니다 -->

---

### Question 2: Fraud Classification Authority
특정 거래(ID: TXN-4521, TXN-4522)가 알려진 사기 패턴과 일치합니다.

**Options**:
- [ ] `flag`: 사기 의심으로 플래그 (법적 검토 필요)
- [ ] `investigate`: 추가 조사 필요로 표시
- [ ] `clear`: 정상 거래로 분류

**Your Decision**: `______`

---

## Next Steps
결정이 완료되면 이 파일을 `./outbox/resolved/` 폴더로 이동하세요.
Agent가 자동으로 감지하여 다음 단계를 진행합니다.

## Metadata for Agent Processing
```yaml
human_response:
  question_1:
    decision: null
    reasoning: null
    timestamp: null
  question_2:
    decision: null
    reasoning: null
    timestamp: null
```
```

## State management and routing configuration

The system state file implements GitOps reconciliation patterns, enabling agents to understand current context and routing rules without API calls.

```yaml
# .haci/config.yaml
apiVersion: haci/v1
kind: AgentConfig

metadata:
  agent_id: qhde-orchestrator
  version: "1.0.0"
  owner: doyeong

spec:
  # Reconciliation Settings
  reconciliation:
    interval_seconds: 5
    watch_directories:
      - "./inbox/pending"
      - "./outbox/resolved"
    
  # Confidence-Based Routing
  routing:
    auto_execute_threshold: 0.90    # Above this → auto-execute
    human_review_threshold: 0.70    # Below this → require human
    sample_review_rate: 0.10        # Random audit rate for auto-executed
    
  # Task Type Routing Rules
  task_routing:
    deterministic:
      - file_read
      - data_format
      - calculation
      action: auto_execute
      
    non_deterministic:
      - classification
      - recommendation
      - content_generation
      action: request_human_review
      
    always_human:
      - delete_operations
      - financial_transactions
      - pii_handling
      action: require_human_approval
      
  # Timeout Policies
  timeout_policies:
    critical:
      initial: 5m
      escalation: 10m
      final_action: notify_urgent
    standard:
      initial: 2h
      escalation: 4h
      final_action: defer
    batch:
      initial: 24h
      escalation: 48h
      final_action: skip

  # Notification Settings (Local)
  notifications:
    enabled: true
    method: desktop  # desktop | terminal | file
    sound: true

---
# .haci/state.yaml
apiVersion: haci/v1
kind: AgentState

metadata:
  last_reconciled: "2024-12-24T11:35:00+09:00"

status:
  mode: active                    # active | paused | awaiting-input
  current_task: task-2024-1224-001
  queue_depth:
    pending: 2
    in_progress: 1
    awaiting_human: 1
    
communication:
  pending_questions: 1
  last_human_interaction: "2024-12-24T10:00:00+09:00"
  avg_response_time_hours: 2.5

conditions:
  - type: Ready
    status: true
    message: "Agent operating normally"
  - type: AwaitingHumanInput
    status: true
    message: "Decision required for task-001"
```

## Implementation with Python watchdog

The core implementation uses Python's watchdog library for file monitoring, python-frontmatter for YAML extraction, and plyer for cross-platform desktop notifications.

```python
#!/usr/bin/env python3
"""
HACI (Human-Agent Communication Interface) - Core Implementation
Zero-cost local orchestration for QHDE architecture
"""

import time
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum

import frontmatter
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from plyer import notification


class TaskStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in-progress"
    AWAITING_HUMAN = "awaiting-human"
    COMPLETED = "completed"


class MessageType(Enum):
    TASK_REQUEST = "task-request"
    DECISION_REQUEST = "decision-request"
    QUESTION = "question"
    STATUS_UPDATE = "status-update"
    RESULT = "result"


@dataclass
class HACIMessage:
    """Structured message for human-agent communication"""
    id: str
    type: MessageType
    content: str
    metadata: Dict[str, Any]
    created_at: datetime
    
    @classmethod
    def from_file(cls, filepath: Path) -> 'HACIMessage':
        post = frontmatter.load(filepath)
        return cls(
            id=post.get('id', filepath.stem),
            type=MessageType(post.get('type', 'task-request')),
            content=post.content,
            metadata=dict(post.metadata),
            created_at=datetime.fromisoformat(
                post.get('created', datetime.now().isoformat())
            )
        )
    
    def to_file(self, filepath: Path):
        post = frontmatter.Post(self.content)
        post.metadata = {
            'id': self.id,
            'type': self.type.value,
            'created': self.created_at.isoformat(),
            **self.metadata
        }
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(frontmatter.dumps(post))


class HACIOrchestrator:
    """
    Human-Agent Communication Interface Orchestrator
    Implements file-based communication with human-as-the-brain pattern
    """
    
    def __init__(self, base_dir: str = ".haci"):
        self.base_dir = Path(base_dir)
        self.inbox_pending = self.base_dir / "inbox" / "pending"
        self.inbox_ack = self.base_dir / "inbox" / "acknowledged"
        self.outbox_awaiting = self.base_dir / "outbox" / "awaiting-human"
        self.outbox_resolved = self.base_dir / "outbox" / "resolved"
        self.shared = self.base_dir / "shared"
        
        # Create directory structure
        for d in [self.inbox_pending, self.inbox_ack, 
                  self.outbox_awaiting, self.outbox_resolved, self.shared]:
            d.mkdir(parents=True, exist_ok=True)
        
        # Load configuration
        self.config = self._load_config()
        
    def _load_config(self) -> Dict:
        config_path = self.base_dir / "config.yaml"
        if config_path.exists():
            return frontmatter.load(config_path).metadata
        return {"routing": {"auto_execute_threshold": 0.90}}
    
    def process_inbox(self):
        """Process all pending human requests"""
        for task_file in self.inbox_pending.glob("*.md"):
            message = HACIMessage.from_file(task_file)
            print(f"Processing: {message.id} - {message.type.value}")
            
            # Determine routing based on task type and confidence
            if self._can_auto_execute(message):
                result = self._execute_task(message)
                self._send_result(message, result)
            else:
                # Request human decision
                self._request_human_decision(message)
            
            # Move to acknowledged
            task_file.rename(self.inbox_ack / task_file.name)
    
    def _can_auto_execute(self, message: HACIMessage) -> bool:
        """Determine if task can be executed without human approval"""
        # Check explicit override
        if message.metadata.get('require_confirmation', False):
            return False
        if message.metadata.get('allow_autonomous', True) is False:
            return False
            
        # Check routing rules
        routing = self.config.get('routing', {})
        threshold = routing.get('auto_execute_threshold', 0.90)
        confidence = message.metadata.get('confidence_score', 0.5)
        
        return confidence >= threshold
    
    def _execute_task(self, message: HACIMessage) -> Dict:
        """Execute task autonomously (placeholder for actual logic)"""
        return {
            "status": "completed",
            "result": "Task executed successfully",
            "confidence": 0.95
        }
    
    def _request_human_decision(self, message: HACIMessage):
        """Create decision request for human review"""
        decision_id = f"decision-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        decision_request = HACIMessage(
            id=decision_id,
            type=MessageType.DECISION_REQUEST,
            content=self._format_decision_request(message),
            metadata={
                'in_reply_to': message.id,
                'status': 'awaiting-human',
                'confidence_score': message.metadata.get('confidence_score', 0.5),
                'timeout_at': self._calculate_timeout(message),
                'options': ['approve', 'reject', 'modify', 'defer'],
                'default_option': 'defer'
            },
            created_at=datetime.now()
        )
        
        output_path = self.outbox_awaiting / f"{decision_id}.md"
        decision_request.to_file(output_path)
        
        # Send desktop notification
        self._notify_human(decision_request)
        
        print(f"Decision requested: {decision_id}")
    
    def _format_decision_request(self, message: HACIMessage) -> str:
        return f"""# Decision Required

## Original Request
{message.content}

## Agent Analysis
분석을 완료했으나 다음 사항에 대한 결정이 필요합니다.

## ❓ Your Decision Required

**Options**:
- [ ] `approve`: 제안대로 진행
- [ ] `reject`: 작업 취소
- [ ] `modify`: 수정 후 진행
- [ ] `defer`: 추가 검토 필요

**Your Decision**: `______`

**Reasoning** (optional):


---
결정 완료 후 이 파일을 `./outbox/resolved/` 폴더로 이동하세요.
"""
    
    def _calculate_timeout(self, message: HACIMessage) -> str:
        priority = message.metadata.get('priority', 'medium')
        timeout_hours = {'critical': 0.5, 'high': 2, 'medium': 8, 'low': 24}
        hours = timeout_hours.get(priority, 8)
        timeout = datetime.now().replace(
            hour=datetime.now().hour + int(hours)
        )
        return timeout.isoformat()
    
    def _notify_human(self, message: HACIMessage):
        """Send desktop notification for pending decision"""
        try:
            notification.notify(
                title="🤖 HACI: Decision Required",
                message=f"Task: {message.metadata.get('in_reply_to', 'Unknown')}\n"
                        f"Priority: {message.metadata.get('priority', 'medium')}",
                timeout=10
            )
        except Exception as e:
            print(f"Notification failed: {e}")
    
    def _send_result(self, original: HACIMessage, result: Dict):
        """Send execution result back"""
        result_id = f"result-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        result_message = HACIMessage(
            id=result_id,
            type=MessageType.RESULT,
            content=f"# Task Completed\n\n{json.dumps(result, indent=2)}",
            metadata={
                'in_reply_to': original.id,
                'status': 'completed',
                **result
            },
            created_at=datetime.now()
        )
        
        output_path = self.outbox_resolved / f"{result_id}.md"
        result_message.to_file(output_path)
    
    def process_human_responses(self):
        """Process resolved decisions from human"""
        for response_file in self.outbox_resolved.glob("*.md"):
            message = HACIMessage.from_file(response_file)
            
            if message.type == MessageType.DECISION_REQUEST:
                # Parse human decision from file
                decision = self._extract_decision(message)
                if decision:
                    print(f"Human decided: {decision}")
                    self._handle_decision(message, decision)


class InboxWatcher(FileSystemEventHandler):
    """Watch for new human requests"""
    
    def __init__(self, orchestrator: HACIOrchestrator):
        self.orchestrator = orchestrator
    
    def on_created(self, event):
        if event.is_directory or not event.src_path.endswith('.md'):
            return
        time.sleep(0.2)  # Allow file write to complete
        print(f"New request detected: {event.src_path}")
        self.orchestrator.process_inbox()


class ResponseWatcher(FileSystemEventHandler):
    """Watch for human responses (files moved to resolved)"""
    
    def __init__(self, orchestrator: HACIOrchestrator):
        self.orchestrator = orchestrator
    
    def on_created(self, event):
        if event.is_directory or not event.src_path.endswith('.md'):
            return
        time.sleep(0.2)
        print(f"Human response detected: {event.src_path}")
        self.orchestrator.process_human_responses()


def main():
    """Start the HACI orchestrator"""
    orchestrator = HACIOrchestrator()
    
    # Set up watchers
    inbox_handler = InboxWatcher(orchestrator)
    response_handler = ResponseWatcher(orchestrator)
    
    observer = Observer()
    observer.schedule(inbox_handler, str(orchestrator.inbox_pending))
    observer.schedule(response_handler, str(orchestrator.outbox_resolved))
    observer.start()
    
    print("=" * 50)
    print("HACI Orchestrator Started")
    print("=" * 50)
    print(f"Inbox:  {orchestrator.inbox_pending}")
    print(f"Outbox: {orchestrator.outbox_awaiting}")
    print("Drop .md files in inbox/pending to start tasks")
    print("Move files to outbox/resolved after decisions")
    print("=" * 50)
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


if __name__ == "__main__":
    main()
```

## Best practices from production HITL systems

Production human-in-the-loop systems reveal several critical patterns for effective human-agent communication. **Confidence-based tiered routing** automatically handles 85-95% of decisions while surfacing genuinely uncertain cases. Systems like Amazon SageMaker Ground Truth use thresholds between **0.70-0.95** depending on task risk—higher thresholds for irreversible actions, lower for easily-corrected decisions.

**Structured decision codes** enable feedback loops and model improvement. Rather than simple approve/reject, effective systems capture nuanced responses: `APPROVE_MODIFIED` (accepted with changes), `REJECT_POLICY` (violates rules), `ESCALATE_COMPLEX` (needs senior review), `DEFER` (need more information). Each code trains future routing decisions.

**Timeout handling with graceful degradation** prevents blocked workflows. The escalation chain pattern progresses from primary reviewer (30 min) → team lead (30 min) → manager (15 min) → fallback action. For file-based systems, fallback actions should be conservative: defer to next human availability rather than auto-approve uncertain decisions.

**Context preservation across interactions** maintains conversation continuity. The `shared/context.md` file accumulates prior decisions and reasoning, enabling both human and agent to reference history. This mirrors LangGraph's state management where `conversation_history` and `state_snapshot` travel with each request.

## Implementation roadmap for QHDE integration

**Phase 1 (Week 1-2): Foundation**
- Deploy directory structure with `.haci/` folder hierarchy
- Implement basic watchdog monitoring for inbox/outbox
- Create TO_AGENT.md and FROM_AGENT.md template files
- Set up python-frontmatter parsing for YAML extraction
- Configure desktop notifications via plyer

**Phase 2 (Week 3-4): Routing Logic**
- Implement confidence-based routing in config.yaml
- Build task type classification for deterministic vs. non-deterministic routing
- Add timeout management and escalation policies
- Create decision history logging in shared/decisions-log.md

**Phase 3 (Week 5-6): Human Interface**
- Design clear decision request format with visual markers (❓, ⚠️)
- Implement Korean language support for all templates
- Add structured decision capture in YAML frontmatter
- Build feedback loop for decision code capture

**Phase 4 (Week 7-8): Integration & Polish**
- Connect to rule-based router for deterministic task handling
- Implement conversation context persistence
- Add audit trail generation
- Create dashboard view (optional Markdown summary file)
- Performance optimization for large task volumes

## Technical dependencies

```python
# requirements.txt for HACI implementation
watchdog>=3.0.0          # File system monitoring
python-frontmatter>=1.0.0 # YAML frontmatter parsing
plyer>=2.1.0             # Cross-platform notifications
PyYAML>=6.0              # YAML processing
markdown>=3.5            # Markdown parsing (optional)
```

For JavaScript/Node.js implementations, use `chokidar` (file watching), `gray-matter` (frontmatter), and `node-notifier` (desktop alerts). The v5 release of chokidar (November 2025) provides improved performance with native FSEvents on macOS.

## Conclusion

The file-based Human-Agent Communication Interface transforms the traditional API-centric AI interaction model into a **document-centric conversation system** suited for local, zero-cost orchestration. By combining GitOps declarative state principles with HITL checkpoint patterns, the QHDE architecture gains a robust mechanism for handling the fundamental challenge of AI systems: knowing when to defer to human judgment.

The key insight from this research is that **effective human-agent interfaces need structured uncertainty expression**—not just binary "can/cannot do" but graduated confidence with clear decision options. The proposed protocol addresses this through YAML frontmatter metadata (`confidence_score`, `uncertainty_type`, `options`) combined with human-readable Markdown explanations.

For 도영's forensic science and e-commerce context, this system enables sophisticated analytical workflows where agents handle data processing and pattern detection autonomously, while classification decisions, threshold setting, and policy interpretations flow naturally to human review through the familiar interface of Markdown documents.