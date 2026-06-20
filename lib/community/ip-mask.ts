// IP 마스킹 + 해시 (R1 2026-05-23, T07)
// 익명 게시글의 작성자 IP 앞 2옥텟 표시 + 추천 dedup용 HMAC 해시
import crypto from "node:crypto";

const IP_HASH_SECRET = process.env.IP_HASH_SECRET ?? "default-secret-change-me";

export function extractClientIp(req: { headers: Headers } | Request): string {
  const headers = "headers" in req ? req.headers : new Headers();
  const xff = headers.get("x-forwarded-for") ?? "";
  const real = headers.get("x-real-ip") ?? "";
  // IP 미상 시 "0.0.0.0" 같은 고정 센티넬을 쓰면 hashIp가 모든 IP 미상 익명 사용자에게
  // 동일 해시를 만들어 신고/추천 dedup이 전역 공유된다(한 명 신고 시 나머지 전원 차단).
  // → 빈 문자열을 반환해 미들웨어가 해시 헤더를 주입하지 않게 하고, 라우트의 400 거부 가드가 작동하게 한다.
  const ip = (xff.split(",")[0] ?? "").trim() || real.trim() || "";
  return ip;
}

export function maskIp(ip: string): string {
  const parts = ip.split(".");
  if (parts.length !== 4) return "0.0.*.*";
  const [a, b] = parts;
  return `${a}.${b}.*.*`;
}

export function hashIp(ip: string): string {
  return crypto.createHmac("sha256", IP_HASH_SECRET).update(ip).digest("hex");
}
