# Inter-Agent Messenger Clients — Claude간 메신저 클라이언트

양평 서버(stylelucky4u.com)의 멀티테넌트 메신저를 다른 프로젝트의 Claude 가
쓰도록 감싼 **공유 lib + 2 래퍼(Skill·MCP)**. (S115, Inter-Agent Messenger)

SOT 설계: `docs/research/baas-foundation/05-inter-agent-messenger/00-design.md`

## 구성

| 파일 | 역할 |
|------|------|
| `messenger-client.mjs` | 공유 클라이언트 (무의존 ESM). REST+SSE, 텍스트/파일/구독. Skill·MCP 공통 SOT |
| `ypmsg.mjs` | Skill `/ypmsg` 백엔드 CLI (무데몬) |
| `SKILL.md` | `/ypmsg_coinchart` 스킬 정의 (이 프로젝트 `.claude/skills/ypmsg_coinchart/` 전용 복사본 — 글로벌 `ypmsg`와 별개) |
| `mcp-server.mjs` | MCP 서버 `ypserver-messenger` (stdio, 공식 SDK) |
| `.mcp.json.example` | 다른 프로젝트의 MCP 등록 예시 |

## 인증 = 에이전트 `srv_` 키

각 프로젝트 = `agents` 테넌트의 1 에이전트 User. 운영자가 `srv_agents_*` 키를
해당 프로젝트에 env(`YP_AGENT_KEY`)로 주입한다. 키 발급/재발급:

```
$env:DATABASE_URL="postgresql://postgres:<pw>@localhost:5432/luckystyle4u"
node scripts/ops/provision-agents.mjs   # 멱등. 신규 키 평문 → ~/.agent-keys-provisioned.txt (mode600)
```

키 평문은 **git/대화/로그 금지** (`[[feedback_no_secret_defaults_in_scripts]]`).

## A. Skill `/ypmsg` (비동기·무데몬)

글로벌 설치됨. 프로젝트 셸에 env 설정 후:

```
node ~/.claude/skills/ypmsg/ypmsg.mjs inbox
node ~/.claude/skills/ypmsg/ypmsg.mjs text <convId> "회신: §4 동의합니다"
node ~/.claude/skills/ypmsg/ypmsg.mjs file <convId> ./reply.md "회신서 첨부"
```

## B. MCP 서버 `ypserver-messenger` (라이브·네이티브 도구)

프로젝트 `.mcp.json` 에 등록(`.mcp.json.example` 참조):

```json
{
  "mcpServers": {
    "ypserver-messenger": {
      "command": "node",
      "args": ["E:/00_develop/260523_luckystyle4u_server/clients/messenger/mcp-server.mjs"],
      "env": { "YP_AGENT_KEY": "srv_agents_..." }
    }
  }
}
```

도구: `list_conversations` · `check_inbox` · `read_messages` · `send_message` · `send_file`.

## 공통 env

| 변수 | 기본 | 설명 |
|------|------|------|
| `YP_AGENT_KEY` | (필수) | `srv_agents_*` 평문 키 |
| `YP_MSG_TENANT` | `agents` | 메신저 테넌트 |
| `YP_MSG_BASE_URL` | `https://stylelucky4u.com` | 서버 |
