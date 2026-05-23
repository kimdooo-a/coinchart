// IP 마스킹 + 해시 (R1 2026-05-23, T07)
// 익명 게시글의 작성자 IP 앞 2옥텟 표시 + 추천 dedup용 HMAC 해시
import crypto from "node:crypto";

const IP_HASH_SECRET = process.env.IP_HASH_SECRET ?? "default-secret-change-me";

export function extractClientIp(req: { headers: Headers } | Request): string {
  const headers = "headers" in req ? req.headers : new Headers();
  const xff = headers.get("x-forwarded-for") ?? "";
  const real = headers.get("x-real-ip") ?? "";
  const ip = (xff.split(",")[0] ?? "").trim() || real || "0.0.0.0";
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
