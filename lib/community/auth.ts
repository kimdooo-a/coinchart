// 익명 게스트 작성용 인증 헬퍼 (R1 2026-05-23, T07)
// bcrypt 기반 비밀번호 해시/검증 + 닉네임 검증
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashGuestPassword(plain: string): Promise<string> {
  if (!plain || plain.length < 4) throw new Error("password must be at least 4 chars");
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyGuestPassword(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}

export function validateGuestNickname(nickname: string): { ok: boolean; reason?: string } {
  if (!nickname) return { ok: false, reason: "닉네임 필수" };
  if (nickname.length < 2 || nickname.length > 12) return { ok: false, reason: "닉네임 2~12자" };
  return { ok: true };
}
