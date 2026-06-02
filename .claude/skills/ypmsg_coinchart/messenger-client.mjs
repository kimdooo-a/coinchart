/**
 * messenger-client.mjs — Claude간 메신저 공유 클라이언트 (S115, Phase 1).
 *
 * 무의존 ESM (Node 18+ 내장 fetch/crypto/ReadableStream 만 사용).
 * Skill `/ypmsg` 와 MCP server `ypserver-messenger` 가 **동일 파일을 import** 한다.
 *
 * 전송: ypserver messenger REST + SSE (`/api/v1/t/<tenant>/messenger/*`).
 * 인증: Bearer `srv_<tenant>_*` API 키 → K3 검증 → owner User 로 송신(Phase 0).
 *
 * 사용:
 *   import { createMessengerClient } from "./messenger-client.mjs";
 *   const mc = createMessengerClient({
 *     baseUrl: "https://stylelucky4u.com",
 *     tenant: "agents",
 *     apiKey: process.env.YP_AGENT_KEY,   // srv_agents_*  — env 로만 주입(git 금지)
 *   });
 *   const convs = await mc.listConversations();
 *   await mc.sendText(convId, "안녕하세요, 양평입니다");
 *   for await (const ev of mc.subscribe(convId)) console.log(ev.event, ev.data);
 *
 * SOT: docs/research/baas-foundation/05-inter-agent-messenger/00-design.md
 */
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";

/** 확장자 → MIME (서버 validateFile 화이트리스트와 정합한 일반 타입만). */
const EXT_MIME = {
  ".md": "text/markdown", ".markdown": "text/markdown", ".txt": "text/plain",
  ".csv": "text/csv", ".json": "application/json", ".yml": "application/x-yaml",
  ".yaml": "application/x-yaml", ".pdf": "application/pdf", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
  ".webp": "image/webp", ".svg": "image/svg+xml", ".zip": "application/zip",
};

export class MessengerError extends Error {
  constructor(code, message, status) {
    super(`[${code}] ${message}`);
    this.name = "MessengerError";
    this.code = code;
    this.status = status;
  }
}

/**
 * @param {object} opts
 * @param {string} opts.baseUrl  예) "https://stylelucky4u.com" | "http://localhost:3000"
 * @param {string} opts.tenant   메신저 테넌트 slug (예 "agents")
 * @param {string} opts.apiKey   srv_<tenant>_* 평문 키 (env 주입)
 * @param {typeof fetch} [opts.fetchImpl]  테스트 주입용
 */
export function createMessengerClient({ baseUrl, tenant, apiKey, fetchImpl }) {
  if (!baseUrl) throw new Error("baseUrl 필요");
  if (!tenant) throw new Error("tenant 필요");
  if (!apiKey) throw new Error("apiKey 필요 (env 주입, git 금지)");
  const doFetch = fetchImpl ?? globalThis.fetch;
  if (!doFetch) throw new Error("fetch 미지원 런타임 (Node 18+ 필요)");

  const base = `${baseUrl.replace(/\/$/, "")}/api/v1/t/${tenant}/messenger`;
  const authHeaders = {
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json",
  };

  /** REST 호출 — { success, data } 봉투 해제, 실패 시 MessengerError. */
  async function req(method, path, body) {
    const res = await doFetch(`${base}${path}`, {
      method,
      headers: authHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let json = null;
    try {
      json = await res.json();
    } catch {
      /* 비-JSON 응답 */
    }
    if (!res.ok || !json || json.success !== true) {
      const code = json?.error?.code ?? `HTTP_${res.status}`;
      const msg = json?.error?.message ?? res.statusText ?? "요청 실패";
      throw new MessengerError(code, msg, res.status);
    }
    return json.data;
  }

  return {
    /** 대화 목록 (참여 중). */
    listConversations() {
      return req("GET", "/conversations");
    },

    /** 새 대화 생성. kind=DIRECT|GROUP|CHANNEL, memberIds 포함. */
    createConversation({ kind, title, memberIds }) {
      return req("POST", "/conversations", { kind, title, memberIds });
    },

    /** 메시지 stream (keyset cursor, 기본 30/page). */
    listMessages(conversationId, { limit = 30, cursor, before, after } = {}) {
      const q = new URLSearchParams({ limit: String(limit) });
      if (cursor) q.set("cursor", cursor);
      if (before) q.set("before", before);
      if (after) q.set("after", after);
      return req("GET", `/conversations/${conversationId}/messages?${q}`);
    },

    /**
     * 메시지 송신. clientGeneratedId 미지정 시 자동 생성(오프라인 멱등).
     * TEXT 는 body 필수, IMAGE/FILE 은 attachments[{fileId,kind,displayOrder}] 필수.
     */
    sendMessage(conversationId, opts = {}) {
      const {
        body = null,
        kind = "TEXT",
        clientGeneratedId = randomUUID(),
        replyToId,
        attachments,
        mentions,
      } = opts;
      return req("POST", `/conversations/${conversationId}/messages`, {
        kind,
        body,
        clientGeneratedId,
        replyToId,
        attachments,
        mentions,
      });
    },

    /** 편의: 텍스트 한 줄 송신. */
    sendText(conversationId, text, extra = {}) {
      return this.sendMessage(conversationId, { kind: "TEXT", body: text, ...extra });
    },

    /** 읽음 처리 — 마지막 읽은 메시지 id 기록. */
    markRead(conversationId, lastReadMessageId) {
      return req("POST", `/conversations/${conversationId}/receipts`, {
        lastReadMessageId,
      });
    },

    /** 메시지 검색 (대화 횡단). */
    searchMessages(q, { limit = 30, cursor } = {}) {
      const qs = new URLSearchParams({ q, limit: String(limit) });
      if (cursor) qs.set("cursor", cursor);
      return req("GET", `/messages/search?${qs}`);
    },

    /**
     * 받은 편지함 — 참여 대화 중 미읽음이 있는 것만 추려 반환.
     * (listConversations 가 unreadCount/lastMessageAt 를 주는 형태에 의존;
     *  서버 응답 shape 에 맞춰 필터.)
     */
    async checkInbox() {
      const convs = await this.listConversations();
      const list = Array.isArray(convs) ? convs : (convs?.items ?? convs?.conversations ?? []);
      return list.filter((c) => (c.unreadCount ?? c.unread ?? 0) > 0);
    },

    /**
     * SSE 구독 — async iterator 로 이벤트 yield.
     * `for await (const ev of mc.subscribe(convId)) { ev.event, ev.data }`
     * @param {string} conversationId
     * @param {{ signal?: AbortSignal }} [opts]
     */
    async *subscribe(conversationId, { signal } = {}) {
      const res = await doFetch(`${base}/conversations/${conversationId}/events`, {
        method: "GET",
        headers: { authorization: `Bearer ${apiKey}`, accept: "text/event-stream" },
        signal,
      });
      if (!res.ok || !res.body) {
        throw new MessengerError(`HTTP_${res.status}`, "SSE 연결 실패", res.status);
      }
      const decoder = new TextDecoder();
      let buf = "";
      for await (const chunk of res.body) {
        buf += decoder.decode(chunk, { stream: true });
        let idx;
        // SSE 이벤트 구분자 = 빈 줄(\n\n).
        while ((idx = buf.indexOf("\n\n")) !== -1) {
          const raw = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          const ev = { event: "message", data: null };
          const dataLines = [];
          for (const line of raw.split("\n")) {
            if (line.startsWith("event:")) ev.event = line.slice(6).trim();
            else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
          }
          if (dataLines.length) {
            const joined = dataLines.join("\n");
            try {
              ev.data = JSON.parse(joined);
            } catch {
              ev.data = joined;
            }
          }
          if (ev.event !== "ping") yield ev;
        }
      }
    },

    /**
     * 파일 전송 — Phase 1.5 (S115). 첨부 업로드 라우트 → FILE/IMAGE 메시지 2단계.
     *
     * @param {string} conversationId
     * @param {object} opts
     * @param {string} [opts.path]         로컬 파일 경로 (지정 시 자동 read)
     * @param {Uint8Array|Buffer} [opts.data]  path 대신 직접 바이트 주입
     * @param {string} [opts.fileName]     파일명 (path 미지정 시 필수)
     * @param {string} [opts.contentType]  MIME (미지정 시 확장자 추론)
     * @param {string} [opts.body]         첨부에 동반할 텍스트 (옵션)
     * @returns {Promise<object>} sendMessage 결과 (생성된 메시지)
     */
    async sendFile(conversationId, opts = {}) {
      let { path: filePath, data, fileName, contentType, body = null } = opts;
      if (filePath) {
        data = await readFile(filePath);
        fileName = fileName ?? basename(filePath);
      }
      if (!data) throw new Error("sendFile: path 또는 data 필요");
      if (!fileName) throw new Error("sendFile: fileName 필요");
      contentType = contentType ?? EXT_MIME[extname(fileName).toLowerCase()] ?? "application/octet-stream";

      // 1. 첨부 업로드 → fileId
      const fd = new FormData();
      fd.append("file", new Blob([data], { type: contentType }), fileName);
      const upRes = await doFetch(`${base}/attachments`, {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}` }, // content-type 은 FormData 가 boundary 와 함께 자동 설정
        body: fd,
      });
      let upJson = null;
      try { upJson = await upRes.json(); } catch { /* 비-JSON */ }
      if (!upRes.ok || upJson?.success !== true) {
        const code = upJson?.error?.code ?? `HTTP_${upRes.status}`;
        const msg = upJson?.error?.message ?? "첨부 업로드 실패";
        throw new MessengerError(code, msg, upRes.status);
      }
      const { fileId, kind } = upJson.data;

      // 2. FILE/IMAGE 메시지 송신
      return this.sendMessage(conversationId, {
        kind: kind === "IMAGE" ? "IMAGE" : "FILE",
        body,
        attachments: [{ fileId, kind, displayOrder: 0 }],
      });
    },
  };
}
