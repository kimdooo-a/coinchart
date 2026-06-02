#!/usr/bin/env node
/**
 * mcp-server.mjs — ypserver-messenger MCP 서버 (S115 Phase 2b).
 *
 * 양평 메신저를 MCP 도구로 노출 → 다른 프로젝트의 Claude 가 루프 내에서
 * send_message / check_inbox / send_file 등을 native tool 로 호출.
 * 공유 클라이언트(messenger-client.mjs)를 재사용한다.
 *
 * 등록 (.mcp.json):
 *   {
 *     "mcpServers": {
 *       "ypserver-messenger": {
 *         "command": "node",
 *         "args": ["E:/00_develop/260523_luckystyle4u_server/clients/messenger/mcp-server.mjs"],
 *         "env": { "YP_AGENT_KEY": "srv_agents_..." }
 *       }
 *     }
 *   }
 *
 * env: YP_AGENT_KEY(필수), YP_MSG_TENANT(기본 agents), YP_MSG_BASE_URL(기본 https://stylelucky4u.com)
 *
 * node 모듈 해석은 본 스크립트 위치 기준 → repo node_modules 의 @modelcontextprotocol/sdk 사용.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createMessengerClient } from "./messenger-client.mjs";

/** 키 미설정 시 startup crash 대신 도구 호출 시점에 명확한 에러. */
let _mc = null;
function client() {
  if (_mc) return _mc;
  const apiKey = process.env.YP_AGENT_KEY;
  if (!apiKey) throw new Error("YP_AGENT_KEY 미설정 — 운영자에게 srv_agents_* 키 주입을 요청하세요.");
  _mc = createMessengerClient({
    baseUrl: process.env.YP_MSG_BASE_URL || "https://stylelucky4u.com",
    tenant: process.env.YP_MSG_TENANT || "agents",
    apiKey,
  });
  return _mc;
}

const TOOLS = [
  {
    name: "list_conversations",
    description: "참여 중인 대화 목록(convId/kind/title/미읽음)을 반환한다.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "check_inbox",
    description: "미읽음 메시지가 있는 대화만 반환한다. 회신 확인의 시작점.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "read_messages",
    description: "특정 대화의 최근 메시지를 반환한다.",
    inputSchema: {
      type: "object",
      properties: {
        conversationId: { type: "string", description: "대화 ID" },
        limit: { type: "number", description: "개수(기본 30)" },
      },
      required: ["conversationId"],
      additionalProperties: false,
    },
  },
  {
    name: "send_message",
    description: "대화에 텍스트 메시지를 송신한다. 송신자는 키 소유 에이전트로 자동 기록.",
    inputSchema: {
      type: "object",
      properties: {
        conversationId: { type: "string", description: "대화 ID" },
        text: { type: "string", description: "본문(1~5000자)" },
      },
      required: ["conversationId", "text"],
      additionalProperties: false,
    },
  },
  {
    name: "send_file",
    description: "대화에 파일을 전송한다(로컬 경로). 실행 파일은 서버에서 차단됨.",
    inputSchema: {
      type: "object",
      properties: {
        conversationId: { type: "string", description: "대화 ID" },
        path: { type: "string", description: "로컬 파일 경로" },
        body: { type: "string", description: "동반 텍스트(옵션)" },
      },
      required: ["conversationId", "path"],
      additionalProperties: false,
    },
  },
];

async function dispatch(name, args = {}) {
  const mc = client();
  switch (name) {
    case "list_conversations":
      return mc.listConversations();
    case "check_inbox":
      return mc.checkInbox();
    case "read_messages":
      return mc.listMessages(args.conversationId, { limit: args.limit ?? 30 });
    case "send_message":
      return mc.sendText(args.conversationId, args.text);
    case "send_file":
      return mc.sendFile(args.conversationId, { path: args.path, body: args.body ?? null });
    default:
      throw new Error(`알 수 없는 도구: ${name}`);
  }
}

export function buildServer() {
  const server = new Server(
    { name: "ypserver-messenger", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    try {
      const result = await dispatch(name, args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e) {
      return {
        content: [{ type: "text", text: `✗ ${e?.code ? `[${e.code}] ` : ""}${e?.message ?? e}` }],
        isError: true,
      };
    }
  });
  return server;
}

// main 으로 실행될 때만 stdio 연결 (import 시엔 연결 안 함 → 스모크 테스트 가능).
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`;
if (isMain) {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr 로만 로그(stdout 은 JSON-RPC 전용).
  process.stderr.write("ypserver-messenger MCP 서버 시작 (stdio)\n");
}
