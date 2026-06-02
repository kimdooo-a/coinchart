#!/usr/bin/env node
/**
 * ypmsg.mjs — Claude간 메신저 CLI (Skill `/ypmsg` 백엔드, S115 Phase 2a).
 *
 * 공유 클라이언트(messenger-client.mjs)를 감싼 무데몬 CLI. 모든 프로젝트의
 * Claude 가 env 3개만 설정하면 양평 메신저로 송수신/파일전송 가능.
 *
 * 환경변수:
 *   YP_AGENT_KEY    (필수)  srv_agents_* 평문 키 — 운영자가 1:1 주입(git 금지)
 *   YP_MSG_TENANT   (옵션)  기본 "agents"
 *   YP_MSG_BASE_URL (옵션)  기본 "https://stylelucky4u.com"
 *
 * 사용:
 *   node ypmsg.mjs list                         # 참여 대화 목록(id/kind/title)
 *   node ypmsg.mjs inbox                         # 미읽음 있는 대화
 *   node ypmsg.mjs read <convId> [limit]         # 최근 메시지
 *   node ypmsg.mjs text <convId> <메시지...>     # 텍스트 송신
 *   node ypmsg.mjs file <convId> <path> [메시지] # 파일 전송
 *   node ypmsg.mjs watch <convId>                # SSE 실시간 구독(Ctrl+C 종료)
 *   node ypmsg.mjs markread <convId> <msgId>     # 읽음 처리
 */
import { createMessengerClient, MessengerError } from "./messenger-client.mjs";

function cfg() {
  const apiKey = process.env.YP_AGENT_KEY;
  if (!apiKey) {
    console.error("ERROR: YP_AGENT_KEY 미설정 (srv_agents_* 키를 env 로 주입하세요).");
    process.exit(2);
  }
  return createMessengerClient({
    baseUrl: process.env.YP_MSG_BASE_URL || "https://stylelucky4u.com",
    tenant: process.env.YP_MSG_TENANT || "agents",
    apiKey,
  });
}

function asList(convs) {
  return Array.isArray(convs) ? convs : (convs?.items ?? convs?.conversations ?? []);
}

function printMessages(msgs) {
  const list = Array.isArray(msgs) ? msgs : (msgs?.items ?? msgs?.messages ?? []);
  for (const m of list) {
    const who = m.senderId ?? m.sender ?? "·";
    const when = m.createdAt ?? "";
    const text = m.body ?? (m.kind && m.kind !== "TEXT" ? `[${m.kind}]` : "");
    console.log(`  ${when}  ${String(who).slice(0, 8)}  ${text}`);
  }
}

const [cmd, ...args] = process.argv.slice(2);

try {
  const mc = cfg();
  switch (cmd) {
    case "list": {
      const list = asList(await mc.listConversations());
      if (!list.length) { console.log("(참여 대화 없음)"); break; }
      for (const c of list) {
        const unread = c.unreadCount ?? c.unread ?? 0;
        console.log(`${c.id}\t${c.kind}\t${c.title ?? "(DIRECT)"}\t${unread ? `미읽음 ${unread}` : ""}`);
      }
      break;
    }
    case "inbox": {
      const unread = await mc.checkInbox();
      if (!unread.length) { console.log("(미읽음 없음)"); break; }
      for (const c of unread) {
        console.log(`${c.id}\t${c.kind}\t${c.title ?? "(DIRECT)"}\t미읽음 ${c.unreadCount ?? c.unread}`);
      }
      break;
    }
    case "read": {
      const [convId, limit] = args;
      if (!convId) throw new Error("read <convId> [limit]");
      printMessages(await mc.listMessages(convId, { limit: limit ? Number(limit) : 30 }));
      break;
    }
    case "text":
    case "send": {
      const [convId, ...rest] = args;
      if (!convId || !rest.length) throw new Error("text <convId> <메시지...>");
      const r = await mc.sendText(convId, rest.join(" "));
      console.log(`✔ 송신 messageId=${r?.message?.id ?? r?.id ?? "(ok)"}`);
      break;
    }
    case "file": {
      const [convId, filePath, ...rest] = args;
      if (!convId || !filePath) throw new Error("file <convId> <path> [메시지]");
      const r = await mc.sendFile(convId, { path: filePath, body: rest.length ? rest.join(" ") : null });
      console.log(`✔ 파일 송신 messageId=${r?.message?.id ?? r?.id ?? "(ok)"}`);
      break;
    }
    case "watch": {
      const [convId] = args;
      if (!convId) throw new Error("watch <convId>");
      console.log(`▶ ${convId} 구독 중 (Ctrl+C 종료)...`);
      for await (const ev of mc.subscribe(convId)) {
        console.log(`[${ev.event}]`, typeof ev.data === "string" ? ev.data : JSON.stringify(ev.data));
      }
      break;
    }
    case "markread": {
      const [convId, msgId] = args;
      if (!convId || !msgId) throw new Error("markread <convId> <msgId>");
      await mc.markRead(convId, msgId);
      console.log("✔ 읽음 처리");
      break;
    }
    default:
      console.error(
        `사용법: node ypmsg.mjs <list|inbox|read|text|file|watch|markread> ...\n` +
        `  env: YP_AGENT_KEY(필수), YP_MSG_TENANT(기본 agents), YP_MSG_BASE_URL(기본 https://stylelucky4u.com)`,
      );
      process.exit(1);
  }
} catch (e) {
  if (e instanceof MessengerError) {
    console.error(`✗ [${e.code}] ${e.message} (HTTP ${e.status})`);
  } else {
    console.error(`✗ ${e?.message ?? e}`);
  }
  process.exit(1);
}
